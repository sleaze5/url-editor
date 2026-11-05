import { resolve } from "node:path"

import solid from "@solidjs/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"

import pkg from "./package.json" with { type: "json" }
import { type Browser, createManifest } from "./src/build/manifest.ts"
import { minifyDist } from "./src/build/minify.ts"

const browser: Browser = process.env["BROWSER"] === "firefox" ? "firefox" : "chrome"
const target = browser === "firefox" ? "firefox128" : "chrome120"
const root = import.meta.dirname

function manifestPlugin(): Plugin {
	return {
		name: "extension-manifest",
		apply: "build",
		generateBundle() {
			this.emitFile({
				type: "asset",
				fileName: "manifest.json",
				source: `${JSON.stringify(createManifest(browser, pkg.version), null, "\t")}\n`,
			})
		},
	}
}

export default defineConfig(({ mode }) => {
	const production = mode === "production"
	return {
		root: resolve(root, "src/popup"),
		base: "./",
		publicDir: resolve(root, "src/assets"),
		plugins: [tailwindcss(), solid(), manifestPlugin(), production && minifyDist()],
		css: { transformer: "lightningcss" },
		build: {
			outDir: resolve(root, "dist", `${pkg.name}-${browser}`),
			emptyOutDir: true,
			target,
			cssTarget: target,
			modulePreload: { polyfill: false },
			minify: production && "oxc",
			cssMinify: production && "lightningcss",
			sourcemap: production ? false : "inline",
			reportCompressedSize: false,
			rolldownOptions: {
				output: { comments: false },
			},
		},
		server: { host: "127.0.0.1", port: 5173, strictPort: true },
	}
})

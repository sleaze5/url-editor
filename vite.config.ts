import { resolve } from "node:path"

import { svelte } from "@sveltejs/vite-plugin-svelte"
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
		plugins: [
			svelte({ configFile: resolve(root, "svelte.config.js") }),
			manifestPlugin(),
			production && minifyDist(target),
		],
		build: {
			outDir: resolve(root, "dist", `${pkg.name}-${browser}`),
			emptyOutDir: true,
			target,
			cssTarget: target,
			modulePreload: false,
			minify: production && "oxc",
			cssMinify: production && "lightningcss",
			sourcemap: production ? false : "inline",
			reportCompressedSize: false,
			rolldownOptions: {
				output: { comments: false },
			},
		},
	}
})

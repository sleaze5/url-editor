import { resolve } from "node:path"

import solid from "@solidjs/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"

import packageJson from "./package.json" with { type: "json" }
import {
	type Browser,
	createManifest,
	MIN_BROWSER_VERSION,
} from "./src/build/manifest.ts"
import { minifyDist } from "./src/build/minify.ts"

const browser: Browser = process.env["BROWSER"] === "firefox" ? "firefox" : "chrome"
const buildTarget = `${browser}${MIN_BROWSER_VERSION[browser]}`
const projectRoot = import.meta.dirname

function manifestPlugin(): Plugin {
	return {
		name: "extension-manifest",
		apply: "build",
		generateBundle() {
			this.emitFile({
				type: "asset",
				fileName: "manifest.json",
				source: `${JSON.stringify(createManifest(browser, packageJson), null, "\t")}\n`,
			})
		},
	}
}

export default defineConfig(({ mode }) => {
	const isProduction = mode === "production"
	return {
		root: resolve(projectRoot, "src/popup"),
		base: "./",
		publicDir: resolve(projectRoot, "src/assets"),
		plugins: [
			tailwindcss(),
			solid(),
			manifestPlugin(),
			isProduction && minifyDist(),
		],
		css: { transformer: "lightningcss" },
		build: {
			outDir: resolve(projectRoot, "dist", `${packageJson.name}-${browser}`),
			emptyOutDir: true,
			target: buildTarget,
			cssTarget: buildTarget,
			modulePreload: { polyfill: false },
			minify: isProduction && "oxc",
			cssMinify: isProduction && "lightningcss",
			sourcemap: isProduction ? false : "inline",
			reportCompressedSize: false,
			rolldownOptions: {
				output: { comments: false },
			},
		},
		server: { host: "127.0.0.1", port: 5173, strictPort: true },
	}
})

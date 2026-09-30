import { readdir, readFile, writeFile } from "node:fs/promises"
import { extname, join } from "node:path"

import { minifySync } from "oxc-minify"
import type { Plugin } from "vite"

type Minifier = (file: string, source: string) => string

function minifyScript(target: string): Minifier {
	return (file, source) => {
		const result = minifySync(file, source, {
			module: true,
			compress: { target, dropConsole: true, dropDebugger: true },
			mangle: { toplevel: true },
			codegen: { removeWhitespace: true, legalComments: "none" },
		})
		const [error] = result.errors
		if (error) throw new Error(`${file}: ${error.message}`)
		return result.code
	}
}

const minifyMarkup: Minifier = (_, source) =>
	source
		.replaceAll(/<!--[\s\S]*?-->/gu, "")
		.replaceAll(/>\s+</gu, "><")
		.trim()

const minifyJson: Minifier = (_, source) => JSON.stringify(JSON.parse(source))

async function listFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { recursive: true, withFileTypes: true })
	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => join(entry.parentPath, entry.name))
}

export function minifyDist(target: string): Plugin {
	const minifiers: Record<string, Minifier> = {
		".js": minifyScript(target),
		".html": minifyMarkup,
		".svg": minifyMarkup,
		".json": minifyJson,
	}
	let outDir = ""
	return {
		name: "minify-dist",
		apply: "build",
		configResolved(config) {
			outDir = config.build.outDir
		},
		async closeBundle() {
			const files = await listFiles(outDir)
			await Promise.all(
				files.map(async (file) => {
					const minify = minifiers[extname(file)]
					if (!minify) return
					await writeFile(file, minify(file, await readFile(file, "utf8")))
				}),
			)
		},
	}
}

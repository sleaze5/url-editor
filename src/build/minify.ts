import { readdir } from "node:fs/promises"
import { extname, join } from "node:path"

import type { Plugin } from "vite"

type Minifier = (source: string) => string

const minifyMarkup: Minifier = (source) =>
	source
		.replaceAll(/<!--[\s\S]*?-->/gu, "")
		.replaceAll(/>\s+</gu, "><")
		.trim()

const minifyJson: Minifier = (source) => JSON.stringify(JSON.parse(source))

const MINIFIERS: Record<string, Minifier> = {
	".html": minifyMarkup,
	".svg": minifyMarkup,
	".json": minifyJson,
}

async function listFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { recursive: true, withFileTypes: true })
	return entries
		.filter((entry) => entry.isFile())
		.map((entry) => join(entry.parentPath, entry.name))
}

export function minifyDist(): Plugin {
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
				files.map(async (path) => {
					const minify = MINIFIERS[extname(path)]
					if (!minify) return
					const file = Bun.file(path)
					await Bun.write(path, minify(await file.text()))
				}),
			)
		},
	}
}

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

const MINIFIER_BY_EXTENSION: Record<string, Minifier> = {
	".html": minifyMarkup,
	".svg": minifyMarkup,
	".json": minifyJson,
}

async function listFilesRecursively(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { recursive: true, withFileTypes: true })
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
			const builtFiles = await listFilesRecursively(outDir)
			await Promise.all(
				builtFiles.map(async (filePath) => {
					const minifyFile = MINIFIER_BY_EXTENSION[extname(filePath)]
					if (!minifyFile) return
					const builtFile = Bun.file(filePath)
					await Bun.write(filePath, minifyFile(await builtFile.text()))
				}),
			)
		},
	}
}

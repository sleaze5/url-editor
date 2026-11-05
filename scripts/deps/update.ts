import { join } from "node:path"
import { parseArgs } from "node:util"

import { skippedPackages } from "./dependabot.ts"
import { fetchVersions } from "./npm-versions.ts"
import { safeUpgrade } from "./semver.ts"

interface PackageJson {
	dependencies?: Record<string, string>
	devDependencies?: Record<string, string>
	devEngines?: { packageManager?: { name: string; version: string } }
}

interface Change {
	label: string
	from: string
	to: string
}

const rootDir = join(import.meta.dir, "..", "..")

function isPackageJson(value: unknown): value is PackageJson {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function readManifest(path: string): Promise<PackageJson> {
	const value: unknown = await Bun.file(path).json()
	if (!isPackageJson(value)) throw new Error(`${path} is not a package.json object.`)
	return value
}

const { values } = parseArgs({
	options: {
		all: { type: "boolean", default: false },
		uncovered: { type: "boolean", default: false },
	},
})
if (values.all && values.uncovered) {
	throw new Error("Pass either --all or --uncovered, not both.")
}

const skipped = values.uncovered
	? skippedPackages(await Bun.file(join(rootDir, ".github/dependabot.yml")).text())
	: undefined
const packagePath = join(rootDir, "package.json")
const manifest = await readManifest(packagePath)
const changes: Change[] = []

async function upgrade(name: string, current: string): Promise<Change | undefined> {
	const next = safeUpgrade(current, await fetchVersions(name))
	return next === undefined ? undefined : { label: name, from: current, to: next }
}

async function upgradeSection(
	section: Record<string, string> | undefined,
): Promise<void> {
	if (section === undefined) return
	const names = Object.keys(section).filter((name) => skipped?.has(name) ?? true)
	const results = await Promise.all(
		names.map((name) => upgrade(name, section[name] ?? "")),
	)
	for (const change of results) {
		if (change === undefined) continue
		changes.push(change)
		section[change.label] = change.to
	}
}

async function upgradePackageManager(): Promise<void> {
	const packageManager = manifest.devEngines?.packageManager
	if (packageManager === undefined) return
	const change = await upgrade(packageManager.name, packageManager.version)
	if (change === undefined) return
	changes.push(change)
	packageManager.version = change.to
}

await upgradeSection(manifest.dependencies)
await upgradeSection(manifest.devDependencies)
await upgradePackageManager()

if (changes.length > 0) {
	await Bun.write(packagePath, `${JSON.stringify(manifest, null, "\t")}\n`)
}

const lines = changes.map(
	(change) => `- \`${change.label}\` ${change.from} → ${change.to}`,
)
const count = changes.length === 1 ? "1 dependency" : `${changes.length} dependencies`
console.log(
	changes.length === 0 ? "Every dependency is up to date." : `Updated ${count}.`,
)
console.log(lines.join("\n"))

const summaryFile = process.env["DEPS_SUMMARY_FILE"]
if (summaryFile !== undefined && summaryFile !== "") {
	await Bun.write(summaryFile, `${lines.join("\n")}\n`)
}

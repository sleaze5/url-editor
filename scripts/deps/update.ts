import { join } from "node:path"
import { parseArgs } from "node:util"

import { fetchReleasedVersions } from "./npm-versions.ts"
import { latestUpgrade } from "./semver.ts"

interface PackageJson {
	dependencies?: Record<string, string>
	devDependencies?: Record<string, string>
	devEngines?: { packageManager?: { name: string; version: string } }
}

interface Change {
	packageName: string
	from: string
	to: string
}

const repositoryRoot = join(import.meta.dir, "..", "..")

const { values: options } = parseArgs({
	options: { "min-age-days": { type: "string", default: "7" } },
})
const minAgeDays = Number(options["min-age-days"])
if (!Number.isFinite(minAgeDays) || minAgeDays < 0) {
	throw new Error("--min-age-days takes a number of days.")
}

function isPackageJson(value: unknown): value is PackageJson {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

async function readPackageJson(path: string): Promise<PackageJson> {
	const parsedJson: unknown = await Bun.file(path).json()
	if (!isPackageJson(parsedJson))
		throw new Error(`${path} is not a package.json object.`)
	return parsedJson
}

const packageJsonPath = join(repositoryRoot, "package.json")
const packageJson = await readPackageJson(packageJsonPath)
const changes: Change[] = []

async function findUpgrade(
	packageName: string,
	currentVersion: string,
): Promise<Change | undefined> {
	const newVersion = latestUpgrade(
		currentVersion,
		await fetchReleasedVersions(packageName, minAgeDays),
	)
	return newVersion === undefined
		? undefined
		: { packageName, from: currentVersion, to: newVersion }
}

async function upgradeDependencies(
	dependencies: Record<string, string> | undefined,
): Promise<void> {
	if (dependencies === undefined) return
	const upgrades = await Promise.all(
		Object.entries(dependencies).map(([packageName, version]) =>
			findUpgrade(packageName, version),
		),
	)
	for (const change of upgrades) {
		if (change === undefined) continue
		changes.push(change)
		dependencies[change.packageName] = change.to
	}
}

async function upgradePackageManager(): Promise<void> {
	const packageManager = packageJson.devEngines?.packageManager
	if (packageManager === undefined) return
	const change = await findUpgrade(packageManager.name, packageManager.version)
	if (change === undefined) return
	changes.push(change)
	packageManager.version = change.to
}

await upgradeDependencies(packageJson.dependencies)
await upgradeDependencies(packageJson.devDependencies)
await upgradePackageManager()

if (changes.length > 0) {
	await Bun.write(packageJsonPath, `${JSON.stringify(packageJson, null, "\t")}\n`)
}

const changeLines = changes.map(
	(change) => `- \`${change.packageName}\` ${change.from} → ${change.to}`,
)
const dependencyCount =
	changes.length === 1 ? "1 dependency" : `${changes.length} dependencies`
console.log(
	changes.length === 0
		? "Every dependency is up to date."
		: `Updated ${dependencyCount}.`,
)
console.log(changeLines.join("\n"))

const summaryFile = process.env["DEPS_SUMMARY_FILE"]
if (summaryFile !== undefined && summaryFile !== "") {
	await Bun.write(summaryFile, `${changeLines.join("\n")}\n`)
}

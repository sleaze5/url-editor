interface Version {
	major: number
	minor: number
	patch: number
	prerelease: string | undefined
}

interface Prerelease {
	tag: string
	number: number
}

const VERSION = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/u
const PRERELEASE = /^([A-Za-z-]+)\.(\d+)$/u

function parseVersion(text: string): Version | undefined {
	const match = VERSION.exec(text)
	if (match === null) return undefined
	const [, major, minor, patch, prerelease] = match
	return {
		major: Number(major),
		minor: Number(minor),
		patch: Number(patch),
		prerelease,
	}
}

function compareStable(firstVersion: Version, secondVersion: Version): number {
	return (
		firstVersion.major - secondVersion.major ||
		firstVersion.minor - secondVersion.minor ||
		firstVersion.patch - secondVersion.patch
	)
}

function parsePrerelease(text: string | undefined): Prerelease | undefined {
	const match = PRERELEASE.exec(text ?? "")
	if (match === null) return undefined
	const [, tag = "", number] = match
	return { tag, number: Number(number) }
}

function newestStable(
	candidates: string[],
	isAcceptable: (version: Version) => boolean,
): string | undefined {
	let newest: { versionText: string; version: Version } | undefined
	for (const versionText of candidates) {
		const version = parseVersion(versionText)
		if (version === undefined || version.prerelease !== undefined) continue
		if (!isAcceptable(version)) continue
		if (newest === undefined || compareStable(version, newest.version) > 0) {
			newest = { versionText, version }
		}
	}
	return newest?.versionText
}

function isNewerOnSameLine(
	versionText: string,
	currentVersion: Version,
	newestPrerelease: Prerelease,
): boolean {
	const version = parseVersion(versionText)
	if (version === undefined || compareStable(version, currentVersion) !== 0) {
		return false
	}
	const prerelease = parsePrerelease(version.prerelease)
	return (
		prerelease?.tag === newestPrerelease.tag &&
		prerelease.number > newestPrerelease.number
	)
}

function newestOnSamePrereleaseLine(
	currentVersion: Version,
	candidates: string[],
): string | undefined {
	const currentPrerelease = parsePrerelease(currentVersion.prerelease)
	if (currentPrerelease === undefined) return undefined
	let newestPrerelease = currentPrerelease
	let newestText: string | undefined
	for (const versionText of candidates) {
		if (!isNewerOnSameLine(versionText, currentVersion, newestPrerelease)) continue
		newestPrerelease =
			parsePrerelease(parseVersion(versionText)?.prerelease) ?? newestPrerelease
		newestText = versionText
	}
	return newestText
}

export function latestUpgrade(
	currentVersionText: string,
	candidates: string[],
): string | undefined {
	const currentVersion = parseVersion(currentVersionText)
	if (currentVersion === undefined) return undefined
	if (currentVersion.prerelease === undefined) {
		return newestStable(
			candidates,
			(version) => compareStable(version, currentVersion) > 0,
		)
	}
	return (
		newestStable(
			candidates,
			(version) => compareStable(version, currentVersion) >= 0,
		) ?? newestOnSamePrereleaseLine(currentVersion, candidates)
	)
}

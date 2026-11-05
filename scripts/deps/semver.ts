export interface Version {
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

export function parseVersion(text: string): Version | undefined {
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

function compareStable(a: Version, b: Version): number {
	return a.major - b.major || a.minor - b.minor || a.patch - b.patch
}

function parsePrerelease(text: string | undefined): Prerelease | undefined {
	const match = PRERELEASE.exec(text ?? "")
	if (match === null) return undefined
	const [, tag = "", number] = match
	return { tag, number: Number(number) }
}

function newestStable(candidates: string[], atLeast: (version: Version) => boolean) {
	let best: { text: string; version: Version } | undefined
	for (const text of candidates) {
		const version = parseVersion(text)
		if (version === undefined || version.prerelease !== undefined) continue
		if (!atLeast(version)) continue
		if (best === undefined || compareStable(version, best.version) > 0) {
			best = { text, version }
		}
	}
	return best?.text
}

function isNewerOnLine(text: string, from: Version, best: Prerelease): boolean {
	const version = parseVersion(text)
	if (version === undefined || compareStable(version, from) !== 0) return false
	const candidate = parsePrerelease(version.prerelease)
	return candidate?.tag === best.tag && candidate.number > best.number
}

function newestOnLine(from: Version, candidates: string[]): string | undefined {
	const line = parsePrerelease(from.prerelease)
	if (line === undefined) return undefined
	let best = line
	let bestText: string | undefined
	for (const text of candidates) {
		if (!isNewerOnLine(text, from, best)) continue
		best = parsePrerelease(parseVersion(text)?.prerelease) ?? best
		bestText = text
	}
	return bestText
}

export function latestUpgrade(
	current: string,
	candidates: string[],
): string | undefined {
	const from = parseVersion(current)
	if (from === undefined) return undefined
	if (from.prerelease === undefined) {
		return newestStable(candidates, (version) => compareStable(version, from) > 0)
	}
	return (
		newestStable(candidates, (version) => compareStable(version, from) >= 0) ??
		newestOnLine(from, candidates)
	)
}

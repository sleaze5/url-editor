interface Packument {
	versions: Record<string, { deprecated?: string }>
	time: Record<string, string>
}

const MS_PER_DAY = 86_400_000

function isPackument(value: unknown): value is Packument {
	return (
		typeof value === "object" &&
		value !== null &&
		"versions" in value &&
		typeof value.versions === "object" &&
		value.versions !== null &&
		"time" in value &&
		typeof value.time === "object" &&
		value.time !== null
	)
}

export async function fetchReleasedVersions(
	packageName: string,
	minAgeDays: number,
): Promise<string[]> {
	const url = `https://registry.npmjs.org/${packageName.replace("/", "%2f")}`
	const response = await fetch(url)
	if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
	const packument: unknown = await response.json()
	if (!isPackument(packument)) throw new Error(`${url} returned no versions.`)
	const latestAllowedPublishTime = Date.now() - minAgeDays * MS_PER_DAY
	return Object.entries(packument.versions)
		.filter(([, metadata]) => metadata.deprecated === undefined)
		.map(([version]) => version)
		.filter(
			(version) =>
				Date.parse(packument.time[version] ?? "") <= latestAllowedPublishTime,
		)
}

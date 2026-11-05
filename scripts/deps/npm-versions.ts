interface Packument {
	versions: Record<string, { deprecated?: string }>
	time: Record<string, string>
}

const DAY_MS = 86_400_000

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

export async function fetchVersions(
	name: string,
	minAgeDays: number,
): Promise<string[]> {
	const url = `https://registry.npmjs.org/${name.replace("/", "%2f")}`
	const response = await fetch(url)
	if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
	const body: unknown = await response.json()
	if (!isPackument(body)) throw new Error(`${url} returned no versions.`)
	const newest = Date.now() - minAgeDays * DAY_MS
	return Object.entries(body.versions)
		.filter(([, metadata]) => metadata.deprecated === undefined)
		.map(([version]) => version)
		.filter((version) => Date.parse(body.time[version] ?? "") <= newest)
}

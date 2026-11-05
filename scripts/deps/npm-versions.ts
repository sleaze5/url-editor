interface Packument {
	versions: Record<string, { deprecated?: string }>
}

function isPackument(value: unknown): value is Packument {
	return (
		typeof value === "object" &&
		value !== null &&
		"versions" in value &&
		typeof value.versions === "object" &&
		value.versions !== null
	)
}

export async function fetchVersions(name: string): Promise<string[]> {
	const url = `https://registry.npmjs.org/${name.replace("/", "%2f")}`
	const response = await fetch(url, {
		headers: { Accept: "application/vnd.npm.install-v1+json" },
	})
	if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
	const body: unknown = await response.json()
	if (!isPackument(body)) throw new Error(`${url} returned no versions.`)
	const { versions } = body
	return Object.entries(versions)
		.filter(([, metadata]) => metadata.deprecated === undefined)
		.map(([version]) => version)
}

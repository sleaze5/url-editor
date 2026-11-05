interface IgnoreRule {
	"dependency-name": string
	"update-types"?: string[]
	"versions"?: string[]
}

interface DependabotConfig {
	updates: { "package-ecosystem": string; "ignore"?: IgnoreRule[] }[]
}

function isConfig(value: unknown): value is DependabotConfig {
	return (
		typeof value === "object" &&
		value !== null &&
		"updates" in value &&
		Array.isArray(value.updates)
	)
}

export function skippedPackages(yaml: string): Set<string> {
	const config: unknown = Bun.YAML.parse(yaml)
	if (!isConfig(config)) throw new Error("dependabot.yml has no updates list.")
	const rules =
		config.updates.find((update) => update["package-ecosystem"] === "bun")
			?.ignore ?? []
	return new Set(
		rules
			.filter(
				(rule) =>
					rule["update-types"] === undefined && rule.versions === undefined,
			)
			.map((rule) => rule["dependency-name"]),
	)
}

import { describe, expect, test } from "bun:test"

import { skippedPackages } from "./dependabot.ts"

describe("Dependabot coverage", () => {
	test("skips only the Bun packages that Dependabot ignores entirely", () => {
		const skipped = skippedPackages(`
updates:
    - package-ecosystem: github-actions
      ignore:
          - dependency-name: actions/checkout
    - package-ecosystem: bun
      ignore:
          - dependency-name: "*"
            update-types:
                - version-update:semver-major
          - dependency-name: terser
            versions:
                - 6.x
          - dependency-name: solid-js
`)
		expect([...skipped]).toEqual(["solid-js"])
	})

	test("skips nothing without a Bun entry", () => {
		expect(skippedPackages("updates: []").size).toBe(0)
	})

	test("leaves the prerelease Solid packages to the custom updater", async () => {
		const yaml = await Bun.file(
			new URL("../../.github/dependabot.yml", import.meta.url),
		).text()
		expect([...skippedPackages(yaml)].toSorted()).toEqual([
			"@solidjs/vite-plugin",
			"@solidjs/web",
			"solid-js",
		])
	})
})

import { describe, expect, test } from "bun:test"

import { latestUpgrade } from "./semver.ts"

describe("latest upgrades", () => {
	test("picks the newest stable version, across major versions", () => {
		expect(
			latestUpgrade("4.9.1", [
				"4.9.0",
				"4.9.2",
				"4.10.0",
				"5.0.0",
				"6.0.0-beta.1",
			]),
		).toBe("5.0.0")
	})

	test("takes minor and patch versions", () => {
		expect(latestUpgrade("0.18.1", ["0.18.3", "0.19.0"])).toBe("0.19.0")
		expect(latestUpgrade("1.2.3", ["1.2.4"])).toBe("1.2.4")
	})

	test("leaves up-to-date versions alone", () => {
		expect(latestUpgrade("2.0.0", ["1.9.9", "2.0.0", "2.1.0-rc.1"])).toBeUndefined()
	})

	test("never moves a stable version to a prerelease", () => {
		expect(latestUpgrade("1.3.0", ["1.4.0-rc.1", "2.0.0-beta.3"])).toBeUndefined()
	})

	test("moves a prerelease along its own line", () => {
		expect(
			latestUpgrade("2.0.0-rc.15", [
				"2.0.0-rc.9",
				"2.0.0-rc.16",
				"2.0.0-beta.20",
				"2.1.0-rc.1",
				"1.9.0",
			]),
		).toBe("2.0.0-rc.16")
		expect(latestUpgrade("3.0.0-next.50", ["3.0.0-next.51", "3.0.0-next.49"])).toBe(
			"3.0.0-next.51",
		)
		expect(
			latestUpgrade("2.0.0-rc.16", ["2.0.0-rc.16", "2.0.0-rc.2"]),
		).toBeUndefined()
	})

	test("moves a prerelease to the newest stable release once one exists", () => {
		expect(latestUpgrade("2.0.0-rc.15", ["2.0.0-rc.16", "2.0.0", "2.0.1"])).toBe(
			"2.0.1",
		)
		expect(latestUpgrade("2.0.0-rc.15", ["3.1.0", "2.0.0"])).toBe("3.1.0")
	})
})

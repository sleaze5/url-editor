import { describe, expect, test } from "bun:test"

import { appendToHistory, type HistoryCause } from "./entries.ts"
import {
	changeTypeOfEntry,
	countEntriesByFilter,
	isEntryShownByFilter,
} from "./filters.ts"

const CAUSES: readonly HistoryCause[] = [
	"opened-from-editor",
	"server-redirect",
	"client-redirect",
	"link",
	"reload",
	"fragment",
	"original",
]

const history = appendToHistory(
	[],
	CAUSES.map((cause) => ({
		href: "https://a.com/",
		cause,
		redirectStatus: null,
		editedFromEntryNumber: null,
		recordedAt: 0,
	})),
)

const causesShownBy = (filter: Parameters<typeof isEntryShownByFilter>[1]) =>
	history
		.filter((entry) => isEntryShownByFilter(entry, filter))
		.map((entry) => entry.cause)

describe("history filters", () => {
	test("show the entries of their type", () => {
		expect(causesShownBy("editor")).toEqual(["opened-from-editor"])
		expect(causesShownBy("redirects")).toEqual([
			"server-redirect",
			"client-redirect",
		])
		expect(causesShownBy("navigations")).toEqual(["link", "reload"])
		expect(causesShownBy("in-page")).toEqual(["fragment"])
	})

	test("show markers such as turning the watcher on only under all", () => {
		expect(causesShownBy("all")).toEqual([...CAUSES])
	})

	test("count the entries of each type", () => {
		expect(countEntriesByFilter(history)).toEqual({
			"all": 7,
			"editor": 1,
			"redirects": 2,
			"navigations": 2,
			"in-page": 1,
		})
	})
})

describe("changeTypeOfEntry", () => {
	test("names the type of change, or null for a moment such as starting to watch", () => {
		expect(history.map((entry) => changeTypeOfEntry(entry))).toEqual([
			"editor",
			"redirects",
			"redirects",
			"navigations",
			"navigations",
			"in-page",
			null,
		])
	})
})

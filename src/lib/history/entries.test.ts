import { describe, expect, test } from "bun:test"

import {
	appendToHistory,
	creditEntriesToEditorOpening,
	EDITOR_OPENING_LIFETIME_MS,
	type HistoryEntry,
	MAX_HISTORY_ENTRY_COUNT,
	type UnnumberedHistoryEntry,
} from "./entries.ts"

const RECORDED_AT = 1_700_000_000_000

const FOUND = { code: 302, reasonPhrase: "Found" }

function linkEntry(href: string): UnnumberedHistoryEntry {
	return {
		href,
		cause: "link",
		redirectStatus: null,
		editedFromEntryNumber: null,
		recordedAt: RECORDED_AT,
	}
}

describe("openings from the editor", () => {
	const opening = {
		href: "https://a.com/edited#top",
		editedFromEntryNumber: 3,
		openedAt: RECORDED_AT - 1000,
	}

	test("credits the opened URL and keeps the redirects after it", () => {
		const redirectEntry = {
			...linkEntry("https://b.com/"),
			cause: "server-redirect" as const,
			redirectStatus: FOUND,
		}
		expect(
			creditEntriesToEditorOpening(
				[linkEntry("https://a.com/edited"), redirectEntry],
				opening,
			),
		).toEqual([
			{
				...linkEntry("https://a.com/edited"),
				cause: "opened-from-editor",
				editedFromEntryNumber: 3,
			},
			redirectEntry,
		])
	})

	test("does not credit the original entry", () => {
		expect(
			creditEntriesToEditorOpening(
				[
					{
						...linkEntry("https://a.com/edited#top"),
						cause: "original",
					},
				],
				opening,
			),
		).toBeNull()
	})

	test("does not credit another URL or an expired opening", () => {
		expect(
			creditEntriesToEditorOpening([linkEntry("https://a.com/other")], opening),
		).toBeNull()
		expect(
			creditEntriesToEditorOpening(
				[linkEntry("https://a.com/edited#other")],
				opening,
			),
		).toBeNull()
		expect(
			creditEntriesToEditorOpening([linkEntry("https://a.com/edited#top")], {
				...opening,
				openedAt: RECORDED_AT - EDITOR_OPENING_LIFETIME_MS - 1,
			}),
		).toBeNull()
	})
})

describe("appending", () => {
	test("numbers entries after the last one", () => {
		const history = appendToHistory([], [linkEntry("https://a.com/")])
		const appendedHistory = appendToHistory(history, [
			linkEntry("https://b.com/"),
			linkEntry("https://c.com/"),
		])
		expect(appendedHistory.map((entry) => entry.entryNumber)).toEqual([1, 2, 3])
		expect(history).toHaveLength(1)
	})

	test("drops the oldest entries past the limit and keeps their numbers", () => {
		let history: HistoryEntry[] = []
		for (let entryIndex = 0; entryIndex <= MAX_HISTORY_ENTRY_COUNT; entryIndex++) {
			history = appendToHistory(history, [
				linkEntry(`https://a.com/${entryIndex}`),
			])
		}
		expect(history).toHaveLength(MAX_HISTORY_ENTRY_COUNT)
		expect(history[0]?.entryNumber).toBe(2)
		expect(history.at(-1)?.entryNumber).toBe(MAX_HISTORY_ENTRY_COUNT + 1)
	})
})

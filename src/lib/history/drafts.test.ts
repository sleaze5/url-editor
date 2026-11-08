import { describe, expect, test } from "bun:test"

import {
	doesReplacingDraftLoseEdits,
	dropStashedDraft,
	hasUnsavedEdits,
	MAX_STASHED_DRAFT_COUNT,
	stashDraft,
} from "./drafts.ts"
import { appendToHistory } from "./entries.ts"

const TAB_URL = "https://a.com/"

const history = appendToHistory(
	[],
	["https://a.com/old", TAB_URL].map((href) => ({
		href,
		cause: "link",
		redirectStatus: null,
		editedFromEntryNumber: null,
		recordedAt: 0,
	})),
)

const draftOf = (editedHref: string, editedFromEntryNumber: number | null = null) => ({
	editedHref,
	editedFromEntryNumber,
})

describe("unsaved edits", () => {
	test("are a draft that differs from the tab's URL", () => {
		expect(hasUnsavedEdits(draftOf("https://a.com/edited"), TAB_URL, history)).toBe(
			true,
		)
		expect(hasUnsavedEdits(draftOf(TAB_URL), TAB_URL, history)).toBe(false)
	})

	test("are not an unchanged history entry, but are an edited one", () => {
		expect(hasUnsavedEdits(draftOf("https://a.com/old", 1), TAB_URL, history)).toBe(
			false,
		)
		expect(
			hasUnsavedEdits(draftOf("https://a.com/old?edited", 1), TAB_URL, history),
		).toBe(true)
	})

	test("are not lost by replacing the draft with the same URL", () => {
		const context = { tabUrl: TAB_URL, history }
		const editedDraft = draftOf("https://a.com/edited")
		expect(
			doesReplacingDraftLoseEdits(editedDraft, "https://a.com/old", context),
		).toBe(true)
		expect(
			doesReplacingDraftLoseEdits(editedDraft, "https://a.com/edited", context),
		).toBe(false)
	})
})

describe("the stash", () => {
	test("keeps the newest draft first, without duplicates", () => {
		const firstDraft = draftOf("https://a.com/1")
		const secondDraft = draftOf("https://a.com/2", 1)
		const stash = stashDraft(stashDraft([], firstDraft), secondDraft)
		expect(stash).toEqual([secondDraft, firstDraft])
		expect(stashDraft(stash, draftOf("https://a.com/1"))).toEqual([
			firstDraft,
			secondDraft,
		])
	})

	test("drops the oldest drafts past the limit", () => {
		let stash = [draftOf("https://a.com/oldest")]
		for (let draftIndex = 0; draftIndex < MAX_STASHED_DRAFT_COUNT; draftIndex++) {
			stash = stashDraft(stash, draftOf(`https://a.com/${draftIndex}`))
		}
		expect(stash).toHaveLength(MAX_STASHED_DRAFT_COUNT)
		expect(stash.at(-1)?.editedHref).toBe("https://a.com/0")
	})

	test("drops a draft by its position", () => {
		const stash = [draftOf("https://a.com/1"), draftOf("https://a.com/2")]
		expect(dropStashedDraft(stash, 0)).toEqual([draftOf("https://a.com/2")])
	})
})

import type { HistoryEntry } from "./entries.ts"

export interface EditorDraft {
	editedHref: string
	editedFromEntryNumber: number | null
}

export type UnsavedEditsDecision = "stash" | "discard" | "cancel"

export const MAX_STASHED_DRAFT_COUNT = 20

export const tabUrlDraft = (tabUrl: string): EditorDraft => ({
	editedHref: tabUrl,
	editedFromEntryNumber: null,
})

export function hasUnsavedEdits(
	draft: EditorDraft,
	tabUrl: string,
	history: readonly HistoryEntry[],
): boolean {
	if (draft.editedHref === tabUrl) return false
	const sourceEntry = history.find(
		(entry) => entry.entryNumber === draft.editedFromEntryNumber,
	)
	return sourceEntry?.href !== draft.editedHref
}

export function doesReplacingDraftLoseEdits(
	draft: EditorDraft,
	replacementHref: string,
	context: { tabUrl: string; history: readonly HistoryEntry[] },
): boolean {
	return (
		draft.editedHref !== replacementHref &&
		hasUnsavedEdits(draft, context.tabUrl, context.history)
	)
}

export const isSameDraft = (draft: EditorDraft, otherDraft: EditorDraft): boolean =>
	draft.editedHref === otherDraft.editedHref &&
	draft.editedFromEntryNumber === otherDraft.editedFromEntryNumber

export function stashDraft(
	stashedDrafts: readonly EditorDraft[],
	draft: EditorDraft,
): EditorDraft[] {
	return [
		draft,
		...stashedDrafts.filter((stashedDraft) => !isSameDraft(stashedDraft, draft)),
	].slice(0, MAX_STASHED_DRAFT_COUNT)
}

export function dropStashedDraft(
	stashedDrafts: readonly EditorDraft[],
	droppedIndex: number,
): EditorDraft[] {
	return stashedDrafts.filter((_, stashIndex) => stashIndex !== droppedIndex)
}

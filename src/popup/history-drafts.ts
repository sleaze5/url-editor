import { type Accessor, createSignal } from "solid-js"

import { loadStashedDrafts, saveStashedDrafts } from "../lib/browser/drafts.ts"
import { loadHistory } from "../lib/browser/history.ts"
import { recordOriginalEntryIfHistoryIsEmpty } from "../lib/browser/original-entry.ts"
import type { EditedTab } from "../lib/browser/tabs.ts"
import {
	doesReplacingDraftLoseEdits,
	dropStashedDraft,
	type EditorDraft,
	hasUnsavedEdits,
	stashDraft,
	type UnsavedEditsDecision,
} from "../lib/history/drafts.ts"
import type { HistoryEntry } from "../lib/history/entries.ts"
import type { EditorDraftState } from "./editor-draft.ts"

interface HistoryDraftsOptions {
	readyTab: Accessor<EditedTab | null>
	onDraftLoaded: () => void
}

function createDraftStash(
	editorDraft: EditorDraftState,
	history: Accessor<readonly HistoryEntry[]>,
	options: HistoryDraftsOptions,
) {
	const [stashedDrafts, setStashedDrafts] = createSignal<readonly EditorDraft[]>([])

	function changeStashedDrafts(nextStash: readonly EditorDraft[]): void {
		const tab = options.readyTab()
		if (!tab) return
		setStashedDrafts(nextStash)
		void saveStashedDrafts(tab, nextStash)
	}

	return {
		stashedDrafts,
		setStashedDrafts,
		stashCurrentDraft: (): void => {
			changeStashedDrafts(stashDraft(stashedDrafts(), editorDraft.currentDraft()))
		},
		restoreStashedDraft: (stashIndex: number): void => {
			const tab = options.readyTab()
			const restoredDraft = stashedDrafts()[stashIndex]
			if (!tab || !restoredDraft) return
			const currentDraft = editorDraft.currentDraft()
			const remainingStash = dropStashedDraft(stashedDrafts(), stashIndex)
			changeStashedDrafts(
				hasUnsavedEdits(currentDraft, tab.url, history())
					? stashDraft(remainingStash, currentDraft)
					: remainingStash,
			)
			editorDraft.loadDraft(restoredDraft)
			options.onDraftLoaded()
		},
		dropStashedDraft: (stashIndex: number): void => {
			changeStashedDrafts(dropStashedDraft(stashedDrafts(), stashIndex))
		},
		dropAllStashedDrafts: (): void => {
			changeStashedDrafts([])
		},
	}
}

export function createHistoryDrafts(
	editorDraft: EditorDraftState,
	options: HistoryDraftsOptions,
) {
	const [history, setHistory] = createSignal<readonly HistoryEntry[]>([])
	const [entryAwaitingDecision, setEntryAwaitingDecision] =
		createSignal<HistoryEntry | null>(null)
	const { setStashedDrafts, ...stash } = createDraftStash(
		editorDraft,
		history,
		options,
	)

	function loadEntryIntoEditor(entry: HistoryEntry): void {
		editorDraft.loadDraft({
			editedHref: entry.href,
			editedFromEntryNumber: entry.entryNumber,
		})
		options.onDraftLoaded()
	}

	return {
		...stash,
		history,
		setHistory,
		entryAwaitingDecision,
		recordOriginalEntryAndLoadForTab: async (tab: EditedTab): Promise<void> => {
			await recordOriginalEntryIfHistoryIsEmpty(tab)
			const [savedHistory, savedStash] = await Promise.all([
				loadHistory(tab),
				loadStashedDrafts(tab),
			])
			setHistory(savedHistory)
			setStashedDrafts(savedStash)
		},
		editEntryOrAskFirst: (entry: HistoryEntry): void => {
			const tab = options.readyTab()
			if (!tab) return
			const context = { tabUrl: tab.url, history: history() }
			if (
				doesReplacingDraftLoseEdits(
					editorDraft.currentDraft(),
					entry.href,
					context,
				)
			) {
				setEntryAwaitingDecision(entry)
			} else {
				loadEntryIntoEditor(entry)
			}
		},
		decideAboutUnsavedEdits: (decision: UnsavedEditsDecision): void => {
			const entry = entryAwaitingDecision()
			setEntryAwaitingDecision(null)
			if (!entry || decision === "cancel") return
			if (decision === "stash") stash.stashCurrentDraft()
			loadEntryIntoEditor(entry)
		},
	}
}

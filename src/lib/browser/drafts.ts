import { type EditorDraft, isSameDraft } from "../history/drafts.ts"
import {
	hasSessionStorageApi,
	readSessionValue,
	watchSessionValue,
} from "./session-storage.ts"
import type { EditedTab } from "./tabs.ts"

interface StoredDraft extends EditorDraft {
	tabUrl: string
	viewId: string
}

const THIS_VIEW_ID = crypto.randomUUID()
const draftsKnownInStorage = new Map<number, Omit<StoredDraft, "viewId">>()

const draftStorageKey = (tabId: number): string => `draft:${tabId}`
const stashedDraftsStorageKey = (tabId: number): string => `stashed-drafts:${tabId}`

function isEditorDraft(storedValue: unknown): storedValue is EditorDraft {
	if (typeof storedValue !== "object" || storedValue === null) return false
	const { editedHref, editedFromEntryNumber } = storedValue as Partial<EditorDraft>
	return (
		typeof editedHref === "string" &&
		(typeof editedFromEntryNumber === "number" || editedFromEntryNumber === null)
	)
}

function isStoredDraft(storedValue: unknown): storedValue is StoredDraft {
	return (
		isEditorDraft(storedValue) &&
		typeof (storedValue as Partial<StoredDraft>).tabUrl === "string" &&
		typeof (storedValue as Partial<StoredDraft>).viewId === "string"
	)
}

const toEditorDraft = (draft: EditorDraft): EditorDraft => ({
	editedHref: draft.editedHref,
	editedFromEntryNumber: draft.editedFromEntryNumber,
})

export async function loadDraft(tab: EditedTab): Promise<EditorDraft | null> {
	if (tab.id === undefined || !hasSessionStorageApi()) return null
	const storageKey = draftStorageKey(tab.id)
	const storedDraft = await readSessionValue(storageKey)
	if (isStoredDraft(storedDraft) && storedDraft.tabUrl === tab.url) {
		draftsKnownInStorage.set(tab.id, storedDraft)
		return toEditorDraft(storedDraft)
	}
	if (storedDraft !== undefined) await chrome.storage.session.remove(storageKey)
	return null
}

export async function saveDraft(tab: EditedTab, draft: EditorDraft): Promise<void> {
	if (tab.id === undefined || !hasSessionStorageApi()) return
	const knownDraft = draftsKnownInStorage.get(tab.id)
	if (knownDraft?.tabUrl === tab.url && isSameDraft(knownDraft, draft)) return
	const storedDraft: StoredDraft = {
		...toEditorDraft(draft),
		tabUrl: tab.url,
		viewId: THIS_VIEW_ID,
	}
	draftsKnownInStorage.set(tab.id, storedDraft)
	await chrome.storage.session.set({ [draftStorageKey(tab.id)]: storedDraft })
}

export function watchDraft(
	tab: EditedTab,
	onOtherViewDraft: (draft: EditorDraft) => void,
): () => void {
	if (tab.id === undefined || !hasSessionStorageApi()) return () => {}
	const tabId = tab.id
	return watchSessionValue(draftStorageKey(tabId), (storedDraft) => {
		if (
			isStoredDraft(storedDraft) &&
			storedDraft.viewId !== THIS_VIEW_ID &&
			storedDraft.tabUrl === tab.url
		) {
			draftsKnownInStorage.set(tabId, storedDraft)
			onOtherViewDraft(toEditorDraft(storedDraft))
		}
	})
}

export async function loadStashedDrafts(tab: EditedTab): Promise<EditorDraft[]> {
	if (tab.id === undefined || !hasSessionStorageApi()) return []
	const storedDrafts = await readSessionValue(stashedDraftsStorageKey(tab.id))
	if (!Array.isArray(storedDrafts)) return []
	return storedDrafts
		.filter((storedDraft) => isEditorDraft(storedDraft))
		.map((storedDraft) => toEditorDraft(storedDraft))
}

export async function saveStashedDrafts(
	tab: EditedTab,
	stashedDrafts: readonly EditorDraft[],
): Promise<void> {
	if (tab.id === undefined || !hasSessionStorageApi()) return
	const storageKey = stashedDraftsStorageKey(tab.id)
	await (stashedDrafts.length === 0
		? chrome.storage.session.remove(storageKey)
		: chrome.storage.session.set({
				[storageKey]: stashedDrafts.map((stashedDraft) =>
					toEditorDraft(stashedDraft),
				),
			}))
}

export async function removeStashedDrafts(tabId: number): Promise<void> {
	await chrome.storage.session.remove(stashedDraftsStorageKey(tabId))
}

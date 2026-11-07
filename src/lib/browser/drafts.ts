import type { EditedTab } from "./tabs.ts"

/** An unsaved edit of a tab's URL, shared between the toolbar popup and a popped-out window. */
interface Draft {
	/** The tab's URL when the edit was made; a draft for an older URL is stale. */
	tabUrl: string
	editedHref: string
	/** The view that wrote the draft, so it can ignore its own writes. */
	viewId: string
}

const THIS_VIEW_ID = crypto.randomUUID()
// The draft each tab holds in storage, as far as this view knows. A draft is written
// only when it differs, so a draft received from the other view is not sent back.
const draftsKnownInStorage = new Map<number, Pick<Draft, "tabUrl" | "editedHref">>()

const hasSessionStorageApi = (): boolean =>
	typeof chrome !== "undefined" && "storage" in chrome && "session" in chrome.storage

const draftStorageKey = (tabId: number): string => `draft:${tabId}`

function isDraft(value: unknown): value is Draft {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as Partial<Draft>).tabUrl === "string" &&
		typeof (value as Partial<Draft>).editedHref === "string" &&
		typeof (value as Partial<Draft>).viewId === "string"
	)
}

export async function loadDraft(tab: EditedTab): Promise<string | null> {
	if (tab.id === undefined || !hasSessionStorageApi()) return null
	const storageKey = draftStorageKey(tab.id)
	const { [storageKey]: storedDraft } = await chrome.storage.session.get(storageKey)
	if (isDraft(storedDraft) && storedDraft.tabUrl === tab.url) {
		draftsKnownInStorage.set(tab.id, storedDraft)
		return storedDraft.editedHref
	}
	if (storedDraft !== undefined) await chrome.storage.session.remove(storageKey)
	return null
}

export async function saveDraft(tab: EditedTab, editedHref: string): Promise<void> {
	if (tab.id === undefined || !hasSessionStorageApi()) return
	const knownDraft = draftsKnownInStorage.get(tab.id)
	if (knownDraft?.tabUrl === tab.url && knownDraft.editedHref === editedHref) return
	const draft: Draft = { tabUrl: tab.url, editedHref, viewId: THIS_VIEW_ID }
	draftsKnownInStorage.set(tab.id, draft)
	await chrome.storage.session.set({ [draftStorageKey(tab.id)]: draft })
}

/** Calls `onOtherViewDraft` when the other view saves a draft for this tab's URL. */
export function watchDraft(
	tab: EditedTab,
	onOtherViewDraft: (editedHref: string) => void,
): () => void {
	if (tab.id === undefined || !hasSessionStorageApi()) return () => {}
	const tabId = tab.id
	const storageKey = draftStorageKey(tabId)
	const handleStorageChange = (
		changes: Record<string, chrome.storage.StorageChange>,
	): void => {
		const draft: unknown = changes[storageKey]?.newValue
		if (
			isDraft(draft) &&
			draft.viewId !== THIS_VIEW_ID &&
			draft.tabUrl === tab.url
		) {
			draftsKnownInStorage.set(tabId, draft)
			onOtherViewDraft(draft.editedHref)
		}
	}
	chrome.storage.session.onChanged.addListener(handleStorageChange)
	return () => {
		chrome.storage.session.onChanged.removeListener(handleStorageChange)
	}
}

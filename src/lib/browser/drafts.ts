import type { ActiveTab } from "./tabs.ts"

interface Draft {
	original: string
	href: string
	by: string
}

const VIEW_ID = crypto.randomUUID()
// The draft each tab holds in storage, as far as this view knows. A draft is written
// only when it differs, so a draft received from the other view is not sent back.
const stored = new Map<number, Pick<Draft, "original" | "href">>()

const hasSessionStorage = (): boolean =>
	typeof chrome !== "undefined" && "storage" in chrome && "session" in chrome.storage

const keyOf = (id: number): string => `draft:${id}`

function isDraft(value: unknown): value is Draft {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as Partial<Draft>).original === "string" &&
		typeof (value as Partial<Draft>).href === "string" &&
		typeof (value as Partial<Draft>).by === "string"
	)
}

export async function loadDraft(tab: ActiveTab): Promise<string | null> {
	if (tab.id === undefined || !hasSessionStorage()) return null
	const key = keyOf(tab.id)
	const { [key]: draft } = await chrome.storage.session.get(key)
	if (isDraft(draft) && draft.original === tab.url) {
		stored.set(tab.id, draft)
		return draft.href
	}
	if (draft !== undefined) await chrome.storage.session.remove(key)
	return null
}

export async function saveDraft(tab: ActiveTab, href: string): Promise<void> {
	if (tab.id === undefined || !hasSessionStorage()) return
	const last = stored.get(tab.id)
	if (last?.original === tab.url && last.href === href) return
	const draft: Draft = { original: tab.url, href, by: VIEW_ID }
	stored.set(tab.id, draft)
	await chrome.storage.session.set({ [keyOf(tab.id)]: draft })
}

export function watchDraft(
	tab: ActiveTab,
	onchange: (href: string) => void,
): () => void {
	if (tab.id === undefined || !hasSessionStorage()) return () => {}
	const { id } = tab
	const key = keyOf(id)
	const listener = (changes: Record<string, chrome.storage.StorageChange>): void => {
		const change = changes[key]
		if (!change) return
		const draft: unknown = change.newValue
		if (isDraft(draft) && draft.by !== VIEW_ID && draft.original === tab.url) {
			stored.set(id, draft)
			onchange(draft.href)
		}
	}
	chrome.storage.session.onChanged.addListener(listener)
	return () => {
		chrome.storage.session.onChanged.removeListener(listener)
	}
}

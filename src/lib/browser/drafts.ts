import type { ActiveTab } from "./tabs"

interface Draft {
	original: string
	href: string
	by: string
}

const VIEW_ID = crypto.randomUUID()

const hasSessionStorage = (): boolean =>
	typeof chrome !== "undefined" && chrome.storage?.session !== undefined

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
	if (isDraft(draft) && draft.original === tab.url) return draft.href
	if (draft !== undefined) await chrome.storage.session.remove(key)
	return null
}

export async function saveDraft(tab: ActiveTab, href: string): Promise<void> {
	if (tab.id === undefined || !hasSessionStorage()) return
	const key = keyOf(tab.id)
	const draft: Draft = { original: tab.url, href, by: VIEW_ID }
	await chrome.storage.session.set({ [key]: draft })
}

export function watchDraft(
	tab: ActiveTab,
	onchange: (href: string) => void,
): () => void {
	if (tab.id === undefined || !hasSessionStorage()) return () => {}
	const key = keyOf(tab.id)
	const listener = (changes: Record<string, chrome.storage.StorageChange>): void => {
		const change = changes[key]
		if (!change) return
		const draft: unknown = change.newValue
		if (isDraft(draft) && draft.by !== VIEW_ID && draft.original === tab.url) {
			onchange(draft.href)
		}
	}
	chrome.storage.session.onChanged.addListener(listener)
	return () => {
		chrome.storage.session.onChanged.removeListener(listener)
	}
}

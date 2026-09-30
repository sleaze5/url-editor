export interface ActiveTab {
	id: number | undefined
	url: string
}

const SAMPLE_URL =
	"https://user:pa%20ss@xn--mnchen-3ya.de:8443/a%20path/%C3%BC?q=hello%20world&tag=a&tag=b&flag#top"

export const hasTabsApi = (): boolean =>
	typeof chrome !== "undefined" && chrome.tabs !== undefined

export const windowTabId = Number(
	new URLSearchParams(location.search).get("tab") ?? Number.NaN,
)

export const isWindowed = Number.isInteger(windowTabId)

function devTab(): ActiveTab {
	return {
		id: undefined,
		url: new URLSearchParams(location.search).get("url") ?? SAMPLE_URL,
	}
}

function toActiveTab(tab: chrome.tabs.Tab | undefined): ActiveTab | null {
	const url = tab?.url ?? tab?.pendingUrl ?? ""
	return tab && url !== "" ? { id: tab.id, url } : null
}

export async function findTab(): Promise<chrome.tabs.Tab | undefined> {
	if (isWindowed) {
		try {
			return await chrome.tabs.get(windowTabId)
		} catch {
			return undefined
		}
	}
	const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
	return tab
}

export async function getActiveTab(): Promise<ActiveTab | null> {
	if (!hasTabsApi()) return devTab()
	return toActiveTab(await findTab())
}

export async function navigate(tab: ActiveTab, url: string): Promise<void> {
	if (!hasTabsApi()) {
		location.search = `?url=${encodeURIComponent(url)}`
		return
	}
	await (tab.id === undefined
		? chrome.tabs.update({ url })
		: chrome.tabs.update(tab.id, { url }))
	if (!isWindowed) window.close()
}

export interface TabWatcher {
	onurl: (url: string) => void
	onclose: () => void
}

export function watchTab(tab: ActiveTab, watcher: TabWatcher): () => void {
	if (tab.id === undefined || !hasTabsApi()) return () => {}
	const { id } = tab
	const updated = (tabId: number, change: { url?: string }): void => {
		if (tabId === id && change.url !== undefined) watcher.onurl(change.url)
	}
	const removed = (tabId: number): void => {
		if (tabId === id) watcher.onclose()
	}
	chrome.tabs.onUpdated.addListener(updated)
	chrome.tabs.onRemoved.addListener(removed)
	return () => {
		chrome.tabs.onUpdated.removeListener(updated)
		chrome.tabs.onRemoved.removeListener(removed)
	}
}

/** The tab whose URL this view edits. */
export interface EditedTab {
	id: number | undefined
	url: string
}

const DEV_SERVER_SAMPLE_URL =
	"https://user:pa%20ss@xn--mnchen-3ya.de:8443/a%20path/%C3%BC?q=hello%20world&tag=a&tag=b&flag#top"

export const hasTabsApi = (): boolean =>
	typeof chrome !== "undefined" && "tabs" in chrome

/** The tab a popped-out window edits, from its `?tab=` parameter; NaN in the toolbar popup. */
export const windowedTabId = Number(
	new URLSearchParams(location.search).get("tab") ?? Number.NaN,
)

/** Whether this view is a popped-out window rather than the toolbar popup. */
export const isWindowed = Number.isInteger(windowedTabId)

function devServerTab(): EditedTab {
	return {
		id: undefined,
		url: new URLSearchParams(location.search).get("url") ?? DEV_SERVER_SAMPLE_URL,
	}
}

function toEditedTab(browserTab: chrome.tabs.Tab | undefined): EditedTab | null {
	const url = browserTab?.url ?? browserTab?.pendingUrl ?? ""
	return browserTab && url !== "" ? { id: browserTab.id, url } : null
}

export async function findEditedBrowserTab(): Promise<chrome.tabs.Tab | undefined> {
	if (isWindowed) {
		try {
			return await chrome.tabs.get(windowedTabId)
		} catch {
			return undefined
		}
	}
	const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
	return activeTab
}

export async function getEditedTab(): Promise<EditedTab | null> {
	if (!hasTabsApi()) return devServerTab()
	return toEditedTab(await findEditedBrowserTab())
}

export async function navigateTab(tab: EditedTab, url: string): Promise<void> {
	if (!hasTabsApi()) {
		location.search = `?url=${encodeURIComponent(url)}`
		return
	}
	await (tab.id === undefined
		? chrome.tabs.update({ url })
		: chrome.tabs.update(tab.id, { url }))
	if (!isWindowed) window.close()
}

export interface TabListeners {
	onUrlChange: (url: string) => void
	onClose: () => void
}

export function watchTab(tab: EditedTab, listeners: TabListeners): () => void {
	if (tab.id === undefined || !hasTabsApi()) return () => {}
	const watchedTabId = tab.id
	const handleTabUpdated = (tabId: number, change: { url?: string }): void => {
		if (tabId === watchedTabId && change.url !== undefined) {
			listeners.onUrlChange(change.url)
		}
	}
	const handleTabRemoved = (tabId: number): void => {
		if (tabId === watchedTabId) listeners.onClose()
	}
	chrome.tabs.onUpdated.addListener(handleTabUpdated)
	chrome.tabs.onRemoved.addListener(handleTabRemoved)
	return () => {
		chrome.tabs.onUpdated.removeListener(handleTabUpdated)
		chrome.tabs.onRemoved.removeListener(handleTabRemoved)
	}
}

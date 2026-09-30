import { type ActiveTab, findTab, hasTabsApi, isWindowed, windowTabId } from "./tabs"

const keyOf = (tabId: number): string => `window:${tabId}`

export const canPopOut = (tab: ActiveTab): boolean =>
	!isWindowed && tab.id !== undefined && hasTabsApi()

export async function popOut(tab: ActiveTab): Promise<void> {
	if (tab.id === undefined) return
	await chrome.windows.create({
		url: chrome.runtime.getURL(`index.html?tab=${tab.id}`),
		type: "popup",
		width: cssSize("--popup-width"),
		height: cssSize("--popup-height"),
	})
	window.close()
}

export const canFocusTab = (tab: ActiveTab): boolean =>
	isWindowed && tab.id !== undefined && hasTabsApi()

export async function focusTab(tab: ActiveTab): Promise<void> {
	if (tab.id === undefined) return
	const updated: chrome.tabs.Tab | undefined = await chrome.tabs.update(tab.id, {
		active: true,
	})
	if (updated) await chrome.windows.update(updated.windowId, { focused: true })
}

function cssSize(name: string): number {
	const value = getComputedStyle(document.documentElement).getPropertyValue(name)
	return Number(value.trim().replace(/px$/u, ""))
}

// Window sizes are in screen pixels and include the frame, so the inner area is measured
// and corrected to match the popup's CSS size at the current zoom.
async function fitToPopupSize(win: chrome.windows.Window): Promise<void> {
	if (win.id === undefined || win.width === undefined || win.height === undefined) {
		return
	}
	const scale = win.width / outerWidth
	await chrome.windows.update(win.id, {
		width: Math.round(win.width + (cssSize("--popup-width") - innerWidth) * scale),
		height: Math.round(
			win.height + (cssSize("--popup-height") - innerHeight) * scale,
		),
	})
}

async function registerWindow(): Promise<void> {
	const win = await chrome.windows.getCurrent()
	if (win.id === undefined) return
	const key = keyOf(windowTabId)
	const { [key]: known } = await chrome.storage.session.get(key)
	if (known === win.id) return
	await chrome.storage.session.set({ [key]: win.id })
	await fitToPopupSize(win)
}

async function focusPoppedOut(): Promise<boolean> {
	const tabId = (await findTab())?.id
	if (tabId === undefined) return false
	const key = keyOf(tabId)
	const { [key]: windowId } = await chrome.storage.session.get(key)
	if (typeof windowId !== "number") return false
	try {
		await chrome.windows.update(windowId, { focused: true })
		return true
	} catch {
		await chrome.storage.session.remove(key)
		return false
	}
}

export async function prepareWindow(): Promise<boolean> {
	if (!hasTabsApi()) return true
	if (isWindowed) {
		await registerWindow()
		return true
	}
	if (!(await focusPoppedOut())) return true
	window.close()
	return false
}

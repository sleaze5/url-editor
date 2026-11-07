import {
	type EditedTab,
	findEditedBrowserTab,
	hasTabsApi,
	isWindowed,
	windowedTabId,
} from "./tabs.ts"

const windowIdStorageKey = (tabId: number): string => `window:${tabId}`

export const canPopOut = (tab: EditedTab): boolean =>
	!isWindowed && tab.id !== undefined && hasTabsApi()

export async function popOut(tab: EditedTab): Promise<void> {
	if (tab.id === undefined) return
	await chrome.windows.create({
		url: chrome.runtime.getURL(`index.html?tab=${tab.id}`),
		type: "popup",
		width: readCssPixels("--width-popup"),
		height: readCssPixels("--height-popup"),
	})
	window.close()
}

export const canFocusTab = (tab: EditedTab): boolean =>
	isWindowed && tab.id !== undefined && hasTabsApi()

export async function focusTab(tab: EditedTab): Promise<void> {
	if (tab.id === undefined) return
	const focusedTab: chrome.tabs.Tab | undefined = await chrome.tabs.update(tab.id, {
		active: true,
	})
	if (focusedTab) await chrome.windows.update(focusedTab.windowId, { focused: true })
}

function readCssPixels(propertyName: string): number {
	const propertyValue = getComputedStyle(document.documentElement).getPropertyValue(
		propertyName,
	)
	return Number(propertyValue.trim().replace(/px$/u, ""))
}

// Window sizes are in screen pixels and include the frame, so the inner area is measured
// and corrected to match the popup's CSS size at the current zoom.
async function fitToPopupSize(poppedOutWindow: chrome.windows.Window): Promise<void> {
	const { id, width, height } = poppedOutWindow
	if (id === undefined || width === undefined || height === undefined) return
	const screenPixelsPerCssPixel = width / outerWidth
	await chrome.windows.update(id, {
		width: Math.round(
			width +
				(readCssPixels("--width-popup") - innerWidth) * screenPixelsPerCssPixel,
		),
		height: Math.round(
			height +
				(readCssPixels("--height-popup") - innerHeight) *
					screenPixelsPerCssPixel,
		),
	})
}

async function rememberAndFitThisWindow(): Promise<void> {
	const thisWindow = await chrome.windows.getCurrent()
	if (thisWindow.id === undefined) return
	const storageKey = windowIdStorageKey(windowedTabId)
	const { [storageKey]: rememberedWindowId } =
		await chrome.storage.session.get(storageKey)
	if (rememberedWindowId === thisWindow.id) return
	await chrome.storage.session.set({ [storageKey]: thisWindow.id })
	await fitToPopupSize(thisWindow)
}

async function focusExistingWindowForTab(): Promise<boolean> {
	const tabId = (await findEditedBrowserTab())?.id
	if (tabId === undefined) return false
	const storageKey = windowIdStorageKey(tabId)
	const { [storageKey]: windowId } = await chrome.storage.session.get(storageKey)
	if (typeof windowId !== "number") return false
	try {
		await chrome.windows.update(windowId, { focused: true })
		return true
	} catch {
		await chrome.storage.session.remove(storageKey)
		return false
	}
}

/**
 * Sizes a popped-out window. When the toolbar popup opens for a tab that already has a
 * window, focuses that window and closes the popup instead. Returns whether to render.
 */
export async function prepareWindowAndDecideToRender(): Promise<boolean> {
	if (!hasTabsApi()) return true
	if (isWindowed) {
		await rememberAndFitThisWindow()
		return true
	}
	if (!(await focusExistingWindowForTab())) return true
	window.close()
	return false
}

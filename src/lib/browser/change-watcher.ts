import { hasSessionStorageApi, readSessionValue } from "./session-storage.ts"
import type { EditedTab } from "./tabs.ts"

interface ChangeWatcher {
	startedAtHref: string
	startedAt: number
}

const changeWatcherStorageKey = (tabId: number): string => `change-watcher:${tabId}`

function isChangeWatcher(storedWatcher: unknown): storedWatcher is ChangeWatcher {
	return (
		typeof storedWatcher === "object" &&
		storedWatcher !== null &&
		typeof (storedWatcher as Partial<ChangeWatcher>).startedAtHref === "string" &&
		typeof (storedWatcher as Partial<ChangeWatcher>).startedAt === "number"
	)
}

async function readChangeWatcher(tabId: number): Promise<ChangeWatcher | null> {
	const storedWatcher = await readSessionValue(changeWatcherStorageKey(tabId))
	return isChangeWatcher(storedWatcher) ? storedWatcher : null
}

export async function isChangeWatcherOn(tabId: number): Promise<boolean> {
	return (await readChangeWatcher(tabId)) !== null
}

export function loadIsChangeWatcherOn(tab: EditedTab): Promise<boolean> {
	if (tab.id === undefined || !hasSessionStorageApi()) return Promise.resolve(false)
	return isChangeWatcherOn(tab.id)
}

export async function switchChangeWatcher(
	tab: EditedTab,
	isTurningOn: boolean,
): Promise<void> {
	if (tab.id === undefined || !hasSessionStorageApi()) return
	const storageKey = changeWatcherStorageKey(tab.id)
	const changeWatcher: ChangeWatcher = {
		startedAtHref: tab.url,
		startedAt: Date.now(),
	}
	await (isTurningOn
		? chrome.storage.session.set({ [storageKey]: changeWatcher })
		: chrome.storage.session.remove(storageKey))
}

export async function moveChangeWatcher(
	fromTabId: number,
	toTabId: number,
): Promise<void> {
	const changeWatcher = await readChangeWatcher(fromTabId)
	await chrome.storage.session.remove(changeWatcherStorageKey(fromTabId))
	if (changeWatcher) {
		await chrome.storage.session.set({
			[changeWatcherStorageKey(toTabId)]: changeWatcher,
		})
	}
}

export async function removeChangeWatcher(tabId: number): Promise<void> {
	await chrome.storage.session.remove(changeWatcherStorageKey(tabId))
}

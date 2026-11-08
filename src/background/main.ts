import {
	moveChangeWatcher,
	removeChangeWatcher,
} from "../lib/browser/change-watcher.ts"
import { removeStashedDrafts } from "../lib/browser/drafts.ts"
import { moveHistory, removeHistory } from "../lib/browser/history.ts"
import { listenForOriginalEntryRequests } from "../lib/browser/original-entry.ts"
import { originalEntryForEmptyHistory } from "../lib/history/navigation-entries.ts"
import {
	abandonNavigation,
	commitNavigation,
	followRedirect,
	followTabUrlChange,
	forgetNavigationsOfTab,
	recordFragmentChange,
	recordHistoryStateUpdate,
	startNavigation,
} from "./navigations.ts"
import { finishRecordingsOfTab, recordEntries } from "./recorder.ts"

function forgetTab(tabId: number): void {
	forgetNavigationsOfTab(tabId)
	finishRecordingsOfTab(tabId, async () => {
		await Promise.all([
			removeHistory(tabId),
			removeStashedDrafts(tabId),
			removeChangeWatcher(tabId),
		])
	})
}

function moveTab(addedTabId: number, removedTabId: number): void {
	forgetNavigationsOfTab(removedTabId)
	finishRecordingsOfTab(removedTabId, async () => {
		await Promise.all([
			moveHistory(removedTabId, addedTabId),
			moveChangeWatcher(removedTabId, addedTabId),
		])
	})
}

function followRedirectsIfAllowed(): void {
	if (!("webRequest" in chrome)) return
	if (chrome.webRequest.onBeforeRedirect.hasListener(followRedirect)) return
	chrome.webRequest.onBeforeRedirect.addListener(followRedirect, {
		urls: ["<all_urls>"],
		types: ["main_frame"],
	})
}

chrome.webNavigation.onBeforeNavigate.addListener(startNavigation)
chrome.webNavigation.onErrorOccurred.addListener(abandonNavigation)
chrome.webNavigation.onCommitted.addListener(commitNavigation)
chrome.webNavigation.onHistoryStateUpdated.addListener(recordHistoryStateUpdate)
chrome.webNavigation.onReferenceFragmentUpdated.addListener(recordFragmentChange)
chrome.tabs.onUpdated.addListener(followTabUrlChange)
chrome.tabs.onRemoved.addListener(forgetTab)
chrome.tabs.onReplaced.addListener(moveTab)
chrome.permissions.onAdded.addListener(followRedirectsIfAllowed)
followRedirectsIfAllowed()
listenForOriginalEntryRequests((request) =>
	recordEntries(
		request.tabId,
		(history) => originalEntryForEmptyHistory(history, request),
		{ isRecordedWithoutWatcher: true },
	),
)

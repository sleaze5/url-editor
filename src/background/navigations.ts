import type { HistoryCause, UnnumberedHistoryEntry } from "../lib/history/entries.ts"
import {
	causeOfTransition,
	entriesForCommittedNavigation,
	entriesForSameDocumentChange,
	entriesForUnexplainedUrlChange,
	type RedirectHop,
	redirectStatusFromResponse,
} from "../lib/history/navigation-entries.ts"
import { recordEntries } from "./recorder.ts"

interface FrameNavigationDetails {
	tabId: number
	frameId: number
	parentFrameId: number
	url: string
	timeStamp: number
	documentLifecycle?: string
	transitionType?: string
	transitionQualifiers?: readonly string[]
}

interface NavigationInProgress {
	startedHref: string | null
	redirectHops: readonly RedirectHop[]
}

const UNSEEN_NAVIGATION: NavigationInProgress = { startedHref: null, redirectHops: [] }

const UNEXPLAINED_URL_CHANGE_DELAY_MS = 1000
const MAX_PRERENDERED_PAGES_PER_TAB = 4
const PRIMARY_MAIN_FRAME_ID = 0

const navigationsInProgress = new Map<string, NavigationInProgress>()
const prerenderedEntriesByTabId = new Map<number, UnnumberedHistoryEntry[][]>()

const navigationKey = (tabId: number, frameId: number): string => `${tabId}:${frameId}`

const isTopLevelFrameOfTab = (details: FrameNavigationDetails): boolean =>
	details.parentFrameId === -1 && details.tabId >= 0

const isPrerendering = (details: FrameNavigationDetails): boolean =>
	details.documentLifecycle === "prerender"

export function startNavigation(details: FrameNavigationDetails): void {
	if (!isTopLevelFrameOfTab(details)) return
	navigationsInProgress.set(navigationKey(details.tabId, details.frameId), {
		startedHref: details.url,
		redirectHops: [],
	})
}

export function abandonNavigation(details: FrameNavigationDetails): void {
	if (!isTopLevelFrameOfTab(details)) return
	navigationsInProgress.delete(navigationKey(details.tabId, details.frameId))
}

export function followRedirect(
	details: chrome.webRequest.OnBeforeRedirectDetails,
): void {
	if (details.tabId < 0) return
	const key = navigationKey(details.tabId, details.frameId)
	const navigation = navigationsInProgress.get(key) ?? UNSEEN_NAVIGATION
	const redirectHop: RedirectHop = {
		fromHref: details.url,
		toHref: details.redirectUrl,
		redirectStatus: redirectStatusFromResponse(
			details.statusCode,
			details.statusLine,
		),
	}
	navigationsInProgress.set(key, {
		...navigation,
		redirectHops: [...navigation.redirectHops, redirectHop],
	})
}

function holdPrerenderedEntries(
	tabId: number,
	entries: UnnumberedHistoryEntry[],
): void {
	const heldEntries = prerenderedEntriesByTabId.get(tabId) ?? []
	prerenderedEntriesByTabId.set(
		tabId,
		[...heldEntries, entries].slice(-MAX_PRERENDERED_PAGES_PER_TAB),
	)
}

function takePrerenderedEntries(
	tabId: number,
	shownHref: string,
): UnnumberedHistoryEntry[] | null {
	const shownEntries = prerenderedEntriesByTabId
		.get(tabId)
		?.find((entries) => entries.at(-1)?.href === shownHref)
	if (!shownEntries) return null
	prerenderedEntriesByTabId.delete(tabId)
	const shownAt = Date.now()
	for (const shownEntry of shownEntries) shownEntry.recordedAt = shownAt
	return shownEntries
}

function takeNavigationInProgress(
	details: FrameNavigationDetails,
): NavigationInProgress {
	const key = navigationKey(details.tabId, details.frameId)
	const navigation = navigationsInProgress.get(key)
	navigationsInProgress.delete(key)
	return navigation ?? UNSEEN_NAVIGATION
}

export function commitNavigation(details: FrameNavigationDetails): void {
	if (!isTopLevelFrameOfTab(details)) return
	const navigation = takeNavigationInProgress(details)
	const transitionQualifiers = details.transitionQualifiers ?? []
	const entries = entriesForCommittedNavigation({
		...navigation,
		committedHref: details.url,
		cause: causeOfTransition(details.transitionType ?? "", transitionQualifiers),
		wasServerRedirected: transitionQualifiers.includes("server_redirect"),
		recordedAt: details.timeStamp,
	})
	if (isPrerendering(details)) {
		holdPrerenderedEntries(details.tabId, entries)
	} else {
		void recordEntries(details.tabId, () => entries)
	}
}

function recordSameDocumentChange(
	details: FrameNavigationDetails,
	cause: HistoryCause,
): void {
	if (!isTopLevelFrameOfTab(details) || isPrerendering(details)) return
	const isBackOrForward = details.transitionQualifiers?.includes("forward_back")
	void recordEntries(details.tabId, (history) =>
		entriesForSameDocumentChange(history, {
			href: details.url,
			cause: isBackOrForward ? "back-forward" : cause,
			recordedAt: details.timeStamp,
		}),
	)
}

export function recordHistoryStateUpdate(details: FrameNavigationDetails): void {
	recordSameDocumentChange(details, "page-script")
}

export function recordFragmentChange(details: FrameNavigationDetails): void {
	recordSameDocumentChange(details, "fragment")
}

function recordUnexplainedUrlChange(
	tabId: number,
	href: string,
	changedAt: number,
): void {
	if (navigationsInProgress.has(navigationKey(tabId, PRIMARY_MAIN_FRAME_ID))) return
	void recordEntries(tabId, (history) => {
		const unexplainedEntries = entriesForUnexplainedUrlChange(history, {
			href,
			recordedAt: changedAt,
		})
		if (unexplainedEntries.length === 0) return []
		return takePrerenderedEntries(tabId, href) ?? unexplainedEntries
	})
}

export function followTabUrlChange(
	tabId: number,
	changeInfo: chrome.tabs.OnUpdatedInfo,
): void {
	const changedHref = changeInfo.url
	if (changedHref === undefined) return
	const changedAt = Date.now()
	setTimeout(() => {
		recordUnexplainedUrlChange(tabId, changedHref, changedAt)
	}, UNEXPLAINED_URL_CHANGE_DELAY_MS)
}

export function forgetNavigationsOfTab(tabId: number): void {
	prerenderedEntriesByTabId.delete(tabId)
	for (const key of navigationsInProgress.keys()) {
		if (key.startsWith(`${tabId}:`)) navigationsInProgress.delete(key)
	}
}

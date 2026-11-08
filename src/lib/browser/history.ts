import {
	appendToHistory,
	type EditorOpening,
	type HistoryEntry,
} from "../history/entries.ts"
import {
	hasSessionStorageApi,
	readSessionValue,
	watchSessionValue,
} from "./session-storage.ts"
import { type EditedTab, navigateTab } from "./tabs.ts"

const historyStorageKey = (tabId: number): string => `history:${tabId}`
const editorOpeningStorageKey = (tabId: number): string => `opening:${tabId}`

function isHistory(storedHistory: unknown): storedHistory is HistoryEntry[] {
	return (
		Array.isArray(storedHistory) &&
		storedHistory.every(
			(storedEntry: unknown) =>
				typeof storedEntry === "object" &&
				storedEntry !== null &&
				typeof (storedEntry as Partial<HistoryEntry>).href === "string" &&
				typeof (storedEntry as Partial<HistoryEntry>).entryNumber === "number",
		)
	)
}

const toHistory = (storedHistory: unknown): HistoryEntry[] =>
	isHistory(storedHistory) ? storedHistory : []

function isEditorOpening(storedOpening: unknown): storedOpening is EditorOpening {
	return (
		typeof storedOpening === "object" &&
		storedOpening !== null &&
		typeof (storedOpening as Partial<EditorOpening>).href === "string" &&
		typeof (storedOpening as Partial<EditorOpening>).openedAt === "number"
	)
}

export async function readHistory(tabId: number): Promise<HistoryEntry[]> {
	return toHistory(await readSessionValue(historyStorageKey(tabId)))
}

export async function writeHistory(
	tabId: number,
	history: readonly HistoryEntry[],
): Promise<void> {
	await chrome.storage.session.set({ [historyStorageKey(tabId)]: history })
}

export async function moveHistory(fromTabId: number, toTabId: number): Promise<void> {
	const history = await readHistory(fromTabId)
	await chrome.storage.session.remove(historyStorageKey(fromTabId))
	if (history.length > 0) await writeHistory(toTabId, history)
}

export async function removeHistory(tabId: number): Promise<void> {
	await chrome.storage.session.remove([
		historyStorageKey(tabId),
		editorOpeningStorageKey(tabId),
	])
}

export async function readEditorOpening(tabId: number): Promise<EditorOpening | null> {
	const storedOpening = await readSessionValue(editorOpeningStorageKey(tabId))
	return isEditorOpening(storedOpening) ? storedOpening : null
}

export async function forgetEditorOpening(tabId: number): Promise<void> {
	await chrome.storage.session.remove(editorOpeningStorageKey(tabId))
}

export async function openUrlFromEditor(
	tab: EditedTab,
	opening: Omit<EditorOpening, "openedAt">,
): Promise<void> {
	const tabId = hasSessionStorageApi() ? tab.id : undefined
	if (tabId === undefined) {
		await navigateTab(tab, opening.href)
		return
	}
	const storedOpening: EditorOpening = { ...opening, openedAt: Date.now() }
	await chrome.storage.session.set({
		[editorOpeningStorageKey(tabId)]: storedOpening,
	})
	try {
		await navigateTab(tab, opening.href)
	} catch (error) {
		await forgetEditorOpening(tabId)
		throw error
	}
}

function devServerSampleHistory(tabUrl: string): HistoryEntry[] {
	const { host, origin } = new URL(tabUrl)
	const startedAt = Date.now() - 5 * 60_000
	const sampleEntries = [
		{ href: `${origin}/`, cause: "original" },
		{ href: `http://${host}/old`, cause: "link" },
		{
			href: `https://${host}/old`,
			cause: "server-redirect",
			status: [307, "Internal Redirect"],
		},
		{
			href: `${origin}/new`,
			cause: "server-redirect",
			status: [301, "Moved Permanently"],
		},
		{ href: `${origin}/new#details`, cause: "fragment" },
		{ href: tabUrl, cause: "opened-from-editor", editedFromEntryNumber: 4 },
	] as const
	return appendToHistory(
		[],
		sampleEntries.map((sampleEntry, entryIndex) => ({
			href: sampleEntry.href,
			cause: sampleEntry.cause,
			redirectStatus:
				"status" in sampleEntry
					? {
							code: sampleEntry.status[0],
							reasonPhrase: sampleEntry.status[1],
						}
					: null,
			editedFromEntryNumber:
				"editedFromEntryNumber" in sampleEntry
					? sampleEntry.editedFromEntryNumber
					: null,
			recordedAt: startedAt + entryIndex * 40_000,
		})),
	)
}

export function loadHistory(tab: EditedTab): Promise<readonly HistoryEntry[]> {
	if (!hasSessionStorageApi()) return Promise.resolve(devServerSampleHistory(tab.url))
	return tab.id === undefined ? Promise.resolve([]) : readHistory(tab.id)
}

export function watchHistory(
	tab: EditedTab,
	onHistoryChange: (history: readonly HistoryEntry[]) => void,
): () => void {
	if (tab.id === undefined || !hasSessionStorageApi()) return () => {}
	return watchSessionValue(historyStorageKey(tab.id), (storedHistory) => {
		onHistoryChange(toHistory(storedHistory))
	})
}

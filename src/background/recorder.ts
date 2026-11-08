import { isChangeWatcherOn } from "../lib/browser/change-watcher.ts"
import {
	forgetEditorOpening,
	readEditorOpening,
	readHistory,
	writeHistory,
} from "../lib/browser/history.ts"
import {
	appendToHistory,
	creditEntriesToEditorOpening,
	type HistoryEntry,
	isEditorOpeningExpired,
	type UnnumberedHistoryEntry,
} from "../lib/history/entries.ts"

type EntryBuilder = (history: readonly HistoryEntry[]) => UnnumberedHistoryEntry[]

const recordingsByTabId = new Map<number, Promise<void>>()

async function creditEntriesToOpeningAndForgetIt(
	tabId: number,
	newEntries: UnnumberedHistoryEntry[],
): Promise<UnnumberedHistoryEntry[] | null> {
	const opening = await readEditorOpening(tabId)
	if (!opening) return null
	const creditedEntries = creditEntriesToEditorOpening(newEntries, opening)
	if (creditedEntries || isEditorOpeningExpired(opening, Date.now())) {
		await forgetEditorOpening(tabId)
	}
	return creditedEntries
}

async function appendEntries(
	tabId: number,
	buildEntries: EntryBuilder,
	isRecordedWithoutWatcher: boolean,
): Promise<void> {
	const history = await readHistory(tabId)
	const newEntries = buildEntries(history)
	if (newEntries.length === 0) return
	const creditedEntries = await creditEntriesToOpeningAndForgetIt(tabId, newEntries)
	if (
		isRecordedWithoutWatcher ||
		creditedEntries ||
		(await isChangeWatcherOn(tabId))
	) {
		await writeHistory(
			tabId,
			appendToHistory(history, creditedEntries ?? newEntries),
		)
	}
}

function queueRecording(
	tabId: number,
	recordingTask: () => Promise<void>,
	failureMessage: string,
): Promise<void> {
	const previousRecording = recordingsByTabId.get(tabId) ?? Promise.resolve()
	const recording = previousRecording.then(recordingTask).catch((error: unknown) => {
		console.error(failureMessage, error)
	})
	recordingsByTabId.set(tabId, recording)
	return recording
}

export function recordEntries(
	tabId: number,
	buildEntries: EntryBuilder,
	{ isRecordedWithoutWatcher = false } = {},
): Promise<void> {
	return queueRecording(
		tabId,
		() => appendEntries(tabId, buildEntries, isRecordedWithoutWatcher),
		"Couldn't record the URL change",
	)
}

export function finishRecordingsOfTab(
	tabId: number,
	finalTask: () => Promise<void>,
): void {
	void queueRecording(
		tabId,
		() => {
			recordingsByTabId.delete(tabId)
			return finalTask()
		},
		"Couldn't update the tab's history",
	)
}

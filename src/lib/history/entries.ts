export type HistoryCause =
	| "opened-from-editor"
	| "server-redirect"
	| "client-redirect"
	| "link"
	| "address-bar"
	| "bookmark"
	| "reload"
	| "back-forward"
	| "form-submission"
	| "page-script"
	| "fragment"
	| "original"
	| "other"

export interface RedirectStatus {
	code: number
	reasonPhrase: string
}

export interface HistoryEntry {
	entryNumber: number
	href: string
	cause: HistoryCause
	redirectStatus: RedirectStatus | null
	editedFromEntryNumber: number | null
	recordedAt: number
}

export type UnnumberedHistoryEntry = Omit<HistoryEntry, "entryNumber">

export interface EditorOpening {
	href: string
	editedFromEntryNumber: number | null
	openedAt: number
}

export const MAX_HISTORY_ENTRY_COUNT = 500

export const EDITOR_OPENING_LIFETIME_MS = 60_000

export const hrefWithoutFragment = (href: string): string =>
	href.split("#", 1)[0] ?? href

export function unnumberedEntry(
	href: string,
	cause: HistoryCause,
	recordedAt: number,
): UnnumberedHistoryEntry {
	return {
		href,
		cause,
		redirectStatus: null,
		editedFromEntryNumber: null,
		recordedAt,
	}
}

export const isEditorOpeningExpired = (opening: EditorOpening, now: number): boolean =>
	now - opening.openedAt > EDITOR_OPENING_LIFETIME_MS

function isOpeningOf(opening: EditorOpening, entry: UnnumberedHistoryEntry): boolean {
	if (entry.cause === "original") return false
	if (isEditorOpeningExpired(opening, entry.recordedAt)) return false
	if (entry.href === opening.href) return true
	return !entry.href.includes("#") && hrefWithoutFragment(opening.href) === entry.href
}

export function creditEntriesToEditorOpening(
	entries: readonly UnnumberedHistoryEntry[],
	opening: EditorOpening,
): UnnumberedHistoryEntry[] | null {
	const [firstEntry, ...laterEntries] = entries
	if (!firstEntry || !isOpeningOf(opening, firstEntry)) return null
	return [
		{
			...firstEntry,
			cause: "opened-from-editor",
			editedFromEntryNumber: opening.editedFromEntryNumber,
		},
		...laterEntries,
	]
}

export function appendToHistory(
	history: readonly HistoryEntry[],
	newEntries: readonly UnnumberedHistoryEntry[],
): HistoryEntry[] {
	const lastEntryNumber = history.at(-1)?.entryNumber ?? 0
	const numberedEntries = newEntries.map((entry, entryIndex) => ({
		entryNumber: lastEntryNumber + entryIndex + 1,
		...entry,
	}))
	return [...history, ...numberedEntries].slice(-MAX_HISTORY_ENTRY_COUNT)
}

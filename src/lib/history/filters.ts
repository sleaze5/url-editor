import type { HistoryCause, HistoryEntry } from "./entries.ts"

export type HistoryFilter = "all" | "editor" | "redirects" | "navigations" | "in-page"

export type ChangeType = Exclude<HistoryFilter, "all">

export const HISTORY_FILTERS: readonly HistoryFilter[] = [
	"all",
	"editor",
	"redirects",
	"navigations",
	"in-page",
]

const CHANGE_TYPE_BY_CAUSE: Record<HistoryCause, ChangeType | null> = {
	"opened-from-editor": "editor",
	"server-redirect": "redirects",
	"client-redirect": "redirects",
	"link": "navigations",
	"address-bar": "navigations",
	"bookmark": "navigations",
	"reload": "navigations",
	"back-forward": "navigations",
	"form-submission": "navigations",
	"other": "navigations",
	"page-script": "in-page",
	"fragment": "in-page",
	"original": null,
}

export const changeTypeOfEntry = (entry: HistoryEntry): ChangeType | null =>
	CHANGE_TYPE_BY_CAUSE[entry.cause]

export const isEntryShownByFilter = (
	entry: HistoryEntry,
	filter: HistoryFilter,
): boolean => filter === "all" || CHANGE_TYPE_BY_CAUSE[entry.cause] === filter

export function countEntriesByFilter(
	history: readonly HistoryEntry[],
): Record<HistoryFilter, number> {
	const entryCountByFilter: Record<HistoryFilter, number> = {
		"all": 0,
		"editor": 0,
		"redirects": 0,
		"navigations": 0,
		"in-page": 0,
	}
	for (const entry of history) {
		entryCountByFilter.all += 1
		const changeType = CHANGE_TYPE_BY_CAUSE[entry.cause]
		if (changeType) entryCountByFilter[changeType] += 1
	}
	return entryCountByFilter
}

import type { HistoryEntry } from "./entries.ts"

const CSV_COLUMNS = [
	"entry",
	"recorded_at",
	"cause",
	"status_code",
	"status_reason",
	"edited_from_entry",
	"url",
] as const

const NEEDS_QUOTES = /[",\r\n]/u

function csvField(fieldText: string): string {
	return NEEDS_QUOTES.test(fieldText)
		? `"${fieldText.replaceAll('"', '""')}"`
		: fieldText
}

function csvRow(entry: HistoryEntry): string {
	return [
		String(entry.entryNumber),
		new Date(entry.recordedAt).toISOString(),
		entry.cause,
		entry.redirectStatus ? String(entry.redirectStatus.code) : "",
		entry.redirectStatus?.reasonPhrase ?? "",
		entry.editedFromEntryNumber === null ? "" : String(entry.editedFromEntryNumber),
		entry.href,
	]
		.map((fieldText) => csvField(fieldText))
		.join(",")
}

export function historyToCsv(history: readonly HistoryEntry[]): string {
	return [CSV_COLUMNS.join(","), ...history.map((entry) => csvRow(entry))].join(
		"\r\n",
	)
}

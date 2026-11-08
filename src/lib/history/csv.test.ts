import { describe, expect, test } from "bun:test"

import { historyToCsv } from "./csv.ts"
import { appendToHistory } from "./entries.ts"

describe("CSV export", () => {
	test("writes a header row and one row per entry, quoting where needed", () => {
		const history = appendToHistory(
			[],
			[
				{
					href: "https://a.com/old",
					cause: "opened-from-editor",
					redirectStatus: null,
					editedFromEntryNumber: 3,
					recordedAt: Date.UTC(2026, 10, 7, 12, 0, 0),
				},
				{
					href: 'https://a.com/new?q=a,b&r="c"',
					cause: "server-redirect",
					redirectStatus: { code: 301, reasonPhrase: "Moved Permanently" },
					editedFromEntryNumber: null,
					recordedAt: Date.UTC(2026, 10, 7, 12, 0, 1),
				},
			],
		)
		expect(historyToCsv(history).split("\r\n")).toEqual([
			"entry,recorded_at,cause,status_code,status_reason,edited_from_entry,url",
			"1,2026-11-07T12:00:00.000Z,opened-from-editor,,,3,https://a.com/old",
			'2,2026-11-07T12:00:01.000Z,server-redirect,301,Moved Permanently,,"https://a.com/new?q=a,b&r=""c"""',
		])
	})

	test("writes only the header for an empty history", () => {
		expect(historyToCsv([])).toBe(
			"entry,recorded_at,cause,status_code,status_reason,edited_from_entry,url",
		)
	})
})

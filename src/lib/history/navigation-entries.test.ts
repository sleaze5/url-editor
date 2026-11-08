import { describe, expect, test } from "bun:test"

import {
	appendToHistory,
	type RedirectStatus,
	type UnnumberedHistoryEntry,
} from "./entries.ts"
import {
	causeOfTransition,
	type CommittedNavigation,
	entriesForCommittedNavigation,
	entriesForSameDocumentChange,
	entriesForUnexplainedUrlChange,
	originalEntryForEmptyHistory,
	RECENT_ENTRY_WINDOW_MS,
	type RedirectHop,
	redirectStatusFromResponse,
} from "./navigation-entries.ts"

const RECORDED_AT = 1_700_000_000_000

const MOVED_PERMANENTLY = { code: 301, reasonPhrase: "Moved Permanently" }
const FOUND = { code: 302, reasonPhrase: "Found" }

function linkEntry(href: string): UnnumberedHistoryEntry {
	return {
		href,
		cause: "link",
		redirectStatus: null,
		editedFromEntryNumber: null,
		recordedAt: RECORDED_AT,
	}
}

describe("causes", () => {
	test("reads the cause from the transition type", () => {
		expect(causeOfTransition("link", [])).toBe("link")
		expect(causeOfTransition("typed", [])).toBe("address-bar")
		expect(causeOfTransition("reload", [])).toBe("reload")
		expect(causeOfTransition("form_submit", [])).toBe("form-submission")
		expect(causeOfTransition("start_page", [])).toBe("other")
		expect(causeOfTransition("typed", ["server_redirect"])).toBe("address-bar")
	})

	test("prefers back or forward and client redirects over the transition type", () => {
		expect(causeOfTransition("link", ["forward_back"])).toBe("back-forward")
		expect(causeOfTransition("link", ["client_redirect"])).toBe("client-redirect")
		expect(causeOfTransition("link", ["forward_back", "client_redirect"])).toBe(
			"back-forward",
		)
	})
})

describe("redirect statuses", () => {
	test("takes the reason phrase from the status line", () => {
		expect(
			redirectStatusFromResponse(307, "HTTP/1.1 307 Internal Redirect"),
		).toEqual({
			code: 307,
			reasonPhrase: "Internal Redirect",
		})
	})

	test("falls back to the standard reason phrase", () => {
		expect(redirectStatusFromResponse(301, "HTTP/2 301")).toEqual(MOVED_PERMANENTLY)
		expect(redirectStatusFromResponse(399, "")).toEqual({
			code: 399,
			reasonPhrase: "",
		})
	})
})

function committedNavigation(
	navigation: Partial<CommittedNavigation> & { committedHref: string },
): CommittedNavigation {
	return {
		startedHref: null,
		redirectHops: [],
		cause: "link",
		wasServerRedirected: false,
		recordedAt: RECORDED_AT,
		...navigation,
	}
}

function redirectHop(
	fromHref: string,
	toHref: string,
	redirectStatus: RedirectStatus,
): RedirectHop {
	return { fromHref, toHref, redirectStatus }
}

describe("committed navigations", () => {
	test("records a navigation without redirects as one entry", () => {
		expect(
			entriesForCommittedNavigation(
				committedNavigation({
					startedHref: "https://a.com/",
					committedHref: "https://a.com/",
				}),
			),
		).toEqual([linkEntry("https://a.com/")])
	})

	test("records each redirect as its own entry with its status", () => {
		const navigation = committedNavigation({
			startedHref: "http://a.com/old#top",
			redirectHops: [
				redirectHop("http://a.com/old", "https://a.com/old", MOVED_PERMANENTLY),
				redirectHop("https://a.com/old", "https://a.com/new", FOUND),
			],
			committedHref: "https://a.com/new#top",
			wasServerRedirected: true,
		})
		expect(entriesForCommittedNavigation(navigation)).toEqual([
			linkEntry("http://a.com/old#top"),
			{
				...linkEntry("https://a.com/old"),
				cause: "server-redirect",
				redirectStatus: MOVED_PERMANENTLY,
			},
			{
				...linkEntry("https://a.com/new#top"),
				cause: "server-redirect",
				redirectStatus: FOUND,
			},
		])
	})

	test("ignores redirects that do not lead to the committed URL", () => {
		const navigation = committedNavigation({
			redirectHops: [redirectHop("https://a.com/", "https://b.com/", FOUND)],
			committedHref: "https://c.com/",
		})
		expect(entriesForCommittedNavigation(navigation)).toEqual([
			linkEntry("https://c.com/"),
		])
	})

	test("records a redirect the browser reports even when its response was not seen", () => {
		const navigation = committedNavigation({
			startedHref: "https://a.com/",
			committedHref: "https://b.com/",
			wasServerRedirected: true,
		})
		expect(entriesForCommittedNavigation(navigation)).toEqual([
			linkEntry("https://a.com/"),
			{ ...linkEntry("https://b.com/"), cause: "server-redirect" },
		])
	})
})

describe("same-document changes", () => {
	const history = appendToHistory([], [linkEntry("https://a.com/")])

	test("records a changed URL", () => {
		expect(
			entriesForSameDocumentChange(history, {
				href: "https://a.com/#top",
				cause: "fragment",
				recordedAt: RECORDED_AT,
			}),
		).toEqual([{ ...linkEntry("https://a.com/#top"), cause: "fragment" }])
	})

	test("skips a change that keeps the URL", () => {
		expect(
			entriesForSameDocumentChange(history, {
				href: "https://a.com/",
				cause: "page-script",
				recordedAt: RECORDED_AT,
			}),
		).toEqual([])
	})
})

describe("URL changes without a navigation event", () => {
	const history = appendToHistory([], [linkEntry("https://a.com/")])

	test("records a URL that no recent entry holds", () => {
		expect(
			entriesForUnexplainedUrlChange(history, {
				href: "chrome://settings/",
				recordedAt: RECORDED_AT,
			}),
		).toEqual([{ ...linkEntry("chrome://settings/"), cause: "other" }])
		expect(
			entriesForUnexplainedUrlChange(history, {
				href: "https://a.com/",
				recordedAt: RECORDED_AT + RECENT_ENTRY_WINDOW_MS + 1,
			}),
		).toHaveLength(1)
	})

	test("skips a URL that a recent entry holds", () => {
		expect(
			entriesForUnexplainedUrlChange(history, {
				href: "https://a.com/",
				recordedAt: RECORDED_AT + 500,
			}),
		).toEqual([])
	})
})

describe("the original entry", () => {
	const tab = { href: "https://a.com/", recordedAt: RECORDED_AT }
	const originalEntry = { ...linkEntry("https://a.com/"), cause: "original" as const }

	test("starts an empty history with the tab's URL", () => {
		expect(originalEntryForEmptyHistory([], tab)).toEqual([originalEntry])
	})

	test("is not added once the history has entries", () => {
		expect(
			originalEntryForEmptyHistory(
				appendToHistory([], [linkEntry("https://b.com/")]),
				tab,
			),
		).toEqual([])
	})
})

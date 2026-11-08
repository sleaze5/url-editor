import {
	type HistoryCause,
	type HistoryEntry,
	hrefWithoutFragment,
	type RedirectStatus,
	type UnnumberedHistoryEntry,
	unnumberedEntry,
} from "./entries.ts"

export interface RedirectHop {
	fromHref: string
	toHref: string
	redirectStatus: RedirectStatus
}

export interface CommittedNavigation {
	startedHref: string | null
	redirectHops: readonly RedirectHop[]
	committedHref: string
	cause: HistoryCause
	wasServerRedirected: boolean
	recordedAt: number
}

const CAUSE_BY_TRANSITION_QUALIFIER: readonly (readonly [string, HistoryCause])[] = [
	["forward_back", "back-forward"],
	["client_redirect", "client-redirect"],
	["from_address_bar", "address-bar"],
]

const CAUSE_BY_TRANSITION_TYPE: Readonly<Record<string, HistoryCause>> = {
	link: "link",
	manual_subframe: "link",
	typed: "address-bar",
	generated: "address-bar",
	keyword: "address-bar",
	keyword_generated: "address-bar",
	auto_bookmark: "bookmark",
	reload: "reload",
	form_submit: "form-submission",
}

const REASON_PHRASE_BY_REDIRECT_STATUS_CODE: Readonly<Record<number, string>> = {
	300: "Multiple Choices",
	301: "Moved Permanently",
	302: "Found",
	303: "See Other",
	307: "Temporary Redirect",
	308: "Permanent Redirect",
}

const REASON_PHRASE_IN_STATUS_LINE = /^\S+\s+\d{3}\s+(?<reasonPhrase>.+)$/u

export function causeOfTransition(
	transitionType: string,
	transitionQualifiers: readonly string[],
): HistoryCause {
	const qualifiedCause = CAUSE_BY_TRANSITION_QUALIFIER.find(([qualifier]) =>
		transitionQualifiers.includes(qualifier),
	)
	return qualifiedCause?.[1] ?? CAUSE_BY_TRANSITION_TYPE[transitionType] ?? "other"
}

export function redirectStatusFromResponse(
	statusCode: number,
	statusLine: string,
): RedirectStatus {
	const reasonPhrase =
		REASON_PHRASE_IN_STATUS_LINE.exec(statusLine.trim())?.groups?.[
			"reasonPhrase"
		] ??
		REASON_PHRASE_BY_REDIRECT_STATUS_CODE[statusCode] ??
		""
	return { code: statusCode, reasonPhrase }
}

function doesRedirectChainEndAt(
	redirectHops: readonly RedirectHop[],
	committedHref: string,
): boolean {
	const lastHop = redirectHops.at(-1)
	return (
		lastHop !== undefined &&
		hrefWithoutFragment(lastHop.toHref) === hrefWithoutFragment(committedHref)
	)
}

export function entriesForCommittedNavigation(
	navigation: CommittedNavigation,
): UnnumberedHistoryEntry[] {
	const { startedHref, committedHref, cause, recordedAt } = navigation
	const [firstHop] = navigation.redirectHops
	if (!firstHop || !doesRedirectChainEndAt(navigation.redirectHops, committedHref)) {
		const wasRedirectedFromStartedHref =
			navigation.wasServerRedirected &&
			startedHref !== null &&
			hrefWithoutFragment(startedHref) !== hrefWithoutFragment(committedHref)
		return wasRedirectedFromStartedHref
			? [
					unnumberedEntry(startedHref, cause, recordedAt),
					unnumberedEntry(committedHref, "server-redirect", recordedAt),
				]
			: [unnumberedEntry(committedHref, cause, recordedAt)]
	}
	const firstHref =
		startedHref !== null &&
		hrefWithoutFragment(startedHref) === hrefWithoutFragment(firstHop.fromHref)
			? startedHref
			: firstHop.fromHref
	const lastHopIndex = navigation.redirectHops.length - 1
	return [
		unnumberedEntry(firstHref, cause, recordedAt),
		...navigation.redirectHops.map((hop, hopIndex) => ({
			...unnumberedEntry(
				hopIndex === lastHopIndex ? committedHref : hop.toHref,
				"server-redirect",
				recordedAt,
			),
			redirectStatus: hop.redirectStatus,
		})),
	]
}

export function entriesForSameDocumentChange(
	history: readonly HistoryEntry[],
	change: { href: string; cause: HistoryCause; recordedAt: number },
): UnnumberedHistoryEntry[] {
	if (history.at(-1)?.href === change.href) return []
	return [unnumberedEntry(change.href, change.cause, change.recordedAt)]
}

export const RECENT_ENTRY_WINDOW_MS = 10_000

export function entriesForUnexplainedUrlChange(
	history: readonly HistoryEntry[],
	change: { href: string; recordedAt: number },
): UnnumberedHistoryEntry[] {
	const isAccountedFor = history.some(
		(entry) =>
			entry.href === change.href &&
			entry.recordedAt >= change.recordedAt - RECENT_ENTRY_WINDOW_MS,
	)
	return isAccountedFor
		? []
		: [unnumberedEntry(change.href, "other", change.recordedAt)]
}

export function originalEntryForEmptyHistory(
	history: readonly HistoryEntry[],
	tab: { href: string; recordedAt: number },
): UnnumberedHistoryEntry[] {
	return history.length === 0
		? [unnumberedEntry(tab.href, "original", tab.recordedAt)]
		: []
}

export type HrefSegmentKind =
	| "scheme"
	| "credentials"
	| "host"
	| "port"
	| "path"
	| "query-name"
	| "query-value"
	| "hash"
	| "punctuation"
	| "unparsed"

export interface HrefSegment {
	kind: HrefSegmentKind
	text: string
}

function appendSegment(
	segments: HrefSegment[],
	kind: HrefSegmentKind,
	text: string,
): void {
	if (text !== "") segments.push({ kind, text })
}

function appendAuthority(segments: HrefSegment[], url: URL): void {
	appendSegment(segments, "punctuation", "//")
	if (url.username !== "" || url.password !== "") {
		appendSegment(segments, "credentials", url.username)
		if (url.password !== "") {
			appendSegment(segments, "punctuation", ":")
			appendSegment(segments, "credentials", url.password)
		}
		appendSegment(segments, "punctuation", "@")
	}
	appendSegment(segments, "host", url.hostname)
	if (url.port !== "") {
		appendSegment(segments, "punctuation", ":")
		appendSegment(segments, "port", url.port)
	}
}

function appendPath(segments: HrefSegment[], pathname: string): void {
	for (const [segmentIndex, pathSegment] of pathname.split("/").entries()) {
		if (segmentIndex > 0) appendSegment(segments, "punctuation", "/")
		appendSegment(segments, "path", pathSegment)
	}
}

function appendQuery(segments: HrefSegment[], search: string): void {
	if (search === "") return
	appendSegment(segments, "punctuation", "?")
	for (const [pairIndex, pair] of search.slice(1).split("&").entries()) {
		if (pairIndex > 0) appendSegment(segments, "punctuation", "&")
		const equalsIndex = pair.indexOf("=")
		if (equalsIndex === -1) {
			appendSegment(segments, "query-name", pair)
		} else {
			appendSegment(segments, "query-name", pair.slice(0, equalsIndex))
			appendSegment(segments, "punctuation", "=")
			appendSegment(segments, "query-value", pair.slice(equalsIndex + 1))
		}
	}
}

export function splitHrefIntoSegments(href: string): readonly HrefSegment[] {
	const unparsed: readonly HrefSegment[] =
		href === "" ? [] : [{ kind: "unparsed", text: href }]
	if (!URL.canParse(href)) return unparsed
	const url = new URL(href)
	const segments: HrefSegment[] = []
	appendSegment(segments, "scheme", url.protocol.slice(0, -1))
	appendSegment(segments, "punctuation", ":")
	if (href.startsWith(`${url.protocol}//`)) appendAuthority(segments, url)
	appendPath(segments, url.pathname)
	appendQuery(segments, url.search)
	if (url.hash !== "") {
		appendSegment(segments, "punctuation", "#")
		appendSegment(segments, "hash", url.hash.slice(1))
	}
	const joinedText = segments.map((segment) => segment.text).join("")
	return joinedText === href ? segments : unparsed
}

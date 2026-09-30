import { decodeComponent, encodeRaw } from "./codec"
import { toUnicodeHost } from "./punycode"

const USERINFO_KEEP = ":@/\\?#"
const PATH_KEEP = "/\\?#"
const QUERY_KEEP = "&=+#"
const HASH_KEEP = "#"

function rawAuthority(url: URL, head: string): string {
	const prefix = `${url.protocol}//`
	if (!head.startsWith(prefix)) return head
	const user = decodeComponent(url.username, USERINFO_KEEP)
	const pass = decodeComponent(url.password, USERINFO_KEEP)
	const credentials =
		user === "" && pass === "" ? "" : `${user}${pass === "" ? "" : `:${pass}`}@`
	const port = url.port === "" ? "" : `:${url.port}`
	return `${prefix}${credentials}${toUnicodeHost(url.hostname)}${port}`
}

export function rawHref(url: URL): string {
	const { href } = url
	const hashAt = href.indexOf("#")
	const beforeHash = hashAt === -1 ? href : href.slice(0, hashAt)
	const queryAt = beforeHash.indexOf("?")
	const beforeQuery = queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt)
	const pathAt = beforeQuery.length - url.pathname.length

	let out = rawAuthority(url, beforeQuery.slice(0, pathAt))
	out += decodeComponent(url.pathname, PATH_KEEP)
	if (queryAt !== -1) {
		out += `?${decodeComponent(beforeHash.slice(queryAt + 1), QUERY_KEEP)}`
	}
	if (hashAt !== -1) out += `#${decodeComponent(href.slice(hashAt + 1), HASH_KEEP)}`
	return out
}

export function parseHref(raw: string): string | null {
	const encoded = encodeRaw(raw)
	return URL.canParse(encoded) ? new URL(encoded).href : null
}

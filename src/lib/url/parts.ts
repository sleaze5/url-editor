import { decodeComponent, encodeRaw } from "./codec.ts"
import { toUnicodeHost } from "./punycode.ts"

export type PartId =
	| "protocol"
	| "username"
	| "password"
	| "hostname"
	| "port"
	| "pathname"
	| "search"
	| "hash"

export interface PartSpec {
	id: PartId
	label: string
	/** Why typed text was rejected, for parts that can reject it. */
	error?: string
	encoded: (url: URL) => string
	raw: (url: URL) => string
	apply: (url: URL, raw: string) => boolean
}

const PATH_KEEP = "/\\"
const QUERY_KEEP = "&=+"
// The hash setter strips a leading "#".
const HASH_KEEP = "#"

const MAX_PORT = 65_535
const PORT_PATTERN = /^\d{1,5}$/u

function isValidPort(raw: string): boolean {
	return raw === "" || (PORT_PATTERN.test(raw) && Number(raw) <= MAX_PORT)
}

function acceptsHost(url: URL, raw: string): boolean {
	const typed = raw.toLowerCase()
	return url.hostname === typed || toUnicodeHost(url.hostname) === typed
}

function textPart(
	id: PartId,
	label: string,
	options: {
		read: (url: URL) => string
		write: (url: URL, value: string) => void
		keep?: string
	},
): PartSpec {
	return {
		id,
		label,
		encoded: options.read,
		raw: (url) => decodeComponent(options.read(url), options.keep),
		apply: (url, raw) => {
			options.write(url, encodeRaw(raw))
			return true
		},
	}
}

export const PARTS: readonly PartSpec[] = [
	{
		id: "protocol",
		label: "Protocol",
		error: "Use a scheme such as https or ftp",
		encoded: (url) => url.protocol.slice(0, -1),
		raw: (url) => url.protocol.slice(0, -1),
		apply: (url, raw) => {
			const scheme = raw.trim().toLowerCase().replace(/:$/u, "")
			url.protocol = scheme
			return url.protocol === `${scheme}:`
		},
	},
	textPart("username", "Username", {
		read: (url) => url.username,
		write: (url, value) => {
			url.username = value
		},
	}),
	textPart("password", "Password", {
		read: (url) => url.password,
		write: (url, value) => {
			url.password = value
		},
	}),
	{
		id: "hostname",
		label: "Hostname",
		error: "Not a valid hostname",
		encoded: (url) => url.hostname,
		raw: (url) => toUnicodeHost(url.hostname),
		apply: (url, raw) => {
			url.hostname = raw.trim()
			return acceptsHost(url, raw.trim())
		},
	},
	{
		id: "port",
		label: "Port",
		error: "Use a number from 0 to 65535",
		encoded: (url) => url.port,
		raw: (url) => url.port,
		apply: (url, raw) => {
			const port = raw.trim()
			if (!isValidPort(port)) return false
			url.port = port
			return true
		},
	},
	textPart("pathname", "Path", {
		read: (url) => url.pathname,
		write: (url, value) => {
			url.pathname = value
		},
		keep: PATH_KEEP,
	}),
	textPart("search", "Query", {
		read: (url) => url.search.slice(1),
		write: (url, value) => {
			url.search = value
		},
		keep: QUERY_KEEP,
	}),
	textPart("hash", "Hash", {
		read: (url) => url.hash.slice(1),
		write: (url, value) => {
			url.hash = value
		},
		keep: HASH_KEEP,
	}),
]

export function getPart(id: PartId): PartSpec {
	const part = PARTS.find((candidate) => candidate.id === id)
	if (!part) throw new Error(`Unknown URL part: ${id}`)
	return part
}

export function isAvailable(id: PartId, url: URL): boolean {
	if (NEEDS_HOST.has(id)) return url.hostname !== "" && url.protocol !== "file:"
	if (id === "hostname") return url.href.startsWith(`${url.protocol}//`)
	return true
}

const NEEDS_HOST: ReadonlySet<PartId> = new Set(["username", "password", "port"])

export function isRequired(id: PartId): boolean {
	return id === "protocol" || id === "pathname"
}

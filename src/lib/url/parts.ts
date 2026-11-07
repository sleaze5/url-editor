import { decodeComponent, encodeRaw } from "./codec.ts"
import { toUnicodeHost } from "./punycode.ts"

export type PartId =
	"protocol" | "username" | "password" | "hostname" | "port" | "pathname" | "hash"

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
// The hash setter strips a leading "#".
const HASH_KEEP = "#"

const MAX_PORT = 65_535
const PORT_PATTERN = /^\d{1,5}$/u

const NEEDS_HOST: ReadonlySet<PartId> = new Set(["username", "password", "port"])

function isValidPort(raw: string): boolean {
	return raw === "" || (PORT_PATTERN.test(raw) && Number(raw) <= MAX_PORT)
}

function acceptsHost(url: URL, raw: string): boolean {
	const typed = raw.toLowerCase()
	return url.hostname === typed || toUnicodeHost(url.hostname) === typed
}

function textPart(
	id: "username" | "password" | "pathname" | "hash",
	label: string,
	options: { read?: (url: URL) => string; keep?: string } = {},
): PartSpec {
	const read = options.read ?? ((url: URL) => url[id])
	return {
		id,
		label,
		encoded: read,
		raw: (url) => decodeComponent(read(url), options.keep),
		apply: (url, raw) => {
			url[id] = encodeRaw(raw)
			return true
		},
	}
}

export const PARTS: Readonly<Record<PartId, PartSpec>> = {
	protocol: {
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
	username: textPart("username", "Username"),
	password: textPart("password", "Password"),
	hostname: {
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
	port: {
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
	pathname: textPart("pathname", "Path", { keep: PATH_KEEP }),
	hash: textPart("hash", "Hash", {
		read: (url) => url.hash.slice(1),
		keep: HASH_KEEP,
	}),
}

export function isAvailable(id: PartId, url: URL): boolean {
	if (NEEDS_HOST.has(id)) return url.hostname !== "" && url.protocol !== "file:"
	if (id === "hostname") return url.href.startsWith(`${url.protocol}//`)
	return true
}

export function isRequired(id: PartId): boolean {
	return id === "protocol" || id === "pathname"
}

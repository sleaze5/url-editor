import { decodeComponent, encodeTypedText } from "./codec.ts"
import { toUnicodeHostname } from "./punycode.ts"

export type UrlPartId =
	"protocol" | "username" | "password" | "hostname" | "port" | "pathname" | "hash"

export interface UrlPart {
	id: UrlPartId
	label: string
	/** Why typed text was rejected, for parts that can reject it. */
	rejectionMessage?: string
	readEncoded: (url: URL) => string
	/** The text to show for editing: decoded, but still encoded where decoding would change the URL. */
	readDecoded: (url: URL) => string
	/** Writes the typed text into `url`, and returns false when the part rejects it. */
	applyTypedText: (url: URL, typedText: string) => boolean
}

const PATH_CHARACTERS_KEPT_ENCODED = "/\\"
// The hash setter strips a leading "#".
const HASH_CHARACTERS_KEPT_ENCODED = "#"

const MAX_PORT = 65_535
const PORT_DIGITS = /^\d{1,5}$/u

const PARTS_THAT_NEED_A_HOST: ReadonlySet<UrlPartId> = new Set([
	"username",
	"password",
	"port",
])

function isValidPort(typedPort: string): boolean {
	return (
		typedPort === "" ||
		(PORT_DIGITS.test(typedPort) && Number(typedPort) <= MAX_PORT)
	)
}

function didUrlAcceptHostname(url: URL, typedHostname: string): boolean {
	const lowercaseHostname = typedHostname.toLowerCase()
	return (
		url.hostname === lowercaseHostname ||
		toUnicodeHostname(url.hostname) === lowercaseHostname
	)
}

function freeTextPart(
	id: "username" | "password" | "pathname" | "hash",
	label: string,
	options: { readEncoded?: (url: URL) => string; keepEncoded?: string } = {},
): UrlPart {
	const readEncoded = options.readEncoded ?? ((url: URL) => url[id])
	return {
		id,
		label,
		readEncoded,
		readDecoded: (url) => decodeComponent(readEncoded(url), options.keepEncoded),
		applyTypedText: (url, typedText) => {
			url[id] = encodeTypedText(typedText)
			return true
		},
	}
}

export const URL_PARTS: Readonly<Record<UrlPartId, UrlPart>> = {
	protocol: {
		id: "protocol",
		label: "Protocol",
		rejectionMessage: "Use a scheme such as https or ftp",
		readEncoded: (url) => url.protocol.slice(0, -1),
		readDecoded: (url) => url.protocol.slice(0, -1),
		applyTypedText: (url, typedText) => {
			const scheme = typedText.trim().toLowerCase().replace(/:$/u, "")
			url.protocol = scheme
			return url.protocol === `${scheme}:`
		},
	},
	username: freeTextPart("username", "Username"),
	password: freeTextPart("password", "Password"),
	hostname: {
		id: "hostname",
		label: "Hostname",
		rejectionMessage: "Not a valid hostname",
		readEncoded: (url) => url.hostname,
		readDecoded: (url) => toUnicodeHostname(url.hostname),
		applyTypedText: (url, typedText) => {
			const typedHostname = typedText.trim()
			url.hostname = typedHostname
			return didUrlAcceptHostname(url, typedHostname)
		},
	},
	port: {
		id: "port",
		label: "Port",
		rejectionMessage: "Use a number from 0 to 65535",
		readEncoded: (url) => url.port,
		readDecoded: (url) => url.port,
		applyTypedText: (url, typedText) => {
			const typedPort = typedText.trim()
			if (!isValidPort(typedPort)) return false
			url.port = typedPort
			return true
		},
	},
	pathname: freeTextPart("pathname", "Path", {
		keepEncoded: PATH_CHARACTERS_KEPT_ENCODED,
	}),
	hash: freeTextPart("hash", "Hash", {
		readEncoded: (url) => url.hash.slice(1),
		keepEncoded: HASH_CHARACTERS_KEPT_ENCODED,
	}),
}

export function isPartAvailable(partId: UrlPartId, url: URL): boolean {
	if (PARTS_THAT_NEED_A_HOST.has(partId)) {
		return url.hostname !== "" && url.protocol !== "file:"
	}
	if (partId === "hostname") return url.href.startsWith(`${url.protocol}//`)
	return true
}

export function isPartAlwaysShown(partId: UrlPartId): boolean {
	return partId === "protocol" || partId === "pathname"
}

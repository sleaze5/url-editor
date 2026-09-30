const ENCODED_RUN = /(?:%[\da-f]{2})+/giu
const BARE_PERCENT = /%(?![\da-f]{2})/giu
const LINE_BREAKS = /[\n\r]+/gu
const INVISIBLE = /[\u00A0\u00AD\u200B-\u200F\u2028-\u202E\u2060-\u2069\uE000\uFEFF]/u
const FIRST_PRINTABLE = 0x20
const DEL = 0x7f
const PERCENT_MARK = "\uE000"
const PERCENT_MARKS = /\uE000([\da-f]{2})?/giu

const utf8Decoder = new TextDecoder("utf-8", { fatal: true })
const utf8Encoder = new TextEncoder()

export function encodeChar(ch: string): string {
	let out = ""
	for (const byte of utf8Encoder.encode(ch)) {
		out += `%${byte.toString(16).toUpperCase().padStart(2, "0")}`
	}
	return out
}

function isInvisible(ch: string): boolean {
	const code = ch.codePointAt(0) ?? 0
	return code < FIRST_PRINTABLE || code === DEL || INVISIBLE.test(ch)
}

function decodeRun(run: string, keep: string): string {
	const bytes = new Uint8Array(run.length / 3)
	for (let i = 0; i < bytes.length; i++) {
		bytes[i] = Number.parseInt(run.slice(i * 3 + 1, i * 3 + 3), 16)
	}
	let text: string
	try {
		text = utf8Decoder.decode(bytes)
	} catch {
		return run
	}
	let out = ""
	for (const ch of text) {
		if (ch === "%") out += PERCENT_MARK
		else if (keep.includes(ch) || isInvisible(ch)) out += encodeChar(ch)
		else out += ch
	}
	return out
}

export function decodeComponent(value: string, keep = ""): string {
	if (!value.includes("%")) return value
	return value
		.replace(ENCODED_RUN, (run) => decodeRun(run, keep))
		.replace(PERCENT_MARKS, (_, hex?: string) =>
			hex === undefined ? "%" : `%25${hex}`,
		)
}

export function encodeRaw(raw: string): string {
	return raw.replace(LINE_BREAKS, "").replace(BARE_PERCENT, "%25")
}

// Everything the WHATWG query setter would escape, plus the given delimiters, so
// setting `search` never rewrites an already-encoded param.
function queryEncoder(delimiters: string): (raw: string) => string {
	const pattern = new RegExp(
		String.raw`%(?![\da-f]{2})|[^\x21-\x7E]|["#'<>${delimiters}]`,
		"giu",
	)
	return (raw) => raw.replace(LINE_BREAKS, "").replace(pattern, encodeChar)
}

export const encodeParamKey = queryEncoder("&=+")
export const encodeParamValue = queryEncoder("&+")

export function decodeParam(value: string): string {
	return decodeComponent(value.replaceAll("+", " "))
}

const PERCENT_ESCAPE_RUN = /(?:%[\da-f]{2})+/giu
const PERCENT_WITHOUT_HEX_DIGITS = /%(?![\da-f]{2})/giu
const LINE_BREAKS = /[\n\r]+/gu
const INVISIBLE_CHARACTERS =
	/[\u00A0\u00AD\u200B-\u200F\u2028-\u202E\u2060-\u2069\uFEFF]/u
const FIRST_PRINTABLE_CODE_POINT = 0x20
const DELETE_CODE_POINT = 0x7f
const DECODED_PERCENT_PLACEHOLDER = "\uE000"
const PLACEHOLDER_WITH_FOLLOWING_HEX = /\uE000([\da-f]{2})?/giu

const strictUtf8Decoder = new TextDecoder("utf-8", { fatal: true })
const utf8Encoder = new TextEncoder()

function percentEncodeCharacter(character: string): string {
	let escapes = ""
	for (const byte of utf8Encoder.encode(character)) {
		escapes += `%${byte.toString(16).toUpperCase().padStart(2, "0")}`
	}
	return escapes
}

function isInvisibleCharacter(character: string): boolean {
	const codePoint = character.codePointAt(0) ?? 0
	return (
		codePoint < FIRST_PRINTABLE_CODE_POINT ||
		codePoint === DELETE_CODE_POINT ||
		INVISIBLE_CHARACTERS.test(character)
	)
}

function shouldStayEncoded(character: string, keepEncoded: string): boolean {
	return (
		character === DECODED_PERCENT_PLACEHOLDER ||
		keepEncoded.includes(character) ||
		isInvisibleCharacter(character)
	)
}

function decodeEscapeRun(escapeRun: string, keepEncoded: string): string {
	const bytes = new Uint8Array(escapeRun.length / 3)
	for (let byteIndex = 0; byteIndex < bytes.length; byteIndex++) {
		const hexStart = byteIndex * 3 + 1
		bytes[byteIndex] = Number.parseInt(escapeRun.slice(hexStart, hexStart + 2), 16)
	}
	let decodedText: string
	try {
		decodedText = strictUtf8Decoder.decode(bytes)
	} catch {
		return escapeRun
	}
	let decodedRun = ""
	for (const character of decodedText) {
		if (character === "%") decodedRun += DECODED_PERCENT_PLACEHOLDER
		else if (shouldStayEncoded(character, keepEncoded)) {
			decodedRun += percentEncodeCharacter(character)
		} else decodedRun += character
	}
	return decodedRun
}

/** Decodes percent escapes, except the characters in `keepEncoded`, invisible characters, and invalid UTF-8. */
export function decodeComponent(encodedComponent: string, keepEncoded = ""): string {
	if (!encodedComponent.includes("%")) return encodedComponent
	return encodedComponent
		.replaceAll(PERCENT_ESCAPE_RUN, (escapeRun) =>
			decodeEscapeRun(escapeRun, keepEncoded),
		)
		.replaceAll(
			PLACEHOLDER_WITH_FOLLOWING_HEX,
			(_placeholder, followingHex?: string) =>
				followingHex === undefined ? "%" : `%25${followingHex}`,
		)
}

/** Prepares text the user typed for a URL setter, which encodes everything else itself. */
export function encodeTypedText(typedText: string): string {
	return typedText
		.replaceAll(LINE_BREAKS, "")
		.replaceAll(PERCENT_WITHOUT_HEX_DIGITS, "%25")
}

// Everything the WHATWG query setter would escape, plus the given delimiters, so
// setting `search` never rewrites an already-encoded param.
function createQueryEncoder(delimiters: string): (typedText: string) => string {
	const charactersToEscape = new RegExp(
		String.raw`%(?![\da-f]{2})|[^\x21-\x7E]|["#'<>${delimiters}]`,
		"giu",
	)
	return (typedText) =>
		typedText
			.replaceAll(LINE_BREAKS, "")
			.replaceAll(charactersToEscape, percentEncodeCharacter)
}

export const encodeParamKey = createQueryEncoder("&=+")
export const encodeParamValue = createQueryEncoder("&+")

export function decodeParam(encodedParam: string): string {
	return decodeComponent(encodedParam.replaceAll("+", " "))
}

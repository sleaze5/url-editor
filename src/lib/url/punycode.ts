const BASE = 36
const T_MIN = 1
const T_MAX = 26
const SKEW = 38
const DAMP = 700
const INITIAL_BIAS = 72
const FIRST_NON_ASCII_CODE_POINT = 0x80
const INITIAL_CODE_POINT = FIRST_NON_ASCII_CODE_POINT
const MAX_CODE_POINT = 0x10_ff_ff
const ACE_PREFIX = "xn--"

function adaptBias(
	delta: number,
	codePointCount: number,
	isFirstDelta: boolean,
): number {
	let scaledDelta = isFirstDelta ? Math.floor(delta / DAMP) : delta >> 1
	scaledDelta += Math.floor(scaledDelta / codePointCount)
	let bias = 0
	while (scaledDelta > ((BASE - T_MIN) * T_MAX) >> 1) {
		scaledDelta = Math.floor(scaledDelta / (BASE - T_MIN))
		bias += BASE
	}
	return bias + Math.floor(((BASE - T_MIN + 1) * scaledDelta) / (scaledDelta + SKEW))
}

function digitValue(codePoint: number): number {
	if (codePoint >= 0x30 && codePoint <= 0x39) return codePoint - 0x30 + 26
	if (codePoint >= 0x41 && codePoint <= 0x5a) return codePoint - 0x41
	if (codePoint >= 0x61 && codePoint <= 0x7a) return codePoint - 0x61
	return BASE
}

function digitThreshold(baseMultiple: number, bias: number): number {
	if (baseMultiple <= bias) return T_MIN
	if (baseMultiple >= bias + T_MAX) return T_MAX
	return baseMultiple - bias
}

interface ReadCursor {
	position: number
}

function readDelta(encoded: string, cursor: ReadCursor, bias: number): number | null {
	let delta = 0
	let weight = 1
	for (let baseMultiple = BASE; ; baseMultiple += BASE) {
		if (cursor.position >= encoded.length) return null
		const digit = digitValue(encoded.codePointAt(cursor.position++) ?? 0)
		if (digit >= BASE) return null
		delta += digit * weight
		const threshold = digitThreshold(baseMultiple, bias)
		if (digit < threshold) return delta
		weight *= BASE - threshold
	}
}

function decodePunycodeLabel(encoded: string): string | null {
	const basicLength = Math.max(encoded.lastIndexOf("-"), 0)
	const codePoints = Array.from(
		encoded.slice(0, basicLength),
		(character) => character.codePointAt(0) ?? 0,
	)
	const cursor: ReadCursor = { position: basicLength > 0 ? basicLength + 1 : 0 }
	let codePoint = INITIAL_CODE_POINT
	let bias = INITIAL_BIAS
	let insertIndex = 0
	while (cursor.position < encoded.length) {
		const delta = readDelta(encoded, cursor, bias)
		if (delta === null) return null
		const lengthAfterInsert = codePoints.length + 1
		bias = adaptBias(delta, lengthAfterInsert, insertIndex === 0)
		insertIndex += delta
		codePoint += Math.floor(insertIndex / lengthAfterInsert)
		insertIndex %= lengthAfterInsert
		if (codePoint > MAX_CODE_POINT) return null
		codePoints.splice(insertIndex++, 0, codePoint)
	}
	return codePoints.every((decoded) => decoded < FIRST_NON_ASCII_CODE_POINT)
		? null
		: String.fromCodePoint(...codePoints)
}

export function toUnicodeHostname(hostname: string): string {
	if (!hostname.includes(ACE_PREFIX)) return hostname
	return hostname
		.split(".")
		.map((label) =>
			label.toLowerCase().startsWith(ACE_PREFIX)
				? (decodePunycodeLabel(label.slice(ACE_PREFIX.length)) ?? label)
				: label,
		)
		.join(".")
}

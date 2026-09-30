const BASE = 36
const T_MIN = 1
const T_MAX = 26
const SKEW = 38
const DAMP = 700
const INITIAL_BIAS = 72
const INITIAL_N = 128
const MAX_CODE_POINT = 0x10_ff_ff

function adapt(delta: number, numPoints: number, first: boolean): number {
	let d = first ? Math.floor(delta / DAMP) : delta >> 1
	d += Math.floor(d / numPoints)
	let k = 0
	while (d > ((BASE - T_MIN) * T_MAX) >> 1) {
		d = Math.floor(d / (BASE - T_MIN))
		k += BASE
	}
	return k + Math.floor(((BASE - T_MIN + 1) * d) / (d + SKEW))
}

function digitOf(code: number): number {
	if (code >= 0x30 && code <= 0x39) return code - 22
	if (code >= 0x41 && code <= 0x5a) return code - 0x41
	if (code >= 0x61 && code <= 0x7a) return code - 0x61
	return BASE
}

function threshold(k: number, bias: number): number {
	if (k <= bias) return T_MIN
	if (k >= bias + T_MAX) return T_MAX
	return k - bias
}

interface Cursor {
	pos: number
}

function readDelta(input: string, cursor: Cursor, bias: number): number | null {
	let delta = 0
	let weight = 1
	for (let k = BASE; ; k += BASE) {
		if (cursor.pos >= input.length) return null
		const digit = digitOf(input.codePointAt(cursor.pos++) ?? 0)
		if (digit >= BASE) return null
		delta += digit * weight
		const t = threshold(k, bias)
		if (digit < t) return delta
		weight *= BASE - t
	}
}

export function decodeLabel(input: string): string | null {
	const basicEnd = Math.max(input.lastIndexOf("-"), 0)
	const output = Array.from(input.slice(0, basicEnd), (ch) => ch.codePointAt(0) ?? 0)
	const cursor: Cursor = { pos: basicEnd > 0 ? basicEnd + 1 : 0 }
	let n = INITIAL_N
	let bias = INITIAL_BIAS
	let i = 0
	while (cursor.pos < input.length) {
		const delta = readDelta(input, cursor, bias)
		if (delta === null) return null
		const length = output.length + 1
		bias = adapt(delta, length, i === 0)
		i += delta
		n += Math.floor(i / length)
		i %= length
		if (n > MAX_CODE_POINT) return null
		output.splice(i++, 0, n)
	}
	// A valid xn-- label always decodes to something non-ASCII.
	return output.every((code) => code < INITIAL_N)
		? null
		: String.fromCodePoint(...output)
}

export function toUnicodeHost(hostname: string): string {
	if (!hostname.includes("xn--")) return hostname
	return hostname
		.split(".")
		.map((label) =>
			label.toLowerCase().startsWith("xn--")
				? (decodeLabel(label.slice(4)) ?? label)
				: label,
		)
		.join(".")
}

import { decodeParam, encodeParamKey, encodeParamValue, encodeRaw } from "./codec.ts"
import { BLANK_PARAM, type Param, serializeParams } from "./params.ts"
import type { PartSpec } from "./parts.ts"

export function editHref(base: string, raw: string): string | null {
	if (raw === base) return base
	const encoded = encodeRaw(raw)
	return URL.canParse(encoded) ? new URL(encoded).href : null
}

export function editQuery(base: string, raw: string): string {
	const url = new URL(base)
	if (raw === url.search.slice(1)) return base
	url.search = encodeRaw(raw)
	return url.href
}

export function editPart(base: string, part: PartSpec, raw: string): string | null {
	const url = new URL(base)
	if (raw === part.raw(url)) return base
	return part.apply(url, raw) ? url.href : null
}

export type ParamField = "key" | "value"

export interface ParamEdit {
	index: number
	field: ParamField
	raw: string
}

const ENCODERS = { key: encodeParamKey, value: encodeParamValue }

export function editParam(base: readonly Param[], edit: ParamEdit): Param[] {
	const params = [...base]
	const original = base[edit.index] ?? BLANK_PARAM
	params[edit.index] = {
		...original,
		[edit.field]:
			edit.raw === decodeParam(original[edit.field])
				? original[edit.field]
				: ENCODERS[edit.field](edit.raw),
	}
	return params
}

export function withParams(href: string, params: readonly Param[]): string {
	const url = new URL(href)
	url.search = serializeParams(params)
	return url.href
}

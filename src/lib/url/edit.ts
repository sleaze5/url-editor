import { decodeParam, encodeParamKey, encodeParamValue } from "./codec"
import { parseHref, rawHref } from "./href"
import { type Param, serializeParams } from "./params"
import type { PartSpec } from "./parts"

export function editHref(base: string, raw: string): string | null {
	if (raw === rawHref(new URL(base))) return base
	return parseHref(raw)
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

function encodeField(field: ParamField, raw: string): string {
	return field === "key" ? encodeParamKey(raw) : encodeParamValue(raw)
}

export function editParam(base: readonly Param[], edit: ParamEdit): Param[] {
	const params = [...base]
	const original = base[edit.index] ?? { key: "", value: "", hasValue: true }
	const unchanged = edit.raw === decodeParam(original[edit.field])
	const encoded = unchanged ? original[edit.field] : encodeField(edit.field, edit.raw)
	params[edit.index] = {
		...original,
		[edit.field]: encoded,
		hasValue: original.hasValue || (edit.field === "value" && encoded !== ""),
	}
	return params
}

export function withParams(href: string, params: readonly Param[]): string {
	const url = new URL(href)
	url.search = serializeParams(params)
	return url.href
}

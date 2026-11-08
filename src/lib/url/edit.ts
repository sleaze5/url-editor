import {
	decodeParam,
	encodeParamKey,
	encodeParamValue,
	encodeTypedText,
} from "./codec.ts"
import { BLANK_PARAM, type Param, serializeParams } from "./params.ts"
import type { UrlPart } from "./parts.ts"

export function editHref(baseHref: string, typedHref: string): string | null {
	if (typedHref === baseHref) return baseHref
	const encodedHref = encodeTypedText(typedHref)
	return URL.canParse(encodedHref) ? new URL(encodedHref).href : null
}

export function editQuery(baseHref: string, typedQuery: string): string {
	const url = new URL(baseHref)
	if (typedQuery === url.search.slice(1)) return baseHref
	url.search = encodeTypedText(typedQuery)
	return url.href
}

export function editPart(
	baseHref: string,
	part: UrlPart,
	typedText: string,
): string | null {
	const url = new URL(baseHref)
	if (typedText === part.readDecoded(url)) return baseHref
	return part.applyTypedText(url, typedText) ? url.href : null
}

export type ParamField = "key" | "value"

export interface ParamEdit {
	paramIndex: number
	field: ParamField
	typedText: string
}

const ENCODER_BY_PARAM_FIELD = { key: encodeParamKey, value: encodeParamValue }

export function editParam(baseParams: readonly Param[], edit: ParamEdit): Param[] {
	const editedParams = [...baseParams]
	const originalParam = baseParams[edit.paramIndex] ?? BLANK_PARAM
	const originalText = originalParam[edit.field]
	editedParams[edit.paramIndex] = {
		...originalParam,
		[edit.field]:
			edit.typedText === decodeParam(originalText)
				? originalText
				: ENCODER_BY_PARAM_FIELD[edit.field](edit.typedText),
	}
	return editedParams
}

export function hrefWithParams(href: string, params: readonly Param[]): string {
	const url = new URL(href)
	url.search = serializeParams(params)
	return url.href
}

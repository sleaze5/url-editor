import { createMemo, createSignal } from "solid-js"

import type { EditorDraft } from "../lib/history/drafts.ts"
import {
	editHref,
	editParam,
	editPart,
	editQuery,
	hrefWithParams,
	type ParamEdit,
} from "../lib/url/edit.ts"
import { BLANK_PARAM, moveParam, type Param, parseParams } from "../lib/url/params.ts"
import type { UrlPart } from "../lib/url/parts.ts"

interface StateAtFocus {
	href: string
	params: readonly Param[]
}

export function createEditorDraft() {
	const [editedHref, setEditedHref] = createSignal("")
	const [params, setParams] = createSignal<readonly Param[]>([])
	const [editedFromEntryNumber, setEditedFromEntryNumber] = createSignal<
		number | null
	>(null)

	const editedUrl = createMemo(() =>
		editedHref() === "" ? null : new URL(editedHref()),
	)

	let stateAtFocus: StateAtFocus = { href: "", params: [] }

	const loadHref = (nextHref: string): void => {
		setEditedHref(nextHref)
		setParams(parseParams(new URL(nextHref).search))
	}

	const loadHrefIfValid = (nextHref: string | null): boolean => {
		if (nextHref !== null) loadHref(nextHref)
		return nextHref !== null
	}

	const setParamsAndHref = (nextParams: readonly Param[]): void => {
		setParams(nextParams)
		setEditedHref(hrefWithParams(editedHref(), nextParams))
	}

	return {
		editedHref,
		editedUrl,
		params,
		editedFromEntryNumber,
		currentDraft: (): EditorDraft => ({
			editedHref: editedHref(),
			editedFromEntryNumber: editedFromEntryNumber(),
		}),
		loadDraft: (draft: EditorDraft): void => {
			loadHref(draft.editedHref)
			setEditedFromEntryNumber(draft.editedFromEntryNumber)
		},
		rememberStateAtFocus: (): void => {
			stateAtFocus = { href: editedHref(), params: params() }
		},
		editFullUrl: (typedHref: string): boolean =>
			loadHrefIfValid(editHref(stateAtFocus.href, typedHref)),
		editQuery: (typedQuery: string): boolean =>
			loadHrefIfValid(editQuery(stateAtFocus.href, typedQuery)),
		editPart: (part: UrlPart, typedText: string): boolean =>
			loadHrefIfValid(editPart(stateAtFocus.href, part, typedText)),
		editParamText: (edit: ParamEdit): void => {
			setParamsAndHref(editParam(stateAtFocus.params, edit))
		},
		addBlankParam: (): void => {
			setParams([...params(), BLANK_PARAM])
		},
		moveParamTo: (fromIndex: number, toIndex: number): void => {
			setParamsAndHref(moveParam(params(), fromIndex, toIndex))
		},
		removeParam: (removedIndex: number): void => {
			setParamsAndHref(
				params().filter((_, paramIndex) => paramIndex !== removedIndex),
			)
		},
	}
}

export type EditorDraftState = ReturnType<typeof createEditorDraft>

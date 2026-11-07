import Plus from "@lucide/solid/icons/plus"
import { createMemo, createSignal, For, Show } from "solid-js"

import {
	isPartAvailable,
	isPartAlwaysShown,
	URL_PARTS,
	type UrlPartId,
	type UrlPart,
} from "../lib/url/parts.ts"
import { PartField } from "./PartField.tsx"

interface PartsEditorProps {
	url: URL
	onEdit: (part: UrlPart, typedText: string) => boolean
}

const PART_ROWS: readonly (readonly UrlPartId[])[] = [
	["protocol", "hostname", "port"],
	["username", "password"],
	["pathname"],
	["hash"],
]

const FIXED_COLUMN_WIDTHS: Partial<Record<UrlPartId, string>> = {
	protocol: "72px",
	port: "64px",
}

const gridTemplateColumns = (row: readonly UrlPartId[]): string =>
	row.map((partId) => FIXED_COLUMN_WIDTHS[partId] ?? "minmax(0, 1fr)").join(" ")

export function PartsEditor(props: PartsEditorProps) {
	const [revealedPartIds, setRevealedPartIds] = createSignal<readonly UrlPartId[]>([])
	const [partIdToFocus, setPartIdToFocus] = createSignal<UrlPartId | null>(null)

	const isPartVisible = (partId: UrlPartId): boolean =>
		isPartAvailable(partId, props.url) &&
		(isPartAlwaysShown(partId) ||
			revealedPartIds().includes(partId) ||
			URL_PARTS[partId].readEncoded(props.url) !== "")

	const visibleRows = createMemo(() =>
		PART_ROWS.map((row) => row.filter((partId) => isPartVisible(partId))).filter(
			(row) => row.length > 0,
		),
	)
	const hiddenPartIds = createMemo(() =>
		PART_ROWS.flat().filter(
			(partId) => isPartAvailable(partId, props.url) && !isPartVisible(partId),
		),
	)

	function revealPart(partId: UrlPartId): void {
		setRevealedPartIds((partIds) =>
			partIds.includes(partId) ? partIds : [...partIds, partId],
		)
	}

	function handlePartBlur(partId: UrlPartId): void {
		setPartIdToFocus((focusedId) => (focusedId === partId ? null : focusedId))
		if (URL_PARTS[partId].readEncoded(props.url) === "") {
			setRevealedPartIds((partIds) =>
				partIds.filter((revealedId) => revealedId !== partId),
			)
		}
	}

	function revealAndFocusPart(partId: UrlPartId): void {
		revealPart(partId)
		setPartIdToFocus(partId)
	}

	return (
		<section aria-label="URL parts" class="flex flex-col gap-2">
			<For each={visibleRows()} keyed={(row) => row.join(" ")}>
				{(row) => (
					<div
						class="grid gap-1.5"
						style={{ "grid-template-columns": gridTemplateColumns(row()) }}>
						<For each={row()}>
							{(partId, cellIndex) => (
								<PartField
									part={URL_PARTS[partId]}
									url={props.url}
									onEdit={props.onEdit}
									onFocus={() => {
										revealPart(partId)
									}}
									onBlur={() => {
										handlePartBlur(partId)
									}}
									autofocus={partId === partIdToFocus()}
									rejectionMessageAlign={
										cellIndex() > 0 &&
										cellIndex() === row().length - 1
											? "end"
											: "start"
									}
								/>
							)}
						</For>
					</div>
				)}
			</For>
			<Show when={hiddenPartIds().length > 0}>
				<fieldset class="flex min-w-0 flex-wrap gap-1.5">
					<legend class="sr-only">Add a URL part</legend>
					<For each={hiddenPartIds()}>
						{(partId) => (
							<button
								type="button"
								onClick={() => {
									revealAndFocusPart(partId)
								}}
								class="inline-flex h-6 items-center gap-0.75 rounded-sm border border-dashed border-line-strong pr-2 pl-1.5 text-xs font-medium text-fg-muted transition-[color,border-color,background-color,scale] ease-out hover:border-fg-muted hover:bg-hover hover:text-fg active:scale-(--press-scale)">
								<Plus size={12} strokeWidth={2.25} aria-hidden="true" />
								{URL_PARTS[partId].label}
							</button>
						)}
					</For>
				</fieldset>
			</Show>
		</section>
	)
}

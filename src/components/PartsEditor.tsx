import Plus from "@lucide/solid/icons/plus"
import { createMemo, createSignal, For, Show } from "solid-js"

import {
	isAvailable,
	isRequired,
	PARTS,
	type PartId,
	type PartSpec,
} from "../lib/url/parts.ts"
import { PartField } from "./PartField.tsx"

interface PartsEditorProps {
	url: URL
	onEdit: (part: PartSpec, raw: string) => boolean
}

const ROWS: readonly (readonly PartId[])[] = [
	["protocol", "hostname", "port"],
	["username", "password"],
	["pathname"],
	["hash"],
]

const WIDTHS: Partial<Record<PartId, string>> = { protocol: "72px", port: "64px" }

const columns = (row: readonly PartId[]): string =>
	row.map((id) => WIDTHS[id] ?? "minmax(0, 1fr)").join(" ")

export function PartsEditor(props: PartsEditorProps) {
	const [revealed, setRevealed] = createSignal<readonly PartId[]>([])
	const [focusId, setFocusId] = createSignal<PartId | null>(null)

	const isVisible = (id: PartId): boolean =>
		isAvailable(id, props.url) &&
		(isRequired(id) ||
			revealed().includes(id) ||
			PARTS[id].encoded(props.url) !== "")

	const rows = createMemo(() =>
		ROWS.map((row) => row.filter((id) => isVisible(id))).filter(
			(row) => row.length > 0,
		),
	)
	const hidden = createMemo(() =>
		ROWS.flat().filter((id) => isAvailable(id, props.url) && !isVisible(id)),
	)

	function reveal(id: PartId): void {
		setRevealed((list) => (list.includes(id) ? list : [...list, id]))
	}

	function settle(id: PartId): void {
		setFocusId((current) => (current === id ? null : current))
		if (PARTS[id].encoded(props.url) === "") {
			setRevealed((list) => list.filter((other) => other !== id))
		}
	}

	function open(id: PartId): void {
		reveal(id)
		setFocusId(id)
	}

	return (
		<section aria-label="URL parts" class="flex flex-col gap-2">
			<For each={rows()} keyed={(row) => row.join(" ")}>
				{(row) => (
					<div
						class="grid gap-1.5"
						style={{ "grid-template-columns": columns(row()) }}>
						<For each={row()}>
							{(id, cell) => (
								<PartField
									part={PARTS[id]}
									url={props.url}
									onEdit={props.onEdit}
									onFocus={() => {
										reveal(id)
									}}
									onBlur={() => {
										settle(id)
									}}
									autofocus={id === focusId()}
									errorAlign={
										cell() > 0 && cell() === row().length - 1
											? "end"
											: "start"
									}
								/>
							)}
						</For>
					</div>
				)}
			</For>
			<Show when={hidden().length > 0}>
				<fieldset class="flex min-w-0 flex-wrap gap-1.5">
					<legend class="sr-only">Add a URL part</legend>
					<For each={hidden()}>
						{(id) => (
							<button
								type="button"
								onClick={() => {
									open(id)
								}}
								class="inline-flex h-6 items-center gap-0.75 rounded-sm border border-dashed border-line-strong pr-2 pl-1.5 text-xs font-medium text-fg-muted transition-[color,border-color,background-color,scale] ease-out hover:border-fg-muted hover:bg-hover hover:text-fg active:scale-(--press-scale)">
								<Plus size={12} strokeWidth={2.25} aria-hidden="true" />
								{PARTS[id].label}
							</button>
						)}
					</For>
				</fieldset>
			</Show>
		</section>
	)
}

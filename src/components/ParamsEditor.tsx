import GripVertical from "@lucide/solid/icons/grip-vertical"
import Plus from "@lucide/solid/icons/plus"
import X from "@lucide/solid/icons/x"
import { createSignal, flush, For, onSettled, Show } from "solid-js"

import { decodeParam } from "../lib/url/codec.ts"
import type { ParamEdit, ParamField } from "../lib/url/edit.ts"
import type { Param } from "../lib/url/params.ts"
import { Field } from "./Field.tsx"
import { IconButton } from "./IconButton.tsx"
import { QueryField } from "./QueryField.tsx"
import { Tooltip } from "./Tooltip.tsx"

interface ParamsEditorProps {
	url: URL
	params: readonly Param[]
	onQueryEdit: (typedQuery: string) => boolean
	onParamEdit: (edit: ParamEdit) => void
	onMoveParam: (fromIndex: number, toIndex: number) => void
	onAddParam: () => void
	onRemoveParam: (paramIndex: number) => void
}

const isBlank = (param: Param): boolean => param.key === "" && param.value === ""

export function ParamsEditor(props: ParamsEditorProps) {
	const rowElements: HTMLElement[] = []
	const [highlightedRowIndex, setHighlightedRowIndex] = createSignal(-1)
	const [rowIndexToFocus, setRowIndexToFocus] = createSignal(-1)
	// The row being dragged or moved with the arrow keys, read without waiting for a flush.
	let movingRowIndex = -1
	let isPointerDown = false

	function trackPointerDown(event: PointerEvent): void {
		isPointerDown = event.type === "pointerdown"
	}

	onSettled(() => {
		window.addEventListener("pointerdown", trackPointerDown)
		window.addEventListener("pointerup", trackPointerDown)
		window.addEventListener("blur", endDrag)
		return () => {
			window.removeEventListener("pointerdown", trackPointerDown)
			window.removeEventListener("pointerup", trackPointerDown)
			window.removeEventListener("blur", endDrag)
		}
	})

	function paramTextEditor(
		paramIndex: number,
		field: ParamField,
	): (typedText: string) => boolean {
		return (typedText) => {
			props.onParamEdit({ paramIndex, field, typedText })
			return true
		}
	}

	function addParamOrFocusBlank(): void {
		const blankIndex = props.params.findIndex((param) => isBlank(param))
		if (blankIndex === -1) {
			setRowIndexToFocus(props.params.length)
			props.onAddParam()
		} else {
			rowElements[blankIndex]?.querySelector("textarea")?.focus()
		}
	}

	function removeParamAt(paramIndex: number): void {
		setRowIndexToFocus(-1)
		props.onRemoveParam(paramIndex)
	}

	function removeBlankParamUnlessFocused(): void {
		const blankIndex = props.params.findIndex((param) => isBlank(param))
		if (blankIndex === -1) return
		if (rowElements[blankIndex]?.contains(document.activeElement)) return
		removeParamAt(blankIndex)
	}

	function removeBlankParamOnFocusOut(event: FocusEvent, rowIndex: number): void {
		const nextFocused = event.relatedTarget
		if (
			nextFocused instanceof Node &&
			rowElements[rowIndex]?.contains(nextFocused)
		) {
			return
		}
		// Removing the row mid-press would shift the pressed button before its click lands.
		if (isPointerDown) {
			window.addEventListener(
				"pointerup",
				() => {
					setTimeout(removeBlankParamUnlessFocused)
				},
				{ once: true },
			)
		} else {
			removeBlankParamUnlessFocused()
		}
	}

	function rowIndexAtPointerY(pointerY: number): number {
		let rowIndexUnderPointer = 0
		for (let rowIndex = 1; rowIndex < props.params.length; rowIndex++) {
			const rowBounds = rowElements[rowIndex]?.getBoundingClientRect()
			if (rowBounds && pointerY >= rowBounds.top) rowIndexUnderPointer = rowIndex
		}
		return rowIndexUnderPointer
	}

	function moveMovingRowTo(toIndex: number): void {
		if (
			toIndex === movingRowIndex ||
			toIndex < 0 ||
			toIndex >= props.params.length
		) {
			return
		}
		props.onMoveParam(movingRowIndex, toIndex)
		movingRowIndex = toIndex
		setHighlightedRowIndex(toIndex)
	}

	function startDrag(event: PointerEvent, rowIndex: number): void {
		if (event.button !== 0 || !(event.currentTarget instanceof HTMLElement)) return
		event.currentTarget.setPointerCapture(event.pointerId)
		movingRowIndex = rowIndex
		setHighlightedRowIndex(rowIndex)
	}

	function dragRow(event: PointerEvent): void {
		if (movingRowIndex !== -1) moveMovingRowTo(rowIndexAtPointerY(event.clientY))
	}

	function endDrag(): void {
		movingRowIndex = -1
		setHighlightedRowIndex(-1)
	}

	function moveRowWithArrowKey(event: KeyboardEvent, rowIndex: number): void {
		const rowOffset = { ArrowUp: -1, ArrowDown: 1 }[event.key]
		if (rowOffset === undefined) return
		event.preventDefault()
		movingRowIndex = rowIndex
		moveMovingRowTo(rowIndex + rowOffset)
		const movedToIndex = movingRowIndex
		endDrag()
		flush()
		rowElements[movedToIndex]?.querySelector<HTMLElement>("[data-grip]")?.focus()
	}

	return (
		<section
			aria-labelledby="params-heading"
			data-dragging={highlightedRowIndex() === -1 ? undefined : ""}
			class="flex flex-col gap-1.5 border-t border-line pt-2.5 dragging:cursor-grabbing dragging:select-none">
			<QueryField url={props.url} onEdit={props.onQueryEdit} />

			<header class="-mt-1 -mb-0.5 flex h-(--height-control) items-center gap-1.5">
				<h2
					id="params-heading"
					class="pl-px text-xs font-medium text-fg-muted select-none">
					Parameters
				</h2>
				<Show when={props.params.length > 0}>
					<span class="flex-1 text-xs text-fg-muted tabular-nums">
						{props.params.length}
					</span>
					<IconButton
						icon={Plus}
						label="Add parameter"
						onClick={addParamOrFocusBlank}
					/>
				</Show>
			</header>

			<Show when={props.params.length === 0}>
				<button
					type="button"
					onClick={addParamOrFocusBlank}
					class="flex h-10 items-center justify-center gap-1.25 rounded-sm border border-dashed border-line-strong font-medium text-fg-muted transition-[color,background-color,border-color,scale] ease-out hover:border-fg-muted hover:bg-hover hover:text-fg active:scale-(--press-scale)">
					<Plus size={13} strokeWidth={2.25} aria-hidden="true" />
					Add a query parameter
				</button>
			</Show>

			<For each={props.params} keyed={false}>
				{(param, rowIndex) => (
					<div
						ref={(rowElement) => {
							rowElements[rowIndex] = rowElement
						}}
						onFocusOut={(event) => {
							removeBlankParamOnFocusOut(event, rowIndex)
						}}
						class={[
							"relative isolate grid grid-cols-[20px_minmax(0,2fr)_minmax(0,3fr)_var(--height-control)] items-start gap-1",
							{
								"before:absolute before:-inset-x-1.25 before:-inset-y-0.75 before:-z-10 before:rounded-md before:border before:border-line before:bg-hover before:shadow-float":
									rowIndex === highlightedRowIndex(),
							},
						]}>
						<button
							type="button"
							data-grip
							aria-label={`Move parameter ${rowIndex + 1}`}
							aria-describedby="grip-hint"
							onPointerDown={(event) => {
								startDrag(event, rowIndex)
							}}
							onPointerMove={dragRow}
							onPointerUp={endDrag}
							onPointerCancel={endDrag}
							onLostPointerCapture={endDrag}
							onKeyDown={(event) => {
								moveRowWithArrowKey(event, rowIndex)
							}}
							class={[
								"group/tip relative grid h-(--height-control) w-5 cursor-grab touch-none place-items-center rounded-sm transition-colors hover:text-fg",
								rowIndex === highlightedRowIndex()
									? "text-fg"
									: "text-fg-muted",
							]}>
							<GripVertical size={14} aria-hidden="true" />
							<Tooltip text="Drag, or use ↑ ↓, to reorder" side="right" />
						</button>
						<Field
							label={`Parameter ${rowIndex + 1} name`}
							placeholder="name…"
							textAtRest={param().key}
							textToEdit={decodeParam(param().key)}
							onEdit={paramTextEditor(rowIndex, "key")}
							autofocus={rowIndex === rowIndexToFocus()}
						/>
						<Field
							label={`Parameter ${rowIndex + 1} value`}
							placeholder="value…"
							textAtRest={param().value}
							textToEdit={decodeParam(param().value)}
							onEdit={paramTextEditor(rowIndex, "value")}
						/>
						<IconButton
							icon={X}
							label={`Remove parameter ${rowIndex + 1}`}
							tooltip="Remove"
							onClick={() => {
								removeParamAt(rowIndex)
							}}
						/>
					</div>
				)}
			</For>
			<span id="grip-hint" hidden>
				Use the up and down arrow keys to reorder.
			</span>
		</section>
	)
}

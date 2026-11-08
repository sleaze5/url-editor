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
			class="flex flex-col gap-2 dragging:cursor-grabbing dragging:select-none">
			<QueryField url={props.url} onEdit={props.onQueryEdit} />

			<header class="-mb-1 flex h-8 items-center gap-1">
				<h2 id="params-heading" class="section-heading flex-1">
					Parameters
					<span class="count">{props.params.length}</span>
				</h2>
				<Show when={props.params.length > 0}>
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
					class="button h-8 w-full animate-enter border-dashed text-fg-muted hover:text-fg">
					<Plus size={16} aria-hidden="true" />
					Add parameter
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
							"relative isolate flex animate-enter items-start gap-1",
							{
								"before:absolute before:-inset-1 before:-z-10 before:border before:border-fg-muted before:bg-raised":
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
								"group/tip relative grid h-8 w-5 flex-none cursor-grab touch-none place-items-center transition-colors duration-100 hover:text-fg",
								rowIndex === highlightedRowIndex()
									? "text-fg"
									: "text-fg-faint",
							]}>
							<GripVertical size={16} aria-hidden="true" />
							<Tooltip text="Drag, or use ↑ ↓, to reorder" side="right" />
						</button>
						<div class="grid min-w-0 flex-1 grid-cols-5 gap-1">
							<div class="col-span-2 min-w-0">
								<Field
									label={`Parameter ${rowIndex + 1} name`}
									placeholder="name…"
									textAtRest={param().key}
									textToEdit={decodeParam(param().key)}
									onEdit={paramTextEditor(rowIndex, "key")}
									autofocus={rowIndex === rowIndexToFocus()}
								/>
							</div>
							<div class="col-span-3 min-w-0">
								<Field
									label={`Parameter ${rowIndex + 1} value`}
									placeholder="value…"
									textAtRest={param().value}
									textToEdit={decodeParam(param().value)}
									onEdit={paramTextEditor(rowIndex, "value")}
								/>
							</div>
						</div>
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

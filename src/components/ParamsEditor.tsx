import GripVertical from "@lucide/solid/icons/grip-vertical"
import Plus from "@lucide/solid/icons/plus"
import X from "@lucide/solid/icons/x"
import { createMemo, createSignal, flush, For, onSettled, Show } from "solid-js"

import { decodeParam } from "../lib/url/codec.ts"
import type { ParamEdit, ParamField } from "../lib/url/edit.ts"
import type { Param } from "../lib/url/params.ts"
import { Field } from "./Field.tsx"
import { IconButton } from "./IconButton.tsx"
import { Tooltip } from "./Tooltip.tsx"

interface ParamsEditorProps {
	url: URL
	params: readonly Param[]
	onQueryEdit: (raw: string) => boolean
	onEdit: (edit: ParamEdit) => void
	onMove: (from: number, to: number) => void
	onAdd: () => void
	onRemove: (index: number) => void
}

const isBlank = (param: Param): boolean => param.key === "" && param.value === ""

export function ParamsEditor(props: ParamsEditorProps) {
	const rows: HTMLElement[] = []
	const [queryOpened, setQueryOpened] = createSignal(false)
	const [active, setActive] = createSignal(-1)
	const [focusIndex, setFocusIndex] = createSignal(-1)
	const showQuery = createMemo(() => queryOpened() || props.url.search !== "")
	let dragging = -1
	let pressing = false

	function press(event: PointerEvent): void {
		pressing = event.type === "pointerdown"
	}

	onSettled(() => {
		window.addEventListener("pointerdown", press)
		window.addEventListener("pointerup", press)
		window.addEventListener("blur", endDrag)
		return () => {
			window.removeEventListener("pointerdown", press)
			window.removeEventListener("pointerup", press)
			window.removeEventListener("blur", endDrag)
		}
	})

	function editor(index: number, field: ParamField): (raw: string) => boolean {
		return (raw) => {
			props.onEdit({ index, field, raw })
			return true
		}
	}

	function add(): void {
		const blank = props.params.findIndex((param) => isBlank(param))
		if (blank === -1) {
			setFocusIndex(props.params.length)
			props.onAdd()
		} else {
			rows[blank]?.querySelector("textarea")?.focus()
		}
	}

	function remove(index: number): void {
		setFocusIndex(-1)
		props.onRemove(index)
	}

	function removeBlank(): void {
		const index = props.params.findIndex((param) => isBlank(param))
		if (index === -1 || rows[index]?.contains(document.activeElement)) return
		remove(index)
	}

	function closeIfBlank(event: FocusEvent, index: number): void {
		const target = event.relatedTarget
		if (target instanceof Node && rows[index]?.contains(target)) return
		// Removing the row mid-press would shift the pressed button before its click lands.
		if (pressing) {
			window.addEventListener(
				"pointerup",
				() => {
					setTimeout(removeBlank)
				},
				{ once: true },
			)
		} else {
			removeBlank()
		}
	}

	function rowAt(y: number): number {
		let index = 0
		for (let i = 1; i < props.params.length; i++) {
			const rect = rows[i]?.getBoundingClientRect()
			if (rect && y >= rect.top) index = i
		}
		return index
	}

	function moveTo(to: number): void {
		if (to === dragging || to < 0 || to >= props.params.length) return
		props.onMove(dragging, to)
		dragging = to
		setActive(to)
	}

	function startDrag(event: PointerEvent, index: number): void {
		if (event.button !== 0 || !(event.currentTarget instanceof HTMLElement)) return
		event.currentTarget.setPointerCapture(event.pointerId)
		dragging = index
		setActive(index)
	}

	function drag(event: PointerEvent): void {
		if (dragging !== -1) moveTo(rowAt(event.clientY))
	}

	function endDrag(): void {
		dragging = -1
		setActive(-1)
	}

	function nudge(event: KeyboardEvent, index: number): void {
		const step = { ArrowUp: -1, ArrowDown: 1 }[event.key]
		if (step === undefined) return
		event.preventDefault()
		dragging = index
		moveTo(index + step)
		const target = dragging
		endDrag()
		flush()
		rows[target]?.querySelector<HTMLElement>("[data-grip]")?.focus()
	}

	return (
		<section
			aria-labelledby="params-heading"
			data-dragging={active() === -1 ? undefined : ""}
			class="flex flex-col gap-1.5 border-t border-line pt-2.5 dragging:cursor-grabbing dragging:select-none">
			<Show when={showQuery()}>
				<div
					class="mb-1 flex flex-col gap-0.5 border-b border-line pb-2.5"
					onFocusIn={() => {
						setQueryOpened(true)
					}}
					onFocusOut={() => {
						setQueryOpened(false)
					}}>
					<label class="flex flex-col gap-0.5">
						<span class="block pl-px text-xs font-medium text-fg-muted select-none">
							Query string
						</span>
						<Field
							label="Query string"
							value={props.url.search.slice(1)}
							onEdit={props.onQueryEdit}
						/>
					</label>
				</div>
			</Show>

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
					<IconButton icon={Plus} label="Add parameter" onClick={add} />
				</Show>
			</header>

			<Show when={props.params.length === 0}>
				<button
					type="button"
					onClick={add}
					class="flex h-10 items-center justify-center gap-1.25 rounded-sm border border-dashed border-line-strong font-medium text-fg-muted transition-[color,background-color,border-color,scale] ease-out hover:border-fg-muted hover:bg-hover hover:text-fg active:scale-(--press-scale)">
					<Plus size={13} strokeWidth={2.25} aria-hidden="true" />
					Add a query parameter
				</button>
			</Show>

			<For each={props.params} keyed={false}>
				{(param, index) => (
					<div
						ref={(el) => {
							rows[index] = el
						}}
						onFocusOut={(event) => {
							closeIfBlank(event, index)
						}}
						class={[
							"relative isolate grid grid-cols-[20px_minmax(0,2fr)_minmax(0,3fr)_var(--height-control)] items-start gap-1",
							{
								"before:absolute before:-inset-x-1.25 before:-inset-y-0.75 before:-z-10 before:rounded-md before:border before:border-line before:bg-hover before:shadow-float":
									index === active(),
							},
						]}>
						<button
							type="button"
							data-grip
							aria-label={`Move parameter ${index + 1}`}
							aria-describedby="grip-hint"
							onPointerDown={(event) => {
								startDrag(event, index)
							}}
							onPointerMove={drag}
							onPointerUp={endDrag}
							onPointerCancel={endDrag}
							onLostPointerCapture={endDrag}
							onKeyDown={(event) => {
								nudge(event, index)
							}}
							class={[
								"group/tip relative grid h-(--height-control) w-5 cursor-grab touch-none place-items-center rounded-sm transition-colors hover:text-fg",
								index === active() ? "text-fg" : "text-fg-muted",
							]}>
							<GripVertical size={14} aria-hidden="true" />
							<Tooltip text="Drag, or use ↑ ↓, to reorder" side="right" />
						</button>
						<Field
							label={`Parameter ${index + 1} name`}
							placeholder="name…"
							value={param().key}
							raw={decodeParam(param().key)}
							onEdit={editor(index, "key")}
							autofocus={index === focusIndex()}
						/>
						<Field
							label={`Parameter ${index + 1} value`}
							placeholder="value…"
							value={param().value}
							raw={decodeParam(param().value)}
							onEdit={editor(index, "value")}
						/>
						<IconButton
							icon={X}
							label={`Remove parameter ${index + 1}`}
							tip="Remove"
							onClick={() => {
								remove(index)
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

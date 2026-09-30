<script lang="ts">
	import GripVertical from "@lucide/svelte/icons/grip-vertical"
	import Plus from "@lucide/svelte/icons/plus"
	import Trash2 from "@lucide/svelte/icons/trash-2"
	import { tick } from "svelte"

	import {
		decodeParam,
		getPart,
		type Param,
		type ParamEdit,
		type ParamField,
		type PartSpec,
	} from "../lib/url"
	import Field from "./Field.svelte"
	import IconButton from "./IconButton.svelte"
	import Tooltip from "./Tooltip.svelte"

	interface Props {
		url: URL
		params: readonly Param[]
		focusIndex: number
		onqueryedit: (part: PartSpec, raw: string) => boolean
		onedit: (edit: ParamEdit) => void
		onmove: (from: number, to: number) => void
		onadd: () => void
		onremove: (index: number) => void
		onsubmit: () => void
	}

	const {
		url,
		params,
		focusIndex,
		onqueryedit,
		onedit,
		onmove,
		onadd,
		onremove,
		onsubmit,
	}: Props = $props()

	const query = getPart("search")

	let queryOpened = $state(false)
	const showQuery = $derived(queryOpened || url.search !== "")

	const rowEls: HTMLElement[] = $state([])
	let dragIndex = $state(-1)

	function editor(index: number, field: ParamField): (raw: string) => boolean {
		return (raw) => {
			onedit({ index, field, raw })
			return true
		}
	}

	const isBlank = (param: Param): boolean => param.key === "" && param.value === ""

	function add(): void {
		const blank = params.findIndex((param) => isBlank(param))
		if (blank === -1) onadd()
		else rowEls[blank]?.querySelector("textarea")?.focus()
	}

	let pressing = false

	function removeBlank(): void {
		const index = params.findIndex((param) => isBlank(param))
		if (index !== -1 && !rowEls[index]?.contains(document.activeElement)) {
			onremove(index)
		}
	}

	// Rows are keyed by index, so removing one mid-click would retarget the click.
	function closeIfBlank(event: FocusEvent, index: number): void {
		const row = rowEls[index]
		if (event.relatedTarget instanceof Node && row?.contains(event.relatedTarget)) {
			return
		}
		if (pressing) {
			window.addEventListener("pointerup", () => setTimeout(removeBlank), {
				once: true,
			})
		} else {
			removeBlank()
		}
	}

	function rowAt(y: number): number {
		let index = 0
		for (let i = 1; i < params.length; i++) {
			const rect = rowEls[i]?.getBoundingClientRect()
			if (rect && y >= rect.top) index = i
		}
		return index
	}

	function moveTo(to: number): void {
		if (to === dragIndex || to < 0 || to >= params.length) return
		onmove(dragIndex, to)
		dragIndex = to
	}

	function startDrag(event: PointerEvent, index: number): void {
		if (event.button !== 0 || !(event.currentTarget instanceof HTMLElement)) return
		event.currentTarget.setPointerCapture(event.pointerId)
		dragIndex = index
	}

	function drag(event: PointerEvent): void {
		if (dragIndex !== -1) moveTo(rowAt(event.clientY))
	}

	function endDrag(): void {
		dragIndex = -1
	}

	async function nudge(event: KeyboardEvent, index: number): Promise<void> {
		const step = { ArrowUp: -1, ArrowDown: 1 }[event.key]
		if (step === undefined) return
		event.preventDefault()
		dragIndex = index
		moveTo(index + step)
		const target = dragIndex
		dragIndex = -1
		await tick()
		rowEls[target]?.querySelector<HTMLElement>(".grip")?.focus()
	}
</script>

<svelte:window
	onpointerdown={() => (pressing = true)}
	onpointerup={() => (pressing = false)} />

<section class:dragging={dragIndex !== -1}>
	{#if showQuery}
		<div
			class="query"
			onfocusin={() => (queryOpened = true)}
			onfocusout={() => (queryOpened = false)}>
			<span class="caption">query string</span>
			<Field
				label="Query"
				value={query.encoded(url)}
				toRaw={() => query.encoded(url)}
				onedit={(raw) => onqueryedit(query, raw)}
				{onsubmit} />
		</div>
	{/if}

	<header>
		<span>params</span>
		<span class="count">{params.length}</span>
		<IconButton icon={Plus} label="Add param" onclick={add} />
	</header>

	{#each params as param, index (index)}
		<div
			class="row"
			class:active={index === dragIndex}
			bind:this={rowEls[index]}
			onfocusout={(event) => closeIfBlank(event, index)}>
			<button
				type="button"
				class="grip"
				aria-label="Reorder param {index + 1} (arrow keys)"
				onpointerdown={(event) => startDrag(event, index)}
				onpointermove={drag}
				onpointerup={endDrag}
				onpointercancel={endDrag}
				onkeydown={(event) => void nudge(event, index)}>
				<GripVertical size={14} aria-hidden="true" />
				<Tooltip text="Drag to reorder" side="right" />
			</button>
			<Field
				label="Param {index + 1} key"
				placeholder="key"
				value={param.key}
				toRaw={() => decodeParam(param.key)}
				onedit={editor(index, "key")}
				autofocus={index === focusIndex}
				{onsubmit} />
			<Field
				label="Param {index + 1} value"
				placeholder="value"
				value={param.value}
				toRaw={() => decodeParam(param.value)}
				onedit={editor(index, "value")}
				{onsubmit} />
			<IconButton
				icon={Trash2}
				label="Remove param"
				onclick={() => onremove(index)} />
		</div>
	{/each}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-top: 6px;
		border-top: 1px solid var(--border);
	}

	section.dragging,
	section.dragging * {
		cursor: grabbing;
		user-select: none;
	}

	section.dragging :global(.tip) {
		display: none;
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--gap);
		color: var(--muted);
		font-size: var(--label-size);
		letter-spacing: var(--label-tracking);
		text-transform: uppercase;
		line-height: 14px;
		user-select: none;
	}

	.count {
		flex: 1;
		opacity: 0.6;
	}

	.query {
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding-bottom: 6px;
		margin-bottom: 4px;
		border-bottom: 1px solid var(--border);
	}

	.row {
		display: grid;
		grid-template-columns: 16px minmax(0, 2fr) minmax(0, 3fr) var(--control-height);
		align-items: start;
		gap: 4px;
		position: relative;
		isolation: isolate;
	}

	.row.active::before {
		content: "";
		position: absolute;
		inset: -3px -5px;
		z-index: -1;
		background: var(--surface-hover);
		border: 1px solid var(--border);
		border-radius: calc(var(--radius) + 2px);
	}

	.grip {
		position: relative;
		display: grid;
		place-items: center;
		width: 16px;
		height: var(--control-height);
		padding: 0;
		color: var(--muted);
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius);
		cursor: grab;
		touch-action: none;
		opacity: 0.6;
		transition:
			color 80ms linear,
			opacity 80ms linear;
	}

	.grip:hover,
	.row.active .grip {
		color: var(--text);
		opacity: 1;
	}

	.grip:focus-visible {
		outline: none;
		border-color: var(--border-focus);
		opacity: 1;
	}
</style>

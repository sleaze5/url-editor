<script lang="ts">
	import ArrowLeftRight from "@lucide/svelte/icons/arrow-left-right"

	import type { PartSpec } from "../lib/url/parts"
	import Field from "./Field.svelte"
	import Tooltip from "./Tooltip.svelte"

	interface Props {
		part: PartSpec
		url: URL
		onedit: (part: PartSpec, raw: string) => boolean
		onsubmit: () => void
		onfocus?: () => void
		onblur?: () => void
		autofocus?: boolean
	}

	const {
		part,
		url,
		onedit,
		onsubmit,
		onfocus,
		onblur,
		autofocus = false,
	}: Props = $props()

	const flippable = $derived(part.id === "hostname")
	let unicode = $state(false)
	const value = $derived(unicode ? part.raw(url) : part.encoded(url))
	const canFlip = $derived(flippable && part.raw(url) !== part.encoded(url))
</script>

<div class="cell">
	<label onfocusin={onfocus} onfocusout={onblur}>
		<span class="caption">{part.label}</span>
		<Field
			label={part.label}
			{value}
			toRaw={flippable ? () => value : () => part.raw(url)}
			onedit={(raw) => onedit(part, raw)}
			{onsubmit}
			{autofocus} />
	</label>
	{#if canFlip}
		<button
			type="button"
			class="flip"
			class:on={unicode}
			aria-label="Toggle Punycode"
			aria-pressed={unicode}
			onclick={() => (unicode = !unicode)}>
			<ArrowLeftRight size={12} strokeWidth={2} aria-hidden="true" />
			<Tooltip text={unicode ? "Show Punycode" : "Show Unicode"} />
		</button>
	{/if}
</div>

<style>
	.cell {
		position: relative;
		min-width: 0;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	/* Sits at the end of the caption row, outside the <label> so it doesn't become the
label's control. */
	.flip {
		position: absolute;
		top: 0;
		right: 0;
		display: grid;
		place-items: center;
		width: 18px;
		height: 14px;
		padding: 0;
		color: var(--muted);
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius);
		cursor: pointer;
		transition: color 80ms linear;
	}

	.flip:hover,
	.flip.on {
		color: var(--text);
	}

	.flip:focus-visible {
		outline: none;
		border-color: var(--border-focus);
	}
</style>

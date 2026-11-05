<script lang="ts">
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
		errorAlign?: "start" | "end"
	}

	const {
		part,
		url,
		onedit,
		onsubmit,
		onfocus,
		onblur,
		autofocus = false,
		errorAlign = "start",
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
			error={part.error}
			{errorAlign}
			{onsubmit}
			{autofocus} />
	</label>
	{#if canFlip}
		<button
			type="button"
			class="flip"
			aria-pressed={unicode}
			onclick={() => (unicode = !unicode)}>
			Unicode
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
		gap: 2px;
	}

	/* Sits at the end of the caption row, outside the <label> so it doesn't become the
	   label's control. */
	.flip {
		position: absolute;
		top: 0;
		right: 0;
		height: 16px;
		padding: 0 5px;
		color: var(--muted);
		font-size: var(--label-size);
		font-weight: 500;
		line-height: 14px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			color var(--fast) ease,
			background-color var(--fast) ease,
			border-color var(--fast) ease;
	}

	/* Grows the hit area to 24px without changing the layout. */
	.flip::before {
		content: "";
		position: absolute;
		inset: -4px 0;
	}

	@media (hover: hover) {
		.flip:hover {
			color: var(--text);
		}
	}

	.flip[aria-pressed="true"] {
		color: var(--text);
		background: var(--surface-hover);
		border-color: var(--border);
	}
</style>

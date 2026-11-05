<script lang="ts">
	import type { LucideProps } from "@lucide/svelte"
	import type { Component } from "svelte"

	import Tooltip from "./Tooltip.svelte"

	interface Props {
		icon: Component<LucideProps>
		label: string
		onclick: () => void
		tip?: string
	}

	const { icon: Icon, label, onclick, tip = label }: Props = $props()

	// Only icon swaps animate in, never the first render.
	let mounted = $state(false)
	$effect(() => {
		mounted = true
	})
</script>

<button type="button" aria-label={label} {onclick}>
	{#key Icon}
		<span class="glyph" class:swap={mounted}
			><Icon size={15} strokeWidth={2} aria-hidden="true" /></span>
	{/key}
	<Tooltip text={tip} />
</button>

<style>
	button {
		position: relative;
		display: grid;
		place-items: center;
		flex: none;
		width: var(--control-height);
		height: var(--control-height);
		padding: 0;
		color: var(--muted);
		background: transparent;
		border: 0;
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			color var(--fast) ease,
			background-color var(--fast) ease,
			transform var(--fast) var(--ease-out);
	}

	@media (hover: hover) {
		button:hover {
			color: var(--text);
			background: var(--surface-hover);
		}
	}

	button:active {
		transform: scale(var(--press-scale));
	}

	.glyph {
		display: grid;
	}

	.swap {
		transition:
			opacity 150ms ease,
			transform 150ms var(--ease-out);
	}

	@starting-style {
		.swap {
			opacity: 0;
			transform: scale(var(--enter-scale));
		}
	}
</style>

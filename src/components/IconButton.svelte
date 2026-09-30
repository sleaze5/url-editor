<script lang="ts">
	import type { LucideProps } from "@lucide/svelte"
	import type { Component } from "svelte"

	import Tooltip from "./Tooltip.svelte"

	interface Props {
		icon: Component<LucideProps>
		label: string
		onclick: () => void
	}

	const { icon: Icon, label, onclick }: Props = $props()
</script>

<button type="button" aria-label={label} {onclick}>
	<Icon size={14} strokeWidth={2} aria-hidden="true" />
	<Tooltip text={label} />
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
		border: 1px solid transparent;
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			color 80ms linear,
			background-color 80ms linear;
	}

	button:hover {
		color: var(--text);
		background: var(--surface-hover);
	}

	button:focus-visible {
		outline: none;
		border-color: var(--border-focus);
	}
</style>

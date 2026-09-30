<script lang="ts">
	import ArrowRight from "@lucide/svelte/icons/arrow-right"
	import Asterisk from "@lucide/svelte/icons/asterisk"

	import Tooltip from "./Tooltip.svelte"

	interface Props {
		dirty: boolean
		failed: boolean
		onreset: () => void
		onapply: () => void
	}

	const { dirty, failed, onreset, onapply }: Props = $props()
</script>

<footer>
	<span class="hint" aria-live="polite">
		{#if failed}
			<span class="error">Can't open this URL</span>
		{:else if dirty}
			<span class="modified" role="img" aria-label="Modified">
				<Asterisk size={14} strokeWidth={2.5} aria-hidden="true" />
				<Tooltip text="Modified" side="right" />
			</span>
		{/if}
	</span>
	<button type="button" disabled={!dirty} onclick={onreset}>Reset</button>
	<button type="button" class="primary" onclick={onapply}>
		Apply
		<ArrowRight size={13} strokeWidth={2.5} aria-hidden="true" />
	</button>
</footer>

<style>
	footer {
		display: flex;
		flex: none;
		align-items: center;
		gap: var(--gap);
		padding: 4px var(--page-padding);
		background: var(--bg);
		border-top: 1px solid var(--border);
	}

	.hint {
		flex: 1;
		display: flex;
		color: var(--muted);
	}

	.error {
		color: var(--danger);
		font-size: var(--label-size);
		letter-spacing: var(--label-tracking);
		text-transform: uppercase;
	}

	.modified {
		position: relative;
		display: flex;
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		height: 24px;
		padding: 0 10px;
		font-size: 11px;
		font-weight: 500;
		letter-spacing: var(--label-tracking);
		text-transform: uppercase;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			background-color 80ms linear,
			border-color 80ms linear;
	}

	button:hover:not(:disabled) {
		background: var(--surface-hover);
		border-color: var(--border-hover);
	}

	button:focus-visible {
		outline: none;
		border-color: var(--border-focus);
	}

	button:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.primary {
		color: var(--accent-text);
		font-weight: 600;
		background: var(--accent);
		border-color: var(--accent);
	}

	.primary:hover:not(:disabled) {
		background: var(--accent-hover);
		border-color: var(--accent-hover);
	}
</style>

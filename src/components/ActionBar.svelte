<script lang="ts">
	import CornerDownLeft from "@lucide/svelte/icons/corner-down-left"

	interface Props {
		dirty: boolean
		failed: boolean
		onreset: () => void
		onapply: () => void
	}

	const { dirty, failed, onreset, onapply }: Props = $props()
</script>

<footer>
	<p class="status" aria-live="polite">
		{#if failed}
			<span class="error">The browser blocked this URL. Copy it instead.</span>
		{:else if dirty}
			<span class="edited">Edited</span>
		{/if}
	</p>
	<button type="button" disabled={!dirty} onclick={onreset}>Reset</button>
	<button type="button" class="primary" onclick={onapply}>
		Open URL
		<kbd aria-hidden="true"><CornerDownLeft size={12} strokeWidth={2.25} /></kbd>
	</button>
</footer>

<style>
	footer {
		display: flex;
		flex: none;
		align-items: center;
		gap: var(--gap);
		min-height: 44px;
		padding: 8px var(--page-padding);
		background: var(--bg);
		border-top: 1px solid var(--border);
	}

	.status {
		flex: 1;
		min-width: 0;
		color: var(--muted);
		font-size: var(--label-size);
		line-height: 14px;
	}

	.status > span {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		transition: opacity var(--fast) ease;
	}

	@starting-style {
		.status > span {
			opacity: 0;
		}
	}

	.edited::before {
		content: "";
		width: 6px;
		height: 6px;
		background: var(--focus);
		border-radius: 50%;
	}

	.error {
		color: var(--danger);
	}

	button {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 28px;
		padding: 0 12px;
		font-weight: 500;
		white-space: nowrap;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			background-color var(--fast) ease,
			border-color var(--fast) ease,
			opacity var(--fast) ease,
			transform var(--fast) var(--ease-out);
	}

	@media (hover: hover) {
		button:hover:not(:disabled) {
			background: var(--surface-hover);
			border-color: var(--border-hover);
		}
	}

	button:active:not(:disabled) {
		transform: scale(var(--press-scale));
	}

	button:disabled {
		opacity: 0.45;
		cursor: default;
	}

	.primary {
		padding-right: 6px;
		color: var(--primary-text);
		font-weight: 600;
		background: var(--primary);
		border-color: var(--primary);
	}

	@media (hover: hover) {
		.primary:hover:not(:disabled) {
			background: var(--primary-hover);
			border-color: var(--primary-hover);
		}
	}

	kbd {
		display: grid;
		place-items: center;
		width: 18px;
		height: 18px;
		border: 1px solid color-mix(in srgb, currentcolor 30%, transparent);
		border-radius: 3px;
		opacity: 0.75;
	}
</style>

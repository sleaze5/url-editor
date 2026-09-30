<script lang="ts">
	interface Props {
		text: string
		side?: "left" | "right"
	}

	const { text, side = "left" }: Props = $props()
</script>

<span class="tip {side}" aria-hidden="true">{text}</span>

<style>
	.tip {
		position: absolute;
		top: 50%;
		z-index: 2;
		padding: 2px 6px;
		color: var(--text);
		font-size: 11px;
		font-weight: 400;
		line-height: 14px;
		letter-spacing: normal;
		text-transform: none;
		white-space: nowrap;
		background: var(--surface-hover);
		border: 1px solid var(--border-hover);
		border-radius: 4px;
		pointer-events: none;
		opacity: 0;
		transform: translateY(-50%);
		transition: opacity 80ms linear;
	}

	.left {
		right: calc(100% + 4px);
	}

	.right {
		left: calc(100% + 4px);
	}

	:global(:hover) > .tip,
	:global(:focus-visible) > .tip {
		opacity: 1;
		transition-delay: 350ms;
	}
</style>

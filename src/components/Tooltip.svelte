<script lang="ts" module>
	const DELAY_MS = 400
	const WARM_MS = 300
	let warmUntil = 0
</script>

<script lang="ts">
	interface Props {
		text: string
		side?: "left" | "right"
	}

	const { text, side = "left" }: Props = $props()

	let el: HTMLSpanElement | undefined = $state()

	// Once one tip has been shown, neighbouring tips open instantly for a moment.
	$effect(() => {
		const anchor = el?.parentElement
		if (!anchor) return
		let enteredAt = 0
		const enter = (): void => {
			enteredAt = performance.now()
			const warm = enteredAt < warmUntil
			document.documentElement.classList.toggle("tips-instant", warm)
		}
		const leave = (): void => {
			const now = performance.now()
			if (now - enteredAt >= DELAY_MS || now < warmUntil)
				warmUntil = now + WARM_MS
		}
		anchor.addEventListener("pointerenter", enter)
		anchor.addEventListener("pointerleave", leave)
		return () => {
			anchor.removeEventListener("pointerenter", enter)
			anchor.removeEventListener("pointerleave", leave)
		}
	})
</script>

<span bind:this={el} class="tip {side}" aria-hidden="true">{text}</span>

<style>
	.tip {
		position: absolute;
		top: 50%;
		z-index: 2;
		padding: 3px 7px;
		color: var(--text);
		font: 400 11px/14px var(--font-ui);
		letter-spacing: normal;
		text-transform: none;
		white-space: nowrap;
		background: var(--surface-raised);
		border: 1px solid var(--border-hover);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		pointer-events: none;
		opacity: 0;
		transform: translateY(-50%) scale(0.97);
		transition:
			opacity var(--fast) ease,
			transform var(--fast) var(--ease-out);
	}

	.left {
		right: calc(100% + 6px);
		transform-origin: right center;
	}

	.right {
		left: calc(100% + 6px);
		transform-origin: left center;
	}

	@media (hover: hover) {
		:global(:hover) > .tip {
			opacity: 1;
			transform: translateY(-50%);
			transition-delay: 400ms;
		}
	}

	:global(:focus-visible) > .tip {
		opacity: 1;
		transform: translateY(-50%);
		transition-delay: 400ms;
	}

	:global(.tips-instant) .tip {
		transition-duration: 0s;
		transition-delay: 0s !important;
	}
</style>

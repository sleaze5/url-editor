<script lang="ts">
	import Check from "@lucide/svelte/icons/check"
	import Copy from "@lucide/svelte/icons/copy"
	import X from "@lucide/svelte/icons/x"

	import Field from "./Field.svelte"
	import IconButton from "./IconButton.svelte"

	interface Props {
		href: string
		toRaw: () => string
		onedit: (raw: string) => boolean
		onsubmit: () => void
	}

	const { href, toRaw, onedit, onsubmit }: Props = $props()

	const FEEDBACK_MS = 1200
	let copied: "idle" | "done" | "failed" = $state("idle")
	let timer: ReturnType<typeof setTimeout> | undefined

	async function copy(): Promise<void> {
		try {
			await navigator.clipboard.writeText(href)
			copied = "done"
		} catch {
			copied = "failed"
		}
		clearTimeout(timer)
		timer = setTimeout(() => (copied = "idle"), FEEDBACK_MS)
	}

	const ICONS = { idle: Copy, done: Check, failed: X }
	const TIPS = { idle: "Copy URL", done: "Copied", failed: "Couldn't copy" }
</script>

<div class="url">
	<label class="caption" for="full-url">Full URL</label>
	<div class="bar">
		<Field
			id="full-url"
			label="Full URL"
			value={href}
			{toRaw}
			{onedit}
			{onsubmit}
			error="Not a complete URL; include a scheme such as https://" />
		<IconButton
			icon={ICONS[copied]}
			label="Copy URL"
			tip={TIPS[copied]}
			onclick={() => void copy()} />
	</div>
	<span class="visually-hidden" aria-live="polite">
		{copied === "idle" ? "" : TIPS[copied]}
	</span>
</div>

<style>
	.url {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.bar {
		display: flex;
		align-items: flex-start;
		gap: 4px;
	}

	.bar > :global(:first-child) {
		flex: 1;
	}
</style>

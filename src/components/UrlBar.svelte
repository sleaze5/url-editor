<script lang="ts">
	import Check from "@lucide/svelte/icons/check"
	import Copy from "@lucide/svelte/icons/copy"

	import Field from "./Field.svelte"
	import IconButton from "./IconButton.svelte"

	interface Props {
		href: string
		toRaw: () => string
		onedit: (raw: string) => boolean
		onsubmit: () => void
	}

	const { href, toRaw, onedit, onsubmit }: Props = $props()

	const COPIED_MS = 900
	let copied = $state(false)
	let timer: ReturnType<typeof setTimeout> | undefined

	async function copy(): Promise<void> {
		await navigator.clipboard.writeText(href)
		copied = true
		clearTimeout(timer)
		timer = setTimeout(() => (copied = false), COPIED_MS)
	}
</script>

<div class="url">
	<span class="caption">full url</span>
	<div class="bar">
		<Field label="Full URL" value={href} {toRaw} {onedit} {onsubmit} />
		<IconButton
			icon={copied ? Check : Copy}
			label={copied ? "Copied" : "Copy URL"}
			onclick={() => void copy()} />
	</div>
</div>

<style>
	.url {
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.bar {
		display: flex;
		align-items: flex-start;
		gap: 4px;
	}
</style>

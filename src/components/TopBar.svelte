<script lang="ts">
	import PictureInPicture2 from "@lucide/svelte/icons/picture-in-picture-2"
	import View from "@lucide/svelte/icons/view"

	import IconButton from "./IconButton.svelte"

	interface Props {
		onpopout?: (() => void) | undefined
		onfocustab?: (() => void) | undefined
	}

	const { onpopout, onfocustab }: Props = $props()
</script>

<header>
	<img src="./icons/icon.svg" alt="" width="16" height="16" draggable="false" />
	<span class="title">URL Editor</span>
	{#if onfocustab}
		<span class="action">
			<IconButton icon={View} label="Focus tab" onclick={onfocustab} />
		</span>
	{/if}
	{#if onpopout}
		<span class="action">
			<IconButton
				icon={PictureInPicture2}
				label="Pop out to a new window"
				onclick={onpopout} />
		</span>
	{/if}
</header>

<style>
	header {
		display: flex;
		flex: none;
		align-items: center;
		gap: 8px;
		padding: 10px var(--page-padding);
		background: var(--bg);
		border-bottom: 1px solid var(--border);
		user-select: none;
	}

	img {
		flex: none;
		display: block;
	}

	.title {
		flex: 1;
		font-size: 14px;
		font-weight: 700;
		letter-spacing: 0.01em;
		line-height: 18px;
	}

	.action {
		margin: -3px -4px;
	}
</style>

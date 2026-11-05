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
	<h1 class="title" translate="no">URL Editor</h1>
	{#if onfocustab}
		<span class="action">
			<IconButton icon={View} label="Switch to the tab" onclick={onfocustab} />
		</span>
	{/if}
	{#if onpopout}
		<span class="action">
			<IconButton
				icon={PictureInPicture2}
				label="Open in a window"
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
		height: 40px;
		padding: 0 var(--page-padding);
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
		font-size: 13px;
		font-weight: 600;
		line-height: 18px;
	}

	.action {
		display: flex;
	}

	/* Optically align the last icon's glyph with the content edge. */
	.action:last-child {
		margin-right: -6px;
	}
</style>

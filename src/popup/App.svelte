<script lang="ts">
	import { onMount } from "svelte"

	import ActionBar from "../components/ActionBar.svelte"
	import ParamsEditor from "../components/ParamsEditor.svelte"
	import PartsEditor from "../components/PartsEditor.svelte"
	import TopBar from "../components/TopBar.svelte"
	import UrlBar from "../components/UrlBar.svelte"
	import {
		type ActiveTab,
		canFocusTab,
		canPopOut,
		focusTab,
		getActiveTab,
		loadDraft,
		navigate,
		popOut,
		saveDraft,
		watchDraft,
		watchTab,
	} from "../lib/browser"
	import {
		editHref,
		editParam,
		editPart,
		moveParam,
		type Param,
		type ParamEdit,
		parseParams,
		type PartSpec,
		withParams,
	} from "../lib/url"

	let tab: ActiveTab | null = $state(null)
	let status: "loading" | "ready" | "unavailable" | "closed" = $state("loading")
	let original = $state("")
	let href = $state("")
	let params: readonly Param[] = $state.raw([])
	let focusIndex = $state(-1)

	let base: { href: string; params: readonly Param[] } = { href: "", params: [] }

	const url = $derived(href === "" ? null : new URL(href))

	function load(next: string): void {
		href = next
		params = parseParams(new URL(next).search)
	}

	function commit(next: string | null): boolean {
		if (next === null) return false
		load(next)
		return true
	}

	function snapshot(): void {
		base = { href, params }
	}

	function editUrlPart(part: PartSpec, raw: string): boolean {
		return commit(editPart(base.href, part, raw))
	}

	function editParamField(edit: ParamEdit): void {
		params = editParam(base.params, edit)
		href = withParams(base.href, params)
	}

	function addParam(): void {
		focusIndex = params.length
		params = [...params, { key: "", value: "", hasValue: true }]
	}

	function reorderParam(from: number, to: number): void {
		params = moveParam(params, from, to)
		href = withParams(href, params)
	}

	function removeParam(index: number): void {
		focusIndex = -1
		params = params.filter((_, i) => i !== index)
		href = withParams(href, params)
	}

	const FAILED_MS = 2000
	let failed = $state(false)
	let failedTimer: ReturnType<typeof setTimeout> | undefined

	function showFailure(): void {
		failed = true
		clearTimeout(failedTimer)
		failedTimer = setTimeout(() => (failed = false), FAILED_MS)
	}

	function apply(): void {
		if (tab) navigate(tab, href).catch(showFailure)
	}

	function handleWindowKeydown(event: KeyboardEvent): void {
		if (event.key !== "Enter" || event.defaultPrevented) return
		if (event.target instanceof HTMLButtonElement) return
		event.preventDefault()
		apply()
	}

	onMount(async () => {
		tab = await getActiveTab()
		if (!tab) {
			status = "unavailable"
			return
		}
		original = tab.url
		load((await loadDraft(tab)) ?? tab.url)
		status = "ready"
	})

	function followTab(next: string): void {
		if (!tab) return
		tab = { ...tab, url: next }
		original = next
		load(next)
	}

	function handleFocusTab(): void {
		if (tab) void focusTab(tab)
	}

	function handlePopOut(): void {
		if (tab) void popOut(tab)
	}

	// A value received from another view is not saved back, or stale echoes would bounce.
	let received = ""

	$effect(() => {
		if (!tab || status !== "ready") return
		if (href === received) received = ""
		else void saveDraft(tab, href)
	})

	$effect(() => {
		if (!tab || status !== "ready") return
		return watchDraft(tab, (next) => {
			received = next
			if (next !== href) load(next)
		})
	})

	$effect(() => {
		if (!tab || status !== "ready") return
		return watchTab(tab, { onurl: followTab, onclose: () => (status = "closed") })
	})
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<main onfocusin={snapshot}>
	<TopBar
		onpopout={tab && canPopOut(tab) ? handlePopOut : undefined}
		onfocustab={tab && status !== "closed" && canFocusTab(tab)
			? handleFocusTab
			: undefined} />
	<div class="content">
		{#if status === "closed"}
			<p>This tab was closed.</p>
		{:else if url}
			<UrlBar
				{href}
				toRaw={() => href}
				onedit={(raw) => commit(editHref(base.href, raw))}
				onsubmit={apply} />
			<PartsEditor {url} onedit={editUrlPart} onsubmit={apply} />
			<ParamsEditor
				{url}
				{params}
				onqueryedit={editUrlPart}
				{focusIndex}
				onedit={editParamField}
				onadd={addParam}
				onmove={reorderParam}
				onremove={removeParam}
				onsubmit={apply} />
		{:else if status === "unavailable"}
			<p>This tab's URL can't be read.</p>
		{/if}
	</div>
	{#if url && status !== "closed"}
		<ActionBar
			dirty={href !== original}
			{failed}
			onreset={() => load(original)}
			onapply={apply} />
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		height: var(--popup-height);
	}

	:global(.windowed) main {
		height: 100vh;
	}

	.content {
		display: flex;
		flex: 1 1 auto;
		flex-direction: column;
		gap: 6px;
		min-height: 0;
		padding: var(--page-padding);
		overflow-y: auto;
	}

	p {
		color: var(--muted);
	}
</style>

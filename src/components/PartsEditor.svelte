<script lang="ts">
	import {
		getPart,
		isAvailable,
		isRequired,
		type PartId,
		type PartSpec,
	} from "../lib/url/parts"
	import PartField from "./PartField.svelte"

	interface Props {
		url: URL
		onedit: (part: PartSpec, raw: string) => boolean
		onsubmit: () => void
	}

	const { url, onedit, onsubmit }: Props = $props()

	const ROWS: readonly (readonly PartId[])[] = [
		["protocol", "hostname", "port"],
		["username", "password"],
		["pathname"],
		["hash"],
	]
	const WIDTHS: Partial<Record<PartId, string>> = { protocol: "64px", port: "56px" }

	let revealed: readonly PartId[] = $state.raw([])
	let focusId: PartId | null = $state(null)

	function isVisible(id: PartId): boolean {
		if (!isAvailable(id, url)) return false
		return (
			isRequired(id) || revealed.includes(id) || getPart(id).encoded(url) !== ""
		)
	}

	const rows = $derived(
		ROWS.map((row) => row.filter((id) => isVisible(id))).filter(
			(row) => row.length > 0,
		),
	)
	const hidden = $derived(
		ROWS.flat().filter((id) => isAvailable(id, url) && !isVisible(id)),
	)

	function reveal(id: PartId): void {
		if (!revealed.includes(id)) revealed = [...revealed, id]
	}

	function settle(id: PartId): void {
		if (focusId === id) focusId = null
		if (getPart(id).encoded(url) === "") revealed = revealed.filter((r) => r !== id)
	}

	function open(id: PartId): void {
		reveal(id)
		focusId = id
	}

	function columns(row: readonly PartId[]): string {
		return row.map((id) => WIDTHS[id] ?? "minmax(0, 1fr)").join(" ")
	}
</script>

<section>
	{#each rows as row, index (index)}
		<div class="row" style:grid-template-columns={columns(row)}>
			{#each row as id (id)}
				<PartField
					part={getPart(id)}
					{url}
					{onedit}
					{onsubmit}
					onfocus={() => reveal(id)}
					onblur={() => settle(id)}
					autofocus={id === focusId} />
			{/each}
		</div>
	{/each}

	{#if hidden.length > 0}
		<div class="add">
			{#each hidden as id (id)}
				<button type="button" onclick={() => open(id)}
					>+ {getPart(id).label}</button>
			{/each}
		</div>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.row {
		display: grid;
		gap: 4px;
	}

	.add {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.add button {
		height: 20px;
		padding: 0 6px;
		color: var(--muted);
		font-size: var(--label-size);
		letter-spacing: var(--label-tracking);
		text-transform: uppercase;
		background: transparent;
		border: 1px dashed var(--border-hover);
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			color 80ms linear,
			border-color 80ms linear;
	}

	.add button:hover {
		color: var(--text);
		border-color: var(--border-focus);
	}

	.add button:focus-visible {
		outline: none;
		border-color: var(--border-focus);
		border-style: solid;
	}
</style>

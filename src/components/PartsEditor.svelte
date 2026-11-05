<script lang="ts">
	import Plus from "@lucide/svelte/icons/plus"

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
	const WIDTHS: Partial<Record<PartId, string>> = { protocol: "72px", port: "64px" }

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

<section aria-label="URL parts">
	{#each rows as row, index (index)}
		<div class="row" style:grid-template-columns={columns(row)}>
			{#each row as id, cell (id)}
				<PartField
					part={getPart(id)}
					{url}
					{onedit}
					{onsubmit}
					onfocus={() => reveal(id)}
					onblur={() => settle(id)}
					autofocus={id === focusId}
					errorAlign={cell > 0 && cell === row.length - 1
						? "end"
						: "start"} />
			{/each}
		</div>
	{/each}

	{#if hidden.length > 0}
		<div class="add" role="group" aria-label="Add a URL part">
			{#each hidden as id (id)}
				<button type="button" onclick={() => open(id)}>
					<Plus size={12} strokeWidth={2.25} aria-hidden="true" />
					{getPart(id).label}
				</button>
			{/each}
		</div>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.row {
		display: grid;
		gap: var(--gap);
	}

	.add {
		display: flex;
		flex-wrap: wrap;
		gap: var(--gap);
	}

	.add button {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		height: 24px;
		padding: 0 8px 0 6px;
		color: var(--muted);
		font-size: var(--label-size);
		font-weight: 500;
		background: transparent;
		border: 1px dashed var(--border-hover);
		border-radius: var(--radius);
		cursor: pointer;
		transition:
			color var(--fast) ease,
			border-color var(--fast) ease,
			background-color var(--fast) ease,
			transform var(--fast) var(--ease-out);
	}

	@media (hover: hover) {
		.add button:hover {
			color: var(--text);
			background: var(--surface-hover);
			border-color: var(--muted);
		}
	}

	.add button:active {
		transform: scale(var(--press-scale));
	}
</style>

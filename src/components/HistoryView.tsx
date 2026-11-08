import KeyRound from "@lucide/solid/icons/key-round"
import RotateCcwClock from "@lucide/solid/icons/rotate-ccw-clock"
import { createMemo, createSignal, For, Show } from "solid-js"

import { historyToCsv } from "../lib/history/csv.ts"
import type { EditorDraft } from "../lib/history/drafts.ts"
import type { HistoryEntry } from "../lib/history/entries.ts"
import {
	countEntriesByFilter,
	type HistoryFilter,
	isEntryShownByFilter,
} from "../lib/history/filters.ts"
import { ChangeWatcherToggle } from "./ChangeWatcherToggle.tsx"
import { CopyButton } from "./CopyButton.tsx"
import { HistoryEntryRow } from "./HistoryEntryRow.tsx"
import { HistoryFilterBar } from "./HistoryFilterBar.tsx"
import { Notice } from "./Notice.tsx"
import { StashedDraftList } from "./StashedDraftList.tsx"
import { Tooltip } from "./Tooltip.tsx"

interface HistoryViewProps {
	history: readonly HistoryEntry[]
	tabUrl: string
	stashedDrafts: readonly EditorDraft[]
	isChangeWatcherOn: boolean
	hasRedirectStatusAccess: boolean
	onEditEntry: (entry: HistoryEntry) => void
	onRestoreStashedDraft: (stashIndex: number) => void
	onDropStashedDraft: (stashIndex: number) => void
	onDropAllStashedDrafts: () => void
	onToggleChangeWatcher: () => void
	onAskForRedirectStatusAccess: () => void
}

export function HistoryView(props: HistoryViewProps) {
	const [selectedFilter, setSelectedFilter] = createSignal<HistoryFilter>("all")
	const shownHistory = createMemo(() =>
		props.history.filter((entry) => isEntryShownByFilter(entry, selectedFilter())),
	)
	const newestFirstShownHistory = createMemo(() => shownHistory().toReversed())
	const entryCountByFilter = createMemo(() => countEntriesByFilter(props.history))
	const latestEntryNumber = createMemo(() => props.history.at(-1)?.entryNumber)

	return (
		<section
			aria-labelledby="history-heading"
			class="flex flex-1 animate-enter flex-col gap-2">
			<header class="flex items-center justify-end gap-1">
				<h2 id="history-heading" class="sr-only">
					History
				</h2>
				<Show when={props.history.length > 0}>
					<HistoryFilterBar
						selectedFilter={selectedFilter()}
						entryCountByFilter={entryCountByFilter()}
						onSelectFilter={(filter) => {
							setSelectedFilter(filter)
						}}
					/>
				</Show>
				<Show when={props.isChangeWatcherOn && !props.hasRedirectStatusAccess}>
					<button
						type="button"
						aria-label="Allow access to sites to show redirect status codes"
						onClick={() => {
							props.onAskForRedirectStatusAccess()
						}}
						class="group/tip relative button-ghost animate-pop text-warning hover:text-warning">
						<KeyRound size={16} aria-hidden="true" />
						<Tooltip text="Allow access to show redirect codes" />
					</button>
				</Show>
				<CopyButton
					label="Copy as CSV"
					textToCopy={historyToCsv(shownHistory())}
				/>
				<ChangeWatcherToggle
					isOn={props.isChangeWatcherOn}
					onToggle={props.onToggleChangeWatcher}
				/>
			</header>

			<Show when={props.stashedDrafts.length > 0}>
				<StashedDraftList
					stashedDrafts={props.stashedDrafts}
					onRestore={props.onRestoreStashedDraft}
					onDrop={props.onDropStashedDraft}
					onDropAll={props.onDropAllStashedDrafts}
				/>
			</Show>

			<Show
				when={props.history.length > 0}
				fallback={
					<Notice icon={RotateCcwClock} title="Nothing logged yet">
						{props.isChangeWatcherOn
							? "Changes to this tab show up here."
							: "URLs opened from the editor show up here."}
					</Notice>
				}>
				<ol class="-mx-3 flex flex-col divide-y divide-line border-y border-line">
					<For
						each={newestFirstShownHistory()}
						keyed={(entry) => entry.entryNumber}
						fallback={
							<li class="animate-enter px-3 py-4 text-sm text-fg-muted">
								No changes of this type.
							</li>
						}>
						{(entry) => (
							<HistoryEntryRow
								entry={entry()}
								isCurrent={
									entry().entryNumber === latestEntryNumber() &&
									entry().href === props.tabUrl
								}
								onEdit={() => {
									props.onEditEntry(entry())
								}}
							/>
						)}
					</For>
				</ol>
			</Show>
		</section>
	)
}

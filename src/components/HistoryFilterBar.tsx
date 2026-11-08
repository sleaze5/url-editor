import { For, Show } from "solid-js"

import { HISTORY_FILTERS, type HistoryFilter } from "../lib/history/filters.ts"
import { ChangeTypeIcon } from "./ChangeTypeIcon.tsx"
import { Tooltip } from "./Tooltip.tsx"

interface HistoryFilterBarProps {
	selectedFilter: HistoryFilter
	entryCountByFilter: Record<HistoryFilter, number>
	onSelectFilter: (filter: HistoryFilter) => void
}

const FILTER_LABELS: Record<HistoryFilter, string> = {
	"all": "All",
	"editor": "Opened from the editor",
	"redirects": "Redirects",
	"navigations": "Navigations",
	"in-page": "In-page changes",
}

export function HistoryFilterBar(props: HistoryFilterBarProps) {
	return (
		<fieldset class="mr-auto flex min-w-0 flex-wrap gap-1">
			<legend class="sr-only">Show changes of type</legend>
			<For each={HISTORY_FILTERS}>
				{(filter) => (
					<button
						type="button"
						aria-label={`${FILTER_LABELS[filter]}, ${props.entryCountByFilter[filter]}`}
						aria-pressed={
							props.selectedFilter === filter ? "true" : "false"
						}
						disabled={
							filter !== "all" && props.entryCountByFilter[filter] === 0
						}
						onClick={() => {
							props.onSelectFilter(filter)
						}}
						class="group/tip relative chip">
						<Show
							when={filter !== "all" && filter}
							fallback={FILTER_LABELS.all}>
							{(changeType) => (
								<ChangeTypeIcon changeType={changeType()} />
							)}
						</Show>
						<span class="count">{props.entryCountByFilter[filter]}</span>
						<Show when={filter !== "all"}>
							<Tooltip text={FILTER_LABELS[filter]} side="below" />
						</Show>
					</button>
				)}
			</For>
		</fieldset>
	)
}

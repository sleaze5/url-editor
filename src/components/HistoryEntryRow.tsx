import PencilLine from "@lucide/solid/icons/pencil-line"
import { Show } from "solid-js"

import type { HistoryCause, HistoryEntry } from "../lib/history/entries.ts"
import { changeTypeOfEntry } from "../lib/history/filters.ts"
import { ChangeTypeIcon } from "./ChangeTypeIcon.tsx"
import { HrefWithHostEmphasis } from "./HrefWithHostEmphasis.tsx"
import { Tooltip } from "./Tooltip.tsx"

interface HistoryEntryRowProps {
	entry: HistoryEntry
	isCurrent: boolean
	onEdit: () => void
}

const CAUSE_LABELS: Record<HistoryCause, string> = {
	"opened-from-editor": "Opened from URL Editor",
	"server-redirect": "Redirect",
	"client-redirect": "Redirected by the page",
	"link": "Followed a link",
	"address-bar": "Entered in the address bar",
	"bookmark": "Opened a bookmark",
	"reload": "Reloaded",
	"back-forward": "Back or forward",
	"form-submission": "Submitted a form",
	"page-script": "Changed by the page",
	"fragment": "Fragment changed",
	"original": "Original",
	"other": "Navigated",
}

const TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
	hour: "2-digit",
	minute: "2-digit",
	second: "2-digit",
})
const DATE_AND_TIME_FORMAT = new Intl.DateTimeFormat(undefined, {
	month: "short",
	day: "numeric",
	hour: "2-digit",
	minute: "2-digit",
})

function formatRecordedAt(recordedAt: number): string {
	const recordedDate = new Date(recordedAt)
	const isToday = recordedDate.toDateString() === new Date().toDateString()
	return (isToday ? TIME_FORMAT : DATE_AND_TIME_FORMAT).format(recordedDate)
}

export function HistoryEntryRow(props: HistoryEntryRowProps) {
	return (
		<li
			data-selected={props.isCurrent ? "" : undefined}
			class="group/row list-row flex animate-enter items-start gap-2 py-2 pr-1 pl-3">
			<span class="w-5 flex-none font-mono text-2xs leading-4 text-fg-faint tabular-nums">
				{props.entry.entryNumber}
			</span>
			<div class="flex min-w-0 flex-1 flex-col gap-1">
				<div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
					<span class="flex items-center gap-1.5 label-text text-fg">
						<ChangeTypeIcon changeType={changeTypeOfEntry(props.entry)} />
						{CAUSE_LABELS[props.entry.cause]}
					</span>
					<Show when={props.entry.redirectStatus}>
						{(redirectStatus) => (
							<span class="group/tip relative z-10 tag text-warning">
								{redirectStatus().code}
								<span class="sr-only">
									{redirectStatus().reasonPhrase}
								</span>
								<Tooltip
									text={redirectStatus().reasonPhrase}
									side="below"
								/>
							</span>
						)}
					</Show>
					<Show when={props.entry.editedFromEntryNumber}>
						{(editedFromEntryNumber) => (
							<span class="font-mono whitespace-nowrap">
								from #{editedFromEntryNumber()}
							</span>
						)}
					</Show>
					<Show when={props.isCurrent}>
						<span class="status text-success">Current</span>
					</Show>
				</div>
				<span
					translate="no"
					class="line-clamp-2 font-mono text-sm wrap-anywhere">
					<HrefWithHostEmphasis href={props.entry.href} />
				</span>
				<time
					datetime={new Date(props.entry.recordedAt).toISOString()}
					class="font-mono text-2xs text-fg-faint tabular-nums">
					{formatRecordedAt(props.entry.recordedAt)}
				</time>
			</div>
			<button
				type="button"
				aria-label={`Edit entry ${props.entry.entryNumber}`}
				onClick={() => {
					props.onEdit()
				}}
				class="button-ghost group-hover/row:text-fg after:absolute after:inset-0">
				<PencilLine size={16} aria-hidden="true" />
			</button>
		</li>
	)
}

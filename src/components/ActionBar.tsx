import CornerDownLeft from "@lucide/solid/icons/corner-down-left"
import Undo2 from "@lucide/solid/icons/undo-2"
import { Match, Show, Switch } from "solid-js"

import { IconButton } from "./IconButton.tsx"
import { Tooltip } from "./Tooltip.tsx"

interface ActionBarProps {
	isEdited: boolean
	wasBlocked: boolean
	editedFromEntryNumber: number | null
	onRestoreNewestStashedDraft: (() => void) | null
	onReset: () => void
	onStashEditsAndReset: () => void
	onOpenUrl: () => void
}

const BLOCKED_MESSAGE = "The browser blocked this URL. Copy it instead."

export function ActionBar(props: ActionBarProps) {
	return (
		<footer class="flex h-10 flex-none items-center gap-2 border-t border-line bg-surface px-3">
			<p aria-live="polite" class="min-w-0 flex-1 text-xs">
				<Switch>
					<Match when={props.wasBlocked}>
						<span class="group/tip relative status text-danger">
							Blocked
							<span class="sr-only">{BLOCKED_MESSAGE}</span>
							<Tooltip text={BLOCKED_MESSAGE} side="right" />
						</span>
					</Match>
					<Match when={props.isEdited}>
						<span class="status text-warning">
							Edited
							<Show when={props.editedFromEntryNumber}>
								{(editedFromEntryNumber) => (
									<span class="font-mono font-normal">
										from #{editedFromEntryNumber()}
									</span>
								)}
							</Show>
						</span>
					</Match>
				</Switch>
			</p>
			<Show when={props.onRestoreNewestStashedDraft}>
				{(restoreNewestStashedDraft) => (
					<IconButton
						icon={Undo2}
						label="Restore stashed draft"
						onClick={restoreNewestStashedDraft()}
					/>
				)}
			</Show>
			<button
				type="button"
				disabled={!props.isEdited}
				onClick={() => {
					props.onReset()
				}}
				class="button">
				Reset
			</button>
			<button
				type="button"
				disabled={!props.isEdited}
				onClick={() => {
					props.onStashEditsAndReset()
				}}
				class="group/tip relative button">
				Stash
				<Tooltip text="Stash edits and reset" />
			</button>
			<button
				type="button"
				onClick={() => {
					props.onOpenUrl()
				}}
				class="button-primary pr-1">
				Open URL
				<kbd
					aria-hidden="true"
					class="grid size-5 place-items-center border border-line-strong text-fg-muted">
					<CornerDownLeft size={12} />
				</kbd>
			</button>
		</footer>
	)
}

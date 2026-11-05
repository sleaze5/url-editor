import CornerDownLeft from "@lucide/solid/icons/corner-down-left"
import { Match, Switch } from "solid-js"

interface ActionBarProps {
	dirty: boolean
	failed: boolean
	onReset: () => void
	onApply: () => void
}

const BUTTON =
	"inline-flex h-7 items-center gap-1.5 rounded-sm border px-3 whitespace-nowrap transition-[background-color,border-color,opacity,scale] ease-out not-disabled:active:scale-(--press-scale)"

export function ActionBar(props: ActionBarProps) {
	return (
		<footer class="flex min-h-11 flex-none items-center gap-1.5 border-t border-line bg-bg px-3 py-2">
			<p aria-live="polite" class="min-w-0 flex-1 text-xs text-fg-muted">
				<Switch>
					<Match when={props.failed}>
						<span class="inline-flex text-danger transition-opacity starting:opacity-0">
							The browser blocked this URL. Copy it instead.
						</span>
					</Match>
					<Match when={props.dirty}>
						<span class="inline-flex items-center gap-1.5 transition-opacity before:size-1.5 before:rounded-full before:bg-accent starting:opacity-0">
							Edited
						</span>
					</Match>
				</Switch>
			</p>
			<button
				type="button"
				disabled={!props.dirty}
				onClick={() => {
					props.onReset()
				}}
				class={[
					BUTTON,
					"border-line bg-surface font-medium hover:not-disabled:border-line-strong hover:not-disabled:bg-hover disabled:opacity-45",
				]}>
				Reset
			</button>
			<button
				type="button"
				onClick={() => {
					props.onApply()
				}}
				class={[
					BUTTON,
					"border-primary bg-primary pr-1.5 font-semibold text-on-primary hover:border-primary-hover hover:bg-primary-hover",
				]}>
				Open URL
				<kbd
					aria-hidden="true"
					class="grid size-4.5 place-items-center rounded-[3px] border border-current/30 opacity-75">
					<CornerDownLeft size={12} strokeWidth={2.25} />
				</kbd>
			</button>
		</footer>
	)
}

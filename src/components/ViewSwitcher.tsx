import PencilLine from "@lucide/solid/icons/pencil-line"
import RotateCcwClock from "@lucide/solid/icons/rotate-ccw-clock"

interface ViewSwitcherProps {
	isShowingHistory: boolean
	historyEntryCount: number
	onSwitchView: (shouldShowHistory: boolean) => void
}

export function ViewSwitcher(props: ViewSwitcherProps) {
	return (
		<fieldset class="segmented">
			<legend class="sr-only">View</legend>
			<button
				type="button"
				aria-pressed={props.isShowingHistory ? "false" : "true"}
				onClick={() => {
					props.onSwitchView(false)
				}}>
				<PencilLine size={14} aria-hidden="true" />
				Editor
			</button>
			<button
				type="button"
				aria-pressed={props.isShowingHistory ? "true" : "false"}
				onClick={() => {
					props.onSwitchView(true)
				}}>
				<RotateCcwClock size={14} aria-hidden="true" />
				History
				<span class="count">{props.historyEntryCount}</span>
			</button>
		</fieldset>
	)
}

import Eye from "@lucide/solid/icons/eye"

import { Tooltip } from "./Tooltip.tsx"

interface ChangeWatcherToggleProps {
	isOn: boolean
	onToggle: () => void
}

export function ChangeWatcherToggle(props: ChangeWatcherToggleProps) {
	return (
		<button
			type="button"
			role="switch"
			aria-label="Watch all changes"
			aria-checked={props.isOn ? "true" : "false"}
			onClick={() => {
				props.onToggle()
			}}
			class="group/tip switch relative">
			<Eye size={14} aria-hidden="true" />
			<span aria-hidden="true" class="track" />
			<Tooltip
				text={
					props.isOn
						? "Logging every change in this tab"
						: "Logging only URLs opened here"
				}
			/>
		</button>
	)
}

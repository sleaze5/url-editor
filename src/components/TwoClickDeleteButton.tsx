import Trash from "@lucide/solid/icons/trash"
import { createSignal, onSettled, Show } from "solid-js"

import { Tooltip } from "./Tooltip.tsx"

interface TwoClickDeleteButtonProps {
	label: string
	onDelete: () => void
}

const CONFIRMATION_WINDOW_MS = 3000

export function TwoClickDeleteButton(props: TwoClickDeleteButtonProps) {
	const [isAwaitingSecondClick, setIsAwaitingSecondClick] = createSignal(false)
	let confirmationTimer: ReturnType<typeof setTimeout> | undefined

	onSettled(() => () => {
		clearTimeout(confirmationTimer)
	})

	function stopAwaitingSecondClick(): void {
		clearTimeout(confirmationTimer)
		setIsAwaitingSecondClick(false)
	}

	function deleteOnSecondClick(): void {
		if (isAwaitingSecondClick()) {
			stopAwaitingSecondClick()
			props.onDelete()
			return
		}
		setIsAwaitingSecondClick(true)
		confirmationTimer = setTimeout(stopAwaitingSecondClick, CONFIRMATION_WINDOW_MS)
	}

	return (
		<button
			type="button"
			aria-label={
				isAwaitingSecondClick() ? `${props.label}: click again` : props.label
			}
			onClick={deleteOnSecondClick}
			onBlur={stopAwaitingSecondClick}
			class={[
				"group/tip relative",
				isAwaitingSecondClick()
					? "button-danger h-6 animate-pop px-2"
					: "grid size-6 place-items-center text-fg-muted transition-colors duration-100 hover:bg-hover hover:text-danger",
			]}>
			<Show
				when={isAwaitingSecondClick()}
				fallback={
					<>
						<Trash size={14} aria-hidden="true" />
						<Tooltip text={props.label} />
					</>
				}>
				Delete all
			</Show>
		</button>
	)
}

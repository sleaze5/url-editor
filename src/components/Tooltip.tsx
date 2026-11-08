import { onSettled } from "solid-js"

interface TooltipProps {
	text: string
	side?: "left" | "right" | "below"
}

const TOOLTIP_DELAY_MS = 500
const INSTANT_TOOLTIPS_AFTER_LEAVE_MS = 300

const TOOLTIP_SIDE_CLASSES: Record<NonNullable<TooltipProps["side"]>, string> = {
	left: "right-full mr-1.5",
	right: "left-full ml-1.5",
	below: "top-full left-0 mt-1.5 translate-y-0",
}

let instantTooltipsUntil = 0

function openNeighboursInstantly(anchor: HTMLElement): () => void {
	let pointerEnteredAt = 0
	const handlePointerEnter = (): void => {
		pointerEnteredAt = performance.now()
		document.documentElement.classList.toggle(
			"tips-instant",
			pointerEnteredAt < instantTooltipsUntil,
		)
	}
	const handlePointerLeave = (): void => {
		const leftAt = performance.now()
		if (
			leftAt - pointerEnteredAt >= TOOLTIP_DELAY_MS ||
			leftAt < instantTooltipsUntil
		) {
			instantTooltipsUntil = leftAt + INSTANT_TOOLTIPS_AFTER_LEAVE_MS
		}
	}
	anchor.addEventListener("pointerenter", handlePointerEnter)
	anchor.addEventListener("pointerleave", handlePointerLeave)
	return () => {
		anchor.removeEventListener("pointerenter", handlePointerEnter)
		anchor.removeEventListener("pointerleave", handlePointerLeave)
	}
}

export function Tooltip(props: TooltipProps) {
	let tooltipElement: HTMLSpanElement
	onSettled(() =>
		tooltipElement.parentElement
			? openNeighboursInstantly(tooltipElement.parentElement)
			: undefined,
	)

	return (
		<span
			ref={(node) => {
				tooltipElement = node
			}}
			aria-hidden="true"
			class={[
				"tooltip",
				"group-hover/tip:opacity-100 group-hover/tip:delay-500",
				"group-focus-visible/tip:opacity-100 group-focus-visible/tip:delay-500",
				"tips-instant:delay-0! dragging:hidden",
				TOOLTIP_SIDE_CLASSES[props.side ?? "left"],
			]}>
			{props.text}
		</span>
	)
}

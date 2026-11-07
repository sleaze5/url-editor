import { onSettled } from "solid-js"

interface TooltipProps {
	text: string
	side?: "left" | "right"
}

// The same delay as `group-hover/tip:delay-400` in the classes below.
const TOOLTIP_DELAY_MS = 400
const INSTANT_TOOLTIPS_AFTER_LEAVE_MS = 300

let instantTooltipsUntil = 0

// Once a tooltip has shown, the next one opens at once while the pointer moves between
// neighbours.
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

/** Shows on hover and focus of its parent, which needs the `group/tip relative` classes. */
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
				"pointer-events-none absolute top-1/2 z-20 -translate-y-1/2 scale-97 rounded-sm border border-line-strong bg-raised px-1.75 py-0.75 text-xs font-normal whitespace-nowrap text-fg normal-case opacity-0 shadow-float transition-[opacity,scale] ease-out",
				"group-hover/tip:scale-100 group-hover/tip:opacity-100 group-hover/tip:delay-400",
				"group-focus-visible/tip:scale-100 group-focus-visible/tip:opacity-100 group-focus-visible/tip:delay-400",
				"tips-instant:delay-0! tips-instant:duration-0 dragging:hidden",
				props.side === "right"
					? "left-[calc(100%+6px)] origin-left"
					: "right-[calc(100%+6px)] origin-right",
			]}>
			{props.text}
		</span>
	)
}

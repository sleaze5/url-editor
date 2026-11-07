import { onSettled } from "solid-js"

interface TooltipProps {
	text: string
	side?: "left" | "right"
}

// The same delay as `group-hover/tip:delay-400` in the classes below.
const DELAY_MS = 400
const WARM_MS = 300

let warmUntil = 0

// Once a tooltip has shown, the next one opens at once while the pointer moves between
// neighbours.
function warmUp(anchor: HTMLElement): () => void {
	let enteredAt = 0
	const enter = (): void => {
		enteredAt = performance.now()
		document.documentElement.classList.toggle("tips-instant", enteredAt < warmUntil)
	}
	const leave = (): void => {
		const now = performance.now()
		if (now - enteredAt >= DELAY_MS || now < warmUntil) warmUntil = now + WARM_MS
	}
	anchor.addEventListener("pointerenter", enter)
	anchor.addEventListener("pointerleave", leave)
	return () => {
		anchor.removeEventListener("pointerenter", enter)
		anchor.removeEventListener("pointerleave", leave)
	}
}

/** Shows on hover and focus of its parent, which needs the `group/tip relative` classes. */
export function Tooltip(props: TooltipProps) {
	let el: HTMLSpanElement
	onSettled(() => (el.parentElement ? warmUp(el.parentElement) : undefined))

	return (
		<span
			ref={(node) => {
				el = node
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

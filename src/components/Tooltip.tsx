interface TooltipProps {
	text: string
	side?: "left" | "right"
}

export function Tooltip(props: TooltipProps) {
	return (
		<span
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

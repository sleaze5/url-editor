import type { LucideProps } from "@lucide/solid"
import { type Component, createSignal, onSettled, Show } from "solid-js"

import { Tooltip } from "./Tooltip.tsx"
import { tooltipAnchor } from "./tooltip-anchor.ts"

interface IconButtonProps {
	icon: Component<LucideProps>
	label: string
	tip?: string
	onClick: () => void
}

export function IconButton(props: IconButtonProps) {
	const [mounted, setMounted] = createSignal(false)
	onSettled(() => {
		setMounted(true)
	})

	return (
		<button
			type="button"
			aria-label={props.label}
			ref={tooltipAnchor}
			onClick={() => {
				props.onClick()
			}}
			class="group/tip relative grid size-(--height-control) flex-none place-items-center rounded-sm text-fg-muted transition-[color,background-color,scale] hover:bg-hover hover:text-fg active:scale-(--press-scale)">
			<Show when={props.icon} keyed>
				{(Icon) => (
					<span
						class={[
							"grid",
							{
								"transition-[opacity,scale] duration-150 ease-out starting:scale-(--enter-scale) starting:opacity-0":
									mounted(),
							},
						]}>
						<Icon size={15} strokeWidth={2} aria-hidden="true" />
					</span>
				)}
			</Show>
			<Tooltip text={props.tip ?? props.label} />
		</button>
	)
}

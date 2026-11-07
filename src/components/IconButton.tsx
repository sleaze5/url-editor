import type { LucideProps } from "@lucide/solid"
import { type Component, createSignal, onSettled, Show } from "solid-js"

import { Tooltip } from "./Tooltip.tsx"

interface IconButtonProps {
	icon: Component<LucideProps>
	label: string
	tooltip?: string
	onClick: () => void
}

export function IconButton(props: IconButtonProps) {
	const [hasMounted, setHasMounted] = createSignal(false)
	onSettled(() => {
		setHasMounted(true)
	})

	return (
		<button
			type="button"
			aria-label={props.label}
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
									hasMounted(),
							},
						]}>
						<Icon size={15} strokeWidth={2} aria-hidden="true" />
					</span>
				)}
			</Show>
			<Tooltip text={props.tooltip ?? props.label} />
		</button>
	)
}

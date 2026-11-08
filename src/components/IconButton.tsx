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
			class="group/tip relative button-ghost">
			<Show when={props.icon} keyed>
				{(Icon) => (
					<span class={["grid", { "animate-bloom": hasMounted() }]}>
						<Icon size={16} aria-hidden="true" />
					</span>
				)}
			</Show>
			<Tooltip text={props.tooltip ?? props.label} />
		</button>
	)
}

import { createMemo, createSignal, Show } from "solid-js"

import type { PartSpec } from "../lib/url/parts.ts"
import { Field } from "./Field.tsx"
import { Tooltip } from "./Tooltip.tsx"
import { tooltipAnchor } from "./tooltip-anchor.ts"

interface PartFieldProps {
	part: PartSpec
	url: URL
	onEdit: (part: PartSpec, raw: string) => boolean
	onSubmit: () => void
	onFocus?: () => void
	onBlur?: () => void
	autofocus?: boolean
	errorAlign?: "start" | "end"
}

export function PartField(props: PartFieldProps) {
	const [unicode, setUnicode] = createSignal(false)
	const flippable = createMemo(() => props.part.id === "hostname")
	const value = createMemo(() =>
		unicode() ? props.part.raw(props.url) : props.part.encoded(props.url),
	)
	const canFlip = createMemo(
		() =>
			flippable() && props.part.raw(props.url) !== props.part.encoded(props.url),
	)

	return (
		<div class="relative min-w-0">
			<label
				class="flex flex-col gap-0.5"
				onFocusIn={() => {
					props.onFocus?.()
				}}
				onFocusOut={() => {
					props.onBlur?.()
				}}>
				<span class="block pl-px text-xs font-medium text-fg-muted select-none">
					{props.part.label}
				</span>
				<Field
					label={props.part.label}
					value={value()}
					toRaw={() => (flippable() ? value() : props.part.raw(props.url))}
					onEdit={(raw) => props.onEdit(props.part, raw)}
					error={props.part.error}
					errorAlign={props.errorAlign ?? "start"}
					onSubmit={() => {
						props.onSubmit()
					}}
					autofocus={props.autofocus ?? false}
				/>
			</label>
			<Show when={canFlip()}>
				<button
					type="button"
					ref={tooltipAnchor}
					aria-pressed={unicode() ? "true" : "false"}
					onClick={() => {
						setUnicode((on) => !on)
					}}
					class="group/tip absolute top-0 right-0 h-4 rounded-sm border border-transparent px-1.25 text-xs/3.5 font-medium text-fg-muted transition-[color,background-color,border-color] before:absolute before:inset-x-0 before:-inset-y-1 hover:text-fg aria-pressed:border-line aria-pressed:bg-hover aria-pressed:text-fg">
					Unicode
					<Tooltip text={unicode() ? "Show Punycode" : "Show Unicode"} />
				</button>
			</Show>
		</div>
	)
}

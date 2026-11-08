import { createMemo, createSignal, Show } from "solid-js"

import type { UrlPart } from "../lib/url/parts.ts"
import { Field } from "./Field.tsx"
import { Tooltip } from "./Tooltip.tsx"

interface PartFieldProps {
	part: UrlPart
	url: URL
	onEdit: (part: UrlPart, typedText: string) => boolean
	onFocus: () => void
	onBlur: () => void
	autofocus: boolean
	rejectionMessageAlign: "start" | "end"
}

export function PartField(props: PartFieldProps) {
	const [isShowingUnicode, setIsShowingUnicode] = createSignal(false)
	const isHostname = createMemo(() => props.part.id === "hostname")
	const textAtRest = createMemo(() =>
		isShowingUnicode()
			? props.part.readDecoded(props.url)
			: props.part.readEncoded(props.url),
	)
	const hasUnicodeForm = createMemo(
		() =>
			isHostname() &&
			props.part.readDecoded(props.url) !== props.part.readEncoded(props.url),
	)

	return (
		<div class="relative min-w-0 animate-enter">
			<label
				class="group/field flex flex-col gap-1"
				onFocusIn={() => {
					props.onFocus()
				}}
				onFocusOut={() => {
					props.onBlur()
				}}>
				<span class="field-label">{props.part.label}</span>
				<Field
					label={props.part.label}
					textAtRest={textAtRest()}
					textToEdit={
						isHostname() ? textAtRest() : props.part.readDecoded(props.url)
					}
					onEdit={(typedText) => props.onEdit(props.part, typedText)}
					rejectionMessage={props.part.rejectionMessage}
					rejectionMessageAlign={props.rejectionMessageAlign}
					autofocus={props.autofocus}
				/>
			</label>
			<Show when={hasUnicodeForm()}>
				<button
					type="button"
					aria-pressed={isShowingUnicode() ? "true" : "false"}
					onClick={() => {
						setIsShowingUnicode((isShowing) => !isShowing)
					}}
					class="group/tip absolute top-0 right-0 chip h-4 animate-pop px-1">
					Unicode
					<Tooltip
						text={isShowingUnicode() ? "Show Punycode" : "Show Unicode"}
					/>
				</button>
			</Show>
		</div>
	)
}

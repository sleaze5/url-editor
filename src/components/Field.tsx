import { createEffect, createSignal, createUniqueId, onSettled, Show } from "solid-js"

import { removeLineBreaks } from "../lib/url/codec.ts"
import { HrefWithHostEmphasis } from "./HrefWithHostEmphasis.tsx"

interface FieldProps {
	label: string
	textAtRest: string
	textToEdit?: string
	onEdit: (typedText: string) => boolean
	placeholder?: string
	autofocus?: boolean
	rejectionMessage?: string | undefined
	rejectionMessageAlign?: "start" | "end"
	shouldEmphasizeHost?: boolean
}

export function Field(props: FieldProps) {
	let textarea: HTMLTextAreaElement
	let textAtFocus = ""
	const rejectionMessageId = createUniqueId()
	const [isEditing, setIsEditing] = createSignal(false)
	const [isInvalid, setIsInvalid] = createSignal(false)
	const isShowingEmphasizedHost = (): boolean =>
		Boolean(props.shouldEmphasizeHost) && !isEditing()

	createEffect(
		() => (isEditing() ? null : props.textAtRest),
		(textAtRest) => {
			if (textAtRest !== null) textarea.value = textAtRest
		},
	)

	onSettled(() => {
		if (props.autofocus) textarea.focus()
	})

	function fitHeightToText(): void {
		textarea.style.height = "auto"
		textarea.style.height = `${textarea.scrollHeight + textarea.offsetHeight - textarea.clientHeight}px`
	}

	function handleFocus(): void {
		textAtFocus = props.textToEdit ?? props.textAtRest
		setIsEditing(true)
		setIsInvalid(false)
		textarea.value = textAtFocus
		fitHeightToText()
	}

	function handleBlur(): void {
		setIsEditing(false)
		setIsInvalid(false)
		textarea.value = props.textAtRest
		textarea.style.height = ""
		textarea.scrollLeft = 0
	}

	function handleInput(): void {
		const typedText = removeLineBreaks(textarea.value)
		if (typedText !== textarea.value) textarea.value = typedText
		setIsInvalid(!props.onEdit(typedText))
		fitHeightToText()
	}

	function handleKeyDown(event: KeyboardEvent): void {
		if (event.key === "Enter") {
			if (isInvalid()) event.preventDefault()
		} else if (event.key === "Escape" && textarea.value !== textAtFocus) {
			event.preventDefault()
			textarea.value = textAtFocus
			handleInput()
		}
	}

	return (
		<div class="relative min-w-0">
			<textarea
				ref={(node) => {
					textarea = node
				}}
				rows={1}
				spellcheck="false"
				autocomplete="off"
				autocapitalize="off"
				translate="no"
				enterkeyhint="go"
				aria-label={props.label}
				aria-invalid={isInvalid() ? "true" : undefined}
				aria-describedby={isInvalid() ? rejectionMessageId : undefined}
				placeholder={props.placeholder}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onInput={handleInput}
				onKeyDown={handleKeyDown}
				class={[
					"block field resize-none overflow-hidden whitespace-pre focus:wrap-anywhere focus:whitespace-pre-wrap",
					{ "text-transparent": isShowingEmphasizedHost() },
				]}
			/>
			<Show when={isShowingEmphasizedHost()}>
				<span
					aria-hidden="true"
					class="pointer-events-none absolute inset-0 overflow-hidden border border-transparent px-2 pt-1.5 pb-1 font-mono text-sm whitespace-pre">
					<HrefWithHostEmphasis href={props.textAtRest} />
				</span>
			</Show>
			<Show when={isInvalid()}>
				<p
					id={rejectionMessageId}
					aria-live="polite"
					class={[
						"pointer-events-none absolute top-full z-30 mt-1 callout-error",
						props.rejectionMessageAlign === "end" ? "right-0" : "left-0",
					]}>
					{props.rejectionMessage ??
						`Not a valid ${props.label.toLowerCase()}`}
					. <kbd>Esc</kbd> to undo.
				</p>
			</Show>
		</div>
	)
}

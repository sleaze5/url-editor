import { createEffect, createSignal, createUniqueId, onSettled, Show } from "solid-js"

interface FieldProps {
	label: string
	/** The text shown while the field is not being edited. */
	textAtRest: string
	/** The text to edit, when it differs from the text at rest. */
	textToEdit?: string
	/** Applies the typed text, and returns false when it is invalid. */
	onEdit: (typedText: string) => boolean
	placeholder?: string
	autofocus?: boolean
	rejectionMessage?: string | undefined
	rejectionMessageAlign?: "start" | "end"
}

const LINE_BREAKS = /[\n\r]+/gu

export function Field(props: FieldProps) {
	let textarea: HTMLTextAreaElement
	let textAtFocus = ""
	const rejectionMessageId = createUniqueId()
	const [isEditing, setIsEditing] = createSignal(false)
	const [isInvalid, setIsInvalid] = createSignal(false)

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
		const typedText = textarea.value.replaceAll(LINE_BREAKS, "")
		if (typedText !== textarea.value) textarea.value = typedText
		setIsInvalid(!props.onEdit(typedText))
		fitHeightToText()
	}

	function handleKeyDown(event: KeyboardEvent): void {
		// Enter opens the URL through the listener in App, unless cancelled here.
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
					"block h-(--height-control) w-full min-w-0 resize-none overflow-hidden rounded-sm border bg-surface px-1.75 py-0.75 font-mono text-sm whitespace-pre transition-[border-color] outline-none placeholder:text-fg-faint",
					"hover:border-line-strong focus:border-accent focus:wrap-anywhere focus:whitespace-pre-wrap",
					isInvalid() ? "border-danger! hover:border-danger" : "border-line",
				]}
			/>
			<Show when={isInvalid()}>
				<p
					id={rejectionMessageId}
					aria-live="polite"
					class={[
						"pointer-events-none absolute top-[calc(100%+4px)] z-30 w-max max-w-70 rounded-sm border border-danger bg-raised px-2 py-1 text-xs text-fg shadow-float transition-[opacity,translate] ease-out starting:-translate-y-0.5 starting:opacity-0",
						props.rejectionMessageAlign === "end" ? "right-0" : "left-0",
					]}>
					{props.rejectionMessage ??
						`Not a valid ${props.label.toLowerCase()}`}
					. <kbd class="font-semibold">Esc</kbd> to undo.
				</p>
			</Show>
		</div>
	)
}

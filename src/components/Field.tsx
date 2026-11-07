import { createEffect, createSignal, createUniqueId, onSettled, Show } from "solid-js"

interface FieldProps {
	label: string
	value: string
	/** The text to edit, when it differs from the value shown at rest. */
	raw?: string
	onEdit: (raw: string) => boolean
	placeholder?: string
	autofocus?: boolean
	error?: string | undefined
	errorAlign?: "start" | "end"
}

const LINE_BREAKS = /[\n\r]+/gu

export function Field(props: FieldProps) {
	let el: HTMLTextAreaElement
	let startRaw = ""
	const errorId = createUniqueId()
	const [editing, setEditing] = createSignal(false)
	const [invalid, setInvalid] = createSignal(false)

	createEffect(
		() => (editing() ? null : props.value),
		(value) => {
			if (value !== null) el.value = value
		},
	)

	onSettled(() => {
		if (props.autofocus) el.focus()
	})

	function fit(): void {
		el.style.height = "auto"
		el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
	}

	function handleFocus(): void {
		startRaw = props.raw ?? props.value
		setEditing(true)
		setInvalid(false)
		el.value = startRaw
		fit()
	}

	function handleBlur(): void {
		setEditing(false)
		setInvalid(false)
		el.value = props.value
		el.style.height = ""
		el.scrollLeft = 0
	}

	function handleInput(): void {
		const text = el.value.replaceAll(LINE_BREAKS, "")
		if (text !== el.value) el.value = text
		setInvalid(!props.onEdit(text))
		fit()
	}

	function handleKeyDown(event: KeyboardEvent): void {
		// Enter opens the URL through the listener in App, unless cancelled here.
		if (event.key === "Enter") {
			if (invalid()) event.preventDefault()
		} else if (event.key === "Escape" && el.value !== startRaw) {
			event.preventDefault()
			el.value = startRaw
			handleInput()
		}
	}

	return (
		<div class="relative min-w-0">
			<textarea
				ref={(node) => {
					el = node
				}}
				rows={1}
				spellcheck="false"
				autocomplete="off"
				autocapitalize="off"
				translate="no"
				enterkeyhint="go"
				aria-label={props.label}
				aria-invalid={invalid() ? "true" : undefined}
				aria-describedby={invalid() ? errorId : undefined}
				placeholder={props.placeholder}
				onFocus={handleFocus}
				onBlur={handleBlur}
				onInput={handleInput}
				onKeyDown={handleKeyDown}
				class={[
					"block h-(--height-control) w-full min-w-0 resize-none overflow-hidden rounded-sm border bg-surface px-1.75 py-0.75 font-mono text-sm whitespace-pre transition-[border-color] outline-none placeholder:text-fg-faint",
					"hover:border-line-strong focus:border-accent focus:wrap-anywhere focus:whitespace-pre-wrap",
					invalid() ? "border-danger! hover:border-danger" : "border-line",
				]}
			/>
			<Show when={invalid()}>
				<p
					id={errorId}
					aria-live="polite"
					class={[
						"pointer-events-none absolute top-[calc(100%+4px)] z-30 w-max max-w-70 rounded-sm border border-danger bg-raised px-2 py-1 text-xs text-fg shadow-float transition-[opacity,translate] ease-out starting:-translate-y-0.5 starting:opacity-0",
						props.errorAlign === "end" ? "right-0" : "left-0",
					]}>
					{props.error ?? `Not a valid ${props.label.toLowerCase()}`}.{" "}
					<kbd class="font-semibold">Esc</kbd> to undo.
				</p>
			</Show>
		</div>
	)
}

<script lang="ts">
	import { onMount } from "svelte"

	interface Props {
		id?: string
		label: string
		value: string
		toRaw: () => string
		onedit: (raw: string) => boolean
		onsubmit?: () => void
		placeholder?: string
		autofocus?: boolean
		/** Shown under the field while the typed text can't be used. */
		error?: string | undefined
		/** Which edge the error callout lines up with. */
		errorAlign?: "start" | "end"
	}

	const {
		id,
		label,
		value,
		toRaw,
		onedit,
		onsubmit,
		placeholder = "",
		autofocus = false,
		error = `Not a valid ${label.toLowerCase()}`,
		errorAlign = "start",
	}: Props = $props()

	const errorId = $props.id()

	const LINE_BREAKS = /[\n\r]+/gu

	let el: HTMLTextAreaElement | undefined = $state()
	let editing = $state(false)
	let draft = $state("")
	let invalid = $state(false)
	let startRaw = ""

	function fit(): void {
		if (!el) return
		el.style.height = "auto"
		el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`
	}

	function handleFocus(): void {
		startRaw = toRaw()
		draft = startRaw
		editing = true
		invalid = false
		// Swap synchronously so the click lands its caret in the raw text.
		if (el) el.value = startRaw
		fit()
	}

	function handleBlur(): void {
		editing = false
		invalid = false
		if (!el) return
		el.value = value
		el.style.height = ""
		el.scrollLeft = 0
	}

	function handleInput(): void {
		if (!el) return
		const text = el.value.replace(LINE_BREAKS, "")
		if (text !== el.value) el.value = text
		draft = text
		invalid = !onedit(text)
		fit()
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === "Enter") {
			event.preventDefault()
			if (!invalid) onsubmit?.()
		} else if (event.key === "Escape" && el && el.value !== startRaw) {
			event.preventDefault()
			el.value = startRaw
			handleInput()
		}
	}

	onMount(() => {
		if (autofocus) el?.focus()
	})
</script>

<div class="field">
	<textarea
		bind:this={el}
		{id}
		class:invalid
		rows="1"
		spellcheck="false"
		autocomplete="off"
		autocapitalize="off"
		translate="no"
		enterkeyhint="go"
		aria-label={label}
		aria-invalid={invalid}
		aria-describedby={invalid ? errorId : undefined}
		{placeholder}
		value={editing ? draft : value}
		onfocus={handleFocus}
		onblur={handleBlur}
		oninput={handleInput}
		onkeydown={handleKeydown}></textarea>
	{#if invalid}
		<p id={errorId} class="error {errorAlign}" aria-live="polite">
			{error}. <kbd>Esc</kbd> to undo.
		</p>
	{/if}
</div>

<style>
	.field {
		position: relative;
		min-width: 0;
	}

	textarea {
		display: block;
		width: 100%;
		min-width: 0;
		height: var(--control-height);
		padding: 3px 7px;
		resize: none;
		overflow: hidden;
		white-space: pre;
		font: 12px/18px var(--mono);
		font-variant-ligatures: none;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		outline: none;
		transition: border-color var(--fast) ease;
	}

	@media (hover: hover) {
		textarea:hover {
			border-color: var(--border-hover);
		}
	}

	/* :focus (not a class) so wrapping applies before handleFocus measures height. */
	textarea:focus {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		border-color: var(--focus);
	}

	textarea.invalid {
		border-color: var(--danger);
	}

	textarea::placeholder {
		color: var(--placeholder);
		opacity: 1;
	}

	/* Floats over what follows, so an error never reflows the form mid-keystroke. */
	.error {
		position: absolute;
		top: calc(100% + 4px);
		z-index: 3;
		width: max-content;
		max-width: 280px;
		padding: 4px 8px;
		color: var(--text);
		font-size: var(--label-size);
		line-height: 15px;
		background: var(--surface-raised);
		border: 1px solid var(--danger);
		border-radius: var(--radius);
		box-shadow: var(--shadow);
		pointer-events: none;
		transition:
			opacity var(--fast) ease,
			transform var(--fast) var(--ease-out);
	}

	@starting-style {
		.error {
			opacity: 0;
			transform: translateY(-2px);
		}
	}

	.start {
		left: 0;
	}

	.end {
		right: 0;
	}

	kbd {
		font: inherit;
		font-weight: 600;
	}
</style>

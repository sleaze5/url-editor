<script lang="ts">
	import { onMount } from "svelte"

	interface Props {
		label: string
		value: string
		toRaw: () => string
		onedit: (raw: string) => boolean
		onsubmit?: () => void
		placeholder?: string
		autofocus?: boolean
	}

	const {
		label,
		value,
		toRaw,
		onedit,
		onsubmit,
		placeholder = "",
		autofocus = false,
	}: Props = $props()

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

<textarea
	bind:this={el}
	class:invalid
	rows="1"
	spellcheck="false"
	autocomplete="off"
	autocapitalize="off"
	translate="no"
	enterkeyhint="go"
	aria-label={label}
	aria-invalid={invalid}
	{placeholder}
	value={editing ? draft : value}
	onfocus={handleFocus}
	onblur={handleBlur}
	oninput={handleInput}
	onkeydown={handleKeydown}></textarea>

<style>
	textarea {
		display: block;
		width: 100%;
		min-width: 0;
		height: var(--control-height);
		padding: 2px 6px;
		resize: none;
		overflow: hidden;
		white-space: pre;
		font: 12px/18px var(--mono);
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		outline: none;
		transition: border-color 80ms linear;
	}

	textarea:hover {
		border-color: var(--border-hover);
	}

	/* :focus (not a class) so wrapping applies before handleFocus measures height. */
	textarea:focus {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		background: var(--surface-active);
		border-color: var(--border-focus);
	}

	textarea.invalid {
		border-color: var(--danger);
	}

	textarea::placeholder {
		color: var(--muted);
		opacity: 0.6;
	}
</style>

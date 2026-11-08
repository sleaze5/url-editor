import Check from "@lucide/solid/icons/check"
import Copy from "@lucide/solid/icons/copy"
import X from "@lucide/solid/icons/x"
import { createSignal } from "solid-js"

import { IconButton } from "./IconButton.tsx"

interface CopyButtonProps {
	label: string
	textToCopy: string
}

type CopyState = "idle" | "done" | "failed"

const COPY_FEEDBACK_MS = 1200
const COPY_STATE_ICONS = { idle: Copy, done: Check, failed: X }
const COPY_RESULT_MESSAGES = { done: "Copied", failed: "Couldn't copy" }

export function CopyButton(props: CopyButtonProps) {
	const [copyState, setCopyState] = createSignal<CopyState>("idle")
	let copyFeedbackTimer: ReturnType<typeof setTimeout> | undefined

	async function copyText(): Promise<void> {
		try {
			await navigator.clipboard.writeText(props.textToCopy)
			setCopyState("done")
		} catch {
			setCopyState("failed")
		}
		clearTimeout(copyFeedbackTimer)
		copyFeedbackTimer = setTimeout(() => {
			setCopyState("idle")
		}, COPY_FEEDBACK_MS)
	}

	const copyResultMessage = (): string => {
		const state = copyState()
		return state === "idle" ? "" : COPY_RESULT_MESSAGES[state]
	}

	return (
		<>
			<IconButton
				icon={COPY_STATE_ICONS[copyState()]}
				label={props.label}
				tooltip={copyResultMessage() || props.label}
				onClick={() => {
					void copyText()
				}}
			/>
			<span class="sr-only" aria-live="polite">
				{copyResultMessage()}
			</span>
		</>
	)
}

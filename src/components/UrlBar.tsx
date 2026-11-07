import Check from "@lucide/solid/icons/check"
import Copy from "@lucide/solid/icons/copy"
import X from "@lucide/solid/icons/x"
import { createSignal } from "solid-js"

import { Field } from "./Field.tsx"
import { IconButton } from "./IconButton.tsx"

interface UrlBarProps {
	href: string
	onEdit: (typedHref: string) => boolean
}

type CopyState = "idle" | "done" | "failed"

const COPY_FEEDBACK_MS = 1200
const COPY_STATE_ICONS = { idle: Copy, done: Check, failed: X }
const COPY_STATE_TOOLTIPS = {
	idle: "Copy URL",
	done: "Copied",
	failed: "Couldn't copy",
}

export function UrlBar(props: UrlBarProps) {
	const [copyState, setCopyState] = createSignal<CopyState>("idle")
	let copyFeedbackTimer: ReturnType<typeof setTimeout> | undefined

	async function copyHref(): Promise<void> {
		try {
			await navigator.clipboard.writeText(props.href)
			setCopyState("done")
		} catch {
			setCopyState("failed")
		}
		clearTimeout(copyFeedbackTimer)
		copyFeedbackTimer = setTimeout(() => {
			setCopyState("idle")
		}, COPY_FEEDBACK_MS)
	}

	return (
		<div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-1">
			<label class="flex min-w-0 flex-col gap-0.5">
				<span class="block pl-px text-xs font-medium text-fg-muted select-none">
					Full URL
				</span>
				<Field
					label="Full URL"
					textAtRest={props.href}
					onEdit={props.onEdit}
					rejectionMessage="Not a complete URL; include a scheme such as https://"
				/>
			</label>
			<div class="mt-4.5">
				<IconButton
					icon={COPY_STATE_ICONS[copyState()]}
					label="Copy URL"
					tooltip={COPY_STATE_TOOLTIPS[copyState()]}
					onClick={() => {
						void copyHref()
					}}
				/>
			</div>
			<span class="sr-only" aria-live="polite">
				{copyState() === "idle" ? "" : COPY_STATE_TOOLTIPS[copyState()]}
			</span>
		</div>
	)
}

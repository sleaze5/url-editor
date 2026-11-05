import Check from "@lucide/solid/icons/check"
import Copy from "@lucide/solid/icons/copy"
import X from "@lucide/solid/icons/x"
import { createSignal } from "solid-js"

import { Field } from "./Field.tsx"
import { IconButton } from "./IconButton.tsx"

interface UrlBarProps {
	href: string
	toRaw: () => string
	onEdit: (raw: string) => boolean
	onSubmit: () => void
}

type CopyState = "idle" | "done" | "failed"

const FEEDBACK_MS = 1200
const ICONS = { idle: Copy, done: Check, failed: X }
const TIPS = { idle: "Copy URL", done: "Copied", failed: "Couldn't copy" }

export function UrlBar(props: UrlBarProps) {
	const [copied, setCopied] = createSignal<CopyState>("idle")
	let timer: ReturnType<typeof setTimeout> | undefined

	async function copy(): Promise<void> {
		try {
			await navigator.clipboard.writeText(props.href)
			setCopied("done")
		} catch {
			setCopied("failed")
		}
		clearTimeout(timer)
		timer = setTimeout(() => {
			setCopied("idle")
		}, FEEDBACK_MS)
	}

	return (
		<div class="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-1">
			<label class="flex min-w-0 flex-col gap-0.5">
				<span class="block pl-px text-xs font-medium text-fg-muted select-none">
					Full URL
				</span>
				<Field
					label="Full URL"
					value={props.href}
					toRaw={() => props.toRaw()}
					onEdit={(raw) => props.onEdit(raw)}
					onSubmit={() => {
						props.onSubmit()
					}}
					error="Not a complete URL; include a scheme such as https://"
				/>
			</label>
			<div class="mt-4.5">
				<IconButton
					icon={ICONS[copied()]}
					label="Copy URL"
					tip={TIPS[copied()]}
					onClick={() => {
						void copy()
					}}
				/>
			</div>
			<span class="sr-only" aria-live="polite">
				{copied() === "idle" ? "" : TIPS[copied()]}
			</span>
		</div>
	)
}

import X from "@lucide/solid/icons/x"
import { createUniqueId, onSettled } from "solid-js"

import type { UnsavedEditsDecision } from "../lib/history/drafts.ts"

interface UnsavedEditsDialogProps {
	entryNumber: number
	onDecide: (decision: UnsavedEditsDecision) => void
}

export function UnsavedEditsDialog(props: UnsavedEditsDialogProps) {
	let dialog: HTMLDialogElement
	let stashButton: HTMLButtonElement
	const titleId = createUniqueId()
	const descriptionId = createUniqueId()

	onSettled(() => {
		dialog.showModal()
		stashButton.focus()
	})

	return (
		<dialog
			ref={(node) => {
				dialog = node
			}}
			role="alertdialog"
			aria-labelledby={titleId}
			aria-describedby={descriptionId}
			onCancel={(event) => {
				event.preventDefault()
				props.onDecide("cancel")
			}}
			class="dialog-card">
			<header class="dialog-header">
				<h2 id={titleId}>Unsaved edits</h2>
				<button
					type="button"
					aria-label="Cancel"
					onClick={() => {
						props.onDecide("cancel")
					}}
					class="button-close">
					<X size={14} aria-hidden="true" />
				</button>
			</header>
			<p id={descriptionId} class="dialog-body">
				Entry <span class="font-mono text-fg">#{props.entryNumber}</span>{" "}
				replaces your edits. Stash them to restore later.
			</p>
			<div class="dialog-actions">
				<button
					type="button"
					onClick={() => {
						props.onDecide("cancel")
					}}
					class="mr-auto button border-transparent text-fg-muted hover:text-fg">
					Cancel
				</button>
				<button
					type="button"
					onClick={() => {
						props.onDecide("discard")
					}}
					class="button-danger">
					Discard
				</button>
				<button
					ref={(node) => {
						stashButton = node
					}}
					type="button"
					onClick={() => {
						props.onDecide("stash")
					}}
					class="button-primary">
					Stash
				</button>
			</div>
		</dialog>
	)
}

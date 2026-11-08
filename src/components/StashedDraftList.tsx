import Undo2 from "@lucide/solid/icons/undo-2"
import X from "@lucide/solid/icons/x"
import { createSignal, For, Show } from "solid-js"

import type { EditorDraft } from "../lib/history/drafts.ts"
import { HrefWithHostEmphasis } from "./HrefWithHostEmphasis.tsx"
import { IconButton } from "./IconButton.tsx"
import { TwoClickDeleteButton } from "./TwoClickDeleteButton.tsx"

interface StashedDraftListProps {
	stashedDrafts: readonly EditorDraft[]
	onRestore: (stashIndex: number) => void
	onDrop: (stashIndex: number) => void
	onDropAll: () => void
}

export function StashedDraftList(props: StashedDraftListProps) {
	const [expandedHrefs, setExpandedHrefs] = createSignal<ReadonlySet<string>>(
		new Set(),
	)
	const isExpanded = (href: string): boolean => expandedHrefs().has(href)

	function toggleExpanded(href: string): void {
		setExpandedHrefs((hrefs) => {
			const nextHrefs = new Set(hrefs)
			if (!nextHrefs.delete(href)) nextHrefs.add(href)
			return nextHrefs
		})
	}

	return (
		<section aria-labelledby="stash-heading" class="panel animate-enter">
			<header>
				<h3 id="stash-heading">
					Stashed drafts
					<span class="count">{props.stashedDrafts.length}</span>
				</h3>
				<TwoClickDeleteButton
					label="Delete all stashed drafts"
					onDelete={props.onDropAll}
				/>
			</header>
			<ul class="flex flex-col divide-y divide-line">
				<For each={props.stashedDrafts} keyed={false}>
					{(stashedDraft, stashIndex) => (
						<li
							class={[
								"flex animate-enter gap-2 pl-3",
								isExpanded(stashedDraft().editedHref)
									? "items-start"
									: "items-center",
							]}>
							<button
								type="button"
								translate="no"
								aria-expanded={
									isExpanded(stashedDraft().editedHref)
										? "true"
										: "false"
								}
								onClick={() => {
									toggleExpanded(stashedDraft().editedHref)
								}}
								class={[
									"min-w-0 flex-1 text-left font-mono text-sm transition-opacity duration-100 hover:opacity-80",
									isExpanded(stashedDraft().editedHref)
										? "py-1.5 wrap-anywhere"
										: "truncate",
								]}>
								<HrefWithHostEmphasis
									href={stashedDraft().editedHref}
								/>
							</button>
							<Show when={stashedDraft().editedFromEntryNumber}>
								{(editedFromEntryNumber) => (
									<span class="font-mono text-xs whitespace-nowrap text-fg-muted">
										from #{editedFromEntryNumber()}
									</span>
								)}
							</Show>
							<IconButton
								icon={Undo2}
								label={`Restore stashed draft ${stashIndex + 1}`}
								tooltip="Restore"
								onClick={() => {
									props.onRestore(stashIndex)
								}}
							/>
							<IconButton
								icon={X}
								label={`Drop stashed draft ${stashIndex + 1}`}
								tooltip="Drop"
								onClick={() => {
									props.onDrop(stashIndex)
								}}
							/>
						</li>
					)}
				</For>
			</ul>
		</section>
	)
}

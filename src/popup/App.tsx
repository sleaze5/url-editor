import {
	createEffect,
	createMemo,
	createSignal,
	Match,
	onSettled,
	Show,
	Switch,
} from "solid-js"

import { ActionBar } from "../components/ActionBar.tsx"
import { HistoryView } from "../components/HistoryView.tsx"
import { NoUrlToEditNotice, TabClosedNotice } from "../components/TabNotices.tsx"
import { TopBar } from "../components/TopBar.tsx"
import { UnsavedEditsDialog } from "../components/UnsavedEditsDialog.tsx"
import { UrlEditorFields } from "../components/UrlEditorFields.tsx"
import { loadDraft, saveDraft, watchDraft } from "../lib/browser/drafts.ts"
import { openUrlFromEditor, watchHistory } from "../lib/browser/history.ts"
import { type EditedTab, getEditedTab, watchTab } from "../lib/browser/tabs.ts"
import { canFocusTab, canPopOut, focusTab, popOut } from "../lib/browser/windows.ts"
import { isSameDraft, tabUrlDraft } from "../lib/history/drafts.ts"
import { createChangeWatcherState } from "./change-watcher-state.ts"
import { createEditorDraft } from "./editor-draft.ts"
import { createHistoryDrafts } from "./history-drafts.ts"

type Status = "loading" | "ready" | "unavailable" | "closed"

const BLOCKED_NOTICE_MS = 5000

function openOnEnter(openUrl: () => void): (event: KeyboardEvent) => void {
	return (event) => {
		if (event.key !== "Enter" || event.defaultPrevented) return
		if (event.target instanceof HTMLButtonElement) return
		event.preventDefault()
		openUrl()
	}
}

export function App() {
	const [editedTab, setEditedTab] = createSignal<EditedTab | null>(null)
	const [status, setStatus] = createSignal<Status>("loading")
	const [blockedHref, setBlockedHref] = createSignal<string | null>(null)
	const [isShowingHistory, setIsShowingHistory] = createSignal(false)
	const editorDraft = createEditorDraft()
	const readyTab = createMemo(() => (status() === "ready" ? editedTab() : null))
	const historyDrafts = createHistoryDrafts(editorDraft, {
		readyTab,
		onDraftLoaded: () => {
			setIsShowingHistory(false)
		},
	})
	const changeWatcher = createChangeWatcherState()

	const popOutHandler = createMemo(() => {
		const tab = editedTab()
		return tab && canPopOut(tab) ? () => void popOut(tab) : null
	})
	const focusTabHandler = createMemo(() => {
		const tab = editedTab()
		if (!tab || status() === "closed" || !canFocusTab(tab)) return null
		return () => void focusTab(tab)
	})
	const switchViewHandler = createMemo(() => {
		if (!readyTab()) return null
		return (shouldShowHistory: boolean) => {
			if (shouldShowHistory !== isShowingHistory()) mainElement.scrollTop = 0
			setIsShowingHistory(shouldShowHistory)
		}
	})
	const restoreNewestStashedDraftHandler = createMemo(() => {
		if (!readyTab() || historyDrafts.stashedDrafts().length === 0) return null
		return () => {
			historyDrafts.restoreStashedDraft(0)
		}
	})

	let blockedNoticeTimer: ReturnType<typeof setTimeout> | undefined
	let mainElement: HTMLElement

	function resetToTabUrl(): void {
		const tab = editedTab()
		if (tab) editorDraft.loadDraft(tabUrlDraft(tab.url))
	}

	function stashEditsAndResetToTabUrl(): void {
		historyDrafts.stashCurrentDraft()
		resetToTabUrl()
	}

	function openEditedUrl(): void {
		const tab = editedTab()
		if (!tab) return
		const targetHref = editorDraft.editedHref()
		openUrlFromEditor(tab, {
			href: targetHref,
			editedFromEntryNumber: editorDraft.editedFromEntryNumber(),
		}).catch(() => {
			setBlockedHref(targetHref)
			clearTimeout(blockedNoticeTimer)
			blockedNoticeTimer = setTimeout(() => {
				setBlockedHref(null)
			}, BLOCKED_NOTICE_MS)
		})
	}

	function followTabNavigation(navigatedUrl: string): void {
		const tab = editedTab()
		if (!tab) return
		setEditedTab({ ...tab, url: navigatedUrl })
		editorDraft.loadDraft(tabUrlDraft(navigatedUrl))
	}

	async function loadTabAndDrafts(): Promise<void> {
		const tab = await getEditedTab()
		if (!tab) {
			setStatus("unavailable")
			return
		}
		setEditedTab(tab)
		const [savedDraft] = await Promise.all([
			loadDraft(tab),
			historyDrafts.recordOriginalEntryAndLoadForTab(tab),
			changeWatcher.loadForTab(tab),
		])
		editorDraft.loadDraft(savedDraft ?? tabUrlDraft(tab.url))
		setStatus("ready")
	}

	onSettled(() => {
		void loadTabAndDrafts()
		const handleEnterKey = openOnEnter(openEditedUrl)
		window.addEventListener("keydown", handleEnterKey)
		return () => {
			window.removeEventListener("keydown", handleEnterKey)
		}
	})

	createEffect(
		() => [readyTab(), editorDraft.currentDraft()] as const,
		([tab, draft]) => {
			if (tab) void saveDraft(tab, draft)
		},
	)

	function watchTabAndDrafts(tab: EditedTab): () => void {
		const stopWatchingDrafts = watchDraft(tab, (otherViewDraft) => {
			if (!isSameDraft(otherViewDraft, editorDraft.currentDraft())) {
				editorDraft.loadDraft(otherViewDraft)
			}
		})
		const stopWatchingHistory = watchHistory(tab, (history) => {
			historyDrafts.setHistory(history)
		})
		const stopWatchingAccess = changeWatcher.watchAccess()
		const stopWatchingTab = watchTab(tab, {
			onUrlChange: followTabNavigation,
			onClose: () => {
				setStatus("closed")
			},
		})
		return () => {
			stopWatchingDrafts()
			stopWatchingHistory()
			stopWatchingAccess()
			stopWatchingTab()
		}
	}

	createEffect(readyTab, (tab) => (tab ? watchTabAndDrafts(tab) : undefined))

	return (
		<div
			class="flex h-(--height-popup) flex-col windowed:h-dvh"
			onFocusIn={() => {
				editorDraft.rememberStateAtFocus()
			}}>
			<TopBar
				isShowingHistory={isShowingHistory()}
				historyEntryCount={historyDrafts.history().length}
				onSwitchView={switchViewHandler()}
				onPopOut={popOutHandler()}
				onFocusTab={focusTabHandler()}
			/>
			<main
				ref={(node) => {
					mainElement = node
				}}
				class="flex min-h-0 flex-auto scroll-py-3 flex-col overflow-y-auto overscroll-contain bg-canvas p-3">
				<Switch>
					<Match when={status() === "closed"}>
						<TabClosedNotice />
					</Match>
					<Match when={isShowingHistory() && readyTab()}>
						{(tab) => (
							<HistoryView
								history={historyDrafts.history()}
								tabUrl={tab().url}
								stashedDrafts={historyDrafts.stashedDrafts()}
								isChangeWatcherOn={changeWatcher.isChangeWatcherOn()}
								hasRedirectStatusAccess={changeWatcher.hasRedirectStatusAccess()}
								onEditEntry={historyDrafts.editEntryOrAskFirst}
								onRestoreStashedDraft={
									historyDrafts.restoreStashedDraft
								}
								onDropStashedDraft={historyDrafts.dropStashedDraft}
								onDropAllStashedDrafts={
									historyDrafts.dropAllStashedDrafts
								}
								onToggleChangeWatcher={() => {
									changeWatcher.toggleChangeWatcher(tab())
								}}
								onAskForRedirectStatusAccess={
									changeWatcher.askForRedirectStatusAccess
								}
							/>
						)}
					</Match>
					<Match when={editorDraft.editedUrl()}>
						{(url) => (
							<UrlEditorFields
								url={url()}
								href={editorDraft.editedHref()}
								params={editorDraft.params()}
								onFullUrlEdit={editorDraft.editFullUrl}
								onPartEdit={editorDraft.editPart}
								onQueryEdit={editorDraft.editQuery}
								onParamEdit={editorDraft.editParamText}
								onAddParam={editorDraft.addBlankParam}
								onMoveParam={editorDraft.moveParamTo}
								onRemoveParam={editorDraft.removeParam}
							/>
						)}
					</Match>
					<Match when={status() === "unavailable"}>
						<NoUrlToEditNotice />
					</Match>
				</Switch>
			</main>
			<Show when={editorDraft.editedUrl() && status() !== "closed"}>
				<ActionBar
					isEdited={editorDraft.editedHref() !== editedTab()?.url}
					wasBlocked={blockedHref() === editorDraft.editedHref()}
					editedFromEntryNumber={editorDraft.editedFromEntryNumber()}
					onRestoreNewestStashedDraft={restoreNewestStashedDraftHandler()}
					onReset={resetToTabUrl}
					onStashEditsAndReset={stashEditsAndResetToTabUrl}
					onOpenUrl={openEditedUrl}
				/>
			</Show>
			<Show when={historyDrafts.entryAwaitingDecision()}>
				{(entry) => (
					<UnsavedEditsDialog
						entryNumber={entry().entryNumber}
						onDecide={historyDrafts.decideAboutUnsavedEdits}
					/>
				)}
			</Show>
		</div>
	)
}

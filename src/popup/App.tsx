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
import { Notice } from "../components/Notice.tsx"
import { ParamsEditor } from "../components/ParamsEditor.tsx"
import { PartsEditor } from "../components/PartsEditor.tsx"
import { TopBar } from "../components/TopBar.tsx"
import { UrlBar } from "../components/UrlBar.tsx"
import { loadDraft, saveDraft, watchDraft } from "../lib/browser/drafts.ts"
import {
	type EditedTab,
	getEditedTab,
	navigateTab,
	watchTab,
} from "../lib/browser/tabs.ts"
import { canFocusTab, canPopOut, focusTab, popOut } from "../lib/browser/windows.ts"
import {
	editHref,
	editParam,
	editPart,
	editQuery,
	hrefWithParams,
	type ParamEdit,
} from "../lib/url/edit.ts"
import { BLANK_PARAM, moveParam, type Param, parseParams } from "../lib/url/params.ts"
import type { UrlPart } from "../lib/url/parts.ts"

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
	const [editedHref, setEditedHref] = createSignal("")
	const [params, setParams] = createSignal<readonly Param[]>([])
	const [blockedHref, setBlockedHref] = createSignal<string | null>(null)

	const editedUrl = createMemo(() =>
		editedHref() === "" ? null : new URL(editedHref()),
	)
	const readyTab = createMemo(() => (status() === "ready" ? editedTab() : null))

	const popOutHandler = createMemo(() => {
		const tab = editedTab()
		return tab && canPopOut(tab) ? () => void popOut(tab) : null
	})
	const focusTabHandler = createMemo(() => {
		const tab = editedTab()
		if (!tab || status() === "closed" || !canFocusTab(tab)) return null
		return () => void focusTab(tab)
	})

	let stateAtFocus: { href: string; params: readonly Param[] } = {
		href: "",
		params: [],
	}
	let blockedNoticeTimer: ReturnType<typeof setTimeout> | undefined

	function loadHref(nextHref: string): void {
		setEditedHref(nextHref)
		setParams(parseParams(new URL(nextHref).search))
	}

	function loadHrefIfValid(nextHref: string | null): boolean {
		if (nextHref === null) return false
		loadHref(nextHref)
		return true
	}

	function rememberStateAtFocus(): void {
		stateAtFocus = { href: editedHref(), params: params() }
	}

	function editUrlPart(part: UrlPart, typedText: string): boolean {
		return loadHrefIfValid(editPart(stateAtFocus.href, part, typedText))
	}

	function setParamsAndHref(nextParams: readonly Param[]): void {
		setParams(nextParams)
		setEditedHref(hrefWithParams(editedHref(), nextParams))
	}

	function editParamText(edit: ParamEdit): void {
		setParamsAndHref(editParam(stateAtFocus.params, edit))
	}

	function addBlankParam(): void {
		setParams([...params(), BLANK_PARAM])
	}

	function moveParamTo(fromIndex: number, toIndex: number): void {
		setParamsAndHref(moveParam(params(), fromIndex, toIndex))
	}

	function removeParam(removedIndex: number): void {
		setParamsAndHref(
			params().filter((_, paramIndex) => paramIndex !== removedIndex),
		)
	}

	function openEditedUrl(): void {
		const tab = editedTab()
		if (!tab) return
		const targetHref = editedHref()
		navigateTab(tab, targetHref).catch(() => {
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
		loadHref(navigatedUrl)
	}

	onSettled(() => {
		void (async () => {
			const tab = await getEditedTab()
			if (!tab) {
				setStatus("unavailable")
				return
			}
			setEditedTab(tab)
			loadHref((await loadDraft(tab)) ?? tab.url)
			setStatus("ready")
		})()

		const handleEnterKey = openOnEnter(openEditedUrl)
		window.addEventListener("keydown", handleEnterKey)
		return () => {
			window.removeEventListener("keydown", handleEnterKey)
		}
	})

	createEffect(
		() => [readyTab(), editedHref()] as const,
		([tab, href]) => {
			if (tab) void saveDraft(tab, href)
		},
	)

	function watchTabAndDrafts(tab: EditedTab): () => void {
		const stopWatchingDrafts = watchDraft(tab, (otherViewHref) => {
			if (otherViewHref !== editedHref()) loadHref(otherViewHref)
		})
		const stopWatchingTab = watchTab(tab, {
			onUrlChange: followTabNavigation,
			onClose: () => {
				setStatus("closed")
			},
		})
		return () => {
			stopWatchingDrafts()
			stopWatchingTab()
		}
	}

	createEffect(readyTab, (tab) => (tab ? watchTabAndDrafts(tab) : undefined))

	return (
		<div
			class="flex h-(--height-popup) flex-col windowed:h-dvh"
			onFocusIn={rememberStateAtFocus}>
			<TopBar onPopOut={popOutHandler()} onFocusTab={focusTabHandler()} />
			<main class="flex min-h-0 flex-auto scroll-py-3 flex-col gap-2.5 overflow-y-auto overscroll-contain p-3">
				<Switch>
					<Match when={status() === "closed"}>
						<Notice title="This tab was closed">
							Open the editor from another tab to keep editing its URL.
						</Notice>
					</Match>
					<Match when={editedUrl()}>
						{(url) => (
							<>
								<UrlBar
									href={editedHref()}
									onEdit={(typedHref) =>
										loadHrefIfValid(
											editHref(stateAtFocus.href, typedHref),
										)
									}
								/>
								<PartsEditor url={url()} onEdit={editUrlPart} />
								<ParamsEditor
									url={url()}
									params={params()}
									onQueryEdit={(typedQuery) =>
										loadHrefIfValid(
											editQuery(stateAtFocus.href, typedQuery),
										)
									}
									onParamEdit={editParamText}
									onAddParam={addBlankParam}
									onMoveParam={moveParamTo}
									onRemoveParam={removeParam}
								/>
							</>
						)}
					</Match>
					<Match when={status() === "unavailable"}>
						<Notice title="No URL to edit">
							This tab hasn't loaded a page yet. Try again once it has.
						</Notice>
					</Match>
				</Switch>
			</main>
			<Show when={editedUrl() && status() !== "closed"}>
				<ActionBar
					isEdited={editedHref() !== editedTab()?.url}
					wasBlocked={blockedHref() === editedHref()}
					onReset={() => {
						const tab = editedTab()
						if (tab) loadHref(tab.url)
					}}
					onOpenUrl={openEditedUrl}
				/>
			</Show>
		</div>
	)
}

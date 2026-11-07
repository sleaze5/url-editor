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
	type ActiveTab,
	getActiveTab,
	navigate,
	watchTab,
} from "../lib/browser/tabs.ts"
import { canFocusTab, canPopOut, focusTab, popOut } from "../lib/browser/windows.ts"
import {
	editHref,
	editParam,
	editPart,
	editQuery,
	type ParamEdit,
	withParams,
} from "../lib/url/edit.ts"
import { BLANK_PARAM, moveParam, type Param, parseParams } from "../lib/url/params.ts"
import type { PartSpec } from "../lib/url/parts.ts"

type Status = "loading" | "ready" | "unavailable" | "closed"

const FAILED_MS = 5000

function submitOnEnter(submit: () => void): (event: KeyboardEvent) => void {
	return (event) => {
		if (event.key !== "Enter" || event.defaultPrevented) return
		if (event.target instanceof HTMLButtonElement) return
		event.preventDefault()
		submit()
	}
}

export function App() {
	const [tab, setTab] = createSignal<ActiveTab | null>(null)
	const [status, setStatus] = createSignal<Status>("loading")
	const [href, setHref] = createSignal("")
	const [params, setParams] = createSignal<readonly Param[]>([])
	const [failedHref, setFailedHref] = createSignal<string | null>(null)

	const url = createMemo(() => (href() === "" ? null : new URL(href())))
	const ready = createMemo(() => (status() === "ready" ? tab() : null))

	const popOutAction = createMemo(() => {
		const current = tab()
		return current && canPopOut(current) ? () => void popOut(current) : null
	})
	const focusTabAction = createMemo(() => {
		const current = tab()
		if (!current || status() === "closed" || !canFocusTab(current)) return null
		return () => void focusTab(current)
	})

	let base: { href: string; params: readonly Param[] } = { href: "", params: [] }
	let failedTimer: ReturnType<typeof setTimeout> | undefined

	function load(next: string): void {
		setHref(next)
		setParams(parseParams(new URL(next).search))
	}

	function commit(next: string | null): boolean {
		if (next === null) return false
		load(next)
		return true
	}

	function snapshot(): void {
		base = { href: href(), params: params() }
	}

	function editUrlPart(part: PartSpec, raw: string): boolean {
		return commit(editPart(base.href, part, raw))
	}

	function updateParams(next: readonly Param[]): void {
		setParams(next)
		setHref(withParams(href(), next))
	}

	function editParamField(edit: ParamEdit): void {
		updateParams(editParam(base.params, edit))
	}

	function addParam(): void {
		setParams([...params(), BLANK_PARAM])
	}

	function reorderParam(from: number, to: number): void {
		updateParams(moveParam(params(), from, to))
	}

	function removeParam(index: number): void {
		updateParams(params().filter((_, i) => i !== index))
	}

	function apply(): void {
		const current = tab()
		if (!current) return
		const target = href()
		navigate(current, target).catch(() => {
			setFailedHref(target)
			clearTimeout(failedTimer)
			failedTimer = setTimeout(() => {
				setFailedHref(null)
			}, FAILED_MS)
		})
	}

	function followTab(next: string): void {
		const current = tab()
		if (!current) return
		setTab({ ...current, url: next })
		load(next)
	}

	onSettled(() => {
		void (async () => {
			const current = await getActiveTab()
			if (!current) {
				setStatus("unavailable")
				return
			}
			setTab(current)
			load((await loadDraft(current)) ?? current.url)
			setStatus("ready")
		})()

		const keydown = submitOnEnter(apply)
		window.addEventListener("keydown", keydown)
		return () => {
			window.removeEventListener("keydown", keydown)
		}
	})

	createEffect(
		() => [ready(), href()] as const,
		([current, next]) => {
			if (current) void saveDraft(current, next)
		},
	)

	function watch(current: ActiveTab): () => void {
		const stopDraft = watchDraft(current, (next) => {
			if (next !== href()) load(next)
		})
		const stopTab = watchTab(current, {
			onurl: followTab,
			onclose: () => {
				setStatus("closed")
			},
		})
		return () => {
			stopDraft()
			stopTab()
		}
	}

	createEffect(ready, (current) => (current ? watch(current) : undefined))

	return (
		<div
			class="flex h-(--height-popup) flex-col windowed:h-dvh"
			onFocusIn={snapshot}>
			<TopBar onPopOut={popOutAction()} onFocusTab={focusTabAction()} />
			<main class="flex min-h-0 flex-auto scroll-py-3 flex-col gap-2.5 overflow-y-auto overscroll-contain p-3">
				<Switch>
					<Match when={status() === "closed"}>
						<Notice title="This tab was closed">
							Open the editor from another tab to keep editing its URL.
						</Notice>
					</Match>
					<Match when={url()}>
						{(current) => (
							<>
								<UrlBar
									href={href()}
									onEdit={(raw) => commit(editHref(base.href, raw))}
								/>
								<PartsEditor url={current()} onEdit={editUrlPart} />
								<ParamsEditor
									url={current()}
									params={params()}
									onQueryEdit={(raw) =>
										commit(editQuery(base.href, raw))
									}
									onEdit={editParamField}
									onAdd={addParam}
									onMove={reorderParam}
									onRemove={removeParam}
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
			<Show when={url() && status() !== "closed"}>
				<ActionBar
					dirty={href() !== tab()?.url}
					failed={failedHref() === href()}
					onReset={() => {
						const current = tab()
						if (current) load(current.url)
					}}
					onApply={apply}
				/>
			</Show>
		</div>
	)
}

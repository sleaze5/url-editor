import { createSignal } from "solid-js"

import {
	loadIsChangeWatcherOn,
	switchChangeWatcher,
} from "../lib/browser/change-watcher.ts"
import {
	hasRedirectStatusAccess,
	requestRedirectStatusAccess,
	watchRedirectStatusAccess,
} from "../lib/browser/permissions.ts"
import type { EditedTab } from "../lib/browser/tabs.ts"

export function createChangeWatcherState() {
	const [isChangeWatcherOn, setIsChangeWatcherOn] = createSignal(false)
	const [hasAccess, setHasAccess] = createSignal(true)

	async function askForAccess(): Promise<void> {
		try {
			setHasAccess(await requestRedirectStatusAccess())
		} catch (error) {
			console.error("Couldn't ask for access to redirect statuses", error)
		}
	}

	return {
		isChangeWatcherOn,
		hasRedirectStatusAccess: hasAccess,
		loadForTab: async (tab: EditedTab): Promise<void> => {
			const [isOn, isAccessGranted] = await Promise.all([
				loadIsChangeWatcherOn(tab),
				hasRedirectStatusAccess(),
			])
			setIsChangeWatcherOn(isOn)
			setHasAccess(isAccessGranted)
		},
		watchAccess: (): (() => void) =>
			watchRedirectStatusAccess(() => {
				void hasRedirectStatusAccess().then(setHasAccess)
			}),
		toggleChangeWatcher: (tab: EditedTab): void => {
			const isTurningOn = !isChangeWatcherOn()
			if (isTurningOn && !hasAccess()) void askForAccess()
			setIsChangeWatcherOn(isTurningOn)
			void switchChangeWatcher(tab, isTurningOn)
		},
		askForRedirectStatusAccess: (): void => {
			void askForAccess()
		},
	}
}

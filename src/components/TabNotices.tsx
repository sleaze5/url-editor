import AppWindow from "@lucide/solid/icons/app-window"
import Link2Off from "@lucide/solid/icons/link-2-off"

import { Notice } from "./Notice.tsx"

export function TabClosedNotice() {
	return (
		<Notice icon={AppWindow} title="This tab was closed">
			Open the editor from another tab.
		</Notice>
	)
}

export function NoUrlToEditNotice() {
	return (
		<Notice icon={Link2Off} title="No URL to edit">
			This tab has not loaded a page yet.
		</Notice>
	)
}

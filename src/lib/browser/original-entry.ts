import { hasSessionStorageApi } from "./session-storage.ts"
import type { EditedTab } from "./tabs.ts"

interface OriginalEntryRequest {
	kind: "record-original-entry"
	tabId: number
	href: string
	recordedAt: number
}

const ORIGINAL_ENTRY_PORT_NAME = "original-entry"

function isOriginalEntryRequest(message: unknown): message is OriginalEntryRequest {
	if (typeof message !== "object" || message === null) return false
	const request = message as Partial<OriginalEntryRequest>
	return (
		request.kind === "record-original-entry" &&
		typeof request.tabId === "number" &&
		typeof request.href === "string" &&
		typeof request.recordedAt === "number"
	)
}

export async function recordOriginalEntryIfHistoryIsEmpty(
	tab: EditedTab,
): Promise<void> {
	if (tab.id === undefined || !hasSessionStorageApi()) return
	const request: OriginalEntryRequest = {
		kind: "record-original-entry",
		tabId: tab.id,
		href: tab.url,
		recordedAt: Date.now(),
	}
	const port = chrome.runtime.connect({ name: ORIGINAL_ENTRY_PORT_NAME })
	await new Promise<void>((resolve) => {
		port.onMessage.addListener(() => {
			port.disconnect()
			resolve()
		})
		port.onDisconnect.addListener(() => {
			resolve()
		})
		port.postMessage(request)
	})
}

export function listenForOriginalEntryRequests(
	onRequest: (request: OriginalEntryRequest) => Promise<void>,
): void {
	chrome.runtime.onConnect.addListener((port) => {
		if (port.name !== ORIGINAL_ENTRY_PORT_NAME) return
		port.onMessage.addListener((message: unknown) => {
			if (!isOriginalEntryRequest(message)) return
			void onRequest(message).finally(() => {
				try {
					port.postMessage("recorded")
				} catch {
					// The editor closed before the answer; the entry is recorded anyway.
				}
			})
		})
	})
}

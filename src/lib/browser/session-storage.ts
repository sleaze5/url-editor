export const hasSessionStorageApi = (): boolean =>
	typeof chrome !== "undefined" && "storage" in chrome && "session" in chrome.storage

export async function readSessionValue(storageKey: string): Promise<unknown> {
	const { [storageKey]: storedValue } = await chrome.storage.session.get(storageKey)
	return storedValue
}

export function watchSessionValue(
	storageKey: string,
	onChange: (newValue: unknown) => void,
): () => void {
	const handleStorageChange = (
		changes: Record<string, chrome.storage.StorageChange>,
	): void => {
		const change = changes[storageKey]
		if (change) onChange(change.newValue)
	}
	chrome.storage.session.onChanged.addListener(handleStorageChange)
	return () => {
		chrome.storage.session.onChanged.removeListener(handleStorageChange)
	}
}

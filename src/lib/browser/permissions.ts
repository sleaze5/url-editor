const REDIRECT_STATUS_ACCESS = {
	permissions: ["webRequest"],
	origins: ["<all_urls>"],
} satisfies chrome.permissions.Permissions

const hasPermissionsApi = (): boolean =>
	typeof chrome !== "undefined" && "permissions" in chrome

export function hasRedirectStatusAccess(): Promise<boolean> {
	if (!hasPermissionsApi()) return Promise.resolve(true)
	return chrome.permissions.contains(REDIRECT_STATUS_ACCESS)
}

export function requestRedirectStatusAccess(): Promise<boolean> {
	if (!hasPermissionsApi()) return Promise.resolve(true)
	return chrome.permissions.request(REDIRECT_STATUS_ACCESS)
}

export function watchRedirectStatusAccess(onAccessChange: () => void): () => void {
	if (!hasPermissionsApi()) return () => {}
	const handlePermissionsChange = (): void => {
		onAccessChange()
	}
	chrome.permissions.onAdded.addListener(handlePermissionsChange)
	chrome.permissions.onRemoved.addListener(handlePermissionsChange)
	return () => {
		chrome.permissions.onAdded.removeListener(handlePermissionsChange)
		chrome.permissions.onRemoved.removeListener(handlePermissionsChange)
	}
}

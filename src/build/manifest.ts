export type Browser = "chrome" | "firefox"

const ICONS = {
	"16": "icons/icon16.png",
	"32": "icons/icon32.png",
	"48": "icons/icon48.png",
	"128": "icons/icon128.png",
}

export function createManifest(
	browser: Browser,
	version: string,
): chrome.runtime.ManifestV3 {
	const manifest: chrome.runtime.ManifestV3 = {
		manifest_version: 3,
		name: "URL Editor",
		description:
			"A simple browser extension to parse and edit the current page's URL.",
		version,
		homepage_url: "https://github.com/sleaze5/url-editor",
		icons: ICONS,
		action: {
			default_title: "Edit URL",
			default_popup: "index.html",
			default_icon: ICONS,
		},
		// `tabs` is needed to read URLs of browser pages (chrome://, about:), which activeTab skips.
		permissions: ["activeTab", "tabs", "storage"],
	}
	if (browser === "chrome") return { ...manifest, minimum_chrome_version: "120" }
	return {
		...manifest,
		browser_specific_settings: {
			gecko: {
				id: "url-editor@sleaze5",
				strict_min_version: "128.0",
				data_collection_permissions: { required: ["none"] },
			},
		},
	}
}

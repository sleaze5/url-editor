export type Browser = "chrome" | "firefox"

/** The oldest version of each browser that the extension and its build target support. */
export const MIN_VERSION: Record<Browser, number> = { chrome: 120, firefox: 128 }

interface Package {
	version: string
	description: string
	homepage: string
}

const ICONS = {
	"16": "icons/icon16.png",
	"32": "icons/icon32.png",
	"48": "icons/icon48.png",
	"128": "icons/icon128.png",
}

export function createManifest(
	browser: Browser,
	pkg: Package,
): chrome.runtime.ManifestV3 {
	const manifest: chrome.runtime.ManifestV3 = {
		manifest_version: 3,
		name: "URL Editor",
		description: pkg.description,
		version: pkg.version,
		homepage_url: pkg.homepage,
		icons: ICONS,
		action: {
			default_title: "Edit URL",
			default_popup: "index.html",
			default_icon: ICONS,
		},
		// `tabs` is needed to read URLs of browser pages (chrome://, about:), which activeTab skips.
		permissions: ["activeTab", "tabs", "storage"],
	}
	if (browser === "chrome") {
		return { ...manifest, minimum_chrome_version: String(MIN_VERSION.chrome) }
	}
	return {
		...manifest,
		browser_specific_settings: {
			gecko: {
				id: "url-editor@sleaze5",
				strict_min_version: `${MIN_VERSION.firefox}.0`,
				data_collection_permissions: { required: ["none"] },
			},
		},
	}
}

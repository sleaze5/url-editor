export type Browser = "chrome" | "firefox"

export const MIN_BROWSER_VERSION: Record<Browser, number> = {
	chrome: 120,
	firefox: 128,
}

interface PackageJsonFields {
	version: string
	description: string
	homepage: string
}

export const BACKGROUND_SCRIPT_PATH = "background.js"

type ExtensionManifest = Omit<chrome.runtime.ManifestV3, "background"> & {
	background:
		| { service_worker: string; type: "module" }
		| { scripts: string[]; type: "module" }
}

const ICON_PATH_BY_SIZE = {
	"16": "icons/icon16.png",
	"32": "icons/icon32.png",
	"48": "icons/icon48.png",
	"128": "icons/icon128.png",
}

export function createManifest(
	browser: Browser,
	packageJson: PackageJsonFields,
): ExtensionManifest {
	const manifest: Omit<ExtensionManifest, "background"> = {
		manifest_version: 3,
		name: "URL Editor",
		description: packageJson.description,
		version: packageJson.version,
		homepage_url: packageJson.homepage,
		icons: ICON_PATH_BY_SIZE,
		action: {
			default_title: "Edit URL",
			default_popup: "index.html",
			default_icon: ICON_PATH_BY_SIZE,
		},
		permissions: ["activeTab", "tabs", "storage", "webNavigation"],
		optional_permissions: ["webRequest"],
		optional_host_permissions: ["<all_urls>"],
	}
	if (browser === "chrome") {
		return {
			...manifest,
			background: { service_worker: BACKGROUND_SCRIPT_PATH, type: "module" },
			minimum_chrome_version: String(MIN_BROWSER_VERSION.chrome),
		}
	}
	return {
		...manifest,
		background: { scripts: [BACKGROUND_SCRIPT_PATH], type: "module" },
		browser_specific_settings: {
			gecko: {
				id: "url-editor@sleaze5",
				strict_min_version: `${MIN_BROWSER_VERSION.firefox}.0`,
				data_collection_permissions: { required: ["none"] },
			},
		},
	}
}

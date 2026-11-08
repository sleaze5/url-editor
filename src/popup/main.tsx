import "../styles/app.css"

import { render } from "@solidjs/web"

import { isWindowed } from "../lib/browser/tabs.ts"
import { prepareWindowAndDecideToRender } from "../lib/browser/windows.ts"
import { App } from "./App.tsx"

const appRoot = document.querySelector("#app")
if (!appRoot) throw new Error("Missing #app mount point")

function blockBrowserMenuOutsideTextFieldsAndSelections(event: MouseEvent): void {
	const isInTextField =
		event.target instanceof HTMLTextAreaElement ||
		event.target instanceof HTMLInputElement
	const hasSelectedText = document.getSelection()?.isCollapsed === false
	if (!isInTextField && !hasSelectedText) event.preventDefault()
}

document.documentElement.classList.toggle("windowed", isWindowed)
document.addEventListener("contextmenu", blockBrowserMenuOutsideTextFieldsAndSelections)
if (await prepareWindowAndDecideToRender()) render(() => <App />, appRoot)

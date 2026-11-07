import "../styles/app.css"

import { render } from "@solidjs/web"

import { isWindowed } from "../lib/browser/tabs.ts"
import { prepareWindowAndDecideToRender } from "../lib/browser/windows.ts"
import { App } from "./App.tsx"

const appRoot = document.querySelector("#app")
if (!appRoot) throw new Error("Missing #app mount point")

document.documentElement.classList.toggle("windowed", isWindowed)
if (await prepareWindowAndDecideToRender()) render(() => <App />, appRoot)

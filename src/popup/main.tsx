import "../styles/app.css"

import { render } from "@solidjs/web"

import { isWindowed } from "../lib/browser/tabs.ts"
import { prepareWindow } from "../lib/browser/windows.ts"
import { App } from "./App.tsx"

const target = document.querySelector("#app")
if (!target) throw new Error("Missing #app mount point")

document.documentElement.classList.toggle("windowed", isWindowed)
if (await prepareWindow()) render(() => <App />, target)

import "../styles/global.css"

import { mount } from "svelte"

import { isWindowed } from "../lib/browser/tabs"
import { prepareWindow } from "../lib/browser/windows"
import App from "./App.svelte"

const target = document.querySelector("#app")
if (!target) throw new Error("Missing #app mount point")

document.documentElement.classList.toggle("windowed", isWindowed)
if (await prepareWindow()) mount(App, { target })

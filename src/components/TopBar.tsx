import PictureInPicture2 from "@lucide/solid/icons/picture-in-picture-2"
import View from "@lucide/solid/icons/view"
import { Show } from "solid-js"

import icon from "../assets/icons/icon.svg"

import { IconButton } from "./IconButton.tsx"

interface TopBarProps {
	onPopOut: (() => void) | null
	onFocusTab: (() => void) | null
}

export function TopBar(props: TopBarProps) {
	return (
		<header class="flex h-10 flex-none items-center gap-2 border-b border-line bg-bg px-3 select-none">
			<img
				src={icon}
				alt=""
				width="16"
				height="16"
				draggable={false}
				class="block flex-none"
			/>
			<h1 translate="no" class="flex-1 text-base font-semibold">
				URL Editor
			</h1>
			<div class="-mr-1.5 flex gap-2">
				<Show when={props.onFocusTab}>
					{(focusTab) => (
						<IconButton
							icon={View}
							label="Switch to the tab"
							onClick={() => {
								focusTab()()
							}}
						/>
					)}
				</Show>
				<Show when={props.onPopOut}>
					{(popOut) => (
						<IconButton
							icon={PictureInPicture2}
							label="Open in a window"
							onClick={() => {
								popOut()()
							}}
						/>
					)}
				</Show>
			</div>
		</header>
	)
}

import type { LucideProps } from "@lucide/solid"
import type { JSX } from "@solidjs/web"
import type { Component } from "solid-js"

interface NoticeProps {
	icon: Component<LucideProps>
	title: string
	children: JSX.Element
}

export function Notice(props: NoticeProps) {
	return (
		<output class="empty-state">
			<props.icon size={28} aria-hidden="true" />
			<p>{props.title}</p>
			<p>{props.children}</p>
		</output>
	)
}

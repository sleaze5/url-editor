import type { JSX } from "@solidjs/web"

interface NoticeProps {
	title: string
	children: JSX.Element
}

export function Notice(props: NoticeProps) {
	return (
		<output class="m-auto flex max-w-[32ch] flex-col gap-1 text-center text-balance text-fg-muted">
			<p class="text-base font-semibold text-fg">{props.title}</p>
			<p>{props.children}</p>
		</output>
	)
}

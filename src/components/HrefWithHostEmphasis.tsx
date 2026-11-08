import { For } from "solid-js"

import { type HrefSegmentKind, splitHrefIntoSegments } from "../lib/url/segments.ts"

interface HrefWithHostEmphasisProps {
	href: string
}

const SEGMENT_KIND_CLASSES: Record<HrefSegmentKind, string> = {
	"scheme": "text-fg-muted",
	"credentials": "text-fg-muted",
	"host": "text-fg-bright",
	"port": "text-fg-muted",
	"path": "text-fg-muted",
	"query-name": "text-fg-muted",
	"query-value": "text-fg-muted",
	"hash": "text-fg-muted",
	"punctuation": "text-fg-faint",
	"unparsed": "text-fg",
}

export function HrefWithHostEmphasis(props: HrefWithHostEmphasisProps) {
	return (
		<For each={splitHrefIntoSegments(props.href)}>
			{(segment) => (
				<span class={SEGMENT_KIND_CLASSES[segment.kind]}>{segment.text}</span>
			)}
		</For>
	)
}

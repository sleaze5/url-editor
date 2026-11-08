import type { LucideProps } from "@lucide/solid"
import CornerDownRight from "@lucide/solid/icons/corner-down-right"
import Flag from "@lucide/solid/icons/flag"
import Hash from "@lucide/solid/icons/hash"
import MousePointerClick from "@lucide/solid/icons/mouse-pointer-click"
import PencilLine from "@lucide/solid/icons/pencil-line"
import { dynamic } from "@solidjs/web"
import type { Component } from "solid-js"

import type { ChangeType } from "../lib/history/filters.ts"

interface ChangeTypeIconProps {
	changeType: ChangeType | null
}

const CHANGE_TYPE_ICONS: Record<ChangeType, Component<LucideProps>> = {
	"editor": PencilLine,
	"redirects": CornerDownRight,
	"navigations": MousePointerClick,
	"in-page": Hash,
}

export function ChangeTypeIcon(props: ChangeTypeIconProps) {
	const Icon = dynamic(() =>
		props.changeType ? CHANGE_TYPE_ICONS[props.changeType] : Flag,
	)
	return <Icon size={12} aria-hidden="true" />
}

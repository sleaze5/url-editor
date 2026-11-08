import type { ParamEdit } from "../lib/url/edit.ts"
import type { Param } from "../lib/url/params.ts"
import type { UrlPart } from "../lib/url/parts.ts"
import { ParamsEditor } from "./ParamsEditor.tsx"
import { PartsEditor } from "./PartsEditor.tsx"
import { UrlBar } from "./UrlBar.tsx"

interface UrlEditorFieldsProps {
	url: URL
	href: string
	params: readonly Param[]
	onFullUrlEdit: (typedHref: string) => boolean
	onPartEdit: (part: UrlPart, typedText: string) => boolean
	onQueryEdit: (typedQuery: string) => boolean
	onParamEdit: (edit: ParamEdit) => void
	onAddParam: () => void
	onMoveParam: (fromIndex: number, toIndex: number) => void
	onRemoveParam: (paramIndex: number) => void
}

export function UrlEditorFields(props: UrlEditorFieldsProps) {
	return (
		<div class="flex animate-enter flex-col gap-3">
			<UrlBar href={props.href} onEdit={props.onFullUrlEdit} />
			<PartsEditor url={props.url} onEdit={props.onPartEdit} />
			<ParamsEditor
				url={props.url}
				params={props.params}
				onQueryEdit={props.onQueryEdit}
				onParamEdit={props.onParamEdit}
				onAddParam={props.onAddParam}
				onMoveParam={props.onMoveParam}
				onRemoveParam={props.onRemoveParam}
			/>
		</div>
	)
}

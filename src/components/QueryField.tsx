import { createMemo, createSignal, Show } from "solid-js"

import { Field } from "./Field.tsx"

interface QueryFieldProps {
	url: URL
	onEdit: (typedQuery: string) => boolean
}

export function QueryField(props: QueryFieldProps) {
	const [isQueryFieldFocused, setIsQueryFieldFocused] = createSignal(false)
	const isQueryFieldShown = createMemo(
		() => isQueryFieldFocused() || props.url.search !== "",
	)

	return (
		<Show when={isQueryFieldShown()}>
			<div
				class="flex animate-enter flex-col"
				onFocusIn={() => {
					setIsQueryFieldFocused(true)
				}}
				onFocusOut={() => {
					setIsQueryFieldFocused(false)
				}}>
				<label class="group/field flex flex-col gap-1">
					<span class="field-label">Query string</span>
					<Field
						label="Query string"
						textAtRest={props.url.search.slice(1)}
						onEdit={props.onEdit}
					/>
				</label>
			</div>
		</Show>
	)
}

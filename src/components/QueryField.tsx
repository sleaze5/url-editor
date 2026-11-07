import { createMemo, createSignal, Show } from "solid-js"

import { Field } from "./Field.tsx"

interface QueryFieldProps {
	url: URL
	onEdit: (typedQuery: string) => boolean
}

/** The whole query string as one field, shown when the URL has a query or while focused. */
export function QueryField(props: QueryFieldProps) {
	const [isQueryFieldFocused, setIsQueryFieldFocused] = createSignal(false)
	const isQueryFieldShown = createMemo(
		() => isQueryFieldFocused() || props.url.search !== "",
	)

	return (
		<Show when={isQueryFieldShown()}>
			<div
				class="mb-1 flex flex-col gap-0.5 border-b border-line pb-2.5"
				onFocusIn={() => {
					setIsQueryFieldFocused(true)
				}}
				onFocusOut={() => {
					setIsQueryFieldFocused(false)
				}}>
				<label class="flex flex-col gap-0.5">
					<span class="block pl-px text-xs font-medium text-fg-muted select-none">
						Query string
					</span>
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

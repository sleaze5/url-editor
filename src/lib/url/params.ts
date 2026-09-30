export interface Param {
	key: string
	value: string
	hasValue: boolean
}

export function parseParams(search: string): Param[] {
	const query = search.startsWith("?") ? search.slice(1) : search
	if (query === "") return []
	return query
		.split("&")
		.filter((segment) => segment !== "")
		.map((segment) => {
			const eq = segment.indexOf("=")
			return eq === -1
				? { key: segment, value: "", hasValue: false }
				: {
						key: segment.slice(0, eq),
						value: segment.slice(eq + 1),
						hasValue: true,
					}
		})
}

export function serializeParams(params: readonly Param[]): string {
	return params
		.filter((param) => param.key !== "" || param.value !== "")
		.map((param) =>
			param.hasValue || param.value !== ""
				? `${param.key}=${param.value}`
				: param.key,
		)
		.join("&")
}

export function moveParam(params: readonly Param[], from: number, to: number): Param[] {
	const next = [...params]
	const [moved] = next.splice(from, 1)
	if (moved) next.splice(to, 0, moved)
	return next
}

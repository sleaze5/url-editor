export interface Param {
	key: string
	value: string
	hasEqualsSign: boolean
}

export const BLANK_PARAM: Readonly<Param> = { key: "", value: "", hasEqualsSign: true }

export function parseParams(queryString: string): Param[] {
	const query = queryString.startsWith("?") ? queryString.slice(1) : queryString
	if (query === "") return []
	return query
		.split("&")
		.filter((segment) => segment !== "")
		.map((segment) => {
			const equalsIndex = segment.indexOf("=")
			return equalsIndex === -1
				? { key: segment, value: "", hasEqualsSign: false }
				: {
						key: segment.slice(0, equalsIndex),
						value: segment.slice(equalsIndex + 1),
						hasEqualsSign: true,
					}
		})
}

export function serializeParams(params: readonly Param[]): string {
	return params
		.filter((param) => param.key !== "" || param.value !== "")
		.map((param) =>
			param.hasEqualsSign || param.value !== ""
				? `${param.key}=${param.value}`
				: param.key,
		)
		.join("&")
}

export function moveParam(
	params: readonly Param[],
	fromIndex: number,
	toIndex: number,
): Param[] {
	const reorderedParams = [...params]
	const [movedParam] = reorderedParams.splice(fromIndex, 1)
	if (movedParam) reorderedParams.splice(toIndex, 0, movedParam)
	return reorderedParams
}

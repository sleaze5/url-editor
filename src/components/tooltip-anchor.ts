const DELAY_MS = 400
const WARM_MS = 300

let warmUntil = 0

export function tooltipAnchor(el: HTMLElement): void {
	let enteredAt = 0
	el.addEventListener("pointerenter", () => {
		enteredAt = performance.now()
		document.documentElement.classList.toggle("tips-instant", enteredAt < warmUntil)
	})
	el.addEventListener("pointerleave", () => {
		const now = performance.now()
		if (now - enteredAt >= DELAY_MS || now < warmUntil) warmUntil = now + WARM_MS
	})
}

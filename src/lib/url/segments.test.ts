import { describe, expect, test } from "bun:test"

import { type HrefSegment, splitHrefIntoSegments } from "./segments.ts"

const describeSegments = (segments: readonly HrefSegment[]): string[] =>
	segments.map((segment) => `${segment.kind}:${segment.text}`)

const FULL_URL_SEGMENTS = [
	"scheme:https",
	"punctuation::",
	"punctuation://",
	"credentials:user",
	"punctuation::",
	"credentials:pw",
	"punctuation:@",
	"host:example.com",
	"punctuation::",
	"port:8443",
	"punctuation:/",
	"path:a",
	"punctuation:/",
	"path:b",
	"punctuation:?",
	"query-name:q",
	"punctuation:=",
	"query-value:1",
	"punctuation:&",
	"query-name:flag",
	"punctuation:#",
	"hash:top",
]

describe("splitHrefIntoSegments", () => {
	test("splits every part of a full URL", () => {
		expect(
			describeSegments(
				splitHrefIntoSegments(
					"https://user:pw@example.com:8443/a/b?q=1&flag#top",
				),
			),
		).toEqual(FULL_URL_SEGMENTS)
	})

	test("splits a URL without an authority", () => {
		expect(
			describeSegments(splitHrefIntoSegments("mailto:someone@example.com")),
		).toEqual(["scheme:mailto", "punctuation::", "path:someone@example.com"])
	})

	test("joins back into the exact text for file and browser URLs", () => {
		for (const href of [
			"file:///C:/Users/a.txt",
			"chrome://newtab/",
			"about:blank",
		]) {
			const joinedText = splitHrefIntoSegments(href)
				.map((segment) => segment.text)
				.join("")
			expect(joinedText).toBe(href)
		}
	})

	test("keeps text the parser would rewrite as one unparsed segment", () => {
		expect(describeSegments(splitHrefIntoSegments("HTTPS://Example.com"))).toEqual([
			"unparsed:HTTPS://Example.com",
		])
	})

	test("keeps text that is not a URL as one unparsed segment", () => {
		expect(describeSegments(splitHrefIntoSegments("not a url"))).toEqual([
			"unparsed:not a url",
		])
		expect(splitHrefIntoSegments("")).toEqual([])
	})
})

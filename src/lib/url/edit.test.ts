import { describe, expect, test } from "bun:test"

import { decodeParam } from "./codec.ts"
import { editHref, editParam, editPart, editQuery, hrefWithParams } from "./edit.ts"
import { moveParam, parseParams, serializeParams } from "./params.ts"
import { isPartAvailable, URL_PARTS } from "./parts.ts"

const { hash, hostname, pathname, port, protocol } = URL_PARTS

describe("full URL", () => {
	test("parses typed text, encoding what the parser would not", () => {
		expect(editHref("https://a.com/", "https://a.com/a b?q=ü")).toBe(
			"https://a.com/a%20b?q=%C3%BC",
		)
	})

	test("rejects text that is not a URL", () => {
		expect(editHref("https://a.com/", "a.com/path")).toBeNull()
	})

	test("keeps the URL as it was when the text is back to how it started", () => {
		const baseHref = "https://a.com/100%?q=a%20b"
		expect(editHref(baseHref, baseHref)).toBe(baseHref)
	})
})

describe("query string", () => {
	test("replaces the query, encoding what the parser would not", () => {
		expect(editQuery("https://a.com/?a=1#top", "b=2 3")).toBe(
			"https://a.com/?b=2%203#top",
		)
		expect(editQuery("https://a.com/?a=1", "")).toBe("https://a.com/")
	})

	test("keeps the URL as it was when the text is back to how it started", () => {
		const baseHref = "https://a.com/?q=100%&r=a%20b"
		expect(editQuery(baseHref, "q=100%&r=a%20b")).toBe(baseHref)
	})
})

describe("URL parts", () => {
	test("shows and accepts Unicode hostnames", () => {
		const baseHref = "https://xn--mnchen-3ya.de/"
		expect(hostname.readDecoded(new URL(baseHref))).toBe("münchen.de")
		expect(hostname.readDecoded(new URL("https://xn--fsqu00a.xn--0zwm56d/"))).toBe(
			"例子.测试",
		)
		expect(editPart(baseHref, hostname, "bücher.de")).toBe(
			"https://xn--bcher-kva.de/",
		)
	})

	test("rejects a hostname the browser would change", () => {
		expect(editPart("https://a.com/", hostname, "a b")).toBeNull()
	})

	test("validates the port", () => {
		expect(editPart("https://a.com/", port, "8080")).toBe("https://a.com:8080/")
		expect(editPart("https://a.com:8080/", port, "")).toBe("https://a.com/")
		expect(editPart("https://a.com/", port, "70000")).toBeNull()
		expect(editPart("https://a.com/", port, "8o")).toBeNull()
	})

	test("validates the protocol", () => {
		expect(editPart("https://a.com/", protocol, "HTTP:")).toBe("http://a.com/")
		expect(editPart("https://a.com/", protocol, "no way")).toBeNull()
	})
})

describe("decoding URL parts for editing", () => {
	test("decodes the path but keeps encoded slashes and invisible characters", () => {
		const url = new URL("https://a.com/a%20b%2Fc%E2%80%8B%0A")
		expect(pathname.readDecoded(url)).toBe("/a b%2Fc%E2%80%8B%0A")
	})

	test("keeps an encoded percent sign that would read as an escape", () => {
		expect(pathname.readDecoded(new URL("https://a.com/%2541%25zz"))).toBe(
			"/%2541%zz",
		)
	})

	test("keeps a decoded private-use U+E000 encoded", () => {
		expect(pathname.readDecoded(new URL("https://a.com/%EE%80%80%25"))).toBe(
			"/%EE%80%80%",
		)
	})

	test("leaves a run of escapes encoded when it is not UTF-8", () => {
		expect(pathname.readDecoded(new URL("https://a.com/%FF%C3%BC/%C3%BC"))).toBe(
			"/%FF%C3%BC/ü",
		)
	})
})

describe("editing URL parts", () => {
	test("keeps the original encoding of an unchanged part", () => {
		const baseHref = "https://a.com/a%41"
		expect(editPart(baseHref, pathname, "/aA")).toBe(baseHref)
		expect(editPart(baseHref, pathname, "/aAb")).toBe("https://a.com/aAb")
	})

	test("keeps a leading encoded # in the hash", () => {
		const baseHref = "https://a.com/#%23x"
		expect(hash.readDecoded(new URL(baseHref))).toBe("%23x")
		expect(editPart(baseHref, hash, "%23xy")).toBe("https://a.com/#%23xy")
	})

	test("knows which parts a URL can have", () => {
		const mail = new URL("mailto:someone@example.com")
		expect(isPartAvailable("hostname", mail)).toBe(false)
		expect(isPartAvailable("pathname", mail)).toBe(true)
		const file = new URL("file:///tmp/a")
		expect(isPartAvailable("hostname", file)).toBe(true)
		expect(isPartAvailable("port", file)).toBe(false)
		expect(isPartAvailable("username", new URL("https://a.com/"))).toBe(true)
	})
})

describe("query parameters", () => {
	test("round-trips keys without values, empty values, and repeated keys", () => {
		const params = parseParams("?a=1&flag&b=&a=2&&")
		expect(params).toEqual([
			{ key: "a", value: "1", hasEqualsSign: true },
			{ key: "flag", value: "", hasEqualsSign: false },
			{ key: "b", value: "", hasEqualsSign: true },
			{ key: "a", value: "2", hasEqualsSign: true },
		])
		expect(serializeParams(params)).toBe("a=1&flag&b=&a=2")
	})

	test("drops blank parameters", () => {
		expect(serializeParams([{ key: "", value: "", hasEqualsSign: true }])).toBe("")
	})

	test("decodes plus signs as spaces", () => {
		expect(decodeParam("a+b%2Bc%20d")).toBe("a b+c d")
	})
})

describe("editing query parameters", () => {
	test("encodes delimiters in keys and values", () => {
		const baseParams = parseParams("k=v")
		expect(
			editParam(baseParams, {
				paramIndex: 0,
				field: "key",
				typedText: "a&b=c+d",
			})[0]?.key,
		).toBe("a%26b%3Dc%2Bd")
		expect(
			editParam(baseParams, {
				paramIndex: 0,
				field: "value",
				typedText: "1&2=3 #ü",
			})[0],
		).toEqual({ key: "k", value: "1%262=3%20%23%C3%BC", hasEqualsSign: true })
	})

	test("keeps the original encoding of an unchanged field", () => {
		const baseParams = parseParams("q=a%41+b")
		expect(
			editParam(baseParams, { paramIndex: 0, field: "value", typedText: "aA b" }),
		).toEqual(baseParams)
	})

	test("gives a key without a value one once it is typed", () => {
		const params = editParam(parseParams("flag"), {
			paramIndex: 0,
			field: "value",
			typedText: "on",
		})
		expect(serializeParams(params)).toBe("flag=on")
	})

	test("adds a parameter past the end", () => {
		const params = editParam([], { paramIndex: 0, field: "key", typedText: "new" })
		expect(serializeParams(params)).toBe("new=")
	})

	test("moves a parameter", () => {
		const params = parseParams("a&b&c")
		expect(serializeParams(moveParam(params, 0, 2))).toBe("b&c&a")
		expect(serializeParams(moveParam(params, 2, 0))).toBe("c&a&b")
	})

	test("writes the parameters into the URL without re-encoding them", () => {
		const params = parseParams("a=%7B%7D&b='")
		expect(hrefWithParams("https://a.com/?x#top", params)).toBe(
			"https://a.com/?a=%7B%7D&b=%27#top",
		)
	})
})

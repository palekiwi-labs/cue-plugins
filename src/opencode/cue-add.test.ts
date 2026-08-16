import { describe, expect, test } from "bun:test"
import { shouldUseRoot } from "./cue-add"

describe("shouldUseRoot", () => {
  test("defaults to true for anchor types: spec, note, doc, plan", () => {
    expect(shouldUseRoot("spec")).toBe(true)
    expect(shouldUseRoot("note")).toBe(true)
    expect(shouldUseRoot("doc")).toBe(true)
    expect(shouldUseRoot("plan")).toBe(true)
  })

  test("defaults to false for point-in-time types: todo, trace, tmp, custom", () => {
    expect(shouldUseRoot("todo")).toBe(false)
    expect(shouldUseRoot("trace")).toBe(false)
    expect(shouldUseRoot("tmp")).toBe(false)
    expect(shouldUseRoot("custom")).toBe(false)
    expect(shouldUseRoot("ref")).toBe(false)
  })

  test("respects explicit root overrides when root boolean is provided", () => {
    expect(shouldUseRoot("spec", false)).toBe(false)
    expect(shouldUseRoot("note", false)).toBe(false)
    expect(shouldUseRoot("todo", true)).toBe(true)
    expect(shouldUseRoot("trace", true)).toBe(true)
  })
})

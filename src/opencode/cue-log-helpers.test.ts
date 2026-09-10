import { describe, expect, test } from "bun:test"
import { homedir } from "node:os"
import { traceReference } from "./cue-log-helpers"

describe("traceReference", () => {
  test("reduces a canonical address to the context-relative tail", () => {
    expect(
      traceReference("palekiwi/palekiwi/cue-platform-direction/trace/handoff.md")
    ).toBe("trace/handoff.md")
  })

  test("keeps an already context-relative reference", () => {
    expect(traceReference("trace/handoff.md")).toBe("trace/handoff.md")
  })

  test("keeps nested trace names", () => {
    expect(traceReference("palekiwi/palekiwi/ctx/trace/reviews/opus.md")).toBe(
      "trace/reviews/opus.md"
    )
  })

  test("passes an absolute path through, which cue accepts directly", () => {
    expect(traceReference("/home/pl/cue/a/b/ctx/trace/handoff.md")).toBe(
      "/home/pl/cue/a/b/ctx/trace/handoff.md"
    )
  })

  test("expands a leading tilde", () => {
    expect(traceReference("~/cue/a/b/ctx/trace/handoff.md")).toBe(
      `${homedir()}/cue/a/b/ctx/trace/handoff.md`
    )
  })

  test("does not match a directory merely ending in trace", () => {
    expect(traceReference("notes/backtrace/x.md")).toBe("notes/backtrace/x.md")
  })

  test("passes an unrecognised reference through so cue reports it", () => {
    expect(traceReference("handoff.md")).toBe("handoff.md")
  })

  test("treats absent and blank as absent", () => {
    expect(traceReference(undefined)).toBeUndefined()
    expect(traceReference("   ")).toBeUndefined()
  })
})

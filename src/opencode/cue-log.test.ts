import { describe, expect, test } from "bun:test"
import { tool, type PluginInput } from "@opencode-ai/plugin"
import { CueLogPlugin } from "./cue-log"
import { logPayload } from "./log-helpers"

/**
 * The plugin only touches `input.client` inside the tool's execute path,
 * so an empty stub is enough to reach the registered tool definition.
 */
async function logToolArgs() {
  const hooks = await CueLogPlugin({} as unknown as PluginInput)
  const definition = hooks.tool?.["cue-log"]
  if (!definition) {
    throw new Error("cue-log tool is not registered")
  }
  return definition.args
}

describe("cue-log tool schema", () => {
  test("no longer accepts a free-form body", async () => {
    const args = await logToolArgs()
    expect(Object.keys(args)).not.toContain("body")
  })

  test("accepts an optional trace reference", async () => {
    const args = await logToolArgs()
    expect(Object.keys(args)).toContain("trace")

    const schema = tool.schema.object(args)
    const withTrace = schema.parse({
      title: "Milestone",
      trace: ".cue/task/trace/1788149597-22be1e0/notes.md",
      task: "master",
    })
    expect(withTrace.trace).toBe(".cue/task/trace/1788149597-22be1e0/notes.md")

    const withoutTrace = schema.parse({ title: "Milestone", task: "master" })
    expect(withoutTrace.trace).toBeUndefined()
  })

  test("rejects a non-string trace", async () => {
    const schema = tool.schema.object(await logToolArgs())
    expect(() =>
      schema.parse({ title: "Milestone", task: "master", trace: 42 })
    ).toThrow()
  })
})

describe("logPayload", () => {
  test("emits no body key for the cue CLI LogEntry schema", () => {
    const payload = logPayload({ title: "Milestone" })
    expect(Object.keys(payload)).not.toContain("body")
    expect(JSON.parse(JSON.stringify(payload))).toEqual({ title: "Milestone" })
  })

  test("forwards the trace reference verbatim", () => {
    // Resolution and existence checks belong to the CLI, which knows the
    // store layout; the tool must not normalize the reference.
    const trace = "  .cue/task/trace/1788149597-22be1e0/notes.md  "
    expect(logPayload({ title: "Milestone", trace }).trace).toBe(trace)
    expect(
      logPayload({ title: "Milestone", trace: "/abs/trace.md" }).trace
    ).toBe("/abs/trace.md")
  })

  test("omits trace when none was supplied", () => {
    const payload = logPayload({ title: "Milestone", found: ["a"] })
    expect(payload.trace).toBeUndefined()
    expect(JSON.parse(JSON.stringify(payload))).toEqual({
      title: "Milestone",
      found: ["a"],
    })
  })

  test("passes the bullet lists through unchanged", () => {
    const payload = logPayload({
      title: "Milestone",
      trace: "trace.md",
      found: ["found one"],
      decided: ["decided one"],
      open: ["open one"],
    })
    expect(payload).toEqual({
      title: "Milestone",
      trace: "trace.md",
      found: ["found one"],
      decided: ["decided one"],
      open: ["open one"],
    })
  })
})

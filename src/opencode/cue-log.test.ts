import { describe, expect, test } from "bun:test"
import { tool, type PluginInput } from "@opencode-ai/plugin"
import { CueLogPlugin } from "./cue-log"

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

  test("scopes by context, not by task", async () => {
    const keys = Object.keys(await logToolArgs())
    expect(keys).toContain("context")
    expect(keys).not.toContain("task")

    const schema = tool.schema.object(await logToolArgs())
    expect(() => schema.parse({ title: "Milestone" })).toThrow()
  })

  test("accepts an optional trace reference", async () => {
    const args = await logToolArgs()
    expect(Object.keys(args)).toContain("trace")

    const address = "palekiwi/palekiwi/cue-platform-direction/trace/handoff.md"
    const schema = tool.schema.object(args)
    const withTrace = schema.parse({
      title: "Milestone",
      trace: address,
      context: "cue-platform-direction",
    })
    expect(withTrace.trace).toBe(address)

    const withoutTrace = schema.parse({
      title: "Milestone",
      context: "cue-platform-direction",
    })
    expect(withoutTrace.trace).toBeUndefined()
  })

  test("rejects a non-string trace", async () => {
    const schema = tool.schema.object(await logToolArgs())
    expect(() =>
      schema.parse({
        title: "Milestone",
        context: "cue-platform-direction",
        trace: 42,
      })
    ).toThrow()
  })
})

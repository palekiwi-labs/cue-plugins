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

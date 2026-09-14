import { describe, expect, test } from "bun:test"
import { tool, type PluginInput } from "@opencode-ai/plugin"
import { CueAddPlugin } from "./cue-add"

async function addToolArgs() {
  const hooks = await CueAddPlugin({} as unknown as PluginInput)
  const definition = hooks.tool?.["cue-add"]
  if (!definition) {
    throw new Error("cue-add tool is not registered")
  }
  return definition.args
}

describe("cue-add tool schema", () => {
  test("scopes by context, not by task", async () => {
    const keys = Object.keys(await addToolArgs())
    expect(keys).toContain("context")
    expect(keys).not.toContain("task")
  })

  test("no longer exposes the deleted root flag", async () => {
    expect(Object.keys(await addToolArgs())).not.toContain("root")
  })

  test("context is required, since cue has no fallback context", async () => {
    const schema = tool.schema.object(await addToolArgs())
    expect(() => schema.parse({ filename: "index.md", content: "x" })).toThrow()
  })

  test("accepts the seven live artifact types", async () => {
    const schema = tool.schema.object(await addToolArgs())
    for (const type of ["spec", "plan", "note", "task", "trace", "tmp", "bin"]) {
      const parsed = schema.parse({
        type,
        filename: "a.md",
        content: "x",
        context: "demo",
      })
      expect(parsed.type).toBe(type)
    }
  })

  test("rejects the abolished doc and todo types", async () => {
    const schema = tool.schema.object(await addToolArgs())
    for (const type of ["doc", "todo"]) {
      expect(() =>
        schema.parse({ type, filename: "a.md", content: "x", context: "demo" })
      ).toThrow()
    }
  })

  test("no longer exposes the removed group flag", async () => {
    expect(Object.keys(await addToolArgs())).not.toContain("group")
  })
})

import { describe, expect, test } from "bun:test"
import { tool, type PluginInput } from "@opencode-ai/plugin"
import { taskFrontmatter } from "./cue-task-helpers"
import { CueTaskPlugin } from "./cue-task"

async function taskToolArgs() {
  const hooks = await CueTaskPlugin({} as unknown as PluginInput)
  const definition = hooks.tool?.["cue-task"]
  if (!definition) {
    throw new Error("cue-task tool is not registered")
  }
  return definition.args
}

describe("taskFrontmatter", () => {
  test("defaults status to inbox for operator triage", () => {
    const fm = taskFrontmatter({ title: "Do a thing", refs: [] })
    expect(fm.status).toBe("inbox")
    expect(fm.title).toBe("Do a thing")
    expect(fm.priority).toBe("normal")
  })

  test("omits kind, which now belongs to the context", () => {
    const fm = taskFrontmatter({ title: "Do a thing", refs: [] })
    expect(fm).not.toHaveProperty("kind")
  })
})

describe("cue-task tool schema", () => {
  test("requires a context instead of hardcoding the master board", async () => {
    const keys = Object.keys(await taskToolArgs())
    expect(keys).toContain("context")
    expect(keys).not.toContain("task")

    const schema = tool.schema.object(await taskToolArgs())
    expect(() =>
      schema.parse({ filename: "a.md", content: "x", title: "A" })
    ).toThrow()
  })

  test("no longer accepts a kind", async () => {
    expect(Object.keys(await taskToolArgs())).not.toContain("kind")
  })
})

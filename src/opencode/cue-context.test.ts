import { describe, expect, test } from "bun:test"
import { tool, type PluginInput } from "@opencode-ai/plugin"
import { contextCreateFlags } from "./cue-context-helpers"
import { CueContextPlugin } from "./cue-context"

async function contextToolArgs() {
  const hooks = await CueContextPlugin({} as unknown as PluginInput)
  const definition = hooks.tool?.["cue-context"]
  if (!definition) {
    throw new Error("cue-context tool is not registered")
  }
  return definition.args
}

describe("contextCreateFlags", () => {
  test("emits nothing for absent optional fields", () => {
    expect(contextCreateFlags({ refs: [] })).toEqual([])
  })

  test("tolerates refs omitted entirely: the harness does not apply schema defaults", () => {
    // opencode passes execute args without applying `.default([])` from the
    // tool schema, so args.refs is undefined when the agent omits it. The
    // helper must not dereference it unguarded.
    expect(contextCreateFlags({})).toEqual([])
  })

  test("emits kind, mode and prose fields as separate argv entries", () => {
    const flags = contextCreateFlags({
      title: "Auth redesign: 'the sequel'",
      kind: "work",
      mode: "design",
      description: "Rework login",
      refs: [],
    })
    expect(flags).toEqual([
      "--title",
      "Auth redesign: 'the sequel'",
      "--kind",
      "work",
      "--mode",
      "design",
      "--description",
      "Rework login",
    ])
  })

  test("repeats --ref once per reference", () => {
    expect(
      contextCreateFlags({ refs: ["palekiwi/palekiwi/a/spec/index.md", "palekiwi/palekiwi/b"] })
    ).toEqual([
      "--ref",
      "palekiwi/palekiwi/a/spec/index.md",
      "--ref",
      "palekiwi/palekiwi/b",
    ])
  })

  test("emits parent as a scalar canonical address", () => {
    expect(contextCreateFlags({ parent: "palekiwi/palekiwi/umbrella", refs: [] })).toEqual([
      "--parent",
      "palekiwi/palekiwi/umbrella",
    ])
  })

  test("ignores blank strings rather than emitting empty flag values", () => {
    expect(contextCreateFlags({ title: "   ", description: "", refs: ["  "] })).toEqual([])
  })
})

describe("cue-context tool schema", () => {
  test("requires a slug and rejects path separators in it", async () => {
    const schema = tool.schema.object(await contextToolArgs())
    expect(() => schema.parse({})).toThrow()
    expect(() => schema.parse({ name: "auth/redesign" })).toThrow()
    expect(schema.parse({ name: "auth-redesign" }).name).toBe("auth-redesign")
  })

  test("carries kind and mode, the fields that moved off the task", async () => {
    const keys = Object.keys(await contextToolArgs())
    expect(keys).toContain("kind")
    expect(keys).toContain("mode")
  })

  test("does not expose branch association, which is operator state", async () => {
    const keys = Object.keys(await contextToolArgs())
    expect(keys).not.toContain("branch")
    expect(keys).not.toContain("switch")
  })
})

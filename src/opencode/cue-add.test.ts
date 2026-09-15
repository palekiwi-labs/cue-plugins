import { afterAll, describe, expect, test } from "bun:test"
import { rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { tool, type PluginInput } from "@opencode-ai/plugin"
import { CueAddPlugin } from "./cue-add"
import { runCue } from "./cue-exec"

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

  test("accepts the seven generic artifact types", async () => {
    const schema = tool.schema.object(await addToolArgs())
    for (const type of ["spec", "plan", "note", "task", "trace", "bin", "tmp"]) {
      const parsed = schema.parse({
        type,
        filename: "a.md",
        content: "x",
        context: "demo",
      })
      expect(parsed.type).toBe(type)
    }
  })

  test("rejects review, which belongs to the cue-review tool", async () => {
    const schema = tool.schema.object(await addToolArgs())
    expect(() =>
      schema.parse({ type: "review", filename: "a.json", content: "{}", context: "demo" })
    ).toThrow()
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

// Live contract test: exercise the real cue binary against a throwaway
// store, per the pattern in cue-exec.test.ts. cue's refusal text for bin
// metadata is the contract this plugin's schema descriptions teach; the
// review write-path contract (no YAML prefix, in-band metadata merge) is
// covered by cue-review.test.ts, which owns that door.
describe("cue-add bin contract (live binary)", () => {
  const store = join(tmpdir(), `cue-add-bin-store-${Date.now()}`)
  const repoDir = process.cwd()
  const context = "probe-bin-contract"

  afterAll(() => {
    rmSync(store, { recursive: true, force: true })
  })

  test("bin refuses metadata rather than corrupting an executable", async () => {
    await runCue(["context", "create", "--store", store, context], repoDir)
    expect(
      runCue(
        [
          "add",
          "--store",
          store,
          "--context",
          context,
          "--type",
          "bin",
          "--frontmatter",
          "x=1",
          "tool.sh",
          "#!/usr/bin/env bash",
        ],
        repoDir,
      ),
    ).rejects.toThrow("bin artifacts do not support metadata")
  })
})

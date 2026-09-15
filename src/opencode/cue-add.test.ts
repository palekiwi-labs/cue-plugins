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

  test("accepts the eight live artifact types", async () => {
    const schema = tool.schema.object(await addToolArgs())
    for (const type of ["spec", "plan", "note", "task", "trace", "review", "bin", "tmp"]) {
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

// Live contract tests: exercise the real cue binary against a throwaway
// store, per the pattern in cue-exec.test.ts. The contract under test is
// cue's write-path behaviour for JSON-native types — no YAML prefix, no
// auto-stamps, metadata merged in-band — which is cue's to write and this
// plugin's schema descriptions to teach. These guard the f0901bf class
// (JSON payloads corrupted by frontmatter prepending) from returning.
describe("cue-add review contract (live binary)", () => {
  const store = join(tmpdir(), `cue-add-review-store-${Date.now()}`)
  const repoDir = process.cwd()
  const context = "probe-review-contract"

  afterAll(() => {
    rmSync(store, { recursive: true, force: true })
  })

  test("writes review JSON under review/ with metadata as top-level keys", async () => {
    await runCue(["context", "create", "--store", store, context], repoDir)
    await runCue(
      [
        "add",
        "--store",
        store,
        "--context",
        context,
        "--type",
        "review",
        "--frontmatter",
        "run=1",
        "findings",
        '{"verdict":"pass"}',
      ],
      repoDir,
    )

    const path = join(store, "palekiwi-labs/cue-plugins", context, "review", "findings.json")
    const raw = await Bun.file(path).text()
    // A YAML prefix would make this parse fail; in-band merge means both
    // keys sit in the one object.
    const parsed = JSON.parse(raw)
    expect(parsed).toEqual({ run: 1, verdict: "pass" })
  })

  test("bin refuses metadata rather than corrupting an executable", async () => {
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

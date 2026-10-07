import { afterAll, describe, expect, test } from "bun:test"
import { rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { tool, type PluginInput, type ToolContext } from "@opencode-ai/plugin"
import { CueReviewPlugin } from "./cue-review"
import { runCue } from "./cue-exec"

async function reviewTool() {
  const hooks = await CueReviewPlugin({} as unknown as PluginInput)
  const definition = hooks.tool?.["cue-review"]
  if (!definition) {
    throw new Error("cue-review tool is not registered")
  }
  return definition
}

// The tool's execute receives the opencode tool context; only .directory is read.
const fakeContext = { directory: process.cwd() } as unknown as ToolContext

describe("cue-review tool schema", () => {
  test("carries no type argument: the type is the tool", async () => {
    const keys = Object.keys((await reviewTool()).args)
    expect(keys).not.toContain("type")
  })

  test("context is required, since cue has no fallback context", async () => {
    const schema = tool.schema.object((await reviewTool()).args)
    expect(() =>
      schema.parse({ filename: "findings.json", content: "{}" }),
    ).toThrow()
  })

  test("metadata is optional: omitted args must not fail the call", async () => {
    const schema = tool.schema.object((await reviewTool()).args)
    const parsed = schema.parse({
      filename: "findings.json",
      content: "{}",
      context: "demo",
    })
    expect(parsed.metadata).toBeUndefined()
  })
})

describe("cue-review payload control", () => {
  test("rejects non-JSON content before cue runs", async () => {
    const definition = await reviewTool()
    expect(
      definition.execute(
        { filename: "a.json", content: "{not json", context: "demo" },
        fakeContext,
      ),
    ).rejects.toThrow("must be valid JSON")
  })

  test("rejects a JSON array or scalar, not only non-JSON", async () => {
    const definition = await reviewTool()
    expect(
      definition.execute(
        { filename: "a.json", content: "[1,2]", context: "demo" },
        fakeContext,
      ),
    ).rejects.toThrow("must be a JSON object")
    expect(
      definition.execute(
        { filename: "a.json", content: "42", context: "demo" },
        fakeContext,
      ),
    ).rejects.toThrow("must be a JSON object")
  })
})

// Live contract test through the tool's own execute path (real cue binary,
// throwaway store, per the pattern in cue-exec.test.ts): a review artifact
// lands under review/ with no YAML prefix and metadata merged as top-level
// keys. Guards the f0901bf class (JSON payloads corrupted by frontmatter
// prepending) from returning through this door.
describe("cue-review write contract (live binary)", () => {
  const store = join(tmpdir(), `cue-review-store-${Date.now()}`)
  const context = "probe-review-tool"

  afterAll(() => {
    rmSync(store, { recursive: true, force: true })
  })

  test("writes review JSON under review/ with metadata as top-level keys", async () => {
    await runCue(["context", "create", "--store", store, context], process.cwd())
    const definition = await reviewTool()
    await definition.execute(
      {
        filename: "findings",
        content: '{"verdict":"pass"}',
        context,
        store,
        metadata: { run: "1" },
      },
      fakeContext,
    )

    const path = join(store, "palekiwi-labs/cue-plugins", context, "review", "findings.json")
    const raw = await Bun.file(path).text()
    const parsed = JSON.parse(raw)
    expect(parsed).toEqual({ run: 1, verdict: "pass" })
  })
})

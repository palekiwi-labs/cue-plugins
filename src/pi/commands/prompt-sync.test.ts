import { describe, expect, test } from "bun:test"
import { join } from "node:path"
import { readFileSync } from "node:fs"
import { IDEA_INSTRUCTIONS } from "./idea"

const repoRoot = join(import.meta.dir, "..", "..", "..")

/**
 * Extract the static instruction tail of an opencode command markdown file:
 * everything from the first "Load the" line to EOF. This is the text that
 * must stay word-for-word identical to the embedded pi command prompts.
 */
function staticTail(mdPath: string): string {
  const text = readFileSync(join(repoRoot, mdPath), "utf8")
  const lines = text.split("\n")
  const idx = lines.findIndex((l) => l.startsWith("Load the `"))
  if (idx < 0) throw new Error(`no static tail found in ${mdPath}`)
  return lines.slice(idx).join("\n").trim()
}

describe("pi command prompts stay in sync with opencode markdown", () => {
  test("cue:idea matches commands/opencode/cue/idea.md", () => {
    expect(IDEA_INSTRUCTIONS).toBe(staticTail("commands/opencode/cue/idea.md"))
  })
})

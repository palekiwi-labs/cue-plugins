import { describe, expect, test } from "bun:test"
import { join } from "node:path"
import { readFileSync } from "node:fs"
import {
  INIT_BUILD_INSTRUCTIONS,
  INIT_DESIGN_INSTRUCTIONS,
  INIT_INSTRUCTIONS,
  INIT_LEARN_INSTRUCTIONS,
  INIT_RESEARCH_INSTRUCTIONS,
  INIT_REVIEW_INSTRUCTIONS,
} from "./init"
import { CONTEXT_INSTRUCTIONS } from "./context"
import { IDEA_INSTRUCTIONS } from "./idea"
import { RESUME_INSTRUCTIONS } from "./resume"

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
  test("cue:init matches commands/opencode/cue/init.md", () => {
    expect(INIT_INSTRUCTIONS).toBe(staticTail("commands/opencode/cue/init.md"))
  })

  test("cue:init:build matches commands/opencode/cue/init/build.md", () => {
    expect(INIT_BUILD_INSTRUCTIONS).toBe(staticTail("commands/opencode/cue/init/build.md"))
  })

  test("cue:init:design matches commands/opencode/cue/init/design.md", () => {
    expect(INIT_DESIGN_INSTRUCTIONS).toBe(staticTail("commands/opencode/cue/init/design.md"))
  })

  test("cue:init:learn matches commands/opencode/cue/init/learn.md", () => {
    expect(INIT_LEARN_INSTRUCTIONS).toBe(staticTail("commands/opencode/cue/init/learn.md"))
  })

  test("cue:init:research matches commands/opencode/cue/init/research.md", () => {
    expect(INIT_RESEARCH_INSTRUCTIONS).toBe(
      staticTail("commands/opencode/cue/init/research.md"),
    )
  })

  test("cue:init:review matches commands/opencode/cue/init/review.md", () => {
    expect(INIT_REVIEW_INSTRUCTIONS).toBe(staticTail("commands/opencode/cue/init/review.md"))
  })

  test("cue:resume matches commands/opencode/cue/resume.md", () => {
    expect(RESUME_INSTRUCTIONS).toBe(staticTail("commands/opencode/cue/resume.md"))
  })

  test("cue:context matches commands/opencode/cue/context.md", () => {
    expect(CONTEXT_INSTRUCTIONS).toBe(staticTail("commands/opencode/cue/context.md"))
  })

  test("cue:idea matches commands/opencode/cue/idea.md", () => {
    expect(IDEA_INSTRUCTIONS).toBe(staticTail("commands/opencode/cue/idea.md"))
  })
})

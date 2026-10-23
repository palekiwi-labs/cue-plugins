import { afterAll, describe, expect, test } from "bun:test"
import { rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { cueFailureMessage, runCue } from "./cue-exec"

describe("cueFailureMessage", () => {
  test("carries cue's stderr verbatim in the thrown message", () => {
    const message = cueFailureMessage(
      ["log", "add", "--context", "demo"],
      "/repo",
      1,
      "Error: Context does not exist: demo\n",
      "",
    )
    expect(message).toContain("Context does not exist: demo")
  })

  test("names the cue subcommand", () => {
    const message = cueFailureMessage(["log", "add"], "/repo", 1, "boom", "")
    expect(message).toContain("cue log add")
  })

  test("names the directory cue ran in, since scope derives from it", () => {
    const message = cueFailureMessage(["add"], "/repo", 1, "boom", "")
    expect(message).toContain("/repo")
  })

  test("prefers stderr over stdout", () => {
    const message = cueFailureMessage(["add"], "/repo", 1, "from stderr", "from stdout")
    expect(message).toContain("from stderr")
    expect(message).not.toContain("from stdout")
  })

  test("falls back to stdout when stderr is empty", () => {
    expect(cueFailureMessage(["add"], "/repo", 1, "", "on stdout\n")).toContain("on stdout")
  })

  test("falls back to the exit code when cue printed nothing", () => {
    expect(cueFailureMessage(["add"], "/repo", 2, "", "")).toContain("exit code 2")
  })
})

describe("runCue", () => {
  // Exercises the real cue binary against a throwaway store: the
  // contract under test is that cue's own diagnostic text survives
  // into the thrown message, and that text is cue's to write. The
  // plugin devshell always has cue on PATH.
  const store = join(tmpdir(), `cue-exec-store-${Date.now()}`)
  const repoDir = process.cwd()

  afterAll(() => {
    rmSync(store, { recursive: true, force: true })
  })

  test("returns trimmed stdout on success", async () => {
    const out = await runCue(["context", "create", "--store", store, "probe-exec"], repoDir)
    expect(out).toBe(`Created palekiwi-labs/cue-plugins/probe-exec`)
  })

  test("throws with cue's own stderr in the message on non-zero exit", async () => {
    expect(
      runCue(
        ["log", "add", "--store", store, "--context", "does-not-exist", "--title", "t"],
        repoDir,
      ),
    ).rejects.toThrow(/Context does not exist: (palekiwi-labs\/cue-plugins\/)?does-not-exist/)
  })

  test("the thrown message names the subcommand and run directory", async () => {
    try {
      await runCue(
        ["log", "add", "--store", store, "--context", "does-not-exist", "--title", "t"],
        repoDir,
      )
      throw new Error("expected runCue to reject")
    } catch (error) {
      expect((error as Error).message).toContain("cue log add")
      expect((error as Error).message).toContain(repoDir)
    }
  })
})

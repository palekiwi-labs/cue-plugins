import { describe, expect, test } from "bun:test"
import {
  diffFilename,
  resolveBase,
  sanitizeBranchName,
} from "./branch-diff-helpers"

describe("sanitizeBranchName", () => {
  test("flattens slash-separated branch names", () => {
    expect(sanitizeBranchName("feat/cue-skill-revisions")).toBe(
      "feat-cue-skill-revisions",
    )
    expect(sanitizeBranchName("fix/add-filename-normalization")).toBe(
      "fix-add-filename-normalization",
    )
  })

  test("keeps git-legal characters untouched", () => {
    expect(sanitizeBranchName("worktrees/v1.18.25")).toBe(
      "worktrees-v1.18.25",
    )
    expect(sanitizeBranchName("release-1.x")).toBe("release-1.x")
  })

  test("collapses runs of path-unsafe characters into one dash", () => {
    expect(sanitizeBranchName("a//b")).toBe("a-b")
    expect(sanitizeBranchName("a ~ b")).toBe("a-b")
  })

  test("strips leading and trailing separators", () => {
    expect(sanitizeBranchName("-leading")).toBe("leading")
    expect(sanitizeBranchName(".hidden")).toBe("hidden")
    expect(sanitizeBranchName("trailing-")).toBe("trailing")
  })

  test("trims whitespace and returns empty for empty input", () => {
    expect(sanitizeBranchName("  master  ")).toBe("master")
    expect(sanitizeBranchName("")).toBe("")
  })
})

describe("diffFilename", () => {
  test("derives branch-based filename with .diff suffix", () => {
    expect(diffFilename("feat/cue-skill-revisions")).toBe(
      "feat-cue-skill-revisions.diff",
    )
  })

  test("falls back to branch.diff when branch is unknown", () => {
    expect(diffFilename("")).toBe("branch.diff")
  })
})

describe("resolveBase", () => {
  test("git config branch.<name>.base wins first", () => {
    expect(resolveBase("main", "origin/master")).toBe("main")
  })

  test("origin/HEAD symbolic ref is stripped of its prefix", () => {
    expect(resolveBase("", "origin/trunk")).toBe("trunk")
  })

  test("falls back to master when nothing is known", () => {
    expect(resolveBase("", "")).toBe("master")
    expect(resolveBase(undefined, undefined)).toBe("master")
  })

  test("blank values are treated as absent", () => {
    expect(resolveBase("  ", "  ")).toBe("master")
  })
})

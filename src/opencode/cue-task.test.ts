import { describe, expect, test } from "bun:test"
import { taskFrontmatter } from "./cue-task"

describe("taskFrontmatter", () => {
  test("defaults status to inbox for operator triage", () => {
    const fm = taskFrontmatter({ title: "Do a thing", refs: [] })
    expect(fm.status).toBe("inbox")
    expect(fm.title).toBe("Do a thing")
    expect(fm.priority).toBe("normal")
  })
})

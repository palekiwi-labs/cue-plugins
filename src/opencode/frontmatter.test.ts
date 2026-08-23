import { describe, expect, test } from "bun:test"
import { frontmatterFlags } from "./frontmatter"

describe("frontmatterFlags", () => {
  test("formats scalar string values", () => {
    const result = frontmatterFlags({ title: "My Task", status: "open" })
    expect(result).toEqual([
      "--frontmatter",
      "title=My Task",
      "--frontmatter",
      "status=open",
    ])
  })

  test("formats array values", () => {
    const result = frontmatterFlags({ refs: ["doc/a.md", "doc/b.md"] })
    expect(result).toEqual([
      "--frontmatter",
      "refs=doc/a.md",
      "--frontmatter",
      "refs=doc/b.md",
    ])
  })

  test("ignores undefined or null values", () => {
    const result = frontmatterFlags({
      title: "Task",
      refs: undefined,
      parent: null,
    })
    expect(result).toEqual(["--frontmatter", "title=Task"])
  })

  test("handles empty arrays without emitting flags", () => {
    const result = frontmatterFlags({ refs: [] })
    expect(result).toEqual([])
  })
})

import { describe, expect, test } from "bun:test"
import { homedir } from "node:os"
import { resolve } from "node:path"
import { resolveDir } from "./dir"

describe("resolveDir", () => {
  test("returns empty array when dir is undefined", () => {
    expect(resolveDir()).toEqual([])
    expect(resolveDir(undefined)).toEqual([])
  })

  test("expands tilde paths to homedir", () => {
    const expected = resolve(homedir(), "code/project")
    expect(resolveDir("~/code/project")).toEqual(["--dir", expected])
  })

  test("returns absolute path as-is", () => {
    expect(resolveDir("/tmp/my-repo")).toEqual(["--dir", "/tmp/my-repo"])
  })

  test("resolves existing relative path in cwd", () => {
    const cwd = "/tmp"
    // /tmp exists
    expect(resolveDir(".", cwd)).toEqual(["--dir", "/tmp"])
  })

  test("resolves sibling directory if relative path does not exist in cwd", () => {
    // /home/pl/code/spabreaks/spabreaks-org -> sibling spabreaks exists
    const cwd = "/home/pl/code/spabreaks/spabreaks-org"
    expect(resolveDir("spabreaks", cwd)).toEqual([
      "--dir",
      "/home/pl/code/spabreaks/spabreaks",
    ])
  })

  test("falls back to candidate in cwd if path does not exist anywhere", () => {
    const cwd = "/tmp"
    expect(resolveDir("nonexistent-dir-12345", cwd)).toEqual([
      "--dir",
      "/tmp/nonexistent-dir-12345",
    ])
  })
})

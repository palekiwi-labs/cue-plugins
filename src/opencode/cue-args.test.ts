import { describe, expect, test } from "bun:test"
import { homedir } from "node:os"
import { contextFlag, dirFlag, storeFlag } from "./cue-args"

describe("dirFlag", () => {
  test("emits nothing when the directory is absent or blank", () => {
    expect(dirFlag(undefined, "/session")).toEqual([])
    expect(dirFlag("", "/session")).toEqual([])
    expect(dirFlag("   ", "/session")).toEqual([])
  })

  test("passes an absolute path through", () => {
    expect(dirFlag("/home/pl/nix-config", "/session")).toEqual([
      "--dir",
      "/home/pl/nix-config",
    ])
  })

  test("resolves a relative path against the session directory", () => {
    expect(dirFlag("worktrees/feat", "/session")).toEqual([
      "--dir",
      "/session/worktrees/feat",
    ])
  })

  test("expands a leading tilde", () => {
    expect(dirFlag("~/nix-config", "/session")).toEqual([
      "--dir",
      `${homedir()}/nix-config`,
    ])
    expect(dirFlag("~", "/session")).toEqual(["--dir", homedir()])
  })
})

describe("contextFlag", () => {
  test("emits nothing when the context is absent or blank", () => {
    expect(contextFlag(undefined)).toEqual([])
    expect(contextFlag("  ")).toEqual([])
  })

  test("emits the trimmed slug", () => {
    expect(contextFlag(" cue-platform-direction ")).toEqual([
      "--context",
      "cue-platform-direction",
    ])
  })
})

describe("storeFlag", () => {
  test("emits nothing when absent, deferring to $CUE_STORE", () => {
    expect(storeFlag(undefined)).toEqual([])
    expect(storeFlag("")).toEqual([])
  })

  test("emits an explicit root and expands a leading tilde", () => {
    expect(storeFlag("/mnt/archive/cue")).toEqual(["--store", "/mnt/archive/cue"])
    expect(storeFlag("~/cue-archive")).toEqual([
      "--store",
      `${homedir()}/cue-archive`,
    ])
  })
})

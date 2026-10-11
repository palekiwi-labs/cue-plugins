import { describe, expect, test } from "bun:test"
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { CUE_CONTEXT_TYPE } from "./lib/current-context"
import { applyContextName, registerSessionNaming } from "./session-name"

function makePi() {
  const names: string[] = []
  const execs: { cmd: string; args: string[] }[] = []
  const handlers: Record<string, (e: unknown, ctx: unknown) => Promise<void>> =
    {}
  const pi = {
    setSessionName: (n: string) => names.push(n),
    exec: async (cmd: string, args: string[]) => {
      execs.push({ cmd, args })
      return { stdout: "", stderr: "", code: 0, killed: false }
    },
    on: (ev: string, h: (e: unknown, ctx: unknown) => Promise<void>) => {
      handlers[ev] = h
    },
  } as unknown as ExtensionAPI
  return { pi, names, execs, handlers }
}

describe("applyContextName", () => {
  test("outside tmux only names the session", async () => {
    const m = makePi()
    await applyContextName(m.pi, "a/b/slug", {})
    expect(m.names).toEqual(["slug"])
    expect(m.execs).toEqual([])
  })

  test("inside tmux renames this pane's window", async () => {
    const m = makePi()
    await applyContextName(m.pi, "a/b/slug", { TMUX: "x", TMUX_PANE: "%3" })
    expect(m.execs).toEqual([
      { cmd: "tmux", args: ["rename-window", "-t", "%3", "slug"] },
    ])
  })

  test("tmux failure is swallowed", async () => {
    const m = makePi()
    ;(m.pi as any).exec = async () => {
      throw new Error("no tmux")
    }
    await applyContextName(m.pi, "a/b/slug", { TMUX: "x" })
    expect(m.names).toEqual(["slug"])
  })
})

describe("registerSessionNaming", () => {
  const ctx = (branch: unknown[]) => ({
    sessionManager: { getBranch: () => branch },
  })

  test("session_start and session_tree name after the current context", async () => {
    const m = makePi()
    registerSessionNaming(m.pi)
    const inj = {
      type: "custom_message",
      customType: CUE_CONTEXT_TYPE,
      details: { address: "a/b/ctx" },
    }
    await m.handlers.session_start!({}, ctx([inj]))
    await m.handlers.session_tree!({}, ctx([inj]))
    expect(m.names).toEqual(["ctx", "ctx"])
  })

  test("no current context leaves the name untouched", async () => {
    const m = makePi()
    registerSessionNaming(m.pi)
    await m.handlers.session_start!({}, ctx([{ type: "message" }]))
    expect(m.names).toEqual([])
  })
})

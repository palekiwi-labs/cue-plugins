import { describe, expect, test } from "bun:test"
import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent"
import {
  CUE_CONTEXT_TYPE,
  currentContext,
  parsePins,
  slugOf,
} from "../lib/current-context"
import { registerContextPinsCommand } from "./context-pins"

describe("current-context helpers", () => {
  test("parsePins splits lines and drops blanks", () => {
    expect(parsePins("a/b/one\n\n  a/b/two  \n")).toEqual([
      "a/b/one",
      "a/b/two",
    ])
    expect(parsePins("")).toEqual([])
  })

  test("slugOf takes the last address segment", () => {
    expect(slugOf("palekiwi/palekiwi/cue-lsp")).toBe("cue-lsp")
  })

  test("currentContext returns the last injection on the branch", () => {
    const inj = (address: string) => ({
      type: "custom_message",
      customType: CUE_CONTEXT_TYPE,
      details: { address },
    })
    expect(currentContext([])).toBeUndefined()
    expect(
      currentContext([
        inj("a/b/first"),
        { type: "message" },
        inj("a/b/second"),
        { type: "custom_message", customType: "other", details: {} },
        { type: "custom_message", customType: CUE_CONTEXT_TYPE },
      ]),
    ).toBe("a/b/second")
  })
})

function setup(opts: { pins: string; pick?: string; idle?: boolean }) {
  let handler!: (args: string, ctx: ExtensionCommandContext) => Promise<void>
  const sent: { message: any; options: unknown }[] = []
  const notes: string[] = []
  const names: string[] = []
  let selectCalls = 0
  const pi = {
    registerCommand: (_n: string, o: { handler: typeof handler }) => {
      handler = o.handler
    },
    sendMessage: (message: unknown, options?: unknown) => {
      sent.push({ message, options })
    },
    setSessionName: (n: string) => names.push(n),
    exec: async (cmd: string, args: string[]) => {
      if (cmd === "cue" && args[0] === "context" && args[1] === "pins") {
        return { stdout: opts.pins, stderr: "", code: 0, killed: false }
      }
      return { stdout: "", stderr: "", code: 1, killed: false }
    },
  } as unknown as ExtensionAPI
  const ctx = {
    cwd: "/w",
    isIdle: () => opts.idle ?? true,
    ui: {
      notify: (m: string) => notes.push(m),
      select: async () => {
        selectCalls++
        return opts.pick
      },
    },
  } as unknown as ExtensionCommandContext
  registerContextPinsCommand(pi)
  return {
    run: () => handler("", ctx),
    sent,
    notes,
    names,
    selects: () => selectCalls,
  }
}

describe("/cue:context:pins", () => {
  test("injects the picked context without a turn", async () => {
    const s = setup({ pins: "a/b/one\na/b/two\n", pick: "a/b/two" })
    await s.run()
    expect(s.sent).toHaveLength(1)
    const { message, options } = s.sent[0]!
    expect(options).toBeUndefined()
    expect(message.customType).toBe(CUE_CONTEXT_TYPE)
    expect(message.display).toBe(true)
    expect(message.details).toEqual({ address: "a/b/two" })
    expect(message.content).toContain("Active cue context for this session: two")
    expect(s.names).toEqual(["two"])
  })

  test("no pins: notifies, no picker", async () => {
    const s = setup({ pins: "" })
    await s.run()
    expect(s.selects()).toBe(0)
    expect(s.sent).toHaveLength(0)
    expect(s.notes).toHaveLength(1)
  })

  test("cancel is a no-op", async () => {
    const s = setup({ pins: "a/b/one" })
    await s.run()
    expect(s.sent).toHaveLength(0)
  })

  test("refuses while the agent is busy", async () => {
    const s = setup({ pins: "a/b/one", pick: "a/b/one", idle: false })
    await s.run()
    expect(s.selects()).toBe(0)
    expect(s.sent).toHaveLength(0)
  })
})

import { describe, expect, test } from "bun:test"
import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent"
import {
  CUE_CONTEXT_TYPE,
  currentContext,
  parsePinned,
  slugOf,
} from "../lib/current-context"
import { fuzzyNarrow } from "../lib/fuzzy-select"
import { registerContextPinsCommand } from "./context-pins"

describe("current-context helpers", () => {
  test("parsePinned keeps CLI order and drops malformed rows", () => {
    const json = JSON.stringify([
      { context: "hot", scope: "a/b", last_logged_at: 9 },
      { context: 3, scope: "a/b" },
      { context: "cold", scope: "a/b", last_logged_at: null },
    ])
    expect(parsePinned(json)).toEqual([
      { slug: "hot", address: "a/b/hot" },
      { slug: "cold", address: "a/b/cold" },
    ])
    expect(parsePinned("")).toEqual([])
    expect(parsePinned("not json")).toEqual([])
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

const LIST_PINNED = "context list --json --pinned --sort recency"

const pinsJson = (...slugs: string[]) =>
  JSON.stringify(slugs.map((context) => ({ context, scope: "a/b" })))

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
      if (cmd === "cue" && args.join(" ") === LIST_PINNED) {
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
      custom: async () => {
        selectCalls++
        return opts.pick ?? null
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
    const s = setup({ pins: pinsJson("one", "two"), pick: "two" })
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
    const s = setup({ pins: "[]" })
    await s.run()
    expect(s.selects()).toBe(0)
    expect(s.sent).toHaveLength(0)
    expect(s.notes).toHaveLength(1)
  })

  test("cancel is a no-op", async () => {
    const s = setup({ pins: pinsJson("one") })
    await s.run()
    expect(s.sent).toHaveLength(0)
  })

  test("refuses while the agent is busy", async () => {
    const s = setup({ pins: pinsJson("one"), pick: "one", idle: false })
    await s.run()
    expect(s.selects()).toBe(0)
    expect(s.sent).toHaveLength(0)
  })
})

describe("fuzzyNarrow", () => {
  const items = ["pi-session-naming", "pi-tmux-session-state", "cue-lsp"]
  test("empty query keeps the recency order", () => {
    expect(fuzzyNarrow(items, "")).toEqual(items)
  })
  test("fuzzy query narrows", () => {
    expect(fuzzyNarrow(items, "tmx")).toEqual(["pi-tmux-session-state"])
    expect(fuzzyNarrow(items, "clsp")).toEqual(["cue-lsp"])
  })
})

import { describe, expect, test } from "bun:test"
import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent"
import cuePlugins from "../index"
import { contextChildren } from "../lib/context-children"

interface ExecCall {
  command: string
  args: string[]
  cwd?: string
}

interface ExecResult {
  stdout: string
  stderr: string
  code: number
}

type ExecHandler = (call: ExecCall) => ExecResult

const ok = (stdout = "ok"): ExecResult => ({ stdout, stderr: "", code: 0 })
const fail = (stderr = "Error: boom"): ExecResult => ({
  stdout: "",
  stderr,
  code: 1,
})

interface CommandRegistration {
  description?: string
  handler: (args: string, ctx: ExtensionCommandContext) => Promise<void>
}

/**
 * Command-oriented ExtensionAPI mock: captures registrations (with
 * options), sent user messages, and exec calls dispatched through a
 * configurable handler.
 */
function makeCommandPi(handler: ExecHandler = () => ok()) {
  const commands: Record<string, CommandRegistration> = {}
  const sent: { content: string; options?: { deliverAs?: string } }[] = []
  const execCalls: ExecCall[] = []

  const pi = {
    registerTool: () => {},
    on: () => {},
    registerCommand: (name: string, options: CommandRegistration) => {
      commands[name] = options
    },
    sendUserMessage: (content: string, options?: { deliverAs?: string }) => {
      sent.push({ content, options })
    },
    exec: async (command: string, args: string[], options?: { cwd?: string }) => {
      const call = { command, args, cwd: options?.cwd }
      execCalls.push(call)
      return { ...handler(call), killed: false }
    },
  } as unknown as ExtensionAPI

  return { pi, commands, sent, execCalls }
}

function cmdCtx(idle = true): ExtensionCommandContext {
  return { cwd: "/work", isIdle: () => idle } as unknown as ExtensionCommandContext
}

interface SentMessage {
  content: string
  options?: { deliverAs?: string }
}

async function runCommand(
  name: string,
  args: string,
  opts?: { idle?: boolean; handler?: ExecHandler },
): Promise<{ msg: string; execCalls: ExecCall[]; sent: SentMessage[] }> {
  const { pi, commands, sent, execCalls } = makeCommandPi(opts?.handler)
  cuePlugins(pi)
  const cmd = commands[name]
  if (!cmd) throw new Error(`command ${name} not registered`)
  await cmd.handler(args, cmdCtx(opts?.idle ?? true))
  return { msg: sent[0]?.content ?? "", execCalls, sent }
}

/**
 * Default exec handler answering the orientation gathering calls: git
 * context (feature/x on master), cue status, two child contexts, a log
 * entry, and rendered spec+plan.
 */
function orientationPi(overrides: Record<string, ExecResult> = {}): ExecHandler {
  return (call: ExecCall): ExecResult => {
    const cueKey = call.command === "cue" ? call.args.join(" ") : ""
    if (cueKey && cueKey in overrides) return overrides[cueKey]!
    if (call.command === "git") {
      switch (call.args[0]) {
        case "symbolic-ref":
          return ok("feature/x\n")
        case "config":
          return ok("master\n")
        case "merge-base":
          return ok("abc123\n")
        default:
          return fail("")
      }
    }
    const a = call.args
    if (a[0] === "status" && a.includes("--json")) {
      return ok(JSON.stringify({ address: "scope/repo/ctx" }))
    }
    if (a[0] === "status") return ok("active context: ctx")
    if (a[0] === "context" && a[1] === "list") {
      return ok("scope/repo/child-a\nscope/repo/child-b")
    }
    if (a[0] === "log") return ok("- **Milestone:** shipped")
    if (a[0] === "render") return ok("SPEC\nPLAN")
    return ok()
  }
}

describe("command registration", () => {
  test("cuePlugins registers every command name", () => {
    const { pi, commands } = makeCommandPi()
    cuePlugins(pi)
    expect(Object.keys(commands).sort()).toEqual([
      "cue:context",
      "cue:context:pins",
      "cue:idea",
      "cue:init",
      "cue:init:build",
      "cue:init:design",
      "cue:init:learn",
      "cue:init:research",
      "cue:init:review",
      "cue:resume",
      "mcp-cast",
      "review:run",
    ])
  })
})

describe("contextChildren helper", () => {
  async function runChildren(
    handler: ExecHandler,
    slug?: string,
  ): Promise<{ block: string; execCalls: ExecCall[] }> {
    const { pi, execCalls } = makeCommandPi(handler)
    const block = await contextChildren(pi, "/work", slug)
    return { block, execCalls }
  }

  test("wraps direct children in <children> tags", async () => {
    const { block, execCalls } = await runChildren(orientationPi())
    expect(block).toBe("<children>\nscope/repo/child-a\nscope/repo/child-b\n</children>")
    const list = execCalls.find((c) => c.args[0] === "context")!
    expect(list.args).toEqual([
      "context",
      "list",
      "--scope",
      "store",
      "--filter",
      "parent=scope/repo/ctx",
    ])
  })

  test("passes the slug to cue status --json", async () => {
    const { execCalls } = await runChildren(orientationPi(), "auth")
    expect(execCalls[0].args).toEqual(["status", "--context", "auth", "--json"])
  })

  test("returns empty when status has no address (unset context)", async () => {
    const { block, execCalls } = await runChildren(
      orientationPi({ "status --json": ok("{}") }),
    )
    expect(block).toBe("")
    expect(execCalls).toHaveLength(1)
  })

  test("returns empty when cue status fails", async () => {
    const { block } = await runChildren(
      orientationPi({ "status --json": fail() }),
    )
    expect(block).toBe("")
  })

  test("returns empty when context list fails", async () => {
    const { block } = await runChildren(
      orientationPi({
        "context list --scope store --filter parent=scope/repo/ctx": fail(),
      }),
    )
    expect(block).toBe("")
  })

  test("returns empty when the list is empty", async () => {
    const { block } = await runChildren(
      orientationPi({
        "context list --scope store --filter parent=scope/repo/ctx": ok(""),
      }),
    )
    expect(block).toBe("")
  })
})

describe("/cue:resume", () => {
  test("composes the orientation message and gathers in template order", async () => {
    const { msg, execCalls } = await runCommand("cue:resume", "continue with step 3", {
      handler: orientationPi(),
    })

    const cueCalls = execCalls.filter((c) => c.command === "cue").map((c) => c.args)
    expect(cueCalls).toEqual([
      ["status"],
      ["status", "--json"],
      ["context", "list", "--scope", "store", "--filter", "parent=scope/repo/ctx"],
      ["log", "list", "--format", "md"],
      ["render", "spec/index.md", "plan/index.md"],
    ])

    expect(msg).toContain("<user-instructions>\ncontinue with step 3\n</user-instructions>")
    expect(msg).toContain("PWD: /work")
    expect(msg).toContain("BASE_BRANCH=master")
    expect(msg).toContain("CURRENT_BRANCH=feature/x")
    expect(msg).toContain("MERGE_BASE=abc123")
    expect(msg).toContain("<status>\nactive context: ctx\n</status>")
    expect(msg).toContain(
      "<children>\nscope/repo/child-a\nscope/repo/child-b\n</children>",
    )
    expect(msg).toContain("<log>\n- **Milestone:** shipped\n</log>")
    expect(msg).toContain("SPEC\nPLAN")
    expect(msg).not.toContain("Load the `cue` skill.")
    expect(msg).toContain("**DO NOT** perform any further research")
  })

  test("omits the children block when the list is empty", async () => {
    const { msg } = await runCommand("cue:resume", "", {
      handler: orientationPi({
        "context list --scope store --filter parent=scope/repo/ctx": ok(""),
      }),
    })
    expect(msg).not.toContain("<children>")
  })

  test("keeps the message shape when cue status fails", async () => {
    const { msg } = await runCommand("cue:resume", "", {
      handler: orientationPi({ status: fail() }),
    })
    expect(msg).toContain("<status>\n\n</status>")
  })

  test("queues as followUp when the agent is not idle", async () => {
    const { sent } = await runCommand("cue:resume", "", {
      idle: false,
      handler: orientationPi(),
    })
    expect(sent[0].options?.deliverAs).toBe("followUp")
  })
})

describe("/cue:context", () => {
  test("scopes every cue call to the slug and renders only the plan", async () => {
    const { msg, execCalls } = await runCommand(
      "cue:context",
      "auth do the thing",
      { handler: orientationPi() },
    )
    const cueCalls = execCalls.filter((c) => c.command === "cue").map((c) => c.args)
    expect(cueCalls).toEqual([
      ["status", "--context", "auth"],
      ["status", "--context", "auth", "--json"],
      ["context", "list", "--scope", "store", "--filter", "parent=scope/repo/ctx"],
      ["log", "list", "--context", "auth", "--format", "md"],
      ["render", "--context", "auth", "plan/index.md"],
    ])
    expect(msg).toContain("<user-instructions>\ndo the thing\n</user-instructions>")
    expect(msg).toContain("<status>\nactive context: ctx\n</status>")
  })

  test("empty instructions still render an empty block", async () => {
    const { msg } = await runCommand("cue:context", "auth", {
      handler: orientationPi(),
    })
    expect(msg).toContain("<user-instructions>\n\n</user-instructions>")
  })

  test("asks for a slug when none is given", async () => {
    const { msg, execCalls } = await runCommand("cue:context", "  ", {
      handler: orientationPi(),
    })
    expect(execCalls).toHaveLength(0)
    expect(msg).toContain("Usage")
  })
})

describe("/cue:init", () => {
  test("base init sends instructions without git or cue calls", async () => {
    const { msg, execCalls, sent } = await runCommand(
      "cue:init",
      "build the auth flow",
      { handler: orientationPi() },
    )
    expect(execCalls).toHaveLength(0)
    expect(sent).toHaveLength(1)
    expect(msg).toContain("<user-instructions>\nbuild the auth flow\n</user-instructions>")
    expect(msg).toContain("PWD: /work")
    expect(msg).not.toContain("Load the `cue` skill.")
    expect(msg).toContain("Call `cue-context` with that name")
    expect(msg).not.toContain("BASE_BRANCH")
  })

  test("build variant injects git context and its skill line", async () => {
    const { msg } = await runCommand("cue:init:build", "ship it", {
      handler: orientationPi(),
    })
    expect(msg).toContain("BASE_BRANCH=master")
    expect(msg).toContain("Load the `cue-build`, `git-commit` and `tdd` skills.")
    expect(msg).toContain('Call `cue-context` with `mode: "build"` and `kind: "work"`.')
  })

  test("design variant has no git context", async () => {
    const { msg, execCalls } = await runCommand("cue:init:design", "", {
      handler: orientationPi(),
    })
    expect(execCalls).toHaveLength(0)
    expect(msg).not.toContain("BASE_BRANCH")
    expect(msg).toContain("Load the `cue-design` skill.")
  })
})

describe("/cue:idea", () => {
  test("captures the idea and loads the cue-idea skill", async () => {
    const { msg, execCalls } = await runCommand("cue:idea", "port acuity to pi", {
      handler: orientationPi(),
    })
    expect(execCalls).toHaveLength(0)
    expect(msg).toContain("<idea>\nport acuity to pi\n</idea>")
    expect(msg).toContain("PWD: /work")
    expect(msg).toContain(
      "Load the `cue-idea` skill and follow it for the idea in `<idea>`.",
    )
  })
})

describe("/review:run", () => {
  test("sends the workflow prompt with resolved arguments", async () => {
    const { msg, execCalls, sent } = await runCommand(
      "review:run",
      "--reviewers opus,glm",
      { handler: orientationPi() },
    )
    expect(execCalls).toHaveLength(0)
    expect(sent).toHaveLength(1)
    expect(msg).toContain("<arguments>\n--reviewers opus,glm\n</arguments>")
    expect(msg).toContain("PWD: /work")
    expect(msg).toContain("# Automated Code Diff Review Workflow")
    expect(msg).toContain("delegate")
    expect(msg).toContain("review-findings.json")
  })

  test("omits the arguments block when none are given", async () => {
    const { msg } = await runCommand("review:run", "", {
      handler: orientationPi(),
    })
    expect(msg).not.toContain("<arguments>")
    expect(msg).toContain("# Automated Code Diff Review Workflow")
  })
})

import { describe, expect, test } from "bun:test"
import { buildDescription, formatReceipt, parseAgentList } from "./delegate-helpers"

describe("parseAgentList", () => {
  test("extracts name, description and model", () => {
    const out = JSON.stringify({
      agents: [{ name: "explore", description: "d", model: "m", tools: [] }],
    })
    expect(parseAgentList(out)).toEqual([{ name: "explore", description: "d", model: "m" }])
  })

  test("rejects output without an agents array", () => {
    expect(() => parseAgentList("{}")).toThrow()
  })
})

describe("buildDescription", () => {
  test("lists agents with their models", () => {
    const d = buildDescription([{ name: "consultant", description: "second opinion", model: "anthropic/opus" }])
    expect(d).toContain("- consultant (anthropic/opus): second opinion")
    expect(d).toContain("does NOT see this conversation")
  })
})

describe("formatReceipt", () => {
  const base = {
    model: null,
    exit_code: 0,
    duration_ms: 41000,
    turns: 6,
    cost_usd: 0.004,
    stderr_excerpt: null,
    trace: null,
    trace_error: null,
  }

  test("completed run shows response verbatim", () => {
    const text = formatReceipt({
      batch_id: "b",
      runs: [{ ...base, agent: "explore", outcome: "completed", response: "found it", error: null }],
    })
    expect(text).toBe("## explore - completed (6 turns, 41s, $0.0040)\n\nfound it")
  })

  test("failed run shows error and stderr", () => {
    const text = formatReceipt({
      batch_id: "b",
      runs: [{ ...base, agent: "x", outcome: "timeout", response: "", error: "deadline", stderr_excerpt: "boom" }],
    })
    expect(text).toContain("error: deadline")
    expect(text).toContain("stderr:\nboom")
  })
})

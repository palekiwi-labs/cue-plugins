import { describe, expect, test } from "bun:test"
import {
  DEFAULT_THRESHOLDS,
  buildReport,
  estimateContextTokens,
  formatReport,
  resolveThresholds,
  type MessageLike,
} from "./context-usage"

function assistant(tokens: {
  input: number
  output: number
  reasoning?: number
  cache?: { read: number; write: number }
}): MessageLike {
  return {
    info: {
      role: "assistant",
      tokens: {
        input: tokens.input,
        output: tokens.output,
        reasoning: tokens.reasoning ?? 0,
        cache: tokens.cache ?? { read: 0, write: 0 },
      },
    },
  }
}

function userText(text: string): MessageLike {
  return { info: { role: "user" }, parts: [{ type: "text", text }] }
}

function toolResult(output: string): MessageLike {
  return {
    info: { role: "user" },
    parts: [{ type: "tool", state: { status: "completed", output } }],
  }
}

describe("estimateContextTokens", () => {
  test("empty message list yields zero tokens", () => {
    expect(estimateContextTokens([])).toEqual({ tokens: 0, estimated: false })
  })

  test("sums all token fields of the last completed assistant message", () => {
    const messages = [
      assistant({ input: 1000, output: 200 }),
      assistant({
        input: 10_000,
        output: 500,
        reasoning: 100,
        cache: { read: 4_000, write: 1_500 },
      }),
    ]
    // 10_000 + 500 + 100 + 4_000 + 1_500 = 16_100
    expect(estimateContextTokens(messages)).toEqual({
      tokens: 16_100,
      estimated: false,
    })
  })

  test("uses the last assistant message with output > 0", () => {
    const messages = [
      assistant({ input: 10_000, output: 500 }),
      assistant({ input: 99_000, output: 0 }), // aborted / empty step
    ]
    expect(estimateContextTokens(messages).tokens).toBe(10_500)
  })

  test("adds chars/4 estimate for trailing user text", () => {
    const messages = [
      assistant({ input: 10_000, output: 500 }),
      userText("a".repeat(400)),
    ]
    expect(estimateContextTokens(messages)).toEqual({
      tokens: 10_500 + 100,
      estimated: true,
    })
  })

  test("adds chars/4 estimate for trailing completed tool outputs", () => {
    const messages = [
      assistant({ input: 10_000, output: 500 }),
      toolResult("b".repeat(200)),
    ]
    expect(estimateContextTokens(messages)).toEqual({
      tokens: 10_500 + 50,
      estimated: true,
    })
  })

  test("ignores running tool parts without output", () => {
    const messages = [
      assistant({ input: 10_000, output: 500 }),
      { info: { role: "user" }, parts: [{ type: "tool", state: { status: "running" } }] },
    ]
    expect(estimateContextTokens(messages)).toEqual({
      tokens: 10_500,
      estimated: false,
    })
  })

  test("with no assistant messages, estimates everything as trailing", () => {
    const messages = [userText("c".repeat(800))]
    expect(estimateContextTokens(messages)).toEqual({
      tokens: 200,
      estimated: true,
    })
  })
})

describe("resolveThresholds", () => {
  test("defaults to caution 80k, soft 100k, hard 140k", () => {
    expect(resolveThresholds()).toEqual(DEFAULT_THRESHOLDS)
    expect(DEFAULT_THRESHOLDS).toEqual({
      caution: 80_000,
      soft: 100_000,
      hard: 140_000,
    })
  })

  test("partial options override defaults", () => {
    expect(resolveThresholds({ soft: 90_000 })).toEqual({
      caution: 80_000,
      soft: 90_000,
      hard: 140_000,
    })
  })
})

describe("buildReport", () => {
  test("below caution is nominal and permits any task size", () => {
    const report = buildReport(79_999)
    expect(report.level).toBe("nominal")
    expect(report.canProceed).toEqual({ smallTask: true, largeTask: true })
    expect(report.headroom.soft).toBe(100_000 - 79_999)
    expect(report.headroom.hard).toBe(140_000 - 79_999)
  })

  test("caution boundary is inclusive and blocks large tasks", () => {
    const report = buildReport(80_000)
    expect(report.level).toBe("caution")
    expect(report.canProceed).toEqual({ smallTask: true, largeTask: false })
  })

  test("soft boundary is inclusive, hand-off mandatory", () => {
    const report = buildReport(100_000)
    expect(report.level).toBe("exceeded_soft")
    expect(report.canProceed).toEqual({ smallTask: false, largeTask: false })
  })

  test("hard boundary is inclusive, immediate halt", () => {
    const report = buildReport(140_000)
    expect(report.level).toBe("critical")
    expect(report.canProceed).toEqual({ smallTask: false, largeTask: false })
  })

  test("custom thresholds are honored", () => {
    const report = buildReport(50_000, { caution: 40_000, soft: 60_000, hard: 80_000 })
    expect(report.level).toBe("caution")
    expect(report.headroom.hard).toBe(80_000 - 50_000)
  })

  test("headroom is floored at zero", () => {
    const report = buildReport(150_000)
    expect(report.headroom.soft).toBe(0)
    expect(report.headroom.hard).toBe(0)
  })

  test("guidance mentions hand-off at exceeded_soft and halt at critical", () => {
    expect(buildReport(110_000).guidance).toMatch(/hand.?off/i)
    expect(buildReport(150_000).guidance).toMatch(/halt/i)
  })
})

describe("formatReport", () => {
  test("renders tokens, level, limits, headroom, and guidance", () => {
    const t = resolveThresholds()
    const text = formatReport(buildReport(82_450), t)
    expect(text).toContain("82,450")
    expect(text).toContain("CAUTION")
    expect(text).toContain("100,000")
    expect(text).toContain("17,550")
    expect(text).toMatch(/guidance/i)
  })

  test("flags estimated token counts", () => {
    const t = resolveThresholds()
    const text = formatReport({ ...buildReport(82_450), estimated: true }, t)
    expect(text).toMatch(/estimate/i)
  })
})

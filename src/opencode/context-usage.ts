// Pure logic for the cue-context-usage tool. Kept free of SDK imports so the
// decision model can be unit tested with structural fixtures; the SDK message
// shapes ({ info: Message, parts: Part[] }) are structurally compatible.

export type SaturationLevel = "nominal" | "caution" | "exceeded_soft" | "critical"

export type Thresholds = {
  /** Below this: proceed with any task size. */
  caution: number
  /** At/above this: hand-off becomes mandatory. */
  soft: number
  /** At/above this: immediate halt. */
  hard: number
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  caution: 80_000,
  soft: 100_000,
  hard: 140_000,
}

export function resolveThresholds(options?: Partial<Thresholds>): Thresholds {
  return { ...DEFAULT_THRESHOLDS, ...options }
}

export type UsageReport = {
  /** Total active context tokens. */
  tokens: number
  /** True when trailing messages were estimated at chars/4. */
  estimated: boolean
  level: SaturationLevel
  headroom: {
    caution: number
    soft: number
    hard: number
  }
  canProceed: {
    smallTask: boolean
    largeTask: boolean
  }
  guidance: string
}

const GUIDANCE: Record<SaturationLevel, string> = {
  nominal:
    "Context headroom is healthy. Proceed freely, including broad " +
    "exploration and complex multi-file work.",
  caution:
    "Headroom below the soft cap. Proceed only with atomic steps " +
    "(under ~10k expected tokens); hand off before large discovery or " +
    "multi-file refactors.",
  exceeded_soft:
    "Soft cap exceeded. Hand-off mandatory: finish only the in-flight " +
    "atomic commit/log, start no new plan items, load the cue-handoff " +
    "skill.",
  critical:
    "Hard cap exceeded. Immediate halt: cease all edits, perform an " +
    "emergency hand-off log, and stop.",
}

export function buildReport(
  tokens: number,
  thresholds?: Partial<Thresholds>,
): UsageReport {
  const t = resolveThresholds(thresholds)
  const level: SaturationLevel =
    tokens >= t.hard
      ? "critical"
      : tokens >= t.soft
        ? "exceeded_soft"
        : tokens >= t.caution
          ? "caution"
          : "nominal"
  const canProceed = {
    smallTask: level === "nominal" || level === "caution",
    largeTask: level === "nominal",
  }
  return {
    tokens,
    estimated: false,
    level,
    headroom: {
      caution: Math.max(0, t.caution - tokens),
      soft: Math.max(0, t.soft - tokens),
      hard: Math.max(0, t.hard - tokens),
    },
    canProceed,
    guidance: GUIDANCE[level],
  }
}

function fmt(n: number): string {
  return n.toLocaleString("en-US")
}

export function formatReport(report: UsageReport, thresholds?: Partial<Thresholds>): string {
  const t = resolveThresholds(thresholds)
  const est = report.estimated ? " (includes estimate)" : ""
  return [
    "Context Saturation Checkpoint",
    `  Tokens: ${fmt(report.tokens)}${est}`,
    `  Limits: caution ${fmt(t.caution)} / soft ${fmt(t.soft)} / hard ${fmt(t.hard)}`,
    `  Headroom: ${fmt(report.headroom.soft)} to soft / ${fmt(report.headroom.hard)} to hard`,
    `  Level: ${report.level.toUpperCase()}`,
    `  Guidance: ${report.guidance}`,
  ].join("\n")
}

// Structural subsets of the SDK Message/Part shapes (see
// @opencode-ai/sdk types.gen: UserMessage, AssistantMessage, TextPart, ToolPart).

export type TokenUsage = {
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}

export type MessageLike = {
  info: { role: string; tokens?: TokenUsage }
  parts?: PartLike[]
}

export type PartLike = {
  type: string
  text?: string
  state?: { status: string; output?: string }
}

const CHARS_PER_TOKEN = 4

function completedTokens(part: PartLike): number {
  if (part.type === "text" && typeof part.text === "string") {
    return Math.ceil(part.text.length / CHARS_PER_TOKEN)
  }
  if (
    part.type === "tool" &&
    part.state?.status === "completed" &&
    typeof part.state.output === "string"
  ) {
    return Math.ceil(part.state.output.length / CHARS_PER_TOKEN)
  }
  return 0
}

/**
 * Estimate the active context size for the next turn.
 *
 * Base: the last completed assistant message (output > 0), summing
 * input + output + reasoning + cache read/write — the same formula the
 * opencode app uses for its context meter.
 *
 * Trailing: any messages after that one (user text, tool results already
 * in the current turn) are estimated at chars/4, mirroring pi's
 * getContextUsage heuristic. `estimated` is true when trailing content
 * was counted.
 */
export function estimateContextTokens(messages: MessageLike[]): {
  tokens: number
  estimated: boolean
} {
  let baseIdx = -1
  let base = 0
  for (let i = messages.length - 1; i >= 0; i--) {
    const tokens = messages[i]!.info.tokens
    if (messages[i]!.info.role === "assistant" && tokens && tokens.output > 0) {
      base =
        tokens.input +
        tokens.output +
        tokens.reasoning +
        tokens.cache.read +
        tokens.cache.write
      baseIdx = i
      break
    }
  }
  let trailing = 0
  for (let i = baseIdx + 1; i < messages.length; i++) {
    for (const part of messages[i]!.parts ?? []) {
      trailing += completedTokens(part)
    }
  }
  return {
    tokens: base + trailing,
    estimated: trailing > 0,
  }
}

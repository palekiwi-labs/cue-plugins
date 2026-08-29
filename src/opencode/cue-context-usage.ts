import { type Plugin, tool } from "@opencode-ai/plugin"
import {
  buildReport,
  estimateContextTokens,
  formatReport,
  resolveThresholds,
  type Thresholds,
} from "./context-usage"

export const CueContextUsagePlugin: Plugin = async (input, options) => {
  const thresholds = resolveThresholds(
    (options ?? {}) as Partial<Thresholds>,
  )

  return {
    tool: {
      "cue-context-usage": tool({
        description:
          "Check this session's context token saturation against " +
          "caution/soft/hard limits. Call at milestones (after commits, " +
          "before starting the next plan item, after large reads) to " +
          "decide whether to continue or hand off.",
        args: {},
        async execute(_args, context) {
          const res = await input.client.session.messages({
            path: { id: context.sessionID },
          })
          if (res.error) {
            return {
              title: "Context usage unavailable",
              output:
                "Failed to query session messages: " +
                JSON.stringify(res.error),
            }
          }
          const { tokens, estimated } = estimateContextTokens(res.data ?? [])
          const report = { ...buildReport(tokens, thresholds), estimated }
          return {
            title: `Context ${report.level}: ${tokens.toLocaleString("en-US")} tokens`,
            output: formatReport(report, thresholds),
            metadata: {
              tokens: report.tokens,
              estimated: report.estimated,
              caution_limit: thresholds.caution,
              soft_limit: thresholds.soft,
              hard_limit: thresholds.hard,
              headroom_soft: report.headroom.soft,
              headroom_hard: report.headroom.hard,
              level: report.level,
              can_proceed_small_task: report.canProceed.smallTask,
              can_proceed_large_task: report.canProceed.largeTask,
            },
          }
        },
      }),
    },
  }
}

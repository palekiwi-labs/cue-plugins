import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { registerAcuityListener } from "./acuity"
import { registerContextCommand } from "./commands/context"
import { registerContextPinsCommand } from "./commands/context-pins"
import { registerIdeaCommand } from "./commands/idea"
import { registerInitCommands } from "./commands/init"
import { registerResumeCommand } from "./commands/resume"
import { registerReviewRunCommand } from "./commands/review-run"
import { registerMcpCastAdapter } from "./mcp"
import { registerCueSkillInjection } from "./skill-injection"
import { cueAddTool } from "./tools/cue-add"
import { cueContextTool } from "./tools/cue-context"
import { cueContextUsageTool } from "./tools/cue-context-usage"
import { cueLogTool } from "./tools/cue-log"
import { cuePlanTool } from "./tools/cue-plan"
import { cueReviewTool } from "./tools/cue-review"
import { cueTaskTool } from "./tools/cue-task"
import { saveBranchDiffTool } from "./tools/save-branch-diff"
import { delegateTool } from "./tools/delegate"

/**
 * cue-plugins extension for the pi harness.
 *
 * Registers the cue tool surface at parity with the opencode wrappers
 * (thin bridges over the `cue` CLI) plus the orientation commands, and
 * exposes the cast MCP server's tools as generated `mcp-cast_*` tools.
 * Injects the full cue skill into every session's system prompt.
 * Installed via the repo-root `package.json` `pi` manifest.
 */
export default function cuePlugins(pi: ExtensionAPI): void {
  // Registered individually: each factory yields a distinctly-typed
  // ToolDefinition, so a homogeneous loop would widen to an incompatible union.
  pi.registerTool(cueAddTool(pi))
  pi.registerTool(cueContextTool(pi))
  pi.registerTool(cueContextUsageTool())
  pi.registerTool(cueLogTool(pi))
  pi.registerTool(cuePlanTool(pi))
  pi.registerTool(cueReviewTool(pi))
  pi.registerTool(cueTaskTool(pi))
  pi.registerTool(saveBranchDiffTool(pi))
  pi.registerTool(delegateTool())

  registerInitCommands(pi)
  registerResumeCommand(pi)
  registerContextCommand(pi)
  registerContextPinsCommand(pi)
  registerIdeaCommand(pi)
  registerReviewRunCommand(pi)
  registerAcuityListener(pi)
  registerMcpCastAdapter(pi)
  registerCueSkillInjection(pi)
}

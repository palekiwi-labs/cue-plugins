import type {
  ExtensionAPI,
  ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent"

/**
 * Run a `cue` subcommand best-effort, returning stdout or a fallback
 * string on failure. Mirrors the `2>/dev/null` guards in the opencode
 * command markdown: orientation gathering must never throw.
 */
export async function cueBestEffort(
  pi: ExtensionAPI,
  cwd: string,
  args: string[],
  fallback = "",
): Promise<string> {
  try {
    const r = await pi.exec("cue", args, { cwd })
    return r.code === 0 ? r.stdout.trim() : fallback
  } catch {
    return fallback
  }
}

/**
 * Deliver a composed prompt as a user message. When the agent is
 * streaming, queue it as a follow-up so it lands after the current turn
 * instead of steering mid-flight.
 */
export function sendPrompt(
  pi: ExtensionAPI,
  ctx: ExtensionCommandContext,
  content: string,
): void {
  if (!ctx.isIdle()) {
    pi.sendUserMessage(content, { deliverAs: "followUp" })
  } else {
    pi.sendUserMessage(content)
  }
}

/**
 * Join non-empty sections with blank separators, mirroring the blank
 * lines between blocks in the opencode command markdown.
 */
export function composeMessage(sections: string[]): string {
  return sections.filter((s) => s !== "").join("\n\n")
}

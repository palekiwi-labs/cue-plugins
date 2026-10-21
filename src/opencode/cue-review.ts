import { randomUUID } from "node:crypto"
import { type Plugin, tool } from "@opencode-ai/plugin"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { contextFlag, dirFlag, storeFlag } from "./cue-args"
import { runCue } from "./cue-exec"
import { frontmatterFlags } from "./frontmatter"

/**
 * The single write door for review artifacts in opencode sessions.
 *
 * `cue add --type review` remains the CLI surface (invariant 5), but the
 * bridge exposes review only through this tool: a dedicated name makes
 * review writes distinguishable in the tool stream, and one choke point
 * lets permission profiles grant or deny review production per agent
 * without touching generic artifact creation.
 *
 * Control carried here rather than in cue core: the payload must be a
 * JSON object before cue is invoked (fail fast, no round-trip), and
 * existing artifacts are never overwritten — a rerun gets a new name,
 * because a review is a point-in-time record.
 */
const cueReviewTool = tool({
  description:
    "Create a JSON review artifact (reviewer payloads, findings, manifests). " +
    "This is the only way to write review artifacts: cue-add does not expose " +
    "the review type. Content must be a JSON object; cue adds no timestamps " +
    "or revision stamps, and existing files are never overwritten.",
  args: {
    content: tool.schema
      .string()
      .describe(
        "Complete JSON object payload. Must parse as a JSON object " +
        "(not an array or scalar); anything else is rejected before cue runs.",
      ),
    filename: tool.schema.string().describe(
      "Name of the file (e.g. 'reviewer-opus.json', 'review-findings.json'). " +
      "Nested relative paths are allowed (e.g. 'runs/<run-id>/findings.json'); " +
      "absolute paths and '..' are not. Extensionless names get '.json'.",
    ),
    metadata: tool.schema
      .record(
        tool.schema.string(),
        tool.schema.union([tool.schema.string(), tool.schema.array(tool.schema.string())]),
      )
      .optional()
      .describe(
        "Fields merged into the object as top-level JSON keys — the metadata " +
        "channel for JSON artifacts, never a YAML prefix. A list value emits " +
        "one entry per element (e.g. { reviewers: ['a', 'b'] }).",
      ),
    context: tool.schema.string().describe(
      "Context slug to write into, within the repository's scope. Required: " +
      "cue has no default or fallback context and a write with none fails. " +
      "Discover slugs with `cue context list`.",
    ),
    dir: tool.schema.string().optional().describe(
      "Run cue as if started in this directory instead of the session directory. " +
      "Mirrors the git -C convention; use to write into another repository's scope.",
    ),
    store: tool.schema.string().optional().describe(
      "Root of the cue store, overriding $CUE_STORE. Rarely needed; the " +
      "devshell exports the store every sandbox shares.",
    ),
  },
  async execute(args, context) {
    // Bridge-level control: reject a non-object payload before cue runs, so
    // the producer gets this tool's diagnostic rather than a cue round-trip.
    let parsed: unknown
    try {
      parsed = JSON.parse(args.content)
    } catch (error) {
      throw new Error(
        `cue-review content must be valid JSON: ${(error as Error).message}`,
      )
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error(
        "cue-review content must be a JSON object, not an array or scalar",
      )
    }

    const tempPath = join(tmpdir(), `cue-review-${randomUUID()}.json`)
    try {
      await Bun.write(tempPath, args.content)

      const flags = [
        ...dirFlag(args.dir, context.directory),
        ...storeFlag(args.store),
        ...contextFlag(args.context),
        ...(args.metadata ? frontmatterFlags(args.metadata) : []),
      ]

      return await runCue(
        ["add", ...flags, "--type", "review", "--file", tempPath, args.filename],
        context.directory,
      )
    } finally {
      const file = Bun.file(tempPath)
      if (await file.exists()) {
        await Bun.$`rm ${tempPath}`.quiet()
      }
    }
  },
})

export const CueReviewPlugin: Plugin = async () => {
  return {
    tool: {
      "cue-review": cueReviewTool,
    },
  }
}

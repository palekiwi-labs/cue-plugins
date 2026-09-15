import { type Plugin, tool } from "@opencode-ai/plugin"
import { dirFlag, storeFlag } from "./cue-args"
import { runCue } from "./cue-exec"
import { contextCreateFlags } from "./cue-context-helpers"

const cueContextTool = tool({
  description:
    "Create a context in the repository's scope. A context is the base unit " +
    "of cue: it owns the log, the spec, the plans, the notes and the tasks " +
    "for one piece of work. Every artifact write requires an existing " +
    "context and cue has no default, so start a new piece of work by " +
    "creating its context first. List existing slugs with `cue context list`.",
  args: {
    name: tool.schema.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/).describe(
      "Immutable context slug, a single path segment (e.g. 'auth-redesign'). " +
      "This is identity and cannot be changed later; put wording that may " +
      "change in title."
    ),
    title: tool.schema.string().optional().describe(
      "Presentation name, free prose. Distinct from the slug so it can be " +
      "reworded without breaking addresses."
    ),
    kind: tool.schema.enum(["work", "coord", "reference"]).optional().default("work").describe(
      "What ends this context. work finishes when its goal is met; coord is a " +
      "standing arrangement across repositories or child contexts and does " +
      "not finish; reference is durable material that is never done."
    ),
    mode: tool.schema.enum(["research", "design", "build", "review", "learn"]).optional().describe(
      "Advisory default session mode, the behavioural contract a session in " +
      "this context adopts. Advisory only: a single session may override it."
    ),
    description: tool.schema.string().optional().describe(
      "One-line description for listings."
    ),
    parent: tool.schema.string().optional().describe(
      "Canonical address of the parent context (e.g. " +
      "'palekiwi/palekiwi/cue-platform-direction'). Children are derived by " +
      "scanning for this field, so the parent record needs no edit."
    ),
    refs: tool.schema.array(tool.schema.string()).default([]).describe(
      "Canonical addresses of related contexts or artifacts " +
      "(<scope>/<context> or <scope>/<context>/<type>/<name>)."
    ),
    dir: tool.schema.string().optional().describe(
      "Run cue as if started in this directory instead of the session " +
      "directory. Mirrors the git -C convention; the repository's origin " +
      "remote is what determines the scope the context lands in."
    ),
    store: tool.schema.string().optional().describe(
      "Root of the cue store, overriding $CUE_STORE. Rarely needed; the " +
      "devshell exports the store every sandbox shares."
    ),
  },
  async execute(args, context) {
    const flags = [
      ...dirFlag(args.dir, context.directory),
      ...storeFlag(args.store),
      ...contextCreateFlags(args),
    ]

    return runCue(["context", "create", ...flags, args.name], context.directory)
  },
})

export const CueContextPlugin: Plugin = async () => {
  return {
    tool: {
      "cue-context": cueContextTool,
    },
  }
}

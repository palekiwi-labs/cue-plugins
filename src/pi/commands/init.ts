import type { ExtensionAPI } from "@earendil-works/pi-coding-agent"
import { formatGitContext, gitContext } from "../lib/git-context"
import { composeMessage, sendPrompt, withoutCueSkillLoad } from "./common"

/**
 * Static prompt text below, kept word-for-word in sync with the opencode
 * command markdown at `commands/opencode/cue/` (guarded by
 * prompt-sync.test.ts). pi markdown prompts have no shell interpolation,
 * so each command is an extension command embedding this text.
 */

export const INIT_INSTRUCTIONS = `Load the \`cue\` skill.

**Mandatory Instructions:**

- Analyze user instructions in \`<user-instructions>\` if present.
- Infer a concise kebab-case slug, a title, and a one-line description. Name
  the subject rather than the activity.
- Infer the session \`mode\` from the work at hand, and say which you assumed.
- Infer the context \`kind\`. Default to \`work\`.
- Call \`cue-context\` with that name, title, description, \`kind\` and \`mode\`.
- Load the skill matching the inferred mode (\`cue-<mode>\`), report back with a
  concise summary of the created context, and await instructions unless
  explicit instructions are provided in \`<user-instructions>\`.`

export const INIT_BUILD_INSTRUCTIONS = `Load the \`cue\`, \`cue-build\`, \`git-commit\` and \`tdd\` skills.

**Mandatory Instructions:**

- Analyze user instructions in \`<user-instructions>\`.
- Infer a concise kebab-case slug, a title, and a one-line description. Name
  the subject rather than the activity.
- Call \`cue-context\` with \`mode: "build"\` and \`kind: "work"\`.
- Report back with a concise summary of the created context and await
  instructions unless explicit instructions are provided in
  \`<user-instructions>\`.`

export const INIT_DESIGN_INSTRUCTIONS = `Load the \`cue\` and \`cue-design\` skills.

**Mandatory Instructions:**

- Analyze user instructions in \`<user-instructions>\`.
- Infer a concise kebab-case slug, a title, and a one-line description. Name
  the subject rather than the activity.
- Call \`cue-context\` with \`mode: "design"\` and \`kind: "work"\`.
- Report back with a concise summary of the created context and await
  instructions unless explicit instructions are provided in
  \`<user-instructions>\`.`

export const INIT_LEARN_INSTRUCTIONS = `Load the \`cue\` and \`cue-learn\` skills.

**Mandatory Instructions:**

- Analyze user instructions in \`<user-instructions>\`.
- Infer a concise kebab-case slug, a title, and a one-line description. Name
  the subject rather than the activity.
- Call \`cue-context\` with \`mode: "learn"\`. Use \`kind: "work"\` when the
  learning serves a goal that finishes, and \`kind: "reference"\` when the
  subject is durable material that goes cold rather than completing.
- Report back with a concise summary of the created context and await
  instructions unless explicit instructions are provided in
  \`<user-instructions>\`.`

export const INIT_RESEARCH_INSTRUCTIONS = `Load the \`cue\` and \`cue-research\` skills.

**Mandatory Instructions:**

- Analyze user instructions in \`<user-instructions>\` if present.
- Infer a concise kebab-case slug, a title, and a one-line description. Name
  the subject rather than the activity.
- Call \`cue-context\` with \`mode: "research"\` and \`kind: "work"\`, unless the
  material is durable reference that is never done, in which case use
  \`kind: "reference"\`.
- Report back with a concise summary of the created context and await
  instructions unless explicit instructions are provided in
  \`<user-instructions>\`.`

export const INIT_REVIEW_INSTRUCTIONS = `Load the \`cue\` and \`cue-review\` skills.

**Mandatory Instructions:**

- Analyze user instructions in \`<user-instructions>\` if present.
- Infer a concise kebab-case slug, a title, and a one-line description.
- Call \`cue-context\` with \`mode: "review"\` and \`kind: "work"\`.
- Report back with a concise summary of the created context and await
  instructions unless explicit instructions are provided in
  \`<user-instructions>\`.`

interface InitVariant {
  /** Command name suffix appended to `cue:init:` ("" for the base form). */
  suffix: string
  description: string
  /** Whether the prompt injects git context (build and review do). */
  gitContext: boolean
  instructions: string
}

const VARIANTS: InitVariant[] = [
  {
    suffix: "",
    description: "Infer and create a new cue context, then open a session in it",
    gitContext: false,
    instructions: withoutCueSkillLoad(INIT_INSTRUCTIONS),
  },
  {
    suffix: "build",
    description: "Create a new cue context for a build session (mode: build)",
    gitContext: true,
    instructions: withoutCueSkillLoad(INIT_BUILD_INSTRUCTIONS),
  },
  {
    suffix: "design",
    description: "Create a new cue context for a design session (mode: design)",
    gitContext: false,
    instructions: withoutCueSkillLoad(INIT_DESIGN_INSTRUCTIONS),
  },
  {
    suffix: "learn",
    description: "Create a new cue context for a learning session (mode: learn)",
    gitContext: false,
    instructions: withoutCueSkillLoad(INIT_LEARN_INSTRUCTIONS),
  },
  {
    suffix: "research",
    description: "Create a new cue context for a research session (mode: research)",
    gitContext: false,
    instructions: withoutCueSkillLoad(INIT_RESEARCH_INSTRUCTIONS),
  },
  {
    suffix: "review",
    description: "Create a new cue context for a review session (mode: review)",
    gitContext: true,
    instructions: withoutCueSkillLoad(INIT_REVIEW_INSTRUCTIONS),
  },
]

/**
 * Register `/cue:init` and its per-mode variants. One shared handler: the
 * only differences between variants are the embedded prompt text, the
 * description, and whether git context is injected.
 */
export function registerInitCommands(pi: ExtensionAPI): void {
  for (const variant of VARIANTS) {
    const name = variant.suffix ? `cue:init:${variant.suffix}` : "cue:init"
    pi.registerCommand(name, {
      description: variant.description,
      handler: async (args, ctx) => {
        const sections = [
          `<user-instructions>\n${args}\n</user-instructions>`,
          `PWD: ${ctx.cwd}`,
        ]
        if (variant.gitContext) {
          sections.push(formatGitContext(await gitContext(pi, ctx.cwd)))
        }
        sections.push(variant.instructions)
        sendPrompt(pi, ctx, composeMessage(sections))
      },
    })
  }
}

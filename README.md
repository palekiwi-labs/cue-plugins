# Cue Plugins for Opencode

This repository contains a set of plugins and skills for [Opencode](https://github.com/opencode-ai/opencode) that integrate with the `cue` memory system.

## Installation

To use these tools, clone the repository into your Opencode configuration directory:

```bash
mkdir -p ~/.config/opencode/plugin/palekiwi-labs
git clone https://github.com/palekiwi-labs/cue-plugins.git ~/.config/opencode/plugin/palekiwi-labs/cue-plugins
```

### Configuration

Add the following to your `opencode.json` configuration file (replace `<your-username>` with your actual system username):

```json
{
  "plugin": [
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/acuity-plugin.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-add.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-log.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-plan.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-task.ts",
    "/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/src/opencode/cue-todo.ts"
  ],
  "skills": {
    "paths": ["/home/<your-username>/.config/opencode/plugin/palekiwi-labs/cue-plugins/skills/"]
  }
}
```

## Available Tools

- **cue-add**: Generic tool to create any cue artifact.
- **cue-log**: Record milestones, decisions, and discoveries.
- **cue-plan**: Create technical plans and executive slices.
- **cue-task**: Manage kanban tasks on the master branch.
- **cue-todo**: Capture informal deferred notes.
- **acuity-plugin**: Integration with the Acuity service.

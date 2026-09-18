#!/usr/bin/env bash
set -euo pipefail

# Output direct child contexts for the active or specified context.
# Used by resume.md and context.md to brief agents on context hierarchy.

ADDR=$(cue status ${1:+--context "$1"} --json 2>/dev/null | jq -r '.address // empty')
[ -z "$ADDR" ] && exit 0

CHILDREN=$(cue context list --scope store --filter "parent=$ADDR" 2>/dev/null || true)

if [ -n "$CHILDREN" ]; then
    echo "<children>"
    echo "$CHILDREN"
    echo "</children>"
fi

#!/usr/bin/env bash

# Use shared git context detection
source "$(dirname "$0")/git-context.sh"

HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "no-commit")
TIMESTAMP=$(git log -1 --format=%ct HEAD 2>/dev/null || date +%s)

DIR=.agents/${CURRENT_BRANCH:-default}/tmp/${TIMESTAMP}-${HASH}

mkdir -p "$DIR"

git diff "$BASE_BRANCH...HEAD" > "$DIR/diff.patch"

echo "$DIR/diff.patch"

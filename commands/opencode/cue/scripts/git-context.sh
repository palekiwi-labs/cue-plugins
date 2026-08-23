#!/usr/bin/env bash
# Determine git context for code reviews and PRs

# 1. Determine Current Branch
CURRENT_BRANCH=$(git symbolic-ref --quiet --short HEAD 2>/dev/null || git branch --show-current 2>/dev/null || true)

# 2. Determine Base Branch via offline hierarchy (<5ms)
BASE_BRANCH=""
if [ -n "$CURRENT_BRANCH" ]; then
    BASE_BRANCH=$(git config "branch.${CURRENT_BRANCH}.base" 2>/dev/null || true)
fi

if [ -z "$BASE_BRANCH" ]; then
    REMOTE_HEAD=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || true)
    if [ -n "$REMOTE_HEAD" ]; then
        BASE_BRANCH="${REMOTE_HEAD#origin/}"
    fi
fi

if [ -z "$BASE_BRANCH" ]; then
    if git show-ref --verify --quiet refs/heads/main 2>/dev/null || \
       git show-ref --verify --quiet refs/remotes/origin/main 2>/dev/null; then
        BASE_BRANCH="main"
    elif git show-ref --verify --quiet refs/heads/master 2>/dev/null || \
         git show-ref --verify --quiet refs/remotes/origin/master 2>/dev/null; then
        BASE_BRANCH="master"
    else
        BASE_BRANCH="master"
    fi
fi

# 3. Determine Merge Base
if [ -n "$CURRENT_BRANCH" ] && [ -n "$BASE_BRANCH" ]; then
    MERGE_BASE=$(git merge-base "$BASE_BRANCH" "$CURRENT_BRANCH" 2>/dev/null)
fi

# 4. Output (only if being run directly)
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    echo "BASE_BRANCH=$BASE_BRANCH"
    echo "CURRENT_BRANCH=$CURRENT_BRANCH"
    echo "MERGE_BASE=$MERGE_BASE"
fi

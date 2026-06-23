#!/usr/bin/env bash
# Determine git context for code reviews and PRs

# 1. Determine Base Branch
if [ -f .git/GIT_BASE ]; then
    BASE_BRANCH=$(cat .git/GIT_BASE)
elif git show-ref --verify --quiet refs/heads/master; then
    BASE_BRANCH="master"
elif git show-ref --verify --quiet refs/heads/main; then
    BASE_BRANCH="main"
else
    # Fallback to origin if local doesn't exist
    BASE_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | cut -d' ' -f5)
    BASE_BRANCH=${BASE_BRANCH:-"master"}
fi

# 2. Determine Current Branch
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)

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

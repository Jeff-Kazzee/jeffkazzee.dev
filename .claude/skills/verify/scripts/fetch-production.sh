#!/usr/bin/env bash
# Refresh only local remote-tracking refs. No remote branches/settings are changed.
set -euo pipefail
repo="${1:-.}"
branch="${VERIFY_PRODUCTION_BRANCH:-}"
if [ -z "$branch" ]; then
  branch="$(git -C "$repo" ls-remote --symref origin HEAD | sed -n 's@^ref: refs/heads/\([^[:space:]]*\)[[:space:]]HEAD$@\1@p')"
fi
case "$branch" in main|prod) ;; *) echo 'Production branch is not main or prod; verify the hosting branch and set VERIFY_PRODUCTION_BRANCH explicitly.' >&2; exit 1 ;; esac
git -C "$repo" fetch origin "refs/heads/$branch:refs/remotes/origin/$branch"
git -C "$repo" remote set-head origin "$branch"
printf 'origin/%s\n' "$branch"

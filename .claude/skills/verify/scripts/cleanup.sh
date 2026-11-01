#!/usr/bin/env bash
# Usage: cleanup.sh [repo]. Stops only the processes this skill started and removes
# its scratch state. Evidence stays in $EVIDENCE.
set -uo pipefail
. "$(dirname "$0")/env.sh" "${1:-}"

# A pid file can outlive its process and the pid can be reused, so kill a pid
# only while its command line still names this checkout's server or Chrome profile.
ours() { [ -f "$STATE/$1.pid" ] && ps -o args= -p "$(cat "$STATE/$1.pid")" 2>/dev/null | grep -qF -- "$2"; }
for sig in TERM KILL; do
  ours serve "$REPO/dist" && kill -$sig "$(cat "$STATE/serve.pid")" 2>/dev/null
  # browser.mjs starts Chrome as its own process group, so kill the group.
  ours chrome "$STATE/chrome-profile" && kill -$sig -- "-$(cat "$STATE/chrome.pid")" 2>/dev/null
  sleep 0.5
done
# Remove the files launch.sh created and restore the ones it saved. If a restore
# fails or differs, keep the state folder so the saved copy survives, and fail.
[ -f "$STATE/created" ] && while read -r f; do rm -f "$REPO/$f"; done < "$STATE/created"
unrestored=()
for f in "$STATE"/saved/*; do
  [ -e "$f" ] || continue
  target="$REPO/$(basename "$f")"
  if ! cp -p "$f" "$target" || ! cmp -s "$f" "$target"; then unrestored+=("$(basename "$f")"); fi
done
if [ ${#unrestored[@]} -gt 0 ]; then
  echo "CLEANUP_RESULT=fail could not restore ${unrestored[*]}. The saved copies stay in $STATE/saved. Copy them back by hand"
  exit 1
fi
rm -rf "$STATE"
echo "CLEANUP_RESULT=done$([ -d "$EVIDENCE" ] && echo " evidence kept at $EVIDENCE")"

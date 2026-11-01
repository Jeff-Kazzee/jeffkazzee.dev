#!/usr/bin/env bash
# Usage: run-all.sh [repo]. Launch, doctor, every journey, cleanup. Prints
# VERIFY_RESULT=pass|fail, exits 0 or 1 to match, and keeps the evidence folder.
set -uo pipefail
HERE="$(dirname "$0")"
# An earlier run whose cleanup could not restore files must be fixed by hand first.
if ! previous="$("$HERE/cleanup.sh" "${1:-}")"; then
  echo "$previous"
  echo "VERIFY_RESULT=fail an earlier run left files it could not restore"
  exit 1
fi
. "$HERE/env.sh" "${1:-}"
mkdir -p "$EVIDENCE"
trap '"$HERE/cleanup.sh" "$REPO" > /dev/null' EXIT
trap 'exit 130' INT TERM

run() {
  local status=0
  if "$HERE/launch.sh" "$REPO" && "$HERE/doctor.sh" "$REPO"; then
    node "$SKILL/scripts/checks.mjs" "$REPO" "$VERIFY_PORT" "$EVIDENCE" || status=1
    node "$SKILL/scripts/browser.mjs" "$REPO" "$VERIFY_PORT" "$CHROME_PORT" "$STATE" "$EVIDENCE" || status=1
  else
    status=1
  fi
  "$HERE/cleanup.sh" "$REPO" || status=1
  echo "VERIFY_RESULT=$([ $status = 0 ] && echo pass || echo fail) evidence $EVIDENCE"
  # A pass with CHANGED or WARN lines still needs a reason in the report.
  jq -r '.[] | select(.verdict == "CHANGED" or .verdict == "WARN") | "  needs a reason: \(.verdict) \(.id) \(.name)"' \
    "$EVIDENCE/checks.json" "$EVIDENCE/browser.json" 2>/dev/null
  return $status
}
run 2>&1 | tee "$EVIDENCE/summary.txt"

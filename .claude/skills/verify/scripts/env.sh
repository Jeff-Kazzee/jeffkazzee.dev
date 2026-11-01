# Sourced by the other scripts. Usage: . env.sh [repo]
SKILL="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(cd "${1:-$SKILL/../../..}" && pwd)"
VERIFY_PORT="${VERIFY_PORT:-4410}"
CHROME_PORT=$((VERIFY_PORT + 1))
# One state folder per checkout and port, so two checkouts never share pid files.
STATE="/tmp/jeffkazzee-verify-$(printf %s "$REPO" | sha1sum | cut -c1-8)-$VERIFY_PORT"
EVIDENCE_ROOT="${VERIFY_EVIDENCE_ROOT:-$(dirname "$REPO")/$(basename "$REPO").evidence}"
if [ -z "${VERIFY_RUN:-}" ] && [ -f "$STATE/run" ]; then VERIFY_RUN="$(cat "$STATE/run")"; fi
if [ -z "${VERIFY_RUN:-}" ]; then
  VERIFY_RUN="$(date -u +%Y%m%dT%H%M%SZ)-$(git -C "$REPO" rev-parse --short HEAD)"
  mkdir -p "$STATE" && echo "$VERIFY_RUN" > "$STATE/run"
fi
EVIDENCE="$EVIDENCE_ROOT/$VERIFY_RUN"
export SKILL REPO VERIFY_PORT CHROME_PORT STATE EVIDENCE

# The build under test: HEAD plus a hash of every uncommitted change. Untracked
# files count by path and content, so a rename changes the hash.
build_id() {
  local changes
  changes="$(git -C "$REPO" diff HEAD
    git -C "$REPO" ls-files --others --exclude-standard -- src public scripts astro.config.mjs vercel.json |
      while read -r f; do printf '%s\n' "$f"; cat "$REPO/$f"; done)"
  echo "$(git -C "$REPO" rev-parse HEAD) $(printf '%s' "$changes" | sha256sum | cut -c1-16)"
}

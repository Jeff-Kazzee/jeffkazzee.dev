#!/usr/bin/env bash
# Usage: launch.sh [repo]. Builds the site the way CI does, then serves dist/ on
# $VERIFY_PORT with the headers from vercel.json. Prints LAUNCH_RESULT=pass|fail.
set -uo pipefail
. "$(dirname "$0")/env.sh" "${1:-}"

mkdir -p "$STATE" "$EVIDENCE"
bash "$SKILL/scripts/fetch-production.sh" "$REPO" > "$EVIDENCE/production-ref.log" 2>&1 || { cat "$EVIDENCE/production-ref.log"; echo 'LAUNCH_RESULT=fail production ref unavailable'; exit 1; }
production_ref="$(node "$SKILL/scripts/production-ref.mjs" "$REPO")" || exit 1
printf '%s %s\n' "$production_ref" "$(git -C "$REPO" rev-parse "$production_ref")" > "$EVIDENCE/production-ref.txt"
cd "$REPO"
# Record the tree before the build, so an edit during the build fails doctor.
tree="$(build_id)"
# prepare-ci.mjs overwrites these two files. Save any that exist so cleanup.sh
# can put them back, and note the rest so cleanup.sh removes them. A second
# launch before cleanup must not save the copies the first one wrote. A save
# that fails or differs stops the launch before anything is overwritten.
abort() { echo "LAUNCH_RESULT=fail $1. Nothing in the checkout was changed"; exit 1; }
mkdir -p "$STATE/saved" || abort "could not create $STATE/saved"
for f in pnpm-lock.yaml pnpm-workspace.yaml; do
  if [ -e "$STATE/saved/$f" ] || grep -qxF "$f" "$STATE/created" 2>/dev/null; then continue; fi
  if [ -e "$f" ]; then
    if ! cp -p "$f" "$STATE/saved/$f" || ! cmp -s "$f" "$STATE/saved/$f"; then
      rm -f "$STATE/saved/$f"
      abort "could not save $f before prepare-ci.mjs overwrites it"
    fi
  else
    echo "$f" >> "$STATE/created" || abort "could not record that launch creates $f"
  fi
done
{
  echo "HEAD $(git rev-parse HEAD) dirty=$(git status --porcelain | grep -v -E ' (pnpm-lock|pnpm-workspace)\.yaml$' | wc -l)"
  echo "node $(node -v) pnpm $(pnpm -v)"
  node scripts/prepare-ci.mjs &&
  pnpm install --frozen-lockfile &&
  pnpm run agent-surface &&
  # pnpm run build without its budget step. A9 runs the budget, so an oversized
  # page still fails but no longer hides every other journey.
  pnpm exec astro check &&
  # Build with the environment and release live production was built with,
  # so A11 can compare pages byte for byte. The production ref was independently fetched above.
  # No report leaves the driven browser, so this label reaches no Sentry data.
  VERCEL_ENV=production VERCEL_GIT_COMMIT_SHA="$(git rev-parse "$production_ref")" pnpm exec astro build
} > "$EVIDENCE/build.log" 2>&1
build=$?
if [ $build -ne 0 ]; then
  tail -25 "$EVIDENCE/build.log"
  echo "LAUNCH_RESULT=fail build exited $build, log at $EVIDENCE/build.log"
  exit 1
fi
echo "$tree" > "$STATE/build-id"

node "$SKILL/scripts/serve.mjs" "$REPO/dist" "$VERIFY_PORT" > "$STATE/serve.log" 2>&1 &
echo $! > "$STATE/serve.pid"
for _ in $(seq 1 50); do
  if grep -q "^SERVING" "$STATE/serve.log"; then
    echo "LAUNCH_RESULT=pass http://127.0.0.1:$VERIFY_PORT pid $(cat "$STATE/serve.pid") evidence $EVIDENCE"
    exit 0
  fi
  sleep 0.2
done
cat "$STATE/serve.log"
echo "LAUNCH_RESULT=fail server did not start"
exit 1

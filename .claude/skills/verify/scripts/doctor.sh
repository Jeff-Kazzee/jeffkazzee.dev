#!/usr/bin/env bash
# Usage: doctor.sh [repo]. Read-only. Prints DOCTOR_RESULT=pass|fail with the reason.
set -uo pipefail
. "$(dirname "$0")/env.sh" "${1:-}"

fail() { echo "DOCTOR_RESULT=fail $1"; exit 1; }
[ -f "$STATE/serve.pid" ] || fail "no server state in $STATE. Run launch.sh"
pid="$(cat "$STATE/serve.pid")"
kill -0 "$pid" 2>/dev/null || fail "server pid $pid is not running. Run cleanup.sh, then launch.sh"
owner="$(ss -ltnpH "sport = :$VERIFY_PORT" 2>/dev/null | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2)"
[ "$owner" = "$pid" ] || fail "port $VERIFY_PORT is held by pid ${owner:-none}, not our server $pid"
[ "$(cat "$STATE/build-id" 2>/dev/null)" = "$(build_id)" ] || fail "dist/ was built from another tree. Run cleanup.sh, then launch.sh"
code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$VERIFY_PORT/")"
[ "$code" = 200 ] || fail "home page returned $code"
command -v google-chrome >/dev/null || fail "google-chrome is not installed, browser journeys cannot run"
echo "DOCTOR_RESULT=pass pid $pid port $VERIFY_PORT build $(cut -c1-12 "$STATE/build-id") evidence $EVIDENCE"

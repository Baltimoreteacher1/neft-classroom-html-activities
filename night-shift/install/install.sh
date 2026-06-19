#!/usr/bin/env bash
# Installs the Night Shift launchd job. Idempotent: re-run to update schedule.
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLIST_SRC="$REPO/night-shift/install/com.neft.nightshift.plist"
LABEL="com.neft.nightshift"
DEST="$HOME/Library/LaunchAgents/$LABEL.plist"
NODE_BIN="$(command -v node)"

# Read schedule from config.json (fallback 02:00).
HOUR="$(node -e "try{console.log(require('$REPO/night-shift/config.json').scheduleHour??2)}catch{console.log(2)}")"
MIN="$(node -e "try{console.log(require('$REPO/night-shift/config.json').scheduleMinute??0)}catch{console.log(0)}")"

mkdir -p "$HOME/Library/LaunchAgents" "$REPO/night-shift/briefings"

sed -e "s#__NODE_BIN__#$NODE_BIN#g" \
	-e "s#__REPO__#$REPO#g" \
	-e "s#__HOUR__#$HOUR#g" \
	-e "s#__MINUTE__#$MIN#g" \
	"$PLIST_SRC" >"$DEST"

launchctl unload "$DEST" 2>/dev/null || true
launchctl load "$DEST"

echo "Installed $LABEL — runs nightly at $(printf '%02d:%02d' "$HOUR" "$MIN")."
echo "Plist: $DEST"
echo "Run now: launchctl start $LABEL   |   Logs: night-shift/briefings/launchd.log"

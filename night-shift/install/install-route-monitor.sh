#!/usr/bin/env bash
# Installs the live Route Monitor launchd job (hourly by default). Idempotent:
# re-run to update the interval. Logs to night-shift/briefings/route-monitor.log.
#
# Interval is read from $ROUTE_MONITOR_INTERVAL (seconds) or defaults to 3600.
#   ROUTE_MONITOR_INTERVAL=1800 bash night-shift/install/install-route-monitor.sh
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLIST_SRC="$REPO/night-shift/install/com.neft.route-monitor.plist"
LABEL="com.neft.route-monitor"
DEST="$HOME/Library/LaunchAgents/$LABEL.plist"
NODE_BIN="$(command -v node)"
INTERVAL="${ROUTE_MONITOR_INTERVAL:-3600}"

mkdir -p "$HOME/Library/LaunchAgents" "$REPO/night-shift/briefings"

sed -e "s#__NODE_BIN__#$NODE_BIN#g" \
	-e "s#__REPO__#$REPO#g" \
	-e "s#__INTERVAL__#$INTERVAL#g" \
	"$PLIST_SRC" >"$DEST"

launchctl unload "$DEST" 2>/dev/null || true
launchctl load "$DEST"

echo "Installed $LABEL — runs every ${INTERVAL}s against the manifest base."
echo "Plist: $DEST"
echo "Run now: launchctl start $LABEL   |   Logs: night-shift/briefings/route-monitor.log"
echo "Uninstall: launchctl unload \"$DEST\" && rm \"$DEST\""

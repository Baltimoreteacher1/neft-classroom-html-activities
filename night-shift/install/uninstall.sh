#!/usr/bin/env bash
# Removes the Night Shift launchd job.
set -euo pipefail
LABEL="com.neft.nightshift"
DEST="$HOME/Library/LaunchAgents/$LABEL.plist"
launchctl unload "$DEST" 2>/dev/null || true
rm -f "$DEST"
echo "Removed $LABEL."

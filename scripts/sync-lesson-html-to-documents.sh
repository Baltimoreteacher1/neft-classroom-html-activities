#!/bin/bash
# Regenerate the self-contained lesson HTML and back it up to Google Drive
# (and to ~/Documents when permission allows).
# Run weekly by launchd (~/Library/LaunchAgents/com.neft.lesson-html-sync.plist).
#
# Google Drive is the reliable weekly target: it lives under ~/Library/CloudStorage,
# which a launchd background job can write to (no macOS Full Disk Access needed),
# and Google Drive for Desktop auto-syncs it to the cloud.
#
# The ~/Documents copy is best-effort: macOS TCC blocks launchd from writing into
# Documents without a Full Disk Access grant for /bin/bash, so that copy is allowed
# to fail without failing the whole job. It updates fine when run from Terminal.
set -euo pipefail

REPO="/Users/joelneft/neft-classroom-html-activities"
NODE="/opt/homebrew/bin/node"
SRC="$REPO/dist/lesson-html"
DRIVE_DEST="$HOME/Library/CloudStorage/GoogleDrive-neftjd@gmail.com/My Drive/Neft Lesson Source"
DOCS_DEST="$HOME/Documents/Neft Lesson Source"
STAMP="Last synced: $(date '+%Y-%m-%d %H:%M:%S %Z')"

cd "$REPO"

# 1. Rebuild the standalone lesson HTML (combined + per-lesson + index).
"$NODE" scripts/export-lesson-html.mjs

# 2. Back up to Google Drive (reliable, syncs to cloud).
mkdir -p "$DRIVE_DEST"
rsync -a --delete "$SRC"/ "$DRIVE_DEST"/
echo "$STAMP" >"$DRIVE_DEST/LAST_SYNC.txt"
echo "Synced lesson HTML to Google Drive: $DRIVE_DEST"

# 3. Best-effort copy to ~/Documents (may be blocked under launchd by macOS TCC).
if mkdir -p "$DOCS_DEST" 2>/dev/null && rsync -a --delete "$SRC"/ "$DOCS_DEST"/ 2>/dev/null; then
	echo "$STAMP" >"$DOCS_DEST/LAST_SYNC.txt"
	echo "Synced lesson HTML to Documents: $DOCS_DEST"
else
	echo "Skipped Documents copy (no permission in this context) — Google Drive copy is current."
fi

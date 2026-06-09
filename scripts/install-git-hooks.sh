#!/usr/bin/env bash
# Installs the repo's canonical git hooks (.githooks/*) into the active hooks
# path so they run automatically. Idempotent. Run via: npm run qa:install-hooks
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT"

SRC="$ROOT/.githooks"
# Honor an explicit core.hooksPath if set; otherwise default to .git/hooks.
DEST="$(git config --get core.hooksPath || echo "$ROOT/.git/hooks")"
mkdir -p "$DEST"

if [ ! -d "$SRC" ]; then
	echo "No .githooks/ directory found — nothing to install."
	exit 0
fi

installed=0
for hook in "$SRC"/*; do
	[ -f "$hook" ] || continue
	name="$(basename "$hook")"
	cp "$hook" "$DEST/$name"
	chmod +x "$DEST/$name"
	echo "Installed hook: $name -> $DEST/$name"
	installed=$((installed + 1))
done

echo "Done. $installed hook(s) installed into: $DEST"

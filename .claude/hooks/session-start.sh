#!/bin/bash
# SessionStart hook for neft-classroom-html-activities.
# Installs npm dependencies so Closed-Loop QA checks (validate/build/audit)
# work in Claude Code on the web. Idempotent and non-interactive.
set -euo pipefail

# Only run in the remote (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Install dependencies. Use `npm install` (not `npm ci`) so the cached
# container state is reused on later runs instead of wiping node_modules.
# Respect package-lock.json during install -- do NOT pass --no-package-lock,
# which makes npm ignore the lockfile and risks dependency drift. This sandbox
# can run an older npm than the one that generated the committed lockfile, so
# the install may rewrite package-lock.json; discard that accidental rewrite so
# the lockfile stays authoritative in git and no spurious dirty diff is left.
npm install --no-audit --no-fund
git restore package-lock.json 2>/dev/null || git checkout -- package-lock.json 2>/dev/null || true

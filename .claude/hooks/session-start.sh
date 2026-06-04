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
npm install --no-audit --no-fund

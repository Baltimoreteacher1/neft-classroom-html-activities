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
# `--no-package-lock` keeps the install from rewriting package-lock.json on
# resume: this sandbox can run an older npm than the one that generated the
# committed lockfile, and a rewrite would leave a spurious dirty diff every
# session. The lockfile stays authoritative in git and in CI (`npm ci`).
npm install --no-audit --no-fund --no-package-lock

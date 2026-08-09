#!/bin/bash
# SessionStart hook for neft-classroom-html-activities.
# Installs npm dependencies so Closed-Loop QA checks (validate/build/audit)
# work in Claude Code on the web. Idempotent and non-interactive.
set -euo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}"

# Deploy-graph summary, in EVERY session (not just remote ones).
#
# The edges between these repos are not discoverable by reading this one. A
# session that does not know fix-it-design-challenge is an unserved mirror can
# spend an hour editing a file that reaches nobody — which is exactly what
# happened. Printing it costs nothing and puts the map in context up front.
if [ -f tools/graph/deploy-graph.json ]; then
  node tools/graph/summarize-graph.mjs 2>/dev/null || true
fi

# Everything below installs dependencies, which only makes sense in the remote
# (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install dependencies. Use `npm install` (not `npm ci`) so the cached
# container state is reused on later runs instead of wiping node_modules.
# Respect package-lock.json during install -- do NOT pass --no-package-lock,
# which makes npm ignore the lockfile and risks dependency drift. This sandbox
# can run an older npm than the one that generated the committed lockfile, so
# the install may rewrite package-lock.json; discard that accidental rewrite so
# the lockfile stays authoritative in git and no spurious dirty diff is left.
npm install --no-audit --no-fund
git restore package-lock.json 2>/dev/null || git checkout -- package-lock.json 2>/dev/null || true

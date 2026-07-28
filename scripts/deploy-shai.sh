#!/usr/bin/env bash
#
# deploy-shai.sh — one-command deploy of the Shai / Focus School PWA to
# production (https://shai.eduwonderlab.com).
#
# WHY THIS EXISTS
#   `shai-school` is a DIRECT-UPLOAD Cloudflare Pages project (Git Provider:
#   No) — exactly like the `focus-school` project behind noam.eduwonderlab.com.
#   Pushing to `main` does NOT deploy it; `wrangler pages deploy` is the only
#   path. This is the sibling of scripts/deploy-noam.sh; keep the two in sync.
#
#   Before this script existed, shai-school/ lived only on a feature branch and
#   was deployed by hand from a dirty worktree — the exact setup that has twice
#   shipped stale code to production. Source of truth is now origin/main.
#
# WHAT IT DOES (safely)
#   1. Fetches origin/main and deploys a CLEAN checkout of it — never your
#      local working tree.
#   2. Uploads shai-school/ to the `shai-school` Pages project (production).
#   3. Aborts if the service-worker cache VERSION is unchanged while the bundle
#      changed (installed PWAs would keep serving the old app.js).
#   4. Verifies the live site now serves the deployed app.js, then cleans up.
#
# USAGE
#   ALLOW_DEPLOY=1 npm run deploy:shai
#   ALLOW_DEPLOY=1 bash scripts/deploy-shai.sh
#
set -euo pipefail

PROJECT="shai-school"
APP_DIR="shai-school"
LIVE="https://shai.eduwonderlab.com"
SW_PREFIX="shai-school-v"

# --- approval gate (same as the classroom `npm run deploy`) -----------------
if [ "${ALLOW_DEPLOY:-}" != "1" ]; then
  echo "Production deploy blocked." >&2
  echo "Re-run with explicit approval:  ALLOW_DEPLOY=1 npm run deploy:shai" >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "▶ Fetching origin/main…"
git fetch origin main --quiet

SHA="$(git rev-parse --short origin/main)"
WT="$(mktemp -d -t deploy-shai-XXXXXX)"
cleanup() {
  git worktree remove --force "$WT" >/dev/null 2>&1 || true
  git worktree prune >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "▶ Checking out a clean origin/main ($SHA)…"
git worktree add --detach "$WT" origin/main --quiet

if [ ! -f "$WT/$APP_DIR/index.html" ] || [ ! -f "$WT/$APP_DIR/app.js" ]; then
  echo "✗ $APP_DIR/ is missing core files in origin/main — aborting." >&2
  exit 1
fi

# --- cache hygiene check ----------------------------------------------------
# An unchanged SW VERSION with a CHANGED bundle is a broken release: installed
# PWAs keep serving the old precached app.js indefinitely.
live_sw="$(curl -fsS "$LIVE/sw.js" 2>/dev/null | grep -oE "${SW_PREFIX}[0-9]+" | head -1 || true)"
new_sw="$(grep -oE "${SW_PREFIX}[0-9]+" "$WT/$APP_DIR/sw.js" | head -1 || true)"
if [ -n "$live_sw" ] && [ "$live_sw" = "$new_sw" ]; then
  live_app_bytes="$(curl -fsS "$LIVE/app.js?cb=$RANDOM$RANDOM" 2>/dev/null | wc -c | tr -d ' ' || true)"
  new_app_bytes="$(wc -c <"$WT/$APP_DIR/app.js" | tr -d ' ')"
  if [ -n "$live_app_bytes" ] && [ "$live_app_bytes" != "$new_app_bytes" ] && [ "${ALLOW_SAME_VERSION:-}" != "1" ]; then
    echo "✗ app.js changed (live ${live_app_bytes}B → new ${new_app_bytes}B) but sw.js VERSION is still $new_sw." >&2
    echo "  Installed PWAs would keep the stale bundle. Bump VERSION in $APP_DIR/sw.js," >&2
    echo "  commit + push to main, then re-deploy. (ALLOW_SAME_VERSION=1 to override.)" >&2
    exit 1
  fi
  echo "⚠ Service-worker version unchanged ($new_sw) — no bundle change detected."
fi

# --- deploy -----------------------------------------------------------------
echo "▶ Deploying $APP_DIR/ → Pages project '$PROJECT' (production)…"
(cd "$WT/$APP_DIR" && npx wrangler pages deploy . --project-name="$PROJECT" --branch=main)

# --- verify (cache-busted, so we hit the new origin content) ----------------
echo "▶ Verifying $LIVE …"
want="$(wc -c <"$WT/$APP_DIR/app.js" | tr -d ' ')"
got=""
for _ in $(seq 1 12); do
  got="$(curl -fsS "$LIVE/app.js?cb=$RANDOM$RANDOM" 2>/dev/null | wc -c | tr -d ' ' || true)"
  [ "$got" = "$want" ] && break
  sleep 4
done

if [ "$got" = "$want" ]; then
  echo "✓ Live app.js matches deployed build (${want} bytes). Done: $LIVE"
else
  echo "△ Deployed, but live app.js (${got:-?} bytes) != built (${want} bytes) yet."
  echo "  Edge cache may lag a moment, or a browser HTTP-caches app.js for 4h"
  echo "  (Cache-Control: max-age=14400) — hard-refresh to confirm. URL: $LIVE"
fi

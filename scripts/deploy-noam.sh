#!/usr/bin/env bash
#
# deploy-noam.sh — one-command deploy of the Noam / Focus School PWA to
# production (https://noam.eduwonderlab.com).
#
# WHY THIS EXISTS
#   The `focus-school` Cloudflare Pages project is a DIRECT-UPLOAD project
#   (Git Provider: No) — it is NOT connected to GitHub. So pushing to `main`
#   does NOT deploy noam.eduwonderlab.com; the only deploy path is
#   `wrangler pages deploy`. (The separate `neft-classroom-html-activities`
#   project IS git-connected and auto-deploys eduwonderlab.com on push — do
#   NOT confuse the two.)
#
# WHAT IT DOES (safely)
#   1. Fetches origin/main and deploys a CLEAN checkout of it — never your
#      local working tree, which could ship stale code (the historical
#      "revert" bug).
#   2. Uploads focus-school/ to the `focus-school` Pages project (production).
#   3. Warns if the service-worker cache VERSION is unchanged (installed PWAs
#      would keep serving the old bundle).
#   4. Verifies the live site now serves the deployed app.js, then cleans up.
#
# USAGE
#   ALLOW_DEPLOY=1 npm run deploy:noam
#   ALLOW_DEPLOY=1 bash scripts/deploy-noam.sh
#
set -euo pipefail

PROJECT="focus-school"
APP_DIR="focus-school"
LIVE="https://noam.eduwonderlab.com"

# --- approval gate (same as the classroom `npm run deploy`) -----------------
if [ "${ALLOW_DEPLOY:-}" != "1" ]; then
  echo "Production deploy blocked." >&2
  echo "Re-run with explicit approval:  ALLOW_DEPLOY=1 npm run deploy:noam" >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

echo "▶ Fetching origin/main…"
git fetch origin main --quiet

SHA="$(git rev-parse --short origin/main)"
WT="$(mktemp -d -t deploy-noam-XXXXXX)"
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

# --- vendor the Math Workbench so it serves on noam's OWN domain -------------
# Single source of truth lives at curriculum/math-workbench/; copy it (and the
# favicon it references) into the app at deploy time so the in-app "Open Math
# Workbench" button stays on noam.eduwonderlab.com instead of bouncing to
# eduwonderlab.com (which is behind Basic Auth). The Workbench's brand link is
# host-aware, so "home" points back to the planner on this domain.
if [ -f "$WT/curriculum/math-workbench/index.html" ]; then
  echo "▶ Vendoring Math Workbench into $APP_DIR/curriculum/math-workbench/…"
  mkdir -p "$WT/$APP_DIR/curriculum/math-workbench" "$WT/$APP_DIR/assets"
  cp -R "$WT/curriculum/math-workbench/." "$WT/$APP_DIR/curriculum/math-workbench/"
  [ -f "$WT/assets/favicon.svg" ] && cp "$WT/assets/favicon.svg" "$WT/$APP_DIR/assets/favicon.svg"
else
  echo "⚠ curriculum/math-workbench/ not found in origin/main — skipping vendor." >&2
fi

# --- vendor the shared assets index.html references --------------------------
# focus-school/index.html loads /assets/formula-popup.js. On noam's own Pages
# project that path does not exist, so Pages serves the SPA fallback (HTML) and
# the browser refuses the script on strict MIME checking — a console error on
# every page load. Copy it at deploy time so the root repo stays the single
# source of truth (no committed duplicate to drift).
mkdir -p "$WT/$APP_DIR/assets"
for shared in formula-popup.js; do
  if [ -f "$WT/assets/$shared" ]; then
    cp "$WT/assets/$shared" "$WT/$APP_DIR/assets/$shared"
  else
    echo "⚠ assets/$shared not found in origin/main — noam will 404 it." >&2
  fi
done

# --- cache hygiene check ----------------------------------------------------
# An unchanged SW VERSION with a CHANGED bundle is a broken release: installed
# PWAs keep serving the old precached app.js indefinitely. Detect it by
# comparing the built app.js size against what production serves, and abort
# instead of warning (ALLOW_SAME_VERSION=1 overrides for intentional cases).
live_sw="$(curl -fsS "$LIVE/sw.js" 2>/dev/null | grep -oE 'focus-school-v[0-9]+' | head -1 || true)"
new_sw="$(grep -oE 'focus-school-v[0-9]+' "$WT/$APP_DIR/sw.js" | head -1 || true)"
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

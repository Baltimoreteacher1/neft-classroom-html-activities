#!/usr/bin/env bash
# ship.sh — one-command, guarded deploy for eduwonderlab.com (Cloudflare Pages
# Git integration). Encodes the full known-good deploy flow so nothing has to
# be remembered by hand:
#
#   1. Preflight: right repo (stale-clone guard), commits resolvable, orphan
#      smoke-server on port 41847 killed (recurring validate:lesson-boot 0/16
#      failure), origin/main fetched fresh.
#   2. Clean detached worktree at origin/main (never pushes the working
#      branch, never touches your working tree — the repo auto-commits during
#      sessions, so main must be assembled by cherry-pick, not merge).
#   3. Cherry-picks the requested SHAs; rewrites any private (non-noreply)
#      author email so GitHub's GH007 push protection cannot reject the push.
#   4. Pushes HEAD:main — the pre-push hook runs the full QA loop first, and
#      Cloudflare builds + promotes automatically (~1-3 min).
#   5. Verifies the deploy actually went live by polling the public build
#      stamp (/access-practice-lab/config.json) until it reports the pushed
#      commit; on timeout it prints the CF-freeze remediation.
#   6. Cleans up the worktree (kept for inspection if QA/push fails).
#
# Usage (production deploys require explicit authorization):
#   ALLOW_DEPLOY=1 npm run ship -- <sha> [sha...]   # deploy specific commits
#   ALLOW_DEPLOY=1 npm run ship -- <a>..<b>         # deploy a commit range
#   ALLOW_DEPLOY=1 npm run ship -- HEAD             # deploy current commit
#   ALLOW_DEPLOY=1 npm run ship -- --rebuild        # empty commit: unfreeze a
#                                                   # stuck CF Pages build
#   npm run ship -- --verify [sha]                  # read-only: poll the live
#                                                   # stamp (default origin/main)
#   ... --dry-run                                   # everything except push
#
# This does NOT replace the Git-integration deploy path — it drives it. Manual
# `wrangler pages deploy` remains forbidden (see scripts/guard-deploy.js).
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"
[ -n "$ROOT" ] || {
  echo "ship: not inside a git repo" >&2
  exit 1
}
cd "$ROOT" || exit 1

STAMP_URL="https://eduwonderlab.com/access-practice-lab/config.json"
EXPECTED_REPO="neft-classroom-html-activities"
SMOKE_PORT=41847
VERIFY_TIMEOUT_SECS=720
VERIFY_INTERVAL_SECS=20

MODE="ship" # ship | rebuild | verify
DRY_RUN=0
SHAS=()

say() { printf '%s\n' "$*"; }
fail() {
  printf 'ship: %s\n' "$*" >&2
  exit 1
}

# --- Parse args -----------------------------------------------------------------
for arg in "$@"; do
  case "$arg" in
  --rebuild) MODE="rebuild" ;;
  --verify) MODE="verify" ;;
  --dry-run) DRY_RUN=1 ;;
  --help | -h)
    sed -n '2,35p' "$0" | sed 's/^# \{0,1\}//'
    exit 0
    ;;
  -*) fail "unknown flag: $arg (see --help)" ;;
  *) SHAS+=("$arg") ;;
  esac
done

# --- Stale-clone guard: only the canonical repo may deploy -----------------------
REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
case "$REMOTE_URL" in
*"$EXPECTED_REPO"*) : ;;
*) fail "origin ($REMOTE_URL) is not $EXPECTED_REPO — refusing (stale-clone guard)" ;;
esac

git fetch origin main --quiet || fail "could not fetch origin/main"
MAIN_SHA="$(git rev-parse origin/main)"

# --- Live-stamp poller -----------------------------------------------------------
# poll_stamp <expected-sha> — succeeds once the public build stamp reports the
# expected commit. Cache-busted per request; CF asset TTL does not apply to it.
poll_stamp() {
  local expect="$1" waited=0 body live
  say "Verifying live deploy — polling build stamp for ${expect:0:9} (up to $((VERIFY_TIMEOUT_SECS / 60)) min)..."
  while [ "$waited" -le "$VERIFY_TIMEOUT_SECS" ]; do
    body="$(curl -fsS --max-time 15 "${STAMP_URL}?cb=$(date +%s)$$" 2>/dev/null || true)"
    live="$(printf '%s' "$body" | node -e '
let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
  try{process.stdout.write(JSON.parse(d).commit||"")}catch(e){}
});' 2>/dev/null)"
    # Match when either value is a prefix of the other (stamp may hold a short SHA).
    if [ -n "$live" ] && { [ "${expect#"$live"}" != "$expect" ] || [ "${live#"$expect"}" != "$live" ]; }; then
      say "✓ LIVE — production is serving ${live:0:9} (waited ${waited}s)"
      return 0
    fi
    [ -n "$live" ] && say "  ...live=${live:0:9} expected=${expect:0:9} (${waited}s)"
    sleep "$VERIFY_INTERVAL_SECS"
    waited=$((waited + VERIFY_INTERVAL_SECS))
  done
  say "" >&2
  say "✗ Deploy NOT confirmed live after $((VERIFY_TIMEOUT_SECS / 60)) min." >&2
  say "  Likely a stuck/failed Cloudflare Pages build. Remediation:" >&2
  say "    1. Check the Pages build log in the Cloudflare dashboard." >&2
  say "    2. If the build succeeded but production is frozen, push an empty" >&2
  say "       rebuild commit:   ALLOW_DEPLOY=1 npm run ship -- --rebuild" >&2
  return 1
}

# --- verify mode: read-only ------------------------------------------------------
if [ "$MODE" = "verify" ]; then
  EXPECT="${SHAS[0]:-$MAIN_SHA}"
  EXPECT="$(git rev-parse --verify --quiet "${EXPECT}^{commit}" || echo "$EXPECT")"
  poll_stamp "$EXPECT"
  exit $?
fi

# --- Deploy authorization gate ----------------------------------------------------
if [ "${ALLOW_DEPLOY:-}" != "1" ] && [ "$DRY_RUN" != "1" ]; then
  say "✗ Production deploy blocked: ALLOW_DEPLOY=1 not set." >&2
  say "  This pushes to main, which Cloudflare promotes to eduwonderlab.com." >&2
  say "  Re-run with explicit approval:  ALLOW_DEPLOY=1 npm run ship -- <sha>" >&2
  exit 1
fi

# --- Resolve what to ship -----------------------------------------------------------
if [ "$MODE" = "ship" ]; then
  [ "${#SHAS[@]}" -gt 0 ] || fail "no commits given. Usage: ALLOW_DEPLOY=1 npm run ship -- <sha> [sha...]"
  # Expand any <a>..<b> ranges into individual commits (oldest first).
  EXPANDED=()
  for s in "${SHAS[@]}"; do
    case "$s" in
    *..*)
      while IFS= read -r rc; do EXPANDED+=("$rc"); done \
        < <(git rev-list --reverse --no-merges "$s" 2>/dev/null)
      [ "${#EXPANDED[@]}" -gt 0 ] || fail "range resolves to no commits: $s"
      ;;
    *) EXPANDED+=("$s") ;;
    esac
  done
  RESOLVED=()
  for s in "${EXPANDED[@]}"; do
    r="$(git rev-parse --verify --quiet "${s}^{commit}")" || fail "cannot resolve commit: $s"
    if git merge-base --is-ancestor "$r" "$MAIN_SHA"; then
      say "• ${r:0:9} is already on origin/main — skipping"
    else
      RESOLVED+=("$r")
    fi
  done
  [ "${#RESOLVED[@]}" -gt 0 ] || {
    say "Nothing to ship — all commits already on origin/main."
    exit 0
  }
  say "Shipping ${#RESOLVED[@]} commit(s) onto origin/main (${MAIN_SHA:0:9}):"
  git log --no-walk --format='  %h %s' "${RESOLVED[@]}"
fi

# --- Kill orphan smoke-server (recurring validate:lesson-boot 0/16 failure) --------
ORPHANS="$(lsof -ti tcp:"$SMOKE_PORT" 2>/dev/null || true)"
if [ -n "$ORPHANS" ]; then
  say "• Killing orphan process(es) on port $SMOKE_PORT (stale smoke server): $ORPHANS"
  # shellcheck disable=SC2086
  kill $ORPHANS 2>/dev/null || true
fi

# --- Clean detached worktree at origin/main -----------------------------------------
WT="$ROOT/.claude/worktrees/ship-$(date +%Y%m%d-%H%M%S)-$$"
mkdir -p "$ROOT/.claude/worktrees"
git worktree add --detach "$WT" origin/main --quiet || fail "could not create worktree at origin/main"
KEEP_WT=0
cleanup() {
  if [ "$KEEP_WT" = "1" ]; then
    say "Worktree kept for inspection: $WT"
    say "Remove with: git worktree remove --force '$WT'"
  else
    git worktree remove --force "$WT" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# The pre-push QA loop builds from the worktree root; share node_modules.
[ -d "$ROOT/node_modules" ] && ln -s "$ROOT/node_modules" "$WT/node_modules"

# --- Assemble the deploy commit(s) ----------------------------------------------------
if [ "$MODE" = "rebuild" ]; then
  git -C "$WT" commit --allow-empty -m "chore(deploy): empty rebuild commit to refresh Cloudflare Pages" --quiet ||
    {
      KEEP_WT=1
      fail "empty rebuild commit failed"
    }
else
  for r in "${RESOLVED[@]}"; do
    if ! git -C "$WT" cherry-pick "$r" >/dev/null 2>&1; then
      git -C "$WT" cherry-pick --abort 2>/dev/null || true
      KEEP_WT=0
      fail "cherry-pick of ${r:0:9} conflicts with origin/main. Rebase your branch on origin/main, re-commit, then ship the new SHA."
    fi
    # GH007 guard: GitHub rejects pushes exposing a private author email.
    AUTHOR_EMAIL="$(git -C "$WT" log -1 --format='%ae')"
    case "$AUTHOR_EMAIL" in
    *users.noreply.github.com) : ;;
    *)
      say "• Rewriting private author email ($AUTHOR_EMAIL) → noreply on ${r:0:9}"
      git -C "$WT" commit --amend --no-edit --reset-author --quiet
      ;;
    esac
  done
fi

NEW_SHA="$(git -C "$WT" rev-parse HEAD)"

if [ "$DRY_RUN" = "1" ]; then
  say ""
  say "DRY RUN — assembled ${NEW_SHA:0:9} on top of origin/main; not pushing."
  git -C "$WT" log --oneline "origin/main..HEAD" | sed 's/^/  /'
  exit 0
fi

# --- Push (pre-push hook runs the QA loop; CF Git integration deploys) -----------------
say ""
say "Pushing ${NEW_SHA:0:9} → origin/main (pre-push QA loop runs first)..."
if ! git -C "$WT" push origin HEAD:main; then
  KEEP_WT=1
  fail "push failed (QA loop failure or remote rejection — see output above)"
fi
say "✓ Pushed. Cloudflare Pages is building..."

# --- Verify it actually went live ---------------------------------------------------------
poll_stamp "$NEW_SHA" || exit 1

# Known gotcha: a Cloudflare zone rule serves /assets/* with max-age=14400 (4 h)
# despite _headers saying max-age=0, so STABLE-NAMED files under assets/ can keep
# serving the old bytes at the edge for up to 4 hours after a fresh deploy.
if [ "$MODE" = "ship" ]; then
  ASSET_TOUCHED="$(git log --no-walk --name-only --format= "${RESOLVED[@]}" | grep -c '^assets/' || true)"
  if [ "${ASSET_TOUCHED:-0}" -gt 0 ]; then
    say ""
    say "⚠ $ASSET_TOUCHED file(s) under assets/ shipped. The CF edge caches /assets/*"
    say "  for up to 4 h regardless of _headers. If a change must be visible NOW,"
    say "  reference it with a cache-busting query (?v=...) or verify with ?cb=."
  fi
fi

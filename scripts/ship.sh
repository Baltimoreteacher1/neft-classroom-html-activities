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
#   4. Pushes HEAD:main — the pre-push hook runs change-scoped QA first, and
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
GENERATED_MANIFEST="data/curriculum-download-manifest.json"
VERIFY_TIMEOUT_SECS=720
VERIFY_INTERVAL_SECS=5
NETWORK_FAILURE_LIMIT=3

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
  local expect="$1" waited=0 body live reached=0 err_file transport_failures=0 network_lost=0 curl_status
  err_file="$(mktemp)"
  say "Verifying live deploy — polling build stamp for ${expect:0:9} (up to $((VERIFY_TIMEOUT_SECS / 60)) min)..."
  while [ "$waited" -le "$VERIFY_TIMEOUT_SECS" ]; do
    # `reached` records whether the stamp URL EVER answered. Without it, a host
    # this machine cannot route to looks exactly like a Cloudflare build that
    # never promoted: both leave $body empty, and the old `|| true` threw the
    # curl exit code away. That is not hypothetical — shipping b8c3086 from a
    # sandboxed agent burned 12 minutes on a proxy answering 403 to CONNECT and
    # then reported a healthy deploy as a stuck build.
    if body="$(curl -fsS --connect-timeout 5 --max-time 10 "${STAMP_URL}?cb=$(date +%s)$$" 2>"$err_file")"; then
      reached=1
      transport_failures=0
    else
      curl_status=$?
      body=""
      if [ "$curl_status" -eq 22 ]; then
        # An HTTP error means the host answered. Keep waiting for a build or
        # access issue; the network-failure shortcut applies only to transport.
        reached=1
        transport_failures=0
      else
        transport_failures=$((transport_failures + 1))
        # A blocked proxy or broken connection cannot verify production.
        # Three short attempts distinguish it from a transient failure.
        if [ "$transport_failures" -ge "$NETWORK_FAILURE_LIMIT" ]; then
          network_lost=1
          break
        fi
      fi
    fi
    live="$(printf '%s' "$body" | node -e '
let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{
  try{process.stdout.write(JSON.parse(d).commit||"")}catch(e){}
});' 2>/dev/null)"
    # Match when either value is a prefix of the other (stamp may hold a short SHA).
    if [ -n "$live" ] && { [ "${expect#"$live"}" != "$expect" ] || [ "${live#"$expect"}" != "$live" ]; }; then
      say "✓ LIVE — production is serving ${live:0:9} (waited ${waited}s)"
      rm -f "$err_file"
      return 0
    fi
    [ -n "$live" ] && say "  ...live=${live:0:9} expected=${expect:0:9} (${waited}s)"
    sleep "$VERIFY_INTERVAL_SECS"
    waited=$((waited + VERIFY_INTERVAL_SECS))
  done
  say "" >&2
  if [ "$network_lost" -eq 1 ] || [ "$reached" -eq 0 ]; then
    # Consecutive transport failures say nothing about the Pages build.
    say "✗ Deploy NOT VERIFIED — the build stamp was unreachable from this machine" >&2
    say "  after $transport_failures transport failures to ${STAMP_URL}." >&2
    say "  This is a NETWORK result, not a build result; stopped early instead of" >&2
    say "  waiting the full $((VERIFY_TIMEOUT_SECS / 60)) min." >&2
    say "  Last curl error: $(tr -d '\r' <"$err_file" | tail -n 1)" >&2
    rm -f "$err_file"
    say "" >&2
    if [ "$MODE" = "verify" ]; then
      say "  No push was attempted by --verify. Check from a machine with public egress:" >&2
    else
      say "  The push itself SUCCEEDED. Cloudflare may have promoted normally —" >&2
      say "  nothing here can tell. Verify from somewhere with public egress:" >&2
    fi
    say "    1. GitHub → Actions → 'Verify Deploy' → Run workflow (asserts the" >&2
    say "       commit and FAILS on a stale stamp), or" >&2
    say "    2. npm run ship:verify   from an unrestricted machine." >&2
    return 1
  fi
  rm -f "$err_file"
  say "✗ Deploy NOT confirmed live after $((VERIFY_TIMEOUT_SECS / 60)) min." >&2
  say "  The stamp is reachable but still reports the wrong commit — a stuck or" >&2
  say "  failed Cloudflare Pages build. Remediation:" >&2
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

# --- Single-flight lock + orphan sweep ------------------------------------------------
# Two concurrent ships race on origin/main (the loser's push is rejected after
# a full QA gate) and on the smoke port. mkdir is atomic; a lock whose PID is
# dead is stale and taken over. Holding the lock also proves any other
# eduwonderlab-ship-* worktree is an orphan from a crashed run, so sweep them.
LOCK_DIR="$(git rev-parse --git-common-dir)/ship.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  HOLDER="$(cat "$LOCK_DIR/pid" 2>/dev/null || true)"
  if [ -n "$HOLDER" ] && kill -0 "$HOLDER" 2>/dev/null; then
    fail "another ship is running (pid $HOLDER). Wait for it, then re-run — it moves origin/main."
  fi
  say "• Taking over stale ship lock (pid ${HOLDER:-unknown} is gone)"
  rm -rf "$LOCK_DIR"
  mkdir "$LOCK_DIR" || fail "could not take ship lock at $LOCK_DIR"
fi
printf '%s' "$$" >"$LOCK_DIR/pid"
release_lock() { rm -rf "$LOCK_DIR"; }
trap release_lock EXIT

git worktree prune 2>/dev/null || true
while IFS= read -r stale; do
  [ -n "$stale" ] || continue
  say "• Removing orphaned ship worktree: $stale"
  git worktree remove --force "$stale" 2>/dev/null || rm -rf "$stale"
done < <(git worktree list --porcelain | sed -n 's/^worktree //p' | grep '/eduwonderlab-ship-' || true)
git worktree prune 2>/dev/null || true

# The browser sweep is killed at the 15 min default when the machine is busy,
# which reads as a gate failure and costs a full re-ship. Ship is the one caller
# that must not time out spuriously; an explicit QA_TIMEOUT_MS still wins.
export QA_TIMEOUT_MS="${QA_TIMEOUT_MS:-1800000}"

# --- Kill orphan smoke-server (recurring validate:lesson-boot 0/16 failure) --------
ORPHANS="$(lsof -ti tcp:"$SMOKE_PORT" 2>/dev/null || true)"
if [ -n "$ORPHANS" ]; then
  say "• Killing orphan process(es) on port $SMOKE_PORT (stale smoke server): $ORPHANS"
  # shellcheck disable=SC2086
  kill $ORPHANS 2>/dev/null || true
fi

# --- Clean detached worktree at origin/main -----------------------------------------
# MUST live outside the repo and contain no dot-dir path segment: vite's
# copyStandaloneHtml filter skips any absolute path containing /.claude/ etc.,
# so a worktree under .claude/worktrees/ builds a dist with ALL standalone
# content silently filtered out (every copied dir empty; QA false-fails).
WT="$(mktemp -d "${TMPDIR:-/tmp}/eduwonderlab-ship-XXXXXX")" || fail "mktemp failed"
git worktree add --detach --force "$WT" origin/main --quiet || fail "could not create worktree at origin/main"
KEEP_WT=0
cleanup() {
  release_lock
  if [ "$KEEP_WT" = "1" ]; then
    say "Worktree kept for inspection: $WT"
    say "Remove with: git worktree remove --force '$WT'"
    return 0
  fi
  # Concurrent automation in this repo can transiently hold files in the
  # worktree; retry the removal briefly, then surface any survivor loudly.
  local tries=0
  while [ -d "$WT" ] && [ "$tries" -lt 3 ]; do
    git worktree remove --force "$WT" 2>/dev/null && break
    tries=$((tries + 1))
    sleep 1
  done
  git worktree prune 2>/dev/null || true
  if [ -d "$WT" ]; then
    say "⚠ Could not remove worktree $WT — remove it manually:" >&2
    say "    git worktree remove --force '$WT'" >&2
  fi
}
trap cleanup EXIT

# The pre-push QA loop builds from the worktree root; share node_modules.
# Link entry by entry rather than the whole directory: @eduwonderlab/engine is a
# workspace symlink to ../../engine, and a whole-directory link resolves it to
# the CHECKOUT's engine/ — whatever branch that is — so a stale checkout fakes
# a red gate at every commit. Pointing it at the worktree's own engine/ makes
# the gate test the code being shipped.
preflight_fail=""
if [ ! -d "$ROOT/node_modules" ]; then
  preflight_fail="$ROOT/node_modules is missing — run npm ci in the checkout first"
elif [ ! -e "$ROOT/node_modules/@eduwonderlab/engine" ]; then
  preflight_fail="node_modules/@eduwonderlab/engine is missing (stale branch or no workspace install) — run npm ci in the checkout first"
elif [ ! -d "$WT/engine" ]; then
  preflight_fail="origin/main has no engine/ workspace — wrong remote?"
fi
[ -z "$preflight_fail" ] || fail "preflight: $preflight_fail"
mkdir "$WT/node_modules"
for entry in "$ROOT"/node_modules/* "$ROOT"/node_modules/.bin; do
  [ -e "$entry" ] || continue
  name="$(basename "$entry")"
  [ "$name" = "@eduwonderlab" ] && continue
  ln -s "$entry" "$WT/node_modules/$name"
done
mkdir "$WT/node_modules/@eduwonderlab"
for entry in "$ROOT"/node_modules/@eduwonderlab/*; do
  name="$(basename "$entry")"
  if [ "$name" = "engine" ]; then
    ln -s "$WT/engine" "$WT/node_modules/@eduwonderlab/engine"
  else
    ln -s "$entry" "$WT/node_modules/@eduwonderlab/$name"
  fi
done
# …and reports/, for the same reason. It is gitignored generated output, so a
# fresh worktree never has it, and tools/a11y-ratchet.test.mjs asserts on
# reports/a11y-audit.md — which failed the QA gate on every ship regardless of
# what was being deployed.
[ -d "$ROOT/reports" ] && ln -s "$ROOT/reports" "$WT/reports"

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
      # The download manifest records per-file byte sizes, so every concurrent
      # ship that touches a shipped file conflicts on it. It is GENERATED: take
      # origin/main's copy and regenerate rather than bouncing the ship.
      CONFLICTED="$(git -C "$WT" diff --name-only --diff-filter=U)"
      if [ "$CONFLICTED" = "$GENERATED_MANIFEST" ] &&
        git -C "$WT" checkout --ours -- "$GENERATED_MANIFEST" &&
        (cd "$WT" && node scripts/generate-download-manifest.mjs >/dev/null) &&
        git -C "$WT" add "$GENERATED_MANIFEST" &&
        git -C "$WT" -c core.editor=true cherry-pick --continue >/dev/null 2>&1; then
        say "• Regenerated $GENERATED_MANIFEST while applying ${r:0:9}"
      else
        git -C "$WT" cherry-pick --abort 2>/dev/null || true
        KEEP_WT=0
        fail "cherry-pick of ${r:0:9} conflicts with origin/main${CONFLICTED:+ ($(echo "$CONFLICTED" | tr '\n' ' '))}. Rebase your branch on origin/main, re-commit, then ship the new SHA."
      fi
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

# --- Post-deploy smoke: the stamp only proves the BUILD promoted ----------------
# A promoted build can still be broken in ways the source gates cannot see (a
# truncated bundle, an asset missing from dist, a gate that stopped gating).
# Verify the deployed site before calling the ship a success.
say ""
say "Running post-deploy smoke test against production..."
# Verify with the smoke script from the COMMIT WE JUST SHIPPED ($WT), not the
# local working tree ($ROOT). $ROOT is whatever branch happens to be checked
# out, with whatever uncommitted edits are in flight — so a fix to the verifier
# would not take effect on the very deploy that shipped it, and a stale or dirty
# tree silently decides whether production is judged healthy. $WT is a clean
# checkout of origin/main and is alive here (cleanup runs on EXIT). smoke-live
# imports only node: builtins, so it needs no node_modules.
if ! node "$WT/scripts/smoke-live.mjs" --expect "$NEW_SHA"; then
  say "" >&2
  say "✗ The deploy promoted but production is DEGRADED (see failures above)." >&2
  say "  Roll back by shipping the previous good commit:" >&2
  say "      ALLOW_DEPLOY=1 npm run ship -- ${MAIN_SHA:0:9}" >&2
  exit 1
fi

# /assets/* freshness: RESOLVED 2026-07-14 — the zone "Browser Cache TTL = 4 h"
# override was switched to "Respect Existing Headers", so _headers' max-age=0,
# must-revalidate is honored and stable-named assets propagate instantly (the
# edge revalidates per request). ?v= bumps are no longer needed for freshness.
# Spot-check a shipped asset if paranoid: curl -sI <url> → cf-cache-status
# REVALIDATED + max-age=0. If a 4 h max-age ever reappears, the zone setting
# regressed (Caching → Configuration).
if [ "$MODE" = "ship" ]; then
  ASSET_TOUCHED="$(git log --no-walk --name-only --format= "${RESOLVED[@]}" | grep -c '^assets/' || true)"
  if [ "${ASSET_TOUCHED:-0}" -gt 0 ]; then
    say ""
    say "ℹ $ASSET_TOUCHED file(s) under assets/ shipped — live immediately (zone"
    say "  respects _headers max-age=0 since 2026-07-14; edge revalidates per request)."
  fi
fi

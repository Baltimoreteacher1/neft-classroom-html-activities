#!/usr/bin/env bash
#
# deploy.sh — safe one-command deploy for neft-classroom-html-activities.
#
# Cloudflare Pages auto-builds and publishes whenever `main` is pushed, so
# "deploying" just means safely getting your commit onto origin/main WITHOUT
# clobbering whatever another agent pushed in the meantime.
#
# Usage:
#   ./deploy.sh                 # commit your work first, then run this
#   NEFT_AGENT=joel ./deploy.sh # identify yourself to the ownership guard
#
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"
LIVE_URL="https://neft-classroom-html-activities.pages.dev/"

say() { printf '\n\033[1;36m==>\033[0m %s\n' "$*"; }
die() {
	printf '\n\033[1;31mABORT:\033[0m %s\n' "$*" >&2
	exit 1
}

# 0) Ownership guard — refuse if someone else owns this repo right now.
GUARD="/Users/joelneft/neft-repo-guard/neft-repo-guard"
if [ -f "$GUARD" ] && command -v node >/dev/null 2>&1; then
	node "$GUARD" "$REPO_DIR" --agent "${NEFT_AGENT:-me}" ||
		die "Repo guard says STOP — another agent owns this repo. Coordinate first."
fi

# 1) Everything must be committed before we touch main.
if [ -n "$(git status --porcelain)" ]; then
	git status --short
	die "You have uncommitted changes. Commit them first:
       git add -A && git commit -m 'what changed'"
fi

BRANCH="$(git branch --show-current)"
say "Deploying work from branch: ${BRANCH:-<detached>}"

# 2) Pull in whatever already landed on main (other agents/people).
say "Fetching latest origin/main…"
git fetch origin main

# 3) Fold the latest main + your branch together on main.
git checkout main
git merge --ff-only origin/main 2>/dev/null || git merge --no-edit origin/main ||
	die "Could not merge origin/main cleanly. Resolve conflicts, commit, re-run."

if [ "$BRANCH" != "main" ] && [ -n "$BRANCH" ]; then
	say "Merging your branch '$BRANCH' into main…"
	git merge --no-edit "$BRANCH" ||
		die "Merge conflict with your branch. Resolve, commit, then re-run ./deploy.sh"
fi

# 4) Push — this is what triggers the Cloudflare Pages build.
say "Pushing to origin/main (this triggers the deploy)…"
if ! git push origin main; then
	die "Push rejected — someone pushed in between. Re-run ./deploy.sh (it will re-merge)."
fi

say "Pushed. Cloudflare Pages is building now."
printf '   Live in ~1-3 min: %s\n' "$LIVE_URL"
printf '   Build status: Cloudflare dashboard -> Pages -> neft-classroom-html-activities -> Deployments\n'

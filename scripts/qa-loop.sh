#!/usr/bin/env bash
# qa-loop.sh — conservative local QA sequence for the EduWonderLab / Neft Teacher repo.
#
# Runs the safe local checks that actually exist in package.json (detected, not
# assumed), prints PASS / SKIP / FAIL per check, writes a timestamped log to
# .qa-logs/, and exits non-zero if any AVAILABLE check fails.
#
# It NEVER deploys, commits, pushes, or mutates content. Only build/validate/
# audit/lint/test/format-style scripts are run; generators and `deploy` are
# deliberately excluded.
set -uo pipefail

# --- Locate repo root ---------------------------------------------------------
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || {
	echo "Cannot cd to repo root"
	exit 1
}

LOG_DIR="$ROOT/.qa-logs"
mkdir -p "$LOG_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG="$LOG_DIR/qa-$STAMP.log"

# Echo to both console and log.
say() { echo "$@" | tee -a "$LOG"; }

say "==============================================================="
say "EduWonderLab QA Loop — $STAMP"
say "Repo: $ROOT"
say "==============================================================="

# --- Git context (read-only) --------------------------------------------------
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '(unknown)')"
say "Branch: $BRANCH"
DIRTY_COUNT="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
say "Working tree: $DIRTY_COUNT changed file(s)"
if [ "$DIRTY_COUNT" != "0" ]; then
	say "Changed files (first 20):"
	git status --porcelain 2>/dev/null | head -20 | sed 's/^/  /' | tee -a "$LOG"
fi
say ""

# --- Ensure dependencies are present ------------------------------------------
if [ ! -d "node_modules" ]; then
	say "node_modules missing — running 'npm install' (no audit/fund)..."
	npm install --no-audit --no-fund >>"$LOG" 2>&1 || say "WARN: npm install reported issues (see log)"
fi

# --- Detect available scripts from package.json -------------------------------
AVAILABLE="$(node -e "try{const s=require('./package.json').scripts||{};console.log(Object.keys(s).join('\n'))}catch(e){}" 2>/dev/null)"
has_script() { printf '%s\n' "$AVAILABLE" | grep -Fxq "$1"; }

say "Detected scripts: $(printf '%s' "$AVAILABLE" | tr '\n' ' ')"
say ""

# --- Ordered, SAFE candidate checks ------------------------------------------
# Only build/validate/audit/lint/test/format scripts. Generators and 'deploy'
# are intentionally NOT in this list. Names that don't exist are skipped cleanly.
CANDIDATES=(
	build
	lint
	test
	validate
	validate:static
	validate:reveal-math
	validate:homework
	validate:practice
	audit
	audit:curriculum
	audit:homework
	audit:links
	audit:routes
	audit:content
	audit:format
	format
	prettier
)

PASS=()
SKIP=()
FAIL=()

run_check() {
	local name="$1"
	if ! has_script "$name"; then
		say "SKIP  npm run $name  (not available)"
		SKIP+=("$name")
		return 0
	fi
	say "RUN   npm run $name ..."
	if npm run "$name" >>"$LOG" 2>&1; then
		say "PASS  npm run $name"
		PASS+=("$name")
	else
		say "FAIL  npm run $name  (see $LOG)"
		FAIL+=("$name")
	fi
}

for c in "${CANDIDATES[@]}"; do
	run_check "$c"
done

# --- Summary ------------------------------------------------------------------
say ""
say "---------------------------------------------------------------"
say "QA Loop summary"
say "  PASS (${#PASS[@]}): ${PASS[*]:-none}"
say "  SKIP (${#SKIP[@]}): ${SKIP[*]:-none}"
say "  FAIL (${#FAIL[@]}): ${FAIL[*]:-none}"
say "  Log: $LOG"
say "---------------------------------------------------------------"

if [ "${#FAIL[@]}" -gt 0 ]; then
	say "STATUS: FAIL — fix the smallest safe issue, then re-run 'npm run qa:loop'."
	exit 1
fi

if [ "${#PASS[@]}" -eq 0 ]; then
	say "STATUS: PARTIAL — no checks were available to run."
	exit 0
fi

say "STATUS: PASS — all available checks passed. (No deploy, commit, or push performed.)"
exit 0

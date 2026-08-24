#!/usr/bin/env bash
# health.sh — is this repo sound RIGHT NOW, without touching anything?
#
# Every check below was measured to write nothing: not the git tree, not
# reports/, not .qa-logs/. Two obvious candidates are deliberately absent —
# audit:dead-code and audit:duplicates both refresh files under reports/, and
# audit:duplicates alone costs 15s of the budget.
#
# This is NOT the deploy gate. `npm run qa:loop` (89 checks, ~80s, builds) is
# what stands between you and production. This answers a different question:
# "before I start, is anything already broken?" — in about six seconds.
#
#   npm run health            # all 18
#   npm run health -- --list  # names only
set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

CHECKS=(
  validate:secrets              # 7 detectors over 8.3k tracked text files
  validate:data-contracts       # generated data files match their contracts
  validate:ccss                 # 37 distinct standards resolve
  validate:scope                # scope & sequence across 84 lessons
  validate:nervous-system       # 42 standards, 48 prerequisite edges
  validate:unit-placement       # 93 unit-level placements
  validate:curriculum-links     # 252 hub lesson links
  validate:lesson-catalogues    # 3 hub catalogues stay in step
  validate:teacher-reachability # teacher destinations still reachable
  validate:course               # every quiz answer key
  validate:math                 # arithmetic in authored content
  validate:graph                # deploy graph edges
  validate:shared-claims        # shared components claim what they deliver
  validate:auth-contract        # 27 auth checks
  validate:determinism          # Command Center status is reproducible
  validate:printables-fresh     # 84 printables match their lessons
  validate:gate-coverage        # no validator is dark
  audit:links                   # 30k internal links resolve
)

if [[ "${1:-}" == "--list" ]]; then printf '%s\n' "${CHECKS[@]}"; exit 0; fi

pass=0; fail=0; failed=()
start=$SECONDS
for c in "${CHECKS[@]}"; do
  t0=$SECONDS
  if out=$(npm run "$c" --silent 2>&1); then
    printf '  \033[32m✓\033[0m %-30s %2ss\n' "$c" "$((SECONDS - t0))"
    pass=$((pass + 1))
  else
    printf '  \033[31m✗\033[0m %-30s %2ss\n' "$c" "$((SECONDS - t0))"
    echo "$out" | tail -4 | sed 's/^/        /'
    failed+=("$c"); fail=$((fail + 1))
  fi
done

echo
echo "health: $pass/${#CHECKS[@]} passed in $((SECONDS - start))s — nothing was written"
if (( fail )); then
  echo "failing: ${failed[*]}"
  echo "Re-run one with:  npm run <name>"
  exit 1
fi

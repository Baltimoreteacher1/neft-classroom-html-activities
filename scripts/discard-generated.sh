#!/usr/bin/env bash
# discard-generated.sh — revert ONLY generator-owned files, never hand-written work.
#
# Why this exists: `git checkout -- tools/` and `-- lessons/` have both reverted
# in-progress hand edits while cleaning up generator churn (2026-08-04, twice).
# Generated and hand-written files share directories in this repo, so the only
# safe discard is an explicit allowlist of paths the generators own.
#
# Usage:
#   npm run discard:generated          # show what would be reverted (dry run)
#   npm run discard:generated -- --do  # actually revert
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

# Paths owned end-to-end by a generator. Keep in sync with:
#   tools/generate-catchup-lessons.mjs      -> lessons/*-catchup/{config.json,lesson.js}, tools/catchup-rows.json
#   tools/generate-small-group-lessons.mjs  -> lessons/*-group{1,2}/{config.json,lesson.js}, tools/small-group-rows.json,
#                                              functions/teacher-small-group/_facilitation-data.js
#   vocab-hub build-bank.mjs                -> vocab-hub/vocab-bank.json
GENERATED_GLOBS=(
  "lessons/*-catchup/config.json"
  "lessons/*-catchup/lesson.js"
  "lessons/*-group1/config.json"
  "lessons/*-group1/lesson.js"
  "lessons/*-group2/config.json"
  "lessons/*-group2/lesson.js"
  "tools/catchup-rows.json"
  "tools/small-group-rows.json"
  "functions/teacher-small-group/_facilitation-data.js"
  "vocab-hub/vocab-bank.json"
)

mapfile -t targets < <(git diff --name-only -- "${GENERATED_GLOBS[@]}")
mapfile -t other < <(git diff --name-only | grep -vxF -f <(printf '%s\n' "${targets[@]:-}") || true)

if [ ${#targets[@]} -eq 0 ]; then
  echo "No modified generator-owned files. Nothing to discard."
  exit 0
fi

echo "Generator-owned files with changes (would revert):"
printf '  %s\n' "${targets[@]}"
if [ ${#other[@]} -gt 0 ]; then
  echo "Leaving untouched (not generator-owned):"
  printf '  %s\n' "${other[@]}"
fi

if [ "${1:-}" != "--do" ]; then
  echo
  echo "Dry run. Re-run with:  npm run discard:generated -- --do"
  exit 0
fi

git checkout -- "${targets[@]}"
echo "Reverted ${#targets[@]} generator-owned file(s)."

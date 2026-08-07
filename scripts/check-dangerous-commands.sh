#!/usr/bin/env bash
# check-dangerous-commands.sh
# Detects clearly dangerous shell commands for the EduWonderLab / Neft Teacher
# repo and exits non-zero with a clear message when one is found.
#
# Usage:
#   scripts/check-dangerous-commands.sh "git push --force origin main"
#   echo "wrangler deploy" | scripts/check-dangerous-commands.sh
#
# Exit codes:
#   0  -> command looks safe
#   2  -> command is blocked (dangerous)
#
# This is intentionally conservative: it only blocks patterns that are almost
# always destructive or that bypass the Cloudflare Git-integration deploy flow.
set -uo pipefail

# Read the command from args, or from stdin if no args were passed.
if [ "$#" -gt 0 ]; then
  CMD="$*"
else
  CMD="$(cat 2>/dev/null || true)"
fi

# Nothing to check.
[ -z "${CMD// /}" ] && exit 0

block() {
  echo "BLOCKED by check-dangerous-commands.sh:" >&2
  echo "  command: ${CMD}" >&2
  echo "  reason : $1" >&2
  echo "  This repo deploys via Cloudflare Git integration on push to main." >&2
  echo "  Ask Joel explicitly before running this." >&2
  exit 2
}

# --- Manual Cloudflare / Wrangler deploys (must use Git integration instead) ---
if printf '%s' "$CMD" | grep -Eiq '(^|[^[:alnum:]_])(npx[[:space:]]+)?wrangler[[:space:]]+(pages[[:space:]]+)?deploy'; then
  block "manual Wrangler/Cloudflare deploy — deploy happens automatically on push to main"
fi
if printf '%s' "$CMD" | grep -Eiq '(^|[^[:alnum:]_])npm[[:space:]]+run[[:space:]]+deploy([^:a-z]|$)'; then
  block "'npm run deploy' invokes Wrangler manually — use the Git-integration deploy"
fi

# --- Destructive / history-rewriting git ---
if printf '%s' "$CMD" | grep -Eiq 'git[[:space:]]+push[[:space:]].*(--force([^-]|$)|-f([^a-z]|$)|--force-with-lease)'; then
  block "force push rewrites remote history"
fi
if printf '%s' "$CMD" | grep -Eiq 'git[[:space:]]+reset[[:space:]]+--hard'; then
  block "'git reset --hard' discards working-tree changes irreversibly"
fi
if printf '%s' "$CMD" | grep -Eiq 'git[[:space:]]+clean[[:space:]]+-[a-z]*d[a-z]*f|git[[:space:]]+clean[[:space:]]+-[a-z]*f[a-z]*d'; then
  block "'git clean -fd' deletes untracked files/folders irreversibly"
fi

# --- Ref deletion, by every spelling ---
# `git branch -D` is denied in settings.json, but a deny list is a list of
# spellings, not of effects: `git update-ref -d refs/heads/x` deletes the same
# branch and walked straight past it (done here on 2026-08-06). These are regex,
# not globs, so they also catch the forms a glob cannot express — notably the
# colon refspec `git push origin :branch`, which deletes a REMOTE branch.
if printf '%s' "$CMD" | grep -Eiq 'git[[:space:]]+(-C[[:space:]]+[^[:space:]]+[[:space:]]+)?update-ref[[:space:]]+(-d|--stdin)'; then
  block "'git update-ref -d' deletes a ref outright — same effect as 'git branch -D'"
fi
# Case-SENSITIVE on purpose: `-D` force-deletes and must be blocked, while `-d`
# is the safe variant that refuses to drop unmerged commits and stays allowed.
# Under `grep -i` the two are indistinguishable and ordinary cleanup gets blocked.
if printf '%s' "$CMD" | grep -Eq 'git[[:space:]]+branch[[:space:]]+(-[a-zA-Z]*D|--delete[[:space:]]+--force|--force[[:space:]]+--delete)'; then
  block "force branch deletion discards unmerged commits"
fi
if printf '%s' "$CMD" | grep -Eiq 'git[[:space:]]+push[[:space:]].*(--delete([^-]|$)|[[:space:]]-d[[:space:]]|[[:space:]]:[^[:space:]]+)'; then
  block "deletes a REMOTE branch — irreversible for anyone who has not fetched it"
fi
if printf '%s' "$CMD" | grep -Eiq 'git[[:space:]]+reflog[[:space:]]+(expire|delete)'; then
  block "expiring the reflog destroys the only recovery path for deleted refs"
fi
if printf '%s' "$CMD" | grep -Eiq 'git[[:space:]]+filter-branch|git[[:space:]]+filter-repo'; then
  block "history rewrite across the whole repository"
fi
if printf '%s' "$CMD" | grep -Eiq 'rm[[:space:]]+(-[a-z]+[[:space:]]+)*[^[:space:]]*\.git(/|[[:space:]]|$)'; then
  block "deleting inside .git destroys refs, history, or the repository itself"
fi

# --- Recursive deletes of protected top-level content ---
if printf '%s' "$CMD" | grep -Eiq 'rm[[:space:]]+(-[a-z]*[rf][a-z]*[[:space:]]+)+.*(public|src|app|pages|curriculum|lessons|activities|assets|dashboard|directory)([/[:space:]]|$)'; then
  block "recursive delete targeting protected site/content folders"
fi
# Any obvious lesson-folder deletion (e.g. rm -rf lessons/3-2, lessons/*).
if printf '%s' "$CMD" | grep -Eiq 'rm[[:space:]]+(-[a-z]*[rf][a-z]*[[:space:]]+)+.*lessons/'; then
  block "deletion of a lesson folder"
fi
# Catch-all: rm -rf on a root-ish path.
if printf '%s' "$CMD" | grep -Eiq 'rm[[:space:]]+(-[a-z]*[rf][a-z]*[[:space:]]+)+(/|\./|\*|~)'; then
  block "broad recursive delete (rm -rf on root / wildcard / home)"
fi

exit 0

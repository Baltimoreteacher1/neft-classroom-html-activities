#!/usr/bin/env bash
# PreToolUse(Bash) guard.
#
# `.claude/settings.json` has wired this since 2026-08-06, but the script was
# never committed — CLAUDE.md's own caveat records why (`.claude/` sat in
# `.git/info/exclude`, so the wiring was tracked and the script was not). The
# result is the exact failure that section warns about: a hook pointing at a
# missing script does not announce itself, it simply never runs, so a fresh
# clone documents a Bash guard that is not guarding anything.
#
# Contract, per CLAUDE.md:
#   stdin : the PreToolUse JSON payload, {"tool_input":{"command":"…"}}
#   exit 0: allow
#   exit 2: block (the reason goes to stderr, which Claude Code shows)
#
# Verify by running it, never by reading the config:
#   echo '{"tool_input":{"command":"wrangler deploy"}}' | bash .claude/hooks/pre-bash-guard.sh
#   echo $?   # 2
#
# All policy lives in scripts/check-dangerous-commands.sh, which is tracked and
# pinned by scripts/check-dangerous-commands.test.mjs — both what must block and
# what must stay allowed. This file only unwraps the payload and delegates, so
# there is one blocklist rather than two that can disagree.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
CHECKER="$ROOT/scripts/check-dangerous-commands.sh"

PAYLOAD="$(cat 2>/dev/null || true)"
[ -z "${PAYLOAD// /}" ] && exit 0

# Pull .tool_input.command out of the payload. jq when present; otherwise a
# small node fallback, since node is a hard dependency of this repo anyway.
if command -v jq >/dev/null 2>&1; then
  CMD="$(printf '%s' "$PAYLOAD" | jq -r '.tool_input.command // empty' 2>/dev/null || true)"
else
  CMD="$(printf '%s' "$PAYLOAD" | node -e '
    let s = "";
    process.stdin.on("data", (d) => (s += d));
    process.stdin.on("end", () => {
      try { process.stdout.write(JSON.parse(s)?.tool_input?.command ?? ""); } catch { /* not JSON: allow */ }
    });
  ' 2>/dev/null || true)"
fi

# No command found — a payload shape we do not understand must not silently
# block every Bash call.
[ -z "${CMD// /}" ] && exit 0

# Missing checker is a broken install, not a licence to run anything. Fail
# closed and say so, rather than repeating the "hook that never runs" bug.
if [ ! -f "$CHECKER" ]; then
  echo "pre-bash-guard.sh: cannot find $CHECKER — refusing to run unchecked." >&2
  exit 2
fi

bash "$CHECKER" "$CMD"
exit $?

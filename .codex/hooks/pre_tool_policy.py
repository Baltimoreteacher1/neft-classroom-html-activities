#!/usr/bin/env python3
"""Warn or block risky tool commands before execution."""
from __future__ import annotations

import json
import re
import sys


def load_input() -> dict:
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def command_from(data: dict) -> str:
    tool_input = data.get("tool_input") or {}
    if isinstance(tool_input, dict):
        return str(tool_input.get("command") or tool_input.get("cmd") or tool_input)
    return str(tool_input)


def block(reason: str) -> None:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": reason,
        }
    }))


def warn(message: str) -> None:
    print(json.dumps({"systemMessage": message}))


def main() -> None:
    command = re.sub(r"\s+", " ", command_from(load_input()).strip())
    blockers = [
        (r"\brm\s+-rf\s+(/|\$HOME|~|\.|\.git|\*)", "Blocked destructive rm -rf pattern."),
        (r"\bgit\s+(reset\s+--hard|clean\s+-fdx|push\s+--force|push\s+-f)\b", "Blocked destructive or history-rewriting Git command."),
        (r"\b(chmod|chown)\b[^;&|]*\s(/|~|\$HOME)\b", "Blocked broad permission change outside the repo."),
        (r"\b(cat|printenv|env|set)\b[^;&|]*(SECRET|TOKEN|PASSWORD|KEY|AUTH|CREDENTIAL)", "Blocked command that may print secrets."),
        (r"\bcurl\b[^|;&]*\|\s*(sh|bash)\b|\bwget\b[^|;&]*\|\s*(sh|bash)\b", "Blocked curl/wget pipe-to-shell installer."),
        (r"\b(npm\s+run\s+deploy|wrangler\s+(deploy|pages\s+deploy)|firebase\s+deploy|vercel\s+deploy|netlify\s+deploy)\b", "Blocked production deployment command. `npm run deploy`, `wrangler pages deploy`, and `--branch=main` require explicit current-task approval and the repo guard `ALLOW_DEPLOY=1 npm run deploy`. Do not deploy from a PR/feature branch unless explicitly approved."),
    ]
    for pattern, reason in blockers:
        if re.search(pattern, command, flags=re.IGNORECASE):
            block(reason)
            return

    warnings = []
    if re.search(r"\b(npm|pnpm|yarn)\s+(install|add|remove|update|upgrade)\b", command):
        warnings.append("Dependency command detected. Do not install/change dependencies unless explicitly approved.")
    if re.search(r"\bwrangler\b", command) and not re.search(r"\b(wrangler\s+--version|wrangler\s+pages\s+dev|wrangler\s+dev)\b", command):
        warnings.append("Wrangler command detected. Confirm it is read-only or locally safe; never deploy without explicit request.")
    if re.search(r"(^|[ >])(/Users/joelneft/(?!neft-classroom-html-activities)|~/(?!neft-classroom-html-activities))", command):
        warnings.append("Command appears to touch outside this repo. Confirm necessity and avoid private files.")
    if warnings:
        warn(" ".join(warnings))


if __name__ == "__main__":
    main()

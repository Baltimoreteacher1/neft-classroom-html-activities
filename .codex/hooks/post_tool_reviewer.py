#!/usr/bin/env python3
"""Summarize likely next action when tool output contains failure signals."""
from __future__ import annotations

import json
import re
import sys


def load_input() -> dict:
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def response_text(data: dict) -> str:
    response = data.get("tool_response")
    if isinstance(response, str):
        return response
    return json.dumps(response, ensure_ascii=False)[:24000]


def main() -> None:
    output = response_text(load_input())
    checks = [
        (r"Traceback \(most recent call last\)", "Python traceback detected; inspect the first repo file in the stack and rerun the narrow command."),
        (r"(npm ERR!|ELIFECYCLE|Command failed)", "npm command failed; capture the first error block and avoid reinstalling unless approved."),
        (r"(Type error|TS\d{4}|tsc .*error)", "TypeScript failure detected; fix the referenced file and rerun the relevant check."),
        (r"(ESLint|lint).*error", "Lint failure detected; fix the reported rule violation and rerun lint if available."),
        (r"(No such file or directory|ENOENT|not found)", "Missing file/path detected; verify paths from the repo root and Vite output assumptions."),
        (r"(Module not found|Cannot find module)", "Missing module detected; inspect imports/package scripts before changing dependencies."),
        (r"(Build failed|failed to build|ERROR in|Error: Build)", "Build failure detected; fix the first build error and rerun npm run build."),
        (r"(Tests? failed|FAIL\b|AssertionError)", "Test/validation failure detected; preserve the failing assertion and make a targeted fix."),
        (r"(permission denied|EACCES|EPERM)", "Permission error detected; do not chmod broadly; inspect ownership/path assumptions."),
        (r"(deploy failed|wrangler .*failed|Cloudflare.*error)", "Deployment failure detected; do not retry deployment blindly; produce a deploy safety summary."),
    ]
    for pattern, message in checks:
        if re.search(pattern, output, flags=re.IGNORECASE):
            print(json.dumps({
                "hookSpecificOutput": {
                    "hookEventName": "PostToolUse",
                    "additionalContext": message,
                }
            }))
            return


if __name__ == "__main__":
    main()

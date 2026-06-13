#!/usr/bin/env python3
"""Request one continuation when final QA appears incomplete."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path.cwd()


def load_input() -> dict:
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def changed_files() -> list[str]:
    try:
        result = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT, text=True, capture_output=True, timeout=4)
    except Exception:
        return []
    if result.returncode != 0:
        return []
    return [line[3:] for line in result.stdout.splitlines() if line]


def main() -> None:
    data = load_input()
    if data.get("stop_hook_active"):
        print(json.dumps({}))
        return

    last = str(data.get("last_assistant_message") or "")
    files = changed_files()
    needs = []

    if files and not re.search(r"\b(Verified|Verification Results|codex-verify\.sh|npm run validate|npm run build|lint|typecheck|test)\b", last):
        needs.append("files appear changed but no verification command is reported")
    if any(re.search(r"\.(html|css|js|mjs)$", f) and not f.startswith(".codex/") for f in files) and not re.search(r"\b(accessibility|student-facing|UI)\b", last, re.I):
        needs.append("student-facing code changes need an accessibility/content note")
    if any(f in {"wrangler.toml", "_redirects", "_headers", "vite.config.js"} or f.startswith("functions/") for f in files) and not re.search(r"\b(deploy|Cloudflare|route|build output)\b", last, re.I):
        needs.append("deployment-related changes need a deploy safety summary")
    if re.search(r"\b(failed|error|Traceback|TS\d{4}|npm ERR!)\b", last, re.I) and "Notes / Risks" not in last:
        needs.append("failure signals need explicit Notes / Risks")

    if needs:
        print(json.dumps({
            "decision": "block",
            "reason": "Before final response, continue with QA: " + "; ".join(needs) + ". Avoid repeating this if already addressed.",
        }))
    else:
        print(json.dumps({}))


if __name__ == "__main__":
    main()

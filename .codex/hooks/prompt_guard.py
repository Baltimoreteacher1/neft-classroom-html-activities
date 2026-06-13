#!/usr/bin/env python3
"""Add safety and education-quality reminders for incoming prompts."""
from __future__ import annotations

import json
import re
import sys


def load_input() -> dict:
    try:
        return json.load(sys.stdin)
    except Exception:
        return {}


def main() -> None:
    prompt = str(load_input().get("prompt", ""))
    lower = prompt.lower()
    reminders: list[str] = []

    risky = {
        "destructive": r"\b(rm\s+-rf|delete everything|wipe|nuke|reset --hard|clean -fdx)\b",
        "secrets": r"\b(api key|secret|token|password|credential|\.env|wrangler secret)\b",
        "global bypass": r"\b(danger-full-access|bypass approvals|disable sandbox|never ask approval)\b",
        "deployment": r"\b(deploy|publish to cloudflare|wrangler deploy|pages deploy|production)\b",
        "dependency changes": r"\b(npm install|npm add|npm update|pnpm add|yarn add)\b",
    }
    hits = [label for label, pattern in risky.items() if re.search(pattern, lower)]
    if hits:
        reminders.append(
            "Policy reminder: prompt mentions "
            + ", ".join(hits)
            + ". Inspect first; avoid destructive/global/secret/deploy/dependency actions unless explicitly requested and report approvals needed."
        )

    education_terms = r"\b(activity|student|classroom|math|esol|wida|twr|lesson|curriculum|worksheet|quiz|scaffold|sentence frame|spanish|accessibility|teacher)\b"
    if re.search(education_terms, lower):
        reminders.append(
            "Education reminder: apply student-facing accessibility, WIDA/ESOL/TWR scaffolds, clear directions, readable fonts, high contrast, privacy, and no hidden answer keys."
        )

    if reminders:
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": " ".join(reminders),
            }
        }))


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Print concise, non-secret EduWonderLab repo context for Codex sessions."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path


ROOT = Path.cwd()


def run(args: list[str]) -> str:
    try:
        result = subprocess.run(args, cwd=ROOT, text=True, capture_output=True, timeout=4)
    except Exception:
        return "unavailable"
    if result.returncode != 0:
        return "unavailable"
    return result.stdout.strip()[:1600] or "none"


def main() -> None:
    pkg = ROOT / "package.json"
    stack = "Vite + mostly static HTML + Cloudflare Pages" if pkg.exists() else "unknown; inspect repo files"
    activity_hubs = [
        name for name in [
            "math", "lessons", "unit-5", "expressions-equations", "statistics-data",
            "esol-reading-writing", "wida-access", "teacher-tools"
        ] if (ROOT / name).exists()
    ]
    message = (
        f"Repo context: {stack}. Key hubs: {', '.join(activity_hubs) or 'not detected'}. "
        "Use scripts/codex/codex-preflight.sh and scripts/codex/codex-verify.sh. "
        "Must follow AGENTS.md: preserve routes, no deploy without explicit request, no dependency installs without approval, "
        "no secrets, protect student privacy, and apply accessibility/WIDA/TWR quality standards. "
        f"Git status: {run(['git', 'status', '--short', '--branch'])}."
    )
    print(json.dumps({"systemMessage": message}))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        print(json.dumps({"systemMessage": "Session context hook failed softly; continue with AGENTS.md."}))

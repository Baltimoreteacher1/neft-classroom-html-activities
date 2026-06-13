#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 1

failures=0

run_step() {
  local label="$1"
  shift
  echo
  echo "==> $label"
  if "$@"; then
    echo "PASS: $label"
  else
    local code=$?
    echo "FAIL: $label (exit $code)"
    failures=$((failures + 1))
  fi
}

run_npm_script_if_present() {
  local script="$1"
  [[ -f package.json ]] || return 0
  command -v node >/dev/null 2>&1 || { echo "SKIP: $script requires node"; return 0; }
  if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['$script'] ? 0 : 1)" 2>/dev/null; then
    run_step "npm run $script" npm run "$script"
  else
    echo "SKIP: npm run $script is not defined"
  fi
}

static_repo_check() {
  python3 - <<'PY'
from __future__ import annotations

import html.parser
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

root = Path.cwd()
errors: list[str] = []
warnings: list[str] = []
skip_parts = {".git", "node_modules", "dist", ".wrangler", ".claude", ".serena", ".codex"}

class LinkParser(html.parser.HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: list[tuple[str, str]] = []
        self.title = ""
        self._in_title = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = dict(attrs)
        if tag == "title":
            self._in_title = True
        for attr in ("href", "src"):
            value = values.get(attr)
            if value:
                self.refs.append((attr, value))

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self._in_title = False

    def handle_data(self, data: str) -> None:
        if self._in_title:
            self.title += data.strip()

def included(path: Path) -> bool:
    return not any(part in skip_parts for part in path.parts)

html_files = sorted(p for p in root.rglob("*.html") if p.is_file() and included(p.relative_to(root)))
if not html_files:
    errors.append("No HTML files found.")

for required in ("index.html", "vite.config.js", "wrangler.toml"):
    if not (root / required).exists():
        errors.append(f"Missing expected repo file: {required}")

pkg = root / "package.json"
if pkg.exists():
    data = json.loads(pkg.read_text(encoding="utf-8"))
    scripts = data.get("scripts", {})
    for script in ("validate", "build"):
        if script not in scripts:
            errors.append(f"package.json missing script: {script}")

for page in html_files:
    rel = page.relative_to(root)
    text = page.read_text(encoding="utf-8", errors="ignore")
    parser = LinkParser()
    parser.feed(text)
    if rel == Path("index.html") and not parser.title:
        warnings.append("Root index.html has no <title> text.")
    if re.search(r"\b(lorem ipsum|todo:|placeholder)\b", text, flags=re.I):
        warnings.append(f"Placeholder/TODO marker found in {rel}")
    for attr, ref in parser.refs:
        parsed = urlparse(ref)
        if parsed.scheme in {"http", "https", "mailto", "tel", "data", "javascript"} or ref.startswith("#"):
            continue
        clean = unquote(parsed.path)
        if not clean:
            continue
        target = (root / clean.lstrip("/")) if clean.startswith("/") else (page.parent / clean)
        if clean.endswith("/"):
            target = target / "index.html"
        if not target.exists():
            errors.append(f"Broken local {attr} in {rel} -> {ref}")

if errors:
    print("Static repo check failed:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

if warnings:
    print("Static repo warnings:")
    for warning in warnings[:80]:
        print(f"- {warning}")
    if len(warnings) > 80:
        print(f"- ... {len(warnings) - 80} more warning(s)")

print(f"Checked {len(html_files)} HTML file(s); local links/assets and core repo files look valid.")
PY
}

if command -v python3 >/dev/null 2>&1; then
  run_step "static local link and repo structure checks" static_repo_check
else
  echo "SKIP: static checks require python3"
fi

run_npm_script_if_present validate
run_npm_script_if_present build

echo
if [[ "$failures" -eq 0 ]]; then
  echo "Codex verification passed."
else
  echo "Codex verification failed with $failures failing step(s)."
fi
exit "$failures"

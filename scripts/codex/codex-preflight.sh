#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT" || exit 1

echo "Codex preflight for: $ROOT"
echo

echo "Stack:"
[[ -f package.json ]] && echo "- npm package project"
[[ -f vite.config.js || -f vite.config.ts ]] && echo "- Vite build"
[[ -f wrangler.toml || -f wrangler.json || -f wrangler.jsonc ]] && echo "- Cloudflare config"
[[ -d functions ]] && echo "- Cloudflare Pages Functions"
[[ -d engine ]] && echo "- shared student activity engine"
[[ -d lessons ]] && echo "- generated Reveal Math lessons"
find tools -maxdepth 3 -name '*.gs' -print >/tmp/codex-gs-files.$$ 2>/dev/null || true
if [[ -s /tmp/codex-gs-files.$$ ]]; then
  echo "- Apps Script tools"
fi
rm -f /tmp/codex-gs-files.$$

echo
echo "Package manager:"
if [[ -f package-lock.json ]]; then echo "- npm"; elif [[ -f pnpm-lock.yaml ]]; then echo "- pnpm"; elif [[ -f yarn.lock ]]; then echo "- yarn"; else echo "- npm assumed from package.json"; fi

echo
echo "Git status:"
git status --short --branch 2>/dev/null || echo "- not a Git repository"

echo
echo "Command availability:"
for cmd in node npm npx python3 wrangler rg; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "- $cmd: $(command -v "$cmd")"
  else
    echo "- $cmd: unavailable"
  fi
done

echo
echo "Package scripts:"
if [[ -f package.json ]] && command -v node >/dev/null 2>&1; then
  node -e 'const p=require("./package.json"); for (const [k,v] of Object.entries(p.scripts||{})) console.log(`- ${k}: ${v}`);' 2>/dev/null || true
else
  echo "- unavailable"
fi

echo
echo "Recommended safe validation:"
echo "- scripts/codex/codex-verify.sh"
[[ -f package.json ]] && echo "- npm run validate"
[[ -f package.json ]] && echo "- npm run build"
echo "- Never run npm run deploy unless deployment was explicitly requested."

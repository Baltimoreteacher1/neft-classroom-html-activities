#!/usr/bin/env node
/**
 * CI gate: reject duplicate keys in .github/workflows/*.yml.
 *
 * GitHub Actions refuses to run a workflow whose YAML contains a duplicate
 * mapping key. It does not warn — the run is created and dies instantly, and
 * the UI labels it by FILE PATH instead of the workflow's `name:`, which reads
 * like an ordinary red check rather than "this file never parsed".
 *
 * That is exactly how `codex-verify.yml` sat dead for 16 days: commit aa0a0aad0
 * (2026-07-12) added a second `concurrency:` block, so from that day Codex
 * Verify never ran again and simply emitted a failing run on every push. Its
 * green/red signal was meaningless and nobody noticed.
 *
 * Ordinary YAML parsers cannot catch this: most (PyYAML's safe_load, js-yaml's
 * default) accept duplicate keys and silently keep the last one, so the file
 * looks fine locally while GitHub rejects it. Hence a purpose-built scanner.
 *
 * No YAML dependency: this checks one specific structural property, and pulling
 * a parser in for it would add a dependency to the deploy path for no gain.
 *
 * Run: npm run validate:workflow-yaml   (part of `npm run validate`)
 */
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const WORKFLOW_DIR = join(process.cwd(), ".github", "workflows");

/** Strip a trailing unquoted comment; leave `#` inside quotes alone. */
function stripComment(line) {
  let q = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) {
      if (c === q) q = null;
    } else if (c === '"' || c === "'") {
      q = c;
    } else if (c === "#" && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i);
    }
  }
  return line;
}

// `key:`, `"quoted key":`, `- key:` — the colon must end the line or be
// followed by whitespace, so `run: echo a:b` and `image: node:22` are values,
// not keys.
const KEY_RE = /^(\s*)(-\s+)?("[^"]*"|'[^']*'|[^\s#"'][^:]*?)\s*:(\s|$)/;
// Block scalar header: `key: |`, `key: >-`, `key: |2+`, etc. Everything more
// indented than the key belongs to the scalar and is TEXT, never keys. The
// Claude prompt in predeploy-verify.yml is full of lines like `OUTPUT:` and
// `HARD RULES (non-negotiable):` that a naive scanner would read as duplicates.
const BLOCK_SCALAR_RE = /:\s*[|>][+-]?\d*\s*$/;

/**
 * Return duplicate-key findings for one workflow file.
 * Each mapping level keeps its own key set, keyed by indent column.
 */
export function findDuplicateKeys(text) {
  const lines = text.split(/\r?\n/);
  const findings = [];
  /** @type {{indent:number, keys:Map<string,number>}[]} */
  const stack = [];
  let skipBelowIndent = null; // inside a block scalar

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (!raw.trim()) continue;

    const rawIndent = raw.length - raw.trimStart().length;

    if (skipBelowIndent !== null) {
      if (rawIndent > skipBelowIndent) continue; // still inside the scalar
      skipBelowIndent = null;
    }

    const line = stripComment(raw);
    if (!line.trim()) continue;

    const m = KEY_RE.exec(line);
    if (!m) continue;

    const [, lead, dash, rawKey] = m;
    // A `- ` list marker opens a NEW mapping, so its keys start a fresh scope
    // and the effective indent is the column after the dash.
    const indent = lead.length + (dash ? dash.length : 0);
    const key = rawKey.replace(/^["']|["']$/g, "");

    if (dash) {
      // Drop any scope at or deeper than this item — each item is its own map.
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
      stack.push({ indent, keys: new Map() });
    } else {
      while (stack.length && stack[stack.length - 1].indent > indent) stack.pop();
      if (!stack.length || stack[stack.length - 1].indent < indent) {
        stack.push({ indent, keys: new Map() });
      }
    }

    const scope = stack[stack.length - 1];
    if (scope.keys.has(key)) {
      findings.push({ key, line: i + 1, firstLine: scope.keys.get(key), indent });
    } else {
      scope.keys.set(key, i + 1);
    }

    if (BLOCK_SCALAR_RE.test(line)) skipBelowIndent = indent;
  }
  return findings;
}

/* ------------------------------------------------------------------ runner */

/**
 * True when this file was invoked directly. Compares REALPATHS deliberately:
 * the naive `import.meta.url === \`file://${process.argv[1]}\`` silently fails
 * whenever the script is invoked by an absolute path through a symlinked
 * prefix — on macOS `/var` is a symlink to `/private/var`, so import.meta.url
 * resolves to /private/var/... while argv[1] stays /var/..., the guard is
 * false, and the checker exits 0 having checked nothing. A gate that passes by
 * doing nothing is the failure mode this whole file exists to prevent.
 */
function invokedDirectly() {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  if (!existsSync(WORKFLOW_DIR)) {
    console.log("validate:workflow-yaml — no .github/workflows directory, nothing to check.");
    process.exit(0);
  }

  const files = readdirSync(WORKFLOW_DIR)
    .filter((f) => f.endsWith(".yml") || f.endsWith(".yaml"))
    .sort();

  let bad = 0;
  for (const f of files) {
    const rel = `.github/workflows/${f}`;
    const findings = findDuplicateKeys(readFileSync(join(WORKFLOW_DIR, f), "utf8"));
    if (!findings.length) continue;
    bad++;
    for (const d of findings) {
      console.error(
        `✗ ${rel}:${d.line} duplicate key \`${d.key}\` (already set at line ${d.firstLine}).`,
      );
    }
  }

  if (bad) {
    console.error("");
    console.error(
      `✗ validate:workflow-yaml — ${bad} workflow file(s) have duplicate keys. GitHub will\n` +
        "  REFUSE to run them: the run is created, fails instantly, and is labelled by file\n" +
        "  path instead of workflow name. Remove the duplicate before pushing.",
    );
    process.exit(1);
  }

  console.log(`✓ Workflow YAML: no duplicate keys in ${files.length} file(s).`);
}

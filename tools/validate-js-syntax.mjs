#!/usr/bin/env node
import { execFileSync } from "node:child_process";
/**
 * validate-js-syntax — parse every shipped .js/.mjs file and every inline
 * <script> block in every .html page, and fail on any SyntaxError.
 *
 * Why this exists: on 2026-07-27 `assets/game-fx.js` was live in production
 * with a SyntaxError (a function truncated mid-body during a refactor, losing
 * three closing braces). Because the whole file is one IIFE, nothing in it ran
 * — the FX kit was dead across ~114 games — and the only reason it surfaced
 * was that `validate:lesson-boot` happens to probe /math/games/. That smoke
 * test renders 16 pages; it cannot speak for the other ~2,600. A parse error
 * is cheap to detect and always a bug, so gate on it directly.
 *
 * Deliberately syntax-only. It does not lint, execute, or resolve imports —
 * `npm run lint` (Biome) covers style/correctness, and this must stay fast
 * enough to sit inside `npm run validate` on every push.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { assertNonEmpty } from "./lib/non-empty.mjs";
import { assertSweptEnough } from "./lib/sweep-guard.mjs";

const SELF = fileURLToPath(import.meta.url);
if (typeof vm.SourceTextModule !== "function") {
  let code = 0;
  try {
    execFileSync(
      process.execPath,
      ["--experimental-vm-modules", "--no-warnings", SELF, ...process.argv.slice(2)],
      { stdio: "inherit" },
    );
  } catch (e) {
    code = typeof e.status === "number" ? e.status : 1;
  }
  process.exit(code);
}

const HERE = path.dirname(SELF);
const ROOT = path.join(HERE, "..");

// dist/ is build output (checked at source), node_modules is vendor code.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".playwright-mcp",
  ".qa-logs",
  "canvas-packages",
]);

// Vendored third-party bundles: not ours to fix, and some ship exotic syntax.
const SKIP_FILE =
  /(?:\.min\.js$|\/vendor\/|\/vendored\/|phaser|minisearch|three(?:\.module)?\.js$)/i;

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name.startsWith(".") && e.name !== ".well-known") continue;
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const isEsm = (src) => /^\s*(?:import|export)\s/m.test(src);

/** Parse classic script or ES module `src` in-process; null when fine, else a short message. */
function parseError(src, { esm }) {
  try {
    if (esm) {
      new vm.SourceTextModule(src);
    } else {
      new vm.Script(src);
    }
    return null;
  } catch (e) {
    return String(e.message || "parse error")
      .split("\n")[0]
      .trim()
      .slice(0, 120);
  }
}

/** Check every item in-process; failures come back in item order. */
function checkAll(items) {
  return items.flatMap((item) => {
    const err = parseError(item.src, { esm: item.esm });
    return err ? [`${item.label}: ${err}`] : [];
  });
}

const files = walk(ROOT);
assertNonEmpty(
  "shipped script files",
  files,
  "walk(ROOT) found no .js/.mjs — the walker or its ignore list broke; a zero sweep parses nothing and still says every script parses.",
  100,
);
assertSweptEnough(
  "validate:js-syntax",
  files,
  "Discovery for validate:js-syntax returned far fewer items than this gate's pinned floor — see data/sweep-floors.json.",
);

const items = [];
let jsCount = 0;
let htmlCount = 0;
let inlineCount = 0;

for (const abs of files) {
  const rel = path.relative(ROOT, abs);
  if (SKIP_FILE.test("/" + rel)) continue;

  if (/\.(?:js|mjs)$/.test(rel)) {
    jsCount++;
    const src = fs.readFileSync(abs, "utf8");
    items.push({ label: rel, src, esm: rel.endsWith(".mjs") || isEsm(src) });
    continue;
  }

  if (!rel.endsWith(".html")) continue;
  htmlCount++;
  const html = fs.readFileSync(abs, "utf8");
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m;
  let n = 0;
  while ((m = re.exec(html))) {
    const attrs = m[1] || "";
    const body = m[2] || "";
    n++;
    if (/\bsrc\s*=/.test(attrs)) continue; // external, checked on its own
    const type = (attrs.match(/type\s*=\s*["']([^"']+)["']/) || [])[1] || "";
    // Skip data blocks and templating payloads — they are not JavaScript.
    if (type && !/javascript|module/i.test(type)) continue;
    if (!body.trim()) continue;
    inlineCount++;
    items.push({
      label: `${rel} [inline script #${n}]`,
      src: body,
      esm: /module/i.test(type) || isEsm(body),
    });
  }
}

const failures = checkAll(items);

console.log(
  `JS syntax validation — ${jsCount} script file(s), ${inlineCount} inline block(s) across ${htmlCount} page(s)`,
);

if (failures.length) {
  console.error(`\nRESULT: FAIL ❌ — ${failures.length} file(s) will not parse:\n`);
  for (const f of failures) console.error("  " + f);
  console.error(
    "\nA parse error means the whole file never executes. If it is an IIFE," +
      "\nevery feature inside it is silently dead. Fix before shipping.",
  );
  process.exit(1);
}

console.log("RESULT: PASS ✅ (every shipped script parses)");

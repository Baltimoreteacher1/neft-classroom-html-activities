#!/usr/bin/env node
/* =============================================================================
 * language-page-ai-cards.test.mjs — every route that calls a model has a row in docs/language-page/ai-model-cards.md, and
 * the row's "served on thelanguagepage.com" answer matches what functions/_lib/language-page.js really does.
 *
 * WHY. A reading of functions/ on 2026-11-25 found model-calling routes that PLATFORM.md's AI list never named, and the
 * privacy page's promises depend on that list being complete. A list kept by hand drifts; this discovers the routes from the
 * code and fails when one is missing. It also refuses a card that says a route is served here when the host redirects it
 * away (or the reverse): the cards are what a district reviewer reads.
 * ========================================================================== */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { languagePageRoute } from "../functions/_lib/language-page.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const DOC = "docs/language-page/ai-model-cards.md";

/** A file that calls a model provider or the shared model client. */
export const MODEL_CALL =
  /api\.anthropic\.com|generativelanguage|api\.openai\.com|OPENAI_API_KEY|ANTHROPIC_API_KEY|env\.AI\b|\.AI\.run\(|callModel\(/;
/** The shared client itself is infrastructure, not a route. */
const INFRASTRUCTURE = new Set(["functions/_lib/model-call.js"]);

export function discoverModelFiles(dir = join(ROOT, "functions"), out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) discoverModelFiles(p, out);
    else if (name.endsWith(".js") && !/\.test\./.test(name)) {
      const rel = relative(ROOT, p);
      if (!INFRASTRUCTURE.has(rel) && MODEL_CALL.test(readFileSync(p, "utf8"))) out.push(rel);
    }
  }
  return out.sort();
}

/** Rows of the route table: { route, source, served }. */
export function parseTable(md) {
  return [...md.matchAll(/^\| `(\/api\/[^`]+)` \| `([^`]+)` \| (yes|no) \|$/gm)].map((m) => ({
    route: m[1],
    source: m[2],
    served: m[3] === "yes",
  }));
}

// ---- self-tests
{
  const rows = parseTable(
    "| `/api/x` | `functions/api/x.js` | yes |\n| `/api/y/` | `functions/api/y/[[path]].js` | no |\n| junk |",
  );
  assert.deepEqual(rows, [
    { route: "/api/x", source: "functions/api/x.js", served: true },
    { route: "/api/y/", source: "functions/api/y/[[path]].js", served: false },
  ]);
  assert.ok(
    MODEL_CALL.test("await callModel(env, {})") &&
      MODEL_CALL.test("env.ANTHROPIC_API_KEY") &&
      !MODEL_CALL.test("fetch('/api/x')"),
  );
}

const files = discoverModelFiles();
assert.ok(
  files.length >= 9,
  `found only ${files.length} model-calling files: has the discovery pattern broken?`,
);
const rows = parseTable(readFileSync(join(ROOT, DOC), "utf8"));
assert.ok(rows.length >= 15, `the route table in ${DOC} parsed only ${rows.length} rows`);

const problems = [];
const covered = new Set(rows.map((r) => r.source));
for (const f of files)
  if (!covered.has(f)) problems.push(`${f} calls a model but has no row in ${DOC}`);
for (const r of rows) {
  if (!existsSync(join(ROOT, r.source)))
    problems.push(`${r.route}: source ${r.source} does not exist`);
  const kind = languagePageRoute(new URL(`https://thelanguagepage.com${r.route}`))?.kind;
  const served = kind === "serve";
  if (served !== r.served)
    problems.push(
      `${r.route}: the table says served=${r.served ? "yes" : "no"} but the host answers "${kind}"`,
    );
}
if (problems.length) {
  console.error("language-page-ai-cards: FAIL");
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log(
  `language-page-ai-cards: PASS (${files.length} model-calling files all documented; ${rows.length} routes, hosting checked against the host code)`,
);

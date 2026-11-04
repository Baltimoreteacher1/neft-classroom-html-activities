#!/usr/bin/env node
/* =============================================================================
 * validate-all-resources.mjs — gate for /curriculum/all-resources/
 * -----------------------------------------------------------------------------
 * The directory exists so no resource depends on knowing its old URL. A gate for
 * it therefore has to prove COVERAGE, not just that the page renders:
 *
 *   1. Every file the surface owns exists.
 *   2. tools.json is current (a new /curriculum/<tool>/ page cannot go unlisted).
 *   3. The page script flattens EVERY manifest resource — row count equals the
 *      manifest's, none lacks a url, and every type group has an icon in the sprite.
 *   4. The stylesheet stays scoped, light-only, and free of pictographs; the page
 *      and script carry none either (one SVG icon family, no decorative emoji).
 *   5. The hub links here, so the directory is reachable from the front door.
 *
 * Detectors are self-tested against known-bad fixtures before the real files are
 * read, so a check that has stopped firing cannot report a clean surface.
 * ========================================================================== */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");
const PICTOGRAPH = /\p{Extended_Pictographic}/u;
const SCOPE = /(^|[\s,>+~(])(\.ar\b|body\.ar-page|\.skip-link)/;

/** Split a selector list on commas that are not inside :is(...) / :not(...). */
function splitTopLevel(list) {
  const parts = [];
  let depth = 0;
  let cur = "";
  for (const ch of list) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  parts.push(cur.trim());
  return parts.filter(Boolean);
}

/** Selectors (one per comma part) that sit outside the .ar scope. */
export function unscopedSelectors(css) {
  const out = [];
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const [, prelude] of stripped.matchAll(/([^{}]+)\{/g)) {
    const head = prelude.trim();
    if (head.startsWith("@") || /^(from|to|\d+%)/.test(head)) continue;
    for (const sel of splitTopLevel(head)) {
      if (sel && !SCOPE.test(sel)) out.push(sel);
    }
  }
  return out;
}

/** Type groups with no `<symbol id="i-<group>">` in the sprite. */
export function missingIcons(groups, html) {
  return groups.filter((g) => !html.includes(`id="i-${g}"`));
}

/* --- self-tests: each detector must fire on a known-bad fixture -------------- */
const selfFail = [];
if (!unscopedSelectors("a {\n}\n.ar a {\n}").includes("a"))
  selfFail.push("unscopedSelectors missed a bare selector");
if (unscopedSelectors(".ar .x,\n.skip-link:focus-visible {\n}\n@media (x) {\n}").length)
  selfFail.push("unscopedSelectors flagged a scoped selector list");
if (!missingIcons(["slides", "nope"], '<symbol id="i-slides">').includes("nope"))
  selfFail.push("missingIcons missed an absent icon");
if (!PICTOGRAPH.test("Family 👪")) selfFail.push("pictograph detector does not fire");
if (selfFail.length) {
  console.error(`validate-all-resources self-test FAILED:\n  ${selfFail.join("\n  ")}`);
  process.exit(1);
}

const failures = [];
const fail = (m) => failures.push(m);
const check = (cond, m) => {
  if (!cond) fail(m);
};

/* --- 1. Owned files present and non-trivial -------------------------------- */
const OWNED_FILES = [
  "curriculum/all-resources/index.html",
  "curriculum/all-resources/all-resources.css",
  "curriculum/all-resources/all-resources.js",
  "curriculum/all-resources/tools.json",
  "scripts/generate-all-resources-tools.mjs",
  "tools/validate-all-resources.mjs",
];
const files = new Map();
for (const rel of OWNED_FILES) {
  try {
    const body = read(rel);
    check(body.length > 200, `${rel} is only ${body.length} bytes — possible clobber or stub`);
    files.set(rel, body);
  } catch {
    fail(`missing owned file: ${rel}`);
  }
}
if (failures.length) {
  console.error(`validate-all-resources FAILED:\n  ✗ ${failures.join("\n  ✗ ")}`);
  process.exit(1);
}
const html = files.get("curriculum/all-resources/index.html");
const css = files.get("curriculum/all-resources/all-resources.css");
const js = files.get("curriculum/all-resources/all-resources.js");

/* --- 2. tools.json is current ---------------------------------------------- */
const gen = spawnSync(process.execPath, ["scripts/generate-all-resources-tools.mjs", "--check"], {
  cwd: ROOT,
  encoding: "utf8",
});
check(gen.status === 0, `tools.json is stale: ${(gen.stderr || gen.stdout).trim()}`);
const tools = JSON.parse(files.get("curriculum/all-resources/tools.json"));
check(tools.tools.length >= 50, `tools.json lists only ${tools.tools.length} tools`);
for (const t of tools.tools)
  check(
    t.title && t.url?.startsWith("/curriculum/"),
    `tools.json entry without title/url: ${JSON.stringify(t).slice(0, 80)}`,
  );

/* --- 3. The page script flattens every manifest resource -------------------- */
const manifest = JSON.parse(read("data/curriculum-download-manifest.json"));
const expected = manifest.units.reduce(
  (n, u) =>
    n + (u.resources?.length ?? 0) + u.lessons.reduce((m, l) => m + (l.resources?.length ?? 0), 0),
  0,
);
const { flatten } = await import(
  pathToFileURL(join(ROOT, "curriculum/all-resources/all-resources.js")).href
);
const rows = flatten(manifest);
check(
  rows.length === expected,
  `page lists ${rows.length} resources; the manifest holds ${expected}`,
);
check(!rows.some((r) => !r.url), "a flattened resource has no url");
check(!rows.some((r) => !r.name), "a flattened resource has no name");
const missing = missingIcons(
  manifest.groups.map((g) => g.id),
  html,
);
check(!missing.length, `sprite has no icon for type group(s): ${missing.join(", ")}`);

/* --- 4. Stylesheet scoped; light-only; no pictographs ----------------------- */
for (const sel of unscopedSelectors(css)) fail(`unscoped selector "${sel}" in all-resources.css`);
for (const [rel, body] of files) {
  check(
    !/prefers-color-scheme\s*:\s*dark/.test(body),
    `${rel} emits a dark-mode block; this is a light-only site`,
  );
  check(
    !/\bESOL\b/.test(body),
    `${rel} uses the discouraged label; say "support" or "Level 1" instead`,
  );
}
for (const [rel, body] of [
  ["index.html", html],
  ["all-resources.css", css],
  ["all-resources.js", js],
]) {
  check(
    !PICTOGRAPH.test(body.replace(/\\p\{Extended_Pictographic\}/g, "")),
    `${rel} contains a pictograph; use the SVG icon family`,
  );
}
check(
  !/\son[a-z]+=/.test(html),
  "index.html has an inline on* handler; wire listeners in all-resources.js",
);

/* --- 5. Reachable from the hub ---------------------------------------------- */
check(
  read("curriculum/index.html").includes('href="/curriculum/all-resources/"'),
  "curriculum/index.html does not link to /curriculum/all-resources/",
);

/* -------------------------------------------------------------------------- */
if (failures.length) {
  console.error("validate-all-resources FAILED:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `✓ /curriculum/all-resources/ passed: ${rows.length} resources + ${tools.tools.length} tools covered, ${OWNED_FILES.length} owned files.`,
);

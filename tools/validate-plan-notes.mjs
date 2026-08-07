#!/usr/bin/env node
/* =============================================================================
 * validate-plan-notes.mjs — gate for /curriculum/plan-notes/
 * -----------------------------------------------------------------------------
 * Scaffolded by scripts/new-surface.mjs, then extended with the invariants this
 * surface actually promises. Wired into `npm run validate`, so it gates every
 * deploy.
 *
 * The generic checks (owned files present, scripts parse, stylesheet scoped,
 * light-only, no discouraged label) are the classes that have broken surfaces
 * in this repo before. The surface-specific ones below are the two promises
 * Plan Notes makes that, if broken, would not show up as an error anywhere:
 *
 *   A. TAGS STAY MACHINE-READABLE. Every structured field validates against
 *      functions/_lib/plan-vocab.js, which is generated from the four data
 *      sources. If that module goes stale, the API silently starts rejecting a
 *      misconception tag that exists, or accepting one that was removed — and
 *      the only symptom is a note that will not save.
 *
 *   B. NOTES ARE NEVER SILENTLY DROPPED. A note whose quote no longer matches
 *      the document must land in the unpinned tray. If relocation ever starts
 *      returning nothing for a miss, notes disappear and nobody finds out until
 *      a teacher goes looking for one that is gone.
 * ========================================================================== */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const OWNED_FILES = [
  "curriculum/plan-notes/index.html",
  "curriculum/plan-notes/plan-notes.css",
  "curriculum/plan-notes/plan-notes.js",
  "curriculum/plan-notes/plan-extract.js",
  "curriculum/plan-notes/plan-render.js",
  "curriculum/plan-notes/plan-store.js",
  "functions/_lib/plan-notes-validate.js",
  "functions/_lib/plan-vocab.js",
  "functions/api/plan-notes/[[path]].js",
  "tools/validate-plan-notes.mjs",
];

const failures = [];
const fail = (m) => failures.push(m);
const check = (cond, m) => {
  if (!cond) fail(m);
};

/* --- 1. Owned files present and non-trivial -------------------------------- */
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
  console.error(`validate-plan-notes: ${failures.join("\n  ")}`);
  process.exit(1);
}

const html = files.get("curriculum/plan-notes/index.html");
const css = files.get("curriculum/plan-notes/plan-notes.css");
const js = files.get("curriculum/plan-notes/plan-notes.js");
const api = files.get("functions/api/plan-notes/[[path]].js");
const validateLib = files.get("functions/_lib/plan-notes-validate.js");
const render = files.get("curriculum/plan-notes/plan-render.js");
const store = files.get("curriculum/plan-notes/plan-store.js");

/* --- 2. Scripts parse; inline handlers resolve ------------------------------ */
for (const [i, block] of [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].entries()) {
  const src = block[1].trim();
  if (!src) continue;
  try {
    new Function(src);
  } catch (e) {
    fail(`inline <script> #${i + 1} in index.html does not parse: ${e.message}`);
  }
}

const defined = new Set([...js.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
for (const m of html.matchAll(/\son[a-z]+="([A-Za-z_$][\w$]*)\s*\(/g)) {
  check(defined.has(m[1]), `inline handler calls ${m[1]}(), which plan-notes.js does not define`);
}

/* --- 3. Stylesheet stays scoped -------------------------------------------- */
for (const line of css.split("\n")) {
  const sel = line.match(/^\s*([a-z][\w-]*)\s*(?:,|\{)/);
  if (sel && !["from", "to"].includes(sel[1])) {
    fail(`unscoped selector "${sel[1]}" in plan-notes.css — it must live under .plan-notes-wrap`);
  }
}

/* --- 4 & 5. Light-only, and the label ------------------------------------- */
for (const [rel, body] of files) {
  check(
    !/prefers-color-scheme\s*:\s*dark/.test(body),
    `${rel} emits a dark-mode block; this is a light-only site`,
  );
  // Two legitimate appearances, and only two. The API prompt names the label in
  // order to forbid the model from using it. And plan-vocab.js is GENERATED from
  // data/catalog.json, which still carries two legacy activity titles using it —
  // those are the catalog's to fix (renaming them would break live routes), not
  // this surface's, and mirroring them here is not this surface saying it.
  const offenders = [...body.matchAll(/\bESOL\b/g)];
  const allowed =
    (rel.endsWith("[[path]].js") && /NEVER use the word/.test(body)) ||
    rel === "functions/_lib/plan-vocab.js";
  check(
    offenders.length === 0 || allowed,
    `${rel} uses the discouraged label; say "support" or "Level 1" instead`,
  );
}

/* --- A. The controlled vocabulary is current and enforced ------------------ */
try {
  execFileSync("node", [join(ROOT, "scripts/generate-plan-vocab.mjs"), "--check"], {
    cwd: ROOT,
    stdio: "pipe",
  });
} catch {
  fail(
    "functions/_lib/plan-vocab.js is stale — run `npm run generate-plan-vocab`. " +
      "A stale vocabulary silently rejects tags that exist.",
  );
}

check(
  /from "\.\.\/\.\.\/_lib\/plan-notes-validate\.js"/.test(api),
  "the API no longer imports validateNote — every note field would be written unvalidated",
);
check(
  /validateNote\(candidate\)/.test(api),
  "AI-drafted notes no longer run through validateNote — the model could invent tags",
);
for (const field of ["MISCONCEPTION_IDS", "STANDARD_IDS", "ACTIVITY_PATHS", "LESSON_IDS"]) {
  check(
    validateLib.includes(field),
    `plan-notes-validate.js no longer checks against ${field} — that field became free text`,
  );
}

/* The five kinds are a contract between the validator, the editor and the rail.
 * A kind added in one place and not the others is a note that cannot be written
 * or cannot be displayed. */
const KINDS = ["timing", "watch-for", "swap", "resource", "note"];
for (const kind of KINDS) {
  check(validateLib.includes(`"${kind}"`), `plan-notes-validate.js dropped the "${kind}" kind`);
  check(
    render.includes(`"${kind}"`) || render.includes(`${kind}:`),
    `plan-render.js cannot render the "${kind}" kind`,
  );
  check(html.includes(`value="${kind}"`), `the editor has no option for the "${kind}" kind`);
}

/* --- B. Notes are never silently dropped ---------------------------------- */
check(
  /unpinned/.test(render) && /relocateAll/.test(render),
  "plan-render.js no longer resolves notes to an unpinned state — a note whose quote " +
    "stopped matching would simply disappear",
);
check(
  /OUTBOX|outbox/.test(store),
  "plan-store.js lost its offline outbox — a note written on classroom wifi could be lost",
);
check(
  /addEventListener\("online"/.test(store),
  "plan-store.js no longer flushes on reconnect — queued notes would sit unsent",
);
check(
  /deleted_at/.test(api),
  "the API no longer soft-deletes notes — a misclick would destroy one",
);

/* -------------------------------------------------------------------------- */
if (failures.length) {
  console.error("validate-plan-notes FAILED:");
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log(
  `✓ /curriculum/plan-notes/ lock passed (${OWNED_FILES.length} owned files, vocabulary current).`,
);

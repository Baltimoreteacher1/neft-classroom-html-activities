#!/usr/bin/env node
/**
 * Find data fields no code reads.
 *
 * These pages carry their content in a big object literal — GROUPS, ITEMS,
 * LESSONS — which the page's own JS renders. When a page is reframed, fields
 * stop being rendered but stay in the literal, still reading like live copy.
 * Nothing marks them dead.
 *
 * That is not cosmetic. fix-it-design-challenge#2 edited GROUPS.ai_problem
 * and GROUPS.starter_fix believing teachers would see the change. No JS had
 * read either field for months. The edit was invisible in the browser and the
 * author had no way to know.
 *
 * This walks a page's data literal and reports every key that is never read.
 * A key counts as read if the file mentions it as a property access, a
 * bracket index, or a destructure — deliberately generous, because a false
 * "this is dead" is far more expensive than a missed dead field.
 *
 *   node tools/graph/check-dead-data.mjs                 # the configured pages
 *   node tools/graph/check-dead-data.mjs path.html NAME  # ad hoc
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

/* Pages whose content lives in a literal, and the literal's name. Add a page
   here when its copy moves into JS — that is the moment this can start
   lying to an author. */
const WATCHED = [{ file: "fix-it-design-challenge/index.html", literal: "GROUPS" }];

/** Pull the balanced [...] or {...} that follows `const NAME =`. */
function extractLiteral(source, name) {
  const start = source.search(new RegExp(`\\bconst\\s+${name}\\s*=\\s*[[{]`));
  if (start === -1) return null;
  const open =
    source.search(new RegExp(`\\bconst\\s+${name}\\s*=\\s*`)) +
    source.slice(start).match(new RegExp(`\\bconst\\s+${name}\\s*=\\s*`))[0].length;

  const openChar = source[open];
  const closeChar = openChar === "[" ? "]" : "}";
  let depth = 0;
  let inString = null;
  for (let i = open; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") inString = ch;
    else if (ch === openChar) depth++;
    else if (ch === closeChar && --depth === 0) {
      return { body: source.slice(open, i + 1), start: open, end: i + 1 };
    }
  }
  return null;
}

/** Top-level keys of the objects inside the literal. */
function keysIn(body) {
  const keys = new Set();
  let depth = 0;
  let inString = null;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }
    if (ch === "{" || ch === "[") {
      depth++;
      continue;
    }
    if (ch === "}" || ch === "]") {
      depth--;
      continue;
    }
    // Object entries sit at depth 2 inside `[ { ... } ]`, depth 1 inside `{ ... }`.
    if (depth <= 2) {
      const rest = body.slice(i);
      const m = rest.match(/^([A-Za-z_$][\w$]*)\s*:/);
      if (m && /[\s,{]/.test(body[i - 1] ?? "{")) {
        keys.add(m[1]);
        i += m[0].length - 1;
      }
    }
  }
  return keys;
}

/* Known-dead fields are a standing debt, printed every run. The check fails
   only on fields NOT in the baseline, so the count can fall but never quietly
   rise — the way a new check gets adopted without a flag day. */
const BASELINE =
  JSON.parse(
    readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "deploy-graph.json"), "utf8"),
  ).deadDataBaseline ?? {};

let newlyDead = 0;
const targets = process.argv[2]
  ? [{ file: process.argv[2], literal: process.argv[3] || "GROUPS" }]
  : WATCHED;

for (const { file, literal } of targets) {
  const source = readFileSync(resolve(ROOT, file), "utf8");
  const found = extractLiteral(source, literal);
  if (!found) {
    console.error(`✗ ${file}: no \`const ${literal} = \` literal found`);
    process.exit(1);
  }

  // Everything except the literal itself is where a read could live.
  const elsewhere = source.slice(0, found.start) + source.slice(found.end);
  const keys = [...keysIn(found.body)].sort();
  const dead = keys.filter((key) => {
    const read = new RegExp(
      // .key      ["key"] / ['key']      { key } destructure
      `\\.${key}\\b|\\[\\s*["'\`]${key}["'\`]\\s*\\]|\\{[^{}]*\\b${key}\\b[^{}]*\\}\\s*=`,
    );
    return !read.test(elsewhere);
  });

  console.log(`${file} — ${literal}: ${keys.length} keys, ${keys.length - dead.length} read`);
  if (!dead.length) {
    console.log("   ✓ every field is read by the page\n");
    continue;
  }

  const entries = (found.body.match(/(?:^|[\s,{])id\s*:/g) || []).length || 1;
  const known = new Set(BASELINE[file]?.[literal] ?? []);
  const fresh = dead.filter((key) => !known.has(key));
  const carried = dead.filter((key) => known.has(key));

  if (carried.length) {
    console.log(`   · ${carried.length} known-dead field(s), ×${entries} entries — standing debt:`);
    for (const key of carried) console.log(`       ${key}`);
  }
  if (fresh.length) {
    newlyDead += fresh.length;
    console.log(`   ✗ ${fresh.length} NEWLY dead field(s), ×${entries} entries:`);
    for (const key of fresh) console.log(`       ${key}`);
  }

  // Baseline entries for fields that are now read (or gone) should not linger.
  const stale = [...known].filter((key) => !dead.includes(key));
  if (stale.length) {
    console.log(`   · ${stale.length} baseline entr(y/ies) no longer dead — drop from the graph:`);
    for (const key of stale) console.log(`       ${key}`);
  }

  console.log(
    "\n   Dead fields render nowhere. Editing them changes nothing a user sees,\n" +
      "   and they read exactly like live copy to the next author.\n" +
      "   Delete them, or start rendering them — do not leave them ambiguous.\n",
  );
}

if (newlyDead) {
  console.error(
    `✗ ${newlyDead} field(s) went dead without being recorded.\n` +
      "  Either the page stopped rendering them (fix that), or they are\n" +
      "  genuinely dead and belong in deadDataBaseline with a reason.",
  );
  process.exit(1);
}
console.log("✓ no newly dead data fields");

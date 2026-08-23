#!/usr/bin/env node
/**
 * Find byte-identical tracked assets, and say which copies anything links to.
 *
 * The repo tracks 804 MB. Some of that is genuine content, but some is the
 * same file committed several times over: one 1.2 MB photo exists four times
 * (images/, assets/, public/images/, public/assets/) and a 1.27 MB three.js
 * build three times. Every copy is uploaded on every deploy.
 *
 * Duplication alone is not the interesting signal — a vendored library that is
 * genuinely loaded from two paths is fine. What matters is whether anything
 * REFERENCES each copy, so this reports duplicate groups annotated with the
 * number of source references to each path, and totals the bytes held by
 * copies nothing points at.
 *
 * Reports only. Deleting is a judgement call: a path may be linked from a
 * printed handout, a Canvas package, or a bookmark this repo cannot see.
 *
 *   node scripts/audit-duplicate-assets.mjs            → reports/duplicate-assets.md
 *   node scripts/audit-duplicate-assets.mjs --unreferenced-only
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { assertNonEmpty } from "../tools/lib/non-empty.mjs";
import { assertSweptEnough } from "../tools/lib/sweep-guard.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const UNREFERENCED_ONLY = process.argv.includes("--unreferenced-only");

const BINARY = /\.(png|jpe?g|gif|webp|svg|mp3|wav|mp4|woff2?|ttf|otf|pdf|wasm|zip|pptx|docx)$/i;
const CODE = /\.(js|mjs|css)$/i;

const tracked = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter(Boolean)
  .filter((f) => BINARY.test(f) || CODE.test(f));

// Group by content hash, cheapest-first: size, then hash only within a size.
const bySize = new Map();
for (const file of tracked) {
  let size;
  try {
    size = statSync(resolve(ROOT, file)).size;
  } catch {
    continue;
  }
  if (size < 4096) continue; // ignore trivia; the point is shipped weight
  if (!bySize.has(size)) bySize.set(size, []);
  bySize.get(size).push(file);
}

const groups = [];
for (const [size, files] of bySize) {
  if (files.length < 2) continue;
  const byHash = new Map();
  for (const file of files) {
    const hash = createHash("sha256")
      .update(readFileSync(resolve(ROOT, file)))
      .digest("hex");
    if (!byHash.has(hash)) byHash.set(hash, []);
    byHash.get(hash).push(file);
  }
  for (const [, copies] of byHash) {
    if (copies.length > 1) groups.push({ size, copies: copies.sort() });
  }
}
groups.sort((a, b) => b.size * (b.copies.length - 1) - a.size * (a.copies.length - 1));

/** How many tracked source files mention this path (by basename and by path)? */
const searchable = execFileSync("git", ["ls-files"], { cwd: ROOT, encoding: "utf8" })
  .split("\n")
  .filter((f) => /\.(html|js|mjs|css|json|md|txt)$/i.test(f));
const haystack = searchable
  .map((f) => {
    try {
      return readFileSync(resolve(ROOT, f), "utf8");
    } catch {
      return "";
    }
  })
  .join("\n");

/**
 * Directories whose contents are addressed by a BUILT path rather than a
 * literal one — `` src: `/assets/objective-art/${file}.svg` `` in
 * engine/core/objective-art-catalog.js, for example. No static scan can resolve
 * a template literal to individual files, so every asset in such a directory
 * counts as zero references and reads as an orphan.
 *
 * That is not a theoretical concern: on 2026-08-23 this report listed 58 groups
 * (1.0 MB) where "every copy has 0 references", and the largest block of them
 * was the objective art shown on the Objectives slide of every lesson. Deleting
 * on that evidence would have 404'd the figure on all 288 lessons.
 *
 * Discovered, not hardcoded: any `${...}` interpolation inside a quoted path
 * marks its parent directory as generated.
 */
const GENERATED_DIRS = (() => {
  const dirs = new Set();
  const re = /["'`\(]([A-Za-z0-9_./-]*\/)\$\{/g;
  let m;
  while ((m = re.exec(haystack))) {
    dirs.add(m[1].replace(/^\//, "").replace(/\/$/, ""));
  }
  return [...dirs].filter(Boolean);
})();

const isGenerated = (path) =>
  GENERATED_DIRS.some(
    (d) => d && (path === d || path.startsWith(`${d}/`) || path.includes(`/${d}/`)),
  );

const referenceCount = (path) => {
  const base = path.split("/").pop();
  // Count mentions of the full path and of the basename; a page linking
  // "/images/x.jpg" and one linking "x.jpg" both count.
  const full = haystack.split(path).length - 1;
  const byBase = haystack.split(base).length - 1;
  // A file whose directory is addressed by a template literal is REACHED even
  // though nothing names it — report it as such rather than as an orphan.
  if (byBase === 0 && isGenerated(path)) {
    return { full, byBase: 0, generated: true };
  }
  return { full, byBase };
};

const lines = ["# Duplicate tracked assets", ""];
let wasted = 0;
let unreferencedBytes = 0;
const unreferenced = [];

for (const g of groups) {
  const annotated = g.copies.map((c) => ({ path: c, ...referenceCount(c) }));
  const dead = annotated.filter((a) => a.byBase === 0 && !a.generated);
  wasted += g.size * (g.copies.length - 1);
  if (dead.length === g.copies.length) {
    unreferencedBytes += g.size * g.copies.length;
    unreferenced.push(...dead.map((d) => d.path));
  }
  if (UNREFERENCED_ONLY && dead.length !== g.copies.length) continue;
  lines.push(`## ${(g.size / 1024).toFixed(0)} KB × ${g.copies.length} copies`);
  for (const a of annotated) {
    lines.push(
      `- \`${a.path}\` — ${a.byBase} reference(s)${a.generated ? " *(reached by a generated path)*" : a.byBase === 0 ? " **(orphan)**" : ""}`,
    );
  }
  lines.push("");
}

lines.unshift(
  `${groups.length} duplicate group(s) · ${(wasted / 1048576).toFixed(1)} MB held by redundant ` +
    `copies · ${(unreferencedBytes / 1048576).toFixed(1)} MB in groups nothing references.`,
  "",
);

mkdirSync(resolve(ROOT, "reports"), { recursive: true });
writeFileSync(resolve(ROOT, "reports/duplicate-assets.md"), lines.join("\n"));

assertNonEmpty(
  "tracked files",
  tracked,
  "`git ls-files` returned nothing — with no tracked files there are no duplicates to find, trivially.",
  100,
);
assertSweptEnough(
  "audit:duplicates",
  tracked,
  "Discovery for audit:duplicates returned far fewer items than this gate's pinned floor — see data/sweep-floors.json.",
);
console.log(`✓ reports/duplicate-assets.md`);
console.log(
  `  ${groups.length} duplicate groups · ${(wasted / 1048576).toFixed(1)} MB redundant · ` +
    `${(unreferencedBytes / 1048576).toFixed(1)} MB fully unreferenced`,
);
if (unreferenced.length) {
  console.log(`  fully unreferenced copies (${unreferenced.length}):`);
  for (const p of unreferenced.slice(0, 20)) console.log(`    ${p}`);
}

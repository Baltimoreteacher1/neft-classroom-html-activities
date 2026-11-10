#!/usr/bin/env node
/**
 * dedupe-dist-downloads.mjs — publish ONE copy of each byte-identical lesson download.
 *
 *   node tools/dedupe-dist-downloads.mjs           run after `vite build` (last step of `npm run build`)
 *   node tools/dedupe-dist-downloads.mjs --dry-run report only, change nothing
 *
 * WHY: Cloudflare Pages refuses a deployment over 20,000 files, and dist/ sat 141 files under it.
 * ~130 files under dist/lessons/ are byte-for-byte copies of a sibling: the group-1, group-2 and
 * catch-up variants of a lesson very often carry the parent lesson's `homework.docx` unchanged.
 *
 * WHAT IT DOES: for every group of identical lesson downloads it keeps one canonical file, deletes
 * the others from dist/ ONLY, and appends a Pages rewrite (status 200) for each deleted path to
 * dist/_redirects. A rewrite is not a redirect: the URL stays exactly as it was and answers 200
 * with the very same bytes, so no bookmark, Canvas link or SCORM package notices. The SOURCE tree
 * and the source `_redirects` are never touched; the rules are derived from the built content on
 * every build, so they cannot go stale the way a hand-kept list would.
 *
 * SAFETY: only `lessons/**` binary downloads (.docx .pdf .pptx .xlsx .zip); never an HTML page.
 * Paths with characters that `_redirects` treats specially are left alone. If the total rule count
 * would pass RULE_CEILING (Pages allows 2,000 static rules) the script fails instead of publishing
 * a `_redirects` Pages would reject. A rewrite target is always a file that still exists.
 */
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const START =
  "# --- dedupe-dist-downloads: byte-identical lesson downloads served from one copy (200 rewrites) ---";
const END = "# --- end dedupe-dist-downloads ---";
export const RULE_CEILING = 1900; // Pages: 2,000 static rules; keep a margin for hand-added ones
const EXT = /\.(docx|pdf|pptx|xlsx|zip)$/i;

/** True when `p` is safe to write as a literal `_redirects` source/destination. */
export const isPlainPath = (p) => /^\/[A-Za-z0-9._\-/]+$/.test(p) && !p.includes("..");

/** Variant folders sort after their parent: `5-6` is canonical over `5-6-group1`, `-catchup`. */
function rank(rel) {
  const lesson = rel.split("/")[1] ?? "";
  const variant = /-(group1|group2|catchup)$/.test(lesson) ? 1 : 0;
  return [variant, rel.length, rel];
}
const cmp = (a, b) => {
  const [x, y] = [rank(a), rank(b)];
  return x[0] - y[0] || x[1] - y[1] || (x[2] < y[2] ? -1 : x[2] > y[2] ? 1 : 0);
};

/** Pure: given [{rel, hash}] return [{canonical, dup}] pairs. */
export function planDedupe(files) {
  const byHash = new Map();
  for (const f of files) {
    if (!byHash.has(f.hash)) byHash.set(f.hash, []);
    byHash.get(f.hash).push(f.rel);
  }
  const pairs = [];
  for (const rels of byHash.values()) {
    if (rels.length < 2) continue;
    const sorted = [...rels].sort(cmp);
    const canonical = sorted.find((r) => isPlainPath(`/${r}`)) ?? null;
    if (!canonical) continue;
    for (const dup of sorted) {
      if (dup !== canonical && isPlainPath(`/${dup}`)) pairs.push({ canonical, dup });
    }
  }
  return pairs.sort((a, b) => (a.dup < b.dup ? -1 : 1));
}

/* Self-test: the planner must keep the parent, skip unsafe paths and never pair different content. */
{
  const plan = planDedupe([
    { rel: "lessons/5-6-group1/homework.docx", hash: "a" },
    { rel: "lessons/5-6/homework.docx", hash: "a" },
    { rel: "lessons/5-6-catchup/homework.docx", hash: "a" },
    { rel: "lessons/9-9/homework.docx", hash: "b" },
    { rel: "lessons/7 7/x.docx", hash: "c" },
    { rel: "lessons/7-7/x.docx", hash: "c" },
  ]);
  const ok =
    plan.length === 2 &&
    plan.every((p) => p.canonical === "lessons/5-6/homework.docx") &&
    !plan.some((p) => p.dup.includes(" ") || p.dup.includes("7-7")) &&
    !plan.some((p) => p.dup === "lessons/9-9/homework.docx");
  if (!ok) {
    console.error("dedupe-dist-downloads self-test FAILED:", JSON.stringify(plan));
    process.exit(1);
  }
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.test(e.name)) out.push(p);
  }
  return out;
}

function main() {
  const dry = process.argv.includes("--dry-run");
  const lessons = join(DIST, "lessons");
  if (!existsSync(lessons)) {
    console.error("dedupe-dist-downloads: dist/lessons not found — run `npm run build` first");
    process.exit(1);
  }
  const files = walk(lessons)
    .filter((p) => statSync(p).size > 0)
    .map((p) => ({
      rel: relative(DIST, p).split(sep).join("/"),
      hash: createHash("sha256").update(readFileSync(p)).digest("hex"),
    }));
  const pairs = planDedupe(files);

  const redirectsPath = join(DIST, "_redirects");
  let text = existsSync(redirectsPath) ? readFileSync(redirectsPath, "utf8") : "";
  const s = text.indexOf(START);
  if (s !== -1) {
    const e = text.indexOf(END, s);
    text = text.slice(0, s) + (e === -1 ? "" : text.slice(e + END.length + 1));
  }
  const existingRules = text
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#")).length;
  if (existingRules + pairs.length > RULE_CEILING) {
    console.error(
      `dedupe-dist-downloads: ${existingRules} existing + ${pairs.length} new rules would pass ${RULE_CEILING} (Pages limit 2,000). Refusing.`,
    );
    process.exit(1);
  }
  // Never shadow an existing rule's source: a first-match rule already owns that path.
  const owned = new Set(text.split("\n").map((l) => l.trim().split(/\s+/)[0]));
  const usable = pairs.filter((p) => !owned.has(`/${p.dup}`));

  if (dry) {
    console.log(
      `dedupe-dist-downloads (dry run): ${usable.length} duplicate download(s) would be rewritten to a canonical copy`,
    );
    return;
  }
  for (const p of usable) {
    if (!existsSync(join(DIST, p.canonical))) throw new Error(`canonical missing: ${p.canonical}`);
    rmSync(join(DIST, p.dup));
  }
  const block = [START, ...usable.map((p) => `/${p.dup} /${p.canonical} 200`), END, ""].join("\n");
  // PREPEND: Pages (and wrangler) stop parsing after the 100th dynamic (splat/placeholder) rule and silently
  // skip every later line, and the generated file already sits at that limit. Static rules at the top are
  // always read; at the bottom they are dead. Verified with `wrangler pages dev` (404 when appended).
  writeFileSync(redirectsPath, `${block}\n${text.replace(/^\n+/, "")}`);
  console.log(
    `dedupe-dist-downloads: ${usable.length} byte-identical download(s) now served by 200 rewrite from ${new Set(usable.map((p) => p.canonical)).size} canonical file(s)`,
  );
}

main();

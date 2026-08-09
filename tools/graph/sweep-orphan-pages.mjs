#!/usr/bin/env node
/**
 * Pages that exist on disk and nothing links to.
 *
 * `audit:links` asks whether every link RESOLVES. This asks the opposite, and
 * unasked, question: is every page REACHABLE? A student cannot open an activity
 * they cannot navigate to, so an unlinked page is work that shipped and is not
 * being used — the same shape as copy that renders nowhere, one level up.
 *
 * Reachability is deliberately generous, because a false "nobody can reach
 * this" would send someone hunting for a bug that is not there:
 *
 *   - Any mention counts. An href, a string in a JS file, an entry in
 *     data/catalog.json — all of it.
 *   - A page is reachable if its own path is mentioned; if it is an index.html
 *     and its own directory is mentioned; or if its BARE FILENAME appears
 *     anywhere, since lesson sub-pages are routed as `${id}/vocab.html` and no
 *     static scan expands that.
 *   - Reachability is NOT inherited from ancestor directories. An earlier draft
 *     walked every ancestor, and because something links `math/`, everything
 *     under it was declared reachable — including two deliberately unlinked
 *     probes. It reported 0 orphans out of 2,503 and could not have reported
 *     anything else.
 *
 * What survives all that is a page nothing anywhere names.
 *
 *   node tools/graph/sweep-orphan-pages.mjs
 *   node tools/graph/sweep-orphan-pages.mjs --all   # do not group by directory
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SHOW_ALL = process.argv.includes("--all");

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".wrangler",
  ".vite",
  "test-results",
  "playwright-report",
  "canvas-packages",
  "scorm-packages",
  "tmp",
  "coverage",
  ".codex",
  ".superpowers",
  ".claude",
  ".github",
  "docs",
  // Excluded or this audit reads its own output: reports/orphan-pages.md lists
  // every orphan's filename in backticks, those register as mentions, and the
  // next run marks them reachable. Observed live — 24 findings became 7 on a
  // re-run with nothing else changed. An audit must not launder its own results.
  "reports",
]);

/* Pages that are reachable without being linked, by contract. */
const ENTRY_POINTS = [/^index\.html$/, /^404\.html$/, /^_/];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

const all = walk(ROOT);
const pages = all.filter((f) => f.endsWith(".html")).map((f) => relative(ROOT, f));
const searchable = all.filter((f) => /\.(html|js|mjs|cjs|json|md|ts|yml|yaml)$/.test(f));

/* One corpus of everything any file mentions. Cheaper and far more forgiving
   than trying to parse each link form separately. */
const mentions = new Set();
for (const file of searchable) {
  let text;
  try {
    if (statSync(file).size > 4_000_000) continue;
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const self = relative(ROOT, file);
  for (const m of text.matchAll(/["'`(]\s*([./\w@-]+(?:\/[.\w@-]+)*\/?)\s*["'`)]/g)) {
    let ref = m[1];
    if (!ref || ref.includes("://")) continue;
    ref = ref.replace(/^\.\//, "").replace(/^\//, "");
    if (!ref) continue;
    mentions.add(ref);
    mentions.add(ref.replace(/\/$/, ""));
    // Relative links resolve against the linking file's directory.
    if (!m[1].startsWith("/")) {
      const abs = relative(ROOT, resolve(dirname(file), m[1]));
      if (abs && !abs.startsWith("..")) {
        mentions.add(abs);
        mentions.add(abs.replace(/\/$/, ""));
      }
    }
  }
  // NOT `mentions.add(self)`. An earlier draft did exactly that, which made
  // every page mention itself and therefore reachable — the sweep reported 0
  // orphans out of 2,503 and stayed at 0 with two deliberately unlinked probes
  // in the tree. A check that cannot fail is not a check.
  void self;
}

const isReachable = (page) => {
  const base = page.replace(/\\/g, "/");
  const dir = dirname(base);
  const file = base.split("/").pop();

  // Named outright.
  if (mentions.has(base)) return true;

  // A link to the directory serves its index.
  if (file === "index.html" && (mentions.has(dir) || mentions.has(`${dir}/`))) return true;

  // Routed by filename. Lesson sub-pages are built as `${id}/vocab.html`, which
  // no static scan expands, so a bare `vocab.html` anywhere counts. Scoped to
  // the FILENAME rather than any ancestor directory: the ancestor form marked
  // everything under `math/` reachable because something, somewhere, links
  // `math/`, which is how this swallowed its own probes.
  if (mentions.has(file)) return true;

  return false;
};

const orphans = pages.filter((p) => {
  const base = p.split("/").pop();
  if (p === "index.html" || p === "404.html") return false;
  if (ENTRY_POINTS.some((re) => re.test(base)) && !p.includes("/")) return false;
  return !isReachable(p);
});

const byDir = new Map();
for (const o of orphans) {
  const d = dirname(o);
  byDir.set(d, [...(byDir.get(d) ?? []), o.split("/").pop()]);
}

const lines = [
  "# Orphaned pages",
  "",
  "HTML pages on disk that **nothing anywhere links to** — no href, no string in",
  "any script, no entry in any data file.",
  "",
  `Scanned **${pages.length}** pages against **${searchable.length}** files of`,
  `references. **${orphans.length}** unreachable.`,
  "",
  "`audit:links` asks whether links resolve. This asks whether pages are reachable.",
  "An unlinked activity is work that shipped and is not being used.",
  "",
  "Reachability is generous on purpose: any mention counts, and a page is reachable",
  "if its own path is named, if it is an index.html whose directory is named, or",
  "if its bare filename appears anywhere — lesson sub-pages are routed as",
  "`${id}/vocab.html`, which no static scan expands. What is listed here is named",
  "by nothing at all.",
  "",
  "Not a gate. Some of these are deliberate (drafts, archives, one-off exports);",
  "deciding which is a human call.",
  "",
];

for (const [dir, files] of [...byDir].sort((a, b) => b[1].length - a[1].length)) {
  lines.push(`## \`${dir}/\` — ${files.length}`);
  lines.push("");
  for (const f of files.sort()) lines.push(`- \`${f}\``);
  lines.push("");
}

mkdirSync(resolve(ROOT, "reports"), { recursive: true });
writeFileSync(resolve(ROOT, "reports/orphan-pages.md"), lines.join("\n"));

console.log(
  `✓ reports/orphan-pages.md — ${orphans.length} unreachable page(s) of ${pages.length}, in ${byDir.size} director(y/ies)`,
);
const top = [...byDir].sort((a, b) => b[1].length - a[1].length).slice(0, SHOW_ALL ? 999 : 15);
for (const [dir, files] of top) console.log(`   ${dir}/ — ${files.length}`);
if (byDir.size > top.length)
  console.log(`   … and ${byDir.size - top.length} more director(y/ies)`);

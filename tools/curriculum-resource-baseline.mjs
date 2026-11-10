#!/usr/bin/env node
/**
 * Zero-resource-loss baseline for the Curriculum surface.
 *
 *   node tools/curriculum-resource-baseline.mjs --update   bless the current inventory
 *   node tools/curriculum-resource-baseline.mjs            check against the baseline (needs dist/)
 *   node tools/curriculum-resource-baseline.mjs --http <base-url>
 *                                                          also HEAD every baseline URL over HTTP
 *
 * WHY: a redesign can quietly orphan a resource (link element gone, file renamed,
 * route unlisted) while every build and screenshot still looks fine. The existing
 * gates each pin one thing; none pins "everything a teacher could open yesterday
 * can still be opened today". This does.
 *
 * What is pinned (data/curriculum-resource-baseline.json):
 *   resource  every entry in data/curriculum-download-manifest.json (url, type, lesson)
 *   page      every curriculum/<slug>/ tool page
 *   link      every internal href a hub page carries (hub + units picker)
 *   external  every off-site href on those pages (recorded; never fetched by default)
 *
 * Check rules: a baseline entry MUST still resolve to a built file or a _redirects
 * rule. Additions are allowed. Removing an entry from the baseline is a deliberate,
 * reviewed edit to the JSON, never a side effect.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIST = join(ROOT, "dist");
const BASELINE = join(ROOT, "data", "curriculum-resource-baseline.json");
const HUB_PAGES = ["curriculum/index.html", "curriculum/units/index.html"];

const readJson = (rel) => JSON.parse(readFileSync(join(ROOT, rel), "utf8"));

/** Strip query/hash; keep the path exactly as authored. */
export const cleanPath = (href) => href.split("#")[0].split("?")[0];

/** Every href/src value in an HTML string. */
export function hrefsIn(html) {
  const out = new Set();
  for (const m of html.matchAll(/\s(?:href|src)=["']([^"']+)["']/g)) out.add(m[1].trim());
  return [...out];
}

/** Classify an authored link. Returns null for anchors, scripts, mailto, data URIs. */
export function classifyLink(href) {
  if (!href || href.startsWith("#") || /^(mailto:|tel:|javascript:|data:)/i.test(href)) return null;
  if (/^https?:\/\//i.test(href)) return "external";
  return href.startsWith("/") ? "link" : null;
}

function collectResources() {
  const manifest = readJson("data/curriculum-download-manifest.json");
  const rows = [];
  const push = (r) =>
    rows.push({
      kind: "resource",
      url: r.url,
      type: r.type,
      lesson: r.lesson,
      delivery: r.delivery,
    });
  for (const unit of manifest.units) {
    // Unit-level rows (reveal documents, tests, projects, SCORM) sit beside the lessons.
    for (const r of unit.resources ?? []) push(r);
    for (const lesson of unit.lessons ?? []) for (const r of lesson.resources ?? []) push(r);
  }
  return rows;
}

function collectPages() {
  const base = join(ROOT, "curriculum");
  return readdirSync(base)
    .filter((d) => statSync(join(base, d)).isDirectory() && existsSync(join(base, d, "index.html")))
    .map((d) => ({ kind: "page", url: `/curriculum/${d}/` }));
}

function collectLinks() {
  const rows = [];
  for (const page of HUB_PAGES) {
    for (const href of hrefsIn(readFileSync(join(ROOT, page), "utf8"))) {
      const kind = classifyLink(href);
      if (kind)
        rows.push({
          kind,
          url: kind === "link" ? cleanPath(href) : href,
          from: `/${page.replace(/index\.html$/, "")}`,
        });
    }
  }
  return rows;
}

/** Collapse to one row per (kind, url), keeping the first-seen metadata. */
function dedupe(rows) {
  const seen = new Map();
  for (const r of rows) {
    const key = `${r.kind}\t${r.url}`;
    if (!seen.has(key)) seen.set(key, r);
  }
  return [...seen.values()].sort((a, b) => (a.kind + a.url).localeCompare(b.kind + b.url));
}

export function collectInventory() {
  return dedupe([...collectResources(), ...collectPages(), ...collectLinks()]);
}

/** `_redirects` source patterns; splats become prefix matches. */
function redirectSources() {
  // Source `_redirects` plus the BUILT one: Pages deploys dist/_redirects, and the build appends rules there
  // (tools/dedupe-dist-downloads.mjs serves byte-identical downloads from one copy via 200 rewrites).
  return [join(ROOT, "_redirects"), join(DIST, "_redirects")]
    .filter((file) => existsSync(file))
    .flatMap((file) =>
      readFileSync(file, "utf8")
        .split("\n")
        .map((l) => l.trim().split(/\s+/)[0])
        .filter((s) => s?.startsWith("/")),
    );
}

/** `/api/<name>/...` is answered by a Pages Function, not a built file: it resolves when that Function exists. */
function apiFunctionExists(path) {
  const name = path.split("/")[2];
  if (!name) return false;
  return [`${name}.js`, `${name}/index.js`, `${name}/[[path]].js`].some((f) =>
    existsSync(join(ROOT, "functions", "api", f)),
  );
}

/** Does a built file, a Pages Function or a redirect rule answer this path? Mirrors Pages resolution. */
export function resolves(url, redirects = []) {
  const path = decodeURI(cleanPath(url));
  if (path.startsWith("/api/")) return apiFunctionExists(path);
  const candidates = path.endsWith("/")
    ? [join(DIST, path, "index.html")]
    : [join(DIST, path), join(DIST, path, "index.html"), join(DIST, `${path}.html`)];
  if (candidates.some((c) => existsSync(c) && statSync(c).isFile())) return true;
  return redirects.some((src) =>
    src.endsWith("*") ? path.startsWith(src.slice(0, -1)) : src === path,
  );
}

async function headAll(base, urls, concurrency = 24) {
  const bad = [];
  let i = 0;
  const worker = async () => {
    while (i < urls.length) {
      const url = urls[i++];
      try {
        const res = await fetch(new URL(url, base), { method: "HEAD", redirect: "manual" });
        // 401/403 = auth-gated by design (teacher tools); the route contract owns those.
        if (res.status >= 400 && ![401, 403].includes(res.status)) bad.push(`${res.status} ${url}`);
      } catch (e) {
        bad.push(`ERR ${url} (${e.message})`);
      }
    }
  };
  await Promise.all(Array.from({ length: concurrency }, worker));
  return bad;
}

function summarize(rows) {
  const counts = {};
  for (const r of rows) counts[r.kind] = (counts[r.kind] ?? 0) + 1;
  return counts;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--update")) {
    const entries = collectInventory();
    const doc = {
      $comment:
        "GENERATED by tools/curriculum-resource-baseline.mjs --update. Entries may only be removed by a deliberate, reviewed edit.",
      counts: summarize(entries),
      entries,
    };
    writeFileSync(BASELINE, `${JSON.stringify(doc, null, 1)}\n`);
    console.log(`baseline written: ${JSON.stringify(doc.counts)}`);
    return;
  }

  if (!existsSync(DIST)) {
    console.error("FAIL curriculum-resource-baseline: dist/ missing — run `npm run build` first");
    process.exit(1);
  }
  const baseline = readJson("data/curriculum-resource-baseline.json").entries;
  const redirects = redirectSources();
  const local = baseline.filter((e) => e.kind !== "external");
  const missing = local.filter((e) => !resolves(e.url, redirects)).map((e) => `${e.kind} ${e.url}`);

  const current = new Set(collectInventory().map((e) => `${e.kind}\t${e.url}`));
  const dropped = baseline.filter((e) => e.kind !== "link" && !current.has(`${e.kind}\t${e.url}`));

  const httpIdx = args.indexOf("--http");
  const httpBad =
    httpIdx >= 0
      ? await headAll(args[httpIdx + 1], [
          ...new Set(local.map((e) => e.url).filter((u) => !u.startsWith("/api/"))),
        ])
      : [];

  const problems = [
    ...missing.map((m) => `unresolved: ${m}`),
    ...dropped.map((e) => `no longer inventoried: ${e.kind} ${e.url}`),
    ...(httpIdx >= 0 ? httpBad.map((b) => `http: ${b}`) : []),
  ];
  if (problems.length) {
    console.error(`FAIL curriculum-resource-baseline: ${problems.length} problem(s)`);
    for (const p of problems.slice(0, 20)) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log(
    `PASS curriculum-resource-baseline: ${baseline.length} entries accounted for ${JSON.stringify(summarize(baseline))}${httpIdx >= 0 ? " (HTTP verified)" : ""}`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();

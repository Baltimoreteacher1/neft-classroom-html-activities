#!/usr/bin/env node
/**
 * validate-seo.mjs — the canonicalization and crawlability contract.
 *
 * WHY THIS EXISTS. On 2026-09-07 Google Search Console reported two new
 * indexing failures on eduwonderlab.com: "Duplicate, Google chose different
 * canonical than user" and an access-forbidden class. Both were real, both had
 * been true for months, and NO existing gate could see either — because every
 * one of the ~110 checks in this repo asks whether a page is well-formed, links
 * correctly, renders, or answers the right status. A page can do all four and
 * still tell a search engine to index a different host.
 *
 * Three defects were live at once:
 *
 *   1. `scripts/generate-sitemap.mjs` declared every URL on
 *      `neft-classroom-html-activities.pages.dev` while all 2,784
 *      `<link rel="canonical">` tags declared `eduwonderlab.com`. A sitemap
 *      entry and a canonical tag are both canonicalization signals, so every
 *      single URL shipped with its two signals contradicting each other.
 *   2. The sitemap submitted teacher surfaces (/dashboard/, /teacher-tools/,
 *      /teacher-data-dashboard/, and 57 more once the stale file was
 *      regenerated) which answer an anonymous crawler with 401.
 *   3. robots.txt was `Allow: /` and nothing else, so Googlebot was free to
 *      crawl all 1,278 gated pages and be refused by every one.
 *
 * WHAT IT HOLDS. Every check compares one fact in the repo against another fact
 * in the repo — no network, no external crosswalk to go stale:
 *
 *   ROBOTS COVERAGE, BOTH DIRECTIONS. Every tracked HTML path that
 *   `isTeacherSurface()` gates must be disallowed, and no path it does not gate
 *   may be. Both halves matter and the second is the dangerous one: a broad
 *   `Disallow: /*teacher*` would also block `/assets/curriculum-teacher-
 *   workflow.js`, which the PUBLIC curriculum hub fetches unconditionally, and
 *   a stylesheet or manifest hidden from Googlebot makes the page it renders
 *   look broken. /assets/ and /data/ are additionally swept across ALL tracked
 *   files, not just HTML, for that reason.
 *
 *   ONE HOST. Every sitemap <loc> and every canonical tag names the apex. This
 *   is what catches defect 1, in both files, in both directions.
 *
 *   A CANONICAL POINTS AT ITSELF. `/personal/CW/american/index.html` declared
 *   `canonical: https://example.com/american/` — an Astro template placeholder
 *   that shipped, on 15 pages. A canonical naming a domain Google cannot
 *   associate with the site is not merely ignored: it withdraws the page's own
 *   claim, and Google picks a canonical itself, which is the literal text of
 *   the Search Console message.
 *
 *   THE SITEMAP IS TRUE. Every URL resolves to a file on disk and none is
 *   gated. The committed sitemap had drifted to 267 URLs against a catalog of
 *   1,242 and nothing noticed, because no gate had ever read it.
 *
 * Detectors are self-tested against known-bad fixtures BEFORE the real sweep,
 * including the three exact strings that shipped — a detector that has quietly
 * stopped firing and a clean tree otherwise print the same line.
 */

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isTeacherSurface } from "../functions/_lib/teacher-surface.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANONICAL_ORIGIN = "https://eduwonderlab.com";

const failures = [];
function fail(check, detail) {
  failures.push(`${check}: ${detail}`);
}

/* ------------------------------------------------------------------ robots */

/**
 * Parse the `User-agent: *` group out of a robots.txt.
 *
 * Only the wildcard group is read: it is the one Googlebot obeys here, and the
 * file declares no other. Returns rules in file order.
 */
export function parseRobots(text) {
  const rules = [];
  let inStar = false;
  let sitemap = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (field === "sitemap") {
      sitemap = value;
      continue;
    }
    if (field === "user-agent") {
      inStar = value === "*";
      continue;
    }
    if (!inStar) continue;
    if (field === "allow" || field === "disallow") {
      if (value === "") continue; // `Disallow:` with no value allows everything
      rules.push({ allow: field === "allow", pattern: value });
    }
  }
  return { rules, sitemap };
}

/** Compile a robots pattern (`*` wildcard, `$` end-anchor) to a RegExp. */
function robotsRegex(pattern) {
  let body = "";
  let anchored = false;
  let p = pattern;
  if (p.endsWith("$")) {
    anchored = true;
    p = p.slice(0, -1);
  }
  for (const ch of p) {
    if (ch === "*") body += "[^]*";
    else body += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${body}${anchored ? "$" : ""}`);
}

/**
 * Decide whether a path is allowed, by Google's documented precedence: the
 * most specific (longest) matching rule wins, and Allow wins an exact tie.
 * A path matching no rule is allowed.
 */
export function robotsAllows(rules, path) {
  let best = null;
  for (const rule of rules) {
    if (!robotsRegex(rule.pattern).test(path)) continue;
    const length = rule.pattern.replace(/\$$/, "").length;
    if (!best || length > best.length || (length === best.length && rule.allow && !best.allow)) {
      best = { length, allow: rule.allow };
    }
  }
  return best ? best.allow : true;
}

/* --------------------------------------------------------------- canonical */

/**
 * Extract the href of the first `<link rel="canonical">`, or null.
 *
 * Every `<link>` is scanned and then filtered on its own rel, rather than
 * matched with one combined regex. The combined form is what a first pass
 * used, and on the real markup — where `<link rel="icon">` precedes the
 * canonical on one minified line — its alternation matched the icon tag and
 * returned that href, which is how a check for "does this canonical name the
 * right host?" would have read `a` and passed 15 broken pages.
 */
export function canonicalOf(html) {
  for (const tag of html.match(/<link\b[^>]*>/gi) || []) {
    if (!/\brel=["']?canonical["']?/i.test(tag)) continue;
    const href = tag.match(/\bhref=["']([^"']*)["']/i);
    return href ? href[1] : null;
  }
  return null;
}

/**
 * Why a recorded cross-canonical decision is not acceptable, or null.
 *
 * A decision an agent made about its own output is not a decision; a reason too
 * short to be a sentence is how an audit gets gamed. Both are the standard
 * `data/product-decisions.json` is already held to.
 */
export function reviewDecisionProblem(decision) {
  if (!decision || typeof decision !== "object") return "missing decision";
  if (!decision.decidedBy || /claude|agent|assistant/i.test(decision.decidedBy)) {
    return "decidedBy must name a person";
  }
  if (!decision.reason || decision.reason.trim().length < 40) {
    return `reason must be a written explanation (40+ chars), got ${JSON.stringify(decision.reason || "")}`;
  }
  return null;
}

/** The URL path a tracked file is served at: index.html collapses to its dir. */
export function servedPath(file) {
  const p = `/${file}`;
  return p.endsWith("/index.html") ? p.slice(0, -"index.html".length) : p;
}

/**
 * The URL a `<meta http-equiv="refresh">` stub sends visitors to, or null.
 *
 * A page whose whole job is to forward SHOULD canonicalize to its destination
 * rather than to itself — that is what consolidates the retired URL's ranking
 * onto the live one, and pointing such a stub at itself asks Google to index a
 * page with no content. `curriculum/family-connections/family/index.html` is
 * exactly this, and `family-connections.test.mjs` has pinned its canonical to
 * `/curriculum/family-connections/` all along. A self-canonical rule that did
 * not know about redirects read that correct page as the same defect as the 12
 * `/math/intervention/` pages and "fixed" it, breaking the pin.
 *
 * So the exemption is derived from the page itself — the canonical is compared
 * against the destination the page really forwards to — rather than recorded in
 * the review registry, which would have meant inventing a human decision for
 * something that is just a fact about the markup.
 */
export function refreshTarget(html) {
  const tag = (html.match(/<meta\b[^>]*>/gi) || []).find((m) =>
    /\bhttp-equiv=["']?refresh["']?/i.test(m),
  );
  if (!tag) return null;
  const content = tag.match(/\bcontent=["']([^"']*)["']/i);
  if (!content) return null;
  const url = content[1].match(/url\s*=\s*(.+)$/i);
  return url ? url[1].trim().replace(/^["']|["']$/g, "") : null;
}

/* -------------------------------------------------------------- self-tests */

function selfTest() {
  const t = [];
  const check = (name, actual, expected) => {
    if (actual !== expected) t.push(`${name}: expected ${expected}, got ${actual}`);
  };

  const { rules, sitemap } = parseRobots(
    [
      "User-agent: *",
      "Allow: /",
      "Allow: /assets/",
      "Disallow: /*answer-key.html$",
      "Disallow: /teacher-tools/",
      "Sitemap: https://eduwonderlab.com/sitemap.xml",
    ].join("\n"),
  );
  check("parse rule count", rules.length, 4);
  check("parse sitemap", sitemap, "https://eduwonderlab.com/sitemap.xml");

  // Positive controls: the gated shapes must be refused.
  check("$ suffix", robotsAllows(rules, "/lessons/1-1/worksheet-answer-key.html"), false);
  check("dir prefix", robotsAllows(rules, "/teacher-tools/gradebook/"), false);
  // Negative controls: student pages and shared assets must stay crawlable.
  check("student lesson", robotsAllows(rules, "/lessons/1-1/"), true);
  check("student worksheet", robotsAllows(rules, "/lessons/1-1/worksheet.html"), true);
  // The exact false positive a broad /*teacher* rule would cause.
  check(
    "shared asset with a teacher-ish name",
    robotsAllows(rules, "/assets/curriculum-teacher-workflow.js"),
    true,
  );
  // `$` anchors: a path that merely CONTAINS the stem is not the stem.
  check(
    "$ does not match mid-path",
    robotsAllows(rules, "/lessons/1-1/worksheet-answer-key.html.bak"),
    true,
  );
  // Longest-match precedence, in the direction that matters.
  const shadow = parseRobots(["User-agent: *", "Disallow: /a/", "Allow: /a/b/"].join("\n")).rules;
  check("longest match wins", robotsAllows(shadow, "/a/b/c.html"), true);
  check("shorter rule still applies", robotsAllows(shadow, "/a/z.html"), false);

  // Canonical extraction, including the two shipped defects.
  check(
    "canonical extracted",
    canonicalOf('<link rel="canonical" href="https://eduwonderlab.com/x/">'),
    "https://eduwonderlab.com/x/",
  );
  check(
    "example.com placeholder read verbatim",
    canonicalOf(
      '<link rel="icon" href="a"><link rel="canonical" href="https://example.com/american/">',
    ),
    "https://example.com/american/",
  );
  check("no canonical", canonicalOf("<html><head></head></html>"), null);
  // Fixture paths deliberately avoid the literal `lessons/…` shape: this file
  // walks `git ls-files` and reads no lesson directly, and a string that merely
  // looks like one would be counted as debt by curriculum-source-ratchet.
  check(
    "served path collapses index",
    servedPath("math/intervention/percents/index.html"),
    "/math/intervention/percents/",
  );
  check(
    "served path keeps file",
    servedPath("math/intervention/percents/notes.html"),
    "/math/intervention/percents/notes.html",
  );

  // Meta-refresh stubs: the shipped page, and the shapes that must NOT be read
  // as one.
  check(
    "refresh target read",
    refreshTarget('<meta http-equiv="refresh" content="0; url=/curriculum/family-connections/" />'),
    "/curriculum/family-connections/",
  );
  check("no refresh tag", refreshTarget('<meta charset="utf-8">'), null);
  check(
    "refresh with no url is not a destination",
    refreshTarget('<meta http-equiv="refresh" content="30">'),
    null,
  );

  // The gate predicate itself, on the three URLs that were submitted.
  for (const p of ["/dashboard/", "/teacher-tools/", "/teacher-data-dashboard/"]) {
    check(`gate sees ${p}`, isTeacherSurface(p), true);
  }
  check("gate leaves student lesson", isTeacherSurface("/lessons/1-1/"), false);

  // The review registry's own standard, in both directions.
  const goodReason = "Print variant folds into the screen page it was generated from.";
  check(
    "review accepts a real decision",
    reviewDecisionProblem({ decidedBy: "Joel", reason: goodReason }),
    null,
  );
  check(
    "review rejects an agent's own decision",
    reviewDecisionProblem({ decidedBy: "Claude", reason: goodReason }) !== null,
    true,
  );
  check(
    "review rejects a reason too short to be one",
    reviewDecisionProblem({ decidedBy: "Joel", reason: "duplicate" }) !== null,
    true,
  );

  if (t.length) {
    console.error("FAIL validate:seo — self-test failed (detectors are not firing):");
    for (const line of t) console.error(`  ${line}`);
    process.exit(1);
  }
  return 26;
}

/* ------------------------------------------------------------------- sweep */

const selfTests = selfTest();

const tracked = execFileSync("git", ["ls-files"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 1 << 28,
})
  .trim()
  .split("\n")
  .filter(Boolean);
// Dot-prefixed files are not published, so they are not crawlable and cannot
// carry an indexing signal. One is tracked — a stray `.pdf-render-*.html`
// scratch copy of a teacher notes page — and judging it would report a defect
// on a page no crawler can reach.
const isPublished = (f) => !f.split("/").some((seg) => seg.startsWith("."));
const htmlFiles = tracked.filter((f) => f.endsWith(".html") && isPublished(f));

const robotsText = readFileSync(join(root, "robots.txt"), "utf8");
const { rules: robotsRules, sitemap: sitemapDecl } = parseRobots(robotsText);

if (sitemapDecl !== `${CANONICAL_ORIGIN}/sitemap.xml`) {
  fail("robots-sitemap", `robots.txt declares Sitemap: ${sitemapDecl || "(none)"}`);
}

/* 1. Robots coverage, both directions, over every tracked HTML page. */
const notDisallowed = [];
const wronglyDisallowed = [];
for (const file of htmlFiles) {
  const path = servedPath(file);
  const gated = isTeacherSurface(path);
  const allowed = robotsAllows(robotsRules, path);
  if (gated && allowed) notDisallowed.push(path);
  if (!gated && !allowed) wronglyDisallowed.push(path);
}
if (notDisallowed.length) {
  fail(
    "robots-coverage",
    `${notDisallowed.length} teacher-gated page(s) are still crawlable; add a rule to robots.txt:\n    ${notDisallowed.slice(0, 10).join("\n    ")}`,
  );
}
if (wronglyDisallowed.length) {
  fail(
    "robots-overreach",
    `${wronglyDisallowed.length} student page(s) are blocked from Google:\n    ${wronglyDisallowed.slice(0, 10).join("\n    ")}`,
  );
}

/* 2. Shared code and data must stay crawlable — Googlebot renders with them. */
const blockedShared = tracked
  .filter((f) => f.startsWith("assets/") || f.startsWith("data/"))
  .map((f) => `/${f}`)
  .filter((p) => !robotsAllows(robotsRules, p));
if (blockedShared.length) {
  fail(
    "robots-shared-assets",
    `${blockedShared.length} shared asset(s) blocked; Googlebot needs these to render:\n    ${blockedShared.slice(0, 10).join("\n    ")}`,
  );
}

/* 3. The sitemap: one host, nothing gated, everything real. */
const sitemapXml = readFileSync(join(root, "sitemap.xml"), "utf8");
const locs = [...sitemapXml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
if (!locs.length) fail("sitemap-empty", "sitemap.xml declares no URLs");

const foreignHost = locs.filter((u) => !u.startsWith(`${CANONICAL_ORIGIN}/`));
if (foreignHost.length) {
  const hosts = [...new Set(foreignHost.map((u) => u.split("/").slice(0, 3).join("/")))];
  fail(
    "sitemap-host",
    `${foreignHost.length} URL(s) on a non-canonical host (${hosts.join(", ")}); the pages themselves canonicalize to ${CANONICAL_ORIGIN}`,
  );
}

const sitemapPaths = locs
  .filter((u) => u.startsWith(`${CANONICAL_ORIGIN}/`))
  .map((u) => u.slice(CANONICAL_ORIGIN.length));

const gatedInSitemap = sitemapPaths.filter((p) => isTeacherSurface(p));
if (gatedInSitemap.length) {
  fail(
    "sitemap-gated",
    `${gatedInSitemap.length} submitted URL(s) answer 401 to an anonymous crawler:\n    ${gatedInSitemap.slice(0, 10).join("\n    ")}`,
  );
}

const blockedInSitemap = sitemapPaths.filter((p) => !robotsAllows(robotsRules, p));
if (blockedInSitemap.length) {
  fail(
    "sitemap-vs-robots",
    `${blockedInSitemap.length} URL(s) are submitted for indexing and disallowed in robots.txt:\n    ${blockedInSitemap.slice(0, 10).join("\n    ")}`,
  );
}

const unresolvable = sitemapPaths.filter((p) => {
  const rel = p.replace(/^\//, "");
  return ![rel, `${rel}index.html`, `${rel.replace(/\/$/, "")}/index.html`].some(
    (c) => c && existsSync(join(root, c)),
  );
});
if (unresolvable.length) {
  fail(
    "sitemap-resolves",
    `${unresolvable.length} submitted URL(s) do not exist on disk:\n    ${unresolvable.slice(0, 10).join("\n    ")}`,
  );
}

/* 4. Canonical tags: one host, and pointing at the page's own URL. */
const foreignCanonical = [];
const misdirectedCanonical = [];
let withCanonical = 0;
for (const file of htmlFiles) {
  let html;
  try {
    html = readFileSync(join(root, file), "utf8");
  } catch {
    continue;
  }
  const href = canonicalOf(html);
  if (!href) continue;
  withCanonical += 1;
  if (!/^https?:\/\//i.test(href)) continue; // a relative canonical is self-resolving
  if (!href.startsWith(`${CANONICAL_ORIGIN}/`)) {
    foreignCanonical.push(`${file} -> ${href}`);
    continue;
  }
  const declared = href.slice(CANONICAL_ORIGIN.length).split(/[?#]/)[0];
  const own = servedPath(file);
  // A page may canonicalize to itself, to its own directory index, or — when it
  // is a meta-refresh stub — to the URL it forwards visitors to.
  const forwardsTo = refreshTarget(html);
  if (
    declared !== own &&
    declared !== `${own}index.html` &&
    !(forwardsTo && (declared === forwardsTo || `${CANONICAL_ORIGIN}${declared}` === forwardsTo))
  ) {
    misdirectedCanonical.push(`${file} -> ${declared} (served at ${own})`);
  }
}
if (foreignCanonical.length) {
  fail(
    "canonical-host",
    `${foreignCanonical.length} page(s) declare a canonical on another domain; Google cannot honour it and picks its own:\n    ${foreignCanonical.slice(0, 10).join("\n    ")}`,
  );
}
/*
 * A cross-canonical can be correct — a print variant folding into its screen
 * page, a retired URL kept alive. It is recorded rather than assumed, because a
 * gate that simply insisted on self-canonicals would be freezing this tool's
 * own default as though it were a decision somebody made (CLAUDE.md, "Regression
 * pins vs product decisions"). The registry is held to the same standard as the
 * tree in both directions: a reason too short to be a reason fails, and an entry
 * whose finding no longer fires fails so it cannot become a stale absolution.
 */
const review = JSON.parse(readFileSync(join(root, "data", "seo-canonical-review.json"), "utf8"));
const reviewed = new Map((review.decisions || []).map((d) => [d.file, d]));
const flaggedFiles = new Set(misdirectedCanonical.map((line) => line.split(" -> ")[0]));

const unreviewed = misdirectedCanonical.filter((line) => !reviewed.has(line.split(" -> ")[0]));
if (unreviewed.length) {
  fail(
    "canonical-self",
    `${unreviewed.length} page(s) canonicalize to a URL they are not served at. Point each at its own URL, or record the decision in data/seo-canonical-review.json:\n    ${unreviewed.slice(0, 10).join("\n    ")}`,
  );
}
for (const [file, decision] of reviewed) {
  if (!flaggedFiles.has(file)) {
    fail(
      "canonical-review-stale",
      `data/seo-canonical-review.json still excuses ${file}, which no longer declares a foreign canonical — delete the entry`,
    );
    continue;
  }
  const problem = reviewDecisionProblem(decision);
  if (problem) fail("canonical-review", `${file}: ${problem}`);
}

/* ------------------------------------------------------------------ report */

console.log(
  `validate:seo — ${selfTests} self-tests, ${htmlFiles.length} pages, ${withCanonical} canonical tags, ${locs.length} sitemap URLs.`,
);
if (failures.length) {
  console.error(`FAIL validate:seo (${failures.length})`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log("PASS validate:seo");

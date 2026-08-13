#!/usr/bin/env node
/**
 * Every End-of-Unit resource must be listed under the unit it actually belongs to.
 *
 * Two numbering systems live in this repo at once. Lessons were renumbered to the
 * publisher's Reveal TOC on 2026-08-10 (data/toc-migration.json), but most
 * unit-level ASSETS still carry their pre-renumber names:
 *
 *   /pre-test/unit9-review.html   →  "Unit 9 Review: Integers and Coordinate Plane"  → Unit 7
 *   /pre-test/unit7-review.html   →  "Unit 7 Review: Equations and Inequalities"     → Unit 8
 *   /pre-test/unit8-review.html   →  "Unit 8 Review: Statistics"                     → Unit 2
 *   /math/unit-10/projects/       →  "Volume & Surface Area in Action"               → Unit 5
 *
 * So the number in an href proves nothing on its own, and a checker that assumed
 * otherwise would "fix" forty correct placements into wrong ones. What IS
 * reliable is each page's own heading, and two families were re-titled during the
 * renumber and now use canonical numbering: math/unit-N/study-guide/ and
 * math/unit-N/projects/. Those are checked strictly; the legacy families are
 * reported for review but never failed on a number alone.
 *
 * This exists because three study guides and one project link were filed under
 * the wrong unit — Unit 8's guide sat under Statistics, Unit 7's under Equations,
 * and Unit 7 showed Unit 9's guide.
 *
 *   node tools/validate-unit-resource-placement.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PAGE = "curriculum/units/index.html";

/**
 * Hrefs whose directory number is LEGACY, proven by the page's own heading.
 * Each entry is a verified exception, not a guess — the reason is the title the
 * resource actually carries. Anything not listed here is held to its number.
 */
const VERIFIED_LEGACY = new Map([
  ["/math/unit-10/projects/", { unit: 5, because: '"Volume & Surface Area in Action"' }],
  [
    "/math/unit-1/projects/",
    { unit: 6, because: '"Number Sense in Action" (sits with prime factorization)' },
  ],
]);

/** Families whose numbering is legacy throughout — reported, never failed. */
const LEGACY_FAMILIES = [
  /^\/pre-test\//,
  /^\/post-test\//,
  /^\/graphic-novels\//,
  /^\/activities\/architect\//,
  /^\/math\/unit-\d+\/games\//,
  /^\/math\/games\//,
];

/** Families whose directory number IS canonical after the TOC renumber. */
const CANONICAL = /^\/math\/unit-(\d{1,2})\/(study-guide|projects)\/?$/;

let failures = 0;
const fail = (message) => {
  failures++;
  console.error(`   ✗ ${message}`);
};

console.log("unit resource placement");

/* -- 0. the detectors still fire ------------------------------------------ */
{
  const cases = [
    ["canonical family matches study guides", CANONICAL.test("/math/unit-7/study-guide/")],
    ["canonical family matches projects", CANONICAL.test("/math/unit-9/projects/")],
    ["canonical family ignores games", !CANONICAL.test("/math/unit-7/games/unit9-quest.html")],
    [
      "legacy family matches pre-tests",
      LEGACY_FAMILIES.some((re) => re.test("/pre-test/unit9-review.html")),
    ],
    [
      "legacy family ignores study guides",
      !LEGACY_FAMILIES.some((re) => re.test("/math/unit-7/study-guide/")),
    ],
  ];
  for (const [name, ok] of cases) if (!ok) fail(`self-test failed: ${name}`);
  if (failures) {
    console.error("   detectors are broken; refusing to report on placement");
    process.exit(1);
  }
  console.log(`   self-tests          : ${cases.length} ✓`);
}

const { document } = new JSDOM(readFileSync(resolve(ROOT, PAGE), "utf8")).window;

/** The heading a resource page shows for itself, as evidence in messages. */
function headingOf(href) {
  const rel = href.replace(/^\/+/, "").replace(/\/$/, "");
  for (const candidate of [`${rel}/index.html`, rel]) {
    const abs = resolve(ROOT, candidate);
    if (!existsSync(abs)) continue;
    const html = readFileSync(abs, "utf8");
    const h1 = /<h1[^>]*>([^<]+)/.exec(html) || /<title>([^<]+)/.exec(html);
    if (h1) return h1[1].replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  }
  return null;
}

const placements = [];
for (const card of document.querySelectorAll("details.unit")) {
  const unit = Number(card.querySelector(".unit-num")?.textContent.match(/\d+/)?.[0]);
  const name = card.querySelector(".unit-name")?.textContent.trim() || "";
  if (!Number.isFinite(unit)) continue;
  for (const anchor of card.querySelectorAll(":scope > .unit-body > .unit-res a.res")) {
    const href = anchor.getAttribute("href") || "";
    if (!href.startsWith("/")) continue;
    placements.push({ unit, name, href, label: anchor.textContent.replace(/\s+/g, " ").trim() });
  }
}

if (!placements.length) {
  fail(`${PAGE} exposed no unit-level resources — the selector stopped matching`);
}

/* -- 1. canonical families must sit under the unit they name -------------- */
{
  let checked = 0;
  for (const item of placements) {
    const match = CANONICAL.exec(item.href);
    if (!match) continue;
    checked++;
    const expected = VERIFIED_LEGACY.get(item.href)?.unit ?? Number(match[1]);
    if (item.unit === expected) continue;
    const heading = headingOf(item.href);
    const note = VERIFIED_LEGACY.get(item.href)?.because;
    fail(
      `UNIT RESOURCE MISMATCH\n` +
        `       Displayed under: Unit ${item.unit} — ${item.name}\n` +
        `       Resource:        ${item.label} (${item.href})\n` +
        `       Page title says: ${heading || "(unreadable)"}\n` +
        `       Expected:        Unit ${expected}${note ? ` — ${note}` : ""}\n` +
        `       Fix curriculum/units/index.html, not the downloader.`,
    );
  }
  if (!checked) fail("no study-guide or projects links found — the check covers nothing");
  console.log(`   canonical families  : ${checked} ✓`);
}

/* -- 2. no resource may be listed under two different units --------------- */
{
  const byHref = new Map();
  for (const item of placements) {
    // A site-wide tile (the Small-Group Studio) legitimately repeats on every
    // card; a unit resource does not.
    if (!byHref.has(item.href)) byHref.set(item.href, new Set());
    byHref.get(item.href).add(item.unit);
  }
  const SITE_WIDE = new Set(["/neft-math-lab-studio/"]);
  for (const [href, units] of byHref) {
    if (units.size <= 1 || SITE_WIDE.has(href)) continue;
    fail(
      `${href} is listed under Units ${[...units].sort((a, b) => a - b).join(" and ")} — it belongs to one`,
    );
  }
  console.log(`   distinct resources  : ${byHref.size} ✓`);
}

/* -- 3. legacy families: report the crossings, never fail on them --------- */
{
  const crossings = [];
  for (const item of placements) {
    if (!LEGACY_FAMILIES.some((re) => re.test(item.href))) continue;
    const inHref = /(?:^|[/-])unit-?(\d{1,2})(?:[/-]|$)/i.exec(item.href);
    const n = inHref ? Number(inHref[1]) : NaN;
    if (Number.isFinite(n) && n !== item.unit) crossings.push(`${item.href} on Unit ${item.unit}`);
  }
  console.log(
    `   legacy-numbered     : ${crossings.length} crossing(s) — expected, pre-TOC asset names`,
  );
}

if (failures) {
  console.error(`\nRESULT: FAIL ❌ (${failures} problem${failures === 1 ? "" : "s"})`);
  process.exit(1);
}
console.log(`RESULT: PASS ✅ (${placements.length} unit-level placements)`);

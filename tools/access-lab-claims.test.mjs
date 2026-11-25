#!/usr/bin/env node
/* =============================================================================
 * access-lab-claims.test.mjs — a claim The Language Page makes about itself must be true, and provably so.
 *
 * docs/language-page/claims-ledger.md says: "a claim with status other than `verified` must not render on the site"
 * and promised this test ("added in P2"). It did not exist, and the live site carried exactly the kind of claim the
 * ledger forbids: three WIDA studio pages called themselves "Publisher-grade WIDA ACCESS … prep workbook" in their
 * search and share text, beside the rule that the lab is "original practice, not an official assessment".
 *
 * THREE CHECKS
 *   1. LEDGER   every row has a valid id and status; a `verified` row carries a checked date.
 *   2. TAGS     every data-claim="C-NNN" in the lab's source maps to a `verified` row. (A claim that is rendered
 *               must be one somebody checked; nothing tags a claim yet, so this fails the day one is added early.)
 *   3. PHRASES  public Language Page copy (page descriptions, titles and the lab's strings) may not carry
 *               evidence, efficacy, award or "official" language. Code comments are skipped.
 *               A legitimate use (a student phrase bank, a sample sentence a learner reads) goes in
 *               data/language-page-claims-review.json with a 40+ character reason; an entry that stops matching
 *               FAILS so the file cannot collect stale absolutions.
 *
 * Mutation self-tests run first: a detector that stopped firing and a clean site print the same line.
 * ========================================================================== */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const LEDGER = join(ROOT, "docs/language-page/claims-ledger.md");
const REVIEW = join(ROOT, "data/language-page-claims-review.json");

// ----------------------------------------------------------------- pure detectors
const STATUSES = new Set(["verified", "unverified", "removed"]);

export function parseLedger(md) {
  const rows = [];
  for (const line of md.split("\n")) {
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 7 || !/^C-\d{3}$/.test(cells[1])) continue;
    rows.push({ id: cells[1], status: cells[5], checked: cells[6] });
  }
  return rows;
}

export function ledgerComplaints(rows) {
  const out = [];
  const seen = new Set();
  for (const r of rows) {
    if (seen.has(r.id)) out.push(`${r.id}: duplicate id`);
    seen.add(r.id);
    if (!STATUSES.has(r.status))
      out.push(`${r.id}: status "${r.status}" is not verified/unverified/removed`);
    if (r.status === "verified" && !/\d{4}-\d{2}-\d{2}/.test(r.checked))
      out.push(`${r.id}: verified with no checked date`);
  }
  return out;
}

export function tagComplaints(source, file, rows) {
  const verified = new Set(rows.filter((r) => r.status === "verified").map((r) => r.id));
  const out = [];
  for (const m of source.matchAll(/data-claim=["']?(C-\d{3})/g))
    if (!verified.has(m[1])) out.push(`${file}: data-claim ${m[1]} has no verified ledger row`);
  return out;
}

/** What a public page may not say about itself without a ledger row behind it. */
export const CLAIM_PHRASES = [
  /\bpublisher[- ]grade\b/i,
  /\bpublication[- ]grade\b/i,
  /\bresearch[- ]based\b/i,
  /\bresearch (shows|suggests|proves)\b/i,
  /\bstudies show\b/i,
  /\bproven\b/i,
  /\baward[- ]winning\b/i,
  /\btrusted by\b/i,
  /\bguarantee[sd]?\b/i,
  /\befficacy\b/i,
  /\b(improves?|raises?|boosts?) (student |test )?(scores|outcomes|achievement)\b/i,
  /\bauthentic WIDA\b/i,
  /\bWIDA[- ](certified|approved|endorsed)\b/i,
  /\bofficial(ly)? (aligned|approved|partner)\b/i,
];

const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);

/** [{phrase, line, text}] for each claim phrase on a non-comment line. */
export function phraseHits(source) {
  const hits = [];
  source.split("\n").forEach((line, i) => {
    if (isComment(line)) return;
    for (const re of CLAIM_PHRASES) {
      const m = re.exec(line);
      if (m) hits.push({ phrase: m[0], line: i + 1, text: line.trim().slice(0, 140) });
    }
  });
  return hits;
}

/** Only the tags a person or crawler reads (description, titles) from an HTML page, so page scripts are not scanned twice. */
export function htmlClaimSurface(html) {
  const bits = [];
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    if (
      /(name|property)=["'](description|og:description|og:title|twitter:description|twitter:title)["']/i.test(
        m[0],
      )
    )
      bits.push(m[0].replace(/\s+/g, " "));
  }
  const t = /<title>([^<]*)<\/title>/i.exec(html);
  if (t) bits.push(t[1]);
  return bits.join("\n");
}

/** The words a visitor reads on a page: markup, scripts, styles and comments removed. */
export function htmlVisibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/[ \t]+/g, " ");
}

export function staleReviewEntries(review, hitKeys) {
  return review.filter((r) => !hitKeys.has(`${r.file}::${r.phrase.toLowerCase()}`));
}

// ----------------------------------------------------------------- self-tests
{
  const md = [
    "| C-001 | a | b | c | verified | 2026-11-13 |",
    "| C-002 | a | b | c | unverified | needs review |",
    "| C-003 | a | b | c | verified | no date |",
    "| C-004 | a | b | c | maybe | x |",
    "| C-001 | dup | b | c | verified | 2026-11-13 |",
  ].join("\n");
  const rows = parseLedger(md);
  assert.equal(rows.length, 5, "ledger parser stopped reading rows");
  const c = ledgerComplaints(rows).join(" | ");
  assert.match(c, /C-003: verified with no checked date/);
  assert.match(c, /C-004: status "maybe"/);
  assert.match(c, /C-001: duplicate id/);
  assert.equal(ledgerComplaints(rows.slice(0, 2)).length, 0, "a clean ledger was flagged");
  assert.equal(
    tagComplaints('<p data-claim="C-001">x</p>', "f", rows).length,
    0,
    "a verified tag was flagged",
  );
  assert.equal(
    tagComplaints('<p data-claim="C-002">x</p>', "f", rows).length,
    1,
    "an unverified tag passed",
  );
  assert.equal(
    tagComplaints('<p data-claim="C-999">x</p>', "f", rows).length,
    1,
    "an unknown tag passed",
  );
  for (const bad of [
    "Publisher-grade WIDA ACCESS Listening prep workbook.",
    "Research-based practice that raises test scores.",
    "Our award-winning studio, trusted by 40 districts.",
    "Authentic WIDA ACCESS 2.0 Reading practice",
    "WIDA-approved lessons",
    "Proven efficacy in classrooms",
  ])
    assert.ok(phraseHits(`const s = "${bad}";`).length > 0, `claim detector missed: ${bad}`);
  for (const ok of [
    "Original practice inspired by WIDA ACCESS. It is not an official WIDA test, score or placement.",
    "Practice only, not an official WIDA or ACCESS test.",
    "Write an evidence-based explanation of the data.",
  ])
    assert.equal(
      phraseHits(`const s = "${ok}";`).length,
      0,
      `claim detector flagged honest copy: ${ok}`,
    );
  assert.equal(
    phraseHits("// Publisher-grade overview\n * Publisher-grade datasets\n/* proven */").length,
    0,
    "comments must be skipped",
  );
  const surface = htmlClaimSurface(
    '<title>T</title><meta name="description" content="Publisher-grade prep"><script>var proven=1</script>',
  );
  assert.ok(
    /Publisher-grade/.test(surface) && !/var proven/.test(surface),
    "HTML surface extraction is wrong",
  );
  const visible = htmlVisibleText(
    '<p>Our publication-grade feedback</p><script>var s="publisher-grade"</script><style>.x{}</style><!-- proven -->',
  );
  assert.ok(
    phraseHits(visible).length === 1 && /publication/i.test(visible),
    "visible text must keep prose and drop scripts",
  );
  const keys = new Set(["a.js::proven"]);
  assert.equal(
    staleReviewEntries(
      [
        { file: "a.js", phrase: "Proven" },
        { file: "b.js", phrase: "x" },
      ],
      keys,
    ).length,
    1,
  );
}

// ----------------------------------------------------------------- the sweep
const rows = parseLedger(readFileSync(LEDGER, "utf8"));
assert.ok(
  rows.length >= 6,
  `the ledger parsed only ${rows.length} rows: has its table format changed?`,
);
const complaints = [...ledgerComplaints(rows)];

const walk = (dir, accept, out = []) => {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, accept, out);
    else if (accept(p)) out.push(p);
  }
  return out;
};

// The surfaces that speak FOR the product: views, the intro and trust pages, the platform views, the shell strings, the
// brand, the section map and the home panels. Learning content (src/content, adventure worlds, book templates, games,
// word lists) is the text a learner practises on, so "research shows" in a mentor paragraph is not a product claim.
const CLAIM_SURFACE =
  /^access-practice-lab\/src\/(views\/|intro\/|platform\/views\/|strings\.js$|brand\.js$|sitemap\.js$|home[^/]*\.js$)/;
const jsFiles = walk(join(ROOT, "access-practice-lab/src"), (p) => p.endsWith(".js")).filter((p) =>
  CLAIM_SURFACE.test(relative(ROOT, p)),
);
const htmlFiles = [
  ...walk(
    join(ROOT, "access-practice-lab"),
    (p) => /(^|\/)(index|language-studios)\.html$/.test(p) && !/\/src\//.test(p),
  ),
  ...walk(join(ROOT, "wida-access"), (p) => p.endsWith("index.html")),
  ...walk(join(ROOT, "access-teacher"), (p) => p.endsWith("index.html")),
  ...walk(join(ROOT, "bcpss-teachers"), (p) => p.endsWith("index.html")),
  ...(existsSync(join(ROOT, "learning-studios/index.html"))
    ? [join(ROOT, "learning-studios/index.html")]
    : []),
];
assert.ok(
  jsFiles.length > 80,
  `swept only ${jsFiles.length} lab scripts: a sweep that found almost nothing proves nothing`,
);
assert.ok(htmlFiles.length >= 10, `swept only ${htmlFiles.length} public pages`);

const review = existsSync(REVIEW) ? JSON.parse(readFileSync(REVIEW, "utf8")).allowed || [] : [];
for (const r of review) {
  assert.ok(r.file && r.phrase, "review entry needs file and phrase");
  assert.ok(
    typeof r.reason === "string" && r.reason.trim().length >= 40,
    `${r.file}: a review reason under 40 characters is how an audit gets gamed`,
  );
}
const allowed = new Set(review.map((r) => `${r.file}::${r.phrase.toLowerCase()}`));
const hitKeys = new Set();

for (const f of jsFiles) {
  const src = readFileSync(f, "utf8");
  const rel = relative(ROOT, f);
  complaints.push(...tagComplaints(src, rel, rows));
  for (const h of phraseHits(src)) {
    const key = `${rel}::${h.phrase.toLowerCase()}`;
    hitKeys.add(key);
    if (!allowed.has(key)) complaints.push(`${rel}:${h.line}: "${h.phrase}" — ${h.text}`);
  }
}
for (const f of htmlFiles) {
  const src = readFileSync(f, "utf8");
  const rel = relative(ROOT, f);
  complaints.push(...tagComplaints(src, rel, rows));
  // The studios' own prose is public copy too; scripts (praise strings a learner is shown) are not scanned.
  const surface = /^wida-access\//.test(rel)
    ? `${htmlClaimSurface(src)}\n${htmlVisibleText(src)}`
    : htmlClaimSurface(src);
  for (const h of phraseHits(surface)) {
    const key = `${rel}::${h.phrase.toLowerCase()}`;
    hitKeys.add(key);
    if (!allowed.has(key)) complaints.push(`${rel}: page text says "${h.phrase}" — ${h.text}`);
  }
}
for (const s of staleReviewEntries(review, hitKeys))
  complaints.push(
    `data/language-page-claims-review.json: "${s.file}" / "${s.phrase}" no longer matches anything — delete the entry`,
  );

if (complaints.length) {
  console.error(`access-lab-claims: ${complaints.length} problem(s)`);
  for (const c of complaints.slice(0, 60)) console.error(`  FAIL  ${c}`);
  console.error(
    "\n  Fix the copy so it says only what docs/language-page/claims-ledger.md has verified, or — for a phrase that is NOT a claim about the product (a student phrase bank, a sample sentence) — add it to data/language-page-claims-review.json with a reason.",
  );
  process.exit(1);
}
console.log(
  `access-lab-claims: PASS (${rows.length} ledger rows, ${jsFiles.length} scripts and ${htmlFiles.length} pages swept, ${review.length} reviewed exception(s), 9 mutation self-tests)`,
);

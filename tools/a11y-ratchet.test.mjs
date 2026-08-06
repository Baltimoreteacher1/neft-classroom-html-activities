#!/usr/bin/env node
/**
 * The accessibility audit may only get better, never worse.
 *
 * `npm run audit:a11y` runs axe-core (WCAG 2.1 A/AA) over one representative
 * page per template and writes reports/a11y-audit.md. Today that report says
 * ZERO violations across 21 pages — which is a real result, and until now
 * nothing held it. The audit deliberately does not gate CI (see the header of
 * scripts/audit-a11y.mjs: findings need human judgement, and a hard gate on a
 * live URL gets muted the first time the network hiccups), so the only thing
 * standing between a clean sweep and a silent regression was whoever happened
 * to read the diff.
 *
 * This is the ratchet, and it works on the COMMITTED report rather than a live
 * browser, so it is deterministic and belongs in `npm test`. The contract:
 * re-running the audit and committing a WORSE report fails here, loudly, and
 * has to be an explicit decision — exactly the contract typecheck-ratchet and
 * math-acronyms already use. Lower the baselines whenever the numbers improve;
 * that is what locks a win in.
 *
 * What it deliberately does NOT claim: this cannot notice a regression nobody
 * has audited yet. The report only changes when someone runs the audit. The
 * live sweep in production-observability.yml is what surfaces drift on the
 * deployed site; this pins what we have already proven.
 *
 * The parser is self-tested BEFORE it is used, in both directions. A report
 * format change that quietly stopped matching would otherwise read as "no
 * violations found" forever — a gate that has stopped firing is worse than no
 * gate, because it reports success. So an unparseable report is a FAILURE
 * here, never a zero.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Lower these when the audit improves. Never raise them to make a run pass.
const MAX = { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 };
const MIN_PAGES = 21;

const SEVERITIES = ["critical", "serious", "moderate", "minor"];

/**
 * Pull the headline numbers out of reports/a11y-audit.md.
 *
 * Throws rather than returning zeros when a line is missing: "I could not find
 * the violation count" and "there were no violations" must never look alike.
 *
 * @param {string} md
 * @returns {{pages: number, total: number, critical: number, serious: number,
 *            moderate: number, minor: number}}
 */
export function parseA11yReport(md) {
  const text = String(md ?? "");

  const pages = text.match(/·\s*(\d+)\s+pages\s*·/);
  if (!pages) {
    throw new Error(
      "a11y report: could not find the '· N pages ·' line written by scripts/audit-a11y.mjs",
    );
  }

  // e.g. "**0** violations — critical 0, serious 0, moderate 0, minor 0."
  const headline = text.match(
    /\*\*(\d+)\*\*\s+violations\s+—\s+critical\s+(\d+),\s+serious\s+(\d+),\s+moderate\s+(\d+),\s+minor\s+(\d+)\./,
  );
  if (!headline) {
    throw new Error(
      "a11y report: could not find the '**N** violations — critical …' headline. If the " +
        "report format changed, update parseA11yReport AND its self-test below — do not " +
        "delete the assertion, or this gate silently passes forever.",
    );
  }

  return {
    pages: Number(pages[1]),
    total: Number(headline[1]),
    critical: Number(headline[2]),
    serious: Number(headline[3]),
    moderate: Number(headline[4]),
    minor: Number(headline[5]),
  };
}

// ── Self-test the parser BEFORE trusting it on the real report. ────────────
const CLEAN_FIXTURE = [
  "# Accessibility audit — 2026-08-06",
  "",
  "Target: `http://localhost:4501` · 21 pages · axe-core WCAG 2.1 A/AA",
  "",
  "**0** violations — critical 0, serious 0, moderate 0, minor 0.",
].join("\n");

const DIRTY_FIXTURE = [
  "# Accessibility audit — 2026-01-01",
  "",
  "Target: `https://eduwonderlab.com` · 30 pages · axe-core WCAG 2.1 A/AA",
  "",
  "**7** violations — critical 1, serious 2, moderate 3, minor 1.",
].join("\n");

assert.deepEqual(parseA11yReport(CLEAN_FIXTURE), {
  pages: 21,
  total: 0,
  critical: 0,
  serious: 0,
  moderate: 0,
  minor: 0,
});

// The negative control that matters most: a report WITH violations must parse
// as violations. A parser that only ever produced zeros would pass the clean
// fixture and pass the real report and never fail anything.
assert.deepEqual(parseA11yReport(DIRTY_FIXTURE), {
  pages: 30,
  total: 7,
  critical: 1,
  serious: 2,
  moderate: 3,
  minor: 1,
});

// An unparseable report is an error, never a silent zero.
assert.throws(() => parseA11yReport("# Accessibility audit\n\nnothing useful here"), /pages/);
assert.throws(
  () => parseA11yReport("Target: `x` · 21 pages · axe-core WCAG 2.1 A/AA"),
  /violations/,
);

// ── The ratchet itself. ────────────────────────────────────────────────────
const reportUrl = new URL("../reports/a11y-audit.md", import.meta.url);
let raw;
try {
  raw = readFileSync(reportUrl, "utf8");
} catch {
  assert.fail(
    "reports/a11y-audit.md is missing. Regenerate it with:\n" +
      "  npm run preview -- --port 4501 &  npm run audit:a11y -- --base http://localhost:4501",
  );
}

const report = parseA11yReport(raw);

assert.ok(
  report.pages >= MIN_PAGES,
  `a11y sample shrank: ${report.pages} pages audited, baseline is ${MIN_PAGES}. ` +
    "Shrinking the sample is not a way to reduce violations — every page template needs a " +
    "representative (tools/a11y-coverage.test.mjs pins that separately).",
);

for (const key of ["total", ...SEVERITIES]) {
  assert.ok(
    report[key] <= MAX[key],
    `a11y ${key} violations went UP: ${report[key]}, baseline is ${MAX[key]}.\n` +
      "Fix the violation, or — if the new finding is a deliberate, reviewed tradeoff — raise\n" +
      "the baseline in tools/a11y-ratchet.test.mjs in the SAME commit, with the reason.\n" +
      "See the 'By rule' table in reports/a11y-audit.md for what to fix.",
  );
}

console.log(
  `A11y ratchet passed: ${report.total} violations across ${report.pages} pages ` +
    `(baseline ${MAX.total} / ${MIN_PAGES}) · parser self-tested in both directions.`,
);

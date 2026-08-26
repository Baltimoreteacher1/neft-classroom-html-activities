#!/usr/bin/env node
/* ==========================================================================
 * validate-learn-slide-alignment.mjs — the problem the teacher projects is
 * the problem Learn It teaches.
 *
 * WHAT THE ARCHITECTURE ALREADY GUARANTEES, AND WHAT IT CANNOT SEE
 *
 * The projected whole-group deck (lessons/<id>/slides.html, and its editable
 * twin slides.pptx) and the in-lesson Learn It stepper both read the SAME
 * canonical field: launch.conceptIntro. The deck bakes iDo/weDo/youDo into a
 * committed page at generation time; the Learn It panel reads config.json at
 * runtime. That shared source is the right design — but it leaves exactly two
 * ways for a teacher to project 936 ÷ 4 while Learn It teaches 784 ÷ 7:
 *
 *   1. THE COMMITTED DECK GOES STALE OR IS SUBSTITUTED. slides.html is a
 *      second copy of the config. `generated-pages-fresh` byte-compares it
 *      against a regeneration, but that gate trusts the CURRENT generator —
 *      a generator edit that starts baking a different lesson field (or a
 *      different lesson's field) into the worked-example slide regenerates
 *      "fresh" and wrong. This gate reads the numbers out of the deck the
 *      repo actually ships and compares them with the config the panel will
 *      fetch, so it is independent of how either got there.
 *
 *   2. LEARN IT'S PRESENTATION LAYER INVENTS MATHEMATICS. The stepper
 *      transforms the authored lines (extractEquation display strips,
 *      parseKeyIdea formula tiles, splitGuidedLine ask/tell reveals). Its
 *      model test proves every decidable extracted equation is arithmetically
 *      TRUE — but "3 × 4 = 12" is true and still the wrong problem if the
 *      slide teaches 936 ÷ 4. Here every transformed artifact must draw its
 *      numbers from the very line it claims to present (multiset
 *      containment), so a true-but-foreign equation cannot reach the page.
 *
 * HOW EACH SECTION IS COMPARED
 *
 * The deck embeds `conceptData = { ido, wedo, youdo }` as JSON.stringify
 * output — machine-readable, no HTML scraping. Two layers per section:
 *
 *   - NUMBER FINGERPRINT: the multiset of normalized numeric tokens (1,344 →
 *     1344; 78.50 → 78.5; ½ → 1/2; 75% → 75; $5 → 5; 2² → 2^2) must match
 *     exactly. A mismatch prints both sides' numbers with the difference —
 *     "dividend: 936 ≠ 784" style evidence, not "some math differs".
 *
 *   - TEXT IDENTITY: because both surfaces derive from one field, the
 *     normalized instructional text must ALSO be identical. This is what
 *     holds the conceptual/diagram/statistics lessons (a "Math is…" worked
 *     example may state no numbers at all) to the same standard instead of
 *     exempting them: same task, same context, same words. Whitespace and
 *     entity differences are normalized away; wording is not.
 *
 * Variants (-group1/-group2/-catchup) are generated from the parent and are
 * not swept — auditing them repeats every parent finding and adds no fact
 * (same rule as validate:learn-it-scope).
 *
 * Self-tests run BEFORE the sweep — including the exact 936 ÷ 4 vs 784 ÷ 7
 * substitution this gate exists for — because a detector that has stopped
 * firing otherwise reports a perfectly aligned curriculum.
 * ========================================================================== */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractEquation, parseKeyIdea, splitGuidedLine } from "../engine/core/learn-step-model.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lessonsDir = path.join(root, "lessons");

/* ── numeric fingerprint ──────────────────────────────────────────────────── */

const VULGAR = {
  "½": "1/2",
  "⅓": "1/3",
  "⅔": "2/3",
  "¼": "1/4",
  "¾": "3/4",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
};
const SUPERS = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
};

/** Normalize one numeric token to a canonical spelling. */
function canonNumber(tok) {
  let t = tok.replace(/,/g, "").replace(/[%$]/g, "");
  if (/^\d+\.\d*0+$/.test(t)) t = t.replace(/0+$/, "").replace(/\.$/, "");
  else if (/^\d+\.0*$/.test(t)) t = t.replace(/\.0*$/, "");
  return t;
}

/**
 * The multiset of numeric tokens in a piece of instructional text.
 * Fractions stay fractions ("3/4"), superscript exponents become "base^exp",
 * mixed numbers stay two tokens (whole + fraction) on BOTH sides, so the
 * comparison is stable even where evaluation would be ambiguous.
 * @param {string} text
 * @returns {Map<string, number>}
 */
export function numberFingerprint(text) {
  let s = String(text || "");
  s = s.replace(/[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g, (c) => ` ${VULGAR[c]} `);
  s = s.replace(
    /(\d)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g,
    (_, base, sup) => `${base}^${[...sup].map((c) => SUPERS[c]).join("")}`,
  );
  const out = new Map();
  const re = /\d[\d,]*(?:\.\d+)?(?:\/\d+)?(?:\^\d+)?%?/g;
  for (const m of s.match(re) || []) {
    const key = canonNumber(m);
    out.set(key, (out.get(key) || 0) + 1);
  }
  return out;
}

/** Multiset difference report between two fingerprints; empty string = equal. */
export function fingerprintDiff(a, b) {
  const keys = new Set([...a.keys(), ...b.keys()]);
  const parts = [];
  for (const k of keys) {
    const ca = a.get(k) || 0;
    const cb = b.get(k) || 0;
    if (ca !== cb) parts.push(`${k}: ${ca}× vs ${cb}×`);
  }
  return parts.join(", ");
}

/** Is `part` a sub-multiset of `whole`? Returns the first excess token or null. */
export function firstExcessNumber(part, whole) {
  for (const [k, n] of part) {
    if ((whole.get(k) || 0) < n) return k;
  }
  return null;
}

/** Normalize instructional text for identity comparison across surfaces. */
export function normalizeText(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/* ── committed-deck reader ────────────────────────────────────────────────── */

/**
 * Pull one `lines: [...]` JSON array out of the deck's embedded conceptData.
 * The arrays are JSON.stringify output, so a string-aware bracket scan is a
 * complete parser for them.
 * @param {string} html
 * @param {"ido"|"wedo"|"youdo"} key
 * @returns {string[]|null} null when the section is absent (not an error by
 *   itself — the caller decides).
 */
export function readDeckSection(html, key) {
  const marker = new RegExp(`\\b${key}:\\s*\\{[^{]*?lines:\\s*\\[`);
  const m = marker.exec(html);
  if (!m) return null;
  const start = m.index + m[0].length - 1; // points at '['
  let depth = 0;
  let inStr = false;
  for (let i = start; i < html.length; i++) {
    const ch = html[i];
    if (inStr) {
      if (ch === "\\") i++;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "[") depth++;
    else if (ch === "]") {
      depth--;
      if (depth === 0) {
        try {
          const arr = JSON.parse(html.slice(start, i + 1));
          return Array.isArray(arr) ? arr.map(String) : null;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/* ── per-lesson audit ─────────────────────────────────────────────────────── */

const SECTIONS = [
  ["ido", "iDo", "Watch Me Solve It (Step 3)"],
  ["wedo", "weDo", "Try It With Me (Step 4)"],
  ["youdo", "youDo", "coaching lines"],
];

/**
 * Compare one lesson's committed deck against the config the Learn It panel
 * fetches, and hold the panel's own transformations to the authored numbers.
 * @param {string} id
 * @param {any} cfg
 * @param {string} deckHtml
 * @returns {{ failures: string[], conceptual: boolean }}
 */
export function auditLesson(id, cfg, deckHtml) {
  const failures = [];
  const ci = (cfg.launch && cfg.launch.conceptIntro) || cfg.conceptIntro || {};
  let numericTokens = 0;

  for (const [deckKey, cfgKey, label] of SECTIONS) {
    const cfgLines = ((ci[cfgKey] && ci[cfgKey].lines) || []).map(String);
    const deckLines = readDeckSection(deckHtml, deckKey);
    if (deckLines === null) {
      if (cfgLines.length) {
        failures.push(
          `${id} — deck has no ${deckKey} section but config authors ${cfgLines.length} ${cfgKey} lines (${label})`,
        );
      }
      continue;
    }

    const cfgText = normalizeText(cfgLines.join(" "));
    const deckText = normalizeText(deckLines.join(" "));
    const cfgFp = numberFingerprint(cfgText);
    const deckFp = numberFingerprint(deckText);
    for (const n of cfgFp.values()) numericTokens += n;

    const numDiff = fingerprintDiff(deckFp, cfgFp);
    if (numDiff) {
      failures.push(
        `${id} — Slides / Learn It ${label} teach different numbers\n` +
          `    Slides (${deckKey}):   ${[...deckFp.keys()].join(", ") || "(none)"}\n` +
          `    Learn It (${cfgKey}): ${[...cfgFp.keys()].join(", ") || "(none)"}\n` +
          `    Mismatch: ${numDiff}`,
      );
    } else if (cfgText !== deckText) {
      // Same numbers (or none at all — the conceptual lessons live here), but
      // the task itself differs. Both surfaces derive from one field, so any
      // wording drift means one of them is no longer showing that field.
      const at = firstTextDivergence(cfgText, deckText);
      failures.push(
        `${id} — Slides / Learn It ${label} wording diverged (same numbers, different task?)\n` +
          `    Slides:   …${deckText.slice(Math.max(0, at - 30), at + 50)}…\n` +
          `    Learn It: …${cfgText.slice(Math.max(0, at - 30), at + 50)}…`,
      );
    }
  }

  // The scenario ("Today's problem"). The lesson's Launch step prints
  // launch.narrative verbatim and the Learn It solve works it; the deck prints
  // the same field on its Scenario Launch slide, HTML-escaped. The committed deck must
  // therefore CONTAIN the normalized narrative — a deck telling a different
  // story than the strip that says "today's problem" is the scenario version
  // of the 936 ÷ 4 substitution.
  const narrative = normalizeText((cfg.launch && cfg.launch.narrative) || "");
  if (narrative) {
    const deckAll = normalizeText(deckHtml);
    if (!deckAll.includes(narrative)) {
      const narrFp = numberFingerprint(narrative);
      failures.push(
        `${id} — the deck's scenario is not the "Today's problem" Learn It opens with\n` +
          `    Learn It scenario: ${narrative.slice(0, 90)}…\n` +
          `    Scenario numbers:  ${[...narrFp.keys()].join(", ") || "(none)"} — not found verbatim in the committed deck`,
      );
    }
  }

  // The panel's transformations may reformat the projected problem but may
  // not surface numbers the problem does not state.
  const allLines = []
    .concat((ci.iDo && ci.iDo.lines) || [], (ci.weDo && ci.weDo.lines) || [])
    .map(String);
  for (const line of allLines) {
    const lineFp = numberFingerprint(line);
    const eq = extractEquation(line);
    if (eq) {
      const excess = firstExcessNumber(numberFingerprint(eq), lineFp);
      if (excess !== null) {
        failures.push(
          `${id} — Learn It equation strip invents a number the projected line never states\n` +
            `    Line:      ${line}\n    Extracted: ${eq}\n    Excess:    ${excess}`,
        );
      }
    }
  }
  for (const line of ((ci.weDo && ci.weDo.lines) || []).map(String)) {
    const g = splitGuidedLine(line);
    if (!normalizeText(line).startsWith(normalizeText(g.ask))) {
      failures.push(`${id} — guided split rewrote the ask: "${g.ask}" is not how "${line}" begins`);
    }
    const excess = firstExcessNumber(
      numberFingerprint(`${g.ask} ${g.tell}`),
      numberFingerprint(line),
    );
    if (excess !== null) {
      failures.push(`${id} — guided ask/tell invents "${excess}" not present in: ${line}`);
    }
  }
  const k = parseKeyIdea(ci.keyIdea || "");
  const keyFp = numberFingerprint(ci.keyIdea || "");
  for (const [what, text] of [
    ["formula", k.formula],
    ["example", k.example],
  ]) {
    const excess = firstExcessNumber(numberFingerprint(text), keyFp);
    if (excess !== null) {
      failures.push(
        `${id} — parsed keyIdea ${what} invents "${excess}" not present in the authored keyIdea`,
      );
    }
  }

  return { failures, conceptual: numericTokens < 4 };
}

function firstTextDivergence(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return n;
}

/* ── self-tests: the detectors must fire before the sweep is believed ─────── */

function selfTest() {
  const mkDeck = (ido, wedo) =>
    `<script>const conceptData = { ido: { title: "Watch me", lines: ${JSON.stringify(ido)} }, wedo: { title: "Together", lines: ${JSON.stringify(wedo)} }, youdo: { title: "You", lines: [] } };</script>`;
  const mkCfg = (ido, wedo, keyIdea = "") => ({
    launch: { conceptIntro: { keyIdea, iDo: { lines: ido }, weDo: { lines: wedo } } },
  });

  const cases = [];

  // 1. The exact substitution this gate exists for: projected 936 ÷ 4,
  //    Learn It teaching 784 ÷ 7. Must FAIL naming both dividends.
  {
    const deck = mkDeck(["I want 936 ÷ 4. I divide, multiply, subtract, bring down."], []);
    const cfg = mkCfg(["I want 784 ÷ 7. I divide, multiply, subtract, bring down."], []);
    const r = auditLesson("SELF-1", cfg, deck);
    cases.push([
      "substituted worked example fails with both numbers named",
      r.failures.length === 1 && /936/.test(r.failures[0]) && /784/.test(r.failures[0]),
    ]);
  }

  // 2. Conceptual drift with NO numbers on either side must still fail —
  //    conceptual lessons are text-compared, never exempt.
  {
    const deck = mkDeck(["Chefs plan menus and portion sizes."], []);
    const cfg = mkCfg(["Architects sketch floor plans to scale."], []);
    const r = auditLesson("SELF-2", cfg, deck);
    cases.push([
      "conceptual wording drift fails",
      r.failures.length === 1 && /wording diverged/.test(r.failures[0]),
    ]);
  }

  // 3. A stale deck missing a section the config authors must fail.
  {
    const deck = `<script>const conceptData = { youdo: { title: "You", lines: [] } };</script>`;
    const cfg = mkCfg(["Line."], []);
    const r = auditLesson("SELF-3", cfg, deck);
    cases.push([
      "deck missing an authored section fails",
      r.failures.some((f) => /no ido section/.test(f)),
    ]);
  }

  // 4. Containment: an artifact number absent from its source line is caught.
  {
    const excess = firstExcessNumber(numberFingerprint("12 × 3 = 36"), numberFingerprint("12 × 3"));
    cases.push(["containment detector sees the invented 36", excess === "36"]);
  }

  // 6. The scenario ("Today's problem"): a deck telling a different story
  //    than the one Learn It opens with must fail; the same story, HTML-
  //    escaped the way the deck prints it, must pass.
  {
    const cfgWithScenario = mkCfg(["Line."], []);
    cfgWithScenario.launch.narrative = "The client's patio has a base of 14 feet.";
    const deckWrongStory = mkDeck(["Line."], []) + `<p>A bakery sells 24 muffins.</p>`;
    const r1 = auditLesson("SELF-6a", cfgWithScenario, deckWrongStory);
    cases.push([
      "substituted scenario fails naming the Learn It story",
      r1.failures.length === 1 &&
        /Today's problem/.test(r1.failures[0]) &&
        /patio/.test(r1.failures[0]),
    ]);
    const deckSameStory =
      mkDeck(["Line."], []) + `<p>The client&#039;s patio has a base of  14 feet.</p>`;
    const r2 = auditLesson("SELF-6b", cfgWithScenario, deckSameStory);
    cases.push(["escaped same-story scenario passes", r2.failures.length === 0]);
  }

  // 5. Positive control: identical surfaces pass, including value-equal
  //    formatting differences the fingerprint must NOT flag (1,344 vs 1344,
  //    78.50 vs 78.5, ½ vs 1/2 — canonNumber/VULGAR territory).
  {
    const line = "So 1,344 ÷ 12 = 112 and ½ of 78.50 is the rest.";
    const deck = mkDeck([line], ["What is 5 × 4? (20)"]);
    const cfg = mkCfg([line], ["What is 5 × 4? (20)"]);
    const r = auditLesson("SELF-5", cfg, deck);
    cases.push(["aligned lesson passes clean", r.failures.length === 0]);
    const a = numberFingerprint("1,344 ÷ 12 and ½ of 78.50");
    const b = numberFingerprint("1344 ÷ 12 and 1/2 of 78.5");
    cases.push(["value-equal spellings fingerprint identically", fingerprintDiff(a, b) === ""]);
  }

  const failed = cases.filter(([, ok]) => !ok);
  if (failed.length) {
    console.error("SELF-TEST FAILURE — the alignment detectors are not firing:");
    for (const [name] of failed) console.error(`  ✗ ${name}`);
    process.exit(1);
  }
  console.log(`self-test: ${cases.length}/${cases.length} detectors fire`);
}

/* ── sweep ────────────────────────────────────────────────────────────────── */

function main() {
  selfTest();

  const ids = readdirSync(lessonsDir)
    .filter((d) => /^\d+-\d+$/.test(d))
    .sort((a, b) => {
      const [au, al] = a.split("-").map(Number);
      const [bu, bl] = b.split("-").map(Number);
      return au - bu || al - bl;
    });
  if (ids.length < 80) {
    console.error(
      `Expected the core fleet, found ${ids.length} lessons — refusing to report alignment on a partial sweep.`,
    );
    process.exit(1);
  }

  const allFailures = [];
  let aligned = 0;
  let conceptual = 0;
  for (const id of ids) {
    let cfg;
    let deck;
    try {
      cfg = JSON.parse(readFileSync(path.join(lessonsDir, id, "config.json"), "utf8"));
      deck = readFileSync(path.join(lessonsDir, id, "slides.html"), "utf8");
    } catch (e) {
      allFailures.push(`${id} — cannot read config/slides: ${e.message}`);
      continue;
    }
    const r = auditLesson(id, cfg, deck);
    if (r.failures.length) allFailures.push(...r.failures);
    else if (r.conceptual) conceptual++;
    else aligned++;
  }

  console.log(
    `learn↔slide alignment: ${ids.length} core lessons — ${aligned} numeric-aligned, ` +
      `${conceptual} conceptual (text-identical), ${allFailures.length} failure(s)`,
  );
  if (allFailures.length) {
    console.error("\nFAILURES:");
    for (const f of allFailures) console.error(`\nFAIL ${f}`);
    process.exit(1);
  }
  console.log("PASS — every projected worked/guided problem is the problem Learn It teaches.");
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();

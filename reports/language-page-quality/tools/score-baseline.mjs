#!/usr/bin/env node
/**
 * Baseline scoring: combines MEASURED scores (rules below, computed from inventory.json metrics and crawl-baseline.json)
 * with JUDGED scores and evidence kept in baseline-judgments.json (each judgment cites samples read).
 *
 *   node reports/language-page-quality/tools/score-baseline.mjs
 *
 * Output: baseline-scores.json { families: { <id>: { name, covers[], scores{A..K}, basis{}, evidence{} } } }
 *
 * Measured rules (each score also records the numbers it used):
 *   C directions   avg words<=12 and <=2% over 28 words -> 4; avg<=20 and <=8% over 28 -> 3; else 2. Capped at 4 (no measured
 *                  "states what success looks like" signal).
 *   G feedback     base from share of choice items that explain every wrong option and items with per-item feedback:
 *                  both >=95% and generic-correct <=3% -> 4; both >=80% -> 3; >=50% -> 2; else 1. -1 when hint==support on >15%
 *                  of items. Capped at 4 (5 needs a verified staged hint/retry/reveal sequence).
 *   H WIDA/ESOL    WIDA tag, vocabulary>=2, Spanish directions and Spanish feedback all >=95% and frames>=1 -> 4 (support
 *                  fading is not measurable statically, so 5 is never awarded); >=80% on all -> 3; else 2.
 *   I a11y         from crawl probes of the family: serious/critical axe -> 1 (>=3 probes) or 2; focus indicator not visible -> 2;
 *                  any target under 24px at 390 -> 2; any under 44px -> 3; else 4. Capped at 4 (5 needs zoom/reflow proof).
 *   F interaction  from crawl interaction states of the family: feedback-shown and retry offered on a wrong answer -> 4;
 *                  feedback-shown -> 3; terse/none/no check button -> 2. Capped at 4 (5 needs keyboard-only pass).
 *   A visual       any overflow at 390/768/1280 or console/page error -> cap 2; otherwise the judged value.
 * Judged dimensions (A, B, D, E, J, K and any override) come from baseline-judgments.json. A missing judgment leaves the
 * dimension unscored, never filled.
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve(import.meta.dirname, "..");
const readJson = (f) => { try { return JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8")); } catch { return null; } };
const inv = readJson("inventory.json");
const crawl = readJson("crawl-baseline.json");
const judg = readJson("baseline-judgments.json");
if (!inv || !judg) { console.error("inventory.json and baseline-judgments.json are required"); process.exit(1); }

const byFamCrawl = {};
for (const r of crawl?.results || []) (byFamCrawl[r.family] ||= []).push(r);
const fam = Object.fromEntries(inv.families.map((f) => [f.id, f]));
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

function measuredC(m) {
  if (!m) return null;
  const s = m.avgDirectionsWords <= 12 && m.directionsOver28Pct <= 2 ? 4 : m.avgDirectionsWords <= 20 && m.directionsOver28Pct <= 8 ? 3 : 2;
  return { v: s, ev: `avg ${m.avgDirectionsWords} words per direction; ${m.directionsOver28Pct}% exceed 28 words (n=${m.n})` };
}
function measuredG(m) {
  if (!m) return null;
  const dist = m.distractorFeedbackFullPct ?? 100, item = m.itemFeedbackPct ?? 100;
  let s = dist >= 95 && item >= 95 && m.genericCorrectPct <= 3 ? 4 : dist >= 80 && item >= 80 ? 3 : dist >= 50 && item >= 50 ? 2 : 1;
  if (m.hintEqualsSupportPct > 15) s -= 1;
  return { v: clamp(s, 1, 4), ev: `every-wrong-option feedback ${dist}%, per-item feedback ${item}%, generic correct ${m.genericCorrectPct}%, hint==support ${m.hintEqualsSupportPct}%` };
}
function measuredH(m) {
  if (!m) return null;
  const all = [m.widaTagPct, m.vocabGE2Pct, m.esDirectionsPct, m.esFeedbackPct ?? 100];
  const s = all.every((x) => x >= 95) && m.avgFrames >= 1 ? 4 : all.every((x) => x >= 80) ? 3 : 2;
  return { v: s, ev: `WIDA tag ${m.widaTagPct}%, vocab>=2 ${m.vocabGE2Pct}%, ES directions ${m.esDirectionsPct}%, ES feedback ${m.esFeedbackPct ?? "n/a"}%, frames avg ${m.avgFrames}` };
}
function crawlFor(ids) {
  const rs = ids.flatMap((id) => byFamCrawl[id] || []);
  return rs.length ? rs : null;
}
function measuredI(rs) {
  if (!rs) return null;
  const at = (r, w) => r.widths?.[w] || {};
  const serious = rs.filter((r) => (at(r, 390).axe?.serious || 0) + (at(r, 1280).axe?.serious || 0) > 0).length;
  const u24 = rs.filter((r) => at(r, 390).under24 > 0).length, u44 = rs.filter((r) => at(r, 390).under44 > 0).length;
  const focus = rs.filter((r) => r.interaction?.focusVisible === false).length;
  const noName = 0; // unnamed-button detection is left to axe (button-name rule); the crawler heuristic is advisory only
  let s = serious ? (serious >= 3 ? 1 : 2) : focus || noName ? 2 : u24 ? 2 : u44 ? 3 : 4;
  return { v: s, ev: `${rs.length} probe(s): serious/critical axe on ${serious}, focus not visible on ${focus}, unnamed buttons on ${noName}, targets <24px at 390 on ${u24}, <44px on ${u44}` };
}
function measuredF(rs) {
  if (!rs) return null;
  const acts = rs.filter((r) => r.interaction?.kind === "activity");
  if (!acts.length) {
    const pages = rs.filter((r) => r.interaction?.state);
    if (!pages.length) return null;
    const ok = pages.filter((r) => r.interaction.state === "cta-responded").length;
    return { v: ok ? 3 : 2, ev: `page probes: ${pages.map((r) => r.interaction.state).join(", ")} (no answer/feedback cycle driven)`, partial: true };
  }
  const fb = acts.filter((r) => r.interaction.state === "feedback-shown").length;
  const retry = acts.filter((r) => r.interaction.retryOffered).length;
  const emptyOk = acts.filter((r) => (r.interaction.emptyCheck?.newText || []).length || (r.interaction.emptyCheck?.live || []).length > 2).length;
  const s = fb === acts.length && retry ? 4 : fb ? 3 : 2;
  return { v: s, ev: `${acts.length} activity probe(s): feedback shown ${fb}, retry text ${retry}, empty-check message ${emptyOk}; states ${[...new Set(acts.map((r) => r.interaction.state))].join(", ")}` };
}

const families = {};
const missingJudgment = [];
for (const [id, j] of Object.entries(judg.entries)) {
  const covers = j.covers || [id];
  const met = covers.map((c) => fam[c]?.metrics).filter(Boolean);
  // merge core metrics when an entry covers several core families (weighted by n)
  const mm = met.length ? (met.length === 1 ? met[0] : null) : null;
  const rs = crawlFor(covers.concat(j.crawlFamilies || []));
  const scores = {}, basis = {}, evidence = {}, measuredSkipped = [];
  const put = (k, o, b) => { if (o && o.v) { scores[k] = o.v; basis[k] = b; evidence[k] = o.ev; } };
  put("C", measuredC(mm), "measured");
  put("G", measuredG(mm), "measured");
  put("H", measuredH(mm), "measured");
  put("I", measuredI(rs), "measured");
  put("F", measuredF(rs), "measured");
  for (const [k, v] of Object.entries(j.scores || {})) {
    const cur = scores[k];
    const val = typeof v === "object" ? v.v : v;
    if (cur && !j.override?.includes(k)) { evidence[k] += ` | judged ${val}: ${typeof v === "object" ? v.ev : ""} (measured value kept; judged value recorded here)`; continue; }
    scores[k] = val; basis[k] = cur ? "mixed" : "judged"; evidence[k] = (typeof v === "object" ? v.ev : "") + (cur ? ` | measured ${cur}: ${evidence[k]}` : "");
  }
  // A cap rule
  if (rs?.some((r) => Object.values(r.widths || {}).some((w) => w.overflowX) || r.consoleErrors?.length || r.pageErrors?.length) && scores.A > 2) {
    evidence.A += ` | capped at 2: overflow or console/page error observed in crawl`; scores.A = 2; basis.A = "mixed";
  }
  // P0 cap rule from RUBRIC rule 5
  if (j.p0) for (const k of ["A", "F", "G", "I"]) if (scores[k] > 2) { evidence[k] += ` | capped at 2: P0 ${j.p0}`; scores[k] = 2; }
  for (const k of "ABCDEFGHIJK") if (scores[k] === undefined) measuredSkipped.push(k);
  families[id] = { name: j.name || fam[id]?.title || id, covers, scores, basis, evidence, unscored: measuredSkipped, crawlProbes: rs?.length || 0 };
}
// coverage: every testable family must be covered by an entry
const covered = new Set(Object.values(families).flatMap((f) => f.covers));
const uncovered = inv.families.filter((f) => f.testable && !covered.has(f.id)).map((f) => f.id);
fs.writeFileSync(path.join(OUT, "baseline-scores.json"), JSON.stringify({
  schema: 1, basis: "Measured dimensions come from tools/score-baseline.mjs rules over inventory.json metrics and crawl-baseline.json; judged dimensions from baseline-judgments.json with cited samples.",
  baseline: inv.baseline, families, uncoveredTestableFamilies: uncovered,
}, null, 1) + "\n");
console.log(`scored ${Object.keys(families).length} entries; uncovered testable families: ${uncovered.length}${uncovered.length ? " -> " + uncovered.join(", ") : ""}`);
for (const [id, f] of Object.entries(families)) if (f.unscored.length) console.log(`  ${id}: unscored ${f.unscored.join("")}`);

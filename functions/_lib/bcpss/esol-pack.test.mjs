#!/usr/bin/env node
/**
 * Invariants for the BCPSS ESOL Power Pack (functions/_lib/bcpss/esol-pack.js).
 * Every unit in the canonical seed must produce a complete, deterministic, token-free pack,
 * and getUnitDetail must attach it on the seed backend.
 */
import assert from "node:assert/strict";
import { BCPSS_UNITS, UNIT_CONNECTIONS } from "../../../data/bcpss-curriculum-seed.mjs";
import { getUnitDetail } from "./db.js";
import { renderEsolPacketPage } from "./esol-packet-html.js";
import { buildEsolPack } from "./esol-pack.js";

const catalog = { units: BCPSS_UNITS, connections: UNIT_CONNECTIONS };
const TIERS = ["1_2", "3_4", "5_6"];
const SECTION_IDS = ["cognates", "doubleduty", "retrieval", "dictogloss", "infogap", "doctor", "ladder", "talkline", "passport", "glossary", "family"];
let checked = 0;

for (const unit of BCPSS_UNITS) {
  const connection = UNIT_CONNECTIONS.find((c) => c.unit_id === unit.id);
  const label = unit.id;
  const pack = buildEsolPack({ unit, connection, catalog });
  assert.ok(pack, `${label}: pack built`);
  assert.deepEqual(pack, buildEsolPack({ unit, connection, catalog }), `${label}: deterministic`);
  const json = JSON.stringify(pack);
  assert.ok(!/undefined|\{t\d?\}|\{frame\}|\{title\}|NaN/.test(json), `${label}: no unfilled tokens`);

  for (const t of TIERS) {
    assert.ok(pack.objectives.language[t]?.startsWith("Students will "), `${label}: language objective ${t}`);
    assert.ok(Object.keys(pack.passport[t]).length === 4, `${label}: passport ${t} has 4 domains`);
    assert.ok(pack.ladder.tiers[t].rungs.length >= 2, `${label}: ladder rungs ${t}`);
  }
  assert.equal(pack.week_plan.length, 5, `${label}: 5-day plan`);
  for (const day of pack.week_plan) for (const s of day.sections) assert.ok(SECTION_IDS.includes(s) || s === "routines", `${label}: unknown section ${s}`);
  assert.ok(pack.cognates.length >= 3, `${label}: >=3 cognate cards`);
  assert.ok(pack.double_duty.length >= 2, `${label}: >=2 double-duty words`);
  assert.ok(pack.dictogloss.word_count >= 20 && pack.dictogloss.word_count <= 75, `${label}: dictogloss length ${pack.dictogloss.word_count}`);
  assert.ok(pack.info_gap.card_a.knows.length >= 1 && pack.info_gap.card_b.knows.length >= 1, `${label}: info gap both cards`);
  assert.ok(pack.retrieval.length >= 3, `${label}: retrieval items`);
  for (const r of pack.retrieval) {
    assert.equal(r.options[r.answer_index], r.answer, `${label}: retrieval answer index`);
    assert.equal(new Set(r.options.map((o) => o.toLowerCase())).size, r.options.length, `${label}: retrieval options unique`);
  }
  for (const d of pack.doctor) {
    assert.ok(d.answer_index >= 0 && d.options.length === 3, `${label}: doctor ${d.id}`);
    assert.notEqual(d.options[d.answer_index], d.wrong, `${label}: doctor fix differs from error`);
  }
  assert.equal(pack.doctor.some((d) => d.id === "number-punctuation"), unit.subject === "Math", `${label}: number punctuation only in Math`);
  assert.ok(pack.routines.length >= 1, `${label}: subject routines`);
  checked += 1;
}

// getUnitDetail (seed backend) attaches the pack and the printable page renders it.
const { detail } = await getUnitDetail({}, "g4-ela-u2");
assert.equal(detail.esol_pack.unit_id, "g4-ela-u2");
const page = renderEsolPacketPage({ pack: detail.esol_pack, unit: detail.unit, wida: "3_4", esc: (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;"), pageNum: 7, totalPages: 8, runningImprint: "test" });
assert.ok(page.includes("5-Day Language Week") && page.includes("Info-Gap"), "packet page content");

// Cognate classifier: accents are folded so -tion ↔ -ción is detected.
const conv = buildEsolPack({
  unit: { id: "x", grade: "7", subject: "Science", unit_title: "T", unit_summary: "Students study T." },
  connection: { wida_klu: "Explain", unit_example_frame: "A because B.", scaffolds_json: {}, tier2_tier3_vocab: [{ term: "convection", tier: 3, cognate_es: "convección", kid_def: "Heat moves." }, { term: "school", tier: 1, cognate_es: "escuela", kid_def: "Place to learn." }, { term: "cell", tier: 2, cognate_es: null, kid_def: "Smallest living part." }] },
  catalog: { units: [], connections: [] },
});
assert.equal(conv.cognates[0].kind, "pattern");
assert.ok(conv.cognates[1].pronunciation?.includes("no “e”"), "s-cluster pronunciation tip");
assert.equal(conv.cognates[2].kind, "no-cognate");

console.log(`PASS: ESOL Power Pack invariants hold for ${checked} units`);

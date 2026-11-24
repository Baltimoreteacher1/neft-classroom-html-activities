#!/usr/bin/env node
// Re-runnable content audit for the BCPSS Teacher Studio (read-only).
// Builds every unit through the same path as GET /api/bcpss/units/:id (seed fallback, no DB)
// and writes docs/audit/inventory.json. Measures gaps G1-G9 from docs/ESOL_PREMIUM_BUILD.md.
//   node scripts/audit-bcpss-content.mjs            # write inventory + print summary
//   node scripts/audit-bcpss-content.mjs --check    # exit 1 when leak/dup counts are above zero

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { BCPSS_UNITS } from "../data/bcpss-curriculum-seed.mjs";
import { getUnitDetail } from "../functions/_lib/bcpss/db.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "docs/audit/inventory.json");
const CHECK = process.argv.includes("--check");

const MEDIA_RE = /\.(png|jpe?g|gif|webp|svg|mp3|ogg|wav|m4a)\b|<img\b|<audio\b|data:image\//i;
const BAD_TOKEN_RE = /\[slot\]|\{\w+\}|\bundefined\b|\bnull\b|\bNaN\b|\s{2,}(?=\S)/;
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const words = (s) => (String(s || "").match(/[A-Za-z']+/g) || []).length;
const bump = (map, key, n = 1) => map.set(key, (map.get(key) || 0) + n);

// Collect every string with its JSON path.
function* strings(value, path = "") {
  if (typeof value === "string") yield [path, value];
  else if (Array.isArray(value))
    for (const [i, v] of value.entries()) yield* strings(v, `${path}[${i}]`);
  else if (value && typeof value === "object")
    for (const [k, v] of Object.entries(value)) yield* strings(v, path ? `${path}.${k}` : k);
}

// Fields where the unit title legitimately appears (teacher-facing objectives, headers).
const TITLE_OK = /(^|\.)(title|unit_title|objectives\b|content|summary|heading|label|from)/;

const units = [];
const missions = new Map(); // normalized mission -> unit ids
const doctors = new Map(); // normalized error-doctor item -> unit ids
const doctorRuleSets = new Map();
const leaks = {
  cards_for: 0,
  steps_from: 0,
  talk_no_about: 0,
  title_in_esol_pack: 0,
  bad_token: 0,
};
let totalActivities = 0;
const domainMix = {};

for (const u of BCPSS_UNITS) {
  const { detail } = await getUnitDetail({}, u.id);
  if (!detail) continue;
  const title = String(detail.unit.unit_title || "").trim();
  const titleRe =
    title.length > 5 ? new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi") : null;
  const pack = detail.esol_pack || null;
  const studio = detail.studio || null;
  const acts = studio?.activities || detail.activities || [];
  const kinds = {};
  const media = [...strings(detail)].filter(([, s]) => MEDIA_RE.test(s)).length;

  for (const a of acts) {
    kinds[a.kind || a.activity_type || "?"] = (kinds[a.kind || a.activity_type || "?"] || 0) + 1;
    domainMix[a.domain] = (domainMix[a.domain] || 0) + 1;
  }
  totalActivities += acts.length;
  for (const a of acts)
    if (a.mission) {
      const k = norm(a.mission);
      const set = missions.get(k) instanceof Set ? missions.get(k) : new Set();
      set.add(u.id);
      missions.set(k, set);
    }

  let titleInsertions = 0;
  let cardsFor = 0;
  let stepsFrom = 0;
  let talkNoAbout = 0;
  let badToken = 0;
  if (pack) {
    for (const [path, s] of strings(pack)) {
      if (titleRe && !TITLE_OK.test(path)) titleInsertions += (s.match(titleRe) || []).length;
      if (/cards for\b/i.test(s) && titleRe && titleRe.test(s)) cardsFor++;
      titleRe && (titleRe.lastIndex = 0);
      if (/steps from\b/i.test(s) && titleRe && titleRe.test(s)) stepsFrom++;
      titleRe && (titleRe.lastIndex = 0);
      if (/\btalk (?!about\b|to\b|with\b|for\b)/i.test(s) && titleRe && titleRe.test(s))
        talkNoAbout++;
      titleRe && (titleRe.lastIndex = 0);
      if (BAD_TOKEN_RE.test(s)) badToken++;
    }
    const doc = pack.error_doctor || pack.doctor || null;
    const items = Array.isArray(doc) ? doc : doc?.items || [];
    const rule = items.map((i) => i.id).join("|");
    if (rule) bump(doctorRuleSets, rule);
    for (const i of items) {
      const k = norm(i.wrong);
      const set = doctors.get(k) || new Set();
      set.add(u.id);
      doctors.set(k, set);
    }
  }
  leaks.cards_for += cardsFor;
  leaks.steps_from += stepsFrom;
  leaks.talk_no_about += talkNoAbout;
  leaks.title_in_esol_pack += titleInsertions;
  leaks.bad_token += badToken;

  const reading = detail.reading || null;
  const bands = reading?.texts || null;
  units.push({
    id: u.id,
    grade: detail.unit.grade,
    subject: detail.unit.subject,
    curriculum: detail.unit.curriculum_name,
    has_lessons_key: Array.isArray(detail.lessons) || Array.isArray(studio?.lessons),
    keys: Object.keys(detail).sort(),
    esol_pack_keys: pack ? Object.keys(pack).sort() : [],
    activity_count: acts.length,
    activity_kinds: kinds,
    vocab_count: studio?.vocab?.length ?? null,
    reading_words: bands
      ? Object.fromEntries(Object.entries(bands).map(([k, v]) => [k, words(v)]))
      : null,
    reading_questions: reading?.questions?.length ?? null,
    media_refs: media,
    leaks: {
      cards_for: cardsFor,
      steps_from: stepsFrom,
      talk_no_about: talkNoAbout,
      title_in_esol_pack: titleInsertions,
      bad_token: badToken,
    },
  });
}

const repeated = (map, min) =>
  [...map.entries()]
    .filter(([, ids]) => ids.size >= min)
    .map(([text, ids]) => ({ text, units: ids.size }))
    .sort((a, b) => b.units - a.units);

const dupMissions = repeated(missions, 4);
const dupDoctor = repeated(doctors, 3);
const avg = (k) =>
  Math.round(
    units.filter((x) => x.reading_words?.[k]).reduce((a, x) => a + x.reading_words[k], 0) /
      units.length,
  );
const summary = {
  reading_avg_words: { "1_2": avg("1_2"), "3_4": avg("3_4"), "5_6": avg("5_6") },
  reading_question_counts: [...new Set(units.map((x) => x.reading_questions))],
  generated_at: new Date().toISOString(),
  units: units.length,
  activities_total: totalActivities,
  domain_mix: domainMix,
  units_with_lessons_key: units.filter((x) => x.has_lessons_key).length,
  units_with_media_refs: units.filter((x) => x.media_refs > 0).length,
  leaks,
  missions_reused_gt3_units: dupMissions.length,
  error_doctor_items_reused_gt2_units: dupDoctor.length,
  distinct_error_doctor_rule_sets: doctorRuleSets.size,
  top_repeated_missions: dupMissions.slice(0, 15),
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify({ summary, units }, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));
console.log(`wrote ${OUT}`);

const failing =
  leaks.cards_for +
  leaks.steps_from +
  leaks.talk_no_about +
  leaks.bad_token +
  dupMissions.length +
  dupDoctor.length;
if (CHECK && failing > 0) {
  console.error(`audit:content --check failed (${failing} issues)`);
  process.exit(1);
}

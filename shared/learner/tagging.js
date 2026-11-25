/**
 * Activity -> skill-node tagging. exercisesFor(activity, unit) is a pure, deterministic function of the
 * authored activity (kind, domain) and its unit (grade, key language use, standards, vocabulary).
 *
 * Rules (all tables below are the single source of truth; unknown values throw, never fall back):
 *  - language nodes: the activity's own domain (when it is one of the four language domains) plus the
 *    domains its kind exercises, at the unit's key language use (KLU), at the band the activity is pitched at.
 *  - pitch band: kind ladder tier (0 recognise, 1 guided, 2 extended) plus the grade band (K-2 0, 3-5 1, 6-8 2):
 *    sum <= 1 -> 1_2, 2 -> 3_4, >= 3 -> 5_6.
 *  - vocabulary nodes: every term of the unit for Vocabulary-domain activities, plus clue_game cards.
 *  - standard nodes: unit standards whose domain (SL listening+speaking, W and L writing, everything else reading
 *    and listening) intersects the activity's language domains.
 * KLU comes from the unit connection's wida_klu when present, otherwise from the blueprint id prefix
 * (narrate-, inform-, explain-, argue-); a unit with neither fails loudly.
 */
import { ACTIVITY_DOMAINS, ACTIVITY_KINDS, KLUS, LANG_DOMAINS } from "./constants.js";
import { langNodeId, standardNodeId, vocabNodeId, vocabSlug } from "./graph.js";

/** Languages domains each kind exercises, primary first. */
export const KIND_DOMAINS = Object.freeze({
  word_sort: ["reading"],
  match: ["reading"],
  cloze: ["reading", "writing"],
  unscramble: ["writing", "reading"],
  dictogloss: ["listening", "writing"],
  info_gap: ["speaking", "listening"],
  error_analysis: ["writing", "reading"],
  sentence_combine: ["writing"],
  quiz: ["reading"],
  talk_cards: ["speaking", "listening"],
  write_scaffold: ["writing"],
  sequence: ["reading"],
  clue_game: ["reading", "speaking"],
  read_annotate: ["reading"],
});

/** Ladder tier of each kind: 0 recognise, 1 guided production, 2 extended production. */
export const KIND_TIER = Object.freeze({
  word_sort: 0,
  match: 0,
  sequence: 0,
  quiz: 0,
  clue_game: 0,
  cloze: 1,
  unscramble: 1,
  dictogloss: 1,
  error_analysis: 1,
  talk_cards: 1,
  sentence_combine: 2,
  info_gap: 2,
  read_annotate: 2,
  write_scaffold: 2,
});

/**
 * Kinds the content pipeline DERIVES at load time (the Listening Lab: db/seeds/bcpss/v2/listening-lab.mjs) and that no
 * author writes, so they are not in ACTIVITY_KINDS or the content schema. Accepted only on an activity that carries
 * its `derived` marker, so an unknown hand-written kind still throws.
 */
export const DERIVED_KIND_DOMAINS = Object.freeze({ listen_and_show: ["listening"] });
export const DERIVED_KIND_TIER = Object.freeze({ listen_and_show: 0 });

const ELA_STANDARD = /^(RL|RI|RF|SL|W|L)\./;

export function gradeBandIndex(grade) {
  const g = String(grade).toUpperCase();
  if (g === "K") return 0;
  const n = Number(g);
  if (!Number.isInteger(n) || n < 1 || n > 8) throw new Error(`unknown grade "${grade}"`);
  return n <= 2 ? 0 : n <= 5 ? 1 : 2;
}

export function pitchBand(kind, grade) {
  const sum = (KIND_TIER[kind] ?? DERIVED_KIND_TIER[kind]) + gradeBandIndex(grade);
  return sum <= 1 ? "1_2" : sum === 2 ? "3_4" : "5_6";
}

/** Build a unit descriptor from a seed unit row, its connection row and its authored studio. */
export function describeUnit(unitRow, connectionRow, studio) {
  const raw = connectionRow?.wida_klu || String(connectionRow?.blueprint_id || "").split("-")[0];
  const klu = KLUS.find((k) => k.toLowerCase() === String(raw).toLowerCase());
  if (!klu) throw new Error(`unit ${unitRow.id}: cannot derive key language use from "${raw}"`);
  return {
    id: unitRow.id,
    grade: unitRow.grade,
    subject: unitRow.subject,
    unitNumber: unitRow.unit_number,
    klu,
    standards: [...unitRow.core_standards],
    vocab: (studio?.vocab || []).map((v) => v.term),
  };
}

const standardDomains = (code) =>
  ELA_STANDARD.test(code)
    ? code.startsWith("SL.")
      ? ["listening", "speaking"]
      : /^(W|L)\./.test(code)
        ? ["writing"]
        : ["reading"]
    : ["reading", "listening"];

function languageDomainsOf(activity) {
  const derivedOk = Boolean(activity.derived) && activity.kind in DERIVED_KIND_DOMAINS;
  if (!ACTIVITY_KINDS.includes(activity.kind) && !derivedOk) {
    throw new Error(`unknown activity kind "${activity.kind}"`);
  }
  if (!ACTIVITY_DOMAINS.includes(activity.domain)) {
    throw new Error(`unknown activity domain "${activity.domain}"`);
  }
  const own = LANG_DOMAINS.includes(activity.domain.toLowerCase())
    ? [activity.domain.toLowerCase()]
    : [];
  return [
    ...new Set([...own, ...(KIND_DOMAINS[activity.kind] ?? DERIVED_KIND_DOMAINS[activity.kind])]),
  ];
}

function assertUnit(unit) {
  if (!unit || !KLUS.includes(unit.klu))
    throw new Error(`unit ${unit?.id}: invalid key language use`);
  if (!Array.isArray(unit.standards) || !Array.isArray(unit.vocab)) {
    throw new Error(`unit ${unit.id}: standards and vocab arrays required`);
  }
}

/** @returns {string[]} sorted unique node ids this activity exercises (never empty). */
export function exercisesFor(activity, unit) {
  assertUnit(unit);
  const domains = languageDomainsOf(activity);
  const band = pitchBand(activity.kind, unit.grade);
  const ids = new Set(domains.map((d) => langNodeId(d, unit.klu, band)));
  if (activity.domain === "Vocabulary" || activity.kind === "clue_game") {
    for (const term of unit.vocab) ids.add(vocabNodeId(unit.id, term));
  }
  for (const code of unit.standards) {
    if (standardDomains(code).some((d) => domains.includes(d))) ids.add(standardNodeId(code));
  }
  return [...ids].sort();
}

export const activityId = (unit, index) => `${unit.id}:a${String(index + 1).padStart(2, "0")}`;

const ITEM_LISTS = {
  word_sort: (p) => p.items,
  match: (p) => p.pairs,
  cloze: (p) => p.answers,
  unscramble: (p) => p.items,
  dictogloss: (p) => p.checks,
  error_analysis: (p) => p.items,
  sentence_combine: (p) => p.items,
  quiz: (p) => p.items,
  talk_cards: (p) => p.cards,
  write_scaffold: (p) => p.structure,
  sequence: (p) => p.steps,
  clue_game: (p) => p.cards,
  read_annotate: (p) => p.questions,
  info_gap: (p) => [...(p.a?.has || []), ...(p.b?.has || [])],
};

const itemTerm = (kind, item) =>
  kind === "match"
    ? item.l
    : kind === "clue_game"
      ? item.term
      : kind === "cloze"
        ? item
        : item?.text;

/**
 * Per-item tagging. An item inherits the activity's language and standard nodes; vocabulary-bearing items
 * (match, word_sort, clue_game, cloze) narrow the vocabulary nodes to the term the item actually tests.
 */
export function itemsExercises(activity, unit, index) {
  const all = exercisesFor(activity, unit);
  const base = all.filter((id) => !id.startsWith("vocab."));
  const list = (ITEM_LISTS[activity.kind]?.(activity.payload || {}) || []).filter(Boolean);
  const bySlug = new Map(unit.vocab.map((t) => [vocabSlug(t), vocabNodeId(unit.id, t)]));
  const aId = activityId(unit, index);
  return list.map((item, i) => {
    const slug = vocabSlug(itemTerm(activity.kind, item) || "");
    const vocab = bySlug.get(slug);
    return {
      itemId: `${aId}#i${String(i + 1).padStart(2, "0")}`,
      exercises: vocab ? [...base, vocab].sort() : base,
    };
  });
}

/** Tag every activity of one unit: [{id, domain, kind, minutes, exercises}]. */
export function tagUnit(unit, studio) {
  return studio.activities.map((activity, i) => ({
    id: activityId(unit, i),
    unitId: unit.id,
    domain: activity.domain,
    kind: activity.kind,
    minutes: activity.minutes,
    exercises: exercisesFor(activity, unit),
  }));
}

/**
 * G-29 coverage: every tagged activity has >= 1 node, every exercised id exists in the graph, and no graph node
 * is orphaned (exercised by no activity). Returns findings; empty means pass.
 */
export function coverageFindings(graph, tagged) {
  const findings = [];
  const known = new Set(graph.nodes.map((n) => n.id));
  const used = new Set();
  for (const t of tagged) {
    if (!t.exercises?.length) findings.push({ code: "no-nodes", id: t.id });
    for (const id of t.exercises || []) {
      used.add(id);
      if (!known.has(id)) findings.push({ code: "unknown-node", id: t.id, node: id });
    }
  }
  for (const n of graph.nodes)
    if (!used.has(n.id)) findings.push({ code: "orphan-node", node: n.id });
  return findings;
}

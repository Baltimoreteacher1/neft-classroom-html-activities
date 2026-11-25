// Vocabulary tier rubric + repo-resident word-frequency list (audit F-14, decision D5).
// NOTHING here changes a tier. It produces a CANDIDATE file for Joel (data/language-page/tier-candidates.json).
//
// Tiers (Beck, McKeown & Kucan): 1 = everyday words, 2 = general academic words used across subjects,
// 3 = domain-specific words. The curriculum data only uses 2 and 3 (schemas/lesson.schema.json allows only 2|3).
//
// RUBRIC, per distinct SINGLE-word term (multi-word terms are not auto-assessed: a fixed compound such as
// "central idea" or "tape diagram" is judged by a teacher, not by counting its parts). Evidence is measured
// OUTSIDE the term's own unit(s), because inside them the term is used by construction:
//   F  cross-domain frequency   subjects (of 4) whose OTHER units' text uses the term (any inflection)
//   S  domain-specificity       taught as vocabulary in exactly one subject AND F <= 1
//   N  instructional need       the term appears in task language (sentence frames, exit-ticket prompts,
//                               activity prompts) of >= 3 other units, OR it is taught as vocabulary in
//                               >= 2 subjects
// Suggestion (suggested_tier is only ever 2 or 3, the tiers the data model has):
//   F >= 3 and N                    -> Tier 2, confidence "medium" (positive evidence: it is used and needed across subjects)
//   S                               -> Tier 3, confidence "low"    (ABSENCE of cross-domain evidence in a small corpus)
//   otherwise                       -> no recommendation ("insufficient evidence"), the current tier stands.
//   tier1_signal (a flag, not a tier): F >= 3, N, a K-2 term, and used in >= 30 other units. The schema has no
//   Tier 1, and hand checks showed academic words (claim, evidence, compare) also pass this test, so it only
//   says "worth a look", never "is Tier 1".
// Hand checks (see reports/phase4-data.md) found false positives the counts cannot see: homographs ("mean",
// "matter", "AM") and general words taught in one unit ("compassion", "generous", "explore") that look
// domain-specific only because this corpus never uses them elsewhere. Hence confidence "low" on every Tier 3 suggestion.
//
// WORD-FREQUENCY LIST (data/language-page/word-frequency.json): every word that occurs in >= 2 of the 162 units'
// text, with its token count and the ordinals of the units (and of the units' task language) that use it.
// LIMITS: the corpus is this repo's own ~170k tokens of K-8 EL practice text (readings, mentor sentences, frames,
// exit tickets, vocabulary definitions and examples, activity prompts). It is small, it is written AROUND each
// unit's vocabulary (so a word taught in one unit but valuable everywhere can look unit-specific), it has no
// spoken-language or trade-book text, and it is not a general frequency list such as SFI or COCA. Words found in
// fewer than 2 units are omitted, so "absent" means "unit-specific in this corpus", not "rare in English".
// Use the output to start a conversation about a word, not to settle it.

export const RUBRIC = {
  version: 1,
  crossDomainSubjects: 3,
  needTaskUnits: 3,
  needTaughtSubjects: 2,
  specificMaxSubjects: 1,
  tier1MinUnits: 30,
};

const strs = (x, out = []) => {
  if (typeof x === "string") out.push(x);
  else if (Array.isArray(x)) for (const y of x) strs(y, out);
  else if (x && typeof x === "object") for (const y of Object.values(x)) strs(y, out);
  return out;
};

/** The text of one unit, split into running text and task language. */
export function unitCorpus(detail) {
  const s = detail.studio;
  const running = [
    ...strs(detail.reading?.texts),
    s.mentor?.text,
    ...s.vocab.flatMap((v) => [v.def, v.example, v.nonexample]),
  ];
  const task = [
    ...strs(s.frames),
    s.exit_ticket?.prompt,
    s.exit_ticket?.model,
    ...detail.activities.flatMap((a) => [a.mission, a.student_prompt]),
  ];
  return { running: running.filter(Boolean), task: task.filter(Boolean) };
}

export const tokens = (text) =>
  (
    String(text)
      .toLowerCase()
      .match(/[a-z][a-z'’-]*/g) || []
  ).map((w) => w.replace(/['’]s$/, ""));

/** Inflected surface forms to look up for a term (mirrors bcpss-term-match.termRegex: s es ed d ing ly, plus -y -> -ies). */
export const formsOf = (word) => [
  word,
  `${word}s`,
  `${word}es`,
  `${word}ed`,
  `${word}d`,
  `${word}ing`,
  `${word}ly`,
  word.replace(/y$/, "ies"),
];

/** Build the shippable list from the 162 unit documents. */
export function buildWordFrequency(units) {
  const idx = new Map();
  const bump = (w, i, key) => {
    const e = idx.get(w) || { n: 0, u: new Set(), t: new Set() };
    if (key === "u") e.n += 1;
    e[key].add(i);
    idx.set(w, e);
  };
  units.forEach((detail, i) => {
    const { running, task } = unitCorpus(detail);
    for (const text of running) for (const w of tokens(text)) bump(w, i, "u");
    for (const text of task) for (const w of tokens(text)) bump(w, i, "t");
  });
  const words = {};
  for (const w of [...idx.keys()].sort()) {
    const e = idx.get(w);
    const all = new Set([...e.u, ...e.t]);
    if (all.size < 2) continue;
    words[w] = { n: e.n, u: [...all].sort((a, b) => a - b), t: [...e.t].sort((a, b) => a - b) };
  }
  return {
    meta: {
      rubric_version: RUBRIC.version,
      units: units.map((d) => d.unit.id),
      source:
        "unit readings, mentor sentences, vocabulary definitions/examples, sentence frames, exit tickets and activity prompts of the 162 BCPSS units",
      omitted: "words used in fewer than 2 units",
      limits:
        "small repo-resident corpus written around each unit's vocabulary; not a general-English frequency list; absent = unit-specific here, not rare in English",
    },
    words,
  };
}

/** Every (unit, term) row of the curriculum with its current tier. */
export function termRows(units) {
  return units.flatMap((d) =>
    d.connections[0].tier2_tier3_vocab.map((v) => ({
      unit: d.unit.id,
      subject: d.unit.subject,
      grade: d.unit.grade,
      term: v.term,
      tier: v.tier,
    })),
  );
}

const K2 = new Set(["K", "1", "2"]);

/** Candidates from the list + the current terms. Pure: same inputs, same output. */
export function buildCandidates(list, units) {
  const unitIds = list.meta.units;
  const subjectOf = new Map(units.map((d) => [d.unit.id, d.unit.subject]));
  const byTerm = new Map();
  for (const r of termRows(units)) {
    const k = r.term.toLowerCase();
    const e = byTerm.get(k) || { term: r.term, rows: [] };
    e.rows.push(r);
    byTerm.set(k, e);
  }
  const candidates = [];
  const counts = {
    terms: byTerm.size,
    multiword: 0,
    assessed: 0,
    candidates: 0,
    tier1Signals: 0,
    mixedTierTerms: 0,
    noRecommendation: 0,
  };
  for (const [key, e] of [...byTerm].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (/[\s-]/.test(key)) {
      counts.multiword += 1;
      continue;
    }
    counts.assessed += 1;
    const own = new Set(e.rows.map((r) => r.unit));
    const used = new Set();
    const task = new Set();
    for (const f of formsOf(key)) {
      const w = list.words[f];
      if (!w) continue;
      for (const i of w.u) if (!own.has(unitIds[i])) used.add(i);
      for (const i of w.t) if (!own.has(unitIds[i])) task.add(i);
    }
    const subjectsElsewhere = new Set([...used].map((i) => subjectOf.get(unitIds[i])));
    const taughtSubjects = new Set(e.rows.map((r) => r.subject));
    const F = subjectsElsewhere.size;
    const need =
      task.size >= RUBRIC.needTaskUnits || taughtSubjects.size >= RUBRIC.needTaughtSubjects;
    const specific = taughtSubjects.size === 1 && F <= RUBRIC.specificMaxSubjects;
    const k2 = e.rows.some((r) => K2.has(r.grade));
    let suggested = null;
    let confidence = null;
    let why = "";
    if (F >= RUBRIC.crossDomainSubjects && need) {
      suggested = 2;
      confidence = "medium";
      why = `used in ${used.size} other units across ${F} subjects; needed for tasks (task units ${task.size}, taught in ${taughtSubjects.size} subject(s))`;
    } else if (specific) {
      suggested = 3;
      confidence = "low";
      why = `taught in one subject only and used in ${F} subject(s) elsewhere (absence of evidence)`;
    }
    const tier1Signal = suggested === 2 && k2 && used.size >= RUBRIC.tier1MinUnits;
    if (tier1Signal) counts.tier1Signals += 1;
    const tiers = [...new Set(e.rows.map((r) => r.tier))].sort();
    if (tiers.length > 1) counts.mixedTierTerms += 1;
    if (suggested === null) {
      counts.noRecommendation += 1;
      continue;
    }
    const mismatched = e.rows.filter((r) => r.tier !== suggested);
    if (!mismatched.length && !tier1Signal) continue;
    counts.candidates += 1;
    candidates.push({
      term: e.term,
      current_tiers: tiers,
      suggested_tier: suggested,
      confidence,
      tier1_signal: tier1Signal,
      evidence: {
        other_units: used.size,
        subjects_elsewhere: F,
        task_units: task.size,
        taught_subjects: taughtSubjects.size,
      },
      why,
      units: (mismatched.length ? mismatched : e.rows).map((r) => ({
        unit: r.unit,
        grade: r.grade,
        current: r.tier,
      })),
      status: "candidate",
    });
  }
  return { candidates, counts };
}

/** {unitId: {term: tier}} snapshot used to prove nothing was re-tiered. */
export function tierSnapshot(units) {
  const out = {};
  for (const r of termRows(units)) (out[r.unit] ||= {})[r.term] = r.tier;
  return out;
}

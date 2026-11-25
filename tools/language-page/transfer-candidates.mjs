// Draft cross-subject-transfer candidates for units that have none (audit F-11).
//
// Today a unit's transfers are the OTHER-subject units of the SAME grade that share its blueprint_id (the language
// move). Units whose move is unique in their grade get none. This module proposes candidates for exactly those
// units from two signals, and marks every one DRAFT and queued for review (never "reviewed"):
//   klu    the other unit has the same WIDA key language use (Narrate / Inform / Explain / Argue)
//   vocab  words of this unit's vocabulary that the other unit's text uses, plus the reverse (any inflection;
//          same corpus and matching as the tier rubric)
// A candidate needs vocab >= 2 (klu only breaks ties: a hand check of the first version showed that klu plus one shared
// word produced mostly thin links). At most 2 per unit. A unit with no candidate is listed in
// `none` instead of being padded: absence of a defensible link is a result.
// Limits: word overlap is a weak proxy for a shared language move; it finds shared topics (habitat/ecosystem) better
// than shared syntax. A teacher decides. Same grade only, like the existing transfers.
import { formsOf, tokens, unitCorpus } from "./tier-rubric.mjs";

export const MIN_VOCAB = 2;
export const MAX_PER_UNIT = 2;

const vocabTerms = (d) => d.connections[0].tier2_tier3_vocab.map((v) => v.term.toLowerCase());
const wordSet = (d) => {
  const { running, task } = unitCorpus(d);
  return new Set([...running, ...task].flatMap(tokens));
};
const usedIn = (terms, words) =>
  terms.filter((t) => !/[\s-]/.test(t) && formsOf(t).some((f) => words.has(f)));

export function buildTransferCandidates(units) {
  const words = new Map(units.map((d) => [d.unit.id, wordSet(d)]));
  const out = {};
  const none = [];
  for (const d of units) {
    if (d.cross_subject_transfers.length) continue;
    const mine = vocabTerms(d);
    const klu = d.connections[0].wida_klu;
    const ranked = units
      .filter((o) => o.unit.grade === d.unit.grade && o.unit.subject !== d.unit.subject)
      .map((o) => {
        const sharedTerms = [
          ...new Set([
            ...usedIn(mine, words.get(o.unit.id)),
            ...usedIn(vocabTerms(o), words.get(d.unit.id)),
          ]),
        ].sort();
        const kluMatch = o.connections[0].wida_klu === klu;
        return { o, sharedTerms, kluMatch, score: sharedTerms.length + (kluMatch ? 1 : 0) };
      })
      .filter((c) => c.sharedTerms.length >= MIN_VOCAB)
      .sort((a, b) => b.score - a.score || (a.o.unit.id < b.o.unit.id ? -1 : 1))
      .slice(0, MAX_PER_UNIT);
    if (!ranked.length) {
      none.push(d.unit.id);
      continue;
    }
    out[d.unit.id] = ranked.map(({ o, sharedTerms, kluMatch, score }) => ({
      unit_id: o.unit.id,
      grade: String(o.unit.grade),
      subject: o.unit.subject,
      unit_number: Number(o.unit.unit_number),
      unit_title: o.unit.unit_title,
      basis: { shared_terms: sharedTerms, klu_match: kluMatch, score },
      status: "draft",
      review: { state: "draft", block: `${d.unit.id}:studio` },
    }));
  }
  return { units: out, none };
}

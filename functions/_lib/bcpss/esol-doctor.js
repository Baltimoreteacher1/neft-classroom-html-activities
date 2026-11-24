// "Language Doctor" items for the ESOL pack. Pure and deterministic.
//
// Every item is built from the unit's OWN authored sentences (exit-ticket model, mentor sentence,
// vocabulary examples, talk-card questions) by applying one mechanical learner error that is
// unambiguously wrong in English. The unit title is never pasted into a sentence. When a unit has no
// authored studio content (seed-only fallback) the items use the unit's vocabulary terms instead.

const hash = (s) => {
  let h = 2166136261;
  for (const ch of String(s)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return h;
};
const seededOrder = (list, seed) =>
  [...list]
    .map((item, i) => ({ item, k: hash(`${seed}:${i}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.item);
const stripEnd = (s) =>
  String(s || "")
    .trim()
    .replace(/[.!?]+$/, "");
const capFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const sentences = (text) =>
  String(text || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(
      (s) => s.split(/\s+/).length >= 5 && s.split(/\s+/).length <= 22 && !/[_[\]{}]/.test(s),
    );

const RULES = {
  "because-fragment": {
    rule: "“Because” starts a reason that must stay attached to the main idea. Do not put a period before it.",
    why: "Spanish “porque” and French “parce que” clauses are often spoken as separate answers; in written English that makes a fragment.",
  },
  "missing-be": {
    rule: "Every English sentence needs a verb. Use “is” or “are” to link a subject to its description.",
    why: "Arabic, Haitian Creole, Russian and Chinese often leave out “is/are” in this kind of sentence. English cannot.",
  },
  "dropped-subject": {
    rule: "Every English sentence needs a subject. Use “It” when there is no other subject.",
    why: "Spanish can drop the subject (“Es importante…”). English cannot.",
  },
  "do-support": {
    rule: "English questions with a verb need do / does / did before the subject.",
    why: "Spanish and French questions can just change tone or word order. English adds a helper verb.",
  },
  "number-punctuation": {
    rule: "U.S. English writes decimals with a point (3.5) and groups thousands with a comma (1,000).",
    why: "Many Spanish-speaking countries write 3,5 for decimals and 1.000 for thousands, the opposite of U.S. English.",
  },
  "talk-about": {
    rule: "Use “talk about” (not “talk” alone) before a topic.",
    why: "Spanish “hablar” often needs no preposition before the topic. English needs “about.”",
  },
  "third-person-s": {
    rule: "With he, she, it or one person, negative verbs use “doesn’t,” not “don’t.”",
    why: "Spanish verbs change endings for every person; English changes only a few, so “doesn’t” is easy to miss.",
  },
};

// ── Transforms over one authored, correct sentence ───────────────────────────

const becauseFragment = (s) => {
  const m = /^(.{12,}?),? because (.{8,})$/.exec(stripEnd(s));
  if (!m) return null;
  const [, a, b] = m;
  return {
    type: "because-fragment",
    wrong: `${a}. Because ${b}.`,
    right: `${a} because ${b}.`,
    decoys: [`${a} because, ${b}.`, `${a} and because ${b}.`],
  };
};

const missingBe = (s) => {
  const m =
    /^((?:The|A|An|This|That|These|Those|My|Our|Each|Every|One)\s(?:[\w'-]+\s){0,4}?[\w'-]+) (is|are) ((?:not )?[a-z].{8,})$/.exec(
      stripEnd(s),
    );
  if (!m) return null;
  const [, subj, be, rest] = m;
  if (/\b(that|who|which)$/i.test(subj)) return null;
  const other = be === "is" ? "are" : "is";
  return {
    type: "missing-be",
    wrong: `${subj} ${rest}.`,
    right: `${subj} ${be} ${rest}.`,
    decoys: [`${subj} be ${rest}.`, `${subj} ${other} ${rest}.`],
  };
};

const droppedSubject = (s) => {
  const m = /^It (is|was) (.{10,})$/.exec(stripEnd(s));
  if (!m) return null;
  const [, be, rest] = m;
  return {
    type: "dropped-subject",
    wrong: `${capFirst(be)} ${rest}.`,
    right: `It ${be} ${rest}.`,
    decoys: [`It ${rest}.`, `It are ${rest}.`],
  };
};

const doSupport = (s) => {
  const m = /^(What|Why|How|Where|When|Which) (do|does|did) (.{10,})\?$/.exec(String(s).trim());
  if (!m) return null;
  const [, wh, aux, rest] = m;
  return {
    type: "do-support",
    wrong: `${wh} ${rest}?`,
    right: `${wh} ${aux} ${rest}?`,
    decoys: [`${wh} ${rest} ${aux}?`, `${wh} ${aux} ${aux} ${rest}?`],
  };
};

const TRANSFORMS = [becauseFragment, missingBe, droppedSubject, doSupport];

// ── Math number punctuation: one distinct item per Math unit ─────────────────

const NUMBER_ITEMS = [
  ["ribbon", "meters long", "3,5", "1.000", "pesos"],
  ["rope", "meters long", "4,25", "2.500", "dollars"],
  ["table", "meters wide", "1,8", "3.200", "pesos"],
  ["garden", "meters wide", "6,75", "1.200", "dollars"],
  ["road", "kilometers long", "2,4", "5.000", "pesos"],
  ["board", "meters long", "0,6", "1.500", "dollars"],
  ["jar", "liters of water", "2,5", "4.000", "pesos"],
  ["bag", "kilograms", "7,5", "1.050", "dollars"],
  ["pool", "meters deep", "1,2", "9.000", "pesos"],
];
const GRADE_INDEX = { K: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8 };

function numberPunctuation(unit) {
  const slot = (GRADE_INDEX[String(unit.grade)] ?? 0) * 6 + (Number(unit.unit_number) || 1) - 1;
  const [thing, measure, dec, thou, money] = NUMBER_ITEMS[slot % NUMBER_ITEMS.length];
  const decRight = dec.replace(",", ".");
  const thouRight = thou.replace(".", ",");
  // The slot also picks one of several sentence shapes so 54 Math units never share a sentence.
  const shape = Math.floor(slot / NUMBER_ITEMS.length) % 6;
  const make = (d, t) =>
    [
      `The ${thing} is ${d} ${measure} and costs ${t} ${money}.`,
      `Our ${thing} measures ${d} ${measure}, and it costs ${t} ${money}.`,
      `The ${thing} in the store is ${d} ${measure}, and the price is ${t} ${money}.`,
      `A new ${thing} that is ${d} ${measure} costs ${t} ${money}.`,
      `My teacher says the ${thing} is ${d} ${measure} and costs ${t} ${money}.`,
      `Today we saw a ${thing} that is ${d} ${measure} and costs ${t} ${money}.`,
    ][shape];
  return {
    type: "number-punctuation",
    wrong: make(dec, thou),
    right: make(decRight, thouRight),
    decoys: [make(dec, thouRight), make(decRight, thou)],
  };
}

// ── Vocabulary fallbacks (used only when a unit has too few authored sentences) ─

const FALLBACKS = [
  (w) => ({
    type: "dropped-subject",
    wrong: `Is important to know what “${w}” means.`,
    right: `It is important to know what “${w}” means.`,
    decoys: [
      `Important is to know what “${w}” means.`,
      `It are important to know what “${w}” means.`,
    ],
  }),
  (w) => ({
    type: "do-support",
    wrong: `What “${w}” mean in this unit?`,
    right: `What does “${w}” mean in this unit?`,
    decoys: [`What “${w}” does mean in this unit?`, `What do “${w}” mean in this unit?`],
  }),
  (w) => ({
    type: "talk-about",
    wrong: `Let’s talk “${w}” with a partner.`,
    right: `Let’s talk about “${w}” with a partner.`,
    decoys: [`Let’s talk for “${w}” with a partner.`, `Let’s talk to “${w}” with a partner.`],
  }),
  (w) => ({
    type: "because-fragment",
    wrong: `I like this unit. Because we learn the word “${w}”.`,
    right: `I like this unit because we learn the word “${w}”.`,
    decoys: [
      `I like this unit because, we learn the word “${w}”.`,
      `I like this unit but because we learn the word “${w}”.`,
    ],
  }),
  (w) => ({
    type: "third-person-s",
    wrong: `My partner don’t understand “${w}” yet.`,
    right: `My partner doesn’t understand “${w}” yet.`,
    decoys: [`My partner not understand “${w}” yet.`, `My partner aren’t understand “${w}” yet.`],
  }),
];

function authoredSentences(studio) {
  if (!studio) return [];
  const out = [];
  if (studio.exit_ticket?.model) out.push(...sentences(studio.exit_ticket.model));
  if (studio.mentor?.text) out.push(...sentences(studio.mentor.text));
  for (const v of studio.vocab || []) out.push(...sentences(v.example));
  for (const a of studio.activities || [])
    if (a.kind === "talk_cards")
      for (const c of a.payload?.cards || [])
        out.push(...sentences(c.starter), ...sentences(c.follow_up));
  return [...new Set(out)];
}

export function buildDoctor(unit, vocab, studio) {
  const want = unit.subject === "Math" ? 3 : 4;
  const found = [];
  const usedTypes = new Set();
  const pool = seededOrder(authoredSentences(studio), `${unit.id}:doctor`);
  // Prefer one item per error type, in a stable priority order.
  for (const transform of TRANSFORMS) {
    for (const s of pool) {
      const made = transform(s);
      if (made && !usedTypes.has(made.type)) {
        found.push(made);
        usedTypes.add(made.type);
        break;
      }
    }
  }
  const terms = vocab.length ? vocab.map((v) => v.term) : ["word"];
  let i = 0;
  const fallbacks = seededOrder(FALLBACKS, unit.id);
  while (found.length < want && i < fallbacks.length) {
    const made = fallbacks[i](terms[(hash(unit.id) + i) % terms.length]);
    if (!usedTypes.has(made.type)) {
      found.push(made);
      usedTypes.add(made.type);
    }
    i += 1;
  }
  const items = seededOrder(found, `${unit.id}:order`).slice(0, want);
  if (unit.subject === "Math") items.push(numberPunctuation(unit));
  return items.map((made, order) => {
    const options = seededOrder([made.right, ...made.decoys], `${unit.id}:${made.type}`);
    return {
      id: made.type,
      error_type: made.type,
      rule: RULES[made.type].rule,
      why: RULES[made.type].why,
      wrong: made.wrong,
      options,
      answer_index: options.indexOf(made.right),
      order,
    };
  });
}

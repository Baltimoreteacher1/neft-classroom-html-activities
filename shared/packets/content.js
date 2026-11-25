// Mixed-band class packets: WHAT goes on every page, as plain data. Pure functions over a unit and its Studio content
// (db/seeds/bcpss/v2/units/<id>.mjs) and optional family guide; no layout, no I/O. The document builders in
// functions/_lib/bcpss/packet-*.js turn these specs into pages, and the tests compare the exported text to them.
//
// A student paper has ONE layout for every band (same sections, same row counts, same writing lines). Bands differ only
// in content: the practice mode of each word row, the sentence frames, and the help box.
import { BAND_LABEL, BANDS, NOT_A_SCORE } from "./bands.js";

export const WORD_CAP = 6; // words printed on a student paper (the full list is on the vocabulary cards)
export const EARLY_WORD_CAP = 4; // K-2 print at 14pt, so fewer rows keep every paper the same length
export const isEarly = (unit) => ["K", "1", "2"].includes(String(unit.grade));
export const FRAME_COUNT = 3; // sentence frames per paper (every unit authors at least 3 per band)
export const EXIT_LINES = 4; // writing lines under the exit ticket, the same for every band
export const DRAFT_TRANSLATION = "draft translation";

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The word as it appears in the sentence ("decompose" -> "decomposed"), or null. Falls back to the word stem ("property" -> "properties"). */
export function matchInSentence(sentence, term) {
  const exact = new RegExp(`\\b${escapeRe(term)}(?:s|es|d|ed|ing)?\\b`, "i").exec(sentence);
  if (exact) return exact;
  if (term.length < 5) return null;
  return new RegExp(`\\b${escapeRe(term.slice(0, -1))}\\w*`, "i").exec(sentence);
}

// How a band practises a word. The prefix is the only instruction a student sees; it never names a level.
const PRACTICE = {
  "1_2": {
    prefix: "Copy:",
    row: (v) => ({ text: v.example, answer: v.example }),
    note: "Copy a complete model sentence for each word.",
  },
  "3_4": {
    prefix: "Fill in:",
    row: (v) => {
      const m = matchInSentence(v.example, v.term);
      if (!m) return { text: v.example, answer: v.example, prefix: "Copy:" };
      const text = `${v.example.slice(0, m.index)}___${v.example.slice(m.index + m[0].length)}`;
      return { text, answer: m[0] };
    },
    note: "Fill the missing word in a model sentence.",
  },
  "5_6": {
    prefix: "Write:",
    row: (v) => ({
      text: "Write your own sentence with this word.",
      answer: v.example,
      sample: true,
    }),
    note: "Write an original sentence for each word.",
  },
};

const FRAME_NOTE = {
  "1_2": "Short, concrete sentence frames with one idea each.",
  "3_4": "Frames that give a reason or a step.",
  "5_6": "Longer frames that join ideas with connecting words.",
};

const connectorList = (studio) => (studio.connectors || []).slice(0, 4).join(", ");

// The help box above the exit-ticket lines.
const HELP = {
  "1_2": { lead: "Start with:", text: (s) => s.exit_ticket.frame },
  "3_4": { lead: "Join your ideas with:", text: connectorList },
  "5_6": { lead: "Try a longer sentence with:", text: connectorList },
};

export const BAND_SUPPORT = Object.freeze(
  Object.fromEntries(
    BANDS.map((b) => [
      b,
      [
        `Words: ${PRACTICE[b].note}`,
        `Frames: ${FRAME_NOTE[b]}`,
        "Help box: a starter or connecting words.",
      ],
    ]),
  ),
);

const subjectLine = (unit) =>
  `${String(unit.grade) === "K" ? "Kindergarten" : `Grade ${unit.grade}`} ${unit.subject}`;
const wordRows = (unit, studio) => studio.vocab.slice(0, isEarly(unit) ? EARLY_WORD_CAP : WORD_CAP);

/** The uniform student paper for one band. Everything outside `words[].practice`, `frames` and `exit.help` is band-free. */
export function paperSpec(unit, studio, band) {
  if (!BANDS.includes(band)) throw new Error(`unknown band "${band}"`);
  const p = PRACTICE[band];
  const help = HELP[band];
  return {
    title: unit.unit_title,
    subtitle: subjectLine(unit),
    goal: studio.can_do.language,
    words: wordRows(unit, studio).map((v) => {
      const row = p.row(v);
      return {
        term: v.term,
        def: v.def,
        practice: { prefix: row.prefix || p.prefix, text: row.text },
      };
    }),
    frames: studio.frames[`l${band}`].slice(0, FRAME_COUNT),
    exit: {
      prompt: studio.exit_ticket.prompt,
      help: { lead: help.lead, text: help.text(studio) },
      lines: EXIT_LINES,
    },
  };
}

const rubricOf = (e) => [
  { label: "Getting started", text: e.rubric.emerging },
  { label: "Almost there", text: e.rubric.developing },
  { label: "Got it!", text: e.rubric.proficient },
];

/** The teacher answer key: every variant's expected responses, exit-ticket model and rubric. Teacher-side labels allowed. */
export function keySpec(unit, studio, codes) {
  const e = studio.exit_ticket;
  return {
    title: unit.unit_title,
    subtitle: subjectLine(unit),
    variants: BANDS.map((band) => ({
      band,
      label: BAND_LABEL[band],
      code: codes[band],
      words: wordRows(unit, studio).map((v) => {
        const row = PRACTICE[band].row(v);
        return { term: v.term, response: row.sample ? `Sample: ${row.answer}` : row.answer };
      }),
      frames: studio.frames[`l${band}`].slice(0, FRAME_COUNT),
    })),
    exit: { prompt: e.prompt, model: e.model, rubric: rubricOf(e) },
    disclaimer: NOT_A_SCORE,
  };
}

/** One-page teacher cover sheet: which code is which group, and how many copies of each to print. */
export function coverSpec(unit, counts, codes) {
  const rows = BANDS.map((band) => ({
    code: codes[band],
    label: BAND_LABEL[band],
    students: counts[band] || 0,
    supports: BAND_SUPPORT[band],
  }));
  return {
    title: unit.unit_title,
    subtitle: subjectLine(unit),
    rows,
    total: rows.reduce((n, r) => n + r.students, 0),
    steps: [
      "Print each student paper once per student in its group. Every paper looks the same.",
      "Hand papers out face down or by seat. The small code at the bottom of a paper is the only mark.",
      "Keep this sheet and the answer key apart from the student stack.",
    ],
    disclaimer: NOT_A_SCORE,
  };
}

// ---- print kits (paper only) -----------------------------------------------------------------------------------
export function cardsSpec(studio, { esReviewed = false } = {}) {
  return studio.vocab.map((v) => ({
    term: v.term,
    pos: v.pos,
    def: v.def,
    es: v.es || "",
    esDraft: Boolean(v.es) && !esReviewed,
    note: v.es_note || "",
  }));
}

/** Sentence-frame strips by band. The strips carry only the opaque code; the cover sheet decodes it. */
export function stripsSpec(unit, studio, codes) {
  return {
    title: unit.unit_title,
    groups: BANDS.map((band) => ({
      code: codes[band],
      frames: studio.frames[`l${band}`].slice(0, FRAME_COUNT),
    })),
    connectors: studio.connectors || [],
  };
}

export function exitSpec(unit, studio) {
  const e = studio.exit_ticket;
  return {
    title: unit.unit_title,
    prompt: e.prompt,
    frame: e.frame,
    lines: isEarly(unit) ? 5 : 4,
    rubric: rubricOf(e),
  };
}

export const FAMILY_TALK_COUNT = 3;
const FAMILY_WORD_CAP = 6;

/** Bilingual one-page family sheet from the unit's family guide. The Spanish side is marked draft unless reviewed. */
export function familySpec(unit, studio, family, { esReviewed = false } = {}) {
  if (!family) throw new Error("family guide not authored for this unit");
  return {
    title: unit.unit_title,
    subtitle: subjectLine(unit),
    summary: family.summary,
    talk: family.talk.slice(0, FAMILY_TALK_COUNT),
    homeLanguage: family.home_language,
    words: studio.vocab.slice(0, FAMILY_WORD_CAP).map((v, k) => ({
      term: v.term,
      es: v.es || "",
      def: v.def,
      defEs: family.vocab[k]?.def_es || "",
    })),
    esDraft: !esReviewed,
  };
}

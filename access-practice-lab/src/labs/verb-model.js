// Verb Time Machine: the pure logic behind the time-travel scrubber. No DOM, no storage.
// A stop on the timeline is a tense; composeVerb builds the form, aspectOf says what shape the action has on the
// timeline, and breakIt shows a plausible mix-up and why the time clue disagrees with it.
import { verbForms } from "../lang/labs-check.js";

const PLURAL_NAMES = /^(maya|leo|ana)$/i;
export const isPlural = (subject) =>
  /^(we|they|you|i)$/i.test(subject) ||
  (/s$/.test(subject.split(" ").at(-1)) && !PLURAL_NAMES.test(subject));

export function composeVerb(subject, base, tense) {
  const f = verbForms(base);
  const pl = isPlural(subject);
  const be = subject.toLowerCase() === "i" ? "am" : pl ? "are" : "is";
  return {
    past: f.ed,
    present: pl ? f.base : f.s,
    "present-progressive": `${be} ${f.ing}`,
    "past-progressive": `${pl ? "were" : "was"} ${f.ing}`,
    "present-perfect": `${pl ? "have" : "has"} ${f.part}`,
    "past-perfect": `had ${f.part}`,
    future: `will ${f.base}`,
  }[tense];
}

/** Split a form into its helper (will, has, was…) and main verb, so the two can be drawn as separate tiles. */
export function formParts(form) {
  const m = String(form).match(/^(will|had|has|have|was|were|am|is|are) (.+)$/);
  return m ? { helper: m[1], main: m[2] } : { helper: "", main: String(form) };
}

/** How the action is shaped on the timeline, which decides the picture. */
export const ASPECT = {
  past: "point",
  "past-perfect": "earlier",
  "past-progressive": "stretch",
  "present-perfect": "link",
  present: "habit",
  "present-progressive": "now",
  future: "plan",
};

/** Where the time machine stands (0 = far past, 0.5 = now, 1 = far future) and a clock hour for the dial. */
export const POSITION = {
  "past-perfect": { at: 0.14, hour: 4 },
  past: { at: 0.27, hour: 5 },
  "past-progressive": { at: 0.37, hour: 8 },
  "present-perfect": { at: 0.5, hour: 10 },
  present: { at: 0.5, hour: 10 },
  "present-progressive": { at: 0.5, hour: 10 },
  future: { at: 0.8, hour: 2 },
};
export const phaseOf = (tense) => {
  const t = POSITION[tense]?.at ?? 0.5;
  return t < 0.45 ? "past" : t > 0.55 ? "future" : "now";
};

/** The sentence for a stop: cue + subject + form + rest. `text` is plain; parts feed the tiles. */
export function sentenceFor(cue, v, tense) {
  const form = composeVerb(v.subject, v.base, tense);
  const lead = cue.endsWith(",") ? v.subject : v.subject.replace(/^\w/, (c) => c.toUpperCase());
  const subject = lead;
  return {
    cue,
    subject,
    form,
    rest: v.rest,
    ...formParts(form),
    text: `${cue} ${subject} ${form} ${v.rest}.`.trim(),
  };
}

/** What a form tells a reader, and what each time clue asks for. Used by Break it. */
export const SAYS = {
  past: ["it is finished", "ya terminó"],
  present: ["it happens again and again", "pasa una y otra vez"],
  "present-progressive": ["it is happening right now", "está pasando ahora mismo"],
  "present-perfect": [
    "it started before and still connects to now",
    "empezó antes y todavía se conecta con ahora",
  ],
  "base-no-s": [
    "the verb does not agree with the person (he, she and it need ‑s)",
    "el verbo no concuerda con la persona (he, she e it necesitan ‑s)",
  ],
  "ing-no-helper": [
    "the ‑ing word has no helper (am, is, are), so the sentence is not complete",
    "la palabra ‑ing no tiene auxiliar (am, is, are), así que la oración no está completa",
  ],
};
export const MEANS = {
  "past-perfect": ["it happened before another past event", "pasó antes de otro suceso pasado"],
  past: ["it is finished", "ya terminó"],
  "past-progressive": ["it was in progress at that moment", "estaba en progreso en ese momento"],
  "present-perfect": [
    "it started in the past and still matters now",
    "empezó en el pasado y sigue importando ahora",
  ],
  present: ["it is a habit or a fact", "es un hábito o un hecho"],
  "present-progressive": ["it is happening this very moment", "está pasando en este mismo momento"],
  future: ["it has not happened yet", "todavía no ha pasado"],
};

/** The mix-up Break it shows for each stop. `kind` tells the explanation what went wrong. */
export function breakIt(tense, v) {
  const pl = isPlural(v.subject);
  const f = verbForms(v.base);
  const pick = {
    past: ["present", composeVerb(v.subject, v.base, "present"), "present"],
    "past-perfect": [
      "present-perfect",
      composeVerb(v.subject, v.base, "present-perfect"),
      "present-perfect",
    ],
    "past-progressive": [
      "present-progressive",
      composeVerb(v.subject, v.base, "present-progressive"),
      "present-progressive",
    ],
    "present-perfect": ["past", f.ed, "past"],
    present: pl ? ["ing-no-helper", f.ing, "ing-no-helper"] : ["base-no-s", f.base, "base-no-s"],
    "present-progressive": ["ing-no-helper", f.ing, "ing-no-helper"],
    future: ["past", f.ed, "past"],
  }[tense];
  const [kind, form, says] = pick;
  return { kind, form, says: SAYS[says], means: MEANS[tense] };
}

/** Every time the learner has visited, kept as a sorted unique list of stop indexes. */
export const visit = (list = [], at) =>
  list.includes(at) ? list : [...list, at].sort((a, b) => a - b);

/** Clamp a stop index to the stops of a band. */
export const clampStop = (at, stops, fallbackTense = "present") =>
  Number.isInteger(at) && at >= 0 && at < stops.length
    ? at
    : Math.max(0, stops.indexOf(fallbackTense));

/** Phrases of the mentor passage that carry the tense, so the reader can see them. */
export const MENTOR_MARKS = {
  "3-5": ["planted", "are pushing", "will measure"],
  "6-8": ["passed", "had dumped", "have planted", "will test", "have recovered"],
};

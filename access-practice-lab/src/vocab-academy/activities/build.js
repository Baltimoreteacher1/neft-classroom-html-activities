// Builders shared by the writing and speaking types: support payloads, band minimums, write/speak item shells.
import { hasForm, item, targetOf, wordExtras } from "./core.js";

export const byBand = (c, [upper, middle, high], early = upper) =>
  c.band === "early" ? early : c.band === "upper-elem" ? upper : c.band === "middle" ? middle : high;

/** Frames, word-bank phrases and sentence starters the SPEC §5 support flags switch on (the unit's wida block). */
export function supportPayload(c, word) {
  const wida = c.unit.wida || {};
  const frames = [word?.frame, ...(wida.frames || [])].filter(Boolean);
  const starters = [...new Set(frames.map((f) => f.split("___")[0].trim()).filter((s) => s.split(/\s+/).length >= 2))].slice(0, 4);
  return { frames, bank: wida.bank || [], starters };
}
export const unitWordsIn = (c, text) => c.words.filter((w) => hasForm(text, w));

const WRITE_STEPS = ["Read the prompt.", "Write your response.", "Check what the feedback noticed, then revise if you like."];
export function writeItem(c, f) {
  const { spec = {}, targets = [], word = c.word, ...rest } = f;
  return item(c, {
    ...(word ? wordExtras(c, word) : {}),
    ...supportPayload(c, word),
    directions: WRITE_STEPS,
    ...rest,
    targets,
    spec: { minWords: 1, ...spec, targets },
  });
}
export const targets = (words, opts) => words.map((w) => targetOf(w, opts));

export function speakItem(c, f) {
  const { word = c.word, ...rest } = f;
  return item(c, {
    ...(word ? wordExtras(c, word) : {}),
    ...supportPayload(c, word),
    directions: ["Read the prompt.", "Say your answer out loud or record it.", "Tick what you did."],
    record: true,
    minWords: 3,
    minChecks: 2,
    ...rest,
  });
}

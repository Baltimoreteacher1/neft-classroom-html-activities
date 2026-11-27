// One entry point for an `animation` block (see core/schema.js): the block's PRESET and plain values are expanded
// into an ordered list of FRAMES, each a still scene plus a plain caption. The player, the printed filmstrip, the Word
// file, the validator and the editor preview all call this file, so they can never disagree.
//
//   expandAnimation(block, { lang, suffix }) -> { ok: true, title, alt, explanation, frames, table }
//                                             | { ok: false, code, message, say: {en, es} }      (never throws)
//     frames[i] = { caption: {en, es}, alt, svg }    svg is drawn for `lang`; ids are unique through `suffix`
//     table     = { headers, rows } | null            the same facts as plain rows (Word, screen readers)
//   checkAnimation(block)   -> null | { code, message, say }
//   explainAnimation(error) -> { en, es }
//
// Everything is deterministic: the same values always give the same frames, and a value is only ever shown, never
// guessed. A preset that cannot be built (too few steps, a number that is not positive...) is refused in plain words.

import { anExplain, anFail } from "./animations-kit.js";
import { anGeometry, anRatio } from "./animations-math.js";
import { anCause, anProcess, anSentence, anTimeline, anWordBuild } from "./animations-text.js";

const AN_BUILD = {
  process: anProcess,
  timeline: anTimeline,
  "word-build": anWordBuild,
  "sentence-expand": anSentence,
  "cause-effect": anCause,
  "ratio-change": anRatio,
  "geometry-dims": anGeometry,
};

/** What an untitled animation is called, in both languages. */
const AN_TITLE = {
  process: ["Step-by-step process", "Proceso paso a paso"],
  timeline: ["Timeline", "Línea de tiempo"],
  "word-build": ["Building a word", "Cómo se forma la palabra"],
  "sentence-expand": ["Building a longer sentence", "Cómo crece una oración"],
  "cause-effect": ["Cause and effect", "Causa y efecto"],
  "ratio-change": ["A ratio that changes", "Una razón que cambia"],
  "geometry-dims": ["Changing the measurements", "Cambiando las medidas"],
};

const anSafeId = (s) => String(s ?? "a").replace(/[^A-Za-z0-9_-]/g, "") || "a";

export function expandAnimation(block, { lang = "en", suffix = "" } = {}) {
  const l = lang === "es" ? "es" : "en";
  try {
    const build = AN_BUILD[block?.preset];
    if (!build) anFail("unknown-preset", "That kind of animation is not available.", "Ese tipo de animación no está disponible.");
    const made = build(block.params ?? {});
    const base = anSafeId(suffix || block.id);
    const frames = made.frames.map((f, i) => {
      const drawn = f.draw(l, `${base}-f${i + 1}`);
      return { caption: f.caption, alt: drawn.alt, svg: drawn.svg };
    });
    const [titleEn, titleEs] = AN_TITLE[block.preset];
    const title = block.title || (l === "es" ? titleEs : titleEn);
    const n = frames.length;
    return {
      ok: true,
      title,
      alt: block.alt?.[l] || (l === "es" ? `Animación de ${n} pasos: ${title}.` : `Animation in ${n} steps: ${title}.`),
      explanation: block.explanation?.[l] || "",
      frames,
      table: made.table ? made.table(l) : null,
    };
  } catch (error) {
    if (error?.say) return { ok: false, code: error.code, message: error.message, say: error.say };
    return { ok: false, code: "cannot-build", message: "This animation could not be built.", say: anExplain(null) };
  }
}

export function checkAnimation(block) {
  const r = expandAnimation(block, { lang: "en", suffix: "check" });
  return r.ok ? null : { code: r.code, message: r.message, say: r.say };
}

/** The plain-word message of a refused animation, in both languages. */
export function explainAnimation(error) {
  return anExplain(error);
}

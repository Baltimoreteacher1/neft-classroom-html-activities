// Shared plumbing for the animation presets (x/animations.js): the error type, plain-text helpers, number words and
// the small SVG scenes the text presets draw. Pure functions, no DOM. Every name here starts with "an" because the
// player bundle puts all of x/ in one scope (tools/build-studio-player.mjs).
//
// A SCENE is one still picture of an animation: the player cross-fades from one scene to the next, so nothing in a
// scene moves by itself. All scenes of one animation share the same width and height, so the page never jumps.

import { plainMath, ratToString } from "../core/math.js";
import { COLOR, esc, f1, frame, line, text, textWidth, wrap } from "./diagram-kit.js";
import { renderDiagram } from "./diagram-render.js";
import { explainDiagram } from "./diagram-words.js";

export const AN_W = 480;
export const AN_TINT = "#dbeafe"; // a light blue that INK text sits on (contrast checked in the tests)
export const AN_GREY = "#6b7280";

/** Thrown for every input an animation refuses. `say` is the plain-word message in both languages. */
export class AnimationError extends Error {
  constructor(code, en, es) {
    super(en);
    this.name = "AnimationError";
    this.code = code;
    this.say = { en, es };
  }
}
export const anFail = (code, en, es) => {
  throw new AnimationError(code, en, es);
};

/** Teacher text as one plain line: math markup and **bold** markers become plain characters. */
export const anPlain = (s) =>
  plainMath(String(s ?? "").replace(/\*\*/g, ""))
    .replace(/\s+/g, " ")
    .trim();

/** `{en, es}` from one function of the language. */
export const anBoth = (fn) => ({ en: fn("en"), es: fn("es") });
export const anPick = (lang, en, es) => (lang === "es" ? es : en);
/** The text a screen reader hears for the step an image belongs to. */
export const anStep = (lang, i, n) => anPick(lang, `Step ${i} of ${n}`, `Paso ${i} de ${n}`);
/** A curly-quoted phrase. */
export const anQuote = (s) => `“${s}”`;

/** A number the way a student reads it: whole, decimal when it ends, otherwise a fraction; comma in Spanish. */
export function anNum(r, lang) {
  const s = ratToString(r, "decimal");
  return lang === "es" ? s.replace(".", ",") : s;
}

/** A year for a label (negative = BCE). */
export const anYear = (y, lang) => (y < 0 ? `${-y} ${lang === "es" ? "a. C." : "BCE"}` : String(y));

/** The ids inside one scene must be unique on a page: `id` is the prefix. */
export const anSafe = (id) => `an${String(id ?? "").replace(/[^A-Za-z0-9_-]/g, "")}`;

/** The standalone scene SVG (title = what a screen reader hears, desc = the step it belongs to). */
export function anScene({ id, h, alt, desc, lang, body, defs = "" }) {
  return frame({ p: anSafe(id), w: AN_W, h, title: alt, desc, lang, defs, body });
}

export const anRect = (
  x,
  y,
  w,
  h,
  { fill = COLOR.white, stroke = COLOR.ink, sw = 1.5, rx = 8, dash = "" } = {},
) =>
  `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;

/** Lines of text one under the other. Returns the SVG and the height used. */
export function anLines(x, y, lines, { size = 16, lh = size * 1.3, ...opts } = {}) {
  const svg = lines.map((s, i) => text(x, y + size + i * lh, s, { size, ...opts })).join("");
  return { svg, h: lines.length * lh };
}

export const anWrap = (s, max) => (s ? wrap(s, max) : []);

/** A round numbered (or ticked) badge. */
export function anBadge(cx, cy, n, state) {
  const on = state !== "todo";
  const mark =
    state === "done"
      ? `<path d="M${f1(cx - 7)} ${f1(cy)} l5 6 l9 -12" fill="none" stroke="${COLOR.white}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`
      : text(cx, cy + 6, String(n), {
          size: 16,
          anchor: "middle",
          weight: "700",
          fill: on ? COLOR.white : COLOR.muted,
        });
  return `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="15" fill="${on ? COLOR.blue : COLOR.white}" stroke="${on ? COLOR.blue : AN_GREY}" stroke-width="2"/>${mark}`;
}

/** A right-pointing arrow between two boxes. */
export const anArrow = (x1, x2, y) =>
  `${line(x1, y, x2 - 8, y, { width: 3 })}<polygon points="${f1(x2)},${f1(y)} ${f1(x2 - 12)},${f1(y - 7)} ${f1(x2 - 12)},${f1(y + 7)}" fill="${COLOR.ink}"/>`;

export { esc, textWidth };

/** One wave-1 figure (a diagram spec) drawn for a frame: `{ svg, alt }`, or an AnimationError in plain words. */
export function anDiagram(spec, lang, id) {
  const shown = renderDiagram({ spec }, { lang, suffix: id });
  if (!shown.ok) {
    const say = explainDiagram(shown);
    throw new AnimationError(shown.code, say.en, say.es);
  }
  return { svg: shown.svg, alt: shown.alt };
}

// ── plain-word messages ──────────────────────────────────────────────────────

/** The error message for a stage/row number ("Stage 3"). */
export const anWhich = (word, i) => ({ en: `${word.en} ${i + 1}`, es: `${word.es} ${i + 1}` });

/**
 * @param {{code?: string, message?: string, say?: {en: string, es: string}}} error  what expandAnimation returned
 * @returns {{en: string, es: string}}
 */
export function anExplain(error) {
  if (error?.say?.en) return error.say;
  return {
    en: "This animation could not be built. Check each value.",
    es: "Esta animación no se pudo crear. Revise cada valor.",
  };
}

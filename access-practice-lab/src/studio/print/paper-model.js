// The PAPER form of every question format, as plain data. Both the printable worksheet (worksheet.js) and the
// Word export (functions/_lib/studio/docx.js) read this, so a reprint is identical and the two files can never
// disagree about a letter, a scramble or a tick mark. Pure: no DOM, no network, no randomness (shuffles are
// seeded from ids).

import { marksOf, parseMarked, tableBlanks } from "../core/check.js";
import { plainMath } from "../core/math.js";
import { safeImageSrc } from "../core/schema.js";
import { expandAnimation } from "../x/animations.js";
import { renderDiagram } from "../x/diagram-render.js";

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** FNV-1a 32-bit. */
export function hashSeed(text) {
  let h = 0x811c9dc5;
  for (const ch of String(text)) {
    h ^= ch.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A deterministic shuffle of `list` seeded from `seed`. With two or more items the result is never the original
 * order (a scrambled list that prints already solved would be a giveaway).
 */
export function shuffled(list, seed) {
  const items = [...list];
  if (items.length < 2) return items;
  const base = hashSeed(seed);
  for (let attempt = 0; attempt < 8; attempt++) {
    const rand = mulberry32(base + attempt * 7919);
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (out.some((x, i) => x !== items[i])) return out;
  }
  return [...items.slice(1), items[0]];
}

export const seedFor = (activity, q, salt = "") => `${activity.id}:${q.id}:${salt}`;

// ── numbers for number lines and grids ───────────────────────────────────────

const trim = (n) => String(Number(Number(n).toFixed(6)));
const isWhole = (n) => Math.abs(n - Math.round(n)) < 1e-9;

/** Tick positions and labels for a number line. Labels are positions only: nothing here depends on the answer. */
export function numberLineModel(q) {
  const min = Number.isFinite(q.min) ? q.min : 0;
  const max = Number.isFinite(q.max) && q.max > min ? q.max : min + 10;
  let step = q.step > 0 ? q.step : 1;
  while ((max - min) / step > 40) step *= 2;
  const count = Math.round((max - min) / step);
  const ticks = [];
  for (let i = 0; i <= count; i++) {
    const v = min + i * step;
    const whole = isWhole(v);
    const labelEvery = count > 20 ? Math.ceil(count / 10) : 1;
    const labelled = i === 0 || i === count || (whole && (step >= 1 ? i % labelEvery === 0 : true));
    ticks.push({ v, i, label: labelled ? trim(v) : "", major: whole });
  }
  return { min, max, step, count, ticks };
}

/** Axis labels and size for a coordinate grid. Whole-number lattice only. */
export function plotModel(q) {
  const min = Math.floor(Number.isFinite(q.min) ? q.min : -5);
  let max = Math.ceil(Number.isFinite(q.max) ? q.max : 5);
  if (max <= min) max = min + 10;
  const span = max - min;
  const every = span > 20 ? 5 : span > 10 ? 2 : 1;
  const values = [];
  for (let v = min; v <= max; v++)
    values.push({ v, label: v % every === 0 || v === min ? trim(v) : "" });
  return {
    min,
    max,
    span,
    every,
    values,
    axisX: min <= 0 && max >= 0,
    axisY: min <= 0 && max >= 0,
  };
}

// ── diagram blocks ───────────────────────────────────────────────────────────

/**
 * A `diagram` block as paper needs it, redrawn from its spec: the figure in English ("en", "bi") or Spanish ("es"),
 * its natural width in points (one drawing unit is 0.75pt, so labels print at about their designed size), the
 * caption (plus the Spanish caption when bilingual), and the data table the Word file prints as editable cells.
 * A diagram never carries an answer, so the same model serves the student sheet and the Word file.
 * @returns {{ok:false}|{ok:true, svg:string, widthPt:number, alt:string, caption:string, captionEs:string, table:{headers:string[], rows:string[][]}}}
 */
export function diagramPaper(block, lang) {
  const shown = renderDiagram(block, { lang: lang === "es" ? "es" : "en", suffix: block.id });
  if (!shown.ok) return { ok: false };
  const width = Number(/^<svg[^>]*\swidth="([\d.]+)"/.exec(shown.svg)?.[1]) || 480;
  let captionEs = "";
  if (lang === "bi") {
    const es = renderDiagram(block, { lang: "es", suffix: block.id });
    if (es.ok && es.caption !== shown.caption) captionEs = es.caption;
  }
  return {
    ok: true,
    svg: shown.svg,
    widthPt: Math.round(width * 0.75),
    alt: shown.alt,
    caption: shown.caption,
    captionEs,
    table: shown.table,
  };
}

// ── per-format paper models ──────────────────────────────────────────────────

export const choiceModel = (q) =>
  q.options.map((o, i) => ({ id: o.id, letter: LETTERS[i], text: o.text }));

export function matchModel(activity, q) {
  const left = q.pairs.map((p, i) => ({ id: p.id, n: i + 1, text: p.left }));
  const right = shuffled(q.pairs, seedFor(activity, q, "match")).map((p, i) => ({
    id: p.id,
    letter: LETTERS[i],
    text: p.right,
  }));
  return { left, right };
}

export function sortModel(activity, q) {
  const bank = shuffled(q.items, seedFor(activity, q, "sort")).map((it, i) => ({
    id: it.id,
    n: i + 1,
    text: it.text,
  }));
  const perColumn = Math.max(
    1,
    ...q.categories.map((c) => q.items.filter((i) => i.category === c.id).length),
  );
  return { categories: q.categories, bank, rows: Math.min(8, perColumn + 1) };
}

export function orderModel(activity, q) {
  const items = shuffled(q.items, seedFor(activity, q, "order")).map((it, i) => ({
    id: it.id,
    letter: LETTERS[i],
    text: it.text,
  }));
  const letterOf = new Map(items.map((i) => [i.id, i.letter]));
  return { items, slots: q.items.length, correct: q.items.map((i) => letterOf.get(i.id)) };
}

export function buildModel(activity, q) {
  return { cards: shuffled(q.words, seedFor(activity, q, "build")), slots: q.words.length };
}

export function blankModel(activity, q) {
  const parts = parseMarked(q.text).map((s) =>
    s.t === "text" ? s : { t: "blank", n: 0, answers: s.answers },
  );
  let n = 0;
  for (const p of parts) if (p.t === "blank") p.n = ++n;
  const bank = q.bank
    ? shuffled(
        marksOf(q.text).map((m) => m.answers[0]),
        seedFor(activity, q, "bank"),
      )
    : [];
  return { parts, bank };
}

/** The printed passage for `identify`: markers removed, text unchanged. */
export const identifyText = (q) =>
  parseMarked(q.text)
    .map((s) => (s.t === "text" ? s.v : s.answers[0]))
    .join("");

export function hotspotModel(q) {
  const regions = q.regions.map((r, i) => ({ ...r, letter: LETTERS[i] }));
  return { image: q.image?.src ? safeImageSrc(q.image.src) : "", alt: q.image?.alt || "", regions };
}

export function fillTableModel(q) {
  return {
    headers: q.headers,
    rows: q.rows.map((row) =>
      row.map((c) => (c && typeof c === "object" ? { blank: true } : { text: c })),
    ),
  };
}

/** Ruled lines for a writing response. */
export function writingLines(q, workspace) {
  const base = q.kind === "explain" ? 5 : 3;
  const fromWords = Math.ceil((q.minWords || 0) / 7);
  return Math.min(12, Math.max(base, fromWords) + (workspace === "roomy" ? 2 : 0));
}

// ── the key, in paper terms ──────────────────────────────────────────────────

/**
 * The answer for each question as an array of markup lines, written in the same letters and numbers the paper
 * version printed (so "B" really is the second scrambled choice).
 */
export function keyLines(activity, q) {
  switch (q.format) {
    case "choice": {
      const o = choiceModel(q).find((x) => x.id === q.answer);
      return o ? [`${o.letter}. ${o.text}`] : [];
    }
    case "multi":
      return choiceModel(q)
        .filter((o) => q.answers.includes(o.id))
        .map((o) => `${o.letter}. ${o.text}`);
    case "match": {
      const m = matchModel(activity, q);
      return m.left.map((l) => {
        const r = m.right.find((x) => x.id === l.id);
        return `${l.n}. ${l.text} → ${r.letter}. ${r.text}`;
      });
    }
    case "sort":
      return q.categories.map(
        (c) =>
          `${c.label}: ${
            q.items
              .filter((i) => i.category === c.id)
              .map((i) => i.text)
              .join(", ") || "—"
          }`,
      );
    case "order": {
      const m = orderModel(activity, q);
      return [`${m.correct.join(", ")}`, ...q.items.map((it, i) => `${i + 1}. ${it.text}`)];
    }
    case "blank":
      return marksOf(q.text).map((m, i) => `${i + 1}. ${m.answers.join(" / ")}`);
    case "number":
    case "numberline":
    case "hotspot":
    case "build":
    case "plot":
      return [keyScalar(q)];
    case "short":
      return q.sample ? [q.sample] : [];
    case "identify":
      return [
        marksOf(q.text)
          .map((m) => m.answers[0])
          .join(", "),
      ];
    case "error": {
      const step = q.steps.findIndex((s) => s.id === q.errorStep);
      const fix = q.fixOptions.findIndex((o) => o.id === q.fixAnswer);
      return [
        `Step ${step + 1}: ${q.steps[step]?.text ?? ""}`,
        fix >= 0 ? `${LETTERS[fix]}. ${q.fixOptions[fix].text}` : "",
      ].filter(Boolean);
    }
    case "fillTable":
      return tableBlanks(q).map((c) => {
        const [r, k] = c.key.split(":").map(Number);
        return `${q.headers[k] || `col ${k + 1}`}, row ${r + 1}: ${c.answer}`;
      });
    default:
      return [];
  }
}

function keyScalar(q) {
  switch (q.format) {
    case "number": {
      const base = q.answer || "";
      return (
        `${base}${q.unit ? ` ${q.unit}` : ""}`.trim() +
        (q.accept.length ? ` (also accept ${q.accept.join(", ")})` : "")
      );
    }
    case "numberline":
      return `${q.answer}`;
    case "hotspot": {
      const r = hotspotModel(q).regions.find((x) => x.id === q.answer);
      return r ? `${r.letter}. ${r.label}` : "";
    }
    case "build":
      return q.words.join(" ");
    case "plot":
      return q.points.map((p) => `(${p.x}, ${p.y})`).join("  ");
    default:
      return "";
  }
}

/** Plain-text key line for the Word key and the print tests. */
export const keyPlain = (activity, q) => keyLines(activity, q).map(plainMath);

// ── animation blocks ─────────────────────────────────────────────────────────

const ANIMATION_WIDE = 560; // a figure drawn wider than this (the timeline) gets the full line on paper

/**
 * An `animation` block as paper needs it: the title, the teacher's explanation and one entry per frame (its figure,
 * its width in points, its caption and, when bilingual, the Spanish caption). Paper has no motion, so the frames
 * become a numbered filmstrip; the Word file prints the same captions as an editable numbered list. No answers.
 * @returns {{ok:false}|{ok:true, title:string, titleEs:string, explanation:string, explanationEs:string, alt:string, frames:Array<{svg:string, widthPt:number, wide:boolean, caption:string, captionEs:string, alt:string}>, table:null|{headers:string[], rows:string[][]}}}
 */
export function animationPaper(block, lang) {
  const l = lang === "es" ? "es" : "en";
  const shown = expandAnimation(block, { lang: l, suffix: block.id });
  if (!shown.ok) return { ok: false };
  const bi = lang === "bi";
  const es = bi ? expandAnimation(block, { lang: "es", suffix: block.id }) : null;
  const { en: exEn = "", es: exEs = "" } = block.explanation ?? {};
  const explanation = l === "es" ? exEs || exEn : exEn || exEs;
  return {
    ok: true,
    title: shown.title,
    titleEs: es?.ok && es.title !== shown.title ? es.title : "",
    explanation,
    explanationEs: bi && exEn && exEs && exEs !== exEn ? exEs : "",
    alt: shown.alt,
    frames: shown.frames.map((f) => {
      const width = Number(/^<svg[^>]*\swidth="([\d.]+)"/.exec(f.svg)?.[1]) || 480;
      return {
        svg: f.svg,
        widthPt: Math.min(504, Math.round(width * 0.75)),
        wide: width > ANIMATION_WIDE,
        caption: f.caption[l],
        captionEs: bi && f.caption.es !== f.caption.en ? f.caption.es : "",
        alt: f.alt,
      };
    }),
    table: shown.table,
  };
}

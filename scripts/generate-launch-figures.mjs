#!/usr/bin/env node
/**
 * generate-launch-figures.mjs — draw the opening problem, only where the
 * narrative says enough to draw it truthfully.
 *
 * 73 of 84 launch problems open as text with no picture. The eleven that have
 * one carry a PNG lifted from the Reveal textbook; those cannot be authored
 * here and are left alone.
 *
 * The rule this file is built around is the repo's own, from
 * validate:learn-figures: a picture that disagrees with the paragraph is worse
 * than no picture, because a student trusts the picture. So every reader below
 * is a strict pattern match over the lesson's OWN launch.narrative, every
 * number the figure prints is a number that narrative states, and a lesson
 * whose narrative does not clearly state its quantities gets NOTHING and is
 * named in the report. Silence is the correct output for an unclear problem.
 *
 * Why not reuse workedFigure() from scripts/lib/learn-figures.mjs: its readers
 * are tuned for launch.conceptIntro.iDo.lines, which are terse mathematical
 * statements ("Area = 1/2 x 12 x 7"). Narratives are prose. Measured against
 * the 73, those readers match 6. These read prose instead, and the SVG comes
 * from tools/mstar-worksheet-engine/lib/svg-manipulatives.mjs so there is one
 * set of manipulative renderers in the repo, not two.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderBalanceScaleSvg,
  renderDotPlotSvg,
  renderFractionDivisionModelSvg,
  renderNumberLineSvg,
  renderParallelogramDecompSvg,
  renderTriangleDecompSvg,
  renderVerticalNumberLineSvg,
} from "../tools/mstar-worksheet-engine/lib/svg-manipulatives.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/* ── readers ──────────────────────────────────────────────────────────────
 * Each returns {kind, svg, alt, values} or null. `values` is every number the
 * figure prints; the caller asserts each one appears in the narrative, so a
 * reader cannot introduce a quantity the student never read.
 */

/** "The equation is n + 23 = 58." or "3x = 21" — a one-step equation stated outright. */
export function readEquation(text) {
  const add = text.match(/\b([a-z])\s*([+\-])\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/i);
  if (add) {
    const [, v, op, a, b] = add;
    const left = `${v} ${op} ${a}`;
    return {
      kind: "balance-scale",
      values: [Number(a), Number(b)],
      alt: `A balance scale. The left pan holds ${left} and the right pan holds ${b}, showing the two sides are equal.`,
      svg: renderBalanceScaleSvg({ left, right: String(b) }),
    };
  }
  const mul = text.match(/\b(\d+(?:\.\d+)?)\s*([a-z])\s*=\s*(\d+(?:\.\d+)?)/i);
  if (mul) {
    const [, k, v, b] = mul;
    const left = `${k}${v}`;
    return {
      kind: "balance-scale",
      values: [Number(k), Number(b)],
      alt: `A balance scale. The left pan holds ${left} — ${k} equal groups of ${v} — and the right pan holds ${b}.`,
      svg: renderBalanceScaleSvg({ left, right: String(b) }),
    };
  }
  return null;
}

/** "the inequality a >= 18" — a stated one-variable inequality. */
export function readInequality(text) {
  const m = text.match(/\b([a-z])\s*(≥|≤|>=|<=|>|<)\s*(\d+(?:\.\d+)?)/i);
  if (!m) return null;
  if (!/inequal|at least|at most|no more than|no fewer/i.test(text)) return null;
  const [, v, rawOp, n] = m;
  const op = rawOp.replace(">=", "≥").replace("<=", "≤");
  const val = Number(n);
  const closed = op === "≥" || op === "≤";
  const right = op === "≥" || op === ">";
  const span = Math.max(10, Math.ceil(val / 5) * 2);
  const words = { "≥": "at least", "≤": "at most", ">": "greater than", "<": "less than" }[op];
  return {
    kind: "inequality-number-line",
    values: [val],
    alt: `A number line showing ${v} ${words} ${val}. The ${closed ? "solid" : "open"} circle sits at ${val} and the ray shades to the ${right ? "right" : "left"}.`,
    svg: renderNumberLineSvg({
      min: val - span,
      max: val + span,
      step: Math.max(1, Math.round(span / 5)),
      inequality: { op, value: val, closed, dir: right ? "right" : "left" },
    }),
  };
}

/** "the points scored ...: 4, 6, 8, 10, 12" — a stated data set, anywhere in the sentence. */
export function readDataSet(text) {
  const m = text.match(/:\s*((?:-?\d+(?:\.\d+)?\s*,\s*){7,}-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const data = m[1]
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  if (data.length < 8) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  if (max - min > 40) return null;
  return {
    kind: "dot-plot",
    values: [min, max],
    alt: `A dot plot of the ${data.length} values listed in the problem, from ${min} to ${max}. Each dot is one value, stacked where a value repeats.`,
    svg: renderDotPlotSvg({ data, min, max, step: 1 }),
  };
}

/** "a 3/4-pound bag into 1/8 pound portions" or "a 3-foot strip cut into 1/4-foot sections" */
export function readFractionDivision(text) {
  const frac = text.match(
    /\b(\d+)\s*\/\s*(\d+)\b[\s\S]{0,90}?\b(?:into|by)\b[\s\S]{0,70}?\b(\d+)\s*\/\s*(\d+)\b/,
  );
  if (frac) {
    const [, wn, wd, pn, pd] = frac;
    if (Number(pn) !== 1) return null;
    return {
      kind: "fraction-division",
      values: [Number(wn), Number(wd), Number(pd)],
      alt: `A strip model showing ${wn}/${wd} divided into parts of size 1/${pd}, so the parts can be counted.`,
      svg: renderFractionDivisionModelSvg({ whole: Number(wn) / Number(wd), denom: Number(pd) }),
    };
  }
  const whole = text.match(
    /\b(\d+)[\s-](?:foot|feet|pound|inch|inches|yard|meter|metre|cup)[\s\S]{0,90}?\b(?:into|cut into|by)\b[\s\S]{0,70}?\b1\s*\/\s*(\d+)\b/i,
  );
  if (whole) {
    const [, w, pd] = whole;
    return {
      kind: "fraction-division",
      values: [Number(w), Number(pd)],
      alt: `A strip model showing ${w} wholes divided into parts of size 1/${pd}, so the parts can be counted.`,
      svg: renderFractionDivisionModelSvg({ whole: Number(w), denom: Number(pd) }),
    };
  }
  return null;
}

/** "a base of 14 feet and a height of 9 feet" on a named parallelogram or triangle. */
export function readAreaShape(text) {
  const m = text.match(
    /\bbase\s+of\s+(\d+(?:\.\d+)?)\s*([a-z]+)[\s\S]{0,80}?\bheight\s+of\s+(\d+(?:\.\d+)?)/i,
  );
  if (!m) return null;
  const [, b, unit, h] = m;
  const isTri = /\btriangle|triangular\b/i.test(text);
  const isPara = /\bparallelogram\b/i.test(text);
  if (!isTri && !isPara) return null;
  const shape = isTri ? "triangle" : "parallelogram";
  return {
    kind: `${shape}-area`,
    values: [Number(b), Number(h)],
    alt: `A ${shape} with a base of ${b} ${unit} and a perpendicular height of ${h} ${unit}. The height is drawn straight up from the base, not along the slanted side.`,
    svg: isTri
      ? renderTriangleDecompSvg({ base: Number(b), height: Number(h), unit })
      : renderParallelogramDecompSvg({ base: Number(b), height: Number(h), unit }),
  };
}

/** "86 meters below sea level ... sea level is defined as 0" */
export function readSignedScale(text) {
  const m = text.match(/\b(\d+(?:\.\d+)?)\s*(?:meters?|feet|foot|ft|m|degrees?|°)\s+below\b/i);
  if (!m) return null;
  if (!/\b(sea level|zero|0)\b/i.test(text)) return null;
  const v = Number(m[1]);
  const bound = Math.ceil(v / 10) * 10;
  return {
    kind: "vertical-number-line",
    values: [v],
    alt: `A vertical number line with zero in the middle. The point marked −${v} sits below zero, the distance the problem describes.`,
    svg: renderVerticalNumberLineSvg({
      min: -bound,
      max: bound,
      step: Math.max(2, Math.round(bound / 5)),
      points: [{ value: -v, label: `−${v}` }],
    }),
  };
}

export const READERS = [
  ["equation", readEquation],
  ["inequality", readInequality],
  ["data-set", readDataSet],
  ["fraction-division", readFractionDivision],
  ["area-shape", readAreaShape],
  ["signed-scale", readSignedScale],
];

/**
 * The manipulative builders return an HTML fragment — a wrapper div around the
 * svg — because their home is inside a worksheet page. A file referenced by
 * <img src> must be a standalone SVG document, so take the <svg> element out of
 * the wrapper and give it the XML namespace a bare .svg file needs. Without the
 * namespace the browser renders nothing at all and the page shows a broken
 * image where the problem should be.
 */
export function standaloneSvg(html) {
  const m = html.match(/<svg[\s\S]*<\/svg>/i);
  if (!m) return null;
  let svg = m[0];
  if (!/xmlns=/.test(svg)) svg = svg.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  return `<?xml version="1.0" encoding="UTF-8"?>\n${svg}\n`;
}

/** Every number the figure prints must be a number the narrative states. */
export function valuesAreInText(values, text) {
  const norm = text.replace(/,/g, "");
  return values.every((v) => {
    const s = String(v);
    if (norm.includes(s)) return true;
    if (Number.isInteger(v) && norm.includes(v.toLocaleString("en-US"))) return true;
    return false;
  });
}

export function narrativeOf(config) {
  const L = config.launch || {};
  return [L.narrative || "", (L.beCurious && L.beCurious.text) || ""]
    .join(" ")
    .replace(/\s+/g, " ");
}

export function readLaunch(text) {
  for (const [name, fn] of READERS) {
    let fig = null;
    try {
      fig = fn(text);
    } catch {
      fig = null;
    }
    if (!fig) continue;
    if (!valuesAreInText(fig.values, text)) continue; // refuses to state a number the reader invented
    return { ...fig, reader: name };
  }
  return null;
}

/* ── main ─────────────────────────────────────────────────────────────── */
function main() {
  const write = !process.argv.includes("--check");
  const only = (process.argv.find((a) => a.startsWith("--only=")) || "").slice(7);
  // Redraw figures this script already owns. Textbook art is never touched.
  const force = process.argv.includes("--force");
  const ids = readdirSync(join(ROOT, "lessons"))
    .filter((d) => /^\d+-\d+$/.test(d))
    .filter((d) => !only || d === only);

  const drawn = [];
  const skipped = [];
  for (const id of ids) {
    const p = join(ROOT, "lessons", id, "config.json");
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, "utf8");
    const config = JSON.parse(raw);
    const L = config.launch;
    if (!L) continue;
    if (L.image || L.problemImage) continue; // textbook art stays
    if (L.figure && L.figure.url && !force) continue;

    const text = narrativeOf(config);
    const fig = readLaunch(text);
    if (!fig) {
      skipped.push(id);
      continue;
    }

    const rel = `/lessons/${id}/reveal-assets/launch-problem.svg`;
    if (write) {
      mkdirSync(join(ROOT, "lessons", id, "reveal-assets"), { recursive: true });
      const doc = standaloneSvg(fig.svg);
      if (!doc) {
        skipped.push(id);
        continue;
      }
      writeFileSync(join(ROOT, "lessons", id, "reveal-assets", "launch-problem.svg"), doc);
      // NOT `kind`: engine/components reads launch.figure.kind as an
      // INTERACTIVE VISUAL component name and looks it up in the registry, so a
      // static drawing named "balance-scale" there declares a component that
      // does not exist and renders nothing. tools/lesson-visuals-static.test.mjs
      // caught all eight. This is a picture, so it carries a picture's fields.
      const dim = doc.match(/<svg[^>]*\bwidth="(\d+)"[^>]*\bheight="(\d+)"/i);
      config.launch.figure = {
        url: rel,
        alt: fig.alt,
        width: dim ? Number(dim[1]) : undefined,
        height: dim ? Number(dim[2]) : undefined,
      };
      writeFileSync(p, JSON.stringify(config, null, 2) + (raw.endsWith("\n") ? "\n" : ""));
    }
    drawn.push(`${id} (${fig.reader})`);
  }

  console.log(`launch figures — drawn ${drawn.length}, left text-only ${skipped.length}`);
  for (const d of drawn) console.log(`  ✓ ${d}`);
  console.log(
    `\n  ${skipped.length} lesson(s) state no quantity this can draw truthfully and were left alone:\n  ${skipped.join(" ")}`,
  );
  if (!write) console.log("\n(--check: nothing written)");
}

if (process.argv[1] && process.argv[1].endsWith("generate-launch-figures.mjs")) main();

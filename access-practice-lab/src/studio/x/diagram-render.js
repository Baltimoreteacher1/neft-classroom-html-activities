// One entry point for drawing a `diagram` block (see core/schema.js): the block's STRUCTURED SPEC goes through the
// wave-1 generators, so the picture is recomputed from the numbers every time and never stored. The player, the
// printed worksheet, the Word export, the validator and the editor preview all call this file.
//
//   renderDiagram(block, { lang, suffix }) -> { ok: true, svg, alt, caption, table: {headers, rows} }
//                                           | { ok: false, code, message }       (never throws)
//   checkDiagram(block)                    -> null | { code, message }           (message is English)
//
// `suffix` makes the SVG's element ids unique so two figures on one page cannot collide.

import { DiagramError } from "./diagram-kit.js";
import { barChartSvg, dotPlotSvg, histogramSvg } from "./diagrams-charts.js";
import { tenFrameSvg } from "./diagrams-counting.js";
import { foodWebSvg, timelineSvg } from "./diagrams-graphs.js";
import {
  coordinatePlaneSvg,
  fractionModelSvg,
  prismSvg,
  tapeDiagramSvg,
} from "./diagrams-models.js";

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escText = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

// A blank cell is null in the stored spec. The generators must see it as "not a number", never as 0.
const blank = (v) => (v === null ? "" : v);

// kind -> (spec) => [generator, its input]; `generate` adds the language.
const GENERATE = {
  fraction: (s) => [
    fractionModelSvg,
    { numerator: blank(s.numerator), denominator: blank(s.denominator), style: s.style },
  ],
  prism: (s) => [prismSvg, { l: blank(s.l), w: blank(s.w), h: blank(s.h), unit: s.unit }],
  tape: (s) => [
    tapeDiagramSvg,
    {
      parts: s.parts.map((p) => ({ label: p.label || undefined, value: p.value })),
      total: s.total ?? undefined,
    },
  ],
  plane: (s) => [
    coordinatePlaneSvg,
    {
      xRange: s.xRange.map(blank),
      yRange: s.yRange.map(blank),
      points: s.points.map((p) => ({ x: blank(p.x), y: blank(p.y), label: p.label })),
    },
  ],
  bar: (s) => [
    barChartSvg,
    {
      title: s.title,
      unit: s.unit,
      categories: s.categories.map((c) => ({ label: c.label, value: blank(c.value) })),
    },
  ],
  dot: (s) => [dotPlotSvg, { values: s.values.map(blank), title: s.title, unit: s.unit }],
  histogram: (s) => [
    histogramSvg,
    {
      values: s.values.map(blank),
      title: s.title,
      unit: s.unit,
      binWidth: s.binWidth ?? undefined,
    },
  ],
  timeline: (s) => [
    timelineSvg,
    { events: s.events.map((e) => ({ year: blank(e.year), label: e.label })) },
  ],
  foodweb: (s) => [foodWebSvg, { relationships: s.relationships }],
  tenframe: (s) => [tenFrameSvg, { count: blank(s.count), add: s.add }],
};

/** The generator's own result for a spec, in `lang`. Throws DiagramError when the figure cannot be drawn. */
function generate(spec, lang) {
  const make = GENERATE[spec?.kind];
  if (!make) throw new DiagramError("unknown-kind", "That kind of diagram is not available.");
  try {
    const [draw, input] = make(spec);
    return draw({ ...input, lang });
  } catch (error) {
    if (error instanceof DiagramError) throw error;
    throw new DiagramError("cannot-draw", "This diagram could not be drawn from its values.");
  }
}

/** A teacher's own alt text replaces the generated title and description inside the SVG. */
function withAlt(svg, alt) {
  const safe = escText(alt);
  return svg
    .replace(/(<title id="[^"]*">)[^<]*(<\/title>)/, (_, a, b) => `${a}${safe}${b}`)
    .replace(/(<desc id="[^"]*">)[^<]*(<\/desc>)/, (_, a, b) => `${a}${safe}${b}`);
}

/** Make every id in the SVG unique by appending `-suffix` (ids, url(#id) references and aria-labelledby). */
function scoped(svg, suffix) {
  const tail = String(suffix ?? "").replace(/[^A-Za-z0-9_-]/g, "");
  if (!tail) return svg;
  const ids = new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  const swap = (id) => (ids.has(id) ? `${id}-${tail}` : id);
  return svg
    .replace(/\bid="([^"]+)"/g, (_, id) => `id="${swap(id)}"`)
    .replace(
      /\baria-labelledby="([^"]+)"/g,
      (_, v) => `aria-labelledby="${v.split(" ").map(swap).join(" ")}"`,
    )
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${swap(id)})`);
}

export function renderDiagram(block, { lang = "en", suffix = "" } = {}) {
  const l = lang === "es" ? "es" : "en";
  try {
    const r = generate(block?.spec, l);
    const custom = block.alt?.[l] || "";
    return {
      ok: true,
      svg: scoped(custom ? withAlt(r.svg, custom) : r.svg, suffix),
      alt: custom || r.alt[l],
      caption: block.caption?.[l] || r.caption[l],
      table: r.table,
    };
  } catch (error) {
    return { ok: false, code: error.code || "cannot-draw", message: error.message };
  }
}

export function checkDiagram(block) {
  const r = renderDiagram(block);
  return r.ok ? null : { code: r.code, message: r.message };
}

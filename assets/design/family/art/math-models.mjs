// Family Math Studio math-visual grammar: PURE functions, lesson data -> SVG string.
//
//   renderModel({ kind, data, alt }, { lang: "en" | "es" }) -> string
//
// kinds: tape, doubleline, ratiotable, area, grid, numberline, coord, barplot, fraction, balance, none.
// Data shapes are fixed by docs/specs/family-homework-v3.md ("model.data by kind"). An unknown kind or a missing
// required field THROWS: there is no generic fallback diagram (a generic 3-part tape on 30 unrelated lessons is
// exactly what this library replaces). Output is deterministic: same input, same bytes.
//
// Every model: role=img, <title> = the lesson's alt text (or the model name), <desc> = a text alternative computed
// from the numbers passed in. An unknown value is described as unknown, never revealed.

import {
  PAD,
  RADIUS,
  W,
  assertKeys,
  bracket,
  clampX,
  clean,
  esc,
  head,
  int,
  lab,
  minus,
  n1,
  need,
  shell,
  text,
  textW,
  unknownPill,
  wrap,
} from "./math-kit.mjs";
import { renderArea, renderBalance, renderCoord, renderGrid } from "./math-models-geometry.mjs";

const tr = (lang, en, es) => (lang === "es" ? es : en);

// ---------------------------------------------------------------- tape
function tape(d, { lang }) {
  assertKeys(d, ["parts", "highlight", "partLabel", "wholeLabel", "blockLabel", "unknown"], 'model "tape" data');
  need(d, "tape", "parts", "highlight");
  const n = int(d, "tape", "parts", 1, 24);
  const hi = int(d, "tape", "highlight", 0, n);
  const unknown = d.unknown ?? null;
  if (![null, "whole", "part"].includes(unknown)) {
    throw new Error(`model "tape": data.unknown must be "whole", "part" or null; got ${JSON.stringify(unknown)}`);
  }
  const partL = lab(d.partLabel, lang);
  const wholeL = lab(d.wholeLabel, lang);
  const blockL = lab(d.blockLabel, lang);
  const bw = W - 2 * PAD;
  const cw = bw / n;
  const bh = 44;
  let y = 8;
  const out = [];
  const label = (cx, base, s, isUnknown) => {
    const w = textW(s, 16) + 16;
    const x = clampX(cx, w);
    return (isUnknown ? unknownPill(x, base - 5, w) : "") + text(x, base, s, { cls: "m-t m-n" });
  };
  if (partL && hi > 0) {
    out.push(label(PAD + (hi * cw) / 2, y + 18, partL, unknown === "part"));
    y += 34;
    out.push(bracket(PAD, PAD + hi * cw, y + 6, -1, "m-ln"));
    y += 10;
  } else if (hi > 0) {
    y += 14;
    out.push(bracket(PAD, PAD + hi * cw, y, -1, "m-ln"));
  }
  const barTop = y;
  const clip = "@ID@c";
  const blocks = [];
  for (let i = 0; i < n; i++) {
    const cls = i < hi ? (unknown === "part" ? "m-u" : "m-p") : "m-g";
    blocks.push(`<rect class="${cls}" x="${n1(PAD + i * cw)}" y="${barTop}" width="${n1(cw)}" height="${bh}"/>`);
  }
  out.push(`<g clip-path="url(#${clip})">${blocks.join("")}</g>`);
  out.push(`<rect class="m-ln" x="${PAD}" y="${barTop}" width="${bw}" height="${bh}" rx="${RADIUS}"/>`);
  y = barTop + bh;
  if (blockL) {
    out.push(bracket(PAD, PAD + cw, y + 8, 1));
    y += 36;
    out.push(text(PAD, y, blockL, { anchor: "start", cls: "m-t m-n" }));
    y += 12;
  }
  if (wholeL || unknown === "whole") {
    y += 14;
    out.push(bracket(PAD, W - PAD, y, 1, "m-ln"));
    const s = wholeL || "?";
    out.push(label(W / 2, y + 30, s, unknown === "whole"));
    y += 40;
  }
  const defs = `<clipPath id="${clip}"><rect x="${PAD}" y="${barTop}" width="${bw}" height="${bh}" rx="${RADIUS}"/></clipPath>`;
  const desc = [
    tr(lang, `The whole is split into ${n} equal blocks.`, `El total se divide en ${n} bloques iguales.`),
    hi > 0
      ? tr(lang, `${hi} of the ${n} blocks are the part${partL ? `: ${partL}` : ""}.`, `${hi} de los ${n} bloques son la parte${partL ? `: ${partL}` : ""}.`)
      : "",
    blockL ? tr(lang, `Each block: ${blockL}.`, `Cada bloque: ${blockL}.`) : "",
    wholeL ? tr(lang, `The whole: ${wholeL}.`, `El total: ${wholeL}.`) : "",
    unknown ? tr(lang, `The ${unknown} is unknown.`, `${unknown === "whole" ? "El total" : "La parte"} es desconocido.`) : "",
  ]
    .filter(Boolean)
    .join(" ");
  return { h: y + 12, body: out.join(""), defs, desc };
}

// ---------------------------------------------------------------- doubleline
function doubleline(d, { lang }) {
  assertKeys(d, ["top", "bottom", "unknown"], 'model "doubleline" data');
  need(d, "doubleline", "top", "bottom");
  for (const row of ["top", "bottom"]) {
    assertKeys(d[row], ["label", "ticks"], `model "doubleline" data.${row}`);
    need(d[row], `doubleline.${row}`, "ticks");
    if (!Array.isArray(d[row].ticks) || d[row].ticks.length < 2) {
      throw new Error(`model "doubleline": data.${row}.ticks needs at least 2 values`);
    }
  }
  const n = d.top.ticks.length;
  if (d.bottom.ticks.length !== n) {
    throw new Error(`model "doubleline": top and bottom need the same number of ticks (${n} vs ${d.bottom.ticks.length})`);
  }
  const cols = new Set((d.unknown ?? []).map((u) => (typeof u === "number" ? u : u?.index)));
  const rowOf = (i, row) => {
    const v = d[row].ticks[i];
    const missing = v === null || v === undefined || v === "?" || v === "";
    if (missing) return true;
    if (!cols.has(i)) return false;
    return row === "bottom" && !(d.top.ticks[i] === null || d.top.ticks[i] === undefined || d.top.ticks[i] === "?");
  };
  const x0 = 40;
  const span = W - 2 * x0;
  const xs = (i) => x0 + (span * i) / (n - 1);
  const yTop = 70;
  const yBot = 130;
  const out = [];
  out.push(text(PAD, 22, lab(d.top.label, lang), { anchor: "start", cls: "m-t m-n" }));
  for (const [y, row, base] of [[yTop, "top", yTop - 14], [yBot, "bottom", yBot + 30]]) {
    out.push(`<path class="m-ln" d="M${PAD} ${y}H${W - PAD - 6}"/>${head(W - PAD, y, "r")}`);
    for (let i = 0; i < n; i++) {
      const x = xs(i);
      out.push(`<path class="m-ln" d="M${n1(x)} ${y - 6}v12"/>`);
      if (rowOf(i, row)) {
        out.push(unknownPill(x, base - 5, 34, 26) + text(x, base + 1, "?", { cls: "m-q" }));
      } else {
        out.push(text(x, base, lab(d[row].ticks[i], lang)));
      }
    }
  }
  for (let i = 0; i < n; i++) out.push(`<path class="m-dash" d="M${n1(xs(i))} ${yTop + 8}V${yBot - 8}"/>`);
  out.push(text(PAD, 186, lab(d.bottom.label, lang), { anchor: "start", cls: "m-t m-n" }));
  const pairs = [];
  for (let i = 0; i < n; i++) {
    const a = rowOf(i, "top") ? tr(lang, "unknown", "desconocido") : lab(d.top.ticks[i], lang);
    const b = rowOf(i, "bottom") ? tr(lang, "unknown", "desconocido") : lab(d.bottom.ticks[i], lang);
    pairs.push(`${a} - ${b}`);
  }
  const desc = tr(
    lang,
    `Double number line. Top line, ${lab(d.top.label, lang)}. Bottom line, ${lab(d.bottom.label, lang)}. Matching ticks: ${pairs.join("; ")}.`,
    `Recta numérica doble. Recta de arriba, ${lab(d.top.label, lang)}. Recta de abajo, ${lab(d.bottom.label, lang)}. Marcas que se corresponden: ${pairs.join("; ")}.`,
  );
  return { h: 202, body: out.join(""), desc };
}

// ---------------------------------------------------------------- ratiotable
function ratiotable(d, { lang }) {
  assertKeys(d, ["headers", "rows", "unknownCells", "arrows"], 'model "ratiotable" data');
  need(d, "ratiotable", "headers", "rows");
  if (!Array.isArray(d.headers) || d.headers.length !== 2) throw new Error('model "ratiotable": data.headers needs exactly 2 labels');
  if (!Array.isArray(d.rows) || d.rows.length < 1 || d.rows.length > 8) throw new Error('model "ratiotable": data.rows needs 1 to 8 rows');
  if (d.unknownCells !== undefined && !Array.isArray(d.unknownCells)) throw new Error('model "ratiotable": data.unknownCells must be a list of [row, column]');
  for (const r of d.rows) {
    if (!Array.isArray(r) || r.length !== 2) throw new Error('model "ratiotable": every row needs exactly 2 values');
  }
  const unk = new Set((d.unknownCells ?? []).map(([r, c]) => `${r},${c}`));
  const rowH = 38;
  const colW = 124;
  const x0 = PAD;
  const y0 = 8;
  const out = [];
  const heads = [0, 1].map((c) => wrap(lab(d.headers[c], lang), 13));
  const headH = Math.max(rowH, 14 + 18 * Math.max(heads[0].length, heads[1].length));
  for (let c = 0; c < 2; c++) {
    out.push(`<rect class="m-h" x="${x0 + c * colW}" y="${y0}" width="${colW}" height="${headH}"/>`);
    const top = y0 + (headH - 18 * heads[c].length) / 2 + 14;
    heads[c].forEach((ln, i) => out.push(text(x0 + c * colW + colW / 2, top + i * 18, ln, { cls: "m-t m-n" })));
  }
  d.rows.forEach((row, r) => {
    for (let c = 0; c < 2; c++) {
      const x = x0 + c * colW;
      const y = y0 + headH + r * rowH;
      const u = unk.has(`${r},${c}`);
      out.push(`<rect class="${u ? "m-u" : "m-g"}" x="${x}" y="${y}" width="${colW}" height="${rowH}"/>`);
      out.push(u ? text(x + colW / 2, y + 26, "?", { cls: "m-q" }) : text(x + colW / 2, y + 24, lab(row[c], lang)));
    }
  });
  const rowMid = (r) => y0 + headH + r * rowH + rowH / 2;
  const arrows = d.arrows ?? [];
  arrows.forEach((a, k) => {
    assertKeys(a, ["from", "to", "label"], `model "ratiotable" data.arrows[${k}]`);
    for (const f of ["from", "to"]) {
      if (!Number.isInteger(a[f]) || a[f] < 0 || a[f] >= d.rows.length) {
        throw new Error(`model "ratiotable": arrows[${k}].${f} must be a row index from 0 to ${d.rows.length - 1}`);
      }
    }
    const ax = x0 + 2 * colW + 6;
    const y1 = rowMid(a.from);
    const y2 = rowMid(a.to);
    const bulge = 26 + 8 * Math.min(3, Math.abs(a.to - a.from));
    const mid = (y1 + y2) / 2;
    out.push(`<path class="m-ln" d="M${ax} ${n1(y1)}Q${ax + bulge} ${n1(mid)} ${ax} ${n1(y2 + (y2 > y1 ? -4 : 4))}"/>`);
    out.push(head(ax, y2 + (y2 > y1 ? -4 : 4), "l"));
    const s = lab(a.label, lang);
    const w = textW(s, 16);
    out.push(text(Math.min(ax + bulge + 6, W - PAD - w), mid + 5, s, { anchor: "start", cls: "m-t m-n" }));
  });
  const rowsDesc = d.rows.map((row, r) => {
    const cell = (c) => (unk.has(`${r},${c}`) ? tr(lang, "unknown", "desconocido") : lab(row[c], lang));
    return `${lab(d.headers[0], lang)} ${cell(0)}, ${lab(d.headers[1], lang)} ${cell(1)}`;
  });
  const arrDesc = arrows.map((a) => tr(lang, `row ${a.from + 1} to row ${a.to + 1}: ${lab(a.label, lang)}`, `fila ${a.from + 1} a fila ${a.to + 1}: ${lab(a.label, lang)}`));
  const desc = tr(
    lang,
    `Ratio table with columns ${lab(d.headers[0], lang)} and ${lab(d.headers[1], lang)}. Rows: ${rowsDesc.join("; ")}.${arrDesc.length ? ` Arrows: ${arrDesc.join("; ")}.` : ""}`,
    `Tabla de razones con columnas ${lab(d.headers[0], lang)} y ${lab(d.headers[1], lang)}. Filas: ${rowsDesc.join("; ")}.${arrDesc.length ? ` Flechas: ${arrDesc.join("; ")}.` : ""}`,
  );
  return { h: y0 + headH + d.rows.length * rowH + 12, body: out.join(""), desc };
}

// ---------------------------------------------------------------- numberline
const KINDS = ["given", "unknown", "answer", "error"];
function numberline(d, { lang }) {
  assertKeys(d, ["min", "max", "step", "points", "unit"], 'model "numberline" data');
  need(d, "numberline", "min", "max", "step");
  const { min, max, step } = d;
  if (![min, max, step].every((v) => typeof v === "number" && Number.isFinite(v)) || max <= min || step <= 0) {
    throw new Error('model "numberline": data.min < data.max and data.step > 0 are required numbers');
  }
  const count = Math.round((max - min) / step) + 1;
  if (count < 2 || count > 41) throw new Error(`model "numberline": ${count} ticks is outside 2 to 41; use a larger step`);
  const x0 = 28;
  const x1 = W - 28;
  const xv = (v) => x0 + ((v - min) / (max - min)) * (x1 - x0);
  const y = 104;
  const longest = Math.max(...Array.from({ length: count }, (_, i) => minus(clean(min + i * step)).length));
  const every = Math.max(1, Math.ceil((longest * 8.6 + 6) / (((x1 - x0) / (count - 1)))));
  const out = [`<path class="m-ln" d="M${PAD} ${y}H${W - PAD - 6}"/>${head(W - PAD, y, "r")}${head(PAD, y, "l")}`];
  for (let i = 0; i < count; i++) {
    const v = min + i * step;
    out.push(`<path class="m-ln" d="M${n1(xv(v))} ${y - 6}v12"/>`);
    if (i % every === 0 || i === count - 1) out.push(text(xv(v), y + 28, minus(clean(v))));
  }
  const pts = (d.points ?? []).map((p, k) => {
    assertKeys(p, ["value", "label", "kind"], `model "numberline" data.points[${k}]`);
    if (typeof p.value !== "number" || p.value < min - 1e-9 || p.value > max + 1e-9) {
      throw new Error(`model "numberline": points[${k}].value must be a number from ${min} to ${max}`);
    }
    const kind = p.kind ?? "given";
    if (!KINDS.includes(kind)) throw new Error(`model "numberline": points[${k}].kind must be one of ${KINDS.join(", ")}`);
    return { ...p, kind };
  });
  const sorted = [...pts].sort((a, b) => a.value - b.value);
  let lastX = -999;
  let tier = 0;
  const descs = [];
  for (const p of sorted) {
    const x = xv(p.value);
    tier = x - lastX < 56 ? (tier + 1) % 2 : 0;
    lastX = x;
    const s = p.kind === "unknown" && !p.label ? "?" : lab(p.label ?? p.value, lang);
    const ly = y - 34 - tier * 24;
    if (p.kind === "given") out.push(`<circle class="m-dot" cx="${n1(x)}" cy="${y}" r="7"/>`);
    if (p.kind === "unknown") out.push(`<circle class="m-u" cx="${n1(x)}" cy="${y}" r="11"/>${text(x, y + 6, "?", { cls: "m-q" })}`);
    if (p.kind === "answer") out.push(`<circle class="m-a" cx="${n1(x)}" cy="${y}" r="11"/><circle cx="${n1(x)}" cy="${y}" r="5" fill="var(--m-answer-ink,#0F7C4A)"/>`);
    if (p.kind === "error") out.push(`<path class="m-x" d="M${n1(x - 8)} ${y - 8}l16 16M${n1(x + 8)} ${y - 8}l-16 16"/>`);
    out.push(`<path class="m-gr" d="M${n1(x)} ${ly + 6}V${y - 13}"/>`);
    const w = textW(s, 16);
    out.push(text(clampX(x, w), ly, s, { cls: "m-t m-n" }));
    descs.push(
      p.kind === "unknown"
        ? tr(lang, "an unknown point marked with ?", "un punto desconocido marcado con ?")
        : tr(
            lang,
            `${s} at ${minus(clean(p.value))} (${p.kind})`,
            `${s} en ${minus(clean(p.value))} (${{ given: "dado", answer: "respuesta", error: "error" }[p.kind]})`,
          ),
    );
  }
  const unit = lab(d.unit, lang);
  if (unit) out.push(text(W / 2, y + 56, unit, { cls: "m-t m-n" }));
  const desc = tr(
    lang,
    `Number line from ${minus(clean(min))} to ${minus(clean(max))}, ticks every ${clean(step)}${unit ? ` ${unit}` : ""}.${descs.length ? ` Points: ${descs.join("; ")}.` : ""}`,
    `Recta numérica de ${minus(clean(min))} a ${minus(clean(max))}, marcas cada ${clean(step)}${unit ? (unit === "%" ? unit : ` ${unit}`) : ""}.${descs.length ? ` Puntos: ${descs.join("; ")}.` : ""}`,
  );
  return { h: unit ? 170 : 146, body: out.join(""), desc };
}

// ---------------------------------------------------------------- barplot
const niceMax = (m) => {
  const p = 10 ** Math.floor(Math.log10(m));
  for (const s of [1, 2, 2.5, 5, 10]) if (s * p >= m) return s * p;
  return 10 * p;
};
function barplot(d, { lang }) {
  assertKeys(d, ["categories", "unit"], 'model "barplot" data');
  need(d, "barplot", "categories");
  const cats = d.categories;
  if (!Array.isArray(cats) || cats.length < 1 || cats.length > 8) throw new Error('model "barplot": data.categories needs 1 to 8 entries');
  cats.forEach((c, i) => {
    assertKeys(c, ["label", "value"], `model "barplot" data.categories[${i}]`);
    if (typeof c.value !== "number" || c.value < 0 || !Number.isFinite(c.value)) {
      throw new Error(`model "barplot": categories[${i}].value must be a number >= 0`);
    }
  });
  const top = niceMax(Math.max(...cats.map((c) => c.value), 1));
  const lx = 112;
  const bx0 = lx + 8;
  const bx1 = W - 44;
  const rowH = 36;
  const y0 = 10;
  const out = [];
  for (let i = 0; i <= 4; i++) {
    const x = bx0 + ((bx1 - bx0) * i) / 4;
    out.push(`<path class="m-gr" d="M${n1(x)} ${y0}V${y0 + cats.length * rowH}"/>`);
    out.push(text(x, y0 + cats.length * rowH + 22, clean((top * i) / 4)));
  }
  out.push(`<path class="m-ln" d="M${bx0} ${y0}V${y0 + cats.length * rowH}"/>`);
  cats.forEach((c, i) => {
    const yy = y0 + i * rowH;
    const w = ((bx1 - bx0) * c.value) / top;
    const name = lab(c.label, lang);
    const words = name.split(" ");
    if (name.length > 13 && words.length > 1) {
      const half = Math.ceil(words.length / 2);
      out.push(text(lx, yy + 17, words.slice(0, half).join(" "), { anchor: "end" }));
      out.push(text(lx, yy + 32, words.slice(half).join(" "), { anchor: "end" }));
    } else {
      out.push(text(lx, yy + 23, name, { anchor: "end" }));
    }
    if (w > 0) out.push(`<rect class="m-p" x="${bx0}" y="${yy + 6}" width="${n1(w)}" height="24" rx="3"/>`);
    out.push(text(bx0 + w + 6, yy + 24, clean(c.value), { anchor: "start", cls: "m-t m-n" }));
  });
  const unit = lab(d.unit, lang);
  const axisY = y0 + cats.length * rowH + 22;
  if (unit) out.push(text(W / 2, axisY + 24, unit, { cls: "m-t m-n" }));
  const desc = tr(
    lang,
    `Bar graph${unit ? ` in ${unit}` : ""}. ${cats.map((c) => `${lab(c.label, lang)}: ${clean(c.value)}`).join("; ")}.`,
    `Gráfica de barras${unit ? ` en ${unit}` : ""}. ${cats.map((c) => `${lab(c.label, lang)}: ${clean(c.value)}`).join("; ")}.`,
  );
  return { h: axisY + (unit ? 36 : 14), body: out.join(""), desc };
}

// ---------------------------------------------------------------- fraction
function fraction(d, { lang }) {
  assertKeys(d, ["parts", "shaded", "label"], 'model "fraction" data');
  need(d, "fraction", "parts", "shaded");
  const n = int(d, "fraction", "parts", 1, 24);
  const s = int(d, "fraction", "shaded", 0, n);
  const id = "@ID@h";
  const bw = W - 2 * PAD;
  const cw = bw / n;
  const clip = "@ID@c";
  const blocks = [];
  for (let i = 0; i < n; i++) {
    blocks.push(`<rect class="${i < s ? "m-p" : "m-g"}"${i < s ? ` style="fill:url(#${id})"` : ""} x="${n1(PAD + i * cw)}" y="12" width="${n1(cw)}" height="56"/>`);
  }
  const defs = `<clipPath id="${clip}"><rect x="${PAD}" y="12" width="${bw}" height="56" rx="${RADIUS}"/></clipPath><pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="var(--m-part,#70C6C3)"/><path d="M0 0v8" stroke="var(--m-part-ink,#177B78)" stroke-width="2.4" stroke-opacity=".5"/></pattern>`;
  const label = lab(d.label, lang) || `${s}/${n}`;
  const body = `<g clip-path="url(#${clip})">${blocks.join("")}</g><rect class="m-ln" x="${PAD}" y="12" width="${bw}" height="56" rx="${RADIUS}"/>${text(W / 2, 100, label, { cls: "m-t m-n" })}`;
  const desc = tr(
    lang,
    `Fraction bar split into ${n} equal parts with ${s} shaded: ${label}.`,
    `Barra de fracciones dividida en ${n} partes iguales con ${s} sombreadas: ${label}.`,
  );
  return { h: 116, body, defs, desc };
}

// ---------------------------------------------------------------- dispatcher
const MODELS = {
  tape,
  doubleline,
  ratiotable,
  area: renderArea,
  grid: renderGrid,
  numberline,
  coord: renderCoord,
  barplot,
  fraction,
  balance: renderBalance,
};

export const MODEL_KINDS = Object.freeze([...Object.keys(MODELS), "none"]);

export function renderModel(model, { lang = "en" } = {}) {
  if (model === null || typeof model !== "object") throw new Error("renderModel needs { kind, data, alt }");
  const { kind, data, alt } = model;
  if (lang !== "en" && lang !== "es") throw new Error(`renderModel: lang must be "en" or "es"; got ${JSON.stringify(lang)}`);
  if (kind === "none") return "";
  if (!Object.hasOwn(MODELS, kind)) {
    throw new Error(`Unknown model kind ${JSON.stringify(kind)}; expected one of ${MODEL_KINDS.join(", ")}`);
  }
  const r = MODELS[kind](data ?? {}, { lang });
  return shell({ kind, lang, alt, key: JSON.stringify(data), ...r });
}

/** The computed text alternative alone (for a visible caption, a docx alt or a test). */
export function describeModel(model, { lang = "en" } = {}) {
  const svg = renderModel(model, { lang });
  const m = svg.match(/<desc id="[^"]*">([^<]*)<\/desc>/);
  return m ? m[1].replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&") : "";
}

export { esc };

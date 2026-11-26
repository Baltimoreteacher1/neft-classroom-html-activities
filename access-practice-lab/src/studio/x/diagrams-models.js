// Model diagrams drawn from structured data: fraction bar/circle, rectangular prism, tape diagram, coordinate plane.
// Every shape's size comes from the numbers, so the picture stays true when a value changes.

import { parseNumber, rat, ratAdd, ratCmp, ratMul, ratSub, ratToNumber, ratToString } from "../core/math.js";
import {
  CAPS,
  COLOR,
  LIGHT,
  both,
  cleanText,
  f1,
  fail,
  fmt,
  frame,
  intIn,
  langOf,
  line,
  listIn,
  numberIn,
  patternDefs,
  patternFill,
  rangeIn,
  result,
  round,
  text,
  textIn,
  textWidth,
} from "./diagram-kit.js";

// ── fraction model ───────────────────────────────────────────────────────────

const sectorPath = (cx, cy, r, a0, a1) => {
  const pt = (a) => `${f1(cx + r * Math.cos(a))} ${f1(cy + r * Math.sin(a))}`;
  return `M${f1(cx)} ${f1(cy)} L${pt(a0)} A${r} ${r} 0 ${a1 - a0 > Math.PI + 1e-9 ? 1 : 0} 1 ${pt(a1)} Z`;
};

/** @param {{numerator:number, denominator:number, style?:"bar"|"circle", lang?:string}} spec */
export function fractionModelSvg(spec = {}) {
  const lang = langOf(spec);
  const d = intIn(spec.denominator, "denominator", { min: 1, max: CAPS.denominator });
  const n = intIn(spec.numerator, "numerator", { min: 0, max: d * CAPS.wholes });
  const style = spec.style ?? "bar";
  if (style !== "bar" && style !== "circle") fail("bad-style", 'style must be "bar" or "circle".');
  const wholes = Math.max(1, Math.ceil(n / d));
  const p = "fm";
  const shadedIn = (k) => Math.max(0, Math.min(d, n - k * d));
  let body = "";
  let w;
  let h;
  if (style === "bar") {
    const cw = 480 / d;
    w = 520;
    h = 24 + wholes * 58 + 56;
    for (let k = 0; k < wholes; k++)
      for (let i = 0; i < d; i++) {
        const on = i < shadedIn(k);
        body += `<rect data-cell="${on ? "shaded" : "empty"}" data-whole="${k + 1}" x="${f1(20 + i * cw)}" y="${24 + k * 58}" width="${f1(cw)}" height="44" fill="${on ? `url(#${p}-solid)` : COLOR.white}" stroke="${COLOR.ink}" stroke-width="2"/>`;
      }
  } else {
    const r = 66;
    w = Math.max(240, wholes * 160 + 40);
    h = 2 * r + 24 + 56 + 24;
    for (let k = 0; k < wholes; k++) {
      const cx = w / 2 + (k - (wholes - 1) / 2) * 160;
      const cy = 24 + r;
      if (d === 1) {
        const on = shadedIn(k) === 1;
        body += `<circle data-cell="${on ? "shaded" : "empty"}" data-whole="${k + 1}" cx="${f1(cx)}" cy="${cy}" r="${r}" fill="${on ? `url(#${p}-solid)` : COLOR.white}" stroke="${COLOR.ink}" stroke-width="2"/>`;
        continue;
      }
      for (let i = 0; i < d; i++) {
        const on = i < shadedIn(k);
        const a0 = -Math.PI / 2 + (i * 2 * Math.PI) / d;
        const a1 = -Math.PI / 2 + ((i + 1) * 2 * Math.PI) / d;
        body += `<path data-cell="${on ? "shaded" : "empty"}" data-whole="${k + 1}" d="${sectorPath(cx, cy, r, a0, a1)}" fill="${on ? `url(#${p}-solid)` : COLOR.white}" stroke="${COLOR.ink}" stroke-width="2"/>`;
      }
    }
  }
  body += text(w / 2, h - 30, `${n}/${d}`, { size: 22, anchor: "middle", weight: "700" });
  body += text(w / 2, h - 8, lang === "es" ? `${n} de ${d} partes iguales sombreadas` : `${n} of ${d} equal parts shaded`, { size: 14, anchor: "middle", fill: COLOR.muted });
  const mixed = n >= d && n % d !== 0 ? { whole: Math.floor(n / d), numerator: n % d, denominator: d } : null;
  const alt = both((l) =>
    l === "es"
      ? `Modelo de fracción: ${n} de ${d} partes iguales sombreadas en ${wholes === 1 ? "un " : `${wholes} `}${style === "bar" ? (wholes === 1 ? "rectángulo" : "rectángulos") : wholes === 1 ? "círculo" : "círculos"}.`
      : `Fraction model: ${n} of ${d} equal parts shaded in ${wholes === 1 ? "one" : wholes} ${style === "bar" ? "bar" : "circle"}${wholes === 1 ? "" : "s"}.`,
  );
  return result({
    svg: frame({ p, w, h, title: alt[lang], desc: `${alt[lang]} ${lang === "es" ? "Las partes sombreadas tienen un patrón de líneas." : "Shaded parts have a line pattern."}`, lang, defs: patternDefs(p), body }),
    alt,
    caption: both((l) => (l === "es" ? `Fracción ${n}/${d}` : `Fraction ${n}/${d}`)),
    data: { numerator: n, denominator: d, style, wholes, shadedParts: n, totalParts: wholes * d, decimal: round(n / d, 6), mixed },
    table: {
      headers: lang === "es" ? ["Dato", "Valor"] : ["Item", "Value"],
      rows: [
        [lang === "es" ? "Partes sombreadas" : "Shaded parts", String(n)],
        [lang === "es" ? "Partes iguales por entero" : "Equal parts in each whole", String(d)],
      ],
    },
  });
}

// ── rectangular prism (cabinet oblique projection) ───────────────────────────

const DEPTH = 0.5; // cabinet projection: depth edges are drawn at half length, at 45 degrees
const C45 = Math.SQRT1_2;

function dimension(v, name) {
  const typed = typeof v === "string" ? cleanText(v) : null;
  const r = parseNumber(typed ?? String(v));
  if (!r || ratCmp(r, rat(0n)) <= 0) fail("bad-dimension", `${name} must be a number greater than 0.`);
  const x = ratToNumber(r);
  if (x > 1e6) fail("out-of-range", `${name} is too large.`);
  return { r, x, label: typed || ratToString(r, "decimal") };
}
function unitOf(v) {
  const u = cleanText(v);
  if (u.length > 12) fail("text-too-long", "unit is longer than 12 characters.");
  if (!/^[\p{L}\p{N} ./'"-]*$/u.test(u)) fail("bad-unit", "unit may only contain letters, digits and . / ' \" -.");
  return u;
}

/** @param {{l:number|string, w:number|string, h:number|string, unit?:string, lang?:string}} spec */
export function prismSvg(spec = {}) {
  const lang = langOf(spec);
  const L = dimension(spec.l, "l");
  const W = dimension(spec.w, "w");
  const H = dimension(spec.h, "h");
  const unit = unitOf(spec.unit);
  const biggest = Math.max(L.x, W.x, H.x);
  const smallest = Math.min(L.x, W.x, H.x);
  if (biggest / smallest > 25) fail("too-uneven", "The longest edge is more than 25 times the shortest; the prism cannot be drawn legibly.");

  const scale = Math.min(360 / (L.x + DEPTH * W.x * C45), 230 / (H.x + DEPTH * W.x * C45));
  const sl = L.x * scale;
  const sh = H.x * scale;
  const sw = DEPTH * W.x * scale; // drawn length of the depth edge
  const dx = sw * C45;
  const x0 = 84;
  const top = 34;
  const y0 = top + dx + sh;
  const w = x0 + sl + dx + 110;
  const hh = y0 + 58;
  const P = {
    fbl: [x0, y0],
    fbr: [x0 + sl, y0],
    ftl: [x0, y0 - sh],
    ftr: [x0 + sl, y0 - sh],
    bbl: [x0 + dx, y0 - dx],
    bbr: [x0 + sl + dx, y0 - dx],
    btl: [x0 + dx, y0 - sh - dx],
    btr: [x0 + sl + dx, y0 - sh - dx],
  };
  const pts = (...k) => k.map((n) => `${f1(P[n][0])},${f1(P[n][1])}`).join(" ");
  const edge = (a, b, dash = "") => line(P[a][0], P[a][1], P[b][0], P[b][1], { width: 2.5, dash });
  const u = unit ? ` ${unit}` : "";
  const label = (v) => `${v.label}${u}`;
  const midW = [(P.fbr[0] + P.bbr[0]) / 2, (P.fbr[1] + P.bbr[1]) / 2];
  const body = [
    `<polygon data-face="front" points="${pts("fbl", "fbr", "ftr", "ftl")}" fill="${COLOR.white}" stroke="none"/>`,
    `<polygon data-face="top" points="${pts("ftl", "ftr", "btr", "btl")}" fill="${LIGHT.faceTop}" stroke="none"/>`,
    `<polygon data-face="right" points="${pts("fbr", "bbr", "btr", "ftr")}" fill="${LIGHT.faceSide}" stroke="none"/>`,
    edge("bbl", "fbl", "6 5"),
    edge("bbl", "btl", "6 5"),
    edge("bbl", "bbr", "6 5"),
    `<polygon points="${pts("fbl", "fbr", "ftr", "ftl")}" fill="none" stroke="${COLOR.ink}" stroke-width="2.5"/>`,
    `<polygon points="${pts("ftl", "ftr", "btr", "btl")}" fill="none" stroke="${COLOR.ink}" stroke-width="2.5"/>`,
    `<polygon points="${pts("fbr", "bbr", "btr", "ftr")}" fill="none" stroke="${COLOR.ink}" stroke-width="2.5"/>`,
    text((P.fbl[0] + P.fbr[0]) / 2, y0 + 26, label(L), { size: 16, anchor: "middle", weight: "700", extra: ' data-edge="l"' }),
    text(x0 - 10, y0 - sh / 2 + 5, label(H), { size: 16, anchor: "end", weight: "700", extra: ' data-edge="h"' }),
    text(midW[0] + 10, midW[1] + 18, label(W), { size: 16, anchor: "start", weight: "700", extra: ' data-edge="w"' }),
  ].join("");

  const V = ratMul(ratMul(L.r, W.r), H.r);
  const S = ratMul(rat(2n), ratAdd(ratAdd(ratMul(L.r, W.r), ratMul(L.r, H.r)), ratMul(W.r, H.r)));
  const unitName = (power) => (unit ? `${unit}${power === 3 ? "³" : "²"}` : power === 3 ? (lang === "es" ? "unidades cúbicas" : "cubic units") : lang === "es" ? "unidades cuadradas" : "square units");
  const alt = both((l) =>
    l === "es"
      ? `Prisma rectangular de ${label(L)} de largo, ${label(W)} de ancho y ${label(H)} de alto.`
      : `Rectangular prism ${label(L)} long, ${label(W)} wide and ${label(H)} high.`,
  );
  return result({
    svg: frame({ p: "pr", w, h: hh, title: alt[lang], desc: `${alt[lang]} ${lang === "es" ? "Las aristas ocultas están punteadas. El fondo se dibuja a la mitad de su longitud (proyección oblicua)." : "Hidden edges are dashed. Depth is drawn at half length (oblique projection)."}`, lang, body }),
    alt,
    caption: both((l) => (l === "es" ? "Prisma rectangular (dibujo oblicuo, la profundidad está a media escala)" : "Rectangular prism (oblique drawing, depth drawn at half scale)")),
    data: {
      l: ratToNumber(L.r),
      w: ratToNumber(W.r),
      h: ratToNumber(H.r),
      unit,
      volume: { exact: ratToString(V, "decimal"), value: ratToNumber(V), unit: unitName(3) },
      surfaceArea: { exact: ratToString(S, "decimal"), value: ratToNumber(S), unit: unitName(2) },
      projection: { kind: "cabinet", angleDeg: 45, depthScale: DEPTH, scale: round(scale, 6), screen: { l: sl, w: sw, h: sh } },
    },
    table: {
      headers: lang === "es" ? ["Medida", "Valor"] : ["Measure", "Value"],
      rows: [
        [lang === "es" ? "Largo" : "Length", label(L)],
        [lang === "es" ? "Ancho" : "Width", label(W)],
        [lang === "es" ? "Alto" : "Height", label(H)],
      ],
    },
  });
}

// ── tape diagram ─────────────────────────────────────────────────────────────

/** @param {{parts:Array<number|string|{label?:string, value:number|string|null}>, total?:number|string, lang?:string}} spec */
export function tapeDiagramSvg(spec = {}) {
  const lang = langOf(spec);
  const raw = listIn(spec.parts, "parts", { min: 1, max: CAPS.parts });
  const parts = raw.map((it, i) => {
    const o = it !== null && typeof it === "object" ? it : { value: it };
    const label = textIn(o.label ?? (lang === "es" ? `Parte ${i + 1}` : `Part ${i + 1}`), `parts[${i}].label`, { max: 24 });
    if (o.value === null || o.value === undefined) return { label, unknown: true, r: null };
    const r = parseNumber(String(o.value));
    if (!r || ratCmp(r, rat(0n)) <= 0) fail("bad-part", `parts[${i}] must be a number greater than 0 (or null for the unknown part).`);
    return { label, unknown: false, r };
  });
  const unknowns = parts.filter((x) => x.unknown);
  if (unknowns.length > 1) fail("too-many-unknowns", "Only one part may be unknown.");
  let total = null;
  if (spec.total !== undefined && spec.total !== null) {
    total = parseNumber(String(spec.total));
    if (!total || ratCmp(total, rat(0n)) <= 0) fail("bad-total", "total must be a number greater than 0.");
  }
  const known = parts.filter((x) => !x.unknown).reduce((s, x) => ratAdd(s, x.r), rat(0n));
  if (unknowns.length === 1) {
    if (!total) fail("total-required", "A tape diagram with an unknown part needs the total.");
    const rest = ratSub(total, known);
    if (ratCmp(rest, rat(0n)) <= 0) fail("total-too-small", "The total must be larger than the known parts.");
    unknowns[0].r = rest;
  } else if (total && ratCmp(total, known) !== 0) {
    fail("total-mismatch", `The parts add to ${ratToString(known, "decimal")}, not ${ratToString(total, "decimal")}.`);
  }
  const sum = total ?? known;
  const BAR = 560;
  const x0 = 20;
  let cursor = 0;
  const cells = parts.map((pt) => {
    const share = ratToNumber(pt.r) / ratToNumber(sum);
    const width = share * BAR;
    const shown = pt.unknown ? "?" : ratToString(pt.r, "decimal");
    if (width < 30 || textWidth(shown, 15, true) > width)
      fail("too-uneven", `"${pt.label}" is too small to label. Parts differ too much in size for one tape.`);
    const cell = { ...pt, shown, x: x0 + cursor, width };
    cursor += width;
    return cell;
  });
  const barY = 56;
  const body = [
    line(x0, 30, x0 + BAR, 30, { width: 2 }),
    line(x0, 24, x0, 36, { width: 2 }),
    line(x0 + BAR, 24, x0 + BAR, 36, { width: 2 }),
    text(x0 + BAR / 2, 18, `${lang === "es" ? "Total" : "Total"} = ${ratToString(sum, "decimal")}`, { size: 16, anchor: "middle", weight: "700" }),
    ...cells.map((c, i) => `<rect data-part="${i + 1}" data-width="${f1(c.width)}" x="${f1(c.x)}" y="${barY}" width="${f1(c.width)}" height="46" fill="${patternFill("tp", i)}" stroke="${COLOR.ink}" stroke-width="2.5"/>${text(c.x + c.width / 2, barY + 66, c.shown, { size: 15, anchor: "middle", weight: "700" })}`),
    ...cells.map((c, i) => {
      const y = barY + 92 + i * 26;
      return `<rect x="${x0}" y="${y - 13}" width="26" height="16" fill="${patternFill("tp", i)}" stroke="${COLOR.ink}" stroke-width="1.5"/>${text(x0 + 36, y, `${c.label} = ${c.shown}`, { size: 14 })}`;
    }),
  ].join("");
  const w = BAR + 2 * x0;
  const h = barY + 92 + cells.length * 26 + 6;
  const alt = both((l) => {
    const list = cells.map((c) => `${c.label} ${c.unknown ? "?" : c.shown}`).join(", ");
    return l === "es" ? `Diagrama de cinta con ${cells.length} partes (${list}) y un total de ${ratToString(sum, "decimal")}.` : `Tape diagram with ${cells.length} part${cells.length === 1 ? "" : "s"} (${list}) and a total of ${ratToString(sum, "decimal")}.`;
  });
  return result({
    svg: frame({ p: "tp", w, h, title: alt[lang], desc: `${alt[lang]} ${lang === "es" ? "El ancho de cada parte es proporcional a su valor." : "Each part's width is proportional to its value."}`, lang, defs: patternDefs("tp"), body }),
    alt,
    caption: both((l) => (l === "es" ? "Diagrama de cinta (anchos proporcionales)" : "Tape diagram (widths to scale)")),
    data: {
      parts: cells.map((c) => ({ label: c.label, value: ratToString(c.r, "decimal"), valueNumber: ratToNumber(c.r), unknown: c.unknown, x: c.x, width: c.width })),
      total: ratToString(sum, "decimal"),
      totalNumber: ratToNumber(sum),
      barWidth: BAR,
    },
    table: {
      headers: lang === "es" ? ["Parte", "Valor"] : ["Part", "Value"],
      rows: [...cells.map((c) => [c.label, c.unknown ? "?" : c.shown]), ["Total", ratToString(sum, "decimal")]],
    },
  });
}

// ── coordinate plane ─────────────────────────────────────────────────────────

const STEPS = [1, 2, 5, 10, 20, 50];

/**
 * A coordinate plane with equal units on both axes (a 1-by-1 square is square). gridSvg in print/svg.js is a
 * square whole-number lattice with no points, so it cannot show separate x and y ranges or plotted points.
 * @param {{points?:Array<{x:number,y:number,label?:string}>, xRange:[number,number], yRange:[number,number], lang?:string}} spec
 */
export function coordinatePlaneSvg(spec = {}) {
  const lang = langOf(spec);
  const [xmin, xmax] = rangeIn(spec.xRange, "xRange");
  const [ymin, ymax] = rangeIn(spec.yRange, "yRange");
  const raw = listIn(spec.points ?? [], "points", { min: 0, max: CAPS.points });
  const points = raw.map((pt, i) => {
    const x = numberIn(pt?.x, `points[${i}].x`);
    const y = numberIn(pt?.y, `points[${i}].y`);
    if (x < xmin || x > xmax || y < ymin || y > ymax) fail("point-off-plane", `points[${i}] (${x}, ${y}) is outside the plane.`);
    return { x, y, label: textIn(pt?.label ?? "", `points[${i}].label`, { max: 20, required: false }) };
  });
  const unit = Math.min(44, 520 / (xmax - xmin), 520 / (ymax - ymin));
  const padL = 46;
  const padT = 30;
  const padR = 34;
  const padB = 44;
  const pw = (xmax - xmin) * unit;
  const ph = (ymax - ymin) * unit;
  const w = padL + pw + padR;
  const h = padT + ph + padB;
  const px = (x) => padL + (x - xmin) * unit;
  const py = (y) => padT + ph - (y - ymin) * unit;
  const step = STEPS.find((s) => s * unit >= 28) ?? 50;
  const tick = (min, max) => {
    const out = [];
    for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(round(v, 9));
    return out;
  };
  const xs = tick(xmin, xmax);
  const ys = tick(ymin, ymax);
  const ax = xmin <= 0 && xmax >= 0 ? px(0) : px(xmin);
  const ay = ymin <= 0 && ymax >= 0 ? py(0) : py(ymin);
  const parts = [];
  for (const v of xs) parts.push(line(px(v), padT, px(v), padT + ph, { stroke: COLOR.grid, width: 0.6, dash: "2 3" }));
  for (const v of ys) parts.push(line(padL, py(v), padL + pw, py(v), { stroke: COLOR.grid, width: 0.6, dash: "2 3" }));
  parts.push(line(padL, ay, padL + pw, ay, { width: 2.5 }), line(ax, padT, ax, padT + ph, { width: 2.5 }));
  parts.push(`<polygon points="${f1(padL + pw + 8)},${f1(ay)} ${f1(padL + pw)},${f1(ay - 5)} ${f1(padL + pw)},${f1(ay + 5)}" fill="${COLOR.ink}"/>`);
  parts.push(`<polygon points="${f1(ax)},${f1(padT - 8)} ${f1(ax - 5)},${f1(padT)} ${f1(ax + 5)},${f1(padT)}" fill="${COLOR.ink}"/>`);
  const both0 = xmin <= 0 && xmax >= 0 && ymin <= 0 && ymax >= 0;
  for (const v of xs) if (!(both0 && v === 0)) parts.push(text(px(v), ay === py(ymin) ? ay + 20 : ay + 19, fmt(v, lang), { size: 13, anchor: "middle", halo: true }));
  for (const v of ys) if (!(both0 && v === 0)) parts.push(text(ax - 7, py(v) + 5, fmt(v, lang), { size: 13, anchor: "end", halo: true }));
  if (both0) parts.push(text(ax - 7, ay + 19, "0", { size: 13, anchor: "end", halo: true }));
  parts.push(text(padL + pw + 10, ay + 20, "x", { size: 15, weight: "700", extra: ' font-style="italic"' }), text(ax + 10, padT - 8, "y", { size: 15, weight: "700", extra: ' font-style="italic"' }));
  const placed = [];
  const out = points.map((pt, i) => {
    const X = px(pt.x);
    const Y = py(pt.y);
    let label = "";
    if (pt.label) {
      const lw = textWidth(pt.label, 14, true);
      const tries = [[8, -8, "start"], [8, 18, "start"], [-8, -8, "end"], [-8, 18, "end"]];
      const fit = (t) => {
        const bx = t[2] === "start" ? X + t[0] : X + t[0] - lw;
        const box = { x: bx, y: Y + t[1] - 13, w: lw, h: 16 };
        const clash = placed.some((b) => box.x < b.x + b.w && b.x < box.x + box.w && box.y < b.y + b.h && b.y < box.y + box.h);
        return !clash && box.x >= 0 && box.x + box.w <= w ? box : null;
      };
      const t = tries.find((c) => fit(c)) ?? tries[0];
      const box = fit(t) ?? { x: t[2] === "start" ? X + t[0] : X + t[0] - lw, y: Y + t[1] - 13, w: lw, h: 16 };
      placed.push(box);
      label = text(X + t[0], Y + t[1], pt.label, { size: 14, anchor: t[2], weight: "700", halo: true });
    }
    const shape = i % 2 === 0 ? `<circle cx="${f1(X)}" cy="${f1(Y)}" r="6" fill="${COLOR.blue}" stroke="${COLOR.white}" stroke-width="2"` : `<rect x="${f1(X - 5.5)}" y="${f1(Y - 5.5)}" width="11" height="11" fill="${COLOR.orange}" stroke="${COLOR.white}" stroke-width="2"`;
    parts.push(`${shape} data-point="${i + 1}" data-x="${pt.x}" data-y="${pt.y}"/>${label}`);
    return { x: pt.x, y: pt.y, label: pt.label, px: f1(X), py: f1(Y), quadrant: pt.x === 0 || pt.y === 0 ? "axis" : pt.x > 0 ? (pt.y > 0 ? "I" : "IV") : pt.y > 0 ? "II" : "III" };
  });
  const list = out.map((o) => `${o.label ? `${o.label} ` : ""}(${fmt(o.x, lang)}, ${fmt(o.y, lang)})`).join("; ");
  const alt = both((l) =>
    l === "es"
      ? `Plano de coordenadas de x = ${fmt(xmin, l)} a ${fmt(xmax, l)} y de y = ${fmt(ymin, l)} a ${fmt(ymax, l)}${out.length ? `, con ${out.length} punto${out.length === 1 ? "" : "s"}: ${list}` : ""}.`
      : `Coordinate plane, x from ${fmt(xmin)} to ${fmt(xmax)} and y from ${fmt(ymin)} to ${fmt(ymax)}${out.length ? `, with ${out.length} point${out.length === 1 ? "" : "s"}: ${list}` : ""}.`,
  );
  return result({
    svg: frame({ p: "cp", w, h, title: alt[lang], desc: `${alt[lang]} ${lang === "es" ? "Cada unidad mide lo mismo en ambos ejes. Los puntos alternan círculo y cuadrado." : "Units are the same length on both axes. Points alternate circle and square."}`, lang, body: parts.join("") }),
    alt,
    caption: both((l) => (l === "es" ? "Plano de coordenadas" : "Coordinate plane")),
    data: { xRange: [xmin, xmax], yRange: [ymin, ymax], unit: round(unit, 4), tickStep: step, points: out },
    table: { headers: ["x", "y", lang === "es" ? "Nombre" : "Name"], rows: out.map((o) => [fmt(o.x, lang), fmt(o.y, lang), o.label]) },
  });
}


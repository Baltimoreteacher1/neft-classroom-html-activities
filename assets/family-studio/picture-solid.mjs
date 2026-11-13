// "Picture it" recognizers for solids: a rectangular prism (volume, surface area, a missing edge, a cube, unit cubes)
// and a square pyramid (lateral or total surface area). Same contract as picture-arith.mjs: match() is strict and
// reads every number in the stem, draw() labels the givens and draws the unknown as "?".

import { NUM, PAD, S, W, line, n1, num, qPill, show, text, tr } from "./picture-kit.mjs";

const FV = String.raw`\d+ \d+/\d+|\d+/\d+|${NUM}`;
const UNIT_RE = String.raw`cm|mm|m|in\.?|inches|inch|ft|feet|foot|yd|yards|meters|units`;
const V = String.raw`(${FV})(?: ?(${UNIT_RE})(?![\w]))?`;
const UNIT = { "in.": "in", inches: "in", inch: "in", feet: "ft", foot: "ft", yards: "yd", meters: "m", units: "" };
const ES_UNIT = { in: "pulg.", ft: "pies" };
const ES_CUBE = { in: "pulg³", ft: "pies³", yd: "yd³" };

/** "2 1/2" -> 2.5, "1/2" -> 0.5, "1,800" -> 1800. */
function val(t) {
  const m = String(t).match(/^(\d+) (\d+)\/(\d+)$/) || String(t).match(/^()(\d+)\/(\d+)$/);
  if (m) return +(m[1] || 0) + +m[2] / +m[3];
  return num(t);
}

const dim = (t, u) => ({ v: val(t), t: show(t), u: u === undefined ? undefined : (UNIT[u] ?? u) });

/** Every number token in the stem (mixed numbers and fractions as one token), skipping exponents. */
function numbers(s) {
  return [...s.matchAll(new RegExp(String.raw`(?<![\w.^/])(${FV})(?![\w/])`, "g"))].map((m) => m[1]);
}

function one(s, re) {
  const ms = [...s.matchAll(new RegExp(re, "gi"))];
  return ms.length === 1 ? ms[0] : null;
}

/** The edge unit shared by the labels, or null when the stem mixes units. */
function sharedUnit(ds) {
  const us = [...new Set(ds.map((d) => d.u).filter((u) => u !== undefined))];
  return us.length > 1 ? null : (us[0] ?? "");
}

// ---------------------------------------------------------------- rectangular prism

const PRISM_NO = /which|compare|\bmore\b|student|round|double|sort|match|\beach\b|explain|\bboth\b|two |three |by how much|first|\border\b|steps|\bface\b|layers?\b|\bwhy\b|lateral|pyramid|triang|net\b|estimate|about|different|cylinder|base area|recommend|least|greatest|bins?\b.*\bbins?\b|box [A-Z]\b|crate [A-Z]\b|design/i;
const ASK_VOL = /volume|how much space|how many (?:unit |1-(?:foot|inch|centimeter|cm) )?cubes|cubic/i;
const ASK_SA = /surface area|wrapping paper|paper covers|covers? (?:its surface|the whole|all its faces|every face)|cardboard|whole outside|all six faces/i;

const prism = {
  kind: "prism",
  match(s) {
    if (PRISM_NO.test(s)) return null;
    const ask = ASK_SA.test(s) && !/volume/i.test(s) ? "area" : ASK_VOL.test(s) ? "volume" : null;
    if (!ask) return null;
    const used = [];
    const take = (m, ...g) => (m ? g.map((i) => (used.push(m[i]), dim(m[i], m[i + 1]))) : null);
    let edges = null;
    let cube = false;
    let given = null;
    let m =
      one(s, String.raw`${V} long,? (?:and )?${V} wide,? (?:and )?${V} (?:tall|deep|high)`) ||
      one(s, String.raw`${V} (?:by|×) ${V} (?:by|×) ${V}`) ||
      one(s, String.raw`edge lengths ${V}, ${V},? and ${V}`);
    if (m) edges = take(m, 1, 3, 5);
    if (!edges) {
      const L = one(s, String.raw`(?:\blength(?: of| is| =)?|\bl =) ${V}`);
      const Wd = one(s, String.raw`(?:\bwidth(?: of| is| =)?|\bw =) ${V}`);
      const H = one(s, String.raw`(?:\bheight(?: of| is| =)?|\bh =) ${V}`);
      const got = [L, Wd, H];
      const vm = one(s, String.raw`\bvolume(?: of| is| =)? (${NUM})(?: ?(cm|m|in|ft|yd)\^3| cubic (?:centimeters|meters|inches|feet|units))?`);
      if (got.every(Boolean) && !vm) edges = got.map((g) => take(g, 1)[0]);
      else if (vm && got.filter(Boolean).length === 2 && ask === "volume") {
        const miss = got.findIndex((g) => !g);
        const word = ["length", "width", "height"][miss];
        const askRe = miss === 2 ? /(?:what is|find) (?:its |the )?height|how tall/i : new RegExp(`(?:what is|find) (?:its |the )?${word}`, "i");
        if (!askRe.test(s)) return null;
        edges = got.map((g) => (g ? take(g, 1)[0] : null));
        used.push(vm[1]);
        const u = vm[2] || { centimeters: "cm", meters: "m", inches: "in", feet: "ft", units: "" }[(s.slice(vm.index).match(/cubic (\w+)/) || [])[1]];
        given = { t: show(vm[1]), u };
      }
    }
    if (!edges) {
      m = one(s, String.raw`\bcube (?:has|with|that has) (?:an )?(?:edge length|edges?|side length|sides?)(?: length)?(?: of| that are)? ${V}`);
      if (m) {
        const e = take(m, 1)[0];
        edges = [e, e, e];
        cube = true;
      }
    }
    if (!edges) return null;
    if (!given && ask === "volume" && !/volume|how much space|cubes/i.test(s)) return null;
    // Every number in the stem must be one we read ("1-foot cubes" names the unit cube, not a measurement).
    const nums = numbers(s.replace(/\b1-(?:foot|inch|centimeter|cm)\b/g, " "));
    if (nums.length !== used.length || nums.some((x) => !used.includes(x))) return null;
    const unit = sharedUnit(edges.filter(Boolean));
    if (unit === null || edges.some((e) => e && !(e.v > 0 && e.v <= 1000))) return null;
    const cubes = /cubes/i.test(s) && !given && edges.every((e) => Number.isInteger(e.v) && e.v <= 8);
    return { edges, cube, given, ask, unit, cubes };
  },
  draw({ edges, cube, given, ask, unit, cubes }, lang) {
    const uL = (l) => (l === "es" ? (ES_UNIT[unit] ?? unit) : unit);
    const lab = (e, l) => (e ? `${e.t}${unit ? ` ${uL(l)}` : ""}` : "?");
    const [L, Wd, H] = edges;
    const vs = edges.map((e) => (e ? e.v : null));
    const known = vs.filter((v) => v !== null);
    const ref = Math.max(...known);
    const sz = (v, lo, hi, k) => Math.max(lo, Math.min(hi, ((v ?? ref * 0.6) / ref) * k));
    const fw = sz(vs[0], 90, 170, 170);
    const fh = sz(vs[2], 46, 96, 110);
    const d = sz(vs[1], 34, 76, 90);
    const dx = d * 0.72;
    const dy = d * 0.52;
    const x0 = Math.max(PAD + 64, (W - fw - dx) / 2);
    const yt = 14 + dy;
    const yb = yt + fh;
    const P = (pts) => pts.map(([x, y]) => `${n1(x)},${n1(y)}`).join(" ");
    const out = [];
    // Frame: the three visible faces, then the hidden edges dashed.
    out.push(`<polygon class="fp-p" points="${P([[x0, yt], [x0 + fw, yt], [x0 + fw, yb], [x0, yb]])}"/>`);
    out.push(`<polygon class="fp-p" points="${P([[x0, yt], [x0 + dx, yt - dy], [x0 + fw + dx, yt - dy], [x0 + fw, yt]])}"/>`);
    out.push(`<polygon class="fp-p" points="${P([[x0 + fw, yt], [x0 + fw + dx, yt - dy], [x0 + fw + dx, yb - dy], [x0 + fw, yb]])}"/>`);
    out.push(line(x0, yb, x0 + dx, yb - dy, "fp-dash"), line(x0 + dx, yb - dy, x0 + fw + dx, yb - dy, "fp-dash"), line(x0 + dx, yt - dy, x0 + dx, yb - dy, "fp-dash"));
    if (cubes) {
      const [l, w, h] = vs;
      const g = [];
      for (let i = 1; i < l; i++) g.push(line(x0 + (fw * i) / l, yt, x0 + (fw * i) / l, yb, "fp-gr"), line(x0 + (fw * i) / l, yt, x0 + (fw * i) / l + dx, yt - dy, "fp-gr"));
      for (let i = 1; i < h; i++) g.push(line(x0, yt + (fh * i) / h, x0 + fw, yt + (fh * i) / h, "fp-gr"), line(x0 + fw, yt + (fh * i) / h, x0 + fw + dx, yt + (fh * i) / h - dy, "fp-gr"));
      for (let i = 1; i < w; i++) {
        const ox = (dx * i) / w;
        const oy = (dy * i) / w;
        g.push(line(x0 + ox, yt - oy, x0 + fw + ox, yt - oy, "fp-gr"), line(x0 + fw + ox, yt - oy, x0 + fw + ox, yb - oy, "fp-gr"));
      }
      out.push(S(2, g));
    }
    const edgeLab = (e, x, y, anchor) =>
      e ? S(2, text(x, y, lab(e, lang), { anchor, cls: "fp-t fp-n" })) : S(3, qPill(anchor === "end" ? x - 18 : anchor === "start" ? x + 18 : x, y - 5));
    out.push(edgeLab(L, x0 + fw / 2, yb + 22, "middle"));
    out.push(edgeLab(H, x0 - 8, yt + fh / 2 + 5, "end"));
    out.push(edgeLab(Wd, x0 + fw + dx / 2 + 10, yb - dy / 2 + 14, "start"));
    const cy = yb + 52;
    const word = ask === "area" ? tr(lang, "Surface area", "Área total") : tr(lang, "Volume", "Volumen");
    if (given) {
      const cu = given.u ? ` ${lang === "es" ? (ES_CUBE[given.u] ?? `${given.u}³`) : `${given.u}³`}` : "";
      out.push(S(2, text(W / 2, cy + 5, `${word} = ${given.t}${cu}`, { cls: "fp-t fp-n" })));
    } else {
      out.push(S(3, text(W / 2 - 4, cy + 5, `${word} =`, { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 16, cy)));
    }
    const list = (l) => edges.map((e) => lab(e, l)).join(l === "es" ? " por " : " by ");
    const missing = ["length", "width", "height"][edges.findIndex((e) => !e)];
    const missingEs = { length: "el largo", width: "el ancho", height: "la altura" }[missing];
    const what = { en: ask === "area" ? "the surface area" : "the volume", es: ask === "area" ? "el área total" : "el volumen" };
    let cap;
    if (given) {
      const gv = `${given.t}${given.u ? ` ${given.u}³` : ""}`;
      const gvEs = `${given.t}${given.u ? ` ${ES_CUBE[given.u] ?? `${given.u}³`}` : ""}`;
      cap = {
        en: `A box with volume ${gv}, ${edges.map((e, i) => (e ? `${["length", "width", "height"][i]} ${lab(e, "en")}` : "")).filter(Boolean).join(" and ")}; the ${missing} is unknown`,
        es: `Una caja con volumen de ${gvEs}, ${edges.map((e, i) => (e ? `${["largo", "ancho", "altura"][i]} ${lab(e, "es")}` : "")).filter(Boolean).join(" y ")}; ${missingEs} es la incógnita`,
      };
    } else if (cube) {
      cap = { en: `A cube with every edge ${lab(L, "en")}; ${what.en} is unknown`, es: `Un cubo con todas las aristas de ${lab(L, "es")}; ${what.es} es la incógnita` };
    } else {
      cap = { en: `A box ${list("en")}; ${what.en} is unknown`, es: `Una caja de ${list("es")}; ${what.es} es la incógnita` };
    }
    const faces = ask === "area" ? { en: " It has 6 faces in 3 matching pairs.", es: " Tiene 6 caras en 3 pares iguales." } : { en: "", es: "" };
    const grid = cubes ? { en: " Grid lines show the unit cubes on the outside faces.", es: " Las líneas muestran los cubos unitarios en las caras de afuera." } : { en: "", es: "" };
    return {
      title: { en: cube ? "Sketch of the cube" : "Sketch of the box", es: cube ? "Dibujo del cubo" : "Dibujo de la caja" },
      caption: cap,
      desc: {
        en: `${cap.en}. Length along the front, height up the side, width going back.${faces.en}${grid.en}`,
        es: `${cap.es}. El largo va al frente, la altura hacia arriba y el ancho hacia atrás.${faces.es}${grid.es}`,
      },
      h: cy + 22,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- square pyramid

const PYR_NO = /which|compare|student|sort|match|order|steps|two pyramids|one triangular face|one lateral face|area of (?:one|its square|the square)|triangular pyramid|rectangular pyramid|before|explain|\bwhy\b/i;

const pyramid = {
  kind: "pyramid",
  match(s) {
    if (PYR_NO.test(s) || !/square pyramid/i.test(s)) return null;
    const used = [];
    const b =
      one(s, String.raw`base edge(?: of| is)? ${V}`) ||
      one(s, String.raw`base (?:(?:with sides|that is|is) )?(?:of )?${V} on each side`) ||
      one(s, String.raw`base with sides of ${V}`) ||
      one(s, String.raw`\bbase of ${V}`);
    const h = one(s, String.raw`slant height(?: of| is)? ${V}`);
    if (!b || !h) return null;
    used.push(b[1], h[1]);
    const lateral = /lateral|sides only|slanted faces|not the floor|only the sides|total area of its four triangle faces/i.test(s);
    const total = /surface area|bottom too|whole stand|covers it/i.test(s) && !lateral;
    if (lateral === total) return null;
    const nums = numbers(s.replace(/\b4 (?=triangle)/g, " "));
    if (nums.length !== 2 || nums.some((x) => !used.includes(x))) return null;
    const base = dim(b[1], b[2]);
    const slant = dim(h[1], h[2]);
    const unit = sharedUnit([base, slant]);
    if (unit === null) return null;
    return { base, slant, unit, lateral };
  },
  draw({ base, slant, unit, lateral }, lang) {
    const uL = (l) => (l === "es" ? (ES_UNIT[unit] ?? unit) : unit);
    const lab = (e, l) => `${e.t}${unit ? ` ${uL(l)}` : ""}`;
    const s = 150;
    const dx = 64;
    const dy = 40;
    const x0 = (W - s - dx) / 2;
    const yb = 164;
    const ap = [x0 + s / 2 + dx / 2, 18];
    const FL = [x0, yb];
    const FR = [x0 + s, yb];
    const BR = [x0 + s + dx, yb - dy];
    const BL = [x0 + dx, yb - dy];
    const P = (pts) => pts.map(([x, y]) => `${n1(x)},${n1(y)}`).join(" ");
    const out = [];
    out.push(`<polygon class="fp-p" points="${P([FL, FR, ap])}"/>`, `<polygon class="fp-p" points="${P([FR, BR, ap])}"/>`);
    out.push(line(FL[0], FL[1], BL[0], BL[1], "fp-dash"), line(BL[0], BL[1], BR[0], BR[1], "fp-dash"), line(BL[0], BL[1], ap[0], ap[1], "fp-dash"));
    const mid = [x0 + s / 2, yb];
    out.push(S(2, line(ap[0], ap[1], mid[0], mid[1], "fp-dash"), `<path class="fp-ln" d="M${n1(mid[0] - 9)} ${n1(yb)}v-9h9"/>`));
    out.push(S(2, text(mid[0], yb + 22, lab(base, lang), { cls: "fp-t fp-n" })));
    const sx = (ap[0] + mid[0]) / 2;
    const sy = (ap[1] + mid[1]) / 2;
    out.push(S(2, text(sx - 10, sy + 5, lab(slant, lang), { anchor: "end", cls: "fp-t fp-n" })));
    const word = lateral ? tr(lang, "Lateral area", "Área lateral") : tr(lang, "Surface area", "Área total");
    out.push(S(3, text(W / 2 - 4, yb + 53, `${word} =`, { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 16, yb + 48)));
    const cap = lateral
      ? { en: `A square pyramid: base edge ${lab(base, "en")}, slant height ${lab(slant, "en")}; the 4 triangle faces only`, es: `Una pirámide cuadrada: arista de la base ${lab(base, "es")}, altura inclinada ${lab(slant, "es")}; solo las 4 caras triangulares` }
      : { en: `A square pyramid: base edge ${lab(base, "en")}, slant height ${lab(slant, "en")}; 4 triangles plus the square base`, es: `Una pirámide cuadrada: arista de la base ${lab(base, "es")}, altura inclinada ${lab(slant, "es")}; 4 triángulos más la base cuadrada` };
    return {
      title: { en: "Sketch of the square pyramid", es: "Dibujo de la pirámide cuadrada" },
      caption: cap,
      desc: {
        en: `${cap.en}. The dashed line from the top to the middle of a base edge is the slant height. The area is unknown.`,
        es: `${cap.es}. La línea punteada desde la punta hasta el centro de una arista de la base es la altura inclinada. El área es la incógnita.`,
      },
      h: yb + 72,
      body: out.join(""),
    };
  },
};

export const SOLID = [prism, pyramid];

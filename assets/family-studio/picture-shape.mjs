// "Picture it" recognizers for composite area: a rectangle with a rectangular hole, two rectangles joined into an L
// or a T, a rectangle with a triangle on top (a house), and a regular polygon split into equal central triangles.
// Same contract as picture-arith.mjs: every given length is labelled, no area is printed, and the total is "?".

import { NUM, PAD, S, W, count, line, num, qPill, rect, show, text, tr } from "./picture-kit.mjs";

const UNIT = String.raw`(?: ?(ft|m|cm|in|inches|inch|feet|meters|yd|units?)\b\.?)?`;
const D = String.raw`(${NUM})${UNIT}`;
const BY = String.raw`${D} ?(?:by|×|x) ?${D}`;
const SHAPE_NO = /which|sort|match|explain|student|cost|\$|paint|tile|per square|each tile|compare|both|two ways|prove|double|first step|what do you do|steps|window|door|perimeter|how many triangles/i;
const ASK = /area|how much (?:ground|of the|patio|wall|land|space|is left|[a-z]+ is left)|square (?:feet|meters|units|inches|centimeters)|how many square/i;

const U_ES = { ft: "pies", feet: "pies", in: "pulg.", inches: "pulg." };
const unitOf = (ms) => {
  const us = [...new Set(ms.filter(Boolean).map((u) => ({ feet: "ft", inches: "in", meters: "m", units: "", unit: "" })[u] ?? u))];
  return us.length <= 1 ? (us[0] ?? "") : null;
};
/** "A" or "An" before a spoken number ("An 8 by 5 rectangle"). */
const an = (t) => (/^(?:8|11|18|80|800)(?!\d)/.test(String(t)) ? "An" : "A");
const lab = (v, u, lang) => `${show(v)}${u ? ` ${lang === "es" ? (U_ES[u] ?? u) : u}` : ""}`;

/** All numbers in the stem must be exactly the lengths read (no stray number). */
const onlyThese = (s, n) => count(s.replace(/\d+-sided|\(\d+ sides\)|\^\d/g, ""), new RegExp(String.raw`(?<![\w.])(?:${NUM})(?![\w]|[.,]\d)`, "g")) === n;

/** Fit a drawing of w x h model units into the box; returns scale. */
const fit = (w, h, bw = 250, bh = 140) => Math.min(bw / w, bh / h);

// ---------------------------------------------------------------- rectangle with a hole / two rectangles joined

function readRects(s) {
  const rs = [...s.matchAll(new RegExp(String.raw`(?<![\w.])${BY}`, "g"))];
  const sq = [...s.matchAll(new RegExp(String.raw`square [a-z]+ ${D} on each side`, "g"))];
  const all = [...rs.map((m) => ({ a: m[1], b: m[3], u: [m[2], m[4]], at: m.index })), ...sq.map((m) => ({ a: m[1], b: m[1], u: [m[2]], at: m.index }))].sort((x, y) => x.at - y.at);
  return all;
}

const composite = {
  kind: "composite-area",
  match(s) {
    if (SHAPE_NO.test(s) || !ASK.test(s)) return null;
    const rs = readRects(s);
    if (rs.length !== 2) return null;
    const u = unitOf(rs.flatMap((r) => r.u));
    if (u === null) return null;
    const n = rs.reduce((k, r) => k + (r.a === r.b && !s.includes(`${r.a} by ${r.b}`) && !s.includes(`${r.a} × ${r.b}`) ? 1 : 2), 0);
    if (!onlyThese(s, n)) return null;
    const [A, B] = rs.map((r) => ({ a: num(r.a), b: num(r.b), at: r.a, bt: r.b }));
    let mode = null;
    if (/\bhole\b|cut out|cut from|inside|sits in|in the middle|is left|left to|of what is left|land\b/i.test(s)) mode = "hole";
    else if (/\bL-sha|\bT-sha|joined|attached|on top of|made of two|split into|decompos|and then add|\badd\b|total area|together/i.test(s)) mode = /T-sha|on top of/i.test(s) ? "T" : "L";
    if (!mode) return null;
    if (mode === "hole") {
      const fitsIn = (A.a > B.a && A.b > B.b) || (A.a > B.b && A.b > B.a);
      if (!fitsIn) return null;
      if (!(A.a > B.a && A.b > B.b)) [B.a, B.b, B.at, B.bt] = [B.b, B.a, B.bt, B.at];
      return { mode, A, B, u, corner: /corner/i.test(s) };
    }
    return { mode, A, B, u };
  },
  draw({ mode, A, B, u, corner }, lang) {
    const out = [];
    const L = (v) => lab(v, u, lang);
    let h;
    if (mode === "hole") {
      const k = fit(A.a, A.b);
      const w = A.a * k;
      const hh = A.b * k;
      const x0 = (W - w) / 2;
      const y0 = 40;
      out.push(rect(x0, y0, w, hh, "fp-p", 0));
      const bw = B.a * k;
      const bh = B.b * k;
      const bx = corner ? x0 + w - bw : x0 + (w - bw) / 2;
      const by = corner ? y0 : y0 + (hh - bh) / 2;
      out.push(S(2, rect(bx, by, bw, bh, "fp-g", 0), `<rect class="fp-off fp-ink" x="${bx}" y="${by}" width="${bw}" height="${bh}"/>`));
      out.push(S(2, text(W / 2, y0 - 10, L(A.at), { cls: "fp-t fp-n" }), text(x0 - 8, y0 + hh / 2 + 5, L(A.bt), { anchor: "end", cls: "fp-t fp-n" })));
      out.push(S(2, text(bx + bw / 2, by + bh + 18 > y0 + hh ? by - 6 : by + bh + 18, L(B.at), { cls: "fp-t fp-s" }), text(bx + bw + 6, by + bh / 2 + 5, L(B.bt), { anchor: "start", cls: "fp-t fp-s" })));
      h = y0 + hh + 52;
      out.push(S(3, text(W / 2 - 8, h - 14, tr(lang, "area left =", "área que queda ="), { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 20, h - 19)));
    } else if (mode === "L") {
      // A stands on the left; B sits against A's right side on the same floor, with its side that fits upright.
      let [bw, bh, bwt, bht] = B.b <= A.b ? [B.a, B.b, B.at, B.bt] : [B.b, B.a, B.bt, B.at];
      if (bh > A.b) return null;
      if (bh === A.b) [bw, bh, bwt, bht] = [bw, bh, bwt, bht];
      const k = fit(A.a + bw, A.b, 240, 130);
      const x0 = (W - (A.a + bw) * k) / 2;
      const yb = 40 + A.b * k;
      out.push(rect(x0, yb - A.b * k, A.a * k, A.b * k, "fp-p", 0), rect(x0 + A.a * k, yb - bh * k, bw * k, bh * k, "fp-p", 0));
      out.push(line(x0 + A.a * k, yb - bh * k, x0 + A.a * k, yb, "fp-dash"));
      out.push(S(2, text(x0 + (A.a * k) / 2, yb - A.b * k - 8, L(A.at), { cls: "fp-t fp-n" }), text(x0 - 8, yb - (A.b * k) / 2 + 5, L(A.bt), { anchor: "end", cls: "fp-t fp-n" })));
      out.push(S(2, text(x0 + A.a * k + (bw * k) / 2, yb + 20, L(bwt), { cls: "fp-t fp-n" }), text(x0 + (A.a + bw) * k + 8, yb - (bh * k) / 2 + 5, L(bht), { anchor: "start", cls: "fp-t fp-n" })));
      h = yb + 64;
      out.push(S(3, text(W / 2 - 8, h - 14, tr(lang, "total area =", "área total ="), { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 20, h - 19)));
    } else {
      // T: A on top, B centred under it; B's upright side is its second number.
      if (B.a > A.a) return null;
      const k = fit(A.a, A.b + B.b, 240, 140);
      const x0 = (W - A.a * k) / 2;
      const y0 = 36;
      out.push(rect(x0, y0, A.a * k, A.b * k, "fp-p", 0), rect(x0 + ((A.a - B.a) * k) / 2, y0 + A.b * k, B.a * k, B.b * k, "fp-p", 0));
      out.push(S(2, text(W / 2, y0 - 8, L(A.at), { cls: "fp-t fp-n" }), text(x0 - 8, y0 + (A.b * k) / 2 + 5, L(A.bt), { anchor: "end", cls: "fp-t fp-n" })));
      out.push(S(2, text(W / 2, y0 + (A.b + B.b) * k + 20, L(B.at), { cls: "fp-t fp-n" }), text(x0 + ((A.a + B.a) * k) / 2 + 8, y0 + (A.b + B.b / 2) * k + 5, L(B.bt), { anchor: "start", cls: "fp-t fp-n" })));
      h = y0 + (A.b + B.b) * k + 60;
      out.push(S(3, text(W / 2 - 8, h - 14, tr(lang, "total area =", "área total ="), { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 20, h - 19)));
    }
    const d = (r, l) => `${L(r.at)} ${l === "es" ? "por" : "by"} ${L(r.bt)}`;
    const cap =
      mode === "hole"
        ? { en: `${an(A.at)} ${d(A, "en")} rectangle with a ${d(B, "en")} piece removed; the area left is unknown`, es: `Un rectángulo de ${d(A, "es")} al que se le quita una parte de ${d(B, "es")}; el área que queda es la incógnita` }
        : { en: `${an(A.at)} ${d(A, "en")} rectangle joined to ${an(B.at).toLowerCase()} ${d(B, "en")} rectangle; the total area is unknown`, es: `Un rectángulo de ${d(A, "es")} unido a un rectángulo de ${d(B, "es")}; el área total es la incógnita` };
    return {
      title: { en: "Composite figure", es: "Figura compuesta" },
      caption: cap,
      desc: { en: `${cap.en}. The drawing is to scale.`, es: `${cap.es}. El dibujo está a escala.` },
      h: Math.min(240, h),
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- rectangle with a triangle on top

const house = {
  kind: "composite-area",
  match(s) {
    if (SHAPE_NO.test(s) || !ASK.test(s) && !/total|in all|whole figure|figure/i.test(s)) return null;
    if (!/triangle|roof/i.test(s) || /hexagon|pentagon|octagon|decagon|trapezoid|parallelogram|rhombus/i.test(s)) return null;
    const r = s.match(new RegExp(String.raw`(?<![\w.])${BY}`));
    const b = s.match(new RegExp(String.raw`base(?: of)? ${D}`));
    const hh = s.match(new RegExp(String.raw`height(?: of)? ${D}`));
    if (!r || !b || !hh || !onlyThese(s, 4)) return null;
    const u = unitOf([r[2], r[4], b[2], hh[2]]);
    if (u === null) return null;
    const [ra, rb, tb, th] = [num(r[1]), num(r[3]), num(b[1]), num(hh[1])];
    let w = ra;
    let rh = rb;
    let [wt, ht] = [r[1], r[3]];
    if (tb !== ra) {
      if (tb !== rb) return null;
      [w, rh, wt, ht] = [rb, ra, r[3], r[1]];
    }
    return { w, rh, th, wt, ht, tht: hh[1], u };
  },
  draw({ w, rh, th, wt, ht, tht, u }, lang) {
    const L = (v) => lab(v, u, lang);
    const k = fit(w, rh + th, 220, 150);
    const x0 = (W - w * k) / 2;
    const yTop = 30;
    const yR = yTop + th * k;
    const out = [
      `<path class="fp-p" d="M${x0} ${yR}L${x0 + (w * k) / 2} ${yTop}L${x0 + w * k} ${yR}Z"/>`,
      rect(x0, yR, w * k, rh * k, "fp-p", 0),
      line(x0 + (w * k) / 2, yTop, x0 + (w * k) / 2, yR, "fp-dash"),
    ];
    out.push(S(2, text(W / 2, yR + rh * k + 20, L(wt), { cls: "fp-t fp-n" }), text(x0 - 8, yR + (rh * k) / 2 + 5, L(ht), { anchor: "end", cls: "fp-t fp-n" }), text(x0 + (w * k) / 2 + 6, yTop + (th * k) / 2 + 10, L(tht), { anchor: "start", cls: "fp-t fp-s" })));
    const h = yR + rh * k + 62;
    out.push(S(3, text(W / 2 - 8, h - 14, tr(lang, "total area =", "área total ="), { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 20, h - 19)));
    const cap = {
      en: `${an(wt)} ${L(wt)} by ${L(ht)} rectangle with a triangle on top (base ${L(wt)}, height ${L(tht)}); the total area is unknown`,
      es: `Un rectángulo de ${L(wt)} por ${L(ht)} con un triángulo encima (base ${L(wt)}, altura ${L(tht)}); el área total es la incógnita`,
    };
    return {
      title: { en: "Rectangle with a triangle", es: "Rectángulo con un triángulo" },
      caption: cap,
      desc: { en: `${cap.en}. The dashed line is the triangle's height.`, es: `${cap.es}. La línea punteada es la altura del triángulo.` },
      h: Math.min(240, h),
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- regular polygon from equal central triangles

const SIDES = { pentagon: 5, pentagonal: 5, hexagon: 6, hexagonal: 6, octagon: 8, decagon: 10 };
const NAMES = { 5: ["pentagon", "pentágono"], 6: ["hexagon", "hexágono"], 8: ["octagon", "octágono"], 10: ["decagon", "decágono"] };
const WORDS = { five: 5, six: 6, eight: 8, ten: 10 };

const polygon = {
  kind: "polygon-triangles",
  match(s) {
    if (SHAPE_NO.test(s) || !/area/i.test(s) || /\bone triangle\b|each triangle\b[^.]*\?$|of one\b|of each\b|≈|rounded|using those/i.test(s)) return null;
    const nm = s.match(/\b(pentagon|pentagonal|hexagon|hexagonal|octagon|decagon)\b/i);
    const tm = s.match(/\b(\d+|five|six|eight|ten) (?:identical |equal |congruent |central )*triangles\b/i);
    if (!nm && !tm) return null;
    const n = nm ? SIDES[nm[1].toLowerCase()] : null;
    const t = tm ? (WORDS[tm[1].toLowerCase()] ?? +tm[1]) : null;
    if (n && t && n !== t) return null;
    const sides = n ?? t;
    if (!NAMES[sides]) return null;
    const b = s.match(new RegExp(String.raw`base(?: of)? ${D}`));
    const h = s.match(new RegExp(String.raw`height(?: of)? ${D}`));
    const a = s.match(new RegExp(String.raw`(?:area of|of) (${NUM}) ?(?:square (units|feet|meters|inches|cm)|(cm|m|ft|in)(?:²|\^2)|sq\.? ?(?:units|ft|m|cm|in))`, "i"));
    const extra = tm && /^\d+$/.test(tm[1]) ? 1 : 0;
    if (b && h && !a) {
      if (!onlyThese(s, 2 + extra)) return null;
      const u = unitOf([b[2], h[2]]);
      if (u === null) return null;
      return { sides, bt: b[1], ht: h[1], u };
    }
    if (a && !b && !h) {
      if (!onlyThese(s.replace(/\^\d/g, ""), 1 + extra)) return null;
      const unit = (a[2] || a[3] || "").toLowerCase();
      const AU = { units: ["square units", "unidades cuadradas"], feet: ["square feet", "pies cuadrados"], meters: ["square meters", "metros cuadrados"], inches: ["square inches", "pulgadas cuadradas"], cm: ["square centimeters", "centímetros cuadrados"], m: ["m²", "m²"], ft: ["square feet", "pies cuadrados"], in: ["square inches", "pulgadas cuadradas"] }[unit] ?? ["", ""];
      return { sides, at: a[1], au: AU };
    }
    return null;
  },
  draw({ sides, bt, ht, u, at, au }, lang) {
    const cx = 120;
    const cy = 112;
    const R = 86;
    const P = Array.from({ length: sides }, (_, i) => {
      const t = -Math.PI / 2 + Math.PI / sides + (2 * Math.PI * i) / sides;
      return [cx + R * Math.cos(t), cy + R * Math.sin(t)];
    });
    // The bottom edge is P[k], P[k+1] where both have the largest y.
    const k = P.reduce((best, p, i) => (p[1] + P[(i + 1) % sides][1] > P[best][1] + P[(best + 1) % sides][1] ? i : best), 0);
    const [p1, p2] = [P[k], P[(k + 1) % sides]];
    const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2];
    const out = [`<path class="fp-g" d="M${P.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join("L")}Z"/>`];
    for (const p of P) out.push(line(cx, cy, p[0], p[1], "fp-gr"));
    const g = [`<path class="fp-p" d="M${cx} ${cy}L${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}Z"/>`];
    if (bt) {
      g.push(line(cx, cy, mid[0], mid[1], "fp-dash"), text(mid[0], mid[1] + 22, lab(bt, u, lang), { cls: "fp-t fp-n" }), text(cx + 6, (cy + mid[1]) / 2 + 4, lab(ht, u, lang), { anchor: "start", cls: "fp-t fp-s" }));
    } else g.push(text(cx, (cy + mid[1]) / 2 + 12, show(at), { cls: "fp-t fp-n" }));
    out.push(S(2, g));
    const [en, es] = NAMES[sides];
    out.push(S(2, text(250, 70, tr(lang, `${sides} equal`, `${sides} triángulos`), { cls: "fp-t fp-s" }), text(250, 90, tr(lang, "triangles", "iguales"), { cls: "fp-t fp-s" })));
    out.push(S(3, text(250, 130, tr(lang, `${en} area`, `área del ${es}`), { cls: "fp-t fp-s" }), qPill(250, 156)));
    const AU = (l) => (au?.[l === "es" ? 1 : 0] ? ` ${au[l === "es" ? 1 : 0]}` : "");
    const cap = bt
      ? { en: `A regular ${en} split into ${sides} equal triangles, each with base ${lab(bt, u, "en")} and height ${lab(ht, u, "en")}; the ${en}'s area is unknown`, es: `Un ${es} regular dividido en ${sides} triángulos iguales, cada uno con base ${lab(bt, u, "es")} y altura ${lab(ht, u, "es")}; el área del ${es} es la incógnita` }
      : { en: `A regular ${en} split into ${sides} equal triangles of area ${show(at)}${AU("en")} each; the ${en}'s area is unknown`, es: `Un ${es} regular dividido en ${sides} triángulos iguales de área ${show(at)}${AU("es")} cada uno; el área del ${es} es la incógnita` };
    return {
      title: { en: `Regular ${en} from triangles`, es: `${es[0].toUpperCase()}${es.slice(1)} regular con triángulos` },
      caption: cap,
      desc: { en: `${cap.en}. One triangle is shaded and labelled.`, es: `${cap.es}. Un triángulo está sombreado y rotulado.` },
      h: 226,
      body: out.join(""),
    };
  },
};

export const SHAPE = [composite, house, polygon];

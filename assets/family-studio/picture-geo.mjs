// "Picture it" recognizers for measurement stems: the area of one triangle / parallelogram / rhombus / trapezoid /
// rectangle, and a unit conversion drawn as a double number line. Same contract as picture-arith.mjs.

import { NUM, PAD, S, W, count, fmt, line, n1, num, qPill, show, text, textW, tr } from "./picture-kit.mjs";

// ---------------------------------------------------------------- area of one shape

const U = String.raw`(?: ?(cm|mm|km|m|in\.?|inches|inch|ft|feet|foot|yd|yards|meters|units)\b\.?)?`;
const V = String.raw`(${NUM})${U}`;
const UNIT = { "in.": "in", inches: "in", inch: "in", feet: "ft", foot: "ft", yards: "yd", meters: "m", units: "" };

const AREA_NO = /which (statement|measurement|number|formula|sides)|b1|b₁|first step|\bwhy\b|explain|mistake|wrong|student|double|tilt|compare|greater|\beach\b|sort|match|decompos|composite|shape[sd]? like|cut|hole|joined|attached|inside|split|hexagon|pentagon|octagon|polygon|prism|tiles|L-shaped|T-shaped|parallelograms|triangles|trapezoids|rectangles|two |both|\bA and B\b|perimeter|diagonal|volume/i;

function one(s, re) {
  const ms = [...s.matchAll(new RegExp(re, "gi"))];
  return ms.length === 1 ? ms[0] : null;
}

const area = {
  kind: "area",
  match(s) {
    if (AREA_NO.test(s)) return null;
    const kinds = [
      ["triangle", /triang/i],
      ["parallelogram", /parallelogram|rhomb/i],
      ["trapezoid", /trapez/i],
      ["rectangle", /rectang/i],
    ].filter(([, re]) => re.test(s));
    if (kinds.length !== 1) return null;
    const shape = kinds[0][0];
    const used = [];
    const take = (m, ...g) => {
      if (!m) return null;
      used.push(...g.map((i) => m[i]));
      return g.map((i) => ({ v: num(m[i]), t: show(m[i]), u: m[i + 1] }));
    };
    let bases = null;
    let height = null;
    let slant = null;
    if (shape === "trapezoid") {
      const m =
        one(s, String.raw`(?:bases|parallel sides|parallel bases)(?: of| are)? ${V},? and ${V}`) ||
        one(s, String.raw`top edge is ${V}, the bottom edge is ${V}`);
      bases = take(m, 1, 3);
    } else if (shape === "rectangle") {
      const m = one(s, String.raw`${V} (?:by|×) ${V}`);
      const d = take(m, 1, 3);
      if (d) [bases, height] = [[d[0]], d[1]];
    } else {
      const m =
        one(s, String.raw`\bbase(?: of| is| =)? ${V}`) ||
        one(s, String.raw`bottom edge is ${V}`) ||
        (shape === "parallelogram" ? one(s, String.raw`\b(?:each )?sides?(?: length)?(?: of| is| are)? ${V}`) : null);
      const b = take(m, 1);
      bases = b;
      if (shape === "parallelogram") slant = take(one(s, String.raw`slant(?:ed)? (?:side|edge)(?: of| is)? ${V}`), 1)?.[0] ?? null;
    }
    if (shape !== "rectangle") {
      const m = one(s, String.raw`height(?: of| is| =)? ${V}`) || one(s, String.raw`distance between them is ${V}`) || one(s, String.raw`${V} tall`);
      height = take(m, 1)?.[0] ?? null;
    }
    const am = one(s, String.raw`area(?: of| is| =)? (${NUM}) ?(?:(cm|m|in|ft|yd)²|sq(?:uare)? (?:cm|m|in|ft|feet|inches|units))?`);
    const given = am ? (used.push(am[1]), { v: num(am[1]), t: show(am[1]) }) : null;
    // Every number in the stem must be one we read, so nothing in the problem is left out of the picture.
    const nums = [...s.matchAll(new RegExp(String.raw`(?<![\w.^])(${NUM})`, "g"))].map((m) => m[1]);
    if (nums.length !== used.length || nums.some((x) => !used.includes(x))) return null;
    const u0 = [...(bases || []), height].find((d) => d?.u)?.u;
    const unit = u0 === undefined ? "" : (UNIT[u0] ?? u0);
    let unknown;
    if (given) {
      if (!bases && height) unknown = "base";
      else if (bases && !height) unknown = "height";
      else return null;
      if (shape === "trapezoid" || shape === "rectangle") return null;
      if (!new RegExp(String.raw`(what is|find)( its| the)? ${unknown}|which equation`, "i").test(s)) return null;
    } else {
      if (!bases || !height) return null;
      if (!/area|square|sq\b|cover|how much (ground|fabric|cloth|paint|glass)/i.test(s)) return null;
      unknown = "area";
    }
    if (!bases && unknown !== "base") return null;
    return { shape, bases, height, slant, given, unknown, unit };
  },
  draw(d, lang) {
    const { shape, height, slant, given, unknown, unit } = d;
    let bases = d.bases || [null];
    // Customary unit symbols read as English in Spanish text, so they are written the Spanish way there.
    const ES_UNIT = { in: "pulg.", ft: "pies", yd: "yd" };
    const uL = (l) => (l === "es" ? (ES_UNIT[unit] ?? unit) : unit);
    const Ll = (x, l) => (x ? `${x.t}${unit ? ` ${uL(l)}` : ""}` : "?");
    const L = (x) => Ll(x, lang);
    const bv = d.bases ? Math.max(...bases.map((b) => b.v)) : 1;
    const hv = height ? height.v : 1;
    let w = 200;
    let h = (w * hv) / bv;
    if (!d.bases || !height) h = 90;
    else if (h > 120 || h < 50) h = Math.max(50, Math.min(120, h));
    if (h === 120) w = Math.max(110, Math.min(200, (120 * bv) / hv));
    const x0 = (W - w) / 2 - (shape === "parallelogram" ? 24 : 0);
    const top = 24;
    const bot = top + h;
    const out = [];
    let hx;
    let pts;
    let topLabel = null;
    if (shape === "rectangle") {
      pts = [[x0, top], [x0 + w, top], [x0 + w, bot], [x0, bot]];
      hx = null;
    } else if (shape === "parallelogram") {
      const off = Math.min(60, w * 0.3);
      pts = [[x0 + off, top], [x0 + off + w, top], [x0 + w, bot], [x0, bot]];
      hx = x0 + off;
    } else if (shape === "triangle") {
      pts = [[x0 + w * 0.32, top], [x0 + w, bot], [x0, bot]];
      hx = x0 + w * 0.32;
    } else {
      const [b1, b2] = bases;
      const longFirst = b1.v >= b2.v;
      const lng = longFirst ? b1 : b2;
      const sht = longFirst ? b2 : b1;
      const tw = Math.max(50, (w * sht.v) / lng.v);
      const off = Math.min(30, (w - tw) / 2);
      pts = [[x0 + off, top], [x0 + off + tw, top], [x0 + w, bot], [x0, bot]];
      hx = x0 + off;
      topLabel = [x0 + off + tw / 2, L(sht)];
      bases = [lng];
    }
    out.push(`<polygon class="fp-p" points="${pts.map(([x, y]) => `${n1(x)},${n1(y)}`).join(" ")}"/>`);
    const baseLab = unknown === "base" ? null : L(bases[0]);
    if (baseLab) out.push(S(2, text(x0 + w / 2, bot + 22, baseLab, { cls: "fp-t fp-n" })));
    else out.push(S(3, qPill(x0 + w / 2, bot + 18)));
    if (topLabel) out.push(S(2, text(topLabel[0], top - 8, topLabel[1], { cls: "fp-t fp-n" })));
    if (hx === null) {
      out.push(S(2, text(x0 + w + 10, top + h / 2 + 5, L(height), { anchor: "start", cls: "fp-t fp-n" })));
    } else {
      out.push(line(hx, top, hx, bot, "fp-dash"), `<path class="fp-ln" d="M${n1(hx)} ${n1(bot - 10)}h10v10"/>`);
      if (unknown === "height") out.push(S(3, qPill(hx + 26, top + h / 2)));
      else out.push(S(2, text(hx + 8, top + h / 2 + 5, L(height), { anchor: "start", cls: "fp-t fp-n" })));
    }
    if (slant) out.push(S(2, text(x0 + (pts[0][0] - x0) / 2 - 8, top + h / 2 + 5, L(slant), { anchor: "end", cls: "fp-t fp-s" })));
    // The area sits on its own row under the base label, so it never meets the height or an outline.
    const cx = W / 2;
    const cy = bot + 52;
    const AUl = (l) => (unit ? ` ${l === "es" && ES_UNIT[unit] ? `${uL(l)} cuadrados` : `${unit}²`}` : "");
    const AU = AUl(lang);
    const aLab = tr(lang, "Area", "Área");
    if (unknown === "area") {
      out.push(S(3, text(cx - 14, cy + 5, `${aLab} =`, { anchor: "end", cls: "fp-t fp-n" }), qPill(cx + 4, cy)));
    } else {
      out.push(S(2, text(cx, cy + 5, `${aLab} = ${given.t}${AU}`, { cls: "fp-t fp-n" })));
    }
    const names = {
      triangle: ["triangle", "triángulo"],
      parallelogram: ["parallelogram", "paralelogramo"],
      trapezoid: ["trapezoid", "trapecio"],
      rectangle: ["rectangle", "rectángulo"],
    }[shape];
    const bE = (d.bases || []).map((b) => Ll(b, "en")).join(" and ");
    const bS = (d.bases || []).map((b) => Ll(b, "es")).join(" y ");
    const hE = Ll(height, "en");
    const hS = Ll(height, "es");
    const kn = {
      area: { en: `base ${bE}, height ${hE}; the area is unknown`, es: `base ${bS}, altura ${hS}; el área es la incógnita` },
      base: { en: `area ${given?.t}${AUl("en")}, height ${hE}; the base is unknown`, es: `área ${given?.t}${AUl("es")}, altura ${hS}; la base es la incógnita` },
      height: { en: `area ${given?.t}${AUl("en")}, base ${bE}; the height is unknown`, es: `área ${given?.t}${AUl("es")}, base ${bS}; la altura es la incógnita` },
    }[unknown];
    if (shape === "trapezoid") {
      kn.en = kn.en.replace("base ", "bases ");
      kn.es = kn.es.replace("base ", "bases ");
    }
    return {
      title: { en: `Sketch of the ${names[0]}`, es: `Dibujo del ${names[1]}` },
      caption: { en: `A ${names[0]} with ${kn.en}`, es: `Un ${names[1]} con ${kn.es}` },
      desc: {
        en: `A ${names[0]} with ${kn.en}.${hx !== null ? " The dashed line is the height, at a right angle to the base." : ""}`,
        es: `Un ${names[1]} con ${kn.es}.${hx !== null ? " La línea punteada es la altura, perpendicular a la base." : ""}`,
      },
      h: bot + 72,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- unit conversion (double number line)

const UNITS = {
  in: ["inches|inch|in\\.", "inches", "pulgadas", "inch", "pulgada"],
  ft: ["feet|foot|ft", "feet", "pies", "foot", "pie"],
  yd: ["yards|yard|yd", "yards", "yardas", "yard", "yarda"],
  mi: ["miles|mile", "miles", "millas", "mile", "milla"],
  gal: ["gallons|gallon|gal", "gallons", "galones", "gallon", "galón"],
  qt: ["quarts|quart|qt", "quarts", "cuartos de galón", "quart", "cuarto de galón"],
  pt: ["pints|pint", "pints", "pintas", "pint", "pinta"],
  c: ["cups|cup", "cups", "tazas", "cup", "taza"],
  lb: ["pounds|pound|lb", "pounds", "libras", "pound", "libra"],
  oz: ["ounces|ounce|oz", "ounces", "onzas", "ounce", "onza"],
  T: ["tons|ton", "tons", "toneladas", "ton", "tonelada"],
  km: ["kilometers|kilometer|kilometres|kilometre|km", "kilometers", "kilómetros", "kilometer", "kilómetro"],
  m: ["meters|meter|metres|metre|m", "meters", "metros", "meter", "metro"],
  cm: ["centimeters|centimeter|centimetres|centimetre|cm", "centimeters", "centímetros", "centimeter", "centímetro"],
  mm: ["millimeters|millimeter|millimetres|millimetre|mm", "millimeters", "milímetros", "millimeter", "milímetro"],
  L: ["liters|liter|litres|litre|L", "liters", "litros", "liter", "litro"],
  mL: ["milliliters|milliliter|millilitres|millilitre|mL", "milliliters", "mililitros", "milliliter", "mililitro"],
  kg: ["kilograms|kilogram|kg", "kilograms", "kilogramos", "kilogram", "kilogramo"],
  g: ["grams|gram|g", "grams", "gramos", "gram", "gramo"],
  mg: ["milligrams|milligram|mg", "milligrams", "miligramos", "milligram", "miligramo"],
  h: ["hours|hour", "hours", "horas", "hour", "hora"],
  min: ["minutes|minute", "minutes", "minutos", "minute", "minuto"],
  s: ["seconds|second", "seconds", "segundos", "second", "segundo"],
  day: ["days|day", "days", "días", "day", "día"],
  wk: ["weeks|week", "weeks", "semanas", "week", "semana"],
};
const FACTORS = {
  "ft|in": 12, "yd|ft": 3, "yd|in": 36, "mi|ft": 5280, "gal|qt": 4, "qt|pt": 2, "pt|c": 2, "gal|pt": 8, "lb|oz": 16,
  "T|lb": 2000, "m|cm": 100, "m|mm": 1000, "cm|mm": 10, "km|m": 1000, "L|mL": 1000, "kg|g": 1000, "g|mg": 1000,
  "h|min": 60, "min|s": 60, "day|h": 24, "wk|day": 7,
};
const UALT = Object.values(UNITS).map((u) => u[0]).join("|");
const unitOf = (w) => Object.keys(UNITS).find((k) => new RegExp(`^(?:${UNITS[k][0]})$`).test(w));
const CONV_NO = /\$|cost|price|per\b|each|dose|rate|speed|then|sort|match|complete|table|multiply or divide|\bwhy\b|which|explain|total|more|left|rounded|both|and then/i;

const convert = {
  kind: "conversion",
  match(s) {
    if (CONV_NO.test(s)) return null;
    let rel = null;
    s = s.replace(/^leg \d+: /i, "");
    let rest = s;
    const U = String.raw`(${UALT})(?![A-Za-z])`;
    let fm = s.match(new RegExp(String.raw`\(?1 ${U} (=|≈) (${NUM}) ${U}\)?`));
    // "There are 100 centimeters in 1 meter": the same fact, read the other way round.
    const tm = !fm && s.match(new RegExp(String.raw`\(?there are (${NUM}) ${U} in (?:1|one) ${U}\.?\)?`, "i"));
    if (tm) fm = [tm[0], tm[3], "=", tm[1], tm[2]];
    if (fm) {
      const a = unitOf(fm[1]);
      const b = unitOf(fm[4]);
      if (!a || !b || a === b) return null;
      rel = { big: a, small: b, k: num(fm[3]), approx: fm[2] === "≈", kt: show(fm[3]) };
      rest = s.replace(fm[0], " ");
    }
    const qs = [...rest.matchAll(new RegExp(String.raw`(?<![\w.])(${NUM}) (${UALT})\b`, "g"))];
    if (qs.length !== 1 || count(rest, new RegExp(NUM, "g")) !== 1) return null;
    const src = unitOf(qs[0][2]);
    const N = num(qs[0][1]);
    const tg = [...rest.matchAll(new RegExp(String.raw`(?:how many|to|= \?) (${UALT})\b`, "gi"))].map((m) => unitOf(m[1]));
    const tset = [...new Set(tg.filter((u) => u && u !== src))];
    if (!src || tset.length !== 1 || !(N > 0)) return null;
    const dst = tset[0];
    if (!rel) {
      if (FACTORS[`${src}|${dst}`]) rel = { big: src, small: dst, k: FACTORS[`${src}|${dst}`] };
      else if (FACTORS[`${dst}|${src}`]) rel = { big: dst, small: src, k: FACTORS[`${dst}|${src}`] };
      else return null;
      rel.kt = fmt(rel.k).replace(/\B(?=(\d{3})+$)/, ",");
    }
    if (![rel.big, rel.small].includes(src) || ![rel.big, rel.small].includes(dst)) return null;
    // N = 1 big unit, or N small units = exactly 1 big unit, would make the "1 = k" mark the answer itself.
    if ((src === rel.big && N === 1) || (src === rel.small && N === rel.k)) return null;
    return { ...rel, src, N, Nt: show(qs[0][1]) };
  },
  draw({ big, small, k, kt, approx, src, N, Nt }, lang) {
    const nm = (u) => UNITS[u][lang === "es" ? 2 : 1];
    const vb = src === big ? N : N / k;
    const x0 = Math.max(118, PAD + 10 + Math.max(textW(nm(big)), textW(nm(small))));
    const x1 = W - PAD - 22;
    const span = x1 - x0;
    let p1;
    let pv;
    if (vb >= 1) {
      p1 = vb <= 3.3 ? 1 / vb : 0.3;
      pv = 1;
    } else {
      p1 = 1;
      pv = Math.max(0.3, Math.min(0.7, vb));
    }
    const X = (p) => x0 + p * span;
    const yT = 52;
    const yB = 124;
    const out = [];
    for (const [y, u] of [
      [yT, big],
      [yB, small],
    ]) {
      out.push(line(x0, y, x1, y, "fp-ln"), text(PAD, y + 5, nm(u), { anchor: "start", cls: "fp-t fp-s" }));
    }
    const mark = (p, topLab, botLab) => {
      const x = X(p);
      out.push(line(x, yT - 8, x, yT + 8, "fp-ln"), line(x, yB - 8, x, yB + 8, "fp-ln"));
      const g = topLab === "0" ? 1 : 2;
      out.push(topLab === "?" ? S(3, qPill(x, yT - 24)) : S(g, text(x, yT - 16, topLab, { cls: "fp-t fp-n" })));
      out.push(botLab === "?" ? S(3, qPill(x, yB + 28)) : S(g, text(x, yB + 28, botLab, { cls: "fp-t fp-n" })));
    };
    mark(0, "0", "0");
    mark(p1, "1", kt);
    if (Math.abs(p1 - pv) > 1e-9) mark(pv, src === big ? Nt : "?", src === big ? "?" : Nt);
    out.push(line(X(p1), yT + 10, X(p1), yB - 10, "fp-dash"));
    const name = (u, v, l) => UNITS[u][(l === "es" ? 2 : 1) + (v === 1 ? 2 : 0)];
    const eq = approx ? "≈" : "=";
    const other = src === big ? small : big;
    const cap = {
      en: `1 ${name(big, 1, "en")} ${eq} ${kt} ${name(small, k, "en")}; ${Nt} ${name(src, N, "en")} = ? ${name(other, 2, "en")}`,
      es: `1 ${name(big, 1, "es")} ${eq} ${kt} ${name(small, k, "es")}; ${Nt} ${name(src, N, "es")} = ? ${name(other, 2, "es")}`,
    };
    return {
      title: { en: "Double number line", es: "Recta numérica doble" },
      caption: cap,
      desc: {
        en: `Two number lines, ${UNITS[big][1]} on top and ${UNITS[small][1]} below, lined up: 0 with 0, 1 with ${kt}. ${Nt} ${name(src, N, "en")} is marked; the matching amount is the unknown.`,
        es: `Dos rectas numéricas, ${UNITS[big][2]} arriba y ${UNITS[small][2]} abajo, alineadas: 0 con 0, 1 con ${kt}. Está marcada la cantidad ${Nt} ${name(src, N, "es")}; la cantidad que le corresponde es la incógnita.`,
      },
      h: yB + 50,
      body: out.join(""),
    };
  },
};


// ---------------------------------------------------------------- one price deal (double number line)

const NOUN = String.raw`([a-z]+(?:-[a-z]+)?)`;
const PRICE_NO = /better|which|compare|\bor\b|both|student|estimate|reasonable|each way|round trip|save|explain|\bA\b.*\bB\b|tax|tip|discount|each\b/i;
const stemOf = (w) => w.toLowerCase().replace(/(es|s)$/, "").slice(0, 5);

const price = {
  kind: "unit-rate",
  match(s) {
    if (PRICE_NO.test(s)) return null;
    const deals = [
      ...[...s.matchAll(new RegExp(String.raw`(?<![\w.$])(${NUM}) ${NOUN}(?: of [a-z]+)? (?:for|cost|costs) \$(${NUM})`, "g"))].map((m) => ({ n: m[1], w: m[2], p: m[3], at: m })),
      ...[...s.matchAll(new RegExp(String.raw`\$(${NUM}) for (${NUM}) ${NOUN}`, "g"))].map((m) => ({ n: m[2], w: m[3], p: m[1], at: m })),
    ];
    if (deals.length !== 1) return null;
    const d = deals[0];
    const N = num(d.n);
    const P = num(d.p);
    if (!(N > 0 && P > 0) || N === 1) return null;
    const rest = s.replace(d.at[0], " ");
    let M = null;
    let Mt = null;
    const t = rest.match(new RegExp(String.raw`(?:do|does|would|will) (${NUM}) ${NOUN} cost|cost of (${NUM}) ${NOUN}|up to (${NUM}) ${NOUN}|for (${NUM}) ${NOUN}\?`, "i"));
    if (t) {
      const g = t.slice(1).filter(Boolean);
      if (stemOf(g[1]) !== stemOf(d.w)) return null;
      M = num(g[0]);
      Mt = show(g[0]);
    } else if (new RegExp(String.raw`(?:price|cost) (?:for|of) (?:1|one) ${NOUN}|unit (?:rate|price)|per ${NOUN}|for 1 ${NOUN}|one ${NOUN} cost`, "i").test(rest)) {
      M = 1;
      Mt = "1";
    } else return null;
    // No number other than the deal and the asked amount: the picture must hold the whole problem.
    if (count(rest, new RegExp(NUM, "g")) !== (t ? 1 : count(rest, /\b1\b/g))) return null;
    if (M === N) return null;
    return { N, Nt: show(d.n), Pt: show(d.p), M, Mt };
  },
  draw({ N, Nt, Pt, M, Mt }, lang) {
    const x0 = 112;
    const x1 = W - PAD - 22;
    const top = Math.max(N, M);
    const X = (v) => x0 + ((x1 - x0) * Math.max(v / top, 0.22)) ;
    const yT = 52;
    const yB = 124;
    const out = [];
    for (const [y, en, es] of [
      [yT, "cost", "costo"],
      [yB, "amount", "cantidad"],
    ]) out.push(line(x0, y, x1, y, "fp-ln"), text(PAD, y + 5, tr(lang, en, es), { anchor: "start", cls: "fp-t fp-s" }));
    const mark = (x, a, b) => {
      out.push(line(x, yT - 8, x, yT + 8, "fp-ln"), line(x, yB - 8, x, yB + 8, "fp-ln"));
      const g = b === "0" ? 1 : 2;
      out.push(a === "?" ? S(3, qPill(x, yT - 24)) : S(g, text(x, yT - 16, a, { cls: "fp-t fp-n" })));
      out.push(S(g, text(x, yB + 28, b, { cls: "fp-t fp-n" })));
    };
    mark(x0, "$0", "0");
    mark(X(N), `$${Pt}`, Nt);
    mark(X(M), "?", Mt);
    out.push(line(X(N), yT + 10, X(N), yB - 10, "fp-dash"));
    const cap = {
      en: `${Nt} for $${Pt}; how much for ${Mt}?`,
      es: `${Nt} por $${Pt}; ¿cuánto cuestan ${Mt}?`,
    };
    if (M === 1) cap.es = `${Nt} por $${Pt}; ¿cuánto cuesta 1?`;
    return {
      title: { en: "Double number line", es: "Recta numérica doble" },
      caption: cap,
      desc: {
        en: `Two number lines, cost on top and amount below, lined up: 0 with $0, ${Nt} with $${Pt}. The cost of ${Mt} is the unknown.`,
        es: `Dos rectas numéricas, costo arriba y cantidad abajo, alineadas: 0 con $0, ${Nt} con $${Pt}. El costo de ${Mt} es la incógnita.`,
      },
      h: yB + 44,
      body: out.join(""),
    };
  },
};

export const GEO = [area, convert, price];

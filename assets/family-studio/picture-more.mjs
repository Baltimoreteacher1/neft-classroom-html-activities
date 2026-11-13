// "Picture it" recognizers for stems that state their pieces in a sentence: the faces whose areas add to a surface
// area, a running total changed step by step, a formula evaluated for a story's quantity, a distributive cost story,
// and one rectangle's perimeter, area or missing side. Same contract as picture-arith.mjs: no total, area, value or
// side the problem asks for is drawn.

import { ALG } from "./picture-alg.mjs";
import { NUM, S, W, count, line, num, qPill, rect, show, text, tr } from "./picture-kit.mjs";

const [distributive, , evaluate] = ALG;
const N = String.raw`(?:${NUM})`;
const WORD = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const k$ = (t) => WORD[String(t).toLowerCase()] ?? num(t);
const K = String.raw`(\d+|one|two|three|four|five|six|seven|eight|nine|ten)`;
const numCount = (s) => count(s, new RegExp(String.raw`(?<![\w.])${N}(?![\w]|[.,]\d)`, "g"));

// ---------------------------------------------------------------- faces whose areas add up

const AU = String.raw`(?: ?(?:square (units|feet|inches|meters|centimeters)|(cm|m|in|ft)(?:²|\^2)))?`;
const FACE_NO = /which|compare|student|sort|match|explain|list|two boxes|two pyramids|slant|before adding|find each|or a /i;

function faces(s) {
  const out = [];
  let used = 0;
  const add = (k, a, shape) => {
    out.push({ k, a, shape });
    used += 1;
  };
  let m;
  // "2 faces of 12 square units, 2 faces of 8 square units and 2 faces of 6 square units"
  for (const f of s.matchAll(new RegExp(String.raw`\b(\d+) faces of (${N})`, "g"))) {
    add(+f[1], f[2], "rect");
    used += 1;
  }
  if (out.length) return { out, used };
  // "The faces of a box have areas 6, 8 and 12, and each area appears twice"
  m = s.match(new RegExp(String.raw`faces of a box have areas (${N}), (${N}),? and (${N}),? and each area appears twice`));
  if (m) return { out: [1, 2, 3].map((i) => ({ k: 2, a: m[i], shape: "rect" })), used: 3 };
  // "6 equal squares, and each square has an area of 4 cm²"
  m = s.match(new RegExp(String.raw`\b(\d+|six) equal squares,? and each square has an area of (${N})`));
  if (m) return { out: [{ k: k$(m[1]), a: m[2], shape: "rect" }], used: /\d/.test(m[1]) ? 2 : 1 };
  // Triangle ends / bases + rectangles (triangular prism).
  const tri = s.match(new RegExp(String.raw`\b(?:(two|2) )?triang(?:le|ular) (?:ends|bases)(?: each)? (?:of|with an area of|with area) (${N})${AU}(?: each)?`)) || s.match(new RegExp(String.raw`each triangle end is (${N})`));
  const rects = s.match(new RegExp(String.raw`rect(?:angles|angular faces)(?: with areas)? (?:of )?(${N}), (${N}),? and (${N})`));
  if (tri && rects) {
    const ta = tri[2] ?? tri[1];
    return { out: [{ k: 2, a: ta, shape: "tri" }, ...[1, 2, 3].map((i) => ({ k: 1, a: rects[i], shape: "rect" }))], used: 4 + (tri[1] === "2" ? 1 : 0) };
  }
  // Pyramids: "four triangle faces of 10 square units each and a base of 16"
  const pt =
    s.match(new RegExp(String.raw`${K} (?:congruent )?triang(?:le|ular) faces(?:,)? (?:of|each with an area of) (${N})`, "i")) ||
    s.match(new RegExp(String.raw`triangle faces of a pyramid are (${N})${AU} each, and there are ${K} of them`, "i"));
  if (pt) {
    const [kk, aa] = pt[0].startsWith("triangle faces of a pyramid") ? [pt[pt.length - 1], pt[1]] : [pt[1], pt[2]];
    const r = { out: [{ k: k$(kk), a: aa, shape: "tri" }], used: (/\d/.test(kk) ? 1 : 0) + 1 };
    const b = s.match(new RegExp(String.raw`base(?: area)? of (${N})`));
    if (b) {
      r.out.push({ k: 1, a: b[1], shape: "base" });
      r.used += 1;
    }
    return r;
  }
  // "a lateral area of 40 and a base area of 16" / "a base area of 49 cm² and a total lateral area of 84 cm²"
  const la = s.match(new RegExp(String.raw`lateral area of (${N})`));
  const ba = s.match(new RegExp(String.raw`base area of (${N})`));
  if (la && ba && /surface area/i.test(s)) return { out: [{ k: 1, a: la[1], shape: "lat" }, { k: 1, a: ba[1], shape: "base" }], used: 2 };
  return null;
}

const faceSum = {
  kind: "face-sum",
  match(s) {
    if (FACE_NO.test(s)) return null;
    const lateral = /lateral area/i.test(s) && !/surface area/i.test(s);
    if (!lateral && !/surface area|all six faces|total area|paper/i.test(s)) return null;
    const f = faces(s);
    if (!f || numCount(s.replace(/\^\d/g, "")) !== f.used) return null;
    const tiles = f.out.flatMap((x) => Array.from({ length: x.k }, () => x));
    if (tiles.length < 2 || tiles.length > 8) return null;
    if (lateral && tiles.some((t) => t.shape === "lat")) return null;
    const um = s.match(/square (units|feet|inches|meters|centimeters)|(cm|m|in|ft)(?:²|\^2)/);
    return { tiles, lateral, unit: um ? (um[1] ? `square ${um[1]}` : `${um[2]}²`) : "" };
  },
  draw({ tiles, lateral, unit }, lang) {
    const per = Math.min(4, tiles.length);
    const rows = Math.ceil(tiles.length / per);
    const tw = 72;
    const gap = 10;
    const x0 = (W - per * tw - (per - 1) * gap) / 2;
    const out = [];
    tiles.forEach((t, i) => {
      const r = Math.floor(i / per);
      const c = i % per;
      const x = x0 + c * (tw + gap);
      const y = 30 + r * 70;
      const skip = lateral && t.shape === "base";
      const cls = skip ? "fp-dash" : "fp-p";
      let shape;
      if (t.shape === "tri") shape = `<path class="${cls}" d="M${x} ${y + 54}L${x + tw / 2} ${y}L${x + tw} ${y + 54}Z"/>`;
      else if (t.shape === "lat") shape = rect(x - 30, y, tw + 30, 54, cls, 2);
      else shape = rect(x + (t.shape === "base" ? 8 : 0), y + (t.shape === "base" ? 0 : 6), t.shape === "base" ? tw - 16 : tw, t.shape === "base" ? 54 : 44, cls, 2);
      out.push(shape, S(2, text(x + tw / 2 - (t.shape === "lat" ? 15 : 0), y + (t.shape === "tri" ? 44 : 33), show(t.a), { cls: "fp-t fp-n" })));
      const tag = { base: tr(lang, skip ? "base (not counted)" : "base", skip ? "base (no se cuenta)" : "base"), lat: tr(lang, "lateral", "lateral") }[t.shape];
      if (tag) out.push(text(x + tw / 2 - (t.shape === "lat" ? 15 : 0), y + 68, tag, { cls: "fp-t fp-s" }));
    });
    const yq = 30 + rows * 70 + 24;
    const word = lateral ? tr(lang, "lateral area =", "área lateral =") : tr(lang, "surface area =", "área total =");
    out.push(S(3, text(W / 2 + 14, yq, word, { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 40, yq - 5)));
    const list = tiles.filter((t) => !(lateral && t.shape === "base")).map((t) => show(t.a)).join(" + ");
    const U = unit ? { en: ` ${unit}`, es: ` ${unit.replace("square units", "unidades cuadradas").replace("square feet", "pies cuadrados").replace("square inches", "pulgadas cuadradas").replace("square meters", "metros cuadrados").replace("square centimeters", "centímetros cuadrados")}` } : { en: "", es: "" };
    const cap = lateral
      ? { en: `Face areas ${list}${U.en}; the lateral area (no base) is unknown`, es: `Áreas de las caras ${list}${U.es}; el área lateral (sin la base) es la incógnita` }
      : { en: `Face areas ${list}${U.en}; the surface area is unknown`, es: `Áreas de las caras ${list}${U.es}; el área total es la incógnita` };
    return {
      title: { en: "Faces of the solid", es: "Caras del cuerpo" },
      caption: cap,
      desc: { en: `${cap.en}. Each tile is one face, labelled with its area.`, es: `${cap.es}. Cada ficha es una cara, rotulada con su área.` },
      h: Math.min(240, yq + 22),
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- a running total changed step by step

const CHAIN_NO = /which|student|explain|estimate|round|goal|line up|each\b|per\b|times|calculation/i;
const MINUS = /unloads?|drains?|pour(?:s)? out|uses?|use|spend|spends|buy items costing|buys? (?:a|an) [a-z]+ for|and (?:a|an) [a-z]+ for/;
const PLUS = /loads?|pour(?:s)? in|adds?|add|pays you back|deposits?/;

const chain = {
  kind: "change-chain",
  match(s) {
    if (CHAIN_NO.test(s) || !/final|left|now\b|in all\b/i.test(s)) return null;
    const st = s.match(new RegExp(String.raw`\b(?:reads|holds|has|have|start with|starts with) \$?(${N}) ?(kg|liters|dollars)?`));
    if (!st) return null;
    const unit = st[2] ?? (s.includes(`$${st[1]}`) ? "$" : "");
    const steps = [];
    const re = new RegExp(String.raw`(${MINUS.source}|${PLUS.source}) \$?(${N})(?: (kg|liters))?(?: and \$?(${N}))?`, "g");
    for (const m of s.slice(st.index + st[0].length).matchAll(re)) {
      const sign = new RegExp(`^(?:${MINUS.source})$`).test(m[1]) ? -1 : 1;
      steps.push({ sign, v: m[2] });
      if (m[4]) steps.push({ sign, v: m[4] });
    }
    if (!steps.length || steps.length > 4 || numCount(s) !== steps.length + 1) return null;
    const total = steps.reduce((t, x) => t + x.sign * num(x.v), num(st[1]));
    if (!(total >= 0)) return null;
    return { start: st[1], unit, steps };
  },
  draw({ start, unit, steps }, lang) {
    const u = (v) => (unit === "$" ? `$${show(v)}` : `${show(v)}${unit ? ` ${unit === "liters" ? tr(lang, "L", "L") : unit === "dollars" ? "" : unit}` : ""}`);
    const out = [];
    const x = W / 2;
    let y = 22;
    const box = (t, cls) => rect(x - 70, y, 140, 30, cls, 6) + text(x, y + 21, t, { cls: "fp-t fp-n" });
    out.push(S(2, box(u(start), "fp-p"), text(x - 80, y + 20, tr(lang, "start", "inicio"), { anchor: "end", cls: "fp-t fp-s" })));
    const step = (180 - 22) / (steps.length + 1);
    for (const st of steps) {
      const y1 = y + 30;
      y += Math.max(40, step);
      out.push(S(2, line(x, y1, x, y - 4), `<polygon class="fp-ink" points="${x},${y} ${x - 5},${y - 9} ${x + 5},${y - 9}"/>`, text(x + 14, (y1 + y) / 2 + 5, `${st.sign < 0 ? "−" : "+"} ${u(st.v)}`, { anchor: "start", cls: "fp-t fp-n fp-ta" })));
    }
    out.push(S(3, qPill(x, y + 14)));
    const say = steps.map((t) => `${t.sign < 0 ? "take away" : "add"} ${u(t.v)}`).join(", then ");
    const sayEs = steps.map((t) => `${t.sign < 0 ? "se quitan" : "se agregan"} ${u(t.v)}`).join(", luego ");
    const cap = { en: `Start at ${u(start)}, ${say}; the final amount is unknown`, es: `Se empieza con ${u(start)}, ${sayEs}; la cantidad final es la incógnita` };
    return {
      title: { en: "Step-by-step changes", es: "Cambios paso a paso" },
      caption: cap,
      desc: { en: `${cap.en}. Each arrow is one change.`, es: `${cap.es}. Cada flecha es un cambio.` },
      h: Math.min(240, y + 36),
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- a formula evaluated for the story's quantity

const FORM_NO = /which|explain|student|table|graph|goal|budget|you have \$|total of \$|how many|work backw|write|sort|match|both|test|check|equivalent|simplify/i;
const RHS = String.raw`\d+(?:\.\d+)?[a-z](?: [+\-] \d+(?:\.\d+)?)?|\d+(?:\.\d+)? [+\-] \d+(?:\.\d+)?[a-z]`;

const formula = {
  kind: "substitution",
  match(s) {
    if (FORM_NO.test(s) || !/what is the (?:total )?cost|how much|find the (?:total )?cost|what is the cost|what does .* cost|cost for/i.test(s)) return null;
    const m = s.match(new RegExp(String.raw`\b[a-z] = (${RHS})(?![\w.])`)) || s.match(new RegExp(String.raw`\bexpression (${RHS}) gives|\bis (${RHS}) dollars, where`));
    if (!m) return null;
    const rhs = m[1];
    const v = rhs.match(/[a-z]/)[0];
    const rest = s.replace(m[0], " ");
    const ns = [...rest.matchAll(new RegExp(String.raw`(?<![\w.$])(\d+(?:\.\d+)?)(?:-| )([a-z]+)`, "g"))];
    if (ns.length !== 1 || numCount(rest) !== 1 || rest.includes(`$${ns[0][1]}`)) return null;
    return evaluate.match(`Evaluate ${rhs} when ${v} = ${ns[0][1]}.`);
  },
  draw: evaluate.draw,
};

// ---------------------------------------------------------------- a distributive cost story

const DIST_NO = /which|explain|student|both ways|factored|expanded|write/i;

const costStory = {
  kind: "area-model",
  match(s) {
    if (DIST_NO.test(s) || !/total|in all|altogether/i.test(s)) return null;
    let m = s.match(new RegExp(String.raw`^${K} [a-z ]+? each (?:get|gets|need|needs|has|have) (?:a|an) \$(${N}) [a-z ]+? and (?:a|an) \$(${N}) [a-z ]+?\.`, "i"));
    if (!m) m = s.match(new RegExp(String.raw`\b(?:packs|orders|buys|makes) ${K} [a-z]+\. Each [a-z]+ has (?:a|an) \$(${N}) [a-z ]+? and (?:a|an) \$(${N}) [a-z ]+?\.`, "i"));
    if (!m) {
      const c = s.match(new RegExp(String.raw`costs \$(${N}) for [a-z ]+ plus \$(${N}) for [a-z ]+\. ${K} [a-z]+ sign up`, "i"));
      if (c) m = [c[0], c[3], c[1], c[2]];
    }
    if (!m) return null;
    const k = k$(m[1]);
    if (!(k >= 2 && k <= 12) || numCount(s) !== (/\d/.test(m[1]) ? 3 : 2)) return null;
    return { a: String(k), b: m[2], c: m[3], mode: "expand", story: true };
  },
  draw: distributive.draw,
};

// ---------------------------------------------------------------- one rectangle: perimeter, area or a missing side

const RECT_NO = /which|student|explain|grid unit|1 unit =|cost|\$|vertices|draw|both|compare|sort|match|box|prism|face/i;
const RU = String.raw`(?: (units|feet|ft|meters|m|inches|in|cm|yards))?`;

const rectangle = {
  kind: "rectangle",
  match(s) {
    if (RECT_NO.test(s)) return null;
    let m = s.match(new RegExp(String.raw`\bis (${N})${RU} long and (${N})${RU} wide\. What is its (perimeter|area)\?`));
    if (m && numCount(s) === 2) return { a: m[1], b: m[3], u: m[2] || m[4] || "", ask: m[5] };
    m = s.match(new RegExp(String.raw`perimeter of the rectangle with side lengths (${N}) and (${N})${RU}\?`));
    if (m && numCount(s) === 2) return { a: m[1], b: m[2], u: m[3] || "", ask: "perimeter" };
    m = s.match(new RegExp(String.raw`(?:rectangular )?lot needs an area of (${N}) square (feet|meters|units)\. One side is (${N}) \2\. How long is the other side\?`));
    if (m && numCount(s) === 2) return { area: m[1], a: m[3], u: m[2], ask: "side" };
    return null;
  },
  draw({ a, b, u, ask, area }, lang) {
    const U = { feet: "ft", meters: "m", inches: "in", units: "", yards: "yd" }[u] ?? u;
    const L = (v) => `${show(v)}${U ? ` ${lang === "es" && U === "ft" ? "pies" : U}` : ""}`;
    const wv = num(a);
    const hv = b ? num(b) : num(area) / wv;
    const k = Math.min(220 / wv, 120 / hv, 220 / Math.max(wv, hv) * 4);
    const w = Math.max(80, Math.min(240, wv * k));
    const h = Math.max(50, Math.min(120, hv * k));
    const x0 = (W - w) / 2;
    const y0 = 40;
    const out = [rect(x0, y0, w, h, "fp-p", 0)];
    out.push(S(2, text(x0 + w / 2, y0 - 10, L(a), { cls: "fp-t fp-n" })));
    if (b) out.push(S(2, text(x0 - 8, y0 + h / 2 + 5, L(b), { anchor: "end", cls: "fp-t fp-n" })));
    else out.push(S(2, text(x0 + w / 2, y0 + h / 2 + 6, `${tr(lang, "area", "área")} ${show(area)}`, { cls: "fp-t fp-n" })), S(3, qPill(x0 - 24, y0 + h / 2)));
    if (ask !== "side") {
      const word = ask === "perimeter" ? tr(lang, "perimeter =", "perímetro =") : tr(lang, "area =", "área =");
      out.push(S(3, text(W / 2 + 10, y0 + h + 36, word, { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 36, y0 + h + 31)));
    }
    const cap =
      ask === "side"
        ? { en: `A rectangle with area ${show(area)} square ${u} and one side ${L(a)}; the other side is unknown`, es: `Un rectángulo de área ${show(area)} y un lado de ${L(a)}; el otro lado es la incógnita` }
        : { en: `A ${L(a)} by ${L(b)} rectangle; its ${ask} is unknown`, es: `Un rectángulo de ${L(a)} por ${L(b)}; su ${ask === "perimeter" ? "perímetro" : "área"} es la incógnita` };
    return {
      title: { en: "Rectangle", es: "Rectángulo" },
      caption: cap,
      desc: { en: `${cap.en}.`, es: `${cap.es}.` },
      h: y0 + h + (ask === "side" ? 24 : 54),
      body: out.join(""),
    };
  },
};

export const MORE = [faceSum, chain, formula, costStory, rectangle];

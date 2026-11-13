// "Picture it" recognizers for ratio and fraction stems: a ratio table with a missing value, a fraction of a whole
// number (tape), mixed number <-> improper fraction (fraction bars), and fraction division told as a story (the
// fraction-division picture from picture-arith.mjs). Same contract as picture-arith.mjs.

import { fracdiv } from "./picture-arith.mjs";
import { NUM, PAD, S, W, bracket, frac, line, num, qPill, rect, show, text, textW, tr } from "./picture-kit.mjs";

// ---------------------------------------------------------------- nouns a ratio table may name (EN plural, ES plural)

const NOUNS = {
  egg: ["eggs", "huevos"], flour: ["flour", "harina"], water: ["water", "agua"], sugar: ["sugar", "azúcar"],
  rice: ["rice", "arroz"], raisin: ["raisins", "pasas"], nut: ["nuts", "nueces"], peanut: ["peanuts", "maníes"],
  milk: ["milk", "leche"], juice: ["juice", "jugo"], vinegar: ["vinegar", "vinagre"], oil: ["oil", "aceite"],
  soap: ["soap", "jabón"], butter: ["butter", "mantequilla"], cream: ["cream", "crema"], pretzel: ["pretzels", "pretzels"],
  cereal: ["cereal", "cereal"], honey: ["honey", "miel"], lemon: ["lemon", "limón"], soil: ["soil", "tierra"],
  sand: ["sand", "arena"], cheese: ["cheese", "queso"], cracker: ["crackers", "galletas saladas"], oat: ["oats", "avena"],
  student: ["students", "estudiantes"], adult: ["adults", "adultos"], teacher: ["teachers", "maestros"],
  aide: ["aides", "asistentes"], counselor: ["counselors", "consejeros"], mile: ["miles", "millas"],
  hour: ["hours", "horas"], minute: ["minutes", "minutos"], inch: ["inches", "pulgadas"], foot: ["feet", "pies"],
  lap: ["laps", "vueltas"], pound: ["pounds", "libras"], kilogram: ["kilograms", "kilogramos"], kg: ["kg", "kg"],
  mg: ["mg", "mg"], gallon: ["gallons", "galones"], meter: ["meters", "metros"], kilometer: ["kilometers", "kilómetros"],
  ounce: ["ounces", "onzas"], ticket: ["tickets", "boletos"], game: ["games", "juegos"], point: ["points", "puntos"],
  car: ["cars", "carros"], ride: ["rides", "viajes"], page: ["pages", "páginas"], day: ["days", "días"],
  week: ["weeks", "semanas"], poster: ["posters", "pósteres"], box: ["boxes", "cajas"], red: ["red", "rojo"],
  blue: ["blue", "azul"], yellow: ["yellow", "amarillo"], paint: ["paint", "pintura"], word: ["words", "palabras"],
  mix: ["mix", "mezcla"], soda: ["soda", "refresco"], broth: ["broth", "caldo"], vegetable: ["vegetables", "verduras"],
  banana: ["bananas", "plátanos"], strawberry: ["strawberries", "fresas"],
  girl: ["girls", "niñas"], boy: ["boys", "niños"], widget: ["widgets", "piezas"], cherry: ["cherry", "cereza"],
  load: ["loads", "cargas"], liter: ["liters", "litros"],
  "$": ["dollars", "dólares"],
};
const IRREG = { feet: "foot", inches: "inch", boxes: "box", kilometers: "kilometer", strawberries: "strawberry", lemons: "lemon" };

/** The dictionary key for a noun phrase ("cups of olive oil" -> oil, "spoons" -> null), or null. */
function nounKey(phrase) {
  if (phrase === "$") return "$";
  const words = phrase.toLowerCase().split(" ");
  for (const w of [words.at(-1), words[0]]) {
    const k = IRREG[w] ?? w.replace(/(?<=[^s])s$/, "");
    if (NOUNS[k]) return k;
  }
  return null;
}

const MEAS = String.raw`(?:cups?|spoons?|tablespoons?|teaspoons?|buckets?|drops?|scoops?|bags?|jars?) of `;
/** A quantity: "$45" (groups: money) or "4 cups of flour" / "180-mile" (groups: number, noun). */
const Q = String.raw`(?:\$(${NUM})|(${NUM})(?:-| )(?:${MEAS})?((?:olive |lemon |red |yellow |cherry )?[a-z]+))`;
const q3 = (m, i) => (m[i] ? [m[i], "$"] : [m[i + 1], m[i + 2]]);

// ---------------------------------------------------------------- ratio table with one missing value

const RATIO_NO = /which|compare|better|faster|student|sort|match|explain|\bboth\b|\bleft\b|estimate|about|\bor\b|instead|goal|now there|scale factor from|divide both|multiply both|next row|third row|first row|simplest|equivalent\?|\bare\b.*equivalent|\bis\b \d+ ?: ?\d+ equivalent|more\b|≈|\bthen\b|convert|percent|%|recipe [A-Z]\b|\b[A-Z] (?:uses|sells|goes|does|runs)\b|cost (?:per|of one)|unit (?:rate|price)/i;

function bareRatio(s) {
  const pairs = [...s.matchAll(/(?<![\w./])(\d+|\?|_{2,}) ?: ?(\d+|\?|_{2,})(?![\w/]|\.\d|:)/g)];
  if (pairs.length !== 2) return null;
  const cells = pairs.flatMap((p) => [p[1], p[2]]);
  const unk = cells.filter((c) => !/^\d+$/.test(c));
  if (unk.length !== 1) return null;
  const rest = pairs.reduce((t, p) => t.replace(p[0], " "), s);
  if (new RegExp(NUM).test(rest)) return null;
  const v = cells.map((c) => (/^\d+$/.test(c) ? c : null));
  return { rows: [null, null], cols: [[v[0], v[1]], [v[2], v[3]]], money: [false, false] };
}

function storyRatio(s) {
  const rels = [];
  const two = (re) => {
    for (const m of s.matchAll(new RegExp(re, "gi"))) rels.push({ a: q3(m, 1), b: q3(m, 4), at: m[0] });
  };
  two(String.raw`(?<![\w.])${Q} (?:for every|for each) ${Q}`);
  two(String.raw`\b(?:uses|mixes|mix) ${Q} (?:for|with|to|and) ${Q}`);
  two(String.raw`^[A-Z][a-z]+ (?:is|are) ${Q} for ${Q}`);
  two(String.raw`\bthere are ${Q} in ${Q}`);
  two(String.raw`\b(?:produces|prints|travels|goes|drives|runs|reads|types|walks|swims|earns|makes|scores|burns|bikes) ${Q} in ${Q}`);
  for (const m of s.matchAll(new RegExp(String.raw`(?<![\w.])${Q} (?:each|per|an|a|every) ([a-z]+)\b`, "g")))
    rels.push({ a: q3(m, 1), b: ["1", m[4]], at: m[0] });
  for (const m of s.matchAll(/\b([a-z]+) cost \$(\d+(?:\.\d+)?) each\b/gi)) rels.push({ a: ["1", m[1]], b: [m[2], "$"], at: m[0] });
  for (const m of s.matchAll(new RegExp(String.raw`(?:ratio of )?\b([a-z]+) to ([a-z]+) is (\d+) ?: ?(\d+)`, "gi")))
    rels.push({ a: [m[3], m[1]], b: [m[4], m[2]], at: m[0] });
  for (const m of s.matchAll(new RegExp(String.raw`(?<![\w.])(\d+) ([a-z]+) ?: ?(\d+) ([a-z]+)`, "g")))
    rels.push({ a: [m[1], m[2]], b: [m[3], m[4]], at: m[0] });
  if (rels.length !== 1) return null;
  const r = rels[0];
  let ka = nounKey(r.a[1]);
  let kb = nounKey(r.b[1]);
  // "3 lemon snowballs for every 4 cherry snowballs": the rows differ by their first word.
  if (ka && ka === kb) [ka, kb] = [nounKey(r.a[1].split(" ")[0]), nounKey(r.b[1].split(" ")[0])];
  if (!ka || !kb || ka === kb) return null;
  // The third quantity: exactly one more number in the stem, naming one of the two rows.
  const rest = s.replace(r.at, " ");
  const qs = [...rest.matchAll(new RegExp(String.raw`(?<![\w.])${Q}`, "g"))];
  if (qs.length !== 1 || (rest.match(new RegExp(String.raw`(?<![\w.])${NUM}`, "g")) || []).length !== 1) return null;
  const [cv, cn] = q3(qs[0], 1);
  let kc = nounKey(cn);
  if (kc && kc !== ka && kc !== kb && cn.includes(" ")) kc = nounKey(cn.split(" ")[0]);
  if (kc !== ka && kc !== kb) return null;
  const unknown = kc === ka ? kb : ka;
  // The question must ask for the other row (by its noun, "how far" for distance, "how much ... earn/cost" for money).
  const ask = rest.slice(qs[0].index + qs[0][0].length).concat(" ", rest.slice(0, qs[0].index));
  const q = ask.match(/how (?:many|much|far|long)\b[^?.]*|what (?:is|amount)[^?.]*/i);
  if (!q) return null;
  const qKey = [...q[0].matchAll(/[a-z]+/gi)].map((w) => nounKey(w[0])).find((k) => k === ka || k === kb);
  const far = /how far/i.test(q[0]) && ["mile", "kilometer", "meter", "foot"].includes(unknown);
  const money = unknown === "$" && /how much|earn|cost|pay|total/i.test(q[0]);
  if (qKey !== unknown && !far && !money) return null;
  const col1 = [r.a[0], r.b[0]];
  const col2 = kc === ka ? [cv, null] : [null, cv];
  return { rows: [ka, kb], cols: [col1, col2], money: [ka === "$", kb === "$"] };
}

const ratioTable = {
  kind: "ratio-table",
  match(s) {
    if (RATIO_NO.test(s) || !/\?|_{2}|how|what|find/i.test(s)) return null;
    return bareRatio(s) || storyRatio(s);
  },
  draw({ rows, cols, money }, lang) {
    const named = rows[0] !== null;
    const labW = named ? Math.max(...rows.map((k) => textW(NOUNS[k][lang === "es" ? 1 : 0], 14))) + 16 : 0;
    const cw = 92;
    const rh = 44;
    const tw = labW + 2 * cw;
    const x0 = (W - tw) / 2;
    const y0 = 34;
    const out = [];
    const v = (t, i) => (money[i] ? `$${show(t)}` : show(t));
    for (let i = 0; i < 2; i++) {
      out.push(rect(x0, y0 + i * rh, tw, rh, "fp-g", 0));
      if (named) out.push(text(x0 + 10, y0 + i * rh + 27, NOUNS[rows[i]][lang === "es" ? 1 : 0], { anchor: "start", cls: "fp-t fp-s" }));
    }
    for (let c = 0; c <= 2; c++) if (named || c > 0) out.push(line(x0 + labW + c * cw - (c === 0 ? 0 : 0), y0, x0 + labW + c * cw, y0 + 2 * rh, "fp-ln"));
    cols.forEach((col, c) =>
      col.forEach((t, i) => {
        const cx = x0 + labW + c * cw + cw / 2;
        const cy = y0 + i * rh + rh / 2;
        if (t === null) out.push(S(3, qPill(cx, cy)));
        else out.push(S(2, rect(x0 + labW + c * cw + 4, y0 + i * rh + 4, cw - 8, rh - 8, "fp-p", 4), text(cx, cy + 6, v(t, i), { cls: "fp-t fp-n" })));
      }),
    );
    out.push(text(W / 2, y0 - 12, tr(lang, "Same ratio in both columns", "La misma razón en las dos columnas"), { cls: "fp-t fp-s" }));
    const name = (i, l) => NOUNS[rows[i]][l === "es" ? 1 : 0];
    const pair = (col, l) => col.map((t, i) => (t === null ? "?" : v(t, i))).join(l === "es" ? " a " : " to ");
    const cap = named
      ? {
          en: `${name(0, "en")} to ${name(1, "en")}: ${pair(cols[0], "en")}, so ${pair(cols[1], "en")}`,
          es: `${name(0, "es")} a ${name(1, "es")}: ${pair(cols[0], "es")}; entonces, ${pair(cols[1], "es")}`,
        }
      : { en: `${cols[0].map((t) => t ?? "?").join(":")} and ${cols[1].map((t) => t ?? "?").join(":")} are the same ratio`, es: `${cols[0].map((t) => t ?? "?").join(":")} y ${cols[1].map((t) => t ?? "?").join(":")} son la misma razón` };
    return {
      title: { en: "Ratio table", es: "Tabla de razones" },
      caption: cap,
      desc: {
        en: `A ratio table with two columns that show the same ratio. ${cap.en}. The missing value is the unknown.`,
        es: `Una tabla de razones con dos columnas que muestran la misma razón. ${cap.es}. El valor que falta es la incógnita.`,
      },
      h: y0 + 2 * rh + 16,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- fraction of a whole number (tape)

const FOF_NO = /which|first|estimate|about|sort|match|order|without|as (?:tall|long|many|much)|shortcut|explain|student (?:says|thinks|claims|wrote)|more|left|remain|\bnot\b|percent|%|÷|×|then|both|rest/i;

const WN = { one: 1, two: 2, three: 3, four: 4, five: 5 };
const WD = { half: 2, halves: 2, third: 3, thirds: 3, fourth: 4, fourths: 4, quarter: 4, quarters: 4, fifth: 5, fifths: 5 };
const WORD_FRAC = /\b(one|two|three|four|five) (half|halves|thirds?|fourths?|quarters?|fifths?) of\b/gi;

const fractionOf = {
  kind: "fraction-of",
  match(s0) {
    if (FOF_NO.test(s0) || !/how many|what is|find|how much|how long|how far/i.test(s0)) return null;
    // "Three fourths of the 20 chairs" reads as 3/4 of the 20 chairs.
    const s = s0.replace(WORD_FRAC, (m, a, b) => `${WN[a.toLowerCase()]}/${WD[b.toLowerCase()]} of`);
    const fm = [...s.matchAll(/(?<![\w./])(\d+)\/(\d+) of\b/g)];
    if (fm.length !== 1) return null;
    const n = +fm[0][1];
    const d = +fm[0][2];
    if (!(n > 0 && n < d && d >= 2 && d <= 12)) return null;
    const rest = s.replace(fm[0][0], " ");
    const nums = [...rest.matchAll(new RegExp(String.raw`(?<![\w./])\$?(${NUM})(?![\w/]|[.,]\d)`, "g"))];
    if (nums.length !== 1) return null;
    const N = num(nums[0][1]);
    if (!(N > 0) || !Number.isInteger(N) || N > 100000) return null;
    // The whole must be the "of" object: "2/3 of 30", or "N things ... n/d of them / of the things".
    const after = s.slice(fm[0].index + fm[0][0].length);
    const direct = new RegExp(String.raw`^ (?:the )?\$?${nums[0][1].replace(/[$.]/g, "\\$&")}\b`).test(after);
    const them = /^ (?:them|these|those|the [a-z]+|its [a-z]+|her [a-z]+|his [a-z]+)\b/.test(after) && nums[0].index < fm[0].index;
    if (!direct && !them) return null;
    return { n, d, Nt: show(nums[0][1]).replace(/^/, s.includes(`$${nums[0][1]}`) ? "$" : "") };
  },
  draw({ n, d, Nt }, lang) {
    const x0 = PAD + 8;
    const bw = W - 2 * PAD - 16;
    const pw = bw / d;
    const y = 58;
    const bh = 40;
    const out = [];
    for (let i = 0; i < d; i++) out.push(rect(x0 + i * pw, y, pw, bh, "fp-g", 0));
    out.push(S(2, bracket(x0, x0 + bw, y - 8, -1), text(W / 2, y - 20, Nt, { cls: "fp-t fp-n" })));
    for (let i = 0; i < n; i++) out.push(S(2, rect(x0 + i * pw, y, pw, bh, "fp-p", 0)));
    out.push(S(2, text(W / 2, y + bh + 66, tr(lang, `${d} equal parts, ${n} shaded`, `${d} partes iguales, ${n} ${n === 1 ? "sombreada" : "sombreadas"}`), { cls: "fp-t fp-s" })));
    out.push(S(3, bracket(x0, x0 + n * pw, y + bh + 8, 1), qPill(x0 + (n * pw) / 2, y + bh + 30)));
    const F = `${n}/${d}`;
    const cap = { en: `${F} of ${Nt}: the tape is ${Nt}, cut into ${d} equal parts; ${n === 1 ? "1 part is" : `${n} parts are`} the unknown`, es: `${F} de ${Nt}: la cinta es ${Nt}, cortada en ${d} partes iguales; ${n === 1 ? "1 parte es" : `${n} partes son`} la incógnita` };
    return {
      title: { en: `Tape diagram for ${F} of ${Nt}`, es: `Diagrama de cinta para ${F} de ${Nt}` },
      caption: cap,
      desc: { en: `${cap.en}. The size of each part is not shown.`, es: `${cap.es}. No se muestra el tamaño de cada parte.` },
      h: y + bh + 82,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- mixed number <-> improper fraction (fraction bars)

const mixed = {
  kind: "mixed-number",
  match(s) {
    if (/each|which|sort|match|then|divide|÷|×|student/i.test(s)) return null;
    let m = s.match(/^(?:write|convert|rewrite|change) (\d+) (\d+)\/(\d+) (?:as|to|into) an improper fraction\.?$/i);
    if (m) {
      const [w, a, b] = [+m[1], +m[2], +m[3]];
      if (!(w >= 1 && w <= 5 && a > 0 && a < b && b <= 10)) return null;
      return { w, a, b, to: "improper" };
    }
    m = s.match(/^(?:write|convert|rewrite|change) (\d+)\/(\d+) (?:as|to|into) a mixed number\.?$/i);
    if (m) {
      const [n, b] = [+m[1], +m[2]];
      if (!(n > b && b >= 2 && b <= 10 && Math.ceil(n / b) <= 5 && n % b !== 0)) return null;
      return { w: Math.floor(n / b), a: n % b, b, n, to: "mixed" };
    }
    return null;
  },
  draw({ w, a, b, n, to }, lang) {
    const bars = w + 1;
    const x0 = PAD + 40;
    const bw = W - x0 - PAD - 8;
    const pw = bw / b;
    const bh = Math.min(28, 150 / bars - 8);
    const y0 = 40;
    const out = [];
    const total = w * b + a;
    for (let r = 0; r < bars; r++) {
      const y = y0 + r * (bh + 8);
      for (let i = 0; i < b; i++) out.push(rect(x0 + i * pw, y, pw, bh, "fp-g", 0));
      out.push(text(x0 - 10, y + bh / 2 + 5, "1", { anchor: "end", cls: "fp-t fp-s" }));
      for (let i = 0; i < b; i++) if (r * b + i < total) out.push(S(2, rect(x0 + i * pw, y, pw, bh, "fp-p", 0)));
    }
    const given = to === "improper" ? `${w} ${a}/${b}` : `${n}/${b}`;
    const yq = y0 + bars * (bh + 8) + 22;
    out.push(S(2, text(W / 2, 24, given, { cls: "fp-t fp-n" })));
    out.push(S(3, text(W / 2 - 4, yq + 5, `${given} =`, { anchor: "end", cls: "fp-t fp-n" }), qPill(W / 2 + 18, yq)));
    const cap =
      to === "improper"
        ? {
            en: `${given}: ${w === 1 ? "1 whole bar" : `${w} whole bars`} and ${a}/${b} more, each cut into ${b} equal pieces`,
            es: `${given}: ${w === 1 ? "1 barra entera" : `${w} barras enteras`} y ${a}/${b} más, cada una cortada en ${b} partes iguales`,
          }
        : { en: `${given}: ${n} pieces of size 1/${b}, in bars of ${b}`, es: `${given}: ${n} partes de tamaño 1/${b}, en barras de ${b}` };
    return {
      title: { en: `Fraction bars for ${given}`, es: `Barras de fracciones para ${given}` },
      caption: cap,
      desc: {
        en: `${cap.en}. Each bar is one whole. The ${to === "improper" ? "improper fraction" : "mixed number"} is the unknown.`,
        es: `${cap.es}. Cada barra es un entero. ${to === "improper" ? "La fracción impropia" : "El número mixto"} es la incógnita.`,
      },
      h: yq + 22,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- fraction division told as a story

const FV = String.raw`\d+ \d+/\d+|\d+/\d+|\d+`;
const STORY_NO = /which|sort|match|again|left ?over|remainder|whole|full\b|explain|student|mistake|before|predict|without|rewrite|keep, change|reciprocal|check|both|then|\bmodel\b|×|÷|equation|expression|of (?:a|an|the|her|his) /i;
const SIZE = [
  String.raw`\bone [a-z]+(?: of [a-z]+)? (?:uses|holds|needs|takes) (${FV})`,
  String.raw`\b(${FV}) (?:cups?|pounds?|feet|foot|yards?|miles?|gallons?) of [a-z]+ per [a-z]+`,
  String.raw`\bof (${FV}) [a-z]+ each\b`,
  String.raw`\beach [a-z]+ covers a (${FV})`,
  String.raw`\beach (?:[a-z'-]+ ){0,3}(?:holds?|uses?|is|needs?|gets?|has|takes?)(?: a| exactly)? (${FV})`,
  String.raw`\b(\d+/\d+) [a-z]+ per [a-z]+`,
  String.raw`\beach (${FV})(?= [a-z]+ (?:long|wide))`,
  String.raw`\bthat are each (${FV})`,
  String.raw`\bare each (${FV})`,
  String.raw`\beach (?:is )?(${FV}) (?:of a |of an )?[a-z]+ long`,
  String.raw`(?<![\w/])(${FV})-[a-z]+ (?:[a-z]+ )?(?:pieces|scoops?|cups|servings|bags|slices|sections|strips|bottles|glasses|jars)`,
  String.raw`\bevery (${FV}) (?:of an? )?[a-z]+`,
  String.raw`\binto (${FV})-[a-z]+ pieces`,
];

/** "each hold 4/5 of a pound" -> "each hold 4/5 pound": a unit after a group size is not "a fraction of a whole". */
const UNIT_OF = new RegExp(String.raw`(\beach (?:[a-z'-]+ ){0,3}(?:holds?|uses?|is|needs?|gets?|takes?)(?: a| exactly)? (?:${FV})|\beach (?:${FV})) of an? (?=(?:pound|cup|gallon|liter|quart|yard|foot|mile|loaf|pizza|hour)\b)`, "gi");

/** "A trail is 5/6 of a mile": a fraction of a measuring unit is an amount, not a part of a whole. */
const UNIT_OF_ANY = /(?<![\w/])(\d+\/\d+) of an? (?=(?:pound|cup|gallon|liter|quart|yard|foot|mile|hour)\b)/g;
/** "A scoop holds 1/4 pound": a group size named by its container, used only when nothing else names one. */
const SIZE_LAST = [String.raw`\ba [a-z]+ holds (${FV})`];

const fracStory = {
  kind: "fraction-division",
  match(s0) {
    const s = s0.replace(/^(?:room|mission|lock|stop|path|level) \d+\s*[—:-]\s*[^:]*?:\s*/i, "").replace(/^(?:room|mission|lock|stop) \d+\s*[—:-]\s*/i, "").replace(UNIT_OF, "$1 ").replace(UNIT_OF_ANY, "$1 ");
    if (STORY_NO.test(s) || !/how many|how much|what fraction|how long|how big/i.test(s)) return null;
    const nums = [...s.matchAll(new RegExp(String.raw`(?<![\w./])(${FV})(?![\w/]|[.,]\d)`, "g"))].map((m) => m[1]);
    if (nums.length !== 2 || !nums.some((t) => t.includes("/"))) return null;
    // Partitive: a fraction shared into k equal parts.
    const share = s.match(new RegExp(String.raw`(?:split|splits|shared?|poured|divided|cut|walk)(?: [a-z]+){0,3} (?:evenly |equally )?(?:into|among|by|between|onto) (\d+)\b`, "i"));
    if (share && /how much|what fraction|how long|how big/i.test(s)) {
      const k = share[1];
      const T = nums.find((t) => t !== k);
      if (!T?.includes("/") || nums.filter((t) => t === k).length !== 1) return null;
      return fracdiv.match(`${T} ÷ ${k}`);
    }
    if (!/how many/i.test(s)) return null;
    let sizes = SIZE.flatMap((re) => [...s.matchAll(new RegExp(re, "gi"))].map((m) => m[1]));
    if (!sizes.length) sizes = SIZE_LAST.flatMap((re) => [...s.matchAll(new RegExp(re, "gi"))].map((m) => m[1]));
    if (new Set(sizes).size !== 1) return null;
    const B = sizes[0];
    const T = nums.find((t) => t !== B);
    if (!T || nums.filter((t) => t === B).length !== 1) return null;
    const a = frac(T);
    const b = frac(B);
    if (!a || !b || b.v >= a.v) return null;
    return fracdiv.match(`${T} ÷ ${B}`);
  },
  draw: fracdiv.draw,
};

export const RATIO = [ratioTable, fractionOf, mixed, fracStory];

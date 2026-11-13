// "Picture it" recognizers for rates: two deals compared through their unit rates, one rate asked "per 1", and the
// parts of a two-group ratio drawn as counters. Same contract as picture-arith.mjs: the unit rates, totals and
// answers are never drawn; each stem must read unambiguously or the recognizer returns null.

import { NUM, PAD, S, W, bracket, count, dot, num, qPill, rect, show, text, textW, tr } from "./picture-kit.mjs";

// ---------------------------------------------------------------- shared nouns (English plural -> Spanish plural)

/** Nouns a rate or ratio picture may print. A noun missing here is drawn with a generic word instead. */
export const ES_NOUN = {
  apples: "manzanas", bags: "bolsas", balls: "pelotas", "bouncy balls": "pelotas", bars: "barras", "candy bars": "barras de dulce",
  batteries: "pilas", bottles: "botellas", "water bottles": "botellas de agua", boxes: "cajas", "juice boxes": "cajitas de jugo",
  cans: "latas", cars: "carros", cupcakes: "pastelitos", crackers: "galletas saladas", cups: "tazas", dollars: "dólares",
  eggs: "huevos", games: "juegos", gallons: "galones", gigabytes: "gigabytes", hamburgers: "hamburguesas", hats: "gorras",
  hours: "horas", laps: "vueltas", loads: "cargas", mangoes: "mangos", markers: "marcadores", miles: "millas",
  minutes: "minutos", min: "minutos", months: "meses", notebooks: "cuadernos", ounces: "onzas", oz: "onzas", pages: "páginas",
  pens: "bolígrafos", pencils: "lápices", pizzas: "pizzas", plays: "jugadas", points: "puntos", pounds: "libras",
  quiches: "quiches", "mini quiches": "miniquiches", rides: "viajes", seconds: "segundos", shirts: "camisas", "T-shirts": "camisetas",
  tickets: "boletos", tokens: "fichas", weeks: "semanas", days: "días", liters: "litros", kilometers: "kilómetros",
  meters: "metros", feet: "pies", inches: "pulgadas", grapes: "uvas", "red grapes": "uvas rojas", "green grapes": "uvas verdes",
  girls: "niñas", boys: "niños", kids: "niños", adults: "adultos", trucks: "camiones", strawberries: "fresas",
  bananas: "plátanos", chefs: "chefs", helpers: "ayudantes", marbles: "canicas", students: "estudiantes", teachers: "maestros",
  "cups of flour": "tazas de harina", "cups of water": "tazas de agua", "cups of milk": "tazas de leche", "cup of cream": "taza de crema",
  flour: "harina", water: "agua", milk: "leche", cream: "crema", sandwiches: "sándwiches", loaves: "panes", cookies: "galletas",
};

const sing = (w) => w.replace(/ies$/, "y").replace(/(ch|sh|x|ss|o)es$/, "$1").replace(/(?<=[^s])s$/, "");
const stemOf = (w) => sing(w.toLowerCase().split("-").at(-1)).slice(0, 5);
const esNoun = (w) => ES_NOUN[w] ?? ES_NOUN[w.toLowerCase()] ?? null;

// ---------------------------------------------------------------- reading deals

/** Deal names a stem may give ("Store A", "Brand X:", "Pack B has"): English word -> Spanish word. */
const LABEL_ES = {
  Store: "Tienda", Brand: "Marca", Pack: "Paquete", Plan: "Plan", Machine: "Máquina", Runner: "Corredor", Car: "Carro",
  Bag: "Bolsa", Shop: "Tienda", Theater: "Cine", Gym: "Gimnasio", Laundromat: "Lavandería", Company: "Compañía",
  Printer: "Impresora", Fountain: "Fuente", Chef: "Chef", Drone: "Dron", Team: "Equipo", Option: "Opción", Deal: "Oferta", Bin: "Caja", Juice: "Jugo", Pizza: "Pizza", Seller: "Vendedor", Recipe: "Receta",
};
const LABEL = new RegExp(String.raw`\b(${Object.keys(LABEL_ES).join("|")}) ([A-Z])\b`, "g");

const NOUN = String.raw`((?:[A-Za-z]+-)?[a-z]+(?: [a-z]+)?)`;
const MONEY = [
  [new RegExp(String.raw`(?<![\w.$])(${NUM}) ${NOUN} (?:for|cost|costs) \$(${NUM})`, "g"), (m) => ({ n: m[1], a: m[2], p: m[3], b: "$" })],
  [new RegExp(String.raw`\$(${NUM}) for (${NUM}) ${NOUN}`, "g"), (m) => ({ n: m[2], a: m[3], p: m[1], b: "$" })],
  // "a 2-liter bottle for $3.00" / "A 5-pack of markers costs $3.50"
  [new RegExp(String.raw`(?<![\w.$])(${NUM})-(liter|pound|ounce|gallon) [a-z]+ (?:for|costs?) \$(${NUM})`, "g"), (m) => ({ n: m[1], a: `${m[2]}s`, p: m[3], b: "$" })],
  [new RegExp(String.raw`(?<![\w.$])(${NUM})-pack of ([a-z]+) costs? \$(${NUM})`, "g"), (m) => ({ n: m[1], a: m[2], p: m[3], b: "$" })],
];
/** "2 cups of cheese for every 8 crackers" / "6 oz of lemon juice for 9 cupcakes" / "4 tsp salt for 10 cups of broth". */
const MIX = new RegExp(String.raw`(?<![\w.$])(${NUM}) ((?:cups?|oz|tsp|spoons?|tablespoons?|drops?|lemons?)(?: of)?(?: [a-z]+){0,2}?) for (?:every )?(${NUM}) ([a-z]+(?: of [a-z]+)?)\b`, "g");
const TIME_U = String.raw`(minutes|minute|min|hours|hour|seconds|days|weeks|games|plays)`;
const TIMED = new RegExp(String.raw`(?<![\w.$])(${NUM}) ${NOUN} in (${NUM}) ${TIME_U}\b`, "g");

/** Every deal in the stem: { n, a (noun), p, b ("$" or a time noun), at, end }. */
function deals(s) {
  const out = [];
  for (const [re, mk] of MONEY) for (const m of s.matchAll(re)) out.push({ ...mk(m), at: m.index, end: m.index + m[0].length });
  for (const m of s.matchAll(TIMED)) out.push({ n: m[1], a: m[2], p: m[3], b: m[4], at: m.index, end: m.index + m[0].length });
  for (const m of s.matchAll(MIX)) out.push({ n: m[1], a: m[2], p: m[3], b: m[4], mix: true, at: m.index, end: m.index + m[0].length });
  out.sort((x, y) => x.at - y.at);
  // Two readings of one phrase ("3 cans for $2" also reads "$2 for ..."): keep the first.
  return out.filter((d, i) => !out.slice(0, i).some((e) => d.at < e.end && e.at < d.end));
}

/** Noun phrase cleanup: "pounds of" never ends a noun; a trailing article or verb is not part of it. */
function clean(noun) {
  const w = noun.replace(/ (?:of|and|or|at|each|is|are|for|in|to|with)$/, "");
  return /^(?:for|of|and|or|in|at)$/.test(w) ? null : w;
}

// ---------------------------------------------------------------- the 2 x 2 rate table drawer

/** One rate table: header label, rows [unit side, other side], columns [given amount, 1]. */
function table(x0, y0, d, lang, colW, labW, second = "1") {
  const rowH = 32;
  const out = [];
  const names = [d.uName, d.oName].map((n) => (lang === "es" ? n.es : n.en));
  out.push(rect(x0, y0, labW + 2 * colW, 2 * rowH, "fp-g", 0));
  out.push(`<path class="fp-ln" d="M${x0 + labW} ${y0}v${2 * rowH}M${x0 + labW + colW} ${y0}v${2 * rowH}M${x0} ${y0 + rowH}h${labW + 2 * colW}"/>`);
  names.forEach((n, i) => out.push(text(x0 + 8, y0 + i * rowH + 21, n, { anchor: "start", cls: "fp-t fp-s" })));
  const cell = (c, r, t) => {
    const cx = x0 + labW + c * colW + colW / 2;
    const cy = y0 + r * rowH + rowH / 2;
    return t === "?" ? S(3, qPill(cx, cy)) : S(2, rect(cx - colW / 2 + 3, cy - rowH / 2 + 3, colW - 6, rowH - 6, "fp-p", 3), text(cx, cy + 5, t, { cls: "fp-t fp-n" }));
  };
  out.push(cell(0, 0, d.uVal), cell(0, 1, d.oVal), S(2, text(x0 + labW + colW * 1.5, y0 + 21, second, { cls: "fp-t fp-n" })), cell(1, 1, "?"));
  return out.join("");
}

/** Arrange one deal for its table: which side is "per 1" and how the two rows are named and valued. */
function arrange(d, perUnit) {
  const money = d.b === "$";
  const aName = { en: d.a, es: esNoun(d.a) ?? "cantidad" };
  const bName = money ? { en: "cost", es: "costo" } : { en: d.b === "min" ? "minutes" : d.b, es: esNoun(d.b) ?? (d.mix ? "cantidad" : "tiempo") };
  const aVal = show(d.n);
  const bVal = money ? `$${show(d.p)}` : show(d.p);
  const say = money
    ? { en: `${aVal} ${aName.en} for ${bVal}`, es: `${aVal} ${aName.es} por ${bVal}` }
    : d.mix
      ? { en: `${aVal} ${aName.en} for ${bVal} ${bName.en}`, es: `${aVal} ${aName.es} por ${bVal} ${bName.es}` }
      : { en: `${aVal} ${aName.en} in ${bVal} ${bName.en}`, es: `${aVal} ${aName.es} en ${bVal} ${bName.es}` };
  const perA = perUnit === "a";
  return perA
    ? { uName: aName, oName: bName, uVal: aVal, oVal: bVal, u: d.n, say }
    : { uName: bName, oName: aName, uVal: bVal, oVal: aVal, u: d.p, say };
}

/** "per can" / "per minute" in the question picks the side that becomes 1; otherwise money is per item, time per unit. */
function perSide(q, d) {
  const per = q.match(/\bper ([a-z]+)|(?:for|of) (?:one|1) ([a-z]+)|(?:for|charges?) less for one ([a-z]+)/i);
  const w = per && (per[1] || per[2] || per[3]);
  if (w) {
    if (d.a.split(" ").some((t) => t.length > 2 && stemOf(w) === stemOf(t))) return "a";
    if (d.b !== "$" && stemOf(w) === stemOf(d.b === "min" ? "minutes" : d.b)) return "b";
    if (d.b === "$" && /dollar/i.test(w)) return "a";
    return null;
  }
  return d.b === "$" ? "a" : "b";
}

function labelOf(s, d, i) {
  const before = s.slice(Math.max(0, s.lastIndexOf(".", d.at - 2) + 1), d.at);
  const m = [...before.matchAll(LABEL)].at(-1) || (before.match(/^\s*([A-Z][\w']+(?: [A-Z][\w']+)?)(?::| (?:sells|has|charges|is|costs|offers))/) ?? null);
  if (m && m[2] && LABEL_ES[m[1]]) return { en: `${m[1]} ${m[2]}`, es: `${LABEL_ES[m[1]]} ${m[2]}` };
  if (m && !m[2] && !/^(?:A|An|The|One|Each|Which|Two)$/.test(m[1])) return { en: m[1], es: m[1] };
  return { en: `Deal ${i + 1}`, es: `Oferta ${i + 1}` };
}

// ---------------------------------------------------------------- two deals compared

const CMP_NO = /explain|student|says|scale|save|without|benchmark|write each|sort|match|both to|how much (?:less|more)|by how much|if you need|%|percent|\bper (?:hour|minute)\b.*\bper (?:hour|minute)\b.*\bper\b|round|nearest|each way/i;

const rateCompare = {
  kind: "rate-compare",
  match(s) {
    if (CMP_NO.test(s) || !/which|who|better|lower|less|cheaper|faster|more\b/i.test(s)) return null;
    const ds = deals(s);
    if (ds.length !== 2) return null;
    for (const d of ds) {
      d.a = clean(d.a);
      if (!d.a) return null;
    }
    const [d1, d2] = ds;
    if ((d1.b === "$") !== (d2.b === "$")) return null;
    if (stemOf(d1.a.split(" ")[0]) !== stemOf(d2.a.split(" ")[0]) && stemOf(d1.a.split(" ").at(-1)) !== stemOf(d2.a.split(" ").at(-1))) return null;
    if (d1.b !== "$" && stemOf(d1.b) !== stemOf(d2.b)) return null;
    // Nothing else numeric: the two deals are the whole problem.
    let rest = s;
    for (const d of [d2, d1]) rest = rest.slice(0, d.at) + " ".repeat(d.end - d.at) + rest.slice(d.end);
    if (count(rest, new RegExp(NUM, "g"))) return null;
    const q = rest.slice(d2.end);
    const side = perSide(q, d1);
    if (!side || perSide(q, d2) !== side) return null;
    const rows = ds.map((d, i) => ({ ...arrange(d, side), label: labelOf(s, d, i) }));
    if (rows.some((r) => num(r.u) === 1 || !(num(r.u) > 0))) return null;
    return { rows, money: d1.b === "$" };
  },
  draw({ rows, money }, lang) {
    const labW = Math.max(...rows.flatMap((r) => [r.uName, r.oName]).map((n) => textW(lang === "es" ? n.es : n.en, 13))) + 14;
    const colW = Math.min(96, (W - 2 * PAD - labW) / 2);
    const tw = labW + 2 * colW;
    const x0 = (W - tw) / 2;
    const out = [];
    rows.forEach((r, i) => {
      const y = 34 + i * 100;
      out.push(text(x0, y - 10, lang === "es" ? r.label.es : r.label.en, { anchor: "start", cls: "fp-t fp-n" }));
      out.push(table(x0, y, r, lang, colW, labW));
    });
    const u = rows[0].uName;
    const cap = {
      en: `${rows[0].label.en}: ${rows[0].say.en}; ${rows[1].label.en}: ${rows[1].say.en}. What goes with 1 ${u.en === "cost" ? "dollar" : `of the ${u.en}`} at each is unknown`,
      es: `${rows[0].label.es}: ${rows[0].say.es}; ${rows[1].label.es}: ${rows[1].say.es}. Lo que corresponde a 1 (${u.es}) en cada una es la incógnita`,
    };
    return {
      title: { en: "Two rate tables", es: "Dos tablas de razones" },
      caption: cap,
      desc: { en: `${cap.en}. Each table scales its deal down to 1 to compare.`, es: `${cap.es}. Cada tabla reduce su oferta a 1 para comparar.` },
      h: 34 + 100 + 64 + 14,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- one rate scaled to 1

const ONE_NO = /which|who|better|compare|explain|student|scale|both|\bor\b|%|percent|estimate|about|then|sort|match|round|nearest/i;
const PAIR = new RegExp(String.raw`(?<![\w.$])(${NUM})(?:-| )([a-z]+(?: of [a-z]+)?) (?:using|in|for|on|per) (${NUM}) ${NOUN}`, "g");
const ONE_ASK = /unit (?:rate|price)|\bper [a-z]+|(?:cost|price) of (?:1|one) [a-z]+/i;

const rateOne = {
  kind: "rate-table",
  match(s) {
    if (ONE_NO.test(s) || !ONE_ASK.test(s)) return null;
    let ds = deals(s);
    if (!ds.length) ds = [...s.matchAll(PAIR)].map((m) => ({ n: m[1], a: m[2], p: m[3], b: m[4].split(" ")[0], at: m.index, end: m.index + m[0].length }));
    if (ds.length !== 1) return null;
    const d = ds[0];
    d.a = clean(d.a);
    if (!d.a) return null;
    // "A 3-pound bag of rice costs $4.50": the noun is the unit before "bag".
    const rest = (s.slice(0, d.at) + s.slice(d.end)).replace(/\b(?:of|for) 1 (?=[a-z])/g, "of one ");
    if (count(rest, new RegExp(NUM, "g"))) return null;
    const q = s.slice(d.end).replace(/\b(?:of|for) 1 (?=[a-z])/g, "of one ");
    if (!ONE_ASK.test(q)) return null;
    const side = perSide(q, d);
    if (!side) return null;
    if (d.b !== "$" && !/\bper\b/i.test(q) && !esNoun(d.b)) return null;
    const row = { ...arrange(d, side), label: { en: "", es: "" } };
    if (num(row.u) === 1 || !(num(row.u) > 0)) return null;
    return { row, money: d.b === "$" };
  },
  draw({ row, money }, lang) {
    const labW = Math.max(textW(lang === "es" ? row.uName.es : row.uName.en, 13), textW(lang === "es" ? row.oName.es : row.oName.en, 13)) + 14;
    const colW = 96;
    const x0 = (W - labW - 2 * colW) / 2;
    const out = [text(W / 2, 26, tr(lang, "Same rate in both columns", "La misma tasa en las dos columnas"), { cls: "fp-t fp-s" }), table(x0, 40, row, lang, colW, labW)];
    const cap = {
      en: `${row.say.en}; the amount that goes with 1 (${row.uName.en}) is unknown`,
      es: `${row.say.es}; la cantidad que corresponde a 1 (${row.uName.es}) es la incógnita`,
    };
    return {
      title: { en: "Rate table", es: "Tabla de tasas" },
      caption: cap,
      desc: { en: `${cap.en}. Divide both rows by the same number to reach 1.`, es: `${cap.es}. Se dividen las dos filas entre el mismo número para llegar a 1.` },
      h: 40 + 64 + 18,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- two groups of a ratio, drawn as counters

const PARTS_NO = /which|sort|match|explain|student|equivalent|simplest|percent|%|total\)|scale|then|more|left|each/i;
const GROUP = String.raw`(\d+) ((?:cups? of )?[a-z]+(?: [a-z]+)?)`;

const ratioParts = {
  kind: "ratio-parts",
  match(s) {
    if (PARTS_NO.test(s)) return null;
    const m = s.match(new RegExp(String.raw`${GROUP} (?:and|with) ${GROUP}(?=[.,]| to make| in )`));
    const q = s.match(/ratio of ([a-z]+(?: [a-z]+)?) to (all|the whole|total|the total|[a-z]+(?: [a-z]+)?)\b/i);
    if (!m || !q || count(s, /\d+/g) !== 2) return null;
    const g = [
      { n: +m[1], w: m[2] },
      { n: +m[3], w: m[4] },
    ];
    if (g.some((x) => x.n < 1 || x.n > 12) || !g.every((x) => esNoun(x.w))) return null;
    const pick = (w) => g.findIndex((x) => x.w.split(" ").some((t) => w.split(" ").some((u) => stemOf(u) === stemOf(t) && t.length > 2)));
    const a = pick(q[1]);
    if (a < 0) return null;
    const whole = /^(?:all|the whole|total|the total)\b/i.test(q[2]) || /\b(?:all|total|whole)\b/i.test(s.slice(q.index + q[0].length, q.index + q[0].length + 30));
    const b = whole ? -1 : pick(q[2]);
    if (!whole && (b < 0 || b === a)) return null;
    return { g, a, b, whole };
  },
  draw({ g, a, b, whole }, lang) {
    const out = [];
    const nm = (x) => (lang === "es" ? esNoun(x.w) : x.w);
    const labW = Math.max(...g.map((x) => textW(nm(x), 13))) + 12;
    const x0 = PAD + labW;
    const step = Math.min(24, (W - PAD - x0 - 10) / Math.max(...g.map((x) => x.n)));
    g.forEach((x, i) => {
      const y = 52 + i * 44;
      out.push(S(2, text(PAD, y + 5, nm(x), { anchor: "start", cls: "fp-t fp-s" }), text(PAD, y + 22, String(x.n), { anchor: "start", cls: "fp-t fp-n fp-ta" })));
      const marks = [];
      for (let k = 0; k < x.n; k++) {
        const cx = x0 + 10 + k * step;
        marks.push(i === 0 ? dot(cx, y, 8) : rect(cx - 8, y - 8, 16, 16, "fp-p", 2));
      }
      out.push(S(2, marks));
    });
    const right = x0 + 10 + (Math.max(...g.map((x) => x.n)) - 1) * step + 12;
    out.push(rect(PAD - 6, 30, W - 2 * PAD + 12, 100, "fp-dash", 8));
    if (whole) out.push(S(3, bracket(x0, right, 142, 1), text(W / 2 - 6, 176, tr(lang, "all together:", "en total:"), { anchor: "end", cls: "fp-t fp-s" }), qPill(W / 2 + 22, 171)));
    else out.push(S(3, text(W / 2 - 6, 168, tr(lang, "ratio:", "razón:"), { anchor: "end", cls: "fp-t fp-s" }), qPill(W / 2 + 22, 163, "? : ?")));
    const A = g[a];
    const cap = whole
      ? { en: `${g[0].n} ${g[0].w} and ${g[1].n} ${g[1].w}; ${A.w} compared with all of them, whose count is unknown`, es: `${g[0].n} ${esNoun(g[0].w)} y ${g[1].n} ${esNoun(g[1].w)}; ${esNoun(A.w)} comparado con el total, que es la incógnita` }
      : { en: `${g[0].n} ${g[0].w} and ${g[1].n} ${g[1].w}; the ratio of ${A.w} to ${g[b].w} is unknown`, es: `${g[0].n} ${esNoun(g[0].w)} y ${g[1].n} ${esNoun(g[1].w)}; la razón de ${esNoun(A.w)} a ${esNoun(g[b].w)} es la incógnita` };
    return {
      title: { en: "Counters for a ratio", es: "Fichas para una razón" },
      caption: cap,
      desc: { en: `${cap.en}. Circles show the first group and squares the second.`, es: `${cap.es}. Los círculos muestran el primer grupo y los cuadrados el segundo.` },
      h: 190,
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- a given unit price scaled up

const GIVEN_NO = /which|who|better|compare|explain|student|estimate|about|round|both|sort|match|\bor\b|%|goal|budget|left/i;

const rateGiven = {
  kind: "rate-table",
  match(s) {
    if (GIVEN_NO.test(s) || !/how much|how many|total|what does|cost\?/i.test(s)) return null;
    let ms = [...s.matchAll(new RegExp(String.raw`\$(${NUM}) (?:per|a|an|each|for each) ([a-z]+)\b`, "g"))];
    let amount = null;
    if (!ms.length && !s.includes("$")) {
      // "5 points for each game" / "12.5 minutes per ride" / "2 pounds each month"
      ms = [...s.matchAll(new RegExp(String.raw`(?<![\w.])(${NUM}) ([a-z]+) (?:per|for each|each|every) ([a-z]+)\b`, "g"))].map((m) => [m[0], m[1], m[3], m[2]]);
      amount = ms[0]?.[3] ?? null;
    }
    if (ms.length !== 1) return null;
    const [, p, unit] = ms[0];
    // "$2 per square foot": a two-word unit this one-word reader would name "squares".
    if (/^(?:square|cubic)$/i.test(unit)) return null;
    const u = stemOf(unit);
    const ask = [...s.matchAll(new RegExp(String.raw`(?<![\w.$])(${NUM})(?:-| )([a-z]+)(?: ([a-z]+))?\b`, "g"))]
      .map((m) => (stemOf(m[2]) === u ? [m[0], m[1], m[2]] : m[3] && stemOf(m[3]) === u ? [m[0], m[1], m[3]] : null))
      .filter(Boolean);
    if (ask.length !== 1 || count(s, new RegExp(NUM, "g")) !== 2) return null;
    const n = ask[0][1];
    if (num(n) === 1 || !(num(n) > 0)) return null;
    const plural = /s$/.test(ask[0][2]) ? ask[0][2] : `${ask[0][2]}s`;
    const name = { en: plural, es: esNoun(plural) ?? "cantidad" };
    if (amount && (!esNoun(amount) || !esNoun(plural))) return null;
    const oName = amount ? { en: amount, es: esNoun(amount) } : { en: "cost", es: "costo" };
    return { p, n, name, oName, money: !amount };
  },
  draw({ p, n, name, oName, money }, lang) {
    const row = { uName: name, oName, uVal: "1", oVal: money ? `$${show(p)}` : show(p) };
    const labW = Math.max(textW(lang === "es" ? name.es : name.en, 13), textW(lang === "es" ? oName.es : oName.en, 13)) + 14;
    const colW = 96;
    const x0 = (W - labW - 2 * colW) / 2;
    const out = [text(W / 2, 26, tr(lang, "Same rate in both columns", "La misma tasa en las dos columnas"), { cls: "fp-t fp-s" }), table(x0, 40, row, lang, colW, labW, show(n))];
    const cap = {
      en: `1 of the ${name.en} goes with ${row.oVal}${money ? "" : ` ${oName.en}`}; the amount for ${show(n)} is unknown`,
      es: `1 (${name.es}) corresponde a ${row.oVal}${money ? "" : ` ${oName.es}`}; la cantidad para ${show(n)} es la incógnita`,
    };
    return {
      title: { en: "Rate table", es: "Tabla de tasas" },
      caption: cap,
      desc: { en: `${cap.en}. Multiply both rows by the same number.`, es: `${cap.es}. Se multiplican las dos filas por el mismo número.` },
      h: 40 + 64 + 18,
      body: out.join(""),
    };
  },
};

export const RATE = [rateCompare, rateOne, ratioParts, rateGiven];

// "Picture it" recognizers for equal groups and tables: a tape of equal groups (k groups of a size, or a total shared
// into k groups), a one-step equation stated inside a story (drawn with the equation bar model from
// picture-arith.mjs), and a table of x and y values with the asked value as "?". Same contract as picture-arith.mjs.

import { equation } from "./picture-arith.mjs";
import { NUM, PAD, S, W, bracket, count, fmt, num, qPill, rect, show, text, textW, tr } from "./picture-kit.mjs";
import { ES_NOUN } from "./picture-rate.mjs";

const WORD = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const WN = String.raw`(?:${NUM}|${Object.keys(WORD).join("|")})`;
const toNum = (t) => WORD[t.toLowerCase()] ?? num(t);
const stem4 = (w) => w.toLowerCase().replace(/ies$/, "y").replace(/(ch|sh|x|ss)es$/, "$1").replace(/s$/, "").slice(0, 4);
/** Number tokens, word numbers included ("Five pens", "TWO boxes"). */
const tokens = (s) => [...s.matchAll(new RegExp(String.raw`(?<![\w.,/$])\$?(${WN})(?![\w/]|[.,]\d)`, "gi"))];

// ---------------------------------------------------------------- equal groups (tape)

const GROUP_NO = /left|more|less|remain|then|after|change|save|difference|which|sort|match|explain|student|%|\/|÷|×|per\b|rate|faster|each way|round trip|pattern|rule|times as|double|half|average|mean|first|step|reasonable|could|tax|tip/i;
const HOLD = new RegExp(String.raw`\b(?:a|an|one|each|every)(?: [a-z]+)? ([a-z]+) (?:holds|has|takes|carries|gets|is worth|costs|weighs|fits|contains|uses) (?:about |exactly )?(\$?${NUM})(?: ([a-z]+))?`, "gi");

function product(s0) {
  // "One ride takes 12.5 minutes": the article in front of a holder is not a count; "at one time" is not either.
  const s = s0.replace(/\bat one time\b/gi, "at that time").replace(/\bin one\b/g, "in a").replace(/(^|\. )One (?=[a-z])/g, "$1A ");
  const toks = tokens(s.replace(/\b(?:one|each|every|a|an) (?=(?:[a-z]+ )?[a-z]+ (?:holds|has|takes|carries|gets|is worth|costs|weighs|fits|contains|uses)\b)/gi, (m) => " ".repeat(m.length))).filter((t, i, all) => all.findIndex((u) => u[1] === t[1]) === i);
  if (toks.length !== 2) return null;
  // "3 taco baskets at $4.25 each" / "Five pens cost $0.80 each" / "15 pizzas ... at $8.50 each"
  let m = s.match(new RegExp(String.raw`(?<![\w.$])(${WN}) ([a-z]+(?: [a-z]+)?)(?: [A-Za-z]+){0,3} (?:at|cost|costs|for) \$(${NUM}) each\b`, "i"));
  if (m) return { k: toNum(m[1]), kNoun: m[2], size: `$${m[3]}`, money: true };
  // "7 rows with about 6 cookies in each row" / "20 cars, and about 4 people fit in each car"
  m = s.match(new RegExp(String.raw`(?<![\w.$])(${WN}) ([a-z]+)(?:,| with| and|,? and|\.)* (?:about )?(${NUM}) ([a-z]+)(?: [a-z]+)? (?:in|on|fit in) each \2?`, "i"));
  if (m && stem4(m[2]) === stem4(s.slice(m.index + m[0].length - 12).match(/each ([a-z]+)/i)?.[1] ?? m[2])) return { k: toNum(m[1]), kNoun: m[2], size: m[3], sizeNoun: m[4] };
  // "A shelf holds 9 cans. A pantry has 4 shelves" / "One ride takes 12.5 minutes. How many minutes do 10 rides take?"
  const holds = [...s.matchAll(HOLD)];
  // "12 peas in one scoop. The bowl holds about 9 scoops" / "gains 2 pounds each month. After 3 months"
  m = s.match(new RegExp(String.raw`(?<![\w.$])(${NUM}) ([a-z]+)(?: of [a-z]+)? (?:in (?:one|each|a)|each|every|a) ([a-z]+)\b`, "i"));
  if (m && !/^(?:one|each|every|a)$/i.test(m[3])) {
    const other = toks.find((t) => t[1] !== m[1]);
    const after = other && s.slice(other.index).match(/^\S+ (?:about )?([a-z]+)/i)?.[1];
    const q1 = s.match(/how many ([a-z]+)/i)?.[1];
    if (after && stem4(after) === stem4(m[3]) && (!q1 || stem4(q1) === stem4(m[2]))) return { k: toNum(other[1]), kNoun: after, size: m[1], sizeNoun: m[2] };
  }
  const q = s.match(/how (?:many|much) ([a-z]+)?/i) || s.match(/what (?:are|is) (?:the )?(?:total|value|\d+ [a-z]+ worth)/i);
  if (!q) return null;
  for (const h of holds) {
    const c = h[1];
    const cnt = toks.find((t) => t.index !== h.index + h[0].indexOf(h[2]) && new RegExp(String.raw`^\$?${t[1].replace(/[.$]/g, "\\$&")} ([a-z]+)`, "i").test(s.slice(t.index)));
    if (!cnt) continue;
    const words = s.slice(cnt.index).match(/^\S+ ([a-z]+)(?: ([a-z]+))?/i) ?? [];
    const after = [words[1], words[2]].find((w) => w && stem4(w) === stem4(c));
    if (!after) continue;
    const money = h[2].startsWith("$");
    if (!money && h[3] && /^how many/i.test(q[0]) && q[1] && stem4(q[1]) !== stem4(h[3])) continue;
    if (!money && !h[3]) continue;
    return { k: toNum(cnt[1]), kNoun: after, size: h[2], sizeNoun: money ? null : h[3], money };
  }
  return null;
}

function share(s) {
  const m = s.match(new RegExp(String.raw`(?<![\w.$])(${WN}) ([a-z]+) cost \$(${NUM})(?: altogether| in all| total)?\.`, "i"));
  if (!m || !/what does (?:one|1|each) [a-z]+ cost|how much (?:is|does) (?:one|1|each)/i.test(s)) return null;
  const rest = s.replace(m[0], " ").replace(/\b(?:one|1)\b/gi, " ");
  if (tokens(rest).length) return null;
  return { k: toNum(m[1]), kNoun: m[2], total: `$${m[3]}`, money: true };
}

const equalGroups = {
  kind: "equal-groups",
  match(s) {
    if (GROUP_NO.test(s) || !/how many|how much|total|in all|altogether|worth|what does|cost\?/i.test(s)) return null;
    const r = share(s) || product(s);
    if (!r || !Number.isInteger(r.k) || r.k < 2 || r.k > 60) return null;
    if (r.size && !(num(r.size.replace("$", "")) > 0)) return null;
    return r;
  },
  draw(r, lang) {
    const k = r.k;
    const x0 = PAD + 4;
    const bw = W - 2 * PAD - 8;
    const all = k <= 12;
    const shown = all ? k : 4;
    const gap = all ? 0 : 34;
    const pw = (bw - gap) / shown;
    const y = 70;
    const bh = 42;
    const out = [];
    const lab = r.size ? show(r.size) : "?";
    const fits = textW(lab, 15) + 6 <= pw;
    for (let i = 0; i < shown; i++) {
      const x = x0 + i * pw + (!all && i === shown - 1 ? gap : 0);
      if (r.total) out.push(rect(x, y, pw, bh, "fp-g", 2), S(3, rect(x, y, pw, bh, "fp-u", 2)));
      else out.push(rect(x, y, pw, bh, "fp-g", 2), S(2, rect(x, y, pw, bh, "fp-p", 2), fits || i === 0 ? text(x + pw / 2, y + bh / 2 + 6, fits ? lab : "", { cls: "fp-t fp-n" }) : ""));
    }
    if (!all) out.push(text(x0 + 3 * pw + gap / 2, y + bh / 2 + 6, "…", { cls: "fp-t fp-n" }));
    out.push(S(2, text(W / 2, y + bh + 26, tr(lang, `${k} equal groups`, `${k} grupos iguales`), { cls: "fp-t fp-s" })));
    if (!fits && !r.total) out.push(S(2, text(W / 2, y + bh + 48, tr(lang, `each group: ${lab}`, `cada grupo: ${lab}`), { cls: "fp-t fp-n" })));
    if (r.total) {
      out.push(S(2, bracket(x0, x0 + bw, y - 8, -1), text(W / 2, y - 20, show(r.total), { cls: "fp-t fp-n" })));
      out.push(S(3, text(W / 2 - 6, y + bh + 56, tr(lang, "each group:", "cada grupo:"), { anchor: "end", cls: "fp-t fp-s" }), qPill(W / 2 + 22, y + bh + 51)));
    } else out.push(S(3, bracket(x0, x0 + bw, y - 8, -1), qPill(W / 2, y - 26, tr(lang, "total = ?", "total = ?"))));
    /* A noun read from the stem can catch a neighbour ("400 cubic inches", "pizzas from Pizza Town"): keep only real nouns. */
    const noun = (w) =>
      String(w ?? "")
        .split(/\s+/)
        .filter((x) => x && !/^(?:cubic|square|from|of|at|for|in|on|with|each|about)$/i.test(x))
        .join(" ");
    const sizeEn = `${lab}${noun(r.sizeNoun) ? ` ${noun(r.sizeNoun)}` : ""}`;
    const cap = r.total
      ? { en: `${show(r.total)} shared equally by ${k} ${r.kNoun}; the amount for each is unknown`, es: `${show(r.total)} repartidos en partes iguales entre ${k}; la cantidad de cada uno es la incógnita` }
      : { en: `${k} ${noun(r.kNoun) || "groups"} with ${sizeEn} each; the total is unknown`, es: `${k} grupos iguales de ${lab} cada uno; el total es la incógnita` };
    return {
      title: { en: "Equal groups", es: "Grupos iguales" },
      caption: cap,
      desc: { en: `${cap.en}. ${all ? "" : "Only some of the groups are drawn. "}Every group is the same size.`, es: `${cap.es}. ${all ? "" : "Solo se dibujan algunos de los grupos. "}Todos los grupos son del mismo tamaño.` },
      h: y + bh + (r.total ? 76 : fits ? 42 : 64),
      body: out.join(""),
    };
  },
};

// ---------------------------------------------------------------- a one-step equation stated inside a story

const P = String.raw`\d+(?:\.\d+)?`;
const STORY_EQ_NO = /which|first step|what do you do|both sides|went wrong|reasonable|write a|write an|explain|sort|match|is the answer|are both|decide|graph|inequality|test\b|table|\bor\b/i;
const EQ = [
  new RegExp(String.raw`(?<![\w.^]|[+\-×÷*/=] ?)\b([a-z]) [+\-] ${P} = ${P}(?![\w]|\.\d| ?[+\-×÷*/])`, "g"),
  new RegExp(String.raw`(?<![\w.^]|[+\-×÷*/=] ?)\b${P} \+ ([a-z]) = ${P}(?![\w]|\.\d| ?[+\-×÷*/])`, "g"),
  new RegExp(String.raw`(?<![\w.^]|[+\-×÷*/=] ?)\b\d+([a-z]) = ${P}(?![\w]|\.\d| ?[+\-×÷*/])`, "g"),
  new RegExp(String.raw`(?<![\w.^]|[+\-×÷*/=] ?)\b([a-z]) (?:÷|/) \d+ = ${P}(?![\w]|\.\d| ?[+\-×÷*/])`, "g"),
];

const storyEquation = {
  kind: "equation",
  match(s0) {
    const s = s0.replace(/^(?:room|level|lock|path|stop|mission) \d+\s*[:—-]\s*/i, "");
    if (STORY_EQ_NO.test(s)) return null;
    let eq = null;
    let v = null;
    const hits = EQ.flatMap((re) => [...s.matchAll(re)]);
    if (hits.length === 1) {
      eq = hits[0][0];
      v = hits[0][1];
    } else if (!hits.length) {
      // "In y = 7x, what is x when y = 28?" / "Using c = 4n, find n when c = 20."
      const m = s.match(new RegExp(String.raw`\b([a-z]) = (\d+)([a-z])\b(?! ?[+\-×÷*/]).*?\bwhen \1 = (${P})\b`));
      if (!m || m[1] === m[3]) return null;
      eq = `${m[2]}${m[3]} = ${m[4]}`;
      v = m[3];
      if (!new RegExp(String.raw`\b(?:what is|find|solve for) ${v}\b`).test(s)) return null;
    } else return null;
    if (count(s, /=/g) !== (hits.length ? 1 : 2)) return null;
    // Every other number in the story repeats one of the equation's own numbers.
    const own = (eq.match(/\d+(?:\.\d+)?/g) || []).map(Number);
    const rest = s.replace(eq, " ").replace(/\b[a-z] = \d+(?:\.\d+)?\b/g, " ");
    const others = (rest.match(/(?<![\w.])\d+(?:,\d{3})*(?:\.\d+)?(?![\w]|\.\d)/g) || []).map((t) => num(t));
    if (others.some((n) => !own.includes(n))) return null;
    if (!new RegExp(String.raw`\bsolve\b|\bwhat is ${v}\b|\bfind ${v}\b|\bhow (?:many|much)\b|\bwhat value\b|\bwhat (?:was|is|were) [a-z]+`, "i").test(s)) return null;
    return equation.match(`Solve: ${eq}`);
  },
  draw: equation.draw,
};

// ---------------------------------------------------------------- table of x and y values

const XY_NO = /which ordered pair|sort|match|student|complete|explain|graph(?! (?:of|passes|has))|plotted|look like|ratio of y|on the line|off/i;

function readPairs(s) {
  let m = s.match(new RegExp(String.raw`\bx(?: =|:) ((?:${P}, )+(?:and )?${P}),? and y(?: =|:) ((?:${P}, )+(?:and )?${P})`));
  if (!m) m = s.match(new RegExp(String.raw`\binputs ((?:${P}, )+(?:and )?${P}) and outputs ((?:${P}, )+(?:and )?${P})`));
  if (m) {
    const xs = m[1].split(/, (?:and )?/).map(Number);
    const ys = m[2].split(/, (?:and )?/).map(Number);
    return xs.length === ys.length ? { xs, ys, at: m[0], io: m[0].startsWith("inputs") } : null;
  }
  const arrows = [...s.matchAll(new RegExp(String.raw`(?<![\w.])(${P}) ?(?:→|->) ?(${P})(?![\w]|\.\d)`, "g"))];
  if (arrows.length >= 2) return { xs: arrows.map((a) => +a[1]), ys: arrows.map((a) => +a[2]), at: arrows.map((a) => a[0]), io: true };
  // "1 ticket costs $2.50, 2 tickets cost $5.00" / "1 visit, $5; 2 visits, $10" / "1 hour, 48 km; 5 hours, 240 km"
  const said = [...s.matchAll(new RegExp(String.raw`(?<![\w.])(${P}) ([a-z]+)(?:,| costs?) (\$?)(${P})(?: ([a-z]+))?(?=[,;.)]| and)`, "g"))];
  if (said.length >= 2 && said.every((m) => m[2].replace(/s$/, "") === said[0][2].replace(/s$/, "") && m[3] === said[0][3] && (m[5] ?? "") === (said[0][5] ?? ""))) {
    const noun = said.find((m) => m[1] !== "1")?.[2] ?? `${said[0][2]}s`;
    return { xs: said.map((m) => +m[1]), ys: said.map((m) => +m[4]), at: said.map((m) => m[0]), noun, money: said[0][3] === "$", yNoun: said[0][5] ?? null };
  }
  const pts = [...s.matchAll(new RegExp(String.raw`\((${P}), (${P})\)`, "g"))];
  if (pts.length >= 3) return { xs: pts.map((a) => +a[1]), ys: pts.map((a) => +a[2]), at: pts.map((a) => a[0]) };
  return null;
}

const xyTable = {
  kind: "xy-table",
  match(s) {
    if (XY_NO.test(s)) return null;
    const t = readPairs(s);
    if (!t || t.xs.length < 2 || t.xs.length > 5) return null;
    if (t.xs.some((x, i) => i && x <= t.xs[i - 1])) return null;
    let rest = s;
    for (const a of [t.at].flat()) rest = rest.replace(a, " ");
    let ask = null;
    if (t.noun) {
      const nq = rest.match(new RegExp(String.raw`(?:do|for|in|of) (${P}) ${t.noun.replace(/s$/, "")}s?\b`, "i"));
      if (!nq || !/how much|how many|what (?:is|are|would)/i.test(rest) || t.xs.includes(+nq[1])) return null;
      if (/(?<![\w'])\d/.test(rest.replace(nq[0], " "))) return null;
      return { ...t, ask: +nq[1] };
    }
    const q = rest.match(new RegExp(String.raw`(?:when x = |when the input is |for input |output for |x-value (?:of|is) |y-value when x = |output when the input is )(${P})\b`, "i"));
    if (q) {
      ask = +q[1];
      if (t.xs.includes(ask) || ask > 1000) return null;
    } else if (!/rule|rate of change|equation fits|connects|how much does y change|how many [a-z]+ (?:are traveled )?each/i.test(rest)) return null;
    // No other numbers: the table and the asked input are the whole problem.
    const left = q ? rest.replace(q[0], " ") : rest;
    if (/(?<![\w'])\d/.test(left.replace(/'multiply by \d+'|'add \d+'|\bgoes up by 1\b/gi, " "))) return null;
    // A stated rule ("multiply by 4") would make the asked output a giveaway of the method only; it is still the givens.
    return { ...t, ask };
  },
  draw({ xs, ys, io, ask, noun, money, yNoun }, lang) {
    const cols = xs.length + (ask !== null ? 1 : 0);
    const es = lang === "es";
    const names = noun
      ? [es ? (ES_NOUN[noun] ?? "cantidad") : noun, money ? tr(lang, "cost", "costo") : es ? (ES_NOUN[yNoun] ?? yNoun) : yNoun]
      : io
        ? [tr(lang, "input", "entrada"), tr(lang, "output", "salida")]
        : ["x", "y"];
    const Y = (v) => (money ? `$${Number.isInteger(v) ? v : v.toFixed(2)}` : fmt(v));
    const labW = noun || io ? Math.max(...names.map((n) => textW(n, 13))) + 14 : 40;
    const cw = Math.min(64, (W - 2 * PAD - labW) / cols);
    const tw = labW + cols * cw;
    const x0 = (W - tw) / 2;
    const y0 = 40;
    const rh = 38;
    const out = [rect(x0, y0, tw, 2 * rh, "fp-g", 0), `<path class="fp-ln" d="M${x0} ${y0 + rh}h${tw}${Array.from({ length: cols }, (_, i) => `M${x0 + labW + i * cw} ${y0}v${2 * rh}`).join("")}"/>`];
    names.forEach((n, i) => out.push(text(x0 + labW / 2, y0 + i * rh + 24, n, { cls: "fp-t fp-s" })));
    const g = [];
    xs.forEach((x, i) => {
      const cx = x0 + labW + i * cw + cw / 2;
      g.push(text(cx, y0 + 25, fmt(x), { cls: "fp-t fp-n" }), text(cx, y0 + rh + 25, Y(ys[i]), { cls: "fp-t fp-n" }));
    });
    out.push(S(2, g));
    if (ask !== null) {
      const cx = x0 + labW + xs.length * cw + cw / 2;
      out.push(S(3, rect(cx - cw / 2 + 3, y0 + 3, cw - 6, rh - 6, "fp-p", 3), text(cx, y0 + 25, fmt(ask), { cls: "fp-t fp-n" }), qPill(cx, y0 + rh + rh / 2)));
    } else out.push(S(3, text(W / 2 - 4, y0 + 2 * rh + 40, tr(lang, "rule:", "regla:"), { anchor: "end", cls: "fp-t fp-s" }), qPill(W / 2 + 26, y0 + 2 * rh + 35, "? ")));
    const pairs = xs.map((x, i) => `(${fmt(x)}, ${Y(ys[i])})`).join(", ");
    const cap = ask !== null
      ? { en: `Pairs ${pairs}; the value that goes with ${fmt(ask)} is unknown`, es: `Pares ${pairs}; el valor que corresponde a ${fmt(ask)} es la incógnita` }
      : { en: `Pairs ${pairs}; the rule that connects them is unknown`, es: `Pares ${pairs}; la regla que los relaciona es la incógnita` };
    return {
      title: { en: "Table of values", es: "Tabla de valores" },
      caption: cap,
      desc: { en: `${cap.en}. Each column is one pair.`, es: `${cap.es}. Cada columna es un par.` },
      h: y0 + 2 * rh + (ask !== null ? 18 : 58),
      body: out.join(""),
    };
  },
};

export const GROUP = [equalGroups, storyEquation, xyTable];

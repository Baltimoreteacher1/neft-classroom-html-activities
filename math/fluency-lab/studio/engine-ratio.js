// Ratio engine: ratio tables and double number lines for equivalent ratios, proportions, unit rates, unit
// conversions, scale drawings and percent. Each new row comes from multiplying or dividing BOTH numbers of a
// known row by one factor, so the tests can cross-multiply every row against the starting row.
import { COLORS, L, clean, esc, fmt, frame, keyed, num, svgWrap, txt } from "./core.js";
import {
  divide as exactDivide,
  equivalent as exactEquivalent,
  multiply as exactMultiply,
  rational,
  valueOf as exactValue,
} from "../ratio-studio/engine.js";
import { UNITS } from "../question-es.js";

// "feet" / "pies": a unit word as a column title in both languages (the lab's one Spanish unit table).
const unitName = (en) => L(en, UNITS[en]?.[0] ?? en);

const CONV = {
  "feet:inches": 12,
  "yards:feet": 3,
  "meters:centimeters": 100,
  "kilometers:meters": 1000,
  "kilograms:grams": 1000,
  "liters:milliliters": 1000,
  "hours:minutes": 60,
  "minutes:seconds": 60,
  "pounds:ounces": 16,
  "gallons:quarts": 4,
  "quarts:pints": 2,
  "pints:cups": 2,
};
const near = (a, b) => Math.abs(a - b) < 1e-9;
const nice = (v) => near(v, Math.round(v * 100) / 100);
const exact = (value) => rational(String(value));
const exactEqual = (a, b) => {
  try {
    return exactEquivalent(exact(a), rational(1), exact(b), rational(1));
  } catch {
    return false;
  }
};
const scalePair = ([left, right], step) => {
  const transform = step.k === "mul" ? exactMultiply : exactDivide;
  const factor = exact(step.n);
  return [exactValue(transform(exact(left), factor)), exactValue(transform(exact(right), factor))];
};
const preservesRatio = ([left, right], [nextLeft, nextRight]) =>
  exactEquivalent(exact(left), exact(right), exact(nextLeft), exact(nextRight));

export function parse(question) {
  const q = clean(question);
  let m = q.match(/^(\d+):(\d+) = (\d+|□):(\d+|□)$/);
  if (m) {
    const base = [Number(m[1]), Number(m[2])];
    return build(
      m[3] === "□" ? { side: "r", v: Number(m[4]) } : { side: "l", v: Number(m[3]) },
      base,
      ["", ""],
      "ratio",
    );
  }
  m = q.match(/^(\d+)\/(\d+) = x\/(\d+)\. Find x\.$/);
  if (m)
    return build(
      { side: "r", v: Number(m[3]) },
      [Number(m[1]), Number(m[2])],
      [L("top", "arriba"), L("bottom", "abajo")],
      "proportion",
    );
  m = q.match(/^(\d+) for (\d+) items\. How much for 1 item\?$/);
  if (m)
    return build(
      { side: "l", v: 1 },
      [Number(m[2]), Number(m[1])],
      [L("items", "artículos"), L("cost", "costo")],
      "rate",
    );
  m = q.match(/^(\d+) (\w+) = how many (\w+)\?$/);
  if (m && CONV[`${m[2]}:${m[3]}`])
    return build(
      { side: "l", v: Number(m[1]) },
      [1, CONV[`${m[2]}:${m[3]}`]],
      [unitName(m[2]), unitName(m[3])],
      "convert",
    );
  m = q.match(/^What is (\d+)% of (\d+)\?$/);
  if (m)
    return build(
      { side: "l", v: Number(m[1]) },
      [100, Number(m[2])],
      [L("percent", "porcentaje"), L("amount", "cantidad")],
      "percent",
    );
  m = q.match(/^A scale drawing uses 1 cm to represent (\d+) m\. A wall is (\d+) cm long/);
  if (m) return build({ side: "l", v: Number(m[2]) }, [1, Number(m[1])], ["cm", "m"], "scale");
  return null;
}

function path(base, t, kind) {
  const [p, q] = base;
  const col = t.side === "l" ? p : q;
  const steps = [];
  if (kind === "percent") {
    const n = t.v;
    if (100 % n === 0) steps.push({ k: "div", n: 100 / n });
    else if (n % 10 === 0) steps.push({ k: "div", n: 10 }, { k: "mul", n: n / 10 });
    else steps.push({ k: "div", n: 100 }, { k: "mul", n: n });
    return steps;
  }
  const factor = exactDivide(exact(t.v), exact(col));
  if (factor.n === factor.d) return [];
  if (factor.d === "1") steps.push({ k: "mul", n: Number(factor.n) });
  else if (factor.n === "1") steps.push({ k: "div", n: Number(factor.d) });
  else if (col > 1) steps.push({ k: "div", n: col }, { k: "mul", n: t.v });
  else return null;
  return steps;
}

function build(t, base, cols, kind) {
  if (base.some((v) => !(v > 0)) || !(t.v > 0)) return null;
  const steps = path(base, t, kind);
  if (!steps) return null;
  const rows = [base];
  for (const s of steps) {
    rows.push(scalePair(rows.at(-1), s));
  }
  if (
    !rows.every((row) => row.every(nice)) ||
    rows.some((row) => row.some((v) => v > 1e6)) ||
    !rows.every((row) => preservesRatio(base, row))
  )
    return null;
  const last = rows.at(-1);
  const result = t.side === "l" ? last[1] : last[0];
  return {
    engine: "ratio",
    kind,
    base,
    target: t,
    cols,
    steps,
    rows,
    result,
    reps: ["table", "line"],
  };
}
// A column title: an L pair (txt draws both languages) or a symbol such as "cm"; an empty one reads as A / B.
const colName = (c, fallback) => (c && (typeof c === "object" ? c.en : c) ? c : fallback);

const row = (i, y, [l, r], { ghostR = false, ghostL = false, hi = false } = {}) => {
  const cell = (x, v, ghost, extra) =>
    `<rect x="${x}" width="110" height="38" rx="8" fill="${ghost ? "#fff" : extra}" fill-opacity="${ghost ? 1 : 0.92}" stroke="${ghost ? COLORS.warn : "#fff"}" stroke-width="${ghost ? 3 : 2}" stroke-dasharray="${ghost ? "7 5" : "0"}"/><text x="${x + 55}" y="26" text-anchor="middle" font-size="21" font-weight="800" fill="${ghost ? COLORS.warn : "#fff"}">${esc(ghost && v === "?" ? "?" : fmt(Number(v)))}</text>`;
  return keyed(
    `row${i}`,
    0,
    y,
    `${cell(150, l, ghostL, COLORS.whole)}${cell(300, r, ghostR, COLORS.hundreds)}`,
    hi ? "sd-ring" : "",
  );
};

function table(spec, upto, { pending = null, hi = false } = {}) {
  let out =
    txt(205, 30, colName(spec.cols[0], "A"), { size: 15, fill: COLORS.whole }) +
    txt(355, 30, colName(spec.cols[1], "B"), { size: 15, fill: COLORS.hundreds });
  for (let i = 0; i <= upto; i += 1)
    out += row(i, 44 + i * 62, spec.rows[i], { hi: hi && i === upto });
  if (pending) {
    const y = 44 + (upto + 1) * 62;
    out += row(
      upto + 1,
      y,
      [
        spec.target.side === "l" ? spec.rows[upto + 1][0] : "?",
        spec.target.side === "l" ? "?" : spec.rows[upto + 1][1],
      ].map((v) => v),
      { ghostL: true, ghostR: true },
    );
    const label = pending.k === "mul" ? `× ${fmt(pending.n)}` : `÷ ${fmt(pending.n)}`;
    for (const x of [112, 428])
      out +=
        `<path d="M${x},${y - 28} v${24}" stroke="${COLORS.warn}" stroke-width="3" marker-end="url(#a)"/>` +
        txt(x + (x < 200 ? -28 : 30), y - 12, label, { size: 17, fill: COLORS.warn });
    out += `<defs><marker id="a" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="${COLORS.warn}"/></marker></defs>`;
  }
  return svgWrap(out, "", { h: 70 + (spec.rows.length + 0) * 62 });
}

function dline(spec, upto) {
  const shown = spec.rows.slice(0, upto + 1);
  const maxL = Math.max(...shown.map((r) => r[0]));
  const maxR = Math.max(...shown.map((r) => r[1]));
  const x = (v, max) => 50 + (v / max) * 440;
  let out = `<line x1="40" x2="520" y1="70" y2="70" stroke="${COLORS.ink}" stroke-width="3"/><line x1="40" x2="520" y1="170" y2="170" stroke="${COLORS.ink}" stroke-width="3"/>`;
  out +=
    txt(40, 40, colName(spec.cols[0], "A"), { size: 14, anchor: "start", fill: COLORS.whole }) +
    txt(40, 200, colName(spec.cols[1], "B"), {
      size: 14,
      anchor: "start",
      fill: COLORS.hundreds,
    });
  out += `<line x1="${x(0, maxL)}" x2="${x(0, maxR)}" y1="64" y2="176" stroke="${COLORS.rule}" stroke-width="2"/>`;
  shown.forEach(([l, r], i) => {
    out += `<line x1="${x(l, maxL)}" x2="${x(r, maxR)}" y1="64" y2="176" stroke="${COLORS.rule}" stroke-width="2"/>`;
    out +=
      keyed(
        `tl${i}`,
        x(l, maxL),
        70,
        `<circle r="6" fill="${COLORS.whole}"/>${txt(0, -14, fmt(l), { size: 16, fill: COLORS.whole })}`,
      ) +
      keyed(
        `tr${i}`,
        x(r, maxR),
        170,
        `<circle r="6" fill="${COLORS.hundreds}"/>${txt(0, 28, fmt(r), { size: 16, fill: COLORS.hundreds })}`,
      );
  });
  return svgWrap(out, "", { h: 220 });
}

const altRows = (spec, upto) =>
  L(
    `Ratio table with rows: ${spec.rows
      .slice(0, upto + 1)
      .map(([l, r]) => `${fmt(l)} and ${fmt(r)}`)
      .join("; ")}.`,
    `Tabla de razones con filas: ${spec.rows
      .slice(0, upto + 1)
      .map(([l, r]) => `${fmt(l)} y ${fmt(r)}`)
      .join("; ")}.`,
  );
const mk = (spec, rep, id, upto, cap, easy, opts = {}) => {
  const alt = altRows(spec, upto);
  const svg = (rep === "line" ? dline(spec, upto) : table(spec, upto, opts)).replace(
    'aria-label=""',
    `aria-label="${esc(alt.en)}"`,
  );
  const rowsShown = spec.rows.slice(0, upto + 1);
  return Object.assign(
    frame({ id, cap, easy, eq: `${fmt(spec.base[0])} : ${fmt(spec.base[1])}`, svg, alt }),
    { meta: { rows: rowsShown } },
  );
};

export function frames(spec, rep = "table") {
  const out = [
    mk(
      spec,
      rep,
      "base",
      0,
      L(
        `Start with the known pair: ${fmt(spec.base[0])} and ${fmt(spec.base[1])}. Every new row keeps this same relationship.`,
        `Empieza con el par conocido: ${fmt(spec.base[0])} y ${fmt(spec.base[1])}. Cada fila nueva mantiene esta misma relación.`,
      ),
      L("The known pair.", "El par conocido."),
    ),
  ];
  spec.steps.forEach((s, i) => {
    const label = s.k === "mul" ? `× ${fmt(s.n)}` : `÷ ${fmt(s.n)}`;
    out.push(
      mk(
        spec,
        rep,
        `op${i}`,
        i,
        L(
          `${s.k === "mul" ? "Multiply" : "Divide"} BOTH numbers by ${fmt(s.n)}. Doing the same to both keeps the ratio equal.`,
          `${s.k === "mul" ? "Multiplica" : "Divide"} AMBOS números por ${fmt(s.n)}. Hacer lo mismo a ambos mantiene la razón igual.`,
        ),
        L(`${label} on both.`, `${label} en ambos.`),
        { pending: s },
      ),
    );
    out.push(
      mk(
        spec,
        rep,
        `row${i + 1}`,
        i + 1,
        L(
          `New row: ${fmt(spec.rows[i + 1][0])} and ${fmt(spec.rows[i + 1][1])}.`,
          `Fila nueva: ${fmt(spec.rows[i + 1][0])} y ${fmt(spec.rows[i + 1][1])}.`,
        ),
        L(
          `${fmt(spec.rows[i + 1][0])} and ${fmt(spec.rows[i + 1][1])}.`,
          `${fmt(spec.rows[i + 1][0])} y ${fmt(spec.rows[i + 1][1])}.`,
        ),
        { hi: true },
      ),
    );
  });
  if (!spec.steps.length)
    out.push(
      mk(
        spec,
        rep,
        "same",
        0,
        L("The numbers are already the ones we need.", "Los números ya son los que necesitamos."),
        L("Already there.", "Ya está."),
      ),
    );
  return out;
}

export const answer = (spec) => spec.result;

export function predicts(spec) {
  if (!spec.steps.length) return [];
  const s = spec.steps[0];
  const label = s.k === "mul" ? `× ${fmt(s.n)}` : `÷ ${fmt(s.n)}`;
  const first = spec.target.side === "l";
  const known = first ? spec.base[0] : spec.base[1];
  // The first step only: a two-step scale (× then ÷) names where THIS step lands, not the final target.
  const after = s.k === "mul" ? known * s.n : known / s.n;
  return [
    {
      at: 1,
      q: L(
        `The ${first ? "first" : "second"} number goes from ${fmt(known)} to ${fmt(after)}: that is ${label}. What should we do to the other number?`,
        `El ${first ? "primer" : "segundo"} número pasa de ${fmt(known)} a ${fmt(after)}: eso es ${label}. ¿Qué debemos hacerle al otro número?`,
      ),
      choices: [
        {
          t: L(`Use ${label} on it too.`, `Usar ${label} también en él.`),
          ok: true,
          why: L(
            "Both numbers stay in the same relationship only if they are scaled by the same factor.",
            "Ambos números mantienen la relación solo si se escalan por el mismo factor.",
          ),
        },
        {
          t: L(
            `Add the same amount that the ${first ? "first" : "second"} number gained.`,
            `Sumar la misma cantidad que ganó el ${first ? "primer" : "segundo"} número.`,
          ),
          ok: false,
          why: L(
            "Adding the same amount changes the relationship. Ratios grow by multiplying.",
            "Sumar la misma cantidad cambia la relación. Las razones crecen al multiplicar.",
          ),
        },
        {
          t: L("Leave it alone.", "Dejarlo igual."),
          ok: false,
          why: L(
            "Then one number changes and the other does not, so the relationship breaks.",
            "Entonces un número cambia y el otro no, así que la relación se rompe.",
          ),
        },
      ],
      explain: [
        {
          t: L(
            "Because equal ratios come from multiplying or dividing both numbers by the same factor.",
            "Porque las razones iguales salen de multiplicar o dividir ambos números por el mismo factor.",
          ),
          ok: true,
        },
        {
          t: L(
            "Because the second number is always bigger.",
            "Porque el segundo número siempre es mayor.",
          ),
          ok: false,
        },
      ],
    },
  ];
}

export function hints(spec) {
  const list = frames(spec);
  const s = spec.steps[0];
  return [
    {
      text: L(
        "What do you do to the known number to reach the number you need? You must do the same to the other number.",
        "¿Qué le haces al número conocido para llegar al que necesitas? Debes hacer lo mismo con el otro número.",
      ),
    },
    {
      text: L(
        "The table shows one row and the arrows that carry it to the next row.",
        "La tabla muestra una fila y las flechas que la llevan a la siguiente.",
      ),
      frame: list[Math.min(1, list.length - 1)],
    },
    {
      text: s
        ? L(
            `First move: ${s.k === "mul" ? "multiply" : "divide"} both numbers by ${fmt(s.n)}. Then read the new row.`,
            `Primer paso: ${s.k === "mul" ? "multiplica" : "divide"} ambos números por ${fmt(s.n)}. Luego lee la fila nueva.`,
          )
        : L("Read the row you need.", "Lee la fila que necesitas."),
      frame: list[Math.min(1, list.length - 1)],
    },
  ];
}

export function diagnose(spec, raw) {
  const v = num(raw);
  if (v === null || exactEqual(v, spec.result)) return null;
  const [p, q] = spec.base;
  const add = spec.target.side === "l" ? q + (spec.target.v - p) : p + (spec.target.v - q);
  if (exactEqual(v, add)) return "additive";
  if (spec.kind === "rate" && exactEqual(v, exactValue(exactDivide(exact(p), exact(q))))) return "flipped";
  return null;
}
export const tags = {
  additive: {
    label: L("Added instead of multiplying", "Sumó en lugar de multiplicar"),
    tip: L(
      "Equal ratios grow by multiplying both numbers by the same factor, not by adding the same amount.",
      "Las razones iguales crecen multiplicando ambos números por el mismo factor, no sumando la misma cantidad.",
    ),
  },
  flipped: {
    label: L("Divided the wrong way around", "Dividió al revés"),
    tip: L(
      "A unit rate is how much for 1. Divide so that the number of items becomes 1.",
      "Una tasa unitaria es cuánto por 1. Divide para que la cantidad de artículos sea 1.",
    ),
  },
};

// ----- Build -----
export const build_ = {
  prompt: (spec) =>
    L(
      `Make new rows by doing the same thing to both numbers until you reach ${fmt(spec.target.v)}.`,
      `Crea filas nuevas haciendo lo mismo a ambos números hasta llegar a ${fmt(spec.target.v)}.`,
    ),
  init: (spec) => ({ rows: [spec.base] }),
  render(state, spec) {
    const spec2 = { ...spec, rows: state.rows, steps: [], target: spec.target };
    const alt = altRows({ ...spec, rows: state.rows }, state.rows.length - 1);
    const last = state.rows.at(-1);
    const done = reached(state, spec);
    const factors = [
      ...new Set([2, 3, 4, 5, 10, ...spec.steps.map((s) => s.n)].filter((n) => n > 1)),
    ].sort((a, b) => a - b);
    const controls = [];
    for (const n of factors)
      controls.push(
        { id: "mul", arg: n, label: L(`× ${n} both`, `× ${n} ambos`) },
        { id: "div", arg: n, label: L(`÷ ${n} both`, `÷ ${n} ambos`) },
      );
    controls.push({
      id: "one",
      arg: 2,
      label: L("× 2 on the first number only", "× 2 solo en el primer número"),
    });
    return {
      svg: table(spec2, state.rows.length - 1, { hi: done }).replace(
        'aria-label=""',
        `aria-label="${esc(alt.en)}"`,
      ),
      alt,
      controls: done ? [] : controls,
      status: done
        ? L(
            `You reached it: ${fmt(last[0])} and ${fmt(last[1])}.`,
            `Lo lograste: ${fmt(last[0])} y ${fmt(last[1])}.`,
          )
        : L(
            `Latest row: ${fmt(last[0])} and ${fmt(last[1])}.`,
            `Última fila: ${fmt(last[0])} y ${fmt(last[1])}.`,
          ),
    };
  },
  act(state, action, n, spec) {
    if (action === "one")
      return {
        state,
        ok: false,
        msg: L(
          "If only one number changes, the relationship between them changes. Multiply or divide both.",
          "Si solo cambia un número, cambia la relación entre ellos. Multiplica o divide ambos.",
        ),
        tag: "oneColumn",
      };
    const [l, r] = state.rows.at(-1);
    const next = scalePair([l, r], { k: action, n });
    if (!next.every(nice) || next.some((v) => v > 1e6) || !preservesRatio(spec.base, next))
      return {
        state,
        ok: false,
        msg: L(
          "That makes numbers that are hard to use. Try a different factor.",
          "Eso da números difíciles de usar. Prueba otro factor.",
        ),
        tag: "messy",
      };
    if (state.rows.length > 7)
      return {
        state,
        ok: false,
        msg: L(
          "That is enough rows. Look at the ones you have.",
          "Ya son suficientes filas. Mira las que tienes.",
        ),
      };
    return { state: { rows: [...state.rows, next] }, ok: true };
  },
  done: (state, spec) => reached(state, spec),
};
const reached = (state, spec) =>
  state.rows.some(([l, r]) => exactEqual(spec.target.side === "l" ? l : r, spec.target.v));
export { build_ as build };

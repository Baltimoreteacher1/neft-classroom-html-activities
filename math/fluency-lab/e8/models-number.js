// Number sense and operations models: ten-frame, number bond, number line, base-ten blocks (with regrouping),
// hundreds chart, counting collection, fact family, array / equal groups, partial-product area model, long division.
import { Rational, R } from "./rational.js";
import {
  ModelError,
  bi,
  circle,
  clamp,
  esc,
  intIn,
  line,
  rect,
  registerModel,
  svg,
  text,
} from "./engine-core.js";

const INK = "#17324d";
const TEAL = "#1fa6a2";
const AMBER = "#f2c15b";
const CORAL = "#d8613c";

// ---------------------------------------------------------------- ten-frame
registerModel({
  id: "tenFrame",
  title: bi("Ten-frame", "Cuadro de diez"),
  grades: [1, 2],
  domain: "number",
  init: (p) => ({ filled: clamp(p.start ?? 0, 0, (p.frames || 1) * 10) }),
  reduce(s, a, p) {
    const cap = (p.frames || 1) * 10;
    if (a.type === "toggle") {
      const i = intIn(a.index, 0, cap - 1, bi("That spot", "Ese lugar"));
      return { filled: i < s.filled ? i : i + 1 };
    }
    if (a.type === "add") {
      if (s.filled >= cap)
        throw new ModelError(
          bi(`The frame is full at ${cap}.`, `El cuadro está lleno con ${cap}.`),
        );
      return { filled: s.filled + 1 };
    }
    if (a.type === "remove") {
      if (s.filled <= 0)
        throw new ModelError(
          bi("There are no counters to take away.", "No hay fichas para quitar."),
        );
      return { filled: s.filled - 1 };
    }
    if (a.type === "set") return { filled: intIn(a.value, 0, cap) };
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const cap = (p.frames || 1) * 10;
    const rows = [];
    return {
      facts: { filled: s.filled, empty: cap - s.filled, cap },
      equation: `${s.filled} + ${cap - s.filled} = ${cap}`,
      verbal: bi(
        `${s.filled} counters and ${cap - s.filled} empty spaces make ${cap}.`,
        `${s.filled} fichas y ${cap - s.filled} espacios vacíos forman ${cap}.`,
      ),
      numeric: {
        headers: ["counters", "empty", "total"],
        rows: rows.concat([[s.filled, cap - s.filled, cap]]),
      },
    };
  },
  render(s, p) {
    const frames = p.frames || 1;
    const cell = 40;
    let inner = "";
    let n = 0;
    for (let f = 0; f < frames; f += 1)
      for (let r = 0; r < 2; r += 1)
        for (let c = 0; c < 5; c += 1) {
          const x = 10 + c * cell;
          const y = 10 + (f * 2 + r) * cell + f * 14;
          const on = n < s.filled;
          inner += rect(
            x,
            y,
            cell - 4,
            cell - 4,
            `class="cell ${on ? "on" : "off"}" data-i="${n}" rx="6" fill="#fff" stroke="${INK}" stroke-width="2"`,
          );
          if (on)
            inner += circle(
              x + (cell - 4) / 2,
              y + (cell - 4) / 2,
              13,
              `fill="${CORAL}" stroke="${INK}" stroke-width="1.5"`,
            );
          n += 1;
        }
    return svg(
      220,
      20 + frames * 2 * cell + (frames - 1) * 14,
      inner,
      `Ten-frame with ${s.filled} counters`,
    );
  },
  pointer: (s, p, hit) => (hit.dataset.i !== undefined ? { type: "toggle", index: Number(hit.dataset.i) } : null),
  keys: () => ({ "+": { type: "add" }, "=": { type: "add" }, "-": { type: "remove" } }),
  controls: (s, p) => [
    {
      id: "add",
      label: bi("Add a counter", "Poner una ficha"),
      action: { type: "add" },
      disabled: s.filled >= (p.frames || 1) * 10,
    },
    {
      id: "remove",
      label: bi("Take one away", "Quitar una ficha"),
      action: { type: "remove" },
      disabled: s.filled <= 0,
    },
  ],
  describe: (s, p) =>
    bi(
      `A ten-frame with ${s.filled} of ${(p.frames || 1) * 10} spaces filled.`,
      `Un cuadro de diez con ${s.filled} de ${(p.frames || 1) * 10} espacios llenos.`,
    ),
  verify(s, p) {
    const problems = [];
    const drawn = (this.render(s, p).match(/class="cell on"/g) || []).length;
    if (drawn !== s.filled) problems.push(`picture shows ${drawn}, state has ${s.filled}`);
    return problems;
  },
  generate: (rng, g) => ({ frames: g >= 2 ? 2 : 1, start: rng.int(0, 6) }),
});

// ---------------------------------------------------------------- number bond
registerModel({
  id: "numberBond",
  title: bi("Number bond", "Enlace numérico"),
  grades: [1, 2],
  domain: "number",
  init: (p) => ({ a: clamp(p.start ?? 0, 0, p.whole) }),
  reduce(s, a, p) {
    if (a.type === "set") return { a: intIn(a.value, 0, p.whole, bi("The part", "La parte")) };
    if (a.type === "inc") return { a: clamp(s.a + 1, 0, p.whole) };
    if (a.type === "dec") return { a: clamp(s.a - 1, 0, p.whole) };
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const b = p.whole - s.a;
    return {
      facts: { whole: p.whole, a: s.a, b },
      equation: `${s.a} + ${b} = ${p.whole}`,
      verbal: bi(
        `${s.a} and ${b} make ${p.whole}. Also ${b} + ${s.a} = ${p.whole}, ${p.whole} − ${s.a} = ${b} and ${p.whole} − ${b} = ${s.a}.`,
        `${s.a} y ${b} forman ${p.whole}. También ${b} + ${s.a} = ${p.whole}, ${p.whole} − ${s.a} = ${b} y ${p.whole} − ${b} = ${s.a}.`,
      ),
      numeric: { headers: ["part", "part", "whole"], rows: [[s.a, b, p.whole]] },
    };
  },
  render(s, p) {
    const b = p.whole - s.a;
    const inner = `${line(110, 52, 55, 118, `stroke="${INK}" stroke-width="3"`)}${line(110, 52, 165, 118, `stroke="${INK}" stroke-width="3"`)}${circle(110, 36, 30, `fill="${AMBER}" stroke="${INK}" stroke-width="3" class="whole"`)}${text(110, 45, p.whole, `text-anchor="middle" font-size="26" font-weight="800" fill="${INK}"`)}${circle(55, 132, 28, `fill="#fff" stroke="${INK}" stroke-width="3" class="part"`)}${text(55, 141, s.a, `text-anchor="middle" font-size="24" font-weight="800" fill="${INK}"`)}${circle(165, 132, 28, `fill="#fff" stroke="${INK}" stroke-width="3" class="part"`)}${text(165, 141, b, `text-anchor="middle" font-size="24" font-weight="800" fill="${INK}"`)}`;
    return svg(220, 170, inner, `Number bond: ${s.a} and ${b} make ${p.whole}`);
  },
  controls: (s, p) => [
    {
      id: "dec",
      label: bi("Left part − 1", "Parte izquierda − 1"),
      action: { type: "dec" },
      disabled: s.a <= 0,
    },
    {
      id: "inc",
      label: bi("Left part + 1", "Parte izquierda + 1"),
      action: { type: "inc" },
      disabled: s.a >= p.whole,
    },
  ],
  describe: (s, p) =>
    bi(
      `A number bond: the whole ${p.whole} splits into ${s.a} and ${p.whole - s.a}.`,
      `Un enlace numérico: el total ${p.whole} se parte en ${s.a} y ${p.whole - s.a}.`,
    ),
  verify(s, p) {
    const nums = [...this.render(s, p).matchAll(/font-weight="800"[^>]*>(\d+)</g)].map((m) =>
      Number(m[1]),
    );
    return nums.length === 3 && nums[0] === p.whole && nums[1] + nums[2] === p.whole
      ? []
      : [`bond numbers ${nums.join(",")}`];
  },
  generate: (rng, g) => ({ whole: g === 1 ? rng.int(5, 10) : rng.int(10, 20), start: 0 }),
});

// ---------------------------------------------------------------- number line (integers, decimals, fractions)
const nlStep = (p) => Rational.of(p.step ?? 1);
registerModel({
  id: "numberLine",
  title: bi("Number line", "Recta numérica"),
  grades: [1, 2, 3, 4, 5, 6, 7],
  variants: [],
  domain: "number",
  init: (p) => ({ start: Rational.of(p.start ?? 0).toString(), hops: [] }),
  reduce(s, a, p) {
    const lo = Rational.of(p.min);
    const hi = Rational.of(p.max);
    const pos = Rational.of(s.start).add(s.hops.reduce((acc, h) => acc.add(h), R(0)));
    if (a.type === "hop") {
      const d = Rational.of(a.by);
      if (d.isZero())
        throw new ModelError(bi("A hop must move the point.", "Un salto debe mover el punto."));
      const next = pos.add(d);
      if (next.lt(lo) || next.gt(hi))
        throw new ModelError(
          bi(`The line only runs from ${lo} to ${hi}.`, `La recta solo va de ${lo} a ${hi}.`),
        );
      return { ...s, hops: [...s.hops, d.toString()] };
    }
    if (a.type === "back") {
      if (!s.hops.length)
        throw new ModelError(bi("There are no hops to take back.", "No hay saltos que deshacer."));
      return { ...s, hops: s.hops.slice(0, -1) };
    }
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const start = Rational.of(s.start);
    const hops = s.hops.map(Rational.of);
    const end = hops.reduce((acc, h) => acc.add(h), start);
    const terms = hops.map((h) => (h.sign() < 0 ? `− ${h.abs()}` : `+ ${h}`));
    const equation = hops.length ? `${start} ${terms.join(" ")} = ${end}` : `${start}`;
    return {
      facts: { start, end, hops },
      equation,
      verbal: bi(
        hops.length
          ? `Start at ${start}. After ${hops.length} hop${hops.length > 1 ? "s" : ""} you are at ${end}.`
          : `You are at ${start}.`,
        hops.length
          ? `Empieza en ${start}. Después de ${hops.length} salto${hops.length > 1 ? "s" : ""} estás en ${end}.`
          : `Estás en ${start}.`,
      ),
      numeric: {
        headers: ["hop", "from", "to"],
        rows: hops.map((h, i) => {
          const from = hops.slice(0, i).reduce((acc, x) => acc.add(x), start);
          return [h.toString(), from.toString(), from.add(h).toString()];
        }),
      },
    };
  },
  render(s, p) {
    const lo = Rational.of(p.min);
    const hi = Rational.of(p.max);
    const step = nlStep(p);
    const span = hi.sub(lo).toNumber();
    const X = (v) => 30 + (Rational.of(v).sub(lo).toNumber() / span) * 460;
    let inner = line(30, 90, 490, 90, `stroke="${INK}" stroke-width="3"`);
    for (let v = lo; v.lte(hi); v = v.add(step)) {
      inner +=
        line(X(v), 82, X(v), 98, `stroke="${INK}" stroke-width="2"`) +
        text(X(v), 118, v.toString(), `text-anchor="middle" font-size="13" fill="${INK}"`);
    }
    let pos = Rational.of(s.start);
    s.hops.map(Rational.of).forEach((h) => {
      const x1 = X(pos);
      pos = pos.add(h);
      const x2 = X(pos);
      const mid = (x1 + x2) / 2;
      inner += `<path class="hop" d="M${x1.toFixed(1)} 88 Q${mid.toFixed(1)} 30 ${x2.toFixed(1)} 88" fill="none" stroke="${TEAL}" stroke-width="3"/>${text(mid, 36, h.sign() > 0 ? `+${h}` : `${h}`, `text-anchor="middle" font-size="13" font-weight="800" fill="${INK}"`)}`;
    });
    inner += circle(
      X(pos),
      90,
      9,
      `class="point" fill="${CORAL}" stroke="${INK}" stroke-width="2"`,
    );
    return svg(520, 140, inner, `Number line from ${lo} to ${hi}, point at ${pos}`);
  },
  pointer(s, p, hit) {
    const lo = Rational.of(p.min);
    const span = Rational.of(p.max).sub(lo).toNumber();
    const step = Rational.of(p.step ?? 1);
    const raw = lo.toNumber() + ((hit.x - 30) / 460) * span;
    const target = lo.add(step.mul(Math.round((raw - lo.toNumber()) / step.toNumber())));
    const pos = Rational.of(s.start).add(s.hops.reduce((acc, h) => acc.add(h), R(0)));
    const by = target.sub(pos);
    return by.isZero() ? null : { type: "hop", by: by.toString() };
  },
  keys: (s, p) => ({ ArrowRight: { type: "hop", by: Rational.of(p.step ?? 1).toString() }, ArrowLeft: { type: "hop", by: Rational.of(p.step ?? 1).neg().toString() }, Backspace: { type: "back" } }),
  controls: (s, p) => {
    const step = nlStep(p);
    return [
      {
        id: "right",
        label: bi(`Hop +${step}`, `Saltar +${step}`),
        action: { type: "hop", by: step.toString() },
      },
      {
        id: "left",
        label: bi(`Hop −${step}`, `Saltar −${step}`),
        action: { type: "hop", by: step.neg().toString() },
      },
      {
        id: "back",
        label: bi("Take back a hop", "Deshacer un salto"),
        action: { type: "back" },
        disabled: !s.hops.length,
      },
    ];
  },
  describe(s, p) {
    const end = s.hops.reduce((acc, h) => acc.add(h), Rational.of(s.start));
    return bi(
      `A number line from ${p.min} to ${p.max}. The point is at ${end}.`,
      `Una recta numérica de ${p.min} a ${p.max}. El punto está en ${end}.`,
    );
  },
  verify(s, p) {
    const end = s.hops.reduce((acc, h) => acc.add(h), Rational.of(s.start));
    const lo = Rational.of(p.min);
    const hi = Rational.of(p.max);
    const svgPos = (() => {
      const m = /class="point"/.exec(this.render(s, p));
      return m ? true : false;
    })();
    const problems = [];
    if (end.lt(lo) || end.gt(hi)) problems.push("point is off the line");
    if (!svgPos) problems.push("no point drawn");
    const arcs = (this.render(s, p).match(/class="hop"/g) || []).length;
    if (arcs !== s.hops.length) problems.push(`drew ${arcs} hops for ${s.hops.length}`);
    return problems;
  },
  generate: (rng, g) => {
    if (g >= 6) return { min: -10, max: 10, step: 1, start: rng.int(-4, 4) };
    if (g >= 4) return { min: 0, max: 1, step: "1/4", start: 0 };
    return { min: 0, max: g >= 3 ? 100 : 20, step: g >= 3 ? 10 : 1, start: 0 };
  },
});

// ---------------------------------------------------------------- base-ten blocks with regrouping
const valueOf = (s) => s.h * 100 + s.t * 10 + s.o;
registerModel({
  id: "baseTen",
  title: bi("Base-ten blocks", "Bloques de base diez"),
  grades: [1, 2, 3, 4],
  variants: ["chart"],
  domain: "number",
  init: (p) => {
    if (p.raw) return { h: p.raw.h, t: p.raw.t, o: p.raw.o, taken: 0 };
    const v = p.value ?? 0;
    return { h: Math.floor(v / 100), t: Math.floor((v % 100) / 10), o: v % 10, taken: 0 };
  },
  reduce(s, a, p) {
    const sub = p.task === "sub";
    const next = { ...s };
    switch (a.type) {
      case "add": {
        if (sub)
          throw new ModelError(
            bi("In a subtraction, take blocks away instead.", "En una resta, quita bloques."),
          );
        const unit = { h: "h", t: "t", o: "o" }[a.unit];
        if (!unit) throw new ModelError("Unknown block");
        if (valueOf(s) + { h: 100, t: 10, o: 1 }[unit] > 999)
          throw new ModelError(bi("That is more than 999.", "Eso es más de 999."));
        next[unit] += 1;
        return next;
      }
      case "remove": {
        const unit = { h: "h", t: "t", o: "o" }[a.unit];
        if (!unit || s[unit] <= 0)
          throw new ModelError(
            bi(
              "There is no block of that size to take.",
              "No hay un bloque de ese tamaño para quitar.",
            ),
          );
        next[unit] -= 1;
        if (sub) next.taken += { h: 100, t: 10, o: 1 }[unit];
        return next;
      }
      case "tradeTen":
        if (s.o < 10)
          throw new ModelError(
            bi(
              `You need 10 ones to trade for a ten. You have ${s.o}.`,
              `Necesitas 10 unidades para cambiar por una decena. Tienes ${s.o}.`,
            ),
          );
        return { ...s, o: s.o - 10, t: s.t + 1 };
      case "tradeHundred":
        if (s.t < 10)
          throw new ModelError(
            bi(
              `You need 10 tens to trade for a hundred. You have ${s.t}.`,
              `Necesitas 10 decenas para cambiar por una centena. Tienes ${s.t}.`,
            ),
          );
        return { ...s, t: s.t - 10, h: s.h + 1 };
      case "breakTen":
        if (s.t < 1)
          throw new ModelError(
            bi("There is no ten to break apart.", "No hay una decena para separar."),
          );
        return { ...s, t: s.t - 1, o: s.o + 10 };
      case "breakHundred":
        if (s.h < 1)
          throw new ModelError(
            bi("There is no hundred to break apart.", "No hay una centena para separar."),
          );
        return { ...s, h: s.h - 1, t: s.t + 10 };
      default:
        throw new ModelError("Unknown move");
    }
  },
  derive(s, p) {
    const v = valueOf(s);
    const parts = [s.h && `${s.h * 100}`, s.t && `${s.t * 10}`, s.o && `${s.o}`].filter(Boolean);
    if (p.task === "sub") {
      const min = p.value;
      return {
        facts: { minuend: min, taken: s.taken, remaining: v },
        equation: `${min} − ${s.taken} = ${v}`,
        verbal: bi(
          `You started with ${min} and took away ${s.taken}. ${v} is left.`,
          `Empezaste con ${min} y quitaste ${s.taken}. Quedan ${v}.`,
        ),
        numeric: { headers: ["hundreds", "tens", "ones"], rows: [[s.h, s.t, s.o]] },
      };
    }
    return {
      facts: { value: v, h: s.h, t: s.t, o: s.o },
      equation: parts.length ? `${parts.join(" + ")} = ${v}` : "0",
      verbal: bi(
        `${s.h} hundreds, ${s.t} tens and ${s.o} ones make ${v}.`,
        `${s.h} centenas, ${s.t} decenas y ${s.o} unidades forman ${v}.`,
      ),
      numeric: { headers: ["hundreds", "tens", "ones"], rows: [[s.h, s.t, s.o]] },
    };
  },
  render(s, p, variant) {
    if (variant === "chart") {
      const cols = [
        ["Hundreds", s.h, "#8dc7c3"],
        ["Tens", s.t, AMBER],
        ["Ones", s.o, "#e9835f"],
      ];
      const inner = cols
        .map(
          ([name, n, fill], i) =>
            `${rect(10 + i * 100, 10, 92, 130, `fill="#fff" stroke="${INK}" stroke-width="2" rx="6"`)}${text(56 + i * 100, 32, name, `text-anchor="middle" font-size="14" font-weight="700" fill="${INK}"`)}${text(56 + i * 100, 100, n, `class="digit" text-anchor="middle" font-size="46" font-weight="800" fill="${INK}"`)}${rect(20 + i * 100, 118, 72, 8, `fill="${fill}"`)}`,
        )
        .join("");
      return svg(320, 150, inner, `Place-value chart: ${s.h} hundreds, ${s.t} tens, ${s.o} ones`);
    }
    let inner = "";
    for (let i = 0; i < s.h; i += 1)
      inner += rect(
        10 + (i % 3) * 66,
        10 + Math.floor(i / 3) * 66,
        60,
        60,
        `class="blk h" fill="#8dc7c3" stroke="${INK}" stroke-width="2" rx="3"`,
      );
    for (let i = 0; i < s.t; i += 1)
      inner += rect(
        220 + (i % 10) * 16,
        10 + Math.floor(i / 10) * 84,
        12,
        78,
        `class="blk t" fill="${AMBER}" stroke="${INK}" stroke-width="1.5" rx="2"`,
      );
    for (let i = 0; i < s.o; i += 1)
      inner += rect(
        220 + (i % 10) * 16,
        120 + Math.floor(i / 10) * 18,
        12,
        12,
        `class="blk o" fill="#e9835f" stroke="${INK}" stroke-width="1.5" rx="2"`,
      );
    return svg(400, 170, inner, `${s.h} hundreds, ${s.t} tens and ${s.o} ones`);
  },
  controls: (s, p) => {
    if (p.task === "sub")
      return [
        {
          id: "rm-h",
          label: bi("Take a hundred", "Quitar una centena"),
          action: { type: "remove", unit: "h" },
          disabled: s.h < 1,
        },
        {
          id: "rm-t",
          label: bi("Take a ten", "Quitar una decena"),
          action: { type: "remove", unit: "t" },
          disabled: s.t < 1,
        },
        {
          id: "rm-o",
          label: bi("Take a one", "Quitar una unidad"),
          action: { type: "remove", unit: "o" },
          disabled: s.o < 1,
        },
        {
          id: "bk-t",
          label: bi("Break a ten into 10 ones", "Separar una decena en 10 unidades"),
          action: { type: "breakTen" },
          disabled: s.t < 1,
        },
        {
          id: "bk-h",
          label: bi("Break a hundred into 10 tens", "Separar una centena en 10 decenas"),
          action: { type: "breakHundred" },
          disabled: s.h < 1,
        },
      ];
    return [
      {
        id: "add-h",
        label: bi("Add a hundred", "Agregar una centena"),
        action: { type: "add", unit: "h" },
      },
      {
        id: "add-t",
        label: bi("Add a ten", "Agregar una decena"),
        action: { type: "add", unit: "t" },
      },
      {
        id: "add-o",
        label: bi("Add a one", "Agregar una unidad"),
        action: { type: "add", unit: "o" },
      },
      {
        id: "tr-t",
        label: bi("Trade 10 ones for a ten", "Cambiar 10 unidades por una decena"),
        action: { type: "tradeTen" },
        disabled: s.o < 10,
      },
      {
        id: "tr-h",
        label: bi("Trade 10 tens for a hundred", "Cambiar 10 decenas por una centena"),
        action: { type: "tradeHundred" },
        disabled: s.t < 10,
      },
      {
        id: "bk-t",
        label: bi("Break a ten into 10 ones", "Separar una decena en 10 unidades"),
        action: { type: "breakTen" },
        disabled: s.t < 1,
      },
      {
        id: "rm-o",
        label: bi("Take a one away", "Quitar una unidad"),
        action: { type: "remove", unit: "o" },
        disabled: s.o < 1,
      },
    ];
  },
  describe: (s) =>
    bi(
      `${s.h} hundreds, ${s.t} tens and ${s.o} ones, worth ${valueOf(s)}.`,
      `${s.h} centenas, ${s.t} decenas y ${s.o} unidades, que valen ${valueOf(s)}.`,
    ),
  verify(s, p) {
    const problems = [];
    const html = this.render(s, p);
    const count = (k) => (html.match(new RegExp(`class="blk ${k}"`, "g")) || []).length;
    if (count("h") !== s.h || count("t") !== s.t || count("o") !== s.o)
      problems.push("blocks drawn do not match counts");
    if (p.task === "sub" && valueOf(s) + s.taken !== p.value)
      problems.push("value was not conserved");
    if (p.task !== "sub" && s.h * 100 + s.t * 10 + s.o !== valueOf(s))
      problems.push("value mismatch");
    return problems;
  },
  generate: (rng, g) =>
    g <= 1
      ? { value: rng.int(11, 59) }
      : g === 2
        ? { value: rng.int(100, 400) + rng.int(0, 99) }
        : { task: "sub", value: rng.int(41, 91) },
});

// ---------------------------------------------------------------- hundreds chart / skip counting
registerModel({
  id: "hundredsChart",
  title: bi("Hundreds chart", "Tabla del cien"),
  grades: [1, 2, 3],
  domain: "number",
  init: () => ({ marked: [] }),
  reduce(s, a, p) {
    const max = p.max || 100;
    if (a.type === "toggle") {
      const n = intIn(a.n, 1, max, bi("That number", "Ese número"));
      return {
        marked: s.marked.includes(n)
          ? s.marked.filter((x) => x !== n)
          : [...s.marked, n].sort((x, y) => x - y),
      };
    }
    if (a.type === "skip") {
      const k = intIn(a.by, 1, max, bi("The step", "El paso"));
      return { marked: Array.from({ length: Math.floor(max / k) }, (_, i) => (i + 1) * k) };
    }
    if (a.type === "clear") return { marked: [] };
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const m = s.marked;
    const diffs = m.slice(1).map((x, i) => x - m[i]);
    const regular = m.length >= 3 && diffs.every((d) => d === diffs[0]) && m[0] === diffs[0];
    return {
      facts: { count: m.length, skip: regular ? diffs[0] : null },
      equation: regular
        ? `${m.slice(0, 5).join(", ")}${m.length > 5 ? ", …" : ""} (count by ${diffs[0]})`
        : m.length
          ? m.join(", ")
          : "",
      verbal: bi(
        regular
          ? `These are the numbers you reach when you count by ${diffs[0]}.`
          : `${m.length} number${m.length === 1 ? "" : "s"} marked.`,
        regular
          ? `Estos son los números que alcanzas al contar de ${diffs[0]} en ${diffs[0]}.`
          : `${m.length} número${m.length === 1 ? "" : "s"} marcado${m.length === 1 ? "" : "s"}.`,
      ),
      numeric: { headers: ["marked"], rows: m.map((x) => [x]) },
    };
  },
  render(s, p) {
    const max = p.max || 100;
    const cols = 10;
    let inner = "";
    for (let n = 1; n <= max; n += 1) {
      const x = 6 + ((n - 1) % cols) * 36;
      const y = 6 + Math.floor((n - 1) / cols) * 30;
      const on = s.marked.includes(n);
      inner +=
        rect(
          x,
          y,
          34,
          28,
          `class="cell ${on ? "on" : "off"}" data-n="${n}" fill="${on ? AMBER : "#fff"}" stroke="${INK}" stroke-width="1.5" rx="3"`,
        ) +
        text(
          x + 17,
          y + 19,
          n,
          `text-anchor="middle" font-size="13" font-weight="${on ? 800 : 500}" fill="${INK}"`,
        );
    }
    return svg(
      372,
      12 + Math.ceil(max / cols) * 30,
      inner,
      `Hundreds chart with ${s.marked.length} numbers marked`,
    );
  },
  pointer: (s, p, hit) => (hit.dataset.n !== undefined ? { type: "toggle", n: Number(hit.dataset.n) } : null),
  controls: () => [
    { id: "skip2", label: bi("Count by 2s", "Contar de 2 en 2"), action: { type: "skip", by: 2 } },
    { id: "skip5", label: bi("Count by 5s", "Contar de 5 en 5"), action: { type: "skip", by: 5 } },
    {
      id: "skip10",
      label: bi("Count by 10s", "Contar de 10 en 10"),
      action: { type: "skip", by: 10 },
    },
    { id: "clear", label: bi("Clear", "Borrar"), action: { type: "clear" } },
  ],
  describe: (s) =>
    bi(
      `A hundreds chart with ${s.marked.length} numbers marked.`,
      `Una tabla del cien con ${s.marked.length} números marcados.`,
    ),
  verify(s, p) {
    const drawn = (this.render(s, p).match(/class="cell on"/g) || []).length;
    return drawn === s.marked.length
      ? []
      : [`picture shows ${drawn}, state has ${s.marked.length}`];
  },
  generate: (rng) => ({ max: 100, target: rng.pick([2, 5, 10]) }),
});

// ---------------------------------------------------------------- counting collection
registerModel({
  id: "countingCollection",
  title: bi("Counting collection", "Colección para contar"),
  grades: [1, 2],
  domain: "number",
  init: (p) => ({ n: p.start ?? 0 }),
  reduce(s, a, p) {
    if (a.type === "add") return { n: Math.min(p.cap || 60, s.n + (a.count || 1)) };
    if (a.type === "remove") {
      if (s.n <= 0)
        throw new ModelError(bi("The collection is empty.", "La colección está vacía."));
      return { n: s.n - 1 };
    }
    if (a.type === "set") return { n: intIn(a.value, 0, p.cap || 60) };
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const g = p.group || 10;
    const groups = Math.floor(s.n / g);
    const left = s.n % g;
    return {
      facts: { n: s.n, groups, left, group: g },
      equation: `${groups} × ${g} + ${left} = ${s.n}`,
      verbal: bi(
        `${groups} group${groups === 1 ? "" : "s"} of ${g} and ${left} left over make ${s.n}.`,
        `${groups} grupo${groups === 1 ? "" : "s"} de ${g} y ${left} sobrante${left === 1 ? "" : "s"} forman ${s.n}.`,
      ),
      numeric: { headers: ["groups", "size", "left", "total"], rows: [[groups, g, left, s.n]] },
    };
  },
  render(s, p) {
    const g = p.group || 10;
    const groups = Math.floor(s.n / g);
    let inner = "";
    let i = 0;
    for (let k = 0; k < groups; k += 1) {
      const x = 8 + (k % 3) * 120;
      const y = 8 + Math.floor(k / 3) * 60;
      inner += rect(x, y, 112, 52, `fill="#f4fbfa" stroke="${TEAL}" stroke-width="2.5" rx="8"`);
      for (let j = 0; j < g; j += 1)
        inner += circle(
          x + 12 + (j % 5) * 22,
          y + 15 + Math.floor(j / 5) * 22,
          8,
          `class="obj" fill="${CORAL}" stroke="${INK}" stroke-width="1"`,
        );
      i += g;
    }
    const baseY = 16 + Math.ceil(groups / 3) * 60;
    for (let j = 0; i + j < s.n; j += 1)
      inner += circle(
        18 + (j % 10) * 22,
        baseY + Math.floor(j / 10) * 22,
        8,
        `class="obj" fill="${CORAL}" stroke="${INK}" stroke-width="1"`,
      );
    return svg(372, baseY + 40, inner, `${s.n} objects in groups of ${g}`);
  },
  controls: (s, p) => [
    { id: "add", label: bi("Add one", "Agregar uno"), action: { type: "add" } },
    {
      id: "add-g",
      label: bi(`Add a group of ${p.group || 10}`, `Agregar un grupo de ${p.group || 10}`),
      action: { type: "add", count: p.group || 10 },
    },
    {
      id: "remove",
      label: bi("Take one away", "Quitar uno"),
      action: { type: "remove" },
      disabled: s.n <= 0,
    },
  ],
  describe: (s, p) =>
    bi(
      `${s.n} objects arranged in groups of ${p.group || 10}.`,
      `${s.n} objetos en grupos de ${p.group || 10}.`,
    ),
  verify(s, p) {
    const drawn = (this.render(s, p).match(/class="obj"/g) || []).length;
    return drawn === s.n ? [] : [`drew ${drawn} objects for ${s.n}`];
  },
  generate: (rng, g) => ({
    group: g === 1 ? 10 : rng.pick([5, 10]),
    start: rng.int(11, 47),
    cap: 60,
  }),
});

// ---------------------------------------------------------------- fact family
const familyEquations = (a, b, op) => {
  const c = op === "mul" ? a * b : a + b;
  return op === "mul"
    ? [
        `${a} × ${b} = ${c}`,
        `${b} × ${a} = ${c}`,
        ...(a && b ? [`${c} ÷ ${a} = ${b}`, `${c} ÷ ${b} = ${a}`] : []),
      ]
    : [`${a} + ${b} = ${c}`, `${b} + ${a} = ${c}`, `${c} − ${a} = ${b}`, `${c} − ${b} = ${a}`];
};
registerModel({
  id: "factFamily",
  title: bi("Fact family", "Familia de operaciones"),
  grades: [1, 2, 3, 4],
  domain: "operations",
  init: (p) => ({ a: p.a, b: p.b }),
  reduce(s, a, p) {
    const max = p.op === "mul" ? 12 : 20;
    if (a.type === "setA")
      return {
        ...s,
        a: intIn(a.value, p.op === "mul" ? 1 : 0, max, bi("The first number", "El primer número")),
      };
    if (a.type === "setB")
      return {
        ...s,
        b: intIn(
          a.value,
          p.op === "mul" ? 1 : 0,
          max,
          bi("The second number", "El segundo número"),
        ),
      };
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const eqs = familyEquations(s.a, s.b, p.op);
    const c = p.op === "mul" ? s.a * s.b : s.a + s.b;
    return {
      facts: { a: s.a, b: s.b, c },
      equation: eqs.join("   "),
      verbal: bi(
        `${s.a}, ${s.b} and ${c} belong to one fact family. Two operations undo each other.`,
        `${s.a}, ${s.b} y ${c} son una familia de operaciones. Dos operaciones se deshacen entre sí.`,
      ),
      numeric: { headers: ["equation"], rows: eqs.map((e) => [e]) },
    };
  },
  render(s, p) {
    const c = p.op === "mul" ? s.a * s.b : s.a + s.b;
    const inner = `<path d="M110 14 190 134H30z" fill="#f4fbfa" stroke="${INK}" stroke-width="3"/>${circle(110, 44, 24, `fill="${AMBER}" stroke="${INK}" stroke-width="2.5"`)}${text(110, 53, c, `class="num" text-anchor="middle" font-size="24" font-weight="800" fill="${INK}"`)}${circle(46, 128, 22, `fill="#fff" stroke="${INK}" stroke-width="2.5"`)}${text(46, 137, s.a, `class="num" text-anchor="middle" font-size="22" font-weight="800" fill="${INK}"`)}${circle(174, 128, 22, `fill="#fff" stroke="${INK}" stroke-width="2.5"`)}${text(174, 137, s.b, `class="num" text-anchor="middle" font-size="22" font-weight="800" fill="${INK}"`)}`;
    return svg(220, 160, inner, `Fact family triangle with ${s.a}, ${s.b} and ${c}`);
  },
  controls: (s, p) => [
    {
      id: "a+",
      label: bi("First number + 1", "Primer número + 1"),
      action: { type: "setA", value: s.a + 1 },
    },
    {
      id: "a-",
      label: bi("First number − 1", "Primer número − 1"),
      action: { type: "setA", value: s.a - 1 },
    },
    {
      id: "b+",
      label: bi("Second number + 1", "Segundo número + 1"),
      action: { type: "setB", value: s.b + 1 },
    },
    {
      id: "b-",
      label: bi("Second number − 1", "Segundo número − 1"),
      action: { type: "setB", value: s.b - 1 },
    },
  ],
  describe: (s, p) =>
    bi(
      `A fact-family triangle: ${s.a} and ${s.b} make ${p.op === "mul" ? s.a * s.b : s.a + s.b}.`,
      `Un triángulo de familia de operaciones: ${s.a} y ${s.b} forman ${p.op === "mul" ? s.a * s.b : s.a + s.b}.`,
    ),
  verify(s, p) {
    const c = p.op === "mul" ? s.a * s.b : s.a + s.b;
    const problems = [];
    // Each related equation must be true when evaluated independently of the string that produced it.
    for (const eq of familyEquations(s.a, s.b, p.op)) {
      const m = /^(\d+) ([+−×÷]) (\d+) = (\d+)$/.exec(eq);
      const [l, op, r, res] = [Number(m[1]), m[2], Number(m[3]), Number(m[4])];
      const value = op === "+" ? l + r : op === "−" ? l - r : op === "×" ? l * r : l / r;
      if (value !== res) problems.push(`${eq} is false`);
    }
    const nums = [...this.render(s, p).matchAll(/class="num"[^>]*>(\d+)</g)].map((m) =>
      Number(m[1]),
    );
    if (nums[0] !== c) problems.push("triangle top is not the total");
    return problems;
  },
  generate: (rng, g) =>
    g <= 2
      ? { op: "add", a: rng.int(2, 9), b: rng.int(2, 9) }
      : { op: "mul", a: rng.int(2, 9), b: rng.int(2, 9) },
});

// ---------------------------------------------------------------- array and equal groups
registerModel({
  id: "array",
  title: bi("Array and equal groups", "Matriz y grupos iguales"),
  grades: [2, 3, 4],
  variants: ["groups"],
  domain: "operations",
  init: (p) => ({ rows: p.rows, cols: p.cols }),
  reduce(s, a) {
    if (a.type === "rows")
      return { ...s, rows: intIn(a.value, 1, 12, bi("The number of rows", "El número de filas")) };
    if (a.type === "cols")
      return {
        ...s,
        cols: intIn(a.value, 1, 12, bi("The number in each row", "El número en cada fila")),
      };
    if (a.type === "swap") return { rows: s.cols, cols: s.rows };
    throw new ModelError("Unknown move");
  },
  derive(s) {
    const total = s.rows * s.cols;
    return {
      facts: { rows: s.rows, cols: s.cols, total },
      equation: `${s.rows} × ${s.cols} = ${total}`,
      verbal: bi(
        `${s.rows} equal groups of ${s.cols} make ${total}. Turn it and ${s.cols} × ${s.rows} is also ${total}.`,
        `${s.rows} grupos iguales de ${s.cols} forman ${total}. Si lo giras, ${s.cols} × ${s.rows} también es ${total}.`,
      ),
      numeric: {
        headers: ["groups", "in each group", "total"],
        rows: Array.from({ length: s.rows }, (_, i) => [i + 1, s.cols, (i + 1) * s.cols]),
      },
    };
  },
  render(s, p, variant) {
    const cell = Math.min(34, Math.floor(360 / Math.max(s.cols, s.rows)));
    let inner = "";
    for (let r = 0; r < s.rows; r += 1) {
      if (variant === "groups")
        inner += rect(
          6,
          6 + r * (cell + 10),
          s.cols * cell + 10,
          cell + 4,
          `fill="#f4fbfa" stroke="${TEAL}" stroke-width="2" rx="8"`,
        );
      for (let c = 0; c < s.cols; c += 1)
        inner += circle(
          14 + c * cell + cell / 2,
          8 + r * (cell + (variant === "groups" ? 10 : 0)) + cell / 2,
          cell * 0.36,
          `class="cell on" fill="${CORAL}" stroke="${INK}" stroke-width="1.2"`,
        );
    }
    return svg(
      Math.max(120, s.cols * cell + 28),
      16 + s.rows * (cell + (variant === "groups" ? 10 : 0)),
      inner,
      `${s.rows} rows of ${s.cols}`,
    );
  },
  controls: (s) => [
    {
      id: "r+",
      label: bi("Add a row", "Agregar una fila"),
      action: { type: "rows", value: s.rows + 1 },
      disabled: s.rows >= 12,
    },
    {
      id: "r-",
      label: bi("Take a row away", "Quitar una fila"),
      action: { type: "rows", value: s.rows - 1 },
      disabled: s.rows <= 1,
    },
    {
      id: "c+",
      label: bi("Add to each row", "Agregar a cada fila"),
      action: { type: "cols", value: s.cols + 1 },
      disabled: s.cols >= 12,
    },
    {
      id: "c-",
      label: bi("Take from each row", "Quitar de cada fila"),
      action: { type: "cols", value: s.cols - 1 },
      disabled: s.cols <= 1,
    },
    { id: "swap", label: bi("Turn the array", "Girar la matriz"), action: { type: "swap" } },
  ],
  describe: (s) =>
    bi(
      `An array with ${s.rows} rows and ${s.cols} in each row, ${s.rows * s.cols} in all.`,
      `Una matriz con ${s.rows} filas y ${s.cols} en cada fila, ${s.rows * s.cols} en total.`,
    ),
  verify(s, p) {
    const a = (this.render(s, p).match(/class="cell on"/g) || []).length;
    const b = (this.render(s, p, "groups").match(/class="cell on"/g) || []).length;
    const problems = [];
    if (a !== s.rows * s.cols) problems.push(`array drew ${a}`);
    if (b !== s.rows * s.cols) problems.push(`groups drew ${b}`);
    return problems;
  },
  generate: (rng, g) => ({ rows: rng.int(2, g >= 4 ? 9 : 6), cols: rng.int(2, g >= 4 ? 9 : 6) }),
});

// ---------------------------------------------------------------- partial products (area model)
registerModel({
  id: "areaMultiply",
  title: bi("Area model for multiplication", "Modelo de área para multiplicar"),
  grades: [3, 4, 5],
  domain: "operations",
  // A factor below ten starts unsplit (split 0); a larger one starts split into its tens and ones.
  init: (p) => (p.unsplit ? { splitA: 0, splitB: 0 } : { splitA: Math.floor(p.a / 10) * 10, splitB: Math.floor(p.b / 10) * 10 }),
  reduce(s, a, p) {
    if (a.type === "splitA") return { ...s, splitA: intIn(a.value, 0, p.a, bi("The split of the first factor", "La partición del primer factor")) };
    if (a.type === "splitB") return { ...s, splitB: intIn(a.value, 0, p.b, bi("The split of the second factor", "La partición del segundo factor")) };
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const a1 = s.splitA;
    const a2 = p.a - a1;
    const b1 = s.splitB;
    const b2 = p.b - b1;
    const parts = [a1 * b1, a1 * b2, a2 * b1, a2 * b2];
    const sumText = (x, y) => (x && y ? `(${x} + ${y})` : `${x || y}`);
    const nonzero = parts.filter(Boolean);
    return {
      facts: { a: p.a, b: p.b, parts, total: p.a * p.b },
      equation: `${sumText(a1, a2)} × ${sumText(b1, b2)} = ${nonzero.join(" + ")} = ${p.a * p.b}`,
      verbal: bi(`Split ${p.a} into ${a1 && a2 ? `${a1} and ${a2}` : "one piece"}${b1 && b2 ? `, and ${p.b} into ${b1} and ${b2}` : ""}. The partial products add to ${p.a * p.b}.`, `Parte ${p.a} en ${a1 && a2 ? `${a1} y ${a2}` : "una sola pieza"}${b1 && b2 ? `, y ${p.b} en ${b1} y ${b2}` : ""}. Los productos parciales suman ${p.a * p.b}.`),
      numeric: { headers: ["part", "product"], rows: [[`${a1} × ${b1}`, parts[0]], [`${a1} × ${b2}`, parts[1]], [`${a2} × ${b1}`, parts[2]], [`${a2} × ${b2}`, parts[3]]].filter((row) => row[1] !== 0) },
    };
  },
  render(s, p) {
    const W = 360;
    const H = 200;
    const sx = (v) => (v / p.a) * W;
    const sy = (v) => (v / p.b) * H;
    const a1 = s.splitA;
    const b1 = s.splitB;
    const regions = [[0, 0, a1, b1, "#8dc7c3"], [a1, 0, p.a - a1, b1, AMBER], [0, b1, a1, p.b - b1, "#e9a98f"], [a1, b1, p.a - a1, p.b - b1, "#b9c8ee"]];
    const inner = regions.map(([x, y, w, h, fill]) => `${rect(20 + sx(x), 20 + sy(y), sx(w), sy(h), `class="part" data-area="${w * h}" fill="${fill}" stroke="${INK}" stroke-width="2"`)}${w * h ? text(20 + sx(x) + sx(w) / 2, 20 + sy(y) + sy(h) / 2 + 5, w * h, `text-anchor="middle" font-size="16" font-weight="800" fill="${INK}"`) : ""}`).join("");
    return svg(400, 240, inner, `Area model ${p.a} by ${p.b}`);
  },
  controls: (s, p) => [
    { id: "a-", label: bi("Move the first split left", "Mover la primera partición a la izquierda"), action: { type: "splitA", value: s.splitA - 1 }, disabled: s.splitA <= 0 },
    { id: "a+", label: bi("Move the first split right", "Mover la primera partición a la derecha"), action: { type: "splitA", value: s.splitA + 1 }, disabled: s.splitA >= p.a },
    { id: "b-", label: bi("Move the second split up", "Mover la segunda partición hacia arriba"), action: { type: "splitB", value: s.splitB - 1 }, disabled: s.splitB <= 0 },
    { id: "b+", label: bi("Move the second split down", "Mover la segunda partición hacia abajo"), action: { type: "splitB", value: s.splitB + 1 }, disabled: s.splitB >= p.b },
  ],
  describe: (s, p) => bi(`A ${p.a} by ${p.b} rectangle cut at ${s.splitA} and ${s.splitB}.`, `Un rectángulo de ${p.a} por ${p.b} cortado en ${s.splitA} y ${s.splitB}.`),
  verify(s, p) {
    const areas = [...this.render(s, p).matchAll(/data-area="(\d+)"/g)].map((m) => Number(m[1]));
    const problems = [];
    if (areas.reduce((x, y) => x + y, 0) !== p.a * p.b) problems.push("partial products do not add to the product");
    if (areas.length !== 4) problems.push("expected four parts");
    return problems;
  },
  generate: (rng, g) => (g <= 3 ? { a: rng.int(12, 29), b: rng.int(3, 9) } : { a: rng.int(23, 68), b: rng.int(12, 48) }),
});

// ---------------------------------------------------------------- long division
function divisionSteps(dividend, divisor) {
  const digits = String(dividend).split("").map(Number);
  const steps = [];
  let rem = 0;
  let started = false;
  digits.forEach((digit, index) => {
    const partial = rem * 10 + digit;
    const q = Math.floor(partial / divisor);
    const used = q * divisor;
    if (q > 0) started = true;
    rem = partial - used;
    steps.push({ index, bring: digit, partial, q, used, rem, started });
  });
  return steps;
}
registerModel({
  id: "longDivision",
  title: bi("Long division", "División larga"),
  grades: [4, 5, 6],
  domain: "operations",
  init: () => ({ step: 0 }),
  reduce(s, a, p) {
    const total = String(p.dividend).length;
    if (a.type === "next") {
      if (s.step >= total)
        throw new ModelError(bi("The division is finished.", "La división terminó."));
      return { step: s.step + 1 };
    }
    if (a.type === "prev") {
      if (s.step <= 0)
        throw new ModelError(bi("This is the first step.", "Este es el primer paso."));
      return { step: s.step - 1 };
    }
    if (a.type === "all") return { step: total };
    throw new ModelError("Unknown move");
  },
  derive(s, p) {
    const steps = divisionSteps(p.dividend, p.divisor).slice(0, s.step);
    const quotient =
      steps
        .filter((x) => x.started)
        .map((x) => x.q)
        .join("") || "0";
    const done = s.step >= String(p.dividend).length;
    const rem = steps.length ? steps.at(-1).rem : 0;
    return {
      facts: { quotient: Number(quotient), remainder: rem, done },
      equation: done
        ? `${p.dividend} ÷ ${p.divisor} = ${quotient}${rem ? ` R ${rem}` : ""}`
        : `${p.dividend} ÷ ${p.divisor}`,
      verbal: bi(
        done
          ? `${p.divisor} goes into ${p.dividend} ${quotient} times with ${rem} left. Check: ${quotient} × ${p.divisor}${rem ? ` + ${rem}` : ""} = ${p.dividend}.`
          : `Step ${s.step} of ${String(p.dividend).length}.`,
        done
          ? `${p.divisor} cabe en ${p.dividend} ${quotient} veces y sobran ${rem}. Comprueba: ${quotient} × ${p.divisor}${rem ? ` + ${rem}` : ""} = ${p.dividend}.`
          : `Paso ${s.step} de ${String(p.dividend).length}.`,
      ),
      numeric: {
        headers: ["bring down", "number", "times", "subtract", "left"],
        rows: steps.map((x) => [x.bring, x.partial, x.q, x.used, x.rem]),
      },
    };
  },
  render(s, p) {
    const steps = divisionSteps(p.dividend, p.divisor).slice(0, s.step);
    const digits = String(p.dividend).split("");
    const quotient = steps
      .map((x, i) => (x.started || i === digits.length - 1 ? x.q : ""))
      .join("");
    let inner = `${text(60, 44, quotient, `class="quotient" font-size="26" font-weight="800" fill="${CORAL}" font-family="ui-monospace,Menlo,monospace"`)}${text(20, 84, p.divisor, `font-size="26" font-weight="800" fill="${INK}" font-family="ui-monospace,Menlo,monospace"`)}<path d="M44 56V94M44 56H${60 + digits.length * 18}" fill="none" stroke="${INK}" stroke-width="3"/>${text(52, 84, digits.join(""), `font-size="26" font-weight="800" fill="${INK}" font-family="ui-monospace,Menlo,monospace" letter-spacing="2.4"`)}`;
    steps.forEach((x, i) => {
      if (!x.started) return;
      inner +=
        text(
          52 + i * 18,
          118 + i * 44,
          `−${x.used}`,
          `font-size="19" fill="${INK}" font-family="ui-monospace,Menlo,monospace"`,
        ) +
        text(
          52 + i * 18,
          144 + i * 44,
          x.rem,
          `font-size="19" font-weight="700" fill="${INK}" font-family="ui-monospace,Menlo,monospace"`,
        );
    });
    return svg(
      340,
      160 + Math.max(0, steps.length - 1) * 44,
      inner,
      `Long division ${p.dividend} divided by ${p.divisor}, step ${s.step}`,
    );
  },
  controls: (s, p) => [
    {
      id: "prev",
      label: bi("Previous step", "Paso anterior"),
      action: { type: "prev" },
      disabled: s.step <= 0,
    },
    {
      id: "next",
      label: bi("Next step", "Paso siguiente"),
      action: { type: "next" },
      disabled: s.step >= String(p.dividend).length,
    },
    { id: "all", label: bi("Show every step", "Mostrar todos los pasos"), action: { type: "all" } },
  ],
  describe: (s, p) =>
    bi(
      `Long division of ${p.dividend} by ${p.divisor}, at step ${s.step} of ${String(p.dividend).length}.`,
      `División larga de ${p.dividend} entre ${p.divisor}, en el paso ${s.step} de ${String(p.dividend).length}.`,
    ),
  verify(s, p) {
    const all = divisionSteps(p.dividend, p.divisor);
    const last = all.at(-1);
    const q = Number(all.map((x) => x.q).join(""));
    const problems = [];
    // Independent check: quotient and remainder must agree with integer division, and q × d + r must rebuild the dividend.
    if (q !== Math.floor(p.dividend / p.divisor) || last.rem !== p.dividend % p.divisor)
      problems.push("quotient or remainder is wrong");
    if (q * p.divisor + last.rem !== p.dividend) problems.push("check multiplication fails");
    return problems;
  },
  generate: (rng, g) => ({
    dividend: rng.int(g >= 5 ? 1200 : 150, g >= 5 ? 9800 : 980),
    divisor: rng.int(3, g >= 5 ? 14 : 9),
  }),
});

// Skill studios: one generated build task, one short explanation and one fresh transfer problem for a Fluency Lab
// skill, on the model that suits it. A template draws its numbers from a seed, so the same learner session always
// poses the same problem and every problem's check is read from the model's own state.
import { L, R, seeded } from "./kernel.js";
import { done, explain, frame, hint, idea, notYet, task, transfer, w } from "./authoring.js";
import { PLACE_SETS } from "./models/number.js";

const g = (en, es) => L(en, es);
const sgn = (n) => String(n).replace("-", "−");

// A mat that already holds a number with one or two "too many" places, so the learner has to trade.
function overflowCounts(n, set, rng, trades = 1) {
  const ids = PLACE_SETS[set].map((p) => p.id);
  const values = PLACE_SETS[set].map((p) => Math.round(Number(p.value.n) / Number(p.value.d)));
  let rest = n;
  const counts = Object.fromEntries(ids.map((id) => [id, 0]));
  ids.forEach((id, i) => {
    counts[id] = Math.floor(rest / values[i]);
    rest -= counts[id] * values[i];
  });
  for (let t = 0; t < trades; t++) {
    const options = ids.slice(1).filter((id) => counts[ids[ids.indexOf(id) - 1]] > 0);
    if (!options.length) break;
    const id = rng.pick(options);
    counts[ids[ids.indexOf(id) - 1]] -= 1;
    counts[id] += 10;
  }
  return counts;
}

const TEMPLATES = {
  tenframe: {
    model: "tenframe",
    title: g("Ten-frame studio", "Estudio de marcos de diez"),
    hints: [hint("Put one counter in each box and count as you go.", "Pon una ficha en cada casilla y cuenta mientras avanzas."), hint("Red and yellow counters add up to the total.", "Las fichas rojas y amarillas suman el total.")],
    explain: [frame(g("I can tell how many by looking at the frame because it holds", "Puedo saber cuántas hay mirando el marco porque cabe"), [w("10 in all", "10 en total", true), w("5 in all", "5 en total"), w("100 in all", "100 en total")])],
    ideas: [idea("ten", ["10", "ten", "diez", "full", "lleno"]), idea("count", ["count", "red", "yellow", "more", "contar", "rojo", "amarillo", "más"])],
    make(rng, v) {
      const cap = v.max || 10;
      const frames = cap > 10 ? 2 : 1;
      const set = { frames };
      switch (v.mode) {
        case "make10": {
          const a = rng.int(1, 9);
          return { goal: g(`There are ${a} red counters. Add yellow counters until the frame is full (10).`, `Hay ${a} fichas rojas. Agrega fichas amarillas hasta llenar el marco (10).`), params: { ...set, a }, check: (s, d) => d.a === a && d.total === 10 };
        }
        case "missing": {
          const t = rng.int(5, cap);
          const a = rng.int(1, t - 1);
          return { goal: g(`${a} + ? = ${t}. Add yellow counters until there are ${t} in all.`, `${a} + ? = ${t}. Agrega fichas amarillas hasta tener ${t} en total.`), params: { ...set, a }, check: (s, d) => d.a === a && d.total === t };
        }
        case "sub": {
          const a = rng.int(4, cap);
          const b = rng.int(1, a - 1);
          return { goal: g(`Start with ${a} counters. Take away ${b}. How many are left?`, `Empieza con ${a} fichas. Quita ${b}. ¿Cuántas quedan?`), params: { ...set, a }, check: (s, d) => d.a === a - b && d.b === 0 };
        }
        case "evenodd": {
          const n = rng.int(4, cap);
          return { goal: g(`Show ${n} counters in two colours, as equal as you can.`, `Muestra ${n} fichas de dos colores, lo más iguales que puedas.`), params: set, check: (s, d) => d.total === n && Math.abs(d.a - d.b) === n % 2 };
        }
        case "more": {
          const n = rng.int(3, cap - 3);
          return { goal: g(`Show more than ${n} counters.`, `Muestra más de ${n} fichas.`), params: set, check: (s, d) => d.total > n };
        }
        case "count": {
          const n = rng.int(1, v.top || cap);
          return { goal: g(`Show ${n} counters in the frame.`, `Muestra ${n} fichas en el marco.`), params: set, check: (s, d) => d.total === n };
        }
        default: {
          const a = rng.int(1, cap - 2);
          const b = rng.int(1, Math.min(cap - a, v.maxAdd || cap));
          return { goal: g(`Show ${a} + ${b}: ${a} red and ${b} yellow counters. How many in all?`, `Muestra ${a} + ${b}: ${a} fichas rojas y ${b} amarillas. ¿Cuántas hay en total?`), params: set, check: (s, d) => d.a === a && d.b === b };
        }
      }
    },
  },

  place: {
    model: "place",
    title: g("Place-value studio", "Estudio de valor posicional"),
    hints: [hint("Ten of one place trade for one of the next place to the left.", "Diez de un lugar se cambian por uno del lugar siguiente a la izquierda."), hint("To take away more than you have, break one piece into ten smaller ones.", "Para quitar más de lo que tienes, descompón una pieza en diez más pequeñas.")],
    explain: [frame(g("I can trade 10 of one piece for 1 of the next because the next place is worth", "Puedo cambiar 10 de una pieza por 1 de la siguiente porque el siguiente lugar vale"), [w("ten times as much", "diez veces más", true), w("two times as much", "dos veces más"), w("the same", "lo mismo")])],
    ideas: [idea("ten", ["10", "ten", "diez"]), idea("trade", ["trade", "regroup", "exchange", "cambi", "reagrup", "intercamb"]), idea("place", ["place", "next", "left", "lugar", "siguiente", "izquierda"])],
    make(rng, v) {
      const set = v.set || "whole";
      const digits = v.digits || 2;
      const lo = 10 ** (digits - 1) + 10;
      const hi = 10 ** digits - 1;
      const num = (min, max) => rng.int(min, max);
      if (v.mode === "add") {
        const a = num(lo, Math.floor(hi * 0.6));
        let b = num(lo, Math.floor(hi * 0.6));
        if (((a % 10) + (b % 10)) < 10) b += 10 - (b % 10) + (10 - (a % 10)) % 10 || 5;
        const total = a + b;
        return { goal: g(`Build ${a} in row A and ${b} in row B. Join them, then trade until no place holds 10 or more.`, `Construye ${a} en la fila A y ${b} en la fila B. Únelos y cambia hasta que ningún lugar tenga 10 o más.`), params: { set, rows: ["A", "B"] }, check: (s, d) => d.combined && d.regrouped && d.total.eq(R(total)) };
      }
      if (v.mode === "sub") {
        const a = num(lo + 10, hi);
        let b = num(10, a - 5);
        if (b % 10 <= a % 10) b = b - (b % 10) + ((a % 10) + 1) % 10 + (((a % 10) + 1) % 10 === 0 ? 10 : 0);
        if (b >= a) b = a - 3;
        const rest = a - b;
        const counts = overflowCounts(a, set, rng, 0);
        return { goal: g(`Start with ${a}. Take away ${b}. Break a piece into ten smaller ones when you need more.`, `Empieza con ${a}. Quita ${b}. Descompón una pieza en diez más pequeñas cuando necesites más.`), params: { set, rows: ["T"], counts }, check: (s, d) => d.regrouped && d.total.eq(R(rest)) };
      }
      const n = num(lo, hi);
      const counts = overflowCounts(n, set, rng, digits > 2 ? 2 : 1);
      return { goal: g("Trade the pieces so no place holds 10 or more. Then read the number.", "Cambia las piezas para que ningún lugar tenga 10 o más. Luego lee el número."), params: { set, rows: ["T"], counts }, check: (s, d) => d.regrouped && d.total.eq(R(n)) };
    },
  },

  decimal: {
    model: "place",
    title: g("Decimal studio", "Estudio de decimales"),
    hints: [hint("1 tenth is the same as 10 hundredths.", "1 décimo es lo mismo que 10 centésimos."), hint("Only pieces in the same place can be added or taken away.", "Solo se pueden sumar o quitar piezas del mismo lugar.")],
    explain: [frame(g("Tenths and hundredths are different sizes. I trade", "Los décimos y los centésimos son de distinto tamaño. Cambio"), [w("10 hundredths for 1 tenth", "10 centésimos por 1 décimo", true), w("2 hundredths for 1 tenth", "2 centésimos por 1 décimo"), w("1 hundredth for 1 tenth", "1 centésimo por 1 décimo")])],
    ideas: [idea("size", ["size", "different", "place", "tamaño", "diferente", "lugar"]), idea("ten", ["10", "ten", "diez"])],
    make(rng, v) {
      const set = "decimal";
      if (v.mode === "sub") {
        const A = rng.int(110, 190) / 100;
        const b = rng.int(15, 99) / 100;
        const aT = Math.round(A * 100);
        const counts = { ones: Math.floor(aT / 100), tenths: Math.floor((aT % 100) / 10), hundredths: aT % 10 };
        const rest = aT - Math.round(b * 100);
        const str = (x) => x.toFixed(2);
        return { goal: g(`Start with ${str(A)}. Take away ${str(b)}. Break a piece into ten smaller ones when you need more.`, `Empieza con ${str(A)}. Quita ${str(b)}. Descompón una pieza en diez más pequeñas cuando necesites más.`), params: { set, rows: ["T"], counts }, check: (s, d) => d.regrouped && d.total.eq(R(rest, 100)) };
      }
      if (v.mode === "trade") {
        const t = rng.int(1, 4);
        const h = rng.int(1, 9);
        const counts = { ones: 0, tenths: t, hundredths: 10 + h };
        const total = t * 10 + 10 + h;
        return { goal: g("Trade the pieces so no place holds 10 or more. Then read the decimal.", "Cambia las piezas para que ningún lugar tenga 10 o más. Luego lee el decimal."), params: { set, rows: ["T"], counts }, check: (s, d) => d.regrouped && d.total.eq(R(total, 100)) };
      }
      const a = rng.int(2, 9) / 10;
      const bh = rng.int(11, 49);
      const b = bh / 100;
      const total = Math.round(a * 100) + bh;
      return { goal: g(`Build ${a.toFixed(1)} in row A and ${b.toFixed(2)} in row B. Join them, then trade until no place holds 10 or more.`, `Construye ${a.toFixed(1)} en la fila A y ${b.toFixed(2)} en la fila B. Únelos y cambia hasta que ningún lugar tenga 10 o más.`), params: { set, rows: ["A", "B"] }, check: (s, d) => d.combined && d.regrouped && d.total.eq(R(total, 100)) };
    },
  },

  area: {
    model: "area",
    title: g("Array and area studio", "Estudio de arreglos y área"),
    hints: [hint("Rows go across and columns go down. Count the squares in one row.", "Las filas van a lo ancho y las columnas hacia abajo. Cuenta los cuadros de una fila."), hint("Area is width × height.", "El área es ancho × alto.")],
    explain: [frame(g("The number of squares is the same as", "El número de cuadros es lo mismo que"), [w("the width times the height", "el ancho por el alto", true), w("the width plus the height", "el ancho más el alto"), w("the perimeter", "el perímetro")])],
    ideas: [idea("mult", ["times", "multipl", "×", "rows", "columns", "veces", "multiplic", "filas", "columnas"]), idea("area", ["area", "squares", "inside", "área", "cuadros", "cuadrados"])],
    make(rng, v) {
      const max = 12;
      const params = { w: 1, h: 1, maxW: max, maxH: max };
      if (v.mode === "div") {
        const a = rng.int(2, v.max || 9);
        const b = rng.int(2, v.max || 9);
        return { goal: g(`Make a rectangle with area ${a * b} and one side ${a}. What is the other side?`, `Haz un rectángulo de área ${a * b} con un lado de ${a}. ¿Cuánto mide el otro lado?`), params, check: (s, d) => d.area === a * b && d.w === a };
      }
      if (v.mode === "perimeter") {
        const P = 2 * rng.int(v.min || 5, v.max || 11);
        return { goal: g(`Build a rectangle with a perimeter of ${P} units.`, `Construye un rectángulo con un perímetro de ${P} unidades.`), params, check: (s, d) => d.perimeter === P };
      }
      const lo = Math.max(2, v.min || 2);
      const a = rng.int(lo, v.max || 9);
      const b = rng.int(lo, v.max || 9);
      return { goal: g(`Build an array with ${a} rows and ${b} columns: a rectangle ${b} wide and ${a} tall. How many squares?`, `Construye un arreglo con ${a} filas y ${b} columnas: un rectángulo de ${b} de ancho y ${a} de alto. ¿Cuántos cuadros hay?`), params, check: (s, d) => d.w === b && d.h === a };
    },
  },

  fracadd: {
    model: "fracadd",
    title: g("Same-size pieces studio", "Estudio de piezas del mismo tamaño"),
    hints: [hint("Pieces must be the same size before you can count them together. Cut both bars.", "Las piezas deben ser del mismo tamaño antes de contarlas juntas. Corta las dos barras."), hint("Find a number that both denominators divide into.", "Busca un número en el que quepan los dos denominadores.")],
    explain: [frame(g("I can only add fractions after the pieces are the same", "Solo puedo sumar fracciones cuando las piezas son del mismo"), [w("size", "tamaño", true), w("color", "color"), w("shape", "forma")])],
    ideas: [idea("size", ["size", "same", "denominator", "tamaño", "mismo", "denominador"]), idea("cut", ["cut", "split", "common", "equal", "corta", "común", "igual"])],
    make(rng, v) {
      const pairs = [[[1, 2], [1, 3]], [[1, 2], [1, 4]], [[2, 3], [1, 6]], [[1, 3], [1, 4]], [[3, 4], [1, 6]], [[1, 4], [2, 3]], [[1, 6], [3, 4]], [[2, 5], [1, 2]]];
      const [a, b] = rng.pick(pairs);
      const A = R(a[0], a[1]);
      const B = R(b[0], b[1]);
      const text = `${a[0]}/${a[1]}`;
      const text2 = `${b[0]}/${b[1]}`;
      if (v.mode === "compare")
        return {
          goal: g(`Cut both bars until the pieces match. Then decide which is greater: ${text} or ${text2}.`, `Corta las dos barras hasta que las piezas coincidan. Luego decide cuál es mayor: ${text} o ${text2}.`),
          params: { a, b }, check: (s, d) => d.sameSize,
          answer: { prompt: g(`Which is greater: ${text} or ${text2}? Type it.`, `¿Cuál es mayor: ${text} o ${text2}? Escríbela.`), expect: String(A.gt(B) ? A : B) },
        };
      return {
        goal: g(`Make the pieces the same size, then combine: ${text} + ${text2}.`, `Haz que las piezas sean del mismo tamaño y luego combina: ${text} + ${text2}.`),
        params: { a, b }, check: (s, d) => d.combined,
        answer: { prompt: g(`${text} + ${text2} = ?`, `${text} + ${text2} = ?`), expect: String(A.add(B)) },
      };
    },
  },

  balance: {
    model: "balance",
    title: g("Balance studio", "Estudio de balanzas"),
    hints: [hint("Whatever you do to one side, do to the other.", "Lo que hagas en un lado, hazlo en el otro."), hint("Take away the loose units first, then split what is left into equal groups.", "Quita primero las unidades sueltas y luego divide lo que queda en grupos iguales.")],
    explain: [frame(g("I kept the scale balanced by doing the same thing to", "Mantuve la balanza equilibrada haciendo lo mismo en"), [w("both sides", "ambos lados", true), w("one side", "un lado"), w("neither side", "ningún lado")])],
    ideas: [idea("both", ["both", "each side", "same", "ambos", "cada lado", "mismo"]), idea("balance", ["balance", "equal", "equilib", "igual"])],
    make(rng, v) {
      const x = rng.int(2, 9);
      let left;
      let right;
      let label;
      if (v.mode === "one") {
        if (rng.next() < 0.5) {
          const b = rng.int(1, 9);
          left = { x: 1, u: b }; right = { x: 0, u: x + b };
          label = `x + ${b} = ${x + b}`;
        } else {
          const a = rng.int(2, 5);
          left = { x: a, u: 0 }; right = { x: 0, u: a * x };
          label = `${a}x = ${a * x}`;
        }
      } else if (v.mode === "both") {
        const c = rng.int(1, 3);
        const k = rng.int(1, 3);
        const a = c + k;
        const b = rng.int(0, 6);
        const d = k * x + b;
        left = { x: a, u: b }; right = { x: c, u: d };
        label = `${a}x + ${b} = ${c}x + ${d}`;
      } else {
        const a = rng.int(2, 4);
        const b = rng.int(1, 9);
        left = { x: a, u: b }; right = { x: 0, u: a * x + b };
        label = `${a}x + ${b} = ${a * x + b}`;
      }
      return { goal: g(`Solve ${label} on the scale. Keep it balanced. What does x weigh?`, `Resuelve ${label} en la balanza. Mantenla equilibrada. ¿Cuánto pesa x?`), params: { x, left, right }, check: (s, d) => d.solved && s.right.u === x };
    },
  },

  graph: {
    model: "graph",
    title: g("Line studio", "Estudio de rectas"),
    hints: [hint("Slope is the rise divided by the run between the two points.", "La pendiente es la subida dividida entre el avance entre los dos puntos."), hint("Move a point with the arrows or drag it.", "Mueve un punto con las flechas o arrástralo.")],
    explain: [frame(g("The slope tells me how far the line goes up for every step to the", "La pendiente me dice cuánto sube la recta por cada paso a la"), [w("right", "derecha", true), w("left", "izquierda"), w("top", "parte superior")])],
    ideas: [idea("rise", ["rise", "up", "down", "change in y", "sube", "baja", "cambio en y"]), idea("run", ["run", "right", "across", "change in x", "derecha", "cambio en x"])],
    make(rng, v) {
      if (v.mode === "point") {
        const x = rng.int(-5, 5);
        let y = rng.int(-5, 5);
        if (y === x + 1) y -= 2;
        return { goal: g(`Make a line that passes through the point (${sgn(x)}, ${sgn(y)}).`, `Haz una recta que pase por el punto (${sgn(x)}, ${sgn(y)}).`), params: { p1: [0, 1], p2: [1, 2] }, check: (s, d) => (d.vertical ? d.p1[0] === x : d.slope.mul(x).add(d.intercept).eq(R(y))) };
      }
      const m = rng.pick([R(2), R(-1), R(3), R(-2), R(1, 2), R(1)]);
      const b = rng.int(-4, 4);
      if (v.mode === "slope") return { goal: g(`Make a line with slope ${sgn(m)}.`, `Haz una recta con pendiente ${sgn(m)}.`), params: { p1: [0, 0], p2: [1, 1] }, check: (s, d) => !d.vertical && d.slope.eq(m) };
      return { goal: g(`Make the line for y = ${m.eq(1) ? "" : m.eq(-1) ? "−" : sgn(m)}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}.`, `Haz la recta de y = ${m.eq(1) ? "" : m.eq(-1) ? "−" : sgn(m)}x ${b < 0 ? "−" : "+"} ${Math.abs(b)}.`), params: { p1: [0, 0], p2: [1, 1] }, check: (s, d) => !d.vertical && d.slope.eq(m) && d.intercept.eq(R(b)) };
    },
  },

  chips: {
    model: "chips",
    title: g("Integer chips studio", "Estudio de fichas de enteros"),
    hints: [hint("One positive chip and one negative chip make a zero pair.", "Una ficha positiva y una negativa forman un par cero."), hint("To take away more than you have, add zero pairs first.", "Para quitar más de lo que tienes, agrega primero pares cero.")],
    explain: [frame(g("A positive chip and a negative chip cancel because their sum is", "Una ficha positiva y una negativa se cancelan porque su suma es"), [w("zero", "cero", true), w("one", "uno"), w("two", "dos")])],
    ideas: [idea("zero", ["zero", "cancel", "pair", "cero", "cancel", "par"]), idea("sign", ["positive", "negative", "sign", "positiv", "negativ", "signo"])],
    make(rng, v) {
      const a = rng.pick([-8, -7, -6, -5, -4, -3, 3, 4, 5, 6, 7, 8]);
      let b = rng.pick([-7, -6, -5, -4, -3, -2, 2, 3, 4, 5, 6, 7]);
      if (a + b === 0) b += b > 0 ? 1 : -1;
      if (v.mode === "sub") {
        const want = a - b;
        return { goal: g(`Start with ${sgn(a)}. Show ${sgn(a)} − ${b < 0 ? `(${sgn(b)})` : b}: take away ${sgn(b)}. Add zero pairs if you need to. What is left?`, `Empieza con ${sgn(a)}. Muestra ${sgn(a)} − ${b < 0 ? `(${sgn(b)})` : b}: quita ${sgn(b)}. Agrega pares cero si lo necesitas. ¿Qué queda?`), params: a >= 0 ? { pos: a, neg: 0 } : { pos: 0, neg: -a }, check: (s, d) => d.value === want && d.pairs === 0 };
      }
      const want = a + b;
      return { goal: g(`Show ${sgn(a)} + ${b < 0 ? `(${sgn(b)})` : b}: build the chips for both numbers, remove the zero pairs and read the answer.`, `Muestra ${sgn(a)} + ${b < 0 ? `(${sgn(b)})` : b}: construye las fichas de ambos números, quita los pares cero y lee la respuesta.`), params: {}, check: (s, d) => d.value === want && d.pairs === 0 && d.pos + d.neg === Math.abs(want) };
    },
  },

  hops: {
    model: "numline",
    title: g("Number line studio", "Estudio de la recta numérica"),
    hints: [hint("Each hop moves the same distance. Count the hops.", "Cada salto avanza la misma distancia. Cuenta los saltos."), hint("The equation under the line writes your hops as a sum.", "La ecuación debajo de la recta escribe tus saltos como una suma.")],
    explain: [frame(g("Each hop adds the same amount, so the hops make a", "Cada salto suma la misma cantidad, así que los saltos forman un"), [w("pattern", "patrón", true), w("mystery", "misterio"), w("mistake", "error")])],
    ideas: [idea("hop", ["hop", "jump", "each", "same", "salto", "cada", "mismo"]), idea("count", ["count", "add", "pattern", "contar", "suma", "patrón", "patron"])],
    make(rng, v) {
      if (v.mode === "round") {
        const unit = v.unit || 10;
        const n = rng.int(1, 9) * unit + rng.int(1, unit - 1);
        const near = Math.floor(n / unit + 0.5) * unit;
        return { goal: g(`${n} is on the line. Hop to the nearest ${unit === 10 ? "ten" : "hundred"}.`, `${n} está en la recta. Salta hasta ${unit === 10 ? "la decena" : "la centena"} más cercana.`), params: { min: 0, max: unit * 10, start: n, step: String(unit) }, check: (s, d) => d.pos.eq(R(near)) && d.count > 0 };
      }
      if (v.mode === "measure") {
        const n = rng.int(3, 12);
        return { goal: g(`A pencil is ${n} units long. Hop along the ruler, one unit at a time, to its end.`, `Un lápiz mide ${n} unidades. Salta por la regla, una unidad a la vez, hasta su final.`), params: { min: 0, max: 15, start: 0, step: "1" }, check: (s, d) => d.pos.eq(R(n)) && d.hops.every((h) => h.eq(R(1))) };
      }
      const k = v.step || rng.pick([2, 5, 10]);
      const times = rng.int(3, 6);
      const start = v.fromStart ? rng.int(0, 10) : 0;
      return { goal: g(`Start at ${start}. Hop by ${k} each time and land on ${start + k * times}.`, `Empieza en ${start}. Salta de ${k} en ${k} y aterriza en ${start + k * times}.`), params: { min: 0, max: Math.max(20, start + k * times + k), start, step: String(k) }, check: (s, d) => d.pos.eq(R(start + k * times)) && d.hops.every((h) => h.eq(R(k))) };
    },
  },
};

export const STUDIO_TEMPLATES = Object.keys(TEMPLATES);

// The studio experience for one skill: build (generated), explain, transfer (a fresh problem).
export function studioExperience(skillKey, templateId, variant = {}, grades = [Number(skillKey.split(":")[0])]) {
  const tpl = TEMPLATES[templateId];
  const taskProblem = (session) => tpl.make(seeded(session.seed ^ 0x9e3779b9), variant);
  return {
    id: `studio:${skillKey}`,
    innovation: "living",
    studio: templateId,
    title: tpl.title,
    blurb: g("Build it with a model, say why it works, then solve a new one on your own.", "Constrúyelo con un modelo, di por qué funciona y resuelve uno nuevo tú solo."),
    model: tpl.model,
    params: {},
    grades,
    skills: [skillKey],
    steps: [
      task(
        "build",
        (session) => taskProblem(session).goal,
        (s, d, session) => {
          const p = taskProblem(session);
          return p.check(s, d) ? done(g("That works. Look at what the model shows.", "Eso funciona. Mira lo que muestra el modelo.")) : notYet(g("Not yet. Keep working with the model.", "Todavía no. Sigue trabajando con el modelo."));
        },
        tpl.hints,
        { params: (session) => taskProblem(session).params },
      ),
      explain("why", g("Say why it works.", "Di por qué funciona."), tpl.explain, tpl.ideas, { need: 1 }),
      transfer("new", (rng) => {
        const p = tpl.make(rng, variant);
        return p.answer
          ? { kind: "answer", prompt: p.answer.prompt, expect: p.answer.expect, hints: tpl.hints }
          : { kind: "build", prompt: p.goal, params: p.params, check: p.check, hints: tpl.hints };
      }),
    ],
  };
}

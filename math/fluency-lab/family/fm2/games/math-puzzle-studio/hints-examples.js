// Tier-2 hints: a worked PARALLEL example for each skill, built from fresh numbers so it teaches the move without
// being the puzzle. Each maker returns { en, es, nums } where nums lists every number it prints; hints.js rebuilds the
// example until none of them is in the answer. @fm2 FM-062
import { int, pick } from "../../rng.js";

const ex = (en, es, nums) => ({ en, es, nums });

// "a, ?, b with a total": the shared shape of a missing number in a line that must reach a total.
const line = (rng, big, word, wordEs) => {
  const a = int(rng, 2, big);
  const b = int(rng, 2, big);
  const total = a + b + int(rng, 2, big);
  const s = a + b;
  const m = total - s;
  return ex(
    `Another ${word}: ${a}, ?, ${b} must reach ${total}. ${a} + ${b} = ${s}, and ${total} − ${s} = ${m} is the missing number.`,
    `Otro ${wordEs}: ${a}, ?, ${b} debe llegar a ${total}. ${a} + ${b} = ${s}, y ${total} − ${s} = ${m} es el número que falta.`,
    [a, b, total, s, m],
  );
};

const pairsOf = (p) => {
  const out = [];
  for (let i = 1; i * i <= p; i += 1) if (p % i === 0) out.push([i, p / i]);
  return out;
};

const PY = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [8, 15, 17],
  [9, 12, 15],
  [7, 24, 25],
  [12, 16, 20],
];

export const examples = {
  "bond-parts": (rng, round) => {
    const whole = int(rng, 4, 14);
    const part = int(rng, 1, whole - 1);
    const other = whole - part;
    const mode =
      round.cells[0].v === null
        ? "whole"
        : round.cells.filter((c) => c.v === null).length === 2
          ? "two"
          : "part";
    if (mode === "whole") {
      return ex(
        `Try parts ${part} and ${other}: put together they make ${part} + ${other} = ${whole}, so the whole there is ${whole}.`,
        `Prueba con las partes ${part} y ${other}: juntas forman ${part} + ${other} = ${whole}, así que el total ahí es ${whole}.`,
        [part, other, whole],
      );
    }
    if (mode === "two") {
      return ex(
        `Try a different whole, ${whole}. Choose a part, say ${part}. Then ${whole} − ${part} = ${other} completes it. Your puzzle accepts any pair that fits.`,
        `Prueba con otro total, ${whole}. Elige una parte, por ejemplo ${part}. Entonces ${whole} − ${part} = ${other} lo completa. Tu reto acepta cualquier pareja que encaje.`,
        [whole, part, other],
      );
    }
    return ex(
      `Try a different bond: the whole is ${whole} and a part is ${part}. Count up from ${part} to ${whole}, or work ${whole} − ${part} = ${other}. So ${other} is the missing part there.`,
      `Prueba con otro enlace: el total es ${whole} y una parte es ${part}. Cuenta desde ${part} hasta ${whole}, o calcula ${whole} − ${part} = ${other}. Así ${other} es la parte que falta ahí.`,
      [whole, part, other],
    );
  },
  "balance-same": (rng, round) => {
    const n = int(rng, 4, 14);
    const m = int(rng, 1, n - 2);
    const d = n - m;
    if (round.level === 1) {
      return ex(
        `On a different scale, a pan weighs ${n}. Placing ${n} on the other pan makes the beam level.`,
        `En otra balanza, un platillo pesa ${n}. Colocar ${n} en el otro platillo deja la barra nivelada.`,
        [n],
      );
    }
    if (round.level === 2) {
      return ex(
        `Another scale: a pan weighs ${n} and the other already holds ${m}. It needs ${n} − ${m} = ${d} more.`,
        `Otra balanza: un platillo pesa ${n} y el otro ya tiene ${m}. Necesita ${n} − ${m} = ${d} más.`,
        [n, m, d],
      );
    }
    return ex(
      `Another scale: a pan weighs ${n}. Place ${m} on the other pan; then ${n} − ${m} = ${d} completes it.`,
      `Otra balanza: un platillo pesa ${n}. Coloca ${m} en el otro platillo; entonces ${n} − ${m} = ${d} lo completa.`,
      [n, m, d],
    );
  },
  "equal-sign": (rng) => {
    const a = int(rng, 3, 9);
    const b = int(rng, 3, 9);
    const c = int(rng, 2, a + b - 2);
    const s = a + b;
    return ex(
      `Another puzzle: ${a} + ${b} = ${c} + ?. The left side is ${a} + ${b} = ${s}. The right side already has ${c}, so it needs ${s} − ${c} = ${s - c} more.`,
      `Otro: ${a} + ${b} = ${c} + ?. El lado izquierdo es ${a} + ${b} = ${s}. El lado derecho ya tiene ${c}, así que necesita ${s} − ${c} = ${s - c} más.`,
      [a, b, c, s, s - c],
    );
  },
  "missing-addend": (rng) => {
    const a = int(rng, 2, 9);
    const c = a + int(rng, 2, 9);
    return ex(
      `Another equation: ${a} + ? = ${c}. Think ${c} − ${a} = ${c - a}, so the blank is ${c - a}.`,
      `Otra ecuación: ${a} + ? = ${c}. Piensa ${c} − ${a} = ${c - a}, así que el espacio es ${c - a}.`,
      [a, c, c - a],
    );
  },
  "grid-sums": (rng) => line(rng, 15, "row", "fila"),
  "magic-triangle": (rng) => line(rng, 6, "side", "lado"),
  "magic-square": (rng) => line(rng, 7, "line", "línea"),
  "factor-grid": (rng) => {
    const a = int(rng, 2, 9);
    const b = int(rng, 2, 9);
    const p = a * b;
    return ex(
      `Another grid: a row factor ${a} and a column factor ${b} give ${a} × ${b} = ${p}. If the ${p} and the ${a} show instead, then ${p} ÷ ${a} = ${b} is the missing factor.`,
      `Otra cuadrícula: un factor de fila ${a} y un factor de columna ${b} dan ${a} × ${b} = ${p}. Si se ven el ${p} y el ${a}, entonces ${p} ÷ ${a} = ${b} es el factor que falta.`,
      [a, b, p],
    );
  },
  kenken: (rng, round) => {
    const n = round.n;
    const a = int(rng, 1, n - 1);
    const b = int(rng, a + 1, n);
    const op = pick(rng, ["+", "×"]);
    const t = op === "+" ? a + b : a * b;
    return ex(
      `In a grid of the numbers 1 to ${n}, a cage made of a pair of squares marked ${t}${op} could hold ${a} and ${b}. Find every pair like that for a cage, then cross out any that would repeat a number in a row or column.`,
      `En una cuadrícula con los números del 1 al ${n}, una jaula formada por un par de cuadros marcada ${t}${op} podría tener ${a} y ${b}. Busca todas las parejas así para una jaula y tacha las que repitan un número en una fila o columna.`,
      [n, t, a, b],
    );
  },
  "factor-pairs": (rng, round) => {
    const a = int(rng, 2, 9);
    const b = int(rng, a + 1, 12);
    const p = a * b;
    const list = pairsOf(p);
    if (round.gap) {
      const d = int(rng, 1, 4);
      const hi = a + d;
      const q = a * hi;
      const rows = pairsOf(q).map(([x, y]) => `${x} × ${y} (${y - x})`);
      return ex(
        `Another puzzle: numbers that multiply to ${q}, the second ${d} more than the first. Pairs of ${q}: ${rows.join(", ")}. Only ${a} and ${hi} differ by ${d}.`,
        `Otro reto: números que al multiplicarse dan ${q}, el segundo ${d} más que el primero. Pares de ${q}: ${rows.join(", ")}. Solo ${a} y ${hi} difieren en ${d}.`,
        [q, d, a, hi, ...pairsOf(q).flat(), ...pairsOf(q).map(([x, y]) => y - x)],
      );
    }
    const rows = list.map(([x, y]) => `${x} × ${y} (${x + y})`);
    return ex(
      `Another puzzle: numbers that multiply to ${p} and add to ${a + b}. Pairs of ${p}: ${rows.join(", ")}. Only ${a} and ${b} add to ${a + b}.`,
      `Otro reto: números que al multiplicarse dan ${p} y al sumarse dan ${a + b}. Pares de ${p}: ${rows.join(", ")}. Solo ${a} y ${b} suman ${a + b}.`,
      [p, a + b, a, b, ...list.flat(), ...list.map(([x, y]) => x + y)],
    );
  },
  "target-ops": (rng) => {
    const a = int(rng, 2, 6);
    const b = int(rng, 2, 6);
    const c = int(rng, 2, 6);
    return ex(
      `Another puzzle: with ${a}, ${b} and ${c}, plus and times, ${a} + ${b} × ${c} follows the order of operations: ${b} × ${c} = ${b * c} first, then ${a} + ${b * c} = ${a + b * c}.`,
      `Otro reto: con ${a}, ${b} y ${c}, suma y multiplicación, ${a} + ${b} × ${c} sigue el orden de las operaciones: primero ${b} × ${c} = ${b * c}, luego ${a} + ${b * c} = ${a + b * c}.`,
      [a, b, c, b * c, a + b * c],
    );
  },
  "equal-forms": (rng) => {
    const [n, d] = pick(rng, [
      [3, 5],
      [1, 4],
      [7, 10],
      [2, 5],
      [3, 20],
      [9, 10],
      [1, 8],
    ]);
    const dec = n / d;
    const pct = (n * 100) / d;
    return ex(
      `For example, ${n}/${d} means ${n} ÷ ${d} = ${dec}, and as a percent that is ${pct}%.`,
      `Por ejemplo, ${n}/${d} significa ${n} ÷ ${d} = ${dec}, y como porcentaje es ${pct}%.`,
      [n, d, dec, pct],
    );
  },
  "scale-onestep": (rng, round) => {
    const x = int(rng, 2, 9);
    const a = int(rng, 2, 6);
    if (round.eq.l.x > 1 || round.eq.r.x > 1) {
      return ex(
        `Another scale: ${a}x = ${a * x}. Split both pans into ${a} equal groups: a single x-box balances ${x}.`,
        `Otra balanza: ${a}x = ${a * x}. Divide ambos platillos en ${a} grupos iguales: una sola caja x equilibra ${x}.`,
        [a, a * x, x],
      );
    }
    return ex(
      `Another scale: x + ${a} = ${x + a}. Take ${a} off both pans: x is ${x}.`,
      `Otra balanza: x + ${a} = ${x + a}. Quita ${a} de ambos platillos: x es ${x}.`,
      [a, x + a, x],
    );
  },
  "inequality-scale": (rng, round) => {
    const a = int(rng, 2, 8);
    const e = int(rng, 3, 9);
    const heavier = round.scales[0].rel === ">";
    return ex(
      `Example: a pan with x + ${a} against ${e + a}. They are exactly equal when x = ${e}, because ${e} + ${a} = ${e + a}. For the left pan to be ${heavier ? "heavier" : "lighter"}, x must be ${heavier ? "more" : "less"} than ${e}.`,
      `Ejemplo: un platillo con x + ${a} contra ${e + a}. Son exactamente iguales cuando x = ${e}, porque ${e} + ${a} = ${e + a}. Para que el platillo izquierdo pese ${heavier ? "más" : "menos"}, x debe ser ${heavier ? "mayor" : "menor"} que ${e}.`,
      [a, e + a, e],
    );
  },
  "scale-twostep": (rng) => {
    const a = int(rng, 2, 5);
    const b = int(rng, 1, 9);
    const x = int(rng, 2, 9);
    return ex(
      `Another scale: ${a}x + ${b} = ${a * x + b}. Take ${b} off both pans: ${a}x = ${a * x}. Split into ${a} groups: x = ${x}.`,
      `Otra balanza: ${a}x + ${b} = ${a * x + b}. Quita ${b} de ambos platillos: ${a}x = ${a * x}. Divide en ${a} grupos: x = ${x}.`,
      [a, b, a * x + b, a * x, x],
    );
  },
  "equiv-expr": (rng) => {
    const a = int(rng, 2, 5);
    const b = int(rng, 2, 7);
    return ex(
      `Example: ${a}(x + ${b}) means ${a} groups of x and ${a} groups of ${b}, so it equals ${a}x + ${a * b}.`,
      `Ejemplo: ${a}(x + ${b}) significa ${a} grupos de x y ${a} grupos de ${b}, así que es igual a ${a}x + ${a * b}.`,
      [a, b, a * b],
    );
  },
  "scale-system": (rng) => {
    const x = int(rng, 2, 9);
    const y = int(rng, 2, 9);
    return ex(
      `Example: cube + ball = ${x + y} and cube + 2 balls = ${x + 2 * y}. The second scale has an extra ball and ${y} more weight, so a ball weighs ${y}. Then the cube weighs ${x + y} − ${y} = ${x}.`,
      `Ejemplo: cubo + pelota = ${x + y} y cubo + 2 pelotas = ${x + 2 * y}. La segunda balanza tiene una pelota de más y ${y} de peso extra, así que una pelota pesa ${y}. Entonces el cubo pesa ${x + y} − ${y} = ${x}.`,
      [x + y, x + 2 * y, y, x, 2],
    );
  },
  "scale-both-sides": (rng) => {
    const a = int(rng, 3, 4);
    const b = int(rng, 1, 6);
    const x = int(rng, 2, 8);
    const d = b + (a - 1) * x;
    return ex(
      `Another scale: ${a}x + ${b} = x + ${d}. Take x off both pans: ${a - 1}x + ${b} = ${d}. Take ${b} off both: ${a - 1}x = ${d - b}. Split into ${a - 1} groups: x = ${x}.`,
      `Otra balanza: ${a}x + ${b} = x + ${d}. Quita x de ambos platillos: ${a - 1}x + ${b} = ${d}. Quita ${b} de ambos: ${a - 1}x = ${d - b}. Divide en ${a - 1} grupos: x = ${x}.`,
      [a, b, d, a - 1, d - b, x],
    );
  },
  "pythag-squares": (rng) => {
    const [a, b, c] = pick(rng, PY);
    return ex(
      `Example: squares with sides ${a} and ${b} have areas ${a * a} and ${b * b}. ${a * a} + ${b * b} = ${c * c}, and a square with side ${c} has area ${c * c}.`,
      `Ejemplo: los cuadrados de lados ${a} y ${b} tienen áreas ${a * a} y ${b * b}. ${a * a} + ${b * b} = ${c * c}, y un cuadrado de lado ${c} tiene área ${c * c}.`,
      [a, b, c, a * a, b * b, c * c],
    );
  },
};

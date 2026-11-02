// Game families 1-5: Number Quest, Fraction Factory, Multiplication Arena, Decimal Dash, Ratio Architect.
// Every challenge is generated from exact mathematics, carries targeted feedback for the mistakes students really make,
// and has a three-rung hint ladder whose first two rungs never state the answer.
import { bi } from "./engine-core.js";
import { R, Rational } from "./rational.js";
import { build, choice, numeric, registerFamily } from "./game-engine.js";

const T = (en, es = en) => bi(en, es);
const nameOf = (n) => (Number.isInteger(n) ? String(n) : n.toString());
const dec = (r, p = 2) =>
  r
    .toDecimal(p)
    .replace(/(\.\d*?)0+$/, "$1")
    .replace(/\.$/, "");
const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

// ============================================================ 1. Number Quest (Grades 1-8)
const nqSkill = (grade) =>
  grade <= 1
    ? "1:make-10"
    : grade === 2
      ? "2:place-1000"
      : grade <= 5
        ? "3:round"
        : grade === 6
          ? "6:integers"
          : "7:integer-add";
registerFamily({
  id: "numberQuest",
  title: T("Number Quest", "Búsqueda numérica"),
  blurb: T(
    "Solve number challenges, unlock tools and move through the stages.",
    "Resuelve desafíos con números, desbloquea herramientas y avanza por las etapas.",
  ),
  grades: [1, 2, 3, 4, 5, 6, 7, 8],
  startLevel: (g) => (g <= 2 ? 0 : 1),
  tools: ["tenFrame", "numberLine", "baseTen", "integerChips"],
  make(rng, { grade, level }) {
    const band = grade <= 2 ? "A" : grade <= 5 ? "B" : "C";
    const types = {
      A: ["makeTen", "missing", "compare"],
      B: ["place", "hop", "round"],
      C: ["chips", "integer", "line"],
    }[band];
    const type = types[rng.int(0, types.length - 1)];
    if (type === "makeTen") {
      const frames = level === 2 ? 2 : 1;
      const cap = frames * 10;
      const start = frames === 2 ? rng.int(11, 17) : rng.int(2, 8);
      return build({
        id: `nq:ten:${frames}:${start}`,
        concept: "make-ten",
        skill: "1:make-10",
        level,
        model: "tenFrame",
        params: { frames, start },
        prompt: T(
          `The frame has ${start} counters. Fill it to make ${cap}.`,
          `El cuadro tiene ${start} fichas. Llénalo para formar ${cap}.`,
        ),
        goal: (e) => e.state.filled === cap,
        solution: Array.from({ length: cap - start }, () => ({ type: "add" })),
        hints: [
          T("Count the empty spaces.", "Cuenta los espacios vacíos."),
          T(
            "Each counter fills one empty space.",
            "Cada ficha llena un espacio vacío.",
          ),
          T(
            "Add counters one at a time and watch the spaces.",
            "Agrega fichas una por una y mira los espacios.",
          ),
        ],
        repr: { model: "tenFrame", params: { frames, start } },
        explanation: T(
          `${cap} − ${start} = ${cap - start}, so ${cap - start} more counters.`,
          `${cap} − ${start} = ${cap - start}, así que faltan ${cap - start} fichas.`,
        ),
      });
    }
    if (type === "missing") {
      const total = rng.int(6, level === 2 ? 20 : 10);
      const a = rng.int(1, total - 2);
      return numeric({
        id: `nq:miss:${a}:${total}`,
        concept: "missing-addend",
        skill: "1:missing-addend",
        level,
        prompt: T(
          `${a} + □ = ${total}. What goes in the box?`,
          `${a} + □ = ${total}. ¿Qué va en el cuadro?`,
        ),
        answer: R(total - a),
        distractors: [
          {
            value: String(a + total),
            why: T(
              "That adds the two numbers. The total is already given; find the missing part.",
              "Eso suma los dos números. El total ya está dado; halla la parte que falta.",
            ),
          },
        ],
        hints: [
          T(
            "The box is the other part of the total.",
            "El cuadro es la otra parte del total.",
          ),
          T(
            "Think of a number bond: one part and the whole.",
            "Piensa en un enlace numérico: una parte y el total.",
          ),
          T(
            `How many more than ${a} make ${total}?`,
            `¿Cuántos más que ${a} forman ${total}?`,
          ),
        ],
        repr: { model: "numberBond", params: { whole: total, start: a } },
        explanation: T(
          `${total} − ${a} = ${total - a}.`,
          `${total} − ${a} = ${total - a}.`,
        ),
      });
    }
    if (type === "compare") {
      const hi = level === 0 ? 20 : 100;
      let x = rng.int(10, hi);
      let y = rng.int(10, hi);
      while (Math.floor(x / 10) === Math.floor(y / 10) || x === y)
        y = rng.int(10, hi);
      const big = Math.max(x, y);
      return choice(rng, {
        id: `nq:cmp:${x}:${y}`,
        concept: "compare",
        skill: "1:compare-100",
        level,
        prompt: T(
          `Which number is greater, ${x} or ${y}?`,
          `¿Cuál número es mayor, ${x} o ${y}?`,
        ),
        options: [
          {
            text: T(String(x)),
            ok: x === big,
            why:
              x === big
                ? undefined
                : T(
                    "Look at the tens first: more tens means a greater number.",
                    "Mira primero las decenas: más decenas significa un número mayor.",
                  ),
          },
          {
            text: T(String(y)),
            ok: y === big,
            why:
              y === big
                ? undefined
                : T(
                    "Look at the tens first: more tens means a greater number.",
                    "Mira primero las decenas: más decenas significa un número mayor.",
                  ),
          },
        ],
        hints: [
          T(
            "Compare the tens digits first.",
            "Compara primero los dígitos de las decenas.",
          ),
          T(
            "Picture each number as tens rods and ones.",
            "Imagina cada número con barras de decenas y unidades.",
          ),
          T(
            "The number with more tens is greater.",
            "El número con más decenas es mayor.",
          ),
        ],
        repr: { model: "baseTen", params: { value: big } },
        explanation: T(`${big} has more tens.`, `${big} tiene más decenas.`),
      });
    }
    if (type === "place") {
      const digits = level === 2 ? 4 : 3;
      const n = rng.int(10 ** (digits - 1), 10 ** digits - 1);
      const place = rng.int(0, digits - 1);
      const ds = String(n).split("").reverse().map(Number);
      if (ds[place] === 0) return this.make(rng, { grade, level });
      const names = ["ones", "tens", "hundreds", "thousands"];
      const namesEs = ["unidades", "decenas", "centenas", "millares"];
      return numeric({
        id: `nq:pv:${n}:${place}`,
        concept: "place-value",
        skill: grade <= 2 ? "2:place-1000" : "2:place-1000",
        level,
        prompt: T(
          `What is the value of the digit in the ${names[place]} place of ${n.toLocaleString("en-US")}?`,
          `¿Cuál es el valor del dígito en el lugar de las ${namesEs[place]} de ${n.toLocaleString("en-US")}?`,
        ),
        answer: R(ds[place] * 10 ** place),
        distractors: place
          ? [
              {
                value: String(ds[place]),
                why: T(
                  "That is the digit, not its value. The value depends on the place.",
                  "Ese es el dígito, no su valor. El valor depende del lugar.",
                ),
              },
            ]
          : [],
        hints: [
          T(
            "Find the digit in that place first.",
            "Primero halla el dígito en ese lugar.",
          ),
          T(
            "A digit's value is the digit times its place value.",
            "El valor de un dígito es el dígito por el valor de su lugar.",
          ),
          T(
            `The ${names[place]} place is worth ${10 ** place} each.`,
            `Cada ${namesEs[place].replace(/s$/, "")} vale ${10 ** place}.`,
          ),
        ],
        repr: { model: "baseTen", params: { value: Math.min(999, n % 1000) } },
        explanation: T(
          `${ds[place]} × ${10 ** place} = ${ds[place] * 10 ** place}.`,
          `${ds[place]} × ${10 ** place} = ${ds[place] * 10 ** place}.`,
        ),
      });
    }
    if (type === "hop") {
      const step = level === 0 ? 5 : level === 1 ? 10 : 25;
      const k = rng.int(3, 8);
      const target = step * k;
      return build({
        id: `nq:hop:${step}:${k}`,
        concept: "skip-count",
        skill: "2:skip-count",
        level,
        model: "numberLine",
        params: { min: 0, max: Math.max(100, target), step, start: 0 },
        prompt: T(
          `Hop by ${step}s from 0 and land on ${target}.`,
          `Salta de ${step} en ${step} desde 0 y cae en ${target}.`,
        ),
        goal: (e) => e.derive().facts.end.eq(R(target)),
        solution: Array.from({ length: k }, () => ({
          type: "hop",
          by: String(step),
        })),
        hints: [
          T("Each hop is the same size.", "Cada salto es del mismo tamaño."),
          T(
            `How many ${step}s make ${target}?`,
            `¿Cuántos ${step} forman ${target}?`,
          ),
          T(
            "Press the hop button and count the hops.",
            "Presiona el botón de salto y cuenta los saltos.",
          ),
        ],
        explanation: T(
          `${k} hops of ${step} make ${target}.`,
          `${k} saltos de ${step} forman ${target}.`,
        ),
      });
    }
    if (type === "round") {
      const unit = level === 0 ? 10 : 100;
      const n = rng.int(level === 0 ? 11 : 110, level === 2 ? 999 : 499);
      const up = Math.round(n / unit + 1e-9) * unit;
      const down = Math.floor(n / unit) * unit;
      const correct = n % unit >= unit / 2 ? down + unit : down;
      return numeric({
        id: `nq:round:${n}:${unit}`,
        concept: "rounding",
        skill: "3:round",
        level,
        prompt: T(
          `Round ${n} to the nearest ${unit === 10 ? "ten" : "hundred"}.`,
          `Redondea ${n} a la ${unit === 10 ? "decena" : "centena"} más cercana.`,
        ),
        answer: R(correct),
        distractors:
          correct !== down
            ? [
                {
                  value: String(down),
                  why: T(
                    "That rounds down. Check which benchmark is closer.",
                    "Eso redondea hacia abajo. Comprueba cuál valor de referencia está más cerca.",
                  ),
                },
              ]
            : [],
        hints: [
          T(
            "Find the two benchmarks the number sits between.",
            "Halla los dos valores de referencia entre los que está el número.",
          ),
          T(
            "Which one is it closer to? Halfway rounds up.",
            "¿A cuál está más cerca? En la mitad se redondea hacia arriba.",
          ),
          T(
            `${down} and ${down + unit} are the benchmarks.`,
            `${down} y ${down + unit} son los valores de referencia.`,
          ),
        ],
        repr: {
          model: "numberLine",
          params: { min: down, max: down + unit, step: unit / 10, start: down },
        },
        explanation: T(
          `${n} is ${n - down} from ${down} and ${down + unit - n} from ${down + unit}.`,
          `${n} está a ${n - down} de ${down} y a ${down + unit - n} de ${down + unit}.`,
        ),
      });
    }
    if (type === "chips") {
      const a = rng.int(-6, 6);
      let b = rng.int(1, 7) * (rng.int(0, 1) ? 1 : -1);
      const sub = rng.int(0, 1) === 1 && grade >= 7;
      const target = sub ? a - b : a + b;
      const solution = [];
      const pos = Math.max(0, a);
      const neg = Math.max(0, -a);
      let p = pos;
      let n = neg;
      if (sub) {
        // a − b: take away b (positive: remove + chips, adding zero pairs as needed; negative: remove − chips).
        const sign = b > 0 ? "+" : "-";
        const have = b > 0 ? p : n;
        for (let i = 0; i < Math.max(0, Math.abs(b) - have); i += 1) {
          solution.push({ type: "addZero" });
          p += 1;
          n += 1;
        }
        for (let i = 0; i < Math.abs(b); i += 1)
          solution.push({ type: "remove", sign });
      } else {
        for (let i = 0; i < Math.abs(b); i += 1)
          solution.push({ type: "add", sign: b > 0 ? "+" : "-" });
      }
      return build({
        id: `nq:chips:${a}:${sub ? "-" : "+"}:${b}`,
        concept: "integer-chips",
        skill: grade === 6 ? "6:integers" : "7:integer-add",
        level,
        model: "integerChips",
        params: { a },
        prompt: T(
          `Start with ${a} on the chips and show ${a} ${sub ? "−" : "+"} (${b}) so the chips' value is the answer.`,
          `Empieza con ${a} en las fichas y muestra ${a} ${sub ? "−" : "+"} (${b}) para que el valor de las fichas sea la respuesta.`,
        ),
        goal: (e) => e.derive().facts.net === target && e.log.length > 0,
        solution,
        hints: [
          T(
            "Positive and negative chips cancel in pairs.",
            "Las fichas positivas y negativas se cancelan en pares.",
          ),
          T(
            "A zero pair adds nothing, so it can help you take something away.",
            "Un par cero no suma nada, así que puede ayudarte a quitar algo.",
          ),
          T(
            sub
              ? "To subtract, take chips away. Add zero pairs first if you need more to take."
              : "To add, put chips on.",
            sub
              ? "Para restar, quita fichas. Agrega pares cero primero si necesitas más para quitar."
              : "Para sumar, pon fichas.",
          ),
        ],
        repr: { model: "integerChips", params: { a } },
        explanation: T(
          `${a} ${sub ? "−" : "+"} (${b}) = ${target}.`,
          `${a} ${sub ? "−" : "+"} (${b}) = ${target}.`,
        ),
      });
    }
    if (type === "integer") {
      let a = rng.int(-9, 9);
      let b = rng.int(-9, 9);
      if (b === 0) b = 3;
      const sub = grade >= 7 && rng.int(0, 1) === 1;
      const ans = sub ? a - b : a + b;
      const bTxt = b < 0 ? `(${b})` : String(b);
      return numeric({
        id: `nq:int:${a}:${sub ? "-" : "+"}:${b}`,
        concept: "integer-ops",
        skill: grade === 6 ? "6:integers" : "7:integer-add",
        level,
        prompt: T(`${a} ${sub ? "−" : "+"} ${bTxt} = ?`),
        answer: R(ans),
        distractors:
          ans !== 0
            ? [
                {
                  value: String(-ans),
                  why: T(
                    "The size is right but the sign is flipped. Which number is farther from zero?",
                    "El tamaño es correcto pero el signo está al revés. ¿Qué número está más lejos de cero?",
                  ),
                },
              ]
            : [],
        hints: [
          T("Picture a number line.", "Imagina una recta numérica."),
          T(
            sub
              ? "Subtracting a number is adding its opposite."
              : "Move right for positive, left for negative.",
            sub
              ? "Restar un número es sumar su opuesto."
              : "Muévete a la derecha para positivos y a la izquierda para negativos.",
          ),
          T(
            `Start at ${a} and move ${sub ? -b : b}.`,
            `Empieza en ${a} y muévete ${sub ? -b : b}.`,
          ),
        ],
        repr: {
          model: "numberLine",
          params: { min: -20, max: 20, step: 1, start: a },
        },
        explanation: T(
          `${a} ${sub ? "−" : "+"} ${bTxt} = ${ans}.`,
          `${a} ${sub ? "−" : "+"} ${bTxt} = ${ans}.`,
        ),
      });
    }
    // type === "line": hop to a negative target on a number line
    const start = rng.int(-6, 4);
    const target = rng.int(-8, 8);
    if (start === target) return this.make(rng, { grade, level });
    const dir = target > start ? 1 : -1;
    return build({
      id: `nq:line:${start}:${target}`,
      concept: "number-line-integers",
      skill: "6:integers",
      level,
      model: "numberLine",
      params: { min: -10, max: 10, step: 1, start },
      prompt: T(
        `Start at ${start}. Hop on the number line to land on ${target}.`,
        `Empieza en ${start}. Salta por la recta numérica para caer en ${target}.`,
      ),
      goal: (e) => e.derive().facts.end.eq(R(target)),
      solution: Array.from({ length: Math.abs(target - start) }, () => ({
        type: "hop",
        by: String(dir),
      })),
      hints: [
        T(
          "Right is greater, left is less.",
          "La derecha es mayor, la izquierda es menor.",
        ),
        T(
          `How far is it from ${start} to ${target}?`,
          `¿Qué tan lejos está ${start} de ${target}?`,
        ),
        T("Hop one step at a time.", "Salta un paso a la vez."),
      ],
      explanation: T(
        `${target} − ${start} = ${target - start}.`,
        `${target} − ${start} = ${target - start}.`,
      ),
    });
  },
});

// ============================================================ 2. Fraction Factory (Grades 3-8)
registerFamily({
  id: "fractionFactory",
  title: T("Fraction Factory", "Fábrica de fracciones"),
  blurb: T(
    "Build, compare, simplify and combine fractions with bars and circles.",
    "Construye, compara, simplifica y combina fracciones con barras y círculos.",
  ),
  grades: [3, 4, 5, 6, 7, 8],
  startLevel: () => 0,
  make(rng, { grade, level }) {
    const dens = [
      [2, 4],
      [3, 4, 5, 6, 8],
      [8, 10, 12],
    ][level];
    const types =
      level === 0
        ? ["shade", "compare"]
        : level === 1
          ? ["shade", "equiv", "compare"]
          : grade >= 5
            ? ["equiv", "compare", "addsub"]
            : ["equiv", "compare"];
    const type = types[rng.int(0, types.length - 1)];
    const skill = grade <= 3 ? "3:fraction-equivalence" : "4:fraction-equiv";
    if (type === "shade") {
      const d = dens[rng.int(0, dens.length - 1)];
      const n = rng.int(1, d - 1);
      return build({
        id: `ff:shade:${n}/${d}`,
        concept: "fraction-build",
        skill,
        level,
        model: "fractionBar",
        params: { n: 0, d },
        prompt: T(
          `Shade ${n}/${d} of the bar.`,
          `Sombrea ${n}/${d} de la barra.`,
        ),
        goal: (e) => e.state.n === n && e.state.d === d,
        solution: [{ type: "setNum", value: n }],
        hints: [
          T(
            "The bottom number says how many equal parts.",
            "El número de abajo dice cuántas partes iguales.",
          ),
          T(
            "The top number says how many to shade.",
            "El número de arriba dice cuántas sombrear.",
          ),
          T(
            `Shade ${n} of the ${d} parts.`,
            `Sombrea ${n} de las ${d} partes.`,
          ),
        ],
        repr: { model: "fractionBar", params: { n, d } },
        explanation: T(
          `${n} of ${d} equal parts is ${n}/${d}.`,
          `${n} de ${d} partes iguales es ${n}/${d}.`,
        ),
      });
    }
    if (type === "equiv") {
      const d = rng.pick([2, 3, 4, 5]);
      const n = rng.int(1, d - 1);
      const k = rng.pick(level === 2 ? [3, 4, 5] : [2, 3]);
      if (d * k > 48) return this.make(rng, { grade, level });
      return build({
        id: `ff:equiv:${n}/${d}x${k}`,
        concept: "fraction-equivalent",
        skill,
        level,
        model: "fractionBar",
        params: { n, d },
        prompt: T(
          `Cut every part so the whole is in ${d * k}ths, keeping the same amount as ${n}/${d}.`,
          `Corta cada parte para que el entero esté en ${d * k}avos, con la misma cantidad que ${n}/${d}.`,
        ),
        goal: (e) => e.state.d === d * k && e.state.n === n * k,
        solution: [{ type: "refine", by: k }],
        hints: [
          T(
            "Cutting every part into more pieces keeps the amount the same.",
            "Cortar cada parte en más pedazos mantiene la misma cantidad.",
          ),
          T(
            `How many pieces does each part become? ${d * k} ÷ ${d}.`,
            `¿En cuántos pedazos se parte cada una? ${d * k} ÷ ${d}.`,
          ),
          T(
            "Use the button that cuts every part.",
            "Usa el botón que corta cada parte.",
          ),
        ],
        repr: { model: "fractionWall", params: { n, d } },
        explanation: T(
          `× ${k} on the top and bottom: ${n * k}/${d * k}.`,
          `× ${k} arriba y abajo: ${n * k}/${d * k}.`,
        ),
      });
    }
    if (type === "compare") {
      let a = [rng.int(1, 5), rng.pick(dens)];
      let b = [rng.int(1, 5), rng.pick(dens)];
      a[0] = Math.min(a[0], a[1] - 1);
      b[0] = Math.min(b[0], b[1] - 1);
      const va = R(a[0], a[1]);
      const vb = R(b[0], b[1]);
      const rel = va.cmp(vb);
      if (rel === 0 && rng.int(0, 2)) return this.make(rng, { grade, level });
      const sym = rel < 0 ? "<" : rel > 0 ? ">" : "=";
      const byDen = a[1] > b[1] ? ">" : a[1] < b[1] ? "<" : "=";
      const opts = ["<", "=", ">"].map((s) => ({
        text: T(s),
        ok: s === sym,
        why:
          s !== sym && s === byDen
            ? T(
                "A bigger denominator means smaller pieces, so it does not make the fraction bigger.",
                "Un denominador mayor significa partes más pequeñas, así que no hace mayor a la fracción.",
              )
            : s !== sym
              ? T(
                  "Compare the sizes of the two shaded lengths.",
                  "Compara los tamaños de las dos longitudes sombreadas.",
                )
              : undefined,
      }));
      return choice(rng, {
        id: `ff:cmp:${a.join("/")}:${b.join("/")}`,
        concept: "fraction-compare",
        skill: grade <= 3 ? "3:fraction-compare" : "4:fraction-compare",
        level,
        prompt: T(
          `Choose the symbol: ${a[0]}/${a[1]} ___ ${b[0]}/${b[1]}`,
          `Elige el símbolo: ${a[0]}/${a[1]} ___ ${b[0]}/${b[1]}`,
        ),
        options: opts,
        hints: [
          T(
            "Think about how big each piece is.",
            "Piensa en qué tan grande es cada pedazo.",
          ),
          T(
            "Picture both fractions on bars of the same length.",
            "Imagina ambas fracciones en barras de la misma longitud.",
          ),
          T(
            "Or find a common denominator and compare the tops.",
            "O halla un denominador común y compara los numeradores.",
          ),
        ],
        repr: { model: "fractionWall", params: { n: a[0], d: a[1] } },
        explanation: T(`${va} ${sym} ${vb}.`, `${va} ${sym} ${vb}.`),
      });
    }
    // addsub (grade >= 5)
    const pairs = [
      [2, 3],
      [3, 4],
      [2, 5],
      [3, 6],
      [4, 6],
      [3, 5],
      [4, 5],
      [6, 8],
    ];
    const [d1, d2] = pairs[rng.int(0, pairs.length - 1)];
    const n1 = rng.int(1, d1 - 1);
    const n2 = rng.int(1, d2 - 1);
    const sub = rng.int(0, 1) === 1;
    const A = R(n1, d1);
    const B = R(n2, d2);
    let [x, y] = [A, B];
    let [xs, ys] = [
      [n1, d1],
      [n2, d2],
    ];
    if (sub && A.lt(B)) {
      [x, y] = [B, A];
      [xs, ys] = [
        [n2, d2],
        [n1, d1],
      ];
    }
    const ans = sub ? x.sub(y) : x.add(y);
    if (ans.isInteger() || ans.isZero())
      return this.make(rng, { grade, level });
    const wrongDen = sub ? xs[1] - ys[1] : xs[1] + ys[1];
    const wrong =
      wrongDen > 0 ? `${sub ? xs[0] - ys[0] : xs[0] + ys[0]}/${wrongDen}` : "";
    return numeric({
      id: `ff:add:${xs.join("/")}${sub ? "-" : "+"}${ys.join("/")}`,
      concept: "fraction-add",
      skill: grade >= 7 ? "7:fraction-ops" : "5:fraction-add",
      level,
      simplified: true,
      prompt: T(
        `${xs[0]}/${xs[1]} ${sub ? "−" : "+"} ${ys[0]}/${ys[1]} = ? (simplest form)`,
        `${xs[0]}/${xs[1]} ${sub ? "−" : "+"} ${ys[0]}/${ys[1]} = ? (forma más simple)`,
      ),
      answer: ans,
      distractors: wrong
        ? [
            {
              value: wrong,
              why: T(
                "That combines the numerators and the denominators. Cut both into the same size pieces first.",
                "Eso combina numeradores y denominadores. Primero corta ambas en pedazos del mismo tamaño.",
              ),
            },
          ]
        : [],
      hints: [
        T(
          "The pieces must be the same size before you combine them.",
          "Las partes deben ser del mismo tamaño antes de combinarlas.",
        ),
        T("Find a common denominator.", "Halla un denominador común."),
        T(
          "Rewrite both fractions, then combine only the numerators.",
          "Reescribe ambas fracciones y combina solo los numeradores.",
        ),
      ],
      repr: {
        model: "fractionOps",
        params: { a: xs, b: ys, op: sub ? "-" : "+" },
      },
      explanation: T(`The answer is ${ans}.`, `La respuesta es ${ans}.`),
    });
  },
});

// ============================================================ 3. Multiplication Arena (Grades 3-6)
registerFamily({
  id: "multiplicationArena",
  title: T("Multiplication Arena", "Arena de multiplicación"),
  blurb: T(
    "Arrays, equal groups, fact families and strategies for multiplying and dividing.",
    "Matrices, grupos iguales, familias de operaciones y estrategias para multiplicar y dividir.",
  ),
  grades: [3, 4, 5, 6],
  startLevel: () => 0,
  make(rng, { grade, level }) {
    const max = [5, 9, 12][level];
    const types = ["array", "fact", "family", "split", "divide"];
    const type = types[rng.int(0, types.length - 1)];
    const r = rng.int(2, max);
    const c = rng.int(2, max);
    const lessThan6 = Math.max(r, c) <= 5;
    const skill = lessThan6 ? "3:mul-0-5" : "3:mul-6-9";
    if (type === "array") {
      const p = r * c;
      return build({
        id: `ma:array:${p}:${r}`,
        concept: "array",
        skill,
        level,
        model: "array",
        params: { rows: 1, cols: 1 },
        prompt: T(
          `Build an array with ${p} counters and exactly ${r} rows.`,
          `Construye una matriz con ${p} fichas y exactamente ${r} filas.`,
        ),
        goal: (e) => e.state.rows === r && e.state.rows * e.state.cols === p,
        solution: [
          { type: "rows", value: r },
          { type: "cols", value: c },
        ],
        hints: [
          T(
            "Rows times the number in each row makes the total.",
            "Las filas por el número en cada fila dan el total.",
          ),
          T(
            `${p} counters shared equally into ${r} rows.`,
            `${p} fichas repartidas por igual en ${r} filas.`,
          ),
          T(
            "Set the rows first, then find how many go in each row.",
            "Fija primero las filas y luego halla cuántas van en cada fila.",
          ),
        ],
        repr: { model: "array", params: { rows: r, cols: c } },
        explanation: T(
          `${p} ÷ ${r} = ${c} in each row.`,
          `${p} ÷ ${r} = ${c} en cada fila.`,
        ),
      });
    }
    if (type === "fact") {
      return numeric({
        id: `ma:fact:${r}x${c}`,
        concept: "multiply-fact",
        skill,
        level,
        prompt: T(`${r} × ${c} = ?`),
        answer: R(r * c),
        distractors: [
          {
            value: String(r + c),
            why: T(
              "That adds the numbers. Multiplication counts equal groups.",
              "Eso suma los números. La multiplicación cuenta grupos iguales.",
            ),
          },
        ],
        hints: [
          T(`Think of ${r} groups of ${c}.`, `Piensa en ${r} grupos de ${c}.`),
          T(
            "Picture an array with that many rows and columns.",
            "Imagina una matriz con esas filas y columnas.",
          ),
          T(
            `Skip count by ${c}, ${r} times.`,
            `Cuenta de ${c} en ${c}, ${r} veces.`,
          ),
        ],
        repr: { model: "array", params: { rows: r, cols: c } },
        explanation: T(`${r} × ${c} = ${r * c}.`, `${r} × ${c} = ${r * c}.`),
      });
    }
    if (type === "family") {
      const p = r * c;
      const valid = [
        `${c} × ${r} = ${p}`,
        `${p} ÷ ${r} = ${c}`,
        `${p} ÷ ${c} = ${r}`,
      ];
      const invalid = r === c ? `${r} + ${c} = ${p}` : `${r} ÷ ${p} = ${c}`;
      if (r === c) return this.make(rng, { grade, level });
      const choose = [invalid, ...valid.slice(0, 3)];
      return choice(rng, {
        id: `ma:family:${r}x${c}`,
        concept: "fact-family",
        skill,
        level,
        prompt: T(
          `${r} × ${c} = ${p}. Which equation is NOT in this fact family?`,
          `${r} × ${c} = ${p}. ¿Cuál ecuación NO está en esta familia de operaciones?`,
        ),
        options: choose.map((t) => ({
          text: T(t),
          ok: t === invalid,
          why:
            t === invalid
              ? undefined
              : T(
                  "That one belongs to the family: it uses the same three numbers correctly.",
                  "Esa pertenece a la familia: usa los mismos tres números correctamente.",
                ),
        })),
        hints: [
          T(
            "A fact family uses the same three numbers.",
            "Una familia de operaciones usa los mismos tres números.",
          ),
          T(
            "Multiplication and division undo each other.",
            "La multiplicación y la división se deshacen entre sí.",
          ),
          T(
            "Check each equation: is it true?",
            "Comprueba cada ecuación: ¿es verdadera?",
          ),
        ],
        repr: { model: "factFamily", params: { op: "mul", a: r, b: c } },
        explanation: T(
          `${invalid} is not true.`,
          `${invalid} no es verdadera.`,
        ),
      });
    }
    if (type === "split") {
      const a = rng.int(13, level === 2 ? 49 : 29);
      const b = rng.int(3, 9);
      const tens = Math.floor(a / 10) * 10;
      if (tens === a) return this.make(rng, { grade, level });
      return build({
        id: `ma:split:${a}x${b}`,
        concept: "decompose",
        skill: "4:multiply-1digit",
        level,
        model: "areaMultiply",
        params: { a, b, unsplit: true },
        prompt: T(
          `To find ${a} × ${b}, split ${a} into tens and ones.`,
          `Para hallar ${a} × ${b}, parte ${a} en decenas y unidades.`,
        ),
        goal: (e) => e.state.splitA === tens,
        solution: [{ type: "splitA", value: tens }],
        hints: [
          T(
            "Break the number by place value.",
            "Separa el número por valor posicional.",
          ),
          T(
            `${a} is ${tens} and ${a - tens}.`,
            `${a} es ${tens} y ${a - tens}.`,
          ),
          T(
            "Move the split to the tens.",
            "Mueve la partición hasta las decenas.",
          ),
        ],
        repr: { model: "areaMultiply", params: { a, b, unsplit: true } },
        explanation: T(
          `${tens} × ${b} + ${a - tens} × ${b} = ${a * b}.`,
          `${tens} × ${b} + ${a - tens} × ${b} = ${a * b}.`,
        ),
      });
    }
    const dv = rng.int(2, max);
    const q = rng.int(2, max);
    return numeric({
      id: `ma:div:${dv * q}/${dv}`,
      concept: "divide-fact",
      skill: grade <= 3 ? "3:division-facts" : "4:division",
      level,
      prompt: T(`${dv * q} ÷ ${dv} = ?`),
      answer: R(q),
      distractors: [
        {
          value: String(dv * q * dv),
          why: T(
            "That multiplies. Division shares into equal groups, so the answer is smaller.",
            "Eso multiplica. Dividir reparte en grupos iguales, así que la respuesta es menor.",
          ),
        },
      ],
      hints: [
        T(
          "Think: what times the divisor makes the total?",
          "Piensa: ¿qué número por el divisor da el total?",
        ),
        T("Use a fact family.", "Usa una familia de operaciones."),
        T(
          `Share ${dv * q} into ${dv} equal groups.`,
          `Reparte ${dv * q} en ${dv} grupos iguales.`,
        ),
      ],
      repr: { model: "factFamily", params: { op: "mul", a: dv, b: q } },
      explanation: T(
        `${dv} × ${q} = ${dv * q}, so ${dv * q} ÷ ${dv} = ${q}.`,
        `${dv} × ${q} = ${dv * q}, así que ${dv * q} ÷ ${dv} = ${q}.`,
      ),
    });
  },
});

// ============================================================ 4. Decimal Dash (Grades 4-7)
registerFamily({
  id: "decimalDash",
  title: T("Decimal Dash", "Carrera decimal"),
  blurb: T(
    "Place value and decimal reasoning. A calm timer is optional and never needed.",
    "Valor posicional y razonamiento decimal. Un cronómetro tranquilo es opcional y nunca necesario.",
  ),
  grades: [4, 5, 6, 7],
  optionalTimer: true,
  startLevel: () => 0,
  make(rng, { grade, level }) {
    const type = rng.pick(
      grade >= 5
        ? ["compare", "grid", "add", "digit", "multiply"]
        : ["compare", "grid", "digit"],
    );
    if (type === "compare") {
      const t1 = rng.int(1, 8);
      const t2 = rng.int(t1 + 1, 9);
      const h = rng.int(1, 9);
      const x = `0.${t1}${h}`;
      const y = `0.${t2}`;
      return choice(rng, {
        id: `dd:cmp:${x}:${y}`,
        concept: "decimal-compare",
        skill: "5:decimal-place",
        level,
        prompt: T(
          `Which is greater, ${x} or ${y}?`,
          `¿Cuál es mayor, ${x} o ${y}?`,
        ),
        options: [
          { text: T(y), ok: true },
          {
            text: T(x),
            ok: false,
            why: T(
              "More digits does not mean greater. Compare the tenths first: it has fewer tenths.",
              "Más dígitos no significa mayor. Compara primero las décimas: tiene menos décimas.",
            ),
          },
        ],
        hints: [
          T(
            "Compare place by place, starting at the tenths.",
            "Compara lugar por lugar, empezando por las décimas.",
          ),
          T(
            "Shade both on a decimal grid.",
            "Sombrea ambos en una cuadrícula decimal.",
          ),
          T(
            `${y} is ${t2} tenths; ${x} is ${t1} tenths and some hundredths.`,
            `${y} son ${t2} décimas; ${x} son ${t1} décimas y algunas centésimas.`,
          ),
        ],
        repr: { model: "decimalGrid", params: { k1: t2 * 10, k2: 0 } },
        explanation: T(`${y} > ${x}.`, `${y} > ${x}.`),
      });
    }
    if (type === "grid") {
      const k = level === 0 ? rng.int(1, 9) * 10 : rng.int(11, 95);
      return build({
        id: `dd:grid:${k}`,
        concept: "decimal-grid",
        skill: "5:decimal-place",
        level,
        model: "decimalGrid",
        params: { two: false, k1: 0, k2: 0 },
        prompt: T(
          `Shade ${(k / 100).toFixed(2).replace(/0$/, "")} of the grid.`,
          `Sombrea ${(k / 100).toFixed(2).replace(/0$/, "")} de la cuadrícula.`,
        ),
        goal: (e) => e.state.k1 === k,
        solution: [{ type: "set1", value: k }],
        hints: [
          T(
            "The whole grid is 1. Each square is one hundredth.",
            "Toda la cuadrícula es 1. Cada cuadro es una centésima.",
          ),
          T(
            "A column of ten squares is one tenth.",
            "Una columna de diez cuadros es una décima.",
          ),
          T(`Shade ${k} squares.`, `Sombrea ${k} cuadros.`),
        ],
        explanation: T(
          `${k}/100 = ${(k / 100).toFixed(2)}.`,
          `${k}/100 = ${(k / 100).toFixed(2)}.`,
        ),
      });
    }
    if (type === "add") {
      const a = rng.int(11, 99) / 10;
      const b = rng.int(101, 999) / 100;
      const A = Rational.of(String(a));
      const B = Rational.of(String(b));
      const sum = A.add(B);
      const x = Number(String(a).replace(".", ""));
      const y = Number(String(b).replace(".", ""));
      const wrong = R(x + y, 100);
      return numeric({
        id: `dd:add:${a}+${b}`,
        concept: "decimal-add",
        skill: "5:decimal-add",
        level,
        prompt: T(`${a} + ${b} = ?`),
        answer: sum,
        distractors: !wrong.eq(sum)
          ? [
              {
                value: dec(wrong, 2),
                why: T(
                  "The digits were lined up on the right. Line up the decimal points instead.",
                  "Los dígitos se alinearon a la derecha. Alinea los puntos decimales.",
                ),
              },
            ]
          : [],
        hints: [
          T(
            "Add tenths to tenths and hundredths to hundredths.",
            "Suma décimas con décimas y centésimas con centésimas.",
          ),
          T("Line up the decimal points.", "Alinea los puntos decimales."),
          T(
            `Write ${a} as ${a.toFixed(2)}.`,
            `Escribe ${a} como ${a.toFixed(2)}.`,
          ),
        ],
        repr: {
          model: "decimalGrid",
          params: {
            two: true,
            k1:
              Math.round(a * 10) * 10 > 100
                ? 90
                : (Math.round(a * 10) * 10) % 100,
            k2: 0,
          },
        },
        explanation: T(
          `${a} + ${b} = ${dec(sum, 2)}.`,
          `${a} + ${b} = ${dec(sum, 2)}.`,
        ),
      });
    }
    if (type === "digit") {
      const n = `${rng.int(1, 9)}.${rng.int(1, 9)}${rng.int(1, 9)}${rng.int(1, 9)}`;
      const place = rng.int(1, 3);
      const names = ["tenths", "hundredths", "thousandths"];
      const namesEs = ["décimas", "centésimas", "milésimas"];
      return numeric({
        id: `dd:digit:${n}:${place}`,
        concept: "decimal-place",
        skill: "5:decimal-place",
        level,
        prompt: T(
          `What digit is in the ${names[place - 1]} place of ${n}?`,
          `¿Qué dígito está en el lugar de las ${namesEs[place - 1]} de ${n}?`,
        ),
        answer: R(Number(n.split(".")[1][place - 1])),
        hints: [
          T(
            "The first place after the point is tenths.",
            "El primer lugar después del punto son las décimas.",
          ),
          T(
            "Then hundredths, then thousandths.",
            "Luego centésimas y luego milésimas.",
          ),
          T(
            `Count ${place} place${place > 1 ? "s" : ""} to the right of the point.`,
            `Cuenta ${place} lugar${place > 1 ? "es" : ""} a la derecha del punto.`,
          ),
        ],
        explanation: T(
          `The ${names[place - 1]} digit is ${n.split(".")[1][place - 1]}.`,
          `El dígito de las ${namesEs[place - 1]} es ${n.split(".")[1][place - 1]}.`,
        ),
      });
    }
    // multiply tenths
    const r1 = rng.int(2, 9);
    const c1 = rng.int(2, 9);
    const prod = R(r1 * c1, 100);
    return numeric({
      id: `dd:mul:${r1}x${c1}`,
      concept: "decimal-multiply",
      skill: "5:decimal-mul",
      level,
      prompt: T(`${(r1 / 10).toFixed(1)} × ${(c1 / 10).toFixed(1)} = ?`),
      answer: prod,
      distractors: [
        {
          value: dec(R(r1 * c1, 10), 1),
          why: T(
            "The decimal point is in the wrong place. Tenths of tenths are hundredths.",
            "El punto decimal está mal colocado. Décimas de décimas son centésimas.",
          ),
        },
      ],
      hints: [
        T(
          "Multiply 3 × 4 first, ignoring the points.",
          "Multiplica primero los números sin los puntos.",
        ),
        T(
          "Tenths times tenths gives hundredths.",
          "Décimas por décimas dan centésimas.",
        ),
        T(
          "Estimate: both numbers are less than 1, so the answer is less than either.",
          "Estima: ambos números son menores que 1, así que la respuesta es menor que cualquiera.",
        ),
      ],
      repr: { model: "decimalProduct", params: { r: r1, c: c1 } },
      explanation: T(
        `${r1} × ${c1} = ${r1 * c1} hundredths = ${dec(prod, 2)}.`,
        `${r1} × ${c1} = ${r1 * c1} centésimas = ${dec(prod, 2)}.`,
      ),
    });
  },
});

// ============================================================ 5. Ratio Architect (Grades 6-7)
registerFamily({
  id: "ratioArchitect",
  title: T("Ratio Architect", "Arquitecto de razones"),
  blurb: T(
    "Build matching ratios, complete double number lines and solve proportional problems.",
    "Construye razones equivalentes, completa dobles rectas numéricas y resuelve problemas proporcionales.",
  ),
  grades: [6, 7],
  startLevel: () => 0,
  make(rng, { grade, level }) {
    const type = rng.pick(
      grade >= 7
        ? ["build", "missing", "rate", "tables", "proportion"]
        : ["build", "missing", "rate", "tables"],
    );
    const a = rng.pick([2, 3, 4, 5]);
    const b = rng.pick([3, 5, 6, 7].filter((x) => x !== a));
    if (type === "build") {
      const k = rng.int(3, level === 2 ? 9 : 6);
      return build({
        id: `ra:build:${a}:${b}:${k}`,
        concept: "ratio-copies",
        skill: "6:ratios",
        level,
        model: "tapeRatio",
        params: {
          a,
          b,
          k: 1,
          names: ["first", "second"],
          short: ["1st", "2nd"],
        },
        prompt: T(
          `Make ${k} copies of the ratio ${a}:${b}.`,
          `Haz ${k} copias de la razón ${a}:${b}.`,
        ),
        goal: (e) => e.state.k === k,
        solution: [{ type: "scale", value: k }],
        hints: [
          T(
            "Each copy adds the same amounts.",
            "Cada copia agrega las mismas cantidades.",
          ),
          T(`${k} copies of ${a} and ${b}.`, `${k} copias de ${a} y ${b}.`),
          T(
            "Press the button that adds a copy.",
            "Presiona el botón que agrega una copia.",
          ),
        ],
        repr: { model: "tapeRatio", params: { a, b, k: 1 } },
        explanation: T(`${a * k}:${b * k}`, `${a * k}:${b * k}`),
      });
    }
    if (type === "missing") {
      const k = rng.int(2, level === 2 ? 9 : 6);
      const blank2 = rng.int(0, 1) === 1;
      const wrong = blank2 ? b + (a * k - a) : a + (b * k - b);
      const ans = blank2 ? b * k : a * k;
      return numeric({
        id: `ra:miss:${a}:${b}:${k}:${blank2 ? 2 : 1}`,
        concept: "equivalent-ratio",
        skill: "6:ratios",
        level,
        prompt: T(blank2 ? `${a}:${b} = ${a * k}:□` : `${a}:${b} = □:${b * k}`),
        answer: R(ans),
        distractors:
          wrong !== ans
            ? [
                {
                  value: String(wrong),
                  why: T(
                    "That adds the same amount to both numbers. Equal ratios multiply both numbers by the same factor.",
                    "Eso suma la misma cantidad a ambos números. Las razones iguales multiplican ambos números por el mismo factor.",
                  ),
                },
              ]
            : [],
        hints: [
          T(
            "Find what each number was multiplied by.",
            "Halla por cuánto se multiplicó cada número.",
          ),
          T(
            "Use a ratio table or a double number line.",
            "Usa una tabla de razones o una doble recta numérica.",
          ),
          T(
            `${blank2 ? a : b} became ${blank2 ? a * k : b * k}: that is × ${k}.`,
            `${blank2 ? a : b} se volvió ${blank2 ? a * k : b * k}: eso es × ${k}.`,
          ),
        ],
        repr: { model: "tapeRatio", params: { a, b, k } },
        explanation: T(`× ${k} on both sides.`, `× ${k} en ambos lados.`),
      });
    }
    if (type === "rate") {
      const hours = rng.int(2, 6);
      const miles =
        hours * rng.int(2, 9) + (level === 2 ? rng.int(1, hours - 1) : 0);
      const rate = R(miles, hours);
      return numeric({
        id: `ra:rate:${miles}/${hours}`,
        concept: "unit-rate",
        skill: grade >= 7 ? "7:unit-rate" : "6:unit-rates",
        level,
        simplified: true,
        prompt: T(
          `A car goes ${miles} miles in ${hours} hours. How many miles per hour? (fraction or whole number)`,
          `Un auto recorre ${miles} millas en ${hours} horas. ¿Cuántas millas por hora? (fracción o número entero)`,
        ),
        answer: rate,
        distractors: [
          {
            value: R(hours, miles).toString(),
            why: T(
              "That is hours per mile. Miles per hour has miles on top.",
              "Eso son horas por milla. Millas por hora tiene las millas arriba.",
            ),
          },
        ],
        hints: [
          T("A unit rate is for 1 hour.", "Una tasa unitaria es para 1 hora."),
          T(
            "Divide the miles by the hours.",
            "Divide las millas entre las horas.",
          ),
          T(
            "Use a double number line with miles above hours.",
            "Usa una doble recta numérica con millas arriba y horas abajo.",
          ),
        ],
        repr: {
          model: "tapeRatio",
          params: {
            a: hours,
            b: miles,
            k: 1,
            names: ["hours", "miles"],
            short: ["hrs", "mi"],
          },
        },
        explanation: T(
          `${miles} ÷ ${hours} = ${rate}.`,
          `${miles} ÷ ${hours} = ${rate}.`,
        ),
      });
    }
    if (type === "tables") {
      const k = rng.int(2, 4);
      const good = [1, 2, 3].map((i) => `(${a * i}, ${b * i})`).join(" ");
      const add1 = [1, 2, 3]
        .map((i) => `(${a + (i - 1) * k}, ${b + (i - 1) * k})`)
        .join(" ");
      const swap = [1, 2, 3]
        .map((i) => `(${a * i}, ${b * i + (i === 3 ? 1 : 0)})`)
        .join(" ");
      return choice(rng, {
        id: `ra:tables:${a}:${b}:${k}`,
        concept: "equal-ratio-tables",
        skill: "6:ratios",
        level,
        prompt: T(
          "Which table shows equal ratios?",
          "¿Qué tabla muestra razones iguales?",
        ),
        options: [
          { text: T(good), ok: true },
          {
            text: T(add1),
            ok: false,
            why: T(
              "These add the same amount each time. Equal ratios multiply.",
              "Estos suman la misma cantidad cada vez. Las razones iguales multiplican.",
            ),
          },
          {
            text: T(swap),
            ok: false,
            why: T("One pair breaks the pattern.", "Un par rompe el patrón."),
          },
        ],
        hints: [
          T(
            "In equal ratios, every pair has the same unit rate.",
            "En razones iguales, todos los pares tienen la misma tasa unitaria.",
          ),
          T(
            "Check whether each pair is a multiple of the first.",
            "Comprueba si cada par es un múltiplo del primero.",
          ),
          T(
            "Divide the second number by the first in each pair.",
            "Divide el segundo número entre el primero en cada par.",
          ),
        ],
        explanation: T(
          `Each pair is a multiple of ${a}:${b}.`,
          `Cada par es un múltiplo de ${a}:${b}.`,
        ),
      });
    }
    // proportion (grade 7)
    const k = rng.int(2, 8);
    const x = R(b * k);
    return numeric({
      id: `ra:prop:${a}/${b}:${a * k}`,
      concept: "proportion",
      skill: "7:proportions",
      level,
      prompt: T(
        `${a}/${b} = ${a * k}/x. Find x.`,
        `${a}/${b} = ${a * k}/x. Halla x.`,
      ),
      answer: x,
      distractors: [
        {
          value: String(b + (a * k - a)),
          why: T(
            "That adds instead of scaling. Find the factor from the tops, then use it on the bottoms.",
            "Eso suma en lugar de escalar. Halla el factor con los numeradores y úsalo en los denominadores.",
          ),
        },
      ],
      hints: [
        T(
          "Find the scale factor between the tops.",
          "Halla el factor de escala entre los numeradores.",
        ),
        T(`${a} × ${k} = ${a * k}.`, `${a} × ${k} = ${a * k}.`),
        T(
          `Multiply ${b} by the same factor.`,
          `Multiplica ${b} por el mismo factor.`,
        ),
      ],
      repr: { model: "tapeRatio", params: { a, b, k } },
      explanation: T(
        `x = ${b} × ${k} = ${b * k}.`,
        `x = ${b} × ${k} = ${b * k}.`,
      ),
    });
  },
});

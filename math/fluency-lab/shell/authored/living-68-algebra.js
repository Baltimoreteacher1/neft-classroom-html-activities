// Living models for expressions, equations, inequalities and functions (Grades 6–8). Every picture, table and
// equation line is computed from the same state in render(), so they cannot disagree.
import { L, fmt, livingModel, svg, table, text } from "./kit-68.js";

const Q1 = "var(--q1)";
const Q2 = "var(--q2)";
const Q3 = "var(--q3)";
const signed = (n) => (n < 0 ? `− ${Math.abs(n)}` : `+ ${n}`);
const term = (c, v = "x") =>
  c === 1 ? v : c === -1 ? `−${v}` : `${fmt(c)}${v}`;

// One-step equations on a balance. The state is the equation form, a (the number with x) and the solution x.
// "Do it to both sides" keeps the pans level; "only the left side" tips the scale to show why that is wrong.
export const balanceModel = livingModel({
  label: L("Change the equation", "Cambia la ecuación"),
  toggles: [
    {
      id: "form",
      label: L("Equation", "Ecuación"),
      value: "add",
      options: [
        { value: "add", label: L("x + a = b", "x + a = b") },
        { value: "mul", label: L("ax = b", "ax = b") },
      ],
    },
  ],
  sliders: [
    { id: "a", label: L("The number a", "El número a"), min: 1, max: 6, step: 1, value: 3 },
    {
      id: "x",
      label: L("Hidden value of x", "Valor oculto de x"),
      min: 1,
      max: 6,
      step: 1,
      value: 4,
    },
  ],
  buttons: [
    {
      id: "both",
      label: L("Undo a on BOTH sides", "Deshacer a en LOS DOS lados"),
      run: (s) => ((s.step = 1), (s.oneSide = false)),
    },
    {
      id: "left",
      label: L(
        "Undo a on the left side only",
        "Deshacer a solo en el lado izquierdo",
      ),
      run: (s) => ((s.step = 1), (s.oneSide = true)),
    },
    {
      id: "reset",
      label: L("Start again", "Empezar de nuevo"),
      run: (s) => ((s.step = 0), (s.oneSide = false)),
    },
  ],
  render(s, T) {
    s.step ??= 0;
    const add = s.form === "add";
    const b = add ? s.x + s.a : s.a * s.x;
    // What sits on each pan, in units: x-boxes count as their hidden value only for the weight.
    let left;
    let right;
    let leftDraw;
    let rightDraw;
    if (s.step === 0) {
      left = b;
      right = b;
      leftDraw = add ? { boxes: 1, units: s.a } : { boxes: s.a, units: 0 };
      rightDraw = { boxes: 0, units: b };
    } else if (!s.oneSide) {
      left = s.x;
      right = s.x;
      leftDraw = { boxes: 1, units: 0 };
      rightDraw = { boxes: 0, units: s.x };
    } else {
      left = s.x;
      right = b;
      leftDraw = { boxes: 1, units: 0 };
      rightDraw = { boxes: 0, units: b };
    }
    const tilt = Math.max(-10, Math.min(10, (right - left) * 1.5));
    // Each pan holds its contents in rows of six: x-boxes first, then unit counters.
    const pan = (cx, d) => {
      const items = [];
      const cells = [...Array(d.boxes).fill("x"), ...Array(d.units).fill("1")];
      cells.forEach((kind, k) => {
        const col = k % 6;
        const row = Math.floor(k / 6);
        const x = cx - 63 + col * 22;
        const y = -24 - row * 22;
        items.push(
          kind === "x"
            ? `<rect x="${x}" y="${y}" width="20" height="20" rx="3" fill="${Q1}"/><text x="${x + 10}" y="${y + 15}" style="font:700 15px var(--font);text-anchor:middle" fill="#fff">x</text>`
            : `<circle cx="${x + 10}" cy="${y + 10}" r="9" fill="${Q2}"/>`,
        );
      });
      return `<path d="M${cx - 64} 0 h128 l-12 10 h-104 z" fill="var(--ink-2)" opacity=".85"/>${items.join("")}`;
    };
    const pic = svg(
      330,
      200,
      T(
        L(
          `Balance: left pan holds ${leftDraw.boxes} x-box(es) and ${leftDraw.units} unit(s); right pan holds ${rightDraw.units} unit(s). ${left === right ? "The scale is level." : "The scale tips."}`,
          `Balanza: el platillo izquierdo tiene ${leftDraw.boxes} caja(s) x y ${leftDraw.units} unidad(es); el derecho tiene ${rightDraw.units} unidad(es). ${left === right ? "La balanza está nivelada." : "La balanza se inclina."}`,
        ),
      ),
      `<path d="M150 192 h30 l-15 -40 z" fill="var(--ink-2)"/>
       <g transform="rotate(${tilt} 165 152)"><line x1="25" y1="152" x2="305" y2="152" stroke="var(--ink-2)" stroke-width="5" stroke-linecap="round"/>
       <g transform="translate(0 142)">${pan(85, leftDraw)}${pan(245, rightDraw)}</g></g>
       ${left === right ? "" : text(165, 18, T(L("Not balanced", "No está en equilibrio")), 'fill="var(--wrong)"')}`,
    );
    const start = add ? `x + ${s.a} = ${b}` : `${s.a}x = ${b}`;
    let eq;
    if (s.step === 0)
      eq = T(
        L(
          `${start}. Which operation undoes the ${add ? `+ ${s.a}` : `× ${s.a}`}?`,
          `${start}. ¿Qué operación deshace el ${add ? `+ ${s.a}` : `× ${s.a}`}?`,
        ),
      );
    else if (!s.oneSide)
      eq = add
        ? T(
            L(
              `x + ${s.a} − ${s.a} = ${b} − ${s.a}, so x = ${s.x}. Still level. Check: ${s.x} + ${s.a} = ${b}.`,
              `x + ${s.a} − ${s.a} = ${b} − ${s.a}, así que x = ${s.x}. Sigue nivelada. Comprueba: ${s.x} + ${s.a} = ${b}.`,
            ),
          )
        : T(
            L(
              `${s.a}x ÷ ${s.a} = ${b} ÷ ${s.a}, so x = ${s.x}. Still level. Check: ${s.a} × ${s.x} = ${b}.`,
              `${s.a}x ÷ ${s.a} = ${b} ÷ ${s.a}, así que x = ${s.x}. Sigue nivelada. Comprueba: ${s.a} × ${s.x} = ${b}.`,
            ),
          );
    else
      eq = T(
        L(
          `Left: x. Right: still ${b}. x ≠ ${b} — changing one side only breaks the balance.`,
          `Izquierda: x. Derecha: sigue en ${b}. x ≠ ${b}: cambiar solo un lado rompe el equilibrio.`,
        ),
      );
    return { svg: pic, eq };
  },
  observed: (s) => s.step === 1 && !s.oneSide,
});

// Distributive property as area: a rectangle a tall and (x + b) wide, split into a·x and a·b. A test value of x
// makes both sides numbers; "only the first term" shows the mismatch.
export const expressionModel = livingModel({
  label: L("Change the expression", "Cambia la expresión"),
  sliders: [
    {
      id: "a",
      label: L("Outside factor a", "Factor de afuera a"),
      min: 2,
      max: 6,
      step: 1,
      value: 3,
    },
    {
      id: "b",
      label: L("Constant b", "Constante b"),
      min: 1,
      max: 6,
      step: 1,
      value: 4,
    },
    {
      id: "x",
      label: L("Test value of x", "Valor de prueba de x"),
      min: 1,
      max: 8,
      step: 1,
      value: 5,
    },
  ],
  toggles: [
    {
      id: "wrong",
      label: L("Distribute to", "Distribuir a"),
      value: false,
      options: [
        { value: false, label: L("Both terms", "Los dos términos") },
        { value: true, label: L("Only the x term", "Solo el término con x") },
      ],
    },
  ],
  render(s, T) {
    const u = Math.min(30, 290 / (s.x + s.b));
    const w1 = s.x * u;
    const w2 = s.b * u;
    const h = s.a * u;
    const pic = svg(
      330,
      h + 44,
      T(L(`Rectangle ${s.a} by (x + ${s.b}) split into ${s.a} by x and ${s.a} by ${s.b}.`, `Rectángulo de ${s.a} por (x + ${s.b}) dividido en ${s.a} por x y ${s.a} por ${s.b}.`)),
      `<rect x="30" y="26" width="${w1}" height="${h}" fill="${Q1}" fill-opacity=".25" stroke="var(--ink-2)" stroke-width="1.5"/>
       <rect x="${30 + w1}" y="26" width="${w2}" height="${h}" fill="${s.wrong ? "none" : Q2}" fill-opacity=".25" stroke="var(--ink-2)" stroke-width="1.5" ${s.wrong ? 'stroke-dasharray="5 4"' : ""}/>
       ${text(30 + w1 / 2, 18, `x = ${s.x}`, `fill="${Q1}"`)}${text(30 + w1 + w2 / 2, 18, String(s.b), `fill="${Q2}"`)}${text(16, 32 + h / 2, String(s.a))}
       ${text(30 + w1 / 2, 32 + h / 2, `${s.a}x`)}${text(30 + w1 + w2 / 2, 32 + h / 2, s.wrong ? "?" : String(s.a * s.b))}`,
    );
    const lhs = s.a * (s.x + s.b);
    const rhs = s.wrong ? s.a * s.x + s.b : s.a * s.x + s.a * s.b;
    const form = s.wrong ? `${s.a}x + ${s.b}` : `${s.a}x + ${s.a * s.b}`;
    const tab = table(T(L("Test x", "Probar x")), [
      ["x", `${s.a}(x + ${s.b})`, form],
      [String(s.x), String(lhs), String(rhs)],
    ]);
    const eq = s.wrong
      ? T(
          L(
            `${s.a}(x + ${s.b}) ≠ ${form}: at x = ${s.x} they give ${lhs} and ${rhs}. The ${s.b} was not multiplied.`,
            `${s.a}(x + ${s.b}) ≠ ${form}: con x = ${s.x} dan ${lhs} y ${rhs}. El ${s.b} no se multiplicó.`,
          ),
        )
      : T(
          L(
            `${s.a}(x + ${s.b}) = ${s.a}x + ${s.a * s.b}: at x = ${s.x} both give ${lhs}.`,
            `${s.a}(x + ${s.b}) = ${s.a}x + ${s.a * s.b}: con x = ${s.x} las dos dan ${lhs}.`,
          ),
        );
    return { svg: pic, table: tab, eq };
  },
});

// Inequalities on a number line: boundary, symbol, and a test value that is checked against the statement.
const SYMS = [">", "≥", "<", "≤"];
const holds = (v, op, n) =>
  ({ ">": v > n, "≥": v >= n, "<": v < n, "≤": v <= n })[op];
export const inequalityModel = livingModel({
  label: L("Change the inequality", "Cambia la desigualdad"),
  toggles: [
    {
      id: "op",
      label: L("Symbol", "Símbolo"),
      value: "≥",
      options: SYMS.map((o) => ({ value: o, label: L(o, o) })),
    },
  ],
  sliders: [
    {
      id: "n",
      label: L("Boundary", "Límite"),
      min: -5,
      max: 5,
      step: 1,
      value: 2,
    },
    {
      id: "t",
      label: L("Test a value", "Probar un valor"),
      min: -6,
      max: 6,
      step: 1,
      value: 4,
    },
  ],
  render(s, T) {
    const X = (v) => 15 + (v + 6) * 25;
    const right = s.op === ">" || s.op === "≥";
    const closed = s.op === "≥" || s.op === "≤";
    const ticks = [];
    for (let v = -6; v <= 6; v += 1)
      ticks.push(
        `<line x1="${X(v)}" y1="55" x2="${X(v)}" y2="65" class="lm-tick"/>${v % 2 === 0 || v === s.n ? text(X(v), 86, fmt(v), v === s.n ? `fill="${Q1}"` : "") : ""}`,
      );
    const ok = holds(s.t, s.op, s.n);
    const words = {
      ">": L("more than", "más de"),
      "≥": L("at least", "por lo menos"),
      "<": L("less than", "menos de"),
      "≤": L("at most", "como máximo"),
    }[s.op];
    const pic = svg(
      330,
      100,
      T(
        L(
          `Number line: x ${s.op} ${s.n}, ${closed ? "closed" : "open"} dot at ${s.n}, shaded to the ${right ? "right" : "left"}; test value ${s.t}.`,
          `Recta numérica: x ${s.op} ${s.n}, punto ${closed ? "cerrado" : "abierto"} en ${s.n}, sombreado hacia la ${right ? "derecha" : "izquierda"}; valor de prueba ${s.t}.`,
        ),
      ),
      `<line x1="5" y1="60" x2="325" y2="60" class="lm-axis"/>${ticks.join("")}
       <line x1="${X(s.n)}" y1="60" x2="${right ? 325 : 5}" y2="60" stroke="${Q1}" stroke-width="6"/><path d="M${right ? 329 : 1} 60 l${right ? -10 : 10} -7 v14 z" fill="${Q1}"/>
       <circle cx="${X(s.n)}" cy="60" r="8" fill="${closed ? Q1 : "var(--bg, #fff)"}" stroke="${Q1}" stroke-width="3"/>
       <path d="M${X(s.t)} 22 l-7 -10 h14 z" fill="${ok ? Q3 : "var(--wrong)"}"/>${text(X(s.t), 40, ok ? "✓" : "✗")}`,
    );
    return {
      svg: pic,
      eq: T(
        L(
          `x ${s.op} ${s.n} means “x is ${words.en} ${s.n}”. ${s.t} ${ok ? "is" : "is not"} a solution: ${s.t} ${s.op} ${s.n} is ${ok ? "true" : "false"}.`,
          `x ${s.op} ${s.n} significa «x es ${words.es} ${s.n}». ${s.t} ${ok ? "es" : "no es"} solución: ${s.t} ${s.op} ${s.n} es ${ok ? "verdadero" : "falso"}.`,
        ),
      ),
    };
  },
});

// Like terms with algebra tiles: (a x + b) + (c x + d). Positive and negative tiles of the same kind pair off
// as zero pairs; what is left is the simplified expression.
export const likeTermsModel = livingModel({
  label: L("Change the terms", "Cambia los términos"),
  sliders: [
    {
      id: "a",
      label: L("First x-term", "Primer término con x"),
      min: -5,
      max: 5,
      step: 1,
      value: 4,
    },
    {
      id: "b",
      label: L("First constant", "Primera constante"),
      min: -5,
      max: 5,
      step: 1,
      value: 3,
    },
    {
      id: "c",
      label: L("Second x-term", "Segundo término con x"),
      min: -5,
      max: 5,
      step: 1,
      value: -2,
    },
    {
      id: "d",
      label: L("Second constant", "Segunda constante"),
      min: -5,
      max: 5,
      step: 1,
      value: -1,
    },
  ],
  render(s, T) {
    // One row of x-tiles and one row of unit tiles, each holding BOTH expressions' terms, so like terms sit
    // together. Opposite tiles pair off as zero pairs and are drawn faded and struck through.
    const X = s.a + s.c;
    const C = s.b + s.d;
    const zx = s.a * s.c < 0 ? Math.min(Math.abs(s.a), Math.abs(s.c)) : 0;
    const zc = s.b * s.d < 0 ? Math.min(Math.abs(s.b), Math.abs(s.d)) : 0;
    const row = (p, q, zero, kind, y) => {
      const list = [
        ...Array.from({ length: Math.abs(p) }, (_, i) => ({ neg: p < 0, from: 1, i })),
        ...Array.from({ length: Math.abs(q) }, (_, i) => ({ neg: q < 0, from: 2, i })),
      ];
      let posGone = 0;
      let negGone = 0;
      return list
        .map((t, k) => {
          const gone = t.neg ? negGone < zero && ++negGone : posGone < zero && ++posGone;
          const x = 14 + k * 30 + (t.from === 2 ? 8 : 0);
          const fill = t.neg ? "var(--wrong)" : kind === "x" ? Q1 : Q2;
          const hgt = kind === "x" ? 46 : 26;
          const label = kind === "x" ? (t.neg ? "−x" : "x") : t.neg ? "−1" : "1";
          return `<g opacity="${gone ? 0.28 : 1}"><rect x="${x}" y="${y}" width="26" height="${hgt}" rx="4" fill="${fill}"/><text x="${x + 13}" y="${y + hgt / 2 + 6}" style="font:700 15px var(--font);text-anchor:middle" fill="#fff">${label}</text>${gone ? `<line x1="${x - 2}" y1="${y + hgt + 2}" x2="${x + 28}" y2="${y - 2}" stroke="var(--ink)" stroke-width="2"/>` : ""}</g>`;
        })
        .join("");
    };
    const pic = svg(
      330,
      150,
      T(
        L(
          `Tiles for ${term(s.a)} ${signed(s.b)} and ${term(s.c)} ${signed(s.d)}; ${zx} x zero pair(s) and ${zc} unit zero pair(s) cancel.`,
          `Fichas de ${term(s.a)} ${signed(s.b)} y ${term(s.c)} ${signed(s.d)}; se cancelan ${zx} par(es) cero de x y ${zc} de unidades.`,
        ),
      ),
      `${text(14, 16, T(L("x-terms", "términos con x")), 'text-anchor="start" font-size="12" fill="var(--ink-2)"')}${row(s.a, s.c, zx, "x", 24)}
       ${text(14, 102, T(L("constants", "constantes")), 'text-anchor="start" font-size="12" fill="var(--ink-2)"')}${row(s.b, s.d, zc, "1", 110)}`,
    );
    const tab = table(
      T(L("Collect like terms", "Agrupar términos semejantes")),
      [
        [
          "",
          T(L("x-terms", "Términos con x")),
          T(L("Constants", "Constantes")),
        ],
        ["1", term(s.a), fmt(s.b)],
        ["2", term(s.c), fmt(s.d)],
        [T(L("Total", "Total")), X === 0 ? "0" : term(X), fmt(C)],
      ],
    );
    const result =
      X === 0 ? fmt(C) : C === 0 ? term(X) : `${term(X)} ${signed(C)}`;
    return {
      svg: pic,
      table: tab,
      eq: T(
        L(
          `(${term(s.a)} ${signed(s.b)}) + (${term(s.c)} ${signed(s.d)}) = (${fmt(s.a)} ${signed(s.c)})x + (${fmt(s.b)} ${signed(s.d)}) = ${result}`,
          `(${term(s.a)} ${signed(s.b)}) + (${term(s.c)} ${signed(s.d)}) = (${fmt(s.a)} ${signed(s.c)})x + (${fmt(s.b)} ${signed(s.d)}) = ${result}`,
        ),
      ),
    };
  },
});

// Two linear functions on one grid: the rate (slope) and the starting value (intercept) are separate controls,
// so a student can see that the steeper line is not always the one that starts higher.
export const compareFunctionsModel = livingModel({
  label: L("Change the functions", "Cambia las funciones"),
  sliders: [
    {
      id: "ma",
      label: L("A: rate of change", "A: tasa de cambio"),
      min: -3,
      max: 4,
      step: 1,
      value: 1,
    },
    {
      id: "ba",
      label: L("A: starting value", "A: valor inicial"),
      min: 0,
      max: 8,
      step: 1,
      value: 6,
    },
    {
      id: "mb",
      label: L("B: rate of change", "B: tasa de cambio"),
      min: -3,
      max: 4,
      step: 1,
      value: 3,
    },
    {
      id: "bb",
      label: L("B: starting value", "B: valor inicial"),
      min: 0,
      max: 8,
      step: 1,
      value: 1,
    },
  ],
  render(s, T) {
    // One fixed scale (x 0–4, y −12 to 24) so a steeper line always LOOKS steeper; gridlines every 4 units.
    const X = (x) => 44 + x * 62;
    const Y = (y) => 196 - (y + 12) * 5;
    const grid = [];
    for (let x = 0; x <= 4; x += 1)
      grid.push(`<line x1="${X(x)}" y1="${Y(24)}" x2="${X(x)}" y2="${Y(-12)}" stroke="var(--line-2)"/>${text(X(x), 216, String(x), 'font-size="12"')}`);
    for (let y = -12; y <= 24; y += 4)
      grid.push(`<line x1="${X(0)}" y1="${Y(y)}" x2="${X(4)}" y2="${Y(y)}" stroke="var(--line-2)" stroke-width="${y === 0 ? 2 : 1}"/>${y % 8 === 0 ? text(X(0) - 8, Y(y) + 5, fmt(y), 'font-size="12" text-anchor="end"') : ""}`);
    const end = (m, b) => b + 4 * m;
    const [ea, eb] = [end(s.ma, s.ba), end(s.mb, s.bb)];
    // End labels sit beside each line's end, pushed apart when the ends are close.
    let [ya, yb] = [Y(ea) + 6, Y(eb) + 6];
    if (Math.abs(ya - yb) < 20) [ya, yb] = ea >= eb ? [ya - 10, yb + 10] : [ya + 10, yb - 10];
    const pic = svg(
      330,
      226,
      T(L(`Graph: A is y = ${s.ma}x + ${s.ba}, B is y = ${s.mb}x + ${s.bb}, for x from 0 to 4.`, `Gráfica: A es y = ${s.ma}x + ${s.ba}, B es y = ${s.mb}x + ${s.bb}, para x de 0 a 4.`)),
      `${grid.join("")}
       <line x1="${X(0)}" y1="${Y(s.ba)}" x2="${X(4)}" y2="${Y(ea)}" stroke="${Q1}" stroke-width="3.5"/>
       <line x1="${X(0)}" y1="${Y(s.bb)}" x2="${X(4)}" y2="${Y(eb)}" stroke="${Q2}" stroke-width="3.5"/>
       <circle cx="${X(0)}" cy="${Y(s.ba)}" r="5" fill="${Q1}"/><circle cx="${X(0)}" cy="${Y(s.bb)}" r="5" fill="${Q2}"/>
       ${text(X(4) + 8, ya, "A", `fill="${Q1}" text-anchor="start"`)}${text(X(4) + 8, yb, "B", `fill="${Q2}" text-anchor="start"`)}`,
    );
    const rows = [["x", "A", "B"]];
    for (let x = 0; x <= 3; x += 1)
      rows.push([String(x), fmt(s.ma * x + s.ba), fmt(s.mb * x + s.bb)]);
    const faster =
      s.ma === s.mb
        ? T(L("They change at the same rate", "Cambian a la misma tasa"))
        : T(
            L(
              `${s.ma > s.mb ? "A" : "B"} has the greater rate of change`,
              `${s.ma > s.mb ? "A" : "B"} tiene la mayor tasa de cambio`,
            ),
          );
    const higher =
      s.ba === s.bb
        ? T(L("they start at the same value", "empiezan en el mismo valor"))
        : T(
            L(
              `${s.ba > s.bb ? "A" : "B"} starts higher`,
              `${s.ba > s.bb ? "A" : "B"} empieza más arriba`,
            ),
          );
    return {
      svg: pic,
      table: table(T(L("Function tables", "Tablas de las funciones")), rows),
      eq: `${faster} (${fmt(s.ma)} ${T(L("vs", "frente a"))} ${fmt(s.mb)}); ${higher}.`,
    };
  },
  observed: (s, i) => s.ma !== i.ma || s.mb !== i.mb,
});

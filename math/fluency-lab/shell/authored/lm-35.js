// Living models for the Grade 3–5 skills that have no engine Build. Each is one state drawn three ways, and every
// equation is computed from that state, so the picture and the notation cannot disagree.
import { L } from "./k5-kit.js";
import { C, esc, model, svg, table, text } from "./lm-kit.js";

// Grade 3 · Multiplication facts as arrays ---------------------------------------------------------------------------
// `split: true` (facts ×6–9) splits the rows at 5: r × c = 5 × c + (r − 5) × c.
export function arrayModel({ rows, cols, split }) {
  return model({
    steppers: [
      {
        key: "r",
        label: L("Rows", "Filas"),
        min: rows[0],
        max: rows[1],
        init: rows[2],
      },
      {
        key: "c",
        label: L("In each row", "En cada fila"),
        min: cols[0],
        max: cols[1],
        init: cols[2],
      },
    ],
    toggles: [
      ...(split
        ? [{ key: "split", label: L("Split at 5 rows", "Separa en 5 filas") }]
        : []),
      { key: "turn", label: L("Turn the array", "Gira el arreglo") },
    ],
    observed: (s, n) => n >= 2,
    draw(s, T) {
      const R = s.turn ? s.c : s.r;
      const K = s.turn ? s.r : s.c;
      const g = Math.min(34, 250 / Math.max(K, 1));
      const r = Math.round(g * 0.34);
      const out = [];
      for (let i = 0; i < R; i += 1) {
        const lower = split && s.split && !s.turn && i >= 5;
        const y = 18 + i * g + (lower ? 10 : 0);
        for (let j = 0; j < K; j += 1)
          out.push(
            lower
              ? `<rect x="${14 + j * g - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" rx="3" fill="${C.a}"/>`
              : `<circle cx="${14 + j * g}" cy="${y}" r="${r}" fill="${C.b}"/>`,
          );
        out.push(
          text(14 + K * g + 6, y + 5, String((i + 1) * K), {
            anchor: "start",
            size: 17,
            fill: C.ink,
          }),
        );
      }
      if (split && s.split && !s.turn && s.r > 5)
        out.push(
          `<line x1="2" y1="${18 + 5 * g - 7}" x2="${14 + K * g}" y2="${18 + 5 * g - 7}" stroke="${C.c}" stroke-width="3" stroke-dasharray="6 4"/>`,
        );
      const P = s.r * s.c;
      let eq;
      if (s.r === 0 || s.c === 0)
        eq = T(
          L(
            `${s.r} × ${s.c} = 0. With no rows (or nothing in each row) there is nothing to count.`,
            `${s.r} × ${s.c} = 0. Sin filas (o sin nada en cada fila) no hay nada que contar.`,
          ),
        );
      else if (s.turn)
        eq = T(
          L(
            `Turned: ${s.c} rows of ${s.r}. The same dots, so ${s.c} × ${s.r} = ${s.r} × ${s.c} = ${P}.`,
            `Girado: ${s.c} filas de ${s.r}. Son los mismos puntos, así que ${s.c} × ${s.r} = ${s.r} × ${s.c} = ${P}.`,
          ),
        );
      else if (split && s.split && s.r > 5)
        eq = T(
          L(
            `${s.r} rows = 5 rows + ${s.r - 5} rows. ${s.r} × ${s.c} = 5 × ${s.c} + ${s.r - 5} × ${s.c} = ${5 * s.c} + ${(s.r - 5) * s.c} = ${P}.`,
            `${s.r} filas = 5 filas + ${s.r - 5} filas. ${s.r} × ${s.c} = 5 × ${s.c} + ${s.r - 5} × ${s.c} = ${5 * s.c} + ${(s.r - 5) * s.c} = ${P}.`,
          ),
        );
      else
        eq = T(
          L(
            `${s.r} rows of ${s.c}: count by ${s.c}s down the side. ${s.r} × ${s.c} = ${Array(s.r).fill(s.c).join(" + ")} = ${P}.`,
            `${s.r} filas de ${s.c}: cuenta de ${s.c} en ${s.c} por el lado. ${s.r} × ${s.c} = ${Array(s.r).fill(s.c).join(" + ")} = ${P}.`,
          ),
        );
      const label = T(
        L(
          `An array of ${R} rows with ${K} in each row`,
          `Un arreglo de ${R} filas con ${K} en cada fila`,
        ),
      );
      return {
        svg: svg(
          340,
          Math.max(40, 30 + R * g + 10),
          label,
          out.join(""),
          280,
        ),
        eq: esc(eq),
      };
    },
  });
}

// Grade 3 · Scaled bar graphs ----------------------------------------------------------------------------------------
export const scaledGraphModel = model({
  choices: [
    {
      key: "scale",
      label: L("Each square stands for", "Cada cuadro vale"),
      init: "5",
      options: ["1", "2", "5", "10"].map((v) => ({ value: v, label: L(v, v) })),
    },
  ],
  steppers: [
    {
      key: "a",
      label: L("Class A squares", "Cuadros de la clase A"),
      min: 0,
      max: 10,
      init: 6,
    },
    {
      key: "b",
      label: L("Class B squares", "Cuadros de la clase B"),
      min: 0,
      max: 10,
      init: 3,
    },
  ],
  observed: (s, n) => n >= 2,
  draw(s, T) {
    const k = Number(s.scale);
    const sq = 16;
    const base = 196;
    const out = [
      `<line x1="54" y1="${base}" x2="300" y2="${base}" stroke="${C.ink}" stroke-width="2"/><line x1="54" y1="${base}" x2="54" y2="${base - 10 * sq - 6}" stroke="${C.ink}" stroke-width="2"/>`,
    ];
    for (let i = 0; i <= 10; i += 2)
      out.push(
        text(48, base - i * sq + 5, String(i * k), { anchor: "end", size: 17 }),
        `<line x1="54" y1="${base - i * sq}" x2="300" y2="${base - i * sq}" stroke="${C.line}" stroke-width="1"/>`,
      );
    const bar = (x, n, fill, shape) => {
      for (let i = 0; i < n; i += 1)
        out.push(
          `<rect x="${x}" y="${base - (i + 1) * sq}" width="44" height="${sq}" fill="${fill}" stroke="#fff" stroke-width="1.5"${shape ? ' rx="4"' : ""}/>`,
        );
    };
    bar(100, s.a, C.b, false);
    bar(200, s.b, C.a, true);
    out.push(
      text(122, base + 18, T(L("Class A", "Clase A")), { size: 17 }),
      text(222, base + 18, T(L("Class B", "Clase B")), { size: 17 }),
    );
    const A = s.a * k;
    const B = s.b * k;
    const more =
      s.a === s.b
        ? T(L("They are the same.", "Son iguales."))
        : s.a > s.b
          ? T(
              L(
                `Class A has ${s.a} − ${s.b} = ${s.a - s.b} more squares, and ${s.a - s.b} × ${k} = ${A - B} more.`,
                `La clase A tiene ${s.a} − ${s.b} = ${s.a - s.b} cuadros más, y ${s.a - s.b} × ${k} = ${A - B} más.`,
              ),
            )
          : T(
              L(
                `Class B has ${s.b} − ${s.a} = ${s.b - s.a} more squares, and ${s.b - s.a} × ${k} = ${B - A} more.`,
                `La clase B tiene ${s.b} − ${s.a} = ${s.b - s.a} cuadros más, y ${s.b - s.a} × ${k} = ${B - A} más.`,
              ),
            );
    const eq =
      T(
        L(
          `Each square is ${k}. A: ${s.a} × ${k} = ${A}. B: ${s.b} × ${k} = ${B}. `,
          `Cada cuadro vale ${k}. A: ${s.a} × ${k} = ${A}. B: ${s.b} × ${k} = ${B}. `,
        ),
      ) + more;
    const tbl = table(
      T(L("Read the graph", "Lee la gráfica")),
      [
        T(L("Bar", "Barra")),
        T(L("Squares", "Cuadros")),
        
        T(L("Amount", "Cantidad")),
      ],
      [
        [T(L("Class A", "Clase A")), String(s.a),
          String(A)],
        [T(L("Class B", "Clase B")), String(s.b),
          String(B)],
      ],
    );
    return {
      svg: svg(
        320,
        220,
        T(
          L(
            `Bar graph: Class A ${s.a} squares, Class B ${s.b} squares, each square ${k}`,
            `Gráfica de barras: clase A ${s.a} cuadros, clase B ${s.b} cuadros, cada cuadro ${k}`,
          ),
        ),
        out.join(""),
        240,
      ),
      table: tbl,
      eq: esc(eq),
    };
  },
});

// Grade 4 · Mixed numbers and fractions greater than 1 ----------------------------------------------------------------
export const mixedModel = model({
  steppers: [
    {
      key: "d",
      label: L("Parts in each whole", "Partes en cada entero"),
      min: 2,
      max: 8,
      init: 4,
    },
    { key: "w", label: L("Wholes", "Enteros"), min: 0, max: 3, init: 2 },
    {
      key: "p",
      label: L("Extra parts", "Partes extra"),
      min: 0,
      max: 7,
      init: 3,
    },
  ],
  toggles: [
    {
      key: "back",
      label: L("Read it as a fraction first", "Léelo primero como fracción"),
    },
  ],
  limit: (s) => ({ ...s, p: Math.min(s.p, s.d - 1) }),
  observed: (s, n) => n >= 2,
  draw(s, T) {
    const N = s.w * s.d + s.p;
    const bars = s.w + (s.p ? 1 : 0);
    const W = 300;
    const out = [];
    let count = 0;
    for (let b = 0; b < Math.max(bars, 1); b += 1) {
      const y = 10 + b * 44;
      for (let i = 0; i < s.d; i += 1) {
        const filled = b < s.w || i < s.p;
        if (filled) count += 1;
        const x = 10 + (i * W) / s.d;
        out.push(
          `<rect x="${x}" y="${y}" width="${W / s.d}" height="34" fill="${filled ? (b < s.w ? C.b : C.a) : "#fff"}" stroke="${C.ink}" stroke-width="2"/>`,
        );
        if (filled)
          out.push(
            text(x + W / s.d / 2, y + 23, String(count), {
              size: 17,
              fill: "#fff",
            }),
          );
      }
      out.push(
        text(W + 16, y + 23, b < s.w ? `${s.d}/${s.d}` : `${s.p}/${s.d}`, {
          anchor: "start",
          size: 17,
        }),
      );
    }
    const mixed = s.p
      ? s.w
        ? `${s.w} ${s.p}/${s.d}`
        : `${s.p}/${s.d}`
      : `${s.w}`;
    const sumParts =
      [
        ...Array(s.w).fill(`${s.d}/${s.d}`),
        ...(s.p ? [`${s.p}/${s.d}`] : []),
      ].join(" + ") || "0";
    const eq = s.back
      ? T(
          L(
            `${N}/${s.d} means ${N} parts of size 1/${s.d}. Every ${s.d} parts fill a whole: ${N} ÷ ${s.d} = ${s.w} R ${s.p}. So ${N}/${s.d} = ${mixed}.`,
            `${N}/${s.d} significa ${N} partes de tamaño 1/${s.d}. Cada ${s.d} partes llenan un entero: ${N} ÷ ${s.d} = ${s.w} R ${s.p}. Así que ${N}/${s.d} = ${mixed}.`,
          ),
        )
      : T(
          L(
            `${mixed} = ${sumParts}. Count the parts: ${s.w} × ${s.d} + ${s.p} = ${N}. So ${mixed} = ${N}/${s.d}.`,
            `${mixed} = ${sumParts}. Cuenta las partes: ${s.w} × ${s.d} + ${s.p} = ${N}. Así que ${mixed} = ${N}/${s.d}.`,
          ),
        );
    const label = T(
      L(
        `${s.w} whole bars and ${s.p} of ${s.d} parts shaded, ${N} parts in all`,
        `${s.w} barras enteras y ${s.p} de ${s.d} partes sombreadas, ${N} partes en total`,
      ),
    );
    return {
      svg: svg(360, 10 + Math.max(bars, 1) * 44, label, out.join(""), 200),
      eq: esc(eq),
    };
  },
});

// Grade 4 · Angles that add -----------------------------------------------------------------------------------------
const rad = (d) => (d * Math.PI) / 180;
export const angleModel = model({
  steppers: [
    {
      key: "a",
      label: L("Angle 1", "Ángulo 1"),
      min: 5,
      max: 175,
      step: 5,
      init: 40,
      fmt: (v) => `${v}°`,
    },
    {
      key: "b",
      label: L("Angle 2", "Ángulo 2"),
      min: 5,
      max: 175,
      step: 5,
      init: 50,
      fmt: (v) => `${v}°`,
    },
  ],
  limit: (s) => ({ ...s, b: Math.min(s.b, 180 - s.a) }),
  observed: (s, n) => n >= 2,
  draw(s, T) {
    const cx = 180;
    const cy = 176;
    const R = 150;
    const P = (deg, r) => [
      cx + r * Math.cos(rad(deg)),
      cy - r * Math.sin(rad(deg)),
    ];
    const out = [
      `<path d="M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}" fill="none" stroke="${C.line}" stroke-width="1.5"/>`,
    ];
    for (let d = 0; d <= 180; d += 10) {
      const [x1, y1] = P(d, R - (d % 30 ? 6 : 12));
      const [x2, y2] = P(d, R);
      out.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.line}" stroke-width="1.5"/>`,
      );
      if (d % 30 === 0) {
        const [tx, ty] = P(d, R + 12);
        out.push(
          text(tx, ty + 4, String(d), { size: 17, fill: C.ink, weight: 400 }),
        );
      }
    }
    const arc = (from, to, r, color, dash) => {
      const [x1, y1] = P(from, r);
      const [x2, y2] = P(to, r);
      return `<path d="M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="4"${dash ? ' stroke-dasharray="6 4"' : ""}/>`;
    };
    const sum = s.a + s.b;
    out.push(
      arc(0, s.a, 46, C.b),
      arc(s.a, sum, 66, C.a),
      arc(0, sum, 92, C.c, true),
    );
    for (const deg of [0, s.a, sum]) {
      const [x, y] = P(deg, R - 18);
      out.push(
        `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`,
      );
    }
    const [ax, ay] = P(s.a / 2, 32);
    const [bx, by] = P(s.a + s.b / 2, 52);
    out.push(
      text(ax, ay + 5, `1`, { size: 17, fill: C.b }),
      text(bx, by + 5, `2`, { size: 17, fill: C.a }),
      `<circle cx="${cx}" cy="${cy}" r="4" fill="${C.ink}"/>`,
    );
    if (sum === 90)
      out.push(
        `<path d="M ${cx + 14} ${cy} L ${cx + 14} ${cy - 14} L ${cx} ${cy - 14}" fill="none" stroke="${C.c}" stroke-width="2.5"/>`,
      );
    let eq = `${s.a}° + ${s.b}° = ${sum}°. `;
    if (sum === 90)
      eq += T(
        L(
          `Together they make a right angle, so each one is what the other needs to reach 90°: 90 − ${s.a} = ${s.b}.`,
          `Juntos forman un ángulo recto, así que cada uno es lo que le falta al otro para llegar a 90°: 90 − ${s.a} = ${s.b}.`,
        ),
      );
    else if (sum === 180)
      eq += T(
        L(
          `Together they make a straight angle: 180 − ${s.a} = ${s.b}.`,
          `Juntos forman un ángulo llano: 180 − ${s.a} = ${s.b}.`,
        ),
      );
    else
      eq += T(
        L(
          `The two angles share a ray and do not overlap, so the big dashed angle is their sum. Try making exactly 90° or 180°.`,
          `Los dos ángulos comparten un rayo y no se superponen, así que el ángulo grande punteado es su suma. Intenta formar exactamente 90° o 180°.`,
        ),
      );
    const label = T(
      L(
        `Angle 1 is ${s.a} degrees, angle 2 is ${s.b} degrees, together ${sum} degrees`,
        `El ángulo 1 mide ${s.a} grados, el ángulo 2 mide ${s.b} grados, juntos ${sum} grados`,
      ),
    );
    return { svg: svg(360, 190, label, out.join(""), 240), eq: esc(eq) };
  },
});

// Grade 5 · The coordinate plane ------------------------------------------------------------------------------------
export const coordinateModel = model({
  steppers: [
    { key: "x", label: L("Right (x)", "Derecha (x)"), min: 0, max: 8, init: 3 },
    { key: "y", label: L("Up (y)", "Arriba (y)"), min: 0, max: 8, init: 2 },
    {
      key: "r",
      label: L("Then right", "Luego a la derecha"),
      min: 0,
      max: 4,
      init: 4,
    },
    { key: "u", label: L("Then up", "Luego arriba"), min: 0, max: 4, init: 0 },
  ],
  observed: (s, n) => n >= 2,
  draw(s, T) {
    const g = 22;
    const o = [30, 290];
    const X = (v) => o[0] + v * g;
    const Y = (v) => o[1] - v * g;
    const out = [];
    for (let i = 0; i <= 12; i += 1) {
      out.push(
        `<line x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(12)}" stroke="${C.line}" stroke-width="1"/>`,
        `<line x1="${X(0)}" y1="${Y(i)}" x2="${X(12)}" y2="${Y(i)}" stroke="${C.line}" stroke-width="1"/>`,
      );
      if (i % 2 === 0)
        out.push(
          text(X(i), Y(0) + 16, String(i), { size: 17, weight: 400 }),
          text(X(0) - 8, Y(i) + 4, String(i), {
            size: 17,
            anchor: "end",
            weight: 400,
          }),
        );
    }
    out.push(
      `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(12.4)}" y2="${Y(0)}" stroke="${C.ink}" stroke-width="2.5"/><line x1="${X(0)}" y1="${Y(0)}" x2="${X(0)}" y2="${Y(12.4)}" stroke="${C.ink}" stroke-width="2.5"/>`,
      text(X(12.4), Y(0) - 6, "x", { size: 17 }),
      text(X(0) + 10, Y(12.4) + 4, "y", { size: 17 }),
    );
    const qx = s.x + s.r;
    const qy = s.y + s.u;
    out.push(
      `<polyline points="${X(0)},${Y(0)} ${X(s.x)},${Y(0)} ${X(s.x)},${Y(s.y)}" fill="none" stroke="${C.b}" stroke-width="3" stroke-dasharray="6 4"/>`,
      `<polyline points="${X(s.x)},${Y(s.y)} ${X(qx)},${Y(s.y)} ${X(qx)},${Y(qy)}" fill="none" stroke="${C.a}" stroke-width="3" stroke-dasharray="2 4"/>`,
      `<circle cx="${X(s.x)}" cy="${Y(s.y)}" r="7" fill="${C.b}"/>`,
      `<rect x="${X(qx) - 7}" y="${Y(qy) - 7}" width="14" height="14" fill="${C.a}"/>`,
      text(X(s.x) - 4, Y(s.y) - 12, `P(${s.x}, ${s.y})`, {
        size: 17,
        fill: C.b,
        anchor: "end",
      }),
      text(X(qx) + 4, Y(qy) - 12, `Q(${qx}, ${qy})`, {
        size: 17,
        fill: C.a,
        anchor: "start",
      }),
    );
    let eq = T(
      L(
        `From (0, 0): right ${s.x}, up ${s.y}, so P = (${s.x}, ${s.y}). From P: right ${s.r}, up ${s.u}, so Q = (${s.x} + ${s.r}, ${s.y} + ${s.u}) = (${qx}, ${qy}). The first number is always how far right; the second is how far up.`,
        `Desde (0, 0): derecha ${s.x}, arriba ${s.y}, así que P = (${s.x}, ${s.y}). Desde P: derecha ${s.r}, arriba ${s.u}, así que Q = (${s.x} + ${s.r}, ${s.y} + ${s.u}) = (${qx}, ${qy}). El primer número siempre dice cuánto a la derecha; el segundo, cuánto hacia arriba.`,
      ),
    );
    if (s.u === 0 && s.r > 0)
      eq += T(
        L(
          ` P and Q are on the same horizontal line, ${qx} − ${s.x} = ${s.r} units apart.`,
          ` P y Q están en la misma línea horizontal, a ${qx} − ${s.x} = ${s.r} unidades.`,
        ),
      );
    return {
      svg: svg(
        320,
        310,
        T(
          L(
            `Coordinate grid with P at (${s.x}, ${s.y}) and Q at (${qx}, ${qy})`,
            `Plano de coordenadas con P en (${s.x}, ${s.y}) y Q en (${qx}, ${qy})`,
          ),
        ),
        out.join(""),
        340,
      ),
      eq: esc(eq),
    };
  },
});

// Grade 5 · Order of operations --------------------------------------------------------------------------------------
export const orderOpsModel = model({
  steppers: [
    {
      key: "a",
      label: L("First number", "Primer número"),
      min: 1,
      max: 6,
      init: 2,
    },
    {
      key: "b",
      label: L("Second number", "Segundo número"),
      min: 1,
      max: 6,
      init: 3,
    },
    { key: "c", label: L("Times", "Veces"), min: 1, max: 5, init: 4 },
  ],
  toggles: [
    {
      key: "paren",
      label: L("Put ( ) around the addition", "Pon ( ) alrededor de la suma"),
    },
  ],
  observed: (s, n) => n >= 2,
  draw(s, T) {
    const g = Math.min(36, 300 / (s.a + s.b + 1.5));
    const r = Math.round(g * 0.36);
    const out = [];
    if (s.paren) {
      // c rows of (a + b): every row has a orange squares and b blue dots.
      for (let i = 0; i < s.c; i += 1)
        for (let j = 0; j < s.a + s.b; j += 1) {
          const x = 14 + j * g;
          const y = 16 + i * g;
          out.push(
            j < s.a
              ? `<rect x="${x - r}" y="${y - r}" width="${2 * r}" height="${2 * r}" rx="3" fill="${C.a}"/>`
              : `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.b}"/>`,
          );
        }
    } else {
      for (let j = 0; j < s.a; j += 1)
        out.push(
          `<rect x="${14 + j * g - r}" y="${16 - r}" width="${2 * r}" height="${2 * r}" rx="3" fill="${C.a}"/>`,
        );
      for (let i = 0; i < s.c; i += 1)
        for (let j = 0; j < s.b; j += 1)
          out.push(
            `<circle cx="${14 + (s.a + 1 + j) * g}" cy="${16 + i * g}" r="${r}" fill="${C.b}"/>`,
          );
      out.push(
        `<line x1="${14 + (s.a + 0.5) * g}" y1="4" x2="${14 + (s.a + 0.5) * g}" y2="${16 + s.c * g}" stroke="${C.line}" stroke-width="2"/>`,
      );
    }
    const expr = s.paren
      ? `(${s.a} + ${s.b}) × ${s.c}`
      : `${s.a} + ${s.b} × ${s.c}`;
    const val = s.paren ? (s.a + s.b) * s.c : s.a + s.b * s.c;
    const eq = s.paren
      ? T(
          L(
            `${expr}: parentheses first, ${s.a} + ${s.b} = ${s.a + s.b}. Then ${s.a + s.b} × ${s.c} = ${val}. The picture: ${s.c} rows, and EVERY row has ${s.a} squares and ${s.b} dots.`,
            `${expr}: primero los paréntesis, ${s.a} + ${s.b} = ${s.a + s.b}. Luego ${s.a + s.b} × ${s.c} = ${val}. El dibujo: ${s.c} filas, y CADA fila tiene ${s.a} cuadrados y ${s.b} puntos.`,
          ),
        )
      : T(
          L(
            `${expr}: multiply first, ${s.b} × ${s.c} = ${s.b * s.c}. Then add, ${s.a} + ${s.b * s.c} = ${val}. The picture: ${s.c} rows of ${s.b} dots, and only ${s.a} squares, counted once.`,
            `${expr}: primero multiplica, ${s.b} × ${s.c} = ${s.b * s.c}. Luego suma, ${s.a} + ${s.b * s.c} = ${val}. El dibujo: ${s.c} filas de ${s.b} puntos, y solo ${s.a} cuadrados, contados una vez.`,
          ),
        );
    const label = T(
      L(`Picture of ${expr} = ${val}`, `Dibujo de ${expr} = ${val}`),
    );
    return {
      svg: svg(340, 24 + s.c * g, label, out.join(""), 160),
      eq: esc(eq),
    };
  },
});

// Grade 5 · Volume of a rectangular prism ---------------------------------------------------------------------------
export const volumeModel = model({
  steppers: [
    { key: "l", label: L("Length", "Largo"), min: 1, max: 6, init: 4 },
    { key: "w", label: L("Width", "Ancho"), min: 1, max: 4, init: 3 },
    {
      key: "h",
      label: L("Layers (height)", "Capas (altura)"),
      min: 1,
      max: 5,
      init: 2,
    },
  ],
  observed: (s, n) => n >= 2,
  draw(s, T) {
    const u = 24;
    const dx = u * 0.5;
    const dy = u * 0.5;
    const ox = 20;
    const oy = 30 + s.w * dy + s.h * u;
    const out = [];
    const face = (pts, fill) =>
      `<polygon points="${pts.map((p) => p.join(",")).join(" ")}" fill="${fill}" stroke="#fff" stroke-width="1.2"/>`;
    for (let z = 0; z < s.h; z += 1) {
      const top = z === s.h - 1;
      for (let y = s.w - 1; y >= 0; y -= 1)
        for (let x = 0; x < s.l; x += 1) {
          const X = ox + x * u + y * dx;
          const Y = oy - z * u - y * dy;
          const tone = z % 2 ? C.c : C.b;
          out.push(
            face(
              [
                [X, Y],
                [X + u, Y],
                [X + u, Y - u],
                [X, Y - u],
              ],
              tone,
            ),
            face(
              [
                [X, Y - u],
                [X + u, Y - u],
                [X + u + dx, Y - u - dy],
                [X + dx, Y - u - dy],
              ],
              top ? "#9fd8cf" : "#cfe0f7",
            ),
            face(
              [
                [X + u, Y],
                [X + u + dx, Y - dy],
                [X + u + dx, Y - u - dy],
                [X + u, Y - u],
              ],
              "#7c93b8",
            ),
          );
        }
      out.push(
        text(
          ox + s.l * u + s.w * dx + 10,
          oy - z * u - u / 2 + 5,
          `${T(L("layer", "capa"))} ${z + 1}`,
          { anchor: "start", size: 17 },
        ),
      );
    }
    const B = s.l * s.w;
    const V = B * s.h;
    const eq = T(
      L(
        `One layer: ${s.l} × ${s.w} = ${B} cubes. ${s.h} layers: ${B} × ${s.h} = ${V} cubic units. V = length × width × height = ${s.l} × ${s.w} × ${s.h} = ${V}.`,
        `Una capa: ${s.l} × ${s.w} = ${B} cubos. ${s.h} capas: ${B} × ${s.h} = ${V} unidades cúbicas. V = largo × ancho × altura = ${s.l} × ${s.w} × ${s.h} = ${V}.`,
      ),
    );
    const label = T(
      L(
        `A box of unit cubes, ${s.l} long, ${s.w} wide, ${s.h} layers high`,
        `Una caja de cubos unitarios, ${s.l} de largo, ${s.w} de ancho, ${s.h} capas de alto`,
      ),
    );
    return {
      svg: svg(
        Math.max(300, ox + s.l * u + s.w * dx + 70),
        oy + 12,
        label,
        out.join(""),
        260,
      ),
      eq: esc(eq),
    };
  },
});

// Grade 3 · Multiply by a multiple of 10 ----------------------------------------------------------------------------
// Groups of ten-rods: 7 × 50 is 7 groups of 5 tens = 35 tens = 350. The rods are drawn, so the "tens" are visible.
export const tensGroupsModel = model({
  steppers: [
    { key: "g", label: L("Groups", "Grupos"), min: 1, max: 9, init: 4 },
    { key: "t", label: L("Tens in each group", "Decenas en cada grupo"), min: 1, max: 9, init: 3 },
  ],
  observed: (s, n) => n >= 2,
  draw(s, T) {
    const out = [];
    const rodW = 12;
    const groupW = s.t * (rodW + 4) + 12;
    const perRow = Math.max(1, Math.floor(340 / (groupW + 8)));
    for (let i = 0; i < s.g; i += 1) {
      const gx = 6 + (i % perRow) * (groupW + 8);
      const gy = 6 + Math.floor(i / perRow) * 104;
      out.push(`<rect x="${gx}" y="${gy}" width="${groupW}" height="96" rx="8" fill="none" stroke="${C.line}" stroke-width="2" stroke-dasharray="4 3"/>`);
      for (let j = 0; j < s.t; j += 1) {
        const x = gx + 6 + j * (rodW + 4);
        out.push(`<rect x="${x}" y="${gy + 6}" width="${rodW}" height="64" fill="${C.c}"/>`);
        for (let k = 1; k < 10; k += 1) out.push(`<line x1="${x}" y1="${gy + 6 + k * 6.4}" x2="${x + rodW}" y2="${gy + 6 + k * 6.4}" stroke="#fff" stroke-width="0.8"/>`);
      }
      out.push(text(gx + groupW / 2, gy + 90, `${s.t * 10}`, { size: 17, fill: C.c }));
    }
    const rows = Math.ceil(s.g / perRow);
    const tens = s.g * s.t;
    const eq = T(
      L(
        `${s.g} × ${s.t * 10} means ${s.g} groups of ${s.t} tens. ${s.g} × ${s.t} = ${tens}, so there are ${tens} tens. ${tens} tens = ${tens * 10}. So ${s.g} × ${s.t * 10} = ${tens * 10}.`,
        `${s.g} × ${s.t * 10} significa ${s.g} grupos de ${s.t} decenas. ${s.g} × ${s.t} = ${tens}, así que hay ${tens} decenas. ${tens} decenas = ${tens * 10}. Así que ${s.g} × ${s.t * 10} = ${tens * 10}.`,
      ),
    );
    const label = T(L(`${s.g} groups of ${s.t} ten-rods`, `${s.g} grupos de ${s.t} barras de diez`));
    return { svg: svg(352, 12 + rows * 104, label, out.join(""), 300), eq: esc(eq) };
  },
});

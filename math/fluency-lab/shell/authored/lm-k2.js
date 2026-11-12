// Living models for the K–2 skills that have no engine Build. Each is one state drawn three ways.
import { L } from "./k5-kit.js";
import { C, esc, model, svg, table, text } from "./lm-kit.js";

// K · How many are hiding? ------------------------------------------------------------------------------------------
// Counters in a row; some sit under a cover. The part–part–whole bar under them uses the SAME three numbers.
export const hiddenPartsModel = model({
  steppers: [
    { key: "total", label: L("In all", "En total"), min: 3, max: 10, init: 7 },
    { key: "shown", label: L("Showing", "Se ven"), min: 0, max: 10, init: 4 },
  ],
  toggles: [{ key: "peek", label: L("Lift the cover", "Levanta la tapa") }],
  limit: (s) => ({ ...s, shown: Math.min(s.shown, s.total) }),
  observed: (s, n) => n >= 2,
  draw(s, T) {
    const hide = s.total - s.shown;
    // Fixed 340-wide layout: the counters and the bars always fill the width, so nothing renders small.
    const W = 320;
    const slot = W / s.total;
    const r = Math.min(16, slot / 2 - 4);
    const cx = (i) => 10 + slot * (i + 0.5);
    const parts = [];
    for (let i = 0; i < s.total; i += 1) {
      if (i < s.shown) parts.push(`<circle cx="${cx(i)}" cy="36" r="${r}" fill="${C.b}"/>`);
      else if (s.peek)
        parts.push(`<circle cx="${cx(i)}" cy="36" r="${r}" fill="#fff" stroke="${C.a}" stroke-width="3" stroke-dasharray="5 3"/>`);
    }
    if (hide && !s.peek) {
      const x = 10 + slot * s.shown + 2;
      parts.push(
        `<rect x="${x}" y="10" width="${slot * hide - 4}" height="52" rx="12" fill="${C.a}"/>`,
        text(x + (slot * hide - 4) / 2, 45, "?", { size: 26, fill: "#fff", weight: 800 }),
      );
    }
    // Part–part–whole bar from the same three numbers: the whole on top, the two parts below.
    const sw = (s.shown / s.total) * W;
    parts.push(
      `<rect x="10" y="80" width="${W}" height="36" rx="6" fill="#fff" stroke="${C.ink}" stroke-width="2"/>`,
      text(10 + W / 2, 104, `${s.total} ${T(L("in all", "en total"))}`, { size: 17 }),
      sw ? `<rect x="10" y="122" width="${sw}" height="36" rx="6" fill="#eaf0fd" stroke="${C.b}" stroke-width="3"/>` : "",
      sw > 26 ? text(10 + sw / 2, 146, `${s.shown}`, { fill: C.b, size: 17 }) : "",
      W - sw ? `<rect x="${10 + sw}" y="122" width="${W - sw}" height="36" rx="6" fill="#fdf0ea" stroke="${C.a}" stroke-width="3" stroke-dasharray="6 4"/>` : "",
      W - sw > 26 ? text(10 + sw + (W - sw) / 2, 146, s.peek ? `${hide}` : "?", { fill: C.a, size: 17 }) : "",
    );
    const label = T(
      L(
        `${s.total} counters in all, ${s.shown} showing, ${s.peek ? `${hide} hiding` : "the rest under a cover"}`,
        `${s.total} fichas en total, ${s.shown} se ven, ${s.peek ? `${hide} escondidas` : "las demás bajo una tapa"}`,
      ),
    );
    const eq = s.peek
      ? T(
          L(
            `${s.shown} showing and ${hide} hiding make ${s.total}. ${s.shown} + ${hide} = ${s.total}, so ${s.total} − ${s.shown} = ${hide}.`,
            `${s.shown} que se ven y ${hide} escondidas hacen ${s.total}. ${s.shown} + ${hide} = ${s.total}, así que ${s.total} − ${s.shown} = ${hide}.`,
          ),
        )
      : T(
          L(
            `${s.shown} + ? = ${s.total}. Count on from ${s.shown} up to ${s.total}. Then lift the cover to check.`,
            `${s.shown} + ? = ${s.total}. Cuenta desde ${s.shown} hasta ${s.total}. Luego levanta la tapa para comprobar.`,
          ),
        );
    return { svg: svg(340, 166, label, parts.join(""), 260), eq };
  },
});

// Grade 1 · Flat and solid shapes ------------------------------------------------------------------------------------
const FLAT = {
  triangle: { n: 3, en: "triangle", es: "triángulo" },
  square: { n: 4, en: "square", es: "cuadrado" },
  rectangle: { n: 4, en: "rectangle", es: "rectángulo" },
  pentagon: { n: 5, en: "pentagon", es: "pentágono" },
  hexagon: { n: 6, en: "hexagon", es: "hexágono" },
  octagon: { n: 8, en: "octagon", es: "octágono" },
};
const SOLID = {
  cube: { en: "cube", es: "cubo", w: 100, h: 100 },
  box: { en: "rectangular prism", es: "prisma rectangular", w: 150, h: 80 },
};
function flatPoints(kind) {
  if (kind === "square")
    return [
      [110, 40],
      [210, 40],
      [210, 140],
      [110, 140],
    ];
  if (kind === "rectangle")
    return [
      [70, 55],
      [250, 55],
      [250, 135],
      [70, 135],
    ];
  const n = FLAT[kind].n;
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n + (n % 2 ? 0 : Math.PI / n);
    return [160 + 72 * Math.cos(a), 92 + 72 * Math.sin(a)];
  });
}
function drawFlat(kind, show, T) {
  const p = flatPoints(kind);
  const n = p.length;
  const out = [
    `<polygon points="${p.map((v) => v.join(",")).join(" ")}" fill="#eef4ff" stroke="${C.ink}" stroke-width="3"/>`,
  ];
  for (let i = 0; i < n; i += 1) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % n];
    if (show === "sides") {
      out.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${C.b}" stroke-width="6"/>`,
      );
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const ox = ((mx - 160) / 72) * 18;
      const oy = ((my - 92) / 72) * 18;
      out.push(
        `<rect x="${mx + ox - 11}" y="${my + oy - 11}" width="22" height="22" rx="4" fill="#fff" stroke="${C.b}"/>`,
        text(mx + ox, my + oy + 5, String(i + 1), { size: 17, fill: C.b }),
      );
    }
    if (show === "corners") {
      const ox = ((x1 - 160) / 80) * 20;
      const oy = ((y1 - 92) / 80) * 20;
      out.push(
        `<circle cx="${x1}" cy="${y1}" r="8" fill="${C.a}"/>`,
        text(x1 + ox, y1 + oy + 5, String(i + 1), { size: 17, fill: C.a }),
      );
    }
  }
  if (show === "faces")
    out.push(
      text(160, 98, `1 ${T(L("flat face", "cara plana"))}`, { fill: C.c }),
    );
  return out.join("");
}
function solidVerts(kind) {
  const { w, h } = SOLID[kind];
  const x = 70;
  const y = 70;
  const dx = 55;
  const dy = -45;
  const f = [
    [x, y],
    [x + w, y],
    [x + w, y + h],
    [x, y + h],
  ];
  const b = f.map(([a, c]) => [a + dx, c + dy]);
  return { f, b };
}
function drawSolid(kind, show, T) {
  const { f, b } = solidVerts(kind);
  const edges = [
    [f[0], f[1], 1],
    [f[1], f[2], 1],
    [f[2], f[3], 1],
    [f[3], f[0], 1],
    [b[0], b[1], 1],
    [b[1], b[2], 1],
    [b[2], b[3], 0],
    [b[3], b[0], 0],
    [f[0], b[0], 1],
    [f[1], b[1], 1],
    [f[2], b[2], 1],
    [f[3], b[3], 0],
  ];
  const out = [
    `<polygon points="${[f[0], f[1], b[1], b[0]].map((v) => v.join(",")).join(" ")}" fill="#e6f4f2"/>`,
    `<polygon points="${[f[1], f[2], b[2], b[1]].map((v) => v.join(",")).join(" ")}" fill="#dce8f8"/>`,
    `<polygon points="${f.map((v) => v.join(",")).join(" ")}" fill="#eef4ff"/>`,
  ];
  edges.forEach(([p, r, seen], i) => {
    const hot = show === "edges";
    out.push(
      `<line x1="${p[0]}" y1="${p[1]}" x2="${r[0]}" y2="${r[1]}" stroke="${hot ? C.b : C.ink}" stroke-width="${hot ? 4 : 2.5}" ${seen ? "" : 'stroke-dasharray="6 5"'}/>`,
    );
    if (hot) {
      const mx = (p[0] + r[0]) / 2;
      const my = (p[1] + r[1]) / 2;
      out.push(
        `<rect x="${mx - 10}" y="${my - 10}" width="20" height="20" rx="4" fill="#fff" stroke="${C.b}"/>`,
        text(mx, my + 5, String(i + 1), { size: 17, fill: C.b }),
      );
    }
  });
  if (show === "corners")
    [...f, ...b].forEach(([x, y], i) => {
      const hidden = i === 7;
      out.push(
        `<circle cx="${x}" cy="${y}" r="8" fill="${hidden ? "#fff" : C.a}" stroke="${C.a}" stroke-width="3"/>`,
        text(x + (i < 4 ? -14 : 14), y - 10, String(i + 1), {
          size: 17,
          fill: C.a,
        }),
      );
    });
  if (show === "faces") {
    const cx = (pts) => pts.reduce((s, v) => s + v[0], 0) / pts.length;
    const cy = (pts) => pts.reduce((s, v) => s + v[1], 0) / pts.length;
    const front = f;
    const top = [f[0], f[1], b[1], b[0]];
    const side = [f[1], f[2], b[2], b[1]];
    [front, top, side].forEach((pts, i) =>
      out.push(
        text(cx(pts), cy(pts) + 6, String(i + 1), {
          size: 18,
          fill: C.c,
          weight: 800,
        }),
      ),
    );
    /* hidden faces are named in the sentence under the picture */
  }
  return out.join("");
}
export const shapesModel = model({
  choices: [
    {
      key: "shape",
      label: L("Shape", "Figura"),
      init: "hexagon",
      options: [...Object.entries(FLAT), ...Object.entries(SOLID)].map(
        ([value, v]) => ({ value, label: L(v.en, v.es) }),
      ),
    },
    {
      key: "show",
      label: L("Count", "Cuenta"),
      init: "sides",
      options: [
        { value: "sides", label: L("sides / edges", "lados / aristas") },
        { value: "corners", label: L("corners", "esquinas") },
        { value: "faces", label: L("flat faces", "caras planas") },
      ],
    },
  ],
  observed: (s, n) => n >= 2,
  draw(s, T) {
    const solid = Boolean(SOLID[s.shape]);
    const name = T(solid ? SOLID[s.shape] : FLAT[s.shape]);
    const A = T(L(/^[aeiou]/.test(name) ? "An" : "A", "Un"));
    const show = solid && s.show === "sides" ? "edges" : s.show;
    const body = solid
      ? drawSolid(s.shape, show, T)
      : drawFlat(s.shape, show, T);
    const n = solid ? 0 : FLAT[s.shape].n;
    const counts = solid
      ? { edges: 12, corners: 8, faces: 6 }
      : { edges: n, corners: n, faces: 1 };
    const tbl = table(
      T(L("What we counted", "Lo que contamos")),
      [
        T(L("Shape", "Figura")),
        T(solid ? L("Edges", "Aristas") : L("Sides", "Lados")),
        T(L("Corners", "Esquinas")),
        T(L("Flat faces", "Caras planas")),
      ],
      [
        [
          name,
          String(counts.edges),
          String(counts.corners),
          String(counts.faces),
        ],
      ],
    );
    const eq = solid
      ? s.show === "faces"
        ? T(
            L(
              `${A} ${name} has 6 flat faces. You can see 3. The other 3 are behind, on the left and underneath.`,
              `${A} ${name} tiene 6 caras planas. Ves 3. Las otras 3 están atrás, a la izquierda y abajo.`,
            ),
          )
        : s.show === "corners"
          ? T(
              L(
                `${A} ${name} has 8 corners: 4 in front and 4 in back. The white one is hidden.`,
                `${A} ${name} tiene 8 esquinas: 4 adelante y 4 atrás. La blanca está escondida.`,
              ),
            )
          : T(
              L(
                `${A} ${name} has 12 edges: 4 in front, 4 in back, 4 going back. Dashed edges are hidden.`,
                `${A} ${name} tiene 12 aristas: 4 adelante, 4 atrás y 4 que van hacia atrás. Las punteadas están escondidas.`,
              ),
            )
      : s.show === "faces"
        ? T(
            L(
              `${A} ${name} is flat. It is one flat face, with ${n} sides around it.`,
              `${A} ${name} es plano. Es una sola cara plana, con ${n} lados alrededor.`,
            ),
          )
        : T(
            L(
              `${A} ${name} has ${n} sides and ${n} corners. Each corner is where two sides meet.`,
              `${A} ${name} tiene ${n} lados y ${n} esquinas. Cada esquina es donde se juntan dos lados.`,
            ),
          );
    const label = `${name}: ${T(L("counting", "contando"))} ${T(L(show === "edges" ? "edges" : s.show, show === "edges" ? "aristas" : { sides: "lados", corners: "esquinas", faces: "caras" }[s.show]))}`;
    return { svg: svg(320, 210, label, body), table: tbl, eq };
  },
});

// Grade 1 · Equal shares ------------------------------------------------------------------------------------------
export const equalSharesModel = model({
  steppers: [
    {
      key: "n",
      label: L("Equal shares", "Partes iguales"),
      min: 2,
      max: 8,
      init: 4,
    },
    { key: "eaten", label: L("Eaten", "Comidas"), min: 0, max: 8, init: 1 },
    {
      key: "len",
      label: L("Inches in each", "Pulgadas cada una"),
      min: 1,
      max: 6,
      init: 3,
    },
  ],
  toggles: [
    {
      key: "unequal",
      label: L(
        "What if the cuts are not equal?",
        "¿Y si los cortes no son iguales?",
      ),
    },
  ],
  limit: (s) => ({ ...s, eaten: Math.min(s.eaten, s.n) }),
  draw(s, T) {
    const W = 320;
    const left = s.n - s.eaten;
    // Unequal cuts: the same number of pieces, but the widths differ (they still fill the whole).
    const weights = s.unequal
      ? Array.from({ length: s.n }, (_, i) => (i % 2 ? 1 : 2))
      : Array(s.n).fill(1);
    const total = weights.reduce((a, b) => a + b, 0);
    let x = 10;
    const out = [
      `<defs><pattern id="lm-eaten" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="${C.a}" stroke-width="3"/></pattern></defs>`,
    ];
    weights.forEach((w, i) => {
      const width = (w / total) * W;
      const eaten = i < s.eaten;
      out.push(
        `<rect x="${x}" y="20" width="${width}" height="54" fill="${eaten ? "url(#lm-eaten)" : "#e6f4f2"}" stroke="${C.ink}" stroke-width="2.5"/>`,
        !s.unequal && width > 28
          ? text(x + width / 2, 54, `${s.len} in`, {
              size: 17,
              fill: eaten ? C.a : C.c,
            })
          : "",
      );
      x += width;
    });
    out.push(
      `<line x1="10" y1="92" x2="${10 + W}" y2="92" stroke="${C.b}" stroke-width="3"/>`,
      `<line x1="10" y1="84" x2="10" y2="100" stroke="${C.b}" stroke-width="3"/><line x1="${10 + W}" y1="84" x2="${10 + W}" y2="100" stroke="${C.b}" stroke-width="3"/>`,
      text(
        10 + W / 2,
        118,
        s.unequal
          ? T(L("the whole", "la tira completa"))
          : `${T(L("the whole", "la tira completa"))}: ${s.n * s.len} in`,
        { fill: C.b },
      ),
      
    );
    const adds = Array(s.n).fill(s.len).join(" + ");
    const eq = s.unequal
      ? T(
          L(
            `These ${s.n} pieces are NOT equal shares: some are bigger. Equal shares must be the same size.`,
            `Estas ${s.n} piezas NO son partes iguales: algunas son más grandes. Las partes iguales deben ser del mismo tamaño.`,
          ),
        )
      : T(
          L(
            `${s.n} equal shares. ${s.eaten} eaten, so ${s.n} − ${s.eaten} = ${left} left. Each share is ${s.len} in, so the whole is ${adds} = ${s.n * s.len} in.`,
            `${s.n} partes iguales. Se comieron ${s.eaten}, así que quedan ${s.n} − ${s.eaten} = ${left}. Cada parte mide ${s.len} pulg, así que la tira completa mide ${adds} = ${s.n * s.len} pulg.`,
          ),
        );
    const label = T(
      L(
        `A strip cut into ${s.n} ${s.unequal ? "unequal" : "equal"} pieces, ${s.eaten} eaten`,
        `Una tira cortada en ${s.n} piezas ${s.unequal ? "desiguales" : "iguales"}, ${s.eaten} comidas`,
      ),
    );
    return {
      svg: svg(340, 126, label, out.join("")),
      eq,
      note: T(L("Striped pieces are eaten. The bar under the strip is the whole.", "Las piezas con rayas se comieron. La barra debajo de la tira es el todo.")),
    };
  },
});

// Grade 2 · Doubles and near doubles --------------------------------------------------------------------------------
export const doublesModel = model({
  steppers: [
    { key: "a", label: L("Number", "Número"), min: 1, max: 10, init: 6 },
  ],
  toggles: [
    {
      key: "near",
      label: L("Add 1 more to the second row", "Pon 1 más en la segunda fila"),
    },
  ],
  draw(s, T) {
    const out = [];
    const gap = Math.min(40, 270 / (s.a + 1.4));
    const r = Math.round(gap * 0.36);
    for (let i = 0; i < s.a; i += 1) {
      const x = 24 + i * gap;
      out.push(
        `<circle cx="${x}" cy="30" r="${r}" fill="${C.b}"/>`,
        `<circle cx="${x}" cy="74" r="${r}" fill="${C.b}"/>`,
        `<line x1="${x}" y1="42" x2="${x}" y2="62" stroke="${C.line}" stroke-width="2"/>`,
      );
    }
    if (s.near) {
      const x = 24 + s.a * gap;
      out.push(
        `<rect x="${x - r}" y="${74 - r}" width="${2 * r}" height="${2 * r}" rx="3" fill="${C.a}"/>`,
        text(x, 108, "+1", { fill: C.a }),
      );
    }
    out.push(
      text(24 + s.a * gap + (s.near ? gap : 0) - gap / 2 + 4, 36, `${s.a}`, {
        anchor: "start",
        fill: C.b,
      }),
      text(
        24 + (s.a + (s.near ? 1 : 0)) * gap - gap / 2 + 4,
        80,
        `${s.a + (s.near ? 1 : 0)}`,
        { anchor: "start", fill: s.near ? C.a : C.b },
      ),
    );
    const d = 2 * s.a;
    const eq = s.near
      ? T(
          L(
            `${s.a} + ${s.a + 1} is the double ${s.a} + ${s.a} = ${d}, and 1 more: ${d} + 1 = ${d + 1}.`,
            `${s.a} + ${s.a + 1} es el doble ${s.a} + ${s.a} = ${d}, y 1 más: ${d} + 1 = ${d + 1}.`,
          ),
        )
      : T(
          L(
            `Double ${s.a}: two rows of ${s.a}. Every dot has a partner. ${s.a} + ${s.a} = ${d}.`,
            `El doble de ${s.a}: dos filas de ${s.a}. Cada punto tiene pareja. ${s.a} + ${s.a} = ${d}.`,
          ),
        );
    const label = T(
      L(
        `Two rows of ${s.a} dots${s.near ? ", one extra square in the second row" : ""}`,
        `Dos filas de ${s.a} puntos${s.near ? ", con un cuadrado extra en la segunda fila" : ""}`,
      ),
    );
    return {
      svg: svg(
        340,
        116,
        label,
        out.join(""),
      ),
      eq,
    };
  },
  observed: (s, n) => n >= 2,
});

// Grade 2 · Tell time to five minutes -------------------------------------------------------------------------------
const two = (m) => String(m).padStart(2, "0");
const clockTime = (h, m) => `${h}:${two(m)}`;
export const clockModel = model({
  steppers: [
    { key: "h", label: L("Hour", "Hora"), min: 1, max: 12, init: 7 },
    {
      key: "m",
      label: L("Minute hand", "Minutero"),
      min: 0,
      max: 55,
      step: 5,
      init: 20,
      fmt: (v) => `:${two(v)}`,
    },
    {
      key: "later",
      label: L("Minutes later", "Minutos después"),
      min: 0,
      max: 60,
      step: 5,
      init: 15,
    },
  ],
  draw(s, T) {
    const cx = 120;
    const cy = 118;
    const R = 92;
    const out = [
      `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff" stroke="${C.ink}" stroke-width="3"/>`,
    ];
    for (let i = 0; i < 60; i += 1) {
      const a = (i / 60) * 2 * Math.PI;
      const r1 = i % 5 ? R - 5 : R - 10;
      out.push(
        `<line x1="${cx + r1 * Math.sin(a)}" y1="${cy - r1 * Math.cos(a)}" x2="${cx + R * Math.sin(a)}" y2="${cy - R * Math.cos(a)}" stroke="${C.ink}" stroke-width="${i % 5 ? 1 : 2.5}"/>`,
      );
    }
    for (let k = 1; k <= 12; k += 1) {
      const a = (k / 12) * 2 * Math.PI;
      out.push(
        text(
          cx + (R - 24) * Math.sin(a),
          cy - (R - 24) * Math.cos(a) + 6,
          String(k),
          { size: 19, weight: 700 },
        ),
      );
    }
    // The minutes the hand has swept, counted by fives (labels inside the arc).
    const end = s.m + s.later;
    if (s.later) {
      for (let t = s.m + 5; t <= end; t += 5) {
        const a = (t / 60) * 2 * Math.PI;
        out.push(
          `<circle cx="${cx + (R + 1) * Math.sin(a)}" cy="${cy - (R + 1) * Math.cos(a)}" r="5" fill="${C.c}"/>`,
        );
      }
    }
    const ma = (s.m / 60) * 2 * Math.PI;
    const ha = (((s.h % 12) + s.m / 60) / 12) * 2 * Math.PI;
    out.push(
      `<line x1="${cx}" y1="${cy}" x2="${cx + 50 * Math.sin(ha)}" y2="${cy - 50 * Math.cos(ha)}" stroke="${C.a}" stroke-width="8" stroke-linecap="round"/>`,
      `<line x1="${cx}" y1="${cy}" x2="${cx + 80 * Math.sin(ma)}" y2="${cy - 80 * Math.cos(ma)}" stroke="${C.b}" stroke-width="5" stroke-linecap="round"/>`,
      `<circle cx="${cx}" cy="${cy}" r="6" fill="${C.ink}"/>`,
    );
    const lh = ((s.h - 1 + Math.floor(end / 60)) % 12) + 1;
    const lm = end % 60;
    out.push(
      text(234, 60, T(L("Now", "Ahora")), {
        anchor: "start",
        size: 17,
        fill: C.ink,
      }),
      text(234, 88, clockTime(s.h, s.m), {
        anchor: "start",
        size: 26,
        weight: 800,
      }),
      text(234, 130, `${s.later} ${T(L("min later", "min después"))}`, {
        anchor: "start",
        size: 17,
        fill: C.c,
      }),
      text(234, 158, clockTime(lh, lm), {
        anchor: "start",
        size: 26,
        weight: 800,
        fill: C.c,
      }),
    );
    const n = s.m / 5;
    const fives = Array.from({ length: n }, (_, i) => (i + 1) * 5).join(", ");
    const now = s.m
      ? T(
          L(
            `The long hand points to the ${n}. Count by 5s: ${fives}. It is ${clockTime(s.h, s.m)}.`,
            `La aguja larga apunta al ${n}. Cuenta de 5 en 5: ${fives}. Son las ${clockTime(s.h, s.m)}.`,
          ),
        )
      : T(
          L(
            `The long hand points to the 12: 0 minutes. It is ${clockTime(s.h, 0)}.`,
            `La aguja larga apunta al 12: 0 minutos. Son las ${clockTime(s.h, 0)}.`,
          ),
        );
    const then = s.later
      ? T(
          L(
            ` ${s.later / 5} more jumps of 5 is ${s.later} minutes, so the time is ${clockTime(lh, lm)}.`,
            ` ${s.later / 5} saltos más de 5 son ${s.later} minutos, así que la hora es ${clockTime(lh, lm)}.`,
          ),
        )
      : "";
    return {
      note: T(L("Blue long hand = minutes. Orange short hand = hour. Green dots = the minutes that pass.", "Aguja larga azul = minutos. Aguja corta anaranjada = hora. Puntos verdes = los minutos que pasan.")),
      svg: svg(
        372,
        236,
        `${T(L("Clock showing", "Reloj que marca"))} ${clockTime(s.h, s.m)}`,
        out.join(""),
        260,
      ),
      eq: esc(now + then),
    };
  },
});

// Grade 2 · 10 more, 10 less, 100 more, 100 less -------------------------------------------------------------------
function blocks(n) {
  const h = Math.floor(n / 100);
  const t = Math.floor(n / 10) % 10;
  const o = n % 10;
  const out = [];
  const F = 34; // a hundred flat
  for (let i = 0; i < h; i += 1) {
    const x = 6 + i * (F + 4);
    out.push(`<rect x="${x}" y="6" width="${F}" height="${F}" fill="${C.b}" stroke="#fff"/>`);
    for (let g = 1; g < 10; g += 1)
      out.push(`<line x1="${x + g * 3.4}" y1="6" x2="${x + g * 3.4}" y2="${6 + F}" stroke="#fff" stroke-width="0.6"/><line x1="${x}" y1="${6 + g * 3.4}" x2="${x + F}" y2="${6 + g * 3.4}" stroke="#fff" stroke-width="0.6"/>`);
  }
  const y2 = h ? 6 + F + 10 : 6;
  let x = 6;
  for (let i = 0; i < t; i += 1) {
    out.push(`<rect x="${x}" y="${y2}" width="12" height="60" fill="${C.c}" stroke="#fff"/>`);
    for (let g = 1; g < 10; g += 1) out.push(`<line x1="${x}" y1="${y2 + g * 6}" x2="${x + 12}" y2="${y2 + g * 6}" stroke="#fff" stroke-width="0.6"/>`);
    x += 16;
  }
  x += 10;
  for (let i = 0; i < o; i += 1)
    out.push(`<rect x="${x + (i % 3) * 16}" y="${y2 + Math.floor(i / 3) * 16}" width="12" height="12" fill="${C.a}"/>`);
  return { body: out.join(""), w: 350, h: y2 + 66 };
}
export const tensModel = model({
  choices: [
    {
      key: "start",
      label: L("Start at", "Empieza en"),
      init: "281",
      options: ["281", "595", "704"].map((v) => ({ value: v, label: L(v, v) })),
    },
  ],
  steppers: [
    {
      key: "hun",
      label: L("Hundreds moved", "Centenas movidas"),
      min: -2,
      max: 2,
      init: 0,
      fmt: (v) => (v > 0 ? `+${v}` : `${v}`),
    },
    {
      key: "ten",
      label: L("Tens moved", "Decenas movidas"),
      min: -5,
      max: 5,
      init: 0,
      fmt: (v) => (v > 0 ? `+${v}` : `${v}`),
    },
  ],
  draw(s, T) {
    const start = Number(s.start);
    const n = start + 100 * s.hun + 10 * s.ten;
    const b = blocks(n);
    const d0 = String(start).padStart(3, "0").split("");
    const d1 = String(n).padStart(3, "0").split("");
    const head = [
      T(L("Hundreds", "Centenas")),
      T(L("Tens", "Decenas")),
      T(L("Ones", "Unidades")),
    ];
    const tbl = `<table class="lm-table" style="width:100%;max-width:400px;table-layout:fixed;font-size:0.88rem"><colgroup><col style="width:17%"><col><col><col></colgroup><caption>${esc(T(L("Place-value chart (changed digits are boxed)", "Tabla de valor posicional (los dígitos que cambian van en recuadro)")))}</caption><thead><tr><th scope="col" style="padding:6px 4px"></th>${head.map((h) => `<th scope="col" style="padding:6px 4px">${esc(h)}</th>`).join("")}</tr></thead><tbody>
      <tr><th scope="row" style="padding:6px 4px">${esc(T(L("Start", "Inicio")))}</th>${d0.map((d) => `<td style="padding:6px 4px">${d}</td>`).join("")}</tr>
      <tr class="lm-row-on"><th scope="row" style="padding:6px 4px">${esc(T(L("Now", "Ahora")))}</th>${d1.map((d, i) => `<td style="padding:6px 4px${d !== d0[i] ? ';outline:3px solid var(--q2);outline-offset:-3px;text-decoration:underline' : ''}">${d}</td>`).join("")}</tr></tbody></table>`;
    const delta = 100 * s.hun + 10 * s.ten;
    const parts = [];
    if (s.hun)
      parts.push(
        T(
          L(
            `${Math.abs(s.hun)} hundred ${s.hun > 0 ? "more" : "less"}`,
            `${Math.abs(s.hun)} centena(s) ${s.hun > 0 ? "más" : "menos"}`,
          ),
        ),
      );
    if (s.ten)
      parts.push(
        T(
          L(
            `${Math.abs(s.ten)} ten${Math.abs(s.ten) > 1 ? "s" : ""} ${s.ten > 0 ? "more" : "less"}`,
            `${Math.abs(s.ten)} decena(s) ${s.ten > 0 ? "más" : "menos"}`,
          ),
        ),
      );
    const crossed = Math.floor(n / 100) - Math.floor(start / 100) !== s.hun;
    const eq = delta
      ? `${start} ${delta > 0 ? "+" : "−"} ${Math.abs(delta)} = ${n}. ${T(L(`${parts.join(" and ")}. The ones digit never changes.`, `${parts.join(" y ")}. El dígito de las unidades no cambia.`))}${crossed ? T(L(" The tens went past 9, so 10 tens became 1 hundred (or 1 hundred became 10 tens).", " Las decenas pasaron de 9, así que 10 decenas se hicieron 1 centena (o 1 centena se hizo 10 decenas).")) : ""}`
      : T(
          L(
            `${start}: press + or − to move by tens or hundreds. Watch which digit changes.`,
            `${start}: oprime + o − para moverte de diez en diez o de cien en cien. Mira qué dígito cambia.`,
          ),
        );
    return {
      svg: svg(
        b.w,
        b.h,
        T(L(`Base-ten blocks for ${n}`, `Bloques de base diez para ${n}`)),
        b.body,
        120,
      ),
      table: tbl,
      eq: esc(eq),
    };
  },
  observed: (s, n) => n >= 2,
});

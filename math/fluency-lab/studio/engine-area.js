// Area engine: arrays and area models for multiplication and division, and rectangle area, perimeter,
// triangle area and volume. A split never changes the whole: frames record `parts` and `total` so the tests
// can check that the partial products always add to the product.
import { COLORS, L, clean, esc, keyed, num, txt } from "./core.js";
import { frames, grid, wrap } from "./engine-area-frames.js";

export { frames };

const place = (n) => {
  const s = String(n);
  return [...s].map((d, i) => Number(d) * 10 ** (s.length - 1 - i)).filter(Boolean);
};

export function parse(question) {
  const q = clean(question);
  let m = q.match(/^(\d+) × (\d+) = \?$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 0 || b === 0) return null;
    if (Math.max(a, b) <= 12) return { engine: "area", kind: "array", a, b, total: a * b };
    const [pa, pb] = [place(a), place(b)];
    if (String(a).length > 4 || String(b).length > 4 || pa.length * pb.length > 9) return null;
    return { engine: "area", kind: "model", a, b, pa, pb, total: a * b };
  }
  m = q.match(/^(\d+) ÷ (\d+) = \?$/);
  if (m) {
    const [n, d] = [Number(m[1]), Number(m[2])];
    return d > 0 && d <= 12 && n % d === 0 && n / d <= 12 && n > 0
      ? { engine: "area", kind: "divide", n, d, total: n / d }
      : null;
  }
  m = q.match(/^Area of a rectangle with length (\d+) and width (\d+)\?$/);
  if (m)
    return { engine: "area", kind: "area", l: Number(m[1]), w: Number(m[2]), total: m[1] * m[2] };
  m = q.match(/^Perimeter of a rectangle with length (\d+) and width (\d+)\?$/);
  if (m)
    return {
      engine: "area",
      kind: "perimeter",
      l: Number(m[1]),
      w: Number(m[2]),
      total: 2 * (Number(m[1]) + Number(m[2])),
    };
  m = q.match(/^Area of a triangle with base (\d+) and height (\d+)\?$/);
  if (m)
    return (Number(m[1]) * Number(m[2])) % 2 === 0
      ? {
          engine: "area",
          kind: "triangle",
          b: Number(m[1]),
          h: Number(m[2]),
          total: (m[1] * m[2]) / 2,
        }
      : null;
  m = q.match(/^Volume of a rectangular prism: (\d+) × (\d+) × (\d+)\?$/);
  if (m)
    return {
      engine: "area",
      kind: "volume",
      l: Number(m[1]),
      w: Number(m[2]),
      h: Number(m[3]),
      total: m[1] * m[2] * m[3],
    };
  return null;
}

// A grid of unit squares; rows beyond `fill` are drawn empty.

export const answer = (s) => s.total;

export function predicts(s) {
  if (s.kind === "array" && s.b >= 6)
    return [
      {
        at: 1,
        q: L(
          `We split ${s.b} columns into 5 and ${s.b - 5}. What do we do with the two products?`,
          `Dividimos ${s.b} columnas en 5 y ${s.b - 5}. ¿Qué hacemos con los dos productos?`,
        ),
        choices: [
          {
            t: L("Add them.", "Sumarlos."),
            ok: true,
            why: L(
              "The two parts together are the whole array, so their squares add up.",
              "Las dos partes juntas son el arreglo completo, así que sus cuadros se suman.",
            ),
          },
          {
            t: L("Multiply them.", "Multiplicarlos."),
            ok: false,
            why: L(
              "Multiplying would count far more squares than the array has.",
              "Multiplicar contaría muchos más cuadros de los que tiene el arreglo.",
            ),
          },
        ],
        explain: [
          {
            t: L(
              "Because the two parts are pieces of one array, so together they make all of it.",
              "Porque las dos partes son trozos de un arreglo, así que juntas lo forman completo.",
            ),
            ok: true,
          },
          {
            t: L("Because adding is always easier.", "Porque sumar siempre es más fácil."),
            ok: false,
          },
        ],
      },
    ];
  if (s.kind === "model")
    return [
      {
        at: 1,
        q: L(
          `After finding every small product, what do we do to get ${s.a} × ${s.b}?`,
          `Después de hallar cada producto pequeño, ¿qué hacemos para obtener ${s.a} × ${s.b}?`,
        ),
        choices: [
          {
            t: L("Add all the small products.", "Sumar todos los productos pequeños."),
            ok: true,
            why: L(
              "The small rectangles together fill the whole rectangle, so their areas add.",
              "Los rectángulos pequeños juntos llenan el rectángulo entero, así que sus áreas se suman.",
            ),
          },
          {
            t: L("Multiply the small products.", "Multiplicar los productos pequeños."),
            ok: false,
            why: L(
              "Multiplying areas does not give an area of the big rectangle. Areas of pieces add.",
              "Multiplicar áreas no da el área del rectángulo grande. Las áreas de las partes se suman.",
            ),
          },
          {
            t: L("Use only the biggest piece.", "Usar solo la parte mayor."),
            ok: false,
            why: L(
              "The smaller pieces are part of the rectangle too. Leaving one out gives too little.",
              "Las partes menores también son del rectángulo. Dejar una fuera da muy poco.",
            ),
          },
        ],
        explain: [
          {
            t: L(
              "Because the small rectangles fit together to make the big one.",
              "Porque los rectángulos pequeños encajan para formar el grande.",
            ),
            ok: true,
          },
          {
            t: L(
              "Because the biggest part decides the answer.",
              "Porque la parte mayor decide la respuesta.",
            ),
            ok: false,
          },
        ],
      },
    ];
  if (s.kind === "divide")
    return [
      {
        at: 1,
        q: L(
          `We put ${s.d} squares in each row. What does the number of rows tell us?`,
          `Ponemos ${s.d} cuadros en cada fila. ¿Qué nos dice el número de filas?`,
        ),
        choices: [
          {
            t: L(
              `How many groups of ${s.d} fit in ${s.n}.`,
              `Cuántos grupos de ${s.d} caben en ${s.n}.`,
            ),
            ok: true,
            why: L(
              "Each row is one group of the divisor, so the row count is the quotient.",
              "Cada fila es un grupo del divisor, así que el número de filas es el cociente.",
            ),
          },
          {
            t: L(`How many squares there are in all.`, `Cuántos cuadros hay en total.`),
            ok: false,
            why: L(`The total is ${s.n} and does not change.`, `El total es ${s.n} y no cambia.`),
          },
        ],
      },
    ];
  if (s.kind === "triangle")
    return [
      {
        at: 1,
        q: L(
          "Two equal triangles make the rectangle. How does one triangle's area compare?",
          "Dos triángulos iguales forman el rectángulo. ¿Cómo es el área de un triángulo?",
        ),
        choices: [
          {
            t: L("Half of the rectangle.", "La mitad del rectángulo."),
            ok: true,
            why: L(
              "Two equal pieces that fill the rectangle: each is half.",
              "Dos partes iguales que llenan el rectángulo: cada una es la mitad.",
            ),
          },
          {
            t: L("The same as the rectangle.", "Igual que el rectángulo."),
            ok: false,
            why: L(
              "The triangle covers only part of the rectangle.",
              "El triángulo cubre solo una parte del rectángulo.",
            ),
          },
        ],
      },
    ];
  return [];
}

export function hints(s) {
  const list = frames(s);
  // Never a frame that already shows the total: the first picture that sets up the structure.
  const mid = list.find((f) => ["split", "rows", "row", "four", "cut", "stack"].includes(f.id)) || list[0];
  const texts = {
    array: [
      L(
        "Picture equal rows. Could you split the array into two easier facts?",
        "Imagina filas iguales. ¿Podrías dividir el arreglo en dos datos más fáciles?",
      ),
      L(
        "Break the bigger factor into 5 and the rest.",
        "Descompón el factor mayor en 5 y el resto.",
      ),
    ],
    model: [
      L(
        "Split each number by place value and look for easier products.",
        "Divide cada número por valor posicional y busca productos más fáciles.",
      ),
      L(
        "Find the product of every pair of parts, then add them all.",
        "Halla el producto de cada par de partes y luego súmalos todos.",
      ),
    ],
    divide: [
      L(
        "Think: what number of groups of the divisor fits in the total?",
        "Piensa: ¿cuántos grupos del divisor caben en el total?",
      ),
      L(
        "Put the divisor in each row and count rows.",
        "Pon el divisor en cada fila y cuenta las filas.",
      ),
    ],
    area: [
      L(
        "Area counts square units inside. How many in one row?",
        "El área cuenta unidades cuadradas dentro. ¿Cuántas hay en una fila?",
      ),
      L("Count one row, then think how many rows.", "Cuenta una fila y piensa cuántas filas hay."),
    ],
    perimeter: [
      L(
        "Perimeter is the distance around. Which sides do you need to add?",
        "El perímetro es la distancia alrededor. ¿Qué lados debes sumar?",
      ),
      L(
        "A rectangle has four sides. Opposite sides match.",
        "Un rectángulo tiene cuatro lados. Los lados opuestos son iguales.",
      ),
    ],
    triangle: [
      L(
        "Draw a rectangle around the triangle. What part is the triangle?",
        "Dibuja un rectángulo alrededor del triángulo. ¿Qué parte es el triángulo?",
      ),
      L(
        "Find the rectangle's area first, then take half.",
        "Halla primero el área del rectángulo y luego toma la mitad.",
      ),
    ],
    volume: [
      L(
        "Volume counts cubes. How many cubes make one layer?",
        "El volumen cuenta cubos. ¿Cuántos cubos forman una capa?",
      ),
      L(
        "Find the cubes in one layer, then count the layers.",
        "Halla los cubos de una capa y cuenta las capas.",
      ),
    ],
  }[s.kind];
  return [
    { text: texts[0] },
    {
      text: L(
        "The picture shows the shape of the problem.",
        "El dibujo muestra la forma del problema.",
      ),
      frame: mid,
    },
    { text: texts[1], frame: list[0] },
  ];
}

export function diagnose(s, raw) {
  const v = num(raw);
  if (v === null || v === s.total) return null;
  if (s.kind === "array" || s.kind === "model") return v === s.a + s.b ? "addedFactors" : null;
  if (s.kind === "area") return v === 2 * (s.l + s.w) ? "perimeterForArea" : null;
  if (s.kind === "perimeter")
    return v === s.l * s.w ? "areaForPerimeter" : v === s.l + s.w ? "halfAround" : null;
  if (s.kind === "triangle") return v === s.b * s.h ? "forgotHalf" : null;
  if (s.kind === "divide") return v === s.n - s.d ? "subtracted" : null;
  return null;
}
export const tags = {
  addedFactors: {
    label: L("Added the factors", "Sumó los factores"),
    tip: L(
      "Multiplying counts equal rows. Build the array and count all the squares.",
      "Multiplicar cuenta filas iguales. Arma el arreglo y cuenta todos los cuadros.",
    ),
  },
  perimeterForArea: {
    label: L("Found the perimeter instead of the area", "Halló el perímetro en lugar del área"),
    tip: L(
      "Area covers the inside with squares; perimeter is only the edge. Fill the rectangle with rows.",
      "El área cubre el interior con cuadros; el perímetro es solo el borde. Llena el rectángulo con filas.",
    ),
  },
  areaForPerimeter: {
    label: L("Found the area instead of the perimeter", "Halló el área en lugar del perímetro"),
    tip: L(
      "Perimeter is the distance around the edge. Add the four sides.",
      "El perímetro es la distancia por el borde. Suma los cuatro lados.",
    ),
  },
  halfAround: {
    label: L("Added only two sides", "Sumó solo dos lados"),
    tip: L(
      "A rectangle has four sides. Opposite sides are equal, so add all four.",
      "Un rectángulo tiene cuatro lados. Los opuestos son iguales, así que suma los cuatro.",
    ),
  },
  forgotHalf: {
    label: L("Found the rectangle, not the triangle", "Halló el rectángulo, no el triángulo"),
    tip: L(
      "The triangle is half of the rectangle. Take half of the product.",
      "El triángulo es la mitad del rectángulo. Toma la mitad del producto.",
    ),
  },
  subtracted: {
    label: L("Subtracted instead of dividing", "Restó en lugar de dividir"),
    tip: L(
      "Dividing asks how many equal groups fit. Make rows of the divisor and count the rows.",
      "Dividir pregunta cuántos grupos iguales caben. Haz filas del divisor y cuenta las filas.",
    ),
  },
};

// ----- Build -----
const hasBuild = (s) => (s.kind === "array" && s.b >= 6) || (s.kind === "model" && (s.pa.length > 1 || s.pb.length > 1)) || s.kind === "divide" || s.kind === "area" || s.kind === "perimeter";
export const build = {
  available: hasBuild,
  prompt(s) {
    if (s.kind === "divide")
      return L(
        `Arrange the ${s.n} squares in rows of ${s.d}.`,
        `Acomoda los ${s.n} cuadros en filas de ${s.d}.`,
      );
    if (s.kind === "area" || s.kind === "perimeter")
      return L(
        `Build a rectangle ${s.l} long and ${s.w} wide.`,
        `Construye un rectángulo de ${s.l} de largo y ${s.w} de ancho.`,
      );
    return L(
      `Split ${bigger(s)} into two parts to make easier facts. Try to make one part ${s.kind === "array" ? "5" : "a number of tens"}.`,
      `Divide ${bigger(s)} en dos partes para hacer datos más fáciles. Intenta que una parte sea ${s.kind === "array" ? "5" : "un número de decenas"}.`,
    );
  },
  init: (s) =>
    s.kind === "divide"
      ? { per: 12 }
      : s.kind === "area" || s.kind === "perimeter"
        ? { l: 1, w: 1 }
        : { s: Math.max(1, Math.floor(bigger(s) / 2)) },
  render(st, s) {
    const stepper = (id, arg, label) => ({ id, arg, label });
    if (s.kind === "divide") {
      const rows = Math.ceil(s.n / st.per);
      const cell = Math.min(30, 420 / st.per, 190 / rows);
      let out = "";
      for (let i = 0; i < s.n; i += 1)
        out += keyed(
          `t${i}`,
          280 - (st.per * cell) / 2 + (i % st.per) * cell,
          36 + Math.floor(i / st.per) * cell,
          `<rect width="${cell - 3}" height="${cell - 3}" rx="4" fill="${Math.floor(i / st.per) % 2 ? COLORS.hundreds : COLORS.whole}" fill-opacity=".9"/>`,
        );
      const done = st.per === s.d;
      const alt = L(
        `${s.n} squares in rows of ${st.per}: ${rows} rows${s.n % st.per ? " with some left over" : ""}.`,
        `${s.n} cuadros en filas de ${st.per}: ${rows} filas.`,
      );
      return {
        svg: wrap(out).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
        alt,
        controls: [
          stepper("per", -1, L("Fewer in a row", "Menos por fila")),
          stepper("per", 1, L("More in a row", "Más por fila")),
        ],
        status: done
          ? L(
              `${rows} rows of ${s.d}. So ${s.n} ÷ ${s.d} = ${rows}.`,
              `${rows} filas de ${s.d}. Así ${s.n} ÷ ${s.d} = ${rows}.`,
            )
          : L(
              `${st.per} in a row makes ${rows} row${rows > 1 ? "s" : ""}${s.n % st.per ? ", but the last row is not full" : ""}.`,
              `${st.per} por fila hace ${rows} fila${rows > 1 ? "s" : ""}.`,
            ),
      };
    }
    if (s.kind === "area" || s.kind === "perimeter") {
      const g = grid(st.w, st.l, { max: 440, hmax: 170 });
      const val = s.kind === "area" ? st.l * st.w : 2 * (st.l + st.w);
      const done = st.l === s.l && st.w === s.w;
      const alt = L(`A rectangle ${st.l} by ${st.w}.`, `Un rectángulo de ${st.l} por ${st.w}.`);
      const label =
        s.kind === "area"
          ? L(
              `Area so far: ${st.l} × ${st.w} = ${val}`,
              `Área hasta ahora: ${st.l} × ${st.w} = ${val}`,
            )
          : L(
              `Perimeter so far: ${st.l} + ${st.w} + ${st.l} + ${st.w} = ${val}`,
              `Perímetro hasta ahora: ${st.l} + ${st.w} + ${st.l} + ${st.w} = ${val}`,
            );
      return {
        svg: wrap(g.out).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
        alt,
        controls: [
          stepper("l", -1, L("Shorter", "Más corto")),
          stepper("l", 1, L("Longer", "Más largo")),
          stepper("w", -1, L("Less wide", "Menos ancho")),
          stepper("w", 1, L("Wider", "Más ancho")),
        ],
        status: done
          ? L(`That is the rectangle. ${label.en}`, `Ese es el rectángulo. ${label.es}`)
          : label,
      };
    }
    const n = bigger(s);
    const other = s.a === n ? s.b : s.a;
    const [p1, p2] = [st.s, n - st.s];
    const alt = L(`${n} split into ${p1} and ${p2}.`, `${n} dividido en ${p1} y ${p2}.`);
    const done = s.kind === "array" ? p1 === 5 || p2 === 5 : p1 % 10 === 0 && p2 < 10 && p1 > 0;
    const w = 400;
    const out = `<rect x="90" y="60" width="${(p1 / n) * w}" height="120" rx="8" fill="${COLORS.whole}" fill-opacity=".85"/><rect x="${90 + (p1 / n) * w + 6}" y="60" width="${(p2 / n) * w - 6}" height="120" rx="8" fill="${COLORS.hundreds}" fill-opacity=".85"/>${txt(90 + (p1 / n) * w * 0.5, 128, `${other} × ${p1} = ${other * p1}`, { size: 17, fill: "#fff" })}${txt(90 + (p1 / n) * w + (p2 / n) * w * 0.5, 128, `${other} × ${p2} = ${other * p2}`, { size: 17, fill: "#fff" })}${txt(290, 46, `${n} = ${p1} + ${p2}`, { size: 20 })}${txt(290, 214, `${other * p1} + ${other * p2} = ${other * n}`, { size: 22 })}`;
    return {
      svg: wrap(out, 240).replace('aria-label=""', `aria-label="${esc(alt.en)}"`),
      alt,
      controls: [
        stepper("s", -1, L("Move the split left", "Mover el corte a la izquierda")),
        stepper("s", 1, L("Move the split right", "Mover el corte a la derecha")),
      ],
      status: done
        ? L(
            `Nice split! ${other} × ${p1} and ${other} × ${p2} are easy, and they add to ${other * n}.`,
            `¡Buen corte! ${other} × ${p1} y ${other} × ${p2} son fáciles y suman ${other * n}.`,
          )
        : L(
            `Any split works because the parts add to the whole. Try for an easier fact.`,
            `Cualquier corte sirve porque las partes suman el todo. Busca un dato más fácil.`,
          ),
    };
  },
  act(st, id, arg, s) {
    if (id === "per") {
      const per = st.per + arg;
      return per < 1 || per > 12
        ? { state: st, ok: false, msg: L("That is as far as this goes.", "Hasta aquí se puede.") }
        : { state: { per }, ok: true };
    }
    if (id === "l" || id === "w") {
      const v = Math.min(20, Math.max(1, st[id] + arg));
      return { state: { ...st, [id]: v }, ok: v !== st[id] };
    }
    const sp = st.s + arg;
    return sp < 1 || sp > bigger(s) - 1
      ? {
          state: st,
          ok: false,
          msg: L("Both parts need at least 1.", "Cada parte necesita al menos 1."),
        }
      : { state: { s: sp }, ok: true };
  },
  done(st, s) {
    if (s.kind === "divide") return st.per === s.d;
    if (s.kind === "area" || s.kind === "perimeter") return st.l === s.l && st.w === s.w;
    const n = bigger(s);
    return s.kind === "array"
      ? st.s === 5 || n - st.s === 5
      : st.s % 10 === 0 && n - st.s < 10 && st.s > 0;
  },
};
const bigger = (s) => (s.kind === "array" ? Math.max(s.a, s.b) : s.kind === "model" ? (s.pa.length > s.pb.length || (s.pa.length === s.pb.length && s.a >= s.b) ? s.a : s.b) : 0);

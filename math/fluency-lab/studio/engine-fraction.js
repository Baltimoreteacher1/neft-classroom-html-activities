// Fraction engine: equivalent fractions, comparing, and adding or subtracting with unlike denominators.
// A cut turns every piece into k equal smaller pieces, so the shaded amount never changes; only the count of
// pieces does. Frames record `shaded` and `total` so the tests can confirm a/b stays equal to the picture.
import { COLORS, L, clean, esc, frame, gcd, keyed, lcm, num, svgWrap, txt } from "./core.js";

export function parse(question) {
  const q = clean(question);
  let m = q.match(/^(\d+)\/(\d+) = (\d+|□)\/(\d+|□)$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 0 || b === 0) return null;
    const known = m[3] === "□" ? { which: "c", v: Number(m[4]) } : { which: "d", v: Number(m[3]) };
    if (m[3] === "□" && m[4] === "□") return null;
    // m[3] is the numerator, m[4] the denominator
    const c = m[3] === "□" ? null : Number(m[3]);
    const d = m[4] === "□" ? null : Number(m[4]);
    let factor = null;
    if (c !== null)
      factor =
        c % a === 0 ? { kind: "mul", n: c / a } : a % c === 0 ? { kind: "div", n: a / c } : null;
    else
      factor =
        d % b === 0 ? { kind: "mul", n: d / b } : b % d === 0 ? { kind: "div", n: b / d } : null;
    if (!factor || factor.n < 1 || factor.n > 12) return null;
    const mul = factor.kind === "mul";
    const [rc, rd] = mul ? [a * factor.n, b * factor.n] : [a / factor.n, b / factor.n];
    if (!Number.isInteger(rc) || !Number.isInteger(rd)) return null;
    return {
      engine: "fraction",
      mode: "equiv",
      a,
      b,
      c: rc,
      d: rd,
      factor,
      missing: c === null ? "numerator" : "denominator",
      known: known.v,
    };
  }
  m = q.match(/^(\d+)\/(\d+) ___ (\d+)\/(\d+)$/);
  if (m) {
    const [a, b, c, d] = m.slice(1).map(Number);
    if (b === 0 || d === 0) return null;
    return { engine: "fraction", mode: "compare", a, b, c, d, L: lcm(b, d) };
  }
  m = q.match(/^(\d+)\/(\d+) ([+−-]) (\d+)\/(\d+) = \?$/);
  if (m) {
    const [a, b, c, d] = [m[1], m[2], m[4], m[5]].map(Number);
    const op = m[3] === "+" ? "+" : "-";
    if (b === 0 || d === 0) return null;
    if (op === "-" && a * d < c * b) return null;
    return { engine: "fraction", mode: "addsub", op, a, b, c, d, L: lcm(b, d) };
  }
  return null;
}

const W = 440;
const X0 = 60;
// A bar of `total` equal pieces with `shaded` filled; `cuts` marks the original boundaries with a thicker line.
function bar(
  y,
  total,
  shaded,
  { color = COLORS.whole, label = "", tag = "", base = 0, keyPrefix = "b", group = 0 } = {},
) {
  const w = W / total;
  let out = "";
  for (let i = 0; i < total; i += 1)
    out += keyed(
      `${keyPrefix}${i}`,
      X0 + i * w,
      y,
      `<rect width="${w}" height="46" fill="${i < shaded ? color : "#fff"}" fill-opacity="${i < shaded ? 0.85 : 1}" stroke="#fff" stroke-width="${total > 24 ? 1 : 2}"/>`,
    );
  out += `<rect x="${X0}" y="${y}" width="${W}" height="46" fill="none" stroke="${COLORS.ink}" stroke-width="2" rx="3"/>`;
  if (base > 1) {
    const step = total / base;
    for (let j = 1; j < base; j += 1)
      out += `<line x1="${X0 + j * step * w}" x2="${X0 + j * step * w}" y1="${y - 4}" y2="${y + 50}" stroke="${COLORS.ink}" stroke-width="3"/>`;
  }
  if (group > 1)
    for (let j = 0; j < total / group; j += 1)
      out += `<rect x="${X0 + j * group * w + 2}" y="${y - 6}" width="${group * w - 4}" height="58" rx="8" fill="none" stroke="${COLORS.warn}" stroke-width="3"/>`;
  if (label) out += txt(X0 - 8, y + 30, label, { size: 20, anchor: "end", fill: color });
  if (tag) out += txt(X0 + W + 8, y + 30, tag, { size: 15, anchor: "start", fill: COLORS.mute });
  return out;
}
const frac = (n, d) => `${n}/${d}`;
const altBar = (n, d, k = 1) =>
  L(
    `A bar cut into ${d * k} equal pieces with ${n * k} shaded, which is ${frac(n, d)}.`,
    `Una barra con ${d * k} partes iguales y ${n * k} sombreadas, que es ${frac(n, d)}.`,
  );
const wrap = (body, alt) => svgWrap(body, alt.en, { h: 190 });
const mk = (id, cap, easy, eq, body, alt, meta) =>
  Object.assign(frame({ id, cap, easy, eq, svg: wrap(body, alt), alt }), { meta });

export function frames(spec) {
  if (spec.mode === "equiv") return equivFrames(spec);
  if (spec.mode === "compare") return compareFrames(spec);
  return addFrames(spec);
}

function equivFrames({ a, b, c, d, factor }) {
  const n = factor.n;
  const mul = factor.kind === "mul";
  const [big, bigD] = mul ? [c, d] : [a, b];
  const [small, smallD] = mul ? [a, b] : [c, d];
  const out = [];
  out.push(
    mk(
      "show",
      L(
        `Here is ${frac(a, b)}: ${b} equal pieces, ${a} shaded.`,
        `Aquí está ${frac(a, b)}: ${b} partes iguales, ${a} sombreadas.`,
      ),
      L(`${frac(a, b)}: ${a} of ${b} pieces.`, `${frac(a, b)}: ${a} de ${b} partes.`),
      frac(a, b),
      bar(60, b, a, { label: frac(a, b), keyPrefix: "x" }),
      altBar(a, b),
      { shaded: a / b },
    ),
  );
  if (mul)
    out.push(
      mk(
        "cut",
        L(
          `Cut every piece into ${n} equal parts. The shaded amount is the same; there are just more, smaller pieces.`,
          `Corta cada parte en ${n} partes iguales. La parte sombreada es igual; solo hay más partes, más pequeñas.`,
        ),
        L(`Cut each piece into ${n}.`, `Corta cada parte en ${n}.`),
        `${frac(a, b)} → ×${n}`,
        bar(60, d, c, { label: frac(c, d), base: b, keyPrefix: "x" }),
        altBar(a, b, n),
        { shaded: c / d },
      ),
    );
  else
    out.push(
      mk(
        "join",
        L(
          `Join the pieces into groups of ${n}. The shaded amount is the same; there are fewer, bigger pieces.`,
          `Junta las partes en grupos de ${n}. La parte sombreada es igual; hay menos partes, más grandes.`,
        ),
        L(`Join pieces in groups of ${n}.`, `Junta las partes en grupos de ${n}.`),
        `${frac(a, b)} → ÷${n}`,
        bar(60, b, a, { label: frac(a, b), group: n, keyPrefix: "x" }) +
          bar(120, d, c, { label: frac(c, d), keyPrefix: "y" }),
        L(
          `The ${b} pieces joined in groups of ${n} give ${d} bigger pieces with ${c} shaded.`,
          `Las ${b} partes unidas en grupos de ${n} dan ${d} partes mayores con ${c} sombreadas.`,
        ),
        { shaded: c / d },
      ),
    );
  const op = mul ? "×" : "÷";
  out.push(
    mk(
      "rule",
      L(
        `${mul ? "Multiply" : "Divide"} the top and the bottom by the same number: ${frac(a, b)} = ${frac(c, d)}.`,
        `${mul ? "Multiplica" : "Divide"} arriba y abajo por el mismo número: ${frac(a, b)} = ${frac(c, d)}.`,
      ),
      L(`Same ${op}${n} on top and bottom.`, `Mismo ${op}${n} arriba y abajo.`),
      `${frac(a, b)} = ${frac(`${a}${op}${n}`, `${b}${op}${n}`)} = ${frac(c, d)}`,
      bar(60, d, c, { label: frac(c, d), base: mul ? b : 1, keyPrefix: "x" }) +
        txt(290, 150, `${op}${n}`, { size: 26, fill: COLORS.warn }),
      L(`${frac(a, b)} equals ${frac(c, d)}.`, `${frac(a, b)} es igual a ${frac(c, d)}.`),
      { shaded: c / d },
    ),
  );
  if (!mul) out[0].meta.note = "merge";
  return out;
}

function renamed(spec, id, capEn, capEs, easy, eq) {
  const { a, b, c, d, L: l } = spec;
  const [ra, rc] = [a * (l / b), c * (l / d)];
  const body =
    bar(30, l, ra, { label: frac(a, b), base: b, keyPrefix: "x" }) +
    bar(100, l, rc, { color: COLORS.hundreds, label: frac(c, d), base: d, keyPrefix: "y" });
  return mk(
    id,
    L(capEn, capEs),
    easy,
    eq,
    body,
    L(
      `Two bars, both cut into ${l} equal pieces: ${ra} shaded and ${rc} shaded.`,
      `Dos barras, ambas con ${l} partes iguales: ${ra} sombreadas y ${rc} sombreadas.`,
    ),
    { shaded: ra / l, total: l, ra, rc },
  );
}

function compareFrames(spec) {
  const { a, b, c, d, L: l } = spec;
  const [ra, rc] = [a * (l / b), c * (l / d)];
  const out = [
    mk(
      "show",
      L(
        `Two fractions: ${frac(a, b)} and ${frac(c, d)}. The pieces are different sizes, so we cannot compare yet.`,
        `Dos fracciones: ${frac(a, b)} y ${frac(c, d)}. Las partes son de distinto tamaño, así que aún no se pueden comparar.`,
      ),
      L("Different size pieces.", "Partes de distinto tamaño."),
      `${frac(a, b)} ? ${frac(c, d)}`,
      bar(30, b, a, { label: frac(a, b), keyPrefix: "x" }) +
        bar(100, d, c, { color: COLORS.hundreds, label: frac(c, d), keyPrefix: "y" }),
      L(
        `${frac(a, b)} drawn in ${b} pieces and ${frac(c, d)} drawn in ${d} pieces.`,
        `${frac(a, b)} en ${b} partes y ${frac(c, d)} en ${d} partes.`,
      ),
      { shaded: a / b },
    ),
  ];
  out.push(
    renamed(
      spec,
      "rename",
      `Cut both bars into ${l} equal pieces. Now the pieces match: ${frac(ra, l)} and ${frac(rc, l)}.`,
      `Corta las dos barras en ${l} partes iguales. Ahora las partes coinciden: ${frac(ra, l)} y ${frac(rc, l)}.`,
      L("Make the pieces the same size.", "Haz las partes del mismo tamaño."),
      `${frac(a, b)} = ${frac(ra, l)}   ${frac(c, d)} = ${frac(rc, l)}`,
    ),
  );
  const sym = ra > rc ? ">" : ra < rc ? "<" : "=";
  out.push(
    Object.assign(
      renamed(
        spec,
        "compare",
        `With the same size pieces, compare the counts: ${ra} ${sym} ${rc}, so ${frac(a, b)} ${sym} ${frac(c, d)}.`,
        `Con partes del mismo tamaño, compara las cantidades: ${ra} ${sym} ${rc}, así que ${frac(a, b)} ${sym} ${frac(c, d)}.`,
        L(`${ra} ${sym} ${rc}`, `${ra} ${sym} ${rc}`),
        `${frac(a, b)} ${sym} ${frac(c, d)}`,
      ),
      {},
    ),
  );
  return out;
}

function addFrames(spec) {
  const { a, b, c, d, L: l, op } = spec;
  const [ra, rc] = [a * (l / b), c * (l / d)];
  const out = [
    mk(
      "show",
      L(
        `${frac(a, b)} ${op === "+" ? "+" : "−"} ${frac(c, d)}: the pieces are different sizes, so we cannot join or remove them yet.`,
        `${frac(a, b)} ${op === "+" ? "+" : "−"} ${frac(c, d)}: las partes son de distinto tamaño, así que aún no se pueden juntar ni quitar.`,
      ),
      L("Different size pieces.", "Partes de distinto tamaño."),
      `${frac(a, b)} ${op === "+" ? "+" : "−"} ${frac(c, d)}`,
      bar(30, b, a, { label: frac(a, b), keyPrefix: "x" }) +
        bar(100, d, c, { color: COLORS.hundreds, label: frac(c, d), keyPrefix: "y" }),
      L(
        `${frac(a, b)} and ${frac(c, d)} with different piece sizes.`,
        `${frac(a, b)} y ${frac(c, d)} con partes de distinto tamaño.`,
      ),
      { shaded: a / b },
    ),
  ];
  out.push(
    renamed(
      spec,
      "rename",
      `Cut both into ${l} equal pieces: ${frac(ra, l)} and ${frac(rc, l)}.`,
      `Corta ambas en ${l} partes iguales: ${frac(ra, l)} y ${frac(rc, l)}.`,
      L("Same size pieces first.", "Primero partes del mismo tamaño."),
      `${frac(ra, l)} ${op === "+" ? "+" : "−"} ${frac(rc, l)}`,
    ),
  );
  const r = op === "+" ? ra + rc : ra - rc;
  const g = gcd(r, l) || 1;
  const body = bar(60, l, r, { color: COLORS.part, label: frac(r, l), keyPrefix: "x" });
  out.push(
    mk(
      "combine",
      L(
        `${op === "+" ? "Count all the shaded pieces" : "Take away the pieces"}: ${ra} ${op === "+" ? "+" : "−"} ${rc} = ${r} pieces of size 1/${l}. The pieces stay the same size, so the bottom number stays ${l}.`,
        `${op === "+" ? "Cuenta todas las partes sombreadas" : "Quita las partes"}: ${ra} ${op === "+" ? "+" : "−"} ${rc} = ${r} partes de tamaño 1/${l}. Las partes no cambian de tamaño, así que el denominador sigue siendo ${l}.`,
      ),
      L(
        `${ra} ${op === "+" ? "+" : "−"} ${rc} = ${r} pieces.`,
        `${ra} ${op === "+" ? "+" : "−"} ${rc} = ${r} partes.`,
      ),
      `${frac(ra, l)} ${op === "+" ? "+" : "−"} ${frac(rc, l)} = ${frac(r, l)}`,
      body,
      L(`${r} shaded pieces out of ${l}.`, `${r} partes sombreadas de ${l}.`),
      { shaded: r / l, total: l, sum: r },
    ),
  );
  if (g > 1 && r > 0)
    out.push(
      mk(
        "simplify",
        L(
          `${frac(r, l)} can be written with bigger pieces: ${frac(r / g, l / g)}.`,
          `${frac(r, l)} se puede escribir con partes mayores: ${frac(r / g, l / g)}.`,
        ),
        L(`${frac(r, l)} = ${frac(r / g, l / g)}.`, `${frac(r, l)} = ${frac(r / g, l / g)}.`),
        `${frac(r, l)} = ${frac(r / g, l / g)}`,
        bar(60, l / g, r / g, { color: COLORS.part, label: frac(r / g, l / g), keyPrefix: "x" }),
        L(`${frac(r / g, l / g)} shaded.`, `${frac(r / g, l / g)} sombreado.`),
        { shaded: r / l },
      ),
    );
  return out;
}

export function answer(spec) {
  if (spec.mode === "equiv") return spec.missing === "numerator" ? spec.c : spec.d;
  if (spec.mode === "compare")
    return spec.a * spec.d > spec.c * spec.b ? ">" : spec.a * spec.d < spec.c * spec.b ? "<" : "=";
  const r =
    spec.op === "+"
      ? spec.a * (spec.L / spec.b) + spec.c * (spec.L / spec.d)
      : spec.a * (spec.L / spec.b) - spec.c * (spec.L / spec.d);
  const g = gcd(r, spec.L) || 1;
  return r === 0 ? "0" : `${r / g}/${spec.L / g}`;
}

export function predicts(spec) {
  const list = frames(spec);
  if (spec.mode === "equiv") {
    const n = spec.factor.n;
    const op = spec.factor.kind === "mul" ? "×" : "÷";
    return [
      {
        at: 1,
        q: L(
          `We turn ${frac(spec.a, spec.b)} into an equal fraction by using ${op}${n} on the bottom. What happens to the top?`,
          `Convertimos ${frac(spec.a, spec.b)} en una fracción igual usando ${op}${n} abajo. ¿Qué pasa arriba?`,
        ),
        choices: [
          {
            t: L(`Use ${op}${n} on the top too.`, `Usar ${op}${n} también arriba.`),
            ok: true,
            why: L(
              "Every shaded piece is cut the same way as every other piece, so the top changes by the same factor.",
              "Cada parte sombreada se corta igual que las demás, así que el numerador cambia con el mismo factor.",
            ),
          },
          {
            t: L(`Add ${n} to the top.`, `Sumar ${n} arriba.`),
            ok: false,
            why: L(
              "Adding changes the shaded amount. Multiplying or dividing by the same number keeps it equal.",
              "Sumar cambia la parte sombreada. Multiplicar o dividir por el mismo número la mantiene igual.",
            ),
          },
          {
            t: L("Leave the top alone.", "Dejar el numerador igual."),
            ok: false,
            why: L(
              "If only the bottom changes, the pieces change size but the shaded count does not follow.",
              "Si solo cambia el denominador, las partes cambian de tamaño pero la cantidad sombreada no.",
            ),
          },
        ],
        explain: [
          {
            t: L(
              "Because every piece is split the same way, so the shaded amount stays equal.",
              "Porque cada parte se divide igual, así que la parte sombreada sigue igual.",
            ),
            ok: true,
          },
          {
            t: L(
              "Because the top is always the biggest number.",
              "Porque el numerador siempre es el número mayor.",
            ),
            ok: false,
          },
        ],
      },
    ];
  }
  const { a, b, c, d } = spec;
  const at = list.findIndex((f) => f.id === "rename");
  return [
    {
      at,
      q: L(
        `${frac(a, b)} and ${frac(c, d)} have different piece sizes. What makes them comparable?`,
        `${frac(a, b)} y ${frac(c, d)} tienen partes de distinto tamaño. ¿Qué las hace comparables?`,
      ),
      choices: [
        {
          t: L(
            `Cut both into ${spec.L} equal pieces.`,
            `Cortar ambas en ${spec.L} partes iguales.`,
          ),
          ok: true,
          why: L(
            "Pieces of the same size can be counted and compared or joined.",
            "Partes del mismo tamaño se pueden contar, comparar o juntar.",
          ),
        },
        {
          t: L("Compare the bottom numbers only.", "Comparar solo los denominadores."),
          ok: false,
          why: L(
            "A bigger bottom number means smaller pieces, so it does not tell which amount is larger.",
            "Un denominador mayor significa partes más pequeñas, así que no indica qué cantidad es mayor.",
          ),
        },
        {
          t: L("Add the top numbers.", "Sumar los numeradores."),
          ok: false,
          why: L(
            "The tops count pieces of different sizes. They cannot be added until the pieces match.",
            "Los numeradores cuentan partes de distinto tamaño. No se suman hasta que coincidan.",
          ),
        },
      ],
      explain: [
        {
          t: L(
            "Because we can only add, take away or compare pieces that are the same size.",
            "Porque solo se puede sumar, quitar o comparar partes del mismo tamaño.",
          ),
          ok: true,
        },
        {
          t: L(
            "Because bigger bottom numbers are bigger fractions.",
            "Porque los denominadores mayores son fracciones mayores.",
          ),
          ok: false,
        },
      ],
    },
  ];
}

export function hints(spec) {
  const list = frames(spec);
  const key = spec.mode === "equiv" ? list[0] : list[1];
  const bars = list[0];
  if (spec.mode === "equiv")
    return [
      {
        text: L(
          "Compare the two bottom numbers (or the two top numbers). What did one do to become the other?",
          "Compara los dos denominadores (o los dos numeradores). ¿Qué le hicieron a uno para llegar al otro?",
        ),
      },
      {
        text: L(
          "The picture shows the same shaded amount in different sized pieces.",
          "El dibujo muestra la misma parte sombreada con piezas de distinto tamaño.",
        ),
        frame: key,
      },
      {
        text:
          spec.factor.kind === "mul"
            ? L(
                "Find the number you multiply the known parts by. Do the same to the other part.",
                "Halla el número por el que multiplicas la parte conocida. Haz lo mismo con la otra parte.",
              )
            : L(
                "Find the number you divide the known parts by. Do the same to the other part.",
                "Halla el número entre el que divides la parte conocida. Haz lo mismo con la otra parte.",
              ),
        frame: key,
      },
    ];
  return [
    {
      text: L(
        "Can you compare or join pieces that are different sizes? What could you change first?",
        "¿Se pueden comparar o juntar partes de distinto tamaño? ¿Qué podrías cambiar primero?",
      ),
    },
    {
      text: L(
        "The bars show the two fractions. Look at the size of the pieces.",
        "Las barras muestran las dos fracciones. Mira el tamaño de las partes.",
      ),
      frame: bars,
    },
    {
      text: L(
        `Use a common bottom number that both ${spec.b} and ${spec.d} go into. Rename each fraction, then work with the tops.`,
        `Usa un denominador común al que lleguen ${spec.b} y ${spec.d}. Renombra cada fracción y luego trabaja con los numeradores.`,
      ),
      frame: key,
    },
  ];
}

export function diagnose(spec, raw) {
  const text = String(raw).replaceAll(" ", "");
  if (spec.mode === "equiv") {
    const v = num(text);
    if (v === null) return null;
    const additive =
      spec.missing === "numerator"
        ? spec.a + (spec.known - spec.b)
        : spec.b + (spec.known - spec.a);
    if (v === additive && v !== answer(spec)) return "additive";
  }
  if (
    spec.mode === "addsub" &&
    text ===
      `${spec.op === "+" ? spec.a + spec.c : spec.a - spec.c}/${spec.op === "+" ? spec.b + spec.d : spec.b - spec.d}`
  )
    return "addedDenominators";
  if (spec.mode === "compare" && (text === "<" || text === ">")) {
    const wrongFlip = text !== answer(spec) && spec.b !== spec.d;
    if (wrongFlip) return "biggerBottom";
  }
  return null;
}

export const tags = {
  additive: {
    label: L("Added instead of multiplying", "Sumó en lugar de multiplicar"),
    tip: L(
      "Equal fractions come from cutting every piece the same way: multiply or divide top and bottom by the same number.",
      "Las fracciones iguales salen de cortar cada parte igual: multiplica o divide arriba y abajo por el mismo número.",
    ),
  },
  addedDenominators: {
    label: L("Added the bottom numbers", "Sumó los denominadores"),
    tip: L(
      "Pieces of the same size are counted, not re-cut. Rename first, then add only the tops.",
      "Las partes del mismo tamaño se cuentan, no se vuelven a cortar. Renombra primero y suma solo los numeradores.",
    ),
  },
  biggerBottom: {
    label: L(
      "Thought a bigger bottom number is a bigger fraction",
      "Pensó que un denominador mayor es una fracción mayor",
    ),
    tip: L(
      "More pieces in the whole means smaller pieces. Make the pieces the same size, then compare the counts.",
      "Más partes en el entero significa partes más pequeñas. Haz las partes del mismo tamaño y compara.",
    ),
  },
};

// ----- Build -----
export const build = {
  prompt: (spec) =>
    spec.mode === "equiv"
      ? spec.factor.kind === "mul"
        ? L(
            `Cut every piece into more equal parts until the bar has ${spec.d} pieces.`,
            `Corta cada parte en más partes iguales hasta que la barra tenga ${spec.d} partes.`,
          )
        : L(
            `Join pieces into equal groups until the bar has ${spec.d} pieces.`,
            `Junta las partes en grupos iguales hasta que la barra tenga ${spec.d} partes.`,
          )
      : L(
          `Cut each bar into more equal parts until both bars have pieces of the same size.`,
          `Corta cada barra en más partes iguales hasta que ambas tengan partes del mismo tamaño.`,
        ),
  init: (spec) => (spec.mode === "equiv" ? { n: 1 } : { ka: 1, kb: 1 }),
  render(state, spec) {
    if (spec.mode === "equiv") {
      const mul = spec.factor.kind === "mul";
      const total = mul ? spec.b * state.n : spec.b;
      const shaded = mul ? spec.a * state.n : spec.a;
      const body =
        bar(40, total, shaded, {
          label: frac(shaded, total),
          base: spec.b,
          keyPrefix: "x",
          group: mul ? 0 : state.n,
        }) +
        (mul
          ? ""
          : bar(110, spec.b / state.n, spec.a / state.n, {
              label: frac(spec.a / state.n, spec.b / state.n),
              keyPrefix: "y",
            }));
      const done = state.n === spec.factor.n;
      return {
        svg: wrap(body, altBar(spec.a, spec.b, state.n)),
        alt: altBar(spec.a, spec.b, state.n),
        controls: [
          {
            id: "dec",
            label: mul ? L("Fewer cuts", "Menos cortes") : L("Smaller groups", "Grupos menores"),
          },
          {
            id: "inc",
            label: mul
              ? L("Cut into more parts", "Cortar en más partes")
              : L("Bigger groups", "Grupos mayores"),
          },
        ],
        status: done
          ? L(
              `Yes! ${frac(spec.a, spec.b)} = ${frac(spec.c, spec.d)}.`,
              `¡Sí! ${frac(spec.a, spec.b)} = ${frac(spec.c, spec.d)}.`,
            )
          : L(
              `Each piece is cut into ${mul ? state.n : "groups of " + state.n}. Pieces: ${total}.`,
              `Cada parte: ${mul ? state.n : "grupos de " + state.n}. Partes: ${total}.`,
            ),
      };
    }
    const [pa, pb] = [spec.b * state.ka, spec.d * state.kb];
    const body =
      bar(30, pa, spec.a * state.ka, { label: frac(spec.a, spec.b), keyPrefix: "x" }) +
      bar(100, pb, spec.c * state.kb, {
        color: COLORS.hundreds,
        label: frac(spec.c, spec.d),
        keyPrefix: "y",
      });
    const same = pa === pb;
    return {
      svg: wrap(
        body,
        L(
          `Top bar has ${pa} pieces, bottom bar has ${pb} pieces.`,
          `La barra de arriba tiene ${pa} partes, la de abajo ${pb}.`,
        ),
      ),
      alt: L(
        `Top bar has ${pa} pieces, bottom bar has ${pb} pieces.`,
        `La barra de arriba tiene ${pa} partes, la de abajo ${pb}.`,
      ),
      controls: [
        { id: "ka+", label: L("Cut top bar more", "Cortar más la barra de arriba") },
        { id: "ka-", label: L("Fewer cuts on top", "Menos cortes arriba") },
        { id: "kb+", label: L("Cut bottom bar more", "Cortar más la barra de abajo") },
        { id: "kb-", label: L("Fewer cuts on bottom", "Menos cortes abajo") },
      ],
      status: same
        ? L(
            `Same size pieces: ${spec.a * state.ka} and ${spec.c * state.kb} out of ${pa}.`,
            `Partes del mismo tamaño: ${spec.a * state.ka} y ${spec.c * state.kb} de ${pa}.`,
          )
        : L(
            `Top pieces: ${pa}. Bottom pieces: ${pb}. They do not match yet.`,
            `Partes de arriba: ${pa}. Partes de abajo: ${pb}. Todavía no coinciden.`,
          ),
    };
  },
  act(state, action, _arg, spec) {
    if (spec.mode === "equiv") {
      const mul = spec.factor.kind === "mul";
      const step = action === "inc" ? 1 : -1;
      let n = state.n + step;
      if (n < 1 || n > 12)
        return { state, ok: false, msg: L("That is as far as this goes.", "Hasta aquí se puede.") };
      if (!mul) while (n >= 1 && n <= 12 && (spec.b % n || spec.a % n)) n += step;
      if (n < 1 || n > 12)
        return {
          state,
          ok: false,
          msg: L(
            "Those groups would not fit evenly, so there is no equal fraction that way.",
            "Esos grupos no encajarían parejos, así que no hay fracción igual así.",
          ),
        };
      return { state: { n }, ok: true };
    }
    const next = { ...state };
    const key = action.slice(0, 2);
    const delta = action.endsWith("+") ? 1 : -1;
    next[key] = Math.min(12, Math.max(1, next[key] + delta));
    return {
      state: next,
      ok: next[key] !== state[key],
      msg:
        next[key] === state[key] ? L("That is as far as this goes.", "Hasta aquí se puede.") : null,
    };
  },
  done: (state, spec) =>
    spec.mode === "equiv" ? state.n === spec.factor.n : spec.b * state.ka === spec.d * state.kb,
};

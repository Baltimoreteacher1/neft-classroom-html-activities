// Plain-language, bilingual wording for a diagram a teacher cannot yet draw. The generators throw DiagramError with
// a stable `code` and an English message that names fields like "categories[2].value"; a teacher should read
// "Row 3: the value must be a number." instead. Spanish here has NOT had a native-speaker review.

const LIST = {
  categories: ["Row", "Fila"],
  points: ["Point", "Punto"],
  events: ["Event", "Evento"],
  parts: ["Part", "Parte"],
  values: ["Value", "Valor"],
  relationships: ["Link", "Enlace"],
  xRange: ["The x-axis", "El eje x"],
  yRange: ["The y-axis", "El eje y"],
};
const SUB = {
  label: ["name", "nombre"],
  value: ["number", "número"],
  x: ["x", "x"],
  y: ["y", "y"],
  year: ["year", "año"],
  eats: ["eater", "quien come"],
  eaten: ["food", "alimento"],
};
const TOP = {
  title: ["The title", "El título"],
  unit: ["The unit", "La unidad"],
  denominator: ["The denominator", "El denominador"],
  numerator: ["The numerator", "El numerador"],
  total: ["The total", "El total"],
  l: ["The length", "El largo"],
  w: ["The width", "El ancho"],
  h: ["The height", "La altura"],
  binWidth: ["The interval width", "El ancho del intervalo"],
};

/** "Row 3, number" / "The title" for the field a generator message starts with, as [en, es]. */
function where(message) {
  const m = /^(\w+)(?:\[(\d+)\])?(?:\.(\w+))?/.exec(String(message));
  if (!m) return ["This figure", "Esta figura"];
  const [, name, index, sub] = m;
  if (TOP[name]) return TOP[name];
  if (!LIST[name]) return ["This figure", "Esta figura"];
  const n = index === undefined ? "" : ` ${Number(index) + 1}`;
  const part = sub && SUB[sub] ? SUB[sub] : null;
  return [
    `${LIST[name][0]}${n}${part ? `, ${part[0]}` : ""}`,
    `${LIST[name][1]}${n}${part ? `, ${part[1]}` : ""}`,
  ];
}
const num = (message, re) => re.exec(String(message))?.[1] ?? "";

/** [en, es] sentence builders keyed by DiagramError.code; `w` is where(), `m` the generator's message. */
const SAY = {
  "empty-text": (w) => [`${w[0]} is empty. Type a name.`, `${w[1]} está vacío. Escriba un nombre.`],
  "text-too-long": (w) => [
    `${w[0]} is too long. Shorten it.`,
    `${w[1]} es demasiado largo. Acórtelo.`,
  ],
  "not-a-number": (w) => [`${w[0]} must be a number.`, `${w[1]} debe ser un número.`],
  "not-an-integer": (w) => [
    `${w[0]} must be a whole number.`,
    `${w[1]} debe ser un número entero.`,
  ],
  "out-of-range": (w) => [
    `${w[0]} is outside the allowed range.`,
    `${w[1]} está fuera del rango permitido.`,
  ],
  "not-a-list": () => ["Add at least one row.", "Agregue al menos una fila."],
  "too-few": (_w, m) => {
    const n = num(m, /at least (\d+)/) || "1";
    return [
      `Add more rows: this figure needs at least ${n}.`,
      `Agregue más filas: esta figura necesita al menos ${n}.`,
    ];
  },
  "too-many": (_w, m) => {
    const n = num(m, /limit is (\d+)/);
    return [
      `There are too many rows for one figure${n ? ` (the limit is ${n})` : ""}. Remove some.`,
      `Hay demasiadas filas para una figura${n ? ` (el límite es ${n})` : ""}. Quite algunas.`,
    ];
  },
  "bad-range": () => [
    "Each axis needs a smallest number that is below its largest.",
    "Cada eje necesita un número menor que sea inferior al mayor.",
  ],
  "range-too-wide": () => [
    "An axis covers too many numbers. Use a smaller range.",
    "Un eje abarca demasiados números. Use un rango menor.",
  ],
  "bad-style": () => ["Choose a bar or a circle.", "Elija una barra o un círculo."],
  "bad-dimension": (w) => [
    `${w[0]} must be a number greater than 0.`,
    `${w[1]} debe ser un número mayor que 0.`,
  ],
  "bad-unit": () => [
    "The unit may only use letters, numbers and . / ' \" -.",
    "La unidad solo puede usar letras, números y . / ' \" -.",
  ],
  "bad-part": (w) => [
    `${w[0]} must be a number greater than 0, or left blank for the unknown part.`,
    `${w[1]} debe ser un número mayor que 0, o quedar en blanco para la parte desconocida.`,
  ],
  "bad-total": () => [
    "The total must be a number greater than 0.",
    "El total debe ser un número mayor que 0.",
  ],
  "total-required": () => [
    "A tape diagram with an unknown part needs the total.",
    "Un diagrama de cinta con una parte desconocida necesita el total.",
  ],
  "total-too-small": () => [
    "The total must be larger than the known parts added together.",
    "El total debe ser mayor que la suma de las partes conocidas.",
  ],
  "total-mismatch": () => [
    "The parts do not add up to the total. Fix a part or the total.",
    "Las partes no suman el total. Corrija una parte o el total.",
  ],
  "too-many-unknowns": () => [
    "Only one part may be unknown. Fill in the others.",
    "Solo una parte puede ser desconocida. Complete las demás.",
  ],
  "too-uneven": () => [
    "The longest edge is more than 25 times the shortest, so the box cannot be drawn clearly.",
    "La arista más larga es más de 25 veces la más corta; la caja no se puede dibujar con claridad.",
  ],
  "point-off-plane": (w) => [
    `${w[0]} is outside the grid. Widen the axes or change the point.`,
    `${w[1]} está fuera de la cuadrícula. Amplíe los ejes o cambie el punto.`,
  ],
  "one-year": () => [
    "A timeline needs at least two different years.",
    "Una línea de tiempo necesita al menos dos años distintos.",
  ],
  "label-too-long": (w) => [
    `${w[0]} is too long for a timeline. Shorten it.`,
    `${w[1]} es demasiado largo para una línea de tiempo. Acórtelo.`,
  ],
  "timeline-crowded": () => [
    "Too many events are close together to label clearly. Remove or merge some.",
    "Hay demasiados eventos juntos para rotularlos con claridad. Quite o combine algunos.",
  ],
  "too-dense": () => [
    "Too many values are too close together to draw. Remove some or use a histogram.",
    "Hay demasiados valores muy juntos para dibujar. Quite algunos o use un histograma.",
  ],
  "too-many-bins": () => [
    "That would make too many intervals. Use a wider interval width.",
    "Eso crearía demasiados intervalos. Use un ancho de intervalo mayor.",
  ],
  "too-many-equal": () => [
    "More than 30 identical values would not fit in one stack. Use a histogram.",
    "Más de 30 valores iguales no caben en una pila. Use un histograma.",
  ],
  cycle: (_w, m) => [
    String(m),
    "Una red alimentaria no puede tener un ciclo: algo no puede comerse a sí mismo, ni siquiera por una cadena de otros.",
  ],
  "unknown-kind": () => [
    "That kind of diagram is not available.",
    "Ese tipo de diagrama no está disponible.",
  ],
  "cannot-draw": () => [
    "This diagram could not be drawn from its values. Check each number.",
    "Este diagrama no se pudo dibujar con sus valores. Revise cada número.",
  ],
};

/**
 * @param {{code?: string, message?: string}} error  what renderDiagram / checkDiagram returned
 * @returns {{en: string, es: string}}
 */
export function explainDiagram(error) {
  const make = SAY[error?.code];
  const w = where(error?.message);
  const [en, es] = make
    ? make(w, error.message)
    : [
        "This diagram could not be drawn. Check each value.",
        "Este diagrama no se pudo dibujar. Revise cada valor.",
      ];
  return { en: en || SAY["cannot-draw"]()[0], es: es || SAY["cannot-draw"]()[1] };
}

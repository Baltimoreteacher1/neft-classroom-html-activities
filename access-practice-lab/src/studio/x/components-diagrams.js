// Diagram components: the wave-1 generators (x/diagrams-*.js) as insertable `diagram` blocks. A block stores only the
// structured spec (core/schema.js), so the figure is redrawn accurately from its numbers in the player, on paper and
// in Word, and always has a text description and a data table. The starter values are examples to replace.
// If the model has no `diagram` block (an older schema), one unavailable entry says so instead of faking it.

import * as schema from "../core/schema.js";
import { KINDS_ALL, T, define, fresh, hasQuestions, pick, starterNote, unavailable, writtenQuestion } from "./components-kit.js";

const SAMPLE = {
  fraction: [T("Fraction model", "Modelo de fracción"), T("Shows a fraction as shaded equal parts.", "Muestra una fracción como partes iguales sombreadas."), ["math", "fractions"], { numerator: 3, denominator: 4, style: "bar" }],
  tape: [T("Tape diagram", "Diagrama de cinta"), T("Shows parts and a total as bars of the same scale.", "Muestra partes y un total como barras de la misma escala."), ["math", "ratio", "word problems"], { parts: [{ label: "A", value: 12 }, { label: "B", value: 18 }], total: 30 }],
  prism: [T("Box (rectangular prism)", "Caja (prisma rectangular)"), T("Draws a box from its length, width and height.", "Dibuja una caja con su largo, ancho y alto."), ["math", "volume", "geometry"], { l: 4, w: 3, h: 2, unit: "cm" }],
  plane: [T("Coordinate plane", "Plano de coordenadas"), T("A grid with labelled points.", "Una cuadrícula con puntos rotulados."), ["math", "graphing", "coordinates"], { xRange: [-5, 5], yRange: [-5, 5], points: [{ x: 2, y: 3, label: "A" }, { x: -3, y: 1, label: "B" }] }],
  bar: [T("Bar chart", "Gráfica de barras"), T("Compares amounts across categories.", "Compara cantidades entre categorías."), ["math", "data", "science"], { title: "Votes", unit: "", categories: [{ label: "Red", value: 8 }, { label: "Blue", value: 6 }, { label: "Green", value: 3 }] }],
  dot: [T("Dot plot", "Diagrama de puntos"), T("Shows how often each value occurs.", "Muestra con qué frecuencia ocurre cada valor."), ["math", "data", "statistics"], { title: "Quiz scores", unit: "", values: [2, 3, 3, 4, 4, 4, 5, 6] }],
  histogram: [T("Histogram", "Histograma"), T("Groups a list of numbers into equal-width bins.", "Agrupa una lista de números en intervalos del mismo ancho."), ["math", "data", "statistics"], { title: "Heights", unit: "", values: [52, 55, 56, 58, 59, 60, 61, 61, 63, 66, 68, 70], binWidth: 5 }],
  timeline: [T("Timeline", "Línea de tiempo"), T("Places events in order along a scaled line.", "Coloca sucesos en orden sobre una línea a escala."), ["history", "social studies", "sequencing"], { events: [{ year: 1900, label: "First event" }, { year: 1925, label: "Second event" }, { year: 1950, label: "Third event" }] }],
  foodweb: [T("Food web", "Red alimentaria"), T("Shows who eats whom in a habitat.", "Muestra quién come a quién en un hábitat."), ["science", "ecosystems"], { relationships: [{ eats: "grasshopper", eaten: "grass" }, { eats: "frog", eaten: "grasshopper" }, { eats: "snake", eaten: "frog" }] }],
  tenframe: [T("Ten frame", "Marco de diez"), T("Shows counters in rows of five for counting and adding to 20.", "Muestra marcadores en filas de cinco para contar y sumar hasta 20."), ["math", "counting", "early grades"], { count: 7, add: 3 }],
};

const make = (kind) => {
  const [label, purpose, tags, spec] = SAMPLE[kind];
  return define({
    id: `diagram-${kind}`,
    label,
    purpose,
    category: "visual",
    tags: ["diagram", ...tags],
    kind,
    configurable: [{ key: "withQuestion", type: "boolean", label: T("Add a written question about it", "Agregar una pregunta escrita sobre la figura") }],
    compatibility: { kinds: KINDS_ALL, templates: "any" },
    accessibility: T(
      "Has a text description and a data table version that keyboard and screen reader users can open. Colors are never the only signal.",
      "Tiene una descripción en texto y una versión en tabla de datos que se abre con teclado y lector de pantalla. El color nunca es la única señal.",
    ),
    printable: {
      alternative: "native",
      note: T("Prints as the same figure, redrawn at print size.", "Se imprime como la misma figura, redibujada al tamaño de impresión."),
    },
    build: (a, cfg) => {
      const blocks = [{ type: "diagram", spec: { kind, ...structuredClone(spec) }, alt: { en: "", es: "" }, caption: { en: "", es: "" } }];
      if (cfg.withQuestion ?? !hasQuestions(a))
        blocks.push(writtenQuestion(pick(T("Look at the figure. What does it show?", "Mire la figura. ¿Qué muestra?"), cfg.lang), pick(T("The figure shows ___.", "La figura muestra ___."), cfg.lang)));
      return [...fresh(blocks), starterNote(cfg.lang)];
    },
  });
};

export const DIAGRAM_COMPONENTS =
  schema.BLOCK_TYPES.includes("diagram") && Array.isArray(schema.DIAGRAM_KINDS)
    ? schema.DIAGRAM_KINDS.filter((k) => SAMPLE[k]).map(make)
    : [
        unavailable(
          "diagram",
          T("Diagram", "Diagrama"),
          T("A generated, labelled diagram with a text description.", "Un diagrama generado y etiquetado con descripción en texto."),
          T(
            "This build of the activity model has no diagram block. Use Data table for now.",
            "Esta versión del modelo de actividad no tiene bloque de diagrama. Use Tabla de datos por ahora.",
          ),
          "visual",
        ),
      ];

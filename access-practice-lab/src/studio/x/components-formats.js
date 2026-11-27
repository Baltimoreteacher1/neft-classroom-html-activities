// The question-format components: one per format in core/schema.js FORMATS that the studio can add on its own.
// Each starts from the fixture question of that format (answers that check out) so a teacher edits real, valid
// content. Hotspot is listed as unavailable: it needs the teacher's own picture with areas drawn on it.

import { FORMAT_LABEL } from "../editor/blank-blocks.js";
import { FORMATS } from "../core/schema.js";
import {
  KINDS_ALL,
  T,
  define,
  sampleQuestion,
  starterNote,
  unavailable,
} from "./components-kit.js";

const NATIVE = T(
  "Prints as a paper question; the key stays on the teacher copy.",
  "Se imprime como pregunta en papel; la clave queda en la copia del docente.",
);

/** [format, purpose, accessibility, printable note, tags]. */
const SPEC = {
  choice: [
    T("One right answer from a short list.", "Una respuesta correcta de una lista corta."),
    T(
      "Native radio buttons: arrow keys and Space work, no pointer needed.",
      "Botones de opción nativos: funcionan las flechas y la barra espaciadora, sin puntero.",
    ),
    ["check", "reading", "formative"],
  ],
  multi: [
    T("Select every correct answer.", "Seleccionar todas las respuestas correctas."),
    T(
      "Native checkboxes; each is reachable by Tab.",
      "Casillas nativas; cada una se alcanza con Tab.",
    ),
    ["check", "reading"],
  ],
  match: [
    T(
      "Match words to meanings or pairs of related ideas.",
      "Emparejar palabras con significados o ideas relacionadas.",
    ),
    T(
      "Pick a card, then pick its partner: buttons only, no dragging required.",
      "Elija una tarjeta y luego su pareja: solo botones, sin arrastrar.",
    ),
    ["matching", "vocabulary"],
  ],
  sort: [
    T("Sort items into groups.", "Clasificar elementos en grupos."),
    T(
      "Pick an item, then pick its group: buttons only, no dragging required.",
      "Elija un elemento y luego su grupo: solo botones, sin arrastrar.",
    ),
    ["sorting", "categories"],
  ],
  order: [
    T("Put steps or events in order.", "Poner pasos o sucesos en orden."),
    T(
      "Move up and move down buttons on every item; no dragging required.",
      "Botones de subir y bajar en cada elemento; sin arrastrar.",
    ),
    ["sequencing", "steps"],
  ],
  blank: [
    T("Fill in a missing word or number.", "Completar una palabra o un número que falta."),
    T(
      "Labelled text boxes; an optional word bank is plain buttons.",
      "Cuadros de texto con etiqueta; el banco de palabras opcional son botones simples.",
    ),
    ["vocabulary", "cloze"],
  ],
  number: [
    T(
      "A typed number answer, checked with exact arithmetic.",
      "Una respuesta numérica escrita, comprobada con aritmética exacta.",
    ),
    T("One labelled text box; Enter checks.", "Un cuadro de texto con etiqueta; Enter comprueba."),
    ["math", "fractions", "ratio", "computation"],
  ],
  short: [
    T(
      "A written response, with an optional sentence frame.",
      "Una respuesta escrita, con un marco de oración opcional.",
    ),
    T("A labelled text area.", "Un área de texto con etiqueta."),
    ["writing", "explain", "reflection"],
  ],
  identify: [
    T(
      "Click the words in a text that match a description.",
      "Hacer clic en las palabras de un texto que coincidan.",
    ),
    T(
      "Each word is a button with a pressed state.",
      "Cada palabra es un botón con estado de pulsado.",
    ),
    ["reading", "evidence", "grammar"],
  ],
  numberline: [
    T(
      "Place a number or fraction on a number line.",
      "Colocar un número o una fracción en una recta numérica.",
    ),
    T(
      "Choices are radio buttons and the value can also be typed.",
      "Las opciones son botones de radio y el valor también se puede escribir.",
    ),
    ["math", "fractions", "number line"],
  ],
  build: [
    T(
      "Build a sentence from word tiles (a sentence builder).",
      "Armar una oración con fichas de palabras (constructor de oraciones).",
    ),
    T(
      "Tiles are buttons: tap to place, tap again to take back.",
      "Las fichas son botones: toque para colocar, toque otra vez para quitar.",
    ),
    ["writing", "grammar", "sentence builder"],
  ],
  error: [
    T(
      "Find the step with the mistake, then choose the fix.",
      "Encontrar el paso con el error y elegir la corrección.",
    ),
    T(
      "Radio buttons for the step and for the fix.",
      "Botones de radio para el paso y para la corrección.",
    ),
    ["math", "revision", "reasoning"],
  ],
  fillTable: [
    T(
      "Complete the empty cells of a table (for example a ratio table).",
      "Completar las celdas vacías de una tabla (por ejemplo, una tabla de razones).",
    ),
    T(
      "Each cell is a labelled text box that names its row and column.",
      "Cada celda es un cuadro con etiqueta que nombra su fila y columna.",
    ),
    ["math", "ratio", "table"],
  ],
  plot: [
    T("Plot points on a coordinate grid.", "Marcar puntos en una cuadrícula de coordenadas."),
    T(
      "Arrow keys move on the grid, and points can also be typed.",
      "Las flechas se mueven por la cuadrícula y los puntos también se pueden escribir.",
    ),
    ["math", "graphing", "coordinates"],
  ],
};

const SHORT_OPTIONS = [
  {
    key: "kind",
    type: "choice",
    label: T("Kind of response", "Tipo de respuesta"),
    options: [
      { value: "explain", label: T("Explain your thinking", "Explicar su razonamiento") },
      { value: "write", label: T("Write", "Escribir") },
    ],
  },
];

function formatComponent(format) {
  const [purpose, accessibility, tags] = SPEC[format];
  const [en, es] = FORMAT_LABEL[format];
  return define({
    id: `q-${format}`,
    label: T(en, es),
    purpose,
    category: "question",
    tags,
    format,
    accessibility,
    printable: { alternative: "native", note: NATIVE },
    compatibility: { kinds: KINDS_ALL, templates: "any" },
    defaults: format === "short" ? { kind: "explain" } : {},
    configurable: format === "short" ? SHORT_OPTIONS : [],
    build: (_a, cfg) => {
      const over = format === "short" && cfg.kind === "write" ? { kind: "write" } : {};
      return [sampleQuestion(format, over), starterNote(cfg.lang)];
    },
  });
}

export const FORMAT_COMPONENTS = FORMATS.map((f) =>
  f === "hotspot"
    ? unavailable(
        "q-hotspot",
        T(en(f), es(f)),
        T("Click an area of a picture.", "Hacer clic en un área de una imagen."),
        T(
          "Needs your own picture with the clickable areas drawn on it, so it cannot be added in one step. Add a picture, then choose Click the picture under Add a question in the editor.",
          "Necesita su propia imagen con las áreas marcadas, así que no se puede agregar en un paso. Agregue una imagen y elija Hacer clic en la imagen en Agregar una pregunta del editor.",
        ),
        "question",
      )
    : formatComponent(f),
);

function en(f) {
  return FORMAT_LABEL[f][0];
}
function es(f) {
  return FORMAT_LABEL[f][1];
}

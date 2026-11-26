// The checks the Creation Quality Inspector adds on top of validateActivity. Each one calls
// add(id, severity, where, {en, es}, {en, es}, repairId?). Nothing here repeats a validate.js rule.

import { answerText } from "../core/check.js";
import {
  evalExpr,
  parseAnswer,
  parseNumber,
  plainMath,
  ratEquals,
  ratToString,
} from "../core/math.js";
import { writingLines } from "../print/paper-model.js";
import { T, at, questionsOf } from "./inspect-text.js";

const norm = (s) => plainMath(s).toLowerCase().replace(/\s+/g, " ").trim();

// ── directions ─────────────────────────────────────────────────────────────────

const PROMPT_OPTIONAL = new Set(["blank", "identify", "fillTable"]);

export function checkDirections(a, add) {
  const qs = questionsOf(a);
  if (qs.length && !a.blocks.some((b) => b.type === "text" && b.role === "directions"))
    add(
      "missing-directions",
      a.kind === "worksheet" ? "check" : "note",
      {},
      T(
        "The activity has no directions text for students.",
        "La actividad no tiene instrucciones para los estudiantes.",
      ),
      T(
        "Add a text block with the role Directions before the first question. Write it in your own words.",
        "Agregue un bloque de texto con el rol Instrucciones antes de la primera pregunta. Escríbalo con sus propias palabras.",
      ),
    );
  for (const q of qs)
    if (PROMPT_OPTIONAL.has(q.format) && !q.prompt.trim())
      add(
        "missing-question-directions",
        "check",
        at(q),
        T(
          "This question has no directions; students only see the activity itself.",
          "Esta pregunta no tiene instrucciones; los estudiantes solo ven la actividad.",
        ),
        T(
          "Add one line that tells students what to do. The repair adds the standard line for this question type.",
          "Agregue una línea que diga a los estudiantes qué hacer. La reparación agrega la línea estándar para este tipo de pregunta.",
        ),
        "add-default-directions",
      );
}

// ── answers ────────────────────────────────────────────────────────────────────

export function checkAnswers(a, add, flagged) {
  for (const q of questionsOf(a)) {
    if (q.format === "short" || flagged.has(q.id)) continue;
    if (!answerText(q).trim())
      add(
        "missing-answer",
        "fix",
        at(q),
        T(
          "This question has no answer in the key.",
          "Esta pregunta no tiene respuesta en la clave.",
        ),
        T(
          "Open the question and mark or type the correct answer.",
          "Abra la pregunta y marque o escriba la respuesta correcta.",
        ),
      );
    if (
      q.format === "fillTable" &&
      q.rows.some((r) => r.some((c) => c && typeof c === "object" && !String(c.answer).trim()))
    )
      add(
        "missing-answer",
        "fix",
        at(q),
        T(
          "A blank table cell has no answer in the key.",
          "Una celda en blanco de la tabla no tiene respuesta en la clave.",
        ),
        T(
          "Type the correct value for every blank cell.",
          "Escriba el valor correcto de cada celda en blanco.",
        ),
      );
  }
}

// ── arithmetic ─────────────────────────────────────────────────────────────────

const ARITH = "[\\d\\s.,{}/()+\\-−–×÷*^·]";
const SIDE = new RegExp(`^${ARITH}+$`);
const hasOperator = (s) => /[+\-−–×÷*/^·]/.test(s.replace(/^\s*[-−–]/, "")) && /\d/.test(s);

/** Exact value of a purely numeric side such as "3/4 + {1/2}", or null (words, mixed numbers, percents, units). */
function sideValue(text) {
  const s = String(text)
    .trim()
    .replace(/[.?]+$/, "")
    .trim();
  if (!s || !SIDE.test(s)) return null;
  if (/\d\s+\d|[\d}]\s*\{|\}\s*\d/.test(s)) return null; // mixed numbers and "2 {1/4}" are not plain arithmetic
  return evalExpr(s.replace(/(?<=\d),(?=\d{3}\b)/g, ""));
}

/** "a op b = c" statements in a line: [{ text, ok }]. A line with words beside numbers is left alone. */
function statements(text) {
  const out = [];
  for (const line of String(text).split(/\n|;/)) {
    if (!line.includes("=") || /≈/.test(line)) continue;
    const sides = line
      .split("=")
      .map((s) => s.trim())
      .filter(Boolean);
    const kept = sides.filter((s) => !(/\p{L}/u.test(s) && !/\d/.test(s))); // a bare label ("Area") is dropped
    if (kept.length < 2) continue;
    const values = kept.map(sideValue);
    if (values.some((v) => !v) || !kept.some(hasOperator)) continue;
    out.push({
      text: line.trim(),
      ok: values.every((v) => ratEquals(v, values[0])),
      value: values[0],
    });
  }
  return out;
}

const show = (r) => ratToString(r, "auto");
const wrongMath = (add, where, en, es) =>
  add(
    "wrong-arithmetic",
    "fix",
    where,
    T(en, es),
    T(
      "Recalculate the problem by hand and correct the answer (or the problem). The checker uses exact fractions, so rounding is not the cause.",
      "Recalcule el problema a mano y corrija la respuesta (o el problema). El verificador usa fracciones exactas, así que el redondeo no es la causa.",
    ),
  );

export function checkArithmetic(a, add) {
  for (const b of a.blocks) {
    if (b.type === "math")
      for (const s of statements(b.text))
        if (!s.ok)
          wrongMath(
            add,
            { blockId: b.id },
            `The statement "${s.text}" is not true.`,
            `La afirmación «${s.text}» no es verdadera.`,
          );
    if (b.type !== "question") continue;
    if (b.format === "number" && !b.expr) {
      const m = new RegExp(
        `^(?:what is|what's|compute|calculate|evaluate|simplify|find|solve|work out)?\\s*:?\\s*(${ARITH}+?)\\s*(?:=\\s*\\??)?\\s*[?.]?\\s*$`,
        "i",
      ).exec(b.prompt.trim());
      const want = m && hasOperator(m[1]) ? sideValue(m[1]) : null;
      const got = parseAnswer(b.answer, b.unit);
      if (want && got && !ratEquals(want, got, b.tolerance || 0))
        wrongMath(
          add,
          at(b),
          `The answer key says ${b.answer} but ${m[1].trim()} equals ${show(want)}.`,
          `La clave dice ${b.answer} pero ${m[1].trim()} es igual a ${show(want)}.`,
        );
    }
    if (b.format === "blank") {
      const text = b.text;
      const eq = [
        ...[...text.matchAll(new RegExp(`(${ARITH}+?)=\\s*\\[\\[([^\\]]+)\\]\\]`, "g"))].map(
          (m) => [m[1], m[2]],
        ),
        ...[...text.matchAll(new RegExp(`\\[\\[([^\\]]+)\\]\\]\\s*=\\s*(${ARITH}+)`, "g"))].map(
          (m) => [m[2], m[1]],
        ),
      ];
      for (const [expr, marker] of eq) {
        const want = hasOperator(expr) ? sideValue(expr) : null;
        const bad = marker
          .split("|")
          .map((x) => x.trim())
          .filter((x) => want && parseAnswer(x) && !ratEquals(parseAnswer(x), want));
        if (bad.length)
          wrongMath(
            add,
            at(b),
            `The blank says ${bad[0]} but ${expr.trim()} equals ${show(want)}.`,
            `El espacio dice ${bad[0]} pero ${expr.trim()} es igual a ${show(want)}.`,
          );
      }
    }
  }
}

// ── interaction configs, ids, numbering ────────────────────────────────────────

const LISTS = ["options", "fixOptions", "pairs", "items", "categories", "regions", "steps"];
export const PREFIX = /^(\s*(?:(?:question|q|step)\s*)?)(\d+)(\s*[.):]\s+)/i;
export const prefixNumber = (text) => PREFIX.exec(text)?.[2];

export function checkConfigs(a, add) {
  const qs = questionsOf(a);
  for (const q of qs) {
    for (const list of LISTS) {
      const ids = (q[list] || []).map((x) => x.id);
      if (new Set(ids).size !== ids.length)
        add(
          "dup-id",
          "fix",
          at(q),
          T(
            `Two entries in "${list}" share an id, so the key cannot tell them apart.`,
            `Dos entradas de «${list}» comparten un id, así que la clave no puede distinguirlas.`,
          ),
          T(
            "Re-create one of the duplicated entries in the editor.",
            "Vuelva a crear una de las entradas duplicadas en el editor.",
          ),
        );
    }
    if (q.format === "order") {
      const keys = q.items.map((i) => norm(i.text));
      if (new Set(keys).size !== keys.length)
        add(
          "dup-order-item",
          "fix",
          at(q),
          T(
            "Two items to put in order say the same thing, so the order cannot be checked.",
            "Dos elementos para ordenar dicen lo mismo, así que no se puede comprobar el orden.",
          ),
          T(
            "Remove the repeated item, or reword it so students can tell them apart.",
            "Quite el elemento repetido o cámbielo para que los estudiantes los distingan.",
          ),
          "trim-duplicate-order-items",
        );
    }
    if (q.format === "sort") {
      const empty = q.categories.filter((c) => !q.items.some((i) => i.category === c.id));
      if (empty.length)
        add(
          "empty-category",
          "check",
          at(q),
          T(
            "A group has no items, so students can place nothing there correctly.",
            "Un grupo no tiene elementos, así que los estudiantes no pueden colocar nada ahí correctamente.",
          ),
          T(
            "Add an item that belongs to the empty group, or remove the group.",
            "Agregue un elemento que pertenezca al grupo vacío o quite el grupo.",
          ),
        );
    }
    if (q.format === "numberline") {
      const n = parseNumber(q.answer);
      const k = n ? (Number(n.n) / Number(n.d) - q.min) / q.step : 0;
      if (n && Math.abs(k - Math.round(k)) > 1e-9)
        add(
          "numberline-off-tick",
          "check",
          at(q),
          T(
            "The answer is not on a tick mark, so students cannot pick it by tapping the line.",
            "La respuesta no está en una marca, así que los estudiantes no pueden elegirla tocando la recta.",
          ),
          T(
            "Change the step so the answer lands on a tick. Typing the number still works.",
            "Cambie el paso para que la respuesta quede en una marca. Escribir el número sigue funcionando.",
          ),
        );
    }
    if (
      q.format === "plot" &&
      new Set(q.points.map((p) => `${p.x},${p.y}`)).size !== q.points.length
    )
      add(
        "dup-point",
        "check",
        at(q),
        T("The same point is listed twice.", "El mismo punto aparece dos veces."),
        T("Remove the repeated point.", "Quite el punto repetido."),
      );
    if (
      q.format === "error" &&
      q.steps.length > 1 &&
      q.steps.every((s) => prefixNumber(s.text) !== undefined) &&
      q.steps.some((s, i) => Number(prefixNumber(s.text)) !== i + 1)
    )
      add(
        "step-numbering",
        "check",
        at(q),
        T(
          "The numbers typed in the steps do not match their order.",
          "Los números escritos en los pasos no coinciden con su orden.",
        ),
        T(
          "Renumber the steps 1, 2, 3 in the order shown.",
          "Renumere los pasos 1, 2, 3 en el orden mostrado.",
        ),
        "renumber-sequence",
      );
  }
  if (
    qs.length > 1 &&
    qs.every((q) => prefixNumber(q.prompt) !== undefined) &&
    qs.some((q, i) => Number(prefixNumber(q.prompt)) !== i + 1)
  )
    add(
      "question-numbering",
      "check",
      {},
      T(
        "The numbers typed at the start of the questions do not match their order.",
        "Los números escritos al inicio de las preguntas no coinciden con su orden.",
      ),
      T(
        "Renumber the questions 1, 2, 3 in the order shown.",
        "Renumere las preguntas 1, 2, 3 en el orden mostrado.",
      ),
      "renumber-sequence",
    );
}

// ── controls without a non-drag alternative ────────────────────────────────────
// Read from player/formats-*.js: nothing in the player needs dragging (every format picks, taps, types or uses
// arrow keys). The two real gaps are where the alternative is built from content the activity may lack.

const PLOT_CELLS = 20; // player/formats-spatial.js buildPlot shows at most min..min+20

export function checkControls(a, add) {
  for (const q of questionsOf(a)) {
    if (q.format === "hotspot" && q.regions.some((r) => !r.label.trim()))
      add(
        "no-keyboard-path",
        "fix",
        at(q),
        T(
          "A clickable area has no label, so keyboard and screen-reader users have nothing to choose.",
          "Un área seleccionable no tiene etiqueta, así que quienes usan teclado o lector de pantalla no tienen qué elegir.",
        ),
        T(
          "Give every area a short name; the list of names is the keyboard alternative.",
          "Dele a cada área un nombre corto; la lista de nombres es la alternativa para el teclado.",
        ),
      );
    if (
      q.format === "plot" &&
      q.max - q.min > PLOT_CELLS &&
      q.points.some((p) => p.x > q.min + PLOT_CELLS || p.y > q.min + PLOT_CELLS)
    )
      add(
        "no-keyboard-path",
        "fix",
        at(q),
        T(
          `The grid is wider than ${PLOT_CELLS} units, so a point cannot be placed by tapping, arrow keys or typing.`,
          `La cuadrícula es más ancha que ${PLOT_CELLS} unidades, así que no se puede ubicar un punto tocando, con flechas ni escribiendo.`,
        ),
        T(
          `Shrink the grid to at most ${PLOT_CELLS} units.`,
          `Reduzca la cuadrícula a un máximo de ${PLOT_CELLS} unidades.`,
        ),
      );
  }
}

// ── student workspace on paper ─────────────────────────────────────────────────

const WORDS_PER_LINE = 7; // print/paper-model.js writingLines
const WORKBOX_LINES = { normal: 3, roomy: 5 }; // print/css.js: .workbox 1.05in / 1.9in over .36in ruled lines

export function checkWorkspace(a, add, format) {
  if (a.kind !== "worksheet" && format === "student") return;
  for (const q of questionsOf(a)) {
    if (q.format === "short" && q.minWords > writingLines(q, a.options.workspace) * WORDS_PER_LINE)
      add(
        "workspace-too-small",
        "fix",
        at(q),
        T(
          `Students must write ${q.minWords} words, but the printed lines hold about ${writingLines(q, a.options.workspace) * WORDS_PER_LINE}.`,
          `Los estudiantes deben escribir ${q.minWords} palabras, pero las líneas impresas solo admiten unas ${writingLines(q, a.options.workspace) * WORDS_PER_LINE}.`,
        ),
        T(
          "Lower the minimum words, or ask for the writing on separate paper.",
          "Reduzca el mínimo de palabras o pida la escritura en otra hoja.",
        ),
      );
    if (q.format === "number") {
      const steps = (q.explanation.match(/[^.!?\n]+/g) || []).filter(
        (s) => /\d/.test(s) && /[=+\-−×÷*/]/.test(s),
      ).length;
      if (steps > WORKBOX_LINES[a.options.workspace])
        add(
          "workspace-too-small",
          "check",
          at(q),
          T(
            `The worked solution has ${steps} steps, which may not fit the work space.`,
            `La solución resuelta tiene ${steps} pasos, que quizá no quepan en el espacio de trabajo.`,
          ),
          T(
            "Set the work space to Roomy, or let students use extra paper.",
            "Cambie el espacio de trabajo a Amplio o deje que usen hojas adicionales.",
          ),
        );
    }
  }
}

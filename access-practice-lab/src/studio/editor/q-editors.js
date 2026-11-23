// Per-format editors for the question card. Each builds plain controls for ONE question and calls ctx.edit() with a
// change. Typing edits pass a key (coalesced undo, no panel rebuild); adding/removing rows is structural (the card
// rebuilds). Correct answers are chosen with radio buttons or checkboxes, never by typing an id.
// ctx = { S, edit(mutate, { key, structure }), mathTray(): Node }

import { marksOf } from "../core/check.js";
import { uid } from "../core/schema.js";
import { button, field, h, iconButton, select, textArea, textInput, toggle } from "./ui.js";

const name = () => uid("g");

/** A bordered list with an Add button. renderRow(item, index) returns the row node. */
export function rows(ctx, items, renderRow, onAdd, addLabel, max = 8) {
  const list = h(
    "ul.st-rows",
    items.map((it, i) => h("li.st-row", renderRow(it, i))),
  );
  const add = items.length < max ? button(addLabel, onAdd, "small ghost") : null;
  return h("div", list, add);
}

const removeBtn = (ctx, label, onRemove, disabled = false) =>
  iconButton("✕", label, onRemove, { disabled });

function choiceRows(ctx, q, multi) {
  const group = name();
  return rows(
    ctx,
    q.options,
    (o, i) => [
      h("input", {
        type: multi ? "checkbox" : "radio",
        name: group,
        checked: multi ? q.answers.includes(o.id) : q.answer === o.id,
        "aria-label": ctx.S(`Option ${i + 1} is correct`, `La opción ${i + 1} es correcta`),
        onchange: (e) =>
          ctx.edit(
            (b) =>
              multi
                ? (b.answers = e.target.checked
                    ? [...new Set([...b.answers, o.id])]
                    : b.answers.filter((a) => a !== o.id))
                : (b.answer = o.id),
            { key: `${q.id}:ans` },
          ),
      }),
      textInput(
        o.text,
        (v) =>
          ctx.edit((b) => (b.options.find((x) => x.id === o.id).text = v), {
            key: `${q.id}:${o.id}`,
          }),
        {
          "aria-label": ctx.S(`Option ${i + 1}`, `Opción ${i + 1}`),
          placeholder: ctx.S("Answer choice", "Opción de respuesta"),
        },
      ),
      removeBtn(
        ctx,
        ctx.S(`Remove option ${i + 1}`, `Quitar la opción ${i + 1}`),
        () =>
          ctx.edit(
            (b) => (
              (b.options = b.options.filter((x) => x.id !== o.id)),
              (b.answers = (b.answers || []).filter((a) => a !== o.id)),
              b.answer === o.id && (b.answer = "")
            ),
            { structure: true },
          ),
        q.options.length <= 2,
      ),
    ],
    () => ctx.edit((b) => b.options.push({ id: uid("o"), text: "" }), { structure: true }),
    ctx.S("Add a choice", "Añadir una opción"),
  );
}

const text = (ctx, q, key, label, attrs = {}) =>
  field(
    label,
    textArea(q[key], (v) => ctx.edit((b) => (b[key] = v), { key: `${q.id}:${key}` }), attrs),
  );

/** Hint for markers: the teacher types the answer in [[double brackets]]. */
const markerHelp = (ctx, kind) =>
  h(
    "p.st-hint",
    kind === "blank"
      ? ctx.S(
          "Put the missing word in [[double brackets]]. For more than one right answer: [[big|large]].",
          "Ponga la palabra que falta entre [[corchetes dobles]]. Para varias respuestas correctas: [[grande|enorme]].",
        )
      : ctx.S(
          "Put each correct word in [[double brackets]]. Students click those words.",
          "Ponga cada palabra correcta entre [[corchetes dobles]]. Los estudiantes hacen clic en esas palabras.",
        ),
  );

export const EDITORS = {
  choice: (ctx, q) => choiceRows(ctx, q, false),
  multi: (ctx, q) => choiceRows(ctx, q, true),
  match: (ctx, q) =>
    rows(
      ctx,
      q.pairs,
      (p, i) => [
        textInput(
          p.left,
          (v) =>
            ctx.edit((b) => (b.pairs.find((x) => x.id === p.id).left = v), {
              key: `${q.id}:${p.id}l`,
            }),
          {
            "aria-label": ctx.S(`Pair ${i + 1}, left`, `Pareja ${i + 1}, izquierda`),
            placeholder: ctx.S("Word", "Palabra"),
          },
        ),
        h("span.st-arrow", { "aria-hidden": "true" }, "↔"),
        textInput(
          p.right,
          (v) =>
            ctx.edit((b) => (b.pairs.find((x) => x.id === p.id).right = v), {
              key: `${q.id}:${p.id}r`,
            }),
          {
            "aria-label": ctx.S(`Pair ${i + 1}, right`, `Pareja ${i + 1}, derecha`),
            placeholder: ctx.S("Meaning", "Significado"),
          },
        ),
        removeBtn(
          ctx,
          ctx.S(`Remove pair ${i + 1}`, `Quitar la pareja ${i + 1}`),
          () =>
            ctx.edit((b) => (b.pairs = b.pairs.filter((x) => x.id !== p.id)), { structure: true }),
          q.pairs.length <= 2,
        ),
      ],
      () =>
        ctx.edit((b) => b.pairs.push({ id: uid("p"), left: "", right: "" }), { structure: true }),
      ctx.S("Add a pair", "Añadir una pareja"),
      8,
    ),
  sort: (ctx, q) =>
    h(
      "div",
      h("h4.st-sub", ctx.S("Groups", "Grupos")),
      rows(
        ctx,
        q.categories,
        (c, i) => [
          textInput(
            c.label,
            (v) =>
              ctx.edit((b) => (b.categories.find((x) => x.id === c.id).label = v), {
                key: `${q.id}:${c.id}`,
              }),
            { "aria-label": ctx.S(`Group ${i + 1}`, `Grupo ${i + 1}`) },
          ),
          removeBtn(
            ctx,
            ctx.S(`Remove group ${i + 1}`, `Quitar el grupo ${i + 1}`),
            () =>
              ctx.edit(
                (b) => (
                  (b.categories = b.categories.filter((x) => x.id !== c.id)),
                  (b.items = b.items.filter((x) => x.category !== c.id))
                ),
                { structure: true },
              ),
            q.categories.length <= 2,
          ),
        ],
        () => ctx.edit((b) => b.categories.push({ id: uid("c"), label: "" }), { structure: true }),
        ctx.S("Add a group", "Añadir un grupo"),
        4,
      ),
      h("h4.st-sub", ctx.S("Items and their group", "Elementos y su grupo")),
      rows(
        ctx,
        q.items,
        (it, i) => [
          textInput(
            it.text,
            (v) =>
              ctx.edit((b) => (b.items.find((x) => x.id === it.id).text = v), {
                key: `${q.id}:${it.id}`,
              }),
            { "aria-label": ctx.S(`Item ${i + 1}`, `Elemento ${i + 1}`) },
          ),
          select(
            q.categories.map((c) => [
              c.id,
              c.label || ctx.S("(unnamed group)", "(grupo sin nombre)"),
            ]),
            it.category,
            (v) =>
              ctx.edit((b) => (b.items.find((x) => x.id === it.id).category = v), {
                structure: true,
              }),
            { "aria-label": ctx.S(`Group for item ${i + 1}`, `Grupo del elemento ${i + 1}`) },
          ),
          removeBtn(
            ctx,
            ctx.S(`Remove item ${i + 1}`, `Quitar el elemento ${i + 1}`),
            () =>
              ctx.edit((b) => (b.items = b.items.filter((x) => x.id !== it.id)), {
                structure: true,
              }),
            q.items.length <= 2,
          ),
        ],
        () =>
          ctx.edit(
            (b) => b.items.push({ id: uid("i"), text: "", category: b.categories[0]?.id || "" }),
            { structure: true },
          ),
        ctx.S("Add an item", "Añadir un elemento"),
        24,
      ),
    ),
  order: (ctx, q) =>
    h(
      "div",
      h(
        "p.st-hint",
        ctx.S(
          "List the items in the CORRECT order. Students will see them mixed up.",
          "Escriba los elementos en el orden CORRECTO. Los estudiantes los verán mezclados.",
        ),
      ),
      rows(
        ctx,
        q.items,
        (it, i) => [
          h("span.st-num", `${i + 1}.`),
          textInput(
            it.text,
            (v) =>
              ctx.edit((b) => (b.items.find((x) => x.id === it.id).text = v), {
                key: `${q.id}:${it.id}`,
              }),
            { "aria-label": ctx.S(`Step ${i + 1}`, `Paso ${i + 1}`) },
          ),
          iconButton(
            "↑",
            ctx.S("Move up", "Subir"),
            () => ctx.edit((b) => swap(b.items, i, i - 1), { structure: true }),
            { disabled: i === 0 },
          ),
          iconButton(
            "↓",
            ctx.S("Move down", "Bajar"),
            () => ctx.edit((b) => swap(b.items, i, i + 1), { structure: true }),
            { disabled: i === q.items.length - 1 },
          ),
          removeBtn(
            ctx,
            ctx.S(`Remove step ${i + 1}`, `Quitar el paso ${i + 1}`),
            () =>
              ctx.edit((b) => (b.items = b.items.filter((x) => x.id !== it.id)), {
                structure: true,
              }),
            q.items.length <= 2,
          ),
        ],
        () => ctx.edit((b) => b.items.push({ id: uid("i"), text: "" }), { structure: true }),
        ctx.S("Add a step", "Añadir un paso"),
        12,
      ),
    ),
  blank: (ctx, q) =>
    h(
      "div",
      markerHelp(ctx, "blank"),
      text(
        ctx,
        q,
        "text",
        ctx.S("Sentence with the missing word", "Oración con la palabra que falta"),
        { rows: 3 },
      ),
      toggle(ctx.S("Show a word bank", "Mostrar un banco de palabras"), q.bank, (v) =>
        ctx.edit((b) => (b.bank = v), { structure: true }),
      ),
      h(
        "p.st-hint",
        ctx.S(
          `${marksOf(q.text).length} blank(s) found`,
          `${marksOf(q.text).length} espacio(s) encontrado(s)`,
        ),
      ),
    ),
  identify: (ctx, q) =>
    h(
      "div",
      markerHelp(ctx, "identify"),
      text(
        ctx,
        q,
        "text",
        ctx.S("Text students click in", "Texto donde los estudiantes hacen clic"),
        { rows: 5 },
      ),
      h(
        "p.st-hint",
        ctx.S(
          `${marksOf(q.text).length} correct word(s) found`,
          `${marksOf(q.text).length} palabra(s) correcta(s) encontrada(s)`,
        ),
      ),
    ),
  number: (ctx, q) =>
    h(
      "div.st-grid",
      field(
        ctx.S("Correct answer", "Respuesta correcta"),
        textInput(q.answer, (v) => ctx.edit((b) => (b.answer = v), { key: `${q.id}:a` }), {
          inputmode: "text",
          placeholder: "3/4",
        }),
        ctx.S(
          "A number, fraction or decimal. 0.75, 3/4 and 75% all count as the same.",
          "Un número, fracción o decimal. 0,75; 3/4 y 75 % cuentan como lo mismo.",
        ),
      ),
      field(
        ctx.S("Unit (optional)", "Unidad (opcional)"),
        textInput(q.unit, (v) => ctx.edit((b) => (b.unit = v), { key: `${q.id}:u` }), {
          placeholder: "cm",
        }),
      ),
      field(
        ctx.S(
          "Check my answer against this calculation (optional)",
          "Comprobar mi respuesta con este cálculo (opcional)",
        ),
        textInput(
          q.expr,
          (v) => ctx.edit((b) => (b.expr = v), { structure: true, key: `${q.id}:e` }),
          { placeholder: "1/2 + 1/4" },
        ),
        ctx.S(
          "If you type the calculation, we make sure the answer is right.",
          "Si escribe el cálculo, comprobamos que la respuesta sea correcta.",
        ),
      ),
      field(
        ctx.S("Also accept (optional)", "También aceptar (opcional)"),
        textInput(
          q.accept.join(", "),
          (v) =>
            ctx.edit(
              (b) =>
                (b.accept = v
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean)),
              { key: `${q.id}:acc` },
            ),
          { placeholder: "0.75, 75%" },
        ),
      ),
    ),
  short: (ctx, q) =>
    h(
      "div",
      select(
        [
          ["write", ctx.S("Writing task", "Tarea de escritura")],
          ["explain", ctx.S("Explain your thinking", "Explicar el razonamiento")],
        ],
        q.kind,
        (v) => ctx.edit((b) => (b.kind = v), { structure: true }),
        { "aria-label": ctx.S("Kind of response", "Tipo de respuesta") },
      ),
      text(
        ctx,
        q,
        "sample",
        ctx.S(
          "Sample answer (students compare after trying)",
          "Respuesta de ejemplo (los estudiantes comparan después de intentar)",
        ),
        { rows: 3 },
      ),
      field(
        ctx.S(
          "What a good answer includes (one per line)",
          "Qué incluye una buena respuesta (una por línea)",
        ),
        textArea(
          q.rubric.join("\n"),
          (v) =>
            ctx.edit(
              (b) =>
                (b.rubric = v
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)),
              { key: `${q.id}:rub` },
            ),
          { rows: 3 },
        ),
      ),
    ),
  build: (ctx, q) =>
    field(
      ctx.S("The finished sentence", "La oración terminada"),
      textInput(
        q.words.join(" "),
        (v) => ctx.edit((b) => (b.words = v.split(/\s+/).filter(Boolean)), { key: `${q.id}:w` }),
        { placeholder: ctx.S("Plants need water", "Las plantas necesitan agua") },
      ),
      ctx.S(
        "Students put the words in order. Type the sentence in the correct order.",
        "Los estudiantes ordenan las palabras. Escriba la oración en el orden correcto.",
      ),
    ),
};

function swap(list, a, b) {
  if (b < 0 || b >= list.length) return;
  [list[a], list[b]] = [list[b], list[a]];
}
export { swap };

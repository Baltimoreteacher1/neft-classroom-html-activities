// A plain-language editor for ONE animation block: choose what the animation explains, type its values into ordinary
// controls, and watch it play in a live preview that is the real student player (same bundle, same controls). The
// block keeps only the preset and its values (core/schema.js cleanAnimationParams); x/animations.js builds the frames
// from them, so the animation stays accurate when a value changes.
//
//   animationBlockEditor(block, { store, S, onChange }) -> HTMLElement
//   blankAnimationFields(preset)                        -> { preset, params, title, explanation, alt } for a new block
//
// Typing edits ("type") never rebuild the controls, so the cursor never jumps; edits that add or remove a row, or
// change the preset, rebuild them here. Every message is {en, es} through S(en, es).

import {
  ANIMATION_LIMITS,
  ANIMATION_PRESETS,
  cleanAnimationParams,
  normalizeActivity,
  SENTENCE_ADDS,
  WORD_PART_KINDS,
} from "../core/schema.js";
import { expandAnimation, explainAnimation } from "../x/animations.js";
import { studentHtml } from "./preview.js";
import { button, debounce, field, h, iconButton, select, textArea, textInput } from "./ui.js";

const PRESET_LABEL = {
  process: ["Steps in order (a process)", "Pasos en orden (un proceso)"],
  timeline: ["Timeline of events", "Línea de tiempo de eventos"],
  "word-build": ["Build a word from its parts", "Formar una palabra con sus partes"],
  "sentence-expand": ["Make a sentence grow", "Hacer crecer una oración"],
  "cause-effect": ["Cause and effect", "Causa y efecto"],
  "ratio-change": ["A ratio that changes", "Una razón que cambia"],
  "geometry-dims": ["A shape as its measurements change", "Una figura al cambiar sus medidas"],
};
const PRESET_HINT = {
  process: ["Each step lights up in turn.", "Cada paso se ilumina por turno."],
  timeline: [
    "Events appear one at a time, oldest first, on a to-scale line.",
    "Los eventos aparecen uno por uno, del más antiguo al más reciente, en una línea a escala.",
  ],
  "word-build": [
    "The prefix, root and suffix join up. You type the parts and what each means.",
    "El prefijo, la raíz y el sufijo se unen. Usted escribe las partes y lo que significa cada una.",
  ],
  "sentence-expand": [
    "Start with a short sentence and add a phrase at a time.",
    "Empiece con una oración corta y agregue una frase a la vez.",
  ],
  "cause-effect": [
    "Each cause points to its effect, one pair at a time. To make a chain, start a cause with the effect before it.",
    "Cada causa apunta a su efecto, un par a la vez. Para hacer una cadena, repita como causa el efecto anterior.",
  ],
  "ratio-change": [
    "Two quantities are multiplied by the same numbers. A table and bars show each step with exact math.",
    "Dos cantidades se multiplican por los mismos números. Una tabla y barras muestran cada paso con matemática exacta.",
  ],
  "geometry-dims": [
    "A box (or a fraction bar) is redrawn for each set of numbers, with its exact volume.",
    "Una caja (o una barra de fracción) se dibuja de nuevo para cada juego de números, con su volumen exacto.",
  ],
};

const rows = (n, make) => Array.from({ length: n }, make);
const BLANK = {
  process: () => ({ stages: rows(3, (_, i) => ({ label: `Step ${i + 1}`, text: "" })) }),
  timeline: () => ({ events: rows(2, () => ({ year: null, label: "" })) }),
  "word-build": () => ({
    word: "",
    meaning: "",
    parts: [
      { kind: "prefix", text: "", meaning: "" },
      { kind: "root", text: "", meaning: "" },
    ],
  }),
  "sentence-expand": () => ({ base: "", additions: [{ adds: "because", text: "" }] }),
  "cause-effect": () => ({ pairs: rows(2, () => ({ cause: "", effect: "" })) }),
  "ratio-change": () => ({
    a: { label: "", value: 2 },
    b: { label: "", value: 3 },
    scales: [2, 3],
  }),
  "geometry-dims": () => ({
    shape: "prism",
    unit: "",
    dims: [
      { l: 2, w: 3, h: 4 },
      { l: 2, w: 3, h: 8 },
    ],
  }),
};
const NEW_ROW = {
  stages: () => ({ label: "", text: "" }),
  events: () => ({ year: null, label: "" }),
  parts: () => ({ kind: "root", text: "", meaning: "" }),
  additions: () => ({ adds: "detail", text: "" }),
  pairs: () => ({ cause: "", effect: "" }),
  scales: () => null,
  dims: () => ({ l: null, w: null, h: null }),
  numerators: () => null,
};
const MAX = {
  stages: ANIMATION_LIMITS.stages,
  events: ANIMATION_LIMITS.events,
  parts: ANIMATION_LIMITS.parts,
  additions: ANIMATION_LIMITS.additions,
  pairs: ANIMATION_LIMITS.pairs,
  scales: ANIMATION_LIMITS.scales,
  dims: ANIMATION_LIMITS.dims,
  numerators: ANIMATION_LIMITS.dims,
};

/** The fields a new `animation` block starts with: text presets are empty (nothing is invented), number presets hold plain numbers. */
export const blankAnimationFields = (preset = "process") => ({
  preset,
  params: cleanAnimationParams(preset, BLANK[preset]()),
  title: "",
  explanation: { en: "", es: "" },
  alt: { en: "", es: "" },
});

const show = (v) => (v === null || v === undefined ? "" : String(v));

export function animationBlockEditor(block, { store, S, onChange } = {}) {
  const id = block.id;
  const lang = S("en", "es") === "es" ? "es" : "en";
  const current = () => store.get().blocks.find((b) => b.id === id) ?? block;
  const params = () => current().params;
  const root = h("div.st-animation-editor");
  const fields = h("div");
  const message = h("p.st-warn", { role: "status", hidden: true });
  // ui.js say() builds "div#st-live", which createElement rejects, so this editor keeps its own live region.
  const live = h("p.st-sr", { role: "status", "aria-live": "polite" });
  const say = (m) => {
    live.textContent = "";
    setTimeout(() => (live.textContent = m), 30);
  };
  let focusAfter = "";

  const frame = h("iframe", {
    title: S(
      "Preview of the animation (the real student page)",
      "Vista previa de la animación (la página real del estudiante)",
    ),
    sandbox: "allow-scripts",
    referrerpolicy: "no-referrer",
  });
  frame.style.cssText =
    "width:100%;height:540px;border:1px solid #888;border-radius:8px;background:#fff";
  const preview = h("div", message, frame);

  let paints = 0;
  async function paintPreview() {
    const turn = ++paints;
    const b = current();
    const built = expandAnimation(b, { lang });
    frame.hidden = !built.ok;
    message.hidden = built.ok;
    message.textContent = built.ok ? "" : explainAnimation(built)[lang];
    if (!built.ok) return;
    const a = normalizeActivity({
      id: "animation-preview",
      title: S("Animation preview", "Vista previa de la animación"),
      kind: "worksheet",
      supports: { spanish: true },
      blocks: [b],
    });
    try {
      const html = await studentHtml(a, { lang });
      if (turn === paints) frame.srcdoc = html;
    } catch {
      if (turn !== paints) return; // a newer edit already redrew the preview
      message.hidden = false;
      message.textContent = S(
        "The preview could not load. Your work is safe.",
        "No se pudo cargar la vista previa. Su trabajo está a salvo.",
      );
    }
  }
  const later = debounce(paintPreview, 400);

  const edit = (mutate, { key = "", structure = false } = {}) => {
    store.apply((d) => mutate(d.blocks.find((b) => b.id === id)), {
      coalesce: key,
      reason: structure ? "structure" : "type",
    });
    if (structure) {
      paintFields();
      if (focusAfter) fields.querySelector(focusAfter)?.focus();
      focusAfter = "";
      later.flush();
    } else later();
    onChange?.(current());
  };
  const editParams = (mutate, opts) => edit((b) => mutate(b.params), opts);

  // ── controls ───────────────────────────────────────────────────────────────

  const text = (label, get, set, key, hint, attrs) =>
    field(
      label,
      textInput(get(), (v) => editParams((p) => set(p, v), { key: `${id}:${key}` }), attrs),
      hint,
    );
  const numeric = (label, get, set, key, hint) =>
    text(label, () => show(get()), set, key, hint, { inputmode: "decimal", autocomplete: "off" });

  /** One row per item, typed cells, remove buttons and an Add button. A column with no `key` edits the item itself. */
  function table({ list, columns, min, addLabel, rowLabel }) {
    const items = params()[list];
    const cell = (c, item, i) => {
      const get = () => (c.key ? item[c.key] : item);
      const set = (v) =>
        editParams((p) => (c.key ? (p[list][i][c.key] = v) : (p[list][i] = v)), {
          key: `${id}:${list}${i}${c.key ?? ""}`,
        });
      const name = { "aria-label": `${rowLabel} ${i + 1}: ${c.label}` };
      if (c.options)
        return select(
          c.options.map(([v, l]) => [v, S(...l)]),
          get(),
          set,
          name,
        );
      return textInput(c.numeric ? show(get()) : get(), set, {
        ...name,
        ...(c.numeric ? { inputmode: "decimal", autocomplete: "off" } : {}),
      });
    };
    const head = h(
      "tr",
      columns.map((c) => h("th", { scope: "col" }, c.label)),
      h("th", h("span.st-sr", S("Remove", "Quitar"))),
    );
    const body = items.map((item, i) =>
      h(
        "tr",
        columns.map((c) => h("td", cell(c, item, i))),
        h(
          "td",
          iconButton(
            "✕",
            `${S("Remove", "Quitar")} ${rowLabel} ${i + 1}`,
            () => {
              focusAfter = "[data-add]";
              editParams((p) => p[list].splice(i, 1), { structure: true });
              say(`${rowLabel} ${i + 1}: ${S("removed", "quitada")}`);
            },
            { disabled: items.length <= min },
          ),
        ),
      ),
    );
    return h(
      "div",
      h("table.st-grid-table", h("thead", head), h("tbody", body)),
      button(
        addLabel,
        () => {
          focusAfter = "tbody tr:last-child input, tbody tr:last-child select";
          editParams((p) => p[list].push(NEW_ROW[list]()), { structure: true });
          say(`${rowLabel} ${items.length + 1}: ${S("added", "agregada")}`);
        },
        "small ghost",
        { disabled: items.length >= MAX[list], "data-add": "" },
      ),
    );
  }

  const label = (en, es) => S(en, es);
  const PART_KINDS = WORD_PART_KINDS.map((k) => [
    k,
    { prefix: ["Prefix", "Prefijo"], root: ["Root", "Raíz"], suffix: ["Suffix", "Sufijo"] }[k],
  ]);
  const ADDS = SENTENCE_ADDS.map((k) => [
    k,
    {
      because: ["Adds a reason (because)", "Agrega una razón (porque)"],
      but: ["Adds a contrast (but)", "Agrega un contraste (pero)"],
      so: ["Adds a result (so)", "Agrega un resultado (así que)"],
      when: ["Adds a time (when)", "Agrega un tiempo (cuando)"],
      where: ["Adds a place (where)", "Agrega un lugar (donde)"],
      detail: ["Adds a detail", "Agrega un detalle"],
    }[k],
  ]);

  const PRESET_FIELDS = {
    process: () => [
      table({
        list: "stages",
        columns: [
          { key: "label", label: label("Step name", "Nombre del paso") },
          {
            key: "text",
            label: label(
              "One line that explains it (optional)",
              "Una línea que lo explica (opcional)",
            ),
          },
        ],
        min: 2,
        addLabel: S("Add a step", "Agregar un paso"),
        rowLabel: S("Step", "Paso"),
      }),
    ],
    timeline: () => [
      h(
        "p.st-hint",
        S(
          "Use a negative year for BCE (for example -500).",
          "Use un año negativo para a. C. (por ejemplo -500).",
        ),
      ),
      table({
        list: "events",
        columns: [
          { key: "year", label: label("Year", "Año"), numeric: true },
          { key: "label", label: label("Event", "Evento") },
        ],
        min: 2,
        addLabel: S("Add an event", "Agregar un evento"),
        rowLabel: S("Event", "Evento"),
      }),
    ],
    "word-build": () => [
      text(
        S("The whole word", "La palabra completa"),
        () => params().word,
        (p, v) => (p.word = v),
        "word",
        S(
          "Type it as it is spelled, for example unhappiness.",
          "Escríbala como se deletrea, por ejemplo infelicidad.",
        ),
      ),
      table({
        list: "parts",
        columns: [
          { key: "kind", label: label("Part", "Parte"), options: PART_KINDS },
          { key: "text", label: label("Letters", "Letras") },
          { key: "meaning", label: label("What it means", "Qué significa") },
        ],
        min: 2,
        addLabel: S("Add a part", "Agregar una parte"),
        rowLabel: S("Part", "Parte"),
      }),
      text(
        S("What the whole word means (optional)", "Qué significa la palabra completa (opcional)"),
        () => params().meaning,
        (p, v) => (p.meaning = v),
        "wmean",
      ),
    ],
    "sentence-expand": () => [
      text(
        S("Start with this sentence", "Empiece con esta oración"),
        () => params().base,
        (p, v) => (p.base = v),
        "base",
      ),
      table({
        list: "additions",
        columns: [
          { key: "adds", label: label("What it adds", "Qué agrega"), options: ADDS },
          {
            key: "text",
            label: label(
              "The words to add, with the joining word",
              "Las palabras que se agregan, con la palabra de unión",
            ),
          },
        ],
        min: 1,
        addLabel: S("Add a phrase", "Agregar una frase"),
        rowLabel: S("Phrase", "Frase"),
      }),
    ],
    "cause-effect": () => [
      table({
        list: "pairs",
        columns: [
          { key: "cause", label: label("Cause", "Causa") },
          { key: "effect", label: label("Effect", "Efecto") },
        ],
        min: 2,
        addLabel: S("Add a pair", "Agregar un par"),
        rowLabel: S("Pair", "Par"),
      }),
    ],
    "ratio-change": () => [
      text(
        S("First quantity: name", "Primera cantidad: nombre"),
        () => params().a.label,
        (p, v) => (p.a.label = v),
        "al",
        S("For example: cups of flour.", "Por ejemplo: tazas de harina."),
      ),
      numeric(
        S("First quantity: number", "Primera cantidad: número"),
        () => params().a.value,
        (p, v) => (p.a.value = v),
        "av",
        S(
          "A number greater than 0: 2, 0.5, 3/4 or 2 1/2.",
          "Un número mayor que 0: 2, 0.5, 3/4 o 2 1/2.",
        ),
      ),
      text(
        S("Second quantity: name", "Segunda cantidad: nombre"),
        () => params().b.label,
        (p, v) => (p.b.label = v),
        "bl",
      ),
      numeric(
        S("Second quantity: number", "Segunda cantidad: número"),
        () => params().b.value,
        (p, v) => (p.b.value = v),
        "bv",
      ),
      table({
        list: "scales",
        columns: [{ label: label("Multiply both by", "Multiplicar las dos por"), numeric: true }],
        min: 1,
        addLabel: S("Add a multiplier", "Agregar un multiplicador"),
        rowLabel: S("Multiplier", "Multiplicador"),
      }),
    ],
    "geometry-dims": () => [
      field(
        S("Show", "Mostrar"),
        select(
          [
            ["prism", S("A box (rectangular prism)", "Una caja (prisma rectangular)")],
            ["fraction", S("A fraction bar", "Una barra de fracción")],
          ],
          params().shape,
          (shape) => {
            if (shape === params().shape) return;
            edit(
              (b) =>
                (b.params =
                  shape === "fraction"
                    ? { shape, denominator: 4, numerators: [1, 3] }
                    : { ...BLANK["geometry-dims"]() }),
              { structure: true },
            );
          },
        ),
      ),
      ...(params().shape === "fraction"
        ? [
            numeric(
              S("Equal parts in one whole (1 to 16)", "Partes iguales en un entero (1 a 16)"),
              () => params().denominator,
              (p, v) => (p.denominator = v),
              "den",
            ),
            table({
              list: "numerators",
              columns: [
                { label: label("Shaded parts", "Partes sombreadas"), numeric: true },
              ],
              min: 2,
              addLabel: S("Add a step", "Agregar un paso"),
              rowLabel: S("Step", "Paso"),
            }),
          ]
        : [
            text(
              S("Unit (such as cm or in)", "Unidad (como cm o in)"),
              () => params().unit,
              (p, v) => (p.unit = v),
              "unit",
            ),
            h(
              "p.st-hint",
              S(
                "Each row is one picture. Use a number, a fraction (3/4) or a mixed number (2 1/2).",
                "Cada fila es un dibujo. Use un número, una fracción (3/4) o un número mixto (2 1/2).",
              ),
            ),
            table({
              list: "dims",
              columns: [
                { key: "l", label: label("Length", "Largo"), numeric: true },
                { key: "w", label: label("Width", "Ancho"), numeric: true },
                { key: "h", label: label("Height", "Alto"), numeric: true },
              ],
              min: 2,
              addLabel: S("Add a row", "Agregar una fila"),
              rowLabel: S("Row", "Fila"),
            }),
          ]),
    ],
  };

  function wording(group, key, lab, max) {
    return field(
      lab,
      textArea(
        current()[group][key],
        (v) => edit((b) => (b[group][key] = v), { key: `${id}:${group}${key}` }),
        { rows: 2, maxlength: max },
      ),
    );
  }

  function paintFields() {
    fields.replaceChildren();
    fields.append(
      field(
        S("What does this animation explain?", "¿Qué explica esta animación?"),
        select(
          ANIMATION_PRESETS.map((k) => [k, S(...PRESET_LABEL[k])]),
          current().preset,
          (preset) => {
            if (preset === current().preset) return;
            edit(
              (b) => {
                b.preset = preset;
                b.params = BLANK[preset]();
              },
              { structure: true },
            );
          },
        ),
        S(...PRESET_HINT[current().preset]),
      ),
      ...PRESET_FIELDS[current().preset](),
      h("h4", S("Words for the animation", "Palabras para la animación")),
      field(
        S("Title (optional)", "Título (opcional)"),
        textInput(current().title, (v) => edit((b) => (b.title = v), { key: `${id}:title` }), {
          maxlength: ANIMATION_LIMITS.title,
        }),
      ),
      wording(
        "explanation",
        "en",
        S(
          "Short explanation shown above it (English)",
          "Explicación breve que se muestra arriba (inglés)",
        ),
        ANIMATION_LIMITS.explanation,
      ),
      wording(
        "explanation",
        "es",
        S(
          "Short explanation shown above it (Spanish)",
          "Explicación breve que se muestra arriba (español)",
        ),
        ANIMATION_LIMITS.explanation,
      ),
      wording(
        "alt",
        "en",
        S(
          "Description for screen readers (English)",
          "Descripción para lectores de pantalla (inglés)",
        ),
        ANIMATION_LIMITS.alt,
      ),
      wording(
        "alt",
        "es",
        S(
          "Description for screen readers (Spanish)",
          "Descripción para lectores de pantalla (español)",
        ),
        ANIMATION_LIMITS.alt,
      ),
      h(
        "p.st-hint",
        S(
          "Leave the description blank to use the automatic one. Every step is also listed in words under the animation, and nothing plays until the student presses Play.",
          "Deje la descripción vacía para usar la automática. Cada paso también aparece en palabras bajo la animación, y nada se reproduce hasta que el estudiante presiona Reproducir.",
        ),
      ),
    );
    later();
  }

  root.append(
    h(
      "p.st-hint",
      S(
        "Type the values. The animation is built from them, so it stays accurate when you change one. Press Play in the preview to try it.",
        "Escriba los valores. La animación se construye con ellos, así que sigue siendo exacta si cambia uno. Presione Reproducir en la vista previa para probarla.",
      ),
    ),
    preview,
    fields,
    live,
  );
  paintFields();
  return root;
}

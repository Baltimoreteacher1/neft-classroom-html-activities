// A plain-language editor for ONE diagram block: pick the kind of figure, type its values into ordinary controls,
// and see the accurate figure redrawn as you type. The block keeps only the structured spec (core/schema.js
// cleanDiagramSpec), so the figure is always redrawn from the numbers by x/diagram-render.js.
//
//   diagramBlockEditor(block, { store, S, onChange }) -> HTMLElement
//   blankDiagramFields(kind)                          -> { spec, alt, caption } for a new block
//
// Typing edits ("type") never rebuild the controls, so the cursor never jumps; edits that add or remove a row, or
// change the kind, rebuild the controls here. Every message is {en, es} through S(en, es).

import { DIAGRAM_KINDS, cleanDiagramSpec } from "../core/schema.js";
import { renderDiagram } from "../x/diagram-render.js";
import { explainDiagram } from "../x/diagram-words.js";
import { button, field, h, iconButton, select, textArea, textInput } from "./ui.js";

const KIND_LABEL = {
  fraction: ["Fraction model", "Modelo de fracción"],
  prism: ["Box (rectangular prism)", "Caja (prisma rectangular)"],
  tape: ["Tape diagram", "Diagrama de cinta"],
  plane: ["Coordinate plane", "Plano de coordenadas"],
  bar: ["Bar chart", "Gráfica de barras"],
  dot: ["Dot plot", "Diagrama de puntos"],
  histogram: ["Histogram", "Histograma"],
  timeline: ["Timeline", "Línea de tiempo"],
  foodweb: ["Food web", "Red alimentaria"],
};

const rows = (n, make) => Array.from({ length: n }, make);
const BLANK = {
  fraction: () => ({ numerator: null, denominator: null, style: "bar" }),
  prism: () => ({ l: null, w: null, h: null, unit: "" }),
  tape: () => ({ parts: rows(2, () => ({ label: "", value: null })), total: null }),
  plane: () => ({
    xRange: [-10, 10],
    yRange: [-10, 10],
    points: [{ x: null, y: null, label: "" }],
  }),
  bar: () => ({ title: "", unit: "", categories: rows(3, () => ({ label: "", value: null })) }),
  dot: () => ({ title: "", unit: "", values: [] }),
  histogram: () => ({ title: "", unit: "", values: [], binWidth: null }),
  timeline: () => ({ events: rows(2, () => ({ year: null, label: "" })) }),
  foodweb: () => ({ relationships: rows(2, () => ({ eats: "", eaten: "" })) }),
};
const NEW_ROW = {
  categories: () => ({ label: "", value: null }),
  parts: () => ({ label: "", value: null }),
  points: () => ({ x: null, y: null, label: "" }),
  events: () => ({ year: null, label: "" }),
  relationships: () => ({ eats: "", eaten: "" }),
};

/** The fields a new `diagram` block starts with: a valid kind with empty values (nothing is invented). */
export const blankDiagramFields = (kind = "bar") => ({
  spec: cleanDiagramSpec({ kind, ...BLANK[kind]() }),
  alt: { en: "", es: "" },
  caption: { en: "", es: "" },
});

const show = (v) => (v === null || v === undefined ? "" : String(v));

export function diagramBlockEditor(block, { store, S, onChange } = {}) {
  const id = block.id;
  const lang = S("en", "es") === "es" ? "es" : "en";
  const current = () => store.get().blocks.find((b) => b.id === id) ?? block;
  const root = h("div.st-diagram-editor");
  const fields = h("div");
  const message = h("p.st-warn", { role: "status", hidden: true });
  let focusAfter = "";
  // ui.js say() builds "div#st-live", which createElement rejects, so this editor keeps its own live region.
  const live = h("p.st-sr", { role: "status", "aria-live": "polite" });
  const say = (m) => {
    live.textContent = "";
    setTimeout(() => (live.textContent = m), 30);
  };
  const art = h("div", { role: "group" });
  art.style.cssText = "max-width:100%;overflow:auto";
  const preview = h("div", art, message);
  const autoAlt = h("p.st-hint");
  const altIn = {};
  const capIn = {};

  const edit = (mutate, { key = "", structure = false } = {}) => {
    store.apply((d) => mutate(d.blocks.find((b) => b.id === id)), {
      coalesce: key,
      reason: structure ? "structure" : "type",
    });
    if (structure) {
      paintFields();
      if (focusAfter) fields.querySelector(focusAfter)?.focus();
      focusAfter = "";
    }
    paintPreview();
    onChange?.(current());
  };
  const editSpec = (mutate, opts) => edit((b) => mutate(b.spec), opts);

  // ── preview ────────────────────────────────────────────────────────────────

  function paintPreview() {
    const b = current();
    const shown = renderDiagram(b, { lang, suffix: `ed${id}` });
    art.replaceChildren();
    if (shown.ok) {
      const svg = new DOMParser().parseFromString(shown.svg, "image/svg+xml").documentElement;
      if (svg.localName === "svg" && !svg.querySelector("script,foreignObject")) {
        svg.removeAttribute("width");
        svg.removeAttribute("height");
        svg.style.cssText = "display:block;width:100%;max-width:640px;height:auto;background:#fff";
        art.append(document.importNode(svg, true));
      }
      art.setAttribute("aria-label", S("Preview of the figure", "Vista previa de la figura"));
      message.textContent = "";
      message.hidden = true;
    } else {
      art.removeAttribute("aria-label");
      message.hidden = false;
      message.textContent = explainDiagram(shown)[lang];
    }
    const plain = { ...b, alt: { en: "", es: "" }, caption: { en: "", es: "" } };
    const auto = renderDiagram(plain, { lang });
    autoAlt.textContent = auto.ok
      ? `${S("Automatic description", "Descripción automática")}: ${auto.alt}`
      : "";
    if (altIn.en) {
      altIn.en.placeholder = renderDiagram(plain, { lang: "en" }).alt ?? "";
      altIn.es.placeholder = renderDiagram(plain, { lang: "es" }).alt ?? "";
      capIn.en.placeholder = renderDiagram(plain, { lang: "en" }).caption ?? "";
      capIn.es.placeholder = renderDiagram(plain, { lang: "es" }).caption ?? "";
    }
  }

  // ── controls ───────────────────────────────────────────────────────────────

  const text = (label, get, set, key, attrs) =>
    field(
      label,
      textInput(get(), (v) => editSpec((s) => set(s, v), { key: `${id}:${key}` }), attrs),
    );
  const numeric = (label, get, set, key, hint) =>
    field(
      label,
      textInput(show(get()), (v) => editSpec((s) => set(s, v), { key: `${id}:${key}` }), {
        inputmode: "decimal",
        autocomplete: "off",
      }),
      hint,
    );

  /** A table with one row per item, typed cells, remove buttons and an Add button. */
  function table({ list, columns, min, max, addLabel, rowLabel, rowKind }) {
    const items = current().spec[list];
    const head = h(
      "tr",
      columns.map((c) => h("th", { scope: "col" }, c.label)),
      h("th", h("span.st-sr", S("Remove", "Quitar"))),
    );
    const body = items.map((item, i) =>
      h(
        "tr",
        columns.map((c) =>
          h(
            "td",
            textInput(
              c.numeric ? show(item[c.key]) : item[c.key],
              (v) => editSpec((s) => (s[list][i][c.key] = v), { key: `${id}:${list}${i}${c.key}` }),
              {
                "aria-label": `${rowLabel} ${i + 1}: ${c.label}`,
                ...(c.numeric ? { inputmode: "decimal", autocomplete: "off" } : {}),
              },
            ),
          ),
        ),
        h(
          "td",
          iconButton(
            "✕",
            `${S("Remove", "Quitar")} ${rowLabel} ${i + 1}`,
            () => {
              focusAfter = "[data-add]";
              editSpec((s) => s[list].splice(i, 1), { structure: true });
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
          focusAfter = "tbody tr:last-child input";
          editSpec((s) => s[list].push(NEW_ROW[rowKind]()), { structure: true });
          say(`${rowLabel} ${items.length + 1}: ${S("added", "agregada")}`);
        },
        "small ghost",
        { disabled: items.length >= max, "data-add": "" },
      ),
    );
  }

  const numbersBox = (list, label, hint) =>
    field(
      label,
      textArea(
        current().spec[list].map(show).join(", "),
        (v) =>
          editSpec(
            (s) => {
              s[list] = v
                .split(/[\s,;]+/)
                .filter(Boolean)
                .map((x) => x);
            },
            { key: `${id}:${list}` },
          ),
        { rows: 4, inputmode: "decimal", spellcheck: "false" },
      ),
      hint,
    );

  const titleUnit = () => [
    text(
      S("Title", "Título"),
      () => spec().title,
      (s, v) => (s.title = v),
      "title",
    ),
    text(
      S("Unit (optional)", "Unidad (opcional)"),
      () => spec().unit,
      (s, v) => (s.unit = v),
      "unit",
    ),
  ];
  const spec = () => current().spec;
  const numbersHint = () =>
    S(
      "Type or paste the numbers, separated by commas, spaces or new lines.",
      "Escriba o pegue los números, separados por comas, espacios o líneas nuevas.",
    );
  const COL_NAME = (en, es) => S(en, es);

  const KIND_FIELDS = {
    fraction: () => [
      numeric(
        S("Numerator (shaded parts)", "Numerador (partes sombreadas)"),
        () => spec().numerator,
        (s, v) => (s.numerator = v),
        "num",
      ),
      numeric(
        S("Denominator (equal parts in one whole)", "Denominador (partes iguales en un entero)"),
        () => spec().denominator,
        (s, v) => (s.denominator = v),
        "den",
      ),
      field(
        S("Shape", "Forma"),
        select(
          [
            ["bar", S("Bar", "Barra")],
            ["circle", S("Circle", "Círculo")],
          ],
          spec().style,
          (v) => editSpec((s) => (s.style = v), { structure: true }),
        ),
      ),
    ],
    prism: () => [
      numeric(
        S("Length", "Largo"),
        () => spec().l,
        (s, v) => (s.l = v),
        "l",
        S(
          "A number, fraction (3/4) or mixed number (2 1/2).",
          "Un número, fracción (3/4) o número mixto (2 1/2).",
        ),
      ),
      numeric(
        S("Width", "Ancho"),
        () => spec().w,
        (s, v) => (s.w = v),
        "w",
      ),
      numeric(
        S("Height", "Altura"),
        () => spec().h,
        (s, v) => (s.h = v),
        "h",
      ),
      text(
        S("Unit (such as cm or in)", "Unidad (como cm o in)"),
        () => spec().unit,
        (s, v) => (s.unit = v),
        "unit",
      ),
    ],
    tape: () => [
      table({
        list: "parts",
        columns: [
          { key: "label", label: COL_NAME("Name (optional)", "Nombre (opcional)") },
          {
            key: "value",
            label: COL_NAME("Value (blank = unknown)", "Valor (vacío = desconocido)"),
            numeric: true,
          },
        ],
        min: 1,
        max: 12,
        addLabel: S("Add a part", "Agregar una parte"),
        rowLabel: S("Part", "Parte"),
        rowKind: "parts",
      }),
      numeric(
        S("Total (needed when a part is unknown)", "Total (necesario si falta una parte)"),
        () => spec().total,
        (s, v) => (s.total = v),
        "total",
      ),
    ],
    plane: () => [
      ...["xRange", "yRange"].flatMap((axis) => {
        const name = axis === "xRange" ? "x" : "y";
        return [0, 1].map((k) =>
          numeric(
            `${name} ${k ? S("largest", "mayor") : S("smallest", "menor")}`,
            () => spec()[axis][k],
            (s, v) => (s[axis][k] = v),
            `${axis}${k}`,
          ),
        );
      }),
      table({
        list: "points",
        columns: [
          { key: "x", label: "x", numeric: true },
          { key: "y", label: "y", numeric: true },
          { key: "label", label: COL_NAME("Name (optional)", "Nombre (opcional)") },
        ],
        min: 0,
        max: 60,
        addLabel: S("Add a point", "Agregar un punto"),
        rowLabel: S("Point", "Punto"),
        rowKind: "points",
      }),
    ],
    bar: () => [
      ...titleUnit(),
      table({
        list: "categories",
        columns: [
          { key: "label", label: COL_NAME("Category", "Categoría") },
          { key: "value", label: COL_NAME("Value", "Valor"), numeric: true },
        ],
        min: 1,
        max: 40,
        addLabel: S("Add a row", "Agregar una fila"),
        rowLabel: S("Row", "Fila"),
        rowKind: "categories",
      }),
    ],
    dot: () => [
      ...titleUnit(),
      numbersBox(
        "values",
        S("Values", "Valores"),
        numbersHint(),
      ),
    ],
    histogram: () => [
      ...titleUnit(),
      numbersBox(
        "values",
        S("Values", "Valores"),
        numbersHint(),
      ),
      numeric(
        S(
          "Interval width (leave blank to choose automatically)",
          "Ancho del intervalo (vacío para elegirlo automáticamente)",
        ),
        () => spec().binWidth,
        (s, v) => (s.binWidth = v),
        "bin",
      ),
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
          { key: "year", label: COL_NAME("Year", "Año"), numeric: true },
          { key: "label", label: COL_NAME("Event", "Evento") },
        ],
        min: 2,
        max: 24,
        addLabel: S("Add an event", "Agregar un evento"),
        rowLabel: S("Event", "Evento"),
        rowKind: "events",
      }),
    ],
    foodweb: () => [
      h(
        "p.st-hint",
        S(
          "Each row says who eats what. Arrows are drawn from the food to the eater.",
          "Cada fila dice quién come qué. Las flechas van del alimento a quien lo come.",
        ),
      ),
      table({
        list: "relationships",
        columns: [
          { key: "eats", label: COL_NAME("Eater", "Quien come") },
          { key: "eaten", label: COL_NAME("Food (what it eats)", "Alimento (lo que come)") },
        ],
        min: 1,
        max: 60,
        addLabel: S("Add a link", "Agregar un enlace"),
        rowLabel: S("Link", "Enlace"),
        rowKind: "relationships",
      }),
    ],
  };

  function wording(group, key, label, max) {
    const input = textArea(
      current()[group][key],
      (v) => edit((b) => (b[group][key] = v), { key: `${id}:${group}${key}` }),
      { rows: 2, maxlength: max },
    );
    (group === "alt" ? altIn : capIn)[key] = input;
    return field(label, input);
  }

  function paintFields() {
    fields.replaceChildren();
    for (const k of ["en", "es"]) {
      delete altIn[k];
      delete capIn[k];
    }
    fields.append(
      field(
        S("Kind of figure", "Tipo de figura"),
        select(
          DIAGRAM_KINDS.map((k) => [k, S(...KIND_LABEL[k])]),
          current().spec.kind,
          (kind) => {
            if (kind === current().spec.kind) return;
            edit((b) => (b.spec = { kind, ...BLANK[kind]() }), { structure: true });
          },
        ),
      ),
      ...KIND_FIELDS[current().spec.kind](),
      h("h4", S("Words for the figure", "Palabras para la figura")),
      autoAlt,
      wording(
        "alt",
        "en",
        S(
          "Description for screen readers (English)",
          "Descripción para lectores de pantalla (inglés)",
        ),
        300,
      ),
      wording(
        "alt",
        "es",
        S(
          "Description for screen readers (Spanish)",
          "Descripción para lectores de pantalla (español)",
        ),
        300,
      ),
      wording("caption", "en", S("Caption (English)", "Pie de figura (inglés)"), 200),
      wording("caption", "es", S("Caption (Spanish)", "Pie de figura (español)"), 200),
      h(
        "p.st-hint",
        S(
          "Leave these blank to use the automatic description and caption, which always match the values.",
          "Déjelos vacíos para usar la descripción y el pie automáticos, que siempre coinciden con los valores.",
        ),
      ),
    );
    paintPreview();
  }

  root.append(
    h(
      "p.st-hint",
      S(
        "Type the values. The figure is drawn from your numbers, so it is always accurate.",
        "Escriba los valores. La figura se dibuja con sus números, así que siempre es exacta.",
      ),
    ),
    preview,
    fields,
  );
  paintFields();
  return root;
}

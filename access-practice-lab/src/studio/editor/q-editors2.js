// Editors for the visual formats: picture hotspots, number lines, error analysis, tables, coordinate points.
// Same contract as q-editors.js. Every drawing control has number fields as a keyboard alternative.

import { tableBlanks } from "../core/check.js";
import { uid } from "../core/schema.js";
import { IMAGE_ERRORS, imageFromFile } from "./media.js";
import { rows, swap } from "./q-editors.js";
import { button, field, h, iconButton, select, textInput } from "./ui.js";

const numField = (label, value, onChange, attrs = {}) =>
  field(
    label,
    h("input.st-input", {
      type: "number",
      value,
      step: "any",
      oninput: (e) => onChange(Number(e.target.value)),
      ...attrs,
    }),
  );

function hotspotEditor(ctx, q) {
  const status = h("p.st-hint", { role: "status" });
  const file = h("input", {
    type: "file",
    accept: "image/png,image/jpeg,image/webp,image/gif",
    "aria-label": ctx.S("Choose a picture", "Elija una imagen"),
    onchange: async (e) => {
      const res = await imageFromFile(e.target.files?.[0]);
      if (!res.ok) return void (status.textContent = ctx.S(...IMAGE_ERRORS[res.error]));
      ctx.edit((b) => (b.image = { src: res.src, alt: b.image?.alt || "", decorative: false }), {
        structure: true,
      });
    },
  });
  const stage = h("div.st-hotspot");
  if (q.image?.src) {
    stage.append(h("img", { src: q.image.src, alt: "", draggable: "false" }));
    q.regions.forEach((r, i) =>
      stage.append(
        h(
          "div.st-region",
          {
            style: `left:${r.x}%;top:${r.y}%;width:${r.w}%;height:${r.h}%`,
            "data-correct": q.answer === r.id ? "true" : null,
          },
          h("span", String.fromCharCode(65 + i)),
        ),
      ),
    );
    stage.addEventListener("pointerdown", (e) => {
      const box = stage.getBoundingClientRect();
      const pt = (ev) => [
        Math.max(0, Math.min(100, ((ev.clientX - box.left) / box.width) * 100)),
        Math.max(0, Math.min(100, ((ev.clientY - box.top) / box.height) * 100)),
      ];
      const [x0, y0] = pt(e);
      const ghost = h("div.st-region.ghost");
      stage.append(ghost);
      const move = (ev) => {
        const [x1, y1] = pt(ev);
        ghost.style.cssText = `left:${Math.min(x0, x1)}%;top:${Math.min(y0, y1)}%;width:${Math.abs(x1 - x0)}%;height:${Math.abs(y1 - y0)}%`;
      };
      const up = (ev) => {
        stage.removeEventListener("pointermove", move);
        stage.removeEventListener("pointerup", up);
        const [x1, y1] = pt(ev);
        const w = Math.abs(x1 - x0);
        const hh = Math.abs(y1 - y0);
        if (w < 3 || hh < 3) return void ghost.remove();
        ctx.edit(
          (b) =>
            b.regions.push({
              id: uid("r"),
              label: "",
              x: round(Math.min(x0, x1)),
              y: round(Math.min(y0, y1)),
              w: round(w),
              h: round(hh),
            }),
          { structure: true },
        );
      };
      stage.addEventListener("pointermove", move);
      stage.addEventListener("pointerup", up);
    });
  }
  const group = uid("g");
  return h(
    "div",
    field(ctx.S("Picture", "Imagen"), file),
    status,
    q.image?.src
      ? field(
          ctx.S(
            "Describe the picture for students who cannot see it",
            "Describa la imagen para estudiantes que no la ven",
          ),
          textInput(q.image.alt, (v) => ctx.edit((b) => (b.image.alt = v), { key: `${q.id}:alt` })),
        )
      : h(
          "p.st-hint",
          ctx.S(
            "Choose a picture, then drag on it to draw each clickable area.",
            "Elija una imagen y arrastre sobre ella para dibujar cada área.",
          ),
        ),
    stage,
    rows(
      ctx,
      q.regions,
      (r, i) => [
        h("input", {
          type: "radio",
          name: group,
          checked: q.answer === r.id,
          "aria-label": ctx.S(
            `Area ${String.fromCharCode(65 + i)} is correct`,
            `El área ${String.fromCharCode(65 + i)} es correcta`,
          ),
          onchange: () => ctx.edit((b) => (b.answer = r.id), { structure: true }),
        }),
        h("strong", String.fromCharCode(65 + i)),
        textInput(
          r.label,
          (v) =>
            ctx.edit((b) => (b.regions.find((x) => x.id === r.id).label = v), {
              key: `${q.id}:${r.id}`,
            }),
          {
            "aria-label": ctx.S(
              `Name of area ${String.fromCharCode(65 + i)}`,
              `Nombre del área ${String.fromCharCode(65 + i)}`,
            ),
            placeholder: ctx.S("Name (e.g. the seed)", "Nombre (p. ej. la semilla)"),
          },
        ),
        iconButton("✕", ctx.S("Remove area", "Quitar el área"), () =>
          ctx.edit(
            (b) => (
              (b.regions = b.regions.filter((x) => x.id !== r.id)),
              b.answer === r.id && (b.answer = "")
            ),
            { structure: true },
          ),
        ),
      ],
      () =>
        ctx.edit((b) => b.regions.push({ id: uid("r"), label: "", x: 10, y: 10, w: 30, h: 30 }), {
          structure: true,
        }),
      ctx.S("Add an area", "Añadir un área"),
      10,
    ),
  );
}
const round = (n) => Math.round(n * 10) / 10;

function errorEditor(ctx, q) {
  const group = uid("g");
  const fixGroup = uid("g");
  return h(
    "div",
    h(
      "p.st-hint",
      ctx.S(
        "Show a worked solution with one mistake. Choose the step that is wrong.",
        "Muestre una solución con un error. Elija el paso que está mal.",
      ),
    ),
    rows(
      ctx,
      q.steps,
      (s, i) => [
        h("input", {
          type: "radio",
          name: group,
          checked: q.errorStep === s.id,
          "aria-label": ctx.S(`Step ${i + 1} is the mistake`, `El paso ${i + 1} es el error`),
          onchange: () => ctx.edit((b) => (b.errorStep = s.id), { structure: true }),
        }),
        textInput(
          s.text,
          (v) =>
            ctx.edit((b) => (b.steps.find((x) => x.id === s.id).text = v), {
              key: `${q.id}:${s.id}`,
            }),
          { "aria-label": ctx.S(`Step ${i + 1}`, `Paso ${i + 1}`) },
        ),
        iconButton(
          "↑",
          ctx.S("Move up", "Subir"),
          () => ctx.edit((b) => swap(b.steps, i, i - 1), { structure: true }),
          { disabled: i === 0 },
        ),
        iconButton(
          "✕",
          ctx.S("Remove step", "Quitar el paso"),
          () =>
            ctx.edit(
              (b) => (
                (b.steps = b.steps.filter((x) => x.id !== s.id)),
                b.errorStep === s.id && (b.errorStep = "")
              ),
              { structure: true },
            ),
          { disabled: q.steps.length <= 2 },
        ),
      ],
      () => ctx.edit((b) => b.steps.push({ id: uid("e"), text: "" }), { structure: true }),
      ctx.S("Add a step", "Añadir un paso"),
      8,
    ),
    h(
      "h4.st-sub",
      ctx.S(
        "How to fix it (choose the correct fix)",
        "Cómo corregirlo (elija la corrección correcta)",
      ),
    ),
    rows(
      ctx,
      q.fixOptions,
      (o, i) => [
        h("input", {
          type: "radio",
          name: fixGroup,
          checked: q.fixAnswer === o.id,
          "aria-label": ctx.S(`Fix ${i + 1} is correct`, `La corrección ${i + 1} es correcta`),
          onchange: () => ctx.edit((b) => (b.fixAnswer = o.id), { structure: true }),
        }),
        textInput(
          o.text,
          (v) =>
            ctx.edit((b) => (b.fixOptions.find((x) => x.id === o.id).text = v), {
              key: `${q.id}:${o.id}`,
            }),
          { "aria-label": ctx.S(`Fix ${i + 1}`, `Corrección ${i + 1}`) },
        ),
        iconButton(
          "✕",
          ctx.S("Remove fix", "Quitar la corrección"),
          () =>
            ctx.edit(
              (b) => (
                (b.fixOptions = b.fixOptions.filter((x) => x.id !== o.id)),
                b.fixAnswer === o.id && (b.fixAnswer = "")
              ),
              { structure: true },
            ),
          { disabled: q.fixOptions.length <= 2 },
        ),
      ],
      () => ctx.edit((b) => b.fixOptions.push({ id: uid("f"), text: "" }), { structure: true }),
      ctx.S("Add a fix", "Añadir una corrección"),
      5,
    ),
  );
}

function tableEditor(ctx, q) {
  const setCell = (r, c, make) =>
    ctx.edit((b) => (b.rows[r][c] = make(b.rows[r][c])), { structure: true });
  const grid = h(
    "table.st-grid-table",
    h(
      "thead",
      h(
        "tr",
        q.headers.map((hd, c) =>
          h(
            "th",
            textInput(hd, (v) => ctx.edit((b) => (b.headers[c] = v), { key: `${q.id}:h${c}` }), {
              "aria-label": ctx.S(`Column ${c + 1} title`, `Título de la columna ${c + 1}`),
            }),
          ),
        ),
      ),
    ),
    h(
      "tbody",
      q.rows.map((row, r) =>
        h(
          "tr",
          row.map((cell, c) => {
            const blank = cell && typeof cell === "object";
            return h(
              "td",
              textInput(
                blank ? cell.answer : cell,
                (v) =>
                  ctx.edit((b) => (b.rows[r][c] = blank ? { answer: v } : v), {
                    key: `${q.id}:${r}:${c}`,
                  }),
                {
                  "aria-label": ctx.S(
                    `Row ${r + 1}, column ${c + 1}`,
                    `Fila ${r + 1}, columna ${c + 1}`,
                  ),
                },
              ),
              h(
                "label.st-cellblank",
                h("input", {
                  type: "checkbox",
                  checked: blank,
                  onchange: (e) =>
                    setCell(r, c, (old) =>
                      e.target.checked
                        ? { answer: String(old ?? "") }
                        : String(old?.answer ?? old ?? ""),
                    ),
                }),
                ctx.S("Student fills in", "El estudiante completa"),
              ),
            );
          }),
        ),
      ),
    ),
  );
  return h(
    "div",
    h(
      "p.st-hint",
      ctx.S(
        'Type the table. Tick "Student fills in" on each cell students must complete; the cell\'s text is the correct answer.',
        "Escriba la tabla. Marque «El estudiante completa» en cada celda que deban completar; el texto de la celda es la respuesta correcta.",
      ),
    ),
    grid,
    h(
      "div.st-actions",
      button(
        ctx.S("Add a row", "Añadir una fila"),
        () => ctx.edit((b) => b.rows.push(b.headers.map(() => "")), { structure: true }),
        "small ghost",
      ),
      button(
        ctx.S("Add a column", "Añadir una columna"),
        () =>
          ctx.edit((b) => (b.headers.push(""), b.rows.forEach((r) => r.push(""))), {
            structure: true,
          }),
        "small ghost",
        { disabled: q.headers.length >= 6 },
      ),
      button(
        ctx.S("Remove last row", "Quitar la última fila"),
        () => ctx.edit((b) => b.rows.pop(), { structure: true }),
        "small ghost",
        { disabled: q.rows.length <= 1 },
      ),
    ),
    h(
      "p.st-hint",
      ctx.S(
        `${tableBlanks(q).length} cell(s) for students to fill in`,
        `${tableBlanks(q).length} celda(s) para completar`,
      ),
    ),
  );
}

export const EDITORS2 = {
  hotspot: hotspotEditor,
  error: errorEditor,
  fillTable: tableEditor,
  numberline: (ctx, q) =>
    h(
      "div.st-grid",
      numField(ctx.S("Start", "Inicio"), q.min, (v) =>
        ctx.edit((b) => (b.min = v), { key: `${q.id}:min` }),
      ),
      numField(ctx.S("End", "Fin"), q.max, (v) =>
        ctx.edit((b) => (b.max = v), { key: `${q.id}:max` }),
      ),
      numField(
        ctx.S("Step between marks", "Paso entre marcas"),
        q.step,
        (v) => ctx.edit((b) => (b.step = v || 1), { key: `${q.id}:step` }),
        { min: "0" },
      ),
      field(
        ctx.S("Correct place", "Lugar correcto"),
        textInput(q.answer, (v) => ctx.edit((b) => (b.answer = v), { key: `${q.id}:ans` }), {
          placeholder: "3/4",
        }),
      ),
    ),
  plot: (ctx, q) =>
    h(
      "div",
      h(
        "div.st-grid",
        numField(ctx.S("Grid starts at", "La cuadrícula empieza en"), q.min, (v) =>
          ctx.edit((b) => (b.min = v), { key: `${q.id}:min` }),
        ),
        numField(ctx.S("Grid ends at", "La cuadrícula termina en"), q.max, (v) =>
          ctx.edit((b) => (b.max = v), { key: `${q.id}:max` }),
        ),
      ),
      h(
        "h4.st-sub",
        ctx.S("Points students should plot", "Puntos que deben marcar los estudiantes"),
      ),
      rows(
        ctx,
        q.points,
        (p, i) => [
          h("span", "("),
          h("input.st-input.st-num-in", {
            type: "number",
            value: p.x,
            "aria-label": `x ${i + 1}`,
            oninput: (e) =>
              ctx.edit((b) => (b.points[i].x = Number(e.target.value)), { key: `${q.id}:x${i}` }),
          }),
          h("span", ","),
          h("input.st-input.st-num-in", {
            type: "number",
            value: p.y,
            "aria-label": `y ${i + 1}`,
            oninput: (e) =>
              ctx.edit((b) => (b.points[i].y = Number(e.target.value)), { key: `${q.id}:y${i}` }),
          }),
          h("span", ")"),
          iconButton(
            "✕",
            ctx.S("Remove point", "Quitar el punto"),
            () => ctx.edit((b) => b.points.splice(i, 1), { structure: true }),
            { disabled: q.points.length <= 1 },
          ),
        ],
        () => ctx.edit((b) => b.points.push({ x: 0, y: 0 }), { structure: true }),
        ctx.S("Add a point", "Añadir un punto"),
        8,
      ),
    ),
};
export { select };

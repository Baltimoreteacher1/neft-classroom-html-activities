// The Content tab: title, then every block as a card you can open, edit, move, duplicate or remove.
// Cards are plain forms. Typing edits (reason "type") update the preview and autosave without rebuilding the cards,
// so the cursor never jumps; structural edits rebuild the panel and keep the open card open.

import { uid } from "../core/schema.js";
import {
  BLOCK_LABEL,
  COMMON_FORMATS,
  FORMAT_LABEL,
  MORE_FORMATS,
  OTHER_BLOCKS,
  newBlock,
  newQuestion,
} from "./blank-blocks.js";
import { EDITORS, swap } from "./q-editors.js";
import { EDITORS2 } from "./q-editors2.js";
import { IMAGE_ERRORS, imageFromFile } from "./media.js";
import {
  button,
  clear,
  disclosure,
  field,
  h,
  iconButton,
  select,
  say,
  textArea,
  textInput,
} from "./ui.js";

const FORMAT_EDITORS = { ...EDITORS, ...EDITORS2 };
const MATH_KEYS = [
  ["{1/2}", "a/b"],
  ["^2", "x²"],
  ["×", "×"],
  ["÷", "÷"],
  ["≤", "≤"],
  ["≥", "≥"],
  ["≠", "≠"],
  ["√", "√"],
  ["π", "π"],
  ["°", "°"],
];

export function createContentPanel(store, { S, onOpen }) {
  const el = h("div.st-content");
  let open = "";
  let lastField = null;
  el.addEventListener("focusin", (e) => {
    if (e.target.matches?.("input[type=text],textarea")) lastField = e.target;
  });

  const blockIssues = (id) => {
    const r = store.report();
    return {
      errors: r.errors.filter((i) => i.blockId === id),
      warnings: r.warnings.filter((i) => i.blockId === id),
    };
  };

  function mathTray() {
    return h(
      "div.st-tray",
      { role: "group", "aria-label": S("Math symbols", "Símbolos matemáticos") },
      MATH_KEYS.map(([ins, label]) =>
        h(
          "button.st-key",
          {
            type: "button",
            "aria-label": `${S("Insert", "Insertar")} ${label}`,
            onclick: () => insert(ins),
          },
          label,
        ),
      ),
    );
  }
  function insert(text) {
    const f = lastField;
    if (!f?.isConnected)
      return say(S("Click in a text box first.", "Primero haga clic en un cuadro de texto."));
    const start = f.selectionStart ?? f.value.length;
    f.setRangeText(text, start, f.selectionEnd ?? start, "end");
    f.dispatchEvent(new Event("input", { bubbles: true }));
    f.focus();
  }

  const editFor =
    (id) =>
    (mutate, { key = "", structure = false } = {}) =>
      store.apply((d) => mutate(d.blocks.find((b) => b.id === id)), {
        coalesce: key,
        reason: structure ? "structure" : "type",
      });

  function questionCard(b, index, total, n) {
    const ctx = { S, edit: editFor(b.id), mathTray };
    const body = h("div.st-card-body");
    body.append(
      field(
        S("Question", "Pregunta"),
        textArea(b.prompt, (v) => ctx.edit((q) => (q.prompt = v), { key: `${b.id}:prompt` }), {
          rows: 2,
        }),
      ),
    );
    body.append(FORMAT_EDITORS[b.format](ctx, b));
    body.append(
      field(
        S("Hint (shown if a student is stuck)", "Pista (se muestra si el estudiante se atasca)"),
        textInput(b.hint, (v) => ctx.edit((q) => (q.hint = v), { key: `${b.id}:hint` })),
      ),
      field(
        S("Explanation (shown after they answer)", "Explicación (se muestra después de responder)"),
        textArea(
          b.explanation,
          (v) => ctx.edit((q) => (q.explanation = v), { key: `${b.id}:exp` }),
          { rows: 2 },
        ),
      ),
      disclosure(
        S("More for this question", "Más para esta pregunta"),
        field(
          S("Sentence frame", "Marco de oración"),
          textInput(b.frame, (v) => ctx.edit((q) => (q.frame = v), { key: `${b.id}:frame` }), {
            placeholder: S("The text says ___.", "El texto dice ___."),
          }),
        ),
        field(
          S(
            "Common mistake to watch for (only you see this)",
            "Error común a vigilar (solo usted lo ve)",
          ),
          textInput(b.misconception, (v) =>
            ctx.edit((q) => (q.misconception = v), { key: `${b.id}:mis` }),
          ),
        ),
        details("Math", mathTray()),
        questionImage(ctx, b),
      ),
    );
    return card(
      b,
      index,
      total,
      `${n}. ${S(...FORMAT_LABEL[b.format])}`,
      b.prompt || b.text || S("(no question yet)", "(aún sin pregunta)"),
      body,
    );
  }

  const details = (label, node) =>
    h("div.st-field", h("p.st-label", S("Math symbols", "Símbolos matemáticos")), node);

  function questionImage(ctx, b) {
    if (b.format === "hotspot") return null;
    const status = h("p.st-hint", { role: "status" });
    const input = h("input", {
      type: "file",
      accept: "image/png,image/jpeg,image/webp,image/gif",
      onchange: async (e) => {
        const res = await imageFromFile(e.target.files?.[0]);
        if (!res.ok) return void (status.textContent = S(...IMAGE_ERRORS[res.error]));
        ctx.edit((q) => (q.image = { src: res.src, alt: q.image?.alt || "", decorative: false }), {
          structure: true,
        });
      },
    });
    return h(
      "div.st-field",
      field(S("Add a picture to this question", "Añadir una imagen a esta pregunta"), input),
      status,
      b.image?.src
        ? h(
            "div.st-attached",
            h("img", { src: b.image.src, alt: "", width: 120 }),
            field(
              S("Describe the picture", "Describa la imagen"),
              textInput(b.image.alt, (v) =>
                ctx.edit((q) => (q.image.alt = v), { key: `${b.id}:alt` }),
              ),
            ),
            button(
              S("Remove picture", "Quitar la imagen"),
              () => ctx.edit((q) => (q.image = null), { structure: true }),
              "small ghost",
            ),
          )
        : null,
    );
  }

  const BLOCK_BODY = {
    text: (b, ctx) =>
      h(
        "div",
        select(
          [
            ["directions", S("Directions", "Instrucciones")],
            ["body", S("Text", "Texto")],
            ["heading", S("Heading", "Encabezado")],
          ],
          b.role,
          (v) => ctx.edit((x) => (x.role = v), { structure: true }),
        ),
        field(
          S("Text", "Texto"),
          textArea(b.text, (v) => ctx.edit((x) => (x.text = v), { key: `${b.id}:t` }), { rows: 3 }),
        ),
        mathTray(),
      ),
    passage: (b, ctx) =>
      h(
        "div",
        field(
          S("Title", "Título"),
          textInput(b.title, (v) => ctx.edit((x) => (x.title = v), { key: `${b.id}:ti` })),
        ),
        field(
          S("Passage", "Texto"),
          textArea(b.text, (v) => ctx.edit((x) => (x.text = v), { key: `${b.id}:t` }), { rows: 8 }),
        ),
      ),
    vocab: (b, ctx) =>
      h(
        "div",
        h(
          "ul.st-rows",
          b.items.map((v, i) =>
            h(
              "li.st-row.wrap",
              textInput(
                v.term,
                (t) => ctx.edit((x) => (x.items[i].term = t), { key: `${b.id}:${i}t` }),
                {
                  "aria-label": S(`Word ${i + 1}`, `Palabra ${i + 1}`),
                  placeholder: S("Word", "Palabra"),
                },
              ),
              textInput(
                v.def,
                (t) => ctx.edit((x) => (x.items[i].def = t), { key: `${b.id}:${i}d` }),
                {
                  "aria-label": S(`Meaning ${i + 1}`, `Significado ${i + 1}`),
                  placeholder: S("Meaning", "Significado"),
                },
              ),
              textInput(
                v.es,
                (t) => ctx.edit((x) => (x.items[i].es = t), { key: `${b.id}:${i}e` }),
                {
                  "aria-label": S(`Spanish word ${i + 1}`, `Palabra en español ${i + 1}`),
                  placeholder: "Español",
                },
              ),
              iconButton(
                "✕",
                S("Remove word", "Quitar la palabra"),
                () => ctx.edit((x) => x.items.splice(i, 1), { structure: true }),
                { disabled: b.items.length <= 1 },
              ),
            ),
          ),
        ),
        button(
          S("Add a word", "Añadir una palabra"),
          () =>
            ctx.edit(
              (x) => x.items.push({ id: uid("v"), term: "", def: "", es: "", example: "" }),
              { structure: true },
            ),
          "small ghost",
          { disabled: b.items.length >= 24 },
        ),
      ),
    image: (b, ctx) => {
      const status = h("p.st-hint", { role: "status" });
      return h(
        "div",
        field(
          S("Picture", "Imagen"),
          h("input", {
            type: "file",
            accept: "image/png,image/jpeg,image/webp,image/gif",
            onchange: async (e) => {
              const res = await imageFromFile(e.target.files?.[0]);
              if (!res.ok) return void (status.textContent = S(...IMAGE_ERRORS[res.error]));
              ctx.edit((x) => (x.src = res.src), { structure: true });
            },
          }),
        ),
        status,
        b.src ? h("img", { src: b.src, alt: "", width: 160 }) : null,
        field(
          S("Describe the picture", "Describa la imagen"),
          textInput(b.alt, (v) => ctx.edit((x) => (x.alt = v), { key: `${b.id}:alt` })),
        ),
        field(
          S("Caption (optional)", "Pie de imagen (opcional)"),
          textInput(b.caption, (v) => ctx.edit((x) => (x.caption = v), { key: `${b.id}:cap` })),
        ),
      );
    },
    table: (b, ctx) =>
      h(
        "div",
        h(
          "table.st-grid-table",
          h(
            "thead",
            h(
              "tr",
              b.headers.map((t, c) =>
                h(
                  "th",
                  textInput(
                    t,
                    (v) => ctx.edit((x) => (x.headers[c] = v), { key: `${b.id}:h${c}` }),
                    { "aria-label": S(`Column ${c + 1}`, `Columna ${c + 1}`) },
                  ),
                ),
              ),
            ),
          ),
          h(
            "tbody",
            b.rows.map((row, r) =>
              h(
                "tr",
                row.map((cell, c) =>
                  h(
                    "td",
                    textInput(
                      cell,
                      (v) => ctx.edit((x) => (x.rows[r][c] = v), { key: `${b.id}:${r}:${c}` }),
                      {
                        "aria-label": S(
                          `Row ${r + 1}, column ${c + 1}`,
                          `Fila ${r + 1}, columna ${c + 1}`,
                        ),
                      },
                    ),
                  ),
                ),
              ),
            ),
          ),
          h(
            "div.st-actions",
            button(
              S("Add a row", "Añadir una fila"),
              () => ctx.edit((x) => x.rows.push(x.headers.map(() => "")), { structure: true }),
              "small ghost",
            ),
            button(
              S("Add a column", "Añadir una columna"),
              () =>
                ctx.edit((x) => (x.headers.push(""), x.rows.forEach((r) => r.push(""))), {
                  structure: true,
                }),
              "small ghost",
              { disabled: b.headers.length >= 6 },
            ),
          ),
        ),
      ),
    organizer: (b, ctx) =>
      h(
        "div",
        select(
          [
            ["web", S("Idea web", "Mapa de ideas")],
            ["kwl", "K-W-L"],
            ["compare", S("Compare", "Comparar")],
            ["cause-effect", S("Cause and effect", "Causa y efecto")],
            ["claim-evidence", S("Claim and evidence", "Afirmación y evidencia")],
            ["sequence", S("Sequence", "Secuencia")],
          ],
          b.kind,
          (v) => ctx.edit((x) => (x.kind = v), { structure: true }),
        ),
        field(
          S("Prompts (one per line)", "Indicaciones (una por línea)"),
          textArea(
            b.prompts.join("\n"),
            (v) =>
              ctx.edit(
                (x) =>
                  (x.prompts = v
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean)),
                { key: `${b.id}:p` },
              ),
            { rows: 4 },
          ),
        ),
      ),
    note: (b, ctx) =>
      field(
        S("Only you see this", "Solo usted ve esto"),
        textArea(b.text, (v) => ctx.edit((x) => (x.text = v), { key: `${b.id}:n` }), { rows: 3 }),
      ),
    audio: (b, ctx) =>
      h(
        "div",
        field(
          S("Words to read aloud", "Palabras para leer en voz alta"),
          textArea(b.say, (v) => ctx.edit((x) => (x.say = v), { key: `${b.id}:s` }), { rows: 3 }),
        ),
        field(
          S("Button label", "Etiqueta del botón"),
          textInput(b.label, (v) => ctx.edit((x) => (x.label = v), { key: `${b.id}:l` })),
        ),
      ),
    math: (b, ctx) =>
      h(
        "div",
        field(
          S("Expression", "Expresión"),
          textInput(b.text, (v) => ctx.edit((x) => (x.text = v), { key: `${b.id}:t` })),
        ),
        mathTray(),
      ),
  };

  function blockCard(b, index, total) {
    const ctx = { S, edit: editFor(b.id), mathTray };
    const summary =
      b.text ||
      b.title ||
      b.say ||
      (b.items ? b.items.map((i) => i.term).join(", ") : "") ||
      b.alt ||
      S("(empty)", "(vacío)");
    return card(b, index, total, S(...BLOCK_LABEL[b.type]), summary, BLOCK_BODY[b.type](b, ctx));
  }

  function card(b, index, total, label, summary, body) {
    const isOpen = open === b.id;
    const { errors, warnings } = blockIssues(b.id);
    const status = errors.length
      ? h("span.st-badge.bad", S(`${errors.length} to fix`, `${errors.length} por corregir`))
      : warnings.length
        ? h(
            "span.st-badge.warn",
            S(
              `${warnings.length} tip${warnings.length > 1 ? "s" : ""}`,
              `${warnings.length} sugerencia${warnings.length > 1 ? "s" : ""}`,
            ),
          )
        : null;
    const move = (to) => store.apply((d) => swap(d.blocks, index, to), { reason: "structure" });
    const head = h(
      "div.st-card-head",
      h(
        "button.st-card-title",
        {
          type: "button",
          "aria-expanded": String(isOpen),
          "aria-controls": `card-${b.id}`,
          onclick: () => toggle(b.id),
        },
        h("strong", label),
        h("span.st-summary", String(summary).slice(0, 80)),
      ),
      status,
      h(
        "div.st-card-tools",
        iconButton("↑", S("Move up", "Subir"), () => move(index - 1), { disabled: index === 0 }),
        iconButton("↓", S("Move down", "Bajar"), () => move(index + 1), {
          disabled: index === total - 1,
        }),
        iconButton("⧉", S("Duplicate", "Duplicar"), () => duplicate(b)),
        iconButton("🗑", S("Delete", "Eliminar"), () => remove(b)),
      ),
    );
    const el2 = h("section.st-card", { "data-block": b.id, "data-open": String(isOpen) }, head);
    if (isOpen) {
      const wrap = h("div.st-card-main", { id: `card-${b.id}` }, body);
      for (const i of [...errors, ...warnings])
        wrap.prepend(
          h("p.st-issue", { "data-level": errors.includes(i) ? "error" : "warn" }, i.message),
        );
      el2.append(wrap);
    }
    return el2;
  }

  function toggle(id) {
    open = open === id ? "" : id;
    render();
    if (open) onOpen?.(open);
  }
  function duplicate(b) {
    const copy = JSON.parse(JSON.stringify(b));
    copy.id = uid(b.type === "question" ? "q" : "b");
    store.apply((d) => d.blocks.splice(d.blocks.findIndex((x) => x.id === b.id) + 1, 0, copy), {
      reason: "structure",
    });
    open = copy.id;
    render();
    say(S("Copied.", "Copiado."));
  }
  function remove(b) {
    store.apply((d) => (d.blocks = d.blocks.filter((x) => x.id !== b.id)), { reason: "structure" });
    say(S("Deleted. You can undo.", "Eliminado. Puede deshacer."));
  }
  function add(block) {
    store.apply((d) => d.blocks.push(block), { reason: "structure" });
    open = block.id;
    render();
    el.querySelector(`[data-block="${block.id}"]`)?.scrollIntoView({ block: "nearest" });
    onOpen?.(block.id);
  }

  function addMenu() {
    const pick = (f) => button(S(...FORMAT_LABEL[f]), () => add(newQuestion(f)), "small");
    return h(
      "div.st-add",
      h("h3", S("Add a question", "Añadir una pregunta")),
      h("div.st-add-row", COMMON_FORMATS.map(pick)),
      disclosure(
        S("More question types", "Más tipos de pregunta"),
        h("div.st-add-row", MORE_FORMATS.map(pick)),
      ),
      disclosure(
        S(
          "Add text, a passage, pictures or words",
          "Añadir texto, un texto de lectura, imágenes o palabras",
        ),
        h(
          "div.st-add-row",
          OTHER_BLOCKS.map((t) =>
            button(S(...BLOCK_LABEL[t]), () => add(newBlock(t)), "small ghost"),
          ),
        ),
      ),
    );
  }

  function render() {
    const a = store.get();
    clear(el);
    el.append(
      field(
        S("Activity title", "Título de la actividad"),
        textInput(
          a.title,
          (v) => store.apply((d) => (d.title = v), { coalesce: "title", reason: "type" }),
          { maxlength: 120 },
        ),
      ),
      field(
        S("What are students learning? (optional)", "¿Qué aprenden los estudiantes? (opcional)"),
        textInput(a.context.objective, (v) =>
          store.apply((d) => (d.context.objective = v), { coalesce: "obj", reason: "type" }),
        ),
      ),
    );
    let n = 0;
    const list = h("div.st-cards");
    a.blocks.forEach((b, i) =>
      list.append(
        b.type === "question"
          ? questionCard(b, i, a.blocks.length, ++n)
          : blockCard(b, i, a.blocks.length),
      ),
    );
    el.append(list, addMenu());
  }

  return {
    el,
    render,
    /** Open a card (used when the teacher clicks something in the preview). */
    select(id) {
      open = id;
      render();
      el.querySelector(`[data-block="${id}"]`)?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    },
  };
}

// "Use my own material": paste text or choose a Word (.docx) file, review what was found, choose what to make.
// Reading is done on this device by x/ingest.js (text) and x/ingest-docx.js (Word); nothing is uploaded and nothing is
// guessed. Anything unclear is listed with a plain reason and its line numbers, and a question with no marked answer
// waits for the teacher's own pick (resolveAnswer). PDFs get the honest message from ingestPdf.
//
//   importBox({ S, onBuilt, context?, JSZip? }) -> HTMLElement
//   onBuilt({ activity, notes: [{en, es}] })

import {
  announce as say,
  ensureWireCss,
  focusEl,
  linesText,
  loadJSZip,
  noteList,
  notesOf,
  pairOf,
  radioGroup,
  uid,
  xarea,
  xbtn,
  xfield,
} from "../../create/wire-kit.js";
import { buildActivityFromIngest, ingestPdf, ingestText, resolveAnswer } from "../x/ingest.js";
import { ingestDocx } from "../x/ingest-docx.js";
import { append, h } from "./ui.js";

/** Append children, skipping null and flattening lists (DOM append would write the text "null"). */
const add = (el, ...kids) => append(el, kids);

const TYPE_WORD = {
  question: ["question", "questions", "pregunta", "preguntas"],
  vocab: ["word list", "word lists", "lista de palabras", "listas de palabras"],
  passage: ["reading passage", "reading passages", "texto de lectura", "textos de lectura"],
  table: ["table", "tables", "tabla", "tablas"],
  list: ["list", "lists", "lista", "listas"],
  heading: ["heading", "headings", "título", "títulos"],
  sequence: ["set of steps", "sets of steps", "serie de pasos", "series de pasos"],
  pairs: ["matching set", "matching sets", "juego de parejas", "juegos de parejas"],
  categories: ["sorting group", "sorting groups", "grupo de clasificar", "grupos de clasificar"],
};
const LETTER = "abcdefghijklmnopqrstuvwxyz";
const clip = (s, n) => {
  const t = String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** A short plain description of one found item, for the review lists. */
export function snippet(b) {
  if (!b) return "";
  return clip(
    b.prompt || b.text || b.term || b.title || b.items?.[0]?.term || b.items?.[0] || "",
    90,
  );
}

/** "5 questions, 1 reading passage" */
export function countsText(S, blocks) {
  const counts = new Map();
  for (const b of blocks) counts.set(b.type, (counts.get(b.type) || 0) + 1);
  return [...counts]
    .map(([type, n]) => {
      const w = TYPE_WORD[type] || [type, `${type}s`, type, type];
      return S(`${n} ${n === 1 ? w[0] : w[1]}`, `${n} ${n === 1 ? w[2] : w[3]}`);
    })
    .join(", ");
}

const isDocx = (f) => /\.docx$/i.test(f.name) || /wordprocessingml/.test(f.type || "");
const isPdf = (f) => /\.pdf$/i.test(f.name) || f.type === "application/pdf";

export function importBox({ S, onBuilt, context = {}, JSZip, newId }) {
  ensureWireCss();
  const state = { text: "", file: null, result: null, suggestion: "", reading: false };
  const root = h("section.xw-box", { "data-box": "import" });
  const live = h("p.xw-status", { role: "status", "aria-live": "polite" });
  const out = h("div.xw-plan");
  const fileId = uid("xw-file");

  const paste = xarea("", (v) => (state.text = v), {
    rows: 8,
    maxlength: 60000,
    placeholder: S(
      "1. What is a producer?\na) An animal that hunts\n*b) A living thing that makes its own food\nc) A thing that breaks down matter",
      "1. ¿Qué es un productor?\na) Un animal que caza\n*b) Un ser vivo que fabrica su propio alimento\nc) Algo que descompone materia",
    ),
  });
  const fileName = h("span.xw-filename", { "aria-live": "polite" });
  const file = h("input.xw-file", {
    type: "file",
    id: fileId,
    accept:
      ".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf",
    onchange: (e) => {
      state.file = e.target.files?.[0] || null;
      fileName.textContent = state.file
        ? S(
            `Chosen: ${state.file.name}. I will read this file.`,
            `Elegido: ${state.file.name}. Leeré este archivo.`,
          )
        : "";
    },
  });
  const readBtn = xbtn(S("Read my material", "Leer mi material"), () => read(), "primary", {
    "data-act": "read",
  });

  async function read() {
    if (state.reading) return;
    state.result = null;
    out.replaceChildren();
    let result;
    state.reading = true;
    readBtn.disabled = true;
    live.textContent = S("Reading…", "Leyendo…");
    try {
      const f = state.file;
      if (f) {
        if (isPdf(f)) result = ingestPdf();
        else if (isDocx(f))
          result = await ingestDocx(await f.arrayBuffer(), {
            filename: f.name,
            JSZip: JSZip || (await loadJSZip()),
          });
        else
          result = {
            ok: false,
            error: {
              en: "I can read Word (.docx) files or pasted text. Save the file as .docx, or copy its text and paste it here.",
              es: "Puedo leer archivos de Word (.docx) o texto pegado. Guarde el archivo como .docx o copie su texto y péguelo aquí.",
            },
          };
      } else if (state.text.trim()) result = ingestText(state.text, { type: "pasted" });
      else
        result = {
          ok: false,
          error: {
            en: "Paste your material or choose a Word (.docx) file first.",
            es: "Primero pegue su material o elija un archivo de Word (.docx).",
          },
        };
    } catch {
      result = {
        ok: false,
        error: {
          en: "The file could not be read. Nothing was changed. Try pasting its text instead.",
          es: "No se pudo leer el archivo. No se cambió nada. Intente pegar su texto.",
        },
      };
    }
    state.reading = false;
    readBtn.disabled = false;
    live.textContent = "";
    if (!result.ok) {
      add(out, 
        h("h3", { tabindex: "-1" }, S("I could not read that", "No pude leer eso")),
        h(
          "p.xw-callout",
          { "data-ok": "false", role: "alert" },
          S(result.error.en, result.error.es),
        ),
      );
      focusEl(out.querySelector("h3"));
      return;
    }
    state.result = result;
    state.suggestion = result.suggestions[0]?.id || "";
    draw();
    say(
      S("I read your material. Review what I found.", "Leí su material. Revise lo que encontré."),
    );
    focusEl(out.querySelector("h3"));
  }

  function pickAnswer(itemId, letter) {
    state.result = resolveAnswer(state.result, itemId, letter);
    if (!state.result.suggestions.some((s) => s.id === state.suggestion))
      state.suggestion = state.result.suggestions[0]?.id || "";
    draw();
    say(
      S(
        "Your answer is saved for that question.",
        "Su respuesta quedó guardada para esa pregunta.",
      ),
    );
    focusEl(out.querySelector("h3.xw-review-h"));
  }

  /** The answer picker for a multiple-choice question that has no answer. The choice is the teacher's alone. */
  function picker(b) {
    return radioGroup({
      name: `ans-${b.id}`,
      legend: S("Which choice is correct?", "¿Cuál opción es la correcta?"),
      options: b.options.map((o, i) => ({
        id: LETTER[i],
        label: `${LETTER[i]}) ${clip(o.text, 120)}`,
      })),
      value: "",
      onChange: (letter) => pickAnswer(b.id, letter),
    });
  }

  function reviewSection(r) {
    const byId = new Map(r.blocks.map((b) => [b.id, b]));
    const pickers = new Set();
    const items = r.review.map((it) => {
      const b = it.itemId ? byId.get(it.itemId) : null;
      const needsPick = b && b.format === "choice" && !b.answer && !pickers.has(b.id);
      if (needsPick) pickers.add(b.id);
      const p = pairOf(it);
      return h(
        "li.xw-review-item",
        h(
          "p",
          it.lines ? h("span.xw-lines", linesText(S, it.lines)) : null,
          b ? h("q", snippet(b)) : null,
        ),
        h("p.xw-reason", S(p.en, p.es)),
        needsPick ? picker(b) : null,
      );
    });
    return h(
      "section.xw-review",
      { "aria-labelledby": "xw-review-h" },
      h(
        "h3.xw-review-h",
        { id: "xw-review-h", tabindex: "-1" },
        items.length
          ? S(`Needs a look (${items.length})`, `Necesita una revisión (${items.length})`)
          : S("Nothing needs a look", "Nada necesita revisión"),
      ),
      items.length ? h("ul.xw-review-list", items) : null,
    );
  }

  function foundSection(r) {
    return h(
      "details.xw-more",
      h(
        "summary",
        S(`Everything I found (${r.blocks.length})`, `Todo lo que encontré (${r.blocks.length})`),
      ),
      h(
        "ol.xw-found",
        r.blocks.map((b) =>
          h(
            "li",
            h("span.xw-lines", linesText(S, b.lines)),
            h(
              "strong",
              S(
                ...(TYPE_WORD[b.type]
                  ? [TYPE_WORD[b.type][0], TYPE_WORD[b.type][2]]
                  : [b.type, b.type]),
              ),
            ),
            " ",
            snippet(b),
            b.confidence === "review" ? h("span.xw-tag", S("check", "revisar")) : null,
          ),
        ),
      ),
    );
  }

  function draw() {
    const r = state.result;
    out.replaceChildren();
    if (!r) return;
    const prov = r.provenance || {};
    const unanswered = r.blocks.filter((b) => b.format === "choice" && !b.answer).length;
    add(out, 
      h(
        "p.xw-summary",
        S(
          `I found ${countsText(S, r.blocks) || "nothing I can use"}${prov.lines ? ` in ${prov.lines} lines` : ""}.`,
          `Encontré ${countsText(S, r.blocks) || "nada que pueda usar"}${prov.lines ? ` en ${prov.lines} líneas` : ""}.`,
        ),
      ),
      prov.lineBasis === "extracted-text"
        ? h(
            "p.xw-hint",
            S(
              "Line numbers count the text pulled out of your Word file, not pages.",
              "Los números de línea cuentan el texto extraído de su archivo de Word, no las páginas.",
            ),
          )
        : null,
      reviewSection(r),
      foundSection(r),
    );
    if (!r.suggestions.length) {
      add(out, 
        h(
          "p.xw-callout",
          { "data-ok": "false" },
          S(
            "Nothing here can become an activity yet. Add questions with their answers, a word list, or a passage.",
            "Todavía nada de aquí puede ser una actividad. Agregue preguntas con sus respuestas, una lista de palabras o un texto.",
          ),
        ),
      );
      return;
    }
    add(out, 
      radioGroup({
        name: "xw-make",
        legend: S("What would you like to make?", "¿Qué le gustaría crear?"),
        options: r.suggestions.map((s) => ({
          id: s.id,
          label: S(s.label.en, s.label.es),
          hint: S(
            `Uses ${s.count} item${s.count === 1 ? "" : "s"}`,
            `Usa ${s.count} elemento${s.count === 1 ? "" : "s"}`,
          ),
        })),
        value: state.suggestion,
        onChange: (id) => (state.suggestion = id),
      }),
      unanswered
        ? h(
            "p.xw-hint",
            S(
              `${unanswered} question${unanswered === 1 ? " has" : "s have"} no answer yet. Pick the answer above, or ${unanswered === 1 ? "it is" : "they are"} left out. Nothing is guessed.`,
              `${unanswered} pregunta${unanswered === 1 ? " no tiene" : "s no tienen"} respuesta todavía. Elija la respuesta arriba o se dejan fuera. No se adivina nada.`,
            ),
          )
        : null,
      h("div.xw-row", xbtn(S("Build it", "Construir"), build, "primary", { "data-act": "build" })),
    );
  }

  function build() {
    const res = buildActivityFromIngest(
      state.result,
      { suggestion: state.suggestion },
      { context, ...(newId ? { newId } : {}) },
    );
    const notes = notesOf(res.review);
    out.querySelector(".xw-fail")?.remove();
    if (!res.ok || !res.activity) {
      add(out, 
        h(
          "section.xw-fail",
          h("h3", { tabindex: "-1" }, S("I could not build that", "No pude construir eso")),
          notes.length ? noteList(S, notes) : null,
        ),
      );
      focusEl(out.querySelector(".xw-fail h3"));
      return;
    }
    // what is still unresolved from reading (a question left out for want of an answer) goes with the activity
    onBuilt({
      activity: res.activity,
      notes: notesOf([...state.result.review, ...res.review]),
    });
  }

  add(root, 
    h(
      "p.xw-lead",
      S(
        "Bring your own questions, word list or reading. I read it on this device, show what I found, and you choose what to make. Nothing is uploaded.",
        "Traiga sus propias preguntas, lista de palabras o lectura. La leo en este dispositivo, le muestro lo que encontré y usted elige qué crear. No se sube nada.",
      ),
    ),
    xfield(S("Paste your material", "Pegue su material"), paste),
    h(
      "div.xw-field",
      h(
        "label",
        { for: fileId },
        S("Or choose a Word file (.docx)", "O elija un archivo de Word (.docx)"),
      ),
      file,
      fileName,
      h(
        "p.xw-hint",
        S(
          "PDF files cannot be read yet. For a PDF, copy its text and paste it above.",
          "Los archivos PDF todavía no se pueden leer. Para un PDF, copie su texto y péguelo arriba.",
        ),
      ),
    ),
    h("div.xw-row", readBtn),
    live,
    out,
  );
  return root;
}

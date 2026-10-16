// linked-lab.js — a ratio table, a double number line, a tape, a bar and a
// hundred grid, all drawing the SAME ratio.
//
// Each picture is an existing component given one shared model
// (linked-model.js). The student types or shades something in any one of them
// and the others follow, so "equivalent ratios", "the same share" and "scaling
// both quantities" stop being three separate pictures to learn.
//
// The lab starts EMPTY. It never receives a number from a lesson: every number
// in every picture is one the student typed, tapped or shaded, so it can never
// hand over the answer to the lesson's own question. It holds no running total
// and saves nothing — closing it forgets everything, which is what a place to
// try ideas should do.
//
//   renderLinkedLab(host, cfg) -> { destroy }
//     cfg.mode    "ratio" (two parts of a mixture) | "percent" (a part of a whole)
//     cfg.labelA, cfg.labelB   names of the two quantities

import { stackContent } from "../core/i18n.js";
import { renderBarModel } from "./bar-model.js";
import { createLinkedModel, fmt } from "./linked-model.js";
import { renderPercentGridLab } from "./percent-grid-lab.js";
import { renderRatioTableBuilder } from "./ratio-table-builder.js";
import { renderTapeDiagram } from "./tape-diagram-lab.js";

const STYLE_ID = "linked-lab-styles";
const CSS = `
.ll{color-scheme:light;display:grid;grid-template-columns:minmax(0,1fr);gap:14px;font-family:var(--font-body,"Hanken Grotesk",system-ui,sans-serif);color:var(--ink,#12355b)}
.ll-title{margin:0;font:800 1.15rem/1.2 var(--font-display,"Outfit",system-ui,sans-serif)}
.ll-intro{margin:0;color:var(--muted,#54677c);font-size:.95rem;line-height:1.5;max-width:62ch}
.ll-reading{margin:0;padding:10px 14px;border:1px solid var(--line,#d7e2ed);border-radius:12px;display:flex;flex-wrap:wrap;gap:6px 18px;align-items:center}
.ll-reading legend{font-weight:700;font-size:.85rem;padding:0 6px}
.ll-reading label{display:inline-flex;align-items:center;gap:8px;min-height:44px;font-size:.95rem;cursor:pointer}
.ll-reading input{width:20px;height:20px;accent-color:var(--accent,#1d4ed8)}
.ll-reading input:focus-visible{outline:3px solid var(--accent,#1d4ed8);outline-offset:2px}
.ll-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start}
.ll-panel{min-width:0}
.ll .rtlab-field input,.ll .rtlab-go,.ll .rtlab-chip{min-height:44px}
.ll .rtlab-chip{min-width:44px}
.ll .tdl-btn,.ll .pgl-btn{min-height:44px}
.ll-panel > h4{margin:0 0 6px;font-size:.8rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#54677c)}
.ll-wait{margin:0;padding:14px;border:1px dashed var(--line,#cbd5e1);border-radius:12px;color:var(--muted,#54677c);font-size:.9rem;line-height:1.5}
.ll-table{grid-column:1 / -1}
.ll-notice{padding:14px 16px;border:1px solid var(--line,#d7e2ed);border-left:4px solid var(--amber,#e9c46a);border-radius:12px;background:#fffdf5}
.ll-notice h4{margin:0 0 8px;font:700 1.05rem/1.3 var(--font-display,"Outfit",system-ui,sans-serif)}
.ll-frames{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:flex-end}
.ll-frames label{display:grid;gap:4px;font-size:.85rem;font-weight:700;flex:1 1 200px;min-width:0}
.ll-frames select{width:100%;min-width:0;min-height:44px;padding:8px 10px;font:inherit;font-weight:600;border:2px solid var(--line,#cbd5e1);border-radius:10px;background:#fff;color:inherit}
.ll-frames select:focus-visible,.ll-check:focus-visible{outline:3px solid var(--accent,#1d4ed8);outline-offset:2px}
.ll-check{min-height:44px;padding:8px 18px;font:inherit;font-weight:700;border-radius:999px;border:2px solid var(--accent,#1d4ed8);background:var(--accent,#1d4ed8);color:#fff;cursor:pointer}
.ll-said{margin:10px 0 0;min-height:1.4em;font-size:.95rem;line-height:1.5}
@media (max-width:720px){.ll-grid{grid-template-columns:minmax(0,1fr)}}
`;

function ensureStyles() {
  if (typeof document === "undefined" || document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

const bi = (en, es) => stackContent(en, es);
const esc = (v) =>
  String(v).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

// What a student can say stays the same / changes. Four honest candidates; the
// feedback reads the student's OWN ratio and scale, it never states a lesson's.
const thingsFor = (a, b) => [
  { id: "ratio", en: `the ratio of ${a} to ${b}`, es: `la razón de ${a} a ${b}` },
  { id: "amountA", en: `the amount of ${a}`, es: `la cantidad de ${a}` },
  { id: "amountB", en: `the amount of ${b}`, es: `la cantidad de ${b}` },
  { id: "scale", en: "how many groups (the scale)", es: "cuántos grupos (la escala)" },
];

let labSeq = 0;

/** Feedback for a "stays the same / changes" pair, from the model's own state. */
export function judgeIdea(stays, changes, state) {
  if (state.a == null) {
    return bi(
      "Type a ratio first, then compare your pictures.",
      "Escribe primero una razón y luego compara tus imágenes.",
    );
  }
  if (!stays || !changes || stays === changes) {
    return bi(
      "Pick one thing that stays the same and a different thing that changes.",
      "Elige algo que se queda igual y algo distinto que cambia.",
    );
  }
  if (stays === "ratio" && changes !== "ratio") {
    return bi(
      `Yes. Every column is still ${fmt(state.a)} : ${fmt(state.b)} — you scale both amounts by the same number, and the ratio holds.`,
      `Sí. Cada columna sigue siendo ${fmt(state.a)} : ${fmt(state.b)}: escalas las dos cantidades por el mismo número y la razón se mantiene.`,
    );
  }
  return bi(
    "Look again. Pick two columns in the table and compare them. Which thing is the same in both?",
    "Mira otra vez. Elige dos columnas de la tabla y compáralas. ¿Qué es igual en las dos?",
  );
}

/** @param {HTMLElement} host */
export function renderLinkedLab(host, cfg = {}) {
  ensureStyles();
  const percentMode = cfg.mode === "percent";
  const labelA = cfg.labelA || (percentMode ? "Part" : "A");
  const labelB = cfg.labelB || (percentMode ? "Whole" : "B");
  const model = createLinkedModel({ relation: percentMode ? "part-whole" : "part-part" });
  const token = Symbol("linked-lab");

  labSeq += 1;
  const uid = `ll${labSeq}`;
  const root = document.createElement("div");
  root.className = "ll";
  const things = (id) =>
    `<select id="${id}"><option value="">—</option>${thingsFor(labelA, labelB)
      .map((t) => `<option value="${t.id}">${esc(t.en)} / ${esc(t.es)}</option>`)
      .join("")}</select>`;
  root.innerHTML = `
    <h3 class="ll-title">${bi(cfg.title || "One relationship, many pictures", "Una relación, muchas imágenes")}</h3>
    <p class="ll-intro">${bi(
      "Type a ratio, or shade squares. Change anything in one picture and the others change with it. Nothing here is graded and nothing is saved.",
      "Escribe una razón o sombrea cuadros. Cambia algo en una imagen y las demás cambian con ella. Nada aquí se califica ni se guarda.",
    )}</p>
    <fieldset class="ll-reading">
      <legend>${bi(`How do you read ${labelA} : ${labelB}?`, `¿Cómo lees ${labelA} : ${labelB}?`)}</legend>
      <label><input type="radio" name="${uid}-relation" value="part-part" ${percentMode ? "" : "checked"}> ${bi("Two parts of a mixture", "Dos partes de una mezcla")}</label>
      <label><input type="radio" name="${uid}-relation" value="part-whole" ${percentMode ? "checked" : ""}> ${bi("A part out of a whole", "Una parte de un entero")}</label>
    </fieldset>
    <div class="ll-grid">
      <div class="ll-panel ll-table" data-slot="table"></div>
      <div class="ll-panel" data-slot="tape"><h4>${bi("Tape diagram", "Diagrama de cinta")}</h4><div data-mount></div></div>
      <div class="ll-panel" data-slot="bar"><h4>${bi("Bar", "Barra")}</h4><div data-mount></div></div>
      <div class="ll-panel" data-slot="grid"><h4>${bi("Hundred grid", "Cuadrícula de cien")}</h4><div data-mount></div></div>
    </div>
    <section class="ll-notice" aria-labelledby="${uid}-notice">
      <h4 id="${uid}-notice">${bi("What stays the same? What changes?", "¿Qué se queda igual? ¿Qué cambia?")}</h4>
      <div class="ll-frames">
        <label>${bi("Stays the same", "Se queda igual")}${things(`${uid}-stays`)}</label>
        <label>${bi("Changes", "Cambia")}${things(`${uid}-changes`)}</label>
        <button type="button" class="ll-check">${bi("Check my idea", "Revisa mi idea")}</button>
      </div>
      <p class="ll-said" role="status" aria-live="polite"></p>
    </section>`;
  host.appendChild(root);

  const slot = (name) => root.querySelector(`[data-slot="${name}"]`);
  const mountOf = (name) => slot(name).querySelector("[data-mount]");
  const handles = [];

  handles.push(
    renderRatioTableBuilder(slot("table"), {
      model,
      labelA,
      labelB,
      steps: 6,
      presets: percentMode ? ["25:100", "50:100", "3:4", "1:10"] : undefined,
    }),
  );

  const tapeHost = mountOf("tape");
  const waiting = (text) => `<p class="ll-wait">${text}</p>`;
  const tapeWait = waiting(
    bi(
      "Build a ratio in the table and the tape will draw it.",
      "Construye una razón en la tabla y la cinta la dibujará.",
    ),
  );
  tapeHost.innerHTML = tapeWait;
  let tape = null;
  const syncTape = (state) => {
    if (state.a == null) {
      tape?.destroy();
      tape = null;
      tapeHost.innerHTML = tapeWait;
      return;
    }
    if (tape) return; // a mounted tape follows the model itself
    tapeHost.textContent = "";
    const row = (label, value) => ({
      label,
      parts: Array.from({ length: state.k }, () => ({ value, label: fmt(value) })),
    });
    tape = renderTapeDiagram(tapeHost, {
      model,
      rows: [row(labelA, state.a), row(labelB, state.b)],
    });
  };
  syncTape(model.get());

  handles.push(renderBarModel(mountOf("bar"), { model, labelA, labelB }));
  handles.push(renderPercentGridLab(mountOf("grid"), { model }));

  const unsubscribe = model.subscribe((state) => syncTape(state));
  for (const input of /** @type {NodeListOf<HTMLInputElement>} */ (
    root.querySelectorAll(`input[name="${uid}-relation"]`)
  )) {
    input.addEventListener("change", () => model.set({ relation: input.value }, token));
  }

  const said = /** @type {HTMLElement} */ (root.querySelector(".ll-said"));
  const choice = (/** @type {string} */ suffix) =>
    /** @type {HTMLSelectElement} */ (root.querySelector(`#${uid}-${suffix}`)).value;
  root.querySelector(".ll-check")?.addEventListener("click", () => {
    said.innerHTML = judgeIdea(choice("stays"), choice("changes"), model.get());
  });

  return {
    destroy() {
      unsubscribe();
      tape?.destroy();
      for (const handle of handles) handle?.destroy?.();
      root.remove();
    },
  };
}

export default renderLinkedLab;

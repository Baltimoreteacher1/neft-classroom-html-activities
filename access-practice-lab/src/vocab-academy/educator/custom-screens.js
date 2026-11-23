// Teacher: the custom unit builder's screens. Pure logic (validation, building, storage) is custom.js; events are
// custom-events.js. No AI and no network: the word list comes from what the teacher pastes, the published corpus, or a clone.
import { ACTIVITY_TYPES, fitsGrade } from "../activities/index.js";
import { html } from "../../util.js";
import { POS, SHIPPED_GRADES } from "../contract.js";
import { getIndex, vaHref } from "../data.js";
import { customSegment } from "./assign.js";
import { gradeName, posName } from "../ui.js";
import {
  ERROR_COPY,
  MAX_WORDS,
  WARNING_COPY,
  blankWord,
  corpusByHeadword,
  getCustom,
  listCustom,
  validateUnit,
} from "./custom.js";
import { allPresets } from "./ui-supports.js";
import { setRegion, statusLine } from "./kit.js";

export const C = {
  source: "paste",
  paste: "",
  topic: "",
  search: "",
  searchGrade: "",
  cloneGrade: "3",
  cloneUnit: "",
  hits: [],
  checked: false,
  editing: "",
  printId: "",
  draft: null,
  msg: null, // { text, tone } shown under the word sources
  saveMsg: "",
  pendingDelete: "",
};
export const blankDraft = () => ({
  title: "",
  grade: "3",
  theme: "",
  objectives: "",
  discuss: "",
  words: [],
  activities: [],
  supports: null,
});
export const draft = () => (C.draft ||= blankDraft());
export const say = (text, tone = "") => {
  C.msg = text ? { text, tone } : null;
  setRegion("vatCStatus", C.msg ? statusLine(text, tone) : "");
};
export const copy = (I, code, table = ERROR_COPY) => (table[code] ? I.S(...table[code]) : code);

let byHw = null;
let byHwFor = null;
export const corpus = async () => {
  const index = await getIndex();
  if (byHwFor !== index) {
    byHw = corpusByHeadword(index);
    byHwFor = index;
  }
  return { index, byHw };
};

/** Load the unit named by ?edit=<id> into the draft once. */
export function openForEdit(id) {
  const unit = id ? getCustom(id) : null;
  if (!unit || C.editing === unit.id) return;
  C.editing = unit.id;
  C.checked = false;
  C.draft = {
    title: unit.title,
    grade: unit.grade,
    theme: unit.theme === "Teacher-made lesson" ? "" : unit.theme,
    objectives: (unit.objectives || []).join("\n"),
    discuss: (unit.produce?.discuss || []).join("\n"),
    activities: unit.activities || [],
    supports: unit.supports || null,
    words: unit.words.map((w) => ({
      hw: w.hw,
      pos: w.pos,
      def: w.def,
      ex: w.ex,
      glyphs: w.visual?.glyphs || [],
      glyphsText: (w.visual?.glyphs || []).join(" "),
      alt: w.visual?.alt || "",
      es: w.es?.gloss || "",
      base: w.src?.method === "corpus-copy" ? w : null,
    })),
  };
}

// ── screens ───────────────────────────────────────────────────────────────────
const field = (I, id, label, control, errs = [], hint = "") =>
  html`<div class="vat-field">
    <label for="${id}">${label}</label>${control}
    ${hint ? html`<p class="fine" id="${id}-h">${hint}</p>` : ""}
    ${
      errs.length
        ? html`<ul class="vat-errs" id="${id}-e">
            ${errs.map((e) => html`<li data-tone="${e.warn ? "warn" : "bad"}">${copy(I, e.code, e.warn ? WARNING_COPY : ERROR_COPY)}</li>`)}
          </ul>`
        : ""
    }
  </div>`;

function wordCard(I, w, i, result, grade) {
  const errs = (f) =>
    C.checked && result
      ? [
          ...result.errors.filter((e) => e.field === f),
          ...result.warnings.filter((e) => e.field === f).map((e) => ({ ...e, warn: true })),
        ]
      : [];
  const bad = (f) => C.checked && result?.errors.some((e) => e.field === f);
  const inp = (f, label, extra = {}) => {
    const id = `vatCw-${i}-${f}`;
    const value = f === "glyphs" ? (w.glyphsText ?? (w.glyphs || []).join(" ")) : w[f] || "";
    const e = errs(f);
    const describedby = [e.length ? `${id}-e` : "", extra.hint ? `${id}-h` : ""]
      .filter(Boolean)
      .join(" ");
    const ctl = extra.area
      ? html`<textarea
          id="${id}"
          rows="2"
          data-vc="word-field"
          data-i="${i}"
          data-f="${f}"
          ${bad(f) ? html`aria-invalid="true"` : ""}
          aria-describedby="${describedby}"
          lang="${extra.lang || "en"}"
        >
${value}</textarea>`
      : html`<input
          id="${id}"
          type="text"
          value="${value}"
          data-vc="word-field"
          data-i="${i}"
          data-f="${f}"
          autocomplete="off"
          ${bad(f) ? html`aria-invalid="true"` : ""}
          aria-describedby="${describedby}"
          lang="${extra.lang || "en"}"
        />`;
    return field(I, id, label, ctl, e, extra.hint);
  };
  return html`<li class="vat-wcard">
    <fieldset>
      <legend>${I.T("Word", "Palabra")} ${i + 1}${w.hw ? `: ${w.hw}` : ""}</legend>
      ${w.base ? html`<p class="fine">${I.T("Filled in from a published word. Your copy is separate: edit it freely.", "Completado desde una palabra publicada. Tu copia es aparte: edítala con libertad.")}</p>` : ""}
      <div class="vat-grid2">
        ${inp("hw", I.S("Word", "Palabra"))}
        <div class="vat-field">
          <label for="vatCw-${i}-pos">${I.T("Part of speech", "Parte de la oración")}</label>
          <select
            id="vatCw-${i}-pos"
            data-vc="word-field"
            data-i="${i}"
            data-f="pos"
            ${bad("pos") ? html`aria-invalid="true"` : ""}
          >
            <option value="">${I.S("Choose…", "Elige…")}</option>
            ${POS.map((p) => html`<option value="${p}" ${w.pos === p ? "selected" : ""}>${posName(I, p)}</option>`)}
          </select>
          ${
            errs("pos").length
              ? html`<ul class="vat-errs">
                  ${errs("pos").map((e) => html`<li data-tone="bad">${copy(I, e.code)}</li>`)}
                </ul>`
              : ""
          }
        </div>
      </div>
      ${inp("def", I.S("Meaning in your own words", "Significado con tus propias palabras"), { area: true, hint: I.S("Use simpler words than the word itself. Do not use the word.", "Usa palabras más simples que la palabra. No uses la palabra.") })}
      ${inp("ex", I.S("Example sentence", "Oración de ejemplo"), { area: true, hint: I.S("The sentence must use the word.", "La oración debe usar la palabra.") })}
      <div class="vat-grid2">
        ${inp("glyphs", I.S("Picture emoji (1 to 3, optional)", "Emojis de imagen (1 a 3, opcional)"), { hint: I.S("Example: 🧗 ⚠️", "Ejemplo: 🧗 ⚠️") })}
        ${inp("alt", I.S("Describe the picture (needed with emoji)", "Describe la imagen (necesario con emojis)"))}
      </div>
      ${inp("es", I.S("Spanish word or phrase (optional)", "Palabra o frase en español (opcional)"), { lang: "es" })}
      <div class="vat-actions">
        <button
          type="button"
          class="btn va-btn va-btn-quiet"
          data-vc="up"
          data-i="${i}"
          ${i === 0 ? "disabled" : ""}
        >
          ${I.T("Move up", "Subir")}
        </button>
        <button
          type="button"
          class="btn va-btn va-btn-quiet"
          data-vc="down"
          data-i="${i}"
          ${i === draft().words.length - 1 ? "disabled" : ""}
        >
          ${I.T("Move down", "Bajar")}
        </button>
        <button type="button" class="btn va-btn va-btn-quiet" data-vc="remove" data-i="${i}">
          ${I.T("Remove this word", "Quitar esta palabra")}
        </button>
      </div>
    </fieldset>
  </li>`;
}

const SOURCES = [
  ["paste", "Paste a word list", "Pegar una lista de palabras"],
  ["topic", "Start from a topic", "Empezar con un tema"],
  ["corpus", "Pick published words", "Elegir palabras publicadas"],
  ["clone", "Copy a published lesson", "Copiar una lección publicada"],
];
function sourcePanel(I, index) {
  const s = C.source;
  const gradeSel = (id, cur, any) =>
    html`<select id="${id}" data-vc="${id === "vatCloneGrade" ? "clone-grade" : "search-grade"}">
      ${any ? html`<option value="">${I.S("All grades", "Todos los grados")}</option>` : ""}${SHIPPED_GRADES.map((g) => html`<option value="${g}" ${g === cur ? "selected" : ""}>${gradeName(I, g)}</option>`)}
    </select>`;
  const hits = C.hits.map(
    (h) =>
      html`<li>
        <span lang="en"><strong>${h.hw}</strong></span>
        <span class="fine">${posName(I, h.pos)} · ${gradeName(I, h.grade)}</span>
        <button
          type="button"
          class="btn va-btn va-btn-quiet"
          data-vc="add-id"
          data-id="${h.id}"
          aria-label="${I.S("Add", "Agregar")} ${h.hw}"
        >
          ${I.T("Add", "Agregar")}
        </button>
      </li>`,
  );
  return html`<fieldset class="vat-sources">
    <legend>${I.T("Add words", "Agregar palabras")}</legend>
    <div
      role="radiogroup"
      class="vat-seg"
      aria-label="${I.S("Where the words come from", "De dónde vienen las palabras")}"
    >
      ${SOURCES.map(([id, en, es]) => html`<label class="vat-seg-opt"><input type="radio" name="vatSource" value="${id}" data-vc="source" ${s === id ? "checked" : ""} /> <span>${I.T(en, es)}</span></label>`)}
    </div>
    ${
      s === "paste"
        ? html`<div class="vat-field">
              <label for="vatPaste"
                >${I.T("One word per line, or separate with commas. Add (adj), (n), (v) for the part of speech.", "Una palabra por línea o separadas por comas. Agrega (adj), (n), (v) para la parte de la oración.")}</label
              >
              <textarea id="vatPaste" rows="5" data-vc="paste" lang="en">${C.paste}</textarea>
            </div>
            <button type="button" class="btn btn-primary va-btn" data-vc="make-cards">
              ${I.T("Make word cards", "Crear tarjetas de palabras")}
            </button>
            <p class="fine">
              ${I.T("A word that is already in the published corpus is filled in for you. Any other word you write yourself.", "Una palabra que ya está en el corpus publicado se completa por ti. Cualquier otra la escribes tú.")}
            </p>`
        : ""
    }
    ${
      s === "topic"
        ? html`<div class="vat-field">
              <label for="vatTopic">${I.T("Topic", "Tema")}</label
              ><input
                id="vatTopic"
                type="text"
                maxlength="60"
                value="${C.topic}"
                data-vc="topic"
                autocomplete="off"
              />
            </div>
            <button type="button" class="btn btn-primary va-btn" data-vc="find-topic">
              ${I.T("Find published words on this topic", "Buscar palabras publicadas sobre este tema")}
            </button>
            <button type="button" class="btn va-btn" data-vc="use-topic">
              ${I.T("Use it as my lesson theme and add my own words", "Usarlo como tema de mi lección y agregar mis palabras")}
            </button>
            <p class="fine">
              ${I.T("This looks through lesson titles and themes. It does not write anything for you.", "Esto busca en los títulos y temas de las lecciones. No escribe nada por ti.")}
            </p>`
        : ""
    }
    ${
      s === "corpus"
        ? html`<div class="vat-row">
            <label for="vatSearch">${I.T("Search words", "Buscar palabras")}</label
            ><input
              id="vatSearch"
              type="search"
              value="${C.search}"
              data-vc="search"
              autocomplete="off"
              lang="en"
            />
            <label for="vatSearchGrade">${I.T("Grade", "Grado")}</label
            >${gradeSel("vatSearchGrade", C.searchGrade, true)}
            <button type="button" class="btn va-btn" data-vc="do-search">
              ${I.T("Search", "Buscar")}
            </button>
          </div>`
        : ""
    }
    ${
      s === "clone"
        ? html`<div class="vat-row">
              <label for="vatCloneGrade">${I.T("Grade", "Grado")}</label
              >${gradeSel("vatCloneGrade", C.cloneGrade, false)}
              <label for="vatCloneUnit">${I.T("Lesson", "Lección")}</label>
              <select id="vatCloneUnit" data-vc="clone-unit">
                <option value="">${I.S("Choose a lesson…", "Elige una lección…")}</option>
                ${(index?.grades?.[C.cloneGrade]?.units || []).map((u) => html`<option value="${u.id}" ${u.id === C.cloneUnit ? "selected" : ""}>${u.n}. ${u.title}</option>`)}
              </select>
              <button type="button" class="btn btn-primary va-btn" data-vc="clone-load">
                ${I.T("Copy it", "Copiarla")}
              </button>
            </div>
            <p class="fine">
              ${I.T("You get a separate copy to change. The published lesson is never touched.", "Obtienes una copia aparte para cambiar. La lección publicada nunca se toca.")}
            </p>`
        : ""
    }
    ${
      hits.length
        ? html`<ul class="vat-hits" aria-label="${I.S("Matches", "Coincidencias")}">
            ${hits}
          </ul>`
        : ""
    }
    <div id="vatCStatus" role="status" aria-live="polite">${C.msg ? statusLine(C.msg.text, C.msg.tone) : ""}</div>
  </fieldset>`;
}

function activityPanel(I) {
  const g = draft().grade;
  const types = ACTIVITY_TYPES.filter((t) => fitsGrade(t, g));
  const chosen = new Set(draft().activities);
  const groups = [...new Set(types.map((t) => t.group))];
  return html`<fieldset class="vat-activities">
    <legend>${I.T("Activities to include", "Actividades que incluir")}</legend>
    <p class="fine">
      ${I.T("These are the activity types that fit this grade. Leave all unticked to let the lessons choose.", "Estos son los tipos de actividad que encajan con este grado. Deja todos sin marcar para que las lecciones elijan.")}
    </p>
    <button type="button" class="btn va-btn va-btn-quiet" data-vc="act-all">
      ${I.T("Tick all", "Marcar todas")}
    </button>
    ${groups.map(
      (gr) =>
        html`<fieldset>
          <legend>${gr}</legend>
          <ul class="vat-checks">
            ${types
              .filter((t) => t.group === gr)
              .map(
                (t) =>
                  html`<li>
                    <label class="vat-check"
                      ><input
                        type="checkbox"
                        data-vc="activity"
                        data-id="${t.id}"
                        ${chosen.has(t.id) ? "checked" : ""}
                      />
                      ${I.T(t.label, t.labelEs)}</label
                    >
                  </li>`,
              )}
          </ul>
        </fieldset>`,
    )}
  </fieldset>`;
}

function library(I) {
  const list = listCustom();
  if (!list.length)
    return html`<p>
      ${I.T("Your saved custom lessons will appear here.", "Tus lecciones personalizadas guardadas aparecerán aquí.")}
    </p>`;
  return html`<ul class="vat-units">
    ${list.map(
      (u) =>
        html`<li class="vat-unit">
          <h3>${u.title}</h3>
          <p class="fine">
            ${gradeName(I, u.grade)} · ${u.words.length} ${I.T("words", "palabras")}
          </p>
          <div class="vat-actions">
            <a
              class="btn va-btn"
              href="${vaHref("teacher", "custom")}?edit=${encodeURIComponent(u.id)}"
              >${I.T("Edit", "Editar")}</a
            >
            <a
              class="btn va-btn"
              href="${vaHref("present", u.grade, customSegment(u.id))}"
              >${I.T("Present", "Presentar")}</a
            >
            <a
              class="btn va-btn"
              href="${vaHref("teacher")}?custom=${encodeURIComponent(u.id)}&tab=assign"
              >${I.T("Assign", "Asignar")}</a
            >
            <button type="button" class="btn va-btn" data-vc="export" data-id="${u.id}">
              ${I.T("Export file", "Exportar archivo")}
            </button>
            <button type="button" class="btn va-btn" data-vc="print" data-id="${u.id}">
              ${I.T("Print word list", "Imprimir lista de palabras")}
            </button>
${
              C.pendingDelete === u.id
                ? html`<span role="group" aria-label="${I.S("Confirm delete", "Confirmar eliminación")} ${u.title}"
                    ><span class="fine">${I.T("Delete permanently from this device?", "¿Eliminar de forma permanente de este dispositivo?")}</span>
                    <button type="button" class="btn va-btn" data-vc="delete-yes" data-id="${u.id}">${I.T("Yes, delete", "Sí, eliminar")}</button>
                    <button type="button" class="btn va-btn va-btn-quiet" data-vc="delete-no" data-id="${u.id}">${I.T("Keep it", "Conservarla")}</button></span
                  >`
                : html`<button type="button" class="btn va-btn va-btn-quiet" data-vc="delete" data-id="${u.id}" aria-label="${I.S("Delete", "Eliminar")} ${u.title}">${I.T("Delete", "Eliminar")}</button>`
            }
          </div>
        </li>`,
    )}
  </ul>`;
}

const printList = (I) => {
  const u = C.printId ? getCustom(C.printId) : null;
  if (!u) return "";
  return html`<section class="vat-printlist" aria-hidden="true">
    <h1>${u.title}</h1>
    <p>${gradeName(I, u.grade)}</p>
    <ol>
      ${u.words.map((w) => html`<li><strong lang="en">${w.hw}</strong> (${posName(I, w.pos)}): <span lang="en">${w.def}</span> <em lang="en">${w.ex}</em></li>`)}
    </ol>
  </section>`;
};

export async function customScreen(I) {
  const { index } = await corpus();
  const d = draft();
  const result = C.checked ? validateUnit(d) : null;
  const presets = allPresets(I);
  return html`<div class="vat vat-builder">
    <p class="vat-note">
      ${I.T("Make a lesson from your own words. It is saved on this device in your Teacher Library and runs in the same lessons and activities as the published lessons. It never replaces a published lesson.", "Crea una lección con tus propias palabras. Se guarda en este dispositivo, en tu Biblioteca docente, y funciona en las mismas lecciones y actividades que las lecciones publicadas. Nunca reemplaza una lección publicada.")}
    </p>
    <section class="vat-panel" aria-labelledby="vatLibH">
      <h2 id="vatLibH">${I.T("Teacher Library", "Biblioteca docente")}</h2>
      ${library(I)}
      <div class="vat-row">
        <label for="vatImport">${I.T("Load a lesson file", "Cargar un archivo de lección")}</label
        ><input id="vatImport" type="file" accept=".json,application/json" data-vc="import" />
      </div>
    </section>
    <section class="vat-panel" aria-labelledby="vatBuildH">
      <h2 id="vatBuildH">
        ${C.editing ? I.T("Edit lesson", "Editar lección") : I.T("New lesson", "Nueva lección")}
      </h2>
      ${
        result && !result.ok
          ? html`<div class="vat-alert" role="alert" tabindex="-1" id="vatCAlert">
              <strong>${I.T("Fix these before saving", "Corrige esto antes de guardar")}</strong>
              <ul>
                ${result.errors.map((e) => html`<li>${copy(I, e.code)}</li>`)}${result.words.some((w) => w.errors.length) ? html`<li>${I.T("Some words need attention. They are marked below.", "Algunas palabras necesitan atención. Están marcadas abajo.")}</li>` : ""}
              </ul>
            </div>`
          : ""
      }
      <div class="vat-grid2">
        ${field(I, "vatCTitle", I.S("Lesson title", "Título de la lección"), html`<input id="vatCTitle" type="text" maxlength="70" value="${d.title}" data-vc="unit-field" data-f="title" autocomplete="off" ${result?.errors.some((e) => e.field === "title") ? html`aria-invalid="true"` : ""} />`, result ? result.errors.filter((e) => e.field === "title") : [])}
        <div class="vat-field">
          <label for="vatCGrade">${I.T("Grade", "Grado")}</label>
          <select id="vatCGrade" data-vc="unit-field" data-f="grade">
            ${SHIPPED_GRADES.map((g) => html`<option value="${g}" ${g === d.grade ? "selected" : ""}>${gradeName(I, g)}</option>`)}
          </select>
        </div>
      </div>
      ${field(I, "vatCTheme", I.S("Theme (optional)", "Tema (opcional)"), html`<input id="vatCTheme" type="text" maxlength="80" value="${d.theme}" data-vc="unit-field" data-f="theme" autocomplete="off" />`)}
      ${field(I, "vatCObj", I.S("Objectives, one per line (optional)", "Objetivos, uno por línea (opcional)"), html`<textarea id="vatCObj" rows="3" data-vc="unit-field" data-f="objectives">${d.objectives}</textarea>`, [], I.S("Start each with “I can…”. If you leave this empty, two plain objectives are used.", "Empieza cada uno con “Puedo…”. Si lo dejas vacío, se usan dos objetivos sencillos."))}
      ${field(I, "vatCDisc", I.S("Discussion prompts, one per line (optional)", "Preguntas para conversar, una por línea (opcional)"), html`<textarea id="vatCDisc" rows="2" data-vc="unit-field" data-f="discuss">${d.discuss}</textarea>`)}
      ${sourcePanel(I, index)}
      <h3>${I.T("Your words", "Tus palabras")} (${d.words.length}/${MAX_WORDS})</h3>
      ${
        d.words.length
          ? html`<ol class="vat-wcards">
              ${d.words.map((w, i) => wordCard(I, w, i, result?.words[i], d.grade))}
            </ol>`
          : html`<p>
              ${I.T("No words yet. Add some above, or add a blank card.", "Todavía no hay palabras. Agrega algunas arriba o una tarjeta en blanco.")}
            </p>`
      }
      <button
        type="button"
        class="btn va-btn"
        data-vc="add-blank"
        ${d.words.length >= MAX_WORDS ? "disabled" : ""}
      >
        ${I.T("Add a blank word card", "Agregar una tarjeta en blanco")}
      </button>
      ${activityPanel(I)}
      <div class="vat-field">
        <label for="vatCSup"
          >${I.T("Supports for this lesson (used when you assign it)", "Apoyos para esta lección (se usan al asignarla)")}</label
        >
        <select id="vatCSup" data-vc="supports">
          <option value="">
            ${I.S("None: each student's own supports", "Ninguno: los apoyos de cada estudiante")}
          </option>
          ${presets.map((p) => html`<option value="${p.id}" ${d.supports?.preset === p.id ? "selected" : ""}>${p.label}</option>`)}
        </select>
      </div>
      <div class="vat-actions">
        <button type="button" class="btn btn-primary va-btn" data-vc="save">
          ${C.editing ? I.T("Save changes", "Guardar cambios") : I.T("Save to my Teacher Library", "Guardar en mi Biblioteca docente")}
        </button>
        <button type="button" class="btn va-btn" data-vc="check">
          ${I.T("Check my lesson", "Revisar mi lección")}
        </button>
        <button type="button" class="btn va-btn va-btn-quiet" data-vc="new">
          ${I.T("Start a new lesson", "Empezar una lección nueva")}
        </button>
      </div>
      <p class="vat-status" id="vatCSaveStatus" role="status" aria-live="polite">${C.saveMsg}</p>
    </section>
    ${printList(I)}
  </div>`;
}


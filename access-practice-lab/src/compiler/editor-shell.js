// Experience Builder: the screens around the editor — the home list of drafts, the bar over a draft (steps, live
// validation, undo) and the editor's section tabs. Markup only; the view (src/views/experience-builder.js) owns the
// state and the events.
import { BASE, html } from "../util.js";
import { suggestHTML } from "./editor-suggest.js";
import { SECTIONS, sectionHTML } from "./editor-ui.js";
import { loadDrafts } from "./store.js";

export const STEPS = [
  ["source", "Material", "Material"],
  ["edit", "Edit", "Editar"],
  ["preview", "Preview", "Vista previa"],
  ["assign", "Assign", "Asignar"],
];
export const home = `${BASE}/experience-builder`;
export const stepHref = (key, step, tab = "") => `${home}/${key}/${step}${tab ? `?tab=${tab}` : ""}`;

// ── screens ──────────────────────────────────────────────────────────────────
export function homeHTML(I, ui) {
  const drafts = Object.entries(loadDrafts()).sort(
    (a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0),
  );
  return html`<section class="xb-hero">
      <p class="eyebrow">${I.T("Teacher workspace", "Espacio docente")}</p>
      <h1 tabindex="-1">${I.T("Experience Builder", "Creador de experiencias")}</h1>
      <p class="lead">
        ${I.T("Turn a text you already teach into a simulation your learners play: they explore scenes, question people, weigh evidence, then explain aloud and recommend in writing.", "Convierta un texto que ya enseña en una simulación que sus estudiantes juegan: exploran escenas, hacen preguntas, comparan evidencia y luego explican en voz alta y recomiendan por escrito.")}
      </p>
      <div class="row-actions">
        <a class="btn btn-primary" href="${home}/new"
          >${I.T("Start with my text", "Empezar con mi texto")}</a
        >
        <button type="button" class="btn" data-xb-act="example">
          ${I.T("Try the ecosystem example", "Probar el ejemplo del ecosistema")}
        </button>
      </div>
      <p class="fine">
        ${I.T("Built on this device with fixed rules, with no account and no AI. Every fact a learner reads comes from your text, and you can edit everything.", "Se crea en este dispositivo con reglas fijas, sin cuenta y sin IA. Cada dato que lee un estudiante viene de su texto, y usted puede editarlo todo.")}
      </p>
    </section>
    ${ui.note ? noteHTML(I, ui) : ""}
    <section class="panel" aria-labelledby="xbDraftsH">
      <h2 id="xbDraftsH">
        ${I.T("My experiences on this device", "Mis experiencias en este dispositivo")}
      </h2>
      ${
        drafts.length
          ? html`<ul class="xb-list" data-xb-drafts>
              ${drafts.map(
                ([key, e]) =>
                  html`<li class="xb-card">
                    <h3><a href="${stepHref(key, "edit")}">${I.S(...e.def.title)}</a></h3>
                    <p class="fine">
                      ${I.S(`${e.def.scenes.length} scenes · ${e.def.characters.length} people · ${e.def.evidence.length} pieces of evidence`, `${e.def.scenes.length} escenas · ${e.def.characters.length} personas · ${e.def.evidence.length} evidencias`)}${e.published ? ` · ${I.S(`published to class ${e.published.code}`, `publicada en la clase ${e.published.code}`)}` : ""}
                    </p>
                    <div class="row-actions">
                      <a class="btn small" href="${stepHref(key, "edit")}"
                        >${I.T("Edit", "Editar")}</a
                      >
                      <a class="btn small" href="${stepHref(key, "preview")}"
                        >${I.T("Preview", "Vista previa")}</a
                      >
                      <a class="btn small" href="${stepHref(key, "assign")}"
                        >${I.T("Assign", "Asignar")}</a
                      >
                      <button
                        type="button"
                        class="btn small ghost"
                        data-xb-act="delete"
                        data-xb-arg="${JSON.stringify({ key })}"
                      >
                        ${I.S(`Delete "${e.def.title[0]}"`, `Borrar "${e.def.title[1]}"`)}
                      </button>
                    </div>
                  </li>`,
              )}
            </ul>`
          : html`<p>
              ${I.T("Nothing yet. Start with your text, or try the example.", "Todavía nada. Empiece con su texto o pruebe el ejemplo.")}
            </p>`
      }
      <label class="field" for="xbImport"
        >${I.T("Open an exported experience (.json)", "Abrir una experiencia exportada (.json)")}
        <input id="xbImport" type="file" accept=".json,application/json" data-xb-import
      /></label>
    </section>`;
}

export const noteHTML = (I, ui) =>
  html`<p class="xb-status is-${ui.note.tone || "ok"}" role="status" data-xb-note>
    ${I.S(...ui.note.text)}
  </p>`;

export function barHTML(I, ui, step) {
  const { key, entry, report } = ui;
  const fix = report.errors.length;
  return html`<header class="xb-bar">
    <h1 tabindex="-1" class="xb-title">${I.S(...entry.def.title)}</h1>
    <nav class="xb-steps" aria-label="${I.S("Builder steps", "Pasos del creador")}">
      ${STEPS.map(([id, en, es]) => html`<a class="xb-step-link ${id === step ? "is-on" : ""}" href="${stepHref(key, id)}" ${id === step ? 'aria-current="step"' : ""} data-xb-step="${id}">${I.T(en, es)}</a>`)}
    </nav>
    <div class="xb-bar-row">
      <p
        class="xb-status ${fix ? "is-bad" : "is-ok"}"
        role="status"
        data-xb-valid="${fix ? "no" : "yes"}"
      >
        ${fix ? I.S(`${fix} to fix before publishing`, `${fix} por corregir antes de publicar`) : I.S("Valid and playable", "Válida y jugable")}${report.warnings.length ? ` · ${I.S(`${report.warnings.length} to look at`, `${report.warnings.length} para revisar`)}` : ""}
        · <a href="${stepHref(key, "edit", "check")}">${I.T("Open Check", "Abrir Revisión")}</a>
      </p>
      <button
        type="button"
        class="btn small ghost"
        data-xb-act="undo"
        ${ui.undo.length ? "" : "disabled"}
      >
        ${I.T("Undo the last change", "Deshacer el último cambio")}
      </button>
      <span class="fine">${I.T("Saved on this device", "Guardado en este dispositivo")}</span>
    </div>
    ${ui.note ? noteHTML(I, ui) : ""}
  </header>`;
}

export function editHTML(I, ui, tab) {
  const section = SECTIONS.some(([id]) => id === tab) ? tab : "scenes";
  return html`<div class="xb-editor">
    <nav class="xb-tabs" aria-label="${I.S("Editor sections", "Secciones del editor")}">
      ${SECTIONS.map(([id, en, es]) => html`<a class="xb-tab ${id === section ? "is-on" : ""}" href="${stepHref(ui.key, "edit", id)}" ${id === section ? 'aria-current="page"' : ""} data-xb-tab="${id}">${I.T(en, es)}${id === "check" && ui.report.errors.length ? html` <span class="xb-count">${ui.report.errors.length}</span>` : ""}</a>`)}
    </nav>
    <section class="panel xb-section" data-xb-section="${section}">
      <h2>${I.T(...SECTIONS.find(([id]) => id === section).slice(1))}</h2>
      ${sectionHTML(I, section, ui)}
      ${section === "people" ? suggestHTML(I, ui.entry.def, ui.suggest) : ""}
    </section>
  </div>`;
}


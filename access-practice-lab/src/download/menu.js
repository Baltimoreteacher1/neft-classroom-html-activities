// Download controls. Small on purpose: the views import only this file, and the builders (model, Word writer,
// print view, ZIP) load on the first click with a dynamic import, so activity pages get no heavier.
//   downloadMenuHTML(ctx, kind, source) → the controls; onDownloadClick(e, ctx) → true when it handled the click.
//   kind "activity"      source { id, band, domain, level }          Word + print/PDF of one bank activity
//   kind "room"          source { band, domain, level, ids? }        one .zip of the room's activities (progress, Cancel)
//   kind "speaking-task" | "writing-task"  source = the Studio task  Word + print/PDF
//   kind "simulation"    source = the mission definition (or { id, band })  the mission handout
// Student downloads never include answers; the answer-key edition exists only on the gated Teacher Hub.
import { i18nFor } from "../i18n.js";
import { html, icon } from "../util.js";

export const DOWNLOAD_KINDS = Object.freeze([
  "activity",
  "room",
  "speaking-task",
  "writing-task",
  "simulation",
]);
const SOURCES = new Map();

const keyOf = (kind, s) =>
  `${kind}:${s?.id || [s?.band, s?.domain, s?.level].filter(Boolean).join("/") || "item"}`.replace(
    /[^\w:/.-]/g,
    "-",
  );

/** The source registered for a control key (used by the lazy runner). */
export const downloadSource = (key) => SOURCES.get(key) || null;

export function downloadMenuHTML(ctx, kind, source) {
  if (!DOWNLOAD_KINDS.includes(kind)) throw new Error(`downloadMenuHTML: unknown kind "${kind}"`);
  if (!source || typeof source !== "object")
    throw new Error("downloadMenuHTML: a source object is required");
  const I = i18nFor(ctx);
  const key = keyOf(kind, source);
  SOURCES.set(key, { kind, source });
  if (kind === "room")
    return html`<section class="aside-card dl-room" aria-labelledby="dlRoomTitle">
      <h2 id="dlRoomTitle">
        ${icon("download")}
        ${I.T("Download all activities in this room", "Descarga todas las actividades de esta sala")}
      </h2>
      <p class="fine">
        ${I.T("One .zip file with a Word page for each activity: directions, the task and room to answer. No answers are included.", "Un archivo .zip con una página de Word por actividad: instrucciones, la tarea y espacio para responder. No incluye respuestas.")}
      </p>
      <div class="row-actions">
        <button type="button" class="btn" data-dl="room-zip" data-dl-key="${key}">
          ${icon("download")} ${I.T("Download .zip", "Descargar .zip")}
        </button>
        <button type="button" class="btn" data-dl="cancel" data-dl-key="${key}" hidden style="display:none">
          ${I.T("Cancel", "Cancelar")}
        </button>
      </div>
      <p class="fine" role="status" data-dl-status="${key}"></p>
    </section>`;
  const what =
    kind === "simulation"
      ? I.T("Download the mission handout", "Descarga la hoja de la misión")
      : I.T("Download this activity", "Descarga esta actividad");
  return html`<div
    class="dl-menu"
    role="group"
    aria-label="${kind === "simulation" ? I.S("Download the mission handout", "Descarga la hoja de la misión") : I.S("Download this activity", "Descarga esta actividad")}"
  >
    <p class="fine">${what}</p>
    <div class="row-actions">
      <button type="button" class="btn small" data-dl="docx" data-dl-key="${key}">
        ${icon("download")} ${I.T("Word file", "Archivo de Word")}
      </button>
      <button type="button" class="btn small" data-dl="pdf" data-dl-key="${key}">
        ${icon("print")} ${I.T("Print or save as PDF", "Imprimir o guardar como PDF")}
      </button>
    </div>
    <p class="fine" role="status" data-dl-status="${key}"></p>
  </div>`;
}

/** Click handler for every download control. Opens the print window synchronously (popup rules), then loads the runner. */
export function onDownloadClick(e, ctx) {
  const btn = e.target?.closest?.("[data-dl][data-dl-key]");
  if (!btn) return false;
  const entry = SOURCES.get(btn.dataset.dlKey);
  if (!entry) return false;
  const action = btn.dataset.dl;
  const win = action === "pdf" ? globalThis.window?.open?.("", "_blank") || null : null;
  import("./run.js")
    .then((m) => m.runDownload(action, entry, ctx, { key: btn.dataset.dlKey, win }))
    .catch((err) => {
      console.warn("download", err);
      if (win) win.close();
      const I = i18nFor(ctx);
      const el = globalThis.document?.querySelector(`[data-dl-status="${btn.dataset.dlKey}"]`);
      if (el)
        el.textContent = I.S(
          "The download could not start. Check your connection and try again.",
          "No se pudo iniciar la descarga. Revisa tu conexión e inténtalo otra vez.",
        );
    });
  return true;
}

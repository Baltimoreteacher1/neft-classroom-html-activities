// The download runner, loaded on the first click (menu.js imports it dynamically). It fetches the source, builds
// the student document (model.js / studio.js), and saves a Word file, opens the print view, or builds a room .zip
// with progress and Cancel. Student downloads only: this module never imports the answer key.
import { findActivity, loadDomain, loadEsGuide, ordered } from "../content.js";
import { activeGradeFocus, byGradeFocus } from "../grade-focus.js";
import { i18nFor } from "../i18n.js";
import { activityHref } from "../views/room.js";
import { Cancelled, roomZip } from "./bundle.js";
import { toDocx } from "./docx.js";
import { activityDocument } from "./model.js";
import { openPrintView, printDocumentHTML } from "./print.js";
import { simulationDocument, studioTaskDocument } from "./studio.js";

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const running = new Map(); // key → { cancelled }

const statusEl = (key) => document.querySelector(`[data-dl-status="${key}"]`);
function say(key, text) {
  const el = statusEl(key);
  if (el) el.textContent = text;
}

/** Save bytes as a file through a temporary object URL. */
export function saveFile(bytes, name, type) {
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.hidden = true;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

const langOf = (I) => (I.bilingual ? "bi" : I.spanish ? "es" : "en");

async function buildDocument(entry, I) {
  const lang = langOf(I);
  const { kind, source } = entry;
  if (kind === "activity") {
    const found = await findActivity(source.id, { band: source.band, domain: source.domain });
    if (!found?.activity) throw new Error(`activity ${source.id} not found`);
    const es = lang === "en" ? {} : (await loadEsGuide())[source.id] || {};
    return activityDocument(found.activity, {
      band: found.band,
      domain: found.domain,
      level: found.level,
      lang,
      url: `${location.origin}${activityHref(found.domain, found.level, found.activity.id)}`,
      esDirections: es.directions || "",
    });
  }
  const url = source.url || location.href;
  if (kind === "speaking-task" || kind === "writing-task")
    return studioTaskDocument(source, kind, { lang, url });
  if (kind === "simulation") {
    let def = source;
    if (!def.scenes)
      def = (await import("../sim/missions/index.js")).missionById(source.id, source.band);
    if (!def) throw new Error(`mission ${source.id} not found`);
    return simulationDocument(def, { lang, url });
  }
  throw new Error(`no document for kind ${kind}`);
}

const printUi = (I) => ({
  print: I.S("Print or save as PDF", "Imprimir o guardar como PDF"),
  close: I.S("Close", "Cerrar"),
  howTo: I.S(
    "To make a PDF, press Print and choose “Save as PDF” as the destination.",
    "Para hacer un PDF, pulsa Imprimir y elige “Guardar como PDF” como destino.",
  ),
});

/** Print without a popup (a blocked window): a hidden frame holds the page while the dialog is open. */
function printInFrame(doc, I) {
  const frame = document.createElement("iframe");
  frame.title = doc.title;
  frame.style.cssText =
    "position:fixed;inset:auto auto 0 0;width:1px;height:1px;border:0;opacity:0";
  frame.srcdoc = printDocumentHTML(doc, { origin: location.origin, ui: printUi(I) });
  frame.addEventListener("load", () => {
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 60_000);
  });
  document.body.append(frame);
}

async function runRoom(entry, ctx, key, I) {
  const { band, domain, level } = entry.source;
  const button = document.querySelector(`[data-dl="room-zip"][data-dl-key="${key}"]`);
  const cancel = document.querySelector(`[data-dl="cancel"][data-dl-key="${key}"]`);
  const job = { cancelled: false };
  running.set(key, job);
  if (button) button.disabled = true;
  // .btn sets display, which beats the [hidden] attribute: toggle both.
  const showCancel = (on) => {
    if (!cancel) return;
    cancel.hidden = !on;
    cancel.style.display = on ? "" : "none";
  };
  showCancel(true);
  try {
    say(key, I.S("Getting the activities…", "Buscando las actividades…"));
    const data = await loadDomain(band, domain);
    const all = ordered(data.levels[level]);
    const list = entry.source.ids
      ? all.filter((a) => entry.source.ids.includes(a.id))
      : byGradeFocus(all, activeGradeFocus(ctx.prefs, band));
    const lang = langOf(I);
    const es = lang === "en" ? {} : await loadEsGuide();
    const { bytes } = await roomZip(
      list,
      (a) => ({
        band,
        domain,
        level,
        lang,
        url: `${location.origin}${activityHref(domain, level, a.id)}`,
        esDirections: es[a.id]?.directions || "",
      }),
      {
        onProgress: (n, total) =>
          say(
            key,
            I.S(`Building file ${n} of ${total}…`, `Preparando el archivo ${n} de ${total}…`),
          ),
        cancelled: () => job.cancelled,
      },
    );
    saveFile(
      bytes,
      `${band}-${domain}-${level}-activities.zip`.replace(/[^\w.-]+/g, "-"),
      "application/zip",
    );
    say(
      key,
      I.S(
        `Your .zip with ${list.length} activities is ready.`,
        `Tu .zip con ${list.length} actividades está listo.`,
      ),
    );
  } catch (err) {
    if (err instanceof Cancelled) say(key, I.S("Download cancelled.", "Descarga cancelada."));
    else {
      console.warn("room download", err);
      say(
        key,
        I.S(
          "The .zip could not be built. Try again.",
          "No se pudo crear el .zip. Inténtalo otra vez.",
        ),
      );
    }
  } finally {
    running.delete(key);
    if (button) button.disabled = false;
    showCancel(false);
    button?.focus();
  }
}

/** action: "docx" | "pdf" | "room-zip" | "cancel". */
export async function runDownload(action, entry, ctx, { key, win = null } = {}) {
  const I = i18nFor(ctx);
  if (action === "cancel") {
    const job = running.get(key);
    if (job) job.cancelled = true;
    return;
  }
  if (action === "room-zip") {
    if (!running.has(key)) await runRoom(entry, ctx, key, I);
    return;
  }
  say(key, I.S("Preparing your file…", "Preparando tu archivo…"));
  try {
    const doc = await buildDocument(entry, I);
    if (action === "docx") {
      saveFile(toDocx(doc), `${doc.slug}.docx`, DOCX);
      say(key, I.S("Word file downloaded.", "Archivo de Word descargado."));
    } else if (action === "pdf") {
      if (win && !win.closed) openPrintView(win, doc, printUi(I));
      else printInFrame(doc, I);
      say(
        key,
        I.S(
          "The print view is open. Choose “Save as PDF” to keep a PDF.",
          "La vista para imprimir está abierta. Elige “Guardar como PDF” para guardar un PDF.",
        ),
      );
    }
  } catch (err) {
    console.warn("download", err);
    if (win && !win.closed) win.close();
    say(
      key,
      I.S(
        "The file could not be built. Try again.",
        "No se pudo crear el archivo. Inténtalo otra vez.",
      ),
    );
  }
}

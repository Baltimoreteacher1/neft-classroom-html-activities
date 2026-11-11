// The Quick Guide (/start/guide): the two printed pages for the teacher's grade choice on screen, with a Print / Save
// as PDF button, that grade's PDF and Word downloads, and ticks and plan notes saved on this device only. The pages come
// from quick-guide-model.js and quick-guide-html.js, the same two modules the PDF and Word generator use, so screen and
// paper cannot differ.
import { teacherBand } from "./shell.js";
import { i18nFor } from "../i18n.js";
import { BASE, html, icon } from "../util.js";
import { bandPickerHTML, onBandClick, teacherPick } from "./band.js";
import { ROUTES } from "./data.js";
import { bindGuide, guideHTML } from "./guide.js";
import { GUIDE_STORE_KEY, buildGuideModel, guideFiles } from "./quick-guide-model.js";
import { guideSheets } from "./quick-guide-html.js";
import { withReturn } from "./return-bar.js";
import { loadIntro, updateIntro } from "./state.js";

const labHref = (route) => `${BASE}${route}`;
/** Activity links carry "Back to the Quick Guide"; the PDF and Word file carry plain public URLs instead. */
const href = (route, kind) =>
  kind === "activity" ? withReturn(labHref(route), "guide") : labHref(route);

const saved = () => {
  const g = loadIntro()[GUIDE_STORE_KEY];
  return {
    checks: g && typeof g.checks === "object" && g.checks ? g.checks : {},
    plan: g && typeof g.plan === "object" && g.plan ? g.plan : {},
  };
};

function fileLink(file, kind, I, name) {
  const label = kind === "pdf" ? I.T("Download PDF", "Descargar PDF") : I.T("Download Word file", "Descargar archivo de Word");
  return html`<a class="ig-dl" href="${file[kind]}" download>${icon("download")}<span>${label}</span
    ><span class="visually-hidden">: ${name}</span><span class="ig-size" data-ig-size="${file[kind]}"></span></a
  >`;
}

function downloads(I, files) {
  return html`<section class="ig-downloads" aria-labelledby="ig-dl-h">
    <p id="ig-dl-h" class="ig-dlhead">${I.T("Download and print", "Descargar e imprimir")}</p>
    <ul>
      ${files.downloads.map(
        (f) => html`<li><span class="ig-dlname">${f.name}</span>${fileLink(f, "pdf", I, f.name)}${fileLink(f, "docx", I, f.name)}</li>`,
      )}
    </ul>
  </section>`;
}

function toolbar(I, model, files) {
  return html`<div class="ig-bar no-print">
    ${bandPickerHTML(model.pick, { hint: `Showing the Quick Guide for ${model.grade}. Both pages and the downloads change to match.` })}
    <p class="ig-back"><a href="${labHref(ROUTES.start)}">${icon("arrow-left")}${I.T("Back to Start Here", "Volver a Comenzar aquí")}</a></p>
    <div class="ig-actions">
      <button type="button" class="btn btn-primary" data-ig-print>${icon("print")}${I.T("Print / Save as PDF", "Imprimir / Guardar como PDF")}</button>
    </div>
    ${downloads(I, files)}
    <p class="fine ig-note">${I.T(
      "Ticks and plan notes save in this browser on this device only. They are not sent anywhere. The printed copy is blank unless you type.",
      "Las marcas y las notas se guardan solo en este navegador de este dispositivo. No se envían a ningún lugar. La copia impresa queda en blanco si no escribes.",
    )}</p>
  </div>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const model = buildGuideModel(teacherPick(ctx));
  const files = guideFiles(model.pick);
  const body = html`${teacherBand({ active: "guide", headless: true })}<div class="ig" lang="en">
    ${toolbar(I, model, files)}
    ${guideSheets(model, { href, qr: { start: files.qrStart }, state: saved() })}
    <div class="ig-guide no-print">
      ${guideHTML({
        say: `These two pages are the whole introduction for ${model.grade} on paper: page 1 is the 20-minute exploration, page 2 is the Featured Lesson.`,
        chips: ["time", "share", "account"],
        context: { page: "start", step: "Quick Guide", pick: model.pick },
      })}
    </div>
  </div>`;
  return { title: I.S("Quick Guide", "Guía rápida"), html: body };
}

const formatSize = (bytes) =>
  bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

let sizeRun = 0;
export function mount(root) {
  bindGuide();
  const run = ++sizeRun;
  for (const el of root.querySelectorAll("[data-ig-size]")) {
    fetch(el.dataset.igSize, { method: "HEAD" })
      .then((r) => {
        const n = Number(r.headers.get("content-length"));
        if (r.ok && n > 0 && run === sizeRun)
          el.textContent = ` (${formatSize(n)})`;
      })
      .catch(() => {});
  }
}

export function onClick(e, ctx) {
  if (onBandClick(e, ctx)) return true;
  if (!e.target.closest("[data-ig-print]")) return false;
  window.print();
  return true;
}

export function onChange(e) {
  const id = e.target?.dataset?.igCheck;
  if (!id) return;
  updateIntro(GUIDE_STORE_KEY, (g) => ({ ...g, checks: { ...g.checks, [id]: e.target.checked } }));
}

export function onInput(e) {
  const id = e.target?.dataset?.igPlan;
  if (!id) return;
  updateIntro(GUIDE_STORE_KEY, (g) => ({ ...g, plan: { ...g.plan, [id]: e.target.value } }));
}

// The Quick Guide (/start/guide): the two printed pages on screen, with a Print / Save as PDF button, the PDF and Word
// downloads, and ticks and plan notes saved on this device only. The pages come from quick-guide-model.js and
// quick-guide-html.js, the same two modules the PDF and Word generator use, so screen and paper cannot differ.
import { teacherBand } from "./shell.js";
import { i18nFor } from "../i18n.js";
import { BASE, html, icon } from "../util.js";
import { ROUTES } from "./data.js";
import { GUIDE_FILES, GUIDE_STORE_KEY, buildGuideModel } from "./quick-guide-model.js";
import { guideSheets } from "./quick-guide-html.js";
import { withReturn } from "./return-bar.js";
import { loadIntro, updateIntro } from "./state.js";

const labHref = (route) => `${BASE}${route}`;
/** Activity links carry "Back to the Quick Guide"; the PDF and Word file carry plain public URLs instead. */
const href = (route, kind) =>
  kind === "activity" ? withReturn(labHref(route), "guide") : labHref(route);
const model = buildGuideModel();

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

function downloads(I) {
  return html`<section class="ig-downloads" aria-labelledby="ig-dl-h">
    <p id="ig-dl-h" class="ig-dlhead">${I.T("Download and print", "Descargar e imprimir")}</p>
    <ul>
      ${GUIDE_FILES.downloads.map(
        (f) => html`<li><span class="ig-dlname">${f.name}</span>${fileLink(f, "pdf", I, f.name)}${fileLink(f, "docx", I, f.name)}</li>`,
      )}
    </ul>
  </section>`;
}

function toolbar(I) {
  return html`<div class="ig-bar no-print">
    <p class="ig-back"><a href="${labHref(ROUTES.start)}">${icon("arrow-left")}${I.T("Back to Start Here", "Volver a Comenzar aquí")}</a></p>
    <div class="ig-actions">
      <button type="button" class="btn btn-primary" data-ig-print>${icon("print")}${I.T("Print / Save as PDF", "Imprimir / Guardar como PDF")}</button>
    </div>
    ${downloads(I)}
    <p class="fine ig-note">${I.T(
      "Ticks and plan notes save in this browser on this device only. They are not sent anywhere. The printed copy is blank unless you type.",
      "Las marcas y las notas se guardan solo en este navegador de este dispositivo. No se envían a ningún lugar. La copia impresa queda en blanco si no escribes.",
    )}</p>
  </div>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const body = html`${teacherBand({ active: "guide", headless: true })}<div class="ig" lang="en">
    ${toolbar(I)}
    ${guideSheets(model, { href, qr: { start: GUIDE_FILES.qrStart }, state: saved() })}
  </div>`;
  return { title: I.S("Quick Guide", "Guía rápida"), html: body };
}

const formatSize = (bytes) =>
  bytes >= 1048576
    ? `${(bytes / 1048576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

let sizeRun = 0;
export function mount(root) {
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

export function onClick(e) {
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

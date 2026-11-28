// Premium Language Labs hub (/language-labs, grades 3-5 and 6-8): masthead, Lab Notebook (next up + stamp sheet),
// cover-card catalogue, five-step path, author's craft and guides. Pure markup from the existing progress record
// and the ledger; every hook the lab's click handler and the tests use is kept:
//   .ll-hub root, .ll-card anchors, [data-ll-dim-filter] chips (+ aria-pressed, li[hidden]), [data-ll-speak] buttons,
//   h1[tabindex=-1], #llCatH / #llJourneyH / #llCraftH / #llGuidesH.
// premiumHubHTML(ctx, I, st, band, helpers?) where helpers = { dimFilter = "all", entries = <ledger entries> }.
import * as C from "../content/language-labs.js";
import { loadLedger } from "../lang/ledger.js";
import { BASE, html, icon, raw } from "../util.js";
import { heroBackdrop, labScene } from "./art.js";
import { journeyHTML, craftHTML, guidesHTML } from "./hub-sections.js";
import { nextUpHTML, notebookFor, stampSheetHTML } from "./notebook.js";
import { bandOf, dimPill, labHref, labName, sectionHead, usePill } from "./parts.js";

const FILTERS = [
  ["all", ["All 6 labs", "Los 6 laboratorios"]],
  ["word", ["Word / Phrase", "Palabra / frase"]],
  ["sentence", ["Sentence", "Oración"]],
  ["discourse", ["Discourse", "Discurso"]],
];

const PLATES = ["verb-time-machine", "connector-bridge", "paragraph-xray"];

function heroHTML(I, p, band, nb, stats) {
  const np = nb.next;
  const lab = np.progress.lab;
  const resumed = np.state === "resume";
  return html`<header class="llp-hero is-band-${band}">
    ${heroBackdrop()}
    <div class="llp-hero-text">
      <p class="llp-hero-band">
        <span class="llp-grade">${I.T(...p.grades)}</span>
        <span>${I.T(...p.name)}</span>
      </p>
      <h1 tabindex="-1">${I.T("Language Labs", "Laboratorios de lenguaje")}</h1>
      <p class="llp-hero-eyebrow">${I.T(...p.eyebrow)}</p>
      <p class="llp-hero-lead">${I.T(...p.lead)}</p>
      <div class="llp-hero-cta">
        <a class="btn btn-primary btn-big llp-hero-go" href="${labHref(lab, band, np.step)}">
          ${icon("play")}
          <span class="llp-go-stack">
            <span class="llp-go-eyebrow">${resumed ? I.T("Continue", "Continuar") : I.T("Start", "Empezar")}</span>
            <span class="llp-go-lab">${labName(I, lab)}</span>
          </span>
        </a>
        <a class="btn btn-big llp-hero-alt" href="${BASE}/book-studio?grades=${band}">
          ${icon("library")} ${I.T("Open Book Studio", "Abrir Book Studio")}
        </a>
      </div>
      <p class="llp-hero-stats" role="status">
        <span>${icon("clock")} <span>${I.T(`${stats.seen} of 15 interactive steps explored`, `${stats.seen} de 15 pasos interactivos explorados`)}</span></span>
        <span>${icon("medal")} <span>${I.T(`${stats.transfers} of 3 transfer tasks completed`, `${stats.transfers} de 3 tareas de transferencia completadas`)}</span></span>
        <span>${icon("check")} <span>${I.T(`${nb.totals.earned} of ${nb.totals.total} stamps`, `${nb.totals.earned} de ${nb.totals.total} sellos`)}</span></span>
      </p>
    </div>
    <div class="llp-hero-art" aria-hidden="true" inert>
      ${PLATES.map((id, i) => {
        const l = C.LABS.find((x) => x.id === id);
        return html`<figure class="llp-plate p${i}">
          <span class="llp-plate-art">${labScene(id, band, "h")}</span>
          <figcaption>${l.title[0]}</figcaption>
        </figure>`;
      })}
    </div>
  </header>
  <p class="llp-wida">${icon("check")} <span>${I.T(...p.widaGoal)}</span></p>`;
}

function pipsHTML(prog) {
  const stamps = prog.stamps.filter((s) => !s.bonus);
  return html`<span class="llp-pips" aria-hidden="true">
    ${stamps.map((s) => html`<i class="${s.earned ? "is-on" : ""}"></i>`)}
  </span>`;
}

function cardHTML(I, l, band, prog, hide) {
  const here = !!l.here;
  const progress = here
    ? I.T(
        `${prog.stepsSeen} of 5 steps · ${prog.earned} of ${prog.total} stamps`,
        `${prog.stepsSeen} de 5 pasos · ${prog.earned} de ${prog.total} sellos`,
      )
    : prog.finishedTasks
      ? I.T(
          `${prog.finishedTasks} completed · ${prog.earned} of ${prog.total} stamps`,
          `${prog.finishedTasks} completadas · ${prog.earned} de ${prog.total} sellos`,
        )
      : I.T("Adaptive builder", "Constructor adaptativo");
  return html`<li ${hide ? raw("hidden") : ""}>
    <a class="ll-card llp-card is-${here ? "lab" : "builder"}" href="${labHref(l, band)}">
      <span class="llp-card-cover" aria-hidden="true">
        ${labScene(l.id, band, "c")}
        <span class="llp-card-kind"
          >${here ? I.T("Interactive lab", "Laboratorio interactivo") : I.T("Scaffold builder", "Constructor con apoyos")}</span
        >
      </span>
      <span class="llp-card-body">
        <span class="llp-card-tags">${usePill(I, l.use)} ${dimPill(I, l.dimension)}</span>
        <span class="llp-card-name">${labName(I, l)}</span>
        <span class="llp-card-text">${I.T(...l.text)}</span>
        ${l.bandNote?.[band] ? html`<span class="llp-card-note">${I.T(...l.bandNote[band])}</span>` : ""}
        ${l.mentor?.[band] ? html`<span class="llp-card-mentor" lang="en">“${l.mentor[band]}”</span>` : ""}
        <span class="llp-card-foot">
          <span class="llp-card-prog">
            ${pipsHTML(prog)}
            <span>${I.T(...l.skill)} · ${progress}</span>
          </span>
          ${prog.complete ? html`<span class="llp-card-badge">${icon("check")} ${I.T("Completed", "Completado")}</span>` : ""}
          <span class="llp-card-cta">${here ? I.T("Open lab", "Abrir laboratorio") : I.T("Open builder", "Abrir constructor")} ${icon("arrow-right")}</span>
        </span>
      </span>
    </a>
  </li>`;
}

function catalogueHTML(I, p, band, nb, dimFilter) {
  return html`<section class="llp-catalogue" aria-labelledby="llCatH">
    <div class="llp-cat-bar">
      ${sectionHead(
        I.T(`Six Interactive Labs · ${p.grades[0]}`, `Seis laboratorios interactivos · ${p.grades[1]}`),
        I.T("Choose a language lab", "Elige un laboratorio de lenguaje"),
        "llCatH",
      )}
      <div class="llp-filter" role="group" aria-label="${I.S("Filter by language dimension", "Filtrar por dimensión del lenguaje")}">
        ${FILTERS.map(
          ([id, label]) =>
            html`<button
              type="button"
              class="chip ${dimFilter === id ? "is-on" : ""}"
              data-ll-dim-filter="${id}"
              aria-pressed="${dimFilter === id ? "true" : "false"}"
            >
              ${I.T(...label)}
            </button>`,
        )}
      </div>
    </div>
    <ul class="llp-cards">
      ${C.LABS.map((l, i) => cardHTML(I, l, band, nb.labs[i], dimFilter !== "all" && l.dimension !== dimFilter))}
    </ul>
  </section>`;
}

export function premiumHubHTML(ctx, I, st, band, helpers = {}) {
  const b = bandOf(band ?? ctx?.band);
  const p = C.programForLab(b);
  const entries = helpers.entries ?? loadLedger().entries ?? [];
  const dimFilter = helpers.dimFilter || "all";
  const nb = notebookFor(st || {}, b, entries);
  const here = nb.labs.filter((x) => x.kind === "here");
  const stats = {
    seen: here.reduce((n, x) => n + x.stepsSeen, 0),
    transfers: here.filter((x) => x.transferOk).length,
  };
  return html`<section class="ll-hub llp is-band-${b}">
    ${heroHTML(I, p, b, nb, stats)}
    <section class="llp-notebook" aria-label="${I.S("Lab Notebook", "Cuaderno de laboratorio")}">
      ${nextUpHTML(I, nb, b)}${stampSheetHTML(I, nb)}
    </section>
    ${catalogueHTML(I, p, b, nb, dimFilter)}
    ${journeyHTML(I, p)}
    ${craftHTML(I, p, b)}
    ${guidesHTML(I, p)}
  </section>`;
}

// The Site Guide (/site-guide, /site-guide/<section>, ?for=teacher|student|family, ?q=<search>).
// The main page is a short directory: three plain groups (teachers, students, families), each entry a name, one
// sentence and a link, then the Help questions and a list of step-by-step guides. Each guide opens on its own page
// (/site-guide/<section>). The reader can choose who they are (saved on this device in `accessPracticeLab:v1:intro`
// under `siteGuideAudience`) to see only their group. Facts come from sitemap.js and data.js through the
// site-guide-*.js data files.
import { crumbsHTML } from "../components.js";
import { i18nFor } from "../i18n.js";
import { announce, BASE, html, icon, toHtml } from "../util.js";
import { ROUTES } from "./data.js";
import {
  classroomSection,
  moreSection,
  speakingSection,
  writingSection,
} from "./site-guide-cards.js";
import {
  AUDIENCES,
  AUDIENCE_IDS,
  ENGLISH_ONLY_NOTE,
  GUIDE,
  SECTIONS,
  SECTION_IDS,
  SPANISH_NOTE,
} from "./site-guide-data.js";
import { buildIndex, resultLabel, searchGuide } from "./site-guide-search.js";
import {
  aroundSection,
  audienceHTML,
  directoryHTML,
  guidesHTML,
  helpSection,
  homeSection,
  resultsHTML,
  searchHTML,
  startSection,
} from "./site-guide-sections.js";
import { clearIntro, loadIntro, updateIntro } from "./state.js";

const AUDIENCE_KEY = "siteGuideAudience";
/** Sections whose text is not translated (the note says so). */
const ENGLISH_ONLY = new Set(["speaking", "writing", "more", "classroom"]);

let index = null;
let cleanup = () => {};

const storedAudience = () => {
  const v = loadIntro()[AUDIENCE_KEY];
  return AUDIENCE_IDS.includes(v) ? v : "";
};
const saveAudience = (a) => (a ? updateIntro(AUDIENCE_KEY, () => a) : clearIntro(AUDIENCE_KEY));

/** Rewrites the address without a page load: `id` (section) and `q`, keeping other parameters. */
function syncUrl({ id, q, audience }) {
  const url = new URL(location.href);
  const params = new URLSearchParams(url.search);
  if (q !== undefined) q ? params.set("q", q) : params.delete("q");
  if (audience !== undefined) audience ? params.set("for", audience) : params.delete("for");
  const search = params.toString();
  const path = `${BASE}${ROUTES.siteGuide}${id ? `/${id}` : ""}`;
  const next = `${path}${search ? `?${search}` : ""}`;
  if (next !== url.pathname + url.search) history.replaceState({}, "", next);
}

const SECTION_BODY = {
  start: (I, a) => startSection(I, a),
  speaking: (I, a) => speakingSection(I, a),
  writing: (I, a) => writingSection(I, a),
  more: () => moreSection(),
  classroom: () => classroomSection(),
  home: (I) => homeSection(I),
  around: (I) => aroundSection(I),
  help: (I) => helpSection(I),
};

/** One guide section: heading, the English-only note where it applies, and its body. */
function sectionHTML(I, s, audience) {
  const note =
    ENGLISH_ONLY.has(s.id) && (I.spanish || I.bilingual)
      ? html`<p class="fine sg-note" lang="${I.spanish ? "es" : "en"}">
          ${I.TO(ENGLISH_ONLY_NOTE)}
        </p>`
      : "";
  return html`<section class="sg-section" id="sg-${s.id}" data-sg-section="${s.id}" aria-labelledby="sg-${s.id}-h">
    <h2 id="sg-${s.id}-h" tabindex="-1">
      <span class="sg-ic" aria-hidden="true">${icon(s.icon)}</span>${I.TO(s.title)}
    </h2>
    ${note}${SECTION_BODY[s.id](I, audience)}
  </section>`;
}

const printButton = (I) =>
  html`<p class="no-print">
    <button type="button" class="btn sg-print" data-sg-print>
      ${icon("print")} ${I.T("Print this page", "Imprimir esta página")}
    </button>
  </p>`;

export async function render(ctx) {
  const I = i18nFor(ctx);
  const route = ctx.route;
  const asked = AUDIENCE_IDS.includes(route.audience) ? route.audience : "";
  if (asked && asked !== storedAudience()) saveAudience(asked);
  const audience = asked || storedAudience();
  const section = SECTIONS.find((s) => s.id === route.id);
  const q = (route.q || "").slice(0, 120);
  const title = I.S(GUIDE.title.en, GUIDE.title.es);
  const spanishNote = I.spanish || I.bilingual ? html`<p class="fine sg-note">${I.TO(SPANISH_NOTE)}</p>` : "";
  const head = html`<header class="sg-head">
    <p class="eyebrow">${I.T("Site Guide", "Guía del sitio")}</p>
    <h1 id="sgTitle" tabindex="-1">${I.TO(GUIDE.title)}</h1>
    ${
      section
        ? html`<p class="sg-back no-print"><a class="btn" href="${BASE}${ROUTES.siteGuide}">${icon("arrow-left")} ${I.T("Back to Guide", "Volver a la guía")}</a></p>`
        : html`<p class="lead">${I.TO(GUIDE.lead)}</p>
            ${audienceHTML(I, audience)}`
    }
  </header>`;
  // A step-by-step guide: that one section on its own page.
  const body = section
    ? html`${spanishNote}${sectionHTML(I, section, audience)}${printButton(I)}`
    : html`${searchHTML(I, q)}${spanishNote}${directoryHTML(I, audience)}
        ${sectionHTML(I, SECTIONS.find((s) => s.id === "help"), audience)} ${guidesHTML(I)}
        ${printButton(I)}`;
  return {
    title: section ? `${I.S(section.title.en, section.title.es)} · ${title}` : title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/`],
        ...(section ? [[title, `${BASE}${ROUTES.siteGuide}`]] : []),
        [section ? I.S(section.title.en, section.title.es) : title, null],
      ])}
      <article class="sg-page" data-audience="${audience}" aria-labelledby="sgTitle">
        ${head}
        <div class="sg-main">${body}</div>
      </article>`,
  };
}

// ── behavior ──────────────────────────────────────────────────────────────────────────────────

export function mount(root, ctx) {
  const I = i18nFor(ctx);
  const page = root.querySelector(".sg-page");
  if (!page) return;
  const input = page.querySelector("[data-sg-q]");
  const results = page.querySelector("[data-sg-results]");
  const status = page.querySelector("[data-sg-status]");
  const secTitle = (sid) => I.TO(resultLabel(sid));

  const runSearch = (q, { say = true } = {}) => {
    index ||= buildIndex();
    const found = searchGuide(index, q);
    results.innerHTML = q.trim() ? toHtml(resultsHTML(I, found, secTitle)) : "";
    const msg = !q.trim()
      ? ""
      : found.length
        ? I.S(
            `${found.length} ${found.length === 1 ? "result" : "results"}.`,
            `${found.length} ${found.length === 1 ? "resultado" : "resultados"}.`,
          )
        : I.S(
            "No results. Links to Speaking, Writing and Help are below.",
            "Sin resultados. Abajo hay enlaces a Hablar, Escribir y Ayuda.",
          );
    status.textContent = say ? msg : "";
    return found;
  };
  const onInput = () => {
    runSearch(input.value);
    syncUrl({ q: input.value.trim() });
  };
  const onSubmit = (e) => {
    e.preventDefault();
    runSearch(input.value);
  };
  let reopened = [];
  const beforePrint = () => {
    reopened = [...page.querySelectorAll("details:not([open])")];
    for (const d of reopened) d.open = true;
  };
  const afterPrint = () => {
    for (const d of reopened) d.open = false;
    reopened = [];
  };

  input?.addEventListener("input", onInput);
  page.querySelector("[data-sg-search-form]")?.addEventListener("submit", onSubmit);
  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
  cleanup = () => {
    window.removeEventListener("beforeprint", beforePrint);
    window.removeEventListener("afterprint", afterPrint);
  };

  if (input?.value.trim()) runSearch(input.value, { say: false });
  // A step-by-step guide opens with its heading focused, so a screen reader starts at the section.
  if (SECTION_IDS.includes(ctx.route.id))
    setTimeout(() => page.querySelector(`#sg-${ctx.route.id} h2`)?.focus({ preventScroll: true }), 80);
}

export const unmount = () => cleanup();

export function onClick(e, ctx) {
  const aud = e.target.closest("[data-sg-audience]");
  if (aud) {
    const pick = aud.dataset.sgAudience;
    const next =
      ctx.route.audience === pick || (!ctx.route.audience && storedAudience() === pick) ? "" : pick;
    const label = AUDIENCES.find((a) => a.id === next)?.label || {};
    saveAudience(next);
    syncUrl({ id: ctx.route.id || "", audience: "" });
    announce(
      next
        ? i18nFor(ctx).S(`Showing the guide for: ${label.en}.`, `Mostrando la guía para: ${label.es}.`)
        : i18nFor(ctx).S("Showing every group.", "Mostrando todos los grupos."),
    );
    ctx.rerender();
    return true;
  }
  if (e.target.closest("[data-sg-print]")) {
    window.print();
    return true;
  }
  return false;
}

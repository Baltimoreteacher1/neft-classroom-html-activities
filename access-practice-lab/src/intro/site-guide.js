// The Site Guide (/site-guide, /site-guide/<section>, ?for=teacher|student|family, ?q=<search>).
// A permanent guide that works without the PD: short explanations, verified links, optional examples. The reader chooses
// who they are (saved on this device in `accessPracticeLab:v1:intro` under `siteGuideAudience`); every section stays
// reachable by its own link. Facts come from data.js through site-guide-data.js / site-guide-more.js.
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
  visibleSections,
} from "./site-guide-data.js";
import { buildIndex, searchGuide } from "./site-guide-search.js";
import {
  aroundSection,
  audienceHTML,
  helpSection,
  homeSection,
  resultsHTML,
  searchHTML,
  startSection,
  teacherIntro,
  tocHTML,
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

function sectionHTML(I, s, audience) {
  const note =
    ENGLISH_ONLY.has(s.id) && (I.spanish || I.bilingual)
      ? html`<p class="fine sg-note" lang="${I.spanish ? "es" : "en"}">
          ${I.TO(ENGLISH_ONLY_NOTE)}
        </p>`
      : "";
  return html`<section
    class="sg-section"
    id="sg-${s.id}"
    data-sg-section="${s.id}"
    aria-labelledby="sg-${s.id}-h"
  >
    <h2 id="sg-${s.id}-h" tabindex="-1">
      <span class="sg-ic" aria-hidden="true">${icon(s.icon)}</span>${I.TO(s.title)}
    </h2>
    ${note}${SECTION_BODY[s.id](I, audience)}
    <p class="sg-permalink no-print">
      <a href="${BASE}${ROUTES.siteGuide}/${s.id}"
        >${I.T("Link to this section", "Enlace a esta sección")}</a
      >
    </p>
  </section>`;
}

export async function render(ctx) {
  const I = i18nFor(ctx);
  const route = ctx.route;
  const asked = AUDIENCE_IDS.includes(route.audience) ? route.audience : "";
  if (asked && asked !== storedAudience()) saveAudience(asked);
  const audience = asked || storedAudience();
  const id = SECTION_IDS.includes(route.id) ? route.id : "";
  const visible = visibleSections(audience, id);
  const q = (route.q || "").slice(0, 120);
  const title = I.S(GUIDE.title.en, GUIDE.title.es);
  return {
    title,
    html: html`${crumbsHTML([
        [I.S("Lab", "Laboratorio"), `${BASE}/`],
        [title, null],
      ])}
      <article class="sg-page" data-audience="${audience}" aria-labelledby="sgTitle">
        <header class="sg-head">
          <p class="eyebrow">${I.T("Site Guide", "Guía del sitio")}</p>
          <h1 id="sgTitle" tabindex="-1">${I.TO(GUIDE.title)}</h1>
          <p class="lead">${I.TO(GUIDE.lead)}</p>
          ${id ? html`<p class="sg-back no-print"><a class="btn" href="${BASE}${ROUTES.siteGuide}">${icon("arrow-left")} ${I.T("Back to Guide", "Volver a la guía")}</a></p>` : ""}
          ${audienceHTML(I, audience)} ${audience === "teacher" ? teacherIntro(I) : ""}
        </header>
        <div class="sg-layout">
          <div class="sg-side no-print">
            ${tocHTML(I, visible, id)}
            <button type="button" class="btn sg-print" data-sg-print>
              ${icon("print")} ${I.T("Print Guide", "Imprimir la guía")}
            </button>
          </div>
          <div class="sg-main">
            ${searchHTML(I, q)}
            ${I.spanish || I.bilingual ? html`<p class="fine sg-note">${I.TO(SPANISH_NOTE)}</p>` : ""}
            ${SECTIONS.filter((s) => visible.includes(s.id)).map((s) => sectionHTML(I, s, audience))}
            ${audience ? "" : html`<p class="fine sg-more-note">${I.T("Teaching? Practicing at home? Choose above to see classroom routines or Practice at Home.", "¿Enseñan o practican en casa? Elijan arriba para ver rutinas de clase o Practicar en casa.")}</p>`}
          </div>
        </div>
      </article>`,
  };
}

// ── behavior ──────────────────────────────────────────────────────────────────────────────────

const sectionTop = (el) => el.getBoundingClientRect().top;

export function mount(root, ctx) {
  const I = i18nFor(ctx);
  const page = root.querySelector(".sg-page");
  if (!page) return;
  const sections = [...page.querySelectorAll("[data-sg-section]")];
  const links = [...page.querySelectorAll("[data-sg-jump]")];
  const select = page.querySelector("[data-sg-select]");
  const input = page.querySelector("[data-sg-q]");
  const results = page.querySelector("[data-sg-results]");
  const status = page.querySelector("[data-sg-status]");
  const secTitle = (sid) => I.TO(SECTIONS.find((s) => s.id === sid).title);
  let current = "";
  let urlTimer = 0;

  const setCurrent = (sid) => {
    if (sid === current) return;
    current = sid;
    for (const a of links) {
      if (a.dataset.sgJump === sid) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    }
    if (select) select.value = sid;
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => syncUrl({ id: sid }), 300);
  };
  const jump = (sid) => {
    const target = page.querySelector(`#sg-${sid}`);
    if (!target) return ctx.navigate(`${BASE}${ROUTES.siteGuide}/${sid}${location.search}`);
    target.scrollIntoView({ block: "start" });
    target.querySelector("h2")?.focus({ preventScroll: true });
    setCurrent(sid);
  };
  const spy = () => {
    let sid = "";
    for (const s of sections) if (sectionTop(s) <= 200) sid = s.dataset.sgSection;
    setCurrent(sid);
  };
  let raf = 0;
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(spy);
  };

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

  const onNavClick = (e) => {
    const a = e.target.closest("a[data-sg-jump]");
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    jump(a.dataset.sgJump);
  };
  const onSelect = (e) => e.target.value && jump(e.target.value);
  const onInput = () => {
    runSearch(input.value);
    syncUrl({ id: current, q: input.value.trim() });
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

  page.querySelector(".sg-toc")?.addEventListener("click", onNavClick);
  select?.addEventListener("change", onSelect);
  input?.addEventListener("input", onInput);
  page.querySelector("[data-sg-search-form]")?.addEventListener("submit", onSubmit);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("beforeprint", beforePrint);
  window.addEventListener("afterprint", afterPrint);
  cleanup = () => {
    clearTimeout(urlTimer);
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("beforeprint", beforePrint);
    window.removeEventListener("afterprint", afterPrint);
  };

  if (input?.value.trim()) runSearch(input.value, { say: false });
  const first = ctx.route.id;
  if (SECTION_IDS.includes(first)) setTimeout(() => jump(first), 80);
  else current = "";
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
        : i18nFor(ctx).S("Showing the short general guide.", "Mostrando la guía general corta."),
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

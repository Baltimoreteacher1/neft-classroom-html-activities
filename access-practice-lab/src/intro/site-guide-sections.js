// Site Guide markup, part 2: the directory (three groups of name + sentence + link), the list of step-by-step guides,
// Start Here, Practice at Home, Find Your Way Around, Help, and the page furniture (audience choice, search).
// The directory, Start Here, Home, Around and Help are fully bilingual.
import { BASE, html, icon } from "../util.js";
import { ACTIVITY_BY_ID, ROUTES } from "./data.js";
import { FAMILY } from "./family-data.js";
import { activityLink, en, linkHTML } from "./site-guide-cards.js";
import { directoryGroups, ELSEWHERE } from "./site-guide-directory.js";
import { AUDIENCES, GUIDE, HOME, SECTIONS, START_FACTS, START_STEPS, STARTERS } from "./site-guide-data.js";
import { AREAS, FAQ, SCREENSHOTS, WAYS } from "./site-guide-more.js";

const entryHTML = (I, e) =>
  html`<li class="sg-entry" data-sg-entry="${e.id}">
    ${linkHTML(e.route, I.TO(e.title), "sg-entry-name", e.site)}
    <p>${I.TO(e.text)}</p>
  </li>`;

/** One audience group. Groups with `subs` show each step under its own small heading, in the order people use them. */
function groupHTML(I, g) {
  const body = g.subs
    ? g.subs
        .map((sub) => ({ sub, entries: g.entries.filter((e) => e.sub === sub.id) }))
        .filter((x) => x.entries.length)
        .map(
          ({ sub, entries }) => html`<div class="sg-subgroup" data-sg-sub="${sub.id}">
            <h3 class="sg-subhead">${I.TO(sub.title)}</h3>
            <ul class="sg-entries">${entries.map((e) => entryHTML(I, e))}</ul>
          </div>`,
        )
    : html`<ul class="sg-entries">${g.entries.map((e) => entryHTML(I, e))}</ul>`;
  return html`<section class="sg-dir" id="sg-dir-${g.id}" data-sg-group="${g.id}" aria-labelledby="sg-dir-${g.id}-h">
    <h2 id="sg-dir-${g.id}-h"><span class="sg-ic" aria-hidden="true">${icon(g.icon)}</span>${I.TO(g.title)}</h2>
    ${body}
  </section>`;
}

export function directoryHTML(I, audience) {
  return html`${directoryGroups(audience).map((g) => groupHTML(I, g))}
    <p class="sg-elsewhere">
      ${I.T("Looking for something else?", "¿Buscan otra cosa?")}
      ${ELSEWHERE.map((e, i) => html`${i ? " · " : " "}${linkHTML(e.route, I.TO(e.title), "sg-textlink")}`)}
    </p>`;
}

/** The step-by-step guides, one link each (Help is shown in full on the directory page). */
export function guidesHTML(I) {
  return html`<section class="sg-guides no-print" aria-labelledby="sgGuidesH">
    <h2 id="sgGuidesH">${I.T("Step-by-step guides", "Guías paso a paso")}</h2>
    <ul class="sg-plain">
      ${SECTIONS.filter((s) => s.id !== "help").map(
        (s) => html`<li>${linkHTML(`${ROUTES.siteGuide}/${s.id}`, I.TO(s.title), "sg-textlink")}</li>`,
      )}
    </ul>
  </section>`;
}

export function startSection(I, audience) {
  return html`<ol class="sg-steps">
      ${START_STEPS.map((s) => html`<li><strong>${I.TO(s.head)}</strong><span>${I.TO(s.body)}</span></li>`)}
    </ol>
    <div class="sg-starters">
      ${STARTERS.map((st) => {
        const a = ACTIVITY_BY_ID[st.id];
        return html`<div class="sg-starter pw-${a.pathway}">
          <p class="sg-sub">${I.TO(st.kind)}</p>
          <p class="sg-why">${I.TO(st.why)}</p>
          ${activityLink(a.route, html`${en(a.name)} ${icon("arrow-right")}`, "btn btn-primary")}
        </div>`;
      })}
    </div>
    <div class="sg-facts">
      ${START_FACTS.map((f) => html`<p>${icon("check")} ${I.T(f.en, f.es)}</p>`)}
    </div>
    ${audience === "family" ? html`<p>${linkHTML(ROUTES.together, html`${I.TO(HOME.open)} ${icon("arrow-right")}`, "btn")}</p>` : ""}`;
}

export function homeSection(I) {
  return html`<p class="lead">${I.TO(HOME.lead)}</p>
    <p class="sg-big">
      ${linkHTML(ROUTES.together, html`${icon("families")} ${I.TO(HOME.open)} ${icon("arrow-right")}`, "btn btn-primary btn-big")}
    </p>
    <ol class="sg-steps">
      ${HOME.bullets.map((b) => html`<li><span>${I.TO(b)}</span></li>`)}
    </ol>
    <p>${I.TO(HOME.detail)} ${linkHTML("/family", I.TO(HOME.more), "sg-textlink")}</p>
    <p class="fine">${I.TO(FAMILY.privacy)}</p>`;
}

function shotHTML(I, s) {
  return html`<figure class="sg-shot">
    <img
      src="${BASE}/pictures/guide/${s.file}"
      alt="${s.alt}"
      width="${s.w}"
      height="${s.h}"
      loading="lazy"
      decoding="async"
    />
    <figcaption>${I.TO(s.caption)}</figcaption>
  </figure>`;
}

export function aroundSection(I) {
  return html`<dl class="sg-ways">
      ${WAYS.map(
        (w) =>
          html`<div id="sg-way-${w.id}">
            <dt>${I.TO(w.q)}</dt>
            <dd>
              ${I.TO(w.a)}
              ${(w.links || []).map((l, i) => html`${i ? " · " : " "}${linkHTML(l.route, I.TO(l.label), "sg-textlink")}`)}
            </dd>
          </div>`,
      )}
    </dl>
    <div class="sg-shots">${SCREENSHOTS.map((s) => shotHTML(I, s))}</div>
    <details class="sg-areas">
      <summary>${I.T("All areas at a glance", "Todas las áreas de un vistazo")}</summary>
      <ul>
        ${AREAS.map(
          (a) =>
            html`<li class="${a.main ? "is-main" : ""}">
              <span class="sg-ic" aria-hidden="true">${icon(a.icon)}</span>
              <span
                >${linkHTML(a.route, a.name, "sg-areaname")}${a.second ? html` · ${linkHTML(a.second.route, a.second.label)}` : ""}
                <span class="fine">${a.text}</span></span
              >
            </li>`,
        )}
      </ul>
    </details>`;
}

export function helpSection(I) {
  return html`<div class="sg-faq">
    ${FAQ.map(
      (f) =>
        html`<details id="sg-faq-${f.id}">
          <summary>${I.TO(f.q)}</summary>
          <p>${I.TO(f.a)}</p>
          ${(f.links || []).map((l) => html`<p>${linkHTML(l.route, html`${I.TO(l.label)} ${icon("arrow-right")}`, "sg-textlink")}</p>`)}
        </details>`,
    )}
  </div>`;
}

/** Audience choice: three toggle buttons. Pressing the chosen one again goes back to the short general guide. */
export function audienceHTML(I, audience) {
  return html`<div class="sg-audience" role="group" aria-labelledby="sgWho">
    <p id="sgWho" class="sg-sub">${I.T("Who is this guide for?", "¿Para quién es esta guía?")}</p>
    <div class="sg-aud-row">
      ${AUDIENCES.map(
        (a) =>
          html`<button
            type="button"
            class="chip${audience === a.id ? " is-on" : ""}"
            data-sg-audience="${a.id}"
            aria-pressed="${audience === a.id}"
          >
            ${icon(a.icon)} ${I.TO(a.label)}
          </button>`,
      )}
    </div>
    <p class="fine">
      ${audience ? I.T("Press your choice again to see every group.", "Toquen su elección otra vez para ver todos los grupos.") : I.TO(GUIDE.general)}
    </p>
  </div>`;
}

export function searchHTML(I, q) {
  return html`<form class="sg-search" role="search" data-sg-search-form>
    <label for="sgQ">${I.T("Search the guide", "Buscar en la guía")}</label>
    <div class="sg-search-row">
      <input
        id="sgQ"
        type="search"
        value="${q}"
        autocomplete="off"
        enterkeyhint="search"
        data-sg-q
        placeholder="${I.S("Try “microphone” or “save”", "Prueben «micrófono» o «guardar»")}"
      />
      <button type="submit" class="btn">${icon("search")} ${I.T("Search", "Buscar")}</button>
    </div>
    <p class="sg-status fine" role="status" aria-live="polite" data-sg-status></p>
    <div data-sg-results></div>
  </form>`;
}

/** Result list markup, or the three "try these" links when nothing matches. */
export function resultsHTML(I, results, secTitle) {
  if (!results.length) {
    return html`<p>
        ${I.T("No match. Try one of these:", "Sin resultados. Prueben con uno de estos:")}
      </p>
      <ul class="sg-plain">
        <li>${linkHTML("/site-guide/speaking", I.T("Speaking", "Hablar"))}</li>
        <li>${linkHTML("/site-guide/writing", I.T("Writing", "Escribir"))}</li>
        <li>
          ${linkHTML("/site-guide/help", I.T("Help and Common Questions", "Ayuda y preguntas frecuentes"))}
        </li>
      </ul>`;
  }
  return html`<ul class="sg-results">
    ${results.map(
      (r) =>
        html`<li>
          <p class="sg-sub">${secTitle(r.section)}</p>
          <p>
            ${r.guide ? linkHTML(r.route, r.title, "sg-resname") : activityLink(r.route, r.title, "sg-resname")}
          </p>
          ${r.excerpt ? html`<p class="fine">${r.excerpt}</p>` : ""}
        </li>`,
    )}
  </ul>`;
}


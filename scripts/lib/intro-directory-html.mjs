// Print markup for the Site Directory: a cover with counts and a contents page (page numbers filled in on the second
// render pass), then every band, domain, level and activity, the practice tests, and the other places on the site.
import { html, raw, toHtml } from "../../access-practice-lab/src/util.js";

/** The unique text a page carries for each contents entry; the page-number pass searches the PDF text for it. */
export const marker = {
  band: (b) => `${b.label}: ${b.count} activities`,
  domain: (b, d) => `${b.label} · ${d.name}`,
  tests: () => "Practice tests: all forms",
  places: () => "Other places on the site",
};

const DOMAINS = ["Listening", "Reading", "Speaking", "Writing", "Model-Test"];

function cover(m) {
  const present = DOMAINS.filter((d) => m.bands.some((b) => b.domains.some((x) => x.id === d)));
  const cell = (b, d) => b.domains.find((x) => x.id === d)?.count ?? "–";
  const nameOf = (d) => m.bands.flatMap((b) => b.domains).find((x) => x.id === d).name;
  return html`<article class="ig-sheet sd-cover" aria-labelledby="sd-h1">
    <h1 id="sd-h1" class="sd-title">${m.title}</h1>
    <p class="sd-subtitle">${m.subtitle}</p>
    <p>Generated ${m.generated} from the lab's activity index. Every title is a link; the address of each one begins
      <strong>${m.base}</strong>. Activities are grouped by grade band, then domain, then support level. Support levels
      are classroom support choices, not WIDA proficiency levels.</p>
    <table class="sd-counts">
      <caption>Activities by grade band and domain</caption>
      <thead><tr><th scope="col">Grade band</th>${present.map((d) => html`<th scope="col">${nameOf(d)}</th>`)}<th scope="col">Total</th></tr></thead>
      <tbody>
        ${m.bands.map((b) => html`<tr><th scope="row">${b.label}</th>${present.map((d) => html`<td>${cell(b, d)}</td>`)}<td><strong>${b.count}</strong></td></tr>`)}
      </tbody>
      <tfoot><tr><th scope="row">All bands</th>${present.map((d) => html`<td>${m.bands.reduce((n, b) => n + (b.domains.find((x) => x.id === d)?.count || 0), 0)}</td>`)}<td><strong>${m.total}</strong></td></tr></tfoot>
    </table>
    <p>Plus ${m.tests.length} practice tests and ${m.places.reduce((n, g) => n + g.items.length, 0)} other places on the site.</p>
  </article>`;
}

function contents(m, pages) {
  const pg = (key) => (pages[key] ? `page ${pages[key]}` : "page 00");
  const row = (text, key, cls = "") =>
    html`<li class="${cls}"><span>${text}</span><span class="sd-dots" aria-hidden="true"></span><span class="sd-pg">${pg(key)}</span></li>`;
  return html`<nav class="ig-sheet sd-contents" aria-labelledby="sd-toc-h">
    <h2 id="sd-toc-h">Contents</h2>
    <ol>
      ${m.bands.map(
        (
          b,
        ) => html`${row(raw(`<strong>${b.label}</strong> (${b.count})`), marker.band(b), "sd-tband")}
          ${b.domains.map((d) => row(`${d.name} (${d.count})`, marker.domain(b, d), "sd-tdom"))}`,
      )}
      ${row(raw(`<strong>Practice tests</strong> (${m.tests.length})`), marker.tests(), "sd-tband")}
      ${row(raw("<strong>Other places on the site</strong>"), marker.places(), "sd-tband")}
    </ol>
  </nav>`;
}

const activityRow = (r) =>
  html`<li class="sd-row"><a href="${r.url}">${r.title}</a><span>${r.skill}</span><span class="sd-min">${r.time}</span></li>`;

function bandSection(b) {
  return html`<section class="sd-band" aria-labelledby="sd-b-${b.id}">
    <h2 id="sd-b-${b.id}" class="sd-bandh">${b.label}</h2>
    <p class="sd-mark">${marker.band(b)}.${b.note ? ` ${b.note}` : ""}</p>
    ${b.domains.map(
      (d) => html`<section class="sd-domain" aria-labelledby="sd-d-${b.id}-${d.id}">
        <h3 id="sd-d-${b.id}-${d.id}"><span class="sd-pre">${b.label} · </span>${d.name} <span class="sd-count">${d.count} activities</span></h3>
        ${d.levels.map(
          (l) => html`<h4>${l.name} <span class="sd-count">(${l.rows.length})</span></h4>
            <ul class="sd-rows">${l.rows.map(activityRow)}</ul>`,
        )}
      </section>`,
    )}
  </section>`;
}

function testsSection(m) {
  return html`<section class="sd-band" aria-labelledby="sd-tests">
    <h2 id="sd-tests" class="sd-bandh">Practice tests</h2>
    <p class="sd-mark">${marker.tests()}. Classroom practice; these are not official ACCESS tests.</p>
    <ul class="sd-rows">
      ${m.tests.map((t) => html`<li class="sd-row"><a href="${t.url}">${t.title}</a><span>${t.bandLabel}, ${t.items} items</span><span class="sd-min">${t.minutes} min</span></li>`)}
    </ul>
  </section>`;
}

function placesSection(m) {
  return html`<section class="sd-band" aria-labelledby="sd-places">
    <h2 id="sd-places" class="sd-bandh">${marker.places()}</h2>
    <p>The More menu of the lab, group by group. Pages marked "password required" are behind the teacher password.</p>
    ${m.places.map(
      (g) => html`<h3>${g.title}</h3>
        <ul class="sd-places">
          ${g.items.map(
            (
              i,
            ) => html`<li><a href="${i.url}">${i.label}</a>${i.gated ? html` <strong class="sd-gate">(password required)</strong>` : ""}
            <span class="ig-url">${i.short}</span>${i.note ? html`<span class="sd-note">${i.note}</span>` : ""}</li>`,
          )}
        </ul>`,
    )}
  </section>`;
}

/** `pages` maps marker text to a page number (empty on the first pass). */
export function directoryBody(m, pages = {}) {
  const body = html`${cover(m)}${contents(m, pages)}${m.bands.map(bandSection)}${testsSection(m)}${placesSection(m)}`;
  return `<div class="ig sd">${toHtml(body)}</div>`;
}

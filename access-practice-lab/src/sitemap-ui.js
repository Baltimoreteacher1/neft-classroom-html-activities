// Site-map blocks shared by the home page and the teacher and family start pages. Both read src/sitemap.js, so the
// home, the start pages, the navigation and /explore always name the same sections and the same places.
import { SECTIONS, forAudience } from "./sitemap.js";
import { BASE, html, icon } from "./util.js";

const hrefOf = (d, band) =>
  d.href.startsWith("/")
    ? d.href
    : `${BASE}/${d.href}${d.href.includes("?") ? "&" : "?"}grades=${band}`;

/** One tile per learner section: where everything lives, in one glance. */
export function sectionTilesHTML(I, band, { id = "findYourWay" } = {}) {
  const shown = SECTIONS.filter((s) => s.id !== "help");
  return html`<section class="sm-tiles" aria-labelledby="${id}">
    <div class="sm-head">
      <h2 id="${id}">${I.T("Find your way", "Encuentra tu camino")}</h2>
      <a class="sm-all" href="${BASE}/explore?grades=${band}"
        >${I.T("Everything on the site", "Todo el sitio")} →</a
      >
    </div>
    <ul class="sm-tile-grid" role="list">
      ${shown.map(
        (s) =>
          html`<li>
            <a class="sm-tile sm-${s.id}" href="${BASE}/explore/${s.id}?grades=${band}">
              <span class="sm-tile-ico" aria-hidden="true">${icon(s.icon)}</span>
              <span class="sm-tile-title">${I.T(...s.title)}</span>
              <span class="sm-tile-text">${I.T(...s.lead)}</span>
            </a>
          </li>`,
      )}
    </ul>
  </section>`;
}

/** Everything one audience uses, grouped by section, with a link to the filtered directory. */
export function audienceMapHTML(I, band, audience, { id, title, lead, limit = 6 } = {}) {
  const mine = forAudience(audience, band).filter((d) => d.section !== "help");
  const groups = SECTIONS.map((s) => ({
    s,
    items: mine
      .filter((d) => d.section === s.id)
      .sort((a, b) => Number(Boolean(b.top)) - Number(Boolean(a.top))),
  })).filter((g) => g.items.length);
  return html`<section class="sm-audience" aria-labelledby="${id}">
    <div class="sm-head">
      <h2 id="${id}">${I.T(...title)}</h2>
      <a class="sm-all" href="${BASE}/explore?for=${audience}&grades=${band}"
        >${I.T(`See all ${mine.length}`, `Ver los ${mine.length}`)} →</a
      >
    </div>
    ${lead ? html`<p class="sm-lead">${I.T(...lead)}</p>` : ""}
    <div class="sm-groups">
      ${groups.map(
        ({ s, items }) =>
          html`<div class="sm-group">
            <h3>
              ${icon(s.icon)}<a href="${BASE}/explore/${s.id}?for=${audience}&grades=${band}"
                >${I.T(...s.title)}</a
              >
            </h3>
            <ul role="list">
              ${items.slice(0, limit).map(
                (d) =>
                  html`<li>
                    <a href="${hrefOf(d, band)}"
                      ><strong>${I.T(...d.title)}</strong><span>${I.T(...d.text)}</span></a
                    >
                  </li>`,
              )}
            </ul>
          </div>`,
      )}
    </div>
  </section>`;
}

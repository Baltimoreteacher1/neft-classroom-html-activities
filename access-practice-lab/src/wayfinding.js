// The section bar: one slim strip under the header on every page that belongs to a section, so a learner always sees
// where they are (section › skill) and the places next to it, and can move sideways without going back home.
// It reads src/sitemap.js, the same registry as the navigation and /explore, so every page names the same section
// everywhere. Hidden on the home page, inside focused test mode, inside the Guided Tour frame and in the K–3 band
// (which has its own picture-first home).
import { isEarlyBand } from "./bands.js";
import { SECTION_BY_ID, SKILLS, locate, siblings } from "./sitemap.js";
import { BASE, html, icon, raw } from "./util.js";

const HIDDEN_VIEWS = new Set([
  "home",
  "session-done",
  "early",
  "test",
  "assess",
  "explore",
  "play",
]);

export function sectionBarHTML(ctx, I) {
  const route = ctx.route || {};
  if (HIDDEN_VIEWS.has(route.view) || isEarlyBand(ctx.band)) return "";
  const here = locate(route);
  if (!here) return "";
  const section = SECTION_BY_ID[here.section];
  const band = ctx.band;
  const href = (d) =>
    d.href.startsWith("/")
      ? d.href
      : `${BASE}/${d.href}${d.href.includes("?") ? "&" : "?"}grades=${band}`;
  const skill = here.section === "practice" ? SKILLS.find((s) => s.id === here.skill) : null;
  const allHref = `${BASE}/explore/${section.id}?grades=${band}${skill ? `&skill=${skill.id}` : ""}`;
  const items = siblings(here, band);
  return html`<div class="sb-inner">
    <p class="sb-where">
      <a class="sb-section" href="${BASE}/explore/${section.id}?grades=${band}"
        >${icon(section.icon)}<span>${I.T(...section.title)}</span></a
      >
      ${skill ? html`<span class="sb-sep" aria-hidden="true">›</span><span class="sb-skill">${I.T(...skill.title)}</span>` : ""}
    </p>
    <ul class="sb-links" role="list">
      ${items.map(
        (d) =>
          html`<li>
            <a href="${href(d)}" ${d.id === here.id ? raw('aria-current="page"') : ""}
              >${I.T(...d.title)}</a
            >
          </li>`,
      )}
    </ul>
    <a class="sb-all" href="${allHref}"
      >${I.T("See all", "Ver todo")}<span aria-hidden="true"> →</span></a
    >
  </div>`;
}

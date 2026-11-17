// The section bar: one slim strip under the header on every page that belongs to a section, so a learner always sees
// where they are (section › skill) and the places next to it, and can move sideways without going back home.
// It reads src/sitemap.js, the same registry as the navigation and /explore, so every page names the same section
// everywhere. Hidden on the home page, inside focused test mode, inside a guided-experience frame and in the K–3 band
// (which has its own picture-first home).
import { BAND_INFO, isEarlyBand } from "./bands.js";
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

/** Pages that make sense for any grade band: switching grade keeps the learner on the same page. */
const GRADE_NEUTRAL_VIEWS = new Set([
  "home", "explore", "library", "passport", "family", "practice-together", "start", "site-guide", "book-studio",
  "access-prep", "twr", "growth", "class", "privacy", "accessibility", "search", "games", "stories", "vocabulary",
  "flashcards", "puzzles", "grammar", "reader", "learn", "tests", "mentor", "ladder", "path", "scaffold",
]);

/**
 * Where the header grade switch sends the learner. A page that is not tied to one band's content stays put (with the
 * new band in the URL); a band-specific page (an activity, a test, a world, a mission) goes to its section's hub for
 * the new band, so the switch never shows another band's activity or a dead end. Pure: no DOM, no storage.
 */
export function gradeSwitchTarget(route = {}, band, { canOpen = () => true } = {}) {
  const view = route.view || "home";
  const hub = (sectionId) => `${BASE}/explore/${sectionId}?grades=${band}`;
  if (view === "home" || view === "early") return `${BASE}/?grades=${band}`;
  const hubRoute = { view: "explore", grades: band };
  if (view === "explore" && route.id) return canOpen(hubRoute) ? hub(route.id) : `${BASE}/?grades=${band}`;
  if (GRADE_NEUTRAL_VIEWS.has(view) && !(route.id && view !== "explore") && canOpen({ ...route, grades: band }))
    return `${BASE}/${view === "explore" ? "explore" : view}${route.id ? `/${route.id}` : ""}?grades=${band}`;
  const here = locate(route);
  if (here && canOpen(hubRoute)) return hub(here.section);
  return `${BASE}/?grades=${band}`;
}

/** The header grade switch: one native select, so it works with a keyboard, a screen reader and a phone's picker. */
export function gradeSelectHTML(ctx, I) {
  const bands = ctx.bands || [];
  if (bands.length < 2) return "";
  // The bare home is the grade chooser: nothing is selected until the learner picks.
  const choosing = ctx.route?.view === "home" && !ctx.route?.grades;
  return html`<label class="grade-select"
    ><span class="grade-select-label">${I.T("Grade", "Grado")}</span
    ><select data-grade-select aria-label="${I.S("Change grade", "Cambiar de grado")}">
      ${choosing ? html`<option value="" selected disabled>${I.S("Choose", "Elige")}</option>` : ""}
      ${bands.map(
        (b) => html`<option value="${b}" ${!choosing && b === ctx.band ? raw("selected") : ""}>${BAND_INFO[b]?.short || b}</option>`,
      )}
    </select></label
  >`;
}

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

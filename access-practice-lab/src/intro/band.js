// The grade choice every teacher page shares: Kindergarten, Grade 1, Grades 2–3, Grades 4–5, Grades 6–8 (the lab
// home's own picks, from grade-bands.js). The choice is read from ?grades=, else what this device remembered, else the
// lab's current band, and is written back to the intro state so the tour, the Start overview and the Site Guide agree.
import { BAND_INFO, normalizeBand } from "../bands.js";
import { GRADE_PICKS } from "../grade-bands.js";
import { html, icon, ART } from "../util.js";
import { DOMAINS, tourActivities, tourActivity } from "./tour-bands.js";
import { loadIntro, updateIntro } from "./state.js";

export const TEACHER_PICKS = GRADE_PICKS;
export const pickById = (id) => GRADE_PICKS.find((p) => p.id === id) || null;

/** A ?grades= value (a picker id or a content band) as a picker id, or "". */
export const pickFromParam = (value) => {
  const band = normalizeBand(value);
  return band ? BAND_INFO[band].picker : "";
};

/** The teacher's grade choice for this render. `ctx` is the lab context (route, band). */
export function teacherPick(ctx) {
  const asked = pickFromParam(ctx.route?.grades);
  if (asked) return asked;
  const saved = loadIntro().band?.pick;
  if (pickById(saved)) return saved;
  return BAND_INFO[ctx.band]?.picker || "6-8";
}

export const savePick = (id) => updateIntro("band", () => ({ pick: id }));

/** "Grades 4–5" style name for a pick (English). */
export const pickName = (id) => pickById(id)?.name[0] || "";

/** The five grade buttons. `data-tb-pick` is handled by onBandClick; the choice is a toggle group, never a form. */
export function bandPickerHTML(pick, { label = "Which grades do you teach?", hint = "" } = {}) {
  return html`<div class="tb-picker" role="group" aria-labelledby="tbPickLabel">
    <p class="tb-picker-label" id="tbPickLabel">${label}</p>
    <div class="tb-picker-btns">
      ${GRADE_PICKS.map(
        (p) =>
          html`<button
            type="button"
            class="tb-pick"
            data-tb-pick="${p.id}"
            aria-pressed="${String(p.id === pick)}"
          >
            <span class="tb-pick-short">${p.short[0]}</span
            ><span class="tb-pick-name">${p.name[0]}</span>
          </button>`,
      )}
    </div>
    ${hint ? html`<p class="fine tb-picker-hint">${hint}</p>` : ""}
  </div>`;
}

/**
 * The four domain cards for a grade choice: the studio's picture, the activity, what students do, how long.
 * `action` renders the button area for one activity (the tour and the overview each decide what the card offers).
 */
export function domainCardsHTML(pick, action = () => "") {
  return html`<ul
    class="tb-domains"
    aria-label="${pickName(pick)}: one activity for each language domain"
  >
    ${tourActivities(pick).map(
      (a) =>
        html`<li class="tb-domain ${a.domain.cls}">
          <img src="${ART}/${a.domain.art}" alt="" width="160" height="100" loading="lazy" />
          <div class="tb-domain-body">
            <h3>
              <span class="in-ic" aria-hidden="true">${icon(a.domain.icon)}</span>${a.domain.name}
            </h3>
            <p class="tb-domain-title">
              <strong>${a.title}</strong><span class="fine">${a.level} · ${a.minutes} min</span>
            </p>
            <p>${a.students}</p>
            ${action(a)}
          </div>
        </li>`,
    )}
  </ul>`;
}

/**
 * Click on a grade button. Saves the choice, puts it in the address (so a reload or a shared link keeps it) and
 * re-renders in place, keeping focus on the pressed button. Returns true when the click was a grade button.
 */
export function onBandClick(e, ctx) {
  const btn = e.target.closest?.("[data-tb-pick]");
  if (!btn) return false;
  const id = btn.dataset.tbPick;
  if (!pickById(id)) return true;
  savePick(id);
  const url = new URL(location.href);
  url.searchParams.set("grades", id);
  history.replaceState({}, "", url.pathname + url.search + url.hash);
  ctx.rerender();
  return true;
}

export { DOMAINS, tourActivity, tourActivities };

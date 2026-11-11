// Small shared pieces of the introduction pages (teacher start, tour, exploration, featured lesson, presenter view).
import { BASE, html, icon } from "../util.js";
import { ACTIVITIES, ACTIVITY_BY_ID, PATHWAYS, ROUTES } from "./data.js";
import { previewHTML } from "./preview.js";
import { withReturn } from "./return-bar.js";

export const labHref = (route) => `${BASE}${route}`;
/** Link to an activity that offers a way back to `from` (see return-bar.js). */
export const activityHref = (activity, from) => withReturn(labHref(activity.route), from);

/** An activity opened in this tab: name, what students do, time, one button. */
export function activityCard(a, from, { cta = "Open activity", showUse = false, howTo = false } = {}) {
  return html`<article class="in-act pw-${a.pathway}">
    <h3><span class="in-ic" aria-hidden="true">${icon(a.icon)}</span>${a.name}</h3>
    <p class="in-where">${a.where} · ${a.time}</p>
    <p>${a.does}</p>
    ${showUse ? html`<p><strong>Classroom use:</strong> ${a.classroomUse}</p>` : ""}
    <p class="in-actions"><a class="btn" href="${activityHref(a, from)}">${cta}<span class="visually-hidden">: ${a.name}</span>${icon("arrow-right")}</a>${howTo ? html`<a class="btn ghost" href="${labHref(ROUTES.activities)}#act-${a.id}">Full how-to<span class="visually-hidden">: ${a.name}</span></a>` : ""}</p>
    ${previewHTML(a)}
  </article>`;
}

/** Both pathways with their two curated activities (speaking first). */
export function pathwaysHTML(from, opts) {
  return html`<div class="in-paths">
    ${PATHWAYS.map(
      (p) => html`<section class="in-path" aria-labelledby="path-${p.id}">
        <h2 id="path-${p.id}"><span class="in-ic" aria-hidden="true">${icon(p.icon)}</span>${p.name}</h2>
        <p class="fine">${p.blurb}</p>
        ${ACTIVITIES.filter((a) => a.pathway === p.id).map((a) => activityCard(a, from, opts))}
      </section>`,
    )}
  </div>`;
}

export const findActivity = (id) => ACTIVITY_BY_ID[id];

/** "What students can use" lists: built-in features and teaching moves are labelled apart. */
export function supportsHTML(a) {
  return html`<div class="in-supports">
    <h4>Built into the site</h4>
    <ul>${a.builtIn.map((s) => html`<li>${s}</li>`)}</ul>
    <h4>Teaching moves you add</h4>
    <ul>${a.moves.map((s) => html`<li>${s}</li>`)}</ul>
    <p class="fine">${a.limits}</p>
  </div>`;
}

/** Copies text with a visible, announced result (clipboard may be blocked, so say what to do). */
export async function copyWithNote(text, noteEl) {
  let ok = false;
  try {
    await navigator.clipboard.writeText(text);
    ok = true;
  } catch {}
  if (noteEl) noteEl.textContent = ok ? "Copied. Paste it into your own document." : "Copying was blocked. Select the text and copy it, or use Print.";
  return ok;
}

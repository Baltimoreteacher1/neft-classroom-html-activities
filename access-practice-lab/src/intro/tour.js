// Guided tour (/start/tour): five teacher-controlled stops built on real activity use. The page IS the tour (no pop-ups):
// one purpose sentence, one action, one verified activity link, a "Notice this" point, and a "Your turn" where the teacher
// produces or chooses something. Place and notes are saved on this device only, so the tour resumes where it stopped.
import { html, icon } from "../util.js";
import { FEATURED_LESSON, TOUR_STOPS, ROUTES, PATHWAYS, ACTIVITIES } from "./data.js";
import { clearIntro, loadIntro, SAVED_NOTE, updateIntro } from "./state.js";
import { TOUR_COPY } from "./tour-data.js";
import { activityHref, findActivity, introCrumbs, labHref } from "./ui.js";
import { withReturn } from "./return-bar.js";

const LAST = TOUR_STOPS.length - 1;
const tourHref = (n) => `${labHref(ROUTES.tour)}?stop=${n + 1}`;
let confirmClear = false;

const savedTour = () => loadIntro().tour || {};
const clampStop = (n) => Math.min(LAST, Math.max(0, Number.isInteger(n) ? n : 0));

function currentStop(route) {
  const asked = Number.parseInt(route.stop, 10);
  return clampStop(Number.isFinite(asked) ? asked - 1 : savedTour().stop);
}

function fieldHTML(f, notes) {
  const val = notes[f.id] ?? "";
  if (f.type === "radio")
    return html`<fieldset class="in-field">
      <legend>${f.label}</legend>
      ${f.options.map(
        ([v, label]) => html`<label class="in-opt"
          ><input type="radio" name="tour-${f.id}" value="${v}" data-tour-field="${f.id}" ${val === v ? "checked" : ""} /><span>${label}</span></label
        >`,
      )}
    </fieldset>`;
  const id = `tour-${f.id}`;
  return html`<div class="in-field">
    <label for="${id}">${f.label}</label>
    ${f.type === "area"
      ? html`<textarea id="${id}" rows="3" data-tour-field="${f.id}">${val}</textarea>`
      : html`<input id="${id}" type="text" data-tour-field="${f.id}" value="${val}" />`}
    ${f.sample ? html`<button type="button" class="btn ghost small" data-tour-sample="${f.id}">Use a sample sentence</button>` : ""}
  </div>`;
}

function viewHTML(stop) {
  if (stop.view === "pathways")
    return html`<div class="in-mini-paths">
      ${PATHWAYS.map(
        (p) => html`<section aria-labelledby="mp-${p.id}">
          <h3 id="mp-${p.id}"><span class="in-ic" aria-hidden="true">${icon(p.icon)}</span>${p.name}</h3>
          <ul>
            ${ACTIVITIES.filter((a) => a.pathway === p.id).map((a) => html`<li><strong>${a.name}</strong> <span class="fine">· ${a.time}</span></li>`)}
          </ul>
        </section>`,
      )}
    </div>`;
  if (stop.view === "lesson-steps")
    return html`<ol class="in-seq" aria-label="Lesson sequence">
      ${FEATURED_LESSON.steps.map((s) => html`<li><strong>${s.name}</strong><span>${s.minutes} min</span></li>`)}
    </ol>`;
  return "";
}

function openLink(stop, n, copy, notes) {
  if (copy.activity) {
    const a = findActivity(copy.activity);
    return { href: activityHref(a, "tour"), label: `Open ${a.name}` };
  }
  if (copy.id === "tomorrow") return { href: labHref(ROUTES.guide), label: copy.routeLabel };
  if (copy.route) return { href: labHref(copy.route), label: copy.routeLabel };
  return null;
}

function summaryHTML(notes) {
  const pick = findActivity(notes.pick);
  const rows = [
    ["Need", { speaking: "Speaking", writing: "Writing", both: "Speaking and writing" }[notes.need]],
    ["Activity for tomorrow", pick?.name],
    ["Class or group", notes.group],
    ["When", notes.when],
  ].filter(([, v]) => v);
  if (!rows.length) return "";
  return html`<section class="in-summary" aria-labelledby="tourSummary">
    <h3 id="tourSummary">Your tour notes</h3>
    <dl>${rows.map(([k, v]) => html`<dt>${k}</dt><dd>${v}</dd>`)}</dl>
    ${pick ? html`<a class="btn" href="${activityHref(pick, "tour")}">Open ${pick.name}${icon("arrow-right")}</a>` : ""}
  </section>`;
}

export async function render(ctx) {
  const n = currentStop(ctx.route);
  const copy = TOUR_COPY[n];
  const meta = TOUR_STOPS[n];
  const tour = updateIntro("tour", (t) => ({ ...t, stop: n }));
  const notes = tour.notes || {};
  const link = openLink(copy, n, copy, notes);
  const resumed = !ctx.route.stop && n > 0;
  return {
    title: `Guided Tour: ${meta.name}`,
    html: html`${introCrumbs("Guided Tour")}
      <article class="in-page in-tour" aria-labelledby="introTitle">
        <header class="in-head">
          <p class="eyebrow">Guided Tour · Step ${n + 1} of ${TOUR_STOPS.length}</p>
          <h1 id="introTitle" tabindex="-1"><span class="in-ic" aria-hidden="true">${icon(meta.icon)}</span>${meta.name}</h1>
          <p class="in-lead">${copy.purpose}</p>
          ${resumed ? html`<p class="in-note">You are back where you stopped. <a href="${tourHref(0)}">Start from Step 1</a>.</p>` : ""}
        </header>
        <nav class="in-steps" aria-label="Tour steps">
          <ol>
            ${TOUR_STOPS.map(
              (s, i) => html`<li ${i === n ? html`aria-current="step"` : ""} class="${tour.tried?.[s.id] ? "is-tried" : ""}">
                <a href="${tourHref(i)}"><span class="in-num">${i + 1}</span><span class="in-step-name">${s.name}</span>${tour.tried?.[s.id] ? html`<span class="visually-hidden"> (tried)</span>` : ""}</a>
              </li>`,
            )}
          </ol>
        </nav>
        <section class="in-panel" aria-labelledby="tourDo">
          <h2 id="tourDo">Do this</h2>
          <p class="in-action">${copy.action}</p>
          ${viewHTML(copy)}
          ${link ? html`<p><a class="btn btn-primary btn-big" href="${link.href}">${link.label}${icon("arrow-right")}</a></p><p class="fine">It opens in this tab. Use the bar at the bottom of that page, or your browser’s Back button, to return to Step ${n + 1}.</p>` : ""}
        </section>
        <section class="in-panel in-notice" aria-labelledby="tourNotice">
          <h2 id="tourNotice">Notice this</h2>
          <p>${copy.notice}</p>
        </section>
        <section class="in-panel" aria-labelledby="tourTurn">
          <h2 id="tourTurn">Your turn</h2>
          ${copy.fields.map((f) => fieldHTML(f, notes))}
          ${copy.tried ? html`<label class="in-opt in-tried"><input type="checkbox" data-tour-tried="${copy.id}" ${tour.tried?.[copy.id] ? "checked" : ""} /><span>I tried this</span></label>` : ""}
          ${n === LAST ? summaryHTML(notes) : ""}
        </section>
        <nav class="in-nav" aria-label="Tour controls">
          ${n > 0 ? html`<a class="btn" href="${tourHref(n - 1)}">${icon("arrow-left")}Back</a>` : html`<span></span>`}
          <a class="btn ghost" href="${labHref(ROUTES.start)}">Exit</a>
          ${n < LAST ? html`<a class="btn btn-primary" href="${tourHref(n + 1)}">Next: ${TOUR_STOPS[n + 1].name}${icon("arrow-right")}</a>` : html`<a class="btn btn-primary" href="${labHref(ROUTES.start)}" data-tour-finish>Finish the tour${icon("check")}</a>`}
        </nav>
        <footer class="in-foot">
          <p class="fine">${SAVED_NOTE}</p>
          ${confirmClear
            ? html`<p role="alert" class="fine">This clears your tour place and notes on this device.</p><button type="button" class="btn small" data-tour-clear="yes">Yes, clear my tour</button> <button type="button" class="btn ghost small" data-tour-clear="no">Keep it</button>`
            : html`<button type="button" class="btn ghost small" data-tour-clear="ask">Start the tour over</button>`}
        </footer>
      </article>`,
  };
}

const saveNote = (id, value) =>
  updateIntro("tour", (t) => ({ ...t, notes: { ...(t.notes || {}), [id]: value } }));

export function onInput(e) {
  const el = e.target.closest?.("[data-tour-field]");
  if (el && el.type !== "radio") saveNote(el.dataset.tourField, el.value);
}

export function onChange(e) {
  const el = e.target.closest?.("[data-tour-field], [data-tour-tried]");
  if (!el) return;
  if (el.dataset.tourTried)
    updateIntro("tour", (t) => ({ ...t, tried: { ...(t.tried || {}), [el.dataset.tourTried]: el.checked } }));
  else saveNote(el.dataset.tourField, el.value);
}

export function onClick(e, ctx) {
  const sample = e.target.closest?.("[data-tour-sample]");
  if (sample) {
    const f = TOUR_COPY.flatMap((c) => c.fields).find((x) => x.id === sample.dataset.tourSample);
    const box = document.getElementById(`tour-${f.id}`);
    box.value = f.sample;
    saveNote(f.id, f.sample);
    box.focus();
    return true;
  }
  const clear = e.target.closest?.("[data-tour-clear]");
  if (clear) {
    const mode = clear.dataset.tourClear;
    confirmClear = mode === "ask";
    if (mode === "yes") {
      clearIntro("tour");
      ctx.navigate(tourHref(0), { replace: true });
    } else ctx.rerender();
    return true;
  }
  return false;
}

export const unmount = () => {
  confirmClear = false;
};

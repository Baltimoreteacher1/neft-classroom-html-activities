// Guided Tour (/start/tour): the teacher chooses the grades they teach, then tries one real activity in each language
// domain (Listening, Speaking, Reading, Writing) inside a live panel beside the directions, and ends with a plan for
// one class. Mr. Neft, the guide, speaks on every step and answers questions. Place, ticks and notes are saved on
// this device only (state.js), so the tour resumes where it stopped.
import { BASE, html, icon } from "../util.js";
import { DOWNLOADS, FEATURED_LESSON, ROUTES, TOUR_STOPS, absUrl } from "./data.js";
import { clearIntro, loadIntro, SAVED_NOTE, updateIntro } from "./state.js";
import { bandPickerHTML, domainCardsHTML, onBandClick, pickName, teacherPick } from "./band.js";
import { bindGuide, guideHTML } from "./guide.js";
import { BAND_TOUR, DOMAINS, tourActivities, tourActivity, tourRoute } from "./tour-bands.js";
import {
  checklistHTML,
  frameNode,
  noticeHTML,
  stageHTML,
  stepStripHTML,
  tourHref,
  yourTurnHTML,
} from "./tour-ui.js";
import { teacherBand } from "./shell.js";
import { copyWithNote, labHref } from "./ui.js";
import { withReturn } from "./return-bar.js";

const LAST = TOUR_STOPS.length - 1;
const DOMAIN_STOP = Object.fromEntries(
  DOMAINS.map((d) => [d.id, TOUR_STOPS.findIndex((s) => s.id === d.id)]),
);
let confirmClear = false;

const savedTour = () => loadIntro().tour || {};
const clampStop = (n) => Math.min(LAST, Math.max(0, Number.isInteger(n) ? n : 0));
const tickKey = (pick, domain) => `${pick}:${domain}`;
const ticksFor = (tour, pick, domain) => {
  const t = tour.ticks?.[tickKey(pick, domain)];
  return [0, 1, 2].map((i) => Boolean(t?.[i]));
};
const domainDone = (tour, pick, domain) => ticksFor(tour, pick, domain).every(Boolean);

function currentStop(route) {
  const asked = Number.parseInt(route.stop, 10);
  return clampStop(Number.isFinite(asked) ? asked - 1 : savedTour().stop);
}

/** Step 1: the grade choice, the four activities it will use, and Mr. Neft's welcome. */
function startHTML(pick) {
  const band = BAND_TOUR[pick];
  return html`<div class="tr-start">
    ${guideHTML({
      say: html`Hi, I’m Mr. Neft. Choose the grades you teach and I’ll walk you through one real
      activity in each language domain: listening, speaking, reading and writing. You’ll try each
      one right here, as a student would. It takes about 20 minutes.`,
      chips: ["time", "what", "account", "scored"],
      context: { page: "tour", step: TOUR_STOPS[0].name, pick },
    })}
    <section class="tr-card tr-choose" aria-labelledby="trChooseTitle">
      <h2 id="trChooseTitle" class="visually-hidden">Choose your grades</h2>
      ${bandPickerHTML(pick, { label: "Which grades do you teach?", hint: "You can switch at any time. The tour changes to match." })}
      ${band.adult ? html`<p class="tr-adult">${icon("families")}<span>${band.adult}</span></p>` : ""}
      <h3 class="tr-sub">Your four activities for ${pickName(pick)}</h3>
      ${domainCardsHTML(
        pick,
        (a) =>
          html`<a class="btn small" href="${tourHref(DOMAIN_STOP[a.domain.id], pick)}"
            >Go to ${a.domain.name}<span class="visually-hidden">: ${a.title}</span
            >${icon("arrow-right")}</a
          >`,
      )}
    </section>
  </div>`;
}

/** Steps 2–5: directions and checklist on the left, the live activity on the right. */
function domainHTML(pick, domainId, tour) {
  const a = tourActivity(pick, domainId);
  const notes = tour.notes || {};
  return html`<div class="tr-work ${a.domain.cls}">
    <div class="tr-side">
      ${checklistHTML(a, ticksFor(tour, pick, domainId))}
      ${guideHTML({
        say: html`${a.domain.purpose} In <strong>${a.title}</strong>,
          ${a.students.charAt(0).toLowerCase()}${a.students.slice(1)} Press “Try it here as a student” and
          tick each step as you go.`,
        chips: ["students", "notice", "use", domainId === "speaking" ? "mic" : "sound"],
        context: { page: "tour", step: a.domain.name, pick, domain: domainId },
      })}
      ${noticeHTML(a)} ${yourTurnHTML(a, notes)}
    </div>
    <div class="tr-main">${stageHTML(a)}</div>
  </div>`;
}

const planText = (pick, notes) => {
  const a = tourActivity(pick, notes.pick);
  return [
    "My plan from The Language Page tour",
    `Grades: ${pickName(pick)}`,
    a ? `Activity: ${a.title} (${a.domain.name}, about ${a.minutes} min)` : "",
    a ? `Student link: ${absUrl(tourRoute(a))}` : "",
    notes.group ? `Class or group: ${notes.group}` : "",
    notes.when ? `When: ${notes.when}` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

/** Step 6: one activity, one class, one time, and where to go next. */
function planHTML(pick, tour) {
  const notes = tour.notes || {};
  const chosen = tourActivity(pick, notes.pick);
  return html`<div class="tr-plan">
    <section class="tr-card" aria-labelledby="trPlanTitle">
      <h2 id="trPlanTitle">${icon("calendar")}Plan one class</h2>
      <fieldset class="in-field tr-plan-pick">
        <legend>The activity I will use first</legend>
        ${tourActivities(pick).map(
          (a) =>
            html`<label class="in-opt ${a.domain.cls}"
              ><input
                type="radio"
                name="tour-pick"
                value="${a.domain.id}"
                data-tour-field="pick"
                data-tr-rerender
                ${notes.pick === a.domain.id ? "checked" : ""}
              /><span
                ><strong>${a.title}</strong><small>${a.domain.name} · ${a.minutes} min</small></span
              ></label
            >`,
        )}
      </fieldset>
      <div class="tr-plan-fields">
        <div class="in-field">
          <label for="tour-group">My class or group</label
          ><input
            id="tour-group"
            type="text"
            data-tour-field="group"
            value="${notes.group || ""}"
          />
        </div>
        <div class="in-field">
          <label for="tour-when">When I will try it</label
          ><input id="tour-when" type="text" data-tour-field="when" value="${notes.when || ""}" />
        </div>
      </div>
    </section>
    <section
      class="tr-card tr-plan-card ${chosen ? chosen.domain.cls : ""}"
      aria-labelledby="trPlanCard"
    >
      <h2 id="trPlanCard">Your plan</h2>
      ${
        chosen
          ? html`<p class="tr-plan-act">
                <span class="in-ic" aria-hidden="true">${icon(chosen.domain.icon)}</span
                ><span
                  ><strong>${chosen.title}</strong
                  ><small
                    >${chosen.domain.name} · ${pickName(pick)} · about ${chosen.minutes} min</small
                  ></span
                >
              </p>
              <p>${chosen.use}</p>
              <p class="in-actions">
                <a
                  class="btn btn-primary"
                  href="${withReturn(`${BASE}${tourRoute(chosen)}`, "tour")}"
                  >Open it${icon("arrow-right")}</a
                >
                <button
                  type="button"
                  class="btn"
                  data-tr-copy="link"
                  data-copy="${absUrl(tourRoute(chosen))}"
                >
                  ${icon("copy")}Copy student link
                </button>
                <button type="button" class="btn ghost" data-tr-copy="plan">
                  ${icon("copy")}Copy my plan
                </button>
              </p>
              <p class="fine" data-tr-copy-note aria-live="polite"></p>`
          : html`<p class="fine">
              Choose an activity to see your plan, a student link and a copy button.
            </p>`
      }
    </section>
    <section class="tr-card tr-next" aria-labelledby="trNextTitle">
      <h2 id="trNextTitle">Keep going</h2>
      <ul class="tr-next-list">
        <li>
          <a href="${labHref(ROUTES.guide)}"
            >${icon("print")}<span
              ><strong>Quick Guide</strong><small>Two pages to print or keep</small></span
            ></a
          >
        </li>
        <li>
          <a href="${labHref(ROUTES.activities)}"
            >${icon("library")}<span
              ><strong>Activity Guide</strong><small>Every step of each activity</small></span
            ></a
          >
        </li>
        <li>
          <a href="${labHref(ROUTES.siteGuide)}?for=teacher"
            >${icon("help")}<span
              ><strong>Site Guide</strong><small>The whole site, with search</small></span
            ></a
          >
        </li>
        <li>
          <a href="${labHref(ROUTES.together)}?grades=${pick}"
            >${icon("families")}<span
              ><strong>Family page</strong
              ><small>Send families one link, English and Spanish</small></span
            ></a
          >
        </li>
        ${
          pick === "6-8"
            ? html`<li>
                <a href="${labHref(ROUTES.lesson)}"
                  >${icon("conversation")}<span
                    ><strong>${FEATURED_LESSON.title}</strong
                    ><small>A 10-minute speak-then-write lesson</small></span
                  ></a
                >
              </li>`
            : ""
        }
        <li>
          <a href="${DOWNLOADS.activityGuide.pdf}"
            >${icon("download")}<span
              ><strong>Activity Guide (PDF)</strong><small>One activity per page</small></span
            ></a
          >
        </li>
      </ul>
    </section>
    ${guideHTML({
      say: "Start small: one activity, one class, one support. Copy the student link into your class page, and send families the family page so they can practice at home.",
      chips: ["share", "families", "language", "saved"],
      context: { page: "tour", step: TOUR_STOPS[LAST].name, pick },
    })}
  </div>`;
}

export async function render(ctx) {
  const n = currentStop(ctx.route);
  const pick = teacherPick(ctx);
  const meta = TOUR_STOPS[n];
  const tour = updateIntro("tour", (t) => ({ ...t, stop: n, pick }));
  const resumed = !ctx.route.stop && n > 0;
  const body =
    n === 0 ? startHTML(pick) : n === LAST ? planHTML(pick, tour) : domainHTML(pick, meta.id, tour);
  return {
    title: `Guided Tour: ${meta.name}`,
    html: html`<article class="in-page in-tour tr-page" aria-labelledby="introTitle">
      ${teacherBand({
        active: "tour",
        eyebrow: `Guided Tour · ${pickName(pick)}`,
        title: n === 0 ? "Take the Guided Tour" : meta.name,
        lead:
          n === 0
            ? "Try the site the way your students will, one language domain at a time."
            : TOUR_STOPS[n].id === "tomorrow"
              ? "Leave with one activity, one class and a link to share."
              : `Step ${n + 1} of ${TOUR_STOPS.length}. ${DOMAINS.find((d) => d.id === meta.id)?.studio || ""}`,
        meta: html`${n > 0 ? html`<p class="ts-note"><a href="${tourHref(0, pick)}">${pickName(pick)} · change grades</a></p>` : ""}${resumed ? html`<p class="ts-note">You are back where you stopped. <a href="${tourHref(0, pick)}">Start from Step 1</a>.</p>` : ""}`,
      })}
      ${stepStripHTML({ current: n, pick, doneFor: (s) => (DOMAIN_STOP[s.id] ? domainDone(tour, pick, s.id) : false) })}
      ${body}
      <nav class="in-nav ts-actions tr-actions" aria-label="Tour controls">
        ${n > 0 ? html`<a class="btn" href="${tourHref(n - 1, pick)}">${icon("arrow-left")}Back</a>` : html`<a class="btn ghost" href="${labHref(ROUTES.start)}">Exit</a>`}
        ${n > 0 ? html`<a class="btn ghost" href="${labHref(ROUTES.start)}">Exit</a>` : ""}
        ${
          n < LAST
            ? html`<a class="btn btn-primary" href="${tourHref(n + 1, pick)}"
                >${n === 0 ? "Start with Listening" : `Next: ${TOUR_STOPS[n + 1].name}`}${icon("arrow-right")}</a
              >`
            : html`<a
                class="btn btn-primary"
                href="${labHref(ROUTES.start)}?grades=${pick}"
                data-tour-finish
                >Finish the tour${icon("check")}</a
              >`
        }
      </nav>
      <footer class="in-foot">
        <p class="fine">${SAVED_NOTE}</p>
        ${
          confirmClear
            ? html`<p role="alert" class="fine">
                  This clears your tour place, ticks and notes on this device.
                </p>
                <button type="button" class="btn small" data-tour-clear="yes">
                  Yes, clear my tour
                </button>
                <button type="button" class="btn ghost small" data-tour-clear="no">Keep it</button>`
            : html`<button type="button" class="btn ghost small" data-tour-clear="ask">
                Start the tour over
              </button>`
        }
      </footer>
    </article>`,
  };
}

export const mount = () => bindGuide();

const saveNote = (id, value) =>
  updateIntro("tour", (t) => ({ ...t, notes: { ...(t.notes || {}), [id]: value } }));

export function onInput(e) {
  const el = e.target.closest?.("[data-tour-field]");
  if (el && el.type !== "radio") saveNote(el.dataset.tourField, el.value);
}

/** A tick updates the count and the step strip in place, so the live activity beside it keeps its state. */
function onTick(el, ctx) {
  const n = currentStop(ctx.route);
  const pick = teacherPick(ctx);
  const domain = TOUR_STOPS[n].id;
  const key = tickKey(pick, domain);
  const tour = updateIntro("tour", (t) => {
    const ticks = { ...(t.ticks || {}) };
    const row = [...(ticks[key] || [false, false, false])];
    row[Number(el.dataset.trTick)] = el.checked;
    ticks[key] = row;
    const done = row.every(Boolean);
    return { ...t, ticks, tried: { ...(t.tried || {}), [domain]: done } };
  });
  const row = ticksFor(tour, pick, domain);
  const count = row.filter(Boolean).length;
  const out = document.querySelector("[data-tr-count]");
  if (out)
    out.textContent =
      count === row.length ? "All three done. Nice work." : `${count} of ${row.length} done`;
  const li = document.querySelector(`[data-tr-stop="${domain}"]`);
  li?.classList.toggle("is-done", count === row.length);
  const doneText = li?.querySelector("[data-tr-done-text]");
  if (doneText) doneText.textContent = count === row.length ? " (done)" : "";
}

export function onChange(e, ctx) {
  const tick = e.target.closest?.("[data-tr-tick]");
  if (tick) return onTick(tick, ctx);
  const el = e.target.closest?.("[data-tour-field]");
  if (!el) return;
  saveNote(el.dataset.tourField, el.value);
  if (el.hasAttribute("data-tr-rerender")) ctx.rerender();
}

export function onClick(e, ctx) {
  if (onBandClick(e, ctx)) return true;
  const launch = e.target.closest?.("[data-tr-launch]");
  if (launch) {
    const stage = launch.closest("[data-tr-stage]");
    const frame = frameNode(stage);
    stage.replaceChildren(frame);
    stage.classList.add("is-live");
    const restart = document.querySelector("[data-tr-restart]");
    if (restart) restart.hidden = false;
    frame.focus();
    return true;
  }
  if (e.target.closest?.("[data-tr-restart]")) {
    const frame = document.querySelector(".tr-frame");
    if (frame) frame.src = frame.src;
    return true;
  }
  const copy = e.target.closest?.("[data-tr-copy]");
  if (copy) {
    const pick = teacherPick(ctx);
    const text =
      copy.dataset.trCopy === "plan" ? planText(pick, savedTour().notes || {}) : copy.dataset.copy;
    copyWithNote(text, document.querySelector("[data-tr-copy-note]"));
    return true;
  }
  const clear = e.target.closest?.("[data-tour-clear]");
  if (clear) {
    const mode = clear.dataset.tourClear;
    confirmClear = mode === "ask";
    if (mode === "yes") {
      clearIntro("tour");
      ctx.navigate(tourHref(0, teacherPick(ctx)), { replace: true });
    } else ctx.rerender();
    return true;
  }
  return false;
}

export const unmount = () => {
  confirmClear = false;
};

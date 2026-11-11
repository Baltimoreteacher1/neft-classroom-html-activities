// Guided Tour (/start/tour): the teacher chooses the grades they teach, then tries one real activity in each language
// domain (Listening, Speaking, Reading, Writing) inside a live panel beside the directions, and ends with a plan for
// one class. Mr. Neft, the guide, speaks on every step and answers questions. Place, ticks and notes are saved on
// this device only (state.js), so the tour resumes where it stopped.
import { html, icon } from "../util.js";
import { ROUTES, TOUR_STOPS } from "./data.js";
import { clearIntro, loadIntro, SAVED_NOTE, updateIntro } from "./state.js";
import { bandPickerHTML, domainCardsHTML, onBandClick, pickName, teacherPick } from "./band.js";
import { bindGuide, guideHTML } from "./guide.js";
import { BAND_TOUR, DOMAINS, tourActivity } from "./tour-bands.js";
import { watchFrame } from "./tour-autotick.js";
import { onPlanClick, planHTML, planText, refreshPlanCard } from "./tour-plan.js";
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
        chips: ["students", "notice", "use", domainId === "speaking" ? "norecord" : "sound"],
        context: { page: "tour", step: a.domain.name, pick, domain: domainId },
      })}
      ${noticeHTML(a)} ${yourTurnHTML(a, notes)}
    </div>
    <div class="tr-main">${stageHTML(a)}</div>
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

export function onInput(e, ctx) {
  const el = e.target.closest?.("[data-tour-field]");
  if (!el || el.type === "radio") return;
  const tour = saveNote(el.dataset.tourField, el.value);
  refreshPlanCard(teacherPick(ctx), tour.notes || {});
}

/**
 * Set one checklist step and update the count and the step strip in place, so the live activity beside it keeps its
 * state. `auto` is a tick the tour made from an action inside the activity: it only turns a step on, and says which.
 */
function setTick(pick, domain, i, checked, { auto = false } = {}) {
  const key = tickKey(pick, domain);
  if (auto && ticksFor(savedTour(), pick, domain)[i]) return;
  const tour = updateIntro("tour", (t) => {
    const ticks = { ...(t.ticks || {}) };
    const row = [...(ticks[key] || [false, false, false])];
    row[i] = checked;
    ticks[key] = row;
    const done = row.every(Boolean);
    return { ...t, ticks, tried: { ...(t.tried || {}), [domain]: done } };
  });
  const row = ticksFor(tour, pick, domain);
  const count = row.filter(Boolean).length;
  const box = document.querySelector(`[data-tr-tick="${i}"]`);
  if (box) box.checked = checked;
  const out = document.querySelector("[data-tr-count]");
  if (out)
    out.textContent =
      count === row.length
        ? "All three done. Nice work."
        : `${auto ? `Step ${i + 1} ticked for you. ` : ""}${count} of ${row.length} done`;
  const li = document.querySelector(`[data-tr-stop="${domain}"]`);
  li?.classList.toggle("is-done", count === row.length);
  const doneText = li?.querySelector("[data-tr-done-text]");
  if (doneText) doneText.textContent = count === row.length ? " (done)" : "";
}

function onTick(el, ctx) {
  const domain = TOUR_STOPS[currentStop(ctx.route)].id;
  setTick(teacherPick(ctx), domain, Number(el.dataset.trTick), el.checked);
}

/** Open the live activity in place of the poster and tick steps as the teacher does them inside it. */
function launchFrame(launch, ctx) {
  const stage = launch.closest("[data-tr-stage]");
  const pick = teacherPick(ctx);
  const domain = TOUR_STOPS[currentStop(ctx.route)].id;
  const frame = frameNode(stage);
  watchFrame(frame, tourActivity(pick, domain), (i) =>
    setTick(pick, domain, i, true, { auto: true }),
  );
  stage.replaceChildren(frame);
  stage.classList.add("is-live");
  const restart = document.querySelector("[data-tr-restart]");
  if (restart) restart.hidden = false;
  frame.focus();
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
    launchFrame(launch, ctx);
    return true;
  }
  if (onPlanClick(e)) return true;
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

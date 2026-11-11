// Markup pieces of the Guided Tour (/start/tour): the step strip, the live activity stage, the try-it checklist and
// the "Your turn" fields. Pure markup from data; tour.js decides what goes where and handles the events.
import { ART, BASE, html, icon } from "../util.js";
import { TOUR_STOPS } from "./data.js";
import { withReturn } from "./return-bar.js";
import { DOMAIN_BY_ID, tourRoute } from "./tour-bands.js";

/** Lab URL of a tour step for a grade choice (`n` is 0-based). */
export const tourHref = (n, pick) =>
  `${BASE}/start/tour?grades=${encodeURIComponent(pick)}&stop=${n + 1}`;

/** The six steps across the top: number, name, done mark; domain steps carry their domain colour. */
export function stepStripHTML({ current, pick, doneFor }) {
  return html`<nav class="tr-steps" aria-label="Tour steps">
    <ol>
      ${TOUR_STOPS.map((s, i) => {
        const done = doneFor(s);
        const domain = DOMAIN_BY_ID[s.id];
        return html`<li
          class="${domain ? domain.cls : "tr-plain"}${done ? " is-done" : ""}"
          data-tr-stop="${s.id}"
          ${i === current ? html`aria-current="step"` : ""}
        >
          <a href="${tourHref(i, pick)}">
            <span class="tr-step-mark" aria-hidden="true"
              >${done && i !== current ? icon("check") : icon(s.icon)}</span
            >
            <span class="tr-step-name"><small>Step ${i + 1}</small>${s.name}</span>
            <span class="visually-hidden" data-tr-done-text>${done ? " (done)" : ""}</span>
          </a>
        </li>`;
      })}
    </ol>
  </nav>`;
}

/** The live activity: a picture and a start button until the teacher opens it, then the real page in a frame. */
export function stageHTML(a) {
  const full = withReturn(`${BASE}${tourRoute(a)}`, "tour");
  return html`<section class="tr-stage ${a.domain.cls}" aria-labelledby="trStageTitle">
    <header class="tr-stage-bar">
      <h2 id="trStageTitle">
        <span class="in-ic" aria-hidden="true">${icon(a.domain.icon)}</span
        ><span><small>${a.domain.name} · ${a.level} · ${a.minutes} min</small>${a.title}</span>
      </h2>
      <div class="tr-stage-tools">
        <button type="button" class="btn ghost small" data-tr-restart hidden>
          ${icon("retry")}Start over
        </button>
        <a class="btn ghost small" href="${full}">${icon("external")}Open full screen</a>
      </div>
    </header>
    <div
      class="tr-stage-body"
      data-tr-stage
      data-src="${BASE}${tourRoute(a, { frame: "1" })}"
      data-title="Live activity: ${a.title}"
    >
      <div class="tr-poster">
        <img src="${ART}/${a.domain.art}" alt="" width="320" height="200" />
        <p>${a.students}</p>
        <button type="button" class="btn btn-primary btn-big" data-tr-launch>
          ${icon("play")}Try it here as a student
        </button>
        <p class="fine">
          The real activity opens inside this panel, so you keep your place in the tour.
        </p>
      </div>
    </div>
  </section>`;
}

/** The frame that replaces the poster (built in place, so nothing else on the page re-renders). */
export function frameNode(stage) {
  const frame = document.createElement("iframe");
  frame.className = "tr-frame";
  frame.src = stage.dataset.src;
  frame.title = stage.dataset.title;
  frame.allow = "microphone; autoplay";
  frame.setAttribute("loading", "eager");
  return frame;
}

/** The three try-it steps as a checklist the teacher ticks while working in the frame. */
export function checklistHTML(a, ticks) {
  const done = ticks.filter(Boolean).length;
  return html`<section class="tr-card tr-do" aria-labelledby="trDoTitle">
    <h2 id="trDoTitle">Try it as a learner</h2>
    <ol class="tr-check">
      ${a.steps.map(
        (s, i) =>
          html`<li>
            <label
              ><input type="checkbox" data-tr-tick="${i}" ${ticks[i] ? "checked" : ""} /><span
                class="tr-check-n"
                aria-hidden="true"
                >${i + 1}</span
              ><span>${s}</span></label
            >
          </li>`,
      )}
    </ol>
    <p class="tr-check-count" data-tr-count aria-live="polite">
      ${done === a.steps.length ? "All three done. Nice work." : `${done} of ${a.steps.length} done`}
    </p>
  </section>`;
}

export function noticeHTML(a) {
  return html`<section class="tr-card tr-notice" aria-labelledby="trNoticeTitle">
    <h2 id="trNoticeTitle">${icon("bulb")}Notice this</h2>
    <p>${a.notice}</p>
    <p class="tr-use"><strong>In your classroom:</strong> ${a.use}</p>
  </section>`;
}

/** "Your turn": the support the teacher tried (radio) and one optional line about using it. */
export function yourTurnHTML(a, notes) {
  const name = `${a.domain.id}-support`;
  const useId = `${a.domain.id}-use`;
  return html`<section class="tr-card" aria-labelledby="trTurnTitle">
    <h2 id="trTurnTitle">${icon("writing")}Your turn</h2>
    <fieldset class="in-field">
      <legend>The support I tried</legend>
      ${a.supports.map(
        ([v, label]) =>
          html`<label class="in-opt"
            ><input
              type="radio"
              name="tour-${name}"
              value="${v}"
              data-tour-field="${name}"
              ${notes[name] === v ? "checked" : ""}
            /><span>${label}</span></label
          >`,
      )}
    </fieldset>
    <div class="in-field">
      <label for="tour-${useId}">How I might use this (optional)</label>
      <textarea id="tour-${useId}" rows="2" data-tour-field="${useId}">
${notes[useId] || ""}</textarea>
    </div>
  </section>`;
}

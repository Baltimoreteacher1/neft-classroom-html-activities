// Shared activity chrome: the pieces every practice surface (rooms, bank player, studios, games, books) uses to tell a
// learner what to do, show a result, and offer help. Markup builders are pure (Node tests import them); the two
// wire-up helpers touch the DOM only when called. Styles live in ds.css under "activity kit" (classes start with ak-).
// Documented in DESIGN-SYSTEM.md. Text arguments are plain strings; chrome labels come from the bound i18n `I`.
//
//   zones      zoneHTML           instructions · context · stimulus · task · response · hint · feedback
//   directions directionsCardHTML  what you are learning · your job · how · you did it when · optional example
//   feedback   feedbackPanelHTML   right | partly | notyet | shown, with why, evidence and the next step
//   hints      hintLadderHTML      Look → Clue → Show me; wireHintLadders(root) reveals one rung at a time
//   states     setActivityState    START → ACTIVE → RESPONSE → FEEDBACK → RETRY | NEXT → COMPLETE
//   progress   activityProgressHTML
import { announce, html, icon, raw } from "./util.js";

/** The explicit interaction states, in order. NEXT and RETRY are the two exits from FEEDBACK. */
export const ACTIVITY_STATES = Object.freeze([
  "start",
  "active",
  "response",
  "feedback",
  "retry",
  "next",
  "complete",
]);
export const isActivityState = (s) => ACTIVITY_STATES.includes(s);

/** Zones a learner moves through, each visually and semantically distinct. */
export const ZONES = Object.freeze([
  "instructions",
  "context",
  "stimulus",
  "task",
  "response",
  "hint",
  "feedback",
]);
const ZONE_LABELS = {
  instructions: ["Directions", "Instrucciones"],
  context: ["Background", "Contexto"],
  stimulus: ["Read, listen or look", "Lee, escucha o mira"],
  task: ["Question", "Pregunta"],
  response: ["Your answer", "Tu respuesta"],
  hint: ["Hint", "Pista"],
  feedback: ["Feedback", "Comentarios"],
};
export const zoneLabel = (I, zone) => I.T(...(ZONE_LABELS[zone] || ZONE_LABELS.task));

let uid = 0;
const nextId = (prefix) => `${prefix}-${(uid += 1)}`;
const present = (v) => v != null && String(v).trim() !== "" && v !== false;

/**
 * A labelled region. `label` overrides the default zone label; `hideLabel` keeps it for screen readers only.
 * `inner` is already-built html. Returns a <section> named by its label.
 */
export function zoneHTML(
  I,
  zone,
  inner,
  { label = null, hideLabel = false, id = null, cls = "" } = {},
) {
  if (!ZONES.includes(zone)) throw new Error(`activity-kit: unknown zone "${zone}"`);
  const rid = id || nextId(`ak-zone-${zone}`);
  return html`<section
    class="ak-zone ak-zone-${zone} ${cls}"
    data-zone="${zone}"
    aria-labelledby="${rid}"
  >
    <h3 id="${rid}" class="ak-zone-label ${hideLabel ? "visually-hidden" : ""}">
      ${label || zoneLabel(I, zone)}
    </h3>
    ${inner}
  </section>`;
}

/**
 * The directions card. Fields are plain strings (or an array for `how`):
 *   learning  what skill this builds ("I can tell what a text is mostly about.")
 *   doThis    the one-sentence job
 *   how       how to interact (array of short steps, or one sentence)
 *   success   what a good answer looks like, and what happens after Check
 *   example   { label?, body } a worked mini example, folded until asked for
 *   say       text for the Hear button (defaults to doThis); pass false to omit the button
 * Rows with no content are left out, so a short activity gets a short card.
 */
export function directionsCardHTML(
  I,
  { learning, doThis, how, success, example, say, early = false, id = null, heading = null } = {},
) {
  const rid = id || nextId("ak-dir");
  const steps = Array.isArray(how) ? how.filter(present) : present(how) ? [how] : [];
  const row = (cls, dt, dd) =>
    html`<div class="ak-dir-row ${cls}">
      <dt>${dt}</dt>
      <dd>${dd}</dd>
    </div>`;
  const spoken = say === false ? "" : say || doThis;
  return html`<section
    class="ak-directions ${early ? "is-early" : ""}"
    data-zone="instructions"
    aria-labelledby="${rid}"
  >
    <div class="ak-dir-head">
      <h2 id="${rid}" class="ak-dir-title">
        ${icon("flag")} ${heading || I.T("Directions", "Instrucciones")}
      </h2>
      ${present(spoken) ? html`<button type="button" class="btn small ghost ak-hear" data-say="${spoken}" aria-label="${I.S("Hear the directions aloud", "Escuchar las instrucciones")}">${icon("volume")} ${I.T("Hear", "Escuchar")}</button>` : ""}
    </div>
    <dl class="ak-dir-grid">
      ${present(learning) ? row("ak-dir-learn", I.T("You are learning", "Estás aprendiendo"), learning) : ""}
      ${present(doThis) ? row("ak-dir-do", I.T("Your job", "Tu tarea"), doThis) : ""}
      ${
        steps.length
          ? row(
              "ak-dir-how",
              I.T("How", "Cómo"),
              steps.length === 1
                ? steps[0]
                : html`<ol class="ak-dir-steps">
                    ${steps.map((s) => html`<li>${s}</li>`)}
                  </ol>`,
            )
          : ""
      }
      ${present(success) ? row("ak-dir-success", I.T("You did it when", "Lo lograste cuando"), success) : ""}
    </dl>
    ${
      example && present(example.body)
        ? html`<details class="ak-example">
            <summary>${example.label || I.T("See an example", "Ver un ejemplo")}</summary>
            <div class="ak-example-body">${example.body}</div>
          </details>`
        : ""
    }
  </section>`;
}

const FB_STATUS = {
  right: { icon: "check", en: "Correct", es: "Correcto" },
  partly: { icon: "info", en: "Partly right", es: "En parte correcto" },
  notyet: { icon: "retry", en: "Not yet", es: "Todavía no" },
  shown: { icon: "info", en: "Here is the answer", es: "Aquí está la respuesta" },
};
export const FEEDBACK_STATUSES = Object.freeze(Object.keys(FB_STATUS));

/**
 * The feedback panel. Feedback must teach, so `why` is required: say what was right or what to change and which
 * evidence or language feature decides it. Never pass a bare "Correct!/Try again".
 *   status    right | partly | notyet | shown
 *   title     headline (defaults to the status word)
 *   why       the reason, in the learner's language level
 *   evidence  the line, word or rule to look at ("Look at: 'They can tell a teacher'")
 *   next      the one next step ("Change the verb so it matches 'students'.")
 *   actions   already-built html: retry / next buttons
 *   live      true adds role="status" for panels inserted on their own; when the page re-renders, call
 *             announceFeedback() instead (a live region created together with its content is often not read).
 */
export function feedbackPanelHTML(
  I,
  {
    status = "notyet",
    title = null,
    why,
    evidence = null,
    next = null,
    actions = null,
    live = false,
    cls = "",
  } = {},
) {
  const s = FB_STATUS[status];
  if (!s) throw new Error(`activity-kit: unknown feedback status "${status}"`);
  if (!present(why)) throw new Error("activity-kit: feedback needs a reason (why)");
  return html`<div
    class="ak-feedback is-${status} ${cls}"
    data-zone="feedback"
    data-fb-status="${status}"
    ${live ? raw('role="status"') : ""}
  >
    <p class="ak-fb-title">${icon(s.icon)} <span>${title || I.T(s.en, s.es)}</span></p>
    <p class="ak-fb-why">${why}</p>
    ${present(evidence) ? html`<p class="ak-fb-evidence"><strong>${I.T("Look at", "Mira")}</strong> ${evidence}</p>` : ""}
    ${present(next) ? html`<p class="ak-fb-next"><strong>${I.T("Next step", "Siguiente paso")}</strong> ${next}</p>` : ""}
    ${actions ? html`<div class="ak-fb-actions">${actions}</div>` : ""}
  </div>`;
}

/** Speak a result through the page's one live region (#labLive) without a toast. Returns the text spoken. */
export function announceFeedback(I, status, why) {
  const s = FB_STATUS[status] || FB_STATUS.notyet;
  const text = `${I.S(s.en, s.es)}. ${why}`.trim();
  announce(text, { toast: false });
  return text;
}

const HINT_LABELS = [
  ["Look", "Mira"],
  ["Clue", "Pista"],
  ["Show me", "Muéstrame"],
];

/**
 * A hint ladder: each rung gives more help than the last, so the learner can try again before the answer shows.
 * `tiers` is an array of strings (nudge first, near-answer last). `used` re-opens that many rungs after a re-render.
 * Pair with wireHintLadders(root).
 */
export function hintLadderHTML(I, tiers, { used = 0, id = null } = {}) {
  const list = (tiers || []).filter(present);
  if (!list.length) return "";
  const rid = id || nextId("ak-hints");
  const open = Math.min(Math.max(0, used | 0), list.length);
  return html`<div
    class="ak-hints"
    data-zone="hint"
    data-ak-hints
    data-hint-total="${list.length}"
    data-hints-used="${open}"
  >
    <ol class="ak-hint-list" id="${rid}" aria-label="${I.S("Hints", "Pistas")}">
      ${list.map(
        (t, i) =>
          html`<li class="ak-hint" tabindex="-1" ${i < open ? "" : raw("hidden")}>
            <span class="ak-hint-tier"
              >${I.T(...HINT_LABELS[Math.min(i, HINT_LABELS.length - 1)])}</span
            >
            <span class="ak-hint-text">${t}</span>
          </li>`,
      )}
    </ol>
    <button
      type="button"
      class="btn small ak-hint-btn"
      data-ak-hint-next
      aria-controls="${rid}"
      ${open >= list.length ? raw("disabled") : ""}
    >
      ${icon("bulb")} <span data-ak-hint-label>${hintButtonLabel(I, open, list.length)}</span>
    </button>
  </div>`;
}
function hintButtonLabel(I, used, total) {
  if (used >= total) return I.S("No more hints", "No hay más pistas");
  return used
    ? I.S(`Another hint (${used + 1} of ${total})`, `Otra pista (${used + 1} de ${total})`)
    : I.S(`Need a hint? (1 of ${total})`, `¿Necesitas una pista? (1 de ${total})`);
}

/**
 * Wire every hint ladder under `root` (event delegation, safe to call again). Opening a rung moves focus to it,
 * announces it, and fires `ak:hint-used` on the ladder with { used, total } so the host can record that help was
 * used. `labels` supplies the button text for a bound i18n (defaults to English).
 */
export function wireHintLadders(root, I = null) {
  if (!root || root.dataset?.akHintsWired) return;
  root.dataset.akHintsWired = "1";
  root.addEventListener("click", (ev) => {
    const btn = ev.target.closest?.("[data-ak-hint-next]");
    if (!btn) return;
    const ladder = btn.closest("[data-ak-hints]");
    const next = ladder?.querySelector(".ak-hint[hidden]");
    if (!next) return;
    next.hidden = false;
    const total = Number(ladder.dataset.hintTotal);
    const used = total - ladder.querySelectorAll(".ak-hint[hidden]").length;
    ladder.dataset.hintsUsed = String(used);
    const label = btn.querySelector("[data-ak-hint-label]");
    if (label)
      label.textContent = I
        ? hintButtonLabel(I, used, total)
        : used >= total
          ? "No more hints"
          : `Another hint (${used + 1} of ${total})`;
    if (used >= total) btn.disabled = true;
    next.focus({ preventScroll: false });
    announce(next.textContent.replace(/\s+/g, " ").trim(), { toast: false });
    ladder.dispatchEvent(
      new CustomEvent("ak:hint-used", { bubbles: true, detail: { used, total } }),
    );
  });
}

/**
 * Put an activity container into one state. CSS then shows or hides anything marked data-ak-in="feedback retry"
 * (a space list of the states it belongs to). Fires `ak:state` with { state, from }.
 */
export function setActivityState(el, state) {
  if (!isActivityState(state)) throw new Error(`activity-kit: unknown state "${state}"`);
  const from = el.dataset.actState || null;
  if (from === state) return state;
  el.dataset.actState = state;
  el.dispatchEvent(new CustomEvent("ak:state", { bubbles: true, detail: { state, from } }));
  return state;
}

/** "Question 2 of 5" with a bar. Not a score, not a timer: where the learner is in the set. */
export function activityProgressHTML(I, current, total, { label = null } = {}) {
  const n = Math.max(1, Math.min(total, current));
  const text = label || I.S(`Question ${n} of ${total}`, `Pregunta ${n} de ${total}`);
  return html`<div
    class="ak-progress"
    role="progressbar"
    aria-label="${text}"
    aria-valuemin="1"
    aria-valuemax="${total}"
    aria-valuenow="${n}"
    aria-valuetext="${text}"
  >
    <span class="ak-progress-text">${text}</span>
    <span class="ak-progress-bar" aria-hidden="true"
      ><i style="width:${Math.round((n / total) * 100)}%"></i
    ></span>
  </div>`;
}

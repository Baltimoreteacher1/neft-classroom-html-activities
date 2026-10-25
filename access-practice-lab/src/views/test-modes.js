// Practice-test modes: what Guided Practice and Independent Rehearsal each allow, and the
// intro-screen panel where a student picks one (views/test.js renders it).
import { html, raw } from "../util.js";

const IGN = raw("data-nsr-ignore");

/** What each mode allows. Guided supports are never rendered in Independent Rehearsal. */
export const MODES = Object.freeze({
  guided: Object.freeze({ id: "guided", label: "Guided Practice Mode", results: "Supported Practice", timer: false, singlePassAudio: false, frames: true, wordBank: true, lookback: true, rationales: true, retry: true, flagging: true, sectionReview: true }),
  independent: Object.freeze({ id: "independent", label: "Independent Rehearsal Mode", results: "Independent Rehearsal", timer: true, singlePassAudio: true, frames: false, wordBank: false, lookback: false, rationales: false, retry: false, flagging: true, sectionReview: true }),
});
/** Saved records keep the original `conditions` flag, so older tests resume in the right mode. */
export const modeOf = (rec) => (rec?.conditions ? "independent" : "guided");
export const otherMode = (m) => (m === "independent" ? "guided" : "independent");

export function modeBannerHTML(want, rec) {
  if (!want || want === modeOf(rec)) return "";
  return html`<div class="mode-banner" role="status">
    <p>
      You chose <strong>${MODES[want].label}</strong>, but this test is already
      ${rec.phase === "results" ? "finished" : "started"} in ${MODES[modeOf(rec)].label}. Changing
      mode restarts the test.
    </p>
    <button type="button" class="btn" data-switch-mode="${want}">Restart in ${MODES[want].label}</button>
  </div>`;
}

export function modeChoiceHTML(rec, { started, minutes }) {
  const mode = modeOf(rec);
  if (started)
    return html`<div class="test-mode">
      <p><strong>Mode: ${MODES[mode].label}.</strong> You chose this when you started. Changing mode restarts the test.</p>
      <button type="button" class="ghost" data-switch-mode="${otherMode(mode)}">
        Restart in ${MODES[otherMode(mode)].label}
      </button>
    </div>`;
  return html`<fieldset class="test-mode">
    <legend>Choose your mode before you start</legend>
    <label class="rate-opt"
      ><input type="radio" name="test-mode" value="learning" data-conditions ${mode === "guided" ? raw("checked") : ""} ${IGN} />
      <span><strong>Guided Practice Mode</strong> — untimed. Listen as often as you like, look back at hints, see why an answer is right right away, and try again.</span></label
    >
    <label class="rate-opt"
      ><input type="radio" name="test-mode" value="test" data-conditions ${mode === "independent" ? raw("checked") : ""} ${IGN} />
      <span><strong>Independent Rehearsal Mode</strong> — like test day. Each recording plays once and cannot be paused. No sentence frames or word banks. Flag questions, review each section, then submit to see a practice breakdown.</span></label
    >
    ${
      mode === "independent"
        ? html`<label class="timer-opt"
              ><input type="checkbox" data-replay ${rec.replay ? raw("checked") : ""} ${IGN} /> Allow one replay of each recording
              <span class="fine">EduWonderLab rehearsal setting. It does not grant or represent an official testing accommodation. Ask your teacher about your assessment plan.</span></label
            >
            <label class="timer-opt"
              ><input type="checkbox" data-timer ${rec.timer ? raw("checked") : ""} ${IGN} /> Practice
              with a timer (about ${minutes} minutes). It will never end your test.</label
            >`
        : ""
    }
  </fieldset>`;
}

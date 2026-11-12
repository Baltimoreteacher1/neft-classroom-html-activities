// Per-skill mastery meter. It reads the tutor's own evidence (tutor-engine evidence()), so it agrees with the
// lab's "Remembered independently" rule, and it only moves for INDEPENDENT first-try answers at the skill's level:
// supported answers and smaller-number warm-ups are counted on a separate line and never fill a segment.
// The stage is always named in words; colour and fill only repeat what the words say.
import { esc, tr } from "./words.js";

export const METER_STEPS = 8; // the tutor needs 8 independent answers before a skill can count as remembered
export const METER_STAGES = [
  "new",
  "warming",
  "started",
  "building",
  "stronger",
  "ready",
  "remembered",
];
export const STAGE_TEXT = {
  new: "Not started yet",
  warming: "Warming up",
  started: "Getting started",
  building: "Building",
  stronger: "Getting stronger",
  ready: "Show it again on another day",
  remembered: "Remembered on my own",
};
export const stageText = (stage) => tr(STAGE_TEXT[stage] || STAGE_TEXT.new);

// ev: the object evidence(tutor, skill) returns.
export function meterFor(ev = {}) {
  const recent = Array.isArray(ev.recent) ? ev.recent : [];
  const counted = (entry) => entry.independent && entry.level >= 1;
  const successes = recent.filter((entry) => counted(entry) && entry.correct).length;
  const helped = recent.filter((entry) => entry.correct && !counted(entry)).length;
  const filled = ev.secure ? METER_STEPS : Math.min(successes, METER_STEPS);
  const independent = recent.filter(counted).length;
  const accurate = independent && successes / independent >= 0.85;
  const lastThree = recent.slice(-3).every((entry) => entry.correct);
  let stage = "new";
  if (ev.secure) stage = "remembered";
  else if (successes >= METER_STEPS && accurate && lastThree) stage = "ready";
  else if (successes >= 6) stage = "stronger";
  else if (successes >= 3) stage = "building";
  else if (successes >= 1) stage = "started";
  else if (recent.some((entry) => entry.correct)) stage = "warming";
  return {
    stage,
    index: METER_STAGES.indexOf(stage),
    filled,
    steps: METER_STEPS,
    helped,
    due: Boolean(ev.secure && ev.due),
  };
}

// What changed between two readings of the meter for one answer. A milestone needs the stage to rise, so a
// wrong answer or a supported answer can never be celebrated as one.
export function meterChange(before, after) {
  const rose = after.index > before.index;
  return {
    rose,
    moved: after.filled !== before.filled || rose,
    remembered: rose && after.stage === "remembered",
  };
}

const countText = (m) => tr("{n} of {total} on my own", { n: m.filled, total: m.steps });
export const meterSummary = (m) => `${stageText(m.stage)}: ${countText(m)}`;

const segments = (m) =>
  Array.from(
    { length: m.steps },
    (_, i) =>
      `<i class="${i < m.filled ? "on" : ""}${i === m.filled - 1 && m.fresh ? " fresh" : ""}"></i>`,
  ).join("");

// The full meter (skill screen and practice). `fresh` marks the segment just earned so it can glow once.
export function meterHtml(m) {
  return `<div class="meter-wrap" data-meter data-stage="${m.stage}">
    <p class="meter-row"><strong class="meter-stage">${esc(stageText(m.stage))}</strong> <span class="meter-count">${esc(countText(m))}</span></p>
    <div class="meter" role="meter" aria-label="${esc(tr("Skill meter"))}" aria-valuemin="0" aria-valuemax="${m.steps}" aria-valuenow="${m.filled}" aria-valuetext="${esc(meterSummary(m))}">${segments(m)}<b class="meter-goal${m.stage === "remembered" ? " on" : ""}" aria-hidden="true">★</b></div>
    ${m.helped ? `<p class="meter-help">${esc(tr("With help or warm-ups: {n} (counted separately)", { n: m.helped }))}</p>` : ""}
    ${m.due ? `<p class="meter-help">${esc(tr("Time for a quick refresh"))}</p>` : ""}
  </div>`;
}

// A compact mirror for library cards and My Progress: eight dots and the stage word.
export const meterMini = (m) =>
  `<span class="meter-mini" data-stage="${m.stage}"><span class="meter-dots" role="img" aria-label="${esc(meterSummary(m))}">${segments({ ...m, fresh: false })}</span><span class="meter-mini-word" aria-hidden="true">${esc(stageText(m.stage))}</span></span>`;

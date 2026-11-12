// What happens around one answered practice problem: the meter moves (only for an independent first-try answer
// at the skill's level), a screen reader hears the new reading, the rewards record notes the practice day and
// gives stars for a milestone, and a right answer gets a short acknowledgement with the buddy. The awards module
// loads on demand so practice opens without waiting for the rewards code.
import { METER_STAGES, meterChange, meterHtml, meterSummary, stageText } from "./meter.js";
import { recStripHtml } from "./rec-view.js";
import { recommendedNext } from "./recommend.js";
import { loadTutor, skillMeter, skillMeters } from "./store.js";

let awards = null;
export const loadAwards = () => (awards ??= import("./awards.js"));

// The milestone card suggests where to go next only once the skill is well under way.
const SUGGEST_FROM = METER_STAGES.indexOf("stronger");
const FIRST_MILESTONE = METER_STAGES.indexOf("started");

export function drawMeter(root, meter) {
  const host = root.querySelector("[data-meter-host]");
  if (host) host.innerHTML = meterHtml(meter);
}

// Call after recordPractice. `before` is skillMeter(skill) read before the answer was recorded.
export async function afterAnswer({
  root,
  skill,
  before,
  correct,
  independent,
  firstTry,
  fb,
  live,
  n,
}) {
  const after = skillMeter(skill);
  const change = meterChange(before, after);
  drawMeter(root, { ...after, fresh: after.filled > before.filled });
  if (change.moved) live(meterSummary(after));
  if (!firstTry && !correct) return;
  // Warm-ups (smaller numbers) are never a milestone: the first stage worth stars is "Getting started", the first
  // answer on my own at the skill's level.
  const milestone =
    firstTry && correct && independent && change.rose && after.index >= FIRST_MILESTONE
      ? change.remembered
        ? "remembered"
        : "stage"
      : null;
  const mod = await loadAwards().catch(() => null);
  if (!mod) return;
  const award = firstTry
    ? mod.awardPractice({ milestone })
    : { stars: 0, stickers: [], look: mod.buddyLook() };
  if (!correct || !fb.isConnected) return;
  const kind =
    milestone === "remembered"
      ? "remembered"
      : milestone
        ? "milestone"
        : independent
          ? "right"
          : "helped";
  let next = "";
  if (milestone && after.index >= SUGGEST_FROM) {
    const rows = recommendedNext(loadTutor(), skill.grade, {
      after: skill,
      exclude: [`${skill.grade}:${skill.id}`],
      limit: 2,
    });
    const meters = Object.fromEntries(
      Object.entries(skillMeters(skill.grade)).map(([id, m]) => [`${skill.grade}:${id}`, m]),
    );
    next = recStripHtml(rows, { title: "Up next", level: 3, meters });
  }
  const html = mod.celebrationHtml({
    kind,
    stars: award.stars,
    stickers: award.stickers,
    look: award.look,
    stageName: stageText(after.stage),
    n,
    next,
  });
  fb.querySelector("p")?.insertAdjacentHTML("afterend", html);
  mod.playCheer(kind);
}

// The buddy's word after the worked solution is shown (a second miss): no stars, a line about mistakes.
export async function afterSolution(fb, n) {
  const mod = await loadAwards().catch(() => null);
  if (mod && fb.isConnected)
    fb.querySelector("p")?.insertAdjacentHTML(
      "afterend",
      mod.buddyHtml(mod.buddyLook(), "miss", n, "buddy-feedback"),
    );
}

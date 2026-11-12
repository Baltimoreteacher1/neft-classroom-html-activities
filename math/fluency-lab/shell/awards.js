// Celebrations and the buddy in the student app. Stars and stickers go into the lab's EXISTING rewards record
// (rewards.js: same storage key per learner, same cleanRewards, same sticker rules), so a star earned here is a
// coin in the Buddy shop and travels in the same backup (play-backup.js). There is no second economy.
// Loaded on demand (app.js / skill.js import it lazily), so the first screen does not wait for it.
import { loadTrail } from "../fact-trail.js";
import { buddySvg } from "../buddy.js";
import {
  claimNewStickers,
  cleanRewards,
  coinBalance,
  loadRewards,
  noteToday,
  saveRewards,
  summarize,
} from "../rewards.js";
import { chime } from "../sounds.js";
import { t } from "../i18n.js";
import { esc, tr } from "./words.js";

// A milestone is a stage change on the mastery meter; "remembered" is the biggest one.
export const MILESTONE_STARS = { stage: 1, remembered: 3 };

// Applies one answered practice problem to a rewards record (already cleaned). Practising is a practice day, as
// it is in the full lab; stars are given only for a milestone. Returns the stars given.
export function applyPractice(data, { milestone = null } = {}) {
  noteToday(data);
  const stars = MILESTONE_STARS[milestone] || 0;
  if (stars) data.coins = { ...data.coins, earned: Math.min(100000, data.coins.earned + stars) };
  return stars;
}

export function awardPractice({ milestone = null } = {}) {
  const data = loadRewards();
  const stars = applyPractice(data, { milestone });
  const stickers = claimNewStickers(data, summarize(loadTrail(), data));
  saveRewards(cleanRewards(data));
  return { stars, stickers, coins: coinBalance(data), look: data.buddy };
}

export const buddyLook = () => loadRewards().buddy;

// Short lines that praise thinking, checking and using help well. Never speed, never a run of answers.
const LINES = {
  home: ["Ready to think something through?", "Let's build your thinking together."],
  right: [
    "You worked it out yourself.",
    "You checked your thinking. Nice.",
    "Your reasoning held up.",
  ],
  helped: ["Using help to understand is smart thinking."],
  miss: ["Mistakes show us what to look at next."],
  milestone: ["Your thinking is getting stronger."],
  remembered: ["You remembered it on your own. That idea is yours now."],
};
export const LINE_KEYS = Object.values(LINES).flat();
export const buddyLine = (kind, n = 0) => {
  const list = LINES[kind] || LINES.right;
  return tr(list[Math.abs(n) % list.length]);
};
const MOOD = {
  right: "happy",
  helped: "happy",
  miss: "think",
  milestone: "cheer",
  remembered: "cheer",
  home: "happy",
};

export const buddyHtml = (look, kind, n = 0, cls = "") =>
  `<div class="buddy ${cls}"><span class="buddy-art" aria-hidden="true">${buddySvg({ ...look, mood: MOOD[kind] || "happy" })}</span><p class="buddy-line">${esc(buddyLine(kind, n))}</p></div>`;

const reduced = () =>
  document.documentElement.dataset.motion === "reduce" ||
  (typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);

const burst = () =>
  reduced()
    ? ""
    : `<span class="cheer-burst" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<i style="--a:${i * 36}deg;--d:${(i % 3) * 60}ms"></i>`).join("")}</span>`;

const starsText = (n) =>
  n === 1
    ? tr("+1 star: 1 coin for your buddy's shop")
    : tr("+{n} stars: {n} coins for your buddy's shop", { n });

// The acknowledgement for a right answer, inserted into the feedback. A milestone (stage change) gets the bigger
// card with stars, any new sticker, and the buddy cheering. Sound plays only when the lab's sound setting is on
// (sounds.js chime checks it).
export function celebrationHtml({
  kind,
  stars = 0,
  stickers = [],
  look,
  stageName = "",
  n = 0,
  next = "",
}) {
  if (kind !== "milestone" && kind !== "remembered")
    return buddyHtml(look, kind, n, "buddy-feedback");
  const title =
    kind === "remembered"
      ? tr("Remembered on my own!")
      : tr("New stage: {stage}", { stage: stageName });
  return `<div class="cheer cheer-${kind}${reduced() ? " is-still" : ""}">
    ${burst()}
    <p class="cheer-title"><span class="cheer-star" aria-hidden="true">★</span> ${esc(title)}</p>
    ${stars ? `<p class="cheer-stars">${esc(starsText(stars))}</p>` : ""}
    ${stickers.length ? `<p class="cheer-stickers">${esc(stickers.length > 1 ? t("New stickers!") : t("New sticker!"))} ${stickers.map((s) => `<span class="cheer-sticker"><span aria-hidden="true">${s.icon}</span> ${esc(t(s.name))}</span>`).join(" ")}</p>` : ""}
    ${buddyHtml(look, kind, n, "buddy-cheer")}
    ${next}
  </div>`;
}

export function playCheer(kind) {
  chime(kind === "milestone" || kind === "remembered" ? "win" : "good");
}

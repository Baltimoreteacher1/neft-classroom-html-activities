// Daily Green Light: a set number of answers right on the first try, on the learner's own (no hint, no steps,
// no coaching), turns the day's light green and opens the Buddy shop for the rest of the day. Accuracy only:
// no clock is read, there is no time limit, and a slow careful answer counts the same as a quick one.
// Teachers see green-light days per week from learner files. Pure apart from the storage helpers.
import { t } from "./i18n.js";
import { loadFacts } from "./moby/fact-model.js";
import { profileKey, profiles, readLocal } from "./school-tools.js";
import { localDay } from "./tutor-engine.js";

const esc = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export const GREEN_LIGHT_TARGET = 10;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

// Independent right answers made today: skill practice (tutor records) plus fact practice (fact store).
export function independentRightToday(tutor, facts, now = Date.now()) {
  const today = localDay(now);
  let n = 0;
  for (const record of Object.values(tutor?.records || {}))
    for (const entry of record?.recent || [])
      if (entry.independent && entry.correct && localDay(entry.at) === today) n += 1;
  for (const record of Object.values(facts?.facts || {}))
    for (const entry of record?.recent || [])
      if (entry.correct && entry.firstTry && !entry.supported && entry.day === today) n += 1;
  return n;
}

export function greenLight(tutor, facts, now = Date.now(), target = GREEN_LIGHT_TARGET) {
  const count = independentRightToday(tutor, facts, now);
  return {
    count: Math.min(count, target),
    target,
    green: count >= target,
    left: Math.max(0, target - count),
  };
}

export const cleanGreenDays = (days) =>
  Array.isArray(days)
    ? [...new Set(days.filter((day) => DAY_RE.test(day)))].sort().slice(-120)
    : [];

// Records today in the rewards record once the light is green. Returns true when today was newly added.
export function noteGreenDay(rewards, light, now = Date.now()) {
  if (!light.green) return false;
  const today = localDay(now);
  rewards.greenDays = cleanGreenDays(rewards.greenDays);
  if (rewards.greenDays.includes(today)) return false;
  rewards.greenDays = cleanGreenDays([...rewards.greenDays, today]);
  return true;
}

// Monday-to-Sunday weeks, most recent first: [{ week, days }] for the last `weeks` weeks ending at `now`.
export function greenDaysPerWeek(days, now = Date.now(), weeks = 4) {
  const clean = cleanGreenDays(days);
  const monday = (time) => {
    const date = new Date(time);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    return date;
  };
  const out = [];
  for (let w = 0; w < weeks; w += 1) {
    const start = monday(now);
    start.setDate(start.getDate() - 7 * w);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const from = localDay(start.getTime());
    const to = localDay(end.getTime());
    out.push({ week: from, days: clean.filter((day) => day >= from && day <= to).length });
  }
  return out;
}

// The light for the learner in use on this device, read from storage.
export const TUTOR_STORE_KEY = "ewl-fluency-tutor-v2";
export const currentGreenLight = (now = Date.now()) =>
  greenLight(readLocal(profileKey(TUTOR_STORE_KEY, profiles().active), null), loadFacts(), now);

export function greenLightHtml(light) {
  const label = light.green
    ? t("Green Light! You got {n} right on your own today. The Buddy shop is open.", { n: light.target })
    : t("Green Light: {n} of {target} answers right on your own today. The Buddy shop opens at {target}.", {
        n: light.count,
        target: light.target,
      });
  return `<div class="fl-green-light ${light.green ? "is-green" : ""}" role="status"><span class="fl-green-dot" aria-hidden="true"></span><p>${esc(label)} <small>${esc(t("Take your time: only careful first tries count, never speed."))}</small></p><progress max="${light.target}" value="${light.count}" aria-label="${esc(t("Green Light progress"))}"></progress></div>`;
}

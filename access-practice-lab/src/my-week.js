// "My week" on the Student Hub (/students): this week's practice days against the learner's own goal, which of the four
// skills they practiced, and ONE suggested next skill. Pure apart from its injectable defaults; it reads only what the
// device already records (store.js results and test records), counts, and never scores, ranks or compares learners.
import { getEngagement, weekKey } from "./engagement.js";
import { allRecords, practiceDays } from "./store.js";
import { CORE_DOMAINS, todayISO } from "./util.js";

const DAY_LETTERS = [
  ["M", "L"],
  ["T", "M"],
  ["W", "X"],
  ["T", "J"],
  ["F", "V"],
  ["S", "S"],
  ["S", "D"],
];
const DAY_NAMES = [
  ["Monday", "lunes"],
  ["Tuesday", "martes"],
  ["Wednesday", "miércoles"],
  ["Thursday", "jueves"],
  ["Friday", "viernes"],
  ["Saturday", "sábado"],
  ["Sunday", "domingo"],
];

/** A result that counts as practice (the same rule practiceDays() uses). */
const counts = (r) => r?.date && r.meaningful !== false && r.words !== 0 && r.practiced !== false;

/**
 * @param {{ bands?: string[], prefs?: object, today?: Date, records?: Array, days?: string[] }} o
 *   `bands` limits the skill counts to the learner's content bands (practice days count across bands, like the
 *   weekly goal on the band home).
 */
export function myWeek({
  bands = [],
  prefs = {},
  today = new Date(),
  records = allRecords(),
  days = practiceDays(),
} = {}) {
  const start = weekKey(today);
  const todayIso = todayISO(today);
  const week = DAY_LETTERS.map((letter, i) => {
    const d = new Date(`${start}T12:00:00`);
    d.setDate(d.getDate() + i);
    const iso = todayISO(d);
    return { iso, letter, name: DAY_NAMES[i], done: days.includes(iso), today: iso === todayIso, future: iso > todayIso };
  });
  const end = week[6].iso;
  const inWeek = (iso) => iso >= start && iso <= end;
  const skills = Object.fromEntries(CORE_DOMAINS.map((d) => [d, 0]));
  for (const { band, domain, record } of records) {
    if (!(domain in skills) || (bands.length && !bands.includes(band))) continue;
    for (const r of Object.values(record.results || {}))
      if (counts(r) && inWeek(todayISO(new Date(r.date)))) skills[domain] += 1;
  }
  const done = week.filter((d) => d.done).length;
  const goal = getEngagement(prefs).weeklyGoal;
  // The next skill: one this week has not touched yet, else the least practiced; none when all four are even.
  const order = [...CORE_DOMAINS].sort((a, b) => skills[a] - skills[b]);
  const least = order[0];
  const next = skills[least] < Math.max(...Object.values(skills)) || skills[least] === 0 ? least : "";
  return { start, week, done, goal, reached: done >= goal, skills, next, any: done > 0 };
}

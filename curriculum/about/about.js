/* about.js — behaviour for /curriculum/about/.
 *
 * The course sequence and the day totals are READ from the pacing plan
 * (tools/import-pacing-baseline.mjs generates both files), never written as
 * prose: an earlier hub card said Statistics came "immediately following the
 * introductory unit" when the plan teaches it ninth. */

const root = document.querySelector(".about-wrap");
const MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
// Unit 10 is not taught this year (Joel, 2026-10-07); the plan still pencils
// it in for June. Same rule as tools/sync-curriculum-shell.mjs.
const NOT_SCHEDULED = new Set([10]);
const DAY_TYPES = [
  ["Core Lesson", "Core lesson days"],
  ["Continued Lesson", "Second days of a lesson"],
  ["Catch-Up", "Catch-up days"],
  ["Project", "Culminating project days"],
  ["Review", "Review days"],
  ["Assessment", "Unit assessments and quizzes"],
  ["Flex", "Flex days"],
  ["MCAP / Testing", "State testing days"],
];

/** @param {string} iso */
function shortDate(iso) {
  const [, month, day] = iso.split("-").map(Number);
  return `${MONTHS[month - 1]} ${day}`;
}

/** @param {string} url */
async function load(url) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

/** @param {{ units: Array<{ curriculumUnit: number | null, districtLabel: string, startDate: string, endDate: string }> }} ranges */
function renderSequence(ranges) {
  const list = root?.querySelector('[data-role="sequence"]');
  const note = root?.querySelector('[data-role="sequence-note"]');
  if (!list) return;
  const taught = ranges.units.filter(
    (unit) => unit.curriculumUnit && !NOT_SCHEDULED.has(unit.curriculumUnit),
  );
  list.replaceChildren(
    ...taught.map((unit) => {
      const item = document.createElement("li");
      const label = document.createElement("a");
      label.href = `/curriculum/units/#unit-${unit.curriculumUnit}`;
      label.textContent = unit.districtLabel;
      const dates = document.createElement("span");
      dates.className = "dates";
      dates.textContent = `${shortDate(unit.startDate)} – ${shortDate(unit.endDate)}`;
      item.append(label, dates);
      return item;
    }),
  );
  if (note) {
    const order = taught.map((unit) => unit.curriculumUnit).join(" → ");
    const stats = taught.findIndex((unit) => unit.curriculumUnit === 2);
    const statsText =
      stats === -1
        ? ""
        : ` Statistics (Unit 2) is taught ${ordinal(stats + 1)}, ${shortDate(taught[stats].startDate)} – ${shortDate(taught[stats].endDate)}.`;
    note.textContent = `Order taught: ${order}.${statsText} Unit 10 is not scheduled this year.`;
  }
}

/** @param {number} n */
function ordinal(n) {
  const words = [
    "",
    "first",
    "second",
    "third",
    "fourth",
    "fifth",
    "sixth",
    "seventh",
    "eighth",
    "ninth",
    "tenth",
  ];
  return words[n] || `${n}th`;
}

/** @param {{ totals?: { schoolDays?: number, byDayType?: Record<string, number> } }} baseline */
function renderTotals(baseline) {
  const list = root?.querySelector('[data-role="day-totals"]');
  const totals = baseline.totals;
  if (!list || !totals?.byDayType) return;
  const rows = [["School days", totals.schoolDays]];
  for (const [key, label] of DAY_TYPES) {
    if (totals.byDayType[key]) rows.push([label, totals.byDayType[key]]);
  }
  list.replaceChildren(
    ...rows.flatMap(([label, count]) => {
      const term = document.createElement("dt");
      term.textContent = String(label);
      const value = document.createElement("dd");
      value.textContent = String(count);
      return [term, value];
    }),
  );
}

function render() {
  if (!root) return;
  load("/data/pacing-unit-ranges.json")
    .then(renderSequence)
    .catch(() => {});
  load("/data/pacing-baseline-2026-27.json")
    .then(renderTotals)
    .catch(() => {});
}

render();

export { render };

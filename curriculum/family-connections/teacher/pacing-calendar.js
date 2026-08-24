/* =============================================================================
 * teacher/pacing-calendar.js — pick the week off a real school calendar.
 * -----------------------------------------------------------------------------
 * A 42-entry "September 21-25 (2026-09-21)" dropdown makes the teacher hold the
 * calendar in their head. This shows the month the way it actually sits: which
 * days school is closed, which lesson is planned where, and which five days the
 * publisher is about to fill.
 *
 * It DRIVES the existing <select> rather than replacing it — the select stays
 * the accessible, keyboard-navigable control and the single source of the chosen
 * week, so the two can never disagree.
 * ========================================================================== */

import { DAYS } from "../shared/model.js";
import { pacingMonthGrid, pacingMonths } from "../shared/pacing-week.js";

const node = (tag, className, text) => {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text !== undefined) item.textContent = text;
  return item;
};

/** Short weekday headers, derived so they cannot drift from the week model. */
const SHORT_DAY = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri" };

function cellTitle(cell) {
  if (!cell.planned) return `${cell.date} — outside the pacing plan`;
  if (!cell.school) return `${cell.date} — ${cell.statusLabel || "no school"}`;
  if (cell.lessonId) return `${cell.date} — Lesson ${cell.lessonId}`;
  return `${cell.date} — ${cell.dayType || "no lesson planned"}`;
}

/**
 * @param {HTMLElement} root
 * @param {any[]} resolvedDays resolveYear(baseline, overlay)
 * @param {{monthKey: string, selectedWeek: string, onPick: (weekStart: string) => void,
 *          onMonth: (monthKey: string) => void}} options
 */
export function renderPacingCalendar(root, resolvedDays, options) {
  const months = pacingMonths(resolvedDays);
  if (!months.length) {
    root.replaceChildren();
    root.hidden = true;
    return;
  }
  root.hidden = false;
  const index = Math.max(
    0,
    months.findIndex((month) => month.key === options.monthKey),
  );
  const month = months[index];

  const head = node("div", "pcal-head");
  const previous = node("button", "pcal-nav", "‹");
  previous.type = "button";
  previous.disabled = index === 0;
  previous.setAttribute("aria-label", "Previous month");
  previous.addEventListener("click", () => options.onMonth(months[index - 1].key));
  const next = node("button", "pcal-nav", "›");
  next.type = "button";
  next.disabled = index === months.length - 1;
  next.setAttribute("aria-label", "Next month");
  next.addEventListener("click", () => options.onMonth(months[index + 1].key));
  head.append(previous, node("strong", "pcal-month", month.label), next);

  const grid = node("div", "pcal-grid");
  for (const day of DAYS) grid.append(node("span", "pcal-dow", SHORT_DAY[day]));
  for (const week of pacingMonthGrid(resolvedDays, month.key)) {
    const isSelected = week.weekStart === options.selectedWeek;
    for (const cell of week.cells) {
      const button = node("button", "pcal-day");
      button.type = "button";
      button.dataset.week = week.weekStart;
      button.title = cellTitle(cell);
      button.classList.toggle("is-outside", !cell.inMonth);
      button.classList.toggle("is-closed", cell.planned && !cell.school);
      button.classList.toggle("is-unplanned", !cell.planned);
      button.classList.toggle("is-selected", isSelected);
      if (isSelected) button.setAttribute("aria-current", "true");
      button.append(node("span", "pcal-date", String(cell.dayNumber)));
      /* The lesson number is the whole point of showing a calendar — a grid of
       * bare dates would tell the teacher nothing they did not already know. */
      button.append(
        node("span", "pcal-lesson", cell.lessonId || (cell.school ? "·" : "")),
      );
      button.addEventListener("click", () => options.onPick(week.weekStart));
      grid.append(button);
    }
  }
  root.replaceChildren(head, grid);
}

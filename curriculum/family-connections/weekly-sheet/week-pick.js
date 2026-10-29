/* Which week of the pacing plan a date belongs to. Shared by the sheet page and the Family Math Studio buttons. */

/** Today as YYYY-MM-DD on the family's clock; a weekend means the week about to start. */
export function todayIso(now = new Date()) {
  const date = new Date(now);
  const day = date.getDay();
  date.setDate(date.getDate() + (day === 0 ? 1 : day === 6 ? 2 : 0));
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The week containing `iso`; a date in a break or outside the year takes the next week, else the last. */
export function weekFor(weeks, iso) {
  const found = weeks.find((week) => iso >= week.start && iso <= week.days[week.days.length - 1].date);
  return found ?? weeks.find((week) => week.start > iso) ?? weeks[weeks.length - 1];
}

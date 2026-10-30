// Monitoring check-in reminders as a calendar file (.ics) a teacher imports into Google or Apple
// Calendar. One all-day event per check-in, on a steady cadence, moved off weekends. The file holds a
// title, a date and generic instructions: no student name, alias or score ever goes into it.
const DAY = 864e5;

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
const parseDate = (iso) => {
  const m = String(iso ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return d.getUTCMonth() === Number(m[2]) - 1 ? d : null;
};
/** A weekend date moves to the Monday after it. */
const weekday = (d) => new Date(d.getTime() + ({ 0: 1, 6: 2 }[d.getUTCDay()] ?? 0) * DAY);
const escapeText = (t) => String(t).replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
/** RFC 5545 line folding at 75 octets, continuation lines start with one space. */
function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let cur = "";
  let size = 0;
  for (const ch of line) {
    const w = new TextEncoder().encode(ch).length;
    if (size + w > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = "";
      size = 0;
    }
    cur += ch;
    size += w;
  }
  out.push(cur);
  return out.join("\r\n ");
}
const hash = (s) => {
  let h = 5381;
  for (const ch of s) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return h.toString(16);
};

export const CHECKIN_LIMITS = Object.freeze({ everyDays: [7, 90], count: [1, 12] });

/** The dates (YYYY-MM-DD) the check-ins fall on, or null for an invalid plan. */
export function checkinDates({ start, everyDays = 28, count = 6 } = {}) {
  const first = parseDate(start);
  const [minEvery, maxEvery] = CHECKIN_LIMITS.everyDays;
  const [minCount, maxCount] = CHECKIN_LIMITS.count;
  if (!first || !Number.isInteger(everyDays) || everyDays < minEvery || everyDays > maxEvery || !Number.isInteger(count) || count < minCount || count > maxCount) return null;
  return Array.from({ length: count }, (_, i) => {
    const d = weekday(new Date(first.getTime() + i * everyDays * DAY));
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  });
}

/** The .ics text (CRLF lines), or null for an invalid plan. `now` only stamps the file. */
export function checkinCalendar({ start, everyDays = 28, count = 6, label = "", now = new Date() } = {}) {
  const dates = checkinDates({ start, everyDays, count });
  if (!dates) return null;
  const stamp = `${ymd(now)}T000000Z`;
  const title = `ACCESS Practice Lab check-in${label ? `: ${String(label).slice(0, 60)}` : ""}`;
  const body = [
    "Open the Teacher Hub (Class tab) and add new share codes from students.",
    "Review the supports and independence report for each student.",
    "Update goals and write one next step for each student you will conference with.",
  ].join("\n");
  const events = dates.flatMap((date, i) => {
    const d = parseDate(date);
    const next = new Date(d.getTime() + DAY);
    return [
      "BEGIN:VEVENT",
      `UID:access-checkin-${hash(`${title}|${date}|${i}`)}@eduwonderlab.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(d)}`,
      `DTEND;VALUE=DATE:${ymd(next)}`,
      `SUMMARY:${escapeText(`${title} (${i + 1} of ${dates.length})`)}`,
      `DESCRIPTION:${escapeText(body)}`,
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    ];
  });
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EduWonderLab//ACCESS Practice Lab check-ins//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ]
    .map(fold)
    .join("\r\n")
    .concat("\r\n");
}

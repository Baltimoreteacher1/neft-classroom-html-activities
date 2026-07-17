function escapeCalendar(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function utcStamp(value) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function fold(line) {
  const pieces = [];
  let remaining = line;
  while (remaining.length > 74) {
    pieces.push(remaining.slice(0, 74));
    remaining = ` ${remaining.slice(74)}`;
  }
  pieces.push(remaining);
  return pieces.join("\r\n");
}

export function buildCalendarEvent(slot, options = {}) {
  const reference = String(options.reference ?? "family-meeting").replace(/[^a-zA-Z0-9-]/g, "");
  const url = String(options.url ?? "https://eduwonderlab.com/curriculum/family-connections/");
  const format =
    slot.format === "phone"
      ? "Phone call"
      : slot.format === "in-person"
        ? "In-person meeting"
        : "Video meeting";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EduWonderLab//Family Connections//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${reference}@eduwonderlab.com`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART:${utcStamp(slot.startAt)}`,
    `DTEND:${utcStamp(slot.endAt)}`,
    "SUMMARY:Family meeting",
    `LOCATION:${escapeCalendar(slot.locationLabel)}`,
    `DESCRIPTION:${escapeCalendar(`${format}. Meeting information: ${url}`)}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

export function downloadCalendarEvent(slot, options) {
  const blob = new Blob([buildCalendarEvent(slot, options)], {
    type: "text/calendar;charset=utf-8",
  });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "family-meeting.ics";
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function dateStamp(value) {
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`);
  const usable = Number.isFinite(date.getTime()) ? date : new Date();
  return `${usable.getFullYear()}${String(usable.getMonth() + 1).padStart(2, "0")}${String(usable.getDate()).padStart(2, "0")}`;
}

function nextDayStamp(stamp) {
  const year = Number(stamp.slice(0, 4));
  const month = Number(stamp.slice(4, 6)) - 1;
  const day = Number(stamp.slice(6, 8));
  return dateStamp(new Date(year, month, day + 1));
}

// A single all-day calendar entry summarizing the week's plan, with the family
// page URL and lesson list in the description. Works even when the published
// week has no per-day dates.
export function buildWeekCalendar(event = {}) {
  const start = dateStamp(event.dateISO || new Date());
  const url = String(event.url ?? "https://eduwonderlab.com/curriculum/family-connections/");
  const uid = String(event.reference ?? `family-week-${start}`).replace(/[^a-zA-Z0-9-]/g, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EduWonderLab//Family Connections//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}@eduwonderlab.com`,
    `DTSTAMP:${utcStamp(new Date())}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${nextDayStamp(start)}`,
    `SUMMARY:${escapeCalendar(event.title || "This week in math")}`,
    `DESCRIPTION:${escapeCalendar(`${event.description ?? ""}\n\n${url}`.trim())}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `${lines.map(fold).join("\r\n")}\r\n`;
}

export function downloadWeekCalendar(event) {
  const blob = new Blob([buildWeekCalendar(event)], { type: "text/calendar;charset=utf-8" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "this-week-in-math.ics";
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

function escapeCalendar(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function utcStamp(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
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
    slot.format === "phone" ? "Phone call" : slot.format === "in-person" ? "In-person meeting" : "Video meeting";
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
  const blob = new Blob([buildCalendarEvent(slot, options)], { type: "text/calendar;charset=utf-8" });
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = "family-meeting.ics";
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

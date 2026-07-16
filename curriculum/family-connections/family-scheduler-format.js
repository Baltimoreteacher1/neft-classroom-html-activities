const TIME_ZONE = "America/New_York";

function normalizeRange(value) {
  return value
    .replace(/[\u00a0\u2009\u202f]/g, " ")
    .replace(/\s*[–-]\s*/g, "–")
    .trim();
}

export function formatMeetingSlot(slot, language = "en") {
  const locale = language === "es" ? "es-US" : "en-US";
  const start = new Date(slot.startAt);
  const end = new Date(slot.endAt);
  const date = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: TIME_ZONE,
  }).format(start);
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
  const time = normalizeRange(timeFormatter.formatRange(start, end));
  const connector = language === "es" ? "a las" : "at";
  return { date, time, label: `${date} ${connector} ${time}` };
}

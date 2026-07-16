const TIME_ZONE = "America/New_York";
const DURATIONS = new Set([15, 20, 30, 45, 60]);
const BUFFERS = new Set([0, 5, 10, 15]);
const FORMATS = new Set(["phone", "video", "in-person"]);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ACTIVE_STATUSES = new Set(["open", "held", "booked"]);

function fail(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function clean(value, maximum) {
  return String(value ?? "").trim().slice(0, maximum);
}

function dateValue(value, label) {
  const result = clean(value, 10);
  if (!DATE_PATTERN.test(result) || Number.isNaN(Date.parse(`${result}T12:00:00Z`)))
    fail(`${label} must be a valid date.`);
  return result;
}

function timeValue(value, label) {
  const result = clean(value, 5);
  if (!TIME_PATTERN.test(result)) fail(`${label} must be a valid time.`);
  return result;
}

function minutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function addDays(date, count) {
  const next = new Date(`${date}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + count);
  return next.toISOString().slice(0, 10);
}

function localDate(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function zonedParts(date) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
}

function localDateTimeToUtc(date, minuteOfDay) {
  const [year, month, day] = date.split("-").map(Number);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
  let result = new Date(desired);
  for (let iteration = 0; iteration < 2; iteration += 1) {
    const shown = zonedParts(result);
    const shownEpoch = Date.UTC(
      shown.year,
      shown.month - 1,
      shown.day,
      shown.hour,
      shown.minute,
      shown.second,
    );
    result = new Date(result.getTime() + desired - shownEpoch);
  }
  return result;
}

function overlaps(a, b) {
  return new Date(a.startAt) < new Date(b.endAt) && new Date(b.startAt) < new Date(a.endAt);
}

export function normalizeSchedulerState(input = {}) {
  return {
    availabilityRules: structuredClone(
      Array.isArray(input.availabilityRules) ? input.availabilityRules : [],
    ),
    slots: structuredClone(Array.isArray(input.slots) ? input.slots : []),
    requests: structuredClone(Array.isArray(input.requests) ? input.requests : []),
  };
}

export function normalizeAvailabilityRule(input, now = new Date()) {
  const weekdays = [...new Set((Array.isArray(input?.weekdays) ? input.weekdays : []).map(Number))]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);
  if (!weekdays.length) fail("Choose at least one weekday.");
  const startTime = timeValue(input?.startTime, "Start time");
  const endTime = timeValue(input?.endTime, "End time");
  if (minutes(endTime) <= minutes(startTime)) fail("End time must be after start time.");
  const activeStartDate = dateValue(input?.activeStartDate, "Start date");
  const activeEndDate = dateValue(input?.activeEndDate, "End date");
  if (activeEndDate < activeStartDate) fail("End date must be on or after start date.");
  if (activeEndDate < localDate(now)) fail("Availability must include a future date.");
  const durationMinutes = Math.floor(Number(input?.durationMinutes));
  if (!DURATIONS.has(durationMinutes)) fail("Choose a supported meeting duration.");
  const bufferMinutes = Math.floor(Number(input?.bufferMinutes));
  if (!BUFFERS.has(bufferMinutes)) fail("Choose a supported meeting buffer.");
  const format = clean(input?.format, 20);
  if (!FORMATS.has(format)) fail("Choose a valid meeting format.");
  const locationLabel = clean(input?.locationLabel, 80);
  if (!locationLabel) fail("Add a family-safe location label.");
  return {
    id: clean(input?.id, 100),
    weekdays,
    startTime,
    endTime,
    activeStartDate,
    activeEndDate,
    durationMinutes,
    bufferMinutes,
    format,
    locationLabel,
    enabled: input?.enabled !== false,
    timeZone: TIME_ZONE,
  };
}

export function expandAvailabilityRule(rule, now = new Date(), windowDays = 42) {
  if (!rule.enabled) return [];
  const firstDate = [rule.activeStartDate, localDate(now)].sort().at(-1);
  const lastWindowDate = addDays(localDate(now), Math.max(0, windowDays - 1));
  const lastDate = [rule.activeEndDate, lastWindowDate].sort().at(0);
  if (firstDate > lastDate) return [];
  const slots = [];
  for (let date = firstDate; date <= lastDate; date = addDays(date, 1)) {
    if (!rule.weekdays.includes(new Date(`${date}T12:00:00Z`).getUTCDay())) continue;
    for (
      let start = minutes(rule.startTime);
      start + rule.durationMinutes <= minutes(rule.endTime);
      start += rule.durationMinutes + rule.bufferMinutes
    ) {
      const starts = localDateTimeToUtc(date, start);
      if (starts <= now) continue;
      const startAt = starts.toISOString();
      slots.push({
        id: `${rule.id}:${startAt}`,
        ruleId: rule.id,
        startAt,
        endAt: new Date(starts.getTime() + rule.durationMinutes * 60_000).toISOString(),
        durationMinutes: rule.durationMinutes,
        format: rule.format,
        locationLabel: rule.locationLabel,
        status: "open",
        generated: true,
      });
    }
  }
  return slots;
}

export function refreshGeneratedSlots(input, now = new Date()) {
  const state = normalizeSchedulerState(input);
  const retained = state.slots.filter(
    (slot) => !slot.generated || slot.status !== "open" || new Date(slot.startAt) <= now,
  );
  const generated = state.availabilityRules.flatMap((rule) =>
    expandAvailabilityRule(normalizeAvailabilityRule(rule, now), now),
  );
  for (const slot of generated) {
    const existing = retained.find((item) => item.id === slot.id);
    if (existing) continue;
    if (retained.some((item) => ACTIVE_STATUSES.has(item.status) && overlaps(item, slot))) continue;
    if (generated.slice(0, generated.indexOf(slot)).some((item) => overlaps(item, slot))) continue;
    retained.push(slot);
  }
  retained.sort((a, b) => a.startAt.localeCompare(b.startAt));
  return { ...state, slots: retained };
}

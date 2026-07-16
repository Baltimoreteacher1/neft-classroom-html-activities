import assert from "node:assert/strict";
import {
  expandAvailabilityRule,
  normalizeAvailabilityRule,
  normalizeSchedulerState,
  refreshGeneratedSlots,
} from "./scheduler-rules.js";

const now = new Date("2026-10-20T12:00:00.000Z");
const validRule = {
  id: "rule-sunday",
  weekdays: [0],
  startTime: "09:00",
  endTime: "10:00",
  activeStartDate: "2026-10-25",
  activeEndDate: "2026-11-08",
  durationMinutes: 20,
  bufferMinutes: 10,
  format: "video",
  locationLabel: "Online meeting",
  enabled: true,
};

const normalized = normalizeAvailabilityRule(validRule, now);
assert.deepEqual(normalized.weekdays, [0]);
assert.equal(normalized.timeZone, "America/New_York");
assert.throws(() => normalizeAvailabilityRule({ ...validRule, weekdays: [] }, now), /weekday/i);
assert.throws(() => normalizeAvailabilityRule({ ...validRule, bufferMinutes: 7 }, now), /buffer/i);
assert.throws(() => normalizeAvailabilityRule({ ...validRule, endTime: "08:00" }, now), /end time/i);

const expanded = expandAvailabilityRule(normalized, now);
assert.equal(expanded.length, 6, "two starts per Sunday across three Sundays");
assert.equal(expanded[0].startAt, "2026-10-25T13:00:00.000Z", "EDT should remain 9:00 local");
assert.equal(expanded[2].startAt, "2026-11-01T14:00:00.000Z", "EST should remain 9:00 local");
assert.equal(expanded[0].id, `rule-sunday:${expanded[0].startAt}`);
assert.deepEqual(expandAvailabilityRule(normalized, now), expanded, "expansion must be idempotent");

const legacy = normalizeSchedulerState({ slots: [], requests: [] });
assert.deepEqual(legacy.availabilityRules, []);

const firstRefresh = refreshGeneratedSlots(
  { availabilityRules: [normalized], slots: [], requests: [] },
  now,
);
assert.equal(firstRefresh.slots.length, 6);
const secondRefresh = refreshGeneratedSlots(firstRefresh, now);
assert.equal(secondRefresh.slots.length, 6, "refresh must not duplicate generated slots");

const booked = { ...firstRefresh.slots[0], status: "booked" };
const paused = refreshGeneratedSlots(
  { ...firstRefresh, availabilityRules: [{ ...normalized, enabled: false }], slots: [booked, ...firstRefresh.slots.slice(1)] },
  now,
);
assert.deepEqual(paused.slots, [booked], "pausing removes future open slots but preserves bookings");

console.log("Family scheduling rule tests passed.");

import assert from "node:assert/strict";

let formatMeetingSlot;
try {
  ({ formatMeetingSlot } = await import("./family-scheduler-format.js"));
} catch {
  assert.fail("Family meeting slots need a shared compact date/time formatter");
}

const slot = {
  startAt: "2026-07-17T13:15:00.000Z",
  endAt: "2026-07-17T13:45:00.000Z",
};

assert.deepEqual(formatMeetingSlot(slot, "en"), {
  date: "Fri, Jul 17",
  time: "9:15–9:45 AM",
  label: "Fri, Jul 17 at 9:15–9:45 AM",
});

assert.deepEqual(formatMeetingSlot(slot, "es"), {
  date: "vie, 17 de jul",
  time: "9:15–9:45 a.m.",
  label: "vie, 17 de jul a las 9:15–9:45 a.m.",
});

console.log("Family meeting date/time formatting passed.");

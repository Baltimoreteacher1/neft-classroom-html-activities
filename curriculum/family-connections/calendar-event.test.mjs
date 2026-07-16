import assert from "node:assert/strict";
import { buildCalendarEvent } from "./calendar-event.js";

const calendar = buildCalendarEvent(
  {
    startAt: "2026-09-04T20:00:00.000Z",
    endAt: "2026-09-04T20:20:00.000Z",
    durationMinutes: 20,
    format: "video",
    locationLabel: "Online, room 2",
    guardianName: "Private Guardian",
    studentFirstName: "Private Student",
    email: "private@example.com",
    note: "Private note",
  },
  { reference: "request-public", url: "https://eduwonderlab.com/curriculum/family-connections/" },
);

assert.match(calendar, /BEGIN:VCALENDAR\r\n/);
assert.match(calendar, /DTSTART:20260904T200000Z/);
assert.match(calendar, /DTEND:20260904T202000Z/);
assert.match(calendar, /SUMMARY:Family meeting/);
assert.match(calendar, /LOCATION:Online\\, room 2/);
assert.match(calendar, /https:\/\/eduwonderlab\.com\/curriculum\/family-connections\//);
assert.doesNotMatch(calendar, /Private Guardian|Private Student|private@example\.com|Private note/);

console.log("Family meeting calendar tests passed.");

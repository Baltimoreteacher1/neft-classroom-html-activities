import assert from "node:assert/strict";
import {
  createMemorySchedulerStore,
  handleSchedulerRequest,
  normalizeSlot,
  publicSlot,
} from "./scheduler.js";

const now = new Date("2026-09-01T12:00:00.000Z");
const slot = normalizeSlot(
  {
    startAt: "2026-09-03T20:00:00.000Z",
    durationMinutes: 20,
    format: "video",
    locationLabel: "Online meeting",
  },
  now,
);
assert.equal(slot.endAt, "2026-09-03T20:20:00.000Z");
assert.equal(slot.status, "open");
assert.throws(() => normalizeSlot({ ...slot, startAt: "2026-08-01T12:00:00Z" }, now), /future/i);
assert.throws(() => normalizeSlot({ ...slot, format: "telepathy" }, now), /format/i);

const store = createMemorySchedulerStore({
  now: () => now,
  id: (() => {
    let value = 0;
    return (prefix) => `${prefix}-${++value}`;
  })(),
  token: () => "family-response-token",
});

const created = await store.createSlot(slot);
await assert.rejects(
  store.createSlot({ ...slot, startAt: "2026-09-03T20:10:00.000Z", endAt: "2026-09-03T20:30:00.000Z" }),
  /overlap/i,
);
assert.deepEqual(Object.keys(publicSlot(created)).sort(), [
  "durationMinutes",
  "endAt",
  "format",
  "id",
  "locationLabel",
  "startAt",
]);

const request = await store.requestSlot({
  slotId: created.id,
  guardianName: "Jordan Family",
  studentFirstName: "Sam",
  email: "family@example.com",
  note: "We would like to talk about study routines.",
  consent: true,
});
assert.equal(request.status, "pending");
assert.equal((await store.listPublic()).length, 0, "a held slot must disappear publicly");
await assert.rejects(store.requestSlot({ ...request, slotId: created.id }), /available/i);
assert.equal("email" in publicSlot(created), false);

const declined = await store.decide(request.id, "decline");
assert.equal(declined.status, "declined");
assert.equal((await store.listPublic()).length, 1, "declining reopens a future slot");

const invitation = await store.invite({
  slotId: created.id,
  guardianName: "Taylor Family",
  studentFirstName: "Ari",
  email: "taylor@example.com",
  note: "Would this time work for you?",
});
assert.equal(invitation.token, "family-response-token");
const dashboard = await store.dashboard();
assert.equal(dashboard.requests[1].tokenHash.length, 64);
assert.equal(JSON.stringify(await store.listPublic()).includes("taylor@example.com"), false);

const accepted = await store.respond(invitation.token, "accept");
assert.equal(accepted.status, "confirmed");
await assert.rejects(store.respond(invitation.token, "accept"), /used|invalid/i);
assert.equal((await store.dashboard()).slots[0].status, "booked");

const apiStore = createMemorySchedulerStore({ now: () => now });
const apiRequest = (method, path, body) => ({
  request: new Request(`https://eduwonderlab.com/api/family-connections/${path}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
  }),
  params: { path: [path] },
});
assert.equal(
  (await handleSchedulerRequest(apiRequest("GET", "schedule-availability"), apiStore, {})).status,
  200,
);
assert.equal(
  (await handleSchedulerRequest(apiRequest("GET", "schedule-dashboard"), apiStore, {})).status,
  503,
);

console.log("Family meeting scheduler tests passed.");

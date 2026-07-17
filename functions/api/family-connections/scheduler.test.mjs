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
assert.equal(request.status, "confirmed");
assert.equal(request.slot.status, undefined, "public confirmation must not expose internal slot status");
assert.equal((await store.listPublic()).length, 0, "a booked slot must disappear publicly");
await assert.rejects(store.requestSlot({ ...request, slotId: created.id }), /available/i);
assert.equal("email" in publicSlot(created), false);

const cancelled = await store.decide(request.id, "cancel");
assert.equal(cancelled.status, "cancelled");
assert.equal((await store.listPublic()).length, 0, "cancelling must not silently reopen a booking");

const invitationSlot = await store.createSlot({
  ...slot,
  startAt: "2026-09-03T21:00:00.000Z",
  endAt: "2026-09-03T21:20:00.000Z",
});

const invitation = await store.invite({
  slotId: invitationSlot.id,
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
assert.equal((await store.dashboard()).slots[1].status, "booked");

const rule = await store.createRule({
  weekdays: [4],
  startTime: "17:00",
  endTime: "18:00",
  activeStartDate: "2026-09-03",
  activeEndDate: "2026-09-24",
  durationMinutes: 20,
  bufferMinutes: 10,
  format: "video",
  locationLabel: "Online meeting",
  enabled: true,
});
assert.match(rule.id, /^rule-/);
assert.equal((await store.dashboard()).availabilityRules.length, 1);
const refreshed = await store.refreshSlots();
assert.ok(refreshed.generatedCount > 0);
const updatedRule = await store.updateRule({ ...rule, enabled: false });
assert.equal(updatedRule.enabled, false);
assert.equal((await store.dashboard()).slots.some((item) => item.ruleId === rule.id && item.status === "open"), false);
await store.deleteRule(rule.id);
assert.equal((await store.dashboard()).availabilityRules.length, 0);

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

const teacherAccess = { accessConfigured: true, hasTeacherAccess: true };
const apiRule = {
  weekdays: [4],
  startTime: "16:00",
  endTime: "17:00",
  activeStartDate: "2026-09-03",
  activeEndDate: "2026-09-24",
  durationMinutes: 20,
  bufferMinutes: 10,
  format: "phone",
  locationLabel: "Phone call",
  enabled: true,
};
assert.equal(
  (await handleSchedulerRequest(apiRequest("POST", "schedule-rule", apiRule), apiStore, {})).status,
  503,
);
const createRuleResponse = await handleSchedulerRequest(
  apiRequest("POST", "schedule-rule", apiRule),
  apiStore,
  teacherAccess,
);
assert.equal(createRuleResponse.status, 201);
const createRuleBody = await createRuleResponse.json();
assert.equal(createRuleBody.rule.locationLabel, "Phone call");
assert.equal(
  (await handleSchedulerRequest(apiRequest("PUT", "schedule-rule", { ...createRuleBody.rule, enabled: false }), apiStore, teacherAccess)).status,
  200,
);
assert.equal(
  (await handleSchedulerRequest(apiRequest("POST", "schedule-refresh"), apiStore, teacherAccess)).status,
  200,
);
assert.equal(
  (await handleSchedulerRequest(apiRequest("DELETE", "schedule-rule", { id: createRuleBody.rule.id }), apiStore, teacherAccess)).status,
  200,
);

const bookingStore = createMemorySchedulerStore({ now: () => now, id: (prefix) => `${prefix}-public` });
const bookingSlot = await bookingStore.createSlot({
  ...slot,
  startAt: "2026-09-04T20:00:00.000Z",
  endAt: "2026-09-04T20:20:00.000Z",
});
const booking = {
  slotId: bookingSlot.id,
  guardianName: "Jordan Family",
  studentFirstName: "Sam",
  email: "family@example.com",
  note: "Private note",
  consent: true,
};
const notificationTasks = [];
const notifications = [];
const bookingContext = {
  ...apiRequest("POST", "schedule-request", booking),
  waitUntil(task) {
    notificationTasks.push(task);
  },
};
const bookingResponse = await handleSchedulerRequest(
  bookingContext,
  bookingStore,
  {},
  {
    notifyMeeting(meetingRequest) {
      notifications.push(meetingRequest);
    },
  },
);
assert.equal(bookingResponse.status, 201);
await Promise.all(notificationTasks);
assert.equal(notifications.length, 1, "a public booking should trigger one teacher notification");
assert.equal(notifications[0].email, "family@example.com");
assert.equal(notifications[0].studentFirstName, "Sam");
const bookingBody = await bookingResponse.json();
assert.equal(bookingBody.status, "confirmed");
assert.deepEqual(Object.keys(bookingBody).sort(), ["ok", "reference", "slot", "status"]);
assert.equal(JSON.stringify(bookingBody).includes("family@example.com"), false);
assert.equal(
  (await handleSchedulerRequest(apiRequest("POST", "schedule-request", booking), bookingStore, {})).status,
  409,
);

const failureStore = createMemorySchedulerStore({ now: () => now, id: (prefix) => `${prefix}-failure` });
const failureSlot = await failureStore.createSlot({
  ...slot,
  startAt: "2026-09-05T20:00:00.000Z",
  endAt: "2026-09-05T20:20:00.000Z",
});
const failureTasks = [];
const failureContext = {
  ...apiRequest("POST", "schedule-request", { ...booking, slotId: failureSlot.id }),
  waitUntil(task) {
    failureTasks.push(task);
  },
};
const failureResponse = await handleSchedulerRequest(failureContext, failureStore, {}, {
  async notifyMeeting() {
    throw new Error("email provider unavailable");
  },
});
assert.equal(failureResponse.status, 201, "email failure must not undo a confirmed booking");
await assert.doesNotReject(Promise.all(failureTasks));

console.log("Family meeting scheduler tests passed.");

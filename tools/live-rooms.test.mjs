import assert from "node:assert/strict";
import test from "node:test";
import {
  CloudflareRealtimeProvider,
  MockRealtimeProvider,
  providerFor,
} from "../access-practice-lab/src/live/provider.js";
import { makeRooms, roomStatus, roomTransition } from "../access-practice-lab/src/live/rooms.js";

test("mock room assignments are seeded, bounded and contain only aliases", () => {
  const a = makeRooms(12, 3, 123),
    b = makeRooms(12, 3, 123);
  assert.deepEqual(a, b);
  assert.equal(a.length, 4);
  assert.ok(a.every((room) => room.participants.length === 3));
  assert.ok(
    a
      .flatMap((r) => r.participants)
      .every((p) => /^Participant \d+$/.test(p.alias) && !("name" in p)),
  );
  assert.throws(() => makeRooms(2, 1), RangeError);
});

test("mock provider models the rehearsal state machine without creating media", async () => {
  const provider = providerFor();
  assert.ok(provider instanceof MockRealtimeProvider);
  const remote = await provider.createRoom({ id: "t" });
  const joined = roomTransition({ ...makeRooms(2, 2)[0], ...remote }, "join", {
    id: "participant-1",
  });
  assert.equal(joined.participants[0].joined, true);
  const started = roomTransition(joined, "start");
  assert.equal(roomStatus(started), "Recording");
  const stopped = roomTransition(started, "stop");
  assert.equal(roomStatus(stopped), "Processing");
  const recorded = roomTransition(stopped, "recorded");
  assert.deepEqual(recorded.recording, { status: "mock-ready", retentionDays: 30 });
  assert.equal(roomStatus(recorded), "Recorded");
  assert.equal("blob" in recorded.recording, false);
  assert.equal("audio" in recorded.recording, false);
});

test("provider-backed operations stop before provisioning", async () => {
  const provider = providerFor("cloudflare-realtime");
  assert.ok(provider instanceof CloudflareRealtimeProvider);
  assert.equal(provider.enabled, false);
  await assert.rejects(provider.createRoom(), /STOP/);
  await assert.rejects(provider.joinToken(), /STOP/);
});

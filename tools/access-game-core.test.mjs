#!/usr/bin/env node
// Unit test suite for the shared Game Core (`access-practice-lab/src/game-core/`):
// 1. GameFSM.js (IDLE -> BRIEFING -> PLAYING -> FEEDBACK -> ROUND_SUMMARY -> REPLAY_WEAK_SPOTS, Pause/Zen, teardown)
// 2. SoundEngine.js (Web Audio API synth methods, persistent Mute/Unmute toggle)
// 3. ProgressionStore.js (`tlp_games_v2` schema, XP, Streak Shield, weakSpots queue, corrupt storage fallback)

import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanProgression,
  clearWeakSpots,
  emptyProgression,
  FSM_STATES,
  GameFSM,
  getWeakSpots,
  loadProgression,
  PROGRESSION_KEY,
  recordRoundOutcome,
  SCHEMA_VERSION,
  SoundEngine,
  sessionAccuracy,
  toFSMState,
  toLegacyPhase,
  unlockWorldBadge,
} from "../access-practice-lab/src/game-core/index.js";

test("GameFSM transitions deterministically across all 6 canonical states and supports Pause / Zen Mode", () => {
  const log = [];
  const fsm = new GameFSM({
    gameId: "grammar-jungle",
    band: "6-8",
    initialState: FSM_STATES.IDLE,
    zenMode: true,
    onTransition: (e) => log.push(`${e.from}->${e.to}`),
  });

  assert.equal(fsm.getState(), FSM_STATES.IDLE);
  assert.equal(fsm.transition(FSM_STATES.BRIEFING), FSM_STATES.BRIEFING);
  assert.equal(fsm.transition(FSM_STATES.PLAYING), FSM_STATES.PLAYING);
  assert.equal(fsm.transition(FSM_STATES.FEEDBACK), FSM_STATES.FEEDBACK);
  assert.equal(fsm.transition(FSM_STATES.ROUND_SUMMARY), FSM_STATES.ROUND_SUMMARY);
  assert.equal(fsm.transition(FSM_STATES.REPLAY_WEAK_SPOTS), FSM_STATES.REPLAY_WEAK_SPOTS);
  assert.equal(fsm.weakSpotMode, true);

  assert.equal(fsm.togglePause(), true);
  assert.equal(fsm.paused, true);
  assert.equal(fsm.togglePause(false), false);
  assert.equal(fsm.toggleZenMode(false), false);
  assert.equal(fsm.zenMode, false);

  let cleaned = false;
  fsm.registerCleanup(() => {
    cleaned = true;
  });
  fsm.teardown();
  assert.equal(cleaned, true);
  assert.equal(fsm.paused, false);
  assert.ok(log.includes("IDLE->BRIEFING") && log.includes("ROUND_SUMMARY->REPLAY_WEAK_SPOTS"));
});

test("toFSMState and toLegacyPhase map cleanly between studio phases and FSM states", () => {
  assert.equal(toFSMState("start"), FSM_STATES.BRIEFING);
  assert.equal(toFSMState("play"), FSM_STATES.PLAYING);
  assert.equal(toFSMState("play", { inFeedback: true }), FSM_STATES.FEEDBACK);
  assert.equal(toFSMState("play", { isWeakSpotReplay: true }), FSM_STATES.REPLAY_WEAK_SPOTS);
  assert.equal(toFSMState("done"), FSM_STATES.ROUND_SUMMARY);
  assert.equal(toLegacyPhase(FSM_STATES.BRIEFING), "start");
  assert.equal(toLegacyPhase(FSM_STATES.PLAYING), "play");
  assert.equal(
    toLegacyPhase(FSM_STATES.ROUND_SUMMARY, { hasTransfer: true, transferDone: false }),
    "transfer",
  );
  assert.equal(toLegacyPhase(FSM_STATES.ROUND_SUMMARY, { hasTransfer: false }), "done");
});

test("ProgressionStore (`tlp_games_v2`) tracks XP, Streak Shield, Weak Spots, Badges, and recovers from corruption", () => {
  const mem = new Map();
  const read = (k) => mem.get(k) || null;
  const write = (k, v) => mem.set(k, v);

  // Corrupted storage falls back safely to empty v2 schema
  mem.set(PROGRESSION_KEY, "{not-valid-json");
  const initial = loadProgression(read);
  assert.equal(initial.v, SCHEMA_VERSION);
  assert.equal(initial.totalXp, 0);
  assert.equal(initial.streakShield, true);

  // Two first-try correct answers build a 2-streak and earn XP
  recordRoundOutcome({
    gameId: "vocab-quest",
    band: "3-5",
    itemId: "w1",
    skill: "Reading",
    ok: true,
    first: true,
    read,
    write,
  });
  const r2 = recordRoundOutcome({
    gameId: "vocab-quest",
    band: "3-5",
    itemId: "w2",
    skill: "Reading",
    ok: true,
    first: true,
    read,
    write,
  });
  assert.equal(r2.streak, 2);
  assert.ok(r2.progression.totalXp >= 20);

  // A miss at streak >= 2 triggers Streak Shield instead of resetting streak to 0, and queues item in weakSpots
  const miss = recordRoundOutcome({
    gameId: "vocab-quest",
    band: "3-5",
    itemId: "w3",
    skill: "Reading",
    ok: false,
    first: false,
    prompt: "Match word w3",
    read,
    write,
  });
  assert.equal(miss.shieldTriggered, true);
  assert.equal(miss.streak, 2);
  assert.equal(miss.streakShield, false);

  const spots = getWeakSpots("vocab-quest", "3-5", read);
  assert.equal(spots.length, 1);
  assert.equal(spots[0].id, "w3");

  // Mastering the weak spot on the first try removes it from weakSpots
  recordRoundOutcome({
    gameId: "vocab-quest",
    band: "3-5",
    itemId: "w3",
    skill: "Reading",
    ok: true,
    first: true,
    read,
    write,
  });
  assert.equal(getWeakSpots("vocab-quest", "3-5", read).length, 0);

  // Unlocking world badges deduplicates and persists
  unlockWorldBadge("world:3-5:signal-station:m1", read, write);
  unlockWorldBadge("world:3-5:signal-station:m1", read, write);
  const afterBadge = loadProgression(read);
  assert.deepEqual(afterBadge.worldBadges, ["world:3-5:signal-station:m1"]);

  // Accuracy helper
  assert.equal(
    sessionAccuracy([
      { ok: true, first: true },
      { ok: true, first: false },
    ]),
    50,
  );
  clearWeakSpots("vocab-quest", "3-5", read, write);
  assert.deepEqual(cleanProgression(null), emptyProgression());
});

test("SoundEngine toggles mute state safely in Node without throwing", () => {
  assert.equal(typeof SoundEngine.isMuted(), "boolean");
  const prev = SoundEngine.isMuted();
  assert.equal(SoundEngine.setMuted(true), true);
  SoundEngine.playCorrect(2);
  SoundEngine.playCombo(3);
  SoundEngine.playError();
  SoundEngine.playHint();
  SoundEngine.playLevelUp();
  SoundEngine.setMuted(prev);
});

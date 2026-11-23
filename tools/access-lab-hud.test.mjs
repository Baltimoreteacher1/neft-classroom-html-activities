// HUD + Listening policy + world events: the shell-level behavior of Language Lab v2.
import assert from "node:assert/strict";
import test from "node:test";
import { GAME } from "../access-practice-lab/src/games/registry.js";
import { cleanGames, emptyGames } from "../access-practice-lab/src/games/state.js";
import { makeI18n } from "../access-practice-lab/src/i18n.js";
import { hudHTML, micStatus } from "../access-practice-lab/src/lab/hud.js";
import {
  cleanListening,
  clipKey,
  emptyListening,
  playsLeft,
  replayLimit,
  requestPlay,
  slowAllowed,
  toggleSlow,
} from "../access-practice-lab/src/lab/listening.js";
import { cleanEvent, emptyState, readiness } from "../access-practice-lab/src/lab/store.js";

// html`` results are { [Symbol("raw")]: markup }; read the one symbol-keyed value.
const str = (x) => (typeof x === "string" ? x : String(x[Object.getOwnPropertySymbols(x)[0]]));
const hud = (over = {}, id = "word-bingo", mode = "en") =>
  str(
    hudHTML({
      I: makeI18n(mode),
      g: GAME[id],
      band: "6-8",
      session: { support: "B", lab: emptyListening() },
      ...over,
    }),
  );

test("HUD: title, band, four domain badges, tier, language, mic pill and reset are present", () => {
  const h = hud();
  assert.match(h, /Word Bingo/);
  assert.match(h, /Grades 6–8/);
  for (const code of ["L", "R", "S", "W"])
    assert.match(h, new RegExp(`aria-hidden="true">${code}</span`));
  for (const t of ["Independent", "Guided", "Hands-on"]) assert.match(h, new RegExp(t));
  for (const m of ["en", "es", "bi"]) assert.match(h, new RegExp(`data-lang-mode="${m}"`));
  assert.match(h, /EN\+ES/);
  assert.match(h, /class="lh-mic"/);
  assert.match(h, /data-g-again="B"/);
  assert.match(h, /data-g-support="B" aria-pressed="true"/);
  assert.match(h, /data-g-support="C" aria-pressed="false"/);
});

test("HUD: Math Workbench link only when the task is LoMA", () => {
  assert.doesNotMatch(hud(), /math-workbench/);
  assert.doesNotMatch(hud({ contentArea: "LoSc" }), /math-workbench/);
  assert.match(hud({ contentArea: "LoMA" }), /href="\/curriculum\/math-workbench\/"/);
});

test("HUD: ES translates chrome, never the English game title or the domain letters", () => {
  const es = hud({}, "word-bingo", "es");
  assert.match(es, /Independiente/);
  assert.match(es, /Reiniciar/);
  assert.match(es, /Grados 6–8/);
  const bi = hud({}, "word-bingo", "bi");
  assert.match(bi, /Word Bingo/);
});

test("HUD: slow toggle only for Listening games and only above Independent", () => {
  assert.match(hud({ session: { support: "B", lab: emptyListening() } }), /data-lab-slow/);
  assert.doesNotMatch(hud({ session: { support: "C", lab: emptyListening() } }), /data-lab-slow/);
  assert.doesNotMatch(hud({}, "grammar-jungle"), /data-lab-slow/);
});

test("mic pill: a speaking game with no recorder says the learner can type", () => {
  const I = makeI18n("en");
  assert.equal(micStatus(I, { speaking: true, canRecord: false }).key, "fallback");
  assert.equal(micStatus(I, { speaking: true, state: "MIC_BLOCKED_FALLBACK" }).key, "fallback");
  assert.equal(micStatus(I, { speaking: true, state: "RECORDING" }).key, "live");
  assert.equal(micStatus(I, { canSpeak: false }).key, "fallback");
  assert.equal(micStatus(I, {}).key, "ok");
});

test("listening: Independent allows exactly 2 plays; Guided and Hands-on are unlimited with a 0.85x toggle", () => {
  assert.equal(replayLimit("independent"), 2);
  assert.equal(replayLimit("guided"), Infinity);
  let s = emptyListening();
  let r = requestPlay(s, "Put the book on the table.", "independent", 0.9);
  assert.ok(r.ok);
  r = requestPlay(r.state, "Put the book on the table.", "independent", 0.9);
  assert.ok(r.ok);
  assert.equal(playsLeft(r.state, "Put the book on the table.", "independent"), 0);
  const third = requestPlay(r.state, "Put the book on the table.", "independent", 0.9);
  assert.equal(third.ok, false);
  assert.ok(requestPlay(r.state, "A different clip.", "independent").ok);
  s = emptyListening();
  for (let i = 0; i < 25; i++) s = requestPlay(s, "again", "guided").state;
  assert.equal(playsLeft(s, "again", "guided"), Infinity);
  assert.equal(slowAllowed("independent"), false);
  assert.equal(toggleSlow(s, "independent").slow, false);
  const slow = toggleSlow(s, "guided");
  assert.equal(slow.slow, true);
  assert.equal(requestPlay(slow, "x", "guided", 0.9).rate, 0.77);
  assert.equal(requestPlay({ ...slow, slow: true }, "x", "independent", 0.9).rate, 0.9);
});

test("listening: state survives the saved-session cleaner, so a refresh cannot reset replays", () => {
  assert.deepEqual(cleanListening(null), emptyListening());
  assert.deepEqual(cleanListening({ plays: { a: 2, b: -1, c: "x" }, slow: true }), {
    plays: { a: 2 },
    slow: true,
  });
  assert.equal(clipKey("  a   b  "), "a b");
  const games = {
    v: 1,
    sessions: {
      "word-bingo:6-8": {
        game: "word-bingo",
        band: "6-8",
        lab: { plays: { clip: 2 }, slow: false },
      },
    },
    history: [],
  };
  const clean = cleanGames(games);
  assert.deepEqual(clean.sessions["word-bingo:6-8"].lab.plays, { clip: 2 });
  assert.deepEqual(cleanGames(emptyGames()).sessions, {});
});

test("worlds: Language World and adventure mission events validate and count by their own domain", () => {
  const ev = (gameId, widaDomain, timestamp) =>
    cleanEvent({ kind: "mission", gameId, gradeBand: "3-5", widaDomain, timestamp });
  assert.equal(
    ev("world:signal-station", "Listening", "2026-11-22T10:00:00.000Z").widaDomain,
    "Listening",
  );
  assert.ok(ev("world:mystery-museum", "Reading", "2026-11-22T10:00:00.000Z"));
  assert.equal(
    cleanEvent({ gameId: "world:nope", gradeBand: "3-5", timestamp: "2026-11-22T10:00:00.000Z" }),
    null,
  );
  const s = emptyState("2026-11-22T10:00:00.000Z");
  s.events = [
    ev("world:mystery-museum", "Reading", "2026-11-22T10:00:00.000Z"),
    ev("world:signal-station", "Listening", "2026-11-22T11:00:00.000Z"),
  ];
  const r = readiness(s, { band: "3-5" });
  assert.ok(r.Reading > 0 && r.Listening > 0);
  assert.equal(r.Writing, 0);
  assert.equal(r.Speaking, 0);
});

// Language Lab v2 core: state store (migration, validation, merge, derived views), URL contract,
// error-tag analyzer and the AudioGuard state machine. Pure Node: no browser, no device.
import assert from "node:assert/strict";
import test from "node:test";
import { GAME } from "../access-practice-lab/src/games/registry.js";
import {
  AG,
  classifyError,
  createAudioGuard,
  next,
  TRANSITIONS,
} from "../access-practice-lab/src/lab/audio-guard.js";
import {
  ALL_GAME_META,
  contentAreaOfRoute,
  gameMeta,
  normalizeLang,
  normalizeTier,
} from "../access-practice-lab/src/lab/meta.js";
import {
  labQueryString,
  labRoutes,
  readLabQuery,
  supportFromQuery,
} from "../access-practice-lab/src/lab/query.js";
import {
  cleanEvent,
  emptyState,
  loadLab,
  mergeLab,
  migrateLegacyGames,
  migrateState,
  readiness,
  recordEvent,
  SCHEMA_VERSION,
  topErrorTags,
  validateState,
} from "../access-practice-lab/src/lab/store.js";
import {
  analyzeSentence,
  ERROR_TAGS,
  primaryTag,
  remediationGame,
} from "../access-practice-lab/src/lab/tags.js";

const T0 = "2026-11-22T10:00:00.000Z";
const memory = () => {
  const m = new Map();
  return { read: (k) => (m.has(k) ? m.get(k) : null), write: (k, v) => m.set(k, v), m };
};

test("every game has metadata with a domain and a content area", () => {
  assert.ok(ALL_GAME_META.length >= 23);
  for (const g of ALL_GAME_META) {
    assert.ok(["Listening", "Reading", "Speaking", "Writing"].includes(g.primaryDomain), g.id);
    assert.ok(g.domains.length >= 1, g.id);
  }
  assert.equal(gameMeta("escape-room").contentArea, "LoSc");
  assert.equal(gameMeta("nope"), null);
});

test("Math Workbench scope: only LoMA routes", () => {
  assert.equal(contentAreaOfRoute({ view: "games", id: "grammar-jungle" }), "LoELA");
  assert.equal(contentAreaOfRoute({ view: "games", id: "escape-room" }), "LoSc");
  assert.equal(contentAreaOfRoute({ view: "language-studios", mathBridge: { x: 1 } }), "LoMA");
  assert.equal(contentAreaOfRoute({ view: "home" }), "LoELA");
});

test("URL contract: band/lang/support parse, alias and round-trip", () => {
  assert.deepEqual(readLabQuery("?band=6-8&lang=en-es&support=guided"), {
    band: "6-8",
    lang: "bi",
    tier: "guided",
  });
  assert.deepEqual(readLabQuery("?grades=3-5&mode=C&lang=ES"), {
    band: "3-5",
    lang: "es",
    tier: "independent",
  });
  assert.deepEqual(readLabQuery("?band=9&lang=fr&support=x"), { band: "", lang: "", tier: "" });
  assert.equal(supportFromQuery("?support=hands-on"), "A");
  assert.equal(
    labQueryString({ band: "6-8", lang: "bi", tier: "guided" }),
    "?band=6-8&lang=en-es&support=guided",
  );
  assert.equal(labQueryString({}), "");
  assert.equal(
    labRoutes.game("grammar-jungle", { band: "3-5" }),
    "/access-practice-lab/games/grammar-jungle?band=3-5",
  );
  assert.equal(labRoutes.road(3), "/access-practice-lab/road/3");
  assert.equal(normalizeLang("en+es"), "bi");
  assert.equal(normalizeTier("Hands_on"), "hands-on");
});

test("store: empty state validates; garbage migrates to a valid state", () => {
  assert.ok(validateState(emptyState(T0)).ok);
  for (const junk of [
    null,
    undefined,
    5,
    "x",
    [],
    { events: "no" },
    { schemaVersion: 99, events: [{ gameId: "zzz" }] },
  ]) {
    const s = migrateState(junk, T0);
    assert.equal(s.schemaVersion, SCHEMA_VERSION);
    assert.ok(validateState(s).ok, JSON.stringify(junk));
  }
  assert.equal(validateState({ schemaVersion: 1 }).ok, false);
});

test("store: events are cleaned, carry no PII fields, and drop what cannot be real", () => {
  const e = cleanEvent({
    gameId: "grammar-jungle",
    gradeBand: "6-8",
    scaffoldTier: "guided",
    languageErrorTag: "MISSING_SUBJECT",
    timestamp: T0,
    name: "Maria",
    text: "secret",
  });
  assert.deepEqual(Object.keys(e).sort(), [
    "gameId",
    "gradeBand",
    "kind",
    "languageErrorTag",
    "ok",
    "scaffoldTier",
    "timestamp",
    "widaContentArea",
    "widaDomain",
  ]);
  assert.equal(e.widaDomain, "Writing");
  assert.equal(cleanEvent({ gameId: "grammar-jungle", gradeBand: "9", timestamp: T0 }), null);
  assert.equal(cleanEvent({ gameId: "ghost", gradeBand: "6-8", timestamp: T0 }), null);
  assert.equal(
    cleanEvent({ gameId: "grammar-jungle", gradeBand: "6-8", timestamp: "yesterday" }),
    null,
  );
  assert.equal(
    cleanEvent({
      gameId: "grammar-jungle",
      gradeBand: "6-8",
      timestamp: T0,
      languageErrorTag: "BOGUS",
    }).languageErrorTag,
    null,
  );
});

test("store: legacy games history migrates once, idempotently", () => {
  const games = {
    history: [
      {
        id: "a",
        game: "grammar-jungle",
        band: "6-8",
        support: "C",
        at: "2026-11-01T10:00:00.000Z",
      },
      { id: "b", game: "vocab-quest", band: "3-5", support: "A", at: "2026-11-02T10:00:00.000Z" },
      { id: "c", game: "ghost", band: "3-5", support: "A", at: "2026-11-02T10:00:00.000Z" },
    ],
  };
  const once = migrateLegacyGames(emptyState(T0), games);
  assert.equal(once.events.length, 2);
  assert.equal(once.events[0].scaffoldTier, "independent");
  assert.equal(once.events[1].scaffoldTier, "hands-on");
  assert.equal(migrateLegacyGames(once, games).events.length, 2);
  const mem = memory();
  mem.write("accessPracticeLab:v1:games", JSON.stringify(games));
  assert.equal(loadLab({ read: mem.read, now: T0 }).events.length, 2);
});

test("store: recordEvent persists and mergeLab unions without duplicates", () => {
  const mem = memory();
  const deps = { read: mem.read, write: mem.write };
  recordEvent(
    {
      kind: "mission",
      gameId: "fluency-echo",
      gradeBand: "6-8",
      scaffoldTier: "guided",
      timestamp: T0,
    },
    deps,
  );
  recordEvent(
    {
      kind: "round",
      gameId: "fluency-echo",
      gradeBand: "6-8",
      languageErrorTag: "CONNECTOR_MISSING",
      ok: false,
      timestamp: "2026-11-22T10:01:00.000Z",
    },
    deps,
  );
  recordEvent({ gameId: "ghost", gradeBand: "6-8" }, deps);
  const a = loadLab(deps);
  assert.equal(a.events.length, 2);
  const b = mergeLab(a, a);
  assert.equal(b.events.length, 2);
  const c = mergeLab(a, {
    schemaVersion: 2,
    events: [
      {
        gameId: "word-bingo",
        gradeBand: "3-5",
        timestamp: "2026-11-21T10:00:00.000Z",
        kind: "mission",
      },
    ],
  });
  assert.equal(c.events.length, 3);
  assert.ok(validateState(c).ok);
});

test("store: readiness is practice coverage by domain; topErrorTags ranks by count", () => {
  const s = emptyState(T0);
  const mission = (gameId, timestamp) => ({ kind: "mission", gameId, gradeBand: "6-8", timestamp });
  s.events = [
    mission("fluency-echo", "2026-11-20T10:00:00.000Z"),
    mission("word-bingo", "2026-11-20T11:00:00.000Z"),
  ].map(cleanEvent);
  const r = readiness(s, { band: "6-8" });
  assert.ok(r.Speaking > 0 && r.Listening > 0 && r.Writing === 0);
  assert.ok(Object.values(r).every((v) => v >= 0 && v <= 1));
  const tag = (t, ts) =>
    cleanEvent({
      kind: "round",
      gameId: "sentence-factory",
      gradeBand: "6-8",
      languageErrorTag: t,
      ok: false,
      timestamp: ts,
    });
  s.events = [
    tag("MISSING_SUBJECT", "2026-11-20T10:00:00.000Z"),
    tag("MISSING_SUBJECT", "2026-11-21T10:00:00.000Z"),
    tag("CONNECTOR_MISSING", "2026-11-22T10:00:00.000Z"),
    tag("ADJECTIVE_ORDER", "2026-11-19T10:00:00.000Z"),
  ];
  assert.deepEqual(
    topErrorTags(s, 2).map((x) => x.tag),
    ["MISSING_SUBJECT", "CONNECTOR_MISSING"],
  );
});

test("tags: every tag has bilingual copy and a real remediation game", () => {
  for (const [id, t] of Object.entries(ERROR_TAGS)) {
    assert.ok(t.en && t.es && t.hintEn && t.hintEs, id);
    assert.ok(GAME[remediationGame(id)], `${id} -> ${t.game}`);
  }
});

test("tags: analyzer flags the pattern and leaves correct sentences alone", () => {
  const cases = [
    ["Goes to school every day.", "MISSING_SUBJECT"],
    ["Is raining.", "MISSING_SUBJECT"],
    ["It is raining.", null],
    ["Is it raining?", null],
    ["The car red is fast.", "ADJECTIVE_ORDER"],
    ["I have a red big bag.", "ADJECTIVE_ORDER"],
    ["I have a big red bag.", null],
    ["The dog is red.", null],
    ["Yesterday we go to the park.", "VERB_TENSE_SHIFT"],
    ["She walked home and eats dinner.", "VERB_TENSE_SHIFT"],
    ["I want to go home.", null],
    ["Yesterday we did not go home.", null],
    ["I was tired, I went to bed.", "CONNECTOR_MISSING"],
    ["I was tired so I went to bed.", null],
    ["When it rained, we stayed inside.", null],
    ["We lost the game; however, they played well.", null],
    ["He go to school.", "SUBJECT_VERB_AGREEMENT"],
    ["They is happy.", "SUBJECT_VERB_AGREEMENT"],
    ["She goes to school.", null],
  ];
  for (const [text, want] of cases) assert.equal(primaryTag(text), want, text);
  assert.equal(analyzeSentence("").length, 0);
  assert.equal(analyzeSentence(null).length, 0);
});

const fakeDeps = ({ supported = true, openError = null, recordError = null } = {}) => {
  const log = [];
  return {
    log,
    supported: () => supported,
    openMonitor: async (onLevel) => {
      if (openError) throw openError;
      onLevel(0.4);
      let ended = () => {};
      return {
        close: () => log.push("monitor-closed"),
        onEnded: (fn) => {
          ended = fn;
        },
        end: () => ended(),
      };
    },
    startRecording: async (_key, { onLevel, onEnded }) => {
      if (recordError) throw recordError;
      onLevel(0.6);
      log.push("recording");
      return {
        stop: async () => {
          onEnded([{ url: "blob:x", seconds: 3 }], {});
        },
        takes: () => [{ url: "blob:x", seconds: 3 }],
      };
    },
  };
};

test("AudioGuard: happy path walks the whole machine", async () => {
  const seen = [];
  const g = createAudioGuard({ deps: fakeDeps(), onChange: (s) => seen.push(s.state) });
  assert.equal(g.state, AG.IDLE);
  await g.request();
  assert.equal(g.state, AG.MONITORING_LEVEL);
  await g.record();
  assert.equal(g.state, AG.RECORDING);
  await g.stop();
  assert.equal(g.state, AG.PLAYBACK_READY);
  assert.equal(g.snapshot().take.seconds, 3);
  assert.deepEqual(
    [...new Set(seen)],
    [AG.REQUESTING_MIC, AG.MONITORING_LEVEL, AG.RECORDING, AG.PLAYBACK_READY],
  );
  await g.retake();
  assert.equal(g.state, AG.MONITORING_LEVEL);
  g.reset();
  assert.equal(g.state, AG.IDLE);
});

test("AudioGuard: unavailable, denied, absent and busy devices fall back and never throw", async () => {
  const noApi = createAudioGuard({ deps: fakeDeps({ supported: false }) });
  await noApi.request();
  assert.equal(noApi.state, AG.MIC_BLOCKED_FALLBACK);
  assert.equal(noApi.snapshot().reason, "unsupported");
  const noDeps = createAudioGuard({ deps: undefined });
  await noDeps.request();
  assert.equal(noDeps.state, AG.MIC_BLOCKED_FALLBACK);
  for (const [name, reason] of [
    ["NotAllowedError", "denied"],
    ["NotFoundError", "absent"],
    ["NotReadableError", "busy"],
    ["Weird", "failed"],
  ]) {
    const g = createAudioGuard({
      deps: fakeDeps({ openError: Object.assign(new Error("x"), { name }) }),
    });
    await g.request();
    assert.equal(g.state, AG.MIC_BLOCKED_FALLBACK, name);
    assert.equal(g.snapshot().reason, reason, name);
    assert.equal(g.snapshot().fallback, true);
  }
  const retry = createAudioGuard({ deps: fakeDeps({ supported: false }) });
  await retry.request();
  await retry.retry();
  assert.equal(retry.state, AG.MIC_BLOCKED_FALLBACK);
  assert.equal(classifyError(undefined), "failed");
});

test("AudioGuard: unplugged device mid-monitor and a recorder that will not start both land in the fallback", async () => {
  const deps = fakeDeps();
  let monitor;
  const orig = deps.openMonitor;
  deps.openMonitor = async (cb) => (monitor = await orig(cb));
  const g = createAudioGuard({ deps });
  await g.request();
  monitor.end();
  assert.equal(g.state, AG.MIC_BLOCKED_FALLBACK);
  assert.equal(g.snapshot().reason, "interrupted");
  const bad = createAudioGuard({
    deps: fakeDeps({ recordError: Object.assign(new Error("x"), { name: "NotAllowedError" }) }),
  });
  await bad.request();
  await bad.record();
  assert.equal(bad.state, AG.MIC_BLOCKED_FALLBACK);
});

test("AudioGuard: an abandoned request cannot move a later one; unlisted events are ignored", async () => {
  let release;
  const deps = fakeDeps();
  deps.openMonitor = () =>
    new Promise((res) => {
      release = () => res({ close() {}, onEnded() {} });
    });
  const g = createAudioGuard({ deps });
  const pending = g.request();
  g.reset();
  release();
  await pending;
  assert.equal(g.state, AG.IDLE);
  assert.equal(next(AG.IDLE, "STOP"), AG.IDLE);
  assert.equal(Object.keys(TRANSITIONS).length, 6);
});

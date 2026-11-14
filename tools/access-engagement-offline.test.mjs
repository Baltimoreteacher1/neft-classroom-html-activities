#!/usr/bin/env node
// Package E: Passport culture cards and Trip journal, a personal goal before a journey mission, and offline week packs
// (src/offline-pack.js + the sw.js "cache-urls" handler, run in a vm sandbox with a fake Cache API).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import {
  CARD_KINDS,
  cardStop,
  cardUnlocks,
  PASSPORT_CARDS,
  unlockedCards,
} from "../access-practice-lab/src/content/passport-cards.js";
import { KLUS, MISSIONS } from "../access-practice-lab/src/journey/curriculum.js";
import {
  cleanGoal,
  GOAL_IDS,
  GOALS,
  goalEvidence,
  goalOptions,
} from "../access-practice-lab/src/journey/goal.js";
import * as St from "../access-practice-lab/src/journey/state.js";
import { COUNTRIES, routeProgress } from "../access-practice-lab/src/journey.js";
import {
  formatBytes,
  mediaPaths,
  packName,
  weekPackUrls,
} from "../access-practice-lab/src/offline-pack.js";
import {
  getJournal,
  journalEntries,
  journalKey,
  journalPatch,
  MAX_LINE,
} from "../access-practice-lab/src/trip-journal.js";
import { CORE_DOMAINS, LEVEL_KEYS } from "../access-practice-lab/src/util.js";

const ALL_COUNTRIES = CORE_DOMAINS.flatMap((d) => LEVEL_KEYS.map((l) => COUNTRIES[d][l]));

// ── 1. Passport culture cards ──────────────────────────────────────────────────
test("every country has four culture cards, each in English and Spanish with a family prompt", () => {
  assert.equal(ALL_COUNTRIES.length, 12);
  for (const [en] of ALL_COUNTRIES) {
    const cards = PASSPORT_CARDS[en];
    assert.ok(cards, `${en} has cards`);
    assert.deepEqual(
      cards.map((c) => c.kind),
      CARD_KINDS,
      `${en}: greeting, place, food, tradition`,
    );
    for (const c of cards) {
      for (const field of ["title", "text", "ask"]) {
        assert.equal(c[field].length, 2, `${en} ${c.kind} ${field} has EN and ES`);
        assert.ok(
          c[field].every((s) => typeof s === "string" && s.trim().length > 1),
          `${en} ${c.kind} ${field} filled`,
        );
      }
      assert.notEqual(
        c.text[0],
        c.text[1],
        `${en} ${c.kind}: Spanish text is a translation, not a copy`,
      );
      assert.match(c.ask[0], /^Ask someone at home: /);
      assert.match(c.ask[1], /^Pregunta a alguien en casa: /);
      assert.ok(c.text[0].length <= 220, `${en} ${c.kind}: short enough for grades 3-8`);
      assert.doesNotMatch(
        c.text.join(" "),
        /\ball (?:people|of them)\b|\btodos los (?:mexicanos|japoneses)\b/i,
      );
    }
  }
  assert.equal(Object.keys(PASSPORT_CARDS).length, 12, "no cards for countries off the trip");
});

test("a card opens at every third stop of a 12-stop route, and in proportion on shorter routes", () => {
  assert.deepEqual(
    Array.from({ length: 13 }, (_, done) => cardUnlocks(done, 12)),
    [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4],
  );
  assert.deepEqual(
    [0, 1, 2, 3].map((k) => cardStop(k, 12)),
    [3, 6, 9, 12],
  );
  assert.deepEqual(
    Array.from({ length: 6 }, (_, done) => cardUnlocks(done, 5)),
    [0, 0, 1, 2, 3, 4],
  );
  assert.equal(cardUnlocks(1, 1), 4, "a one-stop route opens every card at its end");
  assert.equal(cardUnlocks(99, 12), 4, "never more than four");
  assert.equal(cardUnlocks(3, 0), 0);
  assert.equal(cardUnlocks("x", 12), 0);
  assert.deepEqual(
    unlockedCards("Japan", 6, 12).map((c) => c.kind),
    ["greeting", "place"],
  );
  assert.deepEqual(unlockedCards("Atlantis", 12, 12), []);
});

// ── 2. Trip journal ───────────────────────────────────────────────────────────
const rows = (domain, level, n, doneIdx = []) =>
  Array.from({ length: n }, (_, i) => ({
    id: `${domain}-${level}-${i}`,
    domain,
    level,
    band: "3-5",
    record: { complete: doneIdx.includes(i) ? [`${domain}-${level}-${i}`] : [], results: {} },
  }));

test("the journal has one entry per finished stop, with the activities done there", () => {
  const routes = routeProgress([
    ...rows("Listening", "A", 12, [0, 2]),
    ...rows("Reading", "B", 24, [0, 1]),
  ]);
  const titles = new Map([
    ["Listening-A-0", "Lunch line"],
    ["Reading-B-0", "Map key"],
    ["Reading-B-1", "River trip"],
  ]);
  const key = journalKey("3-5", "Listening", "A", 1);
  const groups = journalEntries("3-5", routes, titles, {
    [key]: "I learned to listen for numbers.",
  });
  assert.deepEqual(
    groups.map((g) => g.country[0]),
    ["Japan", "Peru"],
  );
  const japan = groups[0];
  assert.deepEqual(
    japan.entries.map((e) => e.stop),
    [1, 3],
  );
  assert.deepEqual(japan.entries[0].activities, ["Lunch line"]);
  assert.equal(japan.entries[0].line, "I learned to listen for numbers.");
  assert.deepEqual(
    japan.entries[1].activities,
    ["Listening-A-2"],
    "falls back to the id without a title",
  );
  assert.deepEqual(
    groups[1].entries[0].activities,
    ["Map key", "River trip"],
    "two activities share a stop in 6-8 sized routes",
  );
});

test("journal lines are cleaned, capped, removable and saved in the preferences record", () => {
  const key = journalKey("6-8", "Writing", "C", 12);
  let prefs = { lang: "en" };
  prefs = { ...prefs, ...journalPatch(prefs, key, "  <b>Ni hao</b>\n means hello  ") };
  assert.deepEqual(getJournal(prefs), { [key]: "b Ni hao /b means hello" });
  prefs = { ...prefs, ...journalPatch(prefs, key, "x".repeat(500)) };
  assert.equal(getJournal(prefs)[key].length, MAX_LINE);
  prefs = { ...prefs, ...journalPatch(prefs, key, "   ") };
  assert.deepEqual(getJournal(prefs), {});
  assert.deepEqual(
    journalPatch({}, "../../evil", "x"),
    { tripJournal: {} },
    "unknown keys are never stored",
  );
  assert.deepEqual(
    getJournal({
      tripJournal: { "3-5|Reading:A:13": "x", "3-5|Reading:A:2": 7, "3-5|Reading:A:3": "ok" },
    }),
    {
      "3-5|Reading:A:3": "ok",
    },
  );
  assert.deepEqual(getJournal({ tripJournal: [] }), {});
});

// ── 3. Personal goal before a mission ──────────────────────────────────────────
test("each mission offers three or four goals tied to its Key Language Use, in English and Spanish", () => {
  for (const klu of KLUS) {
    const opts = goalOptions(klu);
    assert.ok(opts.length >= 3 && opts.length <= 4, `${klu}: ${opts}`);
    assert.equal(GOALS[opts[0]].klu, klu, `${klu}: the first goal is the skill's own`);
    assert.equal(new Set(opts).size, opts.length);
  }
  for (const id of GOAL_IDS)
    assert.ok(
      GOALS[id].label.every((s) => s.length > 3),
      id,
    );
  for (const m of Object.values(MISSIONS)) assert.ok(KLUS.includes(m.klu));
});

test("the goal is stored with the mission record, survives parsing and import, and is never a score", () => {
  const band = "3-5";
  const at = "2026-11-14T10:00:00.000Z";
  let s = St.setGoal(St.emptyState(), band, "m01", "order", at);
  assert.deepEqual(St.parseState(JSON.stringify(s)).bands[band].missions.m01.goal, {
    id: "order",
    met: null,
    at,
  });
  assert.equal(
    St.missionStatus(s, band, "m01"),
    "not-started",
    "choosing a goal does not start the mission",
  );
  s = St.setGoalMet(s, band, "m01", "partly", at);
  assert.equal(St.parseState(s).bands[band].missions.m01.goal.met, "partly");
  assert.equal(St.setGoalMet(s, band, "m01", "great"), s, "only yes / partly / not yet");
  assert.equal(St.setGoal(s, band, "m01", "nope"), s);
  assert.equal(
    St.setGoalMet(St.emptyState(), band, "m02", "yes").bands[band],
    undefined,
    "no answer without a goal",
  );
  const skipped = St.setGoal(St.emptyState(), band, "m02", "skip", at);
  assert.deepEqual(St.parseState(skipped).bands[band].missions.m02.goal, { skipped: true, at });
  const merged = St.mergeJourney(St.emptyState(), s);
  assert.equal(merged.bands[band].missions.m01.goal.id, "order", "import carries the goal");
  const local = St.setGoal(St.emptyState(), band, "m01", "own", at);
  assert.equal(
    St.mergeJourney(local, s).bands[band].missions.m01.goal.id,
    "own",
    "this device's goal wins",
  );
  assert.equal(cleanGoal({ id: "order", met: 3 }).met, null);
  assert.equal(cleanGoal({ score: 9 }), null);
});

test("goal evidence comes from what the lab already recorded", () => {
  const record = {
    first: { features: { linkKinds: 1, academic: 2, cites: 0, complex: 1 } },
    revision: { changed: true, observable: [{}, {}] },
    independent: { features: { linkKinds: 3, academic: 4, cites: 1, complex: 2 } },
  };
  const mission = {
    steps: { build: { help: ["vocab"] }, show: { status: "done", stage: "independent", help: [] } },
  };
  assert.deepEqual(
    goalEvidence("order", record, mission).map((l) => l[0]),
    [
      "Ways of linking ideas in my first response: 1",
      "Ways of linking ideas when I worked on my own: 3",
    ],
  );
  assert.match(goalEvidence("clearer", record, mission)[0][0], /Changes I made when I revised: 2/);
  assert.deepEqual(
    goalEvidence("own", record, mission).map((l) => l[0]),
    ["Steps where I opened help: 1 of 6", "Show step: done on my own"],
  );
  assert.match(goalEvidence("words", null, null)[0][0], /no counts/);
  for (const id of GOAL_IDS)
    for (const [en, es] of goalEvidence(id, record, mission)) {
      assert.ok(en && es);
      assert.doesNotMatch(`${en} ${es}`, /score|level|percent|puntaje|nivel/i);
    }
});

// ── 4. Offline week packs: the page side ───────────────────────────────────────
test("a week pack lists the week's pages, the content they read and the pictures they reference", () => {
  const week = { n: 4, activities: ["L1", "S1", "missing"] };
  const packRows = [
    { id: "L1", domain: "Listening", level: "A" },
    { id: "S1", domain: "Speaking", level: "B" },
    { id: "X", domain: "Reading", level: "A" },
  ];
  const activities = [
    {
      id: "L1",
      pictures: [{ src: "pictures/35-listening-classroom.svg" }],
      audio: "audio/clip.mp3",
    },
    {
      id: "S1",
      choices: [{ picture: { src: "pictures/35-park.svg" } }, { text: "pictures are fun" }],
      bad: "../pictures/x.svg",
    },
  ];
  const out = weekPackUrls({
    band: "3-5",
    week,
    rows: packRows,
    activities,
    hrefOf: (a) => `/access-practice-lab/${a.domain}/${a.level}/${a.id}`,
  });
  assert.deepEqual(out.routes, [
    "/access-practice-lab/road/4?grades=3-5",
    "/access-practice-lab/Listening/A/L1?grades=3-5",
    "/access-practice-lab/Speaking/B/S1?grades=3-5",
  ]);
  assert.ok(out.content.includes("/access-practice-lab/content/g3-5/Listening.json"));
  assert.ok(out.content.includes("/access-practice-lab/content/g3-5/Speaking.json"));
  assert.ok(!out.content.some((u) => u.includes("Reading.json")), "only the week's domains");
  assert.ok(out.content.includes("/access-practice-lab/content/index.json"));
  assert.deepEqual(out.media, [
    "/access-practice-lab/audio/clip.mp3",
    "/access-practice-lab/pictures/35-listening-classroom.svg",
    "/access-practice-lab/pictures/35-park.svg",
  ]);
  assert.equal(new Set(out.urls).size, out.urls.length);
  assert.deepEqual(
    [...mediaPaths({ a: ["pictures/a.png", "https://x.test/pictures/b.png"] })],
    ["pictures/a.png"],
  );
  assert.equal(packName("3-5", 4), "road-3-5-w4");
  assert.equal(packName("K", "2"), "road-k-w2");
  assert.equal(formatBytes(1536), "2 KB");
  assert.equal(formatBytes(3 * 1024 * 1024), "3.0 MB");
});

// ── 5. Offline week packs: the worker ─────────────────────────────────────────
const ORIGIN = "https://eduwonderlab.com";
const swSource = readFileSync(new URL("../access-practice-lab/sw.js", import.meta.url), "utf8");
class FakeCache {
  map = new Map();
  key = (k) => (typeof k === "string" ? new URL(k, ORIGIN).href : k.url);
  async put(k, r) {
    this.map.set(this.key(k), r);
  }
  async match(k) {
    return this.map.get(this.key(k))?.clone();
  }
}
function loadWorker() {
  const stores = new Map();
  const state = { online: true, fetched: [] };
  class SWRequest extends Request {
    constructor(input, init) {
      super(typeof input === "string" ? new URL(input, ORIGIN) : input, init);
    }
  }
  const sandbox = {
    URL,
    Request: SWRequest,
    Response,
    Headers,
    Promise,
    setTimeout,
    module: { exports: {} },
    self: { location: { origin: ORIGIN } },
    caches: {
      open: async (n) => (stores.has(n) ? stores.get(n) : stores.set(n, new FakeCache()).get(n)),
      match: async (k) => {
        for (const c of stores.values()) {
          const hit = await c.match(k);
          if (hit) return hit;
        }
      },
      has: async (n) => stores.has(n),
      keys: async () => [...stores.keys()],
      delete: async (n) => stores.delete(n),
    },
    fetch: async (r) => {
      const url = typeof r === "string" ? r : r.url;
      state.fetched.push(url);
      if (!state.online) throw new TypeError("offline");
      if (url.includes("missing")) return new Response("no", { status: 404 });
      return new Response(`body of ${new URL(url).pathname}`, {
        headers: { "content-type": url.endsWith("app-shell") ? "text/html" : "application/json" },
      });
    },
  };
  vm.runInNewContext(swSource, sandbox);
  return { sw: sandbox.module.exports, stores, state };
}

test("the worker refuses URLs from other sites or outside the lab", () => {
  const { sw } = loadWorker();
  const plan = sw.packPlan(
    [
      "/access-practice-lab/content/g3-5/Listening.json",
      "/access-practice-lab/Listening/A/L1?grades=3-5",
      "https://evil.example/access-practice-lab/content/x.json",
      "//evil.example/x.svg",
      "/api/progress",
      "/access-practice-lab/sw.js",
      "/access-practice-lab/config.json",
      "/assets/other.css",
      "javascript:alert(1)",
      "/access-practice-lab/content/g3-5/Listening.json",
    ],
    ORIGIN,
  );
  assert.deepEqual([...plan.files], [`${ORIGIN}/access-practice-lab/content/g3-5/Listening.json`]);
  assert.deepEqual([...plan.pages], [`${ORIGIN}/access-practice-lab/Listening/A/L1?grades=3-5`]);
  assert.equal(plan.refused.length, 7);
  assert.equal(sw.packPlan("not a list", ORIGIN).files.length, 0);
});

test("cache-urls saves a pack with progress and size, survives a deploy, and answers offline", async () => {
  const { sw, stores, state } = loadWorker();
  await sw.precache();
  const progress = [];
  const summary = await sw.cachePack(
    {
      name: "road-3-5-w4",
      urls: [
        "/access-practice-lab/Listening/A/L1?grades=3-5",
        "/access-practice-lab/content/g3-5/Listening.json",
        "/access-practice-lab/pictures/35-park.svg",
        "/access-practice-lab/pictures/missing.svg",
        "https://cdn.example/x.js",
      ],
    },
    (p) => progress.push({ ...p }),
  );
  assert.equal(summary.saved, 2);
  assert.equal(summary.failed, 1);
  assert.equal(summary.refused, 1);
  assert.equal(summary.pages, 1);
  assert.ok(summary.bytes > 0);
  assert.equal(progress.at(-1).done, 3);
  assert.equal(progress.at(-1).total, 3);
  assert.ok(
    progress.every((p, i) => !i || p.done >= progress[i - 1].done),
    "progress only moves forward",
  );
  assert.ok(
    !state.fetched.some((u) => u.includes("/Listening/A/L1")),
    "pages are not fetched: the shell answers them",
  );
  assert.ok(
    !state.fetched.some((u) => u.startsWith("https://cdn.example")),
    "cross-origin is never fetched",
  );
  const pack = stores.get("ewl-offline-road-3-5-w4");
  assert.ok(await pack.match("/access-practice-lab/content/g3-5/Listening.json"));
  const manifest = await (await pack.match("/access-practice-lab/__offline-pack.json")).json();
  assert.equal(manifest.saved, 2);
  await assert.rejects(sw.cachePack({ name: "../evil", urls: [] }), /bad pack name/);

  // A later deploy clears old builds but keeps the pack.
  stores.set("ewl-access-older", new FakeCache());
  stores.set("ewl-access-newest", new FakeCache());
  await sw.dropOldCaches();
  assert.ok(stores.has("ewl-offline-road-3-5-w4"), "dropOldCaches never deletes a week pack");

  // Offline: the content file comes from the pack, and a saved page's navigation gets the shell.
  state.online = false;
  const content = await sw.freshResponse(
    new Request(`${ORIGIN}/access-practice-lab/content/g3-5/Listening.json`),
  );
  assert.equal(await content.text(), "body of /access-practice-lab/content/g3-5/Listening.json");
  const navReq = new Request(`${ORIGIN}/access-practice-lab/Listening/A/L1?grades=3-5`);
  Object.defineProperty(navReq, "mode", { value: "navigate" });
  assert.equal(sw.route(navReq, new URL(navReq.url), ORIGIN), "shell");
  const page = await sw.shellResponse(navReq);
  assert.equal(await page.text(), "body of /access-practice-lab/app-shell");
});

test("the shared module main.js imports from outside the lab is kept for offline starts", async () => {
  const { sw, stores } = loadWorker();
  const url = `${ORIGIN}/shared/math-language-bridge/v2.js`;
  assert.equal(sw.route(new Request(url), new URL(url), ORIGIN), "fresh");
  await sw.precache();
  await sw.cachePack({ name: "road-6-8-w1", urls: [] });
  const build = [...stores.keys()].find((k) => k.startsWith("ewl-access-"));
  assert.ok(
    await stores.get(build).match("/shared/math-language-bridge/v2.js"),
    "saved with a week pack",
  );
});

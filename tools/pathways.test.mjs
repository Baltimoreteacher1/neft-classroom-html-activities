// Connected Learning Engine (/pathways): the skill graph against real routes and content, the shared objective across
// every stage, completion from the destination feature's own record (seeded ledger / loop / activity record /
// simulation save / book), never from a click, recommendations that name their evidence and stay on the objective,
// custom pathways in a URL (round trip, 200-character assignment limit), and the one class assignment.
// Browser journey: tools/pathways-e2e.mjs.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const G = await import(new URL("src/pathways/graph.js", LAB));
const P = await import(new URL("src/pathways/pathways.js", LAB));
const S = await import(new URL("src/pathways/progress.js", LAB));
const R = await import(new URL("src/pathways/recommend.js", LAB));
const B = await import(new URL("src/pathways/builder.js", LAB));
const BN = await import(new URL("src/pathways/banner.js", LAB));
const LOOP = await import(new URL("src/intel/loop.js", LAB));
const LEDGER = await import(new URL("src/lang/ledger.js", LAB));
const CATALOG = await import(new URL("src/acc/wida/catalog.js", LAB));
const SITEMAP = await import(new URL("src/sitemap.js", LAB));
const TEMPLATES = await import(new URL("src/book/templates.js", LAB));
const CONTRACT = await import(new URL("../shared/class-platform/contract.js", import.meta.url));

const index = JSON.parse(readFileSync(new URL("content/index.json", LAB), "utf8"));
const data = { index };
const OBJ = "explain-with-evidence";
const simIndex = new URL("src/sim/missions/index.js", LAB);
const simMissions = existsSync(simIndex) ? [...(await import(simIndex)).MISSION_IDS] : null;

// A tiny key-value store standing in for localStorage.
function device() {
  const map = new Map();
  return {
    map,
    read: (k) => (map.has(k) ? map.get(k) : null),
    write: (k, v) => (map.set(k, v), true),
  };
}
const T0 = "2026-11-10T09:00:00.000Z";
const before = "2026-11-09T09:00:00.000Z";
const later = (n) => `2026-11-1${n}T10:00:00.000Z`;

/** Start the reference pathway on a fresh device and return helpers to seed work and read its state. */
function scenario(id = P.REFERENCE_ID, band = "6-8") {
  const d = device();
  const pathway = P.builtIn(id, band, data);
  const runs = S.loadRuns(d.read);
  const run = S.startRun(runs, pathway, {
    back: P.pathwayPath(pathway, null, band),
    band,
    now: T0,
    sim: {},
  });
  S.saveRuns(runs, d.write);
  const ledger = { v: 1, entries: [] };
  const intel = { v: 1, loops: {} };
  const books = [];
  const flush = () => {
    LEDGER.saveLedger(ledger, d.write);
    LOOP.saveIntel(intel, d.write);
    S.saveRuns(runs, d.write);
  };
  const snap = () => (flush(), S.collectSnapshot({ read: d.read, books }));
  const state = () => {
    const now = snap(); // saves the seeded work first, so the run is read back the way a reload would read it
    return S.pathwayState(pathway, S.loadRuns(d.read).runs[pathway.runKey], now);
  };
  const record = (stage, result, complete = true) => {
    const { band: b, domain, level, id: aid } = stage.evidence.match;
    const key =
      b === "6-8"
        ? `accessPracticeLab:v1:${domain}:${level}`
        : `accessPracticeLab:v1:g${b}:${domain}:${level}`;
    d.write(key, JSON.stringify({ complete: complete ? [aid] : [], results: { [aid]: result } }));
  };
  const loop = (init, text, { supports = {}, now = later(2) } = {}) => {
    const l = LOOP.startLoop(intel, init, now);
    LOOP.recordStage(
      intel,
      l.id,
      "response",
      { text, supports, source: "typed" },
      { now, ledger: false },
    );
    return l;
  };
  return {
    d,
    pathway,
    runs,
    run,
    ledger,
    intel,
    books,
    snap,
    state,
    record,
    loop,
    stage: (kind) => pathway.stages.find((s) => s.kind === kind),
  };
}

test("skill graph: 8+ objectives over the four Key Language Uses, valid against real routes, content and the WIDA catalog", () => {
  assert.deepEqual(
    G.validateGraph({ index, templates: TEMPLATES.TEMPLATES.map((t) => t.id), simMissions }),
    [],
  );
  assert.ok(G.OBJECTIVES.length >= 8);
  assert.equal(G.OBJECTIVES[0].id, OBJ);
  for (const use of ["Narrate", "Inform", "Explain", "Argue"])
    assert.ok(G.objectivesFor(use).length >= 1, use);
  const catalogIds = new Set(CATALOG.WIDA_LANGUAGE_EXPECTATIONS.map((e) => e.id));
  for (const o of G.OBJECTIVES) {
    assert.match(o.id, /^[a-z][a-z0-9-]+$/);
    for (const band of G.BANDS) {
      const rows = G.widaEntries(o, band);
      assert.ok(rows.length > 0, `${o.id} ${band}`);
      for (const r of rows) assert.ok(catalogIds.has(r.id), `${r.id} is not a catalog row`);
      // every domain the objective claims has a real activity in this band
      for (const dom of o.domains)
        assert.ok(
          G.activitiesFor(o, band, data).some((a) => a.domain === dom),
          `${o.id} ${band} ${dom}`,
        );
    }
    assert.deepEqual(Object.keys(o.features), ["discourse", "sentence", "word"]);
    assert.ok(
      o.evidence.ledger.length &&
        o.evidence.loop.includes("sim") &&
        o.evidence.loop.includes("pathway"),
    );
    assert.equal(o.talk.length, 3);
    // no level, score or proficiency wording anywhere in the objective
    assert.doesNotMatch(JSON.stringify(o), /\b(level \d|score|proficien|streak|ranking)/i, o.id);
  }
  if (simMissions)
    assert.ok(
      simMissions.includes(G.SIM_MISSION),
      "the simulation mission exists in src/sim/missions",
    );
});

test("the validator catches a missing activity, a mis-filed one and an unknown key", () => {
  const broken = structuredClone(index);
  broken.bands["6-8"].domains.Reading.levels.B.activities = broken.bands[
    "6-8"
  ].domains.Reading.levels.B.activities.filter((r) => r[0] !== "read-best-evidence");
  assert.ok(G.validateGraph({ index: broken }).some((m) => m.includes("rread-best-evidence")));
  assert.ok(
    G.validateGraph({ index, simMissions: ["some-other-mission"] }).some((m) =>
      m.includes("simulation"),
    ),
  );
  assert.equal(G.resolveKey("rnot-a-real-activity", data), null);
  assert.equal(
    G.resolveKey("dteacher-hub", data),
    null,
    "a teacher destination is not a student stage",
  );
  assert.equal(G.resolveKey("x../../etc", data), null);
});

test("built-in pathways: at least three, every stage is linked, routed, explained in two languages and detectable", () => {
  assert.ok(P.BUILT_IN_IDS.length >= 3);
  for (const band of G.BANDS)
    for (const id of P.BUILT_IN_IDS) {
      const p = P.builtIn(id, band, data);
      assert.deepEqual(P.validatePathway(p), [], `${id} ${band}`);
      assert.deepEqual(p.notes, []);
      const o = G.objectiveById(p.objective);
      for (const s of p.stages) {
        assert.ok(s.linked, `${id} ${s.key} is linked to ${o.id}`);
        assert.ok(
          s.why[0].includes(o.title[0]) && s.why[1].includes(o.title[1]),
          "why names the shared objective",
        );
        assert.notEqual(s.evidence.type, "none");
        if (s.kind === "access") assert.equal(s.band, band);
      }
      assert.equal(P.assignmentFor(p, null, band).ok, true);
    }
});

test("the reference pathway is the six required stages in order, in existing features", () => {
  const p = P.builtIn(P.REFERENCE_ID, "6-8", data);
  assert.equal(p.title[0], "Explain an idea using evidence");
  assert.deepEqual(
    p.stages.map((s) => s.kind),
    ["access", "speak", "sim", "book", "transfer", "family"],
  );
  assert.ok(["Reading", "Listening"].includes(p.stages[0].domain));
  assert.match(p.stages[0].route, /^\/(Reading|Listening)\/[ABC]\/[a-z0-9-]+$/);
  assert.match(
    index.bands["6-8"].domains[p.stages[0].domain].levels[
      p.stages[0].evidence.match.level
    ].activities.find((r) => r[0] === p.stages[0].evidence.match.id)[3],
    /evidence/i,
  );
  assert.match(p.stages[1].route, /^\/speak\/spk-/);
  assert.equal(p.stages[2].route, "/simulations/city-that-stopped-talking");
  assert.deepEqual(
    p.stages.map((s) => s.optional),
    [false, false, false, false, false, true],
  );
  // every route's first segment is something the sitemap knows
  const known = new Set(
    SITEMAP.DESTINATIONS.flatMap((d) => [
      String(d.href).split(/[/?]/)[0],
      ...(d.match || []).map((m) => m[m.length - 1]),
    ]),
  );
  for (const s of p.stages.filter((x) => x.route))
    assert.ok(known.has(s.route.split("/")[1]) || known.has(s.domain), s.route);
});

test("grades 3-5 speak in the Speaking Studio's own 3-5 tasks; grades 6-8 never see them", () => {
  const studio = new Map(index.studio.speaking.map((t) => [t.id, t]));
  for (const id of P.BUILT_IN_IDS) {
    const young = P.builtIn(id, "3-5", data);
    const old = P.builtIn(id, "6-8", data);
    const speak35 = young.stages.filter((s) => s.domain === "Speaking" && s.kind !== "sim");
    assert.equal(speak35.length, 1, `${id}: one speaking stage for 3-5`);
    assert.equal(speak35[0].kind, "speak", `${id}: 3-5 speaking stage is a Speaking Studio task`);
    assert.match(speak35[0].route, /^\/speak\/spk35-/);
    assert.equal(studio.get(speak35[0].route.split("/")[2])?.band, "3-5");
    assert.ok(speak35[0].linked, `${id}: the 3-5 task is linked to the objective`);
    assert.deepEqual(speak35[0].evidence, {
      type: "ledger",
      match: { src: "speaking", task: speak35[0].route.split("/")[2], loopSrc: "speak" },
    });
    for (const s of old.stages.filter((x) => x.kind === "speak"))
      assert.equal(studio.get(s.route.split("/")[2])?.band, "6-8", `${id}: 6-8 keeps its 6-8 task`);
  }
  assert.equal(
    P.builtIn(P.REFERENCE_ID, "3-5", data).stages[1].route,
    "/speak/spk35-icewrap-explain",
  );
  // an objective's 3-5 activities never reach a 6-8 learner, and the other way round
  for (const o of G.OBJECTIVES) {
    for (const a of G.activitiesFor(o, "6-8", data)) assert.notEqual(a.band, "3-5", `${o.id} ${a.key}`);
    for (const a of G.activitiesFor(o, "3-5", data)) assert.notEqual(a.band, "6-8", `${o.id} ${a.key}`);
  }
});

test("the shared objective and the learner's place travel with every stage", () => {
  const sc = scenario();
  for (const s of sc.pathway.stages.filter((x) => x.route)) {
    const href = P.stageHref(sc.pathway, s);
    const q = new URL(href, "http://x").searchParams;
    assert.equal(q.get("pw"), sc.pathway.runKey);
    assert.equal(q.get("st"), s.id);
    const at = BN.pathwayContext(new URL(href, "http://x").search, sc.d.read);
    assert.equal(at.run.objective, OBJ);
    assert.equal(at.n, sc.pathway.stages.indexOf(s) + 1);
    assert.equal(at.total, 6);
    assert.equal(at.run.back, "/access-practice-lab/pathways/explain-with-evidence");
  }
  assert.equal(BN.pathwayContext("?pw=nope&st=x", sc.d.read), null);
  assert.equal(BN.pathwayContext("", sc.d.read), null);
  // reopening never moves the start time, so "after the pathway started" keeps its meaning
  const runs = S.loadRuns(sc.d.read);
  S.startRun(runs, sc.pathway, { now: later(5) });
  assert.equal(runs.runs[sc.pathway.runKey].startedAt, T0);
  assert.equal(S.resumeRun(runs).objective, OBJ);
});

test("opening links completes nothing; each stage is done only when its own feature recorded the work", () => {
  const sc = scenario();
  let st = sc.state();
  assert.equal(st.done, 0);
  assert.equal(st.next.stage.kind, "access");
  // "clicks": the run is reopened and helps are opened; still nothing is done
  S.noteSupport(sc.runs, sc.pathway.runKey, "t", "frames");
  assert.equal(sc.state().done, 0);

  // 1. ACCESS activity: finished BEFORE the pathway started does not count (and is reported as prior work)
  const read = sc.stage("access");
  sc.record(read, { ok: true, evidence: "independent", date: before, tries: 1 });
  st = sc.state();
  assert.equal(st.stages[0].state, "next");
  assert.equal(S.priorWork(read, sc.run, sc.snap()), true);
  // a wrong answer after the start does not count either
  sc.record(read, { ok: false, evidence: "attempted", date: later(1), tries: 1 }, false);
  assert.equal(sc.state().stages[0].state, "next");
  // right, on the first try, with no help: done and independent
  sc.record(read, {
    ok: true,
    evidence: "independent",
    supportUsed: false,
    date: later(1),
    tries: 1,
  });
  st = sc.state();
  assert.equal(st.stages[0].state, "done");
  assert.equal(st.stages[0].evidence.independent, true);
  assert.equal(st.next.stage.kind, "speak");

  // 2. Speaking Studio: a ledger entry for that task, with a help opened → supported
  const speak = sc.stage("speak");
  LEDGER.appendEntry(sc.ledger, {
    src: "speaking",
    task: "some-other-task",
    domain: "Speaking",
    use: "Explain",
    t: later(2),
    m: { words: 30 },
  });
  assert.equal(sc.state().stages[1].state, "next", "another task's entry is not this stage");
  LEDGER.appendEntry(sc.ledger, {
    src: "speaking",
    task: speak.evidence.match.task,
    domain: "Speaking",
    use: "Explain",
    stage: "independent",
    supports: { frames: true },
    t: later(2),
    m: { words: 40, cites: 1 },
  });
  st = sc.state();
  assert.equal(st.stages[1].state, "done");
  assert.equal(st.stages[1].evidence.independent, false);
  assert.deepEqual(st.stages[1].evidence.supports, ["frames"]);

  // 3. Simulation: an open save is not done; a finished mission is; the learner's words come from the sim loop
  sc.d.write(
    S.SIM_KEY,
    JSON.stringify({
      [G.SIM_MISSION]: { v: 1, mission: G.SIM_MISSION, step: 9, outcome: null, complete: false },
    }),
  );
  assert.equal(sc.state().stages[2].state, "next");
  sc.loop(
    {
      src: "sim",
      objective: OBJ,
      task: { id: "sim-speak", keyUse: "Explain", domain: "Speaking" },
    },
    "The pump log shows the water stopped at noon, so the mayor is wrong.",
    { now: later(3) },
  );
  sc.d.write(
    S.SIM_KEY,
    JSON.stringify({
      [G.SIM_MISSION]: {
        v: 1,
        mission: G.SIM_MISSION,
        step: 40,
        outcome: "trust-restored",
        complete: true,
      },
    }),
  );
  st = sc.state();
  assert.equal(st.stages[2].state, "done");
  assert.equal(st.stages[2].evidence.independent, null);
  assert.match(st.stages[2].evidence.quote, /pump log/);

  // 4. Book Studio: the hand-off alone (rev 1) is not done; the learner's own save (rev 2) is; other books never count
  const bookStage = sc.stage("book");
  sc.books.push({
    id: "b1",
    title: "Mine",
    source: { kind: "pathway", id: "someone-else:bevidence-argument" },
    rev: 5,
    updatedAt: later(4),
  });
  sc.books.push({
    id: "b2",
    title: "Explain an idea using evidence",
    source: { kind: "pathway", id: bookStage.evidence.match.source },
    rev: 1,
    updatedAt: later(4),
  });
  assert.equal(sc.state().stages[3].state, "next");
  sc.books[1].rev = 2;
  assert.equal(sc.state().stages[3].state, "done");

  // 5. Transfer: a loop for another objective does not count; this pathway's own loop does, independent with no help
  sc.loop(
    {
      src: "pathway",
      objective: "argue-claim-evidence",
      task: { id: "pw:argue-claim-evidence:x", keyUse: "Argue" },
    },
    "I believe recess should be longer.",
    { now: later(5) },
  );
  assert.equal(sc.state().stages[4].state, "next");
  S.noteSupport(sc.runs, sc.pathway.runKey, "t", "frames");
  sc.runs.runs[sc.pathway.runKey].meta.t.supports = {};
  const own = sc.loop(
    {
      src: "pathway",
      objective: OBJ,
      task: { id: `pw:${sc.pathway.runKey}:plant-window`, keyUse: "Explain", domain: "Writing" },
    },
    "Plants need light because the window plant grew to 14 cm and the closet plant only 6 cm.",
    { now: later(5) },
  );
  st = sc.state();
  assert.equal(st.stages[4].state, "done");
  assert.equal(st.stages[4].evidence.independent, true);
  assert.equal(st.complete, true, "the optional family stage never blocks the pathway");
  assert.equal(st.requiredDone, 5);
  assert.equal(own.objective, OBJ);

  // 6. Family conversation: the family's own tick, with the prompts they used
  assert.equal(
    S.recordTalk(sc.runs, sc.pathway.runKey, "f", []),
    null,
    "nothing ticked records nothing",
  );
  S.recordTalk(sc.runs, sc.pathway.runKey, "f", [0, 2], later(6));
  st = sc.state();
  assert.equal(st.stages[5].state, "done");
  assert.deepEqual(st.stages[5].evidence.prompts, [0, 2]);
  assert.equal(st.done, 6);
});

test("a simulation finished before the pathway started is prior work, not completion", () => {
  const d = device();
  const pathway = P.builtIn(P.REFERENCE_ID, "6-8", data);
  const runs = S.loadRuns(d.read);
  const sim = { [G.SIM_MISSION]: { outcome: "x", complete: true } };
  const run = S.startRun(runs, pathway, { now: T0, sim });
  d.write(S.SIM_KEY, JSON.stringify(sim));
  const snap = S.collectSnapshot({ read: d.read });
  const stage = pathway.stages.find((s) => s.kind === "sim");
  assert.equal(S.stageEvidence(stage, run, snap), null);
  assert.equal(S.priorWork(stage, run, snap), true);
});

test("a transfer done with a help opened is supported, never independent", () => {
  const sc = scenario();
  sc.loop(
    { src: "pathway", objective: OBJ, task: { id: `pw:${sc.pathway.runKey}:plant-window` } },
    "Plants need light.",
    { supports: { frames: true } },
  );
  const t = sc.state().stages[4];
  assert.equal(t.evidence.independent, false);
  assert.deepEqual(t.evidence.supports, ["frames"]);
  // a help opened in the pathway view counts even when the loop was saved without it
  const sc2 = scenario();
  sc2.loop(
    { src: "pathway", objective: OBJ, task: { id: `pw:${sc2.pathway.runKey}:plant-window` } },
    "Plants need light.",
  );
  S.noteSupport(sc2.runs, sc2.pathway.runKey, "t", "words");
  assert.equal(sc2.state().stages[4].evidence.independent, false);
});

test("the share packet covers every stage: what, when, independent or supported, the learner's words", () => {
  const sc = scenario();
  sc.record(sc.stage("access"), { ok: true, evidence: "independent", date: later(1), tries: 1 });
  LEDGER.appendEntry(sc.ledger, {
    src: "speaking",
    task: sc.stage("speak").evidence.match.task,
    stage: "supported",
    supports: { model: true },
    t: later(2),
    m: { words: 30 },
  });
  sc.loop(
    { src: "pathway", objective: OBJ, task: { id: `pw:${sc.pathway.runKey}:plant-window` } },
    "Plants need light because the window plant was 14 cm tall.",
    { now: later(5) },
  );
  const text = S.pathwayDigest(sc.pathway, sc.state(), G.objectiveById(OBJ));
  assert.ok(text.length <= 3900);
  assert.match(text, /^PATHWAY: Explain an idea using evidence/);
  for (let n = 1; n <= 6; n++) assert.ok(text.includes(`STEP ${n} —`), `step ${n}`);
  assert.match(text, /STEP 1 — ACCESS Practice Lab[^\n]*\nDone 2026-11-11 \[on my own\]/);
  assert.match(text, /STEP 2 — Speaking Studio[^\n]*\nDone 2026-11-12 \[with supports: model\]/);
  assert.match(text, /STEP 3 — Living Simulation[^\n]*\nNot done yet\./);
  assert.match(
    text,
    /STEP 5[^\n]*\nDone 2026-11-15 \[on my own\]\.\nMy words: "Plants need light because the window plant was 14 cm tall\."/,
  );
  assert.match(text, /STEP 6[^\n]*\(optional\)\nNot done yet\./);
  assert.doesNotMatch(text, /level|score|%/i);
});

// ── recommendations ─────────────────────────────────────────────────────────────────────────────────────────
const produced = (sc, n, m, extra = {}) => {
  for (let i = 0; i < n; i++)
    LEDGER.appendEntry(sc.ledger, {
      src: "writing",
      task: `wrt-mulch-cer`,
      domain: "Writing",
      use: "Explain",
      stage: "independent",
      t: later(i + 1),
      m: { words: 40, cites: 1, link: 2, academic: 2, ...m },
      ...extra,
    });
};
function assertOnObjective(r, objective = OBJ) {
  assert.equal(r.objective, objective, "the objective is never changed");
  assert.ok(r.activity, "there is an activity");
  assert.equal(r.linked, true);
  assert.ok(
    G.isLinked(objective, r.activity.key),
    `${r.activity.key} is linked to ${objective} in the graph`,
  );
  assert.ok(
    r.reason[0].trim().length > 20 && r.reason[1].trim().length > 20,
    "a reason in both languages",
  );
  assert.ok(
    Number.isInteger(r.evidence.counted) &&
      Number.isInteger(r.evidence.of) &&
      Array.isArray(r.evidence.ids),
  );
  assert.ok(
    r.reason[0].includes(String(r.evidence.counted)),
    "the reason states the count it came from",
  );
  assert.doesNotMatch(r.reason.join(" "), /level|score|proficien/i);
}

test("under three relevant pieces of work: 'not enough evidence yet' and the pathway's next stage", () => {
  const sc = scenario();
  produced(sc, 2, { cites: 0 });
  const r = R.recommend(OBJ, sc.snap(), { state: sc.state(), data });
  assertOnObjective(r);
  assert.equal(r.enough, false);
  assert.equal(r.need, null);
  assert.match(r.reason[0], /not enough evidence yet: 2 pieces/);
  assert.equal(r.activity.key, sc.pathway.stages[0].key, "offers the next stage");
  assert.deepEqual(r.evidence, { counted: 2, of: 3, kind: "count", ids: r.evidence.ids });
});

test("explained without pointing to the source in 2 of 3 tries → the evidence activity, with that count", () => {
  const sc = scenario();
  produced(sc, 1, { cites: 2 });
  produced(sc, 2, { cites: 0 });
  const r = R.recommend(OBJ, sc.snap(), { state: sc.state(), data });
  assertOnObjective(r);
  assert.equal(r.enough, true);
  assert.equal(r.need, "cite-source");
  assert.match(r.reason[0], /did not point to the source in 2 of your last 3 tries/);
  assert.equal(r.activity.key, "devidence");
  assert.equal(r.evidence.ids.length, 2);
  // the teacher rejected that suggestion → it is never made; the result still stays on the objective
  const r2 = R.recommend(OBJ, sc.snap(), { state: sc.state(), rejected: ["cite-source"], data });
  assertOnObjective(r2);
  assert.notEqual(r2.need, "cite-source");
});

test("every rule's recommendation is linked to the objective and names its evidence (all objectives, many histories)", () => {
  const histories = [
    (sc) => produced(sc, 3, { link: 0 }),
    (sc) => produced(sc, 3, { academic: 0 }),
    (sc) => produced(sc, 3, {}, { stage: "supported", supports: { frames: true } }),
    (sc) => produced(sc, 4, {}),
    (sc) => {
      produced(sc, 1, {});
      for (const a of G.objectiveById(sc.pathway.objective).activities.filter(
        (x) =>
          x.kind === "access" && x.band === "6-8" && ["Reading", "Listening"].includes(x.domain),
      ))
        sc.d.write(
          `accessPracticeLab:v1:${a.domain}:${a.level}`,
          JSON.stringify({
            complete: [],
            results: { [a.id]: { ok: false, date: later(2), tries: 2 } },
          }),
        );
    },
    () => {},
  ];
  const seen = new Set();
  for (const id of P.BUILT_IN_IDS)
    for (const [i, seed] of histories.entries()) {
      const sc = scenario(id);
      const o = G.objectiveById(sc.pathway.objective);
      // work filed under this objective's Key Language Use
      const use = o.keyUse;
      seed(sc);
      for (const e of sc.ledger.entries) e.use = use;
      for (const withState of [true, false]) {
        const r = R.recommend(o.id, sc.snap(), { state: withState ? sc.state() : null, data });
        assertOnObjective(r, o.id);
        seen.add(r.need || "not-enough");
        assert.ok(
          G.resolveKey(r.activity.key, data),
          `${id} history ${i}: ${r.activity.key} exists`,
        );
      }
    }
  for (const need of ["not-enough", "link-ideas", "more-independent", "find-evidence", "stretch"])
    assert.ok(seen.has(need), `rule ${need} was exercised`);
});

test("supported work is never read as independent, and another objective's loops are not this objective's evidence", () => {
  const sc = scenario();
  produced(sc, 3, {}, { stage: "independent", supports: { model: true } });
  const ev = R.relevantEvidence(G.objectiveById(OBJ), sc.snap());
  assert.equal(ev.produced.filter((p) => p.independent).length, 0);
  const sc2 = scenario();
  for (let i = 0; i < 3; i++) {
    const l = sc2.loop(
      { src: "write", objective: "explain-cause-effect", task: { id: `x${i}`, keyUse: "Explain" } },
      "Because it rained.",
    );
    LEDGER.appendEntry(sc2.ledger, {
      src: "intel:write",
      task: `x${i}`,
      use: "Explain",
      attempt: l.id,
      t: later(i + 1),
      m: { words: 10, cites: 0 },
    });
  }
  assert.equal(R.relevantEvidence(G.objectiveById(OBJ), sc2.snap()).total, 0);
  assert.equal(R.relevantEvidence(G.objectiveById("explain-cause-effect"), sc2.snap()).total, 3);
  assert.equal(R.recommend(OBJ, sc2.snap(), { data }).enough, false);
});

test("teacher priority: the objective of an assigned pathway wins over the one the learner opened", () => {
  const sc = scenario("narrate-events-in-order");
  const runs = S.loadRuns(sc.d.read);
  assert.deepEqual(R.priorityObjective({ runs }), {
    objective: "narrate-events-in-order",
    source: "pathway",
    runKey: "narrate-events-in-order",
    path: "/access-practice-lab/pathways/narrate-events-in-order",
  });
  const assigned = [
    {
      id: "pw:argue-claim-evidence",
      title: "Pathway",
      path: "/access-practice-lab/pathways/argue-claim-evidence",
    },
  ];
  assert.equal(
    R.priorityObjective({ assignments: assigned, runs }).objective,
    "argue-claim-evidence",
  );
  assert.equal(R.priorityObjective({ assignments: assigned, runs }).source, "teacher");
  const custom = [{ id: "pw:c-abc", path: `/access-practice-lab/pathways/c?o=${OBJ}&s=t` }];
  assert.equal(R.priorityObjective({ assignments: custom, runs }).objective, OBJ);
  assert.equal(
    R.priorityObjective({
      assignments: [{ id: "x", path: "/access-practice-lab/Reading/A/read-main-idea" }],
      runs,
    }).source,
    "pathway",
  );
  assert.equal(R.priorityObjective({}), null);
});

// ── custom pathways and the assignment ──────────────────────────────────────────────────────────────────────
const parse = (path) => Object.fromEntries(new URL(path, "http://x").searchParams);

test("a custom pathway round-trips through its URL inside the 200-character assignment path", () => {
  let draft = B.draftFromBuiltIn(P.REFERENCE_ID, "6-8");
  draft = B.setTitle(draft, "Evidence week: Room 12!");
  draft = B.toggleSupport(draft, "spanish");
  draft = B.setRejected(draft, "link-ideas", true);
  draft = B.setFollowUp(draft, "wwrt-heat-island-essay");
  draft = B.toggleOptional(draft, 2);
  const path = P.customPath(draft, "6-8");
  assert.ok(path.length - 1 <= 200, `${path.length - 1} characters`);
  assert.match(path, P.PATH_OK);
  const { pathway, def, notes } = P.decodeCustom(parse(path), "6-8", data);
  assert.deepEqual(notes, []);
  assert.equal(pathway.objective, OBJ);
  assert.deepEqual(
    pathway.stages.map((s) => s.key),
    draft.stages.map((s) => s.key),
  );
  assert.deepEqual(
    pathway.stages.map((s) => s.optional),
    [false, false, true, false, false, true],
  );
  assert.equal(
    pathway.title[0],
    "Evidence week Room 12",
    "characters a class link cannot hold are left out",
  );
  assert.deepEqual(pathway.supports, ["frames", "words", "plan"]);
  assert.deepEqual(pathway.rejected, ["link-ideas"]);
  assert.equal(pathway.followUp, "wwrt-heat-island-essay");
  assert.equal(P.customPath(def, "6-8"), path, "decode → encode gives the same link");
  assert.match(pathway.runKey, /^c-[a-z0-9]+$/);
  // the same stages with another title are the same pathway (progress is kept); different stages are not
  assert.equal(
    P.decodeCustom(parse(P.customPath(B.setTitle(draft, "Other"))), "6-8", data).pathway.runKey,
    pathway.runKey,
  );
  assert.notEqual(
    P.decodeCustom(parse(P.customPath(B.removeStage(draft, 0))), "6-8", data).pathway.runKey,
    pathway.runKey,
  );
  // grades 3-5 links name their band
  assert.match(P.customPath(B.draftFromBuiltIn(P.REFERENCE_ID, "3-5"), "3-5"), /&grades=3-5$/);
});

test("decoding validates everything: unknown ids are dropped with a visible note, bad links give no pathway", () => {
  const r = P.decodeCustom(
    { o: OBJ, s: "rread-best-evidence.rnot-real.sspk-nope.t.T.Zzz.dteacher-hub", t: "A_b" },
    "6-8",
    data,
  );
  assert.deepEqual(
    r.pathway.stages.map((s) => s.key),
    ["rread-best-evidence", "t"],
  );
  assert.deepEqual(
    r.notes.map((n) => `${n.kind}:${n.key}`),
    [
      "unknown:rnot-real",
      "unknown:sspk-nope",
      "duplicate:t",
      "unknown:zzz",
      "unknown:dteacher-hub",
    ],
  );
  assert.equal(r.pathway.title[0], "A b");
  assert.equal(P.decodeCustom({ o: "no-such-objective", s: "t" }, "6-8", data).pathway, null);
  assert.equal(P.decodeCustom({ o: OBJ, s: "rnope" }, "6-8", data).pathway, null);
  assert.equal(
    P.decodeCustom({ o: OBJ, s: "%E0%A4%A.t" }, "6-8", data).pathway.stages.length,
    1,
    "a broken escape is dropped, not thrown",
  );
  assert.deepEqual(
    P.decodeCustom(
      { o: OBJ, s: "t", h: "fzz", x: "nope.cite-source", n: "rnot-linked" },
      "6-8",
      data,
    ).pathway.supports,
    ["frames"],
  );
  assert.deepEqual(
    P.decodeCustom({ o: OBJ, s: "t", x: "nope.cite-source" }, "6-8", data).pathway.rejected,
    ["cite-source"],
  );
  // a stage that is not linked to the objective is allowed (the teacher chose it) and says so
  const un = P.decodeCustom({ o: OBJ, s: "rread-main-idea.t" }, "6-8", data).pathway;
  assert.equal(un.stages[0].linked, false);
  assert.match(
    un.stages[0].why[0],
    /Your teacher chose this for the goal: Explain an idea using evidence/,
  );
  // a destination whose work cannot be detected can only be an optional extra
  const ex = P.decodeCustom({ o: OBJ, s: "devidence.t" }, "6-8", data).pathway;
  assert.equal(ex.stages[0].evidence.type, "none");
  assert.equal(ex.stages[0].optional, true);
});

test("the assignment is ONE { id, title, path, due } the class server accepts; a too-long path is refused with a reason", () => {
  for (const band of G.BANDS)
    for (const id of P.BUILT_IN_IDS) {
      const a = P.assignmentFor(P.builtIn(id, band, data), null, band);
      assert.equal(a.ok, true);
      assert.match(a.assignment.id, B.ID_OK ?? P.ID_OK);
      assert.match(a.assignment.path, P.PATH_OK);
      const v = CONTRACT.validateSettings({ assignments: [a.assignment] }, "language");
      assert.equal(v.ok, true);
      assert.equal(
        v.settings?.assignments?.[0]?.path ?? v.assignments?.[0]?.path ?? a.assignment.path,
        a.assignment.path,
      );
    }
  const draft = B.draftFromBuiltIn(P.REFERENCE_ID, "6-8");
  const { pathway, def } = P.decodeCustom(parse(P.customPath(draft)), "6-8", data);
  const ok = P.assignmentFor(pathway, def, "6-8");
  assert.equal(ok.ok, true);
  assert.match(ok.assignment.id, /^pw:c-[a-z0-9]+$/);
  assert.match(ok.assignment.id, P.ID_OK);
  assert.equal(CONTRACT.validateSettings({ assignments: [ok.assignment] }, "language").ok, true);
  // pile on stages until the link is too long
  let big = draft;
  for (const a of G.objectiveById(OBJ).activities) big = B.addStage(big, a.key, data);
  big = B.setTitle(big, "A very long title for a pathway that will not fit in a link");
  const long = P.decodeCustom(parse(P.customPath(big)), "6-8", data);
  const bad = P.assignmentFor(long.pathway, long.def, "6-8");
  assert.equal(bad.ok, false);
  assert.ok(bad.problems.includes("too-long"));
  assert.ok(bad.length > 200);
  // every step optional → refused
  const opt = P.decodeCustom({ o: OBJ, s: "T.F" }, "6-8", data);
  assert.ok(P.assignmentFor(opt.pathway, opt.def).problems.includes("no-required-stage"));
});

test("builder operations: add, reorder by buttons, remove, optional, supports, accept/reject, follow-up, search", () => {
  let d = B.blankDraft(OBJ);
  assert.deepEqual(d.stages, [{ key: "t", optional: false }]);
  d = B.addStage(d, "rread-best-evidence", data);
  d = B.addStage(d, "sspk-evaporation-explain", data);
  assert.deepEqual(
    d.stages.map((s) => s.key),
    ["rread-best-evidence", "sspk-evaporation-explain", "t"],
    "new work goes before the transfer",
  );
  assert.equal(B.addStage(d, "rread-best-evidence", data), d, "no duplicates");
  assert.equal(B.addStage(d, "rnope", data), d, "nothing that does not exist");
  d = B.moveStage(d, 1, -1);
  assert.deepEqual(
    d.stages.map((s) => s.key),
    ["sspk-evaporation-explain", "rread-best-evidence", "t"],
  );
  assert.equal(B.moveStage(d, 0, -1), d);
  d = B.toggleOptional(d, 1);
  assert.equal(d.stages[1].optional, true);
  d = B.removeStage(d, 0);
  assert.deepEqual(
    d.stages.map((s) => s.key),
    ["rread-best-evidence", "t"],
  );
  assert.deepEqual(B.toggleSupport(d, "frames").supports, ["words", "plan", "spanish"]);
  assert.deepEqual(B.toggleSupport(B.toggleSupport(d, "frames"), "frames").supports, [
    "frames",
    "words",
    "plan",
    "spanish",
  ]);
  assert.deepEqual(B.setRejected(d, "cite-source", true).rejected, ["cite-source"]);
  assert.deepEqual(
    B.setRejected(B.setRejected(d, "cite-source", true), "cite-source", false).rejected,
    [],
  );
  assert.equal(B.setRejected(d, "not-a-need", true), d);
  assert.equal(
    B.setFollowUp(d, "rread-main-idea").followUp,
    "",
    "follow-up work must be linked to the same objective",
  );
  assert.equal(B.setObjective(d, "argue-counterclaim").objective, "argue-counterclaim");
  const linked = B.searchResources("", OBJ, "6-8", data);
  assert.ok(
    linked.length > 5 && linked.filter((r) => !["t", "f"].includes(r.key)).every((r) => r.linked),
  );
  const found = B.searchResources("volcano", OBJ, "6-8", data);
  assert.ok(found.length >= 2 && found.every((r) => /volcano/i.test(r.title[0]) && !r.linked));
  assert.ok(B.searchResources("word lab", OBJ, "6-8", data).some((r) => r.key === "dwordlab"));
  assert.ok(B.searchResources("bats", OBJ, "3-5", data).some((r) => r.key === "rg35-r-b-bats"));
  assert.equal(
    B.searchResources("bats", OBJ, "6-8", data).some((r) => r.key === "rg35-r-b-bats"),
    false,
    "another band's items are not offered",
  );
});

test("assigning to a class goes through the existing settings API: read the list, append one, save", async () => {
  const calls = [];
  const client =
    (list, ok = true) =>
    () => ({
      roster: async () => ({ ok: true, settings: { assignments: list } }),
      settings: async (s) => (calls.push(s), { ok }),
    });
  const a = P.assignmentFor(P.builtIn(P.REFERENCE_ID, "6-8", data), null).assignment;
  const kept = {
    id: "read-main-idea",
    title: "x",
    path: "/access-practice-lab/Reading/A/read-main-idea",
    due: null,
  };
  assert.deepEqual(
    await B.saveToClass({ code: "ABC234", passcode: "p" }, a, undefined, client([kept])),
    { ok: true },
  );
  assert.deepEqual(calls[0], { assignments: [kept, a] });
  assert.deepEqual(
    await B.saveToClass({ code: "ABC234", passcode: "p" }, a, undefined, client([kept, a])),
    { ok: true, already: true },
  );
  assert.equal(calls.length, 1, "an assignment that is already there is not saved twice");
  assert.equal(
    (await B.saveToClass({ code: "ABC234", passcode: "p" }, a, undefined, client([], false))).ok,
    false,
  );
  const denied = () => ({ roster: async () => ({ ok: false, httpStatus: 401 }) });
  assert.deepEqual(await B.saveToClass({ code: "ABC234", passcode: "bad" }, a, undefined, denied), {
    ok: false,
    reason: "passcode",
  });
  assert.deepEqual(
    B.teacherClasses(() =>
      JSON.stringify([
        { code: "ABC234", passcode: "p", title: "Room 12" },
        { code: "NOPASS" },
        null,
      ]),
    ),
    [{ code: "ABC234", passcode: "p", title: "Room 12" }],
  );
  assert.deepEqual(
    B.teacherClasses(() => "not json"),
    [],
  );
});

test("house rules in the source: bilingual strings, no reserved helper names, no timers, pw- classes, no 'teacher' in a path", () => {
  const files = [
    "graph.js",
    "refs.js",
    "objectives-explain.js",
    "objectives-narrate-inform.js",
    "objectives-argue.js",
    "pathways.js",
    "progress.js",
    "recommend.js",
    "builder.js",
    "build-controller.js",
    "banner.js",
    "family-card.js",
    "ui.js",
    "ui-build.js",
  ].map((f) => `src/pathways/${f}`);
  for (const f of [...files, "src/views/pathways.js"]) {
    assert.doesNotMatch(f, /teacher/);
    const src = readFileSync(new URL(f, LAB), "utf8");
    assert.doesNotMatch(src, /\b(const|let|function)\s+(L|LS)\b/, `${f}: reserved helper name`);
    assert.doesNotMatch(src, /setInterval|setTimeout|countdown/i, `${f}: no timers`);
    assert.ok(src.split("\n").length <= 520, `${f} is ${src.split("\n").length} lines`);
    for (const m of src.matchAll(/class="([^"$]+)"/g))
      for (const c of m[1].split(/\s+/).filter(Boolean))
        assert.match(
          c,
          /^(pw-|btn|small|ghost|panel|eyebrow|fine|row-actions|visually-hidden|is-|ico)/,
          `${f}: class ${c}`,
        );
  }
  const css = readFileSync(new URL("pathways.css", LAB), "utf8");
  assert.doesNotMatch(
    css.replace(/\/\*[\s\S]*?\*\//g, ""),
    /#[0-9a-f]{3,8}\b|rgb\(/i,
    "colors come from ds.css tokens only",
  );
  for (const m of css.matchAll(/(^|[\s,>+~])\.([a-z][\w-]*)/gm))
    assert.match(m[2], /^(pw-|is-|ico$|row-actions$)/, `css class .${m[2]}`);
});

test("an unchanged built-in draft is assigned by the built-in route; any change makes it a custom link", () => {
  for (const band of G.BANDS)
    for (const id of P.BUILT_IN_IDS)
      assert.equal(P.matchBuiltIn(B.draftFromBuiltIn(id, band), band), id);
  const d = B.draftFromBuiltIn(P.REFERENCE_ID, "6-8");
  assert.equal(P.matchBuiltIn(B.toggleOptional(d, 0)), "");
  assert.equal(P.matchBuiltIn(B.moveStage(d, 0, 1)), "");
  assert.equal(P.matchBuiltIn(B.toggleSupport(d, "plan")), "");
  assert.equal(P.matchBuiltIn(B.setRejected(d, "cite-source", true)), "");
  assert.equal(P.matchBuiltIn(B.setTitle(d, "My own title")), "");
  assert.equal(P.matchBuiltIn(B.setTitle(d, "")), P.REFERENCE_ID);
});

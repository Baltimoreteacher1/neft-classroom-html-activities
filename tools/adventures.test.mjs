// Adventure Worlds (/adventures): every world in WORLDS passes validateWorld; respond checks, clue relevance and
// evidenceFrom; the choice/order feedback ladder never reveals on the first two tries; engine progression, branching
// and unlock rules; the Book Studio spec and the portfolio entry. Browser journey: tools/adventures-e2e.mjs.
import assert from "node:assert/strict";
import test from "node:test";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const V = await import(new URL("src/adventures/validate.js", LAB));
const K = await import(new URL("src/adventures/checks.js", LAB));
const A = await import(new URL("src/adventures/engine.js", LAB));
const { WORLDS, worldById } = await import(new URL("src/adventures/worlds/index.js", LAB));
const { writingSamples } = await import(new URL("src/lang/portfolio.js", LAB));
const { TEMPLATES } = await import(new URL("src/book/templates.js", LAB));

test("every world in WORLDS passes validateWorld, in the schema's order", () => {
  assert.ok(WORLDS.length >= 2);
  for (const w of WORLDS) assert.deepEqual(V.validateWorld(w), [], w.id);
  const order = WORLDS.map((w) => V.WORLD_IDS.indexOf(w.id));
  assert.deepEqual(
    order,
    [...order].sort((a, b) => a - b),
    "WORLDS follow the schema order",
  );
  assert.equal(new Set(WORLDS.map((w) => w.id)).size, WORLDS.length);
});

test("each of this branch's worlds uses every scene kind, both bands, a book mission and a branch", () => {
  for (const id of ["mystery-museum", "science-island"]) {
    const w = worldById(id);
    assert.equal(w.missions.length, 4, id);
    assert.equal(w.missions.filter((m) => m.final).length, 1);
    assert.ok(
      w.missions.some((m) => m.book),
      `${id} has a book mission`,
    );
    for (const band of ["3-5", "6-8"]) {
      const kinds = new Set(w.missions.flatMap((m) => m.bands[band].map((s) => s.kind)));
      assert.deepEqual([...kinds].sort(), [...V.KINDS].sort(), `${id} ${band} uses every kind`);
      assert.ok(
        w.missions.some((m) => m.bands[band].some((s) => s.kind === "respond" && s.mode === "say")),
        `${id} ${band} has a spoken respond`,
      );
    }
    // 3-5 asks for less language than 6-8 in every respond scene of the same mission.
    for (const m of w.missions) {
      const min = (b) =>
        Math.max(
          ...m.bands[b].filter((s) => s.kind === "respond").map((s) => s.check.minWords || 0),
        );
      assert.ok(min("3-5") < min("6-8"), `${id}/${m.id} 3-5 demand is lighter`);
    }
  }
  assert.ok(
    worldById("mystery-museum").missions.some((m) =>
      m.bands["6-8"].some((s) => s.kind === "choice" && s.options.some((o) => o.next != null)),
    ),
    "a branch exists",
  );
});

test("the validator catches schema breaks", () => {
  const w = structuredClone(worldById("mystery-museum"));
  w.missions[0].bands["6-8"][1].text.en = "Too short.";
  w.missions[0].bands["6-8"][3].options.forEach((o) => (o.correct = false));
  w.missions[1].keyUse = "Describe";
  w.missions[3].final = false;
  w.theme.accent = "pink";
  w.missions[0].bands["3-5"][0].art = ["char-nobody"];
  w.missions[0].bands["6-8"][6].model.en = "The case was open.";
  w.tagline.en = "Beat the clock to earn points!";
  const errors = V.validateWorld(w).join("\n");
  for (const want of [
    "words; 6-8 needs",
    "needs a correct option",
    "keyUse",
    "exactly one final",
    "theme.accent",
    "unknown art key",
    "does not pass its own check",
    "no timers",
  ])
    assert.ok(errors.includes(want), `missing error: ${want}\n${errors}`);
  assert.ok(V.TEMPLATE_IDS.length === TEMPLATES.length && V.TEMPLATE_IDS.includes("mystery-story"));
});

test("respond checks: words, connectors, needWords/needAny (whole words or stems), evidence from clues", () => {
  const check = {
    minWords: 12,
    needConnectors: ["cause"],
    needWords: ["evidence"],
    needAny: [["key", "keys"]],
    evidenceFrom: "clues",
  };
  const clue = {
    id: "lock",
    text: { en: "The case lock is closed, and the metal has no scratches." },
    relevant: true,
    keys: ["lock", "scratches"],
  };
  const empty = K.checkRespond("", check, [clue]);
  assert.equal(empty.ok, false);
  assert.equal(empty.next.en, "Write your answer first.");
  const short = K.checkRespond("Someone took it.", check, [clue]);
  assert.equal(short.ok, false);
  assert.match(short.next.en, /at least 12 words/);
  const noClue = K.checkRespond(
    "The evidence shows a key was used, so I think a staff member opened the case at night.",
    check,
    [clue],
  );
  assert.equal(noClue.items.find((i) => i.id === "evidence").ok, false);
  assert.match(noClue.next.en, /evidence board/);
  const good = K.checkRespond(
    "The evidence is that the lock has no scratches, so someone used keys to open the case.",
    check,
    [clue],
  );
  assert.equal(good.ok, true, JSON.stringify(good.items));
  assert.deepEqual(good.usedClues, ["lock"]);
  // stems: "evidenced"/"observed" count; phrases match as whole phrases; stance extras exist
  assert.equal(K.checkRespond("It was evidenced clearly.", { needWords: ["evidence"] }).ok, true);
  assert.equal(K.checkRespond("We recommend a logbook.", { needConnectors: ["stance"] }).ok, true);
  assert.equal(
    K.checkRespond("I saw the drying cabinet.", { needAny: [["drying cabinet"]] }).ok,
    true,
  );
  assert.equal(K.checkRespond("I saw the cabinet.", { needAny: [["drying cabinet"]] }).ok, false);
});

test("clue keywords: authored keys first, otherwise distinctive content words; two hits needed", () => {
  const c = { text: { en: "Water temperature at noon: high pool 27°C, low pool 18°C." } };
  const keys = K.clueKeywords(c);
  assert.ok(keys.includes("27") && keys.includes("temperature"));
  assert.equal(K.mentionsClue("The high pool was 27 degrees, warmer.", c), true);
  assert.equal(K.mentionsClue("The pool was warm.", c), false);
});

test("clue relevance: relevant clues are kept; others return their specific why", () => {
  const s = worldById("mystery-museum").missions[0].bands["6-8"][2];
  const bad = K.checkClue(s, "mud");
  assert.equal(bad.ok, false);
  assert.match(bad.why.en, /Tuesday/);
  assert.equal(K.checkClue(s, "lock").ok, true);
  assert.deepEqual(K.boardStatus(s, ["lock", "glass", "mud"]), { kept: 2, need: 3, done: false });
  assert.equal(K.boardStatus(s, ["lock", "glass", "dust"]).done, true);
});

test("choice and order ladders never show the answer on the first two tries", () => {
  const s = worldById("mystery-museum").missions[0].bands["6-8"][3];
  const wrong = s.options.findIndex((o) => !o.correct);
  assert.equal(K.checkChoice(s, wrong, 0).reveal, null);
  assert.equal(K.checkChoice(s, wrong, 1).reveal, null);
  assert.equal(
    K.checkChoice(s, wrong, 2).reveal,
    s.options.findIndex((o) => o.correct),
  );
  const items = [{ en: "a" }, { en: "b" }, { en: "c" }, { en: "d" }];
  const o = K.shuffledOrder(4, "seed");
  assert.notDeepEqual(o, [0, 1, 2, 3]);
  assert.deepEqual(K.shuffledOrder(4, "seed"), o, "deterministic");
  assert.ok(!K.checkOrder(items, o, 0).model && !K.checkOrder(items, o, 1).model);
  assert.ok(Number.isInteger(K.checkOrder(items, o, 1).at));
  assert.deepEqual(K.checkOrder(items, o, 2).model, ["a", "b", "c", "d"]);
  assert.equal(K.checkOrder(items, [0, 1, 2, 3], 0).ok, true);
  for (let n = 3; n <= 6; n++)
    for (const seed of ["x", "y", "z", "q"])
      assert.notDeepEqual(K.shuffledOrder(n, seed), [...Array(n).keys()]);
});

test("engine: unlock rules (mission 1 open, then in order; final after all others)", () => {
  const w = worldById("science-island");
  const p = {};
  const st = () => w.missions.map((m) => A.missionStatus(w, "6-8", p, m.id));
  assert.deepEqual(st(), ["available", "locked", "locked", "locked"]);
  A.missionEntry(p, w.id, "6-8", w.missions[0].id).done = true;
  assert.deepEqual(st(), ["done", "available", "locked", "locked"]);
  A.missionEntry(p, w.id, "6-8", w.missions[1].id).done = true;
  assert.deepEqual(st(), ["done", "done", "available", "locked"]);
  A.missionEntry(p, w.id, "6-8", w.missions[2].id).done = true;
  assert.deepEqual(st(), ["done", "done", "done", "available"]);
  assert.equal(A.missionStatus(w, "3-5", p, w.missions[1].id), "locked", "bands are separate");
  assert.equal(A.worldSummary(w, "6-8", p).next.id, w.missions[3].id);
});

test("engine: progression, branching, back along the path taken, URL jumps only backwards", () => {
  const w = worldById("mystery-museum");
  const m = w.missions[2]; // the lab log has a branch
  const scenes = A.scenesOf(m, "6-8");
  const e = A.missionEntry({}, w.id, "6-8", m.id);
  assert.equal(A.advance(e, scenes), 1);
  assert.equal(A.advance(e, scenes), 2);
  assert.equal(A.advance(e, scenes), 2, "a choice blocks until answered");
  const k = scenes[2].options.findIndex((o) => o.correct && o.next === 4);
  const r = K.checkChoice(scenes[2], k, 0);
  e.answers[2] = { ok: r.ok, next: r.next };
  assert.equal(A.advance(e, scenes), 4, "the branch skips scene 3");
  assert.equal(A.back(e), 2, "back returns to the choice");
  assert.equal(A.advance(e, scenes), 4);
  assert.equal(A.goTo(e, 6), false, "cannot jump ahead");
  assert.equal(A.goTo(e, 1), true);
  assert.equal(e.scene, 1);
  assert.deepEqual(e.trail, [0]);
  assert.equal(
    A.sceneReady({ kind: "respond" }, { ok: false, checks: 3 }),
    true,
    "never stuck after three checks",
  );
  assert.equal(A.sceneReady({ kind: "respond" }, { ok: false, checks: 2 }), false);
});

test("engine: completion artifact, mission log, book pages and portfolio sample", () => {
  const w = worldById("mystery-museum");
  const m = w.missions[0];
  const p = {};
  const e = A.missionEntry(p, w.id, "6-8", m.id);
  e.mode = "own";
  e.answers[2] = { picked: ["lock", "glass", "dust"], ok: true };
  e.answers[6] = { text: "My case note text.", ok: true };
  const art = A.completeMission(w, m, "6-8", e, "2026-11-16T10:00:00Z");
  assert.equal(art.text, "My case note text.");
  assert.equal(art.clues.length, 3);
  assert.equal(A.missionLog(w, "6-8", p).length, 1);
  const spec = A.bookSpec(w, m, "6-8", e);
  assert.equal(spec.templateId, "mission-report");
  assert.equal(spec.pages[0].text, "My case note text.");
  assert.match(spec.pages.at(-1).text, /lock is closed/);
  const samples = writingSamples({
    band: "6-8",
    studio: {},
    exhibition: {},
    warmup: {},
    adventures: p,
  });
  assert.equal(samples.find((s) => s.source === "adventure")?.text, "My case note text.");
  // a mission with no clues scene of its own draws evidence from the world's other missions
  const finalLike = {
    ...w.missions[3],
    bands: { "6-8": w.missions[3].bands["6-8"].filter((s) => s.kind !== "clues") },
  };
  const ev = A.evidenceClues(
    { ...w, missions: [...w.missions.slice(0, 3), finalLike] },
    finalLike,
    "6-8",
    p,
    {},
  );
  assert.deepEqual(
    ev.map((c) => c.id),
    ["lock", "glass", "dust"],
  );
});

test("progress storage: bad JSON never throws; the key is the schema's", () => {
  assert.equal(A.KEY, "accessPracticeLab:v1:adventures");
  assert.deepEqual(
    A.loadProgress(() => "{oops"),
    {},
  );
  assert.deepEqual(
    A.loadProgress(() => "[1]"),
    {},
  );
});

// The Language Page introduction (start page, tour, exploration, lesson, quick guide, family page, Site Guide).
// Re-checks every curated route against the lab's real content, the sample sentences against the real checks, the
// curation rules, and the maintainer list. Runs with the other ACCESS tests (`validate:access-lab`).
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const ROOT = new URL("../", import.meta.url);
const readJson = (p) => JSON.parse(readFileSync(new URL(p, ROOT), "utf8"));
const win = new JSDOM("<main id='app'></main>", { url: "https://lab.test/access-practice-lab/" })
  .window;
for (const key of ["window", "document", "localStorage", "sessionStorage", "location", "history"])
  globalThis[key] = win[key];

const D = await import("../access-practice-lab/src/intro/data.js");
const { LADDERS } = await import("../access-practice-lab/src/content/voice-lab.js");
const { itemById } = await import("../access-practice-lab/src/content/scaffold-items.js");
const { checkUpgrade } = await import("../access-practice-lab/src/lang/scaffold-check.js");
const { checkResponse } = await import("../access-practice-lab/src/intro/lesson.js");
const { curatedHere } = await import("../access-practice-lab/src/intro/return-bar.js");
const { BAND_TOUR } = await import("../access-practice-lab/src/intro/tour-bands.js");
const { PLAN_SAMPLES } = await import("../access-practice-lab/src/intro/explore-data.js");
const { build } = await import("./generate-intro-curated-list.mjs");

const routeOf = (a) => new URL(a.route, "https://x.test");
const content = {
  speak: readJson("access-practice-lab/content/studio/speaking.json").tasks,
  write: readJson("access-practice-lab/content/studio/writing.json").tasks,
  reading: readJson("access-practice-lab/content/reading-room/lessons.json").lessons,
};

test("the introduction stays curated: four activities and two Explore Later resources", () => {
  assert.deepEqual(
    D.ACTIVITIES.map((a) => a.id),
    ["hallway", "board", "upgrade", "paragraph"],
  );
  assert.deepEqual(
    D.SUPPLEMENTAL.map((a) => a.id),
    ["seasons", "morphemes"],
  );
  assert.equal(D.ACTIVITIES.filter((a) => a.pathway === "speaking").length, 2);
  assert.equal(D.ACTIVITIES.filter((a) => a.pathway === "writing").length, 2);
  for (const id of [...D.ACTIVITIES, ...D.SUPPLEMENTAL].map((a) => a.id))
    assert.ok(D.APPEARANCES[id]?.length, `${id} lists where it appears`);
});

test("every curated route resolves to content that exists", () => {
  const [hall, board, upgrade, para, seasons, words] = [...D.ACTIVITIES, ...D.SUPPLEMENTAL];
  assert.ok(
    LADDERS.some((l) => l.id === routeOf(hall).pathname.split("/").pop() && l.band === "6-8"),
  );
  assert.ok(content.speak.some((t) => t.id === routeOf(board).pathname.split("/").pop()));
  assert.equal(routeOf(upgrade).pathname, "/scaffold/language-upgrade");
  assert.equal(itemById(routeOf(upgrade).searchParams.get("item"))?.tool, "language-upgrade");
  assert.ok(content.write.some((t) => t.id === routeOf(para).pathname.split("/").pop()));
  assert.ok(
    content.reading.some(
      (l) => l.id === routeOf(seasons).pathname.split("/").pop() && l.gradeCluster === "6-8",
    ),
  );
  assert.equal(routeOf(words).pathname, "/wordlab/build");
});

test("route names never contain the word teacher (Pages gates those paths)", () => {
  for (const r of [
    ...Object.values(D.ROUTES),
    ...D.ACTIVITIES.map((a) => a.route),
    ...Object.values(D.DOWNLOADS).flatMap((d) => Object.values(d)),
  ])
    assert.doesNotMatch(r, /teacher/i, r);
});

test("the single entrance is the start page", () => {
  assert.equal(D.ENTRANCE.url, "https://thelanguagepage.com/access-practice-lab/start");
  assert.equal(D.ROUTES.start, "/start");
});

test("sample sentences pass the lab's own checks", () => {
  const upgrade = itemById("lu68-argue-phones");
  assert.equal(checkUpgrade(upgrade, D.PREVIEWS.upgrade.sample).ok, true);
  const tourSample = BAND_TOUR["6-8"].writing.sample;
  assert.equal(checkUpgrade(upgrade, tourSample).ok, true, tourSample);
  const improved = checkResponse(D.FEATURED_LESSON.sample.improved);
  assert.ok(
    improved.reason && improved.example,
    "the improved lesson sample has a reason and an example",
  );
  const first = checkResponse(D.FEATURED_LESSON.sample.first);
  assert.ok(!first.example, "the first sample is missing the example the cue asks for");
  for (const a of D.ACTIVITIES)
    for (const p of D.PLANNING_PROMPTS) assert.ok(PLAN_SAMPLES[a.id][p.id], `${a.id}/${p.id}`);
});

test("the board preview quotes the survey table correctly", () => {
  const t = content.speak.find((x) => x.id === "spk-startime-argue");
  const text = JSON.stringify(t.stimulus);
  for (const v of ["6.8", "7.6", "38%", "64%"]) assert.ok(text.includes(v), v);
  assert.match(D.PREVIEWS.board.sample, /7\.6/);
  assert.match(D.PREVIEWS.board.sample, /6\.8/);
});

test("the featured lesson follows Notice 1, Speak 2, Write 3, Improve 2, Share 2 and names its anchor", () => {
  assert.deepEqual(
    D.FEATURED_LESSON.steps.map((s) => [s.name, s.minutes]),
    [
      ["Notice", 1],
      ["Speak", 2],
      ["Write", 3],
      ["Improve", 2],
      ["Share", 2],
    ],
  );
  assert.equal(D.FEATURED_LESSON.minutes, 10);
  const anchor = D.ACTIVITIES.find((a) => a.id === D.FEATURED_LESSON.anchor);
  assert.ok(anchor);
  const ladder = LADDERS.find((l) => l.id === "school-hallway");
  assert.equal(
    ladder.steps[2].prompt,
    D.FEATURED_LESSON.prompt,
    "the exact learner prompt is the site's own Step 3 prompt",
  );
  assert.ok(existsSync(new URL("access-practice-lab/pictures/68-school-hallway.svg", ROOT)));
  assert.equal(D.USE_LESSON.studentRoute, anchor.route);
});

test("pacing tables match the brief exactly", () => {
  assert.deepEqual(
    D.PRESENTER_SCHEDULE.map((r) => r.range),
    ["0–3", "3–8", "8–13", "13–23", "23–27", "27–30"],
  );
  assert.deepEqual(
    D.EXPLORE_SEQUENCE.map((r) => r.range),
    ["0–2", "2–9", "9–14", "14–18", "18–20"],
  );
  assert.deepEqual(
    D.TOUR_STOPS.map((s) => s.name),
    ["Choose your grades", "Listening", "Speaking", "Reading", "Writing", "Plan one class"],
  );
});

test("the next-step strip finds a curated activity from its URL", () => {
  const at = (route) =>
    curatedHere({
      pathname: `/access-practice-lab${route.split("?")[0]}`,
      search: route.includes("?") ? `?${route.split("?")[1]}&grades=6-8` : "?grades=6-8",
    });
  for (const a of D.ACTIVITIES) assert.equal(at(a.route)?.id, a.id);
  assert.equal(at("/scaffold/language-upgrade?item=lu68-explain-ice"), null);
  assert.equal(at("/voice/ladder/city-park"), null);
  for (const [from, to] of Object.entries(D.RECOMMENDED_NEXT)) assert.notEqual(from, to);
});

test("handout downloads that are built exist and the maintainer list is current", () => {
  for (const group of Object.values(D.DOWNLOADS))
    for (const path of Object.values(group))
      if (process.env.INTRO_REQUIRE_DOWNLOADS)
        assert.ok(existsSync(new URL(path.replace(/^\//, ""), ROOT)), path);
  assert.equal(
    readFileSync(new URL("docs/languageos/intro-curated-activities.md", ROOT), "utf8"),
    build(),
  );
});

test("the Activity Guide covers every curated item, in order, with real steps", async () => {
  const { ACTIVITY_GUIDE } = await import(
    "../access-practice-lab/src/intro/activity-guide-data.js"
  );
  assert.deepEqual(
    ACTIVITY_GUIDE.map((g) => g.id),
    [...D.ACTIVITIES, ...D.SUPPLEMENTAL].map((a) => a.id),
  );
  for (const g of ACTIVITY_GUIDE) {
    assert.ok(
      g.steps.length >= 4 &&
        g.feedback &&
        g.teach.before &&
        g.teach.during &&
        g.teach.after &&
        g.stuck.length,
      g.id,
    );
    assert.doesNotMatch(
      JSON.stringify(g),
      /\b(score of|level [1-6]|proficien)/i,
      `${g.id} claims no levels or scores`,
    );
  }
});

/**
 * Teacher Tour (/start/tour), the four-part "learn by doing" tour, without a browser:
 *   - Part 1: GOALS has exactly one recommended goal;
 *   - Part 2: the coach's steps (coach/activity-steps.js loopSteps + TEACHER_SAY) are complete and their selectors
 *     parse, and the coach's pure helpers (findTarget, isShown, completes) behave;
 *   - Part 3: supportOptions / chooseActivity give a real activity from content/index.json for every grade choice x
 *     skill x support level, preferring the student's own words for speaking/writing and one answer for
 *     listening/reading;
 *   - Part 4: ACTION_ORDER has one lead + two more per goal, every id renders, and every student link that fits
 *     gets a QR code a scanner (macOS CoreImage, tools/lib/access-intro-qr-read.mjs) reads back to exactly that link;
 *   - render(): the place comes from ctx.route, legacy ?stop= lands on a part, and the state is saved under "guided".
 * The in-browser half is tools/access-intro-tour-a11y.mjs and the tour block of tools/access-intro-e2e.mjs.
 *   node --test tools/access-intro-tour.test.mjs
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { Resvg } from "@resvg/resvg-js";
import { JSDOM } from "jsdom";
import { MAX_BYTES, qrSvg } from "../shared/qr/qr-code.mjs";
import { readQrCodes } from "./lib/access-intro-qr-read.mjs";

const ROOT = new URL("../", import.meta.url);
const win = new JSDOM("<main id='app'></main><div id='labLive'></div>", {
  url: "https://lab.test/access-practice-lab/start/tour",
}).window;
for (const key of ["window", "document", "localStorage", "sessionStorage", "location", "history"])
  globalThis[key] = win[key];
globalThis.fetch = async (url) => ({
  ok: true,
  json: async () =>
    JSON.parse(await readFile(new URL(String(url).replace(/^\//, ""), ROOT), "utf8")),
});

const index = JSON.parse(
  readFileSync(new URL("access-practice-lab/content/index.json", ROOT), "utf8"),
);
const { normalizeBand } = await import("../access-practice-lab/src/bands.js");
const { toHtml } = await import("../access-practice-lab/src/util.js");
const { BAND_TOUR, DOMAINS } = await import("../access-practice-lab/src/intro/tour-bands.js");
const T = await import("../access-practice-lab/src/intro/tour-data.js");
const F = await import("../access-practice-lab/src/intro/tour-finish.js");
const { completes, findTarget, isShown } = await import(
  "../access-practice-lab/src/coach/coach.js"
);
const { loopSteps, SEL } = await import("../access-practice-lab/src/coach/activity-steps.js");
const tour = await import("../access-practice-lab/src/intro/tour.js");
const { INTRO_KEY, loadIntro } = await import("../access-practice-lab/src/intro/state.js");

const PICKS = Object.keys(BAND_TOUR);
const SKILLS = DOMAINS.map((d) => d.id);
const PREFER = {
  listening: "multipleChoice",
  reading: "multipleChoice",
  speaking: "constructed",
  writing: "constructed",
};
const parse = (markup) => new JSDOM(`<body>${toHtml(markup)}</body>`).window.document;
const levelsOf = (pick, skill) =>
  index.bands[normalizeBand(pick)]?.domains?.[DOMAINS.find((d) => d.id === skill).name]?.levels ||
  {};

/** Every Part 3 result: one per grade choice x skill x support level in content/index.json. */
const CHOSEN = PICKS.flatMap((pick) =>
  SKILLS.flatMap((skill) =>
    Object.keys(levelsOf(pick, skill)).map((level) => ({
      pick,
      skill,
      level,
      a: T.chooseActivity(index, pick, skill, level),
    })),
  ),
);
/** Part 2's activity for each grade choice, as Part 4 would link it. */
const TRIED = PICKS.map((pick) => {
  const skill = T.tryDomain(pick);
  return { pick, skill, a: { ...BAND_TOUR[pick][skill], pick } };
});

/* ── Part 1 ── */
test("Part 1: four goals, exactly one recommended (Show me how it works), and goalOf falls back to it", () => {
  assert.deepEqual(
    T.GOALS.map((g) => g.id),
    ["show", "find", "share", "understand"],
  );
  const rec = T.GOALS.filter((g) => g.recommended);
  assert.equal(rec.length, 1);
  assert.equal(rec[0].id, "show");
  assert.equal(T.GOALS[0], rec[0], "the recommended goal comes first");
  for (const g of T.GOALS) assert.ok(g.name && g.detail && g.icon, g.id);
  assert.equal(T.goalOf("nope").id, "show");
  assert.equal(T.goalOf("share").id, "share");
  assert.deepEqual(
    T.PARTS.map((p) => p.n),
    [1, 2, 3, 4],
  );
});

/* ── Part 2 ── */
test("Part 2: each grade choice tries a real activity in its own skill, listening for K–3, reading for 4–8", () => {
  assert.deepEqual(
    PICKS.map((p) => T.tryDomain(p)),
    ["listening", "listening", "listening", "reading", "reading"],
  );
  for (const { pick, skill, a } of TRIED) {
    assert.ok(a?.id && a.route, `${pick}: no Part 2 activity`);
    const [, domain, level, id] = a.route.split("?")[0].split("/");
    assert.equal(domain.toLowerCase(), skill, pick);
    assert.equal(id, a.id, pick);
    const rows = levelsOf(pick, skill)[level]?.activities || [];
    const row = rows.find((r) => r[0] === a.id);
    assert.ok(row, `${pick}: ${a.route} is in content/index.json`);
    assert.equal(row[2], "multipleChoice", `${pick}: Part 2 needs an answer to check`);
    const route = T.activityRoute(a, { frame: "1" });
    const q = new URL(route, "https://x.test").searchParams;
    assert.equal(q.get("grades"), pick);
    assert.equal(q.get("frame"), "1");
  }
});

test("Part 2: every coach step has words, the last has the finish button, waiting steps cannot trap anyone", () => {
  const steps = loopSteps(T.TEACHER_SAY);
  const say = (v) => (typeof v === "function" ? v(null) : v);
  assert.equal(new Set(steps.map((s) => s.id)).size, steps.length, "step ids are unique");
  for (const s of steps) {
    assert.ok(typeof say(s.title) === "string" && say(s.title).length > 3, `${s.id}: title`);
    assert.ok(typeof say(s.body) === "string" && say(s.body).length > 10, `${s.id}: body`);
    if (s.done || s.appear)
      assert.ok(s.fallback || s.when, `${s.id}: waits for an action but has no fallback or when`);
  }
  assert.equal(steps.at(-1).primary, T.TEACHER_SAY.final);
  assert.equal(steps.at(-1).primary, "Next: prepare practice");
  for (const s of steps.slice(0, -1)) assert.equal(s.primary, undefined, `${s.id}: only the last`);
  assert.deepEqual(
    steps.map((s) => s.id),
    ["intro", "skill", "directions", "answer", "sure", "check", "feedback", "retry", "end"],
  );
  // Every selector parses, and every finder runs on an empty document without throwing.
  const doc = new JSDOM("<body></body>").window.document;
  const sels = [
    ...Object.values(SEL).flat(),
    ...steps.flatMap((s) => [
      ...[s.target, s.appear].flat().filter((t) => typeof t === "string"),
      ...Object.values(s.done || {}),
    ]),
  ];
  for (const sel of sels) assert.doesNotThrow(() => doc.querySelector(sel), sel);
  for (const s of steps) {
    if (typeof s.target === "function") assert.equal(s.target(doc) ?? null, null, s.id);
    if (s.when) assert.doesNotThrow(() => s.when(doc), s.id);
  }
});

test("Part 2: feedback and retry words follow what the activity shows", () => {
  const steps = loopSteps(T.TEACHER_SAY);
  const doc = new JSDOM(
    `<body><div class="feedback is-right"></div><div class="feedback"></div><button data-retry></button><div class="early-pick"></div></body>`,
  ).window.document;
  const fb = steps.find((s) => s.id === "feedback");
  const [right, wrong] = doc.querySelectorAll(".feedback");
  assert.equal(fb.title(right), T.TEACHER_SAY.feedback.rightTitle);
  assert.equal(fb.title(wrong), T.TEACHER_SAY.feedback.title);
  assert.equal(fb.body(right), T.TEACHER_SAY.feedback.right);
  const retry = steps.find((s) => s.id === "retry");
  assert.equal(retry.body(doc.querySelector("[data-retry]")), T.TEACHER_SAY.retry.body);
  assert.equal(retry.body(doc.querySelector(".early-pick")), T.TEACHER_SAY.retry.early);
});

test("coach: completes() matches the step's action, findTarget() takes the first shown target", () => {
  const doc = new JSDOM(
    `<body>
      <label class="choice"><input data-ans-choice type="radio"><span id="in">B</span></label>
      <button data-check hidden>Check</button>
      <button data-early-check id="early">Check</button>
      <div id="gone"></div>
    </body>`,
  ).window.document;
  // JSDOM has no layout: give the elements that "show" a box.
  const box = (el, w, h) => {
    el.getBoundingClientRect = () => ({
      width: w,
      height: h,
      top: 0,
      left: 0,
      right: w,
      bottom: h,
    });
  };
  box(doc.querySelector("[data-check]"), 0, 0);
  box(doc.getElementById("early"), 80, 44);
  box(doc.querySelector("label.choice"), 200, 48);
  const answer = loopSteps(T.TEACHER_SAY).find((s) => s.id === "answer").done;
  const inner = doc.getElementById("in");
  assert.equal(
    completes(answer, { type: "click", target: inner }),
    true,
    "click inside label.choice",
  );
  assert.equal(completes(answer, { type: "change", target: inner }), false, "only the named event");
  assert.equal(completes({ click: "[data-sure]" }, { type: "click", target: inner }), false);
  assert.equal(completes(null, { type: "click", target: inner }), false);
  assert.equal(completes(answer, { type: "click", target: null }), false);
  assert.equal(completes(answer, null), false);

  assert.equal(findTarget(doc, null), null);
  assert.equal(findTarget(null, "[data-check]"), null);
  assert.equal(
    findTarget(doc, SEL.check),
    doc.getElementById("early"),
    "hidden first choice skipped",
  );
  assert.equal(findTarget(doc, "[data-retry]"), null);
  assert.equal(findTarget(doc, "#gone"), null, "an element with no box is not a target");
  assert.equal(findTarget(doc, (d) => d.querySelector("label.choice")).className, "choice");
  assert.equal(
    findTarget(doc, () => undefined),
    null,
  );

  assert.equal(isShown(doc.getElementById("early")), true);
  assert.equal(isShown(doc.querySelector("[data-check]")), false);
  const detached = doc.createElement("div");
  box(detached, 10, 10);
  assert.equal(isShown(detached), false, "a detached element is not shown");
  assert.equal(isShown(null), false);
});

/* ── Part 3 ── */
test("Part 3: supportOptions lists exactly the levels content/index.json has, with names and counts", () => {
  for (const pick of PICKS)
    for (const skill of SKILLS) {
      const levels = levelsOf(pick, skill);
      const opts = T.supportOptions(index, pick, skill);
      assert.deepEqual(
        opts.map((o) => o.level),
        Object.keys(levels),
        `${pick} ${skill}`,
      );
      for (const o of opts) {
        assert.equal(o.name, levels[o.level].tier.name);
        assert.equal(o.count, levels[o.level].activities.length);
        assert.ok(T.SUPPORT_PLAIN[o.level], `${o.level} has plain words`);
      }
      assert.ok(opts.length >= 2, `${pick} ${skill}: at least two support choices`);
    }
  assert.deepEqual(T.supportOptions(index, "6-8", "nope"), []);
  assert.deepEqual(T.supportOptions(null, "6-8", "reading"), []);
});

test("Part 3: chooseActivity gives a real activity for every grade choice x skill x support", () => {
  assert.ok(CHOSEN.length >= 50, `${CHOSEN.length} combinations`);
  for (const { pick, skill, level, a } of CHOSEN) {
    const key = `${pick} ${skill} ${level}`;
    assert.ok(a, `${key}: no activity`);
    const rows = levelsOf(pick, skill)[level].activities;
    const row = rows.find((r) => r[0] === a.id);
    assert.ok(row, `${key}: ${a.id} is in the index`);
    const domain = DOMAINS.find((d) => d.id === skill);
    assert.equal(a.route, `/${domain.name}/${level}/${a.id}`, key);
    assert.equal(a.title, row[1], key);
    assert.equal(a.level, level);
    assert.equal(a.pick, pick);
    assert.equal(a.domain.id, skill);
    assert.equal(a.support, levelsOf(pick, skill)[level].tier.name);
    assert.ok(a.minutes > 0 && a.use?.length > 20, key);
    // The tour's own activity wins at its level; otherwise the preferred item type when the level has one.
    const curated = BAND_TOUR[pick]?.[skill];
    const own = curated?.route === a.route;
    const hasPreferred = rows.some((r) => r[2] === PREFER[skill]);
    if (own) assert.equal(a.use, curated.use, key);
    else {
      assert.equal(a.use, T.USE_BY_SKILL[skill], key);
      if (hasPreferred) assert.equal(row[2], PREFER[skill], `${key}: prefers ${PREFER[skill]}`);
    }
  }
  assert.equal(T.chooseActivity(index, "6-8", "reading", "Z"), null);
  assert.equal(T.chooseActivity(index, "nope", "reading", "A"), null);
  assert.equal(T.chooseActivity(null, "6-8", "reading", "A"), null);
});

test("Part 3: the tour's own activity is the one chosen at its level", () => {
  let seen = 0;
  for (const pick of PICKS)
    for (const skill of SKILLS) {
      const c = BAND_TOUR[pick]?.[skill];
      const m = c?.route.match(/^\/(Listening|Speaking|Reading|Writing)\/([A-Z])\/([^?]+)$/);
      if (!m) continue;
      seen++;
      assert.equal(T.chooseActivity(index, pick, skill, m[2]).id, c.id, `${pick} ${skill}`);
    }
  assert.ok(seen >= 10, `${seen} curated lab activities`);
});

/* ── Part 4 ── */
const sample = T.chooseActivity(index, "2-3", "listening", "A");

test("Part 4: ACTION_ORDER has one lead and two more per goal, and every id renders", () => {
  assert.deepEqual(Object.keys(F.ACTION_ORDER).sort(), T.GOALS.map((g) => g.id).sort());
  const MARK = {
    open: (d) =>
      [...d.querySelectorAll("a")].find((a) => /Open the student activity/.test(a.textContent)),
    copy: (d) => d.querySelector("[data-gt-copy]"),
    qr: (d) => d.querySelector("[data-gt-show]"),
    print: (d) => d.querySelector("[data-gt-print]"),
    passport: (d) => d.querySelector('a[href*="/passport?grades=2-3"]'),
  };
  for (const [goal, ids] of Object.entries(F.ACTION_ORDER)) {
    assert.equal(ids.length, 3, goal);
    assert.equal(new Set(ids).size, 3, `${goal}: no repeats`);
    const d = parse(F.classroomHTML({ goal }, sample));
    const card = d.querySelector(".gt-class-card");
    assert.ok(card, goal);
    const primary = card.querySelectorAll(".btn-primary");
    assert.equal(primary.length, 1, `${goal}: one primary action`);
    assert.equal(card.querySelectorAll(".gt-secondary .btn").length, 2, `${goal}: two more`);
    for (const id of ids) assert.ok(MARK[id]?.(card), `${goal}: ${id} renders`);
    assert.ok(MARK[ids[0]](card).classList.contains("btn-primary"), `${goal}: ${ids[0]} leads`);
    assert.match(
      d.querySelector("#gtReady").textContent,
      /You’re ready to use this with students\./,
    );
    assert.match(d.querySelector(".gt-ready-go").textContent, /Start using the lab/);
    assert.equal(d.querySelector("[data-gt-link]").getAttribute("value"), F.studentUrl(sample));
    assert.equal(Boolean(d.querySelector(".gt-note strong")), goal === "understand", goal);
  }
  // The "open" action keeps the way back to the tour.
  const d = parse(F.classroomHTML({ goal: "show" }, sample));
  assert.match(d.querySelector(".gt-class-card a.btn-primary").getAttribute("href"), /intro=tour/);
  // With no activity the page says so and offers a way on.
  const none = parse(F.classroomHTML({ goal: "show" }, null));
  assert.ok(none.querySelector("[role=alert]"));
});

test("Part 4: a link too long for a QR code shows Print instead of Show, and no dialog", () => {
  const long = { ...sample, route: `/Listening/A/${"x".repeat(MAX_BYTES)}` };
  assert.equal(F.qrFits(F.studentUrl(long)), false);
  const d = parse(F.classroomHTML({ goal: "share" }, long));
  assert.equal(d.querySelector("[data-gt-show]"), null);
  assert.equal(d.querySelector("[data-gt-show-dialog]"), null);
  assert.equal(d.querySelector(".gt-link svg"), null);
  assert.ok(d.querySelector("[data-gt-print]"));
  const ok = parse(F.classroomHTML({ goal: "share" }, sample));
  assert.ok(ok.querySelector("[data-gt-show-dialog]"));
  assert.match(
    ok.querySelector(".gt-link svg").getAttribute("aria-label"),
    /QR code for the student link/,
  );
});

// The encoder stops at 106 bytes (QR version 5); longer links are shown without a code.
const LINKS = [
  ...new Set([...CHOSEN.map((c) => F.studentUrl(c.a)), ...TRIED.map((t) => F.studentUrl(t.a))]),
];
const WITH_QR = LINKS.filter(F.qrFits);

test("student links are the public host, in the teacher's grades, and every one fits a QR code", () => {
  assert.equal(MAX_BYTES, 106);
  for (const url of LINKS) {
    assert.match(url, /^https:\/\/thelanguagepage\.com\/access-practice-lab\//, url);
    assert.ok(new URL(url).searchParams.get("grades"), url);
  }
  // Lab routes are short (/Domain/Level/id); a link that stops fitting gets Print instead of Show and fails here.
  assert.deepEqual(
    LINKS.filter((u) => !F.qrFits(u)),
    [],
  );
  assert.ok(LINKS.length >= 55, `${LINKS.length} distinct student links`);
});

test("a scanner reads each Part 4 QR code back to its student link", {
  skip: process.platform !== "darwin" && !process.env.CI && "CoreImage decoder needs macOS",
}, () => {
  const dir = mkdtempSync(join(tmpdir(), "tour-qr-"));
  const files = WITH_QR.map((url, i) => {
    const file = join(dir, `qr-${i}.png`);
    const svg = qrSvg(url, { px: 128, label: "student link" });
    writeFileSync(file, new Resvg(svg, { fitTo: { mode: "width", value: 600 } }).render().asPng());
    return file;
  });
  const read = readQrCodes(files);
  assert.ok(read, "no decoder available");
  WITH_QR.forEach((url, i) => assert.deepEqual(read[files[i]], [url], url));
});

/* ── render(): place from the route, saved on this device ── */
const ctxFor = (route) => ({
  route: { view: "start", id: "tour", ...route },
  band: "6-8",
  prefs: {},
  navigate() {},
  rerender() {},
});
const render = async (route) => {
  const out = await tour.render(ctxFor(route));
  return { out, d: parse(out.html) };
};

test("render: each part from the route, with the goal, grades, skill and support carried", async () => {
  localStorage.removeItem(INTRO_KEY);
  let { out, d } = await render({ part: "1", grades: "4-5" });
  assert.match(out.title, /Choose a goal/);
  const goals = [...d.querySelectorAll("[data-gt-goal]")];
  assert.equal(goals.length, 4);
  assert.equal(d.querySelectorAll(".gt-goal.is-recommended").length, 1);
  const href = new URL(
    d.querySelector(".gt-goal.is-recommended").getAttribute("href"),
    "https://x.test",
  );
  assert.equal(href.searchParams.get("part"), "2");
  assert.equal(href.searchParams.get("goal"), "show");
  assert.equal(href.searchParams.get("grades"), "4-5");
  assert.ok(d.querySelector(".gt-exit"), "Exit tour link");
  assert.ok(d.querySelector("details.gt-help [data-gt-restart]"), "restart inside Need help");

  ({ out, d } = await render({ part: "2", goal: "share", grades: "K" }));
  const stage = d.querySelector("[data-gt-stage]");
  assert.match(stage.dataset.src, /frame=1/);
  assert.match(stage.dataset.src, /grades=K/);
  assert.ok(stage.dataset.src.includes(BAND_TOUR.K.listening.route.split("?")[0]));

  ({ out, d } = await render({ part: "3", grades: "6-8", skill: "speaking", support: "B" }));
  assert.equal(d.querySelector('[data-gt-skill="speaking"]').getAttribute("aria-pressed"), "true");
  assert.equal(d.querySelector('[data-gt-support="B"]').getAttribute("aria-pressed"), "true");
  const want = T.chooseActivity(index, "6-8", "speaking", "B");
  assert.ok(d.querySelector("[data-gt-stage]").dataset.src.includes(want.route));
  const use = new URL(d.querySelector("[data-gt-use]").getAttribute("href"), "https://x.test");
  assert.deepEqual(
    ["part", "grades", "skill", "support"].map((k) => use.searchParams.get(k)),
    ["4", "6-8", "speaking", "B"],
  );

  ({ out, d } = await render({
    part: "4",
    goal: "share",
    grades: "6-8",
    skill: "speaking",
    support: "B",
  }));
  assert.match(
    d.querySelector("#gtCardTitle").textContent,
    new RegExp(want.title.replace(/[?()]/g, ".")),
  );
  assert.ok(d.querySelector(".gt-class-card .btn-primary[data-gt-copy]"), "share leads with Copy");
  const saved = loadIntro().guided;
  assert.equal(saved.part, 4);
  assert.equal(saved.done, true);
  assert.equal(saved.goal, "share");
  localStorage.removeItem(INTRO_KEY);
});

test("render: legacy ?stop= links land on a part, and a bare /start/tour resumes the saved part", async () => {
  localStorage.removeItem(INTRO_KEY);
  const part = async (route) => (await render(route)).out.title;
  assert.match(await part({ stop: "1" }), /Choose a goal/);
  assert.match(await part({ stop: "3" }), /Try an activity/);
  assert.match(await part({ stop: "6" }), /Take it to class/);
  localStorage.setItem(INTRO_KEY, JSON.stringify({ guided: { part: 3, goal: "find" } }));
  const { out, d } = await render({});
  assert.match(out.title, /Prepare practice/);
  assert.ok(d.querySelector(".gt-back-note[role=status]"), "says you are back where you stopped");
  localStorage.removeItem(INTRO_KEY);
  assert.match(await part({}), /Choose a goal/, "nothing saved starts at Part 1");
  localStorage.removeItem(INTRO_KEY);
});

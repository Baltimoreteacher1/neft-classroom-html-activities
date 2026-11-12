/**
 * Teacher Tour (/start/tour), the three-part "learn by doing" tour, without a browser:
 *   - PARTS: Pick a skill / Try it as a student / Use it with your class;
 *   - Part 2: stepsFor (coach/activity-steps.js) gives each kind of activity (listening and reading: the answer loop,
 *     speaking, writing) a complete list of steps whose selectors parse, and the coach's pure helpers (findTarget,
 *     isShown, completes) behave;
 *   - supportOptions / chooseActivity give a real activity from content/index.json for every grade choice x skill x
 *     support level, and a level A activity for every grade choice x skill (the one Part 1 names and Part 2 opens);
 *   - Part 3: the class card has one main action, the three-step start, the ready line and a seven-stop map, and
 *     every student link gets a QR code a scanner (macOS CoreImage, tools/lib/access-intro-qr-read.mjs) reads back;
 *   - render(): the place comes from ctx.route, old links (?part=4, ?stop=) land on a real part, Parts 2–3 without a
 *     skill fall back to Part 1, and the state is saved under "guided".
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
const { loopSteps, SEL, stepsFor } = await import(
  "../access-practice-lab/src/coach/activity-steps.js"
);
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

/** Every activity a teacher can reach: one per grade choice x skill x support level in content/index.json. */
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

/* ── PARTS ── */
test("PARTS: three parts, Pick a skill / Try it as a student / Use it with your class", () => {
  assert.deepEqual(
    T.PARTS.map((p) => [p.n, p.id, p.name]),
    [
      [1, "skill", "Pick a skill"],
      [2, "try", "Try it as a student"],
      [3, "class", "Use it with your class"],
    ],
  );
  for (const gone of ["GOALS", "goalOf", "tryDomain", "PREVIEW_SAY", "UNDERSTAND"])
    assert.equal(T[gone], undefined, `${gone} is gone`);
  assert.equal(F.ACTION_ORDER, undefined, "ACTION_ORDER is gone");
  for (const s of SKILLS) assert.ok(T.SKILL_PLAIN[s]?.length > 20, `${s}: plain words`);
  assert.equal(T.skillOf("reading"), "reading");
  assert.equal(T.skillOf("nope"), "");
  assert.equal(T.skillOf(undefined), "");
});

/* ── Part 2: the coach's steps ── */
const KINDS = {
  listening: [
    "intro",
    "skill",
    "directions",
    "answer",
    "sure",
    "check",
    "feedback",
    "retry",
    "again",
    "end",
  ],
  reading: [
    "intro",
    "skill",
    "directions",
    "answer",
    "sure",
    "check",
    "feedback",
    "retry",
    "again",
    "end",
  ],
  speaking: ["intro", "skill", "question", "starters", "say", "check", "end"],
  writing: ["intro", "skill", "directions", "write", "check", "feedback", "revise", "paper", "end"],
};

for (const [skill, ids] of Object.entries(KINDS))
  test(`Part 2 (${skill}): every step has words, the last opens Part 3, waiting steps cannot trap anyone`, () => {
    const steps = stepsFor(skill, T.TEACHER_SAY);
    const say = (v) => (typeof v === "function" ? v(null) : v);
    assert.deepEqual(
      steps.map((s) => s.id),
      ids,
    );
    assert.equal(new Set(steps.map((s) => s.id)).size, steps.length, "step ids are unique");
    for (const s of steps) {
      assert.ok(typeof say(s.title) === "string" && say(s.title).length > 3, `${s.id}: title`);
      assert.ok(typeof say(s.body) === "string" && say(s.body).length > 10, `${s.id}: body`);
      if (s.done || s.appear)
        assert.ok(s.fallback || s.when, `${s.id}: waits for an action but has no fallback or when`);
    }
    assert.equal(steps.at(-1).primary, "Next: use it with your class");
    for (const s of steps.slice(0, -1))
      assert.equal(s.primary, undefined, `${s.id}: only the last`);
    // Every selector parses, and every finder and `when` runs on an empty document without throwing.
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

test("Part 2: listening and reading share the answer loop; speaking and writing have their own", () => {
  const ids = (k) => stepsFor(k, T.TEACHER_SAY).map((s) => s.id);
  assert.deepEqual(ids("listening"), ids("reading"));
  assert.deepEqual(
    ids("reading"),
    loopSteps(T.TEACHER_SAY.loop).map((s) => s.id),
  );
  assert.notDeepEqual(ids("speaking"), ids("reading"));
  assert.notDeepEqual(ids("writing"), ids("reading"));
  // The end card of each kind names that kind's turn.
  assert.match(stepsFor("speaking", T.TEACHER_SAY).at(-1).title, /That is a speaking turn/);
  assert.match(stepsFor("writing", T.TEACHER_SAY).at(-1).title, /That is a writing turn/);
  assert.match(stepsFor("reading", T.TEACHER_SAY).at(-1).title, /That is the student loop/);
});

test("Part 2: feedback and retry words follow what the activity shows", () => {
  const say = T.TEACHER_SAY.loop;
  const steps = loopSteps(say);
  const doc = new JSDOM(
    `<body><div class="feedback is-right"></div><div class="feedback"></div><button data-retry></button><div class="early-pick"></div></body>`,
  ).window.document;
  const fb = steps.find((s) => s.id === "feedback");
  const [right, wrong] = doc.querySelectorAll(".feedback");
  assert.equal(fb.title(right), say.feedback.rightTitle);
  assert.equal(fb.title(wrong), say.feedback.title);
  assert.equal(fb.body(right), say.feedback.right);
  const retry = steps.find((s) => s.id === "retry");
  assert.equal(retry.body(doc.querySelector("[data-retry]")), say.retry.body);
  assert.equal(retry.body(doc.querySelector(".early-pick")), say.retry.early);
});

test("Part 2: speaking and writing steps find the real controls", () => {
  const box = (el, w = 100, h = 40) => {
    el.getBoundingClientRect = () => ({
      width: w,
      height: h,
      top: 0,
      left: 0,
      right: w,
      bottom: h,
    });
  };
  const speak = new JSDOM(
    `<body><div class="response-workspace"><button data-say>Hear</button></div>
      <details><summary>Sentence starters</summary></details>
      <button data-rec-start>Record</button>
      <fieldset><label><input type="checkbox" data-selfcheck>Topic</label></fieldset></body>`,
  ).window.document;
  for (const el of speak.querySelectorAll("button, summary")) box(el);
  const steps = stepsFor("speaking", T.TEACHER_SAY);
  const at = (id) => steps.find((s) => s.id === id);
  assert.equal(findTarget(speak, at("question").target), speak.querySelector("[data-say]"));
  assert.equal(at("starters").when(speak), true);
  assert.equal(findTarget(speak, at("starters").target).tagName, "SUMMARY");
  assert.equal(findTarget(speak, at("say").target), speak.querySelector("[data-rec-start]"));
  assert.equal(at("check").when(speak), true);
  assert.equal(
    completes(at("check").done, { type: "click", target: speak.querySelector("[data-selfcheck]") }),
    true,
  );

  const write = new JSDOM(
    `<body><div class="response-workspace"><textarea data-note></textarea>
      <button data-check-writing>Check</button><div class="feedback">Add a detail</div></div></body>`,
  ).window.document;
  for (const el of write.querySelectorAll("button, textarea, .feedback")) box(el);
  const w = stepsFor("writing", T.TEACHER_SAY);
  const wt = (id) => w.find((s) => s.id === id);
  const area = write.querySelector("textarea");
  assert.equal(wt("write").when(write), true);
  assert.equal(findTarget(write, wt("write").target), area);
  assert.equal(completes(wt("write").done, { type: "input", target: area }), true);
  assert.equal(wt("check").when(write), true);
  assert.ok(findTarget(write, wt("check").appear), "the feedback counts as appeared");
  assert.equal(wt("feedback").when(write), true);
  assert.equal(wt("revise").when(write), true);
  assert.equal(wt("paper").when(write), false, "no K–3 paper step in the lab shell");
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
  const answer = loopSteps(T.TEACHER_SAY.loop).find((s) => s.id === "answer").done;
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

/* ── Activities from content/index.json ── */
test("chooseActivity: a level A activity for every grade choice x skill (Part 1's cards and Part 2's frame)", () => {
  for (const pick of PICKS)
    for (const skill of SKILLS) {
      const a = T.chooseActivity(index, pick, skill, "A");
      assert.ok(a, `${pick} ${skill}: no level A activity`);
      assert.equal(a.level, "A");
      assert.equal(a.pick, pick);
      assert.equal(a.domain.id, skill);
      assert.match(a.route, new RegExp(`^/${a.domain.name}/A/`), `${pick} ${skill}`);
      const q = new URL(T.activityRoute(a, { frame: "1" }), "https://x.test").searchParams;
      assert.equal(q.get("grades"), pick);
      assert.equal(q.get("frame"), "1");
    }
});

test("supportOptions lists exactly the levels content/index.json has, with names and counts", () => {
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
      assert.equal(opts[0].level, "A", `${pick} ${skill}: A comes first (the default)`);
    }
  assert.deepEqual(T.supportOptions(index, "6-8", "nope"), []);
  assert.deepEqual(T.supportOptions(null, "6-8", "reading"), []);
});

test("chooseActivity gives a real activity for every grade choice x skill x support", () => {
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

test("the tour's own activity is the one chosen at its level", () => {
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

/* ── Part 3: the class card ── */
const sample = T.chooseActivity(index, "2-3", "listening", "A");
const sampleOpts = T.supportOptions(index, "2-3", "listening");
const classDoc = (a = sample, support = "A") =>
  parse(F.classroomHTML({ pick: a.pick, skill: a.domain.id, support }, a, sampleOpts));

test("Part 3: one main action on the class card, three quieter ones, the start steps, ready line and map", () => {
  const d = classDoc();
  const card = d.querySelector(".gt-class-card");
  assert.ok(card);
  const primary = card.querySelectorAll(".btn-primary");
  assert.equal(primary.length, 1, "one primary action");
  assert.ok(primary[0].matches("[data-gt-copy]"));
  assert.match(primary[0].textContent, /Copy student link/);
  const secondary = [...card.querySelectorAll(".gt-secondary .btn")];
  assert.equal(secondary.length, 3);
  assert.match(secondary[0].textContent, /Open it/);
  assert.match(secondary[0].getAttribute("href"), /intro=tour/, "Open it keeps the way back");
  assert.ok(card.querySelector(".gt-secondary [data-gt-show]"));
  assert.match(card.querySelector("[data-gt-print]").textContent, /Print this card/);
  assert.equal(card.querySelector("#gtCardTitle").textContent, sample.title);
  assert.equal(d.querySelector("[data-gt-link]").getAttribute("value"), F.studentUrl(sample));
  // Support choice: one button per level, the chosen one pressed.
  const sup = [...d.querySelectorAll("[data-gt-support]")];
  assert.deepEqual(
    sup.map((b) => b.dataset.gtSupport),
    sampleOpts.map((o) => o.level),
  );
  assert.deepEqual(
    sup.map((b) => b.getAttribute("aria-pressed")),
    sampleOpts.map((o) => String(o.level === "A")),
  );
  // Start tomorrow in three steps, with the one-page quick guide.
  const start = d.querySelector(".gt-start");
  assert.match(start.querySelector("h2").textContent, /Start tomorrow in three steps/);
  assert.equal(start.querySelectorAll(".gt-start-steps > li").length, 3);
  assert.match(start.querySelector(".gt-start-print a").getAttribute("href"), /\.pdf$/);
  // Ready.
  assert.equal(d.querySelector("#gtReady").textContent, "You’re ready to use this with students.");
  assert.match(d.querySelector(".gt-ready-go").textContent, /Start using the lab/);
  // Map: seven stops, each in the teacher's grades, and the full Site Guide.
  const stops = [...d.querySelectorAll(".gt-map-stops a")];
  assert.equal(stops.length, 7);
  for (const a of stops) assert.match(a.getAttribute("href"), /grades=2-3$/);
  assert.match(d.querySelector(".gt-map-more a").textContent, /Open the full Site Guide/);
  assert.ok(d.querySelector("dialog[data-gt-show-dialog]"));
});

test("Part 3: a link too long for a QR code drops Show and the dialog, Print stays", () => {
  const long = { ...sample, route: `/Listening/A/${"x".repeat(MAX_BYTES)}` };
  assert.equal(F.qrFits(F.studentUrl(long)), false);
  const d = classDoc(long);
  assert.equal(d.querySelector("[data-gt-show]"), null);
  assert.equal(d.querySelector("[data-gt-show-dialog]"), null);
  assert.equal(d.querySelector(".gt-link svg"), null);
  assert.ok(d.querySelector("[data-gt-print]"));
  assert.equal(d.querySelectorAll(".gt-class-card .btn-primary").length, 1);
  assert.match(
    classDoc().querySelector(".gt-link svg").getAttribute("aria-label"),
    /QR code for the student link/,
  );
});

// The encoder stops at 106 bytes (QR version 5); longer links are shown without a code.
const LINKS = [...new Set(CHOSEN.map((c) => F.studentUrl(c.a)))];
const WITH_QR = LINKS.filter(F.qrFits);

test("student links are the public host, in the teacher's grades, and every one fits a QR code", () => {
  assert.equal(MAX_BYTES, 106);
  for (const url of LINKS) {
    assert.match(url, /^https:\/\/thelanguagepage\.com\/access-practice-lab\//, url);
    assert.ok(new URL(url).searchParams.get("grades"), url);
  }
  assert.deepEqual(
    LINKS.filter((u) => !F.qrFits(u)),
    [],
  );
  assert.ok(LINKS.length >= 55, `${LINKS.length} distinct student links`);
});

test("a scanner reads each Part 3 QR code back to its student link", {
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
const q = (href) => new URL(href, "https://x.test").searchParams;

test("render Part 1: Mr. Neft, the question, the grade switch and four skill cards into Part 2", async () => {
  localStorage.removeItem(INTRO_KEY);
  const { out, d } = await render({ part: "1", grades: "4-5" });
  assert.match(out.title, /Pick a skill/);
  const nb = d.querySelector("section.nb");
  assert.ok(nb, "Mr. Neft's bubble");
  assert.match(nb.querySelector(".nb-name").textContent, /Mr\. Neft/);
  assert.ok(nb.querySelector("details.nb-ask > summary"), "Ask Mr. Neft");
  assert.equal(
    d.querySelector("h1#gtTitle").textContent,
    "What would you like your students to practice?",
  );
  const grades = [...d.querySelectorAll("[data-gt-grades]")];
  assert.equal(grades.length, PICKS.length);
  assert.deepEqual(
    grades.filter((b) => b.getAttribute("aria-pressed") === "true").map((b) => b.dataset.gtGrades),
    ["4-5"],
  );
  const cards = [...d.querySelectorAll("a.gt-domain[data-gt-skill]")];
  assert.deepEqual(
    cards.map((c) => c.dataset.gtSkill),
    SKILLS,
  );
  for (const c of cards) {
    const p = q(c.getAttribute("href"));
    assert.equal(p.get("part"), "2");
    assert.equal(p.get("skill"), c.dataset.gtSkill);
    assert.equal(p.get("grades"), "4-5");
    const a = T.chooseActivity(index, "4-5", c.dataset.gtSkill, "A");
    assert.match(c.textContent, new RegExp(a.title.replace(/[?()[\]*+.]/g, ".")));
  }
  assert.equal(d.querySelectorAll(".gt-progress li").length, 3);
  assert.ok(d.querySelector(".gt-exit"), "Exit tour link");
  assert.ok(d.querySelector("details.gt-help [data-gt-restart]"), "restart inside Need help");
  assert.equal(d.querySelector(".gt-trail"), null, "no trail before a skill is chosen");
  assert.equal(d.querySelector("[data-gt-stage]"), null);
});

test("render Part 2: the coach comes before the frame, which opens the level A activity", async () => {
  localStorage.removeItem(INTRO_KEY);
  for (const skill of SKILLS) {
    const { out, d } = await render({ part: "2", grades: "6-8", skill });
    assert.match(out.title, /Try it as a student/, skill);
    const stage = d.querySelector(".gt-stage[data-gt-stage]");
    assert.ok(stage, skill);
    const kids = [...stage.children];
    const coach = kids.findIndex((k) => k.matches(".gt-coach[data-coach-slot]"));
    const frame = kids.findIndex((k) => k.matches("[data-gt-frame]"));
    assert.ok(coach >= 0 && frame > coach, `${skill}: coach first in DOM order`);
    const a = T.chooseActivity(index, "6-8", skill, "A");
    const src = stage.dataset.src;
    assert.ok(src.includes(a.route), `${skill}: ${src}`);
    assert.match(src, /frame=1/);
    assert.match(src, /grades=6-8/);
    assert.equal(d.querySelector("#gtTitle").textContent, a.title);
    const trail = d.querySelector(".gt-trail");
    assert.ok(trail, `${skill}: trail`);
    const chips = [...trail.querySelectorAll(".gt-chip")].map((c) => c.textContent.trim());
    assert.equal(chips.length, 2);
    assert.match(chips[0], new RegExp(a.domain.name));
    assert.match(chips[1], /Grades 6/);
    assert.equal(q(d.querySelector(".gt-skip-top a").getAttribute("href")).get("part"), "3");
    assert.equal(q(d.querySelector(".gt-nav a").getAttribute("href")).get("part"), "1");
  }
  assert.equal(loadIntro().guided.part, 2);
  assert.equal(loadIntro().guided.done, false);
  localStorage.removeItem(INTRO_KEY);
});

test("render Part 3: support, one primary on the class card, the ready line and a seven-stop map", async () => {
  localStorage.removeItem(INTRO_KEY);
  let { out, d } = await render({ part: "3", grades: "6-8", skill: "speaking" });
  assert.match(out.title, /Use it with your class/);
  assert.ok(d.querySelector("section.nb details.nb-ask"), "Mr. Neft's bubble");
  assert.equal(
    d.querySelector('[data-gt-support][aria-pressed="true"]').dataset.gtSupport,
    "A",
    "A is pressed by default",
  );
  assert.equal(d.querySelectorAll(".gt-class-card .btn-primary").length, 1);
  assert.ok(d.querySelector(".gt-class-card .btn-primary[data-gt-copy]"));
  assert.equal(d.querySelectorAll(".gt-map-stops a").length, 7);
  assert.match(
    d.querySelector(".gt-ready").textContent,
    /You’re ready to use this with students\./,
  );

  ({ out, d } = await render({ part: "3", grades: "6-8", skill: "speaking", support: "B" }));
  const want = T.chooseActivity(index, "6-8", "speaking", "B");
  assert.equal(d.querySelector("#gtCardTitle").textContent, want.title);
  assert.equal(d.querySelector('[data-gt-support="B"]').getAttribute("aria-pressed"), "true");
  assert.equal(d.querySelector("[data-gt-link]").getAttribute("value"), F.studentUrl(want));
  const saved = loadIntro().guided;
  assert.deepEqual(
    [saved.part, saved.done, saved.skill, saved.support, saved.pick],
    [3, true, "speaking", "B", "6-8"],
  );
  // A support level the grade choice does not have falls back to A.
  ({ d } = await render({ part: "3", grades: "K", skill: "reading", support: "C" }));
  if (!T.supportOptions(index, "K", "reading").some((o) => o.level === "C"))
    assert.equal(d.querySelector('[data-gt-support][aria-pressed="true"]').dataset.gtSupport, "A");
  localStorage.removeItem(INTRO_KEY);
});

test("render: Parts 2–3 without a skill, ?part=4 and ?stop= land on a real part; a bare tour resumes", async () => {
  localStorage.removeItem(INTRO_KEY);
  const title = async (route) => (await render(route)).out.title;
  assert.match(await title({ part: "2", grades: "6-8" }), /Pick a skill/, "Part 2 needs a skill");
  assert.match(await title({ part: "3", skill: "nope" }), /Pick a skill/, "unknown skill");
  assert.match(
    await title({ part: "4", skill: "writing", support: "A" }),
    /Use it with your class/,
  );
  assert.match(await title({ part: "9", skill: "writing" }), /Use it with your class/);
  assert.match(await title({ stop: "1" }), /Pick a skill/);
  localStorage.setItem(INTRO_KEY, JSON.stringify({ guided: { skill: "reading" } }));
  assert.match(await title({ stop: "3" }), /Try it as a student/);
  assert.match(await title({ stop: "6" }), /Use it with your class/);
  localStorage.setItem(
    INTRO_KEY,
    JSON.stringify({ guided: { part: 2, skill: "writing", pick: "6-8" } }),
  );
  const { out, d } = await render({});
  assert.match(out.title, /Try it as a student/);
  assert.ok(d.querySelector(".gt-back-note[role=status]"), "says you are back where you stopped");
  assert.ok(d.querySelector("[data-gt-stage]").dataset.src.includes("/Writing/A/"));
  localStorage.removeItem(INTRO_KEY);
  assert.match(await title({}), /Pick a skill/, "nothing saved starts at Part 1");
  localStorage.removeItem(INTRO_KEY);
});

test("render: a device saved by the old four-part tour (part 4) still opens on a real part", async () => {
  localStorage.setItem(
    INTRO_KEY,
    JSON.stringify({
      guided: { part: 4, goal: "share", skill: "reading", support: "A", done: true },
    }),
  );
  const out = await tour.render(ctxFor({}));
  assert.match(out.title, /Use it with your class/);
  localStorage.removeItem(INTRO_KEY);
});

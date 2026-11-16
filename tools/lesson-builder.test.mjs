// Lesson Builder assembly rules (access-practice-lab/src/lesson-builder/), against the real content/index.json read
// through the lab's own bandRows loader: every duration yields valid phases, bands never mix, the support profile
// shapes activity choice and frames, share links round-trip, and invalid or missing parameters are handled.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

const LAB = join(REPO_ROOT, "access-practice-lab");
globalThis.fetch = async (url) => {
  const path = String(url).replace(/^\/access-practice-lab\//, "");
  const text = readFileSync(join(LAB, path), "utf8");
  return { ok: true, status: 200, json: async () => JSON.parse(text) };
};

const { bandRows } = await import(join(LAB, "src/content.js"));
const A = await import(join(LAB, "src/lesson-builder/assemble.js"));
const R = await import(join(LAB, "src/lesson-builder/rules.js"));

const rowsFor = async (band) =>
  (await bandRows(band)).filter((r) => R.BUILDER_DOMAINS.includes(r.domain));
const ROWS = { "3-5": await rowsFor("3-5"), "6-8": await rowsFor("6-8") };
const settings = (over = {}) => ({
  band: "6-8",
  domains: ["Reading", "Speaking"],
  fn: "explain",
  support: "B",
  minutes: 30,
  topic: "",
  ...over,
});

test("content is present for both builder bands", () => {
  for (const band of R.BUILDER_BANDS)
    assert.ok(ROWS[band].length > 100, `${band}: ${ROWS[band].length} rows`);
});

test("every duration, band, function and profile yields valid phases", () => {
  for (const band of R.BUILDER_BANDS)
    for (const minutes of R.DURATIONS)
      for (const fn of R.FUNCTION_KEYS)
        for (const support of R.SUPPORT_KEYS) {
          const lesson = A.assembleLesson(
            settings({ band, minutes, fn, support, domains: R.BUILDER_DOMAINS }),
            ROWS[band],
          );
          const tag = `${band}/${minutes}/${fn}/${support}`;
          assert.deepEqual(
            lesson.phases.map((p) => p.key),
            R.PLANS[minutes].map(([k]) => k),
            tag,
          );
          assert.equal(A.totalMinutes(lesson), minutes, `${tag}: minutes add up`);
          assert.ok(
            lesson.objectives.content.startsWith("I can ") &&
              lesson.objectives.language.startsWith("I can "),
            tag,
          );
          const ids = new Set();
          for (const p of lesson.phases) {
            assert.ok(p.teacher.trim() && p.student.trim(), `${tag}/${p.key}: text`);
            assert.ok(
              !/\{|\bundefined\b|\bnull\b/.test(p.teacher + p.student),
              `${tag}/${p.key}: no unresolved text`,
            );
            const pick = R.PHASES[p.key].pick;
            if (pick === "best" || pick === "short") {
              assert.ok(p.activityId, `${tag}/${p.key}: has an activity`);
              assert.ok(!ids.has(p.activityId), `${tag}/${p.key}: activity not reused`);
              ids.add(p.activityId);
            } else if (pick === "none" || pick === "family")
              assert.equal(p.activityId, null, `${tag}/${p.key}`);
          }
        }
});

test("shorter lessons have fewer phases; 10 minutes keeps guided practice and an exit ticket", () => {
  const counts = R.DURATIONS.map(
    (m) => A.assembleLesson(settings({ minutes: m }), ROWS["6-8"]).phases.length,
  );
  for (let i = 1; i < counts.length; i++) assert.ok(counts[i] >= counts[i - 1], counts.join(","));
  const short = A.assembleLesson(settings({ minutes: 10 }), ROWS["6-8"]).phases.map((p) => p.key);
  assert.ok(short.includes("guided") && short.includes("exit") && !short.includes("input"));
  const full = A.assembleLesson(settings({ minutes: 45 }), ROWS["6-8"]).phases.map((p) => p.key);
  for (const k of [
    "opening",
    "vocabulary",
    "input",
    "guided",
    "task",
    "check",
    "feedback",
    "exit",
    "family",
  ])
    assert.ok(full.includes(k), k);
});

test("bands never mix and phases respect domains and Model-Test exclusion", () => {
  for (const band of R.BUILDER_BANDS) {
    const lesson = A.assembleLesson(
      settings({ band, minutes: 45, domains: ["Listening", "Writing"] }),
      [...ROWS["3-5"], ...ROWS["6-8"]],
    );
    const own = new Set(ROWS[band].map((r) => r.id));
    for (const p of lesson.phases.filter((x) => x.activityId)) {
      assert.ok(own.has(p.activityId), `${band}: ${p.activityId} belongs to ${band}`);
      const row = ROWS[band].find((r) => r.id === p.activityId);
      assert.ok(["Listening", "Writing"].includes(row.domain), `${p.key}: ${row.domain}`);
    }
    const input = lesson.phases.find((p) => p.key === "input");
    assert.equal(
      ROWS[band].find((r) => r.id === input.activityId).domain,
      "Listening",
      "input is interpretive",
    );
    const task = lesson.phases.find((p) => p.key === "task");
    assert.equal(
      ROWS[band].find((r) => r.id === task.activityId).domain,
      "Writing",
      "task is expressive",
    );
  }
});

test("the support profile shapes activity levels, frames and word banks", () => {
  for (const support of R.SUPPORT_KEYS) {
    const lesson = A.assembleLesson(settings({ support, minutes: 45 }), ROWS["6-8"]);
    const gap = (lv) => Math.abs("ABC".indexOf(lv) - "ABC".indexOf(support));
    for (const p of lesson.phases.filter((x) => x.activityId))
      assert.ok(
        gap(ROWS["6-8"].find((r) => r.id === p.activityId).level) <= 1,
        `${support}/${p.key}`,
      );
    const guided = lesson.phases.find((p) => p.key === "guided");
    assert.equal(
      ROWS["6-8"].find((r) => r.id === guided.activityId).level,
      support,
      `${support}: guided practice at the profile level`,
    );
    assert.deepEqual(guided.frames, R.FUNCTIONS.explain.frames[support]);
    assert.equal(
      lesson.phases.find((p) => p.key === "vocabulary").words.length,
      4 + "ABC".indexOf(support),
    );
  }
  const a = A.assembleLesson(settings({ support: "A" }), ROWS["6-8"]);
  const c = A.assembleLesson(settings({ support: "C" }), ROWS["6-8"]);
  assert.notDeepEqual(
    a.phases.map((p) => p.teacher),
    c.phases.map((p) => p.teacher),
  );
});

test("the language function and topic steer the choice; feedback reopens the task", () => {
  const lesson = A.assembleLesson(
    settings({ fn: "argue", domains: ["Speaking", "Writing"], minutes: 30 }),
    ROWS["6-8"],
  );
  const task = lesson.phases.find((p) => p.key === "task");
  const row = ROWS["6-8"].find((r) => r.id === task.activityId);
  assert.match(`${row.title} ${row.skill}`, R.FUNCTIONS.argue.match);
  assert.equal(lesson.phases.find((p) => p.key === "feedback").activityId, task.activityId);
  const sci = A.assembleLesson(settings({ topic: "science", minutes: 30 }), ROWS["6-8"]);
  const hits = sci.phases.filter(
    (p) =>
      p.activityId &&
      /science/i.test(JSON.stringify(ROWS["6-8"].find((r) => r.id === p.activityId))),
  );
  assert.ok(hits.length >= 1, "topic keyword finds at least one science activity");
});

test("assembly is deterministic", () => {
  const s = settings({ minutes: 45, fn: "compare", topic: "community" });
  assert.deepEqual(A.assembleLesson(s, ROWS["6-8"]), A.assembleLesson(s, ROWS["6-8"]));
});

test("share link round trip keeps order, removals and swapped activities, and nothing else", () => {
  const lesson = A.assembleLesson(settings({ minutes: 45, topic: "science" }), ROWS["6-8"]);
  [lesson.phases[1], lesson.phases[2]] = [lesson.phases[2], lesson.phases[1]];
  lesson.phases.splice(
    lesson.phases.findIndex((p) => p.key === "check"),
    1,
  );
  const gi = lesson.phases.findIndex((p) => p.key === "guided");
  const used = new Set(lesson.phases.map((p) => p.activityId).filter(Boolean));
  const alt = A.candidatesFor(ROWS["6-8"], lesson.settings, "guided", 9, used)[0];
  assert.ok(A.swapActivity(lesson, gi, alt.id, ROWS["6-8"]));
  lesson.phases[0].teacher = "PRIVATE NOTE about a student";
  lesson.phases[0].edited = true;
  const query = A.encodeShare(lesson);
  assert.ok(!/PRIVATE|student/i.test(decodeURIComponent(query)), "edited text is not in the link");
  assert.deepEqual([...new URLSearchParams(query).keys()].sort(), [
    "dom",
    "fn",
    "grades",
    "min",
    "seq",
    "sup",
    "topic",
  ]);
  const back = A.lessonFromShare(`?${query}`, ROWS["6-8"]);
  assert.deepEqual(back.settings, lesson.settings);
  assert.deepEqual(
    back.phases.map((p) => [p.key, p.activityId]),
    lesson.phases.map((p) => [p.key, p.activityId]),
  );
  assert.deepEqual(back.removed, ["check"]);
  assert.ok(A.restorePhase(back, "check", ROWS["6-8"]));
  assert.ok(back.phases.some((p) => p.key === "check") && back.removed.length === 0);
});

test("invalid or missing parameters fall back safely", () => {
  assert.deepEqual(A.normalizeSettings(), A.normalizeSettings(A.DEFAULT_SETTINGS));
  assert.deepEqual(A.normalizeSettings(null), A.normalizeSettings({}));
  const bad = A.decodeShare(
    "?grades=K&dom=Dancing,Reading&fn=sing&sup=Z&min=7&topic=<script>alert(1)</script>&seq=opening~bogus~guided.no%20way~guided.v3-s-a-2~exit~exit",
  );
  assert.equal(bad.settings.band, "6-8");
  assert.deepEqual(bad.settings.domains, ["Reading"]);
  assert.equal(bad.settings.fn, "explain");
  assert.equal(bad.settings.support, "B");
  assert.equal(bad.settings.minutes, 30);
  assert.ok(!/[<>()]/.test(bad.settings.topic));
  assert.deepEqual(
    bad.seq.map((s) => s.key),
    ["opening", "guided", "exit"],
    "bad keys, bad ids and duplicates dropped",
  );
  assert.equal(bad.seq[1].activityId, "v3-s-a-2");
  assert.equal(A.decodeShare("").has, false);
  assert.equal(A.decodeShare("?grades=3-5").has, false, "a grade alone is not a shared lesson");
  // An unknown activity id or a phase outside the plan is ignored, not trusted.
  const lesson = A.lessonFromShare("?min=10&seq=guided.not-a-real-id~vocabulary~exit", ROWS["6-8"]);
  assert.deepEqual(
    lesson.phases.map((p) => p.key),
    ["guided", "exit"],
  );
  assert.ok(ROWS["6-8"].some((r) => r.id === lesson.phases[0].activityId));
  // A 6-8 activity id in a 3-5 link is refused.
  const cross = A.lessonFromShare(
    `?grades=3-5&min=10&seq=guided.${ROWS["6-8"][0].id}`,
    ROWS["3-5"],
  );
  assert.ok(ROWS["3-5"].some((r) => r.id === cross.phases[0].activityId));
  // No rows: phases still build with a clear "no matching activity" direction.
  const empty = A.assembleLesson(settings(), []);
  assert.ok(empty.phases.find((p) => p.key === "guided").teacher.includes("No matching activity"));
});

test("saved configurations are parsed defensively", () => {
  assert.deepEqual(A.parseSaved("not json"), {});
  assert.deepEqual(A.parseSaved(""), {});
  const lesson = A.assembleLesson(settings(), ROWS["6-8"]);
  const saved = A.parseSaved(
    JSON.stringify({
      "Period 3": { savedAt: "2026-11-16", lesson },
      broken: { lesson: { phases: 4 } },
    }),
  );
  assert.deepEqual(Object.keys(saved), ["Period 3"]);
  assert.deepEqual(
    saved["Period 3"].lesson.phases.map((p) => p.activityId),
    lesson.phases.map((p) => p.activityId),
  );
  const hostile = A.parseSaved(
    JSON.stringify({
      x: {
        lesson: {
          settings: { band: "K" },
          phases: [{ key: "evil" }, { key: "guided", activityId: "../../etc" }, { key: "exit" }],
        },
      },
    }),
  );
  assert.deepEqual(
    hostile.x.lesson.phases.map((p) => p.key),
    ["exit"],
  );
  assert.equal(hostile.x.lesson.settings.band, "6-8");
});

test("rules: every function has frames for every profile, and the support note is not a diagnosis", () => {
  for (const [k, f] of Object.entries(R.FUNCTIONS)) {
    for (const s of R.SUPPORT_KEYS) assert.ok(f.frames[s].length >= 2, `${k}/${s}`);
    assert.ok(f.label[0] && f.label[1] && f.label[0] !== f.label[1], `${k}: bilingual label`);
    assert.ok(R.HOOKS[k], `${k}: hook`);
    assert.ok(R.KLU_ES[f.klu], `${k}: KLU`);
  }
  for (const p of Object.values(R.PHASES)) assert.ok(p.name[0] !== p.name[1]);
  for (const [m, plan] of Object.entries(R.PLANS))
    assert.equal(
      plan.reduce((s, [, x]) => s + x, 0),
      Number(m),
    );
  assert.match(R.SUPPORT_NOTE[0], /not WIDA proficiency levels/);
});

test("wiring: route, loader, sitemap, stylesheet and Launch Studio link", async () => {
  const main = readFileSync(join(LAB, "src/main.js"), "utf8");
  assert.match(main, /"lesson-builder": \(\) => import\("\.\/views\/lesson-builder\.js"\)/);
  assert.match(main, /"teacher-launch", "lesson-builder"/);
  const sm = await import(join(LAB, "src/sitemap.js"));
  assert.equal(sm.DEST_BY_ID["lesson-builder"].href, "lesson-builder");
  assert.match(readFileSync(join(LAB, "index.html"), "utf8"), /lesson-builder\.css/);
  assert.match(readFileSync(join(LAB, "src/views/launch-studio.js"), "utf8"), /\/lesson-builder"/);
  const view = readFileSync(join(LAB, "src/views/lesson-builder.js"), "utf8");
  assert.ok(!/\b(const|let|function)\s+(L|LS)\b/.test(view), "no local helper named L or LS");
});

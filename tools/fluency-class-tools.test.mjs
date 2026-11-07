// Class and learner tools: trouble-spot rule, action plan, Green Light, Questions Log.
// Expected values are written out by hand from the fixtures.
import assert from "node:assert/strict";

import {
  answers,
  clearStore,
  DAY,
  emptyTutor,
  keyOf,
  NOW,
  tutorWith,
} from "./lib/teacher-4-fixtures.mjs";

const lab = "../math/fluency-lab/";
const spots = await import(`${lab}trouble-spots.js`);
const plan = await import(`${lab}action-plan.js`);
const green = await import(`${lab}green-light.js`);
const log = await import(`${lab}questions-log.js`);
const { findSkill, localDay } = await import(`${lab}tutor-engine.js`);
const { ES_CLASS_TOOLS } = await import(`${lab}i18n-es-class-tools.js`);

clearStore();
const ADD = keyOf("add-20");
const mistake = (key, category, n, { resolved = false, at = NOW - DAY } = {}) => ({
  id: `m${n}`,
  key,
  question: `${n} + 9 = ?`,
  submitted: String(n),
  category,
  at: at - n,
  resolvedAt: resolved ? NOW : null,
});

// ---- #10 trouble-spot rule ----
{
  // Two misses: not yet a trouble spot.
  assert.deepEqual(
    spots.learnerTroubleSpots(tutorWith({ [ADD]: answers("cww", { start: NOW - 3 * DAY }) }), {
      now: NOW,
    }),
    [],
  );
  // Three independent misses with no named slip: the skill's own type.
  const three = tutorWith({ [ADD]: answers("wcww", { start: NOW - 4 * DAY }) });
  assert.deepEqual(spots.learnerTroubleSpots(three, { now: NOW }), [
    { key: ADD, category: "", misses: 3, repaired: false },
  ]);
  // Coached misses never count.
  assert.deepEqual(
    spots.learnerTroubleSpots(
      tutorWith({ [ADD]: answers("www", { independent: false, start: NOW - 3 * DAY }) }),
      { now: NOW },
    ),
    [],
  );
  // Misses older than the window never count.
  assert.deepEqual(
    spots.learnerTroubleSpots(tutorWith({ [ADD]: answers("www", { start: NOW - 40 * DAY }) }), {
      now: NOW,
    }),
    [],
  );
  // Three named slips of one kind: that slip is the type, and they are not counted again under the skill.
  const named = tutorWith(
    { [ADD]: answers("www", { start: NOW - 3 * DAY }) },
    [0, 1, 2].map((n) => mistake(ADD, "subtractInsteadOfAdding", n)),
  );
  assert.deepEqual(spots.learnerTroubleSpots(named, { now: NOW }), [
    { key: ADD, category: "subtractInsteadOfAdding", misses: 3, repaired: false },
  ]);
  // Repaired slips stay listed as repaired.
  const fixed = tutorWith(
    {},
    [0, 1, 2].map((n) => mistake(ADD, "omittedAddend", n, { resolved: true })),
  );
  assert.equal(spots.learnerTroubleSpots(fixed, { now: NOW })[0].repaired, true);
  // Two right answers in a row after the misses settle the skill's own type.
  assert.equal(
    spots.learnerTroubleSpots(tutorWith({ [ADD]: answers("wwwcc", { start: NOW - 5 * DAY }) }), {
      now: NOW,
    })[0].repaired,
    true,
  );
  // Grade filter.
  assert.deepEqual(spots.learnerTroubleSpots(three, { now: NOW, grade: 7 }), []);

  // Class ranking: open before repaired, then by learners sharing, then misses.
  const learners = [
    { label: "B", tutor: three },
    { label: "A", tutor: tutorWith({ [ADD]: answers("wwww", { start: NOW - 4 * DAY }) }) },
    { label: "C", tutor: named },
    { label: "D", tutor: fixed },
  ];
  const ranked = spots.rankTroubleSpots(learners, { now: NOW });
  assert.deepEqual(
    ranked.map((r) => [r.category, r.learners, r.misses, r.open]),
    [
      [null, ["A", "B"], 7, 2],
      ["subtractInsteadOfAdding", ["C"], 3, 1],
      ["omittedAddend", ["D"], 3, 0],
    ],
  );
  assert.equal(ranked[0].intervention.focus, ADD, "each spot carries a reteach plan");
  assert.deepEqual(ranked[0].intervention.practice.keys, [ADD]);
}

// ---- #11 student action plan ----
{
  const summary = {
    solid: ["Add within 20"],
    secondLook: ["Subtract within 20", "Add within 20"],
    gaps: ["Place value"],
    unsure: [],
    inferred: [],
    foundationGaps: [findSkill(ADD)],
  };
  const next = [findSkill(ADD), findSkill(ADD), findSkill("6:ratios")];
  const data = plan.actionPlanData(summary, next);
  assert.deepEqual(data.strengths, ["Add within 20", "Subtract within 20"]);
  assert.deepEqual(data.gaps, ["Place value", findSkill(ADD).title]);
  assert.deepEqual(
    data.nextSkills.map((s) => s.id),
    ["add-20", "ratios"],
  );
  assert.equal(
    plan.resumeUrl(findSkill("6:ratios"), "es"),
    "https://eduwonderlab.com/math/fluency-lab/?grade=6&skill=ratios&lang=es",
  );
  const html = plan.actionPlanHtml(summary, next, { date: "2026-11-06" });
  assert.match(html, /<svg [^>]*role="img"/, "the resume QR code fits");
  assert.doesNotMatch(
    html,
    /grade level|Grade \d|score of|placement|\d+%/i,
    "no grade level, score or placement",
  );
  assert.match(html, /not a grade or a test score/);
  const empty = plan.actionPlanHtml(
    { solid: [], secondLook: [], gaps: [], unsure: [], foundationGaps: [] },
    [],
  );
  assert.match(empty, /starting point/);
}

// ---- #8 Green Light ----
{
  const today = (h) => new Date(NOW).setHours(h, 0, 0, 0);
  const tutor = emptyTutor();
  tutor.records[ADD] = {
    recent: [
      ...Array.from({ length: 6 }, (_, i) => ({
        correct: true,
        independent: true,
        level: 1,
        at: today(9) + i,
      })),
      { correct: true, independent: false, level: 1, at: today(10) },
      { correct: false, independent: true, level: 1, at: today(10) },
      { correct: true, independent: true, level: 1, at: today(9) - 2 * DAY },
    ],
  };
  const facts = {
    facts: {
      "mul:6:7": {
        recent: [
          { correct: true, firstTry: true, supported: false, day: localDay(NOW) },
          { correct: true, firstTry: true, supported: true, day: localDay(NOW) },
          { correct: true, firstTry: true, supported: false, day: "2020-01-01" },
        ],
      },
    },
  };
  assert.equal(
    green.independentRightToday(tutor, facts, NOW),
    7,
    "6 practice + 1 fact; coached, wrong, supported and other days never count",
  );
  const light = green.greenLight(tutor, facts, NOW);
  assert.deepEqual(light, { count: 7, target: 10, green: false, left: 3 });
  const rewards = { greenDays: ["bad", "2026-10-01"] };
  assert.equal(green.noteGreenDay(rewards, light, NOW), false);
  const on = green.greenLight(tutor, facts, NOW, 5);
  assert.equal(on.green, true);
  assert.equal(green.noteGreenDay(rewards, on, NOW), true);
  assert.equal(green.noteGreenDay(rewards, on, NOW), false, "once a day");
  assert.deepEqual(rewards.greenDays, ["2026-10-01", localDay(NOW)]);
  const weeks = green.greenDaysPerWeek(
    [localDay(NOW), localDay(NOW - DAY), localDay(NOW - 8 * DAY), "nope"],
    NOW,
    3,
  );
  assert.equal(weeks.length, 3);
  assert.equal(
    weeks.reduce((s, w) => s + w.days, 0),
    3,
  );
}

// ---- #9 Questions Log ----
{
  const tutor = tutorWith({}, [
    {
      ...mistake(ADD, null, 3, { at: NOW - 2 * DAY }),
      problemPrompt: "3 + 9 = ?",
      studentInput: "11",
    },
    {
      ...mistake(ADD, null, 5, { at: NOW - DAY, resolved: true }),
      problemPrompt: "5 + 9 = ?",
      studentInput: "13",
    },
  ]);
  const entries = log.questionsLog(tutor);
  assert.deepEqual(
    entries.map((e) => [e.question, e.mine, e.repaired]),
    [
      ["5 + 9 = ?", "13", true],
      ["3 + 9 = ?", "11", false],
    ],
  );
  assert.deepEqual(log.questionsLog(tutor, { grade: 8 }), []);
  const sheet = log.freshWorksheet(entries, 7);
  assert.equal(sheet.length, 2);
  for (const [index, row] of sheet.entries()) {
    assert.equal(row.skill.id, "add-20", "same skill");
    assert.ok(!entries.some((e) => e.question === row.item.question), "never the original problem");
    assert.ok(index >= 0);
  }
  assert.deepEqual(
    log.freshWorksheet(entries, 7).map((r) => r.item.question),
    sheet.map((r) => r.item.question),
    "deterministic for a seed",
  );
  const html = log.worksheetHtml(sheet, { seed: 7 });
  assert.match(html, /break-before:page/, "answer key on its own page");
  const studentPart = html.split("fl-print-key")[0];
  for (const row of sheet) assert.ok(!studentPart.includes(`<b>${row.item.answers[0]}</b>`));
  assert.match(log.questionsLogHtml(entries), /13/);
}

// ---- audio-first, worked-example policy, "viewed example" flag (codec + assignment form + reports) ----
{
  const codec = await import(`${lab}assignment-codec.js`);
  const { validateAssignment, encodeAssignment, decodeAssignment } = await import(
    `${lab}school-tools.js`
  );
  const { markExampleViewed, recordAnswer, sanitizeTutor } = await import(`${lab}tutor-engine.js`);
  const { evaluateTarget } = await import(`${lab}assignment-targets.js`);
  const { assignmentFromDraft } = await import(`${lab}teacher-4-assign.js`);
  const base = {
    version: 1,
    grade: 1,
    keys: [ADD],
    count: 10,
    mode: "adaptive",
    challenge: "adaptive",
  };

  assert.deepEqual(codec.cleanExt({ audioFirst: true, example: "hide", junk: 1 }), {
    audioFirst: true,
    example: "hide",
  });
  assert.deepEqual(
    codec.cleanExt({ audioFirst: "yes", example: "always" }),
    {},
    "only true / known policies",
  );
  assert.equal(codec.encodeExt({ audioFirst: true }), "u");
  assert.equal(codec.encodeExt({ example: "after" }), "wa");
  assert.deepEqual(
    codec.decodeExt(codec.encodeExt({ audioFirst: true, example: "hide", due: "2026-11-20" })),
    {
      due: "2026-11-20",
      audioFirst: true,
      example: "hide",
    },
  );
  assert.deepEqual(codec.decodeExt("wx.u2"), {}, "unknown parts are ignored");

  for (const extra of [
    { audioFirst: true },
    { example: "after" },
    { audioFirst: true, example: "hide" },
  ]) {
    const link = decodeAssignment(encodeAssignment({ ...base, ...extra }));
    assert.equal(link.audioFirst, extra.audioFirst, "audioFirst survives the link");
    assert.equal(link.example, extra.example, "policy survives the link");
    assert.equal(
      codec.encodeShortCode({ ...base, ...extra }),
      null,
      "link-only settings never go in a class code",
    );
  }
  assert.ok(codec.encodeShortCode(base), "a plain assignment still has a code");
  const plain = validateAssignment(base);
  assert.ok(!("audioFirst" in plain) && !("example" in plain), "a plain assignment gains no keys");

  const draft = (extra) => ({
    ...base,
    label: "",
    lang: "en",
    tierLow: 1,
    tierHigh: 5,
    target: false,
    access: {},
    ...extra,
  });
  assert.equal(assignmentFromDraft(draft({ audioFirst: true })).audioFirst, true);
  assert.equal(assignmentFromDraft(draft({ example: "hide" })).example, "hide");
  assert.equal(assignmentFromDraft(draft({ example: "" })).example, undefined);

  // The viewed-example flag rides on the answer it belongs to, survives save/load, and reaches the report row.
  const skill = findSkill(ADD);
  const tutor = emptyTutor();
  recordAnswer(tutor, skill, { correct: true, independent: true, level: 1 }, NOW - 2000);
  recordAnswer(tutor, skill, { correct: false, independent: true, level: 1 }, NOW - 1000);
  markExampleViewed(tutor, skill);
  recordAnswer(
    tutor,
    skill,
    { correct: true, independent: false, level: 1, viewedExample: true },
    NOW,
  );
  assert.deepEqual(
    tutor.records[ADD].recent.map((entry) => entry.ex ?? 0),
    [0, 1, 1],
  );
  const saved = sanitizeTutor(JSON.parse(JSON.stringify(tutor)));
  assert.deepEqual(
    saved.records[ADD].recent.map((entry) => entry.ex ?? 0),
    [0, 1, 1],
  );
  assert.equal(evaluateTarget(base, saved, { now: NOW }).rows[0].exampleViews, 2);
  assert.equal(evaluateTarget(base, saved, { now: NOW, since: NOW - 500 }).rows[0].exampleViews, 1);
}

// ---- #29 teacher video for a skill ----
{
  const vids = await import(`${lab}skill-videos.js`);
  assert.equal(vids.cleanVideoUrl("https://youtu.be/abc123"), "https://youtu.be/abc123");
  for (const bad of [
    "http://example.com/v",
    "javascript:alert(1)",
    "data:text/html,hi",
    "https://user:pw@example.com/v",
    "https://localhost/v",
    `https://example.com/${"x".repeat(300)}`,
    "",
    null,
  ])
    assert.equal(vids.cleanVideoUrl(bad), "", `refused: ${String(bad).slice(0, 30)}`);
  const input = {
    "3:mul-0-5": { en: "https://a.example.com/1", es: "http://bad.example.com" },
    "x:bad": { en: "https://a.example.com/2" },
    "4:foo-bar": { es: "https://b.example.com/é" },
  };
  const cleaned = vids.cleanVideos(input);
  assert.deepEqual(Object.keys(cleaned), ["3:mul-0-5", "4:foo-bar"]);
  assert.deepEqual(
    cleaned["3:mul-0-5"],
    { en: "https://a.example.com/1" },
    "an unsafe link is dropped, the safe one kept",
  );
  const token = vids.encodeVideos(cleaned);
  assert.match(token, /^v1\.[\w-]+$/);
  assert.deepEqual(vids.decodeVideos(token), cleaned, "round trip, including non-ASCII");
  assert.equal(vids.decodeVideos("v1.!!!"), null);
  assert.equal(
    vids.decodeVideos(
      "v1." + Buffer.from(JSON.stringify({ "3:a": { en: "javascript:1" } })).toString("base64url"),
    ),
    null,
  );
  assert.equal(vids.encodeVideos({}), null);
  assert.equal(
    Object.keys(
      vids.cleanVideos(
        Object.fromEntries(
          Array.from({ length: 40 }, (_, i) => [`3:s${i}`, { en: "https://a.example.com/" }]),
        ),
      ),
    ).length,
    vids.MAX_VIDEOS,
  );
  clearStore();
  assert.equal(vids.acceptVideosFromHash("#nothing"), null);
  assert.ok(vids.acceptVideosFromHash(`#videos=${token}`));
  vids.saveVideos({ "3:mul-0-5": { es: "https://c.example.com/es" } });
  assert.deepEqual(
    vids.loadVideos()["3:mul-0-5"],
    { es: "https://c.example.com/es" },
    "a new link replaces that skill only",
  );
  assert.ok(vids.loadVideos()["4:foo-bar"], "other skills are kept");
  assert.deepEqual(
    vids.videoLinksFor("4:foo-bar", "es").map((l) => l.lang),
    ["es"],
  );
  const both = { "3:x": { en: "https://a.example.com/e", es: "https://a.example.com/s" } };
  assert.deepEqual(
    vids.videoLinksFor("3:x", "es", both).map((l) => l.lang),
    ["es", "en"],
    "learner language first",
  );
  assert.deepEqual(vids.videoLinksFor("3:none", "en", both), []);
}

// ---- #17 family letter, home-access cards, class fact poster ----
{
  const letter = await import(`${lab}family-letter.js`);
  const poster = await import(`${lab}fact-poster.js`);
  const { gradeFactDomain } = await import(`${lab}moby/fact-model.js`);
  assert.equal(letter.labUrl(4), "https://eduwonderlab.com/math/fluency-lab/?grade=4");
  assert.equal(
    letter.labUrl(0, "es"),
    "https://eduwonderlab.com/math/fluency-lab/?grade=0&lang=es",
  );
  assert.equal(
    letter.labUrl(99),
    "https://eduwonderlab.com/math/fluency-lab/",
    "an unknown grade opens the front door",
  );
  const pages = (html, tag) =>
    [...html.matchAll(new RegExp(`<article class="${tag}" lang="(\\w+)"`, "g"))].map((m) => m[1]);
  assert.deepEqual(pages(letter.letterHtml({ grade: 4, lang: "both" }), "fl-letter"), ["en", "es"]);
  assert.deepEqual(pages(letter.letterHtml({ grade: 4, lang: "es" }), "fl-letter"), ["es"]);
  const es = letter.letterHtml({
    grade: 4,
    lang: "es",
    teacher: "Sra. <b>Ruiz</b>",
    room: "Salón 12",
  });
  assert.match(es, /Bienvenidos/);
  assert.match(es, /Sra\. &lt;b&gt;Ruiz&lt;\/b&gt; · Salón 12/, "the teacher's text is escaped");
  assert.match(es, /grade=4&amp;lang=es/, "the Spanish letter opens the Spanish lab");
  assert.match(es, /<svg [^>]*role="img"/, "the letter carries a QR code");
  assert.doesNotMatch(es, /\b(Check|Reveal|WIDA)\b/);
  assert.equal(
    letter.cardSheetHtml({ grade: 3 }).split('class="fl-card"').length - 1,
    letter.CARDS_PER_SHEET,
  );
  for (let grade = 0; grade <= 8; grade += 1) {
    const bands = poster.posterBands(grade);
    assert.ok(bands.length >= 1, `grade ${grade} has bands`);
    if (grade !== 5)
      assert.ok(
        bands.every((band) => !band.maintain),
        `grade ${grade} shows what it is learning`,
      );
    for (const lang of ["en", "es"]) {
      const html = poster.posterHtml({ grade, lang });
      assert.equal(
        html.split('fl-poster-band"').length - 1,
        bands.length,
        `grade ${grade} ${lang}: one block per band`,
      );
      assert.match(html, /<svg [^>]*role="img"/);
      assert.doesNotMatch(html, /undefined|NaN/);
    }
  }
  const g4 = poster.posterHtml({ grade: 4, lang: "en" });
  assert.equal((g4.match(/<td>/g) || []).length > 150, true, "the multiplication chart is drawn");
  assert.match(g4, /<td>7 × 8<\/td>/);
  assert.doesNotMatch(g4, /\d\s=\s\d/, "the poster never prints answers");
  assert.match(poster.posterHtml({ grade: 3, lang: "es" }), /Multiplica hasta 10 × 10/);
  assert.deepEqual(
    gradeFactDomain(6)
      .bands.filter((band) => !band.maintain)
      .map((band) => band.id)
      .slice(0, 2),
    poster
      .posterBands(6)
      .map((band) => band.id)
      .slice(0, 2),
  );
}

// ---- #16 story of the day (family home) ----
{
  const story = await import(`${lab}family/story-of-day.js`);
  const { missingLanguages } = await import(`${lab}family/fm2/lang.js`);
  assert.deepEqual(missingLanguages(story.STORY_COPY), [], "every string has English and Spanish");
  const numbers = (text) =>
    (text.match(/\d[\d,.]*/g) || [])
      .map((n) => n.replace(/[,.]$/, ""))
      .sort()
      .join("|");
  for (let grade = 0; grade <= 8; grade += 1)
    for (const day of ["2026-11-06", "2026-11-07", "2026-12-25"]) {
      const stories = story.dailyStories(grade, day);
      assert.deepEqual(
        stories.map((entry) => entry.level),
        ["starter", "ontrack", "stretch"],
        `grade ${grade} ${day}: three levels`,
      );
      assert.deepEqual(
        stories,
        story.dailyStories(grade, day),
        "the same day always gives the same stories",
      );
      for (const entry of stories) {
        assert.ok(entry.en.length > 20 && entry.es.length > 20 && entry.en !== entry.es);
        assert.equal(
          numbers(entry.es),
          numbers(entry.en),
          `Spanish keeps the numbers (${entry.en})`,
        );
        assert.ok(entry.answer !== "" && entry.answer !== "NaN");
      }
    }
  assert.notDeepEqual(
    story.dailyStories(4, "2026-11-06"),
    story.dailyStories(4, "2026-11-07"),
    "a new day brings new stories",
  );
  assert.equal(story.dayKey(new Date(2026, 10, 6)), "2026-11-06");
  const html = story.storyHtml(
    [
      {
        level: "ontrack",
        grade: 4,
        skill: "S<x>",
        en: "A <b>story</b>",
        es: "Un <b>cuento</b>",
        answer: "12",
        unit: "",
      },
    ],
    { lang: "es" },
  );
  assert.match(html, /Un &lt;b&gt;cuento&lt;\/b&gt;/);
  assert.match(html, /La respuesta es 12\./);
  assert.match(html, /Destreza: S&lt;x&gt;/);
  assert.equal(story.storyHtml([]), "");
}

// ---- #12 Unit Check ----
{
  const uc = await import(`${lab}unit-check.js`);
  const toc = JSON.parse(
    (await import("node:fs")).readFileSync(
      new URL("../data/reveal-toc-2025.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(
    uc.UNIT_CHECKS.map((u) => u.unit),
    [2, 3, 4, 5, 6, 7, 8, 9],
    "units 1 and 10 have no check",
  );
  for (const unit of uc.UNIT_CHECKS) {
    assert.equal(
      toc.units.find((u) => u.unit === unit.unit).title,
      unit.en,
      `unit ${unit.unit} title is the publisher's`,
    );
    assert.ok(unit.es && unit.es !== unit.en, "Spanish title");
    assert.ok(unit.keys.length >= 2, "a unit check confirms several skills");
    for (const key of unit.keys) assert.ok(findSkill(key), `skill exists: ${key}`);
    const queue = uc.unitCheckQueue(unit, () => 0.3);
    assert.equal(queue.length, unit.keys.length * uc.PROBLEMS_PER_SKILL);
    assert.ok(
      queue.every((entry) => entry.independent === true && entry.tier === 3),
      "every problem is an independent first try",
    );
    for (const key of unit.keys)
      assert.equal(queue.filter((entry) => entry.key === key).length, uc.PROBLEMS_PER_SKILL);
  }
  const u3 = uc.unitCheckById("g6-u3");
  const outcome = uc.unitCheckOutcome(u3, {
    "6:ratios": { right: 2, total: 2 },
    "6:unit-rates": { right: 1, total: 2 },
  });
  assert.deepEqual(outcome.confirmed, ["6:ratios"], "only an all-right skill is confirmed");
  assert.deepEqual(uc.unitCheckOutcome(u3, {}).confirmed, [], "no answers confirm nothing");

  clearStore();
  const t0 = Date.UTC(2026, 10, 6, 15);
  assert.ok(uc.startUnitCheck("g6-u3", t0), "the first check of the day starts");
  assert.equal(
    uc.startUnitCheck("g6-u3", t0 + 60000),
    null,
    "a second check the same day is refused",
  );
  assert.ok(uc.startUnitCheck("g6-u4", t0 + 60000), "another unit is not limited");
  assert.equal(uc.startUnitCheck("nope", t0), null);
  const saved = uc.saveUnitCheckResult(
    "g6-u3",
    { "6:ratios": { right: 2, total: 2 }, "6:unit-rates": { right: 2, total: 2 } },
    t0 + 120000,
  );
  assert.deepEqual(
    saved.outcome.confirmed,
    ["6:ratios", "6:unit-rates"],
    "several skills confirmed at once",
  );
  assert.ok(uc.startUnitCheck("g6-u3", t0 + 86400000 + 5000), "the next day it is open again");
  uc.saveUnitCheckResult("g6-u3", { "6:ratios": { right: 0, total: 2 } }, t0 + 86400000 + 9000);
  assert.deepEqual(
    uc.loadUnitChecks()["g6-u3"].confirmed,
    ["6:ratios", "6:unit-rates"],
    "a later check never takes a confirmation back",
  );
  assert.deepEqual(
    uc.cleanUnitChecks({ "g6-u3": { confirmed: ["6:ratios", "9:evil"], day: "x", count: -4 } })[
      "g6-u3"
    ],
    { day: "", count: 0, at: 0, confirmed: ["6:ratios"] },
  );
  const t = (text, vars) => text.replace(/\{(\w+)\}/g, (_, name) => vars?.[name] ?? "");
  assert.equal(uc.unitCheckPanelHtml({ grade: 5, lang: "en", t }), "", "Grade 6 only");
  const panel = uc.unitCheckPanelHtml({ grade: 6, lang: "es", t, now: t0 + 86400000 + 10000 });
  assert.equal((panel.match(/data-start-unit=/g) || []).length, 8);
  assert.match(panel, /Razones y tasas/);
  assert.match(
    panel,
    /data-start-unit="g6-u3" aria-disabled="true"/,
    "today's used check is marked unavailable",
  );
}

// ---- #15 unit warm-ups ----
{
  const warm = await import(`${lab}warmup-sheets.js`);
  const { UNIT_CHECKS } = await import(`${lab}unit-check.js`);
  for (const unit of UNIT_CHECKS) {
    const set = warm.warmupProblems(unit, 8, 5);
    assert.equal(set.length, 8, `unit ${unit.unit}: enough problems`);
    assert.equal(new Set(set.map((entry) => entry.item.question)).size, 8, "all different");
    assert.ok(
      set.every(
        (entry) =>
          !entry.item.choices && unit.keys.includes(`${entry.skill.grade}:${entry.skill.id}`),
      ),
      "from the unit's own skills, typed answers",
    );
    assert.deepEqual(
      warm.warmupProblems(unit, 8, 5).map((e) => e.item.question),
      set.map((e) => e.item.question),
      "same seed, same set",
    );
    assert.notDeepEqual(
      warm.warmupProblems(unit, 8, 6).map((e) => e.item.question),
      set.map((e) => e.item.question),
      "new numbers",
    );
    for (const format of warm.WARMUP_FORMATS)
      for (const lang of ["en", "es", "both"]) {
        const html = warm.warmupHtml({ unit, format, lang, seed: 2 });
        const pages = lang === "both" ? 2 : 1;
        assert.equal(
          (html.match(/class="fl-warmup-key"/g) || []).length,
          pages,
          `${format}/${lang}: one answer key per language`,
        );
        assert.doesNotMatch(html, /undefined|NaN|\[object/);
        assert.doesNotMatch(
          html.replace(/<section class="fl-warmup-key">[\s\S]*?<\/section>/g, ""),
          /Answer key|Clave de respuestas/,
          "the key is its own section",
        );
      }
  }
  const unit = UNIT_CHECKS[1];
  const pair = warm.warmupHtml({ unit, format: "pair", lang: "en", seed: 1 });
  assert.equal((pair.match(/<tr>/g) || []).length, 4, "four pairs");
  const body = pair.split('<section class="fl-warmup-key">')[0];
  for (const entry of warm.warmupProblems(unit, 8, 1))
    assert.ok(!body.includes(`: ${entry.item.answers[0]}</li>`), "answers stay in the key");
  const match = warm.warmupHtml({ unit, format: "match", lang: "es", seed: 1 });
  assert.equal(
    (match.match(/<div class="fl-warmup-card">/g) || []).length,
    16,
    "eight problem cards and eight answer cards",
  );
  assert.match(match, /Mezcla y empareja/);
  assert.match(match, /Respuesta H/);
  assert.equal((match.match(/<li>\d → [A-H]<\/li>/g) || []).length, 8, "every card is in the key");
  const spanish = warm.warmupHtml({ unit, format: "pair", lang: "es", seed: 1 });
  assert.match(spanish, /Compañero A/);
  assert.match(spanish, /Unidad 3/);
}

// ---- #13 shareable manipulative boards ----
{
  const board = await import(`${lab}board-link.js`);
  const { MathVisualEngine, seeded, listModels } = await import(`${lab}e8/models.js`);
  const ratio = listModels().find((m) => m.id === "tapeRatio");
  const params = ratio.generate(seeded(7 * 31 + "tapeRatio".length), 6);
  const engine = new MathVisualEngine("tapeRatio", params);
  assert.ok(engine.dispatch({ type: "scale", value: 4 }).ok);
  assert.ok(!engine.dispatch({ type: "scale", value: 13 }).ok, "a refused move is not recorded");
  assert.ok(engine.dispatch({ type: "scale", value: 2 }).ok);
  engine.undo();
  assert.deepEqual(
    board.movesFromEngine(engine),
    [{ type: "scale", value: 4 }],
    "undo removes the last move",
  );
  engine.redo();
  assert.deepEqual(board.movesFromEngine(engine), [
    { type: "scale", value: 4 },
    { type: "scale", value: 2 },
  ]);
  engine.reset();
  assert.deepEqual(board.movesFromEngine(engine), []);
  engine.dispatch({ type: "scale", value: 5 });
  const moves = board.movesFromEngine(engine);
  const token = board.encodeBoard({ model: "tapeRatio", seed: 7, grade: 6, moves });
  assert.match(token, /^b1\.[\w-]+$/);
  const back = board.decodeBoard(token);
  assert.deepEqual(back, { model: "tapeRatio", seed: 7, grade: 6, moves });
  const rebuilt = new MathVisualEngine(
    "tapeRatio",
    ratio.generate(seeded(back.seed * 31 + back.model.length), back.grade),
  );
  assert.equal(board.replayMoves(rebuilt, back.moves), 1);
  assert.deepEqual(rebuilt.state, engine.state, "the link rebuilds the same board");
  assert.equal(
    board.replayMoves(rebuilt, [{ type: "scale", value: 99 }, { nonsense: true }, null]),
    0,
    "refused or malformed moves change nothing",
  );
  // Untrusted input
  assert.equal(board.decodeBoard("b1.@@@"), null);
  assert.equal(board.decodeBoard("b2.abc"), null);
  assert.equal(board.encodeBoard({ model: "../x", seed: 1, grade: 3 }), null);
  assert.equal(board.encodeBoard({ model: "a", seed: 0, grade: 3 }), null);
  assert.equal(board.encodeBoard({ model: "a", seed: 1, grade: 12 }), null);
  const hostile = board.cleanBoard({
    model: "a",
    seed: 1,
    grade: 3,
    moves: [
      { type: "x", fn: () => 1 },
      { type: { deep: 1 } },
      { "bad key": 1 },
      { type: "ok", value: 3 },
      "str",
      Array(3),
    ],
  });
  assert.deepEqual(
    hostile.moves,
    [{ type: "ok", value: 3 }],
    "only flat, short, plain moves survive",
  );
  assert.equal(
    board.cleanBoard({
      model: "a",
      seed: 1,
      grade: 3,
      moves: Array.from({ length: 200 }, () => ({ type: "t" })),
    }).moves.length,
    board.MAX_MOVES,
  );
  assert.equal(
    board.encodeBoard({
      model: "a",
      seed: 1,
      grade: 3,
      moves: Array.from({ length: 60 }, (_, i) => ({
        type: `move${i}`,
        value: i,
        note: "x".repeat(30),
        other: "y".repeat(30),
      })),
    }),
    null,
    "too long for a link",
  );
  assert.equal(board.boardFromHash(`#board=${token}`).seed, 7);
  assert.equal(board.boardFromHash("#assignment=abc"), null);
  assert.match(
    board.boardUrl({ model: "tapeRatio", seed: 7, grade: 6, moves }),
    /^https:\/\/eduwonderlab\.com\/math\/fluency-lab\/\?view=models&grade=6#board=b1\./,
  );
  const longLog = new MathVisualEngine("tapeRatio", params);
  for (let i = 0; i < 450; i += 1) longLog.dispatch({ type: "scale", value: 2 + (i % 2) });
  assert.equal(board.movesFromEngine(longLog), null, "a cut-short log cannot be shared");
}

// ---- #19 student-written problems for Team Relay ----
{
  const sp = await import(`${lab}student-problems.js`);
  const { validateAnswer } = await import(`${lab}problem-bank.js`);
  assert.deepEqual(sp.cleanStudentProblem({ question: "short", answer: "4" }), {
    error: "question",
  });
  assert.deepEqual(sp.cleanStudentProblem({ question: "12 × 3 + 4 = ?", answer: " " }), {
    error: "answer",
  });
  const clean = sp.cleanStudentProblem({ question: "  What is <b>12</b> × 3?\n\n", answer: "36" });
  assert.deepEqual(
    clean,
    { question: "What is b 12 /b × 3?", answer: "36" },
    "markup characters and line breaks are removed",
  );
  const code = sp.encodeStudentProblem({
    question: "Sofía tiene 12 lápices y compra 3 más. ¿Cuántos tiene?",
    answer: "15",
  });
  assert.match(code, /^SP1\.[\w-]+$/);
  assert.deepEqual(
    sp.decodeStudentProblem(code),
    { question: "Sofía tiene 12 lápices y compra 3 más. ¿Cuántos tiene?", answer: "15" },
    "any language, accents intact",
  );
  for (const bad of ["", "SP2.abc", "SP1.@@", `SP1.${"a".repeat(800)}`, "SP1.e30"])
    assert.equal(sp.decodeStudentProblem(bad), null);
  assert.equal(sp.encodeStudentProblem({ question: "tiny", answer: "1" }), null);

  const number = sp.cardFromStudentProblem({
    question: "What is 1,200 divided by 4?",
    answer: "300",
  });
  assert.equal(number.kind, "number");
  assert.ok(
    validateAnswer("300", number) &&
      validateAnswer("300.0", number) &&
      !validateAnswer("30", number),
    "a card is judged like any lab problem",
  );
  const text = sp.cardFromStudentProblem({
    question: "Is 17 prime or composite?",
    answer: "Prime",
  });
  assert.ok(
    text.kind === "text" && validateAnswer("prime", text) && !validateAnswer("composite", text),
  );
  assert.equal(number.studentWritten, true);

  assert.equal(sp.arithmeticCheck({ question: "12 × 3 + 4 = ?", answer: "40" }), "ok");
  assert.equal(sp.arithmeticCheck({ question: "12 × 3 + 4", answer: "41" }), "mismatch");
  assert.equal(sp.arithmeticCheck({ question: "(8 + 4) ÷ 3", answer: "4" }), "ok");
  assert.equal(
    sp.arithmeticCheck({ question: "What is 12 × 3?", answer: "36" }),
    "unchecked",
    "a word problem is checked by the teacher",
  );
  assert.equal(sp.arithmeticCheck({ question: "12 + 4", answer: "sixteen" }), "unchecked");
  assert.equal(
    sp.arithmeticCheck({ question: "alert(1) + 2 + 3", answer: "6" }),
    "unchecked",
    "never evaluates anything but numbers and operators",
  );

  const a = sp.encodeStudentProblem({ question: "12 × 3 + 4 = ?", answer: "40" });
  const b = sp.encodeStudentProblem({ question: "What is 7 + 8 in words?", answer: "fifteen" });
  const first = sp.addCodes([], `${a}\n${b}, ${a} not-a-code  SP1.zzz`);
  assert.equal(first.added, 2);
  assert.equal(first.skipped, 3, "a repeat and two bad codes are skipped");
  assert.ok(
    first.deck.every((entry) => entry.approved === false),
    "nothing is approved until the teacher says so",
  );
  assert.deepEqual(sp.approvedCards(first.deck), []);
  const approved = first.deck.map((entry, i) => ({ ...entry, approved: i === 1 }));
  assert.deepEqual(
    sp.approvedCards(approved).map((card) => card.answers[0]),
    ["fifteen"],
  );
  clearStore();
  sp.saveDeck(approved);
  assert.deepEqual(sp.loadDeck(), approved, "the deck survives a reload");
  assert.deepEqual(
    sp.cleanDeck([
      { code: "SP1.zzz", approved: true },
      { code: a, approved: "yes" },
    ]),
    [{ code: a, approved: false }],
  );
  const many = Array.from({ length: 60 }, (_, i) =>
    sp.encodeStudentProblem({ question: `Problem number ${i} is here`, answer: String(i) }),
  );
  assert.equal(sp.addCodes([], many.join(" ")).deck.length, sp.MAX_DECK);
}

// ---- #20 campaign wrapper ----
{
  const cg = await import(`${lab}campaign.js`);
  const { UNIT_CHECKS } = await import(`${lab}unit-check.js`);
  const { missingLanguages } = await import(`${lab}family/fm2/lang.js`);
  assert.deepEqual(
    missingLanguages({ t: cg.CAMPAIGN_TITLE, l: cg.CAMPAIGN_LEAD, c: cg.CHAPTERS }),
    [],
    "every chapter has English and Spanish",
  );
  assert.deepEqual(
    cg.CHAPTERS.map((c) => c.unit),
    UNIT_CHECKS.map((u) => u.unit),
    "one chapter per Unit Check, in unit order",
  );
  for (const chapter of cg.CHAPTERS)
    assert.ok(
      chapter.intro.en.length > 60 &&
        chapter.beat.en.length > 20 &&
        chapter.title.es !== chapter.title.en,
    );
  clearStore();
  const states = (records) => cg.campaignState(records).map((s) => s.status);
  assert.deepEqual(
    states({}),
    ["current", "later", "later", "later", "later", "later", "later", "later"],
    "a new learner starts at chapter 1",
  );
  const confirm = (...ids) =>
    Object.fromEntries(
      ids.map((id) => [
        id,
        {
          day: "2026-11-06",
          count: 1,
          at: 1,
          confirmed: UNIT_CHECKS.find((u) => u.id === id).keys,
        },
      ]),
    );
  assert.deepEqual(
    states(confirm("g6-u2")).slice(0, 3),
    ["done", "current", "later"],
    "the story moves on when a unit is confirmed",
  );
  const partial = { "g6-u2": { day: "", count: 1, at: 1, confirmed: ["5:divide-whole"] } };
  assert.equal(
    cg.campaignState(partial)[0].status,
    "current",
    "one confirmed skill of two is not enough",
  );
  assert.equal(cg.campaignState(partial)[0].confirmed.length, 1);
  assert.deepEqual(
    states(confirm("g6-u3")).slice(0, 2),
    ["current", "done"],
    "a later unit can be confirmed first without skipping chapter 1",
  );
  const t = (text, vars) => text.replace(/\{(\w+)\}/g, (_, name) => vars?.[name] ?? "");
  const titleOf = (key) => key;
  assert.equal(
    cg.campaignPanelHtml({ grade: 5, lang: "en", t, skillTitle: titleOf, records: {} }),
    "",
  );
  const html = cg.campaignPanelHtml({
    grade: 6,
    lang: "es",
    t,
    skillTitle: titleOf,
    records: confirm("g6-u2"),
  });
  assert.match(html, /La campaña del faro/);
  assert.match(html, /data-status="done"[^>]*>[\s\S]*El registro es claro/);
  assert.match(html, /data-status="current"[\s\S]*Mezclar la pintura/);
  assert.match(html, /data-start-unit="g6-u3"/, "the current chapter ends in its Unit Check");
  assert.match(html, /href="\.\/\?grade=6&skill=ratios"/, "Learn links open the skill");
  assert.match(
    html,
    /href="\.\/\?grade=6&skill=ratios&stage=practice"/,
    "Practise links open its practice",
  );
  assert.equal((html.match(/data-status="later"/g) || []).length, 6);
  assert.doesNotMatch(html, /La lámpara gira/, "a later chapter's ending stays hidden");
}

for (const text of [
  "My Questions Log",
  "Warm-ups for this unit",
  "Unit Check",
  "Your video for a skill",
  "Listening and worked examples",
  "Opened a worked example on {n} answers",
  "Still to fix",
  "Fixed",
  "My math action plan",
  "What I already do well",
])
  assert.ok(ES_CLASS_TOOLS[text], `Spanish: ${text}`);
console.log("fluency-class-tools: ok");

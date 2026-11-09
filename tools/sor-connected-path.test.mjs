// Phonics Path browser check: the path lists every lesson by level and unit, a learner can finish a lesson through every
// phase (learn, build, decode, sort, spell, read, write, apply), progress saves and resumes, and a later lesson opens.
import assert from "node:assert/strict";
import { chromium } from "playwright";
import {
  LEVELS,
  lessonById,
  phasesFor,
  READING_LESSONS,
  validateSequence,
} from "../access-practice-lab/src/sor/sequence.js";
import { serveAccess } from "./lib/access-serve.mjs";

assert.deepEqual(validateSequence(), []);
const { server, base } = await serveAccess();
const browser = await chromium.launch();

async function finishLesson(page, lesson) {
  const phases = phasesFor(lesson);
  await page.locator('[data-sor-next="build"]').click();
  const picked = [];
  lesson.build.units.forEach((unit) => picked.push(unit));
  for (const unit of picked) {
    const index = lesson.build.tiles.indexOf(unit);
    await page.locator(`[data-sor-tile-index="${index}"]`).click();
  }
  await page.locator('[data-sor-check="build"]').click();
  assert.match(await page.locator(".sor2-stage").innerText(), /Decode a new word/, lesson.id);
  await page.locator(`[data-sor-choice="${lesson.read.word}"]`).click();
  await page.locator('[data-sor-check="read"]').click();
  if (phases.includes("sort")) {
    assert.match(await page.locator(".sor2-stage").innerText(), /Sort the words/, lesson.id);
    // A wrong pile first: it must be refused and counted, never accepted.
    const first = lesson.sort.a.words[0];
    await page.locator(`[data-sor-sort="${first}:b"]`).click();
    assert.match(await page.locator(".sor2-feedback").innerText(), /Not that pile/);
    for (const [bucket, side] of [
      ["a", lesson.sort.a],
      ["b", lesson.sort.b],
    ])
      for (const word of side.words)
        await page.locator(`[data-sor-sort="${word}:${bucket}"]`).click();
    await page.locator('[data-sor-next="spell"]').click();
  }
  await page.locator('[data-sor-input="spelling"]').fill(lesson.spell.word);
  await page.locator('[data-sor-check="spell"]').click();
  await page
    .locator('[data-sor-input="explanation"]')
    .fill(`The answer is ${lesson.answerWords[0]} in the text.`);
  await page.locator('[data-sor-check="text"]').click();
  if (phases.includes("dictation")) {
    assert.match(await page.locator(".sor2-stage").innerText(), /Write the sentence/, lesson.id);
    await page
      .locator('[data-sor-input="dictation"]')
      .fill(lesson.dictation.sentence.toLowerCase().replace(/[.?!]$/, ""));
    await page.locator('[data-sor-check="dictation"]').click();
    assert.match(await page.locator(".sor2-feedback").innerText(), /capital letter/);
    await page.locator('[data-sor-input="dictation"]').fill(lesson.dictation.sentence);
    await page.locator('[data-sor-check="dictation"]').click();
  }
  await page.locator('[data-sor-input="transfer"]').fill(lesson.transfer.word);
  await page.locator('[data-sor-check="transfer"]').click();
  assert.match(await page.locator(".sor2-stage").innerText(), /Lesson complete/, lesson.id);
}

try {
  const context = await browser.newContext();
  await context.addInitScript(() =>
    localStorage.setItem(
      "accessPracticeLab:v1:prefs",
      JSON.stringify({ band: "3-5", lang: "en", langChosen: true }),
    ),
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => {
    if (!/web-vitals/.test(error.message)) errors.push(error.message);
  });
  await page.goto(`${base}/access-practice-lab/`, { waitUntil: "networkidle" });
  await page.goto(`${base}/access-practice-lab/science-of-reading/path?grades=3-5`, {
    waitUntil: "networkidle",
  });
  assert.equal(await page.locator(".sor2-path-card").count(), READING_LESSONS.length);
  assert.equal(await page.locator(".sor2-level").count(), LEVELS.length);
  assert.equal(
    await page.locator(".sor2-unit").count(),
    LEVELS.reduce((n, l) => n + l.units.length, 0),
  );
  assert.match(await page.locator(".sor2-resume").innerText(), /0 of \d+ lessons complete/);

  // Level 1, lesson 1: every phase, with the wrong-pile and dictation-format feedback exercised.
  const first = lessonById("cvc-short-a");
  await page.locator('a[href*="lesson/cvc-short-a"]').first().click();
  assert.ok(await page.locator(".sor2-card").count());
  await finishLesson(page, first);
  assert.ok(await page.locator(".sor2-stars").count());
  const records = await page.evaluate(() => ({
    state: JSON.parse(localStorage.getItem("accessPracticeLab:v1:sor")),
    ledger: JSON.parse(localStorage.getItem("accessPracticeLab:v1:ledger")),
  }));
  assert.ok(records.state["cvc-short-a"].doneAt);
  assert.ok(
    records.ledger.entries.some(
      (e) =>
        e.src === "phonics" &&
        e.task === "cvc-short-a" &&
        e.kind === "transfer" &&
        e.stage === "independent",
    ),
  );
  assert.ok(
    records.ledger.entries.some(
      (e) => e.src === "phonics" && e.task === "cvc-short-a" && e.m?.skill === "sort",
    ),
  );
  await page.reload({ waitUntil: "networkidle" });
  assert.match(await page.locator(".sor2-stage").innerText(), /Lesson complete/);

  // The path now shows the lesson complete and offers the next one.
  await page.goto(`${base}/access-practice-lab/science-of-reading/path?grades=3-5`, {
    waitUntil: "networkidle",
  });
  assert.match(
    await page.locator(".sor2-resume").innerText(),
    new RegExp(`1 of ${READING_LESSONS.length} lessons complete`),
  );
  assert.ok(await page.locator(".sor2-path-card.is-done").count());

  // Restart keeps the completion record and reopens the lesson at the start.
  await page.goto(`${base}/access-practice-lab/science-of-reading/lesson/cvc-short-a?grades=3-5`, {
    waitUntil: "networkidle",
  });
  await page.locator("[data-sor-restart]").click();
  assert.match(await page.locator(".sor2-stage").innerText(), /Review and learn/);
  assert.ok(
    (await page.evaluate(() => JSON.parse(localStorage.getItem("accessPracticeLab:v1:sor"))))[
      "cvc-short-a"
    ].doneAt,
  );

  // Reset: one lesson forgets everything it held, then the whole path starts fresh.
  await page.goto(`${base}/access-practice-lab/science-of-reading/lesson/cvc-short-a?grades=3-5`, {
    waitUntil: "networkidle",
  });
  await page.locator(".sor2-reset summary").click();
  await page.locator("[data-sor-reset]").click();
  assert.match(await page.locator(".sor2-stage").innerText(), /Review and learn/);
  assert.equal(
    (
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("accessPracticeLab:v1:sor") || "{}"),
      )
    )["cvc-short-a"],
    undefined,
    "lesson reset removes its saved work, including completion",
  );
  await page.goto(`${base}/access-practice-lab/science-of-reading/lesson/l1-short-i?grades=3-5`, {
    waitUntil: "networkidle",
  });
  await page.locator('[data-sor-next="build"]').click();
  await page.goto(`${base}/access-practice-lab/science-of-reading/path?grades=3-5`, {
    waitUntil: "networkidle",
  });
  assert.match(await page.locator(".sor2-resume").innerText(), /Continue/);
  // Start everything fresh: a footer control on any page clears the whole lab (every activity) after a confirmation.
  await page.evaluate(() => {
    localStorage.setItem(
      "accessPracticeLab:v1:ledger",
      JSON.stringify({ v: 1, entries: [{ id: "x" }] }),
    );
    localStorage.setItem("accessPracticeLab:other:note", "kept work");
    localStorage.setItem("accessTeacher:roster", "teacher data");
    sessionStorage.setItem("accessPracticeLab:session", "1");
  });
  await page.locator("footer [data-start-fresh]").first().click();
  assert.ok(await page.locator("dialog.start-fresh[open]").count(), "a confirmation opens first");
  await page.locator("dialog.start-fresh button[type=submit]").click();
  assert.ok(
    await page.evaluate(() => localStorage.getItem("accessPracticeLab:v1:ledger")),
    "cancel keeps the work",
  );
  await page.locator("footer [data-start-fresh]").first().click();
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes("science-of-reading")),
    page.locator("[data-start-fresh-confirm]").click(),
  ]);
  await page.waitForLoadState("networkidle");
  const left = await page.evaluate(() => ({
    lab: Object.keys(localStorage).filter((k) => k.startsWith("accessPracticeLab")),
    session: Object.keys(sessionStorage).filter((k) => k.startsWith("accessPracticeLab")),
    teacher: localStorage.getItem("accessTeacher:roster"),
  }));
  assert.deepEqual(left.session, []);
  assert.ok(!left.lab.some((k) => /sor|ledger|other:note/.test(k)), `lab keys left: ${left.lab}`);
  assert.equal(left.teacher, "teacher data", "teacher data is never part of a learner reset");

  // Level 3: a multi-syllable morphology lesson runs end to end too.
  const late = lessonById("prefix-un");
  await page.goto(`${base}/access-practice-lab/science-of-reading/lesson/${late.id}?grades=3-5`, {
    waitUntil: "networkidle",
  });
  await finishLesson(page, late);
  // Grade 1 and Grades 2-3 learners are not walled out: the early home links to the path and the path opens for them.
  for (const picker of ["1", "2-3"]) {
    const early = await browser.newContext();
    await early.addInitScript(
      (band) =>
        localStorage.setItem(
          "accessPracticeLab:v1:prefs",
          JSON.stringify({ band, lang: "en", langChosen: true }),
        ),
      picker,
    );
    const kid = await early.newPage();
    await kid.goto(`${base}/access-practice-lab/early?grades=${picker}`, {
      waitUntil: "networkidle",
    });
    await kid.locator('a[href*="science-of-reading/path"]').first().click();
    await kid.locator(".sor2-path-card").first().waitFor();
    assert.equal(await kid.locator(".sor2-path-card").count(), READING_LESSONS.length, picker);
    assert.ok(
      await kid.locator('a[href*="/early?grades="]').count(),
      "path links back to the practice home",
    );
    await kid.locator('a[href*="lesson/cvc-short-a"]').first().click();
    assert.match(await kid.locator(".sor2-stage").innerText(), /Review and learn/, picker);
    await early.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    `sor-connected-path: ${READING_LESSONS.length} lessons listed; all phases, save, resume, restart passed`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

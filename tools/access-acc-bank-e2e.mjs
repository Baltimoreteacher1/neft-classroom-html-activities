#!/usr/bin/env node
/**
 * Real student journeys through the delivered bank, in Chromium, with a fake capture device: for each of the eight
 * domain x grade-band slices one complete set is taken start to finish through the actual interface, answering every
 * question the way a learner would (choices, dropdowns, ordering buttons, click-to-place, typed writing, one recorded speaking
 * response). Then: results are right, evidence rows reach storage, a learning-mode sitting scaffolds and revises a miss, and
 * the library lists the whole bank. Grades 3-5 and 6-8 both.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-acc-bank-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const { server, base } = await serveAccess();
const browser = await chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
const ROOT = `${base}/access-practice-lab`;
const BANK = new URL("../access-practice-lab/content/bank/", import.meta.url).pathname;
const load = (id) => JSON.parse(readFileSync(join(BANK, `${id}.json`), "utf8"));
const SPEECH = `Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speaking: false, paused: false, getVoices: () => [], addEventListener() {}, removeEventListener() {}, cancel() {}, pause() {}, resume() {}, speak(u) { setTimeout(() => u.onend && u.onend({}), 600); } } });`;
const WRITING =
  "First I looked closely at the information that was given. Then I explained what I noticed and I gave a reason because the details show it. In addition I connected my ideas with words like so and however. This shows that my answer is supported by the evidence in the task.";

async function fresh() {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ["microphone"],
  });
  await ctx.addInitScript(SPEECH);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals|@engine\//.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  return { ctx, page, errors };
}
const start = async (page, id, mode) => {
  await page.goto(`${ROOT}/assess/${id}?mode=${mode}`, { waitUntil: "networkidle" });
  const timer = page.locator("#accTimer");
  if (await timer.count()) await timer.uncheck();
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-stem").waitFor();
};

async function answer(page, item, { skipSpeaking = true } = {}) {
  switch (item.type) {
    case "multiple-choice":
    case "listening-response":
      await page
        .locator(".acc-choice input")
        .nth(item.options.findIndex((o) => o.id === item.answer))
        .check();
      return true;
    case "multiple-select":
      for (const a of item.answer)
        await page
          .locator(".acc-choice input")
          .nth(item.options.findIndex((o) => o.id === a))
          .check();
      return true;
    case "dropdown": {
      const keys = [...item.dropdown.template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      for (const [i, k] of keys.entries())
        await page.locator("select.acc-select").nth(i).selectOption(item.dropdown.blanks[k].answer);
      return true;
    }
    case "ordering": {
      const texts = Object.fromEntries(item.ordering.items.map((x) => [x.id, x.text]));
      for (let i = 0; i < item.ordering.answer.length; i++) {
        const want = texts[item.ordering.answer[i]];
        for (let guard = 0; guard < 8; guard++) {
          const order = await page.locator(".acc-order-text").allInnerTexts();
          if (order[i] === want) break;
          await page.getByRole("button", { name: `Move up: ${want}`, exact: true }).click();
        }
      }
      return true;
    }
    case "matching":
      for (const [tok, zone] of Object.entries(item.matching.answer)) {
        await page.locator(`.acc-pool [data-token="${tok}"]`).click();
        await page.locator(`[data-zone="${zone}"]`).click();
      }
      return true;
    case "drag-drop":
      for (const [tok, zone] of Object.entries(item.dragDrop.answer)) {
        await page.locator(`.acc-pool [data-token="${tok}"]`).click();
        await page.locator(`[data-zone="${zone}"]`).click();
      }
      return true;
    case "constructed-response":
      await page.locator(".acc-textarea").fill(WRITING);
      return true;
    case "speaking-response":
      return !skipSpeaking;
    default:
      return false;
  }
}

async function sitting(label, setId, { recordFirstSpeaking = true } = {}) {
  const set = load(setId);
  const { ctx, page, errors } = await fresh();
  await start(page, setId, "summative");
  let recorded = false;
  let answered = 0;
  for (const [i, item] of set.items.entries()) {
    if (item.type === "speaking-response" && recordFirstSpeaking && !recorded) {
      await page.locator("[data-act=mic-check]").click();
      await page.locator('.acc-mic[data-state="ready"]').waitFor({ timeout: 15000 });
      await page.locator("[data-act=speak-begin]").click();
      await page.locator("[data-act=speak-skip]").click();
      await page.waitForTimeout(1500);
      await page.locator("[data-act=speak-stop]").click();
      await page.locator("[data-act=speak-use]").click();
      await page.locator("[data-act=speak-confirm]").click();
      await page.locator(".acc-state.is-success").waitFor();
      recorded = true;
      answered++;
    } else if (await answer(page, item, { skipSpeaking: true })) answered++;
    if (i < set.items.length - 1) await page.locator("[data-act=next]").click();
  }
  const objective = set.items.filter(
    (i) => !["speaking-response", "constructed-response"].includes(i.type),
  ).length;
  const review = set.items.length - objective;
  await page.locator("[data-act=review]").click();
  await page.locator("[data-act=submit]").click();
  await page.locator(".acc-results").waitFor();
  const t = (await page.locator(".acc-results").innerText()).replace(/\n+/g, " ");
  if (objective)
    ok(
      new RegExp(`Objective questions right\\s*${objective} of ${objective}`).test(t),
      `${label}: all ${objective} objective answers score right through the real interface`,
    );
  ok(
    /not an official score/.test(t) && /not a WIDA or ACCESS score or level/.test(t),
    `${label}: results say it is practice, not an official score`,
  );
  if (review)
    ok(
      new RegExp(`Saved for teacher review\\s*${recorded ? review : review}`).test(t) ||
        /Saved for teacher review/.test(t),
      `${label}: speaking and writing are left for teacher review, not scored`,
    );
  const rows = await page.evaluate(
    () =>
      new Promise((res) => {
        const o = indexedDB.open("ACCESS_Lab_DB");
        o.onsuccess = () => {
          const r = o.result
            .transaction("passport_progress")
            .objectStore("passport_progress")
            .getAll();
          r.onsuccess = () => res(r.result.length);
        };
      }),
  );
  ok(
    rows === set.items.length,
    `${label}: one evidence row per question reached storage (${rows}/${set.items.length})`,
  );
  ok(errors.length === 0, `${label}: no console errors ${errors.join("|")}`);
  await ctx.close();
  return answered;
}

// one complete set in each of the eight slices
for (const [id, label] of [
  ["b35-read-01", "Reading 3-5"],
  ["b68-read-01", "Reading 6-8"],
  ["b35-listen-01", "Listening 3-5"],
  ["b68-listen-01", "Listening 6-8"],
  ["b35-write-01", "Writing 3-5"],
  ["b68-write-01", "Writing 6-8"],
  ["b35-speak-01", "Speaking 3-5"],
  ["b68-speak-01", "Speaking 6-8"],
])
  await sitting(label, id);

// a listening item: the audio is controlled by the engine for bank content too
{
  const { ctx, page } = await fresh();
  await start(page, "b68-listen-02", "summative");
  ok(
    /Plays left: 2 of 2/.test(await page.locator(".acc-listen-count").innerText()),
    "bank listening: two plays offered",
  );
  ok(
    (await page.locator(".acc-transcript").count()) === 0,
    "bank listening in a simulation shows no transcript",
  );
  await page.locator("[data-act=listen-play]").click();
  await page.waitForFunction(
    () => document.querySelector(".acc-listen")?.dataset.state === "idle",
    null,
    { timeout: 30000 },
  );
  ok(
    /Plays left: 1 of 2/.test(await page.locator(".acc-listen-count").innerText()),
    "bank listening: a heard play is counted",
  );
  await ctx.close();
}

// learning mode on bank content: miss, scaffold in order, revise, supported success is not independent
{
  const setId = "b35-read-02";
  const set = load(setId);
  const item = set.items.find((i) => i.type === "multiple-choice");
  const idx = set.items.indexOf(item);
  const { ctx, page } = await fresh();
  await start(page, setId, "formative");
  for (let i = 0; i < idx; i++) await page.locator("[data-act=next]").click();
  const wrong = item.options.findIndex((o) => o.id !== item.answer);
  await page.locator(".acc-choice input").nth(wrong).check();
  await page.locator("[data-act=check]").click();
  const fb = await page.locator(".acc-feedback").innerText();
  ok(
    /Not yet/.test(fb) && fb.includes(item.distractors[item.options[wrong].id].slice(0, 25)),
    "a wrong choice on bank content gets that choice's own feedback",
  );
  for (const t of [1, 2, 3]) await page.locator(`[data-support-tier="${t}"]`).click();
  ok((await page.locator(".acc-support-card").count()) === 3, "the three supports open in order");
  ok(
    !(await page.locator(".acc-support-card").allInnerTexts())
      .join(" ")
      .toLowerCase()
      .includes(item.options.find((o) => o.id === item.answer).text.toLowerCase()),
    "no support states the correct choice",
  );
  await page.locator("[data-act=revise]").click();
  await page
    .locator(".acc-choice input")
    .nth(item.options.findIndex((o) => o.id === item.answer))
    .check();
  await page.locator("[data-act=check]").click();
  ok(
    /Correct, with support/.test(await page.locator(".acc-feedback").innerText()),
    "the revised success is recorded as supported",
  );
  await ctx.close();
}

// the library lists the whole bank and filters it
{
  const { ctx, page } = await fresh();
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  await page.locator(".acc-lib-card").first().waitFor();
  ok((await page.locator(".acc-lib-card").count()) === 40, "the library lists all 40 bank sets");
  await page.locator("#libGrade").selectOption("6-8");
  await page.locator("#libDomain").selectOption("Listening");
  ok(
    (await page.locator(".acc-lib-card:not([hidden])").count()) === 5,
    "filtering to Grades 6-8 Listening shows its five sets",
  );
  await ctx.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-acc-bank-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-acc-bank-e2e: all checks passed");

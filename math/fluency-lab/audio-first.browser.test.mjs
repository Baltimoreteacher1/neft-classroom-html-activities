// Audio-first (pre-reader) mode on the real screens, in a browser with a recording speech engine: Kindergarten opens
// with the listening guide on and reads the question aloud (English and Spanish); a number answer is counted on
// ten-frames and checked through the normal path; picture choices keep every choice; a miss says "not yet" and never the
// answer; the checkup runs without the keyboard; Grade 3 starts off with a switch that persists; an old save without the
// field still follows the grade; a phone has no sideways scroll and 64px targets; a device with no speech keeps the text
// and says so; the console stays clean.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const errors = [];
let browser;

// A recording speech engine installed before the app loads. `noSpeech` removes it, like a device with none.
const recorder = ({ noSpeech, seed }) => {
  Math.random = () => 0.9;
  if (seed) for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value);
  window.__spoken = [];
  if (noSpeech) {
    delete Window.prototype.speechSynthesis;
    delete window.speechSynthesis;
    delete window.SpeechSynthesisUtterance;
    return;
  }
  class U {
    constructor(text) {
      this.text = text;
    }
  }
  const engine = {
    speak(u) {
      setTimeout(() => {
        window.__spoken.push({ text: u.text, lang: u.lang });
        u.onstart?.();
        u.onend?.();
      }, 0);
    },
    cancel() {},
    getVoices: () => [],
  };
  Object.defineProperty(window, "speechSynthesis", { value: engine, configurable: true });
  window.SpeechSynthesisUtterance = U;
};

async function open(query, { width = 1280, height = 900, lang = "en", noSpeech = false, seed = null } = {}) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  await page.addInitScript(recorder, { noSpeech, seed });
  await page.addInitScript((language) => localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify(language)), lang);
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => message.type() === "error" && errors.push(`console: ${message.text()}`));
  await page.goto(`${base}/math/fluency-lab/lab.html?${query}`, { waitUntil: "networkidle" });
  return page;
}
const spoken = (page) => page.evaluate(() => window.__spoken.map((entry) => entry.text));
const waitSpoken = (page, count = 1) => page.waitForFunction((n) => window.__spoken.length >= n, count);
const phase = async (page) => {
  await page.locator("#feedback").waitFor({ state: "visible" });
  return page.locator("#feedback").getAttribute("data-phase");
};
// Taps the first answer a pre-reader would: a choice tile, or one ten-frame box, one block, or one key.
async function answerAnyWay(page) {
  if (await page.locator("#choice-answers .af-tile").first().isVisible()) return page.locator("#choice-answers .af-tile").first().click();
  if (await page.locator("#response-widget [data-cell]").first().isVisible()) await page.locator('#response-widget [data-cell="0"]').click();
  else if (await page.locator("#response-widget [data-more]").first().isVisible()) await page.locator('#response-widget [data-more="ones"]').click();
  else await page.locator('#response-widget [data-key="1"]').click();
  return page.locator("#check-answer").click();
}

try {
  browser = await chromium.launch({ headless: true });

  // Kindergarten practice: guide, spoken question, ten-frame answer, normal grading, kind spoken results.
  {
    const page = await open("grade=0&skill=add-sub-5&stage=practice");
    await page.locator("#af-guide").waitFor({ state: "visible" });
    assert.ok(await page.evaluate(() => document.body.classList.contains("audio-first")), "Kindergarten is on by default");
    await waitSpoken(page);
    const question = (await page.locator("#question").innerText()).trim();
    assert.ok(question.length > 2, "the written question is still on the screen");
    const heard = await spoken(page);
    assert.match(heard[0], /\d/, `the question is read first: ${heard[0]}`);
    assert.equal(await page.locator("#answer-input").isHidden(), true, "no keyboard answer");
    const cells = page.locator("#response-widget [data-cell]");
    assert.equal(await cells.count(), 20, "two ten-frames");
    const m = /(\d+)\s*([+−-])\s*(\d+)/.exec(question);
    assert.ok(m, `an arithmetic stem: ${question}`);
    const answer = m[2] === "+" ? Number(m[1]) + Number(m[3]) : Number(m[1]) - Number(m[3]);
    // Wrong first: one box too many (or one box when the answer is 0).
    const wrong = answer === 0 ? 1 : answer + 1;
    for (let i = 0; i < wrong; i += 1) await cells.nth(i).click();
    await page.locator("#check-answer").click();
    assert.ok(!["correct", "assisted"].includes(await phase(page)), "a wrong count is a miss");
    await page.waitForFunction(() => window.__spoken.some((entry) => /Not yet/.test(entry.text)));
    const afterMiss = (await spoken(page)).join(" | ");
    assert.ok(!new RegExp(`The answer is ${answer}`).test(afterMiss), "a miss never says the answer");
    // Fix it: untap one box.
    await cells.nth(wrong - 1).click();
    if (answer === 0) await page.locator(".af-zero").click();
    await page.locator("#check-answer").click();
    await page.waitForFunction(() => ["correct", "assisted"].includes(document.querySelector("#feedback").dataset.phase));
    await page.waitForFunction(() => window.__spoken.some((entry) => /Yes!/.test(entry.text)));
    await page.context().close();
  }

  // Picture choices: shapes or even/odd or compare. Every choice stays, speakers read one, replay repeats.
  {
    const page = await open("grade=2&skill=compare-1000&stage=practice");
    await page.locator("#choice-answers .af-tile").first().waitFor();
    const tiles = page.locator("#choice-answers .af-tile");
    assert.equal(await tiles.count(), 3, "all three symbols stay");
    await waitSpoken(page, 4);
    const first = await spoken(page);
    assert.ok(first.includes("is less than") && first.includes("is greater than") && first.includes("is equal to"), `symbols are spoken as words: ${first}`);
    const before = first.length;
    await page.locator("[data-af-replay]").click();
    await page.waitForFunction((n) => window.__spoken.length >= n + 4, before);
    assert.equal(await tiles.count(), 3, "replay removes nothing");
    await page.locator('[data-af-hear="0"]').click();
    for (const box of await page.locator("#choice-answers button, #af-guide button.af-replay").evaluateAll((els) => els.map((el) => el.getBoundingClientRect())))
      assert.ok(box.width >= 64 && box.height >= 64, `64px targets (${box.width}x${box.height})`);
    await page.context().close();
  }

  // Spanish: labels, spoken language, and a spoken Spanish question.
  {
    const page = await open("grade=0&skill=add-sub-5&stage=practice", { lang: "es" });
    await page.locator("#af-guide").waitFor({ state: "visible" });
    assert.equal(await page.locator("[data-af-replay]").innerText(), "Escuchar otra vez");
    await waitSpoken(page);
    const first = await page.evaluate(() => window.__spoken[0]);
    assert.equal(first.lang, "es-MX", "spoken in Spanish");
    assert.match(first.text, /m[áa]s|menos|es igual|cu[áa]nt|qu[ée]/i, `a Spanish reading: ${first.text}`);
    assert.match(await page.locator("#audio-first-toggle").innerText(), /Ayuda para escuchar/);
    await page.context().close();
  }

  // The checkup runs without the keyboard; no solution is spoken or shown.
  {
    const page = await open("grade=0&start=checkup");
    await page.locator("#af-guide").waitFor({ state: "visible" });
    for (let i = 0; i < 6 && !(await page.locator("#session-summary").isVisible()); i += 1) {
      assert.equal(await page.locator("#answer-input").isHidden(), true, "checkup: no typing");
      await answerAnyWay(page);
      await page.locator("#next-problem").waitFor({ state: "visible" });
      await page.locator("#next-problem").click();
      await page.waitForFunction(() => !document.querySelector("#session-summary").hidden || document.querySelector("#next-problem").hidden);
    }
    const heard = (await spoken(page)).join(" | ");
    assert.ok(!/The answer is/.test(heard), "a checkup never speaks the solution");
    await page.context().close();
  }

  // Grade 3 starts off; the switch turns it on, it survives a reload, and Grade 4 does not offer it.
  {
    const page = await open("grade=3&skill=mul-0-5&stage=practice");
    await page.locator("#question").waitFor();
    assert.equal(await page.evaluate(() => document.body.classList.contains("audio-first")), false, "Grade 3 defaults off");
    assert.equal(await page.locator("#af-guide").count(), 0, "no guide at Grade 3 until it is switched on");
    await page.locator("#settings-toggle").click();
    const toggle = page.locator("#audio-first-toggle");
    assert.equal(await toggle.isVisible(), true, "the switch is offered at Grade 3");
    await toggle.click();
    await page.locator("#af-guide").waitFor({ state: "visible" });
    assert.equal(await toggle.getAttribute("aria-pressed"), "true");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#af-guide").waitFor({ state: "visible" });
    assert.equal(JSON.parse(await page.evaluate(() => localStorage.getItem("ewl-fluency-settings-v1"))).audioFirst, "on", "the choice is saved with the learner");
    await page.context().close();

    const four = await open("grade=4&skill=mul-multi&stage=practice");
    await four.locator("#settings-toggle").click();
    assert.equal(await four.locator("#audio-first-toggle").isHidden(), true, "Grade 4 does not offer it");
    await four.context().close();
  }

  // An old save (no audioFirst field) still follows the grade; an explicit "off" is kept for a Kindergartner.
  {
    const old = { "ewl-fluency-settings-v1": JSON.stringify({ largeText: true, readingFont: true }), "ewl-fluency-settings-v1:grade": "0" };
    const page = await open("grade=0&skill=add-sub-5&stage=practice", { seed: old });
    await page.locator("#af-guide").waitFor({ state: "visible" });
    assert.equal(await page.evaluate(() => document.documentElement.classList.contains("reading-font")), true, "other settings survive");
    await page.context().close();
    const off = { "ewl-fluency-settings-v1": JSON.stringify({ audioFirst: "off" }), "ewl-fluency-settings-v1:grade": "0" };
    const page2 = await open("grade=0&skill=add-sub-5&stage=practice", { seed: off });
    await page2.locator("#question").waitFor();
    assert.equal(await page2.evaluate(() => document.body.classList.contains("audio-first")), false, "off stays off");
    assert.equal(await page2.locator("#answer-input").isVisible(), true, "typing is back when it is off");
    await page2.context().close();
  }

  // A device with no speech: the guide says so, the question is still readable, the answer still works.
  {
    const page = await open("grade=1&skill=add-10&stage=practice", { noSpeech: true });
    await page.locator("#af-guide").waitFor({ state: "visible" });
    assert.match(await page.locator("#af-guide .af-note").innerText(), /Sound is not available/);
    assert.ok((await page.locator("#question").innerText()).trim().length > 2);
    assert.equal(await page.locator("#response-widget [data-cell]").count(), 20, "counting still works");
    await page.context().close();
  }

  // Game Room: the banner states what listening covers. Phone widths: no sideways scroll, 64px targets.
  {
    const page = await open("grade=1&view=games", { width: 390, height: 844 });
    await page.locator("#af-game-banner").waitFor({ state: "visible" });
    assert.match(await page.locator("#af-game-banner").innerText(), /still need reading or typing/);
    await page.context().close();
    const phone = await open("grade=1&skill=add-10&stage=practice", { width: 390, height: 844 });
    await phone.locator("#response-widget [data-cell]").first().waitFor();
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, "no sideways scroll at 390px");
    for (const box of await phone.locator("#response-widget button, #af-guide button.af-replay, #check-answer").evaluateAll((els) => els.map((el) => el.getBoundingClientRect())))
      assert.ok(box.width >= 63.5 && box.height >= 63.5, `64px targets on a phone (${box.width}x${box.height})`);
    await phone.context().close();
  }

  assert.deepEqual(errors, [], "console stays clean");
  console.log("audio-first.browser: K practice (ten-frame, spoken results), picture choices, Spanish, checkup, Grade 3 switch, old saves, no-speech fallback, games banner and phone targets pass");
} finally {
  await browser?.close();
  await server.close();
}

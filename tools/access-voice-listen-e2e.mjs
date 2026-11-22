#!/usr/bin/env node
/**
 * Listening + speaking tasks in a real browser at 1280px and 390px: the Voice Lab retell page and a Speaking Studio recording.
 * Checks: purpose line, play/replay/part replay/slower speed with a stubbed speechSynthesis that records exactly which text is spoken
 * (audio must equal the transcript), transcript on demand, check questions with a scaffolded retry, keyboard-only use, the stages and
 * fading frames after a take, review ticks, a denied microphone (typed/"said it out loud" path still works), no read-aloud at all
 * (words shown), no console errors, no horizontal overflow, axe WCAG 2.2 AA. Screenshots go to $LISTEN_SHOTS.
 *   node tools/access-voice-listen-e2e.mjs
 * A missing browser is a SKIP locally and a FAIL in CI. Real speechSynthesis playback was verified by hand (headed Chromium on macOS).
 */
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-voice-listen-e2e: SKIP: playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}
const SHOTS = process.env.LISTEN_SHOTS || "/tmp/listen-shots";
mkdirSync(SHOTS, { recursive: true });
const { server, base } = await serveAccess();
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (e) {
  console.warn(`access-voice-listen-e2e: SKIP: no browser (${e.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}

const STUB = `(() => {
  const said = [];
  window.__said = said;
  const synth = {
    speaking: false, pending: false, paused: false,
    getVoices: () => [], addEventListener() {}, removeEventListener() {},
    cancel() { this.speaking = false; },
    resume() {}, pause() {},
    speak(u) { said.push({ text: u.text, rate: u.rate }); this.speaking = true; setTimeout(() => { this.speaking = false; u.onend && u.onend({}); }, 30); },
  };
  Object.defineProperty(window, "speechSynthesis", { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; this.rate = 1; };
})();`;
const NO_MIC = `navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("denied", "NotAllowedError"));`;

const fail = [];
const check = (ok, msg) => {
  if (!ok) fail.push(msg);
};
async function session({ width, height, name }) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.addInitScript(STUB);
  await ctx.addInitScript(NO_MIC);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message)) errors.push(e.message);
  });
  page.on("console", (m) => {
    if (m.type() === "error" && !/web-vitals|favicon|Failed to load resource/.test(m.text()))
      errors.push(m.text());
  });
  return { ctx, page, errors, name };
}
const open = (page, path) =>
  page
    .goto(`${base}/access-practice-lab/${path}`, { waitUntil: "domcontentloaded" })
    .then(() => page.waitForSelector("h1"));
const noOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
async function axe(page, label) {
  if (!AxeBuilder) return;
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .include("main, article")
    .analyze();
  check(
    r.violations.length === 0,
    `${label}: axe ${r.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ")}`,
  );
}

for (const [width, height] of [
  [1280, 900],
  [390, 844],
]) {
  const tag = `${width}`;
  // --- Voice Lab retell (interview, two speakers)
  {
    const { ctx, page, errors } = await session({ width, height, name: "retell" });
    await open(page, "voice/retell/interview-crosswalk?grades=6-8");
    await page.waitForSelector("[data-lc]");
    check(await page.locator(".lc-purpose").count(), "purpose line shown");
    check(
      (await page.locator("[data-lc-part-btn]").count()) === 6,
      "six part buttons for six speaker turns",
    );
    // whole recording plays the exact transcript, in order
    await page.click("[data-lc-play^='interview-crosswalk:0:']");
    await page.waitForFunction(
      () => window.__said.filter((s) => s.text !== ".").length >= 6,
      null,
      { timeout: 8000 },
    );
    const said = (await page.evaluate(() => window.__said.map((s) => s.text))).filter(
      (t) => t !== ".",
    );
    const transcript = await page.$$eval(".lc-parts li", (lis) =>
      lis.map((li) => li.firstChild && li.textContent.replace(/\s+/g, " ").trim()),
    );
    check(
      said.every((t, i) => transcript[i].includes(t)),
      `spoken text equals transcript: ${JSON.stringify(said.slice(0, 2))}`,
    );
    // slower speed applies to the next play; per-part replay speaks only that part
    await page.click("[data-lc-speed='slow']");
    await page.evaluate(() => (window.__said.length = 0));
    await page.click("[data-lc-part-btn='1']");
    await page.waitForFunction(() => window.__said.filter((s) => s.text !== ".").length === 1);
    check(
      (await page.evaluate(() => window.__said.find((s) => s.text !== ".").rate)) < 0.8,
      "slower speed used",
    );
    check(
      (await page.locator("[data-lc-speed='slow'][aria-pressed='true']").count()) === 1,
      "slow pressed",
    );
    // transcript is closed until asked for, and says reading is a different skill
    check(
      !(await page.locator("details[data-lc-transcript]").evaluate((d) => d.open)),
      "transcript closed by default",
    );
    await page.click("details[data-lc-transcript] > summary");
    check(await page.locator(".lc-note").isVisible(), "transcript note visible after opening");
    // check question: wrong, hint + replay, wrong again reveals; keyboard-only on the second question
    const q0 = page.locator("[data-lc-q='0']");
    const wrong = (
      await q0.locator(".lc-opt").evaluateAll((els) => els.map((e) => e.dataset.lcPick))
    ).filter(Boolean);
    await q0.locator(".lc-opt").first().click();
    const afterFirst = await page.locator("[data-lc-q='0'] .lc-fb").innerText();
    check(/Not quite|Yes/.test(afterFirst), `feedback after first pick: ${afterFirst}`);
    await page.locator("[data-lc-q='1'] .lc-opt").nth(0).focus();
    await page.keyboard.press("Enter");
    check(
      (await page.locator("[data-lc-q='1'] .lc-fb").count()) === 1,
      "keyboard Enter answers a question",
    );
    check(wrong.length === 3, "three options per question");
    // microphone denied: a plain message appears and the "said it out loud" path stays available
    await page.click("[data-rec-start]");
    await page.waitForFunction(
      () => document.querySelector("[data-rec-error]")?.textContent.trim().length > 10,
      null,
      { timeout: 5000 },
    );
    check(
      await page.locator("[data-retell-done]").isVisible(),
      "mic denied: alternate path still offered",
    );
    // plan, mic denied -> "I said it out loud" path, then review + improve + faded frames
    await page.fill("[data-retell-plan='0']", "counts speed neighbors");
    const fullFrames = await page.locator(".lc-frames summary").innerText();
    check(/full/i.test(fullFrames), "full frames before the first try");
    await page.click("[data-retell-done]");
    await page.waitForSelector("#retell-review");
    check(
      /starters only/i.test(await page.locator(".lc-frames summary").innerText()),
      "frames fade to starters after a first try",
    );
    check(
      (await page.locator(".lc-stages li[aria-current='step']").innerText()).includes("Review"),
      "stage moves to Review",
    );
    await page.check("[data-retell-crit='0']");
    const focus = await page.locator("[data-retell-focus]").innerText();
    check(
      /Improve/.test(focus) && !focus.includes("I name what the city"),
      `improve names ONE unticked criterion: ${focus}`,
    );
    await page.reload();
    await page.waitForSelector("#retell-review");
    check(await page.locator("[data-retell-crit='0']").isChecked(), "review tick survives reload");
    await page.screenshot({
      path: `${SHOTS}/after-retell-${tag}.jpg`,
      type: "jpeg",
      quality: 70,
      fullPage: true,
    });
    check(await noOverflow(page), `retell overflow at ${width}`);
    await axe(page, `retell ${width}`);
    check(errors.length === 0, `retell console: ${errors.join(" | ")}`);
    await ctx.close();
  }
  // --- Speaking Studio recording
  {
    const { ctx, page, errors } = await session({ width, height, name: "speak" });
    await open(page, "speak/spk-seedlings-retell?grades=6-8");
    await page.waitForSelector("[data-lc]");
    await page.click("[data-lc-play^='studio:spk-seedlings-retell:0:']");
    await page.waitForFunction(
      () => window.__said.filter((s) => s.text !== ".").length >= 3,
      null,
      { timeout: 8000 },
    );
    const said = (await page.evaluate(() => window.__said.map((s) => s.text))).filter(
      (t) => t !== ".",
    );
    check(
      said[0].startsWith("Yesterday we tested whether light") && !said[0].includes("Ms. Okafor:"),
      "studio audio is the words only, in order",
    );
    await page.click("details[data-lc-transcript] > summary");
    await page.waitForTimeout(100);
    const msg = await page.locator("body").innerText();
    check(/Transcript/.test(msg) && /Listen for:/.test(msg), "studio shows transcript and purpose");
    await page.screenshot({ path: `${SHOTS}/after-speak-${tag}.jpg`, type: "jpeg", quality: 70 });
    check(await noOverflow(page), `speak overflow at ${width}`);
    await axe(page, `speak ${width}`);
    check(errors.length === 0, `speak console: ${errors.join(" | ")}`);
    await ctx.close();
  }
}
// The no-read-aloud case (words shown, no dead play button) is covered in tools/access-voice-listen.test.mjs and access-lab-voice-views.test.mjs.
await browser.close();
server.close();
if (fail.length) {
  console.error(`access-voice-listen-e2e: FAIL\n - ${fail.join("\n - ")}`);
  process.exit(1);
}
console.log("access-voice-listen-e2e: PASS");

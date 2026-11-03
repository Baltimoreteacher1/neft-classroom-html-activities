#!/usr/bin/env node
/**
 * Audio engine end to end in real Chromium with a FAKE capture device (Chromium synthesises a repeating tone), so
 * getUserMedia, AudioContext/AnalyserNode, MediaRecorder, IndexedDB and playback all run for real.
 *   - microphone check: 3-second calibration reports ready from real RMS; denied / no device / unsupported / silent each
 *     show their own message and never offer recording
 *   - speaking: planning timer, recording with a live waveform, stop, playback review, two-take rule, explicit confirm,
 *     audio written to IndexedDB (type, size) before "saved", resume after reload
 *   - listening: the plays-left counter, a failed play refunds, two plays then none, the count survives a reload,
 *     simulation shows no transcript
 * What a headless run cannot prove (a person's voice, a real microphone's level, speaker output) is NOT claimed.
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-acc-audio-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};

const { server, base } = await serveAccess();
const browser = await chromium.launch({
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
  ],
});
const ROOT = `${base}/access-practice-lab`;

// speechSynthesis is voiceless in headless Chromium, so listening gets a deterministic stand-in that takes 1.8 s per utterance.
const SPEECH_STUB = `
  window.__spoken = 0; window.__failSpeech = false;
  Object.defineProperty(window, "speechSynthesis", { configurable: true, value: {
    speaking: false, paused: false, pending: false,
    getVoices: () => [], addEventListener() {}, removeEventListener() {}, cancel() {}, pause() {}, resume() {},
    speak(u) { if (window.__failSpeech) return setTimeout(() => u.onerror && u.onerror({}), 20); window.__spoken++; setTimeout(() => u.onend && u.onend({}), 1800); },
  } });`;

async function ctxWith({ init = "", permissions = ["microphone"] } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions });
  await ctx.addInitScript(SPEECH_STUB + init);
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
const begin = async (page, set, mode) => {
  await page.goto(`${ROOT}/assess/${set}?mode=${mode}`, { waitUntil: "networkidle" });
  await page.locator("[data-act=begin]").waitFor();
  const timer = page.locator("#accTimer");
  if (await timer.count()) await timer.uncheck();
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-stem").waitFor();
};
const goToLast = async (page, n = 8) => {
  for (let i = 0; i < n; i++) await page.locator("[data-act=next]").click();
  await page.locator(".acc-stem").waitFor();
};
const idb = (page, fn) =>
  page.evaluate(
    (src) =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("ACCESS_Lab_DB");
        open.onerror = () => reject(open.error);
        open.onsuccess = () =>
          new Function("db", `return (${src})(db)`)(open.result).then(resolve, reject);
      }),
    fn.toString(),
  );

// ── speaking: the whole workflow ───────────────────────────────────────────────────
{
  const { ctx, page, errors } = await ctxWith();
  await begin(page, "starter-3-5", "summative");
  await goToLast(page);
  ok(
    /Speaking/.test(await page.locator(".acc-q-meta").innerText()),
    "the last item is the speaking task",
  );
  ok(
    await page.locator("[data-act=speak-begin]").isDisabled(),
    "recording cannot start before the microphone check",
  );
  const states = [];
  await page.exposeFunction("__state", (s) => states.push(s));
  await page.evaluate(() =>
    new MutationObserver(() =>
      window.__state(document.querySelector(".acc-mic")?.dataset.state),
    ).observe(document.querySelector(".acc-mic"), {
      attributes: true,
      attributeFilter: ["data-state"],
    }),
  );
  await page.locator("[data-act=mic-check]").click();
  ok(
    /Checking/.test(await page.locator("[data-act=mic-check]").innerText()),
    "the check button reports that it is checking",
  );
  await page.locator('.acc-mic[data-state="ready"]').waitFor({ timeout: 15000 });
  ok(
    states.includes("calibrating") && states.at(-1) === "ready",
    `the check ran a real calibration before ready (${states.join(">")})`,
  );
  ok(
    /microphone is working/.test(await page.locator(".acc-mic-msg").innerText()),
    "ready is stated in words",
  );
  ok(
    Number(await page.locator(".acc-meter").getAttribute("value")) >= 0,
    "the level meter is a real <meter> element",
  );

  await page.locator("[data-act=speak-begin]").click();
  ok(
    /Planning time: 0:(30|29)/.test(await page.locator(".acc-countdown").innerText()),
    "planning starts at the configured 30 seconds",
  );
  ok((await page.locator("[data-act=speak-skip]").count()) === 1, "planning can be skipped");
  await page.locator("[data-act=speak-skip]").click();
  await page.locator(".acc-recording").waitFor();
  ok(
    /Recording/.test(await page.locator(".acc-recording").innerText()),
    "recording shows a visible state, not only colour",
  );
  ok(
    /Recording has started/.test(await page.locator("#accLive").innerText()),
    "the planning-to-recording transition is announced as text",
  );
  await page.waitForTimeout(2200);
  const heights = await page
    .locator(".acc-live-wave i")
    .evaluateAll((els) => els.map((e) => parseFloat(e.style.height) || 0));
  ok(
    heights.some((h) => h > 6),
    `the live waveform reacts to the microphone (max ${Math.max(...heights).toFixed(0)}%)`,
  );
  await page.locator("[data-act=speak-stop]").click();
  await page.locator("audio[controls]").waitFor({ timeout: 10000 });
  ok(await page.locator(".acc-wave svg").count(), "review shows a waveform of the take");
  const src = await page.locator("audio[controls]").getAttribute("src");
  ok(/^blob:/.test(src), "review plays the recorded blob");
  ok(
    (await page.locator("[data-act=speak-again]").count()) === 1 &&
      /1 left/.test(await page.locator("[data-act=speak-again]").innerText()),
    "two-take practice offers exactly one more take",
  );
  await page.locator("[data-act=speak-again]").click();
  await page.locator("[data-act=speak-skip]").click();
  await page.locator(".acc-recording").waitFor();
  await page.waitForTimeout(1500);
  await page.locator("[data-act=speak-stop]").click();
  await page.locator("[data-act=speak-use]").waitFor();
  ok(
    (await page.locator("[data-act=speak-again]").count()) === 0,
    "both takes used: no third take",
  );
  const countRecordings = () =>
    page.evaluate(
      () =>
        new Promise((res) => {
          const o = indexedDB.open("ACCESS_Lab_DB");
          o.onsuccess = () => {
            const r = o.result.transaction("recordings").objectStore("recordings").count();
            r.onsuccess = () => res(r.result);
          };
        }),
    );
  ok(
    (await countRecordings()) === 0,
    "no recording is written to storage before the learner confirms",
  );

  await page.locator("[data-act=speak-use]").click();
  ok(
    /cannot change it after you submit/.test(await page.locator(".acc-state.is-warn").innerText()),
    "submission needs an explicit confirmation",
  );
  await page.locator("[data-act=speak-confirm]").click();
  await page.locator(".acc-state.is-success").waitFor();
  ok(
    /Saved on this device for your teacher/.test(
      await page.locator(".acc-state.is-success").innerText(),
    ) && /does not score speaking/.test(await page.locator(".acc-state.is-success").innerText()),
    "saved, with the honest 'not scored by the lab' statement",
  );
  const stored = await idb(
    page,
    (db) =>
      new Promise((res) => {
        const r = db.transaction("recordings").objectStore("recordings").getAll();
        r.onsuccess = () =>
          res(
            r.result.map((x) => ({
              type: x.blob.type,
              size: x.blob.size,
              ext: x.extension,
              seconds: x.seconds,
              item: x.itemId,
            })),
          );
      }),
  );
  ok(stored.length === 1, `exactly one recording is stored (${stored.length})`);
  ok(stored[0] && stored[0].size > 500, `the stored audio has real bytes (${stored[0]?.size})`);
  ok(
    stored[0] && /^audio\/(webm|ogg|mp4)/.test(stored[0].type) && stored[0].ext !== "wav",
    `the type is what the browser produced, never relabelled (${stored[0]?.type} .${stored[0]?.ext})`,
  );
  ok(stored[0]?.item === "g35-s1", "the recording is tied to its item");
  // the answer counts as submitted for review, and survives a reload
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-stem").waitFor();
  await page.locator(".acc-qdot").last().click();
  await page.locator(".acc-state.is-success").waitFor();
  await page.locator("audio[controls]").waitFor();
  ok(true, "after a reload the saved recording is still there and playable");
  ok(errors.length === 0, `no console errors in the speaking run ${errors.join("|")}`);
  await ctx.close();
}

// ── microphone failure states ────────────────────────────────────────────────────────
const failureCases = [
  [
    "denied",
    `navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error("x"), { name: "NotAllowedError" }));`,
    /blocked/,
  ],
  [
    "unavailable",
    `navigator.mediaDevices.getUserMedia = () => Promise.reject(Object.assign(new Error("x"), { name: "NotFoundError" }));`,
    /No microphone was found/,
  ],
  ["unsupported", `delete window.MediaRecorder;`, /cannot record audio/],
  [
    "silent",
    `navigator.mediaDevices.getUserMedia = async () => { const c = new AudioContext(); const d = c.createMediaStreamDestination(); return d.stream; };`,
    /did not hear you/,
  ],
];
for (const [state, init, message] of failureCases) {
  const { ctx, page } = await ctxWith({ init });
  await begin(page, "starter-3-5", "summative");
  await goToLast(page);
  await page.locator("[data-act=mic-check]").click();
  await page.locator(`.acc-mic[data-state="${state}"]`).waitFor({ timeout: 15000 });
  ok(
    message.test(await page.locator(".acc-mic-msg").innerText()),
    `${state}: says what is wrong in plain words`,
  );
  ok(
    await page.locator("[data-act=speak-begin]").isDisabled(),
    `${state}: recording stays unavailable`,
  );
  ok(
    /Try again/.test(await page.locator("[data-act=mic-check]").innerText()),
    `${state}: offers a retry`,
  );
  await ctx.close();
}

// ── learning mode keeps frames out of simulation; the supports exist in learning mode ──
{
  const { ctx, page } = await ctxWith();
  await begin(page, "starter-3-5", "summative");
  await goToLast(page);
  ok(
    (await page.locator(".acc-ladder, [data-support-tier]").count()) === 0 &&
      !/First, _+/.test(await page.locator(".acc-qpane").innerText()),
    "simulation: no sentence frame is shown during speaking",
  );
  await ctx.close();
  const f = await ctxWith();
  await begin(f.page, "starter-3-5", "formative");
  await goToLast(f.page);
  await f.page.locator('[data-support-tier="1"]').click();
  await f.page.locator('[data-support-tier="2"]').click();
  ok(
    /First, _+\. Next/.test(await f.page.locator(".tier-2").innerText()),
    "learning mode: the sentence frame is available as Support 2",
  );
  await f.ctx.close();
}

// ── listening: plays, refunds, limits, reload ───────────────────────────────────────
{
  const { ctx, page, errors } = await ctxWith();
  await begin(page, "starter-3-5", "summative");
  for (let i = 0; i < 6; i++) await page.locator("[data-act=next]").click();
  await page.locator(".acc-listen").waitFor();
  ok(
    /Plays left: 2 of 2/.test(await page.locator(".acc-listen-count").innerText()),
    "the counter starts at two plays",
  );
  ok((await page.locator(".acc-transcript").count()) === 0, "simulation shows no transcript");
  ok(await page.locator("[data-act=listen-stop]").isHidden(), "simulation offers no stop or pause");
  await page.evaluate(() => (window.__failSpeech = true));
  await page.locator("[data-act=listen-play]").click();
  await page.waitForFunction(
    () => document.querySelector(".acc-listen")?.dataset.state === "failed",
  );
  ok(
    /did not lose a play/.test(await page.locator(".acc-listen .acc-hint").last().innerText()) &&
      /Plays left: 2 of 2/.test(await page.locator(".acc-listen-count").innerText()),
    "a failed play is explained and costs nothing",
  );
  await page.evaluate(() => (window.__failSpeech = false));
  await page.locator("[data-act=listen-play]").click();
  ok(
    await page.locator("[data-act=listen-play]").isDisabled(),
    "the button is disabled while playing",
  );
  await page.waitForFunction(
    () => document.querySelector(".acc-listen")?.dataset.state === "idle",
    null,
    { timeout: 8000 },
  );
  ok(
    /Plays left: 1 of 2/.test(await page.locator(".acc-listen-count").innerText()),
    "a heard play uses one",
  );
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-stem").waitFor();
  await page.locator(".acc-qdot").nth(6).click();
  ok(
    /Plays left: 1 of 2/.test(await page.locator(".acc-listen-count").innerText()),
    "refreshing the page does not reset the plays",
  );
  await page.locator("[data-act=listen-play]").click();
  await page.waitForFunction(
    () => document.querySelector(".acc-listen")?.dataset.state === "done",
    null,
    { timeout: 8000 },
  );
  ok(
    /Plays left: 0 of 2/.test(await page.locator(".acc-listen-count").innerText()) &&
      (await page.locator("[data-act=listen-play]").isDisabled()),
    "after two plays there are no more",
  );
  ok(
    /last play/.test(await page.locator(".acc-listen .acc-hint").last().innerText()),
    "the end of the plays is stated",
  );
  ok(
    (await page.evaluate(() => window.__spoken)) >= 1,
    "speech was requested through the speech engine",
  );
  ok(errors.length === 0, `no console errors in the listening run ${errors.join("|")}`);
  await ctx.close();
  const f = await ctxWith();
  await begin(f.page, "starter-3-5", "formative");
  for (let i = 0; i < 6; i++) await f.page.locator("[data-act=next]").click();
  await f.page.locator("details.acc-transcript summary").click();
  ok(
    /push the seed into the soil/.test(
      await f.page.locator("details.acc-transcript p").innerText(),
    ),
    "learning mode offers the transcript",
  );
  ok(await f.page.locator("[data-act=listen-stop]").isVisible(), "learning mode allows stopping");
  await f.ctx.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-acc-audio-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-acc-audio-e2e: all checks passed");

#!/usr/bin/env node
/**
 * Teach It Back (/teach-back) in a real browser: pick, learn, plan, type an explanation, feedback that quotes the learner,
 * revise with "what changed", an on-my-own idea with no frames, a done card that keeps supported and independent tries
 * apart, resume after reload, recording (a real take through a fake microphone, a denied microphone, and no recorder at
 * all), Spanish chrome, the early-band message, axe WCAG 2.2 AA on every step, 375px, 44px targets, and that nothing
 * leaves the origin.
 *
 *   node tools/teach-back-e2e.mjs
 */
import { startRun } from "./lib/lab-e2e.mjs";

const SHOTS =
  "/private/tmp/claude-501/-Users-joelneft/96aee3f8-3539-4a60-a515-d9427df153ab/scratchpad";
const { page, ok, go, axe, overflow, finish } = await startRun("teach-back-e2e");
const requests = [];
page.on("request", (r) => requests.push(`${r.method()} ${r.url()}`));
const body = () => page.locator("#app").innerText();
const heading = () => page.locator("#tbStepH").innerText();
const storedKey = () =>
  page.evaluate(() => localStorage.getItem("accessPracticeLab:v1:teach-back") || "");
const click = async (sel) => {
  await page.locator(sel).first().click();
  await page.waitForTimeout(150);
};
const targets = async (label) => {
  const small = await page.evaluate(() =>
    [
      ...document.querySelectorAll(
        ".tb button, .tb .btn, .tb-plan-card, .tb-chip-choice, .tb-card, .tb-claim, .tb summary",
      ),
    ]
      .filter((el) => el.offsetParent && el.getBoundingClientRect().height < 43.5)
      .map(
        (el) => `${el.className || el.tagName}:${Math.round(el.getBoundingClientRect().height)}`,
      ),
  );
  ok(small.length === 0, `44px targets: ${label}${small.length ? ` — ${small.slice(0, 3)}` : ""}`);
};
const checkStep = async (label) => {
  await axe(label);
  await page.setViewportSize({ width: 375, height: 800 });
  ok((await overflow()) <= 1, `no horizontal overflow at 375px: ${label}`);
  await targets(label);
  await page.setViewportSize({ width: 1280, height: 900 });
};
const MODEL_ONLY = "even though 8 looks bigger";

try {
  // pick
  await go("/teach-back");
  ok(
    (await page.locator("h1").count()) === 1 &&
      (await page.locator("h1").innerText()).includes("Teach It Back"),
    "/teach-back renders one h1",
  );
  ok((await page.locator("[data-tb-pick]").count()) === 12, "the 6-8 chooser lists 12 ideas");
  ok((await page.locator(".tb-subject h2").count()) === 5, "ideas are grouped under five subjects");
  ok(/Math/.test(await body()) && /Health/.test(await body()), "subjects are named");
  await checkStep("pick");

  // learn
  await click('[data-tb-pick="negative-numbers"]');
  ok(/Learn the idea/.test(await heading()), "learn step opens");
  ok(/less than zero/.test(await body()), "the idea card is shown");
  ok(
    (await page.locator(".tb-term").count()) === 4 && /número negativo/.test(await body()),
    "key words carry their Spanish",
  );
  ok(
    (await page.locator("svg.tb-visual title").count()) === 1,
    "a labelled drawing is shown where it helps",
  );
  ok(
    !(await page.content()).includes(MODEL_ONLY),
    "model answer is not on the page at the learn step",
  );
  await checkStep("learn");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: `${SHOTS}/teachback-learn-1280.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${SHOTS}/teachback-learn-390.png`, fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });

  // plan
  await click('[data-tb-go="plan"]');
  ok(
    /Plan what to say/.test(await heading()) &&
      (await page.locator('input[name="tbPlan"]').count()) === 3,
    "plan step offers the three key points",
  );
  await page.locator('input[name="tbPlan"]').nth(1).focus();
  await page.keyboard.press("Space");
  ok(
    await page.locator('input[name="tbPlan"]').nth(1).isChecked(),
    "a plan card is ticked with the keyboard",
  );
  ok(
    !(await page.content()).includes(MODEL_ONLY),
    "model answer is not on the page at the plan step",
  );
  await checkStep("plan");

  // teach
  await click('[data-tb-go="teach"]');
  ok(
    /Teach it back/.test(await heading()) && (await page.locator("#tbText").count()) === 1,
    "teach step has a labelled text box",
  );
  ok((await page.locator('label[for="tbText"]').count()) === 1, "the text box has a label");
  ok(
    !(await page.content()).includes(MODEL_ONLY),
    "model answer is not on the page at the teach step",
  );
  await page.locator("[data-tb-submit]").click();
  ok(
    /Write at least one sentence/.test(await page.locator("#tbMsg").innerText()),
    "an empty try asks for a sentence and does not crash",
  );
  ok(
    /Opening frames marks this try as supported/.test(await body()),
    "frames are explained before they are opened",
  );
  await page.locator("[data-tb-frames]").focus();
  await page.keyboard.press("Enter");
  ok(
    (await page.locator("[data-tb-frames]").getAttribute("aria-expanded")) === "true" &&
      (await page.locator("#tbFrames li").count()) === 3,
    "frames open with the keyboard and show three frames",
  );
  ok(/counts as supported/.test(await body()), "opening frames marks the try supported");
  await checkStep("teach (frames open)");
  const typed1 =
    "Negative numbers are less than zero. On a number line they go to the left of zero.";
  await page.locator("#tbText").fill(typed1);
  await page.locator("[data-tb-submit]").click();
  await page.waitForSelector(".tb-feedback");

  // feedback
  ok(/Your feedback/.test(await heading()), "feedback step opens");
  ok(/This try was supported/.test(await body()), "a try with frames open is labelled supported");
  const quotes = await page.locator(".tb-obs .tb-quote").allInnerTexts();
  ok(
    quotes.length >= 1 && quotes.every((q) => typed1.includes(q.replace(/^“|”$/g, ""))),
    "the strength and next step quote the learner's own words, verbatim",
  );
  ok(
    /One strength/.test(await body()) && /One thing to try/.test(await body()),
    "one strength and one thing to try",
  );
  ok(
    (await page.locator(".tb-obs-grid section").count()) <= 2,
    "at most one strength and one next step",
  );
  const fb = (await body()).replace(/sea level/g, "sea"); // a key point about sea level is content, not a level
  ok(
    !/\b(score|level|percent|rank|streak)\b|\d\s?%/i.test(fb),
    `no score, level, percent, rank or streak on the feedback${/\b(score|level|percent|rank|streak)\b|\d\s?%/i.exec(fb) ? ` — "${fb.slice(Math.max(0, /\b(score|level|percent|rank|streak)\b|\d\s?%/i.exec(fb).index - 50), /\b(score|level|percent|rank|streak)\b|\d\s?%/i.exec(fb).index + 30).replace(/\n/g, " ")}"` : ""}`,
  );
  ok((await page.content()).includes(MODEL_ONLY), "the model answer appears after the first try");
  ok(
    (await page.locator("details.tb-model[open]").count()) === 0,
    "the model answer starts closed",
  );
  await page.locator('[data-tb-claim="p3"]').check();
  ok(
    await page.locator('[data-tb-claim="p3"]').isChecked(),
    "a learner can mark a missed point as said in other words",
  );
  await checkStep("feedback");
  await page.screenshot({ path: `${SHOTS}/teachback-feedback-1280.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${SHOTS}/teachback-feedback-390.png`, fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });

  // revise
  await click("[data-tb-revise]");
  ok(
    (await page.locator("#tbText").inputValue()) === typed1,
    "teaching again starts from the last try",
  );
  ok((await page.locator("[data-tb-frames]").count()) === 1, "frames stay available when revising");
  const typed2 = `${typed1} The farther left a number is, the smaller it is, so -8 is less than -3. We use them for temperature below zero.`;
  await page.locator("#tbText").fill(typed2);
  await page.locator("[data-tb-submit]").click();
  await page.waitForSelector(".tb-changed");
  const changed = await page.locator(".tb-changed").innerText();
  ok(
    /Words added: \d+/.test(changed) && Number(/Words added: (\d+)/.exec(changed)[1]) > 10,
    "what changed lists the words added",
  );
  ok(
    /Key points now found in your words/.test(changed) &&
      (await page.locator(".tb-changed .tb-quote").count()) >= 1,
    "what changed names the newly covered key points with quotes",
  );
  ok(/not a better try/.test(changed), "what changed does not call longer better");
  ok(
    /This try was supported/.test(await body()),
    "a revision after feedback is labelled supported",
  );
  await checkStep("feedback after revising");

  // on my own
  await click('[data-tb-go="own"]');
  ok(/On my own/.test(await heading()), "on-my-own step opens");
  const choices = await page.locator("[data-tb-own]").allInnerTexts();
  ok(
    choices.length === 2 &&
      choices.every((c) => /Ratios|Mean and median/.test(c)) &&
      !choices.some((c) => /Negative/.test(c)),
    "on my own offers different ideas from the same subject",
  );
  await checkStep("on my own");
  await click('[data-tb-own="ratios"]');
  ok(/On my own: learn this idea/.test(await heading()), "the new idea is learned first");
  await click('[data-tb-go="teach"]');
  ok(
    (await page.locator("[data-tb-frames]").count()) === 0 &&
      /No frames this time/.test(await body()),
    "on my own has no frames",
  );
  await page
    .locator("#tbText")
    .fill(
      "A ratio compares two quantities, like 2 cups of flour for every 3 cups of milk. You can make an equivalent ratio by multiplying both numbers by the same number.",
    );
  await page.locator("[data-tb-submit]").click();
  await page.waitForSelector(".tb-feedback");
  ok(/This try was independent/.test(await body()), "a try with no frames is labelled independent");
  await click("[data-tb-finish]");

  // done
  ok(/You taught it back/.test(await heading()), "done card opens");
  const done = await body();
  ok(
    /Independent tries/.test(done) && /Supported tries/.test(done),
    "the summary names independent and supported tries separately",
  );
  const [indep, supp] = await page.locator(".tb-done .tb-obs-grid section").allInnerTexts();
  ok(
    /Ratios and unit rates: on my own/.test(indep) && !/Negative/.test(indep),
    "the independent list holds only the on-my-own try",
  );
  ok(
    /Negative numbers: first try/.test(supp) &&
      /second try after feedback/.test(supp) &&
      !/Ratios/.test(supp),
    "the supported list holds the frames and revision tries",
  );
  ok(
    /What you added after feedback/.test(done) && /Words added: \d+/.test(done),
    "the done card says what was added after feedback",
  );
  ok(
    (await page.locator(".tb-done [data-tb-pick]").count()) >= 1,
    "the done card suggests what to try next",
  );
  await checkStep("done");
  const ledger = await page.evaluate(
    () => JSON.parse(localStorage.getItem("accessPracticeLab:v1:ledger") || "{}").entries || [],
  );
  const mine = ledger.filter((e) => String(e.task).startsWith("teach-back:"));
  ok(
    mine.length === 3 &&
      mine.some((e) => e.stage === "independent") &&
      mine.some((e) => e.stage === "supported"),
    "one ledger entry per finished explanation, supported and independent kept apart",
  );
  ok(
    (await storedKey()).includes('"independent":[') && !/blob|data:audio/.test(await storedKey()),
    "the Teach It Back key holds separate lists and no recording data",
  );

  // resume
  await click("[data-tb-newtopic]");
  ok(
    (await page.locator("[data-tb-pick]").count()) === 12 &&
      (await page.locator(".tb-chip", { hasText: "Explained before" }).count()) >= 2,
    "the chooser marks ideas already explained",
  );
  await click('[data-tb-pick="photosynthesis"]');
  await click('[data-tb-go="plan"]');
  await click('[data-tb-go="teach"]');
  await page.locator("#tbText").fill("Plants use sunlight to make food.");
  await click("[data-tb-frames]");
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("#tbText");
  ok(
    (await page.locator("#tbText").inputValue()) === "Plants use sunlight to make food.",
    "a reload keeps the typed text",
  );
  ok(
    /Teach it back/.test(await heading()) && /counts as supported/.test(await body()),
    "a reload resumes on the same step, with frames still marked",
  );
  await click("[data-tb-go='plan']");
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector('input[name="tbPlan"]');
  ok(/Plan what to say/.test(await heading()), "a reload resumes on the plan step");
  await click("[data-tb-go='teach']");

  // recording: microphone denied or absent (headless Chromium has none)
  await page.locator('input[name="tbMode"][value="record"]').check();
  ok(
    (await page.locator('input[name="tbSelf"]').count()) === 3 &&
      /Type what you said \(optional\)/.test(await body()),
    "record mode keeps an optional transcript and a self-check",
  );
  if (await page.locator("[data-tb-rec]").count()) {
    await page.locator("[data-tb-rec]").click();
    await page.waitForSelector("[data-tb-norec]", { timeout: 8000 });
    ok(
      /microphone is not available/.test(await page.locator("[data-tb-norec]").innerText()),
      "a denied microphone is explained in plain words",
    );
  } else ok(false, "record button is offered when the browser can record");
  ok(
    (await page.locator('[data-tb-mode-set="type"]').count()) === 1 &&
      (await page.locator('input[name="tbSelf"]').count()) === 3,
    "a non-AI alternative is offered: type it, or self-check",
  );
  await checkStep("teach, recording unavailable");

  // recording: a real take through a fake microphone
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const ac = new AudioContext();
      const dest = ac.createMediaStreamDestination();
      const osc = ac.createOscillator();
      osc.connect(dest);
      osc.start();
      return dest.stream;
    };
  });
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("[data-tb-rec]");
  await page.locator("[data-tb-rec]").click();
  await page.waitForFunction(
    () => document.querySelector("[data-tb-rec]")?.getAttribute("aria-pressed") === "true",
    null,
    { timeout: 8000 },
  );
  await page.waitForTimeout(1200);
  await page.locator("[data-tb-rec]").click();
  await page.waitForSelector("audio[controls]", { timeout: 10000 });
  ok(
    /^blob:/.test((await page.locator("audio[controls]").getAttribute("src")) || ""),
    "a recording plays back from this device",
  );
  ok(
    /"audioId":"t/.test(await storedKey()) && !/blob|data:audio/.test(await storedKey()),
    "only the recording's id is saved, never the recording",
  );
  ok((await page.locator("[data-tb-unrec]").count()) === 1, "a recording can be removed");
  await page
    .locator("#tbText")
    .fill("Plants use sunlight, water and carbon dioxide to make glucose, a sugar, and oxygen.");
  await checkStep("teach, with a recording");
  await page.locator("[data-tb-submit]").click();
  await page.waitForSelector(".tb-feedback");
  ok(
    /This try was supported/.test(await body()),
    "a recorded try with frames opened is labelled supported",
  );
  const spoken = await page.evaluate(() =>
    (JSON.parse(localStorage.getItem("accessPracticeLab:v1:ledger") || "{}").entries || []).at(-1),
  );
  ok(
    spoken?.src === "speaking" && spoken.domain === "Speaking",
    "a recorded explanation is a speaking entry in the ledger",
  );

  // recording: no recorder at all, self-check only
  await click("[data-tb-revise]");
  await page.addInitScript(() => {
    delete window.MediaRecorder;
  });
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("#tbText");
  await page.locator('input[name="tbMode"][value="record"]').check();
  ok(
    (await page.locator("[data-tb-rec]").count()) === 0 &&
      /Recording is not available on this device or browser/.test(
        await page.locator("[data-tb-norec]").innerText(),
      ),
    "with no recorder the page says so and offers typing or self-check",
  );
  await page.locator("#tbText").fill("");
  for (const box of await page.locator('input[name="tbSelf"]').all()) await box.check();
  await page.locator("[data-tb-submit]").click();
  await page.waitForSelector(".tb-feedback");
  ok(
    /You checked it yourself/.test(await body()) &&
      (await page.locator(".tb-point .tb-status", { hasText: "You ticked this" }).count()) === 3,
    "a self-check lists what the learner ticked",
  );
  ok((await page.locator(".tb-obs-grid").count()) === 0, "a self-check makes no rule-based claims");
  await checkStep("self-check feedback");

  // Spanish
  await page.evaluate(() => {
    localStorage.removeItem("accessPracticeLab:v1:teach-back");
    localStorage.setItem(
      "accessPracticeLab:v1:prefs",
      JSON.stringify({ langChosen: true, band: "6-8", lang: "es" }),
    );
  });
  await go("/teach-back");
  const es = await body();
  ok(
    (await page.locator("h1").innerText()).includes("Enséñalo de vuelta"),
    "/teach-back renders in Spanish",
  );
  ok(
    /Matemáticas/.test(es) && /Ciencias/.test(es) && /Razones y tasas unitarias/.test(es),
    "subjects and idea titles are in Spanish",
  );
  await axe("pick in Spanish");
  await click('[data-tb-pick="mean-vs-median"]');
  ok(
    /Aprende la idea/.test(await heading()) && /promedio/.test(await body()),
    "the learn step is in Spanish",
  );
  await axe("learn in Spanish");

  // early band
  await page.evaluate(() =>
    localStorage.setItem(
      "accessPracticeLab:v1:prefs",
      JSON.stringify({ langChosen: true, band: "K" }),
    ),
  );
  await go("/teach-back?grades=K");
  ok(
    /made for grades 3–8/i.test(await body()) &&
      (await page.locator("[data-tb-pick]").count()) === 0,
    "early bands see the shell's friendly 'made for grades 3–8' message, not the chooser",
  );
  await axe("early band message");

  // privacy
  const origin = new URL(page.url()).origin;
  ok(
    requests.every(
      (r) => /^(GET|HEAD) /.test(r) && (r.includes(origin) || /^GET (data|blob):/.test(r)),
    ),
    "every request stayed on this origin and none sent data",
  );
} catch (error) {
  ok(false, `run aborted: ${error.message.split("\n")[0]}`);
}
await finish();

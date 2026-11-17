#!/usr/bin/env node
/**
 * Part 2 paths no other script drives, in a real browser, against the REAL class server (tools/lib/part2-e2e-server.mjs
 * runs functions/api/class/[[path]].js over node:sqlite; nothing about the class is stubbed). Synthetic data only.
 *   1. Real microphone recordings (Chromium's fake device fed a generated WAV): two Speaking Studio takes are recorded,
 *      kept for the teacher, and appear as a playable pair in the Time Machine speaking comparison; a spoken answer in
 *      the simulation records (the player keeps it in memory) and the typed transcript path still completes.
 *   2. Sharing with a real class: a teacher creates a class through the API, a learner joins through /class, then
 *      shares (a) Language coach loops from Speaking Studio, Writing Studio and an ACCESS activity, (b) the simulation
 *      evidence report, (c) the Time Machine comparison, (d) a pathway packet; the teacher opens /class/teacher with the
 *      class passcode and sees every item.
 *   3. Teacher decisions round trip: replace (with a next activity), accept and another attempt on the three loops;
 *      back on the learner's device the loop's review stage holds the decision, the panel shows it, the override wins
 *      over the automated suggestion (effectiveFeedback), and My class lists the decisions.
 *   4. Coach entry points: Writing Studio "Revise and try a new task" through to the transfer; an ACCESS activity in
 *      "Learn with help" → writing check → loop panel; "Try independently" and the summative test simulation show no
 *      coach. Also the simulation's automatic character helper (no button; one AI note in the panel).
 * `--shots <dir>` saves screenshots.
 */
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startPart2Server, toneWav } from "./lib/part2-e2e-server.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("part2-paths-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}

const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const LAB = "/access-practice-lab";
const SPEAK_TASK = "spk-evaporation-explain";
const WRITE_TASK = "wrt-mulch-cer";
const MISSION = "city-that-stopped-talking";
const PATHWAY = "explain-with-evidence";
const SAID_1 =
  "The open cup lost the most water. The sun was hot. The water went into the air. The covered cup lost only a little water.";
const SAID_2 =
  "The open cup lost the most water because the sun heated it and the water went into the air. The covered cup lost only a little water because the lid kept it in.";
const REPLACE = "Name the cup that lost the most water and give the number you measured.";

const { server, origin, teacherKey } = await startPart2Server();
const wavDir = mkdtempSync(join(tmpdir(), "part2-e2e-"));
const wav = join(wavDir, "voice.wav");
writeFileSync(wav, toneWav({ seconds: 6 }));
const browser = await chromium.launch({
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    `--use-file-for-fake-audio-capture=${wav}`,
    "--autoplay-policy=no-user-gesture-required",
  ],
});
const errors = [];
const watch = (page, who) => {
  page.on(
    "pageerror",
    (e) => !/web-vitals/.test(String(e)) && errors.push(`${who} pageerror ${e.stack || e}`),
  );
  page.on("console", (m) => {
    // The static half of the server has no build-time modules and no /api outside /api/class.
    if (m.type() === "error" && !/web-vitals|favicon|Failed to load resource/.test(m.text()))
      errors.push(`${who} console ${m.text().slice(0, 200)}`);
  });
};
const settle = (page, ms = 250) => page.waitForTimeout(ms);
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
};
const go = async (page, path, sel = "#app h1") => {
  await page.goto(`${origin}${LAB}${path}`);
  await page.waitForSelector(sel, { timeout: 15000 });
  await settle(page);
};
const intel = (page) =>
  page.evaluate(() =>
    JSON.parse(localStorage.getItem("accessPracticeLab:v1:intel") || '{"loops":{}}'),
  );
const newestLoop = async (page, src) =>
  Object.values((await intel(page)).loops)
    .filter((l) => l.src === src)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
/** Every <audio> under `sel`: its bytes and whether it really plays. */
const audioCheck = (page, sel) =>
  page.evaluate(async (s) => {
    const out = [];
    for (const a of document.querySelectorAll(s)) {
      const size = a.src ? (await (await fetch(a.src)).blob()).size : 0;
      let played = false;
      try {
        a.muted = true;
        await a.play();
        await new Promise((r) => setTimeout(r, 500));
        played = a.currentTime > 0;
        a.pause();
      } catch {}
      out.push({ size, played });
    }
    return out;
  }, sel);

/** Drive a Language coach loop panel from feedback to the review stage, then share it (or not). */
async function driveLoop(page, scope, { revision, transfer, share = true }) {
  const stage = (s) =>
    page.waitForSelector(`${scope} [data-intel-panel][data-intel-stage="${s}"]`, {
      timeout: 10000,
    });
  await stage("practice");
  await page.click(`${scope} [data-intel="practice-skip"]`);
  await stage("revision");
  await page.fill(`${scope} [data-intel-field="revision"]`, revision);
  await page.click(`${scope} [data-intel="revise-save"]`);
  await stage("transfer");
  await page.click(`${scope} [data-intel="changes-next"]`);
  await page.waitForSelector(`${scope} [data-intel-field="transfer"]`);
  await page.fill(`${scope} [data-intel-field="transfer"]`, transfer);
  await page.click(`${scope} [data-intel="transfer-save"]`);
  await stage("review");
  if (!share) return;
  await page.click(`${scope} [data-intel="share"]`);
  await stage("done");
}

const shares = []; // { kind, label, workId } for every successful POST /api/class/review/share
let shareKind = "";

try {
  // ── the teacher makes a class through the real endpoint ─────────────────────────────────────────────────────
  const made = await (
    await fetch(`${origin}/api/class/create`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-teacher-key": teacherKey },
      body: JSON.stringify({ app: "language", title: "Period 2" }),
    })
  ).json();
  ok(
    made.ok && /^[A-Z2-9]{6}$/.test(made.code) && made.teacherPasscode,
    `a class was created (${made.code})`,
  );

  // ── the learner joins through the app's own join form ──────────────────────────────────────────────────────
  const kid = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ["microphone"],
  });
  await kid.addInitScript(() => {
    // Typing is the path under test: no speech recognition, and a read-aloud that ends on its own.
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
    if (!localStorage.getItem("accessPracticeLab:v1:prefs"))
      localStorage.setItem(
        "accessPracticeLab:v1:prefs",
        JSON.stringify({ band: "6-8", lang: "en", langChosen: true }),
      );
  });
  kid.on("response", async (res) => {
    if (!res.url().includes("/api/class/review/share")) return;
    const body = await res.json().catch(() => null);
    if (body?.ok)
      shares.push({
        kind: shareKind,
        label: res.request().postDataJSON()?.label || "",
        workId: body.workId,
      });
  });
  const aiCalls = [];
  kid.on(
    "request",
    (req) => req.url().includes("/api/class/ai/character") && aiCalls.push(req.url()),
  );
  const page = await kid.newPage();
  watch(page, "learner");
  await go(page, `/class?join=${made.code}&grades=6-8`, "#clsAlias");
  await page.fill("#clsAlias", "Robin");
  await page.click(".cls-join button[type=submit]");
  await page.waitForFunction(
    () => Boolean(localStorage.getItem("accessPracticeLabClass:v1:link")),
    null,
    { timeout: 10000 },
  );
  const link = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("accessPracticeLabClass:v1:link")),
  );
  ok(
    link.code === made.code && /^s[a-f0-9]{10}$/.test(link.studentId),
    "join: the app's join flow linked this device to the class",
  );

  // ── 1. Speaking Studio: two real recordings, kept, then the coach loop shared ──────────────────────────────
  await go(page, `/speak/${SPEAK_TASK}?grades=6-8`, "[data-rec-start]");
  const record = async (ms, n) => {
    await page.click("[data-rec-start]");
    await page.waitForSelector("[data-rec-stop]", { timeout: 10000 });
    await page.waitForTimeout(ms);
    await page.click("[data-rec-stop]");
    await page.waitForFunction((n) => document.querySelectorAll(".takes li audio").length >= n, n, {
      timeout: 10000,
    });
    await settle(page, 500);
  };
  await record(1800, 1);
  let rows = await audioCheck(page, ".takes li audio");
  ok(
    rows.length === 1 && rows[0].size > 1000 && rows[0].played,
    `speak: take 1 recorded from the microphone and plays (${JSON.stringify(rows)})`,
  );
  await page.fill("[data-transcript]", SAID_1);
  await page.click("[data-analyze]");
  await page.waitForSelector("[data-intel-coach]");
  await page.waitForTimeout(1200); // two takes must be at least a moment apart to be "earlier" and "later"
  await page.locator(".takes li").nth(0).locator("[data-keep]").click();
  await page.waitForFunction(() =>
    /Kept for my teacher/.test(document.querySelector(".takes li [data-keep]")?.textContent || ""),
  );
  await record(2200, 2);
  rows = await audioCheck(page, ".takes li audio");
  ok(
    rows.length === 2 && rows.every((r) => r.size > 1000 && r.played),
    "speak: take 2 recorded and both takes play",
  );
  await page.fill("[data-transcript]", SAID_2);
  await page.click("[data-analyze]");
  await page.waitForSelector("[data-intel-coach]");
  await page.locator(".takes li").nth(1).locator("[data-keep]").click();
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".takes li [data-keep]")].every((b) =>
      /Kept/.test(b.textContent),
    ),
  );
  const studio = await page.evaluate(
    (id) => JSON.parse(localStorage.getItem("accessPracticeLab:v1:studio")).speaking[id],
    SPEAK_TASK,
  );
  ok(
    studio.takes.length === 2 &&
      studio.takes.every((t) => t.keptAudio) &&
      studio.takes[0].transcript === SAID_1 &&
      studio.takes[1].transcript === SAID_2,
    "speak: both takes are saved with their typed words and kept for the teacher",
  );
  const kept = await page
    .evaluate(
      async (ids) => {
        const A = await import("/access-practice-lab/src/audio-store.js");
        return Promise.all(ids.map(async (id) => Boolean(await A.get?.(id))));
      },
      studio.takes.map((t) => t.id),
    )
    .catch(() => null);
  if (kept) ok(kept.every(Boolean), "speak: both recordings are in the device's audio store");
  shareKind = "loop:speak";
  await page.click("[data-intel-coach]");
  await driveLoop(page, "", {
    revision: SAID_2,
    transfer:
      "With less light, plants make less food, so the animals that eat them have less to eat.",
  });
  const speakLoop = await newestLoop(page, "speak");
  ok(
    speakLoop?.stages.review?.shared === true &&
      /^w[a-f0-9]{12}$/.test(speakLoop.stages.review.workId),
    "(a) the speaking loop was shared from the loop panel",
  );
  await shot(page, "speak-shared");

  // ── 2. Time Machine: the two recordings side by side, then shared ─────────────────────────────────────────
  const pairId = await page.evaluate(async (task) => {
    const { loadModel } = await import("/access-practice-lab/src/timemachine/load.js");
    const m = await loadModel();
    return (
      m.pairs.find(
        (p) =>
          p.kind === "speaking" &&
          [p.earlier, p.later].every((x) => x.taskId === task && x.id.startsWith("s:")),
      )?.id || ""
    );
  }, SPEAK_TASK);
  ok(Boolean(pairId), `time machine: the two recorded takes form a speaking pair (${pairId})`);
  await go(
    page,
    `/time-machine?tab=speaking&pair=${encodeURIComponent(pairId)}&grades=6-8`,
    ".tm-page h1",
  );
  await page
    .waitForFunction(() => document.querySelectorAll("audio.tm-player").length === 2, null, {
      timeout: 10000,
    })
    .catch(() => {});
  const tmAudio = await audioCheck(page, "audio.tm-player");
  ok(
    tmAudio.length === 2 && tmAudio.every((a) => a.size > 1000 && a.played),
    `time machine: both real recordings load and play (${JSON.stringify(tmAudio)})`,
  );
  const tmWords = await page.locator(".tm-side .tm-text").allInnerTexts();
  ok(
    tmWords.length === 2 &&
      tmWords[0].includes("The sun was hot") &&
      tmWords[1].includes("the lid kept it in"),
    "time machine: each recording shows its own words",
  );
  await shot(page, "tm-speaking");
  shareKind = "time-machine";
  await page.click("[data-tm-share]");
  await page.waitForFunction(
    () => /Sent to your teacher/.test(document.querySelector(".tm-actions")?.textContent || ""),
    null,
    { timeout: 10000 },
  );
  ok(
    shares.some((s) => s.kind === "time-machine" && /^Time Machine:/.test(s.label)),
    "(c) the Time Machine comparison was shared",
  );

  // ── 3. The simulation: a spoken answer recorded, the typed path completes, the report shared ─────────────
  const hot = async (id) => {
    await page.click(`.sim-stage [data-sim-hot="${id}"]`);
    await page.waitForSelector("#simPanelH");
    await settle(page, 200);
  };
  const ask = async (hotspot, topic, clarify = false) => {
    if (hotspot) await hot(hotspot);
    await page.click(`[data-sim-${clarify ? "clarify" : "ask"}="${topic}"]`);
    await settle(page, 200);
  };
  const travel = async (scene) => {
    await page.click('[data-sim-view="map"]');
    await page.click(`[data-sim-go="${scene}"]`);
    await page.waitForFunction(() => !document.querySelector(".sim-stage.is-map"));
    await settle(page, 200);
  };
  const decide = async (hotspot, option, cited, confirm = false) => {
    await hot(hotspot);
    await page.check(`[name="sim-opt"][value="${option}"]`);
    for (const id of cited) await page.check(`[data-sim-cite="${id}"]`);
    await page.click("[data-sim-decide]");
    if (confirm) await page.click('[data-sim-decide][data-sure="1"]');
    await settle(page, 200);
  };
  const write = async (hotspot, task, text) => {
    await hot(hotspot);
    await page.fill(`[data-sim-text="${task}"]`, text);
    await page.click(`[data-sim-submit="${task}"]`);
    await page.waitForSelector(".sim-work");
    await settle(page, 200);
  };
  await go(page, `/simulations/${MISSION}?grades=6-8`, "[data-sim-player] h1");
  await hot("loudspeaker");
  await page.click('[data-sim-play="first-report"]');
  await settle(page, 300);
  await page.click('[data-sim-collect="first-report"]');
  await hot("board");
  await ask("okafor", "what-happened");
  // the automatic character helper: a suggested question never calls it; a typed one the device is unsure of does
  ok(aiCalls.length === 0, "sim: a suggested question never calls the character helper");
  ok(
    (await page.locator("[data-sim-ai-note]").innerText()).includes("Don't type names"),
    "sim: the dialogue panel says typed questions may go to an AI helper",
  );
  ok(
    (await page.locator("[data-sim-assist]").count()) === 0,
    "sim: there is no 'ask the helper' button any more",
  );
  await page.fill("[data-sim-question]", "What is your favorite pizza topping?");
  await page.click("[data-sim-send]");
  await page.waitForFunction(
    () => /You asked:/.test(document.querySelector("#simAsked")?.textContent || ""),
    null,
    { timeout: 8000 },
  );
  ok(
    aiCalls.length === 1,
    `sim: a typed question the device cannot match asks the helper automatically (${aiCalls.length})`,
  );
  ok(
    (await page.locator(".sim-panel").innerText()).includes("I cannot help with that one"),
    "sim: with no model behind the class server, the in-role fallback answers",
  );
  await decide("clipboard", "citywide", ["notice-board"]);
  await travel("comms");
  for (const id of ["terminal", "chart", "sheet"]) await hot(id);
  await ask("nair", "changed");
  await ask("", "changed", true);
  for (const [rel, strong, why] of [
    ["conflict", "system-log", "the log was recorded at six but she only remembers"],
  ]) {
    await hot("whiteboard");
    await page.check(`[name="sim-rel"][value="${rel}"]`);
    await page.check(`[name="sim-strong"][value="${strong}"]`);
    await page.fill("[data-sim-reason]", why);
    await page.click("[data-sim-compare]");
    await settle(page, 200);
  }
  await travel("lab");
  await hot("li");
  await ask("", "run-test");
  await travel("ops");
  await hot("plans");
  await decide("decision", "reset-relay", ["system-log", "channel-test"], true);
  await hot("microphone");
  await page.click('[data-sim-rec="brief"]');
  await page.waitForSelector('[data-sim-rec="brief"][aria-pressed="true"]', { timeout: 10000 });
  await page.waitForTimeout(1500);
  await page.click('[data-sim-rec="brief"]');
  await page.waitForSelector("audio.sim-audio", { timeout: 10000 });
  const simAudio = await audioCheck(page, "audio.sim-audio");
  ok(
    simAudio.length === 1 && simAudio[0].size > 1000 && simAudio[0].played,
    `sim: the spoken answer was recorded and plays back (${JSON.stringify(simAudio)})`,
  );
  const simStored = await page.evaluate(() =>
    JSON.stringify({ ...localStorage }).includes("blob:"),
  );
  ok(!simStored, "sim: the recording is kept in memory only (no blob URL in storage)");
  await page.fill(
    '[data-sim-text="brief"]',
    "At six o'clock an automatic update changed the relay channel from seven to seventeen. Because phones still use channel seven, messages leave but never arrive. The system log shows this, and the channel test shows it too.",
  );
  await page.click('[data-sim-submit="brief"]');
  await page.waitForSelector(".sim-work");
  ok(
    (await page.locator(".sim-fb").count()) === 1,
    "sim: the typed transcript of the spoken answer completes with feedback",
  );
  await write(
    "form",
    "recommend",
    "I recommend that the city set the relay back to channel seven. The evidence shows the channel changed at six, because the log recorded it. For example, the test message on channel seven did not arrive three times. Some people think the storm broke the tower. However, the inspection sheet says the antenna is whole.",
  );
  await page.click("[data-sim-outcome]");
  await settle(page);
  await page.click("[data-sim-continue]");
  await settle(page);
  const sim = await page.evaluate(
    (id) => JSON.parse(localStorage.getItem("accessPracticeLab:v1:sim"))[id],
    MISSION,
  );
  ok(
    sim.tasks.brief?.done && sim.outcome,
    `sim: the spoken task is done and the mission reached an outcome (${sim.outcome})`,
  );
  shareKind = "sim";
  await go(page, `/simulations/${MISSION}/report?grades=6-8`, ".sim-report");
  await page.click("[data-simv-share]");
  await page.waitForSelector(".sim-report-page .feedback.is-right", { timeout: 10000 });
  ok(
    shares.some((s) => s.kind === "sim" && /^Simulation:/.test(s.label)),
    "(b) the simulation evidence report was shared",
  );

  // ── 4. A pathway: the transfer done in place, then the packet shared ───────────────────────────────────────
  await go(page, `/pathways/${PATHWAY}?grades=6-8`, "[data-pw-draft]");
  await page.fill(
    "[data-pw-draft]",
    "Plants need light because the window plant grew to 14 cm and the closet plant only grew to 6 cm.",
  );
  await page.click("[data-pw-transfer-save]");
  await page.waitForSelector("#pwTransfer .intel-panel", { timeout: 10000 });
  shareKind = "pathway";
  await page.click("[data-pw-share]");
  await page.waitForFunction(
    () => /Sent\./.test(document.querySelector("#pwShareNote")?.textContent || ""),
    null,
    { timeout: 10000 },
  );
  ok(
    shares.some((s) => s.kind === "pathway" && /^Pathway:/.test(s.label)),
    "(d) the pathway packet was shared",
  );

  // ── 5. Writing Studio: "Revise and try a new task" through to the transfer, then shared ──────────────────
  await go(page, `/write/${WRITE_TASK}?grades=6-8`, "[data-draft]");
  await page.fill(
    "[data-draft]",
    "Mulch is good for soil. The covered tray lost less soil. The bare tray lost more soil when the water ran.",
  );
  await page.click("[data-feedback]");
  await page.waitForSelector("#wrt-intel [data-intel-coach]");
  ok(
    (await page.locator("#wrt-intel [data-intel-coach]").innerText()).includes(
      "Revise and try a new task",
    ),
    "write: 'Revise and try a new task' follows the feedback",
  );
  await page.click("#wrt-intel [data-intel-coach]");
  shareKind = "loop:write";
  await driveLoop(page, "#wrt-intel", {
    revision:
      "Mulch protects soil because the covered tray lost less soil than the bare tray when the water ran downhill.",
    transfer:
      "Plants grow taller in light because the window plant grew 14 cm and the closet plant grew 6 cm.",
  });
  const writeLoop = await newestLoop(page, "write");
  ok(
    writeLoop?.stages.transfer?.text?.startsWith("Plants grow taller") &&
      writeLoop.stages.transfer.independent === true &&
      writeLoop.stages.review.shared,
    "write: the loop reached the independent transfer and was shared",
  );

  // ── 6. ACCESS activity, Learn with help → writing check → loop panel; independent and summative: no coach ──
  const actId = await page.evaluate(async () => {
    const idx = await (await fetch("/access-practice-lab/content/index.json")).json();
    return idx.bands["6-8"].domains.Writing.levels.B.activities.find(
      (r) => r[2] === "constructed",
    )[0];
  });
  const ACT_TEXT =
    "The library is a quiet place. I smell old books and hear pages turn. The light from the big window makes the tables warm.";
  await go(page, `/Writing/B/${actId}?grades=6-8`, "[data-note]");
  ok(
    await page.isChecked('[data-mode][value="supported"]'),
    "access: the activity opens in Learn with help",
  );
  await page.fill("[data-note]", ACT_TEXT);
  await page.click("[data-check-writing]");
  await page.waitForSelector("#act-intel [data-intel-coach]", { timeout: 10000 });
  await page.click("#act-intel [data-intel-coach]");
  shareKind = "loop:access";
  await driveLoop(page, "#act-intel", {
    revision:
      "The library is a quiet place because people read there. I smell old books and hear pages turn.",
    transfer:
      "The market is loud because people call out prices. I hear carts and smell fresh bread.",
  });
  const accLoop = await newestLoop(page, "access");
  ok(
    accLoop?.task.id === actId && accLoop.stages.review.shared,
    "access: Learn with help → writing check → loop panel → shared",
  );
  await shot(page, "access-loop");

  await go(page, `/Writing/B/${actId}?grades=6-8&mode=independent`, "[data-note]");
  await page.fill("[data-note]", ACT_TEXT);
  await page.click("[data-check-writing]");
  await page.waitForSelector(".feedback.is-hint", { timeout: 10000 });
  ok(
    (await page.locator("[data-intel-coach], [data-intel-panel]").count()) === 0,
    "access: Try independently shows no coach after the writing check",
  );
  await page.goto(`${origin}${LAB}/assess/b35-write-01?mode=summative`);
  await page.waitForSelector("[data-act=begin]", { timeout: 15000 });
  await page.click("[data-act=begin]");
  await page.waitForSelector(".acc-textarea");
  await page.fill(".acc-textarea", ACT_TEXT);
  await settle(page);
  ok(
    (await page
      .locator("[data-intel-coach], [data-intel-panel], .intel-panel, .intel-entry")
      .count()) === 0 && (await page.locator("[data-act=check]").count()) === 0,
    "summative test simulation: no coach and no check",
  );

  // ── 7. The teacher's queue, in the app, with the class passcode ───────────────────────────────────────────
  ok(shares.length === 6, `six items were shared (${shares.map((s) => s.kind).join(", ")})`);
  const byKind = Object.fromEntries(shares.map((s) => [s.kind, s]));
  const adult = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await adult.addInitScript(
    (c) => localStorage.setItem("accessPracticeLabClass:v1:teacher-classes", JSON.stringify([c])),
    { code: made.code, passcode: made.teacherPasscode, title: "Period 2" },
  );
  const tp = await adult.newPage();
  watch(tp, "teacher");
  await go(tp, "/class/teacher?grades=6-8", `button:has-text("(${made.code})")`);
  await tp.click(`button:has-text("(${made.code})")`);
  await tp.waitForSelector(".cls-queue [data-item]", { timeout: 15000 });
  const listed = await tp.$$eval(".cls-queue [data-item]", (els) => els.map((e) => e.dataset.item));
  ok(
    shares.every((s) => listed.includes(s.workId)),
    `teacher: the queue lists every shared item (${listed.length})`,
  );
  for (const kind of ["sim", "time-machine", "pathway"])
    ok(
      (await tp.locator(`[data-item="${byKind[kind].workId}"]`).innerText()).includes(
        byKind[kind].label.slice(0, 20),
      ),
      `teacher: the ${kind} item is labelled "${byKind[kind].label}"`,
    );
  ok(
    (await tp.locator(".cls-queue [data-intel-digest]").count()) === 3,
    "teacher: the three loops are shown as labelled digests",
  );
  await shot(tp, "teacher-queue");

  const decideOn = async (workId, decision, next, comment) => {
    const card = tp.locator(`[data-item="${workId}"]`);
    await card.locator(`input[data-decision][value="${decision}"]`).check();
    if (next) await card.locator("select[data-next]").selectOption(next);
    await card.locator("textarea").fill(comment);
    await card.locator(".row-actions .btn-primary").click();
    await tp
      .waitForSelector(`[data-item="${workId}"].is-reviewed`, { timeout: 10000 })
      .catch(async (e) => {
        throw new Error(
          `${decision}: ${await card
            .locator("[role=status]")
            .innerText()
            .catch(() => "?")} ${e.message}`,
        );
      });
  };
  await decideOn(byKind["loop:speak"].workId, "replace", "/write", REPLACE);
  await decideOn(byKind["loop:write"].workId, "accept", "/speak", "");
  await decideOn(byKind["loop:access"].workId, "again", "", "Add one more detail you can hear.");
  ok((await tp.locator(".cls-queue .is-reviewed").count()) === 3, "teacher: three decisions saved");

  // ── 8. Back on the learner's device: each decision is in its loop and shown ──────────────────────────────
  await go(page, `/speak/${SPEAK_TASK}?grades=6-8`, '[data-intel-panel][data-intel-stage="done"]');
  await page.click('[data-intel="sync"]');
  await page.waitForSelector('[data-intel-teacher="replace"]', { timeout: 10000 });
  const sp = await newestLoop(page, "speak");
  ok(
    sp.stages.review.teacher?.decision === "replace" &&
      sp.stages.review.teacher.next === "/write" &&
      sp.stages.review.teacher.comment === REPLACE,
    "learner: the replace decision is saved in the loop's review stage",
  );
  const eff = await page.evaluate(
    async (l) => (await import("/access-practice-lab/src/intel/review.js")).effectiveFeedback(l),
    sp,
  );
  ok(
    eff.source === "teacher" && eff.nextStep[0] === REPLACE,
    "learner: effectiveFeedback returns the teacher's next step",
  );
  const shownNext = await page.locator(".intel-done [data-intel-next]").innerText();
  ok(
    shownNext.includes(REPLACE) &&
      !shownNext.includes(sp.stages.feedback.feedback.nextStep.text[0]),
    "learner: the override is shown instead of the automated suggestion",
  );
  const teacherLinks = await page.$$eval("[data-intel-teacher] a", (as) =>
    as.map((a) => a.getAttribute("href")),
  );
  ok(
    teacherLinks.length === 1 && new URL(teacherLinks[0], origin).pathname === `${LAB}/write`,
    `learner: the teacher's next activity is offered (${teacherLinks.join(" ")})`,
  );
  await shot(page, "learner-replace");

  await go(page, `/write/${WRITE_TASK}?grades=6-8`, "#wrt-intel [data-intel-panel]");
  await page.click('#wrt-intel [data-intel="sync"]');
  await page.waitForSelector('#wrt-intel [data-intel-teacher="accept"]', { timeout: 10000 });
  const wl = await newestLoop(page, "write");
  const effW = await page.evaluate(
    async (l) => (await import("/access-practice-lab/src/intel/review.js")).effectiveFeedback(l),
    wl,
  );
  ok(
    wl.stages.review.teacher?.decision === "accept" && effW.source === "auto",
    "learner: accept keeps the automated next step, marked as agreed",
  );

  await go(page, `/Writing/B/${actId}?grades=6-8`, "[data-note]");
  await page.click("[data-check-writing]");
  await page.waitForSelector('#act-intel [data-intel-panel][data-intel-stage="done"]', {
    timeout: 10000,
  });
  await page.click('#act-intel [data-intel="sync"]');
  await page.waitForSelector('#act-intel [data-intel-teacher="again"]', { timeout: 10000 });
  await page.click('#act-intel [data-intel="again"]');
  await page.waitForSelector('#act-intel [data-intel-panel][data-intel-stage="response"]', {
    timeout: 10000,
  });
  const accLoops = Object.values((await intel(page)).loops).filter(
    (l) => l.src === "access" && l.task.id === actId,
  );
  ok(
    accLoops.length === 2 &&
      accLoops.some((l) => l.stages.review?.teacher?.decision === "again" && l.panel?.nextLoop),
    "learner: 'another attempt' starts a new try linked from the reviewed loop",
  );

  await go(page, "/class?grades=6-8", "#clsFbH");
  const decided = await page.$$eval("[data-intel-decision]", (els) =>
    els.map((e) => e.dataset.intelDecision).sort(),
  );
  ok(
    decided.join() === "accept,again,replace",
    `My class: the three decisions are listed (${decided.join()})`,
  );
  await adult.close();
  await kid.close();
  ok(errors.length === 0, `no page or console errors ${errors.slice(0, 4).join(" || ")}`);
} catch (err) {
  failures.push(`crashed: ${err.stack || err}`);
  console.log(`FAIL crashed: ${err.stack || err}`);
  if (errors.length) console.log(`errors so far: ${errors.slice(0, 5).join(" || ")}`);
} finally {
  await browser.close();
  server.close();
}
console.log(
  failures.length
    ? `\npart2-paths-e2e: ${failures.length} FAILED`
    : "\npart2-paths-e2e: all passed",
);
process.exit(failures.length ? 1 : 0);

#!/usr/bin/env node
/**
 * Language Time Machine (/time-machine) in a real browser, on synthetic data seeded into localStorage and a synthetic
 * audio blob kept through the app's own audio-store (IndexedDB): the writing comparison (two texts, support context,
 * quoted change statements, the loop timeline), a reflection that survives a reload, the speaking comparison (both
 * players load, play one after the other, play together, "these words are right" leaves the studio store untouched,
 * an expired recording still shows its words), a new-context challenge saved as the newest piece, the evidence view,
 * sharing without a class (nothing sent), the doors in Passport and Portfolio, axe, no sideways scroll at 375px and
 * no console errors. `--shots <dir>` saves screenshots. BASE=<url> to point elsewhere.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("time-machine-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}

const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
      file = join(REPO_ROOT, "public", p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
        file = join(REPO_ROOT, "access-practice-lab/index.html");
      else {
        res.writeHead(404);
        return res.end();
      }
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const LAB = "/access-practice-lab";
const P = "accessPracticeLab:v1";
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const errors = [];
const apiCalls = [];
const watch = (page) => {
  page.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  // A static file server has no /api and no build-time modules; those misses are the harness, not the page.
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/Failed to load resource|web-vitals|\/api\//.test(m.text()) &&
      errors.push(`console: ${m.text()}`),
  );
  page.on(
    "request",
    (r) => /\/api\/class\//.test(r.url()) && r.method() !== "GET" && apiCalls.push(r.url()),
  );
};
const settle = async (page) => {
  await page.waitForFunction(() => !document.querySelector(".is-entering"));
  await page.waitForTimeout(250);
};
async function axe(page, name) {
  if (!AxeBuilder) return;
  await settle(page);
  const r = await new AxeBuilder({ page })
    .include(".tm-page")
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(
    bad.length === 0,
    `axe: ${name} ${bad.map((v) => `${v.id}(${v.nodes.length}) ${v.nodes[0]?.target}`).join(" ")}`,
  );
}
const shot = async (page, name) =>
  SHOTS &&
  (await settle(page), await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true }));
const open = async (page, query) => {
  await page.goto(`${origin}${LAB}/time-machine?${query}&grades=6-8`);
  await page.waitForSelector(".tm-page h1");
  await settle(page);
};
const pairQ = (a, b) => `pair=${encodeURIComponent(`${a}~~${b}`)}`;

const EARLY = "Mulch is good. The soil stay. It is good thing for garden.";
const REVISED =
  "Mulch reduces erosion because it covers the soil. However, the bare tray lost more soil when the water ran downhill.";
const loop = (id, attempt, t, text, supports) => ({
  id,
  src: "write",
  band: "6-8",
  objective: "",
  attempt,
  task: {
    id: "e-plants-sun",
    title: "Plants and sunlight",
    prompt: "Explain why plants need sunlight.",
    keyUse: "Explain",
    domain: "Writing",
  },
  createdAt: t,
  updatedAt: t,
  stages: { response: { t, text, source: "typed", supports } },
});
const SEED = {
  [`${P}:studio`]: {
    v: 1,
    writing: {
      "wrt-mulch-cer": {
        stage: "independent",
        used: { frames: false, bank: false },
        versions: [
          { id: "v1", t: "2026-09-02T14:00:00.000Z", kind: "draft", text: EARLY },
          { id: "v2", t: "2026-09-09T14:00:00.000Z", kind: "revision", text: REVISED },
        ],
      },
    },
    speaking: {
      "spk-seedlings-retell": {
        stage: "guided",
        used: { frames: true, bank: false },
        takes: [
          {
            id: "take-old",
            t: "2026-10-20T15:00:00.000Z",
            seconds: 1,
            transcript: "First the class plant seeds. Then they water it.",
            transcriptSource: "speech-local",
            teacherReview: [],
          },
          {
            id: "take-new",
            t: "2026-11-10T15:00:00.000Z",
            seconds: 1,
            transcript:
              "First, the class planted seeds in two trays. Next, they watered one tray every day because seeds need water.",
            transcriptSource: "",
          },
        ],
      },
    },
  },
  [`${P}:intel`]: {
    v: 1,
    loops: {
      lp1: loop(
        "lp1",
        1,
        "2026-10-01T10:00:00.000Z",
        "Plants need sun. They grow. It is good thing.",
        { frames: true },
      ),
      lp2: loop(
        "lp2",
        2,
        "2026-10-15T10:00:00.000Z",
        "Plants need sunlight because they use light energy to make food. Without light, the leaves turn yellow.",
        {},
      ),
    },
  },
};

try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  watch(page);
  await page.goto(`${origin}${LAB}/?grades=6-8`);
  await page.waitForSelector("#app");
  // Seed: saved work in localStorage, and two short synthetic tones kept through the app's own audio-store.
  await page.evaluate(async (seed) => {
    for (const [k, v] of Object.entries(seed)) localStorage.setItem(k, JSON.stringify(v));
    const wav = (hz) => {
      const rate = 8000;
      const n = rate; // one second
      const buf = new ArrayBuffer(44 + n * 2);
      const v = new DataView(buf);
      const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
      str(0, "RIFF");
      v.setUint32(4, 36 + n * 2, true);
      str(8, "WAVEfmt ");
      v.setUint32(16, 16, true);
      v.setUint16(20, 1, true);
      v.setUint16(22, 1, true);
      v.setUint32(24, rate, true);
      v.setUint32(28, rate * 2, true);
      v.setUint16(32, 2, true);
      v.setUint16(34, 16, true);
      str(36, "data");
      v.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++)
        v.setInt16(44 + i * 2, Math.round(Math.sin((2 * Math.PI * hz * i) / rate) * 6000), true);
      return new Blob([buf], { type: "audio/wav" });
    };
    const A = await import("/access-practice-lab/src/audio-store.js");
    await A.keep(
      { id: "take-old", blob: wav(330), seconds: 1, extension: "wav" },
      "spk-seedlings-retell",
    );
    await A.keep(
      { id: "take-new", blob: wav(440), seconds: 1, extension: "wav" },
      "spk-seedlings-retell",
    );
  }, SEED);
  const studioBefore = await page.evaluate((k) => localStorage.getItem(k), `${P}:studio`);

  // ── Writing ────────────────────────────────────────────────────────────────
  await open(page, `tab=writing&${pairQ("w:wrt-mulch-cer:v1", "w:wrt-mulch-cer:v2")}`);
  ok((await page.locator(".tm-tab").count()) === 5, "hub shows five sections");
  ok((await page.locator(".tm-side").count()) === 2, "writing: earlier and later side by side");
  const sides = await page.locator(".tm-side .tm-text").allInnerTexts();
  ok(
    sides[0].includes("The soil stay") && sides[1].includes("Mulch reduces erosion"),
    "writing: both texts are the saved versions",
  );
  const caps = await page.locator(".tm-side .tm-support").allInnerTexts();
  ok(
    /on my own/.test(caps[0]) && /revision after feedback \(supported\)/.test(caps[1]),
    `writing: support context beside each text (${caps.join(" | ")})`,
  );
  ok(
    /Longer is not automatically better/.test(await page.locator(".tm-changes").innerText()),
    "writing: says longer is not automatically better",
  );
  const nChanges = await page.locator(".tm-changes .tm-change").count();
  ok(nChanges >= 1, `writing: ${nChanges} change statement(s)`);
  const quotes = await page.locator(".tm-changes .tm-quote q").allInnerTexts();
  ok(
    quotes.length >= 1 && quotes.every((q) => sides.some((s) => s.includes(q))),
    "writing: every quoted run is in one of the two texts",
  );
  await page.locator("[data-tm-show]").first().click();
  ok(
    (await page.locator(".tm-mark.is-shown").count()) === 1,
    "writing: 'Show it in my text' marks the quoted words",
  );
  ok(
    await page.evaluate(() => document.activeElement?.classList.contains("tm-mark")),
    "writing: focus moves to the quoted words",
  );
  const two = await page.evaluate(() => {
    const [a, b] = [...document.querySelectorAll(".tm-side")].map((e) => e.getBoundingClientRect());
    return Math.abs(a.top - b.top) < 4 && b.left > a.right - 1;
  });
  ok(two, "writing: side by side on a wide screen");
  await axe(page, "writing pair");
  await shot(page, "writing-1280");

  // the loop pair: same task, two attempts, timeline
  await open(page, `tab=writing&${pairQ("l:lp1:response", "l:lp2:response")}`);
  ok(
    /Explain why plants need sunlight\./.test(
      await page.locator(".tm-side-a .tm-prompt").innerText(),
    ),
    "writing: the task is shown with each text",
  );
  ok(
    /with sentence frames/.test(await page.locator(".tm-side-a .tm-support").innerText()),
    "writing: 'with sentence frames' on the supported attempt",
  );

  // ── Reflection ─────────────────────────────────────────────────────────────
  await page.fill('[data-tm-reflect="improved"]', "I explained why with the word because.");
  await page.fill('[data-tm-reflect="goal"]', "Next time I will add an example.");
  ok(
    /Saved on this device/.test(await page.locator("[data-tm-saved]").innerText()),
    "reflection: saved as I type",
  );
  await page.reload();
  await page.waitForSelector(".tm-page h1");
  await settle(page);
  ok(
    (await page.inputValue('[data-tm-reflect="improved"]')) ===
      "I explained why with the word because.",
    "reflection: survives a reload",
  );
  await open(page, "tab=reflections");
  ok(
    /I explained why with the word because\./.test(
      await page.locator(".tm-refl").first().innerText(),
    ),
    "reflections tab lists my answer",
  );

  // ── Speaking ───────────────────────────────────────────────────────────────
  await open(
    page,
    `tab=speaking&${pairQ("s:spk-seedlings-retell:take-old", "s:spk-seedlings-retell:take-new")}`,
  );
  ok(
    (await page.locator("audio.tm-player").count()) === 2,
    "speaking: a real player for each recording",
  );
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll("audio.tm-player")].every(
          (a) => a.readyState >= 1 && a.duration > 0,
        ),
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  const durs = await page.evaluate(() =>
    [...document.querySelectorAll("audio.tm-player")].map((a) => a.duration),
  );
  ok(
    durs.length === 2 && durs.every((d) => d > 0.5),
    `speaking: both recordings load (${durs.join(", ")}s)`,
  );
  ok(
    (await page.locator(".tm-words .tm-text").count()) === 2,
    "speaking: words (captions) under each recording",
  );
  ok(
    /Speech-recognition text\. It may contain errors/.test(
      await page.locator(".tm-side-a").innerText(),
    ),
    "speaking: speech-recognition words are labelled",
  );
  await page.click('[data-tm-play="together"]');
  await page.waitForTimeout(300);
  const together = await page.evaluate(() =>
    [...document.querySelectorAll("audio.tm-player")].map((a) => !a.paused && a.currentTime > 0),
  );
  ok(together.every(Boolean), "speaking: 'play together from the start' starts both");
  await page.click('[data-tm-play="stop"]');
  ok(
    await page.evaluate(() =>
      [...document.querySelectorAll("audio.tm-player")].every((a) => a.paused),
    ),
    "speaking: stop pauses both",
  );
  await page.click('[data-tm-play="sequence"]');
  await page.waitForTimeout(300);
  const first = await page.evaluate(() =>
    [...document.querySelectorAll("audio.tm-player")].map((a) => !a.paused),
  );
  ok(first[0] && !first[1], "speaking: 'one after the other' starts with the earlier recording");
  await page
    .waitForFunction(
      () => {
        const [a, b] = document.querySelectorAll("audio.tm-player");
        return a.ended && !b.paused;
      },
      null,
      { timeout: 6000 },
    )
    .catch(() => {});
  const second = await page.evaluate(() => {
    const [a, b] = document.querySelectorAll("audio.tm-player");
    return a.ended && (!b.paused || b.currentTime > 0);
  });
  ok(second, "speaking: then the later recording plays");
  await page.click('[data-tm-play="stop"]');
  const speakText = await page.locator(".tm-pair").innerText();
  ok(
    !/\b(accent|speed|faster|slower|pace|pauses?)\b/i.test(speakText),
    "speaking: no accent, speed, pace or pause wording on the page",
  );
  await page.click('[data-tm-verify="s:spk-seedlings-retell:take-old"]');
  await page.waitForSelector('[data-tm-unverify="s:spk-seedlings-retell:take-old"]');
  ok(
    /You confirmed these words/.test(await page.locator(".tm-side-a").innerText()),
    "speaking: 'These words are right' confirms the transcript",
  );
  ok(
    (await page.evaluate((k) => localStorage.getItem(k), `${P}:studio`)) === studioBefore,
    "speaking: the studio store is byte-identical after confirming",
  );
  ok(
    await page.evaluate(
      (k) =>
        JSON.parse(localStorage.getItem(k)).verified["s:spk-seedlings-retell:take-old"] === true,
      `${P}:time-machine`,
    ),
    "speaking: the flag is in the Time Machine's own key",
  );
  await axe(page, "speaking pair");
  await shot(page, "speaking-1280");

  // ── New challenge ──────────────────────────────────────────────────────────
  await open(page, `tab=writing&${pairQ("l:lp1:response", "l:lp2:response")}`);
  await page.click(".tm-actions a.btn-primary");
  await page.waitForSelector(".tm-challenge");
  ok(
    /Explain how reduced sunlight could affect an ecosystem\./.test(
      await page.locator(".tm-chprompt").innerText(),
    ),
    "challenge: same goal, new context (reduced sunlight and an ecosystem)",
  );
  ok(
    /Help is closed/.test(await page.locator(".tm-challenge").innerText()) &&
      (await page.locator(".tm-help").count()) === 0,
    "challenge: help is closed by default",
  );
  await page.click("[data-tm-chsave]");
  ok(
    /at least three words/.test(await page.locator(".tm-challenge .tm-status").innerText()),
    "challenge: an empty response is not saved",
  );
  await page.fill(
    "[data-tm-challenge]",
    "With less sunlight, plants make less food, so the animals that eat those plants have less to eat.",
  );
  await page.click("[data-tm-chsave]");
  await page.waitForSelector("#tmChDone");
  ok(
    /done on your own/.test(await page.locator("#tmChDone").locator("..").innerText()),
    "challenge: saved as done on my own",
  );
  const made = await page.evaluate(
    (k) =>
      Object.values(JSON.parse(localStorage.getItem(k)).loops).filter(
        (l) => l.src === "time-machine",
      ),
    `${P}:intel`,
  );
  ok(
    made.length === 1 && made[0].stages.transfer?.independent === true && !made[0].stages.response,
    "challenge: recorded as a new loop (src time-machine, transfer, independent)",
  );
  ok(
    await page.evaluate((k) => {
      const l = JSON.parse(localStorage.getItem(k)).loops;
      return (
        l.lp1.stages.response.text.startsWith("Plants need sun.") &&
        Object.keys(l.lp2.stages).length === 1
      );
    }, `${P}:intel`),
    "challenge: the earlier loops are unchanged",
  );
  await page.click("#tmChDone ~ .row-actions a, .panel:has(#tmChDone) a.btn-primary");
  await page.waitForSelector(".tm-pair");
  await settle(page);
  ok(
    /With less sunlight/.test(await page.locator(".tm-side-b .tm-text").innerText()),
    "challenge: it is now the later piece of a pair",
  );
  ok(
    /Same goal, new context/.test(await page.locator(".tm-pairhead").innerText()),
    "challenge: the pair is labelled 'same goal, new context'",
  );
  ok(
    /on my own/.test(await page.locator(".tm-side-b .tm-support").innerText()),
    "challenge: its support context is kept",
  );

  // with help opened it is saved as supported
  await open(page, `tab=challenge&from=${encodeURIComponent("w:wrt-mulch-cer:v2")}`);
  await page.fill("[data-tm-challenge]", "This is my answer for the new task.");
  await page.click("[data-tm-help]");
  await page.waitForSelector(".tm-help");
  ok(
    (await page.inputValue("[data-tm-challenge]")) === "This is my answer for the new task.",
    "challenge: opening help keeps what I wrote",
  );
  await page.click("[data-tm-chsave]");
  await page.waitForSelector("#tmChDone");
  ok(
    await page.evaluate(
      (k) =>
        Object.values(JSON.parse(localStorage.getItem(k)).loops).some(
          (l) =>
            l.src === "time-machine" &&
            l.stages.transfer?.independent === false &&
            l.stages.transfer.supports.frames === true,
        ),
      `${P}:intel`,
    ),
    "challenge: opening help marks the work supported",
  );

  // ── Share (no class) ───────────────────────────────────────────────────────
  await open(page, `tab=writing&${pairQ("w:wrt-mulch-cer:v1", "w:wrt-mulch-cer:v2")}`);
  await page.click("[data-tm-share]");
  await page.waitForFunction(() =>
    /Nothing was sent/.test(document.querySelector(".tm-actions .tm-status")?.textContent || ""),
  );
  ok(apiCalls.length === 0, `share: nothing is sent without a class (${apiCalls.length} calls)`);

  // ── Evidence ───────────────────────────────────────────────────────────────
  await open(page, "tab=evidence");
  const ev = await page.locator(".tm-evidence").innerText();
  for (const h of [
    "Comparable evidence and response changes",
    "Support history",
    "Revision activity",
    "Independent transfer",
    "Suggested next instruction",
  ])
    ok(ev.includes(h), `evidence: ${h}`);
  ok(
    /With less sunlight/.test(ev) && /on their own/.test(ev),
    "evidence: the independent new-context work is listed",
  );
  ok(
    /I explained why with the word because\./.test(ev),
    "evidence: the reflection is with its pair",
  );
  ok(
    (await page.locator(".tm-because").count()) >= 1,
    "evidence: each suggestion names what triggered it",
  );
  ok(!/\d\s?%|\bLevel \d|\bpoints\b/i.test(ev), "evidence: no percentage, level or points");
  await page.emulateMedia({ media: "print" });
  ok(
    await page.evaluate(
      () =>
        getComputedStyle(document.querySelector(".tm-tabs")).display === "none" &&
        document.querySelector(".tm-evidence").offsetHeight > 0,
    ),
    "evidence: print view hides the tabs and keeps the evidence",
  );
  await page.emulateMedia({ media: "screen" });
  await axe(page, "evidence");
  await shot(page, "evidence-1280");

  // ── Doors in Passport and Portfolio ───────────────────────────────────────
  const pairsNow = await page.evaluate(
    async () =>
      (await (await import("/access-practice-lab/src/timemachine/load.js")).loadModel()).pairs
        .length,
  );
  for (const [path, name] of [
    ["passport", "Passport"],
    ["portfolio", "Portfolio"],
  ]) {
    await page.goto(`${origin}${LAB}/${path}?grades=6-8`);
    await page.waitForSelector(".tm-door");
    const n = Number(
      await page.locator(".tm-door [data-tm-door-count]").getAttribute("data-tm-door-count"),
    );
    ok(n === pairsNow && n >= 4, `${name}: the door shows ${n} comparable pairs`);
    ok(
      (await page.locator('.tm-door a[href*="/time-machine"]').count()) === 1,
      `${name}: the door links in`,
    );
  }
  ok(
    /I explained why with the word because\./.test(await page.locator(".tm-door").innerText()),
    "Portfolio door shows my latest reflection",
  );

  // ── An expired recording (older than 30 days) ─────────────────────────────
  await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open("accessPracticeLab-audio", 1);
        req.onsuccess = () => {
          const tx = req.result.transaction("takes", "readwrite");
          const s = tx.objectStore("takes");
          const g = s.get("take-old");
          g.onsuccess = () =>
            s.put({ ...g.result, t: new Date(Date.now() - 40 * 864e5).toISOString() });
          tx.oncomplete = () => (req.result.close(), resolve());
          tx.onerror = () => reject(tx.error);
        };
        req.onerror = () => reject(req.error);
      }),
  );
  await open(
    page,
    `tab=speaking&${pairQ("s:spk-seedlings-retell:take-old", "s:spk-seedlings-retell:take-new")}`,
  );
  ok(
    (await page.locator('[data-tm-gone="a"]').count()) === 1 &&
      (await page.locator("audio.tm-player").count()) === 1,
    "expired: the old recording says it is no longer kept; the later one still plays",
  );
  ok(
    /First the class plant seeds/.test(await page.locator(".tm-side-a .tm-text").innerText()),
    "expired: its words are still shown",
  );
  ok(
    await page.locator('[data-tm-play="sequence"]').isDisabled(),
    "expired: the two-recording buttons are off",
  );
  await ctx.close();

  // ── Not enough to compare ─────────────────────────────────────────────────
  const fresh = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p0 = await fresh.newPage();
  watch(p0);
  for (const tab of ["writing", "speaking", "evidence"]) {
    await open(p0, `tab=${tab}`);
    ok(
      /not enough to compare yet/i.test(await p0.locator(".tm-page").innerText()),
      `empty: ${tab} says there is not enough to compare yet`,
    );
  }
  ok(
    (await p0.locator('.tm-page a.btn-primary[href*="/write"]').count()) >= 1,
    "empty: offers a first task",
  );
  await fresh.close();

  // ── Phone ─────────────────────────────────────────────────────────────────
  const phone = await browser.newContext({
    viewport: { width: 375, height: 800 },
    isMobile: true,
    hasTouch: true,
  });
  const p2 = await phone.newPage();
  watch(p2);
  await p2.goto(`${origin}${LAB}/?grades=6-8`);
  await p2.waitForSelector("#app");
  await p2.evaluate(
    (seed) => Object.entries(seed).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v))),
    SEED,
  );
  for (const [q, name] of [
    [`tab=writing&${pairQ("w:wrt-mulch-cer:v1", "w:wrt-mulch-cer:v2")}`, "writing"],
    [
      `tab=speaking&${pairQ("s:spk-seedlings-retell:take-old", "s:spk-seedlings-retell:take-new")}`,
      "speaking",
    ],
    [`tab=challenge&from=${encodeURIComponent("l:lp2:response")}`, "challenge"],
    ["tab=reflections", "reflections"],
    ["tab=evidence", "evidence"],
  ]) {
    await open(p2, q);
    const over = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 1, `375px: ${name} has no sideways scroll (${over}px)`);
    const small = await p2.evaluate(() =>
      [
        ...document.querySelectorAll(
          ".tm-page a.btn, .tm-page button, .tm-page .tm-tab, .tm-page .tm-pairlink",
        ),
      ]
        .filter((e) => e.offsetParent && e.getBoundingClientRect().height < 43.5)
        .map((e) => e.textContent.trim().slice(0, 30)),
    );
    ok(small.length === 0, `375px: ${name} controls are at least 44px tall ${small.join(" | ")}`);
    if (SHOTS) await p2.screenshot({ path: join(SHOTS, `${name}-375.png`), fullPage: true });
  }
  await open(p2, `tab=writing&${pairQ("w:wrt-mulch-cer:v1", "w:wrt-mulch-cer:v2")}`);
  const stacked = await p2.evaluate(() => {
    const [a, b] = [...document.querySelectorAll(".tm-side")].map((e) => e.getBoundingClientRect());
    return b.top >= a.bottom - 1;
  });
  ok(stacked, "375px: the two texts are stacked");
  await phone.close();
} catch (error) {
  failures.push(`crashed: ${error.stack || error}`);
  console.log(`FAIL crashed: ${error.stack || error}`);
} finally {
  await browser.close();
  server?.close();
}
ok(errors.length === 0, `no page or console errors ${errors.slice(0, 3).join(" | ")}`);
console.log(
  failures.length
    ? `\ntime-machine-e2e: ${failures.length} FAILED`
    : "\ntime-machine-e2e: all passed",
);
process.exit(failures.length ? 1 : 0);

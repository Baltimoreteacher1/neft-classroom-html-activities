#!/usr/bin/env node
/**
 * Language City in a real browser at 1440px and 375px.
 * Plays missions the way a learner does: on my own, with a word bank, with sentence frames; a wrong pick, a wrong word order,
 * Spanish help; one whole mission with the keyboard alone (Tab and Enter); a reload that resumes the same step; the Spanish
 * interface; the progress page and the teacher page; the evidence ledger (independent and supported kept apart).
 * Every page and every kind of step: no console errors, no horizontal overflow, axe WCAG 2.2 AA with zero violations,
 * 16px reading text, 44px targets and a 3px focus ring on the map pins. Screenshots go to $CITY_SHOTS.
 *
 *   node tools/access-language-city-e2e.mjs        (serves this working tree)
 *
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-language-city-e2e: SKIP: playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn(
    "access-language-city-e2e: axe-core/playwright is not installed; skipping axe checks.",
  );
}
const { MISSIONS, BUILDINGS, missionOf } = await import(
  "../access-practice-lab/src/content/city.js"
);

const SHOTS = process.env.CITY_SHOTS || join(tmpdir(), "language-city-shots");
mkdirSync(SHOTS, { recursive: true });
const SAMPLE = {
  thank: "Thank you for your help.",
  request: "Could I please have a card?",
  explain: "I am late because the bus was late.",
  describe: "My throat hurts and it started yesterday.",
  apologize: "I am sorry I am late.",
  disagree: "I understand, but maybe I could have a different one.",
  question: "How many spoons should I take?",
  offer: "Can I help you find it?",
};

const { server, base } = await serveAccess();
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-language-city-e2e: SKIP: no browser (${error.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}
const LAB = `${base}/access-practice-lab`;
const problems = [];
let checks = 0;
const ok = (cond, msg) => {
  checks += 1;
  if (!cond) problems.push(msg);
};

async function open(width, lang = "en") {
  const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 800 : 900 } });
  await ctx.addInitScript((l) => {
    try {
      if (!localStorage.getItem("accessPracticeLab:v1:prefs"))
        localStorage.setItem(
          "accessPracticeLab:v1:prefs",
          JSON.stringify({ lang: l, langChosen: true, band: "6-8" }),
        );
    } catch {}
  }, lang);
  const page = await ctx.newPage();
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      problems.push(`console error: ${m.text().slice(0, 160)} (${page.url()})`),
  );
  page.on(
    "pageerror",
    (e) =>
      !/web-vitals/.test(e.message) &&
      problems.push(`page error: ${e.message.slice(0, 160)} (${page.url()})`),
  );
  return { ctx, page };
}
const go = async (page, path) => {
  await page.goto(`${LAB}${path}${path.includes("?") ? "&" : "?"}grades=6-8`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector("#app h1");
};

async function audit(page, label) {
  // let the page-change fade finish so contrast is measured on the settled screen
  await page.waitForTimeout(500);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  ok(overflow <= 1, `${label}: horizontal overflow ${overflow}px`);
  const small = await page.evaluate(() => {
    const scope =
      ".city-stage, .city-step, .city-intro, .city-summary, .city-map, .city-card, .city-table-wrap, .city-building, .city-mission, .city-pips, .city-supports";
    const bad = [];
    for (const el of document.querySelectorAll("#app *")) {
      if (
        !el.closest(scope) ||
        el.closest("svg") ||
        el.closest(".visually-hidden") ||
        el.closest(".city-pin-name")
      )
        continue;
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own || !el.offsetParent) continue;
      const size = Number.parseFloat(getComputedStyle(el).fontSize);
      if (size < 15.9)
        bad.push(
          `${el.tagName.toLowerCase()}.${el.className} ${size}px "${el.textContent.trim().slice(0, 30)}"`,
        );
    }
    return bad.slice(0, 4);
  });
  ok(small.length === 0, `${label}: text under 16px: ${small.join(" | ")}`);
  const tiny = await page.evaluate(() => {
    const bad = [];
    const sel =
      ".city-pin, .city-opt, .city-tile, [data-ct-start], [data-ct-next], [data-ct-check], [data-ct-say], [data-ct-clear], [data-ct-support], [data-ct-hint], [data-ct-es], [data-ct-words], [data-ct-look], [data-ct-replay], .city-card";
    for (const el of document.querySelectorAll(sel)) {
      if (!el.offsetParent) continue;
      const r = el.getBoundingClientRect();
      if (r.height < 43.5 || r.width < 43.5)
        bad.push(`${el.className || el.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return bad.slice(0, 4);
  });
  ok(tiny.length === 0, `${label}: targets under 44px: ${tiny.join(" | ")}`);
  if (AxeBuilder) {
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    for (const v of r.violations)
      problems.push(`${label}: axe ${v.id} (${v.impact}) ${v.nodes[0]?.target?.join(" ")}`);
    checks += 1;
  }
}
const shot = (page, name) => page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true });
const ledger = (page) =>
  page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("accessPracticeLab:v1:ledger") || '{"entries":[]}');
    return raw.entries.filter((e) => e.src === "city");
  });
const cityState = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("accessPracticeLab:v1:city") || "{}"));
/** The tile numbers that spell `words`, taking repeated words from different tiles. */
const tileIdx = (step, words) => {
  const used = new Set();
  return words.map((w) => {
    const i = step.tiles.findIndex((t, k) => t === w && !used.has(k));
    used.add(i);
    return i;
  });
};
const tile = (page, i) => page.locator(`[data-ct-tile="${i}"]`);

/** Solve one step with the mouse. Returns after pressing Next. */
async function solveStep(page, step, { wrongFirst = true } = {}) {
  if (step.kind === "choose") {
    const right = step.opts.find((o) => o.id === step.answer);
    const wrong = step.opts.find((o) => o.id !== step.answer);
    if (wrongFirst) {
      await page.locator(".city-opt", { hasText: wrong.en }).first().click();
      await page.waitForSelector(".wl-feedback.is-try");
      ok(
        (await page.locator("[data-ct-next]").count()) === 0,
        `${step.id}: a wrong pick must not open the next step`,
      );
    }
    await page.locator(".city-opt", { hasText: right.en }).first().click();
    await page.waitForSelector(".wl-feedback.is-right");
  } else if (step.kind === "build") {
    for (const i of tileIdx(step, step.ok[0])) await tile(page, i).click();
    if (wrongFirst) {
      await page.locator("[data-ct-clear]").click();
      const reversed = [...step.ok[0]].reverse();
      for (const i of tileIdx(step, reversed)) await tile(page, i).click();
      await page.locator("[data-ct-check]").click();
      await page.waitForSelector(".wl-feedback.is-try");
      await page.locator("[data-ct-clear]").click();
      for (const i of tileIdx(step, step.ok[0])) await tile(page, i).click();
    }
    await page.locator("[data-ct-check]").click();
    await page.waitForSelector(".wl-feedback.is-right");
  } else {
    await page.locator("[data-ct-text]").fill(SAMPLE[step.target]);
    await page.locator("[data-ct-say]").click();
    await page.waitForSelector(".wl-feedback.is-right");
  }
  await page.locator("[data-ct-next]").click();
  await page.waitForLoadState("domcontentloaded");
}

async function startMission(page, building, mission, support) {
  await go(page, `/city/${building}/${mission}`);
  if (await page.locator("[data-ct-replay]").count())
    await page.locator("[data-ct-replay]").click();
  await page.locator(`[data-ct-support="${support}"]`).first().click();
  await page.locator("[data-ct-start]").click();
  await page.waitForSelector(".city-step");
}

/** One whole mission by mouse. Returns nothing; leaves the summary on screen. */
async function playMission(page, building, mission, support, opts = {}) {
  await startMission(page, building, mission, support);
  const m = missionOf(building, mission);
  for (const [i, step] of m.steps.entries()) {
    ok(
      (await page.locator(".city-step .eyebrow").innerText())
        .replace(/\s+/g, " ")
        .includes(`${i + 1} of ${m.steps.length}`),
      `${mission}: step ${i + 1} label`,
    );
    if (opts.afterStart && i === 0) await opts.afterStart(page);
    await solveStep(page, step, opts);
  }
  await page.waitForSelector(".city-summary");
}

/** Move keyboard focus to `locator` by pressing Tab, then return. No mouse involved. */
async function tabTo(page, locator) {
  const handle = await locator.first().elementHandle();
  assert.ok(handle, "tabTo: no such control");
  for (let i = 0; i < 160; i++) {
    if (await page.evaluate((el) => document.activeElement === el, handle)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error("tabTo: the control is not reachable with Tab");
}
const press = async (page, locator, key = "Enter") => {
  await tabTo(page, locator);
  await page.keyboard.press(key);
};

async function playWithKeyboard(page, building, mission) {
  await go(page, `/city/${building}/${mission}`);
  if (await page.locator("[data-ct-replay]").count()) {
    await press(page, page.locator("[data-ct-replay]"));
    await page.waitForSelector("[data-ct-start]");
  }
  await press(page, page.locator("[data-ct-start]"));
  await page.waitForSelector(".city-step");
  const m = missionOf(building, mission);
  for (const step of m.steps) {
    if (step.kind === "choose") {
      const right = step.opts.find((o) => o.id === step.answer);
      await press(page, page.locator(".city-opt", { hasText: right.en }), "Space");
      await page.waitForSelector(".wl-feedback.is-right");
    } else if (step.kind === "build") {
      for (const i of tileIdx(step, step.ok[0])) await press(page, tile(page, i), "Space");
      await press(page, page.locator("[data-ct-check]"));
      await page.waitForSelector(".wl-feedback.is-right");
    } else {
      await tabTo(page, page.locator("[data-ct-text]"));
      await page.keyboard.type(SAMPLE[step.target]);
      await press(page, page.locator("[data-ct-say]"));
      await page.waitForSelector(".wl-feedback.is-right");
    }
    await press(page, page.locator("[data-ct-next]"));
    await page.waitForLoadState("domcontentloaded");
  }
  await page.waitForSelector(".city-summary");
}

try {
  // ── a learner at 1440 and at 375: three missions, three supports ───────────
  for (const width of [1440, 375]) {
    const { ctx, page } = await open(width);
    await go(page, "/city");
    ok((await page.locator(".city-pin").count()) === 6, `hub ${width}: six pins on the map`);
    ok((await page.locator("h1").innerText()).includes("Language City"), `hub ${width}: title`);
    await audit(page, `hub ${width}`);
    await shot(page, `hub-${width}`);
    // the map is keyboard operable and shows a 3px focus ring
    await tabTo(page, page.locator(".city-pin").first());
    const outline = await page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.activeElement).outlineWidth),
    );
    ok(outline >= 3, `hub ${width}: focus ring ${outline}px on a pin`);
    await page.keyboard.press("Enter");
    await page.waitForSelector(".city-building");
    ok(
      page.url().includes("/city/cafe"),
      `hub ${width}: Enter on the first pin opens the café (${page.url()})`,
    );
    await audit(page, `building ${width}`);
    await shot(page, `building-${width}`);
    ok((await page.locator("a[href*='/city/cafe/']").count()) === 2, "building: two missions");

    // mission intro and each kind of step, audited
    await go(page, "/city/cafe/order-lunch");
    await audit(page, `mission intro ${width}`);
    await page.locator("[data-ct-start]").click();
    await page.waitForSelector(".city-step");
    const m = missionOf("cafe", "order-lunch");
    await audit(page, `read step ${width}`);
    await shot(page, `read-step-${width}`);
    await solveStep(page, m.steps[0]);
    await solveStep(page, m.steps[1]);
    await audit(page, `build step ${width}`);
    await page.locator(".city-tile").first().click();
    await shot(page, `build-step-${width}`);
    await page.locator("[data-ct-clear]").click();
    await solveStep(page, m.steps[2], { wrongFirst: true });
    await audit(page, `listen step ${width}`);
    await page.locator("[data-ct-words]").click();
    await page.waitForSelector(".scn-say");
    await shot(page, `listen-step-${width}`);
    await solveStep(page, m.steps[3]);
    await solveStep(page, m.steps[4]);
    await audit(page, `say step ${width}`);
    await shot(page, `say-step-${width}`);
    await solveStep(page, m.steps[5]);
    await page.waitForSelector(".city-summary");
    ok(
      (await page.locator(".city-badge").innerText()).includes("with support"),
      `listen words shown makes the run supported (${width})`,
    );
    await audit(page, `summary ${width}`);
    await shot(page, `summary-${width}`);

    // independent run: nothing opened
    await playMission(page, "library", "get-a-card", "none");
    ok(
      (await page.locator(".city-badge").innerText()).includes("on my own"),
      `independent summary (${width})`,
    );
    // word bank and frames
    await playMission(page, "clinic", "check-in", "bank", {
      afterStart: async (p) =>
        ok((await p.locator(".city-bank li").count()) >= 4, "word bank visible"),
    });
    ok(
      (await page.locator(".city-badge").innerText()).includes("with support"),
      `bank run is supported (${width})`,
    );
    await playMission(page, "station", "buy-a-pass", "frame", {
      afterStart: async (p) =>
        ok((await p.locator(".city-frame-text").count()) === 1, "sentence frame visible"),
    });

    const entries = await ledger(page);
    ok(entries.length === 4, `ledger: four city entries (${entries.length})`);
    const byTask = Object.fromEntries(entries.map((e) => [e.task, e]));
    ok(byTask["library/get-a-card"]?.stage === "independent", "ledger: library independent");
    ok(byTask["cafe/order-lunch"]?.stage === "supported", "ledger: café supported (words shown)");
    ok(
      byTask["clinic/check-in"]?.stage === "supported" &&
        byTask["clinic/check-in"].supports.bank === true,
      "ledger: clinic supported with a bank",
    );
    ok(
      byTask["station/buy-a-pass"]?.supports.frames === true,
      "ledger: station supported with frames",
    );
    ok(
      entries.every((e) => e.src === "city" && !JSON.stringify(e).includes("Thank you")),
      "ledger: ids and counts only",
    );
    const st = await cityState(page);
    ok(
      st.prog["get-a-card"].indep === 1 && st.prog["get-a-card"].supp === 0,
      "progress: library independent only",
    );
    ok(
      st.prog["order-lunch"].supp === 1 && st.prog["order-lunch"].indep === 0,
      "progress: café supported only",
    );

    // progress and teacher pages
    await go(page, "/city/progress");
    ok(
      /1 of 12 finished on my own/.test(
        (await page.locator("main, #app").first().innerText()).replace(/\s+/g, " "),
      ),
      "progress page counts",
    );
    await audit(page, `progress ${width}`);
    await shot(page, `progress-${width}`);
    await go(page, "/city/teacher");
    ok((await page.locator("table.city-table").count()) === 2, "teacher: two tables");
    await audit(page, `teacher ${width}`);
    await shot(page, `teacher-${width}`);
    // the map now shows the filled and supported dots
    await go(page, "/city");
    ok(
      (await page.locator(".city-dot.is-independent").count()) === 1 &&
        (await page.locator(".city-dot.is-supported").count()) === 3,
      "map dots: one independent, three supported",
    );
    await shot(page, `hub-progress-${width}`);
    await ctx.close();
  }

  // ── a wrong first pick is explained, never answered ────────────────────────
  {
    const { ctx, page } = await open(1440);
    await startMission(page, "market", "fresh-melon", "none");
    const step = missionOf("market", "fresh-melon").steps[0];
    const wrong = step.opts.find((o) => o.id !== step.answer);
    await page.locator(".city-opt", { hasText: wrong.en }).click();
    const text = await page.locator(".wl-feedback.is-try").innerText();
    ok(text.includes(wrong.why.en), "a wrong pick shows its own reason");
    ok(
      !text.includes(step.opts.find((o) => o.id === step.answer).en),
      "feedback does not print the right option",
    );
    await ctx.close();
  }

  // ── keyboard only: one whole mission with Tab, Space and Enter ─────────────
  {
    const { ctx, page } = await open(1440);
    await playWithKeyboard(page, "school-office", "late-pass");
    ok(
      (await ledger(page)).at(-1)?.task === "school-office/late-pass",
      "keyboard-only mission is recorded",
    );
    ok(
      (await page.locator(".city-badge").innerText()).includes("on my own"),
      "keyboard-only run is independent",
    );
    await ctx.close();
  }

  // ── a reload resumes the same step with the same support ───────────────────
  {
    const { ctx, page } = await open(375);
    await startMission(page, "market", "buy-fruit", "bank");
    const m = missionOf("market", "buy-fruit");
    await solveStep(page, m.steps[0], { wrongFirst: false });
    await solveStep(page, m.steps[1], { wrongFirst: false });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForSelector(".city-step");
    ok(
      (await page.locator(".city-step .eyebrow").innerText())
        .replace(/\s+/g, " ")
        .includes("Step 3 of 6"),
      "reload: still on step 3",
    );
    ok(
      (await page.locator(".city-bank").count()) === 1,
      "reload: the word bank is still the chosen support",
    );
    await solveStep(page, m.steps[2], { wrongFirst: false });
    await ctx.close();
  }

  // ── Spanish interface, English practice text ───────────────────────────────
  for (const width of [1440, 375]) {
    const { ctx, page } = await open(width, "es");
    await go(page, "/city");
    ok(
      (await page.locator("h1").innerText()).includes("Ciudad del lenguaje"),
      `es hub title (${width})`,
    );
    ok(
      !(await page.locator("#app").innerText()).includes("Choose your character"),
      "es hub: no English chrome",
    );
    await audit(page, `es hub ${width}`);
    await go(page, "/city/clinic/check-in");
    await page.locator("[data-ct-start]").click();
    await page.waitForSelector(".city-step");
    ok(
      (await page.locator(".city-step .eyebrow").innerText()).includes("Paso 1 de 6"),
      "es step label",
    );
    await page.locator("[data-ct-es]").click();
    ok(
      (await page.locator(".city-doc small[lang='es']").count()) >= 3,
      "Spanish help shows the sign in Spanish",
    );
    await audit(page, `es read step ${width}`);
    await shot(page, `es-read-step-${width}`);
    await go(page, "/city/teacher");
    ok(
      (await page.locator("#app").innerText()).includes("Apoyos e independencia"),
      "es teacher page",
    );
    await audit(page, `es teacher ${width}`);
    await ctx.close();
  }

  // ── 320px, 140% text, bilingual: nothing spills sideways ───────────────────
  {
    const { ctx, page } = await open(320, "bi");
    await page.addInitScript(() =>
      localStorage.setItem(
        "accessPracticeLab:v1:prefs",
        JSON.stringify({ lang: "bi", langChosen: true, band: "6-8", textSize: 1.4 }),
      ),
    );
    for (const path of [
      "/city",
      "/city/cafe",
      "/city/cafe/order-lunch",
      "/city/progress",
      "/city/teacher",
    ]) {
      await go(page, path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      ok(overflow <= 1, `${path}: 320px bilingual 140% overflow ${overflow}px`);
    }
    await ctx.close();
  }
  ok(MISSIONS.length === 12 && BUILDINGS.length === 6, "content inventory");
} finally {
  await browser.close();
  server.close();
}
if (problems.length) {
  console.error(
    `access-language-city-e2e: FAIL (${problems.length} problems, ${checks} checks)\n- ${[...new Set(problems)].join("\n- ")}`,
  );
  process.exit(1);
}
console.log(`access-language-city-e2e: PASS (${checks} checks; screenshots in ${SHOTS})`);

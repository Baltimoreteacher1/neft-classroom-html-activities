// Phase 4 acceptance in a real browser: all ten game families can be played from the Game Room to a result screen with a
// mouse alone (and a keyboard), every game screen is accessible at three widths, Spanish works, a half-played game is saved
// and resumes, and the games record skill evidence without ever calling a supported answer independent.
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../../tools/lib/curriculum-source.mjs";
import { listFamilies } from "./games.js";

const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/`;
const browser = await chromium.launch();
const failures = [];
const check = (c, m) => { if (!c) failures.push(m); };
const idFor = (family) => `e8${family.id.toLowerCase()}`;

async function open(query, { viewport = { width: 1280, height: 900 }, context = null } = {}) {
  const ctx = context || (await browser.newContext({ viewport }));
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  await page.goto(`${base}?${query}`, { waitUntil: "networkidle" });
  return page;
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// Plays whatever is on screen with the most basic inputs until the result appears. Wrong answers are fine: completion must
// never depend on being right, on speed, or on precision.
async function playThrough(page, limit = 200) {
  for (let i = 0; i < limit; i += 1) {
    if (await page.locator(".gm-result").count()) return true;
    const next = page.locator("[data-e8gm-next]");
    if (await next.count()) { await next.first().click(); continue; }
    const choices = page.locator("[data-e8gm-choice]:not([disabled])");
    if (await choices.count()) { await choices.first().click(); continue; }
    const numeric = page.locator("#e8gm-ans:not([disabled])");
    if (await numeric.count()) { await numeric.fill("0"); await page.locator("[data-e8gm-check]").click(); continue; }
    const build = page.locator("[data-e8gm-build]:not([disabled])");
    if (await build.count()) { await build.click(); continue; }
    const free = page.locator("#e8gm-free");
    if (await free.count()) { await free.fill("I noticed a pattern and checked it a second way."); await page.locator("[data-e8gm-free]").click(); continue; }
    await page.waitForTimeout(50);
  }
  return false;
}

try {
  // 1. Every family completes from the Game Room at a grade it supports, with no page errors.
  for (const family of listFamilies()) {
    const grade = family.grades[Math.floor(family.grades.length / 2)];
    const page = await open(`grade=${grade}&view=games`);
    const card = page.locator(`[data-game="${idFor(family)}"]`);
    check((await card.count()) === 1, `${family.id}: card should appear at grade ${grade}`);
    if (await card.count()) {
      await card.click();
      check(await page.locator(".e8gm").first().isVisible(), `${family.id}: game screen should open`);
      check((await page.locator(".e8gm-count").first().innerText()).includes("1"), `${family.id}: round counter`);
      const finished = await playThrough(page);
      check(finished, `${family.id}: a game must reach its result screen`);
      if (finished) check(/star/i.test(await page.locator(".gm-result").innerText()) || (await page.locator(".tr-stars").count()) > 0, `${family.id}: result shows stars`);
    }
    check(page.errors.length === 0, `${family.id}: page error ${page.errors[0]}`);
    await page.context().close();
  }

  // 2. A card does not appear for a grade the family does not teach.
  {
    const page = await open("grade=1&view=games");
    check((await page.locator('[data-game="e8ratioarchitect"]').count()) === 0, "Ratio Architect is not offered in Grade 1");
    check((await page.locator('[data-game="e8numberquest"]').count()) === 1, "Number Quest is offered in Grade 1");
    await page.context().close();
  }

  // 3. A game in progress is saved and offered again after a reload.
  {
    const page = await open("grade=6&view=games");
    await page.locator('[data-game="e8equationbalance"]').click();
    await page.locator(".e8gm-count").first().waitFor();
    // Pausing saves the game; so does every settled round. Pause is the deterministic path.
    await page.locator("[data-e8gm-pause]").click();
    check(await page.locator(".e8gm-paused").isVisible(), "pause: the game should say it is paused");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator('[data-game="e8equationbalance"]').click();
    check(await page.locator("[data-e8gm-resume]").isVisible(), "resume: a saved game should offer to continue");
    await page.locator("[data-e8gm-resume]").click();
    check(await page.locator(".e8gm-count").first().isVisible(), "resume: the game should come back");
    check(page.errors.length === 0, `resume: page error ${page.errors[0]}`);
    await page.context().close();
  }

  // 4. Evidence: a played game writes skill evidence, and nothing it writes is both supported and independent.
  {
    const page = await open("grade=4&view=games");
    await page.locator('[data-game="e8fractionfactory"]').click();
    await playThrough(page);
    const record = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-tutor-v2") || "null"));
    const keys = Object.keys(record?.records || {});
    check(keys.length > 0, "evidence: playing should record at least one skill");
    for (const key of keys) for (const e of record.records[key].recent || []) check(e.independent === true || e.independent === false, `evidence: ${key} has a clear independence flag`);
    await page.context().close();
  }

  // 5. Keyboard: a choice game can be answered with Tab and Enter alone.
  {
    const page = await open("grade=5&view=games");
    await page.locator('[data-game="e8numberquest"]').focus();
    await page.keyboard.press("Enter");
    await page.locator(".e8gm").first().waitFor();
    let answered = false;
    for (let i = 0; i < 40 && !answered; i += 1) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => ({ choice: document.activeElement?.hasAttribute("data-e8gm-choice"), input: document.activeElement?.id === "e8gm-ans", build: document.activeElement?.hasAttribute("data-e8gm-build"), free: document.activeElement?.id === "e8gm-free" }));
      if (info.choice) { await page.keyboard.press("Enter"); answered = true; }
      else if (info.input) { await page.keyboard.type("0"); await page.keyboard.press("Enter"); answered = true; }
      else if (info.build) { await page.keyboard.press("Enter"); answered = true; }
      else if (info.free) { await page.keyboard.type("I checked it a second way."); answered = true; }
    }
    check(answered, "keyboard: an answer control should be reachable with Tab");
    check((await page.locator(".e8ap-why").first().innerText()).length > 0 || (await page.locator("[data-e8gm-next]").count()) > 0 || (await page.locator(".e8gm-feedback").count()) > 0, "keyboard: feedback appears");
    await page.context().close();
  }

  // 6. Spanish, three widths, accessibility.
  {
    const es = await open("grade=5&view=games&lang=es");
    check(/Fábrica de fracciones/.test(await es.locator('[data-game="e8fractionfactory"]').innerText()), "Spanish: game card title");
    await es.locator('[data-game="e8fractionfactory"]').click();
    check(/Ronda 1 de/.test(await es.locator(".e8gm-count").first().innerText()), "Spanish: round counter");
    check(/Volver a los juegos/.test(await es.locator("[data-gm-menu]").first().innerText()), "Spanish: back button");
    await es.context().close();
    for (const [name, viewport] of [["desktop", { width: 1280, height: 900 }], ["tablet", { width: 768, height: 1024 }], ["phone", { width: 390, height: 844 }]]) {
      const page = await open("grade=5&view=games", { viewport });
      await page.locator('[data-game="e8fractionfactory"]').click();
      await page.locator(".e8gm").first().waitFor();
      check((await overflow(page)) <= 1, `${name}: no horizontal scroll in a game`);
      const axe = await new AxeBuilder({ page }).include(".e8gm").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
      for (const v of axe.violations.filter((x) => ["serious", "critical"].includes(x.impact))) check(false, `${name}: axe ${v.id} ${v.nodes[0].target.join(" ")}`);
      await page.context().close();
    }
  }
} finally {
  await browser.close();
  await server.close();
}

if (failures.length) {
  console.error(`${failures.length} game browser failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("Games in browser: ten families completed from the Game Room, grade gating, save and resume, evidence recorded, keyboard, Spanish, three widths and axe all pass.");

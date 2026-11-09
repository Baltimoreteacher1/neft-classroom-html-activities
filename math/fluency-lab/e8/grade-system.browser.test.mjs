// Phase 1 acceptance in a real browser: each grade's home, practice, feedback and progress screens at desktop,
// tablet and phone width. Checks identity attributes, no horizontal clipping, target sizes, reduced motion,
// 200% zoom reflow and axe (serious/critical). Set E8_SHOTS=/dir to keep screenshots.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../../tools/lib/curriculum-source.mjs";
import { ALL_SKILLS } from "../problem-bank.js";
import { GRADE_SYSTEM } from "./grade-system.js";

const shots = process.env.E8_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, tablet: { width: 768, height: 1024 }, phone: { width: 390, height: 844 } };
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/`;
const browser = await chromium.launch();
const failures = [];
const fail = (message) => failures.push(message);

async function open(url, viewport, extra = {}) {
  const context = await browser.newContext({ viewport, ...extra });
  const page = await context.newPage();
  page.errors = [];
  page.on("pageerror", (error) => page.errors.push(error.message));
  await context.addInitScript(() => {
    localStorage.setItem("ewl-fluency-tour-seen", "1");
    // This test types answers; listening mode (on by default for Kindergarten to Grade 2) has its own tests.
    localStorage.setItem("ewl-fluency-settings-v1", JSON.stringify({ audioFirst: "off" }));
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  return page;
}

const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
async function axe(page, tag, include) {
  const builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]);
  if (include) builder.include(include);
  const results = await builder.analyze();
  for (const violation of results.violations.filter((v) => ["serious", "critical"].includes(v.impact)))
    fail(`${tag}: axe ${violation.id} (${violation.impact}) ${violation.nodes[0].target.join(" ")}`);
}

try {
  for (const grade of Object.keys(GRADE_SYSTEM).map(Number)) {
    const skill = ALL_SKILLS.find((candidate) => candidate.grade === grade);
    for (const [name, viewport] of Object.entries(VIEWPORTS)) {
      const tag = `grade ${grade} ${name}`;
      // Home: identity and layout.
      const home = await open(`${base}?grade=${grade}`, viewport);
      const attrs = await home.evaluate(() => ({ ...document.documentElement.dataset }));
      if (attrs.gradeSystem !== String(grade)) fail(`${tag}: data-grade-system is ${attrs.gradeSystem}`);
      if (attrs.gsHeader !== GRADE_SYSTEM[grade].header) fail(`${tag}: header ${attrs.gsHeader}`);
      // The grade home's identity is the studio hero: a kicker naming the grade and its interactive scene.
      const hero = home.locator(".at-hero");
      if (!(await hero.isVisible())) fail(`${tag}: hero missing`);
      else if (!(await hero.locator(".at-sculpture svg[role=img]").count())) fail(`${tag}: hero scene missing`);
      else if (!(await home.locator("#at-kicker").textContent()).includes(grade === 0 ? "Kindergarten" : String(grade))) fail(`${tag}: hero does not name the grade`);
      if ((await overflow(home)) > 1) fail(`${tag}: horizontal overflow on home`);
      if (shots) await home.screenshot({ path: `${shots}/g${grade}-${name}-home.png` });
      if (name === "desktop") await axe(home, `${tag} home`, ".at-hero, #hub-tabs, #grade-tabs");
      if (home.errors.length) fail(`${tag}: page errors ${home.errors[0]}`);
      await home.context().close();

      // Practice, wrong answer and feedback.
      const practice = await open(`${base}?grade=${grade}&skill=${grade}:${skill.id}&start=practice`, viewport);
      const input = practice.locator("#answer-input");
      await input.waitFor({ state: "visible", timeout: 8000 }).catch(() => fail(`${tag}: answer input missing`));
      const check = practice.locator("#check-answer");
      const box = await check.boundingBox();
      const need = GRADE_SYSTEM[grade].targetPx;
      if (!box || box.height < need - 1) fail(`${tag}: Check button ${box?.height}px, needs ${need}px`);
      await input.fill("987654");
      await check.click();
      await practice.waitForTimeout(500);
      const feedback = practice.locator(".feedback, [data-feedback], #feedback").first();
      if (!(await feedback.isVisible().catch(() => false))) fail(`${tag}: feedback not shown after a wrong answer`);
      if ((await overflow(practice)) > 1) fail(`${tag}: horizontal overflow in practice`);
      if (shots) await practice.screenshot({ path: `${shots}/g${grade}-${name}-feedback.png` });
      if (name === "phone") await axe(practice, `${tag} practice`);
      await practice.context().close();

      // Progress view.
      const path = await open(`${base}?grade=${grade}&view=path`, viewport);
      if ((await overflow(path)) > 1) fail(`${tag}: horizontal overflow in progress`);
      if (shots) await path.screenshot({ path: `${shots}/g${grade}-${name}-progress.png` });
      await path.context().close();
    }
  }

  // Reduced motion: no running animations on the grade 1 feedback and banner.
  const calm = await open(`${base}?grade=1`, VIEWPORTS.desktop, { reducedMotion: "reduce" });
  const running = await calm.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  if (running) fail(`reduced motion: ${running} animation(s) still running`);
  await calm.context().close();

  // 200% zoom is a 720px-wide viewport at the same DPR; the layout must reflow without clipping.
  for (const grade of [1, 4, 8]) {
    const zoomed = await open(`${base}?grade=${grade}`, { width: 720, height: 450 });
    if ((await overflow(zoomed)) > 1) fail(`grade ${grade} 200% zoom: horizontal overflow`);
    await zoomed.context().close();
  }
} finally {
  await browser.close();
  await server.close();
}

if (failures.length) {
  console.error(`${failures.length} Enterprise 8 grade-system browser failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("Enterprise 8 grade system in browser: 8 grades x 3 viewports (home, practice feedback, progress), zoom and reduced motion passed.");

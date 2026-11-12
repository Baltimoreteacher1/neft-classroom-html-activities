// The student home, driven the way a learner drives it: a new learner and a returning learner, Continue learning,
// the keyboard alone through the sections and the skill map, English and Spanish, axe, three widths, a clean console.
// Screenshots: set DASHBOARD_SHOTS=/tmp/some-dir.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null, setItem() {}, removeItem() {} } });
Object.defineProperty(globalThis, "window", { configurable: true, value: globalThis });
const lab = new URL("./", import.meta.url);
const { emptyTutor, findSkill, localDay, recordAnswer } = await import(new URL("tutor-engine.js", lab));

const shots = process.env.DASHBOARD_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const DAY = 86400000;

// A returning learner built through the real recordAnswer, with times relative to now so the browser agrees.
function returningLearner(now = Date.now()) {
  const tutor = emptyTutor();
  const at = (daysAgo, hour = 10) => { const d = new Date(now); d.setDate(d.getDate() - daysAgo); d.setHours(hour, 0, 0, 0); return d.getTime(); };
  const add = (key, rows) => { for (const [daysAgo, correct, independent = true, level = 1] of rows) recordAnswer(tutor, findSkill(key), { correct, independent, level }, at(daysAgo)); };
  const strong = (d) => [[d + 2, true], [d + 2, true], [d + 1, true], [d + 1, true], [d, true], [d, true], [d, true], [d, true]];
  add("4:place-million", strong(20));
  add("4:round-large", [[1, true], [1, true], [0, true], [0, true], [0, true]]);
  add("4:add-large", [[5, true], [4, false], [3, true], [2, false], [1, true]]);
  add("4:division", [[6, false], [5, false], [4, true], [3, false], [2, false]]);
  add("4:subtract-large", [[1, true, false, 0], [0, true, false, 0]]);
  for (const key of ["4:fraction-equiv", "4:fraction-compare"]) add(key, [[5, true, true, 2], [5, true, true, 2], [4, true, true, 2], [4, true, true, 2], [3, true, true, 2], [3, true, true, 2], [2, true, true, 2], [1, true, true, 2]]);
  tutor.mistakes.push({ id: "m1", key: "4:division", question: "84 ÷ 7 = ?", submitted: "77", explanation: "", hint: "", category: "addedInsteadOfDividing", at: at(2), resolvedAt: null });
  const days = [0, 1, 2, 4, 5].map((n) => localDay(at(n)));
  return { tutor, rewards: { days, plays: 4, goal: 3 } };
}

const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/lab.html`;
let browser;
const problems = [];
// hub: the grade page shows one section at a time; the structural checks below look at every section, so
// they open it with hub "all" (no panel rule matches it). Pass hub: null to test the real one-at-a-time behaviour.
async function open({ width = 1280, height = 900, seed = null, query = "?grade=4", hub = "all" } = {}) {
  const context = await browser.newContext({ viewport: { width, height } });
  if (seed)
    await context.addInitScript((data) => {
      if (localStorage.getItem("fl4-seeded")) return;
      localStorage.setItem("fl4-seeded", "1");
      localStorage.setItem("ewl-fluency-tutor-v2", JSON.stringify(data.tutor));
      localStorage.setItem("ewl-fluency-rewards-v1", JSON.stringify(data.rewards));
      localStorage.setItem("ewl-fluency-settings-v1:grade", "4");
    }, seed);
  const page = await context.newPage();
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") problems.push(`console: ${message.text()}`); });
  await page.goto(`${base}${query}`, { waitUntil: "networkidle" });
  if (hub) await page.evaluate((value) => { document.querySelector("#library-view").dataset.hub = value; }, hub);
  return { page, context };
}
const shot = async (page, name, locator = null) => {
  if (!shots) return;
  if (locator) await page.locator(locator).first().screenshot({ path: `${shots}/${name}.png` });
  else await page.screenshot({ path: `${shots}/${name}.png`, fullPage: true });
};
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const dash = (page) => page.locator("#personal-dashboard");

try {
  browser = await chromium.launch({ headless: true });

  // ---------- New learner ----------
  {
    const { page, context } = await open();
    await page.getByRole("heading", { name: "Welcome. Here is your first step." }).waitFor();
    const hero = page.locator(".fl4-hero");
    assert.equal(await hero.locator("[data-open-key]").count(), 1, "a new learner gets a real first step");
    assert.equal(await page.locator('.fl4-rec[data-section="learnNext"] .fl4-card').count(), 3, "three new skills to start with");
    for (const id of ["fixAGap", "review", "keepPracticing", "readyToMaster", "challenge"]) assert.equal(await page.locator(`.fl4-rec[data-section="${id}"]`).count(), 0, `no empty ${id} section`);
    assert.equal(await page.locator(".fl4-steps li").count(), 3, "onboarding shows three steps");
    assert.equal(await page.locator(".fl4-reminder").count(), 0, "no reminder before anything is due");
    assert.match(await dash(page).innerText(), /Practice today to start/, "empty streak invites the first day");
    assert.equal(await page.locator(".fl4-ring svg[role=img]").first().getAttribute("role"), "img");
    assert.match(await page.locator(".fl4-ring svg[role=img]").first().getAttribute("aria-label"), /^New\. No score yet\.$/);
    for (const width of [1280, 820, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await overflow(page), 0, `new learner: no sideways scroll at ${width}px`);
      await shot(page, `new-learner-${width}`);
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    // Continue learning opens the first step in the picture lesson.
    const title = await page.locator(".fl4-hero__skill").innerText();
    await page.getByRole("button", { name: /^Continue learning/ }).click();
    await page.locator("#workspace-view").waitFor({ state: "visible" });
    assert.equal(await page.locator("#workspace-title").innerText(), title, "Continue learning opens the skill it named");
    assert.equal(await page.locator('#mode-tabs [data-mode="visual"]').getAttribute("aria-selected"), "true", "a new skill opens as a picture lesson");
    await page.locator("#back-library").click();
    await page.getByRole("heading", { name: "Welcome. Here is your first step." }).waitFor();
    await page.locator("#daily-ten").click();
    await page.locator("#workspace-view").waitFor({ state: "visible" });
    assert.match(await page.locator("#session-type").innerText(), /Today’s 10|Today's 10/);
    assert.match(await page.locator("#session-insight").innerText(), /Build confidence|Explore something new/);
    await context.close();
  }

  // ---------- Returning learner ----------
  const seed = returningLearner();
  {
    const { page, context } = await open({ seed });
    await page.getByRole("heading", { name: "Continue learning", level: 2 }).waitFor();
    const sections = await page.locator(".fl4-rec").evaluateAll((nodes) => nodes.map((n) => n.dataset.section));
    for (const id of ["fixAGap", "review", "readyToMaster", "keepPracticing", "challenge"]) assert.ok(sections.includes(id), `returning learner sees ${id}: ${sections}`);
    assert.equal(sections[0], "fixAGap", "gaps come first");
    // Every reason is plain language that cites the learner's own numbers.
    const gap = page.locator('.fl4-rec[data-section="fixAGap"] .fl4-card').first();
    assert.match(await gap.locator(".fl4-why").innerText(), /You solved 1 of 5 on your own, last on|You solved 1 of 5 on your own, last (today|yesterday|\d+ days ago)/);
    assert.match(await gap.locator(".fl4-why").innerText(), /One mistake is still open/);
    assert.match(await gap.locator(".fl4-basis").innerText(), /answers/i);
    assert.match(await page.locator(".fl4-reminder").innerText(), /skill ready for a memory refresh|skills ready for a memory refresh/);
    // State is told by a word, a shape and a ring score, not by colour.
    const states = await page.locator(".fl4-ring").evaluateAll((nodes) => [...new Set(nodes.map((n) => n.dataset.state))]);
    assert.ok(states.length >= 3, `several states visible: ${states}`);
    for (const ring of await page.locator(".fl4-rec .fl4-ring").all()) {
      assert.match((await ring.locator("svg[role=img]").getAttribute("aria-label")) || "", /Mastery score \d+ out of 100|No score yet/);
      assert.ok((await ring.locator(".fl4-ring__word").innerText()).trim().length > 2, "a state word is printed");
      assert.equal(await ring.locator(".fl4-ring__word .fl4-glyph").count(), 1, "a state shape is drawn");
    }
    assert.equal(await page.locator(".fl4-week li").count(), 7, "seven-day streak strip");
    assert.equal(await page.locator('.fl4-week li[data-on="true"]').count(), 5, "days 0, 1, 2, 4 and 5 are marked as practiced");
    assert.match(await page.locator(".fl4-big").innerText(), /^3$/, "streak counts today, yesterday and the day before");
    for (const width of [1280, 820, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await overflow(page), 0, `returning learner: no sideways scroll at ${width}px`);
      for (const control of await page.locator("#personal-dashboard button, #personal-dashboard a").all()) {
        if (!(await control.isVisible())) continue;
        const box = await control.boundingBox();
        assert.ok(box.height >= 43.5, `44px target at ${width}px: ${await control.innerText()} (${box.height})`);
      }
      await shot(page, `returning-learner-${width}`);
      await shot(page, `skill-map-${width}`, ".fl4-map");
      await shot(page, `card-${width}`, ".fl4-rec .fl4-card");
    }
    await page.setViewportSize({ width: 1280, height: 900 });

    // axe on the dashboard itself.
    const result = await new AxeBuilder({ page }).include("#personal-dashboard").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const serious = result.violations.filter((violation) => ["serious", "critical"].includes(violation.impact));
    assert.deepEqual(serious.map((v) => `${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`), [], "axe: no serious or critical violations");

    // Role queries: headings never skip a level, every control and progress bar has a name.
    const levels = await dash(page).locator("h2, h3, h4").evaluateAll((nodes) => nodes.map((n) => Number(n.tagName[1])));
    levels.reduce((previous, level) => { assert.ok(level <= previous + 1, `heading levels ${levels} skip a level`); return level; }, 2);
    for (const bar of await page.getByRole("progressbar").all()) assert.ok(((await bar.getAttribute("aria-label")) || "").length > 3, "progress bars are named");
    for (const button of await dash(page).getByRole("button").all()) assert.ok(((await button.innerText()).trim() || (await button.getAttribute("aria-label")) || "").length > 1, "buttons have names");
    assert.ok((await page.getByRole("img").count()) >= 1);

    // Continue learning opens the same skill (a gap opens guided practice).
    const hero = await page.locator(".fl4-hero__skill").innerText();
    await page.getByRole("button", { name: /^Continue learning/ }).click();
    assert.equal(await page.locator("#workspace-title").innerText(), hero);
    assert.equal(await page.locator('#mode-tabs [aria-selected="true"]').getAttribute("data-mode"), "guided");
    // Save and resume: leaving mid-session offers the saved practice from the same button.
    await page.locator("#back-library").click();
    await page.locator("[data-resume-practice]").first().waitFor();
    assert.match(await page.locator(".fl4-hero__why").innerText(), /already completed\. Your work is saved on this device\./);
    await page.locator("[data-resume-practice]").first().click();
    await page.locator("#drill-panel").waitFor({ state: "visible" });
    assert.equal(await page.locator("#workspace-title").innerText(), hero, "resume returns to the saved skill");
    await page.locator("#back-library").click();
    await page.locator(".fl4-hero").waitFor();
    await context.close();
  }

  // ---------- Keyboard only ----------
  {
    const { page, context } = await open({ seed });
    await page.getByRole("heading", { name: "Continue learning", level: 2 }).waitFor();
    // Tab reaches Continue learning, every recommendation action, then the map.
    const reached = new Set();
    let onMap = false;
    for (let i = 0; i < 160 && !onMap; i += 1) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        return { text: (el?.textContent || "").trim().slice(0, 40), inHero: Boolean(el?.closest(".fl4-hero")), card: el?.closest(".fl4-rec")?.dataset.section || "", map: Boolean(el?.closest(".fl4-map")), focusVisible: el?.matches(":focus-visible") };
      });
      if (info.inHero) reached.add("hero");
      if (info.card) reached.add(info.card);
      if (info.map) onMap = true;
    }
    assert.ok(reached.has("hero"), "Tab reaches Continue learning");
    for (const id of ["fixAGap", "review", "readyToMaster", "keepPracticing", "challenge"]) assert.ok(reached.has(id), `Tab reaches ${id}`);
    assert.ok(onMap, "Tab reaches the skill map");
    assert.equal(await page.locator('.fl4-node[tabindex="0"]').count(), 1, "the map is a single Tab stop");
    // Arrow keys move through the map; focus is visible; Enter opens the skill.
    const key = () => page.evaluate(() => document.activeElement?.dataset.key);
    const start = await key();
    const seen = new Set([start]);
    for (const arrow of ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"]) {
      await page.keyboard.press(arrow);
      seen.add(await key());
    }
    assert.ok(seen.size >= 3, `arrow keys move between skills: ${[...seen]}`);
    assert.equal(await page.locator('.fl4-node[tabindex="0"]').count(), 1, "roving tabindex keeps one stop");
    const outline = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.boxShadow !== "none" || s.outlineStyle !== "none"; });
    assert.ok(outline, "the focused node has a visible focus ring");
    await page.keyboard.press("Home");
    const first = await key();
    await page.keyboard.press("End");
    assert.notEqual(await key(), first);
    const label = await page.evaluate(() => document.activeElement.querySelector(".fl4-node__title").textContent.trim());
    await page.keyboard.press("Enter");
    await page.locator("#workspace-view").waitFor({ state: "visible" });
    assert.equal(await page.locator("#workspace-title").innerText(), label, "Enter opens the focused skill");
    await context.close();
  }

  // ---------- Skill map ----------
  {
    const { page, context } = await open({ seed });
    const nodes = page.locator(".fl4-node");
    assert.ok((await nodes.count()) >= 11, "every grade skill is on the map");
    assert.ok((await page.locator("path.fl4-edge[data-from]").count()) >= 5, "prerequisite links are drawn");
    assert.ok((await page.locator('path.fl4-edge[data-unlocked="true"]').count()) >= 1 && (await page.locator('path.fl4-edge[data-unlocked="false"]').count()) >= 1, "solid and dashed links both appear");
    for (const state of ["new", "developing", "mastered"]) assert.ok((await page.locator(`.fl4-node[data-state="${state}"]`).count()) >= 1, `map shows ${state}`);
    for (const node of await nodes.all()) {
      const name = (await node.getAttribute("aria-label")) || "";
      assert.match(name, /Mastery score \d+ out of 100|No score yet/, `node name includes its state: ${name}`);
      assert.ok((await node.locator(".fl4-node__state .fl4-glyph").count()) === 1 && (await node.locator(".fl4-node__state").innerText()).trim().length > 2, "state shown by shape and word");
    }
    await nodes.first().hover();
    await context.close();
  }

  // ---------- Grade hub: one section at a time ----------
  {
    const { page, context } = await open({ seed, hub: null });
    const visible = (selector) => page.locator(selector).first().isVisible();
    const expectOnly = async (tab, shown) => {
      const all = { today: ".fl4-hero", skills: "#skill-grid", trail: "#trail-view", map: ".fl4-pathway", rewards: ".fl4-rewards" };
      for (const [name, selector] of Object.entries(all)) assert.equal(await visible(selector), name === shown, `${tab}: ${name} section ${name === shown ? "is" : "is not"} shown`);
    };
    await expectOnly("default", "today");
    for (const tab of ["skills", "trail", "map", "rewards", "today"]) {
      await page.locator(`[data-hub-tab="${tab}"]`).click();
      assert.equal(await page.locator(`[data-hub-tab="${tab}"]`).getAttribute("aria-selected"), "true");
      await expectOnly(tab, tab);
    }
    await page.locator('[data-hub-tab="today"]').focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => document.activeElement.dataset.hubTab), "skills", "arrow keys move between sections");
    assert.equal(await page.evaluate(() => document.querySelector("#library-view").dataset.hub), "skills");
    await page.locator("[data-fl4-strand]").nth(1).click();
    assert.equal(await page.evaluate(() => document.querySelector("#library-view").dataset.hub), "skills", "choosing a strand keeps the Skills section open");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(await page.evaluate(() => document.querySelector("#library-view").dataset.hub), "skills", "the open section is remembered for this visit");
    await context.close();
  }

  // ---------- Español ----------
  {
    const { page, context } = await open({ seed });
    await page.locator("#lang-toggle").click();
    await page.getByRole("heading", { name: /Continúa aprendiendo/, level: 2 }).first().waitFor();
    const text = await dash(page).innerText();
    assert.doesNotMatch(text, /Learn Next|Fix a Gap|Keep Practicing|Ready to Master|Your next steps|You solved|Find your way|Your streak|skill map/, "no English template text on a Spanish screen");
    assert.match(text, /Cierra un vacío/);
    assert.match(text, /Resolviste 1 de 5 por tu cuenta/);
    assert.match(await page.locator(".fl4-ring svg[role=img]").first().getAttribute("aria-label"), /Puntaje de dominio|Todavía no hay puntaje/);
    assert.equal(await overflow(page), 0);
    await page.setViewportSize({ width: 390, height: 900 });
    assert.equal(await overflow(page), 0, "Spanish: no sideways scroll at 390px");
    await shot(page, "returning-learner-es-390");
    await context.close();
    const fresh = await open({ query: "?grade=4&lang=es" });
    await fresh.page.getByRole("heading", { name: /Te damos la bienvenida/ }).waitFor();
    await fresh.context.close();
  }

  // ---------- Existing routes and library survive ----------
  {
    const { page, context } = await open({ query: "?grade=4&skill=division" });
    assert.equal(await page.locator("#workspace-title").innerText(), "Whole-number division", "?skill= still deep-links");
    await context.close();
    const checkup = await open({ query: "?grade=4&start=checkup" });
    assert.equal(await checkup.page.locator("#workspace-title").innerText(), "Find my starting point", "?start=checkup still starts the checkup");
    await checkup.context.close();
    const games = await open({ query: "?grade=4&view=games" });
    await games.page.locator("#games-view").waitFor({ state: "visible" });
    await games.context.close();
    const library = await open({ seed });
    // The grade row at the top and the strand tiles drive the existing library.
    await library.page.locator('#grade-tabs [data-grade="6"]').click();
    assert.match(await library.page.locator(".fl4-hero [class*=overline]").first().innerText(), /Grade 6/i);
    // The grade page shows one section at a time; strands and the skill grid live on the Skills tab.
    await library.page.locator('[data-hub-tab="skills"]').click();
    await library.page.locator("#grade-heading").filter({ hasText: "Grade 6" }).waitFor();
    await library.page.locator("[data-fl4-strand]").nth(1).click();
    assert.equal(await library.page.locator("#strand-filters [aria-pressed='true']").count(), 1);
    assert.ok((await library.page.locator("#skill-grid .fl4-skill").count()) >= 1, "the library grid uses the new cards");
    await library.page.locator("#skill-grid .open-skill").first().click();
    await library.page.locator("#workspace-view").waitFor({ state: "visible" });
    await library.context.close();
  }

  assert.deepEqual(problems, [], `console and page errors: ${problems.join("; ")}`);
  console.log("dashboard browser test passed");
} finally {
  await browser?.close();
  await server.close();
}

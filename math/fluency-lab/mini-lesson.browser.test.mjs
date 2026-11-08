// The mini-lesson in a real browser: Learn It, Watch It, Try It, Explain It for four representative skills (a Grade 1
// add, fractions, ratios, equations), by mouse and by keyboard only, in English and Español. Also: a wrong answer
// gets a hint and a revision, results are SUPPORTED evidence only, the position resumes, the 390px layout does not
// scroll sideways, targets are 44px, and the console stays clean.
// Screenshots: MINI_SHOTS=/tmp/mini-shots node math/fluency-lab/mini-lesson.browser.test.mjs
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";
import { solve } from "../../tools/lib/mini-lesson-solver.mjs";
import { kidLearnFor } from "./kid-learn.js";

const shots = process.env.MINI_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const SKILLS = [
  { grade: 1, id: "add-10", label: "k3-add" },
  { grade: 5, id: "fraction-add", label: "fractions" },
  { grade: 6, id: "ratios", label: "ratios" },
  { grade: 7, id: "equations", label: "equations" },
];
const NAMES = { en: ["Learn It", "Watch It", "Try It", "Explain It"], es: ["Apréndelo", "Míralo", "Pruébalo", "Explícalo"] };
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;

const answerText = (found) => (typeof found === "string" ? found : found.d === 1n ? String(found.n) : `${found.n}/${found.d}`);
const openSupport = async (page) => {
  const summary = page.locator(".learn-support > summary");
  if (!(await summary.evaluate((node) => node.parentElement.open))) await summary.click();
};

// Every action goes through here, so "keyboard" runs never call click(): Tab until the control has focus, then Enter.
function driver(page, mode) {
  const focusByTab = async (selector) => {
    await page.evaluate(() => document.querySelector(".ml-stage").focus());
    for (let i = 0; i < 200; i += 1) {
      if (await page.evaluate((sel) => document.activeElement?.matches(sel), selector)) return;
      await page.keyboard.press("Tab");
    }
    throw new Error(`Tab never reached ${selector}`);
  };
  return {
    async press(selector) {
      if (mode === "mouse") return page.locator(selector).first().click();
      await focusByTab(selector);
      await page.keyboard.press("Enter");
    },
    async type(selector, text) {
      if (mode === "mouse") return page.locator(selector).first().fill(text);
      await focusByTab(selector);
      await page.keyboard.press("ControlOrMeta+a");
      await page.keyboard.type(text);
    },
    async submit(selector, text) {
      await this.type(selector, text);
      await page.keyboard.press("Enter");
    },
  };
}

async function noSideways(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 0, `${label}: no sideways scroll (${overflow}px over)`);
}
async function targets(page, label) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll(".ml button, .ml input:not([type=radio]), .ml textarea")]
      .filter((node) => node.offsetParent !== null)
      .map((node) => ({ name: (node.textContent || node.name || "").trim().slice(0, 30), box: node.getBoundingClientRect() }))
      .filter(({ box }) => box.height < 43.5 || box.width < 43.5)
      .map(({ name, box }) => `${name} ${Math.round(box.width)}x${Math.round(box.height)}`),
  );
  assert.deepEqual(small, [], `${label}: every control is at least 44px`);
}

async function walk(browser, { grade, id, label }, { lang, mode, width = 1280, shoot = false }) {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 } });
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (message) => message.type() === "error" && problems.push(`console: ${message.text()}`));
  const tag = `${label}/${lang}/${mode}/${width}`;
  const shot = async (name) => shoot && shots && (await page.locator(".ml").screenshot({ path: `${shots}/${label}-${lang}-${width}-${name}.png` }));
  const ui = driver(page, mode);
  const url = `${base}/math/fluency-lab/?grade=${grade}&skill=${id}&mini=1&lang=${lang}&profile=0`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.locator(".ml").waitFor();
  await page.locator(".ml-stage").evaluate((node) => node.scrollIntoView());

  // Four labelled progress dots, one current.
  const dots = await page.locator(".ml-dot").evaluateAll((nodes) => nodes.map((node) => ({ text: node.querySelector(".ml-dot-label").textContent, label: node.getAttribute("aria-label"), current: node.getAttribute("aria-current") })));
  assert.deepEqual(dots.map((dot) => dot.text), NAMES[lang], `${tag}: dots are labelled`);
  assert.equal(dots.filter((dot) => dot.current === "step").length, 1, `${tag}: one current step`);
  assert.match(dots[0].label, lang === "es" ? /^Paso 1 de 4/ : /^Step 1 of 4/, `${tag}: dot has a full name`);
  await noSideways(page, `${tag} learn`);
  await targets(page, `${tag} learn`);

  // Learn It: the worked example opens one step at a time and ends on the answer.
  assert.equal(await page.locator(".ml-answer").isHidden(), true, `${tag}: the answer waits for the last step`);
  const idea = await page.locator(".ml-idea").first().innerText();
  assert.ok(idea.length > 10, `${tag}: the idea is plain text`);
  const row = kidLearnFor({ id, grade }, grade);
  assert.equal(idea, row.idea[lang], `${tag}: the idea is the plain-word line in ${lang}`);
  await shot("1-learn");
  await ui.press("[data-all]");
  await page.locator(".ml-answer").waitFor({ state: "visible" });
  assert.ok((await page.locator(".ml-word").count()) >= 2, `${tag}: word cards`);
  await shot("1-learn-done");

  // Watch It: step through to the end.
  await ui.press("[data-next]");
  await page.locator(".ml-film").waitFor();
  assert.match(await page.locator(".ml-film-count").innerText(), lang === "es" ? /^Paso 1 de/ : /^Step 1 of/);
  await noSideways(page, `${tag} watch`);
  await shot("2-watch");
  while (await page.locator(".ml-film [data-film-next]").isEnabled()) await ui.press(".ml-film [data-film-next]");
  assert.ok(await page.locator(".ml-film-final").isVisible(), `${tag}: the last step shows the answer line`);
  await shot("2-watch-end");

  // Try It: a wrong answer first (hint + kept answer), then right; a clean right; then three misses and a revision.
  await ui.press("[data-next]");
  await page.locator(".ml-problem").waitFor();
  await noSideways(page, `${tag} try`);
  await targets(page, `${tag} try`);
  await shot("3-try");
  const solved = async () => answerText(solve(await page.locator(".ml-problem .ml-q").innerText()));
  const first = await page.locator(".ml-problem .ml-q").innerText();
  assert.ok(solve(first) !== null, `${tag}: the independent solver reads "${first}"`);
  await ui.submit("#ml-answer", "99999");
  await page.locator(".ml-feedback .fb-title").waitFor({ state: "visible" });
  assert.equal(await page.locator(".ml-feedback").getAttribute("data-phase"), "retry", `${tag}: a miss is a retry`);
  assert.equal(await page.locator(".ml-feedback .fb-icon svg").count(), 1, `${tag}: the miss has an icon`);
  assert.ok((await page.locator(".ml-hints li").count()) >= 1, `${tag}: a miss opens a hint`);
  assert.equal(await page.locator("#ml-answer").inputValue(), "99999", `${tag}: the answer stays in the box`);
  const hintText = await page.locator(".ml-hints").innerText();
  const right = await solved();
  assert.ok(!new RegExp(`(^|\\s)${right.replace("/", "\\/")}(\\s|$)`).test(hintText.replace(/Hint \d|Pista \d/g, "")) || right.length < 2 || (await page.locator(".ml-problem .ml-q").innerText()).includes(right), `${tag}: the hint does not state the answer`);
  await shot("3-try-miss");
  await ui.submit("#ml-answer", right);
  await page.locator("[data-next-problem]").waitFor();
  assert.equal(await page.locator(".ml-feedback").getAttribute("data-phase"), "assisted", `${tag}: right after a miss is supported`);
  await shot("3-try-right");
  await ui.press("[data-next-problem]");
  await ui.submit("#ml-answer", await solved());
  await page.locator("[data-next-problem]").waitFor();
  assert.equal(await page.locator(".ml-feedback").getAttribute("data-phase"), "assisted", `${tag}: a first-try answer here is still guided practice`);
  assert.match(await page.locator(".ml-feedback .fb-badge").innerText(), lang === "es" ? /más adelante/ : /later checks/);
  await ui.press("[data-next-problem]");
  for (let i = 0; i < 3; i += 1) await ui.submit("#ml-answer", `9999${i}`);
  await page.locator(".ml-revise").waitFor();
  assert.equal(await page.locator(".ml-feedback").getAttribute("data-phase"), "revealed", `${tag}: three misses reveal the steps`);
  await shot("3-try-revealed");
  await ui.submit("#ml-answer", await solved());
  await page.locator("[data-next-problem]").waitFor();
  assert.equal(await page.locator(".ml-feedback").getAttribute("data-phase"), "revised", `${tag}: a revision after the steps`);
  await ui.press("[data-next-problem]");
  await page.locator(".ml-summary").waitFor();
  await shot("3-try-summary");

  // Evidence is supported only: three supported entries, no independent ones.
  const tutor = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-tutor-v2")));
  const record = tutor.records[`${grade}:${id}`];
  assert.equal(record.supportedTotal, 3, `${tag}: three supported results`);
  assert.ok(!record.independentTotal, `${tag}: no independent result from a mini-lesson`);
  assert.ok(record.recent.every((entry) => entry.independent === false), `${tag}: every entry is supported`);

  // Explain It.
  await ui.press("[data-to-explain]");
  await page.locator(".ml-explain").waitFor();
  await noSideways(page, `${tag} explain`);
  await targets(page, `${tag} explain`);
  assert.equal(await page.locator('[data-fn="fix"]').count(), 1, `${tag}: after a miss Explain It offers fix it`);
  await shot("4-explain");
  await ui.press("[data-frame]");
  const frame = await page.locator("#ml-explain-text").inputValue();
  assert.match(frame, /___/, `${tag}: a frame has blanks`);
  const checkedBefore = await page.locator(".ml-checklist li.got").count();
  await ui.type("#ml-explain-text", lang === "es" ? "Primero hice lo mismo en los dos lados porque la ecuación debe quedar igual. Puedo comprobarlo estimando." : "First I did the same thing to both sides because the equation must stay equal. I can check by estimating.");
  assert.ok((await page.locator(".ml-checklist li.got").count()) > checkedBefore, `${tag}: the checklist shows ideas as they appear`);
  assert.doesNotMatch(await page.locator(".ml-checks").innerText(), /\d+\s*\/\s*\d+|score|puntaje/i, `${tag}: the checklist is not a grade`);
  await shot("4-explain-written");
  await ui.press("[data-save]");
  await page.locator(".ml-save-status", { hasText: lang === "es" ? "Guardado" : "Saved" }).waitFor();
  const journal = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-language-journal-v1")));
  assert.equal(journal[0].skill, `${grade}:${id}`, `${tag}: saved to the math journal`);
  await ui.press("[data-next]");
  await page.locator(".ml-done").waitFor();
  await shot("5-done");
  assert.deepEqual(problems, [], `${tag}: console is clean`);
  await context.close();
}

try {
  browser = await chromium.launch({ headless: true });
  for (const skill of SKILLS) {
    await walk(browser, skill, { lang: "en", mode: "mouse", shoot: true });
    await walk(browser, skill, { lang: "en", mode: "keyboard" });
    await walk(browser, skill, { lang: "es", mode: "mouse" });
    await walk(browser, skill, { lang: "es", mode: "keyboard" });
    await walk(browser, skill, { lang: "en", mode: "mouse", width: 390, shoot: true });
  }
  if (shots) for (const skill of SKILLS) await walk(browser, skill, { lang: "en", mode: "mouse", width: 820, shoot: true });
  if (shots) for (const skill of SKILLS) await walk(browser, skill, { lang: "es", mode: "mouse", width: 390, shoot: true });

  // Coordinate models stay interactive in Learn It, Watch It and Try It.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const problems = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (message) => message.type() === "error" && problems.push(message.text()));
    await page.goto(`${base}/math/fluency-lab/?grade=5&skill=coordinate-plane&mini=1&lang=en&profile=0`, { waitUntil: "networkidle" });
    await page.locator(".ml .coord-explorer-wrap").waitFor();
    const movePoint = async (selector, key, delta, label) => {
      const root = page.locator(selector);
      const coord = key.startsWith("ArrowLeft") || key.startsWith("ArrowRight") ? "x1" : "y1";
      const before = Number(await root.getAttribute(`data-${coord}`));
      await root.locator('[data-point="A"]').focus();
      await page.keyboard.press(key);
      assert.equal(Number(await root.getAttribute(`data-${coord}`)), before + delta, label);
    };
    await movePoint(".ml-learn .coord-explorer-wrap", "ArrowRight", 1, "Learn It moves the point");
    await page.locator('.ml-dot[data-step="watch"]').click();
    await page.locator(".ml-film-picture .coord-explorer-wrap").waitFor();
    await movePoint(".ml-film-picture .coord-explorer-wrap", "ArrowUp", 1, "Watch It keeps the plane interactive");
    await page.locator('.ml-dot[data-step="try"]').click();
    await page.locator(".ml-try-picture .coord-explorer-wrap").waitFor();
    await movePoint(".ml-try-picture .coord-explorer-wrap", "ArrowLeft", -1, "Try It keeps the plane interactive after stage changes");
    assert.deepEqual(problems, [], "coordinate mini-lesson has no browser errors");
    await context.close();
  }

  // The Learn page has the button; a stopped lesson resumes on the same step with the same problems.
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const problems = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => message.type() === "error" && problems.push(message.text()));
  await page.goto(`${base}/math/fluency-lab/?grade=6&skill=ratios&profile=0`, { waitUntil: "networkidle" });
  await openSupport(page);
  await page.getByRole("button", { name: "Mini-lesson" }).click();
  await page.locator(".ml").waitFor();
  await page.locator('.ml-dot[data-step="try"]').click();
  const before = await page.locator(".ml-problem .ml-q").innerText();
  await page.reload({ waitUntil: "networkidle" });
  await openSupport(page);
  await page.getByRole("button", { name: "Mini-lesson" }).click();
  await page.locator(".ml-problem").waitFor();
  assert.equal(await page.locator(".ml-problem .ml-q").innerText(), before, "the lesson resumes on the same step with the same problem");
  assert.equal(await page.locator('.ml-dot[aria-current="step"] .ml-dot-label').innerText(), "Try It");
  // Back to the skill page restores Learn; the mode tabs still work.
  await page.getByRole("button", { name: "Back to the skill page" }).first().click();
  assert.equal(await page.locator(".ml").count(), 0, "Back removes the lesson");
  assert.ok(await page.locator(".learn-support > summary").isVisible(), "Learn is back with help collapsed");
  await openSupport(page);
  await page.getByRole("button", { name: "Mini-lesson" }).click();
  await page.locator(".practice-alternatives summary").click();
  await page.getByRole("tab", { name: "Quick 5" }).click();
  assert.equal(await page.locator(".ml").count(), 0, "another mode tab closes the lesson");
  assert.deepEqual(problems, [], "resume run is clean");
  console.log("mini-lesson browser test passed");
} finally {
  await browser?.close();
  await server.close();
}

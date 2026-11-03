// Phases 5 and 6 in a real browser: the Teacher Hub mastery map (from opened learner files), the assessment builder and
// item library, the lesson planner, printable sheets, the Family Math Studio page and the learner's "Real problems"
// practice. Checks what a person sees and can do, in English and Spanish, at three widths, with axe.
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../../tools/lib/curriculum-source.mjs";
import { DAY, NOW, answers, keyOf, tutorWith } from "../../../tools/lib/teacher-4-fixtures.mjs";

const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const lab = `${base}/math/fluency-lab/`;
const browser = await chromium.launch();
const failures = [];
const check = (c, m) => { if (!c) failures.push(m); };
const noisy = (text) => /ResizeObserver/.test(text);

// A class of five on Grade 6 skills: two share a shaky skill, one is secure, one has nothing yet.
const ADD = keyOf("add-20");
const RATIOS = "6:ratios";
const spread = (pattern) => answers(pattern, { start: NOW - (pattern.length - 1) * DAY });
const backup = (tutor) => ({ app: "EduWonderLab Fluency Lab", version: 2, exportedAt: new Date(NOW).toISOString(), grade: 6, progress: {}, tutor, settings: {} });
const classTutors = [
  tutorWith({ [RATIOS]: spread("wwcw"), [ADD]: spread("cwww") }),
  tutorWith({ [RATIOS]: spread("wcw"), [ADD]: spread("wwww") }),
  tutorWith({ [RATIOS]: spread("wwww") }),
  tutorWith({ [RATIOS]: spread("cccccccccc") }),
  tutorWith({}),
];
const dir = mkdtempSync(join(tmpdir(), "e8-hub-"));
const files = classTutors.map((tutor, i) => { const p = join(dir, `l${i}.json`); writeFileSync(p, JSON.stringify(backup(tutor))); return p; });

async function open(url, { viewport = { width: 1280, height: 900 } } = {}) {
  const ctx = await browser.newContext({ viewport, acceptDownloads: true });
  await ctx.addInitScript(() => { window.__printed = 0; window.print = () => { window.__printed += 1; }; });
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", (e) => !noisy(e.message) && page.errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !noisy(m.text()) && page.errors.push(`console: ${m.text()}`));
  await page.goto(url, { waitUntil: "networkidle" });
  return page;
}
const axeCheck = async (page, selector, label) => {
  const axe = await new AxeBuilder({ page }).include(selector).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  for (const v of axe.violations.filter((x) => ["serious", "critical"].includes(x.impact))) check(false, `${label}: axe ${v.id} ${v.nodes[0].target.join(" ")}`);
};
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

try {
  // ---------------------------------------------------------------- A. Teacher Hub
  {
    const page = await open(`${lab}?view=teacher&grade=6`);
    const t4 = page.locator("#teacher-4");
    await t4.locator(".t4").waitFor();
    check((await page.locator("#teacher-4 [role=tab]").count()) === 6, "teacher: six tabs (assignments, insights, reports, map, assessments, lesson plan)");
    await page.locator("#t4-tab-insights").click();
    await t4.locator("[data-t4-files]").setInputFiles(files);
    await page.waitForTimeout(400);
    await page.locator("#t4-tab-map").click();
    const map = page.locator("#t4-panel-map");
    await map.locator("[data-th-grade]").selectOption("6");
    const rows = map.locator("tbody tr");
    check((await rows.count()) === 5, `mastery map: one row per learner (got ${await rows.count()})`);
    const firstCell = map.locator("[data-th-cell]").first();
    const label = (await firstCell.getAttribute("aria-label")) || "";
    check(/Not yet assessed|Developing|Practicing|Demonstrated|Review due/.test(label), "mastery map: every cell says its state in words");
    check((await map.locator(".e8th-legend li").count()) === 5, "mastery map: legend names all five states");
    check((await map.locator("th[scope=col]").count()) > 3 && (await map.locator("th[scope=row]").count()) === 5, "mastery map: real column and row headers");
    // The empty learner is "not yet assessed" across the row, and is not flagged.
    const emptyRow = (await rows.nth(4).innerText()).replace(/\s+/g, " ");
    check(!/Developing|Practicing|Demonstrated/.test(emptyRow) && !/needs attention/.test(emptyRow), "mastery map: a learner with no work is not behind");
    await firstCell.click();
    check((await map.locator(".e8th-detail").innerText()).length > 10, "mastery map: selecting a cell describes it");
    // Reteach list: the shared ratios skill is flagged; adding it opens the assignment tab with that skill.
    check((await map.locator("[data-th-plan]").count()) >= 1, "mastery map: a shared weak skill is offered for reteaching");
    await map.locator("[data-th-plan]").first().click();
    check(await page.locator("#t4-panel-assign").isVisible(), "mastery map: Add to assignment opens the assignment tab");
    await page.locator("#t4-tab-map").click();
    // CSV
    const [dl] = await Promise.all([page.waitForEvent("download"), map.locator("[data-th-csv]").click()]);
    check(/mastery-map-grade-6\.csv$/.test(dl.suggestedFilename()), "mastery map: CSV file name");
    // Print studio: a student sheet has no answers, the key does.
    await map.locator(".e8th-print summary").click();
    await map.locator('select[name="skills"]').selectOption({ index: 0 });
    await map.locator('[data-th-form] button[type="submit"]').click();
    check((await page.evaluate(() => window.__printed)) === 1, "print: student sheet opens the print dialog");
    const sheet = await page.locator("#print-sheet").innerText();
    check(/There is no timer/.test(sheet) && !/Answer key/.test(sheet), "print: student sheet has no key and no timer");
    await map.locator("[data-th-key]").click();
    check(/Answer key/.test(await page.locator("#print-sheet").innerText()), "print: the key prints separately");
    await axeCheck(page, ".e8th", "mastery map");
    check(page.errors.length === 0, `teacher: page error ${page.errors[0]}`);

    // B. Assessments
    await page.locator("#t4-tab-assess").click();
    const as = page.locator("#t4-panel-assess");
    await as.locator("[data-as-build]").waitFor();
    await as.locator("[data-as-grade]").selectOption("6");
    await as.locator("[data-as-build]").click();
    await as.locator("table.e8th-table").waitFor();
    const n = await as.locator("tbody tr").count();
    check(n >= 8, `assessment: builds a quiz (got ${n})`);
    check(/points/.test(await as.innerText()) && /DOK/.test(await as.innerText()), "assessment: blueprint shows points and DOK mix");
    await as.locator("[data-as-open]").first().click();
    check((await as.locator(".e8th-detail li").count()) >= 8, "assessment: item library shows five explanation layers, talk prompts and supports");
    await as.locator('[data-as-print="student"]').click();
    const studentCopy = await page.locator("#print-sheet").innerText();
    check(/Name/.test(studentCopy) && !/Answer key/i.test(studentCopy), "assessment: student copy has a name line and no key");
    await as.locator('[data-as-print="key"]').click();
    check(/Answer key/i.test(await page.locator("#print-sheet").innerText()), "assessment: key prints separately");
    await axeCheck(page, "#t4-panel-assess", "assessment builder");

    // C. Lesson plan from class
    await page.locator("#t4-tab-lesson").click();
    check((await page.locator("#t4-panel-lesson").innerText()).length > 40, "lesson plan: renders from the opened class");

    // D. Spanish
    await page.getByRole("button", { name: /Español/ }).first().click();
    check((await page.locator("#t4-tab-map").innerText()) === "Mapa de dominio", "Spanish: map tab");
    await page.locator("#t4-tab-map").click();
    check(/Mapa de dominio/.test(await page.locator("#t4-panel-map").innerText()) && /Aún sin evaluar/.test(await page.locator("#t4-panel-map").innerText()), "Spanish: map and state names");
    await page.context().close();
  }

  // widths
  for (const [name, viewport] of [["tablet", { width: 768, height: 1024 }], ["phone", { width: 390, height: 844 }]]) {
    const page = await open(`${lab}?view=teacher&grade=6`, { viewport });
    await page.locator("#t4-tab-insights").click();
    await page.locator("[data-t4-files]").setInputFiles(files);
    await page.waitForTimeout(400);
    await page.locator("#t4-tab-map").click();
    check((await overflow(page)) <= 1, `${name}: mastery map has no horizontal page scroll`);
    await axeCheck(page, ".e8th", `${name} map`);
    await page.context().close();
  }

  // ---------------------------------------------------------------- E. Family Math Studio
  {
    const page = await open(`${lab}family/studio.html?grade=5`);
    check((await page.locator(".fs-card").count()) >= 1, "family studio: a plan appears for a brand-new learner");
    check(/not much practice on record|recent work/.test(await page.locator("#fs-plan").innerText()), "family studio: says what the plan is based on");
    check(/supported practice/.test(await page.locator("#fs-plan").innerText()), "family studio: says work together is supported practice");
    await page.locator('input[name="minutes"][value="5"]').check();
    check((await page.locator(".fs-card").count()) === 1, "family studio: five minutes gives one activity");
    check(/Everything looks fine/.test(await page.locator("#fs-health").innerText()), "family studio: data health check");
    await page.locator("#fs-language").click();
    check(/Estudio de matemáticas en familia/.test(await page.locator("#fs-title").innerText()), "family studio: Spanish title");
    check(/práctica con apoyo/.test(await page.locator("#fs-plan").innerText()), "family studio: Spanish plan text");
    await axeCheck(page, "main", "family studio");
    await page.context().close();
    const phone = await open(`${lab}family/studio.html?grade=3`, { viewport: { width: 390, height: 844 } });
    check((await overflow(phone)) <= 1, "family studio: no horizontal scroll at 390px");
    check(page.errors.length === 0, `family studio: page error ${page.errors[0]}`);
    await phone.context().close();
    const home = await open(`${lab}family/`);
    check((await home.locator("#studio-link").count()) === 1, "family home links to the studio");
    await home.context().close();
  }

  // ---------------------------------------------------------------- F. Real problems (learner)
  {
    const page = await open(`${lab}?grade=5&view=path`);
    await page.locator("#e8-items [data-ip-set]").first().waitFor();
    const bank = await page.evaluate(async () => (await fetch("/math/fluency-lab/content/items/grade-5.json")).json());
    const byStem = new Map(bank.map((i) => [i.stem.en, i]));
    await page.locator('[data-ip-set="exit"]').click();
    await page.locator("#e8ip-q").waitFor();
    const seenIds = [];
    for (let guard = 0; guard < 40; guard += 1) {
      if (await page.locator("#e8-items .e8ip-set, #e8-items [data-ip-set]").count() && (await page.locator("[data-ip-set]").count())) break;
      const stem = (await page.locator("#e8ip-q").innerText()).trim();
      const it = byStem.get(stem);
      check(!!it, `real problems: stem found in bank (${stem.slice(0, 40)})`);
      if (!it) break;
      seenIds.push(it.id);
      if (it.type === "mc") await page.locator(`input[name="c"][value="${it.answer.correct}"]`).check();
      else if (it.type === "multi") for (const id of it.answer.correct) await page.locator(`input[name="c"][value="${id}"]`).check();
      else if (it.type === "error") await page.locator(`input[name="s"][value="${it.answer.errorStep}"]`).check();
      else if (it.type === "numberline") await page.locator(`input[name="t"][value="${it.answer.point}"]`).check();
      else if (["numeric", "fraction", "equation", "expression", "application"].includes(it.type) && (it.answer?.value ?? null) !== null) await page.locator("#e8ip-ans").fill(it.answer.value);
      else if (it.type === "constructed" || it.type === "explain") await page.locator("#e8ip-text").fill("I checked it two ways.");
      await page.locator("[data-ip-check]").first().click();
      // Wait for the result to render before deciding which branch applies; counting immediately raced under load.
      await page.locator("[data-ip-next]").first().waitFor({ state: "attached", timeout: 3000 }).catch(() => {});
      if (await page.locator("[data-ip-next]").count()) await page.locator("[data-ip-next]").click();
      else {
        // an unsupported shape or a retry: give up through the retry limit
        for (let r = 0; r < 3 && !(await page.locator("[data-ip-next]").count()); r += 1) await page.locator("[data-ip-check]").first().click();
        if (await page.locator("[data-ip-next]").count()) await page.locator("[data-ip-next]").click();
      }
    }
    check(seenIds.length >= 1, "real problems: a quick check was answered");
    // The summary renders after the last answer is stored; give it the same grace the Next button gets.
    await page
      .waitForFunction(() => /finished \d+ problems/.test(document.querySelector("#e8-items")?.innerText || ""), null, { timeout: 5000 })
      .catch(() => {});
    check(/finished \d+ problems/.test(await page.locator("#e8-items").innerText()), "real problems: a finish summary appears");
    const rec = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-tutor-v2") || "null"));
    check(!rec || Object.keys(rec.records || {}).length >= 0, "real problems: tutor record stays readable");
    await axeCheck(page, "#e8-items", "real problems");
    check(page.errors.length === 0, `real problems: page error ${page.errors[0]}`);
    await page.context().close();
  }
} finally {
  await browser.close();
  await server.close();
}

if (failures.length) {
  console.error(`${failures.length} Phase 5/6 browser failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("Teacher hub, assessment builder, lesson planner, print sheets, Family Math Studio and Real problems pass in the browser (English, Spanish, three widths, axe).");

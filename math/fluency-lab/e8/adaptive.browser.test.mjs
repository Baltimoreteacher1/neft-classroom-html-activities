// Phase 3 acceptance in a real browser: today's plan with reasons, evidence-driven routing, the quick starting-point check,
// misconception evidence from real wrong answers, the Mistake Repair Studio, persistence, Spanish, backups and accessibility.
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../../tools/lib/curriculum-source.mjs";
import { R, parseRational } from "./rational.js";

const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/`;
const browser = await chromium.launch();
const failures = [];
const check = (c, m) => { if (!c) failures.push(m); };
const DAY = 86400000;

async function open(query, { viewport = { width: 1280, height: 900 }, seed = null, context = null } = {}) {
  const ctx = context || (await browser.newContext({ viewport }));
  const page = await ctx.newPage();
  page.errors = [];
  page.on("pageerror", (e) => page.errors.push(e.message));
  if (seed) await page.addInitScript((s) => { for (const [k, v] of Object.entries(s)) if (!localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify(v)); }, seed);
  await page.goto(`${base}?${query}`, { waitUntil: "networkidle" });
  return page;
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const store = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-e8-v1") || "null"));
const tutor = (page) => page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-tutor-v2") || "null"));

// Solve "a/b ± c/d = ?" exactly from the page text.
function fractionAnswers(question) {
  let m = /(\d+)\s*\/\s*(\d+)\s*([+−-])\s*(\d+)\s*\/\s*(\d+)/.exec(question);
  if (!m) m = /(\d+)\s*\n\s*(\d+)\s*([+−-])\s*(\d+)\s*\n\s*(\d+)/.exec(question);
  if (!m) return { right: "0", signature: "1/999", sub: false, ok: false };
  const [n1, d1, n2, d2] = [m[1], m[2], m[4], m[5]].map(Number);
  const sub = m[3] !== "+";
  return { right: (sub ? R(n1, d1).sub(R(n2, d2)) : R(n1, d1).add(R(n2, d2))).toString(), signature: `${sub ? n1 - n2 : n1 + n2}/${sub ? d1 - d2 : d1 + d2}`, sub, ok: !sub || d1 !== d2 };
}

try {
  // 1. A beginning learner: learn tasks, each with a reason in plain words, no review.
  {
    const page = await open("grade=3&view=path");
    const tasks = page.locator(".e8ap-task");
    check((await tasks.count()) >= 4, "beginner: expected several tasks");
    check((await page.locator(".e8ap-learn").count()) >= 4, "beginner: tasks should be learn tasks");
    check((await page.locator(".e8ap-review").count()) === 0, "beginner: no review yet");
    for (let i = 0; i < Math.min(5, await tasks.count()); i += 1) check((await tasks.nth(i).locator(".e8ap-reason").innerText()).length > 20, `task ${i}: missing reason`);
    check((await page.locator(".e8pv").count()) === 1 && (await page.locator(".e8ap-table").count()) === 1, "progress visual and evidence table should both show");
    check((await page.locator(".e8pv--constellation").count()) === 1, "grade 3 uses the constellation progress view");
    await tasks.first().locator("[data-e8ap-open]").click();
    check(await page.locator("#workspace-view").isVisible(), "Start should open the skill");
    check(page.errors.length === 0, `beginner: page error ${page.errors[0]}`);
    await page.context().close();
  }

  // 2. Prerequisite gap: a shaky foundation is routed to before the skill that needs it.
  {
    const now = Date.now();
    const entries = [false, true, false, false].map((c, i) => ({ correct: c, independent: true, level: 1, at: now - (4 - i) * DAY, sig: `x${i}` }));
    const seed = { "ewl-fluency-tutor-v2": { version: 2, records: { "4:fraction-equiv": { recent: entries, independentTotal: 4, supportedTotal: 0, interval: 1, dueAt: now - DAY } }, mistakes: [], diagnostics: {}, sessions: [], rescues: [] } };
    const page = await open("grade=5&view=path", { seed });
    const text = await page.locator(".e8ap-list").first().innerText();
    check(/builds on/i.test(text) && /equivalent fractions/i.test(text), "gap: expected a foundation task that says why");
    check(!/Add and subtract fractions\s*\n\s*Picture first\s*\n\s*Add and subtract fractions is the next idea/.test(text), "gap: the dependent skill should wait");
    await page.context().close();
  }

  // 3-5. Real wrong answers -> misconception evidence -> pattern -> model -> repair, in one learner's session.
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await open("grade=5&skill=5:fraction-add&start=practice", { context: ctx });
    const seen = new Set();
    for (let i = 0; i < 10 && seen.size < 3; i += 1) {
      const input = page.locator("#answer-input");
      await input.waitFor({ state: "visible" });
      await page.waitForFunction(() => !document.querySelector("#answer-input")?.disabled, null, { timeout: 8000 });
      const q = await page.locator("#question").innerText();
      const f = fractionAnswers(q);
      const usable = f.ok && /^[1-9]\d*\/[1-9]\d*$/.test(f.signature) && !parseRational(f.signature).eq(parseRational(f.right)) && !seen.has(q);
      if (usable) seen.add(q);
      const wrong = usable ? f.signature : "1/999";
      let attempts = 0;
      await input.fill(wrong);
      await page.locator("#check-answer").click();
      // The lab gives one more try before it settles; keep answering with a different wrong value until it does.
      while (!(await page.locator("#next-problem").isVisible()) && (await input.isEnabled()) && attempts < 4) {
        attempts += 1;
        await input.fill(attempts === 1 ? wrong : `1/${990 + attempts}`);
        await page.locator("#check-answer").click();
      }
      const next = page.locator("#next-problem");
      await next.waitFor({ state: "visible", timeout: 8000 });
      await next.click();
    }
    const saved = await store(page);
    const entry = saved?.misconceptions?.items?.["fraction-add-denominators"];
    check(entry && entry.sigs.length >= 2, `misconception evidence should record distinct items, got ${JSON.stringify(entry)}`);
    const raw = await page.evaluate(() => localStorage.getItem("ewl-fluency-e8-v1"));
    check(![...seen].some((q) => raw.includes(q)), "the e8 record must not hold question text or typed answers");
    check(!/\d+\/\d+/.test(raw.replace(/\d:[\w-]+/g, "")), "the e8 record must not hold typed fractions");

    // Pattern surfaces only after more than one distinct item, with a model to look at.
    await page.goto(`${base}?grade=5&view=path`, { waitUntil: "networkidle" });
    if (entry && entry.sigs.length >= 2) {
      check((await page.locator(".e8ap-patterns li").count()) >= 1, "pattern should surface after two distinct items");
      await page.locator(".e8ap-patterns [data-e8ap-model]").first().click();
      check(await page.locator(".e8ml").isVisible(), "See it in a model should open the Model Lab");
      check((await page.locator('.e8ml-chip[aria-pressed="true"]').first().innerText()).toLowerCase().includes("fractions"), "the Model Lab should open on the fraction model");
    }

    // Repair studio from the recorded mistake.
    await page.goto(`${base}?grade=5&view=notebook`, { waitUntil: "networkidle" });
    const repair = page.locator("#e8-repair");
    check((await repair.locator("[data-e8rs]").count()) >= 1, "repair studio should list the open mistake");
    await repair.locator("[data-e8rs]").first().click();
    const stage = repair.locator(".e8ap-stage");
    // Wait for the question to render: under load the click returns before the stage has painted its text.
    await stage.getByText(/\d+\/\d+ [+−-] \d+\/\d+ = \?/).first().waitFor({ timeout: 15000 });
    const reviewText = await stage.innerText();
    const qText = /(\d+\/\d+ [+−-] \d+\/\d+ = \?)/.exec(reviewText)?.[1] || "";
    // The answer may legitimately appear as an operand in the question or inside a longer fraction (11/12 contains 1/2),
    // so look for it as a whole number or fraction in everything except the question, the "Step n / m" header and the learner's own line.
    const answerToken = new RegExp(`(?<![\\d/])${fractionAnswers(qText || "1/2 + 1/2").right.replace("/", "\\/")}(?![\\d/])`);
    check(qText && !answerToken.test(reviewText.replace(qText, "").replace(/Step \d+ \/ \d+/, "").replace(/You wrote:[^\n]*/, "")), `the review step must not reveal the answer (question "${qText}", answer ${fractionAnswers(qText || "1/2 + 1/2").right}, stage text: ${JSON.stringify(reviewText.slice(0, 400))})`);
    await stage.locator("[data-next]").click();
    await stage.locator("[data-id]").filter({ hasText: /numerators and the denominators|numeradores y denominadores/i }).first().click().catch(async () => { await stage.locator("[data-id]").first().click(); });
    check((await stage.locator("svg").count()) >= 1, "counterexample must show a model");
    await stage.locator("[data-next]").click();
    const options = stage.locator("[data-s]");
    for (let i = 0; i < (await options.count()); i += 1) { if ((await options.nth(i).getAttribute("data-s")) !== "right") { await options.nth(i).click(); check((await stage.locator(".e8ap-why").innerText()).length > 10, "a wrong strategy needs feedback"); break; } }
    await stage.locator('[data-s="right"]').click();
    await stage.locator("#e8rs-x").fill("be careful");
    await stage.locator("[data-next]").click();
    check((await stage.locator(".e8ap-why").innerText()).length > 10, "a few words is not an explanation");
    await stage.locator("#e8rs-x").fill("I will cut both fractions into the same size pieces before I add them");
    await stage.locator("[data-next]").click();
    const fresh = await stage.locator(".e8ap-prompt").innerText();
    check(fresh !== qText.replace(" = ?", "") && !fresh.includes(qText), "the fresh problem must be a different problem");
    let m = /(\d+\/\d+)\s*[+−-]\s*(\d+\/\d+)/.exec(fresh);
    let sub = false;
    let a, b;
    if (m) {
      sub = /−|-/.test(/\d+\/\d+\s*([+−-])/.exec(fresh)[1]);
      a = parseRational(m[1]); b = parseRational(m[2]);
    } else {
      m = /(\d+)\s*\n\s*(\d+)\s*([+−-])\s*(\d+)\s*\n\s*(\d+)/.exec(fresh);
      sub = m ? /−|-/.test(m[3]) : false;
      a = m ? R(Number(m[1]), Number(m[2])) : R(1, 2);
      b = m ? R(Number(m[4]), Number(m[5])) : R(1, 2);
    }
    await stage.locator("#e8rs-f").fill((sub ? a.sub(b) : a.add(b)).toString());
    await stage.locator("[data-go]").click();
    const resultText = await stage.innerText();
    check(/Repaired/i.test(resultText) && /on your own/i.test(resultText), `repair should finish and count as independent: ${resultText.slice(0, 160)}`);
    const after = await store(page);
    check(after.repairs.length === 1 && after.repairs[0].independent === true, "the repair should be stored as independent");
    check(after.misconceptions.items["fraction-add-denominators"].repairedAt, "the pattern should be marked repaired");
    const t = await tutor(page);
    const recent = t.records["5:fraction-add"].recent;
    check(recent.some((e) => e.independent === false && e.correct) && recent.at(-1).independent === true, "corrected original is supported; the fresh problem is independent");

    // Persistence across a reload.
    await page.reload({ waitUntil: "networkidle" });
    check((await store(page)).repairs.length === 1, "evidence should survive a refresh");

    // 6. Backups: export carries the record, an older backup leaves it alone, junk is cleaned.
    const backup = await page.evaluate(async () => {
      const m = await import("/math/fluency-lab/play-backup.js");
      const before = m.exportPlay().e8;
      const oldClean = m.cleanPlay({ trail: { stations: {}, facts: {}, recent: [] }, rewards: {} });
      m.importPlay(oldClean);
      const after = m.exportPlay().e8;
      const dirty = m.cleanPlay({ trail: { stations: {}, facts: {}, recent: [] }, rewards: {}, e8: { version: 1, skills: { "5:fraction-add": { built: 1e9, hack: 1 }, "../x": { built: 1 } }, misconceptions: { version: 1, items: { bogus: { count: 5 } } } } });
      return { version: before.version, repairs: before.repairs.length, oldE8: oldClean.e8, unchanged: JSON.stringify(before) === JSON.stringify(after), dirty: dirty.e8 };
    });
    check(backup.version === 1 && backup.repairs === 1, "exportPlay should carry the e8 record");
    check(backup.oldE8 === null && backup.unchanged, "a backup from before Enterprise 8 must leave the learner's record alone");
    check(backup.dirty.skills["5:fraction-add"].built === 999 && !("../x" in backup.dirty.skills) && Object.keys(backup.dirty.misconceptions.items).length === 0, "imports must be sanitised");
    await ctx.close();
  }

  // 7. The quick starting-point check: at most ten short questions, no score, "not sure" is allowed, a short path comes back.
  {
    const page = await open("grade=5&view=path");
    await page.locator("[data-e8ap-place]").click();
    let asked = 0;
    for (let i = 0; i < 14; i += 1) {
      if (await page.locator(".e8ap-result").count()) break;
      await page.locator(".e8ap-q").waitFor({ timeout: 4000 });
      asked += 1;
      if (i % 3 === 2) await page.locator("[data-unsure]").click();
      else { await page.locator("#e8ap-ans").fill("1"); await page.locator("[data-go]").click(); }
    }
    check(asked <= 10 && asked >= 3, `placement asked ${asked} questions`);
    const result = await page.locator(".e8ap-result").innerText();
    check(/not a grade level/.test(result) && !/\d+\s*%|score|grade [0-9]+ level/i.test(result), "the result explains itself without a score or a grade level");
    check((await page.locator(".e8ap-pathlist li").count()) <= 6, "the path is a short start");
    check((await store(page)).placement["5"].items === asked, "the placement is saved");
    await page.context().close();
  }

  // 8. Spanish, three widths, accessibility.
  {
    const es = await open("grade=5&view=path&lang=es");
    check((await es.locator("#e8ap-title").innerText()).includes("Práctica recomendada"), "Spanish: plan heading");
    check(/Dónde están creciendo/.test(await es.locator(".e8pv-heading").innerText()), "Spanish: progress heading");
    await es.context().close();
    for (const [name, viewport] of Object.entries({ desktop: { width: 1440, height: 900 }, tablet: { width: 768, height: 1024 }, phone: { width: 390, height: 844 } })) {
      const page = await open("grade=6&view=path", { viewport });
      check((await overflow(page)) <= 1, `${name}: overflow`);
      await page.locator(".e8ap-details summary").first().click();
      const axe = await new AxeBuilder({ page }).include(".e8ap").include(".e8pv").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
      for (const v of axe.violations.filter((x) => ["serious", "critical"].includes(x.impact))) check(false, `${name}: axe ${v.id} ${v.nodes[0].target.join(" ")}`);
      const small = await page.evaluate(() => [...document.querySelectorAll(".e8ap button")].filter((b) => b.offsetParent && b.getBoundingClientRect().height < 43).map((b) => b.textContent.trim().slice(0, 24)));
      check(small.length === 0, `${name}: controls under 44px: ${small}`);
      await page.context().close();
    }
    const nb = await open("grade=5&view=notebook", { viewport: { width: 390, height: 844 } });
    check((await overflow(nb)) <= 1, "notebook: overflow on phone");
    const axe = await new AxeBuilder({ page: nb }).include("#e8-repair").withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
    for (const v of axe.violations.filter((x) => ["serious", "critical"].includes(x.impact))) check(false, `repair: axe ${v.id}`);
    await nb.context().close();
  }
} finally {
  await browser.close();
  await server.close();
}

if (failures.length) {
  console.error(`${failures.length} adaptive-layer browser failure(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("Adaptive layer in browser: plan with reasons, prerequisite routing, misconception evidence from real answers, quick check, repair pathway (supported vs independent), persistence, backups, Spanish and axe at 3 widths passed.");

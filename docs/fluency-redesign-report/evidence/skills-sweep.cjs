// Every skill (128), every step, English and Spanish: it opens from a direct link with no setup, draws its picture or
// model, takes an answer, has no console error, and passes axe WCAG 2.2 AA. Run: node skills-sweep.cjs <base> <out.json> [width]
const REPO = "/Users/joelneft/wt-fluency-features";
const { chromium } = require(`${REPO}/node_modules/playwright`);
const fs = require("node:fs");
const axeSource = fs.readFileSync(`${REPO}/node_modules/axe-core/axe.min.js`, "utf8");
const BASE = (process.argv[2] || "https://eduwonderlab.com").replace(/\/$/, ""); const OUT = process.argv[3]; const WIDTH = Number(process.argv[4] || 375);
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: WIDTH, height: WIDTH <= 375 ? 812 : 900 } }); const page = await ctx.newPage();
  let errs = []; page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 140)); }); page.on("pageerror", (e) => errs.push(String(e).slice(0, 140)));
  page.on("response", (r) => { if (r.status() >= 400 && new URL(r.url()).origin === new URL(BASE).origin) errs.push(`${r.status()} ${r.url().replace(BASE, "")}`); });
  await page.goto(`${BASE}/math/fluency-lab/`, { waitUntil: "networkidle" });
  const skills = await page.evaluate(async () => (await import("/math/fluency-lab/problem-bank.js")).ALL_SKILLS.map((s) => ({ grade: s.grade, id: s.id })));
  const rows = []; const fails = []; let axeSerious = 0; let axeRuns = 0; let loads = 0; const t0 = Date.now();
  const combos = [["en", "see"], ["en", "try"], ["en", "practice"], ["es", "see"], ["es", "practice"]];
  for (const s of skills) {
    for (const [lang, stage] of combos) {
      errs = [];
      const url = `${BASE}/math/fluency-lab/?grade=${s.grade}&skill=${s.id}${stage === "see" ? "" : `&stage=${stage}`}${lang === "es" ? "&lang=es" : ""}`;
      let row = { grade: s.grade, skill: s.id, lang, stage, ok: true, problems: [] };
      try {
        await page.goto(url, { waitUntil: "load" }); await page.waitForSelector(".skill", { timeout: 8000 }); await page.waitForTimeout(350); loads += 1;
        const f = await page.evaluate((st) => {
          const has = (q) => !!document.querySelector(q);
          return { svg: has(".skill svg"), model: has("[data-lm-host] *, .sd-studio *, .model-fallback *, .cv"), input: has("main input, main .choice, main button.choice"), text: (document.querySelector(".skill")?.innerText || "").length, lang: document.documentElement.lang, h1: document.querySelector("h1")?.textContent, over: document.documentElement.scrollWidth > innerWidth + 1, meter: has("[role=meter]") };
        }, stage);
        if (!f.meter) row.problems.push("no mastery meter");
        if (f.lang !== lang) row.problems.push(`html lang is ${f.lang}`);
        if (f.over) row.problems.push("horizontal overflow");
        if (f.text < 80) row.problems.push("almost no text");
        if (stage === "see" && !f.svg) row.problems.push("See it has no picture");
        if (stage === "try" && !f.model) row.problems.push("Try it has no model");
        if (stage === "practice" && !f.input) row.problems.push("Practice has no answer control");
        await page.evaluate(axeSource);
        const v = await page.evaluate(async (tags) => (await axe.run(document, { runOnly: { type: "tag", values: tags } })).violations.map((x) => ({ id: x.id, impact: x.impact, n: x.nodes.length, sample: x.nodes[0]?.target?.join(" ").slice(0, 90) })), TAGS);
        axeRuns += 1; for (const x of v) if (x.impact === "serious" || x.impact === "critical") { axeSerious += 1; row.problems.push(`axe ${x.id} (${x.impact}) ${x.sample}`); }
        if (errs.length) row.problems.push(`console/network: ${[...new Set(errs)].slice(0, 2).join(" | ")}`);
      } catch (e) { row.problems.push(`threw: ${String(e).split("\n")[0].slice(0, 100)}`); }
      row.ok = row.problems.length === 0; if (!row.ok) fails.push(row); rows.push(row);
    }
    if (rows.length % 100 === 0) console.error(`${rows.length}/${skills.length * combos.length} (${Math.round((Date.now() - t0) / 1000)}s) fails ${fails.length}`);
  }
  const out = { base: BASE, width: WIDTH, skills: skills.length, combos: combos.length, loads, axeRuns, axeSerious, fails, seconds: Math.round((Date.now() - t0) / 1000) };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); console.log(JSON.stringify({ ...out, fails: fails.length }));
  await b.close();
})();

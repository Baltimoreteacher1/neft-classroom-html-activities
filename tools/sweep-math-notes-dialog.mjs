#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
/**
 * sweep-math-notes-dialog.mjs — open the Math Notes dialog on EVERY core lesson
 * and prove it shows that lesson's own words.
 *
 * The dialog used to render only the blank page-layout model, so "Math Notes"
 * answered "what should my page look like?" and never "what are today's
 * words?" — the lesson's actual vocabulary lived two phases away inside the
 * checkpoint blocks. It now renders the same verified panels the checkpoints
 * render, and this sweep holds the wiring: the dialog must name THIS lesson,
 * every term in it must be declared by THIS lesson's `vocabulary`, and any rule
 * must be a run of THIS lesson's `keyIdea`.
 *
 * `validate:copy-panels` proves the DATA is lesson-own; this proves the right
 * data reaches the dialog on all 84 lessons rather than on the 4 the render
 * gate samples.
 *
 * Needs a preview server: npm run preview -- --port 4499
 */
import { chromium } from "playwright";

const BASE = (process.env.BASE || "http://localhost:4499").replace(/\/$/, "");
const ids = readdirSync("lessons")
  .filter((d) => /^\d+-\d+$/.test(d))
  .sort();
const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const fails = [];
let both = 0,
  one = 0,
  none = 0,
  checked = 0;

const run = async (id) => {
  const cfg = JSON.parse(readFileSync(`lessons/${id}/config.json`, "utf8"));
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/lessons/${id}/`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(700);
    const s = page.locator(".flagship-mission-start");
    if (await s.isVisible().catch(() => false)) {
      await s.click();
      await page.waitForTimeout(500);
    }
    const n = page.locator("#id-name");
    if (await n.isVisible().catch(() => false)) {
      await n.fill("QA");
      await page
        .locator("#id-start")
        .click()
        .catch(() => {});
      await page.waitForTimeout(800);
    }
    const r = await page.evaluate(async () => {
      document.querySelector('[data-extra="mathnotes"]')?.click();
      await new Promise((x) => setTimeout(x, 500));
      const dlg = document.getElementById("nt-notebook-model");
      if (!dlg) return null;
      return {
        lead: dlg.querySelector(".nt-nb-model-lessonlead")?.textContent || "",
        terms: Array.from(dlg.querySelectorAll(".nt-nb-copy-term")).map((e) =>
          e.textContent.trim(),
        ),
        rule: dlg.querySelector(".nt-nb-copy-rule")?.textContent?.trim() || "",
        example: dlg.querySelector(".nt-nb-copy-example")?.textContent?.trim() || "",
        own: dlg.querySelectorAll(".nt-nb-own-panel").length,
        copy: dlg.querySelectorAll(".nt-nb-copy-panel").length,
      };
    });
    if (!r) {
      fails.push(`${id}: Math Notes dialog did not open`);
      return;
    }
    checked++;
    if (r.copy === 2) both++;
    else if (r.copy === 1) one++;
    else none++;
    if (cfg.title && !norm(r.lead).includes(norm(cfg.title)))
      fails.push(`${id}: dialog names "${r.lead}" not "${cfg.title}"`);
    const declared = (cfg.vocabulary || []).map((v) => norm(v.term));
    for (const t of r.terms)
      if (!declared.includes(norm(t)))
        fails.push(`${id}: term "${t}" is not declared by this lesson`);
    if (r.rule) {
      // An anchor may be quoted from the lesson's key idea OR from its own
      // worked example — a formula, an equation, a procedure step and a pattern
      // all live in `iDo`. Both are this lesson's text; neither is another
      // lesson's.
      const ci = cfg.launch?.conceptIntro || {};
      const source = norm(`${ci.keyIdea || ""} ${(ci.iDo?.lines || []).join(" ")}`).replace(
        /[^a-z0-9 ]/g,
        "",
      );
      const quoted = norm(r.rule).replace(/[^a-z0-9 ]/g, "");
      if (!source.includes(quoted))
        fails.push(`${id}: anchor "${r.rule}" is not in this lesson's key idea or worked example`);
    }
    if (r.copy === 0 && r.own === 0) fails.push(`${id}: dialog shows no lesson notes at all`);
  } catch (e) {
    fails.push(`${id}: ${e.message.slice(0, 70)}`);
  } finally {
    await page.close();
  }
};

const QUEUE = [...ids];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (QUEUE.length) await run(QUEUE.shift());
  }),
);
await browser.close();
console.log(
  `checked ${checked}/${ids.length} lessons — dialogs with two panels: ${both}, one: ${one}, none: ${none}`,
);
if (fails.length) {
  console.log(`\nFAILURES (${fails.length}):`);
  for (const f of fails.slice(0, 40)) console.log("  " + f);
  process.exit(1);
}
console.log("\nPASS — every Math Notes dialog shows only its own lesson's vocabulary and rule.");

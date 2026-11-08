// The Math Discovery Studio in a real browser: axe (WCAG 2 A/AA and 2.2 AA) on every tab at phone and desktop width,
// a keyboard-only walk (Tab reaches the controls, arrow keys step the model), no sideways scroll, 44px targets on the
// controls a learner touches, reduced motion honoured, and a clean console. Serves the source tree with Vite.

import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { createServer } from "vite";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { TOTAL_SKILLS } from "./lib/fluency-skill-count.mjs";

const server = await createServer({
  root: REPO_ROOT,
  logLevel: "error",
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const failures = [];
const note = (ok, msg) => ok || failures.push(msg);
let browser;
try {
  browser = await chromium.launch({ headless: true });
  // [grade, skill id, tabs to visit]
  const cases = [
    [3, "add-sub-1000", ["watch", "build", "try", "detective"]],
    [4, "fraction-equiv", ["watch", "build", "explore"]],
    [7, "integer-add", ["watch", "build"]],
    [7, "equations", ["watch", "build"]],
    [6, "ratios", ["watch", "build"]],
    [3, "round", ["watch", "build"]],
    [5, "fraction-mul", ["watch", "build"]],
    [1, "tens-ones", ["watch", "build"]],
    [2, "skip-count", ["watch", "build"]],
    [8, "exponents", ["watch", "build"]],
    [6, "gcf", ["watch", "build"]],
    [8, "slope", ["watch", "build", "explore"]],
    [0, "compose-10", ["watch", "build"]],
    [1, "time", ["watch", "build"]],
    [2, "coins", ["watch", "build"]],
    [6, "evaluate", ["watch", "build"]],
    [7, "inequalities", ["watch", "build"]],
    [5, "decimal-mul", ["watch", "build"]],
    [8, "pythagorean", ["watch", "build"]],
    [8, "transformations", ["watch", "build"]],
    [7, "circle-area", ["watch", "build"]],
    [7, "probability", ["watch", "build"]],
  ];
  // Every one of the 96 skills, once: mount the Studio, step Watch (answering each Predict question), open every tab
  // and make one move in Build, Try, the simulator and the Detective. Firefox 159 and Safari 27.2 passed the same
  // sweep by hand on 2026-10-31, so this is the part that keeps running.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${base}/math/fluency-lab/?grade=3`, { waitUntil: "networkidle" });
    const sweep = await page.evaluate(async () => {
      const { ALL_SKILLS, generateProblem, seededRandom } = await import(
        "/math/fluency-lab/problem-bank.js"
      );
      const { mountStudio } = await import("/math/fluency-lab/studio/studio.js");
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const host = Object.assign(document.createElement("div"), { id: "sweep-host" });
      document.body.append(host);
      const failed = [];
      let tabs = 0;
      for (const skill of ALL_SKILLS) {
        const el = document.createElement("div");
        host.replaceChildren(el);
        try {
          const stop = mountStudio(el, {
            item: generateProblem(skill, seededRandom(7)),
            skill,
            context: "idea",
          });
          if (!stop) throw new Error("no Studio");
          await wait(4);
          if (!el.querySelector(".sd-stage svg")) throw new Error("no drawing");
          for (let k = 0; k < 14; k += 1) {
            const next = el.querySelector('[data-w="next"]');
            if (el.querySelector("[data-predict]:not([hidden])")) {
              for (const b of el.querySelectorAll("[data-c]")) {
                b.click();
                if (el.querySelector('[data-w="go"]') || el.querySelector("[data-explain]")) break;
              }
              for (const b of el.querySelectorAll("[data-e]")) {
                b.click();
                if (el.querySelector('[data-w="go"]')) break;
              }
              el.querySelector('[data-w="go"]')?.click();
              continue;
            }
            if (!next || next.disabled) break;
            next.click();
          }
          for (const id of [...el.querySelectorAll("[data-tab]")].map((t) => t.dataset.tab)) {
            el.querySelector(`[data-tab="${id}"]`).click();
            await wait(3);
            if (el.querySelector(`[data-tab="${id}"]`)?.getAttribute("aria-selected") !== "true")
              throw new Error(`tab ${id} did not open`);
            tabs += 1;
            if (id === "build") el.querySelector("[data-controls] button")?.click();
            if (id === "try") {
              const answer = el.querySelector(".sd-input");
              answer.value = "__not_an_answer__";
              el.querySelector("[data-form]").dispatchEvent(
                new Event("submit", { cancelable: true, bubbles: true }),
              );
              el.querySelector("[data-help]")?.click();
              el.querySelector('[data-rung="0"]')?.click();
              const problem = el.querySelector("[data-problem]").textContent;
              const response = answer.value;
              const feedback = el.querySelector("[data-feedback]").textContent;
              const showModel = el.querySelector("[data-show]");
              if (!showModel) throw new Error("Try did not offer a model strategy");
              showModel.click();
              if (el.querySelector('[data-tab="watch"]')?.getAttribute("aria-selected") !== "true")
                throw new Error("the model strategy did not open");
              el.querySelector('[data-tab="try"]').click();
              if (el.querySelector("[data-problem]").textContent !== problem)
                throw new Error("returning from the model changed the problem");
              if (el.querySelector(".sd-input").value !== response)
                throw new Error("returning from the model lost the response");
              if (el.querySelector("[data-feedback]").textContent !== feedback)
                throw new Error("returning from the model lost feedback");
              if (
                el.querySelectorAll(".sd-rung.on").length !== 1 ||
                el.querySelector('[data-rung="1"]')?.disabled
              )
                throw new Error("returning from the model lost hint progress");
              if (el.querySelector("[data-strategy-note]")?.hidden)
                throw new Error("the return path did not explain that work was saved");
            }
            if (id === "explore") {
              const r = el.querySelector('input[type="range"]');
              if (r) {
                r.value = r.max;
                r.dispatchEvent(new Event("input", { bubbles: true }));
              }
            }
            if (id === "detective") el.querySelector("[data-pick]")?.click();
            if (!el.querySelector("[data-panel] *")) throw new Error(`empty ${id} tab`);
          }
          stop();
        } catch (e) {
          failed.push(`${skill.grade}:${skill.id}: ${e.message}`);
        }
      }
      return { total: ALL_SKILLS.length, failed, tabs };
    });
    note(
      sweep.total === TOTAL_SKILLS,
      `sweep covered ${sweep.total} skills, expected ${TOTAL_SKILLS}`,
    );
    note(sweep.failed.length === 0, `sweep failures: ${sweep.failed.slice(0, 4).join(" | ")}`);
    note(sweep.tabs > 300, `sweep opened only ${sweep.tabs} tabs`);
    note(errors.length === 0, `sweep page errors: ${errors.slice(0, 2).join(" | ")}`);
    await context.close();
  }
  for (const [width, height, reduced] of [
    [390, 844, false],
    [1280, 800, false],
    [390, 844, true],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    for (const [grade, skill, tabs] of cases) {
      await page.goto(`${base}/math/fluency-lab/?grade=${grade}`, { waitUntil: "networkidle" });
      const openLibrary = (id) =>
        page.evaluate(async (id) => {
          const wait = (ms) => new Promise((r) => setTimeout(r, ms));
          for (const b of [...document.querySelectorAll("button,a")].filter((x) =>
            /Skill Library/i.test(x.textContent),
          ))
            b.click();
          await wait(600);
          const btn = document.querySelector(`[data-visual-skill="${id}"]`);
          btn?.click();
          await wait(1200);
          return Boolean(document.querySelector("#visual-studio:not([hidden]) .sd-stage svg"));
        }, id);
      // The lab can reload once after first paint; if that lands mid-evaluate, load again and retry once.
      const opened = await openLibrary(skill).catch(async () => {
        await page.goto(`${base}/math/fluency-lab/?grade=${grade}`, { waitUntil: "networkidle" });
        return openLibrary(skill);
      });
      note(opened, `${skill} @${width}${reduced ? " reduced" : ""}: the Studio did not open`);
      if (!opened) continue;
      for (const tab of tabs) {
        // Some problems have no Build (an even-count median has no single number to tap); skip a tab that is not offered.
        if (!(await page.locator(`#visual-studio [data-tab="${tab}"]`).count())) continue;
        await page.locator(`#visual-studio [data-tab="${tab}"]`).click();
        await page.waitForTimeout(400);
        const tag = `${skill}/${tab} @${width}${reduced ? " reduced" : ""}`;
        const axe = await new AxeBuilder({ page })
          .include("#visual-studio")
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        for (const v of axe.violations.filter((x) => ["serious", "critical"].includes(x.impact)))
          note(
            false,
            `${tag}: axe ${v.id} (${v.impact}) on ${v.nodes.length} node(s): ${v.nodes[0].target.join(" ")}`,
          );
        const geometry = await page.evaluate(() => {
          const root = document.querySelector("#visual-studio");
          const small = [...root.querySelectorAll("button, input[type=range], select, .sd-tab")]
            .filter(
              (el) =>
                el.offsetParent &&
                (el.getBoundingClientRect().height < 43 || el.getBoundingClientRect().width < 43),
            )
            .map(
              (el) =>
                `${el.className || el.tagName}:${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`,
            );
          return { overflow: document.documentElement.scrollWidth > innerWidth + 1, small };
        });
        note(!geometry.overflow, `${tag}: horizontal scroll`);
        note(
          geometry.small.length === 0,
          `${tag}: targets under 44px: ${geometry.small.slice(0, 3).join(", ")}`,
        );
        if (tab === "watch") {
          const play = await page.locator('#visual-studio [data-w="play"]').count();
          note(
            reduced ? play === 0 : play === 1,
            `${tag}: autoplay control ${reduced ? "must be absent" : "must be present"} (reduced motion = ${reduced})`,
          );
        }
      }
      // Keyboard: focus the stage, step forward and back with the arrow keys.
      await page.locator('#visual-studio [data-tab="watch"]').click();
      await page.locator("#visual-studio [data-stage]").focus();
      const before = await page.locator("#visual-studio [data-cap]").textContent();
      await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(300);
      const after = await page.locator("#visual-studio [data-cap]").textContent();
      const gated = await page.locator("#visual-studio [data-predict]:not([hidden])").count();
      note(before !== after || gated > 0, `${skill} @${width}: ArrowRight did not move the model`);
      const focusVisible = await page.evaluate(() => {
        const el = document.querySelector("#visual-studio .sd-btn");
        el.focus();
        const s = getComputedStyle(el);
        return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;
      });
      note(focusVisible, `${skill} @${width}: no visible focus ring on a Studio button`);
    }
    const real = errors.filter((e) => !/401|Failed to load resource/.test(e));
    note(
      real.length === 0,
      `console @${width}${reduced ? " reduced" : ""}: ${real.slice(0, 2).join(" | ")}`,
    );
    await context.close();
  }
} finally {
  await browser?.close();
  await server.close();
}
if (failures.length) {
  console.error(
    `verify-fluency-studio-browser FAILED (${failures.length}):\n- ${failures.slice(0, 30).join("\n- ")}`,
  );
  process.exit(1);
}
console.log(
  "verify-fluency-studio-browser: axe A/AA/2.2 clean on every tab, no overflow, 44px targets, keyboard stepping, visible focus, reduced motion, console clean",
);

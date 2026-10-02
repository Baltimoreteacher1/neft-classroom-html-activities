#!/usr/bin/env node
// Run against an isolated local preview: BASE=http://127.0.0.1:4189 node tools/access-lab-accessibility.mjs
// Uses a fresh browser context and synthetic draft data only.
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const base = process.env.BASE || "http://127.0.0.1:4189";
const output = "reports/access-lab-upgrade";
await mkdir(output, { recursive: true });
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const context = await browser.newContext();
const page = await context.newPage();
const results = [];
const failures = [];
const check = (condition, name) => {
  results.push({ name, pass: Boolean(condition) });
  if (!condition) failures.push(name);
  console.log(`${condition ? "PASS" : "FAIL"} ${name}`);
};
const go = async (path) => {
  await page.goto(`${base}/access-practice-lab/${path}`, { waitUntil: "networkidle" });
  await page.waitForSelector("#app h1");
};
try {
  for (const width of [375, 1366])
    for (const scale of [1, 2])
      for (const route of ["", "library"]) {
        await page.setViewportSize({ width, height: 900 });
        await go(route);
        await page.evaluate(
          (size) => document.documentElement.style.setProperty("--lab-scale", String(size)),
          scale,
        );
        const name = `${route || "home"}-${width}-${scale * 100}`;
        check(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
          `${name}: no horizontal overflow`,
        );
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        const serious = axe.violations.filter((v) => ["critical", "serious"].includes(v.impact));
        check(serious.length === 0, `${name}: no serious/critical WCAG axe violations`);
        await writeFile(
          `${output}/${name}-axe.json`,
          JSON.stringify({ violations: axe.violations, passes: axe.passes.length }, null, 2),
        );
        await page.screenshot({ path: `${output}/${name}.png`, fullPage: false });
      }

  await page.setViewportSize({ width: 1366, height: 900 });
  await go("");
  await page.locator("#planFocus").focus();
  await page.selectOption("#planFocus", "Writing");
  await page.waitForFunction(() =>
    [...document.querySelectorAll(".session-domain")].every((e) =>
      e.textContent.includes("Writing"),
    ),
  );
  check(
    await page.evaluate(() => document.activeElement.id === "planFocus"),
    "planner focus preserved after changing selection",
  );
  await page.reload({ waitUntil: "networkidle" });
  check((await page.inputValue("#planFocus")) === "Writing", "planner preference survives reload");

  await go("library?grades=6-8");
  await page.locator("#librarySearch").fill("water");
  check(
    await page.evaluate(() => document.activeElement.id === "librarySearch"),
    "search keeps keyboard focus while filtering",
  );
  check(
    (await page.locator(".library-item").count()) > 0,
    "topic search finds relevant activities",
  );
  const pick = page.locator("[data-pick]").first();
  const id = await pick.getAttribute("data-pick");
  await pick.focus();
  await page.keyboard.press("Enter");
  check(
    await page.evaluate((wanted) => document.activeElement.dataset.pick === wanted, id),
    "adding activity preserves keyboard focus",
  );
  const link = await page.inputValue("#assignmentLink");
  check(new URL(link).searchParams.get("ids") === id, "assignment link contains chosen content ID");
  check(!/answers|studentName|notes/.test(link), "assignment URL contains no response fields");
  await page.locator("#librarySearch").fill("zzzz-no-matching-topic");
  check(
    await page.getByRole("heading", { name: "No matching activities" }).isVisible(),
    "empty search offers recovery",
  );
  await page.locator("[data-clear-filters]").click();
  check((await page.locator(".library-item").count()) > 0, "clear filters restores activity list");
  check(
    await page.evaluate(() => document.activeElement !== document.body),
    "clearing filters leaves keyboard focus in app",
  );
  await page.locator("[data-clear-set]").click();
  check(
    await page.evaluate(() => document.activeElement.id === "librarySearch"),
    "clear set returns focus to search",
  );

  // Draft fixture is created in this throwaway context, never in user storage.
  // Use an actual current content ID for a reliable fixture across content versions.
  const draftId = await page.evaluate(async () => {
    const index = await (await fetch("/access-practice-lab/content/index.json")).json();
    const id = index.bands["6-8"].domains.Writing.levels.A.activities[2][0];
    localStorage.setItem(
      "accessPracticeLab:v1:Writing:A",
      JSON.stringify({
        complete: [],
        answers: {},
        notes: { [id]: "Synthetic draft" },
        results: {},
      }),
    );
    return id;
  });
  await go("");
  check(
    (await page.locator(".session-list a").first().getAttribute("href")).endsWith(draftId),
    "home resumes synthetic unfinished draft first",
  );
} finally {
  await writeFile(
    `${output}/accessibility-summary.json`,
    JSON.stringify({ results, failures }, null, 2),
  );
  await browser.close();
}
assert.equal(failures.length, 0, failures.join("\n"));
console.log(`access-lab-accessibility: PASS (${results.length} checks)`);

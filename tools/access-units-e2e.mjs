#!/usr/bin/env node
/**
 * Browser walk of /access-practice-lab/units: hub, overview with its map, a lesson worked the way a student works it
 * (a wrong answer stays crossed out and never shows the answer, the right one finishes it, the draft survives a
 * reload), the project, certificate gating, the printable packet, and every page of both bands at 320 / 1366px with
 * 140% text in bilingual mode: no horizontal scroll, no console errors, axe WCAG 2.2 AA. SKIP locally without a browser.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CONTENT_DIR } from "./lib/access-lab-content.mjs";
import { serveAccess } from "./lib/access-serve.mjs";

const ENGINE = process.env.E2E_BROWSER || "chromium";
let engine;
let AxeBuilder;
try {
  engine = (await import("playwright"))[ENGINE];
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-units-e2e: SKIP, playwright or axe missing");
  process.exit(process.env.CI ? 1 : 0);
}
const { server, base } = await serveAccess();
let browser;
try {
  browser = await engine.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (e) {
  console.warn(`access-units-e2e: SKIP, no browser (${e.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}
const bands = {
  "6-8": JSON.parse(readFileSync(join(CONTENT_DIR, "units/g6-8.json"), "utf8")).units,
  "3-5": JSON.parse(readFileSync(join(CONTENT_DIR, "units/g3-5.json"), "utf8")).units,
};
const failures = [];
const ok = (c, m) => {
  if (!c) failures.push(m);
  console.log(`${c ? "PASS" : "FAIL"} ${m}`);
};
const noise =
  /web-vitals|Failed to resolve module specifier|Failed to load resource|ERR_ABORTED|speechSynthesis|downloadable font|serviceWorker/i;
const url = (band, ...parts) =>
  `${base}/access-practice-lab/units${parts.length ? `/${parts.join("/")}` : ""}?grades=${band}`;

async function open(width, lang = "en", scale = 1) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  await ctx.addInitScript(
    ({ lang: l, scale: s }) => {
      localStorage.setItem(
        "accessPracticeLab:v1:prefs",
        JSON.stringify({ lang: l, textSize: s, band: "6-8" }),
      );
    },
    { lang, scale },
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => !noise.test(e.message) && errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !noise.test(m.text()) && errors.push(m.text()));
  return { ctx, page, errors };
}
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// ── the student path (6-8, English, 1366px) ────────────────────────────────────────────────────
{
  const u = bands["6-8"][0];
  const { ctx, page, errors } = await open(1366);
  await page.goto(url("6-8"), { waitUntil: "networkidle" });
  ok((await page.locator(".un-card").count()) === bands["6-8"].length, "hub lists every 6-8 unit");
  await page.locator(`a.un-card[href*="/units/${u.id}"]`).click();
  await page.waitForSelector(".un-map-wide a.un-stop");
  ok((await page.locator(".un-map-wide a.un-stop").count()) === 7, "map has 7 stops");
  ok(
    (await page.locator(".un-map-tall").isHidden()) === true,
    "the tall map is hidden on a wide screen",
  );
  await page.locator(".un-lesson-card a").first().click();
  await page.waitForSelector(".un-step");
  ok(
    (await page.locator(".un-step").count()) === u.lessons[0].steps.length,
    "lesson 1 shows every step",
  );
  const readStep = u.lessons[0].steps.find((s) => s.t === "read" || s.t === "listen");
  const q = u.texts[readStep.text].questions[0];
  const wrong = q.choices.findIndex((_, i) => i !== q.answer);
  if (readStep.t === "listen") await page.locator(`[data-u-show="${readStep.text}"]`).click();
  await page.locator(`[data-u-ans="${readStep.text}:0|${wrong}"]`).click();
  ok(
    (await page.locator(`[data-u-ans="${readStep.text}:0|${wrong}"]`).isDisabled()) === true,
    "a wrong choice is crossed out",
  );
  ok(
    (await page.locator(".un-choice.is-right").count()) === 0,
    "the answer is not shown after a miss",
  );
  await page.locator(`[data-u-ans="${readStep.text}:0|${q.answer}"]`).click();
  ok((await page.locator(".un-choice.is-right").count()) === 1, "the right choice is marked");
  // a key word opens its card
  const term = page.locator(".un-term").first();
  if (await term.count()) {
    await term.click();
    ok(
      (await page.locator("#unTermCard .un-es, #unTermCard [lang=es]").count()) > 0,
      "a key word shows its Spanish",
    );
  }
  // a writing draft survives a reload
  const wl = u.lessons.find((l) => l.steps.some((s) => s.t === "write"));
  await page.goto(url("6-8", u.id, wl.id), { waitUntil: "networkidle" });
  const w = wl.steps.find((s) => s.t === "write");
  await page
    .locator(`[data-u-draft="${w.task}"]`)
    .fill("Wind turns a turbine, and the turbine makes electricity for many homes.");
  await page.reload({ waitUntil: "networkidle" });
  ok(
    (await page.locator(`[data-u-draft="${w.task}"]`).inputValue()).includes("turbine"),
    "the draft survives a reload",
  );
  ok(
    /words\. Aim for about/.test(await page.locator(`[data-u-count^="${w.task}|"]`).innerText()),
    "the word count is a guide, not a score",
  );
  // the certificate does not exist before the work is done
  await page.goto(url("6-8", u.id, "certificate"), { waitUntil: "networkidle" });
  ok(
    (await page.locator(".un-lock").count()) === 1 &&
      (await page.locator(".un-cert").count()) === 0,
    "no certificate before the unit is finished",
  );
  // the packet prints as a document
  await page.goto(url("6-8", u.id, "packet"), { waitUntil: "networkidle" });
  await page.emulateMedia({ media: "print" });
  ok(
    (await page.locator("[data-print]").first().isHidden()) === true,
    "print hides the print button",
  );
  ok((await page.locator(".un-pk-lesson").count()) === 5, "the packet has all five lessons");
  ok(
    errors.length === 0,
    `no console errors on the student path${errors.length ? `: ${errors[0]}` : ""}`,
  );
  await ctx.close();
}

// ── every page of both bands: overflow, console, axe ───────────────────────────────────────────
for (const [width, lang, scale] of [
  [1366, "en", 1],
  [320, "bi", 1.4],
]) {
  const { ctx, page, errors } = await open(width, lang, scale);
  for (const [band, list] of Object.entries(bands)) {
    const pages = [
      [band],
      ...list.flatMap((u) => [
        [band, u.id],
        [band, u.id, "1"],
        [band, u.id, "task"],
        [band, u.id, "packet"],
      ]),
    ];
    const sample = process.env.UNITS_FULL ? pages : pages.filter((_, i) => i % 3 === 0 || i < 5);
    for (const parts of sample) {
      await page.goto(url(parts[0], ...parts.slice(1)), { waitUntil: "networkidle" });
      await page.waitForSelector("h1");
      const extra = await overflow(page);
      ok(
        extra <= 1,
        `${width}px ${lang} ${parts.slice(1).join("/") || "hub"} ${band}: no horizontal scroll (${extra}px)`,
      );
    }
    // axe on the pages with the most structure
    const axePages = process.env.UNITS_FULL
      ? list.flatMap((u) => [
          [band, u.id],
          ...u.lessons.map((l) => [band, u.id, l.id]),
          [band, u.id, "task"],
        ])
      : [
          [band, list[0].id],
          [band, list[0].id, "2"],
          [band, list[0].id, "task"],
        ];
    for (const parts of axePages) {
      await page.goto(url(parts[0], ...parts.slice(1)), { waitUntil: "networkidle" });
      await page.waitForSelector("h1");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact));
      ok(
        bad.length === 0,
        `${width}px ${lang} axe ${parts.slice(1).join("/")}${bad.length ? `: ${bad.map((v) => `${v.id} (${v.nodes[0]?.target})`).join(", ")}` : ""}`,
      );
    }
  }
  ok(
    errors.length === 0,
    `${width}px ${lang}: no console errors${errors.length ? `: ${errors[0]}` : ""}`,
  );
  await ctx.close();
}

// the tall map is the one a phone sees, and its stops are big enough to tap
{
  const { ctx, page } = await open(320);
  await page.goto(url("3-5", bands["3-5"][0].id), { waitUntil: "networkidle" });
  ok(await page.locator(".un-map-tall").isVisible(), "the tall map shows on a phone");
  const box = await page.locator(".un-map-tall .un-stop").first().boundingBox();
  ok(box && box.width >= 40, `phone map stops are at least 40px (${box?.width}px)`);
  await ctx.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\nFAIL access-units-e2e: ${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("PASS access-units-e2e");

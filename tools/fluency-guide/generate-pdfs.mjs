#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
/**
 * Explicitly regenerate the committed Fluency & Readiness print packets.
 * Run AFTER node tools/fluency-guide/build.mjs; never called by tests/build.
 * Requires existing Playwright Chromium and Poppler (pdfinfo/pdftotext).
 * PDF metadata includes the generation time; verify content/pages, not byte hashes.
 */
import { chromium } from "playwright";

const toolDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(toolDir, "../..");
const destination = join(root, "curriculum/fluency/teacher/printables");
const staging = join(root, ".qa-logs/fluency-pdfs");
const teacherFile = join(root, "curriculum/fluency/teacher/index.html");
// Fail before changing any committed output when local prerequisites are absent.
readFileSync(teacherFile, "utf8");
execFileSync("pdfinfo", ["-v"], { stdio: "ignore" });
execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
mkdirSync(staging, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Keep the public print API's DOM preparation; suppress native print dialogs.
  await page.addInitScript(() => {
    window.print = () => {};
  });
  const url = pathToFileURL(teacherFile);
  url.hash = "view=studio&lesson=2-1&mode=worksheet&level=core";
  await page.goto(url.href, { waitUntil: "load" });
  await page.waitForFunction(() => Boolean(window.FluencyStudio?.printUnitPack));
  const units = await page.evaluate(() => {
    const data = window.FluencyData;
    if (!data) throw new Error("The generated guide's lesson bank is missing.");
    return data.units.map((unit) => ({ number: unit.number, lessons: unit.lessons.length }));
  });
  if (units.length !== 8 || units.reduce((n, u) => n + u.lessons, 0) !== 54)
    throw new Error("Expected the reviewed 8 units and 54 lessons before printing.");
  await page.emulateMedia({ media: "print" });

  async function capture(name, expectedPages, isKey) {
    await page.evaluate(() => document.fonts.ready);
    const sheets = await page.locator("#studio-print .sheet").count();
    if (sheets !== expectedPages)
      throw new Error(
        `${name}: expected ${expectedPages} prepared sheets; found ${sheets}. Check the core-level route.`,
      );
    const file = join(staging, name);
    await page.pdf({
      path: file,
      format: "Letter",
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
      tagged: true,
      outline: true,
    });
    const info = execFileSync("pdfinfo", [file], { encoding: "utf8" });
    const pages = Number(info.match(/^Pages:\s+(\d+)/m)?.[1]);
    if (pages !== expectedPages)
      throw new Error(
        `${name}: ${pages} PDF pages for ${expectedPages} sheets. Inspect overflow before publishing.`,
      );
    const text = execFileSync("pdftotext", [file, "-"], {
      encoding: "utf8",
      maxBuffer: 5 * 1024 * 1024,
    });
    if (!text.trim()) throw new Error(`${name}: extracted text is empty.`);
    if (isKey && !/TEACHER.*KEY|WORKED KEY/i.test(text))
      throw new Error(`${name}: teacher-key label is missing.`);
    if (!isKey && /TEACHER WORKED KEY|TEACHER FACILITATION KEY|Answer:/i.test(text))
      throw new Error(`${name}: a student packet contains teacher-key content.`);
    results.push({
      name,
      pages,
      audience: isKey ? "teacher" : "student",
      tagged: /^Tagged:\s+yes/m.test(info),
    });
  }

  for (const unit of units) {
    for (const key of [false, true]) {
      await page.evaluate(({ number, key }) => window.FluencyStudio.printUnitPack(number, key), {
        number: unit.number,
        key,
      });
      await capture(
        `unit-${unit.number}-${key ? "teacher-keys" : "worksheets"}.pdf`,
        unit.lessons * 2,
        key,
      );
    }
  }
  await page.evaluate(() => window.FluencyStudio.printAllDrills(false));
  await capture("core-skill-drills.pdf", 12, false);
  if (errors.length) throw new Error(`Page errors during generation: ${errors.join(" | ")}`);
  // Replace committed PDFs only after all 17 staged packets pass structural checks.
  for (const item of results) copyFileSync(join(staging, item.name), join(destination, item.name));
  console.log(
    JSON.stringify(
      { packets: results.length, pages: results.reduce((n, x) => n + x.pages, 0), results },
      null,
      2,
    ),
  );
  console.log(
    "Rendered-page inspection is still required; structural checks do not certify visual layout or PDF accessibility.",
  );
} finally {
  await browser.close();
}

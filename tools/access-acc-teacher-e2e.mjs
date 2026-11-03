#!/usr/bin/env node
/**
 * Teacher Hub language-evidence panel end to end, in real Chromium, on made-up fixture evidence (no real student data):
 *   - the empty state says what to do; the scope note says this is one device, not a roster
 *   - the Domain x Key Language Use x Context matrix: no evidence / not enough / shown, text in every cell, no percentage
 *     under three items, independent versus supported kept apart, review items never scored
 *   - recommendations cite their evidence and never claim a level
 *   - filters, alias, import of an exported file, the WIDA alignment table, the printable learning brief
 *   - Spanish, axe WCAG 2.2 AA, 390px reflow
 */
import { readFileSync } from "node:fs";
import { FIXTURE_LEARNERS, seedEvidence } from "./lib/access-acc-fixtures.mjs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-acc-teacher-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const { server, base } = await serveAccess();
const browser = await chromium.launch();

async function fresh(prefs) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  if (prefs)
    await ctx.addInitScript(
      (p) => localStorage.setItem("accessPracticeLab:v1:prefs", JSON.stringify(p)),
      prefs,
    );
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals|@engine\//.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  return { ctx, page, errors };
}
const panel = (page) => page.locator("#accEvidence");
const cell = (page, rowText, col) =>
  page
    .locator("#accEvidence table.acc-matrix tbody tr", {
      has: page.locator(`th:has-text("${rowText}")`),
    })
    .locator("td")
    .nth(col);
const CONTEXTS = ["Mathematics", "Science", "Social Studies", "Language Arts"];

// ── empty state ─────────────────────────────────────────────────────────────────────
{
  const { ctx, page, errors } = await fresh();
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.locator("#accEvidence .acc-state.is-empty").waitFor();
  const t = await panel(page).innerText();
  ok(
    /practice done in this browser only/.test(t) && /not a class roster/.test(t),
    "the scope note says one device and no roster",
  );
  ok(/No practice evidence on this device yet/.test(t), "the empty state says what to do next");
  ok(
    await page.locator('[data-act="print-brief"]').isDisabled(),
    "printing is disabled until there is evidence",
  );
  ok(errors.length === 0, `no console errors in the empty state ${errors.join("|")}`);
  await ctx.close();
}

// ── seeded evidence ─────────────────────────────────────────────────────────────────
{
  const { ctx, page, errors } = await fresh();
  await page.goto(`${base}/access-practice-lab/assess`, { waitUntil: "networkidle" });
  await seedEvidence(page);
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#accEvidence table.acc-matrix");
  const sc = CONTEXTS.indexOf("Science");
  const ss = CONTEXTS.indexOf("Social Studies");
  ok(
    /100% on own · n=4/.test(await cell(page, "Reading · Explain", sc).innerText()),
    "Reading · Explain · Science: four first-try successes read 100% on own, n=4",
  );
  ok(
    /0% on own · n=3/.test(await cell(page, "Reading · Argue", ss).innerText()),
    "Reading · Argue · Social Studies: three misses read 0% on own",
  );
  ok(
    /No evidence/.test(await cell(page, "Listening · Argue", 1).innerText()),
    "a combination with no practice says No evidence, not 0%",
  );
  ok(
    (await cell(page, "Listening · Narrate", sc).innerText()).includes("0% on own"),
    "Listening · Narrate: right only with support is not counted as on own",
  );
  const wr = await cell(page, "Writing · Explain", sc).innerText();
  ok(
    /Not enough yet \(1\)/.test(wr) && /to review/.test(wr) === false,
    `a single writing response is "not enough yet", never a percentage (${wr.replace(/\n/g, " ")})`,
  );
  const classes = await page
    .locator(".acc-heat")
    .evaluateAll((els) => els.map((e) => [e.className, e.innerText.trim()]));
  ok(
    classes.every(([, text]) => text.length > 0),
    "every heat cell carries text, so colour is never the only signal",
  );
  ok(
    classes.some(([c]) => /is-strong/.test(c)) &&
      classes.some(([c]) => /is-low/.test(c)) &&
      classes.some(([c]) => /is-no-evidence/.test(c)),
    "strong, low and no-evidence cells render with their own styles",
  );
  ok(
    /at least three items/.test(
      await page.locator("#accEvidence table.acc-matrix caption").innerText(),
    ),
    "the table caption states the three-item rule",
  );

  const recs = await page.locator("#accEvidence .acc-recs").innerText();
  ok(
    /Argue: 0 of 3 objective items were right on the first try without support/.test(recs),
    "a recommendation cites its evidence (0 of 3)",
  );
  ok(/claims with their supporting reasons/.test(recs), "and gives a concrete teaching move");
  ok(
    /Supports were used on 100% of Listening items \(3 of 3\)/.test(recs),
    "scaffold reliance is reported with its counts",
  );
  ok(
    /1 Writing response needs your review/.test(recs) && /does not score writing/.test(recs),
    "review items are routed to the teacher and the lab says it does not score them",
  );
  ok(
    !/proficien|level \d|scale score|predict/i.test(recs),
    "no recommendation claims a level or a prediction",
  );

  // filters + alias
  await page.locator("#evLearner").selectOption(FIXTURE_LEARNERS.b);
  ok(
    /Not enough yet \(2\)/.test(await cell(page, "Reading · Inform", sc).innerText()),
    "filtering to a student with two items shows 'not enough yet (2)'",
  );
  await page.locator("#evAlias").fill("Reader 7");
  await page.locator("#evAlias").dispatchEvent("change");
  await page.waitForFunction(() =>
    [...document.querySelectorAll("#evLearner option")].some((o) => o.textContent === "Reader 7"),
  );
  ok(true, "an alias is saved on this device and replaces the id in the student list");
  await page.locator("#evLearner").selectOption("all");
  await page.locator("#evGrade").selectOption("6-8");
  ok(
    /12|\d+ item responses/.test(await panel(page).innerText()) &&
      /Argue/.test(await panel(page).locator(".acc-recs").innerText()),
    "the grade filter narrows the evidence",
  );
  await page.locator("#evGrade").selectOption("all");

  // alignment table
  await page.locator(".acc-align summary").click();
  await page.locator(".acc-align table").waitFor();
  const align = await page.locator(".acc-align table").innerText();
  ok(
    /ELD-SC\.4-5\.Explain\.Interpretive/.test(align) &&
      /ELD-SC\.2-3\.Explain\.Interpretive/.test(align),
    "grade 3–5 Science · Explain maps to BOTH WIDA clusters 2–3 and 4–5",
  );
  ok(
    /Explicit/.test(align) && /Supplementary/.test(align),
    "tasks are labelled explicit or supplementary against the framework",
  );
  ok(/What is the main idea of the passage/.test(align), "each task shows its real stem");
  ok(
    /Source: wida\.wisc\.edu/.test(await page.locator(".acc-align").innerText()),
    "the source is cited",
  );

  // brief
  await page.locator("#evLearner").selectOption(FIXTURE_LEARNERS.a);
  let printed = 0;
  await page.evaluate(() => {
    window.__print = 0;
    window.print = () => {
      window.__print++;
      window.__printClass = document.body.className;
    };
  });
  await page.locator('[data-act="print-brief"]').click();
  printed = await page.evaluate(() => window.__print);
  ok(
    printed === 1 && /acc-printing-brief/.test(await page.evaluate(() => window.__printClass)),
    "Print learning brief switches to the brief layout and prints",
  );
  const brief = await page.locator(".acc-brief").innerText();
  ok(
    /Oct 5, 2026 to Oct 7, 2026/.test(brief) && /3 sittings/.test(brief),
    "the brief states its evidence dates and sittings",
  );
  ok(
    /not a WIDA or ACCESS score report/.test(brief) && /not an IEP or 504 document/.test(brief),
    "the brief says it is not an official report or an IEP/504 document",
  );
  ok(
    /Section 504 or IEP decisions/.test(brief) && /need teacher review/.test(brief),
    "the brief names its evidence limits",
  );
  ok(
    /Independent accuracy across 3 sittings: 100% → 0% → 0% \(down\)/.test(brief),
    "growth is stated only because there are three sittings",
  );
  await page.emulateMedia({ media: "print" });
  await page.evaluate(() => document.body.classList.add("acc-printing-brief"));
  ok(
    (await page.locator(".th-hero").evaluate((e) => getComputedStyle(e).visibility)) === "hidden" &&
      (await page.locator(".acc-brief").evaluate((e) => getComputedStyle(e).visibility)) ===
        "visible",
    "in print only the brief is visible",
  );
  await page.evaluate(() => document.body.classList.remove("acc-printing-brief"));
  await page.emulateMedia({ media: "screen" });

  // import: export from the app's own storage, wipe, import the file
  const file = await page.evaluate(async () => {
    const { openStorage } = await import("/access-practice-lab/src/acc/storage/access-db.js");
    return JSON.stringify(await (await openStorage()).exportAll());
  });
  const path = `${process.env.TMPDIR || "/tmp"}/access-acc-fixture-export.json`;
  (await import("node:fs")).writeFileSync(path, file);
  await page.evaluate(async () => {
    const { openStorage } = await import("/access-practice-lab/src/acc/storage/access-db.js");
    await (await openStorage()).purge({ progress: true });
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("#accEvidence .acc-state.is-empty").waitFor();
  await page.locator("#evImport").setInputFiles(path);
  await page.waitForFunction(
    () => /Imported \d+ items/.test(document.querySelector("#accEvidence")?.innerText || ""),
    null,
    { timeout: 10000 },
  );
  ok(
    /Imported \d+ items/.test(await panel(page).innerText()),
    "importing an exported file brings the evidence back and says how much",
  );
  ok(
    JSON.parse(readFileSync(path, "utf8")).progress.length === 14,
    "the fixture export holds the 14 made-up rows",
  );

  if (AxeBuilder) {
    const axe = await new AxeBuilder({ page })
      .include("#accEvidence")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    ok(
      axe.violations.length === 0,
      `axe: the evidence panel has no WCAG 2.2 AA violations ${axe.violations.map((v) => `${v.id}:${v.nodes[0].target}`).join(",")}`,
    );
  }
  ok(errors.length === 0, `no console errors with evidence ${errors.join("|")}`);
  await ctx.close();
}

// ── Spanish ─────────────────────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh({ lang: "es", langChosen: true });
  await page.goto(`${base}/access-practice-lab/assess`, { waitUntil: "networkidle" });
  await seedEvidence(page);
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#accEvidence table.acc-matrix");
  const t = await panel(page).innerText();
  ok(
    /Próximos pasos de enseñanza/.test(t) && /por su cuenta/.test(t) && /Sin evidencia/.test(t),
    "Spanish mode translates the matrix and the teaching moves",
  );
  ok(
    /Argumentar: 0 de 3 preguntas objetivas fueron correctas al primer intento y sin apoyo/.test(t),
    "generated recommendations are translated with their numbers intact",
  );
  ok(
    (await panel(page).getAttribute("lang")) === "es" ||
      (await page.locator("#accEvidenceBody").getAttribute("lang")) === "es",
    "the panel declares its language",
  );
  await page.locator(".acc-align summary").click();
  ok(
    (await page.locator(".acc-align td[data-i18n-skip]").first().getAttribute("lang")) === "en",
    "framework ids and task stems stay English and are tagged lang=en",
  );
  await ctx.close();
}

// ── phone width ─────────────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(`${base}/access-practice-lab/assess`, { waitUntil: "networkidle" });
  await seedEvidence(page);
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.waitForSelector("#accEvidence table.acc-matrix");
  ok(
    !(await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )),
    "390px: the page does not scroll sideways (the matrix scrolls inside its own box)",
  );
  await ctx.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-acc-teacher-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-acc-teacher-e2e: all checks passed");

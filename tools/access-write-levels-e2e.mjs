#!/usr/bin/env node
/* =============================================================================
 * access-write-levels-e2e.mjs — leveled writing assignments, driven in a real browser.
 *
 * Student page at levels 1, 3 and 5 (frames and Spanish words vs starters vs nothing), a bad ?level= changing nothing, the
 * teacher's six link buttons and printable sheets, the six-level comparison, the Hub assignment builder, axe WCAG 2.2 AA, and
 * no learner-facing level name or score claim. No Chromium: SKIP (exit 3 locally, 1 in CI); never a pass.
 * ========================================================================== */
import { openHubSections } from "./lib/access-hub.mjs";
import { serveAccess } from "./lib/access-serve.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const { chromium } = await import("playwright");
let AxeBuilder = null;
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-write-levels-e2e: axe-core/playwright is not installed; skipping axe.");
}
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch {
  process.exit(skipExit("no Chromium available", "Set PW_CHROMIUM_PATH to a system Chromium"));
}
let failed = 0;
const fail = (m) => {
  failed++;
  console.error(`  FAIL  ${m}`);
};
const ok = (m) => console.log(`  ok    ${m}`);
const check = (c, m) => (c ? ok(m) : fail(m));

const { server, base } = await serveAccess();
const LAB = `${base}/access-practice-lab`;
const TASK = "wrt-mulch-cer";

async function open(audience, width = 1280) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  await ctx.addInitScript(
    ([a]) => {
      localStorage.setItem(
        "accessPracticeLab:v1:prefs",
        JSON.stringify({ lang: "en", langChosen: true }),
      );
      if (a)
        localStorage.setItem(
          "accessPracticeLab:v1:audience",
          JSON.stringify({ audience: a, role: "" }),
        );
    },
    [audience],
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
async function axe(page, label, include) {
  if (!AxeBuilder) return;
  const r = await new AxeBuilder({ page })
    .include(include)
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  check(
    !bad.length,
    `${label}: axe serious/critical 0 ${bad.map((v) => `${v.id}:${v.nodes[0].target.join(" ")}`).join(" | ")}`,
  );
}
const goto = async (page, url, sel) => {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector(sel, { timeout: 20000 });
};

// 1. the student page at three levels
{
  const { ctx, page, errors } = await open("student");
  const seen = {};
  for (const n of [1, 3, 5]) {
    await goto(page, `${LAB}/write/${TASK}?grades=6-8&level=${n}`, ".level-banner");
    seen[n] = {
      banner: await page.locator(".level-banner").innerText(),
      panel: await page.locator(".level-supports").innerText(),
      meter: await page.locator("[data-meter]").first().innerText(),
      chips: await page.locator(".level-supports [data-insert]").count(),
      es: await page.locator(".level-supports [lang=es]").count(),
    };
    check(
      new RegExp(`Support level ${n}\\b`).test(seen[n].banner),
      `level ${n}: the banner names the level number`,
    );
    check(
      !/Entering|Emerging|Developing|Expanding|Bridging|Reaching|WIDA level \d/.test(
        seen[n].banner + seen[n].panel,
      ),
      `level ${n}: a learner sees no level name`,
    );
    check(
      /not an official WIDA proficiency level/.test(seen[n].banner),
      `level ${n}: the banner says it is not an official level`,
    );
  }
  check(
    /Sentence frames/.test(seen[1].panel) &&
      seen[1].es >= 3 &&
      /model response/i.test(seen[1].panel),
    "level 1: frames, Spanish words and directions, and a model",
  );
  check(
    /Sentence starters/.test(seen[3].panel) && !/model response/i.test(seen[3].panel),
    "level 3: starters, no model",
  );
  check(
    /no frames or word bank/i.test(seen[5].panel) && seen[5].chips === 0,
    "level 5: no frames or word bank to insert",
  );
  check(
    seen[1].chips < 20 && seen[1].chips > seen[5].chips,
    "level 1 offers insertable help; level 5 offers none",
  );
  const lo = (s) => Number(/about (\d+)/.exec(s)[1]);
  check(
    lo(seen[1].meter) < lo(seen[3].meter) && lo(seen[3].meter) < lo(seen[5].meter),
    `the length target rises with the level (${lo(seen[1].meter)}, ${lo(seen[3].meter)}, ${lo(seen[5].meter)})`,
  );

  // a frame can be tapped into the draft at level 1
  await goto(page, `${LAB}/write/${TASK}?grades=6-8&level=1`, ".level-supports");
  await page.locator(".level-supports .frames [data-insert]").first().click();
  check(
    /I claim that mulch/.test(await page.locator("#wrt-draft").inputValue()),
    "level 1: tapping a frame adds it to the draft",
  );
  // choosing "On my own" swaps the level panel for the usual one, and says so
  await page
    .locator('input[data-stage][value="independent"]')
    .check({ force: true })
    .catch(() => {});
  await page.waitForTimeout(400);
  check(
    (await page.locator(".level-banner").innerText()).includes("different help setting") ||
      (await page.locator(".level-supports").count()) === 0,
    "choosing another help setting is respected",
  );
  await axe(page, "student page", "main");
  check(!errors.length, `no console errors ${errors.join("|")}`);
  await ctx.close();
}

// 2. a bad level changes nothing
{
  const { ctx, page } = await open("student");
  for (const bad of ["0", "7", "x", "3%203"]) {
    await goto(page, `${LAB}/write/${TASK}?grades=6-8&level=${bad}`, ".write-studio");
    check((await page.locator(".level-banner").count()) === 0, `?level=${bad} shows no level`);
  }
  await ctx.close();
}

// 3. the teacher: six links, six sheets, one comparison
{
  const { ctx, page, errors } = await open("teacher");
  await goto(page, `${LAB}/write/${TASK}?grades=6-8`, ".write-studio");
  await page
    .locator(
      "details.teacher-notes > summary, #wrt-teacher summary, [data-d=wrt-teacher] > summary",
    )
    .first()
    .click()
    .catch(() => {});
  await page.waitForSelector(".teacher-levels", { timeout: 8000 });
  check((await page.locator(".level-rows li").count()) === 6, "the teacher sees six levels");
  const names = await page.locator(".level-name").allInnerTexts();
  check(
    ["Entering", "Emerging", "Developing", "Expanding", "Bridging", "Reaching"].every((w, i) =>
      names[i]?.includes(w),
    ),
    "the teacher sees the level names",
  );
  const links = await page
    .locator(".level-rows [data-copy-link]")
    .evaluateAll((els) => els.map((e) => e.dataset.copyLink));
  check(
    links.length === 6 &&
      links.every((l, i) => new URL(l).searchParams.get("level") === String(i + 1)),
    "each copy button carries its own level",
  );
  check(
    links.every((l) =>
      [...new URL(l).searchParams.keys()].every((k) => ["grades", "level"].includes(k)),
    ),
    "links carry only the grade band and the level",
  );
  await axe(page, "teacher levels", ".teacher-levels");
  await goto(page, `${LAB}/write/${TASK}?grades=6-8&sheet=level&level=2`, ".level-sheet");
  const sheet = await page.locator(".level-sheet").innerText();
  check(
    /Support level 2/.test(sheet) &&
      /Sentence frames/.test(sheet) &&
      (await page.locator(".level-sheet .sheet-line").count()) >= 6,
    "the level 2 sheet has frames and writing lines",
  );
  await axe(page, "level sheet", ".level-sheet");
  await goto(page, `${LAB}/write/${TASK}?grades=6-8&sheet=levels`, ".level-table");
  check(
    (await page.locator(".level-table tbody tr").count()) === 6,
    "the comparison table has six rows",
  );
  await axe(page, "level comparison", ".level-sheet");
  check(!errors.length, `no console errors ${errors.join("|")}`);
  await ctx.close();
}

// 4. the Teacher Hub assignment builder
{
  const { ctx, page, errors } = await open("");
  await page.goto(`${base}/access-teacher/`, { waitUntil: "networkidle" });
  await page.locator("#tab-plan").click();
  await openHubSections(page);
  await page.locator("#asKind").waitFor({ timeout: 10000 });
  await page.locator("#asGrade").selectOption("6-8");
  await page.waitForSelector("#asWriting", { timeout: 8000 });
  await page.locator("#asWriteTask").selectOption(TASK);
  await page.locator("#asWriteLevel").selectOption("2");
  const sheetHref = await page.locator("#asWriteSheet").getAttribute("href");
  check(
    /sheet=level&level=2/.test(sheetHref) && sheetHref.includes(TASK),
    "the print link follows the task and level",
  );
  const lis = await page.locator("#asWriteChanges li").allInnerTexts();
  check(lis.length === 4 && /3 sentences/.test(lis[0]), "the builder lists what level 2 changes");
  await page.locator("#asWriteLevel").selectOption("5");
  check(
    (await page.locator("#asWriteChanges li").first().innerText()).includes("Write about"),
    "level 5 asks for the full length",
  );
  await page
    .context()
    .grantPermissions(["clipboard-read", "clipboard-write"])
    .catch(() => {});
  await page.locator("#asWriteCopy").click();
  await page.waitForTimeout(200);
  const status = await page.locator("#asWriteStatus").innerText();
  check(/copied/i.test(status) || /level=5/.test(status), "copy gives the level 5 link");
  await axe(page, "hub writing assignment", "#asWriting");
  await page.locator("#asGrade").selectOption("3-5");
  await page.waitForTimeout(200);
  const g35 = await page.locator("#asWriteTask option").allInnerTexts();
  check(g35.length === 6, `grades 3-5 list their six writing tasks (${g35.length})`);
  check(!errors.length, `no console errors ${errors.join("|")}`);
  await ctx.close();
}

await browser.close();
server.close?.();
if (failed) {
  console.error(`access-write-levels-e2e: ${failed} failure(s)`);
  process.exit(1);
}
console.log("access-write-levels-e2e: all checks passed");

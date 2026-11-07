#!/usr/bin/env node
import { serveAccess } from "./lib/access-serve.mjs";
// The connective experience layer in a real browser: the daily warm-up from first tap to finished week pip, the
// search palette (keyboard, Spanish, focus return), the header search box, the portfolio and family-share view,
// the collection book, print styles, and reflow at 320px and 1366px with 140% bilingual text. Exit 3 when no browser.
import { exitSkipped } from "./lib/skip-exit.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  exitSkipped(
    "Playwright is not installed for the experience check.",
    "Install the locked project dependencies.",
  );
}
let AxeBuilder = null;
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}

const { server, base } = await serveAccess({});
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const failures = [];
const check = (ok, label) => {
  (ok ? console.log : console.error)(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failures.push(label);
};
const P = "accessPracticeLab:v1";
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

async function open(route, { width = 1280, prefs = {}, seed = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  await page.addInitScript(
    ([P, prefs, seed]) => {
      if (localStorage.getItem("__seeded")) return;
      localStorage.setItem("__seeded", "1");
      localStorage.setItem(
        `${P}:prefs`,
        JSON.stringify({ band: "6-8", langChosen: true, lang: "en", ...prefs }),
      );
      for (const [k, v] of Object.entries(seed || {}))
        localStorage.setItem(`${P}:${k}`, JSON.stringify(v));
    },
    [P, prefs, seed],
  );
  await page.goto(`${base}/access-practice-lab/${route}`);
  await page.waitForSelector("h1", { timeout: 10000 });
  await page.waitForTimeout(300);
  return { page, ctx, errors };
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);

// ── 1 · the warm-up, start to finish ───────────────────────────────────────────────────────
{
  const { page, ctx, errors } = await open("warmup?grades=6-8");
  check(
    (await page.locator(".wu-step").count()) === 4 && (await page.locator(".wu-pip").count()) === 7,
    "warm-up: four steps and a seven-pip week",
  );
  check((await page.locator("text=/countdown|timer running/i").count()) === 0, "warm-up: no timer");
  await page.click("[data-wu=word]");
  await page.waitForSelector(".wu-step.is-done");
  const options = page.locator("input[name=wuListen]");
  // Pick the three answers in turn; a wrong one is calm and does not reveal the answer.
  let solved = false;
  for (let i = 0; i < 3 && !solved; i++) {
    await options.nth(i).check();
    await page.click("[data-wu=check]");
    await page.waitForTimeout(150);
    solved = (await page.locator(".wu-step.d-listening.is-done").count()) === 1;
    if (!solved)
      check(
        (await page.locator(".feedback-line").innerText()).includes("Not yet"),
        `warm-up: calm feedback after wrong answer ${i + 1}`,
      );
  }
  check(solved, "warm-up: the listening step completes on the right answer");
  await page.fill("#wuText", "I can use this word in my own sentence.");
  await page.click("[data-wu=save]");
  await page.waitForSelector(".wu-saved");
  await page.locator("[data-wu-check]").first().check();
  await page.click("[data-wu=speak]");
  await page.waitForSelector(".wu-finish");
  check(true, "warm-up: all four steps finish with the calm completion panel");
  check(
    (await page.locator(".wu-pip.is-today.is-full").count()) === 1,
    "warm-up: today's pip is full",
  );
  await page.reload();
  await page.waitForSelector(".wu-finish");
  check(
    (await page.locator("#wuText").inputValue()).startsWith("I can use"),
    "warm-up: a reload keeps the saved sentence",
  );
  check((await overflow(page)) <= 0, "warm-up: no sideways scroll at 1280");
  check(errors.length === 0, `warm-up: no console errors ${errors.join(" | ")}`);
  await page.click("[data-lang-mode=es]");
  await page.waitForTimeout(300);
  check(/Calentamiento diario/.test(await page.locator("h1").innerText()), "warm-up: Spanish mode");
  await ctx.close();
}

// ── 2 · the palette and the header search ────────────────────────────────────────────────
{
  const { page, ctx, errors } = await open("?grades=6-8");
  await page.keyboard.press("Control+k");
  await page.waitForSelector(".sx-overlay");
  const input = page.locator("#sxInput");
  check(
    (await input.getAttribute("role")) === "combobox" &&
      (await input.getAttribute("aria-controls")) === "sxList",
    "palette: input is a combobox that controls the list",
  );
  check(
    await page.evaluate(
      () =>
        document.activeElement.id === "sxInput" &&
        document.getElementById("app").hasAttribute("inert"),
    ),
    "palette: focus moves in and the page behind is inert",
  );
  await input.fill("warm");
  await page.waitForTimeout(250);
  check(
    (await page.locator("[role=option]").first().innerText()).includes("Daily Language Warm-Up"),
    "palette: best match first",
  );
  check(
    (await input.getAttribute("aria-expanded")) === "true" &&
      /sx-o-0/.test((await input.getAttribute("aria-activedescendant")) || ""),
    "palette: expanded with an active option",
  );
  await page.keyboard.press("ArrowDown");
  check(
    (await input.getAttribute("aria-activedescendant")) === "sx-o-1",
    "palette: ArrowDown moves the active option",
  );
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/warmup/);
  check(
    (await page.locator(".sx-overlay").count()) === 0,
    "palette: Enter opens the result and closes the palette",
  );
  await page.keyboard.press("/");
  await page.waitForSelector(".sx-overlay");
  await page.keyboard.type("manzana");
  await page.waitForTimeout(250);
  const titles = await page.locator("[role=option]").allInnerTexts();
  check(
    titles.some((t) => /apple/i.test(t)),
    "palette: a Spanish word finds the English word",
  );
  await page.keyboard.press("Escape");
  check(
    (await page.locator(".sx-overlay").count()) === 0 &&
      (await page.locator("#app[inert]").count()) === 0,
    "palette: Escape closes and the page is live again",
  );
  await page.keyboard.press("Control+k");
  await page.waitForSelector(".sx-overlay");
  await page.keyboard.type("text bigger");
  await page.waitForTimeout(200);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  check(
    Number(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--lab-scale"),
      ),
    ) > 1,
    "palette: an action (bigger text) runs",
  );
  // The header menu's own box goes to the results page.
  await page.click(".lab-utilities > summary");
  await page.fill("#labSearchInput", "reading");
  await page.keyboard.press("Enter");
  await page.waitForURL(/\/search\?q=reading/);
  await page.waitForSelector(".sx-card");
  check((await page.locator(".sx-card").count()) > 0, "search page: results from the header box");
  await page.click("[data-sx-kind=word]");
  check(
    (await page.locator(".sx-card .sx-r-kind", { hasText: "Word" }).count()) ===
      (await page.locator(".sx-card").count()),
    "search page: the Word filter shows only words",
  );
  check(
    (await overflow(page)) <= 0 && errors.length === 0,
    `search: no overflow, no console errors ${errors.join(" | ")}`,
  );
  await ctx.close();
}

// Search stays reachable on a phone.
{
  const { page, ctx } = await open("?grades=6-8", { width: 390 });
  check(
    await page.locator(".lab-search-btn").isVisible(),
    "palette: the search button is visible at 390px",
  );
  await page.click(".lab-search-btn");
  await page.waitForSelector(".sx-overlay");
  check((await overflow(page)) <= 0, "palette: no sideways scroll on a phone");
  await ctx.close();
}

// ── 3 · portfolio, family view and collection book ───────────────────────────────────────
{
  const days = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days[`6-8|${iso(d)}`] = {
      w: 1,
      l: { ok: 1, tries: 1, read: 0 },
      q: { text: "The farm uses water with care." },
      s: { checks: [0, 1], done: 1 },
      at: d.toISOString(),
    };
  }
  const seed = {
    studentName: "Maya R.",
    studio: {
      v: 1,
      writing: {
        "wrt-mulch-cer": {
          versions: [
            { id: "a", t: "2026-10-20T10:00:00.000Z", kind: "draft", text: "Mulch is good." },
            {
              id: "b",
              t: "2026-10-22T10:00:00.000Z",
              kind: "revision",
              text: "Mulch protects soil because it slows rain.",
            },
          ],
          reflection: "I added because.",
        },
      },
      speaking: {},
      missions: { "bike-lane-budget": { started: "2026-10-18T10:00:00.000Z", done: true } },
      detective: {},
      portfolio: { picks: [] },
    },
    readingRoom: {
      schema: 1,
      log: [
        {
          t: "2026-10-25T10:00:00.000Z",
          title: "Hatchet",
          minutes: 20,
          note: "Brian made a fire.",
        },
      ],
      words: [],
    },
  };
  const { page, ctx, errors } = await open("portfolio?grades=6-8", {
    prefs: { warmup: { v: 1, days } },
    seed,
  });
  check(
    (await page.locator("#labToast:not([hidden]) .toast-close").count()) === 1,
    "portfolio: new badges are announced in the shared toast, with a close button",
  );
  await page.locator("#labToast .toast-close").click();
  check(
    await page.locator("#labToast").evaluate((el) => el.hidden),
    "toast: the close button dismisses it",
  );
  check(
    (await page.locator(".pf-samples .pf-sample").count()) >= 1,
    "portfolio: showcase has writing",
  );
  check((await page.locator(".pf-word").count()) > 0, "portfolio: vocabulary garden has words");
  check(
    (await page.locator(".pf-timeline > li").count()) > 0,
    "portfolio: growth timeline has weeks",
  );
  check(
    (await page.locator(".growth-shields").count()) === 1 &&
      (await page.locator(".paper-pass").count()) === 1,
    "portfolio: reuses the Passport shield board and paper passport menu",
  );
  await page.locator("[data-pf-pin]").first().check();
  await page.waitForTimeout(200);
  check(
    (await page.locator("[data-pf-pin]:checked").count()) >= 1,
    "portfolio: a pick stays in the showcase after the page redraws",
  );
  await page.emulateMedia({ media: "print" });
  check(
    await page.locator(".lab-top").evaluate((el) => getComputedStyle(el).display === "none"),
    "portfolio: print view hides the site header",
  );
  await page.emulateMedia({ media: "screen" });
  await page.goto(`${base}/access-practice-lab/portfolio?grades=6-8&view=family`);
  await page.waitForSelector(".pf-family");
  const text = await page.locator(".pf-family").innerText();
  check(/Hello, family/.test(text) && /Maya R\./.test(text), "family view: the learner's own page");
  check(
    !/shield|badge|level|score:|points|supported|independent/i.test(
      text
        .replace(/does not show test scores or levels/i, "")
        .replace(/not an official WIDA or ACCESS test/i, ""),
    ),
    "family view: no scores, levels, shields or badges",
  );
  await page.goto(`${base}/access-practice-lab/collection?grades=6-8`);
  await page.waitForSelector(".cb-badge");
  check(
    (await page.locator(".cb-badge.is-earned").count()) >= 3,
    "collection: badges earned from the seeded work",
  );
  check(
    !/leaderboard|compare you/i.test(await page.locator("main").innerText()),
    "collection: no ranking language",
  );
  check(errors.length === 0, `portfolio and collection: no console errors ${errors.join(" | ")}`);
  await ctx.close();
}

// ── 4 · reflow: 320px and 1366px, bilingual, 140% text ──────────────────────────────────
for (const route of [
  "warmup",
  "search?q=word",
  "portfolio",
  "portfolio?view=family",
  "collection",
]) {
  for (const width of [320, 1366]) {
    const { page, ctx } = await open(`${route}${route.includes("?") ? "&" : "?"}grades=6-8`, {
      width,
      prefs: { lang: "bi", textSize: 1.4 },
    });
    check((await overflow(page)) <= 0, `reflow: ${route} at ${width}px, bilingual, 140% text`);
    await ctx.close();
  }
}

// ── 5 · accessibility: axe on the new routes ─────────────────────────────────────────────────
if (AxeBuilder) {
  for (const route of ["warmup", "search?q=word", "portfolio", "collection"]) {
    const { page, ctx } = await open(`${route}${route.includes("?") ? "&" : "?"}grades=6-8`);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    const bad = result.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    check(
      bad.length === 0,
      `axe: ${route} ${bad.map((v) => `${v.id}(${v.nodes[0]?.target})`).join(", ")}`,
    );
    await ctx.close();
  }
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\n${failures.length} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll experience checks passed.");

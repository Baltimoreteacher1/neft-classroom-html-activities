#!/usr/bin/env node
/**
 * Practice Together (/practice-together) in a real browser: English, Español and both at 1280/768/375/320, the page's own
 * language switch, the Start buttons and the way back (the return bar, browser Back), keyboard order, closed sections,
 * 48px targets, axe WCAG 2.2 AA, and the claim the page makes about the languages inside the two activities.
 *
 *   node tools/access-intro-family-e2e.mjs        (serves this working tree)
 *
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-intro-family-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn(
    "access-intro-family-e2e: axe-core/playwright is not installed; skipping axe checks.",
  );
}

const LAB = "/access-practice-lab";
const PREFS = "accessPracticeLab:v1:prefs";
const { server, base } = await serveAccess();
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-intro-family-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}

const failures = [];
const errors = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};

async function open(lang, width = 1280, path = "/practice-together") {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(
    ([key, l]) => {
      try {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify({ lang: l, langChosen: true }));
      } catch {}
    },
    [PREFS, lang],
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  await page.goto(base + LAB + path, { waitUntil: "load" });
  await page.waitForSelector("#app .tg-page, #app .voice-step, #app .sc-page, #app h1");
  return { page, context };
}
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
const h1 = (page) => page.locator("#app h1").allInnerTexts();

// 1. Each language at each width: one h1, whole page, no sideways scroll, Start buttons present.
const TITLES = { en: "Practice Together", es: "Practicar juntos" };
for (const lang of ["en", "es", "bi"]) {
  for (const width of [1280, 768, 375, 320]) {
    const { page, context } = await open(lang, width);
    const titles = await h1(page);
    ok(titles.length === 1, `${lang} ${width}: one h1`);
    const text = (await page.locator("#app").innerText()).toLowerCase();
    if (lang !== "es") ok(text.includes("practice together"), `${lang} ${width}: English title`);
    if (lang !== "en") ok(text.includes("practicar juntos"), `${lang} ${width}: Spanish title`);
    ok(!(await overflow(page)), `${lang} ${width}: no horizontal scroll`);
    ok((await page.locator(".tg-start").count()) === 2, `${lang} ${width}: two Start buttons`);
    ok(
      (await page.evaluate(() => document.documentElement.lang)) === (lang === "es" ? "es" : "en"),
      `${lang} ${width}: <html lang>`,
    );
    await context.close();
  }
}

// 2. The page's own switch: EN -> ES -> EN+ES -> EN keeps the page whole.
{
  const { page, context } = await open("en");
  for (const [mode, title] of [
    ["es", TITLES.es],
    ["bi", TITLES.en],
    ["en", TITLES.en],
  ]) {
    await page.click(`#app #tgLang-${mode}`);
    await page.waitForFunction(
      (m) => document.querySelector(`#app #tgLang-${m}`)?.getAttribute("aria-pressed") === "true",
      mode,
    );
    ok((await h1(page)).length === 1, `switch to ${mode}: one h1`);
    ok((await page.locator("#app").innerText()).includes(title), `switch to ${mode}: title shows`);
    ok((await page.locator(".tg-card").count()) === 2, `switch to ${mode}: both cards`);
  }
  await context.close();
}

// 3. Español: no English interface text outside lang="en" (names, examples and activity labels are English by design).
{
  const { page, context } = await open("es");
  const leaks = await page.evaluate(() => {
    const clone = document.querySelector("#app .tg-page").cloneNode(true);
    for (const n of clone.querySelectorAll('[lang="en"]')) n.remove();
    const re =
      /(?<!\p{L})(the|your|you|and|with|this|that|from|are|will|can|have|each|then|please|choose|practice|together)(?!\p{L})/giu;
    return (clone.textContent.match(re) || []).slice(0, 8);
  });
  ok(leaks.length === 0, `español: no English interface words${leaks.length ? ` (${leaks})` : ""}`);
  ok(
    (await page.locator('.tg-card [lang="en"]').count()) >= 5,
    "español: English names and examples are marked lang=en",
  );
  await context.close();
}

// 4. Start buttons: right route, return hint, activity opens, the return bar and browser Back both come back.
const WANT = [
  [0, "/voice/ladder/school-hallway", null],
  [1, "/scaffold/language-upgrade", "lu68-argue-phones"],
];
for (const lang of ["en", "es"]) {
  for (const [i, route, item] of WANT) {
    const { page, context } = await open(lang);
    const href = await page.locator(".tg-start").nth(i).getAttribute("href");
    const url = new URL(href, base);
    ok(url.pathname === LAB + route, `${lang} start ${i}: route ${route}`);
    ok(url.searchParams.get("intro") === "together", `${lang} start ${i}: return hint`);
    ok(!item || url.searchParams.get("item") === item, `${lang} start ${i}: keeps ?item`);
    await page.locator(".tg-start").nth(i).click();
    await page.waitForURL((u) => u.pathname === LAB + route);
    await page.waitForSelector("#app h1");
    const bar = page.locator("#introReturn a");
    await bar.waitFor({ timeout: 5000 }).catch(() => {});
    ok((await bar.count()) === 1, `${lang} start ${i}: return bar shown on the activity`);
    const label = await bar.innerText().catch(() => "");
    ok(
      lang === "en"
        ? /Back to Practice Together/.test(label)
        : /Volver a Practicar juntos/.test(label),
      `${lang} start ${i}: bar label "${label.replace(/\s+/g, " ").trim()}"`,
    );
    // The in-activity language claim: Español buttons inside the activity.
    const body = await page.locator("#app").innerText();
    if (lang === "es")
      ok(
        i === 0 ? /Escuchar la pregunta/.test(body) : /Empezar con esta ayuda/.test(body),
        `es start ${i}: the activity's buttons are in Spanish`,
      );
    else
      ok(
        !/Empezar con esta ayuda|Escuchar la pregunta/.test(body),
        `en start ${i}: activity buttons in English`,
      );
    await bar.click();
    await page.waitForURL((u) => u.pathname === `${LAB}/practice-together`);
    ok(
      (await h1(page)).includes(TITLES[lang]),
      `${lang} start ${i}: the bar returns to Practice Together`,
    );
    ok(
      (await page.locator("#introReturn").count()) === 0,
      `${lang} start ${i}: bar gone on the family page`,
    );
    // Browser Back from the activity.
    await page.locator(".tg-start").nth(i).click();
    await page.waitForURL((u) => u.pathname === LAB + route);
    await page.goBack();
    await page.waitForURL((u) => u.pathname === `${LAB}/practice-together`);
    await page.waitForSelector("#app .tg-page");
    ok(true, `${lang} start ${i}: browser Back returns to the page`);
    await context.close();
  }
}

// 5. Need help? and More practice start closed; open; links resolve to the verified routes; no nested details.
{
  const { page, context } = await open("en");
  const closed = await page.$$eval(".tg-details", (d) => d.map((x) => x.open));
  ok(closed.length === 2 && closed.every((o) => !o), "Need help? and More practice start closed");
  ok((await page.locator("details details").count()) === 0, "no nested details");
  await page.locator(".tg-details > summary").nth(0).click();
  ok(
    /No account is needed/.test(await page.locator(".tg-help").innerText()),
    "help: no account answer",
  );
  const tools = page.locator('.tg-help a[href*="/tools"]');
  ok((await tools.count()) === 1, "help: links the device check");
  await page.locator(".tg-details > summary").nth(1).click();
  const more = await page.$$eval(".tg-more a.btn", (a) => a.map((x) => x.getAttribute("href")));
  ok(
    more.length === 2 &&
      more[0].includes("/reading-room/rr68p-why-we-have-seasons") &&
      more[1].includes("/wordlab/build") &&
      more.every((h) => h.includes("intro=together")),
    "more practice: the two verified routes, with the return hint",
  );
  // The open state survives a language switch.
  await page.click("#app #tgLang-es");
  await page.waitForFunction(() => document.documentElement.lang === "es");
  const stillOpen = await page.$$eval(".tg-details", (d) => d.map((x) => x.open));
  ok(stillOpen.every(Boolean), "sections stay open across a language switch");
  await tools
    .first()
    .click()
    .catch(() => {});
  await context.close();
}
{
  const { page, context } = await open("en");
  await page.locator(".tg-details > summary").first().click();
  await page.locator('.tg-help a[href*="/tools"]').click();
  await page.waitForURL((u) => u.pathname === `${LAB}/tools`);
  await page
    .waitForFunction(
      () => /device check/i.test(document.querySelector("#app h1")?.textContent || ""),
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  ok(/device check/i.test((await h1(page)).join(" ")), "help link opens the device check page");
  await context.close();
}
{
  const { page, context } = await open("en");
  const hrefs = await page.$$eval(".tg-foot a", (a) => a.map((x) => x.getAttribute("href")));
  ok(
    hrefs.some((h) => h.includes("/site-guide?for=family")) &&
      hrefs.some((h) => /\/family(\?|$)/.test(h)),
    "footer links: Site Guide (for=family) and Family Corner",
  );
  await context.close();
}

// 6. Keyboard order, 48px targets, visible focus, reduced motion.
{
  const { page, context } = await open("en");
  await page.locator("#app h1").focus();
  const order = [];
  for (let i = 0; i < 16; i++) {
    await page.keyboard.press("Tab");
    order.push(
      await page.evaluate(() => {
        const a = document.activeElement;
        if (!a?.closest("#app")) return "outside";
        return a.id || a.className.toString().split(" ")[0] || a.tagName;
      }),
    );
  }
  const idx = (k) => order.findIndex((o) => o === k);
  ok(
    idx("tgLang-en") >= 0 &&
      idx("tgLang-en") < idx("tgLang-es") &&
      idx("tgLang-es") < idx("tgLang-bi"),
    `tab order: language switch first (${order.slice(0, 4)})`,
  );
  const starts = order.map((o, i) => (o === "btn" ? i : -1)).filter((i) => i >= 0);
  ok(starts.length >= 2 && starts[0] < starts[1], "tab order: Talk Start before Write Start");
  const focusRing = await page.evaluate(() => {
    document.querySelector(".tg-start").focus();
    return getComputedStyle(document.querySelector(".tg-start")).outlineWidth;
  });
  ok(parseFloat(focusRing) >= 2, `Start shows a focus ring (${focusRing})`);
  const small = await page.$$eval(
    "#app .tg-page .btn, #app .tg-page summary, #app .tg-page .lang-btn",
    (els) =>
      els
        .map((e) => e.getBoundingClientRect())
        .filter((r) => r.height < 47.5 || r.width < 47.5)
        .map((r) => `${Math.round(r.width)}x${Math.round(r.height)}`),
  );
  ok(small.length === 0, `targets are at least 48px${small.length ? ` (${small})` : ""}`);
  await context.close();
}

// 7. axe WCAG 2.2 AA in each language, desktop and phone, with both sections open.
if (AxeBuilder) {
  for (const lang of ["en", "es", "bi"]) {
    for (const width of [1280, 375]) {
      const { page, context } = await open(lang, width);
      for (const s of await page.locator(".tg-details > summary").all()) await s.click();
      const res = await new AxeBuilder({ page })
        .include("#app")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      ok(
        res.violations.length === 0,
        `axe ${lang} ${width}${res.violations.length ? ` — ${res.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ")}` : ""}`,
      );
      await context.close();
    }
  }
}

ok(
  errors.length === 0,
  `no page or console errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`,
);
await browser.close();
server.close();
if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-intro-family-e2e: all checks passed");

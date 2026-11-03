#!/usr/bin/env node
/**
 * Family journey in real Chromium: the six-step stepper on every journey page, the Understand ACCESS page in English
 * and Spanish with read-aloud buttons, honest practice-versus-official wording, axe, and phone width.
 */
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-acc-family-e2e: SKIP — playwright is not installed.");
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
const ROOT = `${base}/access-practice-lab`;

async function fresh(prefs, viewport = { width: 1280, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
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

// ── English ──────────────────────────────────────────────────────────────────────────
{
  const { ctx, page, errors } = await fresh({
    lang: "en",
    langChosen: true,
    family: { v: 1, grade: "3-5", who: "together", minutes: 10, done: true },
  });
  const steps = [
    ["", "Welcome"],
    ["/understand", "Understand ACCESS"],
    ["/practice", "Choose a skill"],
    ["/trip", "Practice together"],
    ["/progress", "Review progress"],
  ];
  for (const [path, name] of steps) {
    await page.goto(`${ROOT}/family${path}?grades=3-5`, { waitUntil: "networkidle" });
    const nav = page.locator(".fam-journey");
    await nav.waitFor();
    ok((await nav.locator("li").count()) === 6, `${name}: the journey shows six steps`);
    ok(
      (await nav.locator('[aria-current="step"]').innerText()).includes(name),
      `${name}: the current step is marked`,
    );
  }
  await page.goto(`${ROOT}/family/understand?grades=3-5`, { waitUntil: "networkidle" });
  const t = await page.locator(".fam-understand").innerText();
  ok(
    /What is ACCESS\?/.test(t) && /Why does it matter\?/.test(t) && /four skills, at home/.test(t),
    "the page explains ACCESS, why it matters, and the four skills at home",
  );
  ok(
    /not the official test/.test(t) && /cannot tell you what your child will score/.test(t),
    "it says plainly that practice is not the official test and does not predict a score",
  );
  ok(
    !/will (pass|score)|guarantee|certif/i.test(
      t.replace(/cannot tell you what your child will score/g, ""),
    ),
    "it promises nothing about results",
  );
  ok(
    (await page.locator("[data-say]").count()) === 4 &&
      (await page.locator("[data-say-es]").count()) === 4,
    "every part has an English and a Spanish read-aloud button",
  );
  ok(
    !(await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )),
    "no horizontal overflow at desktop width",
  );
  await page.locator('.fam-journey a:has-text("Review progress")').click();
  await page.waitForURL(/family\/progress/);
  ok(true, "a step link opens that page");
  await page.goto(`${ROOT}/family/understand?grades=3-5`, { waitUntil: "networkidle" });
  if (AxeBuilder) {
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    ok(
      axe.violations.length === 0,
      `axe: Understand ACCESS has no WCAG 2.2 AA violations ${axe.violations.map((v) => `${v.id}:${v.nodes[0].target}`).join(",")}`,
    );
  }
  ok(errors.length === 0, `no console errors ${errors.join("|")}`);
  await ctx.close();
}

// ── Spanish ──────────────────────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh({ lang: "es", langChosen: true });
  await page.goto(`${ROOT}/family/understand?grades=3-5`, { waitUntil: "networkidle" });
  const t = await page.locator(".fam-understand").innerText();
  ok(
    /¿Qué es ACCESS\?/.test(t) &&
      /No es la prueba oficial/.test(t) &&
      /Las cuatro destrezas, en casa/.test(t),
    "Spanish mode shows the whole page in Spanish",
  );
  ok(
    (await page.locator(".fam-journey").getAttribute("aria-label")) === "Recorrido familiar" &&
      /Entender ACCESS/.test(await page.locator(".fam-journey").innerText()),
    "the journey is in Spanish",
  );
  ok(
    (await page.evaluate(() => document.documentElement.lang)) === "es",
    "the page declares Spanish",
  );
  ok(
    !/\b(What is|Why does|routine)\b/.test(t),
    "no English interface text is left in Spanish mode",
  );
  await ctx.close();
}

// ── bilingual and phone ──────────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh({ lang: "bi", langChosen: true }, { width: 390, height: 844 });
  await page.goto(`${ROOT}/family/understand?grades=3-5`, { waitUntil: "networkidle" });
  ok(
    (await page.locator('.fam-u-card p[lang="es"]').count()) >= 4,
    "bilingual mode puts the Spanish under each English paragraph, tagged lang=es",
  );
  ok(
    !(await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )),
    "390px: no horizontal overflow",
  );
  const small = await page.evaluate(
    () =>
      [...document.querySelectorAll(".fam-journey a, .fam-u-card button, .fam-cta .btn")].filter(
        (b) => b.getBoundingClientRect().height < 44,
      ).length,
  );
  ok(small === 0, "390px: journey steps and buttons meet the 44px target");
  await ctx.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-acc-family-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-acc-family-e2e: all checks passed");

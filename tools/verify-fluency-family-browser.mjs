// End-to-end family route smoke and accessibility check against repository source.
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { createServer } from "vite";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const server = await createServer({
  root: REPO_ROOT,
  logLevel: "error",
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => {
    localStorage.setItem(
      "ewl-fluency-tutor-v2",
      JSON.stringify({
        version: 2,
        records: {
          "4:round-large": {
            recent: [{ correct: false, independent: true, at: Date.now(), level: 1 }],
            dueAt: Date.now() - 1000,
          },
        },
        mistakes: [],
        diagnostics: {},
        sessions: [],
      }),
    );
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/math/fluency-lab/family/`, { waitUntil: "networkidle" });
  assert.equal(await page.locator("h1").first().innerText(), "Make room for a math moment.");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.classList.contains("skip-link")),
    true,
    "first keyboard stop is the skip link",
  );
  const englishAxe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(
    englishAxe.violations
      .filter((v) => ["critical", "serious"].includes(v.impact))
      .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    [],
    "English family page has no serious or critical accessibility violations",
  );

  await page.getByRole("button", { name: "Grade 4" }).click();
  assert.match(await page.locator("#recommended-skill").innerText(), /Round/);
  await page.locator("#skill-select").selectOption({ index: 2 });
  const skillHref = await page.locator("#skill-start").getAttribute("href");
  assert.match(skillHref, /grade=4/);
  assert.match(skillHref, /start=practice/);
  assert.match(skillHref, /skill=4%3A/);
  await page.getByRole("button", { name: "Español" }).click();
  assert.equal(
    await page.locator("h1").first().innerText(),
    "Hagamos un momento para las matemáticas.",
  );
  assert.equal(
    await page.locator(".welcome-secondary").innerText(),
    "Ver el progreso de este estudiante",
  );
  assert.equal(await page.locator("#rotation-list .rotation-row").count(), 7);
  const spanishAxe = await new AxeBuilder({ page }).analyze();
  assert.deepEqual(
    spanishAxe.violations
      .filter((v) => ["critical", "serious"].includes(v.impact))
      .map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    [],
    "Spanish family page has no serious or critical accessibility violations",
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    0,
    "mobile page has no horizontal overflow",
  );

  await page.locator("#family-profile").selectOption("add:1");
  assert.match(await page.locator("#tonight-link").getAttribute("href"), /profile=1/);
  const modes = await page.locator("#rotation-list a").evaluateAll((links) =>
    links.map((link) => {
      const url = new URL(link.href);
      return url.searchParams.get("start") || url.searchParams.get("view");
    }),
  );
  assert.deepEqual(modes, [
    "mission",
    "practice",
    "games",
    "checkup",
    "mission",
    "realworld",
    "daily",
  ]);

  await page.goto(
    new URL(skillHref.replace("profile=0", "profile=1"), `${base}/math/fluency-lab/family/`).href,
    { waitUntil: "networkidle" },
  );
  assert.equal(new URL(page.url()).pathname, "/math/fluency-lab/");
  assert.match(
    await page.locator("#session-count").innerText(),
    /0 completed/i,
    "skill link starts a real practice session",
  );
  assert.match(await page.locator("#problem-number").innerText(), /Problem 1/);
  await page.setViewportSize({ width: 1365, height: 900 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
    0,
    "desktop page has no horizontal overflow",
  );
  assert.deepEqual(errors, [], "family and Fluency Lab routes have no uncaught page errors");
  await context.close();
  const noSaveContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await noSaveContext.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (String(key).startsWith("ewl-fluency-settings-v1:grade"))
        throw new DOMException("Storage full", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  const noSavePage = await noSaveContext.newPage();
  await noSavePage.goto(`${base}/math/fluency-lab/family/`, { waitUntil: "networkidle" });
  assert.equal(
    await noSavePage.locator("#family-storage-warning").isVisible(),
    true,
    "storage failures are announced to families",
  );
  await noSaveContext.close();
  console.log(
    "Family browser flow passed: adaptive skill selection, profile switch, seven routes, English/Spanish, keyboard focus, Axe, real practice launch, mobile and desktop layout.",
  );
} finally {
  await browser?.close();
  await new Promise((resolveClose, reject) => server.close().then(resolveClose, reject));
}

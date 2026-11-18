#!/usr/bin/env node
/**
 * Family Tour redirect (/practice-together -> /family-tour/) & Tour 2 mic-denied check in a real browser.
 *   node tools/access-intro-family-e2e.mjs        (serves this working tree)
 *
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-intro-family-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
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

async function open(lang, width, path, { denyMic = false } = {}) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    reducedMotion: "reduce",
  });
  await context.addInitScript(
    ([key, l, deny]) => {
      try {
        if (!localStorage.getItem(key))
          localStorage.setItem(key, JSON.stringify({ lang: l, langChosen: true }));
      } catch {}
      if (deny && navigator.mediaDevices)
        navigator.mediaDevices.getUserMedia = () =>
          Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
    },
    [PREFS, lang, denyMic],
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message)) errors.push(`${path}: ${e.message}`);
  });
  page.on("console", (m) => {
    if (m.type() === "error" && !/web-vitals/.test(m.text())) errors.push(`${path}: ${m.text()}`);
  });
  await page.goto(`${base}${LAB}${path}`, { waitUntil: "load" });
  await page.waitForSelector("#app h1", { timeout: 15000 });
  return { context, page };
}

const noSideScroll = (page) =>
  page.evaluate(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1);

try {
  // ── Retired /practice-together redirects to Family Tour (ES, 375px) ──
  {
    const context = await browser.newContext({
      viewport: { width: 375, height: 844 },
      reducedMotion: "reduce",
    });
    await context.addInitScript(
      ([key, l]) => {
        try {
          if (!localStorage.getItem(key))
            localStorage.setItem(key, JSON.stringify({ lang: l, langChosen: true }));
        } catch {}
      },
      [PREFS, "es"],
    );
    const page = await context.newPage();
    page.on("pageerror", (e) => {
      if (!/web-vitals/.test(e.message)) errors.push(`/practice-together: ${e.message}`);
    });
    page.on("console", (m) => {
      if (m.type() === "error" && !/web-vitals/.test(m.text()))
        errors.push(`/practice-together: ${m.text()}`);
    });
    await page.goto(`${base}${LAB}/practice-together?grades=6-8`, { waitUntil: "load" });
    await page.waitForURL(/\/access-practice-lab\/family-tour\//, { timeout: 15000 });
    await page.waitForSelector("main h1", { timeout: 15000 });
    ok(
      page.url().includes("/access-practice-lab/family-tour/?grades=6-8"),
      "ES phone: /practice-together?grades=6-8 redirects to Family Tour with grade",
    );
    ok(await noSideScroll(page), "ES 375: no horizontal scroll on Family Tour");
    await context.close();
  }

  // ── Narrow phone ──
  {
    const context = await browser.newContext({
      viewport: { width: 320, height: 844 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => {
      if (!/web-vitals/.test(e.message)) errors.push(`/family-tour: ${e.message}`);
    });
    await page.goto(`${base}${LAB}/family-tour/?grades=6-8`, { waitUntil: "load" });
    await page.waitForSelector("main h1", { timeout: 15000 });
    ok(await noSideScroll(page), "EN 320: no horizontal scroll on Family Tour");
    await context.close();
  }

  // ── Microphone denied in the teacher tour's speaking preview ──
  {
    const { context, page } = await open(
      "en",
      1280,
      "/start/tour?part=2&grades=6-8&skill=speaking",
      {
        denyMic: true,
      },
    );
    const tourFrame = page.frameLocator("iframe.t2-iframe");
    await page.waitForSelector("iframe.t2-iframe", { timeout: 15000 });
    await tourFrame
      .locator("main h1, main .early-player, [data-early-player]")
      .first()
      .waitFor({ timeout: 20000 });
    const rec = tourFrame.locator("[data-rec-start]").first();
    await rec.click();
    const msg = tourFrame.locator("[data-rec-error]");
    await msg
      .first()
      .waitFor({ state: "visible", timeout: 8000 })
      .catch(() => {});
    ok(
      /microphone is unavailable/i.test(
        (await msg
          .first()
          .textContent()
          .catch(() => "")) || "",
      ),
      "mic denied: the activity explains it",
    );
    ok(await page.locator("[data-t2-guide]").isVisible(), "mic denied: the guide stays on screen");
    ok(
      (await page.locator('[data-t2="next"]').count()) === 1,
      "mic denied: the way on to the next step is still there",
    );
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}

ok(errors.length === 0, `no page errors (${errors.slice(0, 3).join(" | ") || "none"})`);
console.log(
  `\naccess-intro-family-e2e: ${failures.length ? `${failures.length} FAILED` : "all passed"}`,
);
process.exit(failures.length ? 1 : 0);

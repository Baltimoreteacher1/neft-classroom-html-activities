#!/usr/bin/env node
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
// Run against the local Vite server: BASE_URL=http://127.0.0.1:42819 node tools/access-conversation-writing-browser.mjs
// Uses only synthetic responses in a fresh browser context. Never reads real learner data.
import { chromium } from "playwright";

const base = process.env.BASE_URL;
assert.ok(base, "Set BASE_URL to the running local Vite server.");
assert.ok(
  ["localhost", "127.0.0.1", "[::1]"].includes(new URL(base).hostname),
  "This regression uses only a local test server.",
);
const screenshots = join(tmpdir(), "language-conversation-writing-qa");
mkdirSync(screenshots, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Vite serves the root hub for extensionless deep links. Enter the actual lab
  // shell first and then use its existing History API route handler.
  async function go(route) {
    await page.goto(`${base}/access-practice-lab/`, { waitUntil: "networkidle" });
    await page.evaluate((path) => {
      history.pushState({}, "", path);
      dispatchEvent(new PopStateEvent("popstate"));
    }, `/access-practice-lab/${route}`);
  }
  async function accessible(label) {
    // Inspect the settled screen, not the existing route-entry opacity animation.
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `${label}: page overflow`,
    );
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((node) => node.target) })),
      [],
      `${label}: axe violations`,
    );
  }
  const draft =
    "The mulch helped plants because it kept the soil moist. Evidence from the experiment shows that covered soil held more water.";
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 820, 1180],
    ["mobile", 390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await go("conversation/ecosystem-debate");
    await page.locator(".cv-stage").waitFor();
    assert.match(await page.locator("h1").innerText(), /Ecosystem/);
    assert.equal(
      await page
        .locator(".cv-character")
        .evaluate((image) => image.complete && image.naturalWidth > 0),
      true,
    );
    await accessible(`conversation ${name}`);
    await page.screenshot({ path: join(screenshots, `conversation-${name}.png`), fullPage: true });
    await go("write/wrt-mulch-cer");
    await page.locator("[data-draft]").waitFor();
    await page.locator("[data-draft]").fill(draft);
    await page.locator("[data-writing-focus]").click();
    assert.equal(await page.locator("[data-writing-focus]").getAttribute("aria-pressed"), "true");
    assert.equal(await page.locator("[data-draft]").inputValue(), draft);
    assert.equal(await page.locator(".studio-cols > .studio-col").first().isVisible(), false);
    await page.locator("[data-writing-focus]").click();
    assert.equal(await page.locator(".studio-cols > .studio-col").first().isVisible(), true);
    await accessible(`writing ${name}`);
    await page.screenshot({ path: join(screenshots, `writing-${name}.png`), fullPage: true });
    console.log(`PASS ${name}: scene assets, focus toggle, draft preservation, overflow and axe`);
  }
  await go("conversation/historical-perspectives");
  await page.locator(".cv-stage").waitFor();
  assert.match(await page.locator(".cv-environment").getAttribute("src"), /archive-room.svg$/);
  await page.locator("[data-conv-select]").first().check();
  await page.locator(".cv-opt .feedback").waitFor();
  await go("conversation/historical-perspectives");
  await page.locator(".cv-stage").waitFor();
  assert.equal(await page.locator("[data-conv-select]").first().isChecked(), true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException("Test permission denied", "NotAllowedError"));
  });
  await page.locator("[data-rec-start]").click();
  await page.locator("[data-rec-error]").waitFor({ state: "visible" });
  assert.equal(
    await page.locator(".cv-stage").getAttribute("data-state"),
    "ready",
    "denied microphone must not appear to record",
  );
  assert.equal(
    await page
      .locator(".cv-character")
      .evaluate((image) => getComputedStyle(image).transitionDuration),
    "0s",
  );
  await accessible("conversation denied microphone with reduced motion");
  assert.deepEqual(errors, []);
  console.log(
    `PASS alternate scene, response feedback/save/resume, no page errors. Screenshots: ${screenshots}`,
  );
} finally {
  await browser.close();
}

// Regression for sticky-header wrapping and inherited anchor offsets in WebKit.
// Runs on a fresh local Vite server and uses no learner records.
import assert from "node:assert/strict";
import { webkit } from "playwright";
import { createServer } from "vite";

const server = await createServer({ server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const browser = await webkit.launch({ headless: true });
try {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.addInitScript(() => {
    window.__headerPublications = [];
    const setProperty = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function (name, value, priority) {
      if (name === "--lab-top-h") {
        window.__headerPublications.push({ before: this.getPropertyValue(name), value });
      }
      return setProperty.call(this, name, value, priority);
    };
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const origin = server.resolvedUrls.local[0].replace(/\/$/, "");
  for (let load = 0; load < 3; load++) {
    await page.goto(`${origin}/access-practice-lab/`, { waitUntil: "networkidle" });
    await page.locator(".lab-top").waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const width of [1440, 820, 390, 600, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      // The published offset must settle to the actual sticky border-box height
      // after responsive wrapping, rather than staying at the previous width.
      await page.waitForFunction(() => {
        const header = document.querySelector(".lab-top");
        const expected =
          getComputedStyle(header).position === "sticky"
            ? Math.round(header.getBoundingClientRect().height)
            : 0;
        return document.documentElement.style.getPropertyValue("--lab-top-h") === `${expected}px`;
      });
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      const settled = await page.evaluate(async () => {
        const count = window.__headerPublications.length;
        const height = document.querySelector(".lab-top").getBoundingClientRect().height;
        for (let frame = 0; frame < 12; frame++) await new Promise(requestAnimationFrame);
        return {
          count,
          after: window.__headerPublications.length,
          height,
          afterHeight: document.querySelector(".lab-top").getBoundingClientRect().height,
        };
      });
      assert.equal(
        settled.after,
        settled.count,
        "Header publications must stop after layout settles",
      );
      assert.equal(
        settled.afterHeight,
        settled.height,
        "Header height must remain stable after fonts and wrapping settle",
      );
    }
    await page.evaluate(() => {
      dispatchEvent(new Event("pagehide"));
      document.documentElement.style.setProperty("--lab-top-h", "0px");
      dispatchEvent(new Event("pageshow"));
    });
    await page.waitForFunction(() => {
      const header = document.querySelector(".lab-top");
      const expected =
        getComputedStyle(header).position === "sticky"
          ? Math.round(header.getBoundingClientRect().height)
          : 0;
      return document.documentElement.style.getPropertyValue("--lab-top-h") === `${expected}px`;
    });
    const publications = await page.evaluate(() => window.__headerPublications);
    assert(publications.length > 0, "The header offset should be published");
    assert(
      publications.every(({ before, value }) => before !== value),
      "Unchanged header heights must not be republished",
    );
    assert.deepEqual(
      errors,
      [],
      "Responsive header measurement must not produce ResizeObserver loop errors",
    );
  }
  console.log(
    "PASS WebKit: three cold loads, five responsive wraps each, correct anchor offsets, no redundant publications or loop errors",
  );
} finally {
  await browser.close();
  await server.close();
}

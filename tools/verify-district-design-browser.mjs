import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 850 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(
      `${process.env.BASE_URL || "http://127.0.0.1:8766"}/curriculum/learning-labs/packaging-workshop/`,
      {
        waitUntil: "networkidle",
      },
    );
    await page.locator("#tab-investigate").click();
    const activity = page.locator(".district-design");
    await activity.locator("[data-check]").click();
    assert.match(
      await activity.locator("[data-feedback]").innerText(),
      /prediction before testing/i,
    );
    await activity.locator("[data-prediction]").fill("24");
    await activity.locator("[data-check]").click();
    assert.match(
      await activity.locator("[data-feedback]").innerText(),
      /prediction matches.*meets/i,
    );
    await activity.locator("[data-situation]").selectOption("1");
    await activity.locator("[data-height]").selectOption("3");
    await activity.locator("[data-prediction]").fill("35");
    await activity.locator("[data-check]").click();
    assert.match(await activity.locator("[data-feedback]").innerText(), /capacity is 36.*meets/i);
    await activity.locator("[data-explanation]").fill("The base has 12 squares and three layers.");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#tab-investigate").click();
    assert.equal(
      await activity.locator("[data-explanation]").inputValue(),
      "The base has 12 squares and three layers.",
    );
    assert.match(
      await activity.locator("[data-math]").innerText(),
      /12 square units.*36 cubic units/,
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    await activity.screenshot({ path: `/tmp/district-design-${width}.png` });
    await page.close();
  }
  console.log(
    "PASS district design: prediction, constraints, correction, persistence, mobile and desktop",
  );
} finally {
  await browser.close();
}

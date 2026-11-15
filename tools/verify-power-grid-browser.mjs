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
      `${process.env.BASE_URL || "http://127.0.0.1:8766"}/curriculum/learning-labs/hundred-square-studio/`,
      {
        waitUntil: "networkidle",
      },
    );
    await page.locator("#tab-investigate").click();
    const activity = page.locator(".power-allocation");
    await activity.locator("[data-run]").click();
    assert.match(await activity.locator("[data-feedback]").innerText(), /Choose a prediction/);
    await activity.locator("[data-prediction]").selectOption("over");
    await activity.locator("[data-run]").click();
    assert.match(
      await activity.locator("[data-feedback]").innerText(),
      /prediction matches.*exceeds supply by 5/i,
    );
    await activity.locator("[data-scenario]").selectOption("1");
    await activity.locator('[data-allocation="park"]').selectOption("25");
    await activity.locator("[data-prediction]").selectOption("exact");
    await activity.locator("[data-run]").click();
    assert.match(await activity.locator("[data-feedback]").innerText(), /shortage is resolved/);
    assert.match(
      await activity.locator("[data-representations]").innerText(),
      /25\/100 = 1\/4 = 0.25 = 25%/,
    );
    assert.equal(await activity.locator("[data-grid] rect").count(), 100);
    await activity
      .locator("[data-explanation]")
      .fill("I reduced the park allocation by five units.");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#tab-investigate").click();
    assert.equal(
      await activity.locator("[data-explanation]").inputValue(),
      "I reduced the park allocation by five units.",
    );
    assert.equal(await activity.locator('[data-allocation="park"]').inputValue(), "25");
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    await activity.screenshot({ path: `/tmp/power-grid-${width}.png` });
    await page.close();
  }
  console.log(
    "PASS power grid: prediction, shortage, representation, revision, restore, mobile and desktop",
  );
} finally {
  await browser.close();
}

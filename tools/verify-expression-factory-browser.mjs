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
      `${process.env.BASE_URL || "http://127.0.0.1:8766"}/curriculum/learning-labs/expression-remix/`,
      { waitUntil: "networkidle" },
    );
    await page.locator("#tab-investigate").click();
    const factory = page.locator(".expression-factory");
    await factory.locator("[data-run]").click();
    assert.match(await factory.locator("[data-feedback]").innerText(), /prediction/i);
    await factory.locator("[data-prediction]").fill("18");
    await factory.locator("[data-run]").click();
    assert.match(await factory.locator("[data-a]").innerText(), /18/);
    assert.match(await factory.locator("[data-b]").innerText(), /15/);
    await factory.locator('[data-field="bonus"]').selectOption("6");
    await factory.locator("[data-prediction]").fill("18");
    await factory.locator("[data-run]").click();
    assert.match(await factory.locator("[data-comparison]").innerText(), /equivalent for every x/);
    await factory.locator("[data-explanation]").fill("Both parts are multiplied by two.");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#tab-investigate").click();
    assert.equal(
      await factory.locator("[data-explanation]").inputValue(),
      "Both parts are multiplied by two.",
    );
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    await page.close();
  }
  console.log(
    "PASS expression factory: prediction, grouping, equivalence, save and responsive layout",
  );
} finally {
  await browser.close();
}

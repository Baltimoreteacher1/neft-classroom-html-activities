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
      `${process.env.BASE_URL || "http://127.0.0.1:8766"}/curriculum/learning-labs/mixture-matchup/`,
      {
        waitUntil: "networkidle",
      },
    );
    await page.locator("#tab-investigate").click();
    const activity = page.locator(".delivery-network");
    await activity.locator("[data-run]").click();
    assert.match(
      await activity.locator("[data-feedback]").innerText(),
      /Choose a prediction first/,
    );
    await activity.locator('input[value="b"]').check();
    await activity.locator("[data-run]").click();
    assert.match(await activity.locator("[data-feedback]").innerText(), /prediction matches/i);
    assert.match(await activity.locator("[data-equations]").innerText(), /60 min.*30 min/);
    await activity.locator("[data-scenario]").selectOption("1");
    await activity.locator('input[value="a"]').check();
    await activity.locator("[data-run]").click();
    assert.match(await activity.locator("[data-feedback]").innerText(), /revise your prediction/i);
    await activity.locator("[data-route-b]").selectOption("10");
    assert.match(await activity.locator("[data-feedback]").innerText(), /route changed/i);
    await activity.locator("[data-scenario]").selectOption("2");
    await activity.locator('input[value="b"]').check();
    await activity.locator("[data-run]").click();
    assert.match(await activity.locator("[data-feedback]").innerText(), /A is late; B meets it/);
    await activity.locator("[data-scenario]").selectOption("1");
    await activity.locator("[data-explain]").fill("I compared distance divided by speed.");
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("#tab-investigate").click();
    assert.equal(
      await activity.locator("[data-explain]").inputValue(),
      "I compared distance divided by speed.",
    );
    assert.equal(await activity.locator("[data-scenario]").inputValue(), "1");
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      `no horizontal overflow at ${width}`,
    );
    assert.deepEqual(errors, []);
    await activity.screenshot({ path: `/tmp/delivery-network-${width}.png` });
    await page.close();
  }
  console.log(
    "PASS delivery network: prediction, comparison, revision, restore, mobile and desktop",
  );
} finally {
  await browser.close();
}

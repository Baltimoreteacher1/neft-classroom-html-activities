import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../../tools/lib/curriculum-source.mjs";

const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${server.config.server.origin || `http://127.0.0.1:${server.httpServer.address().port}`}/math/fluency-lab/?grade=6&skill=ratios`);
  const link = page.getByText("Explore this ratio in Ratio Studio", { exact: true });
  await link.waitFor();
  const href = await link.getAttribute("href");
  const expected = new URLSearchParams(href.split("?")[1]);
  await link.click();
  await page.locator("#amount-a").waitFor();
  assert.equal(await page.locator("#amount-a").inputValue(), expected.get("a"));
  assert.equal(await page.locator("#amount-b").inputValue(), expected.get("b"));
  assert.equal(await page.locator("#label-a").inputValue(), expected.get("labelA"));
  const languageSupport = page.locator("details.language-support").first();
  await languageSupport.locator("summary").click();
  await assert.doesNotReject(() => page.getByText(/Both quantities were multiplied by/).waitFor());
  await page.locator("#transfer-support summary").click();
  await page.locator("#unit-one").fill("2.5");
  await page.locator("#unit-two").fill("2");
  await page.locator("#buy").selectOption("second");
  await page.locator("#check-transfer").click();
  assert.match(await page.locator("#transfer-feedback").innerText(), /^Supported transfer complete/);
  await page.locator("#transfer-support summary").click();
  await page.locator("#check-transfer").click();
  assert.match(await page.locator("#transfer-feedback").innerText(), /^Independent transfer complete/);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(errors, []);
  console.log("Grade 6 ratio lesson → contextual Ratio Studio → language support → supported and independent transfer passed at 390px.");
} finally {
  await browser?.close();
  await server.close();
}

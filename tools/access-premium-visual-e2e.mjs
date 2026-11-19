// Render the actual application routes through Vite, including its source transforms.
// Deep-link interception keeps the original route while avoiding Vite's root HTML fallback.
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium, firefox, webkit } from "playwright";
import { createServer } from "vite";

const output = process.env.LANGUAGE_QA_SHOTS || process.env.SHOTS || "/tmp/language-premium-visual";
mkdirSync(output, { recursive: true });
const server = await createServer({ server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const origin = server.resolvedUrls.local[0].replace(/\/$/, "");
const browserType = { chromium, firefox, webkit }[process.env.LANGUAGE_QA_BROWSER || "chromium"];
assert(browserType, "Choose chromium, firefox or webkit");
const browser = await browserType.launch({ headless: true });
const results = [];
const routes = [
  ["home", ""],
  ["students", "students?pick=6-8&grades=6-8"],
  ["family", "family?grades=6-8"],
  ["conversation", "conversation/ecosystem-debate?grades=6-8"],
  ["writing", "write/wrt-mulch-cer?grades=6-8"],
  ["books", "book-studio?grades=6-8"],
  ["growth", "growth?grades=6-8"],
  ["supports", "scaffold?grades=6-8"],
  ["practice", "Reading/A?grades=6-8"],
  ["city", "city?grades=6-8"],
  ["science", "worlds/science-lab/notice?grades=6-8&case=ice"],
  ["museum", "adventures/mystery-museum/the-empty-case?grades=6-8&scene=0"],
  ["newsroom", "newsroom/np-68-01?grades=6-8&step=plan"],
  ["teacher", "/access-teacher/"],
];
try {
  for (const [size, width, height] of [
    ["desktop", 1440, 1000],
    ["tablet", 820, 1180],
    ["mobile", 390, 844],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.route("**/access-practice-lab/**", async (route) => {
      const req = route.request();
      const url = new URL(req.url());
      if (req.resourceType() === "document" && !/\.[a-z0-9]+$/i.test(url.pathname)) {
        const response = await route.fetch({ url: origin + "/access-practice-lab/index.html" });
        return route.fulfill({ response });
      }
      return route.continue();
    });
    for (const [name, path] of routes) {
      const errors = [];
      const onError = (error) => errors.push(error.message);
      page.on("pageerror", onError);
      const url = path.startsWith("/") ? origin + path : origin + "/access-practice-lab/" + path;
      const started = Date.now();
      await page.goto(url, { waitUntil: "networkidle" });
      await page.locator("h1").first().waitFor();
      await page.evaluate(() => document.fonts.ready);
      const heading = (await page.locator("h1").allTextContents()).join(" ").trim();
      assert(!heading.includes("Neft Hub"), `${name}: root fallback rendered`);
      if (name !== "home")
        assert(
          !heading.includes("Practice English for school, one step at a time"),
          `${name}: unknown route rendered home`,
        );
      assert.equal(errors.length, 0, `${name}: ${errors.join("; ")}`);
      assert.equal(
        await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1),
        false,
        `${name} ${size}: horizontal overflow`,
      );
      await page.screenshot({ path: join(output, `${name}-${size}.png`), fullPage: true });
      let violations = [];
      if (["students", "conversation", "writing"].includes(name)) {
        const scan = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        violations = scan.violations.map((v) => v.id);
        assert.equal(violations.length, 0, `${name} ${size}: axe ${violations.join(",")}`);
      }
      const entry = { name, size, heading, elapsedMs: Date.now() - started, violations };
      results.push(entry);
      console.log("PASS", name, size, heading.slice(0, 75));
      page.off("pageerror", onError);
    }
    await context.close();
  }
} finally {
  writeFileSync(join(output, "results.json"), JSON.stringify(results, null, 2));
  await browser.close();
  await server.close();
}
console.log(`PASS ${results.length} real route renders; screenshots: ${output}`);

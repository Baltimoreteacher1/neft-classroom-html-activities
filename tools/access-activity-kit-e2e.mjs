#!/usr/bin/env node
/**
 * The shared activity kit (src/activity-kit.js + ds.css "activity kit") in a real browser, at 390/768/1280:
 * renders every zone, a directions card, all four feedback statuses and a hint ladder inside a domain container,
 * then asserts axe WCAG 2.2 AA is clean (incl. colour contrast), no horizontal overflow, every control is 44px,
 * the hint ladder reveals one rung per press, moves focus to it and fires ak:hint-used, and data-ak-in hides what
 * does not belong to the current state. A missing browser is a SKIP locally and a FAIL in CI.
 * Set SHOTS=<dir> to save screenshots.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn(
    "access-activity-kit-e2e: SKIP — playwright / @axe-core/playwright is not installed.",
  );
  process.exit(process.env.CI ? 1 : 0);
}
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
  if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
    file = join(REPO_ROOT, "public", p);
  if (!existsSync(file) || statSync(file).isDirectory()) {
    if (/^\/access-practice-lab\//.test(p) && !/\.[a-z0-9]+$/i.test(p))
      file = join(REPO_ROOT, "access-practice-lab/index.html");
    else return res.writeHead(404), res.end();
  }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (e) {
  console.warn(`access-activity-kit-e2e: SKIP — no browser (${e.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}
const failures = [];
const check = (ok, msg) => {
  if (!ok) failures.push(msg);
  console.log(`${ok ? "ok  " : "FAIL"} ${msg}`);
};
if (process.env.SHOTS) mkdirSync(process.env.SHOTS, { recursive: true });

const DOMAINS = ["Listening", "Reading", "Speaking", "Writing"];
for (const width of [390, 768, 1280]) {
  const ctx = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
  });
  await ctx.addInitScript(() => {
    try {
      localStorage.setItem("accessPracticeLab:v1:prefs", JSON.stringify({ langChosen: true }));
    } catch {}
  });
  const page = await ctx.newPage();
  const errors = [];
  // the static server has no bundler, so the optional web-vitals import cannot resolve; not a kit error
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  await page.goto(`${base}/access-practice-lab/Reading/A?grades=6-8`, { waitUntil: "load" });
  await page.waitForSelector("main#app > *", { timeout: 10000 });
  for (const domain of DOMAINS) {
    await page.evaluate(async (domain) => {
      const kit = await import("/access-practice-lab/src/activity-kit.js");
      const { makeI18n } = await import("/access-practice-lab/src/i18n.js");
      const { html, toHtml, raw } = await import("/access-practice-lab/src/util.js");
      const I = makeI18n("en");
      document.getElementById("kitDemo")?.remove();
      const box = document.createElement("section");
      box.id = "kitDemo";
      box.className = `d-${domain.toLowerCase()}`;
      box.dataset.domain = domain;
      box.setAttribute("aria-label", "Activity kit demo");
      box.innerHTML = toHtml(html`<h2>Kit demo</h2>
        ${kit.activityProgressHTML(I, 2, 5)}
        ${kit.directionsCardHTML(I, {
          learning: "I can tell what a text is mostly about.",
          doThis: "Read the short text. Choose what it is mostly about.",
          how: [
            "Read the text once.",
            "Tap the one best answer.",
            "Press Check and read the feedback.",
          ],
          success: "Your answer names the big idea, not just one detail.",
          example: {
            body: "Kites fly because moving air pushes them. Main idea: moving air makes a kite fly.",
          },
        })}
        ${kit.zoneHTML(I, "context", raw("<p>A school science club tested kites on a windy day.</p>"))}
        ${kit.zoneHTML(I, "stimulus", raw("<p>Wind lifts the wide, flat surface. A long tail keeps the kite steady.</p>"))}
        ${kit.zoneHTML(I, "task", raw("<p>What is the text mostly about?</p>"))}
        ${kit.zoneHTML(I, "response", raw('<label><input type="radio" name="k"> Wind and kites</label>'))}
        ${kit.zoneHTML(I, "hint", kit.hintLadderHTML(I, ["Look at the first sentence.", "Which answer covers both sentences?", "The text is about how wind helps a kite fly."]))}
        <div data-act-state="start" id="kitState">
          <p data-ak-in="start">Press Start.</p><p data-ak-in="feedback retry">Feedback is open.</p><p data-ak-in="complete">Done.</p>
        </div>
        ${["right", "partly", "notyet", "shown"].map((s) => kit.feedbackPanelHTML(I, { status: s, why: "Both sentences explain how wind helps a kite fly.", evidence: "the sentence that names wind", next: "Say the main idea in one sentence.", actions: html`<button type="button" class="btn small">Try again</button>` }))}`);
      document.getElementById("app").prepend(box);
      kit.wireHintLadders(box, I);
    }, domain);
    const where = `${width}px ${domain}`;
    const axe = await new AxeBuilder({ page })
      .include("#kitDemo")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    check(
      axe.violations.length === 0,
      `${where}: axe clean${axe.violations.length ? ` — ${axe.violations.map((v) => `${v.id}: ${v.nodes[0].target}`).join("; ")}` : ""}`,
    );
    const m = await page.evaluate(() => {
      const box = document.getElementById("kitDemo");
      const small = [...box.querySelectorAll("button, summary, a[href]")]
        .filter((e) => e.offsetParent)
        .map((e) => [e, e.getBoundingClientRect()])
        .filter(([, r]) => r.height < 43.5 || r.width < 43.5)
        .map(
          ([e, r]) => `${e.className || e.tagName} ${Math.round(r.width)}x${Math.round(r.height)}`,
        );
      return { overflow: document.documentElement.scrollWidth - innerWidth, small };
    });
    check(m.overflow <= 0, `${where}: no horizontal overflow (${m.overflow})`);
    check(m.small.length === 0, `${where}: controls are 44px (${m.small.join(", ")})`);
    if (domain === "Reading") {
      if (process.env.SHOTS)
        await page.locator("#kitDemo").screenshot({
          path: join(process.env.SHOTS, `kit-${width}.jpg`),
          type: "jpeg",
          quality: 60,
        });
      // hint ladder behaviour
      const btn = page.locator("#kitDemo [data-ak-hint-next]");
      check(
        (await page.locator("#kitDemo .ak-hint:visible").count()) === 0,
        `${where}: no hint shown before asking`,
      );
      await page.evaluate(() => {
        window.__hints = [];
        document
          .getElementById("kitDemo")
          .addEventListener("ak:hint-used", (e) => window.__hints.push(e.detail.used));
      });
      await btn.focus();
      await page.keyboard.press("Enter");
      check(
        (await page.locator("#kitDemo .ak-hint:visible").count()) === 1,
        `${where}: first press shows one hint`,
      );
      check(
        await page.evaluate(() => document.activeElement?.classList.contains("ak-hint")),
        `${where}: focus moves to the revealed hint`,
      );
      await btn.click();
      await btn.click();
      check(
        (await page.locator("#kitDemo .ak-hint:visible").count()) === 3,
        `${where}: three presses show three rungs`,
      );
      check(await btn.isDisabled(), `${where}: button disables after the last rung`);
      check(
        JSON.stringify(await page.evaluate(() => window.__hints)) === "[1,2,3]",
        `${where}: ak:hint-used fires 1,2,3`,
      );
      // state hiding
      const vis = async () => page.locator("#kitState p:visible").allTextContents();
      check(
        JSON.stringify(await vis()) === '["Press Start."]',
        `${where}: start shows only start content`,
      );
      await page.evaluate(async () =>
        (await import("/access-practice-lab/src/activity-kit.js")).setActivityState(
          document.getElementById("kitState"),
          "retry",
        ),
      );
      check(
        JSON.stringify(await vis()) === '["Feedback is open."]',
        `${where}: retry shows feedback content`,
      );
      await page.evaluate(async () =>
        (await import("/access-practice-lab/src/activity-kit.js")).setActivityState(
          document.getElementById("kitState"),
          "complete",
        ),
      );
      check(
        JSON.stringify(await vis()) === '["Done."]',
        `${where}: complete shows completion content`,
      );
    }
  }
  check(errors.length === 0, `${width}px: no page errors${errors.length ? ` — ${errors[0]}` : ""}`);
  await ctx.close();
}
await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-activity-kit-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-activity-kit-e2e: all checks passed");

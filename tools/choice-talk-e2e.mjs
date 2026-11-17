// Browser walk of Language Choice Boards, Talk Table, the Passport card and the Lesson Builder week, at 1280 and
// 390px: the way a student, a family and a teacher use them. Serves the source tree (tools/lib/access-serve.mjs);
// BASE=https://thelanguagepage.com runs the same walk against production. A missing browser is a SKIP (exit 3).
import { createRequire } from "node:module";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIP choice-talk-e2e: playwright not installed");
  process.exit(3);
}
const require = createRequire(import.meta.url);
const axeSource = require("fs").readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

let server;
let base = process.env.BASE;
if (!base) {
  ({ server, base } = await serveAccess());
}
const LAB = `${base}/access-practice-lab`;
const browser = await chromium.launch().catch(() => null);
if (!browser) {
  console.log("SKIP choice-talk-e2e: no browser");
  process.exit(3);
}
const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};

async function axe(page, label) {
  await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(() => window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag22aa"] }));
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  check(!bad.length, `${label}: axe serious/critical ${bad.map((v) => `${v.id} ${v.nodes.map((n) => n.html.slice(0, 90)).join(" ; ")}`).join(", ") || "0"}`);
}
const noOverflow = async (page, label) =>
  check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no sideways scroll`);

for (const width of [1280, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  // "web-vitals" is a bare npm specifier Vite resolves at build time; the source tree cannot (CLAUDE.md, smoke:injection).
  page.on("pageerror", (e) => !/"web-vitals"/.test(e.message) && errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && !/favicon|Failed to load resource.*\/api\/|"web-vitals"/.test(m.text()) && errors.push(m.text()));
  const W = `@${width}`;

  // Home: both new cards present for 3-5.
  await page.goto(`${LAB}/?grades=3-5`, { waitUntil: "networkidle" });
  check(await page.locator('a[href*="choice-boards"]').count() > 0, `${W} home links Choice Boards`);
  check(await page.locator('a[href*="talk-table"]').count() > 0, `${W} home links Talk Table`);

  // Choice Boards hub → board → three in a row.
  await page.goto(`${LAB}/choice-boards?grades=3-5`, { waitUntil: "networkidle" });
  check((await page.locator(".cb-tile").count()) === 4, `${W} hub shows 4 boards`);
  await noOverflow(page, `${W} hub`);
  await axe(page, `${W} hub`);
  await page.locator(".cb-tile-title a").last().click();
  await page.waitForSelector(".cb-grid");
  check((await page.locator(".cb-square").count()) === 9, `${W} board has 9 squares`);
  for (const i of [0, 4, 8]) {
    await page.locator(`[data-cb-open="${i}"]`).click();
    await page.waitForSelector("#cbSquare");
    if (i === 0) {
      check(await page.locator("#cbSquare [data-say]").count() >= 2, `${W} listening square has listen buttons`);
      await page.locator("[data-cb-note]").fill("Nia's reasons are stronger.");
      await axe(page, `${W} open square`);
    }
    await page.locator(`[data-cb-done="${i}"]`).click();
    await page.waitForSelector(`.cb-cell.is-done [data-cb-open="${i}"]`);
  }
  check((await page.locator(".cb-cell.is-line").count()) === 3, `${W} diagonal shows three in a row`);
  check(/Three in a row|Tres en l/.test(await page.locator(".cb-status").innerText()), `${W} status celebrates`);
  await page.reload({ waitUntil: "networkidle" });
  check((await page.locator(".cb-cell.is-done").count()) === 3, `${W} done squares survive a reload`);
  await page.locator('[data-cb-open="0"]').click();
  check((await page.locator("[data-cb-note]").inputValue()).includes("Nia"), `${W} note survives a reload`);
  await noOverflow(page, `${W} board`);

  // K board (adult-read band) renders.
  await page.goto(`${LAB}/choice-boards/narrate?grades=K`, { waitUntil: "networkidle" });
  check((await page.locator(".cb-square").count()) === 9, `${W} K board renders`);

  // Talk Table: talk, card stays, another card changes.
  await page.goto(`${LAB}/talk-table?grades=6-8`, { waitUntil: "networkidle" });
  const q1 = await page.locator("#ttQ").innerText();
  check(q1.length > 10 && (await page.locator('.tt-side[lang="es"] .tt-q').innerText()).length > 10, `${W} card shows English and Spanish`);
  await page.locator("[data-tt-follow]").click();
  check(await page.locator("#ttFollow").isVisible(), `${W} follow-up opens`);
  await page.locator("[data-tt-talked]").click();
  await page.waitForSelector("[data-tt-talked][disabled]");
  check((await page.locator("#ttQ").innerText()) === q1, `${W} talked card stays on screen`);
  await page.locator("[data-tt-next]").click();
  check((await page.locator("#ttQ").innerText()) !== q1, `${W} Another card shows a new question`);
  await page.goto(`${LAB}/talk-table/argue?grades=6-8`, { waitUntil: "networkidle" });
  check(/Take a side|Toma una/.test(await page.locator(".tt-kind").innerText()), `${W} Argue deck`);
  await noOverflow(page, `${W} talk`);
  await axe(page, `${W} talk`);

  // Passport card reads both.
  await page.goto(`${LAB}/passport?grades=3-5`, { waitUntil: "networkidle" });
  const more = await page.locator(".pass-more").innerText().catch(() => "");
  check(/Choice Boards[\s\S]*3/.test(more) && /Talk Table/.test(more), `${W} passport shows Choice Boards and Talk Table`);
  await noOverflow(page, `${W} passport`);

  // Lesson Builder: one-tap start, week plan.
  await page.goto(`${LAB}/lesson-builder?grades=6-8`, { waitUntil: "networkidle" });
  await page.locator('[data-lb-quick="explain-evidence"]').click();
  await page.waitForSelector(".lb-plan");
  check((await page.locator(".lb-phase").count()) >= 6, `${W} quick start builds a lesson`);
  check(await page.locator(".lb-home-q").count() === 1, `${W} family phase shows the Talk Table question`);
  await page.locator("[data-lb-week]").click();
  await page.waitForSelector(".lb-week");
  check((await page.locator(".lb-day").count()) === 5, `${W} week has 5 days`);
  check((await page.locator(".lb-day-home").count()) === 5, `${W} every day has a home question`);
  await noOverflow(page, `${W} lesson builder`);
  await axe(page, `${W} lesson builder`);

  check(!errors.length, `${W} no console or page errors ${errors.slice(0, 3).join(" | ")}`);
  await ctx.close();
}
await browser.close();
server?.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASS");
process.exit(fails.length ? 1 : 0);

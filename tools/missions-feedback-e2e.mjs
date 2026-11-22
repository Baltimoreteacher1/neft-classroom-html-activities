#!/usr/bin/env node
/**
 * Adaptive mission feedback in a real browser (390px and 1280px): a wrong choice names itself and coaches, the right
 * choice explains, a wrong evidence set names the bad statement without revealing the others, the third check shows
 * the supporting statements and puts them on the evidence board. No sideways scroll, no console errors.
 * `--shots <dir>` saves screenshots. Serves the source tree.
 */
import { mkdirSync } from "node:fs";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("missions-feedback-e2e: SKIP, playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}
const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
let failed = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${msg}`);
  if (!ok) failed += 1;
};

const { server, base } = await serveAccess();
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
for (const [label, width, height] of [
  ["390", 390, 844],
  ["1280", 1280, 900],
]) {
  const page = await (await browser.newContext({ viewport: { width, height } })).newPage();
  const errors = [];
  // "web-vitals" is a build-time specifier Vite resolves for dist/; a source-tree server cannot, in any page.
  const real = (t) => !/Failed to resolve module specifier "web-vitals"/.test(t);
  page.on("pageerror", (e) => real(e.message) && errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && real(m.text()) && errors.push(m.text()));
  await page.goto(
    `${base}/access-practice-lab/missions/saving-the-school-garden?phase=listen&grades=3-5`,
  );
  await page.waitForSelector(".mission-q");
  // question: wrong option first
  const q = page.locator("fieldset.mission-q").first();
  await q.locator(".choice").nth(2).click();
  await q.locator("[data-check-q]").click();
  const miss = await q.locator(".feedback").innerText();
  check(
    /You chose/.test(miss) && /Not yet/.test(miss),
    `${label}px: first miss names the choice and coaches`,
  );
  check(!/keeps more water/.test(miss), `${label}px: first miss does not reveal the answer`);
  await q.locator(".choice").nth(0).click();
  await q.locator("[data-check-q]").click();
  check(
    /Correct/.test(await q.locator(".feedback").innerText()),
    `${label}px: right answer confirmed with its explanation`,
  );
  // evidence: pick only wrong statements three times
  const ev = page.locator("fieldset.mission-q").nth(1);
  await ev.locator(".choice").filter({ hasText: "Monday and Thursday" }).click();
  await ev.locator("[data-check-ev]").click();
  let fb = await ev.locator(".feedback").innerText();
  check(
    /Monday and Thursday/.test(fb) && !/dry leaves/.test(fb),
    `${label}px: evidence miss names the wrong statement, hides the right ones`,
  );
  await ev.locator("[data-check-ev]").click();
  fb = await ev.locator(".feedback").innerText();
  check(/If you are still unsure/.test(fb), `${label}px: second miss says what happens next`);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/mission-evidence-retry-${label}.png` });
  await ev.locator("[data-check-ev]").click();
  fb = await ev.locator(".feedback").innerText();
  check(
    /dry leaves/.test(fb) && /Here are the supporting statements/.test(fb),
    `${label}px: third check shows the supporting statements`,
  );
  check(
    (await page.locator(".mission-q input[data-ev]:disabled").count()) > 0 &&
      /dry leaves/.test(await page.locator("body").innerText()),
    `${label}px: evidence locked and on the board`,
  );
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/mission-evidence-reveal-${label}.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check(overflow <= 0, `${label}px: no sideways scroll (${overflow}px)`);
  // reload keeps the revealed state
  await page.reload();
  await page.waitForSelector(".mission-q");
  check(
    /supporting statements/.test(await page.locator("fieldset.mission-q").nth(1).innerText()),
    `${label}px: reload keeps the saved result`,
  );
  check(
    errors.length === 0,
    `${label}px: no page or console errors ${errors.slice(0, 2).join("; ")}`,
  );
}
await browser.close();
server.close();
console.log(
  failed ? `missions-feedback-e2e: ${failed} failed` : "missions-feedback-e2e: all passed",
);
process.exit(failed ? 1 : 0);

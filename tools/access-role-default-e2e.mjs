#!/usr/bin/env node
/* The Teacher | Student | Family View switch, driven the way each visitor meets it (docs/language-page/award-panel-audit
 * E7). Fresh browser contexts, ten pages that show the switch:
 *   - nobody has chosen anything          -> Student is pressed on every page
 *   - the Teacher door was used           -> Teacher is pressed
 *   - the switch was pressed to Family    -> Family stays pressed, whatever door was used
 * Serves the source tree. No Chromium: SKIP locally, FAIL in CI. */
import { serveAccess } from "./lib/access-serve.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const { chromium } = await import("playwright");
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch {
  process.exit(skipExit("no Chromium available", "Set PW_CHROMIUM_PATH to a system Chromium"));
}
const { server, base } = await serveAccess();
const ROUTES = [
  "path",
  "speak",
  "write",
  "scenarios",
  "worlds",
  "grammar",
  "vocabulary",
  "learn",
  "passport",
  "growth",
];
let failed = 0;
const fail = (m) => {
  failed += 1;
  console.error(`  FAIL  ${m}`);
};

async function pressed(seed, route) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript((s) => {
    try {
      for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v);
    } catch {}
  }, seed);
  const page = await ctx.newPage();
  await page.goto(`${base}/access-practice-lab/${route}?grades=6-8`, { waitUntil: "load" });
  await page.waitForSelector("[data-tlp-role-btn]", { timeout: 15000 }).catch(() => {});
  const out = await page.evaluate(() => ({
    pressed: [...document.querySelectorAll("[data-tlp-role-btn][aria-pressed=true]")].map(
      (b) => b.dataset.tlpRoleBtn,
    ),
    attr: document.documentElement.dataset.tlpRole,
  }));
  await ctx.close();
  return out;
}

const AUDIENCE = "accessPracticeLab:v1:audience";
for (const route of ROUTES) {
  const none = await pressed({}, route);
  if (none.pressed.join() !== "student" || none.attr !== "student")
    fail(`/${route}: nobody chose anything but the switch shows ${JSON.stringify(none)}`);
}
for (const route of ROUTES.slice(0, 3)) {
  const door = await pressed({ [AUDIENCE]: "teacher" }, route);
  if (door.pressed.join() !== "teacher")
    fail(`/${route}: after the Teacher door the switch shows ${JSON.stringify(door)}`);
  const chosen = await pressed(
    { [AUDIENCE]: "teacher", tlp_v1_prefs: JSON.stringify({ schemaVersion: 1, role: "family" }) },
    route,
  );
  if (chosen.pressed.join() !== "family")
    fail(`/${route}: an explicit Family choice lost to the door: ${JSON.stringify(chosen)}`);
}
await browser.close();
server.close();
if (failed) {
  console.error(`access-role-default-e2e: ${failed} failure(s)`);
  process.exit(1);
}
console.log(
  `access-role-default-e2e: PASS (${ROUTES.length} pages default to Student; a remembered door and an explicit choice both win)`,
);

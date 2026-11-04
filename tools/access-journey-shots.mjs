#!/usr/bin/env node
/**
 * Visual-QA screenshots of the ACCESS Learning Journey for both bands, taken from a real play-through of
 * mission 8 so every engine screen is captured in a live, meaningful state (not an empty first paint).
 *
 *   node tools/access-journey-shots.mjs [outDir]       default: <os tmpdir>/journey-screens (never under reports/)
 *
 * Each screen is saved at desktop 1440x900, tablet 820x1180 and mobile 390x844 as a viewport shot and a full-page shot.
 */
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as E from "../access-practice-lab/src/journey/engines/listen.js";
import * as D from "./lib/access-journey-e2e-drive.mjs";
import { loadTools, newSession, serve } from "./lib/access-journey-e2e-kit.mjs";

// Never write into reports/: it ships wholesale with the site and the dist is at Cloudflare's file limit.
const out = process.argv[2] || join(tmpdir(), "journey-screens");
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 820, height: 1180 },
  mobile: { width: 390, height: 844 },
};
const tools = await loadTools();
if (!tools) {
  console.warn("access-journey-shots: SKIP - playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const server = await serve();
const origin = `http://localhost:${server.address().port}`;
const browser = await tools.chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});

let n = 0;
async function snap(S, band, name) {
  const dir = join(out, band);
  mkdirSync(dir, { recursive: true });
  const id = String(++n).padStart(2, "0");
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    await S.page.setViewportSize(size);
    await S.page.waitForTimeout(350);
    await S.page.evaluate(() => window.scrollTo(0, 0));
    await S.page.screenshot({ path: join(dir, `${id}-${name}-${vp}.png`) });
    await S.page.screenshot({ path: join(dir, `${id}-${name}-${vp}-full.png`), fullPage: true });
  }
  await S.page.setViewportSize(VIEWPORTS.desktop);
}

async function band(b) {
  n = 0;
  const pack = await D.packOf("m08", b);
  const S = await newSession(browser, origin, {
    band: b,
    permissions: ["microphone"],
    viewport: VIEWPORTS.desktop,
  });
  const { page } = S;
  const comm = (task) =>
    task.kind === "converse" ? D.driveConverse(page, task) : D.driveCompose(page, task);
  try {
    await S.go("/journey");
    await snap(S, b, "journey-home-new");
    await S.go("/");
    await snap(S, b, "lab-home");
    await S.go("/journey/map");
    await snap(S, b, "journey-map-new");
    await S.go("/journey/m08");
    await snap(S, b, "mission-overview-m08");

    await S.go("/journey/m08/discover");
    const [first, second] = pack.discover.objects;
    for (const o of [first, second])
      await page.locator(`.sc-hot[data-sc-examine="${o.id}"]`).first().click();
    await snap(S, b, "scene-discover-exploring");
    await D.driveDiscover(page, pack.discover, { stopAfter: "draft" });
    await snap(S, b, "scene-discover-explaining");
    await page.locator("[data-sc-send]").click();
    await page.waitForSelector("[data-jr-continue]");
    await snap(S, b, "scene-partner-reply");
    await D.finishStep(page);
    await D.followTo(page, "/m08/understand");

    await D.driveListen(page, E, pack.understand.listen, {
      miss: true,
      onRepair: () => snap(S, b, "listening-repair"),
    });
    await page.waitForSelector("[data-xr=pick]");
    await D.driveRead(page, pack.understand.read, {
      afterWhy: async () => {
        await snap(S, b, "reading-xray-checked");
        await page.locator('[data-xr="layer"][data-layer="meaning"]').click();
        await snap(S, b, "reading-xray-layer");
        await page.locator('[data-xr="layer"][data-layer="meaning"]').click();
      },
    });
    await D.finishStep(page);
    await D.followTo(page, "/m08/build");

    await page.locator("[data-cn=start]").click();
    await page.waitForSelector('[data-cn-root][data-phase="try"]');
    await snap(S, b, "build-try");
    await S.go("/journey/m08/build");
    await D.driveBuild(page, pack.build);
    await D.finishStep(page);
    await D.followTo(page, "/m08/communicate");

    await comm(pack.communicate);
    await snap(S, b, "communicate-finished");
    await D.finishStep(page);
    await D.followTo(page, "/m08/improve");

    await page.waitForSelector("[data-mirror-focus=revise]");
    await snap(S, b, "mirror-improve-start");
    await D.driveImprove(page, pack);
    await page.waitForSelector("[data-jr-panel=complete]");
    await snap(S, b, "improve-complete");
    await D.followTo(page, "/m08/show");

    await D.driveCompose(page, pack.show, { stopAfterDraft: true }).catch(() => {});
    await snap(S, b, "show-writing");
    await page.reload();
    await page.waitForSelector("[data-jt-draft], [data-jt-input]");
    await comm(pack.show);
    await D.finishStep(page);
    await snap(S, b, "show-summary");

    await S.go("/journey/map");
    await snap(S, b, "journey-map-progress");
    await S.go("/journey");
    await snap(S, b, "journey-home-progress");
    await S.go("/family");
    await snap(S, b, "family-home");
    await S.go("/family?mission=m08");
    await snap(S, b, "family-companion-m08");
    await S.go("/passport");
    await snap(S, b, "passport-journey-evidence");
    await S.go("/journey/guide");
    await snap(S, b, "teacher-guide");
    await page.goto(`${origin}/access-teacher/?lang=en`, { waitUntil: "load" });
    await page
      .waitForSelector("#journeyGuideBody .jg, #journeyGuideBody > *:not(.acc-hint)", {
        timeout: 15000,
      })
      .catch(() => {});
    await snap(S, b, "teacher-hub-panel");
  } catch (error) {
    console.error(`${b}: ${error.message.split("\n")[0]}`);
    console.error(
      (
        await page
          .locator("body")
          .innerText()
          .catch(() => "")
      ).slice(0, 400),
    );
    process.exitCode = 1;
  }
  if (S.errors.length) console.warn(`${b}: console/page errors`, S.errors.slice(0, 3));
  await S.context.close();
  console.log(`${b}: ${n} screens in ${join(out, b)}`);
}

try {
  for (const b of ["3-5", "6-8"]) await band(b);
} finally {
  await browser.close();
  server.close();
}

// Layout suite: every Family Math 2.0 screen x language x width must fit, not clip, not overlap, keep 44px targets,
// keep the Save/Resume pill and the sticky action bar off the controls, and have sound headings and image names.
//   node tools/fm2/browser-layout.mjs [--widths=320,375] [--langs=en] [--only=home,play-math-market] [--jobs=4] [--games=math-market]
// Exit 1 on any finding. A full run opens about 1,000 pages; use the filters while iterating.
// @fm2 FM-040 FM-041 FM-091 FM-035 FM-036
import { mkdirSync, writeFileSync } from "node:fs";
import {
  auditCover,
  auditLayout,
  buildScreens,
  filterScreens,
  parseArgs,
  printSummary,
  runMatrix,
  SHOTS,
} from "./browser-kit.mjs";
import { launch } from "./harness.mjs";

// Positive controls: the audit must flag each planted defect, or a clean report would mean nothing.
async function selfTest(h) {
  const context = await h.context({ width: 375, height: 667 });
  const page = await context.newPage();
  await page.goto(h.url("index.html?grade=3&lang=en"));
  await page.waitForSelector("[data-testid=game-card]");
  await page.evaluate(() => {
    const box = document.createElement("div");
    box.id = "planted";
    box.innerHTML = `<div style="width:600px;height:20px;background:#ccc">wide</div>
      <div style="width:60px;overflow:hidden;white-space:nowrap">clipped text that is far too long for the box</div>
      <button style="position:absolute;left:10px;top:10px;width:30px;height:30px">a</button>
      <button style="position:absolute;left:20px;top:20px;width:80px;height:50px">overlap</button>
      <svg role="img" width="20" height="20"></svg><h4>skipped heading</h4>`;
    document.querySelector("main").append(box);
  });
  const cats = new Set((await page.evaluate(auditLayout)).map((f) => f.cat));
  await context.close();
  const missing = [
    "page-overflow",
    "wide-element",
    "clipped-text",
    "control-overlap",
    "small-target",
    "img-name",
    "headings",
  ].filter((c) => !cats.has(c));
  if (missing.length)
    throw new Error(`layout audit self-test: did not detect planted ${missing.join(", ")}`);
  console.log("layout: self-test detected every planted defect");
}

const args = parseArgs();
mkdirSync(SHOTS, { recursive: true });
const h = await launch();
const started = Date.now();
const findings = [];
let checked = 0;
try {
  await selfTest(h);
  const { screens, games } = await buildScreens();
  const chosen = filterScreens(screens, args).filter((s) => !s.captureOnly);
  console.log(
    `layout: ${chosen.length} screens x ${args.langs.length} langs x ${args.widths.length} widths`,
  );
  const failures = await runMatrix(
    h,
    { screens: chosen, games, langs: args.langs, widths: args.widths, jobs: args.jobs },
    async (page, screen, env) => {
      const tag = { screen: screen.id, lang: env.lang, width: env.width };
      const keep = (list) => findings.push(...list.map((f) => ({ ...tag, ...f })));
      // Audited at the bottom of the page: the sticky action bar is then in its natural place, so controls that overlap are
      // really stacked on each other rather than a bar sliding over them mid-scroll (that case is the cover check below).
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(300);
      keep(await page.evaluate(auditLayout));
      // Pages must render what they promise: an error card on a screen that should work is a defect, and so is any console error.
      const errorCard = await page.evaluate(
        () =>
          Boolean(
            document.querySelector(
              "[data-testid=home-error-card], #pg-body .pk-banner[role=alert]",
            ),
          ) ||
          (!location.search.includes("no-such") &&
            !location.search.includes("grade=99") &&
            !location.search.includes("plan=garbage") &&
            !location.search.includes("no-game") &&
            Boolean(document.querySelector("[data-testid=play-error]"))),
      );
      if (errorCard)
        keep([
          {
            cat: "unexpected-error-card",
            detail: "page shows its error card instead of the screen",
          },
        ]);
      keep(
        [...new Set(env.pageErrors)].map((e) => ({
          cat: "browser-problem",
          detail: e.slice(0, 160),
        })),
      );
      for (const where of ["top", "bottom"]) {
        await page.evaluate(
          (w) => window.scrollTo(0, w === "top" ? 0 : document.documentElement.scrollHeight),
          where,
        );
        await page.waitForTimeout(300);
        keep(
          (await page.evaluate(auditCover)).map((f) => ({
            ...f,
            detail: `${f.detail} [scrolled to ${where}]`,
          })),
        );
      }
      checked += 1;
    },
  );
  findings.push(...failures);
  const external = findings.filter(
    (f) => f.cat === "external-nsr-small" || f.cat === "inline-link-note",
  );
  const real = findings.filter((f) => !external.includes(f));
  writeFileSync(
    `${SHOTS}/layout-report.json`,
    JSON.stringify({ checked, real, external }, null, 1),
  );
  console.log(
    `layout: ${checked} screen renders audited in ${Math.round((Date.now() - started) / 1000)}s`,
  );
  if (external.length) {
    console.log("not ours (reported separately, not failing):");
    printSummary(external, 6);
  }
  if (real.length) {
    console.log(`FAIL layout: ${real.length} findings`);
    printSummary(real, 60);
    process.exitCode = 1;
  } else console.log("PASS layout: no findings");
} finally {
  await h.close();
}

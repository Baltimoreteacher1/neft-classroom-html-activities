// Capture tool: writes a PNG of every Family Math 2.0 screen to /tmp/claude-501/fm2-shots/qa/<screen>-<lang>-<width>.png
// for human review. The only assertion is that the page rendered (a heading and real content, no loading placeholder).
//   node tools/fm2/capture-screens.mjs [--widths=375,1440] [--langs=en] [--only=play,home-coach] [--jobs=4] [--games=math-market]
// @fm2 FM-090
import { mkdirSync } from "node:fs";
import { buildScreens, filterScreens, parseArgs, runMatrix, SHOTS } from "./browser-kit.mjs";
import { launch } from "./harness.mjs";

const args = parseArgs();
mkdirSync(SHOTS, { recursive: true });
const h = await launch();
const started = Date.now();
let written = 0;
const notRendered = [];
try {
  const { screens, games } = await buildScreens();
  const chosen = filterScreens(screens, args);
  console.log(
    `capture: ${chosen.length} screens x ${args.langs.length} langs x ${args.widths.length} widths -> ${SHOTS}`,
  );
  const failures = await runMatrix(
    h,
    { screens: chosen, games, langs: args.langs, widths: args.widths, jobs: args.jobs },
    async (page, screen, env) => {
      const state = await page.evaluate(() => ({
        text: (document.body.innerText || "").trim().length,
        heading: Boolean(document.querySelector("h1, h2")),
        loading: Boolean(document.querySelector(".pg-loading, .hm-loading")),
      }));
      const where = `${screen.id}@${env.lang}/${env.width}`;
      if (state.text < 60 || !state.heading || state.loading)
        notRendered.push(
          `${where} (text ${state.text}, heading ${state.heading}, loading ${state.loading})`,
        );
      const file = `${SHOTS}/${screen.id}-${env.lang}-${env.width}.png`;
      if (screen.crop) await page.locator(screen.crop).first().screenshot({ path: file });
      else await page.screenshot({ path: file, fullPage: true });
      written += 1;
    },
  );
  console.log(`capture: ${written} PNGs in ${Math.round((Date.now() - started) / 1000)}s`);
  for (const f of failures) console.log(`  FAILED ${f.screen}@${f.lang}/${f.width}: ${f.detail}`);
  for (const n of notRendered) console.log(`  NOT RENDERED ${n}`);
  if (failures.length || notRendered.length) process.exitCode = 1;
  else console.log("PASS capture: every screen rendered");
} finally {
  await h.close();
}

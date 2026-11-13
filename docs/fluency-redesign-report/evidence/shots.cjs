const { chromium } = require("/Users/joelneft/wt-fluency-features/node_modules/playwright");
const BASE = process.argv[2] || "https://eduwonderlab.com"; const OUT = process.argv[3];
const APP = `${BASE}/math/fluency-lab/`;
(async () => {
  const b = await chromium.launch();
  const shot = async (name, w, h, steps, { full = false } = {}) => {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 }); const p = await ctx.newPage();
    await steps(p); await p.waitForTimeout(700);
    await p.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 78, fullPage: full }); await ctx.close(); console.log("shot", name);
  };
  const go = (u) => async (p) => { await p.goto(u, { waitUntil: "networkidle" }); };
  // BEFORE: the old app, kept at /math/fluency-lab/lab
  await shot("before-home-1440", 1440, 900, go(`${APP}lab`));
  await shot("before-home-375-full", 375, 812, go(`${APP}lab`), { full: true });
  // AFTER
  await shot("after-first-visit-375", 375, 812, go(APP));
  await shot("after-first-visit-1440", 1440, 900, go(APP));
  await shot("after-home-1440", 1440, 900, go(`${APP}?grade=6`));
  await shot("after-skill-see-375", 375, 812, go(`${APP}?grade=6&skill=ratios`));
  await shot("after-skill-see-1440", 1440, 900, go(`${APP}?grade=6&skill=ratios`));
  await shot("after-library-375", 375, 812, go(`${APP}?view=library&grade=5`));
  await shot("after-progress-375", 375, 812, go(`${APP}?view=my-progress&grade=6`));
  await shot("after-skill-es-375", 375, 812, go(`${APP}?grade=6&skill=lcm&lang=es`));
  const answer = (v) => async (p) => { await p.goto(`${APP}?grade=3&skill=add-sub-1000&stage=practice`, { waitUntil: "networkidle" }); await p.fill("main input", v); await p.keyboard.press("Enter"); await p.waitForTimeout(900); };
  await shot("after-practice-miss-picture-375", 375, 812, answer("1"), { full: true });
  await shot("after-practice-miss-picture-320", 320, 700, answer("1"));
  await b.close();
})();

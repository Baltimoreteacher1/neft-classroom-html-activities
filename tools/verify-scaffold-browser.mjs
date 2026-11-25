// Scaffold Studio in a real browser: the /styleguide route renders every component, in three themes and two
// reading faces, with no console errors, no sideways scroll at 360/768/1280, 44px targets, axe (WCAG 2.2 AA) clean,
// and the interactive pieces (theme switch, grow-a-sentence) really change the page. A missing browser is a SKIP.
// Screenshots go to docs/scaffold-studio/screenshots/ (a record for human review, not a pixel-diff baseline).
import { mkdirSync, readFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import { serveAccess } from "./lib/access-serve.mjs";

const SKIP = 3;
const AXE = readFileSync(new URL("../node_modules/axe-core/axe.min.js", import.meta.url), "utf8");
const OUT = new URL("../docs/scaffold-studio/screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH }
      : { executablePath: "/usr/bin/google-chrome" },
  );
} catch (e) {
  console.warn(`SKIP verify-scaffold-browser: no browser (${String(e.message).split("\n")[0]})`);
  process.exit(SKIP);
}
const { server, base } = await serveAccess();
const fails = [];
const check = (ok, msg) => {
  if (!ok) fails.push(msg);
};

const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const logs = [];
page.on("pageerror", (e) => !/web-vitals/.test(e.message) && logs.push(`pageerror: ${e.message}`));
page.on("console", (m) => m.type() === "error" && logs.push(`console: ${m.text()}`));
await page.goto(`${base}/access-practice-lab/styleguide`, { waitUntil: "networkidle" });
await page.waitForSelector("[data-ss-spec='word-popover']", { timeout: 10000 });

const specs = await page.$$eval("[data-ss-spec]", (n) => n.map((e) => e.dataset.ssSpec));
for (const s of [
  "tokens",
  "word-popover",
  "chunk-overlay",
  "frame-tray",
  "grow-sentence",
  "rehearsal",
  "support-dial",
  "progress-ring",
  "export-dialog",
])
  check(specs.includes(s), `missing spec section ${s}`);

// grow-a-sentence button really grows the sentence
const before = await page.$eval("[data-ss-spec='grow-sentence']", (e) => e.textContent);
const growBtn = await page.$("[data-ss-grow='when']");
check(!!growBtn, "no grow button for 'when'");
if (growBtn) {
  await growBtn.click();
  const after = await page.$eval("[data-ss-spec='grow-sentence']", (e) => e.textContent);
  check(
    after.includes("on Monday") && !before.includes("on Monday"),
    "grow-a-sentence did not add the 'when' part",
  );
}

for (const theme of ["light", "dark", "hc"]) {
  for (const font of ["default", "easy"]) {
    await page.check(`input[name=ssg-theme][value=${theme}]`);
    await page.check(`input[name=ssg-font][value=${font}]`);
    check(
      (await page.getAttribute("#ssg-root", "data-ss-theme")) === theme,
      `theme ${theme} not applied`,
    );
    check(
      (await page.getAttribute("#ssg-root", "data-ss-font")) === font,
      `font ${font} not applied`,
    );
    await page.addScriptTag({ content: AXE }).catch(() => {});
    const res = await page.evaluate(async () => {
      const r = await window.axe.run("#ssg-root", {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa", "wcag21aa"] },
      });
      return r.violations
        .filter((v) => ["serious", "critical"].includes(v.impact))
        .map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0].target}`);
    });
    for (const v of res) check(false, `axe [${theme}/${font}] ${v}`);
    if (font === "default")
      await page.locator("#ssg-root").screenshot({ path: `${OUT}styleguide-${theme}.png` });
  }
}

// targets: every button and radio label in the guide is at least 44px tall (inline word buttons excepted: they sit in running text)
await page.check("input[name=ssg-theme][value=light]");
const small = await page.$$eval("#ssg-root button:not(.ss-word), #ssg-root label", (els) =>
  els
    .filter((e) => e.offsetParent && e.getBoundingClientRect().height < 43)
    .map((e) => `${e.tagName}:${(e.textContent || "").trim().slice(0, 30)}`),
);
check(small.length === 0, `targets under 44px: ${small.slice(0, 5).join(" | ")}`);

for (const w of [360, 768, 1280]) {
  await page.setViewportSize({ width: w, height: 800 });
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  check(over <= 1, `horizontal scroll ${over}px at ${w}px`);
}
await page.emulateMedia({ reducedMotion: "reduce" });
const anim = await page.$$eval(
  "#ssg-root *",
  (els) =>
    els.filter((e) => {
      const s = getComputedStyle(e);
      return s.animationName !== "none" && parseFloat(s.animationDuration) > 0.01;
    }).length,
);
check(anim === 0, `${anim} elements animate under reduced motion`);
check(logs.length === 0, `console problems: ${logs.slice(0, 3).join(" | ")}`);

// ---- /supports: the live layer, driven the way a student and a teacher use it ----
{
  const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const sp = await ctx2.newPage();
  const slogs = [];
  sp.on("pageerror", (e) => !/web-vitals/.test(e.message) && slogs.push(e.message));
  // Closed by default for students: the layer must not show until studentRelease is true.
  await sp.goto(`${base}/access-practice-lab/supports`, { waitUntil: "networkidle" });
  check(
    (await sp.$("#ss-main")) === null,
    "/supports shows the layer to students while studentRelease is false",
  );
  await sp.goto(`${base}/access-practice-lab/supports?scaffold=preview`, {
    waitUntil: "networkidle",
  });
  await sp.waitForSelector("#ss-main");
  // tap a word -> popover, Escape closes and returns focus
  await sp.click(".ss-word >> nth=0");
  check(await sp.isVisible(".ss-pop"), "tap-a-word did not open a popover");
  await sp.keyboard.press("Escape");
  check((await sp.$(".ss-pop")) === null, "Escape did not close the popover");
  // ask the passage: answer + evidence highlight; unanswerable refused
  await sp.fill("[data-ss-question]", "What do roots take in?");
  await sp.click("[data-ss-ask]");
  check(
    /water and nutrients/.test(await sp.textContent("[data-ss-answer]")),
    "ask-the-passage did not find the sentence",
  );
  check(
    (await sp.$$("[data-ss-passage] mark")).length === 1,
    "evidence sentence was not highlighted",
  );
  await sp.fill("[data-ss-question]", "Who won the soccer game?");
  await sp.click("[data-ss-ask]");
  check(
    /won't guess/.test(await sp.textContent("[data-ss-answer]")),
    "ask-the-passage did not refuse",
  );
  // dial persists across reload and I-need-more-help moves up with no penalty
  await sp.check("input[name=ss-dial][value=none]");
  await sp.reload({ waitUntil: "networkidle" });
  check(await sp.isChecked("input[name=ss-dial][value=none]"), "support dial was not remembered");
  await sp.click("[data-ss-more-help]");
  const moved = await sp
    .waitForFunction(
      () => document.querySelector("input[name=ss-dial][value=hint]")?.checked,
      null,
      { timeout: 3000 },
    )
    .then(
      () => true,
      () => false,
    );
  check(moved, "I need more help did not move one step up");
  // writing feedback appears in order and states its limit; no score words
  await sp.fill("[data-ss-write]", "first plant a seed. then water it");
  await sp.waitForSelector("text=Next step", { timeout: 4000 });
  const fbText = await sp.textContent("#ss-main");
  check(
    /cannot tell if your ideas are good/.test(fbText),
    "writing feedback missing its limit statement",
  );
  // finish an activity, then export as teacher (counts only)
  await sp.click("[data-ss-done]");
  await sp.check("[data-ss-teacher]");
  const [dl] = await Promise.all([sp.waitForEvent("download"), sp.click("[data-ss-export=csv]")]);
  const csv = readFileSync(await dl.path(), "utf8");
  check(
    /^unit,domain,runs/.test(csv) &&
      /growing-things/.test(csv) &&
      !/score|percent/i.test(csv.split("\r\n")[0]),
    "CSV export malformed",
  );
  const stored = await sp.evaluate(() => localStorage.getItem("accessPracticeLab:v1:scaffold"));
  check(!!stored && !/\bscore\b/.test(stored), "profile missing or contains a score field");
  // axe on the live page, both views
  await sp.addScriptTag({ content: AXE });
  const ax = await sp.evaluate(async () =>
    (
      await window.axe.run("#ss-main", {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag22aa"] },
      })
    ).violations
      .filter((v) => ["serious", "critical"].includes(v.impact))
      .map((v) => `${v.id}: ${v.nodes[0].target}`),
  );
  for (const v of ax) check(false, `axe /supports ${v}`);
  for (const w of [360, 768]) {
    await sp.setViewportSize({ width: w, height: 800 });
    check(
      (await sp.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )) <= 1,
      `/supports overflows at ${w}px`,
    );
  }
  await sp.screenshot({ path: `${OUT}supports-live.png`, fullPage: true });
  check(slogs.length === 0, `/supports page errors: ${slogs.slice(0, 2).join(" | ")}`);
  await ctx2.close();
}

await browser.close();
server.close();
if (fails.length) {
  console.error(`FAIL verify-scaffold-browser:\n - ${fails.join("\n - ")}`);
  process.exit(1);
}
console.log(
  `PASS verify-scaffold-browser: ${specs.length} sections, /supports live flow (word, ask, dial, writing, export), 3 themes x 2 faces axe-clean, no overflow at 360/768/1280, 44px targets, reduced motion honoured`,
);

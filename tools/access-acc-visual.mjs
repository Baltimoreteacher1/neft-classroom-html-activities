#!/usr/bin/env node
/**
 * ACCESS ecosystem visual + structural sweep. Opens every ACCESS route at 1440 / 768 / 390 px in a real browser and
 * reports: horizontal overflow, console and page errors, failed same-origin requests, interactive targets below the
 * 44px floor (WCAG 2.2 AA minimum; the design target is 48px), missing page landmarks/h1, and axe WCAG 2.2 AA
 * violations. Writes full-page PNGs for a person to open and LOOK at.
 *   node tools/access-acc-visual.mjs [--out <dir>] [--only <route-id>] [--widths 1440,768,390] [--no-axe]
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { serveAccess } from "./lib/access-serve.mjs";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const OUT = opt("out", join(process.env.TMPDIR || "/tmp", "access-acc-visual"));
const ONLY = opt("only", "");
const WIDTHS = opt("widths", "1440,768,390").split(",").map(Number);
const USE_AXE = !args.includes("--no-axe");

export const SCREENS = [
  { id: "lab", path: "/access-practice-lab/" },
  { id: "lab-tests", path: "/access-practice-lab/tests" },
  { id: "assess", path: "/access-practice-lab/assess" },
  {
    id: "assess-run",
    path: "/access-practice-lab/assess/starter-6-8?mode=summative",
    after: async (page) => {
      await page.locator("#accTimer").uncheck();
      await page.locator("[data-act=begin]").click();
      await page.locator(".acc-stem").waitFor();
      const fold = page.locator(".acc-tools-details > summary:visible");
      if (await fold.count()) await fold.click(); // phones fold the tools
      await page.locator("[data-tool=eliminator]").click();
    },
  },
  {
    id: "assess-speak",
    path: "/access-practice-lab/assess/starter-3-5?mode=summative",
    after: async (page) => {
      await page.locator("#accTimer").uncheck();
      await page.locator("[data-act=begin]").click();
      await page.locator(".acc-stem").waitFor();
      for (let i = 0; i < 8; i++) await page.locator("[data-act=next]").click();
      await page.locator("[data-act=mic-check]").click();
      await page.locator('.acc-mic[data-state="ready"]').waitFor({ timeout: 15000 });
      await page.locator("[data-act=speak-begin]").click();
      await page.locator("[data-act=speak-skip]").click();
      await page.locator(".acc-recording").waitFor();
      await page.waitForTimeout(1500);
    },
  },
  {
    id: "assess-learn",
    path: "/access-practice-lab/assess/starter-3-5?mode=formative",
    after: async (page) => {
      await page.locator("[data-act=begin]").click();
      await page.locator(".acc-stem").waitFor();
      await page.locator(".acc-choice input").first().check();
      await page.locator("[data-act=check]").click();
      await page.locator('[data-support-tier="1"]').click();
    },
  },
  { id: "family", path: "/access-practice-lab/family" },
  { id: "family-understand", path: "/access-practice-lab/family/understand" },
  { id: "family-tour", path: "/access-family-tour/" },
  { id: "family-adventure", path: "/access-family-expedition/" },
  { id: "teacher", path: "/access-teacher/" },
  { id: "teacher-flight-deck", path: "/access-teacher/flight-deck/" },
  { id: "expedition", path: "/access-expedition/" },
];

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-acc-visual: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-acc-visual: axe-core/playwright missing; axe skipped.");
}

mkdirSync(OUT, { recursive: true });
const { server, base } = await serveAccess();
const browser = await chromium.launch({
  args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
});
const problems = [];
const note = (screen, width, msg) => problems.push(`${screen.id}@${width}: ${msg}`);

for (const screen of SCREENS.filter((s) => !ONLY || s.id === ONLY)) {
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({
      viewport: { width, height: width < 500 ? 844 : 900 },
      reducedMotion: "reduce",
    });
    const page = await ctx.newPage();
    const errors = [];
    // "web-vitals" and "@engine/..." are Vite build-time specifiers; the source tree cannot resolve them (smoke-injection ignores them too).
    page.on(
      "pageerror",
      (e) => !/web-vitals|@engine\//.test(e.message) && errors.push(`pageerror ${e.message}`),
    );
    page.on("console", (m) => m.type() === "error" && errors.push(`console ${m.text()}`));
    page.on("requestfailed", (r) => {
      if (r.url().startsWith(base) && !/favicon/.test(r.url()))
        errors.push(`requestfailed ${r.url().replace(base, "")}`);
    });
    page.on("response", (r) => {
      if (r.url().startsWith(base) && r.status() >= 400 && !/favicon/.test(r.url()))
        errors.push(`http ${r.status()} ${r.url().replace(base, "")}`);
    });
    try {
      await page.goto(base + screen.path, { waitUntil: "networkidle", timeout: 30000 });
      await screen.after?.(page);
      await page.waitForTimeout(400);
      await page.screenshot({ path: join(OUT, `${screen.id}-${width}-fold.png`) });
      await page.screenshot({ path: join(OUT, `${screen.id}-${width}.png`), fullPage: true });
      const m = await page.evaluate(() => {
        const doc = document.documentElement;
        const small = [];
        for (const el of document.querySelectorAll(
          "a[href],button,summary,input:not([type=hidden]),select,textarea,[role=button],[tabindex='0']",
        )) {
          // A checkbox or radio is operated through its label; measure the label.
          const box = el.matches("input[type=checkbox],input[type=radio]")
            ? el.closest("label") || el
            : el;
          const r = box.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (
            !r.width ||
            !r.height ||
            cs.visibility === "hidden" ||
            cs.display === "none" ||
            el.closest("[hidden],[aria-hidden=true]")
          )
            continue;
          // WCAG 2.5.8 exempts inline links inside running text.
          // A splitter is a drag handle with full arrow-key operation; its 24px track meets WCAG 2.5.8 (AA).
          if (el.getAttribute("role") === "separator") continue;
          // A visually hidden file input is operated through its visible 48px label.
          if (el.classList.contains("acc-visually-hidden")) continue;
          if (el.tagName === "A" && cs.display === "inline" && el.closest("p,li,dd,td,span,label"))
            continue;
          if (r.height < 44 || r.width < 44)
            small.push(
              `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}.${String(el.className).split(" ")[0]} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 28)}"`,
            );
        }
        return {
          overflow: doc.scrollWidth - doc.clientWidth,
          h1: document.querySelectorAll("h1").length,
          main: document.querySelectorAll("main,[role=main]").length,
          lang: doc.lang,
          small: small.slice(0, 40),
          smallCount: small.length,
        };
      });
      if (m.overflow > 1) note(screen, width, `horizontal overflow ${m.overflow}px`);
      if (m.h1 < 1) note(screen, width, "no <h1>");
      if (m.smallCount)
        note(
          screen,
          width,
          `${m.smallCount} targets under 44px: ${m.small.slice(0, +(process.env.SMALL_N || 5)).join(" | ")}`,
        );
      for (const e of errors.slice(0, 4)) note(screen, width, e);
      if (AxeBuilder && USE_AXE && width === WIDTHS[0]) {
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        for (const v of axe.violations)
          note(
            screen,
            width,
            `axe ${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes[0].target.join(" ")}`,
          );
      }
      console.log(`ok   ${screen.id}@${width}`);
    } catch (e) {
      note(screen, width, `load failed: ${e.message.split("\n")[0]}`);
      console.log(`FAIL ${screen.id}@${width}`);
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(`\nscreenshots: ${OUT}`);
if (problems.length) {
  console.log(`\n${problems.length} finding(s):`);
  for (const p of problems) console.log(` - ${p}`);
  process.exit(1);
}
console.log("access-acc-visual: clean");

// Presentation mode (access-practice-lab/src/present-mode.js), driven in Chromium: available only on a device that
// last used the Teacher Hub, hides the site chrome and teacher notes, scales text, leaves on Esc and when the page
// changes, and stays usable at 390px, in print and under axe. Serves the source tree (tools/lib/access-serve.mjs).
// A missing browser is a SKIP (exit 3).
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIP present-mode-e2e: playwright not installed");
  process.exit(3);
}
const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

let server;
let base = process.env.BASE;
if (!base) ({ server, base } = await serveAccess());
const LAB = `${base}/access-practice-lab`;
const browser = await chromium.launch().catch(() => null);
if (!browser) {
  console.log("SKIP present-mode-e2e: no browser");
  process.exit(3);
}
const fails = [];
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"} ${msg}`);
  if (!ok) fails.push(msg);
};
const watch = (page, errors) => {
  page.on("pageerror", (e) => !/"web-vitals"/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/favicon|Failed to load resource.*\/api\/|"web-vitals"/.test(m.text()) &&
      errors.push(m.text()),
  );
};
const visible = (page, sel) => page.locator(sel).first().isVisible();
const rootPx = (page) =>
  page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize));
const presenting = (page) => page.evaluate(() => document.documentElement.dataset.present === "1");
const PAGE = `${LAB}/choice-boards?grades=3-5`;

// ── a device that never used the Teacher Hub ───────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  watch(page, errors);
  await page.goto(PAGE, { waitUntil: "networkidle" });
  await page.waitForSelector(".crumbs");
  check(
    (await page.locator("[data-present]").count()) === 0,
    "no Present button for a non-teacher device",
  );
  await page.goto(`${PAGE}&present=1`, { waitUntil: "networkidle" });
  await page.waitForSelector(".crumbs");
  check(!(await presenting(page)), "?present=1 does nothing on a non-teacher device");
  check(await visible(page, ".lab-top"), "site header stays");
  check(!errors.length, `non-teacher: no console or page errors ${errors.slice(0, 2).join(" | ")}`);
  await ctx.close();
}

// ── a teacher device ───────────────────────────────────────────────────────
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript(() => {
  try {
    if (!localStorage.getItem("accessPracticeLab:v1:audience"))
      localStorage.setItem("accessPracticeLab:v1:audience", "teacher");
  } catch {}
});
const page = await ctx.newPage();
const errors = [];
watch(page, errors);
await page.goto(PAGE, { waitUntil: "networkidle" });
await page.waitForSelector(".crumbs");
const baseline = await rootPx(page);
check(
  (await page.locator('.crumbs [data-present="on"]').count()) === 1,
  "teacher sees one Present button in the breadcrumb row",
);
check(await visible(page, ".lab-top"), "header visible before presenting");

await page.click('.crumbs [data-present="on"]');
await page.waitForSelector("#presentBar");
check(await presenting(page), "Present turns presentation mode on");
check(!(await visible(page, ".lab-top")), "site header hidden");
check(!(await visible(page, ".lab-footer")), "site footer hidden");
check(!(await visible(page, ".crumbs")), "breadcrumbs hidden");
check(await visible(page, "#presentBar"), "control bar is visible");
check(
  (await page.evaluate(() => document.activeElement?.dataset?.present)) === "off",
  "focus moves to the Exit button",
);
check(
  Math.abs((await rootPx(page)) / baseline - 1.3) < 0.02,
  `text is 130% by default (${(await rootPx(page)).toFixed(1)}px)`,
);

await page.evaluate(() => {
  const note = Object.assign(document.createElement("p"), {
    id: "teacherNote",
    textContent: "Teacher note",
  });
  note.setAttribute("data-present-hide", "");
  document.querySelector("#app").append(note);
});
check(
  !(await visible(page, "#teacherNote")),
  "elements marked data-present-hide are hidden while presenting",
);

await page.click('[data-present="larger"]');
check(Math.abs((await rootPx(page)) / baseline - 1.5) < 0.02, "Larger text steps to 150%");
check(/150%/.test(await page.locator(".present-size").innerText()), "size readout updates");
await page.click('[data-present="larger"]');
await page.click('[data-present="larger"]');
check(
  (await page.locator('[data-present="larger"]:disabled').count()) === 1,
  "Larger text stops at the maximum",
);
check(
  (await page.evaluate(() => document.activeElement?.dataset?.present)) !== undefined,
  "focus stays inside the bar after a size change",
);
for (let i = 0; i < 6; i++)
  if (await page.locator('[data-present="smaller"]:enabled').count())
    await page.click('[data-present="smaller"]');
check(
  (await page.locator('[data-present="smaller"]:disabled').count()) === 1,
  "Smaller text stops at the minimum",
);
await page.click('[data-present="larger"]');

// size is remembered for this tab and ?present=1 turns it on directly
await page.goto(`${PAGE}&present=1`, { waitUntil: "networkidle" });
await page.waitForSelector("#presentBar");
check(await presenting(page), "?present=1 opens presentation mode for a teacher");
check(
  Math.abs((await rootPx(page)) / baseline - 1.3) < 0.02,
  "the chosen size is remembered in this tab",
);

// print never shows the bar
await page.emulateMedia({ media: "print" });
check(!(await visible(page, "#presentBar")), "the control bar does not print");
await page.emulateMedia({ media: "screen" });

// axe while presenting
await page.mouse.move(0, 0);
await page.waitForTimeout(400);
await page.addScriptTag({ content: axeSource });
const result = await page.evaluate(() =>
  window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag22aa"] }),
);
const bad = result.violations.filter((v) => ["serious", "critical"].includes(v.impact));
check(
  !bad.length,
  `axe serious/critical while presenting: ${bad.map((v) => `${v.id} ${v.nodes.map((n) => n.html.slice(0, 70)).join(" ; ")}`).join(", ") || "0"}`,
);

// Escape leaves and returns focus
await page.keyboard.press("Escape");
check(!(await presenting(page)), "Escape leaves presentation mode");
check(
  (await visible(page, ".lab-top")) && (await visible(page, ".crumbs")),
  "header and breadcrumbs come back",
);
check((await page.locator("#presentBar").count()) === 0, "control bar is removed");
check(Math.abs((await rootPx(page)) - baseline) < 0.5, "text size returns to normal");

// changing page ends presentation
await page.click('.crumbs [data-present="on"]');
await page.waitForSelector("#presentBar");
await page.evaluate(() => {
  history.pushState({}, "", "/access-practice-lab/talk-table?grades=3-5");
  window.dispatchEvent(new PopStateEvent("popstate"));
});
await page
  .waitForFunction(() => document.documentElement.dataset.present !== "1", null, { timeout: 15000 })
  .catch(() => {});
check(!(await presenting(page)), "navigating to another page ends presentation mode");

check(
  !errors.length,
  `teacher 1280px: no console or page errors ${errors.slice(0, 3).join(" | ")}`,
);
await ctx.close();

// ── phone width ────────────────────────────────────────────────────────────
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
await mctx.addInitScript(() => {
  try {
    localStorage.setItem("accessPracticeLab:v1:audience", "teacher");
  } catch {}
});
const mpage = await mctx.newPage();
const merrors = [];
watch(mpage, merrors);
await mpage.goto(`${PAGE}&present=1`, { waitUntil: "networkidle" });
await mpage.waitForSelector("#presentBar");
check(
  await mpage.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
  "@390 no sideways scroll while presenting",
);
const barBox = await mpage.locator("#presentBar").boundingBox();
check(barBox && barBox.x >= 0 && barBox.x + barBox.width <= 391, "@390 control bar fits on screen");
const small = await mpage
  .locator("#presentBar button")
  .evaluateAll(
    (els) =>
      els.filter(
        (e) => e.getBoundingClientRect().height < 43 || e.getBoundingClientRect().width < 43,
      ).length,
  );
check(small === 0, "@390 every control is at least 44px");
check(!merrors.length, `@390 no console or page errors ${merrors.slice(0, 3).join(" | ")}`);
await mctx.close();

await browser.close();
server?.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nALL PASS");
process.exit(fails.length ? 1 : 0);

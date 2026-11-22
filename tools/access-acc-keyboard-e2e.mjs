#!/usr/bin/env node
/**
 * Keyboard-only completion of real bank exercises, at 390px and 1280px: Tab to a control, Space / Enter / Arrow keys to
 * use it, never a pointer. Covers every reading response type in the bank (multiple choice, multiple select, dropdown,
 * ordering with Up/Down, matching and category sorting with select-then-place) plus constructed writing, and moves between
 * questions with the Next button by keyboard. Asserts the answer registered (zone contents, row order, select value) and
 * that the page never scrolls sideways, the console stays clean and the focused control has a visible focus style.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-acc-keyboard-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const BANK = new URL("../access-practice-lab/content/bank/", import.meta.url).pathname;
const sets = readdirSync(BANK)
  .filter((f) => /^b(35|68)-read-\d\d\.json$/.test(f))
  .map((f) => JSON.parse(readFileSync(join(BANK, f), "utf8")));
const pick = (type) => sets.find((s) => s.items.some((i) => i.type === type));
const CASES = [
  "ordering",
  "matching",
  "drag-drop",
  "dropdown",
  "multiple-select",
  "multiple-choice",
]
  .map(pick)
  .filter((s, i, a) => s && a.indexOf(s) === i);

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const { server, base } = await serveAccess();
const browser = await chromium.launch();
const ROOT = `${base}/access-practice-lab`;
const WRITING =
  "First I looked closely at the information. Then I explained what I noticed and gave a reason because the details show it. In addition I connected my ideas with words like so and however.";

/** Tab until the marked element has focus (max 80 presses). */
async function tabTo(page, locator) {
  await locator.evaluate((el) => el.setAttribute("data-kb-target", "1"));
  try {
    for (let n = 0; n < 80; n++) {
      if (await page.evaluate(() => document.activeElement?.hasAttribute("data-kb-target")))
        return n;
      await page.keyboard.press("Tab");
    }
    return -1;
  } finally {
    await locator.evaluate((el) => el.removeAttribute("data-kb-target")).catch(() => {});
  }
}
const visibleFocus = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return false;
    const cs = getComputedStyle(el);
    return (
      (cs.outlineStyle !== "none" && Number.parseFloat(cs.outlineWidth) > 0) ||
      cs.boxShadow !== "none"
    );
  });

async function answer(page, item) {
  let reached = true;
  const go = async (loc) => {
    const n = await tabTo(page, loc);
    if (n < 0) reached = false;
    return n >= 0;
  };
  switch (item.type) {
    case "multiple-choice":
    case "listening-response": {
      const k = item.options.findIndex((o) => o.id === item.answer);
      if (await go(page.locator(".acc-choice input").first())) {
        for (let i = 0; i < k; i++) await page.keyboard.press("ArrowDown");
        if (k === 0) await page.keyboard.press("Space");
      }
      return reached && (await page.locator(".acc-choice input").nth(k).isChecked());
    }
    case "multiple-select": {
      for (const a of item.answer) {
        const loc = page
          .locator(".acc-choice input")
          .nth(item.options.findIndex((o) => o.id === a));
        if (await go(loc)) await page.keyboard.press("Space");
      }
      return (
        reached && (await page.locator(".acc-choice input:checked").count()) === item.answer.length
      );
    }
    case "dropdown": {
      const keys = [...item.dropdown.template.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
      for (const [i, k] of keys.entries()) {
        const sel = page.locator("select.acc-select").nth(i);
        if (await go(sel)) await page.keyboard.type(item.dropdown.blanks[k].answer.slice(0, 12));
        if ((await sel.inputValue()) !== item.dropdown.blanks[k].answer) reached = false;
      }
      return reached;
    }
    case "ordering": {
      const texts = Object.fromEntries(item.ordering.items.map((x) => [x.id, x.text]));
      for (let i = 0; i < item.ordering.answer.length; i++) {
        const want = texts[item.ordering.answer[i]];
        for (let guard = 0; guard < 8; guard++) {
          const order = await page.locator(".acc-order-text").allInnerTexts();
          if (order[i] === want) break;
          if (!(await go(page.getByRole("button", { name: `Move up: ${want}`, exact: true }))))
            return false;
          await page.keyboard.press("Enter");
        }
      }
      const final = await page.locator(".acc-order-text").allInnerTexts();
      return reached && final.join("|") === item.ordering.answer.map((id) => texts[id]).join("|");
    }
    case "matching":
    case "drag-drop": {
      const map = item.type === "matching" ? item.matching.answer : item.dragDrop.answer;
      for (const [tok, zone] of Object.entries(map)) {
        if (await go(page.locator(`.acc-pool [data-token="${tok}"]`)))
          await page.keyboard.press("Space");
        if (await go(page.locator(`[data-zone="${zone}"]`))) await page.keyboard.press("Enter");
      }
      const holds = await page
        .locator(".acc-zone-target")
        .evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
      return (
        reached && holds.filter((h) => /holds/.test(h)).length >= new Set(Object.values(map)).size
      );
    }
    case "constructed-response":
      if (await go(page.locator(".acc-textarea"))) await page.keyboard.type(WRITING);
      return reached && (await page.locator(".acc-textarea").inputValue()).length > 40;
    default:
      return null; // speaking: not a keyboard-completion case here
  }
}

for (const width of [390, 1280]) {
  for (const set of CASES) {
    const ctx = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 900 },
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto(`${ROOT}/assess/${set.id}?mode=summative`, { waitUntil: "networkidle" });
    const timer = page.locator("#accTimer");
    if (await timer.count()) await timer.uncheck();
    await tabTo(page, page.locator("[data-act=begin]"));
    await page.keyboard.press("Enter");
    await page.locator(".acc-stem").waitFor();
    const seen = new Set();
    let focusOk = true;
    for (const [i, item] of set.items.entries()) {
      const res = await answer(page, item);
      if (res !== null) {
        ok(res, `${width}px ${set.id} item ${i + 1} (${item.type}) completed by keyboard alone`);
        seen.add(item.type);
        const vf = await visibleFocus(page);
        if (!vf)
          console.log(
            `  no visible focus after ${item.type}:`,
            await page.evaluate(
              () => `${document.activeElement?.tagName}.${document.activeElement?.className}`,
            ),
          );
        focusOk = focusOk && vf;
      }
      if (i < set.items.length - 1) {
        if ((await tabTo(page, page.locator("[data-act=next]"))) < 0)
          ok(false, `${width}px ${set.id}: Next reachable by Tab`);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(60);
      }
    }
    ok(focusOk, `${width}px ${set.id}: the focused control shows a visible focus style`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    ok(overflow <= 1, `${width}px ${set.id}: no horizontal scroll (${overflow}px)`);
    // web-vitals is a build-time bare specifier that cannot resolve when the source tree is served directly.
    const real = errors.filter((e) => !/web-vitals/.test(e));
    ok(real.length === 0, `${width}px ${set.id}: console clean ${real.join(" | ").slice(0, 120)}`);
    await ctx.close();
  }
}
await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-acc-keyboard-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-acc-keyboard-e2e: all checks passed");

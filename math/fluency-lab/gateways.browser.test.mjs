// The Practice gateways in a real browser: every way to practise is a card with its own drawing and no default link underline,
// the links and buttons the rest of the Lab relies on are unchanged, and the screen passes axe (WCAG 2.2 A/AA) with no
// sideways scroll at phone and desktop widths in three grade bands. Set GATEWAY_SHOTS=/dir to keep screenshots.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const shots = process.env.GATEWAY_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });
const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}/math/fluency-lab/`;
let browser;
const errors = [];
try {
  browser = await chromium.launch({ headless: true });
  for (const grade of [1, 4, 8]) {
    for (const [width, height] of [[390, 844], [1280, 900]]) {
      const page = await (await browser.newContext({ viewport: { width, height } })).newPage();
      page.on("pageerror", (e) => errors.push(`g${grade}: ${e.message}`));
      page.on("console", (m) => m.type() === "error" && errors.push(`g${grade}: ${m.text()}`));
      await page.goto(`${base}?grade=${grade}`, { waitUntil: "networkidle" });
      await page.locator('#hub-tabs button[data-dest="learning"]').click();
      await page.locator('#hub-subnav button[data-view="practice"]').click();
      await page.locator(".practice-hub-card").first().waitFor();
      const cards = await page.locator(".practice-hub-card").count();
      assert.ok(cards >= 6, `grade ${grade}: ${cards} gateways`);
      assert.equal(await page.locator(".practice-hub-card .ph-art svg").count(), cards, "every gateway has its drawing");
      const bad = await page.evaluate(() => [...document.querySelectorAll(".practice-hub-card")].flatMap((c) => {
        const out = [];
        for (const el of [c, ...c.querySelectorAll("strong, span")]) if (getComputedStyle(el).textDecorationLine.includes("underline")) out.push(`underline on ${el.tagName}`);
        if (c.getBoundingClientRect().height < 44) out.push("target under 44px");
        return out;
      }));
      assert.deepEqual(bad, [], `grade ${grade} at ${width}px`);
      // the contracts the rest of the Lab and its tests rely on are unchanged
      assert.equal(await page.locator(`#practice-view a[href="reality/?grade=${grade}"]`).count(), 1);
      assert.equal(await page.locator(`#practice-view a[href="reality/lab/?grade=${grade}"]`).count(), 1);
      for (const attr of ["data-start-daily", "data-start-checkup", 'data-view="notebook"', 'data-view="library"']) assert.equal(await page.locator(`#practice-view [${attr}]`).count(), 1, attr);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `grade ${grade} scrolls sideways by ${overflow}px at ${width}px`);
      const result = await new AxeBuilder({ page }).include("#practice-view").withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      assert.deepEqual(result.violations.filter((v) => ["serious", "critical"].includes(v.impact)).map((v) => `${v.id}: ${v.nodes[0]?.html.slice(0, 80)}`), [], `axe grade ${grade} at ${width}px`);
      if (shots) await page.locator("#practice-view").screenshot({ path: `${shots}/practice-g${grade}-${width}.png` });
      await page.context().close();
    }
  }
  // Game Room option pills: the title of each stays on one line (it used to wrap to "Deep / Thinker / Mode")
  for (const [width, height] of [[390, 844], [1280, 900]]) {
    const page = await (await browser.newContext({ viewport: { width, height } })).newPage();
    page.on("pageerror", (e) => errors.push(`pills: ${e.message}`));
    await page.goto(`${base}?grade=4`, { waitUntil: "networkidle" });
    await page.locator('#hub-tabs button[data-view="games"]').click();
    await page.locator(".gm-calm").first().waitFor();
    const lines = await page.evaluate(() => [...document.querySelectorAll(".gm-calm")].map((label) => {
      const text = [...label.childNodes].find((n) => n.nodeType === 3 && /\S/.test(n.textContent));
      const range = document.createRange();
      range.selectNodeContents(text);
      const rects = [...range.getClientRects()].filter((r) => r.width > 1);
      return { title: text.textContent.trim(), lines: new Set(rects.map((r) => Math.round(r.top))).size };
    }));
    assert.ok(lines.length >= 2, "both pills are present");
    for (const l of lines) assert.equal(l.lines, 1, `"${l.title}" wraps onto ${l.lines} lines at ${width}px`);
    await page.context().close();
  }
  assert.deepEqual(errors, [], "no console or page errors");
  console.log("gateways browser: every gateway has a drawing, no underlines, contracts intact, axe and overflow pass for grades 1, 4 and 8");
} finally {
  await browser?.close();
  await server.close();
}

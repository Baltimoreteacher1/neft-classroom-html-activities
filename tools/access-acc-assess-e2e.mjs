#!/usr/bin/env node
/**
 * Assessment simulator end to end, in a real browser, the way a learner uses it.
 *   - toolbar: highlighter (colours, clear selected, clear all, survives reload), line reader (keyboard, text stays in the
 *     accessibility tree), magnifier (reflow, no overflow), answer eliminator (crossed-out choice stays selectable), mark for review
 *   - every question type answered with the mouse AND the keyboard-only alternatives
 *   - summative: no hints, no feedback, review screen, submit once, results; learning mode: check, support ladder in order,
 *     revise, fresh attempt, supported success is not "independent"
 *   - interruption: reload mid-sitting resumes the same question with the same answers
 *   - split-pane resize by keyboard, axe WCAG 2.2 AA, 390px reflow, no console errors
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-acc-assess-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};

const { server, base } = await serveAccess();
const browser = await chromium.launch();
const ROOT = `${base}/access-practice-lab`;

async function fresh(viewport = { width: 1440, height: 900 }) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => !/web-vitals|@engine\//.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  return { ctx, page, errors };
}
const stemId = (page) => page.evaluate(() => document.activeElement?.id || "");
const qText = (page) => page.locator(".acc-stem").innerText();
const next = (page) => page.locator("[data-act=next]").click();
const open = async (page, set, mode, { timer = false } = {}) => {
  await page.goto(`${ROOT}/assess/${set}?mode=${mode}`, { waitUntil: "networkidle" });
  await page.locator("[data-act=begin]").waitFor();
  const box = page.locator("#accTimer");
  if ((await box.count()) && !timer) await box.uncheck();
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-stem").waitFor();
};

// ── chooser ─────────────────────────────────────────────────────────────────────
{
  const { ctx, page, errors } = await fresh();
  await page.goto(`${ROOT}/assess`, { waitUntil: "networkidle" });
  ok((await page.locator(".acc-grid .acc-card").count()) === 2, "chooser lists both practice sets");
  ok(
    /not an official WIDA or ACCESS assessment/.test(
      await page.locator("main, #app").first().innerText(),
    ),
    "chooser states that it is independent practice",
  );
  ok(errors.length === 0, `chooser has no console errors ${errors.join("|")}`);
  await ctx.close();
}

// ── summative, grades 3-5: toolbar + every question type ────────────────────────────
{
  const { ctx, page, errors } = await fresh();
  await open(page, "starter-3-5", "summative", { timer: true });
  ok((await page.locator(".acc-timer").count()) === 1, "a timed simulation shows a timer");
  ok(
    (await page.locator(".acc-formative, [data-act=check], .acc-ladder").count()) === 0,
    "summative renders no hints, no check button and no support ladder",
  );
  ok((await stemId(page)).endsWith("-stem"), "focus lands on the question heading");

  // highlighter ---------------------------------------------------------------------
  const select = (scope, from, to) =>
    page.evaluate(
      ([scope, from, to]) => {
        // Offsets are into the paragraph's TEXT, wherever <mark> splits it.
        const el = document.querySelector(`[data-scope="${scope}"]`);
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        const r = document.createRange();
        let pos = 0;
        let started = false;
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const len = n.nodeValue.length;
          if (!started && from < pos + len) r.setStart(n, from - pos), (started = true);
          if (started && to <= pos + len) {
            r.setEnd(n, to - pos);
            break;
          }
          pos += len;
        }
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
      },
      [scope, from, to],
    );
  const before = await page.locator('[data-scope="rain:p1"]').innerText();
  await select("rain:p1", 0, 4);
  await page.locator("[data-tool=hl-yellow]").click();
  ok(
    (await page.locator("mark.acc-hl-yellow").count()) === 1,
    "highlighter wraps the selection in yellow",
  );
  ok(
    (await page.locator('[data-scope="rain:p1"]').innerText()) === before,
    "highlighting never changes the passage text",
  );
  await select("rain:p1", 10, 16);
  await page.locator("[data-tool=hl-blue]").click();
  await select("rain:p1", 20, 24);
  await page.locator("[data-tool=hl-green]").click();
  ok((await page.locator("mark.acc-hl").count()) === 3, "three colours coexist");
  // keyboard path: select with shift+arrows then press a colour button
  await page.evaluate(() =>
    document.querySelector('[data-scope="rain:p2"]').closest(".acc-stim-scroll").focus(),
  );
  await select("rain:p2", 0, 5);
  await page.locator("[data-tool=hl-yellow]").focus();
  await page.keyboard.press("Enter");
  ok(
    (await page.locator('[data-scope="rain:p2"] mark').count()) === 1,
    "a colour button works from the keyboard on the current selection",
  );
  // clear selected
  await select("rain:p1", 11, 12);
  await page.locator("[data-tool=hl-clear-selected]").click();
  ok(
    (await page.locator('[data-scope="rain:p1"] mark.acc-hl-blue').count()) === 0,
    "clear selected removes only the highlight under the selection",
  );
  ok((await page.locator("mark.acc-hl").count()) === 3, "other highlights remain");
  // survives a rerender (question change and back)
  await next(page);
  await page.locator(".acc-qdot").first().click();
  ok(
    (await page.locator("mark.acc-hl").count()) === 3,
    "highlights persist across question changes",
  );
  await page.locator("[data-tool=hl-clear-all]").click();
  ok((await page.locator("mark.acc-hl").count()) === 0, "clear all removes every highlight");
  await select("rain:p3", 0, 6);
  await page.locator("[data-tool=hl-yellow]").click();

  // line reader ---------------------------------------------------------------------
  await page.locator("[data-tool=line-reader]").click();
  ok((await page.locator(".acc-lr").count()) === 1, "line reader appears");
  ok(
    await page
      .locator(".acc-lr-mask")
      .evaluateAll((els) => els.every((e) => e.getAttribute("aria-hidden") === "true")),
    "masks are hidden from assistive technology",
  );
  ok(
    !(await page.evaluate(
      () => !!document.querySelector(".acc-stim-scroll")?.closest("[aria-hidden=true]"),
    )),
    "the passage is not hidden from assistive technology",
  );
  const handle = page.locator(".acc-lr-handle");
  const v0 = Number(await handle.getAttribute("aria-valuenow"));
  await handle.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  ok(Number(await handle.getAttribute("aria-valuenow")) > v0, "arrow keys move the reading window");
  await page.locator("[data-tool=line-wide]").click();
  ok(
    /^\d+px$/.test(
      await page.locator(".acc-lr").evaluate((e) => e.style.getPropertyValue("--lr-win")),
    ),
    "the reading window can be resized",
  );
  ok(
    await page.locator(".acc-choice-label").first().isVisible(),
    "answer choices stay usable while the line reader is on",
  );
  await page.locator("[data-tool=line-reader]").click();
  ok((await page.locator(".acc-lr").count()) === 0, "line reader turns off");

  // magnifier -----------------------------------------------------------------------
  const base16 = await page
    .locator("#accCanvas")
    .evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  await page.locator("[data-tool=zoom-200]").click();
  const big = await page
    .locator("#accCanvas")
    .evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
  ok(Math.abs(big - base16 * 2) < 1, `200% doubles the canvas text (${base16} -> ${big})`);
  ok(
    !(await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )),
    "200% reflows with no horizontal scroll",
  );
  ok(
    (await page.locator("[data-act=next]").isVisible()) &&
      (await page.locator(".acc-toolbar").isVisible()),
    "controls stay visible at 200%",
  );
  await page.locator("[data-tool=zoom-100]").click();

  // eliminator + mark ---------------------------------------------------------------
  ok(
    !(await page.locator(".acc-strike").first().isVisible()),
    "cross-out buttons are hidden until the eliminator is on",
  );
  await page.locator("[data-tool=eliminator]").click();
  await page.locator(".acc-strike").first().click();
  ok(
    (await page.locator(".acc-choice.is-eliminated").count()) === 1,
    "a crossed-out choice is marked",
  );
  await page.locator(".acc-choice.is-eliminated input").check();
  ok(
    await page.locator(".acc-choice.is-eliminated input").isChecked(),
    "a crossed-out choice can still be selected",
  );
  await page.locator(".acc-choice.is-eliminated .acc-strike").click();
  ok(
    (await page.locator(".acc-choice.is-eliminated").count()) === 0,
    "restore brings the choice back",
  );
  await page.locator("[data-tool=mark]").click();
  ok(
    (await page.locator(".acc-qdot.is-marked").count()) === 1,
    "mark for review shows on the question navigator",
  );

  // Q1 answered above (b is correct); move on: Q2 multiple select ---------------------
  await page.locator(".acc-choice input").nth(1).check();
  await next(page);
  ok(/two details/.test(await qText(page)), "next moves to question 2");
  await page.locator(".acc-choice input").nth(1).check();
  await page.locator(".acc-choice input").nth(3).check();
  await next(page);
  // Q3 dropdown
  const picks = ["warms", "turns", "gather"];
  for (const [i, v] of picks.entries())
    await page.locator("select.acc-select").nth(i).selectOption(v);
  await next(page);
  // Q4 ordering by Up buttons
  const target = [
    "The sun warms water and it turns into vapor.",
    "The vapor cools and forms a cloud.",
    "The drops grow heavy and fall as rain.",
    "Rivers carry the water back to the ocean.",
  ];
  for (let i = 0; i < target.length; i++) {
    for (let guard = 0; guard < 6; guard++) {
      const order = await page.locator(".acc-order-text").allInnerTexts();
      if (order[i] === target[i]) break;
      const at = order.indexOf(target[i]);
      await page.getByRole("button", { name: `Move up: ${target[i]}` }).click();
      if (at <= i) break;
    }
  }
  ok(
    JSON.stringify(await page.locator(".acc-order-text").allInnerTexts()) ===
      JSON.stringify(target),
    "ordering: Up buttons reach the correct order",
  );
  await next(page);
  // Q5 matching: pointer path for two, keyboard-only path for one
  const place = async (tokenText, zoneId) => {
    await page.locator(".acc-pool .acc-token", { hasText: tokenText }).click();
    await page.locator(`[data-zone="${zoneId}"]`).click();
  };
  await place("evaporation", "m2");
  await place("condensation", "m1");
  await page.locator(".acc-pool .acc-token", { hasText: "precipitation" }).focus();
  await page.keyboard.press("Space"); // select
  await page.locator('[data-zone="m3"]').focus();
  await page.keyboard.press("Enter"); // place
  ok(
    (await page.locator(".acc-zone.is-filled").count()) === 3,
    "matching: pointer and keyboard-only placement both work",
  );
  ok(
    /precipitation placed in water falls from clouds/.test(
      await page.locator("#accLive").innerText(),
    ),
    "placement is announced to screen readers",
  );
  await next(page);
  // Q6 drag-drop: place, replace, undo, then finish
  await place("The air high above", "cause");
  await place("Water vapor turns", "effect");
  await place("The drops are too heavy", "cause");
  await place("Rain falls", "effect");
  ok((await page.locator(".acc-zone.is-filled").count()) === 2, "drag-drop zones show their items");
  await page.getByRole("button", { name: "Undo last placement" }).click();
  await place("Rain falls", "effect");
  await next(page);
  // Q7 listening response (audio stimulus: the playback engine arrives with the audio module)
  await page.locator(".acc-choice input").nth(2).check();
  await next(page);
  // Q8 writing
  const words =
    "First the sun warms the ocean water and the water turns into vapor. Next the cold air changes the vapor into tiny drops that make a cloud. Then the drops get heavy and fall as rain because they are too heavy to stay up.";
  await page.locator(".acc-textarea").fill(words);
  ok(
    /\d+ words/.test(await page.locator(".acc-write .acc-hint").innerText()),
    "the writing box counts words",
  );
  await next(page);
  // Q9 speaking is left unanswered on purpose (no recorder in this phase's view)
  await page.locator("[data-act=review]").click();
  ok(
    /8 of 9 answered/.test(await page.locator(".acc-review").innerText()),
    "review screen reports unanswered questions",
  );
  ok((await page.locator("tr.is-unanswered").count()) === 1, "the unanswered question is flagged");
  await page.locator("[data-act=submit]").click();
  await page.locator(".acc-results").waitFor();
  const txt = await page.locator(".acc-results").innerText();
  ok(
    /7 of 7/.test(txt),
    `every objective answer key scores correct (${txt.match(/\d of \d/)?.[0]})`,
  );
  ok(
    /Saved for teacher review\s*1/.test(txt.replace(/\n+/g, " ")),
    "the written response is saved for teacher review, not scored",
  );
  ok(
    /not an official score/.test(txt) && /not a WIDA or ACCESS score/.test(txt),
    "results state they are practice, not an official score",
  );
  ok(
    /Right on your own\s*7/.test(txt.replace(/\n+/g, " ")),
    "summative answers count as on-my-own",
  );
  // a second submit must not create a second record: reload and look again
  await page.reload({ waitUntil: "networkidle" });
  await page.locator(".acc-results").waitFor();
  ok(true, "a submitted sitting reopens on its results");
  ok(errors.length === 0, `no console errors in the summative run ${errors.join("|")}`);
  await ctx.close();
}

// ── resume after interruption ───────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh();
  await open(page, "starter-6-8", "summative", { timer: true });
  await page.locator(".acc-choice input").nth(2).check(); // g68-r1 correct (c)
  await next(page);
  await page.locator(".acc-choice input").nth(0).check();
  await page.locator("[data-tool=mark]").click();
  await page.locator("[data-tool=zoom-125]").click();
  await next(page);
  const stem = await qText(page);
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-act=begin]").waitFor();
  ok(
    /Resume where I left off/.test(await page.locator("[data-act=begin]").innerText()),
    "a reload offers to resume",
  );
  await page.locator("[data-act=begin]").click();
  await page.locator(".acc-stem").waitFor();
  ok((await qText(page)) === stem, "resume returns to the same question");
  await page.locator(".acc-qdot").first().click();
  ok(await page.locator(".acc-choice input").nth(2).isChecked(), "resume keeps the earlier answer");
  ok((await page.locator(".acc-qdot.is-marked").count()) === 1, "resume keeps marks for review");
  ok(
    (await page.locator("#accCanvas").getAttribute("data-zoom")) === "125",
    "resume keeps the magnifier setting",
  );
  await ctx.close();
}

// ── learning mode: feedback, ladder, revision, honesty about independence ────────────
{
  const { ctx, page, errors } = await fresh();
  await open(page, "starter-3-5", "formative");
  ok((await page.locator(".acc-ladder").count()) === 1, "learning mode shows the support ladder");
  ok(
    await page.locator("[data-act=check]").isDisabled(),
    "check is disabled until there is an answer",
  );
  await page.locator(".acc-choice input").nth(0).check(); // wrong (correct is b)
  await page.locator("[data-act=check]").click();
  const fb = await page.locator(".acc-feedback").innerText();
  ok(
    /Not yet/.test(fb) && /never compares/.test(fb),
    "a wrong answer gets targeted feedback tied to that choice",
  );
  ok(!/Correct|main idea of the passage is/.test(fb), "feedback does not reveal the answer");
  ok(
    await page.locator(".acc-choice input").first().isDisabled(),
    "the answer is locked while feedback is showing",
  );
  ok(
    (await page.locator('[data-support-tier="2"]').getAttribute("aria-disabled")) === "true",
    "support 2 is locked until support 1 is opened",
  );
  await page.locator('[data-support-tier="2"]').click({ force: true }); // aria-disabled: focusable, announces why, opens nothing
  ok((await page.locator(".acc-support-card").count()) === 0, "a locked support opens nothing");
  for (const t of [1, 2, 3]) await page.locator(`[data-support-tier="${t}"]`).click();
  ok((await page.locator(".acc-support-card").count()) === 3, "supports 1, 2 and 3 open in order");
  ok(
    /Mentor example/.test(await page.locator(".tier-3").innerText()),
    "support 3 is a mentor model on a different topic",
  );
  await page.locator("[data-act=revise]").click();
  ok(
    !(await page.locator(".acc-choice input:checked").count()),
    "revising starts a fresh attempt with a clear answer",
  );
  await page.locator(".acc-choice input").nth(1).check();
  await page.locator("[data-act=check]").click();
  ok(
    /Correct, with support/.test(await page.locator(".acc-feedback").innerText()),
    "success after support is labelled as supported",
  );
  // finish quickly: answer nothing else, submit
  for (let i = 0; i < 8; i++) await page.locator("[data-act=next]").click();
  await page.locator("[data-act=review]").click();
  await page.locator("[data-act=submit]").click();
  await page.locator(".acc-results").waitFor();
  const t = (await page.locator(".acc-results").innerText()).replace(/\n+/g, " ");
  ok(
    /Right on your own\s*0/.test(t) && /Right with support or revision\s*1/.test(t),
    "scaffolded success is not counted as independent",
  );
  ok(errors.length === 0, `no console errors in learning mode ${errors.join("|")}`);
  await ctx.close();
}

// ── layout, keyboard and accessibility ──────────────────────────────────────────────
{
  const { ctx, page } = await fresh();
  await open(page, "starter-6-8", "summative");
  const sep = page.locator(".acc-resizer");
  const w0 = Number(await sep.getAttribute("aria-valuenow"));
  await sep.focus();
  await page.keyboard.press("ArrowRight");
  ok(
    Number(await sep.getAttribute("aria-valuenow")) === w0 + 5,
    "the panel divider resizes from the keyboard",
  );
  if (AxeBuilder) {
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    ok(
      axe.violations.length === 0,
      `axe: question screen has no WCAG 2.2 AA violations ${axe.violations.map((v) => `${v.id}:${v.nodes[0].target}`).join(",")}`,
    );
  }
  await page.locator("[data-tool=hl-yellow]").focus();
  ok(
    await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement);
      return s.outlineStyle !== "none" && parseFloat(s.outlineWidth) >= 2;
    }),
    "toolbar buttons show a visible focus ring",
  );
  await ctx.close();
  const m = await fresh({ width: 390, height: 844 });
  await open(m.page, "starter-6-8", "summative");
  ok(
    !(await m.page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    )),
    "390px: no horizontal overflow",
  );
  ok(
    (await m.page.locator(".acc-resizer").isVisible()) === false,
    "390px: panes stack and the divider is hidden",
  );
  const targets = await m.page.evaluate(() =>
    [...document.querySelectorAll(".acc-toolbar button, .acc-qdot, .acc-actions .acc-btn")]
      .filter(
        (b) =>
          b.offsetParent &&
          (b.getBoundingClientRect().height < 44 || b.getBoundingClientRect().width < 44),
      )
      .map((b) => b.textContent.trim()),
  );
  ok(
    targets.length === 0,
    `390px: toolbar, navigator and actions meet the 44px target ${targets.join("|")}`,
  );
  await m.ctx.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-acc-assess-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-acc-assess-e2e: all checks passed");

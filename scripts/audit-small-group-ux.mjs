#!/usr/bin/env node
/**
 * Small-group lesson UX sweep — walks every phase of a support and a challenge
 * lesson at Chromebook and phone width and reports what a student would hit.
 *
 * Reports only. Like `npm run audit:a11y`, these findings need judgement and
 * are deliberately NOT a gate.
 *
 * WHY IT LOOKS OVER-QUALIFIED
 * ---------------------------
 * The naive version of every check here fires constantly on a page that is
 * completely fine. A first run produced 124 findings and ALL of them were
 * false. Each guard below is one of those, kept so the next pass does not have
 * to re-derive it:
 *
 *  1. OVERFLOW — skip anything inside a `position: fixed` ancestor. The
 *     annotation dock is a fixed, collapsed <details> whose inner panel is
 *     wider than its icon tab and clipped by `overflow: auto`. It is off-canvas
 *     by design, and measuring its children reported "overflows right by 226px"
 *     on all six phases of both groups. 88 of the 124.
 *
 *  2. TAP TARGETS — measure the LABEL, not the input. The rating controls are
 *     bare <input type=radio> inside `label.sg-radio`; the input paints at
 *     20x20 but the label that actually receives the click is 106x48. Measuring
 *     inputs reported a WCAG 2.5.8 failure on a control that passes twice over.
 *
 *  3. TAP TARGETS — inline text is EXEMPT from WCAG 2.2 SC 2.5.8. The vocabulary
 *     buttons (`.sg-vocab-inline`) are words inside running sentences; forcing
 *     them to 24px would break the line box to fix a rule that does not apply.
 *
 *  4. CONSOLE — `/api/sg-room/open` 404s under `vite preview`, which does not
 *     run Cloudflare Functions. Production answers 400. Ignored by name so a
 *     preview artifact never reads as a live outage.
 *
 * Two more properties verified by hand during the 2026-08-10 pass and worth
 * re-checking rather than automating badly: the phase tablist uses a roving
 * tabindex (only the active tab is in the tab order — arrow keys move between
 * them, which is the correct ARIA pattern, not a keyboard trap), and the
 * language control is a two-button segmented control, so "English only" staying
 * lit after a click is the selected state, not a stuck toggle.
 *
 * Usage:  npm run preview -- --port 4499   (in another shell)
 *         node scripts/audit-small-group-ux.mjs [--base http://localhost:4499]
 */

import { chromium } from "@playwright/test";

const baseIx = process.argv.indexOf("--base");
const BASE = baseIx !== -1 ? process.argv[baseIx + 1] : "http://localhost:4499";
const LESSONS = ["5-3-group1", "5-3-group2"];
const SIZES = [
  { name: "chromebook", width: 1366, height: 768 },
  { name: "phone", width: 390, height: 844 },
];
/** Known preview-only noise — see note 4 above. */
const IGNORED_CONSOLE = [/sg-room/, /favicon/];

const findings = [];
const note = (ctx, msg) => findings.push(`${ctx} :: ${msg}`);

const browser = await chromium.launch();

/* Self-test. "0 findings" is only meaningful if the detectors can still fire,
   and three of them were narrowed after a false-positive run — exactly the
   edit that silently turns a sweep into a no-op. Each detector is run against
   markup that is deliberately broken before any real page is opened. */
{
  const page = await browser.newPage({ viewport: { width: 400, height: 600 } });
  await page.setContent(`<body style="margin:0">
    <div style="width:900px;height:20px">wide</div>
    <button style="width:10px;height:10px"></button>
    <label style="display:inline-flex;width:100px;height:48px"><input type="radio"></label>
  </body>`);
  // NOTE: the label needs an explicit display. A bare <label> is inline, and
  // height does not apply to inline boxes — the fixture reported the label as
  // ~20px tall and the self-test correctly failed on its own bad markup.
  const overflowed = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  const tiny = await page.evaluate(() => {
    let n = 0;
    for (const el of document.querySelectorAll("button, input")) {
      const t = el.closest("label") || el;
      const r = t.getBoundingClientRect();
      if (r.width && (r.height < 24 || r.width < 24)) n += 1;
    }
    return n;
  });
  await page.close();
  const problems = [];
  if (overflowed <= 2)
    problems.push("overflow detector did not fire on a 900px child in a 400px viewport");
  if (tiny !== 1)
    problems.push(
      `tap-target detector counted ${tiny} small targets, expected exactly 1 (the 10x10 button; the 100x48 label must pass)`,
    );
  if (problems.length) {
    console.error("SELF-TEST FAILED — the sweep would report a clean page regardless:");
    for (const p of problems) console.error(`  - ${p}`);
    await browser.close();
    process.exit(1);
  }
  console.log("self-test: detectors fire (overflow + tap target), label exemption holds.\n");
}

for (const size of SIZES) {
  for (const id of LESSONS) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
    const ctxBase = `[${size.name}] ${id}`;
    const errors = new Set();
    // The browser's generic "Failed to load resource" console line carries NO
    // url, so it cannot be filtered by text — a preview-only 404 was still
    // reported four times after the ignore list was added. Correlate on the
    // response instead, where the url is available.
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const text = m.text();
      if (/Failed to load resource/i.test(text)) return; // covered by the response hook
      if (!IGNORED_CONSOLE.some((re) => re.test(text))) errors.add(text.slice(0, 110));
    });
    page.on("response", (r) => {
      if (r.status() < 400) return;
      const url = r.url();
      if (IGNORED_CONSOLE.some((re) => re.test(url))) return;
      errors.add(`${r.status()} ${url.replace(BASE, "")}`);
    });
    page.on("pageerror", (e) => errors.add(`PAGEERROR ${String(e).slice(0, 110)}`));

    await page.goto(`${BASE}/lessons/${id}/`, { waitUntil: "networkidle" });
    const name = page.locator('input[type="text"]').first();
    if (await name.count()) await name.fill("Sam");
    const go = page
      .locator('button:has-text("Start"), button:has-text("Begin"), button[type="submit"]')
      .first();
    if (await go.count()) {
      await go.click().catch(() => {});
      await page.waitForTimeout(1500);
    }

    const tabs = page.locator('[role="tab"]');
    const count = await tabs.count();
    if (!count) note(ctxBase, "NO PHASE TABS FOUND");

    for (let i = 0; i < count; i++) {
      const tab = tabs.nth(i);
      const label = (await tab.innerText()).replace(/\s+/g, " ").trim().slice(0, 28);
      const ctx = `${ctxBase} > ${label}`;
      await tab.click().catch(() => note(ctx, "tab not clickable"));
      await page.waitForTimeout(900);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 2) note(ctx, `page scrolls horizontally by ${overflow}px`);

      const wide = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const out = [];
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (getComputedStyle(el).visibility === "hidden") continue;
          let fixed = false;
          for (let a = el; a && a !== document.body; a = a.parentElement) {
            if (getComputedStyle(a).position === "fixed") {
              fixed = true;
              break;
            }
          }
          if (fixed) continue; // note 1
          if (r.right > vw + 2) {
            const cls = (el.className || "").toString().split(" ")[0];
            out.push(`${el.tagName.toLowerCase()}.${cls} +${Math.round(r.right - vw)}px`);
          }
        }
        return [...new Set(out)].slice(0, 4);
      });
      for (const w of wide) note(ctx, `overflows right: ${w}`);

      const small = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll(
          "button, a[href], input, select, [role=button]",
        )) {
          if (el.closest(".sg-vocab-inline") || el.classList.contains("sg-vocab-inline")) continue; // note 3
          // note 2 — a wrapping <label> is the real target for a bare control.
          const target = el.closest("label") || el;
          const r = target.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (getComputedStyle(target).visibility === "hidden") continue;
          if (r.height < 24 || r.width < 24) {
            const cls = (target.className || "").toString().split(" ")[0];
            out.push(
              `${target.tagName.toLowerCase()}.${cls} ${Math.round(r.width)}x${Math.round(r.height)}`,
            );
          }
        }
        return [...new Set(out)].slice(0, 5);
      });
      for (const s of small) note(ctx, `tap target under WCAG 2.5.8 24px: ${s}`);

      const chars = await page.evaluate(() => {
        const panel = document.querySelector(".sg-tabpanel:not([hidden])");
        return panel ? (panel.innerText || "").trim().length : -1;
      });
      if (chars === 0) note(ctx, "ACTIVE PANEL IS EMPTY");
      else if (chars > 0 && chars < 40) note(ctx, `panel has almost no content (${chars} chars)`);
    }

    for (const e of errors) note(ctxBase, `console: ${e}`);
    await page.close();
  }
}

await browser.close();

console.log(
  findings.length ? findings.join("\n") : "No findings — every phase clean at both widths.",
);
console.log(
  `\n--- ${findings.length} finding(s) across ${LESSONS.length} lessons x ${SIZES.length} widths`,
);

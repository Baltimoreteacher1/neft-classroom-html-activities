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
 *  5. TABS ARE NESTED — walk them the way a student does. The phase tablist
 *     owns three panels, and each panel carries its OWN sub-step tablist
 *     (`.sg-substeps`, shipped 2026-08-25). A flat `[role="tab"]` walk clicked
 *     the chips belonging to the two phases you are not in; those measure 0x0
 *     because their panel is hidden, so every one of them reported "tab not
 *     clickable" — 20 of the 22 findings on 2026-08-25, and the reason a
 *     report-only tool read as a broken page. The fix is not an ignore rule:
 *     activate a phase, THEN walk the sub-steps that phase reveals. That
 *     removes the false positives by construction and, for the first time,
 *     actually measures each sub-step panel.
 *
 *  6. ANIMATION IS NOT A DEFECT — a sub-step click calls
 *     `panel.scrollIntoView({ behavior: "smooth" })`, and Playwright's
 *     actionability check requires a box that has stopped moving. The default
 *     click therefore timed out mid-scroll on a control a student can hit
 *     perfectly well (2 of the 22). Motion is reduced and transitions are
 *     zeroed for the sweep, and the click is given a bounded 4s to let any
 *     remaining scroll settle. Deliberately NOT `{ force: true }` — that would
 *     also swallow a control genuinely covered by an overlay, which is a real
 *     finding this sweep exists to catch.
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
import { exitSkipped } from "../tools/lib/skip-exit.mjs";

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
/* Coverage, not decoration. "0 findings" and "walked nothing" print the same
   line otherwise, and narrowing the walk is exactly how this sweep could stop
   covering the sub-steps it was just taught to reach. Reported on every run,
   and a run that reaches no phase at all EXITS NON-ZERO — that is broken
   discovery, not a clean result. */
const walked = { phases: 0, steps: 0 };

/**
 * Label each tablist `outer` (the phase bar) or `inner` (a sub-step strip
 * living inside a phase's panel) — note 5. Structural, not class-name based, so
 * renaming `.sg-substeps` cannot quietly turn the sub-step walk back off.
 * Re-run after every phase activation: the panel re-renders, so tags placed
 * before the click are gone.
 */
const tagTablists = (page) =>
  page.evaluate(() => {
    for (const tl of document.querySelectorAll('[role="tablist"]')) {
      const inside = tl.closest('[role="tabpanel"], .sg-tabpanel, .sg-panel');
      tl.setAttribute("data-ux-tablist", inside ? "inner" : "outer");
    }
  });

/**
 * Is this control on screen RIGHT NOW? A sub-step chip belonging to a phase you
 * are not in is 0x0 inside a hidden panel. That is the panel being hidden — the
 * behaviour the step strip is built on — not a control a student cannot reach.
 */
const isOnScreen = (locator) =>
  locator.evaluate((el) => {
    if (el.closest("[hidden]")) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none";
  });

/**
 * Click a tab that is supposed to be reachable, and report it when it is not.
 * The 4s bound is note 6: long enough for a smooth scroll to settle, short
 * enough that a control pinned under an overlay still fails fast. The failure
 * message carries Playwright's own first line, because "not clickable" alone
 * does not say whether the thing was covered, disabled, or still moving.
 */
async function activateTab(locator, ctx) {
  try {
    await locator.click({ timeout: 4000 });
  } catch (e) {
    const why = String(e.message || e)
      .split("\n")
      .find((l) => /intercept|not (visible|enabled|stable)|outside of the viewport/i.test(l));
    note(ctx, `tab not clickable${why ? ` — ${why.trim()}` : ""}`);
  }
}

/* The preview server is this sweep's subject; without it there is nothing to
 * report. It used to proceed anyway and die on the first locator with an
 * uncaught TimeoutError — a stack trace where a report should be, which reads
 * as "this tool is broken" rather than "start the server". */
try {
  const probe = await fetch(BASE, { method: "GET" });
  if (!probe.ok) throw new Error(`HTTP ${probe.status}`);
} catch (e) {
  exitSkipped(
    `no preview server at ${BASE} (${String(e.message || e).slice(0, 80)})`,
    "Start one with:  npm run preview -- --port 4499",
  );
}

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
  /* The tab walk itself — note 5 and note 6. Narrowing a walk is how a sweep
     quietly stops covering the thing it was written for, so both directions are
     pinned: a chip in a hidden panel must be SKIPPED, and a visible chip that a
     student genuinely cannot reach must still be REPORTED. Without the second
     case the fix for the false positives would also silence the true ones. */
  const walkPage = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await walkPage.setContent(`<body style="margin:0">
    <div role="tablist"><button role="tab" id="phase">Phase</button></div>
    <div class="sg-tabpanel" id="shown">
      <div role="tablist"><button role="tab" id="chip-shown">shown chip</button></div>
    </div>
    <div class="sg-tabpanel" id="other" hidden>
      <div role="tablist"><button role="tab" id="chip-hidden">hidden chip</button></div>
    </div>
    <div role="tablist"><button role="tab" id="chip-blocked">blocked chip</button></div>
    <div style="position:fixed;inset:0;background:rgba(0,0,0,.2)"></div>
  </body>`);
  await tagTablists(walkPage);
  const outerCount = await walkPage.locator('[data-ux-tablist="outer"] [role="tab"]').count();
  const shown = await isOnScreen(walkPage.locator("#chip-shown"));
  const hidden = await isOnScreen(walkPage.locator("#chip-hidden"));
  const before = findings.length;
  await activateTab(walkPage.locator("#chip-blocked"), "selftest");
  const reportedBlocked = findings.length > before;
  findings.length = before; // fixture findings are not real findings
  await walkPage.close();

  const walkProblems = [];
  if (outerCount !== 2)
    walkProblems.push(
      `tablist tagging found ${outerCount} outer tab(s), expected 2 (the phase tab and the blocked chip, whose tablist is in no panel)`,
    );
  if (!shown) walkProblems.push("a chip in the SHOWING panel was classified off screen");
  if (hidden)
    walkProblems.push(
      "a chip in a HIDDEN panel was classified on screen — the false positives are back",
    );
  if (!reportedBlocked)
    walkProblems.push(
      "a visible chip covered by a fixed overlay was NOT reported — real findings are being swallowed",
    );
  if (walkProblems.length) {
    console.error("SELF-TEST FAILED — the tab walk would misreport:");
    for (const p of walkProblems) console.error(`  - ${p}`);
    await browser.close();
    process.exit(1);
  }
  console.log(
    "self-test: detectors fire (overflow + tap target), label exemption holds, hidden-panel chips skipped and a blocked chip still reported.\n",
  );
}

for (const size of SIZES) {
  for (const id of LESSONS) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
    /* note 6 — the sweep measures layout, not animation. Reduced motion plus a
       zeroed transition/scroll duration means a control is judged on where it
       comes to rest, not on whether it happened to be mid-scroll. */
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const s = document.createElement("style");
        s.textContent =
          "*,*::before,*::after{scroll-behavior:auto !important;animation-duration:0s !important;transition-duration:0s !important}";
        document.head.appendChild(s);
      });
    });
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
    /* The student-name field, if this lesson opens with one.
     *
     * This used to be `input[type="text"]` + `.count()`, and `.count()` proves
     * a node EXISTS, not that it can be typed into. The first text input on a
     * small-group page is `.sg-room-code` ("Table code"), which is present but
     * hidden — so `.fill()` blocked for its full 30s default and threw an
     * uncaught TimeoutError, killing a REPORT-ONLY tool before it printed a
     * single finding. Ask for a visible field, and bound the wait: this is one
     * optional convenience step, not the thing being audited. */
    const name = page.locator('input[type="text"]:visible').first();
    if (await name.count()) {
      await name.fill("Sam", { timeout: 2000 }).catch(() => {
        note(ctxBase, "could not fill the visible name field (continuing without it)");
      });
    }
    const go = page
      .locator('button:has-text("Start"), button:has-text("Begin"), button[type="submit"]')
      .first();
    if (await go.count()) {
      await go.click().catch(() => {});
      await page.waitForTimeout(1500);
    }

    await tagTablists(page);
    const phaseTabs = page.locator('[data-ux-tablist="outer"] [role="tab"]');
    const phaseCount = await phaseTabs.count();
    if (!phaseCount) note(ctxBase, "NO PHASE TABS FOUND");

    for (let i = 0; i < phaseCount; i++) {
      const tab = phaseTabs.nth(i);
      const label = (await tab.innerText()).replace(/\s+/g, " ").trim().slice(0, 28);
      const ctx = `${ctxBase} > ${label}`;
      await activateTab(tab, ctx);
      walked.phases += 1;
      await page.waitForTimeout(900);
      await measurePanel(page, ctx);

      /* This phase's own sub-steps — note 5. Re-tag first: activating a phase
       * re-renders its panel, so tablist handles from before the click are
       * stale. Chips still off screen belong to another phase and are skipped
       * without comment; there is nothing to report about a panel that is
       * correctly not showing. */
      await tagTablists(page);
      const steps = page.locator('[data-ux-tablist="inner"] [role="tab"]');
      const stepCount = await steps.count();
      for (let j = 0; j < stepCount; j++) {
        const chip = steps.nth(j);
        if (!(await isOnScreen(chip))) continue;
        const stepLabel = (await chip.innerText()).replace(/\s+/g, " ").trim().slice(0, 24);
        const sctx = `${ctx} > ${stepLabel}`;
        await activateTab(chip, sctx);
        walked.steps += 1;
        await page.waitForTimeout(500);
        await measurePanel(page, sctx);
      }
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
  `\n--- ${findings.length} finding(s) across ${LESSONS.length} lessons x ${SIZES.length} widths` +
    ` · walked ${walked.phases} phase panel(s) and ${walked.steps} sub-step panel(s)`,
);
if (walked.phases === 0) {
  console.error(
    "\nFAIL: the sweep reached no phase panel at all. It has verified nothing, and a clean" +
      " report here would be a lie about coverage, not a finding about the lessons.",
  );
  process.exit(1);
}

/* ── the measurements, shared by phase tabs and sub-step chips ───────────── */

async function measurePanel(page, ctx) {
  {
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
      for (const el of document.querySelectorAll("button, a[href], input, select, [role=button]")) {
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
}

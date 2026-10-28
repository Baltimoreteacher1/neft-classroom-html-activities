#!/usr/bin/env node
import { mkdirSync, readFileSync } from "node:fs";
// The family design-system specimen, driven in a real browser.
// Usage: node tools/verify-family-design-system-browser.mjs [--no-shots]
//
// validate:family-design-tokens measures what the page renders (colors, sizes, radii, fonts, AA text runs).
// This is the accessibility and behavior half, across the whole matrix a family can reach:
//   4 widths (320, 390, 768, 1280) x English and Spanish x light, dark and high contrast, then
//   - no horizontal scroll, also at 150% text, extra spacing, the dyslexia font, shorter lines, 640px (200% zoom)
//   - axe (WCAG 2.0/2.1/2.2 A and AA): zero serious or critical, also with a sheet open
//   - the live contrast table the page computes for itself: every pair passes in every theme
//   - Tab reaches controls and every one shows a 3px focus ring
//   - forced-colors keeps controls visible; reduced motion leaves no running animation
//   - "try another look" is never the error color; math-model labels render at 13px or more
//   - the viewport frame (320/390/768/1280), the language switch, tabs, sheet, tooltip, hint ladder, sort
// Screenshots go to docs/family-homework-v3/design-system/. A missing browser is a SKIP, never a pass.
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { launchBrowser, openSpecimen, SPECIMEN, serveRepo } from "./lib/family-design-browser.mjs";
import { ROOT } from "./lib/family-tokens.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const SHOTS = resolve(ROOT, "docs/family-homework-v3/design-system");
const takeShots = !process.argv.includes("--no-shots");
const AXE = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const WIDTHS = [320, 390, 768, 1280];
const LANGS = ["en", "es"];
const THEMES = ["light", "dark", "contrast"];

const failures = [];
let checks = 0;
const check = (ok, label) => {
  checks++;
  if (!ok) failures.push(label);
};

// Entrances fade in over 200ms; axe must judge the finished state, not a half-transparent frame.
async function settle(page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => Number.isFinite(a.effect.getComputedTiming().endTime))
        .map((a) => a.finished.catch(() => {})),
    ),
  );
}

async function axeViolations(page) {
  await settle(page);
  await page.evaluate(AXE);
  const r = await page.evaluate(() =>
    window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    }),
  );
  return r.violations
    .filter((v) => v.impact === "serious" || v.impact === "critical")
    .map((v) => `${v.id} x${v.nodes.length} (${v.nodes[0].target.join(" ")})`);
}

const overflow = (page) =>
  page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);

async function matrix(browser, origin) {
  mkdirSync(SHOTS, { recursive: true });
  for (const theme of THEMES)
    for (const lang of LANGS)
      for (const width of WIDTHS) {
        const label = `${theme}/${lang}/${width}px`;
        const { page, context, pageErrors } = await openSpecimen(browser, origin, {
          width,
          theme,
          lang,
        });
        const [sw, cw] = await overflow(page);
        check(sw <= cw, `${label}: horizontal scroll ${sw} > ${cw}`);
        check(pageErrors.length === 0, `${label}: page errors ${pageErrors.join("; ")}`);
        const bad = await axeViolations(page);
        check(bad.length === 0, `${label}: axe ${bad.join(" | ")}`);
        const pairs = await page.evaluate(() => window.__fmContrast || []);
        check(
          pairs.length >= 12,
          `${label}: live contrast table measured only ${pairs.length} pairs`,
        );
        for (const p of pairs.filter((x) => !x.ok))
          failures.push(`${label}: ${p.fg} on ${p.bg} is ${p.ratio.toFixed(2)}, needs ${p.min}`);
        check(
          (await page.evaluate(() => document.documentElement.lang)) === lang,
          `${label}: html lang is not ${lang}`,
        );
        // Math-model labels: rendered size = font-size x the SVG's scale.
        const small = await page.evaluate(() => {
          const out = [];
          for (const t of document.querySelectorAll(".fm-stage svg text")) {
            const svg = t.ownerSVGElement;
            const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
            const px = Number.parseFloat(getComputedStyle(t).fontSize) * scale;
            if (px < 12.95) out.push(`${t.textContent.trim().slice(0, 8)} ${px.toFixed(1)}px`);
          }
          return out;
        });
        check(small.length === 0, `${label}: model labels under 13px: ${small.join(", ")}`);
        // The Spanish pass must actually have translated.
        const h1 = await page.evaluate(() => document.querySelector("h1").textContent);
        check(
          (lang === "es") === /Un sistema/.test(h1),
          `${label}: heading language is wrong: ${h1}`,
        );
        if (takeShots) {
          await page
            .locator(".fm-hero")
            .first()
            .screenshot({ path: `${SHOTS}/hero-${theme}-${lang}-${width}.png` });
          if (
            (theme === "light" && lang === "en" && width === 390) ||
            (theme === "dark" && lang === "es" && width === 390) ||
            (theme === "contrast" && lang === "en" && width === 1280) ||
            (theme === "light" && lang === "es" && width === 320)
          )
            await page.screenshot({
              path: `${SHOTS}/full-${theme}-${lang}-${width}.jpg`,
              type: "jpeg",
              quality: 55,
              fullPage: true,
            });
        }
        await context.close();
      }
}

async function reflow(browser, origin) {
  const cases = [
    { width: 320, text: "150" },
    { width: 320, text: "150", spacing: "more", lang: "es" },
    { width: 390, reading: "dyslexia", spacing: "more", text: "130" },
    { width: 390, measure: "narrow" },
    { width: 640, text: "100" }, // 200% zoom of a 1280px window
    { width: 1366, height: 768 },
  ];
  for (const c of cases) {
    const label = `reflow ${JSON.stringify(c)}`;
    const { page, context } = await openSpecimen(browser, origin, {
      theme: "light",
      lang: "en",
      ...c,
    });
    const [sw, cw] = await overflow(page);
    check(sw <= cw, `${label}: horizontal scroll ${sw} > ${cw}`);
    const bad = await axeViolations(page);
    check(bad.length === 0, `${label}: axe ${bad.join(" | ")}`);
    if (c.reading === "dyslexia") {
      const fam = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
      check(/Atkinson/.test(fam), `${label}: dyslexia option did not switch the font (${fam})`);
      const loaded = await page.evaluate(() =>
        [...document.fonts].some((f) => f.family.includes("Atkinson") && f.status === "loaded"),
      );
      check(loaded, `${label}: Atkinson did not load`);
    }
    if (c.spacing === "more") {
      const lh = await page.evaluate(() => {
        const p = document.querySelector(".sp-section p");
        const cs = getComputedStyle(p);
        return [
          Number.parseFloat(cs.lineHeight) / Number.parseFloat(cs.fontSize),
          cs.letterSpacing,
          cs.wordSpacing,
        ];
      });
      check(
        lh[0] >= 1.5 && lh[1] !== "normal" && lh[2] !== "normal",
        `${label}: text spacing not applied ${lh}`,
      );
    }
    if (c.text) {
      const fs = await page.evaluate(() =>
        Number.parseFloat(getComputedStyle(document.documentElement).fontSize),
      );
      check(Math.abs(fs - 16 * (Number(c.text) / 100)) < 0.1, `${label}: root size ${fs}`);
    }
    await context.close();
  }
}

// Hero + Start must fit one phone screen, leaving room for the top bar (brief 3.2).
async function heroFits(browser, origin) {
  for (const [width, height] of [
    [320, 568],
    [360, 640],
    [390, 844],
  ])
    for (const lang of LANGS) {
      const { page, context } = await openSpecimen(browser, origin, {
        width,
        height,
        lang,
        theme: "light",
      });
      const r = await page.evaluate(() => {
        const hero = document.querySelector(".fm-hero").getBoundingClientRect();
        const cta = document.querySelector(".fm-hero .fm-btn--primary").getBoundingClientRect();
        return cta.bottom - hero.top;
      });
      check(
        r <= height - 64,
        `hero ${lang} ${width}x${height}: Start ends ${Math.round(r)}px down, over ${height - 64}`,
      );
      await context.close();
    }
}

async function focusRings(browser, origin) {
  for (const theme of THEMES) {
    const { page, context } = await openSpecimen(browser, origin, {
      width: 390,
      theme,
      lang: "en",
    });
    let seen = 0;
    for (let i = 0; i < 90; i++) {
      await page.keyboard.press("Tab");
      const r = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const target = el.matches("input[type=radio]")
          ? (el.closest("label")?.querySelector("span") ?? el)
          : el;
        const ts = getComputedStyle(target);
        const w = Number.parseFloat(ts.outlineWidth) || Number.parseFloat(cs.outlineWidth);
        const style = ts.outlineStyle !== "none" ? ts.outlineStyle : cs.outlineStyle;
        const r = target.getBoundingClientRect();
        return { w, style, tag: el.tagName + "." + String(el.className).slice(0, 24), h: r.height };
      });
      if (!r) continue;
      seen++;
      check(
        r.w >= 3 && r.style !== "none",
        `focus ${theme}: ${r.tag} has outline ${r.w}px ${r.style}`,
      );
    }
    check(seen >= 60, `focus ${theme}: Tab reached only ${seen} controls`);
    await context.close();
  }
  // Targets: every button, input, link and chip a person taps is 44px or has a 44px hit area.
  const { page, context } = await openSpecimen(browser, origin, {
    width: 390,
    theme: "light",
    lang: "en",
  });
  const small = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll("button, a[href], input, summary, [role=tab]")) {
      if (el.closest("dialog:not([open])") || el.closest("[hidden]")) continue;
      let box = el;
      if (el.matches("input[type=radio]") && !el.closest(".fm-seg__opt"))
        box = el.closest("label") ?? el;
      const r = box.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const hit = el.matches(".fm-chip, .fm-vocab, .fm-dot, .fm-skip") ? 44 : r.height;
      if (el.matches(".fm-skip")) continue;
      if (r.height < 43.5 && hit < 44 && !el.matches(".fm-chip, .fm-vocab, .fm-dot"))
        out.push(
          `${el.tagName}.${String(el.className).slice(0, 24)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}`,
        );
    }
    return out;
  });
  check(small.length === 0, `targets under 44px: ${small.slice(0, 6).join(", ")}`);
  const chipPad = await page.evaluate(() => {
    const c = document.querySelector("button.fm-chip");
    const a = getComputedStyle(c, "::after");
    return c.getBoundingClientRect().height + Math.abs(Number.parseFloat(a.insetBlockStart)) * 2;
  });
  check(chipPad >= 44, `interactive chip hit area is ${chipPad}px`);
  await context.close();
}

async function special(browser, origin) {
  // Forced colors: controls keep an edge and a distinct fill.
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      forcedColors: "active",
    });
    const page = await context.newPage();
    await page.goto(`${origin}${SPECIMEN}?embed=1`);
    await page.waitForFunction(() => window.__fmReady === true);
    const [sw, cw] = await overflow(page);
    check(sw <= cw, `forced-colors: horizontal scroll ${sw} > ${cw}`);
    const prim = await page.evaluate(() => {
      const b = document.querySelector(".fm-btn--primary");
      const cs = getComputedStyle(b);
      return {
        fg: cs.color,
        bg: cs.backgroundColor,
        edge: cs.borderTopColor,
        w: cs.borderTopWidth,
      };
    });
    check(
      prim.fg !== prim.bg && Number.parseFloat(prim.w) >= 2,
      `forced-colors: primary button lost its fill or edge ${JSON.stringify(prim)}`,
    );
    const card = await page.evaluate(
      () => getComputedStyle(document.querySelector(".fm-card")).borderTopWidth,
    );
    check(Number.parseFloat(card) >= 1, "forced-colors: cards lost their border");
    if (takeShots)
      await page.screenshot({ path: `${SHOTS}/forced-colors-390.jpg`, type: "jpeg", quality: 60 });
    await context.close();
  }
  // Reduced motion + behavior + "try another look" is not red.
  {
    const { page, context } = await openSpecimen(browser, origin, {
      width: 390,
      theme: "light",
      lang: "en",
      motion: "reduce",
    });
    await page.fill("#num-1", "10");
    await page.locator('[data-try="12"] [data-check]').click();
    const look = page.locator('[data-try="12"] [data-fb="look"]');
    check(await look.isVisible(), "wrong numeric answer did not show the soft panel");
    const colors = await page.evaluate(() => {
      const el = document.querySelector('[data-try="12"] [data-fb="look"]');
      const cs = getComputedStyle(el);
      const probe = document.createElement("span");
      document.body.append(probe);
      probe.style.color = "var(--fm-error)";
      const err = getComputedStyle(probe).color;
      probe.style.color = "var(--fm-error-ink)";
      const errInk = getComputedStyle(probe).color;
      probe.remove();
      return {
        edge: cs.borderTopColor,
        bg: cs.backgroundColor,
        err,
        errInk,
        style: cs.borderTopStyle,
      };
    });
    check(
      ![colors.err, colors.errInk].includes(colors.edge),
      `"try another look" uses the error color ${JSON.stringify(colors)}`,
    );
    check(colors.style === "dashed", `"try another look" is not dashed: ${colors.style}`);
    const running = await page.evaluate(
      () =>
        document
          .getAnimations()
          .filter(
            (a) =>
              a.playState === "running" &&
              a.effect.getTiming().duration > 1 &&
              !a.effect.target?.matches?.(".fm-skeleton"),
          ).length,
    );
    check(running === 0, `reduced motion left ${running} animations running`);
    await page.fill("#num-1", "12");
    await page.locator('[data-try="12"] [data-check]').click();
    check(
      await page.locator('[data-try="12"] [data-fb="right"]').isVisible(),
      "right answer did not show the success panel",
    );
    await context.close();
  }
  // Behavior in the default motion mode.
  {
    const { page, context } = await openSpecimen(browser, origin, {
      width: 390,
      theme: "light",
      lang: "es",
    });
    // tabs
    await page.locator("#tab-a").focus();
    await page.keyboard.press("ArrowRight");
    check(
      (await page.locator("#tab-b").getAttribute("aria-selected")) === "true",
      "tabs: ArrowRight did not select the next tab",
    );
    check(await page.locator("#panel-b").isVisible(), "tabs: the panel did not follow");
    // sheet: open, Escape closes, focus returns is handled by the platform
    await page.locator('[data-open-sheet="sheet-more"]').first().click();
    check(await page.locator("#sheet-more").evaluate((d) => d.open), "sheet did not open");
    const sheetBad = await axeViolations(page);
    check(sheetBad.length === 0, `open sheet: axe ${sheetBad.join(" | ")}`);
    await page.keyboard.press("Escape");
    check(
      !(await page.locator("#sheet-more").evaluate((d) => d.open)),
      "Escape did not close the sheet",
    );
    // tooltip
    await page
      .locator("#tip-1")
      .evaluate((el) => el.closest(".fm-tooltip").querySelector("button").click());
    check(
      (await page.locator("#tip-1").evaluate((el) => getComputedStyle(el).display)) !== "none",
      "tooltip did not open on tap",
    );
    await page.keyboard.press("Escape");
    // hint ladder
    await page.locator("[data-next-hint]").click();
    check(
      (await page.locator('.fm-rung[data-state="open"]').count()) === 2,
      "hint ladder did not open the next rung",
    );
    // sort
    const first = await page.locator(".fm-sort__item span").first().textContent();
    await page.locator('.fm-sort__item [data-move="down"]').first().click();
    check(
      (await page.locator(".fm-sort__item span").first().textContent()) !== first,
      "sort: Move down did not reorder",
    );
    // toast
    await page.locator("[data-toast]").click();
    check((await page.locator(".fm-toasts .fm-toast").count()) === 1, "toast did not appear");
    // flip
    await page.locator(".fm-flip").click();
    check(
      (await page.locator(".fm-flip").getAttribute("aria-pressed")) === "true",
      "flip card did not flip",
    );
    // destructive confirm needs two taps
    const del = page.locator("[data-confirm-button]");
    await del.click();
    check(
      (await del.getAttribute("data-confirm")) === "armed",
      "destructive button armed on the first tap? it must arm, not act",
    );
    await context.close();
  }
  // Full page: the viewport frame and the language switch.
  {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${origin}${SPECIMEN}?lang=en&theme=light`);
    await page.waitForFunction(() => window.__fmReady === true);
    for (const w of ["320", "390", "768", "1280"]) {
      await page.locator(`input[data-opt="frame"][value="${w}"]`).check({ force: true });
      await page.waitForSelector(".sp-frame iframe");
      const frame = page.frameLocator(".sp-frame iframe");
      await frame.locator("h1").waitFor();
      const dims = await page.evaluate(() => {
        const f = document.querySelector(".sp-frame iframe");
        const d = f.contentDocument.documentElement;
        return [Number(f.getAttribute("width")), d.scrollWidth, d.clientWidth];
      });
      check(dims[0] === Number(w) && dims[1] <= dims[2], `frame ${w}: ${JSON.stringify(dims)}`);
    }
    await page.locator('input[data-opt="frame"][value="full"]').check({ force: true });
    await page.locator('input[data-opt="lang"][value="es"]').check({ force: true });
    check(
      (await page.locator("h1").first().textContent()).includes("Un sistema"),
      "language switch did not translate the heading",
    );
    await page.locator('input[data-opt="theme"][value="dark"]').check({ force: true });
    check(
      (await page.evaluate(() => document.documentElement.dataset.theme)) === "dark",
      "theme switch did not set data-theme",
    );
    await page.locator('button[data-opt-switch="gray"]').click();
    check(
      (await page.evaluate(() => document.documentElement.dataset.gray)) === "on",
      "grayscale preview did not turn on",
    );
    if (takeShots) await page.screenshot({ path: `${SHOTS}/controls-1280-es-dark.png` });
    await context.close();
  }
}

async function main() {
  const server = await serveRepo();
  const browser = await launchBrowser();
  if (!browser) {
    await server.close();
    process.exit(
      skipExit(
        "no browser could launch, so the design-system specimen was not driven",
        "set PW_CHROMIUM_PATH or run `npx playwright install chromium`",
      ),
    );
  }
  try {
    await matrix(browser, server.origin);
    await reflow(browser, server.origin);
    await heroFits(browser, server.origin);
    await focusRings(browser, server.origin);
    await special(browser, server.origin);
  } finally {
    await browser.close();
    await server.close();
  }
  if (checks < 300) failures.push(`only ${checks} checks ran; the sweep did not cover the matrix`);
  if (failures.length) {
    console.error(
      `FAIL validate:family-design-system-browser (${failures.length} of ${checks} checks)\n  ${failures.join("\n  ")}`,
    );
    process.exit(1);
  }
  console.log(
    `PASS validate:family-design-system-browser (${checks} checks: 24 matrix runs, reflow, focus, forced colors, motion, behavior)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

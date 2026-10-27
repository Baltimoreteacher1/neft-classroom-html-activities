#!/usr/bin/env node
// Measured style audit of the core interactive lessons, in a real browser.
//
//   node tools/style-audit.mjs --base http://localhost:4499 --out reports/style-audit.json
//   node tools/style-audit.mjs --lessons 1-1,3-1,8-1 --viewport 390x844
//
// Records COMPUTED values only (what the browser painted), never source text:
// font families/sizes, colours, hue buckets, radii, shadows, button variants,
// fixed-position collisions, small touch targets, horizontal overflow, contrast.
// It reports measurements; it does not pass or fail. Gates built on top of it
// (palette, contrast, typography) live in their own validators.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { chromium } from "playwright";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--"))
      acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith("--") ? all[i + 1] : true]);
    return acc;
  }, []),
);
const BASE = args.base || "http://localhost:4499";
const OUT = args.out || "reports/style-audit.json";
const VIEWPORTS = (args.viewport || "1366x768,390x844")
  .split(",")
  .map((v) => v.split("x").map(Number));
const manifest = JSON.parse(readFileSync("data/curriculum-launch-manifest.json", "utf8"));
const ALL = (manifest.lessons || []).map((l) => l.id);
const LESSONS = args.lessons ? String(args.lessons).split(",") : ALL;
const PHASES = [
  "Vocabulary",
  "Launch",
  "Learn It",
  "Explore",
  "Practice",
  "Connect",
  "Exit Ticket",
];
const EXE = process.env.PW_CHROMIUM_PATH || undefined;

// Runs inside the page. Pure measurement.
function measure() {
  const parse = (c) => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1]
      .split(/[ ,/]+/)
      .filter(Boolean)
      .map(Number);
    return { r, g, b, a };
  };
  const hsl = ({ r, g, b }) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const mx = Math.max(r, g, b),
      mn = Math.min(r, g, b),
      l = (mx + mn) / 2,
      d = mx - mn;
    if (!d) return { h: 0, s: 0, l };
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
    return { h, s, l };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const hex = ({ r, g, b }) =>
    `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
  const isPurple = (c) => {
    const x = hsl(c);
    return x.s > 0.15 && x.l > 0.03 && x.l < 0.97 && x.h >= 255 && x.h <= 335;
  };
  const visible = (e) => {
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const s = getComputedStyle(e);
    return s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0.02;
  };
  // Effective background: nearest ancestor with an opaque solid colour.
  // Gradients/images make the answer unknowable, so say so rather than guess.
  const effBg = (e) => {
    for (let n = e; n && n.nodeType === 1; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== "none") return null;
      const c = parse(s.backgroundColor);
      if (c && c.a >= 0.98) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const fonts = {},
    sizes = {},
    colours = {},
    bgs = {},
    radii = {},
    shadows = {},
    weights = {};
  const purple = [],
    lowContrast = [],
    smallText = [],
    smallTargets = [],
    emojiControls = [];
  const buttonVariants = {};
  const bump = (o, k) => {
    o[k] = (o[k] || 0) + 1;
  };
  const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
  let visualSmall = 0;
  let textNodes = 0,
    unknownBg = 0;
  const all = [...document.querySelectorAll("body *")].filter(visible);
  for (const e of all) {
    const s = getComputedStyle(e);
    const hasOwnText = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const fg = parse(s.color);
    const bg = parse(s.backgroundColor);
    if (bg && bg.a > 0.05) {
      bump(bgs, hex(bg));
      if (isPurple(bg))
        purple.push({
          el: e.tagName + "." + String(e.className).slice(0, 40),
          prop: "bg",
          c: hex(bg),
        });
    }
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      if (parseFloat(s[`border${side}Width`]) > 0) {
        const bc = parse(s[`border${side}Color`]);
        if (bc && bc.a > 0.05 && isPurple(bc)) {
          purple.push({
            el: e.tagName + "." + String(e.className).slice(0, 40),
            prop: "border",
            c: hex(bc),
          });
          break;
        }
      }
    }
    if (s.borderRadius && s.borderRadius !== "0px") bump(radii, s.borderRadius.split(" ")[0]);
    if (s.boxShadow && s.boxShadow !== "none")
      bump(shadows, s.boxShadow.replace(/rgba?\([^)]*\)/g, "C").slice(0, 60));
    if (hasOwnText && fg) {
      textNodes++;
      const fam = s.fontFamily.split(",")[0].replace(/["']/g, "").trim();
      bump(fonts, fam);
      bump(sizes, s.fontSize);
      bump(weights, s.fontWeight);
      bump(colours, hex(fg));
      if (isPurple(fg))
        purple.push({
          el: e.tagName + "." + String(e.className).slice(0, 40),
          prop: "color",
          c: hex(fg),
        });
      const fs = parseFloat(s.fontSize);
      if (fs < 12) smallText.push({ t: (e.textContent || "").trim().slice(0, 24), fs });
      const b = effBg(e);
      if (!b) unknownBg++;
      else {
        const a =
          fg.a < 1
            ? {
                r: fg.r * fg.a + b.r * (1 - fg.a),
                g: fg.g * fg.a + b.g * (1 - fg.a),
                b: fg.b * fg.a + b.b * (1 - fg.a),
              }
            : fg;
        const L1 = lum(a),
          L2 = lum(b);
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const large = fs >= 24 || (fs >= 18.66 && +s.fontWeight >= 700);
        if (ratio < (large ? 3 : 4.5))
          lowContrast.push({
            t: (e.textContent || "").trim().slice(0, 28),
            ratio: +ratio.toFixed(2),
            fs,
            fg: hex(a),
            bg: hex(b),
          });
      }
    }
    if (e.matches("button, [role=button], a.btn, input[type=button], input[type=submit]")) {
      const r = e.getBoundingClientRect();
      // A control's reachable area includes a transparent ::after hit-area extender
      // (design-system.css grows .pub-btn, .nt-sb-toggle ... to 44px without changing
      // how they look). Judge the larger of the two, or the count is a false alarm.
      const ps = getComputedStyle(e, "::after");
      const ext = ps.content !== "none" && ps.position === "absolute";
      const effW = Math.max(
        r.width,
        ext ? Math.max(parseFloat(ps.width) || 0, parseFloat(ps.minWidth) || 0) : 0,
      );
      const effH = Math.max(
        r.height,
        ext ? Math.max(parseFloat(ps.height) || 0, parseFloat(ps.minHeight) || 0) : 0,
      );
      if (r.width < 44 || r.height < 44) visualSmall++;
      // Inline vocabulary links sit inside a sentence: WCAG 2.5.8 exempts inline targets.
      if ((effW < 44 || effH < 44) && !e.matches(".obj-term"))
        smallTargets.push({
          t: (e.innerText || e.getAttribute("aria-label") || "").trim().slice(0, 24),
          w: Math.round(effW),
          h: Math.round(effH),
        });
      const lead = (e.innerText || e.textContent || "").trim();
      if (emoji.test(lead.slice(0, 3)) || (e.querySelector("span, i") && emoji.test(lead)))
        emojiControls.push(lead.replace(/\s+/g, " ").slice(0, 24));
      const key = [
        hex(bg || { r: 0, g: 0, b: 0 }),
        s.borderRadius.split(" ")[0],
        s.fontSize,
        s.fontWeight,
        s.paddingTop + "/" + s.paddingLeft,
      ].join("|");
      bump(buttonVariants, key);
    }
  }
  // Fixed-position chrome and collisions between visible fixed elements.
  const fixed = all
    .filter((e) => getComputedStyle(e).position === "fixed")
    .map((e) => {
      const r = e.getBoundingClientRect();
      return {
        id: (e.id || String(e.className).split(" ")[0] || e.tagName).slice(0, 30),
        x: r.left,
        y: r.top,
        w: r.width,
        h: r.height,
        text: (e.innerText || e.textContent || e.getAttribute("aria-label") || "")
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 20),
      };
    })
    .filter((f) => f.w > 8 && f.h > 8 && f.w < innerWidth * 0.95);
  const collisions = [];
  for (let i = 0; i < fixed.length; i++)
    for (let j = i + 1; j < fixed.length; j++) {
      const a = fixed[i],
        b = fixed[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x),
        oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ox > 4 && oy > 4)
        collisions.push([a.text || a.id, b.text || b.id, Math.round(ox), Math.round(oy)]);
    }
  const root = getComputedStyle(document.documentElement);
  return {
    textNodes,
    unknownBg,
    bodyFont: getComputedStyle(document.body).fontFamily.split(",")[0].replace(/["']/g, ""),
    bodySize: getComputedStyle(document.body).fontSize,
    rootBackgroundVarLeak: root.getPropertyValue("--paper").trim() || null,
    fonts,
    sizes,
    weights,
    colours,
    bgs,
    radii,
    shadows,
    distinct: {
      fonts: Object.keys(fonts).length,
      sizes: Object.keys(sizes).length,
      colours: Object.keys(colours).length,
      bgs: Object.keys(bgs).length,
      radii: Object.keys(radii).length,
      shadows: Object.keys(shadows).length,
      buttonVariants: Object.keys(buttonVariants).length,
    },
    purple: purple.slice(0, 20),
    purpleCount: purple.length,
    lowContrast: lowContrast.slice(0, 15),
    lowContrastCount: lowContrast.length,
    smallText: smallText.slice(0, 10),
    smallTextCount: smallText.length,
    smallTargets: smallTargets.slice(0, 12),
    smallTargetCount: smallTargets.length,
    visualSmallTargetCount: visualSmall,
    emojiControls: emojiControls.slice(0, 12),
    emojiControlCount: emojiControls.length,
    fixedCount: fixed.length,
    collisions,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    height: document.documentElement.scrollHeight,
  };
}

async function enter(page) {
  // Entry card(s) -> identity gate -> lesson. Lessons differ (8-1 has a Mission
  // Briefing card that must be clicked first), so loop on what is actually shown.
  for (let step = 0; step < 4; step++) {
    const name = page.locator('input[placeholder*="First"]').first();
    if (await name.isVisible().catch(() => false)) {
      await name.fill("Sam T");
      await page
        .locator('input[placeholder*="3"]')
        .first()
        .fill("3")
        .catch(() => {});
      await page
        .locator("button", { hasText: /Start Activity/i })
        .last()
        .click()
        .catch(() => {});
      await page.waitForTimeout(2200);
      return true;
    }
    // The mission card's call to action is worded per lesson ("Open the Case File →"),
    // so match the arrow rather than the label.
    const go = page
      .locator("button", { hasText: /→/ })
      .filter({ hasNotText: /Next:|Save|Workbench|Teacher/ })
      .first();
    if (!(await go.isVisible().catch(() => false))) return false;
    await go.click().catch(() => {});
    await page.waitForTimeout(700);
  }
  return false;
}

const browser = await chromium.launch(EXE ? { executablePath: EXE } : {});
const results = [];
for (const id of LESSONS) {
  for (const [w, h] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message.slice(0, 120)}`));
    page.on("console", (m) => {
      if (m.type() === "error" && !/ERR_TUNNEL|favicon/.test(m.text()))
        errors.push(m.text().slice(0, 120));
    });
    const rec = { id, viewport: `${w}x${h}`, states: {}, errors };
    try {
      const t0 = Date.now();
      await page.goto(`${BASE}/lessons/${id}/`, { waitUntil: "load", timeout: 30000 });
      await page.waitForTimeout(900);
      rec.loadMs = Date.now() - t0;
      rec.states.entry = await page.evaluate(measure);
      rec.entered = await enter(page);
      rec.states.lesson = await page.evaluate(measure);
      // Later phases. Direct DOM clicks on the sidebar entries: the forward pill is
      // gated by Math Notes checkpoints, the sidebar is not (and is what a student
      // uses to jump). Each state is measured after the page settles.
      if (rec.entered && !args["no-phases"]) {
        for (const name of PHASES) {
          const ok = await page.evaluate((n) => {
            const b = [
              ...document.querySelectorAll(".sidebar button, nav button, aside button"),
            ].find((x) => new RegExp(n).test(x.innerText) && !/Next:/.test(x.innerText));
            if (!b) return false;
            b.click();
            return true;
          }, name);
          if (!ok) continue;
          await page.waitForTimeout(1300);
          rec.states[`phase:${name}`] = await page.evaluate(measure);
        }
      }
    } catch (e) {
      rec.fatal = String(e.message).slice(0, 160);
    }
    results.push(rec);
    await ctx.close();
  }
  process.stderr.write(`audited ${id}\n`);
}
await browser.close();
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 1));
console.log(`wrote ${OUT} (${results.length} page runs)`);

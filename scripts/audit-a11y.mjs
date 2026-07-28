#!/usr/bin/env node
/**
 * Accessibility audit of the highest-traffic student pages.
 *
 * The e2e suite checks that pages render; it does not check that a student who
 * navigates by keyboard, or with a screen reader, can use them. That matters
 * here more than on a typical site: these pages are used on district
 * Chromebooks by students with IEPs and by multilingual learners, and the
 * Level 0 / Level 1 supports are exactly the population least able to route
 * around a broken focus order.
 *
 * Runs axe-core (WCAG 2.1 A + AA) plus a keyboard-reachability pass against the
 * live site, and reports. It does not gate CI — a11y findings need judgement,
 * and a flaky gate on a live URL would just get muted.
 *
 * Run:  npm run audit:a11y
 *       npm run audit:a11y -- --base http://localhost:4173
 * Writes reports/a11y-audit.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const argv = process.argv.slice(2);
const BASE = ((argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : null) || "https://eduwonderlab.com").replace(/\/$/, "");

/** Student-facing surfaces, weighted toward what a class actually opens. */
const PAGES = [
  { path: "/", name: "Home portal" },
  { path: "/curriculum/", name: "Curriculum hub" },
  { path: "/directory/", name: "Activity directory" },
  { path: "/lessons/1-1/", name: "Lesson 1-1 launcher" },
  { path: "/lessons/1-1/learn.html", name: "Lesson 1-1 Learn It" },
  { path: "/lessons/1-1/vocab.html", name: "Lesson 1-1 vocabulary" },
  { path: "/lessons/1-1/homework.html", name: "Lesson 1-1 homework" },
  { path: "/lessons/2-1/", name: "Lesson 2-1 launcher" },
  { path: "/lessons/4-2/", name: "Lesson 4-2 launcher" },
  { path: "/math/student-board/", name: "Class board" },
  { path: "/access-practice-lab/", name: "ACCESS practice lab" },
  { path: "/practice-engine/", name: "Practice engine" },
];

// Rules that fire on decorative/cosmetic layers and drown the real findings.
// Nothing here blocks a keyboard or screen-reader user.
const MUTED_RULES = new Set(["landmark-one-main", "region", "page-has-heading-one"]);

const IMPACT_ORDER = { critical: 0, serious: 1, moderate: 2, minor: 3 };

const browser = await chromium.launch();
const findings = [];
const keyboard = [];
const errors = [];

for (const page of PAGES) {
  const url = `${BASE}${page.path}`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const tab = await ctx.newPage();
  try {
    const res = await tab.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!res || res.status() >= 400) {
      errors.push({ page: page.name, path: page.path, detail: `HTTP ${res ? res.status() : "no response"}` });
      await ctx.close();
      continue;
    }
    // Give injected layers (supports, chrome docks, FX) a chance to mount.
    await tab.waitForTimeout(1500);

    const results = await new AxeBuilder({ page: tab }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    for (const v of results.violations) {
      if (MUTED_RULES.has(v.id)) continue;
      findings.push({
        page: page.name,
        path: page.path,
        id: v.id,
        impact: v.impact || "minor",
        help: v.help,
        nodes: v.nodes.length,
        sample: (v.nodes[0]?.html || "").slice(0, 120),
      });
    }

    // Keyboard reachability: how far does Tab actually get, and is focus visible?
    const kb = await tab.evaluate(async () => {
      const focusable = document.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const visible = [...focusable].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
      });
      // Two different questions: does the page style focus itself, and does it
      // SUPPRESS the browser's default ring? Only the second is a hard break —
      // a page with neither still shows the UA outline.
      let hasFocusStyle = false;
      let suppressesOutline = false;
      for (const sheet of document.styleSheets) {
        let rules;
        try {
          rules = [...sheet.cssRules];
        } catch {
          continue; // cross-origin sheet
        }
        for (const r of rules) {
          const sel = r.selectorText || "";
          if (/:focus(-visible)?/.test(sel)) hasFocusStyle = true;
          const outline = r.style?.outline ?? r.style?.getPropertyValue?.("outline") ?? "";
          if (/^(none|0)/.test(String(outline).trim()) && !/:focus-visible/.test(sel)) suppressesOutline = true;
        }
      }
      const positiveTabindex = [...document.querySelectorAll("[tabindex]")].filter(
        (el) => Number(el.getAttribute("tabindex")) > 0,
      ).length;
      return { focusable: visible.length, hasFocusStyle, suppressesOutline, positiveTabindex };
    });
    keyboard.push({ page: page.name, path: page.path, ...kb });
  } catch (err) {
    errors.push({ page: page.name, path: page.path, detail: err.message.split("\n")[0] });
  } finally {
    await ctx.close();
  }
}
await browser.close();

/* ------------------------------------------------------------------ report */

findings.sort((a, b) => (IMPACT_ORDER[a.impact] ?? 9) - (IMPACT_ORDER[b.impact] ?? 9) || a.page.localeCompare(b.page));

const byRule = new Map();
for (const f of findings) {
  if (!byRule.has(f.id)) byRule.set(f.id, { ...f, pages: new Set(), totalNodes: 0 });
  const entry = byRule.get(f.id);
  entry.pages.add(f.page);
  entry.totalNodes += f.nodes;
}

const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
for (const f of findings) counts[f.impact] = (counts[f.impact] || 0) + 1;

const lines = [];
lines.push(`# Accessibility audit — ${new Date().toISOString().slice(0, 10)}`);
lines.push("");
lines.push(`Target: \`${BASE}\` · ${PAGES.length} pages · axe-core WCAG 2.1 A/AA`);
lines.push("");
lines.push(`**${findings.length}** violations — critical ${counts.critical || 0}, serious ${counts.serious || 0}, moderate ${counts.moderate || 0}, minor ${counts.minor || 0}.`);
lines.push("");
lines.push(`Muted as cosmetic: \`${[...MUTED_RULES].join("`, `")}\`.`);
lines.push("");

lines.push("## By rule (fix these once, they clear everywhere)");
lines.push("");
if (byRule.size) {
  lines.push("| Impact | Rule | Elements | Pages | What it means |");
  lines.push("| --- | --- | ---: | ---: | --- |");
  for (const r of [...byRule.values()].sort((a, b) => (IMPACT_ORDER[a.impact] ?? 9) - (IMPACT_ORDER[b.impact] ?? 9) || b.totalNodes - a.totalNodes)) {
    lines.push(`| ${r.impact} | \`${r.id}\` | ${r.totalNodes} | ${r.pages.size} | ${r.help} |`);
  }
} else {
  lines.push("_No violations found._");
}
lines.push("");

lines.push("## Keyboard reachability");
lines.push("");
lines.push("| Page | Focusable elements | Focus visibility | Positive tabindex |");
lines.push("| --- | ---: | --- | ---: |");
for (const k of keyboard) {
  // Suppressing the UA ring is only a defect when nothing replaces it.
  const focusState = k.hasFocusStyle
    ? (k.suppressesOutline ? "custom (UA ring replaced)" : "custom")
    : (k.suppressesOutline ? "**NONE — focus is invisible**" : "browser default");
  lines.push(`| ${k.page} | ${k.focusable} | ${focusState} | ${k.positiveTabindex || 0} |`);
}
lines.push("");
lines.push("`custom (UA ring replaced)` is the correct pattern — `outline: none`");
lines.push("paired with a custom `:focus` style. `browser default` is acceptable.");
lines.push("Only `NONE` is a defect: the ring is suppressed and nothing replaces it,");
lines.push("so a keyboard user cannot see where they are. A positive `tabindex`");
lines.push("overrides document order and usually creates a confusing focus path.");
lines.push("");

lines.push("## Per-page detail");
lines.push("");
for (const page of PAGES) {
  const own = findings.filter((f) => f.path === page.path);
  if (!own.length) continue;
  lines.push(`### ${page.name} — \`${page.path}\``);
  lines.push("");
  for (const f of own) lines.push(`- **${f.impact}** \`${f.id}\` (${f.nodes} element${f.nodes === 1 ? "" : "s"}) — ${f.help}\n  - e.g. \`${f.sample.replace(/`/g, "'")}\``);
  lines.push("");
}

if (errors.length) {
  lines.push("## Pages that could not be audited");
  lines.push("");
  for (const e of errors) lines.push(`- \`${e.path}\` (${e.page}) — ${e.detail}`);
  lines.push("");
}

mkdirSync("reports", { recursive: true });
writeFileSync("reports/a11y-audit.md", lines.join("\n"));

console.log("✓ reports/a11y-audit.md");
console.log(`  ${findings.length} violations across ${PAGES.length - errors.length} pages · ${byRule.size} distinct rules`);
const blindFocus = keyboard.filter((k) => k.suppressesOutline && !k.hasFocusStyle);
if (blindFocus.length) console.log(`  ⚠ ${blindFocus.length} page(s) suppress the focus ring without replacing it`);
if (errors.length) console.log(`  ⚠ ${errors.length} page(s) could not be loaded`);

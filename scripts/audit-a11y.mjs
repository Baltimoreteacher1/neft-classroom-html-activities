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
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

const argv = process.argv.slice(2);
const BASE = (
  (argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : null) || "https://eduwonderlab.com"
).replace(/\/$/, "");

/**
 * What to audit.
 *
 * This list used to be twelve hand-picked paths, nine of which were lesson
 * pages. That reported "0 violations across 12 pages" while saying nothing at
 * all about a game, a project, a graphic novel, a printable or a family page —
 * whole page TEMPLATES, each rendering hundreds of URLs from one layout, were
 * never sampled. A template is the right unit here: a violation in one is a
 * violation in every page built from it.
 *
 * So the sample is one representative page per template, discovered from disk
 * (see TEMPLATES in scripts/lib/page-templates.mjs) rather than typed out, and
 * a template that gains pages later is audited without anyone remembering to
 * add it. tools/a11y-coverage.test.mjs fails if a template has no
 * representative, so the sample cannot silently fall behind the site again.
 *
 * ANCHORS are kept explicit on top: the specific pages a class opens most.
 */
const ANCHORS = [
  { path: "/", name: "Home portal" },
  { path: "/curriculum/", name: "Curriculum hub" },
  { path: "/directory/", name: "Activity directory" },
  { path: "/lessons/1-1/", name: "Lesson 1-1 launcher" },
  { path: "/math/student-board/", name: "Class board" },
  { path: "/access-practice-lab/", name: "ACCESS practice lab" },
  { path: "/practice-engine/", name: "Practice engine" },
];

const { representativePages } = await import("./lib/page-templates.mjs");
const PAGES = [
  ...ANCHORS,
  ...representativePages().filter((p) => !ANCHORS.some((a) => a.path === p.path)),
];

// Rules that fire on decorative/cosmetic layers and drown the real findings.
// Nothing here blocks a keyboard or screen-reader user.
const MUTED_RULES = new Set(["landmark-one-main", "region", "page-has-heading-one"]);

const IMPACT_ORDER = { critical: 0, serious: 1, moderate: 2, minor: 3 };

/**
 * Of the given axe nodes, return those whose painted background comes from a
 * gradient (on the element, an ancestor, or an ancestor's ::before/::after).
 * axe's reported contrast ratio is not meaningful for these.
 */
async function filterGradientBacked(tab, nodes) {
  const out = [];
  for (const n of nodes) {
    const sel = n.target?.[0];
    if (typeof sel !== "string") continue;
    let gradient = false;
    try {
      gradient = await tab.evaluate((s) => {
        const el = document.querySelector(s);
        if (!el) return false;
        const hasGradient = (cs) => /gradient\(/i.test(cs.backgroundImage || "");
        for (let node = el, depth = 0; node && depth < 4; node = node.parentElement, depth++) {
          if (hasGradient(getComputedStyle(node))) return true;
          for (const pseudo of ["::before", "::after"]) {
            const ps = getComputedStyle(node, pseudo);
            if (ps.content !== "none" && hasGradient(ps)) return true;
          }
        }
        return false;
      }, sel);
    } catch {
      gradient = false; // unresolvable selector → treat as a real finding
    }
    if (gradient) out.push(n);
  }
  return out;
}

const browser = await chromium.launch();
const findings = [];
const manualReview = [];
const keyboard = [];
const errors = [];

for (const page of PAGES) {
  const url = `${BASE}${page.path}`;
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const tab = await ctx.newPage();
  try {
    const res = await tab.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    if (!res || res.status() >= 400) {
      errors.push({
        page: page.name,
        path: page.path,
        detail: `HTTP ${res ? res.status() : "no response"}`,
      });
      await ctx.close();
      continue;
    }
    // Give injected layers (supports, chrome docks, FX) a chance to mount.
    await tab.waitForTimeout(1500);

    const results = await new AxeBuilder({ page: tab })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    for (const v of results.violations) {
      if (MUTED_RULES.has(v.id)) continue;
      // axe cannot compute contrast against a gradient: it walks up to the
      // nearest SOLID ancestor colour and reports that instead. On the ACCESS
      // lab that turns white-on-dark-teal-banner headings into a 1.11 "failure".
      // Split those out for human review rather than reporting a number that is
      // known to be wrong — a permanently-red check is one nobody reads.
      const reviewNodes = v.id === "color-contrast" ? await filterGradientBacked(tab, v.nodes) : [];
      const realNodes = v.nodes.filter((n) => !reviewNodes.includes(n));
      if (reviewNodes.length) {
        manualReview.push({
          page: page.name,
          path: page.path,
          id: v.id,
          nodes: reviewNodes.length,
          sample: (reviewNodes[0]?.html || "").slice(0, 120),
          why: "sits over a gradient — axe reported the nearest solid ancestor colour",
        });
      }
      if (!realNodes.length) continue;
      findings.push({
        page: page.name,
        path: page.path,
        id: v.id,
        impact: v.impact || "minor",
        help: v.help,
        nodes: realNodes.length,
        sample: (realNodes[0]?.html || "").slice(0, 120),
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
          if (/^(none|0)/.test(String(outline).trim()) && !/:focus-visible/.test(sel))
            suppressesOutline = true;
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

findings.sort(
  (a, b) =>
    (IMPACT_ORDER[a.impact] ?? 9) - (IMPACT_ORDER[b.impact] ?? 9) || a.page.localeCompare(b.page),
);

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
lines.push(
  `**${findings.length}** violations — critical ${counts.critical || 0}, serious ${counts.serious || 0}, moderate ${counts.moderate || 0}, minor ${counts.minor || 0}.`,
);
lines.push("");
lines.push(`Muted as cosmetic: \`${[...MUTED_RULES].join("`, `")}\`.`);
lines.push("");

lines.push("## By rule (fix these once, they clear everywhere)");
lines.push("");
if (byRule.size) {
  lines.push("| Impact | Rule | Elements | Pages | What it means |");
  lines.push("| --- | --- | ---: | ---: | --- |");
  for (const r of [...byRule.values()].sort(
    (a, b) =>
      (IMPACT_ORDER[a.impact] ?? 9) - (IMPACT_ORDER[b.impact] ?? 9) || b.totalNodes - a.totalNodes,
  )) {
    lines.push(`| ${r.impact} | \`${r.id}\` | ${r.totalNodes} | ${r.pages.size} | ${r.help} |`);
  }
} else {
  lines.push("_No violations found._");
}
lines.push("");

lines.push(`## Needs a human eye (${manualReview.length})`);
lines.push("");
lines.push("axe flagged these but its verdict is not trustworthy here. Check them");
lines.push("visually once; they are not counted as violations above.");
lines.push("");
if (manualReview.length) {
  lines.push("| Page | Rule | Elements | Why axe is unreliable |");
  lines.push("| --- | --- | ---: | --- |");
  for (const m of manualReview) lines.push(`| ${m.page} | \`${m.id}\` | ${m.nodes} | ${m.why} |`);
} else {
  lines.push("_None._");
}
lines.push("");

lines.push("## Keyboard reachability");
lines.push("");
lines.push("| Page | Focusable elements | Focus visibility | Positive tabindex |");
lines.push("| --- | ---: | --- | ---: |");
for (const k of keyboard) {
  // Suppressing the UA ring is only a defect when nothing replaces it.
  const focusState = k.hasFocusStyle
    ? k.suppressesOutline
      ? "custom (UA ring replaced)"
      : "custom"
    : k.suppressesOutline
      ? "**NONE — focus is invisible**"
      : "browser default";
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
  for (const f of own)
    lines.push(
      `- **${f.impact}** \`${f.id}\` (${f.nodes} element${f.nodes === 1 ? "" : "s"}) — ${f.help}\n  - e.g. \`${f.sample.replace(/`/g, "'")}\``,
    );
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
console.log(
  `  ${findings.length} violations across ${PAGES.length - errors.length} pages · ${byRule.size} distinct rules`,
);
const blindFocus = keyboard.filter((k) => k.suppressesOutline && !k.hasFocusStyle);
if (blindFocus.length)
  console.log(`  ⚠ ${blindFocus.length} page(s) suppress the focus ring without replacing it`);
if (errors.length) console.log(`  ⚠ ${errors.length} page(s) could not be loaded`);

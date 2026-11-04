#!/usr/bin/env node
/* =============================================================================
 * bundle-hub-styles — collapse contiguous runs of the curriculum pages'
 * stylesheet links into one request each, in dist/ only.
 * -----------------------------------------------------------------------------
 * WHY THIS EXISTS
 * /curriculum/ loads 17 stylesheets and /curriculum/units/ 14. The styling grew
 * one file per feature pass (enhancements, sidebar, polish, top1, teacher
 * workflow, guided path, studio journey, navigator, home, resources …), and
 * every one is a separate render-blocking request on a school Chromebook. The
 * scripts on the same page were collapsed for exactly this reason
 * (tools/bundle-hub-scripts.mjs); this is the stylesheet half.
 *
 * WHY dist/ ONLY
 * Source keeps its individual <link> tags, so `npm run dev` and the content-hash
 * stamps that tools/curriculum-hub-assets.test.mjs enforces are unchanged, and
 * there is no generated artifact in the repo that can go stale.
 *
 * WHY CONTIGUOUS RUNS AND NOT "ALL THE STYLESHEETS"
 * The cascade is order-dependent. Between the link runs on these pages sit
 * inline <style> blocks and other tags; merging across them would reorder the
 * sheets relative to those blocks and silently change which rule wins a
 * specificity tie. A run is only merged when nothing but whitespace separates
 * its tags, so the concatenation occupies exactly the position of the run.
 *
 * WHAT IS DELIBERATELY EXCLUDED
 *   - A sheet that starts with @import unless the import can be INLINED
 *     (curriculum-system.css imports the Fraunces/Hanken font-face sheet, which
 *     has only absolute url() values, so its text replaces the @import and the
 *     serial two-request chain disappears). @import is only valid at the top of
 *     a stylesheet; concatenated mid-file it would be ignored and the fonts it
 *     loads would vanish, so any other @import keeps the sheet separate.
 *   - Sheets outside /assets/ root with a url() resolved relative to the sheet
 *     (/assets/fonts/…). A bundle is written to /assets/, so only a subdirectory
 *     sheet whose url() values are all absolute may join one
 *     (/assets/ewl/*.css, /assets/my-progress/*.css qualify).
 *   - Sheets with media= or non-stylesheet rel. Only plain <link rel="stylesheet">.
 *
 * Runs after `vite build` and tools/bundle-hub-scripts.mjs, before
 * tools/stamp-build.mjs, which leaves `/assets/curriculum-hub*` names alone.
 * Idempotent; safe to run on an already-bundled dist.
 * ========================================================================== */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const PAGES = ["curriculum/index.html", "curriculum/units/index.html"];
const MARK = "curriculum-hub.styles.";

const LINK_RE =
  /<link\b(?=[^>]*\brel="stylesheet")(?![^>]*\bmedia=)[^>]*\bhref="(\/assets\/(?:[^"/?]+\/)*[^"/?]+\.css)(?:\?[^"]*)?"[^>]*\/?>/g;

const IMPORT_RE = /^\s*@import\s+url\(\s*["']?(\/assets\/[^"')?]+\.css)["']?\s*\)\s*;\s*/;

/** True when every url() in the sheet is absolute, so it resolves the same
 * wherever the sheet's text is placed. */
function urlsAreAbsolute(css) {
  return [...css.matchAll(/url\(\s*["']?([^"')]+)/g)].every(([, u]) =>
    /^(\/|https?:|data:|#)/.test(u),
  );
}

/**
 * The sheet's text as it will be bundled, or null when it must stay its own
 * request. A leading `@import url("/assets/….css")` is inlined (it is the same
 * rules, one request instead of a serial chain), provided the imported sheet
 * has only absolute url() values and no imports of its own.
 */
function bundledText(href, distPath) {
  if (!existsSync(distPath)) return null;
  let css = readFileSync(distPath, "utf8");
  const lead = css.match(/^(\s*(?:\/\*[\s\S]*?\*\/\s*)*)/)[1];
  const rest = css.slice(lead.length);
  const imp = rest.match(IMPORT_RE);
  if (imp) {
    const target = join(DIST, imp[1].replace(/^\//, ""));
    if (!existsSync(target)) return null;
    const imported = readFileSync(target, "utf8");
    if (/@import\b|@charset\b/.test(imported) || !urlsAreAbsolute(imported)) return null;
    css = `${lead}/* ===== inlined @import ${imp[1]} ===== */\n${imported}\n${rest.slice(imp[0].length)}`;
  }
  if (/^\s*(\/\*[\s\S]*?\*\/\s*)*@(import|charset)\b/.test(css.slice(0, 400))) return null;
  if (/^\/assets\/[^/]+\.css$/.test(href)) return css;
  // A sheet in a subdirectory (/assets/ewl/…, /assets/my-progress/…) may only
  // join a bundle written to /assets/ when none of its url() values is resolved
  // relative to its own location.
  return urlsAreAbsolute(css) ? css : null;
}

function bundlePage(rel) {
  const pagePath = join(DIST, rel);
  if (!existsSync(pagePath)) {
    console.log(`bundle-hub-styles: no ${rel} in dist — skipped.`);
    return;
  }
  let html = readFileSync(pagePath, "utf8");
  if (html.includes(MARK)) {
    console.log(`bundle-hub-styles: ${rel} already bundled — nothing to do.`);
    return;
  }

  const tags = [...html.matchAll(LINK_RE)]
    .map((m) => ({
      text: m[0],
      href: m[1],
      index: m.index,
      css: bundledText(m[1], join(DIST, m[1].replace(/^\//, ""))),
    }))
    .filter((t) => t.css !== null);

  // Group into runs separated by whitespace only.
  const runs = [];
  for (const tag of tags) {
    const current = runs[runs.length - 1];
    if (current) {
      const prev = current[current.length - 1];
      const gap = html.slice(prev.index + prev.text.length, tag.index);
      if (/^\s*$/.test(gap)) {
        current.push(tag);
        continue;
      }
    }
    runs.push([tag]);
  }

  let merged = 0;
  let removed = 0;
  // Replace from the end so earlier indices stay valid.
  for (const run of runs.reverse()) {
    if (run.length < 2) continue;
    const parts = run.map((t) => `/* ===== ${t.href} ===== */\n${t.css}`);
    const css = parts.join("\n");
    const hash = createHash("sha256").update(css).digest("hex").slice(0, 10);
    const name = `${MARK}${hash}.css`;
    writeFileSync(join(DIST, "assets", name), css);
    const first = run[0];
    const last = run[run.length - 1];
    const replacement = `<link rel="stylesheet" href="/assets/${name}" />`;
    html = html.slice(0, first.index) + replacement + html.slice(last.index + last.text.length);
    merged += 1;
    removed += run.length - 1;
  }
  writeFileSync(pagePath, html);
  console.log(
    `bundle-hub-styles: ${rel} — ${tags.length} sheets, ${merged} bundle(s) written, ${removed} fewer requests.`,
  );
}

for (const rel of PAGES) bundlePage(rel);

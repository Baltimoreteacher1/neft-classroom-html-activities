#!/usr/bin/env node
/* =============================================================================
 * validate-css-integrity.mjs — malformed style must not reach a browser, which
 * will "recover" from it silently and tell nobody.
 *
 * THREE FAILURE CLASSES, ALL OBSERVED IN THIS REPO:
 *
 * 1. CONFLICT MARKERS. `assets/small-group-designsystem.css` shipped to
 *    production carrying `<<<<<<< HEAD`, `|||||||` and `=======` with no
 *    closing marker. CSS error recovery swallowed them: the browser parsed 131
 *    rules where the file declared 143, and the twelve it dropped included a
 *    layout fix whose own comment described the defect it was written to fix.
 *    Nothing failed. No console error. It was found by counting cssRules.
 *
 * 2. UNPARSEABLE CSS. Same mechanism, different cause — an unbalanced brace or
 *    a stray token discards every rule until the parser finds its footing.
 *    Counting the rules a real parser produces is the only cheap way to see it.
 *
 * 3. A STYLE BLOCK THAT NEVER INJECTS. Several interactive components ship
 *    their CSS inside a JS template literal. A stray backtick inside a COMMENT
 *    in one of those terminates the literal early: the file still parses, so
 *    `validate:js-syntax` passes, and the component then throws at runtime
 *    where its caller swallows the error and renders unstyled. That happened
 *    while writing this pass — the long-division lab lost every style and the
 *    page looked merely "plain".
 *
 * No new dependency: the parse check uses the browser-grade CSS parser already
 * in node_modules via jsdom, and the injector check runs the real module.
 * ========================================================================== */

import { readFileSync } from "node:fs";
import { glob } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const fail = (m) => errors.push(m);

/* Conflict markers are only markers at the START of a line and followed by a
 * space or end-of-line. `=======` also underlines headings in Markdown and
 * appears in ASCII rules inside comments, so it counts ONLY when one of the
 * unambiguous markers is present in the same file. */
const OPEN = /^<{7}(?: |$)/m;
const BASE = /^\|{7}(?: |$)/m;
const CLOSE = /^>{7}(?: |$)/m;
const MID = /^={7}$/m;

async function filesMatching(patterns) {
  const out = [];
  for (const pattern of patterns) {
    for await (const f of glob(pattern, { cwd: ROOT })) out.push(f);
  }
  return out.filter(
    (f) => !f.includes("node_modules") && !f.startsWith("dist/") && !f.includes(".qa-logs"),
  );
}

async function main() {
  /* -- 1. conflict markers, across every shipped source asset -------------- */
  const sourceFiles = await filesMatching([
    "assets/**/*.{css,js,mjs}",
    "engine/**/*.{css,js,mjs}",
    "shared/**/*.{css,js,mjs}",
    "curriculum/**/*.{css,js}",
    "teacher-tools/**/*.{css,js}",
    "scripts/**/*.mjs",
    "functions/**/*.js",
  ]);
  let scanned = 0;
  for (const rel of sourceFiles) {
    const src = readFileSync(join(ROOT, rel), "utf8");
    scanned++;
    const hasUnambiguous = OPEN.test(src) || BASE.test(src) || CLOSE.test(src);
    if (hasUnambiguous) {
      fail(
        `${rel}: contains merge-conflict markers — a browser will silently discard rules around them`,
      );
    } else if (MID.test(src) && /^[<|>]{7}/m.test(src)) {
      fail(`${rel}: contains a bare '=======' conflict separator`);
    }
  }

  /* -- 2. the critical stylesheets parse, and parse COMPLETELY -------------
   * Rule count is the assertion, not "did it throw": a browser never throws.
   * The floor is deliberately loose — this catches a file losing a third of
   * itself, not a file losing one rule to an edit. */
  const CRITICAL = [
    ["assets/small-group-designsystem.css", 100],
    ["assets/small-group-innovation.css", 80],
    ["assets/small-group-storyboard.css", 40],
    ["assets/small-group-annotation.css", 20],
    ["assets/learning-supports/learning-supports.css", 200],
    ["curriculum/student-supports/student-supports.css", 30],
    ["teacher-tools/support-audit/support-audit.css", 20],
    ["engine/styles/design-system.css", 400],
  ];
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  for (const [rel, floor] of CRITICAL) {
    const src = readFileSync(join(ROOT, rel), "utf8");
    const style = dom.window.document.createElement("style");
    style.textContent = src;
    dom.window.document.head.appendChild(style);
    let count = 0;
    try {
      count = style.sheet.cssRules.length;
    } catch (e) {
      fail(`${rel}: could not be parsed at all (${String(e).slice(0, 80)})`);
      continue;
    }
    // Top-level `{` blocks the author wrote, as a rough expectation.
    const authored = (src.match(/^[^\n@}][^\n{]*\{/gm) || []).length;
    if (count < floor) {
      fail(
        `${rel}: parser produced only ${count} rules (expected at least ${floor}) — the file is losing rules`,
      );
    } else if (authored > 20 && count < authored * 0.7) {
      fail(
        `${rel}: parser produced ${count} rules from roughly ${authored} authored blocks — ` +
          "a browser is discarding a large share of this file",
      );
    }
    style.remove();
  }

  /* -- 3. every component that injects a <style> actually injects it ------- */
  const INJECTORS = [
    ["engine/components/tool-tokens.js", "injectToolTokens", "ewl-tool-tokens", ".tool-btn"],
    ["engine/components/long-division-chrome.js", "injectStyles", "ldl-styles", ".ldl-key"],
  ];
  for (const [rel, fn, id, mustContain] of INJECTORS) {
    const w = new JSDOM("<!doctype html><html><head></head><body></body></html>").window;
    const prevDoc = globalThis.document;
    const prevWin = globalThis.window;
    globalThis.document = w.document;
    globalThis.window = w;
    try {
      const mod = await import(`${join(ROOT, rel)}?t=${Date.now()}`);
      if (typeof mod[fn] !== "function") {
        fail(`${rel}: exports no ${fn}()`);
        continue;
      }
      mod[fn]();
      const el = w.document.getElementById(id);
      if (!el) {
        fail(
          `${rel}: ${fn}() ran but injected no <style id="${id}"> — the component renders unstyled and ` +
            "nothing else in the build can see it",
        );
      } else if (!el.textContent.includes(mustContain)) {
        fail(`${rel}: injected stylesheet is missing "${mustContain}" — the block was cut short`);
      } else {
        const style = w.document.createElement("style");
        style.textContent = el.textContent;
        w.document.head.appendChild(style);
        if (!style.sheet || style.sheet.cssRules.length < 5) {
          fail(`${rel}: injected stylesheet parses to ${style.sheet?.cssRules.length ?? 0} rules`);
        }
      }
    } catch (e) {
      fail(`${rel}: ${fn}() threw — ${String(e).slice(0, 140)}`);
    } finally {
      globalThis.document = prevDoc;
      globalThis.window = prevWin;
    }
  }

  /* -- 4. the shared tool vocabulary stays shared --------------------------
   * Source-level greps, and honest about it: these prove the decorative
   * treatments are not back in the file, not that the rendered page is calm.
   * The browser-level evidence for that is sweep:small-group and the component
   * audit. What a grep IS good for is the reintroduction case — someone adding
   * "just one" gradient button to a tool six months from now. */
  const TOOL_SHEETS = [
    ["engine/components/long-division-chrome.js", "the long-division lab"],
    ["engine/components/tool-tokens.js", "the shared tool tokens"],
  ];
  for (const [rel, what] of TOOL_SHEETS) {
    const src = readFileSync(join(ROOT, rel), "utf8");
    if (/linear-gradient|radial-gradient/.test(src)) {
      fail(
        `${rel}: ${what} declares a gradient again. Gradients here were 160 fills of pure ` +
          "decoration; if this one encodes a quantity, add it to the allow-list with the reason.",
      );
    }
    /* HOVER lift only. `translateY` inside a @keyframes is how the lab shows a
     * digit being brought down — mathematically meaningful motion, already
     * guarded by prefers-reduced-motion, and deliberately kept. */
    for (const m of src.matchAll(/:hover[^{]*\{([^}]*)\}/g)) {
      if (/transform:\s*translate/.test(m[1])) {
        fail(
          `${rel}: ${what} moves a control on hover again — hover is carried by border and fill`,
        );
      }
    }
    if (/animation:[^;]*infinite/.test(src)) {
      fail(`${rel}: ${what} runs an infinite animation again`);
    }
    // Every standalone control in a tool clears the 44px floor.
    for (const m of src.matchAll(/(?:min-height|height):\s*(\d+)px/g)) {
      const px = Number(m[1]);
      if (px >= 24 && px < 44 && /--tool-control-h|\.ldl-key|\.ldl-mode|\.ldl-chip/.test(src)) {
        // Only flag declarations on the control classes themselves.
        const near = src.slice(Math.max(0, m.index - 160), m.index);
        if (
          /\.(ldl-key|ldl-mode|ldl-chip|ldl-go|ldl-check|tool-btn|tool-chip)[^{]*\{[^}]*$/.test(
            near,
          )
        ) {
          fail(`${rel}: a control is ${px}px tall; the interaction floor is 44px`);
        }
      }
    }
  }

  /* -- self-test: prove each detector fires -------------------------------- */
  const selfTests = [
    ["open marker", () => OPEN.test("<<<<<<< HEAD\n")],
    ["base marker", () => BASE.test("||||||| 540ecb4e3\n")],
    ["close marker", () => CLOSE.test(">>>>>>> feature\n")],
    ["separator", () => MID.test("=======\n")],
    // A Markdown setext heading underline must NOT be read as a conflict.
    ["setext heading is not a conflict", () => !OPEN.test("Title\n=======\n")],
    // An ASCII comment rule must not trip the open marker.
    ["comment rule is not a conflict", () => !OPEN.test("/* ==== section ==== */\n")],
    [
      "a truncated style block is detectable",
      () => {
        const w = new JSDOM("<!doctype html>").window;
        const s = w.document.createElement("style");
        s.textContent = ".a{color:red}";
        w.document.head.appendChild(s);
        return s.sheet.cssRules.length === 1;
      },
    ],
  ];
  for (const [name, fn] of selfTests) {
    let ok = false;
    try {
      ok = !!fn();
    } catch {
      ok = false;
    }
    if (!ok) fail(`Self-test failed: ${name} — this gate is no longer checking what it claims`);
  }

  if (errors.length) {
    console.error(`FAIL validate:css-integrity — ${errors.length} problem(s):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(
    `PASS validate:css-integrity — ${scanned} source files scanned for conflict markers, ` +
      `${CRITICAL.length} stylesheets parsed completely, ${INJECTORS.length} style injectors verified, ` +
      `${TOOL_SHEETS.length} tool sheets free of decorative chrome.`,
  );
}

await main();

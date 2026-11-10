#!/usr/bin/env node
/**
 * Captures the two annotated screenshots the Site Guide ("Find Your Way Around") shows, from the real interface:
 *   access-practice-lab/pictures/guide/site-header.png   the top of a page, five numbered marks
 *   access-practice-lab/pictures/guide/more-menu.png     the open More menu, three numbered marks
 * The marks are drawn into the live page just before the screenshot; nothing in the lab itself changes.
 * Each PNG must stay at or under 150 KB. Run: node tools/access-intro-site-guide-shots.mjs
 */
import { mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { serveAccess } from "./lib/access-serve.mjs";

const { chromium } = await import("playwright");
const OUT = join(REPO_ROOT, "access-practice-lab/pictures/guide");
mkdirSync(OUT, { recursive: true });
const LIMIT = 150 * 1024;

/** Draws a numbered mark and an outline for each [number, selectorFn] pair; returns false when a target is missing. */
async function annotate(page, marks, beside = false) {
  return page.evaluate(
    ([marks, beside]) => {
      const find = {
        brand: () => document.querySelector(".lab-brand"),
        search: () => document.querySelector(".lab-search-btn"),
        comfort: () => document.querySelector(".lab-comfort-btn"),
        more: () =>
          [...document.querySelectorAll("summary")].find((b) => b.textContent.trim() === "More"),
        lang: () =>
          [...document.querySelectorAll("button")].find((b) => b.textContent.trim() === "EN+ES")
            ?.parentElement,
        menuSearch: () =>
          document.querySelector("[role=menu] input, .lab-menu input, input[type=search]"),
        practice: () =>
          [...document.querySelectorAll("*")].find(
            (e) => e.children.length === 0 && e.textContent.trim() === "Practice by skill",
          ),
        plan: () =>
          [...document.querySelectorAll("*")].find(
            (e) => e.children.length === 0 && e.textContent.trim() === "Plan and review",
          ),
      };
      for (const [n, key] of marks) {
        const el = find[key]();
        if (!el) return `missing ${key}`;
        const r = el.getBoundingClientRect();
        const box = Object.assign(document.createElement("div"), { className: "sg-shot-mark" });
        Object.assign(box.style, {
          position: "fixed",
          left: `${r.left - 4}px`,
          top: `${r.top - 4}px`,
          width: `${r.width + 8}px`,
          height: `${r.height + 8}px`,
          border: "3px solid #b0261c",
          borderRadius: "10px",
          zIndex: 99999,
          pointerEvents: "none",
        });
        const dot = Object.assign(document.createElement("div"), { textContent: String(n) });
        Object.assign(dot.style, {
          position: "fixed",
          left: `${r.left - (beside ? 36 : 14)}px`,
          top: `${beside ? r.top + r.height / 2 - 13 : r.top - 14}px`,
          width: "26px",
          height: "26px",
          borderRadius: "50%",
          background: "#b0261c",
          color: "#fff",
          font: "800 15px/26px sans-serif",
          textAlign: "center",
          zIndex: 100000,
          pointerEvents: "none",
          boxShadow: "0 0 0 2px #fff",
        });
        document.body.append(box, dot);
      }
      return "";
    },
    [marks, beside],
  );
}

const { server, base } = await serveAccess();
let failed = false;
try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 820, height: 900 } });
  const open = async () => {
    await page.goto(`${base}/access-practice-lab/?grades=6-8`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
  };

  await open();
  let miss = await annotate(page, [
    [1, "brand"],
    [2, "search"],
    [3, "comfort"],
    [4, "more"],
    [5, "lang"],
  ]);
  if (miss) throw new Error(miss);
  await page.screenshot({
    path: join(OUT, "site-header.png"),
    clip: { x: 0, y: 0, width: 820, height: 128 },
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await open();
  await page.getByText("More", { exact: true }).first().click();
  await page.waitForTimeout(500);
  miss = await annotate(
    page,
    [
      [1, "menuSearch"],
      [2, "practice"],
      [3, "plan"],
    ],
    true,
  );
  if (miss) throw new Error(miss);
  await page.screenshot({
    path: join(OUT, "more-menu.png"),
    clip: { x: 490, y: 130, width: 760, height: 650 },
  });
  await browser.close();

  for (const f of ["site-header.png", "more-menu.png"]) {
    const size = statSync(join(OUT, f)).size;
    const ok = size <= LIMIT;
    failed ||= !ok;
    console.log(`${ok ? "ok  " : "FAIL"} ${f} ${(size / 1024).toFixed(0)} KB`);
  }
} catch (error) {
  failed = true;
  console.error(`access-intro-site-guide-shots: ${error.message}`);
} finally {
  server.close();
}
process.exit(failed ? 1 : 0);

#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
// Clean-context evidence collector. Counts describe visible launch screens only.
import { chromium } from "@playwright/test";
import { listLessonDirs } from "./lib/curriculum-source.mjs";

const base = process.env.PROBE_BASE_URL || "https://eduwonderlab.com";
const out = process.env.PROBE_OUTPUT;
if (!out) throw new Error("PROBE_OUTPUT must name an external evidence directory");
const relativeOutput = path.relative(process.cwd(), path.resolve(out));
if (!relativeOutput.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeOutput)) {
  throw new Error("PROBE_OUTPUT must be outside the repository");
}
await mkdir(out, { recursive: true });
const dirs = listLessonDirs();
const routes = [
  ...Array.from({ length: 10 }, (_, i) => `/lessons/${i + 1}-1/`),
  "/lessons/2-3/",
  ...["group1", "group2", "catchup"].map(
    (kind) => `/lessons/${dirs.filter((d) => d.endsWith(`-${kind}`)).sort()[0]}/`,
  ),
  "/math/unit-10/projects/world-architect/",
  "/curriculum/",
  "/curriculum/units/",
];
const browser = await chromium.launch();
const results = [];
try {
  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ])
    for (const route of process.env.PROBE_ROUTES ? process.env.PROBE_ROUTES.split(",") : routes) {
      const context = await browser.newContext({ viewport, serviceWorkers: "block" });
      const page = await context.newPage();
      const errors = [],
        failedRequests = [],
        responses = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      page.on("requestfailed", (r) =>
        failedRequests.push({ url: r.url(), error: r.failure()?.errorText }),
      );
      page.on("response", (r) => {
        if (r.status() >= 400) responses.push({ url: r.url(), status: r.status() });
      });
      await page.addInitScript(() => {
        window.__probe = { lcp: null, longTasks: [] };
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) window.__probe.lcp = e.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries())
            window.__probe.longTasks.push({ start: e.startTime, duration: e.duration });
        }).observe({ type: "longtask", buffered: true });
      });
      const record = {
        url: new URL(route, base).href,
        viewport,
        errors,
        failedRequests,
        responses,
      };
      try {
        record.status = (
          await page.goto(record.url, { waitUntil: "load", timeout: 45000 })
        )?.status();
        await page.waitForTimeout(2500);
        record.metrics = await page.evaluate(() => {
          const visible = (e) => {
            const r = e.getBoundingClientRect(),
              s = getComputedStyle(e);
            return (
              r.width > 0 &&
              r.height > 0 &&
              e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) &&
              r.right > 0 &&
              r.left < innerWidth &&
              r.bottom > 0 &&
              r.top < innerHeight &&
              s.visibility !== "hidden" &&
              s.display !== "none"
            );
          };
          const describe = (e) => ({
            tag: e.tagName,
            id: e.id,
            text: (e.innerText || e.getAttribute("aria-label") || "").slice(0, 120),
            rect: JSON.parse(JSON.stringify(e.getBoundingClientRect())),
          });
          const all = [...document.querySelectorAll("body *")].filter(visible);
          const controls = all.filter((e) =>
            e.matches('a[href],button,input,select,textarea,[role="button"]'),
          );
          const fixed = all.filter((e) => getComputedStyle(e).position === "fixed");
          const overlapCandidates = [];
          for (const f of fixed)
            for (const c of controls) {
              if (f.contains(c) || c.contains(f)) continue;
              const a = f.getBoundingClientRect(),
                b = c.getBoundingClientRect();
              if (a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)
                overlapCandidates.push({ fixed: describe(f), control: describe(c) });
            }
          const nav = performance.getEntriesByType("navigation")[0];
          return {
            title: document.title,
            robots: document.querySelector('meta[name="robots"]')?.content,
            main: document.querySelectorAll('main,[role="main"]').length,
            h1: [...document.querySelectorAll("h1")].map((e) => e.textContent),
            headings: all.filter((e) => /^H[1-6]$/.test(e.tagName)).map(describe),
            skipLinks: [...document.querySelectorAll('a[href^="#"]')]
              .filter((e) => /skip/i.test(e.textContent))
              .map(describe),
            fixed: fixed.map(describe),
            overlapCandidates,
            smallTargets: controls
              .filter((e) => {
                const r = e.getBoundingClientRect();
                return r.width < 44 || r.height < 44;
              })
              .map(describe),
            smallText: all
              .filter(
                (e) =>
                  [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) &&
                  parseFloat(getComputedStyle(e).fontSize) < 14,
              )
              .map(describe),
            overflow: document.documentElement.scrollWidth > innerWidth,
            lcp: window.__probe.lcp,
            blockingTimeObservationMs: window.__probe.longTasks.reduce(
              (n, e) => n + Math.max(0, e.duration - 50),
              0,
            ),
            requestCount: performance.getEntriesByType("resource").length,
            htmlTransferBytes: nav?.transferSize,
            bodyExcerpt: document.body.innerText.slice(0, 5000),
          };
        });
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze();
        record.axe = { violations: axe.violations, incomplete: axe.incomplete };
        record.focus = [];
        for (let i = 0; i < 8; i++) {
          await page.keyboard.press("Tab");
          record.focus.push(
            await page.evaluate(() => ({
              tag: document.activeElement.tagName,
              id: document.activeElement.id,
              text: (document.activeElement.textContent || "").slice(0, 80),
            })),
          );
        }
        record.screenshot = path.join(out, `${route.replaceAll("/", "_")}-${viewport.width}.png`);
        await page.screenshot({ path: record.screenshot, fullPage: true });
      } catch (e) {
        record.error = e.message;
      }
      results.push(record);
      await writeFile(
        path.join(out, "probe.json"),
        JSON.stringify(
          {
            base,
            at: new Date().toISOString(),
            method:
              "Unthrottled clean Chromium; launch-screen measurements; blocking time over fixed observation window is not Lighthouse TBT; axe incomplete needs manual review.",
            results,
          },
          null,
          2,
        ),
      );
      console.log(
        JSON.stringify({
          url: record.url,
          width: viewport.width,
          status: record.status,
          error: record.error,
          lcp: record.metrics?.lcp,
          axe: record.axe?.violations.length,
        }),
      );
      await context.close();
    }
} finally {
  await browser.close();
}
if (results.some((r) => r.error || r.status !== 200)) process.exitCode = 1;

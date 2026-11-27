#!/usr/bin/env node
// Lighthouse runner for The Language Page. Lighthouse is not a repository dependency (the repo is shared with
// eduwonderlab.com and this is the only consumer), so it is resolved from LIGHTHOUSE_DIR (a folder where
// `npm i lighthouse@12` was run) or from node_modules. Without it this exits 3 (SKIP), which CI treats as FAIL.
//
//   LIGHTHOUSE_DIR=/path CHROME_PATH=/opt/pw-browsers/chromium node tools/lp/lighthouse-run.mjs \
//      --base https://thelanguagepage.com --paths /,/practice/ --out docs/audit/lighthouse-after.json
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const args = process.argv.slice(2);
const opt = (n, d) => (args.includes(n) ? args[args.indexOf(n) + 1] : d);
const BASE = opt("--base", "https://thelanguagepage.com").replace(/\/$/, "");
const PATHS = opt("--paths", "/").split(",");
const OUT = opt("--out", null);
const FORMS = opt("--forms", "mobile,desktop").split(",");

async function load() {
  const candidates = [
    process.env.LIGHTHOUSE_DIR && path.join(process.env.LIGHTHOUSE_DIR, "node_modules"),
    path.resolve("node_modules"),
  ].filter(Boolean);
  for (const dir of candidates) {
    const lh = path.join(dir, "lighthouse", "core", "index.js");
    const cl = path.join(dir, "chrome-launcher", "dist", "index.js");
    if (fs.existsSync(lh) && fs.existsSync(cl))
      return {
        lighthouse: (await import(pathToFileURL(lh))).default,
        launcher: await import(pathToFileURL(cl)),
      };
  }
  return null;
}

export async function runLighthouse({ base = BASE, paths = PATHS, forms = FORMS } = {}) {
  const mods = await load();
  if (!mods)
    return { skip: "lighthouse not installed (set LIGHTHOUSE_DIR to a folder with lighthouse@12)" };
  const chrome = await mods.launcher.launch({
    chromePath:
      process.env.CHROME_PATH || process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium",
    chromeFlags: ["--headless=new", "--no-sandbox", "--disable-gpu"],
  });
  const results = [];
  try {
    for (const p of paths) {
      for (const form of forms) {
        const flags = {
          port: chrome.port,
          output: "json",
          logLevel: "error",
          onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
          formFactor: form,
          screenEmulation:
            form === "desktop"
              ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
              : { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false },
          throttlingMethod: "simulate",
          ...(form === "desktop"
            ? {
                throttling: {
                  rttMs: 40,
                  throughputKbps: 10240,
                  cpuSlowdownMultiplier: 1,
                  requestLatencyMs: 0,
                  downloadThroughputKbps: 0,
                  uploadThroughputKbps: 0,
                },
              }
            : {}),
        };
        const url = `${base}${p}`;
        let row;
        try {
          let r = await mods.lighthouse(url, flags);
          // A run that produced no performance score failed to measure (Lighthouse records why in runtimeError or as a
          // null category). Measure once more; a second null is reported as it is, so the budget still fails.
          if (r.lhr.categories.performance?.score == null) {
            console.log(
              `RETRY ${form.padEnd(7)} ${p}: no performance score (${r.lhr.runtimeError?.code || "null category"})`,
            );
            r = await mods.lighthouse(url, flags);
          }
          const c = r.lhr.categories;
          const score = (k) => (c[k]?.score == null ? null : Math.round(c[k].score * 100));
          row = {
            url,
            path: p,
            form,
            performance: score("performance"),
            accessibility: score("accessibility"),
            bestPractices: score("best-practices"),
            seo: score("seo"),
            lcpMs: Math.round(r.lhr.audits["largest-contentful-paint"]?.numericValue || 0),
            cls: Number((r.lhr.audits["cumulative-layout-shift"]?.numericValue || 0).toFixed(3)),
            tbtMs: Math.round(r.lhr.audits["total-blocking-time"]?.numericValue || 0),
            bytes: Math.round(r.lhr.audits["total-byte-weight"]?.numericValue || 0),
            failing: Object.values(r.lhr.audits)
              .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode === "binary")
              .map((a) => a.id)
              .slice(0, 12),
          };
        } catch (e) {
          row = { url, path: p, form, error: e.message.slice(0, 200) };
        }
        results.push(row);
        console.log(
          row.error
            ? `ERR  ${form.padEnd(7)} ${p}: ${row.error}`
            : `${form.padEnd(7)} P${row.performance} A${row.accessibility} BP${row.bestPractices} SEO${row.seo} LCP ${row.lcpMs}ms ${Math.round(row.bytes / 1024)}KB  ${p}`,
        );
      }
    }
  } finally {
    await chrome.kill();
  }
  return { results };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const out = await runLighthouse();
  if (out.skip) {
    console.log(`SKIP ${out.skip}`);
    process.exit(3);
  }
  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(
      OUT,
      `${JSON.stringify({ generatedAt: new Date().toISOString(), base: BASE, results: out.results }, null, 1)}\n`,
    );
  }
}

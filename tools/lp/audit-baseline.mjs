#!/usr/bin/env node
import crypto from "node:crypto";
// Baseline audit of the live Language Page (thelanguagepage.com) before the front-layer rebuild.
// Renders every sitemap page in Chromium (the lab is a client-rendered app, so a raw HTML crawl sees almost no
// links), collects anchors, requests and console errors, runs axe on a representative sample, then status-checks
// every internal URL it found without following redirects blindly (each hop is recorded).
//
//   PW_CHROMIUM_PATH=/opt/pw-browsers/chromium node tools/lp/audit-baseline.mjs [--base https://thelanguagepage.com]
//
// Writes docs/audit/url-inventory.json (the URL-preservation contract) and docs/audit/baseline-raw.json.
import fs from "node:fs";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const BASE = (
  args.includes("--base") ? args[args.indexOf("--base") + 1] : "https://thelanguagepage.com"
).replace(/\/$/, "");
const HOST = new URL(BASE).hostname;
const AXE_SOURCE = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const AXE_SAMPLE = new Set([
  "/access-practice-lab/",
  "/access-practice-lab/learn",
  "/access-practice-lab/speak",
  "/wida-access/reading/",
  "/bcpss-teachers",
  "/access-practice-lab/privacy",
]);

const now = new Date().toISOString();
const sitemapXml = await (await fetch(`${BASE}/sitemap.xml`)).text();
const sitemap = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const seeds = ["/", ...sitemap];

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

const pages = [];
const discovered = new Map(); // internal path -> Set(of pages linking to it)
const external = new Map(); // external url -> Set(of pages)
const assetStatus = new Map(); // same-origin asset url -> status
const thirdParty = new Map(); // host -> Set(of resource urls)

const norm = (href, from) => {
  try {
    const u = new URL(href, from);
    if (!/^https?:$/.test(u.protocol)) return null;
    u.hash = "";
    return u;
  } catch {
    return null;
  }
};

async function render(path) {
  const page = await ctx.newPage();
  const consoleErrors = [];
  const requests = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 300)));
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${String(e.message).slice(0, 300)}`));
  page.on("response", (r) => {
    const u = new URL(r.url());
    requests.push(r.url());
    if (u.hostname === HOST) {
      if (r.request().resourceType() !== "document")
        assetStatus.set(`${u.pathname}${u.search}`, r.status());
    } else if (!/^(data|blob):/.test(r.url())) {
      if (!thirdParty.has(u.hostname)) thirdParty.set(u.hostname, new Set());
      thirdParty.get(u.hostname).add(`${u.origin}${u.pathname}`);
    }
  });
  const t0 = Date.now();
  let status = 0;
  let finalUrl = "";
  try {
    const resp = await page.goto(`${BASE}${path}`, { waitUntil: "load", timeout: 30000 });
    status = resp?.status() ?? 0;
    finalUrl = page.url();
    await page.waitForTimeout(1500);
  } catch (e) {
    consoleErrors.push(`navigation: ${e.message.slice(0, 200)}`);
  }
  const info = await page
    .evaluate(() => {
      const text = (document.querySelector("main") || document.body)?.innerText || "";
      const fonts = new Set(
        [...document.querySelectorAll("body, h1, h2, p, button, a")]
          .slice(0, 300)
          .map((el) => getComputedStyle(el).fontFamily.split(",")[0].trim().replace(/["']/g, "")),
      );
      return {
        title: document.title,
        h1: [...document.querySelectorAll("h1")].map((h) => h.innerText.trim()).slice(0, 3),
        links: [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")),
        stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
        inlineStyles: document.querySelectorAll("style").length,
        scripts: document.querySelectorAll("script[src]").length,
        fonts: [...fonts],
        textLength: text.length,
        textSample: text.replace(/\s+/g, " ").slice(0, 4000),
        hasMain: Boolean(document.querySelector("main")),
        lang: document.documentElement.lang,
        metaDescription: document.querySelector('meta[name="description"]')?.content || "",
        canonical: document.querySelector('link[rel="canonical"]')?.href || "",
      };
    })
    .catch(() => null);
  let axe = null;
  if (AXE_SAMPLE.has(path)) {
    try {
      await page.addScriptTag({ content: AXE_SOURCE });
      axe = await page.evaluate(async () => {
        const r = await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
        });
        return r.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
        }));
      });
    } catch (e) {
      axe = { error: e.message.slice(0, 200) };
    }
  }
  await page.close();
  const from = finalUrl || `${BASE}${path}`;
  for (const href of info?.links || []) {
    const u = norm(href, from);
    if (!u) continue;
    if (u.hostname === HOST) {
      const key = u.pathname;
      if (!discovered.has(key)) discovered.set(key, new Set());
      discovered.get(key).add(path);
    } else {
      const key = u.toString();
      if (!external.has(key)) external.set(key, new Set());
      external.get(key).add(path);
    }
  }
  return {
    path,
    status,
    finalUrl,
    ms: Date.now() - t0,
    consoleErrors,
    requestCount: requests.length,
    thirdPartyRequests: requests.filter((r) => !r.includes(`//${HOST}`) && !/^(data|blob):/.test(r))
      .length,
    axe,
    ...(info || {}),
    textHash: info
      ? crypto.createHash("sha1").update(info.textSample).digest("hex").slice(0, 12)
      : null,
    links: undefined,
    linkCount: info?.links?.length || 0,
  };
}

// Render with a small worker pool: polite to production.
const queue = [...seeds];
await Promise.all(
  Array.from({ length: 3 }, async () => {
    while (queue.length) {
      const p = queue.shift();
      const r = await render(p);
      pages.push(r);
      process.stdout.write(
        `${r.status} ${p} (${r.linkCount} links, ${r.consoleErrors.length} errors)\n`,
      );
    }
  }),
);
await browser.close();

// Status-check every internal URL (seeds + discovered), hop by hop.
async function chain(url) {
  const hops = [];
  let current = url;
  for (let i = 0; i < 6; i++) {
    let res;
    try {
      res = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(20000) });
    } catch (e) {
      hops.push({ url: current, status: 0, error: e.message.slice(0, 120) });
      break;
    }
    const loc = res.headers.get("location");
    hops.push({ url: current, status: res.status, ...(loc ? { location: loc } : {}) });
    await res.body?.cancel();
    if (res.status >= 300 && res.status < 400 && loc) current = new URL(loc, current).toString();
    else break;
  }
  return hops;
}

const allInternal = [...new Set([...seeds, ...discovered.keys()])].sort();
const inventory = [];
const q2 = [...allInternal];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (q2.length) {
      const p = q2.shift();
      const hops = await chain(`${BASE}${p}`);
      const last = hops.at(-1);
      inventory.push({
        path: p,
        status: hops[0].status,
        finalStatus: last.status,
        finalUrl: last.url,
        redirects: hops.length - 1,
        inSitemap: sitemap.includes(p),
        linkedFrom: discovered.get(p)?.size || 0,
      });
    }
  }),
);
inventory.sort((a, b) => a.path.localeCompare(b.path));

// External links: one GET each (HEAD is refused by many sites), no body read.
const externalList = [...external.keys()].sort();
const externalResults = [];
const q3 = [...externalList];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (q3.length) {
      const u = q3.shift();
      let status = 0;
      let error;
      try {
        const res = await fetch(u, { redirect: "follow", signal: AbortSignal.timeout(20000) });
        status = res.status;
        await res.body?.cancel();
      } catch (e) {
        error = e.message.slice(0, 120);
      }
      externalResults.push({
        url: u,
        status,
        ...(error ? { error } : {}),
        linkedFrom: [...external.get(u)].slice(0, 5),
      });
    }
  }),
);
externalResults.sort((a, b) => a.url.localeCompare(b.url));

const linkedTargets = new Set(discovered.keys());
const orphans = sitemap.filter((p) => !linkedTargets.has(p) && p !== "/");
const dupGroups = Object.values(
  pages.reduce((acc, p) => {
    if (p.textHash && p.textLength > 200) (acc[p.textHash] ||= []).push(p.path);
    return acc;
  }, {}),
).filter((g) => g.length > 1);

fs.mkdirSync("docs/audit", { recursive: true });
fs.writeFileSync(
  "docs/audit/url-inventory.json",
  `${JSON.stringify(
    {
      generatedAt: now,
      base: BASE,
      note: "Every path here must still resolve after the rebuild: 200, or a redirect chain ending in 200 (gate: tools/lp/gates.mjs G-02). Paths whose baseline already failed are recorded with their baseline status and are held to 'no worse than baseline'.",
      urls: inventory.map(({ path, status, finalStatus, redirects, inSitemap }) => ({
        path,
        status,
        finalStatus,
        redirects,
        inSitemap,
      })),
    },
    null,
    1,
  )}\n`,
);
fs.writeFileSync(
  "docs/audit/baseline-raw.json",
  `${JSON.stringify(
    {
      generatedAt: now,
      base: BASE,
      pages: pages
        .sort((a, b) => a.path.localeCompare(b.path))
        .map(({ textSample, ...rest }) => rest),
      inventory,
      external: externalResults,
      assets: [...assetStatus]
        .map(([url, status]) => ({ url, status }))
        .sort((a, b) => a.url.localeCompare(b.url)),
      thirdParty: [...thirdParty].map(([host, urls]) => ({ host, urls: [...urls].slice(0, 10) })),
      orphans,
      duplicateContent: dupGroups,
    },
    null,
    1,
  )}\n`,
);
console.log(
  `\nPages rendered: ${pages.length}; internal URLs: ${inventory.length}; external: ${externalResults.length}; assets: ${assetStatus.size}; third-party hosts: ${thirdParty.size}`,
);

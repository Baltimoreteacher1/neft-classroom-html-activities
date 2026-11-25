#!/usr/bin/env node
/* =============================================================================
 * validate-language-page-network.mjs — what thelanguagepage.com says about its own network traffic is true.
 *
 * WHY THIS EXISTS. The lab's privacy page says "No ads. No third-party analytics or trackers." Measured live on
 * 2026-11-24, all 85 pages asked static.cloudflareinsights.com for a script and posted page timings to /cdn-cgi/rum.
 * Cloudflare injects that beacon at the EDGE, so it was in no file this repo owns: a source grep (the check the claims
 * ledger relied on for C-004) could not see it, and every other gate read source. Only a browser sees what a browser
 * is asked to fetch, so this is a browser gate.
 *
 * THE RULE (Joel, 2026-11-24, data/product-decisions.json "lp-no-third-party-analytics"): the lab host contacts no
 * third-party host unless it is declared in data/language-page-third-parties.json with a purpose, the data sent and
 * how long it is kept, AND the privacy page names it. It also never posts to /cdn-cgi/rum (Cloudflare Web Analytics).
 *
 * MODES
 *   node tools/validate-language-page-network.mjs                    every sitemap route, from the source tree
 *   node tools/validate-language-page-network.mjs --live [BASE]       the same against production (after a ship); the
 *                                                                     only mode that can see an edge-injected beacon
 *
 * A third-party request is recorded as soon as the page ASKS for it and is then aborted, so the gate never sends
 * anything to a tracker. Self-tests run first: a gate that has stopped firing and a clean site print the same line.
 * No Chromium: SKIP (exit 3 locally, 1 in CI). Never a pass.
 * ========================================================================== */
import { readFileSync } from "node:fs";
import http from "node:http";
import { join } from "node:path";
import { SITEMAP_PATHS } from "../functions/_lib/language-page.js";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { serveAccess } from "./lib/access-serve.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const args = process.argv.slice(2);
const live = args.includes("--live");
const liveBase =
  (live &&
    args[args.indexOf("--live") + 1]?.startsWith("http") &&
    args[args.indexOf("--live") + 1]) ||
  "https://thelanguagepage.com";
/** Fewest routes a sweep may measure before it counts as having checked anything. */
const MIN_ROUTES = live ? 60 : 55;

const REGISTRY_PATH = join(REPO_ROOT, "data/language-page-third-parties.json");
const PRIVACY_PATH = join(REPO_ROOT, "access-practice-lab/src/views/privacy.js");

// ----------------------------------------------------------------- pure detectors (self-tested)
/** Hosts a page contacted that are neither its own nor declared. */
export function undeclaredHosts(requestUrls, pageHost, declared) {
  const ok = new Set(declared.map((h) => h.host.toLowerCase()));
  const bad = new Set();
  for (const u of requestUrls) {
    let url;
    try {
      url = new URL(u);
    } catch {
      continue;
    }
    if (!/^https?:$/.test(url.protocol)) continue; // data:, blob:
    const host = url.host.toLowerCase();
    if (host === pageHost.toLowerCase() || ok.has(host)) continue;
    bad.add(host);
  }
  return [...bad].sort();
}

/** Same-origin paths that are telemetry in disguise (the edge beacon posts to /cdn-cgi/rum). */
export function forbiddenPathHits(requestUrls, forbidden) {
  return requestUrls.filter((u) => {
    try {
      const p = new URL(u).pathname;
      return forbidden.some((f) => p === f || p.startsWith(`${f}/`));
    } catch {
      return false;
    }
  });
}

/** A declared host must carry the three fields the privacy page repeats, and the page must name it. */
export function registryComplaints(registry, privacySource) {
  const out = [];
  const hosts = registry.hosts;
  if (!Array.isArray(hosts)) return ["registry has no hosts array"];
  for (const h of hosts) {
    for (const f of ["host", "purpose", "dataSent", "retention"])
      if (!h || typeof h[f] !== "string" || !h[f].trim())
        out.push(`${h?.host || "(no host)"}: missing ${f}`);
    if (h?.host && !privacySource.includes(h.host))
      out.push(`${h.host}: declared, but the privacy page does not name it`);
  }
  // The page may not still say "none" while something is declared.
  if (hosts.length > 0 && /No (ads\. No )?third-party analytics/i.test(privacySource))
    out.push("the privacy page says there are no third-party analytics while hosts are declared");
  return out;
}

// ----------------------------------------------------------------- browser sweep
async function sweep(browser, base, paths, declared, forbidden) {
  const results = [];
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const pageHost = new URL(base).host;
  for (const path of paths) {
    const page = await ctx.newPage();
    const seen = [];
    page.on("request", (r) => seen.push(r.url()));
    // Never send anything to a third party: record it (above), then refuse it.
    await page.route("**/*", (route) => {
      const u = new URL(route.request().url());
      if (u.host === pageHost || !/^https?:$/.test(u.protocol)) return route.continue();
      return route.abort();
    });
    let status = 0;
    try {
      const res = await page.goto(base + path, { waitUntil: "networkidle", timeout: 45000 });
      status = res?.status() ?? 0;
      await page.waitForTimeout(live ? 1200 : 300);
    } catch (e) {
      results.push({ path, status: 0, error: String(e).slice(0, 120), hosts: [], hits: [] });
      await page.close();
      continue;
    }
    results.push({
      path,
      status,
      hosts: undeclaredHosts(seen, pageHost, declared),
      hits: forbiddenPathHits(seen, forbidden),
    });
    await page.close();
  }
  await ctx.close();
  return results;
}

function fixtureServer(withTracker) {
  const srv = http.createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(
      withTracker
        ? `<!doctype html><title>t</title><script src="https://static.tracker.example/beacon.js"></script><script>fetch('/cdn-cgi/rum',{method:'POST',body:'{}'}).catch(()=>{})</script>`
        : `<!doctype html><title>t</title><p>clean</p>`,
    );
  });
  return new Promise((ok) =>
    srv.listen(0, "127.0.0.1", () =>
      ok({
        base: `http://127.0.0.1:${srv.address().port}`,
        close: () => new Promise((r) => srv.close(() => r())),
      }),
    ),
  );
}

let failed = 0;
const fail = (msg) => {
  failed++;
  console.error(`  FAIL  ${msg}`);
};
const pass = (msg) => console.log(`  ok    ${msg}`);

// ---- pure self-tests
{
  const bad = undeclaredHosts(
    [
      "https://thelanguagepage.com/a.js",
      "https://static.cloudflareinsights.com/beacon.min.js/x",
      "data:image/png;base64,AA",
    ],
    "thelanguagepage.com",
    [],
  );
  if (bad.join() !== "static.cloudflareinsights.com")
    fail(`undeclaredHosts missed the beacon host: ${bad}`);
  const okDeclared = undeclaredHosts(["https://cdn.example/x.js"], "thelanguagepage.com", [
    { host: "cdn.example" },
  ]);
  if (okDeclared.length) fail("undeclaredHosts flagged a declared host");
  if (forbiddenPathHits(["https://thelanguagepage.com/cdn-cgi/rum"], ["/cdn-cgi/rum"]).length !== 1)
    fail("forbiddenPathHits missed /cdn-cgi/rum");
  if (
    forbiddenPathHits(["https://thelanguagepage.com/cdn-cgi/rum-not"], ["/cdn-cgi/rum"]).length !==
    0
  )
    fail("forbiddenPathHits matched a different path");
  const reg = { hosts: [{ host: "x.example", purpose: "p", dataSent: "d", retention: "r" }] };
  if (registryComplaints(reg, "nothing here").length === 0)
    fail("registryComplaints accepted a host the privacy page does not name");
  if (registryComplaints(reg, "x.example and No third-party analytics").length < 1)
    fail("registryComplaints accepted a 'no third-party' claim beside a declared host");
  if (registryComplaints({ hosts: [{ host: "y.example" }] }, "y.example").length < 3)
    fail("registryComplaints accepted a host with no purpose, data or retention");
  if (
    registryComplaints({ hosts: [] }, "No ads. No third-party analytics or trackers.").length !== 0
  )
    fail("registryComplaints rejected an empty registry with a true claim");
  if (!failed) pass("pure detectors reject every seeded defect and accept the clean shapes");
}

// ---- browser
const { chromium } = await import("playwright");
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch {
  process.exit(skipExit("no Chromium available", "Set PW_CHROMIUM_PATH to a system Chromium"));
}

const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));
const privacy = readFileSync(PRIVACY_PATH, "utf8");
const declared = registry.hosts || [];
const forbidden = registry.forbiddenSameOriginPaths || [];

// ---- browser self-test: a page that loads a tracker and posts to /cdn-cgi/rum must be caught, a clean one must not
{
  const dirty = await fixtureServer(true);
  const clean = await fixtureServer(false);
  const d = await sweep(browser, dirty.base, ["/"], [], ["/cdn-cgi/rum"]);
  const c = await sweep(browser, clean.base, ["/"], [], ["/cdn-cgi/rum"]);
  await dirty.close();
  await clean.close();
  if (!d[0].hosts.includes("static.tracker.example"))
    fail("self-test: the sweep did not see a third-party script request");
  if (d[0].hits.length === 0) fail("self-test: the sweep did not see a post to /cdn-cgi/rum");
  if (c[0].hosts.length || c[0].hits.length) fail("self-test: the sweep flagged a clean page");
  if (!d[0].hosts.length === false && !c[0].hosts.length)
    pass("browser self-test: a seeded tracker is caught, a clean page passes");
}

for (const c of registryComplaints(registry, privacy)) fail(`registry: ${c}`);

if (failed) {
  await browser.close();
  console.error(
    `\nvalidate-language-page-network: ${failed} failure(s) before the sweep (self-tests or registry)`,
  );
  process.exit(1);
}

// ---- the sweep
let server;
let base = liveBase;
if (!live) {
  const s = await serveAccess();
  server = s.server;
  base = s.base;
}
const paths = [...new Set(SITEMAP_PATHS.map((p) => (p.startsWith("/") ? p : `/${p}`)))];
const results = await sweep(browser, base, paths, declared, forbidden);
await browser.close();
if (server) server.close();

const measured = results.filter((r) => r.status >= 200 && r.status < 400);
if (live && measured.length === 0 && results.every((r) => r.status === 0)) {
  process.exit(
    skipExit("production unreachable from here", "Run where thelanguagepage.com resolves"),
  );
}
if (measured.length < MIN_ROUTES) {
  fail(
    `measured only ${measured.length} of ${paths.length} routes (floor ${MIN_ROUTES}): a sweep that measured almost nothing proves nothing`,
  );
}
for (const r of results) {
  if (r.status === 0) continue; // unreachable or proxied-only locally; the floor above counts what was measured
  if (r.hosts.length)
    fail(`${r.path}: contacts undeclared third-party host(s): ${r.hosts.join(", ")}`);
  if (r.hits.length)
    fail(`${r.path}: ${r.hits.length} request(s) to a forbidden telemetry path (${r.hits[0]})`);
}

if (failed) {
  console.error(
    `\nvalidate-language-page-network: FAIL — ${failed} problem(s) across ${measured.length} routes (${live ? liveBase : "source tree"})`,
  );
  console.error(
    "  The privacy page promises no third-party analytics. Declare a host in data/language-page-third-parties.json (and name it on the privacy page), or stop loading it.",
  );
  console.error(
    "  An edge-injected beacon is not in the repo: turn Cloudflare Web Analytics off for this hostname, or mark the HTML no-transform (functions/_lib/language-page.js).",
  );
  process.exit(1);
}
pass(
  `${measured.length} routes contacted no undeclared third party and never posted to a forbidden telemetry path (${live ? liveBase : "source tree"})`,
);
console.log("validate-language-page-network: PASS");

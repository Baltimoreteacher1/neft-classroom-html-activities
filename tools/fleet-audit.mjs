#!/usr/bin/env node
// fleet-audit.mjs — open EVERY built page in a real browser and look at it.
//
// Why this exists: the repo has 100+ static validators and a render smoke that
// samples one lesson per unit. Every one of them reasons about markup without
// ever asking a layout engine what a student actually sees. That gap is where
// this repo's most expensive defects have historically lived — a class
// `display:` outranking the UA `[hidden]` rule so `el.hidden` silently no-ops,
// an SVG figure whose default `stroke:none` renders with no ink, a shell-guard
// card that says "this lesson is having trouble loading" while a byte-count
// probe scores it PASS.
//
// So: no sampling, no greps. Boot each page, wait for it to settle, then
// interrogate the live DOM through the same lens a student has.
//
// Usage:
//   node tools/fleet-audit.mjs                      # full fleet
//   node tools/fleet-audit.mjs --limit 50           # smoke the harness itself
//   node tools/fleet-audit.mjs --filter lessons/1-  # subset by path
//   node tools/fleet-audit.mjs --workers 8
//   node tools/fleet-audit.mjs --axe                # add the a11y pass
//
// Output: reports/fleet-audit/results.jsonl (one row per page) + summary.json.
// This tool NEVER writes outside reports/ and never touches the network.

import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const OUT_DIR = path.join(ROOT, "reports", "fleet-audit");

// ---------------------------------------------------------------------------
// Static server. Deliberately NOT vite preview: its SPA history fallback
// answers a missing /assets/x.js with 200 + index.html, so an HTTP probe cannot
// distinguish "asset missing from the build" from "asset served fine". A
// missing asset is one of the defects we are hunting, so we serve real 404s.
// ---------------------------------------------------------------------------
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".mp3": "audio/mpeg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".zip": "application/zip",
};

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      let rel = decodeURIComponent(url.pathname);
      if (rel.endsWith("/")) rel += "index.html";
      const abs = path.join(DIST, path.normalize(rel));
      if (!abs.startsWith(DIST)) {
        res.writeHead(403).end("forbidden");
        return;
      }
      let body;
      try {
        body = await fs.readFile(abs);
      } catch {
        // Real 404. No SPA fallback, on purpose (see header comment).
        res.writeHead(404, { "content-type": "text/plain" }).end("not found");
        return;
      }
      res.writeHead(200, { "content-type": MIME[path.extname(abs)] || "application/octet-stream" });
      res.end(body);
    } catch (e) {
      res.writeHead(500).end(String(e));
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

// ---------------------------------------------------------------------------
// Page inventory
// ---------------------------------------------------------------------------
const SKIP_DIRS = new Set(["assets", "node_modules", ".vite"]);

async function collectPages(dir, acc = []) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name) && dir === DIST) continue;
      await collectPages(abs, acc);
    } else if (e.name.endsWith(".html")) {
      const rel = "/" + path.relative(DIST, abs).split(path.sep).join("/");
      // Request an index page by its DIRECTORY url, which is what a student's
      // link actually resolves to. The distinction is not cosmetic: pages branch
      // on location.pathname, and the 26 Unit Project pages look themselves up
      // in projects-award-config.json by a key like
      // "/math/unit-1/projects/version-a/" -- crawling ".../index.html" made all
      // 26 report "project configuration missing" when nothing was wrong.
      acc.push(rel.endsWith("/index.html") ? rel.slice(0, -"index.html".length) : rel);
    }
  }
  return acc;
}

// Classify a page so the report can rank defects by who is hurt by them.
function classify(url) {
  if (/answer-key/.test(url)) return "answer-key";
  if (/^\/lessons\/[^/]+\/$/.test(url)) return "lesson";
  if (/^\/lessons\/[^/]+\/(learn|practice|vocab|notes|homework|handout|slides)\.html$/.test(url))
    return "lesson-surface";
  if (/^\/lessons\/.*worksheet/.test(url)) return "worksheet";
  if (/^\/lessons\//.test(url)) return "lesson-other";
  if (/^\/curriculum/.test(url)) return "curriculum-hub";
  if (/game|arcade/.test(url)) return "game";
  return "other";
}

// ---------------------------------------------------------------------------
// The probe. Everything below runs inside the page, against a settled layout.
// ---------------------------------------------------------------------------

// Installed before any page script so we can see which elements ever received
// a click handler. Without this, "dead button" detection is guesswork: handlers
// attached via addEventListener are invisible to markup inspection.
const INIT_SCRIPT = `
(() => {
  const origAdd = EventTarget.prototype.addEventListener;
  window.__ntListeners = new WeakMap();
  window.__ntDelegated = { count: 0 };
  EventTarget.prototype.addEventListener = function (type, fn, opts) {
    try {
      if (type === 'click' || type === 'pointerdown' || type === 'mousedown' || type === 'change' || type === 'input' || type === 'submit') {
        if (this === document || this === window || this === document.body || this === document.documentElement) {
          window.__ntDelegated.count++;
        } else if (this instanceof Element) {
          const s = window.__ntListeners.get(this) || new Set();
          s.add(type);
          window.__ntListeners.set(this, s);
        }
      }
    } catch (e) {}
    return origAdd.call(this, type, fn, opts);
  };
})();
`;

const PROBE = `() => {
  const out = {};
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return false;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none') return false;
    if (parseFloat(cs.opacity) === 0) return false;
    return true;
  };

  const body = document.body;
  out.textLen = body ? body.innerText.trim().length : -1;
  out.htmlLen = body ? body.innerHTML.length : -1;
  out.title = (document.title || '').trim();

  // The shell guard paints this card when a lesson fails to boot. It is ~1072
  // chars of real text, so any length-based probe scores it as a healthy page.
  out.shellFallback = Boolean(document.getElementById('nt-shell-fallback'));

  // --- what is actually PAINTED, not merely present -------------------------
  // Container height is a trap: a lesson whose only child is position:fixed
  // leaves #app at height 0 while filling the screen. So measure the text the
  // layout engine actually placed inside the viewport instead of trusting any
  // single wrapper's box.
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  let painted = 0;
  let lowest = 0;
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const t = n.textContent.trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    // Intersects the viewport box (allowing for below-the-fold content).
    if (r.bottom < 0 || r.right < 0 || r.left > vw) continue;
    painted += t.length;
    lowest = Math.max(lowest, r.bottom);
  }
  out.paintedTextLen = painted;
  out.contentBottom = Math.round(lowest);
  out.aboveFoldPainted = painted > 0 && lowest > 0;

  const main = document.querySelector('main, #app, #root, [role=main]');
  out.mainSelector = main ? (main.tagName.toLowerCase() + (main.id ? '#' + main.id : '')) : null;
  out.mainTextLen = main ? main.innerText.trim().length : null;

  // Elements carrying the [hidden] attribute that a class 'display:' overrides.
  // el.hidden silently no-ops here; the content stays on screen for students.
  out.hiddenButShown = [];
  for (const el of document.querySelectorAll('[hidden]')) {
    if (vis(el)) {
      const r = el.getBoundingClientRect();
      const sel = (el.tagName.toLowerCase()) + (el.id ? '#'+el.id : '') + (el.className && typeof el.className === 'string' ? '.'+el.className.trim().split(/\\s+/).slice(0,2).join('.') : '');
      out.hiddenButShown.push(sel + ' [' + Math.round(r.width) + 'x' + Math.round(r.height) + ', text ' + el.innerText.trim().length + ']');
      if (out.hiddenButShown.length >= 8) break;
    }
  }

  // --- broken media ---------------------------------------------------------
  out.brokenImgs = [];
  for (const img of document.querySelectorAll('img')) {
    if (!img.complete) continue;
    if (img.naturalWidth === 0 && vis(img)) {
      out.brokenImgs.push(img.getAttribute('src') || '(no src)');
      if (out.brokenImgs.length >= 8) break;
    }
  }

  // SVG figures that occupy space but paint nothing. The repo's figure CSS
  // defaults stroke to none, which yields a correctly-sized, entirely blank
  // diagram -- valid markup, invisible mathematics.
  out.inkless = [];
  for (const svg of document.querySelectorAll('svg')) {
    if (!vis(svg)) continue;
    const r = svg.getBoundingClientRect();
    if (r.width < 24 || r.height < 24) continue;
    const shapes = svg.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon,text,image,use');
    if (shapes.length === 0) { out.inkless.push((svg.id||svg.getAttribute('class')||'svg') + ':empty'); continue; }
    let painted = 0;
    for (const s of shapes) {
      const cs = getComputedStyle(s);
      const f = cs.fill, st = cs.stroke;
      const hasFill = f && f !== 'none' && !/rgba\\(0, 0, 0, 0\\)/.test(f);
      const hasStroke = st && st !== 'none' && !/rgba\\(0, 0, 0, 0\\)/.test(st) && parseFloat(cs.strokeWidth) > 0;
      if (s.tagName === 'text' || s.tagName === 'image' || s.tagName === 'use') { painted++; break; }
      if (hasFill || hasStroke) { painted++; break; }
    }
    if (painted === 0) {
      out.inkless.push((svg.id||svg.getAttribute('class')||'svg') + ':' + shapes.length + ' shapes, no ink');
      if (out.inkless.length >= 6) break;
    }
  }

  // --- template / data leaks into student-visible text ----------------------
  const txt = body ? body.innerText : '';
  out.leaks = [];
  const patterns = [
    ['handlebars', /\\{\\{[^}]{1,60}\\}\\}/],
    ['js-template', /\\$\\{[^}]{1,60}\\}/],
    ['object-object', /\\[object Object\\]/],
    ['undefined-word', /(^|\\s)undefined(\\s|$|[.,!?])/],
    ['NaN', /(^|\\s)NaN(\\s|$|[.,!?])/],
    ['null-word', /(^|\\s)null(\\s|$|[.,!?])/],
    ['todo-marker', /\\b(TODO|FIXME|PLACEHOLDER|LOREM IPSUM)\\b/],
  ];
  for (const [name, re] of patterns) {
    const m = txt.match(re);
    if (m) out.leaks.push(name + ': ' + m[0].trim().slice(0, 60));
  }

  // --- dead controls --------------------------------------------------------
  // A visible, enabled button with no listener, no form action, and no href.
  // Delegation is recorded separately so we do not cry wolf on pages that
  // handle clicks at the document level.
  out.delegatedHandlers = (window.__ntDelegated && window.__ntDelegated.count) || 0;
  out.deadControls = [];
  const controls = document.querySelectorAll('button, [role=button], a');
  let visibleControls = 0;
  for (const el of controls) {
    if (!vis(el)) continue;
    visibleControls++;
    if (el.disabled) continue;
    const tag = el.tagName.toLowerCase();
    if (tag === 'a') {
      const href = el.getAttribute('href');
      if (href && href !== '#' && href.trim() !== '') continue;
    }
    if (tag === 'button') {
      const t = (el.getAttribute('type') || '').toLowerCase();
      if (t === 'submit' || t === 'reset') continue;
      if (el.closest('form')) continue;
    }
    if (el.getAttribute('onclick')) continue;
    const listeners = window.__ntListeners && window.__ntListeners.get(el);
    if (listeners && listeners.size) continue;
    const label = (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 40);
    out.deadControls.push(tag + ': ' + (label || '(no label)'));
    if (out.deadControls.length >= 10) break;
  }
  out.visibleControls = visibleControls;

  // --- horizontal overflow (content clipped off-screen) ---------------------
  out.overflowX = Math.max(0, Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth));

  // --- answer leakage on student surfaces -----------------------------------
  // Only meaningful off the answer-key pages themselves; the caller filters.
  out.answerMarkers = [];
  const answerish = /\\b(answer key|answers:|correct answer|solution:)\\b/i;
  for (const el of document.querySelectorAll('h1,h2,h3,h4,summary,legend,.answer,.answer-key,[data-answer]')) {
    if (!vis(el)) continue;
    const t = (el.innerText || '').trim();
    if (t && answerish.test(t)) {
      out.answerMarkers.push(t.slice(0, 60));
      if (out.answerMarkers.length >= 5) break;
    }
  }

  // --- headings / structure -------------------------------------------------
  out.h1Count = document.querySelectorAll('h1').length;
  out.visibleHeadings = [...document.querySelectorAll('h1,h2,h3')].filter(vis).length;
  out.lang = document.documentElement.getAttribute('lang') || null;

  return out;
}`;

async function probePage(context, url, port) {
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  const badStatus = [];

  page.on("pageerror", (e) => pageErrors.push(String(e.message || e).slice(0, 240)));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    // The browser logs a console error for every failed subresource, so an
    // unserved /api/ route would otherwise be counted twice: once as a request
    // failure and again here.
    const loc = m.location && m.location();
    if (loc && loc.url && /\/api\//.test(loc.url)) return;
    consoleErrors.push(m.text().slice(0, 240));
  });
  // /api/* is served in production by Cloudflare Functions (functions/api/**),
  // which this static server deliberately does not emulate. Those 404s are an
  // artefact of local serving, not a page defect -- bucket them separately so
  // they cannot drown the real findings.
  // /cdn-cgi/* is Cloudflare's own edge tooling (RUM beacon, etc.), injected at
  // the edge and absent from any local serve -- infrastructure, not a page asset.
  const isBackend = (u) => /\/api\//.test(u) || /\/cdn-cgi\//.test(u);
  const rel = (u) => u.replace(`http://127.0.0.1:${port}`, "");
  const backendCalls = [];

  page.on("requestfailed", (r) => {
    const f = r.failure();
    const entry = `${rel(r.url())} (${f ? f.errorText : "failed"})`;
    (isBackend(r.url()) ? backendCalls : failedRequests).push(entry);
  });
  page.on("response", (r) => {
    if (r.status() < 400) return;
    const entry = `${r.status()} ${rel(r.url())}`;
    (isBackend(r.url()) ? backendCalls : badStatus).push(entry);
  });

  const row = { url, kind: classify(url) };
  try {
    const resp = await page.goto(`http://127.0.0.1:${port}${url}`, {
      waitUntil: "load",
      timeout: 30000,
    });
    row.status = resp ? resp.status() : null;
    // Let client-rendered pages mount. networkidle is unreliable on pages with
    // long-lived connections, so bound it and continue regardless.
    await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(250);
    // Wrapped as an IIFE: page.evaluate() given a *string* evaluates it as an
    // expression, so a bare "() => {...}" yields an unserialisable function
    // object and silently resolves to undefined rather than running anything.
    row.probe = await page.evaluate(`(${PROBE})()`);
  } catch (e) {
    row.navError = String(e.message || e).slice(0, 240);
  }

  row.pageErrors = pageErrors.slice(0, 5);
  row.consoleErrors = consoleErrors.slice(0, 5);
  row.failedRequests = [...new Set(failedRequests)].slice(0, 10);
  row.badStatus = [...new Set(badStatus)].slice(0, 10);
  row.backendCalls = [...new Set(backendCalls)].slice(0, 10); // informational only
  row.counts = {
    pageErrors: pageErrors.length,
    consoleErrors: consoleErrors.length,
    failedRequests: new Set(failedRequests).size,
    badStatus: new Set(badStatus).size,
    backendCalls: new Set(backendCalls).size,
  };

  await page.close().catch(() => {});
  return row;
}

// ---------------------------------------------------------------------------
// Findings: turn raw probe output into ranked, named defects.
// ---------------------------------------------------------------------------
function findings(row) {
  const f = [];
  const add = (sev, code, detail) => f.push({ sev, code, detail });

  // A page whose probe never ran tells us nothing about the page. Say so
  // loudly rather than letting every downstream check read `undefined` and
  // report cosmetic trivia -- that is how a broken harness impersonates a
  // clean fleet.
  if (!row.probe) {
    add("critical", "probe-failed", row.navError || "probe did not return data");
    return f;
  }
  const p = row.probe;

  if (row.navError) add("critical", "nav-error", row.navError);
  if (row.status && row.status >= 400) add("critical", "http-error", `status ${row.status}`);
  if (p.shellFallback) add("critical", "shell-guard-fallback", "lesson did not boot; students see the failure card");
  if (row.counts?.pageErrors) add("critical", "uncaught-js", row.pageErrors[0]);

  if (p.textLen === 0) add("critical", "blank-page", "body has no visible text");
  else if (p.textLen > 0 && p.textLen < 120 && row.kind !== "other")
    add("high", "near-blank", `only ${p.textLen} chars of visible text`);

  // Text exists in the DOM but the layout engine painted none of it anywhere a
  // student could see -- the real "invisible content" defect, as distinct from
  // a wrapper that merely measures zero because its child is position:fixed.
  if (p.textLen > 0 && p.paintedTextLen === 0)
    add("critical", "nothing-painted", `${p.textLen} chars in the DOM, none rendered visibly`);

  if (row.counts?.badStatus) add("high", "missing-asset", row.badStatus.slice(0, 3).join("; "));
  if (row.counts?.failedRequests) add("high", "request-failed", row.failedRequests.slice(0, 3).join("; "));
  if (p.brokenImgs?.length) add("high", "broken-image", p.brokenImgs.join("; "));
  if (p.leaks?.length) add("high", "template-leak", p.leaks.join("; "));
  if (p.inkless?.length) add("high", "inkless-svg", p.inkless.join("; "));
  if (p.hiddenButShown?.length)
    add("high", "hidden-attr-overridden", `[hidden] but visible: ${p.hiddenButShown.join(", ")}`);

  // Answer leakage only matters on a surface a student is meant to hold. A
  // family or teacher resource that prints a key is doing its job, so scope
  // this to the student-facing kinds and report anything else as low.
  if (p.answerMarkers?.length && !/answer-key|teacher|family|families|solution/.test(row.url)) {
    const studentFacing = ["lesson", "lesson-surface", "worksheet"].includes(row.kind);
    add(studentFacing ? "high" : "low", "answer-leak", p.answerMarkers.join("; "));
  }

  if (row.counts?.consoleErrors) add("medium", "console-error", row.consoleErrors[0]);
  if (p.deadControls?.length && !p.delegatedHandlers)
    add("medium", "dead-control", p.deadControls.join("; "));
  if (p.overflowX > 24) add("medium", "horizontal-overflow", `${p.overflowX}px past the viewport`);
  if (p.h1Count === 0 && row.kind !== "other") add("low", "no-h1", "page has no h1");
  if (p.h1Count > 1) add("low", "multiple-h1", `${p.h1Count} h1 elements`);
  if (!p.lang) add("low", "no-lang", "html element has no lang attribute");

  return f;
}

// ---------------------------------------------------------------------------
async function main() {
  const argv = process.argv.slice(2);
  const arg = (n, d) => {
    const i = argv.indexOf(n);
    return i >= 0 ? argv[i + 1] : d;
  };
  const limit = Number(arg("--limit", 0));
  const filter = arg("--filter", null);
  const workers = Number(arg("--workers", 8));

  if (!fsSync.existsSync(DIST)) {
    console.error("dist/ not found — run `npm run build` first.");
    process.exit(2);
  }

  let pages = (await collectPages(DIST)).sort();
  if (filter) pages = pages.filter((u) => u.includes(filter));
  if (limit) pages = pages.slice(0, limit);

  const { server, port } = await startServer();
  console.log(`Serving dist on :${port} — probing ${pages.length} pages with ${workers} workers.`);

  await fs.mkdir(OUT_DIR, { recursive: true });
  const jsonlPath = path.join(OUT_DIR, "results.jsonl");
  const out = fsSync.createWriteStream(jsonlPath, { flags: "w" });

  const browser = await chromium.launch();
  const contexts = await Promise.all(
    Array.from({ length: workers }, async () => {
      const c = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await c.addInitScript(INIT_SCRIPT);
      return c;
    }),
  );

  let idx = 0;
  let done = 0;
  const started = Date.now();
  const all = [];

  async function worker(ctx) {
    for (;;) {
      const i = idx++;
      if (i >= pages.length) return;
      let row;
      try {
        row = await probePage(ctx, pages[i], port);
      } catch (e) {
        row = { url: pages[i], kind: classify(pages[i]), navError: `probe threw: ${e.message}` };
      }
      row.findings = findings(row);
      all.push(row);
      out.write(JSON.stringify(row) + "\n");
      done++;
      if (done % 100 === 0 || done === pages.length) {
        const rate = done / ((Date.now() - started) / 1000);
        const eta = Math.round((pages.length - done) / rate);
        process.stdout.write(
          `  ${done}/${pages.length}  ${rate.toFixed(1)}/s  eta ${Math.floor(eta / 60)}m${eta % 60}s\n`,
        );
      }
    }
  }

  await Promise.all(contexts.map(worker));
  await browser.close();
  server.close();
  out.end();

  // ---- summary ----
  const bySev = { critical: 0, high: 0, medium: 0, low: 0 };
  const byCode = {};
  const byKind = {};
  for (const r of all) {
    const kinds = new Set();
    for (const f of r.findings) {
      bySev[f.sev]++;
      byCode[f.code] = byCode[f.code] || { sev: f.sev, pages: 0, examples: [] };
      byCode[f.code].pages++;
      if (byCode[f.code].examples.length < 5)
        byCode[f.code].examples.push({ url: r.url, detail: f.detail });
      kinds.add(f.sev);
    }
    byKind[r.kind] = byKind[r.kind] || { pages: 0, clean: 0 };
    byKind[r.kind].pages++;
    if (r.findings.length === 0) byKind[r.kind].clean++;
  }

  const summary = {
    generated: new Date().toISOString(),
    commit: process.env.AUDIT_COMMIT || null,
    pagesProbed: all.length,
    pagesClean: all.filter((r) => r.findings.length === 0).length,
    elapsedSec: Math.round((Date.now() - started) / 1000),
    bySeverity: bySev,
    byCode: Object.fromEntries(
      Object.entries(byCode).sort((a, b) => b[1].pages - a[1].pages),
    ),
    byKind,
  };
  await fs.writeFile(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  console.log(`\nProbed ${all.length} pages in ${summary.elapsedSec}s. Clean: ${summary.pagesClean}.`);
  console.log(`Findings — critical ${bySev.critical}, high ${bySev.high}, medium ${bySev.medium}, low ${bySev.low}`);
  console.log("\nTop defect classes:");
  for (const [code, v] of Object.entries(summary.byCode).slice(0, 20)) {
    console.log(`  ${String(v.pages).padStart(5)}  ${v.sev.padEnd(8)} ${code}`);
  }
  console.log(`\nrows: ${jsonlPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

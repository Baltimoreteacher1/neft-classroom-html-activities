// Shared harness for the ACCESS Learning Journey browser checks: a static server over the source tree,
// one-browser-at-a-time contexts that start from empty storage, pass/fail bookkeeping, axe and overflow probes.
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./access-lab-content.mjs";

export const LAB = "/access-practice-lab";
export const JOURNEY_KEY = "accessPracticeLab:v1:journey";
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
      file = join(REPO_ROOT, "public", p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith(`${LAB}/`) && !/\.[a-z0-9]+$/i.test(p))
        file = join(REPO_ROOT, "access-practice-lab/index.html");
      else {
        res.writeHead(404);
        return res.end();
      }
    }
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve(server)));
}

export async function loadTools() {
  let chromium;
  let AxeBuilder = null;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return null;
  }
  try {
    AxeBuilder = (await import("@axe-core/playwright")).default;
  } catch {}
  return { chromium, AxeBuilder };
}

/** Pass/fail ledger shared by every scenario. */
export function makeLedger(prefix = "") {
  const failures = [];
  const ok = (cond, msg) => {
    if (!cond) failures.push(msg);
    console.log(`${cond ? "PASS" : "FAIL"} ${prefix}${msg}`);
    return !!cond;
  };
  return { failures, ok };
}

const NOISE = /web-vitals|favicon|Failed to load resource/;
/** A fresh context + page. Storage starts empty; prefs choose the band so no language gate interrupts. */
export async function newSession(browser, origin, opts = {}) {
  const { band = "6-8", viewport = { width: 1280, height: 900 }, seed = null, ...rest } = opts;
  const context = await browser.newContext({ viewport, ...rest });
  const errors = [];
  const failed = [];
  await context.addInitScript(
    ([b, s]) => {
      try {
        if (!sessionStorage.getItem("jr-e2e")) {
          localStorage.clear();
          localStorage.setItem(
            "accessPracticeLab:v1:prefs",
            JSON.stringify({ langChosen: true, band: b }),
          );
          for (const [k, v] of Object.entries(s || {})) localStorage.setItem(k, v);
          sessionStorage.setItem("jr-e2e", "1");
        }
      } catch {}
    },
    [band, seed],
  );
  const page = await context.newPage();
  page.on("pageerror", (e) => !NOISE.test(e.message) && errors.push(`pageerror: ${e.message}`));
  page.on(
    "console",
    (m) => m.type() === "error" && !NOISE.test(m.text()) && errors.push(`console: ${m.text()}`),
  );
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (/web-vitals|favicon/.test(u) || r.failure()?.errorText === "net::ERR_ABORTED") return;
    failed.push(`${r.failure()?.errorText} ${u}`);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && !/web-vitals|favicon|\/api\//.test(r.url()))
      failed.push(`${r.status()} ${r.url()}`);
  });
  const go = async (path) => {
    const sep = path.includes("?") ? "&" : "?";
    const url = origin + LAB + path + (/grades=/.test(path) ? "" : `${sep}grades=${band}`);
    await page.goto(url, { waitUntil: "load" });
    await page.waitForSelector("#app > :not(.boot)", { timeout: 20000 });
    await page.waitForLoadState("networkidle").catch(() => {});
  };
  return { context, page, errors, failed, go, band };
}

export const readJourney = (page) =>
  page.evaluate((k) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "null");
    } catch {
      return null;
    }
  }, JOURNEY_KEY);

export const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

export async function axeCheck(AxeBuilder, page, ok, label) {
  if (!AxeBuilder) return;
  await page.evaluate(() => window.scrollTo(0, 0));
  const res = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag22aa"]).analyze();
  const bad = res.violations.map(
    (v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target.join(" ")}`,
  );
  ok(bad.length === 0, `axe: ${label}${bad.length ? ` - ${bad.slice(0, 3).join(" | ")}` : ""}`);
}

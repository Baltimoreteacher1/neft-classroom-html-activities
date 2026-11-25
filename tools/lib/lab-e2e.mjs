// Shared harness for the ACCESS Practice Lab browser checks of the platform-expansion views (/demand, /teach-back,
// /claim-check): serve this working tree, open a real browser, collect console errors, run axe, measure overflow.
// A missing browser is a SKIP locally and a FAIL in CI. `BASE=<url>` points a run at another origin.
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./access-lab-content.mjs";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};
export const LAB = "/access-practice-lab";

function serve() {
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

/** Start a run: returns { page, ok, go, axe, overflow, errors, finish } or exits (SKIP) when no browser is available. */
export async function startRun(
  name,
  { width = 1280, prefs = { langChosen: true, band: "6-8" } } = {},
) {
  let chromium;
  let AxeBuilder;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.warn(`${name}: SKIP — playwright is not installed.`);
    process.exit(process.env.CI ? 1 : 0);
  }
  try {
    AxeBuilder = (await import("@axe-core/playwright")).default;
  } catch {
    console.warn(`${name}: axe-core/playwright is not installed; skipping axe checks.`);
  }
  let server = null;
  let origin = process.env.BASE;
  if (!origin) {
    server = await serve();
    origin = `http://localhost:${server.address().port}`;
  }
  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    console.warn(`${name}: SKIP — no browser (${error.message.split("\n")[0]})`);
    server?.close();
    process.exit(process.env.CI ? 1 : 0);
  }
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  const failures = [];
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  await page.addInitScript((p) => {
    try {
      if (!sessionStorage.getItem("e2e-seeded")) {
        localStorage.clear();
        localStorage.setItem("accessPracticeLab:v1:prefs", JSON.stringify(p));
        sessionStorage.setItem("e2e-seeded", "1");
      }
    } catch {}
  }, prefs);
  const ok = (cond, msg) => {
    if (!cond) failures.push(msg);
    console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  };
  const go = async (path) => {
    await page.goto(origin + LAB + path, { waitUntil: "load" });
    await page.waitForSelector("#app > :not(.boot)");
  };
  const axe = async (label) => {
    if (!AxeBuilder) return;
    await page.evaluate(() => window.scrollTo(0, 0));
    const res = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const bad = res.violations.map(
      (v) => `${v.id}[${v.impact}](${v.nodes.length}): ${v.nodes[0].target.join(" ")}`,
    );
    ok(
      bad.length === 0,
      `axe WCAG 2.2 AA: ${label}${bad.length ? ` — ${bad.slice(0, 3).join(" | ")}` : ""}`,
    );
  };
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  const finish = async () => {
    ok(
      errors.length === 0,
      `no console or page errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`,
    );
    await browser.close();
    server?.close();
    console.log(failures.length ? `\n${failures.length} failure(s)` : "\nall checks passed");
    process.exit(failures.length ? 1 : 0);
  };
  return { page, context, ok, go, axe, overflow, errors, finish, failures };
}

import { existsSync } from "fs";
import { readFile, stat } from "fs/promises";
import http from "http";
import { extname, join, relative } from "path";
import { chromium } from "playwright";

/**
 * Serve the BUILT site, not the source tree.
 *
 * This harness used to serve `process.cwd()` — the repo source — and so every
 * run failed six of six pages on `Failed to resolve module specifier
 * "web-vitals"` and `"@engine/templates/flagship/flagship.js"`. Those are a
 * bare npm specifier and a Vite alias: they are RESOLVED AT BUILD TIME and
 * cannot exist in source. The harness was reporting the build system working
 * as designed as a product defect, which is why it was never wired into the
 * gate and quietly protected nothing for as long as it has existed.
 *
 * `dist/` is what Cloudflare actually serves, so `dist/` is what gets smoked.
 */
const ROOT = existsSync(join(process.cwd(), "dist")) ? join(process.cwd(), "dist") : process.cwd();
const EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    let fp = join(ROOT, p);
    if (relative(ROOT, fp).startsWith("..")) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    try {
      const s = await stat(fp);
      if (s.isDirectory()) fp = join(fp, "index.html");
    } catch {}
    const data = await readFile(fp);
    res.writeHead(200, { "content-type": MIME[extname(fp)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

const pages = [
  "/esol-study-guide/",
  "/math/reading/area-enrichment/",
  "/wida-access/writing/", // repaired report/print generator
  "/reveal-evidence-studio/", // repaired report/print generator
  "/lessons/6-13/", // normal lesson page
  "/games/3d/unit-2/", // game page
];

const browser = await chromium.launch(existsSync(EXE) ? { executablePath: EXE } : {});
let failures = 0;
for (const path of pages) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message.split("\n")[0]));
  page.on("console", (m) => {
    const text = m.text();
    // The browser logs a generic "Failed to load resource" line alongside every
    // failed request, including the /api/* ones filtered above. Admitting it
    // here would re-introduce exactly what the request hooks just excluded.
    if (m.type() === "error" && !/Failed to load resource/.test(text)) {
      errors.push("console.error: " + text.slice(0, 160));
    }
  });
  // Two classes of noise belong to the harness, not to the page.
  //
  // 1. `/api/*` is served by the Cloudflare Worker in production. A static file
  //    server has no Worker, so every API call 404s here no matter how healthy
  //    the page is. The API contract is gated separately by
  //    `validate:auth-contract` and `validate:data-contracts`.
  // 2. `ERR_ABORTED` for a file that EXISTS on disk is the browser cancelling a
  //    request during teardown, not a missing asset. An abort for a file that is
  //    genuinely absent is still reported.
  const isApi = (url) => new URL(url).pathname.startsWith("/api/");
  const onDisk = (url) => existsSync(join(ROOT, decodeURIComponent(new URL(url).pathname)));
  page.on("requestfailed", (r) => {
    const why = r.failure()?.errorText || "";
    if (isApi(r.url())) return;
    if (why.includes("ERR_ABORTED") && onDisk(r.url())) return;
    errors.push("reqfail: " + r.url() + " :: " + why);
  });
  page.on("response", (r) => {
    if (r.status() >= 400 && !isApi(r.url())) errors.push("http" + r.status() + ": " + r.url());
  });
  let status = "n/a";
  try {
    const resp = await page.goto(base + path, { waitUntil: "load", timeout: 20000 });
    status = resp ? resp.status() : "no-resp";
    await page.waitForTimeout(1200);
    // confirm the math workbench launcher is present on student pages (not on game/lesson app shells necessarily)
    const hasLauncher = await page.evaluate(
      () => !!document.querySelector('script[src*="math-workbench-launcher.js"]'),
    );
    // verify no raw JS dumped into body text (the original injection symptom)
    const leaked = await page.evaluate(() =>
      /URL\.revokeObjectURL|createObjectURL\(|application\/msword/.test(
        document.body.innerText || "",
      ),
    );
    if (leaked) errors.push("LEAKED inline JS source into page text");
    const synErr = errors.filter((e) => /SyntaxError|Invalid or unexpected/.test(e));
    const ok = errors.length === 0;
    if (!ok) failures++;
    console.log(
      `${ok ? "PASS" : "FAIL"} ${path}  [http ${status}] launcher=${hasLauncher} synErr=${synErr.length}`,
    );
    for (const e of errors) console.log("      " + e);
  } catch (e) {
    failures++;
    console.log(`FAIL ${path}  [${e.message.split("\n")[0]}]`);
  }
  await ctx.close();
}
await browser.close();
server.close();
console.log(
  `\n${failures === 0 ? "✓ all smoke pages clean" : "✗ " + failures + " page(s) with errors"}`,
);
process.exit(failures === 0 ? 0 : 1);

import { chromium } from "playwright";
import http from "http";
import { readFile, stat } from "fs/promises";
import { existsSync } from "fs";
import { join, extname, relative } from "path";

const ROOT = process.cwd();
const EXE = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const MIME = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript",
  ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".gif": "image/gif", ".webp": "image/webp", ".woff2": "font/woff2",
  ".woff": "font/woff", ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    let fp = join(ROOT, p);
    if (relative(ROOT, fp).startsWith("..")) {
      res.writeHead(403); res.end("forbidden"); return;
    }
    try {
      const s = await stat(fp);
      if (s.isDirectory()) fp = join(fp, "index.html");
    } catch {}
    const data = await readFile(fp);
    res.writeHead(200, { "content-type": MIME[extname(fp)] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404); res.end("not found");
  }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const base = `http://127.0.0.1:${port}`;

const pages = [
  "/esol-study-guide/",
  "/math/reading/area-enrichment/",
  "/wida-access/writing/",          // repaired report/print generator
  "/reveal-evidence-studio/",       // repaired report/print generator
  "/lessons/1-1/",                  // normal lesson page
  "/games/3d/unit-2/",              // game page
];

const browser = await chromium.launch(existsSync(EXE) ? { executablePath: EXE } : {});
let failures = 0;
for (const path of pages) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message.split("\n")[0]));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console.error: " + m.text().slice(0, 160)); });
  page.on("requestfailed", (r) => errors.push("reqfail: " + r.url() + " :: " + (r.failure()?.errorText || "")));
  page.on("response", (r) => { if (r.status() >= 400) errors.push("http" + r.status() + ": " + r.url()); });
  let status = "n/a";
  try {
    const resp = await page.goto(base + path, { waitUntil: "load", timeout: 20000 });
    status = resp ? resp.status() : "no-resp";
    await page.waitForTimeout(1200);
    // confirm the math workbench launcher is present on student pages (not on game/lesson app shells necessarily)
    const hasLauncher = await page.evaluate(() =>
      !!document.querySelector('script[src*="math-workbench-launcher.js"]'),
    );
    // verify no raw JS dumped into body text (the original injection symptom)
    const leaked = await page.evaluate(() =>
      /URL\.revokeObjectURL|createObjectURL\(|application\/msword/.test(document.body.innerText || ""),
    );
    if (leaked) errors.push("LEAKED inline JS source into page text");
    const synErr = errors.filter((e) => /SyntaxError|Invalid or unexpected/.test(e));
    const ok = errors.length === 0;
    if (!ok) failures++;
    console.log(`${ok ? "PASS" : "FAIL"} ${path}  [http ${status}] launcher=${hasLauncher} synErr=${synErr.length}`);
    for (const e of errors) console.log("      " + e);
  } catch (e) {
    failures++;
    console.log(`FAIL ${path}  [${e.message.split("\n")[0]}]`);
  }
  await ctx.close();
}
await browser.close();
server.close();
console.log(`\n${failures === 0 ? "✓ all smoke pages clean" : "✗ " + failures + " page(s) with errors"}`);
process.exit(failures === 0 ? 0 : 1);

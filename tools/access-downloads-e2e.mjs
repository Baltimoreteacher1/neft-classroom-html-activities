#!/usr/bin/env node
/**
 * Activity downloads (access-practice-lab/src/download/), driven in Chromium over the source tree:
 *   - Word from one activity per band (K, 1, 2-3 in the audio-first player; 3-5, 6-8 on the classic page) via the
 *     browser's download event; the file is a ZIP with word/document.xml holding the title and no answer key;
 *   - the print/PDF view opens in a new tab with the title, a QR code and the print button;
 *   - a room's "Download all activities" .zip holds one .docx per room activity, with progress text;
 *   - the Word control is reachable and works from the keyboard (Tab, Enter);
 *   - 375px: no sideways scroll, 44px controls; Spanish labels and status; no console errors.
 * BASE=<url> to point elsewhere. Exit 3 = SKIP (no Playwright) locally.
 */
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-downloads-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
function serve() {
  const server = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
    if (!existsSync(file) && existsSync(join(REPO_ROOT, "public", p)))
      file = join(REPO_ROOT, "public", p);
    if (!existsSync(file) || statSync(file).isDirectory()) {
      if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
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

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};

/** Entry names → bytes of a stored ZIP. */
function unzip(buf) {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let end = buf.length - 22;
  while (end >= 0 && v.getUint32(end, true) !== 0x06054b50) end--;
  if (end < 0) throw new Error("not a zip");
  const out = new Map();
  let p = v.getUint32(end + 16, true);
  for (let i = 0; i < v.getUint16(end + 10, true); i++) {
    const size = v.getUint32(p + 24, true);
    const nameLen = v.getUint16(p + 28, true);
    const local = v.getUint32(p + 42, true);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString("utf8");
    const start = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    out.set(name, buf.subarray(start, start + size));
    p += 46 + nameLen + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
  }
  return out;
}
const docText = (zipBuf) => {
  const xml = unzip(zipBuf).get("word/document.xml")?.toString("utf8") || "";
  return [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1])
    .join(" ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
};
const readDownload = async (dl) => {
  const path = await dl.path();
  return readFileSync(path);
};

const LAB = "/access-practice-lab";
const index = JSON.parse(
  readFileSync(join(REPO_ROOT, "access-practice-lab/content/index.json"), "utf8"),
);
const firstRow = (band, domain = "Listening", level = "A") =>
  index.bands[band].domains[domain].levels[level].activities[0];

let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
const browser = await chromium.launch();
const errors = [];
const watch = (page) => {
  page.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" && !/web-vitals|favicon|Failed to load resource/.test(m.text()))
      errors.push(m.text());
  });
};

try {
  const ctx = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();
  watch(page);

  // Word from one activity per band.
  for (const band of ["K", "1", "2-3", "3-5", "6-8"]) {
    const [id, title] = firstRow(band);
    await page.goto(`${origin}${LAB}/Listening/A/${id}?grades=${band}`, { waitUntil: "load" });
    await page.waitForSelector('[data-dl="docx"]', { timeout: 15000 });
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click('[data-dl="docx"]')]);
    const buf = await readDownload(dl);
    const files = unzip(buf);
    const text = docText(buf);
    ok(
      dl.suggestedFilename().endsWith(".docx") && files.has("word/document.xml"),
      `${band}: Word file downloads (${dl.suggestedFilename()})`,
    );
    ok(text.includes(title), `${band}: the file holds the title "${title}"`);
    ok(!/Answer key|Correct answer/.test(text), `${band}: no answer key in the student file`);
    ok(
      /Word file downloaded/.test(await page.locator("[data-dl-status]").first().innerText()),
      `${band}: status line confirms`,
    );
  }

  // Print / PDF view (6-8, the classic page).
  {
    const [id, title] = firstRow("6-8", "Reading", "B");
    await page.goto(`${origin}${LAB}/Reading/B/${id}?grades=6-8`, { waitUntil: "load" });
    await page.waitForSelector('[data-dl="pdf"]');
    const [popup] = await Promise.all([page.waitForEvent("popup"), page.click('[data-dl="pdf"]')]);
    await popup.waitForSelector("h1");
    ok((await popup.locator("h1").innerText()).includes(title), "print view: the title");
    ok((await popup.locator("footer svg").count()) === 1, "print view: QR code to the activity");
    ok(
      (await popup.locator("[data-pv-print]").count()) === 1,
      "print view: Print / Save as PDF button",
    );
    ok(
      /Save as PDF/.test(await popup.locator(".pv-bar").innerText()),
      "print view: Save as PDF explained",
    );
    ok(
      (await popup.evaluate(() => getComputedStyle(document.querySelector(".pv-bar")).display)) !==
        "none",
      "print view: toolbar on screen",
    );
    await popup.emulateMedia({ media: "print" });
    ok(
      (await popup.evaluate(() => getComputedStyle(document.querySelector(".pv-bar")).display)) ===
        "none",
      "print view: toolbar hidden in print",
    );
    await popup.close();
  }

  // Room zip.
  {
    const level = index.bands["3-5"].domains.Reading.levels.B;
    await page.goto(`${origin}${LAB}/Reading/B?grades=3-5`, { waitUntil: "load" });
    await page.waitForSelector('[data-dl="room-zip"]');
    ok(
      await page.locator('[data-dl="cancel"]').isHidden(),
      "room: Cancel is hidden until a download runs",
    );
    const [dl] = await Promise.all([
      page.waitForEvent("download", { timeout: 60000 }),
      page.click('[data-dl="room-zip"]'),
    ]);
    const zip = unzip(await readDownload(dl));
    const docs = [...zip.keys()].filter((n) => n.endsWith(".docx"));
    ok(dl.suggestedFilename().endsWith(".zip"), `room: a .zip (${dl.suggestedFilename()})`);
    ok(
      docs.length === level.activities.length,
      `room: one .docx per activity (${docs.length} of ${level.activities.length})`,
    );
    ok(docText(zip.get(docs[0])).length > 40, "room: the first .docx has text");
    await page.waitForFunction(() =>
      /ready/.test(document.querySelector('[data-dl-status^="room:"]')?.textContent || ""),
    );
    ok(await page.locator('[data-dl="cancel"]').isHidden(), "room: Cancel hides when done");
    ok(
      (await page.locator('a[href$=".docx"][download]').count()) === 1,
      "room: the existing Word packet link is kept",
    );
  }

  // Keyboard: Tab to the Word control and press Enter.
  {
    const [id] = firstRow("3-5", "Writing", "A");
    await page.goto(`${origin}${LAB}/Writing/A/${id}?grades=3-5`, { waitUntil: "load" });
    await page.waitForSelector('[data-dl="docx"]');
    let reached = false;
    for (let i = 0; i < 120 && !reached; i++) {
      await page.keyboard.press("Tab");
      reached = await page.evaluate(() => document.activeElement?.matches?.('[data-dl="docx"]'));
    }
    ok(reached, "keyboard: Tab reaches the Word control");
    if (reached) {
      const ring = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
      ok(ring !== "none", `keyboard: visible focus ring (${ring})`);
      const [dl] = await Promise.all([page.waitForEvent("download"), page.keyboard.press("Enter")]);
      ok(dl.suggestedFilename().endsWith(".docx"), "keyboard: Enter downloads the Word file");
    }
  }

  // Teacher Hub (gated by the auth middleware in production; served directly here): the answer-key edition.
  {
    await page.goto(`${origin}/access-teacher/`, { waitUntil: "load" });
    await page.waitForSelector('[data-actdl-go="key-docx"]', { state: "attached", timeout: 20000 });
    // Hub sections start folded: open this one.
    if (!(await page.locator('[data-actdl-go="key-docx"]').isVisible()))
      await page.click("#activityDownloads .fold-toggle");
    await page.waitForSelector('[data-actdl-go="key-docx"]');
    await page.selectOption('[data-actdl="band"]', "3-5");
    await page.selectOption('[data-actdl="domain"]', "Reading");
    const [dl] = await Promise.all([
      page.waitForEvent("download"),
      page.click('[data-actdl-go="key-docx"]'),
    ]);
    const text = docText(await readDownload(dl));
    ok(
      /Answer key \(teacher only\)/.test(text) && /Correct answer/.test(text),
      `teacher hub: the answer-key Word file (${dl.suggestedFilename()})`,
    );
  }
  await ctx.close();

  // Phone width + Spanish.
  const phone = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  await phone.addInitScript(() => {
    try {
      const k = "accessPracticeLab:v1:prefs";
      const p = JSON.parse(localStorage.getItem(k) || "{}");
      localStorage.setItem(k, JSON.stringify({ ...p, lang: "es" }));
    } catch {}
  });
  const p2 = await phone.newPage();
  watch(p2);
  for (const [band, domain, level] of [
    ["K", "Listening", "A"],
    ["6-8", "Reading", "B"],
  ]) {
    const [id] = firstRow(band, domain, level);
    await p2.goto(`${origin}${LAB}/${domain}/${level}/${id}?grades=${band}`, { waitUntil: "load" });
    await p2.waitForSelector('[data-dl="docx"]');
    const over = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 1, `375px ${band}: no sideways scroll (${over}px)`);
    const small = await p2.evaluate(
      () =>
        [...document.querySelectorAll("[data-dl]:not([hidden])")]
          .map((b) => b.getBoundingClientRect())
          .filter((r) => r.height < 44 || r.width < 44).length,
    );
    ok(small === 0, `375px ${band}: download controls are at least 44px`);
    ok(
      /Archivo de Word/.test(await p2.locator('[data-dl="docx"]').innerText()),
      `Spanish ${band}: "Archivo de Word"`,
    );
    ok(
      /Imprimir o guardar como PDF/.test(await p2.locator('[data-dl="pdf"]').innerText()),
      `Spanish ${band}: "Imprimir o guardar como PDF"`,
    );
    const [dl] = await Promise.all([p2.waitForEvent("download"), p2.click('[data-dl="docx"]')]);
    ok(
      /Instrucciones/.test(docText(await readDownload(dl))),
      `Spanish ${band}: the file's headings are Spanish`,
    );
    ok(
      /descargado/.test(await p2.locator("[data-dl-status]").first().innerText()),
      `Spanish ${band}: status in Spanish`,
    );
  }
  await p2.goto(`${origin}${LAB}/Writing/A?grades=3-5`, { waitUntil: "load" });
  await p2.waitForSelector('[data-dl="room-zip"]');
  ok(
    /Descarga todas las actividades de esta sala/.test(await p2.locator(".dl-room h2").innerText()),
    "Spanish room: heading",
  );
  const over = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(over <= 1, `375px room: no sideways scroll (${over}px)`);
  await phone.close();
} catch (error) {
  failures.push(`crashed: ${error.stack || error}`);
  console.log(`FAIL crashed: ${error.stack || error}`);
} finally {
  await browser.close();
  server?.close();
}
ok(errors.length === 0, `no console or page errors ${errors.slice(0, 3).join(" | ")}`);
console.log(
  failures.length
    ? `\naccess-downloads-e2e: ${failures.length} FAILED`
    : "\naccess-downloads-e2e: all passed",
);
process.exit(failures.length ? 1 : 0);

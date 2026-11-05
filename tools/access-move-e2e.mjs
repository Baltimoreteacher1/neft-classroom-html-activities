#!/usr/bin/env node
/**
 * Move my progress (/move) in a real browser, across two ORIGINS (localhost and 127.0.0.1 on one server stand in for
 * eduwonderlab.com and thelanguagepage.com): send -> receive -> review -> add, with work already on the receiving
 * device kept; the file download/upload path; a message from a third origin ignored; axe WCAG 2.2 AA; 375px.
 *
 *   node tools/access-move-e2e.mjs        (serves this working tree)
 *
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-move-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-move-e2e: axe-core/playwright is not installed; skipping axe checks.");
}
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
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

const LAB = "/access-practice-lab";
const K = "accessPracticeLab:v1:";
const server = await serve();
const stranger = await serve();
const port = server.address().port;
const A = `http://localhost:${port}`;
const B = `http://127.0.0.1:${port}`;
const C = `http://localhost:${stranger.address().port}`;
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-move-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server.close();
  stranger.close();
  process.exit(process.env.CI ? 1 : 0);
}
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
  acceptDownloads: true,
});
const errors = [];
const watch = (page) => {
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
};
const open = async (origin, path = "/move") => {
  const page = await context.newPage();
  watch(page);
  await page.goto(origin + LAB + path, { waitUntil: "load" });
  await page.waitForSelector("#app > :not(.boot)");
  return page;
};
const store = (page, entries) =>
  page.evaluate((e) => Object.entries(e).forEach(([k, v]) => localStorage.setItem(k, v)), entries);
const read = (page, key) => page.evaluate((k) => localStorage.getItem(k), key);
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
async function axe(page, label) {
  if (!AxeBuilder) return;
  await page.evaluate(() => window.scrollTo(0, 0));
  const res = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  ok(
    res.violations.length === 0,
    `axe: ${label}${res.violations.length ? ` — ${res.violations.map((v) => `${v.id}(${v.nodes.length})`).join(", ")}` : ""}`,
  );
}

// Seed the sending device (A) with work, and the receiving device (B) with work that must survive.
const sender = await open(A);
await store(sender, {
  [`${K}studentName`]: "Ana",
  [`${K}flashcards`]: '{"cards":3}',
  [`${K}scaffold`]: '{"from":"A"}',
  "accessPracticeLab:listenNotes:v1:x": "my notes",
});
const receiverSeed = await open(B);
await store(receiverSeed, { [`${K}studentName`]: "Local on B" });
await receiverSeed.close();
await sender.reload({ waitUntil: "load" });
await sender.waitForSelector("#app > :not(.boot)");
await axe(sender, "move page");
await sender.setViewportSize({ width: 375, height: 800 });
ok(
  !(await sender.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)),
  "no horizontal overflow at 375px",
);
await sender.setViewportSize({ width: 1280, height: 900 });

// Send from A: the partner opens, asks, and the work arrives for review without being written.
const [popup] = await Promise.all([context.waitForEvent("page"), sender.click("[data-mv-send]")]);
watch(popup);
await popup.waitForSelector("[data-mv-review]", { timeout: 10000 });
ok(popup.url().startsWith(`${B}${LAB}/move`), "the partner site opened at its own origin");
ok(
  (await read(popup, `${K}flashcards`)) === null,
  "nothing is written before the learner confirms",
);
const text = await popup.locator("[data-mv-review]").innerText();
ok(
  /4 saved items/.test(text) && /1 of them already exist/.test(text),
  "the review names what is arriving and what already exists",
);
ok(
  !text.includes("my notes") && !text.includes("Ana"),
  "the review shows kinds and counts, never the work",
);
await axe(popup, "review step");
await popup.click("[data-mv-apply]");
await popup.waitForSelector("text=Nothing was deleted");
ok(
  (await read(popup, `${K}studentName`)) === "Local on B",
  "work already on the receiving device is kept, not overwritten",
);
ok((await read(popup, `${K}flashcards`)) === '{"cards":3}', "work that was missing arrives");
ok(
  (await read(popup, "accessPracticeLab:listenNotes:v1:x")) === "my notes",
  "learner notes kept outside the progress prefix arrive too",
);
ok(
  (await read(sender, `${K}flashcards`)) === '{"cards":3}' &&
    (await read(sender, `${K}studentName`)) === "Ana",
  "the sending device keeps everything",
);
await popup.close();

// File path: download on A, upload on a fresh device state on B.
const [download] = await Promise.all([
  sender.waitForEvent("download"),
  sender.click("[data-mv-download]"),
]);
const filePath = await download.path();
const fileText = (await import("node:fs")).readFileSync(filePath, "utf8");
ok(
  JSON.parse(fileText).kind === "access-lab-progress",
  "the downloaded file is a lab progress file",
);
const fresh = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const filePage = await fresh.newPage();
watch(filePage);
await filePage.goto(`${B}${LAB}/move`, { waitUntil: "load" });
await filePage.waitForSelector("#app > :not(.boot)");
await filePage.setInputFiles("[data-mv-file]", {
  name: "progress.json",
  mimeType: "application/json",
  buffer: Buffer.from(fileText),
});
await filePage.waitForSelector("[data-mv-review]");
await filePage.click("[data-mv-apply]");
await filePage.waitForSelector("text=Nothing was deleted");
ok(
  (await read(filePage, `${K}scaffold`)) === '{"from":"A"}',
  "a progress file adds work on a device that had none",
);
await filePage.setInputFiles("[data-mv-file]", []).catch(() => {});
const bad = await fresh.newPage();
watch(bad);
await bad.goto(`${B}${LAB}/move`, { waitUntil: "load" });
await bad.waitForSelector("#app > :not(.boot)");
await bad.setInputFiles("[data-mv-file]", {
  name: "x.json",
  mimeType: "application/json",
  buffer: Buffer.from('{"kind":"other","v":1,"data":{}}'),
});
await bad.waitForSelector(".saved-note[role=alert]");
ok(
  /not a progress file/.test(await bad.locator(".saved-note[role=alert]").innerText()),
  "a file that is not from the lab is refused with a plain message",
);
ok(
  (await bad.locator("[data-mv-review]").count()) === 0,
  "a refused file never reaches the review step",
);
await fresh.close();

// A third origin cannot hand data to a receiving page that did not ask it.
const evil = await context.newPage();
await evil.goto(`${C}${LAB}/move`, { waitUntil: "load" });
const [victim] = await Promise.all([
  context.waitForEvent("page"),
  evil.evaluate((url) => {
    window.__w = window.open(url, "evil-target");
  }, `${B}${LAB}/move?receive=1`),
]);
watch(victim);
await victim.waitForSelector("text=Waiting for");
await evil.evaluate(
  (b) =>
    window.__w.postMessage(
      {
        type: "access-lab-transfer:data",
        payload: { kind: "access-lab-progress", v: 1, data: { "accessPracticeLab:v1:pwned": "1" } },
      },
      b,
    ),
  B,
);
await victim.waitForTimeout(600);
ok(
  (await victim.locator("[data-mv-review]").count()) === 0 &&
    (await read(victim, `${K}pwned`)) === null,
  "data from a third origin is ignored",
);
await victim.close();
await evil.close();

ok(errors.length === 0, `no console or page errors${errors.length ? `: ${errors[0]}` : ""}`);
await browser.close();
server.close();
stranger.close();
if (failures.length) {
  console.error(`\naccess-move-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-move-e2e: all checks passed");

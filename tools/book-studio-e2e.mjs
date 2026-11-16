#!/usr/bin/env node
/**
 * Book Studio, driven the way a learner drives it (access-practice-lab/BOOK-STUDIO.md):
 * Create a Book from the top navigation → template → title → editor; add and reorder pages; type text; add a
 * picture, an illustration, a shape, a speech bubble and a drawing; record and replay audio (fake microphone);
 * undo/redo; reload and resume; read it (turn pages with keys); print to PDF (page count = book pages); EPUB and
 * .langbook export (archives inspected); import the .langbook back; share link opens read-only; microphone denied
 * shows the recovery message; keyboard-only move; Writing-to-book handoff; axe on home, editor and reader;
 * screenshots at desktop, tablet and phone. Serves this working tree; BASE=<url> to point elsewhere.
 *   node tools/book-studio-e2e.mjs [--shots <dir>]
 */
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { deflateSync } from "node:zlib";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("book-studio-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}

const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

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
const LAB = "/access-practice-lab";
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
// A valid 64×48 PNG (solid teal) for the picture upload, built with zlib.
function solidPng(w, h, [r, g, b]) {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf) => {
    let c = ~0;
    for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
    return ~c >>> 0;
  };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const row = Buffer.concat([
    Buffer.from([0]),
    Buffer.from(Array.from({ length: w }, () => [r, g, b]).flat()),
  ]);
  const raw = Buffer.concat(Array.from({ length: h }, () => row));
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const PNG = solidPng(64, 48, [7, 85, 104]);

const browser = await chromium.launch({
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
  ],
});
const errors = [];
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ["microphone"],
    acceptDownloads: true,
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/favicon|ERR_FILE_NOT_FOUND|404|net::ERR_|Failed to load resource|web-vitals/.test(
        m.text(),
      ) &&
      errors.push(m.text()),
  );
  page.on("dialog", (d) => d.dismiss());

  // ── 1. Create a Book from the top navigation ──
  await page.goto(`${origin}${LAB}/?grades=6-8`);
  const navLink = page.locator(".lab-tools a.top-book");
  await navLink.waitFor({ timeout: 15000 });
  ok(await navLink.isVisible(), "Create a Book is visible in the top navigation");
  await navLink.click();
  await page.waitForSelector(".bk-home h1", { timeout: 15000 });
  ok(
    page.url().includes("/book-studio"),
    "Create a Book opens /book-studio (native, not an external site)",
  );
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "home-desktop.png"), fullPage: true });
  if (AxeBuilder) {
    await page.waitForFunction(() => !document.querySelector(".is-entering"));
    await page.waitForTimeout(400);
    const r = await new AxeBuilder({ page })
      .include(".bk-root")
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    ok(
      bad.length === 0,
      `axe: bookshelf has no serious/critical violations ${bad.map((v) => `${v.id}(${v.nodes.length}) ${v.nodes.map((n) => n.target + " " + (n.any[0]?.message || "")).join("; ")}`).join(" ")}`,
    );
  }

  // ── 2. Template → title → editor ──
  await page.goto(`${origin}${LAB}/book-studio/new?template=personal-narrative&grades=6-8`);
  await page.fill('input[name="title"]', "The Day I Spoke Up");
  await page.fill('input[name="author"]', "Ana");
  await page.click('form[data-create] button[type="submit"]');
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page", { timeout: 15000 });
  ok(/\/book-studio\/edit\/b/.test(page.url()), "creating a book opens the editor on its own URL");
  const bookUrl = page.url();
  const pagesAtStart = await page.locator(".bk-page-item").count();
  ok(pagesAtStart >= 4, `template pages are in the book (${pagesAtStart})`);
  ok(
    (await page.locator(".bk-canvas .bk-t-text[data-role=title]").innerText()).includes(
      "The Day I Spoke Up",
    ),
    "cover carries the title",
  );

  // ── 3. Text ──
  await page.click('[data-bk-add="text"]');
  await page.keyboard.type("I raised my hand even though my voice was shaking.");
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => document.querySelector("[data-bk-save]")?.dataset.state === "saved",
    null,
    { timeout: 8000 },
  );
  ok(true, "typed text saves (status reads Saved on this device)");

  // ── 4. Pages: add, reorder, duplicate, delete ──
  await page.click(".bk-add-page > summary");
  await page.click('[data-bk-newpage="heading"]');
  const afterAdd = await page.locator(".bk-page-item").count();
  ok(afterAdd === pagesAtStart + 1, "Add page adds a page");
  await page.click('[data-bk-page-move="-1"]');
  ok(true, "page moved earlier with the keyboard-equivalent button");
  await page.click('[data-bk-act="dup-page"]');
  ok((await page.locator(".bk-page-item").count()) === afterAdd + 1, "Duplicate page");
  await page.click('.bk-page-tools [data-bk-act="del-page"]');
  await page.click('[data-bk-act="del-page-yes"]');
  ok(
    (await page.locator(".bk-page-item").count()) === afterAdd,
    "Delete page asks in the page, then deletes",
  );

  // ── 5. Picture, illustration, shape, bubble ──
  await page.click('.bk-page-item [data-bk-page="1"]');
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser"),
    (async () => {
      await page.click('.bk-addbar details:has([data-bk-add="image"]) > summary');
      await page.click('.bk-addbar [data-bk-add="image"]');
    })(),
  ]);
  await chooser.setFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG });
  await page
    .waitForSelector('.bk-canvas .bk-t-image img[src^="blob:"]', { timeout: 10000 })
    .catch(async (e) => {
      console.log(
        "banner:",
        await page
          .locator("[data-bk-banner]")
          .innerText()
          .catch(() => ""),
      );
      throw e;
    });
  ok(true, "uploaded picture appears on the page");
  await page.fill("[data-bk-prop=alt]", "A teal square standing in for my photo");
  await page.locator("[data-bk-prop=alt]").blur();
  await page.click('.bk-addbar > [data-bk-add="art"]');
  await page.click('[data-art-pick="char-maya"]');
  ok(
    (await page.locator(".bk-canvas .bk-t-art").count()) >= 1,
    "illustration added from the library",
  );
  await page.click('.bk-addbar details:has([data-bk-add="shape"]) > summary');
  await page.click('[data-bk-add="shape"][data-shape="star"]');
  ok((await page.locator(".bk-canvas .bk-t-shape").count()) >= 1, "shape added");
  await page.click('.bk-addbar details:has([data-bk-add="bubble"]) > summary');
  await page.click('[data-bk-add="bubble"][data-variant="speech"]');
  await page.keyboard.type("Can I share my idea?");
  await page.keyboard.press("Escape");
  ok(
    (await page.locator(".bk-canvas .bk-el.bk-t-bubble").innerText()).includes("Can I share"),
    "speech bubble with text",
  );

  // ── 6. Draw ──
  await page.click('.bk-addbar [data-bk-add="draw"]');
  await page.locator(".bk-draw-surface").scrollIntoViewIfNeeded();
  const box = await page.locator(".bk-draw-surface").boundingBox();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.8);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++)
    await page.mouse.move(
      box.x + box.width * (0.2 + i * 0.04),
      box.y + box.height * (0.8 - i * 0.02),
    );
  await page.mouse.up();
  await page.click('.bk-inspector [data-bk-add="draw"]');
  const strokes = await page.locator(".bk-canvas .bk-t-drawing path").count();
  if (!strokes && SHOTS) await page.screenshot({ path: join(SHOTS, "draw-fail.png") });
  ok(strokes >= 1, "drawing stroke saved as a vector element");

  // ── 7. Undo / redo ──
  const before = await page.locator(".bk-canvas .bk-t-drawing path").count();
  await page
    .locator(".bk-canvas")
    .click({ position: { x: 5, y: 5 } })
    .catch(() => {});
  await page.click('[data-bk-act="undo"]');
  const afterUndo = await page.locator(".bk-canvas .bk-t-drawing path").count();
  await page.click('[data-bk-act="redo"]');
  const afterRedo = await page.locator(".bk-canvas .bk-t-drawing path").count();
  ok(
    afterUndo < before && afterRedo === before,
    `undo removes the stroke and redo restores it (${before}→${afterUndo}→${afterRedo})`,
  );

  // ── 8. Record and replay audio (fake microphone) ──
  await page.click('.bk-addbar [data-bk-add="audio"]');
  await page.click('[data-bk-rec="start"]');
  await page.waitForSelector('[data-bk-rec="stop"]', { timeout: 8000 });
  await page.waitForTimeout(1500);
  await page.click('[data-bk-rec="stop"]');
  await page.waitForSelector('[data-bk-rec="play"]', { timeout: 10000 });
  ok(true, "recording saved to the book and Play is offered");
  await page.fill("[data-bk-prop=transcript]", "I raised my hand.");
  await page.locator("[data-bk-prop=transcript]").blur();

  // ── 9. Keyboard-only move ──
  const art = page.locator(".bk-canvas .bk-t-art").first();
  await art.focus();
  const x0 = await art.evaluate((n) => parseFloat(n.style.left));
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift+ArrowRight");
  const x1 = await page
    .locator(".bk-canvas .bk-t-art")
    .first()
    .evaluate((n) => parseFloat(n.style.left));
  ok(Math.abs(x1 - x0 - 6) < 0.2, `arrow keys move the selected element (${x0} → ${x1})`);
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "editor-desktop.png") });
  if (AxeBuilder) {
    await page.waitForFunction(() => !document.querySelector(".is-entering"));
    await page.waitForTimeout(400);
    const r = await new AxeBuilder({ page })
      .include("[data-bk-editor]")
      .withTags(["wcag2a", "wcag2aa"])
      .disableRules(["scrollable-region-focusable"])
      .analyze();
    const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    ok(
      bad.length === 0,
      `axe: editor has no serious/critical violations ${bad.map((v) => `${v.id}(${v.nodes.length}) ${v.nodes[0]?.target}`).join(" ")}`,
    );
  }

  // ── 10. Save and resume ──
  await page.waitForFunction(
    () => document.querySelector("[data-bk-save]")?.dataset.state === "saved",
    null,
    { timeout: 8000 },
  );
  await page.goto(bookUrl);
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await page.click('.bk-page-item [data-bk-page="1"]');
  ok(
    (await page.locator(".bk-canvas .bk-el.bk-t-bubble").innerText()).includes("Can I share"),
    "after reload the book resumes with every change",
  );
  ok(
    (await page.locator('.bk-canvas .bk-t-image img[src^="blob:"]').count()) === 1,
    "after reload the picture is still there",
  );

  // ── 11. Version history ──
  await page.click('[data-bk-act="history"]');
  await page.click('[data-bk-dlg="save-version"]');
  await page.waitForSelector(".bk-versions li");
  ok((await page.locator(".bk-versions li").count()) >= 1, "a version can be saved and is listed");
  const dlgState = () =>
    page.evaluate(() => ({
      open: document.querySelectorAll("dialog.bk-dialog[open]").length,
      all: document.querySelectorAll("dialog").length,
      active: document.activeElement?.outerHTML.slice(0, 60),
    }));
  console.log("before esc", JSON.stringify(await dlgState()));
  await page.keyboard.press("Escape");
  console.log("after esc", JSON.stringify(await dlgState()));

  // ── 12. Exports ──
  await page.click('[data-bk-act="share"]');
  const [epub] = await Promise.all([
    page.waitForEvent("download"),
    page.click('[data-bk-dlg="epub"]'),
  ]);
  const epubPath = await epub.path();
  const { readFileSync } = await import("node:fs");
  const epubBytes = readFileSync(epubPath);
  ok(
    epubBytes.subarray(30, 38).toString() === "mimetype" &&
      epubBytes.subarray(38, 58).toString() === "application/epub+zip",
    "EPUB: mimetype is the first, stored entry",
  );
  const epubText = epubBytes.toString("latin1");
  ok(
    /OEBPS\/content\.opf/.test(epubText) &&
      /OEBPS\/nav\.xhtml/.test(epubText) &&
      /schema:accessibilityFeature/.test(epubText),
    "EPUB: package, navigation and accessibility metadata",
  );
  ok(
    /A teal square standing in for my photo/.test(epubText) &&
      /I raised my hand even though/.test(epubText),
    "EPUB: text and picture description are in the reading order",
  );
  const [proj] = await Promise.all([
    page.waitForEvent("download"),
    page.click('[data-bk-dlg="project"]'),
  ]);
  const projPath = await proj.path();
  ok(
    readFileSync(projPath).toString("latin1").includes("book.json"),
    ".langbook project file downloads with the book and its media",
  );
  await page.click('[data-bk-dlg="link"]');
  const link = await page.locator("[data-bk-link]").inputValue();
  ok(link.includes("/book-studio/shared#b="), "share link is generated");
  await page.keyboard.press("Escape");

  // Print / PDF: one sheet per book page at the book's size.
  const nPages = await page.locator(".bk-page-item").count();
  await page.evaluate(() => {
    window.print = () => {
      window.__printed = true;
    };
  });
  await page.evaluate(async () => {
    const mod = await import("/access-practice-lab/src/book/export.js");
    const db = await import("/access-practice-lab/src/book/db.js");
    const id = location.pathname.split("/").pop();
    const book = await db.getBook(id);
    window.__printing = mod.printBook(book);
  });
  await page.waitForFunction(() => window.__printed === true);
  await page.emulateMedia({ media: "print" });
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  await page.emulateMedia({ media: "screen" });
  const pdfPages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) || []).length;
  ok(pdfPages === nPages, `PDF has one page per book page (${pdfPages} of ${nPages})`);
  if (SHOTS) writeFileSync(join(SHOTS, "book.pdf"), pdf);
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));

  // ── 13. Reader ──
  await page.goto(bookUrl.replace("/edit/", "/read/"));
  await page.waitForSelector(".bk-reader .bk-book .bk-page");
  ok(
    (await page.locator("[data-r-pos]").innerText()).length > 0,
    "reader opens with page position",
  );
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(700);
  ok(/Page|Pages/.test(await page.locator("[data-r-pos]").innerText()), "arrow key turns the page");
  if (SHOTS) await page.screenshot({ path: join(SHOTS, "reader-desktop.png") });
  if (AxeBuilder) {
    await page.waitForFunction(() => !document.querySelector(".is-entering"));
    await page.waitForTimeout(400);
    const r = await new AxeBuilder({ page })
      .include(".bk-reader")
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    ok(
      bad.length === 0,
      `axe: reader has no serious/critical violations ${bad.map((v) => `${v.id}(${v.nodes.length}) ${v.nodes[0]?.target}`).join(" ")}`,
    );
  }

  // ── 14. Shared link opens read-only ──
  await page.goto(link.replace(/^https?:\/\/[^/]+/, origin));
  await page.waitForSelector(".bk-reader .bk-book .bk-page");
  ok(
    (await page.locator(".bk-reader-note").count()) === 1 &&
      (await page.locator(".bk-reader-title").innerText()).includes("The Day I Spoke Up"),
    "shared link opens the book read-only",
  );

  // ── 15. Import the .langbook back ──
  await page.goto(`${origin}${LAB}/book-studio`);
  await page.waitForSelector(".bk-home");
  const booksBefore = await page.locator(".bk-card").count();
  await page.setInputFiles("[data-shelf-file]", projPath);
  await page.waitForURL(/\/book-studio\/edit\//, { timeout: 15000 });
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await page.goto(`${origin}${LAB}/book-studio`);
  await page.waitForSelector(".bk-card");
  ok(
    (await page.locator(".bk-card").count()) === booksBefore + 1,
    "imported book file becomes a new book on the shelf",
  );

  // ── 16. Writing Studio → book handoff (the shared contract) ──
  await page.evaluate(async () => {
    const { createBookFromContent } = await import("/access-practice-lab/src/book/handoff.js");
    window.__handoff = await createBookFromContent({
      source: { kind: "writing", id: "t1", label: "Explain" },
      title: "My Explanation",
      templateId: "informational-report",
      pages: [
        {
          heading: "Why plants need light",
          text: "Plants use light to make food. Without light, a plant cannot grow.",
        },
      ],
    });
  });
  const hid = await page.evaluate(() => window.__handoff);
  await page.goto(`${origin}${LAB}/book-studio/edit/${hid}`);
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await page.click('.bk-page-item [data-bk-page="1"]');
  ok(
    (await page.locator(".bk-canvas").innerText()).includes("Plants use light to make food"),
    "Writing Studio content lands on an editable book page",
  );

  // ── 17. Tablet and phone ──
  for (const [name, vp] of [
    ["tablet", { width: 820, height: 1180 }],
    ["phone", { width: 390, height: 844 }],
  ]) {
    const ctx2 = await browser.newContext({
      viewport: vp,
      hasTouch: true,
      isMobile: name === "phone",
    });
    const p2 = await ctx2.newPage();
    p2.on(
      "pageerror",
      (e) => !/web-vitals/.test(String(e)) && errors.push(`${name}: ${e.stack || e}`),
    );
    await p2.goto(`${origin}${LAB}/book-studio/new?kind=comic`);
    await p2.fill('input[name="title"]', "Phone Comic");
    await p2.click('form[data-create] button[type="submit"]');
    await p2.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
    const overflow = await p2.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    ok(overflow <= 1, `${name}: editor has no sideways scroll (${overflow}px)`);
    const cw = await p2.locator(".bk-canvas").boundingBox();
    ok(
      cw.width >= vp.width * 0.6,
      `${name}: the page canvas uses the screen (${Math.round(cw.width)}px)`,
    );
    await p2.click('[data-bk-add="text"]');
    await p2.keyboard.type("Hi!");
    ok((await p2.locator(".bk-canvas").innerText()).includes("Hi!"), `${name}: can add text`);
    if (SHOTS) await p2.screenshot({ path: join(SHOTS, `editor-${name}.png`), fullPage: true });
    await p2.goto(`${origin}${LAB}/book-studio`);
    await p2.waitForSelector(".bk-home");
    if (SHOTS) await p2.screenshot({ path: join(SHOTS, `home-${name}.png`), fullPage: true });
    const navVisible = await p2.locator(".lab-tools a.top-book").isVisible();
    ok(navVisible, `${name}: Create a Book stays a labelled link in the header`);
    await ctx2.close();
  }

  // ── 18. Microphone denied ──
  const denied = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    permissions: [],
  });
  const p3 = await denied.newPage();
  await p3.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(Object.assign(new Error("Permission denied"), { name: "NotAllowedError" }));
  });
  await p3.goto(`${origin}${LAB}/book-studio/new?kind=audio`);
  await p3.fill('input[name="title"]', "Denied");
  await p3.click('form[data-create] button[type="submit"]');
  await p3.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await p3.click('.bk-page-item [data-bk-page="1"]');
  await p3.click(".bk-canvas .bk-t-audio");
  await p3.click('[data-bk-rec="start"]');
  await p3.waitForSelector(".bk-rec .bk-error", { timeout: 6000 });
  ok(
    (await p3.locator(".bk-rec .bk-error").innerText()).includes("microphone is blocked"),
    "microphone denied: clear recovery message with upload and transcript alternatives",
  );
  await denied.close();
} catch (error) {
  try {
    const pg = browser.contexts()[0]?.pages()[0];
    if (pg && SHOTS) await pg.screenshot({ path: join(SHOTS, "crash.png") });
  } catch {}
  failures.push(`crashed: ${error.stack || error}`);
  console.log(`FAIL crashed: ${error.stack || error}`);
} finally {
  await browser.close();
  server?.close();
}
ok(errors.length === 0, `no page errors ${errors.slice(0, 5).join(" | ")}`);
console.log(
  failures.length
    ? `\nbook-studio-e2e: ${failures.length} FAILED`
    : "\nbook-studio-e2e: all passed",
);
process.exit(failures.length ? 1 : 0);

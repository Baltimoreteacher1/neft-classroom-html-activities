import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { serveAccess } from "./lib/access-serve.mjs";

const { server, base } = await serveAccess();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
// Match the existing source-server suites: web-vitals resolves only in the Vite bundle.
const errors = [];
page.on("pageerror", (error) => {
  if (!/web-vitals/.test(String(error))) errors.push(String(error));
});
const out = "/tmp/language-premium-book-curated";
mkdirSync(out, { recursive: true });
try {
  await page.goto(
    `${base}/access-practice-lab/book-studio/new?template=personal-narrative&grades=6-8`,
  );
  await page.fill('input[name="title"]', "Museum field journal");
  await page.locator('form[data-create] button[type="submit"]').click();
  await page.waitForSelector("[data-bk-editor]");
  const id = new URL(page.url()).pathname.split("/").pop();
  await page.locator('.bk-addbar > [data-bk-add="art"]').click();
  await page.locator('[data-art-scene="museum-gallery"]').click();
  const waitForSavedImage = async (background) => {
    for (let attempt = 0; attempt < 80; attempt++) {
      const saved = await page.evaluate(
        async ({ id, background }) => {
          const db = await import("/access-practice-lab/src/book/db.js");
          const book = await db.getBook(id);
          return !!book?.pages[0].elements.some(
            (el) => el.type === "image" && el.media && !!el.locked === background,
          );
        },
        { id, background },
      );
      if (saved) return;
      await page.waitForTimeout(100);
    }
    throw new Error("Curated image was not saved");
  };
  await waitForSavedImage(false);
  const picture = await page.evaluate(async (id) => {
    const db = await import("/access-practice-lab/src/book/db.js");
    const book = await db.getBook(id);
    const el = book.pages[0].elements.find((el) => el.type === "image" && el.media);
    const media = await db.getMedia(el.media);
    return {
      locked: !!el.locked,
      w: el.w,
      h: el.h,
      type: media.blob.type,
      bytes: media.blob.size,
      alt: el.alt,
    };
  }, id);
  assert.equal(picture.locked, false);
  assert.ok(picture.w < 100 && picture.h < 100);
  assert.equal(picture.type, "image/jpeg");
  assert.ok(picture.bytes > 10000);
  assert.match(picture.alt, /museum/);
  await page.locator(".bk-canvas").click({ position: { x: 4, y: 4 } });
  const pageSettings = page
    .locator("details.bk-sec")
    .filter({ has: page.locator('[data-bk-add="bg-art"]') });
  if ((await pageSettings.getAttribute("open")) === null)
    await pageSettings.locator("summary").click();
  await page.locator('[data-bk-add="bg-art"]').click();
  await page.locator('[data-art-scene="newsroom-editorial"]').click();
  await waitForSavedImage(true);
  const exported = await page.evaluate(async (id) => {
    const db = await import("/access-practice-lab/src/book/db.js");
    const exp = await import("/access-practice-lab/src/book/export.js");
    const book = await db.getBook(id);
    const page = book.pages[0];
    const project = await exp.exportProject(book);
    const zip = await exp.readZip(await project.arrayBuffer());
    const media = JSON.parse(new TextDecoder().decode(zip["media.json"]));
    const mediaFiles = Object.values(media).map((row) => ({
      file: row.file,
      bytes: zip[row.file]?.byteLength,
    }));
    const imported = await exp.importProject(
      new File([project], "field-journal.langbook", { type: "application/zip" }),
    );
    const importedMedia = await Promise.all(
      imported.pages[0].elements
        .filter((el) => el.type === "image" && el.media)
        .map(async (el) => (await db.getMedia(el.media))?.blob.size),
    );
    const epub = await exp.buildEpub(book);
    const epubZip = await exp.readZip(await epub.blob.arrayBuffer());
    window.print = () => {};
    const printing = exp.printBook(book);
    await new Promise((r) => setTimeout(r, 100));
    const printImages = [...document.querySelectorAll(".bk-print-root img")].map((img) => ({
      src: img.src,
      complete: img.complete,
      width: img.naturalWidth,
    }));
    dispatchEvent(new Event("afterprint"));
    await printing;
    return {
      background: page.elements[0],
      text: page.elements
        .filter((el) => el.type === "text")
        .map((el) => ({ bg: el.style.bg, colour: el.style.color })),
      mediaFiles,
      importedMedia,
      epubFiles: Object.keys(epubZip).filter((key) => /\.jpg$/.test(key)),
      printImages,
    };
  }, id);
  assert.ok(exported.background.locked);
  assert.equal(exported.background.w, 100);
  assert.ok(exported.text.every((el) => el.bg));
  assert.equal(exported.mediaFiles.length, 2);
  assert.ok(exported.mediaFiles.every((file) => file.bytes > 10000));
  assert.ok(exported.importedMedia.every((bytes) => bytes > 10000));
  assert.equal(exported.epubFiles.length, 2);
  const bundledPrintImages = exported.printImages.filter((im) => im.src.startsWith("blob:"));
  assert.ok(
    bundledPrintImages.length >= 2 && bundledPrintImages.every((im) => im.complete && im.width > 0),
  );
  await page.screenshot({ path: `${out}/editor-background.png`, fullPage: true });
  assert.deepEqual(errors, []);
  console.log(
    "PASS curated scene editable image; explicit readable background; actual IndexedDB blobs; .langbook media packaging and re-import; EPUB bundled images; printable HTML blob images; no page errors",
  );
} finally {
  await browser.close();
  server.close();
}

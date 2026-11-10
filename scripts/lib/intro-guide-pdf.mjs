// Renders a standalone print document to a tagged PDF with Chromium: the same markup and the same intro-guide.css the
// /start/guide page prints with, served from the source tree so fonts, icons and QR images load exactly as in the lab.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { serveAccess } from "../../tools/lib/access-serve.mjs";
import { stampLanguage } from "./student-pdf.mjs";

const LAB = "/access-practice-lab";

/** The full HTML document for a print body. `bodyHtml` is markup already escaped by the caller. */
export function printDocument({
  title,
  lang = "en",
  bodyHtml,
  cssFiles = ["ds.css", "intro-guide.css"],
}) {
  const css = cssFiles.map((f) => `<link rel="stylesheet" href="${LAB}/${f}">`).join("\n");
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${css}
</head>
<body>
<main class="ig-main">${bodyHtml}</main>
</body>
</html>`;
}

/**
 * Render each { out, doc } to a PDF file. Returns after every file is written and stamped with its language.
 * Playwright comes from the repo's own dependency (`playwright`); a missing browser throws with a plain message.
 */
export async function renderPdfs(jobs, { lang = "en-US" } = {}) {
  const require = createRequire(import.meta.url);
  const { chromium } = require("playwright");
  const { server, base } = await serveAccess();
  let browser;
  try {
    browser = await chromium.launch();
    for (const job of jobs) {
      const page = await browser.newPage({ viewport: { width: 816, height: 1056 } });
      await page.route(`${base}${LAB}/guides/_print.html`, (route) =>
        route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: job.doc }),
      );
      await page.emulateMedia({ media: "print" });
      await page.goto(`${base}${LAB}/guides/_print.html`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const pdf = await page.pdf({
        format: "Letter",
        tagged: true,
        outline: false,
        preferCSSPageSize: true,
        printBackground: true,
      });
      writeFileSync(job.out, pdf);
      stampLanguage(job.out, lang);
      await page.close();
    }
  } finally {
    await browser?.close();
    server.close();
  }
  return jobs.map((j) => readFileSync(j.out).length);
}

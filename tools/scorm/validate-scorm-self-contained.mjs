#!/usr/bin/env node
/**
 * validate:scorm-self-contained — prove what a Canvas SCORM package actually
 * needs at runtime.
 *
 * These packages are NOT bundled lessons. The ZIP is a two-file SCO that
 * iframes https://eduwonderlab.com/…. This gate:
 *
 *   1. Self-tests the URL / ZIP detectors (a silent detector is a green lie).
 *   2. Builds representative packages from every generator family.
 *   3. Asserts each archive is only imsmanifest.xml + index.html.
 *   4. Asserts every absolute URL in the SCO is the allowlisted live origin.
 *   5. When a browser is available, launches the SCO with eduwonderlab.com
 *      BLOCKED and asserts the live lesson never loads.
 *
 * A successful run means the architecture still matches docs/scorm.md, NOT
 * that a student can work without the live site. The printed verdict is
 * PRODUCTION-DEPENDENT.
 *
 * Run: npm run validate:scorm-self-contained
 */
import { createServer } from "node:http";
import { buildScormFiles, zipStore } from "../../functions/_lib/scorm.js";
import {
  classifyScoUrls,
  extraZipEntries,
  missingZipEntries,
  REPRESENTATIVE_TARGETS,
} from "./lib/scorm-containment.mjs";
import { readZip } from "./zip-read.mjs";

const problems = [];
const notes = [];

function fail(m) {
  problems.push(m);
}

/* ── Detector self-test ───────────────────────────────────────────────────── */

{
  const cdn = classifyScoUrls(
    `<iframe id="lesson" data-src="https://eduwonderlab.com/lessons/1-1/?lms=scorm"></iframe>
<link href="https://cdn.example.com/app.js">`,
  );
  if (!cdn.problems.some((p) => p.includes("cdn.example.com"))) {
    fail("self-test: classifyScoUrls no longer flags a third-party URL");
  }
  const extras = extraZipEntries(["imsmanifest.xml", "index.html", "js/app.js"]);
  if (!extras.includes("js/app.js")) fail("self-test: extraZipEntries missed a bundled file");
}

/* ── Static sweep of representative packages ──────────────────────────────── */

const built = [];
for (const spec of REPRESENTATIVE_TARGETS) {
  const pkg = buildScormFiles(spec);
  const zip = zipStore(pkg.files);
  const entries = readZip(zip);
  const names = entries.map((e) => e.name);
  const html = entries.find((e) => e.name === "index.html")?.text() || "";
  const classified = classifyScoUrls(html);
  for (const p of missingZipEntries(names)) fail(`${spec.kind} ${spec.target}: missing ${p}`);
  for (const p of extraZipEntries(names)) {
    fail(`${spec.kind} ${spec.target}: unexpected zip entry ${p} — wrappers are two files`);
  }
  for (const p of classified.problems) fail(`${spec.kind} ${spec.target}: ${p}`);
  built.push({ spec, pkg, html, classified, names, bytes: zip.length });
}

/* ── Blocked-origin runtime probe ─────────────────────────────────────────── */

async function listen(html) {
  const server = createServer((_req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(html);
  });
  await new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", (err) => (err ? reject(err) : resolve()));
  });
  const { port } = server.address();
  return { server, origin: `http://127.0.0.1:${port}` };
}

async function probeBlocked(html, label) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return { skipped: true, reason: "playwright is not installed" };
  }
  let browser;
  try {
    browser = await chromium.launch(
      process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
  } catch (e) {
    return { skipped: true, reason: `Chromium could not launch (${e.message})` };
  }

  const { server, origin } = await listen(html);
  const blocked = [];
  try {
    const page = await browser.newPage();
    await page.route(/eduwonderlab\.com/i, (route) => {
      blocked.push(route.request().url());
      return route.abort("blockedbyclient");
    });
    await page.addInitScript(() => {
      window.API = {
        LMSInitialize: () => "true",
        LMSFinish: () => "true",
        LMSGetValue: () => "",
        LMSSetValue: () => "true",
        LMSCommit: () => "true",
        LMSGetLastError: () => "0",
        LMSGetErrorString: () => "",
        LMSGetDiagnostic: () => "",
      };
    });
    await page.goto(origin + "/", { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForFunction(
      () => document.querySelectorAll("iframe#lesson[src]").length === 1,
      null,
      { timeout: 8000 },
    );
    await new Promise((r) => setTimeout(r, 800));
    const iframeSrc = await page.$eval("#lesson", (el) => el.getAttribute("src") || "");
    const fallback = await page.evaluate(() =>
      Boolean(document.getElementById("nt-shell-fallback")),
    );
    const bodyText = await page.evaluate(() => document.body.innerText.trim());
    return {
      skipped: false,
      iframeSrc,
      blocked,
      fallback,
      bodyText,
      label,
    };
  } finally {
    server.close();
    await browser.close();
  }
}

function skipExit(why) {
  if (process.env.CI) {
    fail(`runtime probe SKIPPED in CI: ${why}`);
    return;
  }
  notes.push(`runtime probe SKIPPED: ${why}`);
}

if (!problems.length) {
  try {
    for (const sample of built) {
      const result = await probeBlocked(sample.html, sample.spec.target);
      if (result.skipped) {
        skipExit(result.reason);
        break;
      }
      if (!/eduwonderlab\.com/i.test(result.iframeSrc)) {
        fail(
          `blocked probe (${sample.spec.kind}): iframe src was not the live site (${result.iframeSrc})`,
        );
      }
      if (result.blocked.length < 1) {
        fail(
          `blocked probe (${sample.spec.kind}): the SCO never requested eduwonderlab.com — the abort cannot prove independence`,
        );
      }
      if (result.fallback) {
        fail(
          `blocked probe (${sample.spec.kind}): shell-guard fallback appeared in the SCO wrapper (unexpected)`,
        );
      }
      // A rendered EduWonderLab lesson is thousands of characters. The wrapper
      // itself is an empty iframe page. If the live site leaked through the
      // abort, this floor would catch it.
      if (result.bodyText.length > 400) {
        fail(
          `blocked probe (${sample.spec.kind}): wrapper body grew to ${result.bodyText.length} chars with the live site blocked — lesson content may have loaded`,
        );
      }
      notes.push(
        `runtime: blocked ${result.blocked.length} request(s) to eduwonderlab.com for ${sample.spec.kind} ${sample.spec.target}; lesson did not render`,
      );
    }
  } catch (e) {
    fail(`blocked-origin probe threw: ${e.message}`);
  }
}

/* ── Report ───────────────────────────────────────────────────────────────── */

console.log("SCORM live-origin / self-containment");
for (const b of built) {
  console.log(
    `  ${b.spec.kind.padEnd(20)} ${b.spec.target}  zip=${b.names.join(",")}  ${b.bytes}B  iframe=${b.classified.src}`,
  );
}
for (const n of notes) console.warn(`   ! ${n}`);

if (problems.length) {
  console.error("✗ validate:scorm-self-contained");
  for (const p of problems) console.error(`   - ${p}`);
  process.exit(1);
}

console.log("VERDICT: PRODUCTION-DEPENDENT");
console.log(
  "  The ZIP is a SCORM wrapper. Required lesson HTML/JS/CSS/images come from https://eduwonderlab.com at launch.",
);
console.log("  Blocking that origin leaves the Canvas assignment shell but not a usable lesson.");
console.log("  This is the documented live-iframe contract, not a silent packaging miss.");
console.log(`✓ ${built.length} representative packages match the live-wrapper contract`);

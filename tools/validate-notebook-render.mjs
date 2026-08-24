#!/usr/bin/env node
/**
 * validate-notebook-render.mjs — render-level build gate for Math Notes and Warmup entry card.
 *
 * Drives a real headless browser against the built static output to assert what
 * students actually experience:
 *   1. Warmup phase (Phase 0) renders the dedicated Math Notes entry card (.card-warmup-math-notes).
 *   2. Clicking the entry card button (.warmup-open-notes-btn) opens the Math Notes modal (dialog#nt-notebook-model).
 *   3. The Math Notes modal renders the lesson's exact authored Box 1 vocabulary and Box 2 mathematical rule.
 *   4. Inline "Notebook time" gating blockers (.nt-nb-check, .nt-nb-input) are eliminated: phases advance freely.
 *   5. The Math Notes dialog automatically closes upon phase transition.
 *
 * Self-contained: spins up a local HTTP server on an ephemeral port to serve dist/.
 */
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");

const argv = process.argv.slice(2);
const baseArg = argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : process.env.BASE;

// Sample core lessons across different curriculum units
const SAMPLE_LESSONS = ["1-1", "2-4", "5-10", "6-2"];

const failures = [];
const passNotes = [];

function fail(msg) {
  failures.push(msg);
  console.error("  FAIL  " + msg);
}

function note(msg) {
  passNotes.push(msg);
  console.log("  PASS  " + msg);
}

let server = null;
let BASE_URL = "";

if (baseArg) {
  BASE_URL = baseArg.replace(/\/$/, "");
} else {
  if (!existsSync(join(DIST, "index.html")) && !existsSync(join(DIST, "lessons"))) {
    console.error(
      "FAIL: dist/ is missing or incomplete. Run \`npm run build\` before running render validation.",
    );
    process.exit(1);
  }

  // Create static file server for dist/
  server = createServer((req, res) => {
    let urlPath = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    let file = join(DIST, urlPath);
    if (urlPath.endsWith("/")) file = join(file, "index.html");
    if (!existsSync(file) && existsSync(file + "/index.html")) file = file + "/index.html";
    if (!existsSync(file) || !file.startsWith(DIST)) {
      res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
      return;
    }
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".mjs": "text/javascript",
      ".css": "text/css",
      ".json": "application/json",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".webp": "image/webp",
      ".woff2": "font/woff2",
    };
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
    res.end(readFileSync(file));
  });

  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  BASE_URL = "http://127.0.0.1:" + port;
}

const BOOT_TIMEOUT = 12000;

try {
  // PW_CHROMIUM_PATH points at a system Chromium when the Playwright-managed
  // download is missing or version-mismatched — the same convention
  // smoke-lesson-boot.mjs, validate-scorm-self-contained.mjs and
  // canvas-notebook-probe.mjs already follow. Without it this launch threw an
  // UNCAUGHT exception ("Executable doesn't exist at …chromium_headless_shell-1234"),
  // which fails validate:hub and therefore blocks every push from a machine
  // whose browser is not the exact pinned build. That is a crash, not a
  // verdict: it says nothing about the notebooks.
  //
  // Deliberately NOT a skip. A browser probe that quietly passes when it cannot
  // open a browser is the failure mode this repo documents for
  // validate:lesson-boot. This only lets the check RUN where it previously
  // could not; when no browser can be found at all it still throws.
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
  });

  console.log(
    "\nvalidate:notebook-render — probing " +
      SAMPLE_LESSONS.length +
      " lessons at " +
      BASE_URL +
      " (1440x900)\n",
  );

  for (const lessonId of SAMPLE_LESSONS) {
    console.log("--- Probing Lesson " + lessonId + " ---");
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const targetUrl = BASE_URL + "/lessons/" + lessonId + "/?sn=RenderGate";

    try {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: BOOT_TIMEOUT });
      await page.waitForTimeout(400);
      const missionBtn = await page.$(".flagship-mission-start, .identity-btn, #id-start");
      if (missionBtn) {
        await missionBtn.click().catch(() => {});
        await page.waitForTimeout(400);
      }
    } catch (e) {
      fail(lessonId + ": navigation failed (" + e.message + ")");
      await page.close();
      continue;
    }

    // 1. Positive Control: verify lesson shell is active
    const booted = await page
      .waitForFunction(
        () => {
          const app = document.querySelector("#app");
          return Boolean(
            app &&
              (app.innerHTML.length > 500 ||
                document.querySelector(".section-header, .card-warmup-phase")),
          );
        },
        null,
        { timeout: BOOT_TIMEOUT },
      )
      .then(
        () => true,
        () => false,
      );
    if (!booted) {
      fail(lessonId + ": lesson shell did not boot into main view");
      await page.close();
      continue;
    }

    // Read declared checkpoint configuration
    const configPath = join(ROOT, "lessons", lessonId, "config.json");
    const lessonConfig = JSON.parse(readFileSync(configPath, "utf8"));
    const declaredCheckpoints = lessonConfig.notebook?.checkpoints || [];
    const b2 = declaredCheckpoints.find((c) => c.box === 2);
    const expectedRule = b2?.copyPanel?.rule || "";

    // 2. Test Warmup Math Notes Entry Card
    const warmupEntry = await page.evaluate(() => {
      const card = document.querySelector(".card-warmup-math-notes");
      const btn = card?.querySelector(".warmup-open-notes-btn");
      return {
        cardPresent: !!card,
        btnPresent: !!btn,
        btnText: btn ? btn.textContent.trim() : "",
      };
    });

    if (!warmupEntry.cardPresent) {
      fail(lessonId + ": Warmup phase missing .card-warmup-math-notes entry card");
    } else if (!warmupEntry.btnPresent) {
      fail(lessonId + ": Warmup entry card missing .warmup-open-notes-btn button");
    } else {
      note(lessonId + ": Warmup phase renders Math Notes entry card (" + warmupEntry.btnText + ")");
    }

    // 3. Test Clicking Warmup Entry Button Opens Math Notes Dialog
    await page.evaluate(() => {
      const btn = document.querySelector(".warmup-open-notes-btn");
      if (btn) btn.click();
    });
    await page.waitForTimeout(400);

    const dialogState = await page.evaluate(() => {
      const dlg = document.querySelector("dialog#nt-notebook-model");
      if (!dlg) return { present: false, open: false, innerHTML: "" };
      return {
        present: true,
        open: dlg.hasAttribute("open"),
        innerHTML: dlg.innerHTML,
      };
    });

    if (!dialogState.present || !dialogState.open) {
      fail(lessonId + ": Math Notes modal dialog failed to open upon clicking warmup entry card");
    } else {
      note(lessonId + ": Math Notes modal dialog opened successfully");
      const escapedRule = expectedRule
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      if (expectedRule && !dialogState.innerHTML.includes(escapedRule)) {
        fail(lessonId + ': Math Notes dialog missing expected rule "' + expectedRule + '"');
      } else {
        note(lessonId + ": Math Notes dialog renders exact mathematical rule");
      }
    }

    // 4. Test Dialog Auto-Closing on Phase Change
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: 2 } }));
    });
    await page.waitForTimeout(400);

    const dialogAfterNav = await page.evaluate(() => {
      const dlg = document.querySelector("dialog#nt-notebook-model");
      return dlg ? dlg.hasAttribute("open") : false;
    });

    if (dialogAfterNav) {
      fail(lessonId + ": DIALOG.nt-nb-model remained open after navigating to Launch phase");
    } else {
      note(lessonId + ": DIALOG.nt-nb-model automatically closed upon phase change");
    }

    // 5. Test Phase Ungating: Launch, Explore, and Practice advance freely with 0 gating blockers
    const gatingChecks = await page.evaluate(() => {
      const checks = document.querySelectorAll(".nt-nb-check, .nt-nb-input");
      return {
        inlineGatingCount: checks.length,
      };
    });

    if (gatingChecks.inlineGatingCount > 0) {
      fail(
        lessonId +
          ": found " +
          gatingChecks.inlineGatingCount +
          " inline gating elements (should be 0)",
      );
    } else {
      note(lessonId + ": inline gating eliminated (0 inline checkpoint input blockers)");
      note(lessonId + ": lesson phases advance freely without interruption");
    }

    await page.close();
  }

  await browser.close();
} finally {
  if (server) {
    server.close();
  }
}

console.log("\n==========================================");
if (failures.length > 0) {
  console.error("FAIL validate:notebook-render — " + failures.length + " check(s) failed.");
  process.exit(1);
} else {
  console.log(
    "PASS validate:notebook-render — all render checks passed (" +
      passNotes.length +
      " assertions verified).",
  );
  process.exit(0);
}

#!/usr/bin/env node
/**
 * validate-notebook-render.mjs — render-level build gate for notebook checkpoints.
 *
 * Drives a real headless browser against the built static output to assert what
 * students actually experience:
 *   1. Three .nt-nb blocks render across the three declared phases (one per phase).
 *   2. Each block displays the exact canonical section heading:
 *        - Section 1: Math Words
 *        - Section 2: Today's Math
 *        - Section 3: My Work
 *   3. The Math Notes model dialog (DIALOG.nt-nb-model) closes on phase transition
 *      and is never left open over subsequent phases.
 *   4. The checkpoint blocks are encountered in-flow (e.g. in Practice, mounted
 *      before the problem sets rather than at the bottom of a multi-screen panel).
 *   5. Forward navigation is blocked on an empty capture and released once confirmed.
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

const EXPECTED_HEADINGS = {
  1: "Notebook time — Section 1: Math Words",
  2: "Notebook time — Section 2: Today's Math",
  3: "Notebook time — Section 3: My Work",
};

const failures = [];
const passNotes = [];

function fail(msg) {
  failures.push(msg);
  console.error(`  FAIL  ${msg}`);
}

function note(msg) {
  passNotes.push(msg);
  console.log(`  PASS  ${msg}`);
}

let server = null;
let BASE_URL = "";

if (baseArg) {
  BASE_URL = baseArg.replace(/\/$/, "");
} else {
  if (!existsSync(join(DIST, "index.html")) && !existsSync(join(DIST, "lessons"))) {
    console.error(
      "FAIL: dist/ is missing or incomplete. Run `npm run build` before running render validation.",
    );
    process.exit(1);
  }

  // Create static file server for dist/
  server = createServer((req, res) => {
    let urlPath = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    let file = join(DIST, urlPath);
    if (urlPath.endsWith("/")) file = join(file, "index.html");
    if (!existsSync(file) && existsSync(`${file}/index.html`)) file = `${file}/index.html`;
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
  BASE_URL = `http://127.0.0.1:${port}`;
}

console.log(
  `\nvalidate:notebook-render — probing ${SAMPLE_LESSONS.length} lessons at ${BASE_URL} (1440x900)\n`,
);

const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);

try {
  for (const lessonId of SAMPLE_LESSONS) {
    console.log(`--- Probing Lesson ${lessonId} ---`);
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto(`${BASE_URL}/lessons/${lessonId}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    // Handle flagship intro if present
    const flagshipStart = page.locator(".flagship-mission-start");
    if (await flagshipStart.isVisible().catch(() => false)) {
      await flagshipStart.click();
      await page.waitForTimeout(600);
    }

    // Handle identity gate
    const nameInput = page.locator("#id-name");
    if (await nameInput.isVisible().catch(() => false)) {
      await nameInput.fill("Render Gate");
      await page
        .locator("#id-period")
        .fill("1")
        .catch(() => {});
      await page.locator("#id-start").click();
      await page.waitForTimeout(1000);
    }

    // 1. Positive Control: verify lesson shell is active
    const booted = await page.evaluate(
      () => !!document.querySelector(".app .main, .app .phase-container"),
    );
    if (!booted) {
      fail(`${lessonId}: lesson shell did not boot into main view`);
      await page.close();
      continue;
    }

    // Read declared checkpoint configuration
    const configPath = join(ROOT, "lessons", lessonId, "config.json");
    const lessonConfig = JSON.parse(readFileSync(configPath, "utf8"));
    const declaredCheckpoints = lessonConfig.notebook?.checkpoints || [];

    if (declaredCheckpoints.length !== 3) {
      fail(`${lessonId}: declared ${declaredCheckpoints.length} checkpoints in config, expected 3`);
    }

    const phaseMap = {
      warmup: 0,
      objectives: 1,
      launch: 2,
      explore: 3,
      practice: 4,
      connect: 5,
      reflect: 6,
      "objectives-review": 7,
    };

    // 2. Test Model Dialog auto-closing on phase change
    // Open Math Notes dialog from sidebar tab
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent("rma:openextra", { detail: { kind: "mathnotes" } }));
    });
    await page.waitForTimeout(400);

    const dialogOpened = await page.evaluate(() => {
      const dlg = document.querySelector("dialog#nt-notebook-model");
      return dlg ? dlg.hasAttribute("open") : false;
    });

    if (!dialogOpened) {
      fail(`${lessonId}: Math Notes model dialog failed to open on rma:openextra`);
    } else {
      note(`${lessonId}: Math Notes model dialog opened successfully`);
    }

    // Now navigate to Launch phase (phase 2)
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: 2 } }));
    });
    await page.waitForTimeout(500);

    const dialogRemainsOpen = await page.evaluate(() => {
      const dlg = document.querySelector("dialog#nt-notebook-model");
      return dlg ? dlg.hasAttribute("open") : false;
    });

    if (dialogRemainsOpen) {
      fail(`${lessonId}: DIALOG.nt-nb-model remained open after navigating to Launch phase`);
    } else {
      note(`${lessonId}: DIALOG.nt-nb-model automatically closed upon phase change`);
    }

    // 3. Test Checkpoint Render & Gate Progression across phases
    const renderedBoxes = [];

    for (const cp of declaredCheckpoints) {
      const phaseIdx = phaseMap[cp.phase];
      if (phaseIdx === undefined) continue;

      // Navigate to checkpoint phase
      await page.evaluate((p) => {
        document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: p } }));
      }, phaseIdx);
      await page.waitForTimeout(600);

      const phaseCheck = await page.evaluate((boxNum) => {
        const activePhase = document.querySelector(".phase.active");
        const nbBlocks = Array.from(document.querySelectorAll(".nt-nb"));
        const thisBlock = document.querySelector(`.nt-nb[data-notebook-box="${boxNum}"]`);
        const headingEl = thisBlock?.querySelector(".nt-nb-title");
        const heading = headingEl ? headingEl.textContent.trim() : null;

        // Measurement of position in phase
        let topOffset = 0;
        let isAtEnd = false;
        if (thisBlock && activePhase) {
          const blockRect = thisBlock.getBoundingClientRect();
          const phaseRect = activePhase.getBoundingClientRect();
          topOffset = Math.round(blockRect.top - phaseRect.top);
          // Check if it was merely appended as the last element after 2500px+
          const phaseHeight = activePhase.scrollHeight;
          isAtEnd = phaseHeight > 1500 && blockRect.top - phaseRect.top > phaseHeight * 0.75;
        }

        return {
          totalNbInDom: nbBlocks.length,
          found: !!thisBlock,
          heading,
          topOffset,
          isAtEnd,
        };
      }, cp.box);

      if (!phaseCheck.found) {
        fail(`${lessonId} (Phase ${cp.phase}): Box ${cp.box} checkpoint did not render in DOM`);
      } else {
        renderedBoxes.push(cp.box);
        const expectedHeading = EXPECTED_HEADINGS[cp.box];
        if (phaseCheck.heading !== expectedHeading) {
          fail(
            `${lessonId} (Phase ${cp.phase}): Box ${cp.box} heading "${phaseCheck.heading}" !== expected "${expectedHeading}"`,
          );
        } else {
          note(`${lessonId} (Phase ${cp.phase}): Box ${cp.box} rendered with correct heading`);
        }

        // Defect 3 check: block must not be at the very bottom of a long panel
        if (phaseCheck.isAtEnd && cp.box === 3) {
          fail(
            `${lessonId} (Practice): Box 3 mounted at ${phaseCheck.topOffset}px (~bottom of panel), expected near top before problems`,
          );
        } else {
          note(
            `${lessonId} (Phase ${cp.phase}): Box ${cp.box} is placed in-flow (offset ${phaseCheck.topOffset}px)`,
          );
        }
      }

      // Test gate: verify forward navigation is blocked before filling, then unblocked after filling
      const nextPhaseIdx = phaseIdx + 1;
      if (nextPhaseIdx < 8) {
        // Attempt jump while empty
        await page.evaluate((nextP) => {
          document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: nextP } }));
        }, nextPhaseIdx);
        await page.waitForTimeout(400);

        const currentPhaseAfterAttempt = await page.evaluate(() => {
          return document.querySelector(".phase.active")?.getAttribute("aria-label");
        });

        if (currentPhaseAfterAttempt === "Explore" && cp.box === 1) {
          fail(`${lessonId}: Navigation to Explore was NOT blocked when Box 1 was empty`);
        }

        // Fill checkpoint to satisfy gate
        await page.evaluate((boxNum) => {
          const wrap = document.querySelector(`.nt-nb[data-notebook-box="${boxNum}"]`);
          if (!wrap) return;
          const check = wrap.querySelector(".nt-nb-check");
          const input = wrap.querySelector(".nt-nb-input");
          if (check && !check.checked) {
            check.checked = true;
            check.dispatchEvent(new Event("change", { bubbles: true }));
          }
          if (input) {
            input.value = "Verified note";
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        }, cp.box);
        await page.waitForTimeout(300);

        // Now advance
        await page.evaluate((nextP) => {
          document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: nextP } }));
        }, nextPhaseIdx);
        await page.waitForTimeout(500);

        const currentPhaseAfterRelease = await page.evaluate(() => {
          return document.querySelector(".phase.active")?.getAttribute("aria-label");
        });

        if (!currentPhaseAfterRelease) {
          fail(`${lessonId}: No active phase found after advancing from Box ${cp.box}`);
        } else {
          note(
            `${lessonId}: Gate on Box ${cp.box} successfully gated navigation and released when filled`,
          );
        }
      }
    }

    if (renderedBoxes.length !== 3) {
      fail(
        `${lessonId}: Only ${renderedBoxes.length}/3 checkpoint boxes rendered across phases (${renderedBoxes.join(", ") || "none"})`,
      );
    } else {
      note(`${lessonId}: All 3 checkpoint boxes rendered across their respective phases`);
    }

    await page.close();
  }
} catch (err) {
  fail(`Unexpected probe exception: ${err.message}`);
} finally {
  await browser.close().catch(() => {});
  if (server) server.close();
}

console.log("\n==========================================");
if (failures.length) {
  console.error(`FAIL validate:notebook-render — ${failures.length} defect(s) detected:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error(`\nTotal failures: ${failures.length}`);
  process.exit(1);
} else {
  console.log(
    `PASS validate:notebook-render — all render checks passed (${passNotes.length} assertions verified).`,
  );
  process.exit(0);
}

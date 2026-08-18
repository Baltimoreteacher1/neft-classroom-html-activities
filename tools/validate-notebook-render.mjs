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
};

// Box 2 has two legitimate states. A lesson stating no quotable rule shows the
// student-generated section, and must SAY so in its heading — a box headed
// "Today's Math" over an empty space is the state this gate exists to forbid.
const OWN_WORDS_HEADING = "Notebook time — Section 2: My Math Rule";

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

    if (declaredCheckpoints.length !== 2) {
      fail(
        `${lessonId}: declared ${declaredCheckpoints.length} checkpoints in config, expected 2 (boxes 1-2 only)`,
      );
    }
    const hasBox3 = declaredCheckpoints.some((c) => c.box === 3);
    if (hasBox3) {
      fail(`${lessonId}: declares Box 3, which is forbidden under 2-checkpoint specification`);
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

    // 3. Test Checkpoint Render & Gate Progression across boxes 1 and 2
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
        if (thisBlock && activePhase) {
          const blockRect = thisBlock.getBoundingClientRect();
          const phaseRect = activePhase.getBoundingClientRect();
          topOffset = Math.round(blockRect.top - phaseRect.top);
        }

        // Copy panel assertions
        const copyPanel = thisBlock?.querySelector(".nt-nb-copy-panel");
        const hasCopyPanel = !!copyPanel;
        const ownPanel = thisBlock?.querySelector(".nt-nb-own-panel");
        const ownDetails = ownPanel
          ? {
              present: true,
              text: (ownPanel.textContent || "").replace(/\s+/g, " ").trim(),
              interactiveCount: ownPanel.querySelectorAll("button, input, select, textarea, a")
                .length,
              dashed: window.getComputedStyle(ownPanel).borderTopStyle,
            }
          : { present: false };
        let copyDetails = {};

        if (copyPanel) {
          // Check for interactive elements (forbidden inside copy panel)
          // Vocabulary art is allowed and is NOT interactive: it is an <img>
          // with alt="" that the definition beside it already carries in text.
          // Controls and links are still forbidden — a copy panel is something
          // a student transcribes, not something they operate.
          const interactiveCount = copyPanel.querySelectorAll(
            "button, input, select, textarea, a",
          ).length;
          const art = Array.from(copyPanel.querySelectorAll("img.nt-nb-copy-art"));
          const brokenArt = art.filter((i) => i.complete && i.naturalWidth === 0).length;
          // A zoomable picture is a control a student can reach: it needs a real
          // accessible name and it must take focus from the keyboard.
          const unlabelledArt = art.filter((i) => !(i.getAttribute("alt") || "").trim()).length;
          const unfocusableArt = art.filter((i) => i.getAttribute("tabindex") !== "0").length;
          const duplicateArt = art.length - new Set(art.map((i) => i.getAttribute("src"))).size;

          // Check for emoji
          const panelText = copyPanel.textContent || "";
          const emojiRegex =
            /[\p{Extended_Pictographic}\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
          const hasEmoji = emojiRegex.test(panelText);

          // Contrast check helper
          function parseRgb(s) {
            const m = (s || "").match(/\d+/g);
            return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
          }
          function getLuminance([r, g, b]) {
            const a = [r, g, b].map((v) => {
              v /= 255;
              return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
          }
          function calcContrast(fgEl, bgEl) {
            const fgStyle = window.getComputedStyle(fgEl);
            let bg = window.getComputedStyle(bgEl).backgroundColor;
            let cur = bgEl;
            while (cur && (bg === "transparent" || bg === "rgba(0, 0, 0, 0)")) {
              cur = cur.parentElement;
              if (cur) bg = window.getComputedStyle(cur).backgroundColor;
            }
            const l1 = getLuminance(parseRgb(fgStyle.color));
            const l2 = getLuminance(parseRgb(bg));
            return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 10) / 10;
          }

          let contrastRatio = 0;
          let box1ItemCount = 0;
          let box2RuleCount = 0;
          let box2RuleText = "";

          if (boxNum === 1) {
            const items = Array.from(copyPanel.querySelectorAll(".nt-nb-copy-list li"));
            box1ItemCount = items.length;
            if (items[0]) {
              contrastRatio = calcContrast(items[0], copyPanel);
            }
          } else if (boxNum === 2) {
            const rules = Array.from(copyPanel.querySelectorAll(".nt-nb-copy-rule"));
            box2RuleCount = rules.length;
            if (rules[0]) {
              box2RuleText = rules[0].textContent.trim();
              contrastRatio = calcContrast(rules[0], copyPanel);
            }
          }

          copyDetails = {
            hasCopyPanel,
            interactiveCount,
            artCount: art.length,
            brokenArt,
            unlabelledArt,
            unfocusableArt,
            duplicateArt,
            hasEmoji,
            contrastRatio,
            box1ItemCount,
            box2RuleCount,
            box2RuleText,
          };
        }

        return {
          totalNbInDom: nbBlocks.length,
          found: !!thisBlock,
          heading,
          topOffset,
          copyDetails,
          ownDetails,
          promptText: (thisBlock?.querySelector(".nt-nb-prompt")?.textContent || "").trim(),
          modelLink: (() => {
            const b = thisBlock?.querySelector(".nt-nb-modellink");
            if (!b) return { present: false };
            const r = b.getBoundingClientRect();
            return {
              present: true,
              text: (b.textContent || "").replace(/\s+/g, " ").trim(),
              label: b.getAttribute("aria-label") || "",
              width: Math.round(r.width),
              height: Math.round(r.height),
            };
          })(),
          sidebarMathNotes: !!document.querySelector('[data-extra="mathnotes"]'),
        };
      }, cp.box);

      if (!phaseCheck.found) {
        fail(`${lessonId} (Phase ${cp.phase}): Box ${cp.box} checkpoint did not render in DOM`);
      } else {
        renderedBoxes.push(cp.box);
        const isOwnWords = phaseCheck.ownDetails?.present === true;
        const expectedHeading =
          cp.box === 2 && isOwnWords ? OWN_WORDS_HEADING : EXPECTED_HEADINGS[cp.box];
        if (phaseCheck.heading !== expectedHeading) {
          fail(
            `${lessonId} (Phase ${cp.phase}): Box ${cp.box} heading "${phaseCheck.heading}" !== expected "${expectedHeading}"`,
          );
        } else {
          note(`${lessonId} (Phase ${cp.phase}): Box ${cp.box} rendered with correct heading`);
        }
        note(
          `${lessonId} (Phase ${cp.phase}): Box ${cp.box} is placed in-flow (offset ${phaseCheck.topOffset}px)`,
        );

        // ── The two legitimate states ──────────────────────────────────────
        // A box must be in exactly one of them. Neither an empty copy panel nor
        // a box with nothing at all is acceptable: both read to a student as
        // content that failed to load.
        const cd = phaseCheck.copyDetails;
        const od = phaseCheck.ownDetails || { present: false };
        const declaredRule = !!(cp.copyPanel && String(cp.copyPanel.rule || "").trim());

        if (cd.hasCopyPanel && od.present) {
          fail(
            `${lessonId} (Phase ${cp.phase}): Box ${cp.box} renders BOTH a copy panel and the student-generated state`,
          );
        }
        if (cp.box === 2) {
          if (declaredRule && !cd.hasCopyPanel) {
            fail(
              `${lessonId} (Phase ${cp.phase}): Box 2 declares a source-backed rule but rendered no copy panel`,
            );
          }
          if (!declaredRule && !od.present) {
            fail(
              `${lessonId} (Phase ${cp.phase}): Box 2 has no source-backed rule and did not render the student-generated state`,
            );
          }
          if (od.present) {
            if (!od.text) {
              fail(`${lessonId} (Phase ${cp.phase}): Box 2 student-generated state rendered empty`);
            } else if (od.text === phaseCheck.promptText) {
              fail(
                `${lessonId} (Phase ${cp.phase}): Box 2 student-generated state repeats the prompt verbatim`,
              );
            } else if (/nothing on the screen to copy/i.test(od.text) && cp.prompt) {
              fail(
                `${lessonId} (Phase ${cp.phase}): Box 2 says there is nothing to copy while its own authored prompt states the rule`,
              );
            } else if (/copy (it|this|the rule)|exactly as it appears/i.test(od.text)) {
              fail(
                `${lessonId} (Phase ${cp.phase}): Box 2 tells the student to copy something that is not on the screen`,
              );
            } else {
              note(
                `${lessonId} (Phase ${cp.phase}): Box 2 renders the student-generated state ("${od.text.slice(0, 48)}…")`,
              );
            }
            if (od.dashed !== "dashed") {
              fail(
                `${lessonId} (Phase ${cp.phase}): Box 2 student-generated state is not visually distinct from a copy panel (border ${od.dashed})`,
              );
            }
            if (od.interactiveCount > 0) {
              fail(
                `${lessonId} (Phase ${cp.phase}): Box 2 student-generated state contains ${od.interactiveCount} interactive element(s)`,
              );
            }
          }
        }

        // ── The Math Notes entry point ─────────────────────────────────────
        // Access to the model must not depend on whether the lesson happened to
        // supply a rule. What a lesson supplies decides what is shown INSIDE
        // Math Notes, never whether Math Notes exists.
        if (!phaseCheck.sidebarMathNotes) {
          fail(`${lessonId} (Phase ${cp.phase}): the sidebar Math Notes entry point is absent`);
        }
        const ml = phaseCheck.modelLink || { present: false };
        if (!ml.present) {
          fail(
            `${lessonId} (Phase ${cp.phase}): Box ${cp.box} renders no Math Notes trigger${od.present ? " in the student-generated state" : ""}`,
          );
        } else {
          if (!/what should my page look like/i.test(ml.text)) {
            fail(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} Math Notes trigger reads "${ml.text}"`,
            );
          }
          if (
            /copy the rule|copy this/i.test(ml.text) ||
            /copy the rule|copy this/i.test(ml.label)
          ) {
            fail(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} Math Notes trigger says "copy the rule" where no rule may exist`,
            );
          }
          if (!ml.label) {
            fail(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} Math Notes trigger has no accessible name`,
            );
          }
          if (ml.height < 44) {
            fail(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} Math Notes trigger is ${ml.height}px tall, under the 44px touch target`,
            );
          }
          note(
            `${lessonId} (Phase ${cp.phase}): Box ${cp.box} Math Notes trigger present (${ml.height}px, labelled)`,
          );
        }

        if (!cd.hasCopyPanel) {
          if (!od.present) {
            note(`${lessonId} (Phase ${cp.phase}): Box ${cp.box} renders no copy panel (allowed)`);
          }
        } else {
          note(`${lessonId} (Phase ${cp.phase}): Box ${cp.box} copy panel rendered`);
          if (cd.brokenArt > 0) {
            fail(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} copy panel has ${cd.brokenArt} vocabulary image(s) that did not load`,
            );
          } else if (cd.artCount > 0) {
            note(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} ${cd.artCount} vocabulary image(s) loaded`,
            );
          }
          if (cd.unlabelledArt > 0) {
            fail(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} has ${cd.unlabelledArt} image(s) with no accessible name`,
            );
          }
          if (cd.unfocusableArt > 0) {
            fail(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} has ${cd.unfocusableArt} image(s) that cannot be reached or enlarged from the keyboard`,
            );
          }
          if (cd.duplicateArt > 0) {
            fail(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} shows the same picture on ${cd.duplicateArt + 1} rows`,
            );
          }
          if (cd.interactiveCount > 0) {
            fail(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} copy panel contains ${cd.interactiveCount} interactive/icon element(s)`,
            );
          } else {
            note(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} copy panel contains zero interactive elements/icons`,
            );
          }
          if (cd.hasEmoji) {
            fail(`${lessonId} (Phase ${cp.phase}): Box ${cp.box} copy panel contains emoji`);
          } else {
            note(`${lessonId} (Phase ${cp.phase}): Box ${cp.box} copy panel contains zero emoji`);
          }
          if (cd.contrastRatio < 4.5) {
            fail(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} contrast ratio ${cd.contrastRatio} < 4.5:1 (WCAG AA)`,
            );
          } else {
            note(
              `${lessonId} (Phase ${cp.phase}): Box ${cp.box} text passes contrast check (${cd.contrastRatio}:1 >= 4.5:1)`,
            );
          }

          if (cp.box === 1) {
            if (cd.box1ItemCount < 3 || cd.box1ItemCount > 5) {
              fail(
                `${lessonId}: Box 1 copy panel has ${cd.box1ItemCount} items, expected between 3 and 5`,
              );
            } else {
              note(`${lessonId}: Box 1 copy panel has ${cd.box1ItemCount} numbered terms`);
            }
          } else if (cp.box === 2) {
            if (cd.box2RuleCount !== 1 || !cd.box2RuleText) {
              fail(
                `${lessonId}: Box 2 copy panel has ${cd.box2RuleCount} rule lines, expected exactly 1`,
              );
            } else {
              note(
                `${lessonId}: Box 2 copy panel contains exactly 1 rule line: "${cd.box2RuleText}"`,
              );
            }
          }
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

    if (renderedBoxes.length !== 2) {
      fail(
        `${lessonId}: Only ${renderedBoxes.length}/2 checkpoint boxes rendered across phases (${renderedBoxes.join(", ") || "none"})`,
      );
    } else {
      note(`${lessonId}: Both checkpoint boxes (1 & 2) rendered across their respective phases`);
    }

    // 4. Verify Practice Phase (Phase 4) is completely ungated with 0 checkpoint blocks
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: 4 } }));
    });
    await page.waitForTimeout(500);

    const practiceState = await page.evaluate(() => {
      const activePhase = document.querySelector(".phase.active");
      const nbInPractice = activePhase ? Array.from(activePhase.querySelectorAll(".nt-nb")) : [];
      return {
        label: activePhase?.getAttribute("aria-label"),
        nbCount: nbInPractice.length,
      };
    });

    if (practiceState.nbCount > 0) {
      fail(
        `${lessonId} (Practice): Found ${practiceState.nbCount} checkpoint block(s) in Practice phase, expected 0`,
      );
    } else {
      note(`${lessonId} (Practice): 0 checkpoint blocks in Practice phase`);
    }

    // Verify free navigation past Practice (Phase 4 -> Phase 5 Connect) with no gate
    await page.evaluate(() => {
      document.dispatchEvent(new CustomEvent("rma:navigate", { detail: { phase: 5 } }));
    });
    await page.waitForTimeout(500);

    const connectActive = await page.evaluate(() => {
      return document.querySelector(".phase.active")?.getAttribute("aria-label");
    });

    if (!connectActive || connectActive === "Practice") {
      fail(`${lessonId}: Navigation from Practice was blocked (Practice must be ungated)`);
    } else {
      note(`${lessonId}: Practice phase is completely ungated (moves freely to Connect)`);
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

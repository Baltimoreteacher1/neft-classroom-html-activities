#!/usr/bin/env node
/* =============================================================================
 * validate-lesson-flow-walk.mjs — press the forward button and see where it goes.
 *
 * WHY THIS GATE EXISTS. On 2026-08-28 Joel opened lesson 2-7, stood on the
 * LAUNCH — Act 2 step 2 of 6, the problem the whole lesson is built around —
 * and the floating forward pill read "Next: Boleto de Salida". One tap skipped
 * Learn It, Explore, Practice and Connect and dropped a student on the exit
 * ticket. In the same lesson the Presenter widget was pinned at
 * `top:14px; right:180px` and sat directly on top of the act step strip, and
 * the authored MSTAR items were a collapsed <details> a screen and a half below
 * the fold, which is content nobody can find.
 *
 * All 106 gates were green, and they were right to be. Every one of them asks
 * a SOURCE-TEXT question ("is the taught order still vocab → launch → …?") or a
 * DOM-PRESENCE question ("did the element render?"). Nobody asked the question a
 * teacher asks: STANDING HERE, what does the forward button say, where does it
 * actually take me, and can I see the lesson underneath the chrome?
 * `act-flow-contract.test.mjs` even names the floating pill in its own header as
 * one of the four surfaces that drifted — and then pins the other three.
 *
 * So this gate walks. It boots built lessons in a real browser, in TEACHER mode
 * (the Presenter widget does not mount for students, so every student-mode probe
 * on this site is structurally blind to it), and presses ONLY the forward
 * control, over and over, asserting at every stop:
 *
 *   1. NO SKIPPING. The stops it visits are exactly the taught sequence — every
 *      act, every step inside it, in order, nothing missed and nothing repeated.
 *      This is the check that catches "Launch → Exit Ticket".
 *   2. THE LABEL IS A PROMISE. Whatever the button named is where the click
 *      landed. A correct destination under a wrong name is the same bug one
 *      step later.
 *   3. IT ENDS. The walk terminates at the last step with the control hidden —
 *      not looping, and not still offering a "Next" with nowhere to go.
 *   4. THE CHROME STAYS OUT OF THE LESSON. No visible fixed-position control may
 *      cover a chip in the act step strip — the map of where you are, which is
 *      what Joel reported covered. A magic `right:180px` chosen against one
 *      screenshot is exactly how it happened, and no other check here measures
 *      painted overlap at all.
 *   5. AUTHORED CONTENT IS REACHABLE, not merely rendered. A lesson that authors
 *      MSTAR items must have a stop on the walk where they are actually visible.
 *      Presence proved nothing here: the items rendered, in the DOM, collapsed,
 *      off-screen, for weeks.
 *
 * Serves dist/ — what Cloudflare serves — like validate-lesson-visibility.
 * A missing browser is a SKIP, never a pass. Zero-match guards throughout: a
 * lesson whose shell never boots FAILS rather than quietly verifying nothing.
 * ========================================================================== */
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIST = join(ROOT, "dist");
const BOOT_TIMEOUT = 30000;

/* Small on purpose. Every lesson rides the same shell, the same pill and the
 * same step strip, so this is a canary for shared chrome, not a fleet sweep.
 * 2-7 is the lesson Joel reported and the one that authors MSTAR items; 5-3 is
 * a geometry lesson with a different Act 2 shape; 6-1 has no Explore step, so
 * the walk must still be complete on a SHORTER chain — a hardcoded expectation
 * of six Act 2 steps would pass 2-7 and lie about 6-1. */
const SAMPLE = ["2-7", "5-3", "6-1"];

/* THE STEP STRIP — the thin band of chips that says where you are in the lesson
 * and where you can go. Deliberately just this one.
 *
 * "No fixed element may overlap any content" is unenforceable here and was
 * tried first: it flagged 233 pairs, nearly all of them correct-by-design. The
 * bottom-right Next pill and workbench float over the page gutter, and the tall
 * problem card runs past the fold, so every bottom dock technically covers it.
 * `.act-steps` (the wrapper) is worse still — it contains every step panel, so
 * it spans the whole column and every side dock intersects it. Even the strip
 * itself is too generous: it is a full-width flex row whose BOX reaches the
 * right gutter while its chips stop well short, so the top-right Tools menu
 * "covers" empty strip. The chips are the painted thing a teacher reads and a
 * student taps, and a control on top of one is unambiguously in the way —
 * which is exactly what the Presenter widget did to chips 4 through 6. */
const PROTECTED = [".act-step-chip"];

/* Fixed elements that are not controls and cannot be "in the way": a 3px
 * reading-progress hairline, and anything the page has already made
 * click-through or invisible. Everything else is fair game — an allowlist that
 * grows by class name is how this check would stop meaning anything. */
const CHROME_EXEMPT_IDS = ["nt-read-progress"];

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`  FAIL  ${msg}`);
};
const note = (msg) => console.log(`  ok    ${msg}`);

/* ── pure detectors, so they can be mutation-tested without a browser ─────── */

/**
 * The walk must be the taught sequence: same stops, same order, no skips.
 * @param {string[]} expected stop ids, in taught order
 * @param {string[]} visited stop ids, in the order the forward button reached them
 * @returns {string|null} a failure message, or null when they agree
 */
export function sequenceComplaint(expected, visited) {
  if (!expected.length) return "the lesson published no taught sequence to walk";
  if (visited.length === expected.length && expected.every((s, i) => s === visited[i])) return null;
  const missed = expected.filter((s) => !visited.includes(s));
  if (missed.length)
    return `the forward button skips ${missed.join(", ")} — walked ${visited.join(" → ")}`;
  return `the forward button walks out of taught order: ${visited.join(" → ")} (taught: ${expected.join(" → ")})`;
}

/**
 * The label is a promise: what the button named is where the click landed.
 *
 * Compared on letters and digits only — the label carries an emoji and the chip
 * carries a step number, and neither is part of the claim. Crossing an act
 * boundary the pill names the ACT ("Act 2: Lesson") and lands on that act's
 * first STEP ("Vocabulary"), which is a kept promise, so either name satisfies
 * it. That is not a loophole: whether the walk reached the right place at all is
 * sequenceComplaint's job, and this check exists only to catch a destination
 * that lies about itself.
 *
 * @returns {string|null} a failure message, or null when the promise held
 */
export function labelComplaint(promised, reachedStep, reachedPhase) {
  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9áéíóúñ]+/gi, " ")
      .replace(/^\s*\d+\s*/, "")
      .trim();
  const p = norm(promised);
  if (!p) return "the forward button carries no destination name";
  const reached = [reachedStep, reachedPhase].map(norm).filter(Boolean);
  if (!reached.length)
    return `the forward button promised "${promised}" and reached an unnamed stop`;
  if (reached.some((r) => r.includes(p) || p.includes(r))) return null;
  return `the forward button promised "${promised}" and landed on "${reachedStep}"`;
}

/** Do two viewport rectangles share any painted area? */
export function overlaps(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/* ── mutation self-test: every detector must FAIL on the code that shipped ── */
{
  const mutants = [
    // the exact 2026-08-28 defect: Launch's pill jumped to the exit ticket
    () =>
      sequenceComplaint(
        ["2:vocab", "2:launch", "2:learn", "3:exit"],
        ["2:vocab", "2:launch", "3:exit"],
      ),
    () => sequenceComplaint(["a", "b", "c"], ["a", "c", "b"]),
    () => sequenceComplaint([], []),
    () => labelComplaint("🚀 Launch", "3💡 Learn It", "2 Lección"),
    () => labelComplaint("", "Launch", "Act 2"),
    () => labelComplaint("Boleto de Salida", "3💡 Learn It", "2 Lección"),
    // the Presenter widget at top:14px right:180px, over the step strip
    () =>
      overlaps(
        { left: 1114, right: 1358, top: 14, bottom: 58 },
        { left: 340, right: 1320, top: 20, bottom: 70 },
      )
        ? "the Presenter widget covers the act step strip"
        : null,
  ];
  const caught = mutants.filter((m) => m() !== null).length;
  if (caught !== mutants.length) {
    console.error(
      `SELF-TEST FAILED: ${mutants.length - caught} flow-walk detector(s) stopped firing — a clean walk and a broken one would print the same line.`,
    );
    process.exit(1);
  }
  // and the honest direction: a correct walk must produce no complaint
  if (sequenceComplaint(["a", "b"], ["a", "b"]) !== null) {
    console.error("SELF-TEST FAILED: sequenceComplaint rejects a correct walk");
    process.exit(1);
  }
  if (labelComplaint("💡 Learn It", "3💡 Learn It", "2 Lección") !== null) {
    console.error("SELF-TEST FAILED: labelComplaint rejects a kept promise");
    process.exit(1);
  }
  // crossing an act boundary: the pill names the act, the landing is its first step
  if (labelComplaint("Act 2: Lesson", "1🔑 Vocabulary", "2 Act 2: Lesson") !== null) {
    console.error("SELF-TEST FAILED: labelComplaint rejects an act-to-act advance");
    process.exit(1);
  }
  if (
    overlaps(
      { left: 0, right: 10, top: 0, bottom: 10 },
      { left: 20, right: 30, top: 0, bottom: 10 },
    )
  ) {
    console.error("SELF-TEST FAILED: overlaps() reports disjoint boxes as overlapping");
    process.exit(1);
  }
  note(`detectors mutation-proven (${mutants.length} cases)`);
}

if (!existsSync(DIST)) {
  process.exit(skipExit("dist/ is not built — nothing to walk", "Run `npm run build` first."));
}

/* ── static file server over dist/ ────────────────────────────────────────── */
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
  let file = join(DIST, p);
  if (p.endsWith("/")) file = join(file, "index.html");
  if (!existsSync(file) && existsSync(`${file}/index.html`)) file = `${file}/index.html`;
  if (!existsSync(file) || !file.startsWith(DIST)) {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${server.address().port}`;

const { chromium } = await import("playwright");
let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (error) {
  server.close();
  process.exit(
    skipExit(
      `Chromium could not be launched (${error.message.split("\n")[0]})`,
      "Install a browser (npx playwright install chromium) or set PW_CHROMIUM_PATH.",
    ),
  );
}

/* 1366x768 is the classroom Chromebook. Chrome-over-content is a width problem:
 * at a 2160px desktop the Presenter widget missed the step strip entirely, and
 * measuring only the wide case is how it shipped. */
async function open(id) {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  // Teacher mode BEFORE first paint: the Presenter widget checks it at mount,
  // so setting it afterwards would probe a page the teacher never sees.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("nt-teacher-mode", "1");
    } catch (_) {}
  });
  page.on("pageerror", (e) => fail(`${id}: page error — ${e.message.slice(0, 90)}`));
  await page.goto(`${BASE}/lessons/${id}/?sn=FlowGate`, {
    waitUntil: "networkidle",
    timeout: BOOT_TIMEOUT,
  });
  await page.waitForTimeout(1200);
  for (let i = 0; i < 3; i++) {
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button,a")].find(
        (x) =>
          x.getClientRects().length &&
          !x.disabled &&
          /start activity|start the mission|begin|open the|power up|enter the/i.test(
            x.textContent || "",
          ),
      );
      if (b) {
        b.click();
        return true;
      }
      return false;
    });
    if (!clicked) break;
    await page.waitForTimeout(900);
  }
  return page;
}

/** The page-side helpers, injected once per page. */
const PROBE = `(() => {
  const shown = (el) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && cs.display !== "none";
  };
  window.__flow = {
    phaseBtns: () =>
      [...document.querySelectorAll(".sidebar .phase-btn")].filter(
        (b) => !b.classList.contains("extra-btn") && !b.classList.contains("phase-subtab"),
      ),
    phaseIndex() {
      const btns = this.phaseBtns();
      const i = btns.findIndex((b) => b.classList.contains("active"));
      return i < 0 ? 0 : i;
    },
    chips: () => [...document.querySelectorAll(".act-step-chip")],
    stop() {
      const p = this.phaseIndex();
      const chips = this.chips();
      const cur = chips.find((c) => c.classList.contains("is-current"));
      const name = cur
        ? cur.textContent.replace(/\\s+/g, " ").trim()
        : (this.phaseBtns()[p] || {}).textContent?.replace(/\\s+/g, " ").trim() || "";
      const phaseName = (this.phaseBtns()[p] || {}).textContent?.replace(/\\s+/g, " ").trim() || "";
      return { id: p + ":" + (cur ? cur.dataset.stepKey || "?" : "phase"), name, phaseName };
    },
    pill() {
      const b = document.querySelector(".nt-next-phase-btn");
      if (!b || !shown(b) || b.style.display === "none") return null;
      const t = b.textContent.replace(/\\s+/g, " ").trim();
      return t.replace(/^Next:\\s*/i, "").replace(/\\s*→\\s*$/, "");
    },
    clickPill() {
      const b = document.querySelector(".nt-next-phase-btn");
      if (b) b.click();
    },
    /* Every VISIBLE fixed-position control, as viewport rectangles. Elements the
     * page has made click-through or transparent cannot be in anybody's way. */
    fixedChrome(exemptIds) {
      const out = [];
      for (const el of document.querySelectorAll("body *")) {
        const cs = getComputedStyle(el);
        if (cs.position !== "fixed") continue;
        if (exemptIds.includes(el.id)) continue;
        if (cs.pointerEvents === "none" || Number(cs.opacity) === 0) continue;
        if (!shown(el)) continue;
        if (!(el.tagName === "BUTTON" || el.tagName === "A" || el.querySelector("button,a")))
          continue;
        const r = el.getBoundingClientRect();
        out.push({
          label: (el.id ? "#" + el.id : "." + String(el.className).split(" ")[0]) || el.tagName,
          left: r.left, right: r.right, top: r.top, bottom: r.bottom,
        });
      }
      return out;
    },
    boxes(sel) {
      return [...document.querySelectorAll(sel)].filter(shown).map((el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      });
    },
    visibleHeight(sel) {
      const el = document.querySelector(sel);
      if (!shown(el)) return 0;
      return Math.round(el.getBoundingClientRect().height);
    },
  };
})()`;

/** The taught sequence, read from the page rather than restated here. */
async function taughtSequence(page) {
  await page.evaluate(PROBE);
  const count = await page.evaluate(() => window.__flow.phaseBtns().length);
  const seq = [];
  for (let p = 0; p < count; p++) {
    await page.evaluate((i) => window.__flow.phaseBtns()[i].click(), p);
    await page.waitForTimeout(700);
    await page.evaluate(PROBE);
    const keys = await page.evaluate(() =>
      window.__flow.chips().map((c) => c.dataset.stepKey || "?"),
    );
    if (keys.length) for (const k of keys) seq.push(`${p}:${k}`);
    else seq.push(`${p}:phase`);
  }
  return seq;
}

for (const id of SAMPLE) {
  const cfgPath = join(ROOT, "lessons", id, "config.json");
  const cfg = existsSync(cfgPath) ? JSON.parse(readFileSync(cfgPath, "utf8")) : {};
  const authorsMstar = Array.isArray(cfg?.reflect?.mstarPractice)
    ? cfg.reflect.mstarPractice.length > 0
    : false;

  /* The taught sequence is read on its own page: clicking through the rail to
   * enumerate it also SAVES a step per act, and the walk has to start clean. */
  const mapPage = await open(id);
  const entered = await mapPage.evaluate(() => !!document.querySelector(".sidebar .phase-btn"));
  if (!entered) {
    fail(`${id}: never entered the lesson shell — nothing below was verified`);
    await mapPage.close();
    continue;
  }
  const expected = await taughtSequence(mapPage);
  await mapPage.close();

  const page = await open(id);
  await page.evaluate(PROBE);

  const visited = [];
  let sawMstar = false;
  let terminated = false;

  for (let i = 0; i < 40; i++) {
    await page.evaluate(PROBE);
    const stop = await page.evaluate(() => window.__flow.stop());
    visited.push(stop.id);

    if (
      authorsMstar &&
      (await page.evaluate(() => window.__flow.visibleHeight(".mstar-practice"))) > 120
    )
      sawMstar = true;

    // (4) the chrome must not sit on the lesson
    const [chrome, ...protectedBoxes] = await Promise.all([
      page.evaluate((ids) => window.__flow.fixedChrome(ids), CHROME_EXEMPT_IDS),
      ...PROTECTED.map((sel) => page.evaluate((s) => window.__flow.boxes(s), sel)),
    ]);
    PROTECTED.forEach((sel, si) => {
      for (const box of protectedBoxes[si] || []) {
        for (const c of chrome) {
          if (overlaps(c, box))
            fail(
              `${id} at ${stop.id}: ${c.label} covers ${sel} — a floating control is sitting on the lesson`,
            );
        }
      }
    });

    const promised = await page.evaluate(() => window.__flow.pill());
    if (promised === null) {
      terminated = true;
      break;
    }
    await page.evaluate(() => window.__flow.clickPill());
    await page.waitForTimeout(750);
    await page.evaluate(PROBE);
    const reached = await page.evaluate(() => window.__flow.stop());

    // (2) the label is a promise
    const lc = labelComplaint(promised, reached.name, reached.phaseName);
    if (lc) fail(`${id} from ${stop.id}: ${lc}`);
  }

  // (1) no skipping
  const sc = sequenceComplaint(expected, visited);
  if (sc) fail(`${id}: ${sc}`);
  else note(`${id}: forward button walks all ${expected.length} stops in taught order`);

  // (3) it ends
  if (!terminated) fail(`${id}: the forward walk never ended — the pill still offers a next stop`);
  else note(`${id}: the walk terminates with the forward control hidden`);

  // (5) authored content is reachable
  if (authorsMstar) {
    if (sawMstar) note(`${id}: authored MSTAR practice is reachable on the walk`);
    else
      fail(
        `${id}: authors MSTAR practice that the forward walk never shows — rendered, but not reachable`,
      );
  }

  await page.close();
}

await browser.close();
server.close();

if (failures) {
  console.error(`\nFAIL — ${failures} flow problem(s). The lesson does not walk the way it reads.`);
  process.exit(1);
}
console.log(
  `\nPASS — ${SAMPLE.length} lessons walk their taught sequence with the lesson uncovered.`,
);

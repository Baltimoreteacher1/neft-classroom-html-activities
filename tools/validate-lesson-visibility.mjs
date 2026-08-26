#!/usr/bin/env node
/* =============================================================================
 * validate-lesson-visibility.mjs — content must be SEEN, not merely present.
 *
 * WHY THIS GATE EXISTS. On 2026-08-26 the Launch takeover rendered today's
 * word problem, its official figure and the guided solve — and showed a 64px
 * badge row. The fullpage panel is position:fixed (one viewport tall) and
 * `body.editorial .phase` makes every phase a column flex container, whose
 * children SHRINK by default; content taller than the screen was compressed
 * instead of scrolled, and overflow:hidden clipped the rest. Every DOM-level
 * probe passed, because the elements existed. Joel reported "the launch is
 * missing" four separate times while 101/101 gates stayed green.
 *
 * Presence is not the contract; visible pixels are. This gate boots built
 * lessons in a real browser and asserts RENDERED GEOMETRY:
 *
 *   1. No clipped card: a visible .card inside an open takeover panel must not
 *      have scrollHeight meaningfully beyond clientHeight (the compressed
 *      launch card was 695 inside 64). This is the whole CLASS of the bug,
 *      wherever it next appears.
 *   2. The Launch panel's problem card is tall enough to read, its narrative
 *      has real height, and its figure (when the lesson ships one) is loaded
 *      AND wide enough to read the numbers it carries.
 *   3. Exactly one visible forward button per act — two ways forward was its
 *      own shipped bug.
 *   4. Part 2's warm-up carries no interactive division lab.
 *   5. The WARM-UP IS ANSWERABLE. Every lesson opens on it, so it is the first
 *      thing that can be broken and the last thing anyone looks at. This asserts
 *      the geometry AND the behaviour a student needs: at least four answer
 *      controls with real painted boxes (not merely present in the DOM), a
 *      Submit button big enough to hit, and — after actually selecting answers
 *      and clicking it — a visible score. Presence proves none of those: a
 *      radio inside a zero-height card, a Submit under a fixed footer, and a
 *      submit handler that throws before writing the badge all pass a DOM probe
 *      and all leave a student unable to start the day.
 *
 * Plus two STATIC pins that need no browser:
 *   • the takeover offset reads var(--nt-rail-w) — it was a hardcoded copy of
 *     the rail width (260px) that silently drifted when the rail became 300px;
 *   • the anti-compression rules (block layout + flex-shrink:0 at the
 *     specificity that beats body.editorial .phase) are still in the sheet.
 *
 * Serves dist/ — the thing Cloudflare serves — like validate-notebook-render.
 * Zero-match guards throughout: a selector that matches nothing is a FAILURE,
 * not a pass, because this session's worst probes "passed" by measuring the
 * wrong class name.
 * ========================================================================== */
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { skipExit } from "./lib/skip-exit.mjs";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const DIST = join(ROOT, "dist");
const BOOT_TIMEOUT = 30000;

// One migrated decimal lesson, one migrated geometry lesson, one untouched
// themed lesson, one Part 2. Small on purpose: this is a canary for the shared
// shell, not a fleet sweep — every lesson rides the same panels.
const SAMPLE = ["2-7", "5-3", "6-1"];
const PART2 = "2-7-part2";
/* The warm-up canary. 2-7 is the long-division lesson whose warm-up was rebuilt
 * as an on-ramp; 6-1 is decimal division. Two is deliberate — every lesson rides
 * the same renderWarmupPhase() card, so this is a canary for that shared shell,
 * not a fleet sweep. */
const WARMUP_SAMPLE = ["2-7", "6-1"];

let failures = 0;
const fail = (msg) => {
  failures += 1;
  console.error(`  FAIL  ${msg}`);
};
const note = (msg) => console.log(`  ok    ${msg}`);

/* ── static pins ──────────────────────────────────────────────────────────── */
{
  const css = readFileSync(join(ROOT, "engine/styles/design-system.css"), "utf8");
  if (!/inset:\s*0 0 0 var\(--nt-rail-w/.test(css)) {
    fail(
      "takeover offset no longer reads var(--nt-rail-w) — a hardcoded rail width will drift again",
    );
  }
  if (/inset:\s*0 0 0 (?:220|260|300)px/.test(css)) {
    fail("a takeover rule carries a hardcoded rail offset — use var(--nt-rail-w)");
  }
  if (!/body\.editorial \.phase\.extra-panel--fullpage[\s\S]{0,200}display:\s*block/.test(css)) {
    fail(
      "the anti-compression rule is gone: body.editorial .phase turns takeovers into shrinking flex columns without it",
    );
  }
  if (!failures) note("static pins — rail variable + anti-compression rules present");
}

/* ── what a student can actually click ────────────────────────────────────────
 * ONE definition, used by both warm-up probes, because they render through
 * different components and a second copy would drift.
 *
 * The clickable target is NOT always the radio. Act 1's own warm-up card styles
 * native 20x20 inputs directly, but the practice renderer Part 2 uses puts a
 * VISUALLY HIDDEN input inside a painted `label.mc-option-label` — the standard
 * accessible pattern. Measuring the input there counts 0 and reads as a broken
 * page; measuring `input[type=radio], label` in the DOM (what this file used to
 * do) counts anything at all and reads as a working one. Neither is the
 * question. The question is whether the thing a student presses has pixels, so
 * each radio is mapped to its label when it has one, and THAT is measured.
 * -------------------------------------------------------------------------- */
function countAnswerTargets(rootSelector) {
  const painted = (node, min = 10) => {
    if (!node || !node.getClientRects().length) return false;
    const box = node.getBoundingClientRect();
    if (box.width < min || box.height < min) return false;
    const style = getComputedStyle(node);
    return style.visibility !== "hidden" && Number(style.opacity) > 0.05;
  };
  const root = document.querySelector(rootSelector);
  if (!root) return { root: false, found: 0, visible: 0 };
  const radios = [...root.querySelectorAll("input[type=radio]")];
  const targets = radios.map((radio) => radio.closest("label") || radio);
  return {
    root: true,
    found: targets.length,
    visible: targets.filter((t) => painted(t)).length,
  };
}

/* ── serve dist ───────────────────────────────────────────────────────────── */
if (!existsSync(join(DIST, "lessons", SAMPLE[0], "index.html"))) {
  console.error("FAIL: dist/ is missing or incomplete. Run `npm run build` first.");
  process.exit(1);
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
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
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

/* A missing browser is a SKIP, never a pass, and never an uncaught throw.
 * Before this, a container whose pinned Chromium build did not match the
 * installed one died with a raw stack trace after the static pins had already
 * printed "ok" — which reads, in a scrolling qa:loop, like the gate ran.
 * PW_CHROMIUM_PATH points at a system Chromium when the Playwright-managed
 * download is missing or version-mismatched, the same lever every other
 * browser-driving check here uses. */
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

async function open(id) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on("pageerror", (e) => fail(`${id}: page error — ${e.message.slice(0, 90)}`));
  await page.goto(`${BASE}/lessons/${id}/?sn=VisGate`, {
    waitUntil: "networkidle",
    timeout: BOOT_TIMEOUT,
  });
  await page.waitForTimeout(1200);
  // through any cover (flagship missions word their buttons differently)
  for (let i = 0; i < 3; i++) {
    const clicked = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button,a")].find(
        (x) =>
          x.getClientRects().length &&
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
    await page.waitForTimeout(1000);
  }
  return page;
}

for (const id of SAMPLE) {
  const page = await open(id);

  const entered = await page.evaluate(() => !!document.querySelector(".sidebar .phase-btn"));
  if (!entered) {
    fail(`${id}: never entered the lesson shell — nothing below was verified`);
    await page.close();
    continue;
  }

  /* The warm-up first: it is the phase the lesson lands on, and everything
   * below navigates away from it. */
  if (WARMUP_SAMPLE.includes(id)) await checkWarmupAnswerable(page, id);

  // exactly one visible way forward in Act 1
  const fwd = await page.evaluate(() =>
    [...document.querySelectorAll(".phase.active button")]
      .filter((b) => b.getClientRects().length)
      .map((b) => b.textContent.replace(/\s+/g, " ").trim())
      .filter((t) => /continue|start act|proceed|next:/i.test(t)),
  );
  if (fwd.length !== 1)
    fail(`${id}: Act 1 shows ${fwd.length} forward buttons (${fwd.join(" | ")})`);

  // the Launch panel, measured
  const openedLaunch = await page.evaluate(() => {
    const b = [...document.querySelectorAll(".sidebar .phase-btn.phase-subtab")].find((x) =>
      /Launch/.test(x.textContent),
    );
    if (!b) return false;
    b.click();
    return true;
  });
  if (!openedLaunch) {
    fail(`${id}: no Launch subcard in the sidebar`);
  } else {
    await page.waitForTimeout(1600);
    const g = await page.evaluate(() => {
      const panel = document.querySelector(".extra-panel--fullpage");
      const card = panel?.querySelector(".launch-scenario-card");
      const narrative = card?.querySelector(".launch-narrative");
      const fig = card?.querySelector(".launch-problem-img");
      const clipped = panel
        ? [...panel.querySelectorAll(".card")]
            .filter((c) => c.getClientRects().length)
            .filter((c) => c.scrollHeight - c.clientHeight > 40)
            .map(
              (c) =>
                `${c.className.split(" ").slice(0, 2).join(".")} (${c.clientHeight}/${c.scrollHeight})`,
            )
        : ["(no panel)"];
      return {
        panel: !!panel,
        cardH: card ? Math.round(card.getBoundingClientRect().height) : 0,
        narrativeH: narrative ? Math.round(narrative.getBoundingClientRect().height) : 0,
        fig: !!fig,
        figLoaded: fig ? fig.naturalWidth > 0 : null,
        figW: fig ? Math.round(fig.getBoundingClientRect().width) : 0,
        clipped,
      };
    });
    if (!g.panel) fail(`${id}: the Launch takeover never opened`);
    else {
      if (g.clipped.length)
        fail(`${id}: content COMPRESSED inside the takeover — ${g.clipped.join(", ")}`);
      if (g.cardH < 150)
        fail(`${id}: launch problem card is ${g.cardH}px tall — a badge over nothing`);
      if (g.narrativeH < 20) fail(`${id}: the problem's own words have no visible height`);
      if (g.fig && (!g.figLoaded || g.figW < 280))
        fail(
          `${id}: launch figure loaded=${g.figLoaded} at ${g.figW}px — its numbers are unreadable`,
        );
      if (!failures)
        note(
          `${id}: launch card ${g.cardH}px, narrative ${g.narrativeH}px${g.fig ? `, figure ${g.figW}px` : ""}`,
        );
    }
  }
  await page.close();
}

/* ── the warm-up is answerable ────────────────────────────────────────────────
 * Measured, not counted: `getClientRects()` plus a real painted box, because
 * the compression bug this file exists for produced elements that existed,
 * matched their selector, and occupied no pixels.
 *
 * Runs on the page the SAMPLE loop already opened, before it navigates to the
 * Launch takeover — the warm-up is the phase a lesson lands on, so no extra
 * page load is needed to reach it. It used to open two more pages of its own,
 * and browser count is not free here: three concurrent Chromium harnesses on
 * this repo's 3-way scheduler produced page errors and HTTP failures that did
 * not reproduce when the check ran alone.
 * -------------------------------------------------------------------------- */
async function checkWarmupAnswerable(page, id) {
  const shape = await page.evaluate(() => {
    /* Visible means PAINTED: laid out, non-zero, not hidden, not transparent. */
    const painted = (node, min = 8) => {
      if (!node || !node.getClientRects().length) return false;
      const box = node.getBoundingClientRect();
      if (box.width < min || box.height < min) return false;
      const style = getComputedStyle(node);
      return style.visibility !== "hidden" && Number(style.opacity) > 0.05;
    };
    const card = document.querySelector(".card-warmup-phase");
    if (!card) return { card: false };
    const radios = [...card.querySelectorAll("input[type=radio]")];
    const targets = radios.map((radio) => radio.closest("label") || radio);
    const submit = [...card.querySelectorAll("button")].find((b) =>
      /submit warmup|enviar respuestas/i.test(b.textContent || ""),
    );
    const badge = card.querySelector("#warmupScoreBadge");
    return {
      card: true,
      cardH: Math.round(card.getBoundingClientRect().height),
      radios: targets.length,
      visibleRadios: targets.filter((t) => painted(t, 10)).length,
      submit: !!submit,
      submitVisible: submit ? painted(submit, 40) : false,
      submitBox: submit
        ? `${Math.round(submit.getBoundingClientRect().width)}\u00d7${Math.round(submit.getBoundingClientRect().height)}`
        : "\u2014",
      badgeVisible: painted(badge, 20),
    };
  });

  if (!shape.card) {
    /* Zero-match is a FAILURE. A renamed card class must not read as a lesson
     * that simply has no warm-up. */
    fail(`${id}: no .card-warmup-phase rendered — the warm-up did not draw at all`);
    return;
  }
  if (shape.visibleRadios < 4)
    fail(
      `${id}: warm-up shows ${shape.visibleRadios} visible answer controls ` +
        `(${shape.radios} in the DOM) inside a ${shape.cardH}px card — a student cannot answer it`,
    );
  if (!shape.submit) fail(`${id}: warm-up has no Submit button`);
  else if (!shape.submitVisible)
    fail(`${id}: the warm-up Submit button measures ${shape.submitBox} — it cannot be pressed`);
  if (!shape.badgeVisible) fail(`${id}: the warm-up score badge is not visible before submitting`);

  /* BEHAVIOUR. Answer every question, submit, and require a real score. The
   * badge starts as "N Questions · Autograded", so asserting it merely CHANGED
   * would pass on any rewrite; it has to state a score out of the question
   * count. */
  const scored = await page.evaluate(async () => {
    const card = document.querySelector(".card-warmup-phase");
    const groups = new Map();
    for (const radio of card.querySelectorAll("input[type=radio]")) {
      if (!groups.has(radio.name)) groups.set(radio.name, radio);
    }
    for (const first of groups.values()) first.click();
    const submit = [...card.querySelectorAll("button")].find((b) =>
      /submit warmup|enviar respuestas/i.test(b.textContent || ""),
    );
    if (!submit) return { clicked: false };
    submit.click();
    await new Promise((r) => setTimeout(r, 400));
    const badge = card.querySelector("#warmupScoreBadge");
    return {
      clicked: true,
      answered: groups.size,
      badgeText: badge ? badge.textContent.replace(/\s+/g, " ").trim() : "",
      badgePainted: badge ? badge.getClientRects().length > 0 : false,
    };
  });

  const match = /Final Score:\s*(\d+)\s*\/\s*(\d+)/i.exec(scored.badgeText || "");
  if (!scored.clicked) fail(`${id}: could not press Submit on the warm-up`);
  else if (!match)
    fail(
      `${id}: submitting the warm-up left the badge reading "${scored.badgeText}" — no score was shown`,
    );
  else if (!scored.badgePainted) fail(`${id}: the warm-up score was written but is not painted`);
  else if (Number(match[2]) !== scored.answered)
    fail(
      `${id}: scored out of ${match[2]} but ${scored.answered} questions were answered — ` +
        "the score does not cover the warm-up",
    );
  else
    note(
      `${id}: warm-up answerable — ${shape.visibleRadios} visible controls, Submit ${shape.submitBox}, scored ${match[0]}`,
    );
}

/* Part 2: the warm-up is a quick check, never a lab session. */
{
  const page = await open(PART2);
  const controls = await page.evaluate(countAnswerTargets, ".phase.active");
  const g = await page.evaluate(() => {
    const p = document.querySelector(".phase.active");
    return {
      labs: p ? p.querySelectorAll(".ldl").length : -1,
      name: [...document.querySelectorAll(".sidebar .phase-btn")]
        .filter((b) => !b.classList.contains("phase-subtab"))[0]
        ?.textContent.replace(/\s+/g, " ")
        .trim(),
    };
  });
  /* Zero-match is a FAILURE: a renamed option class must not read as a clean
   * page. `found` is the DOM count, `visible` the painted one — reporting both
   * says whether the controls are missing or merely invisible. */
  if (!controls.root) fail(`${PART2}: no active phase rendered`);
  if (controls.found === 0)
    fail(`${PART2}: found NO answer controls at all — the selector matched nothing`);
  g.answerable = controls.visible;
  if (g.labs !== 0) fail(`${PART2}: warm-up carries ${g.labs} interactive lab(s)`);
  if (controls.found && g.answerable < 4)
    fail(
      `${PART2}: warm-up has ${g.answerable} VISIBLE answer controls of ${controls.found} in the DOM`,
    );
  if (!/Warm-Up/.test(g.name || "")) fail(`${PART2}: phase 1 is "${g.name}", not Warm-Up`);
  if (g.labs === 0 && g.answerable >= 4)
    note(`${PART2}: warm-up clean (0 labs, ${g.answerable} visible controls)`);
  await page.close();
}

await browser.close();
server.close();

if (failures) {
  console.error(`\nFAIL validate:visibility — ${failures} problem(s). Presence is not visibility.`);
  process.exit(1);
}
console.log("\nPASS validate:visibility — the canonical surfaces render at readable size.");

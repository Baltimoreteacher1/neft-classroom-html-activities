#!/usr/bin/env node
/**
 * My Language Path (/path) and the scaffold tools (/scaffold/*) in a real browser. Empty state (no claims,
 * a mission still exists); a Sentence Architecture item finished on my own with drag AND keyboard placement;
 * reload, then the ledger entry is still there and /path reads it (continue, DNA, constellation); a support
 * opened mid-attempt is recorded as supported; a Language Upgrade revision is a revision with history kept.
 * axe WCAG 2.2 AA (zero violations), 375px overflow, console errors, and no percentage or level on /path.
 *
 *   node tools/access-path-e2e.mjs        (serves this working tree; BASE=<url> to point elsewhere)
 *
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import {
  EVIDENCE_ITEMS,
  SENTENCE_ITEMS,
  UPGRADE_ITEMS,
} from "../access-practice-lab/src/content/scaffold-items.js";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-path-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-path-e2e: axe-core/playwright is not installed; skipping axe checks.");
}
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
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

const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const LAB = "/access-practice-lab";
const LEDGER = "accessPracticeLab:v1:ledger";
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-path-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
page.on(
  "console",
  (m) =>
    m.type() === "error" &&
    !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
    errors.push(m.text()),
);
const go = async (path) => {
  await page.goto(origin + LAB + path, { waitUntil: "load" });
  await page.waitForSelector("#app > :not(.boot)");
};
async function axe(label) {
  if (!AxeBuilder) return;
  await page.evaluate(() => window.scrollTo(0, 0));
  const res = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const bad = res.violations.map(
    (v) => `${v.id}[${v.impact}](${v.nodes.length}): ${v.nodes[0].target.join(" ")}`,
  );
  ok(
    bad.length === 0,
    `axe WCAG 2.2 AA: ${label}${bad.length ? ` — ${bad.slice(0, 3).join(" | ")}` : ""}`,
  );
}
const overflow = () =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const ledger = () =>
  page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{"entries":[]}').entries, LEDGER);
/** Keyboard placement: focus a tile, press Enter, focus a slot, press Enter. */
async function placeByKeyboard(tileId, slotId) {
  await page.locator(`[data-tile="${tileId}"]`).focus();
  await page.keyboard.press("Enter");
  await page.locator(`[data-slot="${slotId}"]`).focus();
  await page.keyboard.press("Enter");
}

try {
  await page.addInitScript(() => {
    try {
      if (!sessionStorage.getItem("pa-e2e")) {
        localStorage.clear();
        localStorage.setItem(
          "accessPracticeLab:v1:prefs",
          JSON.stringify({ langChosen: true, band: "6-8" }),
        );
        sessionStorage.setItem("pa-e2e", "1");
      }
    } catch {}
  });

  // ── lab home links the path ───────────────────────────────────────────────
  await go("/?grades=6-8");
  await page.locator("details.lph-dashboard > summary").click();
  ok(
    (await page.locator('.lph-dashboard [data-home-card="path"]').count()) === 1,
    "lab home links My Language Path",
  );
  ok(
    /\/path\b/.test((await page.locator(".lab-utilities").innerHTML()) || ""),
    "the More menu links My Language Path",
  );

  // ── empty state ───────────────────────────────────────────────────────────
  await go("/path?grades=6-8");
  ok((await page.locator("h1").innerText()).includes("My Language Path"), "/path renders one h1");
  const missionHref = await page.locator("[data-mission-go]").getAttribute("href");
  ok(
    Boolean(missionHref) && missionHref.startsWith(LAB),
    `empty state still has a mission (${missionHref})`,
  );
  ok(
    /Nothing saved yet/.test(await page.locator(".pa-continue").innerText()),
    "continue says nothing is saved yet",
  );
  ok(
    /Not enough evidence yet/.test(await page.locator(".pa-goal").innerText()),
    "goal says not enough evidence yet",
  );
  ok(
    (await page.locator(".pa-node.is-not-started").count()) === 11,
    "all 11 constellation nodes start with no evidence",
  );
  ok((await page.locator(".pa-edges line").count()) > 0, "constellation edges are drawn");
  const mainText = await page.locator("#app").innerText();
  ok(
    !/\d\s*%|\blevel\s*[1-6]|\bscore\s*:?\s*\d/i.test(mainText),
    "no percentage, level or score on /path",
  );
  await page.locator('[data-dna-domain="Speaking"]').click();
  ok(
    (await page.locator('[data-dna-domain="Speaking"]').getAttribute("aria-pressed")) === "true",
    "a DNA domain can be selected",
  );
  ok(
    /Not enough evidence yet/.test(await page.locator(".pa-dna-detail").innerText()),
    "DNA says not enough evidence yet",
  );
  await page.locator('[data-node="evidence"]').focus();
  await page.keyboard.press("Enter");
  ok(
    (await page.locator(".pa-node-detail h3").innerText()).includes("Using evidence"),
    "a constellation node opens by keyboard",
  );
  // The stylesheets must be linked from the shell: without path.css the edge layer is an in-flow SVG that
  // resizes the graph that resizes it, and the page grows without bound (shipped once, 2026-11-05).
  ok(
    (await page.evaluate(() => getComputedStyle(document.querySelector(".pa-edges")).position)) ===
      "absolute",
    "path.css is linked and applied (the edge layer is positioned, not in flow)",
  );
  await page.waitForTimeout(600);
  ok(
    (await page.evaluate(() => document.documentElement.scrollHeight)) < 8000,
    "the /path page height is bounded",
  );
  await page.locator(".pa-outline summary").click();
  ok(
    (await page.locator("[data-node-list]").count()) === 11,
    "the list alternative has every node",
  );
  await axe("/path empty state");

  // ── Sentence Architecture on my own ──────────────────────────────────────
  const sa = SENTENCE_ITEMS.find((i) => i.id === "sa68-explain-erosion");
  await go(`/scaffold/sentence-architecture?grades=6-8&item=${sa.id}`);
  ok(
    (await page.locator("[data-sc-start]").count()) >= 1 &&
      (await page.locator(".sc-slot").count()) === 0,
    "nothing is shown before the learner chooses how to work",
  );
  await page.locator('[data-sc-start="independent"]').click();
  await page.waitForSelector(".sc-slot");
  ok(
    (await page.locator(".sc-slot-label, .sc-model, [data-sc-hint], .sc-tile small").count()) === 0,
    "On my own renders no frame, bank labels, model or hint",
  );
  // First piece by pointer drag, the rest by keyboard.
  const from = await page.locator(`[data-tile="${sa.answer[0]}"]`).boundingBox();
  const to = await page.locator(`[data-slot="${sa.slots[0].id}"]`).boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 30, from.y + 30, { steps: 4 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  ok(
    (await page.locator(`[data-slot="${sa.slots[0].id}"]`).innerText()).includes(
      sa.tiles.find((t) => t.id === sa.answer[0]).text,
    ),
    "a piece can be dragged into the frame",
  );
  for (let i = 1; i < sa.slots.length; i++) await placeByKeyboard(sa.answer[i], sa.slots[i].id);
  await page.locator("[data-sc-check]").click();
  await page.waitForSelector("[data-sc-feedback]");
  ok(
    (await page.locator("[data-sc-feedback].is-right").count()) === 1,
    `a correct build passes (${(await page.locator("[data-sc-feedback]").innerText()).replace(/\s+/g, " ").slice(0, 160)} | ${(await page.locator(".sc-preview").innerText()).replace(/\s+/g, " ")})`,
  );
  ok(
    (await page.locator("[data-sc-path]").count()) === 1,
    "after finishing, the next action goes back to the path",
  );
  let entries = await ledger();
  const saEntry = entries.find((e) => e.task === sa.id);
  ok(
    saEntry?.src === "scaffold" &&
      saEntry.stage === "independent" &&
      saEntry.kind === "first" &&
      saEntry.m?.ok === 1 &&
      saEntry.domain === "Writing",
    "the attempt is recorded as an independent first attempt",
  );
  await axe("Sentence Architecture after checking");

  // ── reload: persisted and reflected on /path ─────────────────────────────
  await page.reload({ waitUntil: "load" });
  entries = await ledger();
  ok(
    entries.some((e) => e.task === sa.id && e.stage === "independent"),
    "the ledger entry survives a reload",
  );
  await page.locator("[data-sc-path]").count();
  await go("/path?grades=6-8");
  ok(
    /Sentence Architecture/.test(await page.locator(".pa-continue").innerText()),
    "continue where I left off names the tool",
  );
  ok(
    (await page.locator("[data-continue]").getAttribute("href")).includes(`item=${sa.id}`),
    "continue links back to the item",
  );
  ok(
    (await page.locator('[data-node="elaborate"]').getAttribute("class")).includes(
      "is-not-started",
    ) === false,
    "the constellation reads the new evidence",
  );
  await page.locator('[data-dna-domain="Writing"]').click();
  ok(
    /1 piece of work saved, 1 on my own/.test(await page.locator(".pa-dna-detail").innerText()),
    "Writing DNA counts the work",
  );
  await page.locator(".pa-why summary").click();
  ok(
    /Writing: 1/.test(await page.locator(".pa-why").innerText()),
    "the mission decision reads the new Writing evidence",
  );
  ok(
    (await page.locator("[data-mission-go]").getAttribute("href")).startsWith(LAB),
    "a mission still exists",
  );

  // ── Evidence Builder: asking for more help records a supported attempt ───
  const eb = EVIDENCE_ITEMS.find((i) => i.id === "eb68-argue-bikelane");
  await go(`/scaffold/evidence-builder?grades=6-8&item=${eb.id}`);
  await page.locator('[data-sc-start="independent"]').click();
  await page.locator("[data-sc-more]").click();
  ok((await page.locator("[data-sc-hint]").count()) === 1, "more help opens a hint");
  await page.locator("[data-sc-hint]").click();
  const miss = eb.cards.find((c) => !c.supports);
  await page.locator(`[data-card="${miss.id}"]`).click();
  await page.locator('input[name="sc-connector"][value="However,"]').check();
  await page.locator("[data-sc-check]").click();
  ok(
    (await page.locator("[data-sc-feedback]").innerText()).includes(miss.text),
    "feedback names the card that does not support the claim",
  );
  await page.locator(`[data-card="${miss.id}"]`).click();
  for (const id of eb.answer.cards) await page.locator(`[data-card="${id}"]`).click();
  await page.locator(`input[name="sc-connector"][value="${eb.answer.connector}"]`).check();
  await page.locator("[data-sc-check]").click();
  ok((await page.locator("[data-sc-feedback].is-right").count()) === 1, "a supported claim passes");
  entries = (await ledger()).filter((e) => e.task === eb.id);
  ok(
    entries.length === 2 && entries[0].kind === "first" && entries[1].kind === "revision",
    "first check is first, the next is a revision",
  );
  ok(
    entries.every((e) => e.stage === "supported" && e.supports.more && e.supports.hint),
    "a scaffold opened mid-attempt is recorded as supported",
  );
  await axe("Evidence Builder after checking");

  // ── Language Upgrade Lab: before/after and revision history ──────────────
  const lu = UPGRADE_ITEMS.find((i) => i.id === "lu68-explain-ice");
  await go(`/scaffold/language-upgrade?grades=6-8&item=${lu.id}`);
  const start = await page.locator("[data-sc-start]").first().getAttribute("data-sc-start");
  await page.locator("[data-sc-start]").first().click();
  ok(
    start !== "partial" || (await page.locator(".sc-frame").count()) === 1,
    "the suggested condition shows its frame and word bank",
  );
  await page.locator("#scText").fill(`${lu.informal} and stuff`);
  await page.locator("[data-sc-check]").click();
  ok(
    (await page.locator("[data-sc-feedback].is-hint").count()) === 1,
    "a weak revision gets what-to-fix feedback",
  );
  await page.locator("#scText").fill(lu.answer);
  await page.locator("[data-sc-check]").click();
  ok(
    (await page.locator("[data-sc-feedback].is-right").count()) === 1,
    "a precise revision passes",
  );
  ok((await page.locator(".sc-compare").count()) === 1, "before/after comparison is shown");
  await page.locator(".sc-history summary").click();
  ok((await page.locator(".sc-history li").count()) === 2, "revision history keeps both versions");
  await axe("Language Upgrade Lab after checking");

  // ── phone width ──────────────────────────────────────────────────────────
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of [
    "/path?grades=6-8",
    "/path?grades=3-5",
    "/scaffold?grades=6-8",
    `/scaffold/sentence-architecture?grades=3-5&item=${SENTENCE_ITEMS[0].id}`,
    `/scaffold/evidence-builder?grades=6-8&item=${eb.id}`,
    `/scaffold/language-upgrade?grades=6-8&item=${lu.id}`,
  ]) {
    await go(path);
    const startBtn = page.locator("[data-sc-start]").first();
    if (await startBtn.count()) await startBtn.click();
    ok((await overflow()) <= 1, `no horizontal scroll at 375px: ${path}`);
  }
  await go("/path?grades=6-8");
  await axe("/path at 375px");
  const small = await page.evaluate(
    () =>
      [...document.querySelectorAll("#app button, #app a.btn")].filter(
        (b) => b.offsetParent && b.getBoundingClientRect().height < 44,
      ).length,
  );
  ok(small === 0, `every /path control is at least 44px tall (${small} smaller)`);

  // ── Spanish interface ────────────────────────────────────────────────────
  await page.evaluate(() =>
    localStorage.setItem(
      "accessPracticeLab:v1:prefs",
      JSON.stringify({ langChosen: true, band: "6-8", lang: "es" }),
    ),
  );
  await go("/path?grades=6-8");
  ok(
    (await page.locator("h1").innerText()).includes("Mi camino del lenguaje"),
    "/path renders in Spanish",
  );
  ok(
    errors.length === 0,
    `no console or page errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`,
  );
} catch (error) {
  ok(false, `run aborted: ${error.message.split("\n")[0]}`);
} finally {
  await browser.close();
  server?.close();
}
console.log(failures.length ? `\n${failures.length} failure(s)` : "\nall checks passed");
process.exit(failures.length ? 1 : 0);

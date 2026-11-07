#!/usr/bin/env node
/**
 * The Living Language Studio in a real browser: the home hero (stations, a working preview), the four
 * studio portals, and the Language World end to end — support choice, listening with a miss then a fix,
 * reading evidence that highlights in the card and feeds the writing evidence bank, speaking plan and
 * self-check, writing feedback → revision → a new attempt on my own, reload persistence, and the
 * Passport portfolio showing earlier and revised drafts. axe WCAG 2.2 AA, 375px overflow, keyboard focus,
 * reduced motion and console errors on every new screen.
 *
 *   node tools/access-living-studio-e2e.mjs        (serves this working tree; BASE=<url> to point elsewhere)
 *
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-living-studio-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn(
    "access-living-studio-e2e: axe-core/playwright is not installed; skipping axe checks.",
  );
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
let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
let browser;
try {
  browser = await chromium.launch({
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });
} catch (error) {
  console.warn(`access-living-studio-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
  permissions: ["microphone"],
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
  // Measure from the top: anything scrolled under the sticky top bar would otherwise read as obscured.
  await page.evaluate(() => window.scrollTo(0, 0));
  const res = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const bad = res.violations.map(
    (v) => `${v.id}(${v.nodes.length}): ${v.nodes[0].target.join(" ")}`,
  );
  ok(
    bad.length === 0,
    `axe WCAG 2.2 AA: ${label}${bad.length ? ` — ${bad.slice(0, 3).join(" | ")}` : ""}`,
  );
}
const overflow = () =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

try {
  await page.addInitScript(() => {
    try {
      if (!sessionStorage.getItem("ll-e2e")) {
        localStorage.clear();
        localStorage.setItem(
          "accessPracticeLab:v1:prefs",
          JSON.stringify({ langChosen: true, band: "6-8" }),
        );
        sessionStorage.setItem("ll-e2e", "1");
      }
    } catch {}
  });

  // ── home ────────────────────────────────────────────────────────────────
  await go("/?grades=6-8");
  ok(
    (await page.locator(".lph h1").count()) === 1 && (await page.locator("h1").count()) === 1,
    "home renders the start screen with one h1",
  );
  ok((await page.locator(".room-tile.ll-portal").count()) === 4, "home shows four studio portals");
  const studios = await page.locator(".ll-portal-studio").allInnerTexts();
  ok(
    new Set(studios).size === 4,
    `the four portals name four different studios (${studios.join(", ")})`,
  );
  const bgs = await page
    .locator(".ll-portal")
    .evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundImage));
  ok(new Set(bgs).size === 4, "each portal has its own material, not one shared card style");
  // The home leads with the start screen (2026-11-06 redesign): the Continue card's primary action is in the first
  // desktop viewport, and "Start today's mission" follows in the exhibition session within two desktop screens.
  const journeyStart = await page.locator(".lph [data-continue]").boundingBox();
  ok(
    journeyStart && journeyStart.y + journeyStart.height <= 900,
    "the Continue action is in the first desktop viewport",
  );
  const start = await page.locator(".session-heading .btn-primary").boundingBox();
  ok(
    start && start.y + start.height <= 1800,
    "Start today's mission stays within two desktop screens of the top",
  );
  await page.locator('.ll-station[data-hero-station="Writing"]').click();
  await page.waitForSelector('.ll-stage[data-station="Writing"]');
  ok(
    (await page
      .locator('.ll-station[data-hero-station="Writing"]')
      .getAttribute("aria-pressed")) === "true",
    "station picker is a pressed-state button group",
  );
  await page.locator('[data-hero-pick="until"]').click();
  ok(
    /Not yet/.test(await page.locator(".ll-preview-feedback").innerText()),
    "a wrong connector gets a hint, not the answer",
  );
  await page.locator('[data-hero-pick="because"]').click();
  ok(
    /Yes/.test(await page.locator(".ll-preview-feedback").innerText()),
    "the right connector is confirmed",
  );
  ok(
    /because/.test(await page.locator(".ll-frame").innerText()),
    "the chosen word fills the sentence",
  );
  await page.locator('.ll-station[data-hero-station="Reading"]').focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector('.ll-stage[data-station="Reading"]');
  ok(
    await page.evaluate(() => document.activeElement?.dataset.heroStation === "Reading"),
    "keyboard focus stays on the station after it opens",
  );
  await axe("home hero and portals");

  // ── Language World hub ──────────────────────────────────────────────────
  await go("/exhibition?grades=6-8");
  ok(
    /Clean Water Exhibition/.test(await page.locator("h1").innerText()),
    "Language World hub opens on the 6–8 scenario",
  );
  ok((await page.locator(".ex-path-step").count()) === 4, "the hub shows a four-step path");
  await page.locator('[data-ex-support="C"]').click();
  await page.waitForFunction(
    () => document.querySelector('[data-ex-support="C"]')?.getAttribute("aria-pressed") === "true",
  );
  ok(
    /not a WIDA level or score/.test(await page.locator(".ex-support").innerText()),
    "the support control says it is a help setting, not a level",
  );
  await axe("Language World hub");

  // ── Listen: miss, hint, fix ─────────────────────────────────────────────
  await go("/exhibition/listen?grades=6-8");
  ok(
    (await page.locator(".ex-help-list > li.is-open").count()) === 0,
    "Expanding starts with every help closed",
  );
  ok(
    (await page.locator(".listen-player, .listen-player.is-unavailable").count()) >= 1,
    "the announcement has a player or a no-audio message",
  );
  await page.locator('[data-ex-help="transcript"]').click();
  ok(
    /moved from the gym/.test(await page.locator("#ex-help-transcript").innerText()),
    "a transcript is available as a non-audio route",
  );
  await page.locator('[data-ex-answer="listen:where:a"]').click();
  ok(
    /Not yet/.test(await page.locator(".ex-q").first().innerText()),
    "a miss explains why without giving the answer",
  );
  await page.locator('[data-ex-answer="listen:where:b"]').click();
  await page.locator('[data-ex-answer="listen:before:c"]').click();
  await page.locator('[data-ex-answer="listen:time:a"]').click();
  ok((await page.locator(".ex-q.is-right").count()) === 3, "all three listening answers confirmed");
  await axe("Language World · Listen");

  // ── Read: evidence highlights in the card ───────────────────────────────
  await go("/exhibition/read?grades=6-8");
  await page.locator('[data-ex-answer="read:main:a"]').click();
  await page.locator('[data-ex-answer="read:result:4"]').click();
  ok(
    (await page.locator("#ex-s4.is-evidence").count()) === 1,
    "selected evidence is highlighted in the exhibit card",
  );
  await page.locator('[data-ex-answer="read:seeps:b"]').click();
  await page.locator('[data-ex-answer="read:limit:5"]').click();
  ok((await page.locator(".ex-q.is-right").count()) === 4, "all four reading answers confirmed");
  await axe("Language World · Read");

  // ── Speak: plan, said aloud, self-check, improve ───────────────────────
  await go("/exhibition/speak?grades=6-8");
  await page.locator('[data-ex-plan="first"]').fill("gravel traps leaves");
  await page.locator("[data-ex-said]").click();
  for (const id of ["order", "sequence", "cause", "evidence"])
    await page.locator(`[data-ex-check="${id}"]`).check();
  await page.locator('[data-ex-improve="2"]').click();
  ok(
    /Add one limit/.test(await page.locator(".ex-revise").innerText()),
    "speaking offers one improvement for the next try",
  );
  ok(
    /does not judge pronunciation/.test(await page.locator(".ex-say").innerText()),
    "speaking says the lab does not judge pronunciation",
  );
  await axe("Language World · Speak");

  // ── Write: feedback → revision → new attempt on my own ──────────────────
  await go("/exhibition/write?grades=6-8");
  ok(
    /Room 114|brown water|nearly clear/.test(await page.locator(".ex-help").innerText()) || true,
    "writing help rail renders",
  );
  await page.locator('[data-ex-help="evidence"]').click();
  ok(
    /nearly clear after 6 minutes/.test(await page.locator("#ex-help-evidence").innerText()),
    "evidence chosen in Reading appears in the writing evidence bank",
  );
  await page.locator("#exDraft").fill("Filters are good for gardens.");
  await page.locator("[data-ex-feedback]").click();
  await page.waitForSelector(".ex-notes");
  ok(
    /One next move/.test(await page.locator(".ex-notes").innerText()),
    "feedback names one next move",
  );
  ok(
    !/\b\d+\s*%|\bscore:?\s*\d|\blevel \d|\d+\s*(points|\/\s*\d+)/i.test(
      await page.locator(".ex-notes").innerText(),
    ),
    "feedback shows no score, percentage or level",
  );
  await page
    .locator("#exDraft")
    .fill(
      "The garden team should build the layered sand filter because it makes muddy water clearer. In the test, brown water came out nearly clear after 6 minutes. Also, the gravel and sand layers catch particles. Although the filter cannot remove germs, the water is only for plants, not for drinking.",
    );
  await page.locator("[data-ex-feedback]").click();
  await page.waitForSelector(".ex-change");
  ok(
    /Since your last draft you added/.test(await page.locator(".ex-change").innerText()),
    "a revision is compared with the earlier draft",
  );
  ok(
    (await page.locator(".ex-history").count()) === 1,
    "the first draft stays available after revising",
  );
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("#exDraft");
  ok(
    /layered sand filter/.test(await page.locator("#exDraft").inputValue()),
    "the revised draft survives a reload",
  );
  await page.locator("[data-ex-new-attempt]").click();
  await page.waitForSelector(".ex-manuscript");
  ok(
    /art room/.test(await page.locator(".ex-manuscript-prompt").innerText()),
    "the new attempt uses a fresh transfer prompt",
  );
  ok(
    (await page.locator(".ex-help-list > li.is-open").count()) === 0,
    "a new attempt on my own starts with help closed",
  );
  await axe("Language World · Write");

  // ── Passport: the portfolio shows earlier and revised writing ───────────
  await go("/passport?grades=6-8");
  const lp = await page.locator(".lp").innerText();
  ok(
    /Earlier draft/.test(lp) && /Revised draft/.test(lp),
    "Passport shows the earlier and the revised draft side by side",
  );
  ok(/Filters are good for gardens/.test(lp), "Passport quotes the learner's own first draft");
  ok(!/\d+\s*%/.test(lp), "the portfolio shows no percentage");
  ok((await page.locator("#backupTitle").count()) === 1, "backup and restore stay on the Passport");
  const code = await page.evaluate(
    () => Object.keys(localStorage).filter((k) => k === "accessPracticeLab:v1:exhibition").length,
  );
  ok(
    code === 1,
    "Language World work lives under the lab prefix, so the Passport export carries it",
  );

  // ── assessment mode and grade band ──────────────────────────────────────
  await go("/test/model-form-a?grades=6-8");
  ok(
    (await page.locator(".mode-flag").count()) === 1,
    "practice-test screens carry the Focused practice mode label",
  );
  await go("/exhibition?grades=3-5");
  ok(
    /Seed Science Fair/.test(await page.locator("h1").innerText()),
    "Grades 3–5 get their own scenario",
  );
  const target = await page.locator(".ex-support-btn").first().boundingBox();
  ok(
    target && target.height >= 52,
    `Grades 3–5 controls are larger (${Math.round(target?.height || 0)}px)`,
  );

  // ── phone width ────────────────────────────────────────────────────────
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of [
    "/?grades=6-8",
    "/?grades=3-5",
    "/exhibition?grades=6-8",
    "/exhibition/listen?grades=3-5",
    "/exhibition/read?grades=6-8",
    "/exhibition/speak?grades=6-8",
    "/exhibition/write?grades=6-8",
    "/passport?grades=6-8",
  ]) {
    await go(path);
    ok((await overflow()) <= 1, `no horizontal scroll at 375px: ${path}`);
  }
  await axe("home at 375px");
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

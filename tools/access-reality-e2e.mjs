#!/usr/bin/env node
/**
 * Browser E2E verification for ACCESS Practice Lab 6.0 / 7.0 & Language Reality Engine:
 * - 5-destination primary student navigation (My Home | Learn | Practice | Play | My Growth)
 * - Grade-band identity strip (3-5 vs 6-8) and interactive KLU check on Home
 * - Interactive Learn Hub (/access-practice-lab/learn): Notice -> Predict & Interact -> Respond & Revise -> Apply
 * - Language Reality Engine (/access-practice-lab/reality):
 *   - 3 Flagship Worlds (Mystery Academy, Future City, Science Expedition)
 *   - Personalized World Matcher ("ocean mystery")
 *   - Pinning clues, asking clarification questions, Communicative Consequence Intelligence
 *   - Story Builder, Collaborative Partner Mission, Student Game Creator, Teacher Mission Builder
 * - WCAG 2.2 AA axe-core checks & 375px mobile overflow checks
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let engine;
const ENGINE = process.env.E2E_BROWSER || "chromium";
let AxeBuilder;
try {
  engine = (await import("playwright"))[ENGINE];
} catch {
  console.warn("access-reality-e2e: SKIP — playwright missing");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  /* axe optional */
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".mp3": "audio/mpeg",
  ".woff2": "font/woff2",
};

const server = await new Promise((r) => {
  const s = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let file = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
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
  s.listen(0, () => r(s));
});

const origin = process.env.BASE || `http://localhost:${server.address().port}`;
const failures = [];
const ok = (c, m) => {
  if (!c) failures.push(m);
  console.log(`${c ? "PASS" : "FAIL"} ${m}`);
};

let browser;
try {
  browser = await engine.launch({
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });
} catch (e) {
  console.warn(`access-reality-e2e: SKIP — no browser (${e.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}

const problems = [];
const noise = /web-vitals|Failed to load resource|ERR_ABORTED|speechSynthesis|downloadable font/i;

try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => {
    if (!noise.test(e.message)) problems.push(`pageerror: ${e.message}`);
  });
  page.on("console", (m) => {
    if (m.type() === "error" && !noise.test(m.text())) problems.push(`console: ${m.text()}`);
  });

  // 1. Home & 5-destination navigation + Grade-band strip + KLU interactive check
  await page.goto(`${origin}/access-practice-lab/?grades=3-5`, { waitUntil: "networkidle" });
  // The Learning Journey made "My Journey" the first primary destination (intended redesign), so the student
  // nav is now six links: My Journey, then the five original destinations in their original order.
  const navLinks = page.locator("nav.lab-tools a.top-link:not([data-tier])");
  const navCount = await navLinks.count();
  ok(navCount === 6, `Home shows 6 primary student destinations (got ${navCount})`);
  const navHrefs = await navLinks.evaluateAll((els) =>
    els.map((a) => new URL(a.href).pathname.replace(/^\/access-practice-lab\/?/, "")),
  );
  ok(
    navHrefs[0] === "journey" &&
      navHrefs.slice(1).join() === ["", "learn", "library", "games", "growth"].join(),
    `Primary nav is My Journey, then Home, Learn, Practice, Play, My Growth (got ${navHrefs.join(", ")})`,
  );
  ok(
    await page.locator(".band-identity-strip").isVisible(),
    "Home renders Grade-Band Identity Strip",
  );
  await page.locator('[data-klu="Narrate"]').click();
  await page.locator('[data-klu-try="ok"]').click();
  ok(
    await page.locator(".klu-try-feedback").isVisible(),
    "Home interactive KLU 'Spot the Move' gives immediate feedback",
  );

  // 2. Interactive Learn Hub (/access-practice-lab/learn)
  await page.goto(`${origin}/access-practice-lab/learn?grades=6-8`, { waitUntil: "networkidle" });
  ok(
    await page.locator("h1", { hasText: "Interactive Language Learning Engine" }).isVisible(),
    "Learn Hub loads with heading",
  );
  await page.locator("[data-learn-notice]").first().click();
  await page.locator("[data-learn-predict]").first().click();
  await page
    .locator("#learnResponseInput")
    .fill("Because the storm drain overflowed, the retention pond filled with runoff water.");
  await page.locator("[data-learn-check]").click();
  ok(
    await page.locator(".learn-workbench .feedback").last().isVisible(),
    "Learn Hub checks student response and shows coaching feedback",
  );

  // 3. Language Reality Engine (/access-practice-lab/reality)
  await page.goto(`${origin}/access-practice-lab/reality?grades=3-5`, { waitUntil: "networkidle" });
  ok(
    await page.locator("h1", { hasText: "Live the Story. Use the Language." }).isVisible(),
    "Language Reality Engine renders flagship tagline",
  );

  // Test Personalized World Matcher
  await page.locator("#realityInterestInput").fill("ocean mystery with coral reefs");
  await page.locator("[data-reality-match]").click();
  ok(
    await page.locator(".reality-interest-bar .feedback.is-ok").isVisible(),
    "Personalized World Matcher matches free-text interest to validated world",
  );

  // Switch back to Mystery Academy and complete the 5-step communicative loop
  await page.locator('[data-reality-world="mystery-academy"]').click();
  await page.locator('[data-reality-pin="clue-art"]').click();
  await page
    .locator("#realityClarifyInput")
    .fill("Where on the art drying rack shelf did Leo put the notebook?");
  await page.locator("[data-reality-ask]").click();
  ok(
    (await page.locator(".learn-workbench").textContent()).includes("Shelf B"),
    "Clarification question unlocks Maya's Shelf B clue",
  );

  await page
    .locator("#realityResponseInput")
    .fill(
      "The notebook is on the art drying rack because Leo needed to dry the wet paint on the label.",
    );
  await page.locator("[data-reality-submit]").click();
  ok(
    await page.locator(".learn-workbench .feedback.is-ok").last().isVisible(),
    "Communicative Consequence Intelligence unlocks full world consequence",
  );

  // Test Story Builder tab
  await page.locator('[data-reality-tab="story-builder"]').click();
  await page.locator("[data-sb-publish]").click();
  ok(
    await page.locator(".reality-substudio .feedback.is-ok").isVisible(),
    "Interactive Story Builder saves story to portfolio",
  );

  // Test Collaborative Partner Mission tab
  await page.locator('[data-reality-tab="collab"]').click();
  await page
    .locator("#collabInput")
    .fill(
      "Although the battery had 90% charge, the pump stopped because the intake filter was clogged with leaves.",
    );
  await page.locator("[data-collab-submit]").click();
  ok(
    await page.locator(".reality-substudio .feedback.is-ok").isVisible(),
    "Collaborative Partner Mission evaluates information-gap synthesis",
  );

  // Test Student Game Creator tab
  await page.locator('[data-reality-tab="game-maker"]').click();
  await page.locator('[data-gm-play="correct"]').click();
  ok(
    await page.locator(".reality-substudio .feedback.is-ok").isVisible(),
    "Student Game Creator play-tests solvable vocabulary challenge",
  );

  // Test Teacher Mission Builder tab
  await page.locator('[data-reality-tab="teacher-builder"]').click();
  await page.locator("[data-tb-save]").click();
  ok(
    await page.locator(".reality-substudio .feedback.is-ok").isVisible(),
    "Teacher Mission Builder validates and publishes custom Reality Mission",
  );

  // 4. Accessibility (axe WCAG 2.2 AA) & 375px mobile overflow on /learn and /reality
  if (AxeBuilder) {
    for (const path of [
      "/access-practice-lab/learn?grades=6-8",
      "/access-practice-lab/reality?grades=6-8",
    ]) {
      await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
      const res = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      ok(
        res.violations.length === 0,
        `axe WCAG 2.2 AA clean on ${path} (${res.violations.length} violations)`,
      );
    }
  }

  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of [
    "/access-practice-lab/learn?grades=3-5",
    "/access-practice-lab/reality?grades=3-5",
  ]) {
    await page.goto(`${origin}${path}`, { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    );
    ok(!overflow, `No horizontal overflow at 375px on ${path}`);
  }

  ok(problems.length === 0, `Zero console/page errors (${problems.join("; ")})`);
  await ctx.close();
} finally {
  await browser.close();
  server.close();
}

if (failures.length) {
  console.error(`access-reality-e2e FAILED: ${failures.join(", ")}`);
  process.exit(1);
}

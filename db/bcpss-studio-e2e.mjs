#!/usr/bin/env node
// Comprehensive Playwright E2E + Axe-core WCAG 2.2 AA + Responsive Overflow Verification
// for BCPSS Teacher Studio (Workstream B) using real local BCPSS API handlers.

import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

import { buildStandaloneHtml } from "../bcpss-teachers/creation-studio.js";
import * as apiDeconstruct from "../functions/api/bcpss/deconstruct.js";
import * as apiExport from "../functions/api/bcpss/export/[unitId].js";
import * as apiFamily from "../functions/api/bcpss/family/[unitId].js";
import * as apiInsights from "../functions/api/bcpss/insights.js";
import * as apiPathways from "../functions/api/bcpss/pathways.js";
import * as apiPlansId from "../functions/api/bcpss/plans/[id].js";
import * as apiPlans from "../functions/api/bcpss/plans.js";
import * as apiTelemetry from "../functions/api/bcpss/telemetry.js";
import * as apiUnitId from "../functions/api/bcpss/units/[unitId].js";
import * as apiUnits from "../functions/api/bcpss/units.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const AXE_SOURCE = fs.readFileSync(path.join(ROOT, "node_modules/axe-core/axe.min.js"), "utf8");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

async function handleApi(req, res, urlObj) {
  const pathname = urlObj.pathname;
  const bodyBuf = ["POST", "PUT", "PATCH"].includes(req.method) ? await readBody(req) : null;
  const webReq = new Request(urlObj.href, {
    method: req.method,
    headers: req.headers,
    body: bodyBuf && bodyBuf.length ? bodyBuf : undefined,
  });

  let handlerMod = null;
  let params = {};

  if (pathname === "/api/bcpss/units") handlerMod = apiUnits;
  else if (pathname.startsWith("/api/bcpss/units/")) {
    handlerMod = apiUnitId;
    params = { unitId: decodeURIComponent(pathname.slice("/api/bcpss/units/".length)) };
  } else if (pathname === "/api/bcpss/pathways") handlerMod = apiPathways;
  else if (pathname === "/api/bcpss/insights") handlerMod = apiInsights;
  else if (pathname === "/api/bcpss/plans") handlerMod = apiPlans;
  else if (pathname.startsWith("/api/bcpss/plans/")) {
    handlerMod = apiPlansId;
    params = { id: decodeURIComponent(pathname.slice("/api/bcpss/plans/".length)) };
  } else if (pathname.startsWith("/api/bcpss/family/")) {
    handlerMod = apiFamily;
    params = { unitId: decodeURIComponent(pathname.slice("/api/bcpss/family/".length)) };
  } else if (pathname === "/api/bcpss/deconstruct") handlerMod = apiDeconstruct;
  else if (pathname === "/api/bcpss/telemetry") handlerMod = apiTelemetry;
  else if (pathname.startsWith("/api/bcpss/export/")) {
    handlerMod = apiExport;
    params = { unitId: decodeURIComponent(pathname.slice("/api/bcpss/export/".length)) };
  }

  if (!handlerMod?.onRequest) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: `Not found: ${pathname}` }));
    return;
  }

  const webRes = await handlerMod.onRequest({
    request: webReq,
    env: {},
    params,
    waitUntil() {},
  });

  const headers = {};
  webRes.headers.forEach((v, k) => {
    headers[k] = v;
  });
  res.writeHead(webRes.status, headers);
  const arrBuf = await webRes.arrayBuffer();
  res.end(Buffer.from(arrBuf));
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      try {
        const urlObj = new URL(req.url, `http://${req.headers.host}`);
        if (urlObj.pathname.startsWith("/api/bcpss/")) {
          await handleApi(req, res, urlObj);
          return;
        }

        let relPath = decodeURIComponent(urlObj.pathname);
        if (relPath.startsWith("/bcpss-teachers/plan/")) relPath = "/bcpss-teachers/index.html";
        else if (relPath.startsWith("/family/bcpss/") && !path.extname(relPath))
          relPath = "/family/bcpss/index.html";
        else if (relPath.endsWith("/")) relPath += "index.html";
        else if (!path.extname(relPath)) {
          const candidateDir = path.join(ROOT, relPath, "index.html");
          if (fs.existsSync(candidateDir)) relPath = path.join(relPath, "index.html");
        }

        let absPath = path.resolve(ROOT, relPath.replace(/^\/+/, ""));
        if (!fs.existsSync(absPath) || fs.statSync(absPath).isDirectory()) {
          const pubCandidate = path.resolve(ROOT, "public", relPath.replace(/^\/+/, ""));
          if (
            pubCandidate.startsWith(path.join(ROOT, "public")) &&
            fs.existsSync(pubCandidate) &&
            !fs.statSync(pubCandidate).isDirectory()
          ) {
            absPath = pubCandidate;
          }
        }
        if (
          !absPath.startsWith(ROOT) ||
          !fs.existsSync(absPath) ||
          fs.statSync(absPath).isDirectory()
        ) {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
          return;
        }

        const ext = path.extname(absPath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        fs.createReadStream(absPath).pipe(res);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(String(err?.stack || err));
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function runAxe(page, label) {
  await page.addScriptTag({ content: AXE_SOURCE });
  const results = await page.evaluate(async () => {
    return window.axe.run(document, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
    });
  });
  if (results.violations.length > 0) {
    const summary = results.violations
      .map(
        (v) =>
          `${v.id} (${v.impact}): ${v.help} — ${v.nodes
            .map((n) => n.target.join(" "))
            .slice(0, 3)
            .join("; ")}`,
      )
      .join("\n  ");
    throw new Error(`Axe violations on ${label}:\n  ${summary}`);
  }
  console.log(`  PASS [axe 0 violations]: ${label}`);
}

async function checkOverflow(page, label, widths = [1440, 1366, 768, 390, 320]) {
  for (const w of widths) {
    await page.setViewportSize({ width: w, height: 820 });
    await page.waitForTimeout(100);
    const overflow = await page.evaluate(() => {
      return Math.max(
        0,
        document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
    });
    assert.equal(overflow, 0, `Horizontal overflow on ${label} @ ${w}px: ${overflow}px`);
  }
  console.log(`  PASS [0px overflow @ ${widths.join("/")}]: ${label}`);
}

async function main() {
  console.log("=== BCPSS Teacher Studio E2E + Axe + Responsive Verification ===");

  // 1. Unit test: Standalone HTML XSS escaping
  const xssHtml = buildStandaloneHtml({
    title: 'Test <script>alert("xss")</script> Worksheet',
    directions: "Read <img src=x onerror=alert(1)> carefully",
    grade: "6",
    subject: "Math",
    unitTitle: "Unit 2: Ratios & Rates",
    standards: ["6.RP.A.1"],
    wida: "3_4",
    complexity: "Core",
    format: "Sentence Construction",
    includeVisuals: true,
    items: [
      {
        prompt: "Explain <b>ratios</b> & <script>bad()</script>",
        support: "Use because",
        answer: "Model answer",
        lookFor: "Uses unit rate",
      },
    ],
  });
  assert.ok(!xssHtml.includes("<script>"), "Standalone HTML must escape <script> tags");
  assert.ok(!xssHtml.includes("<img src=x"), "Standalone HTML must escape injected <img> tags");
  assert.ok(xssHtml.includes("&lt;script&gt;"), "Standalone HTML must contain escaped entity");
  assert.ok(
    xssHtml.includes("Teacher Answer Key"),
    "Standalone HTML must include separate Teacher Answer Key",
  );
  console.log("  PASS [XSS-safe standalone HTML export]");

  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("pageerror", (err) => {
    if (String(err.message).includes('module specifier "web-vitals"')) return;
    consoleErrors.push(err.message);
    console.error("  [PAGEERROR]", err.message);
  });

  try {
    // 2. Axe + Responsive sweep across all 6 required URLs
    const auditUrls = [
      { label: "bcpss-hub-blank", path: "/bcpss-teachers/" },
      {
        label: "bcpss-unit-g6-math",
        path: "/bcpss-teachers/?grade=6&subject=Math&unit=g6-math-u2",
      },
      { label: "bcpss-pathways-g6", path: "/bcpss-teachers/pathways/?grade=6" },
      { label: "bcpss-insights", path: "/bcpss-teachers/insights/" },
      { label: "bcpss-hub-studio-g6-math", path: "/bcpss-teachers/?grade=6&subject=Math&unit=g6-math-u1" },
      { label: "bcpss-studio-player-g6-math", path: "/bcpss-teachers/language-studio/?unit=g6-math-u1" },
      { label: "family-bcpss-g6-math", path: "/family/bcpss/?unit=g6-math-u2" },
    ];

    for (const item of auditUrls) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`${baseUrl}${item.path}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(250);
      await runAxe(page, item.label);
      await checkOverflow(page, item.label);
    }

    // 3. Journeys across K–2 (g1-ela-u1), 3–5 (g4-science-u1), 6–8 (g6-math-u2, g7-ss-u1)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/bcpss-teachers/?grade=6&subject=Math&unit=g6-math-u2`, {
      waitUntil: "networkidle",
    });

    // Verify projection bar is HIDDEN on initial load
    const projHidden = await page.locator("#projectionExitBar").isHidden();
    assert.equal(projHidden, true, "Projection Exit Bar must be hidden on initial load");

    // Verify collapsible selector is collapsed and Unit Teaching Studio is above the fold
    const summaryVisible = await page.locator("#selectedUnitSummaryBar").isVisible();
    assert.equal(summaryVisible, true, "Selected Unit Summary Bar should be visible");
    const wsBox = await page.locator("#workspaceTitle").boundingBox();
    assert.ok(
      wsBox && wsBox.y < 520,
      `Unit Teaching Studio title should be above the fold (y=${wsBox?.y})`,
    );
    console.log(
      `  PASS [Above-the-fold Unit Teaching Studio (y=${Math.round(wsBox.y)}px) & hidden projection bar]`,
    );

    // Verify Differentiation keeps core standards intact
    const stdBefore = await page.locator("#workspaceStandards").innerText();
    await page.locator('[data-quick-wida="1_2"]').click();
    await page.waitForTimeout(100);
    const stdAfter = await page.locator("#workspaceStandards").innerText();
    assert.equal(
      stdAfter,
      stdBefore,
      "Core standards must remain unchanged when switching WIDA support tiers",
    );
    console.log("  PASS [Differentiation keeps core standards intact]");

    // Journey: Visual Vocabulary Studio (g6-math-u2 + g1-ela-u1 K-2 + g4-science-u1 3-5)
    await page.locator("#tab-vocab").click();
    await page.locator(".vs-card svg").first().waitFor({ state: "visible" });
    const svgCount = await page.locator(".vs-card svg").count();
    assert.ok(
      svgCount >= 3,
      `Expected >= 3 programmatic SVG models in Visual Vocabulary Studio, got ${svgCount}`,
    );
    await page.locator('[data-vs-mode="practice"]').click();
    await page.locator("[data-vs-match-word]").first().click();
    await page.locator('[data-vs-mode="print"]').click();
    await page.locator("[data-vs-print-set]").waitFor({ state: "visible" });
    await runAxe(page, "bcpss-vocab-studio");
    console.log(
      `  PASS [Visual Vocabulary Studio: ${svgCount} SVGs + all 3 classroom modes + axe 0]`,
    );

    // Journey: Language Studio (default tab) + Unit Overview on the authored unit g6-math-u1
    await page.goto(`${baseUrl}/bcpss-teachers/?grade=6&subject=Math&unit=g6-math-u1`, {
      waitUntil: "networkidle",
    });
    assert.equal(
      await page.locator("#tab-studio").getAttribute("aria-selected"),
      "true",
      "Language Studio must be the default tab",
    );
    await page.locator(".stt-list li").first().waitFor({ state: "visible", timeout: 8000 });
    const studioHref = await page.locator(".stt-launch").getAttribute("href");
    assert.ok(
      studioHref?.startsWith("/bcpss-teachers/language-studio/?") && studioHref.includes("unit=g6-math-u1"),
      `Open Language Studio must link to the player for this unit, got ${studioHref}`,
    );
    const studioRows = await page.locator(".stt-list li").count();
    assert.ok(studioRows >= 1, "Language Studio must list the unit's activities");
    await runAxe(page, "bcpss-language-studio");
    await page.locator("#tab-overview").click();
    await page.locator(".ov").waitFor({ state: "visible" });
    await page.locator('.ov [data-ov-tab="vocab"]').first().click();
    await page.locator("#panel-vocab").waitFor({ state: "visible" });
    assert.equal(
      await page.locator("#tab-vocab").getAttribute("aria-selected"),
      "true",
      "data-ov-tab buttons must switch the hub tab",
    );
    await page.locator("#tab-overview").click();
    await page.waitForTimeout(300); // let the tab-panel fade-in finish before measuring contrast
    await runAxe(page, "bcpss-unit-overview");
    console.log(`  PASS [Language Studio (${studioRows} activities) + Overview + tab jump + axe 0]`);

    // Legacy bookmarks map onto the v2 tabs
    for (const [legacy, expected] of [
      ["connections", "overview"],
      ["activities", "studio"],
      ["esol", "studio"],
    ]) {
      await page.goto(`${baseUrl}/bcpss-teachers/?unit=g6-math-u1&tab=${legacy}`, { waitUntil: "load" });
      await page.locator(`#tab-${expected}[aria-selected="true"]`).waitFor({ timeout: 5000 });
    }
    console.log("  PASS [Legacy tab bookmarks: connections, activities, esol]");

    await page.goto(`${baseUrl}/bcpss-teachers/?grade=6&subject=Math&unit=g6-math-u2`, {
      waitUntil: "networkidle",
    });

    // Journey: Teacher Creation Studio (Interactive, Worksheet with Answer Key, Presentation, inline edit, save)
    await page.locator("#tab-create").click();
    await page.locator('[data-cs-type="worksheet"]').click();
    await page.locator('[data-cs-view="teacher"]').click();
    const keyCount = await page.locator(".cs-answer-key").count();
    assert.ok(keyCount >= 3, "Teacher View must show Answer Keys & Look-Fors");
    await page.locator("#csEditTitle").fill("Custom Ratios Worksheet");
    await page.locator("[data-cs-save-local]").click();
    await page.locator("[data-cs-preview-student]").click();
    await page.locator("#creationPreviewDialog").waitFor({ state: "visible" });
    await page.locator("#closeCreationPreviewBtn").click();
    await runAxe(page, "bcpss-creation-studio");
    console.log(
      "  PASS [Teacher Creation Studio: Worksheet/Answer Key, Preview Dialog, Local Save + axe 0]",
    );

    // Journey: Family & Evidence (Bridge link, Deconstruct, Evidence) + Share Plan
    await page.locator("#tab-family").click();
    const guideHref = await page.locator(".bh-family-guide-cta").getAttribute("href");
    assert.equal(
      guideHref,
      "/family/bcpss/?unit=g6-math-u2",
      "Family Bridge must link to the full family guide for this unit",
    );
    await page.locator('[data-family-subview="deconstruct"]').click();
    await page.locator("#sampleMathBtn").click();
    await page.locator("#deconstructSubmitBtn").click();
    await page.waitForTimeout(400);
    const decHtml = await page.locator("#deconstructResults").innerHTML();
    if (!decHtml.includes("bh-tier-card")) {
      throw new Error(`Unexpected #deconstructResults content: ${decHtml.slice(0, 400)}`);
    }
    await page
      .locator("#deconstructResults .bh-tier-card")
      .first()
      .waitFor({ state: "visible", timeout: 5000 });
    await page.locator('[data-family-subview="evidence"]').click();
    const evText = await page.locator("#familyEvidenceSubview").innerText();
    assert.ok(
      evText.includes("Demonstration Classroom Snapshot"),
      "Evidence view must clearly label demonstration data",
    );
    await runAxe(page, "bcpss-family-evidence");

    // Share Plan
    await page.locator("#sharePlanBtn").click();
    await page.locator("#teacherNoteInput").fill("Front-load Level 3-4 frames on Tuesday.");
    await page.locator("#saveSharePlanBtn").click();
    await page.locator("#shareResultBox").waitFor({ state: "visible" });
    const sharedUrl = await page.locator("#shareUrlOutput").inputValue();
    assert.ok(
      sharedUrl.includes("/bcpss-teachers/plan/"),
      `Expected shareable plan URL, got ${sharedUrl}`,
    );
    await page.locator("#closeShareDialogBtn").click();
    console.log("  PASS [Family guide link, Passage Deconstruct, Evidence View, Share Plan]");

    // Multi-grade spot checks: K–2 (g1-ela-u1), 3–5 (g4-science-u1), 6–8 (g7-ss-u1)
    for (const [unitId, expectedBand] of [
      ["g1-ela-u1", "k2"],
      ["g4-sci-u1", "35"],
      ["g7-ss-u1", "68"],
    ]) {
      await page.goto(`${baseUrl}/bcpss-teachers/?unit=${unitId}&tab=vocab`, {
        waitUntil: "load",
      });
      await page.locator(`.vs-shell.is-band-${expectedBand}`).waitFor({ state: "visible" });
      const svgs = await page.locator(".vs-card svg").count();
      assert.ok(svgs >= 1, `Unit ${unitId} should render programmatic SVGs`);
    }
    console.log("  PASS [K–2 g1-ela-u1, 3–5 g4-science-u1, 6–8 g7-ss-u1 deep links & grade bands]");

    assert.equal(consoleErrors.length, 0, `Unexpected page errors: ${consoleErrors.join("; ")}`);
    console.log("=== ALL BCPSS STUDIO E2E + AXE + RESPONSIVE CHECKS PASSED ===");
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});

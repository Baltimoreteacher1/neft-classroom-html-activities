#!/usr/bin/env node
/**
 * verify-family-resources.mjs — prove every "Learn more online" link is real, then record it.
 *
 *   node scripts/verify-family-resources.mjs            verify every resource, write the record
 *   node scripts/verify-family-resources.mjs --only id1,id2
 *   node scripts/verify-family-resources.mjs --dry-run  print, write nothing
 *   node scripts/verify-family-resources.mjs --prune    also remove resources that failed
 *
 * Needs a network and a browser (the Playwright Chromium, or PW_CHROMIUM_PATH). NOT part of
 * the gate: the gate (tools/validate-family-resources.mjs) reads only the record this writes.
 *
 * Why a browser. Khan Academy answers HTTP 200 to EVERY path, including paths that do not
 * exist, and serves a bot-check page to curl. `curl -sIL -w '%{http_code}'` therefore "verifies"
 * anything. The real answer is in the rendered page: a missing page titles itself
 * "Page not found". So a resource passes only when, after redirects, the browser lands on a
 * khanacademy.org content page (/v/, /a/ or /e/), the response status is 200, the page title is
 * not a not-found page, and the page has a heading. The recorded finalUrl, pageTitle and heading
 * let a person see WHICH page it is (an old path once redirected to an Indian class-9 course).
 *
 * Spanish: the same path on es.khanacademy.org is checked the same way, and recorded as
 * urlEs only when it exists and is the same content slug.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { RESOURCES_PATH } from "./homework-external-resources.mjs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const PRUNE = args.includes("--prune");
const onlyArg = args.find((a, i) => args[i - 1] === "--only");
const ONLY = onlyArg ? new Set(onlyArg.split(",")) : null;

const NOT_FOUND = /page not found|página no encontrada|no encontramos|oops|¡ups/i;
const CONTENT_PATH = /\/(v|a|e)\/[^/]+\/?$/;
const lastSlug = (u) => new URL(u).pathname.split("/").filter(Boolean).pop();

/** Load one page and report what a person would see. */
async function inspect(page, url) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(4500);
      const heading = await page
        .locator("h1")
        .first()
        .textContent({ timeout: 6000 })
        .catch(() => "");
      const title = await page.title();
      const finalUrl = page.url();
      const status = response ? response.status() : 0;
      const host = new URL(finalUrl).hostname;
      const ok =
        status === 200 &&
        /(^|\.)khanacademy\.org$/.test(host) &&
        CONTENT_PATH.test(new URL(finalUrl).pathname) &&
        !NOT_FOUND.test(title) &&
        !NOT_FOUND.test(heading || "") &&
        Boolean((heading || "").trim());
      return { ok, status, finalUrl, pageTitle: title, heading: (heading || "").trim() };
    } catch (e) {
      if (attempt === 2)
        return {
          ok: false,
          status: 0,
          finalUrl: url,
          pageTitle: "",
          heading: "",
          error: String(e.message || e).slice(0, 160),
        };
    }
  }
  return null;
}

const data = JSON.parse(readFileSync(RESOURCES_PATH, "utf8"));
const today = new Date().toISOString().slice(0, 10);
const ids = Object.keys(data.resources).filter((id) => !ONLY || ONLY.has(id));

const browser = await chromium.launch({
  headless: true,
  ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
});
const context = await browser.newContext({ locale: "en-US" });

const failed = [];
let esCount = 0;
let aborted = false;
browser.on("disconnected", () => {
  aborted = true;
});

async function verifyOne(page, id) {
  const r = data.resources[id];
  const en = await inspect(page, r.url);
  const record = {
    verifiedOn: today,
    ok: en.ok,
    status: en.status,
    finalUrl: en.finalUrl,
    pageTitle: en.pageTitle,
    heading: en.heading,
  };
  if (en.error) record.error = en.error;
  if (en.ok) {
    // Link the page Khan Academy settled on, so a family never takes a redirect hop.
    r.url = en.finalUrl;
    const esCandidate = new URL(en.finalUrl);
    esCandidate.hostname = "es.khanacademy.org";
    const es = await inspect(page, esCandidate.href);
    const sameContent = es.ok && lastSlug(es.finalUrl) === lastSlug(en.finalUrl);
    record.es = {
      verifiedOn: today,
      ok: sameContent,
      status: es.status,
      finalUrl: es.finalUrl,
      pageTitle: es.pageTitle,
      heading: es.heading,
    };
    if (sameContent && new URL(es.finalUrl).hostname === "es.khanacademy.org") {
      r.urlEs = es.finalUrl;
      esCount++;
    } else {
      delete r.urlEs;
    }
  } else {
    failed.push(id);
    delete r.urlEs;
  }
  r.verification = record;
  console.log(
    `${en.ok ? "ok  " : "FAIL"} ${id}  ${record.es?.ok ? "[es]" : "    "} ${en.pageTitle || en.error || ""}`,
  );
}

// A few pages at once: 100+ resources, two page loads each.
const queue = [...ids];
const WORKERS = Math.min(4, queue.length);
await Promise.all(
  Array.from({ length: WORKERS }, async () => {
    const page = await context.newPage();
    while (queue.length && !aborted) await verifyOne(page, queue.shift());
  }),
);
if (aborted) {
  console.error("The browser closed during the run; nothing was written.");
  process.exit(2);
}
await browser.close();

if (PRUNE && failed.length) {
  for (const id of failed) {
    delete data.resources[id];
    for (const lesson of Object.values(data.lessons)) {
      lesson.resources = lesson.resources.filter((x) => x !== id);
      if (!lesson.resources.length && !lesson.reason)
        lesson.reason = "No verified on-topic resource.";
    }
  }
}

const unit = (lessonId) => lessonId.split("-")[0];
const perUnit = {};
for (const [lessonId, lesson] of Object.entries(data.lessons)) {
  const u = unit(lessonId);
  perUnit[u] ??= { linked: 0, none: 0 };
  perUnit[u][lesson.resources.length ? "linked" : "none"]++;
}
console.log(
  `\n${ids.length - failed.length}/${ids.length} resources verified, ${failed.length} failed, ${esCount} with a Spanish page.`,
);
console.log("lessons with links / without, by unit:", JSON.stringify(perUnit));
if (failed.length)
  console.log(
    `failed: ${failed.join(", ")}${PRUNE ? " (pruned)" : " (run with --prune to drop them)"}`,
  );

if (!DRY) {
  writeFileSync(RESOURCES_PATH, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`wrote ${RESOURCES_PATH}`);
}
process.exit(failed.length && !PRUNE ? 1 : 0);

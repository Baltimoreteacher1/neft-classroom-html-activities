#!/usr/bin/env node
import { serveAccess } from "./lib/access-serve.mjs";
/**
 * Browser walk of Everyday English (/access-practice-lab/lingua): the shelf, all nine activities, one real answer in
 * each activity that records one, and the storage and honesty rules:
 *   - progress is written to accessPracticeLab:v1:lingua through the lab's storage, never the standalone key
 *   - difficulty tags show as Starter / Building / Stretch; raw A1/A2/B1 never reach the page
 *   - no screen prints a proficiency level or score claim
 *   - no console or page errors, no horizontal overflow at 375px
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { SCORE_CLAIM } from "./lib/access-studio-rules.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-lingua-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-lingua-e2e: axe-core/playwright is not installed; skipping axe checks.");
}

const BASE = "/access-practice-lab";
const KEY = "accessPracticeLab:v1:lingua";
const IDS = [
  "vocab",
  "listening",
  "sentence",
  "reading",
  "speaking",
  "dialogue",
  "grammar",
  "writing",
  "quiz",
];
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};

const { server, base } = await serveAccess();
const origin = process.env.BASE || base;
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-lingua-e2e: SKIP — no browser (${error.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}
const page = await (await browser.newContext({ viewport: { width: 1200, height: 900 } })).newPage();
const problems = [];
const noise = /web-vitals|Failed to load resource|ERR_ABORTED|speechSynthesis/i;
page.on("pageerror", (e) => !noise.test(e.message) && problems.push(`pageerror: ${e.message}`));
page.on(
  "console",
  (m) => m.type() === "error" && !noise.test(m.text()) && problems.push(`console: ${m.text()}`),
);

const go = async (path) => {
  await page.goto(`${origin}${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => (document.querySelector("#app")?.innerText || "").trim().length > 10,
    { timeout: 10000 },
  );
};
const saved = () => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), KEY);
const text = () => page.locator("#app").innerText();
const axe = async (label) => {
  if (!AxeBuilder) return;
  const r = await new AxeBuilder({ page })
    .include(".lg-studio")
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  ok(
    r.violations.length === 0,
    `${label}: axe has no violations${r.violations.length ? ` (${r.violations.map((v) => v.id).join(", ")})` : ""}`,
  );
};

// ── the shelf ────────────────────────────────────────────────────────────────
await go("/lingua");
ok((await page.locator(".lg-card").count()) === IDS.length, "shelf lists all nine activities");
ok((await page.locator("h1").innerText()).length > 5, "hero heading renders");
await axe("lingua shelf");

// ── every activity opens and mounts ─────────────────────────────────────────
for (const id of IDS) {
  await go(`/lingua/${id}`);
  const mounted = await page.locator("[data-lg-mount] .act").count();
  ok(mounted === 1, `${id}: activity mounts at /lingua/${id}`);
  ok((await page.locator("h1").count()) === 1, `${id}: exactly one page heading`);
  ok(
    (await page.locator(`.lg-card[aria-current="page"]`).count()) === 1,
    `${id}: shelf marks the open activity`,
  );
  ok(!/\b(?:A1|A2|B1)\b/.test(await text()), `${id}: raw A1/A2/B1 tags are not shown`);
  ok(!SCORE_CLAIM.test(await text()), `${id}: no proficiency or score claim`);
}

// ── one real answer where an activity records one ───────────────────────────
await go("/lingua/quiz");
await page.locator('[data-lg-mount] [data-action="answer"]').first().click();
let s = await saved();
ok(s?.mastery?.quiz?.attempts === 1, "quiz: an answer is recorded under the lab's lingua key");
ok(s?.xp >= 0 && typeof s?.streak === "number", "quiz: practice points and streak are kept");
ok(
  (await page.evaluate(() => localStorage.getItem("lingua.studio.v1"))) === null,
  "the standalone lingua.studio.v1 key is never written",
);

for (const id of ["grammar", "reading", "dialogue"]) {
  await go(`/lingua/${id}`);
  if (id === "reading") await page.locator('[data-lg-mount] [data-action="open"]').first().click();
  if (id === "dialogue")
    await page.locator('[data-lg-mount] [data-action="start"]').first().click();
  await page
    .locator('[data-lg-mount] [data-action="answer"], [data-lg-mount] [data-action="choose"]')
    .first()
    .click();
  s = await saved();
  ok((s?.mastery?.[id]?.attempts || 0) >= 1, `${id}: an answer is recorded`);
}

await go("/lingua/vocab");
await page.locator('[data-lg-mount] [data-action="flip"]').click();
await page.locator('[data-lg-mount] [data-action="grade"]').first().click();
s = await saved();
ok(
  (s?.mastery?.vocab?.attempts || 0) >= 1 && Object.keys(s?.cards || {}).length >= 1,
  "vocab: a graded card is recorded and scheduled",
);

await go("/lingua/speaking");
await page.locator('[data-lg-mount] [data-action="self"]').first().click();
ok(/Self-rated/.test(await text()), "speaking: self-rating shows feedback without crashing");
s = await saved();
ok((s?.mastery?.speaking?.attempts || 0) === 1, "speaking: the self-rated attempt is recorded");

await go("/lingua/sentence");
await page
  .locator('[data-lg-mount] [data-action="hint"]')
  .first()
  .click()
  .catch(() => {});
ok(
  (await page.locator("[data-lg-mount] .act").count()) === 1,
  "sentence: activity survives a hint request",
);

await go("/lingua/writing");
await page.locator('[data-lg-mount] [data-action="open"]').first().click();
await page
  .locator("[data-lg-mount] textarea")
  .fill("Dear Sam, I would like to ask about the room. Thank you. Best wishes, Jo");
await page.locator('[data-lg-mount] [data-action="check"]').first().click();
s = await saved();
ok(
  typeof s?.drafts === "object" && Object.values(s.drafts).some((d) => /Dear Sam/.test(d)),
  "writing: the draft is saved on this device",
);

// ── progress persists across a reload and shows on the shelf ────────────────
await go("/lingua");
ok(
  /\d+% (?:correct|correctas)/.test(await text()),
  "shelf shows accuracy once an activity has answers",
);
await axe("lingua activity");

// ── mobile ──────────────────────────────────────────────────────────────────
await page.setViewportSize({ width: 375, height: 800 });
for (const path of ["/lingua", "/lingua/quiz", "/lingua/vocab"]) {
  await go(path);
  const over = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  ok(over <= 1, `${path}: no horizontal overflow at 375px`);
}

ok(
  problems.length === 0,
  `no console or page errors${problems.length ? `: ${problems.slice(0, 3).join(" | ")}` : ""}`,
);
await browser.close();
server.close();
if (failures.length) {
  console.error(`access-lingua-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("access-lingua-e2e: all checks passed");

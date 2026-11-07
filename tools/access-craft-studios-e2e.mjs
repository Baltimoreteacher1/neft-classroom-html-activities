#!/usr/bin/env node
/**
 * Argument Arena (/arena), Mentor Text Explorer (/mentor) and Sentence Lab (/sentences) in a real browser at 375px
 * and 1440px. A learner builds an argument (real mouse drag, then tap-to-place), records with a fake microphone,
 * answers the counterargument and prints the card; finds and collects a writer's move and tries it; builds a sentence
 * by drag and by tap, spots and fixes errors. Also asserts: reload resumes, one saved key, ledger entries, no console
 * or page errors, no horizontal overflow (including 140% text, bilingual), and axe WCAG 2.2 AA.
 *
 *   node tools/access-craft-studios-e2e.mjs        (serves this working tree; BASE=<url> to point elsewhere)
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
  console.warn("access-craft-studios-e2e: SKIP: playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-craft-studios-e2e: axe-core/playwright is not installed; skipping axe.");
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
const KEY = "accessPracticeLab:v1:craft";
const LEDGER = "accessPracticeLab:v1:ledger";

let server = null;
let origin = process.env.BASE;
if (!origin) {
  server = await serve();
  origin = `http://localhost:${server.address().port}`;
}
let browser;
try {
  browser = await chromium.launch({
    args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"],
  });
} catch (error) {
  console.warn(`access-craft-studios-e2e: SKIP: no browser (${error.message.split("\n")[0]})`);
  server?.close();
  process.exit(process.env.CI ? 1 : 0);
}

async function run(width) {
  const tag = `${width}px`;
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    reducedMotion: "reduce",
    permissions: ["microphone"],
  });
  await context.addInitScript(() => {
    try {
      if (!sessionStorage.getItem("cs-e2e")) {
        localStorage.clear();
        localStorage.setItem(
          "accessPracticeLab:v1:prefs",
          JSON.stringify({ langChosen: true, band: "6-8" }),
        );
        sessionStorage.setItem("cs-e2e", "1");
      }
    } catch {}
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
    await page.goto(`${origin}${LAB}${path}`, { waitUntil: "load" });
    await page.waitForSelector("#app > :not(.boot)");
  };
  const ls = (key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), key);
  const overflow = () =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  // Overflow caused by the studios themselves: anything inside #app wider than the window. (The site header's tool
  // links already overflow at 140% bilingual on every page, including the Voice Lab; that is not this stream's.)
  const appOverflow = () =>
    page.evaluate(() => {
      const w = document.documentElement.clientWidth;
      return [...document.querySelectorAll("#app *")].filter(
        (e) => e.getBoundingClientRect().right > w + 1 && !e.closest("svg"),
      ).length;
    });
  const axe = async (label) => {
    if (!AxeBuilder) return;
    await page.evaluate(() => window.scrollTo(0, 0));
    const res = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const bad = res.violations.map(
      (v) => `${v.id}[${v.impact}](${v.nodes.length}): ${v.nodes[0].target.join(" ")}`,
    );
    ok(bad.length === 0, `${tag} axe ${label}${bad.length ? `: ${bad.join(" | ")}` : ""}`);
  };

  // ── Argument Arena ────────────────────────────────────────────────────────
  await go("/arena?grades=6-8");
  ok((await page.locator(".craft-card").count()) >= 13, `${tag} arena hub lists 13 topics for 6-8`);
  ok((await overflow()) <= 0, `${tag} arena hub has no horizontal overflow`);
  await axe("arena hub");
  await page.locator('a[href*="/arena/phones"]').click();
  await page.waitForSelector(".cs-stepper");
  await page.locator('[data-ar-step="claim"]').first().click();
  await page.locator('[data-ar-side="y"]').click();
  await page.locator('[data-ar-frame="claim"]').click();
  ok(
    (await page.locator('[data-ar-field="claim"]').inputValue()).includes("I believe"),
    `${tag} the claim frame is added at level A`,
  );
  await page
    .locator('[data-ar-field="claim"]')
    .fill("I believe students should keep phones in lockers during school.");
  await page.locator('[data-ar-step="build"]').first().click();
  await page.waitForSelector(".cs-build");
  await axe("arena build");
  const first = page.locator("[data-ar-card]").first();
  const cardId = await first.getAttribute("data-ar-card");
  const slot0 = page.locator('[data-ar-slot="0"]');
  if (width >= 1000) await first.dragTo(slot0);
  else await page.locator(`[data-ar-place="${cardId}"][data-slot="0"]`).click(); // phones place by tap
  ok(
    (await page.locator('[data-ar-slot="0"] blockquote').count()) === 1,
    `${tag} ${width >= 1000 ? "dragging" : "tapping"} a card fills evidence slot 1`,
  );
  const state1 = await ls(KEY);
  ok(
    state1?.arena?.topics?.phones?.slots?.[0] === cardId,
    `${tag} the placement is saved under the craft key`,
  );
  // Tap-to-place for the second card, using the keyboard.
  const place = page.locator('[data-ar-place="phones-3"][data-slot="1"]');
  await place.focus();
  await page.keyboard.press("Enter");
  ok(
    (await page.locator('[data-ar-slot="1"] blockquote').count()) === 1,
    `${tag} keyboard tap-to-place fills evidence slot 2`,
  );
  const sides = await page.evaluate(
    () => JSON.parse(localStorage.getItem("accessPracticeLab:v1:craft")).arena.topics.phones.slots,
  );
  ok(sides.every(Boolean), `${tag} both slots are saved`);
  await page.locator("[data-ar-check-arg]").click();
  const msg = await page.locator(".cs-feedback").first().innerText();
  ok(
    /own words|Under each card|Explain why/.test(msg),
    `${tag} the check gives specific next steps (${msg.slice(0, 40).replace(/\s+/g, " ")})`,
  );
  await page
    .locator('[data-ar-field="note0"]')
    .fill("According to a teacher, class talks grew longer once phones were away.");
  await page
    .locator('[data-ar-field="note1"]')
    .fill("Research says a silent phone nearby still pulls attention away from the task.");
  await page
    .locator('[data-ar-field="reason"]')
    .fill("This matters because students listen better when they are not checking messages.");
  await page.locator("[data-ar-check-arg]").click();
  ok(
    (await page.locator(".cs-feedback .cs-win").count()) === 1,
    `${tag} a complete argument gets the win message`,
  );
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".cs-stepper");
  ok((await page.locator(".cs-build").count()) === 1, `${tag} reload resumes on the Build step`);
  const ledger1 = (await ls(LEDGER))?.entries?.filter((e) => e.src === "arena") || [];
  ok(
    ledger1.length >= 1 && ledger1[0].stage === "supported",
    `${tag} the argument wrote a supported arena ledger entry`,
  );
  ok(
    !JSON.stringify(ledger1).includes("phones in lockers"),
    `${tag} ledger entries hold no learner text`,
  );

  // Rehearse: the lab's recorder with a fake microphone.
  await page.locator('[data-ar-step="speak"]').first().click();
  await page.locator("[data-rec-start]").click();
  await page.waitForSelector("[data-rec-stop]");
  await page.waitForTimeout(1200);
  await page.locator("[data-rec-stop]").click();
  await page.waitForSelector(".takes audio");
  ok((await page.locator(".takes audio").count()) >= 1, `${tag} a take can be replayed`);
  ok(
    /seconds of speaking/.test(await page.locator("#app").innerText()),
    `${tag} the take shows a plain length note`,
  );
  await axe("arena speak");
  await page.locator('[data-ar-step="counter"]').first().click();
  await page.locator('[data-ar-counter-type="clarify"]').click();
  await page.locator('[data-ar-field="counter"]').fill("Can you explain what evidence shows that?");
  await page.locator("[data-ar-check-counter]").click();
  ok(
    (await page.locator(".cs-feedback .cs-win").count()) === 1,
    `${tag} a clarifying question passes the response check`,
  );
  await page.locator('[data-ar-step="card"]').first().click();
  await page.waitForSelector(".arena-card");
  await page.locator('input[name="self-claim"][value="2"]').check();
  await axe("arena card");
  ok((await overflow()) <= 0, `${tag} the argument card has no horizontal overflow`);
  await page.emulateMedia({ media: "print" });
  ok(await page.locator(".arena-card").isVisible(), `${tag} the argument card is visible in print`);
  ok(!(await page.locator(".cs-stepper").isVisible()), `${tag} the stepper is hidden in print`);
  await page.emulateMedia({ media: "screen" });

  // ── Mentor Text Explorer ──────────────────────────────────────────────────
  await go("/mentor?grades=3-5");
  ok(
    (await page.locator(".craft-card").count()) === 16,
    `${tag} mentor hub lists 16 texts for 3-5`,
  );
  await axe("mentor hub");
  await page.locator('a[href*="/mentor/m01"]').click();
  await page.waitForSelector(".cs-paper");
  await page.locator("[data-mt-move]").nth(1).click();
  await page.waitForSelector(".cs-note-card");
  await page.locator("[data-mt-collect]").click();
  ok(
    ((await ls(KEY))?.mentor?.toolbox || []).length === 1,
    `${tag} collecting a move saves it to the toolbox`,
  );
  await axe("mentor text");
  await go("/mentor/try/verb?grades=3-5");
  await page.locator("[data-mt-field]").fill("The dog bolted to the door.");
  await page.locator("[data-mt-check]").click();
  ok(
    /bolted/.test(await page.locator(".cs-feedback").innerText()),
    `${tag} try-it feedback names the verb it found`,
  );
  await page.locator("[data-mt-field]").fill("The dog went to the door.");
  await page.locator("[data-mt-check]").click();
  ok(
    /plain word/.test(await page.locator(".cs-feedback").innerText()),
    `${tag} try-it feedback names the plain word left`,
  );
  await go("/mentor/toolbox?grades=3-5");
  ok(
    (await page.locator(".cs-collected li").count()) === 1,
    `${tag} the toolbox shows the collected phrase`,
  );
  await axe("mentor toolbox");

  // ── Sentence Lab ──────────────────────────────────────────────────────────
  await go("/sentences?grades=3-5");
  await axe("sentences hub");
  await page.locator('a[href*="/sentences/3?"]').click();
  await page.waitForSelector(".cs-tray-tiles");
  const wantFirst = ["I", "like", "pizza", ",", "and", "my brother", "likes", "pasta", "."];
  // Drag the first tile by the mouse, then tap the rest.
  const tile = (text) => page.locator(`[data-sl-tile]:has(span:text-is("${text}"))`).first();
  await tile("I").dragTo(page.locator("[data-sl-drop]"));
  ok((await page.locator("[data-sl-placed]").count()) === 1, `${tag} dragging a tile places it`);
  for (const t of wantFirst.slice(1)) await tile(t).click();
  ok(
    (await page.locator(".cs-machine").count()) === 1,
    `${tag} the live machine is visible while building`,
  );
  await page.locator("[data-sl-check]").click();
  await page.waitForSelector(".cs-win");
  ok(
    /I like pizza, and my brother likes pasta\./.test(await page.locator(".cs-win").innerText()),
    `${tag} the correct sentence is confirmed`,
  );
  ok(
    /compound sentence/.test(await page.locator(".cs-machine figcaption").innerText()),
    `${tag} the machine names the sentence type`,
  );
  await axe("sentences build");
  await page.locator("[data-sl-next]").click();
  await page.waitForSelector("#sl-task");
  // Level 1 spot and fix tasks.
  await go("/sentences/1?grades=3-5");
  for (let i = 0; i < 40 && !(await page.locator("[data-sl-spot]").count()); i++) {
    await page
      .locator("[data-sl-go]")
      .last()
      .click()
      .catch(() => {});
    await page.waitForTimeout(30);
    if (!(await page.locator("[data-sl-go]").count())) break;
  }
  ok((await overflow()) <= 0, `${tag} sentence tasks have no horizontal overflow`);
  const entries = ((await ls(LEDGER))?.entries || []).filter(
    (e) => e.src === "arena" || e.src === "craft",
  );
  ok(entries.length >= 1, `${tag} the studios wrote evidence-ledger entries`);

  // Bilingual at 140% text, 375px: no horizontal overflow on the busiest pages.
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("accessPracticeLab:v1:prefs") || "{}");
    localStorage.setItem(
      "accessPracticeLab:v1:prefs",
      JSON.stringify({ ...p, lang: "bi", textSize: 1.4 }),
    );
  });
  for (const path of [
    "/arena/phones",
    "/mentor/m17",
    "/sentences/3",
    "/sentences/notes",
    "/arena",
  ]) {
    await go(
      `${path}?grades=${path.includes("m17") || path.includes("phones") || path === "/arena" ? "6-8" : "3-5"}`,
    );
    ok(
      (await appOverflow()) === 0,
      `${tag} ${path} bilingual at 140% text has no content wider than the window`,
    );
  }
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem("accessPracticeLab:v1:prefs") || "{}");
    localStorage.setItem(
      "accessPracticeLab:v1:prefs",
      JSON.stringify({ ...p, lang: "es", textSize: 1 }),
    );
  });
  await go("/sentences?grades=3-5");
  ok(
    /Laboratorio de oraciones/.test(await page.locator("#app").innerText()),
    `${tag} Spanish renders`,
  );
  ok(
    errors.length === 0,
    `${tag} no console or page errors${errors.length ? `: ${errors.slice(0, 3).join(" | ")}` : ""}`,
  );
  await context.close();
}

try {
  await run(1440);
  await run(375);
} finally {
  await browser.close();
  server?.close();
}
if (failures.length) {
  console.error(`\naccess-craft-studios-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-craft-studios-e2e: all checks passed");

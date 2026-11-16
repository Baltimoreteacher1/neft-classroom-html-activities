#!/usr/bin/env node
/**
 * Language Labs (/language-labs): the hub lists six labs; each built lab walks See it → Explore → Example → Practice →
 * New task; a wrong practice answer gives a clue, not the answer; the right answer is accepted; a transfer is checked;
 * progress survives a reload; axe on hub and a lab; no sideways scroll on a phone. Also: Speaking Studio's
 * "Make it a narrated book page" lands the learner's words in Book Studio. BASE=<url> to point elsewhere.
 */
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("language-labs-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 3);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}

const shotsArg = process.argv.indexOf("--shots");
const SHOTS = shotsArg > 0 ? process.argv[shotsArg + 1] : "";
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
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
const browser = await chromium.launch();
const errors = [];
const settle = async (page) => {
  await page.waitForFunction(() => !document.querySelector(".is-entering"));
  await page.waitForTimeout(300);
};
async function axe(page, sel, name) {
  if (!AxeBuilder) return;
  await settle(page);
  const r = await new AxeBuilder({ page })
    .include(sel)
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(
    bad.length === 0,
    `axe: ${name} ${bad.map((v) => `${v.id}(${v.nodes.length}) ${v.nodes[0]?.target}`).join(" ")}`,
  );
}
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  const go = async (path) => {
    await page.goto(`${origin}${LAB}/${path}`);
    await page.waitForSelector("#app h1", { timeout: 15000 });
  };
  await go("language-labs?grades=6-8");
  ok((await page.locator(".ll-card").count()) === 6, "hub lists six labs");
  for (const href of [
    "scaffold/sentence-architecture",
    "scaffold/evidence-builder",
    "scaffold/language-upgrade",
  ])
    ok((await page.locator(`.ll-card[href*="${href}"]`).count()) === 1, `hub links ${href}`);
  await axe(page, ".ll-hub", "hub");
  if (SHOTS) await page.locator("#app").screenshot({ path: join(SHOTS, "hub.png") });

  // Verb Time Machine
  await go("language-labs/verb-time-machine?step=2&grades=6-8");
  const before = await page.locator(".ll-sentence").innerText();
  await page.locator("[data-ll-slide]").fill("0");
  await page.waitForTimeout(200);
  ok(
    (await page.locator(".ll-sentence").innerText()) !== before &&
      /had built/.test(await page.locator(".ll-sentence").innerText()),
    "sliding the timeline changes the verb (had built)",
  );
  if (SHOTS) await page.locator("#app").screenshot({ path: join(SHOTS, "verb-explore.png") });
  await go("language-labs/verb-time-machine?step=3&grades=6-8");
  await page.click("[data-ll-guided]");
  ok(
    (await page.locator(".ll-guided-steps li").count()) === 2,
    "example reveals one step at a time",
  );
  await go("language-labs/verb-time-machine?step=4&grades=6-8");
  await page.fill('[data-ll-answer="vt-68-4"]', "writes");
  await page.click('[data-ll-check="vt-68-4"]');
  const fb = await page.locator(".ll-item .feedback").first().innerText();
  ok(
    /Last spring/.test(fb) && !/\bwrote\b/.test(fb),
    "a wrong verb gets the time clue, not the answer",
  );
  await page.fill('[data-ll-answer="vt-68-4"]', "wrote");
  await page.click('[data-ll-check="vt-68-4"]');
  ok((await page.locator(".ll-item.is-done").count()) === 1, "the right verb is accepted");
  await go("language-labs/verb-time-machine?step=5&grades=6-8");
  await page.fill(
    "[data-ll-transfer]",
    "Last year our park was empty and quiet. Now kids are playing soccer there every day. Next summer the city will build a new playground.",
  );
  await page.click("[data-ll-check-transfer]");
  ok(
    (await page.locator(".ll-transfer .feedback.is-right").count()) === 1,
    "transfer writing that moves through time is recognized",
  );
  await page.reload();
  await page.waitForSelector(".ll-steps");
  ok((await page.locator(".ll-steps a.is-seen").count()) >= 4, "progress survives a reload");
  await axe(page, ".ll-lab", "verb lab");

  // Connector Bridge
  await go("language-labs/connector-bridge?step=2&grades=6-8");
  await page.click('[data-ll-connector="although"]');
  ok(
    /Strange/.test(await page.locator(".ll-misfit").innerText()),
    "a misfit connector explains the meaning it would create",
  );
  await page.click('[data-ll-connector="so"]');
  ok((await page.locator(".ll-fit").count()) === 1, "a fitting connector is confirmed");
  if (SHOTS) await page.locator("#app").screenshot({ path: join(SHOTS, "bridge-explore.png") });
  await go("language-labs/connector-bridge?step=4&grades=6-8");
  await page.click('[data-ll-bridge="cb-68-1"][data-word="but"]');
  ok(
    /says/.test(await page.locator(".ll-item .feedback").first().innerText()),
    "a wrong bridge says what it would mean",
  );
  await page.click('[data-ll-bridge="cb-68-1"][data-word="as a result"]');
  ok(
    (await page.locator(".ll-item.is-done").count()) === 1,
    "the right bridge is accepted and the joined sentence shows",
  );

  // Paragraph X-Ray
  await go("language-labs/paragraph-xray?step=2&grades=6-8");
  ok(
    (await page.locator(".ll-para.is-xray mark.ll-conn").count()) >= 3,
    "x-ray highlights connectors",
  );
  if (SHOTS) await page.locator("#app").screenshot({ path: join(SHOTS, "xray-explore.png") });
  await go("language-labs/paragraph-xray?step=4&grades=6-8");
  const jobs = ["topic", "detail", "detail", "explain", "conclude"];
  for (const [i, j] of jobs.entries()) await page.selectOption(`[data-ll-label="${i}"]`, j);
  await page.click("[data-ll-check-labels]");
  ok(
    (await page.locator(".ll-item.is-done").count()) === 5,
    "correct labels are confirmed sentence by sentence",
  );
  const texts = async () => page.locator(".ll-order li > span:first-child").allInnerTexts();
  for (let guard = 0; guard < 20; guard++) {
    const t = await texts();
    const want = [
      "Middle schools",
      "Research",
      "As a result",
      "Because tired",
      "For these reasons",
    ];
    const pos = t.findIndex((x, i) => !x.startsWith(want[i]));
    if (pos < 0) break;
    const from = t.findIndex((x) => x.startsWith(want[pos]));
    await page.click(`[data-ll-move="${from}"][data-dir="-1"]`);
  }
  await page.click("[data-ll-check-order]");
  ok(
    (await page.locator(".ll-practice .feedback.is-right").count()) === 1,
    "reordering with the arrow buttons solves the paragraph",
  );

  // Speaking Studio → narrated book page (handoff contract)
  await page.evaluate(async () => {
    const { createBookFromContent } = await import("/access-practice-lab/src/book/handoff.js");
    window.__sid = await createBookFromContent({
      source: { kind: "speaking", id: "t", label: "Talk" },
      title: "My Talk",
      templateId: "conversation-book",
      keepTemplatePages: false,
      pages: [
        {
          heading: "My Talk",
          text: "I think recess should be longer because we need to move.",
          audio: new Blob([new Uint8Array(200)], { type: "audio/webm" }),
          audioSeconds: 4,
        },
      ],
    });
  });
  await page.goto(`${origin}${LAB}/book-studio/edit/${await page.evaluate(() => window.__sid)}`);
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page");
  await page.click('.bk-page-item [data-bk-page="1"]');
  ok(
    (await page.locator(".bk-canvas").innerText()).includes("recess should be longer") &&
      (await page.locator(".bk-canvas .bk-t-audio").count()) === 1,
    "speaking words and recording land on a narrated book page",
  );

  // Phone
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const p2 = await phone.newPage();
  for (const path of [
    "language-labs",
    "language-labs/paragraph-xray?step=4",
    "language-labs/verb-time-machine?step=2",
  ]) {
    await p2.goto(`${origin}${LAB}/${path}`);
    await p2.waitForSelector("#app h1");
    const over = await p2.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    ok(over <= 1, `phone: ${path} has no sideways scroll (${over}px)`);
  }
  await phone.close();
} catch (error) {
  failures.push(`crashed: ${error.stack || error}`);
  console.log(`FAIL crashed: ${error.stack || error}`);
} finally {
  await browser.close();
  server?.close();
}
ok(errors.length === 0, `no page errors ${errors.slice(0, 3).join(" | ")}`);
console.log(
  failures.length
    ? `\nlanguage-labs-e2e: ${failures.length} FAILED`
    : "\nlanguage-labs-e2e: all passed",
);
process.exit(failures.length ? 1 : 0);

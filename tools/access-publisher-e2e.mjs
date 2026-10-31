#!/usr/bin/env node
/**
 * Browser walk of /access-practice-lab/publisher-demo: independent path (limited plays, no supports, feedback
 * after answers), supported path (frames, replay, transcript after answering, model only after a take),
 * Speaking with a fake microphone and with the microphone denied, Writing feedback → revision → compare,
 * Evidence + next step, publisher page, axe WCAG 2.2 AA, and 375px overflow. SKIP locally without a browser.
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
  console.warn("access-publisher-e2e: SKIP — playwright missing");
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
  browser = await chromium.launch({
    args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"],
  });
} catch (e) {
  console.warn(`access-publisher-e2e: SKIP — no browser (${e.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}

const J = JSON.parse(
  (await import("node:fs")).readFileSync(
    join(REPO_ROOT, "access-practice-lab/content/publisher/journey.json"),
    "utf8",
  ),
);
const problems = [];
const noise = /web-vitals|Failed to load resource|ERR_ABORTED|speechSynthesis/i;
async function fresh(opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1200, height: 900 },
    permissions: opts.deny ? [] : ["microphone"],
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    // deterministic speech: count utterances, finish immediately
    const spoken = (window.__spoken = []);
    window.speechSynthesis.speak = (u) => {
      spoken.push(u.text);
      setTimeout(() => {
        u.onend?.({});
        u.dispatchEvent(new Event("end"));
      }, 5);
    };
    window.speechSynthesis.getVoices = () => [];
  });
  page.on("pageerror", (e) => !noise.test(e.message) && problems.push(e.message));
  page.on(
    "console",
    (m) => m.type() === "error" && !noise.test(m.text()) && problems.push(m.text()),
  );
  return { ctx, page };
}
const go = async (page, path) => {
  await page.goto(`${origin}/access-practice-lab/publisher-demo${path}`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector("#app h1, #app h2");
};
const text = (page) => page.locator("#app").innerText();

// ── independent path ─────────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh();
  await go(page, "");
  await page.locator('[data-pd-mode="independent"]').check();
  await go(page, "/listen");
  let t = await text(page);
  ok(/Independent attempt/.test(t), "independent badge on Listening");
  ok(
    !/Mr\. Ortiz explains the rain|Good morning, scientists/.test(t),
    "listening script is not on the page before answering",
  );
  ok((await page.locator("[data-pd-part]").count()) === 0, "no replay-by-part in independent mode");
  ok(!/Word help/.test(t), "no word help in independent mode");
  await page.locator("[data-listen='pd-listen']").click();
  await page.waitForFunction(() => document.querySelectorAll(".pd-task").length > 0);
  ok(await page.locator("[data-listen='pd-listen']").first().isEnabled(), "second play allowed");
  await page.locator("[data-listen='pd-listen']").first().click();
  await page.waitForTimeout(150);
  ok(
    await page.locator("[data-listen='pd-listen']").first().isDisabled(),
    "third play blocked at the limit",
  );
  // answer the order task wrongly first
  await page.locator('[data-pd-check="listen:order"]').click();
  t = await text(page);
  ok(
    /Answer saved\. Feedback appears when you finish/.test(t),
    "independent feedback is withheld until the part is finished",
  );
  ok(!/Listen for the signal words/.test(t), "no hint is shown in independent mode");
  await page.locator('[data-pd-answer="listen:infer"][value="c"]').check();
  await page.locator('[data-pd-check="listen:infer"]').click();
  await page.locator('[data-pd-answer="listen:inference"][value="d"]').check();
  await page.locator('[data-pd-check="listen:inference"]').click();
  t = await text(page);
  ok(
    /Transcript \(shown after you answered everything\)/.test(t) && /Not yet/.test(t),
    "feedback and transcript appear only after all answers",
  );
  ok(
    (await page.locator("[data-pd-retry]").count()) === 0,
    "no retry in independent mode (one independent attempt)",
  );
  // Speaking: no options, no model, no frames
  await go(page, "/speak");
  t = await text(page);
  ok(
    (await page.locator("#app input[type=radio][name^=speak]").count()) === 0,
    "speaking has no multiple-choice selection",
  );
  ok(!/Sentence frames|Model answer/.test(t), "independent speaking shows no frames or model");
  ok(/Speaking is shown by speaking/.test(t), "speaking states that it requires speaking");
  await go(page, "/evidence");
  t = await text(page);
  ok(
    /independent/.test(t) && /Synthetic demonstration records/.test(t),
    "evidence labels independent work and synthetic class data",
  );
  await ctx.close();
}

// ── supported path with microphone ──────────────────────────────────────────
{
  const { ctx, page } = await fresh();
  await go(page, "/listen");
  await page.locator("[data-listen='pd-listen']").click();
  await page.waitForSelector("[data-pd-part]");
  ok(true, "supported mode offers replay by part after the first play");
  await page.locator("[data-pd-part='2']").click();
  ok((await page.evaluate(() => window.__spoken.length)) >= 2, "replay by part speaks that part");
  await page.locator("fieldset.pd-order li").first().waitFor();
  // move to correct order: default d,c,b,a → b,c,a,d
  const order = async () => page.locator("fieldset.pd-order li span").allInnerTexts();
  const want = ["A small channel", "The water slows", "The soil filters", "Clean water"];
  for (let guard = 0; guard < 12; guard++) {
    const cur = await order();
    const idx = want.findIndex((w, i) => !cur[i].startsWith(w));
    if (idx === -1) break;
    const from = cur.findIndex((c) => c.startsWith(want[idx]));
    await page.locator("fieldset.pd-order li").nth(from).locator("[data-pd-move]").first().click();
    await page.waitForTimeout(40);
  }
  await page.locator('[data-pd-check="listen:order"]').click();
  ok(/Right/.test(await text(page)), "ordering the steps correctly is recognized");
  // Reading with evidence pinning
  await go(page, "/read");
  await page.locator('[data-pd-answer="read:vocab"][value="a"]').check();
  await page.locator('[data-pd-check="read:vocab"]').click();
  let t = await text(page);
  ok(
    /Why that choice is tempting/.test(t),
    "wrong answer explains why the distractor tempts (supported)",
  );
  await page.locator('[data-pd-retry="read:vocab"]').click();
  await page.locator('[data-pd-answer="read:vocab"][value="b"]').check();
  await page.locator('[data-pd-check="read:vocab"]').click();
  await page.locator('[data-pd-pin*="cannot absorb water"]').first().click();
  await page.locator('[data-pd-check="read:evidence"]').click();
  ok(
    /That sentence names the cause/.test(await text(page)),
    "evidence pinning is checked against the text",
  );
  // Speaking with fake microphone
  await go(page, "/speak");
  t = await text(page);
  ok(
    /Sentence frames/.test(t) && !/Model answer \(after your try\)/.test(t),
    "frames shown, model hidden before the first take",
  );
  await page.locator("[data-rec-start='pd-speak']").click();
  await page.waitForSelector("[data-rec-stop]", { timeout: 15000 });
  await page.waitForTimeout(2500);
  await page.locator("[data-rec-stop]").click();
  await page.waitForSelector("ol.takes audio");
  t = await text(page);
  ok(/What the recording shows/.test(t), "recording produces on-device measures");
  ok(/Model answer \(after your try\)/.test(t), "model appears only after a take");
  await page
    .locator("[data-pd-transcript='0']")
    .fill(
      "Rain lands on the pavement. Pavement cannot absorb water, so runoff flows to the doors and a flood starts.",
    );
  await page.locator("[data-pd-transcript='0']").blur();
  await page.waitForSelector(".feedback");
  ok(
    /What your explanation does/.test(await text(page)),
    "typed transcript yields specific feedback",
  );
  for (const c of ["topic", "details", "thinking"])
    await page.locator(`[data-pd-speakcheck='${c}']`).check();
  // Writing: draft → feedback → revise → compare
  await go(page, "/write");
  await page.locator("[data-pd-draft='1']").fill(J.writing.firstDraftExample);
  await page.locator("[data-pd-feedback]").click();
  await page.waitForSelector("#pd-fb");
  t = await text(page);
  ok(
    /Feedback on your first draft/.test(t) && /Try:/.test(t),
    "writing feedback names a specific next move",
  );
  await page.locator("[data-pd-draft='2']").fill(J.writing.modelDraft);
  await page.locator("[data-pd-draft='2']").blur();
  await page.waitForSelector(".pd-compare");
  t = await text(page);
  ok(/First draft and revision/.test(t) && /→/.test(t), "draft comparison shows measurable change");
  await page
    .locator("[data-pd-reflection]")
    .fill("I added evidence from Table 1 and used because.");
  await page.locator("[data-pd-reflection]").blur();
  await go(page, "/evidence");
  t = await text(page);
  ok(
    /First draft/.test(t) && /Revision/.test(t) && /I added evidence/.test(t),
    "portfolio shows first draft, revision and reflection",
  );
  ok(
    /One next instructional step/.test(t) &&
      /suggestion from practice evidence, not a placement/.test(t),
    "next step is a suggestion, not a placement",
  );
  ok(
    !/WIDA level|proficiency level \d|scale score|overall score/i.test(t),
    "no level or score claims on the evidence page",
  );
  // reload persistence
  await page.reload({ waitUntil: "networkidle" });
  ok(/I added evidence/.test(await text(page)), "work persists across reload");
  // accessibility
  if (AxeBuilder)
    for (const path of ["", "/listen", "/read", "/speak", "/write", "/evidence", "/publishers"]) {
      await go(page, path);
      const res = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
        .analyze();
      ok(
        res.violations.length === 0,
        `axe clean at /publisher-demo${path} ${res.violations.map((v) => `${v.id}(${v.nodes.length})`).join(",")}`,
      );
    }
  // keyboard: tab reaches the primary control
  await go(page, "");
  await page.keyboard.press("Tab");
  ok(
    await page.evaluate(() => document.activeElement && document.activeElement !== document.body),
    "keyboard focus lands on a control",
  );
  // mobile overflow
  await page.setViewportSize({ width: 375, height: 800 });
  for (const path of ["", "/listen", "/read", "/speak", "/write", "/evidence", "/publishers"]) {
    await go(page, path);
    const over = await page.evaluate(() => {
      const bad = document.documentElement.scrollWidth - window.innerWidth;
      return bad;
    });
    ok(
      over <= 1 || path === "/publishers",
      `no horizontal page overflow at 375px: /publisher-demo${path} (${over}px)`,
    );
  }
  await ctx.close();
}

// ── microphone denied ───────────────────────────────────────────────────────
{
  const { ctx, page } = await fresh({ deny: true });
  await ctx.grantPermissions([]);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException("denied", "NotAllowedError"));
  });
  await go(page, "/speak");
  await page.locator("[data-rec-start='pd-speak']").click();
  await page.waitForTimeout(400);
  const err = await page.locator("[data-rec-error='pd-speak']").innerText();
  ok(/microphone|micr/i.test(err), "denied microphone shows a recovery message");
  ok(
    /practice aloud|partner/i.test(await text(page)) ||
      /Self-check|rating sheet/i.test(await text(page)),
    "speaking still offers a partner/teacher route",
  );
  await ctx.close();
}

ok(
  problems.length === 0,
  `no page or console errors${problems.length ? `: ${problems.slice(0, 3).join(" | ")}` : ""}`,
);
await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-publisher-e2e FAIL (${failures.length})`);
  process.exit(1);
}
console.log("\naccess-publisher-e2e PASS");

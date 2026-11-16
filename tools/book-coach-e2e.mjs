#!/usr/bin/env node
/**
 * Book Studio writing coach, in a real browser with /api/book-coach stubbed (route interception): off by default with
 * the plain notice of what is sent; turning it on; all eight actions render dismissible cards; nothing enters the book
 * until "Use this word"; the offline (503) fallback shows labelled built-in tips; a class whose teacher turned the
 * coach off hides it entirely; axe on the coach; no sideways scroll on a phone. BASE=<url>, --shots <dir>.
 */
import { createReadStream, existsSync, mkdirSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("book-coach-e2e: SKIP — playwright is not installed.");
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

const AI = {
  brainstorm: {
    questions: [
      "Who was with you that day?",
      "What did you hear first?",
      "Why do you remember it?",
    ],
  },
  organize: { question: "Would the page about the ending make more sense last?" },
  expand: { questions: ["Who else was at the park?", "When did you get there?"] },
  vocabulary: {
    words: [
      { for: "big", word: "enormous", means: "very, very big" },
      { for: "good", word: "wonderful", means: "very pleasant" },
    ],
  },
  clarity: {
    observations: [
      { kind: "strength", quote: "Yesterday", note: "You tell the reader when it happened." },
      { kind: "try", quote: "It was a good day", note: "A reader wonders what made it good." },
    ],
    next: "Add one detail that shows how the day felt.",
  },
  genre: { questions: ["Where does your story happen?", "How did the day end?"] },
  picture: { questions: ["What is the person doing?", "What colors stand out?"] },
  translate: {
    es: "Fútbol: un deporte en el que se patea una pelota.",
    en: "a sport where you kick a ball",
  },
};
const TYPED =
  "Yesterday my brother and I walked to the big park. It was a good day. We played soccer under a tree.";

const browser = await chromium.launch();
const errors = [];
const sent = [];
let offline = false;
async function stubCoach(context) {
  await context.route("**/api/book-coach", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    sent.push(body);
    if (offline)
      return route.fulfill({
        status: 503,
        contentType: "application/json",
        body: '{"ok":false,"offline":true}',
      });
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        action: body.action,
        source: "claude",
        result: AI[body.action],
      }),
    });
  });
}
async function axe(page, sel, name) {
  if (!AxeBuilder) return;
  await page.waitForFunction(() => !document.querySelector(".is-entering"));
  await page.waitForTimeout(300);
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
async function newBook(page, title) {
  await page.goto(`${origin}${LAB}/book-studio/new?template=personal-narrative&grades=6-8`);
  await page.fill('input[name="title"]', title);
  await page.fill('input[name="author"]', "Ana Secret");
  await page.click('form[data-create] button[type="submit"]');
  await page.waitForSelector("[data-bk-editor] .bk-canvas .bk-page", { timeout: 15000 });
}
const pageText = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".bk-canvas [data-text-of]")]
      .map((n) => n.textContent)
      .join(" | "),
  );

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await stubCoach(context);
  const page = await context.newPage();
  page.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  await newBook(page, "My Big Day");
  await page.click('.bk-page-item [data-bk-page="1"]');
  await page.click('[data-bk-add="text"]');
  await page.keyboard.type(TYPED);
  await page.keyboard.press("Escape");
  await page.waitForSelector("[data-bk-coach-panel]");

  // ── off by default, with the notice ──
  ok(
    (await page.locator("[data-bk-coach]").count()) === 0,
    "coach is OFF by default (no coach buttons)",
  );
  await page.click("[data-bk-coach-settings]");
  const notice = await page.locator("[data-bk-coach-notice]").innerText();
  ok(
    /Off until you turn it on/.test(notice) &&
      /\/api\/book-coach/.test(notice) &&
      /Nothing is kept/.test(notice),
    "Book settings says what is sent, where, and that nothing is kept",
  );
  ok(!(await page.locator("[data-bk-coach-toggle]").isChecked()), "the switch starts off");
  ok(sent.length === 0, "nothing is sent while the coach is off");
  await page.check("[data-bk-coach-toggle]");
  await page.waitForSelector('[data-bk-coach="brainstorm"]');
  ok(
    (await page.locator("[data-bk-coach]").count()) === 8,
    "turning it on shows eight coach buttons",
  );

  const before = await pageText(page);
  const run = async (action) => {
    const first = await page
      .locator("[data-coach-card]")
      .first()
      .getAttribute("data-coach-card")
      .catch(() => null);
    await page.click(`[data-bk-coach="${action}"]`);
    await page.waitForFunction(
      (id) =>
        !document.querySelector("[data-bk-coach]:disabled") &&
        ((document.querySelector("[data-coach-card]")?.getAttribute("data-coach-card") || null) !==
          id ||
          document.querySelector("[data-bk-coach-pick]") ||
          document.querySelector("[data-bk-coach-note]")?.textContent),
      first,
      { timeout: 8000 },
    );
  };
  const top = () => page.locator("[data-coach-card]").first();

  for (const action of ["brainstorm", "organize", "clarity", "genre"]) {
    await run(action);
    ok(
      (await top().getAttribute("data-source")) === "ai" &&
        (await top().locator(".bk-coach-item").count()) >= 1,
      `${action}: a card of AI suggestions`,
    );
    ok((await pageText(page)) === before, `${action}: the book is unchanged`);
  }
  await run("expand");
  ok(
    (await page.locator("[data-bk-coach-sentence]").count()) >= 2,
    "expand: the learner chooses one of their own sentences",
  );
  await page.locator("[data-bk-coach-sentence]").first().click();
  await page.waitForFunction(() =>
    document.querySelector("[data-coach-card]")?.getAttribute("aria-label")?.startsWith("Expand"),
  );
  ok(
    (await top().locator(".bk-coach-item").count()) === 2,
    "expand: two questions about the chosen sentence",
  );
  const expandBody = sent.findLast((b) => b.action === "expand");
  ok(
    expandBody?.payload &&
      Object.keys(expandBody.payload).join() === "sentence" &&
      TYPED.includes(expandBody.payload.sentence),
    `expand sends only the chosen sentence (${expandBody?.payload?.sentence})`,
  );

  await run("vocabulary");
  ok(
    (await top().locator("[data-bk-coach-use]").count()) === 2,
    "vocabulary: word choices, each with Use this word",
  );
  ok((await pageText(page)) === before, "vocabulary: nothing changes until the learner chooses");
  await top().locator("[data-bk-coach-use]").first().click();
  await page.waitForTimeout(300);
  const afterUse = await pageText(page);
  ok(
    /enormous park/.test(afterUse) && !/big park/.test(afterUse),
    "Use this word swaps exactly that word",
  );
  await page.click('[data-bk-act="undo"]');
  await page.waitForTimeout(300);
  ok(/big park/.test(await pageText(page)), "Undo brings the learner's word back");

  // dismiss one, then all
  const items = await top().locator(".bk-coach-item").count();
  await top().locator(".bk-coach-item .bk-coach-x").first().click();
  ok(
    (await top().locator(".bk-coach-item").count()) === items - 1,
    "a single suggestion can be dismissed",
  );
  const cards = await page.locator("[data-coach-card]").count();
  await top().locator(".bk-coach-card-head .bk-coach-x").click();
  ok(
    (await page.locator("[data-coach-card]").count()) === cards - 1,
    "a whole card can be dismissed",
  );

  await run("translate");
  ok(
    (await page.locator("[data-bk-coach-phrase]").count()) === 1,
    "translate: asks for a word from the page",
  );
  await page.fill("[data-bk-coach-phrase]", "soccer");
  await page.click("[data-bk-coach-phrase-go]");
  await page.waitForSelector('[data-coach-card] [lang="es"]');
  ok(
    /Fútbol/.test(await top().innerText()),
    "translate: a Spanish meaning, shown beside the learner's word",
  );

  // picture: add a built-in illustration (it becomes selected)
  await page.click('.bk-addbar > [data-bk-add="art"]');
  await page.click('[data-art-pick="char-maya"]');
  await page.waitForSelector(".bk-canvas .bk-t-art");
  await run("picture");
  ok(
    (await top().locator("[data-bk-coach-describe]").count()) === 1,
    "picture: guiding questions plus Write my description",
  );
  const picBody = sent.findLast((b) => b.action === "picture");
  ok(
    picBody?.payload?.kind === "art" &&
      picBody.payload.name &&
      !JSON.stringify(picBody).includes("svg"),
    "picture sends the illustration's name, never the picture",
  );
  await top().locator("[data-bk-coach-describe]").click();
  ok(
    await page.locator('[data-bk-prop="alt"]').evaluate((n) => n === document.activeElement),
    "Write my description focuses the learner's own description box",
  );

  ok(
    sent.every((b) => !JSON.stringify(b).includes("Ana Secret")),
    "the author's name is never sent",
  );
  ok(
    sent.every((b) => JSON.stringify(b.payload).length < 2600),
    "every request stays within the size cap",
  );
  if (SHOTS) {
    await page.locator("[data-bk-coach-panel]").scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(SHOTS, "coach-desktop.png") });
  }
  await page.click('[data-bk-act2="deselect"]').catch(() => {});
  await page.waitForSelector("[data-bk-coach-panel]");
  await axe(page, ".bk-inspector", "coach panel with cards");

  // ── offline: the API answers 503 ──
  offline = true;
  await run("brainstorm");
  ok(
    (await top().getAttribute("data-source")) === "local",
    "offline: brainstorm shows built-in tips",
  );
  ok(/Built-in tips/.test(await top().innerText()), "built-in tips are labelled as not AI");
  ok(
    /not available right now/.test(await page.locator("[data-bk-coach-note]").innerText()),
    "offline: a calm note says why",
  );
  for (const action of ["organize", "genre"]) {
    await run(action);
    ok(
      (await top().getAttribute("data-source")) === "local",
      `offline: ${action} falls back to built-in tips`,
    );
  }
  const nBefore = await page.locator("[data-coach-card]").count();
  await page.click('[data-bk-coach="clarity"]');
  await page.waitForFunction(() =>
    /not available/.test(document.querySelector("[data-bk-coach-note]")?.textContent || ""),
  );
  ok(
    (await page.locator("[data-coach-card]").count()) === nBefore,
    "offline: clarity (AI only) shows a note, no invented card",
  );
  offline = false;
  const ledger = await page.evaluate(
    () => JSON.parse(localStorage.getItem("accessPracticeLab:v1:ledger") || "{}").entries || [],
  );
  const coachEntries = ledger.filter((e) => e.src === "book-coach");
  ok(
    coachEntries.some((e) => e.feedbackSource === "ai") &&
      coachEntries.some((e) => e.feedbackSource === "local-rule"),
    "ledger records feedbackSource ai vs local-rule",
  );

  // ── phone ──
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    "phone: no sideways scroll with the coach open",
  );
  if (SHOTS) {
    await page.locator("[data-bk-coach-panel]").scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(SHOTS, "coach-phone.png") });
  }
  await context.close();

  // ── teacher turned the coach off for the class ──
  const classCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await stubCoach(classCtx);
  await classCtx.addInitScript(() => {
    localStorage.setItem(
      "accessPracticeLabClass:v1:link",
      JSON.stringify({
        code: "ABCDEF",
        studentId: "s0123456789",
        studentKey: "ABCDEFGH",
        alias: "Luna",
      }),
    );
    localStorage.setItem("accessPracticeLab:v1:book-coach", JSON.stringify({ on: true }));
  });
  await classCtx.route("**/api/class/**", (route) => {
    const url = route.request().url();
    const body = url.includes("/me?") ? { ok: true, aiCoach: false, alias: "Luna" } : { ok: true };
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
  const cp = await classCtx.newPage();
  cp.on("pageerror", (e) => !/web-vitals/.test(String(e)) && errors.push(e.stack || String(e)));
  await newBook(cp, "Class Book");
  await cp.waitForTimeout(800);
  ok(
    (await cp.locator("[data-bk-coach-panel], [data-bk-coach-toggle]").count()) === 0,
    "teacher turned it off: the coach and its switch are hidden",
  );
  await classCtx.close();

  // ── same class with the coach allowed ──
  const allowCtx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await allowCtx.addInitScript(() => {
    localStorage.setItem(
      "accessPracticeLabClass:v1:link",
      JSON.stringify({
        code: "ABCDEF",
        studentId: "s0123456789",
        studentKey: "ABCDEFGH",
        alias: "Luna",
      }),
    );
  });
  await allowCtx.route("**/api/class/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        route.request().url().includes("/me?") ? { ok: true, aiCoach: true } : { ok: true },
      ),
    }),
  );
  const ap = await allowCtx.newPage();
  await newBook(ap, "Class Book");
  await ap.waitForSelector("[data-bk-coach-panel]", { timeout: 5000 }).catch(() => {});
  ok(
    (await ap.locator("[data-bk-coach-panel]").count()) === 1,
    "class allows it: the coach is offered (still off until the learner turns it on)",
  );
  await allowCtx.close();
} catch (e) {
  failures.push(String(e.stack || e));
  console.log(`FAIL ${e.stack || e}`);
} finally {
  await browser.close();
  server?.close();
}
for (const e of errors) failures.push(`page error: ${e}`);
if (errors.length) console.log(errors.join("\n"));
console.log(
  failures.length
    ? `\nbook-coach-e2e: ${failures.length} failure(s)`
    : "\nbook-coach-e2e: all checks passed",
);
process.exit(failures.length ? 1 : 0);

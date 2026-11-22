import assert from "node:assert/strict";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { exitSkipped } from "./lib/skip-exit.mjs";

const contentLessons = JSON.parse(
  readFileSync(join(REPO_ROOT, "access-practice-lab/content/reading-room/lessons.json"), "utf8"),
).lessons;
let chromium, AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  if (process.env.CI) throw new Error("Playwright required in CI");
  exitSkipped(
    "Playwright unavailable",
    "Install the repo-supported Playwright browser to run Reading Room browser coverage.",
  );
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {}
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://local").pathname);
  let f = join(REPO_ROOT, p.endsWith("/") ? `${p}index.html` : p);
  if (!existsSync(f) || statSync(f).isDirectory()) {
    if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
      f = join(REPO_ROOT, "access-practice-lab/index.html");
    else {
      res.writeHead(404);
      return res.end();
    }
  }
  res.writeHead(200, {
    "content-type":
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
      }[extname(f)] || "application/octet-stream",
  });
  createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));

const lesson = contentLessons.find((x) => x.id === "rr1-night-library");
const q = lesson.activities.find((a) => a.id === "main-idea");
const wrong = q.choices.filter((c) => c.id !== q.answerId);
const shot = process.env.RR_SHOTS;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const errors = [];
  for (const [w, h] of [
    [1280, 900],
    [390, 844],
  ]) {
    const context = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
    page.on(
      "console",
      (m) =>
        m.type() === "error" &&
        !/web-vitals|Failed to load resource/.test(m.text()) &&
        errors.push(m.text()),
    );
    const url = `http://localhost:${server.address().port}/access-practice-lab/reading-room/${lesson.id}`;
    await page.goto(url);
    await page.getByRole("heading", { name: lesson.title }).waitFor();
    const pick = (c) =>
      page.locator("label.rr-option", { hasText: c.text }).first().locator("input").check();
    const check = () => page.locator('[data-rr-check="main-idea"]').click();

    // First miss: a teaching note and a hint, but the explanation stays closed.
    await pick(wrong[0]);
    await check();
    const box = page.locator(".rr-question", { hasText: q.prompt }).locator(".feedback");
    await box.waitFor();
    assert.match(await box.innerText(), /Why that choice does not fit/);
    assert.ok(
      (await box.innerText()).includes(wrong[0].why),
      "shows the note for the chosen distractor",
    );
    assert.ok(
      !(await box.innerText()).includes(q.rationale),
      "first miss does not reveal the explanation",
    );
    // Changing the answer clears the stale feedback.
    await pick(wrong[1]);
    assert.equal(await box.count(), 0, "stale feedback removed when the answer changes");
    await check();
    await box.waitFor();
    assert.ok((await box.innerText()).includes(q.rationale), "second miss opens the explanation");
    await pick(q.choices.find((c) => c.id === q.answerId));
    await check();
    await page.getByRole("status").filter({ hasText: "supported" }).waitFor();
    assert.ok((await box.innerText()).includes(q.rationale));

    // Inline gloss opens on demand and carries the meaning.
    const gloss = page.locator(".rr-gloss").first();
    await gloss.click();
    await page.locator(".rr-gloss-card").first().waitFor();
    assert.equal(await gloss.getAttribute("aria-expanded"), "true");
    const glossTerm = await gloss.getAttribute("data-rr-gloss");
    assert.ok(lesson.vocabulary.some((v) => v.term === glossTerm));
    if (shot)
      await page.screenshot({ path: `${shot}/after-reader-${w}.jpg`, type: "jpeg", quality: 60 });

    // Open response: find evidence, check, revise.
    await page.getByRole("tab", { name: /3 · Apply/ }).click();
    const box2 = page.locator("textarea[data-rr-response=transfer]");
    await box2.fill("I would ask first.");
    await page.locator("[data-rr-selfcheck=transfer]").click();
    await page.locator(".rr-selfcheck").waitFor();
    assert.match(await page.locator(".rr-selfcheck").innerText(), /does not score your writing/);
    await page.locator(".rr-find-evidence summary").click();
    await page.locator("[data-rr-find=transfer]").first().check();
    await page.locator(".rr-evidence-mark").first().waitFor();
    await page.locator("[data-rr-quote=transfer]").first().click();
    assert.match(await box2.inputValue(), /In paragraph 1, the text says/);
    await page.locator("[data-rr-selfcheck=transfer]").click();
    await page.locator(".rr-first-draft").waitFor({ state: "attached" });
    assert.equal(await page.locator(".rr-first-draft").textContent(), "I would ask first.");
    await page.reload();
    await page.getByRole("tab", { name: /3 · Apply/ }).click();
    assert.ok(
      (await page.locator(".rr-evidence-mark").count()) >= 1,
      "evidence highlight survives reload",
    );
    assert.ok((await box2.inputValue()).includes("In paragraph 1"));
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    assert.ok(overflow <= 1, `no horizontal overflow at ${w}px (${overflow})`);
    if (shot)
      await page.screenshot({ path: `${shot}/after-response-${w}.jpg`, type: "jpeg", quality: 60 });
    if (AxeBuilder) {
      const r = await new AxeBuilder({ page }).include(".rr-shell").analyze();
      assert.deepEqual(
        r.violations.map((v) => `${v.id}: ${v.help}`),
        [],
        "axe",
      );
    }
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS reading room tiered feedback, stale-feedback reset, glosses, evidence highlight, write-check-revise, reload, 1280 and 390, axe",
  );
} finally {
  await browser?.close();
  server.close();
}

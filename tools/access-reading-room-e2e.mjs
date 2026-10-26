import assert from "node:assert/strict";
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
import { REPO_ROOT } from "./lib/access-lab-content.mjs";
import { exitSkipped } from "./lib/skip-exit.mjs";

const contentLessons = JSON.parse(
  readFileSync(join(REPO_ROOT, "access-practice-lab/content/reading-room/lessons.json"), "utf8"),
).lessons;
const lessonCount = contentLessons.length;
const gradeCounts = contentLessons.reduce(
  (m, l) => ((m[l.gradeCluster || "3-5-local"] = (m[l.gradeCluster || "3-5-local"] || 0) + 1), m),
  {},
);
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
        ".css": "text/css",
        ".json": "application/json",
      }[extname(f)] || "application/octet-stream",
  });
  createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, r));
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.setDefaultTimeout(8000);
  page.on("pageerror", (e) => {
    if (!/web-vitals/.test(e.message)) errors.push(e.message);
  });
  await page.goto(`http://localhost:${server.address().port}/access-practice-lab/reading-room`);
  await page.getByRole("heading", { name: "Reading Room" }).waitFor();
  await page.getByRole("heading", { name: "The Night the Library Stayed Open" }).waitFor();
  await page.getByLabel("Search texts").fill("seed travels");
  await page.waitForFunction(() => document.querySelectorAll(".rr-book").length === 1);
  await page.getByLabel("Search texts").fill("");
  await page.waitForFunction(
    (expected) => document.querySelectorAll(".rr-book").length === expected,
    lessonCount,
  );
  const sustainedCount = contentLessons.filter(
    (lesson) => lesson.readingPath === "sustained",
  ).length;
  await page.getByLabel("Reading length").selectOption("sustained");
  await page.waitForFunction(
    (expected) => document.querySelectorAll(".rr-book").length === expected,
    sustainedCount,
  );
  assert.equal(sustainedCount, 7, "the library should offer the seven authored sustained reads");
  assert.ok(
    (await page.getByText(/Sustained read · 4\d\d words|Sustained read · 5\d\d words/).count()) >=
      7,
  );
  await page.getByLabel("Reading length").selectOption("");
  await page.waitForFunction(
    (expected) => document.querySelectorAll(".rr-book").length === expected,
    lessonCount,
  );
  await page.locator("[data-rr-genre]").selectOption("Informational science with data");
  await page.waitForFunction(() => document.querySelectorAll(".rr-book").length === 1);
  await page.locator("[data-rr-genre]").selectOption("");
  console.log("PASS shelf and filter");
  await page
    .getByRole("link", { name: /Open lesson/ })
    .first()
    .click();
  await page.getByRole("heading", { name: "The Night the Library Stayed Open" }).waitFor();
  console.log("PASS reader open");
  await page.getByRole("button", { name: "Learn" }).click();
  await page.getByRole("heading", { name: "Model the reading move" }).waitFor();
  await page.getByRole("button", { name: "Independent challenge" }).click();
  assert.equal(await page.locator(".rr-vocabulary").count(), 0);
  assert.equal(await page.locator(".rr-guide").count(), 0);
  assert.equal(await page.getByText("Teacher guide", { exact: true }).count(), 0);
  await page.locator("[data-rr-mark]").first().selectOption("Evidence");
  await page.getByRole("button", { name: "Save reading place" }).first().click();
  await page.getByLabel("Your note for paragraph 1").fill("This is my evidence note.");
  await page.getByRole("button", { name: /Bookmark/ }).click();
  const radio = page.locator("input[type=radio]").first();
  await radio.check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await page.getByRole("status").filter({ hasText: "supported" }).waitFor();
  await page.getByRole("button", { name: "Practice", exact: true }).click();
  await page.locator(".rr-vocab summary").first().click();
  await page.getByRole("button", { name: "Save to Word Notebook" }).first().click();
  await page.goto(
    `http://localhost:${server.address().port}/access-practice-lab/reading-room/words`,
  );
  await page.getByRole("heading", { name: "Reading Word Notebook" }).waitFor();
  assert.ok((await page.locator(".rr-book").count()) > 0);
  await page.goto(
    `http://localhost:${server.address().port}/access-practice-lab/reading-room/rr1-night-library`,
  );
  await page.locator(".rr-organizers > summary").click();
  assert.equal(await page.locator("details.rr-organizer").count(), 14);
  await page.getByText("Claim · Evidence · Reasoning", { exact: true }).click();
  await page
    .locator("[data-rr-organizer=claim]")
    .fill("A helpful act can make a shared place welcoming.");
  await page.getByText("Vocabulary Concept Map", { exact: true }).click();
  await page.locator("[data-rr-organizer=conceptWord]").fill("welcoming");
  await page.reload();
  await page.getByLabel("Your note for paragraph 1").waitFor();
  assert.equal(
    await page.getByLabel("Your note for paragraph 1").inputValue(),
    "This is my evidence note.",
  );
  assert.equal(await page.locator("[data-rr-mark]").first().inputValue(), "Evidence");
  assert.equal(
    await page.locator("[data-rr-organizer=claim]").inputValue(),
    "A helpful act can make a shared place welcoming.",
  );
  assert.equal(await page.locator("[data-rr-organizer=conceptWord]").inputValue(), "welcoming");
  console.log("PASS response and reload");
  if (AxeBuilder) {
    const result = await new AxeBuilder({ page }).include(".rr-shell").analyze();
    assert.deepEqual(
      result.violations.map((v) => `${v.id}: ${v.help}`),
      [],
      "Reading Room axe violations",
    );
  }
  await page.goto(`http://localhost:${server.address().port}/access-practice-lab/reading-room`);
  await page.getByRole("button", { name: "Show bookmarks only" }).click();
  await page.waitForFunction(() => document.querySelectorAll(".rr-book").length === 1);
  await page.goto(
    `http://localhost:${server.address().port}/access-practice-lab/reading-room/rr45-park-cools-block`,
  );
  await page.getByRole("table").waitFor();
  assert.equal(await page.getByRole("table").getByRole("row").count(), 3);
  assert.equal(await page.getByRole("button", { name: "Read passage aloud" }).count(), 1);
  await page.goto(
    `http://localhost:${server.address().port}/access-practice-lab/reading-room/teacher`,
  );
  await page.getByRole("heading", { name: "Reading evidence" }).waitFor();
  assert.equal(await page.locator("tbody tr").count(), lessonCount);
  assert.match(await page.locator("tbody tr").first().innerText(), /1/);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download report CSV" }).click();
  const csvDownload = await downloadPromise;
  const csvText = readFileSync(await csvDownload.path(), "utf8");
  assert.match(csvText, /\"lesson_id\",\"title\",\"completed_on_device\"/);
  assert.match(csvText, /The Night the Library Stayed Open/);
  await page.goto(
    `http://localhost:${server.address().port}/access-practice-lab/reading-room/workshop?cluster=6-8`,
  );
  await page.getByRole("heading", { name: "Weekly Reading Workshop" }).waitFor();
  assert.equal(await page.locator(".rr-workshop-days li").count(), 5);
  await page.goto(
    `http://localhost:${server.address().port}/access-practice-lab/reading-room/family`,
  );
  await page.getByRole("heading", { name: "Family Reading" }).waitFor();
  await page.getByText(/no es necesario hablar inglés/i).waitFor();
  await page.goto(
    `http://localhost:${server.address().port}/access-practice-lab/reading-room/pathways`,
  );
  await page.getByRole("heading", { name: "Choose a way to read" }).waitFor();
  await page.getByRole("link", { name: /Open a read-together lesson/ }).click();
  await page.getByRole("button", { name: "Read together" }).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Read together" }).getAttribute("aria-pressed"),
    "true",
  );
  await page.goto(
    `http://localhost:${server.address().port}/access-practice-lab/reading-room/conference`,
  );
  await page.getByRole("heading", { name: "Reading Conference Notes" }).waitFor();
  await page.getByLabel("Observed strength").fill("Returns to the passage before explaining.");
  await page.reload();
  assert.equal(
    await page.getByLabel("Observed strength").inputValue(),
    "Returns to the passage before explaining.",
  );
  await page.goto(`http://localhost:${server.address().port}/access-practice-lab/reading-room`);
  await page.locator("[data-rr-grade]").selectOption("9-12");
  await page.waitForFunction(
    (expected) => document.querySelectorAll(".rr-book").length === expected,
    gradeCounts["9-12"],
  );
  await page.locator("[data-rr-grade]").selectOption("6-8");
  await page.waitForFunction(
    (expected) => document.querySelectorAll(".rr-book").length === expected,
    gradeCounts["6-8"],
  );
  await page.locator("[data-rr-grade]").selectOption("");
  await page.goto(
    `http://localhost:${server.address().port}/access-practice-lab/reading-room/rr-existing-68c-r-street-trees-evidence`,
  );
  await page.getByRole("table").waitFor();
  await page.getByRole("tab", { name: /2 · Investigate/ }).click();
  await page.locator('[data-rr-multi="source-item"]').first().waitFor();
  await page.locator('[data-rr-multi="source-item"][value="s2"]').check();
  await page.getByRole("button", { name: "Check selection" }).click();
  await page.getByRole("status").filter({ hasText: "matches the source key" }).waitFor();
  await page.goto(
    `http://localhost:${server.address().port}/access-practice-lab/reading-room/rr-existing-68c-r-tardigrade-cloze`,
  );
  await page.getByRole("tab", { name: /2 · Investigate/ }).click();
  for (const [blank, word] of Object.entries({
    b1: "withstand",
    b2: "extreme",
    b3: "dormant",
    b4: "returns",
    b5: "resilient",
  }))
    await page.locator(`[data-rr-cloze="source-item"][data-blank="${blank}"]`).selectOption(word);
  await page.getByRole("button", { name: "Check words" }).click();
  await page.getByRole("status").filter({ hasText: "fit the context" }).waitFor();
  await page.goto(
    `http://localhost:${server.address().port}/access-practice-lab/reading-room/rr68-heat-island`,
  );
  await page.getByRole("heading", { name: "Why Some Blocks Stay Hotter" }).waitFor();
  await page.getByRole("tab", { name: /3 · Apply/ }).click();
  await page
    .locator('[data-rr-cloze="vocabulary-context"][data-blank="word-1"]')
    .selectOption("shade");
  await page.getByRole("button", { name: "Check words" }).click();
  await page.getByRole("status").filter({ hasText: "fit the context" }).waitFor();
  await page.goto(
    `http://localhost:${server.address().port}/access-practice-lab/reading-room/rr912-data-privacy`,
  );
  await page.getByRole("heading", { name: "The Trade-Off in a Campus Wi-Fi Map" }).waitFor();
  await page.getByRole("tab", { name: /3 · Apply/ }).click();
  await page.locator('[data-rr-structured="classify-evidence"]').first().waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  assert.equal(overflow, false, "390px horizontal overflow");
  assert.deepEqual(errors, [], "browser runtime errors");
  console.log(
    `Reading Room e2e: passed shelf and grade filtering across ${lessonCount} lessons, Learn/Practice/Independent/Read-together modes, answer feedback, stable paragraph marks, position, annotation and organizer persistence, local teacher/family/workshop/conference views, 14 organizers and CSV export, Word Notebook, semantic data visual, bookmark, axe, and 390px reflow.`,
  );
} finally {
  await browser?.close();
  server.close();
}

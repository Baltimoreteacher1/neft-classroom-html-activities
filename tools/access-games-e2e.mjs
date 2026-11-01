#!/usr/bin/env node
// The Reading Ladder and the Puzzle Den, driven the way a learner drives them: answer, miss, use a hint,
// reload, and check phone width, the console, and axe (WCAG 2.2 AA).
import { createReadStream, existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { exitSkipped } from "./lib/skip-exit.mjs";

let chromium;
let AxeBuilder = null;
try {
  ({ chromium } = await import("playwright"));
} catch {
  exitSkipped(
    "Playwright is not installed for the ACCESS games browser check.",
    "Install the locked project dependencies.",
  );
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-games-e2e: @axe-core/playwright is not installed; skipping axe checks");
}

const root = process.cwd();
const content = (path) =>
  JSON.parse(readFileSync(join(root, "access-practice-lab/content", path), "utf8"));
const { passages } = content("ladder/passages.json");
const { puzzles } = content("puzzles/puzzles.json");
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
};
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://local").pathname);
  let file = join(root, p.endsWith("/") ? `${p}index.html` : p);
  if (!existsSync(file) || statSync(file).isDirectory()) {
    if (p.startsWith("/access-practice-lab/") && !/\.[a-z0-9]+$/i.test(p))
      file = join(root, "access-practice-lab/index.html");
    else {
      res.writeHead(404);
      return res.end();
    }
  }
  res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" });
  createReadStream(file).pipe(res);
});
await new Promise((resolve) => server.listen(0, resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch(
  process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
);
const page = await (await browser.newContext({ viewport: { width: 375, height: 812 } })).newPage();

const failures = [];
const check = (ok, label) => {
  (ok ? console.log : console.error)(`${ok ? "PASS" : "FAIL"} ${label}`);
  if (!ok) failures.push(label);
};
page.on(
  "pageerror",
  (error) => !/web-vitals/.test(error.message) && failures.push(`page error: ${error.message}`),
);
page.on(
  "console",
  (m) =>
    m.type() === "error" &&
    !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
    failures.push(`console error: ${m.text()}`),
);
const go = async (path) => {
  await page.goto(`${base}/access-practice-lab${path}`, { waitUntil: "networkidle" });
  await page.waitForSelector("#app h1");
};
const overflow = () =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const axe = async (label) => {
  if (!AxeBuilder) return;
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
    .analyze();
  check(
    violations.length === 0,
    `axe: ${label}${violations.length ? ` (${violations.map((v) => v.id).join(", ")})` : ""}`,
  );
};
const text = (selector) => page.locator(selector).first().innerText();

// ---------------------------------------------------------------- Reading Ladder
await go("/ladder?grades=3-5");
check((await text("#app h1")) === "Reading Ladder", "ladder opens");
check((await text(".gm-step-now")).includes("Step 2 of 6"), "grades 3-5 start on step 2");
check((await overflow()) <= 0, "ladder has no horizontal scroll at 375px");
await axe("ladder passage");

const shown = async () => {
  const title = await text("#ldTitle");
  return passages.find((p) => p.title === title);
};
let passage = await shown();
check(passage?.step === 2, `a step-2 passage is shown (${passage?.title})`);
await page.click("[data-ld-check]");
check(
  await page
    .locator(".gm-question")
    .first()
    .evaluate((el) => !el.matches(".is-right, .is-miss")),
  "checking with no answers does not grade",
);
for (const [i, q] of passage.questions.entries())
  await page.check(`input[name="gm-q${i}"][value="${q.answer}"]`);
await page.reload({ waitUntil: "networkidle" });
check((await shown())?.id === passage.id, "reload keeps the same passage");
check((await page.locator("input:checked").count()) === 3, "reload keeps the learner's picks");
await page.click("[data-ld-check]");
check((await text(".feedback")).includes("3 of 3 correct"), "a perfect round reports 3 of 3");
check((await text(".feedback")).includes("Next: step 3 of 6"), "a perfect round moves up a step");
await axe("ladder result");
await page.click("[data-ld-next]");
passage = await shown();
check(passage?.step === 3, "the next passage is from step 3");
check((await text(".gm-step-now")).includes("Step 3 of 6"), "the ladder shows step 3");

for (const [i, q] of passage.questions.entries())
  await page.check(`input[name="gm-q${i}"][value="${(q.answer + 1) % 3}"]`);
await page.click("[data-ld-check]");
check(
  (await text(".feedback")).includes("0 of 3 correct") &&
    (await text(".feedback")).includes("Next: step 2 of 6"),
  "a round with every answer missed steps down",
);
check(
  (await page.locator(".gm-why.is-miss").count()) === 3,
  "each miss shows a look-back hint and explanation",
);
await page.click("[data-ld-next]");
await page.selectOption("[data-ld-step]", "5");
await page.click("[data-ld-go]");
check((await shown())?.step === 5, "the learner can start on another step");
check((await text(".gm-summary")).includes("2 rounds"), "the summary counts saved rounds");
await page.goto(`${base}/access-practice-lab/ladder?grades=6-8`, { waitUntil: "networkidle" });
await page.waitForSelector("#app h1");
check(
  (await text(".gm-step-now")).includes("Step 4 of 6"),
  "grades 6-8 keep their own ladder and start on step 4",
);

// ---------------------------------------------------------------- Puzzle Den
await go("/puzzles?grades=3-5");
check((await text("#app h1")) === "Puzzle Den", "puzzle den opens");
const bandCount = puzzles.filter((p) => p.band === "3-5" || p.band === "both").length;
check(
  (await page.locator(".gm-card").count()) === bandCount,
  `lists the ${bandCount} puzzles for grades 3-5`,
);
check((await overflow()) <= 0, "puzzle list has no horizontal scroll at 375px");
await axe("puzzle list");

// sentence builder, solved clean
const order = puzzles.find((p) => p.id === "order-walk-school");
await go(`/puzzles/${order.id}?grades=3-5`);
await axe("sentence builder");
check(
  await page.locator("[data-pz-check]").isDisabled(),
  "check is disabled until every tile is placed",
);
for (const word of order.answers[0])
  await page
    .locator(`.gm-tiles:not(:first-of-type) [data-pz-tile]:not([disabled])`, {
      hasText: new RegExp(`^${word}$`),
    })
    .first()
    .click();
check(
  (await text(".gm-sentence")) === "I walk to school every day.",
  "the built sentence is capitalized and punctuated",
);
await page.reload({ waitUntil: "networkidle" });
check(
  (await page.locator(".gm-tile.is-placed").count()) === order.tiles.length,
  "reload keeps the placed tiles",
);
await page.click("[data-pz-check]");
check((await text(".feedback")).includes("Solved!"), "a correct sentence is solved");
check(
  (await page.locator(".feedback .gm-star.on").count()) === 3,
  "a clean solve earns three stars",
);
check(
  (await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("accessPracticeLab:v1:puzzle-den")).solved[
        "order-walk-school"
      ].stars,
  )) === 3,
  "the solve is saved on the device",
);

// clue grid: a miss names clues but not the answer; a hint costs a star
const grid = puzzles.find((p) => p.id === "grid-pets");
await go(`/puzzles/${grid.id}?grades=3-5`);
await page.click("[data-pz-check]");
check(
  (await text(".feedback")).includes("Choose something for every person"),
  "an empty grid asks for every pick",
);
const pick = (person, option) => page.selectOption(`[data-pz-select="${person}"]`, option);
await pick("Ana", "dog");
await pick("Ben", "cat");
await pick("Cy", "fish");
await page.click("[data-pz-check]");
check(
  /clues are not all true.*1, 2/.test(await text(".feedback")),
  "a wrong grid names the clues it breaks",
);
check(!(await text(".feedback")).includes("fish"), "the miss never names the answer");
await page.click("[data-pz-hint]");
check((await page.locator(".gm-hints li").count()) === 1, "a hint is shown");
await pick("Ana", "fish");
await pick("Ben", "dog");
await pick("Cy", "cat");
await page.click("[data-pz-check]");
check((await text(".feedback")).includes("Solved!"), "the right grid is solved");
check(
  (await page.locator(".feedback .gm-star.on").count()) === 2,
  "one hint and one miss leave two stars",
);

// odd one out
const odd = puzzles.find((p) => p.id === "odd-animals");
await go(`/puzzles/${odd.id}?grades=3-5`);
await axe("odd one out");
await page.check('input[name="gm-odd"][value="0"]');
await page.click("[data-pz-check]");
check(
  (await text(".feedback")).includes("Not that one"),
  "a wrong word gets a nudge, not the answer",
);
check(
  !(await text(".feedback")).toLowerCase().includes(odd.words[odd.answer]),
  "the nudge does not name the answer",
);
await page.check(`input[name="gm-odd"][value="${odd.answer}"]`);
await page.click("[data-pz-check]");
check(
  (await text(".feedback")).includes("Solved!") && (await text(".feedback")).includes(odd.rule),
  "the right word is solved and the rule is explained",
);
await page.click("[data-pz-retry]");
check((await page.locator("[data-pz-check]").count()) === 1, "play again reopens the puzzle");
check((await overflow()) <= 0, "puzzle page has no horizontal scroll at 375px");

// the new places are reachable from the lab home
await go("/?grades=3-5");
check(
  (await page.locator('a.studio-card[href*="/ladder"]').count()) === 1 &&
    (await page.locator('a.studio-card[href*="/puzzles"]').count()) === 1,
  "home links to both new studios",
);

await browser.close();
server.close();
if (failures.length) {
  console.error(`\nFAIL access-games-e2e: ${failures.length} problem(s)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\nPASS access-games-e2e");

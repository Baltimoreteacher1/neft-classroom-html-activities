// The family homework experience, driven the way a family drives it.
// Usage: node tools/verify-family-experience-browser.mjs [--all] [--lesson=4-3,6-5] [--base=https://eduwonderlab.com]
//   --base checks a deployed site instead of the source tree (read-only), e.g. right after a ship.
//
// A source gate can prove the markup exists; only a browser can see that the language
// picker is on the first screen, that no control sits on top of another, that nothing
// a family must read is tiny, and that a wrong answer does not celebrate. Written after
// the shipped page announced "That's tonight's goal — done!" after a single WRONG answer
// (its goal was the route's problemLimit, which is 0 on two of three routes).

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";
import { skipExit } from "./lib/skip-exit.mjs";

const SAMPLE = ["1-1", "2-1", "3-3", "4-3", "4-3-part2", "6-5", "8-2", "9-1"];
const all = process.argv.includes("--all");
const only = process.argv.find((a) => a.startsWith("--lesson="))?.slice(9);
const liveBase = process.argv
  .find((a) => a.startsWith("--base="))
  ?.slice(7)
  ?.replace(/\/$/, "");
const everyLesson = () =>
  readdirSync(join(REPO_ROOT, "data/family-homework-notes"))
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .sort();
const lessons = only ? only.split(",") : all ? everyLesson() : SAMPLE;

const ROOT = resolve(REPO_ROOT);
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
};
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (path.endsWith("/")) path += "index.html";
  const candidates = [path, `${path}.html`, join("public", path)].map((p) =>
    resolve(ROOT, `.${p.startsWith("/") ? p : `/${p}`}`),
  );
  const file = candidates.find(
    (f) => f.startsWith(`${ROOT}/`) && existsSync(f) && statSync(f).isFile(),
  );
  if (!file) return void res.writeHead(404).end("Not found");
  res.writeHead(200, {
    "Content-Type": types[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  });
  res.end(readFileSync(file));
});
if (!liveBase) await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = liveBase || `http://127.0.0.1:${server.address().port}`;

let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (error) {
  server.close();
  process.exit(
    skipExit(
      `Chromium could not be launched (${error.message})`,
      "Install a browser (npx playwright install chromium) or set PW_CHROMIUM_PATH.",
    ),
  );
}

const problems = [];
const fail = (where, message) => problems.push(`${where}: ${message}`);
// Build-time resolutions the source tree cannot do (Vite bare specifiers, built bundles).
const IGNORED_CONSOLE = liveBase
  ? []
  : [/web-vitals/, /Failed to load resource/, /homework-lesson-models/];

/** Visible text nodes smaller than the floor. Icons and screen-reader text are not text. */
const SMALL_TEXT = `() => {
  const bad = [];
  for (const el of document.querySelectorAll("body *")) {
    if (!el.offsetParent && getComputedStyle(el).position !== "fixed") continue;
    if (el.closest("[aria-hidden='true'], .hw-sr-only, .tab-step, .nsr-launcher-ico")) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && /[A-Za-zÀ-ÿ0-9]{2}/.test(n.textContent));
    if (!own.length) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size > 0 && size < 12.99) bad.push(\`\${el.tagName.toLowerCase()}.\${String(el.className).split(" ")[0]} in .\${String(el.parentElement.className).split(" ")[0]}/.\${String(el.parentElement.parentElement?.className).split(" ")[0]} \${size}px "\${el.textContent.trim().slice(0, 24)}"\`);
  }
  return [...new Set(bad)].slice(0, 6);
}`;

const TARGETS =
  ".hw-conf-btn:visible, .hw-mystery-open:visible, .hw-share-win:visible, .hw-route-option:visible, .lang-toggle-btn:visible, .homework-tab-btn:visible, .hw-grownup > summary:visible";

async function openPage(context, lesson, query = "") {
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${origin}/lessons/${lesson}/homework.html${query}`, { waitUntil: "load" });
  await page.waitForFunction(
    "typeof hwRenderGoal === 'function' && document.body.dataset.homeworkRoute",
  );
  return { page, errors };
}

async function sweepPhone(browser, lesson) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const { page, errors } = await openPage(context, lesson);
  const where = `${lesson} @390`;

  assert.match(await page.title(), /^Family Math Studio — /, `${where}: title`);
  // One language at a time: a first visit is English (Spanish on a Spanish phone), never both.
  const firstClass = await page.locator("body").getAttribute("class");
  if (!firstClass.includes("lang-mode-en") && !firstClass.includes("lang-mode-es"))
    fail(where, "first visit has no single language mode");
  if (firstClass.includes("lang-mode-bilingual")) fail(where, "bilingual mode is still offered");

  // Language first: the picker precedes the big idea in the page and sits on the first screen.
  const order = await page.evaluate(() => {
    const lang = document.querySelector(".hw-hero .lang-toggle-btn");
    const idea = document.querySelector(".hw-hero-bigidea");
    const domFirst = !!(
      lang &&
      idea &&
      lang.compareDocumentPosition(idea) & Node.DOCUMENT_POSITION_FOLLOWING
    );
    const visualFirst = !!(
      lang &&
      idea &&
      lang.getBoundingClientRect().top < idea.getBoundingClientRect().top
    );
    return {
      before: domFirst && visualFirst,
      top: lang ? lang.getBoundingClientRect().top + scrollY : 9999,
    };
  });
  if (!order.before) fail(where, "language picker does not come before the big idea");

  // Every language button must show its whole label: a clipped "Bilingü…" is a family's only way to switch.
  const clipped = await page.evaluate(() =>
    [...document.querySelectorAll(".hw-hero .lang-toggle-btn")]
      .filter(
        (b) =>
          b.scrollWidth > b.clientWidth + 1 || b.getBoundingClientRect().right > innerWidth + 1,
      )
      .map((b) => b.innerText.trim() || b.getAttribute("data-lang-mode")),
  );
  if (clipped.length) fail(where, `language button text clipped: ${clipped.join(", ")}`);
  if (order.top > 360)
    fail(
      where,
      `language picker starts ${Math.round(order.top)}px down; must be on the first screen`,
    );

  // Start state: goal is four of N, never a celebration before work.
  const start = await page.evaluate(() => ({
    snap: window.hwGoalSnapshot(),
    banner: !document.getElementById("goal_reached_banner").hidden,
    mystery: !!document.getElementById("hw_mystery"),
    time: document.querySelector("[data-hw-tonight-time]")?.textContent,
  }));
  // Quick Practice (the default) has a goal of two; Keep Going has four.
  if (start.snap.goal !== 4 && start.snap.goal !== 2 && start.snap.goal !== start.snap.available)
    fail(where, `goal is ${start.snap.goal}, not 2 or 4`);
  if (start.banner) fail(where, "goal banner is showing before any work");
  if (!start.mystery) fail(where, "no mystery challenge card");
  const startTop = await page.evaluate(
    () => document.getElementById("hw_start_button").getBoundingClientRect().top + scrollY,
  );
  if (startTop > 1500)
    fail(where, `the Start button is ${Math.round(startTop)}px down; keep it within two screens`);
  // The default route is Quick Practice (5–10 min). Keep Going is 20–30 min.
  if (start.time !== "5–10") fail(where, `default route time reads ${start.time}`);

  for (const tab of ["learn", "words", "check", "play", "done"]) {
    await page.evaluate((t) => window.switchHomeworkTab(t), tab);
    await page.waitForTimeout(120);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) fail(`${where} ${tab}`, `horizontal scroll by ${overflow}px`);
    const small = await page.evaluate(`(${SMALL_TEXT})()`);
    if (small.length) fail(`${where} ${tab}`, `text under 13px: ${small.join("; ")}`);
    for (const target of await page.locator(TARGETS).all()) {
      const box = await target.boundingBox();
      if (box && Math.min(box.width, box.height) < 43.5)
        fail(
          `${where} ${tab}`,
          `tap target ${Math.round(box.width)}x${Math.round(box.height)}: ${(await target.innerText()).trim().slice(0, 24)}`,
        );
    }
    // Fixed controls may not sit on top of each other. (In-flow content scrolls out from under the
    // Learning-supports button; another fixed control never does, so that is the overlap that matters.)
    const overlap = await page.evaluate(() => {
      const fab = document.querySelector(".ls-launcher");
      if (!fab) return null;
      const f = fab.getBoundingClientRect();
      for (const el of document.querySelectorAll("body *")) {
        if (
          el === fab ||
          fab.contains(el) ||
          el.contains(fab) ||
          el.closest(".ls-panel, .hw-toast, dialog")
        )
          continue;
        if (
          getComputedStyle(el).position !== "fixed" ||
          (!el.offsetParent && el.tagName !== "BUTTON")
        )
          continue;
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        if (f.left < r.right && f.right > r.left && f.top < r.bottom && f.bottom > r.top)
          return String(el.className).split(" ")[0] || el.tagName;
      }
      return null;
    });
    if (overlap) fail(`${where} ${tab}`, `Learning supports button covers fixed .${overlap}`);
  }

  // Behavior on the Check stop: a wrong answer is not progress; four right answers open the mystery.
  await page.evaluate(() => window.switchHomeworkTab("check"));
  const run = await page.evaluate(async () => {
    const sections = window
      .activeCoreProblems()
      .filter((s) => s.dataset.problemType === "multiple-choice");
    if (!sections.length) return { noMultipleChoice: true };
    const idx = (s) => parseInt(s.id.replace("problem_", ""), 10);
    const wrong = sections[0].querySelector(
      "input[type='radio']:not([value='" +
        sections[0].querySelector(".mc-options").dataset.correct +
        "'])",
    );
    wrong.click();
    window.checkProblem(idx(sections[0]));
    await new Promise((resolve) => setTimeout(resolve, 150));
    const afterWrong = {
      goal: window.hwGoalSnapshot().goal,
      text: document.getElementById("progress_text").textContent,
      banner: !document.getElementById("goal_reached_banner").hidden,
      intelligenceVisible: !document.getElementById("problem_intelligence_" + idx(sections[0]))
        .hidden,
      intelligenceText: document.getElementById("problem_intelligence_" + idx(sections[0]))
        .innerText,
      evidence: window.__HW_INSTRUCTIONAL_EVIDENCE__,
    };
    const languageButton = document.querySelector(
      "#problem_intelligence_" +
        idx(sections[0]) +
        " [data-act=hwChooseHelp][data-args*=language-access]",
    );
    if (languageButton) languageButton.click();
    const spanishGuidance =
      document.querySelector(
        "#problem_intelligence_" + idx(sections[0]) + " [data-intelligence-guidance] .lang-es",
      )?.textContent || "";
    const steps = [];
    for (let i = 0; i < 4 && i < sections.length; i++) {
      const s = sections[i];
      s.querySelector(
        "input[type='radio'][value='" + s.querySelector(".mc-options").dataset.correct + "']",
      ).click();
      window.checkProblem(idx(s));
      steps.push(document.getElementById("progress_text").textContent);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return {
      afterWrong,
      spanishGuidance,
      spanishMode: document.body.classList.contains("lang-mode-es"),
      steps,
      transferText: sections[1]?.querySelector("[data-intelligence-guidance]")?.innerText || "",
      banner: !document.getElementById("goal_reached_banner").hidden,
      unlocked: document.getElementById("hw_mystery").classList.contains("is-unlocked"),
      available: sections.length,
    };
  });
  if (run.noMultipleChoice) {
    fail(
      where,
      "Check stop has no multiple-choice problem, so the wrong-answer behavior cannot be tested",
    );
    return;
  }
  if (run.afterWrong.banner) fail(where, "a wrong answer showed the goal banner");
  // The goal is four on Keep Going and two on Quick Practice (the default), so read it from the route in effect.
  // Before any solved problem the progress reads "Not started" (a wrong answer is not progress).
  const expectedText = "Not started";
  if (run.afterWrong.text !== expectedText)
    fail(
      where,
      `after one wrong answer progress reads ${run.afterWrong.text}, not ${expectedText}`,
    );
  if (!run.afterWrong.intelligenceVisible)
    fail(where, "a checked answer did not open the shared math feedback card");
  if (!/strategy yet/i.test(run.afterWrong.intelligenceText))
    fail(where, "an unclassified wrong answer did not receive uncertainty-aware guidance");
  if (run.afterWrong.evidence?.events?.at(-1)?.kind !== "unclear")
    fail(where, "a wrong answer without specific evidence was assigned a diagnosis");
  if (run.afterWrong.evidence?.events?.at(-1)?.condition !== "independent")
    fail(where, "the first unsupported answer was incorrectly marked as supported");
  if (!run.spanishGuidance)
    fail(where, "the language-access action did not expose the Spanish guidance");
  if (!run.spanishMode)
    fail(where, "the language-access action did not switch the existing language picker");
  if (run.available >= 4) {
    if (run.steps.at(-1) !== "4 / 4") fail(where, `four right answers read ${run.steps.at(-1)}`);
    if (!run.banner) fail(where, "goal banner did not appear at four");
    if (!run.unlocked) fail(where, "mystery challenge did not unlock");
    // It survives a reload and does not celebrate twice.
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction("typeof hwRenderGoal === 'function'");
    await page.waitForTimeout(900);
    const again = await page.evaluate(() => ({
      text: document.getElementById("progress_text").textContent,
      toast: !document.getElementById("hw_toast").hidden,
      evidenceCount: window.__HW_INSTRUCTIONAL_EVIDENCE__?.events?.length || 0,
    }));
    if (again.text !== "4 / 4") fail(where, `after reload progress reads ${again.text}`);
    if (again.toast) fail(where, "goal celebrated again after reload");
    if (again.evidenceCount < 5)
      fail(where, "categorical math evidence did not survive save/resume");
    if (!/new problem/i.test(run.transferText))
      fail(where, "an independent success after support did not route to transfer feedback");
  }

  // Reset is an in-page bilingual dialog, never a native one.
  let nativeDialog = false;
  page.on("dialog", (d) => {
    nativeDialog = true;
    d.dismiss();
  });
  await page.evaluate(() => window.resetWorksheet());
  await page.waitForTimeout(150);
  if (nativeDialog) fail(where, "reset opened a native dialog");
  if (!(await page.locator("#hw_dialog[open]").count()))
    fail(where, "reset did not open the in-page dialog");

  for (const e of errors.filter((m) => !IGNORED_CONSOLE.some((re) => re.test(m))))
    fail(where, `console error: ${e.slice(0, 120)}`);
  await context.close();
}

async function sweepLanguages(browser, lesson) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const { page } = await openPage(context, lesson, "?lang=es");
  if ((await page.evaluate(() => document.documentElement.lang)) !== "es")
    fail(`${lesson} ?lang=es`, "page did not open in Spanish");
  await page.evaluate(() => window.switchHomeworkTab("learn"));
  const small = await page.evaluate(`(${SMALL_TEXT})()`);
  if (small.length) fail(`${lesson} es`, `text under 13px: ${small.join("; ")}`);
  const quick = await openPage(context, lesson, "?route=quick");
  const goal = await quick.page.evaluate(() => window.hwGoalSnapshot().goal);
  if (goal !== 2) fail(`${lesson} quick`, `Quick goal is ${goal}, not 2`);
  await context.close();
}

// Learn is a run of cards and every stop has Back / Next: one thing on screen, one next action.
async function sweepStops(browser, lesson) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const { page } = await openPage(context, lesson);
  const where = `${lesson} @390 stops`;
  await page.evaluate(() => window.switchHomeworkTab("learn"));
  const visibleCards = () => page.locator(".learn-card:not([hidden])").count();
  const total = await page.locator(".learn-card").count();
  if (total < 2) fail(where, `Learn has ${total} card(s); expected a run of cards`);
  if ((await visibleCards()) !== 1) fail(where, "Learn shows more or fewer than one card");
  if (!(await page.locator(".hw-stop-nav").isHidden()))
    fail(where, "the stop bar competes with the card pager on Learn");
  await page.locator(".learn-pager-next").click();
  if ((await visibleCards()) !== 1) fail(where, "Next left more than one card showing");
  // A link or chip that points into a hidden card opens that card.
  await page.evaluate(() => window.setLearnCard(0));
  const target = await page.evaluate(() => {
    const el = document.getElementById("hw_learn_idea");
    if (!el) return false;
    window.revealLearnCardFor(el);
    return !el.closest(".learn-card").hidden;
  });
  if (!target) fail(where, "a link into a hidden Learn card did not open it");
  // The last Next leaves Learn for the next stop.
  for (let i = 0; i < total + 1; i++) {
    if ((await page.evaluate(() => document.body.dataset.activeTab)) !== "learn") break;
    await page.locator(".learn-pager-next").click();
  }
  const stop = await page.evaluate(() => document.body.dataset.activeTab);
  if (stop === "learn") fail(where, "the last Learn card's Next did not move to the next stop");
  // Later stops have Back; it returns, and the progress reads Not started before any attempt.
  if (await page.locator("#hw_stop_back").isHidden()) fail(where, `no Back button on ${stop}`);
  await page.evaluate(() => window.switchHomeworkTab("check"));
  const progress = await page.locator("#progress_text").textContent();
  if (progress.trim() !== "Not started")
    fail(where, `progress reads "${progress}" before any attempt`);
  await page.locator("#hw_stop_back").click();
  if ((await page.evaluate(() => document.body.dataset.activeTab)) === "check")
    fail(where, "Back did not leave the Practice stop");
  // The Learning-supports icon lives in the tracker row, not floating over the page.
  const launcher = await page.evaluate(() => {
    const el = document.querySelector(".ls-launcher");
    return el ? getComputedStyle(el).position : "missing";
  });
  if (launcher === "fixed") fail(where, "the Learning-supports icon is still a fixed overlay");
  await context.close();
}

async function sweepDesktop(browser, lesson) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const { page } = await openPage(context, lesson);
  // Laptops and Chromebooks: the route choice and Start are on the first screen (button bottom <= 700px).
  const startBottom = await page.evaluate(
    () => document.getElementById("hw_start_button").getBoundingClientRect().bottom + scrollY,
  );
  if (startBottom > 700)
    fail(
      `${lesson} @1280`,
      `the Start button ends ${Math.round(startBottom)}px down; keep it within 700px`,
    );
  for (const tab of ["learn", "check", "done"]) {
    await page.evaluate((t) => window.switchHomeworkTab(t), tab);
    await page.waitForTimeout(100);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if (overflow > 1) fail(`${lesson} @1280 ${tab}`, `horizontal scroll by ${overflow}px`);
  }

  // Case File: spans both columns of the stop and uses both sides of its own card.
  await page.evaluate(() => window.switchHomeworkTab("learn"));
  await page.waitForTimeout(100);
  const cf = await page.evaluate(() => {
    const card = document.getElementById("hw_case");
    if (!card) return null;
    const box = (el) => el.getBoundingClientRect();
    const left = card.querySelector(".cf-left");
    const right = card.querySelector(".cf-right");
    const panel = document.getElementById("hw_panel_learn");
    return {
      span: box(card).width / box(panel).width,
      sideBySide: box(right).left > box(left).left + 120,
      rightText: right.textContent.trim().length,
      leftText: left.textContent.trim().length,
    };
  });
  if (!cf) fail(`${lesson} @1280`, "Learn stop has no Case File");
  else {
    if (cf.span < 0.85)
      fail(`${lesson} @1280`, `Case File spans only ${Math.round(cf.span * 100)}% of the stop`);
    if (!cf.sideBySide) fail(`${lesson} @1280`, "Case File columns are not side by side");
    if (!cf.rightText || !cf.leftText) fail(`${lesson} @1280`, "Case File has an empty side");
  }

  // The sidebar offers the Case File and jumps to it.
  const caseBtn = page.locator("#hw_sub_learn .hw-sub-btn", { hasText: /Case File/ });
  if ((await caseBtn.count()) !== 1) fail(`${lesson} @1280`, "sidebar has no Case File button");

  // Click-to-enlarge: a graphic opens in the lightbox; Escape closes it and focus returns.
  const gfx = page
    .locator("#hw_case svg.cf-tag, #hw_case svg.cf-line, #hw_panel_learn .concept-visual-wrap svg")
    .first();
  if (await gfx.count()) {
    // One idea at a time on every width: the Learn stop shows the card that holds the graphic only after the
    // family reaches it (the design system's [hidden] rule always wins), so go to it the way the stepper does.
    await gfx.evaluate((el) => window.revealLearnCardFor?.(el));
    await gfx.scrollIntoViewIfNeeded();
    await gfx.click();
    const opened = await page.locator(".hw-lightbox-dialog[open]").count();
    if (!opened) fail(`${lesson} @1280`, "clicking a graphic did not open the lightbox");
    else {
      await page.keyboard.press("Escape");
      await page.waitForTimeout(50);
      if (await page.locator(".hw-lightbox-dialog[open]").count())
        fail(`${lesson} @1280`, "Escape did not close the lightbox");
    }
  }
  await context.close();
}

try {
  for (const lesson of lessons) {
    await sweepPhone(browser, lesson);
    await sweepLanguages(browser, lesson);
    await sweepStops(browser, lesson);
    await sweepDesktop(browser, lesson);
    process.stdout.write(`  ${lesson} ✓\n`);
  }
} finally {
  await browser.close();
  server.close();
}

if (problems.length) {
  console.error(`\nFAIL verify-family-experience-browser: ${problems.length} problem(s)`);
  for (const p of problems.slice(0, 200)) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `\nPASS verify-family-experience-browser: ${lessons.length} lesson(s), phone + Spanish + Quick + desktop`,
);

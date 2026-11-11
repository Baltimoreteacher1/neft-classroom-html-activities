#!/usr/bin/env node
/**
 * The teacher introduction in a real browser: home cards -> guided tour -> activity -> return -> resume; exploration
 * (focus, try, plan, copy); featured lesson (Use This Lesson, cue check, saved boxes); presenter view; the next-step strip
 * and return bar on curated activities only; Spanish home cards; keyboard path; axe WCAG 2.2 AA; 375px overflow.
 *   node tools/access-intro-e2e.mjs        (serves this working tree)
 * A missing browser is a SKIP locally and a FAIL in CI.
 */
import { serveAccess } from "./lib/access-serve.mjs";

let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("access-intro-e2e: SKIP: playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
try {
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  console.warn("access-intro-e2e: axe-core/playwright missing; axe checks skipped.");
}
const { server, base } = await serveAccess();
const LAB = `${base}/access-practice-lab`;
let browser;
try {
  browser = await chromium.launch();
} catch (error) {
  console.warn(`access-intro-e2e: SKIP: no browser (${error.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 0);
}
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  reducedMotion: "reduce",
  permissions: ["clipboard-read", "clipboard-write"],
});
const errors = [];
const failures = [];
const ok = (cond, msg) => {
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
};
const open = async (path, { width } = {}) => {
  const page = await context.newPage();
  if (width) await page.setViewportSize({ width, height: 900 });
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/web-vitals|favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  await page.goto(`${LAB}${path}`, { waitUntil: "load" });
  await page.waitForSelector("#app > :not(.boot):not(.route-loading)");
  return page;
};
async function landingView(href) {
  const p = await open(href.replace("/access-practice-lab", ""));
  const h = await p.locator("#app h1").first().innerText();
  await p.close();
  return h;
}
const heading = (p) => p.locator("#app h1").first().innerText();
const path = (p) =>
  new URL(p.url()).pathname.replace("/access-practice-lab", "") + new URL(p.url()).search;
async function axe(page, label) {
  if (!AxeBuilder) return;
  const res = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const bad = res.violations.filter((v) => ["serious", "critical"].includes(v.impact));
  ok(bad.length === 0, `axe: ${label}${bad.length ? ` (${bad.map((v) => v.id).join(", ")})` : ""}`);
}
const overflow = async (page, label) =>
  ok(
    (await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )) <= 0,
    `no horizontal scroll: ${label}`,
  );

// ── home cards ─────────────────────────────────────────────────────────────
let page = await open("/");
ok((await page.locator(".lph-start").count()) === 2, "home shows two Start Here cards");
ok(
  (await page.locator(".lph-start.is-teacher h2").innerText()).includes("Teachers: Start Here"),
  "teacher card title",
);
ok(
  (await page.locator(".lph-start.is-family > .btn").innerText()).includes("Start Family Practice"),
  "family card button",
);
const topY = await page
  .locator(".lph-start.is-teacher")
  .evaluate((e) => e.getBoundingClientRect().top);
ok(topY < 450, `cards sit near the top of the home (top ${Math.round(topY)}px)`);
ok(
  (await page.locator(".lab-tools a.top-family").innerText()).includes("Families"),
  "Families in the main navigation",
);
ok(
  (await page.locator("footer.lab-footer a[href*='/site-guide']").count()) === 1,
  "Site Guide in the footer",
);
await axe(page, "home");
await page.locator(".lph-start.is-teacher > .btn").click();
await page.waitForSelector(".in-tour");
ok(path(page).startsWith("/start/tour"), "Start the Teacher Tour opens the tour");
ok(
  (await page.locator(".ts-progress-text").innerText()).includes("Step 1 of 5"),
  "tour shows Step 1 of 5",
);

// ── guided tour ────────────────────────────────────────────────────────────
await page.locator('input[name="tour-need"][value="speaking"]').check();
await page.getByRole("link", { name: /^Next: Try speaking/ }).click();
await page.waitForSelector(".in-tour");
ok(
  (await page.locator(".ts-progress-text").innerText()).includes("Step 2 of 5") &&
    (await heading(page)).includes("Try speaking"),
  "Next moves to stop 2",
);
await page.locator('[data-tour-sample="spoken"]').click();
await page.locator('[data-tour-tried="speaking"]').check();
await page.locator('input[name="tour-supportTried"][value="frame"]').check();
await page.getByRole("link", { name: /Open The Busy Hallway/ }).click();
await page.waitForSelector(".voice-ladder, [data-lab-view='voice'] h1, #app h1");
ok(
  path(page).startsWith("/voice/ladder/school-hallway") && path(page).includes("intro=tour"),
  "the activity opens in the same tab with a return hint",
);
ok(
  (await page.locator("#introReturn a").innerText()).includes("Back to the Teacher Tour"),
  "return bar names the tour",
);
ok(
  (await page.locator("#introNext").count()) === 1 &&
    (await page.locator("#introNext a").count()) === 3,
  "end-of-activity strip: Try Again, Return, one next activity",
);
ok(
  (await page.locator("#introNext a.btn-primary").innerText()).includes("Language Upgrade Lab"),
  "the one recommended next activity",
);
ok(
  (await page.locator("[data-rec-start]").count()) >= 1 &&
    (await page
      .locator("#introNext")
      .evaluate(
        (e) =>
          e.compareDocumentPosition(document.querySelector("[data-rec-start]")) &
          Node.DOCUMENT_POSITION_PRECEDING,
      )) > 0,
  "the strip comes after the activity, never over it",
);
await page.locator("#introReturn a").click();
await page.waitForSelector(".in-tour");
ok(
  (await page.locator(".ts-progress-text").innerText()).includes("Step 2 of 5"),
  "returning lands on the same tour step",
);
ok((await page.locator("#introReturn").count()) === 0, "the return bar goes away on the tour");
ok(
  (await page.locator('[data-tour-tried="speaking"]').isChecked()) &&
    (await page.locator("#tour-spoken").inputValue()).length > 10 &&
    (await page.locator('input[name="tour-supportTried"][value="frame"]').isChecked()),
  "tour notes survived the round trip",
);
await page.reload();
await page.waitForSelector(".in-tour");
ok(
  (await page.locator(".ts-progress-text").innerText()).includes("Step 2 of 5"),
  "reload resumes the tour on this device",
);
await axe(page, "tour step 2");
await overflow(page, "tour 1280");
const tourState = JSON.parse(
  await page.evaluate(() => localStorage.getItem("accessPracticeLab:v1:intro")),
);
ok(
  tourState.tour.tried.speaking === true && tourState.tour.notes.need === "speaking",
  "saved under accessPracticeLab:v1:intro",
);
for (let i = 0; i < 3; i++) await page.getByRole("link", { name: /^Next:/ }).click();
await page.waitForSelector(".in-tour");
ok(
  (await page.locator(".ts-progress-text").innerText()).includes("Step 5 of 5") &&
    (await page.locator("[data-tour-finish]").count()) === 1,
  "stop 5 offers Finish",
);
await page.getByRole("link", { name: "Exit" }).click();
await page.waitForSelector(".in-hub");
ok(
  (await heading(page)) === "Start Here: Speaking and Writing",
  "Exit returns to the teacher start page",
);
ok((await page.locator(".in-choices a").count()) === 3, "three choices on the start page");
ok(
  (await page.locator(".in-choice.is-tour strong").innerText()).includes("Resume the tour"),
  "start page offers to resume the saved tour",
);
ok(
  (await page.locator(".ts-chips li").count()) === 4,
  "overview: four at-a-glance facts in the band",
);
ok(
  (await page.locator(".ts-nav a[aria-current='page']").innerText()).includes("Overview"),
  "teacher nav marks Overview",
);
ok(
  (await page.locator(".ov-progress li").count()) >= 1 &&
    (await page.locator(".ov-progress").innerText()).includes("Guided Tour: Step 5 of 5"),
  "overview: progress panel shows the saved tour",
);
ok(
  (await page.locator(".ov-loop li").count()) === 5 &&
    (await page.locator(".ov-cancan section").count()) === 2,
  "overview: learning loop and what feedback can and cannot do",
);
for (const id of ["ov-how", "ov-paths", "ov-lesson", "ov-time", "ov-share", "ov-pd", "ov-families"])
  ok(
    (await page.locator(`#${id}`).count()) === 1 &&
      (await page.locator(`.ov-jump a[href$="#${id}"]`).count()) === 1,
    `overview section and jump link: ${id}`,
  );
ok(
  (await page.locator("#ov-paths .in-act").count()) === 4 &&
    (await page.locator("#ov-paths .in-preview").count()) === 4,
  "overview: four activity cards, each with See an Example",
);
ok(
  (await page.locator("#ov-time .ov-routine").count()) === 3,
  "overview: three class-time routines",
);
await page.locator("#ov-pd [data-ov-copy]").click();
ok(
  (await page.evaluate(() => navigator.clipboard.readText())) ===
    "https://thelanguagepage.com/access-practice-lab/start",
  "overview: Copy the PD link copies the single entrance",
);
await page.locator("#ov-lesson [data-ov-copy]").click();
ok(
  (await page.evaluate(() => navigator.clipboard.readText())).endsWith(
    "/access-practice-lab/voice/ladder/school-hallway",
  ),
  "overview: Copy student link copies the plain activity link",
);
await page.locator('.ov-jump a[href$="#ov-pd"]').click();
await page.waitForTimeout(500);
ok(
  await page.locator("#ov-pd").evaluate((e) => {
    const r = e.getBoundingClientRect();
    return r.top >= -5 && r.top < innerHeight;
  }),
  "overview: a jump link scrolls to its section",
);
ok((await page.locator(".in-hub").count()) === 1, "overview: jumping keeps the page");
await page.locator("#ov-paths .in-act a.btn").first().click();
await page.waitForSelector("#introReturn");
ok(
  (await page.locator("#introReturn a").innerText()).includes("Back to Start Here"),
  "activity opened from the overview offers Back to Start Here",
);
await page.locator("#introReturn a").click();
await page.waitForSelector(".in-hub");
await axe(page, "start page");
await page.close();

// ── exploration ────────────────────────────────────────────────────────────
page = await open("/start/explore");
ok(
  (await page.locator("[data-explore-focus]").count()) === 2,
  "speaking and writing are equally visible",
);
await page.locator('[data-explore-focus="writing"]').click();
await page.getByRole("link", { name: /^Next: Try one activity/ }).click();
await page.waitForSelector(".in-explore");
const names = await page.locator(".in-act h3").allInnerTexts();
ok(
  names.length === 2 &&
    names[0].includes("Language Upgrade Lab") &&
    names[1].includes("Should School Start Later?"),
  "only the Writing pathway's two activities show",
);
await page.locator("[data-explore-switch]").click();
await page.waitForSelector(".in-explore");
ok(
  (await page.locator(".in-act h3").first().innerText()).includes("Busy Hallway"),
  "easy switch to Speaking",
);
await page.locator(".in-preview summary").first().click();
ok(
  (await page.locator(".in-preview[open] dd").count()) === 3,
  "See an Example shows task, sample and what students do next",
);
await page.getByRole("link", { name: /^Next: Adapt it/ }).click();
await page.locator("[data-explore-sample]").click();
await page.waitForFunction(() => document.querySelector("#plan-practice")?.value.length > 5);
ok(
  (await page.locator("#plan-practice").inputValue()).length > 5,
  "sample fills the planning card",
);
await page.locator("#plan-look").fill("a clear reason");
await page.getByRole("link", { name: /^Next: Rehearse/ }).click();
await page.locator('input[name="mode"][value="alone"]').check();
await page.locator('[data-explore-frame="0"]').fill("The Busy Hallway");
await page.getByRole("link", { name: /^Next: Leave/ }).click();
await page.locator("#next-group").fill("Period 3");
await page.locator("#next-when").fill("Tuesday");
const planText = await page.locator("[data-explore-plan-text]").innerText();
ok(
  /Activity: The Busy Hallway/.test(planText) &&
    /Period 3/.test(planText) &&
    /Tuesday/.test(planText) &&
    /a clear reason/.test(planText) &&
    /The Busy Hallway with/.test(planText),
  "plan text is built only from what the teacher entered",
);
await page.locator("[data-explore-copy]").click();
ok(
  (await page.evaluate(() => navigator.clipboard.readText())) === planText,
  "Copy my plan copies the plan",
);
await page.reload();
await page.waitForSelector(".in-explore");
ok((await page.locator("#next-when").inputValue()) === "Tuesday", "plan is saved on this device");
await page.locator("details.in-later summary").click();
ok(
  (await page.locator("details.in-later li").count()) === 2,
  "Explore Later holds exactly the two supplemental resources",
);
await axe(page, "exploration step 5");
await page.close();

// ── featured lesson ────────────────────────────────────────────────────────
page = await open("/start/lesson");
const studentLink = await page.locator("#lsLink").inputValue();
ok(
  studentLink === "https://thelanguagepage.com/access-practice-lab/voice/ladder/school-hallway" &&
    !studentLink.includes("intro="),
  "student link opens the activity directly (no teacher hints)",
);
await page.locator("[data-lesson-copy-link]").click();
ok(
  (await page.evaluate(() => navigator.clipboard.readText())) === studentLink,
  "Copy Student Link copies it",
);
await page.locator("[data-lesson-copy-dir]").click();
ok(
  /^1\. Open the link/.test(await page.evaluate(() => navigator.clipboard.readText())),
  "student directions copy as a numbered list",
);
ok(
  !(await page.locator(".in-use").innerText()).match(/presenter|watch for/i),
  "the Use This Lesson panel holds no presenter notes",
);
await page
  .locator("#lsDraft")
  .fill("The school should make the hallway bigger. It is too crowded.");
await page.locator("[data-lesson-check]").click();
ok(
  (await page.locator("[data-lesson-cue]").innerText()).includes(
    "Example phrase (For example): not found yet",
  ),
  "cue check says the example is missing",
);
await page
  .locator("#lsRevised")
  .fill(
    "The school should make the hallway bigger because it is crowded. For example, students bump into each other.",
  );
await page.locator("[data-lesson-check]").click();
ok(
  (await page.locator("[data-lesson-cue]").innerText()).includes(
    "Example phrase (For example): found",
  ),
  "cue check finds the example after revising",
);
await page.reload();
await page.waitForSelector(".in-lesson");
ok(
  (await page.locator("#lsRevised").inputValue()).includes("For example"),
  "both boxes are saved on this device",
);
await page.locator('[data-lesson-level="independent"]').click();
await page.waitForSelector('[data-lesson-level="independent"][aria-pressed="true"]');
ok(
  (await page.locator('[data-lesson-level="independent"]').getAttribute("aria-pressed")) === "true",
  "support level switches",
);
await axe(page, "featured lesson");
await page.close();

// ── presenter view ─────────────────────────────────────────────────────────
page = await open("/start/present?stop=1");
ok((await page.locator(".in-qr svg").count()) === 1, "presenter view shows the one QR code");
ok(
  (await page.locator(".in-qr").innerText()).includes(
    "thelanguagepage.com/access-practice-lab/start",
  ),
  "QR caption prints the short link",
);
await page.keyboard.press("Escape");
await page.locator("#app").click({ position: { x: 5, y: 5 } });
await page.keyboard.press("ArrowRight");
await page.waitForSelector(".in-slide .in-range");
ok(
  (await page.locator(".in-range").innerText()).includes("Minutes 0–3"),
  "arrow key moves to the first timed segment",
);
await page.getByRole("link", { name: "Show presenter notes" }).click();
await page.waitForSelector(".in-notes");
ok(
  (await page.locator(".in-notes h3").allInnerTexts()).includes("Say"),
  "presenter notes show on request",
);
const slide = () => page.locator(".ts-progress-text").innerText();
let seen = 1;
while (!(await slide()).includes("Slide 8 of 8")) {
  const before = await slide();
  await page.getByRole("link", { name: /^Next$/ }).click();
  await page.waitForFunction(
    (b) => document.querySelector(".ts-progress-text")?.textContent !== b,
    before,
  );
  seen++;
}
ok(
  seen === 7 && (await page.getByRole("link", { name: /Start the exploration/ }).count()) === 1,
  "eight slides (setup, six segments, handoff) end with a working handoff to the exploration",
);
await page.getByRole("link", { name: /Start the exploration/ }).click();
await page.waitForSelector(".in-explore");
ok(path(page).startsWith("/start/explore"), "handoff lands on the exploration page");
await page.close();

// ── Activity Guide ─────────────────────────────────────────────────────────
page = await open("/start/activities");
ok((await page.locator(".ag-card").count()) === 6, "Activity Guide: six how-to cards");
ok(
  (await page.locator(".ag-card .ag-more").count()) === 6 &&
    !(await page.locator(".ag-why").first().isVisible()),
  "Activity Guide: quick view keeps the deep layer closed",
);
await page.locator('[data-ag-view="full"]').click();
await page.waitForSelector('[data-ag-view="full"][aria-pressed="true"]');
ok(
  (await page.locator(".ag-card .ag-more").count()) === 0 &&
    (await page.locator(".ag-why").first().isVisible()),
  "Activity Guide: full detail shows why it works and troubleshooting",
);
await page.reload();
await page.waitForSelector(".in-activities");
ok(
  (await page.locator('[data-ag-view="full"]').getAttribute("aria-pressed")) === "true",
  "Activity Guide: the detail choice is remembered on this device",
);
ok(
  (await page.locator(".ag-card").first().locator(".ag-steps li").count()) >= 4,
  "Activity Guide: numbered steps on each card",
);
ok(
  (await page.locator(".ts-nav a[aria-current='page']").innerText()).includes("Activity Guide"),
  "teacher nav marks Activity Guide",
);
await page.locator("#act-upgrade [data-ag-copy]").click();
ok(
  (await page.evaluate(() => navigator.clipboard.readText())).endsWith(
    "/scaffold/language-upgrade?item=lu68-argue-phones",
  ),
  "Activity Guide: copy student link",
);
await page.locator("#act-upgrade a.btn-primary").click();
await page.waitForSelector("#introReturn");
ok(
  (await page.locator("#introReturn a").innerText()).includes("Back to the Activity Guide"),
  "Activity Guide: activity offers the way back",
);
await page.locator("#introReturn a").click();
await page.waitForSelector(".in-activities");
await axe(page, "Activity Guide");
for (const nav of ["Guided Tour", "Explore", "Lesson", "Quick Guide", "Presenter", "Overview"]) {
  await page.locator(".ts-nav ul a", { hasText: nav }).first().click();
  await page.waitForFunction(
    (n) => document.querySelector(".ts-nav a[aria-current='page']")?.textContent.includes(n),
    nav,
  );
}
ok(true, "teacher nav moves between every teacher page");
await page.close();

// ── Family grade choice ─────────────────────────────────────────────────────
page = await open("/practice-together");
ok((await page.locator("[data-tg-band]").count()) === 3, "family page: three grade choices");
await page.locator('[data-tg-band="3-5"]').click();
await page.waitForSelector('[data-tg-band="3-5"][aria-pressed="true"]');
const starts35 = await page
  .locator(".tg-start")
  .evaluateAll((as) => as.map((a) => a.getAttribute("href")));
ok(
  starts35.length === 2 &&
    /class-garden\?grades=3-5/.test(starts35[0]) &&
    /lu35-explain-plants&grades=3-5/.test(starts35[1]),
  "family page: grades 3–5 open that band's own activities",
);
const dest = await landingView(starts35[0]);
ok(dest.includes("Our Class Garden"), "family page: the grades 3–5 talk activity opens");
await page.locator('[data-tg-band="k-2"]').click();
await page.waitForSelector('[data-tg-band="k-2"][aria-pressed="true"]');
ok(
  (await page.locator(".tg-start").count()) === 1 &&
    /\/early\?grades=K/.test(await page.locator(".tg-start").getAttribute("href")),
  "family page: grades K–2 go to the early learners home",
);
await page.reload();
await page.waitForSelector(".tg-page");
ok(
  (await page.locator('[data-tg-band="k-2"]').getAttribute("aria-pressed")) === "true",
  "family page: the grade choice is remembered on this device",
);
await page.locator('[data-tg-band="6-8"]').click();
await page.waitForSelector('[data-tg-band="6-8"][aria-pressed="true"]');
await axe(page, "family page with grade choice");
await page.close();

// ── existing routes untouched ──────────────────────────────────────────────
page = await open("/voice/ladder/school-hallway");
ok(
  (await page.locator("#introReturn, #introNext").count()) === 0,
  "a plain activity link shows no introduction bar or strip",
);
await page.close();
page = await open("/scaffold/language-upgrade?item=lu68-explain-ice&intro=tour");
ok(
  (await page.locator("#introNext").count()) === 0 &&
    (await page.locator("#introReturn").count()) === 1,
  "other activities get the return bar but not the curated next-step strip",
);
await page.locator("#introReturn [data-intro-return-close]").click();
ok((await page.locator("#introReturn").count()) === 0, "the return bar can be hidden");
await page.close();

// ── Spanish home, keyboard, mobile ─────────────────────────────────────────
page = await open("/");
await page.locator(".lang-btn[data-lang-mode='es']").first().click();
await page.waitForSelector(".lph-start");
ok(
  (await page.locator(".lph-start.is-family > .btn").innerText()).includes(
    "Empezar a practicar en familia",
  ),
  "Spanish family card",
);
ok(
  (await page.locator(".lph-start.is-teacher h2").innerText()).includes("Docentes: Empiecen aquí"),
  "Spanish teacher card",
);
await page.locator(".lang-btn[data-lang-mode='en']").first().click();
let reached = false;
for (let i = 0; i < 60 && !reached; i++) {
  await page.keyboard.press("Tab");
  reached = await page.evaluate(() =>
    document.activeElement?.matches(".lph-start.is-teacher > .btn"),
  );
}
ok(reached, "keyboard Tab reaches the teacher Start card");
const ring = await page.evaluate(() => {
  const s = getComputedStyle(document.activeElement);
  return s.outlineStyle !== "none" && Number.parseFloat(s.outlineWidth) >= 2;
});
ok(ring, "visible keyboard focus ring on the Start card button");
await page.close();
for (const route of [
  "/",
  "/start",
  "/start/tour?stop=3",
  "/start/explore?stop=2&focus=writing",
  "/start/lesson",
  "/start/present?stop=2&focus=notes",
]) {
  page = await open(route, { width: 375 });
  await overflow(page, `375px ${route}`);
  await page.close();
}
ok(errors.length === 0, `no console or page errors${errors.length ? `: ${errors[0]}` : ""}`);
await browser.close();
server.close();
if (failures.length) {
  console.error(`\naccess-intro-e2e: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\naccess-intro-e2e: all checks passed");

#!/usr/bin/env node
/**
 * The teacher introduction in a real browser: home cards -> Teacher Tour (pick a skill, Mr. Neft's coach in a real
 * reading, speaking and writing activity, support + class card + map, restart, resume, 390px dock); exploration
 * (four domains, try, plan, copy); featured lesson (Use This Lesson, cue check, saved boxes); presenter view gone; the next-step strip
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
  (await page.locator(".lph-start.is-family > .btn").innerText()).includes(
    "Practice English Together",
  ),
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
await page.waitForSelector(".gt-part-skill");
ok(
  path(page).startsWith("/start/tour?part=1") && /grades=/.test(path(page)),
  "Start the Teacher Tour opens Part 1 in the home's grades",
);

// ── Teacher Tour: Part 1 pick a skill, Part 2 try it as a student with Mr. Neft, Part 3 use it with your class ──
const coachTitle = () => page.locator(".gc-title").innerText();
const coachSays = async (re, label) => {
  await page
    .waitForFunction(
      (s) => new RegExp(s).test(document.querySelector(".gc-title")?.textContent || ""),
      re.source,
      { timeout: 10000 },
    )
    .catch(() => {});
  const t = await coachTitle().catch(() => "");
  ok(re.test(t), `${label} (card: "${t}")`);
};
/** Press the coach's Next / Skip button. */
const coachNext = () => page.locator(".gc-foot [data-gc=next]").click();
/** If the activity opens with its skill lesson, press its button the way a student would. */
const passSkillLesson = async (label) => {
  if (/skill lesson/.test(await coachTitle())) {
    await page.frameLocator("iframe.gc-frame").locator("[data-frame-ready]").first().click();
    await page
      .waitForFunction(() => !/skill lesson/.test(document.querySelector(".gc-title")?.textContent))
      .catch(() => {});
    ok(!/skill lesson/.test(await coachTitle()), `${label}: the skill lesson's button moves on`);
  }
};
const openPart2 = async (skill) => {
  await page.goto(`${LAB}/start/tour?part=2&grades=6-8&skill=${skill}`, { waitUntil: "load" });
  await page.waitForSelector(".gc-card", { timeout: 60000 });
  await page
    .frameLocator("iframe.gc-frame")
    .locator("#app h1")
    .first()
    .waitFor({ state: "attached", timeout: 60000 });
  await page.waitForTimeout(300);
};
await page.setViewportSize({ width: 1366, height: 900 });
await page.goto(`${LAB}/start/tour?part=1&grades=6-8`, { waitUntil: "load" });
await page.waitForSelector(".gt-part-skill");
ok((await page.locator("a.gt-domain[data-gt-skill]").count()) === 4, "Part 1: four skill cards");
ok(
  (await page.locator("section.nb .nb-name").innerText()).includes("Mr. Neft") &&
    (await page.locator("section.nb details.nb-ask").count()) === 1,
  "Part 1: Mr. Neft opens the part, with Ask Mr. Neft",
);
ok(
  (await page.locator("#gtTitle").innerText()) === "What would you like your students to practice?",
  "Part 1: the question",
);
ok((await page.locator(".gt-exit").innerText()).includes("Exit tour"), "Exit tour link is present");
await page.locator('a.gt-domain[data-gt-skill="reading"]').click();
await page.waitForSelector(".gc-card", { timeout: 60000 });
ok(
  /part=2/.test(path(page)) && /skill=reading/.test(path(page)),
  "the Reading card opens Part 2 with Reading chosen",
);
ok(
  (await page.locator(".gc-card .gc-who").innerText()).includes("Mr. Neft"),
  "Part 2: the guide card is Mr. Neft's",
);
const frameEl = page.locator("iframe.gc-frame");
const frameSrc = await frameEl.getAttribute("src");
ok(
  /frame=1/.test(frameSrc) && /grades=6-8/.test(frameSrc) && /\/Reading\/A\//.test(frameSrc),
  "Part 2 frames the level A Reading activity in its grade",
);
const [coachX, frameX] = await Promise.all(
  [".gc-card", "iframe.gc-frame"].map((s) =>
    page.locator(s).evaluate((e) => e.getBoundingClientRect().left),
  ),
);
ok(coachX < frameX, `1366px: the guide card sits left of the frame (${coachX} < ${frameX})`);
ok(
  (await page.locator(".gt-trail").innerText()).includes("Reading"),
  "Part 2: the trail names the skill",
);
const inner = page.frameLocator("iframe.gc-frame");
await inner.locator("#app h1").first().waitFor({ state: "attached", timeout: 60000 });
ok(!(await inner.locator(".lab-top").isVisible()), "the lab's top bar is hidden inside the frame");
ok(
  /Step 1 of/.test(await page.locator(".gc-count").innerText()),
  "the coach card appears at step 1",
);
// Keyboard: Tab from the top of the page reaches the coach card's buttons.
await page.evaluate(() => document.activeElement?.blur());
let tabbed = false;
for (let i = 0; i < 80 && !tabbed; i++) {
  await page.keyboard.press("Tab");
  tabbed = await page.evaluate(() => Boolean(document.activeElement?.closest(".gc-card button")));
}
ok(tabbed, "keyboard Tab reaches the coach card's buttons");
await coachNext();
await coachSays(/skill lesson/, "Next moves the coach to the skill lesson step");
await page.waitForTimeout(300);
const ringOver = await page.evaluate(() => {
  const ring = document.querySelector(".gc-ring");
  const frame = document.querySelector("iframe.gc-frame");
  const el = frame?.contentDocument?.querySelector("[data-frame-ready]");
  if (!ring || ring.hidden || !el) return false;
  const r = ring.getBoundingClientRect();
  const f = frame.getBoundingClientRect();
  const t = el.getBoundingClientRect();
  const cx = f.left + t.left + t.width / 2;
  const cy = f.top + t.top + t.height / 2;
  return cx > r.left && cx < r.right && cy > r.top && cy < r.bottom;
});
ok(ringOver, "the ring sits over the real control in the activity");
await inner.locator("[data-frame-ready]").first().click();
await coachSays(
  /Directions/,
  "pressing the skill lesson's button in the activity advances the coach",
);
await inner.locator(".directions [data-say]").first().click();
await coachSays(/Choose an answer/, "Hear directions advances to Choose an answer");
// A wrong answer on purpose, to see the guidance and the second try.
await inner.locator("label.choice", { hasNotText: "save water" }).first().click();
await coachSays(/sure/, "choosing an answer advances to How sure");
await inner.locator("[data-sure]").first().click();
await coachSays(/Check the answer/, "How sure advances to Check");
await inner.locator("[data-check]").first().click();
await coachSays(/guidance students receive/, "a wrong answer shows the guidance step");
await coachNext();
await coachSays(/try again/, "after the guidance the coach shows Try again");
await inner.locator("[data-retry]").first().click();
await coachSays(/Check again/, "Try again asks to check again");
// The right answer to "Saving Water: Find the Main Idea": checking it ends the loop on success.
await inner.locator("label.choice", { hasText: "save water" }).click();
await inner.locator("[data-check]").first().click();
await coachSays(/student loop/, "a right second answer reaches the end of the loop");
ok(
  (await page.locator("[data-gc=finish]").innerText()).includes("Next: use it with your class"),
  "the last step's button is Next: use it with your class",
);
await page.locator("[data-gc=finish]").click();
await page.waitForSelector(".gt-class-card");
ok(
  /part=3/.test(path(page)) && /skill=reading/.test(path(page)),
  "the coach's finish button opens Part 3",
);

// ── Part 3: support, the class card, ready, map ──
ok(
  (await page.locator('[data-gt-support][aria-pressed="true"]').getAttribute("data-gt-support")) ===
    "A",
  "Part 3: support A is chosen by default",
);
const titleA = await page.locator("#gtCardTitle").innerText();
await page.locator('[data-gt-support="B"]').click();
await page.waitForFunction(
  () => document.querySelector('[data-gt-support="B"]')?.getAttribute("aria-pressed") === "true",
);
const titleB = await page.locator("#gtCardTitle").innerText();
ok(
  /support=B/.test(path(page)) &&
    /\/Reading\/B\//.test(await page.locator("[data-gt-link]").inputValue()) &&
    titleB.length > 2,
  `Part 3: support B updates the card ("${titleA}" -> "${titleB}") and the address`,
);
ok(
  await page.evaluate(() => document.activeElement?.matches('[data-gt-support="B"]')),
  "Part 3: focus stays on the pressed support button",
);
await page.reload();
await page.waitForSelector(".gt-class-card");
ok(
  (await page.locator('[data-gt-support="B"]').getAttribute("aria-pressed")) === "true" &&
    (await page.locator("#gtCardTitle").innerText()) === titleB,
  "reload keeps the part, the skill and the support",
);
ok(
  (await page.locator(".gt-class-card .btn-primary").count()) === 1 &&
    (await page.locator(".gt-class-card .btn-primary").innerText()).includes("Copy student link"),
  "Part 3: exactly one primary action on the class card, Copy student link",
);
ok(
  (await page.locator(".gt-start-steps > li").count()) === 3 &&
    (await page.locator(".gt-start-print a").getAttribute("href")).endsWith(".pdf"),
  "Part 3: Start tomorrow in three steps, with the quick guide PDF",
);
ok(
  await page.getByText("You’re ready to use this with students.").isVisible(),
  "Part 3: “You’re ready to use this with students.” is visible",
);
ok(
  (await page.locator(".gt-ready-go").innerText()).includes("Start using the lab"),
  "Part 3: Start using the lab",
);
ok((await page.locator(".gt-map-stops a").count()) === 7, "Part 3: the site map has seven stops");
ok(
  (await page.locator(".gt-map-more a").innerText()).includes("Open the full Site Guide"),
  "Part 3: Open the full Site Guide",
);
const link = await page.locator("[data-gt-link]").inputValue();
await page.locator("[data-gt-copy]").click();
await page
  .waitForFunction(
    () => document.querySelector("[data-gt-copy-note]")?.textContent.length > 3,
    null,
    { timeout: 5000 },
  )
  .catch(() => {});
ok(
  (await page.evaluate(() => navigator.clipboard.readText())) === link &&
    (await page.locator("[data-gt-copy-note]").innerText()).length > 3,
  "Copy student link copies the link and says so",
);
await page.locator("[data-gt-show]").click();
ok(await page.locator("[data-gt-show-dialog]").evaluate((d) => d.open), "Show QR opens the dialog");
await page.keyboard.press("Escape");
ok(
  !(await page.locator("[data-gt-show-dialog]").evaluate((d) => d.open)) &&
    (await page.evaluate(() => document.activeElement?.matches("[data-gt-show]"))),
  "Escape closes it and focus returns to the button",
);
await axe(page, "tour Part 3");
await overflow(page, "tour Part 3 1366");
const saved = JSON.parse(
  await page.evaluate(() => localStorage.getItem("accessPracticeLab:v1:intro")),
);
ok(
  saved.guided?.part === 3 &&
    saved.guided.done === true &&
    saved.guided.skill === "reading" &&
    saved.guided.support === "B",
  "the tour is saved under accessPracticeLab:v1:intro guided",
);
await page.locator("details.gt-help > summary").click();
await page.locator("[data-gt-restart]").click();
await page.waitForSelector(".gt-part-skill");
ok(/part=1/.test(path(page)), "Need help → Start the teacher tour again returns to Part 1");

// ── Part 2, speaking: hear the question, say it, check it ──
await openPart2("speaking");
await coachNext();
await passSkillLesson("speaking");
await coachSays(/Hear the question/, "speaking: the coach points at the question");
await inner.locator(".response-workspace [data-say], .directions [data-say]").first().click();
await coachSays(/starters|Say the answer/, "speaking: hearing the question moves on");
if (/starters/.test(await coachTitle())) await coachNext();
await coachSays(/Say the answer/, "speaking: the coach asks for the answer out loud");
await inner.locator("[data-rec-start]").first().click();
await coachSays(/check their own answer/, "speaking: recording moves to the self-check");
await inner.locator("[data-selfcheck]").first().click();
await coachSays(/That is a speaking turn/, "speaking: a tick reaches “That is a speaking turn”");

// ── Part 2, writing: write, check, see the feedback ──
await openPart2("writing");
await coachNext();
await passSkillLesson("writing");
await coachSays(/Directions/, "writing: the coach points at the directions");
await coachNext();
await coachSays(/Write an answer/, "writing: the coach asks for a sentence");
await inner
  .locator("textarea[data-note]")
  .first()
  .fill("Schools should save water because it helps.");
await coachSays(/Check the writing/, "writing: typing moves to Check the writing");
await inner.locator("[data-check-writing]").first().click();
await coachSays(/feedback students get/, "writing: checking shows the feedback step");

// ── 390px: the guide card docks at the bottom, nothing scrolls sideways ──
await page.setViewportSize({ width: 390, height: 844 });
await openPart2("reading");
const dock = await page.evaluate(() => {
  const card = document.querySelector(".gc-card");
  let el = card;
  while (el && getComputedStyle(el).position !== "fixed") el = el.parentElement;
  return el ? Math.abs(innerHeight - card.getBoundingClientRect().bottom) : -1;
});
ok(dock >= 0 && dock <= 24, `390px: the guide card is fixed at the bottom (${dock})`);
await overflow(page, "tour Part 2 390");
await page.setViewportSize({ width: 1280, height: 900 });

// Leave the tour part-way through, then see the start page offer to resume it.
await page.goto(`${LAB}/start/tour?part=2&grades=6-8&skill=writing`, { waitUntil: "load" });
await page.waitForSelector(".gt-part-try");
await page.locator(".gt-exit").click();
await page.waitForSelector(".lph-start");
ok(
  path(page).startsWith("/?grades=6-8") || path(page) === "/",
  "Exit tour returns to the home page",
);
ok(
  (await page.locator(".lph-start.is-teacher > .btn").innerText()).includes(
    "Continue the Teacher Tour",
  ),
  "the home card offers to continue the tour",
);
await page.goto(`${LAB}/start`, { waitUntil: "load" });
await page.waitForSelector(".in-hub");
ok((await page.locator(".in-choices a").count()) === 3, "three choices on the start page");
ok(
  (await page.locator(".in-choice.is-tour strong").innerText()).includes(
    "Resume the tour at Part 2",
  ),
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
  (await page.locator(".ts-nav a[href*='/start/present']").count()) === 0,
  "teacher nav has no presenter link",
);
ok(
  (await page.locator(".ov-progress li").count()) >= 1 &&
    (await page.locator(".ov-progress").innerText()).includes("Teacher tour: Part 2 of 3"),
  "overview: progress panel shows the saved tour",
);
// The grade picker re-renders the page in place and puts the choice in the address.
await page.locator('[data-tb-pick="2-3"]').click();
await page.waitForFunction(() => new URL(location.href).searchParams.get("grades") === "2-3");
ok(
  (await page.locator('[data-tb-pick="2-3"]').getAttribute("aria-pressed")) === "true" &&
    (await page.locator(".tb-domain").count()) === 4,
  "overview: choosing Grades 2–3 shows four domain cards for that grade",
);
ok(
  (await page.locator("#ov-more").count()) === 0,
  "overview: Grades 6–8 material hides for Grades 2–3",
);
ok(
  (await page.locator(".in-choice.is-tour").getAttribute("href")).includes("grades=2-3"),
  "overview: the tour choice carries the grade",
);
const tourCard = await page
  .locator(".tb-domain.d-reading a", { hasText: "Try it in the tour" })
  .getAttribute("href");
ok(
  /grades=2-3/.test(tourCard) && /part=2/.test(tourCard) && /skill=reading/.test(tourCard),
  "overview: the Reading card opens tour Part 2 with Reading chosen for Grades 2–3",
);
ok(
  (await page.locator(".ov-loop li").count()) === 5 &&
    (await page.locator(".ov-cancan .ov-can").count()) === 2,
  "overview: learning loop and what feedback can and cannot do",
);
ok((await page.locator(".pg").count()) === 1, "overview: Mr. Neft is on the page");
await page.locator('.pg [data-pg-quick="account"]').click();
ok(
  (await page.locator(".pg").innerText()).length > 200,
  "overview: a Mr. Neft question button answers in place",
);
for (const id of ["ov-domains", "ov-how", "ov-resources", "ov-families", "ov-share"])
  ok(
    (await page.locator(`#${id}`).count()) === 1 &&
      (await page.locator(`.ov-jump a[href$="#${id}"]`).count()) === 1,
    `overview section and jump link: ${id}`,
  );
ok(
  (await page.locator("#ov-resources .ov-res").count()) === 5,
  "overview: five resources in the library",
);
ok(
  (await page.locator("a[href*='presenter'], a[href*='/start/present']").count()) === 0,
  "overview: no presenter links",
);
await page.locator("#ov-families [data-ov-copy]").click();
ok(
  (await page.evaluate(() => navigator.clipboard.readText())) ===
    "https://thelanguagepage.com/access-practice-lab/practice-together?grades=2-3",
  "overview: Copy the family link copies the family page for the chosen grade",
);
await page.locator('.ov-jump a[href$="#ov-families"]').click();
await page.waitForTimeout(500);
ok(
  await page.locator("#ov-families").evaluate((e) => {
    const r = e.getBoundingClientRect();
    return r.top >= -5 && r.top < innerHeight;
  }),
  "overview: a jump link scrolls to its section",
);
ok((await page.locator(".in-hub").count()) === 1, "overview: jumping keeps the page");
// Grades 6–8 adds the featured lesson and the class-time routines.
await page.locator('[data-tb-pick="6-8"]').click();
await page.waitForSelector("#ov-more");
ok(
  (await page.locator("#ov-more .ov-routine").count()) === 3,
  "overview: Grades 6–8 shows three class-time routines",
);
await page.locator("#ov-lesson [data-ov-copy]").click();
ok(
  (await page.evaluate(() => navigator.clipboard.readText())).endsWith(
    "/access-practice-lab/voice/ladder/school-hallway",
  ),
  "overview: Copy student link copies the plain activity link",
);
await page.locator(".tb-domain.d-speaking a", { hasText: "Open the activity" }).click();
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
page = await open("/start/explore?grades=6-8");
ok(
  (await page.locator("[data-explore-focus]").count()) === 4,
  "the four domains are equally visible",
);
await page.locator('[data-explore-focus="writing"]').click();
await page.getByRole("link", { name: /^Next: Try one activity/ }).click();
await page.waitForSelector(".in-explore");
const names = await page.locator(".in-act h3").allInnerTexts();
ok(
  names.length === 1 && names[0].includes("Language Upgrade Lab"),
  "only the Grades 6–8 Writing activity shows",
);
await page.locator('[data-explore-switch="speaking"]').click();
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
page = await open("/start/lesson?grades=6-8");
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

// ── presenter view: taken down 2026-11-11 (Joel), the old URL shows the teacher overview ──
page = await open("/start/present?stop=1");
ok(
  (await page.locator(".in-hub").count()) === 1 &&
    (await page.locator(".in-qr, .in-slide").count()) === 0,
  "/start/present no longer shows a presenter view; it shows the teacher overview",
);
await page.close();

// ── Activity Guide ─────────────────────────────────────────────────────────
page = await open("/start/activities?grades=6-8");
ok(
  (await page.locator(".ag-card").count()) === 8,
  "Activity Guide (Grades 6–8): eight how-to cards",
);
ok(
  (await page.locator(".ag-card .ag-more").count()) === 8 &&
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
// The Teacher Tour is a focused page with its own header (no teacher nav): it opens, and Back returns.
await page.locator(".ts-nav ul a", { hasText: "Teacher Tour" }).first().click();
await page.waitForSelector(".gt-page");
ok(path(page).startsWith("/start/tour"), "teacher nav opens the Teacher Tour");
await page.goBack();
await page.waitForSelector(".ts-nav");
for (const nav of ["Explore", "Lesson", "Quick Guide", "Activity Guide", "Overview"]) {
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
ok((await page.locator("[data-ft-band]").count()) === 3, "family page: three grade choices");
await page.locator('[data-ft-band="3-5"]').click();
await page.waitForSelector('[data-ft-band="3-5"][aria-pressed="true"]');
ok(
  /step=2&grades=4-5/.test((await page.locator(".ft-go").getAttribute("href")) || ""),
  "family page: Start follows the chosen grade",
);
await page.goto(`${LAB}/practice-together?step=3&grades=4-5`);
await page.waitForSelector(".ft-next-card");
const next35 = await page.locator(".ft-next-card .btn-primary").getAttribute("href");
ok(
  /class-garden\?grades=4-5/.test(next35 || ""),
  "family page: grades 3–5 continue to that band's talk activity",
);
const dest = await landingView(next35);
ok(dest.includes("Our Class Garden"), "family page: the grades 3–5 talk activity opens");
await page.goto(`${LAB}/practice-together`);
await page.waitForSelector(".ft-page");
await page.locator('[data-ft-band="k-2"]').click();
await page.waitForSelector('[data-ft-band="k-2"][aria-pressed="true"]');
await page.reload();
await page.waitForSelector(".ft-page");
ok(
  (await page.locator('[data-ft-band="k-2"]').getAttribute("aria-pressed")) === "true",
  "family page: the grade choice is remembered on this device",
);
await page.locator('[data-ft-band="6-8"]').click();
await page.waitForSelector('[data-ft-band="6-8"][aria-pressed="true"]');
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
    "Practicar inglés juntos",
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
  "/start/tour?part=3&grades=6-8&skill=writing&support=A",
  "/start/tour?part=4&grades=6-8&skill=writing",
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

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
// Audience doors (2026-11-17 navigation redesign): Teacher, Student and Family doors replace the "I am a…" switch.
// No door opens a tour: the Teacher door opens the Teacher Hub, the Family door the family start page, and the
// Teacher start page (/start, in More) offers the tour among other choices.
ok(
  (await page.locator(".lpa-doors .lpa-door").count()) === 4,
  "home shows the four audience doors",
);
ok(
  (await page.locator(".lpa-door.is-teacher").innerText()).includes("Teacher"),
  "teacher door label",
);
ok(
  ((await page.locator(".lpa-door.is-family").getAttribute("href")) || "").startsWith(
    "/access-practice-lab/family-start",
  ),
  "family door opens the family start page",
);
ok(
  (await page.locator(".lpa-door.is-teacher").getAttribute("href")) ===
    "/access-teacher/?role=classroom" &&
    (await page.locator(".lpa-door.is-esol").getAttribute("href")) === "/access-teacher/?role=esol",
  "classroom and ESOL teacher doors open the Teacher Hub in their role's view",
);
const topY = await page
  .locator(".lpa-door.is-teacher")
  .evaluate((e) => e.getBoundingClientRect().top);
ok(topY < 600, `the doors sit near the top of the home (top ${Math.round(topY)}px)`);
ok(
  (await page.locator(".lab-tools a.top-aud-families").innerText()).includes("Families"),
  "Families in the main navigation",
);
ok(
  (await page.locator("footer.lab-footer a[href*='/site-guide']").count()) === 1,
  "Site Guide in the footer",
);
await axe(page, "home");
await page.goto(`${LAB}/start?grades=6-8`, { waitUntil: "load" });
await page.locator(".in-choice.is-tour").click();
await page.waitForSelector(".t2-cards");
ok(
  path(page).startsWith("/start/tour") && /grades=/.test(path(page)),
  "the start page's tour choice opens the Teacher Tour in the chosen grades",
);
ok((await page.locator(".t2-card").count()) >= 4, "Tour 2 renders the activity preview cards");
await page.locator('[data-t2="next"]').click();
await page.waitForSelector('[data-t2-root][data-step="experience"]');
await page.goto(`${LAB}/start`, { waitUntil: "load" });
await page.waitForSelector(".in-hub");
ok((await page.locator(".in-choices a").count()) === 3, "three choices on the start page");
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
    (await page.locator(".ov-progress").innerText()).includes("Teacher Tour:"),
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
if (await page.locator("#ov-more.is-folded").count()) {
  await page.locator("#ov-more .fold-toggle").click();
}
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
await page.waitForSelector("[data-t2-root]");
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

// ── Family Tour redirect (retired Practice Together) ─────────────────────────
page = await context.newPage();
await page.goto(`${LAB}/practice-together`, { waitUntil: "load" });
await page.waitForURL(/\/access-practice-lab\/family-tour\//);
ok(
  page.url().includes("/access-practice-lab/family-tour/"),
  "retired /practice-together redirects to the Family Tour",
);
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
await page.waitForFunction(() =>
  /Soy docente/.test(document.querySelector(".lpa-door.is-teacher")?.textContent || ""),
);
ok(
  (await page.locator(".lpa-door.is-family").innerText()).includes("familia"),
  "Spanish family door",
);
ok(
  (await page.locator(".lpa-door.is-teacher").innerText()).includes("docente"),
  "Spanish teacher door",
);
await page.locator(".lang-btn[data-lang-mode='en']").first().click();
let reached = false;
for (let i = 0; i < 60 && !reached; i++) {
  await page.keyboard.press("Tab");
  reached = await page.evaluate(() => document.activeElement?.matches(".lpa-door.is-teacher"));
}
ok(reached, "keyboard Tab reaches the Teacher door");
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

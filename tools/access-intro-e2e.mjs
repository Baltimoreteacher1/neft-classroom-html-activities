#!/usr/bin/env node
/**
 * The teacher introduction in a real browser: home cards -> guided tour -> activity -> return -> resume; exploration
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
ok((await page.locator(".tr-steps li").count()) === 6, "the tour has six steps");
ok((await page.locator(".tb-pick").count()) === 5, "five grade choices");

// ── guided tour: grade choice, live activity, checklist, Mr. Neft ─────────
await page.locator('[data-tb-pick="2-3"]').click();
await page.waitForFunction(() => location.search.includes("grades=2-3"));
ok(
  (await page.locator('[data-tb-pick="2-3"]').getAttribute("aria-pressed")) === "true" &&
    (await page.locator(".tb-domain").count()) === 4 &&
    (await page.locator(".tb-domains").innerText()).includes("Who Waters the Garden?"),
  "choosing Grades 2–3 shows that grade's four domain activities",
);
await page.getByRole("link", { name: /^Start with Listening/ }).click();
await page.waitForSelector(".tr-work");
ok((await heading(page)) === "Listening", "Start with Listening opens the Listening step");
await page.locator("[data-tr-launch]").click();
const frameEl = page.locator("iframe.tr-frame");
await frameEl.waitFor();
const frameSrc = await frameEl.getAttribute("src");
ok(
  /frame=1/.test(frameSrc) && /grades=2-3/.test(frameSrc),
  "the live panel opens the activity in its grade",
);
const inner = page.frameLocator("iframe.tr-frame");
await inner.locator("#app h1").waitFor();
ok(
  (await inner.locator("#app h1").innerText()).includes("Who Waters the Garden?"),
  "the real activity runs in the panel",
);
ok(!(await inner.locator(".lab-top").isVisible()), "the lab's top bar is hidden inside the panel");
await inner.getByRole("button", { name: "Hear the story again" }).click();
await page
  .waitForFunction(() => document.querySelector('[data-tr-tick="0"]')?.checked, null, {
    timeout: 5000,
  })
  .catch(() => {});
ok(
  (await page.locator('[data-tr-tick="0"]').isChecked()) &&
    (await page.locator("[data-tr-count]").innerText()).startsWith("Step 1 ticked for you"),
  "pressing the button step 1 names inside the activity ticks step 1 and says so",
);
await page.locator('[data-tr-tick="0"]').uncheck();
ok(
  !(await page.locator('[data-tr-tick="0"]').isChecked()),
  "an automatic tick can still be undone by hand",
);
await frameEl.evaluate((f) => {
  f.dataset.marker = "kept";
});
for (let i = 0; i < 3; i++) await page.locator(`[data-tr-tick="${i}"]`).check();
ok(
  (await page.locator("[data-tr-count]").innerText()).startsWith("All three done") &&
    (await page.locator('[data-tr-stop="listening"]').getAttribute("class")).includes("is-done"),
  "ticking all three steps marks Listening done",
);
ok(
  (await frameEl.getAttribute("data-marker")) === "kept",
  "ticking never reloads the live activity",
);
await page.locator('input[name="tour-listening-support"][value="replay"]').check();
await page.locator("#tour-listening-use").fill("Center rotation with headphones.");
await page.locator('[data-pg-quick="students"]').click();
ok(
  (await page.locator(".pg-thread").innerText()).includes("Students listen to a short story"),
  "Mr. Neft answers a quick question from the activity's own description",
);
await page.locator("#pgQuestion").fill("microphone");
await page.locator("[data-pg-form] button[type=submit]").click();
await page.waitForFunction(() => !document.querySelector(".pg-a.is-pending"));
ok(
  (await page.locator(".pg-thread .pg-turn").first().innerText()).match(/Site Guide/),
  "with no AI helper, a typed question falls back to the Site Guide",
);
await page.getByRole("link", { name: /Open full screen/ }).click();
await page.waitForSelector("#introReturn");
ok(
  path(page).startsWith("/Listening/A/g23-l-a-garden-helper") && path(page).includes("intro=tour"),
  "Open full screen opens the activity in the same tab with a return hint",
);
ok(
  (await page.locator("#introReturn a").innerText()).includes("Back to the Teacher Tour"),
  "return bar names the tour",
);
await page.locator("#introReturn a").click();
await page.waitForSelector(".tr-work");
ok((await heading(page)) === "Listening", "returning lands on the same tour step");
ok((await page.locator("#introReturn").count()) === 0, "the return bar goes away on the tour");
ok(
  (await page.locator('[data-tr-tick="2"]').isChecked()) &&
    (await page.locator('input[name="tour-listening-support"][value="replay"]').isChecked()) &&
    (await page.locator("#tour-listening-use").inputValue()).length > 10,
  "ticks and notes survived the round trip",
);
await page.reload();
await page.waitForSelector(".tr-work");
ok((await heading(page)) === "Listening", "reload resumes the tour on this device");
await axe(page, "tour Listening step");
await overflow(page, "tour 1280");
const tourState = JSON.parse(
  await page.evaluate(() => localStorage.getItem("accessPracticeLab:v1:intro")),
);
ok(
  tourState.tour.tried.listening === true &&
    tourState.tour.ticks["2-3:listening"].every(Boolean) &&
    tourState.tour.notes["listening-support"] === "replay",
  "saved under accessPracticeLab:v1:intro",
);
for (let i = 0; i < 4; i++) await page.getByRole("link", { name: /^Next:/ }).click();
await page.waitForSelector(".tr-plan");
await page.locator('input[name="tour-pick"][value="listening"]').check();
await page.waitForSelector(".tr-plan-act");
ok(
  (await page.locator(".tr-plan-act").innerText()).includes("Who Waters the Garden?"),
  "the plan names the chosen activity",
);
ok(
  (await page.locator(".tr-plan-link svg[role=img]").getAttribute("aria-label")).includes(
    "Who Waters the Garden?",
  ),
  "the plan card shows a named QR code for the student link",
);
const mailHref = await page.locator("[data-tr-email]").getAttribute("href");
ok(
  mailHref.startsWith("mailto:?subject=") &&
    decodeURIComponent(mailHref).includes("Activity: Who Waters the Garden?"),
  "Email it to myself is a mailto: with no address and the plan in the body",
);
ok(
  (await page.locator("[data-tr-assign]").getAttribute("href")).endsWith(
    "/launch-studio?grades=2-3",
  ) && (await page.locator(".tr-assign").innerText()).includes("“Who Waters the Garden?”"),
  "Assign to my class links the Launch Studio and names the activity to choose",
);
{
  const studio = await open("/launch-studio?grades=2-3");
  await studio.locator('[data-launch-field="domain"]').selectOption("Listening");
  await studio.waitForTimeout(300);
  ok(
    (await studio.locator('[data-launch-field="selected"] option').allInnerTexts()).some((t) =>
      t.startsWith("Who Waters the Garden?"),
    ),
    "the Launch Studio lists the tour's activity under Listening for Grades 2–3",
  );
  await studio.close();
}
await page.locator("[data-tr-show]").click();
ok(
  await page.locator("[data-tr-show-dialog]").evaluate((d) => d.open),
  "Show to the class opens the full-screen view",
);
await page.keyboard.press("Escape");
ok(
  !(await page.locator("[data-tr-show-dialog]").evaluate((d) => d.open)) &&
    (await page.evaluate(() => document.activeElement?.matches("[data-tr-show]"))),
  "Escape closes it and focus returns to the button",
);
await page.evaluate(() => {
  window.print = () => {};
});
await page.locator("[data-tr-print]").click();
await page.emulateMedia({ media: "print" });
ok(
  (await page.locator(".tr-plan-card").isVisible()) &&
    (await page.locator(".tr-plan-link > svg").isVisible()) &&
    (await page.locator(".tr-plan-url").isVisible()) &&
    !(await page.locator(".tr-next").isVisible()) &&
    !(await page.locator(".ts-band").isVisible()) &&
    !(await page.locator(".tr-plan-card [data-tr-copy]").first().isVisible()),
  "Print my plan prints only the plan card, with its link and QR code",
);
await page.emulateMedia({ media: "screen" });
await page.evaluate(() => document.documentElement.classList.remove("tr-print-plan"));
await page.locator('[data-tr-copy="link"]').click();
await page
  .waitForFunction(
    () => document.querySelector("[data-tr-copy-note]")?.textContent.length > 5,
    null,
    { timeout: 5000 },
  )
  .catch(() => {});
ok(
  (await page.locator("[data-tr-copy-note]").innerText()).length > 5,
  "copying the student link is announced",
);
ok((await page.locator("[data-tour-finish]").count()) === 1, "the last step offers Finish");
await axe(page, "tour plan step");
await page.getByRole("link", { name: "Exit" }).click();
await page.waitForSelector(".in-hub");
ok((await page.locator(".in-hub").count()) === 1, "Exit returns to the teacher start page");
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
  (await page.locator(".ts-nav a[href*='/start/present']").count()) === 0,
  "teacher nav has no presenter link",
);
ok(
  (await page.locator(".ov-progress li").count()) >= 1 &&
    (await page.locator(".ov-progress").innerText()).includes("Guided Tour: Step 6 of 6"),
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
  /grades=2-3/.test(tourCard) && /stop=4/.test(tourCard),
  "overview: the Reading card opens tour stop 4 for Grades 2–3",
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
for (const nav of [
  "Guided Tour",
  "Explore",
  "Lesson",
  "Quick Guide",
  "Activity Guide",
  "Overview",
]) {
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
    /\/Speaking\/A\/gk-s-a-garden-see\?grades=K/.test(
      await page.locator(".tg-start").getAttribute("href"),
    ) &&
    (await page.locator('a[href*="/early?grades=K"]').count()) >= 1,
  "family page: grades K–2 get one picture-talk routine and a link to the early learners home",
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

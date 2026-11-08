// Teacher, family and fact-fluency tools in a real browser, driven the way a teacher and a learner drive them.
// Each block covers one feature; all run at phone and desktop width with a clean console.
// TOOLS_SHOTS=/tmp/dir saves screenshots.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { createServer } from "vite";
import { REPO_ROOT } from "../../tools/lib/curriculum-source.mjs";

const shots = process.env.TOOLS_SHOTS;
if (shots) mkdirSync(shots, { recursive: true });

const server = await createServer({ root: REPO_ROOT, logLevel: "error", server: { host: "127.0.0.1", port: 0 } });
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  if (browser) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await context.addInitScript(() => {
      window.__spoken = [];
      window.print = () => {
        window.__printed = (window.__printed || 0) + 1;
      };
      if (window.speechSynthesis) window.speechSynthesis.speak = (u) => window.__spoken.push(u.text);
    });
    const page = await context.newPage();
    const problems = [];
    page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (message.type() === "error" && !/Failed to load resource/.test(message.text()))
        problems.push(`console: ${message.text()}`);
    });
    const shot = async (name) => shots && page.screenshot({ path: `${shots}/${name}.png`, fullPage: false });
    const noOverflow = async (label) =>
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), 0, `no sideways scroll: ${label}`);

    // ---- #3 accommodation profile: teacher builds it, learner gets it only during the assignment ----
    await page.goto(`${base}/math/fluency-lab/?view=teacher&grade=4`, { waitUntil: "networkidle" });
    const form = page.locator("#teacher-4 [data-t4-form]");
    await form.waitFor();
    await form.locator("[name=grade]").selectOption("4");
    await form.locator("[name=skill]").first().check();
    await form.locator("[name=access-read]").check();
    await form.locator("[name=access-es]").check();
    await form.locator("[name=access-focus]").check();
    await form.locator("[name=access-calc]").check();
    await form.locator("[name=access-mc]").selectOption("2");
    await form.locator("button[type=submit]").click();
    const share = page.locator("#teacher-4 .t4-share");
    await share.waitFor();
    assert.equal(await share.locator("#t4-code").count(), 0, "a profile is shared by link, not class code");
    const fullHref = await share.locator("#t4-full").inputValue();
    assert.match(fullHref, /%7Carsfc2$|\|arsfc2$/);
    assert.match(await page.locator("#teacher-4 .t4-item").first().innerText(), /Read aloud · Spanish shown · 2 answer choices · Focus view · Calculator/);
    await shot("3-access-teacher");

    const learnerUrl = new URL(fullHref);
    await page.goto(`${base}/math/fluency-lab/${learnerUrl.search}${learnerUrl.hash}`, { waitUntil: "networkidle" });
    const banner = page.locator("#assignment-banner");
    await banner.locator(".fl-access-chips").waitFor();
    assert.equal(await banner.locator(".fl-access-chips li").count(), 5);
    assert.equal(await page.evaluate(() => document.body.classList.contains("focus-mode")), false, "nothing applies before the practice starts");
    await banner.locator("[data-start-assignment]").click();
    await page.locator(".fl-access-calc").waitFor();
    assert.equal(await page.evaluate(() => document.body.classList.contains("focus-mode")), true);
    assert.ok((await page.evaluate(() => window.__spoken.length)) >= 1, "the problem is read aloud");
    const peekOpen = await page.evaluate(() => document.querySelector("#problem-language-support .lang-peek")?.open ?? null);
    assert.ok(peekOpen === true || peekOpen === null, "the Spanish version is open when there is one");
    await page.locator(".fl-access-calc summary").click();
    await page.locator("[data-calc-input]").fill("12×3+4");
    await page.locator("[data-calc-eq]").click();
    assert.equal(await page.locator("[data-calc-out]").innerText(), "= 40");
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-settings-v1") || "{}").focus ?? false), false, "the learner's own Focus setting is untouched");
    await page.setViewportSize({ width: 375, height: 800 });
    await noOverflow("assignment with calculator at 375px");
    await shot("3-access-learner-375");
    await page.setViewportSize({ width: 1280, height: 900 });

    // ---- #18 worked-example policy per assignment, audio-first toggle, "viewed example" flag ----
    await page.goto(`${base}/math/fluency-lab/?view=teacher&grade=3`, { waitUntil: "networkidle" });
    const supportForm = page.locator("#teacher-4 [data-t4-form]");
    await supportForm.waitFor();
    await supportForm.locator("[name=grade]").selectOption("3");
    await supportForm.locator("[name=skill]").first().check();
    await supportForm.locator("[name=audioFirst]").check();
    await supportForm.locator("[name=example]").selectOption("hide");
    await supportForm.locator("button[type=submit]").click();
    await page.locator("#teacher-4 .t4-share").waitFor();
    assert.match(await page.locator("#teacher-4 .t4-share #t4-full").inputValue(), /\.u\.wh$|\.wh\.u$|\|u\.wh$/);
    assert.match(await page.locator("#teacher-4 .t4-item").first().innerText(), /Audio first · No worked example/);
    const missFirst = async () => {
      await page.locator("[data-start-assignment]").click();
      await page.locator("#answer-input").fill("99999");
      await page.locator("#check-answer").click();
    };
    const policyLink = (ext) => `${base}/math/fluency-lab/#assignment=${encodeURIComponent(`ewl1|3|5|a|a||3:mul-0-5||${ext}`)}`;
    await page.evaluate(() => localStorage.removeItem("ewl-fluency-tutor-v2"));
    await page.goto(policyLink("wh"), { waitUntil: "networkidle" });
    await missFirst();
    await page.locator("#feedback:not([hidden])").waitFor();
    assert.equal(await page.locator("[data-feedback-action='worked']").count(), 0, "a worked example is never offered");
    await page.goto(policyLink("wa"), { waitUntil: "networkidle" });
    await missFirst();
    await page.locator("[data-feedback-action='worked']").click();
    await page.locator("#guided-coach:not([hidden]) li").first().waitFor();
    const rightAnswer = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-tutor-v2")).mistakes.at(-1).expectedAnswer);
    await page.locator("#answer-input").fill(rightAnswer);
    await page.locator("#check-answer").click();
    await page.locator("#next-problem:not([hidden])").waitFor();
    const flagged = await page.evaluate(() => {
      const recent = Object.values(JSON.parse(localStorage.getItem("ewl-fluency-tutor-v2") || "{}").records || {}).flatMap((r) => r.recent);
      return recent.length > 0 && recent.at(-1).ex === 1;
    });
    assert.equal(flagged, true, "opening the example is recorded on the answer");
    await shot("18-worked-example-policy");

    // ---- #29 teacher video for a skill: teacher adds, learner sees it in the Learn panel ----
    await page.goto(`${base}/math/fluency-lab/?view=teacher&grade=3`, { waitUntil: "networkidle" });
    await page.locator("#t4-tab-tools").click();
    const videoForm = page.locator("[data-tt-video]");
    await videoForm.locator("[name=en]").fill("http://not-secure.example.com/v");
    await videoForm.locator("button[type=submit]").click();
    assert.match(await page.locator("[data-tt-video] .t4-error").innerText(), /https/);
    await videoForm.locator("[name=skill]").selectOption("3:mul-0-5");
    await videoForm.locator("[name=en]").fill("https://videos.example.com/times-tables");
    await videoForm.locator("[name=es]").fill("https://videos.example.com/tablas");
    await videoForm.locator("button[type=submit]").click();
    const videoLink = await page.locator("#tt-video-link").inputValue();
    assert.match(videoLink, /#videos=v1\./);
    await shot("29-video-tool");
    await page.goto(`${base}/math/fluency-lab/?grade=3&skill=mul-0-5${new URL(videoLink).hash}`, { waitUntil: "networkidle" });
    await page.locator(".learn-support > summary").click();
    const slot = page.locator("[data-skill-video]");
    await slot.waitFor();
    assert.deepEqual(await slot.locator("a").evaluateAll((links) => links.map((a) => a.href)), ["https://videos.example.com/times-tables", "https://videos.example.com/tablas"]);
    assert.equal(await slot.locator("a").first().getAttribute("rel"), "noopener noreferrer");
    await page.evaluate(() => localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify("es")));
    await page.reload({ waitUntil: "networkidle" });
    await page.locator(".learn-support > summary").click();
    assert.match(await page.locator("[data-skill-video]").innerText(), /El video de tu maestro/);
    assert.equal(await page.locator("[data-skill-video] a").first().getAttribute("lang"), "es", "Spanish link first in Spanish");
    await page.evaluate(() => localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify("en")));
    await shot("29-video-learn");
    await page.goto(`${base}/math/fluency-lab/?grade=3&skill=mul-6-9`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("[data-skill-video]").count(), 0, "a skill with no video shows no slot");

    // ---- #17 family letter, home-access cards, class fact poster ----
    await page.goto(`${base}/math/fluency-lab/?view=teacher&grade=4`, { waitUntil: "networkidle" });
    await page.locator("#t4-tab-tools").click();
    const printForm = page.locator("[data-tt-print]");
    await printForm.locator("[name=teacher]").fill("Ms. Rivera");
    const printedBefore = await page.evaluate(() => window.__printed || 0);
    await page.locator("[data-tt-print-kind=letter]").click();
    assert.equal(await page.locator("#print-sheet .fl-letter").count(), 2, "English and Spanish letters");
    assert.match(await page.locator("#print-sheet .fl-letter").first().innerText(), /Ms\. Rivera/);
    assert.equal(await page.locator("#print-sheet .fl-letter svg[role=img]").count(), 2);
    await page.locator("[data-tt-print-kind=cards]").click();
    assert.equal(await page.locator("#print-sheet .fl-card").count(), 8);
    await printForm.locator("[name=lang]").selectOption("es");
    await page.locator("[data-tt-print-kind=poster]").click();
    assert.equal(await page.locator("#print-sheet .fl-poster").count(), 1);
    assert.match(await page.locator("#print-sheet .fl-poster h1").innerText(), /Nuestro muro/);
    assert.ok((await page.evaluate(() => window.__printed || 0)) - printedBefore >= 3, "each button opens the print dialog");
    if (shots) {
      await page.emulateMedia({ media: "print" });
      await page.pdf({ path: `${shots}/17-poster.pdf`, preferCSSPageSize: true });
      await page.emulateMedia({ media: "screen" });
    }

    // ---- #16 story of the day on the family home ----
    await page.goto(`${base}/math/fluency-lab/family/?grade=4`, { waitUntil: "networkidle" });
    const storyBox = page.locator("[data-testid=story-of-day]");
    await storyBox.waitFor();
    const onTrack = await storyBox.locator("[data-testid=story-text]").innerText();
    assert.ok(onTrack.length > 20);
    await storyBox.locator("[data-story-level=stretch]").click();
    assert.equal(await storyBox.locator("[data-story-level=stretch]").getAttribute("aria-pressed"), "true");
    assert.notEqual(await storyBox.locator("[data-testid=story-text]").innerText(), onTrack, "another level, another story");
    assert.equal(await storyBox.locator("[data-testid=story-answer]").isVisible(), false, "the answer waits behind Check");
    await storyBox.locator("summary").click();
    assert.match(await storyBox.locator("[data-testid=story-answer]").innerText(), /The answer is /);
    await page.locator("#lang-toggle").click();
    assert.match(await storyBox.locator("h2, #story-title").first().innerText(), /Problema del día/);
    assert.match(await storyBox.locator("[data-testid=story-answer]").innerText(), /La respuesta es|^$/);
    assert.equal(await storyBox.locator("[data-story-level=stretch]").getAttribute("aria-pressed"), "true", "the level survives the language change");
    await page.setViewportSize({ width: 375, height: 800 });
    await noOverflow("family story at 375px");
    await shot("16-family-story-375");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify("en")));

    // ---- #12 Unit Check: mixed, independent first tries, confirms skills, one per unit per day ----
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) if (/unitchecks|session-v2|tutor-v2/.test(key)) localStorage.removeItem(key);
    });
    await page.goto(`${base}/math/fluency-lab/?view=practice&grade=6`, { waitUntil: "networkidle" });
    const unitPanel = page.locator(".unit-check");
    await unitPanel.waitFor();
    assert.equal(await unitPanel.locator("[data-start-unit]").count(), 8);
    await page.goto(`${base}/math/fluency-lab/?view=practice&grade=5`, { waitUntil: "networkidle" });
    assert.equal(await page.locator(".unit-check").count(), 0, "Grade 6 only");
    await page.goto(`${base}/math/fluency-lab/?view=practice&grade=6`, { waitUntil: "networkidle" });
    await page.locator("[data-start-unit=g6-u3]").click();
    await page.locator("#problem-number").waitFor();
    assert.match(await page.locator("#problem-number").innerText(), /of 4/, "two problems for each of two skills");
    assert.equal(await page.locator("#guided-coach").isHidden(), true, "no steps before the answer");
    const seenSkills = new Set();
    const seen = {};
    for (let step = 0; step < 4; step += 1) {
      const item = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-session-v2")).item);
      seenSkills.add(item.skill.id);
      // Skill "ratios" is answered right every time; the first "unit-rates" problem is answered wrong.
      seen[item.skill.id] = (seen[item.skill.id] || 0) + 1;
      const wrong = item.skill.id === "unit-rates" && seen[item.skill.id] === 1;
      if (item.choices) {
        const label = wrong ? item.choices.find((c) => !item.answers.includes(c)) : item.answers[0];
        await page.locator("#choice-answers button", { hasText: label }).first().click();
      } else {
        await page.locator("#answer-input").fill(wrong ? "999999" : String(item.answers[0]));
        await page.locator("#check-answer").click();
      }
      if (await page.locator("#next-problem").isVisible()) await page.locator("#next-problem").click();
      else if (await page.locator("[data-feedback-action='try-again']").count()) {
        await page.locator("#answer-input").fill(String(item.answers[0]));
        await page.locator("#check-answer").click();
        await page.locator("#next-problem").click();
      }
    }
    await page.locator("#session-summary:not([hidden])").waitFor();
    assert.deepEqual([...seenSkills].sort(), ["ratios", "unit-rates"], "the check mixes the unit's skills");
    assert.match(await page.locator("#summary-title").innerText(), /Unit 3 Check/);
    const confirmedRows = await page.locator("#summary-stats [data-confirmed=true]").evaluateAll((rows) => rows.map((row) => row.dataset.unitSkill));
    assert.ok(confirmedRows.includes("6:ratios"), "a skill answered right every time is confirmed");
    assert.equal(await page.locator("#summary-stats [data-unit-skill='6:unit-rates'][data-confirmed=true]").count(), 0, "a skill with a miss is not confirmed");
    assert.equal(await page.locator("#reset-session").first().isHidden().catch(() => true), true, "no instant retake");
    await shot("12-unit-check-summary");
    await page.goto(`${base}/math/fluency-lab/?view=practice&grade=6`, { waitUntil: "networkidle" });
    assert.equal(await page.locator("[data-start-unit=g6-u3]").getAttribute("aria-disabled"), "true", "one check per unit per day");
    await page.locator("[data-start-unit=g6-u3]").click({ force: true });
    assert.equal(await page.locator("#session-summary").isHidden(), true);
    assert.match(await page.locator("[data-start-unit=g6-u3]").innerText(), /1 of 2 skills confirmed|Checked today/);

    // ---- #15 unit warm-ups ----
    await page.goto(`${base}/math/fluency-lab/?view=teacher&grade=6`, { waitUntil: "networkidle" });
    await page.locator("#t4-tab-tools").click();
    const warmForm = page.locator("[data-tt-warm]");
    await warmForm.locator("[name=unit]").selectOption("g6-u6");
    await warmForm.locator("[name=format]").selectOption("match");
    await page.locator("[data-tt-warm-print]").click();
    assert.equal(await page.locator("#print-sheet .fl-warmup-card").count(), 16);
    await page.locator("[data-tt-warm-new]").click();
    await warmForm.locator("[name=format]").selectOption("pair");
    await warmForm.locator("[name=lang]").selectOption("both");
    await page.locator("[data-tt-warm-print]").click();
    assert.equal(await page.locator("#print-sheet .fl-warmup").count(), 2, "English and Spanish pages");
    assert.match(await page.locator("#print-sheet .fl-warmup").nth(1).innerText(), /Comparar en pareja/);

    // ---- #13 shareable board: set it up, share the link, the state is in the URL ----
    await page.goto(`${base}/math/fluency-lab/?view=models&grade=6`, { waitUntil: "networkidle" });
    await page.locator(".e8ml-workspace [data-e8-control]").first().waitFor();
    const controls = page.locator(".e8ml-workspace [data-e8-control]:not([disabled])");
    for (let i = 0; i < 2; i += 1) await controls.nth(1).click();
    const boardText = await page.locator(".e8ml-workspace").innerText();
    await page.locator("[data-board-share]").click();
    const boardLink = await page.locator("[data-board-link]").inputValue();
    assert.match(boardLink, /\?view=models&grade=6#board=b1\./);
    const { boardFromHash } = await import("./board-link.js");
    assert.ok(boardFromHash(new URL(boardLink).hash).moves.length >= 1, "the moves are in the link");
    await page.goto(`${base}/math/fluency-lab/${new URL(boardLink).search}${new URL(boardLink).hash}`, { waitUntil: "networkidle" });
    await page.locator(".e8ml-workspace [data-e8-control]").first().waitFor();
    assert.equal(await page.locator(".e8ml-workspace").innerText(), boardText, "the shared board looks the same");
    await page.goto(`${base}/math/fluency-lab/?view=models&grade=6#board=b1.not-a-board`, { waitUntil: "networkidle" });
    await page.locator(".e8ml-workspace [data-e8-control]").first().waitFor();
    await page.setViewportSize({ width: 375, height: 800 });
    await noOverflow("model lab share at 375px");
    await page.setViewportSize({ width: 1280, height: 900 });

    // ---- #19 student-written problems: a student writes, the teacher pastes and approves, Team Relay plays them ----
    await page.evaluate(() => localStorage.removeItem("ewl-fluency-relay-deck-v1"));
    await page.goto(`${base}/math/fluency-lab/?view=games&grade=3`, { waitUntil: "networkidle" });
    await page.locator('[data-game="teamrelay"]').click();
    await page.locator(".sp-write summary").click();
    await page.locator("[data-sp-write] [name=question]").fill("Mia has 6 bags with 7 marbles in each bag. How many marbles in all?");
    await page.locator("[data-sp-write] button[type=submit]").click();
    assert.equal(await page.locator("[data-sp-code]").inputValue(), "", "no code without an answer");
    assert.match(await page.locator("[data-sp-error]").innerText(), /at least 8 characters/);
    await page.locator("[data-sp-write] [name=answer]").fill("42");
    await page.locator("[data-sp-write] button[type=submit]").click();
    const studentCode = await page.locator("[data-sp-code]").inputValue();
    assert.match(studentCode, /^SP1\./);
    await page.locator(".sp-deck summary").click();
    await page.locator("[data-sp-add] [name=codes]").fill(`${studentCode}\nnot-a-code`);
    await page.locator("[data-sp-add] button[type=submit]").click();
    assert.match(await page.locator("[data-sp-note]").innerText(), /1 added, 1 skipped/);
    assert.match(await page.locator(".sp-check").first().innerText(), /Read it and solve it/);
    assert.equal(await page.locator("[data-sp-approve]").first().isChecked(), false, "unapproved by default");
    await page.locator("input[name=teams][value='2']").check();
    await page.locator("[data-team-form] button[type=submit]").click();
    assert.doesNotMatch(await page.locator(".gm-q").innerText(), /Mia has 6 bags/, "an unapproved problem never appears");
    await page.goto(`${base}/math/fluency-lab/?view=games&grade=3`, { waitUntil: "networkidle" });
    await page.locator('[data-game="teamrelay"]').click();
    await page.locator(".sp-deck summary").click();
    await page.locator("[data-sp-approve]").first().check();
    assert.match(await page.locator("[data-sp-note]").innerText(), /1 approved/);
    await page.locator("[data-team-form] button[type=submit]").click();
    assert.match(await page.locator(".gm-q").innerText(), /Mia has 6 bags/, "the approved problem comes first");
    await page.locator("#gm-input").fill("42");
    await page.locator("form.gm-ask-form [type=submit]").first().click();
    await page.locator(".gm-note.fb-copy", { hasText: "Great teamwork!" }).waitFor();
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto(`${base}/math/fluency-lab/?view=games&grade=3`, { waitUntil: "networkidle" });
    await page.locator('[data-game="teamrelay"]').click();
    await page.locator(".sp-deck summary").click();
    await noOverflow("team relay student problems at 375px");
    await shot("19-team-relay-student-problems");
    await page.setViewportSize({ width: 1280, height: 900 });

    // ---- #20 Lighthouse Campaign: chapter 1 is current, a confirmed unit finishes its chapter ----
    await page.evaluate(() => localStorage.removeItem("ewl-fluency-unitchecks-v1"));
    await page.goto(`${base}/math/fluency-lab/?view=practice&grade=6`, { waitUntil: "networkidle" });
    const campaign = page.locator(".campaign");
    await campaign.waitFor();
    assert.equal(await campaign.locator("[data-status=current]").count(), 1);
    assert.match(await campaign.locator("[data-status=current]").innerText(), /The Signal Log/);
    assert.equal(await campaign.locator("[data-status=later]").count(), 7);
    await page.evaluate(() => {
      localStorage.setItem("ewl-fluency-unitchecks-v1", JSON.stringify({ "g6-u2": { day: "2026-11-06", count: 1, at: Date.now(), confirmed: ["5:divide-whole", "6:decimal-ops"] } }));
    });
    await page.reload({ waitUntil: "networkidle" });
    assert.match(await page.locator(".campaign [data-status=done]").innerText(), /ships pass at dusk/);
    assert.match(await page.locator(".campaign [data-status=current]").innerText(), /Mixing the Paint/);
    await page.locator(".campaign [data-status=current] a", { hasText: "Learn" }).first().click();
    await page.waitForURL(/grade=6&skill=/);
    assert.ok((await page.locator("#learn-panel, .learn-simple").count()) >= 1, "Learn opens the skill's teaching");
    await page.evaluate(() => localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify("es")));
    await page.goto(`${base}/math/fluency-lab/?view=practice&grade=6`, { waitUntil: "networkidle" });
    assert.match(await page.locator(".campaign h3").innerText(), /La campaña del faro/);
    await page.setViewportSize({ width: 375, height: 800 });
    await noOverflow("campaign at 375px");
    await shot("20-campaign-375");
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => {
      localStorage.setItem("ewl-fluency-lang-v1", JSON.stringify("en"));
      localStorage.removeItem("ewl-fluency-unitchecks-v1");
    });

    // ---- #14 fact plan link from Class tools, #7 introduce-then-practice, #6 one-tap note ----
    await page.goto(`${base}/math/fluency-lab/?view=teacher&grade=3`, { waitUntil: "networkidle" });
    await page.locator("#t4-tab-tools").click();
    const planForm = page.locator("[data-tt-plan]");
    await planForm.locator("input[value=add]").check();
    await planForm.locator("[name=count]").selectOption("5");
    const planLink = await page.locator("#tt-plan-link").inputValue();
    assert.match(planLink, /#factplan=fp1\.amd\.5$/);
    assert.equal(await page.locator("#t4-panel-tools svg[role=img]").count(), 1, "the plan link fits a QR code");
    await shot("14-fact-plan");
    await page.goto(`${base}/math/fluency-lab/?grade=3${new URL(planLink).hash}`, { waitUntil: "networkidle" });
    await page.locator(".fl-fact-plan-note").waitFor();
    await page.locator("[data-moby-start='5']").click();
    const card = page.locator("#mby-fluency-host .fl-fact-card");
    await card.first().waitFor();
    let sawIntro = false;
    let sawHow = false;
    for (let step = 0; step < 12; step += 1) {
      if (await page.locator("[data-fact-ready]").count()) {
        sawIntro = true;
        assert.ok((await page.locator(".fl-fact-family li").count()) >= 1, "the family is shown before practice");
        await page.locator("[data-fact-ready]").click();
        continue;
      }
      if (!(await page.locator("[data-fact-input]").count())) break;
      const question = await page.locator(".fl-fact-question").innerText();
      const [, a, op, b] = question.match(/^(\d+) ([+−×÷]) (\d+)/) || [];
      const answer = { "+": +a + +b, "−": a - b, "×": a * b, "÷": a / b }[op];
      await page.locator("[data-fact-input]").fill(String(answer));
      await page.locator("[data-fact-form] button[type=submit]").click();
      if (await page.locator("[data-fact-how='knew']").count()) {
        sawHow = true;
        await page.locator("[data-fact-how='knew']").click();
      } else await page.locator("[data-fact-next]").click();
    }
    await page.locator(".fl-fact-done").waitFor();
    assert.ok(sawHow, "a right first try offers the one-tap note");
    const savedFacts = await page.evaluate(() => JSON.parse(localStorage.getItem("ewl-fluency-moby-facts-v1") || "{}"));
    const entries = Object.values(savedFacts.facts || {}).flatMap((record) => record.recent);
    assert.equal(entries.length, 5, "the teacher's plan set five problems, and each was saved");
    assert.ok(entries.some((entry) => entry.how === "knew"), "the note is saved with the answer");
    if (sawIntro) assert.ok(entries.some((entry) => entry.supported), "the fact right after its introduction is supported");
    await shot("7-fact-session");

    // ---- #8 Green Light: the shop waits for it ----
    await page.goto(`${base}/math/fluency-lab/?view=games&grade=3`, { waitUntil: "networkidle" });
    await page.locator(".fl-green-light").waitFor();
    assert.match(await page.locator(".fl-green-light").innerText(), /Green Light: \d+ of 10/);
    assert.ok(await page.locator("[data-buy]").first().isDisabled());

    // ---- #9 Questions Log and #10 trouble spots from a learner on this device ----
    await page.evaluate(() => {
      const now = Date.now();
      const recent = [0, 1, 2, 3].map((i) => ({ correct: false, independent: true, level: 1, at: now - i * 1000 }));
      const mistakes = [0, 1, 2].map((i) => ({ id: `m${i}`, key: "3:mul-0-5", question: `${i + 2} × 4 = ?`, submitted: String(i + 7), studentInput: String(i + 7), problemPrompt: `${i + 2} × 4 = ?`, category: null, at: now - i * 1000, resolvedAt: null }));
      localStorage.setItem("ewl-fluency-tutor-v2", JSON.stringify({ version: 2, records: { "3:mul-0-5": { recent } }, mistakes, diagnostics: {}, sessions: [] }));
    });
    await page.goto(`${base}/math/fluency-lab/?view=notebook&grade=3`, { waitUntil: "networkidle" });
    await page.locator("#fl-qlog-title").waitFor();
    assert.equal(await page.locator("#notebook-view .fl-tt-table tbody tr").count(), 3);
    await page.locator("[data-print-misses]").click();
    assert.ok((await page.evaluate(() => window.__printed)) >= 1, "the fresh worksheet prints");
    assert.match(await page.locator("#print-sheet").innerText(), /My misses, fresh practice/);
    await page.goto(`${base}/math/fluency-lab/?view=teacher&grade=3`, { waitUntil: "networkidle" });
    await page.locator("#t4-tab-insights").click();
    await page.locator("[data-t4-device]").click();
    await page.locator("#t4-h-spots").waitFor();
    assert.match(await page.locator(".t4-rank").innerText(), /4 misses in all|misses in all/);
    assert.match(await page.locator("#t4-h-facts").locator("xpath=..").innerText(), /Automatic/);
    await page.setViewportSize({ width: 375, height: 800 });
    await noOverflow("teacher insights at 375px");
    await page.setViewportSize({ width: 1280, height: 900 });
    await shot("10-trouble-spots");

    assert.deepEqual(problems, [], "no console errors");
    console.log("teacher-tools browser: ok");
  }
} finally {
  await browser?.close();
  await server.close();
}

import assert from "node:assert/strict";
import { chromium } from "playwright";

const base =
  process.env.STORY_STUDIO_URL || "http://127.0.0.1:4173/language-adventures/mystery-club/";
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: async () => {
          throw new DOMException("Denied by browser test", "NotAllowedError");
        },
      },
    });
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push({ url: page.url(), message: String(e) }));
  await page.goto(base, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".story-card").count(), 10, "all stories render");
  await page.selectOption("#pathway", "guided");
  await page.locator('[data-story="mascot"]').click();
  assert.equal(await page.locator("#reader-title").innerText(), "The empty place");
  await page.selectOption("#pathway", "independent");
  assert.equal(
    await page.locator("#reader-title").innerText(),
    "The empty place",
    "pathway can change without restarting",
  );
  await page.selectOption("#pathway", "guided");
  await page.locator('[data-answer="1"]').click();
  await page.locator("#submit-activity").click();
  assert.match(
    await page.locator("#task-feedback").innerText(),
    /observation|visible|guess/i,
    "wrong answer gets specific retry feedback",
  );
  await page.locator('[data-answer="0"]').click();
  await page.locator("#submit-activity").click();
  assert.equal(await page.locator("#reader-title").innerText(), "A feather trail");
  await page.reload();
  assert.equal(
    await page
      .locator(".story-card")
      .filter({ hasText: "The Missing Class Mascot" })
      .locator(".saved")
      .innerText(),
    "Saved at scene 2 of 6",
  );
  await page.locator('[data-story="mascot"]').click();
  await page.locator('[data-inspect="0"]').click();
  assert.equal(
    await page.locator("#clue-detail-0").isVisible(),
    true,
    "clue details open accessibly",
  );
  await page.locator('[data-answer="0"]').click();
  await page.locator("#submit-activity").click();
  assert.match(
    await page.locator(".notebook").innerText(),
    /Two blue feathers/,
    "inspected clue appears in notebook",
  );
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const stories = await page.evaluate(() =>
    window.MYSTERY_STORIES.map((s) => ({
      id: s.id,
      scenes: s.scenes.map((x) => ({
        type: x.activity.type,
        answer: x.activity.answer,
        order: x.activity.order,
      })),
    })),
  );
  for (const story of stories) {
    await page.goto(
      `${base}?story=${story.id}${story.id.startsWith("lantern") ? "&cluster=6-8" : ""}`,
      { waitUntil: "networkidle" },
    );
    if (story.id === "mascot") {
      await page.getByText("Teacher language target").click();
      assert.match(
        await page.locator(".activity details[open]").innerText(),
        /ELD-LA\.2-3\.Explain\.Interpretive/,
        "Grade 3 displays a WIDA Language Expectation reference",
      );
      await page.getByText("Teacher language target").click();
    }
    for (const [index, activity] of story.scenes.entries()) {
      assert.equal(
        await page.locator("#reader-title").count(),
        1,
        `${story.id} scene ${index + 1} visible`,
      );
      if (story.id === "lantern-4" && index === 3) {
        await page.getByText("Teacher language target").click();
        assert.match(
          await page.locator(".activity details[open]").innerText(),
          /ELD-LA\.6-8\.Argue\.Expressive/,
          "Grades 6–8 reference uses the selected cluster and expressive mode",
        );
        await page.getByText("Teacher language target").click();
      }
      if (activity.type === "timeline") {
        const wanted = activity.order;
        for (let pos = 0; pos < wanted.length; pos++) {
          const row = page.locator(`#timeline-list .timeline-item[data-item="${wanted[pos]}"]`);
          let current = await page
            .locator("#timeline-list .timeline-item")
            .evaluateAll(
              (nodes, target) => nodes.findIndex((n) => n.dataset.item === String(target)),
              wanted[pos],
            );
          while (current > pos) {
            await row.locator('[data-move="-1"]').click();
            current--;
          }
        }
        await page.locator("#check-order").click();
      } else if (activity.type === "writing" || activity.type === "speaking") {
        if (activity.type === "speaking") {
          await page.locator("#record-toggle").click();
          await page.waitForFunction(() =>
            document
              .querySelector("#task-feedback")
              ?.textContent.includes("Microphone access was not granted"),
          );
          assert.match(
            await page.locator("#task-feedback").innerText(),
            /never required|Microphone access was not granted/i,
            "microphone denial leaves the task usable",
          );
        }
        await page
          .locator("#student-response")
          .fill(
            `I conclude this from the scene clues. The specific evidence supports the explanation because the details fit together. ${index + 1}`,
          );
        await page.locator("#submit-activity").click();
        await page
          .locator("#student-response")
          .fill(
            `I conclude this from the scene clues. The specific evidence supports the explanation because the details fit together. I revised attempt ${index + 1}.`,
          );
        await page.locator("#submit-activity").click();
        await page
          .locator(".self-check")
          .evaluateAll((nodes) => nodes.forEach((n) => (n.checked = true)));
        await page.locator("#finish-writing").click();
      } else if (activity.type === "branch") {
        await page.locator('[data-branch="0"]').click();
        assert.ok(
          await page
            .locator(".activity")
            .innerText()
            .then((t) => /team|lead|evidence|path/i.test(t)),
          "branch shows a consequence",
        );
        await page.locator("#submit-activity").click();
      } else {
        await page.locator(`[data-answer="${activity.answer}"]`).click();
        await page.locator("#submit-activity").click();
      }
      if (index < story.scenes.length - 1)
        assert.equal(
          await page.locator("#reader-title").innerText(),
          await page.evaluate(
            ({ s, i }) => window.MYSTERY_STORIES.find((x) => x.id === s).scenes[i + 1].title,
            { s: story.id, i: index },
          ),
          `${story.id}: successful task advances`,
        );
    }
    await page.locator("#scene-next").click();
    assert.match(await page.locator(".completion").innerText(), /Mystery solved|Chapter complete/);
  }

  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator("#teacher-guide").click();
  await page.selectOption("#teacher-cluster", "4-5");
  assert.ok(
    (await page.locator('[data-launch="mascot"]').getAttribute("href")).includes("cluster=4-5"),
    "teacher deep link carries grade cluster",
  );
  await page.locator("#open-access").click();
  assert.equal(
    await page.locator("#access-task [data-access]").count(),
    8,
    "ACCESS studio renders two original tasks in all four domains",
  );
  const accessListening = page.locator('#access-task [data-access="listening"]').first();
  await accessListening.locator('[data-answer="1"]').click();
  assert.match(
    await accessListening.locator(".access-feedback").innerText(),
    /Review the task support/,
    "ACCESS practice provides retry feedback",
  );
  await accessListening.locator('[data-answer="0"]').click();
  assert.match(
    await accessListening.locator(".access-feedback").innerText(),
    /matches the task evidence/,
    "ACCESS retry can complete",
  );
  const accessSpeaking = page.locator('#access-task [data-access="speaking"]').first();
  await accessSpeaking.locator("[data-response]").fill("I see a clue and connect it to the scene.");
  await accessSpeaking.locator("[data-self-review]").click();
  assert.match(
    await accessSpeaking.locator(".access-feedback").innerText(),
    /First attempt saved/,
    "ACCESS production task saves an attempt",
  );
  await accessSpeaking
    .locator("[data-response]")
    .fill(
      "I see a blue feather. It may show the mascot moved because the trail points toward the art room.",
    );
  await accessSpeaking.locator("[data-self-review]").click();
  await accessSpeaking
    .locator(".access-check")
    .evaluateAll((nodes) => nodes.forEach((n) => (n.checked = true)));
  await accessSpeaking.locator("[data-finish-access]").click();
  assert.match(
    await accessSpeaking.locator(".access-feedback").innerText(),
    /Self-review complete/,
    "ACCESS production task supports revision and self-review",
  );
  await page.selectOption("#access-cluster", "6-8");
  await page.locator("#open-access").click();
  assert.equal(
    await page.locator("#access-task [data-access]").count(),
    8,
    "ACCESS studio switches cluster",
  );

  const origin = new URL(base).origin;
  await page.goto(`${origin}/language-adventures/`, { waitUntil: "networkidle" });
  const homeLink = page.locator("[data-language-page-story-studio]");
  await page.waitForSelector("[data-language-page-story-studio]", { timeout: 8000 });
  assert.equal(await homeLink.count(), 1, "Language Adventures homepage links to Mystery Club");
  assert.ok(
    (await page.locator('[data-mystery-club-launch="mascot"]').count()) >= 1,
    "legacy Grades 3–5 Mystery Files launch now opens the new elementary case",
  );
  assert.ok(
    (await page.locator('[data-mystery-club-launch="lantern-1"]').count()) >= 1,
    "featured Lantern launch now opens the new middle-school chapter",
  );
  await homeLink.click();
  await page.waitForURL("**/language-adventures/mystery-club/");
  assert.equal(
    await page.locator(".story-card").count(),
    10,
    "homepage link opens the integrated studio",
  );
  const legacyResponse = await page.goto(
    `${origin}/language-adventures/adventures/mystery-files/mf-01/`,
    { waitUntil: "networkidle" },
  );
  assert.equal(legacyResponse.status(), 200, "legacy Lantern route remains available");
  await page.waitForSelector("[data-language-page-story-studio]", { timeout: 8000 });
  assert.equal(
    await page.locator("[data-language-page-story-studio]").count(),
    1,
    "legacy Lantern page links to the updated stories",
  );

  await page.screenshot({
    path: ".qa-logs/language-page-story-studio-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/language-adventures/`, { waitUntil: "networkidle" });
  await page.waitForSelector("[data-language-page-story-studio]", { timeout: 8000 });
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    "integrated adventure navigation has no mobile overflow",
  );
  await page.goto(base, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".story-card").count(), 10, "mobile renders all stories");
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    "mobile has no horizontal overflow",
  );
  await page.screenshot({ path: ".qa-logs/language-page-story-studio-mobile.png", fullPage: true });
  const storyRuntimeErrors = errors.filter(
    (error) => new URL(error.url).pathname === "/language-adventures/mystery-club/",
  );
  assert.deepEqual(storyRuntimeErrors, [], "no browser runtime errors in the new story studio");
  console.log(
    "PASS: Chromium desktop and mobile journeys; all 59 scene activities, feedback/revision, local resume, teacher deep links, ACCESS domains/clusters, integrated Language Adventures and legacy Lantern navigation, and responsive width.",
  );
} finally {
  await browser.close();
}

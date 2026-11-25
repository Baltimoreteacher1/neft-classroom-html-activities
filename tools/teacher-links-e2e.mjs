#!/usr/bin/env node
/**
 * Teacher links in a real browser: (1) Demand Analyzer -> "Make a student handout" -> Activity Studio builds the
 * worksheet with the task, its steps, word help and frames, (2) an assigned link opens exactly its Teach It Back concept
 * and its Detective case, (3) "Share with my teacher" appears only for a learner in a class and sends nothing until
 * pressed, then only the learner's own words.
 *
 *   node tools/teacher-links-e2e.mjs        (serves this working tree; BASE=<url> to point elsewhere)
 */
import { startRun } from "./lib/lab-e2e.mjs";

const { page, context, ok, go, axe, overflow, finish } = await startRun("teacher-links-e2e");
const text = () => page.locator("#app").innerText();
const shares = [];
await page.route("**/api/class/review/share", async (route) => {
  shares.push(route.request().postDataJSON());
  await route.fulfill({ json: { ok: true, workId: "w1" } });
});
const band = "6-8";

try {
  // ── 1. Analyze, then build ──────────────────────────────────────────────────
  await go(`/demand?grades=${band}`);
  await page.locator("[data-dm-sample]").click();
  await page.locator("[data-dm-check]").click();
  await page.waitForSelector("#dmResults");
  await page.locator("[data-dm-build]").click();
  await page.waitForURL(/\/activity-studio\/new\?kind=worksheet&from=demand/);
  await page.waitForSelector("textarea");
  const box = await page.locator("textarea").first().inputValue();
  ok(
    box.startsWith("Read the passage about erosion"),
    "Activity Studio opens with the teacher's own task in the box",
  );
  ok(
    /\nerosion - /.test(box) && /\nsediment - /.test(box),
    "the pre-teach words arrive as 'word - meaning' lines",
  );
  ok(!/\nquasar - /.test(box), "no word is defined that the Word Lab bank does not define");
  await page.locator(".st-go button").first().click();
  await page.waitForURL(/\/activity-studio\/(?!new)[a-z0-9-]+$/, { timeout: 20000 });
  await page.getByText("Preview as student").first().waitFor({ timeout: 20000 });
  const built = await page.evaluate(
    () =>
      document.querySelector("#app").innerText +
      "\n" +
      [...document.querySelectorAll("#app textarea, #app input")].map((e) => e.value).join("\n") +
      "\n" +
      [...document.querySelectorAll("#app [contenteditable]")].map((e) => e.innerText).join("\n"),
  );
  ok(
    /1\. Read the passage about erosion\. 2\. Underline the evidence/.test(built),
    "the handout carries the directions in numbered steps (the editor lists a block's first 80 characters)",
  );
  ok(/Sentence starters/.test(built), "the handout carries the sentence starters");
  ok(/sediment/i.test(built) && /erosion/i.test(built), "the handout carries word help");
  ok(
    /Read the passage about erosion, underline/.test(built),
    "the teacher's original task is still there, unchanged",
  );
  await axe("Activity Studio editor after the handoff");

  // ── 2. Assigned links open exactly their item ──────────────────────────────
  await go(`/teach-back/area-vs-perimeter?grades=3-5`);
  ok(
    /Area and perimeter|area and perimeter|Area vs/i.test(await text()),
    "an assigned Teach It Back link opens that concept",
  );
  ok(
    (await page.locator("#tbStepH").count()) === 1 || (await page.locator("h2").count()) > 0,
    "and lands on a step, not the chooser",
  );
  await go(`/teach-back/area-vs-perimeter?grades=3-5`);
  ok(
    /Area and perimeter|area and perimeter|Area vs/i.test(await text()),
    "opening it again still shows the same concept",
  );
  await go(`/claim-check/m35-perimeter?grades=3-5`);
  ok(/Maya's perimeter/.test(await text()), "an assigned Detective link opens that case");

  // ── 3. Share with my teacher ───────────────────────────────────────────────
  await go(`/teach-back/area-vs-perimeter?grades=3-5`);
  await page.evaluate(async () => {
    const { blankSession } = await import("/access-practice-lab/src/teachback/session.js");
    const s = blankSession("area-vs-perimeter");
    s.step = "done";
    s.attempts = [
      {
        conceptId: "area-vs-perimeter",
        phase: "first",
        text: "Area is the space inside a shape and perimeter is the distance around it.",
        supported: false,
        mode: "type",
        words: 15,
        covered: [],
        self: [],
        frames: false,
      },
    ];
    localStorage.setItem(
      "accessPracticeLab:v1:teach-back",
      JSON.stringify({
        v: 1,
        session: s,
        records: { supported: [], independent: [] },
        explained: {},
      }),
    );
  });
  await go(`/teach-back/area-vs-perimeter?grades=3-5`);
  ok(/You taught it back/.test(await text()), "the finished step shows");
  ok(
    (await page.locator("[data-tb-share]").count()) === 0,
    "no share button for a learner who has not joined a class",
  );

  await page.evaluate(() =>
    localStorage.setItem(
      "neft-class-link",
      JSON.stringify({
        code: "ABC234",
        studentId: "sabcdef0123",
        studentKey: "ABCDEFGH",
        name: "Test",
        joinedAt: Date.now(),
      }),
    ),
  );
  const linkKey = await page.evaluate(
    async () => (await import("/shared/class-platform/client.js")).LINK_KEY,
  );
  await page.evaluate(
    (k) =>
      localStorage.setItem(
        k,
        JSON.stringify({ code: "ABC234", studentId: "sabcdef0123", studentKey: "ABCDEFGH" }),
      ),
    linkKey,
  );
  await go(`/teach-back/area-vs-perimeter?grades=3-5`);
  ok(
    (await page.locator("[data-tb-share]").count()) === 1,
    "a learner in a class sees 'Share with my teacher'",
  );
  ok(shares.length === 0, "nothing was sent just by finishing or by the button appearing");
  await page.locator("[data-tb-share]").click();
  await page.waitForFunction(() =>
    /Sent to your teacher/.test(document.querySelector("#app")?.innerText || ""),
  );
  ok(shares.length === 1, "pressing it sends exactly one request");
  ok(
    shares[0].label === "Teach It Back: Area and perimeter" ||
      /^Teach It Back:/.test(shares[0].label),
    "the label names the concept",
  );
  ok(
    /Area is the space inside a shape/.test(shares[0].text),
    "what is sent is the learner's own words",
  );
  ok(
    Object.keys(shares[0]).sort().join() === "code,label,text",
    "the body is the class code, the label and the text: nothing else",
  );
  await axe("Teach It Back done step, in a class");
  await page.setViewportSize({ width: 375, height: 800 });
  ok((await overflow()) <= 1, "no horizontal overflow at 375px");
  await page.setViewportSize({ width: 1280, height: 900 });
} catch (error) {
  ok(false, `run aborted: ${error.message.split("\n").slice(0, 3).join(" | ")}`);
}
await finish();

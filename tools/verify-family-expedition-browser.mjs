// Browser check of the Family Math Expedition (/math/fluency-lab/family-adventure/) against repository source:
// every stop and navigation path, correct and incorrect answers, hints and retries for grades 1-8, English / Spanish /
// both, save-resume-restart and migration, real links into practice, three viewports, axe accessibility.
//   node tools/verify-family-expedition-browser.mjs
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { createServer } from "vite";
import { bandOf, SCENES } from "../math/fluency-lab/family-adventure/coach-scenes.js";
import { ITEMS } from "../math/fluency-lab/family-adventure/math-items.js";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const server = await createServer({
  root: REPO_ROOT,
  logLevel: "error",
  server: { host: "127.0.0.1", port: 0 },
});
await server.listen();
const base = `http://127.0.0.1:${server.httpServer.address().port}`;
const URL_PATH = "/math/fluency-lab/family-adventure/";
const results = [];
const errors = [];
let browser;

async function check(name, fn) {
  try {
    await fn();
    results.push(["PASS", name]);
  } catch (error) {
    const line = String(error.stack).match(/browser\.mjs:(\d+)/)?.[1];
    results.push(["FAIL", `${name}: ${String(error.message).split("\n")[0]} (line ${line})`]);
  }
}

async function open(context, query = "", seed) {
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  page.on("pageerror", (e) => errors.push(`${URL_PATH}${query}: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/WebSocket|\[vite\]|Vite server/.test(m.text()))
      errors.push(`${URL_PATH}${query}: console ${m.text()}`);
  });
  if (seed) await page.addInitScript(seed);
  await page.goto(`${base}${URL_PATH}${query}`, { waitUntil: "networkidle" });
  return page;
}
const title = (page) => page.locator("#stop-title").innerText();
const heading = async (page, text) => assert.match(await title(page), text);

try {
  browser = await chromium.launch({ headless: true });
  const fresh = () =>
    browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });

  // ---- Stop 1 ------------------------------------------------------------------------------------------------
  await check(
    "welcome: first visit, no console errors, no resume card, grade required",
    async () => {
      const page = await open(await fresh());
      await heading(page, /Family Math Expedition/);
      assert.equal(await page.locator(".resume").count(), 0, "no resume card on first visit");
      await page.click("#start-btn");
      assert.ok(await page.locator("#grade-warn").isVisible(), "asks for a grade first");
      assert.equal(
        await page.evaluate(() => document.activeElement?.className.includes("grade")),
        true,
        "focus goes to the grades",
      );
      await page.keyboard.press("ArrowRight");
      assert.equal(
        await page.locator('.grade[aria-checked="true"]').count(),
        1,
        "arrow keys choose a grade",
      );
      await page.click(".grade[data-grade='5']");
      await page.click("#start-btn");
      await heading(page, /Discover how math works/);
      await page.context().close();
    },
  );

  // ---- viewports and axe ---------------------------------------------------------------------------------------
  for (const [name, width, height] of [
    ["mobile", 375, 812],
    ["tablet", 768, 1024],
    ["desktop", 1280, 900],
  ]) {
    await check(`layout and axe at ${name} on every stop`, async () => {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: "reduce",
      });
      const page = await open(context, "?grade=4");
      for (let stop = 1; stop <= 5; stop += 1) {
        await page.goto(`${base}${URL_PATH}?grade=4&stop=${stop}`, { waitUntil: "networkidle" });
        if (stop === 5) await page.waitForSelector(".plan-card");
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
          ),
          `stop ${stop}: no horizontal scroll (${await page.evaluate(() => `${document.documentElement.scrollWidth} > ${document.documentElement.clientWidth}`)})`,
        );
        const axe = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        const bad = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact));
        assert.equal(
          bad.length,
          0,
          `stop ${stop}: ${bad.map((v) => `${v.id} (${v.nodes[0]?.target})`).join("; ")}`,
        );
      }
      await context.close();
    });
  }

  // ---- Stop 2: every grade, right/wrong answers, hints, reasons, retries ------------------------------------
  for (let grade = 1; grade <= 8; grade += 1) {
    await check(
      `stop 2 grade ${grade}: wrong answer, hints, retry, wrong reason, revision, solved, fresh version`,
      async () => {
        const context = await fresh();
        const page = await open(context, `?grade=${grade}&stop=2`);
        const v = ITEMS[grade].variants[0];
        assert.match(await page.locator(".ch-title").innerText(), /Build it/);
        await page.getByRole("button", { name: "Skip building" }).click();
        const wrongIndex = v.choices.findIndex(([, note]) => note !== null);
        const rightIndex = v.choices.findIndex(([, note]) => note === null);
        assert.notEqual(
          await page.locator(".ch-choice").first().getAttribute("data-i"),
          String(rightIndex),
          "the right answer is not always listed first",
        );
        await page.locator(`.ch-choice[data-i="${wrongIndex}"]`).click();
        await page.getByRole("button", { name: "Check my answer" }).click();
        const noteText = await page.locator(".ch-live").innerText();
        assert.ok(
          noteText.includes(v.choices[wrongIndex][1].en.slice(0, 25)),
          "misconception note is shown for the wrong answer",
        );
        assert.equal(
          await page.locator(".ch-worked").count(),
          0,
          "the answer is not revealed after one miss",
        );
        await page.getByRole("button", { name: /hint/i }).first().click();
        assert.equal(await page.locator(".ch-hints li").count(), 1, "first hint appears");
        await page.getByRole("button", { name: /Hint 2 of 3/ }).click();
        await page.getByRole("button", { name: /Hint 3 of 3/ }).click();
        assert.equal(await page.locator(".ch-hints li").count(), 3, "three hints in order");
        await page.locator(`.ch-choice[data-i="${rightIndex}"]`).click();
        await page.getByRole("button", { name: "Check my answer" }).click();
        assert.match(await page.locator(".ch-title").innerText(), /Explain it/);
        const wrongReason = v.reasons.findIndex(([, n]) => n !== null);
        const rightReason = v.reasons.findIndex(([, n]) => n === null);
        await page.locator(`.ch-choice[data-i="${wrongReason}"]`).click();
        await page.getByRole("button", { name: "Check my answer" }).click();
        assert.ok(
          (await page.locator(".ch-live").innerText()).includes("Not yet"),
          "wrong reason gets feedback and a retry",
        );
        await page.locator(`.ch-choice[data-i="${rightReason}"]`).click();
        await page.getByRole("button", { name: "Check my answer" }).click();
        assert.match(await page.locator(".ch-title").innerText(), /You did all three steps/);
        assert.ok(
          (await page.locator(".ch-eq-val").innerText()).includes(v.equation.replace(/\s+/g, " ")),
          "equation shown",
        );
        assert.match(
          await page.locator(".ch-note.ch-good").innerText(),
          /fixed your thinking/,
          "revision is recognised",
        );
        await page.getByRole("button", { name: "Try a fresh one" }).click();
        const v2 = ITEMS[grade].variants[1];
        assert.ok(
          (await page.locator(".ch-task").innerText()).includes(v2.build.prompt.en.slice(0, 14)),
          "fresh version loads",
        );
        await page.context().close();
      },
    );
  }

  await check(
    "stop 2: three wrong answers reveal the worked solution; build step completes with the model",
    async () => {
      const context = await fresh();
      const page = await open(context, "?grade=1&stop=2");
      for (let i = 0; i < 7; i += 1) await page.locator(".tf-cell").nth(i).click();
      assert.match(
        await page.locator(".ch-title").innerText(),
        /Answer it/,
        "building the model advances the challenge",
      );
      const v = ITEMS[1].variants[0];
      const wrong = v.choices.findIndex(([, n]) => n !== null);
      for (let i = 0; i < 3; i += 1) {
        await page.locator(`.ch-choice[data-i="${wrong}"]`).click();
        await page.getByRole("button", { name: "Check my answer" }).click();
      }
      assert.equal(
        await page.locator(".ch-worked").count(),
        1,
        "worked solution after three misses",
      );
      await context.close();
    },
  );

  await check(
    "stop 2: free-play models respond (ten-frame, base-ten trade, fractions, ratio, slope)",
    async () => {
      const context = await fresh();
      const page = await open(context, "?grade=3&stop=2");
      await page.getByRole("tab", { name: "Ten-frame" }).click();
      await page.locator(".tf-cell").nth(8).click();
      assert.match(
        await page.locator(".play-stage .m-equation").first().innerText(),
        /9 \+ 1 = 10/,
      );
      await page.getByRole("tab", { name: "Base-ten blocks" }).click();
      assert.equal(await page.locator(".bt-value").innerText(), "142");
      await page.getByRole("button", { name: /Trade 10 units/ }).click();
      assert.equal(await page.locator(".bt-value").innerText(), "142", "trading keeps the value");
      await page.getByRole("tab", { name: "Fraction bars" }).click();
      assert.match(
        await page.locator(".play-stage .m-equation").first().innerText(),
        /same amount/,
      );
      await page.getByRole("tab", { name: "Ratio model" }).click();
      await page.getByRole("button", { name: /Batches \+/ }).click();
      assert.match(
        await page.locator(".play-stage .m-status").innerText(),
        /2 batches: 4 red and 10 blue/,
      );
      await page.getByRole("tab", { name: "Slope graph" }).click();
      assert.match(
        await page.locator(".play-stage .m-equation").first().innerText(),
        /1.5 ÷ 1 = 1.5/,
      );
      await page.getByRole("tab", { name: "Number line" }).click();
      await page.getByRole("button", { name: "Hop +5" }).click();
      assert.match(await page.locator(".play-stage .m-status").innerText(), /5 → 10/);
      await context.close();
    },
  );

  // ---- Stop 3 -----------------------------------------------------------------------------------------------
  for (const grade of [1, 4, 7]) {
    await check(
      `stop 3 grade ${grade}: avoid, ok, then best choice at each of three moments`,
      async () => {
        const context = await fresh();
        const page = await open(context, `?grade=${grade}&stop=3`);
        const scene = SCENES[bandOf(grade)];
        for (let i = 0; i < 3; i += 1) {
          const opts = scene.steps[i].options;
          for (const kind of ["avoid", "best"]) {
            const k = opts.findIndex((o) => o.kind === kind);
            await page.locator(".option").nth(k).click();
            const fb = await page.locator("#fb").innerText();
            assert.ok(fb.includes(opts[k].why.en.slice(0, 20)), `${kind} feedback explains why`);
            if (kind === "avoid") assert.match(fb, /different move/);
          }
          await page.locator(".moment button.btn-primary").click();
        }
        assert.ok(
          (await page.locator(".convo .bub").count()) >= 9,
          "the finished conversation shows the model path",
        );
        assert.equal(await page.locator(".stuck li").count(), 5, "five stuck-or-frustrated moves");
        assert.ok((await page.locator(".ask-list li").count()) >= 6, "questions parents can ask");
        await context.close();
      },
    );
  }

  // ---- Stop 4: every feature opens a real page --------------------------------------------------------------
  await check(
    "stop 4: every demonstrated feature links to a real, working destination",
    async () => {
      const context = await fresh();
      const page = await open(context, "?grade=3&stop=4");
      await page.waitForTimeout(400);
      const hrefs = await page
        .locator(".feature a.btn, .block a.btn")
        .evaluateAll((as) => as.map((a) => a.href));
      assert.ok(hrefs.length >= 9, `found ${hrefs.length} feature links`);
      for (const href of hrefs) {
        const u = new URL(href);
        assert.ok(u.pathname.startsWith("/math/fluency-lab/"), `${href} stays in the Lab`);
        const response = await context.request.get(href);
        assert.equal(response.status(), 200, `${href} responds 200`);
      }
      assert.ok(
        hrefs.some((h) => h.includes("start=daily")) &&
          hrefs.some((h) => h.includes("view=games")) &&
          hrefs.some((h) => h.includes("view=notebook")) &&
          hrefs.some((h) => h.includes("view=path")),
        "Today's 10, games, mistakes, progress",
      );
      const skillLink = hrefs.find((h) => /skill=/.test(h));
      assert.ok(skillLink, "visual lesson / scratchpad links carry a real skill id");
      await page.getByRole("button", { name: "Show me" }).first().click();
      await page.locator(".hot").first().click();
      assert.ok(
        (await page.locator(".feat-tip").first().innerText()).length > 10,
        "hotspot shows a tip",
      );
      const lab = await context.newPage();
      lab.on("pageerror", (e) => errors.push(`lab: ${e.message}`));
      for (const key of ["start=daily", "view=games", "view=notebook", "view=path"]) {
        await lab.goto(
          hrefs.find((h) => h.includes(key)),
          { waitUntil: "networkidle" },
        );
        assert.ok((await lab.locator("main").innerText()).length > 50, `${key} renders`);
      }
      await lab.goto(skillLink, { waitUntil: "networkidle" });
      assert.ok(
        await lab.locator("#workspace-view").isVisible(),
        "skill link opens the practice workspace",
      );
      assert.ok(
        (await lab.locator("#scratchpad").count()) > 0,
        "the scratchpad exists in the workspace",
      );
      await context.close();
    },
  );

  // ---- Stop 5 and completion --------------------------------------------------------------------------------
  await check(
    "stop 5: plan for each routine, real practice link, selections preserved, print guide, completion",
    async () => {
      const context = await fresh();
      const page = await open(context, "?grade=6&stop=5");
      await page.waitForSelector(".plan-card");
      const routines = [
        ["Quick Practice", 5, "solo"],
        ["Math Together", 10, "together"],
        ["Deeper Thinking", 15, "together"],
      ];
      for (const [name, minutes, mode] of routines) {
        await page.getByRole("radio", { name: new RegExp(name) }).click();
        assert.match(await page.locator(".plan-sum").innerText(), new RegExp(`${minutes} min`));
        const href = await page.locator("#go-practice").getAttribute("href");
        const u = new URL(href, `${base}${URL_PATH}`);
        assert.equal(u.pathname, "/math/fluency-lab/family/play.html");
        assert.equal(u.searchParams.get("grade"), "6");
        assert.equal(u.searchParams.get("mode"), mode);
        assert.ok(
          u.searchParams.get("game") &&
            u.searchParams.get("skill") &&
            Number(u.searchParams.get("rounds")) >= 1,
        );
        assert.equal(
          await page.locator(".timeline li").count(),
          name === "Deeper Thinking" ? 4 : 3,
          `${name} timeline`,
        );
        assert.ok(
          (await page.locator(".night-body .ask-list li").count()) >= 4,
          "conversation starters",
        );
      }
      // Changing the skill changes the link.
      const before = await page.locator("#go-practice").getAttribute("href");
      const options = await page
        .locator("#pl-skill option")
        .evaluateAll((o) => o.map((x) => x.value));
      await page.selectOption("#pl-skill", options.at(-1));
      assert.notEqual(
        await page.locator("#go-practice").getAttribute("href"),
        before,
        "skill choice reaches the link",
      );
      // Printable guide.
      await page.evaluate(
        () =>
          (window.print = () =>
            (window.__printed = document.querySelector("#printSheet").innerText)),
      );
      await page.getByRole("button", { name: /Print the quick-start guide/ }).click();
      const printed = await page.evaluate(() => window.__printed);
      assert.match(printed, /Family Math quick-start guide/);
      assert.match(printed, /Things to say and ask/);
      // The practice page the link opens actually loads.
      const href = await page.locator("#go-practice").getAttribute("href");
      const play = await context.newPage();
      play.on("pageerror", (e) => errors.push(`play: ${e.message}`));
      await play.goto(new URL(href, `${base}${URL_PATH}`).href, { waitUntil: "networkidle" });
      assert.ok((await play.locator("#fm2-main").innerText()).length > 20, "practice page renders");
      // Finish and celebrate.
      await page.getByRole("button", { name: "Finish the expedition" }).click();
      await heading(page, /You finished the expedition/);
      await page.waitForSelector(".next a.btn");
      assert.match(await page.locator(".next a.btn").getAttribute("href"), /play\.html/);
      await context.close();
    },
  );

  // ---- language -------------------------------------------------------------------------------------------------
  await check("English / Español / both on every stop", async () => {
    const context = await fresh();
    const page = await open(context, "?grade=2&stop=1");
    await page.getByRole("button", { name: "Español" }).click();
    assert.equal(await page.evaluate(() => document.documentElement.lang), "es");
    const expectEs = [
      /Expedición matemática/,
      /Descubran/,
      /Aprendan juntos/,
      /Exploren/,
      /Su primera noche/,
    ];
    for (let stop = 1; stop <= 5; stop += 1) {
      await page.goto(`${base}${URL_PATH}?grade=2&stop=${stop}`, { waitUntil: "networkidle" });
      await heading(page, expectEs[stop - 1]);
      const text = await page.locator("main").innerText();
      assert.ok(
        !/\bNext stop\b|\bChoose\b|\bSkip this stop\b/.test(text),
        `stop ${stop} has no English chrome in Spanish`,
      );
    }
    await page.getByRole("button", { name: "EN + ES" }).click();
    assert.ok((await page.locator(".es").count()) > 5, "both languages show Spanish under English");
    await context.close();
  });

  // ---- save / resume / restart / migration -----------------------------------------------------------------------
  await check(
    "save and resume, restart, and migration of the first adventure's saved state",
    async () => {
      const context = await fresh();
      let page = await open(context);
      await page.click(".grade[data-grade='7']");
      await page.click("#start-btn");
      await page.goto(`${base}${URL_PATH}`, { waitUntil: "networkidle" });
      assert.equal(await page.locator(".resume").count(), 1, "resume card after progress");
      assert.equal(
        await page.locator('.grade[aria-checked="true"]').getAttribute("data-grade"),
        "7",
        "grade remembered",
      );
      await page.getByRole("button", { name: "Resume where we stopped" }).click();
      await heading(page, /Discover how math works/);
      await page.goto(`${base}${URL_PATH}`, { waitUntil: "networkidle" });
      await page.getByRole("button", { name: "Start over" }).first().click();
      await page.getByRole("button", { name: "Yes, start over" }).click();
      assert.equal(await page.locator(".resume").count(), 0, "restart clears progress");
      await context.close();

      const migrate = await fresh();
      page = await open(migrate, "", () =>
        localStorage.setItem(
          "ewl-fluency-family-adventure-v1",
          JSON.stringify({ path: "guide", grade: 5, stop: 1, done: [0], view: "trail" }),
        ),
      );
      assert.equal(
        await page.locator('.grade[aria-checked="true"]').getAttribute("data-grade"),
        "5",
        "grade carried over",
      );
      assert.equal(await page.locator(".resume").count(), 1, "old progress offers resume");
      await migrate.close();

      const bad = await fresh();
      page = await open(bad, "", () =>
        localStorage.setItem("ewl-fluency-family-expedition-v2", "{broken"),
      );
      await heading(page, /Family Math Expedition/);
      await bad.close();
    },
  );

  await check("map, help panel, stop jumping and back/next/skip paths", async () => {
    const context = await fresh();
    const page = await open(context, "?grade=3");
    await page.getByRole("button", { name: "Skip to the map" }).click();
    await heading(page, /Your expedition map/);
    assert.equal(await page.locator(".map-card").count(), 5);
    await page.locator(".map-card").nth(2).getByRole("button").click();
    await heading(page, /Learn together/);
    await page.getByRole("button", { name: "Help and map" }).click();
    assert.ok(await page.locator("#helpPanel").isVisible());
    assert.ok(
      (await page.locator('#helpPanel a[href*="tour=family"]').count()) === 1,
      "help links to the in-Lab tour",
    );
    await page.keyboard.press("Escape");
    assert.ok(!(await page.locator("#helpPanel").isVisible()), "Esc closes help");
    await page.locator("#route .rn").nth(4).click();
    await heading(page, /first Family Math Night/);
    await page.getByRole("button", { name: "Back" }).click();
    await heading(page, /Explore the Math Fluency Lab/);
    await page.getByRole("button", { name: "Skip this stop" }).click();
    await heading(page, /first Family Math Night/);
    await context.close();
  });
} finally {
  await browser?.close();
  await server.close();
}

const failed = results.filter(([s]) => s === "FAIL");
for (const [s, name] of results) console.log(`${s} ${name}`);
if (errors.length) console.log(`\nConsole/page errors:\n${[...new Set(errors)].join("\n")}`);
console.log(
  `\n${results.length - failed.length}/${results.length} checks passed, ${errors.length} console errors`,
);
process.exit(failed.length || errors.length ? 1 : 0);

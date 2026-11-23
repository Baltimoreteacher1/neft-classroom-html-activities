// The standalone HTML export: safe, self-contained, student-only, and working in jsdom, in file:// and in real
// Chromium at three screen sizes (no overflow, no console errors, every question answerable, axe clean in all four
// looks, and the sandboxed-iframe editor preview). A missing browser skips the browser half locally and fails in CI.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, test } from "node:test";
import { JSDOM } from "jsdom";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import { normalizeActivity } from "../access-practice-lab/src/studio/core/schema.js";
import {
  CSP,
  exportActivityHtml,
  exportFilename,
  studentCopy,
} from "../access-practice-lab/src/studio/export/html.js";
import {
  checkNow,
  click,
  PLAYER_CSS,
  PLAYER_JS,
  solve,
  solverSource,
} from "./studio-player-helpers.mjs";

const SHOTS = process.env.SHOTS;
const exportOf = (a, extra = {}) =>
  exportActivityHtml(a, { js: PLAYER_JS, css: PLAYER_CSS, ...extra });
const questions = (a) => a.blocks.filter((b) => b.type === "question");
const withNotes = (a) => ({
  ...a,
  notes: { teacher: "TEACHER-ONLY-SECRET", misconceptions: ["MISCONCEPTION-LIST-SECRET"] },
});
const load = (html, url = "file:///tmp/activity.html") => {
  const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url });
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  return dom;
};

describe("export: contents", () => {
  test("exportFilename: a safe lowercase ascii name", () => {
    assert.equal(
      exportFilename({ title: "Fractions: Part 2 / Quiz!" }),
      "fractions-part-2-quiz.html",
    );
    assert.equal(exportFilename({ title: "Año nuevo – ¿Qué?" }), "ano-nuevo-que.html");
    assert.equal(exportFilename({ title: "" }), "activity.html");
    assert.equal(exportFilename({ title: "../../etc/passwd" }), "etc-passwd.html");
    assert.ok(exportFilename({ title: "x".repeat(300) }).length <= 65);
  });

  test("studentCopy drops notes, note blocks and the source note; does not touch the input", () => {
    const a = withNotes(allFormats("interactive"));
    a.context = { ...a.context, source: { origin: "teacher", note: "from my binder" } };
    const copy = studentCopy(a);
    assert.equal("notes" in copy, false);
    assert.ok(!copy.blocks.some((b) => b.type === "note"));
    assert.equal(copy.context.source.note, "");
    assert.equal(copy.blocks.filter((b) => b.type === "question").length, 15);
    assert.ok(
      a.blocks.some((b) => b.type === "note"),
      "input untouched",
    );
    assert.equal(a.notes.teacher, "TEACHER-ONLY-SECRET");
  });

  test("the page is one self-contained document with the strict CSP, lang, viewport and title", () => {
    const html = exportOf(
      withNotes(allFormats("interactive", { title: 'Garden <b>"tests"</b>' })),
      { lang: "es" },
    );
    assert.match(html, /^<!doctype html>/i);
    assert.ok(html.includes(`<meta http-equiv="Content-Security-Policy" content="${CSP}">`));
    assert.equal(
      CSP,
      "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: ; media-src data:",
    );
    const doc = new JSDOM(html).window.document;
    assert.equal(doc.documentElement.lang, "es");
    assert.match(doc.querySelector('meta[name="viewport"]').content, /width=device-width/);
    assert.equal(doc.title, 'Garden <b>"tests"</b>');
    assert.equal(
      doc.querySelectorAll("script[src], link, iframe, object, embed, img[src^=http], source")
        .length,
      0,
    );
    assert.ok(!/(?:src|href)=["']?https?:/i.test(html), "no external references");
    assert.ok(doc.querySelector("main#app"));
    assert.equal(doc.querySelectorAll("style").length, 1);
  });

  test("teacher-only data never reaches the file (notes, note blocks), for every kind including worksheet", () => {
    for (const kind of ["interactive", "worksheet", "game", "check"]) {
      const html = exportOf(withNotes(allFormats(kind)));
      for (const secret of [
        "TEACHER-ONLY-SECRET",
        "MISCONCEPTION-LIST-SECRET",
        "Watch for students who add instead",
      ])
        assert.ok(!html.includes(secret), `${kind}: ${secret}`);
      assert.ok(html.includes("What do seeds need?"), `${kind}: the questions are there`);
    }
  });

  test("the activity JSON is escaped: </script>, <!--, U+2028/2029 and & cannot break out", () => {
    const evil = `</script><script>window.__x=1</script><!-- & \u2028 \u2029`;
    const html = exportOf(allFormats("interactive", { title: `T ${evil}`, description: evil }));
    const json = html.match(
      /<script type="application\/json" id="studio-activity">([\s\S]*?)<\/script>/,
    )[1];
    assert.ok(
      !/[<>&\u2028\u2029]/.test(json),
      "no raw <, >, & or line separators in the data block",
    );
    assert.ok(!html.includes("</script><script>window.__x=1"));
    const dom = load(html);
    assert.equal(dom.window.__x, undefined);
    assert.ok(
      dom.window.document.querySelector(".sp-title").textContent.includes("</script><script>"),
    );
    assert.equal(dom.window.document.querySelectorAll(".sp-root script").length, 0);
  });

  test("works from file://: mounts, runs with no errors, and every question can be answered through the DOM", () => {
    const errors = [];
    const dom = load(exportOf(allFormats("interactive")));
    dom.window.addEventListener("error", (e) => errors.push(e.message));
    const doc = dom.window.document;
    assert.ok(dom.window.StudioPlayer.mountPlayer);
    for (const q of questions(allFormats("interactive"))) {
      solve(doc, q);
      assert.ok(checkNow(doc).classList.contains("is-right"), q.format);
      click(doc.querySelector(".sp-next:not([hidden])"));
    }
    assert.ok(doc.querySelector(".sp-finish-title"));
    assert.deepEqual(errors, []);
  });

  test("images: data: images stay, same-site paths (which a lone file cannot load) are dropped", () => {
    const a = normalizeActivity({
      id: "img",
      title: "Images",
      blocks: [
        { type: "image", src: "/pictures/garden.png", alt: "a garden" },
        {
          type: "image",
          src: allFormats().blocks.find((b) => b.format === "hotspot").image.src,
          alt: "pixel",
        },
      ],
    });
    const dom = load(exportOf(a));
    const imgs = [...dom.window.document.querySelectorAll(".sp-figure img")];
    assert.equal(imgs.length, 1);
    assert.match(imgs[0].src, /^data:image\/png/);
  });

  test("only a preview export carries the editor bridge", () => {
    const a = allFormats("interactive");
    const live = exportOf(a);
    const preview = exportOf(a, { preview: true });
    for (const needle of [
      "postMessage",
      'studio: "select"',
      "editMode: true",
      "ResizeObserver",
      'studio === "goto"',
    ])
      assert.ok(!live.includes(needle), `student export has no ${needle}`);
    for (const needle of [
      "editMode: true",
      'studio: "select"',
      'studio === "goto"',
      'studio === "mode"',
      'studio: "ready"',
      'studio: "height"',
    ])
      assert.ok(preview.includes(needle), `preview has ${needle}`);
    assert.throws(() => exportActivityHtml(a, {}), /needs the built player/);
  });
});

// ── real browser ────────────────────────────────────────────────────────────
let chromium;
let AxeBuilder;
try {
  ({ chromium } = await import("playwright"));
  AxeBuilder = (await import("@axe-core/playwright")).default;
} catch {
  chromium = null;
}

describe("export: Chromium", { skip: chromium ? false : "playwright is not installed" }, () => {
  let browser;
  const dir = mkdtempSync(join(tmpdir(), "studio-export-"));
  const fileFor = (name, html) => {
    const p = join(dir, name);
    writeFileSync(p, html);
    return `file://${p}`;
  };
  before(async () => {
    try {
      browser = await chromium.launch(
        process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
      );
    } catch (e) {
      if (process.env.CI) throw e;
      console.warn(`studio-export: SKIP browser tests (${e.message.split("\n")[0]})`);
    }
  });
  after(() => browser?.close());

  const newPage = async (size) => {
    const page = await (await browser.newContext({ viewport: size })).newPage();
    const errors = [];
    const requests = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("request", (r) => requests.push(r.url()));
    return { page, errors, requests };
  };
  const overflow = (page) =>
    page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
  const run = (page, q) =>
    page.evaluate(({ src, q }) => new Function("q", src)(q), { src: solverSource(), q });

  for (const [w, h] of [
    [1366, 768],
    [768, 1024],
    [375, 667],
  ]) {
    test(`${w}x${h}: no overflow, no console errors, no requests, every question answerable, finish`, async (t) => {
      if (!browser) return t.skip("no browser");
      const a = allFormats("interactive");
      const { page, errors, requests } = await newPage({ width: w, height: h });
      await page.goto(fileFor("all.html", exportOf(a)));
      assert.ok((await overflow(page)) <= 0, "no horizontal overflow on the first screen");
      for (const q of questions(a)) {
        await run(page, q);
        await page.click(".sp-check-btn");
        assert.ok(await page.locator(".sp-feedback.is-right").count(), `${q.format} is right`);
        assert.ok((await overflow(page)) <= 0, `${q.format}: no overflow`);
        await page.click(".sp-next:not([hidden])");
      }
      await page.waitForSelector(".sp-finish-title");
      assert.ok((await overflow(page)) <= 0, "no overflow on the finish screen");
      if (SHOTS) {
        mkdirSync(SHOTS, { recursive: true });
        await page.screenshot({ path: join(SHOTS, `finish-${w}.png`), fullPage: true });
      }
      assert.deepEqual(errors, []);
      assert.ok(
        requests.every((u) => u.startsWith("file:") || u.startsWith("data:")),
        `requests: ${requests}`,
      );
      await page.close();
    });
  }

  test("real keyboard: Enter on a card then on a slot places it (match, sort); arrows move an ordered item", async (t) => {
    if (!browser) return t.skip("no browser");
    const a = allFormats("interactive");
    const { page } = await newPage({ width: 1366, height: 768 });
    await page.goto(
      fileFor(
        "kb.html",
        exportActivityHtml(a, { js: PLAYER_JS, css: PLAYER_CSS }).replace(
          "StudioPlayer.mountPlayer(document",
          "window.__p=StudioPlayer.mountPlayer(document",
        ),
      ),
    );
    const key = (k) => page.locator(`[data-key="${k}"]`);
    await page.evaluate(() => window.__p.goto("q-match"));
    await key("card:p1").focus();
    await page.keyboard.press("Enter");
    await key("slot:p1").focus();
    await page.keyboard.press("Enter");
    assert.match(await key("slot:p1").getAttribute("aria-label"), /ratio: compares two amounts/);
    await page.evaluate(() => window.__p.goto("q-sort"));
    await key("item:i1").focus();
    await page.keyboard.press("Space");
    await key("cat:even").focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(".sp-chip").count(), 1);
    await page.evaluate(() => window.__p.goto("q-order"));
    const first = await page.locator(".sp-order-item").first().getAttribute("data-id");
    const lastItem = page.locator(".sp-grip").last();
    const lastId = await page.locator(".sp-order-item").last().getAttribute("data-id");
    await lastItem.focus();
    await page.keyboard.press("ArrowUp");
    assert.equal(await page.locator(".sp-order-item").nth(1).getAttribute("data-id"), lastId);
    assert.equal(await page.evaluate(() => document.activeElement.dataset.key), `grip:${lastId}`);
    assert.ok(first);
    await page.evaluate(() => window.__p.goto("q-plot"));
    await page.locator(".sp-pt[tabindex='0']").focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    assert.equal(await page.locator(".sp-pt[aria-pressed='true']").count(), 1);
    await page.close();
  });

  const LOOKS = ["classic", "playful", "calm", "adventure"];
  const serious = (r) =>
    r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  const axe = async (page, label) => {
    // Entrance animations fade opacity in; axe would read the half-faded colour. Looping decoration is left running.
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished.catch(() => {})),
      ),
    );
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const bad = serious(r);
    assert.equal(
      bad.length,
      0,
      `${label}: ${bad
        .map(
          (v) =>
            `${v.id} (${v.nodes
              .map((n) => n.target.join(" "))
              .slice(0, 3)
              .join("; ")}): ${v.nodes[0]?.failureSummary?.split("\n")[1] ?? ""}`,
        )
        .join(" | ")}`,
    );
  };

  for (const look of LOOKS) {
    test(`axe: zero serious or critical violations in the ${look} look (all 15 formats, feedback states, finish)`, async (t) => {
      if (!browser) return t.skip("no browser");
      const a = allFormats("interactive", { look: { style: look } });
      const { page, errors } = await newPage({ width: 375, height: 667 });
      await page.goto(
        fileFor(
          `axe-${look}.html`,
          exportOf(a).replace(
            "StudioPlayer.mountPlayer(document",
            "window.__p=StudioPlayer.mountPlayer(document",
          ),
        ),
      );
      await axe(page, `${look} first screen`);
      for (const q of questions(a)) {
        await page.evaluate((id) => window.__p.goto(id), q.id);
        await axe(page, `${look} ${q.format}`);
      }
      // feedback states on a choice: empty nudge, wrong (hint panel + hint), right
      await page.evaluate(() => window.__p.goto("q-choice"));
      await page.click(".sp-check-btn");
      await page.click('.sp-q input[value="b"]');
      await page.click(".sp-check-btn");
      await page.click(".sp-hint-btn");
      await axe(page, `${look} wrong feedback + hint`);
      await page.click('.sp-q input[value="a"]');
      await page.click(".sp-check-btn");
      await axe(page, `${look} right feedback`);
      if (SHOTS)
        await page.screenshot({ path: join(SHOTS, `feedback-${look}.png`), fullPage: true });
      assert.deepEqual(errors, []);
      await page.close();
    });

    test(`axe: games and finish screens in the ${look} look`, async (t) => {
      if (!browser) return t.skip("no browser");
      const { page, errors } = await newPage({ width: 1366, height: 768 });
      for (const template of ["quest", "match", "puzzle", "strategy"]) {
        const a = allFormats("game", { template, look: { style: look } });
        await page.goto(
          fileFor(
            `g-${template}-${look}.html`,
            exportOf(a).replace(
              "StudioPlayer.mountPlayer(document",
              "window.__p=StudioPlayer.mountPlayer(document",
            ),
          ),
        );
        await axe(page, `${look} ${template} start`);
        const choice = a.blocks.find((b) => b.id === "q-choice");
        if (template === "match") await page.evaluate(() => window.__p.goto("q-match"));
        if (template === "quest" || template === "strategy" || template === "puzzle") {
          await run(page, choice);
          await page.click(".sp-check-btn");
          await axe(page, `${look} ${template} feedback`);
          await page.click(".sp-next:not([hidden])");
          await axe(page, `${look} ${template} after first question`);
        }
        if (SHOTS)
          await page.screenshot({
            path: join(SHOTS, `game-${template}-${look}.png`),
            fullPage: false,
          });
      }
      assert.deepEqual(errors, []);
      await page.close();
    });
  }

  test("editor preview: sandboxed iframe talks by postMessage (ready, select, goto, mode, height)", async (t) => {
    if (!browser) return t.skip("no browser");
    const a = allFormats("interactive");
    const frameHtml = exportOf(a, { preview: true });
    const { page, errors } = await newPage({ width: 1200, height: 800 });
    const host = `<!doctype html><body><iframe id="f" sandbox="allow-scripts" style="width:900px;height:700px" srcdoc="${frameHtml.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}"></iframe>
<script>window.msgs=[];addEventListener("message",e=>{if(e.source===document.getElementById("f").contentWindow)window.msgs.push(e.data)});</script>`;
    await page.setContent(host);
    await page.waitForFunction(() => window.msgs.some((m) => m.studio === "ready"));
    const frame = page.frameLocator("#f");
    await frame.locator('.sp-q input[value="a"]').click({ force: true });
    await page.waitForFunction(() => window.msgs.some((m) => m.studio === "select"));
    assert.deepEqual(await page.evaluate(() => window.msgs.filter((m) => m.studio === "select")), [
      { studio: "select", id: "q-choice" },
    ]);
    assert.equal(
      await frame.locator('.sp-q input[value="a"]').isChecked(),
      false,
      "selecting a block does not answer it",
    );
    await page.evaluate(() =>
      document.getElementById("f").contentWindow.postMessage({ studio: "goto", id: "q-plot" }, "*"),
    );
    await frame.locator(".sp-q-plot").waitFor();
    await frame.locator(".sp-q-plot").press("Enter");
    await page.waitForFunction(
      () => window.msgs.filter((m) => m.studio === "select").at(-1)?.id === "q-plot",
    );
    await page.evaluate(() =>
      document.getElementById("f").contentWindow.postMessage({ studio: "mode", edit: false }, "*"),
    );
    await frame.locator(".sp-root:not(.sp-edit)").waitFor();
    const before = await page.evaluate(
      () => window.msgs.filter((m) => m.studio === "select").length,
    );
    await frame.locator(".sp-pt[data-x='2'][data-y='3']").click();
    assert.equal(
      await page.evaluate(() => window.msgs.filter((m) => m.studio === "select").length),
      before,
      "after leaving edit mode a click answers",
    );
    assert.ok(
      await page.evaluate(() => window.msgs.some((m) => m.studio === "height" && m.h > 100)),
    );
    assert.deepEqual(errors, []);
    await page.close();
  });
});

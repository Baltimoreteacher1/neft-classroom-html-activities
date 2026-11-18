// Math Studio in a real browser, driven the way a student drives it, on EVERY in-scope lesson:
//   all five stages render lesson content; the lab model mounts; a wrong answer gets feedback and a hint ladder; a
//   practice item with a verified hand-off opens the model on its own numbers and returns to the same question; the
//   model makes a question from its settings and then a transfer question; a reload restores stage and answers;
//   Spanish shows; nothing overflows at 390px; no console errors. Plus: the Practice and Challenge studios and the
//   Learning Labs carry the stage bar; axe (WCAG 2.2 AA) on a sample. A missing browser is a SKIP (exit 3; 1 in CI).
//   node tools/verify-math-studio-browser.mjs [--lesson=3-1,6-4]
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { predictItem } from "../assets/math-studio/core.mjs";
import { REPO_ROOT } from "./lib/curriculum-source.mjs";

const registry = JSON.parse(
  readFileSync(join(REPO_ROOT, "data/math-studio/registry.json"), "utf8"),
);
const only = process.argv
  .find((a) => a.startsWith("--lesson="))
  ?.slice(9)
  .split(",");
const ids = registry.lessons.map((l) => l.id).filter((id) => !only || only.includes(id));
const types = {
  ".html": "text/html",
  ".json": "application/json",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
};
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (path.endsWith("/")) path += "index.html";
  let file = resolve(REPO_ROOT, `.${path}`);
  if (!file.startsWith(`${resolve(REPO_ROOT)}/`)) return res.writeHead(403).end();
  if (!existsSync(file)) file = join(REPO_ROOT, "public", path);
  if (!existsSync(file) || !statSync(file).isFile()) return res.writeHead(404).end();
  res
    .writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream" })
    .end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}`;

let browser;
try {
  browser = await chromium.launch(
    process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  );
} catch (e) {
  console.log(`SKIP verify-math-studio-browser: no browser (${e.message.split("\n")[0]})`);
  server.close();
  process.exit(process.env.CI ? 1 : 3);
}
const failures = [];
const fail = (id, msg) => failures.push(`${id}: ${msg}`);
let checks = 0;
const ok = (cond, id, msg) => {
  checks++;
  if (!cond) fail(id, msg);
};
const data = (id) =>
  JSON.parse(
    readFileSync(join(REPO_ROOT, `math/studio/${id}/index.html`), "utf8").match(
      /<script type="application\/json" id="ms-data">([\s\S]*?)<\/script>/,
    )[1],
  );

async function lesson(ctx, id) {
  const L = data(id);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" &&
      !/favicon|Failed to load resource/.test(m.text()) &&
      errors.push(m.text()),
  );
  page.on(
    "response",
    (r) =>
      r.status() >= 400 &&
      !/favicon|\/api\//.test(r.url()) &&
      errors.push(`${r.status()} ${r.url()}`),
  );
  await page.goto(`${base}/math/studio/${id}/`);
  // Explore opens on the Start card; the model mounts only after "Start exploring".
  await page.waitForSelector("#ms-begin", { timeout: 15000 });
  ok(await page.$eval("#ms-explore-body", (el) => el.hidden), id, "model showed before Start");
  await page.click("#ms-begin");
  await page
    .waitForSelector("#ms-model .model-workspace, #ms-model .ms-parts, #ms-model .ms-x", {
      timeout: 15000,
    })
    .catch(() => fail(id, "model did not mount"));
  // Background knowledge: the key card opens the panel on a plain page load (it once opened only after the language
  // button was pressed), each skill has its picture, and the quick check answers right and wrong.
  ok(L.background?.length >= 1, id, "no background knowledge for this lesson");
  await page.click("#ms-bg-open");
  await page
    .waitForSelector("#ms-bg-dialog[open] .ms-bg-skill", { timeout: 5000 })
    .catch(() => fail(id, "Background knowledge did not open"));
  const skillCards = (await page.$$("#ms-bg-dialog .ms-bg-skill")).length;
  ok(
    skillCards === L.background.length,
    id,
    `background shows ${skillCards} of ${L.background.length} skills`,
  );
  await page
    .waitForSelector("#ms-bg-dialog .ms-bg-figure svg", { timeout: 5000 })
    .catch(() => fail(id, "background picture did not draw"));
  for (let k = 0; k < L.background.length; k++) {
    await page.$eval(`#ms-bg-dialog [data-skill="${k}"]`, (el) => {
      el.hidden = false;
    });
    while (await page.$(`#ms-bg-dialog [data-skill="${k}"] [data-bg-next]:not([hidden])`))
      await page.click(`#ms-bg-dialog [data-skill="${k}"] [data-bg-next]`);
    const c = L.background[k].check;
    const wrong = [0, 1, 2].find((i) => i !== c.correctIdx);
    await page.check(`#ms-bg-dialog [data-skill="${k}"] input[value="${wrong}"]`);
    await page.click(`#ms-bg-dialog [data-skill="${k}"] [data-act="check"]`);
    ok(
      (
        await page.$eval(`#ms-bg-dialog [data-skill="${k}"] .ms-feedback`, (el) => el.innerText)
      ).trim().length > 0,
      id,
      `background skill ${k + 1}: no feedback on a wrong answer`,
    );
  }
  await page.click("#ms-bg-dialog [data-bg-close]");
  ok(await page.$eval("#ms-bg-dialog", (el) => !el.open), id, "Background knowledge did not close");
  // Every stage: visible, lesson content, only one shown.
  for (const stage of ["explore", "understand", "practice", "apply", "reflect"]) {
    await page.click(`.ms-stagebar [data-stage-link="${stage}"]`);
    const shown = await page.$$eval(".ms-stage", (els) =>
      els.filter((e) => !e.hidden).map((e) => e.id),
    );
    ok(shown.length === 1 && shown[0] === stage, id, `stage ${stage}: shown ${shown}`);
    const words = await page.$eval(`#${stage}`, (el) => el.innerText.trim().split(/\s+/).length);
    // Every stage but Practice opens on one short step or card and builds from there, so it needs fewer words up front.
    const min = stage === "practice" ? 60 : 25;
    ok(words > min, id, `stage ${stage} nearly empty (${words} words)`);
    ok(page.url().endsWith(`#${stage}`), id, `hash not ${stage}`);
  }
  ok(
    await page.$eval(
      "#understand",
      (el, line) => el.textContent.includes(line),
      L.understand.iDo.lines[0].slice(0, 30),
    ),
    id,
    "worked example missing",
  );
  // Practice: a wrong answer gets feedback; a hint opens.
  await page.click('.ms-stagebar [data-stage-link="practice"]');
  const first = L.practice.regular[0];
  if (first.kind === "mc") {
    const wrong = first.correct === 0 ? 1 : 0;
    await page.check(`#ms-runner input[value="${wrong}"]`);
    await page.click('#ms-runner [data-act="check"]');
    ok(
      await page.$eval(
        "#ms-runner .ms-feedback",
        (el) => el.classList.contains("ms-no") && el.innerText.length > 10,
      ),
      id,
      "wrong answer gave no feedback",
    );
    if (first.hints?.length) {
      const hintBtn = await page.$('#ms-runner [data-act="hint"]:not([hidden])');
      if (hintBtn) {
        await hintBtn.click();
        ok((await page.$$("#ms-runner .ms-hint")).length >= 1, id, "hint did not show");
      }
    }
    await page.check(`#ms-runner input[value="${first.correct}"]`);
    await page.click('#ms-runner [data-act="check"]');
    ok(
      await page.$eval("#ms-runner .ms-feedback", (el) => el.classList.contains("ms-ok")),
      id,
      "right answer not accepted",
    );
  }
  // Practice -> model -> back, on a verified hand-off.
  // Vocabulary: lesson words are underlined, and a word opens its card (English and Spanish), Escape closes it.
  if (L.vocabLinks) {
    await page.click('.ms-stagebar [data-stage-link="understand"]');
    // On 6-5 the words are step 2 (the parts come first), so open the card without walking the steps.
    await page.$eval("#understand .ms-flip", (el) => el.click());
    const card = await page.$eval(".ms-vpop", (el) => (el.hidden ? "" : el.innerText));
    ok(card.includes(L.understand.vocabulary[0].term), id, "word card did not open");
    await page.keyboard.press("Escape");
    ok(await page.$eval(".ms-vpop", (el) => el.hidden), id, "word card did not close");
    ok((await page.$$(".ms-term-link")).length > 0, id, "no underlined lesson words");
  }
  // Understand builds one step at a time: only step 1 shows, and Continue opens the next.
  await page.click('.ms-stagebar [data-stage-link="understand"]');
  const visible = () =>
    page.$$eval("#understand [data-ustep]", (els) => els.filter((e) => !e.hidden).length);
  ok((await visible()) === 1, id, "Understand did not start on one step");
  await page.click('#understand [data-ustep="0"] [data-ucontinue]');
  ok((await visible()) === 2, id, "Continue did not open the next Understand step");
  // Apply and Reflect: one card at a time, Next moves on.
  for (const [stage, sel] of [
    ["apply", "#apply .ms-task"],
    ["reflect", "#ms-reflect > .ms-reflect-item, #ms-reflect > .ms-item"],
  ]) {
    await page.click(`.ms-stagebar [data-stage-link="${stage}"]`);
    const shownCards = () => page.$$eval(sel, (els) => els.filter((e) => !e.hidden).length);
    ok((await shownCards()) === 1, id, `${stage}: more than one card shown`);
    if (await page.$(`#${stage} .ms-pager`)) {
      const first = await page.$eval(sel, (el) => !el.hidden);
      await page.click(`#${stage} .ms-pager [data-page="1"]`);
      ok(
        first && !(await page.$eval(sel, (el) => !el.hidden)),
        id,
        `${stage}: Next did not move on`,
      );
      await page.click(`#${stage} .ms-pager [data-page="-1"]`);
    }
  }
  const level = L.practice.regular.find((i) => i.model)
    ? "regular"
    : L.practice.challenge.find((i) => i.model)
      ? "challenge"
      : null;
  if (level) {
    const item = L.practice[level].find((i) => i.model);
    await page.click('.ms-stagebar [data-stage-link="practice"]');
    await page.click(`.ms-levels [data-level="${level}"]`);
    await page.click(`#ms-runner [data-jump="${item.id}"]`);
    await page.click('#ms-runner [data-act="model"]');
    ok(await page.$eval("#ms-handoff", (el) => !el.hidden), id, "hand-off banner missing");
    const values = await page.$$eval("#ms-model [data-control]", (els) =>
      els.map((e) => Number(e.value)),
    );
    const want = item.model.values.filter((_, i) => i < values.length);
    ok(
      JSON.stringify(values) === JSON.stringify(want.slice(0, values.length)),
      id,
      `model opened on ${values}, wanted ${want}`,
    );
    await page.click("#ms-return");
    ok(page.url().endsWith("#practice"), id, "return did not go to practice");
    ok(await page.$(`#ms-runner [data-item="${item.id}"]`), id, "return lost the question");
  }
  // Model -> practice -> transfer.
  await page.click('.ms-stagebar [data-stage-link="explore"]');
  if (L.explore?.kind === "expression-parts") await partsPath(page, L, id);
  else if (L.explore && L.explore.kind !== "lab-model") await explorerPath(page, L, id);
  else await labModelPath(page, L, id);
  // Write something, reload, expect it back on the same stage.
  await page.fill("#ms-notes", "It will double.");
  await page.waitForTimeout(250);
  await page.reload();
  await page
    .waitForSelector("#ms-model .model-workspace, #ms-model .ms-parts, #ms-model .ms-x", {
      timeout: 15000,
    })
    .catch(() => {});
  ok((await page.inputValue("#ms-notes")) === "It will double.", id, "notes not restored");
  ok(await page.$eval("#ms-resume", (el) => !el.hidden), id, "no resume prompt after reload");
  // Spanish.
  await page.click("#ms-lang");
  ok(
    await page.$eval(".t-es", (el) => getComputedStyle(el).display !== "none"),
    id,
    "Spanish did not show",
  );
  await page.click("#ms-lang");
  ok(errors.length === 0, id, `console: ${errors.slice(0, 3).join(" | ")}`);
  await page.close();
}

/** Lab model: the model's own readout question, then a transfer question appears. */
async function labModelPath(page, L, id) {
  await page.click("#ms-make-question");
  const values = await page.$$eval("#ms-model [data-control]", (els) =>
    els.map((e) => Number(e.value)),
  );
  const full = [...(L.explore?.model || L.lab.model).values];
  values.forEach((v, i) => {
    full[i] = v;
  });
  const q = predictItem(L.explore?.model || L.lab.model, full, id);
  if (q) {
    await page.fill("#ms-test-out .ms-test__a input", String(Number(q.answer.toFixed(4))));
    await page.click('#ms-test-out .ms-test__a [data-act="check"]');
    ok(
      await page.$eval("#ms-test-out .ms-test__a .ms-feedback", (el) =>
        el.classList.contains("ms-ok"),
      ),
      id,
      `model question rejected ${q.answer}`,
    );
  }
  ok(
    await page.waitForSelector("#ms-test-out .ms-test__b .ms-item", { timeout: 3000 }).then(
      () => true,
      () => false,
    ),
    id,
    "no transfer question after the model question",
  );
}

/** Parts of an Expression: every part is labelled; naming, editing, evaluating; its questions unlock in order. */
/** A lesson explorer: it mounts, its first question accepts the answer its own code computes, the next one unlocks. */
async function explorerPath(page, L, id) {
  const mod = await import(`../assets/math-studio/${L.explore.kind}.mjs`);
  const qs = mod.questions(mod.initialState(L.explore), id, L.explore.cards);
  ok(qs.length >= 1, id, "explorer made no questions");
  await page.click("#ms-make-question");
  const first = qs[0];
  const slot = '#ms-test-out [data-q="0"]';
  if (first.kind === "mc") await page.check(`${slot} input[value="${first.correct}"]`);
  else await page.fill(`${slot} input`, String(first.answer));
  await page.click(`${slot} [data-act="check"]`);
  ok(
    await page.$eval(`${slot} .ms-feedback`, (el) => el.classList.contains("ms-ok")),
    id,
    `${L.explore.kind}: first question rejected its own answer ${first.answer ?? first.correct}`,
  );
  ok(
    await page.$eval('#ms-test-out [data-q="1"]', (el) => !el.hidden),
    id,
    `${L.explore.kind}: next question did not unlock`,
  );
  ok(
    (await page.$eval("#explore", (el) => el.innerText)).includes(L.explore.title),
    id,
    "explorer title missing",
  );
}

async function partsPath(page, L, id) {
  const x = L.explore;
  // Learn: one part at a time, then name them, then build.
  ok(
    (await page.$eval("#ms-model .ms-parts__say", (el) => el.innerText)).includes("coefficient"),
    id,
    "walkthrough does not start with the coefficient",
  );
  ok(
    await page.$eval(".ms-explore", (el) => el.classList.contains("is-learning")),
    id,
    "questions shown while learning the parts",
  );
  for (let i = 0; i < 4; i++) await page.click('#ms-model [data-step="1"]');
  await page.click("#ms-model .ms-tok--constant");
  ok(
    await page.$eval("#ms-model .ms-parts__fb", (el) => el.classList.contains("is-no")),
    id,
    "tapping the constant when asked for the coefficient was not corrected",
  );
  await page.click("#ms-model .ms-tok--coefficient");
  ok(
    await page.$eval("#ms-model .ms-parts__fb", (el) => el.classList.contains("is-ok")),
    id,
    "tapping the coefficient was not accepted",
  );
  for (const part of ["variable", "constant", "constant"]) {
    await page.waitForTimeout(1000);
    await page.click(`#ms-model .ms-tok--${part}`);
  }
  await page.click('#ms-model [data-to="build"]:not([hidden])', { timeout: 5000 });
  const legend = await page.$eval("#ms-model .ms-legend", (el) => el.innerText);
  for (const word of ["Coefficient", "Variable", "Constant", "Terms"])
    ok(legend.includes(word), id, `parts legend missing ${word}`);
  ok((await page.$$("#ms-model .ms-term")).length === 2, id, "expected two terms");
  ok(
    (await page.$eval("#ms-model .ms-parts__eval", (el) => el.innerText)).includes(
      String(x.a * x.v + x.b),
    ),
    id,
    "evaluation wrong",
  );
  await page.fill('#ms-model [data-k="a"]', "1");
  ok(
    (await page.$$("#ms-model .ms-tok--coefficient")).length === 0,
    id,
    "a coefficient of 1 is still written",
  );
  ok(
    (await page.$eval("#ms-model .ms-legend", (el) => el.innerText)).includes("not written"),
    id,
    "coefficient 1 not explained",
  );
  await page.click("#ms-model [data-reset]");
  await page.click("#ms-make-question");
  await page.fill('#ms-test-out [data-q="0"] input', String(x.a));
  await page.click('#ms-test-out [data-q="0"] [data-act="check"]');
  ok(
    await page.$eval('#ms-test-out [data-q="0"] .ms-feedback', (el) =>
      el.classList.contains("ms-ok"),
    ),
    id,
    "coefficient question rejected the coefficient",
  );
  ok(
    await page.$eval('#ms-test-out [data-q="1"]', (el) => !el.hidden),
    id,
    "next parts question did not unlock",
  );
  await page.click('.ms-stagebar [data-stage-link="understand"]');
  for (const part of ["coefficient", "variable", "constant"])
    await page.click(`#understand [data-fig-part="${part}"]`);
  const fig = await page.$eval("#understand .ms-partsfig", (el) => el.innerText);
  for (const word of ["Coefficient", "Variable", "Constant", "Terms"])
    ok(fig.includes(word), id, `Understand parts figure missing ${word} after tapping`);
  const vocab = await page.$eval("#understand .ms-words", (el) => el.textContent);
  for (const word of ["Coefficient", "Variable", "Constant", "Term"])
    ok(vocab.includes(word), id, `vocabulary missing ${word}`);
  await page.click('.ms-stagebar [data-stage-link="explore"]');
}

const desktop = await browser.newContext({ viewport: { width: 1366, height: 800 } });
for (const id of ids)
  await lesson(desktop, id).catch((e) =>
    fail(id, `crashed: ${e.message.split("\n").slice(0, 12).join(" ")}`),
  );

// Phone width: no horizontal scroll on any stage (sample of one lesson per unit).
const phone = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});
const perUnit = [
  ...new Map(
    registry.lessons.filter((l) => ids.includes(l.id)).map((l) => [l.unit, l.id]),
  ).values(),
];
for (const id of perUnit) {
  const page = await phone.newPage();
  await page.goto(`${base}/math/studio/${id}/`);
  await page
    .waitForSelector("#ms-model .model-workspace, #ms-model .ms-parts, #ms-model .ms-x", {
      timeout: 15000,
    })
    .catch(() => {});
  for (const stage of ["explore", "understand", "practice", "apply", "reflect"]) {
    await page.click(`.ms-stagebar [data-stage-link="${stage}"]`);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    ok(over <= 1, id, `390px ${stage}: ${over}px horizontal overflow`);
  }
  await page.close();
}

// Accessibility: axe on every stage of a sample.
for (const id of perUnit.slice(0, 4)) {
  const page = await desktop.newPage();
  await page.goto(`${base}/math/studio/${id}/`);
  await page
    .waitForSelector("#ms-model .model-workspace, #ms-model .ms-parts, #ms-model .ms-x", {
      timeout: 15000,
    })
    .catch(() => {});
  for (const stage of ["explore", "understand", "practice", "apply", "reflect"]) {
    await page.click(`.ms-stagebar [data-stage-link="${stage}"]`);
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .include(".ms-stagebar")
      .include("main")
      .analyze();
    const bad = r.violations.filter((v) => ["serious", "critical"].includes(v.impact));
    ok(
      bad.length === 0,
      id,
      `axe ${stage}: ${bad.map((v) => `${v.id} (${v.nodes[0]?.target})`).join(", ")}`,
    );
  }
  // Keyboard: the stage bar is reachable and moves focus to the stage heading.
  await page.focus('.ms-stagebar [data-stage-link="apply"]');
  await page.keyboard.press("Enter");
  ok(
    await page.evaluate(() => document.activeElement?.id === "h-apply"),
    id,
    "keyboard stage change did not focus the heading",
  );
  await page.close();
}

// The existing surfaces carry the bar and still load.
for (const l of registry.lessons.filter((x) => ids.includes(x.id))) {
  for (const url of [l.practice.regular, l.practice.challenge]) {
    const html = readFileSync(join(REPO_ROOT, url.replace(/^\//, ""), "index.html"), "utf8");
    ok(
      html.includes(`href="/math/studio/${l.id}/#explore"`),
      l.id,
      `${url} has no Learning Lab stage bar`,
    );
  }
  const lab = readFileSync(join(REPO_ROOT, l.lab.href.replace(/^\//, ""), "index.html"), "utf8");
  // A lesson with its own Explore model is (correctly) not advertised on the shared lab.
  ok(
    l.ownExplore || lab.includes(`/math/studio/${l.id}/#explore`),
    l.id,
    `${l.lab.href} has no link to this lesson's Learning Lab`,
  );
}
for (const url of [
  registry.lessons.find((l) => l.id === (ids[0] || "3-1")).practice.regular,
  "/math/unit-4/4-2-practice-studio/",
  "/curriculum/learning-labs/recipe-remix/",
]) {
  const page = await desktop.newPage();
  const errors = [];
  // web-vitals is a bare npm specifier Vite resolves at build time; served from source it cannot resolve (CLAUDE.md, smoke:injection).
  page.on("pageerror", (e) => !/web-vitals/.test(e.message) && errors.push(e.message));
  await page.goto(base + url);
  await page.waitForTimeout(800);
  ok(await page.$(".ms-stagebar"), url, "stage bar not rendered");
  ok(errors.length === 0, url, `page errors: ${errors.join(" | ")}`);
  await page.close();
}

await browser.close();
server.close();
if (failures.length) {
  console.error(`FAIL verify-math-studio-browser: ${failures.length} of ${checks} checks failed`);
  for (const f of failures.slice(0, 60)) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`PASS verify-math-studio-browser: ${checks} checks across ${ids.length} lessons`);

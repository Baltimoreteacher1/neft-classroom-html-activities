#!/usr/bin/env node
/**
 * Document fitting in a real browser. Every claim is checked against a physical PDF, not against the estimate:
 *   - a 12-question worksheet fits two pages; a 5-question one fits one page (page.pdf() + pdfinfo)
 *   - large print is bigger than standard, over 14pt, and nothing is clipped (also on every block and format)
 *   - an impossible one-page request for 30 questions is ok:false with a working alternative
 *   - no heading is stranded at the bottom of a printed page (pdftotext, page by page)
 *   - the answer key never appears in a student sheet, and no fit ever goes under the 11pt floor
 *   - half-page and two-per-page really fit, twice per page, nothing cut off
 *   - the Fit panel (editor/fit-panel.js) in a browser: goals by keyboard, scaled page previews equal to the real
 *     page count, a Print button that hands over the options, Spanish, 375px, 44px targets
 * Serves the source tree. A missing browser is a SKIP locally and a FAIL in CI (poppler is required too).
 *   node tools/studio-x-fit-e2e.mjs
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import {
  richWorksheet,
  sentinelWorksheet,
} from "../access-practice-lab/src/studio/print/fixtures.js";
import { FIT_GOAL_IDS, fitDocument } from "../access-practice-lab/src/studio/x/fit.js";
import { inPageChecks } from "../access-practice-lab/src/studio/x/fit-dom.js";
import { sampleWorksheet } from "../access-practice-lab/src/studio/x/fit-fixtures.js";
import { levelOptions, renderFitted } from "../access-practice-lab/src/studio/x/fit-levels.js";
import { serveAccess } from "./lib/access-serve.mjs";

const need = (cmd) => spawnSync("which", [cmd]).status === 0;
let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.warn("studio-x-fit-e2e: SKIP — playwright is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
if (!need("pdfinfo") || !need("pdftotext")) {
  console.warn("studio-x-fit-e2e: SKIP — poppler (pdfinfo, pdftotext) is not installed.");
  process.exit(process.env.CI ? 1 : 0);
}
const { server, base } = await serveAccess();
const browser = await chromium
  .launch(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {})
  .catch((error) => {
    console.warn(`studio-x-fit-e2e: SKIP — no browser (${error.message.split("\n")[0]}).`);
    server.close();
    process.exit(process.env.CI ? 1 : 0);
  });

const dir = mkdtempSync(join(tmpdir(), "fit-e2e-"));
let n = 0;
let checks = 0;
const ok = (cond, msg) => {
  checks++;
  assert.ok(cond, msg);
};

// ── the physical printer ─────────────────────────────────────────────────────

const printer = await browser.newPage();

/** Render `html` at US Letter and return what the printer produced. */
async function print(html) {
  await printer.setContent(html, { waitUntil: "load" });
  await printer.emulateMedia({ media: "print" });
  await printer.evaluate(() => document.fonts.ready);
  const checksIn = await printer.evaluate(inPageChecks);
  const pdf = await printer.pdf({
    format: "Letter",
    preferCSSPageSize: true,
    printBackground: true,
  });
  const file = join(dir, `p${++n}.pdf`);
  writeFileSync(file, pdf);
  const info = spawnSync("pdfinfo", [file], { encoding: "utf8" }).stdout;
  const pages = Number(/Pages:\s+(\d+)/.exec(info)?.[1]);
  const text = Array.from(
    { length: pages },
    (_, i) =>
      spawnSync("pdftotext", ["-f", String(i + 1), "-l", String(i + 1), "-layout", file, "-"], {
        encoding: "utf8",
      }).stdout,
  );
  return { pages, text, ...checksIn };
}

/** measurePages for fitDocument: the real page count, plus height and clipped content. */
const measurePages = async (html) => {
  const r = await print(html);
  return { pages: r.pages, heightIn: r.heightIn, clipped: r.clipped };
};

const studentHtml = (activity, options, lang = "en") =>
  renderFitted(activity, options, { part: "student", lang }).html;
const bodyLines = (pageText) =>
  pageText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^Page \d+ of \d+$/.test(l));

// ── 1. two pages for 12 questions, one page for 5 ────────────────────────────

const twelve = sampleWorksheet(12);
const standard12 = await print(studentHtml(twelve, null));
ok(
  standard12.pages > 2,
  `the 12-question sheet needs more than two pages as it is (${standard12.pages})`,
);
const two = await fitDocument(twelve, "two-pages", { measurePages });
ok(two.ok && two.measured, "12 questions: two-pages succeeds with a measured count");
const two12 = await print(studentHtml(twelve, two.options));
ok(
  two12.pages === 2 && two.pages === 2,
  `12 questions on two physical pages (PDF says ${two12.pages})`,
);
ok(two12.clipped.length === 0, `12 questions: nothing clipped ${two12.clipped}`);
ok(two12.minPt >= 11, `12 questions: smallest text ${two12.minPt}pt is at least 11pt`);

const five = sampleWorksheet(5);
const standard5 = await print(studentHtml(five, null));
const one = await fitDocument(five, "one-page", { measurePages });
ok(one.ok, "5 questions: one-page succeeds");
const one5 = await print(studentHtml(five, one.options));
ok(
  one5.pages === 1,
  `5 questions on ONE physical page (PDF says ${one5.pages}; unfitted ${standard5.pages})`,
);
ok(
  one5.minPt >= 11 && one5.bodyPt >= 11,
  `5 questions: text stays at or above 11pt (${one5.minPt}pt)`,
);
ok(one5.clipped.length === 0, `5 questions: nothing clipped ${one5.clipped}`);

// ── 2. large print is bigger and clips nothing, on every block type and question format ──

const sheets = { sample: five, rich: richWorksheet(), allFormats: allFormats("worksheet") };
for (const [name, a] of Object.entries(sheets)) {
  const std = await print(studentHtml(a, null));
  const large = await fitDocument(a, "large-print", { measurePages });
  const lp = large.ok ? await print(studentHtml(a, large.options)) : null;
  if (!large.ok) {
    ok(
      large.options === null && large.alternative,
      `${name}: a refused large print explains itself`,
    );
    continue;
  }
  ok(
    lp.bodyPt >= 14 && lp.bodyPt > std.bodyPt,
    `${name}: large print body ${lp.bodyPt}pt vs standard ${std.bodyPt}pt`,
  );
  ok(lp.minPt >= 13.9, `${name}: even the labels are ${lp.minPt}pt in large print`);
  ok(lp.pages > std.pages || lp.heightIn > std.heightIn, `${name}: large print takes more room`);
  ok(lp.clipped.length === 0, `${name}: large print clips nothing ${lp.clipped}`);
}

// ── 3. an impossible one-page request ────────────────────────────────────────

const thirty = sampleWorksheet(30);
const no = await fitDocument(thirty, "one-page", { measurePages });
ok(no.ok === false && no.options === null, "30 questions on one page is refused");
ok(
  no.alternative?.options && no.alternative.pages > 1,
  "the refusal carries a working alternative",
);
const altPrint = await print(studentHtml(thirty, no.alternative.options));
ok(
  altPrint.pages === no.alternative.pages,
  `the alternative's page count is the real one (${altPrint.pages})`,
);
ok(
  altPrint.minPt >= 11 && altPrint.clipped.length === 0,
  "the alternative is readable and complete",
);
ok(
  /readable size/.test(no.notes[0].en) && /Better:/.test(no.notes.at(-1).en),
  "the explanation is plain words and offers a better way",
);
ok(
  no.notes.every((x) => x.es && x.es !== x.en),
  "and it is in Spanish too",
);
const twelveOne = await fitDocument(twelve, "one-page", { measurePages });
if (!twelveOne.ok && twelveOne.removeQuestions) {
  const ids = twelve.blocks.filter((b) => b.type === "question").map((b) => b.id);
  const dropped = new Set(twelveOne.removeQuestions.map((k) => ids[k - 1]));
  const trimmed = { ...twelve, blocks: twelve.blocks.filter((b) => !dropped.has(b.id)) };
  const t = await print(studentHtml(trimmed, levelOptions("trim8", trimmed)));
  ok(
    t.pages === 1,
    `removing question(s) ${twelveOne.removeQuestions} really does fit one page (${t.pages})`,
  );
}

// ── 4. headings are never stranded at the bottom of a printed page ────────────

let headingChecks = 0;
for (const count of [7, 13, 19, 25]) {
  const a = sampleWorksheet(count);
  const variants = [
    null,
    levelOptions("trim3", a),
    levelOptions("trim6", a),
    levelOptions("trim8", a),
    levelOptions("large", a),
    levelOptions("spacious", a),
  ];
  for (const o of variants) {
    const r = await print(studentHtml(a, o));
    for (const [i, text] of r.text.entries()) {
      const last = bodyLines(text).at(-1) || "";
      headingChecks++;
      ok(
        !/^Part \d+: More practice$/.test(last),
        `${count} questions, ${o?.level ?? "standard"}: page ${i + 1} ends on the heading "${last}"`,
      );
    }
  }
}

// ── 5. the answer key never reaches a student sheet ──────────────────────────

const sentinel = sentinelWorksheet();
const LEAK =
  /ZQ(?:HINT|EXPL|MISC|NOTE|SAMPLE|RUBRIC|ACCEPT|SCRIPT)|zqalpha|zqbeta|zqcell|98765|TEACHER COPY|Answer key/i;
for (const goal of FIT_GOAL_IDS) {
  const r = await fitDocument(sentinel, goal, { measurePages });
  const options = r.options ?? r.alternative?.options;
  ok(options, `${goal}: has something to print`);
  const printed = await print(studentHtml(sentinel, options));
  ok(!LEAK.test(printed.text.join("\n")), `${goal}: no answer or key text on the student pages`);
  ok(printed.minPt >= 11 || options.large, `${goal}: nothing under 11pt (${printed.minPt}pt)`);
}
const all = await print(
  renderFitted(sentinel, levelOptions("trim5", sentinel), { part: "all" }).html,
);
const keyAt = all.text.findIndex((t) => /TEACHER COPY/.test(t));
ok(
  keyAt > 0 && all.text.slice(0, keyAt).every((t) => !LEAK.test(t)),
  "with the teacher copy attached, the key starts on its own page after every student page",
);

// ── 6. half page and two per page ────────────────────────────────────────────

const small = sampleWorksheet(2);
for (const goal of ["half-page", "two-per-page"]) {
  const r = await fitDocument(small, goal, { measurePages });
  ok(r.ok, `${goal}: a 2-question sheet fits`);
  const p = await print(studentHtml(small, r.options));
  ok(p.pages === 1, `${goal}: one physical page (${p.pages})`);
  ok(p.clipped.length === 0, `${goal}: nothing cut off ${p.clipped}`);
  ok(p.minPt >= 11, `${goal}: ${p.minPt}pt`);
  const copies = (p.text[0].match(/Which ratio is equivalent to 1:2\?/g) || []).length;
  ok(copies === (goal === "two-per-page" ? 2 : 1), `${goal}: ${copies} copies on the page`);
}
const tooBig = await fitDocument(twelve, "two-per-page", { measurePages });
ok(
  !tooBig.ok && tooBig.alternative,
  "12 questions cannot print two to a page, and the refusal offers a way forward",
);

// ── 7. every goal, every size: the printed result matches what was promised ───

for (const count of [1, 5, 12]) {
  const a = sampleWorksheet(count);
  for (const goal of FIT_GOAL_IDS) {
    const r = await fitDocument(a, goal, { measurePages });
    if (!r.ok) {
      ok(
        r.options === null && (r.alternative || r.notes.length),
        `${count}/${goal}: a refusal is explained`,
      );
      continue;
    }
    const p = await print(studentHtml(a, r.options));
    const wanted = { "one-page": 1, "two-pages": 2, "half-page": 1, "two-per-page": 1 }[goal];
    if (wanted)
      ok(p.pages <= wanted, `${count}/${goal}: ${p.pages} pages, wanted at most ${wanted}`);
    ok(p.pages === r.pages, `${count}/${goal}: promised ${r.pages} pages, printed ${p.pages}`);
    ok(p.clipped.length === 0, `${count}/${goal}: nothing clipped ${p.clipped}`);
    ok(p.minPt >= (r.options.large ? 13.9 : 11), `${count}/${goal}: smallest text ${p.minPt}pt`);
  }
}

// ── 8. the Fit panel in a browser ────────────────────────────────────────────

async function panelChecks() {
  const context = await browser.newContext({ viewport: { width: 1000, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on(
    "console",
    (m) =>
      m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()),
  );
  await page.route(`${base}/__fit.html`, (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang=en><head><meta name=viewport content="width=device-width,initial-scale=1"><link rel=stylesheet href="/access-practice-lab/ds.css"><link rel=stylesheet href="/access-practice-lab/studio-editor.css"></head><body><main id=root class=st-root></main></body></html>`,
    }),
  );
  await page.goto(`${base}/__fit.html`);
  const LAB = "/access-practice-lab/src/studio";
  const mount = async (lang, activity) =>
    page.evaluate(
      async ({ LAB, lang, activity }) => {
        const { createFitPanel } = await import(`${LAB}/editor/fit-panel.js`);
        document.getElementById("root").replaceChildren();
        window.printed = [];
        const S = (en, es) => (lang === "es" ? es : en);
        const panel = createFitPanel({
          S,
          lang,
          getActivity: () => activity,
          onPrint: (o) => window.printed.push(o),
        });
        document.getElementById("root").append(panel.el);
      },
      { LAB, lang, activity },
    );

  await mount("en", twelve);
  await page.locator(".st-fit-pages .st-fit-page").first().waitFor({ timeout: 20000 });
  ok(
    (await page.locator(".st-fit-pages .st-fit-page").count()) === standard12.pages,
    "before any choice the panel shows the sheet as it prints now, at its real page count",
  );

  // by keyboard: focus the first goal, arrow to "two pages", the preview and notes follow
  await page.getByRole("radio").first().focus();
  await page.keyboard.press("ArrowDown");
  ok(
    (await page.getByRole("radio", { name: /two pages/i }).isChecked()) === true,
    "arrow keys move between goals",
  );
  await page.waitForFunction(
    () => /Ready: /.test(document.querySelector(".st-status")?.textContent || ""),
    null,
    { timeout: 30000 },
  );
  const thumbs = await page.locator(".st-fit-pages .st-fit-page").count();
  ok(
    thumbs === two12.pages,
    `the preview has ${thumbs} page frames; the printed PDF has ${two12.pages}`,
  );
  const notesText = await page.locator(".st-fit-notes").innerText();
  ok(
    /never goes below 11pt|normal 13pt|11pt/.test(notesText) &&
      /answer key stays on the teacher copy/.test(notesText),
    "notes say what changed in plain words",
  );
  const frames = await page
    .locator(".st-fit-page iframe")
    .evaluateAll((fs) =>
      fs.map((f) => ({ sandbox: f.getAttribute("sandbox"), doc: f.getAttribute("srcdoc") })),
    );
  ok(
    frames.every((f) => f.sandbox === "" && f.doc.includes('class="problem"')),
    "page previews are inert frames of the real print page",
  );
  ok(
    frames.every((f) => !/ZQ|TEACHER COPY/.test(f.doc)),
    "previews never carry the key",
  );
  await page.getByRole("button", { name: "Print" }).click();
  const printed = await page.evaluate(() => window.printed);
  ok(
    printed.length === 1 && printed[0].bodyPt >= 11 && printed[0].level,
    "Print hands the chosen options to onPrint",
  );
  ok(
    JSON.stringify(printed[0]) === JSON.stringify(two.options),
    "and they are the same options fitDocument chose against the PDF",
  );

  // the browser's own measurement agrees with the physical PDF
  const agreement = await page.evaluate(
    async ({ LAB, htmls }) => {
      const { measureHtml } = await import(`${LAB}/x/fit-dom.js`);
      const out = [];
      for (const html of htmls) out.push((await measureHtml(html)).pages);
      return out;
    },
    {
      LAB,
      htmls: [
        studentHtml(twelve, null),
        studentHtml(twelve, two.options),
        studentHtml(five, one.options),
        studentHtml(thirty, no.alternative.options),
      ],
    },
  );
  const truth = [standard12.pages, two12.pages, one5.pages, altPrint.pages];
  ok(
    JSON.stringify(agreement) === JSON.stringify(truth),
    `in-browser page counts ${agreement} equal real PDF counts ${truth}`,
  );

  // an impossible request: the panel explains and offers the alternative with one button
  await mount("en", thirty);
  await page.getByRole("radio", { name: /one page/i }).check();
  await page.waitForFunction(
    () => /cannot be done/.test(document.querySelector(".st-status")?.textContent || ""),
    null,
    { timeout: 30000 },
  );
  ok(
    await page.getByRole("button", { name: "Print" }).isDisabled(),
    "Print is disabled when the goal cannot be met",
  );
  ok(
    /A better choice/.test(await page.locator(".st-fit-alt").innerText()),
    "the panel shows the better choice",
  );
  await page.getByRole("button", { name: /Use .* instead/ }).click();
  await page.waitForFunction(
    () => /Ready: /.test(document.querySelector(".st-status")?.textContent || ""),
    null,
    { timeout: 30000 },
  );
  ok(
    await page.getByRole("button", { name: "Print" }).isEnabled(),
    "the alternative can be printed",
  );

  // Spanish, phone width, target size
  await mount("es", twelve);
  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole("radio", { name: /dos páginas/i }).check();
  await page.waitForFunction(
    () => /Listo: /.test(document.querySelector(".st-status")?.textContent || ""),
    null,
    { timeout: 30000 },
  );
  ok(
    /nunca baja de 11 pt|11 pt/.test(await page.locator(".st-fit-notes").innerText()),
    "Spanish notes",
  );
  ok(
    !(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)),
    "no horizontal scroll at 375px",
  );
  const small = await page
    .locator(".st-fit-goal, .st-fit button")
    .evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height < 43.5).length);
  ok(small === 0, `every goal and button is at least 44px tall (${small} are not)`);
  ok(errors.length === 0, `no console errors: ${errors.join("; ")}`);
  await context.close();
}

try {
  await panelChecks();
  console.log(
    `studio-x-fit-e2e: ${checks} checks passed (${headingChecks} printed pages checked for stranded headings).`,
  );
} catch (error) {
  console.error(`studio-x-fit-e2e: FAIL after ${checks} checks\n${error.stack || error}`);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}

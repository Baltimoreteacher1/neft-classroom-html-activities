// Activity Studio printable worksheet: every format renders, the STUDENT copy carries no answers (in text, markup
// or attributes), the key carries all of them, output is deterministic and escaped, Spanish and bilingual work, and
// the real PDF (Playwright Chromium + poppler) has sensible pages, 11pt+ text and no orphan or blank page.
//   node --test tools/studio-print.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, test } from "node:test";
import { answerText, marksOf, tableBlanks } from "../access-practice-lab/src/studio/core/check.js";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import {
  FORMATS,
  normalizeActivity,
  questionsOf,
} from "../access-practice-lab/src/studio/core/schema.js";
import {
  richWorksheet,
  sentinelWorksheet,
} from "../access-practice-lab/src/studio/print/fixtures.js";
import { openPrint } from "../access-practice-lab/src/studio/print/open-print.js";
import { shuffled } from "../access-practice-lab/src/studio/print/paper-model.js";
import {
  renderWorksheetHtml,
  renderWorksheetParts,
} from "../access-practice-lab/src/studio/print/worksheet.js";
import { textSizes } from "../scripts/lib/pdf-text-sizes.mjs";

const squash = (s) => String(s).replace(/\s+/g, "");
const plainFrac = (s) => String(s).replace(/\{(-?[^{}/\s]+)\/([^{}/\s]+)\}/g, "$1/$2");

/** Visible text of a worksheet document: stacked fractions become n/d, tags and style are dropped. */
function textOf(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<title>[\s\S]*?<\/title>/g, " ")
    .replace(/<span class="fn">(.*?)<\/span><span class="fd">(.*?)<\/span>/g, "$1/$2")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
}
const has = (text, needle) => squash(text).includes(squash(plainFrac(needle)));
const keyHalf = (html) => html.slice(html.indexOf('class="sheet key"'));
const studentHalf = (html) =>
  html.slice(
    0,
    html.indexOf('class="sheet key"') >= 0 ? html.indexOf('class="sheet key"') : undefined,
  );

// assert.match/doesNotMatch print the whole document on failure; these print only the pattern.
const yes = (text, re, msg = "") =>
  assert.ok(re.test(text), `expected ${re}${msg ? ` (${msg})` : ""}`);
const no = (text, re, msg = "") =>
  assert.ok(!re.test(text), `unexpected ${re}${msg ? ` (${msg})` : ""}`);

const fixture = allFormats("worksheet");
const LANGS = ["en", "es", "bi"];

describe("every format has a paper form", () => {
  test("the all-formats fixture covers every format and renders one problem each", () => {
    const html = renderWorksheetHtml(fixture, { part: "student" });
    assert.deepEqual(new Set(questionsOf(fixture).map((q) => q.format)), new Set(FORMATS));
    assert.equal((html.match(/class="problem"/g) || []).length, FORMATS.length);
    assert.ok(html.startsWith("<!doctype html>"));
  });

  const markers = {
    choice: /class="bubble"/,
    multi: /class="check"/,
    match: /class="match"/,
    sort: /class="sorttable"/,
    order: /class="slots"/,
    blank: /class="blank"/,
    number: /class="workbox/,
    short: /class="rule"/,
    identify: /class="circle"/,
    hotspot: /class="region"/,
    numberline: /class="fig numberline"/,
    build: /class="cards"/,
    error: /class="steps"/,
    fillTable: /class="datatable/,
    plot: /class="fig grid"/,
  };
  for (const format of FORMATS) {
    test(`${format} prints its paper structure`, () => {
      const q = questionsOf(fixture).find((x) => x.format === format);
      const one = normalizeActivity({ ...fixture, blocks: [q] });
      const html = renderWorksheetHtml(one, { part: "student" });
      yes(html, markers[format], format);
      yes(html, /<ol|<ul|<div|<table|<svg|<p/);
    });
  }

  test("numbered problems, headings, lang and accessible figures", () => {
    const html = renderWorksheetHtml(richWorksheet(), { part: "student" });
    yes(html, /<html lang="en">/);
    yes(html, /<h1 id="ws-title">/);
    yes(html, /<h2[^>]*>Key words<\/h2>/);
    yes(html, /<svg class="fig numberline" [^>]*role="img" aria-label="Number line from 0 to 2/);
    yes(html, /<svg class="fig grid" [^>]*role="img" aria-label="Coordinate grid from -4 to 4/);
    yes(html, /alt="A field with a sun"/);
    yes(html, /<sup>2<\/sup>/);
    yes(html, /class="frac" role="math" aria-label="3 over 4"/);
    yes(html, /<th scope="col">/);
    assert.equal((html.match(/class="problem"/g) || []).length, 7);
  });

  test("page rules: Letter, 0.75in margins, avoid breaks inside a problem, page numbers", () => {
    const html = renderWorksheetHtml(fixture, { part: "student" });
    yes(html, /@page\{size:Letter;margin:\.75in\}/);
    yes(html, /\.problem\{break-inside:avoid/);
    yes(html, /counter\(page\)/);
    yes(html, /body\{[^}]*font:13pt/);
  });

  test("a roomy workspace and a normal one differ; frames and visuals are honoured", () => {
    const roomy = renderWorksheetHtml(richWorksheet(), { part: "student" });
    const normal = renderWorksheetHtml(richWorksheet({ options: { workspace: "normal" } }), {
      part: "student",
    });
    yes(roomy, /class="workbox roomy"/);
    yes(normal, /class="workbox normal"/);
    assert.ok(
      (roomy.match(/class="rule"/g) || []).length > (normal.match(/class="rule"/g) || []).length,
    );
    yes(roomy, /Both amounts are ___ by ___\./);
    const noFrames = renderWorksheetHtml(
      richWorksheet({ supports: { spanish: true, visuals: true, frames: false } }),
      { part: "student" },
    );
    no(noFrames, /Both amounts are/);
    const noVisuals = renderWorksheetHtml(
      richWorksheet({ supports: { spanish: true, visuals: false, frames: true } }),
      { part: "student" },
    );
    no(noVisuals, /class="pictd"/);
    yes(roomy, /class="pictd"/);
  });
});

describe("the student copy has no answers", () => {
  const forbiddenMarkup = [
    /aria-hidden/i,
    /sr-only/i,
    /visually-?hidden/i,
    /display:\s*none/i,
    /\shidden[\s>]/i,
    /\sdata-[a-z]/i,
    /<script/i,
    /TEACHER COPY/i,
    /<template/i,
  ];

  for (const lang of LANGS) {
    test(`student markup is clean (${lang})`, () => {
      for (const act of [fixture, richWorksheet(), sentinelWorksheet()]) {
        const html = renderWorksheetHtml(act, { part: "student", lang });
        for (const bad of forbiddenMarkup) no(html, bad, `${act.id} ${lang} ${bad}`);
        no(html, /class="sheet key"/);
      }
    });

    test(`no answerText() string and no teacher field appears (${lang})`, () => {
      for (const act of [fixture, richWorksheet(), sentinelWorksheet()]) {
        const text = textOf(renderWorksheetHtml(act, { part: "student", lang }));
        const shared = act.blocks
          .filter(
            (b) =>
              !["note", "audio"].includes(b.type) &&
              !(b.type === "question" && b.format === "blank"),
          )
          .map((b) => (b.type === "question" ? "" : JSON.stringify(b)))
          .join("\n");
        const printedAll = squash(
          plainFrac(
            [
              shared,
              ...questionsOf(act).flatMap((q) => [
                q.prompt,
                ...(q.options?.map?.((o) => o.text) ?? []),
                ...(q.pairs?.flatMap?.((p) => [p.left, p.right]) ?? []),
                ...(q.items?.map?.((i) => i.text) ?? []),
                ...(q.steps?.map?.((s) => s.text) ?? []),
                ...(q.fixOptions?.map?.((o) => o.text) ?? []),
                ...(q.categories?.map?.((c) => c.label) ?? []),
                ...(q.regions?.map?.((r) => r.label) ?? []),
                ...(q.words ?? []),
                ...(q.format === "blank"
                  ? q.bank
                    ? marksOf(q.text).map((m) => m.answers[0])
                    : []
                  : [q.text ?? ""]),
                q.frame,
              ]),
            ].join("\n"),
          ),
        );
        for (const q of questionsOf(act)) {
          const answer = answerText(q);
          const fragments = [answer, ...answer.split(/; | \| |, | → /)]
            .map((x) => x.trim())
            .filter((x) => x.length >= 4);
          for (const frag of fragments) {
            if (!printedAll.includes(squash(plainFrac(frag))))
              assert.ok(!has(text, frag), `${act.id}/${q.id} answer text "${frag}" printed`);
          }
          for (const field of [
            q.explanation,
            q.hint,
            q.sample,
            q.misconception,
            ...(q.rubric ?? []),
          ].filter(Boolean))
            assert.ok(!has(text, field), `${act.id}/${q.id} teacher field printed: ${field}`);
        }
        for (const note of [
          act.notes.teacher,
          ...act.notes.misconceptions,
          ...act.blocks.filter((b) => b.type === "note").map((b) => b.text),
          ...act.blocks.filter((b) => b.type === "audio").map((b) => b.say),
        ].filter(Boolean))
          assert.ok(!has(text, note), `${act.id} teacher note printed: ${note}`);
      }
    });
  }

  test("sentinel tokens never appear in the student html (even in attributes or the style block)", () => {
    const html = renderWorksheetHtml(sentinelWorksheet(), { part: "student", lang: "bi" });
    no(html, /ZQ|zqalpha|zqbeta|zqalt|zqcell|98765|7\/8|0\.875|ZQACCEPT2/i);
    no(html, /\(3, 4\)/);
    // the scrambled build cards are printed (that is the task) but the accepted full sentences are not
    yes(html, /Pinto/);
  });

  test("the answer key part is a separate document with every answer, sample and note", () => {
    for (const lang of LANGS) {
      for (const act of [fixture, richWorksheet(), sentinelWorksheet()]) {
        const html = renderWorksheetHtml(act, { part: "key", lang });
        yes(html, /TEACHER COPY/);
        no(html, /class="sheet student"/);
        const text = textOf(html);
        for (const q of questionsOf(act)) {
          const ans = answerText(q);
          if (q.format === "short") assert.ok(has(text, q.sample), `${q.id} sample`);
          else if (q.format === "fillTable")
            for (const c of tableBlanks(q)) assert.ok(has(text, c.answer), `${q.id} cell ${c.key}`);
          else
            for (const frag of ans
              .split(/; | \| | → |, /)
              .map((s) => s.trim())
              .filter(Boolean))
              assert.ok(has(text, frag), `${act.id}/${q.id} key lacks "${frag}" in ${lang}`);
          for (const field of [q.explanation, q.misconception, q.hint, ...(q.rubric ?? [])].filter(
            Boolean,
          ))
            assert.ok(has(text, field), `${q.id} lacks ${field}`);
        }
        for (const note of [
          act.notes.teacher,
          ...act.notes.misconceptions,
          ...act.blocks.filter((b) => b.type === "note").map((b) => b.text),
          ...act.blocks.filter((b) => b.type === "audio").map((b) => b.say),
        ].filter(Boolean))
          assert.ok(has(text, note), `${act.id} key lacks note ${note}`);
      }
    }
  });

  test("key letters match the scrambled paper (order, match)", () => {
    const act = fixture;
    const html = renderWorksheetHtml(act, { part: "all" });
    const student = textOf(studentHalf(html));
    const key = textOf(keyHalf(html));
    // paper: A Water the seed / B Plant the seed / C The plant grows  -> correct order is B, A, C
    yes(student, /A Water the seed B Plant the seed C The plant grows/);
    yes(key, /B, A, C/);
    // match: right column is scrambled B/A/C and the key points at those letters
    yes(student, /A ratio with different units B compares two amounts C amount for one unit/);
    yes(key, /1\. ratio → B\. compares two amounts/);
  });

  test("part=all is student pages, then a labelled teacher copy; part=teacher is the key", () => {
    const html = renderWorksheetHtml(fixture, { part: "all" });
    const s = html.indexOf('class="sheet student"');
    const k = html.indexOf('class="sheet key"');
    assert.ok(s > 0 && k > s);
    yes(html.slice(k), /TEACHER COPY/);
    no(studentHalf(html), /Water and sun\.\s*<\/|The passage says/);
    yes(html, /\.sheet\+\.sheet\{break-before:page/);
    assert.equal(
      renderWorksheetHtml(fixture, { part: "teacher" }),
      renderWorksheetHtml(fixture, { part: "key" }),
    );
  });
});

describe("deterministic, escaped, translated", () => {
  test("two renders are byte-identical and the scrambles never print the solved order", () => {
    for (const part of ["student", "key", "all"]) {
      assert.equal(
        renderWorksheetHtml(fixture, { part }),
        renderWorksheetHtml(structuredClone(fixture), { part }),
      );
    }
    for (let n = 2; n <= 8; n++) {
      const items = Array.from({ length: n }, (_, i) => `x${i}`);
      for (let seed = 0; seed < 40; seed++) assert.notDeepEqual(shuffled(items, `s${seed}`), items);
      assert.deepEqual(shuffled(items, "same"), shuffled(items, "same"));
    }
    assert.deepEqual(shuffled(["a"], "x"), ["a"]);
  });

  test("hostile text is escaped everywhere", () => {
    const evil =
      '<img src=x onerror=alert(1)> "><script>alert(2)</script> </style><script>alert(3)</script>';
    const act = normalizeActivity({
      title: evil,
      description: evil,
      context: { objective: evil, grade: evil, subject: evil },
      supports: { spanish: true, frames: true },
      notes: { teacher: evil, misconceptions: [evil] },
      blocks: [
        { type: "text", role: "directions", text: evil },
        { type: "passage", title: evil, text: evil },
        { type: "vocab", items: [{ term: evil, def: evil, es: evil, example: evil }] },
        { type: "table", headers: [evil], rows: [[evil]], caption: evil },
        { type: "image", src: '/img/a.png" onerror="alert(4)', alt: evil },
        { type: "organizer", kind: "web", prompts: [evil] },
        {
          type: "question",
          format: "choice",
          prompt: evil,
          options: [
            { id: "a", text: evil },
            { id: "b", text: evil },
          ],
          answer: "a",
          frame: evil,
          explanation: evil,
        },
        {
          type: "question",
          format: "blank",
          prompt: evil,
          text: `${evil} [[${evil}]]`,
          bank: true,
        },
        {
          type: "question",
          format: "match",
          prompt: evil,
          pairs: [
            { left: evil, right: evil },
            { left: "b", right: "c" },
          ],
        },
        {
          type: "question",
          format: "hotspot",
          prompt: evil,
          image: { src: "", alt: evil },
          regions: [{ id: "r", label: evil, x: 1, y: 1, w: 5, h: 5 }],
          answer: "r",
        },
        {
          type: "question",
          format: "fillTable",
          prompt: evil,
          headers: [evil],
          rows: [[evil, { answer: evil }]],
        },
      ],
    });
    for (const part of ["student", "key", "all"]) {
      for (const lang of LANGS) {
        const html = renderWorksheetHtml(act, { part, lang });
        no(html, /<script/i, `${part}/${lang}`);
        no(html, /<img src=x/i);
        no(
          html.replace(/="[^"]*"/g, '=""'),
          /<[a-z][^>]*\son[a-z]+=/i,
          "an event-handler attribute",
        );
        assert.equal((html.match(/<style>/g) || []).length, 1);
        assert.equal((html.match(/<\/style>/g) || []).length, 1);
        yes(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
      }
    }
  });

  test("Spanish: chrome translated, practice text stays English, glosses only with supports.spanish", () => {
    const es = renderWorksheetHtml(richWorksheet(), { part: "student", lang: "es" });
    yes(es, /<html lang="es">/);
    for (const word of [
      "Nombre",
      "Fecha",
      "Instrucciones",
      "Hoy estoy aprendiendo",
      "Palabras clave",
      "Espacio para trabajar",
      "Escribe tu respuesta en la línea",
    ])
      assert.ok(es.includes(word), word);
    assert.ok(es.includes("What is the ratio of flour to sugar?"));
    no(es, /Show your work/);
    assert.ok(es.includes("razón"));
    const noGloss = renderWorksheetHtml(
      richWorksheet({ supports: { spanish: false, visuals: true, frames: true } }),
      { part: "student", lang: "es" },
    );
    assert.ok(!noGloss.includes("razón") && !noGloss.includes("tasa"));
    // a Spanish gloss never appears in the key as an answer, and never beside a blank question
    const bi = renderWorksheetHtml(richWorksheet(), { part: "student", lang: "bi" });
    for (const pair of [
      "Name",
      "Nombre",
      "Date",
      "Fecha",
      "Directions",
      "Instrucciones",
      "Answer",
      "Respuesta",
    ])
      assert.ok(bi.includes(pair), pair);
    yes(bi, /<span class="es" lang="es">\/ Nombre<\/span>/);
    assert.ok(bi.includes("Show your work") && bi.includes("Muestra tu trabajo"));
  });

  test("transformations name every place paper differs, in English and Spanish", () => {
    const { html, transformations } = renderWorksheetParts(fixture, { part: "student" });
    assert.ok(html.length > 1000);
    const ids = new Set(transformations.map((t) => t.blockId));
    for (const id of [
      "q-match",
      "q-sort",
      "q-order",
      "q-blank",
      "q-number",
      "q-identify",
      "q-hotspot",
      "q-line",
      "q-build",
      "q-error",
      "q-table",
      "q-plot",
      "(activity)",
    ])
      assert.ok(ids.has(id), id);
    for (const t of transformations) assert.ok(t.note.en.length > 10 && t.note.es.length > 10);
    const hot = transformations.find((t) => t.blockId === "q-hotspot");
    yes(hot.note.en, /letters/);
    assert.ok(!ids.has("q-choice") && !ids.has("q-short"));
    const none = renderWorksheetParts(normalizeActivity({ id: "e", title: "E", blocks: [] }));
    yes(none.html, /no questions yet/);
  });
});

describe("open-print helper", () => {
  test("prints from a hidden iframe, then falls back with a message", async (t) => {
    const pw = await loadChromium(t);
    if (!pw) return;
    const src = readFileSync(
      new URL("../access-practice-lab/src/studio/print/open-print.js", import.meta.url),
      "utf8",
    ).replace(/^export /gm, "");
    const page = await pw.browser.newPage();
    await page.setContent("<body><p>host</p></body>");
    await page.addScriptTag({ content: src });
    const html = renderWorksheetHtml(fixture, { part: "student" });
    const ok = await page.evaluate(async (h) => {
      const calls = [];
      const r = await openPrint(h, {
        print: (w) => calls.push(w.document.querySelector("h1")?.textContent),
      });
      const frames = document.querySelectorAll("iframe").length;
      r.cleanup();
      return {
        ok: r.ok,
        method: r.method,
        calls,
        frames,
        after: document.querySelectorAll("iframe").length,
      };
    }, html);
    assert.deepEqual(ok, {
      ok: true,
      method: "iframe",
      calls: ["All question types"],
      frames: 1,
      after: 0,
    });
    const blocked = await page.evaluate(async (h) => {
      const messages = [];
      window.open = () => null;
      const r = await openPrint(h, {
        lang: "es",
        print: () => {
          throw new Error("no print");
        },
        onFallback: (m) => messages.push(m),
      });
      return { ok: r.ok, messages, frames: document.querySelectorAll("iframe").length };
    }, html);
    assert.equal(blocked.ok, false);
    assert.equal(blocked.frames, 0);
    yes(blocked.messages[0], /ventana de impresión/);
    await page.close();
    await pw.browser.close();
  });
});

// ── the real PDF ─────────────────────────────────────────────────────────────

const have = (cmd) => spawnSync("which", [cmd]).status === 0;

async function loadChromium(t) {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch(
      process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
    return { browser };
  } catch (error) {
    t.skip(`SKIP: Chromium is not available (${String(error.message).split("\n")[0]})`);
    return null;
  }
}

const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  assert.equal(r.status, 0, `${cmd} ${args.join(" ")}: ${r.stderr}`);
  return r.stdout;
};

async function renderPdf(browser, html, dir, name) {
  const page = await browser.newPage();
  await page.setContent(html);
  await page.emulateMedia({ media: "print" });
  const problems = await page.evaluate(() =>
    [...document.querySelectorAll(".problem")].map((el) => {
      const prompt =
        el.querySelector(".prompt > span:last-child")?.textContent.replace(/\s+/g, " ").trim() ??
        "";
      const how = el.querySelector(".how")?.textContent.replace(/\s+/g, " ").trim() ?? "";
      const lines = el.innerText
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => /[A-Za-z]/.test(s));
      return {
        prompt,
        how,
        last: lines.at(-1) ?? "",
        math: Boolean(el.querySelector(".frac, sup, sub")),
      };
    }),
  );
  const pdf = await page.pdf({ format: "Letter", preferCSSPageSize: true, printBackground: true });
  await page.close();
  const file = join(dir, `${name}.pdf`);
  writeFileSync(file, pdf);
  const pages = Number(/Pages:\s+(\d+)/.exec(run("pdfinfo", [file]))[1]);
  const text = Array.from({ length: pages }, (_, i) =>
    run("pdftotext", ["-f", String(i + 1), "-l", String(i + 1), "-layout", file, "-"]),
  );
  return { file, pdf, pages, text, problems };
}

function bodyExtent(file, page) {
  const out = join(tmpdir(), `bbox-${process.pid}-${page}.html`);
  run("pdftotext", ["-f", String(page), "-l", String(page), "-bbox", file, out]);
  const html = readFileSync(out, "utf8");
  const ys = [...html.matchAll(/yMin="([\d.]+)" xMax="[\d.]+" yMax="([\d.]+)"/g)]
    .map((m) => [Number(m[1]), Number(m[2])])
    .filter(([a, b]) => a >= 50 && b <= 742);
  return ys.length ? (Math.max(...ys.map((y) => y[1])) - 54) / (792 - 108) : 0;
}

describe("the real PDF", () => {
  test("student and key PDFs: pages, 11pt text, no blank or orphan page, problems stay whole", async (t) => {
    if (!have("pdfinfo") || !have("pdftotext"))
      return t.skip("SKIP: poppler (pdfinfo/pdftotext) is not installed");
    const pw = await loadChromium(t);
    if (!pw) return;
    const dir = mkdtempSync(join(tmpdir(), "studio-print-"));
    try {
      const cases = [
        ["allformats-student", renderWorksheetHtml(fixture, { part: "student" }), [3, 8]],
        ["rich-student-roomy", renderWorksheetHtml(richWorksheet(), { part: "student" }), [4, 9]],
        [
          "rich-student-es",
          renderWorksheetHtml(richWorksheet(), { part: "student", lang: "es" }),
          [4, 9],
        ],
        ["allformats-key", renderWorksheetHtml(fixture, { part: "key" }), [2, 7]],
        ["allformats-all", renderWorksheetHtml(fixture, { part: "all" }), [5, 14]],
      ];
      for (const [name, html, [min, max]] of cases) {
        const r = await renderPdf(pw.browser, html, dir, name);
        assert.ok(r.pages >= min && r.pages <= max, `${name}: ${r.pages} pages`);
        r.text.forEach((page, i) =>
          assert.ok(page.replace(/\s/g, "").length > 60, `${name}: page ${i + 1} is blank`),
        );
        const sizes = textSizes(r.pdf);
        assert.ok(
          sizes.length && sizes[0].size >= 10.95,
          `${name}: smallest text is ${sizes[0]?.size}pt`,
        );
        if (r.pages > 1 && !name.includes("all")) {
          const fill = bodyExtent(r.file, r.pages);
          assert.ok(
            fill >= 0.15,
            `${name}: last page is only ${(fill * 100).toFixed(0)}% filled (orphan)`,
          );
        }
        r.problems.forEach((p, i) => {
          const norm = (s) => s.replace(/\s+/g, "");
          const needle = p.math ? norm(p.how).slice(0, 16) : norm(p.prompt).slice(0, 20);
          const where = r.text.findIndex((pg) => norm(pg).includes(needle));
          assert.ok(where >= 0, `${name}: problem ${i + 1} "${needle}" not in PDF text`);
          if (p.how)
            assert.ok(
              norm(r.text[where]).includes(norm(p.how).slice(0, 16)),
              `${name}: problem ${i + 1} directions are on another page`,
            );
          if (p.last && p.last.length > 3)
            assert.ok(
              norm(r.text[where]).includes(norm(p.last).slice(0, 10)),
              `${name}: problem ${i + 1} is split across pages`,
            );
        });
        if (name.endsWith("student")) {
          const all = r.text.join("\n");
          yes(all, /Work space/);
          yes(all, /Answer:/);
          yes(all, /Page \d+ of \d+/);
        }
        if (name.endsWith("key") || name.endsWith("all")) yes(r.text.join("\n"), /TEACHER COPY/);
        if (name === "allformats-all") {
          const first = r.text.findIndex((p) => /TEACHER COPY — Answer key/.test(p));
          assert.ok(first > 0, "key starts after the student pages");
          assert.ok(!r.text.slice(0, first).join("\n").includes("The passage says seeds need"));
        }
      }
      const normal = await renderPdf(
        pw.browser,
        renderWorksheetHtml(richWorksheet({ options: { workspace: "normal" } }), {
          part: "student",
        }),
        dir,
        "rich-normal",
      );
      const roomy = await renderPdf(
        pw.browser,
        renderWorksheetHtml(richWorksheet(), { part: "student" }),
        dir,
        "rich-roomy",
      );
      assert.ok(roomy.pages >= normal.pages, "roomy workspace takes at least as many pages");
    } finally {
      await pw.browser.close();
    }
  });
});

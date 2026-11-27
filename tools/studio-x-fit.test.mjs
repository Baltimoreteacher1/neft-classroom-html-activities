// Document fitting (src/studio/x/fit*.js): goals, floors, no lost or moved content, no answer on a student sheet,
// plain bilingual explanations, and honest failure with an alternative. The page count comes from an injected
// measurePages here; tools/studio-x-fit-e2e.mjs checks the same logic against real PDFs in Chromium.
//   node --test tools/studio-x-fit.test.mjs
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { allFormats } from "../access-practice-lab/src/studio/core/fixtures.js";
import {
  richWorksheet,
  sentinelWorksheet,
} from "../access-practice-lab/src/studio/print/fixtures.js";
import { renderWorksheetParts } from "../access-practice-lab/src/studio/print/worksheet.js";
import {
  FIT_GOAL_IDS,
  FIT_GOALS,
  fitDocument,
  pageThumbnails,
} from "../access-practice-lab/src/studio/x/fit.js";
import { estimateLayout } from "../access-practice-lab/src/studio/x/fit-estimate.js";
import { sampleWorksheet } from "../access-practice-lab/src/studio/x/fit-fixtures.js";
import {
  FLOORS,
  LEVEL_ORDER,
  levelOptions,
  renderFitted,
  safeFor,
} from "../access-practice-lab/src/studio/x/fit-levels.js";

const visibleText = (html) =>
  html
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
const bodyVar = (html) => Number(/--fit-body:([\d.]+)pt/.exec(html)?.[1] ?? 13);

describe("goals", () => {
  test("the seven goals, each with plain bilingual words", () => {
    assert.deepEqual(
      [...FIT_GOAL_IDS],
      [
        "one-page",
        "two-pages",
        "more-workspace",
        "half-page",
        "two-per-page",
        "compact-review",
        "large-print",
      ],
    );
    for (const g of FIT_GOALS) {
      for (const k of ["label", "help"]) {
        assert.ok(g[k].en.length > 8 && g[k].es.length > 8, `${g.id}.${k}`);
        assert.notEqual(g[k].en, g[k].es, `${g.id}.${k} Spanish is a copy`);
      }
    }
  });
  test("an unknown goal is a programming error, not a silent default", async () => {
    await assert.rejects(() => fitDocument(sampleWorksheet(3), "make-it-pretty"), RangeError);
  });
});

describe("floors and levels", () => {
  test("no level goes under a usability floor", () => {
    const a = sampleWorksheet(8);
    for (const id of [...LEVEL_ORDER, "spacious", "generous", "large"]) {
      const o = levelOptions(id, a);
      assert.ok(o.bodyPt >= (o.large ? FLOORS.largePt : FLOORS.bodyPt), `${id} body ${o.bodyPt}`);
      assert.ok(
        o.wsScale >= FLOORS.wsScale && o.ruleIn >= FLOORS.ruleIn && o.marginIn >= FLOORS.marginIn,
        id,
      );
    }
    assert.ok(levelOptions("large", a).bodyPt >= 14);
    // asking for less than the floor is clamped, never honored
    assert.equal(
      levelOptions("trim7", a, { bodyPt: 8, marginIn: 0.1, wsScale: 0.1, ruleIn: 0.1 }).bodyPt,
      11,
    );
    assert.equal(levelOptions("trim7", a, { marginIn: 0.1 }).marginIn, 0.5);
  });
  test("two columns and side-by-side choices only where the sheet can take them", () => {
    assert.equal(safeFor(sampleWorksheet(6)).columns, true);
    assert.equal(levelOptions("trim8", sampleWorksheet(6)).columns, 2);
    const wide = allFormats("worksheet"); // match, sort, plot, fillTable...
    assert.equal(safeFor(wide).columns, false);
    assert.equal(levelOptions("trim8", wide).columns, 1);
    const long = sampleWorksheet(2);
    long.blocks.find((b) => b.format === "choice").options[0].text =
      "A deliberately long answer choice that cannot sit in half a column";
    assert.equal(safeFor(long).grid, false);
    assert.equal(levelOptions("trim5", long).grid, false);
  });
});

describe("renderFitted never loses, moves or leaks anything", () => {
  const sheets = {
    sample: sampleWorksheet(9),
    rich: richWorksheet(),
    sentinel: sentinelWorksheet(),
  };
  const levels = [...LEVEL_ORDER, "spacious", "generous", "large"];

  test("every level keeps exactly the text of the unfitted student sheet", () => {
    for (const [name, a] of Object.entries(sheets)) {
      const base = visibleText(renderWorksheetParts(a, { part: "student" }).html);
      for (const id of levels) {
        const got = visibleText(renderFitted(a, levelOptions(id, a), { part: "student" }).html);
        assert.equal(got, base, `${name}/${id}: text changed`);
      }
    }
  });

  test("no answer, hint or note ever reaches a student sheet, at any level or copy count", () => {
    const a = sentinelWorksheet();
    for (const id of levels)
      for (const copies of [0, 1, 2]) {
        const html = renderFitted(
          a,
          levelOptions(id, a, { copies, marginIn: copies ? 0.5 : undefined }),
          { part: "student" },
        ).html;
        assert.ok(
          !/ZQ(?:HINT|EXPL|MISC|NOTE|SAMPLE|RUBRIC|ACCEPT|SCRIPT)/.test(html),
          `${id}/${copies}`,
        );
        assert.ok(
          !html.includes('class="sheet key"') && !/TEACHER COPY/.test(html),
          `${id}/${copies} key leaked`,
        );
      }
  });

  test("the teacher copy is untouched by a fit", () => {
    const a = sentinelWorksheet();
    const plain = renderWorksheetParts(a, { part: "key" }).html;
    assert.equal(renderFitted(a, levelOptions("trim7", a), { part: "key" }).html, plain);
    const all = renderFitted(a, levelOptions("large", a), { part: "all" }).html;
    assert.equal((all.match(/class="sheet key"/g) || []).length, 1);
    assert.ok(
      all.indexOf("ZQSAMPLE") > all.indexOf('class="sheet key"'),
      "key text appears only after the key section starts",
    );
  });

  test("two copies per page keep every id unique and the question count doubled", () => {
    const a = sampleWorksheet(3);
    const html = renderFitted(a, levelOptions("trim4", a, { copies: 2, marginIn: 0.5 }), {
      part: "student",
    }).html;
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(new Set(ids).size, ids.length, "duplicate ids");
    assert.equal((html.match(/class="problem"/g) || []).length, 6);
    assert.equal((html.match(/class="halfbox"/g) || []).length, 2);
    for (const m of html.matchAll(/aria-labelledby="([^"]+)"/g))
      assert.ok(ids.includes(m[1]), `dangling ${m[1]}`);
  });

  test("a fit changes only variables and layout classes; the default sheet prints as before", () => {
    const a = sampleWorksheet(4);
    assert.equal(
      renderFitted(a, null, { part: "student" }).html,
      renderWorksheetParts(a, { part: "student" }).html,
    );
    const html = renderFitted(a, levelOptions("large", a), { part: "student" }).html;
    assert.equal(bodyVar(html), 16);
    assert.match(
      html,
      /@page student\{@bottom-center/,
      "large print also enlarges the page footer",
    );
  });

  test("the input activity is never mutated", () => {
    const a = sampleWorksheet(4);
    const before = JSON.stringify(a);
    renderFitted(a, levelOptions("spacious", a), { part: "all" });
    assert.equal(JSON.stringify(a), before);
  });
});

// A fake printer: pages as a function of the layout, so the search itself is what is under test.
const bySpacing = (table) => async (html) => {
  const k = Number(/--fit-gap:([\d.]+)pt/.exec(html)?.[1] ?? 18);
  const pages = table.find(([maxGap]) => k >= maxGap)?.[1] ?? table.at(-1)[1];
  return { pages, heightIn: 3 };
};

describe("fitDocument with an injected measurePages", () => {
  const a = sampleWorksheet(8);

  test("one-page keeps the roomiest layout that fits, and says what changed in both languages", async () => {
    const seen = [];
    const measure = async (_html, o) => {
      seen.push(o.level);
      return { pages: o.level === "trim3" || o.level > "trim3" ? 1 : 2 };
    };
    const r = await fitDocument(a, "one-page", { measurePages: measure });
    assert.equal(r.ok, true);
    assert.equal(r.options.level, "trim3");
    assert.equal(r.pages, 1);
    assert.equal(r.measured, true);
    assert.deepEqual(
      seen,
      ["standard", "trim1", "trim2", "trim3"],
      "stops at the first layout that fits",
    );
    for (const n of r.notes)
      assert.ok(n.en && n.es && n.en !== n.es && !/undefined|NaN/.test(n.en + n.es));
    assert.ok(r.notes.some((n) => /never goes below 11pt|stays at the normal 13pt/.test(n.en)));
    assert.ok(r.notes.some((n) => /nunca baja de 11 pt|13 pt normales/.test(n.es)));
    assert.ok(r.notes.at(-1).en.includes("answer key stays on the teacher copy"));
  });

  test("the measured html is the student sheet only", async () => {
    const htmls = [];
    await fitDocument(sentinelWorksheet(), "two-pages", {
      measurePages: async (html) => (htmls.push(html), 1),
    });
    assert.ok(htmls.length > 0);
    for (const html of htmls)
      assert.ok(!html.includes("ZQSAMPLE") && !html.includes('class="sheet key"'));
  });

  test("a layout with clipped content is skipped, not accepted", async () => {
    const r = await fitDocument(a, "one-page", {
      measurePages: async (_html, o) => ({
        pages: 1,
        clipped: o.level === "standard" ? ["sticks out of the page: span.line"] : [],
      }),
    });
    assert.equal(r.ok, true);
    assert.notEqual(r.options.level, "standard");
  });

  test("an impossible goal is ok:false with null options, a plain reason and a working alternative", async () => {
    const measure = async (_html, o) => ({
      pages: o.copies ? 1 : o.level === "airy" ? 4 : 2,
      heightIn: 20,
    });
    const r = await fitDocument(a, "one-page", { measurePages: measure });
    assert.equal(r.ok, false);
    assert.equal(r.options, null);
    assert.equal(r.alternative.goal, "two-pages");
    assert.ok(r.alternative.options && r.alternative.pages === 2);
    const text = r.notes.map((n) => n.en).join(" ");
    assert.match(text, /needs 2 pages/);
    assert.match(text, /11pt/);
    assert.match(text, /Better: it fits on 2 pages/);
    assert.ok(r.notes.every((n) => n.es && n.es !== n.en));
    assert.ok(r.alternative.message.en && r.alternative.message.es);
  });

  test("it can name the question to remove, and the removal really fits", async () => {
    const sheet = sampleWorksheet(7);
    const measure = async (html) => ({
      pages: (html.match(/class="problem"/g) || []).length >= 7 ? 2 : 1,
    });
    const r = await fitDocument(sheet, "one-page", { measurePages: measure });
    assert.equal(r.ok, false);
    assert.equal(r.removeQuestions.length, 1);
    assert.ok(r.removeQuestions[0] >= 1 && r.removeQuestions[0] <= 7);
    assert.match(
      r.notes.map((n) => n.en).join(" "),
      new RegExp(`remove question ${r.removeQuestions[0]} yourself`),
    );
    assert.match(
      r.notes.map((n) => n.es).join(" "),
      new RegExp(`quite la pregunta ${r.removeQuestions[0]}`),
    );
  });

  test("half-page measures the sheet's height against half the printable page", async () => {
    const small = sampleWorksheet(2);
    const ok = await fitDocument(small, "half-page", {
      measurePages: async () => ({ pages: 1, heightIn: 4.5 }),
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.options.copies, 1);
    assert.equal(ok.options.marginIn, 0.5);
    const two = await fitDocument(small, "two-per-page", {
      measurePages: async () => ({ pages: 1, heightIn: 4.5 }),
    });
    assert.equal(two.options.copies, 2);
    const no = await fitDocument(small, "half-page", {
      measurePages: async () => ({ pages: 1, heightIn: 6 }),
    });
    assert.equal(no.ok, false);
    assert.equal(no.alternative.goal, "one-page");
    assert.match(no.notes[0].en, /half a page has 4.9 in/);
  });

  test("more-workspace never shrinks text and adds at most one page", async () => {
    const r = await fitDocument(a, "more-workspace", {
      measurePages: async (_html, o) => ({ pages: o.wsScale >= 2 ? 4 : o.wsScale >= 1.5 ? 3 : 2 }),
    });
    assert.equal(r.ok, true);
    assert.equal(r.options.bodyPt, 13);
    assert.ok(r.options.wsScale > 1);
    assert.equal(r.options.level, "spacious");
    assert.equal(r.pages, 3);
  });

  test("large print is never under 14pt; too many pages is refused with an alternative", async () => {
    const good = await fitDocument(a, "large-print", { measurePages: async () => ({ pages: 3 }) });
    assert.equal(good.ok, true);
    assert.ok(good.options.bodyPt >= 14);
    const bad = await fitDocument(a, "large-print", {
      measurePages: async (_html, o) => ({ pages: o.large ? 9 : 2 }),
    });
    assert.equal(bad.ok, false);
    assert.equal(bad.options, null);
    assert.ok(bad.alternative);
    assert.match(bad.notes.map((n) => n.en).join(" "), /large print/);
  });

  test("compact review takes the densest layout that still keeps readable floors", async () => {
    const r = await fitDocument(a, "compact-review", {
      measurePages: bySpacing([
        [0.7 * 18, 3],
        [0, 2],
      ]),
    });
    assert.equal(r.ok, true);
    assert.ok(r.options.bodyPt >= 11 && r.options.grid);
  });
});

describe("the pure estimate (no browser)", () => {
  test("a short worksheet fits one page; a 30-question one cannot, and says so", async () => {
    const short = await fitDocument(sampleWorksheet(5), "one-page");
    assert.equal(short.ok, true);
    assert.equal(short.measured, false);
    assert.ok(short.notes[0].en.includes("an estimate"));
    const long = await fitDocument(sampleWorksheet(30), "one-page");
    assert.equal(long.ok, false);
    assert.ok(long.alternative);
    assert.ok(long.pages > 2);
  });

  test("every goal returns a complete, bilingual, floor-respecting result for sheets of every size", async () => {
    for (const n of [1, 5, 12, 30])
      for (const goal of FIT_GOAL_IDS) {
        const r = await fitDocument(sampleWorksheet(n), goal);
        assert.equal(typeof r.ok, "boolean");
        assert.ok(r.notes.length > 0);
        for (const note of r.notes) assert.ok(note.en && note.es, `${n}/${goal}`);
        if (r.ok) {
          assert.ok(r.options.bodyPt >= (goal === "large-print" ? 14 : 11), `${n}/${goal}`);
          assert.ok(r.pages >= 1);
        } else {
          assert.equal(r.options, null);
          assert.ok(
            r.alternative || r.notes.some((x) => /split it into two worksheets/.test(x.en)),
            `${n}/${goal} offers no way forward`,
          );
        }
        if (r.alternative) {
          assert.ok(FIT_GOAL_IDS.includes(r.alternative.goal));
          assert.ok(r.alternative.options.bodyPt >= 11);
        }
      }
  });

  test("an empty worksheet still fits (nothing to lose, nothing to crash)", async () => {
    const r = await fitDocument({ kind: "worksheet", title: "Empty", blocks: [] }, "one-page");
    assert.equal(r.ok, true);
  });
});

describe("page structure from the paper model", () => {
  test("every block lands on exactly one page, in order, and questions are numbered 1..n once", () => {
    const a = sampleWorksheet(14);
    for (const id of ["standard", "trim4", "trim8", "large"]) {
      const t = pageThumbnails(a, levelOptions(id, a));
      assert.equal(t.pages, t.perPage.length);
      const seq = t.perPage.flatMap((p) => p.blocks.filter((b) => !b.continued)).map((b) => b.id);
      assert.deepEqual(seq, ["header", "goal", ...a.blocks.map((b) => b.id)], id);
      const nums = t.perPage
        .flatMap((p) => p.blocks)
        .filter((b) => b.label.en.startsWith("Question") && !b.continued)
        .map((b) => Number(b.label.en.split(" ")[1]));
      assert.deepEqual(
        nums,
        Array.from({ length: 14 }, (_, i) => i + 1),
      );
      for (const p of t.perPage) assert.ok(p.blocks.every((b) => b.label.en && b.label.es));
    }
  });

  test("no page ends on a section heading, at any size", () => {
    for (const n of [7, 13, 19, 25, 31])
      for (const id of ["standard", "trim2", "trim5", "trim7", "large"]) {
        const a = sampleWorksheet(n);
        for (const p of pageThumbnails(a, levelOptions(id, a)).perPage) {
          const last = p.blocks.at(-1);
          assert.ok(
            !(last && last.label.en === "Section heading"),
            `${n}/${id} page ${p.page} ends on a heading`,
          );
        }
      }
  });

  test("tighter levels never need more pages than roomier ones", () => {
    for (const n of [5, 12, 30]) {
      const a = sampleWorksheet(n);
      let prev = Infinity;
      for (const id of LEVEL_ORDER) {
        const { pages } = estimateLayout(a, levelOptions(id, a));
        assert.ok(pages <= prev, `${n}: ${id} has ${pages} pages after ${prev}`);
        prev = pages;
      }
    }
  });
});

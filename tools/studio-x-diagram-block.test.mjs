// Studio X wave 2 (W1): the `diagram` block. The block stores a STRUCTURED SPEC, never SVG; every renderer (player,
// printed worksheet, Word file, validator, editor) redraws the figure from it.
//   node --test tools/studio-x-diagram-block.test.mjs
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import JSZip from "jszip";
import {
  BLOCK_TYPES,
  cleanDiagramSpec,
  DIAGRAM_KINDS,
  DIAGRAM_LIMITS,
  normalizeActivity,
} from "../access-practice-lab/src/studio/core/schema.js";
import { studentCopyFor } from "../access-practice-lab/src/studio/core/student-copy.js";
import { validateActivity } from "../access-practice-lab/src/studio/core/validate.js";
import { createStore } from "../access-practice-lab/src/studio/editor/store.js";
import { renderWorksheetHtml } from "../access-practice-lab/src/studio/print/worksheet.js";
import { renderDiagram } from "../access-practice-lab/src/studio/x/diagram-render.js";
import { explainDiagram } from "../access-practice-lab/src/studio/x/diagram-words.js";
import { CAPS } from "../access-practice-lab/src/studio/x/diagrams.js";
import { buildDocx } from "../functions/_lib/studio/docx.js";
import { makeWindow } from "./studio-player-helpers.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** One valid spec per kind. */
const SPECS = {
  fraction: { kind: "fraction", numerator: 3, denominator: 4, style: "bar" },
  prism: { kind: "prism", l: 4, w: "2 1/2", h: 3, unit: "cm" },
  tape: {
    kind: "tape",
    parts: [
      { label: "A", value: 5 },
      { label: "B", value: null },
    ],
    total: 12,
  },
  plane: {
    kind: "plane",
    xRange: [-5, 5],
    yRange: [-5, 5],
    points: [{ x: 2, y: 3, label: "P" }],
  },
  bar: {
    kind: "bar",
    title: "Pets",
    unit: "students",
    categories: [
      { label: "Dogs", value: 8 },
      { label: "Cats", value: 5 },
    ],
  },
  dot: { kind: "dot", title: "Ages", unit: "years", values: [10, 11, 11, 12, 12, 12] },
  histogram: {
    kind: "histogram",
    title: "Heights",
    unit: "cm",
    values: [150, 152, 155, 160, 161, 170],
  },
  timeline: {
    kind: "timeline",
    events: [
      { year: 1776, label: "Declaration" },
      { year: 1865, label: "War ends" },
    ],
  },
  foodweb: {
    kind: "foodweb",
    relationships: [
      { eats: "Rabbit", eaten: "Grass" },
      { eats: "Fox", eaten: "Rabbit" },
    ],
  },
};
const block = (spec, over = {}) => ({ id: "d1", type: "diagram", spec, ...over });
const activity = (blocks, over = {}) =>
  normalizeActivity({ id: "act1", title: "Diagrams", kind: "worksheet", blocks, ...over });
const qn = (n) => ({
  id: `q${n}`,
  type: "question",
  format: "choice",
  prompt: `Question ${n}?`,
  options: [
    { id: "a", text: "Yes" },
    { id: "b", text: "No" },
  ],
  answer: "a",
});
const dom = (svg) => new JSDOM(svg, { contentType: "image/svg+xml" }).window.document;

// ── schema ───────────────────────────────────────────────────────────────────

test("diagram is a block type with the nine kinds, and the caps equal the wave-1 limits", () => {
  assert.ok(BLOCK_TYPES.includes("diagram"));
  assert.equal(DIAGRAM_KINDS.length, 9);
  assert.equal(DIAGRAM_LIMITS.categories, CAPS.categories);
  assert.equal(DIAGRAM_LIMITS.points, CAPS.points);
  assert.equal(DIAGRAM_LIMITS.events, CAPS.events);
  assert.equal(DIAGRAM_LIMITS.dotValues, CAPS.dotValues);
  assert.equal(DIAGRAM_LIMITS.histogramValues, CAPS.histogramValues);
  assert.equal(DIAGRAM_LIMITS.parts, CAPS.parts);
  assert.equal(DIAGRAM_LIMITS.relationships, CAPS.edges);
  assert.equal(DIAGRAM_LIMITS.title, CAPS.title);
  assert.equal(DIAGRAM_LIMITS.label, CAPS.label);
});

test("every kind survives normalization and a second pass changes nothing", () => {
  for (const [kind, spec] of Object.entries(SPECS)) {
    const a = activity([block(spec)]);
    assert.equal(a.blocks.length, 1, kind);
    assert.equal(a.blocks[0].spec.kind, kind);
    assert.deepEqual(normalizeActivity(a).blocks[0], a.blocks[0], kind);
    assert.deepEqual(a.blocks[0].alt, { en: "", es: "" });
    assert.deepEqual(a.blocks[0].caption, { en: "", es: "" });
  }
});

test("an unknown kind is rejected (the block is dropped), never kept", () => {
  for (const spec of [{ kind: "pie" }, { kind: "__proto__" }, {}, null, "bar", { kind: "BAR" }])
    assert.equal(activity([block(spec)]).blocks.length, 0, JSON.stringify(spec));
  assert.equal(cleanDiagramSpec({ kind: "pie" }), null);
});

test("sizes are capped at the wave-1 limits", () => {
  const many = (n, make) => Array.from({ length: n }, (_, i) => make(i));
  const cap = (spec, key) => activity([block(spec)]).blocks[0].spec[key].length;
  assert.equal(
    cap({ kind: "bar", categories: many(90, (i) => ({ label: `c${i}`, value: i })) }, "categories"),
    40,
  );
  assert.equal(
    cap({ ...SPECS.plane, points: many(200, (i) => ({ x: i % 5, y: 1 })) }, "points"),
    60,
  );
  assert.equal(
    cap({ kind: "timeline", events: many(50, (i) => ({ year: i, label: "e" })) }, "events"),
    24,
  );
  assert.equal(cap({ kind: "dot", values: many(300, (i) => i) }, "values"), 60);
  assert.equal(cap({ kind: "histogram", values: many(900, (i) => i) }, "values"), 500);
  assert.equal(
    cap({ kind: "tape", parts: many(30, () => ({ label: "p", value: 1 })) }, "parts"),
    12,
  );
  assert.equal(
    cap(
      { kind: "foodweb", relationships: many(200, (i) => ({ eats: `a${i}`, eaten: `b${i}` })) },
      "relationships",
    ),
    60,
  );
});

test("numbers are normalized: finite or null, blanks never become 0, fractions stay as typed", () => {
  const s = (v) =>
    activity([block({ kind: "bar", title: "t", categories: [{ label: "x", value: v }] })]).blocks[0]
      .spec.categories[0].value;
  assert.equal(s("12"), 12);
  assert.equal(s(" 3.5 "), 3.5);
  assert.equal(s(-0), 0);
  assert.ok(Object.is(s(-0), 0));
  for (const bad of [
    "",
    "abc",
    null,
    undefined,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1e12,
    [],
    {},
    true,
  ])
    assert.equal(s(bad), null, String(bad));
  const prism = (v) => activity([block({ kind: "prism", l: v, w: 1, h: 1 })]).blocks[0].spec.l;
  assert.equal(prism("2 1/2"), "2 1/2");
  assert.equal(prism("3/4"), "3/4");
  assert.equal(prism("2  1/2"), "2 1/2");
  assert.equal(prism("<b>"), null);
  assert.equal(prism("1/2/3"), null);
});

test("control characters and extra fields are stripped; alt and caption are plain {en, es}", () => {
  const a = activity([
    block(
      {
        kind: "bar",
        title: "Pets\u0000\u0007\nnow\ttoday",
        svg: "<svg onload=alert(1)>",
        categories: [{ label: "Dogs\u001b[31m", value: 1, html: "<b>" }],
      },
      { alt: "A\u0000 chart", caption: { en: "Cap\u0003tion", es: "Pie\n" }, svg: "<svg/>" },
    ),
  ]);
  const b = a.blocks[0];
  assert.equal(b.spec.title, "Pets now today");
  assert.equal(b.spec.categories[0].label, "Dogs [31m");
  assert.deepEqual(Object.keys(b).sort(), ["alt", "caption", "id", "spec", "type"]);
  assert.deepEqual(Object.keys(b.spec.categories[0]).sort(), ["label", "value"]);
  assert.ok(!("svg" in b.spec));
  assert.deepEqual(b.alt, { en: "A chart", es: "" });
  assert.deepEqual(b.caption, { en: "Cap tion", es: "Pie" });
  assert.ok(!/<svg/.test(JSON.stringify(a)), "no SVG markup is ever stored");
});

test("limits on text length are enforced", () => {
  const b = activity([
    block(
      { kind: "bar", title: "T".repeat(400), categories: [{ label: "L".repeat(400), value: 1 }] },
      { alt: "a".repeat(900) },
    ),
  ]).blocks[0];
  assert.equal(b.spec.title.length, 60);
  assert.equal(b.spec.categories[0].label.length, 40);
  assert.equal(b.alt.en.length, 300);
});

// ── validate ─────────────────────────────────────────────────────────────────

test("validateActivity: valid diagrams pass; an invalid spec is reported in plain words with the block id", () => {
  const good = validateActivity(
    activity(
      Object.values(SPECS)
        .map((s, i) => block(s, { id: `d${i}` }))
        .concat(qn(1)),
    ),
  );
  assert.deepEqual(
    good.errors.filter((e) => e.code === "bad-diagram"),
    [],
  );

  const bad = [
    [{ kind: "bar", title: "", categories: [{ label: "a", value: 1 }] }, /title/i],
    [
      { kind: "bar", title: "T", categories: [{ label: "a", value: null }] },
      /Row 1, number must be a number/,
    ],
    [{ kind: "fraction", numerator: 5, denominator: null }, /denominator must be a number/i],
    [
      {
        kind: "timeline",
        events: [
          { year: 5, label: "a" },
          { year: 5, label: "b" },
        ],
      },
      /two different years/,
    ],
    [
      {
        kind: "foodweb",
        relationships: [
          { eats: "A", eaten: "B" },
          { eats: "B", eaten: "A" },
        ],
      },
      /loop/i,
    ],
    [{ kind: "tape", parts: [{ label: "A", value: null }] }, /total/i],
  ];
  for (const [spec, re] of bad) {
    const r = validateActivity(activity([block(spec, { id: "bad1" }), qn(1)]));
    const e = r.errors.find((x) => x.code === "bad-diagram");
    assert.ok(e, JSON.stringify(spec));
    assert.equal(e.blockId, "bad1");
    assert.match(e.message, re);
    assert.ok(!/\[\d+\]|\w+\.\w+ must/.test(e.message), `code-speak in: ${e.message}`);
    assert.equal(r.ok, false);
  }
});

test("explainDiagram is bilingual for every code the generators raise", () => {
  const codes = [
    "empty-text",
    "text-too-long",
    "not-a-number",
    "not-an-integer",
    "out-of-range",
    "too-few",
    "too-many",
    "bad-range",
    "range-too-wide",
    "bad-style",
    "bad-dimension",
    "bad-unit",
    "bad-part",
    "bad-total",
    "total-required",
    "total-too-small",
    "total-mismatch",
    "too-many-unknowns",
    "too-uneven",
    "point-off-plane",
    "one-year",
    "label-too-long",
    "timeline-crowded",
    "too-dense",
    "too-many-bins",
    "too-many-equal",
    "cycle",
    "unknown-kind",
    "cannot-draw",
  ];
  for (const code of codes) {
    const w = explainDiagram({ code, message: "categories[2].value must be a number." });
    assert.ok(w.en.length > 10 && w.es.length > 10, code);
    assert.notEqual(w.en, w.es, code);
  }
  assert.match(
    explainDiagram({ code: "not-a-number", message: "points[0].x must be a number." }).es,
    /Punto 1, x/,
  );
});

// ── drawing from the spec ────────────────────────────────────────────────────

test("every kind is redrawn from its spec and the figure follows the values", () => {
  for (const [kind, spec] of Object.entries(SPECS)) {
    const r = renderDiagram(block(spec), { lang: "en" });
    assert.ok(r.ok, `${kind}: ${r.message}`);
    const svg = dom(r.svg).documentElement;
    assert.equal(svg.getAttribute("role"), "img");
    assert.ok(svg.querySelector("title") && svg.querySelector("desc"), kind);
    assert.ok(r.table.headers.length && r.table.rows.length, kind);
    assert.ok(r.alt.length > 10 && r.caption.length > 2);
  }
  const bars = (v) =>
    [
      ...dom(
        renderDiagram(
          block({
            ...SPECS.bar,
            categories: [
              { label: "Dogs", value: v },
              { label: "Cats", value: 5 },
            ],
          }),
        ).svg,
      ).querySelectorAll("rect[data-value]"),
    ].map((r) => Number(r.getAttribute("data-length")));
  const [a, b] = [bars(8), bars(20)];
  assert.ok(
    a[0] / a[1] < 1.7 && b[0] / b[1] > 3.5,
    "the dogs bar tracks its value against the cats bar",
  );
});

test("a blank cell is an error, never a zero", () => {
  const r = renderDiagram(
    block({ kind: "bar", title: "T", categories: [{ label: "a", value: null }] }),
  );
  assert.equal(r.ok, false);
  assert.equal(r.code, "not-a-number");
});

test("teacher alt replaces title and desc; hostile text stays text; suffix makes ids unique", () => {
  const hostile = `<img src=x onerror=alert(1)>"'&`;
  const spec = { ...SPECS.bar, title: hostile, categories: [{ label: hostile, value: 2 }] };
  const r = renderDiagram(block(spec, { alt: { en: hostile, es: "" } }), {
    lang: "en",
    suffix: "d1",
  });
  const doc = dom(r.svg);
  assert.equal(doc.querySelectorAll("img,script,foreignObject").length, 0);
  assert.equal(doc.querySelector("title").textContent, hostile);
  assert.equal(doc.querySelector("desc").textContent, hostile);
  const ids = [...doc.querySelectorAll("[id]")].map((e) => e.id);
  assert.ok(ids.length >= 2 && ids.every((id) => id.endsWith("-d1")), ids.join());
  const labelled = doc.documentElement.getAttribute("aria-labelledby").split(" ");
  assert.ok(labelled.every((id) => ids.includes(id)));
  const two = [
    renderDiagram(block(SPECS.fraction), { suffix: "a" }),
    renderDiagram(block(SPECS.fraction), { suffix: "b" }),
  ];
  const all = two.flatMap((x) => [...dom(x.svg).querySelectorAll("[id]")].map((e) => e.id));
  assert.equal(new Set(all).size, all.length);
  for (const x of two)
    for (const m of x.svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(all.includes(m[1]), m[1]);
});

test("Spanish draws Spanish labels; teacher caption wins over the generated one", () => {
  const es = renderDiagram(block(SPECS.bar, { caption: { en: "My caption", es: "" } }), {
    lang: "es",
  });
  assert.match(es.alt, /Gráfica de barras/);
  assert.equal(es.caption, "Pets");
  assert.equal(
    renderDiagram(block(SPECS.bar, { caption: { en: "My caption", es: "" } })).caption,
    "My caption",
  );
});

// ── player ───────────────────────────────────────────────────────────────────

const mountDiagrams = (blocks, opts = {}, act = {}) => {
  const w = makeWindow();
  w.mount(activity([...blocks, qn(1)], { supports: { spanish: true }, ...act }), opts);
  return w;
};

test("player: figure with role=img, title and desc, caption, and a keyboard-reachable data table", () => {
  const w = mountDiagrams([block(SPECS.bar, { id: "d1" })], { lang: "en" });
  const fig = w.$(".sp-block-diagram figure.sp-diagram");
  assert.ok(fig, "diagram rendered");
  const svg = fig.querySelector("svg");
  assert.equal(svg.getAttribute("role"), "img");
  assert.ok(svg.querySelector("title")?.textContent && svg.querySelector("desc")?.textContent);
  assert.equal(fig.querySelector("figcaption").textContent, "Pets");
  const details = fig.querySelector("details.sp-diagram-data");
  const summary = details.querySelector("summary");
  assert.ok(summary && summary.tabIndex !== -1, "summary is natively focusable");
  assert.match(summary.textContent, /data table/i);
  const cells = [...details.querySelectorAll("tbody td")].map((c) => c.textContent);
  assert.deepEqual(cells, ["Dogs", "8", "Cats", "5"]);
  assert.ok(details.querySelector('th[scope="col"]'));
  assert.equal(w.$$("script,foreignObject").length, 0);
});

test("player: two figures of one kind keep unique ids; Spanish and bilingual modes", () => {
  const w = mountDiagrams([block(SPECS.bar, { id: "d1" }), block(SPECS.bar, { id: "d2" })], {
    lang: "es",
  });
  const ids = w
    .$$(".sp-diagram [id]")
    .map((e) => e.id)
    .filter((id) => id.startsWith("bc"));
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.length >= 4);
  assert.match(w.$(".sp-diagram svg title").textContent, /Gráfica de barras/);
  assert.match(w.$(".sp-diagram-data summary").textContent, /tabla de datos/);
  const bi = mountDiagrams([block(SPECS.bar, { caption: { en: "Pets", es: "Mascotas" } })], {
    lang: "bi",
  });
  assert.equal(bi.$(".sp-diagram figcaption .sp-es").textContent, "Mascotas");
});

test("player: an invalid spec shows a calm note, never an error or markup", () => {
  const w = mountDiagrams([
    block({ kind: "bar", title: "T", categories: [{ label: "a", value: null }] }),
  ]);
  assert.ok(!w.$(".sp-diagram"));
  assert.match(w.$(".sp-block-diagram").textContent, /could not be shown/);
});

// ── student copy ─────────────────────────────────────────────────────────────

test("student copy keeps the diagram untouched and exposes nothing teacher-only", () => {
  const a = activity([
    block(SPECS.bar, { alt: { en: "Bar chart of pets", es: "" } }),
    qn(1),
    { id: "n1", type: "note", text: "secret" },
  ]);
  for (const kind of ["worksheet", "interactive"]) {
    const copy = studentCopyFor({ ...a, kind, notes: { teacher: "tea", misconceptions: ["m"] } });
    const d = copy.blocks.find((b) => b.type === "diagram");
    assert.deepEqual(d, a.blocks[0]);
    assert.ok(!JSON.stringify(copy).includes("secret"));
  }
  assert.ok(!Object.keys(a.blocks[0]).some((k) => /answer|key|teacher|note/i.test(k)));
});

// ── print ────────────────────────────────────────────────────────────────────

test("printed worksheet: the figure, its caption and a keep-with-next rule, only on the student sheet", () => {
  const a = activity([block(SPECS.bar, { id: "d1" }), qn(1)]);
  const student = renderWorksheetHtml(a, { part: "student", lang: "en" });
  const doc = new JSDOM(student).window.document;
  const fig = doc.querySelector("figure.diagram");
  assert.ok(fig.querySelector("svg[role=img]"));
  assert.equal(fig.querySelector("figcaption").textContent, "Pets");
  assert.match(student, /figure\.diagram\{[^}]*break-after:avoid/);
  assert.match(fig.querySelector("svg").getAttribute("style"), /max-width:\d+pt/);
  assert.ok(
    student.indexOf('figure class="diagram"') < student.indexOf('class="problem"'),
    "figure sits before its question",
  );
  const key = new JSDOM(renderWorksheetHtml(a, { part: "key", lang: "en" })).window.document;
  assert.equal(key.querySelectorAll("figure.diagram").length, 0, "the answer key is unaffected");
  const es = new JSDOM(renderWorksheetHtml(a, { part: "student", lang: "es" })).window.document;
  assert.match(es.querySelector("figure.diagram svg title").textContent, /Gráfica de barras/);
  const bi = new JSDOM(
    renderWorksheetHtml(activity([block(SPECS.bar, { caption: { en: "Pets", es: "Mascotas" } })]), {
      part: "student",
      lang: "bi",
    }),
  ).window.document;
  assert.match(bi.querySelector("figure.diagram figcaption").textContent, /Pets.*Mascotas/);
});

test("printed worksheet: an invalid diagram prints a placeholder, not a broken figure", () => {
  const a = activity([
    block({ kind: "bar", title: "T", categories: [{ label: "a", value: null }] }),
    qn(1),
  ]);
  const html = renderWorksheetHtml(a, { part: "student", lang: "en" });
  assert.ok(!/figure class="diagram"/.test(html));
  assert.match(html, /Diagram could not be drawn/);
});

// ── Word ─────────────────────────────────────────────────────────────────────

test("Word: editable note + real data table + caption (no embedded image), student part only", async () => {
  const a = activity([block(SPECS.bar, { alt: { en: "Dogs are most common", es: "" } }), qn(1)]);
  const read = async (part) => {
    const zip = await JSZip.loadAsync(await buildDocx(a, { part, lang: "en" }));
    const xml = await zip.file("word/document.xml").async("string");
    return {
      xml,
      text: [...xml.matchAll(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" "),
    };
  };
  const student = await read("student");
  assert.match(student.text, /Diagram \(drawn in the printable version/);
  assert.match(student.text, /Dogs are most common/);
  assert.match(student.text, /Dogs\s+8\s+Cats\s+5/);
  assert.match(student.text, /Pets/);
  assert.ok(/<w:tbl>/.test(student.xml));
  assert.ok(!/<w:drawing>/.test(student.xml), "no picture is embedded");
  const key = await read("key");
  assert.ok(!/Dogs/.test(key.text), "the teacher key does not include the diagram");
});

// ── bundle ───────────────────────────────────────────────────────────────────

test("the committed player bundle is current and carries the diagram block in an isolated scope", () => {
  const r = spawnSync("node", ["tools/build-studio-player.mjs", "--check"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  assert.equal(r.status, 0, r.stderr);
});

// ── editor (jsdom) ───────────────────────────────────────────────────────────

function editorFor(spec, { es = false } = {}) {
  const win = new JSDOM("<!doctype html><body></body>", { pretendToBeVisual: true }).window;
  Object.assign(globalThis, { document: win.document, Node: win.Node, DOMParser: win.DOMParser });
  const store = createStore(activity([block(spec, { id: "d1" })]));
  const S = (en, esText) => (es ? esText : en);
  let changed = 0;
  return import("../access-practice-lab/src/studio/editor/diagram-editor.js").then(
    ({ diagramBlockEditor }) => {
      const el = diagramBlockEditor(store.get().blocks[0], { store, S, onChange: () => changed++ });
      win.document.body.append(el);
      const type = (input, value) => {
        input.value = value;
        input.dispatchEvent(new win.Event("input", { bubbles: true }));
      };
      return { win, store, el, type, changes: () => changed, block: () => store.get().blocks[0] };
    },
  );
}
const note = (el) => el.querySelector("p.st-warn");

test("editor: live accurate preview, plain-word problems, and every edit lands in the store as a spec", async () => {
  const e = await editorFor(SPECS.bar);
  assert.ok(e.el.querySelector("svg[role=img]"), "preview drawn");
  assert.equal(note(e.el).hidden, true);
  const valueInput = () => e.el.querySelector('input[aria-label="Row 1: Value"]');
  e.type(valueInput(), "abc");
  assert.equal(e.block().spec.categories[0].value, null);
  assert.equal(note(e.el).hidden, false);
  assert.match(note(e.el).textContent, /^Row 1, number must be a number\./);
  assert.ok(!e.el.querySelector("svg"), "no figure while the values are invalid");
  e.type(valueInput(), "12");
  assert.equal(e.block().spec.categories[0].value, 12);
  assert.equal(note(e.el).hidden, true);
  assert.equal(e.el.querySelector("rect[data-value]").getAttribute("data-value"), "12");
  assert.ok(e.changes() >= 2);
  assert.ok(!JSON.stringify(e.block()).includes("<svg"));
});

test("editor: kind switch, add/remove rows with focus kept, alt and caption overrides", async () => {
  const e = await editorFor(SPECS.bar);
  const kind = e.el.querySelector("select");
  kind.value = "timeline";
  kind.dispatchEvent(new e.win.Event("change", { bubbles: true }));
  assert.equal(e.block().spec.kind, "timeline");
  assert.equal(e.el.querySelectorAll("tbody tr").length, 2);
  assert.match(note(e.el).textContent, /Event 1, year must be a number/);

  const year = (n) => e.el.querySelector(`input[aria-label="Event ${n}: Year"]`);
  const label = (n) => e.el.querySelector(`input[aria-label="Event ${n}: Event"]`);
  e.type(year(1), "1776");
  e.type(label(1), "Declaration");
  e.type(year(2), "1865");
  e.type(label(2), "War ends");
  assert.equal(note(e.el).hidden, true);
  assert.deepEqual(e.block().spec.events, [
    { year: 1776, label: "Declaration" },
    { year: 1865, label: "War ends" },
  ]);

  e.el.querySelector("[data-add]").click();
  assert.equal(e.block().spec.events.length, 3);
  assert.equal(e.win.document.activeElement, year(3), "focus moves to the new row");
  e.el.querySelector('button[aria-label="Remove Event 3"]').click();
  assert.equal(e.block().spec.events.length, 2);
  assert.ok(
    e.el.querySelector('button[aria-label="Remove Event 1"]').disabled,
    "two events is the minimum",
  );

  const [altEn, altEs, capEn] = [...e.el.querySelectorAll("textarea")];
  assert.match(altEn.placeholder, /Timeline/i);
  assert.match(altEs.placeholder, /Línea de tiempo/);
  e.type(altEn, "Two events");
  e.type(capEn, "US history");
  assert.deepEqual(e.block().alt, { en: "Two events", es: "" });
  assert.equal(e.el.querySelector("svg title").textContent, "Two events");
  assert.equal(e.block().caption.en, "US history");
});

test("editor: numbers box for dot plots, Spanish wording, no markup from typed text", async () => {
  const e = await editorFor(SPECS.dot, { es: true });
  const box = e.el.querySelector("textarea");
  assert.equal(box.value, "10, 11, 11, 12, 12, 12");
  e.type(box, "3, 4 4\n5 x");
  assert.deepEqual(e.block().spec.values, [3, 4, 4, 5, null]);
  assert.match(note(e.el).textContent, /Valor 5 debe ser un número|Valor 5, número/);
  assert.ok([...e.el.querySelectorAll("label")].some((l) => /Tipo de figura/.test(l.textContent)));
  const h = await editorFor({ ...SPECS.bar, title: '<img src=x onerror="alert(1)">' });
  assert.equal(h.el.querySelectorAll("img").length, 0);
  assert.equal(h.el.querySelector("input").value, '<img src=x onerror="alert(1)">');
});

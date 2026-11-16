// Book Studio unit tests: the document model, migration, the rich-text sanitizer, templates and art, media helpers,
// reading order and the ZIP reader used by .langbook import. Browser journeys: tools/book-studio-e2e.mjs.
import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";

const LAB = new URL("../access-practice-lab/", import.meta.url);
const M = await import(new URL("src/book/model.js", LAB));
const { TEMPLATES, templateById, templatesFor } = await import(
  new URL("src/book/templates.js", LAB)
);
const { ART, ART_CATS } = await import(new URL("src/book/art.js", LAB));
const { sanitizeHtml } = await import(new URL("src/book/sanitize.js", LAB));
const { youTubeId, fitOnPage, strokesNear } = await import(
  new URL("src/book/editor-media.js", LAB)
);
const { zipStore } = await import(new URL("../assets/lib/zip-store.js", import.meta.url));
const doc = new JSDOM("").window.document;

test("model: a new book of every kind normalizes, has a cover and keeps its format", () => {
  for (const k of M.KINDS) {
    const b = M.newBook({ kind: k.id, title: "T" });
    assert.equal(b.format, k.format, k.id);
    assert.ok(b.pages.length >= 2, k.id);
    assert.equal(M.normalizeBook(JSON.parse(JSON.stringify(b))).pages.length, b.pages.length);
    assert.ok(
      b.pages[0].elements.some((e) => e.role === "title"),
      `${k.id} cover title`,
    );
  }
});

test("model: normalize clamps and drops untrusted fields; migrate upgrades schema 1", () => {
  const el = M.normalizeElement({
    type: "image",
    x: 9999,
    w: -5,
    media: "m1",
    onload: "x",
    alt: "a".repeat(999),
  });
  assert.equal(el.x, 150);
  assert.equal(el.w, 1);
  assert.equal(el.onload, undefined);
  assert.equal(el.alt.length, 300);
  assert.equal(M.normalizeElement({ type: "script" }).type, "text");
  const v1 = {
    schema: 1,
    id: "bold1234",
    title: "Old",
    size: "square",
    pages: [{ items: [{ type: "text", html: "<p>Hi</p>" }] }],
  };
  const b = M.migrate(v1);
  assert.equal(b.schema, M.SCHEMA);
  assert.equal(b.format, "square");
  assert.equal(b.pages[0].elements[0].html, "<p>Hi</p>");
  assert.throws(() => M.migrate(null));
});

test("model: reading order, speech and book text follow the page top to bottom, then across", () => {
  const p = M.makePage({
    elements: [
      M.makeElement("text", { x: 50, y: 10, html: "<p>B</p>" }),
      M.makeElement("text", { x: 5, y: 12, html: "<p>A</p>" }),
      M.makeElement("text", { x: 5, y: 60, html: "<p>C</p>" }),
      M.makeElement("shape", { y: 0 }),
    ],
  });
  assert.deepEqual(
    M.pageSpeech(p).map((s) => s.text),
    ["A", "B", "C"],
  );
  assert.deepEqual(
    M.pageSpeech(p, "rtl").map((s) => s.text),
    ["B", "A", "C"],
  );
  const book = M.normalizeBook({ title: "X", pages: [p] });
  assert.match(M.bookText(book), /Page 1\nA\nB\nC/);
});

test("model: clone renews every id and clears review state; duplicatePage renews element ids", () => {
  const b = M.newBook({ kind: "comic", title: "C" });
  b.feedback = [{ id: "f1", pageId: b.pages[1].id, text: "x" }];
  b.submission = { workId: "w1", at: "now" };
  const c = M.cloneWithNewIds(b);
  assert.notEqual(c.id, b.id);
  assert.ok(c.pages.every((p, i) => p.id !== b.pages[i].id));
  assert.equal(c.feedback.length, 0);
  assert.equal(c.submission, null);
  const d = M.duplicatePage(b.pages[1]);
  assert.ok(d.elements.every((e, i) => e.id !== b.pages[1].elements[i].id));
});

test("model: finish checklist names empty pages, missing descriptions and transcripts (never blocks)", () => {
  const b = M.newBook({ kind: "audio", title: "My book" });
  b.pages[1].elements.push(
    M.makeElement("image", { media: "m1" }),
    M.makeElement("audio", { media: "m2" }),
  );
  const c = Object.fromEntries(M.finishChecklist(b).map((x) => [x.id, x.ok]));
  assert.deepEqual(c, { title: false, pages: true, alt: false, transcript: false });
});

test("sanitizer: keeps the formatting subset, removes scripts, handlers and unsafe links", () => {
  const out = sanitizeHtml(
    '<div>Hi <b>bold</b> <span style="color:#ff0000">red</span><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">x</a><a href="https://example.org">ok</a><font color="#00ff00">g</font></div><ul><li>one</li></ul>',
    doc,
  );
  assert.match(out, /<p>Hi <b>bold<\/b> <span data-c="#ff0000">red<\/span>/);
  assert.doesNotMatch(out, /script|onerror|javascript|<img|style=/i);
  assert.match(
    out,
    /<a href="https:\/\/example\.org" rel="noopener noreferrer" target="_blank">ok<\/a>/,
  );
  assert.match(out, /<span data-c="#00ff00">g<\/span>/);
  assert.match(out, /<ul><li>one<\/li><\/ul>/);
  assert.equal(
    sanitizeHtml('<span lang="ar" dir="rtl">مرحبا</span>', doc),
    '<p><span lang="ar" dir="rtl">مرحبا</span></p>',
  );
});

test("templates: 26 complete templates, both bands covered, every art key exists, every page expands", () => {
  assert.ok(TEMPLATES.length >= 24, `${TEMPLATES.length} templates`);
  const keys = new Set(ART.map((a) => a.key));
  const ids = new Set();
  for (const t of TEMPLATES) {
    assert.ok(!ids.has(t.id), `duplicate ${t.id}`);
    ids.add(t.id);
    for (const k of ["title", "summary", "purpose", "finished", "teacherNotes", "example"])
      assert.ok(t[k]?.en && t[k]?.es, `${t.id}.${k}`);
    assert.ok(t.targets?.length >= 2, `${t.id} targets`);
    assert.ok(t.pages.length >= 4, `${t.id} pages`);
    for (const p of t.pages) {
      if (p.bgArt) assert.ok(keys.has(p.bgArt), `${t.id} bg ${p.bgArt}`);
      for (const e of p.elements)
        if (e.t === "art") assert.ok(keys.has(e.art), `${t.id} art ${e.art}`);
    }
    const b35 = M.bookFromTemplate(t, { title: "T", band: "3-5" });
    const b68 = M.bookFromTemplate(t, { title: "T", band: "6-8" });
    assert.equal(b35.pages.length, t.pages.length);
    assert.ok(
      b35.pages[0].elements.some((e) => e.role === "title" && /T/.test(e.html)),
      `${t.id} cover title filled`,
    );
    for (const p of b35.pages)
      for (const e of p.elements)
        assert.doesNotMatch(
          `${e.alt || ""}${e.ph?.en || ""}${e.ph?.es || ""}${e.html || ""}`,
          /\[object Object\]/,
          `${t.id}: nested language pair`,
        );
    assert.equal(b68.templateId, t.id);
  }
  for (const id of [
    "personal-narrative",
    "my-community",
    "science-investigation",
    "character-setting",
    "vocabulary-picture-book",
    "cause-effect",
    "compare-contrast",
    "persuasive-book",
    "evidence-argument",
    "biography",
    "comic-conversation",
    "mystery-story",
    "how-to",
    "informational-report",
    "poetry-collection",
    "bilingual-storybook",
    "reading-response",
    "language-growth-portfolio",
    "family-stories",
    "our-traditions",
    "community-places",
    "favorite-memory",
    "how-we-make",
    "story-together",
    "mission-report",
    "conversation-book",
  ])
    assert.ok(templateById(id), id);
  assert.ok(templatesFor("3-5").length >= 20 && templatesFor("6-8").length >= 20);
  const text = JSON.stringify(TEMPLATES);
  assert.doesNotMatch(
    text,
    /proficiency level|WIDA level|scale score|\bscore[sd]?\b|\btimers?\b|earn(ed)? points|points (earned|total)/i,
    "no invented proficiency, scores or timers",
  );
});

test("art: 72 original drawings, isolated (no ids, scripts, external refs, text)", () => {
  assert.ok(ART.length >= 72);
  for (const a of ART) {
    assert.match(a.key, /^[a-z0-9-]{2,40}$/);
    assert.ok(
      ART_CATS.some((c) => c.id === a.cat),
      a.key,
    );
    assert.doesNotMatch(
      a.svg,
      /<script|on\w+=|foreignObject|href=|url\(|<image|<text|\sid=/i,
      a.key,
    );
    assert.match(a.svg, /^<svg [^>]*viewBox=/);
  }
});

test("media helpers: YouTube ids only from YouTube; pictures keep their shape on the page; eraser finds strokes", () => {
  assert.equal(youTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youTubeId("https://youtu.be/dQw4w9WgXcQ?t=3"), "dQw4w9WgXcQ");
  assert.equal(youTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
  assert.equal(youTubeId("https://evil.example/watch?v=dQw4w9WgXcQ"), "");
  assert.equal(youTubeId("not a url"), "");
  const { w, h } = fitOnPage(400, 200, 0.75, 60, 60);
  assert.ok(Math.abs((w / h) * 0.75 - 2) < 0.02, `aspect kept (${w}×${h})`);
  const strokes = [
    {
      size: 1,
      pts: [
        [100, 100],
        [200, 200],
      ],
    },
    { size: 1, pts: [[800, 800]] },
  ];
  assert.equal(strokesNear(strokes, [205, 198]).length, 1);
});

test(".langbook: the ZIP reader reads back what zip-store writes", async () => {
  const { readZip } = await import(new URL("src/book/export.js", LAB));
  const bytes = zipStore({
    "book.json": '{"book":{"title":"Z"}}',
    "media/m1.png": new Uint8Array([1, 2, 3]),
  });
  const out = await readZip(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  );
  assert.equal(new TextDecoder().decode(out["book.json"]), '{"book":{"title":"Z"}}');
  assert.deepEqual([...out["media/m1.png"]], [1, 2, 3]);
});

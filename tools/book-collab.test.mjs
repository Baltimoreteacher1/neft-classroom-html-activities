// Book Studio collaboration: the merge rules (shared/class-platform/book-merge.js), the server-side rich-text
// sanitizer, and the device side (access-practice-lab/src/book/collab-model.js) that turns edits into ops and writes
// received items back. Two simulated devices run through the real server merge, so "concurrent" here means two
// devices that both edited from the same revision before either one synced.
import assert from "node:assert/strict";
import test from "node:test";

import {
  applyItems,
  assignOrds,
  bookFromItems,
  clientItem,
  diffBook,
  pendingIds,
  shadowAfterOp,
} from "../access-practice-lab/src/book/collab-model.js";
import { makeElement, makePage, normalizeBook } from "../access-practice-lab/src/book/model.js";
import {
  applyOps,
  COLLAB,
  cleanOps,
  orderedBook,
  sanitizeStoredHtml,
} from "../shared/class-platform/book-merge.js";

/* ── a tiny in-memory server that uses the real merge ────────────────────────── */
function server() {
  const S = {
    rev: 1,
    items: new Map([
      [
        "meta",
        {
          id: "meta",
          kind: "meta",
          page: "",
          ord: 0,
          data: {
            title: "Ours",
            format: "portrait",
            kind: "blank",
            lang: "en",
            dir: "ltr",
            author: "",
          },
          rev: 1,
          by: "s0",
          deleted: false,
        },
      ],
    ]),
  };
  return {
    S,
    sync(by, ops) {
      const cleaned = cleanOps(ops);
      assert.ok(cleaned.ok, cleaned.error);
      const live = [...S.items.values()].filter((i) => !i.deleted);
      const elCount = new Map();
      for (const i of live)
        if (i.kind === "el") elCount.set(i.page, (elCount.get(i.page) || 0) + 1);
      const out = applyOps(
        { items: S.items, pageCount: live.filter((i) => i.kind === "page").length, elCount },
        cleaned.ops,
        { rev: S.rev + 1, by },
      );
      if (out.writes.size) {
        S.rev += 1;
        for (const [id, it] of out.writes) S.items.set(id, it);
      }
      return { ...out, rev: S.rev };
    },
    since(rev) {
      return [...S.items.values()].filter((i) => i.rev > rev);
    },
  };
}

/** A device: a local book, its shadow, and the sync step the browser runs (push the diff, then pull). */
function device(srv, by, book) {
  const D = { by, book: normalizeBook(book), shadow: new Map(), since: 0 };
  D.pull = () => {
    const items = srv.since(D.since).map((i) => clientItem(i));
    const pending = pendingIds(D.shadow, D.book);
    const before = new Map(D.shadow);
    const apply = items.filter((i) => !(pending.has(i.id) && before.has(i.id)));
    for (const it of apply) D.shadow.set(it.id, it);
    applyItems(D.book, apply, before);
    D.since = srv.S.rev;
  };
  D.push = () => {
    const ops = diffBook(D.shadow, D.book);
    if (!ops.length) return { results: [] };
    const res = srv.sync(by, ops);
    const before = new Map(D.shadow);
    const back = [];
    res.results.forEach((r) => {
      if (r.status === "applied") shadowAfterOp(D.shadow, ops[r.i], res.rev, by);
      else if (r.item) {
        const it = clientItem(r.item);
        D.shadow.set(it.id, it);
        back.push(it);
      }
    });
    applyItems(D.book, back, before);
    return res;
  };
  D.sync = () => {
    D.push();
    D.pull();
  };
  D.el = (id) => D.book.pages.flatMap((p) => p.elements).find((e) => e.id === id);
  return D;
}

function twoDevices() {
  const srv = server();
  const p1 = makePage({ id: "page1aaa" });
  const p2 = makePage({ id: "page2bbb" });
  p1.elements.push(makeElement("text", { id: "elA0001", html: "<p>Hello</p>", x: 10 }));
  p1.elements.push(makeElement("text", { id: "elB0002", html: "<p>World</p>", x: 50 }));
  p2.elements.push(makeElement("shape", { id: "elC0003" }));
  const ana = device(srv, "sana", { id: "bana", title: "Ours", pages: [p1, p2] });
  ana.pull(); // receives the meta the server made on share
  ana.sync(); // shares every page and element
  const ben = device(srv, "sben", { id: "bben", title: "Ours", pages: [] });
  ben.book.pages = [];
  ben.pull();
  return { srv, ana, ben };
}

const html = (d, id) => d.el(id)?.html;

test("a joined device receives the whole book in order", () => {
  const { ana, ben } = twoDevices();
  assert.deepEqual(
    ben.book.pages.map((p) => p.id),
    ["page1aaa", "page2bbb"],
  );
  assert.deepEqual(
    ben.book.pages[0].elements.map((e) => e.id),
    ["elA0001", "elB0002"],
  );
  assert.deepEqual(diffBook(ben.shadow, ben.book), [], "nothing to send back after receiving");
  assert.equal(diffBook(ana.shadow, ana.book).length, 0);
});

test("concurrent edits to DIFFERENT elements both survive on both devices", () => {
  const { ana, ben } = twoDevices();
  ana.el("elA0001").html = "<p>Hello from Ana</p>";
  ben.el("elB0002").html = "<p>World from Ben</p>";
  ana.sync();
  ben.sync();
  ana.sync();
  for (const d of [ana, ben]) {
    assert.equal(html(d, "elA0001"), "<p>Hello from Ana</p>");
    assert.equal(html(d, "elB0002"), "<p>World from Ben</p>");
  }
});

test("concurrent edits to DIFFERENT fields of the SAME element merge (move + typing)", () => {
  const { ana, ben } = twoDevices();
  ana.el("elA0001").x = 33;
  ben.el("elA0001").html = "<p>Typed by Ben</p>";
  ana.sync();
  const res = ben.push();
  assert.equal(res.results[0].status, "merged", "Ben's op was stale and merged field by field");
  ben.pull();
  ana.sync();
  for (const d of [ana, ben]) {
    assert.equal(d.el("elA0001").x, 33);
    assert.equal(html(d, "elA0001"), "<p>Typed by Ben</p>");
  }
});

test("the SAME field changed on two devices: the later arrival wins, and both devices converge", () => {
  const { ana, ben } = twoDevices();
  ana.el("elA0001").html = "<p>Ana's words</p>";
  ben.el("elA0001").html = "<p>Ben's words</p>";
  ana.sync();
  ben.sync(); // arrives second
  ana.sync();
  assert.equal(html(ana, "elA0001"), "<p>Ben's words</p>");
  assert.equal(html(ben, "elA0001"), "<p>Ben's words</p>");
});

test("a delete beats a stale edit (delete first)", () => {
  const { ana, ben } = twoDevices();
  ana.book.pages[0].elements = ana.book.pages[0].elements.filter((e) => e.id !== "elB0002");
  ben.el("elB0002").html = "<p>Edit after it was deleted elsewhere</p>";
  ana.sync();
  const res = ben.push();
  assert.equal(res.results[0].status, "rejected");
  assert.equal(res.results[0].reason, "deleted");
  ben.pull();
  assert.equal(ben.el("elB0002"), undefined, "the stale edit did not bring it back");
  assert.equal(ana.el("elB0002"), undefined);
});

test("a delete beats a stale edit (edit first)", () => {
  const { ana, ben } = twoDevices();
  ben.el("elB0002").html = "<p>Ben edits</p>";
  ana.book.pages[0].elements = ana.book.pages[0].elements.filter((e) => e.id !== "elB0002");
  ben.sync();
  ana.sync();
  ben.sync();
  assert.equal(ana.el("elB0002"), undefined);
  assert.equal(ben.el("elB0002"), undefined);
});

test("undo after seeing a delete brings the element back (the deleter's own undo)", () => {
  const { ana, ben } = twoDevices();
  const saved = JSON.parse(JSON.stringify(ana.book));
  ana.book.pages[0].elements.shift();
  ana.sync();
  ana.book = saved; // undo
  ana.sync();
  ben.sync();
  assert.equal(html(ben, "elA0001"), "<p>Hello</p>");
});

test("a page delete removes its elements; an edit on that page is rejected", () => {
  const { srv, ana, ben } = twoDevices();
  ana.book.pages = ana.book.pages.filter((p) => p.id !== "page2bbb");
  ben.el("elC0003").x = 70;
  ana.sync();
  const res = ben.push();
  assert.equal(res.results.find((r) => r.id === "elC0003").status, "rejected");
  ben.pull();
  assert.deepEqual(
    ben.book.pages.map((p) => p.id),
    ["page1aaa"],
  );
  assert.equal(srv.S.items.get("elC0003").deleted, true, "the element went with its page");
  assert.equal(orderedBook(srv.S.items).pages.length, 1);
});

test("the last page cannot be deleted", () => {
  const { ana } = twoDevices();
  ana.book.pages = [ana.book.pages[0]];
  ana.sync();
  ana.book.pages = [];
  const res = ana.push();
  assert.equal(res.results[0].reason, "last-page");
});

test("page moves: one move rewrites one ord; concurrent moves of different pages order deterministically", () => {
  const { ana, ben } = twoDevices();
  ana.book.pages.push(makePage({ id: "page3ccc" }));
  ana.sync();
  ben.sync();
  // Ana moves page 3 to the front; Ben moves page 1 to the end.
  const a = ana.book.pages;
  ana.book.pages = [a[2], a[0], a[1]];
  const ops = diffBook(ana.shadow, ana.book);
  assert.deepEqual(
    ops.map((o) => [o.type, o.id]),
    [["movePage", "page3ccc"]],
    "only the moved page is sent",
  );
  const b = ben.book.pages;
  ben.book.pages = [b[1], b[2], b[0]];
  ana.sync();
  ben.sync();
  ana.sync();
  assert.deepEqual(
    ana.book.pages.map((p) => p.id),
    ben.book.pages.map((p) => p.id),
  );
  assert.deepEqual(
    ana.book.pages.map((p) => p.id),
    ["page3ccc", "page2bbb", "page1aaa"],
  );
});

test("a local move that has not been sent is not undone by a remote change arriving", () => {
  const { ana, ben } = twoDevices();
  ben.el("elA0001").html = "<p>Ben</p>";
  ben.sync();
  const a = ana.book.pages;
  ana.book.pages = [a[1], a[0]]; // not sent yet
  ana.pull();
  assert.deepEqual(
    ana.book.pages.map((p) => p.id),
    ["page2bbb", "page1aaa"],
  );
  assert.equal(html(ana, "elA0001"), "<p>Ben</p>");
});

test("concurrent new elements on the same page both land, in a stable order", () => {
  const { ana, ben } = twoDevices();
  ana.book.pages[0].elements.push(makeElement("text", { id: "newAna01", html: "<p>A</p>" }));
  ben.book.pages[0].elements.push(makeElement("text", { id: "newBen01", html: "<p>B</p>" }));
  ana.sync();
  ben.sync();
  ana.sync();
  const order = (d) => d.book.pages[0].elements.map((e) => e.id);
  assert.deepEqual(order(ana), order(ben));
  assert.ok(order(ana).includes("newAna01") && order(ana).includes("newBen01"));
});

test("attribution: every write carries who made it", () => {
  const { srv, ana, ben } = twoDevices();
  ben.el("elB0002").html = "<p>Ben</p>";
  ben.sync();
  assert.equal(srv.S.items.get("elB0002").by, "sben");
  assert.equal(srv.S.items.get("elA0001").by, "sana");
  ana.sync();
  assert.equal(ana.shadow.get("elB0002").by, "sben");
});

test("remote changes do not touch an element with unsent local edits", () => {
  const { ana, ben } = twoDevices();
  ana.el("elA0001").html = "<p>Ana typing</p>"; // not pushed yet
  ben.el("elA0001").x = 5;
  ben.sync();
  ana.pull();
  assert.equal(html(ana, "elA0001"), "<p>Ana typing</p>", "local typing kept");
  ana.sync();
  ben.sync();
  for (const d of [ana, ben]) {
    assert.equal(html(d, "elA0001"), "<p>Ana typing</p>");
    assert.equal(d.el("elA0001").x, 5);
  }
});

test("assignOrds keeps known order and fills gaps", () => {
  const known = new Map([
    ["a", 1],
    ["b", 2],
    ["c", 3],
  ]);
  const out = assignOrds(["c", "a", "b"], (id) => known.get(id));
  assert.equal(out.get("a"), 1);
  assert.equal(out.get("b"), 2);
  assert.ok(out.get("c") < 1, "only the moved item gets a new ord");
  const fresh = assignOrds(["a", "x", "y", "b"], (id) => known.get(id));
  assert.ok(fresh.get("x") > 1 && fresh.get("x") < fresh.get("y") && fresh.get("y") < 2);
});

test("bookFromItems builds the reading order", () => {
  const items = [
    { id: "p2xx", kind: "page", ord: 2, data: { bg: "#ffffff" }, deleted: false },
    { id: "p1xx", kind: "page", ord: 1, data: { bg: "#fffaf0" }, deleted: false },
    {
      id: "e1xx",
      kind: "el",
      page: "p1xx",
      ord: 2,
      data: makeElement("text", { id: "e1xx" }),
      deleted: false,
    },
    {
      id: "e0xx",
      kind: "el",
      page: "p1xx",
      ord: 1,
      data: makeElement("text", { id: "e0xx" }),
      deleted: false,
    },
  ].map((i) => clientItem(i));
  const b = bookFromItems(items);
  assert.deepEqual(
    b.pages.map((p) => p.id),
    ["p1xx", "p2xx"],
  );
  assert.deepEqual(
    b.pages[0].elements.map((e) => e.id),
    ["e0xx", "e1xx"],
  );
});

test("op validation refuses bad shapes and oversized items", () => {
  assert.equal(cleanOps("x").ok, false);
  assert.equal(cleanOps([{ type: "nuke", id: "abcd", baseRev: 0 }]).error, "invalid-op");
  assert.equal(
    cleanOps([{ type: "upsertPage", id: "../x", baseRev: 0, data: {} }]).error,
    "invalid-id",
  );
  assert.equal(cleanOps([{ type: "upsertPage", id: "abcd", data: {} }]).error, "invalid-base-rev");
  assert.equal(cleanOps([{ type: "movePage", id: "abcd", baseRev: 0 }]).error, "invalid-ord");
  const many = Array.from({ length: COLLAB.maxOpsPerSync + 1 }, () => ({
    type: "deletePage",
    id: "abcd",
    baseRev: 0,
  }));
  assert.equal(cleanOps(many).error, "too-many-ops");
  const big = {
    type: "upsertElement",
    id: "elbig1",
    page: "page1aaa",
    baseRev: 0,
    data: {
      type: "drawing",
      strokes: Array.from({ length: 300 }, () => ({
        pts: Array.from({ length: 400 }, () => [500, 500]),
      })),
    },
  };
  assert.equal(cleanOps([big]).error, "item-too-large");
  const ok = cleanOps([
    {
      type: "upsertElement",
      id: "e123",
      page: "p123",
      baseRev: 0,
      data: { type: "text", html: '<p onclick="x()">hi<script>alert(1)</script></p>', x: 9999 },
    },
  ]);
  assert.ok(ok.ok);
  assert.equal(ok.ops[0].data.html, "<p>hi</p>");
  assert.equal(ok.ops[0].data.x, 150, "coordinates clamped by the model's own normalizer");
});

test("server sanitizer: the Book Studio allow-list without a DOM", () => {
  const cases = [
    ["<p>Hi <b>there</b></p>", "<p>Hi <b>there</b></p>"],
    ["<strong>x</strong><em>y</em>", "<b>x</b><i>y</i>"],
    ["<div>block</div>", "<p>block</p>"],
    ['<p onclick="steal()">x</p>', "<p>x</p>"],
    ["<script>alert(1)</script>after", "after"],
    ["<style>p{}</style><p>a</p>", "<p>a</p>"],
    ['<img src=x onerror="alert(1)">', ""],
    ['<a href="javascript:alert(1)">x</a>', "<a>x</a>"],
    [
      '<a href="https://example.org/?a=1&amp;b=2">x</a>',
      '<a href="https://example.org/?a=1&amp;b=2" rel="noopener noreferrer" target="_blank">x</a>',
    ],
    ['<span style="color:#ff0000">red</span>', '<span data-c="#ff0000">red</span>'],
    ['<span data-c="red;background:url(x)">x</span>', "x"],
    ['<span lang="es" dir="rtl">hola</span>', '<span lang="es" dir="rtl">hola</span>'],
    ['<font color="#00ff00">g</font>', '<span data-c="#00ff00">g</span>'],
    ["a < b & c > d", "a &lt; b &amp; c &gt; d"],
    ["5 &lt; 6 &nbsp;ok", "5 &lt; 6 &nbsp;ok"],
    ["<p>open", "<p>open</p>"],
    ["</p>stray", "stray"],
    ["<!-- hidden --><p>x</p>", "<p>x</p>"],
    ["<svg><script>alert(1)</script></svg>ok", "ok"],
    ["<iframe src=//evil></iframe>x", "x"],
    ["<p>line<br>two<br/></p>", "<p>line<br>two<br></p>"],
    ["<span>bare</span>", "bare"],
    ["<h1>Big</h1>", "<p>Big</p>"],
    [
      '<a href="https://x.org" onmouseover="e()">x</a>',
      '<a href="https://x.org" rel="noopener noreferrer" target="_blank">x</a>',
    ],
  ];
  for (const [input, want] of cases) assert.equal(sanitizeStoredHtml(input), want, input);
  // Idempotent on its own output, so a stored value never drifts on re-save.
  for (const [input] of cases) {
    const once = sanitizeStoredHtml(input);
    assert.equal(sanitizeStoredHtml(once), once, `idempotent: ${input}`);
  }
  // No output may contain an event handler, a script, or a non-http link.
  const hostile =
    '<p><a href=" JaVaScRiPt:x">a</a><b onload=x>b</b><scr<script>ipt>c</p><SCRIPT>d</SCRIPT>';
  const out = sanitizeStoredHtml(hostile);
  assert.ok(!/on\w+=|<script|javascript:/i.test(out), out);
});

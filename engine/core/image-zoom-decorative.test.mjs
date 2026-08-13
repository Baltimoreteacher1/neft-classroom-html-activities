// A decorative figure must never become a keyboard stop.
//
// axe reported `aria-hidden-focus` on every small-group lesson: the themed hero
// banner ships as `<svg role="img" aria-hidden="true">`, image-zoom measured it
// as a large picture and gave it tabindex="0", and a screen-reader user tabbed
// onto a node their reader is required to skip. The guard lives in image-zoom.js
// so one fix covers both lesson-renderer.js and small-group-renderer.js.
//
// These tests drive the module's real exports against a minimal DOM rather than
// asserting on source text, so a refactor that keeps the behaviour keeps passing
// and one that loses it fails.

import assert from "node:assert/strict";
import test from "node:test";

/* ---------------------------------------------------------------- minimal DOM */
/* Only the surface image-zoom.js actually touches. Enough to run the predicates
   and the attach path; not a general-purpose DOM. */
class El {
  constructor(tag, ns) {
    this.tagName = tag;
    this.namespaceURI = ns || "http://www.w3.org/1999/xhtml";
    this.attributes = new Map();
    this.children = [];
    this.parent = null;
    this.dataset = {};
    this.style = {};
    this.classList = {
      _s: new Set(),
      add: (c) => this.classList._s.add(c),
      remove: (c) => this.classList._s.delete(c),
      contains: (c) => this.classList._s.has(c),
    };
    this._listeners = {};
  }
  setAttribute(k, v) {
    this.attributes.set(k, String(v));
    if (k === "tabindex") this.tabIndexSet = true;
  }
  getAttribute(k) {
    return this.attributes.has(k) ? this.attributes.get(k) : null;
  }
  hasAttribute(k) {
    return this.attributes.has(k);
  }
  removeAttribute(k) {
    this.attributes.delete(k);
  }
  append(child) {
    child.parent = this;
    this.children.push(child);
  }
  addEventListener(type, fn) {
    (this._listeners[type] ||= []).push(fn);
  }
  querySelector() {
    return null;
  }
  getBoundingClientRect() {
    return { width: this._w ?? 320, height: this._h ?? 200 };
  }
  /* Supports exactly the selector shapes image-zoom.js passes: comma-separated
     attribute selectors, class selectors and tag names, matched up the tree. */
  closest(selector) {
    const parts = selector.split(",").map((s) => s.trim()).filter(Boolean);
    let node = this;
    while (node) {
      for (const p of parts) {
        if (p.startsWith("[")) {
          const m = /^\[([\w-]+)(?:=["']?([^\]"']*)["']?)?\]$/.exec(p);
          if (m) {
            const [, name, value] = m;
            if (node.attributes.has(name) && (value === undefined || node.attributes.get(name) === value)) return node;
          }
        } else if (p.startsWith(".")) {
          if (node.classList.contains(p.slice(1))) return node;
        } else if (node.tagName === p) {
          return node;
        }
      }
      node = node.parent;
    }
    return null;
  }
}

const svgEl = (attrs = {}) => {
  const s = new El("svg", "http://www.w3.org/2000/svg");
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  return s;
};

/* image-zoom.js touches `document` at import time only inside functions, but
   attachFigureZoom registers listeners, so a stub keeps it from throwing. */
globalThis.document = globalThis.document || {
  getElementById: () => null,
  createElement: (t) => new El(t),
  head: new El("head"),
  documentElement: new El("html"),
  body: new El("body"),
  addEventListener() {},
};

const { attachFigureZoom } = await import("./image-zoom.js");

/* ------------------------------------------------------------------- the tests */

test("an aria-hidden figure is never given a tab stop", () => {
  const svg = svgEl({ "aria-hidden": "true", role: "img", viewBox: "0 0 320 200" });
  attachFigureZoom(svg);
  assert.equal(svg.getAttribute("tabindex"), null, "decorative figure must not be focusable");
  assert.equal(svg.classList.contains("is-zoomable"), false, "and must not advertise zoom");
});

test("a figure inside an aria-hidden container is also skipped (aria-hidden inherits)", () => {
  const wrap = new El("div");
  wrap.setAttribute("aria-hidden", "true");
  const svg = svgEl({ role: "img", viewBox: "0 0 320 200" });
  wrap.append(svg);
  attachFigureZoom(svg);
  assert.equal(svg.getAttribute("tabindex"), null);
});

test("role=presentation and role=none make the same claim and are honoured", () => {
  for (const role of ["presentation", "none"]) {
    const svg = svgEl({ role, viewBox: "0 0 320 200" });
    attachFigureZoom(svg);
    assert.equal(svg.getAttribute("tabindex"), null, `role="${role}" must not be focusable`);
  }
});

test("an inert subtree is skipped", () => {
  const wrap = new El("div");
  wrap.setAttribute("inert", "");
  const svg = svgEl({ role: "img", viewBox: "0 0 320 200" });
  wrap.append(svg);
  attachFigureZoom(svg);
  assert.equal(svg.getAttribute("tabindex"), null);
});

test("a real content figure STILL gets its tab stop — the fix must not disable zoom", () => {
  const svg = svgEl({ role: "img", viewBox: "0 0 320 200" });
  attachFigureZoom(svg);
  assert.equal(svg.getAttribute("tabindex"), "0", "content figures stay keyboard-reachable");
  assert.equal(svg.classList.contains("is-zoomable"), true);
});

console.log(
  "PASS image-zoom-decorative: decorative figures take no tab stop, content figures keep theirs",
);

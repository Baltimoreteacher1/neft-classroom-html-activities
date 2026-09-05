import assert from "node:assert/strict";
import test from "node:test";

// Minimal DOM stub so the real storyboard module imports in node.
function fakeEl() {
  return {
    _children: [],
    attrs: {},
    style: {},
    _l: {},
    className: "",
    set src(v) {
      this._src = v;
    },
    get src() {
      return this._src;
    },
    setAttribute(k, v) {
      this.attrs[k] = v;
    },
    getAttribute(k) {
      return this.attrs[k];
    },
    addEventListener(t, f) {
      this._l[t] = f;
    },
    appendChild(c) {
      this._children.push(c);
      return c;
    },
    remove() {
      this._removed = true;
    },
  };
}
globalThis.window = { matchMedia: () => ({ matches: false }) };
globalThis.document = { createElement: () => fakeEl() };

const { mountAuthoredArt } = await import("@eduwonderlab/engine/core/small-group-storyboard.js");

test("returns false with no usable src (fallback path stays intact)", () => {
  assert.equal(
    mountAuthoredArt(fakeEl(), null, () => {}),
    false,
  );
  assert.equal(
    mountAuthoredArt(fakeEl(), {}, () => {}),
    false,
  );
  assert.equal(
    mountAuthoredArt(null, { src: "/a.webp" }, () => {}),
    false,
  );
});

test("renders a lazy img with the src and a real alt", () => {
  const host = fakeEl();
  assert.equal(
    mountAuthoredArt(host, { src: "/a.webp", alt: "a robot" }, () => {}),
    true,
  );
  const img = host._children[0];
  assert.equal(img._src, "/a.webp");
  assert.equal(img.loading, "lazy");
  assert.equal(img.alt, "a robot");
});

test("decorative / alt-less art is hidden from assistive tech", () => {
  const host = fakeEl();
  mountAuthoredArt(host, { src: "/b.webp" }, () => {});
  assert.equal(host._children[0].attrs["aria-hidden"], "true");
  assert.equal(host._children[0].alt, "");
});

test("on load error, the fallback fires and the broken img is removed", () => {
  let fellBack = false;
  const host = fakeEl();
  mountAuthoredArt(host, { src: "/x.webp", alt: "x" }, () => {
    fellBack = true;
  });
  host._children[0]._l.error();
  assert.equal(fellBack, true);
  assert.equal(host._children[0]._removed, true);
});

test("accepts a bare string src (treated as decorative)", () => {
  const host = fakeEl();
  assert.equal(
    mountAuthoredArt(host, "/c.webp", () => {}),
    true,
  );
  assert.equal(host._children[0].attrs["aria-hidden"], "true");
});

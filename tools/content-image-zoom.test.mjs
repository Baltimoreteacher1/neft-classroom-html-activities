// Every picture a student can see must enlarge when tapped — not only the ones
// a call site remembered to wire.
//
// From the classroom (Joel, 2026-08-11): the tape-diagram problem image on
// /lessons/1-3/ did nothing when tapped. The cause was structural, not a typo.
// attachImageZoom() was called at five hand-picked sites in lesson-renderer.js
// (reveal slides, Notice & Wonder, word-problem art, the vocab pop-up, the
// objective visual-model card) and at ZERO sites in small-group-renderer.js. Any
// image rendered by a sixth path looked identical and was dead, and the entire
// small-group fleet had no zoom at all.
//
// observeContentImageZoom() replaces per-site wiring with one observer, so this
// pins the three things that make it trustworthy: it wires what is already
// there, it wires what arrives later (phases render lazily), and it leaves
// chrome alone.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

/* ── 1 · both renderers must actually start the observer ─────────────────── */
const lessonRenderer = read("engine/core/lesson-renderer.js");
const sgRenderer = read("engine/core/small-group-renderer.js");
for (const [label, src] of [
  ["lesson-renderer.js", lessonRenderer],
  ["small-group-renderer.js", sgRenderer],
]) {
  assert.ok(
    /import\s*\{[^}]*observeContentImageZoom[^}]*\}\s*from\s*"\.\/image-zoom\.js"/.test(src),
    `${label} must import observeContentImageZoom`,
  );
  assert.ok(
    /observeContentImageZoom\(\s*document\.body\s*\)/.test(src),
    `${label} must start the observer on document.body`,
  );
}

/* ── 2 · behaviour, against a real DOM ───────────────────────────────────── */
const dom = new JSDOM('<!doctype html><body><img id="a" src="/x.png" alt="a scene"></body>', {
  url: "https://example.test/",
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.HTMLElement = dom.window.HTMLElement;

const { observeContentImageZoom } = await import("../engine/core/image-zoom.js");
observeContentImageZoom(document.body);

const first = document.getElementById("a");
assert.equal(first.dataset.zoomable, "1", "an image already in the DOM is wired");
assert.ok(first.classList.contains("is-zoomable"), "and carries the affordance class");
assert.equal(first.getAttribute("tabindex"), "0", "and is reachable by keyboard");

// A lazily-rendered phase mounting its figure later — the case per-site wiring
// kept missing.
const late = document.createElement("figure");
late.innerHTML = '<img id="late" src="/tape-diagram.png" alt="tape diagram">';
document.body.append(late);

// Chrome that must be left alone.
const icon = document.createElement("img");
icon.id = "icon";
icon.width = 24;
icon.height = 24;
icon.src = "/icon.png";
document.body.append(icon);

const optOut = document.createElement("img");
optOut.id = "optout";
optOut.setAttribute("data-no-zoom", "");
optOut.src = "/decor.png";
document.body.append(optOut);

await new Promise((r) => setTimeout(r, 20)); // let the MutationObserver flush

assert.equal(
  document.getElementById("late").dataset.zoomable,
  "1",
  "an image added after boot is wired",
);
assert.notEqual(document.getElementById("icon").dataset.zoomable, "1", "a 24px icon is not wired");
assert.notEqual(
  document.getElementById("optout").dataset.zoomable,
  "1",
  "[data-no-zoom] is respected",
);

console.log(
  "content image zoom: both renderers observe; existing + late images wire; icons and opt-outs skipped.",
);

/* ── 3 · inline-SVG figures: pictures zoom, manipulatives do not ─────────── */
const { attachFigureZoom } = await import("../engine/core/image-zoom.js");
void attachFigureZoom; // exported for direct use; behaviour is asserted below

const svgNs = "http://www.w3.org/2000/svg";
const makeSvg = (viewBox, parent) => {
  const svg = document.createElementNS(svgNs, "svg");
  svg.setAttribute("viewBox", viewBox);
  (parent || document.body).append(svg);
  return svg;
};

// A tape diagram: a plain picture, wide enough to be content.
const tape = makeSvg("0 0 640 240");
tape.append(document.createElementNS(svgNs, "rect"));

// A mounted interactive lab: the student drags this, so a click must not be
// stolen to open a lightbox.
const lab = document.createElement("div");
lab.dataset.ivMounted = "1";
document.body.append(lab);
const labSvg = makeSvg("0 0 640 240", lab);

// A decorative bullet icon.
const tiny = makeSvg("0 0 24 24");

await new Promise((r) => setTimeout(r, 20));

assert.equal(tape.dataset.zoomable, "1", "a static tape-diagram figure is zoomable");
assert.equal(tape.getAttribute("tabindex"), "0", "and is keyboard reachable");
assert.notEqual(
  labSvg.dataset.zoomable,
  "1",
  "an SVG inside a mounted interactive lab keeps its own pointer handling",
);
assert.notEqual(tiny.dataset.zoomable, "1", "a 24-unit icon is not a figure");

console.log("inline SVG: static figures zoom; interactive labs and icons are left alone.");

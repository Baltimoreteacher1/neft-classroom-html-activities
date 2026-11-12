// Every picture the student app shows (studio engine frames and Build panels, living models, the lab's fallback
// models) is drawn in a fixed viewBox, often ~560 units wide; on a 320px phone its labels would render at 8-12px.
// After a picture is shown this lays its labels out again for the size it really renders at, in this order:
//   1. every label renders at 14px or more;
//   2. a sentence that cannot fit the picture's width at that size is moved under the picture as text
//      (an SVG label cannot wrap); a two-word or hyphenated label breaks onto two lines instead;
//   3. a label that would stick out of the side moves back in; labels that touch move apart vertically (a tick
//      value stays on its axis); side-by-side labels first get a wider picture, and are staggered only if that fails;
//   4. the viewBox grows vertically to hold anything that now reaches past its top or bottom;
//   5. ASCII math in a label is shown with true symbols (−, ×, ÷).
// Every change is recomputed from the engine's own attributes (data-l-*), so it is idempotent and follows the width.
export const MIN_PX = 14;
const LONG_WORDS = 4;
const MARGIN = 3; // px kept between labels and from the picture's edge
const GAP = 1; // labels side by side need at least this much space between them, or "−3−2" reads as one number
const SVG_NS = "http://www.w3.org/2000/svg";

// "-3", "3 - 2", "(-2, -6)", "4 x 5", "8 * 2" → true minus and times. A hyphen inside a word ("ten-thousands") stays.
export const trueSymbols = (text) =>
  text
    .replace(/(^|[\s(,=+×÷−[])-(?=\d|\.\d)/g, "$1−")
    .replace(/(\d|\))\s+-\s+(?=[\d(−])/g, "$1 − ")
    .replace(/(\d)\s*[x*]\s*(?=\d)/g, "$1 × ");

const skip = (svg) =>
  svg.closest(".buddy, .meter, .meter-mini") || svg.classList.contains("bd-svg");

// Puts back what the engine drew before the last layout. A value the engine itself changed since then (a living
// model updating a label) is taken as the new original, so the layout never undoes the model.
const OUT = Symbol("legible");
function restore(svg) {
  const vbNow = svg.getAttribute("viewBox");
  if (svg[OUT] === undefined || vbNow !== svg[OUT]) svg.dataset.lVb = vbNow;
  for (const text of svg.querySelectorAll("text")) {
    const out = text[OUT];
    const now = { x: text.getAttribute("x"), y: text.getAttribute("y"), txt: text.textContent };
    if (!out) text[OUT] = { orig: { ...now, fs: text.style.fontSize, html: text.innerHTML } };
    else {
      for (const k of ["x", "y"]) if (now[k] !== out[k]) out.orig[k] = now[k];
      if (now.txt !== out.txt) out.orig.html = text.innerHTML;
    }
  }
  reset(svg);
}
// Back to the engine's drawing (as last adopted by restore), then true math symbols.
function reset(svg) {
  svg.setAttribute("viewBox", svg.dataset.lVb);
  svg.style.minWidth = "";
  svg.style.maxHeight = "";
  if (svg.nextElementSibling?.classList.contains("svg-notes")) svg.nextElementSibling.remove();
  for (const text of svg.querySelectorAll("text")) {
    const { orig } = text[OUT];
    for (const k of ["x", "y"]) orig[k] === null ? text.removeAttribute(k) : text.setAttribute(k, orig[k]);
    if (text.innerHTML !== orig.html) text.innerHTML = orig.html;
    text.style.fontSize = orig.fs;
    text.removeAttribute("display");
    if (!text.children.length) {
      const fixed = trueSymbols(text.textContent);
      if (fixed !== text.textContent) text.textContent = fixed;
    }
  }
}
// Remembers what the layout left, so the next pass can tell its own changes from the engine's.
function remember(svg) {
  svg[OUT] = svg.getAttribute("viewBox");
  for (const text of svg.querySelectorAll("text"))
    if (text[OUT]) Object.assign(text[OUT], { x: text.getAttribute("x"), y: text.getAttribute("y"), txt: text.textContent });
}

// Axis numerals (class sd-axis-num) are laid out by their picture: a numbered plane needs a number at every unit, which
// can never all be 14px wide. They are left at the size and place the engine drew them, and the picture is not widened for them.
const visible = (text) => {
  if (text.classList.contains("sd-axis-num")) return false;
  const cs = getComputedStyle(text);
  return text.textContent.trim() && cs.display !== "none" && cs.visibility !== "hidden";
};

// The picture's real scale: width-bound normally, height-bound when a max-height letterboxes it.
function scaleOf(svg) {
  const r = svg.getBoundingClientRect();
  const vb = svg.viewBox?.baseVal;
  if (!r.width || !vb?.width) return 0;
  return Math.min(
    r.width / vb.width,
    r.height && vb.height ? r.height / vb.height : Number.POSITIVE_INFINITY,
  );
}

function breakLine(text, lines) {
  const x = text.getAttribute("x") ?? "0";
  text.textContent = "";
  lines.forEach((line, i) => {
    const span = text.ownerDocument.createElementNS(SVG_NS, "tspan");
    span.setAttribute("x", x);
    if (i) span.setAttribute("dy", "1.1em");
    span.textContent = line;
    text.append(span);
  });
}
const halves = (s) => {
  const cut = [...s.matchAll(/[\s-]/g)]
    .map((m) => m.index)
    .sort((a, b) => Math.abs(a - s.length / 2) - Math.abs(b - s.length / 2))[0];
  return cut === undefined
    ? null
    : [s.slice(0, cut + (s[cut] === "-" ? 1 : 0)).trim(), s.slice(cut + 1).trim()];
};

export function layoutSvg(svg) {
  if (skip(svg) || !svg.getAttribute("viewBox")) return;
  restore(svg);
  try {
    arrange(svg);
  } finally {
    remember(svg);
  }
}

const overlapping = (texts) => {
  const rects = texts.map((t) => t.getBoundingClientRect());
  const hits = new Set();
  for (let i = 0; i < rects.length; i += 1)
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i];
      const c = rects[j];
      const w = Math.min(a.right, c.right) - Math.max(a.left, c.left);
      const h = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
      if (w > -GAP && h > 1) hits.add(texts[i]).add(texts[j]);
    }
  return [...hits];
};

// One layout at the picture's current width. Returns the labels that still touch each other.
function fit(svg) {
  const scale = scaleOf(svg);
  if (!scale) return [];
  const texts = [...svg.querySelectorAll("text")].filter(visible);
  const need = MIN_PX / scale;
  for (const text of texts) {
    const drawn = Number.parseFloat(getComputedStyle(text).fontSize) || 16;
    if (drawn < need) text.style.fontSize = `${need.toFixed(2)}px`;
  }
  const box = () => svg.getBoundingClientRect();
  // A sentence wider than the picture goes under it as text; a short label breaks onto two lines.
  const notes = [];
  for (const text of texts) {
    if (text.getBoundingClientRect().width <= box().width - 2 * MARGIN) continue;
    const parts = text.textContent.trim().split(/\s+/).length < LONG_WORDS && !text.children.length ? halves(text.textContent.trim()) : null;
    if (parts) breakLine(text, parts);
    else {
      notes.push(text.textContent.trim());
      text.setAttribute("display", "none");
    }
  }
  if (notes.length) {
    const list = svg.ownerDocument.createElement("ul");
    list.className = "svg-notes";
    for (const note of notes) list.append(Object.assign(svg.ownerDocument.createElement("li"), { textContent: note }));
    svg.after(list);
  }
  const shown = texts.filter((t) => t.getAttribute("display") !== "none");
  // Labels that collide only because they grew: a hyphenated or two-word WORD label tries two lines first.
  // Numbers and coordinates ("run 1", "(−2, −6)") never break: a split number reads as two numbers.
  for (const text of overlapping(shown))
    if (!text.children.length && WORDY.test(text.textContent.trim())) {
      const parts = halves(text.textContent.trim());
      if (parts) breakLine(text, parts);
    }
  // Back inside the sides.
  for (const text of shown) {
    const r = text.getBoundingClientRect();
    const b = box();
    if (r.left < b.left + MARGIN) shift(text, "x", b.left + MARGIN - r.left);
    else if (r.right > b.right - MARGIN) shift(text, "x", b.right - MARGIN - r.right);
  }
  // Lines that now sit on each other (a two-line label drawn as two labels, a label just above another) move apart.
  separate(svg, shown, false);
  return overlapping(shown);
}

const WORDY = /^[\p{L}]+(?:[\s-][\p{L}]+)?-?$/u;
// Moves a label by `px` screen pixels along one axis, in its own user units (a label inside a scaled group moves
// by the right amount), together with any line of it that carries its own position.
function shift(text, axis, px) {
  const m = text.getScreenCTM();
  const k = m ? (axis === "x" ? Math.hypot(m.a, m.b) : Math.hypot(m.c, m.d)) : 1;
  if (!k) return;
  const move = (el) => {
    if (!el.hasAttribute(axis) && el !== text) return;
    const v = (Number.parseFloat(el.getAttribute(axis)) || 0) + px / k;
    el.setAttribute(axis, v.toFixed(2));
  };
  move(text);
  for (const span of text.querySelectorAll(`tspan[${axis}]`)) move(span);
}

// A bare tick value ("−7", "25%", "0.12") marks a place on an axis, so it stays put and the other label moves.
const TICK = /^[−-]?\d+(?:[.,]\d+)?%?$/;
const rowsApart = (a, c) =>
  Math.abs(a.top + a.height / 2 - (c.top + c.height / 2)) >= 0.4 * Math.max(a.height, c.height);

// Pulls apart labels that touch. Labels on different rows always separate (widening the picture cannot help
// them). With `all`, labels on the same row are separated too: the last resort when no width holds them side by
// side. The label that moves is the lower one unless it is a tick value; it moves up, down, left or right, by just
// enough, whichever touches the fewest other labels and stays inside the picture's sides. Returns the moves made.
function separate(svg, texts, all) {
  let moves = 0;
  const box = svg.getBoundingClientRect();
  for (let pass = 0; pass < 6; pass += 1) {
    let moved = false;
    const top = new Map(texts.map((t) => [t, t.getBoundingClientRect().top]));
    const order = [...texts].sort((a, b) => top.get(a) - top.get(b));
    for (let i = 0; i < order.length; i += 1)
      for (let j = i + 1; j < order.length; j += 1) {
        const [a, c] = [order[i], order[j]];
        const ra = a.getBoundingClientRect();
        const rc = c.getBoundingClientRect();
        const w = Math.min(ra.right, rc.right) - Math.max(ra.left, rc.left);
        const h = Math.min(ra.bottom, rc.bottom) - Math.max(ra.top, rc.top);
        if (w <= -GAP || h <= 1 || (!all && !rowsApart(ra, rc))) continue;
        const upperMoves = TICK.test(c.textContent.trim()) && !TICK.test(a.textContent.trim());
        const [mover, fixed] = upperMoves ? [a, rc] : [c, ra];
        const rm = mover.getBoundingClientRect();
        const up = ["y", fixed.top - MARGIN - rm.bottom];
        const down = ["y", fixed.bottom + MARGIN - rm.top];
        // A tick value only ever moves along its tick (up or down), so it still marks its place on the axis.
        const options = [upperMoves ? up : down, upperMoves ? down : up];
        if (!TICK.test(mover.textContent.trim())) options.push(["x", fixed.right + MARGIN - rm.left], ["x", fixed.left - MARGIN - rm.right]);
        const cost = ([axis, d]) => {
          const r = axis === "x" ? { l: rm.left + d, r: rm.right + d, t: rm.top, b: rm.bottom } : { l: rm.left, r: rm.right, t: rm.top + d, b: rm.bottom + d };
          const outside = r.l < box.left + MARGIN - 0.5 || r.r > box.right - MARGIN + 0.5 ? 100 : 0;
          return outside + texts.filter((t) => {
            if (t === mover) return false;
            const o = t.getBoundingClientRect();
            return Math.min(r.r, o.right) - Math.max(r.l, o.left) > 1 && Math.min(r.b, o.bottom) - Math.max(r.t, o.top) > 1;
          }).length;
        };
        const [axis, d] = options.reduce((best, o) => (cost(o) < cost(best) ? o : best));
        shift(mover, axis, d);
        moves += 1;
        moved = true;
      }
    if (!moved) return moves;
  }
  return moves;
}

// Grow the viewBox (height only, so a width-bound scale is kept) to hold every label above and below. Under a
// height cap the taller picture draws smaller, so the labels are enlarged again for the new scale and re-checked.
function holdVertically(svg) {
  const shown = [...svg.querySelectorAll("text")].filter((t) => visible(t) && t.getAttribute("display") !== "none");
  for (let round = 0; round < 4; round += 1) {
    const scale = scaleOf(svg);
    if (!scale) return;
    const need = MIN_PX / scale;
    for (const text of shown)
      if ((Number.parseFloat(getComputedStyle(text).fontSize) || 16) < need - 0.01) text.style.fontSize = `${need.toFixed(2)}px`;
    const b = svg.getBoundingClientRect();
    let top = 0;
    let bottom = 0;
    for (const text of shown) {
      const r = text.getBoundingClientRect();
      top = Math.max(top, b.top + MARGIN - r.top);
      bottom = Math.max(bottom, r.bottom - (b.bottom - MARGIN));
    }
    if (top <= 0.5 && bottom <= 0.5) return;
    const vb = svg.viewBox.baseVal;
    svg.setAttribute("viewBox", `${vb.x} ${(vb.y - top / scale).toFixed(2)} ${vb.width} ${(vb.height + (top + bottom) / scale).toFixed(2)}`);
  }
}

// A picture too dense for its labels at this width is drawn wider instead of letting labels collide: it keeps
// every label at 14px and the box around it scrolls sideways (focusable, labelled), never the page.
const PAN_STEPS = [1, 1.3, 1.6, 2, 2.5];
function arrange(svg) {
  const host = svg.parentElement;
  const base = svg.getBoundingClientRect().width;
  const widen = (factor) => {
    reset(svg);
    // A wider picture must also be allowed to grow taller, or a height cap keeps its scale (and labels) unchanged.
    svg.style.minWidth = factor > 1 ? `${Math.round(base * factor)}px` : "";
    svg.style.maxHeight = factor > 1 ? "none" : "";
  };
  // The narrowest width at which nothing touches. Failing that, the narrowest width at which the touching labels
  // can be separated cleanly (every touching pair settled by moving one label, with no knock-on moves).
  const shown = () => [...svg.querySelectorAll("text")].filter((t) => visible(t) && t.getAttribute("display") !== "none");
  const left = [];
  for (const factor of PAN_STEPS) {
    if (factor > 1) widen(factor);
    left.push(fit(svg).length);
    if (!left.at(-1)) break;
  }
  if (left.at(-1)) {
    let settled = false;
    for (const [i, factor] of PAN_STEPS.entries()) {
      widen(factor);
      fit(svg);
      const moves = separate(svg, shown(), true);
      if (!overlapping(shown()).length && moves <= Math.ceil(left[i] / 2)) {
        settled = true;
        break;
      }
    }
    if (!settled) {
      widen(PAN_STEPS.at(-1));
      fit(svg);
      separate(svg, shown(), true);
    }
  }
  const panned = svg.style.minWidth !== "";
  host.classList.toggle("pan-host", panned);
  if (panned && !host.dataset.lPan) {
    host.dataset.lPan = [host.getAttribute("tabindex"), host.getAttribute("role"), host.getAttribute("aria-label")].map((v) => v ?? "").join("|");
    if (!host.hasAttribute("tabindex")) host.setAttribute("tabindex", "0");
    if (!host.hasAttribute("role")) host.setAttribute("role", "group");
    if (!host.hasAttribute("aria-label")) host.setAttribute("aria-label", panLabel());
  } else if (!panned && host.dataset.lPan !== undefined) {
    const [tab, role, label] = host.dataset.lPan.split("|");
    for (const [attr, v] of [["tabindex", tab], ["role", role], ["aria-label", label]])
      v ? host.setAttribute(attr, v) : host.removeAttribute(attr);
    delete host.dataset.lPan;
  }
  holdVertically(svg);
}
let panLabel = () => "Picture: scroll sideways to see all of it";
export const setPanLabel = (fn) => (panLabel = fn);

export function legibleSvg(root) {
  for (const svg of root.querySelectorAll("svg[viewBox]")) {
    try {
      layoutSvg(svg);
    } catch {
      /* a picture that cannot be measured (detached mid-frame) is laid out on the next pass */
    }
  }
}

export function keepLegible(root) {
  let queued = false;
  let lastWidth = innerWidth;
  const run = () => {
    queued = false;
    observer.disconnect();
    legibleSvg(root);
    observer.observe(root, { childList: true, subtree: true });
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(run);
    }
  };
  const observer = new MutationObserver(queue);
  observer.observe(root, { childList: true, subtree: true });
  addEventListener("resize", () => {
    if (innerWidth !== lastWidth) {
      lastWidth = innerWidth;
      queue();
    }
  });
  queue();
}

// scene-annotate.js — "Annotate the figure": a lightweight, non-destructive
// freehand ANNOTATION overlay a student can draw on top of ANY figure card
// (an SVG diagram or an <img>) IN PLACE. It turns a passive "look at the
// figure" into active observation — circle what you notice, underline a side,
// mark a point, jot the pattern you see. Pairs with a Notice & Wonder hotspot
// layer that seeds structured "I notice…" observations.
//
// Design principle — NON-BLOCKING BY DEFAULT:
//   Draw mode starts OFF, so the overlay never intercepts the underlying
//   figure's own taps/interactions (a Data-Live plot, a drag widget, a link).
//   The student turns ✏️ Draw ON to capture the pointer and mark up the
//   figure, and turns it OFF to interact with the figure again. Strokes are
//   stored as point arrays so Undo pops one whole stroke at a time, and an
//   optional persistKey saves/restores the marks across reloads.
//
// Public API:
//   attachAnnotator(figureEl, opts) -> { destroy } | null
//   renderHotspots(figureEl, hotspots, onTag) -> { destroy } | null

const STYLE_ID = "scene-annotate-styles";

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
  .sanno{--sa-teal:var(--teal,#2a9d8f);--sa-coral:var(--coral,#d9795d);--sa-navy:var(--navy,#264653);--sa-ink:var(--ink,#333);--sa-muted:var(--muted,#6b7280)}
  .sanno-canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;touch-action:none;z-index:3}
  .sanno-canvas.on{pointer-events:auto;cursor:crosshair}
  .sanno-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0 2px}
  .sanno-tools .lab{font-size:.72rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--sa-navy)}
  .sanno-btn{font:inherit;font-size:.82rem;font-weight:600;color:var(--sa-navy);background:#fff;border:1.5px solid rgba(38,70,83,.22);border-radius:999px;padding:6px 12px;min-height:36px;cursor:pointer;transition:.15s;-webkit-tap-highlight-color:transparent}
  .sanno-btn:hover{border-color:var(--sa-teal);color:var(--sa-teal)}
  .sanno-btn:focus-visible{outline:3px solid var(--sa-teal);outline-offset:2px}
  .sanno-btn[aria-pressed="true"]{background:var(--sa-teal);border-color:var(--sa-teal);color:#fff}
  .sanno-swatch{width:30px;height:30px;min-height:30px;padding:0;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1.5px rgba(38,70,83,.28);cursor:pointer}
  .sanno-swatch[aria-pressed="true"]{box-shadow:0 0 0 3px var(--sa-navy)}
  .sanno-pin{position:absolute;width:30px;height:30px;transform:translate(-50%,-50%);border-radius:50%;border:2px solid #fff;background:var(--sa-navy);color:#fff;font:700 .9rem/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 1px 4px rgba(38,70,83,.4);z-index:4;-webkit-tap-highlight-color:transparent}
  .sanno-pin:hover{background:var(--sa-teal)}
  .sanno-pin:focus-visible{outline:3px solid var(--sa-teal);outline-offset:2px}
  .sanno-pin.done{background:var(--sa-teal)}
  .sanno-pin.done::after{content:"✓";position:absolute}
`;
  document.head.appendChild(s);
}

const COLORS = [
  { key: "teal", val: "var(--teal,#2a9d8f)", hex: "#2a9d8f", label: "Teal" },
  { key: "coral", val: "var(--coral,#d9795d)", hex: "#d9795d", label: "Coral" },
  { key: "navy", val: "var(--navy,#264653)", hex: "#264653", label: "Navy" },
];

// Ensure figureEl can host absolutely-positioned children without moving the
// figure itself. Only promote `static` positioning; leave author intent alone.
function ensureRelative(el) {
  const pos = getComputedStyle(el).position;
  if (pos === "static") el.style.position = "relative";
  el.classList.add("sanno");
}

// A figure has a "measurable box" once it has laid out a non-zero content box.
function hasBox(el) {
  const r = el.getBoundingClientRect();
  return r.width > 2 && r.height > 2;
}

export function attachAnnotator(figureEl, opts = {}) {
  try {
    if (!figureEl || !figureEl.nodeType) return null;
    injectStyles();
    const label = opts.label || "Annotate";
    const persistKey = opts.persistKey || null;

    ensureRelative(figureEl);

    // ── strokes: each is { color, hi(ghlighter), pts:[{x,y}…] } in CSS px ──
    let strokes = [];
    let current = null;
    let drawing = false;
    let colorKey = "coral";
    let highlighter = false;
    let drawOn = false;

    // ── overlay canvas, sized to the figure's content box (device-pixel aware) ──
    const canvas = document.createElement("canvas");
    canvas.className = "sanno-canvas";
    canvas.setAttribute("aria-hidden", "true");
    figureEl.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    function loadSaved() {
      if (!persistKey) return;
      try {
        const raw = localStorage.getItem(persistKey);
        if (!raw) return;
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) strokes = arr.filter((s) => s && Array.isArray(s.pts));
      } catch {
        /* corrupt/unavailable storage — start clean, never throw */
      }
    }
    function save() {
      if (!persistKey) return;
      try {
        localStorage.setItem(persistKey, JSON.stringify(strokes));
      } catch {
        /* quota / private mode — non-fatal */
      }
    }

    // Resize the backing store to the current box, then repaint. Points are in
    // CSS pixels relative to the figure's content box, so they survive resize.
    function resize() {
      // Measure the CANVAS. It is `inset:0` inside the figure, so once the
      // figure has a border or its own padding its border-box rect is a
      // different rectangle than the box the ink actually lands in — and the
      // strokes land offset from the pen by exactly that difference.
      const r = canvas.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(r.width * dpr);
      canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    }

    function drawStroke(s) {
      if (!s.pts.length) return;
      const color = COLORS.find((c) => c.key === s.color) || COLORS[1];
      ctx.strokeStyle = color.hex;
      ctx.globalAlpha = s.hi ? 0.32 : 1;
      ctx.lineWidth = s.hi ? 16 : 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(s.pts[0].x, s.pts[0].y);
      if (s.pts.length === 1) {
        // a single tap = a dot (mark a point)
        ctx.lineTo(s.pts[0].x + 0.01, s.pts[0].y);
      } else {
        // Smooth through the midpoints of consecutive samples: a straight
        // lineTo between raw pointer samples renders every sample as a visible
        // corner, which reads as ragged, shaky ink.
        for (let i = 1; i < s.pts.length - 1; i++) {
          const mx = (s.pts[i].x + s.pts[i + 1].x) / 2;
          const my = (s.pts[i].y + s.pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(s.pts[i].x, s.pts[i].y, mx, my);
        }
        const last = s.pts[s.pts.length - 1];
        ctx.lineTo(last.x, last.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    function redraw() {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      strokes.forEach(drawStroke);
      if (current) drawStroke(current);
    }

    function ptFrom(e) {
      const r = canvas.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(r.width, e.clientX - r.left)),
        y: Math.max(0, Math.min(r.height, e.clientY - r.top)),
      };
    }
    function onDown(e) {
      if (!drawOn) return;
      drawing = true;
      current = { color: colorKey, hi: highlighter, pts: [ptFrom(e)] };
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        /* no capture support — pointer events still fire */
      }
      e.preventDefault();
      redraw();
    }
    function onMove(e) {
      if (!drawing || !current) return;
      // Keep the positions the browser coalesced into this event; dropping them
      // is what turns a fast arc into a chain of straight chords.
      const evs = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      for (const ev of evs.length ? evs : [e]) current.pts.push(ptFrom(ev));
      e.preventDefault();
      redraw();
    }
    function onUp(e) {
      if (!drawing || !current) return;
      drawing = false;
      strokes.push(current);
      current = null;
      save();
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* nothing captured */
      }
      redraw();
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    // No pointerleave handler: the pointer is captured for the whole stroke, so
    // leaving the box is normal mid-mark. Ending the stroke there chopped a
    // circle into pieces whenever the student drew near the figure's edge.

    // ── toolbar ──
    const tools = document.createElement("div");
    tools.className = "sanno-tools";
    tools.setAttribute("role", "toolbar");
    tools.setAttribute("aria-label", label);
    const heading = document.createElement("span");
    heading.className = "lab";
    heading.textContent = label;
    tools.appendChild(heading);

    const drawBtn = document.createElement("button");
    drawBtn.type = "button";
    drawBtn.className = "sanno-btn";
    drawBtn.textContent = "✏️ Draw";
    drawBtn.setAttribute("aria-pressed", "false");
    drawBtn.addEventListener("click", () => {
      drawOn = !drawOn;
      drawBtn.setAttribute("aria-pressed", String(drawOn));
      canvas.classList.toggle("on", drawOn);
      canvas.setAttribute("aria-hidden", drawOn ? "false" : "true");
    });
    tools.appendChild(drawBtn);

    const swatchBtns = COLORS.map((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "sanno-btn sanno-swatch";
      b.style.background = c.hex;
      b.title = c.label;
      b.setAttribute("aria-label", `${c.label} pen`);
      b.setAttribute("aria-pressed", String(c.key === colorKey));
      b.addEventListener("click", () => {
        colorKey = c.key;
        swatchBtns.forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
      });
      tools.appendChild(b);
      return b;
    });

    const hiBtn = document.createElement("button");
    hiBtn.type = "button";
    hiBtn.className = "sanno-btn";
    hiBtn.textContent = "🖍 Highlight";
    hiBtn.setAttribute("aria-pressed", "false");
    hiBtn.addEventListener("click", () => {
      highlighter = !highlighter;
      hiBtn.setAttribute("aria-pressed", String(highlighter));
    });
    tools.appendChild(hiBtn);

    const undoBtn = document.createElement("button");
    undoBtn.type = "button";
    undoBtn.className = "sanno-btn";
    undoBtn.textContent = "↩︎ Undo";
    undoBtn.setAttribute("aria-label", "Undo last mark");
    undoBtn.addEventListener("click", () => {
      strokes.pop();
      save();
      redraw();
    });
    tools.appendChild(undoBtn);

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "sanno-btn";
    clearBtn.textContent = "🗑 Clear";
    clearBtn.setAttribute("aria-label", "Clear all marks");
    clearBtn.addEventListener("click", () => {
      strokes = [];
      current = null;
      save();
      redraw();
    });
    tools.appendChild(clearBtn);

    figureEl.insertAdjacentElement("afterend", tools);

    // ── keep the canvas exactly covering the figure's content box ──
    let ro = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => resize());
      ro.observe(figureEl);
    }
    const onWinResize = () => resize();
    window.addEventListener("resize", onWinResize);

    loadSaved();
    if (hasBox(figureEl)) {
      resize();
    } // else: the first ResizeObserver callback will size + paint once laid out.

    return {
      destroy() {
        try {
          ro?.disconnect();
        } catch {
          /* already gone */
        }
        window.removeEventListener("resize", onWinResize);
        canvas.remove();
        tools.remove();
      },
    };
  } catch (e) {
    console.warn("scene-annotate: attachAnnotator failed", e);
    return null;
  }
}

export function renderHotspots(figureEl, hotspots, onTag) {
  try {
    if (!figureEl || !figureEl.nodeType) return null;
    if (!Array.isArray(hotspots) || !hotspots.length) return null;
    injectStyles();
    ensureRelative(figureEl);

    const pins = [];
    hotspots.forEach((h, i) => {
      if (!h || h.x == null || h.y == null) return;
      const x = Math.max(0, Math.min(1, Number(h.x)));
      const y = Math.max(0, Math.min(1, Number(h.y)));
      if (isNaN(x) || isNaN(y)) return;
      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "sanno-pin";
      pin.textContent = String(i + 1);
      pin.style.left = `${(x * 100).toFixed(2)}%`;
      pin.style.top = `${(y * 100).toFixed(2)}%`;
      const name = h.label != null ? String(h.label) : `point ${i + 1}`;
      pin.setAttribute("aria-label", `Notice: ${name}`);
      pin.title = name;
      pin.addEventListener("click", () => {
        pin.classList.add("done");
        pin.setAttribute("aria-pressed", "true");
        pin.textContent = "";
        if (typeof onTag === "function") {
          try {
            onTag(name);
          } catch (err) {
            console.warn("scene-annotate: onTag threw", err);
          }
        }
      });
      figureEl.appendChild(pin);
      pins.push(pin);
    });

    if (!pins.length) return null;
    return {
      destroy() {
        pins.forEach((p) => p.remove());
      },
    };
  } catch (e) {
    console.warn("scene-annotate: renderHotspots failed", e);
    return null;
  }
}

export default attachAnnotator;

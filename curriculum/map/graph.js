/* =============================================================================
 * graph.js — the canvas field. Camera, hit-testing, and every pixel drawn.
 * -----------------------------------------------------------------------------
 * 42 nodes and 48 edges is small, so the whole scene is redrawn each animation
 * frame rather than diffed. That buys smooth pan/zoom and ambient motion for
 * almost nothing, and keeps the draw code a single readable pass.
 *
 * Coordinate spaces:
 *   world  — the precomputed layout in data.layout / node.x / node.y
 *   screen — CSS pixels inside the canvas element
 *   screen = world * cam.scale + (cam.x, cam.y)
 * ========================================================================== */

import { domainStyle, neighbourhood } from "./data.js";

const MIN_SCALE = 0.16;
const MAX_SCALE = 3.4;
const FIT_PADDING = 46;
const LEFT_BLEED = 96; // room for the vertical lane labels
const DRAG_SLOP = 5; // px of movement before a press stops counting as a click

const STRENGTH_STYLE = {
  core: { width: 3.2, alpha: 0.62, dash: null },
  supporting: { width: 2.1, alpha: 0.46, dash: null },
  fluency: { width: 1.5, alpha: 0.4, dash: [7, 8] },
};

const reduceMotion =
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function bezAt(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function roundRect(ctx, x, y, w, h, r) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function nodeRadius(node) {
  return 13 + Math.sqrt(Math.max(0, node.assetCount || 0)) * 6.2;
}

/**
 * 13 of the 42 standards have no shortLabel. Falling back to the id would print
 * it twice — once inside the node, once under it — so fall back to a
 * word-boundary trim of the full label instead.
 */
export function nodeLabel(node) {
  if (node.shortLabel) return node.shortLabel;
  const label = String(node.label || node.id);
  if (label.length <= 34) return label;
  const cut = label.slice(0, 33);
  const space = cut.lastIndexOf(" ");
  return `${(space > 18 ? cut.slice(0, space) : cut).replace(/[,;:]$/, "")}…`;
}

export class GraphView {
  constructor(canvas, model, hooks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.model = model;
    this.hooks = hooks;

    this.cam = { x: 0, y: 0, scale: 0.5 };
    this.w = 1;
    this.h = 1;
    this.dpr = 1;

    this.hoverId = "";
    this.selectedId = "";
    this.focusId = "";
    this.filter = null; // Set of node ids, or null for "everything"
    this.signal = new Map(); // node id -> 0..1 live-signal intensity

    this.pointers = new Map();
    this.drag = null;
    this.pinch = null;
    this.tween = null;

    this._loop = this._loop.bind(this);
    this._bindPointer();
    this.resize();
    this.fit(false);
    requestAnimationFrame(this._loop);
  }

  /* ---------------------------------------------------------------- camera */

  worldBounds() {
    const l = this.model.layout;
    return { x: -LEFT_BLEED, y: -24, w: l.width + LEFT_BLEED + 90, h: l.height + 48 };
  }

  toScreen(wx, wy) {
    return { x: wx * this.cam.scale + this.cam.x, y: wy * this.cam.scale + this.cam.y };
  }

  toWorld(sx, sy) {
    return { x: (sx - this.cam.x) / this.cam.scale, y: (sy - this.cam.y) / this.cam.scale };
  }

  resize() {
    // Hold the world point under the viewport centre so a rotate / sidebar
    // toggle / mobile keyboard does not throw away where the teacher was.
    const anchor = this.w > 1 ? this.toWorld(this.w / 2, this.h / 2) : null;
    const rect = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, Math.round(rect.width));
    this.h = Math.max(1, Math.round(rect.height));
    this.dpr = Math.min(2.5, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    if (anchor) {
      this.cam.x = this.w / 2 - anchor.x * this.cam.scale;
      this.cam.y = this.h / 2 - anchor.y * this.cam.scale;
    }
  }

  fit(animate = true) {
    const b = this.worldBounds();
    const scale = clamp(
      Math.min((this.w - FIT_PADDING * 2) / b.w, (this.h - FIT_PADDING * 2) / b.h),
      MIN_SCALE,
      MAX_SCALE,
    );
    const target = {
      scale,
      x: this.w / 2 - (b.x + b.w / 2) * scale,
      y: this.h / 2 - (b.y + b.h / 2) * scale,
    };
    if (animate) this._tweenTo(target);
    else Object.assign(this.cam, target);
  }

  zoomAt(factor, sx, sy) {
    const next = clamp(this.cam.scale * factor, MIN_SCALE, MAX_SCALE);
    const k = next / this.cam.scale;
    this.cam.x = sx - (sx - this.cam.x) * k;
    this.cam.y = sy - (sy - this.cam.y) * k;
    this.cam.scale = next;
  }

  zoomBy(factor) {
    this.tween = null;
    this.zoomAt(factor, this.w / 2, this.h / 2);
  }

  panBy(dx, dy) {
    this.tween = null;
    this.cam.x += dx;
    this.cam.y += dy;
  }

  flyTo(id, zoom) {
    const node = this.model.byId.get(id);
    if (!node) return;
    const scale = clamp(zoom || Math.max(this.cam.scale, 0.92), MIN_SCALE, MAX_SCALE);
    this._tweenTo({
      scale,
      x: this.w / 2 - node.x * scale,
      y: this.h / 2 - node.y * scale,
    });
  }

  _tweenTo(target) {
    if (reduceMotion) {
      Object.assign(this.cam, target);
      this.tween = null;
      return;
    }
    this.tween = { from: { ...this.cam }, to: target, start: performance.now(), ms: 520 };
  }

  _stepTween(now) {
    if (!this.tween) return;
    const t = clamp((now - this.tween.start) / this.tween.ms, 0, 1);
    const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    const { from, to } = this.tween;
    this.cam.scale = from.scale + (to.scale - from.scale) * e;
    this.cam.x = from.x + (to.x - from.x) * e;
    this.cam.y = from.y + (to.y - from.y) * e;
    if (t >= 1) this.tween = null;
  }

  /* ------------------------------------------------------------------ state */

  setSelected(id) {
    this.selectedId = id || "";
  }

  setFocus(id) {
    this.focusId = id || "";
  }

  setFilter(ids) {
    this.filter = ids && ids.size ? ids : null;
  }

  setSignal(map) {
    this.signal = map instanceof Map ? map : new Map();
  }

  hitTest(sx, sy) {
    const p = this.toWorld(sx, sy);
    let best = null;
    let bestD = Infinity;
    for (const node of this.model.nodes) {
      const r = nodeRadius(node) + 6;
      const d = Math.hypot(node.x - p.x, node.y - p.y);
      if (d <= r && d < bestD) {
        best = node;
        bestD = d;
      }
    }
    return best;
  }

  /* --------------------------------------------------------------- pointers */

  _bindPointer() {
    const c = this.canvas;

    c.addEventListener("pointerdown", (e) => {
      c.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      this.tween = null;
      if (this.pointers.size === 1) {
        this.drag = { x: e.offsetX, y: e.offsetY, moved: 0 };
      } else if (this.pointers.size === 2) {
        this.drag = null;
        this.pinch = this._pinchState();
      }
    });

    c.addEventListener("pointermove", (e) => {
      if (this.pointers.has(e.pointerId)) {
        this.pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY });
      }
      if (this.pointers.size >= 2) {
        const now = this._pinchState();
        if (this.pinch && now && this.pinch.dist > 0) {
          this.zoomAt(now.dist / this.pinch.dist, now.mx, now.my);
          this.cam.x += now.mx - this.pinch.mx;
          this.cam.y += now.my - this.pinch.my;
        }
        this.pinch = now;
        return;
      }
      if (this.drag) {
        const dx = e.offsetX - this.drag.x;
        const dy = e.offsetY - this.drag.y;
        this.drag.moved += Math.abs(dx) + Math.abs(dy);
        this.cam.x += dx;
        this.cam.y += dy;
        this.drag.x = e.offsetX;
        this.drag.y = e.offsetY;
        return;
      }
      const hit = this.hitTest(e.offsetX, e.offsetY);
      const id = hit ? hit.id : "";
      if (id !== this.hoverId) {
        this.hoverId = id;
        c.style.cursor = id ? "pointer" : "grab";
        if (this.hooks.onHover) this.hooks.onHover(hit);
      }
    });

    const release = (e) => {
      const wasDrag = this.drag;
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      if (this.pointers.size === 0) this.drag = null;
      if (wasDrag && wasDrag.moved <= DRAG_SLOP && this.pointers.size === 0) {
        const hit = this.hitTest(e.offsetX, e.offsetY);
        if (hit && this.hooks.onSelect) this.hooks.onSelect(hit);
      }
    };
    c.addEventListener("pointerup", release);
    c.addEventListener("pointercancel", (e) => {
      this.pointers.delete(e.pointerId);
      this.drag = null;
      this.pinch = null;
    });
    c.addEventListener("pointerleave", () => {
      if (this.hoverId) {
        this.hoverId = "";
        if (this.hooks.onHover) this.hooks.onHover(null);
      }
    });

    c.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.tween = null;
        const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.h : 1;
        this.zoomAt(Math.exp(-e.deltaY * unit * 0.0016), e.offsetX, e.offsetY);
      },
      { passive: false },
    );
  }

  _pinchState() {
    const pts = [...this.pointers.values()];
    if (pts.length < 2) return null;
    return {
      dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
      mx: (pts[0].x + pts[1].x) / 2,
      my: (pts[0].y + pts[1].y) / 2,
    };
  }

  /* --------------------------------------------------------------- painting */

  _loop(now) {
    this._stepTween(now);
    this.draw(now);
    requestAnimationFrame(this._loop);
  }

  _alphaFor(id, activeId, connected) {
    let a = 1;
    if (this.filter) a *= this.filter.has(id) ? 1 : 0.11;
    if (activeId) a *= connected.has(id) ? 1 : 0.14;
    return a;
  }

  draw(now) {
    const ctx = this.ctx;
    const t = reduceMotion ? 0 : now / 1000;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);

    this._backdrop(ctx, t);

    const activeId = this.hoverId || this.selectedId || this.focusId || "";
    const connected = activeId ? neighbourhood(this.model, activeId) : new Set();

    ctx.save();
    ctx.translate(this.cam.x, this.cam.y);
    ctx.scale(this.cam.scale, this.cam.scale);
    this._lanes(ctx);
    this._edges(ctx, t, activeId, connected);
    this._nodes(ctx, t, activeId, connected);
    ctx.restore();

    this._laneLabels(ctx);
  }

  _backdrop(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, this.w * 0.4, this.h);
    g.addColorStop(0, "#0a1c35");
    g.addColorStop(0.55, "#0b2140");
    g.addColorStop(1, "#081428");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);

    const blobs = [
      { c: "rgba(88,182,255,0.16)", ox: 0.18, oy: 0.16, r: 0.62, sx: 0.05, sy: 0.07 },
      { c: "rgba(111,224,176,0.11)", ox: 0.84, oy: 0.78, r: 0.55, sx: -0.06, sy: 0.04 },
      { c: "rgba(183,155,255,0.1)", ox: 0.62, oy: 0.12, r: 0.48, sx: 0.04, sy: -0.05 },
    ];
    for (const b of blobs) {
      const cx = (b.ox + Math.sin(t * 0.06 + b.ox * 9) * b.sx) * this.w;
      const cy = (b.oy + Math.cos(t * 0.05 + b.oy * 7) * b.sy) * this.h;
      const rad = b.r * Math.max(this.w, this.h);
      const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      rg.addColorStop(0, b.c);
      rg.addColorStop(1, "rgba(8,20,40,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, this.w, this.h);
    }
  }

  _lanes(ctx) {
    const l = this.model.layout;
    const x = -LEFT_BLEED + 34;
    const w = l.width + LEFT_BLEED + 34;
    for (const lane of this.model.lanes) {
      const s = domainStyle(lane.domain);
      ctx.save();
      roundRect(ctx, x, lane.top + 6, w, Math.max(10, lane.height - 12), 26);
      ctx.fillStyle = s.glow;
      ctx.globalAlpha = 0.055;
      ctx.fill();
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = s.glow;
      ctx.stroke();
      ctx.restore();
    }
  }

  /** Lane names are drawn in SCREEN space so they stay legible at any zoom. */
  _laneLabels(ctx) {
    const l = this.model.layout;
    const rightEdge = this.toScreen(l.width, 0).x;
    for (const lane of this.model.lanes) {
      const top = this.toScreen(0, lane.top).y;
      const bottom = this.toScreen(0, lane.top + lane.height).y;
      if (bottom < 8 || top > this.h - 8) continue;
      const mid = clamp((top + bottom) / 2, 78, this.h - 78);
      const left = clamp(this.toScreen(-LEFT_BLEED + 46, 0).x, 22, rightEdge - 30);
      const s = domainStyle(lane.domain);
      ctx.save();
      ctx.translate(left, mid);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = s.glow;
      ctx.globalAlpha = 0.82;
      ctx.font = '700 13px "Outfit", system-ui, sans-serif';
      const name = lane.name.toUpperCase();
      ctx.fillText(name, 0, -8);
      ctx.globalAlpha = 0.5;
      ctx.font = '600 11px "Hanken Grotesk", system-ui, sans-serif';
      ctx.fillText(`${lane.count} standards`, 0, 8);
      ctx.restore();
    }
  }

  _edges(ctx, t, activeId, connected) {
    for (const edge of this.model.edges) {
      const a = this.model.byId.get(edge.from);
      const b = this.model.byId.get(edge.to);
      if (!a || !b) continue;

      let mul;
      if (activeId) {
        mul = edge.from === activeId || edge.to === activeId ? 1.35 : 0.09;
      } else {
        mul = Math.min(
          this._alphaFor(edge.from, "", connected),
          this._alphaFor(edge.to, "", connected),
        );
      }
      if (this.filter) mul *= this.filter.has(edge.from) || this.filter.has(edge.to) ? 1 : 0.25;
      if (mul < 0.03) continue;

      const style = STRENGTH_STYLE[edge.strength] || STRENGTH_STYLE.supporting;
      const ar = nodeRadius(a);
      const br = nodeRadius(b);
      const forward = b.x > a.x;
      const dx = forward ? Math.max(70, (b.x - a.x) * 0.52) : 120;
      const p0x = a.x + (forward ? ar * 0.86 : 0);
      const p0y = a.y;
      const p3x = b.x;
      const p3y = b.y;
      const p1x = p0x + dx;
      const p1y = p0y + (forward ? 0 : -70);
      const p2x = p3x - dx;
      const p2y = p3y + (forward ? 0 : 70);

      // Stop the stroke at the target's rim so the arrowhead is the only thing
      // that touches the node.
      let tEnd = 1;
      for (let i = 100; i >= 40; i -= 1) {
        const tt = i / 100;
        const px = bezAt(p0x, p1x, p2x, p3x, tt);
        const py = bezAt(p0y, p1y, p2y, p3y, tt);
        if (Math.hypot(px - p3x, py - p3y) > br + 7) {
          tEnd = tt;
          break;
        }
      }
      const ex = bezAt(p0x, p1x, p2x, p3x, tEnd);
      const ey = bezAt(p0y, p1y, p2y, p3y, tEnd);
      const bx = bezAt(p0x, p1x, p2x, p3x, Math.max(0, tEnd - 0.04));
      const by = bezAt(p0y, p1y, p2y, p3y, Math.max(0, tEnd - 0.04));

      const grad = ctx.createLinearGradient(p0x, p0y, p3x, p3y);
      grad.addColorStop(0, domainStyle(a.domain).glow);
      grad.addColorStop(1, domainStyle(b.domain).glow);

      ctx.save();
      ctx.globalAlpha = clamp(style.alpha * mul, 0, 1);
      ctx.strokeStyle = grad;
      ctx.lineWidth = style.width;
      ctx.lineCap = "round";
      if (style.dash) {
        ctx.setLineDash(style.dash);
        ctx.lineDashOffset = -t * 22;
      }
      ctx.beginPath();
      ctx.moveTo(p0x, p0y);
      ctx.bezierCurveTo(p1x, p1y, p2x, p2y, ex, ey);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowhead points AT the dependent standard.
      const ang = Math.atan2(ey - by, ex - bx);
      const head = 9 + style.width;
      ctx.globalAlpha = clamp(Math.min(1, style.alpha + 0.3) * mul, 0, 1);
      ctx.fillStyle = domainStyle(b.domain).glow;
      ctx.beginPath();
      ctx.moveTo(ex, ey);
      ctx.lineTo(ex - head * Math.cos(ang - 0.42), ey - head * Math.sin(ang - 0.42));
      ctx.lineTo(ex - head * Math.cos(ang + 0.42), ey - head * Math.sin(ang + 0.42));
      ctx.closePath();
      ctx.fill();

      // A slow impulse travelling the pathway — the "nervous system" tell.
      if (!reduceMotion && mul > 0.5) {
        const phase = ((t * 0.16 + (a.x + a.y) * 0.0013) % 1) * tEnd;
        const px = bezAt(p0x, p1x, p2x, p3x, phase);
        const py = bezAt(p0y, p1y, p2y, p3y, phase);
        ctx.globalAlpha = clamp(0.5 * mul, 0, 1);
        ctx.fillStyle = "#dbe9ff";
        ctx.beginPath();
        ctx.arc(px, py, style.width * 0.72, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  _nodes(ctx, t, activeId, connected) {
    const scale = this.cam.scale;
    const showLabels = scale >= 0.52;
    const showIds = scale >= 0.3;

    for (const node of this.model.nodes) {
      const alpha = this._alphaFor(node.id, activeId, connected);
      if (alpha < 0.02) continue;
      const s = domainStyle(node.domain);
      const r = nodeRadius(node);
      const isActive = node.id === activeId;
      const isSelected = node.id === this.selectedId;
      const isFocused = node.id === this.focusId;
      const heat = this.signal.get(node.id) || 0;

      ctx.save();
      ctx.globalAlpha = alpha;

      if (heat > 0) {
        const pulse = reduceMotion ? 0.72 : 0.62 + Math.sin(t * 2.1 + node.x * 0.01) * 0.24;
        const rad = r + 12 + heat * 26;
        const rg = ctx.createRadialGradient(node.x, node.y, r * 0.6, node.x, node.y, rad);
        rg.addColorStop(0, `rgba(255,138,110,${0.5 * pulse * (0.45 + heat)})`);
        rg.addColorStop(1, "rgba(255,138,110,0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(node.x, node.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isActive || isSelected) {
        const rg = ctx.createRadialGradient(node.x, node.y, r * 0.4, node.x, node.y, r + 26);
        rg.addColorStop(0, `${s.glow}66`);
        rg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 26, 0, Math.PI * 2);
        ctx.fill();
      }

      const body = ctx.createRadialGradient(
        node.x - r * 0.35,
        node.y - r * 0.4,
        r * 0.15,
        node.x,
        node.y,
        r,
      );
      body.addColorStop(0, s.glow);
      body.addColorStop(1, s.deep);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = isSelected ? 3.4 : 1.8;
      ctx.strokeStyle = isSelected ? "#ffffff" : s.glow;
      ctx.globalAlpha = alpha * (isSelected ? 0.95 : 0.65);
      ctx.stroke();

      if (isFocused) {
        ctx.globalAlpha = alpha;
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = "#ffe9a8";
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (showIds || isActive || isSelected || isFocused) {
        ctx.font = `700 ${(11.5 / scale).toFixed(2)}px "Outfit", system-ui, sans-serif`;
        ctx.fillStyle = "#08182e";
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillText(node.id, node.x, node.y + 0.4 / scale);
      }
      if (showLabels || isActive || isSelected || isFocused) {
        ctx.globalAlpha = alpha;
        ctx.font = `600 ${(12.5 / scale).toFixed(2)}px "Hanken Grotesk", system-ui, sans-serif`;
        ctx.textBaseline = "top";
        ctx.lineWidth = 3.4 / scale;
        ctx.strokeStyle = "rgba(6,17,33,0.85)";
        ctx.lineJoin = "round";
        const label = nodeLabel(node);
        ctx.strokeText(label, node.x, node.y + r + 6 / scale);
        ctx.fillStyle = "#e9f1fd";
        ctx.fillText(label, node.x, node.y + r + 6 / scale);
      }
      ctx.restore();
    }
  }
}

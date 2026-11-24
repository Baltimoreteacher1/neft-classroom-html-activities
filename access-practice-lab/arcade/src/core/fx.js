// Canvas particle layer: confetti, sparks and floating score text. One shared
// rAF loop that stops itself the moment the screen is empty.
import { reducedMotion } from "./dom.js";

const PALETTE = ["#0f766e", "#c2562f", "#e2b14a", "#1e3a5f", "#a24f72", "#5a9481"];

class FX {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.parts = [];
    this.raf = 0;
    this.last = 0;
    this.enabled = true;
    this.dpr = 1;
  }

  init(canvas) {
    if (!canvas) return;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  setEnabled(value) {
    this.enabled = value !== false && !reducedMotion();
    if (!this.enabled) {
      this.parts = [];
      this.clear();
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
  }

  resize() {
    if (!this.canvas) return;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(window.innerWidth * this.dpr);
    this.canvas.height = Math.floor(window.innerHeight * this.dpr);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx?.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  clear() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }

  spawn(part) {
    this.parts.push({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      g: 0.16,
      size: 5,
      life: 0,
      ttl: 900,
      rot: 0,
      vr: 0,
      color: PALETTE[0],
      kind: "dot",
      text: "",
      ...part,
    });
  }

  burst(x, y, { colors = PALETTE, count = 16, power = 5.6, kind = "dot" } = {}) {
    if (!this.enabled) return;
    const n = reducedMotion() ? Math.min(8, count) : count;
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = power * (0.5 + Math.random());
      this.spawn({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.4,
        size: 3 + Math.random() * 4,
        ttl: 620 + Math.random() * 520,
        color: colors[i % colors.length],
        kind: Math.random() > 0.55 ? "rect" : kind,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
      });
    }
    this.run();
  }

  confetti({ count = 80 } = {}) {
    if (!this.enabled) return;
    const n = reducedMotion() ? 24 : count;
    for (let i = 0; i < n; i++) {
      this.spawn({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * 140,
        vx: (Math.random() - 0.5) * 2.4,
        vy: 2 + Math.random() * 3,
        g: 0.05,
        size: 5 + Math.random() * 6,
        ttl: 2400 + Math.random() * 1600,
        color: PALETTE[i % PALETTE.length],
        kind: "rect",
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.22,
      });
    }
    this.run();
  }

  ring(x, y, color = "#0f766e") {
    if (!this.enabled) return;
    this.spawn({ x, y, kind: "ring", color, size: 8, ttl: 620, g: 0 });
    this.run();
  }

  float(x, y, text, color = "#0f766e") {
    if (!this.enabled) return;
    this.spawn({ x, y, kind: "text", text, color, ttl: 1150, g: -0.02, vy: -1.5, size: 22 });
    this.run();
  }

  shake(el) {
    if (!el || !this.enabled) return;
    el.classList.remove("is-shaking");
    void el.offsetWidth;
    el.classList.add("is-shaking");
    window.setTimeout(() => el.classList.remove("is-shaking"), 460);
  }

  run() {
    if (this.raf || !this.ctx) return;
    this.last = performance.now();
    const frame = (now) => {
      const dt = Math.min(48, now - this.last);
      this.last = now;
      this.step(dt);
      if (this.parts.length) {
        this.raf = requestAnimationFrame(frame);
      } else {
        this.raf = 0;
        this.clear();
      }
    };
    this.raf = requestAnimationFrame(frame);
  }

  step(dt) {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const k = dt / 16.67;
    this.parts = this.parts.filter((p) => {
      p.life += dt;
      if (p.life >= p.ttl) return false;
      const progress = p.life / p.ttl;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.vy += p.g * k;
      p.vx *= 0.995;
      p.rot += p.vr * k;
      const alpha = p.kind === "text" ? Math.min(1, 2.2 - progress * 2.2) : 1 - progress ** 3;

      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.translate(p.x, p.y);
      if (p.kind === "rect") {
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.62);
      } else if (p.kind === "ring") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3 * (1 - progress) + 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, p.size + progress * 54, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === "text") {
        ctx.fillStyle = p.color;
        ctx.font = `700 ${p.size}px "Atkinson Hyperlegible", system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(p.text, 0, 0);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * (1 - progress * 0.5), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      return true;
    });
  }
}

export const fx = new FX();

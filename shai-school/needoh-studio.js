/* NeeDoh Studio — a real soft-body fidget toy.
 *
 * WHY THIS FILE EXISTS
 *   The original NeeDoh was a <div> with a CSS `transform: scale()` on tap.
 *   It looked like a button, not a squishy toy. This replaces it with an
 *   actual pressure-model soft body simulated on canvas: you grab it, it
 *   stretches; you squeeze it, it bulges out the sides and jiggles back.
 *   Everything a commercial fidget game ships with is here — material-driven
 *   physics, synthesized audio, particle FX, XP/ranks/unlocks, and a calm
 *   breathing pacer — with no external dependencies and no network calls.
 *
 * INTEGRATION
 *   Self-mounting. `NeeDohStudio.html()` returns markup containing a
 *   `[data-needoh-root]` element; a MutationObserver hydrates any such root
 *   that appears in the DOM, so it works identically inside a re-rendered
 *   card (focus-school) or a modal body (shai-school) with no render hooks.
 *   Roots removed from the DOM stop their own RAF loop.
 */
(function (global) {
  "use strict";

  const STORE_KEY = "needoh.studio.v2";
  const TAU = Math.PI * 2;
  const N = 56; // outline particles — enough for smooth silhouette, cheap on phones
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const reducedMotion = () => {
    try {
      return matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  };

  // ---------------------------------------------------------------- shapes
  // Each shape is a polar radius function r(theta), normalised so the mean
  // radius is roughly 1. The soft body remembers this outline and springs
  // back to it, which is what makes a star read as a star even mid-squish.
  const gauss = (t, c, w) => {
    let d = t - c;
    while (d > Math.PI) d -= TAU;
    while (d < -Math.PI) d += TAU;
    return Math.exp(-(d * d) / w);
  };
  const polygonR = (t, n) =>
    Math.cos(Math.PI / n) / Math.cos((((t % (TAU / n)) + TAU) % (TAU / n)) - Math.PI / n);

  const SHAPES = [
    { id: "ball", name: "Groovy Ball", icon: "●", r: () => 1 },
    {
      id: "cube",
      name: "Nice Cube",
      icon: "▢",
      r: (t) =>
        Math.pow(Math.pow(Math.abs(Math.cos(t)), 6) + Math.pow(Math.abs(Math.sin(t)), 6), -1 / 6),
    },
    {
      id: "star",
      name: "Super Star",
      icon: "★",
      r: (t) => 0.58 + 0.46 * Math.pow(0.5 + 0.5 * Math.cos(5 * t - Math.PI / 2), 0.75),
    },
    {
      id: "cat",
      name: "Squish Cat",
      icon: "▲▲",
      r: (t) => 1 + 0.34 * gauss(t, -2.25, 0.035) + 0.34 * gauss(t, -0.89, 0.035),
    },
    { id: "donut", name: "Gummy Donut", icon: "◎", r: () => 1, hole: 0.36 },
    { id: "gem", name: "Crystal Gem", icon: "◆", r: (t) => polygonR(t + Math.PI / 6, 6) },
  ];

  // ------------------------------------------------------------- materials
  // Material is not skin-deep: each one retunes the solver (how stiff the
  // shell is, how much the gas inside pushes back, how fast wobble dies) so
  // ice feels brittle and quick while slime oozes.
  const MATERIALS = [
    {
      id: "jelly",
      name: "Gummy Jelly",
      unlock: 0,
      hue: [332, 96, 63],
      deep: "#9d174d",
      shell: 0.46,
      memory: 0.055,
      pressure: 1.0,
      damp: 0.93,
      gloss: 0.85,
      fill: "none",
      sound: "jelly",
    },
    {
      id: "ice",
      name: "Nice Cube Ice",
      unlock: 0,
      hue: [199, 92, 60],
      deep: "#075985",
      shell: 0.72,
      memory: 0.11,
      pressure: 1.15,
      damp: 0.9,
      gloss: 1.0,
      fill: "shard",
      sound: "ice",
    },
    {
      id: "bead",
      name: "Micro-Bead Crunch",
      unlock: 15,
      hue: [45, 93, 55],
      deep: "#a16207",
      shell: 0.3,
      memory: 0.028,
      pressure: 0.82,
      damp: 0.88,
      gloss: 0.45,
      fill: "bead",
      sound: "bead",
    },
    {
      id: "glitter",
      name: "Glitter Magic",
      unlock: 40,
      hue: [280, 85, 68],
      deep: "#6b21a8",
      shell: 0.4,
      memory: 0.05,
      pressure: 1.05,
      damp: 0.93,
      gloss: 0.95,
      fill: "glitter",
      sound: "glitter",
    },
    {
      id: "slime",
      name: "Ooze Slime",
      unlock: 80,
      hue: [140, 72, 48],
      deep: "#14532d",
      shell: 0.2,
      memory: 0.014,
      pressure: 0.7,
      damp: 0.965,
      gloss: 0.7,
      fill: "bubble",
      sound: "slime",
    },
    {
      id: "nebula",
      name: "Nebula Core",
      unlock: 140,
      hue: [255, 88, 62],
      deep: "#1e1b4b",
      shell: 0.5,
      memory: 0.06,
      pressure: 1.25,
      damp: 0.94,
      gloss: 1.0,
      fill: "star",
      sound: "nebula",
    },
  ];

  const RANKS = [
    { at: 0, name: "Beginner Squisher", icon: "🐣" },
    { at: 10, name: "Groovy Squisher", icon: "🌟" },
    { at: 30, name: "Pro Squisher", icon: "🔥" },
    { at: 70, name: "Master Squisher", icon: "⚡" },
    { at: 140, name: "Grand Master", icon: "👑" },
    { at: 260, name: "Legend of the Squish", icon: "🏆" },
  ];
  const rankFor = (n) => RANKS.reduce((acc, r) => (n >= r.at ? r : acc), RANKS[0]);
  const nextRank = (n) => RANKS.find((r) => r.at > n) || null;

  const ACHIEVEMENTS = [
    { id: "first", label: "First Squish!", test: (s) => s.squeezes >= 1 },
    { id: "combo5", label: "5x Combo Chain", test: (s) => s.bestCombo >= 5 },
    { id: "combo12", label: "12x Combo Chain", test: (s) => s.bestCombo >= 12 },
    { id: "stretch", label: "Big Stretcher", test: (s) => s.maxStretch >= 1.9 },
    { id: "shapes", label: "Tried Every Shape", test: (s) => s.shapesUsed.length >= SHAPES.length },
    { id: "hundred", label: "100 Squishes", test: (s) => s.squeezes >= 100 },
  ];

  // ------------------------------------------------------------- persistence
  function loadSave() {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    } catch {}
    const s = raw && typeof raw === "object" ? raw : {};
    return {
      squeezes: Number(s.squeezes) || 0,
      bestCombo: Number(s.bestCombo) || 0,
      maxStretch: Number(s.maxStretch) || 1,
      shape: Number(s.shape) || 0,
      material: Number(s.material) || 0,
      shapesUsed: Array.isArray(s.shapesUsed) ? s.shapesUsed : [],
      earned: Array.isArray(s.earned) ? s.earned : [],
    };
  }
  function persist(s) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    } catch {}
  }

  // ------------------------------------------------------------------ audio
  // One shared context; each material gets a hand-built voice rather than a
  // sample, so squeeze velocity can drive pitch/brightness continuously.
  let ac = null;
  function audio() {
    if (ac) return ac;
    try {
      ac = new (global.AudioContext || global.webkitAudioContext)();
    } catch {
      ac = null;
    }
    return ac;
  }
  function noiseBuffer(ctx) {
    const b = ctx.createBuffer(1, ctx.sampleRate * 0.35, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    return b;
  }
  let noiseBuf = null;
  function voice(matId, power) {
    const ctx = audio();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const t = ctx.currentTime;
    const amp = clamp(0.06 + power * 0.3, 0.05, 0.4);
    const out = ctx.createGain();
    out.gain.value = amp;
    out.connect(ctx.destination);

    if (matId === "bead" || matId === "ice") {
      if (!noiseBuf) noiseBuf = noiseBuffer(ctx);
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = matId === "ice" ? 9 : 3.2;
      bp.frequency.setValueAtTime(matId === "ice" ? 2600 : 1300 + power * 900, t);
      bp.frequency.exponentialRampToValueAtTime(matId === "ice" ? 900 : 420, t + 0.16);
      const g = ctx.createGain();
      g.gain.setValueAtTime(1, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + (matId === "ice" ? 0.22 : 0.16));
      src.connect(bp).connect(g).connect(out);
      src.start(t);
      src.stop(t + 0.35);
      return;
    }

    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900 + power * 2600;
    const base = 150 + power * 130;
    if (matId === "glitter") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(base * 4, t);
      osc.frequency.exponentialRampToValueAtTime(base * 8.5, t + 0.18);
    } else if (matId === "slime") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(base * 0.8, t);
      osc.frequency.exponentialRampToValueAtTime(base * 0.35, t + 0.3);
      lp.frequency.value = 420;
    } else if (matId === "nebula") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(base * 0.6, t);
      osc.frequency.exponentialRampToValueAtTime(base * 3.2, t + 0.26);
    } else {
      osc.type = "sine";
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 2.6, t + 0.12);
    }
    g.gain.setValueAtTime(1, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    osc.connect(lp).connect(g).connect(out);
    osc.start(t);
    osc.stop(t + 0.34);
  }

  // ------------------------------------------------------------------ styles
  const CSS = `
.nd-root{--nd-a:var(--accent,#38bdf8);display:flex;flex-direction:column;gap:10px;font-size:0.9rem}
.nd-hud{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:space-between}
.nd-rank{font-weight:900;display:flex;align-items:center;gap:6px}
.nd-rank em{font-style:normal;color:var(--nd-a)}
.nd-stat{font-weight:800;font-variant-numeric:tabular-nums}
.nd-stat b{color:var(--nd-a);font-size:1.15rem}
.nd-xp{position:relative;height:9px;border-radius:99px;background:rgba(128,128,128,0.22);overflow:hidden}
.nd-xp i{position:absolute;inset:0 auto 0 0;border-radius:99px;background:linear-gradient(90deg,var(--nd-a),#a78bfa);transition:width .35s cubic-bezier(.22,1,.36,1)}
.nd-stage{position:relative;border-radius:18px;overflow:hidden;background:
  radial-gradient(120% 90% at 50% 8%,rgba(255,255,255,0.10),transparent 60%),
  linear-gradient(180deg,rgba(15,23,42,0.06),rgba(15,23,42,0.14));
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.25),inset 0 -18px 30px rgba(0,0,0,0.07);touch-action:none}
.nd-stage canvas{display:block;width:100%;height:100%;cursor:grab}
.nd-stage.grabbing canvas{cursor:grabbing}
.nd-combo{position:absolute;top:8px;left:50%;transform:translateX(-50%);font-weight:900;letter-spacing:.04em;
  color:#fff;text-shadow:0 2px 10px rgba(0,0,0,.45);opacity:0;transition:opacity .18s;pointer-events:none;font-size:1.05rem}
.nd-combo.on{opacity:1}
.nd-hint{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);font-size:.72rem;font-weight:700;
  color:rgba(255,255,255,.92);background:rgba(15,23,42,.55);padding:4px 10px;border-radius:99px;pointer-events:none;
  opacity:1;transition:opacity .5s}
.nd-rail{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.nd-chip{border:1px solid rgba(128,128,128,.35);background:transparent;color:inherit;border-radius:99px;
  padding:5px 11px;font-weight:800;font-size:.78rem;cursor:pointer;display:inline-flex;align-items:center;gap:5px;
  transition:transform .12s,background .18s,border-color .18s}
.nd-chip:hover{transform:translateY(-1px)}
.nd-chip[aria-pressed="true"]{background:var(--nd-a);border-color:var(--nd-a);color:#07223a}
.nd-chip[disabled]{opacity:.45;cursor:not-allowed;transform:none}
.nd-swatch{width:12px;height:12px;border-radius:50%;box-shadow:inset 0 -2px 3px rgba(0,0,0,.35)}
.nd-label{font-size:.7rem;font-weight:900;text-transform:uppercase;letter-spacing:.06em;opacity:.65;text-align:center}
.nd-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.nd-toast{position:absolute;left:50%;bottom:14px;transform:translate(-50%,14px);background:rgba(15,23,42,.9);color:#fff;
  font-weight:900;font-size:.8rem;padding:7px 14px;border-radius:99px;opacity:0;transition:all .35s cubic-bezier(.22,1,.36,1);pointer-events:none}
.nd-toast.on{opacity:1;transform:translate(-50%,0)}
@media (prefers-reduced-motion:reduce){.nd-chip,.nd-xp i,.nd-toast{transition:none}}
`;
  function injectCSS() {
    if (document.getElementById("nd-style")) return;
    const el = document.createElement("style");
    el.id = "nd-style";
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  // -------------------------------------------------------------- soft body
  // Pressure soft body: a ring of verlet particles held together by neighbour
  // springs, pushed outward by a gas term (P ~ restArea/area), and pulled back
  // toward the remembered rest outline (rigidly matched to the body's current
  // position + rotation, so it can spin freely but still recover its shape).
  function makeBody(shape, mat) {
    const p = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * TAU;
      const r = shape.r(t);
      const x = Math.cos(t) * r,
        y = Math.sin(t) * r;
      p.push({ x, y, px: x, py: y, rx: x, ry: y, grab: 0, gx: 0, gy: 0 });
    }
    // Rest edge lengths are the shell's "circumference memory": distance
    // constraints preserve them, which is what stops the ring from collapsing
    // (averaging neighbours instead would be curve-shortening flow — the ring
    // shrinks to a point regardless of pressure).
    const L = [];
    for (let i = 0; i < N; i++) {
      const a = p[i],
        b = p[(i + 1) % N];
      L.push(Math.hypot(b.x - a.x, b.y - a.y));
    }
    return { p, L, restArea: polyArea(p), shape, mat };
  }
  function polyArea(p) {
    let a = 0;
    for (let i = 0; i < p.length; i++) {
      const q = p[(i + 1) % p.length];
      a += p[i].x * q.y - q.x * p[i].y;
    }
    return Math.abs(a) / 2;
  }

  // One tick: forces (shape memory, gas pressure, gravity, finger) → verlet
  // integration → positional passes that restore edge lengths and keep the toy
  // inside the stage. Position-based constraints are what make it stable at
  // any frame rate a phone throws at it.
  function step(body, dt, opts) {
    const p = body.p;
    const m = body.mat;
    const n = p.length;

    let cx = 0,
      cy = 0;
    for (const q of p) {
      cx += q.x;
      cy += q.y;
    }
    cx /= n;
    cy /= n;

    // best-fit rotation of the current outline against the remembered one
    // (Kabsch in 2D) — lets the toy spin freely and still know its own shape
    let sc = 0,
      ss = 0;
    for (const q of p) {
      const ox = q.x - cx,
        oy = q.y - cy;
      sc += ox * q.rx + oy * q.ry;
      ss += oy * q.rx - ox * q.ry;
    }
    const ang = Math.atan2(ss, sc);
    const ca = Math.cos(ang),
      sa = Math.sin(ang);

    const area = Math.max(polyArea(p), 0.02);
    // Gas term is zero at rest volume and restoring away from it, so the toy
    // holds its authored silhouette instead of slowly inflating into a blob.
    const press = clamp(m.pressure * (body.restArea / area - 1), -3, 3) * 0.3 + opts.pump * 0.05;

    // ---- forces
    const ax = new Float64Array(n),
      ay = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const q = p[i];
      const gx2 = cx + (q.rx * ca - q.ry * sa),
        gy2 = cy + (q.rx * sa + q.ry * ca);
      ax[i] += (gx2 - q.x) * m.memory - cx * 0.02;
      ay[i] += (gy2 - q.y) * m.memory - cy * 0.02 + opts.gravity;
      if (q.grab) {
        ax[i] += (q.gx - q.x) * 0.5 * q.grab;
        ay[i] += (q.gy - q.y) * 0.5 * q.grab;
      }
    }
    // gas pushes on every edge, scaled by edge length — the net force on a
    // closed loop is zero, so it inflates without ever pushing the toy sideways
    for (let i = 0; i < n; i++) {
      const a = p[i],
        b = p[(i + 1) % n];
      const ex = b.x - a.x,
        ey = b.y - a.y;
      const len = Math.hypot(ex, ey) || 1e-6;
      const nx = (ey / len) * press * len * 0.5,
        ny = (-ex / len) * press * len * 0.5;
      ax[i] += nx;
      ay[i] += ny;
      ax[(i + 1) % n] += nx;
      ay[(i + 1) % n] += ny;
    }

    // ---- verlet integration
    for (let i = 0; i < n; i++) {
      const q = p[i];
      const vx = clamp((q.x - q.px) * m.damp, -0.5, 0.5),
        vy = clamp((q.y - q.py) * m.damp, -0.5, 0.5);
      q.px = q.x;
      q.py = q.y;
      q.x += vx * dt + ax[i] * dt * dt;
      q.y += vy * dt + ay[i] * dt * dt;
    }

    // ---- positional constraints
    const stiff = clamp(0.15 + m.shell * 0.85, 0.15, 0.95);
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < n; i++) {
        const a = p[i],
          b = p[(i + 1) % n];
        const ex = b.x - a.x,
          ey = b.y - a.y;
        const d = Math.hypot(ex, ey) || 1e-6;
        const corr = ((d - body.L[i]) / d) * 0.5 * stiff;
        const cxx = ex * corr,
          cyy = ey * corr;
        const wa = a.grab ? 0.15 : 1,
          wb = b.grab ? 0.15 : 1;
        a.x += cxx * wa;
        a.y += cyy * wa;
        b.x -= cxx * wb;
        b.y -= cyy * wb;
      }
    }

    // ---- soft container walls so the toy never escapes the stage
    const R = opts.bound;
    for (const q of p) {
      const d = Math.hypot(q.x, q.y);
      if (d > R) {
        const k = (d - R) / d;
        q.x -= q.x * k;
        q.y -= q.y * k;
      }
    }

    let ncx = 0,
      ncy = 0;
    for (const q of p) {
      ncx += q.x;
      ncy += q.y;
    }
    return { cx: ncx / n, cy: ncy / n, area: polyArea(p), ang };
  }

  function outlinePath(ctx, p, px, py, s) {
    const n = p.length;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const p0 = p[(i - 1 + n) % n],
        p1 = p[i],
        p2 = p[(i + 1) % n],
        p3 = p[(i + 2) % n];
      const c1x = p1.x + (p2.x - p0.x) / 6,
        c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6,
        c2y = p2.y - (p3.y - p1.y) / 6;
      if (i === 0) ctx.moveTo(px + p1.x * s, py + p1.y * s);
      ctx.bezierCurveTo(
        px + c1x * s,
        py + c1y * s,
        px + c2x * s,
        py + c2y * s,
        px + p2.x * s,
        py + p2.y * s,
      );
    }
    ctx.closePath();
  }

  // ------------------------------------------------------------------ markup
  function chipRail(items, sel, kind, save) {
    return items
      .map((it, i) => {
        const locked = kind === "mat" && it.unlock > save.squeezes;
        const swatch =
          kind === "mat"
            ? `<span class="nd-swatch" style="background:hsl(${it.hue[0]} ${it.hue[1]}% ${it.hue[2]}%)"></span>`
            : `<span aria-hidden="true">${it.icon}</span>`;
        const label = locked ? `🔒 ${it.unlock}` : it.name;
        return `<button type="button" class="nd-chip" data-nd="${kind}" data-i="${i}" aria-pressed="${i === sel}" ${locked ? "disabled" : ""} title="${locked ? `Unlocks at ${it.unlock} squishes` : it.name}">${swatch}${label}</button>`;
      })
      .join("");
  }

  function html() {
    const save = loadSave();
    const rk = rankFor(save.squeezes);
    const nx = nextRank(save.squeezes);
    const pct = nx ? Math.round(((save.squeezes - rk.at) / (nx.at - rk.at)) * 100) : 100;
    return `<div class="nd-root" data-needoh-root>
  <div class="nd-hud">
    <div class="nd-rank">Rank: <em data-nd-rank>${rk.icon} ${rk.name}</em></div>
    <div class="nd-stat">Squishes <b data-nd-count>${save.squeezes}</b></div>
  </div>
  <div class="nd-xp" role="progressbar" aria-label="Progress to next rank" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" data-nd-xpbar><i style="width:${pct}%" data-nd-xp></i></div>
  <div class="nd-label">1. Choose a shape</div>
  <div class="nd-rail" data-nd-shapes>${chipRail(SHAPES, save.shape % SHAPES.length, "shape", save)}</div>
  <div class="nd-label">2. Choose a material</div>
  <div class="nd-rail" data-nd-mats>${chipRail(MATERIALS, save.material % MATERIALS.length, "mat", save)}</div>
  <div class="nd-stage" data-nd-stage>
    <canvas data-nd-canvas role="img" aria-label="Squishy NeeDoh fidget toy. Drag it to stretch, press and hold to squeeze."></canvas>
    <div class="nd-combo" data-nd-combo></div>
    <div class="nd-hint" data-nd-hint>Drag to stretch · press to squish</div>
    <div class="nd-toast" data-nd-toast></div>
  </div>
  <div class="nd-actions">
    <button type="button" class="btn primary sm" data-nd="squish">💥 Squish</button>
    <button type="button" class="btn sm" data-nd="stretch">↔️ Stretch</button>
    <button type="button" class="btn sm" data-nd="twist">🔄 Twist</button>
    <button type="button" class="btn sm" data-nd="calm" aria-pressed="false">🫧 Calm Mode</button>
  </div>
  <p class="nd-label" style="opacity:.5">Keyboard: Space squish · ← → shape · ↑ ↓ material</p>
</div>`;
  }

  // -------------------------------------------------------------- controller
  function hydrate(root) {
    if (!root || root.__nd) return;
    root.__nd = true;
    injectCSS();

    const save = loadSave();
    const stage = root.querySelector("[data-nd-stage]");
    const cv = root.querySelector("[data-nd-canvas]");
    const ctx = cv.getContext("2d");
    const elCount = root.querySelector("[data-nd-count]");
    const elRank = root.querySelector("[data-nd-rank]");
    const elXp = root.querySelector("[data-nd-xp]");
    const elXpBar = root.querySelector("[data-nd-xpbar]");
    const elCombo = root.querySelector("[data-nd-combo]");
    const elToast = root.querySelector("[data-nd-toast]");
    const elHint = root.querySelector("[data-nd-hint]");

    let shapeIdx = save.shape % SHAPES.length;
    let matIdx = save.material % MATERIALS.length;
    let body = makeBody(SHAPES[shapeIdx], MATERIALS[matIdx]);
    let fx = [];
    let inner = [];
    let pump = 0,
      shake = 0,
      calm = false,
      calmT = 0;
    let combo = 0,
      comboT = 0,
      armed = true;
    let W = 0,
      H = 0,
      S = 1,
      CX = 0,
      CY = 0;
    const lite = reducedMotion();

    function seedInner() {
      const m = MATERIALS[matIdx];
      const count = m.fill === "none" ? 0 : lite ? 10 : m.fill === "bead" ? 46 : 26;
      inner = [];
      for (let i = 0; i < count; i++) {
        const a = Math.random() * TAU,
          r = Math.sqrt(Math.random()) * 0.72;
        inner.push({
          x: Math.cos(a) * r,
          y: Math.sin(a) * r,
          vx: 0,
          vy: 0,
          s: rand(0.03, 0.075),
          h: rand(-18, 18),
        });
      }
    }
    seedInner();

    function resize() {
      const w = stage.clientWidth || 320;
      const h = clamp(Math.round(w * 0.62), 170, 260);
      stage.style.height = h + "px";
      const dpr = clamp(global.devicePixelRatio || 1, 1, 2.5);
      W = w;
      H = h;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      S = Math.min(w, h) * 0.31;
      CX = w / 2;
      CY = h / 2 + h * 0.04;
    }
    resize();
    let ro = null;
    try {
      ro = new ResizeObserver(resize);
      ro.observe(stage);
    } catch {}

    // ---- scoring -----------------------------------------------------
    function toast(msg) {
      elToast.textContent = msg;
      elToast.classList.add("on");
      clearTimeout(toast._t);
      toast._t = setTimeout(() => elToast.classList.remove("on"), 1600);
    }
    function syncHud() {
      const rk = rankFor(save.squeezes),
        nx = nextRank(save.squeezes);
      const pct = nx ? Math.round(((save.squeezes - rk.at) / (nx.at - rk.at)) * 100) : 100;
      elCount.textContent = String(save.squeezes);
      elRank.textContent = `${rk.icon} ${rk.name}`;
      elXp.style.width = pct + "%";
      elXpBar.setAttribute("aria-valuenow", String(pct));
    }
    function checkUnlocks(prev) {
      for (const m of MATERIALS) {
        if (m.unlock > prev && m.unlock <= save.squeezes) toast(`🔓 Unlocked: ${m.name}`);
      }
      for (const a of ACHIEVEMENTS) {
        if (!save.earned.includes(a.id) && a.test(save)) {
          save.earned.push(a.id);
          toast(`🏅 ${a.label}`);
        }
      }
      if (MATERIALS.some((m) => m.unlock > prev && m.unlock <= save.squeezes)) {
        root.querySelector("[data-nd-mats]").innerHTML = chipRail(MATERIALS, matIdx, "mat", save);
      }
    }
    function score(power) {
      const prev = save.squeezes;
      save.squeezes++;
      combo = comboT > 0 ? combo + 1 : 1;
      comboT = 1.15;
      save.bestCombo = Math.max(save.bestCombo, combo);
      if (!save.shapesUsed.includes(SHAPES[shapeIdx].id)) save.shapesUsed.push(SHAPES[shapeIdx].id);
      syncHud();
      if (combo >= 3) {
        elCombo.textContent = `${combo}× COMBO`;
        elCombo.classList.add("on");
      }
      voice(MATERIALS[matIdx].sound, clamp(power, 0, 1));
      try {
        navigator.vibrate?.(clamp(18 + power * 45, 12, 60));
      } catch {}
      burst(clamp(power, 0.2, 1));
      shake = lite ? 0 : clamp(power * 7, 1, 9);
      checkUnlocks(prev);
      persist({ ...save, shape: shapeIdx, material: matIdx });
    }
    function burst(power) {
      if (lite) return;
      const m = MATERIALS[matIdx];
      const n = Math.round(10 + power * 22);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU,
          sp = rand(0.6, 2.4) * power;
        fx.push({
          x: Math.cos(a) * 0.9,
          y: Math.sin(a) * 0.9,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 0.4,
          life: 1,
          h: m.hue[0] + rand(-25, 25),
        });
      }
    }

    // ---- pointer -----------------------------------------------------
    const pointers = new Map();
    function toLocal(ev) {
      const r = cv.getBoundingClientRect();
      return { x: (ev.clientX - r.left - CX) / S, y: (ev.clientY - r.top - CY) / S };
    }
    function grab(ev) {
      const l = toLocal(ev);
      const picks = [];
      for (const q of body.p) {
        const d = Math.hypot(q.x - l.x, q.y - l.y);
        if (d < 0.55) picks.push({ q, w: clamp(1 - d / 0.55, 0, 1) });
      }
      // Missing the body still counts as a poke on the nearest edge, so taps
      // anywhere in the stage feel responsive rather than dead.
      if (!picks.length) {
        let best = body.p[0],
          bd = Infinity;
        for (const q of body.p) {
          const d = Math.hypot(q.x - l.x, q.y - l.y);
          if (d < bd) {
            bd = d;
            best = q;
          }
        }
        picks.push({ q: best, w: 0.8 });
      }
      for (const pk of picks) {
        pk.q.grab = pk.w;
        pk.q.gx = pk.q.x;
        pk.q.gy = pk.q.y;
        pk.ox = pk.q.x - l.x;
        pk.oy = pk.q.y - l.y;
      }
      pointers.set(ev.pointerId, { picks, l });
      stage.classList.add("grabbing");
      if (elHint) elHint.style.opacity = "0";
      audio();
    }
    function move(ev) {
      const g = pointers.get(ev.pointerId);
      if (!g) return;
      const l = toLocal(ev);
      g.l = l;
      for (const pk of g.picks) {
        pk.q.gx = l.x + pk.ox;
        pk.q.gy = l.y + pk.oy;
      }
    }
    function release(ev) {
      const g = pointers.get(ev.pointerId);
      if (!g) return;
      for (const pk of g.picks) pk.q.grab = 0;
      pointers.delete(ev.pointerId);
      if (!pointers.size) stage.classList.remove("grabbing");
    }
    cv.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      cv.setPointerCapture?.(ev.pointerId);
      grab(ev);
    });
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", release);
    cv.addEventListener("pointercancel", release);
    cv.addEventListener("pointerleave", release);

    // ---- scripted moves ---------------------------------------------
    function impulse(kind) {
      const p = body.p;
      // Scripted moves are POSITIONAL squashes: the previous position moves with
      // the current one, so the toy deforms and springs back instead of being
      // launched across the stage by an injected velocity.
      const settle = (fn) => {
        for (const q of p) {
          fn(q);
          q.px = q.x;
          q.py = q.y;
        }
      };
      if (kind === "squish") {
        pump = 2.2;
        settle((q) => {
          q.y *= 0.5;
          q.x *= 1.3;
        });
        score(0.9);
      } else if (kind === "stretch") {
        settle((q) => {
          q.x *= 1.8;
          q.y *= 0.62;
        });
        save.maxStretch = Math.max(save.maxStretch, 1.8);
        score(0.7);
      } else {
        const a = 0.9;
        settle((q) => {
          const nx2 = q.x * Math.cos(a) - q.y * Math.sin(a) * 1.4;
          const ny2 = q.x * Math.sin(a) * 1.4 + q.y * Math.cos(a);
          q.x = nx2 * 0.86;
          q.y = ny2 * 0.86;
        });
        score(0.6);
      }
    }

    root.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-nd]");
      if (!b || !root.contains(b)) return;
      const kind = b.getAttribute("data-nd");
      if (kind === "shape") {
        shapeIdx = Number(b.getAttribute("data-i")) || 0;
        body = makeBody(SHAPES[shapeIdx], MATERIALS[matIdx]);
        root.querySelector("[data-nd-shapes]").innerHTML = chipRail(
          SHAPES,
          shapeIdx,
          "shape",
          save,
        );
        voice(MATERIALS[matIdx].sound, 0.25);
        persist({ ...save, shape: shapeIdx, material: matIdx });
      } else if (kind === "mat") {
        matIdx = Number(b.getAttribute("data-i")) || 0;
        body.mat = MATERIALS[matIdx];
        seedInner();
        root.querySelector("[data-nd-mats]").innerHTML = chipRail(MATERIALS, matIdx, "mat", save);
        voice(MATERIALS[matIdx].sound, 0.35);
        persist({ ...save, shape: shapeIdx, material: matIdx });
      } else if (kind === "calm") {
        calm = !calm;
        calmT = 0;
        b.setAttribute("aria-pressed", String(calm));
        toast(calm ? "🫧 Breathe with the toy — in as it grows" : "Calm Mode off");
      } else {
        impulse(kind);
      }
    });

    root.addEventListener("keydown", (ev) => {
      if (ev.target.closest("input,textarea,select")) return;
      if (ev.key === " " || ev.key === "Enter") {
        if (ev.target.closest("button")) return;
        ev.preventDefault();
        impulse("squish");
      } else if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") {
        ev.preventDefault();
        shapeIdx = (shapeIdx + (ev.key === "ArrowRight" ? 1 : SHAPES.length - 1)) % SHAPES.length;
        body = makeBody(SHAPES[shapeIdx], MATERIALS[matIdx]);
        root.querySelector("[data-nd-shapes]").innerHTML = chipRail(
          SHAPES,
          shapeIdx,
          "shape",
          save,
        );
      } else if (ev.key === "ArrowUp" || ev.key === "ArrowDown") {
        ev.preventDefault();
        const open = MATERIALS.filter((m) => m.unlock <= save.squeezes);
        const cur = open.findIndex((m) => m.id === MATERIALS[matIdx].id);
        const next = open[(cur + (ev.key === "ArrowUp" ? 1 : open.length - 1)) % open.length];
        matIdx = MATERIALS.indexOf(next);
        body.mat = MATERIALS[matIdx];
        seedInner();
        root.querySelector("[data-nd-mats]").innerHTML = chipRail(MATERIALS, matIdx, "mat", save);
      }
    });
    cv.setAttribute("tabindex", "0");

    // ---- render ------------------------------------------------------
    function paint(st) {
      const m = MATERIALS[matIdx];
      const sh = SHAPES[shapeIdx];
      const [h, s, l] = m.hue;
      ctx.clearRect(0, 0, W, H);
      const sx = shake ? rand(-shake, shake) * 0.5 : 0;
      const sy = shake ? rand(-shake, shake) * 0.5 : 0;
      const px = CX + sx,
        py = CY + sy;

      // contact shadow — squashes with the body, which sells the weight
      const spread = (st.area / body.restArea) * 0.9 + 0.2;
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "rgba(10,15,30,1)";
      ctx.beginPath();
      ctx.ellipse(px + st.cx * S, py + S * 1.15, S * spread * 0.95, S * 0.16, 0, 0, TAU);
      ctx.filter = "blur(6px)";
      ctx.fill();
      ctx.restore();

      outlinePath(ctx, body.p, px, py, S);

      // body
      const g = ctx.createRadialGradient(px - S * 0.35, py - S * 0.4, S * 0.1, px, py, S * 1.35);
      g.addColorStop(0, `hsl(${h} ${s}% ${clamp(l + 26, 0, 96)}%)`);
      g.addColorStop(0.55, `hsl(${h} ${s}% ${l}%)`);
      g.addColorStop(1, m.deep);
      ctx.save();
      ctx.shadowColor = `hsla(${h} ${s}% ${l}% / .5)`;
      ctx.shadowBlur = m.id === "nebula" ? 34 : 18;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();

      // clip everything else to the silhouette
      ctx.save();
      outlinePath(ctx, body.p, px, py, S);
      ctx.clip();

      // interior filling
      for (const it of inner) {
        ctx.beginPath();
        ctx.arc(px + it.x * S, py + it.y * S, it.s * S, 0, TAU);
        if (m.fill === "bead")
          ctx.fillStyle = `hsla(${h + it.h} ${s}% ${clamp(l + 22, 0, 92)}% / .85)`;
        else if (m.fill === "glitter") ctx.fillStyle = `hsla(${h + it.h * 3} 100% 88% / .9)`;
        else if (m.fill === "bubble") ctx.fillStyle = "rgba(255,255,255,.28)";
        else if (m.fill === "star") ctx.fillStyle = "rgba(255,255,255,.85)";
        else ctx.fillStyle = "rgba(255,255,255,.35)";
        ctx.fill();
      }
      if (m.fill === "shard") {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#fff";
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(px - S + i * S * 0.55, py + S);
          ctx.lineTo(px - S * 0.5 + i * S * 0.55, py - S);
          ctx.lineTo(px - S * 0.28 + i * S * 0.55, py - S);
          ctx.lineTo(px - S * 0.78 + i * S * 0.55, py + S);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // subsurface glow toward the light, then the specular highlight
      const gg = ctx.createRadialGradient(
        px - S * 0.3,
        py - S * 0.45,
        0,
        px - S * 0.3,
        py - S * 0.45,
        S * 1.1,
      );
      gg.addColorStop(0, `hsla(${h} 100% 92% / ${0.42 * m.gloss})`);
      gg.addColorStop(1, "hsla(0 0% 100% / 0)");
      ctx.fillStyle = gg;
      ctx.fillRect(0, 0, W, H);

      ctx.save();
      ctx.globalAlpha = 0.85 * m.gloss;
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(
        px - S * 0.34 + st.cx * S * 0.4,
        py - S * 0.44,
        S * 0.24 * spread,
        S * 0.15,
        -0.6 + st.ang * 0.4,
        0,
        TAU,
      );
      ctx.filter = "blur(2px)";
      ctx.fill();
      ctx.globalAlpha = 0.5 * m.gloss;
      ctx.beginPath();
      ctx.ellipse(px - S * 0.16, py - S * 0.6, S * 0.08, S * 0.05, -0.6, 0, TAU);
      ctx.fill();
      ctx.restore();

      // bottom bounce light
      const bl = ctx.createLinearGradient(0, py + S * 0.2, 0, py + S * 1.1);
      bl.addColorStop(0, "hsla(0 0% 100% / 0)");
      bl.addColorStop(1, `hsla(${h} 90% 75% / .35)`);
      ctx.fillStyle = bl;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // donut hole, punched with the body's own deformation
      if (sh.hole) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.ellipse(
          px + st.cx * S,
          py + st.cy * S,
          S * sh.hole * spread,
          S * sh.hole * (2 - spread) * 0.9,
          st.ang,
          0,
          TAU,
        );
        ctx.fill();
        ctx.restore();
      }

      // rim light
      outlinePath(ctx, body.p, px, py, S);
      ctx.strokeStyle = `hsla(${h} 100% 88% / ${0.5 * m.gloss})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      // burst particles
      for (const f of fx) {
        ctx.globalAlpha = clamp(f.life, 0, 1);
        ctx.fillStyle = `hsl(${f.h} 95% 70%)`;
        ctx.beginPath();
        ctx.arc(px + f.x * S, py + f.y * S, S * 0.045 * f.life, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // calm-mode breathing ring
      if (calm) {
        const phase = (calmT % 12) / 12;
        const grow = phase < 1 / 3 ? phase * 3 : phase < 0.5 ? 1 : 1 - (phase - 0.5) * 2;
        ctx.strokeStyle = `hsla(${h} 90% 78% / .55)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(px, py, S * (1.25 + grow * 0.5), 0, TAU);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,255,255,.85)";
        ctx.font = "700 12px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          phase < 1 / 3 ? "Breathe in…" : phase < 0.5 ? "Hold" : "Breathe out…",
          px,
          py + S * 1.95,
        );
      }
    }

    // ---- loop --------------------------------------------------------
    let raf = 0,
      last = performance.now(),
      acc = 0,
      lastStep = null;
    function frame(now) {
      if (!root.isConnected) {
        cancelAnimationFrame(raf);
        ro?.disconnect();
        return;
      }
      // FIXED timestep. Verlet carries velocity as a position delta, so feeding
      // it a variable frame time injects energy every time the frame rate wobbles
      // — which on a real phone made the toy shake itself apart within a second.
      // Accumulate elapsed time and run whole 60 Hz sub-steps instead.
      const dt = 1;
      acc = clamp(acc + (now - last) / 16.67, 0, 4);
      last = now;
      const steps = Math.floor(acc);
      acc -= steps;
      calmT += steps / 60;
      comboT = Math.max(0, comboT - steps / 60);
      if (!comboT && combo) {
        combo = 0;
        elCombo.classList.remove("on");
      }

      let st = lastStep;
      for (let k = 0; k < steps; k++) {
        pump *= 0.9;
        shake *= 0.86;
        if (shake < 0.2) shake = 0;
        const calmPump = calm ? Math.sin((calmT / 12) * TAU) * 0.55 : 0;
        st = step(body, dt, { gravity: 0.0004, pump: pump + calmPump, bound: 1.9 });
      }
      if (!st) st = step(body, dt, { gravity: 0.0004, pump, bound: 1.9 });
      lastStep = st;

      // Passive squeeze detection: sustained compression from dragging counts
      // as a real squish, so the toy scores what the child actually does
      // instead of only what the buttons do.
      const ratio = st.area / body.restArea;
      if (ratio < 0.7 && armed) {
        armed = false;
        score(clamp((0.7 - ratio) * 2.4, 0.25, 1));
      } else if (ratio > 0.88) armed = true;
      const spanX = Math.max(...body.p.map((q) => q.x)) - Math.min(...body.p.map((q) => q.x));
      if (spanX / 2 > save.maxStretch) save.maxStretch = spanX / 2;

      // interior filling sloshes and stays inside the shell
      for (const it of inner) {
        // Beads and glitter are suspended in gel, not sitting in a bucket — a
        // trace of drift keeps them alive without letting them stack into a
        // tell-tale line along the bottom.
        it.vx += (Math.random() - 0.5) * 0.005 * dt;
        it.vy += (Math.random() - 0.5) * 0.005 * dt;
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.vx *= 0.985;
        it.vy *= 0.985;
        const d = Math.hypot(it.x - st.cx, it.y - st.cy);
        const lim = Math.sqrt(st.area / Math.PI) * 0.82;
        if (d > lim) {
          const k = lim / (d || 1);
          it.x = st.cx + (it.x - st.cx) * k;
          it.y = st.cy + (it.y - st.cy) * k;
          it.vx *= -0.5;
          it.vy *= -0.5;
        }
      }

      for (let i = fx.length - 1; i >= 0; i--) {
        const f = fx[i];
        f.x += f.vx * 0.04 * dt;
        f.y += f.vy * 0.04 * dt;
        f.vy += 0.09 * dt;
        f.life -= 0.03 * dt;
        if (f.life <= 0) fx.splice(i, 1);
      }

      paint(st);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // Inspection handle for QA: a soft body that quietly drifts off-canvas
    // still screenshots as "a toy in a box", so make its state readable.
    root.__ndState = () => ({ CX, CY, S, W, H, cx: lastStep?.cx, cy: lastStep?.cy, area: lastStep && lastStep.area / body.restArea });

    if (elHint) setTimeout(() => (elHint.style.opacity = "0"), 6000);
  }

  function scan(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches?.("[data-needoh-root]")) hydrate(node);
    node.querySelectorAll?.("[data-needoh-root]").forEach(hydrate);
  }

  function boot() {
    scan(document.body);
    try {
      new MutationObserver((muts) => {
        for (const m of muts) for (const n of m.addedNodes) scan(n);
      }).observe(document.body, { childList: true, subtree: true });
    } catch {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  // `_sim` is exported so the solver can be exercised headlessly — a fidget
  // toy that quietly diverges looks fine in a screenshot and awful in a hand.
  global.NeeDohStudio = { html, hydrate, SHAPES, MATERIALS, _sim: { makeBody, step, polyArea } };
})(window);

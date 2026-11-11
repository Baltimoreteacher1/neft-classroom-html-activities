// EduWonder engine core: the base Web Component every unit engine extends.
//
// What the base owns, so each unit file only builds its machine:
//  - a deterministic 60 Hz fixed-step loop with render interpolation, paused
//    when the tab is hidden or the stage is off screen;
//  - zero allocation per frame: the loop is one pre-bound method, and every
//    string a frame draws is built on state change (refreshLabels), not per frame;
//  - the shadow-DOM shell: canvas apparatus + a control deck of NATIVE controls
//    (range, button, radio). Native controls are what give real Tab / Shift+Tab /
//    Arrow / Space / Enter behaviour and real screen-reader names and values;
//  - live regions (polite for readings, assertive for solves and strain);
//  - English / Spanish toggle that re-binds every string without resetting state;
//  - CRA tiers 0-2, unlocked by struggle (a miss opens Tier 1, a second opens
//    Tier 2), never handed out first;
//  - round flow, progress and receipts in IndexedDB;
//  - test hooks on window.__ewEngines for the keyboard, FPS and GC audits.
//
// Subclass contract (see any unit's game.js):
//   static meta = { gameId, unit, lessons: string[], title: {en, es} }
//   static strings = { en: {...}, es: {...} }
//   initWorld()            allocate every buffer, spring and pool once
//   buildControls(deck)    add native controls with this.slider / this.button
//   newRound(level, next)  set up a round from the seeded rng `next`
//   evaluate()             -> { ok, key, misconception?, vars? }
//   updatePhysics(dt)      fixed-step simulation, no allocation
//   renderScene(ctx, a)    draw the apparatus, no allocation
//   refreshLabels()        rebuild the strings render uses (state/lang change)
//   describe()             one sentence for the canvas label + polite region
//   testPlan()             [{ control, key, times? }] that solves this round

import { haptic, Synth } from "./audio.js";
import { roundRect, staticLayer } from "./draw.js";
import { rng } from "./math.js";
import { addReceipt, loadProgress, saveProgress, storeStatus } from "./store.js";

export const W = 960;
export const H = 540;
const STEP = 1 / 60;
const MAX_FRAME = 0.25;
const LEVELS = 4;
const SOLVES_PER_LEVEL = 3;
const CLOCK_LAST = 0;
const CLOCK_ACC = 1;
const CLOCK_ALPHA = 2;
const CLOCK_NOW = 3;

const CHROME = {
  en: {
    tier0: "Independent",
    tier1: "Guided",
    tier2: "Hands-on",
    tierGroup: "Support level",
    tierLocked: "Opens after a try",
    lang: "Español",
    langName: "Cambiar a español",
    soundOn: "Sound on",
    soundOff: "Sound off",
    next: "Next machine",
    round: "Machine {n}",
    level: "Level {n} of 4",
    cores: "Energy cores: {n}",
    saved: "Progress saves on this device.",
    notSaved: "Progress stays for this visit only.",
    solvedAt: "Solved. {stars} of 3 cores.",
    tierOpened: "Guided support is ready if you want it.",
    tier2Opened: "Hands-on support is ready if you want it.",
    tierNow: "Support level: {name}.",
    controls: "Machine controls",
    status: "Status",
  },
  es: {
    tier0: "Independiente",
    tier1: "Guiado",
    tier2: "Manos a la obra",
    tierGroup: "Nivel de apoyo",
    tierLocked: "Se abre después de un intento",
    lang: "English",
    langName: "Switch to English",
    soundOn: "Sonido activado",
    soundOff: "Sonido apagado",
    next: "Siguiente máquina",
    round: "Máquina {n}",
    level: "Nivel {n} de 4",
    cores: "Núcleos de energía: {n}",
    saved: "El progreso se guarda en este dispositivo.",
    notSaved: "El progreso queda solo durante esta visita.",
    solvedAt: "Resuelto. {stars} de 3 núcleos.",
    tierOpened: "El apoyo guiado está listo si lo quieres.",
    tier2Opened: "El apoyo manos a la obra está listo si lo quieres.",
    tierNow: "Nivel de apoyo: {name}.",
    controls: "Controles de la máquina",
    status: "Estado",
  },
};

const STYLE = `
:host{--bg:#0b1220;--panel:#111a2e;--rail:#1c2a45;--edge:#2c3e63;--ink:#e8eefc;--muted:#a9b6d3;--accent:#46c2b8;--warn:#f2b45a;--ok:#7bdc8f;--focus:#ffd166;
  display:block;max-width:${W}px;margin:0 auto;color:var(--ink);font:16px/1.45 "Atkinson Hyperlegible",system-ui,sans-serif}
*{box-sizing:border-box}
[hidden]{display:none!important}
.shell{background:var(--bg);border:2px solid var(--edge);border-radius:18px;overflow:hidden}
.bar{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--panel);border-bottom:1px solid var(--edge)}
h1{font-size:1.15rem;margin:0;letter-spacing:.02em}
.meta{display:flex;gap:12px;flex-wrap:wrap;color:var(--muted);font-size:.9rem}
.tools{display:flex;gap:8px;flex-wrap:wrap}
.stage{position:relative;aspect-ratio:16/9;background:#050a14}
canvas{display:block;width:100%;height:100%}
.mission{padding:12px 16px 4px;font-size:1.05rem}
.mission p{margin:0 0 6px}
.feedback{min-height:1.6em;padding:0 16px 8px;color:var(--warn)}
.feedback.ok{color:var(--ok)}
.deck{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;padding:12px 16px 16px;background:linear-gradient(#0f1830,#0c1427);border-top:1px solid var(--edge)}
.ctl{display:flex;flex-direction:column;gap:6px;background:var(--rail);border:1px solid var(--edge);border-radius:12px;padding:10px 12px}
.ctl label{font-weight:700;font-size:.95rem;display:flex;justify-content:space-between;gap:8px}
.ctl output{font-variant-numeric:tabular-nums;color:var(--accent)}
input[type=range]{width:100%;min-height:44px;accent-color:var(--accent);background:transparent}
button{min-height:44px;min-width:44px;padding:8px 16px;border-radius:10px;border:2px solid var(--edge);background:#22345a;color:var(--ink);font:inherit;font-weight:700;cursor:pointer}
button.primary{background:var(--accent);border-color:var(--accent);color:#04201d}
button[aria-pressed=true]{border-color:var(--accent)}
button:disabled{opacity:.45;cursor:not-allowed}
.actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;grid-column:1/-1}
fieldset{border:1px solid var(--edge);border-radius:10px;padding:4px 8px;margin:0;display:flex;gap:4px;flex-wrap:wrap}
legend{font-size:.8rem;color:var(--muted);padding:0 4px}
.tier{display:flex;align-items:center;gap:4px;min-height:44px;padding:0 8px;border-radius:8px}
.tier input{width:20px;height:20px;accent-color:var(--accent)}
.tier input:disabled+span{opacity:.5}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px}
.sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
.note{color:var(--muted);font-size:.85rem;padding:0 16px 12px}
@media (forced-colors:active){button,.ctl,fieldset{border:1px solid CanvasText}}
`;

/**
 * Advance the fixed-step clock to clock[CLOCK_NOW] (ms). Returns how many 1/60 s
 * steps to run and leaves interpolation in clock[CLOCK_ALPHA]. Pure typed-array
 * math, and no double crosses the call (an optimized caller would re-box it).
 * @param {Float64Array} clock
 */
function advance(clock) {
  const now = clock[CLOCK_NOW];
  let dt = (now - clock[CLOCK_LAST]) / 1000;
  if (dt > MAX_FRAME) dt = MAX_FRAME;
  if (dt < 0) dt = 0;
  clock[CLOCK_LAST] = now;
  let acc = clock[CLOCK_ACC] + dt;
  let steps = 0;
  while (acc >= STEP) {
    acc -= STEP;
    steps++;
  }
  clock[CLOCK_ACC] = acc;
  clock[CLOCK_ALPHA] = acc / STEP;
  return steps;
}

// Warm advance() into optimized code before the first frame: interpreted code
// boxes every intermediate double, optimized code keeps them in registers.
{
  const scratch = new Float64Array(4);
  for (let i = 0; i < 40000; i++) {
    scratch[CLOCK_NOW] += 16.6667;
    advance(scratch);
  }
}

/** @param {string} s @param {Record<string, any>} [vars] */
function fill(s, vars) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] === undefined ? `{${k}}` : String(vars[k])));
}

export class EduWonderEngine extends HTMLElement {
  constructor() {
    super();
    const ctor = /** @type {any} */ (this.constructor);
    this.meta = ctor.meta;
    this.strings = ctor.strings;
    // A unit string may not reuse a shell key (except its own title): it would
    // silently replace the shell's text, as "level" once did in the header.
    for (const key of Object.keys(CHROME.en)) {
      if (key !== "title" && this.strings?.en && key in this.strings.en)
        console.error(`${ctor.meta?.gameId}: string key "${key}" collides with the engine shell`);
    }
    this.lang = new URLSearchParams(location.search).get("lang") === "es" ? "es" : "en";
    this.synth = new Synth();
    this.tier = 0;
    this.maxTier = 0;
    this.level = 1;
    this.solvedAtLevel = 0;
    this.totalSolved = 0;
    this.cores = 0;
    this.roundIndex = 0;
    this.misses = 0;
    this.solved = false;
    this.roundStart = 0;
    this.misconceptions = [];
    this.tiersUsed = 0;
    this.seed = Number(new URLSearchParams(location.search).get("seed")) || Date.now() % 1e9;
    this.random = rng(this.seed);
    this.running = false;
    this.visible = true;
    this.onScreen = true;
    this.clock = new Float64Array(4);
    this.frameCount = 0;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.frame = this.frame.bind(this);
    /** @type {Map<string, HTMLElement>} */
    this.controls = new Map();
    /** @type {Array<() => void>} */
    this.binders = [];

    const root = this.attachShadow({ mode: "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(STYLE);
    root.adoptedStyleSheets = [sheet];
    root.innerHTML = `
      <div class="shell">
        <div class="bar">
          <h1 id="title"></h1>
          <div class="meta"><span id="round"></span><span id="level"></span><span id="cores"></span></div>
          <div class="tools">
            <fieldset id="tiers"><legend id="tierLegend"></legend></fieldset>
            <button id="sound" type="button" aria-pressed="true"></button>
            <button id="lang" type="button" lang=""></button>
          </div>
        </div>
        <div class="stage"><canvas id="stage" width="${W}" height="${H}" role="img"></canvas></div>
        <div class="mission" id="mission"></div>
        <div class="feedback" id="feedback"></div>
        <section class="deck" id="deck" aria-labelledby="deckLabel"><h2 class="sr" id="deckLabel"></h2></section>
        <p class="note" id="note"></p>
        <div class="sr" aria-live="polite" id="polite"></div>
        <div class="sr" aria-live="assertive" id="assertive"></div>
      </div>`;
    this.$ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (root.getElementById(id));
    this.canvas = /** @type {HTMLCanvasElement} */ (this.$("stage"));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    this.ctx = /** @type {CanvasRenderingContext2D} */ (
      this.canvas.getContext("2d", { alpha: false })
    );
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------- strings ----------
  /** @param {string} key @param {Record<string, any>} [vars] */
  t(key, vars) {
    const table = this.strings[this.lang];
    const s = table && key in table ? table[key] : CHROME[this.lang][key];
    if (s === undefined)
      throw new Error(`${this.meta.gameId}: missing string "${key}" (${this.lang})`);
    return fill(s, vars);
  }

  /** Bind an element's text to a key; re-run on language change. */
  bindText(el, key, vars) {
    const apply = () => {
      el.textContent = this.t(key, typeof vars === "function" ? vars() : vars);
    };
    apply();
    this.binders.push(apply);
  }

  // ---------- controls (native, keyboard + AT by construction) ----------
  /**
   * @param {{id: string, label: string, min: number, max: number, step?: number, value: number,
   *   format?: (v: number) => string, onInput: (v: number) => void}} o
   */
  slider(o) {
    const wrap = document.createElement("div");
    wrap.className = "ctl";
    const label = document.createElement("label");
    label.htmlFor = o.id;
    const name = document.createElement("span");
    const out = document.createElement("output");
    out.htmlFor = o.id;
    label.append(name, out);
    const input = document.createElement("input");
    input.type = "range";
    input.id = o.id;
    input.min = String(o.min);
    input.max = String(o.max);
    input.step = String(o.step ?? 1);
    input.value = String(o.value);
    const format = o.format || ((v) => String(v));
    const show = () => {
      const v = Number(input.value);
      const text = format(v);
      out.textContent = text;
      input.setAttribute("aria-valuetext", text);
    };
    input.addEventListener("input", () => {
      this.synth.unlock();
      this.synth.tick();
      show();
      o.onInput(Number(input.value));
    });
    this.bindText(name, o.label);
    this.binders.push(show);
    show();
    wrap.append(label, input);
    this.$("deck").append(wrap);
    this.controls.set(o.id, input);
    /** Set the value from code (new round) without counting as a move. */
    return {
      input,
      wrap,
      set: (v) => {
        input.value = String(v);
        show();
      },
      setRange: (min, max, step) => {
        input.min = String(min);
        input.max = String(max);
        if (step !== undefined) input.step = String(step);
        show();
      },
      show,
    };
  }

  /** @param {{id: string, label: string, primary?: boolean, onPress: () => void, parent?: HTMLElement}} o */
  button(o) {
    const b = document.createElement("button");
    b.type = "button";
    b.id = o.id;
    if (o.primary) b.className = "primary";
    b.addEventListener("click", () => {
      this.synth.unlock();
      o.onPress();
    });
    this.bindText(b, o.label);
    (o.parent || this.actionRow()).append(b);
    this.controls.set(o.id, b);
    return b;
  }

  actionRow() {
    if (!this.actions) {
      this.actions = document.createElement("div");
      this.actions.className = "actions";
      this.$("deck").append(this.actions);
    }
    return this.actions;
  }

  // ---------- announcements ----------
  say(text) {
    const el = this.$("polite");
    el.textContent = "";
    el.textContent = text;
  }

  shout(text) {
    const el = this.$("assertive");
    el.textContent = "";
    el.textContent = text;
  }

  setFeedback(text, ok = false) {
    const el = this.$("feedback");
    el.textContent = text;
    el.classList.toggle("ok", ok);
  }

  /** Re-describe the scene: canvas label + labels + polite reading. Event-time only. */
  sync(announce = true) {
    this.refreshLabels();
    const d = this.describe();
    this.canvas.setAttribute("aria-label", d);
    if (announce) this.say(d);
  }

  // ---------- lifecycle ----------
  async connectedCallback() {
    if (this.started) return;
    this.started = true;
    this.buildChrome();
    this.initWorld();
    this.buildControls(this.$("deck"));
    this.nextButton = this.button({ id: "next", label: "next", onPress: () => this.startRound() });
    this.nextButton.hidden = true;
    const saved = await loadProgress(this.meta.gameId);
    if (saved) {
      this.level = Math.min(LEVELS, Math.max(1, saved.level | 0 || 1));
      this.solvedAtLevel = saved.solvedAtLevel | 0;
      this.totalSolved = saved.totalSolved | 0;
      this.cores = saved.cores | 0;
    }
    this.$("note").textContent = this.t(storeStatus.persistent ? "saved" : "notSaved");
    this.startRound(false);
    document.addEventListener("visibilitychange", () => {
      this.visible = !document.hidden;
      this.resume();
    });
    new IntersectionObserver((entries) => {
      this.onScreen = entries[entries.length - 1].isIntersecting;
      this.resume();
    }).observe(this.canvas);
    this.addEventListener("pointerdown", () => this.synth.unlock(), { passive: true });
    this.addEventListener("keydown", () => this.synth.unlock());
    window.__ewEngines = window.__ewEngines || [];
    window.__ewEngines.push(this);
    this.resume();
  }


  disconnectedCallback() {
    this.running = false;
  }

  buildChrome() {
    this.bindText(this.$("title"), "title");
    this.bindText(this.$("round"), "round", () => ({ n: this.roundIndex }));
    this.bindText(this.$("level"), "level", () => ({ n: this.level }));
    this.bindText(this.$("cores"), "cores", () => ({ n: this.cores }));
    this.bindText(this.$("tierLegend"), "tierGroup");
    this.bindText(this.$("deckLabel"), "controls");
    const tiers = this.$("tiers");
    this.tierInputs = [0, 1, 2].map((n) => {
      const lab = document.createElement("label");
      lab.className = "tier";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "tier";
      input.value = String(n);
      input.checked = n === 0;
      input.disabled = n > 0;
      const span = document.createElement("span");
      lab.append(input, span);
      tiers.append(lab);
      this.binders.push(() => {
        span.textContent = this.t(`tier${n}`);
        lab.title = input.disabled ? this.t("tierLocked") : "";
      });
      input.addEventListener("change", () => {
        if (!input.checked) return;
        this.setTier(n);
      });
      return input;
    });
    const sound = this.$("sound");
    sound.addEventListener("click", () => {
      this.synth.unlock();
      this.synth.setMuted(!this.synth.muted);
      sound.setAttribute("aria-pressed", String(!this.synth.muted));
      sound.textContent = this.t(this.synth.muted ? "soundOff" : "soundOn");
    });
    this.binders.push(() => {
      sound.textContent = this.t(this.synth.muted ? "soundOff" : "soundOn");
    });
    const lang = this.$("lang");
    lang.addEventListener("click", () => this.setLanguage(this.lang === "en" ? "es" : "en"));
    this.binders.push(() => {
      lang.textContent = this.t("lang");
      lang.setAttribute("lang", this.lang === "en" ? "es" : "en");
      lang.setAttribute("aria-label", this.t("langName"));
    });
  }

  setLanguage(lang) {
    this.lang = lang;
    document.documentElement.lang = lang;
    for (const b of this.binders) b();
    this.$("note").textContent = this.t(storeStatus.persistent ? "saved" : "notSaved");
    this.renderMission();
    this.sync(false);
  }

  setTier(n) {
    if (n > this.maxTier) return;
    this.tier = /** @type {0|1|2} */ (n);
    this.tiersUsed = Math.max(this.tiersUsed, n);
    this.tierInputs[n].checked = true;
    this.onTier(n);
    this.sync(false);
    this.say(this.t("tierNow", { name: this.t(`tier${n}`) }));
  }

  /** Called when the tier changes; subclasses show or hide scaffolds. */
  onTier(_n) {}

  unlockTier(n) {
    if (n <= this.maxTier) return;
    this.maxTier = n;
    for (let i = 0; i <= n; i++) this.tierInputs[i].disabled = false;
    for (const b of this.binders) b();
    this.say(this.t(n === 1 ? "tierOpened" : "tier2Opened"));
  }

  startRound(announce = true) {
    this.roundIndex++;
    this.misses = 0;
    this.solved = false;
    this.misconceptions = [];
    this.tiersUsed = this.tier;
    this.roundStart = performance.now();
    this.nextButton.hidden = true;
    this.setFeedback("");
    this.newRound(this.level, this.random);
    for (const b of this.binders) b();
    this.renderMission();
    this.sync(false);
    if (announce) this.shout(this.missionText());
  }

  missionText() {
    return this.$("mission").textContent || "";
  }

  /** Subclasses write the round's prompt into the mission panel. */
  renderMission() {
    const el = this.$("mission");
    el.textContent = "";
    const p = document.createElement("p");
    p.textContent = this.mission();
    el.append(p);
  }

  /** @returns {string} the round's prompt in the current language */
  mission() {
    return "";
  }

  /** Run the subclass check, then the shared reward / strain flow. */
  check() {
    if (this.solved) return;
    const r = this.evaluate();
    if (r.ok) {
      this.solved = true;
      const stars = this.tiersUsed === 0 && this.misses === 0 ? 3 : this.tiersUsed < 2 ? 2 : 1;
      this.cores += stars;
      this.totalSolved++;
      this.solvedAtLevel++;
      if (this.solvedAtLevel >= SOLVES_PER_LEVEL && this.level < LEVELS) {
        this.level++;
        this.solvedAtLevel = 0;
      }
      this.synth.success();
      haptic([30, 40, 60]);
      const text = `${this.t(r.key, r.vars)} ${this.t("solvedAt", { stars })}`;
      this.setFeedback(text, true);
      this.shout(text);
      this.nextButton.hidden = false;
      this.onSolved();
      this.persist(true);
    } else {
      this.misses++;
      if (r.misconception && !this.misconceptions.includes(r.misconception))
        this.misconceptions.push(r.misconception);
      this.synth.strain();
      haptic([15]);
      const text = this.t(r.key, r.vars);
      this.setFeedback(text);
      this.shout(text);
      this.onMiss(r);
      if (this.misses >= 1) this.unlockTier(1);
      if (this.misses >= 2) this.unlockTier(2);
    }
    for (const b of this.binders) b();
    this.sync(false);
  }

  onSolved() {}
  /** @param {any} _r */
  onMiss(_r) {}

  persist(resolved) {
    const m = this.meta;
    saveProgress({
      gameId: m.gameId,
      level: this.level,
      solvedAtLevel: this.solvedAtLevel,
      totalSolved: this.totalSolved,
      cores: this.cores,
      updated: Date.now(),
    });
    addReceipt({
      gameId: m.gameId,
      unitNumber: m.unit,
      timestamp: Date.now(),
      elapsedMs: Math.round(performance.now() - this.roundStart),
      craTierUsed: this.tiersUsed,
      misconceptionsEncountered: this.misconceptions.slice(),
      resolvedSuccessfully: resolved,
    });
  }

  // ---------- loop ----------
  resume() {
    const want = this.visible && this.onScreen;
    if (want && !this.running) {
      this.running = true;
      this.clock[CLOCK_LAST] = performance.now();
      this.clock[CLOCK_ACC] = 0;
      requestAnimationFrame(this.frame);
    } else if (!want) {
      this.running = false;
    }
  }

  /**
   * One display frame. All double arithmetic lives in advance(), which is
   * JIT-warmed at module load; this method only moves integers, so it allocates
   * nothing even while V8 is still interpreting it.
   * @param {number} now
   */
  frame(now) {
    if (!this.running) return;
    this.clock[CLOCK_NOW] = now;
    const steps = advance(this.clock);
    for (let i = 0; i < steps; i++) this.updatePhysics(STEP);
    this.renderScene(this.ctx);
    this.frameCount++;
    requestAnimationFrame(this.frame);
  }

  /** Audit hook: run n fixed steps + renders synchronously. */
  stepFrames(n) {
    for (let i = 0; i < n; i++) {
      this.updatePhysics(STEP);
      this.renderScene(this.ctx);
    }
  }

  // ---------- drawing helpers shared by every apparatus (no allocation) ----------
  /** Rounded rectangle path (integer-snapped; see draw.js). */
  roundRect(ctx, x, y, w, h, r) {
    roundRect(ctx, x, y, w, h, r);
  }

  /** Clear the stage to the backdrop: a pre-rendered engineering grid. */
  backdrop(ctx) {
    if (!this.backdropLayer) {
      this.backdropLayer = staticLayer(W, H, (g) => {
        g.fillStyle = "#070d1a";
        g.fillRect(0, 0, W, H);
        g.strokeStyle = "rgba(90,120,170,0.08)";
        g.lineWidth = 1;
        g.beginPath();
        for (let x = 0; x <= W; x += 40) {
          g.moveTo(x + 0.5, 0);
          g.lineTo(x + 0.5, H);
        }
        for (let y = 0; y <= H; y += 40) {
          g.moveTo(0, y + 0.5);
          g.lineTo(W, y + 0.5);
        }
        g.stroke();
      });
    }
    ctx.drawImage(this.backdropLayer, 0, 0, W, H);
  }

  // ---------- abstract ----------
  initWorld() {}
  /** @param {HTMLElement} _deck */
  buildControls(_deck) {}
  /** @param {number} _level @param {() => number} _next */
  newRound(_level, _next) {}
  /** @returns {{ok: boolean, key: string, misconception?: string, vars?: Record<string, any>}} */
  evaluate() {
    return { ok: false, key: "title" };
  }
  /** @param {number} _dt */
  updatePhysics(_dt) {}
  /** Interpolation 0..1 between fixed steps is this.clock[2]. @param {CanvasRenderingContext2D} _ctx */
  renderScene(_ctx) {}
  refreshLabels() {}
  describe() {
    return "";
  }
  /** @returns {Array<{control: string, key: string, times?: number}>} */
  testPlan() {
    return [];
  }
}

/** Register a custom element once. */
export function define(tag, ctor) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

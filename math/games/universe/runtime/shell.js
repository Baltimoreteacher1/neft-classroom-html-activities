// Math Gaming Runtime — the base Web Component every universe game extends.
//
// The shell owns everything that is the same in every game, so a game file is
// only its world, its rules and its drawing:
//   lifecycle (title -> level -> complete), the fixed-step loop, input, camera,
//   audio buses, particles, the HUD, pause and settings, the instrument panel
//   where mathematics is entered with native controls, the Time Machine and
//   Reality Shift surfaces, Ori (the apprentice), learning evidence, and
//   versioned saves with checkpoints.
//
// Subclass contract (see games/power-plant/game.js):
//   static def      GameDefinition: { id, title, tagline, bed, lessons, levels[], mechanics[],
//                   concepts?, uses: { multiverse?, shift? } }
//   static strings  { en, es }
//   rules           SimRules (+ applyChange / measure / carry for a multiverse)
//   createWorld(levelIndex, seed)  -> plain JSON world with `rng`
//   focus(world)    -> { x, y, face } the camera follows
//   bounds(world)   -> { x, y, w, h }
//   drawBackdrop(ctx, cam, world, t)   screen space, parallax
//   draw(ctx, world, t)                world space
//   drawOverlay(ctx, world, t)         screen space, optional
//   onEvent(event)                     presentation for a SimulationEvent
//   interactable(world) -> { id, what } | null    the machine in reach
//   interact(target)                   open its instrument (this.openPanel)
//   objective(world) -> string         one line for the HUD
//   describe(world)  -> string         scene description for the canvas label
//   autopilot(world) -> mask           "Guide me there": travel without motor demand

import { ParticlePool } from "../../engines/core/particles.js";
import { Apprentice, newCompanionState } from "./apprentice.js";
import { PAL } from "./art.js";
import { AudioBus } from "./audio.js";
import { Camera } from "./camera.js";
import { CHROME, el, fill, H, STYLE, TEMPLATE, W } from "./chrome.js";
import { EvidenceLog } from "./evidence.js";
import { Input, keyName } from "./input.js";
import { Multiverse } from "./multiverse.js";
import * as panels from "./panels.js";
import { report } from "./report.js";
import {
  loadCompanion,
  loadGame,
  loadSettings,
  saveCompanion,
  saveGame,
  saveSettings,
  saveStatus,
} from "./save.js";
import { IN, Simulation, STEP } from "./sim.js";
import { Timeline } from "./timeline.js";

export { el, H, W };
const MAX_FRAME = 0.25;
const FX_COLORS = [PAL.gold, PAL.tealGlow, PAL.cream, PAL.terra, PAL.ok, PAL.sage];

export class UniverseGame extends HTMLElement {
  constructor() {
    super();
    const ctor = /** @type {any} */ (this.constructor);
    this.def = ctor.def;
    this.strings = ctor.strings;
    const params = new URLSearchParams(location.search);
    this.settings = loadSettings();
    this.lang =
      params.get("lang") === "es"
        ? "es"
        : params.get("lang") === "en"
          ? "en"
          : this.settings.lang || "en";
    /** Lesson the student launched from, e.g. "6-3"; picks the starting level. */
    this.lesson = params.get("lesson") || "";
    this.seed = Number(params.get("seed")) || 20261116;
    this.save = loadGame(this.def.id);
    this.evidence = EvidenceLog.revive(this.def.id, this.save.evidence);
    this.ori = new Apprentice(this.def.concepts || [], loadCompanion() || newCompanionState());
    this.mode = "title";
    this.levelIndex = 0;
    this.now = 0;
    this.acc = 0;
    this.last = 0;
    this.frames = 0;
    this.events = [];
    /** Follow-up lines and prompts, run in order once their time comes (see later()). */
    this.queue = [];
    this.pendingMeta = null;
    this.prediction = null;
    this.caption = null;
    this.oriMood = "curious";
    this.frame = this.frame.bind(this);

    const root = this.attachShadow({ mode: "open" });
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(STYLE);
    root.adoptedStyleSheets = [sheet];
    root.innerHTML = TEMPLATE;
    this.$ = (/** @type {string} */ id) => /** @type {HTMLElement} */ (root.getElementById(id));
    this.canvas = /** @type {HTMLCanvasElement} */ (this.$("stage"));
    this.camera = new Camera(W, H);
    this.input = new Input(this.canvas, this.settings.keys);
    this.audio = new AudioBus(this.settings);
    this.fx = new ParticlePool(256, FX_COLORS);
    this.applySettings();
  }

  // ---------- strings ----------
  /** @param {string} key @param {Record<string, any>} [vars] */
  t(key, vars) {
    const own = this.strings[this.lang];
    const s = own && key in own ? own[key] : CHROME[this.lang][key];
    if (s === undefined) throw new Error(`${this.def.id}: missing string "${key}" (${this.lang})`);
    return fill(s, vars);
  }

  /** Pick the current language from an { en, es } pair. */
  tx(pair) {
    return pair ? pair[this.lang] || pair.en : "";
  }

  // ---------- settings ----------
  applySettings() {
    const s = this.settings;
    const sysReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.reduced = s.reduced || sysReduced;
    this.lowfx = s.lowfx;
    this.toggleAttribute("data-contrast", s.contrast);
    this.toggleAttribute("data-reduced", this.reduced);
    this.camera.reducedMotion = this.reduced;
    this.audio.setVolume("sfx", s.sfx);
    this.audio.setVolume("music", s.music);
    this.audio.vol.voice = s.voice;
    const dpr = s.lowfx ? 1 : Math.min(2, window.devicePixelRatio || 1);
    if (this.canvas.width !== Math.round(W * dpr)) {
      this.canvas.width = Math.round(W * dpr);
      this.canvas.height = Math.round(H * dpr);
    }
    this.ctx = /** @type {CanvasRenderingContext2D} */ (
      this.canvas.getContext("2d", { alpha: false })
    );
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    document.documentElement.lang = this.lang;
  }

  setSetting(key, value) {
    this.settings[key] = value;
    if (key === "lang") this.lang = value;
    saveSettings(this.settings);
    this.applySettings();
    this.refreshHud();
  }

  // ---------- lifecycle ----------
  connectedCallback() {
    if (this.started) return;
    this.started = true;
    window.__universe = this;
    const unlock = () => this.audio.unlock();
    this.addEventListener("pointerdown", unlock, { passive: true });
    this.addEventListener("keydown", unlock);
    // Pause lives on the host, not the canvas: it must work while a dialog or
    // panel holds focus, and it must act now, not on the next frame.
    this.addEventListener("keydown", (e) => {
      if (e.code !== "Escape" && !(e.code === "KeyP" && e.target === this && this.mode !== "panel")) return;
      if (this.mode === "play") this.pause();
      else if (this.mode === "pause") this.resume();
      else if (this.mode === "panel") this.closePanel();
      else return;
      e.preventDefault();
    });
    this.$("btnPause").addEventListener("click", () => this.pause());
    this.$("btnTime").addEventListener("click", () => panels.openTimeline(this));
    this.$("btnShift").addEventListener("click", () => this.onShiftKey());
    this.$("prompt").addEventListener("click", () => this.tryInteract());
    for (const b of this.$("touch").querySelectorAll("button")) {
      const bit = Number(b.dataset.bit);
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        this.input.press(bit);
      });
      for (const ev of ["pointerup", "pointercancel", "pointerleave"])
        b.addEventListener(ev, () => this.input.lift(bit));
    }
    this.$("touch").hidden = !matchMedia("(pointer: coarse)").matches;
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.mode === "play") this.pause();
    });
    // Launched from a lesson: open on that lesson's level.
    const byLesson = this.def.levels.findIndex((l) => l.lesson === this.lesson);
    this.levelIndex =
      byLesson >= 0 ? byLesson : Math.min(this.save.level, this.def.levels.length - 1);
    this.previewLevel(this.levelIndex);
    panels.openTitle(this);
    requestAnimationFrame(this.frame);
  }

  disconnectedCallback() {
    this.gone = true;
    this.audio.stopMusic();
    this.audio.hush();
  }

  /** Build a level's world so the title screen has a live scene behind it. */
  previewLevel(index) {
    const world = this.createWorld(index, this.seed + index);
    this.subject = this.def.uses?.multiverse
      ? new Multiverse(this.rules, world)
      : new Simulation(this.rules, world);
    this.timeline = new Timeline(this.subject);
    const b = this.bounds(this.world);
    this.camera.setBounds(b.x, b.y, b.w, b.h);
    const f = this.focus(this.world);
    this.camera.snap(f.x, f.y);
    this.canvas.setAttribute("aria-label", this.tx(this.def.title));
  }

  /** The world the player is in (the active reality when there are two). */
  get world() {
    return this.subject.world;
  }

  get level() {
    return this.def.levels[this.levelIndex];
  }

  startLevel(index, checkpoint = null) {
    this.levelIndex = index;
    this.previewLevel(index);
    if (checkpoint) {
      this.subject.restore(checkpoint.snapshot);
      this.timeline = new Timeline(this.subject);
      const f = this.focus(this.world);
      this.camera.snap(f.x, f.y);
    }
    this.save.level = index;
    this.save.unlocked = Math.max(this.save.unlocked, index);
    this.persist();
    this.fx.clear();
    this.queue.length = 0;
    this.prediction = null;
    this.closeVeil();
    this.closePanel();
    this.$("hud").hidden = false;
    this.$("btnTime").hidden = false;
    this.$("btnShift").hidden = !this.def.uses?.shift;
    this.mode = "play";
    this.audio.startMusic(this.def.bed);
    this.refreshHud();
    this.onLevelStart?.(index, !!checkpoint);
    this.canvas.focus({ preventScroll: true });
  }

  persist() {
    this.save.evidence = this.evidence.serialize();
    saveGame(this.save);
    saveCompanion(this.ori.state);
  }

  pause() {
    if (this.mode !== "play") return;
    this.mode = "pause";
    panels.openPause(this);
  }

  resume() {
    this.closeVeil();
    this.mode = "play";
    this.last = performance.now();
    this.canvas.focus({ preventScroll: true });
  }

  // ---------- decisions, outcomes, evidence ----------
  /**
   * A mathematical decision: becomes a turning point on the timeline and is applied.
   * @param {string} kind @param {{en: string, es: string}} label @param {any} action
   * @param {{mechanic: string, lesson?: string, support?: string, detail?: any}} meta
   */
  decide(kind, label, action, meta) {
    const id = this.timeline.mark(kind, label, action);
    this.pendingMeta = { id, ...meta };
    this.save.timeline = null;
    return id;
  }

  /** Run `fn` after `seconds` of display time, so a follow-up never talks over an outcome. */
  later(seconds, fn) {
    this.queue.push({ at: this.now + seconds, run: fn });
    this.queue.sort((a, b) => a.at - b.at);
  }

  handle(e) {
    // In a Reality Shift, an outcome in the reality the student is NOT in is a
    // counterfactual: shown, never recorded as the student's evidence.
    if (
      e.reality !== undefined &&
      this.subject instanceof Multiverse &&
      e.reality !== this.subject.active &&
      (e.type === "outcome" || e.type === "complete" || e.type === "checkpoint" || e.type === "say" || e.type === "refuse")
    ) {
      this.onCounterfactual?.(e);
      return;
    }
    switch (e.type) {
      case "outcome": {
        const m = this.pendingMeta || { id: this.timeline.head, mechanic: e.mechanic || "play" };
        // An apprentice run with no decision behind it (Ori's own first try) marks no node.
        if (!e.byOri || m.ori)
          this.timeline.resolve({ ok: e.ok, key: e.key, vars: e.vars }, e.node ?? m.id);
        if (!e.byOri)
          this.evidence.decision(
          this.level.id,
          e.lesson || m.lesson || this.level.lesson,
          e.mechanic || m.mechanic,
          e.ok,
          {
            support: m.support,
            misconception: e.misconception,
            detail: e.detail || m.detail,
          },
        );
        this.audio.sfx(e.ok ? "success" : "strain");
        if (!e.ok) this.camera.kick(3);
        if (e.key) this.say(e.who || "wren", this.t(e.key, e.vars), e.ok ? "celebrate" : "worried");
        if (this.prediction && e.settles !== false) {
          const p = this.prediction;
          this.settlePrediction(p.judge ? p.judge(e) : e.ok === p.expectOk);
        }
        this.announce();
        this.persist();
        break;
      }
      case "checkpoint":
        if (this.save.checkpoint?.id !== e.id || this.save.checkpoint?.level !== this.levelIndex) {
          this.save.checkpoint = {
            level: this.levelIndex,
            id: e.id,
            snapshot: this.subject.snapshot(),
          };
          this.persist();
          this.toast(this.t("checkpointHit"));
          this.audio.sfx("checkpoint");
        }
        break;
      case "complete":
        this.completeLevel();
        break;
      case "say":
        this.say(e.who || "ori", this.t(e.key, e.vars), e.mood);
        break;
      case "jump":
        this.audio.sfx("jump");
        this.fx.emit(e.x, e.y, 5, 60, 2, -Math.PI / 2, 2.4, 0.3);
        break;
      case "land":
        this.audio.sfx("land", Math.min(1, e.speed / 9));
        if (e.speed > 5) this.fx.emit(e.x, e.y, 8, 80, 2, -Math.PI / 2, 2.8, 0.35);
        if (e.speed > 9) this.camera.kick(2);
        break;
      case "dash":
        this.audio.sfx("dash");
        this.fx.emit(e.x, e.y + 20, 10, 90, 1, e.face > 0 ? Math.PI : 0, 0.8, 0.3);
        break;
      case "shift":
        this.audio.sfx("shift");
        this.refreshHud();
        break;
      case "switch":
        this.audio.sfx("shift");
        this.sweep();
        this.refreshHud();
        break;
    }
    this.onEvent?.(e);
  }

  completeLevel() {
    if (this.mode === "done") return;
    this.mode = "done";
    const id = this.level.id;
    this.evidence.record({
      level: id,
      lesson: this.level.lesson,
      mechanic: "level",
      strand: "completion",
      ok: true,
    });
    if (!this.save.completed.includes(id)) this.save.completed.push(id);
    this.save.unlocked = Math.max(
      this.save.unlocked,
      Math.min(this.def.levels.length - 1, this.levelIndex + 1),
    );
    this.save.checkpoint = null;
    this.timeline.close();
    this.save.timeline = this.timeline.serialize();
    this.persist();
    report(this);
    this.audio.sfx("discover");
    panels.openComplete(this);
  }

  // ---------- Ori ----------
  /** The student demonstrated something to Ori. Returns the apprentice's verdict. */
  teach(conceptId, demo) {
    const r = this.ori.observe(conceptId, demo);
    this.oriMood = this.ori.state.mood;
    if (r.credited.length)
      this.evidence.record({
        level: this.level.id,
        lesson: this.level.lesson,
        mechanic: conceptId,
        strand: "reasoning",
        ok: true,
        detail: { kind: demo.kind, shows: r.credited },
      });
    this.persist();
    return r;
  }

  /** Ori attempts the held-out task; the result is transfer evidence. */
  transfer(conceptId, task) {
    const r = this.ori.transfer(conceptId, task);
    this.oriMood = r.passed ? "eureka" : "worried";
    this.evidence.record({
      level: this.level.id,
      lesson: this.level.lesson,
      mechanic: conceptId,
      strand: "transfer",
      ok: r.passed,
      detail: { task: task.signature, missing: r.missing?.id },
    });
    this.audio.sfx(r.passed ? "discover" : "strain");
    this.persist();
    return r;
  }

  // ---------- reasoning: predictions and explanations ----------
  /** Ask for a prediction before an important change. Resolves with the chosen option. */
  predict(o) {
    return panels.openPredict(this, o);
  }

  settlePrediction(held) {
    const p = this.prediction;
    if (!p) return;
    this.prediction = null;
    this.evidence.record({
      level: this.level.id,
      lesson: this.level.lesson,
      mechanic: p.mechanic,
      strand: "reasoning",
      ok: held,
      detail: { kind: "prediction", choice: p.choice },
    });
    this.toast(this.t(held ? "predictHeld" : "predictOff"));
  }

  explain(o) {
    return panels.openExplain(this, o);
  }

  support(name) {
    this.evidence.record({
      level: this.level.id,
      lesson: this.level.lesson,
      mechanic: name,
      strand: "supports",
      support: name,
    });
  }

  // ---------- presentation helpers ----------
  say(who, text, mood) {
    if (mood && who === "ori") this.oriMood = mood;
    this.caption = { who, text, until: this.now + Math.max(3.5, text.length * 0.07) };
    this.$("who").textContent = this.t_name(who);
    this.$("line").textContent = text;
    this.$("caption").hidden = false;
    this.$("caption").classList.toggle("ori", who === "ori");
    this.$("polite").textContent = `${this.t_name(who)}: ${text}`;
    if (who === "ori") this.audio.sfx("talk", 1);
    if (this.settings.voice > 0) this.audio.speak(text, this.lang);
  }

  t_name(who) {
    return who === "ori" ? this.t("oriName") : who === "wren" ? this.t("wrenName") : who;
  }

  toast(text) {
    const node = this.$("toast");
    node.textContent = text;
    node.hidden = false;
    node.classList.remove("pop");
    void node.offsetWidth;
    node.classList.add("pop");
    this.toastUntil = this.now + 2.6;
  }

  sweep() {
    const f = this.focus(this.world);
    this.camera.snap(f.x, f.y);
    if (this.reduced) return;
    const s = el("div.sweep");
    this.$("frame").append(s);
    s.addEventListener("animationend", () => s.remove());
  }

  announce() {
    this.canvas.setAttribute(
      "aria-label",
      this.describe ? this.describe(this.world) : this.tx(this.def.title),
    );
  }

  refreshHud() {
    if (this.mode === "title") return;
    const obj = this.$("objective");
    obj.textContent = this.objective ? this.objective(this.world) : "";
    obj.append(
      el(
        "small",
        null,
        `${this.tx(this.level.title)} · ${this.t("levelOf", { n: this.levelIndex + 1, total: this.def.levels.length })}`,
      ),
    );
    const label = (id, key, glyph) => {
      const b = this.$(id);
      b.textContent = glyph;
      b.append(el("span", null, ` ${this.t(key)}`));
      b.setAttribute("aria-label", this.t(key));
    };
    label("btnPause", "pause", "❙❙");
    label("btnTime", "timeMachine", "↺");
    label("btnShift", "shift", "◈");
    const mv = this.subject instanceof Multiverse ? this.subject : null;
    this.$("reality").hidden = !mv?.shifted;
    this.$("frame").dataset.reality = String(mv?.active || 0);
    if (mv?.shifted) this.$("reality").textContent = this.t(mv.active ? "realityB" : "realityA");
    this.announce();
  }

  // ---------- panels ----------
  /** Open the instrument panel. The simulation waits while it is open: no time pressure. */
  openPanel(title, build) {
    const panel = this.$("panel");
    panel.textContent = "";
    const head = el("div.row", null, el("h2", { id: "panelTitle" }, title));
    const body = el("div.stack");
    panel.append(
      head,
      body,
      el(
        "div.row",
        null,
        el(
          "button.ghost",
          { type: "button", on: { click: () => this.closePanel() } },
          this.t("close"),
        ),
      ),
    );
    // Consoles pass `null` for controls that do not apply; drop them instead of printing "null".
    const append = body.append.bind(body);
    body.append = (...kids) => append(...kids.filter((k) => k != null));
    build(body);
    panel.hidden = false;
    if (this.mode === "play") this.mode = "panel";
    (panel.querySelector("button, input, textarea") || panel).focus?.();
  }

  closePanel() {
    this.$("panel").hidden = true;
    if (this.mode === "panel") {
      this.mode = "play";
      this.last = performance.now();
      this.canvas.focus({ preventScroll: true });
    }
  }

  openVeil(node, cls = "") {
    const veil = this.$("veil");
    veil.className = `veil ${cls}`;
    veil.textContent = "";
    veil.append(node);
    veil.hidden = false;
    (veil.querySelector("button, input") || veil).focus?.();
  }

  closeVeil() {
    this.$("veil").hidden = true;
  }

  tryInteract() {
    if (this.mode !== "play") return;
    const target = this.reach(this.world);
    if (!target) return;
    if (target.travel) this.travel(target);
    else this.interact(target);
  }

  /**
   * What "Use" acts on: the machine in reach, or, with "Guide me there" on, the
   * next stop Wren can be taken to (same mathematics, no motor demand).
   */
  reach(world) {
    const near = this.interactable ? this.interactable(world) : null;
    if (near || !this.settings.guide || !this.nextStop) return near;
    const stop = this.nextStop(world);
    return stop ? { ...stop, travel: true, what: this.t("goTo", { what: stop.what }) } : null;
  }

  /** Guided travel is a recorded action, so it rewinds and replays like any other. */
  travel(stop) {
    this.timeline.mark("travel", { en: `Went to ${stop.what}`, es: `Fue a ${stop.what}` }, {
      type: "travel",
      x: stop.x,
      y: stop.y,
    });
    this.timeline.resolve({ ok: true, key: "" });
    this.support("guided-travel");
    const f = this.focus(this.world);
    this.camera.snap(f.x, f.y);
  }

  onShiftKey() {
    if (this.def.uses?.shift && this.mode === "play") panels.openShift(this);
  }

  // ---------- loop ----------
  frame(now) {
    if (this.gone) return;
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (!(dt > 0)) dt = 0;
    if (dt > MAX_FRAME) dt = MAX_FRAME;
    this.now += dt;
    this.frames++;

    for (let sys = this.input.takeSystem(); sys; sys = this.input.takeSystem()) {
      if (sys === "pause") {
        if (this.mode === "play") this.pause();
      } else if (this.mode === "play") {
        if (sys === "rewind") panels.openTimeline(this);
        if (sys === "shift") this.onShiftKey();
      }
    }

    if (this.mode === "play") {
      this.acc += dt;
      while (this.acc >= STEP && this.mode === "play") {
        this.acc -= STEP;
        this.tick();
      }
    } else if (this.mode === "replay") {
      this.acc += dt;
      while (this.acc >= STEP && this.mode === "replay") {
        this.acc -= STEP;
        if (!this.replayer.pump()) panels.endReplay(this);
      }
      this.subject.drain(this.events);
      for (const e of this.events) this.onEvent?.(e);
      this.events.length = 0;
    }
    this.fx.update(dt);
    this.render(dt);
    requestAnimationFrame(this.frame);
  }

  /** One fixed simulation tick. */
  tick() {
    const mask = this.input.mask();
    const act = mask & IN.ACT && !(this.prevAct & IN.ACT);
    this.prevAct = mask;
    this.timeline.step(mask);
    this.subject.drain(this.events);
    for (let i = 0; i < this.events.length; i++) this.handle(this.events[i]);
    this.events.length = 0;
    if (act) this.tryInteract();
  }

  /** Test and audit hook: run n ticks with a fixed mask, synchronously. */
  stepFrames(n, mask = 0) {
    for (let i = 0; i < n && this.mode === "play"; i++) {
      this.timeline.step(mask);
      this.subject.drain(this.events);
      for (let k = 0; k < this.events.length; k++) this.handle(this.events[k]);
      this.events.length = 0;
    }
    this.render(0);
  }

  render(dt) {
    while (this.queue.length && this.queue[0].at <= this.now) this.queue.shift().run();
    const ctx = this.ctx;
    const world = this.world;
    const f = this.focus(world);
    this.camera.follow(f.x, f.y, f.face || 0, dt);
    this.drawBackdrop(ctx, this.camera, world, this.now);
    this.camera.begin(ctx);
    this.draw(ctx, world, this.now);
    if (!this.lowfx) this.fx.render(ctx);
    ctx.restore();
    this.drawOverlay?.(ctx, world, this.now);

    // Event-time DOM only: captions and toasts expire, the use-prompt follows reach.
    if (this.caption && this.now > this.caption.until) {
      this.caption = null;
      this.$("caption").hidden = true;
    }
    if (this.toastUntil && this.now > this.toastUntil) {
      this.toastUntil = 0;
      this.$("toast").hidden = true;
    }
    if (this.frames % 6 === 0) {
      const target = this.mode === "play" ? this.reach(world) : null;
      const key = target ? target.id : "";
      if (key !== this.promptKey) {
        this.promptKey = key;
        const p = this.$("prompt");
        p.hidden = !target;
        if (target)
          p.textContent = this.t("usePrompt", {
            key: keyName(this.input.keys.ACT[0]),
            what: target.what,
          });
      }
      if (this.mode === "play" && this.objective) {
        const text = this.objective(world);
        if (text !== this.objectiveText) {
          this.objectiveText = text;
          this.refreshHud();
        }
      }
    }
  }

  get storageNote() {
    return this.t(saveStatus.persistent ? "saved" : "notSaved");
  }
}

/** Register a custom element once. */
export function define(tag, ctor) {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

// The Assembly Matrix: Synthesizer & Deconstructor — Unit 6: expressions.
//
// Expressions ARE the parts of a robotic assembly line.
//  UNPACK  a composite crate a(b + c) rides into a separator that splits the
//          brackets onto two tracks; each output crate must be the outer factor
//          times its part, or that track jams and bounces.
//  PACK    two loose crates (12x and 18) ride into a packer; the student's
//          outer factor and inner terms must rebuild both crates exactly (and,
//          from level 3, use the GREATEST common factor).
//  FUSE    magnetic term pods float in a field; like pods fuse into one, unlike
//          pods deflect. Simplest form = fewest pods.
//  POWER   a press stamps base^exponent from a stack of repeated factors.
// Tier 1 projects an area model / like-term colours / partial products; Tier 2
// is hands-on: algebra tiles grouped one at a time, pods sorted into lanes,
// factor layers stacked as dot arrays.

import { EduWonderEngine, define } from "../core/engine.js";
import { ParticlePool } from "../core/particles.js";
import { SpringBank } from "../core/spring.js";
import {
  expandText,
  fieldText,
  G_MAX,
  IN_MAX,
  judgeFuse,
  judgePack,
  judgePower,
  judgeUnpack,
  makeFuse,
  makePack,
  makePower,
  makeUnpack,
  modeFor,
  OUT_MAX,
  PODS_MAX,
  packTerms,
  powerText,
  T1_MAX,
  T2_MAX,
  termText,
  unpackText,
} from "./math.js";
import { GX0, GX1, GY0, GY1, renderMachine, S_GHOST, S_GLOW, S_L1, S_L2, S_P1, S_P2, S_POD, S_PRESS, S_SHAKE } from "./render.js";
import { STRINGS } from "./strings.js";

const KIND_INDEX = { x: 0, y: 1, 1: 2 };
const READY = 0;
const LOCKED = 1;
const JAMMED = 2;

class AssemblyMatrix extends EduWonderEngine {
  static meta = {
    gameId: "u6-assembly-matrix",
    unit: 6,
    lessons: ["6-3", "6-4", "6-5", "6-6", "6-8", "6-14", "6-15"],
    checkId: "run",
  };

  static strings = STRINGS;

  initWorld() {
    this.springs = new SpringBank(S_GHOST + 1);
    this.particles = new ParticlePool(240, ["#ffd166", "#46c2b8", "#7bdc8f", "#ff6b6b", "#9aa6b8"]);
    if (this.reducedMotion) {
      this.particles.scale = 0;
      this.springs.omega = 40;
    }
    this.st = new Float64Array(6);
    this.mode = "unpack";
    this.round = null;
    this.runState = READY;
    this.roundLevel = 1;
    this.startText = "";
    this.tick = 0;
    // Fuse field.
    this.podCount = 0;
    this.podKind = new Int8Array(PODS_MAX);
    this.podCoef = new Int32Array(PODS_MAX);
    this.alive = new Uint8Array(PODS_MAX);
    this.sel = new Uint8Array(PODS_MAX);
    this.sorted = new Uint8Array(PODS_MAX);
    this.podLabels = new Array(PODS_MAX).fill("");
    this.ghostOn = false;
    // Hands-on counters.
    this.grouped = 0;
    this.tileTotal = 0;
    this.gVal = 1;
    this.tileRow = 1;
    this.stacked = 0;
    this.dotCols = 0;
    this.dotRows = 0;
    this.dotCell = 0;
    this.partials = new Array(6).fill("");
    this.partialN = 0;
    this.labels = {
      plate: "",
      outer: "",
      inner: "",
      k1: "",
      k2: "",
      t1: "",
      t2: "",
      packed: "",
      g: "",
      in1: "",
      in2: "",
      tiles: "",
      out: "",
      base: "",
      ghost: "",
      areaB: "",
      areaC: "",
    };
  }

  buildControls() {
    const moved = () => {
      this.disengage();
      this.sync(false);
    };
    this.t1 = this.slider({
      id: "t1",
      label: "t1",
      min: 0,
      max: T1_MAX,
      value: 0,
      format: (v) => this.crateText(v, true),
      onInput: moved,
    });
    this.t2 = this.slider({
      id: "t2",
      label: "t2",
      min: 0,
      max: T2_MAX,
      value: 0,
      format: (v) => this.crateText(v, false),
      onInput: moved,
    });
    this.g = this.slider({
      id: "outer",
      label: "outer",
      min: 1,
      max: G_MAX,
      value: 1,
      onInput: () => {
        this.grouped = 0;
        moved();
      },
    });
    this.i1 = this.slider({
      id: "in1",
      label: "in1",
      min: 0,
      max: IN_MAX,
      value: 0,
      format: (v) => this.crateText(v, true),
      onInput: moved,
    });
    this.i2 = this.slider({
      id: "in2",
      label: "in2",
      min: 0,
      max: IN_MAX,
      value: 0,
      onInput: moved,
    });
    this.out = this.slider({
      id: "out",
      label: "out",
      min: 0,
      max: OUT_MAX,
      value: 0,
      onInput: moved,
    });

    const deck = this.$("deck");
    this.podRow = document.createElement("div");
    this.podRow.className = "actions";
    deck.append(this.podRow);
    this.podButtons = [];
    for (let i = 0; i < PODS_MAX; i++) {
      const b = this.button({
        id: `pod-${i}`,
        label: "podName",
        parent: this.podRow,
        onPress: () => this.togglePod(i),
      });
      b.setAttribute("aria-pressed", "false");
      this.podButtons.push(b);
    }
    this.binders.push(() => {
      for (let i = 0; i < PODS_MAX; i++)
        this.podButtons[i].textContent = this.t("podName", { term: this.podTerm(i) });
    });
    this.handsOn = this.button({
      id: "group",
      label: "groupTile",
      onPress: () => this.handsOnStep(),
    });
    this.fuseBtn = this.button({ id: "fuse", label: "fuse", onPress: () => this.fuseSelected() });
    this.runBtn = this.button({
      id: "run",
      label: "runUnpack",
      primary: true,
      onPress: () => this.tryRun(),
    });
    this.binders.push(() => {
      const m = this.mode;
      this.runBtn.textContent = this.t(
        m === "unpack"
          ? "runUnpack"
          : m === "pack"
            ? "runPack"
            : m === "fuse"
              ? "runFuse"
              : "runPower",
      );
      this.handsOn.textContent = this.t(
        m === "fuse" ? "sortPod" : m === "power" ? "stackFactor" : "groupTile",
      );
    });
  }

  /** Crate label: "8x" on an x track, "8" on a constant track. */
  crateText(v, xTrack) {
    const r = this.round;
    const hasX =
      r && ((this.mode === "unpack" && !r.numeric) || (this.mode === "pack" && !r.numeric));
    return xTrack && hasX ? termText("x", v) : String(v);
  }

  podTerm(i) {
    return i < this.podCount ? termText(["x", "y", "1"][this.podKind[i]], this.podCoef[i]) : "";
  }

  newRound(level, next) {
    this.mode = modeFor(this.roundIndex);
    this.roundLevel = level;
    const m = this.mode;
    if (m === "unpack") this.round = makeUnpack(level, next);
    else if (m === "pack") this.round = makePack(level, next);
    else if (m === "fuse") this.round = makeFuse(level, next);
    else this.round = makePower(level, next);
    this.t1.wrap.hidden = m !== "unpack";
    this.t2.wrap.hidden = m !== "unpack";
    for (const s of [this.g, this.i1, this.i2]) s.wrap.hidden = m !== "pack";
    this.out.wrap.hidden = m !== "power";
    this.fuseBtn.hidden = m !== "fuse";
    // Park every dial away from the answer (all answers are at least 2).
    this.t1.set(0);
    this.t2.set(0);
    this.g.set(1);
    this.i1.set(0);
    this.i2.set(0);
    this.out.set(0);
    this.grouped = 0;
    this.stacked = 0;
    this.particles.clear();
    const r = this.round;
    if (m === "unpack") {
      this.tileRow = r.p + r.c;
      this.tileTotal = r.a * this.tileRow;
    } else if (m === "pack") this.tileTotal = r.A + r.B;
    else this.tileTotal = 0;
    this.podCount = 0;
    if (m === "fuse") {
      this.podCount = r.pods.length;
      for (let i = 0; i < PODS_MAX; i++) {
        const live = i < this.podCount;
        this.alive[i] = live ? 1 : 0;
        this.sel[i] = 0;
        this.sorted[i] = 0;
        if (live) {
          this.podKind[i] = KIND_INDEX[r.pods[i].kind];
          this.podCoef[i] = r.pods[i].coef;
        }
      }
      this.startText = fieldText(r.pods);
      this.layoutPods(true);
    }
    for (let i = 0; i < PODS_MAX; i++) {
      this.podButtons[i].hidden = !(m === "fuse" && this.alive[i]);
      this.podButtons[i].setAttribute("aria-pressed", "false");
    }
    this.ghostOn = false;
    this.springs.snap(S_GLOW, 0);
    this.disengage();
    this.onTier(this.tier);
  }

  /** Pod targets: unsorted pods in the field grid, sorted pods in their kind's lane. */
  layoutPods(snap) {
    const cols = this.tier >= 2 ? 2 : 3;
    let field = 0;
    const lane = [0, 0, 0];
    for (let i = 0; i < this.podCount; i++) {
      if (!this.alive[i]) continue;
      let x;
      let y;
      if (this.sorted[i]) {
        const k = this.podKind[i];
        x = 420 + lane[k]++ * 106;
        y = 200 + k * 100;
      } else {
        x = 110 + (field % cols) * 140;
        y = 190 + ((field / cols) | 0) * 80;
        field++;
      }
      if (snap) {
        this.springs.snap(S_POD + 2 * i, x);
        this.springs.snap(S_POD + 2 * i + 1, y);
      } else {
        this.springs.setTarget(S_POD + 2 * i, x);
        this.springs.setTarget(S_POD + 2 * i + 1, y);
      }
    }
  }

  onTier(n) {
    this.handsOn.hidden = n < 2;
    if (this.mode === "fuse") this.layoutPods(false);
  }

  disengage() {
    this.runState = READY;
    for (const s of [S_P1, S_P2, S_L1, S_L2, S_PRESS]) this.springs.setTarget(s, 0);
  }

  // ---------- hands-on (Tier 2) ----------
  handsOnStep() {
    if (this.solved) return;
    const m = this.mode;
    if (m === "fuse") {
      let i = 0;
      while (i < this.podCount && (!this.alive[i] || this.sorted[i])) i++;
      if (i >= this.podCount) return this.note(this.t("sorted"));
      this.sorted[i] = 1;
      this.layoutPods(false);
      this.synth.lock();
    } else if (m === "power") {
      if (this.stacked >= this.round.e) return;
      this.stacked++;
      this.layoutDots();
      this.synth.impact(0.4);
    } else {
      if (this.grouped >= this.tileTotal) return this.note(this.t("tilesDone"));
      this.grouped++;
      this.synth.lock();
    }
    this.sync(false);
    this.say(
      m === "pack" ? this.labels.tiles : m === "unpack" ? this.labels.tiles : this.describe(),
    );
  }

  /** Dot array for base^stacked: base^ceil(s/2) columns by base^floor(s/2) rows. */
  layoutDots() {
    const b = this.round.b;
    const s = this.stacked;
    this.dotCols = s === 0 ? 0 : b ** Math.ceil(s / 2);
    this.dotRows = s === 0 ? 0 : b ** Math.floor(s / 2);
    this.dotCell =
      s === 0
        ? 0
        : Math.max(4, Math.min(22, Math.floor(Math.min(270 / this.dotCols, 200 / this.dotRows))));
  }

  note(text) {
    this.setFeedback(text);
    this.say(text);
  }

  // ---------- fuse field ----------
  togglePod(i) {
    if (this.solved || this.mode !== "fuse" || !this.alive[i]) return;
    this.sel[i] = this.sel[i] ? 0 : 1;
    this.podButtons[i].setAttribute("aria-pressed", String(!!this.sel[i]));
    this.springs.impulse(S_POD + 2 * i + 1, -120);
    this.sync(false);
  }

  clearSelection() {
    for (let i = 0; i < PODS_MAX; i++) {
      this.sel[i] = 0;
      this.podButtons[i].setAttribute("aria-pressed", "false");
    }
  }

  fuseSelected() {
    if (this.solved || this.mode !== "fuse") return;
    const picked = [];
    for (let i = 0; i < this.podCount; i++) if (this.alive[i] && this.sel[i]) picked.push(i);
    if (picked.length !== 2) return this.note(this.t("pickTwo"));
    const [i, j] = picked;
    const a = this.podTerm(i);
    const b = this.podTerm(j);
    this.clearSelection();
    const xi = S_POD + 2 * i;
    const xj = S_POD + 2 * j;
    if (this.podKind[i] !== this.podKind[j]) {
      // Unlike terms: magnetic repulsion, kinetic bounce.
      const dir = this.springs.pos[xj] >= this.springs.pos[xi] ? 1 : -1;
      this.springs.impulse(xi, -520 * dir);
      this.springs.impulse(xj, 520 * dir);
      this.springs.impulse(S_SHAKE, 140);
      this.synth.strain();
      this.particles.emit(this.springs.pos[xj], this.springs.pos[xj + 1], 14, 220, 3);
      if (!this.misconceptions.includes("combine-unlike"))
        this.misconceptions.push("combine-unlike");
      this.sync(false);
      return this.note(this.t("unlike", { a, b }));
    }
    // Like terms: pod j flies into pod i and the two become one.
    const st = this.st;
    st[GX0] = this.springs.pos[xj];
    st[GY0] = this.springs.pos[xj + 1];
    st[GX1] = this.springs.pos[xi];
    st[GY1] = this.springs.pos[xi + 1];
    this.labels.ghost = b;
    this.ghostOn = true;
    this.springs.snap(S_GHOST, 0);
    this.springs.setTarget(S_GHOST, 1);
    this.podCoef[i] += this.podCoef[j];
    this.alive[j] = 0;
    this.podButtons[j].hidden = true;
    this.springs.impulse(xi + 1, 260);
    this.particles.emit(st[GX1] | 0, st[GY1] | 0, 18, 200, 0);
    this.synth.impact(0.9);
    this.synth.lock();
    this.layoutPods(false);
    this.sync(false);
    this.note(this.t("fused", { a, b, c: this.podTerm(i) }));
    // Keep keyboard focus in the field when the fused-away pod was focused.
    if (this.shadowRoot.activeElement === this.podButtons[j]) this.podButtons[i].focus();
  }

  // ---------- run / judge ----------
  tryRun() {
    if (this.solved) return;
    if (
      this.tier === 2 &&
      (this.mode === "unpack" || this.mode === "pack") &&
      this.grouped < this.tileTotal
    ) {
      return this.note(this.t("groupFirst"));
    }
    this.check();
  }

  evaluate() {
    const r = this.round;
    const m = this.mode;
    if (m === "unpack") {
      const k1 = Number(this.t1.input.value);
      const k2 = Number(this.t2.input.value);
      const ok1 = k1 === r.t1;
      const ok2 = k2 === r.t2;
      this.runTracks(ok1, ok2, 1);
      const v = judgeUnpack(r, k1, k2);
      if (v === "ok")
        return {
          ok: true,
          key: "solvedUnpack",
          vars: { expr: unpackText(r), result: `${this.crateText(r.t1, true)} + ${r.t2}` },
        };
      const tag = v === "firstOnly" ? "distribute-first-only" : "distribute-error";
      return { ok: false, key: v, misconception: tag };
    }
    if (m === "pack") {
      const g = Number(this.g.input.value);
      const i1 = Number(this.i1.input.value);
      const i2 = Number(this.i2.input.value);
      const v = judgePack(r, this.roundLevel, g, i1, i2);
      const [t1, t2] = packTerms(r);
      this.runTracks(
        v === "ok" || v === "bigger" || g * i1 === r.A,
        v === "ok" || v === "bigger" || g * i2 === r.B,
        0.82,
      );
      if (v === "ok")
        return { ok: true, key: "solvedPack", vars: { t1, t2, packed: this.packedText() } };
      const keys = { t1High: "p1High", t1Low: "p1Low", t2High: "p2High", t2Low: "p2Low" };
      const tags = {
        needFactor: "no-common-factor",
        oneTerm: "factor-one-term",
        bigger: "gcf-not-greatest",
      };
      return { ok: false, key: keys[v] || v, misconception: tags[v] || "factor-mismatch" };
    }
    if (m === "fuse") {
      this.clearSelection();
      const kinds = [];
      for (let i = 0; i < this.podCount; i++) if (this.alive[i]) kinds.push(this.podKind[i]);
      const v = judgeFuse(kinds);
      this.runState = v === "ok" ? LOCKED : JAMMED;
      if (v === "ok")
        return {
          ok: true,
          key: "solvedFuse",
          vars: { start: this.startText, result: this.liveField() },
        };
      this.springs.impulse(S_SHAKE, 160);
      return { ok: false, key: "likeRemain", misconception: "like-terms-left" };
    }
    const val = Number(this.out.input.value);
    const v = judgePower(r, val);
    this.springs.setTarget(S_PRESS, v === "ok" ? 1 : 0);
    if (v !== "ok") this.springs.impulse(S_PRESS, 9);
    this.runState = v === "ok" ? LOCKED : JAMMED;
    if (v === "ok")
      return {
        ok: true,
        key: "solvedPower",
        vars: { pow: powerText(r), expand: expandText(r), v: r.value },
      };
    const tags = {
      timesExp: "base-times-exponent",
      addExp: "base-plus-exponent",
      high: "power-too-high",
      low: "power-too-low",
    };
    return { ok: false, key: v, misconception: tags[v] };
  }

  /** Send both crates down their tracks; a wrong crate jams short and bounces. */
  runTracks(ok1, ok2, end) {
    this.springs.setTarget(S_P1, ok1 ? end : end * 0.7);
    this.springs.setTarget(S_P2, ok2 ? end : end * 0.7);
    this.springs.setTarget(S_L1, ok1 ? 1 : 0);
    this.springs.setTarget(S_L2, ok2 ? 1 : 0);
    if (!ok1) this.springs.impulse(S_P1, -2.5);
    if (!ok2) this.springs.impulse(S_P2, -2.5);
    if (ok1 || ok2) this.synth.lock();
    this.runState = ok1 && ok2 ? LOCKED : JAMMED;
  }

  liveField() {
    const parts = [];
    for (let i = 0; i < this.podCount; i++) if (this.alive[i]) parts.push(this.podTerm(i));
    return parts.join(" + ");
  }

  packedText() {
    return `${this.g.input.value}(${this.crateText(Number(this.i1.input.value), true)} + ${this.i2.input.value})`;
  }

  onSolved() {
    this.springs.setTarget(S_GLOW, 1);
    this.particles.emit(480, 250, 44, 280, 2, -Math.PI / 2, Math.PI * 1.6, 1.1);
  }

  onMiss() {
    this.springs.impulse(S_SHAKE, 120);
    this.particles.emit(480, 250, 16, 200, 3);
  }

  updatePhysics(dt) {
    this.springs.step(dt);
    this.particles.update(dt);
    this.tick = this.tick >= 1903 ? 0 : this.tick + 1;
  }

  refreshLabels() {
    const r = this.round;
    if (!r) return;
    const L = this.labels;
    const m = this.mode;
    if (m === "unpack") {
      L.plate = this.t("plateIn", { expr: unpackText(r) });
      L.outer = String(r.a);
      L.areaB = r.numeric ? String(r.p) : termText("x", r.p);
      L.areaC = String(r.c);
      L.inner = `${L.areaB} + ${r.c}`;
      L.k1 = this.crateText(Number(this.t1.input.value), true);
      L.k2 = this.t2.input.value;
      L.tiles = this.t("tilesCount", { n: this.grouped, t: this.tileTotal });
    } else if (m === "pack") {
      const [t1, t2] = packTerms(r);
      L.t1 = t1;
      L.t2 = t2;
      L.plate = this.t("plateIn", { expr: `${t1} + ${t2}` });
      L.packed = this.packedText();
      L.g = this.g.input.value;
      this.gVal = Number(this.g.input.value);
      L.in1 = this.crateText(Number(this.i1.input.value), true);
      L.in2 = this.i2.input.value;
      L.tiles = this.t("dealt", { n: this.grouped, t: this.tileTotal, g: this.g.input.value });
    } else if (m === "fuse") {
      L.plate = this.t("plateField", { expr: this.liveField() });
      for (let i = 0; i < PODS_MAX; i++) this.podLabels[i] = this.podTerm(i);
    } else {
      L.plate = this.t("platePow", { pow: powerText(r), expand: expandText(r) });
      L.out = this.t("plateOut", { v: this.out.input.value });
      L.base = String(r.b);
      // Tier 1 partial products stop one factor short of the answer.
      this.partialN = 0;
      let acc = r.b;
      for (let k = 2; k < r.e && this.partialN < this.partials.length; k++) {
        this.partials[this.partialN++] = `${acc} × ${r.b} = ${acc * r.b}`;
        acc *= r.b;
      }
      this.layoutDots();
    }
  }

  describe() {
    const r = this.round;
    if (!r) return "";
    const state = this.t(
      this.runState === LOCKED
        ? "stateLocked"
        : this.runState === JAMMED
          ? "stateJammed"
          : "stateReady",
    );
    const m = this.mode;
    if (m === "unpack")
      return this.t("descUnpack", {
        expr: unpackText(r),
        k1: this.crateText(Number(this.t1.input.value), true),
        k2: this.t2.input.value,
        state,
      });
    if (m === "pack") {
      const [t1, t2] = packTerms(r);
      return this.t("descPack", {
        t1,
        t2,
        g: this.g.input.value,
        i1: this.crateText(Number(this.i1.input.value), true),
        i2: this.i2.input.value,
        state,
      });
    }
    if (m === "fuse") {
      const sel = [];
      for (let i = 0; i < this.podCount; i++)
        if (this.alive[i] && this.sel[i]) sel.push(this.podTerm(i));
      return this.t("descFuse", {
        expr: this.liveField(),
        sel: sel.length ? sel.join(` ${this.t("and")} `) : this.t("none"),
      });
    }
    return this.t("descPower", {
      pow: powerText(r),
      expand: expandText(r),
      v: this.out.input.value,
      state,
    });
  }

  mission() {
    const r = this.round;
    const m = this.mode;
    if (m === "unpack") return this.t("missionUnpack", { expr: unpackText(r) });
    if (m === "pack") {
      const [t1, t2] = packTerms(r);
      return this.t(this.roundLevel >= 3 ? "missionPackGcf" : "missionPack", { t1, t2 });
    }
    if (m === "fuse") return this.t("missionFuse", { expr: this.startText });
    return this.t("missionPower", { pow: powerText(r) });
  }

  testPlan() {
    const r = this.round;
    const m = this.mode;
    const run = { control: "run", key: "Enter" };
    if (m === "unpack") {
      return [
        { control: "t1", key: "Home" },
        { control: "t1", key: "ArrowRight", times: r.t1 },
        { control: "t2", key: "Home" },
        { control: "t2", key: "ArrowRight", times: r.t2 },
        run,
      ];
    }
    if (m === "pack") {
      return [
        { control: "outer", key: "Home" },
        { control: "outer", key: "ArrowRight", times: r.G - 1 },
        { control: "in1", key: "Home" },
        { control: "in1", key: "ArrowRight", times: r.m },
        { control: "in2", key: "Home" },
        { control: "in2", key: "ArrowRight", times: r.n },
        run,
      ];
    }
    if (m === "fuse") {
      const plan = [];
      const first = [-1, -1, -1];
      for (let i = 0; i < this.podCount; i++) {
        if (!this.alive[i]) continue;
        const k = this.podKind[i];
        if (first[k] < 0) first[k] = i;
        else {
          plan.push(
            { control: `pod-${first[k]}`, key: "Enter" },
            { control: `pod-${i}`, key: "Enter" },
            { control: "fuse", key: "Enter" },
          );
        }
      }
      plan.push(run);
      return plan;
    }
    return [
      { control: "out", key: "Home" },
      { control: "out", key: "ArrowRight", times: r.value },
      run,
    ];
  }

  renderScene(ctx) {
    this.backdrop(ctx);
    if (this.round) renderMachine(this, ctx);
    this.particles.render(ctx);
  }
}

define("ew-assembly-matrix", AssemblyMatrix);

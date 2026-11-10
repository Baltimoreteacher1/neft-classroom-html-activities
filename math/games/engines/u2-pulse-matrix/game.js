// Gravitational Wave Collector: The Pulse Matrix — Unit 2: Statistics.
//
// The data set IS the apparatus. Cosmic particles fall down chutes and stack as
// a dot plot on a shelf (values 0..12).
//  - BALANCE: the shelf rests on a fulcrum wedge. Its tilt is the real torque,
//    Σ(x − f): the shelf only levels when the fulcrum sits at the mean.
//  - TENSION: the fulcrum is locked at the mean; an elastic band ties every
//    particle to it. Set the MAD dial to the average band length.
//  - CLAMP: three clamps (Q1, median, Q3) squeeze the stack into a box plot.
// Rendering lives in render.js; this file owns state, controls and judging.

import { define, EduWonderEngine } from "../core/engine.js";
import { staticLayer } from "../core/draw.js";
import { ParticlePool } from "../core/particles.js";
import { SpringBank } from "../core/spring.js";
import {
  CLAMP_PARK,
  judgeBalance,
  judgeClamp,
  judgeTension,
  MAX_N,
  makeRound,
  modeForRound,
  numText,
  parkFulcrum,
  quartiles,
  sumOf,
} from "./math.js";
import * as R from "./render.js";
import { STRINGS } from "./strings.js";

const TILT_GAIN = 0.012;
const TILT_MAX = 0.09;
const MAX_STRETCH = 66;

class PulseMatrix extends EduWonderEngine {
  static meta = {
    gameId: "u2-pulse-matrix",
    unit: 2,
    lessons: ["2-1", "2-2", "2-3", "2-4", "2-5", "2-8", "2-9", "2-10"],
    checkId: "check",
  };

  static strings = STRINGS;

  initWorld() {
    this.springs = new SpringBank(R.SPRINGS);
    this.particles = new ParticlePool(260, R.PALETTE);
    if (this.reducedMotion) {
      this.particles.scale = 0;
      this.springs.omega = 40;
    }
    this.mode = "balance";
    this.round = null;
    this.n = 0;
    this.mean = 0;
    this.work = new Int8Array(MAX_N);
    this.stack = new Int8Array(MAX_N);
    this.bead = new Int8Array(MAX_N); // tier-2 counting state per sorted bead
    this.countStep = 0;
    this.stacked = 0; // tier-2 tension: bands moved into the sum bar
    this.locked = false;
    this.labels = {
      pullL: "",
      pullR: "",
      mean: "",
      share: "",
      dev: new Array(MAX_N).fill(""),
    };
    this.layers = {
      chutes: staticLayer(R.W, R.H, R.paintChutes),
      gauge: staticLayer(R.W, R.H, R.paintGauge),
      sumRuler: staticLayer(R.W, R.H, R.paintSumRuler),
    };
  }

  buildControls() {
    const fmt = (v) => numText(v);
    this.fulcrum = this.slider({
      id: "fulcrum",
      label: "fulcrum",
      min: 0,
      max: 12,
      step: 0.5,
      value: 0,
      format: fmt,
      onInput: (v) => this.moveFulcrum(v),
    });
    this.dial = this.slider({
      id: "mad",
      label: "madDial",
      min: 0,
      max: 6,
      step: 0.25,
      value: 0,
      format: fmt,
      onInput: (v) => {
        this.springs.setTarget(R.S_DIAL, v);
        this.sync();
      },
    });
    const clamp = (id, label, spring) =>
      this.slider({
        id,
        label,
        min: 0,
        max: 12,
        step: 0.5,
        value: 0,
        format: fmt,
        onInput: (v) => {
          this.springs.setTarget(spring, v);
          this.sync();
        },
      });
    this.q1 = clamp("q1", "q1Clamp", R.S_Q1);
    this.med = clamp("median", "medClamp", R.S_MED);
    this.q3 = clamp("q3", "q3Clamp", R.S_Q3);
    this.levelBtn = this.button({
      id: "level-pair",
      label: "levelPair",
      onPress: () => this.levelPair(),
    });
    this.restoreBtn = this.button({
      id: "restore",
      label: "restore",
      onPress: () => this.restore(),
    });
    this.stackBtn = this.button({
      id: "stack-band",
      label: "stackBand",
      onPress: () => this.stackBand(),
    });
    this.countBtn = this.button({
      id: "count-ends",
      label: "countEnds",
      onPress: () => this.countEnds(),
    });
    this.checkBtn = this.button({
      id: "check",
      label: "lockFulcrum",
      primary: true,
      onPress: () => this.check(),
    });
    this.binders.push(() => {
      const key =
        this.mode === "balance" ? "lockFulcrum" : this.mode === "tension" ? "checkMad" : "clampIt";
      this.checkBtn.textContent = this.t(key);
    });
  }

  newRound(level, next) {
    this.mode = modeForRound(this.roundIndex);
    const r = makeRound(this.mode, level, next);
    this.round = r;
    this.n = r.n;
    this.mean = sumOf(r.values) / r.n;
    this.locked = false;
    this.particles.clear();
    this.fulcrum.wrap.hidden = this.mode !== "balance";
    this.dial.wrap.hidden = this.mode !== "tension";
    for (const s of [this.q1, this.med, this.q3]) s.wrap.hidden = this.mode !== "clamp";
    const sp = this.springs;
    sp.snap(R.S_BOX, 0);
    sp.snap(R.S_SUM, 0);
    sp.snap(R.S_TILT, 0);
    if (this.mode === "balance") {
      const park = parkFulcrum(r.mean);
      this.fulcrum.set(park);
      sp.snap(R.S_FULC, park);
    } else {
      sp.snap(R.S_FULC, this.mode === "tension" ? r.mean : 6);
    }
    this.dial.set(0);
    sp.snap(R.S_DIAL, 0);
    this.q1.set(CLAMP_PARK.q1);
    this.med.set(CLAMP_PARK.med);
    this.q3.set(CLAMP_PARK.q3);
    sp.snap(R.S_Q1, CLAMP_PARK.q1);
    sp.snap(R.S_MED, CLAMP_PARK.med);
    sp.snap(R.S_Q3, CLAMP_PARK.q3);
    this.restore(true);
    // Particles fall down their chutes in a cascade.
    for (let i = 0; i < MAX_N; i++) {
      sp.snap(R.S_DROP + i, i < this.n ? -260 - i * 34 : 0);
      sp.setTarget(R.S_DROP + i, 0);
    }
    sp.snap(R.S_GAUGE, 0);
    sp.setTarget(R.S_GAUGE, this.mode === "tension" ? r.stretch / MAX_STRETCH : 0);
    this.onTier(this.tier);
  }

  /** Reset the working copy of the data (tier-2 leveling and counting undo). */
  restore(silent = false) {
    const r = this.round;
    for (let i = 0; i < MAX_N; i++) {
      this.work[i] = i < this.n ? r.values[i] : 0;
      this.springs.snap(R.S_DX + i, this.work[i]);
      this.bead[i] = 0;
    }
    this.countStep = 0;
    this.stacked = 0;
    this.springs.setTarget(R.S_SUM, 0);
    this.restack(true);
    this.updateTilt();
    if (!silent) this.sync();
  }

  /** Stack heights per value, from the working data. Event time only. */
  restack(snap) {
    for (let i = 0; i < this.n; i++) {
      let k = 0;
      for (let j = 0; j < i; j++) if (this.work[j] === this.work[i]) k++;
      this.stack[i] = k;
      if (snap) this.springs.snap(R.S_DK + i, k);
      else this.springs.setTarget(R.S_DK + i, k);
    }
  }

  onTier(n) {
    const m = this.mode;
    this.levelBtn.hidden = m !== "balance" || n < 2;
    this.restoreBtn.hidden = m !== "balance" || n < 2;
    this.stackBtn.hidden = m !== "tension" || n < 2;
    this.countBtn.hidden = m !== "clamp" || n < 2;
  }

  fulcrumValue() {
    return this.mode === "balance"
      ? Number(this.fulcrum.input.value)
      : this.mode === "tension"
        ? this.mean
        : 6;
  }

  torque() {
    return this.mode === "balance" ? sumOf(this.round.values) - this.fulcrumValue() * this.n : 0;
  }

  updateTilt() {
    const t = this.torque() * TILT_GAIN;
    this.springs.setTarget(R.S_TILT, t > TILT_MAX ? TILT_MAX : t < -TILT_MAX ? -TILT_MAX : t);
  }

  moveFulcrum(v) {
    this.springs.setTarget(R.S_FULC, v);
    this.updateTilt();
    const t = this.torque();
    if (Math.abs(t) < 1e-9) this.synth.lock();
    // Sparks grind off the low end of a tilted shelf.
    else this.particles.emit(t > 0 ? R.AX1 : R.AX0, R.PIV_Y + 40, 6, 110, 0, -Math.PI / 2, 1.2, 0.6);
    this.sync();
  }

  /** Tier 2 (balance): move the highest particle down one and the lowest up one. The sum, so the balance point, never changes. */
  levelPair() {
    if (this.solved) return;
    let hi = 0;
    let lo = 0;
    for (let i = 1; i < this.n; i++) {
      if (this.work[i] > this.work[hi]) hi = i;
      if (this.work[i] < this.work[lo]) lo = i;
    }
    if (this.work[hi] - this.work[lo] <= 1) {
      this.setFeedback(this.t("levelDone"));
      this.say(this.t("levelDone"));
      return;
    }
    this.work[hi]--;
    this.work[lo]++;
    this.springs.setTarget(R.S_DX + hi, this.work[hi]);
    this.springs.setTarget(R.S_DX + lo, this.work[lo]);
    this.restack(false);
    this.synth.impact(0.3);
    this.sync();
  }

  /** Tier 2 (tension): move the next band's length into the sum bar. */
  stackBand() {
    if (this.solved || this.stacked >= this.n) return;
    this.stacked++;
    let s = 0;
    for (let i = 0; i < this.stacked; i++) s += Math.abs(this.work[i] - this.mean);
    this.springs.setTarget(R.S_SUM, s);
    this.synth.impact(0.2);
    this.sync();
  }

  /** Tier 2 (clamp): cross off one particle from each end of the sorted strip. */
  countEnds() {
    if (this.solved) return;
    const n = this.n;
    const hA = (n - 1) >> 1;
    const h = n >> 1;
    const hB = (h - 1) >> 1;
    if (this.countStep >= hA + hB) {
      this.say(this.t("countDone"));
      return;
    }
    this.countStep++;
    const s = this.countStep;
    const a = s < hA ? s : hA;
    const t = s > hA ? s - hA : 0;
    for (let i = 0; i < n; i++) {
      let state = i < a || i >= n - a ? 1 : 0;
      if (s >= hA && state === 0) state = 2;
      if (t > 0) {
        const lowIdx = i < h ? i : i >= n - h ? i - (n - h) : -1;
        if (lowIdx >= 0) state = lowIdx < t || lowIdx >= h - t ? 1 : t === hB ? 3 : 0;
      }
      this.bead[i] = state;
    }
    this.synth.tick();
    this.say(
      this.t(s === hA ? "countMiddle" : s === hA + hB ? "countQuartiles" : "countStep", { k: s }),
    );
    this.sync(false);
  }

  evaluate() {
    const r = this.round;
    if (this.mode === "balance") {
      const f = Number(this.fulcrum.input.value);
      const v = judgeBalance(r, f);
      if (v === "ok") return { ok: true, key: "solvedBalance", vars: { m: numText(r.mean) } };
      if (v === "median")
        return { ok: false, key: "medianTrap", misconception: "median-as-balance" };
      return {
        ok: false,
        key: v === "low" ? "balanceLow" : "balanceHigh",
        misconception: "balance-point",
      };
    }
    if (this.mode === "tension") {
      const d = Number(this.dial.input.value);
      for (let i = 0; i < this.n; i++) this.springs.impulse(R.S_BAND + i, i % 2 ? 60 : -60);
      const v = judgeTension(r, d);
      if (v === "ok") return { ok: true, key: "solvedTension", vars: { mad: numText(r.mad) } };
      if (v === "sum") return { ok: false, key: "madSum", misconception: "mad-total-not-average" };
      return { ok: false, key: v === "high" ? "madHigh" : "madLow", misconception: "mad-value" };
    }
    const j = judgeClamp(
      r,
      Number(this.q1.input.value),
      Number(this.med.input.value),
      Number(this.q3.input.value),
    );
    if (j.verdict === "ok") {
      const q = quartiles(r.values);
      return {
        ok: true,
        key: "solvedClamp",
        vars: {
          q1: numText(q.q1),
          med: numText(q.med),
          q3: numText(q.q3),
          iqr: numText(q.q3 - q.q1),
        },
      };
    }
    if (j.included)
      return { ok: false, key: "includeMedian", misconception: "quartile-includes-median" };
    const tag = j.verdict.startsWith("med") ? "median-position" : "quartile-halves";
    return { ok: false, key: j.verdict, misconception: tag };
  }

  onMiss(r) {
    const x = r.key === "balanceLow" || r.key === "medianTrap" ? R.AX1 : R.AX0;
    this.particles.emit(x, R.PIV_Y - 20, 24, 220, 3);
  }

  onSolved() {
    this.locked = true;
    this.springs.setTarget(R.S_BOX, 1);
    this.synth.lock();
    this.particles.emit(R.W / 2, R.PIV_Y - 80, 50, 280, 2, -Math.PI / 2, Math.PI * 1.6, 1.1);
  }

  updatePhysics(dt) {
    this.springs.step(dt);
    this.particles.update(dt);
  }

  refreshLabels() {
    const L = this.labels;
    if (!this.round) return;
    const f = this.fulcrumValue();
    let left = 0;
    let right = 0;
    for (let i = 0; i < this.n; i++) {
      const d = this.work[i] - f;
      if (d < 0) left -= d;
      else right += d;
      L.dev[i] = String(Math.abs(this.work[i] - this.mean));
    }
    L.pullL = this.t("pullLeft", { t: numText(left) });
    L.pullR = this.t("pullRight", { t: numText(right) });
    L.mean = this.t("meanTag", { m: numText(this.mean) });
    L.share = this.t("shareN", { n: this.n });
  }

  dataText() {
    const parts = [];
    for (let i = 0; i < this.n; i++) parts.push(this.work[i]);
    return parts.join(", ");
  }

  describe() {
    if (!this.round) return "";
    const data = this.dataText();
    if (this.mode === "balance") {
      const a = this.springs.target[R.S_TILT];
      const tilt =
        Math.abs(a) < 1e-9 ? this.t("levelShelf") : a > 0 ? this.t("tipRight") : this.t("tipLeft");
      return this.t("descBalance", { n: this.n, data, f: numText(this.fulcrumValue()), tilt });
    }
    if (this.mode === "tension")
      return this.t("descTension", {
        n: this.n,
        data,
        m: numText(this.mean),
        d: this.dial.input.value,
      });
    return this.t("descClamp", {
      n: this.n,
      data,
      q1: this.q1.input.value,
      med: this.med.input.value,
      q3: this.q3.input.value,
    });
  }

  mission() {
    if (this.mode === "balance") return this.t("missionBalance");
    if (this.mode === "tension") return this.t("missionTension", { m: numText(this.mean) });
    return this.t("missionClamp", { n: this.n });
  }

  testPlan() {
    const r = this.round;
    if (this.mode === "balance")
      return [
        { control: "fulcrum", key: "Home" },
        { control: "fulcrum", key: "ArrowRight", times: r.mean * 2 },
        { control: "check", key: "Enter" },
      ];
    if (this.mode === "tension")
      return [
        { control: "mad", key: "Home" },
        { control: "mad", key: "ArrowRight", times: r.mad * 4 },
        { control: "check", key: "Enter" },
      ];
    return [
      { control: "q1", key: "Home" },
      { control: "q1", key: "ArrowRight", times: r.q1 * 2 },
      { control: "median", key: "Home" },
      { control: "median", key: "ArrowRight", times: r.med * 2 },
      { control: "q3", key: "Home" },
      { control: "q3", key: "ArrowRight", times: r.q3 * 2 },
      { control: "check", key: "Enter" },
    ];
  }

  renderScene(ctx) {
    R.renderScene(this, ctx);
  }
}

define("ew-pulse-matrix", PulseMatrix);

// Bio-Resonance Mixer — Unit 3: Ratios and Rates (6.AT.1, 6.AT.2, 6.AT.3, 6.AT.3a, 6.AT.3c).
//
// The ratio IS the colour. Two meshing drums pump enzyme A (teal) and enzyme B
// (amber) into a glass chamber; the gear tooth counts are the ratio. The glow
// is read from a colour table indexed by the ACTUAL share of A in the tank, so
// a batch that is not equivalent glows the wrong colour and the resonance
// needle drifts toward the enzyme there is too much of.
// Round 1 equivalent batch, 2 unit rate (a drum log), 3 compare two mixers and
// prove it at a common amount of A, 4 a gear converter between units. Then repeat.
// Every machine runs only when the student commits (Resonate / Run / Engage), so
// sliding a valve never paints the answer onto the apparatus.

import { EduWonderEngine, define } from "../core/engine.js";
import { decText } from "../core/math.js";
import { ParticlePool } from "../core/particles.js";
import { SpringBank } from "../core/spring.js";
import {
  COMMON_MAX,
  judgeCompare,
  judgeConvert,
  judgeEquiv,
  judgeRate,
  makeRound,
  mixIndex,
  modeForRound,
  RATE_MAX,
  RATE_STEP,
  VALVE_MAX,
} from "./math.js";
import { drawScene, F_GEAR, F_PUMP, F_RATIO, S_A, S_A2, S_B, S_B2, S_NEEDLE, S_OUT, S_VALVE, SPRINGS } from "./render.js";
import { STRINGS } from "./strings.js";

const ST_IDLE = "stIdle";
class RatioMixer extends EduWonderEngine {
  static meta = {
    gameId: "u3-ratio-mixer",
    unit: 3,
    lessons: ["3-1", "3-2", "3-3", "3-4", "3-5", "3-6", "3-7", "3-8", "3-9", "3-10"],
    checkId: "run",
  };

  static strings = STRINGS;

  initWorld() {
    this.springs = new SpringBank(SPRINGS);
    this.particles = new ParticlePool(260, [
      "#2fd3c4",
      "#f2a93b",
      "#7bdc8f",
      "#ff6b6b",
      "#9aa6b8",
      "#ffd166",
    ]);
    if (this.reducedMotion) {
      this.particles.scale = 0;
      this.springs.omega = 40;
    }
    this.mode = "equiv";
    this.q = null;
    this.cap = 60;
    this.target1 = 50;
    this.teethA = 8;
    this.teethB = 12;
    this.rA = 34;
    this.rB = 42;
    // Per-frame doubles live in a typed array (F_GEAR, F_PUMP, F_RATIO): object
    // fields that change between integer and double values deopt the renderer.
    this.f = new Float64Array(3);
    this.f[F_RATIO] = 1;
    this.logY = 300;
    this.lamp = 0;
    this.arrow = 0;
    this.pick = 0;
    this.stKey = ST_IDLE;
    this.ranValue = 0;
    this.batches = 0;
    this.batches1 = 0;
    this.batches2 = 0;
    this.cups = new Int32Array(16);
    this.left4 = 0;
    this.fed = 0;
    this.labels = {
      perA: "",
      perB: "",
      plateA: "",
      plateB: "",
      target: "",
      gauge: "",
      rows: [],
      rowTarget: "",
      batch: "",
      rate: "",
      log: "",
      logLine: "",
      made: "",
      cyc: [],
      zero: "0",
      unknown: "?",
      unitsQ: "",
      cycWord: "",
      unitWord: "",
      m1: "",
      m2: "",
      proof1: "",
      proof2: "",
      rows1: [],
      rows2: [],
      target2: "",
      b1: "",
      b2: "",
      commonTitle: "",
      common: "",
      fact: "",
      inTitle: "",
      inPlate: "",
      outTitle: "",
      outPlate: "",
      feedIn: "",
      feedOut: "",
    };
  }

  buildControls() {
    this.aValve = this.slider({
      id: "valve-a",
      label: "aValve",
      min: 0,
      max: VALVE_MAX,
      value: 0,
      format: (v) => (v === 1 ? this.t("oneUnitA") : this.t("unitsA", { n: v })),
      onInput: () => this.sync(false),
    });
    this.bValve = this.slider({
      id: "valve-b",
      label: "bValve",
      min: 0,
      max: VALVE_MAX,
      value: 0,
      format: (v) => (v === 1 ? this.t("oneUnitB") : this.t("unitsB", { n: v })),
      onInput: (v) => {
        this.springs.setTarget(S_VALVE, v / VALVE_MAX);
        this.sync(false);
      },
    });
    this.rateDial = this.slider({
      id: "rate",
      label: "rateDial",
      min: 0,
      max: RATE_MAX,
      step: RATE_STEP,
      value: 0,
      format: (v) => this.t("perCycle", { n: decText(v) }),
      onInput: () => this.sync(false),
    });
    this.commonDial = this.slider({
      id: "common",
      label: "commonDial",
      min: 1,
      max: COMMON_MAX,
      value: 1,
      format: (v) => (v === 1 ? this.t("oneUnitA") : this.t("unitsA", { n: v })),
      onInput: () => this.sync(false),
    });
    this.outDial = this.slider({
      id: "output",
      label: "outDial",
      min: 0,
      max: 10,
      step: 1,
      value: 0,
      format: (v) =>
        this.q && this.q.mode === "convert"
          ? `${decText(v)} ${this.t(`u_${this.q.to}`)}`
          : decText(v),
      onInput: () => this.sync(false),
    });
    this.pick1 = this.button({ id: "pick-1", label: "pick1", onPress: () => this.choose(1) });
    this.pick2 = this.button({ id: "pick-2", label: "pick2", onPress: () => this.choose(2) });
    this.batchBtn = this.button({ id: "batch", label: "batch", onPress: () => this.addBatch() });
    this.dealBtn = this.button({ id: "deal", label: "deal", onPress: () => this.deal() });
    this.batch1Btn = this.button({
      id: "batch-1",
      label: "batch1",
      onPress: () => this.addBatchTo(1),
    });
    this.batch2Btn = this.button({
      id: "batch-2",
      label: "batch2",
      onPress: () => this.addBatchTo(2),
    });
    this.feedBtn = this.button({ id: "feed", label: "feed", onPress: () => this.feed() });
    this.clearBtn = this.button({ id: "clear", label: "clear", onPress: () => this.clearHands() });
    this.runBtn = this.button({
      id: "run",
      label: "runEquiv",
      primary: true,
      onPress: () => this.check(),
    });
    this.binders.push(() => {
      const k = {
        equiv: "runEquiv",
        rate: "runRate",
        compare: "runCompare",
        convert: "runConvert",
      };
      this.runBtn.textContent = this.t(k[this.mode]);
    });
  }

  val(id) {
    return Number(/** @type {HTMLInputElement} */ (this.controls.get(id)).value);
  }

  layout() {
    const m = this.mode;
    const q = this.q;
    const t2 = this.tier >= 2;
    this.aValve.wrap.hidden = !(m === "equiv" && q && q.variant === "total");
    this.bValve.wrap.hidden = m !== "equiv";
    this.rateDial.wrap.hidden = m !== "rate";
    this.commonDial.wrap.hidden = m !== "compare";
    this.outDial.wrap.hidden = m !== "convert";
    this.pick1.hidden = m !== "compare";
    this.pick2.hidden = m !== "compare";
    this.batchBtn.hidden = !(t2 && m === "equiv");
    this.dealBtn.hidden = !(t2 && m === "rate");
    this.batch1Btn.hidden = !(t2 && m === "compare");
    this.batch2Btn.hidden = !(t2 && m === "compare");
    this.feedBtn.hidden = !(t2 && m === "convert");
    this.clearBtn.hidden = !t2;
  }

  onTier() {
    this.layout();
  }

  newRound(level, next) {
    this.mode = modeForRound(this.roundIndex);
    const q = makeRound(this.mode, level, next);
    this.q = q;
    this.particles.clear();
    for (let i = 0; i < SPRINGS; i++) this.springs.snap(i, 0);
    this.stKey = ST_IDLE;
    this.lamp = 0;
    this.arrow = 0;
    this.pick = 0;
    this.f[F_PUMP] = 0;
    this.ranValue = 0;
    this.pick1.setAttribute("aria-pressed", "false");
    this.pick2.setAttribute("aria-pressed", "false");
    this.resetHands();
    this.aValve.set(0);
    this.bValve.set(0);
    this.rateDial.set(0);
    this.commonDial.set(1);
    if (q.mode === "equiv") {
      this.teethA = q.a * 4;
      this.teethB = q.b * 4;
      this.rA = (16 + this.teethA * 1.9) | 0;
      this.rB = (16 + this.teethB * 1.9) | 0;
      this.f[F_RATIO] = this.teethA / this.teethB;
      this.target1 = mixIndex(q.a, q.b);
      this.cap = Math.ceil((q.total || q.A + q.B) * 1.5);
      // Scale rounds start with the given enzyme A already in the tank.
      if (q.variant === "scale") {
        this.springs.snap(S_A, q.A);
        this.ranValue = -1;
      }
    } else if (q.mode === "rate") {
      this.cap = Math.ceil(q.q * 1.6);
      this.logY = (480 - (410 * q.q) / this.cap) | 0;
    } else if (q.mode === "compare") {
      const v = q.common;
      this.cap = Math.ceil(Math.max(v + (v * q.b1) / q.a1, v + (v * q.b2) / q.a2) * 1.7);
    } else {
      this.outDial.setRange(0, q.max, q.step);
      this.outDial.set(0);
    }
    this.layout();
  }

  resetHands() {
    this.batches = 0;
    this.batches1 = 0;
    this.batches2 = 0;
    this.cups.fill(0);
    this.left4 = this.q && this.q.mode === "rate" ? this.q.q * 4 : 0;
    this.fed = 0;
  }

  // ---------- student actions ----------
  choose(n) {
    if (this.solved) return;
    this.pick = n;
    this.pick1.setAttribute("aria-pressed", String(n === 1));
    this.pick2.setAttribute("aria-pressed", String(n === 2));
    this.synth.lock();
    this.sync();
  }

  /** Tier 2: pour one whole batch (a of A and b of B) and count it. */
  addBatch() {
    const q = this.q;
    if (this.solved || q.mode !== "equiv") return;
    if ((this.batches + 1) * Math.max(q.a, q.b) > VALVE_MAX) return;
    this.batches++;
    if (q.variant === "total") this.aValve.set(this.batches * q.a);
    this.bValve.set(this.batches * q.b);
    this.springs.setTarget(S_VALVE, (this.batches * q.b) / VALVE_MAX);
    this.particles.emit(530, 90, 8, 120, 5);
    this.synth.lock();
    this.sync();
  }

  /** Tier 2: deal the logged units fairly into one cup per cycle. */
  deal() {
    const q = this.q;
    if (this.solved || q.mode !== "rate") return;
    const c = q.c;
    let share = 0;
    if (this.left4 >= 4 * c) share = 4;
    else if (this.left4 >= c) share = 1;
    if (!share) return;
    for (let i = 0; i < c; i++) this.cups[i] += share;
    this.left4 -= share * c;
    this.synth.lock();
    this.sync();
  }

  /** Tier 2 compare: add a batch to one mixer; when both hold the same A, sync the dial. */
  addBatchTo(m) {
    const q = this.q;
    if (this.solved || q.mode !== "compare") return;
    if (m === 1 && (this.batches1 + 1) * q.a1 <= COMMON_MAX) this.batches1++;
    if (m === 2 && (this.batches2 + 1) * q.a2 <= COMMON_MAX) this.batches2++;
    const A1 = this.batches1 * q.a1;
    if (A1 > 0 && A1 === this.batches2 * q.a2) this.commonDial.set(A1);
    this.synth.lock();
    this.sync();
  }

  /** Tier 2 convert: push one group of input units through the gears. */
  feed() {
    const q = this.q;
    if (this.solved || q.mode !== "convert") return;
    if ((this.fed + 1) * q.group > q.n + 1e-9) return;
    this.fed++;
    this.f[F_GEAR] += 0.6;
    this.synth.lock();
    this.sync();
  }

  clearHands() {
    if (this.solved) return;
    this.resetHands();
    if (this.mode === "equiv") {
      this.aValve.set(0);
      this.bValve.set(0);
    }
    this.sync();
  }

  // ---------- the machine runs ----------
  run(heft) {
    this.f[F_PUMP] = this.reducedMotion ? 0.2 : 1.2;
    this.synth.impact(heft);
    // Enzyme spray at the inlets, emitted once per run (never per frame).
    if (this.mode === "equiv") {
      this.particles.emit(440, 320, 14, 120, 0, 0, 0.6, 0.6);
      this.particles.emit(440, 360, 14, 120, 1, 0, 0.6, 0.6);
    } else if (this.mode === "rate") this.particles.emit(640, 150, 14, 120, 0, 0, 0.6, 0.6);
  }

  evaluate() {
    const q = this.q;
    if (q.mode === "equiv") {
      const A = q.variant === "scale" ? q.A : this.val("valve-a");
      const B = this.val("valve-b");
      this.run(0.5);
      this.springs.setTarget(S_A, A);
      this.springs.setTarget(S_B, B);
      const idx = mixIndex(A, B);
      const d = idx < 0 ? 0 : (idx - this.target1) * 0.035;
      this.springs.setTarget(S_NEEDLE, d > 1.1 ? 1.1 : d < -1.1 ? -1.1 : d);
      this.ranValue = 1;
      const v = judgeEquiv(q, A, B);
      const vars = { a: q.a, b: q.b, A, B, T: q.total };
      this.lamp = v === "ok" ? 1 : 2;
      if (v === "ok") {
        this.stKey = "stOk";
        return { ok: true, key: "solvedEquiv", vars };
      }
      if (v === "overTotal" || v === "underTotal") {
        this.stKey = v === "overTotal" ? "stOver" : "stUnder";
        return { ok: false, key: v, misconception: "part-whole-total", vars };
      }
      const teal = A * q.b > B * q.a;
      this.stKey = teal ? "stTeal" : "stAmber";
      if (v === "additive")
        return {
          ok: false,
          key: teal ? "additiveTeal" : "additiveAmber",
          misconception: "additive-ratio",
        };
      return { ok: false, key: v, misconception: "ratio-not-equivalent" };
    }
    if (q.mode === "rate") {
      const r = this.val("rate");
      this.run(Math.min(1, r / 6));
      this.ranValue = r * q.c;
      this.springs.setTarget(S_OUT, this.ranValue);
      const v = judgeRate(q, r);
      this.lamp = v === "ok" ? 1 : 2;
      this.stKey = v === "ok" ? "stOk" : r * q.c > q.q ? "stHigh" : "stLow";
      if (v === "ok") return { ok: true, key: "solvedRate", vars: { r: decText(q.rate) } };
      if (v === "inverted")
        return { ok: false, key: r < q.rate ? "invertedLow" : "invertedHigh", misconception: "inverted-rate" };
      return { ok: false, key: v, misconception: "unit-rate" };
    }
    if (q.mode === "compare") {
      const v = this.val("common");
      const verdict = judgeCompare(q, this.pick, v);
      const syncs = v % q.a1 === 0 && v % q.a2 === 0;
      if (syncs) {
        this.run(0.6);
        this.springs.setTarget(S_A, v);
        this.springs.setTarget(S_B, (v * q.b1) / q.a1);
        this.springs.setTarget(S_A2, v);
        this.springs.setTarget(S_B2, (v * q.b2) / q.a2);
        this.ranValue = v;
        this.stKey = "stProof";
      } else {
        // The gears jam: no batch-perfect amount, nothing pumps.
        for (let i = S_A; i <= S_B2; i++) this.springs.setTarget(i, 0);
        this.ranValue = 0;
        this.stKey = "stJam";
        this.particles.emit(480, 100, 18, 180, 3);
      }
      this.lamp = verdict === "ok" ? 1 : 2;
      const vars = { v, m: q.stronger };
      if (verdict === "ok") return { ok: true, key: "solvedCompare", vars };
      if (verdict === "noPick") return { ok: false, key: "noPick" };
      if (verdict === "notCommon1" || verdict === "notCommon2") {
        const m = verdict === "notCommon1" ? 1 : 2;
        return {
          ok: false,
          key: "notCommon",
          misconception: "not-common-multiple",
          vars: { m, a: m === 1 ? q.a1 : q.a2, v },
        };
      }
      const firstTerm = (this.pick === 1 ? q.a1 : q.a2) > (this.pick === 1 ? q.a2 : q.a1);
      return {
        ok: false,
        key: "wrongPick",
        misconception: firstTerm ? "first-term-only" : "ratio-compare",
      };
    }
    const v = this.val("output");
    this.run(0.4);
    this.ranValue = v;
    this.springs.setTarget(S_OUT, this.springs.target[S_OUT] + Math.PI * 2);
    const verdict = judgeConvert(q, v);
    this.lamp = verdict === "ok" ? 1 : 2;
    const high = verdict === "convHigh" || verdict === "wrongOpDiv";
    this.arrow = verdict === "ok" ? 0 : high ? -1 : 1;
    this.stKey = verdict === "ok" ? "stOk" : high ? "stHigh" : "stLow";
    const vars = {
      n: decText(q.n),
      v: decText(v),
      from: this.t(`u_${q.from}`),
      to: this.t(`u_${q.to}`),
    };
    if (verdict === "ok") return { ok: true, key: "solvedConvert", vars };
    return {
      ok: false,
      key: verdict,
      misconception: verdict.startsWith("wrongOp") ? "conversion-operation" : "conversion-factor",
      vars,
    };
  }

  onSolved() {
    const x =
      this.mode === "compare"
        ? 480
        : this.mode === "convert"
          ? 730
          : this.mode === "rate"
            ? 750
            : 530;
    this.particles.emit(x, 120, 40, 260, 2, -Math.PI / 2, Math.PI * 1.6, 1.1);
  }

  onMiss() {
    const x =
      this.mode === "compare"
        ? 480
        : this.mode === "convert"
          ? 730
          : this.mode === "rate"
            ? 750
            : 530;
    this.particles.emit(x, 90, 14, 160, 3);
  }

  updatePhysics(dt) {
    this.springs.step(dt);
    this.particles.update(dt);
    const f = this.f;
    if (f[F_PUMP] > 0) {
      f[F_PUMP] -= dt;
      f[F_GEAR] += dt * 4;
    }
  }

  renderScene(ctx) {
    this.backdrop(ctx);
    drawScene(ctx, this);
  }

  // ---------- strings (built on state change, never per frame) ----------
  refreshLabels() {
    const q = this.q;
    if (!q) return;
    const L = this.labels;
    L.gauge = this.t("gauge");
    L.target = this.t("target");
    L.log = this.t("log");
    if (q.mode === "equiv") {
      L.perA = this.t("perCycleA", { n: q.a });
      L.perB = this.t("perCycleB", { n: q.b });
      const ran = this.ranValue !== 0;
      const A = q.variant === "scale" ? q.A : ran ? this.springs.target[S_A] : 0;
      const B = ran ? this.springs.target[S_B] : 0;
      L.plateA = this.t("plateA", { n: A });
      L.plateB = this.t("plateB", { n: B });
      const rows = [this.t("rowHead")];
      for (let k = 1; k <= 3; k++) {
        if (k === q.k) continue;
        rows.push(
          q.variant === "scale"
            ? `${q.a * k} : ${q.b * k}`
            : `${q.a * k} : ${q.b * k} → ${(q.a + q.b) * k}`,
        );
      }
      L.rows = rows;
      L.rowTarget = q.variant === "scale" ? `${q.A} : ?` : `? : ? → ${q.total}`;
      L.batch = this.t("batchLine", {
        n: this.batches,
        A: this.batches * q.a,
        B: this.batches * q.b,
      });
    } else if (q.mode === "rate") {
      L.rate = this.t("perCycle", { n: decText(this.val("rate")) });
      L.logLine = this.t("logLine", { c: q.c, q: q.q });
      L.made = this.t("made", { n: this.stKey === ST_IDLE ? "—" : decText(this.ranValue) });
      const cyc = [];
      for (let i = 0; i <= q.c; i++) cyc.push(String(i));
      L.cyc = cyc;
      L.unitsQ = String(q.q);
      L.cycWord = this.t("cycWord");
      L.unitWord = this.t("unitWord");
    } else if (q.mode === "compare") {
      L.m1 = this.t("mixerRatio", { m: 1, a: q.a1, b: q.b1 });
      L.m2 = this.t("mixerRatio", { m: 2, a: q.a2, b: q.b2 });
      const proof = this.stKey === "stProof" || (this.solved && this.ranValue > 0);
      const v = this.ranValue;
      L.proof1 = proof ? this.t("proof", { A: v, B: (v * q.b1) / q.a1 }) : "";
      L.proof2 = proof ? this.t("proof", { A: v, B: (v * q.b2) / q.a2 }) : "";
      L.rows1 = this.ratioRows(q.a1, q.b1);
      L.rows2 = this.ratioRows(q.a2, q.b2);
      L.target1 = "";
      L.target2 = "";
      L.b1 = this.t("batchA", { n: this.batches1, A: this.batches1 * q.a1 });
      L.b2 = this.t("batchA", { n: this.batches2, A: this.batches2 * q.a2 });
      L.commonTitle = this.t("commonDial");
      L.common = this.t("commonPlate", { n: this.val("common") });
    } else {
      const from = this.t(`u_${q.from}`);
      const to = this.t(`u_${q.to}`);
      L.fact = this.t(`fact_${q.big}`);
      L.inTitle = this.t("input");
      L.inPlate = `${decText(q.n)} ${from}`;
      L.outTitle = this.t("output");
      L.outPlate = this.stKey === ST_IDLE ? `— ${to}` : `${decText(this.ranValue)} ${to}`;
      const rows = [];
      const bigName = this.t(`ab_${q.big}`);
      const smallName = this.t(`ab_${q.dir === "mul" ? q.to : q.from}`);
      for (let k = 1; k <= 3; k++) {
        if ((q.dir === "mul" && q.n === k) || (q.dir === "div" && q.ans === k)) continue;
        rows.push(`${k} ${bigName} : ${k * q.f} ${smallName}`);
      }
      L.rows = rows;
      L.rowTarget =
        q.dir === "mul"
          ? `${decText(q.n)} ${bigName} : ? ${smallName}`
          : `? ${bigName} : ${decText(q.n)} ${smallName}`;
      const left = q.n - this.fed * q.group;
      const out = q.dir === "mul" ? this.fed * q.group * q.f : (this.fed * q.group) / q.f;
      L.feedIn = this.t("feedLeft", { n: decText(left), u: from });
      L.feedOut = this.t("feedMade", { n: decText(out), u: to });
    }
  }

  /** Ratio-table rows k = 1..4 for a mixer (the given ratio and its multiples). */
  ratioRows(a, b) {
    const rows = [this.t("rowHead")];
    for (let k = 1; k <= 4; k++) rows.push(`${a * k} : ${b * k}`);
    return rows;
  }

  describe() {
    const q = this.q;
    if (!q) return "";
    const state = this.t(this.stKey);
    if (q.mode === "equiv") {
      const A = q.variant === "scale" ? q.A : this.val("valve-a");
      return this.t("descEquiv", { a: q.a, b: q.b, A, B: this.val("valve-b"), state });
    }
    if (q.mode === "rate")
      return this.t("descRate", { c: q.c, q: q.q, r: decText(this.val("rate")), state });
    if (q.mode === "compare") {
      const pick = this.pick ? this.t("mixer", { m: this.pick }) : this.t("noneYet");
      return this.t("descCompare", {
        a1: q.a1,
        b1: q.b1,
        a2: q.a2,
        b2: q.b2,
        pick,
        v: this.val("common"),
        state,
      });
    }
    return this.t("descConvert", {
      fact: this.t(`fact_${q.big}`),
      n: decText(q.n),
      from: this.t(`u_${q.from}`),
      v: decText(this.val("output")),
      to: this.t(`u_${q.to}`),
      state,
    });
  }

  mission() {
    const q = this.q;
    if (q.mode === "equiv")
      return q.variant === "scale"
        ? this.t("missionScale", { a: q.a, b: q.b, A: q.A })
        : this.t("missionTotal", { a: q.a, b: q.b, T: q.total });
    if (q.mode === "rate") return this.t("missionRate", { c: q.c, q: q.q });
    if (q.mode === "compare")
      return this.t("missionCompare", { a1: q.a1, b1: q.b1, a2: q.a2, b2: q.b2 });
    return this.t("missionConvert", {
      fact: this.t(`fact_${q.big}`),
      n: decText(q.n),
      from: this.t(`u_${q.from}`),
      to: this.t(`u_${q.to}`),
    });
  }

  testPlan() {
    const q = this.q;
    if (q.mode === "equiv") {
      const plan = [];
      if (q.variant === "total")
        plan.push(
          { control: "valve-a", key: "Home" },
          { control: "valve-a", key: "ArrowRight", times: q.A },
        );
      plan.push(
        { control: "valve-b", key: "Home" },
        { control: "valve-b", key: "ArrowRight", times: q.B },
        { control: "run", key: "Enter" },
      );
      return plan;
    }
    if (q.mode === "rate")
      return [
        { control: "rate", key: "Home" },
        { control: "rate", key: "ArrowRight", times: Math.round(q.rate / RATE_STEP) },
        { control: "run", key: "Enter" },
      ];
    if (q.mode === "compare")
      return [
        { control: `pick-${q.stronger}`, key: "Enter" },
        { control: "common", key: "Home" },
        { control: "common", key: "ArrowRight", times: q.common - 1 },
        { control: "run", key: "Enter" },
      ];
    return [
      { control: "output", key: "Home" },
      { control: "output", key: "ArrowRight", times: Math.round(q.ans / q.step) },
      { control: "run", key: "Enter" },
    ];
  }
}

define("ew-ratio-mixer", RatioMixer);

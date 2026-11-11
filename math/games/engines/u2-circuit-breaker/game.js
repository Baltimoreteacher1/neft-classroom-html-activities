// Circuit Breaker: The Nanotech Grid — Unit 2: Computation with decimals.
//
// Place values are power buses (1000, 100, 10, 1, 0.1, 0.01) on either side of
// a central grounding bar: the decimal point.
//  - ALIGN: two charges ride digit conduits. Slide the lower conduit: until both
//    decimal points touch the grounding bar the digits sit on the wrong buses
//    and arc. Once locked, set the output wheels to the sum or difference.
//  - DIVIDE: a charge is split by partial quotients. Each "divert" peels
//    chunk × divisor off the remaining charge into the quotient bank. Any
//    sequence of chunks that fits is valid; the judge checks only the bank and
//    what is left.
//  - MULTIPLY: both factors are fed in with their grounding bars removed and the
//    grid multiplies whole currents. Count each factor's decimal places, slide
//    the product's grounding bar into place and close the circuit (multiply.js).
// Rendering lives in render.js; this file owns state, controls and judging.

import { define, EduWonderEngine } from "../core/engine.js";
import { staticLayer } from "../core/draw.js";
import { ParticlePool } from "../core/particles.js";
import { SpringBank } from "../core/spring.js";
import {
  breakRod,
  bundleTen,
  digitAt,
  divert,
  divideState,
  hText,
  judgeAlign,
  judgeDivide,
  leadIndex,
  lowestPlace,
  makeAlign,
  makeDivide,
  modeForRound,
  ONES,
  PLACE_COUNT,
  PLACES,
  scaleTen,
  trayOf,
} from "./math.js";
import {
  buildMultiplyControls,
  describeMultiply,
  evaluateMultiply,
  initMultiply,
  multiplyLabels,
  multiplyMission,
  multiplyPlan,
  startMultiply,
} from "./multiply.js";
import * as R from "./render.js";
import { STRINGS } from "./strings.js";

const WHEEL_IDS = ["out-1000", "out-100", "out-10", "out-1", "out-0.1", "out-0.01"];
const MAX_CHIPS = 12;

const DT = 1 / 60;

class CircuitBreaker extends EduWonderEngine {
  static meta = {
    gameId: "u2-circuit-breaker",
    unit: 2,
    lessons: ["2-6", "2-7", "2-11", "2-12"],
    checkId: "close",
  };

  static strings = STRINGS;

  initWorld() {
    this.springs = new SpringBank(R.SPRINGS);
    this.particles = new ParticlePool(240, R.PALETTE);
    if (this.reducedMotion) {
      this.particles.scale = 0;
      this.springs.omega = 40;
    }
    this.mode = "align";
    this.round = null;
    this.ds = null;
    this.aDig = new Int8Array(PLACE_COUNT);
    this.bDig = new Int8Array(PLACE_COUNT);
    this.span = new Int8Array(4); // aLead, aLast, bLead, bLast
    this.charge = new Int8Array(PLACE_COUNT);
    this.chargeSpan = new Int8Array(2);
    this.tray = new Int16Array(PLACE_COUNT);
    this.need = new Int16Array(PLACE_COUNT);
    this.chips = 0;
    this.shiftVal = 0;
    this.cDigit = 1;
    this.cPlace = 0;
    this.wheelVal = new Int8Array(PLACE_COUNT);
    this.labels = {
      op: "+",
      chunk: "",
      divisor: "",
      chips: new Array(MAX_CHIPS).fill(""),
      col: new Array(PLACE_COUNT).fill(""),
      mult: new Array(9).fill(""),
    };
    this.chipText = [];
    this.layers = { grid: staticLayer(R.W, R.H, R.paintGrid) };
    initMultiply(this);
  }

  buildControls() {
    this.shift = this.slider({
      id: "shift",
      label: "shift",
      min: -3,
      max: 3,
      value: 1,
      format: (v) => this.shiftText(v),
      onInput: (v) => this.moveConduit(v),
    });
    this.wheels = WHEEL_IDS.map((id, p) =>
      this.slider({
        id,
        label: `wheel${p}`,
        min: 0,
        max: 9,
        value: 0,
        onInput: (v) => {
          this.wheelVal[p] = v;
          this.springs.impulse(R.S_WHEEL + p, -40);
          this.synth.tick();
          this.sync();
        },
      }),
    );
    this.digit = this.slider({
      id: "digit",
      label: "chunkDigit",
      min: 1,
      max: 9,
      value: 1,
      onInput: () => this.chunkChanged(),
    });
    this.place = this.slider({
      id: "place",
      label: "chunkPlace",
      min: 0,
      max: ONES,
      value: 0,
      format: (v) => this.t("placeFormat", { name: this.t(`place${v}`), v: hText(PLACES[v]) }),
      onInput: () => this.chunkChanged(),
    });
    this.scaleBtn = this.button({ id: "scale", label: "scale", onPress: () => this.scaleBoth() });
    this.divertBtn = this.button({
      id: "divert",
      label: "divert",
      onPress: () => this.divertChunk(),
    });
    this.regroupBtn = this.button({
      id: "regroup",
      label: "breakRod",
      onPress: () => this.regroup(),
    });
    this.resetBtn = this.button({
      id: "reset-charge",
      label: "resetCharge",
      onPress: () => this.reload(),
    });
    this.multWraps = buildMultiplyControls(this);
    this.closeBtn = this.button({
      id: "close",
      label: "closeCircuit",
      primary: true,
      onPress: () => this.check(),
    });
    this.binders.push(() => {
      this.closeBtn.textContent = this.t(
        this.mode === "divide" ? "confirmQuotient" : "closeCircuit",
      );
      const bundle = this.mode === "align" && this.round && this.round.op === "+";
      this.regroupBtn.textContent = this.t(bundle ? "bundleTen" : "breakRod");
    });
  }

  shiftText(v) {
    if (v === 0) return this.t("shiftAligned");
    const n = Math.abs(v);
    const key =
      v > 0 ? (n === 1 ? "shiftRight" : "shiftRightMany") : n === 1 ? "shiftLeft" : "shiftLeftMany";
    return this.t(key, { n });
  }

  newRound(level, next) {
    this.mode = modeForRound(this.roundIndex);
    const align = this.mode === "align";
    const divide = this.mode === "divide";
    this.particles.clear();
    this.digit.set(1);
    this.place.set(0);
    this.cDigit = 1;
    this.cPlace = 0;
    this.shift.wrap.hidden = !align;
    for (const w of this.wheels) w.wrap.hidden = !align;
    this.digit.wrap.hidden = !divide;
    this.place.wrap.hidden = !divide;
    this.divertBtn.hidden = !divide;
    this.resetBtn.hidden = !divide;
    for (const w of this.multWraps) w.hidden = this.mode !== "multiply";
    const sp = this.springs;
    sp.snap(R.S_LOCK, 0);
    if (this.mode === "multiply") {
      startMultiply(this, level, next);
    } else if (align) {
      const r = makeAlign(level, next);
      this.round = r;
      for (let p = 0; p < PLACE_COUNT; p++) {
        this.aDig[p] = digitAt(r.a, p);
        this.bDig[p] = digitAt(r.b, p);
        this.wheels[p].set(0);
        this.wheelVal[p] = 0;
      }
      this.span[0] = leadIndex(r.a);
      this.span[1] = ONES + r.aDp;
      this.span[2] = leadIndex(r.b);
      this.span[3] = ONES + r.bDp;
      this.shift.set(r.park);
      this.shiftVal = r.park;
      sp.snap(R.S_SHIFT, r.park);
      this.labels.op = r.op === "+" ? "+" : "−";
      this.resetTrays();
    } else {
      const r = makeDivide(level, next);
      this.round = r;
      this.place.setRange(0, lowestPlace(r));
      this.reload(true);
    }
    this.onTier(this.tier);
  }

  /** Fresh charge for a divide round. */
  reload(silent = false) {
    if (this.solved) return;
    this.ds = divideState(this.round);
    this.chips = 0;
    this.chipText.length = 0;
    this.springs.snap(R.S_CHARGE, 1);
    this.chargeChanged();
    if (!silent) {
      this.say(this.t("reloaded"));
      this.sync(false);
    }
  }

  /** Trays: the top number's pieces (add: both numbers' pieces), and what to take away. */
  resetTrays() {
    const r = this.round;
    const ta = trayOf(r.a);
    const tb = trayOf(r.b);
    for (let p = 0; p < PLACE_COUNT; p++) {
      this.tray[p] = r.op === "+" ? ta[p] + tb[p] : ta[p];
      this.need[p] = r.op === "+" ? 0 : tb[p];
    }
  }

  chargeChanged() {
    const s = this.ds;
    const t = trayOf(s.remaining);
    for (let p = 0; p < PLACE_COUNT; p++) {
      this.charge[p] = t[p];
      this.tray[p] = t[p];
    }
    this.chargeSpan[0] = leadIndex(s.remaining);
    this.chargeSpan[1] = this.round.decimal ? PLACE_COUNT - 1 : ONES;
    const full = this.round.dividend * 10 ** s.scaled;
    this.springs.setTarget(R.S_CHARGE, s.remaining / full);
    this.chunkChanged(true);
  }

  /** Recompute the per-place pieces the selected chunk would take away. */
  chunkChanged(silent = false) {
    if (this.mode !== "divide" || !this.ds) return;
    this.cDigit = Number(this.digit.input.value);
    this.cPlace = Number(this.place.input.value);
    const peel = this.peel();
    const t = trayOf(peel < 1000000 ? peel : 0);
    for (let p = 0; p < PLACE_COUNT; p++) this.need[p] = t[p];
    if (!silent) this.sync();
  }

  chunkValue() {
    return Number(this.digit.input.value) * PLACES[Number(this.place.input.value)];
  }

  peel() {
    return this.ds.divisor % 100 === 0 ? this.chunkValue() * (this.ds.divisor / 100) : 0;
  }

  onTier(n) {
    this.regroupBtn.hidden = n < 2 || this.mode === "multiply";
    this.countBtn.hidden = n < 2 || this.mode !== "multiply";
    this.scaleBtn.hidden = this.mode !== "divide" || this.round.divisor % 100 === 0;
  }

  moveConduit(v) {
    this.shiftVal = v;
    this.springs.setTarget(R.S_SHIFT, v);
    if (v === 0) {
      this.synth.lock();
      this.springs.setTarget(R.S_LOCK, 1);
      this.particles.emit(R.BAR_X, R.ROW_B, 18, 160, 1);
    } else {
      this.synth.strain();
      this.springs.setTarget(R.S_LOCK, 0);
      this.particles.emit(R.colX(R.DEC + v), R.ROW_B + 20, 14, 200, 0);
    }
    this.sync();
  }

  scaleBoth() {
    if (this.solved || this.mode !== "divide") return;
    const s = scaleTen(this.ds);
    if (!s) {
      this.say(this.t("alreadyWhole"));
      this.setFeedback(this.t("alreadyWhole"));
      return;
    }
    this.ds = s;
    this.synth.lock();
    this.chargeChanged();
    const text = this.t("scaled", { D: hText(s.remaining), d: hText(s.divisor) });
    this.setFeedback(text, true);
    this.say(text);
    this.sync(false);
  }

  divertChunk() {
    if (this.solved || this.mode !== "divide") return;
    if (this.ds.divisor % 100 !== 0) return this.refuse("notWhole", "divisor-not-whole");
    if (this.tier >= 2) {
      // Hands-on: the trays must hold the pieces before they can be taken away.
      if (this.peel() <= this.ds.remaining)
        for (let p = PLACE_COUNT - 1; p >= 0; p--)
          if (this.tray[p] < this.need[p])
            return this.refuse("breakNeeded", null, { place: this.t(`placeArt${p}`) });
    }
    const res = divert(this.ds, Number(this.digit.input.value), Number(this.place.input.value));
    if (res.error === "overdraw") {
      this.particles.emit(R.CAP_X, R.ROW_A, 40, 280, 3, -Math.PI / 2, Math.PI * 2, 0.9);
      this.springs.impulse(R.S_CHARGE, 0.6);
      return this.refuse("overdraw", "overdraw");
    }
    const keepTrays = this.tier >= 2;
    const saved = keepTrays ? Array.from(this.tray, (v, p) => v - this.need[p]) : null;
    this.ds = res.state;
    const c = hText(this.chunkValue());
    if (this.chips < MAX_CHIPS) this.chips++;
    this.chipText.push(c);
    if (this.chipText.length > MAX_CHIPS) this.chipText.shift();
    this.chargeChanged();
    if (saved) for (let p = 0; p < PLACE_COUNT; p++) this.tray[p] = saved[p];
    this.springs.impulse(R.S_BANK, -50);
    this.particles.emit(R.BANK_X, R.ROW_A, 20, 180, 1);
    this.synth.impact(0.5);
    const text = this.t("diverted", { c, r: hText(this.ds.remaining) });
    this.setFeedback(text, true);
    this.say(text);
    this.sync(false);
  }

  refuse(key, tag, vars) {
    if (tag && !this.misconceptions.includes(tag)) this.misconceptions.push(tag);
    this.synth.strain();
    const text = this.t(key, vars);
    this.setFeedback(text);
    this.shout(text);
    this.sync(false);
  }

  /** Tier 2: break a rod (borrow) or bundle ten (carry) by hand. */
  regroup() {
    if (this.solved) return;
    if (this.mode === "align" && this.round.op === "+") {
      const p = bundleTen(this.tray);
      if (p < 0) return this.say(this.t("nothingToBundle"));
      this.synth.lock();
      this.say(this.t("bundled", { from: this.t(`placeArt${p}`), to: this.t(`placeArt${p - 1}`) }));
    } else {
      if (this.mode === "divide" && this.peel() > this.ds.remaining)
        return this.refuse("overdraw", "overdraw");
      const k = breakRod(this.tray, this.need);
      if (k < 0) return this.say(this.t("nothingShort"));
      this.synth.impact(0.25);
      this.say(this.t("broke", { from: this.t(`placeArt${k}`), to: this.t(`placeArt${k + 1}`) }));
    }
    this.sync(false);
  }

  wheelValues() {
    return this.wheels.map((w) => Number(w.input.value));
  }

  evaluate() {
    const r = this.round;
    if (this.mode === "multiply") return evaluateMultiply(this);
    if (this.mode === "align") {
      const j = judgeAlign(r, Number(this.shift.input.value), this.wheelValues());
      if (j.verdict === "ok")
        return {
          ok: true,
          key: "solvedAlign",
          vars: { a: hText(r.a), op: this.labels.op, b: hText(r.b), r: hText(r.result) },
        };
      if (j.verdict === "misaligned") {
        this.particles.emit(R.BAR_X, R.ROW_B, 30, 240, 0);
        return {
          ok: false,
          key: j.slideLeft ? "misalignedLeft" : "misalignedRight",
          misconception: "decimal-misaligned",
        };
      }
      if (j.noRegroup) return { ok: false, key: "noRegroup", misconception: "no-regroup" };
      return {
        ok: false,
        key: j.verdict === "high" ? "wheelHigh" : "wheelLow",
        misconception: "place-value-digit",
        vars: { place: this.t(`placeArt${j.place}`) },
      };
    }
    const v = judgeDivide(r, this.ds);
    if (v === "ok") {
      const scale = 10 ** this.ds.scaled;
      const vars = {
        D: hText(r.dividend),
        d: hText(r.divisor),
        q: hText(this.ds.bank),
        r: hText(this.ds.remaining / scale),
      };
      return { ok: true, key: r.decimal ? "solvedDivideDec" : "solvedDivideWhole", vars };
    }
    if (v === "scaleFirst")
      return { ok: false, key: "notWhole", misconception: "divisor-not-whole" };
    return { ok: false, key: v, misconception: "stopped-early" };
  }

  onMiss() {
    this.springs.impulse(R.S_LOCK, -2);
  }

  onSolved() {
    this.springs.setTarget(R.S_LOCK, 1);
    this.particles.emit(R.BAR_X, R.ROW_W, 50, 280, 2, -Math.PI / 2, Math.PI * 1.6, 1.1);
  }

  updatePhysics(_dt) {
    // Step with the module constant so no double crosses a call.
    this.springs.step(DT);
    this.particles.update(DT);
  }

  refreshLabels() {
    const L = this.labels;
    const r = this.round;
    if (!r) return;
    if (this.mode === "multiply") return multiplyLabels(this);
    if (this.mode === "align") {
      const shift = Number(this.shift.input.value);
      for (let c = 0; c < PLACE_COUNT; c++) {
        const p = c - shift; // the lower conduit's place that lands on column c
        const hasA = c >= this.span[0] && c <= this.span[1];
        const hasB = p >= this.span[2] && p <= this.span[3];
        const a = hasA ? String(this.aDig[c]) : "";
        const b = hasB ? String(this.bDig[p]) : "";
        L.col[c] = a && b ? `${a} ${L.op} ${b}` : a || b;
      }
      return;
    }
    const s = this.ds;
    L.divisor = `÷ ${hText(s.divisor)}`;
    L.chunk = s.divisor % 100 === 0 ? `${hText(this.chunkValue())} × ${hText(s.divisor)}` : "";
    for (let k = 0; k < 9; k++)
      L.mult[k] = `${k + 1} × ${hText(s.divisor)} = ${hText((k + 1) * s.divisor)}`;
    for (let i = 0; i < MAX_CHIPS; i++) L.chips[i] = this.chipText[i] || "";
  }

  describe() {
    const r = this.round;
    if (!r) return "";
    if (this.mode === "multiply") return describeMultiply(this);
    let tail = "";
    if (this.tier >= 2) {
      const parts = [];
      for (let p = 0; p < PLACE_COUNT; p++)
        if (this.tray[p]) parts.push(`${this.tray[p]} ${this.t(`place${p}`)}`);
      tail = ` ${this.t("traysDesc", { t: parts.join(", ") })}`;
    }
    if (this.mode === "align") {
      const w = this.wheelValues();
      const wt = `${w.slice(0, 4).join(" ")} . ${w.slice(4).join(" ")}`;
      return (
        this.t("descAlign", {
          op: this.t(r.op === "+" ? "opAdd" : "opSub"),
          a: hText(r.a),
          b: hText(r.b),
          pos: this.shiftText(Number(this.shift.input.value)),
          w: wt,
        }) + tail
      );
    }
    const s = this.ds;
    return (
      this.t("descDivide", {
        d: hText(s.divisor),
        r: hText(s.remaining),
        bank: this.chipText.length ? this.chipText.join(", ") : this.t("bankEmpty"),
        c: hText(this.chunkValue()),
      }) + tail
    );
  }

  mission() {
    const r = this.round;
    if (this.mode === "multiply") return multiplyMission(this);
    if (this.mode === "align")
      return this.t(r.op === "+" ? "missionAdd" : "missionSub", { a: hText(r.a), b: hText(r.b) });
    const key =
      r.divisor % 100 !== 0
        ? "missionDivideScale"
        : r.decimal
          ? "missionDivideDec"
          : "missionDivide";
    return this.t(key, { D: hText(r.dividend), d: hText(r.divisor) });
  }

  testPlan() {
    const r = this.round;
    if (this.mode === "multiply") return multiplyPlan(this);
    if (this.mode === "align") {
      const plan = [
        { control: "shift", key: "Home" },
        { control: "shift", key: "ArrowRight", times: 3 },
      ];
      for (let p = 0; p < PLACE_COUNT; p++) {
        plan.push({ control: WHEEL_IDS[p], key: "Home" });
        const d = digitAt(r.result, p);
        if (d) plan.push({ control: WHEEL_IDS[p], key: "ArrowRight", times: d });
      }
      plan.push({ control: "close", key: "Enter" });
      return plan;
    }
    const plan = [];
    let s = this.ds;
    while (s.divisor % 100 !== 0) {
      plan.push({ control: "scale", key: "Enter" });
      s = scaleTen(s);
    }
    for (let p = 0; p <= lowestPlace(r); p++) {
      const unit = PLACES[p] * (s.divisor / 100);
      for (let digit = Math.min(9, Math.floor(s.remaining / unit)); digit > 0;) {
        plan.push({ control: "place", key: "Home" });
        if (p) plan.push({ control: "place", key: "ArrowRight", times: p });
        plan.push({ control: "digit", key: "Home" });
        if (digit > 1) plan.push({ control: "digit", key: "ArrowRight", times: digit - 1 });
        plan.push({ control: "divert", key: "Enter" });
        s = divert(s, digit, p).state;
        digit = Math.min(9, Math.floor(s.remaining / unit));
      }
    }
    plan.push({ control: "close", key: "Enter" });
    return plan;
  }

  renderScene(ctx) {
    R.renderScene(this, ctx);
  }
}

define("ew-circuit-breaker", CircuitBreaker);

// Flux Foundry: The Rule-Gear Plotter — Unit 9: Relationships Between Two Variables.
//
// The rule IS the machine. An input crank (independent variable x) turns a
// rule gear (multiply or add, with a constant) that drives an output piston
// (dependent variable y). A plotter pen rides the crank's carriage and the
// piston's arm, so turning the crank draws (x, y) on the graph point by point
// while a table tape prints each reading.
//  - DECODE: a sensor log of (x, y) pairs; build the gear that makes them all.
//    Points of your rule that miss a sensor dot spark.
//  - PREDICT: the gear is known; set the output dial for an input. The crank
//    runs there and the piston meets the dial collar, or falls short / jams.
//  - WIRE: a context; put the input quantity on the crank and the output on
//    the piston, then set the constant from a sample reading.

import { EduWonderEngine, define } from "../core/engine.js";
import { ParticlePool } from "../core/particles.js";
import { SpringBank } from "../core/spring.js";
import {
  apply,
  judgeDecode,
  judgePredict,
  judgeWire,
  K_MAX,
  makeDecode,
  makePredict,
  makeWire,
  modeFor,
  numText,
  ruleText,
  stepFor,
  X_MAX,
} from "./math.js";
import {
  buildGraphLayer,
  buildMachineLayer,
  F_END,
  F_K,
  F_RUNX,
  F_T,
  F_YSCALE,
  I_DONE,
  I_NEXTPLOT,
  I_NPLOT,
  I_OP,
  I_RUN,
  I_STEPX,
  I_TBL,
  M_DECODE,
  M_PREDICT,
  M_WIRE,
  OP_ADD,
  OP_MUL,
  layout,
  SCR_SIZE,
  toGX,
  toGY,
  renderAll,
  S_COLLAR,
  S_GEAR,
  S_PISTON,
} from "./render.js";
import { STRINGS } from "./strings.js";

const MODE_ID = { decode: M_DECODE, predict: M_PREDICT, wire: M_WIRE };
const DT = 1 / 60; // the core's fixed step; a module constant crosses calls without boxing
const RUN_SPEED = 2.4; // crank turns, in x units per second
const UP = -Math.PI / 2;
const ALL_AROUND = Math.PI * 2;

class FluxFoundry extends EduWonderEngine {
  static meta = {
    gameId: "u9-flux-plotter",
    unit: 9,
    lessons: ["9-1", "9-2", "9-3", "9-4"],
    checkId: "run",
  };

  static strings = STRINGS;

  initWorld() {
    this.springs = new SpringBank(3);
    this.particles = new ParticlePool(220, ["#ffd166", "#f2b45a", "#7bdc8f", "#ff6b6b", "#46c2b8"]);
    if (this.reducedMotion) {
      this.particles.scale = 0;
      this.springs.omega = 40;
    }
    this.f = new Float64Array(6);
    this.f[5] = Number.NaN; // F_GA: force the first gear-teeth layout
    this.f[F_YSCALE] = 1;
    this.s = new Int32Array(10);
    this.plotY = new Float64Array(X_MAX + 1);
    this.plotted = new Uint8Array(X_MAX + 1);
    this.obsY = new Float64Array(X_MAX + 1);
    this.obsMask = new Uint8Array(X_MAX + 1);
    this.obsState = new Uint8Array(X_MAX + 1); // 0 idle, 1 matched, 2 missed (sparked)
    this.plotSY = new Int32Array(X_MAX + 1); // screen y of each plotted reading
    this.obsSY = new Int32Array(X_MAX + 1);
    this.scr = new Int32Array(SCR_SIZE);
    this.mode = "decode";
    this.m = M_DECODE;
    this.q = null;
    this.gear = null; // "mul" | "add" | null — the student's gear (DECODE)
    this.crank = null; // "in" | "out" | null — the quantity on the crank (WIRE)
    this.k = 1;
    this.dial = 0;
    this.labels = {
      gear: "",
      inTag: "",
      outTag: "",
      xAxis: "",
      yAxis: "",
      tape: "",
      table: "",
      delta: "",
      collar: "",
      hx: "x",
      hy: "y",
      tapeX: new Array(X_MAX + 1).fill(""),
      tapeY: new Array(X_MAX + 1).fill(""),
      tblX: new Array(6).fill(""),
      tblY: new Array(6).fill(""),
    };
    this.machineLayer = buildMachineLayer();
    this.graphLayer = buildGraphLayer(10);
  }

  buildControls() {
    const row = this.actionRow();
    this.gearMul = this.button({
      id: "gear-mul",
      label: "gearMul",
      onPress: () => this.setGear("mul"),
    });
    this.gearAdd = this.button({
      id: "gear-add",
      label: "gearAdd",
      onPress: () => this.setGear("add"),
    });
    this.wireA = this.button({ id: "wire-a", label: "wireBlank", onPress: () => this.setWire(0) });
    this.wireB = this.button({ id: "wire-b", label: "wireBlank", onPress: () => this.setWire(1) });
    this.kSlider = this.slider({
      id: "constant",
      label: "constant",
      min: 1,
      max: K_MAX,
      value: 1,
      format: (v) => this.t("fmtK", { v }),
      onInput: (v) => {
        this.k = v;
        this.springs.impulse(S_GEAR, 2);
        this.resetRun();
        this.sync(false);
      },
    });
    this.outSlider = this.slider({
      id: "output",
      label: "output",
      min: 0,
      max: 10,
      value: 0,
      format: (v) => this.t("fmtOut", { v }),
      onInput: (v) => {
        this.dial = v;
        this.springs.setTarget(S_COLLAR, v);
        this.resetRun();
        this.sync(false);
      },
    });
    this.stepBtn = this.button({
      id: "crank-step",
      label: "step",
      onPress: () => this.stepCrank(),
    });
    this.runBtn = this.button({
      id: "run",
      label: "run",
      primary: true,
      onPress: () => this.check(),
      parent: row,
    });
    for (const b of [this.gearMul, this.gearAdd, this.wireA, this.wireB])
      b.setAttribute("aria-pressed", "false");
    this.binders.push(() => {
      if (this.m !== M_WIRE || !this.q) return;
      const first = this.q.inputFirst ? "in" : "out";
      const second = this.q.inputFirst ? "out" : "in";
      this.wireA.textContent = this.t("crankIs", { q: this.t(`${this.q.ctx}_${first}`) });
      this.wireB.textContent = this.t("crankIs", { q: this.t(`${this.q.ctx}_${second}`) });
    });
  }

  newRound(level, next) {
    this.mode = modeFor(this.roundIndex);
    const m = MODE_ID[this.mode];
    this.m = m;
    const step = stepFor(level);
    this.step = step;
    this.q =
      m === M_DECODE
        ? makeDecode(level, next)
        : m === M_PREDICT
          ? makePredict(level, next)
          : makeWire(level, next);
    const q = this.q;
    this.gear = null;
    this.crank = null;
    this.gearMul.hidden = m !== M_DECODE;
    this.gearAdd.hidden = m !== M_DECODE;
    this.wireA.hidden = m !== M_WIRE;
    this.wireB.hidden = m !== M_WIRE;
    this.kSlider.wrap.hidden = m === M_PREDICT;
    this.outSlider.wrap.hidden = m !== M_PREDICT;
    for (const b of [this.gearMul, this.gearAdd, this.wireA, this.wireB])
      b.setAttribute("aria-pressed", "false");
    // Park the constant away from the answer and the output dial at 0 (every output is > 0).
    this.kSlider.setRange(step, K_MAX, step);
    this.k = m === M_PREDICT ? q.rule.k : q.rule.k <= 6 ? K_MAX : step;
    this.kSlider.set(this.k);
    this.outSlider.setRange(0, q.top, step);
    this.dial = 0;
    this.outSlider.set(0);
    this.springs.snap(S_COLLAR, 0);
    this.springs.snap(S_PISTON, 0);
    this.springs.snap(S_GEAR, 0);
    this.f[F_YSCALE] = 390 / q.top;
    this.graphLayer = buildGraphLayer(q.top);
    this.obsMask.fill(0);
    this.obsY.fill(0);
    if (m === M_DECODE) for (const p of q.pairs) this.setObs(p.x, p.y);
    if (m === M_WIRE) this.setObs(q.sx, q.sy);
    this.particles.clear();
    this.resetRun();
    layout(this);
    this.onTier(this.tier);
  }

  setObs(x, y) {
    this.obsMask[x] = 1;
    this.obsY[x] = y;
    this.obsSY[x] = toGY(y, this.f[F_YSCALE]);
  }

  /** Clear the pen trace and tape; the machine waits for a new run. */
  resetRun() {
    this.plotted.fill(0);
    this.obsState.fill(0);
    const s = this.s;
    s[I_RUN] = 0;
    s[I_DONE] = 0;
    s[I_NPLOT] = 0;
    s[I_NEXTPLOT] = 0;
    s[I_STEPX] = -1;
    this.f[F_RUNX] = 0;
    this.f[F_END] = 0;
    this.springs.setTarget(S_PISTON, 0);
    this.labels.delta = "";
  }

  onTier(n) {
    this.stepBtn.hidden = n < 2;
  }

  setGear(op) {
    if (this.solved) return;
    this.gear = op;
    this.gearMul.setAttribute("aria-pressed", String(op === "mul"));
    this.gearAdd.setAttribute("aria-pressed", String(op === "add"));
    this.springs.impulse(S_GEAR, 6);
    this.synth.lock();
    this.resetRun();
    this.sync();
  }

  setWire(button) {
    if (this.solved) return;
    const first = this.q.inputFirst ? "in" : "out";
    const second = this.q.inputFirst ? "out" : "in";
    this.crank = button === 0 ? first : second;
    this.wireA.setAttribute("aria-pressed", String(button === 0));
    this.wireB.setAttribute("aria-pressed", String(button === 1));
    this.synth.lock();
    this.resetRun();
    this.sync();
  }

  /** The rule the machine will actually run: the student's in DECODE/WIRE, the known one in PREDICT. */
  machineRule() {
    if (this.m === M_PREDICT) return this.q.rule;
    if (this.m === M_DECODE) return this.gear ? { op: this.gear, k: this.k } : null;
    return { op: this.q.rule.op, k: this.k };
  }

  /** Load a rule into the run buffers (event time) and build the tape text. */
  loadRule(rule) {
    this.s[I_OP] = rule.op === "mul" ? OP_MUL : OP_ADD;
    this.f[F_K] = rule.k;
    const L = this.labels;
    for (let x = 0; x <= X_MAX; x++) {
      const y = apply(rule, x);
      this.plotY[x] = y;
      this.plotSY[x] = toGY(y, this.f[F_YSCALE]);
      L.tapeX[x] = String(x);
      L.tapeY[x] = numText(y);
    }
  }

  /** Start the crank from 0 to `end`. */
  startRun(rule, end) {
    this.resetRun();
    this.loadRule(rule);
    this.f[F_END] = end;
    this.s[I_RUN] = 1;
    this.synth.impact(0.4);
  }

  /** Tier 2: one turn of the crank at a time, showing how much y changes. */
  stepCrank() {
    if (this.solved || this.s[I_RUN]) return;
    const rule = this.machineRule();
    if (!rule) {
      this.say(this.t("noGear"));
      this.setFeedback(this.t("noGear"));
      return;
    }
    const limit = this.m === M_PREDICT ? this.q.x - 1 : X_MAX;
    let x = this.s[I_STEPX];
    if (x < 0) {
      this.resetRun();
      this.loadRule(rule);
      x = 0;
      this.plotPoint(0);
    }
    if (x >= limit) {
      this.say(this.t(this.m === M_PREDICT ? "stepLast" : "stepEnd"));
      return;
    }
    this.s[I_STEPX] = x + 1;
    this.s[I_NEXTPLOT] = x + 1;
    this.f[F_RUNX] = x;
    this.f[F_END] = x + 1;
    this.s[I_RUN] = 1;
    const d = apply(rule, x + 1) - apply(rule, x);
    this.labels.delta = this.t("delta", { d: numText(d) });
    this.synth.tick();
    this.say(
      this.t("stepSaid", {
        x: x + 1,
        y: numText(apply(rule, x + 1)),
        d: numText(d),
      }),
    );
  }

  evaluate() {
    const q = this.q;
    if (this.m === M_DECODE) {
      const r = judgeDecode(q, this.gear, this.k);
      if (r.verdict === "noGear") return { ok: false, key: "noGear", misconception: "no-rule" };
      this.startRun({ op: this.gear, k: this.k }, X_MAX);
      if (r.verdict === "ok")
        return { ok: true, key: "solvedDecode", vars: { rule: ruleText(q.rule) } };
      if (r.verdict === "wrongGear")
        return {
          ok: false,
          key: "wrongGear",
          misconception:
            q.rule.op === "mul" ? "additive-for-multiplicative" : "multiplicative-for-additive",
        };
      return {
        ok: false,
        key: r.verdict === "high" ? "lineHigh" : "lineLow",
        misconception: "rule-constant",
      };
    }
    if (this.m === M_PREDICT) {
      const r = judgePredict(q, this.dial);
      // A miss stalls the crank one turn short, so the piston never shows the
      // output before it is earned (the reading at x - 1 follows from the shown rule).
      this.startRun(q.rule, r.verdict === "ok" ? q.x : q.x - 1);
      if (r.verdict === "ok")
        return { ok: true, key: "solvedPredict", vars: { x: q.x, y: numText(q.y) } };
      if (r.verdict === "inverse")
        return { ok: false, key: "inverse", misconception: "swapped-variables" };
      if (r.verdict === "otherOp")
        return {
          ok: false,
          key: q.rule.op === "mul" ? "otherMul" : "otherAdd",
          misconception:
            q.rule.op === "mul" ? "additive-for-multiplicative" : "multiplicative-for-additive",
        };
      return {
        ok: false,
        key: r.verdict === "high" ? "predictHigh" : "predictLow",
        misconception: "evaluate-rule",
      };
    }
    const r = judgeWire(q, this.crank, this.k);
    if (r.verdict === "noWire") return { ok: false, key: "noWire", misconception: "no-wiring" };
    if (r.verdict === "swapped")
      return { ok: false, key: "wireSwapped", misconception: "swapped-variables" };
    this.startRun({ op: q.rule.op, k: this.k }, X_MAX);
    if (r.verdict === "ok")
      return {
        ok: true,
        key: "solvedWire",
        vars: { in: this.t(`${q.ctx}_in`), out: this.t(`${q.ctx}_out`), rule: ruleText(q.rule) },
      };
    return {
      ok: false,
      key: r.verdict === "high" ? "wireHigh" : "wireLow",
      misconception: "rule-constant",
    };
  }

  onSolved() {
    this.synth.lock();
    this.particles.emit(560, 260, 40, 260, 2, UP, ALL_AROUND, 1.1);
  }

  /** Plot integer input i (called from the fixed step: no allocation). */
  plotPoint(i) {
    // PREDICT never draws the target point until it is earned.
    if (this.m === M_PREDICT && i === this.q.x && !this.solved) return;
    this.plotted[i] = 1;
    this.s[I_NPLOT]++;
    if (this.obsMask[i] === 1) {
      if (this.plotY[i] === this.obsY[i]) {
        this.obsState[i] = 1;
      } else {
        this.obsState[i] = 2;
        this.particles.emit(
          toGX(i) | 0,
          this.obsSY[i] | 0,
          14,
          200,
          3,
          UP,
          ALL_AROUND,
          0.7,
        );
      }
    }
  }

  updatePhysics(_dt) {
    const s = this.s;
    const f = this.f;
    f[F_T] += DT;
    if (s[I_RUN] === 1) {
      let x = f[F_RUNX] + DT * RUN_SPEED;
      if (this.reducedMotion) x = f[F_END];
      if (x >= f[F_END]) {
        x = f[F_END];
        s[I_RUN] = 0;
        s[I_DONE] = 1;
      }
      while (s[I_NEXTPLOT] <= x && s[I_NEXTPLOT] <= X_MAX) {
        this.plotPoint(s[I_NEXTPLOT]);
        s[I_NEXTPLOT]++;
      }
      f[F_RUNX] = x;
      this.springs.target[S_PISTON] = s[I_OP] === OP_MUL ? f[F_K] * x : x + f[F_K];
    }
    this.springs.step(DT);
    this.particles.update(DT);
    layout(this);
  }

  refreshLabels() {
    const q = this.q;
    if (!q) return;
    const L = this.labels;
    const m = this.m;
    const rule = this.machineRule();
    L.gear = !rule ? "?" : rule.op === "mul" ? `× ${numText(rule.k)}` : `+ ${numText(rule.k)}`;
    L.tape = this.t("tape");
    L.table = this.t("table");
    L.collar = numText(this.dial);
    if (m === M_DECODE) {
      L.inTag = this.t("inputX");
      L.outTag = this.t("outputY");
      L.xAxis = "x";
      L.yAxis = "y";
    } else if (m === M_PREDICT && !q.ctx) {
      L.inTag = this.t("inputX");
      L.outTag = this.t("outputY");
      L.xAxis = "x";
      L.yAxis = "y";
    } else if (m === M_PREDICT) {
      L.inTag = this.t(`${q.ctx}_in`);
      L.outTag = this.t(`${q.ctx}_out`);
      L.xAxis = L.inTag;
      L.yAxis = L.outTag;
    } else {
      const unk = this.t("unwired");
      L.inTag = this.crank ? this.t(`${q.ctx}_${this.crank}`) : unk;
      L.outTag = this.crank ? this.t(`${q.ctx}_${this.crank === "in" ? "out" : "in"}`) : unk;
      L.xAxis = L.inTag;
      L.yAxis = L.outTag;
    }
    // Tier 1 table: the known rows plus an empty row for the next input (never its value).
    let n = 0;
    const row = (x, y) => {
      L.tblX[n] = String(x);
      L.tblY[n] = y;
      n++;
    };
    if (m === M_DECODE) {
      for (const p of q.pairs) row(p.x, numText(p.y));
      row(q.nextX, "?");
    } else if (m === M_PREDICT) {
      for (let x = 1; x <= 3; x++) row(x, numText(apply(q.rule, x)));
      row(q.x, "?");
    } else {
      row(q.sx, numText(q.sy));
      row(q.sx + 1, "?");
    }
    this.s[I_TBL] = n;
  }

  pairsText() {
    return this.q.pairs.map((p) => `(${p.x}, ${numText(p.y)})`).join(", ");
  }

  gearName() {
    return this.t(
      this.gear === "mul" ? "gearMulName" : this.gear === "add" ? "gearAddName" : "gearNone",
    );
  }

  describe() {
    const q = this.q;
    if (!q) return "";
    if (this.m === M_DECODE)
      return this.t("descDecode", {
        pairs: this.pairsText(),
        gear: this.gearName(),
        k: numText(this.k),
      });
    if (this.m === M_PREDICT)
      return this.t("descPredict", { rule: this.ruleSentence(), x: q.x, d: numText(this.dial) });
    const unk = this.t("unwired");
    return this.t("descWire", {
      sample: this.t(`${q.ctx}_sample`, { x: q.sx, y: numText(q.sy) }),
      crank: this.crank ? this.t(`${q.ctx}_${this.crank}`) : unk,
      piston: this.crank ? this.t(`${q.ctx}_${this.crank === "in" ? "out" : "in"}`) : unk,
      gear: this.t(q.rule.op === "mul" ? "gearMulName" : "gearAddName"),
      k: numText(this.k),
    });
  }

  ruleSentence() {
    const q = this.q;
    return q.ctx ? this.t(`${q.ctx}_rule`, { k: numText(q.rule.k) }) : ruleText(q.rule);
  }

  mission() {
    const q = this.q;
    if (this.m === M_DECODE) return this.t("missionDecode", { pairs: this.pairsText() });
    if (this.m === M_PREDICT) {
      if (!q.ctx) return this.t("missionPredict", { rule: ruleText(q.rule), x: q.x });
      return this.t("missionPredictCtx", {
        rule: this.ruleSentence(),
        x: q.x,
        in: this.t(`${q.ctx}_in`),
        out: this.t(`${q.ctx}_out`),
      });
    }
    return this.t("missionWire", {
      sample: this.t(`${q.ctx}_sample`, { x: q.sx, y: numText(q.sy) }),
      gear: this.t(q.rule.op === "mul" ? "gearMulName" : "gearAddName"),
    });
  }

  testPlan() {
    const q = this.q;
    const st = this.step;
    const dial = (control, value, min) => [
      { control, key: "Home" },
      { control, key: "ArrowRight", times: Math.round((value - min) / st) },
    ];
    if (this.m === M_DECODE)
      return [
        { control: q.rule.op === "mul" ? "gear-mul" : "gear-add", key: "Enter" },
        ...dial("constant", q.rule.k, st),
        { control: "run", key: "Enter" },
      ];
    if (this.m === M_PREDICT) return [...dial("output", q.y, 0), { control: "run", key: "Enter" }];
    return [
      { control: q.inputFirst ? "wire-a" : "wire-b", key: "Enter" },
      ...dial("constant", q.rule.k, st),
      { control: "run", key: "Enter" },
    ];
  }

  renderScene(ctx) {
    renderAll(this, ctx);
  }
}

define("ew-flux-plotter", FluxFoundry);

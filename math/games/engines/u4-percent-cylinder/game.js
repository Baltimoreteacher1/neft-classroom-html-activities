// Calibration Cylinder — Unit 4: Percent (6.AT.4; lessons 4-1 to 4-5).
//
// The percent IS the fluid level. A pressure cylinder carries a fixed 100-mark
// scale. Calibrate: place-value wheels (tenths, hundredths, thousandths) move
// the fluid live, so 3/5 has to become 6 tenths before the level matches.
// Part: the plate says the cylinder holds N units; the valve meters units, and
// only p% of N lands the surface on the lit p% mark. Whole: a known part must
// sit on the p% mark; the capacity dial re-stretches the unit ruler beside the
// glass, and the part settles at P/C of the height when it is poured.
// Part and Whole commit on the pour, so dragging a slider never paints the answer.

import { EduWonderEngine, define } from "../core/engine.js";
import { decText } from "../core/math.js";
import { ParticlePool } from "../core/particles.js";
import { SpringBank } from "../core/spring.js";
import {
  CAP_MAX,
  CAP_MIN,
  formText,
  fractionText,
  judgeCalibrate,
  judgePart,
  judgeWhole,
  makeRound,
  modeForRound,
  percentText,
  thouText,
} from "./math.js";
import { BOTTOM, CH, CW, CX, CY, drawScene, initLayers, S_CAP, S_LEVEL, S_VALVE, SPRINGS } from "./render.js";
import { STRINGS } from "./strings.js";

class PercentCylinder extends EduWonderEngine {
  static meta = {
    gameId: "u4-percent-cylinder",
    unit: 4,
    lessons: ["4-1", "4-2", "4-3", "4-4", "4-5"],
    checkId: "lock",
  };

  static strings = STRINGS;

  initWorld() {
    initLayers();
    this.springs = new SpringBank(SPRINGS);
    this.particles = new ParticlePool(240, ["#46c2b8", "#8be8de", "#7bdc8f", "#ff6b6b", "#ffd166"]);
    if (this.reducedMotion) {
      this.particles.scale = 0;
      this.springs.omega = 40;
    }
    this.mode = "calibrate";
    this.q = null;
    this.lamp = 0;
    this.stKey = "stIdle";
    this.poured = false;
    this.ranValue = 0;
    this.b10 = 0;
    this.b1 = 0;
    this.labels = {
      lensTitle: "",
      lens0: "",
      lens1: "",
      lens2: "",
      plate0: "",
      plate1: "",
      plate2: "",
      pMark: "",
      flask: "",
      blocks: "",
      block10: "",
      block1: "",
    };
  }

  buildControls() {
    const wheel = (id, label, unit) =>
      this.slider({
        id,
        label,
        min: 0,
        max: 9,
        value: 0,
        format: (v) => this.t(unit, { n: v }),
        onInput: () => this.wheelMoved(),
      });
    this.tenths = wheel("tenths", "tenths", "tenthsV");
    this.hundredths = wheel("hundredths", "hundredths", "hundredthsV");
    this.thousandths = wheel("thousandths", "thousandths", "thousandthsV");
    const units = (v) => (v === 1 ? this.t("oneUnit") : this.t("unitsV", { n: v }));
    this.valve = this.slider({
      id: "valve",
      label: "valve",
      min: 0,
      max: 100,
      value: 0,
      format: units,
      onInput: (v) => {
        this.springs.setTarget(S_VALVE, v * 0.2);
        this.sync(false);
      },
    });
    this.capacity = this.slider({
      id: "capacity",
      label: "capacity",
      min: CAP_MIN,
      max: CAP_MAX,
      value: CAP_MIN,
      format: units,
      onInput: (v) => {
        this.springs.setTarget(S_CAP, v);
        this.springs.setTarget(S_VALVE, v * 0.2);
        this.sync(false);
      },
    });
    this.add10Btn = this.button({ id: "add10", label: "add10", onPress: () => this.addBlock(10) });
    this.add1Btn = this.button({ id: "add1", label: "add1", onPress: () => this.addBlock(1) });
    this.clearBtn = this.button({
      id: "clear-blocks",
      label: "clearBlocks",
      onPress: () => this.clearBlocks(),
    });
    this.lockBtn = this.button({
      id: "lock",
      label: "lock",
      primary: true,
      onPress: () => this.check(),
    });
    this.binders.push(() => {
      const k = { calibrate: "lock", part: "open", whole: "pour" };
      this.lockBtn.textContent = this.t(k[this.mode]);
    });
  }

  val(id) {
    return Number(/** @type {HTMLInputElement} */ (this.controls.get(id)).value);
  }

  /** The calibrate setting in integer thousandths. */
  level1000() {
    return (
      this.val("tenths") * 100 +
      this.val("hundredths") * 10 +
      (this.q && this.q.thou ? this.val("thousandths") : 0)
    );
  }

  layout() {
    const m = this.mode;
    const cal = m === "calibrate";
    this.tenths.wrap.hidden = !cal;
    this.hundredths.wrap.hidden = !cal;
    this.thousandths.wrap.hidden = !(cal && this.q && this.q.thou);
    this.valve.wrap.hidden = m !== "part";
    this.capacity.wrap.hidden = m !== "whole";
    const t2 = this.tier >= 2;
    this.add10Btn.hidden = !t2;
    this.add1Btn.hidden = !t2;
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
    this.lamp = 0;
    this.stKey = "stIdle";
    this.poured = false;
    this.ranValue = 0;
    this.b10 = 0;
    this.b1 = 0;
    this.tenths.set(0);
    this.hundredths.set(0);
    this.thousandths.set(0);
    if (q.mode === "part") {
      this.valve.setRange(0, q.N, 1);
      this.valve.set(0);
    }
    this.capacity.set(CAP_MIN);
    if (q.mode === "whole") this.springs.snap(S_CAP, CAP_MIN);
    this.layout();
  }

  // ---------- student actions ----------
  wheelMoved() {
    this.springs.setTarget(S_LEVEL, this.level1000() / 1000);
    this.springs.setTarget(S_VALVE, this.level1000() * 0.01);
    this.lamp = 0;
    this.sync(false);
  }

  /** Tier 2: stack a concrete 10% or 1% block. In calibrate the blocks ARE the fill. */
  addBlock(size) {
    if (this.solved) return;
    const total = this.b10 * 10 + this.b1 + size;
    if (total > 99) return;
    this.b10 = (total / 10) | 0;
    this.b1 = total % 10;
    if (this.mode === "calibrate") {
      this.tenths.set(this.b10);
      this.hundredths.set(this.b1);
      this.wheelMoved();
    }
    this.particles.emit(623, BOTTOM - (CH * total) / 100, 6, 90, 4);
    this.synth.lock();
    this.sync();
  }

  clearBlocks() {
    if (this.solved) return;
    this.b10 = 0;
    this.b1 = 0;
    this.sync();
  }

  evaluate() {
    const q = this.q;
    if (q.mode === "calibrate") {
      const v = this.level1000();
      this.ranValue = v;
      const r = judgeCalibrate(q, v);
      const target = formText(q.T, q.form);
      this.lamp = r === "ok" ? 1 : 2;
      this.stKey = r === "ok" ? "stOk" : v > q.T ? "stHigh" : "stLow";
      this.synth.impact(0.3);
      if (r === "ok") {
        const forms = `${fractionText(q.T)} = ${thouText(q.T)} = ${percentText(q.T)}`;
        return { ok: true, key: "solvedCal", vars: { target, forms } };
      }
      if (r === "shift")
        return { ok: false, key: "shiftLow", misconception: "percent-place-value" };
      if (r === "numTenths")
        return {
          ok: false,
          key: v > q.T ? "numHigh" : "numLow",
          misconception: "numerator-as-tenths",
        };
      return {
        ok: false,
        key: r === "high" ? "calHigh" : "calLow",
        misconception: "decimal-place-value",
      };
    }
    if (q.mode === "part") {
      const v = this.val("valve");
      this.pourTo(v / q.N, v);
      const r = judgePart(q, v);
      const high = v * 100 > q.exact100;
      this.lamp = r === "ok" ? 1 : 2;
      this.stKey = r === "ok" ? "stOk" : high ? "stHigh" : "stLow";
      const vars = { p: q.p, N: q.N, v };
      if (r === "ok")
        return { ok: true, key: q.variant === "estimate" ? "solvedEst" : "solvedPart", vars };
      if (q.variant === "estimate")
        return {
          ok: false,
          key: high ? "estHigh" : "estLow",
          misconception: "estimate-percent",
          vars,
        };
      if (r === "pctAsUnits")
        return {
          ok: false,
          key: high ? "pctHigh" : "pctLow",
          misconception: "percent-as-amount",
          vars,
        };
      if (r === "complement")
        return {
          ok: false,
          key: high ? "compHigh" : "compLow",
          misconception: "percent-complement",
          vars,
        };
      return {
        ok: false,
        key: high ? "partHigh" : "partLow",
        misconception: "percent-of-number",
        vars,
      };
    }
    const c = this.val("capacity");
    this.pourTo(q.P / c, c);
    const r = judgeWhole(q, c);
    this.lamp = r === "ok" ? 1 : 2;
    const big = c * q.p > 100 * q.P;
    this.stKey = r === "ok" ? "stOk" : big ? "stBig" : "stSmall";
    const vars = { p: q.p, P: q.P, C: c };
    if (r === "ok") return { ok: true, key: "solvedWhole", vars };
    if (r === "times")
      return { ok: false, key: "timesLow", misconception: "multiplied-not-divided", vars };
    if (r === "partAsWhole")
      return { ok: false, key: "partWholeLow", misconception: "part-as-whole", vars };
    return {
      ok: false,
      key: big ? "wholeHigh" : "wholeLow",
      misconception: "whole-from-part",
      vars,
    };
  }

  /** Commit a pour: the fluid springs to fraction f of the glass. */
  pourTo(f, v) {
    this.poured = true;
    this.ranValue = v;
    this.springs.setTarget(S_LEVEL, f);
    this.springs.impulse(S_VALVE, 6);
    this.synth.impact(Math.min(1, f));
    this.particles.emit(CX + CW / 2, BOTTOM - 10, 16, 140, 1);
    // Overfilled: the surplus spills over both lips once, at pour time.
    if (f > 1) {
      this.particles.emit(CX + CW, CY, 24, 160, 0, -0.4, 0.8, 1);
      this.particles.emit(CX, CY, 24, 160, 0, -2.7, 0.8, 1);
    }
  }

  onSolved() {
    this.particles.emit(CX + CW / 2, CY + 20, 40, 260, 2, -Math.PI / 2, Math.PI * 1.6, 1.1);
    this.sync(false);
  }

  onMiss() {
    this.particles.emit(CX + CW / 2, CY + 40, 12, 150, 3);
  }

  updatePhysics(dt) {
    this.springs.step(dt);
    this.particles.update(dt);
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
    const unk = this.t("unknown");
    L.lensTitle = this.t("lensTitle");
    L.blocks = this.t("blocks", { n: this.b10 * 10 + this.b1 });
    if (q.mode === "calibrate") {
      const done = this.solved;
      const show = (form) => (done || q.form === form ? formText(q.T, form) : unk);
      L.lens0 = this.t("lensFraction", { v: show("fraction") });
      L.lens1 = this.t("lensDecimal", { v: show("decimal") });
      L.lens2 = this.t("lensPercent", { v: show("percent") });
      L.plate0 = this.t("plateTenths", { n: this.val("tenths") });
      L.plate1 = this.t("plateHundredths", { n: this.val("hundredths") });
      L.plate2 = q.thou ? this.t("plateThousandths", { n: this.val("thousandths") }) : "";
      L.block10 = this.t("block10Cal");
      L.block1 = this.t("block1Cal");
      L.pMark = "";
      L.flask = "";
    } else if (q.mode === "part") {
      L.lens0 = this.t("lensPart", { p: q.p, N: q.N });
      L.lens1 = this.t("lensPartIs", { v: this.solved ? this.ranValue : unk });
      L.lens2 = "";
      L.plate0 = this.t("plateCap", { n: q.N });
      L.plate1 = this.t("plateValve", { n: this.val("valve") });
      L.plate2 = q.variant === "estimate" ? this.t("plateTol") : "";
      L.block10 = this.t("block10Ten");
      L.block1 = this.t("block1", { u: decText(q.N / 100) });
      L.pMark = `${q.p}%`;
      L.flask = "";
    } else {
      L.lens0 = this.t("lensWholeA", { P: q.P, p: q.p });
      L.lens1 = this.t("lensWholeB", { v: this.solved ? q.C : unk });
      L.lens2 = "";
      L.plate0 = this.t("platePart", { n: q.P });
      L.plate1 = this.t("plateDial", { n: this.val("capacity") });
      L.plate2 = "";
      L.block10 = this.t("block10Ten");
      L.block1 = this.t("block1", { u: decText(q.P / q.p) });
      L.pMark = `${q.p}%`;
      L.flask = this.t("flask", { n: q.P });
    }
  }

  describe() {
    const q = this.q;
    if (!q) return "";
    const state = this.t(this.stKey);
    if (q.mode === "calibrate") {
      return this.t("descCal", {
        lv: thouText(this.level1000()),
        t: this.val("tenths"),
        h: this.val("hundredths"),
        th: q.thou ? this.val("thousandths") : 0,
        target: formText(q.T, q.form),
        state,
      });
    }
    if (q.mode === "part")
      return this.t("descPart", { N: q.N, p: q.p, v: this.val("valve"), state });
    return this.t("descWhole", { P: q.P, p: q.p, C: this.val("capacity"), state });
  }

  mission() {
    const q = this.q;
    if (q.mode === "calibrate") return this.t("missionCal", { target: formText(q.T, q.form) });
    if (q.mode === "part")
      return this.t(q.variant === "estimate" ? "missionEst" : "missionPart", { p: q.p, N: q.N });
    return this.t("missionWhole", { P: q.P, p: q.p });
  }

  testPlan() {
    const q = this.q;
    if (q.mode === "calibrate") {
      const plan = [
        { control: "tenths", key: "Home" },
        { control: "tenths", key: "ArrowRight", times: (q.T / 100) | 0 },
        { control: "hundredths", key: "Home" },
        { control: "hundredths", key: "ArrowRight", times: ((q.T / 10) | 0) % 10 },
      ];
      if (q.thou)
        plan.push(
          { control: "thousandths", key: "Home" },
          { control: "thousandths", key: "ArrowRight", times: q.T % 10 },
        );
      plan.push({ control: "lock", key: "Enter" });
      return plan;
    }
    if (q.mode === "part")
      return [
        { control: "valve", key: "Home" },
        { control: "valve", key: "ArrowRight", times: Math.round(q.exact100 / 100) },
        { control: "lock", key: "Enter" },
      ];
    return [
      { control: "capacity", key: "Home" },
      { control: "capacity", key: "ArrowRight", times: q.C - CAP_MIN },
      { control: "lock", key: "Enter" },
    ];
  }
}

define("ew-percent-cylinder", PercentCylinder);

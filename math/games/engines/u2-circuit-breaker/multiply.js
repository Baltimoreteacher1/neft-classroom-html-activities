// Circuit Breaker MULTIPLY mode (lesson 2-12, 6.NOS.3): the controller half.
// The grid feeds both factors in with their grounding bars removed and
// multiplies whole currents. The student counts each factor's decimal places,
// slides the product's grounding bar into place and closes the circuit.
// Functions take the engine `e`; game.js owns the round flow.

import { staticLayer } from "../core/draw.js";
import { H, W } from "../core/engine.js";
import {
  estimateRange,
  fixedText,
  judgeMultiply,
  MAX_COUNT,
  makeMultiply,
  REG,
  trimText,
} from "./math.js";
import * as M from "./render-multiply.js";

/** Allocate every multiply buffer once (called from initWorld). */
export function initMultiply(e) {
  e.reg = new Int8Array(REG);
  e.fa = new Int8Array(REG);
  e.fb = new Int8Array(REG);
  e.ghost = new Int16Array(3); // removed-point marks for A, B; x of the × sign
  e.gaugeX = new Int16Array(3);
  e.trayPoint = new Int8Array(2);
  e.trayA = [];
  e.trayB = [];
  e.regLead = REG;
  e.pointVal = 0;
  e.lit = 0;
  e.dpA = 0;
  e.arc = 0;
  Object.assign(e.labels, {
    fa: "",
    fb: "",
    ca: "",
    cb: "",
    tally: "",
    reading: "",
    regCaption: "",
    gauge: "",
    trayCount: "",
  });
  e.layers.mult = staticLayer(W, H, M.paintMultiply);
  e.layers.gauge = staticLayer(W, H, M.paintGauge);
}

function countText(e, n) {
  return e.t(n === 1 ? "placeOne" : "placeMany", { n });
}

/** Valuetext for the product's grounding bar. */
export function barText(e, n) {
  return e.t(n === 0 ? "barNone" : n === 1 ? "barOne" : "barMany", { n });
}

/** Native controls for the mode; returns the elements to show only in this mode. */
export function buildMultiplyControls(e) {
  const counter = (id, label) =>
    e.slider({
      id,
      label,
      min: 0,
      max: MAX_COUNT,
      value: 0,
      format: (v) => countText(e, v),
      onInput: () => {
        e.arc = 0;
        e.sync();
      },
    });
  e.countA = counter("places-a", "countA");
  e.countB = counter("places-b", "countB");
  e.point = e.slider({
    id: "point",
    label: "pointBar",
    min: 0,
    max: REG - 1,
    value: 0,
    format: (v) => barText(e, v),
    onInput: (v) => {
      e.pointVal = v;
      e.arc = 0;
      e.springs.setTarget(M.S_BAR, v);
      e.particles.emit((M.REG_RIGHT - v * M.SLOT) | 0, M.ROW_REG, 8, 140, 0);
      e.sync();
    },
  });
  e.countBtn = e.button({ id: "count-place", label: "countPlace", onPress: () => countPlace(e) });
  return [e.countA.wrap, e.countB.wrap, e.point.wrap];
}

/** Lay digits right-aligned into register slots (-1 = empty). */
function fill(slots, w) {
  const s = String(w);
  slots.fill(-1);
  for (let i = 0; i < s.length; i++) slots[REG - s.length + i] = s.charCodeAt(i) - 48;
}

/** Set up a multiply round. */
export function startMultiply(e, level, next) {
  const r = makeMultiply(level, next);
  e.round = r;
  fill(e.fa, r.a.w);
  fill(e.fb, r.b.w);
  const p = String(r.whole).padStart(REG, "0");
  for (let k = 0; k < REG; k++) e.reg[k] = p.charCodeAt(k) - 48;
  e.regLead = REG - String(r.whole).length;
  e.ghost[0] = r.a.dp ? M.REG_RIGHT - r.a.dp * M.SLOT : 0;
  e.ghost[1] = r.b.dp ? M.REG_RIGHT - r.b.dp * M.SLOT : 0;
  e.ghost[2] = M.slotX(REG - String(Math.max(r.a.w, r.b.w)).length) - 48;
  const ta = fixedText(r.a.w, r.a.dp);
  const tb = fixedText(r.b.w, r.b.dp);
  e.trayA = ta.split("");
  e.trayB = tb.split("");
  e.trayPoint[0] = ta.indexOf(".");
  e.trayPoint[1] = tb.indexOf(".");
  e.dpA = r.a.dp;
  e.lit = 0;
  e.arc = 0;
  e.countA.set(r.park);
  e.countB.set(r.park);
  e.point.set(r.park);
  e.pointVal = r.park;
  const sp = e.springs;
  sp.snap(M.S_BAR, r.park);
  sp.snap(M.S_ARC, 0);
  // The whole-number product flows into the register, last digit first.
  for (let k = 0; k < REG; k++) {
    sp.snap(M.S_REG + k, -120 - (REG - k) * 36);
    sp.setTarget(M.S_REG + k, 0);
  }
  e.particles.emit(M.slotX(REG - 1), M.ROW_REG - 40, 24, 200, 1, Math.PI / 2, Math.PI * 0.8, 0.8);
}

/** Tier 2: light the next decimal place of the factors, one at a time. */
function countPlace(e) {
  const r = e.round;
  if (e.solved || e.mode !== "multiply") return;
  if (e.lit >= r.places) {
    e.say(e.t("allCounted"));
    return;
  }
  e.lit++;
  const inA = e.lit <= r.a.dp;
  const f = inA ? r.a : r.b;
  e.synth.lock();
  const row = inA ? M.TRAY_A : M.TRAY_B;
  const ord = inA ? e.lit : e.lit - r.a.dp;
  const point = e.trayPoint[inA ? 0 : 1];
  e.particles.emit(M.TRAY_X0 + (point + ord) * M.TRAY_STEP, row, 10, 140, 0);
  e.say(e.t("countedPlace", { f: fixedText(f.w, f.dp), n: e.lit }));
  e.sync(false);
}

const MISS_TAG = {
  countZero: "dropped-trailing-zero",
  countOne: "places-from-one-factor",
  countHigh: "places-miscounted",
  countLow: "places-miscounted",
  aligned: "point-aligned-like-addition",
  oneFactor: "places-from-one-factor",
  droppedZero: "dropped-trailing-zero",
  misplaced: "point-misplaced",
};

/** evaluate() for the mode: { ok, key, misconception?, vars? }. */
export function evaluateMultiply(e) {
  const r = e.round;
  const j = judgeMultiply(
    r,
    Number(e.countA.input.value),
    Number(e.countB.input.value),
    Number(e.point.input.value),
  );
  const fa = fixedText(r.a.w, r.a.dp);
  const fb = fixedText(r.b.w, r.b.dp);
  if (j.verdict === "ok") {
    const p = fixedText(r.whole, r.places);
    const q = trimText(r.whole, r.places);
    return {
      ok: true,
      key: p === q ? "solvedMultiply" : "solvedMultiplyZero",
      vars: { a: fa, b: fb, p, q },
    };
  }
  if (j.verdict.startsWith("count")) {
    const f = j.factor === "a" ? fa : fb;
    const side = j.factor === "a" ? "A" : "B";
    const key =
      j.verdict === "countHigh" || j.verdict === "countLow" ? `${j.verdict}${side}` : j.verdict;
    return { ok: false, key, misconception: MISS_TAG[j.verdict], vars: { f } };
  }
  const over = j.verdict === "overload";
  e.arc = over ? 1 : -1;
  e.springs.impulse(M.S_ARC, 8);
  e.particles.emit(M.slotX(REG / 2), M.ROW_REG, over ? 40 : 16, over ? 300 : 120, 3);
  const key = over && j.cause !== "misplaced" ? j.cause : over ? "overload" : "brownout";
  return { ok: false, key, misconception: MISS_TAG[j.cause] };
}

function gaugeX(v) {
  if (v <= 0) return M.GX0;
  const x = M.GX0 + (Math.log10(v) + 3) * M.GSTEP;
  return Math.max(M.GX0, Math.min(M.GX0 + 9 * M.GSTEP, x)) | 0;
}

/** refreshLabels() for the mode (event time: allocation is fine here). */
export function multiplyLabels(e) {
  const r = e.round;
  const L = e.labels;
  const ca = Number(e.countA.input.value);
  const cb = Number(e.countB.input.value);
  const pos = Number(e.point.input.value);
  L.fa = fixedText(r.a.w, r.a.dp);
  L.fb = `× ${fixedText(r.b.w, r.b.dp)}`;
  L.ca = e.t("counterPlate", { n: ca });
  L.cb = e.t("counterPlate", { n: cb });
  L.tally = e.t("tally", { a: ca, b: cb, t: ca + cb });
  L.reading = e.t("outputReads", { v: fixedText(r.whole, pos) });
  L.regCaption = e.t("regCaption");
  const est = estimateRange(r);
  L.gauge = e.t(est.lo === 0 ? "estimateBelow" : "estimateRange", { lo: est.lo, hi: est.hi });
  e.gaugeX[0] = gaugeX(est.lo);
  e.gaugeX[1] = gaugeX(est.hi);
  e.gaugeX[2] = gaugeX(r.whole / 10 ** pos);
  L.trayCount =
    e.lit >= r.places
      ? e.t("trayDone", { a: r.a.dp, b: r.b.dp, n: r.places })
      : e.t("trayCount", { n: e.lit });
}

/** describe() for the mode. */
export function describeMultiply(e) {
  const r = e.round;
  const L = e.labels;
  const pos = Number(e.point.input.value);
  let s = e.t("descMultiply", {
    a: fixedText(r.a.w, r.a.dp),
    b: fixedText(r.b.w, r.b.dp),
    wa: String(r.a.w),
    wb: String(r.b.w),
    w: String(r.whole),
    ca: countText(e, Number(e.countA.input.value)),
    cb: countText(e, Number(e.countB.input.value)),
    pos: barText(e, pos),
    v: fixedText(r.whole, pos),
  });
  if (e.tier >= 1) s += ` ${L.gauge}.`;
  if (e.tier >= 2) s += ` ${L.trayCount}.`;
  return s;
}

export function multiplyMission(e) {
  const r = e.round;
  return e.t("missionMultiply", { a: fixedText(r.a.w, r.a.dp), b: fixedText(r.b.w, r.b.dp) });
}

/** Keyboard plan that solves the round from its starting state. */
export function multiplyPlan(e) {
  const r = e.round;
  const plan = [];
  const set = (control, n) => {
    plan.push({ control, key: "Home" });
    if (n) plan.push({ control, key: "ArrowRight", times: n });
  };
  set("places-a", r.a.dp);
  set("places-b", r.b.dp);
  set("point", r.places);
  plan.push({ control: "close", key: "Enter" });
  return plan;
}

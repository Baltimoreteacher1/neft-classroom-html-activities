// Aero-Torque Balance Platform — Unit 8: Equations and Inequalities.
//
// The equation IS the craft. Canisters of unknown mass x and iron weights sit
// on two pans of a hover-craft beam; the beam's pitch is the net torque
// (left total − right total). The craft starts level because the equation is
// true. Removing weights or splitting into groups changes the torque: do it to
// one side only and the craft pitches and the low thruster smokes. Solve by
// keeping it level until x is alone, then calibrate the canister dial.
// Every third machine is a containment deck: set the boundary thruster, sweep
// direction and node so the laser field holds exactly the solutions.

import { EduWonderEngine, H, W, define } from "../core/engine.js";
import { alphaLevel, dot, line, Pivot, rect, ring, roundRect, staticLayer, text } from "../core/draw.js";
import { ParticlePool } from "../core/particles.js";
import { SpringBank } from "../core/spring.js";
import {
  equationText,
  inequalityText,
  judgeField,
  makeEquation,
  makeInequality,
  satisfies,
} from "./math.js";

const PIVOT_X = W / 2;
const PIVOT_Y = 250;
const ARM = 300;
const LINE_Y = 430;
const LINE_X0 = 80;
const LINE_X1 = 880;
const LINE_MAX = 20;
const PROBES = 21; // integer probes 0..20
const S_ANGLE = 0;
const S_FIELD = 1;
const S_BOUND = 2;
const GAUGE_Y = PIVOT_Y + 120;
const HALF_PI = Math.PI / 2;
const DT = 1 / 60;
const HALF_W = W / 2;
const ARC_FROM = Math.PI * 1.15;
const ARC_TO = Math.PI * 1.85;

class AeroTorque extends EduWonderEngine {
  static meta = {
    gameId: "u8-aero-torque",
    unit: 8,
    lessons: ["8-1", "8-2", "8-3", "8-4", "8-5", "8-6", "8-7"],
    checkId: "confirm",
  };

  static strings = {
    en: {
      title: "Aero-Torque Balance Platform",
      missionEq:
        "The craft is level because both sides are equal: {eq}. Keep it level while you get canister x alone, then set the x dial to its mass.",
      missionIneq:
        "Containment deck: {ineq}. Set the boundary, the sweep direction and the node so the laser field holds every solution and nothing else.",
      amount: "Weights to remove",
      divisor: "Split into equal groups",
      dial: "Canister x dial",
      boundary: "Boundary thruster",
      removeLeft: "Remove from left",
      removeRight: "Remove from right",
      removeBoth: "Remove from both",
      splitBoth: "Split both sides",
      pair: "Pair off one each",
      reset: "Reload machine",
      sweepRight: "Field sweeps right",
      sweepLeft: "Field sweeps left",
      nodeClosed: "Closed node (boundary included)",
      nodeOpen: "Open node (boundary not included)",
      confirm: "Confirm x",
      engage: "Engage field",
      tooFew: "That pan holds only {n} weights.",
      sealed: "Canisters are sealed. Split only into groups that share the canisters evenly.",
      tilted:
        "The craft is pitching: the two sides are no longer equal. Whatever you do to one side, do to the other.",
      notIsolated: "Canister x is not alone yet. Remove or split until only one x is on its pan.",
      high: "The canister is lighter than your dial setting. Your x is too high.",
      low: "The canister is heavier than your dial setting. Your x is too low.",
      solvedEq: "Level flight! x = {x} makes {eq} true.",
      boundaryHigh: "Probes near the boundary are wrong: your boundary is too far right.",
      boundaryLow: "Probes near the boundary are wrong: your boundary is too far left.",
      direction: "The field holds values that make it false. Check which way it sweeps.",
      node: "Check the node: is the boundary value itself a solution?",
      solvedIneq: "Contained! Every value in the field makes {ineq} true.",
      leftPan: "Left pan",
      rightPan: "Right pan",
      descEq: "Craft {pitch}. Left pan: {lc} canisters and {lw} weights. Right pan: {rw} weights.",
      descIneq: "Number deck 0 to 20. Boundary at {b}, {node} node, field sweeps {dir}.",
      levelPitch: "level",
      tiltLeft: "tilted down on the left",
      tiltRight: "tilted down on the right",
      open: "open",
      closed: "closed",
      right: "right",
      left: "left",
      exprLeft: "{expr}",
      torque: "Torque {t}",
    },
    es: {
      title: "Plataforma de equilibrio Aero-Torque",
      missionEq:
        "La nave está nivelada porque los dos lados son iguales: {eq}. Mantenla nivelada mientras dejas sola la lata x y luego ajusta el dial de x a su masa.",
      missionIneq:
        "Plataforma de contención: {ineq}. Ajusta el límite, la dirección del barrido y el nodo para que el campo láser contenga todas las soluciones y nada más.",
      amount: "Pesas para quitar",
      divisor: "Dividir en grupos iguales",
      dial: "Dial de la lata x",
      boundary: "Propulsor del límite",
      removeLeft: "Quitar a la izquierda",
      removeRight: "Quitar a la derecha",
      removeBoth: "Quitar de los dos",
      splitBoth: "Dividir los dos lados",
      pair: "Emparejar uno y uno",
      reset: "Recargar la máquina",
      sweepRight: "El campo barre a la derecha",
      sweepLeft: "El campo barre a la izquierda",
      nodeClosed: "Nodo cerrado (incluye el límite)",
      nodeOpen: "Nodo abierto (no incluye el límite)",
      confirm: "Confirmar x",
      engage: "Activar el campo",
      tooFew: "Ese platillo solo tiene {n} pesas.",
      sealed: "Las latas están selladas. Divide solo en grupos que repartan las latas por igual.",
      tilted:
        "La nave se inclina: los dos lados ya no son iguales. Lo que hagas a un lado, hazlo al otro.",
      notIsolated:
        "La lata x todavía no está sola. Quita o divide hasta que quede una sola x en su platillo.",
      high: "La lata pesa menos que tu dial. Tu x es demasiado alta.",
      low: "La lata pesa más que tu dial. Tu x es demasiado baja.",
      solvedEq: "¡Vuelo nivelado! x = {x} hace verdadera {eq}.",
      boundaryHigh: "Las sondas cerca del límite fallan: tu límite está demasiado a la derecha.",
      boundaryLow: "Las sondas cerca del límite fallan: tu límite está demasiado a la izquierda.",
      direction: "El campo contiene valores que la hacen falsa. Revisa hacia dónde barre.",
      node: "Revisa el nodo: ¿el valor del límite es una solución?",
      solvedIneq: "¡Contenido! Cada valor del campo hace verdadera {ineq}.",
      leftPan: "Platillo izquierdo",
      rightPan: "Platillo derecho",
      descEq:
        "Nave {pitch}. Platillo izquierdo: {lc} latas y {lw} pesas. Platillo derecho: {rw} pesas.",
      descIneq:
        "Plataforma numérica de 0 a 20. Límite en {b}, nodo {node}, el campo barre hacia la {dir}.",
      levelPitch: "nivelada",
      tiltLeft: "inclinada hacia abajo a la izquierda",
      tiltRight: "inclinada hacia abajo a la derecha",
      open: "abierto",
      closed: "cerrado",
      right: "derecha",
      left: "izquierda",
      exprLeft: "{expr}",
      torque: "Torque {t}",
    },
  };

  initWorld() {
    this.springs = new SpringBank(3);
    this.pivot = new Pivot();
    this.particles = new ParticlePool(220, ["#9aa6b8", "#f2b45a", "#7bdc8f", "#ff6b6b", "#46c2b8"]);
    if (this.reducedMotion) {
      this.particles.scale = 0;
      this.springs.omega = 40;
    }
    this.mode = "eq";
    this.eq = null;
    this.ineq = null;
    this.lc = 0;
    this.panW = new Float64Array(2);
    this.lw = 0;
    this.rw = 0;
    this.right = true;
    this.closed = false;
    this.engaged = false;
    this.flash = 0;
    this.probeState = new Int8Array(PROBES); // 0 idle, 1 contained ok, -1 contained wrong, 2 escaped
    this.labels = { left: "", right: "", lGauge: "", rGauge: "", torque: "", bound: "" };
  }

  buildControls() {
    this.amount = this.slider({
      id: "amount",
      label: "amount",
      min: 1,
      max: 30,
      value: 1,
      onInput: () => {},
    });
    this.divisor = this.slider({
      id: "divisor",
      label: "divisor",
      min: 1,
      max: 9,
      value: 1,
      onInput: () => {},
    });
    this.dial = this.slider({
      id: "dial",
      label: "dial",
      min: 0,
      max: 30,
      step: 0.5,
      value: 0,
      onInput: () => {},
    });
    this.bound = this.slider({
      id: "boundary",
      label: "boundary",
      min: 0,
      max: LINE_MAX,
      step: 1,
      value: 10,
      onInput: (v) => {
        this.springs.setTarget(S_BOUND, v);
        this.disengage();
      },
    });
    const row = this.actionRow();
    this.eqButtons = [
      this.button({
        id: "remove-left",
        label: "removeLeft",
        onPress: () => this.remove(true, false),
      }),
      this.button({
        id: "remove-right",
        label: "removeRight",
        onPress: () => this.remove(false, true),
      }),
      this.button({
        id: "remove-both",
        label: "removeBoth",
        onPress: () => this.remove(true, true),
      }),
      this.button({ id: "split-both", label: "splitBoth", onPress: () => this.split() }),
      this.button({ id: "pair", label: "pair", onPress: () => this.pairOff() }),
      this.button({ id: "reset", label: "reset", onPress: () => this.loadEquation() }),
    ];
    this.dirBtn = this.button({
      id: "direction",
      label: "sweepRight",
      onPress: () => this.toggleDir(),
    });
    this.nodeBtn = this.button({ id: "node", label: "nodeOpen", onPress: () => this.toggleNode() });
    this.confirmBtn = this.button({
      id: "confirm",
      label: "confirm",
      primary: true,
      onPress: () => this.check(),
      parent: row,
    });
    this.binders.push(() => {
      this.dirBtn.textContent = this.t(this.right ? "sweepRight" : "sweepLeft");
      this.nodeBtn.textContent = this.t(this.closed ? "nodeClosed" : "nodeOpen");
      this.confirmBtn.textContent = this.t(this.mode === "eq" ? "confirm" : "engage");
    });
  }

  newRound(level, next) {
    this.mode = this.roundIndex % 3 === 0 ? "ineq" : "eq";
    const eqMode = this.mode === "eq";
    for (const w of [this.amount.wrap, this.divisor.wrap, this.dial.wrap]) w.hidden = !eqMode;
    this.bound.wrap.hidden = eqMode;
    for (const b of this.eqButtons) b.hidden = !eqMode;
    this.dirBtn.hidden = eqMode;
    this.nodeBtn.hidden = eqMode;
    this.particles.clear();
    if (eqMode) {
      this.eq = makeEquation(level, next);
      this.loadEquation();
      this.dial.set(0);
    } else {
      this.ineq = makeInequality(level, next);
      this.right = true;
      this.closed = false;
      // Never start on the answer: park the boundary away from it.
      const start = this.ineq.boundary <= 10 ? 17 : 2;
      this.bound.set(start);
      this.springs.snap(S_BOUND, start);
      this.springs.snap(S_ANGLE, 0);
      this.disengage();
    }
    this.onTier(this.tier);
  }

  loadEquation() {
    const eq = this.eq;
    this.lc = eq.kind === "mul" ? eq.a : 1;
    this.lw = eq.kind === "add" ? eq.a : 0;
    this.rw = eq.b;
    this.amount.setRange(1, Math.max(1, Math.ceil(Math.max(this.lw, this.rw))));
    this.amount.set(1);
    this.divisor.set(1);
    this.springs.setTarget(S_ANGLE, 0);
    this.sync();
  }

  onTier(n) {
    const pair = this.controls.get("pair");
    if (pair) pair.hidden = this.mode !== "eq" || n < 2;
  }

  /** Net torque: left total minus right total, using the true mass of x. */
  torque() {
    return this.lc * this.eq.x + this.lw - this.rw;
  }

  afterMove(heavy) {
    const t = this.torque();
    this.springs.setTarget(S_ANGLE, Math.max(-0.32, Math.min(0.32, -t * 0.05)));
    this.synth.impact(heavy);
    if (Math.abs(t) > 1e-9) {
      this.synth.strain();
      this.setFeedback(this.t("tilted"));
      this.shout(this.t("tilted"));
      if (!this.misconceptions.includes("one-side-only")) this.misconceptions.push("one-side-only");
    } else {
      this.setFeedback("");
    }
    this.sync();
  }

  remove(left, right) {
    if (this.solved) return;
    const k = Number(this.amount.input.value);
    if (left && k > this.lw + 1e-9) return this.refuse(this.t("tooFew", { n: this.lw }));
    if (right && k > this.rw + 1e-9) return this.refuse(this.t("tooFew", { n: this.rw }));
    if (left) this.lw -= k;
    if (right) this.rw -= k;
    this.afterMove(Math.min(1, k / 10));
  }

  split() {
    if (this.solved) return;
    const d = Number(this.divisor.input.value);
    if (d === 1) return;
    if (this.lc % d !== 0) {
      if (!this.misconceptions.includes("split-unequal")) this.misconceptions.push("split-unequal");
      return this.refuse(this.t("sealed"));
    }
    this.lc = (this.lc / d) | 0; // whole canisters: keep the field an integer
    this.lw /= d;
    this.rw /= d;
    this.afterMove(0.3);
  }

  /** Tier 2: one-to-one cancellation, a weight from each side. */
  pairOff() {
    if (this.solved || this.lw < 1 || this.rw < 1) return;
    this.lw -= 1;
    this.rw -= 1;
    this.particles.emit(PIVOT_X - ARM, PIVOT_Y + 40, 6, 120, 4);
    this.particles.emit(PIVOT_X + ARM, PIVOT_Y + 40, 6, 120, 4);
    this.synth.lock();
    this.afterMove(0.1);
  }

  refuse(text) {
    this.synth.strain();
    this.setFeedback(text);
    this.shout(text);
  }

  toggleDir() {
    this.right = !this.right;
    this.dirBtn.setAttribute("aria-pressed", String(this.right));
    this.synth.tick();
    this.disengage();
    for (const b of this.binders) b();
    this.sync();
  }

  toggleNode() {
    this.closed = !this.closed;
    this.nodeBtn.setAttribute("aria-pressed", String(this.closed));
    this.synth.lock();
    this.disengage();
    for (const b of this.binders) b();
    this.sync();
  }

  disengage() {
    this.engaged = false;
    this.probeState.fill(0);
    this.springs.setTarget(S_FIELD, 0);
  }

  evaluate() {
    if (this.mode === "eq") {
      const eqText = equationText(this.eq);
      if (Math.abs(this.torque()) > 1e-9)
        return { ok: false, key: "tilted", misconception: "one-side-only" };
      if (this.lc !== 1 || this.lw > 1e-9)
        return { ok: false, key: "notIsolated", misconception: "not-isolated" };
      const v = Number(this.dial.input.value);
      if (v > this.eq.x) return { ok: false, key: "high", misconception: "value-high" };
      if (v < this.eq.x) return { ok: false, key: "low", misconception: "value-low" };
      return { ok: true, key: "solvedEq", vars: { x: this.eq.x, eq: eqText } };
    }
    const b = Number(this.bound.input.value);
    // Fire the field: probes light up by the TRUE inequality.
    this.engaged = true;
    this.springs.setTarget(S_FIELD, 1);
    for (let v = 0; v < PROBES; v++) {
      const inField = this.right
        ? v > b || (this.closed && v === b)
        : v < b || (this.closed && v === b);
      const truth = satisfies(this.ineq, v);
      this.probeState[v] = inField ? (truth ? 1 : -1) : truth ? 2 : 0;
      if (inField && !truth) this.particles.emit(this.probeX(v), LINE_Y - 30, 10, 160, 3);
    }
    const verdict = judgeField(this.ineq, b, this.right, this.closed);
    const text = inequalityText(this.ineq);
    if (verdict === "ok") return { ok: true, key: "solvedIneq", vars: { ineq: text } };
    const tag =
      verdict === "direction" ? "direction-reversed" : verdict === "node" ? "endpoint" : "boundary";
    return { ok: false, key: verdict, misconception: tag };
  }

  onSolved() {
    this.particles.emit(PIVOT_X, PIVOT_Y - 20, 40, 260, 2, -Math.PI / 2, Math.PI * 1.6, 1.1);
  }

  /** Deck x for a value, as an integer (never returns a boxed double). */
  probeX(v) {
    return (LINE_X0 + ((LINE_X1 - LINE_X0) * v) / LINE_MAX) | 0;
  }

  updatePhysics(dt) {
    // Step with the module constant, not the dt parameter, so no double crosses a call.
    this.springs.step(DT);
    this.particles.update(DT);
    this.flash += DT;
    if (this.mode === "eq" && !this.solved) {
      const a = this.springs.pos[S_ANGLE];
      if (Math.abs(a) > 0.02 && this.flash > 0.08) {
        this.flash = 0;
        // Smoke from the low side's thruster.
        const side = a > 0 ? 1 : -1;
        this.particles.emit(
          PIVOT_X + side * (ARM - 30),
          (PIVOT_Y + 70 + side * a * ARM) | 0,
          2,
          60,
          0,
          HALF_PI,
          0.8,
          0.9,
        );
      }
    }
  }

  refreshLabels() {
    const L = this.labels;
    if (this.mode === "eq" && this.eq) {
      L.lGauge = fmt(this.lw);
      L.rGauge = fmt(this.rw);
      L.left =
        this.lc === 0
          ? fmt(this.lw)
          : `${this.lc === 1 ? "" : this.lc}x${this.lw > 0 ? ` + ${fmt(this.lw)}` : ""}`;
      L.right = fmt(this.rw);
      L.torque = this.t("torque", { t: this.solvedTorqueText() });
    } else if (this.ineq) {
      L.bound = String(this.bound.input.value);
      L.left = inequalityText(this.ineq);
    }
  }

  solvedTorqueText() {
    const t = this.torque();
    return Math.abs(t) < 1e-9 ? "0" : t > 0 ? "←" : "→";
  }

  describe() {
    if (this.mode === "eq" && this.eq) {
      const a = this.springs.target[S_ANGLE];
      const pitch =
        Math.abs(a) < 1e-6 ? this.t("levelPitch") : a > 0 ? this.t("tiltRight") : this.t("tiltLeft");
      return this.t("descEq", { pitch, lc: this.lc, lw: fmt(this.lw), rw: fmt(this.rw) });
    }
    if (!this.ineq) return "";
    return this.t("descIneq", {
      b: this.bound.input.value,
      node: this.t(this.closed ? "closed" : "open"),
      dir: this.t(this.right ? "right" : "left"),
    });
  }

  mission() {
    if (this.mode === "eq") return this.t("missionEq", { eq: equationText(this.eq) });
    return this.t("missionIneq", { ineq: inequalityText(this.ineq) });
  }

  testPlan() {
    if (this.mode === "eq") {
      const eq = this.eq;
      const steps =
        eq.kind === "add"
          ? [
              { control: "amount", key: "Home" },
              { control: "amount", key: "ArrowRight", times: eq.a - 1 },
              { control: "remove-both", key: "Enter" },
            ]
          : [
              { control: "divisor", key: "Home" },
              { control: "divisor", key: "ArrowRight", times: eq.a - 1 },
              { control: "split-both", key: "Enter" },
            ];
      return [
        ...steps,
        { control: "dial", key: "Home" },
        { control: "dial", key: "ArrowRight", times: eq.x * 2 },
        { control: "confirm", key: "Enter" },
      ];
    }
    const q = this.ineq;
    const wantRight = q.solOp === ">" || q.solOp === ">=";
    const wantClosed = q.solOp === "<=" || q.solOp === ">=";
    const plan = [
      { control: "boundary", key: "Home" },
      { control: "boundary", key: "ArrowRight", times: q.boundary },
    ];
    if (wantRight !== this.right) plan.push({ control: "direction", key: "Enter" });
    if (wantClosed !== this.closed) plan.push({ control: "node", key: "Enter" });
    plan.push({ control: "confirm", key: "Enter" });
    return plan;
  }

  // ---------- rendering (no allocation: integer coords, Pivot instead of rotate) ----------
  renderScene(ctx) {
    this.backdrop(ctx);
    if (this.mode === "eq") this.drawCraft(ctx);
    else this.drawDeck(ctx);
    this.particles.render(ctx);
  }

  drawCraft(ctx) {
    const a = this.springs.pos[S_ANGLE];
    const pv = this.pivot;
    pv.setFrom(PIVOT_X, PIVOT_Y, this.springs.pos, S_ANGLE);
    // Fulcrum pylon.
    ctx.fillStyle = "#24365c";
    ctx.beginPath();
    ctx.moveTo(PIVOT_X - 46, H - 40);
    ctx.lineTo(PIVOT_X + 46, H - 40);
    ctx.lineTo(PIVOT_X + 10, PIVOT_Y);
    ctx.lineTo(PIVOT_X - 10, PIVOT_Y);
    ctx.closePath();
    ctx.fill();
    // Beam, level mark and thrusters, rotated in JS.
    ctx.fillStyle = "#3b5785";
    pv.rectPath(ctx, 0, 0, ARM * 2 + 40, 20);
    ctx.fill();
    ctx.fillStyle = "#ffd166";
    pv.rectPath(ctx, 0, 0, 4, 32);
    ctx.fill();
    ctx.fillStyle = "#1c2a45";
    pv.rectPath(ctx, -(ARM - 30), 25, 44, 30);
    ctx.fill();
    pv.rectPath(ctx, ARM - 30, 25, 44, 30);
    ctx.fill();
    // Level bubble on an arc gauge (diegetic HUD).
    ctx.strokeStyle = "#2c3e63";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(PIVOT_X, GAUGE_Y, 60, ARC_FROM, ARC_TO);
    ctx.stroke();
    const bubble = -HALF_PI + a * 1.6;
    ctx.fillStyle = Math.abs(a) < 0.01 ? "#7bdc8f" : "#f2b45a";
    dot(ctx, (PIVOT_X + Math.cos(bubble) * 60) | 0, (GAUGE_Y + Math.sin(bubble) * 60) | 0, 9);
    // Pans hang vertically from the beam ends.
    // Pan contents go through a typed array: a load from it is always a raw
    // double, never a mix of representations V8 would have to box.
    const pan = this.panW;
    pan[0] = this.lw;
    pan[1] = this.rw;
    this.drawPan(ctx, pv.px(-ARM, 0), pv.py(-ARM, 0), true);
    this.drawPan(ctx, pv.px(ARM, 0), pv.py(ARM, 0), false);
    if (this.tier >= 1) this.drawScaffold(ctx);
  }

  /**
   * One pan. Reads its own weights: a double FIELD passed as an argument to a
   * call V8 does not inline is re-boxed every frame once the caller is optimized.
   */
  drawPan(ctx, x, y, left) {
    const cans = left ? this.lc | 0 : 0;
    const weights = this.panW[left ? 0 : 1];
    const gauge = left ? this.labels.lGauge : this.labels.rGauge;
    const floor = y + 134;
    ctx.strokeStyle = "#5b6f96";
    ctx.lineWidth = 2;
    ctx.beginPath();
    line(ctx, x, y, x - 70, floor);
    line(ctx, x, y, x + 70, floor);
    ctx.stroke();
    ctx.fillStyle = "#2c3e63";
    roundRect(ctx, x - 82, floor, 164, 12, 5);
    ctx.fill();
    // Canisters.
    let cx = x - 74;
    ctx.font = "700 15px system-ui";
    ctx.textAlign = "center";
    for (let i = 0; i < cans; i++) {
      ctx.fillStyle = "#46c2b8";
      roundRect(ctx, cx, floor - 44, 26, 44, 8);
      ctx.fill();
      ctx.fillStyle = "#04201d";
      text(ctx, "x", cx + 13, floor - 16);
      cx += 30;
    }
    // Iron weights in rows (a gap after five when a row holds ten); a half weight draws half-width.
    const startX = cans > 0 ? cx + 4 : x - 74;
    // Math.max yields a float in optimized code (-0 rules): truncate it.
    const perRow = cans > 0 ? Math.max(3, ((x + 80 - startX) / 14) | 0) | 0 : 10;
    // Whole blocks, then (for a half-unit pan) one half-width block. Integer math
    // only: weights are whole or end in .5, so halves = 2 * weights is exact.
    const halves = (weights * 2 + 0.5) | 0;
    const full = halves >> 1;
    const count = full + (halves & 1);
    ctx.fillStyle = "#8d99ad";
    for (let i = 0; i < count; i++) {
      const w = i < full ? 12 : 6;
      const col = i % perRow;
      const row = (i / perRow) | 0;
      rect(ctx, startX + col * 14 + (col >= 5 && perRow === 10 ? 4 : 0), floor - 13 - row * 13, w, 12);
    }
    // Engraved gauge plate: the iron mass on this pan.
    ctx.fillStyle = "#111a2e";
    roundRect(ctx, x - 34, floor + 18, 68, 26, 6);
    ctx.fill();
    ctx.fillStyle = "#e8eefc";
    ctx.font = "700 16px system-ui";
    text(ctx, gauge, x, floor + 37);
  }

  drawScaffold(ctx) {
    const L = this.labels;
    ctx.textAlign = "center";
    ctx.font = "700 20px system-ui";
    ctx.fillStyle = "#ffd166";
    ctx.fillText(L.left, PIVOT_X - ARM, 70);
    ctx.fillText(L.right, PIVOT_X + ARM, 70);
    ctx.fillText(L.torque, PIVOT_X, 70);
    // Gravity vectors scaled by each side's total.
    const lTot = this.lc * this.eq.x + this.lw;
    const rTot = this.rw;
    const scale = 90 / Math.max(lTot, rTot, 1);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 4;
    ctx.beginPath();
    line(ctx, PIVOT_X - ARM + 120, 100, PIVOT_X - ARM + 120, 100 + lTot * scale);
    line(ctx, PIVOT_X + ARM - 120, 100, PIVOT_X + ARM - 120, 100 + rTot * scale);
    ctx.stroke();
    // Tier 2, multiply rounds: ghost partition of the right pan into equal groups.
    if (this.tier >= 2 && this.lc > 1) {
      const pv = this.pivot;
      const x = pv.px(ARM, 0);
      const y = pv.py(ARM, 0) + 134;
      ctx.strokeStyle = "rgba(255,209,102,0.7)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let g = 1; g < this.lc; g++) {
        const gx = x - 82 + (164 * g) / this.lc;
        line(ctx, gx, y - 110, gx, y);
      }
      ctx.stroke();
    }
  }

  drawDeck(ctx) {
    const field = this.springs.pos[S_FIELD];
    const bx = this.probeX(this.springs.pos[S_BOUND]);
    // Laser field band, sweeping out from the boundary.
    if (field > 0.01) {
      alphaLevel(ctx, (Math.min(1, field) * 7 + 0.5) | 0);
      ctx.fillStyle = "#46c2b8";
      const end = this.right ? LINE_X1 + 20 : LINE_X0 - 20;
      const reach = (end - bx) * field;
      rect(ctx, (reach < 0 ? bx + reach : bx) | 0, LINE_Y - 90, Math.abs(reach) | 0, 80);
      ctx.globalAlpha = 1;
    }
    // Number deck (static ticks and numerals are a pre-rendered layer).
    if (!this.deckLayer) {
      this.deckLayer = staticLayer(W, H, (g) => {
        g.strokeStyle = "#a9b6d3";
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(LINE_X0 - 30, LINE_Y);
        g.lineTo(LINE_X1 + 30, LINE_Y);
        g.stroke();
        g.fillStyle = "#e8eefc";
        g.font = "16px system-ui";
        g.textAlign = "center";
        for (let i = 0; i <= LINE_MAX; i++) {
          const x = this.probeX(i);
          g.fillRect(x - 1, LINE_Y - (i % 2 === 0 ? 10 : 6), 2, i % 2 === 0 ? 20 : 12);
          if (i % 2 === 0) g.fillText(String(i), x, LINE_Y + 32);
        }
      });
    }
    ctx.drawImage(this.deckLayer, 0, 0, W, H);
    // Probes light up by the TRUE inequality once the field fires.
    for (let v = 0; v < PROBES; v++) {
      const s = this.probeState[v];
      ctx.fillStyle = s === 1 ? "#7bdc8f" : s === -1 ? "#ff6b6b" : s === 2 ? "#f2b45a" : "#3b5785";
      dot(ctx, this.probeX(v), LINE_Y - 50, 7);
    }
    // Boundary thruster with its engraved value, the node, and the sweep chevron.
    ctx.fillStyle = "#24365c";
    roundRect(ctx, bx - 18, LINE_Y - 150, 36, 46, 8);
    ctx.fill();
    ctx.fillStyle = "#e8eefc";
    ctx.font = "700 18px system-ui";
    ctx.textAlign = "center";
    text(ctx, this.labels.bound, bx, LINE_Y - 120);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#ffd166";
    ctx.fillStyle = this.closed ? "#ffd166" : "#070d1a";
    ring(ctx, bx, LINE_Y, 11);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd166";
    const d = this.right ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo((bx + d * 26) | 0, LINE_Y - 128);
    ctx.lineTo((bx + d * 44) | 0, LINE_Y - 118);
    ctx.lineTo((bx + d * 26) | 0, LINE_Y - 108);
    ctx.closePath();
    ctx.fill();
    // Inequality plate.
    ctx.font = "700 26px system-ui";
    ctx.fillText(this.labels.left, HALF_W, 80);
  }
}

/** Weights as text: whole numbers plain, halves as .5. */
function fmt(v) {
  return String(Math.round(v * 100) / 100);
}

define("ew-aero-torque", AeroTorque);

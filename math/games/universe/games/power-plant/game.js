// POWER PLANT — an exponents action platformer (lessons 6-3 and 6-4).
//
// Wren and Ori restart Helix Station. Running, jumping and dashing get you to
// the machines; understanding the expression is what makes them work. A
// reactor's output is base^exp and a lift or bridge moves by exactly that
// much, so a wrong expression is a lift at the wrong height, not a red X.
// Every setting is a turning point on the Time Machine, and Ori starts out
// believing an exponent is plain multiplication until the student shows
// otherwise by building, not telling.

import { STATUS } from "../../runtime/apprentice.js";
import { define, UniverseGame } from "../../runtime/shell.js";
import {
  openCoilBench,
  openCore,
  openOrderBench,
  openReactor,
  openSequencer,
  orderShows,
} from "./consoles.js";
import { createWorld, LEVELS } from "./levels.js";
import { evaluate, leftToRight, show } from "./math.js";
import { draw, drawBackdrop, drawOverlay } from "./render.js";
import { busy, deviceOf, machineOf, reachable, rules, solveClamp } from "./rules.js";
import { CONCEPTS, STRINGS } from "./strings.js";

// Held-out tasks for Ori. The first one the student has NOT used at the bench is chosen.
const EXP_TASKS = [
  { base: 3, target: 9, exp: 2 },
  { base: 2, target: 8, exp: 3 },
  { base: 5, target: 25, exp: 2 },
  { base: 4, target: 16, exp: 2 },
  { base: 2, target: 16, exp: 4 },
  { base: 3, target: 27, exp: 3 },
];
const OPS_TASKS = [
  { tokens: [3, "×", 2, "^", 2], target: 36 },
  { tokens: [5, "+", 2, "×", 3], target: 21 },
  { tokens: [1, "+", 4, "×", 5], target: 25 },
  { tokens: [2, "×", 3, "^", 2], target: 36 },
];

class PowerPlant extends UniverseGame {
  static def = {
    id: "power-plant",
    title: { en: "POWER PLANT", es: "PLANTA DE ENERGÍA" },
    tagline: {
      en: "Helix Station is dark. Every lift, bridge and door runs on an expression. Wake it up.",
      es: "La Estación Hélice está a oscuras. Cada elevador, puente y puerta funciona con una expresión. Despiértala.",
    },
    bed: "plant",
    lessons: ["6-3", "6-4"],
    uses: {},
    concepts: CONCEPTS,
    levels: [
      {
        id: "cold-start",
        lesson: "6-3",
        standard: "6.AT.5",
        title: { en: "Cold Start", es: "Arranque en frío" },
        discovery: {
          en: "An exponent counts how many times the base is used as a factor. Ori knows it now, too.",
          es: "Un exponente cuenta cuántas veces se usa la base como factor. Ahora Ori también lo sabe.",
        },
      },
      {
        id: "coil-budget",
        lesson: "6-3",
        standard: "6.AT.5",
        title: { en: "Coil Budget", es: "Presupuesto de bobinas" },
        discovery: {
          en: "Different bases and exponents can make the same power: 2⁶, 4³ and 8² are all 64.",
          es: "Bases y exponentes distintos pueden dar la misma potencia: 2⁶, 4³ y 8² son 64.",
        },
      },
      {
        id: "sequencer-hall",
        lesson: "6-4",
        standard: "6.AT.6c",
        title: { en: "Sequencer Hall", es: "Sala de secuenciadores" },
        discovery: {
          en: "Powers first, then × and ÷, then + and −. Grouping symbols change what goes first.",
          es: "Primero las potencias, luego × y ÷, luego + y −. Los símbolos de agrupación cambian lo que va primero.",
        },
      },
      {
        id: "helix-core",
        lesson: "6-4",
        standard: "6.AT.6c",
        title: { en: "The Helix Core", es: "El Núcleo Hélice" },
        discovery: {
          en: "Three powers, one expression: A + B × C. You chose every base and exponent to hit each load.",
          es: "Tres potencias, una expresión: A + B × C. Elegiste cada base y exponente para lograr cada carga.",
        },
      },
    ],
    // Player action -> mathematics -> state change -> visible result -> evidence.
    mechanics: [
      {
        id: "exponent-power",
        action: "set a reactor's base and number of coils",
        relationship: "output = base^exponent (repeated multiplication)",
        stateChange: "the device's goal becomes that many units",
        visible:
          "coils fire one factor at a time; the lift or bridge moves exactly that far and docks only at the needed power",
        evidence:
          "accuracy decision with the expression; tag exponent-as-multiplication when base × exponent would have matched",
      },
      {
        id: "equivalent-powers",
        action: "re-form a docked reactor with a different base",
        relationship: "two powers are equivalent when their values are equal (8² = 4³ = 2⁶)",
        stateChange: "coils return to or leave the shared budget; the structure does not move",
        visible: "the coil ring redraws with fewer coils and the budget counter changes",
        evidence: "accuracy decision; a non-equivalent form is refused by the structure",
      },
      {
        id: "order-of-operations",
        action: "place (or leave off) a grouping clamp on a fixed expression",
        relationship: "powers, then × ÷, then + −; grouping first",
        stateChange: "the sequencer's output and its device's goal",
        visible:
          "stage lamps light in the order the machine evaluates; the device moves to the result",
        evidence:
          "accuracy decision; tag order-of-operations-left-to-right when the left-to-right value would have matched",
      },
      {
        id: "core-combiner",
        action: "set three reactors, predict, then engage",
        relationship: "load = A + B × C with A, B, C powers under a shared coil budget",
        stateChange: "the core accepts the load or rejects it; three loads in sequence",
        visible: "the core ring locks a segment, or flickers / vents",
        evidence: "accuracy decision plus a prediction (under / exact / over)",
      },
    ],
  };

  static strings = STRINGS;

  rules = rules;
  asked = {};

  createWorld(index, seed) {
    const exp = this.ori.has("exp-repeat");
    return createWorld(index, seed, { exp, ops: this.ori.has("ops-order"), twin: exp });
  }

  focus(w) {
    return { x: w.p.x + w.p.w / 2, y: w.p.y + w.p.h / 2, face: w.p.face };
  }

  bounds(w) {
    return { x: 0, y: 0, w: w.w, h: w.h };
  }

  drawBackdrop(ctx, cam, w, t) {
    drawBackdrop(ctx, cam, w, t, this.lowfx);
  }

  draw(ctx, w, t) {
    this.words ||= {};
    for (const k of ["needs", "coils", "bench", "load", "stable"]) this.words[k] = this.t(k);
    draw(ctx, w, t, {
      words: this.words,
      oriMood: this.oriMood,
      lowfx: this.lowfx,
      acting: this.mode === "panel",
      talk: this.caption?.who === "ori",
    });
  }

  drawOverlay(ctx, w) {
    drawOverlay(ctx, w, this.words);
  }

  onLevelStart() {
    this.oriMood = "curious";
  }

  // ---------- what the student is working toward ----------
  objective(w) {
    const d = w.devices.find((x) => x.phase !== "dock");
    if (!d) return this.t("objExit");
    const m = w.machines.find((x) => x.drives === d.id);
    if (d.kind === "core")
      return this.t("objCore", { need: machineOf(w, "core").loads[d.phaseIndex] });
    if (d.kind === "gate") return this.t("objDoor", { need: d.need });
    if (m.by === "ori" && m.tries > 0)
      return this.t(this.ori.status(m.concept) === STATUS.READY ? "objCall" : "objOri");
    return this.t(d.kind === "lift" ? "objLift" : "objBridge", { need: d.need });
  }

  describe(w) {
    const parts = [this.tx(this.level.title), this.objective(w)];
    for (const m of w.machines) {
      if (m.kind === "power")
        parts.push(`${this.t("useReactor")} ${m.tag || m.id}: ${m.base}^${m.exp}`);
      if (m.kind === "ops") parts.push(`${this.t("useSequencer")}: ${show(m.tokens, m.group)}`);
    }
    if (w.coils >= 0) parts.push(`${this.t("coils")}: ${w.coils}`);
    return parts.join(". ");
  }

  // ---------- reach ----------
  stops(w) {
    const out = [];
    for (const m of w.machines) {
      const d = deviceOf(w, m.drives);
      if (m.state !== "idle" || busy(d)) continue;
      if (m.kind === "combo") {
        if (d.phase !== "dock")
          out.push({ id: m.id, type: "core", ref: m, x: m.x, y: m.y, what: this.t("useCore") });
      } else if (m.by === "wren" && (d.phase !== "dock" || (w.coils >= 0 && m.kind === "power")))
        out.push({
          id: m.id,
          type: m.kind,
          ref: m,
          x: m.x,
          y: m.y,
          open: d.phase !== "dock",
          what: this.t(m.kind === "power" ? "useReactor" : "useSequencer"),
        });
    }
    for (const b of w.benches)
      out.push({ id: b.id, type: `bench-${b.kind}`, x: b.x, y: b.y, what: this.t("useBench") });
    for (const c of w.calls) {
      const m = machineOf(w, c.machine);
      const d = deviceOf(w, m.drives);
      if (m.tries > 0 && m.state === "idle" && !busy(d) && d.phase !== "dock")
        out.push({ id: c.id, type: "call", ref: m, x: c.x, y: c.y, what: this.t("useCall") });
    }
    return out;
  }

  interactable(w) {
    const px = w.p.x + w.p.w / 2;
    const feet = w.p.y + w.p.h;
    let best = null;
    for (const s of this.stops(w)) {
      const dx = Math.abs(px - s.x);
      if (dx < 52 && Math.abs(feet - s.y) < 60 && (!best || dx < Math.abs(px - best.x))) best = s;
    }
    return best;
  }

  /** "Guide me there": the next stop that matters and can be reached. */
  nextStop(w) {
    const all = this.stops(w).filter((s) => reachable(w, s.x));
    const oriMachine = w.machines.find(
      (m) => m.by === "ori" && m.tries > 0 && deviceOf(w, m.drives).phase !== "dock",
    );
    if (oriMachine) {
      const ready = this.ori.status(oriMachine.concept) === STATUS.READY;
      return all.find((s) => (ready ? s.type === "call" : s.type.startsWith("bench"))) || null;
    }
    const open = all.filter((s) => s.open || s.type === "core").sort((a, b) => a.x - b.x)[0];
    if (open) return open;
    const e = w.exit;
    if (w.devices.every((d) => d.phase === "dock") && reachable(w, e.x))
      return { id: "exit", x: e.x + e.w / 2, y: e.y + e.h, what: this.t("whatExit") };
    // Not there yet: walk Wren up to the trigger that sends Ori to its reactor.
    const t = w.triggers.find((x) => !x.done && x.ori);
    return t && reachable(w, t.x + 30)
      ? { id: t.id, x: t.x + 30, y: 340, what: this.t("oriName") }
      : null;
  }

  interact(target) {
    const w = this.world;
    if (target.type === "power") openReactor(this, target.ref);
    else if (target.type === "ops") openSequencer(this, target.ref);
    else if (target.type === "core") openCore(this, target.ref);
    else if (target.type === "bench-coil") openCoilBench(this);
    else if (target.type === "bench-order") openOrderBench(this);
    else if (target.type === "call") this.callOri(w, target.ref);
  }

  // ---------- Ori ----------
  afterTeach(conceptId) {
    if (this.ori.status(conceptId) === STATUS.READY)
      this.later(3.4, () =>
        this.say(
          "ori",
          this.t(conceptId === "exp-repeat" ? "oriReadyExp" : "oriReadyOps"),
          "eureka",
        ),
      );
    this.refreshHud();
  }

  /** Ori tries a task it has not been shown. The apprentice model decides how it answers. */
  async callOri(w, m) {
    const id = m.concept;
    if (this.ori.status(id) === STATUS.HOLDS)
      return this.say("ori", this.t("oriNeedsBench"), "confused");
    const seen = this.ori.seen(id);
    const needs = CONCEPTS.find((c) => c.id === id).distinctions.map((d) => d.id);
    let task;
    let action;
    if (id === "exp-repeat") {
      const pick = EXP_TASKS.find((t) => !seen.includes(`${t.base}^${t.exp}`)) || EXP_TASKS[0];
      const wrong = Math.min(m.maxExp, Math.max(1, Math.round(pick.target / pick.base)));
      task = {
        needs,
        correct: pick.exp,
        misconceived: wrong,
        signature: `${pick.base}^${pick.exp}`,
        ...pick,
      };
    } else {
      const withClamp = OPS_TASKS.map((t) => ({
        ...t,
        group: solveClamp(t.tokens, t.target) || null,
      }));
      const pick = withClamp.find((t) => !seen.includes(show(t.tokens, t.group))) || withClamp[0];
      // Left to right, the bare expression already "equals" the target, so the misconception adds no clamp.
      task = {
        needs,
        correct: pick.group,
        misconceived: null,
        signature: show(pick.tokens, pick.group),
        ...pick,
      };
    }
    await this.predict({
      prompt: this.t(id === "exp-repeat" ? "callPredict" : "callPredictOps", task),
      mechanic: id,
      options: [
        { label: this.t("yes"), value: "yes" },
        { label: this.t("no"), value: "no" },
      ],
      expectOk: (v) => v === "yes",
    });
    const r = this.transfer(id, task);
    if (id === "exp-repeat")
      action = {
        type: "oriRun",
        id: m.id,
        base: task.base,
        target: task.target,
        exp: r.answer,
        learned: r.passed,
        know: "exp",
      };
    else
      action = {
        type: "oriRun",
        id: m.id,
        tokens: task.tokens,
        target: task.target,
        group: r.answer,
        learned: r.passed,
        know: "ops",
      };
    this.oriResult = r;
    this.say("ori", this.t(id === "exp-repeat" ? "oriTask" : "oriTaskOps", task), "focused");
    this.decide(
      "teach",
      { en: `Ori tries ${task.signature}`, es: `Ori prueba ${task.signature}` },
      action,
      { mechanic: id, lesson: m.kind === "power" ? "6-3" : "6-4", ori: true },
    );
  }

  // ---------- presentation for simulation events ----------
  onEvent(e) {
    const w = this.world;
    switch (e.type) {
      case "fired":
        this.audio.sfx("power");
        break;
      case "vent":
        this.audio.sfx("brake");
        break;
      case "pulse":
        this.audio.sfx("whistle");
        break;
      case "bump":
        this.audio.sfx("strain");
        this.camera.kick(4);
        this.fx.emit(e.x, e.y, 10, 120, 3, 0, Math.PI * 2, 0.4);
        this.toast(this.t("bumped"));
        break;
      case "respawn":
        this.sweep();
        this.toast(this.t("bumped"));
        break;
      case "refuse":
        this.timeline.resolve({ ok: false, key: e.key });
        this.say("wren", this.t(e.key), "worried");
        break;
      case "outcome":
        this.onOutcome(w, e);
        break;
    }
  }

  onOutcome(w, e) {
    const m = e.machine ? machineOf(w, e.machine) : null;
    if (e.ok && e.x === undefined && m)
      this.fx.emit(m.x, m.y - 96, 24, 160, 0, 0, Math.PI * 2, 0.8);
    if (e.byOri) {
      const r = this.oriResult;
      this.oriResult = null;
      if (e.ok && r?.passed) {
        this.later(3.2, () =>
          this.say(
            "ori",
            this.t(m.concept === "exp-repeat" ? "oriLearned" : "oriLearnedOps"),
            "celebrate",
          ),
        );
        this.later(7, () => this.askOnce(m.concept));
      } else if (!e.ok) {
        const missing = r?.missing || this.ori.missing(m.concept)[0];
        const taught = this.ori.status(m.concept) !== STATUS.HOLDS;
        this.later(3.6, () =>
          this.say(
            "ori",
            taught && missing
              ? this.t("oriMissing", { label: this.tx(missing.label) })
              : this.t("oriNeedsBench"),
            "confused",
          ),
        );
      }
      return;
    }
    // The student's own correct sequencer run is itself a demonstration Ori watches.
    if (e.ok && m?.kind === "ops") {
      const shows = orderShows(m.tokens, m.group);
      const differs = evaluate(m.tokens, m.group).value !== leftToRight(m.tokens);
      if (shows.length && (differs || m.group))
        this.teach("ops-order", {
          kind: "simulation",
          valid: true,
          shows,
          signature: show(m.tokens, m.group),
        });
      if (m.group) this.later(4, () => this.askOnce("clamp"));
    }
    if (e.key === "reformed") this.later(3.5, () => this.askOnce("coils"));
  }

  /** One short explanation prompt per idea, tied to the change the student just caused. */
  askOnce(what) {
    if (this.asked[what] || this.mode !== "play") return;
    this.asked[what] = true;
    const o = {
      "exp-repeat": {
        prompt: this.t("explainExp", { base: 3, n: 3 }),
        frames: [this.t("frameExp1"), this.t("frameExp2")],
        mechanic: "exponent-power",
      },
      "ops-order": {
        prompt: this.t("explainOps"),
        frames: [this.t("frameOps1"), this.t("frameOps2")],
        mechanic: "order-of-operations",
      },
      clamp: {
        prompt: this.t("explainOps"),
        frames: [this.t("frameOps1"), this.t("frameOps2")],
        mechanic: "order-of-operations",
      },
      coils: {
        prompt: this.t("explainCoils"),
        frames: [this.t("frameCoils1"), this.t("frameCoils2")],
        mechanic: "equivalent-powers",
      },
    }[what];
    if (o) this.explain(o);
  }
}

define("ewl-power-plant", PowerPlant);
export { LEVELS, PowerPlant };

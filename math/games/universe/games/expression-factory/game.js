// EXPRESSION FACTORY — a real-time automation puzzle (6-5, 6-6, 6-8, 6-14, 6-15).
//
// The line under the belt IS the expression. Walk the factory floor, install
// a machine in each slot (one operation each), and pull the lever: crates
// carrying values of x come down the belt, every machine stamps its operation
// on the crate's number, and the truck takes a crate only if it carries what
// the order asks for at that x. A line right for one crate and wrong for
// another shows exactly which crates it fails: equivalence means every x.

import { el } from "../../runtime/chrome.js";
import { action, chips } from "../../runtime/controls.js";
import { define, UniverseGame } from "../../runtime/shell.js";
import { BELT_X0, createWorld, FLOOR, LEVELS, slotX } from "./levels.js";
import { evaluate, fracText, machineText, simplest, write } from "./math.js";
import { draw, drawBackdrop } from "./render.js";
import { built, currentRoom, rules } from "./rules.js";
import { STRINGS } from "./strings.js";

const WORDS = [
  "order",
  "reference",
  "yourLine",
  "lever",
  "truck",
  "reject",
  "twinOrder",
  "streamOrder",
];
const OP_KEYS = { "+": "opAdd", "-": "opSub", "*": "opMul" };
const NUMBERS = Array.from({ length: 12 }, (_, i) => i + 1);

/** A box's operation and its number-or-x, as the machine the factory runs. */
const encode = (op, operand) => (operand === "x" ? { op: `${op}x` } : { op, k: Number(operand) });
const decode = (m) => (m.op.endsWith("x") ? { op: m.op[0], operand: "x" } : { op: m.op, operand: String(m.k) });

class ExpressionFactory extends UniverseGame {
  static def = {
    id: "expression-factory",
    title: { en: "EXPRESSION FACTORY", es: "FÁBRICA DE EXPRESIONES" },
    tagline: {
      en: "The Algebra Works runs on expressions. Build the line, run the crates, and prove a line works for every x.",
      es: "La Fábrica de Álgebra funciona con expresiones. Arma la línea, pasa las cajas y demuestra que una línea funciona para cada x.",
    },
    bed: "factory",
    lessons: ["6-5", "6-6", "6-8", "6-14", "6-15"],
    uses: {},
    concepts: [],
    levels: [
      {
        id: "assembly-line",
        lesson: "6-5",
        standard: "6.AT.6a",
        title: { en: "Assembly Line", es: "Línea de ensamblaje" },
        discovery: {
          en: "An expression is a set of operations done to a number. Order matters: 3x + 2 multiplies first, 3(x + 2) adds first.",
          es: "Una expresión es un conjunto de operaciones que se le hacen a un número. El orden importa: 3x + 2 multiplica primero, 3(x + 2) suma primero.",
        },
      },
      {
        id: "twin-lines",
        lesson: "6-6",
        lessons: ["6-6", "6-8"],
        standard: "6.AT.7",
        title: { en: "Twin Lines", es: "Líneas gemelas" },
        discovery: {
          en: "Equivalent expressions give the same value for every x: 2(x + 3) and 2x + 6 are two lines that never disagree.",
          es: "Las expresiones equivalentes dan el mismo valor para cada x: 2(x + 3) y 2x + 6 son dos líneas que nunca difieren.",
        },
      },
      {
        id: "streamline",
        lesson: "6-14",
        lessons: ["6-14", "6-15"],
        standard: "6.AT.7",
        title: { en: "Streamline", es: "Simplificar" },
        discovery: {
          en: "Combining like terms and the distributive property rebuild a long expression with fewer steps and the same value.",
          es: "Combinar términos semejantes y la propiedad distributiva rehacen una expresión larga con menos pasos y el mismo valor.",
        },
      },
    ],
    mechanics: [
      {
        id: "write-expression",
        action: "install one operation per slot, then run the line",
        relationship:
          "the chain of machines is the expression, evaluated left to right along the belt",
        stateChange: "each crate's value changes at every machine",
        visible:
          "crate labels change at each stamp; the truck takes right crates, the chute takes wrong ones",
        evidence:
          "accuracy decision per run; tag order-of-operations-left-to-right for the same machines in the wrong order",
      },
      {
        id: "equivalent-expressions",
        action: "build a different line beside a running reference line",
        relationship: "two expressions are equivalent when they agree for every x",
        stateChange: "both belts run the same crates",
        visible: "matching labels crate for crate, or the crates where they disagree",
        evidence: "accuracy decision; tag algebra-distributive-partial (2x + 3 for 2(x + 3))",
      },
      {
        id: "simplify-expression",
        action: "rebuild a long line with fewer slots",
        relationship: "combine like terms; distribute",
        stateChange: "the same crates through fewer machines",
        visible: "every crate still right",
        evidence: "accuracy decision with the written line",
      },
    ],
  };

  static strings = STRINGS;

  rules = rules;
  said = {};
  asked = {};
  stamps = new Map();
  predicted = new Set();

  createWorld(index, seed) {
    return createWorld(index, seed);
  }

  connectedCallback() {
    const first = !this.started;
    super.connectedCallback();
    // Clicking or tapping the factory opens the build panel: no walking needed.
    if (first) this.canvas.addEventListener("click", () => this.openBuild());
  }

  focus(w) {
    return { x: w.p.x + w.p.w / 2, y: w.p.y - 160, face: w.p.face };
  }

  bounds(w) {
    return { x: 0, y: 0, w: w.w, h: w.h };
  }

  drawBackdrop(ctx, cam, w, t) {
    drawBackdrop(ctx, cam, w, t, this.lowfx);
  }

  draw(ctx, w, t) {
    if (this.wordsLang !== this.lang) {
      this.wordsLang = this.lang;
      this.words = Object.fromEntries(WORDS.map((k) => [k, this.t(k)]));
    }
    const now = this.now;
    const press = (room, slot, ref) => {
      const at = this.stamps.get(`${room}:${slot}:${ref ? 1 : 0}`);
      return at === undefined ? 0 : Math.max(0, 1 - (now - at) / 0.22);
    };
    draw(ctx, w, t, {
      words: this.words,
      press,
      acting: this.mode === "panel",
      oriMood: this.oriMood,
      talk: this.caption?.who === "ori",
    });
  }

  onLevelStart(index) {
    this.said = {};
    this.say("ori", this.t(["hello", "helloTwin", "helloStream"][index]), "curious");
    this.later(1.2, () => this.openBuild());
  }

  /** Open the build panel for the room the student is in, unless it is done or running. */
  openBuild() {
    if (this.mode !== "play") return;
    const r = currentRoom(this.world);
    if (!r.done && !r.run) this.buildConsole(r);
  }

  /** Move to a point on the floor as a recorded step, so it rewinds like any other. */
  moveTo(x) {
    this.timeline.mark("travel", { en: "Next line", es: "Siguiente línea" }, { type: "travel", x, y: FLOOR });
    this.timeline.resolve({ ok: true, key: "" });
    const f = this.focus(this.world);
    this.camera.snap(f.x, f.y);
  }

  objective(w, r = currentRoom(w)) {
    if (w.rooms.every((x) => x.done)) return this.t("objExit");
    if (r.done) return this.t("objNext");
    if (r.run) return this.t("objRunning");
    if (r.kind === "build") return this.t("objBuild", { expr: write(r.target) });
    if (r.kind === "twin") return this.t("objTwin", { expr: write(r.target) });
    return this.t("objStream", { n: r.target.length, expr: write(r.target), slots: r.line.length });
  }

  describe(w) {
    const r = currentRoom(w);
    return [
      this.tx(this.level.title),
      this.objective(w),
      `${this.words?.yourLine || "Your line"}: ${write(built(r)) || "x"}`,
    ].join(". ");
  }

  stations(w) {
    const out = [];
    for (const r of w.rooms) {
      if (r.done) continue;
      out.push({
        id: `lever${r.i}`,
        room: r.i,
        type: "lever",
        x: r.x0 + 100,
        what: this.t("useBuild"),
      });
      r.line.forEach((_, i) =>
        out.push({
          id: `slot${r.i}-${i}`,
          room: r.i,
          slot: i,
          type: "slot",
          x: slotX(r, i, r.line.length),
          what: this.t("useBuild"),
        }),
      );
    }
    return out;
  }

  interactable(w) {
    const px = w.p.x + w.p.w / 2;
    if (!w.p.ground) return null;
    let best = null;
    for (const s of this.stations(w)) {
      const d = Math.abs(px - s.x);
      if (d < 56 && (!best || d < Math.abs(px - best.x))) best = s;
    }
    return best;
  }

  nextStop(w) {
    if (w.rooms.every((r) => r.done))
      return { id: "exit", x: w.exit.x + 60, y: FLOOR, what: this.t("whatNext") };
    const r = w.rooms.find((x) => !x.done);
    if (currentRoom(w).i !== r.i)
      return { id: `room${r.i}`, x: r.x0 + 100, y: FLOOR, what: this.t("whatNext") };
    return null;
  }

  interact(s) {
    const r = this.world.rooms[s.room];
    if (!r.run) this.buildConsole(r);
  }

  /** One panel: every box at once, the written line under them, and the run. */
  buildConsole(r) {
    this.openPanel(this.t("buildTitle"), (body) => {
      const preview = el("div.math");
      const paint = () => {
        preview.textContent = write(built(r)) || "x";
      };
      body.append(
        el("p.note", null, this.objective(this.world, r)),
        el("p.muted", null, this.t("buildHow")),
        ...r.line.map((_, i) => this.boxRow(r, i, paint)),
        el("p.muted", null, this.t("yourLine")),
        preview,
        el("p.muted", null, this.t("leverNote", { xs: r.xs.join(", ") })),
        this.runControls(r),
      );
      paint();
    });
  }

  /** Box `slot`: an operation and a number or x, changed in place. */
  boxRow(r, slot, paint) {
    const cur = r.line[slot] ? decode(r.line[slot]) : null;
    const op = el(
      "select",
      { "aria-label": this.t("boxOp", { n: slot + 1 }) },
      el("option", { value: "" }, this.t("boxEmpty")),
      r.ops.map((o) => el("option", { value: o, selected: cur?.op === o }, this.t(OP_KEYS[o]))),
    );
    const num = el(
      "select",
      { "aria-label": this.t("boxNum", { n: slot + 1 }) },
      ["x", ...NUMBERS].map((v) =>
        el("option", { value: v, selected: String(v) === (cur?.operand ?? "2") }, v),
      ),
    );
    const change = () => {
      const m = op.value ? encode(op.value, num.value) : null;
      const same = JSON.stringify(m) === JSON.stringify(r.line[slot]);
      num.disabled = !op.value;
      if (same) return;
      this.decide(
        "machine",
        {
          en: `Box ${slot + 1}: ${m ? machineText(m) : "empty"}`,
          es: `Casilla ${slot + 1}: ${m ? machineText(m) : "vacía"}`,
        },
        { type: "set", room: r.i, slot, m },
        { mechanic: "write-expression" },
      );
      paint();
    };
    op.addEventListener("change", change);
    num.addEventListener("change", change);
    num.disabled = !cur;
    return el("div.slotrow", null, el("span", null, this.t("boxLabel", { n: slot + 1 })), op, num);
  }

  /** The run button, or, before a room's first run, the prediction that starts it. */
  runControls(r) {
    const start = () => {
      const line = built(r);
      this.closePanel();
      this.decide(
        "run",
        { en: `Ran ${write(line) || "x"}`, es: `Corrió ${write(line) || "x"}` },
        { type: "run", room: r.i },
        {
          mechanic:
            r.kind === "build"
              ? "write-expression"
              : r.kind === "twin"
                ? "equivalent-expressions"
                : "simplify-expression",
          detail: { line: write(line), simplest: simplest(line) },
        },
      );
    };
    // Evaluate first (6-5): one prediction per room, before its first run.
    if (r.predict === null || this.predicted.has(r.i)) return action(this.t("leverGo"), start, ".primary");
    const x = r.predict;
    const right = evaluate(r.target, x);
    const opts = [right, evaluate([...r.target].reverse(), x), { n: right.n + 1, d: 1 }]
      .map(fracText)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => Number(a) - Number(b));
    return el(
      "div.stack",
      null,
      el("h3", null, this.t("predict", { x })),
      chips(
        opts.map((v) => ({ label: v, value: v })),
        () => false,
        (o) => {
          this.predicted.add(r.i);
          this.prediction = {
            mechanic: "evaluate-expression",
            choice: o.value,
            judge: () => o.value === fracText(right),
          };
          start();
        },
      ),
    );
  }

  onEvent(e) {
    switch (e.type) {
      case "stamp":
        this.stamps.set(`${e.room}:${e.slot}:${e.ref ? 1 : 0}`, this.now);
        if (!e.ref) this.audio.sfx("lock");
        break;
      case "lever":
        this.audio.sfx("power");
        break;
      case "crateOk":
        this.audio.sfx("pickup");
        break;
      case "crateReject":
        this.audio.sfx("strain");
        break;
      case "setSlot":
        this.audio.sfx("tick");
        break;
      case "outcome":
        // Right for some crates and wrong for others: say once that a line must work for every x.
        if (!e.ok && e.vars?.n > 0 && e.detail?.misses?.length && !this.said.oneRight) {
          this.said.oneRight = 1;
          this.later(3, () => this.say("ori", this.t("oneRight"), "thinking"));
        }
        // A line that missed: back to the boxes once the crates have been seen.
        if (!e.ok) this.later(2.5, () => this.openBuild());
        break;
      case "solved": {
        const r = this.world.rooms[e.room];
        this.fx.emit(r.x0 + BELT_X0 + 800, 380, 30, 170, 0, -Math.PI / 2, Math.PI * 2, 0.9);
        this.audio.sfx("discover");
        this.later(2.5, () => this.afterSolved(e.room));
        break;
      }
    }
  }

  /** After a room fills: the reasoning prompt once for twin and streamline, then on to the next line. */
  async afterSolved(i) {
    const r = this.world.rooms[i];
    if (!r.done || this.mode !== "play") return;
    const kind = r.kind === "twin" ? "twin" : r.kind === "streamline" ? "stream" : null;
    if (kind) await this.askOnce(kind);
    if (this.mode !== "play") return;
    const next = this.world.rooms.find((x) => !x.done);
    if (next) {
      this.moveTo(next.x0 + 100);
      this.openBuild();
    } else this.moveTo(this.world.exit.x + 60);
  }

  askOnce(kind) {
    if (this.asked[kind] || this.mode !== "play") return undefined;
    this.asked[kind] = true;
    const o = {
      twin: {
        prompt: this.t("explainTwin"),
        frames: [this.t("frameTwin1"), this.t("frameTwin2")],
        mechanic: "equivalent-expressions",
      },
      stream: {
        prompt: this.t("explainStream"),
        frames: [this.t("frameStream1"), this.t("frameStream2")],
        mechanic: "simplify-expression",
      },
    }[kind];
    return this.explain(o);
  }
}

define("ewl-expression-factory", ExpressionFactory);
export { ExpressionFactory, LEVELS };

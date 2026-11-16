// INEQUALITY INVASION — a gentle real-time strategy game (8-4, 8-5, 8-6, 8-7).
//
// Glimmers drift through Lantern Valley, each carrying a number. Every garden
// wants only certain glimmers, and you guide them with gates: each gate holds
// one inequality, shown both as a rule and as a number-line graph. Release the
// wave and every glimmer is tested at the gate in real time; the ones carrying
// the boundary number itself show whether ≤ or < was right. Nothing is harmed:
// a glimmer the rule turns away floats off down the side stream.

import { el } from "../../runtime/chrome.js";
import { action, chips, stepper } from "../../runtime/controls.js";
import { define, UniverseGame } from "../../runtime/shell.js";
import { createWorld, FLOOR, LEVELS } from "./levels.js";
import { linearText, passesAll, ruleText, SYMBOLS } from "./math.js";
import { draw, drawBackdrop } from "./render.js";
import { currentRoom, rules } from "./rules.js";
import { STRINGS } from "./strings.js";

class InequalityInvasion extends UniverseGame {
  static def = {
    id: "inequality-invasion",
    title: { en: "INEQUALITY INVASION", es: "INVASIÓN DE DESIGUALDADES" },
    tagline: {
      en: "Glimmers drift through Lantern Valley, each carrying a number. Set the gates' rules so every garden lights with exactly the glimmers it wants.",
      es: "Los destellos cruzan el Valle de los Faroles, cada uno con un número. Pon las reglas de las puertas para que cada jardín se encienda con los destellos que quiere.",
    },
    bed: "shield",
    lessons: ["8-4", "8-5", "8-6", "8-7"],
    uses: {},
    concepts: [],
    levels: [
      {
        id: "first-light",
        lesson: "8-4",
        standard: "6.AT.9",
        title: { en: "First Light", es: "Primera luz" },
        discovery: {
          en: "“At most 8” is x ≤ 8: the boundary is included, a closed circle. “More than 4” is x > 4: not included, an open circle.",
          es: "“Como máximo 8” es x ≤ 8: el límite se incluye, círculo cerrado. “Más de 4” es x > 4: no se incluye, círculo abierto.",
        },
      },
      {
        id: "deep-valley",
        lesson: "8-6",
        standard: "6.AT.8",
        title: { en: "Deep Valley", es: "Valle profundo" },
        discovery: {
          en: "Solve an inequality like an equation: 3x + 2 ≤ 20 becomes 3x ≤ 18, then x ≤ 6.",
          es: "Resuelve una desigualdad como una ecuación: 3x + 2 ≤ 20 se vuelve 3x ≤ 18 y luego x ≤ 6.",
        },
      },
      {
        id: "twin-gates",
        lesson: "8-7",
        lessons: ["8-5", "8-7"],
        standard: "6.AT.9",
        title: { en: "Twin Gates", es: "Puertas gemelas" },
        discovery: {
          en: "A range needs two inequalities at once: 5 ≤ x and x ≤ 9. A solution must make both true.",
          es: "Un intervalo necesita dos desigualdades a la vez: 5 ≤ x y x ≤ 9. Una solución debe hacer verdaderas las dos.",
        },
      },
    ],
    mechanics: [
      {
        id: "write-inequality",
        action: "set a gate's symbol and number from a mission in words",
        relationship: "at most k: x ≤ k; more than k: x > k; at least k: x ≥ k",
        stateChange: "the gate tests every glimmer's number",
        visible:
          "the number-line graph above the gate; glimmers pass or float off; the boundary glimmer decides ≤ vs <",
        evidence:
          "accuracy decision per wave; tags inequality-boundary-inclusion and inequality-direction-flipped",
      },
      {
        id: "solve-inequality",
        action: "solve a two-step inequality to set a one-step gate",
        relationship: "inverse operations on both sides, the symbol kept (positive coefficients)",
        stateChange: "the gate tests the solved rule",
        visible: "the garden fills with exactly the solutions in the wave, or not",
        evidence: "accuracy decision with the rule",
      },
      {
        id: "compound-inequality",
        action: "set two gates in a row",
        relationship: "a solution satisfies both inequalities",
        stateChange: "a glimmer must pass both gates",
        visible: "glimmers turned away at the first or the second gate",
        evidence: "accuracy decision with both rules; a prediction for one glimmer",
      },
    ],
  };

  static strings = STRINGS;

  rules = rules;
  said = {};
  asked = {};
  predicted = new Set();

  createWorld(index, seed) {
    return createWorld(index, seed);
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

  missionText(r) {
    if (r.kind === "solve") return this.t("solveMission", { p: linearText(r.p) });
    return this.t(r.say, { k: r.k, lo: r.lo, hi: r.hi });
  }

  draw(ctx, w, t) {
    if (this.wordsLang !== this.lang) {
      this.wordsLang = this.lang;
      this.words = Object.fromEntries(
        ["stream", "mission", "release", "garden"].map((k) => [k, this.t(k)]),
      );
    }
    draw(ctx, w, t, {
      words: this.words,
      mission: (r) => this.missionText(r),
      hot: this.hot,
      acting: this.mode === "panel",
      oriMood: this.oriMood,
      talk: this.caption?.who === "ori",
    });
  }

  onLevelStart(index) {
    this.said = {};
    this.say("ori", this.t(["hello", "helloSolve", "helloBetween"][index]), "curious");
  }

  objective(w) {
    if (w.rooms.every((r) => r.done)) return this.t("objExit");
    const r = currentRoom(w);
    if (r.done) return this.t("objNext");
    if (r.run) return this.t("objRunning");
    if (r.kind === "solve") return this.t("objSolve", { p: linearText(r.p) });
    if (r.kind === "between") return this.t("objBetween");
    return this.t("objSet");
  }

  describe(w) {
    const r = currentRoom(w);
    return [
      this.tx(this.level.title),
      this.missionText(r),
      this.objective(w),
      r.rules.map((x) => ruleText(x)).join(", "),
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
        what: this.t("useLever"),
      });
      r.gatesX.forEach((x, g) =>
        out.push({
          id: `gate${r.i}-${g}`,
          room: r.i,
          gate: g,
          type: "gate",
          x,
          what: this.t("useGate", { n: g + 1 }),
        }),
      );
    }
    return out;
  }

  interactable(w) {
    if (!w.p.ground) return null;
    const px = w.p.x + w.p.w / 2;
    let best = null;
    for (const s of this.stations(w)) {
      const d = Math.abs(px - s.x);
      if (d < 56 && (!best || d < Math.abs(px - best.x))) best = s;
    }
    this.hot = best?.type === "gate" ? `${best.room}:${best.gate}` : null;
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
    if (r.run) return;
    if (s.type === "gate") this.gateConsole(r, s.gate);
    else this.leverConsole(r);
  }

  gateConsole(r, gate) {
    let sym = r.rules[gate].sym;
    let k = r.rules[gate].k;
    this.openPanel(this.t("gateTitle", { n: gate + 1 }), (body) => {
      const math = el("div.math");
      const show = () => {
        math.textContent = `x ${sym} ${k}`;
      };
      body.append(
        el("p.note", null, this.missionText(r)),
        el("p.muted", null, this.t("gateNote")),
        math,
        el("p.muted", null, this.t("gateSym")),
        chips(
          SYMBOLS.map((s) => ({ label: s, value: s })),
          (o) => o.value === sym,
          (o) => {
            sym = o.value;
            show();
          },
        ),
        stepper(
          this,
          this.t("gateK"),
          () => k,
          (v) => {
            k = v;
            show();
          },
          -10,
          30,
        ),
        action(
          this.t("gateSet"),
          () => {
            this.closePanel();
            this.decide(
              "rule",
              { en: `Gate ${gate + 1}: x ${sym} ${k}`, es: `Puerta ${gate + 1}: x ${sym} ${k}` },
              { type: "rule", room: r.i, gate, sym, k },
              { mechanic: "write-inequality" },
            );
          },
          ".primary",
        ),
      );
      show();
    });
  }

  leverConsole(r) {
    const mech =
      r.kind === "words"
        ? "write-inequality"
        : r.kind === "solve"
          ? "solve-inequality"
          : "compound-inequality";
    const go = () => {
      this.closePanel();
      this.decide(
        "wave",
        {
          en: `Wave with ${r.rules.map((x) => ruleText(x)).join(" and ")}`,
          es: `Ola con ${r.rules.map((x) => ruleText(x)).join(" y ")}`,
        },
        { type: "release", room: r.i },
        { mechanic: mech, detail: { rules: r.rules } },
      );
    };
    this.openPanel(this.t("leverTitle"), (body) => {
      body.append(
        el(
          "p.note",
          null,
          this.t("leverNote", {
            rules: r.rules.map((x) => ruleText(x)).join(" · "),
            wave: r.wave.join(", "),
          }),
        ),
      );
      // In twin-gate rooms (8-5, solutions), predict one glimmer first.
      if (r.kind === "between" && !this.predicted.has(r.i)) {
        const v = r.wave[0];
        body.append(
          el("h3", null, this.t("predict", { v })),
          chips(
            [
              { label: this.t("yes"), value: true },
              { label: this.t("no"), value: false },
            ],
            () => false,
            (o) => {
              this.predicted.add(r.i);
              const truth = passesAll(r.rules, v);
              this.prediction = {
                mechanic: "compound-inequality",
                choice: o.value,
                judge: () => o.value === truth,
              };
              go();
            },
          ),
        );
      } else body.append(action(this.t("leverGo"), go, ".primary"));
    });
  }

  onEvent(e) {
    switch (e.type) {
      case "release":
        this.audio.sfx("whistle");
        break;
      case "pass":
        this.audio.sfx("tick");
        break;
      case "divert":
        this.audio.sfx("brake");
        break;
      case "garden":
        this.audio.sfx("pickup");
        break;
      case "outcome":
        if (!e.ok && e.misconception === "inequality-boundary-inclusion" && !this.said.boundary) {
          this.said.boundary = 1;
          this.later(3, () => this.say("ori", this.t("boundary"), "thinking"));
        }
        break;
      case "solved": {
        const r = this.world.rooms[e.room];
        this.fx.emit(r.x0 + 940, FLOOR - 80, 30, 170, 0, -Math.PI / 2, Math.PI * 2, 0.9);
        this.audio.sfx("discover");
        if (r.kind === "words" && r.runs > 1 && !this.asked.boundary)
          this.later(3, () => this.askOnce("boundary"));
        if (r.kind === "solve" && !this.asked.solve) this.later(3, () => this.askOnce("solve"));
        break;
      }
    }
  }

  askOnce(kind) {
    if (this.asked[kind] || this.mode !== "play") return;
    this.asked[kind] = true;
    const o = {
      boundary: {
        prompt: this.t("explainBoundary"),
        frames: [this.t("frameB1"), this.t("frameB2")],
        mechanic: "write-inequality",
      },
      solve: {
        prompt: this.t("explainSolve"),
        frames: [this.t("frameS1"), this.t("frameS2")],
        mechanic: "solve-inequality",
      },
    }[kind];
    this.explain(o);
  }
}

define("ewl-inequality-invasion", InequalityInvasion);
export { InequalityInvasion, LEVELS };

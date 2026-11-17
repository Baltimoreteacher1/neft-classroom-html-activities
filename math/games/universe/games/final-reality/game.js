// THE FINAL REALITY — a boss adventure built from the year's mathematics.
//
// The Unraveling Engine is a dynamic mathematical system, not a monster with a
// health bar: five shield rings, each one a working system the student has met
// (a structure's volume, an equivalent power conduit, a shuttle's unit rate, an
// inequality barrier, an equation to shut it down). Climb the arena to each
// ring's console while jumping the Engine's floor pulses; only a right setting
// collapses a ring. Unit 10 is not taught, so the Engine draws on Units 2-9.

import { el } from "../../runtime/chrome.js";
import { action, chips, stepper } from "../../runtime/controls.js";
import { define, UniverseGame } from "../../runtime/shell.js";
import { SYMBOLS } from "../inequality-invasion/math.js";
import { createWorld, FLOOR, LEVELS } from "./levels.js";
import { draw, drawBackdrop } from "./render.js";
import { current, rules } from "./rules.js";
import { STRINGS } from "./strings.js";

const eqText = (e) =>
  `${e.a === 1 ? "" : e.a}x${e.b ? (e.b > 0 ? ` + ${e.b}` : ` − ${-e.b}`) : ""} = ${e.c}`;

class FinalReality extends UniverseGame {
  static def = {
    id: "final-reality",
    title: { en: "THE FINAL REALITY", es: "LA REALIDAD FINAL" },
    tagline: {
      en: "The Unraveling Engine is tearing the world apart. Every shield ring is mathematics you already know. Bring it down.",
      es: "El Motor del Desenredo está rompiendo el mundo. Cada anillo es matemática que ya conoces. Desármalo.",
    },
    bed: "final",
    lessons: [],
    uses: {},
    concepts: [],
    levels: [
      {
        id: "the-unraveling",
        lesson: "review",
        standard: "6.AT.8",
        title: { en: "The Unraveling", es: "El Desenredo" },
        discovery: {
          en: "Volume, equivalent expressions, unit rates, inequalities and equations: the same ideas, working together as one machine.",
          es: "Volumen, expresiones equivalentes, tasas unitarias, desigualdades y ecuaciones: las mismas ideas trabajando juntas como una sola máquina.",
        },
      },
      {
        id: "encore",
        lesson: "review",
        standard: "6.AT.8",
        title: { en: "Encore", es: "Otra vez" },
        discovery: {
          en: "New numbers, same structure. Recognizing the structure is what makes mathematics portable.",
          es: "Números nuevos, la misma estructura. Reconocer la estructura es lo que hace que las matemáticas sirvan en todas partes.",
        },
      },
    ],
    mechanics: [
      {
        id: "volume",
        action: "set the housing's height",
        relationship: "V = l · w · h",
        stateChange: "the housing ring holds or falls",
        visible: "the ring collapses only at the exact volume",
        evidence: "accuracy decision; tag geom-volume-added-dimensions",
      },
      {
        id: "equivalent-expressions",
        action: "set a conduit a·x + b",
        relationship: "equivalent to k(x + c) for every x",
        stateChange: "the power ring holds or falls",
        visible: "ring 2 collapses",
        evidence: "accuracy decision; tag algebra-distributive-partial",
      },
      {
        id: "unit-rate",
        action: "choose the shuttle's unit rate",
        relationship: "rate = distance ÷ time",
        stateChange: "the shuttle meets the platform or misses it",
        visible: "ring 3 collapses",
        evidence: "accuracy decision; tags ratio-inverted and rate-not-per-one",
      },
      {
        id: "compound-inequality",
        action: "set two dials on the barrier",
        relationship: "a code passes only if it satisfies both inequalities",
        stateChange: "the waiting codes are sorted",
        visible: "ring 4 collapses",
        evidence: "accuracy decision; boundary and direction tags",
      },
      {
        id: "solve-equation",
        action: "apply moves to a·x + b = c",
        relationship: "the same operation on both sides keeps the equation true",
        stateChange: "the equation changes, or a one-sided move is undone",
        visible: "ring 5 collapses when x stands alone; the Engine goes still",
        evidence: "a decision per move; tag equation-not-inverse-operation",
      },
    ],
  };

  static strings = STRINGS;

  rules = rules;
  said = {};
  asked = {};

  createWorld(index, seed) {
    return createWorld(index, seed);
  }

  focus(w) {
    // Frame high so the whole Engine, outer ring included, stays on screen.
    return { x: w.p.x + w.p.w / 2, y: w.p.y - 150, face: w.p.face };
  }

  bounds(w) {
    return { x: 0, y: 0, w: w.w, h: w.h };
  }

  drawBackdrop(ctx, cam, w, t) {
    drawBackdrop(ctx, cam, w, t);
  }

  draw(ctx, w, t) {
    if (this.wordsLang !== this.lang) {
      this.wordsLang = this.lang;
      this.words = Object.fromEntries(
        ["structure", "power", "transport", "barrier", "shutdown"].map((k) => [k, this.t(k)]),
      );
    }
    draw(ctx, w, t, {
      words: this.words,
      acting: this.mode === "panel",
      oriMood: this.oriMood,
      talk: this.caption?.who === "ori",
    });
  }

  onLevelStart(index) {
    this.said = {};
    this.say("ori", this.t(index ? "helloEncore" : "hello"), "focused");
  }

  objective(w) {
    const s = current(w);
    if (!s) return this.t("objDone");
    if (s.kind === "structure") return this.t("objStructure", { l: s.l, w: s.w, v: s.volume });
    if (s.kind === "power") return this.t("objPower", { k: s.k, c: s.c });
    if (s.kind === "transport") return this.t("objTransport", { d: s.d, t: s.t });
    if (s.kind === "barrier") return this.t("objBarrier");
    return this.t("objShutdown", { eq: eqText(s.eq) });
  }

  describe(w) {
    return [this.tx(this.level.title), this.objective(w), `${w.stage} / ${w.stages.length}`].join(
      ". ",
    );
  }

  interactable(w) {
    const s = current(w);
    if (!s || !w.p.ground) return null;
    const px = w.p.x + w.p.w / 2;
    const feet = w.p.y + w.p.h;
    if (Math.abs(px - s.at[0]) < 50 && Math.abs(feet - s.at[1]) < 20)
      return { id: `c${s.i}`, stage: s, what: this.t("useConsole", { name: this.t(s.kind) }) };
    return null;
  }

  nextStop(w) {
    const s = current(w);
    if (!s) return null;
    const here =
      Math.abs(w.p.x + w.p.w / 2 - s.at[0]) < 20 && Math.abs(w.p.y + w.p.h - s.at[1]) < 4;
    return here ? null : { id: `c${s.i}`, x: s.at[0], y: s.at[1], what: this.t("whatNext") };
  }

  submit(label, a, mechanic) {
    this.closePanel();
    this.decide("ring", label, a, { mechanic, detail: a });
  }

  interact(target) {
    const s = target.stage;
    const title = this.t(s.kind);
    this.openPanel(title, (body) => {
      body.append(el("p.note", null, this.objective(this.world)));
      if (s.kind === "structure") {
        let h = 1;
        body.append(
          stepper(
            this,
            this.t("heightLabel"),
            () => h,
            (v) => {
              h = v;
            },
            1,
            40,
          ),
          action(
            this.t("set"),
            () =>
              this.submit(
                { en: `Height ${h}`, es: `Altura ${h}` },
                { type: "structure", stage: s.i, h },
                "volume",
              ),
            ".primary",
          ),
        );
      } else if (s.kind === "power") {
        let a = 1;
        let b = 1;
        const show = el("div.math");
        const paint = () => {
          show.textContent = `${a}x + ${b}`;
        };
        body.append(
          show,
          stepper(
            this,
            this.t("aLabel"),
            () => a,
            (v) => {
              a = v;
              paint();
            },
            1,
            12,
          ),
          stepper(
            this,
            this.t("bLabel"),
            () => b,
            (v) => {
              b = v;
              paint();
            },
            0,
            40,
          ),
          action(
            this.t("set"),
            () =>
              this.submit(
                { en: `Conduit ${a}x + ${b}`, es: `Conducto ${a}x + ${b}` },
                { type: "power", stage: s.i, a, b },
                "equivalent-expressions",
              ),
            ".primary",
          ),
        );
        paint();
      } else if (s.kind === "transport") {
        const options = [
          { n: s.t, d: s.d },
          { n: s.d / s.t, d: 1 },
          { n: s.d, d: 1 },
          { n: s.d - s.t, d: 1 },
        ];
        body.append(
          el("p.muted", null, this.t("rateOptions")),
          chips(
            options.map((o) => ({ label: o.d === 1 ? String(o.n) : `${o.n}/${o.d}`, value: o })),
            () => false,
            (o) =>
              this.submit(
                { en: `Rate ${o.label}`, es: `Tasa ${o.label}` },
                { type: "transport", stage: s.i, n: o.value.n, d: o.value.d },
                "unit-rate",
              ),
          ),
        );
      } else if (s.kind === "barrier") {
        const dials = [
          { sym: "≥", k: 0 },
          { sym: "<", k: 20 },
        ];
        body.append(el("p.muted", null, this.t("codes", { codes: s.codes.join(", ") })));
        dials.forEach((d, i) => {
          body.append(
            el("h3", null, this.t("dial", { n: i + 1 })),
            chips(
              SYMBOLS.map((x) => ({ label: x, value: x })),
              (o) => o.value === d.sym,
              (o) => {
                d.sym = o.value;
              },
            ),
            stepper(
              this,
              this.t("num"),
              () => d.k,
              (v) => {
                d.k = v;
              },
              0,
              30,
            ),
          );
        });
        body.append(
          action(
            this.t("set"),
            () =>
              this.submit(
                {
                  en: `Barrier x ${dials[0].sym} ${dials[0].k}, x ${dials[1].sym} ${dials[1].k}`,
                  es: `Barrera x ${dials[0].sym} ${dials[0].k}, x ${dials[1].sym} ${dials[1].k}`,
                },
                { type: "barrier", stage: s.i, rules: dials.map((d) => ({ ...d })) },
                "compound-inequality",
              ),
            ".primary",
          ),
        );
      } else {
        let k = 1;
        const move = (op, side) => () =>
          this.submit(
            { en: `${op} ${k} (${side})`, es: `${op} ${k} (${side})` },
            { type: "move", stage: s.i, op, k, side },
            "solve-equation",
          );
        body.append(
          el("div.math", null, eqText(s.eq)),
          stepper(
            this,
            this.t("moveK"),
            () => k,
            (v) => {
              k = v;
            },
            1,
            30,
          ),
          action(this.t("subBoth"), move("sub", "both")),
          action(this.t("addBoth"), move("add", "both")),
          action(this.t("divBoth"), move("div", "both")),
          action(this.t("subLeft"), move("sub", "left"), ".ghost"),
        );
      }
    });
  }

  onEvent(e) {
    switch (e.type) {
      case "pulseWarn":
        if (!this.said.pulse) {
          this.said.pulse = 1;
          this.toast(this.t("pulse"));
        }
        this.audio.sfx("brake");
        break;
      case "pulse":
        this.audio.sfx("power");
        this.camera.kick(2);
        break;
      case "bump":
        this.audio.sfx("strain");
        this.camera.kick(4);
        break;
      case "ringDown":
        this.audio.sfx("discover");
        this.camera.kick(5);
        this.fx.emit(720, 215, 40, 220, e.stage % 5, 0, Math.PI * 2, 1);
        break;
      case "refuse":
        this.say("ori", this.t(e.key), "thinking");
        break;
      case "complete":
        this.later(3, () => this.askOnce());
        break;
    }
  }

  askOnce() {
    if (this.asked.final) return;
    this.asked.final = true;
    this.explain({
      prompt: this.t("explainFinal"),
      frames: [this.t("frameF1"), this.t("frameF2")],
      mechanic: "review",
    });
  }
}

define("ewl-final-reality", FinalReality);
export { FinalReality, LEVELS };

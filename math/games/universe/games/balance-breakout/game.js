// BALANCE BREAKOUT — a physics puzzle platformer about equations (8-1, 8-2, 8-3).
//
// Every vault door is locked by a great balance whose two pans ARE the two
// sides of an equation, with a mystery crate of weight x on one of them. Run
// and jump to the racks, carry blocks (they weigh you down), and use the
// room's machines: the Twin Crane changes BOTH pans at once, the changer splits
// a block into two that add up to it, the divider and doubler work on both
// pans. A one-sided move tips the beam and jams the lock; a move that keeps
// both sides equal leaves it level. The door's reader only weighs a crate that
// stands alone on a level beam.

import { el } from "../../runtime/chrome.js";
import { action, chips, stepper } from "../../runtime/controls.js";
import { define, UniverseGame } from "../../runtime/shell.js";
import { createWorld, DOOR_DX, FLOOR, LEVELS, PAN_DX, TOOL_DX } from "./levels.js";
import { equationText } from "./math.js";
import { draw, drawBackdrop } from "./render.js";
import { currentRoom, isLevel, panOf, rules } from "./rules.js";
import { STRINGS } from "./strings.js";

const WORDS = ["level", "tipped", "crane", "changer", "divider", "doubler", "pairs", "rack"];
const REACH = 70;

const itemText = (it) =>
  it.k === "x" ? "x" : it.k === "half" ? "x/2" : it.k === "b" ? `−${it.v}` : String(it.v);

class BalanceBreakout extends UniverseGame {
  static def = {
    id: "balance-breakout",
    title: { en: "BALANCE BREAKOUT", es: "FUGA DEL EQUILIBRIO" },
    tagline: {
      en: "Every door in the Equilibrium Vault is locked by a balance. The balance is the equation. Keep it level and get x alone.",
      es: "Cada puerta de la Bóveda del Equilibrio está cerrada con una balanza. La balanza es la ecuación. Mantenla nivelada y deja x sola.",
    },
    bed: "vault",
    lessons: ["8-1", "8-2", "8-3"],
    uses: {},
    concepts: [],
    levels: [
      {
        id: "counterweight",
        lesson: "8-1",
        standard: "6.AT.8",
        title: { en: "Counterweight", es: "Contrapeso" },
        discovery: {
          en: "A solution is the value of x that makes both sides equal: the one that leaves the beam level.",
          es: "Una solución es el valor de x que hace iguales los dos lados: el que deja la balanza nivelada.",
        },
      },
      {
        id: "twin-crane",
        lesson: "8-2",
        standard: "6.AT.8",
        title: { en: "Twin Crane", es: "Grúa Gemela" },
        discovery: {
          en: "Adding or subtracting the same amount on both sides keeps an equation true. Use the inverse operation to get x alone.",
          es: "Sumar o restar lo mismo en los dos lados mantiene verdadera una ecuación. Usa la operación inversa para dejar x sola.",
        },
      },
      {
        id: "splitter",
        lesson: "8-3",
        standard: "6.AT.8",
        title: { en: "Splitter", es: "Divisor" },
        discovery: {
          en: "Dividing or multiplying both sides by the same number keeps an equation true: 3x = 12 becomes x = 4, x/2 = 5 becomes x = 10.",
          es: "Dividir o multiplicar los dos lados por el mismo número mantiene verdadera una ecuación: 3x = 12 se vuelve x = 4, x/2 = 5 se vuelve x = 10.",
        },
      },
    ],
    mechanics: [
      {
        id: "equation-solution",
        action: "carry blocks onto a pan until the beam is level, then key in x",
        relationship: "a solution makes both sides equal",
        stateChange: "pan weights change; the beam tips toward the heavier side",
        visible:
          "the beam levels (green pointer) only when the sides are equal; the door opens for the right x",
        evidence: "keypad decision; tag equation-answered-with-given-number",
      },
      {
        id: "equality-transform",
        action: "use the Twin Crane, divider or doubler (both pans), or move one block (one pan)",
        relationship:
          "doing the same to both sides keeps the equation true; doing it to one side does not",
        stateChange: "both pans change, or one does",
        visible: "the beam stays level, or tips and jams the lock",
        evidence:
          "accuracy decision per move; tag equation-not-inverse-operation for a valid but backwards move",
      },
      {
        id: "isolate-x",
        action: "keep transforming until the crate stands alone",
        relationship: "x = the other side",
        stateChange: "the door's reader weighs the crate",
        visible: "the reader shows x and the door opens",
        evidence: "accuracy decision with x",
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
    // Frame high: the equation plate above the beam must clear the objective banner.
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
    draw(ctx, w, t, {
      words: this.words,
      lowfx: this.lowfx,
      acting: this.mode === "panel",
      oriMood: this.oriMood,
      talk: this.caption?.who === "ori",
    });
  }

  onLevelStart() {
    this.said = {};
    this.say("ori", this.t("hello"), "curious");
  }

  // ---------- objective and description ----------
  objective(w) {
    if (w.rooms.every((r) => r.solved)) return this.t("objExit");
    const r = currentRoom(w);
    if (r.solved) return this.t("objNext");
    const level = isLevel(r);
    if (r.mode === "keypad")
      return level && r.right.length
        ? this.t("objKeypadLevel", { eq: equationText(r.left, r.right) })
        : this.t("objKeypad");
    return level ? this.t("objIsolate") : this.t("objTipped");
  }

  describe(w) {
    const r = currentRoom(w);
    const parts = [
      this.tx(this.level.title),
      this.objective(w),
      equationText(r.left, r.right),
      this.t(isLevel(r) ? "level" : "tipped"),
    ];
    if (w.carry) parts.push(this.t("carrying", { v: itemText(w.carry) }));
    return parts.join(". ");
  }

  // ---------- reach ----------
  stations(w) {
    const out = [];
    for (const r of w.rooms) {
      out.push({
        id: `L${r.i}`,
        room: r.i,
        type: "pan",
        pan: "left",
        x: r.bx - PAN_DX,
        what: this.t("usePanLeft"),
      });
      out.push({
        id: `R${r.i}`,
        room: r.i,
        type: "pan",
        pan: "right",
        x: r.bx + PAN_DX,
        what: this.t("usePanRight"),
      });
      for (const k of r.tools)
        out.push({
          id: `${k}${r.i}`,
          room: r.i,
          type: k,
          x: r.bx + TOOL_DX[k] + (k === "crane" ? 0 : 0),
          what: this.t(`use${k[0].toUpperCase()}${k.slice(1)}`),
        });
      r.racks.forEach((rack, i) =>
        out.push({
          id: `rack${r.i}-${i}`,
          room: r.i,
          type: "rack",
          rack: i,
          x: rack.x,
          y: rack.y,
          what: this.t("useRack"),
        }),
      );
      if (r.mode === "keypad" && !r.solved)
        out.push({
          id: `door${r.i}`,
          room: r.i,
          type: "keypad",
          x: r.bx + DOOR_DX - 36,
          what: this.t("useKeypad"),
        });
    }
    return out;
  }

  interactable(w) {
    const px = w.p.x + w.p.w / 2;
    const feet = w.p.y + w.p.h;
    let best = null;
    for (const s of this.stations(w)) {
      const dy = Math.abs(feet - (s.y ?? FLOOR));
      // The crane stands between the pans: reach it from just in front of the pillar.
      const dx = Math.abs(px - s.x);
      if (dx < REACH && dy < 60 && (!best || dx < Math.abs(px - best.x))) best = s;
    }
    return best;
  }

  nextStop(w) {
    if (w.rooms.every((r) => r.solved)) {
      const e = w.exit;
      return { id: "exit", x: e.x + e.w / 2, y: FLOOR, what: this.t("whatExit") };
    }
    const r = w.rooms.find((x) => !x.solved);
    const here = currentRoom(w);
    if (here.i !== r.i || Math.abs(w.p.x - r.bx) > 400)
      return { id: `room${r.i}`, x: r.bx - PAN_DX - 60, y: FLOOR, what: this.t("whatRoom") };
    return null;
  }

  interact(s) {
    const w = this.world;
    const r = w.rooms[s.room];
    if (s.type === "pan") this.panConsole(r, s.pan);
    else if (s.type === "rack") this.rackConsole(r, s.rack);
    else if (s.type === "crane") this.craneConsole(r);
    else if (s.type === "changer") this.changerConsole(r);
    else if (s.type === "divider") this.dividerConsole(r);
    else if (s.type === "doubler") this.doublerConsole(r);
    else if (s.type === "keypad") this.keypadConsole(r);
  }

  /** Every console decision goes through here so it is a turning point on the timeline. */
  act(label, a, mechanic) {
    this.closePanel();
    this.decide("equation", label, a, { mechanic, lesson: this.level.lesson });
  }

  // ---------- consoles ----------
  panConsole(r, pan) {
    const w = this.world;
    const items = panOf(r, pan);
    this.openPanel(this.t(pan === "left" ? "panTitleLeft" : "panTitleRight"), (body) => {
      body.append(
        el("div.math", null, equationText(r.left, r.right)),
        el(
          "p.note",
          null,
          items.length
            ? this.t("panHolds", { list: items.map(itemText).join(", ") })
            : this.t("panEmpty"),
        ),
      );
      if (w.carry) {
        body.append(
          el("p.muted", null, this.t("carrying", { v: itemText(w.carry) })),
          action(
            this.t("putHere", { v: itemText(w.carry) }),
            () =>
              this.act(
                {
                  en: `Put ${itemText(w.carry)} on the ${pan} pan`,
                  es: `Puso ${itemText(w.carry)} en el plato ${pan === "left" ? "izquierdo" : "derecho"}`,
                },
                { type: "put", room: r.i, pan },
                "equation-solution",
              ),
            ".primary",
          ),
        );
      } else
        items.forEach((it, index) => {
          if (it.k === "w")
            body.append(
              action(this.t("take", { v: it.v }), () =>
                this.act(
                  {
                    en: `Took ${it.v} off the ${pan} pan`,
                    es: `Quitó ${it.v} del plato ${pan === "left" ? "izquierdo" : "derecho"}`,
                  },
                  { type: "take", room: r.i, pan, index },
                  "equality-transform",
                ),
              ),
            );
        });
    });
  }

  rackConsole(r, i) {
    const w = this.world;
    const rack = r.racks[i];
    this.openPanel(this.t("rackTitle"), (body) => {
      if (w.carry)
        body.append(
          action(this.t("rackPut", { v: itemText(w.carry) }), () =>
            this.act(
              { en: "Put a block back", es: "Devolvió un bloque" },
              { type: "rackPut", room: r.i, rack: i },
              "equation-solution",
            ),
          ),
        );
      else
        rack.items.forEach((it, index) =>
          body.append(
            action(this.t("rackTake", { v: it.v }), () =>
              this.act(
                { en: `Picked up ${it.v}`, es: `Tomó ${it.v}` },
                { type: "rackTake", room: r.i, rack: i, index },
                "equation-solution",
              ),
            ),
          ),
        );
    });
  }

  craneConsole(r) {
    this.openPanel(this.t("craneTitle"), (body) => {
      body.append(
        el("div.math", null, equationText(r.left, r.right)),
        el("p.note", null, this.t("craneNote")),
      );
      const common = [...new Set(r.left.filter((it) => it.k === "w").map((it) => it.v))].filter(
        (v) => r.right.some((it) => it.k === "w" && it.v === v),
      );
      if (!common.length) body.append(el("p.muted", null, this.t("craneNone")));
      for (const v of common)
        body.append(
          action(
            this.t("craneRemove", { v }),
            () =>
              this.act(
                { en: `Crane: −${v} on both sides`, es: `Grúa: −${v} en los dos lados` },
                { type: "craneRemove", room: r.i, v },
                "equality-transform",
              ),
            ".primary",
          ),
        );
      for (const v of [...new Set(r.pairs)])
        body.append(
          action(this.t("craneAdd", { v }), () =>
            this.act(
              { en: `Crane: +${v} on both sides`, es: `Grúa: +${v} en los dos lados` },
              { type: "craneAdd", room: r.i, v },
              "equality-transform",
            ),
          ),
        );
    });
  }

  changerConsole(r) {
    const blocks = [];
    for (const pan of ["left", "right"])
      panOf(r, pan).forEach(
        (it, index) => it.k === "w" && it.v > 1 && blocks.push({ pan, index, v: it.v }),
      );
    let pick = 0;
    let a = 1;
    this.openPanel(this.t("changerTitle"), (body) => {
      const math = el("div.math");
      const show = () => {
        const b = blocks[pick];
        math.textContent = b ? `${b.v} → ${a} + ${b.v - a}` : "—";
      };
      body.append(
        el("p.note", null, this.t("changerNote")),
        el("p.muted", null, this.t("changerPick")),
      );
      body.append(
        chips(
          blocks.map((b, i) => ({
            label: `${b.v} (${this.t(b.pan === "left" ? "usePanLeft" : "usePanRight")})`,
            value: i,
          })),
          (o) => o.value === pick,
          (o) => {
            pick = o.value;
            a = Math.min(a, blocks[pick].v - 1);
            show();
          },
        ),
        stepper(
          this,
          this.t("changerA"),
          () => a,
          (v) => {
            a = Math.min(v, (blocks[pick]?.v || 2) - 1);
            show();
          },
          1,
          20,
        ),
        math,
        action(
          this.t("changerGo"),
          () => {
            const b = blocks[pick];
            if (!b) return;
            this.act(
              {
                en: `Split ${b.v} into ${a} + ${b.v - a}`,
                es: `Partió ${b.v} en ${a} + ${b.v - a}`,
              },
              { type: "change", room: r.i, pan: b.pan, index: b.index, a },
              "equality-transform",
            );
          },
          ".primary",
        ),
      );
      show();
    });
  }

  dividerConsole(r) {
    let k = 2;
    this.openPanel(this.t("dividerTitle"), (body) => {
      body.append(
        el("div.math", null, equationText(r.left, r.right)),
        el("p.note", null, this.t("dividerNote")),
        stepper(
          this,
          this.t("dividerK"),
          () => k,
          (v) => {
            k = v;
          },
          2,
          6,
        ),
        action(
          this.t("dividerGo"),
          () =>
            this.act(
              { en: `Divide both sides by ${k}`, es: `Dividir los dos lados entre ${k}` },
              { type: "divide", room: r.i, k },
              "equality-transform",
            ),
          ".primary",
        ),
      );
    });
  }

  doublerConsole(r) {
    this.openPanel(this.t("doublerTitle"), (body) => {
      body.append(
        el("div.math", null, equationText(r.left, r.right)),
        el("p.note", null, this.t("doublerNote")),
        action(
          this.t("doublerGo"),
          () =>
            this.act(
              { en: "Double both sides", es: "Duplicar los dos lados" },
              { type: "double", room: r.i },
              "equality-transform",
            ),
          ".primary",
        ),
      );
    });
  }

  keypadConsole(r) {
    let value = 1;
    this.openPanel(this.t("keypadTitle"), (body) => {
      body.append(
        el("p.note", null, this.t("keypadNote", { eq: equationText(r.left, r.right) })),
        stepper(
          this,
          this.t("keypadValue"),
          () => value,
          (v) => {
            value = v;
          },
          0,
          30,
        ),
        action(
          this.t("keypadGo"),
          () =>
            this.act(
              { en: `Keyed x = ${value}`, es: `Escribió x = ${value}` },
              { type: "keypad", room: r.i, value },
              "equation-solution",
            ),
          ".primary",
        ),
      );
    });
  }

  // ---------- presentation ----------
  onEvent(e) {
    const w = this.world;
    switch (e.type) {
      case "pickup":
        this.audio.sfx("pickup");
        break;
      case "putdown":
        this.audio.sfx("land", 0.6);
        break;
      case "tilt":
        this.audio.sfx("strain");
        this.camera.kick(2);
        if (!this.said.tilt) {
          this.said.tilt = 1;
          this.later(3.5, () => this.say("ori", this.t("tiltNote"), "worried"));
        }
        break;
      case "level":
        this.audio.sfx("lock");
        if (!this.said.level) {
          this.said.level = 1;
          this.later(1, () => this.say("ori", this.t("level0"), "surprised"));
        }
        break;
      case "crane":
        this.audio.sfx("power");
        break;
      case "change":
      case "divide":
      case "double":
        this.audio.sfx("open");
        break;
      case "pop":
        this.audio.sfx("dash");
        this.toast(this.t("pop"));
        break;
      case "refuse":
        this.say("wren", this.t(e.key, e.vars), "worried");
        break;
      case "checkpoint": {
        const i = Number(e.id.slice(2));
        const r = w.rooms[i];
        if (!r) break;
        const line = r.left.some((it) => it.k === "b")
          ? "balloon0"
          : r.left.some((it) => it.k === "half")
            ? "half0"
            : r.tools.includes("divider") && r.left.filter((it) => it.k === "x").length > 1
              ? "split0"
              : r.tools.includes("crane") && !this.said.crane
                ? "crane0"
                : null;
        if (line) {
          if (line === "crane0") this.said.crane = 1;
          this.later(0.6, () => this.say("ori", this.t(line), "curious"));
        }
        break;
      }
      case "solved": {
        const r = w.rooms[e.room];
        this.fx.emit(r.bx + DOOR_DX, FLOOR - 120, 30, 170, 4, -Math.PI / 2, Math.PI * 2, 0.9);
        this.audio.sfx("discover");
        if (this.level.lesson === "8-2" && !this.asked.crane)
          this.later(3, () => this.askOnce("crane"));
        if (this.level.lesson === "8-3" && !this.asked.divide && r.tools.includes("divider"))
          this.later(3, () => this.askOnce("divide"));
        break;
      }
    }
  }

  askOnce(kind) {
    if (this.asked[kind] || this.mode !== "play") return;
    this.asked[kind] = true;
    const o = {
      crane: {
        prompt: this.t("explainCrane"),
        frames: [this.t("frameCrane1"), this.t("frameCrane2")],
        mechanic: "equality-transform",
      },
      divide: {
        prompt: this.t("explainDivide"),
        frames: [this.t("frameDiv1"), this.t("frameDiv2")],
        mechanic: "equality-transform",
      },
    }[kind];
    this.explain(o);
  }
}

define("ewl-balance-breakout", BalanceBreakout);
export { BalanceBreakout, LEVELS };

// FRACTION FOOD TRUCK — a real-time kitchen game about dividing fractions
// (6-1, 6-2, 6-9, 6-10, 6-11).
//
// Every order on the ticket rail is a batch to portion: 3 cups of soup in
// 3/4-cup bowls, 3/4 of a pan shared on 3 plates. Walk the truck, set the
// serving station, and the ladle portions the batch one serving at a time, so
// the division is something you watch: every bowl full and the pot empty, or a
// bowl that comes up short, or soup still in the pot. No clock: customers wait.

import { el } from "../../runtime/chrome.js";
import { action, stepper } from "../../runtime/controls.js";
import { define, UniverseGame } from "../../runtime/shell.js";
import { createWorld, FLOOR, LEVELS, STATIONS } from "./levels.js";
import { text } from "./math.js";
import { draw, drawBackdrop } from "./render.js";
import { order, rules } from "./rules.js";
import { STRINGS } from "./strings.js";

const UNIT = { soup: "bowl", pizza: "plate", cake: "tin" };

class FractionFoodTruck extends UniverseGame {
  static def = {
    id: "fraction-food-truck",
    title: { en: "FRACTION FOOD TRUCK", es: "FOOD TRUCK DE FRACCIONES" },
    tagline: {
      en: "Every order is a batch to portion. Set the serving station and watch the ladle prove your division, one serving at a time.",
      es: "Cada pedido es una tanda para repartir. Ajusta la estación de servir y mira cómo el cucharón comprueba tu división, porción por porción.",
    },
    bed: "kitchen",
    lessons: ["6-1", "6-2", "6-9", "6-10", "6-11"],
    uses: {},
    concepts: [],
    levels: [
      {
        id: "soup-station",
        lesson: "6-1",
        lessons: ["6-1", "6-9"],
        standard: "6.NOS.1",
        title: { en: "Soup Station", es: "Estación de sopa" },
        discovery: {
          en: "3 ÷ 3/4 asks how many 3/4s fit in 3: four. Sharing 3/4 on 3 plates gives each 1/4.",
          es: "3 ÷ 3/4 pregunta cuántos 3/4 caben en 3: cuatro. Repartir 3/4 en 3 platos da 1/4 a cada uno.",
        },
      },
      {
        id: "pizza-line",
        lesson: "6-2",
        lessons: ["6-2", "6-10"],
        standard: "6.NOS.1",
        title: { en: "Pizza Line", es: "Línea de pizza" },
        discovery: {
          en: "With mixed numbers, think in the portion's pieces: 2 1/4 is 9/4, and 9 fourths make 3 servings of 3/4.",
          es: "Con números mixtos, piensa en piezas de la porción: 2 1/4 es 9/4, y 9 cuartos hacen 3 porciones de 3/4.",
        },
      },
      {
        id: "catering",
        lesson: "6-11",
        standard: "6.NOS.1",
        title: { en: "Catering", es: "Catering" },
        discovery: {
          en: "When a batch does not split evenly, the quotient has a whole part (the full servings) and a remainder (what is left).",
          es: "Cuando una tanda no se reparte exacta, el cociente tiene una parte entera (las porciones completas) y un residuo (lo que sobra).",
        },
      },
    ],
    mechanics: [
      {
        id: "measurement-division",
        action: "set how many servings a batch makes",
        relationship: "servings = batch ÷ portion",
        stateChange: "the ladle takes one portion per serving from the batch",
        visible: "every bowl full and the pot empty; a bowl short; or soup left in the pot",
        evidence: "accuracy decision; tags fraction-no-reciprocal and op-reversed-division",
      },
      {
        id: "share-division",
        action: "set how much goes on each of n plates",
        relationship: "each = batch ÷ plates",
        stateChange: "each plate gets that amount, in turn",
        visible: "the last plates short, or batch left over",
        evidence: "accuracy decision with the fraction",
      },
      {
        id: "division-remainder",
        action: "set how many FULL servings a batch makes",
        relationship: "whole part of batch ÷ portion; the remainder stays",
        stateChange: "full servings ladled; the rest stays in the pot",
        visible: "the leftover on the gauge",
        evidence: "accuracy decision",
      },
    ],
  };

  static strings = STRINGS;

  rules = rules;
  said = {};
  asked = {};
  groups = false;

  createWorld(index, seed) {
    return createWorld(index, seed);
  }

  focus(w) {
    // The camera clamps to the truck; the focus is the cook.
    return { x: w.p.x + w.p.w / 2, y: 300, face: w.p.face };
  }

  bounds(w) {
    return { x: 0, y: 0, w: w.w, h: w.h };
  }

  drawBackdrop(ctx) {
    drawBackdrop(ctx);
  }

  ticketLines(o) {
    const food = this.t(this.world.food);
    const unit = this.t(UNIT[this.world.food]);
    if (o.kind === "share")
      return [
        this.t("tShare", { total: text(o.total), food }),
        this.t("tShareQ", { plates: o.plates }),
      ];
    return [
      this.t("tCount", { total: text(o.total), food }),
      this.t(o.kind === "full" ? "tFullQ" : "tCountQ", { portion: text(o.portion), unit }),
    ];
  }

  draw(ctx, w, t) {
    if (this.wordsLang !== this.lang) {
      this.wordsLang = this.lang;
      this.words = Object.fromEntries(
        ["window", "ticket", "groups", "left"].map((k) => [k, this.t(k)]),
      );
    }
    draw(ctx, w, t, {
      words: this.words,
      ticket: (o) => this.ticketLines(o),
      groups: this.groups,
      acting: this.mode === "panel",
      oriMood: this.oriMood,
      talk: this.caption?.who === "ori",
    });
  }

  onLevelStart(index) {
    this.said = {};
    this.groups = false;
    this.say("ori", this.t(["hello", "helloPizza", "helloCake"][index]), "curious");
  }

  onRewind() {
    this.groups = false;
  }

  objective(w) {
    if (!order(w)) return this.t("objDone");
    if (w.serving) return this.t("objServing");
    return this.t("objOrder");
  }

  describe(w) {
    const o = order(w);
    return [this.tx(this.level.title), this.objective(w), ...(o ? this.ticketLines(o) : [])].join(
      ". ",
    );
  }

  interactable(w) {
    if (w.serving || !order(w) || !w.p.ground) return null;
    const px = w.p.x + w.p.w / 2;
    if (Math.abs(px - STATIONS.serve) < 70)
      return { id: "serve", type: "serve", what: this.t("useServe") };
    if (Math.abs(px - STATIONS.pantry) < 70 && order(w).kind !== "share")
      return { id: "pantry", type: "pantry", what: this.t("usePantry") };
    return null;
  }

  nextStop(w) {
    if (!order(w)) return null;
    return Math.abs(w.p.x + w.p.w / 2 - STATIONS.serve) < 40
      ? null
      : { id: "serve", x: STATIONS.serve, y: FLOOR, what: this.t("whatNext") };
  }

  interact(s) {
    if (s.type === "pantry") return this.groupsConsole();
    const o = order(this.world);
    if (o.kind === "share") return this.shareConsole(o);
    return this.countConsole(o);
  }

  groupsConsole() {
    this.openPanel(this.t("groupsTitle"), (body) => {
      body.append(
        el("p.note", null, this.t("groupsNote")),
        action(
          this.t("groupsGo"),
          () => {
            this.groups = true;
            this.support("group-model");
            this.closePanel();
          },
          ".primary",
        ),
      );
    });
  }

  countConsole(o) {
    let count = 1;
    this.openPanel(this.t("serveTitle"), (body) => {
      body.append(
        ...this.ticketLines(o).map((l) => el("p.note", null, l)),
        stepper(
          this,
          this.t("serveCount"),
          () => count,
          (v) => {
            count = v;
          },
          1,
          16,
        ),
        action(
          this.t("serveGo"),
          () => {
            this.closePanel();
            this.groups = false;
            this.decide(
              "serve",
              { en: `Served ${count}`, es: `Sirvió ${count}` },
              { type: "serve", count },
              {
                mechanic: o.kind === "full" ? "division-remainder" : "measurement-division",
                detail: { count },
              },
            );
          },
          ".primary",
        ),
      );
    });
  }

  shareConsole(o) {
    let n = 1;
    let d = 2;
    this.openPanel(this.t("serveTitle"), (body) => {
      const math = el("div.math");
      const show = () => {
        math.textContent = `${n}/${d}`;
      };
      body.append(
        ...this.ticketLines(o).map((l) => el("p.note", null, l)),
        el("p.muted", null, this.t("serveEach")),
        math,
        stepper(
          this,
          this.t("num"),
          () => n,
          (v) => {
            n = v;
            show();
          },
          1,
          12,
        ),
        stepper(
          this,
          this.t("den"),
          () => d,
          (v) => {
            d = v;
            show();
          },
          1,
          12,
        ),
        action(
          this.t("serveGo"),
          () => {
            this.closePanel();
            this.decide(
              "serve",
              { en: `Served ${n}/${d} each`, es: `Sirvió ${n}/${d} cada uno` },
              { type: "serve", each: { n, d } },
              { mechanic: "share-division", detail: { each: `${n}/${d}` } },
            );
          },
          ".primary",
        ),
      );
      show();
    });
  }

  onEvent(e) {
    switch (e.type) {
      case "serve":
        this.audio.sfx("open");
        break;
      case "ladle":
        this.audio.sfx(e.short ? "strain" : "pickup");
        break;
      case "outcome":
        if (!e.ok) {
          this.misses = (this.misses || 0) + 1;
          if (this.misses >= 2 && !this.said.groups && order(this.world)?.kind !== "share") {
            this.said.groups = 1;
            this.later(2.5, () => this.say("ori", this.t("groupsHint"), "thinking"));
          }
        } else {
          this.misses = 0;
          this.fx.emit(STATIONS.counter, 260, 26, 160, 4, -Math.PI / 2, Math.PI * 2, 0.9);
          if (e.mechanic === "measurement-division" && !this.asked.count)
            this.later(2.5, () => this.askOnce("count"));
          if (e.mechanic === "share-division" && !this.asked.share)
            this.later(2.5, () => this.askOnce("share"));
        }
        break;
    }
  }

  askOnce(kind) {
    if (this.asked[kind] || this.mode !== "play") return;
    this.asked[kind] = true;
    const o = {
      count: {
        prompt: this.t("explainCount"),
        frames: [this.t("frameCount1"), this.t("frameCount2")],
        mechanic: "measurement-division",
      },
      share: {
        prompt: this.t("explainShare"),
        frames: [this.t("frameShare1"), this.t("frameShare2")],
        mechanic: "share-division",
      },
    }[kind];
    this.explain(o);
  }
}

define("ewl-fraction-food-truck", FractionFoodTruck);
export { FractionFoodTruck, LEVELS };

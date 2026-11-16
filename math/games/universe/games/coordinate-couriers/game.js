// COORDINATE COURIERS — a top-down delivery adventure (7-5, 7-6, 7-8, 7-9).
//
// Drive a courier scooter through Meridia, a city laid out on the coordinate
// plane. Parcels are addressed with ordered pairs, and nothing on the map says
// where you are: you read it from the numbered axes. Cable cars cross the river
// only when their cable is set to the true distance between two stations;
// mirror pads send you to your reflection across an axis, the only way into
// walled districts.

import { el } from "../../runtime/chrome.js";
import { action, chips, stepper } from "../../runtime/controls.js";
import { define, UniverseGame } from "../../runtime/shell.js";
import { createWorld, LEVELS, SIZE, toPx } from "./levels.js";
import { gridDistance, pointText, reflect, same } from "./math.js";
import { draw, drawBackdrop, drawOverlay } from "./render.js";
import { connected, nextDelivery, padAt, rules, spot, stationAt } from "./rules.js";
import { STRINGS } from "./strings.js";

class CoordinateCouriers extends UniverseGame {
  static def = {
    id: "coordinate-couriers",
    title: { en: "COORDINATE COURIERS", es: "MENSAJEROS DE COORDENADAS" },
    tagline: {
      en: "Meridia is built on the coordinate plane. Read the streets from the axes, cross the river by cable car, and use mirrors to reach walled districts.",
      es: "Meridia está construida sobre el plano de coordenadas. Lee las calles desde los ejes, cruza el río en teleférico y usa espejos para llegar a los distritos amurallados.",
    },
    bed: "city",
    lessons: ["7-5", "7-6", "7-8", "7-9"],
    uses: {},
    concepts: [],
    levels: [
      {
        id: "four-quadrants",
        lesson: "7-8",
        lessons: ["7-5", "7-8"],
        standard: "6.NOS.7",
        title: { en: "Four Quadrants", es: "Cuatro cuadrantes" },
        discovery: {
          en: "An ordered pair tells you how far to go along the x-axis first, then along the y-axis. The signs tell you the quadrant.",
          es: "Un par ordenado te dice cuánto avanzar primero por el eje x y luego por el eje y. Los signos te dicen el cuadrante.",
        },
      },
      {
        id: "cable-cars",
        lesson: "7-6",
        standard: "6.NOS.9",
        title: { en: "Cable Cars", es: "Teleféricos" },
        discovery: {
          en: "Between points on opposite sides of an axis, add the absolute values. On the same side, subtract them.",
          es: "Entre puntos en lados opuestos de un eje, suma los valores absolutos. Del mismo lado, réstalos.",
        },
      },
      {
        id: "mirror-district",
        lesson: "7-9",
        standard: "6.NOS.7",
        title: { en: "Mirror District", es: "Distrito de espejos" },
        discovery: {
          en: "Reflecting across the x-axis changes the sign of y; across the y-axis, the sign of x. Two reflections change both.",
          es: "Reflejar sobre el eje x cambia el signo de y; sobre el eje y, el signo de x. Dos reflexiones cambian los dos.",
        },
      },
    ],
    mechanics: [
      {
        id: "ordered-pairs",
        action: "drive to the point you read as the address and deliver",
        relationship: "(x, y): x along the x-axis, then y along the y-axis, signs set direction",
        stateChange: "the delivery is checked against the point you stand on",
        visible: "the customer takes the parcel, or names the point you are really at",
        evidence: "accuracy decision with both points; tags coord-xy-swapped and sign-dropped",
      },
      {
        id: "grid-distance",
        action: "set a cable car's length between two stations on one street",
        relationship:
          "distance = |a − b| on one line; across an axis, the sum of the absolute values",
        stateChange: "the car runs exactly that many units",
        visible: "it docks, stops short over the water, or overshoots into the buffer",
        evidence: "accuracy decision; tag sign-dropped for |a| − |b| across an axis",
      },
      {
        id: "reflection",
        action: "on a mirror pad, predict the landing point and pick an axis",
        relationship: "across x: (a, b) → (a, −b); across y: (a, b) → (−a, b)",
        stateChange: "you warp to the reflection if a pad is there",
        visible: "you appear inside the walled district, or the mirror stays dark",
        evidence: "accuracy decision plus the prediction",
      },
    ],
  };

  static strings = STRINGS;

  rules = rules;
  said = {};
  asked = {};
  showTarget = false;

  createWorld(index, seed) {
    return createWorld(index, seed);
  }

  focus(w) {
    return { x: w.p.x + w.p.w / 2, y: w.p.y + w.p.h / 2, face: 0 };
  }

  bounds() {
    return { x: 0, y: 0, w: SIZE, h: SIZE };
  }

  drawBackdrop(ctx) {
    drawBackdrop(ctx);
  }

  draw(ctx, w, t) {
    draw(ctx, w, t, {
      showTarget: this.showTarget,
      oriMood: this.oriMood,
      talk: this.caption?.who === "ori",
    });
  }

  drawOverlay(ctx, w) {
    drawOverlay(ctx, w, { parcel: this.t("parcel") });
  }

  onLevelStart(index) {
    this.said = {};
    this.showTarget = false;
    this.say("ori", this.t(["hello", "helloCable", "helloMirror"][index]), "curious");
  }

  onRewind() {
    this.showTarget = false;
  }

  objective(w) {
    const d = nextDelivery(w);
    if (!d) return this.t("objDone");
    const address = pointText(d);
    const from = spot(w) || { x: Math.round((w.p.x + 11) / 110 - 6.5), y: 0 };
    if (w.level === 1 && !connected(w, from, d)) return this.t("objCable", { address });
    if (w.level === 2 && !connected(w, from, d)) return this.t("objMirror", { address });
    return this.t("objDeliver", { address });
  }

  describe(w) {
    const d = nextDelivery(w);
    const s = spot(w);
    const parts = [this.tx(this.level.title), this.objective(w)];
    // A screen reader user cannot see the painted axis numbers, so the canvas
    // label states where the scooter is, as the sighted map does by its streets.
    if (s) parts.push(`At ${pointText(s)}`);
    if (d) parts.push(`${this.t("parcel")} ${pointText(d)}`);
    return parts.join(". ");
  }

  interactable(w) {
    if (w.ride || w.warp) return null;
    const st = stationAt(w);
    if (st)
      return {
        id: `cable-${st.cable.id}-${st.end}`,
        type: "cable",
        station: st,
        what: this.t("useCable"),
      };
    const pad = padAt(w);
    if (pad) return { id: `pad-${pad.x},${pad.y}`, type: "pad", pad, what: this.t("usePad") };
    const s = spot(w);
    if (s && nextDelivery(w))
      return { id: `door-${s.x},${s.y}`, type: "deliver", at: s, what: this.t("useDeliver") };
    return null;
  }

  /** "Guide me there": the next delivery if the streets reach it, else the station or pad that leads on. */
  nextStop(w) {
    const d = nextDelivery(w);
    if (!d) return null;
    const here = spot(w) || { x: 0, y: 0 };
    const stop = (p) =>
      same(p, here) ? null : { id: `${p.x},${p.y}`, x: p.x, y: p.y, what: this.t("whatNext") };
    if (connected(w, here, d)) return stop(d);
    for (const c of w.cables) {
      if (connected(w, here, c.a) && !connected(w, c.b, here)) return stop(c.a);
      if (c.done && connected(w, here, c.b) && !connected(w, c.a, here)) return stop(c.b);
    }
    // Mirror pads: one whose reflection reaches the parcel, or the first step of a two-step route.
    const pads = w.pads.filter((p) => connected(w, here, p));
    const reaches = (p) =>
      w.pads.some((q) => ["x", "y"].some((a) => same(reflect(p, a), q)) && connected(w, q, d));
    const one = pads.find((p) =>
      ["x", "y"].some(
        (a) =>
          same(reflect(p, a), d) ||
          (w.pads.some((q) => same(q, reflect(p, a))) && connected(w, reflect(p, a), d)),
      ),
    );
    const two = pads.find((p) =>
      ["x", "y"].some((a) => w.pads.some((q) => same(q, reflect(p, a)) && reaches(q))),
    );
    const pick = one || two;
    return pick ? stop(pick) : null;
  }

  interact(target) {
    if (target.type === "deliver") {
      const at = target.at;
      this.decide(
        "deliver",
        { en: `Delivered at ${pointText(at)}`, es: `Entregó en ${pointText(at)}` },
        { type: "deliver", at },
        { mechanic: "ordered-pairs", detail: { at } },
      );
      return;
    }
    if (target.type === "cable") return this.cableConsole(target.station);
    if (target.type === "pad") return this.padConsole(target.pad);
  }

  cableConsole({ cable, end }) {
    if (cable.done) {
      const L = gridDistance(cable.a, cable.b);
      this.decide(
        "cable",
        { en: "Rode back", es: "Regresó" },
        { type: "cable", cable: cable.id, end, L },
        { mechanic: "grid-distance", support: "known-cable" },
      );
      return;
    }
    let L = 1;
    this.openPanel(this.t("cableTitle"), (body) => {
      body.append(
        el(
          "p.note",
          null,
          this.t("cableNote", { from: pointText(cable.a), to: pointText(cable.b) }),
        ),
        stepper(
          this,
          this.t("cableLen"),
          () => L,
          (v) => {
            L = v;
          },
          1,
          12,
        ),
        action(
          this.t("cableGo"),
          () => {
            this.closePanel();
            this.decide(
              "cable",
              {
                en: `Cable ${L} from ${pointText(cable.a)}`,
                es: `Cable ${L} desde ${pointText(cable.a)}`,
              },
              { type: "cable", cable: cable.id, end, L },
              { mechanic: "grid-distance", detail: { L } },
            );
          },
          ".primary",
        ),
      );
    });
  }

  padConsole(pad) {
    const w = this.world;
    const index = w.pads.findIndex((p) => same(p, pad));
    let guess = -1;
    let axis = "";
    // Candidate landing points: both reflections, the swap, and the half turn.
    const options = [
      reflect(pad, "x"),
      reflect(pad, "y"),
      { x: pad.y, y: pad.x },
      { x: -pad.x, y: -pad.y },
    ]
      .filter((p, i, all) => all.findIndex((q) => same(q, p)) === i && !same(p, pad))
      .sort((a, b) => a.x - b.x || a.y - b.y);
    this.openPanel(this.t("padTitle"), (body) => {
      const go = action(
        this.t("padGo"),
        () => {
          this.closePanel();
          const to = reflect(pad, axis);
          const predicted = options[guess];
          this.prediction = {
            mechanic: "reflection",
            choice: pointText(predicted),
            judge: () => same(predicted, to),
          };
          this.decide(
            "mirror",
            {
              en: `Mirror at ${pointText(pad)} across ${axis}`,
              es: `Espejo en ${pointText(pad)} sobre ${axis}`,
            },
            { type: "mirror", pad: index, axis },
            { mechanic: "reflection", detail: { axis, predicted } },
          );
        },
        ".primary",
      );
      go.disabled = true;
      const ready = () => {
        go.disabled = guess < 0 || !axis;
      };
      body.append(
        el("p.note", null, this.t("padNote", { at: pointText(pad) })),
        el("h3", null, this.t("padPredict")),
        chips(
          options.map((p, i) => ({ label: pointText(p), value: i })),
          (o) => o.value === guess,
          (o) => {
            guess = o.value;
            ready();
          },
        ),
        chips(
          [
            { label: this.t("padAxisX"), value: "x" },
            { label: this.t("padAxisY"), value: "y" },
          ],
          (o) => o.value === axis,
          (o) => {
            axis = o.value;
            ready();
          },
        ),
        go,
      );
    });
  }

  onEvent(e) {
    switch (e.type) {
      case "bump":
        this.audio.sfx("brake");
        this.camera.kick(3);
        if (!this.said.bump) {
          this.said.bump = 1;
          this.toast(this.t("bump"));
        }
        break;
      case "ride":
        this.audio.sfx("whistle");
        break;
      case "dock":
        this.audio.sfx("lock");
        if (!this.asked.cable) this.later(2.5, () => this.askOnce("cable"));
        break;
      case "short":
        this.audio.sfx("strain");
        if (e.over && !this.said.water) {
          this.said.water = 1;
          this.later(1.5, () => this.say("ori", this.t("shortWater"), "worried"));
        }
        break;
      case "overshoot":
        this.audio.sfx("brake");
        this.camera.kick(3);
        break;
      case "warp":
        this.audio.sfx("shift");
        break;
      case "warped":
        this.sweep();
        if (!this.asked.mirror) this.later(2.5, () => this.askOnce("mirror"));
        break;
      case "outcome":
        if (e.mechanic === "ordered-pairs" && e.ok) {
          this.showTarget = false;
          const c = toPx(e.detail.address);
          this.fx.emit(c.X, c.Y, 24, 150, 0, 0, Math.PI * 2, 0.8);
        }
        // Two wrong doors in a row: offer the street-sign support (recorded as a support).
        if (e.mechanic === "ordered-pairs" && !e.ok) {
          this.misses = (this.misses || 0) + 1;
          if (this.misses >= 2 && !this.showTarget) this.offerSign();
        } else if (e.ok) this.misses = 0;
        break;
    }
  }

  offerSign() {
    this.later(2.5, () => {
      if (this.mode !== "play") return;
      this.openPanel(this.t("sign"), (body) => {
        body.append(
          el("p.note", null, this.t("signNote")),
          action(
            this.t("sign"),
            () => {
              this.showTarget = true;
              this.support("street-sign");
              this.closePanel();
            },
            ".primary",
          ),
        );
      });
    });
  }

  askOnce(kind) {
    if (this.asked[kind] || this.mode !== "play") return;
    this.asked[kind] = true;
    const o = {
      cable: {
        prompt: this.t("explainCable"),
        frames: [this.t("frameCable1"), this.t("frameCable2")],
        mechanic: "grid-distance",
      },
      mirror: {
        prompt: this.t("explainMirror"),
        frames: [this.t("frameMirror1"), this.t("frameMirror2")],
        mechanic: "reflection",
      },
    }[kind];
    this.explain(o);
  }
}

define("ewl-coordinate-couriers", CoordinateCouriers);
export { CoordinateCouriers, LEVELS };

// NETFOLD ENGINEER — a 3D construction game (5-5, 5-6, 5-7, 5-8, 5-10).
//
// The Kinetic Workshop builds crates, wraps boxes and packs cubes, and every
// job is done in 3D by the workshop itself. Choose a net and it folds on its
// own hinges: it closes, or two faces land on the same side, or a gap stays
// open. Cut wrapping paper and it covers the box face by face: too little
// leaves a face bare, too much leaves a flap. Name a volume and that many
// cubes are packed: too few leave holes, too many pile over the top. Drag the
// display (or use the turn buttons) to look from any side.

import { el } from "../../runtime/chrome.js";
import { action, chips, stepper } from "../../runtime/controls.js";
import { define, UniverseGame } from "../../runtime/shell.js";
import { prismSA } from "./geo3d.js";
import { createWorld, FLOOR, LEVELS } from "./levels.js";
import { draw, drawBackdrop } from "./render.js";
import { currentRoom, rules } from "./rules.js";
import { STRINGS } from "./strings.js";

class NetfoldEngineer extends UniverseGame {
  static def = {
    id: "netfold-engineer",
    title: { en: "NETFOLD ENGINEER", es: "INGENIERÍA DE PLANTILLAS" },
    tagline: {
      en: "The Kinetic Workshop builds in 3D. Fold nets on their real hinges, wrap boxes with exactly enough paper, and pack crates cube by cube.",
      es: "El Taller Cinético construye en 3D. Dobla plantillas por sus bisagras reales, envuelve cajas con el papel justo y empaca cajas cubo por cubo.",
    },
    bed: "workshop",
    lessons: ["5-5", "5-6", "5-7", "5-8", "5-10"],
    uses: {},
    concepts: [],
    levels: [
      {
        id: "net-lab",
        lesson: "5-6",
        standard: "6.GR.4",
        title: { en: "Net Lab", es: "Laboratorio de plantillas" },
        discovery: {
          en: "A net works when every face lands on a different side and every edge meets another. Of the 35 shapes made of six squares, only 11 fold into a cube.",
          es: "Una plantilla funciona cuando cada cara cae en un lado distinto y cada arista se junta con otra. De las 35 figuras de seis cuadrados, solo 11 se doblan en un cubo.",
        },
      },
      {
        id: "wrap-lab",
        lesson: "5-7",
        lessons: ["5-7", "5-8"],
        standard: "6.GR.4",
        title: { en: "Wrap Lab", es: "Laboratorio de envoltura" },
        discovery: {
          en: "Surface area is the area of every face added up: the net's area. A pyramid's triangles use the slant height, not the pyramid's height.",
          es: "El área total es la suma de las áreas de todas las caras: el área de la plantilla. Los triángulos de una pirámide usan la altura inclinada, no la altura de la pirámide.",
        },
      },
      {
        id: "packing",
        lesson: "5-5",
        lessons: ["5-5", "5-10"],
        standard: "6.GR.2",
        title: { en: "Packing Day", es: "Día de empaque" },
        discovery: {
          en: "Volume counts the cubes inside: length × width × height, even with fractional edges. The same volume can need very different amounts of cardboard.",
          es: "El volumen cuenta los cubos de adentro: largo × ancho × alto, aun con aristas fraccionarias. El mismo volumen puede necesitar cantidades muy distintas de cartón.",
        },
      },
    ],
    mechanics: [
      {
        id: "net-topology",
        action: "choose a net to fold",
        relationship:
          "a net folds into a solid when its faces land on distinct sides and every edge pairs up",
        stateChange: "the net folds on its own hinges in 3D, tick by tick",
        visible: "a closed crate, overlapping faces, or a gap",
        evidence: "accuracy decision with the net chosen",
      },
      {
        id: "surface-area",
        action: "cut paper of a chosen area and wrap",
        relationship: "SA = sum of the face areas (pyramid: base² + 4 · ½ · base · slant height)",
        stateChange: "paper covers the faces in order, as far as its area reaches",
        visible: "a bare face, an exact wrap, or a flap left over",
        evidence:
          "accuracy decision; tags geom-surface-area-as-volume and geom-triangle-area-no-half",
      },
      {
        id: "volume",
        action: "name the crate's volume",
        relationship: "V = l · w · h; with half-unit cubes, 8 cubes per cubic unit",
        stateChange: "that many cubes are packed, layer by layer",
        visible: "holes, a full crate, or cubes piled over the top",
        evidence: "accuracy decision; tag geom-volume-added-dimensions",
      },
      {
        id: "optimize-material",
        action: "choose box dimensions for a fixed volume",
        relationship: "same volume, different surface area; the most cube-like box uses least",
        stateChange: "the chosen box is built",
        visible: "the box and its cardboard",
        evidence: "accuracy decision",
      },
    ],
  };

  static strings = STRINGS;

  rules = rules;
  said = {};
  asked = {};
  yaw = 0.6;
  previews = new Map();

  connectedCallback() {
    super.connectedCallback();
    // Drag the display to turn it (presentation only: the world never sees the view).
    let drag = null;
    this.canvas.addEventListener("pointerdown", (e) => {
      drag = e.clientX;
    });
    window.addEventListener("pointerup", () => {
      drag = null;
    });
    this.canvas.addEventListener("pointermove", (e) => {
      if (drag === null) return;
      this.yaw += (e.clientX - drag) * 0.01;
      drag = e.clientX;
    });
  }

  createWorld(index, seed) {
    return createWorld(index, seed);
  }

  focus(w) {
    return { x: w.p.x + w.p.w / 2 + 220, y: w.p.y - 160, face: 0 };
  }

  bounds(w) {
    return { x: 0, y: 0, w: w.w, h: w.h };
  }

  drawBackdrop(ctx) {
    drawBackdrop(ctx);
  }

  captionOf(r) {
    if (r.kind === "net") return this.t("capNet");
    if (r.kind === "wrap")
      return r.solid === "prism" ? this.t("capWrapPrism", r) : this.t("capWrapPyr", r);
    if (r.kind === "fill") return this.t("capFill", { ...r, cube: r.cube === 1 ? "1" : "½" });
    return this.t("capDesign", { n: r.cubes });
  }

  draw(ctx, w, t) {
    if (!this.reduced) this.yaw += 0.003;
    draw(ctx, w, t, {
      yaw: this.yaw,
      caption: (r) => this.captionOf(r),
      preview: (r) => this.previews.get(r.i) ?? 0,
      acting: this.mode === "panel",
      oriMood: this.oriMood,
      talk: this.caption?.who === "ori",
    });
  }

  onLevelStart(index) {
    this.said = {};
    this.previews.clear();
    this.say("ori", this.t(["hello", "helloWrap", "helloPack"][index]), "curious");
  }

  objective(w) {
    if (w.rooms.every((r) => r.done)) return this.t("objExit");
    const r = currentRoom(w);
    if (r.done) return this.t("objNext");
    if (r.job && r.job.t < 150) return this.t("objWorking");
    return {
      net: this.t("objNet"),
      wrap: this.t("objWrap"),
      fill: this.t("objFill"),
      design: this.t("objDesign", { n: r.cubes }),
    }[r.kind];
  }

  describe(w) {
    const r = currentRoom(w);
    return [this.tx(this.level.title), this.captionOf(r), this.objective(w)].join(". ");
  }

  interactable(w) {
    if (!w.p.ground) return null;
    const px = w.p.x + w.p.w / 2;
    const r = w.rooms.find((x) => !x.done && Math.abs(px - x.bench) < 80);
    if (!r || (r.job && r.job.t < 150)) return null;
    return { id: `bench${r.i}`, room: r.i, what: this.t("useBench") };
  }

  nextStop(w) {
    if (w.rooms.every((r) => r.done))
      return { id: "exit", x: w.exit.x + 60, y: FLOOR, what: this.t("whatNext") };
    const r = w.rooms.find((x) => !x.done);
    return Math.abs(w.p.x - r.bench) < 40
      ? null
      : { id: `bench${r.i}`, x: r.bench, y: FLOOR, what: this.t("whatNext") };
  }

  interact(s) {
    const r = this.world.rooms[s.room];
    ({
      net: this.netConsole,
      wrap: this.wrapConsole,
      fill: this.fillConsole,
      design: this.designConsole,
    })[r.kind].call(this, r);
  }

  build(r, a, label, mechanic) {
    this.closePanel();
    this.decide("build", label, { type: "build", room: r.i, ...a }, { mechanic, detail: a });
  }

  turnRow() {
    return el(
      "div.row",
      null,
      action(this.t("turnL"), () => {
        this.yaw -= 0.5;
      }),
      action(this.t("turnR"), () => {
        this.yaw += 0.5;
      }),
    );
  }

  netConsole(r) {
    this.openPanel(this.t("netTitle"), (body) => {
      body.append(el("p.note", null, this.t("netNote")), this.turnRow());
      r.choices.forEach((_, i) =>
        body.append(
          el(
            "div.row",
            null,
            action(this.t("netShow", { n: i + 1 }), () => this.previews.set(r.i, i)),
            action(
              this.t("netFold", { n: i + 1 }),
              () =>
                this.build(
                  r,
                  { choice: i },
                  { en: `Folded net ${i + 1}`, es: `Dobló la plantilla ${i + 1}` },
                  "net-topology",
                ),
              ".primary",
            ),
          ),
        ),
      );
    });
  }

  wrapConsole(r) {
    let area = 20;
    this.openPanel(this.t("wrapTitle"), (body) => {
      const note =
        r.solid === "prism"
          ? this.t("wrapNote", {
              faces: `${r.l} × ${r.w} (×2), ${r.l} × ${r.h} (×2), ${r.w} × ${r.h} (×2)`,
            })
          : this.t("wrapNotePyr", r);
      body.append(
        el("p.note", null, note),
        this.turnRow(),
        stepper(
          this,
          this.t("area"),
          () => area,
          (v) => {
            area = v;
          },
          1,
          200,
        ),
        action(
          this.t("wrapGo"),
          () =>
            this.build(
              r,
              { value: area },
              { en: `Paper ${area}`, es: `Papel ${area}` },
              "surface-area",
            ),
          ".primary",
        ),
      );
    });
  }

  fillConsole(r) {
    let v = 10;
    this.openPanel(this.t("fillTitle"), (body) => {
      body.append(
        el("p.note", null, this.t("fillNote", { ...r, cube: r.cube === 1 ? "1" : "½" })),
        this.turnRow(),
        stepper(
          this,
          this.t("volume"),
          () => v,
          (x) => {
            v = x;
          },
          0.5,
          60,
          r.cube,
        ),
        action(
          this.t("fillGo"),
          () => this.build(r, { value: v }, { en: `Volume ${v}`, es: `Volumen ${v}` }, "volume"),
          ".primary",
        ),
      );
    });
  }

  designConsole(r) {
    this.openPanel(this.t("designTitle"), (body) => {
      body.append(
        el("p.note", null, this.t("designNote", { n: r.cubes })),
        this.turnRow(),
        chips(
          r.options.map((o, i) => ({ label: `${o[0]} × ${o[1]} × ${o[2]}`, value: i })),
          (o) => o.value === (this.previews.get(r.i) ?? 0),
          (o) => this.previews.set(r.i, o.value),
        ),
        action(
          this.t("fillGo"),
          () => {
            const i = this.previews.get(r.i) ?? 0;
            const o = r.options[i];
            this.build(
              r,
              { choice: i },
              {
                en: `Box ${o.join(" × ")} (cardboard ${prismSA(...o)})`,
                es: `Caja ${o.join(" × ")} (cartón ${prismSA(...o)})`,
              },
              "optimize-material",
            );
          },
          ".primary",
        ),
      );
    });
  }

  onEvent(e) {
    switch (e.type) {
      case "build":
        this.audio.sfx(e.kind === "net" ? "open" : "power");
        break;
      case "solved":
        this.audio.sfx("discover");
        this.fx.emit(
          this.world.rooms[e.room].bench + 320,
          250,
          30,
          170,
          0,
          -Math.PI / 2,
          Math.PI * 2,
          0.9,
        );
        if (this.level.id === "net-lab" && !this.asked.net)
          this.later(3, () => this.askOnce("net"));
        if (this.world.rooms[e.room].solid === "pyramid" && !this.asked.wrap)
          this.later(3, () => this.askOnce("wrap"));
        break;
      case "outcome":
        if (!e.ok) this.audio.sfx("strain");
        break;
    }
  }

  askOnce(kind) {
    if (this.asked[kind] || this.mode !== "play") return;
    this.asked[kind] = true;
    const o = {
      net: {
        prompt: this.t("explainNet"),
        frames: [this.t("frameN1"), this.t("frameN2")],
        mechanic: "net-topology",
      },
      wrap: {
        prompt: this.t("explainWrap"),
        frames: [this.t("frameW1"), this.t("frameW2")],
        mechanic: "surface-area",
      },
    }[kind];
    this.explain(o);
  }
}

define("ewl-netfold-engineer", NetfoldEngineer);
export { LEVELS, NetfoldEngineer };

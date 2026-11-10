// Origami Fortress: The Polyhedral Forge — Unit 5: Area, Surface Area and Volume.
//
// The geometry IS the machine. Three bastion stations defend the perimeter:
//  - SHIELD PLATE (6.GR.1): a parallelogram, triangle or trapezoid plate. The
//    morph lever really rearranges it: the parallelogram's cut-off triangle
//    slides across into a rectangle; a triangle or trapezoid swings a second
//    copy 180° about the midpoint of a side into a parallelogram. Charge the
//    plate with its area.
//  - UNFOLD (6.GR.4): a prism or square pyramid. The fold lever turns every face
//    rigidly about its hinge edge (projection computed here, no 3-D library)
//    until the solid lies flat as its net. Energize with its surface area.
//  - PACK (6.GR.2): a hollow chamber with fractional edges. Set how many
//    1/2-inch cubes fit along each edge and the engine packs exactly that many,
//    voxel by voxel: too many punch through the walls, too few leave gaps. Seal
//    with the volume.

import { EduWonderEngine, H, W, define } from "../core/engine.js";
import { Pivot } from "../core/draw.js";
import { ParticlePool } from "../core/particles.js";
import { SpringBank } from "../core/spring.js";
import {
  AREA_MAX,
  COUNT_MAX,
  faceHalves,
  judgeChamber,
  judgeShield,
  checkSolid,
  makeChamber,
  makeShield,
  newSolid,
  mixed,
  SA_MAX,
  VOL_MAX,
} from "./math.js";
import { drawScene, fitSolid, layoutShield } from "./render.js";
import { STRINGS } from "./strings.js";

export const S_FOLD = 0;
export const S_MORPH = 1;
export const S_GLOW = 2;
export const S_NEEDLE = 3;
// st[] slots (doubles kept in a typed array, never on object fields)
export const ST_FILL = 0;

class PolyhedralForge extends EduWonderEngine {
  static meta = {
    gameId: "u5-polyhedral-forge",
    unit: 5,
    lessons: ["5-1", "5-2", "5-3", "5-4", "5-5", "5-6", "5-7", "5-8", "5-10"],
    checkId: "check",
  };

  static strings = STRINGS;

  initWorld() {
    this.springs = new SpringBank(4);
    this.pivot = new Pivot();
    this.particles = new ParticlePool(240, [
      "#9aa6b8",
      "#f2b45a",
      "#7bdc8f",
      "#ff6b6b",
      "#46c2b8",
      "#ffd166",
    ]);
    if (this.reducedMotion) {
      this.particles.scale = 0;
      this.springs.omega = 40;
    }
    this.mode = "shield";
    this.shield = null;
    this.solid = null;
    this.chamber = null;
    this.st = new Float64Array(16);
    // Shield plate, in integer screen pixels (layoutShield fills these).
    this.shBody = new Int32Array(8); // x0,y0,..x3,y3
    this.shPiece = new Int32Array(8); // para: absolute; tri/trap: relative to pivot
    this.shInfo = new Int32Array(24);
    // Solid: vertices, projection, face tables.
    this.verts = new Float64Array(72);
    this.vDepth = new Float64Array(24);
    this.sx = new Int32Array(24);
    this.sy = new Int32Array(24);
    this.faceStart = new Int8Array(6);
    this.faceN = new Int8Array(6);
    this.faceGroup = new Int8Array(6);
    this.faceHalf = new Int32Array(6);
    this.faceDepth = new Float64Array(6);
    this.order = new Int8Array(6);
    this.solidInfo = new Int32Array(8); // kind, a, b, c, nFaces, nVerts
    this.traced = 0;
    // Chamber: hl, hw, hh, nl, nw, nh, layers, manual
    this.ch = new Int32Array(8);
    this.labels = {
      plate: "",
      dial: "",
      aux: "",
      aux2: "",
      b: "",
      b2: "",
      h: "",
      s: "",
      cl: "",
      cw: "",
      chh: "",
      dims: "",
      face: ["", "", "", "", "", ""],
      area: ["", "", "", "", "", ""],
    };
  }

  buildControls() {
    const sync = () => this.sync(false);
    this.morph = this.slider({
      id: "morph",
      label: "morph",
      min: 0,
      max: 100,
      step: 5,
      value: 0,
      format: (v) => this.t("fmtPct", { v }),
      onInput: (v) => {
        this.springs.setTarget(S_MORPH, v / 100);
        sync();
      },
    });
    this.fold = this.slider({
      id: "fold",
      label: "fold",
      min: 0,
      max: 100,
      step: 5,
      value: 0,
      format: (v) => this.t("fmtOpen", { v }),
      onInput: (v) => {
        this.springs.setTarget(S_FOLD, v / 100);
        sync();
      },
    });
    const count = (id, label) =>
      this.slider({
        id,
        label,
        min: 1,
        max: COUNT_MAX,
        step: 1,
        value: 1,
        format: (v) => this.t("fmtCubes", { v }),
        onInput: () => this.packChanged(),
      });
    this.cubesL = count("cubes-l", "cubesL");
    this.cubesW = count("cubes-w", "cubesW");
    this.cubesH = count("cubes-h", "cubesH");
    const needle = (max) => (v) => {
      this.springs.setTarget(S_NEEDLE, v / max);
      sync();
    };
    this.charge = this.slider({
      id: "charge-dial",
      label: "chargeDial",
      min: 0,
      max: AREA_MAX,
      step: 0.5,
      value: 0,
      format: (v) => this.t("fmtSq", { v: mixed(Math.round(v * 2), 2) }),
      onInput: needle(AREA_MAX),
    });
    this.saDial = this.slider({
      id: "sa-dial",
      label: "saDial",
      min: 0,
      max: SA_MAX,
      step: 1,
      value: 0,
      format: (v) => this.t("fmtSq", { v }),
      onInput: needle(SA_MAX),
    });
    this.volDial = this.slider({
      id: "vol-dial",
      label: "volDial",
      min: 0,
      max: VOL_MAX,
      step: 0.125,
      value: 0,
      format: (v) => this.t("fmtCu", { v: mixed(Math.round(v * 8), 8) }),
      onInput: needle(VOL_MAX),
    });
    this.traceBtn = this.button({ id: "trace", label: "trace", onPress: () => this.traceFace() });
    this.stackBtn = this.button({ id: "stack", label: "stack", onPress: () => this.stackLayer() });
    this.checkBtn = this.button({
      id: "check",
      label: "charge",
      primary: true,
      onPress: () => this.check(),
    });
    this.binders.push(() => {
      this.checkBtn.textContent = this.t(
        this.mode === "shield" ? "charge" : this.mode === "unfold" ? "energize" : "seal",
      );
    });
  }

  newRound(level, next) {
    const r = this.roundIndex % 3;
    this.mode = r === 1 ? "shield" : r === 2 ? "unfold" : "pack";
    const m = this.mode;
    this.morph.wrap.hidden = m !== "shield";
    this.charge.wrap.hidden = m !== "shield";
    this.fold.wrap.hidden = m !== "unfold";
    this.saDial.wrap.hidden = m !== "unfold";
    for (const s of [this.cubesL, this.cubesW, this.cubesH, this.volDial])
      s.wrap.hidden = m !== "pack";
    this.particles.clear();
    this.springs.snap(S_GLOW, 0);
    this.springs.snap(S_NEEDLE, 0);
    if (m === "shield") {
      this.shield = makeShield(level, next);
      layoutShield(this);
      this.morph.set(0);
      this.charge.set(0);
      this.springs.snap(S_MORPH, 0);
    } else if (m === "unfold") {
      this.solid = newSolid(level, next);
      const sol = this.solid;
      const prism = sol.kind === "prism";
      const info = this.solidInfo;
      info[0] = prism ? 0 : 1;
      info[1] = prism ? sol.L : sol.s;
      info[2] = prism ? sol.W : sol.l;
      info[3] = prism ? sol.H : 0;
      info[4] = prism ? 6 : 5;
      info[5] = prism ? 24 : 16;
      const halves = faceHalves(sol);
      const groups = prism ? [0, 1, 1, 2, 2, 0] : [0, 1, 1, 1, 1];
      let start = 0;
      for (let i = 0; i < info[4]; i++) {
        this.faceStart[i] = start;
        this.faceN[i] = prism || i === 0 ? 4 : 3;
        start += this.faceN[i];
        this.faceGroup[i] = groups[i];
        this.faceHalf[i] = halves[i];
      }
      this.traced = 0;
      this.fold.set(0);
      this.saDial.set(0);
      this.springs.snap(S_FOLD, 0);
      fitSolid(this);
    } else {
      this.chamber = makeChamber(level, next);
      const c = this.ch;
      c[0] = this.chamber.hl;
      c[1] = this.chamber.hw;
      c[2] = this.chamber.hh;
      c[3] = 1;
      c[4] = 1;
      c[5] = 1;
      c[6] = 0;
      c[7] = 0;
      for (const s of [this.cubesL, this.cubesW, this.cubesH]) s.set(1);
      this.volDial.set(0);
      this.st[ST_FILL] = 0;
    }
    this.onTier(this.tier);
  }

  onTier(n) {
    this.traceBtn.hidden = this.mode !== "unfold" || n < 2;
    this.stackBtn.hidden = this.mode !== "pack" || n < 2;
  }

  packChanged() {
    const c = this.ch;
    c[3] = Number(this.cubesL.input.value);
    c[4] = Number(this.cubesW.input.value);
    c[5] = Number(this.cubesH.input.value);
    if (c[6] > c[5]) c[6] = c[5];
    if (this.st[ST_FILL] > this.fillTarget()) this.st[ST_FILL] = this.fillTarget();
    this.sync(false);
  }

  /** How many cubes the engine is packing toward right now. */
  fillTarget() {
    const c = this.ch;
    const layer = c[3] * c[4];
    return c[7] ? layer * c[6] : layer * c[5];
  }

  /** Tier 2: trace faces one at a time; each traced face adds to the tally. */
  traceFace() {
    if (this.mode !== "unfold" || this.traced >= this.solidInfo[4]) return;
    this.traced++;
    this.synth.lock();
    this.sync();
  }

  /** Tier 2: build the chamber by hand, one layer of cubes per press. */
  stackLayer() {
    const c = this.ch;
    if (this.mode !== "pack") return;
    if (!c[7]) {
      c[7] = 1;
      c[6] = 0;
      this.st[ST_FILL] = 0;
    }
    if (c[6] < c[5]) c[6]++;
    this.synth.impact(0.4);
    this.sync();
  }

  tally() {
    let t = 0;
    for (let i = 0; i < this.traced; i++) t += this.faceHalf[i];
    return t;
  }

  evaluate() {
    if (this.mode === "shield") {
      const s = this.shield;
      const r = judgeShield(s, Number(this.charge.input.value));
      if (r.key === "ok")
        return { ok: true, key: "solvedShield", vars: { v: mixed(s.areaHalves, 2) } };
      return { ok: false, key: r.key, misconception: r.tag };
    }
    if (this.mode === "unfold") {
      const r = checkSolid(this.solid, Number(this.saDial.input.value));
      if (r.key === "ok") return { ok: true, key: "solvedSA", vars: { v: this.solid.sa } };
      return { ok: false, key: r.key, misconception: r.tag };
    }
    const c = this.chamber;
    const r = judgeChamber(
      c,
      Number(this.cubesL.input.value),
      Number(this.cubesW.input.value),
      Number(this.cubesH.input.value),
      Number(this.volDial.input.value),
    );
    if (r.key === "ok")
      return { ok: true, key: "solvedPack", vars: { n: c.cubes, v: mixed(c.cubes, 8) } };
    const vars = r.axis ? { axis: this.t(`axis${r.axis}`) } : undefined;
    return { ok: false, key: r.key, misconception: r.tag, vars };
  }

  onSolved() {
    this.springs.setTarget(S_GLOW, 1);
    this.synth.impact(0.8);
    this.particles.emit(330, 260, 50, 300, 5, -Math.PI / 2, Math.PI * 1.8, 1.2);
    this.particles.emit(330, 260, 30, 220, 2, -Math.PI / 2, Math.PI * 1.8, 1);
  }

  onMiss() {
    this.springs.impulse(S_NEEDLE, 1.6);
    this.particles.emit(790, 230, 16, 160, 3);
  }

  updatePhysics(dt) {
    this.springs.step(dt);
    this.particles.update(dt);
    if (this.mode === "pack") {
      const target = this.fillTarget();
      const st = this.st;
      if (this.reducedMotion) st[ST_FILL] = target;
      else if (st[ST_FILL] < target) {
        const rate = target > 40 ? target * 1.2 : 48;
        st[ST_FILL] = Math.min(target, st[ST_FILL] + rate * dt);
      }
    }
  }

  refreshLabels() {
    const L = this.labels;
    const m = this.mode;
    if (m === "shield" && this.shield) {
      const s = this.shield;
      L.plate = this.t("plateShield");
      L.dial = mixed(Math.round(Number(this.charge.input.value) * 2), 2);
      L.aux = this.t("morphPlate", { v: this.morph.input.value });
      L.aux2 = "";
      L.b = s.kind === "trap" ? `b₁ = ${s.b}` : `b = ${s.b}`;
      L.b2 = `b₂ = ${s.b2}`;
      L.h = `h = ${s.h}`;
      L.s = String(s.slant);
    } else if (m === "unfold" && this.solid) {
      const sol = this.solid;
      L.plate = this.t("plateUnfold");
      L.dial = String(this.saDial.input.value);
      L.aux = this.t("foldPlate", { v: this.fold.input.value });
      L.aux2 = this.tier >= 2 ? this.t("tally", { v: mixed(this.tally(), 2) }) : "";
      L.dims =
        sol.kind === "prism"
          ? `${sol.L} × ${sol.W} × ${sol.H}`
          : this.t("pyrDims", { s: sol.s, l: sol.l });
      const prism = sol.kind === "prism";
      const dims = prism
        ? [
            [sol.L, sol.W],
            [sol.L, sol.H],
            [sol.L, sol.H],
            [sol.W, sol.H],
            [sol.W, sol.H],
            [sol.L, sol.W],
          ]
        : [
            [sol.s, sol.s],
            [sol.s, sol.l],
            [sol.s, sol.l],
            [sol.s, sol.l],
            [sol.s, sol.l],
          ];
      for (let i = 0; i < 6; i++) {
        const d = dims[i];
        L.face[i] = !d ? "" : prism || i === 0 ? `${d[0]} × ${d[1]}` : `b ${d[0]} · h ${d[1]}`;
        L.area[i] = d ? mixed(this.faceHalf[i], 2) : "";
      }
    } else if (m === "pack" && this.chamber) {
      const c = this.ch;
      L.plate = this.t("platePack");
      L.dial = mixed(Math.round(Number(this.volDial.input.value) * 8), 8);
      L.aux = `${c[3]} × ${c[4]} × ${c[5]}`;
      L.aux2 = this.tier >= 2 && c[7] ? this.t("layers", { n: c[6], c: c[3] * c[4] }) : "";
      L.cl = this.t("inches", { v: mixed(c[0], 2) });
      L.cw = this.t("inches", { v: mixed(c[1], 2) });
      L.chh = this.t("inches", { v: mixed(c[2], 2) });
    }
  }

  describe() {
    const m = this.mode;
    if (m === "shield" && this.shield) {
      const s = this.shield;
      const key = s.kind === "para" ? "descPara" : s.kind === "tri" ? "descTri" : "descTrap";
      return this.t(key, {
        b: s.b,
        b2: s.b2,
        s: s.slant,
        h: s.h,
        m: this.morph.input.value,
        v: mixed(Math.round(Number(this.charge.input.value) * 2), 2),
      });
    }
    if (m === "unfold" && this.solid) {
      const sol = this.solid;
      const extra = this.tier >= 2 ? this.t("extraTally", { t: mixed(this.tally(), 2) }) : "";
      const vars = {
        l: sol.kind === "prism" ? sol.L : sol.l,
        w: sol.W,
        h: sol.H,
        s: sol.s,
        f: this.fold.input.value,
        v: this.saDial.input.value,
        extra,
      };
      return this.t(sol.kind === "prism" ? "descPrism" : "descPyr", vars);
    }
    if (m === "pack" && this.chamber) {
      const c = this.ch;
      const extra = this.tier >= 2 && c[7] ? this.t("extraLayers", { n: c[6] }) : "";
      return this.t("descPack", {
        l: mixed(c[0], 2),
        w: mixed(c[1], 2),
        h: mixed(c[2], 2),
        nl: c[3],
        nw: c[4],
        nh: c[5],
        v: mixed(Math.round(Number(this.volDial.input.value) * 8), 8),
        extra,
      });
    }
    return "";
  }

  mission() {
    const m = this.mode;
    if (m === "shield") {
      const s = this.shield;
      const key =
        s.kind === "para" ? "missionPara" : s.kind === "tri" ? "missionTri" : "missionTrap";
      return this.t(key, { b: s.b, b2: s.b2, s: s.slant, h: s.h });
    }
    if (m === "unfold") {
      const sol = this.solid;
      return sol.kind === "prism"
        ? this.t("missionPrism", { l: sol.L, w: sol.W, h: sol.H })
        : this.t("missionPyr", { s: sol.s, l: sol.l });
    }
    const c = this.chamber;
    return this.t("missionPack", { l: mixed(c.hl, 2), w: mixed(c.hw, 2), h: mixed(c.hh, 2) });
  }

  testPlan() {
    if (this.mode === "shield")
      return [
        { control: "charge-dial", key: "Home" },
        { control: "charge-dial", key: "ArrowRight", times: this.shield.areaHalves },
        { control: "check", key: "Enter" },
      ];
    if (this.mode === "unfold")
      return [
        { control: "fold", key: "End" },
        { control: "sa-dial", key: "Home" },
        { control: "sa-dial", key: "ArrowRight", times: this.solid.sa },
        { control: "check", key: "Enter" },
      ];
    const c = this.chamber;
    return [
      { control: "cubes-l", key: "Home" },
      { control: "cubes-l", key: "ArrowRight", times: c.hl - 1 },
      { control: "cubes-w", key: "Home" },
      { control: "cubes-w", key: "ArrowRight", times: c.hw - 1 },
      { control: "cubes-h", key: "Home" },
      { control: "cubes-h", key: "ArrowRight", times: c.hh - 1 },
      { control: "vol-dial", key: "Home" },
      { control: "vol-dial", key: "ArrowRight", times: c.cubes },
      { control: "check", key: "Enter" },
    ];
  }

  renderScene(ctx) {
    drawScene(ctx, this);
  }
}

export { W, H };
define("ew-polyhedral-forge", PolyhedralForge);

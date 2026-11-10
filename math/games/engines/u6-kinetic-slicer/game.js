// Kinetic Slicer & Quantum Partition Engine — Unit 6: dividing with fractions.
//
// The division IS the cut. A material ribbon A/B units long lies on a ruler of
// wholes; the laser cutter's aperture gauge is C/D. Engaging runs the cutter's
// program along the ribbon: every full aperture length drops into the tray as
// a block. PREDICT / MIXED rounds program the cutter with the student's
// quotient (whole blocks + leftover fraction of a block), so a quotient that is
// too big runs the laser off the end and one that is too small stops with
// ribbon still uncut. APERTURE rounds give a block count and the student sets
// the aperture; the cut shows too many or too few blocks. Only an exact program
// ends at the ribbon's end, and only then does the vernier read the scrap as a
// fraction of one block.

import { EduWonderEngine, define } from "../core/engine.js";
import { alphaLevel, line, rect, roundRect, staticLayer, text } from "../core/draw.js";
import { fracText, frac, lcm } from "../core/math.js";
import { ParticlePool } from "../core/particles.js";
import { SpringBank } from "../core/spring.js";
import {
  AP_MAX,
  answerFor,
  DEN_MAX,
  judgeAperture,
  judgePredict,
  makeRound,
  modeFor,
  NUM_MAX,
  split,
  value,
  WHOLE_MAX,
} from "./math.js";
import { STRINGS } from "./strings.js";

const X0 = 90;
const RUL_W = 760;
const X_MAX = 930;
const RAIL_Y = 108;
const RIB_Y = 172;
const RIB_H = 42;
const DROP = 128;
const VERN_X = 600;
const VERN_Y = 430;
const VERN_W = 300;
const MAXP = 80;
const S_VERN = MAXP;
const S_HEAD = MAXP + 1;
const S_GLOW = MAXP + 2;
// Scalar state lives in one typed array so updates never box a double.
const CUT = 0;
const TARGET = 1;
const SPEED = 2;
const PPU = 3;
const LEN = 4;
const AP = 5;
const CONSUMED = 6;
const PAVE_W = 8;
const GHOST_MAX = 96;
const UNIT_MAX = 256;
// Outcome of the last cut.
const IDLE = 0;
const OVER = 2;
const SHORT = 3;
const EXACT = 4;
const MADE = 5;

class KineticSlicer extends EduWonderEngine {
  static meta = {
    gameId: "u6-kinetic-slicer",
    unit: 6,
    lessons: ["6-1", "6-2", "6-9", "6-10", "6-11"],
    checkId: "engage",
  };

  static strings = STRINGS;

  initWorld() {
    this.springs = new SpringBank(MAXP + 3);
    this.particles = new ParticlePool(260, ["#ffd166", "#46c2b8", "#7bdc8f", "#ff6b6b", "#9aa6b8"]);
    this.speedScale = 1;
    if (this.reducedMotion) {
      this.particles.scale = 0;
      this.springs.omega = 40;
      this.speedScale = 3;
    }
    this.st = new Float64Array(10);
    this.pieceA = new Float64Array(MAXP);
    this.pieceB = new Float64Array(MAXP);
    this.pieceKind = new Int8Array(MAXP); // 0 full block, 1 program-end piece, 2 scrap
    this.ghostX = new Float64Array(GHOST_MAX);
    this.unitX = new Float64Array(UNIT_MAX);
    this.pieceCount = 0;
    this.dropped = 0;
    this.ghostN = 0;
    this.unitN = 0;
    this.sweeping = false;
    this.overrun = false;
    this.outcome = IDLE;
    this.vernierOn = false;
    this.paved = 0;
    this.paveL = 1;
    this.paveTotal = 0;
    this.paveGroup = 1;
    this.round = null;
    this.mode = "predict";
    this.rulerLayer = null;
    this.frameLayer = null;
    this.fullBlocks = 0;
    this.labels = {
      ribbon: "",
      ap: "",
      program: "",
      order: "",
      cut: "",
      vernier: "",
      paved: "",
      unit: "",
      ruler: "",
    };
  }

  buildControls() {
    const refresh = () => {
      this.disengage();
      for (const s of [this.whole, this.num, this.den, this.apNum, this.apDen]) s.show();
      this.buildGhosts();
      this.sync(false);
    };
    this.whole = this.slider({
      id: "whole",
      label: "whole",
      min: 0,
      max: WHOLE_MAX,
      value: 0,
      format: (v) => this.t("wholeVal", { n: v }),
      onInput: refresh,
    });
    this.num = this.slider({
      id: "num",
      label: "num",
      min: 0,
      max: NUM_MAX,
      value: 0,
      format: (v) => this.t("partVal", { n: v, d: this.den ? this.den.input.value : 1 }),
      onInput: refresh,
    });
    this.den = this.slider({
      id: "den",
      label: "den",
      min: 1,
      max: DEN_MAX,
      value: 1,
      format: (v) => this.t("partVal", { n: this.num.input.value, d: v }),
      onInput: refresh,
    });
    this.apNum = this.slider({
      id: "ap-num",
      label: "apNum",
      min: 1,
      max: AP_MAX,
      value: 1,
      format: (v) => this.t("apVal", { n: v, d: this.apDen ? this.apDen.input.value : 1 }),
      onInput: refresh,
    });
    this.apDen = this.slider({
      id: "ap-den",
      label: "apDen",
      min: 1,
      max: AP_MAX,
      value: 1,
      format: (v) => this.t("apVal", { n: this.apNum.input.value, d: v }),
      onInput: refresh,
    });
    this.num.show();
    this.apNum.show();
    this.paveBtn = this.button({ id: "pave", label: "pave", onPress: () => this.pave() });
    this.button({ id: "engage", label: "engage", primary: true, onPress: () => this.check() });
    this.binders.push(() => {
      this.paveBtn.textContent = this.t("pave", { d: this.paveL });
    });
  }

  newRound(level, next) {
    this.mode = modeFor(this.roundIndex);
    this.round = makeRound(this.mode, level, next);
    const r = this.round;
    const ap = this.mode === "aperture";
    for (const s of [this.whole, this.num, this.den]) s.wrap.hidden = ap;
    for (const s of [this.apNum, this.apDen]) s.wrap.hidden = !ap;
    // Park every dial away from the answer: quotient 0, aperture 1/1 (never the answer).
    this.whole.set(0);
    this.num.set(0);
    this.den.set(1);
    this.apNum.set(1);
    this.apDen.set(1);
    const len = value(r.ribbon);
    const wholes = Math.max(1, Math.ceil(Math.max(len, value(r.ap)) - 1e-9));
    const st = this.st;
    st[LEN] = len;
    st[PPU] = RUL_W / wholes;
    this.rulerLayer = this.paintRuler(wholes, st[PPU]);
    // Tier 2 paving: predict rounds pave in 1/lcm(B, D) units grouped by the
    // aperture; aperture rounds pave in 1/(B·q) units grouped into q fair shares.
    this.paveL = r.paveUnits;
    this.paveTotal = Math.round(len * this.paveL);
    this.paveGroup = ap ? r.ribbon.n : (r.ap.n * this.paveL) / r.ap.d;
    st[PAVE_W] = st[PPU] / this.paveL;
    this.paved = 0;
    this.particles.clear();
    this.springs.snap(S_GLOW, 0);
    this.disengage();
    this.buildGhosts();
    this.onTier(this.tier);
  }

  /** The ruler of wholes, painted once per round. */
  paintRuler(wholes, ppu) {
    const unit = this.mode === "mixed" ? "m" : "";
    return staticLayer(960, 540, (g) => {
      g.strokeStyle = "#a9b6d3";
      g.fillStyle = "#e8eefc";
      g.lineWidth = 2;
      g.font = "16px system-ui";
      g.textAlign = "center";
      g.beginPath();
      g.moveTo(X0, RIB_Y + RIB_H + 10);
      g.lineTo(X0 + RUL_W, RIB_Y + RIB_H + 10);
      g.stroke();
      for (let k = 0; k <= wholes; k++) {
        const x = Math.round(X0 + k * ppu);
        g.fillRect(x - 1, RIB_Y + RIB_H + 4, 2, 16);
        g.fillText(unit ? `${k} ${unit}` : String(k), x, RIB_Y + RIB_H + 40);
        if (k < wholes) {
          const h = Math.round(X0 + (k + 0.5) * ppu);
          g.fillRect(h, RIB_Y + RIB_H + 6, 1, 8);
        }
      }
    });
  }

  /** Aperture currently on the gauge (given, or the student's dial). */
  aperture() {
    if (this.mode === "aperture")
      return Number(this.apNum.input.value) / Number(this.apDen.input.value);
    return value(this.round.ap);
  }

  /** Tier 1 ghost lines: aperture-length partitions and common-denominator units. */
  buildGhosts() {
    if (!this.round) return;
    const r = this.round;
    const len = this.st[LEN];
    const ap = this.aperture();
    this.st[AP] = ap;
    this.ghostN = 0;
    for (let k = 1; k * ap < len + 1e-9 && this.ghostN < GHOST_MAX; k++)
      this.ghostX[this.ghostN++] = k * ap;
    const apD =
      this.mode === "aperture"
        ? frac(Number(this.apNum.input.value), Number(this.apDen.input.value)).d
        : r.ap.d;
    const L = lcm(r.ribbon.d, apD);
    const units = Math.round(len * L);
    this.unitN = 0;
    if (units <= UNIT_MAX) for (let i = 1; i < units; i++) this.unitX[this.unitN++] = i / L;
  }

  onTier(n) {
    this.paveBtn.hidden = n < 2;
  }

  pave() {
    if (this.solved) return;
    if (this.paved >= this.paveTotal) {
      this.setFeedback(this.t("paveFull"));
      return;
    }
    this.paved++;
    this.synth.lock();
    const x = X0 + (this.paved - 0.5) * this.st[PAVE_W];
    this.particles.emit(x, RIB_Y, 4, 90, 1);
    this.sync(false);
    this.say(this.labels.paved);
  }

  disengage() {
    const st = this.st;
    this.sweeping = false;
    this.overrun = false;
    this.outcome = IDLE;
    this.vernierOn = false;
    this.pieceCount = 0;
    this.dropped = 0;
    st[CUT] = 0;
    st[TARGET] = 0;
    st[CONSUMED] = 0;
    for (let i = 0; i < MAXP; i++) this.springs.snap(i, 0);
    this.springs.setTarget(S_VERN, 0);
  }

  /**
   * Lay out the cut: full blocks of `ap` while the program and the ribbon last,
   * then the program-end piece (program too short) or the scrap (ribbon end).
   */
  startSweep(ap, travel) {
    this.disengage();
    const st = this.st;
    const len = st[LEN];
    const stop = Math.min(travel, len);
    let x = 0;
    let n = 0;
    while (x + ap <= stop + 1e-9 && n < MAXP - 1) {
      this.pieceA[n] = x;
      this.pieceB[n] = x + ap;
      this.pieceKind[n] = 0;
      x += ap;
      n++;
    }
    if (travel < len - 1e-9) {
      if (travel > x + 1e-9) {
        this.pieceA[n] = x;
        this.pieceB[n] = travel;
        this.pieceKind[n] = 1;
        n++;
      }
      this.outcome = SHORT;
    } else {
      if (len - x > 1e-9) {
        this.pieceA[n] = x;
        this.pieceB[n] = len;
        this.pieceKind[n] = 2;
        n++;
      }
      this.overrun = travel > len + 1e-9;
      this.outcome = this.mode === "aperture" ? MADE : this.overrun ? OVER : EXACT;
    }
    this.pieceCount = n;
    this.fullBlocks = 0;
    for (let i = 0; i < n; i++) if (this.pieceKind[i] === 0) this.fullBlocks++;
    st[TARGET] = Math.min(travel, (X_MAX - X0) / st[PPU]);
    st[SPEED] = (Math.max(1, len) / 1.6) * this.speedScale;
    st[AP] = ap;
    this.sweeping = st[TARGET] > 0;
  }

  evaluate() {
    const r = this.round;
    if (this.mode === "aperture") {
      const c = Number(this.apNum.input.value);
      const d = Number(this.apDen.input.value);
      this.startSweep(c / d, this.st[LEN]);
      const v = judgeAperture(r, c, d);
      if (v === "ok")
        return {
          ok: true,
          key: "solvedAperture",
          vars: { q: r.blocks, a: fracText(frac(c, d)), r: fracText(r.ribbon, true) },
        };
      if (v === "inverted")
        return {
          ok: false,
          key: "invertedAp",
          misconception: "inverted-divisor",
          vars: { q: r.blocks },
        };
      return {
        ok: false,
        key: v,
        misconception: v === "wide" ? "aperture-too-wide" : "aperture-too-narrow",
      };
    }
    const w = Number(this.whole.input.value);
    const n = Number(this.num.input.value);
    const d = Number(this.den.input.value);
    const ap = value(r.ap);
    this.startSweep(ap, (w + n / d) * ap);
    const v = judgePredict(r, w, n, d);
    if (v === "ok") {
      return {
        ok: true,
        key: "solvedPredict",
        vars: { r: fracText(r.ribbon, true), a: fracText(r.ap, true), q: fracText(r.q, true) },
      };
    }
    const tags = {
      improper: "leftover-not-proper",
      remainderWhole: "remainder-as-whole-unit",
      inverted: "inverted-divisor",
      high: "quotient-too-high",
      low: "quotient-too-low",
    };
    return { ok: false, key: v, misconception: tags[v] };
  }

  onSolved() {
    const rem = split(this.round.q).r;
    this.vernierOn = true;
    this.springs.setTarget(S_VERN, this.mode === "aperture" ? 0 : value(rem));
    this.springs.setTarget(S_GLOW, 1);
    this.particles.emit(480, RIB_Y + DROP, 46, 280, 2, -Math.PI / 2, Math.PI * 1.6, 1.1);
  }

  onMiss() {
    this.springs.impulse(S_HEAD, -60);
  }

  updatePhysics(dt) {
    this.springs.step(dt);
    this.particles.update(dt);
    if (!this.sweeping) return;
    const st = this.st;
    const ppu = st[PPU];
    let c = st[CUT] + st[SPEED] * dt;
    if (c >= st[TARGET]) {
      c = st[TARGET];
      this.sweeping = false;
      if (this.overrun) this.particles.emit((X0 + c * ppu) | 0, RIB_Y + RIB_H, 24, 220, 3);
    }
    st[CUT] = c;
    while (this.dropped < this.pieceCount && this.pieceB[this.dropped] <= c + 1e-9) {
      const i = this.dropped;
      this.springs.setTarget(i, DROP);
      st[CONSUMED] = this.pieceB[i];
      this.dropped++;
      this.springs.impulse(S_HEAD, -25);
      this.particles.emit((X0 + this.pieceB[i] * ppu) | 0, (RIB_Y + RIB_H / 2) | 0, 10, 200, 0);
      this.synth.impact(0.3);
    }
    this.springs.setTarget(S_HEAD, 0);
  }

  refreshLabels() {
    const r = this.round;
    if (!r) return;
    const L = this.labels;
    const unitKey = this.mode === "mixed" ? "metre" : "unitWord";
    L.unit = this.t(unitKey);
    L.ribbon = this.t("plateRibbon", { r: fracText(r.ribbon, true) });
    if (this.mode === "aperture") {
      L.ap = this.t("plateAp", { a: `${this.apNum.input.value}/${this.apDen.input.value}` });
      L.order = this.t("plateOrder", { q: r.blocks });
      L.cut = this.t("plateCut", { n: this.outcome === IDLE ? 0 : this.fullBlocks });
      L.program = L.order;
    } else {
      L.ap = this.t("plateAp", { a: fracText(r.ap, true) });
      L.program = this.t("plateProgram", { p: this.programText() });
      L.cut = "";
    }
    if (this.vernierOn) {
      const rem = split(r.q).r;
      L.vernier =
        this.mode === "aperture" || rem.n === 0
          ? this.t("vernierNone")
          : this.t("vernierPart", { f: fracText(rem) });
    } else L.vernier = this.t("vernierIdle");
    L.paved = this.t("paved", { n: this.paved, d: this.paveL });
  }

  programText() {
    const w = Number(this.whole.input.value);
    const n = Number(this.num.input.value);
    const d = Number(this.den.input.value);
    if (n === 0) return String(w);
    return w === 0 ? `${n}/${d}` : `${w} ${n}/${d}`;
  }

  describe() {
    const r = this.round;
    if (!r) return "";
    const state = this.t(
      this.outcome === OVER
        ? "stateOver"
        : this.outcome === SHORT
          ? "stateShort"
          : this.outcome === EXACT
            ? "stateExact"
            : this.outcome === MADE
              ? "stateMade"
              : "stateIdle",
      {
        n: this.fullBlocks || 0,
        scrap: this.t(this.pieceCount > this.fullBlocks ? "scrapYes" : "scrapNo"),
      },
    );
    const u = this.labels.unit || this.t("unitWord");
    if (this.mode === "aperture") {
      return this.t("descAperture", {
        r: fracText(r.ribbon, true),
        q: r.blocks,
        c: this.apNum.input.value,
        d: this.apDen.input.value,
        state,
        u,
      });
    }
    return this.t("descPredict", {
      r: fracText(r.ribbon, true),
      a: fracText(r.ap, true),
      w: this.whole.input.value,
      n: this.num.input.value,
      d: this.den.input.value,
      state,
      u,
    });
  }

  mission() {
    const r = this.round;
    const vars = { r: fracText(r.ribbon, true), a: fracText(r.ap, true), q: r.blocks };
    if (this.mode === "aperture") return this.t("missionAperture", vars);
    if (this.mode === "mixed") return this.t(`mission_${r.context}`, vars);
    return this.t("missionPredict", vars);
  }

  testPlan() {
    const a = answerFor(this.round);
    if (this.mode === "aperture") {
      return [
        { control: "ap-num", key: "Home" },
        { control: "ap-num", key: "ArrowRight", times: a.c - 1 },
        { control: "ap-den", key: "Home" },
        { control: "ap-den", key: "ArrowRight", times: a.d - 1 },
        { control: "engage", key: "Enter" },
      ];
    }
    return [
      { control: "whole", key: "Home" },
      { control: "whole", key: "ArrowRight", times: a.w },
      { control: "num", key: "Home" },
      { control: "num", key: "ArrowRight", times: a.n },
      { control: "den", key: "Home" },
      { control: "den", key: "ArrowRight", times: a.d - 1 },
      { control: "engage", key: "Enter" },
    ];
  }

  // ---------- rendering (no allocation: integer coords, prebuilt strings) ----------
  renderScene(ctx) {
    this.backdrop(ctx);
    if (!this.round) return;
    if (!this.frameLayer) this.frameLayer = paintFrame();
    ctx.drawImage(this.frameLayer, 0, 0, 960, 540);
    if (this.rulerLayer) ctx.drawImage(this.rulerLayer, 0, 0, 960, 540);
    this.drawPlates(ctx);
    this.drawRibbon(ctx);
    if (this.tier >= 2) this.drawPaving(ctx);
    if (this.tier >= 1) this.drawGhosts(ctx);
    this.drawPieces(ctx);
    this.drawCutter(ctx);
    this.drawVernier(ctx);
    this.particles.render(ctx);
  }

  drawPlates(ctx) {
    const L = this.labels;
    ctx.font = "700 18px system-ui";
    ctx.textAlign = "left";
    ctx.fillStyle = "#111a2e";
    roundRect(ctx, 40, 24, 250, 40, 8);
    ctx.fill();
    roundRect(ctx, 320, 24, 250, 40, 8);
    ctx.fill();
    roundRect(ctx, 600, 24, 320, 40, 8);
    ctx.fill();
    ctx.fillStyle = "#e8eefc";
    text(ctx, L.ribbon, 56, 50);
    ctx.fillStyle = "#ffd166";
    text(ctx, L.ap, 336, 50);
    ctx.fillStyle = "#46c2b8";
    text(ctx, L.program, 616, 50);
  }

  drawRibbon(ctx) {
    const st = this.st;
    const ppu = st[PPU];
    const len = st[LEN];
    const from = st[CONSUMED];
    if (len - from > 1e-9) {
      ctx.fillStyle = "#c9864a";
      rect(ctx, (X0 + from * ppu) | 0, RIB_Y, ((len - from) * ppu) | 0, RIB_H);
      ctx.fillStyle = "#e0a066";
      rect(ctx, (X0 + from * ppu) | 0, RIB_Y, ((len - from) * ppu) | 0, 6);
    }
    // Seams at every whole unit of the ruler.
    ctx.strokeStyle = "#5a3a1e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 1; k < len - 1e-9; k++)
      if (k > from) line(ctx, (X0 + k * ppu) | 0, RIB_Y, (X0 + k * ppu) | 0, RIB_Y + RIB_H);
    ctx.stroke();
  }

  drawPaving(ctx) {
    const pw = this.st[PAVE_W];
    const g = this.paveGroup;
    const cut = this.st[CONSUMED] * this.st[PPU];
    for (let i = 0; i < this.paved; i++) {
      if ((i + 1) * pw <= cut + 0.5) continue;
      ctx.fillStyle = ((i / g) | 0) % 2 === 0 ? "#46c2b8" : "#7bdc8f";
      rect(ctx, (X0 + i * pw + 1) | 0, RIB_Y + 8, (pw - 2) | 0, RIB_H - 16);
    }
    ctx.fillStyle = "#e8eefc";
    ctx.font = "700 16px system-ui";
    ctx.textAlign = "left";
    text(ctx, this.labels.paved, 40, 470);
  }

  drawGhosts(ctx) {
    const ppu = this.st[PPU];
    alphaLevel(ctx, 11);
    ctx.strokeStyle = "#9ad9ff";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < this.unitN; i++) {
      const x = (X0 + this.unitX[i] * ppu) | 0;
      line(ctx, x, RIB_Y + RIB_H - 12, x, RIB_Y + RIB_H);
    }
    ctx.stroke();
    alphaLevel(ctx, 18);
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < this.ghostN; i++) {
      const x = (X0 + this.ghostX[i] * ppu) | 0;
      line(ctx, x, RIB_Y - 12, x, RIB_Y + RIB_H + 6);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  drawPieces(ctx) {
    const ppu = this.st[PPU];
    const glow = this.springs.pos[S_GLOW];
    for (let i = 0; i < this.dropped; i++) {
      const y = (RIB_Y + this.springs.pos[i]) | 0;
      const k = this.pieceKind[i];
      ctx.fillStyle =
        k === 0 ? (glow > 0.5 ? "#7bdc8f" : "#46c2b8") : k === 2 ? "#f2b45a" : "#8d99ad";
      const x0 = (X0 + this.pieceA[i] * ppu) | 0;
      const w = ((this.pieceB[i] - this.pieceA[i]) * ppu) | 0;
      roundRect(ctx, x0 + 2, y, w - 4, RIB_H, 5);
      ctx.fill();
    }
    if (this.mode === "aperture" && this.labels.cut) {
      ctx.fillStyle = "#111a2e";
      roundRect(ctx, 40, 360, 220, 40, 8);
      ctx.fill();
      ctx.fillStyle = "#e8eefc";
      ctx.font = "700 18px system-ui";
      ctx.textAlign = "left";
      text(ctx, this.labels.cut, 56, 386);
    }
  }

  drawCutter(ctx) {
    const st = this.st;
    const ppu = st[PPU];
    const x = (X0 + st[CUT] * ppu) | 0;
    const bob = this.springs.pos[S_HEAD] | 0;
    // Aperture caliper riding ahead of the head: the divisor length.
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 3;
    ctx.beginPath();
    const w = (st[AP] * ppu) | 0;
    line(ctx, x, RIB_Y - 18, x + w, RIB_Y - 18);
    line(ctx, x, RIB_Y - 28, x, RIB_Y - 8);
    line(ctx, x + w, RIB_Y - 28, x + w, RIB_Y - 8);
    ctx.stroke();
    if (this.sweeping) {
      ctx.strokeStyle = "#ff6b6b";
      ctx.lineWidth = 3;
      ctx.beginPath();
      line(ctx, x, RAIL_Y + 34 + bob, x, RIB_Y + RIB_H + 6);
      ctx.stroke();
      // Hot contact point where the beam meets the ribbon.
      ctx.fillStyle = "#ffd166";
      rect(ctx, x - 5, RIB_Y - 5, 10, 10);
    }
    ctx.fillStyle = "#3b5785";
    roundRect(ctx, x - 22, RAIL_Y + bob, 44, 34, 8);
    ctx.fill();
    ctx.fillStyle = this.sweeping ? "#ff6b6b" : "#46c2b8";
    rect(ctx, x - 6, RAIL_Y + 24 + bob, 12, 10);
  }

  drawVernier(ctx) {
    ctx.fillStyle = "#e8eefc";
    ctx.font = "700 16px system-ui";
    ctx.textAlign = "left";
    text(ctx, this.labels.vernier, VERN_X, VERN_Y - 12);
    const f = this.springs.pos[S_VERN];
    if (f > 0.002) {
      ctx.fillStyle = "#f2b45a";
      rect(ctx, VERN_X + 2, VERN_Y + 2, (f * (VERN_W - 4)) | 0, 36);
    }
  }
}

/** Static apparatus: gantry rail, inventory tray, vernier template. */
function paintFrame() {
  return staticLayer(960, 540, (g) => {
    g.fillStyle = "#24365c";
    g.fillRect(40, RAIL_Y - 8, 880, 6);
    g.fillStyle = "#1c2a45";
    g.fillRect(40, RIB_Y + DROP + RIB_H + 2, 880, 10);
    g.strokeStyle = "#2c3e63";
    g.lineWidth = 2;
    g.strokeRect(VERN_X, VERN_Y, VERN_W, 40);
    g.strokeStyle = "#5b6f96";
    g.beginPath();
    for (let i = 0; i <= 24; i++) {
      const x = VERN_X + Math.round((VERN_W * i) / 24) + 0.5;
      g.moveTo(x, VERN_Y + 40);
      g.lineTo(x, VERN_Y + 40 + (i % 6 === 0 ? 12 : 6));
    }
    g.stroke();
  });
}

define("ew-kinetic-slicer", KineticSlicer);

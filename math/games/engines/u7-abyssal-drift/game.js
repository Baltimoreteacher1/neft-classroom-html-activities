// Abyssal Drift: Sub-Surface Vector Navigator — Unit 7: Rational Numbers and the Coordinate Plane.
//
// The coordinate plane IS the ocean. The surface is locked at y = 0; negative
// y is depth, positive y is altitude (the sub can breach and hover). The
// x-thruster and y-ballast ARE the ordered pair: whatever the student sets is
// where the sub goes. Four machines share the map:
//  - NAVIGATE: a vent's coordinates arrive as telemetry text only; dive to it.
//  - HULL: hull strain is |d|, so +d and −d strain the hull equally (opposites,
//    absolute value), and readings are compared by where they sit on the line.
//  - TETHER: two beacons share a coordinate; the tether dial must equal the
//    distance between them, or the cable falls short or sags.
//  - MIRROR: the sonar echo of a contact reflected across an axis.

import { EduWonderEngine, define } from "../core/engine.js";
import { ParticlePool } from "../core/particles.js";
import { SpringBank } from "../core/spring.js";
import {
  judgeHull,
  judgeMirror,
  judgePoint,
  judgeTether,
  makeHull,
  makeMirror,
  makeNav,
  makeTether,
  modeFor,
  num,
  RANGE,
  stepFor,
  TETHER_MAX,
} from "./math.js";
import {
  buildLayers,
  DRONE_X,
  F_EMIT,
  F_PING,
  F_T,
  HULL_X,
  I_FIRED,
  I_LINKS,
  I_PEND,
  I_PINGOK,
  I_PINGON,
  I_SOLVED,
  M_HULL,
  M_MIRROR,
  M_NAV,
  M_TETHER,
  layout,
  renderAll,
  SCR_SIZE,
  C_SUBX,
  C_SUBY,
  S_CABLE,
  S_GAUGE,
  S_TX,
  S_TY,
  S_X,
  S_Y,
  toX,
  toY,
} from "./render.js";
import { STRINGS } from "./strings.js";

const UP = -Math.PI / 2;
const DT = 1 / 60; // the core's fixed step; a module constant crosses calls without boxing
const ALL_AROUND = Math.PI * 2;
const MODE_ID = { nav: M_NAV, hull: M_HULL, tether: M_TETHER, mirror: M_MIRROR };

class AbyssalDrift extends EduWonderEngine {
  static meta = {
    gameId: "u7-abyssal-drift",
    unit: 7,
    lessons: ["7-1", "7-2", "7-3", "7-4", "7-5", "7-6", "7-7", "7-8", "7-9"],
    checkId: "dive",
  };

  static strings = STRINGS;

  initWorld() {
    this.springs = new SpringBank(6);
    this.particles = new ParticlePool(240, ["#bfe9ff", "#f2b45a", "#7bdc8f", "#ff6b6b", "#46c2b8"]);
    this.particles.gravity = -90; // bubbles rise
    if (this.reducedMotion) {
      this.particles.scale = 0;
      this.springs.omega = 40;
    }
    this.f = new Float64Array(6);
    this.scr = new Int32Array(SCR_SIZE);
    this.f[F_PING] = -1;
    this.s = new Int32Array(6);
    this.mode = "nav";
    this.m = M_NAV;
    this.q = null;
    this.step = 1;
    this.subX = 0; // where the sub was sent (event-time numbers for describe())
    this.subY = 0;
    this.len = 0; // tether dial value (number, read by render)
    // Screen-space geometry cached per round (integers), read by render.
    this.geo = new Int32Array(12);
    this.labels = {
      mode: "",
      p1: "",
      p2: "",
      strain: "",
      abs: "",
      segA: "",
      segB: "",
      mDist: "",
      r0: "",
      r1: "",
      r2: "",
      given: "",
    };
    this.layers = buildLayers();
  }

  buildControls() {
    this.sx = this.slider({
      id: "thrust-x",
      label: "thrustX",
      min: -RANGE,
      max: RANGE,
      value: 0,
      format: (v) =>
        this.t(v > 0 ? "fmtEast" : v < 0 ? "fmtWest" : "fmtZeroX", { v: num(v), a: Math.abs(v) }),
      onInput: (v) => {
        this.springs.setTarget(S_TX, v);
        this.sync(false);
      },
    });
    this.sy = this.slider({
      id: "ballast-y",
      label: "ballastY",
      min: -RANGE,
      max: RANGE,
      value: 0,
      format: (v) =>
        this.t(v > 0 ? "fmtUp" : v < 0 ? "fmtDown" : "fmtSurface", { v: num(v), a: Math.abs(v) }),
      onInput: (v) => {
        this.springs.setTarget(S_TY, v);
        if (this.m === M_HULL) {
          // The ballast IS the depth here: the sub rides it live, the gauge reads |d|.
          this.springs.setTarget(S_Y, v);
          this.springs.setTarget(S_GAUGE, Math.abs(v));
          this.subY = v;
        }
        this.sync(false);
      },
    });
    this.tl = this.slider({
      id: "tether",
      label: "tether",
      min: 0,
      max: TETHER_MAX,
      value: 0,
      format: (v) => this.t("fmtLen", { v }),
      onInput: (v) => {
        this.len = v;
        this.springs.setTarget(S_TX, v);
        this.s[I_FIRED] = 0;
        this.springs.snap(S_CABLE, 0);
        this.sync(false);
      },
    });
    this.moveXBtn = this.button({
      id: "move-x",
      label: "moveX",
      onPress: () => this.moveAxis(true),
    });
    this.moveYBtn = this.button({
      id: "move-y",
      label: "moveY",
      onPress: () => this.moveAxis(false),
    });
    this.linkBtn = this.button({ id: "lay-link", label: "layLink", onPress: () => this.layLink() });
    this.diveBtn = this.button({
      id: "dive",
      label: "dive",
      primary: true,
      onPress: () => this.check(),
    });
    this.binders.push(() => {
      const key = ["dive", "hold", "fire", "mirror"][this.m];
      this.diveBtn.textContent = this.t(key);
    });
  }

  newRound(level, next) {
    this.mode = modeFor(this.roundIndex);
    this.m = MODE_ID[this.mode];
    this.step = stepFor(level);
    const m = this.m;
    this.sx.wrap.hidden = !(m === M_NAV || m === M_MIRROR);
    this.sy.wrap.hidden = m === M_TETHER;
    this.tl.wrap.hidden = m !== M_TETHER;
    for (const s of [this.sx, this.sy]) s.setRange(-RANGE, RANGE, this.step);
    this.tl.setRange(0, TETHER_MAX, this.step);
    this.sx.set(0);
    this.sy.set(0);
    this.tl.set(0);
    this.len = 0;
    this.springs.snap(S_TX, 0);
    this.springs.snap(S_TY, 0);
    this.springs.snap(S_GAUGE, 0);
    this.springs.snap(S_CABLE, 0);
    this.particles.clear();
    this.s.fill(0);
    this.f[F_PING] = -1;
    if (m === M_NAV) this.q = makeNav(level, next);
    else if (m === M_HULL) this.q = makeHull(level, next);
    else if (m === M_TETHER) this.q = makeTether(level, next);
    else this.q = makeMirror(level, next);
    // Park the sub where the round begins; no round starts on its answer
    // (every target coordinate, depth and distance is nonzero, controls start at 0).
    const startX = m === M_HULL ? HULL_X : m === M_TETHER ? this.q.A.x : 0;
    const startY = m === M_TETHER ? this.q.A.y : 0;
    this.springs.snap(S_X, startX);
    this.springs.snap(S_Y, startY);
    this.subX = startX;
    this.subY = startY;
    this.cacheGeometry();
    layout(this);
    this.onTier(this.tier);
  }

  /** Integer screen geometry for this round's fixed objects. */
  cacheGeometry() {
    const g = this.geo;
    g.fill(0);
    const q = this.q;
    if (this.m === M_TETHER) {
      g[0] = toX(q.A.x);
      g[1] = toY(q.A.y);
      g[2] = toX(q.B.x);
      g[3] = toY(q.B.y);
      // The axis crossing on the cable's line.
      g[4] = q.horizontal ? toX(0) : g[0];
      g[5] = q.horizontal ? g[1] : toY(0);
      g[6] = q.horizontal ? Math.sign(q.b - q.a) : 0; // screen direction A -> B
      g[7] = q.horizontal ? 0 : -Math.sign(q.b - q.a);
    } else if (this.m === M_MIRROR) {
      g[0] = toX(q.p.x);
      g[1] = toY(q.p.y);
      g[4] = q.axis === "x" ? g[0] : toX(0); // foot of the perpendicular on the mirror axis
      g[5] = q.axis === "x" ? toY(0) : g[1];
    } else if (this.m === M_HULL) {
      g[0] = toX(DRONE_X);
      g[1] = q.variant === "match" ? toY(q.given) : 0;
      for (let i = 0; i < q.readings.length; i++) g[2 + i] = toY(q.readings[i]);
    } else {
      g[0] = toX(q.x);
      g[1] = toY(q.y);
    }
  }

  onTier(n) {
    const twoAxis = this.m === M_NAV || this.m === M_MIRROR;
    this.moveXBtn.hidden = !(n >= 2 && twoAxis);
    this.moveYBtn.hidden = !(n >= 2 && twoAxis);
    this.linkBtn.hidden = !(n >= 2 && this.m === M_TETHER);
  }

  /** Tier 2: move one axis at a time, so x and y are felt as two separate moves. */
  moveAxis(alongX) {
    if (this.solved) return;
    if (alongX) {
      this.subX = Number(this.sx.input.value);
      this.springs.setTarget(S_X, this.subX);
    } else {
      this.subY = Number(this.sy.input.value);
      this.springs.setTarget(S_Y, this.subY);
    }
    this.synth.impact(0.3);
    this.sync(false);
    this.say(this.t(alongX ? "movedX" : "movedY", { x: num(this.subX), y: num(this.subY) }));
  }

  /** Tier 2: lay one unit link of tether from A toward B, one-to-one. */
  layLink() {
    if (this.solved) return;
    const max = Math.ceil(this.q.distance);
    if (this.s[I_LINKS] >= max) {
      this.say(this.t("linksDone"));
      return;
    }
    this.s[I_LINKS]++;
    this.synth.lock();
    this.say(this.t(this.s[I_LINKS] >= max ? "linksDone" : "linkLaid"));
  }

  evaluate() {
    const q = this.q;
    if (this.m === M_NAV || this.m === M_MIRROR) {
      const x = Number(this.sx.input.value);
      const y = Number(this.sy.input.value);
      this.subX = x;
      this.subY = y;
      this.springs.setTarget(S_X, x);
      this.springs.setTarget(S_Y, y);
      const target = this.m === M_NAV ? q : q.image;
      const r = this.m === M_NAV ? judgePoint(q, x, y) : judgeMirror(q, x, y);
      this.s[I_PEND] = r.verdict === "ok" ? 1 : 2;
      if (r.verdict === "ok") {
        const vars = { x: num(x), y: num(y), px: "", py: "", axis: "" };
        if (this.m === M_NAV) return { ok: true, key: "solvedNav", vars };
        vars.px = num(q.p.x);
        vars.py = num(q.p.y);
        vars.axis = this.t(q.axis === "x" ? "axisX" : "axisY");
        return { ok: true, key: "solvedMirror", vars };
      }
      if (r.verdict === "swapped")
        return { ok: false, key: "swapped", misconception: "swapped-coordinates" };
      if (r.verdict === "unchanged")
        return { ok: false, key: "unchanged", misconception: "not-reflected" };
      if (r.verdict === "bothFlipped")
        return { ok: false, key: "bothFlipped", misconception: "flipped-both-signs" };
      if (r.verdict === "wrongAxis")
        return {
          ok: false,
          key: "wrongAxis",
          misconception: "reflected-wrong-axis",
          vars: { axis: this.t(q.axis === "x" ? "axisX" : "axisY") },
        };
      return this.pointMiss(r.dx, r.dy, target.y);
    }
    if (this.m === M_HULL) {
      const d = Number(this.sy.input.value);
      const r = judgeHull(q, d);
      if (r.verdict === "ok")
        return { ok: true, key: "solvedHull", vars: { d: num(d), a: Math.abs(d) } };
      if (r.verdict === "trap") {
        if (q.variant === "match")
          return { ok: false, key: q.drone ? "hullAbove" : "hullBelow", misconception: q.tag };
        return {
          ok: false,
          key: q.tag === "value-for-distance" ? "valueDistance" : "absOrder",
          misconception: q.tag,
        };
      }
      return { ok: false, key: r.dir > 0 ? "hullHigh" : "hullLow", misconception: "compare-order" };
    }
    // Tether: fire the cable from A toward B.
    const len = Number(this.tl.input.value);
    this.s[I_FIRED] = 1;
    this.springs.snap(S_CABLE, 0);
    this.springs.setTarget(S_CABLE, 1);
    this.synth.impact(0.5);
    const r = judgeTether(q, len);
    if (r.verdict === "ok") return { ok: true, key: "solvedTether", vars: { d: q.distance } };
    if (r.verdict === "subtracted")
      return { ok: false, key: "subtracted", misconception: "subtracted-absolute-values" };
    if (r.verdict === "added")
      return { ok: false, key: "added", misconception: "added-absolute-values" };
    return r.dir < 0
      ? { ok: false, key: "short", misconception: "distance-short" }
      : { ok: false, key: "long", misconception: "distance-long" };
  }

  /** A miss names the direction on each wrong axis, never the target. */
  pointMiss(dx, dy, targetY) {
    const xs = dx > 0 ? "tooEast" : "tooWest";
    const ys =
      targetY > 0 ? (dy > 0 ? "tooHighAir" : "tooLowAir") : dy > 0 ? "tooShallow" : "tooDeep";
    if (dx !== 0 && dy !== 0)
      return {
        ok: false,
        key: "missTwo",
        misconception: "plotting-error",
        vars: { a: this.t(xs), b: this.t(ys) },
      };
    return {
      ok: false,
      key: "missOne",
      misconception: "plotting-error",
      vars: { a: this.t(dx !== 0 ? xs : ys) },
    };
  }

  onSolved() {
    this.s[I_SOLVED] = 1;
    this.synth.lock();
    const x = toX(this.subX);
    const y = toY(this.subY);
    this.particles.emit(x, y, 40, 220, 2, UP, ALL_AROUND, 1.1);
  }

  onMiss() {
    this.particles.emit(toX(this.subX), toY(this.subY), 14, 140, 1, UP, ALL_AROUND, 0.8);
  }

  updatePhysics(_dt) {
    this.springs.step(DT);
    this.particles.update(DT);
    const f = this.f;
    f[F_T] += DT;
    if (this.s[I_PINGON] === 1) {
      f[F_PING] += DT;
      if (f[F_PING] > 1.4) this.s[I_PINGON] = 0;
    }
    const sp = this.springs;
    if (this.s[I_PEND] > 0) {
      const ex = sp.pos[S_X] - sp.target[S_X];
      const ey = sp.pos[S_Y] - sp.target[S_Y];
      if (ex < 0.04 && ex > -0.04 && ey < 0.04 && ey > -0.04) {
        // Arrived: the sonar pings from where the sub really is.
        this.s[I_PINGOK] = this.s[I_PEND] === 1 ? 1 : 0;
        this.s[I_PEND] = 0;
        f[F_PING] = 0;
        this.s[I_PINGON] = 1;
        this.particles.emit(this.scr[C_SUBX], this.scr[C_SUBY], 10, 90, 0, UP, 2.4, 0.9);
      }
    }
    if (this.m === M_HULL && !this.solved) {
      // Strain bubbles off the hull once |d| is large.
      const g = sp.pos[S_GAUGE];
      f[F_EMIT] += DT;
      if (g > 6.5 && f[F_EMIT] > 0.3 - g * 0.02) {
        f[F_EMIT] = 0;
        this.particles.emit(this.scr[C_SUBX], this.scr[C_SUBY], 2, 50, 0, UP, 1.2, 0.8);
      }
    }
    layout(this);
  }

  refreshLabels() {
    const L = this.labels;
    const q = this.q;
    if (!q) return;
    L.mode = this.t(["modeNav", "modeHull", "modeTether", "modeMirror"][this.m]);
    const x = Number(this.sx.input.value);
    const y = Number(this.sy.input.value);
    L.p1 = "";
    L.p2 = "";
    if (this.m === M_NAV || this.m === M_MIRROR) {
      L.p1 = this.t("plateX", { v: num(x) });
      L.p2 = this.t("plateY", { v: num(y) });
    } else if (this.m === M_HULL) {
      L.p1 = this.t("plateDepth", { v: num(y) });
      L.strain = this.t("plateStrain", { v: Math.abs(y) });
      L.abs = this.t("absLabel", { v: num(y), a: Math.abs(y) });
      L.given = q.variant === "match" ? num(q.given) : "";
      L.r0 = q.readings.length ? num(q.readings[0]) : "";
      L.r1 = q.readings.length ? num(q.readings[1]) : "";
      L.r2 = q.readings.length ? num(q.readings[2]) : "";
    } else {
      L.p1 = this.t("plateLen", { v: Number(this.tl.input.value) });
      L.segA = `|${num(q.a)}|`;
      L.segB = `|${num(q.b)}|`;
    }
    if (this.m === M_MIRROR) L.mDist = `|${num(q.axis === "x" ? q.p.y : q.p.x)}|`;
  }

  describe() {
    const q = this.q;
    if (!q) return "";
    if (this.m === M_NAV)
      return this.t("descNav", {
        tx: num(q.x),
        ty: num(q.y),
        x: num(this.subX),
        y: num(this.subY),
        sx: num(Number(this.sx.input.value)),
        sy: num(Number(this.sy.input.value)),
      });
    if (this.m === M_HULL) {
      const d = Number(this.sy.input.value);
      if (q.variant === "match")
        return this.t(q.drone ? "descHullDrone" : "descHullBuoy", {
          g: num(q.given),
          d: num(d),
          s: Math.abs(d),
        });
      return this.t("descHullOrder", { r: this.readingList(), d: num(d), s: Math.abs(d) });
    }
    if (this.m === M_TETHER)
      return this.t("descTether", {
        ax: num(q.A.x),
        ay: num(q.A.y),
        bx: num(q.B.x),
        by: num(q.B.y),
        l: Number(this.tl.input.value),
      });
    return this.t("descMirror", {
      px: num(q.p.x),
      py: num(q.p.y),
      axis: this.t(q.axis === "x" ? "axisX" : "axisY"),
      x: num(Number(this.sx.input.value)),
      y: num(Number(this.sy.input.value)),
      sx: num(this.subX),
      sy: num(this.subY),
    });
  }

  readingList() {
    return this.q.readings.map((v) => `${num(v)} m`).join(", ");
  }

  mission() {
    const q = this.q;
    if (this.m === M_NAV) return this.t("missionNav", { x: num(q.x), y: num(q.y) });
    if (this.m === M_HULL) {
      if (q.variant === "match")
        return this.t(q.drone ? "missionDrone" : "missionBuoy", {
          k: Math.abs(q.given),
          g: num(q.given),
        });
      const key = {
        deepest: "missionDeepest",
        highest: "missionHighest",
        closest: "missionClosest",
        farthest: "missionFarthest",
        middle: "missionMiddle",
      }[q.variant];
      return this.t(key, { r: this.readingList() });
    }
    if (this.m === M_TETHER)
      return this.t("missionTether", {
        ax: num(q.A.x),
        ay: num(q.A.y),
        bx: num(q.B.x),
        by: num(q.B.y),
      });
    return this.t("missionMirror", {
      px: num(q.p.x),
      py: num(q.p.y),
      axis: this.t(q.axis === "x" ? "axisX" : "axisY"),
    });
  }

  testPlan() {
    const q = this.q;
    const st = this.step;
    const press = (control, value, min) => [
      { control, key: "Home" },
      { control, key: "ArrowRight", times: Math.round((value - min) / st) },
    ];
    if (this.m === M_NAV || this.m === M_MIRROR) {
      const t = this.m === M_NAV ? q : q.image;
      return [
        ...press("thrust-x", t.x, -RANGE),
        ...press("ballast-y", t.y, -RANGE),
        { control: "dive", key: "Enter" },
      ];
    }
    if (this.m === M_HULL)
      return [...press("ballast-y", q.answer, -RANGE), { control: "dive", key: "Enter" }];
    return [...press("tether", q.distance, 0), { control: "dive", key: "Enter" }];
  }

  renderScene(ctx) {
    renderAll(this, ctx);
  }
}

define("ew-abyssal-drift", AbyssalDrift);

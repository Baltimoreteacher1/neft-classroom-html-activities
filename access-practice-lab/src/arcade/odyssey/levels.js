// levels.js — chapters, levels and the generator that lays out one platform sequence from a difficulty.
//
// A RUN plays one chapter: three levels. A level is three platform sequences (screens) and ends at a language gate.
// The third level of every chapter ends at a capstone with two gates. Everything is deterministic: the same
// (chapter, level, sequence, difficulty) always yields the same layout, so a run can be saved at a checkpoint and
// rebuilt, and the reachability checker (reach.js) can prove every jump with the same physics the game runs.
// All geometry is in pixels; y grows downward; platform `y` is the walking surface.
import { TILE } from "./physics.js";

export const CHAPTER_COUNT = 3;
export const LEVELS_PER_CHAPTER = 3;
export const SEQUENCES_PER_LEVEL = 3;

/**
 * Per chapter: the theme key (art, palette, hazard), and the language-gate plan per level. `domains`/`formats` are
 * passed to ui.ask so the gate type matches the gate's theme; a capstone has two entries.
 */
export const CHAPTERS = Object.freeze([
  {
    n: 1,
    key: "library",
    hazard: "ink",
    mover: "x",
    weights: { hop: 4, steps: 2, run: 2, block: 1 },
    gates: [
      [{ domains: ["Reading"], formats: ["choice"] }],
      [{ domains: ["Reading"], formats: ["choice", "multi"] }],
      [
        { domains: ["Reading"], formats: ["choice"] },
        { domains: ["Reading", "Writing"], formats: ["multi", "order"] },
      ],
    ],
  },
  {
    n: 2,
    key: "gardens",
    hazard: "bramble",
    mover: "x",
    weights: { steps: 3, hop: 3, hazard: 3, block: 2 },
    gates: [
      [{ domains: ["Writing", "Reading"], formats: ["order"] }],
      [{ domains: ["Reading", "Writing"], formats: ["choice"] }],
      [
        { domains: ["Writing"], formats: ["order", "construct"] },
        { domains: ["Writing", "Reading"], formats: ["construct", "choice"] },
      ],
    ],
  },
  {
    n: 3,
    key: "skyline",
    hazard: "zap",
    mover: "y",
    weights: { hop: 3, steps: 2, hazard: 2, block: 1 },
    gates: [
      [{ domains: ["Listening"], formats: ["choice"] }],
      [{ domains: ["Listening", "Reading"], formats: ["order", "choice"] }],
      [
        { domains: ["Listening"], formats: ["choice", "multi"] },
        { domains: ["Writing", "Reading"], formats: ["construct", "order"] },
      ],
    ],
  },
]);

export const levelId = (ch, lv) => `od-ch${ch}-l${lv}`;
export const parseLevelId = (id) => {
  const m = /^od-ch(\d)-l(\d)$/.exec(String(id));
  return m ? { chapter: +m[1], level: +m[2] } : null;
};
export const gatePlan = (ch, lv) => CHAPTERS[ch - 1].gates[lv - 1];
export const gateCount = (ch, lv) => gatePlan(ch, lv).length;

/** Which levels of a chapter are done: a stored level id implies the earlier levels of its chapter (they are played in order). */
export function doneLevels(completed = []) {
  const done = new Set();
  for (const id of completed) {
    const p = parseLevelId(id);
    if (p) for (let l = 1; l <= p.level; l += 1) done.add(levelId(p.chapter, l));
  }
  return done;
}
/** The chapter to suggest: the first with an unfinished level, else the first. */
export function recommendedChapter(completed = []) {
  const done = doneLevels(completed);
  for (let c = 1; c <= CHAPTER_COUNT; c += 1)
    if (!done.has(levelId(c, LEVELS_PER_CHAPTER))) return c;
  return 1;
}

const mulberry = (seed) => {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const lerp = (a, b, t) => a + (b - a) * t;
const snap = (v, g = 8) => Math.round(v / g) * g;
export const progressOf = (ch, lv, seq) => ((ch - 1) * 3 + (lv - 1) + (seq - 1) / 3) / 9;

const GAP_CAP = 120; // px: no generated jump gap exceeds this (a full jump at 85% speed clears 136 on the flat)
const ISLAND_H = 22;

/** Build one sequence. `d` comes from worldDifficulty. Returns plain data (see the comments inline). */
export function buildSequence({ chapter, level, seq, diff: d }) {
  const C = CHAPTERS[chapter - 1];
  const rng = mulberry(chapter * 997 + level * 131 + seq * 17 + 5);
  const s = clamp(progressOf(chapter, level, seq), 0, 1);
  const id = `od-ch${chapter}-l${level}-s${seq}`;
  const plats = [];
  const route = [];
  const shards = [];
  const hazards = [];
  const beatEnds = [];
  const bonus = [];
  const add = (kind, x, top, w, o = {}) => {
    plats.push({
      kind,
      x,
      y: top,
      w,
      h: o.h ?? ISLAND_H,
      solid: Boolean(o.solid),
      mv: o.mv || null,
      safe: o.safe !== false && !o.mv && kind !== "block",
    });
    return plats.length - 1;
  };
  const platW = () => snap(lerp(d.platMax, d.platMin, s) * TILE * (0.9 + 0.2 * rng()), 16);
  const gapPx = (rise = 0) =>
    Math.min(
      GAP_CAP - 0.55 * Math.max(0, rise),
      snap(lerp(d.gapMin, d.gapMax, s) * TILE * (0.9 + 0.2 * rng()), 8),
    );
  const risePx = () => {
    const max = Math.max(1, Math.floor(d.rise));
    return (rng() < 0.5 ? 0 : Math.ceil(rng() * max)) * TILE;
  };

  let cur = add("start", 0, 520, 256, { h: 28 });
  route.push(cur);
  let top = 520;
  const right = () => plats[cur].x + plats[cur].w;
  const place = (idx) => {
    cur = idx;
    top = plats[idx].y;
    route.push(idx);
  };
  const vertical = (rise) => {
    const y = top - rise;
    return y < 300 ? top + rise : y > 700 ? top - rise : y;
  };

  const beats = {
    hop: () => {
      const r = risePx();
      const g = gapPx(r);
      place(add("island", right() + g, vertical(r), platW()));
    },
    steps: () => {
      for (let i = 0; i < 3; i += 1) {
        const r = i === 0 ? 0 : TILE;
        const g = gapPx(r) * 0.8;
        place(
          add(
            "island",
            right() + g,
            vertical(rng() < 0.5 ? r : -r),
            snap(Math.max(80, platW() * 0.55), 16),
          ),
        );
      }
    },
    run: () => {
      place(add("island", right() + gapPx(), top, snap(platW() * 1.5 + 64, 16)));
    },
    block: () => {
      const g = gapPx();
      const x = right() + g;
      const k = d.c > 0.5 ? 2 : 1;
      const left = add("island", x, top, 96);
      const blk = add("block", x + 96, top, 32, { solid: true, h: k * TILE });
      const rt = add("island", x + 128, top, snap(platW(), 16));
      route.push(left, blk);
      place(rt);
    },
    hazard: () => {
      const w = snap(Math.max(192, platW() * 1.4), 16);
      const g = gapPx();
      const x = right() + g;
      const isl = add("island", x, top, w);
      place(isl);
      hazards.push({
        id: `${id}:h${hazards.length}`,
        type: C.hazard,
        x: x + w / 2 - 14,
        y: top - 22,
        w: 28,
        h: 22,
        plat: isl,
        phase: rng() * 6.28,
      });
    },
    mover: () => {
      const vert = C.mover === "y" && rng() < 0.6;
      const near = 28;
      const bw = 96;
      if (!vert) {
        const span = snap(lerp(7, 9, d.c) * TILE, 8);
        const range = span - 2 * near - bw;
        const m = add("mover", right() + near, top, bw, {
          mv: { axis: "x", range, period: (2 * range) / d.moverSpeed, phase: 0 },
        });
        const dest = add("island", right() + span, top, platW());
        route.push(m);
        place(dest);
      } else {
        const mvy = 3 * TILE;
        const dir = top - mvy < 300 ? -1 : top + mvy > 700 ? 1 : rng() < 0.5 ? 1 : -1;
        const span = 144;
        const m = add("mover", right() + 24, top, bw, {
          mv: { axis: "y", range: -dir * mvy, period: (2 * mvy) / d.moverSpeed, phase: 0 },
        });
        const dest = add("island", right() + span, top - dir * mvy, platW());
        route.push(m);
        place(dest);
      }
    },
  };

  const pickBeat = (i) => {
    if (i > 0 && rng() < d.moverShare * (0.6 + s)) return "mover";
    const entries = Object.entries(C.weights).filter(([k]) => k !== "hazard" || d.hazards > 0);
    let r = rng() * entries.reduce((n, [, w]) => n + w, 0);
    for (const [k, w] of entries) {
      r -= w;
      if (r <= 0) return k;
    }
    return "hop";
  };
  const hazardBeats = new Set();
  for (let n = 0; n < d.hazards; n += 1) hazardBeats.add(1 + Math.floor(rng() * (d.beats - 1)));
  const names = [];
  for (let i = 0; i < d.beats; i += 1) {
    const name = hazardBeats.has(i) ? "hazard" : pickBeat(i);
    beats[name]();
    names.push(name);
    beatEnds.push(cur);
  }

  // The last island of the screen: the exit ring (sequences 1-2) or the first gate dais (sequence 3).
  const gates = [];
  const gcount = seq === SEQUENCES_PER_LEVEL ? gateCount(chapter, level) : 0;
  let exitPlat;
  if (!gcount) {
    exitPlat = add("exit", right() + gapPx(), top, 256, { h: 28 });
    route.push(exitPlat);
  } else {
    place(add("gate", right() + gapPx(), top, 224, { h: 28 }));
    for (let g = 0; g < gcount; g += 1) {
      const gapT = clamp(lerp(d.gapMin, d.gapMax, s) * TILE, 56, 104);
      const seg = 96;
      const span = 2 * seg + 3 * gapT;
      const dais = cur;
      const x0 = plats[dais].x + plats[dais].w;
      const last = g === gcount - 1;
      const next = add(last ? "exit" : "gate", x0 + span, top, last ? 256 : 224, { h: 28 });
      gates.push({
        dais,
        x0,
        x1: x0 + span,
        y: top,
        gapPx: gapT,
        seg,
        to: next,
        wisp:
          !(d.calm || d.autoWalk) && (d.hazards > 0 || d.c > 0.4)
            ? {
                id: `${id}:w${g}`,
                type: C.hazard,
                x: x0 + gapT + seg + gapT / 2 - 14,
                y: top - 70,
                w: 28,
                h: 24,
                bob: true,
                phase: g,
              }
            : null,
      });
      route.push(next);
      cur = next;
    }
    exitPlat = cur;
  }

  // Checkpoints sit on the middle (and, when assisting, the first quarter) static island of the screen.
  const checkpoints = [];
  const cpBeats = [Math.floor(d.beats / 2)];
  if (d.extraCheckpoint) cpBeats.unshift(Math.floor(d.beats / 4));
  for (const b of cpBeats) {
    let idx = beatEnds[b];
    if (!plats[idx].safe || plats[idx].w < 64)
      idx = beatEnds.slice(b).find((i) => plats[i].safe && plats[i].w >= 64) ?? idx;
    if (!checkpoints.some((c) => c.plat === idx))
      checkpoints.push({ id: `${id}:c${checkpoints.length}`, plat: idx });
  }

  // Rescue ledge for a struggling learner: a small island in the widest gap on the route.
  if (d.rescueLedge) {
    let best = -1;
    let bg = 0;
    for (let i = 0; i < route.length - 1; i += 1) {
      const a = plats[route[i]];
      const b = plats[route[i + 1]];
      if (a.mv || b.mv || a.kind === "gate") continue;
      const g = b.x - (a.x + a.w);
      if (g > bg) {
        bg = g;
        best = i;
      }
    }
    if (best >= 0 && bg >= 64) {
      const a = plats[route[best]];
      const b = plats[route[best + 1]];
      const mid = add("island", a.x + a.w + bg / 2 - 28, Math.round((a.y + b.y) / 2) + 8, 56);
      route.splice(best + 1, 0, mid);
    }
  }

  // Optional high route (ability stretch): a small raised island hovering over the END of a wide island, one short hop up
  // from it and a longer leap across the next gap than the plain jump. It never sits over a gap, so it cannot catch a
  // jump on the main route; a few extra Shards sit on it.
  if (d.bonusRoute) {
    let made = 0;
    for (let i = 1; i < route.length - 2 && made < 2; i += 1) {
      const a = plats[route[i]];
      const b = plats[route[i + 1]];
      if (
        a.mv ||
        b.mv ||
        a.kind === "block" ||
        b.kind === "block" ||
        a.kind === "gate" ||
        b.kind === "gate" ||
        a.w < 128 ||
        b.x - (a.x + a.w) < 48
      )
        continue;
      if (made === 1 && i < bonus[0].at + 3) continue;
      const h = add("bonus", a.x + a.w - 104, a.y - 56, 96, { safe: false });
      bonus.push({ plat: h, at: i, a: route[i], b: route[i + 1] });
      made += 1;
    }
  }

  // Shards: evenly along the route; world pickups are small and capped per level by the runtime.
  const spots = route.map((r, i) => i).filter((i) => i < route.length - 1);
  const want = Math.min(d.shardsPerSeq, spots.length);
  for (let k = 0; k < want; k += 1) {
    const i = spots[Math.floor((k + 0.5) * (spots.length / want))];
    const a = plats[route[i]];
    const b = plats[route[i + 1]];
    const apex = Math.min(a.y, b.y) - 125; // about where a full jump's arc passes, so Auto-walk and a full-height jump collect them
    const x = a.mv || b.mv ? (a.x + a.w / 2 + b.x + b.w / 2) / 2 : (a.x + a.w + b.x) / 2;
    shards.push({ id: `${id}:s${k}`, x: Math.round(x), y: Math.round(apex), high: false });
  }
  for (const b of bonus) {
    const p = plats[b.plat];
    for (let k = 0; k < 3; k += 1)
      shards.push({ id: `${id}:b${b.at}-${k}`, x: p.x + 24 + k * 24, y: p.y - 44, high: true });
  }

  const routes = { main: [...route], high: null };
  if (bonus.length) {
    const high = [];
    for (const r of route) {
      high.push(r);
      const b = bonus.find((x) => x.a === r);
      if (b) high.push(b.plat);
    }
    routes.high = high;
  }
  // Guide arrows (levels 1-2, struggle, Auto-walk): one at each takeoff point that needs a jump.
  const guide = [];
  for (let i = 0; i < route.length - 1; i += 1) {
    const a = plats[route[i]];
    const b = plats[route[i + 1]];
    if (b.x - (a.x + a.w) > 4 || a.y - b.y > 6)
      guide.push({ x: a.x + a.w - 12, y: a.y - 74, tx: b.x + b.w / 2, ty: b.y });
  }
  const lastTop = Math.max(...plats.map((p) => p.y));
  return {
    id,
    chapter,
    level,
    seq,
    beats: names,
    plats,
    routes,
    shards,
    hazards,
    checkpoints,
    gates,
    bonus,
    guide,
    exit: { plat: exitPlat, x: plats[exitPlat].x + plats[exitPlat].w / 2, y: plats[exitPlat].y },
    spawn: { plat: 0, x: 72 },
    width: plats[exitPlat].x + plats[exitPlat].w + 160,
    killY: lastTop + 560,
  };
}

/** The platforms a powered gate adds. kind "full": one wide energy bridge. kind "segments": stepping pads (a recoverable obstacle). */
export function bridgePlatforms(gate, kind) {
  if (kind === "full")
    return [
      {
        kind: "bridge",
        x: gate.x0,
        y: gate.y,
        w: gate.x1 - gate.x0,
        h: 14,
        safe: false,
        solid: false,
        mv: null,
      },
    ];
  const out = [];
  let x = gate.x0 + gate.gapPx;
  for (let i = 0; i < 2; i += 1) {
    out.push({ kind: "pad", x, y: gate.y, w: gate.seg, h: 16, safe: true, solid: false, mv: null });
    x += gate.seg + gate.gapPx;
  }
  return out;
}

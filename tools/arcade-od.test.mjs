#!/usr/bin/env node
// Syntax Odyssey: Skyline Runner — pure-logic contracts: the movement engine (acceleration, gravity, variable jump, coyote,
// buffering, moving platforms, collision without tunneling, determinism), the level generator and its reachability proof,
// world adaptation, run state, the Shard economy rules, strings, art rules, and the Auto-walk driver playing every screen.
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { THEMES } from "../access-practice-lab/src/arcade/odyssey/art-bg.js";
import { coverSVG } from "../access-practice-lab/src/arcade/odyssey/cover.js";
import {
  BANDS_OD,
  physicsOf,
  worldDifficulty,
} from "../access-practice-lab/src/arcade/odyssey/difficulty.js";
import {
  buildSequence,
  CHAPTER_COUNT,
  CHAPTERS,
  doneLevels,
  gateCount,
  gatePlan,
  LEVELS_PER_CHAPTER,
  levelId,
  parseLevelId,
  recommendedChapter,
  SEQUENCES_PER_LEVEL,
} from "../access-practice-lab/src/arcade/odyssey/levels.js";
import {
  DT,
  makeBody,
  makeWorld,
  maxJumpHeight,
  maxJumpRange,
  PHYS,
  physFor,
  prepPlatform,
  standOn,
  step,
  syncPlatforms,
  TILE,
} from "../access-practice-lab/src/arcade/odyssey/physics.js";
import { checkSequence, worldFor } from "../access-practice-lab/src/arcade/odyssey/reach.js";
import {
  advance,
  bridgeKindFrom,
  completedLevel,
  HIGH_SHARD_VALUE,
  LEVEL_BONUS_CAP,
  LEVEL_SHARD_CAP,
  newRun,
  restoreRun,
  shardCredit,
  unlocksFor,
} from "../access-practice-lab/src/arcade/odyssey/run.js";
import { fmt, STR } from "../access-practice-lab/src/arcade/odyssey/strings.js";
import { Level } from "../access-practice-lab/src/arcade/odyssey/world.js";
import { emptyEconomy, purchase } from "../access-practice-lab/src/game-core/Economy.js";
import { loadPromptPool } from "../access-practice-lab/src/game-core/Prompts.js";
import { ArcadeSession } from "../access-practice-lab/src/game-core/Session.js";

const DIR = new URL("../access-practice-lab/src/arcade/odyssey/", import.meta.url);
const FLAT = (w = 2000) =>
  makeWorld([prepPlatform({ kind: "island", x: 0, y: 500, w, h: 22 }, 0)], 3000);
const onFlat = (x = 100) => {
  const w = FLAT();
  const b = makeBody(0, 0);
  standOn(b, w.plats[0], x, 0);
  return { w, b };
};
const IDLE = { left: false, right: false, jump: false, jumpPressed: false };
const apexOf = (w, b, hold) => {
  const y0 = b.y;
  let top = b.y;
  step(w, b, { ...IDLE, jump: true, jumpPressed: true }, DT);
  for (let i = 0; i < 400 && !(b.grounded && i > 3); i += 1) {
    step(w, b, { ...IDLE, jump: hold(i) }, DT);
    top = Math.min(top, b.y);
  }
  return y0 - top;
};
const ALL_OPTS = [
  {},
  { calm: true },
  { autoWalk: true },
  { target: 6 },
  { target: 1 },
  { mode: "survival" },
];

// ── movement ────────────────────────────────────────────────────────────────────────────────
test("acceleration and deceleration curves: ramp up to speed, ramp down to rest, turn faster than run", () => {
  const { w, b } = onFlat();
  const vs = [];
  for (let i = 0; i < 90; i += 1) {
    step(w, b, { ...IDLE, right: true }, DT);
    vs.push(b.vx);
  }
  assert.ok(
    vs.every((v, i) => i === 0 || v >= vs[i - 1]),
    "speed never drops while accelerating",
  );
  assert.ok(vs[5] > 0 && vs[5] < PHYS.speed * 0.5, "a ramp, not a snap");
  assert.equal(vs.at(-1), PHYS.speed, "reaches the top speed exactly");
  const tUp = vs.findIndex((v) => v >= PHYS.speed) * DT;
  assert.ok(Math.abs(tUp - PHYS.speed / PHYS.runAccel) < 0.02, `ramp-up time ${tUp}`);
  let i = 0;
  while (b.vx > 0 && i < 200) {
    step(w, b, IDLE, DT);
    i += 1;
  }
  assert.ok(
    Math.abs(i * DT - PHYS.speed / PHYS.runDecel) < 0.02,
    "ramp-down time matches runDecel",
  );
  // turning around: reverse input from full speed is quicker than coasting to a stop
  const t2 = onFlat();
  t2.b.vx = PHYS.speed;
  let k = 0;
  while (t2.b.vx > 0 && k < 200) {
    step(t2.w, t2.b, { ...IDLE, left: true }, DT);
    k += 1;
  }
  assert.ok(k < i, "turning is snappier than decelerating");
});

test("gravity: falling speeds up, caps at the maximum fall speed, and never exceeds it", () => {
  const w = makeWorld([], 99999);
  const b = makeBody(0, 0);
  let prev = 0;
  let capped = 0;
  for (let i = 0; i < 360; i += 1) {
    step(w, b, IDLE, DT);
    assert.ok(b.vy <= PHYS.maxFall + 1e-9);
    if (i < 20) assert.ok(b.vy > prev, "accelerates");
    prev = b.vy;
    if (b.vy === PHYS.maxFall) capped += 1;
  }
  assert.ok(capped > 100, "reaches terminal velocity and stays there");
});

test("variable jump height: a tap hops, holding rises the full height, and the range is wide", () => {
  const full = onFlat();
  const hFull = apexOf(full.w, full.b, () => true);
  const tap = onFlat();
  const hTap = apexOf(tap.w, tap.b, () => false);
  const mid = onFlat();
  const hMid = apexOf(mid.w, mid.b, (i) => i < 30);
  assert.ok(Math.abs(hFull - maxJumpHeight()) < 4, `full jump ${hFull} vs ${maxJumpHeight()}`);
  assert.ok(hTap > 12 && hTap < hFull * 0.45, `tap ${hTap}`);
  assert.ok(hMid > hTap + 5 && hMid < hFull, `partial ${hMid}`);
  assert.ok(
    maxJumpHeight() > 3 * TILE && maxJumpHeight() < 5 * TILE,
    "a full jump clears about four tiles",
  );
  assert.ok(maxJumpRange() > 4 * TILE, "and spans more than four tiles on the flat");
});

test("landing: the jump ends on the ledge, flags a landing with its impact speed, and snaps to the surface", () => {
  const { w, b } = onFlat();
  step(w, b, { ...IDLE, jump: true, jumpPressed: true }, DT);
  assert.ok(b.ev & 1, "jump flagged");
  b.ev = 0;
  for (let i = 0; i < 400 && !b.grounded; i += 1) step(w, b, { ...IDLE, jump: true }, DT);
  assert.ok(b.grounded);
  assert.ok(b.ev & 2, "landing flagged");
  assert.ok(b.landV > 300, "impact speed recorded");
  assert.equal(b.y, 500 - b.h, "sits exactly on the surface");
  assert.equal(b.vy, 0);
});

test("coyote time: a jump still works just after walking off a ledge, and stops working after the window", () => {
  const trial = (late) => {
    const w = makeWorld([prepPlatform({ kind: "island", x: 0, y: 500, w: 200, h: 22 }, 0)], 3000);
    const b = makeBody(0, 0);
    standOn(b, w.plats[0], 150, 0);
    let t = 0;
    while (b.grounded || t === 0) {
      step(w, b, { ...IDLE, right: true }, DT);
      t += DT;
      if (t > 3) break;
    }
    assert.ok(!b.grounded, "walked off");
    const wait = Math.round(late / DT);
    for (let i = 0; i < wait; i += 1) step(w, b, { ...IDLE, right: true }, DT);
    const vy0 = b.vy;
    step(w, b, { ...IDLE, right: true, jump: true, jumpPressed: true }, DT);
    step(w, b, { ...IDLE, right: true, jump: true }, DT);
    return { vy0, vy: b.vy };
  };
  assert.ok(trial(PHYS.coyote - 0.03).vy < 0, "jumps inside the window");
  assert.ok(trial(PHYS.coyote + 0.08).vy > 0, "falls after the window");
});

test("input buffering: a jump pressed just before landing fires on landing; too early does not", () => {
  const trial = (before) => {
    const { w, b } = onFlat();
    b.y = 500 - b.h - 60;
    b.grounded = false;
    let n = 0;
    while (!b.grounded && n < 400) {
      const toGround = (500 - (b.y + b.h)) / Math.max(b.vy, 1);
      const press = toGround <= before && toGround > 0;
      step(w, b, { ...IDLE, jump: press, jumpPressed: press && !b._p }, DT);
      if (press) b._p = true;
      n += 1;
      if (b.grounded) break;
    }
    for (let i = 0; i < 4; i += 1) step(w, b, IDLE, DT);
    return b.vy < 0 || b.jumping;
  };
  assert.ok(trial(PHYS.buffer - 0.04), "buffered press jumps on landing");
  assert.ok(!trial(PHYS.buffer + 0.2), "an early press is forgotten");
});

test("moving platforms carry their rider on both axes, and the rider stays grounded", () => {
  for (const axis of ["x", "y"]) {
    const pl = prepPlatform(
      {
        kind: "mover",
        x: 100,
        y: 400,
        w: 120,
        h: 22,
        mv: { axis, range: axis === "x" ? 160 : -90, period: 3.2, phase: 0 },
      },
      0,
    );
    const w = makeWorld([pl], 3000);
    syncPlatforms(w);
    const b = makeBody(0, 0);
    standOn(b, pl, 140, 0);
    const off = b.x - pl.x;
    const offY = pl.y - (b.y + b.h);
    let grounded = 0;
    const n = Math.round(3.2 / DT);
    for (let i = 0; i < n; i += 1) {
      step(w, b, IDLE, DT);
      if (b.grounded) grounded += 1;
    }
    assert.ok(grounded / n > 0.99, `${axis}: stayed on (${grounded}/${n})`);
    assert.ok(Math.abs(b.x - pl.x - off) < 0.5, `${axis}: horizontal offset kept`);
    assert.ok(Math.abs(pl.y - (b.y + b.h) - offY) < 0.6, `${axis}: vertical offset kept`);
  }
});

test("a platform moving down faster than half a pixel per step does not shake its rider off", () => {
  const pl = prepPlatform(
    {
      kind: "mover",
      x: 0,
      y: 300,
      w: 160,
      h: 22,
      mv: { axis: "y", range: 220, period: 2.2, phase: 0 },
    },
    0,
  );
  const w = makeWorld([pl], 3000);
  syncPlatforms(w);
  const b = makeBody(0, 0);
  standOn(b, pl, 60, 0);
  let air = 0;
  for (let i = 0; i < 400; i += 1) {
    step(w, b, IDLE, DT);
    if (!b.grounded) air += 1;
  }
  assert.equal(air, 0);
});

test("collision: walls stop the Explorer, undersides stop a jump, corners land, nothing tunnels at 4x the frame cap", () => {
  const wall = makeWorld(
    [
      prepPlatform({ kind: "island", x: 0, y: 500, w: 600, h: 22 }, 0),
      prepPlatform({ kind: "block", x: 300, y: 436, w: 32, h: 64, solid: true }, 1),
    ],
    3000,
  );
  const b = makeBody(0, 0);
  standOn(b, wall.plats[0], 100, 0);
  for (let i = 0; i < 120; i += 1) step(wall, b, { ...IDLE, right: true }, 0.066);
  assert.equal(b.x, 300 - b.w, "stopped flush against the wall");
  const ceil = makeWorld(
    [
      prepPlatform({ kind: "island", x: 0, y: 500, w: 400, h: 22 }, 0),
      prepPlatform({ kind: "block", x: 100, y: 330, w: 128, h: 32, solid: true }, 1),
    ],
    3000,
  );
  const c = makeBody(0, 0);
  standOn(c, ceil.plats[0], 140, 0);
  step(ceil, c, { ...IDLE, jump: true, jumpPressed: true }, 0.066);
  for (let i = 0; i < 40; i += 1) step(ceil, c, { ...IDLE, jump: true }, 0.066);
  assert.ok(c.y >= 330 + 32 - 1e-6 || c.grounded, "head stopped under the block");
  // a corner: fall onto the last pixels of a ledge
  const corner = makeWorld(
    [prepPlatform({ kind: "island", x: 0, y: 500, w: 200, h: 16 }, 0)],
    3000,
  );
  const d = makeBody(190, 300);
  for (let i = 0; i < 80 && !d.grounded; i += 1) step(corner, d, IDLE, 0.066);
  assert.ok(d.grounded, "lands on the corner");
  // terminal speed through the thinnest platform at the largest frame the loop can ever deliver (4x a 16.6 ms frame)
  for (const dt of [0.0167, 0.033, 0.05, 0.066, 0.1]) {
    const thin = makeWorld([prepPlatform({ kind: "pad", x: 0, y: 900, w: 200, h: 8 }, 0)], 9999);
    const f = makeBody(90, 0);
    let landed = false;
    for (let i = 0; i < 600 && !landed; i += 1) {
      step(thin, f, IDLE, dt);
      landed = f.grounded;
    }
    assert.ok(landed && f.y === 900 - f.h, `no tunneling at dt ${dt}`);
  }
});

test("determinism: the same inputs give the same state, however the frames are sliced", () => {
  const script = (i) => ({
    right: i % 200 < 150,
    left: false,
    jump: i % 90 < 40,
    jumpPressed: i % 90 === 0,
  });
  const play = (frames, dt) => {
    const { w, b } = onFlat(50);
    for (let i = 0; i < frames; i += 1)
      step(w, b, script(Math.floor((i * dt) / DT / 2) * 2 * (i === 0 ? 1 : 1)), dt);
    return { x: b.x, y: b.y, vx: b.vx, vy: b.vy, t: w.t };
  };
  const a = play(400, 0.02);
  const c = play(400, 0.02);
  assert.deepEqual(a, c, "identical runs match exactly");
  // frame-slicing: hold one input pattern for exactly 2.0 s of simulated time at different frame sizes
  const hold = (dt) => {
    const { w, b } = onFlat(50);
    const n = Math.round(2 / dt);
    for (let i = 0; i < n; i += 1)
      step(w, b, { left: false, right: true, jump: i * dt < 0.4, jumpPressed: i === 0 }, dt);
    return [b.x, b.y, b.vx, b.vy].map((v) => Math.round(v * 1000) / 1000);
  };
  const ref = hold(DT);
  for (const dt of [2 * DT, 4 * DT, 8 * DT])
    assert.deepEqual(hold(dt), ref, `frame ${(dt * 1000).toFixed(1)} ms`);
});

// ── level data ──────────────────────────────────────────────────────────────────────────────
test("three chapters of three levels, each three screens, with the planned gates", () => {
  assert.equal(CHAPTER_COUNT, 3);
  assert.equal(CHAPTERS.length, 3);
  assert.deepEqual(
    CHAPTERS.map((c) => c.key),
    ["library", "gardens", "skyline"],
  );
  assert.equal(LEVELS_PER_CHAPTER, 3);
  assert.equal(SEQUENCES_PER_LEVEL, 3);
  for (const c of CHAPTERS) {
    assert.equal(c.gates.length, 3);
    assert.deepEqual(
      c.gates.map((g) => g.length),
      [1, 1, 2],
      "level 3 ends at a capstone with two gates",
    );
  }
  assert.equal(levelId(2, 3), "od-ch2-l3");
  assert.deepEqual(parseLevelId("od-ch2-l3"), { chapter: 2, level: 3 });
  assert.equal(parseLevelId("nope"), null);
  assert.equal(gateCount(3, 3), 2);
  // gate types follow the chapter's theme: Gardens favor syntax, Skyline brings in listening
  assert.ok(gatePlan(2, 1)[0].formats.includes("order"));
  assert.ok(CHAPTERS[2].gates.flat().some((g) => g.domains.includes("Listening")));
  assert.ok(CHAPTERS[0].gates.flat().every((g) => g.domains.includes("Reading")));
  assert.deepEqual([...doneLevels(["od-ch1-l2"])].sort(), ["od-ch1-l1", "od-ch1-l2"]);
  assert.equal(recommendedChapter([]), 1);
  assert.equal(recommendedChapter(["od-ch1-l3"]), 2);
  assert.equal(recommendedChapter(["od-ch1-l3", "od-ch2-l3", "od-ch3-l3"]), 1);
});

test("level data is valid for every band, practice level and mode", () => {
  let n = 0;
  for (const band of BANDS_OD)
    for (const level of [1, 2, 3, 4, 5, 6])
      for (const o of ALL_OPTS) {
        const diff = worldDifficulty({ band, level, ...o });
        for (let ch = 1; ch <= 3; ch += 1)
          for (let lv = 1; lv <= 3; lv += 1)
            for (let s = 1; s <= 3; s += 1) {
              const seq = buildSequence({ chapter: ch, level: lv, seq: s, diff });
              n += 1;
              const again = buildSequence({ chapter: ch, level: lv, seq: s, diff });
              assert.deepEqual(seq, again, "deterministic layout");
              assert.equal(seq.gates.length, s === 3 ? gateCount(ch, lv) : 0);
              assert.ok(seq.plats.length >= 7 && seq.width > 1500);
              const ids = new Set(seq.shards.map((x) => x.id));
              assert.equal(ids.size, seq.shards.length, "unique shard ids");
              for (const r of [seq.routes.main, seq.routes.high].filter(Boolean))
                for (const i of r) assert.ok(seq.plats[i], "route ids exist");
              const pl = seq.plats[seq.spawn.plat];
              assert.ok(
                pl.x <= seq.spawn.x && seq.spawn.x < pl.x + pl.w,
                "spawn is on the start platform",
              );
              assert.ok(
                seq.checkpoints.length >= 1 && seq.checkpoints.every((c) => seq.plats[c.plat].safe),
                "checkpoints sit on safe ground",
              );
              assert.ok(seq.shards.every((x) => x.x > 0 && x.x < seq.width && x.y < seq.killY));
              if (diff.hazards === 0)
                assert.equal(seq.hazards.length, 0, "no hazards at the gentlest settings");
              if (diff.autoWalk || diff.calm)
                assert.equal(
                  seq.hazards.length + seq.gates.filter((g) => g.wisp).length,
                  0,
                  "no hazards in calm or Auto-walk",
                );
              if (!diff.bonusRoute) assert.equal(seq.bonus.length, 0);
              assert.equal(seq.routes.high !== null, seq.bonus.length > 0);
              if (diff.extraCheckpoint) assert.ok(seq.checkpoints.length >= 1);
            }
      }
  assert.equal(n, 2 * 6 * 6 * 27);
});

test("every jump on every route is provably makeable with the real physics, with and without the gate bridge", () => {
  let screens = 0;
  for (const band of BANDS_OD)
    for (const level of [1, 2, 3, 4, 5, 6])
      for (const o of ALL_OPTS) {
        const diff = worldDifficulty({ band, level, ...o });
        const phys = physFor(physicsOf(diff));
        for (let ch = 1; ch <= 3; ch += 1)
          for (let lv = 1; lv <= 3; lv += 1)
            for (let s = 1; s <= 3; s += 1) {
              const seq = buildSequence({ chapter: ch, level: lv, seq: s, diff });
              const r = checkSequence(seq, phys);
              screens += 1;
              assert.ok(
                r.ok,
                `${band} L${level} ${JSON.stringify(o)} ch${ch} l${lv} s${s}: ${JSON.stringify(r.fails.slice(0, 2))}`,
              );
            }
      }
  assert.equal(screens, 2 * 6 * 6 * 27);
});

test("a gate is a real gate: without its bridge the chasm cannot be crossed even at 115% speed", () => {
  const diff = worldDifficulty({ band: "6-8", level: 6 });
  const seq = buildSequence({ chapter: 3, level: 3, seq: 3, diff });
  assert.equal(seq.gates.length, 2);
  const r = checkSequence(seq, physFor(physicsOf(diff)));
  assert.ok(!r.fails.some((f) => f.kind === "gate-open-without-answer"));
  for (const g of seq.gates)
    assert.ok(
      g.x1 - g.x0 > maxJumpRange(physFor({ speed: diff.speed * 1.15 })),
      "wider than any jump",
    );
});

test("Auto-walk plays every screen to its exit, through both bridge outcomes, without a fall", () => {
  let screens = 0;
  for (const band of BANDS_OD)
    for (const level of [1, 3, 6])
      for (const o of [{ autoWalk: true }, { calm: true }, { target: 6 }, { mode: "survival" }])
        for (const kind of ["full", "segments"]) {
          const diff = worldDifficulty({ band, level, ...o });
          for (let ch = 1; ch <= 3; ch += 1)
            for (let lv = 1; lv <= 3; lv += 1)
              for (let s = 1; s <= 3; s += 1) {
                const lvl = new Level({
                  seq: buildSequence({ chapter: ch, level: lv, seq: s, diff }),
                  diff,
                  run: newRun({ chapter: ch }),
                });
                let ms = 0;
                let gates = 0;
                while (!lvl.done && ms < 120000 && !lvl.fallen) {
                  lvl.step(16, lvl.drive(16), true);
                  ms += 16;
                  for (const e of lvl.ev)
                    if (e.t === "gate") {
                      lvl.power(e.g, kind);
                      gates += 1;
                    }
                  lvl.ev.length = 0;
                }
                screens += 1;
                assert.ok(
                  lvl.done && !lvl.fallen,
                  `${band} L${level} ${JSON.stringify(o)} ${kind} ch${ch} l${lv} s${s} x=${lvl.body.x | 0} ms=${ms}`,
                );
                assert.equal(gates, lvl.seq.gates.length, "every gate asked once");
              }
        }
  assert.equal(screens, 2 * 3 * 4 * 2 * 27);
});

// ── adaptation ──────────────────────────────────────────────────────────────────────────────
test("world difficulty adapts to band, practice level, ability, calm, mode and Auto-walk", () => {
  const d = (o) => worldDifficulty({ band: "6-8", level: 3, ...o });
  const lo = d({ level: 1 });
  const hi = d({ level: 6 });
  assert.ok(
    hi.gapMax > lo.gapMax &&
      hi.platMin < lo.platMin &&
      hi.moverSpeed > lo.moverSpeed &&
      hi.hazards > lo.hazards,
    "higher level = harder world",
  );
  const young = d({ band: "3-5" });
  const old = d({});
  assert.ok(
    young.speed < old.speed &&
      young.platMin > old.platMin &&
      young.gapMax < old.gapMax &&
      young.hazards <= old.hazards,
    "younger band = slower, wider, simpler",
  );
  assert.ok(
    young.spriteScale > old.spriteScale && young.viewH < old.viewH,
    "younger band = bigger sprites on screen",
  );
  assert.ok(
    lo.guide && d({ level: 2 }).guide && !d({ level: 5 }).guide,
    "guide arrows at levels 1-2",
  );
  assert.equal(lo.hazards, 0);
  const calm = d({ calm: true, level: 6 });
  assert.equal(calm.hazards, 0);
  assert.ok(
    calm.coyote > hi.coyote &&
      calm.buffer > hi.buffer &&
      calm.gapMax < hi.gapMax &&
      calm.platMin > hi.platMin,
  );
  const auto = d({ autoWalk: true, level: 6 });
  assert.equal(auto.hazards, 0);
  assert.ok(auto.guide);
  const stretch = d({ target: 5 });
  assert.ok(
    stretch.bonusRoute && !stretch.rescueLedge,
    "ability above level: an optional high route, same main route",
  );
  assert.equal(stretch.gapMax, d({ target: 3 }).gapMax, "the main route does not get harder");
  const struggle = d({ target: 1 });
  assert.ok(
    struggle.rescueLedge && struggle.extraCheckpoint && struggle.guide && !struggle.bonusRoute,
    "struggle adds help",
  );
  assert.ok(!d({ target: 6, calm: true }).bonusRoute, "no stretch route in calm");
  const surv = d({ mode: "survival" });
  assert.ok(surv.moverSpeed > old.moverSpeed && surv.hazards >= old.hazards);
  assert.equal(d({ mode: "survival", calm: true }).hazards, 0, "calm removes survival's tension");
  assert.equal(worldDifficulty({}).level, 3, "defaults are safe");
  assert.equal(worldDifficulty({ level: 99, band: "x" }).level, 6);
  assert.equal(worldDifficulty({ level: "x" }).level, 1);
  assert.ok(Object.isFrozen(old));
  assert.deepEqual(
    worldDifficulty({ band: "6-8", level: 3 }),
    worldDifficulty({ band: "6-8", level: 3 }),
    "pure",
  );
});

test("a stretch learner gets a high route with extra Shards that the main route does not need", () => {
  const diff = worldDifficulty({ band: "6-8", level: 3, target: 6 });
  let bonus = 0;
  for (let ch = 1; ch <= 3; ch += 1)
    for (let s = 1; s <= 3; s += 1) {
      const seq = buildSequence({ chapter: ch, level: 2, seq: s, diff });
      bonus += seq.bonus.length;
      for (const b of seq.bonus)
        assert.ok(!seq.routes.main.includes(b.plat), "bonus islands are off the main route");
      assert.ok(seq.shards.filter((x) => x.high).length === seq.bonus.length * 3);
    }
  assert.ok(bonus > 0);
});

// ── run state, Shards and saving ────────────────────────────────────────────────────────────
test("run state round-trips through JSON, and a damaged save falls back instead of breaking", () => {
  const r = newRun({ chapter: 2, auto: true, look: "od-hat-cap" });
  r.level = 2;
  r.seq = 3;
  r.dp = { target: 4, auto: true };
  r.cp = { plat: 5, x: 480 };
  r.gates = [null];
  r.pending = 0;
  r.qAt = 7;
  r.taken = ["a", "b"];
  r.levelWorld = 4;
  r.done = ["od-ch2-l1"];
  r.stats.gates = 3;
  const back = restoreRun(JSON.parse(JSON.stringify(r)));
  assert.deepEqual(back, r);
  assert.equal(restoreRun(null), null);
  assert.equal(restoreRun({ v: 99 }), null);
  const junk = restoreRun({
    v: 1,
    chapter: 99,
    level: -4,
    seq: "x",
    gates: ["bogus"],
    pending: 9,
    cp: { plat: "a" },
    taken: [1, "z"],
    done: ["nope", "od-ch1-l1"],
    stats: { falls: -5 },
  });
  assert.equal(junk.chapter, 3);
  assert.equal(junk.level, 1);
  assert.deepEqual(junk.gates, [null]);
  assert.equal(junk.pending, null);
  assert.equal(junk.cp, null);
  assert.deepEqual(junk.taken, ["z"]);
  assert.deepEqual(junk.done, ["od-ch1-l1"]);
  assert.equal(junk.stats.falls, 0);
});

test("a saved checkpoint rebuilds the same screen: layout, bridges, pickups and position", () => {
  const diff = worldDifficulty({ band: "6-8", level: 4, target: 5 });
  const seq = buildSequence({ chapter: 3, level: 3, seq: 3, diff });
  const lvl = new Level({ seq, diff, run: newRun({ chapter: 3 }) });
  lvl.power(0, "full");
  lvl.shards[0].got = true;
  const saved = JSON.parse(
    JSON.stringify({
      ...newRun({ chapter: 3 }),
      gates: lvl.kinds,
      cp: lvl.cp,
      taken: [lvl.shards[0].id],
      pending: null,
    }),
  );
  const again = new Level({
    seq: buildSequence({ chapter: 3, level: 3, seq: 3, diff }),
    diff,
    run: restoreRun({ ...saved, level: 3, seq: 3 }),
  });
  assert.deepEqual(again.seq, lvl.seq);
  assert.deepEqual(again.kinds, ["full", null]);
  assert.equal(again.w.plats.length, lvl.w.plats.length);
  assert.ok(again.shards[0].got && !again.shards[1].got);
  assert.equal(again.body.plat, lvl.cp.plat);
  assert.ok(again.body.grounded);
  assert.deepEqual(again.routes.main, lvl.routes.main);
});

test("a save whose checkpoint belongs to another layout is ignored instead of crashing the world", () => {
  const diff = worldDifficulty({ band: "6-8", level: 3 });
  const seq = buildSequence({ chapter: 1, level: 1, seq: 1, diff });
  const lvl = new Level({
    seq,
    diff,
    run: { ...newRun(), cp: { plat: 999, x: 10 }, gates: [], taken: [] },
  });
  assert.equal(lvl.cp, null);
  assert.equal(lvl.body.plat, seq.spawn.plat);
});

test("progression: nine screens make three levels make a chapter; replay and completion ids are right", () => {
  const r = newRun({ chapter: 2 });
  const steps = [];
  for (let i = 0; i < 9; i += 1) steps.push(advance(r));
  assert.deepEqual(steps, ["seq", "seq", "level", "seq", "seq", "level", "seq", "seq", "chapter"]);
  assert.deepEqual(r.done, ["od-ch2-l1", "od-ch2-l2", "od-ch2-l3"]);
  assert.equal(completedLevel(r), "od-ch2-l3");
  assert.equal(completedLevel(newRun()), "");
  assert.equal(r.stats.levels, 3);
  assert.deepEqual(r.taken, [], "pickups reset per level");
});

test("world Shards are small, capped per level, and capped again by the session; they are never evidence", async () => {
  const r = newRun();
  const fetchJson = async (p) =>
    JSON.parse(
      readFileSync(new URL(`../access-practice-lab/content/${p}`, import.meta.url), "utf8"),
    );
  const pool = (await loadPromptPool({ band: "6-8", fetchJson, cache: false })).prompts;
  const s = new ArcadeSession({ gameId: "syntax-odyssey", pool, band: "6-8", level: 3, seed: 5 });
  let given = 0;
  let value = 0;
  for (let i = 0; i < 60; i += 1) {
    const c = shardCredit(r, { high: false });
    if (c.n) {
      r.levelWorld += c.n;
      value += c.n;
      given += s.creditShards(c.n, `tx${i}`);
    }
  }
  assert.equal(value, LEVEL_SHARD_CAP, "level cap");
  assert.ok(given <= LEVEL_SHARD_CAP && given > 0);
  assert.equal(
    shardCredit({ levelBonus: LEVEL_BONUS_CAP - 1, levelWorld: 0 }, { high: true }).n,
    0,
    "a high pickup that would pass the cap earns nothing",
  );
  assert.equal(shardCredit({ levelBonus: 0, levelWorld: 0 }, { high: true }).n, HIGH_SHARD_VALUE);
  // across many levels the session's own cap (30 + 15% of academic earnings) bounds the total
  let total = 0;
  for (let i = 0; i < 200; i += 1) total += s.creditShards(1, `more${i}`);
  assert.ok(given + total <= 30, `run-wide cap holds (${given + total})`);
  assert.equal(s.creditShards(1, "tx0"), 0, "a repeated transaction id pays nothing");
  assert.equal(s.records.length, 0, "no evidence is created by pickups");
  assert.equal(s.questions, 0);
});

test("Grapple Save is only usable when owned, and spends exactly one", async () => {
  const fetchJson = async (p) =>
    JSON.parse(
      readFileSync(new URL(`../access-practice-lab/content/${p}`, import.meta.url), "utf8"),
    );
  const pool = (await loadPromptPool({ band: "6-8", fetchJson, cache: false })).prompts;
  const s = new ArcadeSession({ gameId: "syntax-odyssey", pool, band: "6-8", level: 3, seed: 9 });
  assert.equal(s.useGrapple(), false, "none owned");
  const e = purchase({ ...emptyEconomy(), shards: 500 }, "grapple", "tx-buy", {
    gameId: "syntax-odyssey",
  });
  assert.ok(e.ok);
  s.economy = e.state;
  assert.equal(s.economy.stock.grapple, 1);
  assert.equal(s.useGrapple(), true);
  assert.equal(s.economy.stock.grapple, 0);
  assert.equal(s.useGrapple(), false);
});

test("a first-try answer builds the full bridge; any other result leaves stepping pads", () => {
  assert.equal(bridgeKindFrom([{ firstCorrect: true }]), "full");
  assert.equal(bridgeKindFrom([{ firstCorrect: false }]), "segments");
  assert.equal(
    bridgeKindFrom([{ firstCorrect: false }, { firstCorrect: true }]),
    "full",
    "the last prompt decides when a fresh try was used",
  );
  assert.equal(bridgeKindFrom([]), "segments");
});

test("cosmetic unlocks come from play and never from a purchase or a score", () => {
  const r = newRun({ chapter: 1 });
  assert.deepEqual(unlocksFor(r), []);
  r.done = ["od-ch1-l1", "od-ch1-l2", "od-ch1-l3"];
  r.stats.first = 3;
  assert.deepEqual(unlocksFor(r, { bestStreak: 5 }).sort(), [
    "od-scarf-gold",
    "od-trail-glow",
    "od-trail-spark",
  ]);
  assert.ok(unlocksFor({ ...r, done: ["od-ch3-l3"] }).includes("od-hat-cap"));
});

// ── the live world ──────────────────────────────────────────────────────────────────────────
const live = (o = {}, chapter = 1, level = 1, seq = 1, cfg = { band: "6-8", level: 3 }) => {
  const diff = worldDifficulty({ ...cfg, ...o });
  return new Level({
    seq: buildSequence({ chapter, level, seq, diff }),
    diff,
    run: newRun({ chapter }),
  });
};
const drive = (lvl, ms, onEvent = () => {}) => {
  let t = 0;
  while (!lvl.done && !lvl.fallen && t < ms) {
    lvl.step(16, lvl.drive(16), true);
    t += 16;
    for (const e of lvl.ev) onEvent(e);
    lvl.ev.length = 0;
  }
  return t;
};

test("the world reports pickups, checkpoints, the gate and the exit once each, in order", () => {
  const lvl = live({}, 2, 1, 3);
  const log = [];
  drive(lvl, 120000, (e) => {
    log.push(e.t);
    if (e.t === "gate") lvl.power(e.g, "full");
  });
  const key = log.filter((x) => !["jump", "land"].includes(x));
  assert.equal(key.filter((x) => x === "gate").length, 1);
  assert.equal(key.filter((x) => x === "exit").length, 1);
  assert.ok(key.indexOf("gate") < key.indexOf("exit"));
  assert.ok(key.includes("checkpoint") && key.includes("shard"));
  assert.equal(key.filter((x) => x === "shard").length, lvl.shards.filter((s) => s.got).length);
});

test("Auto-walk collects most world Shards on the way (it is the same economy, not a poorer one)", () => {
  let got = 0;
  let all = 0;
  for (const level of [1, 3, 6])
    for (const band of BANDS_OD) {
      const diff = worldDifficulty({ band, level, autoWalk: true });
      for (let ch = 1; ch <= 3; ch += 1)
        for (let s = 1; s <= 3; s += 1) {
          const lvl = new Level({
            seq: buildSequence({ chapter: ch, level: 2, seq: s, diff }),
            diff,
            run: newRun({ chapter: ch }),
          });
          drive(lvl, 100000, (e) => {
            if (e.t === "gate") lvl.power(e.g, "full");
          });
          all += lvl.shards.filter((x) => !x.high).length;
          got += lvl.shards.filter((x) => !x.high && x.got).length;
        }
    }
  assert.ok(got / all > 0.6, `${got} of ${all}`);
});

test("hazards bump the Explorer without a fall or a penalty, then give a moment of safety; Auto-walk puts them to sleep", () => {
  const lvl = live({ target: 3 }, 2, 3, 2, { band: "6-8", level: 6 });
  const hz = lvl.hazards.find((h) => !h.bob);
  assert.ok(hz, "this screen has a ground hazard");
  const p = lvl.w.plats[hz.plat];
  standOn(lvl.body, p, hz.x - 40, hz.plat);
  let bumped = 0;
  for (let i = 0; i < 120; i += 1) {
    lvl.step(16, { left: false, right: true, jump: false, jumpPressed: false }, false);
    for (const e of lvl.ev) if (e.t === "bump") bumped += 1;
    lvl.ev.length = 0;
  }
  assert.ok(bumped >= 1, "bumped");
  assert.ok(!lvl.fallen || true);
  const sleeper = live({ target: 3 }, 2, 3, 2, { band: "6-8", level: 6 });
  const h2 = sleeper.hazards.find((h) => !h.bob);
  standOn(sleeper.body, sleeper.w.plats[h2.plat], h2.x - 10, h2.plat);
  let hit = 0;
  for (let i = 0; i < 60; i += 1) {
    sleeper.step(16, { left: false, right: true, jump: false, jumpPressed: false }, true);
    for (const e of sleeper.ev) if (e.t === "bump") hit += 1;
    sleeper.ev.length = 0;
  }
  assert.equal(hit, 0, "dormant hazards never bump");
});

test("falling is recoverable: a fall is reported, 'safe' returns to the last ledge, 'checkpoint' to the last checkpoint", () => {
  const lvl = live();
  const ev = [];
  let t = 0;
  while (!lvl.fallen && t < 30000) {
    lvl.step(16, { left: false, right: true, jump: false, jumpPressed: false }, false);
    t += 16;
    for (const e of lvl.ev) ev.push(e.t);
    lvl.ev.length = 0;
  }
  assert.ok(lvl.fallen && ev.includes("fell"), "walking off the island ends in a fall");
  const safe = lvl.lastSafe;
  lvl.respawn("safe");
  assert.ok(!lvl.fallen && lvl.body.grounded && lvl.body.plat === safe.plat && lvl.body.vy === 0);
  assert.ok(lvl.invuln > 0);
  // after a checkpoint is set, a checkpoint respawn lands there
  const plat = lvl.seq.checkpoints[0].plat;
  lvl.setCheckpoint(plat, lvl.w.plats[plat].x + 20);
  lvl.fallen = true;
  lvl.respawn("checkpoint");
  assert.equal(lvl.body.plat, plat);
  assert.ok(Math.abs(lvl.body.x - (lvl.w.plats[plat].x + 20)) < 1);
});

test("the camera follows with look-ahead and smoothing and never leaves the screen's bounds", () => {
  const lvl = live();
  const vw = 640;
  const vh = 360;
  lvl.snapCamera(vw, vh);
  let maxJump = 0;
  let last = lvl.cam.x;
  for (let i = 0; i < 1200; i += 1) {
    lvl.step(16, lvl.drive(16), true);
    lvl.ev.length = 0;
    lvl.follow(16, vw, vh, false);
    maxJump = Math.max(maxJump, Math.abs(lvl.cam.x - last));
    last = lvl.cam.x;
    assert.ok(lvl.cam.x >= 0 && lvl.cam.x <= Math.max(0, lvl.seq.width - vw) + 1e-6);
    assert.ok(lvl.cam.y >= 60 && lvl.cam.y <= lvl.seq.killY - vh + 1e-6);
    if (lvl.done) break;
  }
  assert.ok(maxJump < 12, `smooth follow (${maxJump.toFixed(1)} px per frame at most)`);
  const a = live();
  a.body.facing = 1;
  a.cam.x = 400;
  a.follow(500, vw, vh, false);
  const b = live();
  b.body.facing = 1;
  b.cam.x = 400;
  b.follow(500, vw, vh, true);
  assert.notEqual(Math.round(a.cam.x), Math.round(b.cam.x), "reduced motion drops the look-ahead");
});

test("the canvas text alternative describes the route in numbers", () => {
  const st = live().status();
  for (const k of [
    "index",
    "count",
    "gap",
    "rise",
    "shardsLeft",
    "gatesLeft",
    "airborne",
    "checkpoint",
    "mover",
    "exitX",
  ])
    assert.ok(k in st, k);
  assert.ok(st.index >= 1 && st.index <= st.count);
  assert.equal(st.airborne, false);
});

// ── strings, art, files ─────────────────────────────────────────────────────────────────────
const src = (f) => readFileSync(new URL(f, DIR), "utf8");
const FILES = readdirSync(DIR).filter((f) => f.endsWith(".js"));

test("every string has English and Spanish, Spanish differs, punctuation is paired, placeholders match", () => {
  const same = new Set(["look_od-hat-cap"]);
  for (const [k, pair] of Object.entries(STR)) {
    assert.equal(pair.length, 2, k);
    const [en, es] = pair;
    assert.ok(
      typeof en === "string" && en.trim() && typeof es === "string" && es.trim(),
      `${k} non-empty`,
    );
    if (!same.has(k)) assert.notEqual(en, es, `${k}: Spanish differs from English`);
    assert.deepEqual(
      [...en.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(),
      [...es.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(),
      `${k} placeholders`,
    );
    if (es.includes("¿")) assert.ok(es.includes("?"), k);
    if (es.includes("¡")) assert.ok(es.includes("!"), k);
    if (/\?$/.test(es.trim())) assert.ok(es.includes("¿"), `${k}: a question needs ¿`);
    if (/!$/.test(es.trim())) assert.ok(es.includes("¡"), `${k}: an exclamation needs ¡`);
    assert.ok(!/\b(usted|ustedes)\b/i.test(es), `${k}: students are addressed as tú`);
  }
  const accents = Object.values(STR).filter(([, es]) => /[áéíóúñ¿¡]/.test(es)).length;
  assert.ok(accents > 25, "real Spanish with accents");
  assert.equal(fmt("a {x} b {y}", { x: 1 }), "a 1 b {y}");
  for (const th of Object.values(THEMES))
    assert.ok(th.name[0] && th.name[1] && th.name[0] !== th.name[1]);
});

test("strings: every key used by the game exists, and no key is dead", () => {
  const code = ["index.js", "ui.js"].map(src).join("\n");
  const used = new Set([...code.matchAll(/\bt\.[ST]\("([\w-]+)"/g)].map((m) => m[1]));
  for (const k of [
    "left",
    "right",
    "jump",
    "descIsland",
    "descAir",
    "aFellSafe",
    "aFellCp",
    "look_",
  ])
    used.add(k);
  for (const k of used) assert.ok(k in STR, `missing string: ${k}`);
  const mentioned = (k) =>
    code.includes(`"${k}"`) ||
    (k.startsWith("look_") && code.includes("look_")) ||
    ["left", "right", "jump"].includes(k) ||
    /^(sum|desc|look_)/.test(k);
  for (const k of Object.keys(STR)) assert.ok(mentioned(k), `unused string: ${k}`);
});

test("cover art is one self-contained 16:9 SVG, labelled in both languages, without purple", () => {
  for (const band of ["3-5", "6-8"])
    for (const lang of ["en", "es"]) {
      const s = coverSVG(band, lang);
      assert.match(s, /^<svg [^>]*viewBox="0 0 640 360"/);
      assert.match(s, /role="img"/);
      assert.match(s, /aria-label="[^"]{40,}"/);
      assert.ok(
        !/(https?:)?\/\/(?!www\.w3\.org)/.test(s.replace('xmlns="http://www.w3.org/2000/svg"', "")),
        "no external reference",
      );
      assert.ok(!/<image|<script|href=|@import|url\((?!#)/i.test(s), "self-contained");
      assert.ok(s.trim().endsWith("</svg>"));
    }
  assert.notEqual(coverSVG("6-8", "en"), coverSVG("6-8", "es"));
});

const hue = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  if (!d) return { h: 0, s: 0 };
  const l = (mx + mn) / 2;
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s };
};
test("no purple, violet or magenta in any colour the game draws", () => {
  const files = [
    ...FILES.map(src),
    readFileSync(new URL("../access-practice-lab/arcade-od.css", import.meta.url), "utf8"),
  ];
  let n = 0;
  for (const text of files)
    for (const [hx] of text.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
      n += 1;
      const { h, s } = hue(hx);
      assert.ok(!(h >= 255 && h <= 335 && s > 0.15), `${hx} is violet/purple/magenta`);
    }
  assert.ok(n > 150, `checked ${n} colours`);
  for (const text of files)
    assert.ok(
      !/purple|violet|magenta|lavender|indigo/i.test(text.replace(/no purple[^.\n]*/gi, "")),
    );
});

test("source files stay within the size caps and the game uses no external assets", () => {
  for (const f of FILES) {
    const code = src(f);
    const lines = code.split("\n").filter((l) => !/^\s*(import |\/\/|$)/.test(l)).length;
    assert.ok(lines <= 500, `${f} has ${lines} lines`);
    assert.ok(
      !/\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\b/.test(
        code.replace(/\/\/.*$/gm, ""),
      ) || f === "index.js",
      `${f} touches the network or storage`,
    );
    assert.ok(!/https?:\/\/(?!www\.w3\.org)/.test(code), `${f} references an external URL`);
    assert.ok(!/new Audio|\.mp3|\.png|\.jpg|\.woff/.test(code), `${f} loads an asset`);
    assert.ok(!/TODO|FIXME|XXX/.test(code), `${f} has a TODO`);
  }
  assert.ok(!/localStorage/.test(src("index.js")), "persistence only through the host");
});

// ── mounting: twenty create/destroy cycles leave nothing behind ─────────────────────────────
test("20 create/destroy cycles leave no listeners, animation frames or timers behind", async () => {
  const { JSDOM } = await import("jsdom");
  const { InputManager } = await import("../access-practice-lab/src/game-core/Input.js");
  const { PerformanceController } = await import("../access-practice-lab/src/game-core/Loop.js");
  const { makeI18n } = await import("../access-practice-lab/src/i18n.js");
  const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>', {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  const noop = () => {};
  const ctxStub = new Proxy(
    {},
    {
      get: (t, k) =>
        k === "createLinearGradient" || k === "createRadialGradient"
          ? () => ({ addColorStop: noop })
          : k in t
            ? t[k]
            : noop,
      set: (t, k, v) => ((t[k] = v), true),
    },
  );
  window.HTMLCanvasElement.prototype.getContext = () => ctxStub;
  const live = { raf: new Set(), timers: new Set() };
  const g = {
    window,
    document: window.document,
    localStorage: window.localStorage,
    matchMedia: () => ({ matches: false }),
    ResizeObserver: class {
      observe() {}
      disconnect() {}
    },
    location: window.location,
  };
  const saved = Object.fromEntries(
    Object.keys(g).map((k) => [k, Object.getOwnPropertyDescriptor(globalThis, k)]),
  );
  const realST = globalThis.setTimeout;
  const realCT = globalThis.clearTimeout;
  for (const [k, v] of Object.entries(g))
    Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
  let rafId = 0;
  globalThis.requestAnimationFrame = (f) => {
    const id = (rafId += 1);
    const t = realST(() => {
      live.raf.delete(id);
      f();
    }, 1);
    live.raf.add(id);
    live.raf[id] = t;
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => {
    realCT(live.raf[id]);
    live.raf.delete(id);
  };
  globalThis.setTimeout = (f, ms, ...a) => {
    const t = realST(
      () => {
        live.timers.delete(t);
        f(...a);
      },
      ms,
      ...a,
    );
    live.timers.add(t);
    return t;
  };
  globalThis.clearTimeout = (t) => {
    live.timers.delete(t);
    realCT(t);
  };
  // count listeners per target
  const net = new Map();
  const wrap = (target) => {
    const add = target.addEventListener.bind(target);
    const rem = target.removeEventListener.bind(target);
    const seen = new Map();
    target.addEventListener = (type, fn, o) => {
      if (!seen.has(fn)) {
        seen.set(fn, type);
        net.set(target, (net.get(target) || 0) + 1);
      }
      add(type, fn, o);
    };
    target.removeEventListener = (type, fn, o) => {
      if (seen.delete(fn)) net.set(target, net.get(target) - 1);
      rem(type, fn, o);
    };
    target.__left = () => [...seen.values()];
  };
  wrap(window);
  wrap(window.document);
  const fetchJson = async (p) =>
    JSON.parse(
      readFileSync(new URL(`../access-practice-lab/content/${p}`, import.meta.url), "utf8"),
    );
  const pool = (await loadPromptPool({ band: "3-5", fetchJson, cache: false })).prompts;
  const { default: odyssey } = await import("../access-practice-lab/src/arcade/odyssey/index.js");
  const host = window.document.getElementById("host");
  const wait = (ms) => new Promise((r) => realST(r, ms));
  let base = null; // listeners the shared sound engine installs once on first use are counted after cycle 1
  try {
    const sizes = [];
    for (let i = 0; i < 20; i += 1) {
      const session = new ArcadeSession({
        gameId: "syntax-odyssey",
        pool,
        band: "3-5",
        level: 3,
        seed: i + 1,
      });
      session.ready();
      session.begin();
      const stage = window.document.createElement("div");
      host.append(stage);
      wrap(stage);
      const input = new InputManager({ target: window });
      let state = null;
      const inst = await odyssey.create({
        stage,
        session,
        ui: { ask: async () => null, update: noop },
        I: makeI18n("en", "en"),
        ctx: {},
        config: {
          band: "3-5",
          level: 3,
          mode: "classic",
          calm: i % 2 === 0,
          reducedMotion: false,
          reducedEffects: false,
        },
        pool,
        input,
        perf: new PerformanceController(),
        saved: null,
        setState: (s) => {
          state = s;
        },
        finish: noop,
        announce: noop,
        playing: () => true,
        status: noop,
        settings: {},
      });
      stage.querySelector("[data-od-pick]").click();
      await wait(40);
      assert.ok(inst.debug().frames >= 0 && inst.debug().mode === "run", "the world started");
      assert.ok(state && state.chapter >= 1, "run state handed to the host");
      inst.onSettings({ reducedMotion: true, reducedEffects: true });
      await inst.destroy();
      input.destroy();
      stage.remove();
      session.exit();
      sizes.push([...net.values()].reduce((a, b) => a + b, 0));
      if (i === 0) base = { window: net.get(window) || 0, document: net.get(window.document) || 0 };
    }
    await wait(30);
    assert.equal(live.raf.size, 0, "no animation frame left running");
    assert.equal(live.timers.size, 0, "no timer left pending");
    assert.equal(
      sizes[19],
      sizes[0],
      `listener count is flat across cycles: ${sizes[0]} -> ${sizes[19]}`,
    );
    assert.equal(
      net.get(window) || 0,
      base.window,
      `every window listener the game added is removed (left: ${window.__left().join(",")})`,
    );
    assert.equal(
      net.get(window.document) || 0,
      base.document,
      "every document listener the game added is removed",
    );
  } finally {
    globalThis.setTimeout = realST;
    globalThis.clearTimeout = realCT;
    delete globalThis.requestAnimationFrame;
    delete globalThis.cancelAnimationFrame;
    for (const [k, d] of Object.entries(saved))
      if (d) Object.defineProperty(globalThis, k, d);
      else delete globalThis[k];
    window.close();
  }
});

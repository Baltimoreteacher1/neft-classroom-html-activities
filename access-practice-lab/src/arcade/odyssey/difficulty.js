// difficulty.js — how the Skyline Runner world adapts to the learner. A pure function: no DOM, no randomness.
//
//   band        3-5 | 6-8       younger band = slower, wider ledges, smaller gaps, fewer hazards, bigger sprites
//   level       WIDA practice level 1-6 (config.level)   lower level = the same, more strongly, plus guide arrows
//   target      session.view().target: the level the adaptive engine is aiming at
//                 target > level (demonstrated ability): an OPTIONAL high route with extra world Shards appears;
//                                                       the main route does not get harder
//                 target < level (struggling):          a rescue ledge in the longest gap and a second checkpoint
//   calm        untimed, no hazards, widest ledges, slow movers, long coyote and buffer windows
//   mode        survival adds tension to the WORLD only (a little more hazard, faster movers); it never touches
//               the language rigor, which the session owns
//   autoWalk    the accessible progression mode: the route is the same, hazards are removed, the Explorer
//               walks and jumps by itself
// Everything here is world pacing. The questions' difficulty and support belong to the session.

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const lerp = (a, b, t) => a + (b - a) * t;

export const BANDS_OD = Object.freeze(["3-5", "6-8"]);

export function worldDifficulty({
  band = "6-8",
  level = 3,
  target = level,
  calm = false,
  mode = "classic",
  autoWalk = false,
} = {}) {
  const lv = clamp(Math.round(Number(level)) || 1, 1, 6);
  const young = band === "3-5";
  const tg = clamp(Math.round(Number(target)) || lv, 1, 6);
  const easy = Boolean(calm || autoWalk);
  const survival = mode === "survival" && !easy;
  // c in [0,1]: how demanding the platforming is before the per-sequence ramp inside a chapter.
  const c = clamp(0.08 + (lv - 1) * 0.13 + (young ? 0 : 0.08) + (survival ? 0.05 : 0), 0, 0.92);
  const ease = easy ? 0.8 : 1;
  const platScale = (young ? 1.15 : 1) * (easy ? 1.3 : 1);
  const hazardBase = lv <= 2 ? 0 : Math.round(lerp(0, 3, c));
  const hazards = easy ? 0 : clamp(hazardBase + (survival ? 1 : 0) - (young ? 1 : 0), 0, 4);
  const stretch = !easy && tg > lv;
  const struggle = tg < lv;
  return Object.freeze({
    band,
    level: lv,
    target: tg,
    calm: Boolean(calm),
    autoWalk: Boolean(autoWalk),
    mode,
    c,
    // layout, in tiles of 32 px
    gapMin: lerp(1.2, 2.2, c) * ease,
    gapMax: lerp(2.0, 3.6, c) * ease,
    platMax: lerp(8, 6, c) * platScale,
    platMin: lerp(6, 3.2, c) * platScale,
    rise: lerp(1, 2.1, c) * ease,
    hazards,
    moverShare: easy ? lerp(0, 0.2, c) : lerp(0, 0.38, c) * (survival ? 1.15 : 1),
    moverSpeed: lerp(34, 68, c) * (easy ? 0.6 : 1) * (survival ? 1.15 : 1),
    beats: young ? 5 : 6,
    shardsPerSeq: young || lv <= 2 ? 5 : 4,
    // assistance
    guide: lv <= 2 || struggle || autoWalk,
    bonusRoute: stretch,
    rescueLedge: struggle,
    extraCheckpoint: struggle || lv <= 2,
    // physics feel (jump and gravity stay fixed so reachability is provable)
    speed: Math.round((young ? 190 : 210) * (easy ? 0.92 : 1)),
    coyote: easy ? 0.2 : lv <= 2 ? 0.16 : 0.1,
    buffer: easy ? 0.22 : lv <= 2 ? 0.18 : 0.14,
    // presentation: a smaller logical view height = a larger Explorer and larger targets on screen
    viewH: young ? 300 : 360,
    spriteScale: young ? 1.2 : 1,
  });
}

/** The physics overrides a difficulty asks for (merged into PHYS by the caller). */
export const physicsOf = (d) => ({ speed: d.speed, coyote: d.coyote, buffer: d.buffer });

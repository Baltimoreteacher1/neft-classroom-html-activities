// reach.js — proof and automation built on the real physics.
//
//   checkSequence()  proves every jump on every route of a sequence can be made with the SAME physics the game runs,
//                    at 85% of the Explorer's speed (a safety margin), for both bridge outcomes of a gate.
//   autopilot()      the Auto-walk driver: walks the route and jumps by looking ahead with the real simulation, so
//                    moving platforms, walls and drops are handled by the same rules a player lives under.
// DOM-free, so the unit tests run the Explorer through whole levels without a browser.
import {
  DT,
  cloneBody,
  makeBody,
  makeWorld,
  physFor,
  prepPlatform,
  standOn,
  step,
  syncPlatforms,
} from "./physics.js";
import { bridgePlatforms } from "./levels.js";

/** A simulation world for a sequence. `kinds` picks the bridge outcome per gate ("full" | "segments" | null = unpowered). */
export function worldFor(seq, kinds = []) {
  const list = seq.plats.map((p, i) => prepPlatform(p, i));
  const routes = {
    main: [...seq.routes.main],
    high: seq.routes.high ? [...seq.routes.high] : null,
  };
  seq.gates.forEach((g, gi) => {
    const kind = kinds[gi];
    if (!kind) return;
    const ids = bridgePlatforms(g, kind).map((p) => {
      list.push(prepPlatform(p, list.length));
      return list.length - 1;
    });
    for (const r of [routes.main, routes.high])
      if (r) {
        const at = r.indexOf(g.dais);
        r.splice(at + 1, 0, ...ids);
      }
  });
  const w = makeWorld(list, seq.killY);
  syncPlatforms(w);
  return { w, routes };
}

const EDGE_MARGIN = 9;
/** Run a lookahead from the body's state: does `inp` (held, first frame pressing jump if asked) land on goal? */
export function lands(w, b, goal, phys, { jump = true, maxT = 2.4, shift = 0, release = null } = {}) {
  const sb = cloneBody(b);
  const sw = { t: w.t + shift, acc: w.acc, plats: w.plats, killY: w.killY };
  const ride = shift && b.grounded ? w.plats[b.plat] : null;
  if (ride?.mv) {
    // the Explorer rides a moving platform: shift the platform's phase and carry the rider with it
    const [px, py] = [ride.x, ride.y];
    syncPlatforms(sw);
    sb.x += ride.x - px;
    sb.y += ride.y - py;
  }
  const from = b.plat;
  let ok = false;
  for (let t = 0, first = true; t < maxT; t += 1 / 60, first = false) {
    step(sw, sb, { right: release === null || t < release, left: false, jump, jumpPressed: jump && first }, 1 / 60, phys);
    if (sb.fell) break;
    if (sb.grounded && t > 0.05) {
      const g = w.plats[goal];
      // landing with a few pixels to spare, not on the very edge of the island (the real frame steps differ by a hair)
      ok = sb.plat === goal && sb.x + sb.w > g.x + EDGE_MARGIN && sb.x < g.x + g.w - EDGE_MARGIN;
      if (ok || sb.plat !== from) break;
    }
  }
  syncPlatforms(w);
  return ok;
}

const SAMPLES = 12;
// Takeoff points, in px back from the platform's edge: a short hop to a small island needs an earlier jump than a long gap does.
const TAKEOFFS = [-11, 0, 24, 48, 80, 112];
// Inputs after takeoff: [jump held?, seconds the right key stays down (null = all the way)]. Letting go of right in the air is a real control.
const VARIANTS = [[true, null], [false, null], [true, 0], [true, 0.25]];
/** Can the Explorer get from route platform `a` to `b`? Tries several takeoff points, jumping and walking off, at several moving-platform phases. */
function pairOk(list, ai, bi, killY, phys) {
  const a = list[ai];
  const b = list[bi];
  const period = [a, b].map((p) => p.mv?.period).find(Boolean) || 0;
  const phases = period ? SAMPLES : 1;
  for (let k = 0; k < phases; k += 1) {
    const w = makeWorld(list, killY);
    w.t = (period * k) / SAMPLES;
    syncPlatforms(w);
    for (const back of TAKEOFFS)
      for (const [jump, release] of VARIANTS) {
        const body = makeBody(0, 0, phys);
        standOn(body, a, a.x + a.w - body.w - back, ai);
        body.vx = phys.speed;
        if (lands(w, body, bi, phys, { jump, release })) return true;
      }
  }
  return false;
}

/** Prove a sequence. Returns { ok, fails:[{route, from, to, kind}] }. `margin` scales the Explorer's speed. */
export function checkSequence(seq, basePhys, { margin = 0.85 } = {}) {
  const phys = physFor({ ...basePhys, speed: basePhys.speed * margin });
  const fails = [];
  const kindSets = seq.gates.length
    ? [
        ["full", "full"],
        ["segments", "segments"],
      ].map((k) => k.slice(0, seq.gates.length))
    : [[]];
  for (const kinds of kindSets) {
    const { w, routes } = worldFor(seq, kinds);
    for (const name of ["main", "high"]) {
      const r = routes[name];
      if (!r) continue;
      for (let i = 0; i < r.length - 1; i += 1) {
        const a = w.plats[r[i]];
        const b = w.plats[r[i + 1]];
        const flat =
          !a.mv && !b.mv && Math.abs(b.x - (a.x + a.w)) <= 4 && b.y >= a.y - 6 && b.y <= a.y + 6;
        if (flat) continue;
        if (!pairOk(w.plats, r[i], r[i + 1], seq.killY, phys))
          fails.push({ route: name, from: r[i], to: r[i + 1], kind: kinds[0] || "none" });
      }
    }
  }
  // A gate must be real: without the bridge the chasm cannot be crossed.
  seq.gates.forEach((g) => {
    const { w } = worldFor(seq, []);
    if (
      pairOk(
        w.plats,
        g.dais,
        g.to,
        seq.killY,
        physFor({ ...basePhys, speed: basePhys.speed * 1.15 }),
      )
    )
      fails.push({ route: "main", from: g.dais, to: g.to, kind: "gate-open-without-answer" });
  });
  return { ok: fails.length === 0, fails };
}

export const makeAutopilot = () => ({ wait: 0 });

/**
 * One frame of Auto-walk. `route` is the live id list. Returns an input object the physics understands.
 * Grounded on the route: run to the edge, then jump when the lookahead says the jump lands on the next platform;
 * wait at the edge for a moving platform; stop short of a drop that does not land.
 */
export function autopilot(ap, w, b, route, phys, dt = 1 / 60) {
  const inp = { left: false, right: false, jump: false, jumpPressed: false };
  let i = b.grounded ? route.indexOf(b.plat) : -1;
  if (!b.grounded) {
    inp.right = true;
    inp.jump = b.vy < 0;
    return inp;
  }
  if (i < 0) {
    // off the route (a bonus island, a rescue pad): head for the first route platform ahead
    const here = b.x + b.w;
    i = route.findIndex((id) => w.plats[id].x + w.plats[id].w > here + 8) - 1;
    if (i < 0) {
      inp.right = true;
      return inp;
    }
  }
  const goal = route[i + 1];
  const P = w.plats[b.plat];
  if (goal === undefined) {
    inp.right = b.x + b.w / 2 < P.x + P.w / 2; // the last platform: walk to its middle (the exit ring or the gate dais)
    return inp;
  }
  const G = w.plats[goal];
  const edge = P.x + P.w - (b.x + b.w);
  const flat = !P.mv && !G.mv && G.x - (P.x + P.w) <= 4 && G.y >= P.y - 6;
  if (flat) {
    inp.right = true;
    ap.wait = 0;
    return inp;
  }
  if (edge > 28) {
    inp.right = true;
    return inp;
  }
  // A jump must land with room to spare, not on the first frame it could: it also has to land with a moving platform
  // a little early and a little late (a platform's phase can differ by a frame between the lookahead and the real step).
  const sure = (jump) => [0, 0.045, -0.045].every((shift) => lands(w, b, goal, phys, { jump, shift }));
  if (sure(true)) {
    ap.wait = 0;
    inp.right = true;
    inp.jump = true;
    inp.jumpPressed = true;
    return inp;
  }
  if (sure(false)) {
    ap.wait = 0;
    inp.right = true;
    return inp;
  }
  ap.wait += dt;
  if (ap.wait > 9) {
    inp.right = true;
    inp.jump = true;
    inp.jumpPressed = true;
    ap.wait = 0;
    return inp;
  }
  inp.right = edge > 14;
  return inp;
}

export { DT };

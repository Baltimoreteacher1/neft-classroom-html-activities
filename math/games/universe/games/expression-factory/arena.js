// Expression Factory — the Word Crates arena (Lesson 6-5). No DOM. Deterministic.
//
// Each room is a small platforming stage built around one crate at a time:
//   answer blocks  jump up and hit the block carrying the right card (words to
//                  symbols, substitute, multiply first)
//   answer ledges  for the last step, land on the ledge carrying the value
//   spring         launches the player up to a high gear
//   gears          bonus pickups, never required
// The last room is the Glitch Bot: the same crates, and every right answer is a
// hit on the bot. Tapping the stage opens the same cards as a panel, so nobody
// has to jump to answer.

/** The factory floor line, shared with levels.js (which re-exports it). */
export const FLOOR = 520;

export const SLOT_X = [300, 470, 640];
export const BLOCK = { w: 124, h: 44, y: FLOOR - 172 };
export const LEDGE = { w: 124, h: 14, y: FLOOR - 84 };
export const SPRING = { x: 170, w: 44, h: 16, launch: -15.5 };
export const BOARD_X = 470;
export const TRUCK_X = 960;

/** Solids and pickups for one Word Crates room, appended to the level's lists. */
export function buildArena(x0, i, solids, boss) {
  const blocks = SLOT_X.map((cx, slot) => {
    solids.push({
      x: x0 + cx - BLOCK.w / 2,
      y: BLOCK.y,
      w: BLOCK.w,
      h: BLOCK.h,
      kind: "block",
      room: i,
      slot,
      open: 0,
    });
    return solids.length - 1;
  });
  const ledges = SLOT_X.map((cx, slot) => {
    solids.push({
      x: x0 + cx - LEDGE.w / 2,
      y: LEDGE.y,
      w: LEDGE.w,
      h: LEDGE.h,
      kind: "ledge",
      room: i,
      slot,
      oneWay: 1,
      open: 1,
    });
    return solids.length - 1;
  });
  const gears = [
    { x: x0 + SPRING.x + SPRING.w / 2, y: FLOOR - 250 },
    { x: x0 + (SLOT_X[0] + SLOT_X[1]) / 2, y: FLOOR - 70 },
    { x: x0 + (SLOT_X[1] + SLOT_X[2]) / 2, y: FLOOR - 70 },
    { x: x0 + SLOT_X[1], y: BLOCK.y - 75 },
  ].map((g) => ({ ...g, got: 0 }));
  return { blocks, ledges, gears, boss: boss ? 1 : 0 };
}

/** The step the room is on, or null once every crate is packed. */
export const stepOf = (r) => (r.done ? null : r.items[r.at].steps[r.step]);

/** Show blocks for a card step, ledges for a value step; hide the slots a step does not use. */
export function syncArena(w, r) {
  const st = stepOf(r);
  const value = st?.ask === "askSolve";
  r.blocks.forEach((s, k) => {
    w.solids[s].open = !st || value || k >= st.choices.length ? 1 : 0;
  });
  r.ledges.forEach((s, k) => {
    w.solids[s].open = !st || !value || k >= st.choices.length ? 1 : 0;
  });
}

/**
 * Physical answers for the room the player is in: a head-bump on a block, a
 * landing on a ledge, the spring, and gears. `vyBefore` is the player's
 * vertical speed before this tick's movement. Returns the picked card or null.
 */
export function stepArena(w, r, vyBefore, ev) {
  const p = w.p;
  for (const g of r.gears)
    if (!g.got && Math.abs(p.x + p.w / 2 - g.x) < 24 && Math.abs(p.y + p.h / 2 - g.y) < 32) {
      g.got = 1;
      ev.push({ type: "gear", room: r.i, x: g.x, y: g.y });
    }
  const sx = r.x0 + SPRING.x;
  if (
    p.vy >= 0 &&
    p.x + p.w > sx &&
    p.x < sx + SPRING.w &&
    p.y + p.h >= FLOOR - SPRING.h &&
    p.ground
  ) {
    p.vy = SPRING.launch;
    p.ground = 0;
    // The spring carries the player to the top of its arc, jump held or not.
    p.springT = 30;
    ev.push({ type: "spring", room: r.i });
  }
  const st = stepOf(r);
  if (!st) return null;
  // Head-bump: moving up last tick, stopped this tick, head flush with a block's underside.
  if (vyBefore < 0 && p.vy === 0)
    for (const k of r.blocks) {
      const s = w.solids[k];
      if (s.open || Math.abs(p.y - (s.y + s.h)) > 0.6 || p.x + p.w <= s.x || p.x >= s.x + s.w)
        continue;
      return { slot: s.slot, choice: st.choices[s.slot] };
    }
  // Landing on a value ledge.
  if (p.ground && p.plat >= 0 && p.plat !== r.stood) {
    r.stood = p.plat;
    const s = w.solids[p.plat];
    if (s.kind === "ledge" && s.room === r.i) return { slot: s.slot, choice: st.choices[s.slot] };
  }
  if (!p.ground) r.stood = -1;
  return null;
}

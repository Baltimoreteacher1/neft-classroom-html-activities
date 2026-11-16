// Ratio Rush — level data and world construction. No DOM.
//
// Distances are in miles and time in minutes; one simulated minute is 60
// ticks (one second of play), and one mile is MI pixels. Three lanes: 0 is the
// main line, 1 the upper track, 2 the lower track.
//
// A maintenance cart patrols [x0, x1] on the main line; its crossovers sit at least
// 0.8 mi outside that patrol so the train can always pass it on the side track.
//
// Stops (where the train halts and a console opens):
//   couple   set your gear ratio d : t; you and a partner train leave together
//            and the coupling crane at x + span links you only if you arrive
//            at the same moment (equivalent rates)
//   junction choose the upper or lower branch to a station; a rival courier
//            takes the other one; the station gate opens for whoever arrives
//            first (posted rate and length per branch)
//   depot    load charge cells for the next leg; efficiency is d miles per
//            t cells; too few and the train coasts to a stop short of the
//            charger, extra charge is released at the charger and lost

export const MI = 80;
export const LANE_Y = [420, 300, 540];
export const TICKS_PER_MIN = 60;

const couple = (id, x, span, partner, dOptions, tMax, name) => ({
  id,
  kind: "couple",
  x,
  lane: 0,
  span,
  partner,
  dOptions,
  tMax,
  name,
});
const junction = (id, x, span, upper, lower) => ({
  id,
  kind: "junction",
  x,
  lane: 0,
  span,
  upper,
  lower,
});
const depot = (id, x, span, rate) => ({
  id,
  kind: "depot",
  x,
  lane: 0,
  span,
  rate,
});

export const LEVELS = [
  {
    id: "coupling-run",
    lesson: "3-3",
    len: 44,
    start: 1,
    stops: [
      couple("c1", 4, 6, { d: 3, t: 2 }, [2, 4, 6, 8], 8, "Juniper"),
      couple("c2", 16, 10, { d: 5, t: 4 }, [10, 15, 20], 16, "Maple"),
      couple("c3", 31, 8, { d: 6, t: 8 }, [3, 9, 12], 16, "Cedar"),
    ],
    carts: [{ lane: 0, x0: 12.5, x1: 14.5, x: 13, dir: 1 }],
    crossovers: [11.4, 15.6],
    side: [{ lane: 1, x0: 11, x1: 16 }],
    exit: 43,
  },
  {
    id: "junction-run",
    lesson: "3-5",
    len: 46,
    start: 1,
    stops: [
      junction(
        "j1",
        4,
        8,
        { len: 12, rate: { d: 8, t: 3 } },
        { len: 10, rate: { d: 5, t: 2 } },
      ),
      junction("j2", 18, 8, { len: 15, rate: { d: 6, t: 2 } }, { len: 12, rate: { d: 2, t: 1 } }),
      junction("j3", 32, 8, { len: 20, rate: { d: 10, t: 3 } }, { len: 18, rate: { d: 7, t: 2 } }),
    ],
    carts: [{ lane: 0, x0: 14.2, x1: 15.8, x: 15, dir: 1 }],
    crossovers: [13.2, 16.8],
    side: [{ lane: 1, x0: 12.8, x1: 17.2 }],
    exit: 45,
  },
  {
    id: "charge-line",
    lesson: "3-8",
    len: 54,
    start: 1,
    budget: 20,
    stops: [
      depot("d1", 3, 15, { d: 5, t: 2 }),
      depot("d2", 20, 12, { d: 3, t: 1 }),
      depot("d3", 34, 14, { d: 7, t: 4 }),
    ],
    carts: [{ lane: 0, x0: 50.5, x1: 51.8, x: 51, dir: 1 }],
    crossovers: [49.6, 52.7],
    side: [{ lane: 1, x0: 49.2, x1: 53.1 }],
    exit: 53.5,
  },
];

/** Build the world for a level. */
export function createWorld(index, seed) {
  const L = LEVELS[index];
  return {
    rng: seed >>> 0 || 1,
    tick: 0,
    level: index,
    len: L.len,
    // the player's locomotive
    train: {
      x: L.start,
      lane: 0,
      v: 0,
      face: 1,
      mode: "drive",
      laneT: 0,
      from: 0,
      bump: 0,
    },
    stops: L.stops.map((s) => ({
      ...s,
      done: 0,
      tries: 0,
      // couple: the gear the student set; junction: the branch; depot: cells
      gear: s.kind === "couple" ? { d: s.dOptions[0], t: 1 } : null,
      branch: s.kind === "junction" ? 0 : null,
      cells: s.kind === "depot" ? 0 : null,
    })),
    run: null,
    carts: L.carts.map((c) => ({ ...c })),
    crossovers: L.crossovers.slice(),
    side: L.side.map((s) => ({ ...s })),
    budget: L.budget ?? -1,
    exit: L.exit,
    done: 0,
  };
}

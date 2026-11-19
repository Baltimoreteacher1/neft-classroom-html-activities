// Factory Run — the runner's rules (Lesson 6-5). Pure and deterministic: no DOM, no three.js.
//
// Wren runs down a three-lane factory line. Every question step is one
// segment: a prompt sign, a stretch of hazards, gears and power-ups, then a row
// of answer gates, one card per lane. Running through the right gate packs the
// crate (combo up, gears); a wrong gate shatters, gives the step's hint and the
// same question comes round again with the cards in new lanes. Hazards never
// end the run: a hit is a stumble (slow down, combo lost) unless a shield
// takes it. Nothing counts down. The last stage is the Glitch Bot chase:
// every right gate zaps the bot.

import { WORD_ROOMS } from "../quiz.js";

export const LANES = [-2.6, 0, 2.6];
export const STAGES = [
  { id: "words-add", key: "stageWordsAdd", items: WORD_ROOMS[0] },
  { id: "words-mul", key: "stageWordsMul", items: WORD_ROOMS[1] },
  { id: "substitute", key: "stageSubstitute", items: WORD_ROOMS[2] },
  { id: "two-step", key: "stageTwoStep", items: WORD_ROOMS[3] },
  { id: "boss", key: "stageBoss", items: WORD_ROOMS[4], boss: true },
];

export const FEEL = {
  speed: { chill: 7.5, normal: 9.5 },
  stageBoost: 0.45,
  jumpV: 9.2,
  gravity: 24,
  slideT: 0.75,
  laneRate: 14, // lane changes per second of travel (eased)
  stumbleT: 0.9,
  gateGap: 52, // prompt sign to gate row
  lead: 14, // first hazard after the sign
  afterGate: 10, // next sign after a gate row
};

/** Small deterministic generator (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function newRun(stage, { pace = "chill", seed = 7 } = {}) {
  const s = {
    stage,
    items: STAGES[stage].items,
    boss: !!STAGES[stage].boss,
    at: 0,
    step: 0,
    tries: 0, // misses on the current crate
    firstTry: 0,
    dist: 0,
    speed: FEEL.speed[pace] + stage * FEEL.stageBoost,
    pace,
    lane: 1,
    x: LANES[1],
    y: 0,
    vy: 0,
    slideT: 0,
    stumbleT: 0,
    gears: 0,
    combo: 0,
    best: 0,
    shield: 0,
    magnetT: 0,
    doubleT: 0,
    bossHp: 1,
    objs: [],
    seq: 0,
    rand: rng(seed + stage * 977),
    done: 0,
    hint: null,
  };
  spawnSegment(s, 16);
  return s;
}

export const stepOf = (s) => (s.done ? null : s.items[s.at].steps[s.step]);

/** Lay out one question segment starting at z0: sign, hazards, gears, power-up, gate row. */
function spawnSegment(s, z0) {
  const st = stepOf(s);
  if (!st) return;
  const r = s.rand;
  const seg = ++s.seq;
  s.objs.push({ kind: "sign", z: z0, seg, at: s.at, step: s.step });
  const gateZ = z0 + FEEL.gateGap;
  // Cards go to lanes in a rotating order, so a repeat puts them somewhere new.
  const order = [0, 1, 2];
  const turn = (seg + Math.floor(r() * 3)) % 3;
  for (let k = 0; k < turn; k++) order.push(order.shift());
  const lanes = st.choices.length === 2 ? [order[0], order[2]].sort() : order;
  st.choices.forEach((choice, k) =>
    s.objs.push({
      kind: "gate",
      z: gateZ,
      lane: lanes[k],
      choice,
      right: choice === st.answer,
      seg,
    }),
  );
  // With two cards, the third lane is walled off.
  if (st.choices.length === 2) {
    const free = [0, 1, 2].find((l) => !lanes.includes(l));
    s.objs.push({ kind: "wall", z: gateZ, lane: free, seg });
  }
  // Hazards between the sign and the gates; never two in one row that close every lane.
  const types = ["barrier", "pipe", "block"];
  for (let z = z0 + FEEL.lead; z < gateZ - 12; z += 9 + Math.floor(r() * 5)) {
    const n = r() < 0.35 ? 2 : 1;
    const used = new Set();
    for (let k = 0; k < n; k++) {
      let lane = Math.floor(r() * 3);
      while (used.has(lane)) lane = (lane + 1) % 3;
      used.add(lane);
      const kind = types[Math.floor(r() * (n === 2 ? 2 : 3))];
      s.objs.push({ kind: s.boss && r() < 0.4 ? "orb" : kind, z, lane, seg });
    }
    // A line of gears in a lane left free at this row.
    const open = [0, 1, 2].filter((l) => !used.has(l));
    const gl = open[Math.floor(r() * open.length)];
    for (let k = 0; k < 4; k++)
      s.objs.push({ kind: "gear", z: z + 2 + k * 1.6, lane: gl, y: 0.9, seg });
  }
  // A power-up every third segment, in the middle of the run-up.
  if (seg % 3 === 0) {
    const kinds = ["magnet", "shield", "double"];
    const z = z0 + FEEL.lead - 5;
    s.objs.push({
      kind: "power",
      power: kinds[(seg / 3) % 3],
      z,
      lane: Math.floor(r() * 3),
      y: 1,
      seg,
    });
  }
}

const hazard = (k) =>
  k === "barrier" || k === "pipe" || k === "block" || k === "orb" || k === "wall";

/** Input: "left" | "right" | "jump" | "slide" | a lane number 0-2 (pick a card by number). */
export function input(s, cmd) {
  if (s.done) return;
  if (cmd === "left") s.lane = Math.max(0, s.lane - 1);
  else if (cmd === "right") s.lane = Math.min(2, s.lane + 1);
  else if (cmd === "jump" && s.y === 0) {
    s.vy = FEEL.jumpV;
    s.slideT = 0;
  } else if (cmd === "slide") {
    s.slideT = FEEL.slideT;
    if (s.y > 0) s.vy = -FEEL.jumpV;
  } else if (typeof cmd === "number" && cmd >= 0 && cmd <= 2) s.lane = cmd;
}

/** Hit by a hazard: the shield takes it, otherwise a stumble and the combo is gone. */
function hit(s, o, ev) {
  if (s.shield) {
    s.shield = 0;
    o.gone = 1;
    ev.push({ type: "shieldPop", z: o.z, lane: o.lane });
    return;
  }
  s.stumbleT = FEEL.stumbleT;
  s.combo = 0;
  ev.push({ type: "stumble", kind: o.kind, z: o.z, lane: o.lane });
}

/** Run through a gate: right packs the step, wrong repeats the question. */
function passGate(s, o, ev) {
  const st = stepOf(s);
  const item = s.items[s.at];
  const last = s.step === item.steps.length - 1;
  for (const g of s.objs)
    if (g.seg === o.seg && (g.kind === "gate" || g.kind === "wall")) g.passed = 1;
  if (!o.right) {
    s.tries++;
    s.combo = 0;
    s.hint = st.ask;
    ev.push({
      type: "gate",
      ok: false,
      choice: o.choice,
      lane: o.lane,
      z: o.z,
      ask: st.ask,
      misconception: o.choice ? st.slips?.[o.choice] : undefined,
      mechanic: item.mechanic,
      prompt: item.show || item.phrase.en,
    });
    spawnSegment(s, o.z + FEEL.afterGate);
    return;
  }
  s.hint = null;
  s.combo++;
  s.best = Math.max(s.best, s.combo);
  const mult = Math.min(4, 1 + Math.floor(s.combo / 3));
  s.gears += 5 * mult * (s.doubleT > 0 ? 2 : 1);
  ev.push({
    type: "gate",
    ok: true,
    choice: o.choice,
    lane: o.lane,
    z: o.z,
    ask: st.ask,
    combo: s.combo,
    mult,
    mechanic: item.mechanic,
    prompt: item.show || item.phrase.en,
  });
  if (!last) s.step++;
  else {
    if (!s.tries) s.firstTry++;
    s.tries = 0;
    s.step = 0;
    s.at++;
    if (s.boss) s.bossHp = 1 - s.at / s.items.length;
    ev.push({ type: "crate", n: s.at, total: s.items.length, boss: s.boss });
    if (s.at === s.items.length) {
      s.done = 1;
      ev.push({
        type: "stageDone",
        firstTry: s.firstTry,
        total: s.items.length,
        gears: s.gears,
        best: s.best,
      });
      return;
    }
  }
  spawnSegment(s, o.z + FEEL.afterGate);
}

/** Advance the run by dt seconds; returns the events of this step. */
export function tick(s, dt) {
  const ev = [];
  if (s.done) return ev;
  const speed = s.speed * (s.stumbleT > 0 ? 0.45 : 1);
  if (s.stumbleT > 0) s.stumbleT = Math.max(0, s.stumbleT - dt);
  if (s.slideT > 0) s.slideT = Math.max(0, s.slideT - dt);
  if (s.magnetT > 0) s.magnetT = Math.max(0, s.magnetT - dt);
  if (s.doubleT > 0) s.doubleT = Math.max(0, s.doubleT - dt);
  const before = s.dist;
  s.dist += speed * dt;
  // Lane easing and the jump arc.
  const tx = LANES[s.lane];
  s.x += (tx - s.x) * Math.min(1, dt * FEEL.laneRate);
  if (Math.abs(tx - s.x) < 0.01) s.x = tx;
  if (s.y > 0 || s.vy > 0) {
    s.vy -= FEEL.gravity * dt;
    s.y = Math.max(0, s.y + s.vy * dt);
    if (s.y === 0) {
      s.vy = 0;
      ev.push({ type: "land" });
    }
  }
  // The lane the player is mostly in decides what they meet.
  const lane = LANES.reduce(
    (best, lx, i) => (Math.abs(lx - s.x) < Math.abs(LANES[best] - s.x) ? i : best),
    0,
  );
  for (const o of s.objs) {
    if (o.gone || o.passed) continue;
    if (o.kind === "gear" && s.magnetT > 0 && o.z > before && o.z - s.dist < 6) o.lane = lane;
    if (!(o.z > before && o.z <= s.dist)) continue;
    if (o.kind === "gate") {
      if (o.lane === lane) passGate(s, o, ev);
      continue;
    }
    if (o.lane !== lane) continue;
    if (o.kind === "gear") {
      o.gone = 1;
      s.gears += s.doubleT > 0 ? 2 : 1;
      ev.push({ type: "gear", z: o.z, lane });
    } else if (o.kind === "power") {
      o.gone = 1;
      if (o.power === "shield") s.shield = 1;
      if (o.power === "magnet") s.magnetT = 10;
      if (o.power === "double") s.doubleT = 10;
      ev.push({ type: "power", power: o.power });
    } else if (o.kind === "wall") {
      // The walled lane in a two-card row: a stumble, and the question comes again.
      hit(s, o, ev);
      passGate(s, { ...o, right: false, choice: null }, ev);
    } else if (hazard(o.kind)) {
      const clear =
        (o.kind === "barrier" && s.y > 0.75) ||
        (o.kind === "pipe" && s.slideT > 0) ||
        (o.kind === "orb" && s.y > 0.9);
      if (!clear) hit(s, o, ev);
      else ev.push({ type: "dodge", kind: o.kind });
    }
  }
  // Forget what is well behind.
  if (s.objs.length > 80) s.objs = s.objs.filter((o) => o.z > s.dist - 20);
  return ev;
}

/** Stars for a finished stage: share of crates packed on the first try. */
export const stars = (firstTry, total) =>
  firstTry / total >= 0.9 ? 3 : firstTry / total >= 0.6 ? 2 : 1;

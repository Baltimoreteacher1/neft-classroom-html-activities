// Vocabulary Academy — the Word Galaxy's pure engine: how two words are related by the unit's own data (syn, ant, morph parts,
// family, relation groups), every pair the data supports, the seeded round builder, the sky layout and the constellations.
// No DOM, no storage, deterministic for a pool and a seed. The game itself (view, kit spec, start) is ./galaxy.js.
import { hashSeed, rngFor } from "../rng.js";
import { groupsFor } from "../games/data.js";
import { newMc } from "../games/questions.js";
import { clean, norm, uniq } from "../games/text.js";

export const MAP = { w: 400, h: 420 };
export const MIN_ROUNDS = 3;

/** The five answers. `line` is the line style the connection is drawn with (and the legend names). */
export const REL = {
  syn: {
    en: "Same meaning",
    es: "Mismo significado",
    dim: "mean",
    line: "solid",
    lineEn: "solid line",
    lineEs: "línea continua",
  },
  ant: {
    en: "Opposites",
    es: "Opuestos",
    dim: "mean",
    line: "dashed",
    lineEn: "dashed line",
    lineEs: "línea de rayas",
  },
  morph: {
    en: "Share a word part",
    es: "Comparten una parte",
    dim: "morph",
    line: "dotted",
    lineEn: "dotted line",
    lineEs: "línea de puntos",
  },
  group: {
    en: "Same group",
    es: "Mismo grupo",
    dim: "mean",
    line: "double",
    lineEn: "double line",
    lineEs: "línea doble",
  },
  none: {
    en: "Not connected",
    es: "No están conectadas",
    dim: "mean",
    line: "none",
    lineEn: "no line",
    lineEs: "sin línea",
  },
};
export const REL_ORDER = ["syn", "ant", "morph", "group", "none"];

const SLOTS = {
  early: ["syn", "ant", "syn", "none", "ant", "syn"],
  "upper-elem": ["syn", "ant", "group", "syn", "morph", "none", "ant", "group"],
  middle: ["syn", "morph", "ant", "group", "morph", "none", "syn", "group", "ant"],
};
SLOTS.high = SLOTS.middle;
export const BAND_RELS = {
  early: ["syn", "ant"],
  "upper-elem": ["syn", "ant", "group", "morph"],
  middle: ["syn", "ant", "group", "morph"],
  high: ["syn", "ant", "group", "morph"],
};
export const bandRels = (band) => BAND_RELS[band] || BAND_RELS.middle;
const slotsOf = (band) => SLOTS[band] || SLOTS.middle;

// ── pure data: how two words are related ────────────────────────────────────────────────────────
const strip = (s) => norm(s).replace(/[-–…]/g, "");
const hit = (x, y) => [...x].some((v) => y.has(v));

/** What the data says about one word: its headword, synonyms, antonyms, family words, shared-able word parts. */
export function profile(w) {
  const parts = (w.morph?.segs || [])
    .filter((s) => ["root", "base", "prefix"].includes(s.t))
    .map((s) => strip(s.s))
    .filter((p) => p.length >= 3);
  return {
    hw: norm(w.hw),
    syn: new Set((w.syn || []).map(norm)),
    ant: new Set((w.ant || []).map(norm)),
    fam: new Set((w.family || []).map((f) => norm(f.w))),
    parts: new Set(parts),
    rel: norm(w.rel),
  };
}

/** Which of the four connections hold between two words (word records, or { hw } for a partner word). */
export function relationsOf(a, b, groups = []) {
  const A = profile(a);
  const B = profile(b);
  const syn = A.syn.has(B.hw) || B.syn.has(A.hw) || hit(A.syn, B.syn) || hit(A.ant, B.ant);
  const ant = A.ant.has(B.hw) || B.ant.has(A.hw) || hit(A.syn, B.ant) || hit(A.ant, B.syn);
  const parts = [...A.parts].filter((p) => B.parts.has(p));
  const family = A.fam.has(B.hw) || B.fam.has(A.hw) || hit(A.fam, B.fam);
  const group = Boolean(
    a.id &&
    b.id &&
    (groups.some((g) => g.ids.includes(a.id) && g.ids.includes(b.id)) ||
      (A.rel && A.rel === B.rel)),
  );
  return {
    syn,
    ant,
    morph: parts.length > 0 || family,
    group,
    part: parts[0] || "",
    conflict: syn && ant,
  };
}
const trueSetOf = (r) => REL_ORDER.filter((k) => k !== "none" && r[k]);

/** Two headwords that look related by spelling (one inside the other, or the same first five letters). */
export function stemRelated(x, y) {
  if (x === y) return true;
  const L = Math.min(x.length, y.length);
  if (L >= 4 && (x.includes(y) || y.includes(x))) return true;
  return L >= 5 && x.slice(0, 5) === y.slice(0, 5);
}

const neighbourhood = (P) => new Set([P.hw, ...P.syn, ...P.ant, ...P.fam]);

/** True only when NOTHING in the data links the two words: no synonym, antonym, word part, family, group or look-alike spelling. */
export function unrelated(a, b, groups = []) {
  const r = relationsOf(a, b, groups);
  if (r.syn || r.ant || r.morph || r.group) return false;
  const A = profile(a);
  const B = profile(b);
  if (hit(neighbourhood(A), neighbourhood(B))) return false;
  return !stemRelated(A.hw, B.hw);
}

const MAX_TOKEN = 18;
/** Can a synonym or antonym written on `a` stand in the sky as a partner star? One or two short words, nothing family-like. */
function tokenOk(a, t) {
  const nt = norm(t);
  if (!nt || nt.length > MAX_TOKEN || nt.split(/\s+/).length > 2) return false;
  const A = profile(a);
  return !A.fam.has(nt) && !stemRelated(A.hw, nt);
}

const unitStar = (w) => ({ key: w.id, hw: w.hw, unit: true, id: w.id });
const partnerStar = (t) => ({ key: `tok:${norm(t)}`, hw: clean(t), unit: false });
const pairKey = (a, b) => [a.key, b.key].sort().join("|");

/** Every pair the data can support, by connection: { syn, ant, morph, group, none } of { kind, key, a, b, trueSet, part, label }. */
export function candidatesOf(pool, groups = groupsFor(pool)) {
  const words = pool.words;
  const byHw = new Map(words.map((w) => [norm(w.hw), w]));
  const out = { syn: [], ant: [], morph: [], group: [], none: [] };
  const seen = new Set();
  const add = (kind, a, b, extra) => {
    const key = `${kind}:${pairKey(a, b)}`;
    if (seen.has(key)) return;
    seen.add(key);
    out[kind].push({ kind, key: pairKey(a, b), a, b, part: "", label: "", ...extra });
  };
  for (const w of words) {
    for (const kind of ["syn", "ant"]) {
      const other = kind === "syn" ? "ant" : "syn";
      for (const t of w[kind] || []) {
        const twin = byHw.get(norm(t));
        if (twin && twin.id !== w.id) {
          const r = relationsOf(w, twin, groups);
          if (r[kind] && !r.conflict)
            add(kind, unitStar(w), unitStar(twin), { trueSet: trueSetOf(r), part: r.part });
        } else if (!twin && tokenOk(w, t) && !(w[other] || []).some((x) => norm(x) === norm(t))) {
          add(kind, unitStar(w), partnerStar(t), { trueSet: [kind] });
        }
      }
    }
  }
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < words.length; j++) {
      const a = words[i];
      const b = words[j];
      const r = relationsOf(a, b, groups);
      if (r.conflict) continue;
      const set = trueSetOf(r);
      if (r.morph) add("morph", unitStar(a), unitStar(b), { trueSet: set, part: r.part });
      if (r.group) {
        const g = groups.find((x) => x.ids.includes(a.id) && x.ids.includes(b.id));
        add("group", unitStar(a), unitStar(b), { trueSet: set, label: g?.label || clean(a.rel) });
      }
      if (!set.length && unrelated(a, b, groups))
        add("none", unitStar(a), unitStar(b), { trueSet: [] });
    }
  }
  return out;
}

// ── the engine ──────────────────────────────────────────────────────────────────────────────────
/** The answer menu: the right connection plus false ones, always in the canonical order. Pure. */
export function menuFor(rel, trueSet, band, rng) {
  const allowed = bandRels(band);
  const want = band === "early" ? 3 : 4;
  const truth = new Set(trueSet);
  const sensible = truth.has("syn") || truth.has("ant");
  const wrong = [...allowed, "none"].filter(
    (r) =>
      r !== rel &&
      !truth.has(r) &&
      !(r === "group" && sensible),
  );
  const picked = rng.shuffle(wrong).slice(0, want - 1);
  return REL_ORDER.filter((r) => r === rel || picked.includes(r));
}

function makeRound(c, i, pool, rng) {
  const flip = rng.next() < 0.5;
  const [x, y] = flip ? [c.b, c.a] : [c.a, c.b];
  const focus = x.unit ? x : y;
  const rels = menuFor(c.kind, c.trueSet, pool.band, rng);
  const hints =
    x.unit && y.unit
      ? [
          { k: "def", id: x.id },
          { k: "def", id: y.id },
        ]
      : [
          { k: "def", id: focus.id },
          { k: "ex", id: focus.id },
        ];
  const q = {
    id: `galaxy-${i + 1}`,
    type: "galaxy",
    wordId: focus.id,
    dim: REL[c.kind].dim,
    stem: "How are these words connected?",
    rel: c.kind,
    rels,
    choices: rels.map((r) => REL[r].en),
    answer: rels.indexOf(c.kind),
    part: c.part || "",
    group: c.label || "",
    hints,
    why: `${x.hw} and ${y.hw}: ${REL[c.kind].en}.`,
  };
  return { q, mc: newMc(), a: x.key, b: y.key, rel: c.kind, stars: [x, y] };
}

/** Pure engine: the sky for a pool and a seeded rng. { rounds:[{q,mc,a,b,rel}], stars:{key:{key,hw,unit,id?}}, i, claimed }. */
export function buildGalaxy(pool, rng, { count } = {}) {
  const empty = { rounds: [], stars: {}, i: 0, claimed: false, fresh: -1 };
  if (pool.words.length < 2) return empty;
  const band = bandRels(pool.band);
  const base = slotsOf(pool.band);
  const plan = Array.from({ length: count || base.length }, (_, i) => base[i % base.length]);
  const lists = Object.fromEntries(
    Object.entries(candidatesOf(pool)).map(([k, v]) => [k, rng.shuffle(v)]),
  );
  const used = new Set();
  const placed = new Set();
  const uses = new Map();
  const chosen = [];
  plan.forEach((slot, i) => {
    const kinds = uniq([slot, ...band.filter((r) => r !== slot)]);
    for (const kind of kinds) {
      const open = lists[kind].filter((c) => !used.has(c.key));
      if (!open.length) continue;
      const touches = (c) => [c.a, c.b].filter((s) => placed.has(s.key)).length;
      const crowded = (c) =>
        [c.a, c.b].some((s) => s.unit && (uses.get(s.key) || 0) >= 3) ? 10 : 0;
      const want = kind === "none" ? 0 : i % 3 === 2 ? 0 : 1;
      const score = (c) => Math.abs(touches(c) - want) + crowded(c);
      const best = [...open].sort((p, q) => score(p) - score(q))[0];
      used.add(best.key);
      for (const s of [best.a, best.b]) {
        placed.add(s.key);
        if (s.unit) uses.set(s.key, (uses.get(s.key) || 0) + 1);
      }
      chosen.push({ c: best, kind });
      return;
    }
  });
  const rounds = chosen.map(({ c }, i) => makeRound(c, i, pool, rng));
  if (rounds.length < MIN_ROUNDS) return empty;
  const stars = {};
  for (const r of rounds) for (const s of r.stars) stars[s.key] = s;
  for (const r of rounds) delete r.stars;
  return { rounds, stars, i: 0, claimed: false, fresh: -1 };
}

// ── the sky: where stars sit, which are joined, what the constellations are called (all pure) ─────────────
const OV = { x: 96, y: 36 };
const ell = (p, q) => Math.hypot((p.x - q.x) / OV.x, (p.y - q.y) / OV.y);
const clash = (p, q) => Math.abs(p.x - q.x) < OV.x && Math.abs(p.y - q.y) < OV.y;
const inside = (p) => p.x >= 54 && p.x <= MAP.w - 54 && p.y >= 34 && p.y <= MAP.h - 42;
const minDist = (p, others) =>
  others.reduce((m, o) => Math.min(m, ell(p, o)), Number.POSITIVE_INFINITY);

function placeFree(others, rng) {
  const cells = [];
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 4; c++)
      cells.push({ x: 66 + c * 89 + rng.int(25) - 12, y: 44 + r * 66 + rng.int(25) - 12 });
  const order = rng.shuffle(cells);
  const free = order.filter((p) => !others.some((o) => clash(p, o)));
  const pool = free.length ? free : order;
  return pool.reduce((best, p) => (minDist(p, others) > minDist(best, others) ? p : best), pool[0]);
}

function placeNear(anchor, others, rng) {
  const turn = rng.int(12);
  for (const radius of [86, 108, 130]) {
    const ring = [];
    for (let k = 0; k < 12; k++) {
      const ang = ((k + turn) / 12) * Math.PI * 2;
      ring.push({
        x: Math.round(anchor.x + radius * Math.cos(ang)),
        y: Math.round(anchor.y + radius * Math.sin(ang) * 0.8),
      });
    }
    const ok = ring.filter((p) => inside(p) && !others.some((o) => clash(p, o)));
    if (ok.length)
      return ok.reduce((best, p) => (minDist(p, others) > minDist(best, others) ? p : best), ok[0]);
  }
  return placeFree(others, rng);
}

/** { starKey: {x,y} } for the stars of every finished round. Placement walks the rounds in order, so earlier stars never move. */
export function layoutStars(state) {
  const pos = {};
  const rng = rngFor(`galaxy-sky:${hashSeed(state.rounds.map((r) => `${r.a}|${r.b}`).join(","))}`);
  for (const r of state.rounds) {
    if (!r.mc.done) continue;
    const have = (k) => pos[k];
    const all = () => Object.values(pos);
    if (!have(r.a) && !have(r.b)) {
      pos[r.a] = placeFree(all(), rng);
      pos[r.b] = r.rel === "none" ? placeFree(all(), rng) : placeNear(pos[r.a], all(), rng);
    } else if (!have(r.a))
      pos[r.a] = r.rel === "none" ? placeFree(all(), rng) : placeNear(pos[r.b], all(), rng);
    else if (!have(r.b))
      pos[r.b] = r.rel === "none" ? placeFree(all(), rng) : placeNear(pos[r.a], all(), rng);
  }
  return pos;
}

export const drawnRounds = (state) => state.rounds.filter((r) => r.mc.done && r.rel !== "none");

/** Constellations: stars joined by drawn lines. [{ n, keys, edges, rels, label }] — label is a relation group name or "". */
export function constellationsOf(state) {
  const edges = drawnRounds(state);
  const parent = new Map();
  const find = (k) => {
    if (!parent.has(k)) parent.set(k, k);
    let root = k;
    while (parent.get(root) !== root) root = parent.get(root);
    parent.set(k, root);
    return root;
  };
  for (const e of edges) parent.set(find(e.a), find(e.b));
  const comps = new Map();
  for (const e of edges) {
    const root = find(e.a);
    const c = comps.get(root) || { keys: new Set(), edges: [], rels: new Set(), labels: [] };
    c.keys.add(e.a).add(e.b);
    c.edges.push(e);
    c.rels.add(e.rel);
    if (e.rel === "group" && e.q.group) c.labels.push(e.q.group);
    comps.set(root, c);
  }
  return [...comps.values()].map((c, i) => {
    const tally = new Map();
    for (const l of c.labels) tally.set(l, (tally.get(l) || 0) + 1);
    const label = [...tally].sort((p, q) => q[1] - p[1])[0]?.[0] || "";
    return { n: i + 1, keys: [...c.keys], edges: c.edges, rels: [...c.rels], label };
  });
}

/** Unit-word stars that have been placed but have no line: they stayed on their own. */
export function loneStars(state) {
  const joined = new Set(drawnRounds(state).flatMap((r) => [r.a, r.b]));
  const seen = new Set();
  const out = [];
  for (const r of state.rounds) {
    if (!r.mc.done) continue;
    for (const k of [r.a, r.b]) {
      const st = state.stars[k];
      if (st?.unit && !joined.has(k) && !seen.has(k)) {
        seen.add(k);
        out.push(st);
      }
    }
  }
  return out;
}


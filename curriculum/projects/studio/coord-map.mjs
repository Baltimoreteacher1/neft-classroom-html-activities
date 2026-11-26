/**
 * Coordinate map designer for the coordinates missions. Pure; no DOM.
 *
 * Two modes share one data shape (stored under `workbench.map`):
 *   park (Theme Park Map Designer): the student places attractions on a four-quadrant grid, joins them with
 *     paths made of one horizontal and one vertical leg, mirrors attractions across an axis, and the map
 *     checks the mission constraints: no two attractions on one point, every attraction inside the park
 *     fence, and a path route from the entrance gate to every attraction.
 *   sub (Submarine Mission Control): the student plots waypoints at signed depths; the route runs from the
 *     dock A through the waypoints in order to the survey target B, every leg is logged, and the route must
 *     stay at or below the surface, inside the chart, and out of the hazard zone.
 * The mission points A = (a, b) and B = (c, b) are the design numbers (single source of truth). A leg whose
 * length IS one of the mission's Test answers (A to B, A to the y-axis on its row, A to its x-axis mirror)
 * is flagged with `hidden` so the view can print "?" until that answer is checked.
 */

export const FENCE = 10;
export const LIMIT = 12;
export const MAX_ITEMS = 12;
export const MAX_PATHS = 20;

export const CATALOG = {
  gate: { mark: "G", en: "Entrance gate", es: "Entrada" },
  coaster: { mark: "RC", en: "Roller coaster", es: "Montaña rusa" },
  carousel: { mark: "C", en: "Carousel", es: "Carrusel" },
  splash: { mark: "S", en: "Splash ride", es: "Juego acuático" },
  food: { mark: "F", en: "Food stand", es: "Puesto de comida" },
  stage: { mark: "ST", en: "Show stage", es: "Escenario" },
  aid: { mark: "+", en: "First aid", es: "Primeros auxilios" },
  wp: { mark: "W", en: "Waypoint", es: "Punto de ruta" },
};
export const PARK_KINDS = ["gate", "coaster", "carousel", "splash", "food", "stage", "aid"];
export const modeOf = (project) => (project?.id === "unit-7-b" ? "sub" : "park");

const isInt = (n) => Number.isInteger(n);
const inLimit = (n) => isInt(n) && Math.abs(n) <= LIMIT;
const elbowOf = (e) => (e === "v" ? "v" : "h");
export const empty = (mode = "park") => ({ mode, items: [], paths: [], endElbow: "h" });

/** Validate stored map data. Malformed entries are dropped; nothing here throws. */
export function cleanMap(raw) {
  const mode = raw?.mode === "sub" ? "sub" : "park";
  const out = empty(mode);
  if (!raw || typeof raw !== "object") return out;
  out.endElbow = elbowOf(raw.endElbow);
  const seen = new Set();
  for (const it of Array.isArray(raw.items) ? raw.items.slice(0, MAX_ITEMS) : []) {
    if (!it || typeof it.id !== "string" || !/^p\d{1,3}$/.test(it.id) || seen.has(it.id)) continue;
    const okKind = mode === "sub" ? it.kind === "wp" : PARK_KINDS.includes(it.kind);
    if (!okKind || !inLimit(it.x) || !inLimit(it.y)) continue;
    seen.add(it.id);
    const item = { id: it.id, kind: it.kind, x: it.x, y: it.y };
    if (mode === "sub") item.elbow = elbowOf(it.elbow);
    if (typeof it.mirrorOf === "string" && (it.axis === "x" || it.axis === "y")) Object.assign(item, { mirrorOf: it.mirrorOf, axis: it.axis });
    out.items.push(item);
  }
  for (const it of out.items) if (it.mirrorOf && !seen.has(it.mirrorOf)) (delete it.mirrorOf, delete it.axis);
  if (mode === "park") {
    const nodes = new Set(["A", "B", ...seen]);
    const pathIds = new Set();
    const pairs = new Set();
    for (const p of Array.isArray(raw.paths) ? raw.paths.slice(0, MAX_PATHS) : []) {
      if (!p || typeof p.id !== "string" || !/^r\d{1,3}$/.test(p.id) || pathIds.has(p.id)) continue;
      if (!nodes.has(p.from) || !nodes.has(p.to) || p.from === p.to) continue;
      const key = [p.from, p.to].sort().join("|");
      if (pairs.has(key)) continue;
      pathIds.add(p.id);
      pairs.add(key);
      out.paths.push({ id: p.id, from: p.from, to: p.to, elbow: elbowOf(p.elbow) });
    }
  }
  return out;
}

/** Mission points from the Studio's model values (null when the design is invalid). */
export function pointsOf(values) {
  if (!values) return null;
  const { a, b, c } = values;
  if (![a, b, c].every((n) => isInt(n) && Math.abs(n) <= FENCE)) return null;
  return { A: { x: a, y: b }, B: { x: c, y: b }, a, b, c };
}

export function pointOf(id, data, pts) {
  if (id === "A") return pts.A;
  if (id === "B") return pts.B;
  const it = data.items.find((x) => x.id === id);
  return it ? { x: it.x, y: it.y } : null;
}

const same = (p, q) => p.x === q.x && p.y === q.y;

/** Which Test answer a straight trip between two points would print, or null. Compared by coordinates. */
export function hiddenFor(p, q, pts) {
  const { A, B, a, b } = pts;
  if (same(p, q)) return null;
  const pair = (u, v) => (same(p, u) && same(q, v)) || (same(p, v) && same(q, u));
  if (pair(A, B)) return "distance";
  if (a !== 0 && pair(A, { x: 0, y: b })) return "a-zero";
  if (b !== 0 && pair(A, { x: a, y: -b })) return "opposite";
  return null;
}

/**
 * The legs of a trip from p to q: elbow "h" goes horizontally first, "v" vertically first.
 * Each leg is a distance across one axis: |to − from|, which is |from| + |to| when the leg crosses zero.
 */
export function legsOf(p, q, elbow = "h") {
  const corner = elbow === "v" ? { x: p.x, y: q.y } : { x: q.x, y: p.y };
  const seg = (u, v) => {
    const axis = u.y === v.y ? "x" : "y";
    const from = axis === "x" ? u.x : u.y;
    const to = axis === "x" ? v.x : v.y;
    return { axis, from, to, fixed: axis === "x" ? u.y : u.x, length: Math.abs(to - from), crossesZero: from * to < 0 };
  };
  return [seg(p, corner), seg(corner, q)].filter((s) => s.length > 0);
}

/** "|6 − (−4)| = 10" plus the through-zero split "4 + 6 = 10" when the leg crosses an axis. */
export function legText(leg, show = true) {
  const s = (n) => String(n).replace("-", "−");
  const sub = `|${s(leg.to)} − ${leg.from < 0 ? `(${s(leg.from)})` : s(leg.from)}|`;
  if (!show) return `${sub} = ?`;
  return leg.crossesZero ? `${sub} = ${Math.abs(leg.from)} + ${Math.abs(leg.to)} = ${leg.length}` : `${sub} = ${leg.length}`;
}

export const reflect = (p, axis) => (axis === "y" ? { x: -p.x, y: p.y } : { x: p.x, y: -p.y });

/** Hazard zone for the sub mission: an open box across A's row, strictly between A and B. */
export function hazardOf(pts) {
  const { a, b, c } = pts;
  if (a !== c) {
    const mid = (a + c) / 2;
    const half = Math.abs(c - a) >= 3 ? 1 : 0.5;
    return { x0: mid - half, x1: mid + half, y0: b - 1.5, y1: b + 1.5 };
  }
  const x = a + 2.5 <= FENCE ? a + 2 : a - 2;
  return { x0: x - 0.5, x1: x + 0.5, y0: b - 1.5, y1: b + 1.5 };
}

/** Does an axis-aligned leg pass through the open hazard box? Touching its edge is allowed. */
export function legHitsHazard(leg, hz) {
  const lo = Math.min(leg.from, leg.to), hi = Math.max(leg.from, leg.to);
  if (leg.axis === "x") return leg.fixed > hz.y0 && leg.fixed < hz.y1 && lo < hz.x1 && hi > hz.x0;
  return leg.fixed > hz.x0 && leg.fixed < hz.x1 && lo < hz.y1 && hi > hz.y0;
}

/** Ordered trips of the sub route: A → waypoints → B. Each item carries the elbow of the trip that reaches it. */
export function routeTrips(data, pts) {
  const stops = [{ id: "A", ...pts.A }, ...data.items.map((it) => ({ id: it.id, x: it.x, y: it.y, elbow: it.elbow })), { id: "B", ...pts.B, elbow: data.endElbow }];
  return stops.slice(1).map((to, i) => ({ from: stops[i].id, to: to.id, p: stops[i], q: to, elbow: to.elbow || "h" }));
}

const inFence = (p) => Math.abs(p.x) <= FENCE && Math.abs(p.y) <= FENCE;

/** Judge the map against the mission constraints. */
export function evaluate(data, pts) {
  const nodes = [{ id: "A", ...pts.A }, { id: "B", ...pts.B }, ...data.items.map((it) => ({ id: it.id, x: it.x, y: it.y }))];
  const clashes = new Set();
  nodes.forEach((n, i) => nodes.forEach((m, j) => { if (i < j && same(n, m)) (clashes.add(n.id), clashes.add(m.id)); }));
  const outside = nodes.filter((n) => (data.mode === "sub" ? !inFence(n) || n.y > 0 : !inFence(n))).map((n) => n.id);
  const base = { distinct: clashes.size === 0, clashes: [...clashes], inside: outside.length === 0, outside };
  if (data.mode === "sub") {
    const hz = hazardOf(pts);
    const trips = routeTrips(data, pts).map((t) => {
      const legs = legsOf(t.p, t.q, t.elbow);
      const hits = legs.some((l) => legHitsHazard(l, hz));
      return { ...t, legs, length: legs.reduce((s, l) => s + l.length, 0), hits, hidden: hiddenFor(t.p, t.q, pts) };
    });
    const total = trips.reduce((s, t) => s + t.length, 0);
    return { ...base, hazard: hz, trips, total, safe: trips.every((t) => !t.hits), ok: base.distinct && base.inside && trips.every((t) => !t.hits) };
  }
  const paths = data.paths.map((p) => {
    const P = pointOf(p.from, data, pts), Q = pointOf(p.to, data, pts);
    const legs = legsOf(P, Q, p.elbow);
    return { ...p, legs, length: legs.reduce((s, l) => s + l.length, 0), hidden: hiddenFor(P, Q, pts) };
  });
  const gates = data.items.filter((it) => it.kind === "gate");
  const reached = new Set(gates.length ? [gates[0].id] : []);
  for (let grew = true; grew; ) {
    grew = false;
    for (const p of data.paths)
      for (const [u, v] of [[p.from, p.to], [p.to, p.from]]) if (reached.has(u) && !reached.has(v)) (reached.add(v), (grew = true));
  }
  const unreached = nodes.filter((n) => !reached.has(n.id)).map((n) => n.id);
  const mirrors = data.items.filter((it) => it.mirrorOf).map((it) => {
    const src = data.items.find((x) => x.id === it.mirrorOf);
    return { id: it.id, of: it.mirrorOf, axis: it.axis, holds: !!src && same(reflect(src, it.axis), it) };
  });
  const oneGate = gates.length === 1;
  return { ...base, paths, oneGate, gates: gates.length, unreached, routes: oneGate && unreached.length === 0, mirrors, ok: base.distinct && base.inside && oneGate && unreached.length === 0 };
}

const nextId = (list, prefix) => `${prefix}${list.reduce((top, x) => Math.max(top, Number(x.id.slice(1))), 0) + 1}`;
const taken = (data, pts, x, y) => same(pts.A, { x, y }) || same(pts.B, { x, y }) || data.items.some((it) => it.x === x && it.y === y);

/** Add an attraction or waypoint at the free grid point nearest a sensible start, or report why not. */
export function addItem(data, kind, pts) {
  if (data.items.length >= MAX_ITEMS) return { error: "full" };
  const sub = data.mode === "sub";
  if (sub ? kind !== "wp" : !PARK_KINDS.includes(kind)) return { error: "unknown" };
  const start = sub ? { x: Math.round((pts.a + pts.c) / 2), y: Math.max(-FENCE, Math.min(0, pts.b - 3)) } : kind === "gate" ? { x: 0, y: -FENCE } : { x: 0, y: 0 };
  for (let r = 0; r <= 2 * FENCE; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = start.x + dx, y = start.y + dy;
        if (Math.abs(x) > FENCE || Math.abs(y) > FENCE || (sub && y > 0) || taken(data, pts, x, y)) continue;
        const item = { id: nextId(data.items, "p"), kind, x, y, ...(sub ? { elbow: "h" } : {}) };
        return { data: { ...data, items: [...data.items, item] }, item };
      }
  return { error: "no-room" };
}

const clampL = (n) => Math.max(-LIMIT, Math.min(LIMIT, Math.round(n)));
export const moveItem = (data, id, x, y) => ({ ...data, items: data.items.map((it) => (it.id === id ? { ...it, x: clampL(x), y: clampL(y) } : it)) });
export const nudgeItem = (data, id, dx, dy) => {
  const it = data.items.find((x) => x.id === id);
  return it ? moveItem(data, id, it.x + dx, it.y + dy) : data;
};
export function removeItem(data, id) {
  return {
    ...data,
    items: data.items.filter((it) => it.id !== id).map((it) => (it.mirrorOf === id ? (({ mirrorOf, axis, ...rest }) => rest)(it) : it)),
    paths: data.paths.filter((p) => p.from !== id && p.to !== id),
  };
}
/** Place a mirror image of an attraction across an axis ("y" flips x, "x" flips y). Mission points are not mirrored here. */
export function mirrorItem(data, id, axis, pts) {
  const src = data.items.find((x) => x.id === id);
  if (!src) return { error: "unknown" };
  if (data.items.length >= MAX_ITEMS) return { error: "full" };
  const at = reflect(src, axis);
  if (same(at, src)) return { error: "on-axis" };
  if (taken(data, pts, at.x, at.y)) return { error: "taken" };
  const item = { id: nextId(data.items, "p"), kind: src.kind, ...at, mirrorOf: id, axis };
  return { data: { ...data, items: [...data.items, item] }, item };
}
export function addPath(data, from, to) {
  if (from === to) return { error: "same" };
  if (data.paths.length >= MAX_PATHS) return { error: "full" };
  if (data.paths.some((p) => [p.from, p.to].sort().join("|") === [from, to].sort().join("|"))) return { error: "exists" };
  const path = { id: nextId(data.paths, "r"), from, to, elbow: "h" };
  return { data: { ...data, paths: [...data.paths, path] }, path };
}
export const flipPath = (data, id) => ({ ...data, paths: data.paths.map((p) => (p.id === id ? { ...p, elbow: p.elbow === "h" ? "v" : "h" } : p)) });
export const removePath = (data, id) => ({ ...data, paths: data.paths.filter((p) => p.id !== id) });
/** Sub route: flip the elbow of the trip that reaches an item (or B with id "B"). */
export const flipTrip = (data, id) =>
  id === "B" ? { ...data, endElbow: data.endElbow === "h" ? "v" : "h" } : { ...data, items: data.items.map((it) => (it.id === id ? { ...it, elbow: it.elbow === "v" ? "h" : "v" } : it)) };
/** Sub route: move a waypoint earlier (−1) or later (+1) in the route order. */
export function reorder(data, id, dir) {
  const i = data.items.findIndex((it) => it.id === id), j = i + dir;
  if (i < 0 || j < 0 || j >= data.items.length) return data;
  const items = [...data.items];
  [items[i], items[j]] = [items[j], items[i]];
  return { ...data, items };
}

export const nameOf = (id, data, lang = "en") => {
  if (id === "A" || id === "B") {
    const sub = data.mode === "sub";
    const n = id === "A" ? (sub ? ["Dock A", "Muelle A"] : ["Starting attraction A", "Atracción inicial A"]) : sub ? ["Survey target B", "Objetivo B"] : ["Destination attraction B", "Atracción destino B"];
    return n[lang === "es" ? 1 : 0];
  }
  const it = data.items.find((x) => x.id === id);
  if (!it) return id;
  const sameKind = data.items.filter((x) => x.kind === it.kind);
  const base = CATALOG[it.kind][lang === "es" ? "es" : "en"];
  return sameKind.length > 1 ? `${base} ${sameKind.indexOf(it) + 1}` : base;
};
const pt = (p) => `(${p.x}, ${p.y})`.replaceAll("-", "−");
const QUESTION = { distance: "the A-to-B distance", "a-zero": "A's distance from zero", opposite: "the A-to-mirror distance" };

/** Plain-text lines for the downloadable defense report. A leg that is a Test answer is described, never computed. */
export function mapReport(data, values, fmt = String) {
  const pts = pointsOf(values);
  if (!pts || (!data.items.length && !data.paths.length)) return [];
  const v = evaluate(data, pts);
  const yes = (b) => (b ? "yes" : "NO");
  const len = (x) => (x.hidden ? `length = your Test answer for ${QUESTION[x.hidden]}` : `${fmt(x.length)} units`);
  if (data.mode === "sub") {
    const hidden = v.trips.some((t) => t.hidden) || v.total === Math.abs(pts.c - pts.a);
    return [
      "SUBMARINE ROUTE LOG",
      ...v.trips.map((t, i) => `${i + 1}. ${nameOf(t.from, data)} ${pt(t.p)} to ${nameOf(t.to, data)} ${pt(t.q)}: ${len(t)}${t.hits ? " (enters the hazard zone)" : ""}`),
      hidden ? "Total route: uses a Test answer" : `Total route: ${fmt(v.total)} units`,
      `At or below the surface and inside the chart: ${yes(v.inside)} · No repeated point: ${yes(v.distinct)} · Hazard avoided: ${yes(v.safe)}`,
      "",
    ];
  }
  return [
    "THEME PARK MAP",
    ...data.items.map((it) => `- ${nameOf(it.id, data)} at ${pt(it)}${it.mirrorOf ? ` (mirror of ${nameOf(it.mirrorOf, data)} across the ${it.axis}-axis)` : ""}`),
    ...v.paths.map((p) => `Path ${nameOf(p.from, data)} to ${nameOf(p.to, data)}: ${len(p)}`),
    `No shared points: ${yes(v.distinct)} · Inside the park fence: ${yes(v.inside)} · One gate with a route to every attraction: ${yes(v.routes)}`,
    "",
  ];
}

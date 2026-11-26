// Graph diagrams: a to-scale timeline and a food web. Positions are computed from the data (years, or the
// relationship graph), never typed in.

import {
  CAPS,
  COLOR,
  DiagramError,
  axisTicks,
  both,
  esc,
  f1,
  fail,
  fmt,
  frame,
  intIn,
  langOf,
  line,
  listIn,
  result,
  text,
  textIn,
  textWidth,
  wrap,
} from "./diagram-kit.js";

// ── timeline ─────────────────────────────────────────────────────────────────

const TW = 960;
const TMARGIN = 70;
const LINE_H = 17;
const MAX_LEVELS = 6;

const yearText = (y, lang) => (y < 0 ? `${-y} ${lang === "es" ? "a. C." : "BCE"}` : String(y));
const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Events sit at x proportional to their year. Labels are staggered over up to six levels above and below the axis;
 * a label is only placed where neither its box nor its leader line touches another label or leader line.
 * Negative years are BCE.
 * @param {{events:Array<{year:number,label:string}>, lang?:string}} spec
 */
export function timelineSvg(spec = {}) {
  const lang = langOf(spec);
  const raw = listIn(spec.events, "events", { min: 2, max: CAPS.events });
  const events = raw.map((e, i) => ({
    year: intIn(e?.year, `events[${i}].year`, { min: -100000, max: 100000 }),
    label: textIn(e?.label, `events[${i}].label`, { max: 60 }),
    order: i,
  }));
  const years = events.map((e) => e.year);
  const lo = Math.min(...years);
  const hi = Math.max(...years);
  if (lo === hi) fail("one-year", "A timeline needs at least two different years.");
  const px = (y) => TMARGIN + ((y - lo) / (hi - lo)) * (TW - 2 * TMARGIN);
  const sorted = [...events].sort((a, b) => a.year - b.year || a.order - b.order);
  const items = sorted.map((e) => {
    const lines = [yearText(e.year, lang), ...wrap(e.label, 18)];
    if (lines.length > 5)
      fail("label-too-long", `The label "${e.label}" is too long for a timeline.`);
    return {
      ...e,
      x: px(e.year),
      lines,
      w: Math.max(...lines.map((s, i) => textWidth(s, 14, i === 0))) + 14,
    };
  });
  const maxLines = Math.max(...items.map((i) => i.lines.length));
  const boxH = maxLines * LINE_H + 8;
  const band = boxH + 16;
  const GAP = 20;
  const placed = [];
  const slots = [];
  for (let lv = 0; lv < MAX_LEVELS; lv++) slots.push({ side: -1, lv }, { side: 1, lv });
  // Depth-first search with backtracking: an early label may have to slide away so a later event's leader line
  // can reach the axis. The step cap keeps the worst case bounded; hitting it is reported as "crowded".
  let steps = 0;
  const options = items.map((it) => {
    const xs = [it.x - it.w / 2, it.x - 12, it.x - it.w + 12].map((x) => Math.min(TW - 6 - it.w, Math.max(6, x)));
    const list = [];
    for (const s of slots)
      for (const bx of xs) {
        if (it.x < bx + 6 || it.x > bx + it.w - 6) continue;
        const reach = GAP + s.lv * band; // distance from the axis to the nearest edge of the box
        list.push({
          it,
          side: s.side,
          lv: s.lv,
          box: { x: bx, y: s.side < 0 ? -(reach + boxH) : reach, w: it.w, h: boxH },
          leader: { x: it.x - 3, w: 6, y: s.side < 0 ? -reach : 0, h: reach },
        });
      }
    return list;
  });
  const search = (i) => {
    if (i === items.length) return true;
    for (const c of options[i]) {
      if (++steps > 60000) return false;
      if (placed.every((p) => !hit(c.box, p.box) && !hit(c.box, p.leader) && !hit(c.leader, p.box) && !hit(c.leader, p.leader))) {
        placed.push(c);
        if (search(i + 1)) return true;
        placed.pop();
      }
    }
    return false;
  };
  if (!search(0)) fail("timeline-crowded", "Too many events share nearly the same years to label without overlap. Remove or merge some events.");
  const above = Math.max(0, ...placed.filter((p) => p.side < 0).map((p) => p.lv + 1));
  const below = Math.max(0, ...placed.filter((p) => p.side > 0).map((p) => p.lv + 1));
  const axisY = 14 + (above ? GAP + above * band : 0);
  const h = axisY + (below ? GAP + below * band : 0) + 24;
  const tick = axisTicks(lo, hi, { target: 12 });
  const g = [line(TMARGIN - 30, axisY, TW - TMARGIN + 30, axisY, { width: 3 })];
  for (const t of tick.ticks)
    if (t >= lo - 1e-9 && t <= hi + 1e-9)
      g.push(line(px(t), axisY - 5, px(t), axisY + 5, { stroke: COLOR.muted, width: 1.5 }));
  const out = placed.map((p) => {
    const box = { ...p.box, y: p.box.y + axisY };
    const leaderEnd = p.side < 0 ? box.y + box.h : box.y;
    g.push(line(p.it.x, axisY, p.it.x, leaderEnd, { stroke: COLOR.muted, width: 1.5 }));
    g.push(
      `<rect data-event="${p.it.order + 1}" x="${f1(box.x)}" y="${f1(box.y)}" width="${f1(box.w)}" height="${f1(box.h)}" rx="4" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="1.5"/>`,
    );
    p.it.lines.forEach((s, i) =>
      g.push(
        text(box.x + 7, box.y + 5 + (i + 1) * LINE_H - 4, s, {
          size: 14,
          weight: i === 0 ? "700" : "400",
        }),
      ),
    );
    g.push(
      `<circle cx="${f1(p.it.x)}" cy="${axisY}" r="6.5" fill="${COLOR.ink}" stroke="${COLOR.white}" stroke-width="2"/>`,
    );
    return { year: p.it.year, label: p.it.label, x: p.it.x, box, level: p.side * (p.lv + 1) };
  });
  const byInput = [...out].sort(
    (a, b) =>
      events.findIndex((e) => e.year === a.year && e.label === a.label) -
      events.findIndex((e) => e.year === b.year && e.label === b.label),
  );
  const span = hi - lo;
  const alt = both((l) =>
    l === "es"
      ? `Línea de tiempo a escala con ${events.length} sucesos, de ${yearText(lo, l)} a ${yearText(hi, l)}. Primero: ${sorted[0].label}. Último: ${sorted[sorted.length - 1].label}.`
      : `To-scale timeline of ${events.length} events from ${yearText(lo, l)} to ${yearText(hi, l)}. First: ${sorted[0].label}. Last: ${sorted[sorted.length - 1].label}.`,
  );
  return result({
    svg: frame({
      p: "tl",
      w: TW,
      h,
      title: alt[lang],
      desc: `${alt[lang]} ${lang === "es" ? `Las marcas están cada ${fmt(tick.step, lang)} años.` : `Tick marks are ${fmt(tick.step)} years apart.`}`,
      lang,
      body: g.join(""),
    }),
    alt,
    caption: both((l) =>
      l === "es"
        ? `Línea de tiempo a escala (${fmt(span, l)} años)`
        : `Timeline drawn to scale (${fmt(span)} years)`,
    ),
    data: {
      events: out.sort((a, b) => a.year - b.year),
      inputOrder: byInput,
      minYear: lo,
      maxYear: hi,
      tickStep: tick.step,
      axis: { x0: px(lo), x1: px(hi), y: axisY, pxPerYear: (TW - 2 * TMARGIN) / span },
    },
    table: {
      headers: [lang === "es" ? "Año" : "Year", lang === "es" ? "Suceso" : "Event"],
      rows: sorted.map((e) => [yearText(e.year, lang), e.label]),
    },
  });
}

// ── food web ─────────────────────────────────────────────────────────────────

const CONSUMERS = {
  en: ["", "", "primary consumers", "secondary consumers", "tertiary consumers"],
  es: ["", "", "consumidores primarios", "consumidores secundarios", "consumidores terciarios"],
};
/** The two small lines written beside a trophic layer. */
const levelName = (n, lang) =>
  n === 1
    ? { head: lang === "es" ? "Productores" : "Producers", sub: lang === "es" ? "no comen a otros" : "eat nothing here" }
    : {
        head: lang === "es" ? `Nivel ${n}` : `Level ${n}`,
        sub: CONSUMERS[lang][n] ?? (lang === "es" ? "consumidores" : "consumers"),
      };

/** Finds a cycle in `eats` (name -> Set of foods) or returns null. */
function findCycle(eats) {
  const state = new Map();
  const stack = [];
  const visit = (n) => {
    state.set(n, 1);
    stack.push(n);
    for (const f of eats.get(n) ?? []) {
      if (state.get(f) === 1) return [...stack.slice(stack.indexOf(f)), f];
      if (!state.get(f)) {
        const c = visit(f);
        if (c) return c;
      }
    }
    stack.pop();
    state.set(n, 2);
    return null;
  };
  for (const n of eats.keys())
    if (!state.get(n)) {
      const c = visit(n);
      if (c) return c;
    }
  return null;
}

const segHitsRect = (pts, r) =>
  pts.some(([x, y]) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h);

/**
 * Nodes sit in trophic layers: producers (animals and plants that eat nothing) are layer 1, and any other
 * organism is one layer above the highest layer of anything it eats (the longest food chain beneath it).
 * Arrows point from the eaten organism to the one that eats it. A cycle is an error and is reported by name.
 * @param {{relationships:Array<{eats:string,eaten:string}>, lang?:string}} spec
 */
export function foodWebSvg(spec = {}) {
  const lang = langOf(spec);
  const raw = listIn(spec.relationships, "relationships", { min: 1, max: CAPS.edges });
  const names = new Map(); // lowercase key -> display name (first spelling wins)
  const norm = (v, label) => {
    const s = textIn(v, label, { max: 28 });
    const k = s.toLowerCase();
    if (!names.has(k)) names.set(k, s);
    return k;
  };
  const edgeKeys = new Set();
  const edges = [];
  let duplicates = 0;
  raw.forEach((r, i) => {
    const eater = norm(r?.eats, `relationships[${i}].eats`);
    const food = norm(r?.eaten, `relationships[${i}].eaten`);
    if (eater === food)
      fail("cycle", `${names.get(eater)} cannot eat itself.`, {
        cycle: [names.get(eater), names.get(eater)],
      });
    const id = `${food}>${eater}`;
    if (edgeKeys.has(id)) return void duplicates++;
    edgeKeys.add(id);
    edges.push({ food, eater });
  });
  if (names.size > CAPS.nodes)
    fail("too-many", `The web has ${names.size} organisms; the limit is ${CAPS.nodes}.`);
  const eats = new Map([...names.keys()].map((k) => [k, new Set()]));
  for (const e of edges) eats.get(e.eater).add(e.food);
  const cyc = findCycle(eats);
  if (cyc) {
    const shown = cyc.map((k) => names.get(k));
    throw new DiagramError(
      "cycle",
      `A food web cannot have a loop: ${shown
        .map((n, i) => (i < shown.length - 1 ? `${n} eats ${shown[i + 1]}` : ""))
        .filter(Boolean)
        .join(", ")}.`,
      { cycle: shown },
    );
  }
  const layerOf = new Map();
  const layer = (k) => {
    if (layerOf.has(k)) return layerOf.get(k);
    const foods = [...eats.get(k)];
    const v = foods.length ? 1 + Math.max(...foods.map(layer)) : 1;
    layerOf.set(k, v);
    return v;
  };
  for (const k of names.keys()) layer(k);
  const top = Math.max(...layerOf.values());
  const rows = Array.from({ length: top }, (_, i) =>
    [...names.keys()].filter((k) => layerOf.get(k) === i + 1),
  );

  // order within layers: barycenter sweeps against neighbouring layers (deterministic, stable)
  const neighbours = (k) => [
    ...edges.filter((e) => e.eater === k).map((e) => e.food),
    ...edges.filter((e) => e.food === k).map((e) => e.eater),
  ];
  const idx = new Map();
  const reindex = () =>
    rows.forEach((r) => r.forEach((k, i) => idx.set(k, i / Math.max(1, r.length - 1))));
  reindex();
  for (let pass = 0; pass < 6; pass++) {
    for (const r of pass % 2 ? [...rows].reverse() : rows) {
      const score = (k) => {
        const ns = neighbours(k).filter((n) => layerOf.get(n) !== layerOf.get(k));
        return ns.length ? ns.reduce((s, n) => s + idx.get(n), 0) / ns.length : idx.get(k);
      };
      const before = [...r];
      r.sort((a, b) => score(a) - score(b) || before.indexOf(a) - before.indexOf(b));
      reindex();
    }
  }

  const NH = 34;
  const GAPY = 110;
  const left = 150;
  const nodeW = (k) => textWidth(names.get(k), 15, true) + 26;
  const rowW = rows.map(
    (r) => r.reduce((s, k) => s + nodeW(k), 0) + Math.max(0, r.length - 1) * 28,
  );
  const W = Math.max(640, left + Math.max(...rowW) + 30);
  const H = 40 + (top - 1) * GAPY + NH + 40;
  const pos = new Map();
  rows.forEach((r, i) => {
    const y = H - 40 - NH - i * GAPY;
    const avail = W - left - 20;
    const sumW = rowW[i] - Math.max(0, r.length - 1) * 28;
    const gap = r.length > 1 ? Math.min(120, Math.max(28, (avail - sumW) / (r.length - 1))) : 0;
    let x = left + (avail - (sumW + gap * Math.max(0, r.length - 1))) / 2;
    for (const k of r) {
      pos.set(k, { x, y, w: nodeW(k), h: NH });
      x += nodeW(k) + gap;
    }
  });
  const g = [];
  const warnings = [];
  const rects = [...pos.entries()];
  const defs = `<marker id="fw-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${COLOR.ink}"/></marker>`;
  const drawn = edges.map((e) => {
    const a = pos.get(e.food);
    const b = pos.get(e.eater);
    const x1 = a.x + a.w / 2;
    const y1 = a.y;
    const x2 = b.x + b.w / 2;
    const y2 = b.y + b.h + 2;
    const others = rects.filter(([k]) => k !== e.food && k !== e.eater).map(([, r]) => r);
    let pathD = `M${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)}`;
    let clean = false;
    for (const off of [0, 60, -60, 120, -120, 200, -200, 300, -300]) {
      const cx = (x1 + x2) / 2 + off;
      const cy = (y1 + y2) / 2;
      const pts = Array.from({ length: 25 }, (_, i) => {
        const t = i / 24;
        return [
          (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t * t * x2,
          (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t * t * y2,
        ];
      });
      if (!others.some((r) => segHitsRect(pts, r))) {
        pathD = off === 0 ? pathD : `M${f1(x1)} ${f1(y1)} Q${f1(cx)} ${f1(cy)} ${f1(x2)} ${f1(y2)}`;
        clean = true;
        break;
      }
    }
    if (!clean)
      warnings.push({
        en: `The arrow from ${names.get(e.food)} to ${names.get(e.eater)} passes behind another organism.`,
        es: `La flecha de ${names.get(e.food)} a ${names.get(e.eater)} pasa por detrás de otro organismo.`,
      });
    g.push(
      `<path data-eaten="${esc(names.get(e.food))}" data-eater="${esc(names.get(e.eater))}" d="${pathD}" fill="none" stroke="${COLOR.ink}" stroke-width="1.8" marker-end="url(#fw-arrow)"/>`,
    );
    return { eaten: names.get(e.food), eater: names.get(e.eater) };
  });
  rows.forEach((_, i) => {
    const y = H - 40 - NH - i * GAPY;
    const name = levelName(i + 1, lang);
    g.push(text(10, y + NH / 2 + 5, name.head, { size: 14, weight: "700", fill: COLOR.muted }));
    g.push(text(10, y + NH / 2 + 22, name.sub, { size: 12, fill: COLOR.muted }));
  });
  for (const [k, r] of pos) {
    const producer = layerOf.get(k) === 1;
    g.push(
      `<rect data-node="${esc(names.get(k))}" data-layer="${layerOf.get(k)}" x="${f1(r.x)}" y="${f1(r.y)}" width="${f1(r.w)}" height="${r.h}" rx="${producer ? 3 : 17}" fill="${COLOR.white}" stroke="${COLOR.ink}" stroke-width="${producer ? 3 : 1.8}"/>`,
    );
    g.push(
      text(r.x + r.w / 2, r.y + 22, names.get(k), { size: 15, anchor: "middle", weight: "700" }),
    );
  }
  const nodes = [...pos].map(([k, r]) => ({
    name: names.get(k),
    layer: layerOf.get(k),
    x: r.x,
    y: r.y,
    w: r.w,
    h: r.h,
  }));
  const eatenBy = new Set(edges.map((e) => e.food));
  const alt = both((l) =>
    l === "es"
      ? `Red alimentaria con ${nodes.length} organismos en ${top} nivel${top === 1 ? "" : "es"}. Las flechas van del organismo que es comido al que lo come.`
      : `Food web of ${nodes.length} organisms in ${top} level${top === 1 ? "" : "s"}. Arrows point from the organism that is eaten to the one that eats it.`,
  );
  return result({
    svg: frame({
      p: "fw",
      w: W,
      h: H,
      title: alt[lang],
      desc: `${alt[lang]} ${lang === "es" ? "Los productores tienen borde grueso y esquinas cuadradas; los consumidores, esquinas redondeadas." : "Producers have a thick border and square corners; consumers have rounded corners."}`,
      lang,
      defs,
      body: g.join(""),
    }),
    alt,
    caption: both((l) =>
      l === "es"
        ? "Red alimentaria (las flechas muestran a dónde va la energía)"
        : "Food web (arrows show where energy goes)",
    ),
    data: {
      nodes,
      layers: rows.map((r) => r.map((k) => names.get(k))),
      edges: drawn,
      producers: nodes.filter((n) => n.layer === 1).map((n) => n.name),
      topConsumers: nodes
        .filter((n) => !eatenBy.has([...names].find(([, v]) => v === n.name)[0]))
        .map((n) => n.name),
      duplicatesIgnored: duplicates,
      review: warnings,
    },
    table: {
      headers: [lang === "es" ? "Organismo" : "Organism", lang === "es" ? "Nivel" : "Level"],
      rows: nodes.map((n) => [n.name, String(n.layer)]),
    },
  });
}

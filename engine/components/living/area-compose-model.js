// living/area-compose-model.js — the mathematics of the area-compose play.
//
// Pure functions only (no DOM): every number and sentence the play shows is
// computed here, so area-compose.test.mjs can recompute each one in node.
//
// A composite figure is rectangles joined (add their areas) or a rectangle with
// a piece cut out (subtract). The same L-shaped room splits three ways — two
// stacked rectangles, two side-by-side rectangles, or a big rectangle minus the
// missing corner — and all three give one area. Geometry is in unit squares
// with y UP.

import { okInt, placeCorrect } from "./mean-balance-model.js";

export { placeCorrect };

export const MAX_SIDE = 24;

/** The L: `base` w × h at the bottom-left, `arm` w × h stacked on its top-left corner. */
export function readL(cfg) {
  const rect = (r, lo) =>
    okInt(Number(r?.w), lo, MAX_SIDE) && okInt(Number(r?.h), 1, MAX_SIDE)
      ? { w: Number(r.w), h: Number(r.h) }
      : null;
  const base = rect(cfg?.base, 2);
  const arm = rect(cfg?.arm, 1);
  if (!base || !arm || arm.w >= base.w || base.h + arm.h > MAX_SIDE) return null;
  return { base, arm, H: base.h + arm.h };
}

const rect = (x, y, w, h, kind = "add") => ({ x, y, w, h, kind });
export const areaOf = (r) => r.w * r.h;
/** A piece list's area: joined pieces add, cut pieces subtract. */
export const total = (pieces) =>
  pieces.reduce((s, r) => s + (r.kind === "cut" ? -areaOf(r) : areaOf(r)), 0);

/** The three ways to split the L; each is a list of rectangles (kind "add" | "cut"). */
export function cutsOf(L) {
  const { base, arm, H } = L;
  return {
    stack: [rect(0, 0, base.w, base.h), rect(0, base.h, arm.w, arm.h)],
    side: [rect(0, 0, arm.w, H), rect(arm.w, 0, base.w - arm.w, base.h)],
    fill: [rect(0, 0, base.w, H), rect(arm.w, base.h, base.w - arm.w, arm.h, "cut")],
  };
}

/** The transfer figure: an outer rectangle with a rectangle cut out of it. */
export function readPool(p) {
  const n = (v, lo, hi) => (okInt(Number(v), lo, hi) ? Number(v) : null);
  const [ow, oh] = [n(p?.outer?.w, 3, MAX_SIDE), n(p?.outer?.h, 3, MAX_SIDE)];
  const c = p?.cut;
  const [cx, cy, cw, ch] = [
    n(c?.x, 0, MAX_SIDE),
    n(c?.y, 0, MAX_SIDE),
    n(c?.w, 1, MAX_SIDE),
    n(c?.h, 1, MAX_SIDE),
  ];
  if ([ow, oh, cx, cy, cw, ch].includes(null)) return null;
  if (cx + cw > ow || cy + ch > oh || cw * ch >= ow * oh) return null;
  // Room for the pool's own label: a band at least two units tall above or below the cutout.
  if (cy < 2 && oh - (cy + ch) < 2) return null;
  return { pieces: [rect(0, 0, ow, oh), rect(cx, cy, cw, ch, "cut")], W: ow, H: oh };
}

const textPair = (p, max = 400) =>
  p && typeof p.en === "string" && p.en.trim()
    ? { en: p.en.slice(0, max), es: String(p.es || p.en).slice(0, max) }
    : null;
export function readUnit(u) {
  const s = (p, max, d) => textPair(p, max) ?? d;
  return {
    abbr: s(u?.abbr, 12, { en: "units", es: "unidades" }),
    sq: s(u?.sq, 30, { en: "square units", es: "unidades cuadradas" }),
  };
}

/** The pool of lessons-in-waiting: the lesson family's own U-shaped pool. */
const FALLBACK_POOL = { outer: { w: 14, h: 10 }, cut: { x: 4, y: 6, w: 6, h: 4 } };

export function validateAreaCompose(cfg) {
  const L = readL(cfg);
  if (!L) return null;
  const unit = readUnit(cfg.unit);
  const t = cfg.transfer;
  const pool = readPool(t) ?? readPool(FALLBACK_POOL);
  const own = readPool(t) ? t : FALLBACK_POOL;
  return {
    L,
    unit,
    story: textPair(cfg.story),
    cuts: cutsOf(L),
    pool: {
      ...pool,
      unit: readPool(t) && t.unit ? readUnit(t.unit) : unit,
      story: textPair(own.story),
    },
  };
}

/** The choices for "what is the area?" on the L: the area plus real misconceptions. */
export function lChoices(L) {
  const { base, arm, H } = L;
  const T = areaOf(rect(0, 0, base.w, base.h)) + areaOf(rect(0, 0, arm.w, arm.h));
  const cands = [
    ["box", base.w * H],
    ["mult", areaOf(base) * areaOf(arm)],
    ["sides", base.w + base.h + arm.w + arm.h],
  ];
  return pickChoices(T, cands);
}

/** The choices for the pool: the area plus add-the-cutout, outer-only and cutout-only. */
export function poolChoices(pool) {
  const [outer, cut] = pool.pieces.map(areaOf);
  return pickChoices(outer - cut, [
    ["addCut", outer + cut],
    ["outer", outer],
    ["cutOnly", cut],
  ]);
}

function pickChoices(correct, cands) {
  const out = [{ kind: "correct", value: correct, correct: true }];
  for (const [kind, value] of cands)
    if (value > 0 && !out.some((o) => o.value === value)) out.push({ kind, value, correct: false });
  return out.length >= 3 ? out : null;
}

const both = (en, es) => ({ en, es });

/** Every sentence the play says, as {en, es} pairs. */
export function composeCopy(v) {
  const { L, unit, cuts, pool } = v;
  const { base, arm, H } = L;
  const [u, sq] = [unit.abbr, unit.sq];
  const [A1, A2] = cuts.stack.map(areaOf);
  const T = A1 + A2;
  const [S1, S2] = cuts.side.map(areaOf);
  const [full, notch] = cuts.fill.map(areaOf);
  const tu = pool.unit;
  const [outer, cut] = pool.pieces.map(areaOf);
  const PT = outer - cut;
  const [pw, ph] = [pool.pieces[0].w, pool.pieces[0].h];
  const [cw, ch] = [pool.pieces[1].w, pool.pieces[1].h];
  const by = (a, b, x) => ({
    en: `${a} ${x.en} by ${b} ${x.en}`,
    es: `${a} ${x.es} por ${b} ${x.es}`,
  });
  const bs = by(base.w, base.h, u);
  const as = by(arm.w, arm.h, u);
  const T2 = {
    kicker: both("See it · Try it · Explain it", "Míralo · Pruébalo · Explícalo"),
    title: both(
      "Split it, find each part, add or subtract",
      "Sepárala, halla cada parte, suma o resta",
    ),
    ariaLabel: {
      en: `An L-shaped room made of a ${bs.en} rectangle and a ${as.en} rectangle. Joined, the areas add: ${A1} + ${A2} = ${T} ${sq.en}. Filling in the missing corner and subtracting it gives ${full} − ${notch} = ${T} too.`,
      es: `Un cuarto en forma de L formado por un rectángulo de ${bs.es} y otro de ${as.es}. Unidos, las áreas se suman: ${A1} + ${A2} = ${T} ${sq.es}. Rellenar la esquina que falta y restarla da ${full} − ${notch} = ${T} también.`,
    },
    printSummary: {
      en: `An L-shaped room: a ${bs.en} rectangle (${base.w} × ${base.h} = ${A1}) joined to a ${as.en} rectangle (${arm.w} × ${arm.h} = ${A2}). Joined pieces add: ${A1} + ${A2} = ${T} ${sq.en}. Another split: ${S1} + ${S2} = ${T}. Or ${full} − ${notch} = ${T}. A cut-out piece is subtracted.`,
      es: `Un cuarto en forma de L: un rectángulo de ${bs.es} (${base.w} × ${base.h} = ${A1}) unido a uno de ${as.es} (${arm.w} × ${arm.h} = ${A2}). Las partes unidas se suman: ${A1} + ${A2} = ${T} ${sq.es}. Otra forma: ${S1} + ${S2} = ${T}. O ${full} − ${notch} = ${T}. Una parte recortada se resta.`,
    },
    scene: {
      situate: both("The room", "El cuarto"),
      predict: both("Predict", "Predice"),
      pull: both("Pull apart", "Separa"),
      connect: both("Add the parts", "Suma las partes"),
      change: both("Split it again", "Sepárala otra vez"),
      transfer: both("On your own", "Por tu cuenta"),
    },
    cutOut: both("cut out", "recorte"),
    situateSay: {
      en: `${v.story?.en ?? `An L-shaped room splits into two rectangles: one is ${bs.en}, the other is ${as.en}.`} A shape made of simpler shapes is a composite figure.`,
      es: `${v.story?.es ?? `Un cuarto en forma de L se divide en dos rectángulos: uno es de ${bs.es} y el otro es de ${as.es}.`} Una figura formada por figuras más simples es una figura compuesta.`,
    },
    predictQ: both(
      `What is the area of the whole room, in ${sq.en}?`,
      `¿Cuál es el área de todo el cuarto, en ${sq.es}?`,
    ),
    predictSay: {
      en: `Predict first. The room is one floor made of a ${bs.en} part and a ${as.en} part. How much floor does it cover?`,
      es: `Primero predice. El cuarto es un solo piso formado por una parte de ${bs.es} y otra de ${as.es}. ¿Cuánto piso cubre?`,
    },
    predictOk: both(
      `Good prediction: ${T} ${sq.en}. Now let us see why.`,
      `Buena predicción: ${T} ${sq.es}. Ahora veamos por qué.`,
    ),
    pullLabel: both("Pull the pieces apart", "Separa las piezas"),
    pullSay: both(
      "Use the slider to pull the two pieces apart. Each piece is a rectangle, and you know how to find the area of a rectangle.",
      "Usa el control para separar las dos piezas. Cada pieza es un rectángulo, y ya sabes hallar el área de un rectángulo.",
    ),
    pullKeep: both("Keep pulling the pieces apart.", "Sigue separando las piezas."),
    pullDone: {
      en: `Two rectangles: ${base.w} × ${base.h} = ${A1} ${sq.en} and ${arm.w} × ${arm.h} = ${A2} ${sq.en}.`,
      es: `Dos rectángulos: ${base.w} × ${base.h} = ${A1} ${sq.es} y ${arm.w} × ${arm.h} = ${A2} ${sq.es}.`,
    },
    connectSay: {
      en: `The pieces fit back together, so they are joined: add their areas. ${A1} + ${A2} = ${T} ${sq.en}. Nothing is taken away, so the room covers ${T} ${sq.en}.`,
      es: `Las piezas encajan otra vez, así que están unidas: suma sus áreas. ${A1} + ${A2} = ${T} ${sq.es}. No se quita nada, así que el cuarto cubre ${T} ${sq.es}.`,
    },
    changeSay: both(
      "Split the same room a different way: pick a button. The pieces change. Does the area?",
      "Separa el mismo cuarto de otra forma: elige un botón. Las piezas cambian. ¿Cambia el área?",
    ),
    cutLabel: {
      stack: both("Across (the first split)", "A lo ancho (la primera forma)"),
      side: both("Up and down", "De arriba abajo"),
      fill: both("Fill the corner, subtract", "Rellena la esquina y resta"),
    },
    cutSay: {
      stack: both(
        "Two rectangles, stacked and joined: add.",
        "Dos rectángulos, uno sobre otro y unidos: suma.",
      ),
      side: both(
        "Two different rectangles, side by side and joined: add.",
        "Dos rectángulos distintos, uno al lado del otro y unidos: suma.",
      ),
      fill: both(
        "One big rectangle that covers a corner the room does not have. That corner is cut out: subtract it.",
        "Un rectángulo grande que cubre una esquina que el cuarto no tiene. Esa esquina es un recorte: réstala.",
      ),
    },
    cutEq: {
      stack: `${A1} + ${A2} = ${T}`,
      side: `${S1} + ${S2} = ${T}`,
      fill: `${full} − ${notch} = ${T}`,
    },
    tryOther: (left) =>
      both(
        left === 1 ? "Try the other split too." : "Try both other splits.",
        left === 1 ? "Prueba también la otra forma." : "Prueba las otras dos formas.",
      ),
    changeLesson: {
      en: `Three ways to split, one area: ${T} ${sq.en}. Add pieces that are joined; subtract a piece that is cut out.`,
      es: `Tres formas de separar, una sola área: ${T} ${sq.es}. Suma las partes unidas; resta la parte que está recortada.`,
    },
    transferSay: {
      en: `${pool.story?.en ?? `A pool is a ${by(pw, ph, tu.abbr).en} rectangle with a ${by(cw, ch, tu.abbr).en} cutout.`} No pieces to move this time. Decide: join or cut out?`,
      es: `${pool.story?.es ?? `Una alberca es un rectángulo de ${by(pw, ph, tu.abbr).es} con un recorte de ${by(cw, ch, tu.abbr).es}.`} Esta vez no hay piezas que mover. Decide: ¿unir o recortar?`,
    },
    transferQ: both(
      `What is the area of the pool, in ${tu.sq.en}?`,
      `¿Cuál es el área de la alberca, en ${tu.sq.es}?`,
    ),
    transferOk: {
      en: `Right: ${pw} × ${ph} − ${cw} × ${ch} = ${outer} − ${cut} = ${PT} ${tu.sq.en}. The cutout is not part of the pool, so subtract it.`,
      es: `Correcto: ${pw} × ${ph} − ${cw} × ${ch} = ${outer} − ${cut} = ${PT} ${tu.sq.es}. El recorte no es parte de la alberca, así que se resta.`,
    },
    explainLabel: both(
      "Explain: why subtract the cutout instead of adding it?",
      "Explica: ¿por qué restamos el recorte en vez de sumarlo?",
    ),
    explainFrame: both(
      "The cutout is ___ the pool, so I ___ its area from ___.",
      "El recorte ___ de la alberca, así que ___ su área de ___.",
    ),
    expr: {
      add: `${A1} + ${A2} = ${T}`,
      pool: `${outer} − ${cut} = ${PT}`,
    },
    /** A cue for a wrong choice on the L: names what the pick is, asks a question, never gives the area. */
    cueL(opt) {
      const x = String(opt.value);
      return {
        box: both(
          `${x} fills the whole ${base.w} by ${H} rectangle (dashed). Does the room fill all of it? Look at the corner.`,
          `${x} llena todo el rectángulo de ${base.w} por ${H} (punteado). ¿El cuarto lo llena todo? Mira la esquina.`,
        ),
        mult: both(
          `${x} multiplies the two areas. Joined pieces share one floor: do their areas multiply, or do they combine another way?`,
          `${x} multiplica las dos áreas. Las partes unidas comparten un solo piso: ¿sus áreas se multiplican o se combinan de otra forma?`,
        ),
        sides: both(
          `${x} adds side lengths, which measures along the edges. Area is the space inside. What does one square cover?`,
          `${x} suma longitudes de lados, que mide a lo largo de los bordes. El área es el espacio de adentro. ¿Qué cubre un cuadrado?`,
        ),
      }[opt.kind];
    },
    /** A cue for a wrong choice on the pool. */
    cuePool(opt) {
      const x = String(opt.value);
      return {
        addCut: both(
          `${x} adds the cutout. A cutout is space the pool does not have. Should it be added or taken away?`,
          `${x} suma el recorte. Un recorte es espacio que la alberca no tiene. ¿Se suma o se quita?`,
        ),
        outer: both(
          `${x} is the whole ${pw} by ${ph} rectangle. Is the cutout part of the pool?`,
          `${x} es todo el rectángulo de ${pw} por ${ph}. ¿El recorte es parte de la alberca?`,
        ),
        cutOnly: both(
          `${x} is only the cutout. Is the pool the cutout, or everything around it?`,
          `${x} es solo el recorte. ¿La alberca es el recorte o todo lo que lo rodea?`,
        ),
      }[opt.kind];
    },
  };
  return T2;
}

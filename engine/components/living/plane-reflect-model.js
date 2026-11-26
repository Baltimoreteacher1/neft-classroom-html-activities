// living/plane-reflect-model.js — reflections across the axes: pure maths,
// choice sets, placement diagnosis and every sentence of the plane-reflect
// play (lesson 7-9). No DOM.
//
// Over the x-axis (x, y) -> (x, -y); over the y-axis (x, y) -> (-x, y). The
// image is always the same distance from the mirror, on the other side.

import {
  distinct,
  fmt,
  inRange,
  labelOf,
  near,
  pt,
  same,
  storyOf,
  validPoint,
  validRange,
} from "./plane-model.js";

const KICKER = { en: "See it · Try it · Explain it", es: "Míralo · Pruébalo · Explícalo" };
export const AXES = ["x", "y"];

export const reflect = (p, axis) => (axis === "x" ? { x: p.x, y: -p.y } : { x: -p.x, y: p.y });
export const otherAxis = (axis) => (axis === "x" ? "y" : "x");
/** The coordinate a reflection over this axis changes. */
export const changedCoord = (axis) => (axis === "x" ? "y" : "x");
/** How far p is from the mirror (perpendicular distance). */
export const distToAxis = (p, axis) => (axis === "x" ? Math.abs(p.y) : Math.abs(p.x));

function point(p, range, axis, fallback) {
  const q = validPoint(p, range);
  if (!q || !Number.isInteger(q.x) || !Number.isInteger(q.y)) return null;
  if (near(q.x, 0) || near(q.y, 0)) return null; // off both axes: every flip moves it
  if (!inRange(reflect(q, axis), range) || !inRange(reflect(q, otherAxis(axis)), range))
    return null;
  if (!inRange({ x: -q.x, y: -q.y }, range)) return null;
  return { ...q, name: labelOf(p.name, fallback, 12) };
}

export function validatePlaneReflect(cfg) {
  const range = validRange(cfg?.range);
  if (!range) return null;
  const axes = [cfg.first?.axis, cfg.second?.axis, cfg.shape?.axis];
  if (!axes.every((a) => AXES.includes(a))) return null;
  const P = point(cfg.first.p, range, axes[0], { en: "P", es: "P" });
  const Q = point(cfg.second.p, range, axes[1], { en: "Q", es: "Q" });
  if (!P || !Q || axes[0] === axes[1]) return null;
  if (P.x === P.y || Q.x === Q.y) return null; // a swap must look different
  const vs = (Array.isArray(cfg.shape.vs) ? cfg.shape.vs : []).map((p, i) =>
    point(p, range, axes[2], { en: "ABC"[i], es: "ABC"[i] }),
  );
  if (vs.length !== 3 || vs.some((p) => !p)) return null;
  const [a, b, c] = vs;
  if (near((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x), 0)) return null; // a real triangle
  // All on one side of the mirror, so the image sits on the other.
  const sideOf = (p) => Math.sign(axes[2] === "y" ? p.x : p.y);
  if (new Set(vs.map(sideOf)).size !== 1) return null;
  const key = vs.map(pt);
  if (new Set(key).size !== 3) return null;
  if (!pointChoices(vs[2], axes[2], range)) return null;
  if (!pointChoices(P, axes[0], range) || !pointChoices(Q, axes[1], range)) return null;
  const letters = ["A", "B", "C"];
  vs.forEach((p, i) => {
    p.name = { en: letters[i], es: letters[i] };
  });
  return {
    range,
    P,
    Q,
    vs,
    axisP: axes[0],
    axisQ: axes[1],
    axisS: axes[2],
    story: storyOf(cfg.story),
  };
}

/** Where a point could land: the flip, the other flip, both flips, the swap. */
export function pointChoices(p, axis, range) {
  const opts = [
    { kind: "right", p: reflect(p, axis), correct: true },
    { kind: "other", p: reflect(p, otherAxis(axis)) },
    { kind: "both", p: { x: -p.x, y: -p.y } },
    { kind: "swap", p: { x: p.y, y: p.x } },
  ].filter((o) => o.correct || (inRange(o.p, range) && !same(o.p, p)));
  const out = distinct(opts, (o) => pt(o.p));
  return out.length >= 3 ? out : null;
}

/** What a placed dot `p` is, as a reflection of `P` over `axis`. */
export function classifyReflection(P, axis, p) {
  const T = reflect(P, axis);
  if (same(p, T)) return "ok";
  if (same(p, P)) return "same";
  if (same(p, reflect(P, otherAxis(axis)))) return "other";
  if (same(p, { x: -P.x, y: -P.y })) return "both";
  if (same(p, { x: P.y, y: P.x }) || same(p, { x: T.y, y: T.x })) return "swap";
  const cross = Math.sign(axis === "y" ? p.x : p.y) === -Math.sign(axis === "y" ? P.x : P.y);
  return cross ? "distance" : "side";
}

export function reflectCopy(v) {
  const { P, Q, vs } = v;
  const C = vs[2];
  const lead = v.story ? { en: `${v.story.en} `, es: `${v.story.es} ` } : { en: "", es: "" };
  const ax = (a) => ({ en: `${a}-axis`, es: `eje ${a}` });
  const dirs = (a) =>
    a === "y"
      ? { en: "left or right", es: "a la izquierda o a la derecha" }
      : { en: "up or down", es: "hacia arriba o hacia abajo" };
  const line = (a) =>
    a === "y" ? { en: "vertical", es: "vertical" } : { en: "horizontal", es: "horizontal" };
  const prime = (p) => `${p.name.en}′`;
  const vlist = vs.map((p) => `${p.name.en} ${pt(p)}`).join(", ");
  const rule = (a) => (a === "y" ? "(x, y) → (−x, y)" : "(x, y) → (x, −y)");
  const vimg = vs.map((p) => `${prime(p)} ${pt(reflect(p, v.axisS))}`).join(", ");
  return {
    kicker: KICKER,
    title: { en: "Reflect points across the axes", es: "Refleja puntos sobre los ejes" },
    ariaLabel: {
      en: `A coordinate grid. ${P.name.en} ${pt(P)} reflects over the ${ax(v.axisP).en} to ${pt(reflect(P, v.axisP))}, the same distance from the axis on the other side. ${Q.name.en} ${pt(Q)} reflects over the ${ax(v.axisQ).en} to ${pt(reflect(Q, v.axisQ))}. Triangle ${vlist} reflects to ${vimg}.`,
      es: `Una cuadrícula de coordenadas. ${P.name.es} ${pt(P)} se refleja sobre el ${ax(v.axisP).es} en ${pt(reflect(P, v.axisP))}, a la misma distancia del eje pero del otro lado. ${Q.name.es} ${pt(Q)} se refleja sobre el ${ax(v.axisQ).es} en ${pt(reflect(Q, v.axisQ))}. El triángulo ${vlist} se refleja en ${vimg}.`,
    },
    printSummary: {
      en: `A reflection is a flip over a line. Over the y-axis (x, y) → (−x, y); over the x-axis (x, y) → (x, −y). ${pt(P)} over the ${ax(v.axisP).en} is ${pt(reflect(P, v.axisP))}; ${pt(Q)} over the ${ax(v.axisQ).en} is ${pt(reflect(Q, v.axisQ))}. The image is the same distance from the axis on the other side.`,
      es: `Una reflexión es un volteo sobre una línea. Sobre el eje y (x, y) → (−x, y); sobre el eje x (x, y) → (x, −y). ${pt(P)} sobre el ${ax(v.axisP).es} es ${pt(reflect(P, v.axisP))}; ${pt(Q)} sobre el ${ax(v.axisQ).es} es ${pt(reflect(Q, v.axisQ))}. La imagen está a la misma distancia del eje, del otro lado.`,
    },
    scene: {
      situate: { en: "The mirror", es: "El espejo" },
      predict: { en: "Predict", es: "Predice" },
      flip: { en: "Flip it", es: "Voltéalo" },
      why: { en: "Same distance", es: "Misma distancia" },
      other: { en: "Switch the mirror", es: "Cambia el espejo" },
      shape: { en: "A whole shape", es: "Una figura completa" },
    },
    mirror: { en: "mirror line", es: "línea espejo" },
    place: { en: "Place the reflection", es: "Colocar la reflexión" },
    prime,
    label: (p) => `${p.name.en} ${pt(p)}`,
    imageLabel: (p, a) => `${prime(p)} ${pt(reflect(p, a))}`,
    situateSay: {
      en: `${lead.en}A reflection is a flip over a line, like a mirror image. Here the mirror is the ${ax(v.axisP).en}, the ${line(v.axisP).en} line. ${P.name.en} is at ${pt(P)}.`,
      es: `${lead.es}Una reflexión es un volteo sobre una línea, como una imagen en el espejo. Aquí el espejo es el ${ax(v.axisP).es}, la línea ${line(v.axisP).es}. ${P.name.es} está en ${pt(P)}.`,
    },
    predictQ: {
      en: `Flip ${P.name.en} ${pt(P)} over the ${ax(v.axisP).en}. Where does it land?`,
      es: `Voltea ${P.name.es} ${pt(P)} sobre el ${ax(v.axisP).es}. ¿Dónde cae?`,
    },
    cue(P0, axis, opt) {
      const T = pt(opt.p);
      const cues = {
        other: {
          en: `${T} is where the point lands when it flips over the ${ax(otherAxis(axis)).en}. The mirror here is the ${ax(axis).en}, the ${line(axis).en} line. Does the point flip ${dirs(axis).en}?`,
          es: `${T} es donde cae el punto al voltearse sobre el ${ax(otherAxis(axis)).es}. Aquí el espejo es el ${ax(axis).es}, la línea ${line(axis).es}. ¿El punto se voltea ${dirs(axis).es}?`,
        },
        both: {
          en: `${T}: both numbers changed sign. That is a flip over one axis and then over the other. One flip over the ${ax(axis).en} changes just one coordinate. Which one?`,
          es: `${T}: los dos números cambiaron de signo. Eso es un volteo sobre un eje y luego sobre el otro. Un volteo sobre el ${ax(axis).es} cambia solo una coordenada. ¿Cuál?`,
        },
        swap: {
          en: `${T} swaps the two numbers. A reflection keeps x first and y second, and changes a sign instead.`,
          es: `${T} intercambia los dos números. Una reflexión mantiene x primero y y segundo, y cambia un signo.`,
        },
        same: {
          en: `Your dot sits on top of ${P0.name.en}. A reflection moves the point to the other side of the mirror. Which side is the other side?`,
          es: `Tu punto está encima de ${P0.name.es}. Una reflexión mueve el punto al otro lado del espejo. ¿Cuál es el otro lado?`,
        },
        side: {
          en: `Your dot is on the same side of the ${ax(axis).en} as ${P0.name.en}. A reflection lands on the other side of the mirror.`,
          es: `Tu punto está del mismo lado del ${ax(axis).es} que ${P0.name.es}. Una reflexión cae del otro lado del espejo.`,
        },
        distance: {
          en: `Your dot is on the other side of the ${ax(axis).en}, but not the same distance from it as ${P0.name.en}. Compare how far each one is from the mirror.`,
          es: `Tu punto está del otro lado del ${ax(axis).es}, pero no a la misma distancia que ${P0.name.es}. Compara qué tan lejos está cada uno del espejo.`,
        },
      };
      return cues[opt.kind];
    },
    predictOk: {
      en: `Yes: ${P.name.en} lands at ${pt(reflect(P, v.axisP))}, on the other side of the ${ax(v.axisP).en}. Now place the reflection yourself.`,
      es: `Sí: ${P.name.es} cae en ${pt(reflect(P, v.axisP))}, del otro lado del ${ax(v.axisP).es}. Ahora coloca tú la reflexión.`,
    },
    flipAsk: (p, a) => ({
      en: `Place ${prime(p)}, the reflection of ${p.name.en} ${pt(p)} over the ${ax(a).en}.`,
      es: `Coloca ${prime(p)}, la reflexión de ${p.name.es} ${pt(p)} sobre el ${ax(a).es}.`,
    }),
    flipSay: (p, a) => ({
      en: `Move the crosshair to where ${p.name.en} lands when it flips over the ${ax(a).en}, then press Place.`,
      es: `Mueve la cruz adonde cae ${p.name.es} al voltearse sobre el ${ax(a).es} y presiona Colocar.`,
    }),
    flipOk: (p, a) => ({
      en: `Yes: ${prime(p)} is at ${pt(reflect(p, a))}. Over the ${ax(a).en}, the ${changedCoord(a)}-coordinate changes sign.`,
      es: `Sí: ${prime(p)} está en ${pt(reflect(p, a))}. Sobre el ${ax(a).es}, la coordenada ${changedCoord(a)} cambia de signo.`,
    }),
    whySay: {
      en: `Watch ${P.name.en} flip across the ${ax(v.axisP).en}. It lands the same distance from the mirror, ${distToAxis(P, v.axisP)} units, on the other side.`,
      es: `Mira cómo ${P.name.es} se voltea sobre el ${ax(v.axisP).es}. Cae a la misma distancia del espejo, ${distToAxis(P, v.axisP)} unidades, del otro lado.`,
    },
    whyDone: {
      en: `Over the ${ax(v.axisP).en} only the ${changedCoord(v.axisP)}-coordinate changes sign: ${fmt(P[changedCoord(v.axisP)])} becomes ${fmt(-P[changedCoord(v.axisP)])}. The other coordinate stays the same, so the dot moves straight across.`,
      es: `Sobre el ${ax(v.axisP).es} solo cambia de signo la coordenada ${changedCoord(v.axisP)}: ${fmt(P[changedCoord(v.axisP)])} se vuelve ${fmt(-P[changedCoord(v.axisP)])}. La otra coordenada queda igual, así que el punto se mueve en línea recta hacia el otro lado.`,
    },
    rule,
    otherSay: {
      en: `Now the mirror is the ${ax(v.axisQ).en}, the ${line(v.axisQ).en} line. ${Q.name.en} is at ${pt(Q)}.`,
      es: `Ahora el espejo es el ${ax(v.axisQ).es}, la línea ${line(v.axisQ).es}. ${Q.name.es} está en ${pt(Q)}.`,
    },
    otherDone: {
      en: `Over the ${ax(v.axisQ).en} it is the ${changedCoord(v.axisQ)}-coordinate that changes sign: ${fmt(Q[changedCoord(v.axisQ)])} becomes ${fmt(-Q[changedCoord(v.axisQ)])}. The axis you flip over decides which coordinate changes.`,
      es: `Sobre el ${ax(v.axisQ).es} es la coordenada ${changedCoord(v.axisQ)} la que cambia de signo: ${fmt(Q[changedCoord(v.axisQ)])} se vuelve ${fmt(-Q[changedCoord(v.axisQ)])}. El eje sobre el que volteas decide cuál coordenada cambia.`,
    },
    shapeSay: {
      en: `Triangle ${vlist}. Reflect the whole triangle over the ${ax(v.axisS).en}. Start with one vertex.`,
      es: `Triángulo ${vlist}. Refleja todo el triángulo sobre el ${ax(v.axisS).es}. Empieza con un vértice.`,
    },
    shapeQ: {
      en: `Where does vertex ${C.name.en} ${pt(C)} land?`,
      es: `¿Dónde cae el vértice ${C.name.es} ${pt(C)}?`,
    },
    shapeOk: {
      en: `Yes: ${prime(C)} is at ${pt(reflect(C, v.axisS))}. Every vertex flips the same way, so the whole triangle lands on the other side of the ${ax(v.axisS).en}: ${vimg}.`,
      es: `Sí: ${prime(C)} está en ${pt(reflect(C, v.axisS))}. Todos los vértices se voltean igual, así que el triángulo completo cae del otro lado del ${ax(v.axisS).es}: ${vimg}.`,
    },
    explainLabel: {
      en: "Explain: what changes when you reflect over the x-axis, and over the y-axis?",
      es: "Explica: ¿qué cambia al reflejar sobre el eje x y sobre el eje y?",
    },
    explainFrame: {
      en: "When I reflect over the x-axis, the ___ -coordinate changes sign and the ___ -coordinate stays the same. When I reflect over the y-axis, the ___ -coordinate changes sign and the ___ -coordinate stays the same.",
      es: "Cuando reflejo sobre el eje x, la coordenada ___ cambia de signo y la coordenada ___ se queda igual. Cuando reflejo sobre el eje y, la coordenada ___ cambia de signo y la coordenada ___ se queda igual.",
    },
  };
}

// Number Line Quest wording that is not feedback or hints: title, how to play, skill names, prompt templates, interface
// labels. Everything is {en, es}; Spanish is written for a classroom, not translated word for word. @fm2 FM-012 FM-020
import { fmt, L } from "../../lang.js";

export const TITLE = { en: "Number Line Quest", es: "Aventura en la recta numérica" };
export const TAGLINE = {
  en: "Place numbers, round them and hop to a goal on a number line.",
  es: "Coloca números, redondea y salta hasta la meta en una recta numérica.",
};
export const HOW_TO = {
  en: [
    "Read the goal at the top, then look at the two ends of the line and the labelled marks.",
    "Drag the marker, tap a spot on the line, or use the arrow keys. The step size is written on screen, and Shift with an arrow moves ten steps.",
    "In hop rounds, tap hop buttons to build a path. Undo takes the last hop back.",
    "Press Check. You hear which way you are off and about how far, so you can fix it and try again.",
  ],
  es: [
    "Lee la meta arriba y mira los dos extremos de la recta y las marcas con número.",
    "Arrastra el marcador, toca un lugar de la recta o usa las flechas. El tamaño del paso está escrito en pantalla, y Mayús con una flecha mueve diez pasos.",
    "En las rondas de saltos, toca los botones de salto para armar un camino. Deshacer quita el último salto.",
    "Oprime Comprobar. Oirás hacia dónde te pasaste y más o menos cuánto, para corregir e intentar otra vez.",
  ],
};
export const TOGETHER = {
  en: "Take turns. Before the marker moves, the other person says where on the line they think the number belongs and why. Move the marker, then compare the guess with the result and talk about how far off it was.",
  es: "Túrnense. Antes de mover el marcador, la otra persona dice en qué parte de la recta cree que va el número y por qué. Muevan el marcador y comparen la idea con el resultado; conversen sobre cuánto se equivocaron.",
};

const S = (en, es) => ({ en, es });
export const STRAND = {
  count: S("Counting and number order", "Conteo y orden de los números"),
  place: S("Placing whole numbers", "Ubicar números enteros"),
  hop: S("Hopping on the line", "Saltos en la recta"),
  frac: S("Fractions on the line", "Fracciones en la recta"),
  dec: S("Decimals on the line", "Decimales en la recta"),
  round: S("Rounding", "Redondeo"),
  rational: S("Rational numbers", "Números racionales"),
  real: S("Real numbers", "Números reales"),
};

// {tol} fills with the tolerance sentence. Values in {braces} are language-neutral numerals unless a template says otherwise.
const T = (en, es) => ({ en, es });
export const PROMPT = {
  to: T("Move the marker to {v}. {tol}", "Mueve el marcador a {v}. {tol}"),
  after: T(
    "The marker is on {s}. Move it to the number that comes right after {s}. {tol}",
    "El marcador está en {s}. Muévelo al número que viene justo después de {s}. {tol}",
  ),
  before: T(
    "The marker is on {s}. Move it to the number that comes right before {s}. {tol}",
    "El marcador está en {s}. Muévelo al número que viene justo antes de {s}. {tol}",
  ),
  more: T(
    "The marker is on {s}. Move it to the number that is {d} more than {s}. {tol}",
    "El marcador está en {s}. Muévelo al número que es {d} más que {s}. {tol}",
  ),
  less: T(
    "The marker is on {s}. Move it to the number that is {d} less than {s}. {tol}",
    "El marcador está en {s}. Muévelo al número que es {d} menos que {s}. {tol}",
  ),
  parity: T(
    "The marker is on {s}. Move it to the {kind} number {where} {s}. {tol}",
    "El marcador está en {s}. Muévelo al número {kind} {where} {s}. {tol}",
  ),
  equiv: T(
    "Each whole on the line is cut into {m} equal parts. Move the marker to {v}. {tol}",
    "Cada entero de la recta está dividido en {m} partes iguales. Mueve el marcador a {v}. {tol}",
  ),
  opposite: T(
    "Move the marker to the opposite of {v}. {tol}",
    "Mueve el marcador al opuesto de {v}. {tol}",
  ),
  absolute: T(
    "Move the marker to the number that is {d} {u} from zero, on the {side} side of zero. {tol}",
    "Mueve el marcador al número que está a {d} {u} del cero, en el lado {side} del cero. {tol}",
  ),
  hopSide: T(
    "Start at {s}. Hop {d} {u} to the {side}. Move the marker to where you land. {tol}",
    "Empieza en {s}. Salta {d} {u} hacia la {side}. Mueve el marcador adonde caes. {tol}",
  ),
  addSub: T(
    "Start at {s}. {op} {v}. Move the marker to the result. {tol}",
    "Empieza en {s}. {op} {v}. Mueve el marcador al resultado. {tol}",
  ),
  dist: T(
    "Point B is at {b}. Move the marker to the point that is {d} {u} from B, on the {side} side of B. {tol}",
    "El punto B está en {b}. Mueve el marcador al punto que está a {d} {u} de B, en el lado {side} de B. {tol}",
  ),
  hop: T(
    "Start at {s}. Land on {t} in at most {c} hops.",
    "Empieza en {s}. Cae en {t} con {c} saltos como máximo.",
  ),
  hopSkip: T(
    "Skip count by {k}s. Start at {s}. Land on {t} in at most {c} hops.",
    "Cuenta de {k} en {k}. Empieza en {s}. Cae en {t} con {c} saltos como máximo.",
  ),
  round: T(
    "Round {v} to the nearest {unit}: drop the marker on {v} between {lo} and {hi}. {tol} Then pick the benchmark it is nearest to.",
    "Redondea {v} a la {unit} más cercana: pon el marcador en {v}, entre {lo} y {hi}. {tol} Luego elige el punto de referencia más cercano.",
  ),
  order: T(
    "Place the markers so the numbers go from least to greatest, left to right: {items}. Only the order matters.",
    "Coloca los marcadores para que los números vayan de menor a mayor, de izquierda a derecha: {items}. Solo importa el orden.",
  ),
  zoom: T("Zoom in to place {v}. {tol}", "Haz zoom para colocar {v}. {tol}"),
};

export const UNIT = {
  ten: S("ten", "decena"),
  hundred: S("hundred", "centena"),
  whole: S("whole number", "unidad"),
  tenth: S("tenth", "décima"),
  hundredth: S("hundredth", "centésima"),
};
export const WORD = {
  left: S("left", "izquierda"),
  right: S("right", "derecha"),
  leftSide: S("left", "izquierdo"),
  rightSide: S("right", "derecho"),
  even: S("even", "par"),
  odd: S("odd", "impar"),
  after: S("right after", "justo después de"),
  before: S("just before", "justo antes de"),
  add: S("Add", "Suma"),
  subtract: S("Subtract", "Resta"),
};

// "1 unit" but "2 units" and "1/2 units".
export const unitWord = (dText) => (dText === "1" ? S("unit", "unidad") : S("units", "unidades"));

export function tolSentence(tolText) {
  return tolText === null
    ? S("Land exactly on it.", "Colócalo exactamente.")
    : S(`Anywhere within ${tolText} counts.`, `Se acepta a menos de ${tolText}.`);
}

// Build a prompt in both languages. vars values are strings or {en, es}.
export function makePrompt(key, vars = {}, tol = null) {
  const out = {};
  for (const lang of ["en", "es"]) {
    const filled = Object.fromEntries(
      Object.entries(vars).map(([name, value]) => [name, L(value, lang)]),
    );
    out[lang] = fmt(PROMPT[key][lang], { ...filled, tol: tol ? tol[lang] : "" })
      .replace(/\s+$/, "")
      .replace(/\s{2,}/g, " ");
  }
  return out;
}

export const UI = {
  rulePlace: S(
    "Drag the marker, tap the line, or use the arrow keys. Arrow keys move {step}; Shift with an arrow moves ten steps ({big}).",
    "Arrastra el marcador, toca la recta o usa las flechas. Cada flecha mueve {step}; Shift con una flecha mueve diez pasos ({big}).",
  ),
  ruleHop: S(
    "Tap a hop button to hop. You may use at most {cap} hops. Undo takes back the last hop.",
    "Toca un botón de salto para saltar. Puedes usar {cap} saltos como máximo. Deshacer quita el último salto.",
  ),
  ruleZoom: S(
    "Choose the stretch the number is in, then zoom in. After the last zoom, move the marker one tick at a time: arrow keys move {step}.",
    "Elige el tramo donde está el número y acércate. Después del último zoom, mueve el marcador una marca a la vez: cada flecha mueve {step}.",
  ),
  ruleOrder: S(
    "Pick a marker, then move it. Arrow keys move {step}; Shift with an arrow moves ten steps ({big}). Two markers cannot share a spot.",
    "Elige un marcador y muévelo. Cada flecha mueve {step}; Shift con una flecha mueve diez pasos ({big}). Dos marcadores no pueden estar en el mismo lugar.",
  ),
  marker: S("Marker", "Marcador"),
  markerNamed: S("Marker {letter}, {text}", "Marcador {letter}, {text}"),
  readout: S("Marker at {v}", "Marcador en {v}"),
  readoutNamed: S("Marker {letter} at {v}", "Marcador {letter} en {v}"),
  left: S("Move marker left by {step}", "Mover el marcador a la izquierda {step}"),
  right: S("Move marker right by {step}", "Mover el marcador a la derecha {step}"),
  leftBig: S("Move marker left by {big}", "Mover el marcador a la izquierda {big}"),
  rightBig: S("Move marker right by {big}", "Mover el marcador a la derecha {big}"),
  checkSpot: S("Check my spot", "Comprobar mi lugar"),
  checkHops: S("Check my hops", "Comprobar mis saltos"),
  checkOrder: S("Check my order", "Comprobar mi orden"),
  hopRight: S("Hop right {size}", "Saltar a la derecha {size}"),
  hopLeft: S("Hop left {size}", "Saltar a la izquierda {size}"),
  undo: S("Undo last hop", "Deshacer último salto"),
  clear: S("Clear hops", "Borrar saltos"),
  hereAt: S("You are at {v}", "Estás en {v}"),
  hopsUsed: S("Hops used: {n} of {cap}", "Saltos usados: {n} de {cap}"),
  equation: S("Hop equation", "Ecuación de saltos"),
  leaveLine: S("That hop would leave the number line.", "Ese salto saldría de la recta numérica."),
  hopped: S("Hopped. You are at {v}.", "Saltaste. Estás en {v}."),
  undone: S("Last hop undone. You are at {v}.", "Último salto deshecho. Estás en {v}."),
  cleared: S("Hops cleared. Back at {v}.", "Saltos borrados. Vuelves a {v}."),
  goal: S("Goal", "Meta"),
  start: S("Start", "Inicio"),
  tooMany: S(
    "Hop limit reached. Undo a hop first.",
    "Llegaste al límite de saltos. Deshaz uno primero.",
  ),
  nearest: S("Nearest benchmark", "Punto de referencia más cercano"),
  pickLabel: S("Nearest: {v}", "Más cerca de {v}"),
  pickFirst: S(
    "Choose the nearest benchmark first.",
    "Elige primero el punto de referencia más cercano.",
  ),
  chosen: S("Chosen: {v}", "Elegido: {v}"),
  chooseMarker: S("Markers (pick one to move)", "Marcadores (elige uno para moverlo)"),
  chip: S("Marker {letter}: {text}", "Marcador {letter}: {text}"),
  moving: S("Moving marker {letter}", "Moviendo el marcador {letter}"),
  window: S("Window: {lo} to {hi}", "Ventana: {lo} a {hi}"),
  stretchNow: S("Stretch to zoom into: {lo} to {hi}", "Tramo para acercarse: {lo} a {hi}"),
  zoomIn: S("Zoom into {lo} to {hi}", "Acercar a {lo} a {hi}"),
  zoomOut: S("Zoom back out", "Alejar"),
  zoomFirst: S(
    "Zoom in all the way first, then place the marker.",
    "Primero acércate del todo y luego coloca el marcador.",
  ),
  zoomed: S("Zoomed to {lo} to {hi}.", "Acercado a {lo} a {hi}."),
  zoomedOut: S("Zoomed out to {lo} to {hi}.", "Alejado a {lo} a {hi}."),
  stretch: S("Stretch to zoom into", "Tramo para acercarse"),
  figure: S(
    "Number line from {lo} to {hi}, with tick marks every {tick}.",
    "Recta numérica de {lo} a {hi}, con marcas cada {tick}.",
  ),
  figureHop: S(
    "Number line from {lo} to {hi}. Start at {s}, goal at {t}.",
    "Recta numérica de {lo} a {hi}. Inicio en {s}, meta en {t}.",
  ),
  pointB: S("Point B at {b}.", "Punto B en {b}."),
  nudge: S("Nudge the marker", "Mover el marcador poco a poco"),
  orderNow: S("Left to right now: {list}", "De izquierda a derecha ahora: {list}"),
  here: S("You", "Tú"),
  hopGroup: S("Hop buttons", "Botones de salto"),
  locked: S("This puzzle is finished.", "Este reto ya terminó."),
};
export const ui = (key, lang, vars = {}) => fmt(L(UI[key], lang), vars);

// Direction Dash art: the movable objects (each a small original inline SVG with an English and Spanish name),
// the two scenes the board sits on (a science-lab shelf unit and a classroom map) and the mini diagrams that
// gloss spatial words in the Starting and Growing support modes. Palette comes from art.js (no purple).
import { C, svg } from "./art.js";

const o = `stroke="${C.navy}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`;

/** key -> { en, es, draw }. Names are the words the directions use. */
export const OBJ = {
  beaker: {
    en: "beaker",
    es: "vaso de precipitados",
    draw: `<path d="M14 8h20M16 8v28a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V8" fill="#fff" ${o}/><path d="M16.5 24h15v12a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3Z" fill="${C.teal}"/><path d="M20 16h4M20 21h3" ${o}/>`,
  },
  microscope: {
    en: "microscope",
    es: "microscopio",
    draw: `<rect x="10" y="38" width="28" height="5" rx="2" fill="${C.stoneDk}" ${o}/><path d="M30 38V30a8 8 0 0 0-8-8" fill="none" ${o} stroke-width="3"/><rect x="17" y="6" width="8" height="20" rx="2" transform="rotate(-20 21 16)" fill="${C.sky}" ${o}/><rect x="14" y="30" width="16" height="3" rx="1.5" fill="${C.stone}" ${o}/>`,
  },
  flask: {
    en: "flask",
    es: "matraz",
    draw: `<path d="M20 6h8M21 6v12L11 38a3 3 0 0 0 3 4h20a3 3 0 0 0 3-4L27 18V6" fill="#fff" ${o}/><path d="M15 31h18l3.4 7a2 2 0 0 1-2 3H13.6a2 2 0 0 1-2-3Z" fill="${C.coral}"/>`,
  },
  magnet: {
    en: "magnet",
    es: "imán",
    draw: `<path d="M10 10h9v16a5 5 0 0 0 10 0V10h9v16a14 14 0 0 1-28 0Z" fill="${C.coral}" ${o}/><path d="M10 10h9v7h-9ZM29 10h9v7h-9Z" fill="${C.stone}" ${o}/>`,
  },
  notebook: {
    en: "notebook",
    es: "cuaderno",
    draw: `<rect x="11" y="7" width="26" height="34" rx="3" fill="${C.gold}" ${o}/><path d="M16 7v34" ${o}/><path d="M21 15h11M21 21h11M21 27h8" stroke="${C.navy}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`,
  },
  ruler: {
    en: "ruler",
    es: "regla",
    draw: `<rect x="5" y="18" width="38" height="12" rx="2" fill="${C.gold}" ${o}/><path d="M11 18v5M17 18v3M23 18v5M29 18v3M35 18v5" ${o}/>`,
  },
  plant: {
    en: "plant",
    es: "planta",
    draw: `<path d="M15 30h18l-3 12H18Z" fill="${C.wood}" ${o}/><path d="M24 30V16M24 22q-10-2-11-10q10 0 11 10M24 18q8-2 10-10q-9 0-10 10" fill="${C.leaf}" ${o}/>`,
  },
  globe: {
    en: "globe",
    es: "globo terráqueo",
    draw: `<circle cx="24" cy="20" r="13" fill="${C.sky}" ${o}/><path d="M17 13q5 3 3 8t4 6M28 9q-2 5 3 8" fill="none" stroke="${C.leafDk}" stroke-width="3" stroke-linecap="round"/><path d="M24 33v6M16 42h16" ${o} stroke-width="3"/>`,
  },
  scale: {
    en: "scale",
    es: "balanza",
    draw: `<path d="M24 8v30M14 42h20M10 14h28" ${o} stroke-width="3"/><path d="M10 14l-5 12h10ZM38 14l-5 12h10Z" fill="${C.tealLt}" ${o}/>`,
  },
  thermometer: {
    en: "thermometer",
    es: "termómetro",
    draw: `<rect x="20" y="5" width="8" height="30" rx="4" fill="#fff" ${o}/><circle cx="24" cy="37" r="6" fill="${C.coral}" ${o}/><path d="M24 34V16" stroke="${C.coral}" stroke-width="3.4" stroke-linecap="round"/>`,
  },
  magnifier: {
    en: "magnifying glass",
    es: "lupa",
    draw: `<circle cx="20" cy="20" r="11" fill="${C.skyLt}" ${o} stroke-width="3"/><path d="M28 28l11 11" stroke="${C.woodDk}" stroke-width="6" stroke-linecap="round"/>`,
  },
  battery: {
    en: "battery",
    es: "pila",
    draw: `<rect x="8" y="16" width="30" height="16" rx="3" fill="${C.leaf}" ${o}/><rect x="38" y="20" width="4" height="8" rx="1" fill="${C.stone}" ${o}/><path d="M14 24h6M17 21v6" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`,
  },
  tubes: {
    en: "test tubes",
    es: "tubos de ensayo",
    draw: `<rect x="6" y="20" width="36" height="6" rx="2" fill="${C.wood}" ${o}/><path d="M12 10v22a3 3 0 0 0 6 0V10M21 10v22a3 3 0 0 0 6 0V10M30 10v22a3 3 0 0 0 6 0V10" fill="#fff" ${o}/><path d="M12.6 26h4.8v6a2.4 2.4 0 0 1-4.8 0ZM21.6 24h4.8v8a2.4 2.4 0 0 1-4.8 0ZM30.6 28h4.8v4a2.4 2.4 0 0 1-4.8 0Z" fill="${C.teal}"/>`,
  },
  lamp: {
    en: "lamp",
    es: "lámpara",
    draw: `<path d="M14 22l6-14h8l6 14Z" fill="${C.gold}" ${o}/><path d="M24 22v16M15 41h18" ${o} stroke-width="3"/>`,
  },
  book: {
    en: "book",
    es: "libro",
    draw: `<rect x="9" y="9" width="30" height="30" rx="3" fill="${C.teal}" ${o}/><rect x="13" y="13" width="22" height="10" rx="2" fill="#fff"/><path d="M9 33h30" ${o}/>`,
  },
  pencils: {
    en: "pencil cup",
    es: "lapicero",
    draw: `<path d="M16 8l3 14M24 6v16M32 8l-3 14" stroke="${C.gold}" stroke-width="4" stroke-linecap="round"/><path d="M13 20h22l-3 20H16Z" fill="${C.coral}" ${o}/>`,
  },
  backpack: {
    en: "backpack",
    es: "mochila",
    draw: `<path d="M18 12a6 6 0 0 1 12 0" fill="none" ${o} stroke-width="3"/><rect x="11" y="12" width="26" height="30" rx="7" fill="${C.teal}" ${o}/><rect x="16" y="27" width="16" height="10" rx="3" fill="${C.tealLt}" ${o}/>`,
  },
};

export const objArt = (key) => svg("0 0 48 48", OBJ[key].draw, { cls: "dd-obj-art" });

/** Rows of the 4 x 3 board, top to bottom, per scene. */
export const SCENES = {
  lab: {
    name: ["Science lab shelves", "Estantes del laboratorio de ciencias"],
    rows: [
      ["Top shelf", "Estante de arriba"],
      ["Middle shelf", "Estante del medio"],
      ["Lab bench", "Mesa del laboratorio"],
    ],
  },
  class: {
    name: [
      "Classroom map (the board is at the front)",
      "Mapa del salón (la pizarra está al frente)",
    ],
    rows: [
      ["Front row, by the board", "Primera fila, junto a la pizarra"],
      ["Middle row", "Fila del medio"],
      ["Back row", "Última fila"],
    ],
  },
};

// Mini diagram cells on a 3 x 3 grid: r = reference (navy), t = target (coral).
const d = (r, t) => ({ r, t });
/** Spatial and sequence words the directions use: [en, es] plus an optional diagram. */
export const TERMS = {
  "next to": { en: "next to", es: "al lado de", map: d([4], [3, 5]) },
  "left of": { en: "to the left of", es: "a la izquierda de", map: d([4], [3]) },
  "right of": { en: "to the right of", es: "a la derecha de", map: d([4], [5]) },
  under: { en: "under", es: "debajo de", map: d([4], [7]) },
  below: { en: "below", es: "debajo de", map: d([4], [7]) },
  above: { en: "above", es: "encima de", map: d([4], [1]) },
  between: { en: "between", es: "entre", map: d([3, 5], [4]) },
  "top shelf": { en: "top shelf", es: "estante de arriba", map: d([], [0, 1, 2]) },
  "front row": { en: "front row", es: "primera fila", map: d([], [0, 1, 2]) },
  "back row": { en: "back row", es: "última fila", map: d([], [6, 7, 8]) },
  corner: { en: "corner", es: "esquina", map: d([], [0, 2, 6, 8]) },
  behind: {
    en: "behind (farther from the board)",
    es: "detrás de (más lejos de la pizarra)",
    map: d([4], [7]),
  },
  "in front of": {
    en: "in front of (closer to the board)",
    es: "delante de (más cerca de la pizarra)",
    map: d([4], [1]),
  },
  "first-then": { en: "first … then", es: "primero … después" },
  after: { en: "after", es: "después de" },
  if: { en: "if", es: "si" },
  otherwise: { en: "otherwise", es: "de lo contrario" },
  unless: { en: "unless", es: "a menos que" },
  place: { en: "place", es: "colocar" },
  position: { en: "position", es: "ubicar" },
  transfer: { en: "transfer", es: "trasladar" },
};

export function termArt(key) {
  const m = TERMS[key]?.map;
  if (!m) return "";
  const cells = Array.from({ length: 9 }, (_, i) => {
    const fill = m.r.includes(i) ? C.navy : m.t.includes(i) ? C.coral : C.white;
    return `<rect x="${(i % 3) * 13 + 2}" y="${Math.floor(i / 3) * 13 + 2}" width="11" height="11" rx="2.5" fill="${fill}" stroke="${C.stoneDk}" stroke-width="1"/>`;
  }).join("");
  return svg("0 0 41 41", cells, { cls: "dd-term-art" });
}

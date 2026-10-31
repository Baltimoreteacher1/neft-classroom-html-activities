/* Stop 4 illustrations: a small picture of each Lab feature with two numbered hotspots. They are drawings that
 * explain, not controls: the only way into the real feature is the link beside each picture. */
import { p, svg } from "./core.js";

const N = "#17324d";
const T = "#1fa6a2";
const A = "#f2c15b";
const R = "#d8613c";
const W = "#fff";
const frame = (inner) =>
  `<svg viewBox="0 0 320 190"><rect x="6" y="6" width="308" height="178" rx="14" fill="#f7f4ec" stroke="${N}" stroke-width="3"/><rect x="6" y="6" width="308" height="26" rx="14" fill="${N}"/><circle cx="24" cy="19" r="4" fill="${A}"/><circle cx="38" cy="19" r="4" fill="#fff" opacity=".6"/>${inner}</svg>`;

const ART = {
  daily: frame(
    `<g>${Array.from({ length: 10 }, (_, i) => `<circle cx="${52 + i * 24}" cy="52" r="8" fill="${i < 4 ? T : W}" stroke="${N}" stroke-width="2"/>`).join("")}</g><rect x="40" y="76" width="240" height="56" rx="10" fill="${W}" stroke="${N}" stroke-width="2.4"/><rect x="58" y="92" width="130" height="10" rx="5" fill="#cfd8e0"/><rect x="58" y="110" width="80" height="10" rx="5" fill="#cfd8e0"/><rect x="200" y="148" width="80" height="24" rx="8" fill="${W}" stroke="${N}" stroke-width="2.4"/>`,
  ),
  games: frame(
    `${[0, 1, 2, 3].map((i) => `<rect x="${44 + (i % 2) * 118}" y="${46 + Math.floor(i / 2) * 68}" width="106" height="56" rx="12" fill="${[T, A, R, "#2f6db0"][i]}" stroke="${N}" stroke-width="2.4"/><circle cx="${97 + (i % 2) * 118}" cy="${74 + Math.floor(i / 2) * 68}" r="12" fill="${W}" opacity=".9"/>`).join("")}`,
  ),
  visual: frame(
    `<rect x="52" y="52" width="130" height="56" rx="6" fill="${W}" stroke="${N}" stroke-width="2.4"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${58 + (i % 5) * 24}" y="${56 + Math.floor(i / 5) * 24}" width="22" height="22" rx="3" fill="none" stroke="${N}" stroke-width="1.6"/>${i < 7 ? `<circle cx="${69 + (i % 5) * 24}" cy="${67 + Math.floor(i / 5) * 24}" r="8" fill="${i < 5 ? T : A}"/>` : ""}`).join("")}<g fill="${N}"><circle cx="212" cy="140" r="6"/><circle cx="236" cy="140" r="6" opacity=".35"/><circle cx="260" cy="140" r="6" opacity=".35"/></g><rect x="200" y="60" width="80" height="12" rx="6" fill="#cfd8e0"/><rect x="200" y="80" width="60" height="12" rx="6" fill="#cfd8e0"/>`,
  ),
  scratchpad: frame(
    `<rect x="46" y="44" width="228" height="124" rx="8" fill="${W}" stroke="${N}" stroke-width="2.4"/>${[66, 86, 106, 126, 146].map((y) => `<path d="M58 ${y}H262" stroke="#cfe0f3" stroke-width="2"/>`).join("")}<path d="M62 96q16-26 30 0t30 0 30 0" fill="none" stroke="${R}" stroke-width="3.4" stroke-linecap="round"/><path d="m232 136 26-30 8 8-26 30-12 4Z" fill="${A}" stroke="${N}" stroke-width="2"/>`,
  ),
  mistakes: frame(
    `<rect x="46" y="48" width="108" height="112" rx="10" fill="${W}" stroke="${N}" stroke-width="2.4"/><path d="m80 82 24 24m0-24L80 106" stroke="${R}" stroke-width="5" stroke-linecap="round"/><rect x="60" y="124" width="80" height="10" rx="5" fill="#cfd8e0"/><path d="M166 104h26m-10-10 10 10-10 10" fill="none" stroke="${N}" stroke-width="3.4" stroke-linecap="round"/><rect x="204" y="48" width="74" height="112" rx="10" fill="${W}" stroke="${N}" stroke-width="2.4"/><path d="m224 92 12 14 22-28" fill="none" stroke="${T}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><rect x="216" y="124" width="50" height="10" rx="5" fill="#cfd8e0"/>`,
  ),
  progress: frame(
    `${[40, 64, 88, 112, 136].map((h, i) => `<rect x="${60 + i * 44}" y="${164 - h}" width="30" height="${h}" rx="6" fill="${[T, A, R, "#2f6db0", T][i]}" stroke="${N}" stroke-width="2.2"/>`).join("")}<path d="M50 168H282" stroke="${N}" stroke-width="3" stroke-linecap="round"/>`,
  ),
  family: frame(
    `<circle cx="112" cy="86" r="22" fill="${R}"/><rect x="86" y="110" width="52" height="54" rx="22" fill="#2f6db0"/><circle cx="196" cy="102" r="16" fill="${A}"/><rect x="178" y="120" width="36" height="44" rx="16" fill="${T}"/><rect x="226" y="124" width="40" height="40" rx="9" fill="${W}" stroke="${N}" stroke-width="2.4"/><circle cx="238" cy="136" r="3.4" fill="${N}"/><circle cx="254" cy="152" r="3.4" fill="${N}"/>`,
  ),
  write: frame(
    `<rect x="46" y="44" width="228" height="124" rx="8" fill="${W}" stroke="${N}" stroke-width="2.4"/><rect x="62" y="60" width="90" height="12" rx="6" fill="${T}"/>${[84, 102, 120, 138].map((y, i) => `<rect x="62" y="${y}" width="${196 - i * 24}" height="8" rx="4" fill="#cfd8e0"/>`).join("")}`,
  ),
};

/** Where each feature's two hotspots sit (percent of the picture) and what they say. */
export const HOTSPOTS = {
  daily: [
    [
      50,
      28,
      p(
        "A mix picked for today from what needs practice.",
        "Una mezcla elegida para hoy según lo que hay que practicar.",
      ),
    ],
    [
      64,
      58,
      p(
        "There is no timer. Each set makes fresh problems.",
        "No hay cronómetro. Cada serie crea problemas nuevos.",
      ),
    ],
  ],
  games: [
    [
      48,
      42,
      p(
        "Untimed games built from your grade's math facts.",
        "Juegos sin tiempo hechos con las operaciones básicas de su grado.",
      ),
    ],
    [
      75,
      76,
      p(
        "Match, hunt, sort and build: new games to try.",
        "Emparejar, buscar, ordenar y construir: juegos nuevos.",
      ),
    ],
  ],
  visual: [
    [
      40,
      46,
      p("A model shows the idea before the rule.", "Un modelo muestra la idea antes que la regla."),
    ],
    [76, 74, p("Short visual steps, then practice.", "Pasos visuales cortos y luego práctica.")],
  ],
  scratchpad: [
    [
      46,
      54,
      p(
        "Write a step or keep track of partial work.",
        "Escriban un paso o lleven la cuenta del trabajo parcial.",
      ),
    ],
    [
      78,
      72,
      p("Pick a page style: blank, lined, grid, dots or number line.", "Elijan un estilo de hoja: en blanco, con líneas, con cuadrícula, de puntos o con recta numérica."),
    ],
  ],
  mistakes: [
    [
      30,
      52,
      p("Missed problems are collected here.", "Los problemas con respuesta incorrecta se reúnen aquí."),
    ],
    [
      76,
      62,
      p(
        "Two fresh right answers in a row fix an entry.",
        "Dos respuestas correctas seguidas con problemas nuevos corrigen una entrada.",
      ),
    ],
  ],
  progress: [
    [
      42,
      56,
      p(
        "See stars, streaks and skills that are remembered.",
        "Vean estrellas, rachas y habilidades que ya se recuerdan.",
      ),
    ],
    [76, 38, p("Progress stays on this device.", "El progreso se queda en este dispositivo.")],
  ],
  family: [
    [
      36,
      56,
      p("Short activities for two to play together.", "Actividades cortas para jugar entre dos."),
    ],
    [
      78,
      74,
      p("Real-world activities to try at home.", "Actividades de la vida real para hacer en casa."),
    ],
  ],
  write: [
    [
      30,
      38,
      p("Explain a problem in your own words.", "Expliquen un problema con sus propias palabras."),
    ],
    [
      60,
      70,
      p(
        "Nothing is graded. Words and ideas grow.",
        "Nada se califica. Crecen las palabras y las ideas.",
      ),
    ],
  ],
};

export const preview = (id) => svg(ART[id], "preview-art");

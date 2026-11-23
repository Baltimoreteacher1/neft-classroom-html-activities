// The flagship canvas games that ship: one row each (Lexicon Tower Defense and Arena Blitz join when their modules land). The hub, the launcher, the host and the teacher view read this;
// a game's code is loaded only when it is played (`load`), its cover art is a tiny separate module (`cover`).
// Honesty: `domains` names the language skills the prompts exercise; nothing here claims a WIDA level is assessed.
export const ARCADE_GAMES = [
  {
    id: "syntax-odyssey", genre: ["Platform adventure", "Aventura de plataformas"], order: 2,
    title: ["Syntax Odyssey: Skyline Runner", "Odisea de la Sintaxis: Corredor del Cielo"],
    tag: ["Run and jump across sky islands. Solve sentence and word gates to power the energy bridges.", "Corre y salta por islas del cielo. Resuelve puertas de oraciones y palabras para encender los puentes de energía."],
    domains: ["Reading", "Writing", "Listening"], bands: ["3-5", "6-8"], minutes: 12, modes: ["classic", "survival"],
    questionPausesClock: true, load: () => import("./odyssey/index.js"), cover: () => import("./odyssey/cover.js"),
  },
];
export const ARCADE = Object.fromEntries(ARCADE_GAMES.map((g) => [g.id, g]));
export const isArcade = (id) => Boolean(ARCADE[id]);
export const arcadeBandOk = (g, band) => g.bands.includes(band);

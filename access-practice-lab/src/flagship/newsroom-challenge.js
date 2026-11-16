// Newsroom Challenge: interpret sources (an interview, a data chart, eyewitness accounts that conflict), judge
// reliability, separate fact from opinion, write a headline and a lead with the 5Ws, and revise for accuracy. The
// finished report can go to Book Studio (template informational-report). Three assignments per band.
// Content: newsroom-challenge-35.js, newsroom-challenge-68.js.
import { BAND_35 } from "./newsroom-challenge-35.js";
import { BAND_68 } from "./newsroom-challenge-68.js";

export const GAME = {
  id: "newsroom-challenge",
  use: "Inform",
  chapters: 3,
  icon: "mail",
  art: ["bg-newsroom", "char-reporter"],
  title: ["Newsroom Challenge", "Desafío de la redacción"],
  tagline: [
    "Check the sources, keep facts and opinions apart, and file an accurate story.",
    "Revisa las fuentes, separa hechos y opiniones y entrega una noticia precisa.",
  ],
  noun: ["Assignment", "Encargo"],
  verb: ["Take the assignment", "Aceptar el encargo"],
  done: ["Story filed", "Noticia entregada"],
  related: { href: "newsroom", title: ["Newsroom writing studio", "Estudio de redacción"] },
  book: "informational-report",
  bands: { "3-5": BAND_35, "6-8": BAND_68 },
};

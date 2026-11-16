// Evidence Detective: case files. Sort clues as relevant or irrelevant with a reason, choose the best-supported
// conclusion among plausible ones, defend it in writing (claim + evidence + reasoning), then answer a counterclaim.
// Three cases per band. Content: evidence-detective-35.js, evidence-detective-68.js.
import { BAND_35 } from "./evidence-detective-35.js";
import { BAND_68 } from "./evidence-detective-68.js";

export const GAME = {
  id: "evidence-detective",
  use: "Argue",
  chapters: 3,
  icon: "detective",
  art: ["bg-city", "char-detective"],
  title: ["Evidence Detective", "Detective de evidencia"],
  tagline: [
    "Sort the clues, pick the best conclusion, and defend it.",
    "Ordena las pistas, elige la mejor conclusión y defiéndela.",
  ],
  noun: ["Case", "Caso"],
  verb: ["Open the case file", "Abrir el expediente"],
  done: ["Case closed", "Caso cerrado"],
  related: { href: "arena", title: ["Argument Arena", "Arena de argumentos"] },
  book: "evidence-argument",
  bands: { "3-5": BAND_35, "6-8": BAND_68 },
};

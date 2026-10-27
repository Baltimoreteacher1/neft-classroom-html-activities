// The sentence that opens each round, written for the kind of hidden rule it holds. @fm2 FM-020
import { fmt, L } from "../../lang.js";

const PROMPTS = {
  cycle: {
    en: "Some shapes in this pattern are hiding. Use up to {probes} probes to reveal cells, find the part that repeats (the core), then say which shape is in cell {far}.",
    es: "Algunas figuras de este patrón están escondidas. Usa hasta {probes} pruebas para descubrir casillas, encuentra la parte que se repite (el núcleo) y di qué figura hay en la casilla {far}.",
  },
  machine: {
    en: "A mystery machine changes every “{in}” with one secret rule. You have {probes} probes. Collect clues, state the rule, then predict “{out}” when “{in}” is {far}.",
    es: "Una máquina misteriosa cambia cada «{in}» con una regla secreta. Tienes {probes} pruebas. Reúne pistas, di la regla y predice «{out}» cuando «{in}» es {far}.",
  },
  terms: {
    en: "A number pattern follows a secret rule. You have {probes} probes to ask for terms. Find the rule, then predict the term in position {far}.",
    es: "Un patrón de números sigue una regla secreta. Tienes {probes} pruebas para pedir términos. Encuentra la regla y predice el término de la posición {far}.",
  },
  figure: {
    en: "A shape pattern keeps growing. You have {probes} probes to look at figures and count tiles. Find the rule, then predict how many tiles figure {far} has.",
    es: "Un patrón de figuras sigue creciendo. Tienes {probes} pruebas para mirar figuras y contar fichas. Encuentra la regla y predice cuántas fichas tiene la figura {far}.",
  },
  chart: {
    en: "A jump pattern is hiding on a hundred chart. You have {probes} probes to uncover terms. Find the start and the jump, then predict term {far}.",
    es: "Un patrón de saltos se esconde en un tablero de cien. Tienes {probes} pruebas para descubrir términos. Encuentra el inicio y el salto, y predice el término {far}.",
  },
  two: {
    en: "Two machines follow two secret rules. You have {probes} probes to share between them. Find both rules, say how the machines are related, then predict machine B at step {far}.",
    es: "Dos máquinas siguen dos reglas secretas. Tienes {probes} pruebas para repartir entre ellas. Encuentra las dos reglas, di cómo se relacionan y predice la máquina B en el paso {far}.",
  },
  typed: {
    en: "A mystery function changes every “{in}” with one secret rule. You have {probes} probes. Decide whether it is linear, write the rule, then predict “{out}” when “{in}” is {far}.",
    es: "Una función misteriosa cambia cada «{in}» con una regla secreta. Tienes {probes} pruebas. Decide si es lineal, escribe la regla y predice «{out}» cuando «{in}» es {far}.",
  },
};

const lower = (copy, lang) => L(copy, lang).toLowerCase();
const nameOf = (round, side, lang) =>
  round.ctx ? L(round.names[side], lang) : lower(round.names[side], lang);
// The names of the input and output as the learner reads them, e.g. "hours" and "dollars".
export const quantity = (round, side, lang) =>
  round.form === "cycle" ? lower(round.names[side], lang) : nameOf(round, side, lang);

export function promptFor(round) {
  const key =
    round.form === "cycle"
      ? "cycle"
      : round.form === "two"
        ? "two"
        : round.form === "typed"
          ? "typed"
          : round.show === "terms"
            ? "terms"
            : round.show === "figure"
              ? "figure"
              : round.show === "chart"
                ? "chart"
                : "machine";
  const out = {};
  for (const lang of ["en", "es"]) {
    out[lang] = fmt(PROMPTS[key][lang], {
      probes: round.probes,
      far: round.far,
      in: quantity(round, "in", lang),
      out: quantity(round, "out", lang),
    });
  }
  return out;
}

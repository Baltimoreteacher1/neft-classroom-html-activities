// The shared percent models (curriculum/learning-labs/shared/models) draw their labels in English. Wrapped in
// core.js bilingualText, this is what the Spanish reader sees: the double number line, the tape and their rules.
const BASE = {
  Percent: "Porcentaje",
  Amount: "Cantidad",
  Tape: "Cinta",
  "Whole = Part ÷ Percent": "Entero = Parte ÷ Porcentaje",
  "Part = Percent × Whole": "Parte = Porcentaje × Entero",
};

export const percentModelEs = (t) =>
  BASE[t] ??
  t
    .replace(/^part = whole /, "parte = entero ")
    .replace(/^part /, "parte ")
    .replace(/^whole /, "entero ")
    .replace(/^Whole \(base\): /, "Entero (base): ")
    .replace(/^Part: /, "Parte: ")
    .replace(/^Step down: the known part is already (\S+), so (\S+) is /, "Baja: la parte conocida ya es $1, así que $2 es ")
    .replace(/^Step down: (\S+) is (\S+), so (\S+) is /, "Baja: $1 es $2, así que $3 es ")
    .replace(/^Count up: 100% is (\S+) jumps of (\S+), so /, "Sube: 100% son $1 saltos de $2, así que ")
    .replace(/^(\S+ = \S+), so (.+)$/, "$1, así que $2");

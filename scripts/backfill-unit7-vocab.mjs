#!/usr/bin/env node
// Backfill Unit 7 (and 6-7) vocab to the 5-6 term norm.
// Each lesson ships only 4 terms; this appends 1-2 accurate, grade-appropriate
// terms (bilingual term/def + a `visual` caption + a cloze) consistent with the
// lesson's standard. Idempotent: skips any term already present (by term name).
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// term, termEs, definition, definitionEs, visual, cloze
const ADD = {
  // 7-1 — 6.EE.6 Write Equations
  "7-1": [
    {
      term: "Constant",
      termEs: "Constante",
      definition: "A fixed number in an expression or equation that does not change.",
      definitionEs: "Un número fijo en una expresión o ecuación que no cambia.",
      visual: "In x + 7 = 12, the numbers 7 and 12 are constants; only x can change.",
      cloze: "A fixed number that does not change is a ___.",
    },
    {
      term: "Unknown",
      termEs: "Incógnita",
      definition: "The value you are trying to find, usually shown with a variable.",
      definitionEs: "El valor que intentas encontrar, mostrado normalmente con una variable.",
      visual: "In n + 5 = 12, n is the unknown; you solve to find n = 7.",
      cloze: "The value you are trying to find in an equation is the ___.",
    },
  ],
  // 7-2 — 6.EE.7 One-step add/subtract equations
  "7-2": [
    {
      term: "One-step equation",
      termEs: "Ecuación de un paso",
      definition: "An equation you can solve in a single step using one inverse operation.",
      definitionEs: "Una ecuación que puedes resolver en un solo paso usando una operación inversa.",
      visual: "x + 4 = 9 is solved in one step: subtract 4 from both sides, so x = 5.",
      cloze: "An equation solved in a single step is a ___.",
    },
    {
      term: "Balance",
      termEs: "Equilibrio",
      definition: "Keeping both sides of an equation equal by doing the same thing to each side.",
      definitionEs: "Mantener ambos lados de una ecuación iguales haciendo lo mismo a cada lado.",
      visual: "If you subtract 4 from the left side, you must subtract 4 from the right to keep balance.",
      cloze: "Doing the same thing to both sides to keep them equal keeps the equation in ___.",
    },
  ],
  // 7-3 — 6.EE.7 Multiplication/division equations
  "7-3": [
    {
      term: "Coefficient",
      termEs: "Coeficiente",
      definition: "The number multiplied by a variable.",
      definitionEs: "El número que multiplica a una variable.",
      visual: "In 6x = 18, the coefficient is 6; divide both sides by 6 to get x = 3.",
      cloze: "The number multiplied by a variable is the ___.",
    },
    {
      term: "Solution",
      termEs: "Solución",
      definition: "The value of the variable that makes the equation true.",
      definitionEs: "El valor de la variable que hace verdadera la ecuación.",
      visual: "x = 3 is the solution of 6x = 18 because 6 × 3 = 18.",
      cloze: "The value of the variable that makes an equation true is the ___.",
    },
  ],
  // 7-4 — 6.EE.8 Write Inequalities
  "7-4": [
    {
      term: "Variable",
      termEs: "Variable",
      definition: "A letter that stands for an unknown number.",
      definitionEs: "Una letra que representa un número desconocido.",
      visual: "In x > 5, the letter x stands for any number greater than 5.",
      cloze: "A letter that stands for an unknown number is a ___.",
    },
    {
      term: "No more than",
      termEs: "No más de",
      definition: "A phrase meaning less than or equal to (≤).",
      definitionEs: "Una frase que significa menor o igual que (≤).",
      visual: "\"No more than 8 people\" means people ≤ 8.",
      cloze: "The phrase that means less than or equal to is \"no more than,\" written with the ___ symbol.",
    },
  ],
  // 7-5 — 6.EE.8 Graph Inequalities
  "7-5": [
    {
      term: "Inequality",
      termEs: "Desigualdad",
      definition: "A math sentence comparing two amounts with <, >, ≤, or ≥.",
      definitionEs: "Una oración matemática que compara dos cantidades con <, >, ≤ o ≥.",
      visual: "x ≥ 3 is an inequality; it is graphed as a closed circle on 3 with an arrow to the right.",
      cloze: "A math sentence comparing two amounts with <, >, ≤, or ≥ is an ___.",
    },
    {
      term: "Boundary point",
      termEs: "Punto límite",
      definition: "The number on the number line where the solution set starts.",
      definitionEs: "El número en la recta numérica donde comienza el conjunto solución.",
      visual: "For x > 5, the boundary point is 5, shown with an open circle.",
      cloze: "The number where the solution set begins on the number line is the ___.",
    },
  ],
  // 7-6 — 6.EE.5 Solve and Graph Inequalities
  "7-6": [
    {
      term: "Solution set",
      termEs: "Conjunto solución",
      definition: "All of the values that make an inequality true.",
      definitionEs: "Todos los valores que hacen verdadera una desigualdad.",
      visual: "For x > 4, the solution set is every number greater than 4, such as 5, 6, 7, ...",
      cloze: "All the values that make an inequality true form the ___.",
    },
    {
      term: "Inverse operation",
      termEs: "Operación inversa",
      definition: "An operation that undoes another, used to isolate the variable.",
      definitionEs: "Una operación que deshace otra, usada para despejar la variable.",
      visual: "To solve x + 3 > 7, use the inverse of adding 3: subtract 3 to get x > 4.",
      cloze: "An operation that undoes another to isolate the variable is an ___.",
    },
  ],
  // 7-7 — 6.EE.7 Equations and Inequalities Problem Solving
  "7-7": [
    {
      term: "Variable",
      termEs: "Variable",
      definition: "A letter that stands for the unknown amount in a word problem.",
      definitionEs: "Una letra que representa la cantidad desconocida en un problema verbal.",
      visual: "\"5 less than a number is 12\" becomes x − 5 = 12, where x is the variable.",
      cloze: "A letter that stands for the unknown amount in a problem is a ___.",
    },
    {
      term: "Constraint",
      termEs: "Restricción",
      definition: "A limit in a problem that tells what values are allowed.",
      definitionEs: "Un límite en un problema que indica qué valores se permiten.",
      visual: "\"You can spend at most $20\" is a constraint: cost ≤ 20.",
      cloze: "A limit that tells which values are allowed in a problem is a ___.",
    },
  ],
  // 6-7 — 6.EE.3 Simplify Algebraic Expressions
  "6-7": [
    {
      term: "Term",
      termEs: "Término",
      definition: "A single number, variable, or product of them, separated by + or − signs.",
      definitionEs: "Un solo número, variable o producto de ellos, separado por signos + o −.",
      visual: "In 3x + 5 − 2x, the terms are 3x, 5, and 2x.",
      cloze: "A number or variable separated by + or − signs is a ___.",
    },
    {
      term: "Distributive property",
      termEs: "Propiedad distributiva",
      definition: "Multiplying a sum by a number means multiplying each part by that number.",
      definitionEs: "Multiplicar una suma por un número significa multiplicar cada parte por ese número.",
      visual: "3(x + 4) = 3·x + 3·4 = 3x + 12.",
      cloze: "Multiplying each part of a sum by a number uses the ___ property.",
    },
  ],
};

let changed = 0;
for (const [lesson, terms] of Object.entries(ADD)) {
  const path = join(root, "lessons", lesson, "config.json");
  const cfg = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(cfg.vocabulary)) cfg.vocabulary = [];
  const existing = new Set(
    cfg.vocabulary.map((v) => (v.term || "").trim().toLowerCase()),
  );
  let added = 0;
  for (const t of terms) {
    if (existing.has(t.term.trim().toLowerCase())) continue;
    cfg.vocabulary.push(t);
    existing.add(t.term.trim().toLowerCase());
    added++;
  }
  if (added) {
    writeFileSync(path, JSON.stringify(cfg, null, 2) + "\n");
    changed++;
    console.log(`${lesson}: +${added} terms -> ${cfg.vocabulary.length} total`);
  } else {
    console.log(`${lesson}: no change (already present)`);
  }
}
console.log(`Done. ${changed} files updated.`);

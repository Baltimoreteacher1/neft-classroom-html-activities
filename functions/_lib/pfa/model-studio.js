// Shared, deterministic artwork and math for the optional lesson models.
import { bi } from "./problem-view.js";

const pair = (en, es) => ({ en, es });
const copies = (n, draw) => Array.from({ length: n }, (_, i) => draw(i)).join("");
const studioLabel = (x, y, value, style = "") =>
  `<text x="${x}" y="${y}" class="${style}" text-anchor="middle">${value}</text>`;
const studioLine = (x, y, x2, y2, style = "studio-axis") =>
  `<path class="${style}" d="M${x} ${y}L${x2} ${y2}"/>`;
const studioRect = (x, y, w, height, style, radius = 4) =>
  `<rect class="${style}" x="${x}" y="${y}" width="${w}" height="${height}" rx="${radius}"/>`;
const studioDot = (x, y, style, r = 7) => `<circle class="${style}" cx="${x}" cy="${y}" r="${r}"/>`;
const studioControl = (en, es, min, max, start) => ({ label: pair(en, es), min, max, start });
export const studioNum = (value) => String(value).replace("-", "−");
const studioTargets = (values, en, es) =>
  values.map((target) => ({
    target,
    prompt: pair(en.replace("{n}", studioNum(target)), es.replace("{n}", studioNum(target))),
  }));

export const MODELS = {
  ratio: {
    lessons: ["3-1", "3-3", "3-9"],
    title: pair("Mix in the same ratio", "Mezcla con la misma razón"),
    controls: [studioControl("Batches", "Tandas", 1, 5, 2)],
    tasks: studioTargets(
      [12, 15],
      "Make {n} cups of water without changing the mix.",
      "Usa {n} tazas de agua sin cambiar la mezcla.",
    ),
    talk: pair("How can you tell the mix stayed the same?", "¿Cómo sabes que la mezcla no cambió?"),
    measure: (n) => 3 * n,
    draw(n) {
      return {
        art: copies(5, (i) => {
          const x = 13 + i * 60;
          const style = i < n ? "" : " studio-empty";
          return (
            studioRect(x, 36, 54, 100, "studio-tile", 10) +
            copies(5, (j) =>
              studioDot(x + 27, 50 + j * 18, (j < 2 ? "studio-gold" : "studio-teal") + style, 6),
            ) +
            studioLabel(x + 27, 157, i + 1, "studio-small")
          );
        }),
        facts: [
          [pair("Juice concentrate", "Jugo concentrado"), pair(`${2 * n} cups`, `${2 * n} tazas`)],
          [pair("Water", "Agua"), pair(`${3 * n} cups`, `${3 * n} tazas`)],
          [pair("Per batch", "Por tanda"), "2 : 3"],
        ],
      };
    },
  },
  percent: {
    lessons: ["4-1", "4-2", "4-3", "4-4"],
    title: pair("Shade a percent", "Colorea un porcentaje"),
    controls: [studioControl("Shaded squares", "Cuadros sombreados", 0, 100, 25)],
    tasks: studioTargets(
      [40, 75],
      "Show {n} hundredths on the grid.",
      "Muestra {n} centésimas en la cuadrícula.",
    ),
    talk: pair(
      "Where do you see the fraction and the decimal in the same picture?",
      "¿Dónde ves la fracción y el decimal en la misma imagen?",
    ),
    measure: (n) => n,
    draw(n) {
      return {
        art: copies(100, (i) =>
          studioRect(
            73 + (i % 10) * 18,
            8 + Math.floor(i / 10) * 18,
            15,
            15,
            i < n ? "studio-teal" : "studio-tile",
            2,
          ),
        ),
        facts: [
          [pair("Fraction", "Fracción"), `${n}/100`],
          [
            pair("Decimal", "Decimal"),
            pair((n / 100).toFixed(2), (n / 100).toFixed(2).replace(".", ",")),
          ],
          [pair("Percent", "Porcentaje"), `${n}%`],
        ],
      };
    },
  },
  triangle: {
    lessons: ["5-2", "5-4"],
    title: pair("Build a triangle", "Construye un triángulo"),
    controls: [studioControl("Base", "Base", 2, 8, 6), studioControl("Height", "Altura", 2, 6, 3)],
    tasks: studioTargets(
      [12, 18],
      "Build a triangle with an area of {n} square units.",
      "Construye un triángulo con un área de {n} unidades cuadradas.",
    ),
    talk: pair(
      "Can you make the same area with a different base and height?",
      "¿Puedes obtener la misma área con otra base y otra altura?",
    ),
    measure: (b, h) => (b * h) / 2,
    draw(b, h) {
      const left = 160 - b * 12;
      const top = 166 - h * 24;
      const right = 320 - left;
      return {
        art:
          studioRect(left, top, b * 24, h * 24, "studio-tile", 0) +
          copies(b + 1, (i) => studioLine(left + i * 24, top, left + i * 24, 166, "studio-grid")) +
          copies(h + 1, (i) => studioLine(left, top + i * 24, right, top + i * 24, "studio-grid")) +
          `<path class="studio-wash" d="M${left} ${top}V166H${right}Z"/>` +
          studioLine(left, 166, right, 166) +
          studioLine(left, 166, left, top) +
          studioLabel(160, 187, b) +
          studioLabel(left - 16, (top + 166) / 2 + 5, h),
        facts: [
          [pair("Rectangle area", "Área del rectángulo"), `${b} × ${h} = ${b * h}`],
          [
            pair("Triangle area (square units)", "Área del triángulo (unidades cuadradas)"),
            `${b * h} ÷ 2 = ${(b * h) / 2}`,
          ],
        ],
      };
    },
  },
  expression: {
    lessons: ["6-6", "6-8", "6-14", "6-15"],
    title: pair("See the distributive property", "Visualiza la propiedad distributiva"),
    controls: [
      studioControl("Rows", "Filas", 1, 5, 3),
      studioControl("Teal tiles per row", "Fichas turquesa por fila", 1, 6, 4),
    ],
    tasks: studioTargets(
      [24, 28],
      "Make {n} tiles in all. Count both parts.",
      "Construye un total de {n} fichas. Cuenta ambas partes.",
    ),
    talk: pair(
      "How do both expressions count the same tiles?",
      "¿Cómo cuentan las dos expresiones las mismas fichas?",
    ),
    measure: (r, t) => r * (t + 2),
    draw(r, t) {
      return {
        art: copies(r, (row) =>
          copies(t + 2, (col) =>
            studioRect(
              160 - (t + 2) * 15 + col * 30 + (col < t ? -4 : 4),
              95 - r * 15 + row * 30,
              26,
              26,
              col < t ? "studio-teal" : "studio-gold",
              5,
            ),
          ),
        ),
        facts: [
          [
            pair("Count whole rows", "Cuenta las filas completas"),
            `${r} × (${t} + 2) = ${r * (t + 2)}`,
          ],
          [
            pair("Count each part", "Cuenta cada parte"),
            `${r} × ${t} + ${r} × 2 = ${r * t} + ${r * 2}`,
          ],
        ],
      };
    },
  },
  opposites: {
    lessons: ["7-1", "7-2", "7-3"],
    title: pair("Find the opposite", "Encuentra el opuesto"),
    controls: [studioControl("Number", "Número", -6, 6, 3)],
    tasks: studioTargets(
      [-4, 5],
      "Make the opposite equal to {n}.",
      "Haz que el opuesto sea igual a {n}.",
    ),
    talk: pair(
      "When is a number its own opposite? How does the model show it?",
      "¿Cuándo es un número su propio opuesto? ¿Cómo lo muestra el modelo?",
    ),
    measure: (n) => -n,
    draw(n) {
      const x = 160 + n * 22;
      const opposite = 320 - x;
      return {
        art:
          studioLine(17, 102, 303, 102) +
          copies(
            13,
            (i) =>
              studioLine(28 + i * 22, 96, 28 + i * 22, 108) +
              (i % 2 === 0 ? studioLabel(28 + i * 22, 128, studioNum(i - 6), "studio-small") : ""),
          ) +
          studioLine(160, 57, x, 57, "studio-trace") +
          studioLine(160, 155, opposite, 155, "studio-trace") +
          studioLine(x, 57, x, 102, "studio-guide") +
          studioLine(opposite, 102, opposite, 155, "studio-guide") +
          studioDot(x, 57, "studio-teal", 9) +
          studioRect(opposite - 8, 147, 16, 16, "studio-gold", 3) +
          studioLabel(x, 38, studioNum(n)) +
          studioLabel(opposite, 184, studioNum(-n)),
        facts: [
          [pair("● Number", "● Número"), studioNum(n)],
          [pair("■ Opposite", "■ Opuesto"), studioNum(-n)],
          [pair("Distance from zero", "Distancia desde cero"), Math.abs(n)],
        ],
      };
    },
  },
  balance: {
    lessons: ["8-1", "8-2", "8-7"],
    title: pair("Balance an equation", "Equilibra una ecuación"),
    controls: [
      studioControl("Value of x", "Valor de x", 0, 10, 2),
      studioControl("Right side", "Lado derecho", 3, 13, 9),
    ],
    tasks: [
      {
        target: 0,
        right: 9,
        prompt: pair("Choose x to balance x + 3 = 9.", "Elige x para equilibrar x + 3 = 9."),
      },
      {
        target: 0,
        right: 12,
        prompt: pair("Choose x to balance x + 3 = 12.", "Elige x para equilibrar x + 3 = 12."),
      },
    ],
    talk: pair(
      "How could you find x before touching the controls?",
      "¿Cómo podrías encontrar x antes de usar los controles?",
    ),
    measure: (x, r) => x + 3 - r,
    draw(x, r) {
      const tilt = (r - x - 3) * 2;
      const left = 82 - tilt;
      const right = 82 + tilt;
      return {
        art:
          `<path class="studio-tile" d="M160 82L138 152H182Z"/>` +
          studioLine(58, left, 262, right) +
          studioDot(160, 82, "studio-teal", 8) +
          studioLine(58, left, 58, left + 26) +
          studioLine(262, right, 262, right + 26) +
          studioRect(19, left + 26, 78, 36, "studio-teal", 8) +
          studioRect(223, right + 26, 78, 36, "studio-gold", 8) +
          studioLabel(58, left + 50, "x + 3") +
          studioLabel(262, right + 50, r),
        facts: [
          [pair("Left side", "Lado izquierdo"), `${x} + 3 = ${x + 3}`],
          [pair("Right side", "Lado derecho"), r],
          [
            pair("Compare", "Compara"),
            `${x + 3} ${x + 3 === r ? "=" : x + 3 < r ? "&lt;" : "&gt;"} ${r}`,
          ],
        ],
      };
    },
  },
  graph: {
    lessons: ["9-1", "9-2", "9-3", "9-4"],
    title: pair("Link a table and graph", "Conecta una tabla con una gráfica"),
    controls: [
      studioControl("Time (minutes)", "Tiempo (minutos)", 0, 6, 2),
      studioControl("Liters per minute", "Litros por minuto", 1, 4, 3),
    ],
    tasks: studioTargets(
      [12, 16],
      "Fill the tank with {n} liters. Find a rate and time that work.",
      "Llena el tanque con {n} litros. Encuentra una tasa y un tiempo que funcionen.",
    ),
    talk: pair(
      "How does the graph change when the tank fills faster?",
      "¿Cómo cambia la gráfica cuando el tanque se llena más rápido?",
    ),
    measure: (x, r) => x * r,
    draw(x, r) {
      const px = 48 + x * 39;
      const py = 158 - x * r * 5.5;
      return {
        art:
          copies(
            7,
            (i) =>
              studioLine(48, 158 - i * 22, 282, 158 - i * 22, "studio-grid") +
              studioLine(48 + i * 39, 26, 48 + i * 39, 158, "studio-grid") +
              studioLabel(48 + 39 * i, 182, i, "studio-small") +
              studioLabel(25, 163 - i * 22, 4 * i, "studio-small"),
          ) +
          studioLine(48, 26, 48, 158) +
          studioLine(48, 158, 282, 158) +
          studioLine(48, 158, 282, 158 - r * 33, "studio-trace") +
          studioLine(px, py, px, 158, "studio-guide") +
          studioDot(px, py, "studio-gold", 8) +
          studioLabel(301, 178, "x") +
          studioLabel(47, 17, "y"),
        facts: [
          [pair("Time, x (min)", "Tiempo, x (min)"), x],
          [pair("Water, y (L)", "Agua, y (L)"), x * r],
          [pair("Rule", "Regla"), `y = ${r}x`],
        ],
        table: Array.from({ length: 7 }, (_, i) => [i, i * r]),
      };
    },
  },
  center: {
    lessons: ["2-3", "2-8", "2-10"],
    title: pair("Move a point, compare centers", "Mueve un punto y compara los centros"),
    controls: [studioControl("Movable data point", "Dato móvil", 0, 12, 8)],
    tasks: studioTargets(
      [5, 6],
      "Move the data point until the mean is {n}.",
      "Mueve el dato hasta que la media sea {n}.",
    ),
    talk: pair(
      "If you move the point from 8 to 12, which measure of center changes more?",
      "Si mueves el dato de 8 a 12, ¿qué medida de centro cambia más?",
    ),
    measure: (n) => (18 + n) / 5,
    draw(n) {
      const fixed = [3, 4, 5, 6];
      const median = [...fixed, n].sort((a, b) => a - b)[2];
      const mean = (18 + n) / 5;
      const at = (v) => 28 + v * 22;
      return {
        art:
          studioLine(17, 119, 303, 119) +
          copies(
            13,
            (i) =>
              studioLine(at(i), 113, at(i), 125) +
              (i % 2 === 0 ? studioLabel(at(i), 144, i, "studio-small") : ""),
          ) +
          fixed.map((v) => studioDot(at(v), 102, "studio-teal")).join("") +
          studioDot(at(n), fixed.includes(n) ? 83 : 102, "studio-gold") +
          studioLine(at(mean), 40, at(mean), 70, "studio-trace") +
          studioLabel(at(mean), 28, "x̄") +
          studioLine(at(median), 151, at(median), 163, "studio-axis") +
          studioLabel(at(median), 183, "M"),
        facts: [
          [pair("Mean (x̄)", "Media (x̄)"), pair(String(mean), String(mean).replace(".", ","))],
          [pair("Median (M)", "Mediana (M)"), median],
        ],
      };
    },
  },
};

export const MODEL_BY_LESSON = Object.fromEntries(
  Object.entries(MODELS).flatMap(([key, model]) => model.lessons.map((id) => [id, key])),
);

export function modelGraphic(art) {
  return `<svg class="studio-graphic" viewBox="0 0 320 192" aria-hidden="true" focusable="false">${art}</svg>`;
}

export const STUDIO_COPY = {
  name: pair("Math Model Studio", "Estudio de modelos matemáticos"),
  instruction: pair(
    "Make a prediction. Change the model to test it.",
    "Haz una predicción. Cambia el modelo para comprobarla.",
  ),
  challenge: pair("Model challenge", "Reto con el modelo"),
  check: pair("Check the model", "Comprueba el modelo"),
  next: pair("Switch challenge", "Cambia de reto"),
  reset: pair("Reset model", "Restablece el modelo"),
  retry: pair(
    "Keep adjusting. Compare your model with the target.",
    "Sigue ajustando. Compara tu modelo con la meta.",
  ),
  correct: pair("You reached the target. How can you tell?", "Llegaste a la meta. ¿Cómo lo sabes?"),
  right: pair(
    "Set the right side to match the equation in the challenge.",
    "Ajusta el lado derecho para que coincida con la ecuación del reto.",
  ),
  partner: pair("Talk it through together", "Coméntenlo juntos"),
  solo: pair("Explain what you see", "Explica lo que ves"),
  decrease: pair("Decrease", "Reduce"),
  increase: pair("Increase", "Aumenta"),
  explore: pair("Explore the models", "Explora los modelos"),
  hubIntro: pair(
    "Pick a model, try a challenge, and compare what you notice.",
    "Elijan un modelo, prueben un reto y comparen lo que observan.",
  ),
  table: pair("View the full table", "Mira la tabla completa"),
  tableX: pair("Time (min)", "Tiempo (min)"),
  tableY: pair("Water (L)", "Agua (L)"),
};

export function studioFacts({ facts }) {
  return facts
    .map(
      ([label, value]) =>
        `<div><dt>${bi(label)}</dt><dd>${typeof value === "object" ? bi(value) : value}</dd></div>`,
    )
    .join("");
}

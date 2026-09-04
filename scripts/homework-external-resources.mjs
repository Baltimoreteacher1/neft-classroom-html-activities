/**
 * Curated topic-specific external links for family homework pages.
 * URLs verified against Khan Academy / Math Antics slugs for Grade 6 topics.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { detectVisualTopic } from "./homework-alignment.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const jsonPath = join(root, "data", "homework-external-resources.json");

const KA = "https://www.khanacademy.org";
const MA = "https://www.mathantics.com";

/** @type {Record<string, Array<{titleEn:string,titleEs:string,url:string,source:string}>>} */
const TOPIC_RESOURCES = {
  factors: [
    {
      titleEn: "Prime factorization",
      titleEs: "Factorización prima",
      url: `${KA}/math/pre-algebra/pre-algebra-factors-multiples/pre-algebra-prime-factorization-prep/v/prime-factorization`,
      source: "Khan Academy",
    },
    {
      titleEn: "GCF and LCM",
      titleEs: "MCD y MCM",
      url: `${KA}/math/pre-algebra/pre-algebra-factors-multiples/pre-algebra-gcf/v/greatest-common-factor-exercise`,
      source: "Khan Academy",
    },
  ],
  decimals: [
    {
      titleEn: "Adding & subtracting decimals",
      titleEs: "Sumar y restar decimales",
      url: `${KA}/math/arithmetic/arith-decimals/arith-review-add-sub-decimals/v/adding-decimals`,
      source: "Khan Academy",
    },
    {
      titleEn: "Multiplying decimals",
      titleEs: "Multiplicar decimales",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-arithmetic-operations/cc-6th-multiplying-decimals/v/multiplying-decimals`,
      source: "Khan Academy",
    },
  ],
  fractions: [
    {
      titleEn: "Dividing fractions",
      titleEs: "Dividir fracciones",
      url: `${KA}/math/arithmetic/fraction-arithmetic/arith-review-dividing-fractions/v/dividing-fractions-by-fractions`,
      source: "Khan Academy",
    },
    {
      titleEn: "Fraction division (Math Antics)",
      titleEs: "División de fracciones (Math Antics)",
      url: `${MA}/section/lesson/fractions`,
      source: "Math Antics",
    },
  ],
  ratios: [
    {
      titleEn: "Intro to ratios",
      titleEs: "Introducción a razones",
      url: `${KA}/math/pre-algebra/pre-algebra-ratios-rates/pre-algebra-ratios-intro/v/ratio-word-problems`,
      source: "Khan Academy",
    },
    {
      titleEn: "Ratio tables",
      titleEs: "Tablas de razones",
      url: `${KA}/math/pre-algebra/pre-algebra-ratios-rates/pre-algebra-ratios-prop/v/solving-ratio-problems-with-tables-exercise`,
      source: "Khan Academy",
    },
    {
      titleEn: "Unit rates",
      titleEs: "Tasas unitarias",
      url: `${KA}/math/pre-algebra/pre-algebra-ratios-rates/pre-algebra-ratios-prop/v/rate-problems`,
      source: "Khan Academy",
    },
  ],
  area: [
    {
      titleEn: "Area of parallelograms",
      titleEs: "Área de paralelogramos",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-geometry/cc-6th-area/v/area-of-parallelogram`,
      source: "Khan Academy",
    },
    {
      titleEn: "Area of triangles",
      titleEs: "Área de triángulos",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-geometry/cc-6th-area/v/area-of-triangle`,
      source: "Khan Academy",
    },
  ],
  exponents: [
    {
      titleEn: "Introduction to exponents",
      titleEs: "Introducción a exponentes",
      url: `${KA}/math/cc-sixth-grade-math/x0267d782:cc-6th-exponents-and-order-of-operations/cc-6th-exponents/v/introduction-to-exponents`,
      source: "Khan Academy",
    },
    {
      titleEn: "Squaring numbers",
      titleEs: "Elevar al cuadrado",
      url: `${KA}/math/cc-sixth-grade-math/x0267d782:cc-6th-exponents-and-order-of-operations/cc-6th-exponents/v/squaring-numbers`,
      source: "Khan Academy",
    },
  ],
  expressions: [
    {
      titleEn: "Writing expressions",
      titleEs: "Escribir expresiones",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-expressions-and-variables/cc-6th-writing-expressions/v/writing-expressions-with-variables`,
      source: "Khan Academy",
    },
    {
      titleEn: "Evaluating expressions",
      titleEs: "Evaluar expresiones",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-expressions-and-variables/cc-6th-evaluating-expressions/v/evaluating-expressions-with-two-variables`,
      source: "Khan Academy",
    },
  ],
  equations: [
    {
      titleEn: "Writing equations from words",
      titleEs: "Escribir ecuaciones desde palabras",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities/cc-6th-writing-equations/v/writing-equations-for-relationships-between-quantities`,
      source: "Khan Academy",
    },
    {
      titleEn: "One-step equation word problems",
      titleEs: "Problemas de ecuaciones de un paso",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities/cc-6th-one-step-equations/v/one-step-equation-word-problems`,
      source: "Khan Academy",
    },
  ],
  inequalities: [
    {
      titleEn: "Graphing inequalities",
      titleEs: "Graficar desigualdades",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities/cc-6th-inequalities/v/graphing-inequalities-on-a-number-line`,
      source: "Khan Academy",
    },
    {
      titleEn: "Inequality word problems",
      titleEs: "Problemas con desigualdades",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities/cc-6th-inequalities/v/inequalities-word-problems`,
      source: "Khan Academy",
    },
  ],
  statistics: [
    {
      titleEn: "Mean, median, and mode",
      titleEs: "Media, mediana y moda",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-data-statistics/cc-6th-mean-median/v/calculating-the-mean`,
      source: "Khan Academy",
    },
    {
      titleEn: "Box plots",
      titleEs: "Diagramas de caja",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-data-statistics/cc-6th-box-plot/v/constructing-a-box-and-whisker-plot`,
      source: "Khan Academy",
    },
  ],
  "coordinate-plane": [
    {
      titleEn: "Coordinate plane basics",
      titleEs: "Plano coordenado básico",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-negative-number/cc-6th-coordinate-plane/v/the-coordinate-plane`,
      source: "Khan Academy",
    },
    {
      titleEn: "Distance between points",
      titleEs: "Distancia entre puntos",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-negative-number/cc-6th-coordinate-plane/v/coordinate-plane-word-problems-exercise`,
      source: "Khan Academy",
    },
  ],
  "number-line": [
    {
      titleEn: "Absolute value",
      titleEs: "Valor absoluto",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-negative-number/cc-6th-absolute-value/v/absolute-value-of-integers`,
      source: "Khan Academy",
    },
    {
      titleEn: "Comparing integers",
      titleEs: "Comparar enteros",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-negative-number/cc-6th-comparing-negative/v/comparing-absolute-values`,
      source: "Khan Academy",
    },
  ],
  volume: [
    {
      titleEn: "Volume of rectangular prisms",
      titleEs: "Volumen de prismas rectangulares",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-geometry/cc-6th-volume/v/volume-with-unit-cubes`,
      source: "Khan Academy",
    },
    {
      titleEn: "Volume word problems",
      titleEs: "Problemas de volumen",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-geometry/cc-6th-volume/v/volume-word-problem-example`,
      source: "Khan Academy",
    },
  ],
  "surface-area": [
    {
      titleEn: "Nets and surface area",
      titleEs: "Redes y área de superficie",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-geometry/cc-6th-surface-area/v/nets-of-3d-figures`,
      source: "Khan Academy",
    },
    {
      titleEn: "Surface area of prisms",
      titleEs: "Área de superficie de prismas",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-geometry/cc-6th-surface-area/v/surface-area-using-a-net-rectangular-prism`,
      source: "Khan Academy",
    },
  ],
  fallback: [
    {
      titleEn: "Grade 6 math overview",
      titleEs: "Resumen de matemáticas de 6° grado",
      url: `${KA}/math/cc-sixth-grade-math`,
      source: "Khan Academy",
    },
  ],
};

/**
 * Hand-picked extra links, keyed by STANDARD rather than by lesson number.
 *
 * They used to be keyed by lesson id, and the 2026-08-10 Reveal-TOC renumber
 * moved the lessons out from under them without moving the links: lesson 6-1
 * became "Division Expressions with Fractions and Whole Numbers" and kept an
 * override pointing at Khan Academy's "Introduction to exponents", while 7-1
 * became "Explore Integers and Their Opposites" and kept "Writing equations
 * from word problems". Both shipped under a paragraph promising these links go
 * to "SPECIFIC videos about tonight's topic — not general math pages", which is
 * the sort of claim a stale key turns into a lie.
 *
 * A standard code describes the mathematics, so it survives a renumber, and
 * `validate:ccss` already fails the build on a standard no lesson declares.
 */
const STANDARD_OVERRIDES = {
  // 6.AT.2 — ratios and unit rates.
  "6.AT.2": [
    {
      titleEn: "Ratio tables walkthrough",
      titleEs: "Tablas de razones paso a paso",
      url: `${KA}/math/pre-algebra/pre-algebra-ratios-rates/pre-algebra-ratios-prop/v/solving-ratio-problems-with-tables-exercise`,
      source: "Khan Academy",
    },
  ],
  // 6.AT.5 — writing equations from a situation.
  "6.AT.5": [
    {
      titleEn: "Writing equations from word problems",
      titleEs: "Escribir ecuaciones desde problemas",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities/cc-6th-writing-equations/v/writing-equations-for-relationships-between-quantities`,
      source: "Khan Academy",
    },
  ],
  // 6.NOS.1 — dividing fractions by fractions. Was "Introduction to exponents".
  "6.NOS.1": [
    {
      titleEn: "Dividing a whole number by a fraction",
      titleEs: "Dividir un número entero entre una fracción",
      url: `${KA}/math/arithmetic/fraction-arithmetic/arith-review-dividing-fractions/v/dividing-a-whole-number-by-a-fraction`,
      source: "Khan Academy",
    },
  ],
  // 6.NOS.6 — integers and opposites. Was "Writing equations from word problems".
  "6.NOS.6": [
    {
      titleEn: "Negative numbers and opposites",
      titleEs: "Números negativos y opuestos",
      url: `${KA}/math/cc-sixth-grade-math/cc-6th-negative-number-topics/cc-6th-negative-numbers-intro/v/negative-numbers-introduction`,
      source: "Khan Academy",
    },
  ],
};

export function baseLessonId(lessonId) {
  return String(lessonId || "").replace(/-flagship$/, "");
}

export function getExternalResources(config, _lessonId) {
  const topic = detectVisualTopic(config);
  const fromTopic = TOPIC_RESOURCES[topic] || TOPIC_RESOURCES.fallback;
  const override = STANDARD_OVERRIDES[String(config?.standard || "").trim()] || [];

  const merged = [...override];
  for (const link of fromTopic) {
    if (merged.length >= 4) break;
    if (!merged.some((m) => m.url === link.url)) merged.push(link);
  }
  return merged.slice(0, 4);
}

/** Write data/homework-external-resources.json for all lessons (run at build time). */
export function writeExternalResourcesJson(lessons) {
  const out = {};
  for (const { id, config } of lessons) {
    out[id] = getExternalResources(config, id);
    const base = baseLessonId(id);
    if (base !== id && !out[base]) out[base] = getExternalResources(config, base);
  }
  writeFileSync(jsonPath, JSON.stringify(out, null, 2) + "\n");
  return jsonPath;
}

export function loadExternalResourcesFromJson(lessonId) {
  if (!existsSync(jsonPath)) return null;
  try {
    const data = JSON.parse(readFileSync(jsonPath, "utf8"));
    return data[lessonId] || data[baseLessonId(lessonId)] || null;
  } catch {
    return null;
  }
}

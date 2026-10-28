import { covers } from "./inventory.js";
import { makeRng, seedFrom } from "./rng.js";
import { estFor } from "./session.js";

const ID = /^[a-z][a-z0-9-]{1,40}$/;
const TERM_ALIASES = [
  [/count|number|digit|place value|scientific notation|expanded form/i, "number sense numbers numeration place value digits base ten scientific notation expanded form valor posicional cifras notación científica forma desarrollada"],
  [/fraction|share|part|whole/i, "fraction numerator denominator equivalent compare unit fraction equal parts fractions numerador denominador equivalente comparar partes iguales fracción"],
  [/multip|array|factor|product|binomial|area model|expand|distribut/i, "multiply multiplication times product factors equal groups array area model distribute expand polynomial binomial partial products multiplicar multiplicación producto factores grupos iguales modelo de área distributiva polinomio binomio"],
  [/divis|quotient|share equally/i, "divide division quotient equal groups fair shares dividir división cociente reparto grupos iguales"],
  [/decimal|tenths|hundredths|thousandths/i, "decimal tenths hundredths thousandths place value décimos centésimos milésimos decimal valor posicional"],
  [/ratio|percent|rate|proportion|slope/i, "ratio rate unit rate percent percentage proportion slope rate of change razón tasa tasa unitaria porcentaje proporción pendiente cambio"],
  [/equation|expression|algebra|variable|pattern|sequence|function/i, "algebra equation expression variable pattern sequence function solve equivalent terms combine like terms ecuación expresión variable patrón sucesión función resolver términos semejantes"],
  [/geometry|area|perimeter|volume|shape|length|angle|measurement/i, "geometry shape area perimeter volume length angle measure rectangle triangle geometry área perímetro volumen longitud ángulo medir rectángulo triángulo"],
  [/data|graph|chart|statistic|probab|mean|median/i, "data graph chart table statistics mean median mode range probability datos gráfica tabla promedio media mediana moda rango probabilidad"],
  [/money|price|cost|change|coin|dollar/i, "money price cost change coins dollars money dinero precio costo cambio monedas"],
  [/integer|number line|negative|opposite/i, "integer number line negative opposite absolute value entero recta numérica negativo opuesto valor absoluto"],
];

const GUIDE = [
  [/g8-expand|binomial/i, { en: "Use the two binomials as side lengths. Find each partial area, then combine like terms.", es: "Usa los dos binomios como lados. Halla cada área parcial y luego combina términos semejantes." }],
  [/fraction|numerator|denominator/i, { en: "Use equal parts and a visual model to compare, locate, or combine fractions.", es: "Usa partes iguales y un modelo visual para comparar, ubicar o combinar fracciones." }],
  [/multip|array|factor|product/i, { en: "Connect equal groups, an array, or an area model to multiplication; explain what each part represents.", es: "Relaciona los grupos iguales, una matriz o un modelo de área con la multiplicación; explica qué representa cada parte." }],
  [/divis|quotient|share/i, { en: "Use equal groups or fair shares to show what the quotient means.", es: "Usa grupos iguales o repartos justos para mostrar qué significa el cociente." }],
  [/decimal|place value|scientific notation|expanded form/i, { en: "Use place value to explain what each digit represents and how the number can be written.", es: "Usa el valor posicional para explicar qué representa cada cifra y cómo se puede escribir el número." }],
  [/ratio|percent|rate|proportion|slope/i, { en: "Compare the quantities with an equivalent ratio, rate, or percent, and explain what each number describes.", es: "Compara las cantidades con una razón, tasa o porcentaje equivalente y explica qué describe cada número." }],
  [/equation|expression|algebra|variable|pattern|sequence|function/i, { en: "Represent a relationship with a model, variables, or a rule, then explain how each part fits.", es: "Representa una relación con un modelo, variables o una regla y explica cómo encaja cada parte." }],
  [/geometry|area|perimeter|volume|shape|length|angle|measurement/i, { en: "Use labeled dimensions or units to model the shape and explain what is being measured.", es: "Usa medidas o unidades etiquetadas para representar la figura y explica qué se mide." }],
  [/data|graph|chart|statistic|probab|mean|median/i, { en: "Read the title and labels, then use the data as evidence for a comparison or conclusion.", es: "Lee el título y las etiquetas, y usa los datos como evidencia para comparar o concluir." }],
  [/money|price|cost|change|coin|dollar/i, { en: "Use the amounts and labels to make a calculation, then check whether it fits the situation.", es: "Usa las cantidades y etiquetas para calcular y comprueba si el resultado tiene sentido en la situación." }],
  [/number line|integer|negative|opposite/i, { en: "Use zero, the scale, and labeled intervals to locate and compare numbers.", es: "Usa el cero, la escala y los intervalos marcados para ubicar y comparar números." }],
];

const textOf = (value) => Array.isArray(value) ? value.map(textOf).join(" ") : typeof value === "string" ? value : value && typeof value === "object" ? Object.values(value).map(textOf).join(" ") : "";
const normalize = (text) => String(text || "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase();

export function skillSearchText(game, skill) {
  const catalog = [game?.title, game?.tagline, game?.searchTerms, game?.aliases, skill?.title, skill?.strand, skill?.standard, skill?.id, skill?.searchTerms, skill?.aliases].map(textOf).join(" ");
  const aliases = TERM_ALIASES.filter(([pattern]) => pattern.test(catalog)).map(([, terms]) => terms).join(" ");
  return normalize(`${catalog} ${aliases}`);
}

export function skillExplanation(skill, lang = "en") {
  const locale = lang === "es" ? "es" : "en";
  if (skill?.description?.[locale] || skill?.summary?.[locale]) return skill.description?.[locale] || skill.summary[locale];
  const descriptor = `${skill?.id || ""} ${textOf(skill?.title)} ${textOf(skill?.strand)}`;
  return GUIDE.find(([pattern]) => pattern.test(descriptor))?.[1][locale]
    || (locale === "es" ? "Resuelve el reto y explica cómo lo sabes." : "Work through the prompt and explain how you know.");
}

export function skillExample(game, skill, grade, lang = "en") {
  try {
    const seed = seedFrom("family-skill-example", grade, game.id, skill.id);
    const round = game.makeRound(skill.id, 1, makeRng(seed), grade);
    const prompt = round?.prompt;
    if (typeof prompt === "string") return prompt;
    return prompt?.[lang === "es" ? "es" : "en"] || skill.title?.[lang === "es" ? "es" : "en"] || "";
  } catch {
    return skill?.title?.[lang === "es" ? "es" : "en"] || "";
  }
}

export function findDirectedSkill(games, grade, skillId, gameId = "") {
  if (!Number.isInteger(grade) || grade < 0 || grade > 8 || typeof skillId !== "string" || !ID.test(skillId)) return null;
  const matches = [];
  for (const game of games || []) {
    if (gameId && game.id !== gameId) continue;
    const skill = (game.skills || []).find((entry) => entry.id === skillId && covers(entry, grade));
    if (skill) matches.push({ game, skill });
  }
  return matches.length === 1 ? matches[0] : null;
}

export function teacherSkillLink({ grade, gameId, skillId, minutes = 10, mode = "solo", lang = "en", path = "./" } = {}) {
  if (!Number.isInteger(grade) || grade < 0 || grade > 8 || typeof gameId !== "string" || !ID.test(gameId) || typeof skillId !== "string" || !ID.test(skillId)) return null;
  const duration = [5, 10, 15].includes(Number(minutes)) ? Number(minutes) : 10;
  const params = new URLSearchParams({ grade: String(grade), game: gameId, skill: skillId, minutes: String(duration), mode: mode === "together" ? "together" : "solo", lang: lang === "es" ? "es" : "en" });
  return `${path}?${params.toString()}`;
}

export function teacherMessage({ skill, grade, minutes, lang = "en", url } = {}) {
  if (!skill || !url) return "";
  const title = skill.title?.[lang] || skill[lang] || "the selected skill";
  const description = skill.description?.[lang] || skill.summary?.[lang] || (skill.id === "g8-expand"
    ? lang === "es"
      ? "Usen un modelo de área rectangular para multiplicar dos binomios, hallar las áreas parciales y combinar términos semejantes."
      : "Use a rectangle area model to multiply two binomials, find the partial areas, and combine like terms."
    : lang === "es"
      ? `Practica ${skill.es} y explica cómo sabes que tu estrategia funciona.`
      : `Practice ${skill.en} and explain how you know your strategy works.`);
  return lang === "es"
    ? `Práctica opcional de matemáticas: ${lang === "es" ? title : skill.title?.es || title} (${grade === 0 ? "Jardín de niños" : `Grado ${grade}`}), unos ${minutes} minutos. ${description} No es una tarea obligatoria ni una prueba de velocidad. ${url}`
    : `Optional math practice: ${lang === "en" ? title : skill.title?.en || title} (Grade ${grade === 0 ? "Kindergarten" : grade}), about ${minutes} minutes. ${description} This is not a required assignment or a speed test. ${url}`;
}

export function directedSkillPlan({ game, skill, grade, minutes = 10, mode = "solo", level = 1 } = {}) {
  if (!game || !skill || !covers(skill, grade)) return null;
  const duration = [5, 10, 15].includes(Number(minutes)) ? Number(minutes) : 10;
  const rounds = Math.max(1, Math.min(8, Math.round((duration * 60 - 15) / game.secPerRound)));
  const activity = { gameId: game.id, skillId: skill.id, level: Math.max(1, Math.min(3, Number(level) || 1)), rounds, role: mode === "together" ? "together" : "main", estSec: estFor(game, rounds) };
  return { grade, minutes: duration, mode: mode === "together" ? "together" : "solo", activities: [activity], estSec: activity.estSec, reflection: null };
}

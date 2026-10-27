/**
 * Publisher-Grade Family Co-Learning Engine
 * (`scripts/lib/homework-co-learning.mjs`)
 *
 * Powers the 7 core capabilities across all Family Practice · Part 1 and Part 2 modules:
 *  1. Clear Cognitive Differentiation: Part 1 ("Core Concept & Fluency (~8–10 mins)")
 *     vs. Part 2 ("Deepening, Error Analysis & Real-World Connection (~10 mins)")
 *  2. Dual-Persona Mode Switcher (`Student View` | `Caregiver Co-Pilot`)
 *  3. Inline Parameterized SVG Math Visuals (`homework-svg-models.mjs`)
 *  4. Interactive Mechanics with Full Fallback Safety (drag/drop + touch + click-to-select/place + Reset)
 *  5. Minimal Enterprise HUD & Bilingual Quick-Glossary + Dark/Light Theme Toggle
 *  6. Print-to-Fridge Stylesheet (`@media print`) with Socratic Prompts footer
 *  7. Deterministic Architecture + Structured Silent Logger (`?diagnostics=true`)
 */

import { renderTopicModelSVG } from "./homework-svg-models.mjs";
import { workedExampleFor } from "./homework-worked-example.mjs";

function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function _escAttr(str) {
  return esc(str).replace(/'/g, "&#39;");
}

function bi(en, es) {
  const safeEn = esc(en || "");
  const safeEs = esc(es || en || "");
  return `<span class="lang-en">${safeEn}</span><span class="lang-es" lang="es">${safeEs}</span>`;
}

export function isPart2Lesson(lessonId = "") {
  return /-part[23]$/i.test(String(lessonId || "").trim());
}

/**
 * Topic-specific pedagogical data:
 * - Caregiver Bridge ("How We Learned This Today vs. How You Learned It")
 * - Socratic Kitchen-Table Prompts
 * - Worked "Practice Partner" Example fallback
 * - Part 2 Application & Transfer Problem
 * - Part 2 "Be the Teacher: Spot the Glitch" Error Analysis
 * - Part 2 Spiral "Remember" Check
 * - Part 2 "Kitchen Table Math" Offline Prompt
 */
const TOPIC_CO_LEARNING_BANK = {
  ratios: {
    bridgeTodayEn:
      "Today we used tape diagrams and double number lines to see equivalent ratios as scaling both quantities by the same multiplier.",
    bridgeTodayEs:
      "Hoy usamos diagramas de cinta y rectas numéricas dobles para ver las razones equivalentes al escalar ambas cantidades por el mismo multiplicador.",
    bridgeTradEn:
      "You likely learned to cross-multiply or set up proportions with x. Our visual models build the intuition for WHY multiplying both parts by the same factor keeps the relationship invariant.",
    bridgeTradEs:
      "Probablemente aprendiste a multiplicar en cruz. Nuestros modelos visuales muestran POR QUÉ multiplicar ambas partes por el mismo factor mantiene la relación igual.",
    socraticPromptsEn: [
      "What does 1 box in the tape diagram represent?",
      "If we multiply the first quantity by this factor, what must we do to the second quantity to keep the taste/color the same?",
    ],
    socraticPromptsEs: [
      "¿Qué representa 1 caja en el diagrama de cinta?",
      "Si multiplicamos la primera cantidad por este factor, ¿qué debemos hacer con la segunda cantidad?",
    ],
    workedExample: {
      promptEn:
        "A smoothie recipe uses 3 cups of berries for every 2 cups of yogurt. If we use 12 cups of berries, how many cups of yogurt do we need?",
      promptEs:
        "Una receta de batido usa 3 tazas de bayas por cada 2 tazas de yogur. Si usamos 12 tazas de bayas, ¿cuántas tazas de yogur necesitamos?",
      steps: [
        {
          labelEn: "Draw the ratio model",
          labelEs: "Dibuja el modelo de razón",
          workEn: "3 boxes for berries : 2 boxes for yogurt.",
          workEs: "3 cajas para bayas : 2 cajas para yogur.",
        },
        {
          labelEn: "Find the value of 1 box (scale factor)",
          labelEs: "Halla el valor de 1 caja (factor de escala)",
          workEn: "12 cups of berries ÷ 3 boxes = 4 cups per box.",
          workEs: "12 tazas de bayas ÷ 3 cajas = 4 tazas por caja.",
        },
        {
          labelEn: "Scale the second quantity",
          labelEs: "Escala la segunda cantidad",
          workEn: "2 boxes of yogurt × 4 cups per box = 8 cups of yogurt.",
          workEs: "2 cajas de yogur × 4 tazas por caja = 8 tazas de yogur.",
        },
      ],
      answerEn: "8 cups of yogurt (3 : 2 is equivalent to 12 : 8 because both parts scale by ×4).",
      answerEs:
        "8 tazas de yogur (3 : 2 es equivalente a 12 : 8 porque ambas partes escalan por ×4).",
    },
    transfer: {
      stemEn:
        "A community garden mixes 4 scoops of compost with 6 scoops of topsoil for every raised bed. A neighbor wants to make a smaller batch using 2 scoops of compost, and a larger batch using 10 scoops of compost. How many scoops of topsoil does each batch need?",
      stemEs:
        "Un jardín comunitario mezcla 4 cucharadas de abono con 6 cucharadas de tierra para cada cama de cultivo. Un vecino quiere hacer un lote más pequeño con 2 cucharadas de abono y uno más grande con 10 cucharadas de abono. ¿Cuántas cucharadas de tierra necesita cada lote?",
      choices: [
        {
          en: "Small batch: 3 scoops; Large batch: 15 scoops",
          es: "Lote pequeño: 3 cucharadas; Lote grande: 15 cucharadas",
          correct: true,
        },
        {
          en: "Small batch: 4 scoops; Large batch: 12 scoops",
          es: "Lote pequeño: 4 cucharadas; Lote grande: 12 cucharadas",
          correct: false,
        },
        {
          en: "Small batch: 2 scoops; Large batch: 14 scoops",
          es: "Lote pequeño: 2 cucharadas; Lote grande: 14 cucharadas",
          correct: false,
        },
      ],
      reasoningEn:
        "Simplifying 4 : 6 by ÷2 gives 2 scoops of compost to 3 scoops of topsoil. Scaling 2 : 3 by ×5 gives 10 scoops of compost to 15 scoops of topsoil.",
      reasoningEs:
        "Simplificar 4 : 6 entre 2 da 2 de abono por 3 de tierra. Escalar 2 : 3 por ×5 da 10 de abono por 15 de tierra.",
    },
    glitch: {
      scenarioEn:
        "Jordan says: 'To go from a ratio of 3 : 5 to 6 : 8, I added 3 to both numbers (3 + 3 = 6 and 5 + 3 = 8), so 3 : 5 and 6 : 8 are equivalent ratios.'",
      scenarioEs:
        "Jordan dice: 'Para pasar de la razón 3 : 5 a 6 : 8, sumé 3 a ambos números (3 + 3 = 6 y 5 + 3 = 8), así que 3 : 5 y 6 : 8 son razones equivalentes.'",
      steps: [
        {
          en: "Step 1: Start with the ratio 3 : 5.",
          es: "Paso 1: Empezar con la razón 3 : 5.",
          isGlitch: false,
        },
        {
          en: "Step 2: Add +3 to both parts to get 6 : 8.",
          es: "Paso 2: Sumar +3 a ambas partes para obtener 6 : 8.",
          isGlitch: true,
        },
        {
          en: "Step 3: Check if the relationship stayed the same.",
          es: "Paso 3: Comprobar si la relación se mantuvo igual.",
          isGlitch: false,
        },
      ],
      fixEn:
        "Equivalent ratios require multiplying or dividing both quantities by the same factor—not adding! Doubling 3 : 5 by ×2 gives 6 : 10.",
      fixEs:
        "Las razones equivalentes requieren multiplicar o dividir ambas cantidades por el mismo factor, ¡no sumar! Duplicar 3 : 5 por ×2 da 6 : 10.",
      frameEn: "The glitch is in Step 2 because ratios scale by ___ instead of ___.",
      frameEs:
        "El error está en el Paso 2 porque las razones se escalan mediante ___ en lugar de ___.",
    },
    spiral: [
      {
        qEn: "Which ratio is equivalent to 4 : 5?",
        qEs: "¿Qué razón es equivalente a 4 : 5?",
        options: ["8 : 10", "5 : 6", "4 : 10"],
        correctIdx: 0,
        expEn: "Multiply both 4 and 5 by 2 to get 8 : 10.",
        expEs: "Multiplica tanto 4 como 5 por 2 para obtener 8 : 10.",
      },
      {
        qEn: "If 3 notebooks cost $6, what is the cost per 1 notebook?",
        qEs: "Si 3 cuadernos cuestan $6, ¿cuál es el costo por 1 cuaderno?",
        options: ["$2", "$3", "$18"],
        correctIdx: 0,
        expEn: "$6 ÷ 3 notebooks = $2 per notebook.",
        expEs: "$6 ÷ 3 cuadernos = $2 por cuaderno.",
      },
    ],
    kitchenTableEn:
      "At the kitchen table or pantry, pick any food label or recipe. Ask your student: 'If we doubled or halved this recipe for our family, how would the two main ingredients change together?'",
    kitchenTableEs:
      "En la cocina, elijan una etiqueta o receta. Pregunte: 'Si duplicamos o reducimos a la mitad esta receta para nuestra familia, ¿cómo cambiarían juntos los dos ingredientes principales?'",
  },

  percent: {
    bridgeTodayEn:
      "Today we modeled percents as rates per 100 using a 10×10 hundredths grid and double number lines where 100% aligns with the whole.",
    bridgeTodayEs:
      "Hoy modelamos los porcentajes como tasas por cada 100 usando una cuadrícula de 10×10 y rectas numéricas dobles donde el 100% se alinea con el total.",
    bridgeTradEn:
      "You likely learned to move the decimal point two places and multiply, or memorize 'is over of equals percent over 100'. The visual bar helps students benchmark 10%, 25%, and 50% mentally first.",
    bridgeTradEs:
      "Probablemente aprendiste a mover el punto decimal dos lugares. La barra visual ayuda a calcular primero el 10%, 25% y 50% mentalmente.",
    socraticPromptsEn: [
      "What number represents the whole (100%) in this problem?",
      "How can finding 10% or 25% first help us build the percent we need?",
    ],
    socraticPromptsEs: [
      "¿Qué número representa el total (100%) en este problema?",
      "¿Cómo nos ayuda hallar primero el 10% o el 25% para construir el porcentaje que necesitamos?",
    ],
    workedExample: {
      promptEn:
        "A jacket normally costs $40 and is on sale for 25% off. How much money do you save?",
      promptEs:
        "Una chaqueta cuesta normalmente $40 y tiene un 25% de descuento. ¿Cuánto dinero ahorras?",
      steps: [
        {
          labelEn: "Anchor 100% to the whole",
          labelEs: "Asocia el 100% con el total",
          workEn: "100% = $40 (the full price of the jacket).",
          workEs: "100% = $40 (el precio completo de la chaqueta).",
        },
        {
          labelEn: "Partition into 4 equal quarters (25% each)",
          labelEs: "Divide en 4 cuartos iguales (25% cada uno)",
          workEn: "100% ÷ 4 = 25%, so we divide $40 ÷ 4.",
          workEs: "100% ÷ 4 = 25%, así que dividimos $40 ÷ 4.",
        },
        {
          labelEn: "State the part",
          labelEs: "Indica la parte",
          workEn: "25% of $40 = $10 saved.",
          workEs: "25% de $40 = $10 ahorrados.",
        },
      ],
      answerEn: "$10 saved (and the sale price is $40 − $10 = $30).",
      answerEs: "$10 ahorrados (y el precio de oferta es $40 − $10 = $30).",
    },
    transfer: {
      stemEn:
        "A family phone battery has 60 minutes of video time left when it is at 75% charge. How many minutes of video time does the battery hold at a full 100% charge?",
      stemEs:
        "La batería de un teléfono tiene 60 minutos de video cuando está al 75% de carga. ¿Cuántos minutos de video dura la batería con una carga completa del 100%?",
      choices: [
        {
          en: "80 minutes (each 25% block is 20 minutes)",
          es: "80 minutos (cada bloque de 25% son 20 minutos)",
          correct: true,
        },
        {
          en: "85 minutes (add 25 minutes to 60)",
          es: "85 minutos (sumar 25 minutos a 60)",
          correct: false,
        },
        {
          en: "45 minutes (75% of 60 minutes)",
          es: "45 minutos (75% de 60 minutos)",
          correct: false,
        },
      ],
      reasoningEn:
        "75% is 3 blocks of 25%. Since 60 ÷ 3 = 20 minutes per 25% block, 100% (4 blocks) is 4 × 20 = 80 minutes.",
      reasoningEs:
        "75% son 3 bloques de 25%. Como 60 ÷ 3 = 20 minutos por cada 25%, el 100% (4 bloques) es 4 × 20 = 80 minutos.",
    },
    glitch: {
      scenarioEn:
        "Sam wants to find 30% of 50. Sam writes: '30% means 30 out of 100, so I subtract 50 − 30 = 20.'",
      scenarioEs:
        "Sam quiere hallar el 30% de 50. Sam escribe: '30% significa 30 de 100, así que resto 50 − 30 = 20.'",
      steps: [
        {
          en: "Step 1: Identify that 100% is 50.",
          es: "Paso 1: Identificar que el 100% es 50.",
          isGlitch: false,
        },
        {
          en: "Step 2: Subtract 50 − 30 to find 30%.",
          es: "Paso 2: Restar 50 − 30 para hallar el 30%.",
          isGlitch: true,
        },
        {
          en: "Step 3: Check if the part is reasonable.",
          es: "Paso 3: Comprobar si la parte tiene sentido.",
          isGlitch: false,
        },
      ],
      fixEn:
        "Percent is multiplicative, not subtractive! First find 10% of 50 (50 ÷ 10 = 5), then multiply by 3 to get 30%: 3 × 5 = 15.",
      fixEs:
        "¡El porcentaje es multiplicativo, no de resta! Primero halla el 10% de 50 (50 ÷ 10 = 5), luego multiplica por 3: 3 × 5 = 15.",
      frameEn:
        "Instead of subtracting 30, find 10% of 50 which is ___, then multiply by ___ to get 15.",
      frameEs:
        "En lugar de restar 30, halla el 10% de 50 que es ___, y multiplica por ___ para obtener 15.",
    },
    spiral: [
      {
        qEn: "What is 10% of 90?",
        qEs: "¿Cuánto es el 10% de 90?",
        options: ["9", "90", "80"],
        correctIdx: 0,
        expEn: "10% is one-tenth of the whole: 90 ÷ 10 = 9.",
        expEs: "El 10% es una décima parte del total: 90 ÷ 10 = 9.",
      },
      {
        qEn: "Which fraction and decimal match 50%?",
        qEs: "¿Qué fracción y decimal corresponden al 50%?",
        options: ["1/2 and 0.5", "1/5 and 0.05", "1/4 and 0.25"],
        correctIdx: 0,
        expEn: "50 per 100 simplifies to 1/2 or 0.5.",
        expEs: "50 de cada 100 se simplifica a 1/2 o 0.5.",
      },
    ],
    kitchenTableEn:
      "Look at a receipt, a store coupon, or a phone battery percentage together. Ask: 'How can we find 10% of a bill in our heads, and how would we double it to leave a 20% tip?'",
    kitchenTableEs:
      "Miren juntos un recibo, cupón o el porcentaje de batería del teléfono. Pregunte: '¿Cómo podemos hallar el 10% mentalmente y duplicarlo para calcular el 20%?'",
  },

  fractions: {
    bridgeTodayEn:
      "Today we used fraction bar models and common denominators to see how many equal-sized groups of a divisor fit inside a dividend.",
    bridgeTodayEs:
      "Hoy usamos modelos de barras de fracciones y denominadores comunes para ver cuántos grupos iguales del divisor caben dentro del dividendo.",
    bridgeTradEn:
      "You likely learned 'Keep, Change, Flip' (multiply by the reciprocal). Drawing the fraction bars first shows WHY dividing by 1/4 makes the answer 4 times larger—because 4 fourths fit in every 1 whole!",
    bridgeTradEs:
      "Probablemente aprendiste a 'mantener, cambiar e invertir' (multiplicar por el recíproco). Dibujar las barras primero muestra POR QUÉ dividir entre 1/4 hace que el resultado sea 4 veces mayor.",
    socraticPromptsEn: [
      "Are we asking 'how many groups of this size fit inside?' or 'how much is in 1 whole group?'",
      "Will the quotient be greater than 1 or less than 1? How do you know before calculating?",
    ],
    socraticPromptsEs: [
      "¿Estamos preguntando 'cuántos grupos de este tamaño caben adentro'?",
      "¿El cociente será mayor que 1 o menor que 1? ¿Cómo lo sabes antes de calcular?",
    ],
    workedExample: {
      promptEn: "How many 3/8-cup servings are in 3/4 cup of trail mix? Compute 3/4 ÷ 3/8.",
      promptEs:
        "¿Cuántas porciones de 3/8 de taza hay en 3/4 de taza de mezcla de frutos secos? Calcula 3/4 ÷ 3/8.",
      steps: [
        {
          labelEn: "Rewrite with a common denominator (eighths)",
          labelEs: "Reescribe con un denominador común (octavos)",
          workEn: "3/4 = 6/8, so the question becomes 6/8 ÷ 3/8.",
          workEs: "3/4 = 6/8, así que la pregunta es 6/8 ÷ 3/8.",
        },
        {
          labelEn: "Count how many groups of 3 eighths fit in 6 eighths",
          labelEs: "Cuenta cuántos grupos de 3 octavos caben en 6 octavos",
          workEn: "6 eighths ÷ 3 eighths = 6 ÷ 3 = 2 groups.",
          workEs: "6 octavos ÷ 3 octavos = 6 ÷ 3 = 2 grupos.",
        },
        {
          labelEn: "Verify with the reciprocal",
          labelEs: "Verifica con el recíproco",
          workEn: "(3/4) × (8/3) = 24/12 = 2.",
          workEs: "(3/4) × (8/3) = 24/12 = 2.",
        },
      ],
      answerEn: "2 servings of trail mix.",
      answerEs: "2 porciones de mezcla.",
    },
    transfer: {
      stemEn:
        "A carpenter has a board that is 5/6 yard long and cuts it into pieces that are each 1/6 yard long. How many pieces can the carpenter cut, and why?",
      stemEs:
        "Un carpintero tiene una tabla de 5/6 de yarda de largo y la corta en piezas de 1/6 de yarda cada una. ¿Cuántas piezas puede cortar y por qué?",
      choices: [
        {
          en: "5 pieces, because there are five 1/6-yard units inside 5/6 yard",
          es: "5 piezas, porque hay cinco unidades de 1/6 en 5/6",
          correct: true,
        },
        {
          en: "6 pieces, because the denominator is 6",
          es: "6 piezas, porque el denominador es 6",
          correct: false,
        },
        {
          en: "5/36 of a piece, by multiplying the denominators",
          es: "5/36 de pieza, multiplicando los denominadores",
          correct: false,
        },
      ],
      reasoningEn:
        "5/6 ÷ 1/6 asks how many 1/6s are in 5/6. Since the units are both sixths, 5 ÷ 1 = 5 pieces.",
      reasoningEs:
        "5/6 ÷ 1/6 pregunta cuántos sextos hay en 5/6. Como las unidades son sextos, 5 ÷ 1 = 5 piezas.",
    },
    glitch: {
      scenarioEn:
        "To solve 2/3 ÷ 1/6, Riley flips the FIRST fraction and writes: '(3/2) × (1/6) = 3/12 = 1/4.'",
      scenarioEs:
        "Para resolver 2/3 ÷ 1/6, Riley invierte la PRIMERA fracción y escribe: '(3/2) × (1/6) = 3/12 = 1/4.'",
      steps: [
        {
          en: "Step 1: Estimate that 1/6 is smaller than 2/3, so the answer should be > 1.",
          es: "Paso 1: Estimar que 1/6 es menor que 2/3, así que el resultado debe ser > 1.",
          isGlitch: false,
        },
        {
          en: "Step 2: Flip the dividend (2/3 → 3/2) instead of the divisor (1/6 → 6/1).",
          es: "Paso 2: Invertir el dividendo (2/3 → 3/2) en lugar del divisor (1/6 → 6/1).",
          isGlitch: true,
        },
        {
          en: "Step 3: Multiply numerators and denominators.",
          es: "Paso 3: Multiplicar numeradores y denominadores.",
          isGlitch: false,
        },
      ],
      fixEn:
        "We keep the total amount (2/3) and multiply by the reciprocal of the group size (1/6 → 6/1): (2/3) × 6 = 12/3 = 4.",
      fixEs:
        "Mantenemos la cantidad total (2/3) y multiplicamos por el recíproco del divisor (1/6 → 6/1): (2/3) × 6 = 12/3 = 4.",
      frameEn:
        "We flip the ___ (second fraction) because six sixths fit inside every 1 whole, giving ___.",
      frameEs:
        "Invertimos la ___ (segunda fracción) porque caben seis sextos en cada unidad, dando ___.",
    },
    spiral: [
      {
        qEn: "How many fourths (1/4) are in 2 wholes?",
        qEs: "¿Cuántos cuartos (1/4) hay en 2 enteros?",
        options: ["8", "4", "1/2"],
        correctIdx: 0,
        expEn: "Each whole has 4 fourths, so 2 wholes have 2 × 4 = 8 fourths.",
        expEs: "Cada entero tiene 4 cuartos, así que 2 enteros tienen 2 × 4 = 8 cuartos.",
      },
      {
        qEn: "Which fraction is equivalent to 2/3?",
        qEs: "¿Qué fracción es equivalente a 2/3?",
        options: ["4/6", "3/2", "2/6"],
        correctIdx: 0,
        expEn: "Multiply numerator and denominator by 2: (2×2)/(3×2) = 4/6.",
        expEs: "Multiplica numerador y denominador por 2: (2×2)/(3×2) = 4/6.",
      },
    ],
    kitchenTableEn:
      "Grab a measuring cup (like 1/2 cup or 1/4 cup) in the kitchen. Ask your student: 'If a recipe calls for 1 and 1/2 cups of flour, how many scoops of the 1/4-cup measure would we need?'",
    kitchenTableEs:
      "Tomen una taza medidora (como 1/2 o 1/4 de taza). Pregunte: 'Si una receta pide 1 taza y 1/2 de harina, ¿cuántas cucharadas de 1/4 de taza necesitaríamos?'",
  },

  equations: {
    bridgeTodayEn:
      "Today we modeled equations as balanced hangers and tape diagrams: whatever operation we do to one side, we must do to the other side to keep the hanger level.",
    bridgeTodayEs:
      "Hoy modelamos ecuaciones como colgadores equilibrados y diagramas de cinta: cualquier operación que hagamos en un lado, debemos hacerla en el otro para mantener el equilibrio.",
    bridgeTradEn:
      "You likely learned 'move the number across the equals sign and flip the sign'. The balanced hanger shows WHY: we are removing the same weight from both sides simultaneously.",
    bridgeTradEs:
      "Probablemente aprendiste a 'pasar el número al otro lado con el signo opuesto'. El colgador equilibrado muestra POR QUÉ: quitamos el mismo peso de ambos lados.",
    socraticPromptsEn: [
      "What weight can we remove from both sides of the hanger so it stays balanced?",
      "Once we find a value for the variable, how can we substitute it back into the original equation to be 100% sure?",
    ],
    socraticPromptsEs: [
      "¿Qué peso podemos quitar de ambos lados del colgador para que siga en equilibrio?",
      "Una vez que hallamos el valor de la variable, ¿cómo podemos sustituirlo en la ecuación original para comprobarlo?",
    ],
    workedExample: {
      promptEn: "Solve the balanced hanger equation: 2x + 4 = 12.",
      promptEs: "Resuelve la ecuación del colgador equilibrado: 2x + 4 = 12.",
      steps: [
        {
          labelEn: "Remove 4 units from both sides",
          labelEs: "Quita 4 unidades de ambos lados",
          workEn: "2x + 4 − 4 = 12 − 4  →  2x = 8.",
          workEs: "2x + 4 − 4 = 12 − 4  →  2x = 8.",
        },
        {
          labelEn: "Split the remaining weight equally between the 2 x-blocks",
          labelEs: "Divide el peso restante en partes iguales entre los 2 bloques x",
          workEn: "2x ÷ 2 = 8 ÷ 2  →  x = 4.",
          workEs: "2x ÷ 2 = 8 ÷ 2  →  x = 4.",
        },
        {
          labelEn: "Substitute to verify balance",
          labelEs: "Sustituye para verificar el equilibrio",
          workEn: "2(4) + 4 = 8 + 4 = 12 ✓.",
          workEs: "2(4) + 4 = 8 + 4 = 12 ✓.",
        },
      ],
      answerEn: "x = 4.",
      answerEs: "x = 4.",
    },
    transfer: {
      stemEn:
        "A concert ticket order has 3 identical tickets plus a $6 service fee, for a total of $30 (3t + 6 = 30). What is the price of 1 ticket (t)?",
      stemEs:
        "Un pedido de boletos incluye 3 boletos iguales más un cargo por servicio de $6, por un total de $30 (3t + 6 = 30). ¿Cuál es el precio de 1 boleto (t)?",
      choices: [
        {
          en: "t = $8 (subtract $6 fee to get $24, then divide by 3)",
          es: "t = $8 (restar el cargo de $6 para obtener $24, luego dividir entre 3)",
          correct: true,
        },
        {
          en: "t = $12 (add $6 to $30, then divide by 3)",
          es: "t = $12 (sumar $6 a $30, luego dividir entre 3)",
          correct: false,
        },
        {
          en: "t = $10 (divide $30 by 3 and ignore the fee)",
          es: "t = $10 (dividir $30 entre 3 e ignorar el cargo)",
          correct: false,
        },
      ],
      reasoningEn:
        "Subtract the $6 fee from both sides: 3t = 24. Divide by 3 tickets: t = $8 per ticket.",
      reasoningEs:
        "Resta el cargo de $6 en ambos lados: 3t = 24. Divide entre 3 boletos: t = $8 por boleto.",
    },
    glitch: {
      scenarioEn: "To solve x + 9 = 21, Taylor adds 9 to 21 and says x = 30.",
      scenarioEs: "Para resolver x + 9 = 21, Taylor suma 9 a 21 y dice que x = 30.",
      steps: [
        {
          en: "Step 1: Look at the equation x + 9 = 21.",
          es: "Paso 1: Observar la ecuación x + 9 = 21.",
          isGlitch: false,
        },
        {
          en: "Step 2: Add 9 to 21 to get x = 30.",
          es: "Paso 2: Sumar 9 a 21 para obtener x = 30.",
          isGlitch: true,
        },
        {
          en: "Step 3: Check by substituting x back into x + 9 = 21.",
          es: "Paso 3: Comprobar sustituyendo x en x + 9 = 21.",
          isGlitch: false,
        },
      ],
      fixEn:
        "To undo + 9, we use the inverse operation (− 9) on both sides: x = 21 − 9 = 12. Check: 12 + 9 = 21 ✓.",
      fixEs:
        "Para deshacer + 9, usamos la operación inversa (− 9) en ambos lados: x = 21 − 9 = 12. Comprobación: 12 + 9 = 21 ✓.",
      frameEn:
        "The glitch is in Step 2 because if x = 30, then 30 + 9 = 39 ≠ 21. We must ___ 9 from both sides.",
      frameEs:
        "El error está en el Paso 2 porque si x = 30, entonces 30 + 9 = 39 ≠ 21. Debemos ___ 9 en ambos lados.",
    },
    spiral: [
      {
        qEn: "Which value of n makes 5n = 35 true?",
        qEs: "¿Qué valor de n hace que 5n = 35 sea verdadero?",
        options: ["n = 7", "n = 30", "n = 40"],
        correctIdx: 0,
        expEn: "5 × 7 = 35, so n = 7.",
        expEs: "5 × 7 = 35, así que n = 7.",
      },
      {
        qEn: "Evaluate 3x + 2 when x = 4.",
        qEs: "Evalúa 3x + 2 cuando x = 4.",
        options: ["14", "36", "9"],
        correctIdx: 0,
        expEn: "3(4) + 2 = 12 + 2 = 14.",
        expEs: "3(4) + 2 = 12 + 2 = 14.",
      },
    ],
    kitchenTableEn:
      "Play 'Mystery Bag' at the table: put a hidden number of coins or spoons in your hand, add 3 visible ones next to it, and tell your student the total. Ask them to explain how to find what is hidden!",
    kitchenTableEs:
      "Jueguen a la 'Bolsa misteriosa': esconda algunas monedas en su mano, ponga 3 monedas visibles al lado y diga el total. ¡Pida a su estudiante que explique cómo descubrir cuántas hay escondidas!",
  },

  integers: {
    bridgeTodayEn:
      "Today we used horizontal and vertical number lines to compare positive and negative rational numbers and interpret absolute value as distance from 0.",
    bridgeTodayEs:
      "Hoy usamos rectas numéricas horizontales y verticales para comparar números racionales positivos y negativos e interpretar el valor absoluto como la distancia desde 0.",
    bridgeTradEn:
      "It is easy to look at −8 and −3 and think −8 is bigger because 8 > 3. On a thermometer or number line, numbers further to the right (or higher up) are always greater: −3 > −8.",
    bridgeTradEs:
      "Es fácil ver −8 y −3 y pensar que −8 es mayor porque 8 > 3. En un termómetro o recta numérica, los números más a la derecha (o más arriba) son siempre mayores: −3 > −8.",
    socraticPromptsEn: [
      "Where does each number live relative to 0 on the number line or thermometer?",
      "Is the question asking which number is GREATER (position) or which has a greater MAGNITUDE/distance from 0 (absolute value)?",
    ],
    socraticPromptsEs: [
      "¿Dónde se ubica cada número con respecto al 0 en la recta numérica o termómetro?",
      "¿La pregunta pide qué número es MAYOR (posición) o cuál tiene mayor DISTANCIA desde 0 (valor absoluto)?",
    ],
    workedExample: {
      promptEn: "Compare −2 and −5 using < or >, and find |−5|.",
      promptEs: "Compara −2 y −5 usando < o >, y halla |−5|.",
      steps: [
        {
          labelEn: "Locate both numbers on the number line",
          labelEs: "Ubica ambos números en la recta numérica",
          workEn: "−2 is 2 units left of 0; −5 is 5 units left of 0.",
          workEs: "−2 está 2 unidades a la izquierda de 0; −5 está 5 unidades a la izquierda de 0.",
        },
        {
          labelEn: "Compare position (further right is greater)",
          labelEs: "Compara la posición (más a la derecha es mayor)",
          workEn: "Since −2 is to the right of −5, −2 > −5.",
          workEs: "Como −2 está a la derecha de −5, −2 > −5.",
        },
        {
          labelEn: "Find distance from 0 (absolute value)",
          labelEs: "Halla la distancia desde 0 (valor absoluto)",
          workEn: "|−5| = 5 because distance is always non-negative.",
          workEs: "|−5| = 5 porque la distancia nunca es negativa.",
        },
      ],
      answerEn: "−2 > −5, and |−5| = 5.",
      answerEs: "−2 > −5, y |−5| = 5.",
    },
    transfer: {
      stemEn:
        "In a scuba diving log, Diver A is at −15 meters (15 meters below sea level) and Diver B is at −9 meters. Which diver is deeper, and which elevation is the greater number?",
      stemEs:
        "En un registro de buceo, el Buzo A está a −15 metros (15 metros bajo el nivel del mar) y el Buzo B está a −9 metros. ¿Qué buzo está a mayor profundidad y qué elevación es el número mayor?",
      choices: [
        {
          en: "Diver A is deeper (|−15| = 15 m), and −9 > −15 is the greater number",
          es: "El Buzo A está más profundo (|−15| = 15 m), y −9 > −15 es el número mayor",
          correct: true,
        },
        {
          en: "Diver A is deeper, and −15 > −9 is the greater number",
          es: "El Buzo A está más profundo, y −15 > −9 es el número mayor",
          correct: false,
        },
        {
          en: "Diver B is deeper, and −9 < −15",
          es: "El Buzo B está más profundo, y −9 < −15",
          correct: false,
        },
      ],
      reasoningEn:
        "Depth is distance from sea level (|−15| = 15 > |−9| = 9), so Diver A is deeper. On a vertical number line, −9 is higher than −15, so −9 > −15.",
      reasoningEs:
        "La profundidad es la distancia desde el nivel del mar (|−15| = 15 > |−9| = 9). En la recta vertical, −9 está más arriba que −15, así que −9 > −15.",
    },
    glitch: {
      scenarioEn:
        "Morgan writes: 'Since 7 is greater than 4, −7 is greater than −4 (−7 > −4), and |−7| = −7.'",
      scenarioEs:
        "Morgan escribe: 'Como 7 es mayor que 4, −7 es mayor que −4 (−7 > −4), y |−7| = −7.'",
      steps: [
        {
          en: "Step 1: Compare the magnitudes 7 and 4.",
          es: "Paso 1: Comparar las magnitudes 7 y 4.",
          isGlitch: false,
        },
        {
          en: "Step 2: Claim −7 > −4 and |−7| = −7.",
          es: "Paso 2: Afirmar que −7 > −4 y |−7| = −7.",
          isGlitch: true,
        },
        {
          en: "Step 3: Plot both points on the number line.",
          es: "Paso 3: Graficar ambos puntos en la recta numérica.",
          isGlitch: false,
        },
      ],
      fixEn:
        "On the negative side of 0, −4 is closer to 0 (further right) than −7, so −4 > −7. Also, absolute value measures distance from 0, so |−7| = 7.",
      fixEs:
        "En el lado negativo del 0, −4 está más cerca de 0 (más a la derecha) que −7, así que −4 > −7. Además, el valor absoluto mide distancia: |−7| = 7.",
      frameEn: "On the number line, −4 is to the ___ of −7, so −4 > −7, and |−7| is ___.",
      frameEs: "En la recta numérica, −4 está a la ___ de −7, así que −4 > −7, y |−7| es ___.",
    },
    spiral: [
      {
        qEn: "What is the opposite of −6?",
        qEs: "¿Cuál es el opuesto de −6?",
        options: ["6", "−6", "0"],
        correctIdx: 0,
        expEn: "6 and −6 are both 6 units from 0 on opposite sides.",
        expEs: "6 y −6 están ambos a 6 unidades del 0 en lados opuestos.",
      },
      {
        qEn: "Which statement is true?",
        qEs: "¿Qué afirmación es verdadera?",
        options: ["−1 > −5", "−5 > −1", "−5 > 0"],
        correctIdx: 0,
        expEn: "−1 is further right on the number line than −5.",
        expEs: "−1 está más a la derecha en la recta numérica que −5.",
      },
    ],
    kitchenTableEn:
      "Talk about temperatures or bank balances together: 'Which is warmer, −2°F or −10°F? If someone owes $10 (−10), why is their balance less than someone who owes $2 (−2)?'",
    kitchenTableEs:
      "Hablen sobre temperaturas o saldos: '¿Qué es más cálido, −2°F o −10°F? Si alguien debe $10 (−10), ¿por qué su saldo es menor que el de alguien que debe $2 (−2)?'",
  },

  coordinate: {
    bridgeTodayEn:
      "Today we plotted ordered pairs (x, y) across all four quadrants of the coordinate plane and found distances between points sharing a horizontal or vertical line.",
    bridgeTodayEs:
      "Hoy graficamos pares ordenados (x, y) en los cuatro cuadrantes del plano de coordenadas y hallamos distancias entre puntos que comparten una línea horizontal o vertical.",
    bridgeTradEn:
      "Remember the classic elevator phrase: 'Walk across the hall (x-axis horizontal) before you ride the elevator up or down (y-axis vertical).'",
    bridgeTradEs:
      "Recuerde la frase clásica del ascensor: 'Camina por el pasillo (eje x horizontal) antes de subir o bajar en el ascensor (eje y vertical).'",
    socraticPromptsEn: [
      "Starting at the origin (0, 0), which direction does the first coordinate (x) tell us to move?",
      "Do these two points share the same x-coordinate or the same y-coordinate? How far is each point from the axis?",
    ],
    socraticPromptsEs: [
      "Empezando en el origen (0, 0), ¿en qué dirección nos dice que nos movamos la primera coordenada (x)?",
      "¿Estos dos puntos comparten la misma coordenada x o la misma coordenada y?",
    ],
    workedExample: {
      promptEn: "Find the distance between A(−3, 2) and B(4, 2) on the coordinate plane.",
      promptEs: "Halla la distancia entre A(−3, 2) y B(4, 2) en el plano de coordenadas.",
      steps: [
        {
          labelEn: "Notice the shared coordinate",
          labelEs: "Observa la coordenada compartida",
          workEn: "Both points have y = 2, so they lie on the same horizontal line.",
          workEs: "Ambos puntos tienen y = 2, así que están en la misma línea horizontal.",
        },
        {
          labelEn: "Find each point's distance to the y-axis",
          labelEs: "Halla la distancia de cada punto al eje y",
          workEn: "A(−3, 2) is |−3| = 3 units left of the y-axis; B(4, 2) is |4| = 4 units right.",
          workEs:
            "A(−3, 2) está a |−3| = 3 unidades a la izquierda del eje y; B(4, 2) está a 4 unidades a la derecha.",
        },
        {
          labelEn: "Add distances across the axis",
          labelEs: "Suma las distancias al cruzar el eje",
          workEn: "3 + 4 = 7 units apart.",
          workEs: "3 + 4 = 7 unidades de distancia.",
        },
      ],
      answerEn: "7 units.",
      answerEs: "7 unidades.",
    },
    transfer: {
      stemEn:
        "A town map places the Library at (−2, −3) and the Park at (−2, 4). Each grid square is 1 block. How many blocks apart are the Library and the Park?",
      stemEs:
        "Un mapa del pueblo ubica la Biblioteca en (−2, −3) y el Parque en (−2, 4). Cada cuadro es 1 cuadra. ¿A cuántas cuadras de distancia están la Biblioteca y el Parque?",
      choices: [
        {
          en: "7 blocks (|−3| + |4| = 3 + 4 = 7 across the x-axis)",
          es: "7 cuadras (|−3| + |4| = 3 + 4 = 7 cruzando el eje x)",
          correct: true,
        },
        { en: "1 block (−3 + 4 = 1)", es: "1 cuadra (−3 + 4 = 1)", correct: false },
        {
          en: "4 blocks (using the x-coordinates −2 and −2)",
          es: "4 cuadras (usando las coordenadas x −2 y −2)",
          correct: false,
        },
      ],
      reasoningEn:
        "Both locations share x = −2. Moving from y = −3 up to y = 0 is 3 blocks, plus 4 blocks from y = 0 to y = 4 gives 7 blocks.",
      reasoningEs:
        "Ambos lugares comparten x = −2. Subir de y = −3 a y = 0 son 3 cuadras, más 4 cuadras hasta y = 4 son 7 cuadras.",
    },
    glitch: {
      scenarioEn:
        "To plot the point (0, −4), Alex moves 4 units left on the x-axis and puts a dot at (−4, 0).",
      scenarioEs:
        "Para graficar el punto (0, −4), Alex se mueve 4 unidades a la izquierda en el eje x y pone un punto en (−4, 0).",
      steps: [
        {
          en: "Step 1: Start at the origin (0, 0).",
          es: "Paso 1: Empezar en el origen (0, 0).",
          isGlitch: false,
        },
        {
          en: "Step 2: Move 4 units left on the x-axis instead of 0 left/right and 4 down on the y-axis.",
          es: "Paso 2: Moverse 4 unidades a la izquierda en el eje x en lugar de 0 horizontal y 4 hacia abajo en el eje y.",
          isGlitch: true,
        },
        {
          en: "Step 3: Label the plotted point.",
          es: "Paso 3: Rotular el punto graficado.",
          isGlitch: false,
        },
      ],
      fixEn:
        "In (x, y) = (0, −4), x = 0 means move 0 units left/right, and y = −4 means move 4 units DOWN along the vertical y-axis.",
      fixEs:
        "En (x, y) = (0, −4), x = 0 significa moverse 0 unidades a los lados, e y = −4 significa moverse 4 unidades HACIA ABAJO en el eje vertical y.",
      frameEn:
        "The first number in (0, −4) is the ___-coordinate, so we stay at 0 horizontally and move 4 units ___.",
      frameEs:
        "El primer número en (0, −4) es la coordenada ___, así que nos quedamos en 0 horizontalmente y bajamos 4 unidades ___.",
    },
    spiral: [
      {
        qEn: "In which quadrant is the point (−3, 5)?",
        qEs: "¿En qué cuadrante está el punto (−3, 5)?",
        options: [
          "Quadrant II (left, up)",
          "Quadrant IV (right, down)",
          "Quadrant III (left, down)",
        ],
        correctIdx: 0,
        expEn: "Negative x (left) and positive y (up) is Quadrant II.",
        expEs: "x negativo (izquierda) e y positivo (arriba) es el Cuadrante II.",
      },
      {
        qEn: "What are the coordinates of the origin?",
        qEs: "¿Cuáles son las coordenadas del origen?",
        options: ["(0, 0)", "(1, 1)", "(0, 1)"],
        correctIdx: 0,
        expEn: "The axes intersect at (0, 0).",
        expEs: "Los ejes se cruzan en (0, 0).",
      },
    ],
    kitchenTableEn:
      "Use a checkerboard, tiled floor, or city street grid: pick one corner as (0, 0) and take turns giving coordinates (east/west, north/south) to locate an object in the room!",
    kitchenTableEs:
      "Usen un piso de baldosas o tablero: elijan una esquina como (0, 0) y túrnense para dar coordenadas (izquierda/derecha, arriba/abajo) para ubicar un objeto.",
  },
};

export function getTopicCoLearningData(topic = "ratios", _config = {}) {
  const norm = String(topic || "ratios").toLowerCase();
  if (norm.includes("percent")) return TOPIC_CO_LEARNING_BANK.percent;
  if (norm.includes("frac") || norm.includes("div")) return TOPIC_CO_LEARNING_BANK.fractions;
  if (norm.includes("equat") || norm.includes("expr") || norm.includes("ineq"))
    return TOPIC_CO_LEARNING_BANK.equations;
  if (norm.includes("coord") || norm.includes("graph")) return TOPIC_CO_LEARNING_BANK.coordinate;
  if (norm.includes("int") || norm.includes("neg") || norm.includes("abs"))
    return TOPIC_CO_LEARNING_BANK.integers;
  return TOPIC_CO_LEARNING_BANK.ratios;
}

/**
 * 1. Minimal Enterprise HUD & Bilingual Quick-Glossary + Dual-Persona Mode Switcher
 */
export function renderCoLearningHud(config = {}, lessonId = "", vocab = []) {
  const part2 = isPart2Lesson(lessonId || config?.lessonId);
  const badgeEn = part2
    ? "Family Practice · Part 2 (Optional) — Deepening, Error Analysis & Real-World Connection (~10 mins)"
    : "Family Practice · Part 1 (Optional) — Core Concept & Fluency (~8–10 mins)";
  const badgeEs = part2
    ? "Práctica familiar · Parte 2 (Opcional) — Profundización, análisis de errores y conexión real (~10 min)"
    : "Práctica familiar · Parte 1 (Opcional) — Concepto central y fluidez (~8–10 min)";

  const topVocab = (Array.isArray(vocab) ? vocab : []).slice(0, 3);
  const fallbackVocab =
    topVocab.length > 0
      ? topVocab
      : [
          {
            term: "Equivalent Ratio",
            termEs: "Razón equivalente",
            definition: "Two ratios that express the same relationship between numbers.",
            definitionEs: "Dos razones que expresan la misma relación entre cantidades.",
            example: "2 : 3 and 4 : 6 (multiply both by 2)",
            nonExample: "2 : 3 and 4 : 5 (adding 2 is not scaling)",
            frame: "___ and ___ are equivalent because both parts scale by ___.",
            frameEs: "___ y ___ son equivalentes porque ambas partes se multiplican por ___.",
          },
        ];

  const vocabCardsHtml = fallbackVocab
    .map((v) => {
      const termEn = v.term || v.word || "Math Term";
      const termEs = v.termEs || v.wordEs || termEn;
      const defEn =
        v.plainEn || v.definition || "A key mathematical relationship from today's lesson.";
      const defEs = v.plainEs || v.definitionEs || defEn;
      const exEn = v.example || v.exampleEn || "Scaling both parts of a model equally (×2).";
      const nonExEn = v.nonExample || v.nonExampleEn || "Changing only one part of the model.";
      const frameEn =
        v.frame || v.sentenceFrame || `I can use ${termEn.toLowerCase()} to explain why...`;
      const frameEs =
        v.frameEs ||
        v.sentenceFrameEs ||
        `Puedo usar ${termEs.toLowerCase()} para explicar por qué...`;
      return `
        <article class="hw-glossary-card">
          <div class="hw-glossary-term-head">
            <strong class="hw-glossary-term">
              <span class="vg-en">${esc(termEn)}</span>
              <span class="vg-es" lang="es">${esc(termEs)}</span>
            </strong>
            <span class="hw-glossary-cue">🎨 <span class="vg-en">Visual Model Cue</span><span class="vg-es" lang="es">Clave visual</span></span>
          </div>
          <p class="hw-glossary-def">
            <span class="vg-en">${esc(defEn)}</span>
            <span class="vg-es" lang="es">${esc(defEs)}</span>
          </p>
          <div class="hw-glossary-meta-grid">
            <div class="hw-glossary-ex"><strong>✓ <span class="vg-en">Example:</span><span class="vg-es" lang="es">Ejemplo:</span></strong> <span>${esc(exEn)}</span></div>
            <div class="hw-glossary-nonex"><strong>✗ <span class="vg-en">Non-Example:</span><span class="vg-es" lang="es">Contraejemplo:</span></strong> <span>${esc(nonExEn)}</span></div>
          </div>
          <div class="hw-glossary-frame">
            <strong>🗣️ <span class="vg-en">Sentence Frame:</span><span class="vg-es" lang="es">Marco de oración:</span></strong>
            <em><span class="vg-en">"${esc(frameEn)}"</span><span class="vg-es" lang="es">"${esc(frameEs)}"</span></em>
          </div>
        </article>`;
    })
    .join("");

  return `
    <section class="hw-colearn-hud" id="hw_colearn_hud" aria-label="Family Co-Learning Studio Controls" data-part-mode="${part2 ? "part2" : "part1"}">
      <div class="hw-colearn-hud-top">
        <div class="hw-cognitive-pill" id="hw_cognitive_pill">
          <span class="hw-cognitive-dot" aria-hidden="true"></span>
          ${bi(badgeEn, badgeEs)}
        </div>
        <div class="hw-hud-tracker" id="hw_hud_tracker" aria-live="polite">
          <span class="hw-hud-metric"><span class="lang-en">Completed:</span><span class="lang-es" lang="es">Completado:</span> <strong id="hw_hud_completed">0/0</strong></span>
          <span class="hw-hud-sep" aria-hidden="true">·</span>
          <span class="hw-hud-metric"><span class="lang-en">Accuracy:</span><span class="lang-es" lang="es">Precisión:</span> <strong id="hw_hud_accuracy">100%</strong></span>
          <span class="hw-hud-sep" aria-hidden="true">·</span>
          <span class="hw-hud-metric"><span class="lang-en">Streak:</span><span class="lang-es" lang="es">Racha:</span> 🔥 <strong id="hw_hud_streak">0</strong></span>
        </div>
      </div>

      <div class="hw-colearn-hud-controls">
        <div class="hw-persona-switcher" id="hw_persona_switcher" role="group" aria-label="Persona View Switcher">
          <button type="button" class="hw-persona-btn is-active" data-persona-btn="student" aria-pressed="true" onclick="setHomeworkPersona('student')">
            <span aria-hidden="true">🧑‍🎓</span> ${bi("Student View", "Vista de estudiante")}
          </button>
          <button type="button" class="hw-persona-btn" data-persona-btn="copilot" aria-pressed="false" onclick="setHomeworkPersona('copilot')">
            <span aria-hidden="true">🧭</span> ${bi("Caregiver Co-Pilot", "Copiloto familiar")}
          </button>
        </div>

        <div class="hw-hud-utility-btns">
          <div class="hw-hud-lang-group" role="group" aria-label="Language Selector">
            <button type="button" class="hw-hud-lang-btn is-active" data-lang-mode="en" onclick="setLanguageMode('en')" title="English">English</button>
            <button type="button" class="hw-hud-lang-btn" data-lang-mode="es" onclick="setLanguageMode('es')" title="Español">Español</button>
            <button type="button" class="hw-hud-lang-btn" data-lang-mode="bilingual" onclick="setLanguageMode('bilingual')" title="Bilingual EN+ES">🇺🇸🇪🇸 Bilingual</button>
          </div>
          <button type="button" class="hw-hud-util-btn" id="hw_vocab_drawer_btn" aria-expanded="false" aria-controls="hw_vocab_drawer" onclick="toggleVocabQuickGlossary()">
            <span aria-hidden="true">📖</span> ${bi("Key Vocabulary", "Vocabulario clave")}
          </button>
          <button type="button" class="hw-hud-util-btn" id="hw_theme_toggle_btn" aria-pressed="false" onclick="toggleHomeworkTheme()" title="Toggle Light / Dark Theme">
            <span aria-hidden="true" id="hw_theme_icon">🌓</span> ${bi("Theme", "Tema")}
          </button>
        </div>
      </div>

      <div class="hw-vocab-drawer" id="hw_vocab_drawer" data-glossary-lang="en" hidden>
        <div class="hw-vocab-drawer-head">
          <h4>📖 ${bi("Bilingual Quick-Glossary & Sentence Frames", "Glosario rápido bilingüe y marcos de oración")}</h4>
          <div class="hw-vocab-lang-switch" role="group" aria-label="Glossary Language Toggle">
            <button type="button" class="hw-vocab-lang-btn is-active" id="hw_vocab_lang_en" onclick="setVocabDrawerLang('en')">English</button>
            <button type="button" class="hw-vocab-lang-btn" id="hw_vocab_lang_es" onclick="setVocabDrawerLang('es')">Español</button>
            <button type="button" class="hw-vocab-lang-btn" id="hw_vocab_lang_bi" onclick="setVocabDrawerLang('both')">EN + ES</button>
          </div>
        </div>
        <div class="hw-vocab-drawer-grid">
          ${vocabCardsHtml}
        </div>
      </div>
    </section>`;
}

/**
 * 2. Structured Co-Learning Modules inside Learn Tab:
 *    - Part 1: 60-Second Family Bridge + Worked "Practice Partner" Example
 *    - Part 2: Application & Transfer Problem + "Be the Teacher: Spot the Glitch" +
 *              Spiral "Remember" Check + "Kitchen Table Math" Offline Prompt
 */
export function renderLearnCoLearningModules(config = {}, lessonId = "", topic = "ratios") {
  const bank = getTopicCoLearningData(topic, config);
  const part2 = isPart2Lesson(lessonId || config?.lessonId);
  const authoredWorked = workedExampleFor(config);
  const we = authoredWorked
    ? {
        promptEn: authoredWorked.promptEn || bank.workedExample.promptEn,
        promptEs: authoredWorked.promptEs || bank.workedExample.promptEs,
        steps:
          Array.isArray(authoredWorked.steps) && authoredWorked.steps.length
            ? authoredWorked.steps.map((s, idx) => ({
                labelEn: s.labelEn || s.label || `Step ${idx + 1}`,
                labelEs: s.labelEs || `Paso ${idx + 1}`,
                workEn: s.workEn || s.en || s.work || "",
                workEs: s.workEs || s.es || s.workEn || s.en || "",
              }))
            : bank.workedExample.steps,
        answerEn: authoredWorked.answerEn || bank.workedExample.answerEn,
        answerEs: authoredWorked.answerEs || bank.workedExample.answerEs,
      }
    : bank.workedExample;

  const bridgeSvg = renderTopicModelSVG(topic, config, "bridge");
  const workedSvg = renderTopicModelSVG(topic, config, "worked");
  const transferSvg = renderTopicModelSVG(topic, config, "transfer");

  return `
    <!-- PART 1 CORE MODULES: 60-Second Family Bridge & Worked Practice Partner Example -->
    <section class="hw-colearn-card card-ish" id="hw_family_bridge_60s" data-colearn-section="bridge-60s">
      <div class="hw-colearn-header">
        <span class="hw-colearn-kicker">🌉 ${bi("60-SECOND FAMILY BRIDGE · VISUAL MODEL EXPLAINER", "PUENTE FAMILIAR DE 60 SEGUNDOS · MODELO VISUAL")}</span>
        <h3 class="hw-colearn-title">${bi("How Today's Visual Model Works", "Cómo funciona el modelo visual de hoy")}</h3>
      </div>
      <p class="hw-colearn-lead">${bi(bank.bridgeTodayEn, bank.bridgeTodayEs)}</p>
      <div class="hw-colearn-svg-stage" role="img" aria-label="Visual math model for today's lesson">
        ${bridgeSvg}
      </div>

      <!-- Caregiver Co-Pilot Callout (expanded automatically in Caregiver Co-Pilot view) -->
      <aside class="hw-copilot-card" data-copilot-bridge="true">
        <div class="hw-copilot-badge">🧭 ${bi("Caregiver Co-Pilot · How We Learned This Today vs. How You Learned It", "Copiloto familiar · Cómo lo aprendimos hoy vs. cómo lo aprendiste tú")}</div>
        <div class="hw-copilot-columns">
          <div class="hw-copilot-col">
            <strong>🏫 ${bi("In Class Today (Visual Model):", "Hoy en clase (Modelo visual):")}</strong>
            <p>${bi(bank.bridgeTodayEn, bank.bridgeTodayEs)}</p>
          </div>
          <div class="hw-copilot-col">
            <strong>🏡 ${bi("How You Likely Learned It:", "Cómo lo aprendiste probablemente:")}</strong>
            <p>${bi(bank.bridgeTradEn, bank.bridgeTradEs)}</p>
          </div>
        </div>
        <div class="hw-copilot-socratic">
          <strong>💬 ${bi("Socratic Kitchen-Table Prompts (Ask Instead of Telling):", "Preguntas socráticas para la mesa (Pregunta sin dar la respuesta):")}</strong>
          <ul>
            ${bank.socraticPromptsEn
              .map((qEn, i) => `<li><em>"${bi(qEn, bank.socraticPromptsEs[i] || qEn)}"</em></li>`)
              .join("")}
          </ul>
        </div>
      </aside>
    </section>

    <section class="hw-colearn-card card-ish" id="hw_worked_partner_example" data-colearn-section="worked-partner">
      <div class="hw-colearn-header">
        <span class="hw-colearn-kicker">🤝 ${bi("WORKED 'PRACTICE PARTNER' EXAMPLE · STEP-BY-STEP WALKTHROUGH", "EJEMPLO RESUELTO EN PAREJA · PASO A PASO")}</span>
        <h3 class="hw-colearn-title">${bi("Walk Through One Together First", "Revisen un ejemplo juntos primero")}</h3>
      </div>
      <p class="hw-colearn-stem">${bi(we.promptEn, we.promptEs)}</p>
      <div class="hw-colearn-svg-stage">
        ${workedSvg}
      </div>
      <ol class="hw-partner-steps">
        ${we.steps
          .map(
            (st, idx) => `
          <li class="hw-partner-step">
            <span class="hw-partner-step-num">${idx + 1}</span>
            <div class="hw-partner-step-body">
              <strong>${bi(st.labelEn, st.labelEs)}</strong>
              <p>${bi(st.workEn, st.workEs)}</p>
            </div>
          </li>`,
          )
          .join("")}
      </ol>
      <details class="hw-copilot-solution-key" ${part2 ? "" : "open"}>
        <summary>🔑 ${bi("Solution + Reasoning Key (Verify Your Thinking)", "Clave de solución y razonamiento")}</summary>
        <div class="hw-copilot-solution-body">
          <p><strong>${bi("Complete Reasoning:", "Razonamiento completo:")}</strong> ${bi(we.answerEn, we.answerEs)}</p>
        </div>
      </details>
    </section>

    <!-- PART 2 DEEPENING SUITE: Application & Transfer, Spot the Glitch, Spiral Check, Kitchen Table Math -->
    <section class="hw-colearn-card card-ish hw-part2-suite${part2 ? " is-part2-primary" : ""}" id="hw_part2_deepening_suite" data-colearn-section="part2-suite">
      <div class="hw-colearn-header">
        <span class="hw-colearn-kicker">🚀 ${bi(
          part2
            ? "PART 2 CORE FOCUS · DEEPENING, ERROR ANALYSIS & REAL-WORLD CONNECTION"
            : "PART 2 EXTENSION PREVIEW · DEEPENING, ERROR ANALYSIS & REAL-WORLD CONNECTION",
          part2
            ? "ENFOQUE PARTE 2 · PROFUNDIZACIÓN, ANÁLISIS DE ERRORES Y CONEXIÓN REAL"
            : "EXTENSIÓN PARTE 2 · PROFUNDIZACIÓN, ANÁLISIS DE ERRORES Y CONEXIÓN REAL",
        )}</span>
        <h3 class="hw-colearn-title">${bi("Transfer, Spot the Glitch & Kitchen Table Connection", "Transferencia, detecta el error y conexión en casa")}</h3>
      </div>

      <!-- 1. Application & Transfer Problem -->
      <div class="hw-subcard" id="hw_part2_application">
        <div class="hw-subcard-head">
          <span class="hw-subcard-tag">1 · ${bi("Application & Transfer Problem", "Problema de aplicación y transferencia")}</span>
        </div>
        <p class="hw-colearn-stem">${bi(bank.transfer.stemEn, bank.transfer.stemEs)}</p>
        <div class="hw-colearn-svg-stage">${transferSvg}</div>
        <div class="hw-transfer-choices" role="group" aria-label="Application problem choices">
          ${bank.transfer.choices
            .map(
              (c, cIdx) => `
            <button type="button" class="hw-transfer-choice-btn" data-correct="${c.correct ? "1" : "0"}" onclick="checkTransferProblem(this, ${c.correct ? "true" : "false"})">
              <span class="hw-choice-letter">${String.fromCharCode(65 + cIdx)}</span>
              <span class="hw-choice-copy">${bi(c.en, c.es)}</span>
            </button>`,
            )
            .join("")}
        </div>
        <div class="hw-transfer-feedback" id="hw_transfer_feedback" role="status" aria-live="polite" hidden>
          <p>${bi(bank.transfer.reasoningEn, bank.transfer.reasoningEs)}</p>
        </div>
        <details class="hw-copilot-solution-key">
          <summary>🧭 ${bi("Caregiver Solution + Reasoning Key", "Clave de solución y razonamiento para el adulto")}</summary>
          <div class="hw-copilot-solution-body">
            <p>${bi(bank.transfer.reasoningEn, bank.transfer.reasoningEs)}</p>
          </div>
        </details>
      </div>

      <!-- 2. "Be the Teacher: Spot the Glitch" Error Analysis -->
      <div class="hw-subcard" id="hw_spot_the_glitch">
        <div class="hw-subcard-head">
          <span class="hw-subcard-tag">2 · 🔍 ${bi("Be the Teacher: Spot the Glitch", "Sé el maestro: Detecta el error")}</span>
        </div>
        <p class="hw-colearn-stem">${bi(bank.glitch.scenarioEn, bank.glitch.scenarioEs)}</p>
        <p class="hw-glitch-instruction">${bi("Tap the step below where the math thinking went off track, then explain why to your family member:", "Toca el paso donde el razonamiento se desvió y explica por qué a tu familiar:")}</p>
        <div class="hw-glitch-steps" role="group" aria-label="Spot the glitch steps">
          ${bank.glitch.steps
            .map(
              (st) => `
            <button type="button" class="hw-glitch-step-btn" data-is-glitch="${st.isGlitch ? "1" : "0"}" onclick="checkSpotTheGlitch(this, ${st.isGlitch ? "true" : "false"})">
              ${bi(st.en, st.es)}
            </button>`,
            )
            .join("")}
        </div>
        <div class="hw-glitch-feedback" id="hw_glitch_feedback" role="status" aria-live="polite" hidden>
          <p><strong>💡 ${bi("Why it glitched & how to fix it:", "Por qué ocurrió el error y cómo corregirlo:")}</strong> ${bi(bank.glitch.fixEn, bank.glitch.fixEs)}</p>
          <p class="hw-glitch-frame"><strong>🗣️ ${bi("Explain out loud:", "Explica en voz alta:")}</strong> <em>"${bi(bank.glitch.frameEn, bank.glitch.frameEs)}"</em></p>
        </div>
      </div>

      <!-- 3. Spiral "Remember" Check -->
      <div class="hw-subcard" id="hw_spiral_remember">
        <div class="hw-subcard-head">
          <span class="hw-subcard-tag">3 · 🔄 ${bi("Spiral 'Remember' Check (Prior Lesson Retrieval)", "Repaso en espiral 'Recuerda'")}</span>
        </div>
        <div class="hw-spiral-grid">
          ${bank.spiral
            .map(
              (sp, sIdx) => `
            <div class="hw-spiral-item" id="hw_spiral_item_${sIdx}">
              <p class="hw-colearn-stem"><strong>#${sIdx + 1}:</strong> ${bi(sp.qEn, sp.qEs)}</p>
              <div class="hw-spiral-options">
                ${sp.options
                  .map(
                    (opt, oIdx) => `
                  <button type="button" class="hw-spiral-opt-btn" data-correct="${oIdx === sp.correctIdx ? "1" : "0"}" onclick="checkSpiralRemember(this, ${sIdx}, ${oIdx === sp.correctIdx ? "true" : "false"})">${esc(opt)}</button>`,
                  )
                  .join("")}
              </div>
              <p class="hw-spiral-exp" id="hw_spiral_exp_${sIdx}" hidden>${bi(sp.expEn, sp.expEs)}</p>
            </div>`,
            )
            .join("")}
        </div>
      </div>

      <!-- 4. "Kitchen Table Math" Offline Prompt -->
      <div class="hw-subcard hw-kitchen-offline-card" id="hw_kitchen_table_prompt" data-kitchen-table-prompt="true">
        <div class="hw-subcard-head">
          <span class="hw-subcard-tag">4 · 🍽️ ${bi("Kitchen Table Math · 2-Minute Offline Prompt", "Matemáticas en la mesa · Conversación de 2 minutos")}</span>
        </div>
        <p class="hw-kitchen-offline-text">${bi(bank.kitchenTableEn, bank.kitchenTableEs)}</p>
        <div class="hw-kitchen-socratic-note">
          <strong>🧭 ${bi("Caregiver Tip:", "Consejo para el adulto:")}</strong>
          <span>${bi(
            "No pencil needed—just listen for how your student describes the relationship in their own words!",
            "No necesitan lápiz: ¡solo escuche cómo su estudiante describe la relación con sus propias palabras!",
          )}</span>
        </div>
      </div>
    </section>`;
}

/**
 * 3. Per-Problem Caregiver Co-Pilot Callout Card
 */
export function renderProblemCoPilotCard(it = {}, pIdx = 0, topic = "ratios") {
  const bank = getTopicCoLearningData(topic);
  const socraticEn =
    it.coach ||
    bank.socraticPromptsEn[pIdx % bank.socraticPromptsEn.length] ||
    bank.socraticPromptsEn[0];
  const socraticEs =
    it.coachEs ||
    bank.socraticPromptsEs[pIdx % bank.socraticPromptsEs.length] ||
    bank.socraticPromptsEs[0];
  const ansEn =
    it.explanation ||
    (Array.isArray(it.choices) && typeof it.correct === "number"
      ? `Correct choice: ${it.choices[it.correct]}.`
      : it.answer !== undefined
        ? `Expected answer: ${it.answer}${it.unit ? " " + it.unit : ""}.`
        : "Check the step-by-step model in the Solution Key below.");
  const ansEs = it.explanationEs || ansEn;

  return `
    <aside class="hw-copilot-card hw-problem-copilot" id="hw_copilot_prob_${pIdx}" data-copilot-for="${pIdx}">
      <div class="hw-copilot-badge">🧭 ${bi(`Caregiver Co-Pilot · Problem ${pIdx + 1}`, `Copiloto familiar · Problema ${pIdx + 1}`)}</div>
      <p class="hw-copilot-socratic-line">
        <strong>💬 ${bi("Ask if stuck:", "Pregunta si se detiene:")}</strong>
        <em>"${bi(socraticEn, socraticEs)}"</em>
      </p>
      <p class="hw-copilot-bridge-line">
        <strong>🌉 ${bi("Model Bridge:", "Puente del modelo:")}</strong>
        <span>${bi(bank.bridgeTodayEn, bank.bridgeTodayEs)}</span>
      </p>
      <details class="hw-copilot-solution-key">
        <summary>🔑 ${bi("Solution + Reasoning Key", "Clave de solución y razonamiento")}</summary>
        <div class="hw-copilot-solution-body">
          <p>${bi(ansEn, ansEs)}</p>
        </div>
      </details>
    </aside>`;
}

/**
 * 4. Print-to-Fridge Socratic Prompts Footer (`@media print`)
 */
export function renderPrintSocraticFooter(config = {}, _lessonId = "", topic = "ratios") {
  const bank = getTopicCoLearningData(topic, config);
  return `
    <footer class="hw-print-socratic-footer" id="hw_print_socratic_footer" aria-label="Caregiver Socratic Prompts for Print">
      <div class="hw-print-socratic-inner">
        <h4>🧭 ${bi("Caregiver Socratic Prompts & Kitchen Table Notes (Print-to-Fridge Guide)", "Preguntas socráticas para la familia y notas de mesa")}</h4>
        <p><strong>${bi("How We Learned This Today vs. Traditional Method:", "Cómo lo aprendimos hoy vs. método tradicional:")}</strong> ${bi(bank.bridgeTodayEn + " " + bank.bridgeTradEn, bank.bridgeTodayEs + " " + bank.bridgeTradEs)}</p>
        <ul>
          ${bank.socraticPromptsEn
            .map(
              (qEn, i) =>
                `<li><strong>${bi("Ask:", "Pregunte:")}</strong> "${bi(qEn, bank.socraticPromptsEs[i] || qEn)}"</li>`,
            )
            .join("")}
          <li><strong>${bi("Kitchen Table Math:", "Matemáticas en la mesa:")}</strong> ${bi(bank.kitchenTableEn, bank.kitchenTableEs)}</li>
        </ul>
      </div>
    </footer>`;
}

/**
 * 5. Co-Learning CSS (Minimal Enterprise HUD, Dual-Persona, Dark Mode, Micro-Transitions, Print-to-Fridge)
 *    Strict rules: all font sizes >= 13.5px, all interactive buttons min-height: 44px, zero purple hex codes.
 */
export const CO_LEARNING_CSS = `
/* ============================================================
   FAMILY CO-LEARNING ENGINE — HUD, DUAL PERSONA, DARK MODE, PRINT
   ============================================================ */
:root {
  --colearn-surface: #ffffff;
  --colearn-soft: #f4f9f8;
  --colearn-border: #c5dedb;
  --colearn-navy: #12355b;
  --colearn-teal: #0f766e;
  --colearn-amber-bg: #fef7e0;
  --colearn-amber-border: #e5b84b;
  --colearn-amber-ink: #784f00;
}

html[data-theme="dark"] {
  --bg: #0f172a;
  --cream: #0f172a;
  --card: #1e293b;
  --st-paper: #0f172a;
  --st-surface: #1e293b;
  --st-soft: #162032;
  --ink: #f1f5f9;
  --st-ink: #f1f5f9;
  --muted: #cbd5e1;
  --st-ink-muted: #cbd5e1;
  --line: #334155;
  --st-border: #334155;
  --colearn-surface: #1e293b;
  --colearn-soft: #17253b;
  --colearn-border: #334155;
  --colearn-amber-bg: #2b2312;
  --colearn-amber-border: #b45309;
  --colearn-amber-ink: #fde68a;
}

html[data-theme="dark"] body {
  background: #0f172a !important;
  color: #f1f5f9 !important;
}

html[data-theme="dark"] .card,
html[data-theme="dark"] .card-ish,
html[data-theme="dark"] .problem-section,
html[data-theme="dark"] .hw-colearn-hud,
html[data-theme="dark"] .hw-colearn-card,
html[data-theme="dark"] .hw-subcard,
html[data-theme="dark"] .hw-glossary-card {
  background: #1e293b !important;
  color: #f1f5f9 !important;
  border-color: #334155 !important;
}

/* Minimal Enterprise HUD */
.hw-colearn-hud {
  margin: 0 0 14px 0;
  padding: 14px 18px;
  background: var(--colearn-surface);
  border: 2px solid var(--colearn-border);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(18, 53, 91, 0.06);
}

.hw-colearn-hud-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
}

.hw-cognitive-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  background: #e3f6f5;
  color: #0f514c;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
}

html[data-theme="dark"] .hw-cognitive-pill {
  background: #134e4a;
  color: #ccfbf1;
}

.hw-cognitive-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #0f766e;
  flex: 0 0 auto;
}

.hw-hud-tracker {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: var(--ink);
  background: var(--st-soft, #faf8f3);
  padding: 6px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
}

.hw-colearn-hud-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
}

.hw-persona-switcher {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  background: #eef4f8;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid #cbd5e1;
}

html[data-theme="dark"] .hw-persona-switcher {
  background: #0f172a;
  border-color: #334155;
}

.hw-hud-lang-group {
  display: inline-flex;
  gap: 4px;
  background: #f1f5f9;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
}

html[data-theme="dark"] .hw-hud-lang-group {
  background: #0f172a;
  border-color: #334155;
}

.hw-hud-lang-btn {
  border: 1px solid transparent;
  background: transparent;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  min-height: 38px;
  min-width: 38px;
}

.hw-hud-lang-btn.is-active {
  background: #12355b;
  color: #ffffff !important;
}

html[data-theme="dark"] .hw-hud-lang-btn {
  color: #cbd5e1;
}

html[data-theme="dark"] .hw-hud-lang-btn.is-active {
  background: #38bdf8;
  color: #0f172a !important;
}

.hw-persona-btn,
.hw-hud-util-btn,
.hw-hud-lang-btn,
.hw-vocab-lang-btn,
.hw-transfer-choice-btn,
.hw-glitch-step-btn,
.hw-spiral-opt-btn {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: opacity 160ms ease-out, transform 160ms ease-out;
}

.hw-persona-btn {
  border: 1px solid transparent;
  background: transparent;
  color: #1e293b;
}

html[data-theme="dark"] .hw-persona-btn {
  color: #e2e8f0;
}

.hw-persona-btn.is-active {
  background: #12355b;
  color: #ffffff !important;
  box-shadow: 0 2px 8px rgba(18, 53, 91, 0.22);
}

.hw-persona-btn.is-active .lang-en,
.hw-persona-btn.is-active .lang-es {
  color: #ffffff !important;
}

.hw-hud-utility-btns {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hw-hud-util-btn {
  background: var(--colearn-surface);
  color: var(--ink);
  border: 1.5px solid var(--colearn-border);
}

.hw-hud-util-btn:hover {
  border-color: var(--colearn-teal);
}

/* Bilingual Quick-Glossary Drawer */
.hw-vocab-drawer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1.5px dashed var(--line);
}

.hw-vocab-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.hw-vocab-drawer-head h4 {
  margin: 0;
  font-size: 16px;
  color: var(--ink);
}

.hw-vocab-lang-switch {
  display: inline-flex;
  gap: 6px;
}

.hw-vocab-lang-btn {
  background: #f1f5f9;
  color: #1e293b;
  border: 1px solid #cbd5e1;
}

.hw-vocab-lang-btn.is-active {
  background: #0f766e;
  color: #ffffff;
  border-color: #0f766e;
}

#hw_vocab_drawer[data-glossary-lang="en"] .vg-es { display: none !important; }
#hw_vocab_drawer[data-glossary-lang="es"] .vg-en { display: none !important; }
#hw_vocab_drawer[data-glossary-lang="both"] .vg-es {
  display: block;
  margin-top: 4px;
  padding-left: 8px;
  border-left: 2px solid #1fa6a2;
}

.hw-vocab-drawer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.hw-glossary-card {
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--st-soft, #faf8f3);
  font-size: 14px;
}

.hw-glossary-term-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.hw-glossary-term {
  font-size: 16px;
  color: var(--colearn-navy);
}

html[data-theme="dark"] .hw-glossary-term {
  color: #5eead4;
}

.hw-glossary-cue {
  font-size: 13.5px;
  font-weight: 700;
  color: #0f766e;
}

.hw-glossary-def {
  margin: 6px 0;
  font-size: 14.5px;
  line-height: 1.45;
}

.hw-glossary-meta-grid {
  display: grid;
  gap: 6px;
  margin: 8px 0;
  font-size: 13.5px;
}

.hw-glossary-ex {
  color: #047857;
}

.hw-glossary-nonex {
  color: #b45309;
}

.hw-glossary-frame {
  margin-top: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  background: #e3f6f5;
  color: #0f514c;
  font-size: 13.5px;
}

html[data-theme="dark"] .hw-glossary-frame {
  background: #134e4a;
  color: #ccfbf1;
}

/* Co-Learning Cards & Caregiver Co-Pilot Callouts */
.hw-colearn-card {
  margin: 18px 0;
  padding: 20px 22px;
  border-radius: 16px;
  border: 1.5px solid var(--colearn-border);
  background: var(--colearn-surface);
}

.hw-colearn-kicker {
  display: inline-block;
  font-size: 13.5px;
  font-weight: 800;
  letter-spacing: 0.03em;
  color: #0f766e;
  margin-bottom: 4px;
}

.hw-colearn-title {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: var(--ink);
}

.hw-colearn-lead,
.hw-colearn-stem,
.hw-kitchen-offline-text {
  font-size: 16px;
  line-height: 1.55;
  margin: 8px 0 12px 0;
}

.hw-colearn-svg-stage {
  margin: 12px 0;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: #ffffff;
  text-align: center;
  overflow-x: auto;
}

.hw-colearn-svg-stage svg {
  max-width: 100%;
  height: auto;
}

/* Caregiver Co-Pilot Callout Cards */
.hw-copilot-card {
  display: none;
  margin: 14px 0 0 0;
  padding: 16px 18px;
  border-radius: 14px;
  background: var(--colearn-amber-bg);
  border: 1.5px solid var(--colearn-amber-border);
  color: var(--ink);
  font-size: 14.5px;
  transition: opacity 180ms ease-out, transform 180ms ease-out;
}

body[data-persona-mode="copilot"] .hw-copilot-card {
  display: block;
}

.hw-copilot-badge {
  font-size: 14px;
  font-weight: 800;
  color: var(--colearn-amber-ink);
  margin-bottom: 10px;
}

.hw-copilot-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 10px;
}

.hw-copilot-col {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(229, 184, 75, 0.45);
}

html[data-theme="dark"] .hw-copilot-col {
  background: rgba(15, 23, 42, 0.65);
}

.hw-copilot-socratic ul {
  margin: 6px 0 0 18px;
  padding: 0;
}

.hw-copilot-solution-key {
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--colearn-border);
  background: var(--colearn-soft);
  font-size: 14.5px;
}

.hw-copilot-solution-key summary {
  cursor: pointer;
  font-weight: 800;
  min-height: 44px;
  display: flex;
  align-items: center;
}

/* Worked Partner Steps */
.hw-partner-steps {
  list-style: none;
  margin: 12px 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.hw-partner-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: var(--st-soft, #faf8f3);
}

.hw-partner-step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #12355b;
  color: #ffffff;
  font-size: 14px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.hw-partner-step-body p {
  margin: 4px 0 0 0;
  font-size: 15px;
}

/* Part 2 Subcards */
.hw-subcard {
  margin-top: 16px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--st-soft, #faf8f3);
}

.hw-subcard-tag {
  display: inline-block;
  font-size: 14px;
  font-weight: 800;
  color: #12355b;
  background: #e8f0f7;
  padding: 4px 10px;
  border-radius: 8px;
  margin-bottom: 8px;
}

html[data-theme="dark"] .hw-subcard-tag {
  background: #1e3a5f;
  color: #bae6fd;
}

.hw-transfer-choices,
.hw-glitch-steps {
  display: grid;
  gap: 8px;
  margin: 10px 0;
}

.hw-transfer-choice-btn,
.hw-glitch-step-btn,
.hw-spiral-opt-btn {
  width: 100%;
  text-align: left;
  background: var(--colearn-surface);
  color: var(--ink);
  border: 1.5px solid var(--line);
  justify-content: flex-start;
}

.hw-transfer-choice-btn.is-correct,
.hw-glitch-step-btn.is-correct,
.hw-spiral-opt-btn.is-correct {
  border-color: #047857 !important;
  background: #ecfdf5 !important;
  color: #065f46 !important;
  box-shadow: 0 0 0 3px rgba(4, 120, 87, 0.18);
}

.hw-transfer-choice-btn.is-incorrect,
.hw-glitch-step-btn.is-incorrect,
.hw-spiral-opt-btn.is-incorrect {
  border-color: #b91c1c !important;
  background: #fef2f2 !important;
  color: #991b1b !important;
}

.hw-choice-letter {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #1e293b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 14px;
  flex: 0 0 auto;
}

.hw-transfer-feedback,
.hw-glitch-feedback {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #ecfdf5;
  border: 1px solid #047857;
  color: #065f46;
  font-size: 14.5px;
}

.hw-spiral-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.hw-spiral-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hw-spiral-opt-btn {
  width: auto;
  flex: 1 1 auto;
  justify-content: center;
}

.hw-spiral-exp {
  margin-top: 8px;
  font-size: 14px;
  color: #047857;
  font-weight: 600;
}

/* Mastery Celebration Glow & Interactive Fallback Highlight */
.problem-section.correct {
  box-shadow: 0 0 0 3px rgba(15, 124, 74, 0.2), 0 10px 24px -12px rgba(15, 124, 74, 0.35);
  transition: opacity 180ms ease-out, transform 180ms ease-out;
}

.drag-order-row.is-tap-selected {
  outline: 3px solid #0f766e;
  background: #e3f6f5 !important;
}

/* Image & Math Visual Click-to-Enlarge Lightbox */
.is-zoomable { cursor: zoom-in; }
.is-zoomable:focus-visible { outline: 3px solid #0f766e; outline-offset: 2px; }
.hw-lightbox {
  position: fixed;
  inset: 0;
  z-index: 10000;
  width: auto;
  height: auto;
  max-width: none;
  max-height: none;
  margin: 0;
  padding: 24px;
  border: 0;
  box-sizing: border-box;
  background: rgba(15, 23, 42, 0.88);
  color: #fff;
  overflow: hidden;
}
.hw-lightbox[open] { display: flex; align-items: center; justify-content: center; }
.hw-lightbox:not([open]) { display: none; }
.hw-lightbox::backdrop { background: rgba(15, 23, 42, 0.88); }
.hw-lightbox-img {
  max-width: 96%;
  max-height: 92%;
  width: auto;
  height: auto;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
  cursor: zoom-out;
}
.hw-lightbox-node {
  max-width: 96%;
  max-height: 92%;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}
.hw-lightbox-node svg {
  max-width: min(92vw, 1200px) !important;
  max-height: 86vh !important;
  width: auto !important;
  height: auto !important;
  background: #ffffff !important;
  border-radius: 8px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
}
.hw-lightbox-close {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hw-lightbox-close:hover { background: rgba(255, 255, 255, 0.38); }
body.hw-lightbox-open { overflow: hidden; }
@media print { .hw-lightbox { display: none !important; } }

@media (prefers-reduced-motion: reduce) {
  .hw-persona-btn,
  .hw-hud-util-btn,
  .hw-vocab-lang-btn,
  .hw-transfer-choice-btn,
  .hw-glitch-step-btn,
  .hw-spiral-opt-btn,
  .hw-copilot-card,
  .problem-section.correct {
    transition: none !important;
  }
}

/* Print-to-Fridge Stylesheet (@media print) */
.hw-print-socratic-footer {
  display: none;
}

@media print {
  .hw-colearn-hud,
  .homework-tab-chrome,
  .bottom-status-bar,
  .hw-stepper-bar,
  .problem-check-row,
  .btn-listen-prob,
  .btn-listen-concept,
  .hw-hero-share-bar {
    display: none !important;
  }

  #hw_panel_learn,
  #hw_panel_check,
  #hw_family_bridge_60s,
  #hw_worked_partner_example,
  .hw-copilot-solution-key {
    display: block !important;
    visibility: visible !important;
  }

  .hw-colearn-svg-stage svg {
    background: #ffffff !important;
    filter: contrast(1.1);
  }

  .hw-print-socratic-footer {
    display: block !important;
    margin-top: 18px;
    padding: 14px 16px;
    border-top: 2px solid #000000;
    background: #ffffff !important;
    color: #000000 !important;
    font-size: 13.5px;
    page-break-inside: avoid;
  }
}
`;

/**
 * 6. Client Controller JS (Dual-Persona, HUD Tracker, Glossary Toggle, Theme Toggle,
 *    Click-to-Select/Click-to-Place Fallback, Reset Matching, and `?diagnostics=true` Validator)
 */
export const CO_LEARNING_JS = `
/* ============================================================
   FAMILY CO-LEARNING ENGINE — CLIENT CONTROLLER & DIAGNOSTICS
   ============================================================ */
(function () {
  var COLEARN_LOG = [];
  function logCoLearn(event, detail) {
    var entry = { ts: new Date().toISOString(), event: event, detail: detail || {} };
    COLEARN_LOG.push(entry);
    window.__HW_COLEARN_LOG__ = COLEARN_LOG;
  }

  window.setHomeworkPersona = function (mode) {
    var clean = mode === 'copilot' ? 'copilot' : 'student';
    document.body.setAttribute('data-persona-mode', clean);
    document.querySelectorAll('[data-persona-btn]').forEach(function (btn) {
      var active = btn.getAttribute('data-persona-btn') === clean;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (clean === 'copilot') {
      var grownup = document.getElementById('hw_grownup');
      if (grownup) grownup.open = true;
    }
    try {
      localStorage.setItem('hw_persona_' + (window.LESSON_ID || 'default'), clean);
    } catch (e) {}
    logCoLearn('persona_change', { mode: clean });
  };

  window.toggleVocabQuickGlossary = function () {
    var drawer = document.getElementById('hw_vocab_drawer');
    var btn = document.getElementById('hw_vocab_drawer_btn');
    if (!drawer) return;
    var willOpen = drawer.hidden;
    drawer.hidden = !willOpen;
    if (btn) btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    logCoLearn('glossary_toggle', { open: willOpen });
  };

  window.setVocabDrawerLang = function (lang) {
    var drawer = document.getElementById('hw_vocab_drawer');
    if (!drawer) return;
    var clean = (lang === 'es' || lang === 'both') ? lang : 'en';
    drawer.setAttribute('data-glossary-lang', clean);
    ['en', 'es', 'bi'].forEach(function (k) {
      var b = document.getElementById('hw_vocab_lang_' + k);
      if (b) {
        var match = (k === 'bi' && clean === 'both') || k === clean;
        b.classList.toggle('is-active', match);
      }
    });
    logCoLearn('glossary_lang', { lang: clean });
  };

  window.toggleHomeworkTheme = function () {
    var root = document.documentElement;
    var current = root.getAttribute('data-theme') || 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    var btn = document.getElementById('hw_theme_toggle_btn');
    if (btn) btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    try {
      localStorage.setItem('hw_theme_pref', next);
    } catch (e) {}
    logCoLearn('theme_toggle', { theme: next });
  };

  window.checkTransferProblem = function (btn, isCorrect) {
    if (!btn) return;
    var group = btn.closest('.hw-transfer-choices');
    if (group) {
      group.querySelectorAll('.hw-transfer-choice-btn').forEach(function (b) {
        b.classList.remove('is-correct', 'is-incorrect');
      });
    }
    btn.classList.add(isCorrect ? 'is-correct' : 'is-incorrect');
    var fb = document.getElementById('hw_transfer_feedback');
    if (fb) fb.hidden = false;
    logCoLearn('transfer_check', { correct: Boolean(isCorrect) });
  };

  window.checkSpotTheGlitch = function (btn, isGlitch) {
    if (!btn) return;
    var group = btn.closest('.hw-glitch-steps');
    if (group) {
      group.querySelectorAll('.hw-glitch-step-btn').forEach(function (b) {
        b.classList.remove('is-correct', 'is-incorrect');
      });
    }
    btn.classList.add(isGlitch ? 'is-correct' : 'is-incorrect');
    var fb = document.getElementById('hw_glitch_feedback');
    if (fb) fb.hidden = false;
    logCoLearn('spot_glitch', { foundGlitch: Boolean(isGlitch) });
  };

  window.checkSpiralRemember = function (btn, itemIdx, isCorrect) {
    if (!btn) return;
    var box = document.getElementById('hw_spiral_item_' + itemIdx);
    if (box) {
      box.querySelectorAll('.hw-spiral-opt-btn').forEach(function (b) {
        b.classList.remove('is-correct', 'is-incorrect');
      });
    }
    btn.classList.add(isCorrect ? 'is-correct' : 'is-incorrect');
    var exp = document.getElementById('hw_spiral_exp_' + itemIdx);
    if (exp) exp.hidden = false;
    logCoLearn('spiral_check', { itemIdx: itemIdx, correct: Boolean(isCorrect) });
  };

  window.resetMatchingProblem = function (pIdx) {
    var sec = document.getElementById('problem_' + pIdx);
    if (!sec) return;
    sec.classList.remove('correct', 'incorrect');
    sec.querySelectorAll('select.matching-select').forEach(function (sel) {
      sel.value = '';
      sel.classList.remove('is-correct', 'is-incorrect');
    });
    sec.querySelectorAll('.feedback-badge').forEach(function (b) {
      b.className = 'feedback-badge';
    });
    var res = document.getElementById('problem_result_' + pIdx);
    if (res) res.textContent = '';
    if (typeof saveState === 'function') saveState();
    if (typeof updateProgress === 'function') updateProgress();
    logCoLearn('reset_matching', { pIdx: pIdx });
  };

  /* Click-to-select / click-to-place fallback for .drag-order-row */
  function installDragOrderTapFallback() {
    var selectedRow = null;
    document.querySelectorAll('.drag-order-list').forEach(function (list) {
      if (list.dataset.tapFallbackBound) return;
      list.dataset.tapFallbackBound = '1';
      list.addEventListener('click', function (e) {
        if (e.target.closest('button')) return;
        var row = e.target.closest('.drag-order-row');
        if (!row) return;
        if (!selectedRow) {
          selectedRow = row;
          row.classList.add('is-tap-selected');
        } else if (selectedRow === row) {
          row.classList.remove('is-tap-selected');
          selectedRow = null;
        } else {
          var parent = row.parentNode;
          if (parent === selectedRow.parentNode) {
            var rows = Array.prototype.slice.call(parent.querySelectorAll('.drag-order-row'));
            var fromIdx = rows.indexOf(selectedRow);
            var toIdx = rows.indexOf(row);
            if (fromIdx < toIdx) parent.insertBefore(selectedRow, row.nextSibling);
            else parent.insertBefore(selectedRow, row);
            Array.prototype.slice.call(parent.querySelectorAll('.drag-order-row')).forEach(function (r, idx) {
              var num = r.querySelector('.drag-order-num');
              if (num) num.textContent = String(idx + 1);
            });
            if (typeof saveState === 'function') saveState();
            if (typeof updateProgress === 'function') updateProgress();
          }
          selectedRow.classList.remove('is-tap-selected');
          selectedRow = null;
        }
      });
    });
  }

  window.updateCoLearningHud = function () {
    var allProbs = document.querySelectorAll('#hw_panel_check .problems-container:first-of-type > .problem-section');
    if (!allProbs.length) allProbs = document.querySelectorAll('.problem-section');
    var total = allProbs.length;
    var done = 0;
    var correctCount = 0;
    var checkedCount = 0;
    allProbs.forEach(function (sec) {
      var isCor = sec.classList.contains('correct') || sec.classList.contains('reviewed');
      var isInc = sec.classList.contains('incorrect');
      if (isCor) {
        done++;
        correctCount++;
        checkedCount++;
      } else if (isInc) {
        checkedCount++;
      }
    });
    var acc = checkedCount > 0 ? Math.round((correctCount / checkedCount) * 100) : 100;
    var streak = typeof currentStreak === 'number' ? currentStreak : correctCount;
    var compEl = document.getElementById('hw_hud_completed');
    var accEl = document.getElementById('hw_hud_accuracy');
    var strEl = document.getElementById('hw_hud_streak');
    if (compEl) compEl.textContent = done + '/' + total;
    if (accEl) accEl.textContent = acc + '%';
    if (strEl) strEl.textContent = String(streak);
    try {
      localStorage.setItem(
        'hw_mastery_' + (window.LESSON_ID || 'default'),
        JSON.stringify({ completed: done, total: total, accuracy: acc, streak: streak })
      );
    } catch (e) {}
  };

  /* Click-to-enlarge lightbox for all images and math visuals */
  var _hwLightbox = null;
  function ensureHomeworkLightbox() {
    if (_hwLightbox) return _hwLightbox;
    var lb = document.createElement('dialog');
    lb.className = 'hw-lightbox';
    lb.setAttribute('aria-label', 'Enlarged visual');
    var big = document.createElement('img');
    big.className = 'hw-lightbox-img';
    big.alt = '';
    var nodeHost = document.createElement('div');
    nodeHost.className = 'hw-lightbox-node';
    nodeHost.hidden = true;
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'hw-lightbox-close';
    close.setAttribute('aria-label', 'Close enlarged visual');
    close.textContent = '\u2715';
    lb.appendChild(big);
    lb.appendChild(nodeHost);
    lb.appendChild(close);
    document.body.appendChild(lb);

    var lastFocus = null;
    var open = false;
    var modalCapable = typeof lb.showModal === 'function' && typeof lb.close === 'function';

    function finish() {
      open = false;
      document.body.classList.remove('hw-lightbox-open');
      big.removeAttribute('src');
      nodeHost.replaceChildren();
      nodeHost.hidden = true;
      if (lastFocus && lastFocus.focus) {
        try { lastFocus.focus(); } catch (e) {}
      }
      lastFocus = null;
    }

    function hide() {
      if (!open) return;
      if (modalCapable) { lb.close(); return; }
      lb.removeAttribute('open');
      lb.hidden = true;
      finish();
    }

    close.addEventListener('click', hide);
    big.addEventListener('click', hide);
    nodeHost.addEventListener('click', hide);
    lb.addEventListener('click', function (e) { if (e.target === lb) hide(); });
    if (modalCapable) lb.addEventListener('close', finish);
    else {
      document.addEventListener('keydown', function (e) {
        if (open && e.key === 'Escape') hide();
      });
    }

    _hwLightbox = {
      openImage: function (src, alt, opener) {
        if (!src) return;
        nodeHost.replaceChildren();
        nodeHost.hidden = true;
        big.hidden = false;
        big.src = src;
        big.alt = alt || '';
        lastFocus = opener || null;
        open = true;
        document.body.classList.add('hw-lightbox-open');
        if (modalCapable) { if (!lb.open) lb.showModal(); }
        else { lb.hidden = false; lb.setAttribute('open', ''); }
        setTimeout(function () { try { close.focus(); } catch (e) {} }, 0);
      },
      openNode: function (node, label, opener) {
        if (!node || typeof node.cloneNode !== 'function') return;
        var clone = node.cloneNode(true);
        clone.removeAttribute('id');
        clone.removeAttribute('tabindex');
        clone.classList.remove('is-zoomable');
        big.hidden = true;
        nodeHost.replaceChildren(clone);
        nodeHost.hidden = false;
        lastFocus = opener || null;
        open = true;
        document.body.classList.add('hw-lightbox-open');
        if (modalCapable) { if (!lb.open) lb.showModal(); }
        else { lb.hidden = false; lb.setAttribute('open', ''); }
        setTimeout(function () { try { close.focus(); } catch (e) {} }, 0);
      }
    };
    return _hwLightbox;
  }

  function wireElementZoom(el, isSvg) {
    if (!el || el.dataset.zoomable === '1') return;
    if (el.closest('.hw-lightbox, button, a, [data-no-zoom]')) return;
    el.dataset.zoomable = '1';
    el.classList.add('is-zoomable');
    el.setAttribute('tabindex', '0');
    if (!el.getAttribute('title')) el.setAttribute('title', 'Click to enlarge / Toca para ampliar');
    function trigger(e) {
      e.preventDefault();
      e.stopPropagation();
      var lb = ensureHomeworkLightbox();
      if (isSvg) {
        var label = el.getAttribute('aria-label') || (el.querySelector('title') && el.querySelector('title').textContent) || 'Enlarged math visual';
        lb.openNode(el, label, el);
      } else {
        var src = el.currentSrc || el.getAttribute('src');
        lb.openImage(src, el.alt || '', el);
      }
    }
    el.addEventListener('click', trigger);
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') trigger(e);
    });
  }

  function installHomeworkImageZoom() {
    function wireAll(root) {
      if (!root || typeof root.querySelectorAll !== 'function') return;
      root.querySelectorAll('img:not([data-no-zoom])').forEach(function (img) {
        var w = Number(img.getAttribute('width'));
        var h = Number(img.getAttribute('height'));
        if ((w && w < 44) || (h && h < 44)) return;
        wireElementZoom(img, false);
      });
      root.querySelectorAll('.hw-colearn-svg-stage svg, .problem-visual svg, .coach-step-visual svg, .workspace-svg-wrapper svg, .coach-ladder-step svg').forEach(function (svg) {
        wireElementZoom(svg, true);
      });
    }
    wireAll(document.body);
    if (typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          Array.prototype.slice.call(m.addedNodes).forEach(function (node) {
            if (node.nodeType === 1) wireAll(node);
          });
        });
      });
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  window.runHomeworkDiagnostics = function () {
    var svgs = Array.prototype.slice.call(document.querySelectorAll('svg'));
    var validSvgs = svgs.filter(function (s) {
      return s.getAttribute('viewBox') || (s.getAttribute('width') && s.getAttribute('height'));
    });
    var problems = document.querySelectorAll('.problem-section');
    var answerKeys = document.querySelectorAll('.answer-key-drawer, .hw-copilot-solution-key');
    var report = {
      ok: validSvgs.length > 0 && problems.length > 0 && answerKeys.length > 0,
      lessonId: window.LESSON_ID || 'unknown',
      personaMode: document.body.getAttribute('data-persona-mode') || 'student',
      svgCount: svgs.length,
      validSvgCount: validSvgs.length,
      problemCount: problems.length,
      answerKeyCount: answerKeys.length,
      hasHud: Boolean(document.getElementById('hw_colearn_hud')),
      hasBridge60s: Boolean(document.getElementById('hw_family_bridge_60s')),
      hasWorkedPartner: Boolean(document.getElementById('hw_worked_partner_example')),
      hasSpotTheGlitch: Boolean(document.getElementById('hw_spot_the_glitch')),
      hasPrintFooter: Boolean(document.getElementById('hw_print_socratic_footer'))
    };
    window.__HW_DIAGNOSTICS_REPORT__ = report;
    document.body.setAttribute('data-diagnostics-ok', report.ok ? 'true' : 'false');
    logCoLearn('diagnostics_run', report);
    return report;
  };

  function bootCoLearningEngine() {
    document.body.setAttribute('data-persona-mode', 'student');
    try {
      var savedPersona = localStorage.getItem('hw_persona_' + (window.LESSON_ID || 'default'));
      if (savedPersona === 'copilot') window.setHomeworkPersona('copilot');
      var savedTheme = localStorage.getItem('hw_theme_pref');
      if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        var themeBtn = document.getElementById('hw_theme_toggle_btn');
        if (themeBtn) themeBtn.setAttribute('aria-pressed', 'true');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        var themeBtnLight = document.getElementById('hw_theme_toggle_btn');
        if (themeBtnLight) themeBtnLight.setAttribute('aria-pressed', 'false');
      }
    } catch (e) {}

    installDragOrderTapFallback();
    installHomeworkImageZoom();
    window.updateCoLearningHud();

    var checkPanel = document.getElementById('hw_panel_check');
    if (checkPanel && typeof MutationObserver !== 'undefined') {
      var obs = new MutationObserver(function () {
        window.updateCoLearningHud();
      });
      obs.observe(checkPanel, { attributes: true, subtree: true, attributeFilter: ['class'] });
    }

    if (window.location && window.location.search && window.location.search.indexOf('diagnostics=true') !== -1) {
      window.runHomeworkDiagnostics();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootCoLearningEngine);
  } else {
    bootCoLearningEngine();
  }
})();
`;

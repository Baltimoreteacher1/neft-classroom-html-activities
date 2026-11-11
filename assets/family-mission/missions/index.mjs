/**
 * Family Math Missions — Game-Quality Interactive Application
 *
 * Reusable, lesson-aligned 3-round interactive application system for Grade 6
 * Family Practice. Each mission transforms the target mathematics into a
 * meaningful interactive objective (5–8 minutes, with a Quick Save & Exit option
 * after Round 1, zero timers or speed penalties, custom SVG visual meters,
 * meaningful choices, error revision with contextual hints, and a final task
 * that demonstrates mathematical understanding).
 *
 * Zero raw hex/rgb/hsl colors in JS — all styling uses --fm-* design tokens.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "dataset") {
      for (const [dk, dv] of Object.entries(v)) el.dataset[dk] = String(dv);
    } else if (k.startsWith("on") && typeof v === "function") {
      el.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v === true) {
      el.setAttribute(k, "");
    } else {
      el.setAttribute(k, String(v));
    }
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.appendChild(typeof child === "Node" || child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    el.setAttribute(k, String(v));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    el.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

function bi(en, es, tag = "span", cls = "") {
  return h(
    tag,
    { class: cls || undefined },
    h("span", { class: "lang-en" }, en),
    h("span", { class: "lang-es" }, es)
  );
}

/**
 * Domain-specific 3-round missions catalog.
 */
export const MISSION_CATALOG = {
  exponents: {
    id: "exponents-studio",
    badgeEn: "Family Math Mission · Exponents",
    badgeEs: "Misión matemática familiar · Exponentes",
    titleEn: "Restore Power to the Music Studio",
    titleEs: "Restaura la energía del estudio de música",
    introEn:
      "The community recording studio lost power before tonight's showcase! Configure the exponential amplifier stages, speaker arrays, and master console so the sound reaches the entire auditorium without overloading.",
    introEs:
      "¡El estudio de grabación comunitario perdió energía antes del concierto de esta noche! Configura las etapas del amplificador exponencial, la matriz de bocinas y la consola principal para que el sonido llegue a todo el auditorio sin sobrecargarse.",
    meterLabelEn: "Studio Acoustic Output",
    meterLabelEs: "Potencia acústica del estudio",
    meterUnitEn: "watts",
    meterUnitEs: "vatios",
    rounds: [
      {
        stageEn: "Stage 1 · Pre-Amp Doubling Chain",
        stageEs: "Etapa 1 · Cadena de duplicación del preamplificador",
        promptEn:
          "Each pre-amp stage doubles the signal power (base 2). You need exactly 16 watts to wake up the mixing desk. How many doubling stages (2^n = 16) should you activate, and why does 2 × 4 = 8 fail?",
        promptEs:
          "Cada etapa del preamplificador duplica la potencia de la señal (base 2). Necesitas exactamente 16 vatios para encender la mesa de mezcla. ¿Cuántas etapas de duplicación (2^n = 16) debes activar y por qué falla 2 × 4 = 8?",
        targetValue: 16,
        sliderLabelEn: "Doubling stages (exponent n on base 2):",
        sliderLabelEs: "Etapas de duplicación (exponente n en base 2):",
        sliderMin: 1,
        sliderMax: 6,
        sliderDefault: 3,
        computeSliderValue: (n) => Math.pow(2, n),
        formatSliderFormula: (n) =>
          `2^${n} = ${Array.from({ length: n }, () => "2").join(" × ")} = ${Math.pow(2, n)}`,
        choices: [
          {
            id: "a",
            en: "Activate 4 stages because 2^4 = 2 × 2 × 2 × 2 = 16 watts (repeated multiplication, not 2 × 4 = 8).",
            es: "Activar 4 etapas porque 2^4 = 2 × 2 × 2 × 2 = 16 vatios (multiplicación repetida, no 2 × 4 = 8).",
            correct: true,
            feedbackEn: "Spot on! Four doubling stages multiply 2 × 2 × 2 × 2 = 16 watts. The mixing desk is online!",
            feedbackEs: "¡Exacto! Cuatro etapas de duplicación multiplican 2 × 2 × 2 × 2 = 16 vatios. ¡La mesa de mezcla está encendida!",
          },
          {
            id: "b",
            en: "Activate 8 stages because 2 × 8 = 16 watts.",
            es: "Activar 8 etapas porque 2 × 8 = 16 vatios.",
            correct: false,
            feedbackEn: "Careful! That uses 2 × 8 (linear multiplication). Eight doubling stages would be 2^8 = 256 watts and blow the fuse! Try adjusting the stage slider to see when 2^n reaches 16.",
            feedbackEs: "¡Cuidado! Eso usa 2 × 8 (multiplicación lineal). ¡Ocho etapas de duplicación serían 2^8 = 256 vatios y quemarían el fusible! Ajusta el deslizador para ver cuándo 2^n llega a 16.",
          },
          {
            id: "c",
            en: "Activate 2 stages because 4^2 = 16 watts on a base-2 amplifier.",
            es: "Activar 2 etapas porque 4^2 = 16 vatios en un amplificador de base 2.",
            correct: false,
            feedbackEn: "Watch the base! The pre-amp doubles (base 2), so 2 stages only gives 2^2 = 4 watts. We need 4 stages of base 2.",
            feedbackEs: "¡Observa la base! El preamplificador duplica (base 2), así que 2 etapas solo dan 2^2 = 4 vatios. Necesitamos 4 etapas de base 2.",
          },
        ],
      },
      {
        stageEn: "Stage 2 · Triple-Tower Speaker Array",
        stageEs: "Etapa 2 · Matriz de bocinas de triple torre",
        promptEn:
          "The main hall uses triple-array speaker banks (base 3). To fill the 27-seat balcony evenly, each bank triples the coverage. Which configuration gives 27 acoustic zones?",
        promptEs:
          "La sala principal usa bancos de bocinas triples (base 3). Para cubrir los 27 asientos del balcón de manera uniforme, cada banco triplica la cobertura. ¿Qué configuración da 27 zonas acústicas?",
        targetValue: 27,
        sliderLabelEn: "Triple-array levels (exponent n on base 3):",
        sliderLabelEs: "Niveles de matriz triple (exponente n en base 3):",
        sliderMin: 1,
        sliderMax: 4,
        sliderDefault: 2,
        computeSliderValue: (n) => Math.pow(3, n),
        formatSliderFormula: (n) =>
          `3^${n} = ${Array.from({ length: n }, () => "3").join(" × ")} = ${Math.pow(3, n)}`,
        choices: [
          {
            id: "a",
            en: "Level 9 because 3 × 9 = 27 zones.",
            es: "Nivel 9 porque 3 × 9 = 27 zonas.",
            correct: false,
            feedbackEn: "That multiplies base × exponent (3 × 9). In exponential growth, each level multiplies by another 3: 3^1 = 3, 3^2 = 9, 3^3 = 27.",
            feedbackEs: "Eso multiplica base × exponente (3 × 9). En el crecimiento exponencial, cada nivel multiplica por otro 3: 3^1 = 3, 3^2 = 9, 3^3 = 27.",
          },
          {
            id: "b",
            en: "Level 3 because 3^3 = 3 × 3 × 3 = 27 zones.",
            es: "Nivel 3 porque 3^3 = 3 × 3 × 3 = 27 zonas.",
            correct: true,
            feedbackEn: "Brilliant! 3^3 = 3 × 3 × 3 = 27 acoustic zones. The balcony speakers are crystal clear!",
            feedbackEs: "¡Brillante! 3^3 = 3 × 3 × 3 = 27 zonas acústicas. ¡Las bocinas del balcón suenan con total claridad!",
          },
          {
            id: "c",
            en: "Level 2 because 3^2 = 6 zones.",
            es: "Nivel 2 porque 3^2 = 6 zonas.",
            correct: false,
            feedbackEn: "Remember: 3^2 is 3 × 3 = 9, and one more factor of 3 gives 9 × 3 = 27.",
            feedbackEs: "Recuerda: 3^2 es 3 × 3 = 9, y un factor más de 3 da 9 × 3 = 27.",
          },
        ],
      },
      {
        stageEn: "Stage 3 · Master Console Calibration (Final Mastery Task)",
        stageEs: "Etapa 3 · Calibración de la consola principal (Tarea final de dominio)",
        promptEn:
          "Final check before the curtain rises! The master console combines a 10-watt baseline with 2 banks of 5^2 watts: 10 + 2 × 5^2. Evaluate the total output using order of operations (exponents first, then multiplication, then addition).",
        promptEs:
          "¡Verificación final antes de que suba el telón! La consola principal combina una base de 10 vatios con 2 bancos de 5^2 vatios: 10 + 2 × 5^2. Evalúa la potencia total usando el orden de las operaciones (primero exponentes, luego multiplicación y después suma).",
        targetValue: 60,
        sliderLabelEn: "Test console boost factor m in 10 + m × 5^2:",
        sliderLabelEs: "Prueba el factor de impulso m en 10 + m × 5^2:",
        sliderMin: 1,
        sliderMax: 4,
        sliderDefault: 2,
        computeSliderValue: (m) => 10 + m * 25,
        formatSliderFormula: (m) => `10 + ${m} × 5^2 = 10 + ${m} × 25 = ${10 + m * 25}`,
        choices: [
          {
            id: "a",
            en: "60 watts — First 5^2 = 25, next 2 × 25 = 50, then 10 + 50 = 60 watts.",
            es: "60 vatios — Primero 5^2 = 25, luego 2 × 25 = 50, y después 10 + 50 = 60 vatios.",
            correct: true,
            feedbackEn: "Showtime! You evaluated the exponent first (5^2 = 25), multiplied by 2 (50), and added the 10-watt baseline for 60 watts. The studio concert is live!",
            feedbackEs: "¡Hora del espectáculo! Evaluaste primero el exponente (5^2 = 25), multiplicaste por 2 (50) y sumaste la base de 10 vatios para obtener 60 vatios. ¡El concierto del estudio está en vivo!",
          },
          {
            id: "b",
            en: "100 watts — Multiply 2 × 5 = 10 first, square it to 100, and ignore the 10.",
            es: "100 vatios — Multiplicar 2 × 5 = 10 primero, elevarlo al cuadrado a 100 e ignorar el 10.",
            correct: false,
            feedbackEn: "Watch the order of operations! The exponent 2 belongs only to the base 5, so evaluate 5^2 = 25 before multiplying by 2.",
            feedbackEs: "¡Observa el orden de las operaciones! El exponente 2 pertenece solo a la base 5, así que evalúa 5^2 = 25 antes de multiplicar por 2.",
          },
          {
            id: "c",
            en: "30 watts — Evaluate 5^2 as 5 × 2 = 10, then 10 + 2 × 10 = 30 watts.",
            es: "30 vatios — Evaluar 5^2 como 5 × 2 = 10, luego 10 + 2 × 10 = 30 vatios.",
            correct: false,
            feedbackEn: "Almost! You used the right order of operations, but 5^2 means 5 × 5 = 25 (not 5 × 2 = 10). Recalculate 10 + 2 × 25.",
            feedbackEs: "¡Casi! Usaste el orden correcto de las operaciones, pero 5^2 significa 5 × 5 = 25 (no 5 × 2 = 10). Vuelve a calcular 10 + 2 × 25.",
          },
        ],
      },
    ],
  },

  ratios: {
    id: "ratios-kitchen",
    badgeEn: "Family Math Mission · Ratios & Rates",
    badgeEs: "Misión matemática familiar · Razones y tasas",
    titleEn: "Community Festival Recipe & Mix Studio",
    titleEs: "Estudio de recetas y mezclas del festival comunitario",
    introEn:
      "Your family is running the Agua Fresca & Mural Paint booth at the neighborhood festival! Scale every batch proportionally so the flavor and color stay identical from the first cup to the last.",
    introEs:
      "¡Tu familia dirige el puesto de aguas frescas y pintura mural en el festival del vecindario! Escala cada lote proporcionalmente para que el sabor y el color se mantengan idénticos desde el primer vaso hasta el último.",
    meterLabelEn: "Batch Proportion Balance",
    meterLabelEs: "Equilibrio proporcional del lote",
    meterUnitEn: "parts",
    meterUnitEs: "partes",
    rounds: [
      {
        stageEn: "Stage 1 · Scaling the Berry Agua Fresca",
        stageEs: "Etapa 1 · Escalando el agua fresca de frutas",
        promptEn:
          "The signature recipe uses 3 cups of berry puree for every 5 cups of sparkling water (ratio 3 : 5). For the festival crowd, you use 12 cups of berry puree. How many cups of sparkling water keep the exact same taste?",
        promptEs:
          "La receta especial usa 3 tazas de puré de frutas por cada 5 tazas de agua con gas (razón 3 : 5). Para el festival, usas 12 tazas de puré de frutas. ¿Cuántas tazas de agua con gas mantienen exactamente el mismo sabor?",
        targetValue: 20,
        sliderLabelEn: "Batch multiplier (×k on ratio 3 : 5):",
        sliderLabelEs: "Multiplicador de lote (×k en la razón 3 : 5):",
        sliderMin: 1,
        sliderMax: 6,
        sliderDefault: 4,
        computeSliderValue: (k) => 5 * k,
        formatSliderFormula: (k) => `${3 * k} : ${5 * k} (×${k})`,
        choices: [
          {
            id: "a",
            en: "20 cups of sparkling water, because 3 × 4 = 12 and 5 × 4 = 20 (both parts multiplied by 4).",
            es: "20 tazas de agua con gas, porque 3 × 4 = 12 y 5 × 4 = 20 (ambas partes multiplicadas por 4).",
            correct: true,
            feedbackEn: "Delicious! Multiplying both terms of 3 : 5 by 4 gives 12 : 20, preserving the exact unit rate.",
            feedbackEs: "¡Delicioso! Multiplicar ambos términos de 3 : 5 por 4 da 12 : 20, conservando exactamente la tasa unitaria.",
          },
          {
            id: "b",
            en: "14 cups of sparkling water, because 3 + 9 = 12 so 5 + 9 = 14.",
            es: "14 tazas de agua con gas, porque 3 + 9 = 12 así que 5 + 9 = 14.",
            correct: false,
            feedbackEn: "Adding 9 to both parts changes the flavor balance! Equivalent ratios scale by multiplying both terms by the same factor (×4).",
            feedbackEs: "¡Sumar 9 a ambas partes cambia el equilibrio del sabor! Las razones equivalentes se escalan multiplicando ambos términos por el mismo factor (×4).",
          },
          {
            id: "c",
            en: "15 cups of sparkling water, because 5 × 3 = 15.",
            es: "15 tazas de agua con gas, porque 5 × 3 = 15.",
            correct: false,
            feedbackEn: "Check the scale factor: to go from 3 cups of puree to 12 cups, we multiplied by 4 (not 3). Multiply the 5 cups of water by 4.",
            feedbackEs: "Revisa el factor de escala: para pasar de 3 tazas de puré a 12 tazas, multiplicamos por 4 (no por 3). Multiplica las 5 tazas de agua por 4.",
          },
        ],
      },
      {
        stageEn: "Stage 2 · Comparing Unit Rates for Supplies",
        stageEs: "Etapa 2 · Comparando tasas unitarias de suministros",
        promptEn:
          "You need eco-cups for the booth. Pack A costs $12 for 6 sleeves, and Pack B costs $15 for 5 sleeves. Which pack has the better price per sleeve?",
        promptEs:
          "Necesitas vasos ecológicos para el puesto. El paquete A cuesta $12 por 6 paquetes y el paquete B cuesta $15 por 5 paquetes. ¿Qué paquete tiene el mejor precio por unidad?",
        targetValue: 2,
        sliderLabelEn: "Sleeves to compare at $2 per sleeve:",
        sliderLabelEs: "Paquetes para comparar a $2 por unidad:",
        sliderMin: 1,
        sliderMax: 6,
        sliderDefault: 6,
        computeSliderValue: (n) => 2 * n,
        formatSliderFormula: (n) => `${n} sleeves × $2/sleeve = $${2 * n}`,
        choices: [
          {
            id: "a",
            en: "Pack A ($2 per sleeve, since $12 ÷ 6 = $2) is a better deal than Pack B ($3 per sleeve, since $15 ÷ 5 = $3).",
            es: "El paquete A ($2 por unidad, ya que $12 ÷ 6 = $2) es mejor oferta que el paquete B ($3 por unidad, ya que $15 ÷ 5 = $3).",
            correct: true,
            feedbackEn: "Smart shopping! Dividing total cost by sleeves shows Pack A is $2 per sleeve compared to $3 per sleeve.",
            feedbackEs: "¡Compra inteligente! Dividir el costo total entre las unidades muestra que el paquete A cuesta $2 por unidad frente a $3 por unidad.",
          },
          {
            id: "b",
            en: "Pack B is better because 5 sleeves is a smaller number than 6 sleeves.",
            es: "El paquete B es mejor porque 5 unidades es un número menor que 6 unidades.",
            correct: false,
            feedbackEn: "Paying more ($15 vs $12) for fewer sleeves (5 vs 6) makes each sleeve more expensive ($3 vs $2).",
            feedbackEs: "Pagar más ($15 frente a $12) por menos unidades (5 frente a 6) hace que cada unidad sea más cara ($3 frente a $2).",
          },
          {
            id: "c",
            en: "Both packs have the same unit rate because 12 + 6 = 18 and 15 + 5 = 20 are close.",
            es: "Ambos paquetes tienen la misma tasa unitaria porque 12 + 6 = 18 y 15 + 5 = 20 están cerca.",
            correct: false,
            feedbackEn: "Unit rate comes from division (cost ÷ sleeves), not addition. Compare $12 ÷ 6 and $15 ÷ 5.",
            feedbackEs: "La tasa unitaria proviene de la división (costo ÷ unidades), no de la suma. Compara $12 ÷ 6 y $15 ÷ 5.",
          },
        ],
      },
      {
        stageEn: "Stage 3 · Mural Paint Mix (Part-to-Whole Mastery)",
        stageEs: "Etapa 3 · Mezcla de pintura para el mural (Dominio parte a todo)",
        promptEn:
          "The mural teal color uses 2 parts blue paint to 3 parts yellow paint (5 total parts per batch). If you need 30 cups of mixed teal paint in all, how many cups of blue and yellow should you mix?",
        promptEs:
          "El color verde azulado del mural usa 2 partes de pintura azul por 3 partes de pintura amarilla (5 partes en total por lote). Si necesitas 30 tazas de pintura mezclada en total, ¿cuántas tazas de azul y amarillo debes mezclar?",
        targetValue: 30,
        sliderLabelEn: "Number of 5-cup batches:",
        sliderLabelEs: "Número de lotes de 5 tazas:",
        sliderMin: 1,
        sliderMax: 8,
        sliderDefault: 6,
        computeSliderValue: (b) => 5 * b,
        formatSliderFormula: (b) => `${2 * b} blue + ${3 * b} yellow = ${5 * b} total cups`,
        choices: [
          {
            id: "a",
            en: "12 cups blue and 18 cups yellow (6 batches × 2 blue = 12, 6 batches × 3 yellow = 18, and 12 + 18 = 30 total).",
            es: "12 tazas de azul y 18 tazas de amarillo (6 lotes × 2 azul = 12, 6 lotes × 3 amarillo = 18, y 12 + 18 = 30 en total).",
            correct: true,
            feedbackEn: "Master mixer! Since 1 batch is 2 + 3 = 5 cups, 30 total cups requires 30 ÷ 5 = 6 batches: 12 blue and 18 yellow.",
            feedbackEs: "¡Maestro mezclador! Como 1 lote son 2 + 3 = 5 tazas, 30 tazas en total requieren 30 ÷ 5 = 6 lotes: 12 de azul y 18 de amarillo.",
          },
          {
            id: "b",
            en: "20 cups blue and 30 cups yellow (multiply 2 and 3 by 10).",
            es: "20 tazas de azul y 30 tazas de amarillo (multiplicar 2 y 3 por 10).",
            correct: false,
            feedbackEn: "20 + 30 would make 50 total cups instead of 30! Divide the 30 total cups by 5 cups per batch first.",
            feedbackEs: "¡20 + 30 harían 50 tazas en total en lugar de 30! Divide primero las 30 tazas totales entre 5 tazas por lote.",
          },
          {
            id: "c",
            en: "15 cups blue and 15 cups yellow so they add to 30.",
            es: "15 tazas de azul y 15 tazas de amarillo para que sumen 30.",
            correct: false,
            feedbackEn: "15 : 15 is a 1 : 1 ratio, which changes the color! Keep the 2 : 3 ratio across 6 batches.",
            feedbackEs: "15 : 15 es una razón de 1 : 1, ¡lo que cambia el color! Mantén la razón 2 : 3 en 6 lotes.",
          },
        ],
      },
    ],
  },

  percents: {
    id: "percents-budget",
    badgeEn: "Family Math Mission · Percents",
    badgeEs: "Misión matemática familiar · Porcentajes",
    titleEn: "Family Budget & Discount Studio",
    titleEs: "Estudio familiar de presupuesto y descuentos",
    introEn:
      "Help your family equip the community study corner on a smart budget! Use 10% benchmarks, percent-of-a-whole models, and savings targets to stretch every dollar.",
    introEs:
      "¡Ayuda a tu familia a equipar el rincón de estudio comunitario con un presupuesto inteligente! Usa referencias del 10%, modelos de porcentaje de un todo y metas de ahorro para aprovechar cada dólar.",
    meterLabelEn: "Smart Budget Progress",
    meterLabelEs: "Progreso del presupuesto inteligente",
    meterUnitEn: "dollars",
    meterUnitEs: "dólares",
    rounds: [
      {
        stageEn: "Stage 1 · Calculating the Bookshelf Discount",
        stageEs: "Etapa 1 · Calculando el descuento del librero",
        promptEn:
          "A sturdy bookshelf normally costs $80, and today it is 25% off. How much money do you save with the 25% discount, and what is the sale price?",
        promptEs:
          "Un librero resistente cuesta normalmente $80, y hoy tiene un 25% de descuento. ¿Cuánto dinero ahorras con el descuento del 25% y cuál es el precio de oferta?",
        targetValue: 60,
        sliderLabelEn: "Explore percent of $80 (in 5% steps):",
        sliderLabelEs: "Explora el porcentaje de $80 (en pasos de 5%):",
        sliderMin: 1,
        sliderMax: 20,
        sliderDefault: 5,
        computeSliderValue: (step) => (step * 5 * 80) / 100,
        formatSliderFormula: (step) => `${step * 5}% of $80 = $${(step * 5 * 80) / 100}`,
        choices: [
          {
            id: "a",
            en: "Save $20 (25% of $80 = 1/4 of $80 = $20), so the sale price is $80 − $20 = $60.",
            es: "Ahorras $20 (25% de $80 = 1/4 de $80 = $20), así que el precio de oferta es $80 − $20 = $60.",
            correct: true,
            feedbackEn: "Spot on! 25% is one-fourth of $80 ($20 saved), leaving a $60 sale price.",
            feedbackEs: "¡Exacto! El 25% es una cuarta parte de $80 ($20 ahorrados), dejando un precio de oferta de $60.",
          },
          {
            id: "b",
            en: "Save $25 because 25% always means subtract $25, leaving $55.",
            es: "Ahorras $25 porque el 25% siempre significa restar $25, dejando $55.",
            correct: false,
            feedbackEn: "Remember: 25% means 25 out of every $100, not a flat $25! On an $80 item, 25% is 0.25 × $80 = $20.",
            feedbackEs: "Recuerda: ¡25% significa 25 de cada $100, no $25 fijos! En un artículo de $80, el 25% es 0.25 × $80 = $20.",
          },
          {
            id: "c",
            en: "The sale price is $20 because 25% of $80 is $20.",
            es: "El precio de oferta es $20 porque el 25% de $80 es $20.",
            correct: false,
            feedbackEn: "$20 is the discount amount you save! Subtract $20 from the original $80 to find the $60 sale price.",
            feedbackEs: "¡$20 es la cantidad de descuento que ahorras! Resta $20 de los $80 originales para hallar el precio de oferta de $60.",
          },
        ],
      },
      {
        stageEn: "Stage 2 · Finding the Whole Fundraising Goal",
        stageEs: "Etapa 2 · Hallando la meta total de recaudación",
        promptEn:
          "The neighborhood already raised $45, which is 30% of the total reading-lamp budget. What is 100% of the reading-lamp budget?",
        promptEs:
          "El vecindario ya recaudó $45, que es el 30% del presupuesto total para lámparas de lectura. ¿Cuál es el 100% del presupuesto para lámparas?",
        targetValue: 150,
        sliderLabelEn: "10% benchmark blocks ($15 per 10%):",
        sliderLabelEs: "Bloques de referencia del 10% ($15 por cada 10%):",
        sliderMin: 1,
        sliderMax: 10,
        sliderDefault: 10,
        computeSliderValue: (b) => b * 15,
        formatSliderFormula: (b) => `${b * 10}% = ${b} × $15 = $${b * 15}`,
        choices: [
          {
            id: "a",
            en: "$150 total — If 30% is $45, then 10% is $45 ÷ 3 = $15, so 100% is 10 × $15 = $150.",
            es: "$150 en total — Si el 30% son $45, entonces el 10% son $45 ÷ 3 = $15, así que el 100% son 10 × $15 = $150.",
            correct: true,
            feedbackEn: "Brilliant 10%-benchmark reasoning! Finding 10% = $15 makes scaling to 100% = $150 crystal clear.",
            feedbackEs: "¡Excelente razonamiento con la referencia del 10%! Hallar que el 10% = $15 hace que escalar al 100% = $150 sea clarísimo.",
          },
          {
            id: "b",
            en: "$13.50 total — Multiply $45 × 0.30 = $13.50.",
            es: "$13.50 en total — Multiplicar $45 × 0.30 = $13.50.",
            correct: false,
            feedbackEn: "Multiplying $45 × 0.30 finds 30% of $45, but $45 is ALREADY the 30% part! The 100% whole must be larger than $45.",
            feedbackEs: "Multiplicar $45 × 0.30 halla el 30% de $45, ¡pero $45 YA es la parte del 30%! El total del 100% debe ser mayor que $45.",
          },
          {
            id: "c",
            en: "$115 total — Add 70 to $45 because 30% + 70% = 100%.",
            es: "$115 en total — Sumar 70 a $45 porque 30% + 70% = 100%.",
            correct: false,
            feedbackEn: "Be careful not to add raw percent points to dollars! Use 10% = $15 so the remaining 70% is 7 × $15 = $105.",
            feedbackEs: "¡Ten cuidado de no sumar puntos porcentuales directamente a los dólares! Usa 10% = $15 para que el 70% restante sea 7 × $15 = $105.",
          },
        ],
      },
      {
        stageEn: "Stage 3 · Stretch Goal Above 100% (Mastery Task)",
        stageEs: "Etapa 3 · Meta ampliada superior al 100% (Tarea de dominio)",
        promptEn:
          "Great news! Donations reached 120% of a $50 book-drive goal. How many dollars were donated in all?",
        promptEs:
          "¡Gran noticia! Las donaciones alcanzaron el 120% de una meta de $50 para libros. ¿Cuántos dólares se donaron en total?",
        targetValue: 60,
        sliderLabelEn: "Percent of $50 goal (in 20% steps):",
        sliderLabelEs: "Porcentaje de la meta de $50 (en pasos de 20%):",
        sliderMin: 1,
        sliderMax: 7,
        sliderDefault: 6,
        computeSliderValue: (step) => step * 10,
        formatSliderFormula: (step) => `${step * 20}% of $50 = $${step * 10}`,
        choices: [
          {
            id: "a",
            en: "$60 — 100% of the goal is $50, plus an extra 20% of $50 ($10) equals $60.",
            es: "$60 — El 100% de la meta son $50, más un 20% adicional de $50 ($10) es igual a $60.",
            correct: true,
            feedbackEn: "Outstanding! You decomposed 120% into 100% ($50) + 20% ($10) = $60.",
            feedbackEs: "¡Sobresaliente! Descompusiste el 120% en 100% ($50) + 20% ($10) = $60.",
          },
          {
            id: "b",
            en: "$170 — Add 120 + 50 = $170.",
            es: "$170 — Sumar 120 + 50 = $170.",
            correct: false,
            feedbackEn: "120% means 1.20 times the $50 goal, not $120 added to $50. Find 20% of $50 ($10) and add it to $50.",
            feedbackEs: "120% significa 1.20 veces la meta de $50, no $120 sumados a $50. Halla el 20% de $50 ($10) y súmalo a $50.",
          },
          {
            id: "c",
            en: "$50 — Because a percent cannot go past 100%.",
            es: "$50 — Porque un porcentaje no puede pasar del 100%.",
            correct: false,
            feedbackEn: "When a fundraiser beats its goal, the result is greater than 100% of the original target! 120% is 100% + 20%.",
            feedbackEs: "Cuando una recaudación supera su meta, ¡el resultado es mayor que el 100% de la meta original! 120% es 100% + 20%.",
          },
        ],
      },
    ],
  },

  fractions: {
    id: "fractions-workshop",
    badgeEn: "Family Math Mission · Fractions & Decimals",
    badgeEs: "Misión matemática familiar · Fracciones y decimales",
    titleEn: "Maker Workshop Precision Build",
    titleEs: "Construcción de precisión en el taller creativo",
    introEn:
      "You are building birdhouses and garden signs in the family workshop! Measure and divide fractional board lengths accurately so zero lumber is wasted.",
    introEs:
      "¡Estás construyendo casas para pájaros y letreros de jardín en el taller familiar! Mide y divide longitudes fraccionarias de madera con precisión para no desperdiciar nada.",
    meterLabelEn: "Workshop Cut Precision",
    meterLabelEs: "Precisión de corte del taller",
    meterUnitEn: "pieces",
    meterUnitEs: "piezas",
    rounds: [
      {
        stageEn: "Stage 1 · Dividing Ribbon into Equal Fractional Strips",
        stageEs: "Etapa 1 · Dividiendo cinta en tiras fraccionarias iguales",
        promptEn:
          "You have 3/4 yard of weatherproof trim and each birdhouse roof needs 1/8 yard. How many roofs can you trim (3/4 ÷ 1/8)?",
        promptEs:
          "Tienes 3/4 de yarda de borde resistente al clima y cada techo necesita 1/8 de yarda. ¿Cuántos techos puedes cubrir (3/4 ÷ 1/8)?",
        targetValue: 6,
        sliderLabelEn: "Count 1/8-yard strips inside 3/4 yard (6/8):",
        sliderLabelEs: "Cuenta tiras de 1/8 de yarda dentro de 3/4 de yarda (6/8):",
        sliderMin: 1,
        sliderMax: 8,
        sliderDefault: 6,
        computeSliderValue: (n) => n,
        formatSliderFormula: (n) => `${n} × (1/8 yd) = ${n}/8 yd`,
        choices: [
          {
            id: "a",
            en: "6 roofs, because 3/4 equals 6/8, and there are six 1/8-yard pieces inside 6/8 (3/4 × 8/1 = 6).",
            es: "6 techos, porque 3/4 equivale a 6/8, y caben seis piezas de 1/8 de yarda dentro de 6/8 (3/4 × 8/1 = 6).",
            correct: true,
            feedbackEn: "Precision cut! Rewriting 3/4 as 6/8 shows immediately that six 1/8-yard strips fit inside.",
            feedbackEs: "¡Corte de precisión! Reescribir 3/4 como 6/8 muestra de inmediato que caben seis tiras de 1/8 de yarda.",
          },
          {
            id: "b",
            en: "3/32 of a roof, because 3 × 1 = 3 and 4 × 8 = 32.",
            es: "3/32 de techo, porque 3 × 1 = 3 y 4 × 8 = 32.",
            correct: false,
            feedbackEn: "That multiplies 3/4 × 1/8! Since 1/8 is smaller than 3/4, several 1/8-yard strips fit inside 3/4 yard.",
            feedbackEs: "¡Eso multiplica 3/4 × 1/8! Como 1/8 es menor que 3/4, caben varias tiras de 1/8 de yarda dentro de 3/4 de yarda.",
          },
          {
            id: "c",
            en: "2 roofs, because 8 ÷ 4 = 2.",
            es: "2 techos, porque 8 ÷ 4 = 2.",
            correct: false,
            feedbackEn: "Each fourth has two eighths (1/4 = 2/8), and you have THREE fourths: 3 × 2 = 6 eighths.",
            feedbackEs: "Cada cuarto tiene dos octavos (1/4 = 2/8), y tienes TRES cuartos: 3 × 2 = 6 octavos.",
          },
        ],
      },
      {
        stageEn: "Stage 2 · Cedar Plank Division",
        stageEs: "Etapa 2 · División de tablones de cedro",
        promptEn:
          "A 4-foot cedar plank is cut into shelves that are each 2/3 foot long. How many 2/3-foot shelves can you cut from 4 feet (4 ÷ 2/3)?",
        promptEs:
          "Un tablón de cedro de 4 pies se corta en repisas de 2/3 de pie cada una. ¿Cuántas repisas de 2/3 de pie puedes cortar de 4 pies (4 ÷ 2/3)?",
        targetValue: 6,
        sliderLabelEn: "Number of 2/3-foot shelves:",
        sliderLabelEs: "Número de repisas de 2/3 de pie:",
        sliderMin: 1,
        sliderMax: 8,
        sliderDefault: 6,
        computeSliderValue: (n) => Number(((n * 2) / 3).toFixed(2)),
        formatSliderFormula: (n) => `${n} × (2/3 ft) = ${(n * 2)}/3 ft`,
        choices: [
          {
            id: "a",
            en: "6 shelves — 4 feet is 12/3 feet, and 12 thirds grouped by 2 thirds gives 12 ÷ 2 = 6 shelves.",
            es: "6 repisas — 4 pies son 12/3 de pie, y 12 tercios agrupados de 2 en 2 tercios dan 12 ÷ 2 = 6 repisas.",
            correct: true,
            feedbackEn: "Spot on! 4 ÷ (2/3) = 4 × (3/2) = 12/2 = 6 full shelves.",
            feedbackEs: "¡Exacto! 4 ÷ (2/3) = 4 × (3/2) = 12/2 = 6 repisas completas.",
          },
          {
            id: "b",
            en: "8/3 shelves — Multiply 4 × 2/3 = 8/3.",
            es: "8/3 de repisa — Multiplicar 4 × 2/3 = 8/3.",
            correct: false,
            feedbackEn: "Since each shelf is less than 1 foot (2/3 ft), you get MORE than 4 shelves from a 4-foot plank! Multiply by the reciprocal 3/2.",
            feedbackEs: "Como cada repisa mide menos de 1 pie (2/3 de pie), ¡obtienes MÁS de 4 repisas de un tablón de 4 pies! Multiplica por el recíproco 3/2.",
          },
          {
            id: "c",
            en: "2 shelves — Divide 4 ÷ 2 = 2.",
            es: "2 repisas — Dividir 4 ÷ 2 = 2.",
            correct: false,
            feedbackEn: "Don't forget the denominator 3! Convert 4 feet into 12 thirds first, then divide by 2 thirds.",
            feedbackEs: "¡No olvides el denominador 3! Convierte primero 4 pies en 12 tercios y luego divide entre 2 tercios.",
          },
        ],
      },
      {
        stageEn: "Stage 3 · Decimal Dowel Spacing (Mastery Task)",
        stageEs: "Etapa 3 · Espaciado decimal de clavijas (Tarea de dominio)",
        promptEn:
          "A 2.4-meter wooden dowel is cut into pegs that are each 0.4 meter long. How many pegs does that make (2.4 ÷ 0.4)?",
        promptEs:
          "Una varilla de madera de 2.4 metros se corta en clavijas de 0.4 metros cada una. ¿Cuántas clavijas se obtienen (2.4 ÷ 0.4)?",
        targetValue: 6,
        sliderLabelEn: "Number of 0.4-meter pegs:",
        sliderLabelEs: "Número de clavijas de 0.4 metros:",
        sliderMin: 1,
        sliderMax: 8,
        sliderDefault: 6,
        computeSliderValue: (n) => Number((n * 0.4).toFixed(1)),
        formatSliderFormula: (n) => `${n} × 0.4 m = ${(n * 0.4).toFixed(1)} m`,
        choices: [
          {
            id: "a",
            en: "6 pegs — Multiply both numbers by 10 to get 24 tenths ÷ 4 tenths = 6 pegs.",
            es: "6 clavijas — Multiplica ambos números por 10 para obtener 24 décimos ÷ 4 décimos = 6 clavijas.",
            correct: true,
            feedbackEn: "Workshop mastery! Thinking in tenths (24 tenths ÷ 4 tenths = 6) makes decimal division effortless.",
            feedbackEs: "¡Dominio del taller! Pensar en décimos (24 décimos ÷ 4 décimos = 6) hace que la división decimal sea muy sencilla.",
          },
          {
            id: "b",
            en: "0.6 pegs — Because 24 ÷ 4 = 6 and we put a decimal point in front.",
            es: "0.6 clavijas — Porque 24 ÷ 4 = 6 y ponemos un punto decimal delante.",
            correct: false,
            feedbackEn: "Check reasonableness: 0.4 m is smaller than 2.4 m, so several pegs fit inside! Scaling both by 10 keeps the quotient equal to 6.",
            feedbackEs: "Revisa si tiene sentido: 0.4 m es menor que 2.4 m, ¡así que caben varias clavijas! Escalar ambos por 10 mantiene el cociente igual a 6.",
          },
          {
            id: "c",
            en: "60 pegs — Because moving the decimal adds a zero.",
            es: "60 clavijas — Porque mover el punto decimal agrega un cero.",
            correct: false,
            feedbackEn: "Both 2.4 and 0.4 shift one place to the right (24 ÷ 4 = 6), so no extra zero is needed.",
            feedbackEs: "Tanto 2.4 como 0.4 se mueven un lugar a la derecha (24 ÷ 4 = 6), por lo que no se necesita ningún cero adicional.",
          },
        ],
      },
    ],
  },

  geometry: {
    id: "geometry-park",
    badgeEn: "Family Math Mission · Geometry",
    badgeEs: "Misión matemática familiar · Geometría",
    titleEn: "Community Playground & Park Designer",
    titleEs: "Diseñador del parque y área de juegos comunitaria",
    introEn:
      "Design the new neighborhood pocket park! Calculate turf area for the triangle climbing zone, decompose composite walkways, and size the raised garden beds.",
    introEs:
      "¡Diseña el nuevo parque vecinal! Calcula el área de césped para la zona triangular de escalada, descompón los senderos compuestos y dimensiona las jardineras elevadas.",
    meterLabelEn: "Park Blueprint Coverage",
    meterLabelEs: "Cobertura del plano del parque",
    meterUnitEn: "sq m / cu ft",
    meterUnitEs: "m² / pies³",
    rounds: [
      {
        stageEn: "Stage 1 · Triangle Climbing Zone Turf",
        stageEs: "Etapa 1 · Césped de la zona triangular de escalada",
        promptEn:
          "The triangular climbing zone has a base of 10 meters and a perpendicular height of 6 meters (the slanted rope edge is 8 meters). How many square meters of safety turf are needed?",
        promptEs:
          "La zona triangular de escalada tiene una base de 10 metros y una altura perpendicular de 6 metros (el borde inclinado de cuerda mide 8 metros). ¿Cuántos metros cuadrados de césped de seguridad se necesitan?",
        targetValue: 30,
        sliderLabelEn: "Perpendicular height h (on base 10 m):",
        sliderLabelEs: "Altura perpendicular h (sobre base de 10 m):",
        sliderMin: 2,
        sliderMax: 10,
        sliderDefault: 6,
        computeSliderValue: (hVal) => 0.5 * 10 * hVal,
        formatSliderFormula: (hVal) => `A = 1/2 × 10 × ${hVal} = ${0.5 * 10 * hVal} m²`,
        choices: [
          {
            id: "a",
            en: "30 sq meters — A = 1/2 × base × perpendicular height = 1/2 × 10 × 6 = 30 sq meters.",
            es: "30 metros cuadrados — A = 1/2 × base × altura perpendicular = 1/2 × 10 × 6 = 30 metros cuadrados.",
            correct: true,
            feedbackEn: "Architect approved! A triangle fills half of its 10 m × 6 m bounding rectangle (60 ÷ 2 = 30 m²).",
            feedbackEs: "¡Aprobado por el arquitecto! Un triángulo ocupa la mitad de su rectángulo envolvente de 10 m × 6 m (60 ÷ 2 = 30 m²).",
          },
          {
            id: "b",
            en: "60 sq meters — Multiply base × height = 10 × 6 = 60 sq meters.",
            es: "60 metros cuadrados — Multiplicar base × altura = 10 × 6 = 60 metros cuadrados.",
            correct: false,
            feedbackEn: "60 sq meters is the area of the full rectangle! Remember to take half (÷ 2) for a triangle.",
            feedbackEs: "¡60 metros cuadrados es el área del rectángulo completo! Recuerda tomar la mitad (÷ 2) para un triángulo.",
          },
          {
            id: "c",
            en: "40 sq meters — Use the slanted edge: 1/2 × 10 × 8 = 40 sq meters.",
            es: "40 metros cuadrados — Usar el borde inclinado: 1/2 × 10 × 8 = 40 metros cuadrados.",
            correct: false,
            feedbackEn: "Always use the perpendicular height (6 m) that meets the base at a 90° right angle, not the 8 m slanted side.",
            feedbackEs: "Usa siempre la altura perpendicular (6 m) que forma un ángulo recto de 90° con la base, no el lado inclinado de 8 m.",
          },
        ],
      },
      {
        stageEn: "Stage 2 · L-Shaped Reading Patio",
        stageEs: "Etapa 2 · Patio de lectura en forma de L",
        promptEn:
          "The L-shaped patio splits into two non-overlapping rectangles: a 5 m × 4 m main deck and a 3 m × 2 m bench alcove. What is the total area of the patio?",
        promptEs:
          "El patio en forma de L se divide en dos rectángulos sin superposición: una terraza principal de 5 m × 4 m y un rincón de banca de 3 m × 2 m. ¿Cuál es el área total del patio?",
        targetValue: 26,
        sliderLabelEn: "Main deck length (width = 4 m, plus 6 m² alcove):",
        sliderLabelEs: "Largo de la terraza principal (ancho = 4 m, más rincón de 6 m²):",
        sliderMin: 2,
        sliderMax: 8,
        sliderDefault: 5,
        computeSliderValue: (l) => l * 4 + 6,
        formatSliderFormula: (l) => `(${l} × 4) + (3 × 2) = ${l * 4} + 6 = ${l * 4 + 6} m²`,
        choices: [
          {
            id: "a",
            en: "26 sq meters — (5 × 4) + (3 × 2) = 20 + 6 = 26 sq meters.",
            es: "26 metros cuadrados — (5 × 4) + (3 × 2) = 20 + 6 = 26 metros cuadrados.",
            correct: true,
            feedbackEn: "Great decomposition! Adding the two non-overlapping rectangles gives 20 + 6 = 26 m².",
            feedbackEs: "¡Excelente descomposición! Sumar los dos rectángulos sin superposición da 20 + 6 = 26 m².",
          },
          {
            id: "b",
            en: "14 sq meters — Add all the numbers: 5 + 4 + 3 + 2 = 14 sq meters.",
            es: "14 metros cuadrados — Sumar todos los números: 5 + 4 + 3 + 2 = 14 metros cuadrados.",
            correct: false,
            feedbackEn: "Adding edge lengths measures distance, not square tiles! Multiply length × width for each rectangle first.",
            feedbackEs: "¡Sumar las longitudes de los bordes mide distancia, no baldosas cuadradas! Multiplica primero largo × ancho de cada rectángulo.",
          },
          {
            id: "c",
            en: "48 sq meters — Multiply (5 + 3) × (4 + 2) = 8 × 6 = 48 sq meters.",
            es: "48 metros cuadrados — Multiplicar (5 + 3) × (4 + 2) = 8 × 6 = 48 metros cuadrados.",
            correct: false,
            feedbackEn: "8 × 6 includes the empty corner outside the L-shape! Split the L into its two actual rectangles.",
            feedbackEs: "¡8 × 6 incluye la esquina vacía fuera de la forma de L! Divide la L en sus dos rectángulos reales.",
          },
        ],
      },
      {
        stageEn: "Stage 3 · Raised Planter Box Volume (Mastery Task)",
        stageEs: "Etapa 3 · Volumen de la jardinera elevada (Tarea de dominio)",
        promptEn:
          "The community herb planter is a rectangular prism 4 feet long, 3 feet wide, and 2 feet high. How many cubic feet of garden soil fill it completely (V = l × w × h)?",
        promptEs:
          "La jardinera comunitaria de hierbas es un prisma rectangular de 4 pies de largo, 3 pies de ancho y 2 pies de alto. ¿Cuántos pies cúbicos de tierra la llenan por completo (V = l × a × h)?",
        targetValue: 24,
        sliderLabelEn: "Soil layers stacked (each layer is 4 × 3 = 12 cu ft):",
        sliderLabelEs: "Capas de tierra apiladas (cada capa es 4 × 3 = 12 pies³):",
        sliderMin: 1,
        sliderMax: 4,
        sliderDefault: 2,
        computeSliderValue: (hVal) => 12 * hVal,
        formatSliderFormula: (hVal) => `V = (4 × 3) × ${hVal} = 12 × ${hVal} = ${12 * hVal} ft³`,
        choices: [
          {
            id: "a",
            en: "24 cubic feet — Base layer area is 4 × 3 = 12 sq ft, stacked 2 layers high: 12 × 2 = 24 cubic feet.",
            es: "24 pies cúbicos — El área de la capa base es 4 × 3 = 12 pies², apilada en 2 capas de altura: 12 × 2 = 24 pies cúbicos.",
            correct: true,
            feedbackEn: "Park blueprint complete! You calculated base area × height = 24 cubic feet of soil.",
            feedbackEs: "¡Plano del parque completado! Calculaste área de la base × altura = 24 pies cúbicos de tierra.",
          },
          {
            id: "b",
            en: "9 cubic feet — Add length + width + height: 4 + 3 + 2 = 9.",
            es: "9 pies cúbicos — Sumar largo + ancho + alto: 4 + 3 + 2 = 9.",
            correct: false,
            feedbackEn: "Volume counts 1-foot cubes inside the box, so multiply length × width × height (4 × 3 × 2).",
            feedbackEs: "El volumen cuenta cubos de 1 pie dentro de la caja, así que multiplica largo × ancho × alto (4 × 3 × 2).",
          },
          {
            id: "c",
            en: "12 cubic feet — Multiply 4 × 3 = 12 for the bottom face only.",
            es: "12 pies cúbicos — Multiplicar 4 × 3 = 12 solo para la cara inferior.",
            correct: false,
            feedbackEn: "12 cubes fills one 1-foot layer! Since the planter is 2 feet tall, multiply 12 × 2.",
            feedbackEs: "¡12 cubos llenan una capa de 1 pie! Como la jardinera mide 2 pies de alto, multiplica 12 × 2.",
          },
        ],
      },
    ],
  },

  expressions: {
    id: "expressions-machine",
    badgeEn: "Family Math Mission · Expressions & Equations",
    badgeEs: "Misión matemática familiar · Expresiones y ecuaciones",
    titleEn: "Operate the Balance & Expression Machine",
    titleEs: "Opera la máquina de equilibrio y expresiones",
    introEn:
      "Calibrate the Robotics Club sorting machine! Construct equivalent algebraic expressions, balance two-sided equations, and test boundary inequalities.",
    introEs:
      "¡Calibra la máquina clasificadora del Club de Robótica! Construye expresiones algebraicas equivalentes, equilibra ecuaciones de dos lados y prueba desigualdades.",
    meterLabelEn: "Machine Equilibrium Index",
    meterLabelEs: "Índice de equilibrio de la máquina",
    meterUnitEn: "units",
    meterUnitEs: "unidades",
    rounds: [
      {
        stageEn: "Stage 1 · Distributive Gear Calibration",
        stageEs: "Etapa 1 · Calibración del engranaje distributivo",
        promptEn:
          "The conveyor groups 3 identical trays, and each tray holds x bolts plus 4 washers: 3(x + 4). Which expanded expression represents the exact same hardware count for every value of x?",
        promptEs:
          "La banda agrupa 3 bandejas idénticas, y cada bandeja contiene x tornillos más 4 arandelas: 3(x + 4). ¿Qué expresión expandida representa exactamente la misma cantidad para cualquier valor de x?",
        targetValue: 21,
        sliderLabelEn: "Test bolt count x in 3(x + 4):",
        sliderLabelEs: "Prueba la cantidad de tornillos x en 3(x + 4):",
        sliderMin: 1,
        sliderMax: 6,
        sliderDefault: 3,
        computeSliderValue: (x) => 3 * (x + 4),
        formatSliderFormula: (x) => `3(${x} + 4) = 3(${x}) + 3(4) = ${3 * x} + 12 = ${3 * (x + 4)}`,
        choices: [
          {
            id: "a",
            en: "3x + 12 — Because 3 groups of (x + 4) gives 3 × x = 3x bolts and 3 × 4 = 12 washers.",
            es: "3x + 12 — Porque 3 grupos de (x + 4) dan 3 × x = 3x tornillos y 3 × 4 = 12 arandelas.",
            correct: true,
            feedbackEn: "Gear calibrated! Distributing 3 across both terms inside the parentheses gives 3x + 12.",
            feedbackEs: "¡Engranaje calibrado! Distribuir el 3 en ambos términos dentro del paréntesis da 3x + 12.",
          },
          {
            id: "b",
            en: "3x + 4 — Multiply 3 by x and leave the 4 unchanged.",
            es: "3x + 4 — Multiplicar 3 por x y dejar el 4 sin cambios.",
            correct: false,
            feedbackEn: "All 3 trays have 4 washers each! So the 4 must also be multiplied by 3 (3 × 4 = 12).",
            feedbackEs: "¡Las 3 bandejas tienen 4 arandelas cada una! Así que el 4 también debe multiplicarse por 3 (3 × 4 = 12).",
          },
          {
            id: "c",
            en: "15x — Combine 3x + 12 into 15x.",
            es: "15x — Combinar 3x + 12 en 15x.",
            correct: false,
            feedbackEn: "3x (variable bolts) and 12 (constant washers) are not like terms, so they stay separate as 3x + 12.",
            feedbackEs: "3x (tornillos variables) y 12 (arandelas constantes) no son términos semejantes, así que permanecen separados como 3x + 12.",
          },
        ],
      },
      {
        stageEn: "Stage 2 · Balancing the Two-Sided Arm",
        stageEs: "Etapa 2 · Equilibrando el brazo de dos lados",
        promptEn:
          "The balance beam holds x + 7 kilograms on the left and 19 kilograms on the right (x + 7 = 19). What single inverse operation isolates x and keeps the beam level?",
        promptEs:
          "La balanza sostiene x + 7 kilogramos a la izquierda y 19 kilogramos a la derecha (x + 7 = 19). ¿Qué operación inversa aísla x y mantiene la balanza nivelada?",
        targetValue: 12,
        sliderLabelEn: "Test mystery mass x in x + 7 = 19:",
        sliderLabelEs: "Prueba la masa misteriosa x en x + 7 = 19:",
        sliderMin: 6,
        sliderMax: 16,
        sliderDefault: 12,
        computeSliderValue: (x) => x + 7,
        formatSliderFormula: (x) => `Left: ${x} + 7 = ${x + 7} kg | Right: 19 kg`,
        choices: [
          {
            id: "a",
            en: "Subtract 7 from both sides so x = 19 − 7 = 12 kg (check: 12 + 7 = 19).",
            es: "Restar 7 de ambos lados para que x = 19 − 7 = 12 kg (comprobación: 12 + 7 = 19).",
            correct: true,
            feedbackEn: "Perfect equilibrium! Removing 7 kg from both trays isolates x = 12 kg.",
            feedbackEs: "¡Equilibrio perfecto! Quitar 7 kg de ambas bandejas aísla x = 12 kg.",
          },
          {
            id: "b",
            en: "Add 7 to both sides so x = 19 + 7 = 26 kg.",
            es: "Sumar 7 a ambos lados para que x = 19 + 7 = 26 kg.",
            correct: false,
            feedbackEn: "If x = 26, the left side becomes 26 + 7 = 33 kg instead of 19 kg! Use subtraction to undo + 7.",
            feedbackEs: "Si x = 26, ¡el lado izquierdo se convierte en 26 + 7 = 33 kg en lugar de 19 kg! Usa la resta para deshacer + 7.",
          },
          {
            id: "c",
            en: "Divide 19 by 7.",
            es: "Dividir 19 entre 7.",
            correct: false,
            feedbackEn: "Since 7 is added to x (not multiplied), undo it by subtracting 7 from both sides.",
            feedbackEs: "Como el 7 se suma a x (no se multiplica), deshazlo restando 7 de ambos lados.",
          },
        ],
      },
      {
        stageEn: "Stage 3 · Dependent Output Rule (Mastery Task)",
        stageEs: "Etapa 3 · Regla de salida dependiente (Tarea de dominio)",
        promptEn:
          "The packaging arm follows the rule y = 4x + 2, where x is the number of crates and y is the total straps used. How many straps are used for x = 5 crates?",
        promptEs:
          "El brazo empacador sigue la regla y = 4x + 2, donde x es el número de cajas e y es el total de correas usadas. ¿Cuántas correas se usan para x = 5 cajas?",
        targetValue: 22,
        sliderLabelEn: "Number of crates x in y = 4x + 2:",
        sliderLabelEs: "Número de cajas x en y = 4x + 2:",
        sliderMin: 1,
        sliderMax: 7,
        sliderDefault: 5,
        computeSliderValue: (x) => 4 * x + 2,
        formatSliderFormula: (x) => `y = 4(${x}) + 2 = ${4 * x + 2} straps`,
        choices: [
          {
            id: "a",
            en: "22 straps — Substitute x = 5 into 4(5) + 2 = 20 + 2 = 22.",
            es: "22 correas — Sustituye x = 5 en 4(5) + 2 = 20 + 2 = 22.",
            correct: true,
            feedbackEn: "Machine online! Substituting x = 5 gives 4(5) + 2 = 22 straps.",
            feedbackEs: "¡Máquina en línea! Sustituir x = 5 da 4(5) + 2 = 22 correas.",
          },
          {
            id: "b",
            en: "47 straps — Put 4 and 5 together as 45, then add 2.",
            es: "47 correas — Juntar 4 y 5 como 45, y luego sumar 2.",
            correct: false,
            feedbackEn: "Remember: 4x means 4 multiplied by x (4 × 5 = 20), not placing the digits side by side!",
            feedbackEs: "Recuerda: ¡4x significa 4 multiplicado por x (4 × 5 = 20), no colocar los dígitos uno al lado del otro!",
          },
          {
            id: "c",
            en: "30 straps — Add 5 + 2 = 7 first, then multiply by 4.",
            es: "30 correas — Sumar 5 + 2 = 7 primero, y luego multiplicar por 4.",
            correct: false,
            feedbackEn: "Multiply 4 × 5 = 20 before adding the constant 2.",
            feedbackEs: "Multiplica 4 × 5 = 20 antes de sumar la constante 2.",
          },
        ],
      },
    ],
  },

  integers: {
    id: "integers-navigator",
    badgeEn: "Family Math Mission · Integers & Coordinates",
    badgeEs: "Misión matemática familiar · Enteros y coordenadas",
    titleEn: "Deep-Sea & Grid Navigator",
    titleEs: "Navegante submarino y de cuadrícula",
    introEn:
      "Pilot the marine research submersible! Track signed depths below sea level, compare negative temperatures, and plot beacon coordinates across all four quadrants.",
    introEs:
      "¡Pilota el sumergible de investigación marina! Rastrea profundidades con signo bajo el nivel del mar, compara temperaturas negativas y ubica coordenadas en los cuatro cuadrantes.",
    meterLabelEn: "Submersible Sonar Lock",
    meterLabelEs: "Bloqueo de sonar del sumergible",
    meterUnitEn: "meters",
    meterUnitEs: "metros",
    rounds: [
      {
        stageEn: "Stage 1 · Comparing Reef Depths & Temperatures",
        stageEs: "Etapa 1 · Comparando profundidades y temperaturas del arrecife",
        promptEn:
          "Sensor A reads −4°C and Sensor B reads −9°C. Which temperature is warmer (greater on the number line), and which sensor has the greater magnitude from 0?",
        promptEs:
          "El sensor A marca −4°C y el sensor B marca −9°C. ¿Qué temperatura es más cálida (mayor en la recta numérica) y qué sensor tiene mayor magnitud desde 0?",
        targetValue: -4,
        sliderLabelEn: "Inspect signed position on the vertical number line:",
        sliderLabelEs: "Inspecciona la posición con signo en la recta vertical:",
        sliderMin: -10,
        sliderMax: 2,
        sliderDefault: -4,
        computeSliderValue: (v) => v,
        formatSliderFormula: (v) => `Position: ${v} | Distance from 0: |${v}| = ${Math.abs(v)}`,
        choices: [
          {
            id: "a",
            en: "−4°C is warmer (−4 > −9 because it is closer to 0), while |−9| = 9 has the greater distance from 0.",
            es: "−4°C es más cálido (−4 > −9 porque está más cerca de 0), mientras que |−9| = 9 tiene mayor distancia desde 0.",
            correct: true,
            feedbackEn: "Sonar locked! On the negative side of 0, numbers closer to 0 are greater (−4 > −9).",
            feedbackEs: "¡Sonar bloqueado! En el lado negativo de 0, los números más cercanos a 0 son mayores (−4 > −9).",
          },
          {
            id: "b",
            en: "−9°C is warmer because 9 is bigger than 4.",
            es: "−9°C es más cálido porque 9 es mayor que 4.",
            correct: false,
            feedbackEn: "9 is the distance below zero! Being 9 degrees below zero (−9°C) is colder than being 4 degrees below zero (−4°C).",
            feedbackEs: "¡9 es la distancia bajo cero! Estar 9 grados bajo cero (−9°C) es más frío que estar 4 grados bajo cero (−4°C).",
          },
          {
            id: "c",
            en: "|−4| equals −4 because absolute value keeps the negative sign.",
            es: "|−4| es igual a −4 porque el valor absoluto conserva el signo negativo.",
            correct: false,
            feedbackEn: "Absolute value measures distance from 0, which is always non-negative: |−4| = 4 and |−9| = 9.",
            feedbackEs: "El valor absoluto mide la distancia desde 0, que siempre es no negativa: |−4| = 4 y |−9| = 9.",
          },
        ],
      },
      {
        stageEn: "Stage 2 · Plotting the Coral Beacon",
        stageEs: "Etapa 2 · Ubicando la baliza de coral",
        promptEn:
          "The coral beacon is at ordered pair (−3, 5). Starting from the origin (0, 0), how do you move to reach (−3, 5)?",
        promptEs:
          "La baliza de coral está en el par ordenado (−3, 5). Partiendo del origen (0, 0), ¿cómo te mueves para llegar a (−3, 5)?",
        targetValue: 5,
        sliderLabelEn: "Horizontal x-coordinate (with y = 5):",
        sliderLabelEs: "Coordenada horizontal x (con y = 5):",
        sliderMin: -5,
        sliderMax: 5,
        sliderDefault: -3,
        computeSliderValue: (x) => x,
        formatSliderFormula: (x) => `(${x}, 5) → Quadrant ${x < 0 ? "II" : x > 0 ? "I" : "Y-Axis"}`,
        choices: [
          {
            id: "a",
            en: "Move 3 units left along the horizontal x-axis to −3, then 5 units up parallel to the y-axis (Quadrant II).",
            es: "Muévete 3 unidades a la izquierda sobre el eje horizontal x hasta −3, y luego 5 unidades hacia arriba paralelo al eje y (Cuadrante II).",
            correct: true,
            feedbackEn: "Beacon found! In (x, y), x = −3 moves left first and y = 5 moves up into Quadrant II.",
            feedbackEs: "¡Baliza encontrada! En (x, y), x = −3 se mueve primero a la izquierda e y = 5 sube al Cuadrante II.",
          },
          {
            id: "b",
            en: "Move 3 units down and 5 units right.",
            es: "Muévete 3 unidades hacia abajo y 5 unidades a la derecha.",
            correct: false,
            feedbackEn: "That swaps x and y! Always move horizontally (left/right) for the first coordinate x, then vertically (up/down) for y.",
            feedbackEs: "¡Eso intercambia x e y! Muévete siempre horizontalmente (izquierda/derecha) para la primera coordenada x, y luego verticalmente (arriba/abajo) para y.",
          },
          {
            id: "c",
            en: "Move 3 units right and 5 units up.",
            es: "Muévete 3 unidades a la derecha y 5 unidades hacia arriba.",
            correct: false,
            feedbackEn: "Watch the negative sign on −3! Negative x-values go to the LEFT of the origin.",
            feedbackEs: "¡Observa el signo negativo en −3! Los valores negativos de x van a la IZQUIERDA del origen.",
          },
        ],
      },
      {
        stageEn: "Stage 3 · Crossing Axes Distance (Mastery Task)",
        stageEs: "Etapa 3 · Distancia cruzando ejes (Tarea de dominio)",
        promptEn:
          "Research Station Alpha is at (−4, 2) and Station Beta is at (5, 2). What is the horizontal distance between the two stations?",
        promptEs:
          "La Estación Alfa está en (−4, 2) y la Estación Beta está en (5, 2). ¿Cuál es la distancia horizontal entre las dos estaciones?",
        targetValue: 9,
        sliderLabelEn: "East station x-coordinate (from −4 to x):",
        sliderLabelEs: "Coordenada x de la estación este (desde −4 hasta x):",
        sliderMin: 1,
        sliderMax: 7,
        sliderDefault: 5,
        computeSliderValue: (x) => Math.abs(-4) + x,
        formatSliderFormula: (x) => `|−4| + |${x}| = 4 + ${x} = ${4 + x} units`,
        choices: [
          {
            id: "a",
            en: "9 units — Since they cross the y-axis, add the distances to 0: |−4| + |5| = 4 + 5 = 9 units.",
            es: "9 unidades — Como cruzan el eje y, suma las distancias hasta 0: |−4| + |5| = 4 + 5 = 9 unidades.",
            correct: true,
            feedbackEn: "Navigation complete! Walking 4 units from −4 to 0 and 5 more units from 0 to 5 covers 9 total units.",
            feedbackEs: "¡Navegación completa! Recorrer 4 unidades desde −4 hasta 0 y 5 unidades más desde 0 hasta 5 cubre 9 unidades en total.",
          },
          {
            id: "b",
            en: "1 unit — Subtract 5 − 4 = 1 unit.",
            es: "1 unidad — Restar 5 − 4 = 1 unidad.",
            correct: false,
            feedbackEn: "5 − 4 would be the distance from +4 to +5! Because −4 and +5 are on opposite sides of 0, add their absolute values: 4 + 5 = 9.",
            feedbackEs: "¡5 − 4 sería la distancia de +4 a +5! Como −4 y +5 están en lados opuestos de 0, suma sus valores absolutos: 4 + 5 = 9.",
          },
          {
            id: "c",
            en: "13 units — Add 4 + 5 + 2 + 2 = 13 units.",
            es: "13 unidades — Sumar 4 + 5 + 2 + 2 = 13 unidades.",
            correct: false,
            feedbackEn: "Both points share the same height (y = 2), so only the horizontal x-coordinates change.",
            feedbackEs: "Ambos puntos comparten la misma altura (y = 2), así que solo cambian las coordenadas horizontales x.",
          },
        ],
      },
    ],
  },

  statistics: {
    id: "statistics-detective",
    badgeEn: "Family Math Mission · Data & Statistics",
    badgeEs: "Misión matemática familiar · Datos y estadística",
    titleEn: "Community Library Data Detective",
    titleEs: "Detective de datos de la biblioteca comunitaria",
    introEn:
      "The neighborhood library council needs data evidence to plan weekend hours! Investigate survey questions, find the median and mean, and choose the measure of center that best represents the community.",
    introEs:
      "¡El consejo de la biblioteca vecinal necesita evidencia de datos para planificar el horario de fin de semana! Investiga preguntas de encuesta, halla la mediana y la media, y elige la medida de centro que mejor represente a la comunidad.",
    meterLabelEn: "Data Evidence Confidence",
    meterLabelEs: "Confianza en la evidencia de datos",
    meterUnitEn: "books / hrs",
    meterUnitEs: "libros / hrs",
    rounds: [
      {
        stageEn: "Stage 1 · Designing a Statistical Question",
        stageEs: "Etapa 1 · Diseñando una pregunta estadística",
        promptEn:
          "You want to survey families about library visits. Which question is a true STATISTICAL question that anticipates variability across responses?",
        promptEs:
          "Quieres encuestar a las familias sobre las visitas a la biblioteca. ¿Qué pregunta es una verdadera pregunta ESTADÍSTICA que anticipa variabilidad en las respuestas?",
        targetValue: 6,
        sliderLabelEn: "Sample size of families surveyed:",
        sliderLabelEs: "Tamaño de la muestra de familias encuestadas:",
        sliderMin: 2,
        sliderMax: 10,
        sliderDefault: 6,
        computeSliderValue: (n) => n,
        formatSliderFormula: (n) => `${n} families surveyed → multiple varying responses`,
        choices: [
          {
            id: "a",
            en: '"How many minutes do families in our neighborhood spend reading at the library each Saturday?" (varies from family to family).',
            es: '"¿Cuántos minutos pasan las familias de nuestro vecindario leyendo en la biblioteca cada sábado?" (varía de una familia a otra).',
            correct: true,
            feedbackEn: "Great data design! Because different families spend different amounts of time, the data has variability.",
            feedbackEs: "¡Excelente diseño de datos! Como diferentes familias pasan distintas cantidades de tiempo, los datos tienen variabilidad.",
          },
          {
            id: "b",
            en: '"What time does the library building open on Saturday morning?"',
            es: '"¿A qué hora abre el edificio de la biblioteca el sábado por la mañana?"',
            correct: false,
            feedbackEn: "That question has a single fixed answer (for example, 9:00 AM) with zero variability.",
            feedbackEs: "Esa pregunta tiene una única respuesta fija (por ejemplo, 9:00 AM) sin variabilidad.",
          },
          {
            id: "c",
            en: '"How many books did I check out yesterday?"',
            es: '"¿Cuántos libros saqué ayer?"',
            correct: false,
            feedbackEn: "Asking about one person on one day produces a single number, not a distribution of varying data.",
            feedbackEs: "Preguntar sobre una persona en un día produce un solo número, no una distribución de datos variables.",
          },
        ],
      },
      {
        stageEn: "Stage 2 · Ordering Data to Find the Median",
        stageEs: "Etapa 2 · Ordenando datos para hallar la mediana",
        promptEn:
          "Five students reported the number of books they read this month: 8, 2, 10, 4, 6. What is the median number of books read?",
        promptEs:
          "Cinco estudiantes informaron el número de libros que leyeron este mes: 8, 2, 10, 4, 6. ¿Cuál es la mediana de libros leídos?",
        targetValue: 6,
        sliderLabelEn: "Inspect ordered position (1st to 5th value in 2, 4, 6, 8, 10):",
        sliderLabelEs: "Inspecciona la posición ordenada (1.º a 5.º valor en 2, 4, 6, 8, 10):",
        sliderMin: 1,
        sliderMax: 5,
        sliderDefault: 3,
        computeSliderValue: (pos) => [2, 4, 6, 8, 10][pos - 1],
        formatSliderFormula: (pos) => `Ordered position #${pos} → ${[2, 4, 6, 8, 10][pos - 1]} books`,
        choices: [
          {
            id: "a",
            en: "6 books — First sort from least to greatest (2, 4, 6, 8, 10); the middle value is 6.",
            es: "6 libros — Primero ordena de menor a mayor (2, 4, 6, 8, 10); el valor central es 6.",
            correct: true,
            feedbackEn: "Spot on! Sorting first (2, 4, 6, 8, 10) reveals 6 as the true center value.",
            feedbackEs: "¡Exacto! Ordenar primero (2, 4, 6, 8, 10) revela el 6 como el verdadero valor central.",
          },
          {
            id: "b",
            en: "10 books — Because 10 is sitting in the middle of the unsorted list 8, 2, 10, 4, 6.",
            es: "10 libros — Porque el 10 está en el medio de la lista sin ordenar 8, 2, 10, 4, 6.",
            correct: false,
            feedbackEn: "Never pick the middle of an unsorted list! 10 is actually the maximum value. Sort the numbers from least to greatest first.",
            feedbackEs: "¡Nunca elijas el medio de una lista sin ordenar! 10 es en realidad el valor máximo. Ordena primero los números de menor a mayor.",
          },
          {
            id: "c",
            en: "8 books — Subtract minimum from maximum: 10 − 2 = 8.",
            es: "8 libros — Restar el mínimo del máximo: 10 − 2 = 8.",
            correct: false,
            feedbackEn: "10 − 2 = 8 is the range (spread), not the median (center).",
            feedbackEs: "10 − 2 = 8 es el rango (dispersión), no la mediana (centro).",
          },
        ],
      },
      {
        stageEn: "Stage 3 · Defending a Decision with Outliers (Mastery Task)",
        stageEs: "Etapa 3 · Defendiendo una decisión con valores atípicos (Tarea de dominio)",
        promptEn:
          "Five weekend visitors spent 2, 3, 3, 4, and 28 hours at the library (one researcher stayed all weekend!). The median is 3 hours and the mean is 8 hours. Which measure best represents a typical visitor, and why?",
        promptEs:
          "Cinco visitantes pasaron 2, 3, 3, 4 y 28 horas en la biblioteca (¡un investigador se quedó todo el fin de semana!). La mediana es 3 horas y la media es 8 horas. ¿Qué medida representa mejor a un visitante típico y por qué?",
        targetValue: 3,
        sliderLabelEn: "Test 5th visitor's hours (with 2, 3, 3, 4) to see effect on Mean:",
        sliderLabelEs: "Prueba las horas del 5.º visitante (con 2, 3, 3, 4) para ver el efecto en la media:",
        sliderMin: 4,
        sliderMax: 28,
        sliderDefault: 28,
        computeSliderValue: (v5) => Number(((2 + 3 + 3 + 4 + v5) / 5).toFixed(1)),
        formatSliderFormula: (v5) => `Mean = (12 + ${v5}) ÷ 5 = ${((12 + v5) / 5).toFixed(1)} hrs | Median = 3 hrs`,
        choices: [
          {
            id: "a",
            en: "The median (3 hours), because the extreme outlier (28 hours) pulls the mean up to 8 hours, which is higher than 4 out of 5 visitors.",
            es: "La mediana (3 horas), porque el valor atípico extremo (28 horas) eleva la media a 8 horas, que es mayor que 4 de los 5 visitantes.",
            correct: true,
            feedbackEn: "Case closed, Detective! The median (3 hrs) stays resistant to the 28-hour outlier, while the mean (8 hrs) is skewed.",
            feedbackEs: "¡Caso cerrado, detective! La mediana (3 hrs) se mantiene resistente al valor atípico de 28 horas, mientras que la media (8 hrs) se sesga.",
          },
          {
            id: "b",
            en: "The mean (8 hours), because the mean is always better when there is an extreme outlier.",
            es: "La media (8 horas), porque la media siempre es mejor cuando hay un valor atípico extremo.",
            correct: false,
            feedbackEn: "Look at the data: four visitors stayed 2 to 4 hours! Saying 8 hours is 'typical' misleads the council because the 28-hour outlier pulled the mean up.",
            feedbackEs: "Mira los datos: ¡cuatro visitantes se quedaron de 2 a 4 horas! Decir que 8 horas es 'típico' engaña al consejo porque el valor atípico de 28 horas elevó la media.",
          },
          {
            id: "c",
            en: "26 hours, because 28 − 2 = 26.",
            es: "26 horas, porque 28 − 2 = 26.",
            correct: false,
            feedbackEn: "26 hours is the range (spread from minimum to maximum), not a measure of typical center.",
            feedbackEs: "26 horas es el rango (dispersión del mínimo al máximo), no una medida de centro típico.",
          },
        ],
      },
    ],
  },
};

/**
 * Determine which mission template fits a given lessonId.
 */
export function selectMissionForLesson(lessonId = "") {
  const id = String(lessonId).trim();
  const unit = parseInt(id.split("-")[0], 10);
  if (id === "6-3" || id === "6-3-part2" || id === "6-4" || id === "6-14") {
    return MISSION_CATALOG.exponents;
  }
  if (unit === 1) return MISSION_CATALOG.fractions;
  if (unit === 2) return MISSION_CATALOG.statistics;
  if (unit === 3) return MISSION_CATALOG.ratios;
  if (unit === 4) return MISSION_CATALOG.percents;
  if (unit === 5) return MISSION_CATALOG.geometry;
  if (unit === 6 || unit === 8 || unit === 9) return MISSION_CATALOG.expressions;
  if (unit === 7) return MISSION_CATALOG.integers;
  return MISSION_CATALOG.ratios;
}

/**
 * Render an interactive SVG meter illustrating the student's live slider value vs target.
 */
function renderMissionSvg(mission, round, currentValue) {
  const target = Math.max(1, Math.abs(round.targetValue || 10));
  const curAbs = Math.max(0, Math.abs(currentValue));
  const maxScale = Math.max(target * 1.4, curAbs * 1.1, 10);
  const barWidth = Math.min(240, Math.max(12, Math.round((curAbs / maxScale) * 240)));
  const targetX = 30 + Math.min(240, Math.max(12, Math.round((target / maxScale) * 240)));
  const isMatched = Math.abs(currentValue - round.targetValue) < 0.01;

  return s(
    "svg",
    {
      viewBox: "0 0 320 92",
      class: "fp-mission-svg",
      role: "img",
      "aria-label": mission.meterLabelEn,
    },
    s("rect", {
      x: 10,
      y: 12,
      width: 300,
      height: 68,
      rx: 12,
      fill: "var(--fm-sunken)",
      stroke: "var(--fm-border-strong)",
    }),
    s("rect", {
      x: 30,
      y: 36,
      width: 240,
      height: 18,
      rx: 9,
      fill: "var(--fm-surface)",
      stroke: "var(--fm-border-strong)",
    }),
    s("rect", {
      x: 30,
      y: 36,
      width: barWidth,
      height: 18,
      rx: 9,
      fill: isMatched ? "var(--fm-success)" : "var(--fm-primary)",
    }),
    s("line", {
      x1: targetX,
      y1: 28,
      x2: targetX,
      y2: 62,
      stroke: "var(--fm-warn)",
      "stroke-width": 3,
      "stroke-dasharray": "4 2",
    }),
    s(
      "text",
      {
        x: 30,
        y: 26,
        fill: "var(--fm-text)",
        "font-size": "11",
        "font-weight": "700",
      },
      round.formatSliderFormula(round.sliderDefault)
    ),
    s(
      "text",
      {
        x: targetX,
        y: 73,
        "text-anchor": "middle",
        fill: "var(--fm-text-muted)",
        "font-size": "10",
        "font-weight": "600",
      },
      `Target: ${round.targetValue}`
    )
  );
}

/**
 * Mount the interactive 3-round Family Math Mission inside a host element.
 */
export function mountFamilyMission(host, options = {}) {
  if (!host) return null;
  const lessonId = options.lessonId || "";
  const mission = selectMissionForLesson(lessonId);

  let existingDeck = host.querySelector("[data-fp-mission-deck]");
  if (existingDeck) existingDeck.remove();

  let currentRoundIdx = 0;
  const completedRounds = new Set();

  const deck = h("section", {
    class: "fp-mission-deck fp-card",
    dataset: { fpMissionDeck: mission.id, round: "0" },
    "aria-label": mission.titleEn,
  });

  const header = h(
    "header",
    { class: "fp-mission-deck__header" },
    h(
      "div",
      { class: "fp-mission-deck__eyebrow-row" },
      bi(mission.badgeEn, mission.badgeEs, "span", "fp-mission-deck__badge"),
      h(
        "span",
        { class: "fp-mission-deck__progress", dataset: { missionProgress: "" } },
        bi("Round 1 of 3 · Untimed", "Ronda 1 de 3 · Sin límite de tiempo")
      )
    ),
    bi(mission.titleEn, mission.titleEs, "h4", "fp-mission-deck__title"),
    bi(mission.introEn, mission.introEs, "p", "fp-mission-deck__intro")
  );

  const stageNav = h(
    "div",
    { class: "fp-mission-deck__stages", role: "tablist" },
    ...mission.rounds.map((r, idx) =>
      h(
        "button",
        {
          type: "button",
          class: `fp-mission-deck__stage-pill${idx === 0 ? " is-active" : ""}`,
          dataset: { missionStageBtn: String(idx) },
          onClick: () => {
            currentRoundIdx = idx;
            renderCurrentRound();
          },
        },
        bi(`Round ${idx + 1}`, `Ronda ${idx + 1}`)
      )
    )
  );

  const body = h("div", { class: "fp-mission-deck__body" });

  function renderCurrentRound() {
    body.innerHTML = "";
    deck.dataset.round = String(currentRoundIdx);

    const progressEl = header.querySelector("[data-mission-progress]");
    if (progressEl) {
      progressEl.innerHTML = "";
      progressEl.appendChild(
        bi(
          `Round ${currentRoundIdx + 1} of ${mission.rounds.length} · Untimed`,
          `Ronda ${currentRoundIdx + 1} de ${mission.rounds.length} · Sin límite de tiempo`
        )
      );
    }

    stageNav.querySelectorAll("[data-mission-stage-btn]").forEach((btn, idx) => {
      btn.classList.toggle("is-active", idx === currentRoundIdx);
      btn.classList.toggle("is-done", completedRounds.has(idx));
    });

    const round = mission.rounds[currentRoundIdx];
    let sliderVal = round.sliderDefault;

    const stageTitle = bi(round.stageEn, round.stageEs, "h5", "fp-mission-deck__stage-title");
    const prompt = bi(round.promptEn, round.promptEs, "p", "fp-mission-deck__prompt");

    const svgWrap = h("div", { class: "fp-mission-deck__svg-wrap" });
    const updateSvg = () => {
      svgWrap.innerHTML = "";
      const val = round.computeSliderValue(sliderVal);
      const svg = renderMissionSvg(mission, round, val);
      const formulaText = svg.querySelector("text");
      if (formulaText) formulaText.textContent = round.formatSliderFormula(sliderVal);
      svgWrap.appendChild(svg);
    };
    updateSvg();

    const sliderFormulaBadge = h(
      "output",
      { class: "fp-mission-deck__formula-output" },
      round.formatSliderFormula(sliderVal)
    );

    const sliderInput = h("input", {
      type: "range",
      class: "fp-mission-deck__slider",
      min: round.sliderMin,
      max: round.sliderMax,
      step: 1,
      value: sliderVal,
      "aria-label": round.sliderLabelEn,
      onInput: (e) => {
        sliderVal = Number(e.target.value);
        sliderFormulaBadge.textContent = round.formatSliderFormula(sliderVal);
        updateSvg();
      },
    });

    const interactiveBox = h(
      "div",
      { class: "fp-mission-deck__interactive" },
      h(
        "div",
        { class: "fp-mission-deck__slider-top" },
        bi(round.sliderLabelEn, round.sliderLabelEs, "label", "fp-mission-deck__slider-label"),
        sliderFormulaBadge
      ),
      sliderInput,
      svgWrap
    );

    const feedbackBox = h("div", {
      class: "fp-mission-deck__feedback",
      role: "status",
      "aria-live": "polite",
      hidden: true,
    });

    const nextRow = h("div", { class: "fp-mission-deck__next-row", hidden: true });

    const choicesGrid = h(
      "div",
      { class: "fp-mission-deck__choices" },
      ...round.choices.map((c) =>
        h(
          "button",
          {
            type: "button",
            class: "fp-mission-deck__choice",
            dataset: { missionChoice: c.id },
            onClick: (ev) => {
              choicesGrid.querySelectorAll(".fp-mission-deck__choice").forEach((b) => {
                b.classList.remove("is-selected", "is-correct", "is-wrong");
              });
              ev.currentTarget.classList.add("is-selected");
              feedbackBox.hidden = false;
              feedbackBox.innerHTML = "";

              if (c.correct) {
                ev.currentTarget.classList.add("is-correct");
                feedbackBox.className = "fp-mission-deck__feedback is-correct";
                feedbackBox.appendChild(bi(c.feedbackEn, c.feedbackEs, "p"));
                completedRounds.add(currentRoundIdx);
                stageNav
                  .querySelectorAll("[data-mission-stage-btn]")
                  [currentRoundIdx]?.classList.add("is-done");

                nextRow.hidden = false;
                nextRow.innerHTML = "";
                if (currentRoundIdx < mission.rounds.length - 1) {
                  nextRow.appendChild(
                    h(
                      "button",
                      {
                        type: "button",
                        class: "fp-mission-deck__next-btn",
                        onClick: () => {
                          currentRoundIdx += 1;
                          renderCurrentRound();
                        },
                      },
                      bi(
                        `Continue to Round ${currentRoundIdx + 2} →`,
                        `Continuar a la ronda ${currentRoundIdx + 2} →`
                      )
                    )
                  );
                  nextRow.appendChild(
                    h(
                      "button",
                      {
                        type: "button",
                        class: "fp-mission-deck__quick-exit-btn",
                        onClick: () => {
                          if (typeof options.onComplete === "function") {
                            options.onComplete({
                              missionId: mission.id,
                              roundsCompleted: completedRounds.size,
                              quickExit: true,
                            });
                          }
                          if (typeof window !== "undefined" && typeof window.switchHomeworkTab === "function") {
                            window.switchHomeworkTab("done");
                          }
                        },
                      },
                      bi("Quick Save & Finish Lesson", "Guardar rápido y terminar la lección")
                    )
                  );
                } else {
                  nextRow.appendChild(
                    h(
                      "div",
                      { class: "fp-mission-deck__victory" },
                      bi(
                        "🎉 Mission Complete! You applied the math across all 3 stages.",
                        "🎉 ¡Misión completada! Aplicaste las matemáticas en las 3 etapas.",
                        "p",
                        "fp-mission-deck__victory-text"
                      ),
                      h(
                        "button",
                        {
                          type: "button",
                          class: "fp-mission-deck__next-btn",
                          onClick: () => {
                            if (typeof options.onComplete === "function") {
                              options.onComplete({
                                missionId: mission.id,
                                roundsCompleted: completedRounds.size,
                                quickExit: false,
                              });
                            }
                            if (typeof window !== "undefined" && typeof window.switchHomeworkTab === "function") {
                              window.switchHomeworkTab("done");
                            }
                          },
                        },
                        bi("Celebrate Your Math Win →", "Celebra tu logro matemático →")
                      )
                    )
                  );
                }
              } else {
                ev.currentTarget.classList.add("is-wrong");
                feedbackBox.className = "fp-mission-deck__feedback is-hint";
                feedbackBox.appendChild(bi(c.feedbackEn, c.feedbackEs, "p"));
              }
            },
          },
          bi(c.en, c.es)
        )
      )
    );

    body.append(stageTitle, prompt, interactiveBox, choicesGrid, feedbackBox, nextRow);
  }

  renderCurrentRound();
  deck.append(header, stageNav, body);
  host.insertBefore(deck, host.firstChild);
  return deck;
}

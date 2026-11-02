/**
 * CRADecompositionEngine.js — Concrete-Representational-Abstract (CRA) Dynamic Engine
 * EduWonderLab Math Fluency Lab
 *
 * Zero-dependency, client-side, local-first module.
 * Generates programmatic inline SVGs, deterministic state transitions:
 * INSPECT -> PARTITION -> RECOMBINE -> TRANSFER.
 * Provides micro-transitions, keyboard accessibility (Tab, Arrows, Space, Enter),
 * touch/drag handles, and WIDA/ELD dual-language (EN/ES) scaffolding.
 */

// ============================================================================
// 1. WIDA / ELD DUAL-LANGUAGE STRATEGY REGISTRY & METADATA
// ============================================================================

export function parseProblemFact(item) {
  if (!item) return { operandA: 7, operandB: 8, operator: "×", answer: 56 };
  const q = String(item.question || "");
  const ans = item.displayAnswer || (item.answers && item.answers[0]) || "";

  // Multiplication match
  const multMatch = q.match(/(\d+)\s*[×*]\s*(\d+)/);
  if (multMatch) {
    return {
      operandA: Number(multMatch[1]),
      operandB: Number(multMatch[2]),
      operator: "×",
      answer: ans,
      question: q,
      kind: item.kind,
      standard: item.skill?.standard || "3.OA.B.5",
    };
  }

  // Addition match
  const addMatch = q.match(/(\d+)\s*\+\s*(\d+)/);
  if (addMatch) {
    return {
      operandA: Number(addMatch[1]),
      operandB: Number(addMatch[2]),
      operator: "+",
      answer: ans,
      question: q,
      kind: item.kind,
      standard: item.skill?.standard || "1.OA.C.6",
    };
  }

  // Subtraction match
  const subMatch = q.match(/(\d+)\s*[−-]\s*(\d+)/);
  if (subMatch) {
    return {
      operandA: Number(subMatch[1]),
      operandB: Number(subMatch[2]),
      operator: "−",
      answer: ans,
      question: q,
      kind: item.kind,
      standard: item.skill?.standard || "2.OA.B.2",
    };
  }

  // Division match
  const divMatch = q.match(/(\d+)\s*[÷/]\s*(\d+)/);
  if (divMatch) {
    return {
      operandA: Number(divMatch[1]),
      operandB: Number(divMatch[2]),
      operator: "÷",
      answer: ans,
      question: q,
      kind: item.kind,
      standard: item.skill?.standard || "3.OA.C.7",
    };
  }

  // Fractions match
  if (q.includes("/") || item.kind === "fraction") {
    return {
      operandA: 1,
      operandB: 2,
      operator: "+",
      kind: "fraction",
      answer: ans,
      question: q,
      standard: item.skill?.standard || "4.NF.B.3",
    };
  }

  // Fallback: extract two numbers
  const nums = q.match(/-?\d+/g);
  if (nums && nums.length >= 2) {
    return {
      operandA: Number(nums[0]),
      operandB: Number(nums[1]),
      operator: item.skill?.strand?.toLowerCase().includes("mult") ? "×" : item.skill?.strand?.toLowerCase().includes("sub") ? "−" : "+",
      answer: ans,
      question: q,
      standard: item.skill?.standard || "",
    };
  }

  return {
    operandA: 7,
    operandB: 8,
    operator: "×",
    answer: ans || 56,
    question: q,
    standard: item.skill?.standard || "",
  };
}

export const CRA_STRATEGY_REGISTRY = {
  // --- MULTIPLICATION ---
  distributive_split: {
    id: "distributive_split",
    domain: "multiplication",
    titleEn: "Break Apart Factor (Distributive Property)",
    titleEs: "Descomponer el Factor (Propiedad Distributiva)",
    widaEn: "Split a tough number into friendly benchmarks like 5 or 10.",
    widaEs: "Divide un número difícil en puntos de referencia amigables como 5 o 10.",
    defaultSplit: (a, b) => {
      // Split the more challenging factor into benchmark 5 + n or 10 - n
      if (a >= 6 && a <= 9) return 5;
      if (b >= 6 && b <= 9) return 5;
      return Math.floor(a / 2) || 1;
    },
    recommend: (a, b) => (a >= 6 && a <= 9) || (b >= 6 && b <= 9),
  },
  doubles_halves: {
    id: "doubles_halves",
    domain: "multiplication",
    titleEn: "Doubles and Halves",
    titleEs: "Dobles y Mitades",
    widaEn: "Cut an even factor in half, find the smaller product, then double it.",
    widaEs: "Corta un factor par a la mitad, calcula el producto menor y duplícalo.",
    defaultSplit: (a) => (a % 2 === 0 ? a / 2 : Math.floor(a / 2)),
    recommend: (a, b) => a === 4 || a === 6 || a === 8 || b === 4 || b === 6 || b === 8,
  },

  // --- ADDITION ---
  make_ten: {
    id: "make_ten",
    domain: "addition",
    titleEn: "Make Ten Strategy",
    titleEs: "Estrategia de Formar Diez",
    widaEn: "Move counters to fill the first ten-frame, then add the leftovers.",
    widaEs: "Mueve fichas para llenar el primer marco de diez, luego suma el resto.",
    recommend: (a, b) => (a >= 7 && a <= 9 && b >= 2 && a + b > 10) || (b >= 7 && b <= 9 && a >= 2 && a + b > 10),
  },
  doubles_plus_one: {
    id: "doubles_plus_one",
    domain: "addition",
    titleEn: "Near Doubles (Doubles + 1)",
    titleEs: "Casi Dobles (Dobles + 1)",
    widaEn: "Use the double fact you know cold, then add 1 more.",
    widaEs: "Usa el doble que conoces bien y luego suma 1 más.",
    recommend: (a, b) => Math.abs(a - b) === 1,
  },
  benchmark_jump: {
    id: "benchmark_jump",
    domain: "addition",
    titleEn: "Jump to Friendly Decades",
    titleEs: "Saltar a Decenas Amigables",
    widaEn: "Hop on the number line to the nearest 10, then add the remaining distance.",
    widaEs: "Salta en la recta numérica al 10 más cercano, luego añade el resto.",
    recommend: (a, b) => a + b > 10,
  },

  // --- SUBTRACTION ---
  benchmark_back_jump: {
    id: "benchmark_back_jump",
    domain: "subtraction",
    titleEn: "Count Back Through Ten",
    titleEs: "Contar Hacia Atrás Pasando por Diez",
    widaEn: "Jump back to 10 first, then take away the rest of the subtrahend.",
    widaEs: "Salta hacia atrás hasta 10 primero, luego resta el resto.",
    recommend: (a, b) => a > 10 && a <= 20 && b > (a - 10),
  },
  think_addition_ten: {
    id: "think_addition_ten",
    domain: "subtraction",
    titleEn: "Think Addition (Count Up)",
    titleEs: "Pensar en Suma (Contar Hacia Adelante)",
    widaEn: "Start at the smaller number, jump to 10, then jump to the total.",
    widaEs: "Comienza en el menor, salta a 10 y luego al total.",
    recommend: (a, b) => a > 10 && b >= 7,
  },

  // --- DIVISION ---
  partition_quotient: {
    id: "partition_quotient",
    domain: "division",
    titleEn: "Partition the Dividend",
    titleEs: "Descomponer el Dividendo",
    widaEn: "Split the big number into two easy multiples you know from memory.",
    widaEs: "Divide el número grande en dos múltiplos fáciles que recuerdes.",
    recommend: (dividend, divisor) => dividend % divisor === 0 && dividend > divisor * 5,
  },

  // --- FRACTIONS ---
  fraction_cut: {
    id: "fraction_cut",
    domain: "fractions",
    titleEn: "Fraction Bar Partition Slicing",
    titleEs: "Partición Visual de Barras de Fracciones",
    widaEn: "Cut parts into equal sub-pieces so both fractions share the same denominator.",
    widaEs: "Corta las partes en pedazos iguales para que tengan el mismo denominador.",
    recommend: (a, b) => Boolean(String(a).includes("/") || String(b).includes("/")),
  },

  // --- INTEGERS ---
  zero_pairs: {
    id: "zero_pairs",
    domain: "integers",
    titleEn: "Zero Pairs Cancellation",
    titleEs: "Cancelación de Pares Cero",
    widaEn: "Match one positive (+1) and one negative (-1) to cancel into zero.",
    widaEs: "Empareja un positivo (+1) y un negativo (-1) para formar cero.",
    recommend: (a, b) => a < 0 || b < 0,
  },
};

// ============================================================================
// 2. DETERMINISTIC SVG GENERATORS (Inline, Scalable, Accessible)
// ============================================================================

const SVG_NS = "http://www.w3.org/2000/svg";

function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, val] of Object.entries(attrs)) {
    el.setAttribute(key, String(val));
  }
  return el;
}

/**
 * makeAreaModelSVG
 * Multiplication distributive area model deconstructing (a1 + a2) * b.
 */
export function makeAreaModelSVG({
  factorA = 7,
  factorB = 8,
  split = 5,
  phase = "PARTITION",
  width = 540,
  height = 240,
  locale = "en",
  onHandleDrag = null,
} = {}) {
  split = Math.max(1, Math.min(factorA - 1, split));
  const partA1 = split;
  const partA2 = factorA - split;
  const prod1 = partA1 * factorB;
  const prod2 = partA2 * factorB;
  const total = factorA * factorB;

  const margin = { top: 38, right: 30, bottom: 42, left: 45 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const w1 = Math.round((partA1 / factorA) * plotW);
  const w2 = plotW - w1;

  const isInspect = phase === "INSPECT";
  const isPartition = phase === "PARTITION";
  const isRecombine = phase === "RECOMBINE" || phase === "TRANSFER";

  const color1 = isInspect ? "#3b82f6" : "#059669";
  const color1Light = isInspect ? "#dbeafe" : "#d1fae5";
  const color2 = isInspect ? "#3b82f6" : "#d97706";
  const color2Light = isInspect ? "#dbeafe" : "#fef3c7";

  let svgHtml = `
  <svg class="cra-svg cra-area-model-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Area model decomposing ${factorA} times ${factorB} into (${partA1} × ${factorB}) + (${partA2} × ${factorB})">
    <defs>
      <pattern id="grid-pattern-1" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M 16 0 L 0 0 0 16" fill="none" stroke="${color1}" stroke-width="0.5" stroke-opacity="0.3"/>
      </pattern>
      <pattern id="grid-pattern-2" width="16" height="16" patternUnits="userSpaceOnUse">
        <path d="M 16 0 L 0 0 0 16" fill="none" stroke="${color2}" stroke-width="0.5" stroke-opacity="0.3"/>
      </pattern>
    </defs>

    <!-- Side Label (factorB) -->
    <text x="${margin.left - 14}" y="${margin.top + plotH / 2 + 5}" text-anchor="end" font-size="16" font-weight="700" fill="currentColor">${factorB}</text>

    <!-- Top Brackets / Labels -->
    ${
      isInspect
        ? `<text x="${margin.left + plotW / 2}" y="${margin.top - 12}" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">${factorA}</text>`
        : `
          <!-- Part A1 Label -->
          <text x="${margin.left + w1 / 2}" y="${margin.top - 12}" text-anchor="middle" font-size="15" font-weight="700" fill="${color1}">${partA1}</text>
          <!-- Part A2 Label -->
          <text x="${margin.left + w1 + w2 / 2}" y="${margin.top - 12}" text-anchor="middle" font-size="15" font-weight="700" fill="${color2}">${partA2}</text>
        `
    }

    <!-- Rectangles -->
    <!-- Block 1 -->
    <rect x="${margin.left}" y="${margin.top}" width="${w1}" height="${plotH}" fill="${color1Light}" stroke="${color1}" stroke-width="2" rx="4"/>
    <rect x="${margin.left}" y="${margin.top}" width="${w1}" height="${plotH}" fill="url(#grid-pattern-1)" rx="4"/>
    
    <!-- Block 2 -->
    <rect x="${margin.left + w1}" y="${margin.top}" width="${w2}" height="${plotH}" fill="${color2Light}" stroke="${color2}" stroke-width="2" rx="4"/>
    <rect x="${margin.left + w1}" y="${margin.top}" width="${w2}" height="${plotH}" fill="url(#grid-pattern-2)" rx="4"/>

    <!-- Inner Product Labels -->
    ${
      isInspect
        ? `<text x="${margin.left + plotW / 2}" y="${margin.top + plotH / 2 + 6}" text-anchor="middle" font-size="20" font-weight="800" fill="#1e3a8a">${factorA} × ${factorB} = ?</text>`
        : `
          <g transform="translate(${margin.left + w1 / 2}, ${margin.top + plotH / 2})">
            <rect x="-42" y="-16" width="84" height="32" rx="6" fill="#ffffff" fill-opacity="0.9" stroke="${color1}" stroke-width="1"/>
            <text x="0" y="5" text-anchor="middle" font-size="14" font-weight="700" fill="${color1}">${partA1} × ${factorB} = ${isRecombine ? prod1 : "?"}</text>
          </g>
          <g transform="translate(${margin.left + w1 + w2 / 2}, ${margin.top + plotH / 2})">
            <rect x="-42" y="-16" width="84" height="32" rx="6" fill="#ffffff" fill-opacity="0.9" stroke="${color2}" stroke-width="1"/>
            <text x="0" y="5" text-anchor="middle" font-size="14" font-weight="700" fill="${color2}">${partA2} × ${factorB} = ${isRecombine ? prod2 : "?"}</text>
          </g>
        `
    }

    <!-- Interactive Split Handle (only in PARTITION phase) -->
    ${
      isPartition
        ? `
        <line x1="${margin.left + w1}" y1="${margin.top - 6}" x2="${margin.left + w1}" y2="${margin.top + plotH + 6}" stroke="#1e293b" stroke-width="3" stroke-dasharray="4 2"/>
        <g class="cra-interactive-handle" data-cra-action="split-handle" tabindex="0" role="slider" aria-valuenow="${split}" aria-valuemin="1" aria-valuemax="${factorA - 1}" aria-label="Split point at ${split}" transform="translate(${margin.left + w1}, ${margin.top + plotH / 2})">
          <circle r="14" fill="#ffffff" stroke="#1e293b" stroke-width="3" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.2))"/>
          <path d="M -4 0 L -8 -4 M -4 0 L -8 4 M 4 0 L 8 -4 M 4 0 L 8 4" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
        </g>
        `
        : ""
    }

    <!-- Bottom Recombination Equation Summary -->
    ${
      isRecombine
        ? `<text x="${margin.left + plotW / 2}" y="${margin.top + plotH + 28}" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">
            ${prod1} + ${prod2} = ${total}
           </text>`
        : ""
    }
  </svg>
  `;

  return svgHtml.trim();
}

/**
 * makeTenFrameSVG
 * Concrete Dual Ten-Frame showing Make Ten bridging ($8 + 5 \rightarrow 10 + 3$).
 */
export function makeTenFrameSVG({
  numA = 8,
  numB = 5,
  bridgedCount = 0,
  phase = "PARTITION",
  width = 540,
  height = 190,
  locale = "en",
} = {}) {
  const needed = Math.max(0, 10 - numA);
  const activeBridge = Math.min(needed, Math.max(0, bridgedCount));
  const currentA = numA + activeBridge;
  const currentB = numB - activeBridge;
  const isComplete = currentA >= 10;

  const frameW = 210;
  const frameH = 95;
  const cellW = frameW / 5;
  const cellH = frameH / 2;
  const gap = 40;
  const startX = (width - (frameW * 2 + gap)) / 2;
  const startY = 36;

  // Frame A tokens
  let tokensAHtml = "";
  for (let i = 0; i < 10; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const cx = startX + col * cellW + cellW / 2;
    const cy = startY + row * cellH + cellH / 2;

    if (i < numA) {
      // Original counters in A (Blue)
      tokensAHtml += `<circle cx="${cx}" cy="${cy}" r="16" fill="#2563eb" stroke="#1d4ed8" stroke-width="2"/>`;
    } else if (i < numA + activeBridge) {
      // Bridged counters from B (Coral/Amber with glowing stroke)
      tokensAHtml += `<circle class="cra-counter-token bridged" cx="${cx}" cy="${cy}" r="16" fill="#ea580c" stroke="#c2410c" stroke-width="2"/>`;
    }
  }

  // Frame B tokens
  let tokensBHtml = "";
  for (let j = 0; j < 10; j++) {
    const col = j % 5;
    const row = Math.floor(j / 5);
    const cx = startX + frameW + gap + col * cellW + cellW / 2;
    const cy = startY + row * cellH + cellH / 2;

    if (j < currentB) {
      const isCandidate = j >= currentB - 1;
      tokensBHtml += `
      <g class="cra-counter-token ${isCandidate ? "candidate" : ""}" data-token-index="${j}" tabindex="${isCandidate ? "0" : "-1"}" role="button" aria-label="Transfer counter to ten-frame">
        <circle cx="${cx}" cy="${cy}" r="16" fill="#ea580c" stroke="#c2410c" stroke-width="2"/>
      </g>`;
    }
  }

  return `
  <svg class="cra-svg cra-ten-frame-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Dual ten-frames showing ${numA} + ${numB}. ${activeBridge} counters bridged to complete the ten.">
    <!-- Frame A Box -->
    <text x="${startX + frameW / 2}" y="${startY - 12}" text-anchor="middle" font-size="14" font-weight="700" fill="#2563eb">
      ${locale === "es" ? "Marco 1" : "Ten-Frame 1"}: ${currentA}/10 ${isComplete ? "★ FULL" : ""}
    </text>
    <rect x="${startX}" y="${startY}" width="${frameW}" height="${frameH}" fill="#f8fafc" stroke="#94a3b8" stroke-width="2" rx="6"/>
    <!-- Grid Lines Frame A -->
    <line x1="${startX}" y1="${startY + cellH}" x2="${startX + frameW}" y2="${startY + cellH}" stroke="#cbd5e1" stroke-width="1.5"/>
    ${[1, 2, 3, 4].map((c) => `<line x1="${startX + c * cellW}" y1="${startY}" x2="${startX + c * cellW}" y2="${startY + frameH}" stroke="#cbd5e1" stroke-width="1.5"/>`).join("")}
    ${tokensAHtml}

    <!-- Transfer Arrow Bridge -->
    <path d="M ${startX + frameW + 8} ${startY + frameH / 2} Q ${startX + frameW + gap / 2} ${startY + frameH / 2 - 24} ${startX + frameW + gap - 8} ${startY + frameH / 2}" fill="none" stroke="#ea580c" stroke-width="2" stroke-dasharray="4 3"/>
    <text x="${startX + frameW + gap / 2}" y="${startY + frameH / 2 + 18}" text-anchor="middle" font-size="11" font-weight="700" fill="#ea580c">+${activeBridge}</text>

    <!-- Frame B Box -->
    <text x="${startX + frameW + gap + frameW / 2}" y="${startY - 12}" text-anchor="middle" font-size="14" font-weight="700" fill="#ea580c">
      ${locale === "es" ? "Marco 2" : "Ten-Frame 2"}: ${currentB} ${locale === "es" ? "restantes" : "leftovers"}
    </text>
    <rect x="${startX + frameW + gap}" y="${startY}" width="${frameW}" height="${frameH}" fill="#f8fafc" stroke="#94a3b8" stroke-width="2" rx="6"/>
    <!-- Grid Lines Frame B -->
    <line x1="${startX + frameW + gap}" y1="${startY + cellH}" x2="${startX + frameW * 2 + gap}" y2="${startY + cellH}" stroke="#cbd5e1" stroke-width="1.5"/>
    ${[1, 2, 3, 4].map((c) => `<line x1="${startX + frameW + gap + c * cellW}" y1="${startY}" x2="${startX + frameW + gap + c * cellW}" y2="${startY + frameH}" stroke="#cbd5e1" stroke-width="1.5"/>`).join("")}
    ${tokensBHtml}

    <!-- Bottom Status Text -->
    <text x="${width / 2}" y="${startY + frameH + 32}" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">
      ${isComplete ? `(10) + ${currentB} = ${10 + currentB}` : `Need ${needed - activeBridge} more to make 10`}
    </text>
  </svg>
  `.trim();
}

/**
 * makeNumberLineSVG
 * Benchmark Open Number Line with landmark jumps ($14 - 6 \rightarrow 14 \xrightarrow{-4} 10 \xrightarrow{-2} 8$).
 */
export function makeNumberLineSVG({
  startVal = 14,
  subtrahend = 6,
  phase = "PARTITION",
  width = 540,
  height = 180,
  locale = "en",
} = {}) {
  const targetVal = startVal - subtrahend;
  const jump1 = startVal - 10 > 0 ? startVal - 10 : Math.floor(subtrahend / 2);
  const jump2 = subtrahend - jump1;
  const benchmarkVal = startVal - jump1; // 10

  const margin = { left: 40, right: 40, y: 110 };
  const plotW = width - margin.left - margin.right;
  const minVal = Math.max(0, targetVal - 2);
  const maxVal = startVal + 2;
  const range = maxVal - minVal;

  const getX = (val) => margin.left + ((val - minVal) / range) * plotW;

  const xStart = getX(startVal);
  const xBench = getX(benchmarkVal);
  const xTarget = getX(targetVal);

  const isRecombine = phase === "RECOMBINE" || phase === "TRANSFER";

  return `
  <svg class="cra-svg cra-number-line-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Open number line subtracting ${subtrahend} from ${startVal} in jumps: -${jump1} to ${benchmarkVal}, then -${jump2} to ${targetVal}">
    <defs>
      <marker id="arrow-left" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#dc2626"/>
      </marker>
    </defs>

    <!-- Main Axis Line -->
    <line x1="${margin.left}" y1="${margin.y}" x2="${width - margin.right}" y2="${margin.y}" stroke="#475569" stroke-width="3" stroke-linecap="round"/>

    <!-- Benchmark Tick 10 -->
    <line x1="${xBench}" y1="${margin.y - 12}" x2="${xBench}" y2="${margin.y + 12}" stroke="#0284c7" stroke-width="3"/>
    <rect x="${xBench - 16}" y="${margin.y + 18}" width="32" height="24" rx="4" fill="#e0f2fe" stroke="#0284c7" stroke-width="1.5"/>
    <text x="${xBench}" y="${margin.y + 35}" text-anchor="middle" font-size="14" font-weight="800" fill="#0369a1">${benchmarkVal}</text>

    <!-- Start Tick -->
    <line x1="${xStart}" y1="${margin.y - 10}" x2="${xStart}" y2="${margin.y + 10}" stroke="#1e293b" stroke-width="2.5"/>
    <text x="${xStart}" y="${margin.y + 32}" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">${startVal}</text>

    <!-- Target Tick -->
    <line x1="${xTarget}" y1="${margin.y - 10}" x2="${xTarget}" y2="${margin.y + 10}" stroke="#059669" stroke-width="3"/>
    <text x="${xTarget}" y="${margin.y + 32}" text-anchor="middle" font-size="15" font-weight="800" fill="#059669">${isRecombine ? targetVal : "?"}</text>

    <!-- Arc Jump 1 (start to benchmark) -->
    <path d="M ${xStart} ${margin.y - 8} Q ${(xStart + xBench) / 2} ${margin.y - 65} ${xBench} ${margin.y - 8}" fill="none" stroke="#dc2626" stroke-width="2.5" marker-end="url(#arrow-left)"/>
    <g transform="translate(${(xStart + xBench) / 2}, ${margin.y - 52})">
      <rect x="-18" y="-12" width="36" height="20" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="1"/>
      <text x="0" y="3" text-anchor="middle" font-size="12" font-weight="700" fill="#b91c1c">-${jump1}</text>
    </g>

    <!-- Arc Jump 2 (benchmark to target) -->
    <path d="M ${xBench} ${margin.y - 8} Q ${(xBench + xTarget) / 2} ${margin.y - 65} ${xTarget} ${margin.y - 8}" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="${isRecombine ? "none" : "4 2"}" marker-end="url(#arrow-left)"/>
    <g transform="translate(${(xBench + xTarget) / 2}, ${margin.y - 52})">
      <rect x="-18" y="-12" width="36" height="20" rx="4" fill="#fef2f2" stroke="#dc2626" stroke-width="1"/>
      <text x="0" y="3" text-anchor="middle" font-size="12" font-weight="700" fill="#b91c1c">-${jump2}</text>
    </g>

    <text x="${width / 2}" y="24" text-anchor="middle" font-size="13" font-weight="600" fill="currentColor">
      ${locale === "es" ? `Paso 1: Saltar -${jump1} a 10 · Paso 2: Saltar -${jump2} a ${isRecombine ? targetVal : "la respuesta"}` : `Step 1: Jump -${jump1} to 10 · Step 2: Jump -${jump2} to ${isRecombine ? targetVal : "answer"}`}
    </text>
  </svg>
  `.trim();
}

/**
 * makeFractionBarSVG
 * Segmented fraction bars showing sub-partition cuts (e.g. 1/2 -> 2/4).
 */
export function makeFractionBarSVG({
  num = 1,
  denom = 2,
  targetDenom = 4,
  phase = "PARTITION",
  width = 540,
  height = 180,
  locale = "en",
} = {}) {
  const barW = width - 80;
  const barH = 46;
  const startX = 40;
  const startY = 40;

  const partW = barW / denom;
  const subPartW = barW / targetDenom;
  const multiplier = targetDenom / denom;
  const equivalentNum = num * multiplier;

  const isCut = phase === "PARTITION" || phase === "RECOMBINE" || phase === "TRANSFER";

  return `
  <svg class="cra-svg cra-fraction-bar-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Fraction bar showing ${num}/${denom} sliced into ${equivalentNum}/${targetDenom}">
    <!-- Original Bar -->
    <text x="${startX}" y="${startY - 10}" font-size="14" font-weight="700" fill="currentColor">Original: ${num}/${denom}</text>
    <rect x="${startX}" y="${startY}" width="${barW}" height="${barH}" fill="#f1f5f9" stroke="#64748b" stroke-width="2" rx="4"/>
    ${Array.from({ length: num }).map((_, i) => `<rect x="${startX + i * partW}" y="${startY}" width="${partW}" height="${barH}" fill="#3b82f6" fill-opacity="0.4" stroke="#2563eb" stroke-width="1.5"/>`).join("")}
    ${Array.from({ length: denom - 1 }).map((_, i) => `<line x1="${startX + (i + 1) * partW}" y1="${startY}" x2="${startX + (i + 1) * partW}" y2="${startY + barH}" stroke="#64748b" stroke-width="2"/>`).join("")}

    <!-- Sliced / Equivalence Bar -->
    <text x="${startX}" y="${startY + barH + 34}" font-size="14" font-weight="700" fill="${isCut ? "#059669" : "#64748b"}">
      ${isCut ? `${locale === "es" ? "Partición equivalente" : "Equivalent Partition"}: ${equivalentNum}/${targetDenom}` : `${locale === "es" ? "Siguiente corte..." : "Next slice..."}`}
    </text>
    <rect x="${startX}" y="${startY + barH + 42}" width="${barW}" height="${barH}" fill="#f8fafc" stroke="${isCut ? "#059669" : "#94a3b8"} stroke-width="2" rx="4"/>
    ${
      isCut
        ? Array.from({ length: equivalentNum }).map((_, i) => `<rect x="${startX + i * subPartW}" y="${startY + barH + 42}" width="${subPartW}" height="${barH}" fill="#10b981" fill-opacity="0.4" stroke="#059669" stroke-width="1.5"/>`).join("")
        : ""
    }
    ${
      isCut
        ? Array.from({ length: targetDenom - 1 }).map((_, i) => `<line x1="${startX + (i + 1) * subPartW}" y1="${startY + barH + 42}" x2="${startX + (i + 1) * subPartW}" y2="${startY + barH * 2 + 42}" stroke="#059669" stroke-width="${(i + 1) % multiplier === 0 ? "2.5" : "1.5"}" stroke-dasharray="${(i + 1) % multiplier === 0 ? "none" : "3 2"}"/>`).join("")
        : ""
    }
  </svg>
  `.trim();
}

/**
 * makeDivisionPartitionSVG
 * Area partition model for division: dividend decomposed into friendly multiples.
 */
export function makeDivisionPartitionSVG({
  dividend = 56,
  divisor = 7,
  split = 35,
  phase = "PARTITION",
  width = 540,
  height = 200,
  locale = "en",
} = {}) {
  const rem = dividend - split;
  const q1 = split / divisor;
  const q2 = rem / divisor;
  const quotient = dividend / divisor;

  const margin = { top: 35, right: 30, bottom: 40, left: 45 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;

  const w1 = Math.round((split / dividend) * plotW);
  const w2 = plotW - w1;
  const isRecombine = phase === "RECOMBINE" || phase === "TRANSFER";

  return `
  <svg class="cra-svg cra-division-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Division model partitioning ${dividend} divided by ${divisor} into (${split} ÷ ${divisor}) + (${rem} ÷ ${divisor})">
    <!-- Divisor Height -->
    <text x="${margin.left - 12}" y="${margin.top + plotH / 2 + 5}" text-anchor="end" font-size="16" font-weight="700" fill="currentColor">${divisor}</text>

    <!-- Block 1 -->
    <rect x="${margin.left}" y="${margin.top}" width="${w1}" height="${plotH}" fill="#d1fae5" stroke="#059669" stroke-width="2" rx="4"/>
    <text x="${margin.left + w1 / 2}" y="${margin.top + plotH / 2 + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="#065f46">${split} ÷ ${divisor} = ${q1}</text>
    <text x="${margin.left + w1 / 2}" y="${margin.top - 10}" text-anchor="middle" font-size="14" font-weight="700" fill="#059669">${q1}</text>

    <!-- Block 2 -->
    <rect x="${margin.left + w1}" y="${margin.top}" width="${w2}" height="${plotH}" fill="#fef3c7" stroke="#d97706" stroke-width="2" rx="4"/>
    <text x="${margin.left + w1 + w2 / 2}" y="${margin.top + plotH / 2 + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="#92400e">${rem} ÷ ${divisor} = ${q2}</text>
    <text x="${margin.left + w1 + w2 / 2}" y="${margin.top - 10}" text-anchor="middle" font-size="14" font-weight="700" fill="#d97706">${q2}</text>

    <!-- Total Quotient Footer -->
    <text x="${margin.left + plotW / 2}" y="${margin.top + plotH + 26}" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">
      ${isRecombine ? `${q1} + ${q2} = ${quotient} (${locale === "es" ? "Cociente total" : "Total Quotient"})` : `${dividend} ÷ ${divisor} = ?`}
    </text>
  </svg>
  `.trim();
}

/**
 * makeIntegerCountersSVG
 * Two-color counters (+1 Yellow, -1 Red) with Zero Pairs cancellation.
 */
export function makeIntegerCountersSVG({
  numA = 5,
  numB = -3,
  pairsCancelled = 0,
  phase = "PARTITION",
  width = 540,
  height = 180,
  locale = "en",
} = {}) {
  const posCount = (numA > 0 ? numA : 0) + (numB > 0 ? numB : 0);
  const negCount = (numA < 0 ? Math.abs(numA) : 0) + (numB < 0 ? Math.abs(numB) : 0);
  const maxPairs = Math.min(posCount, negCount);
  const activePairs = Math.min(maxPairs, pairsCancelled);
  const netResult = posCount - negCount;

  const radius = 16;
  const startX = 50;
  const rowYPos = 48;
  const rowYNeg = 110;

  return `
  <svg class="cra-svg cra-integer-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="Two-color counters showing ${posCount} positive counters and ${negCount} negative counters with ${activePairs} zero pairs cancelled.">
    <!-- Positive Counters -->
    <text x="${startX - 25}" y="${rowYPos + 5}" font-size="14" font-weight="700" fill="#eab308">+</text>
    ${Array.from({ length: posCount }).map((_, i) => {
      const isPaired = i < activePairs;
      return `<circle cx="${startX + i * 38}" cy="${rowYPos}" r="${radius}" fill="#eab308" stroke="#ca8a04" stroke-width="2" opacity="${isPaired ? "0.4" : "1"}"/>`;
    }).join("")}

    <!-- Negative Counters -->
    <text x="${startX - 25}" y="${rowYNeg + 5}" font-size="16" font-weight="700" fill="#ef4444">−</text>
    ${Array.from({ length: negCount }).map((_, j) => {
      const isPaired = j < activePairs;
      return `<circle cx="${startX + j * 38}" cy="${rowYNeg}" r="${radius}" fill="#ef4444" stroke="#dc2626" stroke-width="2" opacity="${isPaired ? "0.4" : "1"}"/>`;
    }).join("")}

    <!-- Zero Pair Cancellation Brackets -->
    ${Array.from({ length: activePairs }).map((_, k) => `
      <rect x="${startX + k * 38 - 18}" y="${rowYPos - 20}" width="36" height="${rowYNeg - rowYPos + 40}" rx="6" fill="none" stroke="#64748b" stroke-width="1.5" stroke-dasharray="3 3"/>
      <text x="${startX + k * 38}" y="${(rowYPos + rowYNeg) / 2 + 4}" text-anchor="middle" font-size="10" font-weight="800" fill="#64748b">0</text>
    `).join("")}

    <!-- Footer Equation -->
    <text x="${width / 2}" y="${height - 12}" text-anchor="middle" font-size="15" font-weight="700" fill="currentColor">
      ${activePairs > 0 ? `${locale === "es" ? "Pares cero eliminados" : "Zero pairs removed"}: ${activePairs} · ${locale === "es" ? "Resultado" : "Net"}: ${netResult}` : `Click to cancel zero pairs (+1 and -1)`}
    </text>
  </svg>
  `.trim();
}

// ============================================================================
// 3. UNIFIED CRADecompositionEngine CLASS
// ============================================================================

export class CRADecompositionEngine {
  constructor(config = {}) {
    this.container = config.container || null;
    this.onStepComplete = config.onStepComplete || null;
    this.onMasteryResolved = config.onMasteryResolved || null;
    this.onTransferReady = config.onTransferReady || null;
    this.locale = config.locale || "en";

    // State machine
    this.phase = "INSPECT"; // INSPECT | PARTITION | RECOMBINE | TRANSFER
    this.problem = null;
    this.strategy = null;
    this.splitValue = 5;
    this.bridgedCount = 0;
    this.startTime = 0;
    this.firstKeypressTime = 0;
    this.attempts = 0;

    this.boundKeyHandler = this.handleKeyDown.bind(this);
    this.boundClickHandler = this.handleClick.bind(this);
    this.boundInputHandler = this.handleInput.bind(this);
  }

  /**
   * Initializes and mounts the visual representation
   * @param {HTMLElement} container
   * @param {Object} problem - e.g., { operandA: 7, operandB: 8, operator: '×', answer: 56, standard: '3.OA.B.5' }
   * @param {Object} options - { mode: 'interactive' | 'demonstration', defaultStrategy: 'distributive_split' }
   */
  mount(container, problem, options = {}) {
    this.destroy(); // Detach any existing listeners
    this.container = container;
    this.problem = problem || {};
    this.options = options;
    this.phase = "INSPECT";
    this.startTime = Date.now();
    this.firstKeypressTime = 0;
    this.attempts = 0;

    // Detect strategy
    this.strategy = this.resolveStrategy(problem, options.defaultStrategy);

    // Initial state settings
    const a = Number(problem.operandA ?? 7);
    const b = Number(problem.operandB ?? 8);
    this.splitValue = this.strategy.defaultSplit ? this.strategy.defaultSplit(a, b) : Math.floor(a / 2) || 1;
    this.bridgedCount = 0;

    this.render();
    this.attachEventListeners();
  }

  resolveStrategy(problem, requestedStrategy) {
    if (requestedStrategy && CRA_STRATEGY_REGISTRY[requestedStrategy]) {
      return CRA_STRATEGY_REGISTRY[requestedStrategy];
    }

    const op = problem.operator || "×";
    const a = Number(problem.operandA ?? 0);
    const b = Number(problem.operandB ?? 0);

    if (op === "×" || op === "*") {
      if (a === 4 || b === 4) return CRA_STRATEGY_REGISTRY.doubles_halves;
      return CRA_STRATEGY_REGISTRY.distributive_split;
    }
    if (op === "+" || op === "add") {
      if (Math.abs(a - b) === 1) return CRA_STRATEGY_REGISTRY.doubles_plus_one;
      if (a >= 7 && b >= 2 && a + b > 10) return CRA_STRATEGY_REGISTRY.make_ten;
      return CRA_STRATEGY_REGISTRY.benchmark_jump;
    }
    if (op === "−" || op === "-" || op === "sub") {
      return CRA_STRATEGY_REGISTRY.benchmark_back_jump;
    }
    if (op === "÷" || op === "/" || op === "div") {
      return CRA_STRATEGY_REGISTRY.partition_quotient;
    }
    if (String(problem.kind) === "fraction" || String(problem.question).includes("/")) {
      return CRA_STRATEGY_REGISTRY.fraction_cut;
    }
    if (a < 0 || b < 0) {
      return CRA_STRATEGY_REGISTRY.zero_pairs;
    }

    return CRA_STRATEGY_REGISTRY.distributive_split;
  }

  setPhase(newPhase) {
    this.phase = newPhase;
    this.render();
    if (this.onStepComplete) {
      this.onStepComplete({ phase: this.phase, split: this.splitValue, bridged: this.bridgedCount });
    }
    if (this.phase === "TRANSFER" && this.onTransferReady) {
      this.onTransferReady(this.problem.answer);
    }
  }

  revealNextScaffoldStep() {
    const transitions = {
      INSPECT: "PARTITION",
      PARTITION: "RECOMBINE",
      RECOMBINE: "TRANSFER",
      TRANSFER: "TRANSFER",
    };
    this.setPhase(transitions[this.phase] || "PARTITION");
  }

  setPartition(val) {
    const a = Number(this.problem.operandA || 7);
    this.splitValue = Math.max(1, Math.min(a - 1, val));
    this.render();
  }

  bridgeCounter() {
    const a = Number(this.problem.operandA || 8);
    const needed = Math.max(0, 10 - a);
    if (this.bridgedCount < needed) {
      this.bridgedCount += 1;
      this.render();
      if (this.bridgedCount >= needed && this.phase === "PARTITION") {
        this.revealNextScaffoldStep();
      }
    }
  }

  render() {
    if (!this.container) return;

    const { problem, strategy, phase, locale } = this;
    const a = Number(problem.operandA ?? 7);
    const b = Number(problem.operandB ?? 8);
    const isEs = locale === "es";

    const title = isEs ? strategy.titleEs : strategy.titleEn;
    const wida = isEs ? strategy.widaEs : strategy.widaEn;

    // Render SVG Model based on strategy
    let modelSvgHtml = "";
    if (strategy.domain === "multiplication") {
      modelSvgHtml = makeAreaModelSVG({
        factorA: a,
        factorB: b,
        split: this.splitValue,
        phase,
        locale,
      });
    } else if (strategy.id === "make_ten") {
      modelSvgHtml = makeTenFrameSVG({
        numA: a,
        numB: b,
        bridgedCount: this.bridgedCount,
        phase,
        locale,
      });
    } else if (strategy.domain === "subtraction" || strategy.id === "benchmark_jump") {
      modelSvgHtml = makeNumberLineSVG({
        startVal: a,
        subtrahend: b,
        phase,
        locale,
      });
    } else if (strategy.domain === "division") {
      modelSvgHtml = makeDivisionPartitionSVG({
        dividend: a,
        divisor: b,
        split: this.splitValue * b,
        phase,
        locale,
      });
    } else if (strategy.domain === "fractions") {
      modelSvgHtml = makeFractionBarSVG({
        num: 1,
        denom: 2,
        targetDenom: 4,
        phase,
        locale,
      });
    } else if (strategy.domain === "integers") {
      modelSvgHtml = makeIntegerCountersSVG({
        numA: a,
        numB: b,
        pairsCancelled: this.bridgedCount,
        phase,
        locale,
      });
    }

    const phases = [
      { key: "INSPECT", label: isEs ? "1. Ver" : "1. Inspect" },
      { key: "PARTITION", label: isEs ? "2. Dividir" : "2. Partition" },
      { key: "RECOMBINE", label: isEs ? "3. Unir" : "3. Recombine" },
      { key: "TRANSFER", label: isEs ? "4. Recordar" : "4. Transfer" },
    ];

    const html = `
    <div class="cra-viewport phase-${phase.toLowerCase()}-active" role="region" aria-label="CRA Strategy Visualizer">
      <!-- Header -->
      <div class="cra-header">
        <div class="cra-title-group">
          <span class="cra-phase-badge phase-${phase.toLowerCase()}">${phase}</span>
          <h4 class="cra-strategy-title">${title}</h4>
          <span class="cra-wida-subheading">${wida}</span>
        </div>
        <div class="cra-stepper" role="tablist" aria-label="CRA Progression Steps">
          ${phases.map((p) => `
            <div class="cra-step-pill ${p.key === phase ? "active" : ""} ${phases.findIndex((x) => x.key === x) < phases.findIndex((x) => x.key === phase) ? "completed" : ""}" role="tab" aria-selected="${p.key === phase}">
              ${p.label}
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Interactive Canvas Stage -->
      <div class="cra-model-stage">
        ${modelSvgHtml}
      </div>

      <!-- Controls & Equation Bridge -->
      <div class="cra-equation-bridge">
        <div class="cra-equation-display" aria-live="polite">
          ${this.renderEquationBridge()}
        </div>
      </div>

      <div class="cra-controls-row">
        ${
          strategy.domain === "multiplication" && phase === "PARTITION"
            ? `
            <div class="cra-partition-slider-wrap">
              <label for="cra-split-range">${isEs ? "Punto de corte:" : "Split point:"} <strong>${this.splitValue} + ${a - this.splitValue}</strong></label>
              <input id="cra-split-range" class="cra-partition-slider" type="range" min="1" max="${a - 1}" value="${this.splitValue}" aria-label="Split point slider"/>
            </div>
          `
            : strategy.id === "make_ten" && phase === "PARTITION"
            ? `
            <button type="button" class="cra-btn cra-btn-primary" data-cra-btn="bridge-ten">
              <span>🔵 → 🟦</span> ${isEs ? "Mover ficha al 10" : "Move counter to make 10"}
            </button>
          `
            : "<div></div>"
        }

        <div style="display:flex; gap:0.5rem">
          ${
            phase !== "TRANSFER"
              ? `
              <button type="button" class="cra-btn cra-btn-primary" data-cra-btn="next-step">
                ${isEs ? "Siguiente paso →" : "Next step →"}
              </button>
            `
              : `
              <button type="button" class="cra-btn cra-btn-success" data-cra-btn="apply-answer">
                ★ ${isEs ? "¡Listo! Usar respuesta" : "Got it! Use answer"} (${problem.answer})
              </button>
            `
          }
        </div>
      </div>
    </div>
    `;

    this.container.innerHTML = html;
  }

  renderEquationBridge() {
    const { problem, strategy, splitValue, bridgedCount, phase, locale } = this;
    const a = Number(problem.operandA ?? 7);
    const b = Number(problem.operandB ?? 8);
    const isRecombine = phase === "RECOMBINE" || phase === "TRANSFER";

    if (strategy.domain === "multiplication") {
      const part1 = splitValue;
      const part2 = a - splitValue;
      const prod1 = part1 * b;
      const prod2 = part2 * b;
      const total = a * b;

      if (phase === "INSPECT") {
        return `<span>${a} × ${b} = ?</span>`;
      }
      return `
        <span>(${part1} × ${b}) + (${part2} × ${b})</span>
        <span>=</span>
        <span class="cra-chunk-a">${isRecombine ? prod1 : "?"}</span>
        <span>+</span>
        <span class="cra-chunk-b">${isRecombine ? prod2 : "?"}</span>
        <span>=</span>
        <span class="cra-chunk-total">${isRecombine ? total : "?"}</span>
      `;
    }

    if (strategy.id === "make_ten") {
      const currentA = a + bridgedCount;
      const currentB = b - bridgedCount;
      const total = a + b;
      return `
        <span>(${a} + ${bridgedCount}) + ${currentB}</span>
        <span>=</span>
        <span class="cra-chunk-a">10</span>
        <span>+</span>
        <span class="cra-chunk-b">${currentB}</span>
        <span>=</span>
        <span class="cra-chunk-total">${10 + currentB}</span>
      `;
    }

    if (strategy.domain === "subtraction") {
      const jump1 = a - 10 > 0 ? a - 10 : Math.floor(b / 2);
      const jump2 = b - jump1;
      const target = a - b;
      return `
        <span>${a} − ${jump1} = 10</span>
        <span>, luego 10 − ${jump2} = </span>
        <span class="cra-chunk-total">${isRecombine ? target : "?"}</span>
      `;
    }

    return `<span>${a} ${problem.operator || ""} ${b} = ${isRecombine ? problem.answer : "?"}</span>`;
  }

  attachEventListeners() {
    if (!this.container) return;
    this.container.addEventListener("click", this.boundClickHandler);
    this.container.addEventListener("keydown", this.boundKeyHandler);
    this.container.addEventListener("input", this.boundInputHandler);
  }

  handleClick(e) {
    const btn = e.target.closest("[data-cra-btn]");
    if (btn) {
      const action = btn.dataset.craBtn;
      if (action === "next-step") {
        this.revealNextScaffoldStep();
      } else if (action === "bridge-ten") {
        this.bridgeCounter();
      } else if (action === "apply-answer") {
        if (this.onTransferReady) {
          this.onTransferReady(this.problem.answer);
        }
      }
      return;
    }

    const token = e.target.closest(".cra-counter-token");
    if (token) {
      this.bridgeCounter();
    }
  }

  handleKeyDown(e) {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      if (this.strategy.domain === "multiplication") {
        this.setPartition(this.splitValue + 1);
        e.preventDefault();
      } else if (this.strategy.id === "make_ten") {
        this.bridgeCounter();
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      if (this.strategy.domain === "multiplication") {
        this.setPartition(this.splitValue - 1);
        e.preventDefault();
      }
    } else if (e.key === "Enter" || e.key === " ") {
      if (e.target.matches("[data-cra-action='split-handle']") || e.target.matches(".cra-counter-token")) {
        this.revealNextScaffoldStep();
        e.preventDefault();
      }
    }
  }

  handleInput(e) {
    if (e.target.matches("#cra-split-range")) {
      this.setPartition(Number(e.target.value));
    }
  }

  destroy() {
    if (this.container) {
      this.container.removeEventListener("click", this.boundClickHandler);
      this.container.removeEventListener("keydown", this.boundKeyHandler);
      this.container.removeEventListener("input", this.boundInputHandler);
      this.container.innerHTML = "";
    }
  }

  // Self-Test Harness for CI / Integration Tests
  static selfTest() {
    const results = { ok: true, checksRun: 0, errors: [] };
    const assert = (cond, msg) => {
      results.checksRun += 1;
      if (!cond) {
        results.ok = false;
        results.errors.push(msg);
      }
    };

    try {
      // 1. Verify SVG generation across all fact families
      const svgMult = makeAreaModelSVG({ factorA: 7, factorB: 8, split: 5 });
      assert(svgMult.includes("viewBox="), "makeAreaModelSVG must include viewBox attribute");
      assert(svgMult.includes("5 × 8"), "makeAreaModelSVG must display partitioned chunk");

      const svgTen = makeTenFrameSVG({ numA: 8, numB: 5, bridgedCount: 2 });
      assert(svgTen.includes("Ten-Frame"), "makeTenFrameSVG must render ten-frames");
      assert(svgTen.includes("10/10"), "makeTenFrameSVG must show completed 10 state");

      const svgLine = makeNumberLineSVG({ startVal: 14, subtrahend: 6 });
      assert(svgLine.includes("arrow-left"), "makeNumberLineSVG must render jump markers");
      assert(svgLine.includes("-4"), "makeNumberLineSVG must show -4 landmark jump");

      const svgFrac = makeFractionBarSVG({ num: 1, denom: 2, targetDenom: 4 });
      assert(svgFrac.includes("Equivalent Partition"), "makeFractionBarSVG must show equivalent partition");

      const svgDiv = makeDivisionPartitionSVG({ dividend: 56, divisor: 7, split: 35 });
      assert(svgDiv.includes("35 ÷ 7"), "makeDivisionPartitionSVG must show dividend split");

      const svgInt = makeIntegerCountersSVG({ numA: 5, numB: -3, pairsCancelled: 3 });
      assert(svgInt.includes("Zero pairs removed: 3"), "makeIntegerCountersSVG must show zero pairs cancelled");

      // 2. Test Engine Lifecycle with synthetic DOM
      if (typeof document !== "undefined") {
        const dummy = document.createElement("div");
        document.body.appendChild(dummy);

        const engine = new CRADecompositionEngine({ container: dummy, locale: "en" });
        engine.mount(dummy, { operandA: 7, operandB: 8, operator: "×", answer: 56 });
        assert(engine.phase === "INSPECT", "Engine must mount in INSPECT phase");

        engine.revealNextScaffoldStep();
        assert(engine.phase === "PARTITION", "Engine must advance to PARTITION phase");

        engine.setPartition(4);
        assert(engine.splitValue === 4, "Engine must update split value to 4");

        engine.revealNextScaffoldStep();
        assert(engine.phase === "RECOMBINE", "Engine must advance to RECOMBINE phase");

        engine.revealNextScaffoldStep();
        assert(engine.phase === "TRANSFER", "Engine must advance to TRANSFER phase");

        engine.destroy();
        assert(dummy.innerHTML === "", "destroy() must clean up DOM");
        dummy.remove();
      }
    } catch (err) {
      results.ok = false;
      results.errors.push(`Self-test exception: ${err.message}`);
    }

    return results;
  }
}

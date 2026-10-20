/**
 * Math Fluency Lab — Bilingual Math Vocabulary & Illustrated Concept System
 * Provides interactive word highlighting, bilingual English/Spanish definitions,
 * speech synthesis TTS, and responsive SVG diagrams across Grades 1–8.
 */

export const VOCAB_BILINGUAL_DB = {
  gcf: {
    id: "gcf",
    enTitle: "Greatest Common Factor (GCF)",
    esTitle: "Máximo Común Divisor (MCD)",
    enDef: "The largest whole number that divides evenly into two or more numbers.",
    esDef: "El número entero más grande que divide exactamente a dos o más números sin dejar residuo.",
    example: "Factors of 12: 1, 2, 3, 4, 6, 12. Factors of 18: 1, 2, 3, 6, 9, 18. The shared factors are 1, 2, 3, 6. The GCF is 6.",
    keywords: ["greatest common factor", "gcf", "máximo común divisor", "mcd"],
    svg: `<svg viewBox="0 0 340 140" style="background:#F0FDFA; border-radius:12px; border:1px solid #99F6E4; width:100%; max-width:340px; margin:0 auto; display:block;" role="img" aria-label="GCF Venn Diagram">
      <circle cx="120" cy="70" r="54" fill="rgba(14, 165, 233, 0.22)" stroke="#0284C7" stroke-width="2.5"/>
      <circle cx="220" cy="70" r="54" fill="rgba(16, 185, 129, 0.22)" stroke="#059669" stroke-width="2.5"/>
      <text x="90" y="55" font-size="11" font-weight="800" fill="#0369A1">Factors of 12</text>
      <text x="90" y="80" font-size="11" font-weight="700" fill="#0284C7">4, 12</text>
      <text x="250" y="55" font-size="11" font-weight="800" fill="#047857">Factors of 18</text>
      <text x="250" y="80" font-size="11" font-weight="700" fill="#059669">9, 18</text>
      <!-- Intersection -->
      <rect x="150" y="38" width="40" height="64" rx="8" fill="#FEF3C7" stroke="#D97706" stroke-width="1.5"/>
      <text x="170" y="56" text-anchor="middle" font-size="10" font-weight="700" fill="#B45309">1, 2, 3</text>
      <text x="170" y="78" text-anchor="middle" font-size="16" font-weight="900" fill="#B45309">★ 6</text>
      <text x="170" y="93" text-anchor="middle" font-size="9" font-weight="800" fill="#78350F">GCF</text>
    </svg>`
  },

  lcm: {
    id: "lcm",
    enTitle: "Least Common Multiple (LCM)",
    esTitle: "Mínimo Común Múltiplo (MCM)",
    enDef: "The smallest positive number that is a multiple of two or more numbers.",
    esDef: "El número positivo más pequeño (distinto de cero) que es múltiplo de dos o más números.",
    example: "Multiples of 4: 4, 8, 12, 16... Multiples of 6: 6, 12, 18... The first multiple they share is 12, so LCM = 12.",
    keywords: ["least common multiple", "lcm", "mínimo común múltiplo", "mcm"],
    svg: `<svg viewBox="0 0 340 130" style="background:#EFF6FF; border-radius:12px; border:1px solid #BFDBFE; width:100%; max-width:340px; margin:0 auto; display:block;" role="img" aria-label="LCM Number Strip">
      <text x="20" y="36" font-size="11" font-weight="800" fill="#1E40AF">4s:</text>
      <g transform="translate(50, 20)">
        <rect x="0" y="0" width="36" height="24" rx="4" fill="#DBEAFE" stroke="#3B82F6"/>
        <text x="18" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="#1E40AF">4</text>
        <rect x="42" y="0" width="36" height="24" rx="4" fill="#DBEAFE" stroke="#3B82F6"/>
        <text x="60" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="#1E40AF">8</text>
        <rect x="84" y="0" width="46" height="24" rx="4" fill="#FEF08A" stroke="#CA8A04" stroke-width="2"/>
        <text x="107" y="16" text-anchor="middle" font-size="12" font-weight="900" fill="#854D0E">★ 12</text>
        <rect x="136" y="0" width="36" height="24" rx="4" fill="#DBEAFE" stroke="#3B82F6"/>
        <text x="154" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="#1E40AF">16</text>
      </g>
      <text x="20" y="80" font-size="11" font-weight="800" fill="#047857">6s:</text>
      <g transform="translate(50, 64)">
        <rect x="0" y="0" width="36" height="24" rx="4" fill="#D1FAE5" stroke="#10B981"/>
        <text x="18" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="#065F46">6</text>
        <rect x="84" y="0" width="46" height="24" rx="4" fill="#FEF08A" stroke="#CA8A04" stroke-width="2"/>
        <text x="107" y="16" text-anchor="middle" font-size="12" font-weight="900" fill="#854D0E">★ 12</text>
        <rect x="136" y="0" width="36" height="24" rx="4" fill="#D1FAE5" stroke="#10B981"/>
        <text x="154" y="16" text-anchor="middle" font-size="11" font-weight="800" fill="#065F46">18</text>
      </g>
      <text x="170" y="116" text-anchor="middle" font-size="11" font-weight="900" fill="#854D0E">First shared number = LCM (12)</text>
    </svg>`
  },

  factor: {
    id: "factor",
    enTitle: "Factor",
    esTitle: "Factor",
    enDef: "A whole number that divides into another number with no remainder (or numbers multiplied together).",
    esDef: "Un número entero que divide exactamente a otro número sin dejar residuo (o números que se multiplican).",
    example: "The factors of 12 are 1, 2, 3, 4, 6, and 12, because 3 × 4 = 12 and 2 × 6 = 12.",
    keywords: ["factor", "factors", "factores"],
    svg: `<svg viewBox="0 0 320 120" style="background:#FFFBEB; border-radius:12px; border:1px solid #FDE68A; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Factor Array Grid">
      <g transform="translate(30, 25)">
        <rect x="0" y="0" width="22" height="22" rx="4" fill="#F59E0B"/><rect x="26" y="0" width="22" height="22" rx="4" fill="#F59E0B"/><rect x="52" y="0" width="22" height="22" rx="4" fill="#F59E0B"/><rect x="78" y="0" width="22" height="22" rx="4" fill="#F59E0B"/>
        <rect x="0" y="26" width="22" height="22" rx="4" fill="#F59E0B"/><rect x="26" y="26" width="22" height="22" rx="4" fill="#F59E0B"/><rect x="52" y="26" width="22" height="22" rx="4" fill="#F59E0B"/><rect x="78" y="26" width="22" height="22" rx="4" fill="#F59E0B"/>
        <rect x="0" y="52" width="22" height="22" rx="4" fill="#F59E0B"/><rect x="26" y="52" width="22" height="22" rx="4" fill="#F59E0B"/><rect x="52" y="52" width="22" height="22" rx="4" fill="#F59E0B"/><rect x="78" y="52" width="22" height="22" rx="4" fill="#F59E0B"/>
      </g>
      <text x="180" y="55" font-size="20" font-weight="900" fill="#B45309">3 × 4 = 12</text>
      <text x="180" y="80" font-size="11" font-weight="800" fill="#92400E">3 and 4 are factors of 12</text>
    </svg>`
  },

  multiple: {
    id: "multiple",
    enTitle: "Multiple",
    esTitle: "Múltiplo",
    enDef: "The product of a number and any non-zero whole number (skip-counting by that number).",
    esDef: "El resultado de multiplicar un número por cualquier número entero (contar de ese número en ese número).",
    example: "Multiples of 5: 5, 10, 15, 20, 25, 30... (5 × 1, 5 × 2, 5 × 3...).",
    keywords: ["multiple", "multiples", "múltiplo", "múltiplos"],
    svg: `<svg viewBox="0 0 320 110" style="background:#F0FDF4; border-radius:12px; border:1px solid #BBF7D0; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Multiple Hop Line">
      <line x1="20" y1="65" x2="300" y2="65" stroke="#16A34A" stroke-width="3"/>
      <circle cx="40" cy="65" r="14" fill="#15803D"/><text x="40" y="70" text-anchor="middle" font-size="10" font-weight="900" fill="#FFF">5</text>
      <path d="M 40,50 Q 80,15 120,50" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-dasharray="3"/>
      <circle cx="120" cy="65" r="14" fill="#15803D"/><text x="120" y="70" text-anchor="middle" font-size="10" font-weight="900" fill="#FFF">10</text>
      <path d="M 120,50 Q 160,15 200,50" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-dasharray="3"/>
      <circle cx="200" cy="65" r="14" fill="#15803D"/><text x="200" y="70" text-anchor="middle" font-size="10" font-weight="900" fill="#FFF">15</text>
      <path d="M 200,50 Q 240,15 280,50" fill="none" stroke="#22C55E" stroke-width="2.5" stroke-dasharray="3"/>
      <circle cx="280" cy="65" r="14" fill="#15803D"/><text x="280" y="70" text-anchor="middle" font-size="10" font-weight="900" fill="#FFF">20</text>
      <text x="160" y="100" text-anchor="middle" font-size="11" font-weight="800" fill="#166534">Skip-count by 5s ➜ Multiples</text>
    </svg>`
  },

  prime: {
    id: "prime",
    enTitle: "Prime Number",
    esTitle: "Número Primo",
    enDef: "A whole number greater than 1 that has exactly two factors: 1 and itself.",
    esDef: "Un número entero mayor que 1 que tiene exactamente dos factores: el 1 y él mismo.",
    example: "7 is prime because only 1 × 7 = 7. 2, 3, 5, 7, 11, 13, 17, 19 are prime numbers.",
    keywords: ["prime number", "prime numbers", "prime", "número primo", "números primos"],
    svg: `<svg viewBox="0 0 320 110" style="background:#FAF5FF; border-radius:12px; border:1px solid #E9D5FF; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Prime Number Model">
      <g transform="translate(35, 30)">
        <circle cx="10" cy="15" r="10" fill="#9333EA"/><circle cx="36" cy="15" r="10" fill="#9333EA"/><circle cx="62" cy="15" r="10" fill="#9333EA"/>
        <circle cx="88" cy="15" r="10" fill="#9333EA"/><circle cx="114" cy="15" r="10" fill="#9333EA"/><circle cx="140" cy="15" r="10" fill="#9333EA"/><circle cx="166" cy="15" r="10" fill="#9333EA"/>
      </g>
      <text x="245" y="45" font-size="22" font-weight="900" fill="#7E22CE">7</text>
      <text x="245" y="65" font-size="11" font-weight="700" fill="#6B21A8">Only 1 × 7</text>
      <text x="160" y="95" text-anchor="middle" font-size="11" font-weight="800" fill="#6B21A8">Cannot be split into equal rows or grid</text>
    </svg>`
  },

  composite: {
    id: "composite",
    enTitle: "Composite Number",
    esTitle: "Número Compuesto",
    enDef: "A whole number greater than 1 that has more than two factors.",
    esDef: "Un número entero mayor que 1 que tiene más de dos factores (se puede formar como rectángulo).",
    example: "8 is composite because its factors are 1, 2, 4, and 8 (8 = 1 × 8 and 8 = 2 × 4).",
    keywords: ["composite number", "composite numbers", "composite", "número compuesto", "números compuestos"],
    svg: `<svg viewBox="0 0 320 110" style="background:#F0F9FF; border-radius:12px; border:1px solid #BAE6FD; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Composite Array">
      <g transform="translate(40, 20)">
        <rect x="0" y="0" width="22" height="22" rx="4" fill="#0284C7"/><rect x="26" y="0" width="22" height="22" rx="4" fill="#0284C7"/><rect x="52" y="0" width="22" height="22" rx="4" fill="#0284C7"/><rect x="78" y="0" width="22" height="22" rx="4" fill="#0284C7"/>
        <rect x="0" y="26" width="22" height="22" rx="4" fill="#0284C7"/><rect x="26" y="26" width="22" height="22" rx="4" fill="#0284C7"/><rect x="52" y="26" width="22" height="22" rx="4" fill="#0284C7"/><rect x="78" y="26" width="22" height="22" rx="4" fill="#0284C7"/>
      </g>
      <text x="180" y="45" font-size="20" font-weight="900" fill="#0369A1">8 = 2 × 4</text>
      <text x="180" y="68" font-size="11" font-weight="700" fill="#0284C7">Factors: 1, 2, 4, 8</text>
      <text x="160" y="98" text-anchor="middle" font-size="11" font-weight="800" fill="#0369A1">Forms a clean rectangular array</text>
    </svg>`
  },

  dividend: {
    id: "dividend",
    enTitle: "Dividend",
    esTitle: "Dividendo",
    enDef: "The total number or quantity that is being divided or split up.",
    esDef: "La cantidad total o número que se va a repartir o dividir.",
    example: "In 36 ÷ 4 = 9, 36 is the dividend.",
    keywords: ["dividend", "dividendo"],
    svg: `<svg viewBox="0 0 320 110" style="background:#FFF1F2; border-radius:12px; border:1px solid #FECDD3; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Dividend in Division">
      <text x="80" y="65" font-size="28" font-weight="900" fill="#E11D48">36</text>
      <text x="130" y="65" font-size="26" font-weight="900" fill="#64748B">÷</text>
      <text x="165" y="65" font-size="26" font-weight="900" fill="#334155">4</text>
      <text x="200" y="65" font-size="26" font-weight="900" fill="#64748B">=</text>
      <text x="235" y="65" font-size="26" font-weight="900" fill="#334155">9</text>
      <path d="M 95,74 L 95,90" stroke="#E11D48" stroke-width="2"/>
      <text x="95" y="102" text-anchor="middle" font-size="12" font-weight="900" fill="#BE123C">▲ Dividend (Total)</text>
    </svg>`
  },

  divisor: {
    id: "divisor",
    enTitle: "Divisor",
    esTitle: "Divisor",
    enDef: "The number by which another number is divided (the number of groups or group size).",
    esDef: "El número por el cual se divide (la cantidad de grupos o el tamaño de cada parte).",
    example: "In 36 ÷ 4 = 9, 4 is the divisor.",
    keywords: ["divisor", "divisores"],
    svg: `<svg viewBox="0 0 320 110" style="background:#F0FDF4; border-radius:12px; border:1px solid #BBF7D0; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Divisor in Division">
      <text x="80" y="65" font-size="26" font-weight="900" fill="#334155">36</text>
      <text x="130" y="65" font-size="26" font-weight="900" fill="#64748B">÷</text>
      <text x="165" y="65" font-size="28" font-weight="900" fill="#16A34A">4</text>
      <text x="200" y="65" font-size="26" font-weight="900" fill="#64748B">=</text>
      <text x="235" y="65" font-size="26" font-weight="900" fill="#334155">9</text>
      <path d="M 175,74 L 175,90" stroke="#16A34A" stroke-width="2"/>
      <text x="175" y="102" text-anchor="middle" font-size="12" font-weight="900" fill="#15803D">▲ Divisor (Groups)</text>
    </svg>`
  },

  quotient: {
    id: "quotient",
    enTitle: "Quotient",
    esTitle: "Cociente",
    enDef: "The result or answer of a division problem.",
    esDef: "El resultado obtenido al realizar una operación de división.",
    example: "In 36 ÷ 4 = 9, 9 is the quotient.",
    keywords: ["quotient", "cociente"],
    svg: `<svg viewBox="0 0 320 110" style="background:#EFF6FF; border-radius:12px; border:1px solid #BFDBFE; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Quotient in Division">
      <text x="80" y="65" font-size="26" font-weight="900" fill="#334155">36</text>
      <text x="130" y="65" font-size="26" font-weight="900" fill="#64748B">÷</text>
      <text x="165" y="65" font-size="26" font-weight="900" fill="#334155">4</text>
      <text x="200" y="65" font-size="26" font-weight="900" fill="#64748B">=</text>
      <text x="245" y="65" font-size="28" font-weight="900" fill="#2563EB">9</text>
      <path d="M 252,74 L 252,90" stroke="#2563EB" stroke-width="2"/>
      <text x="252" y="102" text-anchor="middle" font-size="12" font-weight="900" fill="#1D4ED8">▲ Quotient (Answer)</text>
    </svg>`
  },

  remainder: {
    id: "remainder",
    enTitle: "Remainder",
    esTitle: "Residuo (Resto)",
    enDef: "The amount left over after division when numbers cannot be divided into equal whole parts.",
    esDef: "La cantidad que sobra después de dividir cuando no se puede repartir en partes enteras iguales.",
    example: "17 ÷ 5 = 3 with a remainder of 2 (3 groups of 5 makes 15, plus 2 left over).",
    keywords: ["remainder", "residuo", "resto"],
    svg: `<svg viewBox="0 0 320 115" style="background:#FEF3C7; border-radius:12px; border:1px solid #FDE68A; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Remainder Visual">
      <rect x="25" y="20" width="65" height="40" rx="8" fill="#FDE68A" stroke="#D97706"/>
      <text x="57" y="45" text-anchor="middle" font-size="12" font-weight="900" fill="#92400E">5 dots</text>
      <rect x="105" y="20" width="65" height="40" rx="8" fill="#FDE68A" stroke="#D97706"/>
      <text x="137" y="45" text-anchor="middle" font-size="12" font-weight="900" fill="#92400E">5 dots</text>
      <rect x="185" y="20" width="65" height="40" rx="8" fill="#FDE68A" stroke="#D97706"/>
      <text x="217" y="45" text-anchor="middle" font-size="12" font-weight="900" fill="#92400E">5 dots</text>
      <!-- Remainder -->
      <circle cx="275" cy="30" r="7" fill="#DC2626"/>
      <circle cx="295" cy="30" r="7" fill="#DC2626"/>
      <text x="285" y="55" text-anchor="middle" font-size="10" font-weight="900" fill="#B91C1C">R 2</text>
      <text x="160" y="95" text-anchor="middle" font-size="11" font-weight="800" fill="#78350F">17 ÷ 5 = 3 R 2</text>
    </svg>`
  },

  divide: {
    id: "divide",
    enTitle: "Divide (Division)",
    esTitle: "Dividir (División)",
    enDef: "To split a number or quantity into equal parts or groups.",
    esDef: "Repartir o separar una cantidad en partes o grupos de igual tamaño.",
    example: "12 ÷ 3 means sharing 12 items equally among 3 groups; each group gets 4.",
    keywords: ["divide", "division", "dividing", "división", "dividir"],
    svg: `<svg viewBox="0 0 320 110" style="background:#FAF5FF; border-radius:12px; border:1px solid #E9D5FF; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Divide Equal Groups">
      <circle cx="50" cy="45" r="22" fill="#9333EA"/><circle cx="120" cy="45" r="22" fill="#9333EA"/><circle cx="190" cy="45" r="22" fill="#9333EA"/>
      <text x="50" y="52" text-anchor="middle" fill="#FFF" font-weight="900" font-size="16">4</text>
      <text x="120" y="52" text-anchor="middle" fill="#FFF" font-weight="900" font-size="16">4</text>
      <text x="190" y="52" text-anchor="middle" fill="#FFF" font-weight="900" font-size="16">4</text>
      <text x="260" y="52" text-anchor="middle" fill="#7E22CE" font-weight="900" font-size="15">12 ÷ 3 = 4</text>
      <text x="160" y="95" text-anchor="middle" fill="#6B21A8" font-weight="800" font-size="11">Split into 3 equal groups</text>
    </svg>`
  },

  variable: {
    id: "variable",
    enTitle: "Variable",
    esTitle: "Variable",
    enDef: "A letter or symbol representing an unknown quantity or a value that can change.",
    esDef: "Una letra o símbolo que representa un valor desconocido o una cantidad que puede cambiar.",
    example: "In x + 5 = 12, x is the variable (x = 7).",
    keywords: ["variable", "variables"],
    svg: `<svg viewBox="0 0 320 110" style="background:#EFF6FF; border-radius:12px; border:1px solid #BFDBFE; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Variable Mystery Box">
      <rect x="40" y="25" width="50" height="50" rx="10" fill="#2563EB" stroke="#1D4ED8" stroke-width="2"/>
      <text x="65" y="58" text-anchor="middle" fill="#FFF" font-weight="900" font-size="26">x</text>
      <text x="110" y="58" text-anchor="middle" fill="#1E40AF" font-weight="900" font-size="24">+</text>
      <rect x="135" y="30" width="40" height="40" rx="8" fill="#DBEAFE" stroke="#3B82F6"/>
      <text x="155" y="56" text-anchor="middle" fill="#1E40AF" font-weight="900" font-size="20">5</text>
      <text x="200" y="58" text-anchor="middle" fill="#1E40AF" font-weight="900" font-size="24">=</text>
      <rect x="225" y="25" width="50" height="50" rx="10" fill="#10B981" stroke="#059669"/>
      <text x="250" y="58" text-anchor="middle" fill="#FFF" font-weight="900" font-size="22">12</text>
      <text x="160" y="98" text-anchor="middle" fill="#1E3A8A" font-weight="800" font-size="11">The letter x stands for the mystery number (7)</text>
    </svg>`
  },

  equation: {
    id: "equation",
    enTitle: "Equation",
    esTitle: "Ecuación",
    enDef: "A mathematical statement with an equal sign (=) showing that two expressions have equal value.",
    esDef: "Una igualdad matemática con signo igual (=) que indica que dos expresiones valen lo mismo.",
    example: "3x + 4 = 19 is an equation (both sides balance).",
    keywords: ["equation", "equations", "ecuación", "ecuaciones"],
    svg: `<svg viewBox="0 0 320 115" style="background:#F8FAFC; border-radius:12px; border:1px solid #CBD5E1; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Equation Balance Scale">
      <line x1="60" y1="50" x2="260" y2="50" stroke="#0F172A" stroke-width="4"/>
      <polygon points="160,50 148,85 172,85" fill="#475569"/>
      <rect x="40" y="20" width="70" height="30" rx="6" fill="#DBEAFE" stroke="#2563EB" stroke-width="2"/>
      <text x="75" y="41" text-anchor="middle" font-size="12" font-weight="900" fill="#1E40AF">3x + 4</text>
      <rect x="210" y="20" width="70" height="30" rx="6" fill="#DCFCE7" stroke="#16A34A" stroke-width="2"/>
      <text x="245" y="41" text-anchor="middle" font-size="14" font-weight="900" fill="#15803D">19</text>
      <text x="160" y="38" text-anchor="middle" font-size="20" font-weight="900" fill="#0F172A">=</text>
      <text x="160" y="105" text-anchor="middle" font-size="11" font-weight="800" fill="#334155">Left side has the exact same value as right side</text>
    </svg>`
  },

  expression: {
    id: "expression",
    enTitle: "Expression",
    esTitle: "Expresión",
    enDef: "A mathematical phrase that contains numbers, operations, and variables, but NO equal sign.",
    esDef: "Una combinación de números, variables y operaciones (+, −, ×, ÷), SIN signo de igualdad.",
    example: "4x + 7 is an algebraic expression (there is no = sign).",
    keywords: ["expression", "expressions", "expresión", "expresiones"],
    svg: `<svg viewBox="0 0 320 110" style="background:#FFF7ED; border-radius:12px; border:1px solid #FFEDD5; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Expression Card">
      <rect x="60" y="22" width="200" height="46" rx="10" fill="#FFEDD5" stroke="#EA580C" stroke-width="2.5"/>
      <text x="160" y="53" text-anchor="middle" font-size="24" font-weight="900" fill="#C2410C">4x + 7</text>
      <text x="160" y="92" text-anchor="middle" font-size="11" font-weight="800" fill="#9A3412">No equal sign (=) ➜ Mathematical phrase</text>
    </svg>`
  },

  integer: {
    id: "integer",
    enTitle: "Integer",
    esTitle: "Entero (Número entero)",
    enDef: "All positive whole numbers, negative whole numbers, and zero (no fractions or decimals).",
    esDef: "Los números positivos, los números negativos y el cero (sin decimales ni fracciones).",
    example: "... -3, -2, -1, 0, 1, 2, 3 ... are all integers.",
    keywords: ["integer", "integers", "entero", "enteros", "número entero"],
    svg: `<svg viewBox="0 0 340 110" style="background:#F8FAFC; border-radius:12px; border:1px solid #CBD5E1; width:100%; max-width:340px; margin:0 auto; display:block;" role="img" aria-label="Integer Number Line">
      <line x1="20" y1="50" x2="320" y2="50" stroke="#0F172A" stroke-width="3"/>
      <!-- Ticks -->
      <line x1="40" y1="42" x2="40" y2="58" stroke="#0F172A" stroke-width="2"/>
      <text x="40" y="74" text-anchor="middle" font-size="11" font-weight="800" fill="#DC2626">-3</text>
      <line x1="85" y1="42" x2="85" y2="58" stroke="#0F172A" stroke-width="2"/>
      <text x="85" y="74" text-anchor="middle" font-size="11" font-weight="800" fill="#DC2626">-2</text>
      <line x1="130" y1="42" x2="130" y2="58" stroke="#0F172A" stroke-width="2"/>
      <text x="130" y="74" text-anchor="middle" font-size="11" font-weight="800" fill="#DC2626">-1</text>
      <!-- Zero -->
      <circle cx="170" cy="50" r="5" fill="#2563EB"/>
      <text x="170" y="76" text-anchor="middle" font-size="13" font-weight="900" fill="#2563EB">0</text>
      <!-- Positive -->
      <line x1="210" y1="42" x2="210" y2="58" stroke="#0F172A" stroke-width="2"/>
      <text x="210" y="74" text-anchor="middle" font-size="11" font-weight="800" fill="#16A34A">+1</text>
      <line x1="255" y1="42" x2="255" y2="58" stroke="#0F172A" stroke-width="2"/>
      <text x="255" y="74" text-anchor="middle" font-size="11" font-weight="800" fill="#16A34A">+2</text>
      <line x1="300" y1="42" x2="300" y2="58" stroke="#0F172A" stroke-width="2"/>
      <text x="300" y="74" text-anchor="middle" font-size="11" font-weight="800" fill="#16A34A">+3</text>
      <text x="170" y="98" text-anchor="middle" font-size="10" font-weight="800" fill="#475569">Negatives (Left) · Zero (Center) · Positives (Right)</text>
    </svg>`
  },

  "absolute value": {
    id: "absolute value",
    enTitle: "Absolute Value",
    esTitle: "Valor Absoluto",
    enDef: "The distance of a number from zero on a number line; always positive or zero (written |x|).",
    esDef: "La distancia de un número hasta el cero en la recta numérica; siempre positiva o cero (|x|).",
    example: "|-6| = 6 and |6| = 6 (both numbers are 6 steps away from zero).",
    keywords: ["absolute value", "valor absoluto"],
    svg: `<svg viewBox="0 0 340 120" style="background:#EFF6FF; border-radius:12px; border:1px solid #BFDBFE; width:100%; max-width:340px; margin:0 auto; display:block;" role="img" aria-label="Absolute Value Distance">
      <line x1="30" y1="65" x2="310" y2="65" stroke="#1E40AF" stroke-width="3"/>
      <circle cx="170" cy="65" r="5" fill="#1D4ED8"/>
      <text x="170" y="85" text-anchor="middle" font-size="12" font-weight="900" fill="#1D4ED8">0</text>
      <circle cx="70" cy="65" r="5" fill="#DC2626"/>
      <text x="70" y="85" text-anchor="middle" font-size="12" font-weight="900" fill="#DC2626">-5</text>
      <!-- Distance Arc -->
      <path d="M 70,55 Q 120,20 170,55" fill="none" stroke="#2563EB" stroke-width="2.5" stroke-dasharray="4"/>
      <text x="120" y="32" text-anchor="middle" font-size="12" font-weight="900" fill="#1D4ED8">Distance = 5</text>
      <text x="170" y="108" text-anchor="middle" font-size="11" font-weight="900" fill="#1E3A8A">|-5| = 5</text>
    </svg>`
  },

  opposite: {
    id: "opposite",
    enTitle: "Opposite Numbers",
    esTitle: "Números Opuestos",
    enDef: "Two numbers that are the same distance from zero on a number line, but in opposite directions.",
    esDef: "Dos números que están a la misma distancia de cero en la recta numérica, pero en lados contrarios.",
    example: "+5 and -5 are opposites; their sum is 0.",
    keywords: ["opposite", "opposites", "opposite numbers", "opuesto", "opuestos", "números opuestos"],
    svg: `<svg viewBox="0 0 320 110" style="background:#FAF5FF; border-radius:12px; border:1px solid #E9D5FF; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Opposite Numbers">
      <line x1="30" y1="55" x2="290" y2="55" stroke="#7E22CE" stroke-width="3"/>
      <circle cx="160" cy="55" r="5" fill="#7E22CE"/>
      <text x="160" y="75" text-anchor="middle" font-size="12" font-weight="900" fill="#7E22CE">0</text>
      <circle cx="60" cy="55" r="5" fill="#DC2626"/>
      <text x="60" y="75" text-anchor="middle" font-size="12" font-weight="900" fill="#DC2626">-4</text>
      <circle cx="260" cy="55" r="5" fill="#16A34A"/>
      <text x="260" y="75" text-anchor="middle" font-size="12" font-weight="900" fill="#16A34A">+4</text>
      <path d="M 60,45 Q 110,20 160,45" fill="none" stroke="#DC2626" stroke-width="2" stroke-dasharray="3"/>
      <path d="M 160,45 Q 210,20 260,45" fill="none" stroke="#16A34A" stroke-width="2" stroke-dasharray="3"/>
      <text x="160" y="98" text-anchor="middle" font-size="11" font-weight="800" fill="#6B21A8">Same distance from zero ➜ -4 and +4</text>
    </svg>`
  },

  "zero pair": {
    id: "zero pair",
    enTitle: "Zero Pair",
    esTitle: "Par Cero",
    enDef: "A pair of numbers whose sum is zero, such as a positive 1 (+1) and a negative 1 (-1).",
    esDef: "Un par de números cuya suma es cero, como una ficha positiva (+1) y una ficha negativa (-1).",
    example: "(+1) + (-1) = 0. They cancel each other out.",
    keywords: ["zero pair", "zero pairs", "par cero", "pares cero"],
    svg: `<svg viewBox="0 0 320 110" style="background:#FEF2F2; border-radius:12px; border:1px solid #FECACA; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Zero Pair Chips">
      <circle cx="95" cy="50" r="22" fill="#EAB308" stroke="#CA8A04" stroke-width="2"/>
      <text x="95" y="57" text-anchor="middle" font-size="20" font-weight="900" fill="#713F12">+</text>
      <circle cx="155" cy="50" r="22" fill="#EF4444" stroke="#DC2626" stroke-width="2"/>
      <text x="155" y="56" text-anchor="middle" font-size="22" font-weight="900" fill="#FFF">−</text>
      <text x="205" y="58" font-size="24" font-weight="900" fill="#0F172A">=</text>
      <text x="245" y="58" font-size="28" font-weight="900" fill="#059669">0</text>
      <text x="160" y="96" text-anchor="middle" font-size="11" font-weight="800" fill="#991B1B">(+1) and (-1) cancel out to zero</text>
    </svg>`
  },

  fraction: {
    id: "fraction",
    enTitle: "Fraction",
    esTitle: "Fracción",
    enDef: "A part of a whole or group, written as a numerator over a denominator.",
    esDef: "Una o varias partes iguales en que se divide un entero o unidad.",
    example: "3/4 represents 3 out of 4 equal parts of a whole.",
    keywords: ["fraction", "fractions", "fracción", "fracciones"],
    svg: `<svg viewBox="0 0 320 120" style="background:#F0F9FF; border-radius:12px; border:1px solid #BAE6FD; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Fraction Circle">
      <g transform="translate(60, 15)">
        <circle cx="45" cy="45" r="40" fill="#E2E8F0"/>
        <path d="M 45,45 L 45,5 A 40,40 0 0,1 85,45 Z" fill="#0284C7"/>
        <path d="M 45,45 L 85,45 A 40,40 0 0,1 45,85 Z" fill="#0284C7"/>
        <path d="M 45,45 L 45,85 A 40,40 0 0,1 5,45 Z" fill="#0284C7"/>
        <line x1="5" y1="45" x2="85" y2="45" stroke="#FFF" stroke-width="2"/>
        <line x1="45" y1="5" x2="45" y2="85" stroke="#FFF" stroke-width="2"/>
      </g>
      <text x="210" y="50" font-size="24" font-weight="900" fill="#0284C7">¾</text>
      <text x="210" y="75" font-size="11" font-weight="800" fill="#0369A1">3 shaded of 4 parts</text>
    </svg>`
  },

  numerator: {
    id: "numerator",
    enTitle: "Numerator",
    esTitle: "Numerador",
    enDef: "The top number of a fraction that shows how many equal parts you have.",
    esDef: "El número superior de una fracción que indica cuántas partes iguales se tienen o se toman.",
    example: "In 3/5, 3 is the numerator.",
    keywords: ["numerator", "numerador"],
    svg: `<svg viewBox="0 0 320 110" style="background:#EFF6FF; border-radius:12px; border:1px solid #BFDBFE; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Numerator Diagram">
      <text x="90" y="45" font-size="32" font-weight="900" fill="#2563EB">3</text>
      <line x1="75" y1="54" x2="115" y2="54" stroke="#0F172A" stroke-width="3"/>
      <text x="90" y="88" font-size="30" font-weight="900" fill="#64748B">5</text>
      <path d="M 125,40 L 150,40" stroke="#2563EB" stroke-width="2.5"/>
      <text x="160" y="44" font-size="13" font-weight="900" fill="#1D4ED8">Numerator (Parts you have)</text>
    </svg>`
  },

  denominator: {
    id: "denominator",
    enTitle: "Denominator",
    esTitle: "Denominador",
    enDef: "The bottom number of a fraction that shows total equal parts in the whole.",
    esDef: "El número inferior de una fracción que indica en cuántas partes iguales se divide el entero.",
    example: "In 3/5, 5 is the denominator.",
    keywords: ["denominator", "denominador"],
    svg: `<svg viewBox="0 0 320 110" style="background:#F0FDF4; border-radius:12px; border:1px solid #BBF7D0; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Denominator Diagram">
      <text x="90" y="45" font-size="30" font-weight="900" fill="#64748B">3</text>
      <line x1="75" y1="54" x2="115" y2="54" stroke="#0F172A" stroke-width="3"/>
      <text x="90" y="88" font-size="32" font-weight="900" fill="#16A34A">5</text>
      <path d="M 125,82 L 150,82" stroke="#16A34A" stroke-width="2.5"/>
      <text x="160" y="86" font-size="13" font-weight="900" fill="#15803D">Denominator (Total equal parts)</text>
    </svg>`
  },

  reciprocal: {
    id: "reciprocal",
    enTitle: "Reciprocal",
    esTitle: "Recíproco (Fracción invertida)",
    enDef: "The flipped fraction where numerator and denominator switch places; multiplying them gives 1.",
    esDef: "La fracción invertida donde el numerador y denominador se intercambian; su producto es 1.",
    example: "The reciprocal of 2/3 is 3/2 (2/3 × 3/2 = 6/6 = 1).",
    keywords: ["reciprocal", "reciprocals", "recíproco", "recíprocos"],
    svg: `<svg viewBox="0 0 320 110" style="background:#FAF5FF; border-radius:12px; border:1px solid #E9D5FF; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Reciprocal Flip">
      <rect x="50" y="25" width="60" height="55" rx="8" fill="#F3E8FF" stroke="#9333EA" stroke-width="2"/>
      <text x="80" y="60" text-anchor="middle" font-size="22" font-weight="900" fill="#7E22CE">⅔</text>
      <text x="155" y="58" text-anchor="middle" font-size="24" font-weight="900" fill="#9333EA">⇄</text>
      <rect x="195" y="25" width="60" height="55" rx="8" fill="#F3E8FF" stroke="#9333EA" stroke-width="2"/>
      <text x="225" y="60" text-anchor="middle" font-size="22" font-weight="900" fill="#7E22CE">³⁄₂</text>
      <text x="160" y="98" text-anchor="middle" font-size="11" font-weight="800" fill="#6B21A8">Flip top &amp; bottom ➜ ⅔ × ³⁄₂ = 1</text>
    </svg>`
  },

  ratio: {
    id: "ratio",
    enTitle: "Ratio",
    esTitle: "Razón",
    enDef: "A comparison of two quantities by division (written a : b or a to b).",
    esDef: "Una comparación entre dos cantidades mediante división (escrita a:b o a sobre b).",
    example: "If there are 3 blue marbles and 2 red marbles, the ratio of blue to red is 3:2.",
    keywords: ["ratio", "ratios", "razón", "razones"],
    svg: `<svg viewBox="0 0 320 110" style="background:#FFFBEB; border-radius:12px; border:1px solid #FDE68A; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Ratio Bar Visual">
      <g transform="translate(50, 25)">
        <rect x="0" y="0" width="30" height="30" rx="6" fill="#0284C7"/><rect x="36" y="0" width="30" height="30" rx="6" fill="#0284C7"/><rect x="72" y="0" width="30" height="30" rx="6" fill="#0284C7"/>
        <text x="120" y="22" font-size="24" font-weight="900" fill="#78350F">:</text>
        <rect x="140" y="0" width="30" height="30" rx="6" fill="#EA580C"/><rect x="176" y="0" width="30" height="30" rx="6" fill="#EA580C"/>
      </g>
      <text x="160" y="85" text-anchor="middle" font-size="15" font-weight="900" fill="#92400E">3 to 2 (3:2)</text>
    </svg>`
  },

  "unit rate": {
    id: "unit rate",
    enTitle: "Unit Rate",
    esTitle: "Tasa Unitaria",
    enDef: "A rate that compares a quantity to exactly one unit of another quantity.",
    esDef: "Una razón que compara una cantidad con exactamente una unidad de otra (ej. millas por hora).",
    example: "$12 for 3 notebooks = $4 per 1 notebook (the unit rate is $4/notebook).",
    keywords: ["unit rate", "unit rates", "tasa unitaria", "tasas unitarias"],
    svg: `<svg viewBox="0 0 320 110" style="background:#F0FDFA; border-radius:12px; border:1px solid #99F6E4; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Unit Rate Diagram">
      <rect x="40" y="25" width="90" height="42" rx="8" fill="#CCFBF1" stroke="#0D9488"/>
      <text x="85" y="52" text-anchor="middle" font-size="12" font-weight="900" fill="#0F766E">$12 / 3 books</text>
      <text x="155" y="52" font-size="20" font-weight="900" fill="#0D9488">➔</text>
      <rect x="180" y="25" width="100" height="42" rx="8" fill="#FEF08A" stroke="#CA8A04" stroke-width="2"/>
      <text x="230" y="52" text-anchor="middle" font-size="13" font-weight="900" fill="#854D0E">★ $4 per 1 book</text>
      <text x="160" y="94" text-anchor="middle" font-size="11" font-weight="800" fill="#115E59">Divide by 3 to find the rate for 1 unit</text>
    </svg>`
  },

  percent: {
    id: "percent",
    enTitle: "Percent",
    esTitle: "Porcentaje",
    enDef: "A ratio comparing a number out of 100, written with the % symbol.",
    esDef: "Una razón que compara una cantidad sobre 100, escrita con el símbolo %.",
    example: "25% means 25 out of 100, which simplifies to 1/4 or 0.25.",
    keywords: ["percent", "percentage", "porcentaje"],
    svg: `<svg viewBox="0 0 320 110" style="background:#FEF2F2; border-radius:12px; border:1px solid #FCA5A5; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Percent 100 Grid">
      <rect x="60" y="25" width="80" height="50" rx="8" fill="#EF4444"/>
      <text x="100" y="57" text-anchor="middle" font-size="22" font-weight="900" fill="#FFF">75%</text>
      <text x="160" y="57" font-size="22" font-weight="900" fill="#B91C1C">=</text>
      <text x="210" y="57" font-size="20" font-weight="900" fill="#991B1B">75 / 100</text>
      <text x="160" y="95" text-anchor="middle" font-size="11" font-weight="800" fill="#7F1D1D">Parts per hundred (per-cent)</text>
    </svg>`
  },

  exponent: {
    id: "exponent",
    enTitle: "Exponent (Power)",
    esTitle: "Exponente (Potencia)",
    enDef: "A small number placed to the upper right of a base showing how many times to multiply the base by itself.",
    esDef: "El número que indica cuántas veces se debe multiplicar la base por sí misma.",
    example: "In 2⁴, 4 is the exponent (2 × 2 × 2 × 2 = 16).",
    keywords: ["exponent", "exponents", "power", "exponente", "exponentes", "potencia"],
    svg: `<svg viewBox="0 0 320 115" style="background:#EFF6FF; border-radius:12px; border:1px solid #BFDBFE; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Exponent Power Model">
      <text x="100" y="65" font-size="44" font-weight="900" fill="#1E40AF">2</text>
      <text x="130" y="40" font-size="26" font-weight="900" fill="#DC2626">3</text>
      <text x="165" y="60" font-size="20" font-weight="900" fill="#1E40AF">=</text>
      <text x="220" y="60" text-anchor="middle" font-size="15" font-weight="900" fill="#1D4ED8">2 × 2 × 2 = 8</text>
      <path d="M 138,20 L 155,10" stroke="#DC2626" stroke-width="1.5"/>
      <text x="195" y="14" font-size="10" font-weight="800" fill="#B91C1C">Exponent (3 times)</text>
      <text x="160" y="98" text-anchor="middle" font-size="11" font-weight="800" fill="#1E3A8A">Multiply base 2 by itself 3 times</text>
    </svg>`
  },

  area: {
    id: "area",
    enTitle: "Area",
    esTitle: "Área",
    enDef: "The total number of square units needed to cover the flat surface of a 2D shape.",
    esDef: "La medida de la superficie plana dentro de una figura, medida en unidades cuadradas.",
    example: "A rectangle with length 6 and width 4 has an area of 6 × 4 = 24 square units.",
    keywords: ["area", "área"],
    svg: `<svg viewBox="0 0 320 110" style="background:#F0FDFA; border-radius:12px; border:1px solid #99F6E4; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Area Grid">
      <rect x="50" y="20" width="120" height="60" rx="4" fill="rgba(13, 148, 136, 0.2)" stroke="#0D9488" stroke-width="2.5"/>
      <text x="110" y="55" text-anchor="middle" font-size="13" font-weight="900" fill="#0F766E">Area = b × h</text>
      <text x="210" y="45" font-size="14" font-weight="900" fill="#0D9488">6 × 4 = 24</text>
      <text x="210" y="68" font-size="11" font-weight="800" fill="#047857">sq units</text>
      <text x="160" y="98" text-anchor="middle" font-size="10" font-weight="800" fill="#115E59">Number of unit squares inside</text>
    </svg>`
  },

  perimeter: {
    id: "perimeter",
    enTitle: "Perimeter",
    esTitle: "Perímetro",
    enDef: "The total distance around the outside edge or boundary of a 2D shape.",
    esDef: "La distancia total alrededor del borde o contorno exterior de una figura plana.",
    example: "For a 5 by 3 rectangle: Perimeter = 5 + 3 + 5 + 3 = 16 units.",
    keywords: ["perimeter", "perímetro"],
    svg: `<svg viewBox="0 0 320 110" style="background:#F8FAFC; border-radius:12px; border:1px solid #CBD5E1; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Perimeter Boundary">
      <rect x="70" y="22" width="130" height="55" rx="4" fill="none" stroke="#2563EB" stroke-width="3" stroke-dasharray="6"/>
      <text x="135" y="16" text-anchor="middle" font-size="11" font-weight="900" fill="#1D4ED8">5</text>
      <text x="135" y="90" text-anchor="middle" font-size="11" font-weight="900" fill="#1D4ED8">5</text>
      <text x="56" y="54" font-size="11" font-weight="900" fill="#1D4ED8">3</text>
      <text x="208" y="54" font-size="11" font-weight="900" fill="#1D4ED8">3</text>
      <text x="260" y="55" text-anchor="middle" font-size="13" font-weight="900" fill="#0F172A">P = 16</text>
    </svg>`
  },

  volume: {
    id: "volume",
    enTitle: "Volume",
    esTitle: "Volumen",
    enDef: "The amount of 3-dimensional space inside a solid shape, measured in cubic units.",
    esDef: "La cantidad de espacio tridimensional que ocupa un cuerpo sólido, medido en unidades cúbicas.",
    example: "A box with length 4, width 3, height 2 has volume = 4 × 3 × 2 = 24 cubic units.",
    keywords: ["volume", "volumen"],
    svg: `<svg viewBox="0 0 320 115" style="background:#FAF5FF; border-radius:12px; border:1px solid #E9D5FF; width:100%; max-width:320px; margin:0 auto; display:block;" role="img" aria-label="Volume Prism">
      <polygon points="60,45 120,25 180,45 120,65" fill="#D8B4FE" stroke="#7E22CE"/>
      <polygon points="60,45 120,65 120,95 60,75" fill="#C084FC" stroke="#7E22CE"/>
      <polygon points="120,65 180,45 180,75 120,95" fill="#A855F7" stroke="#7E22CE"/>
      <text x="240" y="55" text-anchor="middle" font-size="13" font-weight="900" fill="#6B21A8">V = l × w × h</text>
      <text x="240" y="75" text-anchor="middle" font-size="11" font-weight="700" fill="#7E22CE">cubic units</text>
    </svg>`
  }
};

/**
 * Compiled sorted list of keywords for high-performance non-destructive replacement
 */
const SORTED_KEYWORDS = Object.values(VOCAB_BILINGUAL_DB)
  .flatMap((entry) => entry.keywords.map((kw) => ({ kw, id: entry.id })))
  .sort((a, b) => b.kw.length - a.kw.length);

const VOCAB_REGEX = new RegExp(
  `\\b(${SORTED_KEYWORDS.map((item) => item.kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "gi"
);

const KEYWORD_MAP = new Map(
  SORTED_KEYWORDS.map((item) => [item.kw.toLowerCase(), item.id])
);

/**
 * Highlights vocabulary terms in an HTML string safely by only replacing
 * within text nodes outside of existing HTML tags and attributes.
 */
export function highlightVocab(htmlString) {
  if (!htmlString || typeof htmlString !== "string") return htmlString;
  const tokens = htmlString.split(/(<[^>]+>)/g);
  return tokens
    .map((token) => {
      if (token.startsWith("<")) return token; // keep tags intact
      return token.replace(VOCAB_REGEX, (match) => {
        const id = KEYWORD_MAP.get(match.toLowerCase());
        if (!id) return match;
        return `<button type="button" class="vocab-word" data-vocab="${id}" aria-haspopup="dialog" title="Vocabulary: ${match}">${match}</button>`;
      });
    })
    .join("");
}

let activeSpeech = null;

function stopSpeech() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  activeSpeech = null;
}

/**
 * Opens the bilingual vocabulary modal for the given term key
 */
export function openVocabModal(termKey) {
  if (!termKey) return;
  const key = String(termKey).toLowerCase().trim();
  const data = VOCAB_BILINGUAL_DB[key] || Object.values(VOCAB_BILINGUAL_DB).find(
    (item) => item.keywords.some((kw) => kw.toLowerCase() === key)
  ) || {
    id: key,
    enTitle: key.charAt(0).toUpperCase() + key.slice(1),
    esTitle: key.charAt(0).toUpperCase() + key.slice(1),
    enDef: "A mathematical term used to represent relationships, quantities, or operations.",
    esDef: "Un término matemático utilizado para representar relaciones, cantidades u operaciones.",
    example: `Applying the concept of ${key} step-by-step in mathematical problem solving.`,
    svg: `<svg viewBox="0 0 320 100" style="background:#F0F9FF; border-radius:12px; border:1px solid #BAE6FD; width:100%; max-width:320px; margin:0 auto; display:block;"><rect x="40" y="25" width="240" height="50" rx="10" fill="#0284C7"/><text x="160" y="57" text-anchor="middle" fill="#FFF" font-weight="900" font-size="18">${key.toUpperCase()}</text></svg>`
  };

  const modal = document.querySelector("#fluency-vocab-modal");
  if (!modal) return;

  const titleEl = modal.querySelector("#vocab-modal-title");
  const esTitleEl = modal.querySelector("#vocab-modal-es-title");
  const enDefEl = modal.querySelector("#vocab-modal-en-def");
  const esDefEl = modal.querySelector("#vocab-modal-es-def");
  const exEl = modal.querySelector("#vocab-modal-example");
  const svgEl = modal.querySelector("#vocab-modal-svg");

  if (titleEl) titleEl.textContent = data.enTitle;
  if (esTitleEl) esTitleEl.textContent = data.esTitle;
  if (enDefEl) enDefEl.textContent = data.enDef;
  if (esDefEl) esDefEl.textContent = data.esDef;
  if (exEl) exEl.textContent = data.example;
  if (svgEl) svgEl.innerHTML = data.svg;

  // Audio Buttons
  const enTts = modal.querySelector("#vocab-tts-en");
  if (enTts) {
    enTts.onclick = () => {
      stopSpeech();
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(`${data.enTitle}. ${data.enDef} Example: ${data.example}`);
        u.lang = "en-US";
        u.rate = 0.92;
        window.speechSynthesis.speak(u);
      }
    };
  }

  const esTts = modal.querySelector("#vocab-tts-es");
  if (esTts) {
    esTts.onclick = () => {
      stopSpeech();
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(`${data.esTitle}. ${data.esDef}`);
        u.lang = "es-US";
        u.rate = 0.92;
        window.speechSynthesis.speak(u);
      }
    };
  }

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("vocab-modal-open");
  const card = modal.querySelector(".vocab-modal-card");
  if (card) card.scrollTop = 0;
  const focusTarget = modal.querySelector("#vocab-confirm-btn") || modal.querySelector("#vocab-modal-close");
  focusTarget?.focus({ preventScroll: true });
  if (card) card.scrollTop = 0;
}

/**
 * Closes the bilingual vocabulary modal
 */
export function closeVocabModal() {
  const modal = document.querySelector("#fluency-vocab-modal");
  if (modal) {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("vocab-modal-open");
    stopSpeech();
  }
}

/**
 * Attaches global click & keyboard listeners for vocabulary triggers
 */
export function initVocabSystem() {
  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest(".vocab-word");
    if (btn) {
      e.preventDefault();
      const term = btn.getAttribute("data-vocab");
      if (term) openVocabModal(term);
    }
  });

  const modal = document.querySelector("#fluency-vocab-modal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.closest("#vocab-modal-close") || e.target.closest("#vocab-confirm-btn")) {
        closeVocabModal();
      }
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeVocabModal();
    }
  });

  // Expose on window for any legacy or global onclick handlers
  window.openVocabModal = openVocabModal;
  window.closeVocabModal = closeVocabModal;
}

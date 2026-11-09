// Math Fluency Lab 2.0 — Signature Innovation Suite
// Implements the 5 Signature Innovations & Unified 2.0 Experience Layer:
// 1. Live Tri-Representation Morphing Bench (Concrete <-> Representational <-> Symbolic bidirectional link)
// 2. Socratic Micro-Turn Coach & Counterexample Generator (shows WHY a misconception fails physically)
// 3. Tactile Expression Decomposition ("Pinch-to-Split" & Drag-to-Combine tokens)
// 4. Tomorrow's 10-Minute Small-Group Table Kit Generator (auto-groups class + 1-click printable table script)
// 5. Embedded Reality Lab Micro-Portal (in-place simulation drawer without leaving the workspace)
// 6. Unified Focus Stream & Geological Layer Consolidator (collapses competing heroes/navs cleanly)

import { extractProblem, bareText } from "./problem-numbers.js";
import { analyzeResponse } from "./e8/misconception-engine.js";
import { getLang, t } from "./i18n.js";

const esc = (v) =>
  String(v ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const L = (en, es) => (getLang() === "es" ? es : en);

// ============================================================================
// SIGNATURE 1: LIVE TRI-REPRESENTATION MORPHING BENCH (Concrete · Model · Symbolic)
// ============================================================================
export function renderTriRepBench(item, state = {}) {
  const parsed = extractProblem(item);
  const raw = bareText(item) || "8 + 5";
  const splitVal = state.splitVal ?? null;

  // Determine operation & operands for linked 3-way view
  let a = 8, b = 5, op = "+";
  if (parsed?.kind === "binary") {
    a = Number(parsed.a) || 6;
    b = Number(parsed.b) || 4;
    op = parsed.op || "+";
  } else if (parsed?.kind === "fractions" && parsed.parts?.length >= 2) {
    return renderFractionTriRep(parsed, state);
  } else if (parsed?.kind === "equation") {
    return renderEquationTriRep(parsed, state);
  } else if (parsed?.kind === "ratio") {
    return renderRatioTriRep(parsed, state);
  }

  const absA = Math.min(24, Math.max(1, Math.round(Math.abs(a))));
  const absB = Math.min(24, Math.max(1, Math.round(Math.abs(b))));

  if (op === "*") {
    const split = splitVal !== null ? Math.min(absB - 1, Math.max(1, splitVal)) : Math.min(5, Math.max(1, Math.floor(absB / 2)));
    const rem = absB - split;
    const cell = 18;
    const w = absB * cell + 28;
    const h = absA * cell + 24;
    let rects = "";
    for (let r = 0; r < absA; r++) {
      for (let c = 0; c < absB; c++) {
        const isLeft = c < split;
        rects += `<rect x="${10 + (isLeft ? c * cell : c * cell + 8)}" y="${10 + r * cell}" width="${cell - 2}" height="${cell - 2}" rx="3" fill="${isLeft ? "#0d9488" : "#3b82f6"}" opacity="0.88"/>`;
      }
    }
    return `
      <section class="fl2-tri-bench" data-tri-bench="mul" data-a="${absA}" data-b="${absB}" aria-label="${esc(L("Linked Representations Bench", "Banco de representaciones conectadas"))}">
        <header class="fl2-tri-header">
          <div>
            <span class="fl2-eyebrow">${esc(L("LIVE LINKED REPRESENTATIONS", "REPRESENTACIONES CONECTADAS EN VIVO"))}</span>
            <h4>${esc(L("Slide the partition to watch Concrete, Area, and Symbolic expressions move together", "Desliza la partición para ver cómo se mueven juntas las vistas concreta, de área y simbólica"))}</h4>
          </div>
          <label class="fl2-slider-label">
            <span>${esc(L("Split factor", "Dividir factor"))} (${absB} → <strong data-tri-split-label>${split} + ${rem}</strong>)</span>
            <input type="range" min="1" max="${Math.max(1, absB - 1)}" value="${split}" data-tri-mul-slider aria-label="${esc(L("Partition factor", "Particionar factor"))}" />
          </label>
        </header>
        <div class="fl2-tri-grid">
          <div class="fl2-tri-pane">
            <span class="fl2-pane-tag">1 · ${esc(L("Concrete Array", "Arreglo concreto"))}</span>
            <svg viewBox="0 0 ${Math.max(160, w)} ${Math.max(90, h)}" class="fl2-tri-svg">${rects}</svg>
            <p class="fl2-pane-caption">${absA} ${esc(L("rows split into", "filas divididas en"))} ${split} ${esc(L("and", "y"))} ${rem}</p>
          </div>
          <div class="fl2-tri-pane">
            <span class="fl2-pane-tag">2 · ${esc(L("Area Decomposition", "Modelo de área"))}</span>
            <svg viewBox="0 0 220 96" class="fl2-tri-svg">
              <rect x="16" y="18" width="${Math.round((split / absB) * 168)}" height="54" rx="6" fill="#ccfbf1" stroke="#0d9488" stroke-width="2"/>
              <rect x="${22 + Math.round((split / absB) * 168)}" y="18" width="${Math.max(18, Math.round((rem / absB) * 168))}" height="54" rx="6" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
              <text x="${16 + Math.round((split / absB) * 84)}" y="49" text-anchor="middle" font-size="13" font-weight="800" fill="#115e59">${absA} × ${split}</text>
              <text x="${22 + Math.round((split / absB) * 168) + Math.round((rem / absB) * 84)}" y="49" text-anchor="middle" font-size="13" font-weight="800" fill="#1e40af">${absA} × ${rem}</text>
            </svg>
            <p class="fl2-pane-caption">${esc(L("Two friendly rectangles with the same height", "Dos rectángulos amigables con la misma altura"))} (${absA})</p>
          </div>
          <div class="fl2-tri-pane">
            <span class="fl2-pane-tag">3 · ${esc(L("Symbolic Expression", "Expresión simbólica"))}</span>
            <div class="fl2-symbolic-stack">
              <div class="fl2-sym-line"><code>${absA} × ${absB}</code></div>
              <div class="fl2-sym-line">= <code>${absA} × (<span class="fl2-hl-teal">${split}</span> + <span class="fl2-hl-blue">${rem}</span>)</code></div>
              <div class="fl2-sym-line">= <code>(<span class="fl2-hl-teal">${absA} × ${split}</span>) + (<span class="fl2-hl-blue">${absA} × ${rem}</span>)</code></div>
            </div>
            <p class="fl2-pane-caption">${esc(L("Distributive property in action", "Propiedad distributiva en acción"))}</p>
          </div>
        </div>
      </section>
    `;
  }

  // Addition / Subtraction Make-Ten / Place-Value Bridge
  const toTen = a < 10 && a > 0 ? 10 - a : Math.min(absB, 5);
  const transfer = splitVal !== null ? Math.min(absB, Math.max(0, splitVal)) : Math.min(absB, toTen);
  const left = op === "-" ? Math.max(0, absA - transfer) : absA + transfer;
  const right = absB - transfer;

  const drawTenFrame = (countA, countTransfer) => {
    let cells = "";
    for (let i = 0; i < 10; i++) {
      const r = Math.floor(i / 5);
      const c = i % 5;
      const x = 14 + c * 28;
      const y = 16 + r * 28;
      cells += `<rect x="${x}" y="${y}" width="24" height="24" rx="5" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5"/>`;
      if (i < countA) {
        cells += `<circle cx="${x + 12}" cy="${y + 12}" r="8" fill="#0d9488"/>`;
      } else if (i < countA + countTransfer) {
        cells += `<circle cx="${x + 12}" cy="${y + 12}" r="8" fill="#f59e0b"/>`;
      }
    }
    return `<svg viewBox="0 0 170 86" class="fl2-tri-svg">${cells}</svg>`;
  };

  return `
    <section class="fl2-tri-bench" data-tri-bench="addsub" data-a="${absA}" data-b="${absB}" data-op="${op}" aria-label="${esc(L("Linked Representations Bench", "Banco de representaciones conectadas"))}">
      <header class="fl2-tri-header">
        <div>
          <span class="fl2-eyebrow">${esc(L("LIVE LINKED REPRESENTATIONS", "REPRESENTACIONES CONECTADAS EN VIVO"))}</span>
          <h4>${esc(L("Move counters between groups to see how Making a Friendly Benchmark updates the equation", "Mueve fichas entre grupos para ver cómo formar un número amigable actualiza la ecuación"))}</h4>
        </div>
        <label class="fl2-slider-label">
          <span>${esc(L("Bridge counters", "Pasar fichas"))}: <strong>${transfer}</strong> ${esc(L("of", "de"))} ${absB}</span>
          <input type="range" min="0" max="${absB}" value="${transfer}" data-tri-add-slider aria-label="${esc(L("Move counters", "Mover fichas"))}" />
        </label>
      </header>
      <div class="fl2-tri-grid">
        <div class="fl2-tri-pane">
          <span class="fl2-pane-tag">1 · ${esc(L("Concrete Ten-Frame", "Marco de diez concreto"))}</span>
          ${drawTenFrame(Math.min(10, absA), Math.min(Math.max(0, 10 - absA), transfer))}
          <p class="fl2-pane-caption">${absA} ${esc(L("start counters", "fichas iniciales"))} ${op === "+" ? `+ ${transfer} ${esc(L("moved over", "movidas"))}` : `− ${transfer} ${esc(L("taken away", "quitadas"))}`}</p>
        </div>
        <div class="fl2-tri-pane">
          <span class="fl2-pane-tag">2 · ${esc(L("Number Line Jumps", "Saltos en la recta"))}</span>
          <svg viewBox="0 0 220 86" class="fl2-tri-svg">
            <line x1="16" y1="62" x2="204" y2="62" stroke="#334155" stroke-width="2.5" stroke-linecap="round"/>
            <circle cx="36" cy="62" r="5" fill="#0d9488"/>
            <text x="36" y="78" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a">${absA}</text>
            <path d="M 36 58 Q 78 24 120 58" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
            <text x="78" y="32" text-anchor="middle" font-size="11" font-weight="800" fill="#b45309">${op}${transfer}</text>
            <circle cx="120" cy="62" r="5" fill="#f59e0b"/>
            <text x="120" y="78" text-anchor="middle" font-size="11" font-weight="700" fill="#0f172a">${left}</text>
            ${right > 0 ? `<path d="M 120 58 Q 152 34 184 58" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-dasharray="4 3"/><text x="152" y="38" text-anchor="middle" font-size="11" font-weight="800" fill="#1d4ed8">${op}${right}</text><circle cx="184" cy="62" r="4" fill="#3b82f6"/>` : ""}
          </svg>
          <p class="fl2-pane-caption">${esc(L("Land on friendly", "Aterriza en"))} ${left}, ${esc(L("then", "luego"))} ${op}${right}</p>
        </div>
        <div class="fl2-tri-pane">
          <span class="fl2-pane-tag">3 · ${esc(L("Symbolic Decomposition", "Descomposición simbólica"))}</span>
          <div class="fl2-symbolic-stack">
            <div class="fl2-sym-line"><code>${absA} ${op} ${absB}</code></div>
            <div class="fl2-sym-line">= <code>${absA} ${op} (<span class="fl2-hl-amber">${transfer}</span> + <span class="fl2-hl-blue">${right}</span>)</code></div>
            <div class="fl2-sym-line">= <code>(<span class="fl2-hl-teal">${absA} ${op} ${transfer}</span>) ${op} <span class="fl2-hl-blue">${right}</span> = <strong>${left} ${op} ${right}</strong></code></div>
          </div>
          <p class="fl2-pane-caption">${esc(L("Associative decomposition", "Descomposición asociativa"))}</p>
        </div>
      </div>
    </section>
  `;
}

function renderFractionTriRep(parsed, state) {
  const [f1, f2] = parsed.parts;
  const mult = state.fracScale ?? 1;
  const d1 = f1.d * mult;
  const n1 = f1.n * mult;
  const slices = Math.min(24, Math.max(2, d1));
  const w = 180;
  const sliceW = w / slices;
  let bars = "";
  for (let i = 0; i < slices; i++) {
    bars += `<rect x="${16 + i * sliceW}" y="26" width="${Math.max(2, sliceW - 1.5)}" height="36" fill="${i < n1 ? "#0d9488" : "#f1f5f9"}" stroke="#0f172a" stroke-width="1"/>`;
  }
  return `
    <section class="fl2-tri-bench" data-tri-bench="frac" aria-label="${esc(L("Linked Fraction Bench", "Banco de fracciones conectadas"))}">
      <header class="fl2-tri-header">
        <div>
          <span class="fl2-eyebrow">${esc(L("LIVE FRACTION EQUIVALENCE BENCH", "BANCO DE EQUIVALENCIA DE FRACCIONES"))}</span>
          <h4>${esc(L("Subdivide each unit slice to see why multiplying numerator and denominator preserves the exact length", "Subdivide cada parte para ver por qué multiplicar numerador y denominador conserva la longitud exacta"))}</h4>
        </div>
        <label class="fl2-slider-label">
          <span>${esc(L("Subdivide slices", "Subdividir partes"))}: <strong>×${mult}</strong></span>
          <input type="range" min="1" max="4" value="${mult}" data-tri-frac-slider aria-label="${esc(L("Subdivide fraction", "Subdividir fracción"))}" />
        </label>
      </header>
      <div class="fl2-tri-grid">
        <div class="fl2-tri-pane">
          <span class="fl2-pane-tag">1 · ${esc(L("Area Strip Model", "Modelo de tira de área"))}</span>
          <svg viewBox="0 0 212 86" class="fl2-tri-svg">${bars}</svg>
          <p class="fl2-pane-caption">${n1} ${esc(L("shaded out of", "sombreados de"))} ${d1} ${esc(L("equal parts", "partes iguales"))}</p>
        </div>
        <div class="fl2-tri-pane">
          <span class="fl2-pane-tag">2 · ${esc(L("Number Line Position", "Posición en la recta"))}</span>
          <svg viewBox="0 0 212 86" class="fl2-tri-svg">
            <line x1="16" y1="50" x2="196" y2="50" stroke="#334155" stroke-width="2.5"/>
            <line x1="16" y1="40" x2="16" y2="60" stroke="#0f172a" stroke-width="2"/>
            <line x1="196" y1="40" x2="196" y2="60" stroke="#0f172a" stroke-width="2"/>
            <circle cx="${16 + Math.min(1, Math.max(0, f1.n / f1.d)) * 180}" cy="50" r="6" fill="#0d9488"/>
            <text x="16" y="74" font-size="11" font-weight="700">0</text>
            <text x="196" y="74" font-size="11" font-weight="700" text-anchor="end">1</text>
            <text x="${16 + Math.min(1, Math.max(0, f1.n / f1.d)) * 180}" y="34" font-size="12" font-weight="800" fill="#0f766e" text-anchor="middle">${n1}/${d1}</text>
          </svg>
          <p class="fl2-pane-caption">${esc(L("Point never moves on the line!", "¡El punto nunca se mueve en la recta!"))}</p>
        </div>
        <div class="fl2-tri-pane">
          <span class="fl2-pane-tag">3 · ${esc(L("Symbolic Identity", "Identidad simbólica"))}</span>
          <div class="fl2-symbolic-stack">
            <div class="fl2-sym-line"><code>${f1.n}/${f1.d} × (${mult}/${mult}) = <strong>${n1}/${d1}</strong></code></div>
            ${f2 ? `<div class="fl2-sym-line">${esc(L("Target denominator", "Denominador objetivo"))}: <code>${f2.d}</code></div>` : ""}
          </div>
          <p class="fl2-pane-caption">${esc(L("Scaling by", "Escalar por"))} ${mult}/${mult} = 1</p>
        </div>
      </div>
    </section>
  `;
}

function renderEquationTriRep(parsed, state) {
  const { coeff = 2, constant = 4, rhs = 12 } = parsed;
  const removedConst = Boolean(state.eqStep1);
  const leftLabel = removedConst ? `${coeff}x` : `${coeff}x ${constant >= 0 ? `+ ${constant}` : `− ${Math.abs(constant)}`}`;
  const rightLabel = removedConst ? `${rhs} ${constant >= 0 ? `− ${constant}` : `+ ${Math.abs(constant)}`}` : `${rhs}`;
  return `
    <section class="fl2-tri-bench" data-tri-bench="eq" aria-label="${esc(L("Linked Equation Bench", "Banco de ecuaciones conectadas"))}">
      <header class="fl2-tri-header">
        <div>
          <span class="fl2-eyebrow">${esc(L("LIVE ALGEBRAIC BALANCE BENCH", "BALANZA ALGEBRAICA EN VIVO"))}</span>
          <h4>${esc(L("Perform the inverse operation on both pans to keep the physical beam level", "Realiza la operación inversa en ambos platillos para mantener la balanza nivelada"))}</h4>
        </div>
        <button type="button" class="outline-action" data-tri-eq-toggle>
          ${removedConst ? esc(L("↺ Reset Constant Term", "↺ Restablecer constante")) : esc(L(`⚖️ Undo ${constant >= 0 ? "+" : "−"}${Math.abs(constant)} on Both Sides`, `⚖️ Deshacer ${constant >= 0 ? "+" : "−"}${Math.abs(constant)} en ambos lados`))}
        </button>
      </header>
      <div class="fl2-tri-grid">
        <div class="fl2-tri-pane">
          <span class="fl2-pane-tag">1 · ${esc(L("Physical Balance Beam", "Balanza física"))}</span>
          <svg viewBox="0 0 212 86" class="fl2-tri-svg">
            <polygon points="96,78 116,78 106,48" fill="#475569"/>
            <line x1="26" y1="48" x2="186" y2="48" stroke="#0f172a" stroke-width="3.5" stroke-linecap="round"/>
            <rect x="30" y="24" width="60" height="22" rx="4" fill="#ccfbf1" stroke="#0d9488" stroke-width="1.5"/>
            <text x="60" y="39" text-anchor="middle" font-size="11" font-weight="800" fill="#115e59">${esc(leftLabel)}</text>
            <rect x="122" y="24" width="60" height="22" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
            <text x="152" y="39" text-anchor="middle" font-size="11" font-weight="800" fill="#1e40af">${esc(rightLabel)}</text>
          </svg>
        </div>
        <div class="fl2-tri-pane">
          <span class="fl2-pane-tag">2 · ${esc(L("Bar Tape Model", "Diagrama de cinta"))}</span>
          <svg viewBox="0 0 212 86" class="fl2-tri-svg">
            <rect x="16" y="20" width="110" height="22" rx="4" fill="#ccfbf1" stroke="#0d9488"/>
            <text x="71" y="35" text-anchor="middle" font-size="11" font-weight="800" fill="#115e59">${coeff}x</text>
            <rect x="128" y="20" width="68" height="22" rx="4" fill="${removedConst ? "#f1f5f9" : "#fef3c7"}" stroke="#d97706" stroke-dasharray="${removedConst ? "3 3" : "none"}"/>
            <text x="162" y="35" text-anchor="middle" font-size="11" font-weight="700" fill="#92400e">${constant}</text>
            <rect x="16" y="48" width="180" height="22" rx="4" fill="#dbeafe" stroke="#2563eb"/>
            <text x="106" y="63" text-anchor="middle" font-size="11" font-weight="800" fill="#1e40af">${esc(L("Total", "Total"))} = ${rhs}</text>
          </svg>
        </div>
        <div class="fl2-tri-pane">
          <span class="fl2-pane-tag">3 · ${esc(L("Symbolic Steps", "Pasos simbólicos"))}</span>
          <div class="fl2-symbolic-stack">
            <div class="fl2-sym-line"><code>${coeff}x ${constant >= 0 ? `+ ${constant}` : `− ${Math.abs(constant)}`} = ${rhs}</code></div>
            ${removedConst ? `<div class="fl2-sym-line"><code>${coeff}x = ${rightLabel}</code></div>` : ""}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderRatioTriRep(parsed, state) {
  const a = parsed.a || 3;
  const b = parsed.b || 5;
  const k = state.ratioScale ?? 2;
  return `
    <section class="fl2-tri-bench" data-tri-bench="ratio" aria-label="${esc(L("Linked Ratio Bench", "Banco de razones conectadas"))}">
      <header class="fl2-tri-header">
        <div>
          <span class="fl2-eyebrow">${esc(L("LIVE PROPORTIONAL SCALING BENCH", "BANCO DE ESCALADO PROPORCIONAL"))}</span>
          <h4>${esc(L("Scale the batch multiplier to see how Tape, Double Number Line, and Ratio Table stay in lockstep", "Escala el multiplicador para ver cómo la cinta, la recta doble y la tabla se mantienen sincronizadas"))}</h4>
        </div>
        <label class="fl2-slider-label">
          <span>${esc(L("Scale factor", "Factor de escala"))}: <strong>×${k}</strong></span>
          <input type="range" min="1" max="5" value="${k}" data-tri-ratio-slider />
        </label>
      </header>
      <div class="fl2-tri-grid">
        <div class="fl2-tri-pane">
          <span class="fl2-pane-tag">1 · ${esc(L("Proportional Tape", "Cinta proporcional"))}</span>
          <div class="fl2-symbolic-stack">
            <div><strong>A:</strong> ${Array.from({ length: Math.min(8, a) }, () => `<span class="fl2-tape-box">${k}</span>`).join(" ")} = <strong>${a * k}</strong></div>
            <div><strong>B:</strong> ${Array.from({ length: Math.min(8, b) }, () => `<span class="fl2-tape-box fl2-tape-b">${k}</span>`).join(" ")} = <strong>${b * k}</strong></div>
          </div>
        </div>
        <div class="fl2-tri-pane">
          <span class="fl2-pane-tag">2 · ${esc(L("Ratio Table", "Tabla de razones"))}</span>
          <table class="fl2-mini-table">
            <thead><tr><th>×1</th><th>×${k}</th></tr></thead>
            <tbody>
              <tr><td>${a}</td><td><strong>${a * k}</strong></td></tr>
              <tr><td>${b}</td><td><strong>${b * k}</strong></td></tr>
            </tbody>
          </table>
        </div>
        <div class="fl2-tri-pane">
          <span class="fl2-pane-tag">3 · ${esc(L("Symbolic Proportion", "Proporción simbólica"))}</span>
          <div class="fl2-symbolic-stack">
            <div class="fl2-sym-line"><code>${a} : ${b} = ${a * k} : ${b * k}</code></div>
            <div class="fl2-sym-line">${esc(L("Multiplicative invariance (never additive!)", "Invarianza multiplicativa (¡nunca aditiva!)"))}</div>
          </div>
        </div>
      </div>
    </section>
  `;
}

// ============================================================================
// SIGNATURE 2: SOCRATIC COUNTEREXAMPLE ENGINE ("Show What My Answer Means")
// ============================================================================
export function renderSocraticCounterexample(item, submittedAnswer) {
  if (!item || !submittedAnswer) return "";
  const skill = item.skill;
  const analysis = analyzeResponse({
    skill,
    question: item.question,
    answers: item.answers || [],
    response: submittedAnswer,
  });

  const parsed = extractProblem(item);
  const subText = esc(String(submittedAnswer).trim());
  let visualProof = "";
  let socraticQuestion = L(
    `Let's test what "${subText}" means in the model. Does the size match the question?`,
    `Probemos qué significa «${subText}» en el modelo. ¿Coincide el tamaño con la pregunta?`
  );
  let diagnosisTitle = analysis.title
    ? (typeof analysis.title === "object" ? analysis.title[getLang() === "es" ? "es" : "en"] : analysis.title)
    : L("Let's Compare Your Idea to the Model", "Comparemos tu idea con el modelo");

  // Specific visual counterexamples for high-frequency K-8 misconceptions
  if (parsed?.kind === "fractions" && (parsed.op === "+" || parsed.op === "-") && parsed.parts?.length >= 2) {
    const [f1, f2] = parsed.parts;
    const sumNum = f1.n + f2.n;
    const sumDen = f1.d + f2.d;
    if (String(submittedAnswer).trim() === `${sumNum}/${sumDen}`) {
      diagnosisTitle = L("Counterexample: Why Adding Denominators Shrinks the Pieces", "Contraejemplo: Por qué sumar denominadores achica las partes");
      socraticQuestion = L(
        `You started with ${f1.n}/${f1.d} (${Math.round((f1.n / f1.d) * 100)}% of a bar) and added ${f2.n}/${f2.d}. Look at ${sumNum}/${sumDen} below—is ${sumNum}/${sumDen} even smaller than the piece you started with?`,
        `Empezaste con ${f1.n}/${f1.d} y sumaste ${f2.n}/${f2.d}. Mira ${sumNum}/${sumDen} abajo: ¿es incluso más pequeño que la parte con la que empezaste?`
      );
      const w1 = Math.round(Math.min(1, f1.n / f1.d) * 160);
      const w2 = Math.round(Math.min(1, f2.n / f2.d) * 160);
      const wSub = Math.round(Math.min(1, sumNum / sumDen) * 160);
      visualProof = `
        <svg viewBox="0 0 260 92" class="fl2-counterexample-svg" role="img" aria-label="Fraction size comparison">
          <text x="8" y="22" font-size="11" font-weight="700" fill="#0f172a">${f1.n}/${f1.d} + ${f2.n}/${f2.d}</text>
          <rect x="78" y="10" width="${w1}" height="16" rx="3" fill="#0d9488"/>
          <rect x="${78 + w1 + 2}" y="10" width="${w2}" height="16" rx="3" fill="#3b82f6"/>
          <rect x="78" y="10" width="160" height="16" rx="3" fill="none" stroke="#334155" stroke-width="1.5"/>
          <text x="8" y="54" font-size="11" font-weight="700" fill="#dc2626">${esc(L("Your", "Tu"))}: ${sumNum}/${sumDen}</text>
          <rect x="78" y="42" width="${wSub}" height="16" rx="3" fill="#ef4444" opacity="0.85"/>
          <rect x="78" y="42" width="160" height="16" rx="3" fill="none" stroke="#334155" stroke-width="1.5"/>
          <text x="78" y="78" font-size="10.5" font-weight="700" fill="#991b1b">${esc(L("Notice: Adding bottoms made the slices smaller instead of combining them!", "¡Nota: Sumar los denominadores hizo las partes más pequeñas en vez de juntarlas!"))}</text>
        </svg>
      `;
    }
  } else if (parsed?.kind === "binary" && parsed.op === "-" && Number(submittedAnswer) === Math.abs((parsed.a % 10) - (parsed.b % 10)) + Math.abs(Math.floor(parsed.a / 10) - Math.floor(parsed.b / 10)) * 10) {
    diagnosisTitle = L("Counterexample: Smaller-from-Larger Ones Reversal", "Contraejemplo: Restar el menor del mayor en las unidades");
    socraticQuestion = L(
      `In ${parsed.a} − ${parsed.b}, we start with ${parsed.a % 10} ones and need to take away ${parsed.b % 10} ones. Can we flip them to ${parsed.b % 10} − ${parsed.a % 10}, or do we need to unbundle 1 ten into 10 ones first?`,
      `En ${parsed.a} − ${parsed.b}, empezamos con ${parsed.a % 10} unidades y debemos quitar ${parsed.b % 10}. ¿Podemos voltearlos o debemos desagrupar 1 decena en 10 unidades primero?`
    );
  } else if (parsed?.kind === "binary" && (parsed.op === "+" || parsed.op === "*")) {
    const userNum = Number(submittedAnswer);
    if (parsed.op === "*" && userNum === parsed.a + parsed.b) {
      diagnosisTitle = L("Counterexample: Addition (+) vs. Equal Groups (×)", "Contraejemplo: Suma (+) vs. Grupos iguales (×)");
      socraticQuestion = L(
        `Your answer (${subText}) is ${parsed.a} + ${parsed.b} (putting two groups together). How does ${parsed.a} equal rows of ${parsed.b} look different?`,
        `Tu respuesta (${subText}) es ${parsed.a} + ${parsed.b}. ¿En qué se diferencia de ${parsed.a} filas iguales de ${parsed.b}?`
      );
    }
  }

  return `
    <aside class="fl2-socratic-card" aria-label="${esc(L("Socratic Coaching Insight", "Guía socrática"))}">
      <div class="fl2-socratic-head">
        <span class="fl2-socratic-badge">🧭 ${esc(L("SOCRATIC MODEL CHECK", "VERIFICACIÓN SOCRÁTICA DEL MODELO"))}</span>
        <strong>${esc(diagnosisTitle)}</strong>
      </div>
      <p class="fl2-socratic-prompt">${socraticQuestion}</p>
      ${visualProof}
    </aside>
  `;
}

// ============================================================================
// SIGNATURE 3: TACTILE EXPRESSION DECOMPOSER ("Pinch-to-Split" Number Tokens)
// ============================================================================
export function renderTactileExpressionDecomposer(item, splitState = {}) {
  const parsed = extractProblem(item);
  if (!parsed || parsed.kind !== "binary") return "";
  const { a, b, op } = parsed;
  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(b) < 2) return "";

  const absB = Math.abs(b);
  const splitPoint = splitState.part1 ?? (absB > 10 ? Math.floor(absB / 10) * 10 : Math.min(5, Math.floor(absB / 2) || 1));
  const part2 = absB - splitPoint;
  const isSplit = Boolean(splitState.expanded);

  return `
    <div class="fl2-tactile-tokens" data-tactile-decomposer="true" aria-label="${esc(L("Interactive Number Token Splitter", "Separador táctil de números"))}">
      <span class="fl2-tokens-label">✨ ${esc(L("Tactile Expression Tokens:", "Fichas táctiles de expresión:"))}</span>
      <div class="fl2-tokens-stage">
        <span class="fl2-token fl2-token--fixed">${a}</span>
        <span class="fl2-token-op">${op === "*" ? "×" : op}</span>
        ${
          !isSplit
            ? `<button type="button" class="fl2-token fl2-token--splittable" data-token-split title="${esc(L("Tap to split into friendly numbers", "Toca para dividir en números amigables"))}">
                <span>${b}</span>
                <small>✂️ ${esc(L("Tap to split", "Dividir"))}</small>
              </button>`
            : `<span class="fl2-token-group">
                <span class="fl2-token-paren">(</span>
                <button type="button" class="fl2-token fl2-token--part" data-token-cycle="-1" title="${esc(L("Adjust split", "Ajustar división"))}">${splitPoint}</button>
                <span class="fl2-token-op">+</span>
                <button type="button" class="fl2-token fl2-token--part" data-token-cycle="1" title="${esc(L("Adjust split", "Ajustar división"))}">${part2}</button>
                <span class="fl2-token-paren">)</span>
                <button type="button" class="fl2-token-merge" data-token-merge title="${esc(L("Recombine", "Recombinar"))}">↺</button>
              </span>`
        }
      </div>
    </div>
  `;
}

// ============================================================================
// SIGNATURE 4: TOMORROW'S 10-MINUTE SMALL-GROUP TABLE KIT GENERATOR
// ============================================================================
export function renderTomorrowTableKit({ grade, skills = [], decodedReceipts = [], learnerRecords = [] }) {
  const targetSkill = skills[0] || {
    grade: grade ?? 3,
    id: "core-fluency",
    title: "Strategic Decomposition & Fluency",
    strand: "Operations",
    standard: `${grade === 0 ? "K" : grade}.OA`,
    learn: {
      rule: "Break numbers into friendly benchmarks so every step is visible.",
      watch: "Keep place values and unit sizes aligned before combining.",
    },
  };

  // Group learners or receipt entries into 3 actionable table groups
  const totalCount = decodedReceipts.length || learnerRecords.length || 6;
  const g1Count = Math.max(1, Math.round(totalCount * 0.35));
  const g2Count = Math.max(1, Math.round(totalCount * 0.4));
  const g3Count = Math.max(1, totalCount - g1Count - g2Count);

  return `
    <section class="fl2-teacher-kit" id="fl2-tomorrow-kit" aria-labelledby="fl2-kit-title">
      <div class="fl2-kit-header">
        <div>
          <span class="fl2-eyebrow">⚡ ${esc(L("ZERO-PREP NEXT-DAY INTERVENTION ENGINE", "MOTOR DE INTERVENCIÓN PARA MAÑANA SIN PREPARACIÓN"))}</span>
          <h3 id="fl2-kit-title">${esc(L("Tomorrow’s 10-Minute Small-Group Table Kit", "Kit de mesa para grupos pequeños de 10 minutos para mañana"))}</h3>
          <p>${esc(L("Automatically synthesizes local learner profiles and QR Mastery Receipts into flexible groups, concrete prompts, and a printable table coaching card.", "Sintetiza automáticamente los perfiles locales y recibos QR en grupos flexibles, preguntas concretas y una tarjeta imprimible."))}</p>
        </div>
        <button type="button" class="primary-action" id="fl2-print-table-kit">
          🖨️ ${esc(L("Print 10-Minute Table Kit", "Imprimir kit de mesa de 10 min"))}
        </button>
      </div>
      <div class="fl2-kit-groups">
        <article class="fl2-kit-card fl2-kit--concrete">
          <header>
            <span class="fl2-kit-pill">${esc(L("Table Group A · Concrete Bridge", "Grupo A · Puente Concreto"))}</span>
            <strong>${g1Count} ${esc(L("learners", "estudiantes"))}</strong>
          </header>
          <p><strong>${esc(L("Observed Need:", "Necesidad observada:"))}</strong> ${esc(L("Conceptual representation & unit alignment before symbolic steps.", "Representación conceptual y alineación de unidades antes de pasos simbólicos."))}</p>
          <p><strong>${esc(L("3-Min Hands-On Launch:", "Inicio práctico (3 min):"))}</strong> ${esc(L(`Build ${targetSkill.title} on the Tri-Representation Bench before writing numbers.`, `Construir ${targetSkill.title} en el banco de representaciones antes de escribir números.`))}</p>
          <p><strong>${esc(L("Teacher Prompt:", "Pregunta docente:"))}</strong> <em>“${esc(L("Show me where this number lives in the picture before we write the symbol.", "Muéstrame dónde vive este número en la imagen antes de escribir el símbolo."))}”</em></p>
        </article>
        <article class="fl2-kit-card fl2-kit--strategic">
          <header>
            <span class="fl2-kit-pill">${esc(L("Table Group B · Strategy Consolidation", "Grupo B · Consolidación de Estrategia"))}</span>
            <strong>${g2Count} ${esc(L("learners", "estudiantes"))}</strong>
          </header>
          <p><strong>${esc(L("Observed Need:", "Necesidad observada:"))}</strong> ${esc(L("Accurate with visual scaffolds; ready to fade the model to mental landmarks.", "Preciso con apoyo visual; listo para desvanecer el modelo hacia puntos de referencia mentales."))}</p>
          <p><strong>${esc(L("3-Min Hands-On Launch:", "Inicio práctico (3 min):"))}</strong> ${esc(L("Use Tactile Token Splitting to compare two different decompositions for the same problem.", "Usar fichas táctiles para comparar dos descomposiciones distintas del mismo problema."))}</p>
          <p><strong>${esc(L("Teacher Prompt:", "Pregunta docente:"))}</strong> <em>“${esc(L("Which split made the mental calculation easiest, and why?", "¿Qué partición hizo más fácil el cálculo mental y por qué?"))}”</em></p>
        </article>
        <article class="fl2-kit-card fl2-kit--transfer">
          <header>
            <span class="fl2-kit-pill">${esc(L("Table Group C · Transfer & Proof", "Grupo C · Transferencia y Demostración"))}</span>
            <strong>${g3Count} ${esc(L("learners", "estudiantes"))}</strong>
          </header>
          <p><strong>${esc(L("Observed Need:", "Necesidad observada:"))}</strong> ${esc(L("Secure procedural fluency; ready for non-routine transfer and error analysis.", "Fluidez procedimental segura; listo para transferencia no rutinaria y análisis de errores."))}</p>
          <p><strong>${esc(L("3-Min Hands-On Launch:", "Inicio práctico (3 min):"))}</strong> ${esc(L("Solve a Spot-the-Glitch case and test the relationship in Math Reality.", "Resolver un caso de detectar el error y probar la relación en Realidad Matemática."))}</p>
          <p><strong>${esc(L("Teacher Prompt:", "Pregunta docente:"))}</strong> <em>“${esc(L("What counterexample proves why this common shortcut fails?", "¿Qué contraejemplo demuestra por qué falla este atajo común?"))}”</em></p>
        </article>
      </div>
    </section>
  `;
}

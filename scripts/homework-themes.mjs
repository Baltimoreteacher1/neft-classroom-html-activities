/**
 * Clean, Unified Theme Engine for EduWonderLab Family Homework.
 * Provides a single, simple, professional, high-contrast color scheme across all 10 units,
 * while retaining distinct unit titles, emojis, and thematic taglines.
 */

const UNIFIED_PALETTE = {
  navy: "#15487f",
  navyLight: "#1c5999",
  teal: "#0284c7",
  tealInk: "#0369a1",
  tealLight: "#e0f2fe",
  amber: "#d97706",
  amberLight: "#fef3c7",
  cardBorder: "#cbd5e1",
  heroGradient: "linear-gradient(135deg, #15487f 0%, #0f2b5c 100%)",
};

export const UNIT_THEMES = {
  1: {
    unit: 1,
    nameEn: "Voyage & Launchpad",
    nameEs: "El Viaje y Despegue",
    taglineEn: "Math is Mine · The Journey Begins",
    taglineEs: "Las matemáticas son mías · Comienza el viaje",
    emoji: "🚀",
    motif: "compass",
    colors: UNIFIED_PALETTE,
  },
  2: {
    unit: 2,
    nameEn: "Data Detective Agency",
    nameEs: "Agencia de Detectives de Datos",
    taglineEn: "Investigate, Analyze & Uncover Patterns",
    taglineEs: "Investiga, analiza y descubre patrones",
    emoji: "🕵️",
    motif: "chart",
    colors: UNIFIED_PALETTE,
  },
  3: {
    unit: 3,
    nameEn: "Speed & Scale Workshop",
    nameEs: "Taller de Escala y Proporciones",
    taglineEn: "Balance Ratios, Tune Rates & Scale Up",
    taglineEs: "Equilibra razones, ajusta tasas y escala",
    emoji: "⚙️",
    motif: "gears",
    colors: UNIFIED_PALETTE,
  },
  4: {
    unit: 4,
    nameEn: "Marketplace Arcade",
    nameEs: "Mercado y Sala de Juegos",
    taglineEn: "Percentages, Discounts & Real-World Value",
    taglineEs: "Porcentajes, descuentos y valor del mundo real",
    emoji: "🏷️",
    motif: "tag",
    colors: UNIFIED_PALETTE,
  },
  5: {
    unit: 5,
    nameEn: "Architect Studio",
    nameEs: "Estudio del Arquitecto",
    taglineEn: "Blueprints, Geometric Shapes & 3D Space",
    taglineEs: "Planos, figuras geométricas y espacio 3D",
    emoji: "📐",
    motif: "blueprint",
    colors: UNIFIED_PALETTE,
  },
  6: {
    unit: 6,
    nameEn: "Culinary & Recipe Lab",
    nameEs: "Laboratorio Culinario y Recetas",
    taglineEn: "Fraction Division, Precise Decimals & Portions",
    taglineEs: "División de fracciones, decimales y porciones",
    emoji: "🍰",
    motif: "recipe",
    colors: UNIFIED_PALETTE,
  },
  7: {
    unit: 7,
    nameEn: "Cartesian Odyssey",
    nameEs: "Odisea Cartesiana",
    taglineEn: "Navigate 4 Quadrants, Integers & Coordinates",
    taglineEs: "Navega 4 cuadrantes, enteros y coordenadas",
    emoji: "🧭",
    motif: "radar",
    colors: UNIFIED_PALETTE,
  },
  8: {
    unit: 8,
    nameEn: "Codebreaker Vault",
    nameEs: "Cámara de Códigos",
    taglineEn: "Balance Equations, Unlock Variables & Solve",
    taglineEs: "Equilibra ecuaciones, desbloquea variables y resuelve",
    emoji: "🔐",
    motif: "vault",
    colors: UNIFIED_PALETTE,
  },
  9: {
    unit: 9,
    nameEn: "Function Simulator",
    nameEs: "Simulador de Funciones",
    taglineEn: "Input, Output, Equations & Graphs",
    taglineEs: "Entrada, salida, ecuaciones y gráficas",
    emoji: "⚡",
    motif: "conveyor",
    colors: UNIFIED_PALETTE,
  },
  10: {
    unit: 10,
    nameEn: "World Math Showcase",
    nameEs: "Gran Festival Matemático",
    taglineEn: "Culminating Mastery & Real-World Impact",
    taglineEs: "Dominio final e impacto en el mundo real",
    emoji: "🏆",
    motif: "trophy",
    colors: UNIFIED_PALETTE,
  },
};

/**
 * Returns the theme object for a given unit number (defaults to Unit 1).
 */
export function getUnitTheme(unitNumber) {
  const num = parseInt(unitNumber, 10) || 1;
  return UNIT_THEMES[num] || UNIT_THEMES[1];
}

/**
 * Generates the unified CSS snippet for consistent, readable family homework styling.
 */
export function renderUnitThemeCss(theme) {
  const { colors } = theme;
  return `
/* --- Clean Unified Theme: Unit ${theme.unit} (${theme.nameEn}) --- */
:root {
  --navy: ${colors.navy};
  --navy-light: ${colors.navyLight};
  --teal: ${colors.teal};
  --teal-ink: ${colors.tealInk};
  --teal-light: ${colors.tealLight};
  --amber: ${colors.amber};
  --amber-light: ${colors.amberLight};
  --hw-world-border: ${colors.cardBorder};
}

header.homework-header,
.family-welcome {
  background: ${colors.heroGradient} !important;
  border: 1.5px solid ${colors.cardBorder} !important;
}

.unit-world-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(4px);
  padding: 4px 12px;
  border-radius: 99px;
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  margin-bottom: 8px;
}

.hw-three-beats-roadmap {
  display: grid;
  grid-template-columns: 1fr auto 1fr auto 1fr;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  border: 1.5px solid var(--hw-world-border);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  margin-bottom: 18px;
  box-shadow: var(--shadow-sm);
}
@media (max-width: 600px) {
  .hw-three-beats-roadmap {
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .hw-three-beats-roadmap .beat-arrow {
    display: none;
  }
}

.beat-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg);
  border: 1px solid var(--line);
  cursor: pointer;
  transition: all 0.2s ease;
}
.beat-pill:hover {
  background: var(--teal-light);
  border-color: var(--teal);
}
.beat-num {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--navy);
  color: #ffffff;
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.beat-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}
.beat-text strong {
  font-size: 13.5px;
  color: var(--navy);
}
.beat-text small {
  font-size: 11.5px;
  color: var(--muted);
}
.beat-arrow {
  color: var(--teal);
  font-weight: 800;
  font-size: 16px;
  user-select: none;
}

/* 3 Stars Milestone Bar on Quick Check */
.stars-to-win-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, var(--teal-light) 0%, #ffffff 100%);
  border: 1.5px solid var(--teal);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  margin-bottom: 20px;
}
.stars-to-win-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 14.5px;
  color: var(--navy);
}
.stars-milestone-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.star-chip {
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 700;
  background: #ffffff;
  border: 1px solid var(--teal);
  color: var(--navy);
  /* The row is a flex sibling of the goal sentence, so without this the chips
     were compressed to ~48px and broke mid-word: "War m-Up", "Vict ory". */
  flex: 0 0 auto;
  white-space: nowrap;
}
/* On a phone the goal sentence and the three milestone chips do not fit on one
   line, so they stack instead of fighting for the same 400px. */
@media (max-width: 620px) {
  .stars-to-win-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .stars-milestone-chips { width: 100%; }
}

/* Rotated Huddle Activity Card */
.huddle-hook-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--teal-light);
  border-left: 4px solid var(--teal);
  padding: 12px 14px;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  margin-bottom: 16px;
}
.huddle-hook-icon {
  font-size: 28px;
  line-height: 1;
}
.huddle-hook-titles strong {
  display: block;
  font-family: var(--font-display);
  font-size: 14.5px;
  color: var(--navy);
}
.huddle-hook-titles span {
  font-size: 12.5px;
  color: var(--muted);
}
.parent-coach-prompt {
  background: #fffbeb;
  border: 1px dashed #d97706;
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  margin-top: 10px;
  font-size: 13px;
  color: #78350f;
  line-height: 1.4;
}
.parent-coach-prompt strong {
  color: #92400e;
}

/* Visual Explanation Card */
.visual-explanation-card {
  background: #f8fafc;
  border: 1.5px solid #0284c7;
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  margin-top: 12px;
  font-size: 13.5px;
  color: #1e293b;
  line-height: 1.45;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.08);
}
.visual-explanation-card .exp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 13.5px;
  color: #0369a1;
  margin-bottom: 6px;
}
.visual-explanation-card .exp-trap {
  background: #fef2f2;
  border-left: 3px solid #ef4444;
  padding: 6px 10px;
  border-radius: 0 6px 6px 0;
  margin-bottom: 8px;
  font-size: 12.5px;
  color: #991b1b;
}
.visual-explanation-card .exp-why {
  margin-bottom: 8px;
  font-size: 13px;
  color: #1e293b;
}
.visual-explanation-card .exp-coach {
  background: #fffbeb;
  border: 1px dashed #d97706;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 12px;
  color: #92400e;
}

/* Visual Parent Step Guide in problem cards */
.hw-step-guide {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: var(--radius-sm);
  margin-top: 12px;
  margin-bottom: 12px;
  padding: 8px 12px;
}
.hw-step-guide summary {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 13px;
  color: #0369a1;
  cursor: pointer;
  outline: none;
}
.hw-step-guide[open] summary {
  margin-bottom: 8px;
  border-bottom: 1px solid #e0f2fe;
  padding-bottom: 6px;
}
.hw-step-guide .guide-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 6px;
}
@media (max-width: 600px) {
  .hw-step-guide .guide-grid {
    grid-template-columns: 1fr;
  }
}
.guide-card {
  background: #ffffff;
  border: 1px solid #e0f2fe;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12.5px;
  line-height: 1.35;
}
.guide-card strong {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #0c4a6e;
  font-size: 12.5px;
  margin-bottom: 3px;
}
`;
}

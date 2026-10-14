// Cognate strip for the Extra Help page: Grade 6 words that look and sound alike in English and
// Spanish, each with a small picture. English and Spanish only; every pair is a true cognate.
const sq = (x, y, cls) => `<rect x="${x}" y="${y}" width="16" height="16" rx="2" class="${cls}"/>`;
const grid = (cols, rows, shaded, x0, y0, size, cls = "a", rest = "z") =>
  Array.from({ length: cols * rows }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return `<rect x="${x0 + col * size}" y="${y0 + row * size}" width="${size - 1}" height="${size - 1}" class="${i < shaded ? cls : rest}"/>`;
  }).join("");

export const COGNATES = [
  {
    key: "ratio",
    en: "Ratio",
    es: "Razón",
    svg: `${[0, 1, 2].map((i) => sq(14 + i * 20, 8, "a")).join("")}${[0, 1].map((i) => sq(14 + i * 20, 32, "b")).join("")}<text x="78" y="30" class="t">3 : 2</text>`,
  },
  {
    key: "fraction",
    en: "Fraction",
    es: "Fracción",
    svg: `${grid(4, 1, 3, 10, 12, 24)}<text x="60" y="58" text-anchor="middle" class="t">3/4</text>`,
  },
  {
    key: "decimal",
    en: "Decimal",
    es: "Decimal",
    svg: `${grid(10, 1, 7, 10, 12, 10)}<text x="60" y="48" text-anchor="middle" class="t">0.7</text>`,
  },
  {
    key: "percent",
    en: "Percent",
    es: "Porcentaje",
    svg: `${grid(10, 4, 10, 10, 6, 10)}<text x="60" y="64" text-anchor="middle" class="t">25%</text>`,
  },
  {
    key: "coordinate",
    en: "Coordinate",
    es: "Coordenada",
    svg: `<line x1="14" y1="58" x2="106" y2="58" class="ax"/><line x1="14" y1="58" x2="14" y2="6" class="ax"/><line x1="74" y1="58" x2="74" y2="24" class="dash"/><line x1="14" y1="24" x2="74" y2="24" class="dash"/><circle cx="74" cy="24" r="5" class="pt"/><text x="80" y="20" class="t">(3, 2)</text>`,
  },
  {
    key: "inequality",
    en: "Inequality",
    es: "Desigualdad",
    svg: `<line x1="10" y1="36" x2="110" y2="36" class="ax"/><line x1="46" y1="36" x2="108" y2="36" class="ray"/><circle cx="46" cy="36" r="6" class="open"/><text x="46" y="58" text-anchor="middle" class="t">3</text><text x="76" y="22" text-anchor="middle" class="t">x &gt; 3</text>`,
  },
  {
    key: "equation",
    en: "Equation",
    es: "Ecuación",
    svg: `<line x1="60" y1="20" x2="60" y2="56" class="ax"/><line x1="20" y1="20" x2="100" y2="20" class="ax"/><path d="M12 34 h28 l-4 -12 h-20z" class="b"/><path d="M80 34 h28 l-4 -12 h-20z" class="b"/><text x="26" y="16" text-anchor="middle" class="t">x+2</text><text x="94" y="16" text-anchor="middle" class="t">5</text>`,
  },
  {
    key: "variable",
    en: "Variable",
    es: "Variable",
    svg: `<rect x="34" y="12" width="52" height="40" rx="6" class="b"/><text x="60" y="41" text-anchor="middle" class="big">n</text>`,
  },
  {
    key: "surface",
    en: "Surface area",
    es: "Área superficial",
    svg: `${sq(44, 4, "a")}${sq(28, 20, "a")}${sq(44, 20, "a")}${sq(60, 20, "a")}${sq(76, 20, "a")}${sq(44, 36, "a")}`,
  },
  {
    key: "volume",
    en: "Volume",
    es: "Volumen",
    svg: `<path d="M24 22 h44 v34 h-44z" class="a"/><path d="M24 22 l14 -12 h44 l-14 12z" class="b"/><path d="M68 22 l14 -12 v34 l-14 12z" class="z"/><text x="46" y="44" text-anchor="middle" class="t">V</text>`,
  },
];

const ico = (c) =>
  `<svg class="eh-cog-pic" viewBox="0 0 120 70" aria-hidden="true" focusable="false">${c.svg}</svg>`;

/** Static HTML for the strip. The speak buttons are `hidden` until the script confirms speech works. */
export function renderCognateStrip() {
  const cards = COGNATES.map(
    (c) => `<li class="eh-cog">${ico(c)}
<p class="eh-cog-en"><span lang="en">${c.en}</span></p>
<p class="eh-cog-es"><span lang="es">${c.es}</span></p>
<div class="eh-cog-say">
<button type="button" class="eh-say" data-say="${c.en}" data-lang="en-US" aria-label="Hear ${c.en} in English" hidden>English</button>
<button type="button" class="eh-say" data-say="${c.es}" data-lang="es-ES" lang="es" aria-label="Escuchar ${c.es} en español" hidden>Español</button>
</div></li>`,
  ).join("\n");
  return `<section class="eh-cognates" aria-labelledby="eh-cog-title">
<h2 id="eh-cog-title">Words that look alike <span lang="es">/ Palabras que se parecen</span></h2>
<p class="eh-cog-note">These math words are almost the same in English and Spanish. <span lang="es">Estas palabras de matemáticas son casi iguales en inglés y en español.</span></p>
<ul class="eh-cogs" role="list">
${cards}
</ul></section>`;
}

// Guided practice demonstrations: inline SVG animated with CSS keyframes (see tour.css).
// Each demo has visible text that says the same thing, and the page stops the motion on request
// or when the visitor prefers reduced motion. The math in both demos is checked in tour.test.mjs.
import { ui } from "./tour-steps.js";

// Ten-frame: 7 + 5. Seven dots, three more make ten, the last two start a second frame.
export const TENFRAME_FACTS = { start: 7, addend: 5, toTen: 3, rest: 2 };
// Hint ladder: 8 + 5. A slip (12), a hint (make ten), a retry (10 + 3), and the answer (13).
export const HINT_FACTS = { a: 8, b: 5, slip: 12, toTen: 2, rest: 3 };

const TEXT = {
  en: {
    tenframeAria: "Ten-frame demonstration",
    tenframe:
      "7 dots in a ten-frame. 3 more fill it to make 10. The last 2 go in a second frame. So 7 + 5 = 12.",
    tenframeSo: "So 7 + 5 = 12",
    hintsAria: "Hint ladder demonstration",
    hints:
      "Try 8 + 5 and get 12: not yet. Take a hint: make 10 first, 8 + 2 = 10. Retry: 10 + 3 = 13. Success: 8 + 5 = 13.",
    rungs: ["Try", "Hint", "Retry", "Got it"],
    hintLine: "Make 10: 8 + 2 = 10",
    notYet: "Not yet",
  },
  es: {
    tenframeAria: "Demostración con marco de diez",
    tenframe:
      "7 puntos en un marco de diez. 3 más lo llenan para formar 10. Los 2 que faltan van en un segundo marco. Entonces 7 + 5 = 12.",
    tenframeSo: "Entonces 7 + 5 = 12",
    hintsAria: "Demostración de la escalera de pistas",
    hints:
      "Intenta 8 + 5 y sale 12: aún no. Toma una pista: primero forma 10, 8 + 2 = 10. Otra vez: 10 + 3 = 13. Éxito: 8 + 5 = 13.",
    rungs: ["Intenta", "Pista", "Otra vez", "¡Listo!"],
    hintLine: "Forma 10: 8 + 2 = 10",
    notYet: "Aún no",
  },
};

const cell = (x, y, kind, index) =>
  `<circle class="td-dot td-${kind}" style="--i:${index}" cx="${x + 12}" cy="${y + 12}" r="10"/>`;

function tenframe(lang) {
  const text = TEXT[lang];
  const cells = [];
  const dots = [];
  for (const [frame, x0] of [
    [0, 8],
    [1, 168],
  ]) {
    cells.push(`<rect class="td-frame" x="${x0}" y="18" width="144" height="72" rx="8"/>`);
    for (let n = 0; n < 10; n += 1) {
      const x = x0 + 8 + (n % 5) * 27;
      const y = 26 + Math.floor(n / 5) * 28;
      cells.push(`<rect class="td-cell" x="${x}" y="${y}" width="24" height="24" rx="4"/>`);
      if (frame === 0) dots.push(cell(x, y, n < TENFRAME_FACTS.start ? "a" : "b", n % 5));
      else if (n < TENFRAME_FACTS.rest) dots.push(cell(x, y, "c", n));
    }
  }
  return `<svg class="td-svg" viewBox="0 0 320 150" aria-hidden="true" focusable="false">
    ${cells.join("")}${dots.join("")}
    <text class="td-label td-lb" x="80" y="116" text-anchor="middle">7 + 3 = 10</text>
    <text class="td-label td-lc" x="240" y="116" text-anchor="middle">10 + 2 = 12</text>
    <text class="td-label td-eq" x="160" y="142" text-anchor="middle">${text.tenframeSo}</text>
  </svg>`;
}

function hints(lang) {
  const text = TEXT[lang];
  const lines = [
    ["8 + 5 = 12", text.notYet, "x"],
    [text.hintLine, "", "i"],
    ["10 + 3 = 13", "", "r"],
    ["8 + 5 = 13", "", "v"],
  ];
  const mark = {
    x: "M0 0l12 12M12 0L0 12",
    v: "M0 7l4.5 5L13 0",
    i: "M6 12V6m0-6v1",
    r: "M0 6h12m-5-5l5 5-5 5",
  };
  const rows = lines.map(([line, note, kind], row) => {
    const y = 6 + row * 42;
    return `<g class="td-row td-row${row}">
      <rect class="td-card td-card-${kind}" x="4" y="${y}" width="312" height="36" rx="8"/>
      <text class="td-rung" x="14" y="${y + 23}">${text.rungs[row]}</text>
      <text class="td-line" x="84" y="${y + 23}">${line}</text>
      ${note ? `<text class="td-note" x="284" y="${y + 23}" text-anchor="end">${note}</text>` : ""}
      <path class="td-mark td-mark-${kind}" transform="translate(296 ${y + 11})" d="${mark[kind]}"/>
    </g>`;
  });
  return `<svg class="td-svg" viewBox="0 0 320 176" aria-hidden="true" focusable="false">${rows.join("")}</svg>`;
}

export const DEMOS = { tenframe, hints };

export function demoHtml(name, lang) {
  const draw = DEMOS[name];
  if (!draw) return "";
  const language = lang === "es" ? "es" : "en";
  const text = TEXT[language];
  return `<figure class="tour-demo" role="group" aria-label="${ui(language, "demoLabel")}: ${text[`${name}Aria`]}" data-demo="${name}">
    ${draw(language)}
    <figcaption class="tour-demo-text">${text[name]}</figcaption>
    <button type="button" class="tour-demo-toggle" aria-pressed="false" data-pause="${ui(language, "pause")}" data-play="${ui(language, "play")}">${ui(language, "pause")}</button>
  </figure>`;
}

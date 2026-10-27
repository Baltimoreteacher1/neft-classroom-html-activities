// Playing-card art for Family Math Duel: number cards, exponent cards, operator cards and score pips. Each card is a
// small inline SVG drawn from the card's own text (aria-hidden: the button that holds it carries the spoken label).
// Shapes differ by kind, so a card is never told apart by colour alone: number = rounded rectangle, exponent = rounded
// rectangle with a raised "^" tab, operator = diamond. @fm2 FM-016 FM-036
import { PALETTE } from "./base.js";
import { escapeHtml } from "../lang.js";

const FONT = "Atkinson Hyperlegible, system-ui, sans-serif";
export const CARD_W = 64;
export const CARD_H = 88;

const sizeFor = (text) =>
  text.length <= 2 ? 34 : text.length <= 4 ? 26 : text.length <= 6 ? 19 : 14;

// Dot pips (the way playing cards show small counts) arranged in two columns under the numeral.
function pipDots(count) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    out.push(
      `<circle cx="${22 + col * 20}" cy="${58 + row * 6.4}" r="2.4" fill="${PALETTE.violet}"/>`,
    );
  }
  return out.join("");
}

const wrap = (body, extra = "") =>
  `<svg class="fd-card-art" viewBox="0 0 ${CARD_W} ${CARD_H}" aria-hidden="true" focusable="false" ${extra}>${body}</svg>`;

export function numberCard(text, { pips = false, value = null } = {}) {
  const t = String(text);
  const dots = pips && Number.isInteger(value) && value >= 1 && value <= 10 ? pipDots(value) : "";
  const y = dots ? 44 : 55;
  return wrap(
    `<rect x="2" y="2" width="60" height="84" rx="9" fill="${PALETTE.paper}" stroke="${PALETTE.ink}" stroke-width="2.5"/>
    <text x="8" y="16" font-size="11" font-weight="700" fill="${PALETTE.muted}" font-family="${FONT}">${escapeHtml(t.length <= 4 ? t : "")}</text>
    <text x="32" y="${y}" text-anchor="middle" font-size="${sizeFor(t)}" font-weight="800" fill="${PALETTE.ink}" font-family="${FONT}">${escapeHtml(t)}</text>${dots}`,
  );
}

export function exponentCard(text) {
  const t = String(text);
  return wrap(
    `<rect x="2" y="10" width="60" height="76" rx="9" fill="${PALETTE.skySoft}" stroke="${PALETTE.ink}" stroke-width="2.5"/>
    <path d="M10 10 L18 2 L26 10" fill="${PALETTE.skySoft}" stroke="${PALETTE.ink}" stroke-width="2.5" stroke-linejoin="round"/>
    <text x="45" y="30" font-size="13" font-weight="800" fill="${PALETTE.sky}" font-family="${FONT}">^</text>
    <text x="32" y="63" text-anchor="middle" font-size="${sizeFor(t)}" font-weight="800" fill="${PALETTE.ink}" font-family="${FONT}">${escapeHtml(t)}</text>`,
  );
}

export function operatorCard(symbol) {
  return wrap(
    `<path d="M32 3 L61 44 L32 85 L3 44 Z" fill="${PALETTE.goldSoft}" stroke="${PALETTE.ink}" stroke-width="2.5" stroke-linejoin="round"/>
    <text x="32" y="56" text-anchor="middle" font-size="36" font-weight="800" fill="${PALETTE.ink}" font-family="${FONT}">${escapeHtml(symbol)}</text>`,
  );
}

export function cardArt(card) {
  if (card.kind === "op") return operatorCard(card.text);
  if (card.kind === "exp") return exponentCard(card.text);
  return numberCard(card.text, { pips: card.pips, value: card.small });
}

export function backCard() {
  return wrap(
    `<rect x="2" y="2" width="60" height="84" rx="9" fill="${PALETTE.violet}" stroke="${PALETTE.ink}" stroke-width="2.5"/>
    <rect x="9" y="9" width="46" height="70" rx="6" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="4 4"/>
    <circle cx="32" cy="44" r="9" fill="#fff"/>`,
  );
}

// A row of score pips: filled circles for points earned, hollow for the rest, up to `max` shown. The number is always
// printed beside it by the caller, so the pips are decoration, never the only carrier.
export function scorePips(score, max = 8) {
  const shown = Math.min(Math.max(score, 0), max);
  const total = Math.max(max, shown);
  const dots = Array.from({ length: total }, (_, i) => {
    const filled = i < shown;
    return `<circle cx="${8 + i * 14}" cy="8" r="5" fill="${filled ? PALETTE.gold : PALETTE.paper}" stroke="${PALETTE.ink}" stroke-width="1.6"/>`;
  }).join("");
  return `<svg class="fd-pips-art" viewBox="0 0 ${total * 14 + 2} 16" aria-hidden="true" focusable="false">${dots}</svg>`;
}

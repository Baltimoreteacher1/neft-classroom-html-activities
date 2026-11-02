// Coins and bills for the Math Market: original, neutral designs (no portraits), every piece labelled by its value.
// Penny, nickel, dime and quarter keep their real size order; $1, $5, $10 and $20 bills share one layout and differ
// by tint and numerals, so value never depends on color alone. @fm2 FM-036 FM-059
import { PALETTE } from "./base.js";

const COIN = {
  1: { r: 21, fill: "#f4c9a9", stroke: "#8f4c29", text: "1¢", font: 16, reeded: false },
  5: { r: 24, fill: "#e3e6ee", stroke: "#4d5575", text: "5¢", font: 16, reeded: false },
  10: { r: 19, fill: "#eef0f6", stroke: "#4d5575", text: "10¢", font: 14, reeded: true },
  25: { r: 27, fill: "#d6dae8", stroke: "#3d4466", text: "25¢", font: 16, reeded: true },
};
const BILL = {
  100: { fill: PALETTE.mintSoft, stroke: "#13694a", text: "$1" },
  500: { fill: PALETTE.tealSoft, stroke: "#17324D", text: "$5" },
  1000: { fill: PALETTE.goldSoft, stroke: "#7a520a", text: "$10" },
  2000: { fill: PALETTE.skySoft, stroke: "#1b4f8c", text: "$20" },
};

export const valueLabel = (cents) => (cents < 100 ? `${cents}¢` : `$${cents / 100}`);

// A small neutral emblem above the value: leaf, diamond, triangle or star, one per coin.
function emblem(cents, stroke) {
  const shapes = {
    1: `<path d="M30 10 C36 14 36 20 30 24 C24 20 24 14 30 10Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>`,
    5: `<path d="M30 10 L36 17 L30 24 L24 17Z" fill="none" stroke="${stroke}" stroke-width="1.6"/>`,
    10: `<path d="M30 12 L35 21 L25 21Z" fill="none" stroke="${stroke}" stroke-width="1.4"/>`,
    25: `<path d="M30 9 L32.4 15.6 L39.4 15.9 L33.9 20.2 L35.8 27 L30 23 L24.2 27 L26.1 20.2 L20.6 15.9 L27.6 15.6Z" fill="none" stroke="${stroke}" stroke-width="1.5"/>`,
  };
  return shapes[cents];
}

// Display size keeps the real order dime < penny < nickel < quarter; `size` is the quarter's pixel width.
export function coinSvg(cents, { size = 56 } = {}) {
  const c = COIN[cents];
  const px = Math.round((size * (c.r + 3)) / 30);
  const edge = c.reeded ? ' stroke-dasharray="2.2 1.6"' : "";
  return `<svg class="mm-coin" viewBox="0 0 60 60" width="${px}" height="${px}" aria-hidden="true" focusable="false">
    <circle cx="30" cy="30" r="${c.r}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="3"${edge}/>
    <circle cx="30" cy="30" r="${c.r - 4.5}" fill="none" stroke="${c.stroke}" stroke-width="1.2" opacity=".6"/>
    ${emblem(cents, c.stroke)}
    <text x="30" y="${cents === 10 ? 40 : 42}" text-anchor="middle" font-size="${c.font}" font-weight="800" fill="${PALETTE.ink}" font-family="Atkinson Hyperlegible, system-ui, sans-serif">${c.text}</text>
  </svg>`;
}

export function billSvg(cents, { size = 120 } = {}) {
  const b = BILL[cents];
  const height = Math.round((size * 64) / 150);
  const mark = `font-weight="800" fill="${PALETTE.ink}" font-family="Atkinson Hyperlegible, system-ui, sans-serif"`;
  return `<svg class="mm-bill" viewBox="0 0 150 64" width="${size}" height="${height}" aria-hidden="true" focusable="false">
    <rect x="2" y="2" width="146" height="60" rx="6" fill="${b.fill}" stroke="${b.stroke}" stroke-width="3"/>
    <rect x="8" y="8" width="134" height="48" rx="4" fill="none" stroke="${b.stroke}" stroke-width="1.2" stroke-dasharray="3 2"/>
    <path d="M14 22 H34 M14 32 H30 M14 42 H34 M116 22 H136 M120 32 H136 M116 42 H136" stroke="${b.stroke}" stroke-width="1.4" opacity=".55"/>
    <ellipse cx="75" cy="32" rx="30" ry="21" fill="${PALETTE.paper}" stroke="${b.stroke}" stroke-width="2"/>
    <text x="75" y="40" text-anchor="middle" font-size="24" ${mark}>${b.text}</text>
    <text x="13" y="19" font-size="11" ${mark}>${b.text}</text>
    <text x="137" y="53" text-anchor="end" font-size="11" ${mark}>${b.text}</text>
  </svg>`;
}

export const pieceSvg = (cents, options) => (cents < 100 ? coinSvg(cents, options) : billSvg(cents, options));

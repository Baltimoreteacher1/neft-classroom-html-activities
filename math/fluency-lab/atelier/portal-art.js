// Authored artwork for the three home portals. Each drawing states true mathematics:
// Learn  — an area model of 23 × 14 split into 20 + 3 by 10 + 4 (200 + 80 + 30 + 12 = 322);
// Practice — hops of 5, 5 and 3 along a number line from 0 land on 13;
// Play   — two number tiles, 3 × 8, combine into the target 24.
// Decorative only (aria-hidden at the call site): each portal's text carries its meaning.
export const PORTAL_ART = {
  learn: `<svg viewBox="0 0 240 150" focusable="false">
    <defs>
      <linearGradient id="at-pl-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#85d8cb"/><stop offset="1" stop-color="#087e88"/></linearGradient>
      <linearGradient id="at-pl-b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c7d5de"/><stop offset="1" stop-color="#7f9bb8"/></linearGradient>
      <linearGradient id="at-pl-c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3c9ae"/><stop offset="1" stop-color="#e6a688"/></linearGradient>
    </defs>
    <ellipse cx="128" cy="138" rx="96" ry="8" fill="#080f25" opacity=".18"/>
    <g transform="translate(46 22)" stroke="#13294b" stroke-width="1.2">
      <path d="M0 0l10-8h153l-10 8z" fill="#e9f6f3"/><path d="M153 0l10-8v104l-10 8z" fill="#5d7aa0"/>
      <rect width="133" height="74" fill="url(#at-pl-a)"/><rect x="133" width="20" height="74" fill="url(#at-pl-b)"/>
      <rect y="74" width="133" height="30" fill="url(#at-pl-b)"/><rect x="133" y="74" width="20" height="30" fill="url(#at-pl-c)"/>
    </g>
    <g font-family="Lexend, sans-serif" font-weight="600" fill="#080f25" text-anchor="middle">
      <text x="112" y="65" font-size="16" fill="#fff">200</text><text x="221" y="62" font-size="10" fill="#13294b" text-anchor="start">30</text>
      <text x="112" y="114" font-size="12">80</text><text x="221" y="114" font-size="10" fill="#13294b" text-anchor="start">12</text>
      <text x="112" y="11" font-size="10" fill="#13294b">20</text><text x="189" y="11" font-size="10" fill="#13294b">3</text>
      <text x="36" y="63" font-size="10" fill="#13294b">10</text><text x="36" y="112" font-size="10" fill="#13294b">4</text>
    </g>
  </svg>`,
  practice: `<svg viewBox="0 0 240 150" focusable="false">
    <ellipse cx="120" cy="136" rx="104" ry="7" fill="#080f25" opacity=".18"/>
    <path d="M18 112h204" stroke="#13294b" stroke-width="2.4" stroke-linecap="round"/>
    <g stroke="#13294b" stroke-width="1.6">${Array.from({ length: 21 }, (_, i) => `<path d="M${20 + i * 10} ${i % 5 ? 107 : 103}v${i % 5 ? 10 : 18}"/>`).join("")}</g>
    <g font-family="Lexend, sans-serif" font-size="10" font-weight="600" fill="#13294b" text-anchor="middle"><text x="20" y="134">0</text><text x="70" y="134">5</text><text x="120" y="134">10</text><text x="170" y="134">15</text><text x="220" y="134">20</text></g>
    <g fill="none" stroke-width="3.2" stroke-linecap="round">
      <path d="M20 106C28 64 62 64 70 106" stroke="#087e88"/><path d="M70 106C78 64 112 64 120 106" stroke="#087e88"/><path d="M120 106C125 78 145 78 150 106" stroke="#c97d5d"/>
    </g>
    <g font-family="Lexend, sans-serif" font-size="12" font-weight="700" text-anchor="middle"><text x="45" y="62" fill="#05545c">+5</text><text x="95" y="62" fill="#05545c">+5</text><text x="135" y="74" fill="#8e4f38">+3</text></g>
    <circle cx="150" cy="112" r="7" fill="#e6a688" stroke="#8e4f38" stroke-width="1.6"/>
    <g transform="translate(160 22)"><rect width="60" height="34" rx="9" fill="#13294b"/><text x="30" y="23" font-family="Lexend, sans-serif" font-size="15" font-weight="700" fill="#fdfbf5" text-anchor="middle">= 13</text></g>
  </svg>`,
  play: `<svg viewBox="0 0 240 150" focusable="false">
    <defs><linearGradient id="at-pp-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfbf5"/><stop offset="1" stop-color="#e9e2d5"/></linearGradient></defs>
    <g fill="none" stroke="#28447c" stroke-opacity=".22" stroke-width="1">${Array.from({ length: 7 }, (_, i) => `<path d="M${-10 + i * 40} 150l40-70 40 70M${10 + i * 40} 80l40-70"/>`).join("")}</g>
    <ellipse cx="120" cy="136" rx="100" ry="7" fill="#080f25" opacity=".18"/>
    <g font-family="Lexend, sans-serif" font-weight="700" text-anchor="middle">
      <g transform="translate(26 54) rotate(-6)"><path d="M0 0l8-7h48l-8 7z" fill="#fffaf0"/><path d="M48 0l8-7v48l-8 7z" fill="#cfc6b5"/><rect width="48" height="48" rx="4" fill="url(#at-pp-t)" stroke="#b9ae9b"/><text x="24" y="33" font-size="24" fill="#13294b">3</text></g>
      <g transform="translate(92 60) rotate(5)"><path d="M0 0l8-7h48l-8 7z" fill="#fffaf0"/><path d="M48 0l8-7v48l-8 7z" fill="#cfc6b5"/><rect width="48" height="48" rx="4" fill="url(#at-pp-t)" stroke="#b9ae9b"/><text x="24" y="33" font-size="24" fill="#13294b">8</text></g>
      <text x="82" y="90" font-size="18" fill="#c97d5d">×</text>
      <path d="M150 84h18" stroke="#087e88" stroke-width="3" stroke-linecap="round"/><path d="M164 78l6 6-6 6" fill="none" stroke="#087e88" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M200 52l22 13v26l-22 13-22-13V65z" fill="#087e88" stroke="#05545c" stroke-width="1.6"/><text x="200" y="86" font-size="20" fill="#fdfbf5">24</text>
    </g>
  </svg>`,
};

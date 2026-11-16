// Original illustrations for the flagship Language Games, in the Book Studio art style (flat editorial, 2.5px #1b1f3b
// outlines, no text, no ids, no scripts, no external refs): a padlock (shut and open), a museum door with a keypad, a
// case file, a newspaper stack, a quest-map path and a speech pair. 200x200 unless noted. `flagArtSrc(key)` returns a
// data: URL for an <img>.
const D = "#1b1f3b";
const NAVY = "#1b2a5c";
const TEAL = "#075568";
const AQUA = "#1fa6a2";
const IVORY = "#fffaf0";
const AMBER = "#f2b134";
const CORAL = "#e86a50";
const SAGE = "#7fb48a";
const ROSE = "#8a3a5c";
const COPPER = "#9a4a26";
const PAPER = "#f3ead8";
const NS = 'stroke="none"';

const svg = (vb, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><g fill="none" stroke="${D}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
const sq = (b) => svg("0 0 200 200", b);
const wide = (b) => svg("0 0 400 300", b);

const shackle = (open) =>
  open
    ? `<path d="M62 92 V62 a38 38 0 0 1 76 0 V70" stroke-width="16" stroke="${D}"/><path d="M62 92 V62 a38 38 0 0 1 76 0 V70" stroke-width="10" stroke="#c9ced8"/>`
    : `<path d="M62 100 V70 a38 38 0 0 1 76 0 V100" stroke-width="16" stroke="${D}"/><path d="M62 100 V70 a38 38 0 0 1 76 0 V100" stroke-width="10" stroke="#c9ced8"/>`;
const body = (fill) =>
  `<rect x="40" y="92" width="120" height="88" rx="16" fill="${fill}"/><path d="M48 102 h104" stroke="${IVORY}" stroke-width="3" opacity=".6"/><circle cx="100" cy="128" r="11" fill="${D}" ${NS}/><path d="M100 132 v22" stroke-width="9"/>`;

export const FLAG_ART = {
  "lock-shut": sq(`${shackle(false)}${body(AMBER)}`),
  "lock-open": sq(
    `<g transform="rotate(-14 138 70)">${shackle(true)}</g>${body(SAGE)}<path d="M150 30 l10 -10 M164 44 l14 -4 M136 22 l2 -14" stroke="${AMBER}" stroke-width="5"/>`,
  ),
  door: svg(
    "0 0 200 300",
    `<rect x="20" y="16" width="160" height="276" rx="8" fill="${NAVY}"/><rect x="34" y="30" width="132" height="262" rx="4" fill="${COPPER}"/><rect x="48" y="46" width="104" height="88" rx="4" fill="#b2603a"/><rect x="48" y="150" width="104" height="128" rx="4" fill="#b2603a"/><rect x="128" y="150" width="30" height="46" rx="5" fill="${D}"/><g fill="${AQUA}" ${NS}><rect x="133" y="156" width="6" height="6"/><rect x="141" y="156" width="6" height="6"/><rect x="149" y="156" width="6" height="6"/><rect x="133" y="165" width="6" height="6"/><rect x="141" y="165" width="6" height="6"/><rect x="149" y="165" width="6" height="6"/><rect x="133" y="174" width="6" height="6"/><rect x="141" y="174" width="6" height="6"/><rect x="149" y="174" width="6" height="6"/></g><circle cx="143" cy="188" r="3" fill="${CORAL}" ${NS}/><circle cx="120" cy="212" r="7" fill="${AMBER}"/>`,
  ),
  "door-open": svg(
    "0 0 200 300",
    `<rect x="20" y="16" width="160" height="276" rx="8" fill="${NAVY}"/><rect x="34" y="30" width="132" height="262" fill="#fff3c4"/><path d="M34 292 L100 292 L166 230" stroke="${AMBER}" stroke-width="3" opacity=".7"/><path d="M34 30 L84 50 L84 282 L34 292 Z" fill="${COPPER}"/><circle cx="74" cy="170" r="6" fill="${AMBER}"/>`,
  ),
  "case-file": sq(
    `<path d="M24 52 h56 l12 14 h84 v112 h-152 Z" fill="${AMBER}"/><rect x="38" y="40" width="112" height="128" rx="3" fill="${IVORY}" transform="rotate(-4 94 104)"/><path d="M52 62 h70 M52 78 h82 M52 94 h60 M52 110 h76" stroke="${TEAL}" stroke-width="3" transform="rotate(-4 94 104)"/><path d="M24 88 h152 v90 h-152 Z" fill="#e8a020"/><rect x="104" y="112" width="58" height="22" rx="3" fill="${CORAL}"/><circle cx="58" cy="138" r="20" fill="none" stroke-width="6"/><path d="M72 152 l18 18" stroke-width="9"/>`,
  ),
  "news-stack": sq(
    `<rect x="30" y="118" width="148" height="56" rx="4" fill="#d9d2c2" transform="rotate(4 104 146)"/><rect x="22" y="40" width="156" height="124" rx="4" fill="${PAPER}"/><rect x="34" y="52" width="132" height="18" rx="2" fill="${NAVY}"/><rect x="34" y="80" width="62" height="46" rx="2" fill="${AQUA}"/><path d="M42 118 l14 -16 l12 10 l10 -12 l12 18" stroke="${IVORY}" stroke-width="3"/><path d="M106 84 h60 M106 96 h60 M106 108 h48 M106 120 h56 M34 138 h132 M34 150 h104" stroke="${D}" stroke-width="3" opacity=".75"/><path d="M150 18 l-8 26 M168 26 l-16 22" stroke="${CORAL}" stroke-width="5"/>`,
  ),
  "quest-map": wide(
    `<rect x="10" y="10" width="380" height="280" rx="18" fill="${PAPER}"/><path d="M10 210 Q120 170 200 230 T390 200 V290 H10 Z" fill="${SAGE}" opacity=".55" ${NS}/><path d="M10 80 Q90 60 150 90 T260 70 T390 90 V10 H10 Z" fill="#cfe6ee" ${NS}/><path d="M60 230 C110 150 150 250 200 170 S300 110 340 70" stroke="${COPPER}" stroke-width="5" stroke-dasharray="4 12"/><g><circle cx="60" cy="230" r="16" fill="${CORAL}"/><circle cx="140" cy="196" r="16" fill="${AMBER}"/><circle cx="230" cy="150" r="16" fill="${AQUA}"/><circle cx="340" cy="70" r="18" fill="${ROSE}"/></g><path d="M330 40 v-26 l22 8 l-22 8" fill="${AMBER}"/>`,
  ),
  "speech-pair": sq(
    `<path d="M20 36 h110 a14 14 0 0 1 14 14 v44 a14 14 0 0 1 -14 14 h-62 l-22 22 v-22 h-26 a14 14 0 0 1 -14 -14 v-44 a14 14 0 0 1 14 -14 Z" fill="${AQUA}"/><path d="M180 92 h-96 a14 14 0 0 0 -14 14 v42 a14 14 0 0 0 14 14 h54 l22 22 v-22 h20 a14 14 0 0 0 14 -14 v-42 a14 14 0 0 0 -14 -14 Z" fill="${AMBER}"/><path d="M40 64 h70 M40 80 h48 M96 120 h66 M96 136 h44" stroke="${IVORY}" stroke-width="5"/>`,
  ),
};

export const FLAG_ART_FOR = {
  "escape-room": "lock-shut",
  "evidence-detective": "case-file",
  "conversation-quest": "speech-pair",
  "newsroom-challenge": "news-stack",
};

const cache = new Map();
export function flagArtSrc(key) {
  if (!cache.has(key))
    cache.set(
      key,
      FLAG_ART[key] ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FLAG_ART[key])}` : "",
    );
  return cache.get(key);
}

// Hero illustrations for the three publishing studios, drawn as inline SVG from the design-system tokens
// (colors come from classes in studio-labs.css, so they follow the lab palette). Decorative: callers mark them aria-hidden.
const svg = (inner, label = "") =>
  `<svg class="sa" viewBox="0 0 320 220" width="320" height="220" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"'}>${inner}</svg>`;

const tile = (x, y, w, text, cls) =>
  `<g><rect class="sa-tile ${cls}" x="${x}" y="${y}" width="${w}" height="54" rx="12" /><text class="sa-t" x="${x + w / 2}" y="${y + 34}" text-anchor="middle">${text}</text></g>`;

const ART = {
  wordlab: () =>
    svg(
      `<ellipse class="sa-soft" cx="160" cy="190" rx="130" ry="18" />
       ${tile(24, 60, 70, "re-", "a")}${tile(124, 60, 92, "play", "b")}${tile(246, 60, 52, "-er", "c")}
       <text class="sa-p" x="108" y="94" text-anchor="middle">+</text><text class="sa-p" x="232" y="94" text-anchor="middle">+</text>
       <path class="sa-line" d="M60 130 Q160 170 270 130" fill="none" />
       <rect class="sa-bar" x="104" y="146" width="112" height="30" rx="15" /><text class="sa-t sm" x="160" y="167" text-anchor="middle">replayer</text>
       <path class="sa-stem" d="M160 40 V16" /><ellipse class="sa-leaf" cx="148" cy="22" rx="12" ry="6" transform="rotate(-25 148 22)" /><ellipse class="sa-leaf" cx="172" cy="22" rx="12" ry="6" transform="rotate(25 172 22)" />`,
    ),
  scenarios: () =>
    svg(
      `<ellipse class="sa-soft" cx="160" cy="196" rx="130" ry="16" />
       <rect class="sa-bubble a" x="20" y="22" width="150" height="62" rx="18" /><path class="sa-bubble a" d="M52 84 l-6 24 l28 -24z" />
       <rect class="sa-line-bar" x="38" y="40" width="112" height="8" rx="4" /><rect class="sa-line-bar" x="38" y="58" width="76" height="8" rx="4" />
       <rect class="sa-bubble b" x="150" y="96" width="150" height="62" rx="18" /><path class="sa-bubble b" d="M264 158 l8 24 l-30 -24z" />
       <rect class="sa-line-bar w" x="168" y="114" width="112" height="8" rx="4" /><rect class="sa-line-bar w" x="168" y="132" width="90" height="8" rx="4" />
       <circle class="sa-head a" cx="48" cy="150" r="22" /><rect class="sa-body a" x="22" y="170" width="52" height="34" rx="16" />
       <circle class="sa-head b" cx="272" cy="56" r="20" /><rect class="sa-body b" x="248" y="74" width="48" height="20" rx="10" />`,
    ),
  newsroom: () =>
    svg(
      `<ellipse class="sa-soft" cx="160" cy="196" rx="130" ry="16" />
       <rect class="sa-paper" x="40" y="14" width="190" height="176" rx="10" /><rect class="sa-mast" x="54" y="26" width="162" height="26" rx="4" />
       <rect class="sa-pic" x="54" y="62" width="76" height="58" rx="4" /><path class="sa-hill" d="M54 120 L80 90 L98 108 L112 94 L130 120z" /><circle class="sa-sun" cx="112" cy="76" r="7" />
       <rect class="sa-line-bar" x="140" y="64" width="76" height="7" rx="3" /><rect class="sa-line-bar" x="140" y="80" width="76" height="7" rx="3" /><rect class="sa-line-bar" x="140" y="96" width="60" height="7" rx="3" />
       <rect class="sa-line-bar" x="54" y="134" width="162" height="7" rx="3" /><rect class="sa-line-bar" x="54" y="150" width="162" height="7" rx="3" /><rect class="sa-line-bar" x="54" y="166" width="110" height="7" rx="3" />
       <rect class="sa-mic" x="254" y="54" width="28" height="56" rx="14" /><path class="sa-line" d="M244 96 a24 24 0 0 0 48 0" fill="none" /><path class="sa-line" d="M268 120 V160 M248 160 H288" fill="none" />`,
    ),
};
export const heroArt = (kind) => (ART[kind] || ART.wordlab)();

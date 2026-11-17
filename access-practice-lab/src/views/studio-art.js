// Hero illustrations for the three publishing studios, drawn as inline SVG from the design-system tokens
// (colors come from classes in studio-labs.css, so they follow the lab palette). Decorative: callers mark them aria-hidden.
// Style: the site illustration kit's flat picture-book look. No outlines: each shape gets a soft drop shadow
// (sa-shade), a lit edge (sa-lit) and a shade side (sa-dark), all tinted by class so the tokens stay in control.
const svg = (inner, label = "") =>
  `<svg class="sa" viewBox="0 0 320 220" width="320" height="220" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"'}>${inner}</svg>`;

/** A rounded card with a soft shadow below and a lit band on top. */
const card = (x, y, w, h, r, cls, lit = true) =>
  `<rect class="sa-shade" x="${x + 2}" y="${y + 6}" width="${w}" height="${h}" rx="${r}"/><rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>${lit ? `<rect class="sa-lit" x="${x + 6}" y="${y + 4}" width="${w - 12}" height="${Math.min(10, h / 5)}" rx="${Math.min(5, h / 10)}"/>` : ""}`;

const tile = (x, y, w, text, cls) =>
  `<g>${card(x, y, w, 54, 12, `sa-tile ${cls}`)}<text class="sa-t" x="${x + w / 2}" y="${y + 36}" text-anchor="middle">${text}</text></g>`;

/** A speech bubble with its tail; `left` puts the tail on the lower left. */
const bubble = (x, y, w, h, cls, left) => {
  const tail = left
    ? `M${x + 30} ${y + h - 2} l-8 26 l32 -26z`
    : `M${x + w - 36} ${y + h - 2} l10 26 l-34 -26z`;
  return `<path class="sa-shade" d="${tail}" transform="translate(2 6)"/><rect class="sa-shade" x="${x + 2}" y="${y + 6}" width="${w}" height="${h}" rx="18"/><path class="sa-bubble ${cls}" d="${tail}"/><rect class="sa-bubble ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/><rect class="sa-lit" x="${x + 12}" y="${y + 5}" width="${w - 24}" height="8" rx="4"/>`;
};

/** A friendly head-and-shoulders figure: body and head take the a/b tone, hair and face details by class. */
const figure = (cx, top, cls, s = 1, flip = false) =>
  `<g transform="translate(${cx} ${top}) scale(${flip ? -s : s} ${s})"><ellipse class="sa-shade" cx="0" cy="62" rx="34" ry="5"/><path class="sa-body ${cls}" d="M-28 62 v-16 q0 -22 28 -22 q28 0 28 22 v16z"/><path class="sa-dark" d="M10 26 q18 4 18 20 v16 h-14z"/><path class="sa-glint" d="M-14 30 q14 6 28 0"/><rect class="sa-head ${cls}" x="-6" y="14" width="12" height="14" rx="4"/><rect class="sa-dark" x="-6" y="14" width="12" height="14" rx="4"/><circle class="sa-head ${cls}" cx="0" cy="0" r="20"/><path class="sa-dark" d="M4 -19.6 a20 20 0 0 1 0 39.2 a15 20 0 0 0 0 -39.2z"/><path class="sa-hair" d="M-21 2 a21 22 0 0 1 42 -4 q-12 -10 -24 -6 q-10 2 -18 10z"/><circle class="sa-eye" cx="2" cy="1" r="2"/><circle class="sa-eye" cx="12" cy="1" r="2"/><path class="sa-smile" d="M3 9 q4 4 8 0"/><ellipse class="sa-blush" cx="-1" cy="8" rx="3" ry="1.8"/><ellipse class="sa-blush" cx="16" cy="8" rx="3" ry="1.8"/></g>`;

const ART = {
  wordlab: () =>
    svg(
      `<ellipse class="sa-soft" cx="160" cy="194" rx="130" ry="14" />
       ${tile(24, 60, 70, "re-", "a")}${tile(124, 60, 92, "play", "b")}${tile(246, 60, 52, "-er", "c")}
       <text class="sa-p" x="109" y="96" text-anchor="middle">+</text><text class="sa-p" x="231" y="96" text-anchor="middle">+</text>
       <path class="sa-line" d="M59 126 Q100 150 146 150 M170 126 V146 M272 126 Q230 150 174 150" fill="none" />
       ${card(98, 146, 124, 34, 17, "sa-bar", false)}<text class="sa-t sm on" x="160" y="169" text-anchor="middle">replayer</text>
       <path class="sa-stem" d="M170 60 V20" /><path class="sa-leaf" d="M170 34 q-20 -2 -24 -18 q18 0 24 18z" /><path class="sa-leaf" d="M170 28 q18 -4 24 -20 q-20 0 -24 20z" /><path class="sa-glint" d="M168 32 q-10 -4 -16 -12" />`,
    ),
  scenarios: () =>
    svg(
      `<ellipse class="sa-soft" cx="160" cy="198" rx="134" ry="14" />
       ${bubble(20, 20, 150, 62, "a", true)}
       <rect class="sa-line-bar" x="38" y="40" width="112" height="8" rx="4" /><rect class="sa-line-bar" x="38" y="58" width="76" height="8" rx="4" />
       ${bubble(150, 96, 150, 62, "b", false)}
       <rect class="sa-line-bar w" x="168" y="116" width="112" height="8" rx="4" /><rect class="sa-line-bar w" x="168" y="134" width="90" height="8" rx="4" />
       ${figure(54, 130, "a")}${figure(272, 34, "b", 0.78, true)}`,
    ),
  newsroom: () =>
    svg(
      `<ellipse class="sa-soft" cx="160" cy="198" rx="134" ry="14" />
       <rect class="sa-shade" x="44" y="22" width="190" height="176" rx="10" transform="rotate(-2 139 110)" />
       <rect class="sa-paper" x="40" y="14" width="190" height="176" rx="10" /><rect class="sa-dark" x="216" y="14" width="14" height="176" rx="7" />
       <rect class="sa-mast" x="54" y="26" width="162" height="26" rx="4" /><rect class="sa-lit" x="62" y="33" width="80" height="5" rx="2.5" />
       <rect class="sa-pic" x="54" y="62" width="76" height="58" rx="4" /><path class="sa-hill" d="M54 120 L80 90 L98 108 L112 94 L130 120z" /><path class="sa-dark" d="M80 90 L98 108 L92 120 H74z" /><circle class="sa-sun" cx="112" cy="76" r="7" />
       <rect class="sa-line-bar" x="140" y="64" width="76" height="7" rx="3" /><rect class="sa-line-bar" x="140" y="80" width="76" height="7" rx="3" /><rect class="sa-line-bar" x="140" y="96" width="60" height="7" rx="3" />
       <rect class="sa-line-bar" x="54" y="134" width="162" height="7" rx="3" /><rect class="sa-line-bar" x="54" y="150" width="162" height="7" rx="3" /><rect class="sa-line-bar" x="54" y="166" width="110" height="7" rx="3" />
       <ellipse class="sa-shade" cx="268" cy="186" rx="26" ry="5" />
       <path class="sa-line" d="M244 96 a24 24 0 0 0 48 0" fill="none" /><path class="sa-line" d="M268 120 V182 M250 182 H286" fill="none" />
       <rect class="sa-mic" x="254" y="50" width="28" height="60" rx="14" /><rect class="sa-dark" x="270" y="52" width="10" height="56" rx="5" /><rect class="sa-lit" x="259" y="58" width="5" height="22" rx="2.5" />
       <path class="sa-grille" d="M258 70 h20 M258 78 h20 M258 86 h20" fill="none" />`,
    ),
};
export const heroArt = (kind) => (ART[kind] || ART.wordlab)();

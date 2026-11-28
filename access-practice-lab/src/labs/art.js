// Hand-built cover scenes for the six Language Labs (both grade bands). Flat layered illustration, token colours (with
// hex fallbacks), decorative only (aria-hidden). Motion is class hooks (.llp-spin, .llp-sweep, .llp-drift, .llp-wave,
// .llp-bob, .llp-pulse, .llp-scan, .llp-twinkle); language-labs-premium.css declares the keyframes only inside
// prefers-reduced-motion: no-preference, so with reduce the art is a still picture.
// Words drawn in the art are the English being practised, so they never change with the language mode.
import { raw } from "../util.js";

const V = {
  navy: ["--mi-800", "#123a5c"],
  deep: ["--mi-900", "#0b2339"],
  ink: ["--ink", "#101c2c"],
  ink3: ["--ink-3", "#4f5b6c"],
  jade: ["--brand-accent", "#0b6a62"],
  jadeSoft: ["--teal-soft", "#e0efe9"],
  mint: ["--ocean-200", "#91e2d6"],
  sage: ["--sage-200", "#d0e3cd"],
  bronze: ["--copper-900", "#884326"],
  copper: ["--copper-500", "#d28b58"],
  sand: ["--copper-200", "#f5d6a8"],
  brass: ["--brand-brass", "#b8893b"],
  ivory: ["--ivory", "#fffcf5"],
  canvas: ["--bg-canvas", "#f8f4ea"],
  pearl: ["--pearl", "#efe9e4"],
  mist: ["--pearl-blue", "#d5dceb"],
  blue: ["--reading", "#2e4a94"],
  blueSoft: ["--reading-soft", "#e4eafa"],
  listen: ["--listening", "#075568"],
  listenSoft: ["--listening-soft", "#d9f0ec"],
  write: ["--writing", "#9a4a26"],
  writeSoft: ["--writing-soft", "#fbead9"],
  rose: ["--speaking", "#8a3a5c"],
  roseSoft: ["--speaking-soft", "#f7e6ed"],
};
const c = (k) => `var(${V[k][0]},${V[k][1]})`;
const FONT = 'font-family="Plus Jakarta Sans, Inter, system-ui, sans-serif"';
const txt = (x, y, s, size, fill, extra = "") =>
  `<text x="${x}" y="${y}" text-anchor="middle" ${FONT} font-size="${size}" font-weight="700" fill="${c(fill)}" ${extra}>${s}</text>`;
const grad = (id, dir, stops) =>
  `<linearGradient id="${id}" ${dir === "v" ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="0" y1="0" x2="1" y2="0"'}>${stops
    .map(([o, k, a = 1]) => `<stop offset="${o}" stop-color="${c(k)}" stop-opacity="${a}"/>`)
    .join("")}</linearGradient>`;
const chip = (cx, y, label, w, fillK, strokeK, textK, size = 11.5) =>
  `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="22" rx="11" fill="${c(fillK)}" stroke="${c(strokeK)}" stroke-width="1.5"/>${txt(cx, y + 15, label, size, textK)}`;
const wrap = (cls, p, defs, body) =>
  `<svg class="llp-art ${cls}" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><defs>${defs}</defs>${body}</svg>`;

// ── Verb Time Machine: a clock-faced pod on a timeline rail ──────────────────
const VERB = {
  "3-5": {
    stops: [
      [70, "walked", "past"],
      [200, "is walking", "now"],
      [330, "will walk", "later"],
    ],
    pod: 200,
  },
  "6-8": {
    stops: [
      [52, "had fought", "past"],
      [144, "was fighting", "past"],
      [244, "has fought", "now"],
      [344, "will fight", "later"],
    ],
    pod: 252,
  },
};
function verbScene(p, band) {
  const { stops, pod } = VERB[band];
  const ties = Array.from({ length: 21 }, (_, i) => `<path d="M${i * 20 + 6} 190v6"/>`).join("");
  const marks = stops
    .map(([x, , kind]) =>
      kind === "now"
        ? `<circle cx="${x}" cy="186" r="11" fill="${c("jade")}" stroke="${c("ivory")}" stroke-width="3"/>`
        : kind === "later"
          ? `<circle cx="${x}" cy="186" r="9" fill="${c("ivory")}" stroke="${c("jade")}" stroke-width="2.5" stroke-dasharray="3 3"/>`
          : `<circle cx="${x}" cy="186" r="9" fill="${c("bronze")}" stroke="${c("ivory")}" stroke-width="3"/>`,
    )
    .join("");
  const chips = stops
    .map(([x, w, kind]) => {
      const cw = Math.round(w.length * (stops.length > 3 ? 6.1 : 7) + 20);
      return kind === "now"
        ? chip(x, 206, w, cw, "jade", "jade", "ivory", stops.length > 3 ? 11 : 12)
        : chip(x, 206, w, cw, "ivory", "brass", "navy", stops.length > 3 ? 11 : 12);
    })
    .join("");
  const hubs = Array.from({ length: 4 }, (_, i) => {
    const a = (i * Math.PI) / 2;
    return `<path d="M${pod + Math.sin(a) * 12} ${142 - Math.cos(a) * 12}l${Math.sin(a) * 3} ${-Math.cos(a) * 3}"/>`;
  }).join("");
  const defs =
    grad(`${p}sky`, "v", [
      [0, "ivory"],
      [1, "jadeSoft"],
    ]) +
    `<radialGradient id="${p}sun"><stop offset="0" stop-color="${c("sand")}" stop-opacity=".95"/><stop offset="1" stop-color="${c("sand")}" stop-opacity="0"/></radialGradient>`;
  return wrap(
    "llp-art-verb",
    p,
    defs,
    `<rect width="400" height="250" fill="url(#${p}sky)"/>
    <circle cx="322" cy="64" r="86" fill="url(#${p}sun)"/><circle cx="322" cy="64" r="21" fill="${c("sand")}"/>
    <g class="llp-drift" fill="${c("ivory")}"><ellipse cx="84" cy="52" rx="30" ry="9"/><ellipse cx="108" cy="44" rx="20" ry="9"/><ellipse cx="226" cy="30" rx="26" ry="7"/></g>
    <path d="M0 158C54 126 108 150 170 138S300 112 400 142V250H0Z" fill="${c("mist")}" opacity=".85"/>
    <path d="M0 178C70 154 130 174 200 164S330 150 400 172V250H0Z" fill="${c("sage")}"/>
    <rect y="196" width="400" height="54" fill="${c("ivory")}"/>
    <path d="M-10 186H410" stroke="${c("navy")}" stroke-width="6"/><path d="M-10 183H410" stroke="${c("brass")}" stroke-width="1.4"/>
    <g stroke="${c("navy")}" stroke-width="2.4" stroke-linecap="round">${ties}</g>
    <path d="M${stops[0][0]} 168Q${(stops[0][0] + pod) / 2} 128 ${pod - 40} 150" fill="none" stroke="${c("jade")}" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round" opacity=".7"/>
    ${marks}${chips}
    <g>
      <line x1="${pod}" y1="102" x2="${pod}" y2="86" stroke="${c("brass")}" stroke-width="2.5"/>
      <circle class="llp-pulse" cx="${pod}" cy="83" r="4.5" fill="${c("mint")}"/>
      <rect x="${pod - 36}" y="116" width="72" height="54" rx="15" fill="${c("navy")}"/>
      <path d="M${pod - 36} 128Q${pod} 90 ${pod + 36} 128Z" fill="${c("deep")}"/>
      <rect x="${pod - 36}" y="152" width="72" height="5" fill="${c("brass")}"/>
      <circle cx="${pod}" cy="142" r="18" fill="${c("ivory")}" stroke="${c("brass")}" stroke-width="3.2"/>
      <g stroke="${c("navy")}" stroke-width="2" stroke-linecap="round">${hubs}</g>
      <path d="M${pod} 142l-8 -6" stroke="${c("navy")}" stroke-width="2.6" stroke-linecap="round"/>
      <g class="llp-sweep" style="transform-origin:${pod}px 142px"><path d="M${pod} 142V130" stroke="${c("write")}" stroke-width="2.2" stroke-linecap="round"/></g>
      <circle cx="${pod}" cy="142" r="2" fill="${c("navy")}"/>
      <circle cx="${pod - 20}" cy="176" r="8" fill="${c("brass")}" stroke="${c("deep")}" stroke-width="2.5"/>
      <circle cx="${pod + 20}" cy="176" r="8" fill="${c("brass")}" stroke="${c("deep")}" stroke-width="2.5"/>
      <g class="llp-spin" style="transform-origin:${pod + 30}px 120px"><circle cx="${pod + 30}" cy="120" r="9" fill="none" stroke="${c("brass")}" stroke-width="5" stroke-dasharray="4 3.1"/><circle cx="${pod + 30}" cy="120" r="6.5" fill="${c("brass")}"/><circle cx="${pod + 30}" cy="120" r="2.2" fill="${c("deep")}"/></g>
    </g>`,
  );
}

// ── Connector Bridge: two ideas on two banks, one connector word between ─────
const BRIDGE = {
  "3-5": { a: "It rained.", b: "We stayed in.", word: "so", bw: 92, fs: 12 },
  "6-8": { a: "Panels cost a lot", b: "they save money", word: "however", bw: 108, fs: 11 },
};
function bridgeScene(p, band) {
  const { a, b, word, bw, fs } = BRIDGE[band];
  const waves = [0, 1, 2]
    .map(
      (i) =>
        `<path d="M-48 ${214 + i * 14}q12 -6 24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0t24 0" opacity="${0.55 - i * 0.12}"/>`,
    )
    .join("");
  const defs =
    grad(`${p}sky`, "v", [
      [0, "ivory"],
      [1, "listenSoft"],
    ]) +
    grad(`${p}river`, "v", [
      [0, "listen"],
      [1, "navy"],
    ]);
  return wrap(
    "llp-art-bridge",
    p,
    defs,
    `<rect width="400" height="250" fill="url(#${p}sky)"/>
    <circle cx="62" cy="48" r="20" fill="${c("sand")}"/><circle cx="62" cy="48" r="34" fill="${c("sand")}" opacity=".35"/>
    <g class="llp-drift" fill="${c("ivory")}"><ellipse cx="300" cy="38" rx="32" ry="9"/><ellipse cx="326" cy="30" rx="20" ry="8"/></g>
    <path d="M0 128C50 100 100 124 160 112S300 96 400 120V250H0Z" fill="${c("mist")}" opacity=".85"/>
    <path d="M0 146C60 128 140 146 200 138S330 126 400 142V250H0Z" fill="${c("sage")}"/>
    <rect y="170" width="400" height="80" fill="url(#${p}river)"/>
    <g class="llp-wave" fill="none" stroke="${c("mint")}" stroke-width="2" stroke-linecap="round">${waves}</g>
    <path d="M0 138H134Q146 138 144 158L138 250H0Z" fill="${c("pearl")}"/><path d="M0 138H134Q146 138 144 146H0Z" fill="${c("jade")}"/>
    <path d="M400 138H266Q254 138 256 158L262 250H400Z" fill="${c("pearl")}"/><path d="M400 138H266Q254 138 256 146H400Z" fill="${c("jade")}"/>
    <path d="M112 150Q200 62 288 150V176H112Z" fill="${c("sand")}" stroke="${c("brass")}" stroke-width="2"/>
    <path d="M152 176Q200 116 248 176Z" fill="url(#${p}river)"/>
    <path d="M112 150Q200 62 288 150" fill="none" stroke="${c("bronze")}" stroke-width="7" stroke-linecap="round"/>
    <path d="M122 140Q200 70 278 140" fill="none" stroke="${c("brass")}" stroke-width="1.6" stroke-dasharray="1 7" stroke-linecap="round"/>
    <g class="llp-bob"><rect x="${200 - bw / 2}" y="30" width="${bw}" height="32" rx="16" fill="${c("bronze")}"/><path d="M193 62h14l-7 9z" fill="${c("bronze")}"/>${txt(200, 52, word, word.length > 4 ? 15 : 18, "ivory")}</g>
    <rect x="10" y="94" width="104" height="38" rx="9" fill="${c("ivory")}" stroke="${c("jade")}" stroke-width="2.5"/>${txt(62, 118, a, fs, "navy")}<rect x="58" y="132" width="8" height="12" fill="${c("bronze")}"/>
    <rect x="286" y="94" width="104" height="38" rx="9" fill="${c("ivory")}" stroke="${c("navy")}" stroke-width="2.5"/>${txt(338, 118, b, fs, "navy")}<rect x="334" y="132" width="8" height="12" fill="${c("bronze")}"/>
    <g class="llp-bob"><path d="M178 214h44l-8 12h-28z" fill="${c("sand")}"/><path d="M200 190v24l16 -6z" fill="${c("ivory")}"/></g>`,
  );
}

// ── Paragraph X-Ray: a page with colour-coded sentence jobs under a scanning beam ─
const XRAY = {
  "3-5": ["Topic", "Detail", "Explain", "Conclusion"],
  "6-8": ["Claim", "Evidence", "Reasoning", "Conclusion"],
};
function xrayScene(p, band) {
  const tone = [
    ["blueSoft", "blue"],
    ["listenSoft", "listen"],
    ["writeSoft", "write"],
    ["roseSoft", "rose"],
  ];
  const rows = XRAY[band]
    .map((label, i) => {
      const y = 34 + i * 44;
      const [soft, strong] = tone[i];
      const w = [196, 158, 176, 130][i];
      return `<rect x="50" y="${y}" width="300" height="38" rx="9" fill="${c(soft)}" stroke="${c(strong)}" stroke-width="1.6"/>
      <rect x="58" y="${y + 10}" width="${label.length > 8 ? 90 : 76}" height="18" rx="9" fill="${c(strong)}"/>${txt(58 + (label.length > 8 ? 45 : 38), y + 23, label, 10, "ivory")}
      <rect x="${label.length > 8 ? 158 : 144}" y="${y + 10}" width="${w - 20}" height="5" rx="2.5" fill="${c(strong)}" opacity=".4"/><rect x="${label.length > 8 ? 158 : 144}" y="${y + 22}" width="${w - 50}" height="5" rx="2.5" fill="${c(strong)}" opacity=".28"/>`;
    })
    .join("");
  const defs =
    grad(`${p}bg`, "v", [
      [0, "deep"],
      [1, "navy"],
    ]) +
    grad(`${p}beam`, "v", [
      [0, "mint", 0],
      [0.5, "mint", 0.6],
      [1, "mint", 0],
    ]);
  return wrap(
    "llp-art-xray",
    p,
    defs,
    `<rect width="400" height="250" fill="url(#${p}bg)"/>
    <circle cx="340" cy="30" r="90" fill="${c("jade")}" opacity=".25"/>
    <g fill="${c("mint")}" opacity=".25"><circle cx="20" cy="30" r="2"/><circle cx="378" cy="150" r="2"/><circle cx="16" cy="200" r="2"/><circle cx="384" cy="220" r="2"/></g>
    <rect x="44" y="26" width="320" height="206" rx="12" fill="${c("deep")}" opacity=".45"/>
    <rect x="40" y="20" width="320" height="206" rx="12" fill="${c("ivory")}"/>${rows}
    <rect class="llp-scan" x="40" y="18" width="320" height="38" fill="url(#${p}beam)"/>
    <g class="llp-bob"><circle cx="322" cy="176" r="30" fill="${c("mint")}" fill-opacity=".22" stroke="${c("brass")}" stroke-width="6"/><path d="M300 164a26 26 0 0 1 16 -12" fill="none" stroke="${c("ivory")}" stroke-width="3" stroke-linecap="round" opacity=".8"/><path d="M343 197L372 226" stroke="${c("bronze")}" stroke-width="9" stroke-linecap="round"/></g>`,
  );
}

// ── Sentence Expansion Lab: tiles that snap into a sentence, a crane lowering one more ─
const TILES = {
  "3-5": { words: ["Bees", "visit", "flowers"], more: "because they need nectar", hang: "why" },
  "6-8": {
    words: ["Wetlands", "filter", "runoff"],
    more: "before it reaches the harbor",
    hang: "when",
  },
};
function expansionScene(p, band) {
  const { words, more, hang } = TILES[band];
  const col = [
    ["blueSoft", "blue"],
    ["listenSoft", "listen"],
    ["writeSoft", "write"],
  ];
  const xs = [34, 128, 222];
  const ws = [88, 88, 100];
  const tiles = words
    .map((w, i) => {
      const [soft, strong] = col[i];
      return `<g><rect x="${xs[i] + 14}" y="142" width="14" height="7" rx="2" fill="${c(strong)}"/><rect x="${xs[i] + ws[i] - 28}" y="142" width="14" height="7" rx="2" fill="${c(strong)}"/>
      <rect x="${xs[i]}" y="148" width="${ws[i]}" height="46" rx="8" fill="${c(soft)}" stroke="${c(strong)}" stroke-width="2"/><rect x="${xs[i]}" y="186" width="${ws[i]}" height="8" rx="4" fill="${c(strong)}"/>${txt(xs[i] + ws[i] / 2, 175, w, 15, "ink")}</g>`;
    })
    .join("");
  const defs = `<pattern id="${p}grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="${c("jade")}" stroke-opacity=".14" stroke-width="1"/></pattern>`;
  return wrap(
    "llp-art-expand",
    p,
    defs,
    `<rect width="400" height="250" fill="${c("jadeSoft")}"/><rect width="400" height="250" fill="url(#${p}grid)"/>
    <rect y="204" width="400" height="46" fill="${c("ivory")}"/><path d="M0 204H400" stroke="${c("navy")}" stroke-width="3"/>
    ${tiles}
    <rect x="34" y="98" width="${more.length > 24 ? 246 : 226}" height="40" rx="9" fill="none" stroke="${c("brass")}" stroke-width="2.4" stroke-dasharray="6 5"/>
    <text x="${34 + (more.length > 24 ? 123 : 113)}" y="123" text-anchor="middle" ${FONT} font-size="13" font-weight="700" font-style="italic" fill="${c("bronze")}">+ ${more}</text>
    <g stroke="${c("navy")}" stroke-width="3" fill="none" stroke-linecap="round"><path d="M360 204V26"/><path d="M360 34H236"/><path d="M360 50l-40 -16"/><path d="M342 204l18 -50M378 204l-18 -50" stroke-width="2"/></g>
    <path d="M360 26l-6 -10h12z" fill="${c("brass")}"/>
    <g class="llp-bob"><path d="M310 34V74" stroke="${c("navy")}" stroke-width="2"/><rect x="284" y="74" width="52" height="30" rx="8" fill="${c("sand")}" stroke="${c("brass")}" stroke-width="2"/>${txt(310, 94, hang, 14, "bronze")}</g>`,
  );
}

// ── Evidence Builder: a temple. Claim on the roof, evidence as columns, connector on the base ─
const TEMPLE = {
  "3-5": { claim: "Gardens help us learn.", base: "For example" },
  "6-8": { claim: "Shade trees cool streets.", base: "The evidence shows" },
};
function evidenceScene(p, band) {
  const { claim, base } = TEMPLE[band];
  // Three slots per column between the beam (y 118) and the base (y 198): evidence cards stack up from the bottom,
  // and the middle column keeps a dashed slot for the card still being chosen.
  const col = (x, n, ghost) =>
    [0, 1, 2]
      .map((slot) => {
        const y = 122 + slot * 26;
        const from = 3 - n;
        if (slot < from - (ghost ? 1 : 0)) return "";
        if (slot < from)
          return `<rect x="${x - 34}" y="${y}" width="68" height="22" rx="6" fill="none" stroke="${c("brass")}" stroke-width="2" stroke-dasharray="4 4"/>`;
        return `<rect x="${x - 34}" y="${y}" width="68" height="22" rx="6" fill="${c("jadeSoft")}" stroke="${c("jade")}" stroke-width="2"/><rect x="${x - 24}" y="${y + 6}" width="${42 - slot * 6}" height="4" rx="2" fill="${c("jade")}" opacity=".55"/><rect x="${x - 24}" y="${y + 13}" width="${30 + slot * 4}" height="4" rx="2" fill="${c("jade")}" opacity=".35"/>`;
      })
      .join("");
  const defs = grad(`${p}bg`, "v", [
    [0, "canvas"],
    [1, "writeSoft"],
  ]);
  return wrap(
    "llp-art-evidence",
    p,
    defs,
    `<rect width="400" height="250" fill="url(#${p}bg)"/>
    <circle cx="200" cy="120" r="108" fill="${c("sand")}" opacity=".28"/>
    <path d="M52 92L200 28L348 92Z" fill="${c("navy")}"/><path d="M84 88L200 40L316 88Z" fill="${c("deep")}" opacity=".5"/>
    <circle cx="200" cy="66" r="8" fill="${c("brass")}"/><circle class="llp-twinkle" cx="200" cy="66" r="3" fill="${c("ivory")}"/>
    <rect x="48" y="92" width="304" height="26" rx="5" fill="${c("navy")}"/>${txt(200, 110, claim, 13, "ivory")}
    ${col(104, 3, false)}${col(200, 2, true)}${col(296, 3, false)}
    <rect x="48" y="198" width="304" height="26" rx="5" fill="${c("bronze")}"/>${txt(200, 216, base, 13, "ivory")}
    <rect x="38" y="224" width="324" height="9" rx="3" fill="${c("brass")}"/>
    <g class="llp-bob"><circle cx="352" cy="166" r="14" fill="${c("ivory")}" fill-opacity=".7" stroke="${c("bronze")}" stroke-width="4"/><path d="M362 177l12 13" stroke="${c("bronze")}" stroke-width="5" stroke-linecap="round"/></g>`,
  );
}

// ── Precision Challenge: a vague word sharpened into the exact one ───────────
const PRECISE = {
  "3-5": { vague: "stuff", exact: "nutrients", vs: 28, es: 20 },
  "6-8": { vague: "bad for rivers", exact: "pollutes", vs: 17, es: 24 },
};
function precisionScene(p, band) {
  const { vague, exact, vs, es } = PRECISE[band];
  const star = (x, y, s, cls = "") =>
    `<path class="${cls}" d="M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z" fill="${c("brass")}"/>`;
  const br = (x, y, dx, dy) =>
    `<path d="M${x} ${y + dy * 14}V${y}H${x + dx * 14}" fill="none" stroke="${c("navy")}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const defs = `<filter id="${p}blur"><feGaussianBlur stdDeviation="2.4"/></filter>${grad(
    `${p}bg`,
    "v",
    [
      [0, "ivory"],
      [1, "writeSoft"],
    ],
  )}`;
  return wrap(
    "llp-art-precision",
    p,
    defs,
    `<rect width="400" height="250" fill="url(#${p}bg)"/>
    <circle cx="332" cy="48" r="72" fill="${c("sand")}" opacity=".4"/>
    <g fill="${c("pearl")}"><ellipse cx="88" cy="124" rx="76" ry="34"/><ellipse cx="46" cy="132" rx="38" ry="26"/><ellipse cx="128" cy="138" rx="46" ry="26"/></g>
    <text x="88" y="${130 + (vs > 20 ? 0 : 4)}" text-anchor="middle" ${FONT} font-size="${vs}" font-weight="700" fill="${c("ink3")}" filter="url(#${p}blur)">${vague}</text>
    <path d="M150 132Q176 100 204 112" fill="none" stroke="${c("bronze")}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 7"/>
    <g class="llp-bob"><circle cx="204" cy="132" r="32" fill="${c("ivory")}" fill-opacity=".85" stroke="${c("brass")}" stroke-width="6"/><path d="M226 156L250 182" stroke="${c("bronze")}" stroke-width="8" stroke-linecap="round"/>${star(204, 132, 15, "llp-twinkle")}${star(190, 118, 6)}${star(220, 146, 5)}</g>
    <path d="M240 128H258M252 121l7 7l-7 7" fill="none" stroke="${c("bronze")}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="266" y="100" width="124" height="56" rx="11" fill="${c("bronze")}"/>${txt(328, 135, exact, es, "ivory")}
    ${br(260, 94, 1, 1)}${br(396, 94, -1, 1)}${br(260, 162, 1, -1)}${br(396, 162, -1, -1)}
    ${star(380, 186, 9, "llp-twinkle")}${star(52, 196, 7)}${star(150, 60, 8, "llp-twinkle")}
    <path d="M24 214H376" stroke="${c("brass")}" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>`,
  );
}

const SCENES = {
  "verb-time-machine": verbScene,
  "connector-bridge": bridgeScene,
  "paragraph-xray": xrayScene,
  "sentence-expansion": expansionScene,
  "evidence-builder": evidenceScene,
  "precision-challenge": precisionScene,
};

/** Cover scene for one lab and band. `uid` keeps SVG gradient ids unique when a scene appears twice on a page. */
export function labScene(id, band, uid = "") {
  const b = band === "3-5" ? "3-5" : "6-8";
  const draw = SCENES[id] || SCENES["verb-time-machine"];
  return raw(draw(`llp${id.slice(0, 3)}${b === "3-5" ? "a" : "b"}${uid}`, b));
}

/** Quiet brass arcs and dots for the navy hero. Pure decoration. */
export function heroBackdrop() {
  return raw(`<svg class="llp-hero-bg" viewBox="0 0 600 400" preserveAspectRatio="xMaxYMid slice" aria-hidden="true" focusable="false">
    <g fill="none" stroke="${c("brass")}" stroke-width="1.2"><circle cx="520" cy="200" r="120" opacity=".55"/><circle cx="520" cy="200" r="190" opacity=".35"/><circle cx="520" cy="200" r="270" opacity=".2"/></g>
    <g fill="${c("mint")}" opacity=".5"><circle cx="400" cy="92" r="3"/><circle cx="470" cy="330" r="3"/><circle cx="580" cy="40" r="2.5"/><circle cx="330" cy="260" r="2"/></g>
  </svg>`);
}

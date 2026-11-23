// cover.js — cover art for the hub card: one original inline SVG (16:9, viewBox 0 0 640 360, no external references).
// A sunlit cloudscape, a floating library, a garden island, an energy bridge and the Explorer mid-leap over Shards.
const LABEL = {
  en: "Syntax Odyssey: Skyline Runner. An explorer leaps across a glowing energy bridge between floating sky islands, one with a library, above the clouds.",
  es: "Odisea de la Sintaxis: Corredor del Cielo. Un explorador salta por un puente de energía brillante entre islas flotantes del cielo, una con una biblioteca, sobre las nubes.",
};

const cloud = (x, y, s, o = 0.9) =>
  `<g fill="#fff" opacity="${o}"><ellipse cx="${x}" cy="${y}" rx="${46 * s}" ry="${16 * s}"/><ellipse cx="${x - 26 * s}" cy="${y + 4 * s}" rx="${28 * s}" ry="${13 * s}"/><ellipse cx="${x + 30 * s}" cy="${y + 3 * s}" rx="${32 * s}" ry="${14 * s}"/><ellipse cx="${x + 4 * s}" cy="${y - 14 * s}" rx="${26 * s}" ry="${15 * s}"/></g>`;

const island = (x, y, w, top, under) =>
  `<path d="M${x} ${y}h${w}q${-w * 0.2} ${w * 0.18} ${-w * 0.5} ${w * 0.3}q${-w * 0.3} ${-w * 0.12} ${-w * 0.5} ${-w * 0.3}z" fill="${under}"/><rect x="${x - 3}" y="${y - 8}" width="${w + 6}" height="12" rx="5" fill="${top}"/>`;

export function coverSVG(band = "6-8", lang = "en") {
  const young = band === "3-5";
  const k = young ? 1.12 : 1;
  const shards = [[250, 96], [300, 70], [350, 62], [400, 80]]
    .map(([x, y]) => `<path d="M${x} ${y - 11}l8 11l-8 11l-8-11z" fill="#ffcf4a"/><path d="M${x} ${y - 8}v8" stroke="#fff" stroke-opacity=".8" stroke-width="2"/>`)
    .join("");
  const books = [["#c2410c", 0], ["#1f4fd8", 1], ["#15803d", 2], ["#e2a72e", 3], ["#c2410c", 4], ["#1f4fd8", 5]]
    .map(([c, i]) => `<rect x="${72 + i * 15}" y="${216 - 22 - (i % 3) * 7}" width="13" height="${22 + (i % 3) * 7}" fill="${c}"/>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-label="${LABEL[lang === "es" ? "es" : "en"]}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="odc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f9fe8"/><stop offset=".6" stop-color="#9ad0ff"/><stop offset="1" stop-color="#ffe6a6"/></linearGradient>
<radialGradient id="odc-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff4c4"/><stop offset=".4" stop-color="#ffe6a0" stop-opacity=".4"/><stop offset="1" stop-color="#ffe6a0" stop-opacity="0"/></radialGradient>
<linearGradient id="odc-bridge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffd36b"/><stop offset="1" stop-color="#7ff4ff"/></linearGradient>
</defs>
<rect width="640" height="360" fill="url(#odc-sky)"/>
<circle cx="470" cy="96" r="120" fill="url(#odc-sun)"/>
${cloud(110, 70, 1.1, 0.7)}${cloud(520, 52, 0.9, 0.65)}${cloud(330, 40, 0.7, 0.55)}
<g opacity=".55">${island(420, 150, 110, "#a9cdf0", "#a9cdf0")}${island(20, 120, 80, "#a9cdf0", "#a9cdf0")}</g>
${island(40, 216, 200, "#f3dfae", "#8a6a3a")}
<rect x="40" y="208" width="200" height="8" fill="#e2a72e"/>
${books}
<path d="M70 190a70 70 0 0 1 140 0z" fill="#e2a72e"/><rect x="66" y="188" width="148" height="6" fill="#c9a35f"/>
${island(440, 232, 170, "#4fbf5f", "#6b4f2e")}
<g fill="#2f9e4f"><circle cx="480" cy="212" r="16"/><circle cx="548" cy="208" r="20"/></g><g fill="#6b4f2e"><rect x="478" y="220" width="4" height="12"/><rect x="546" y="218" width="4" height="14"/></g>
<g fill="#e8603c"><circle cx="500" cy="226" r="3"/><circle cx="520" cy="228" r="3"/><circle cx="574" cy="226" r="3"/></g>
<rect x="240" y="210" width="200" height="14" rx="4" fill="url(#odc-bridge)"/><rect x="240" y="210" width="200" height="4" fill="#fff"/>
<g stroke="#fff" stroke-width="2" stroke-dasharray="10 12"><path d="M246 219H434"/></g>
${shards}
<g transform="translate(${young ? 318 : 322} 120) scale(${1.9 * k})">
<path d="M-3 -31q-12 3 -22 -3" stroke="#e8603c" stroke-width="5" stroke-linecap="round" fill="none"/>
<path d="M0 -14l-8 -2M0 -14l9 -9" stroke="#233a63" stroke-width="5" stroke-linecap="round"/>
<rect x="-14" y="-29" width="8" height="13" rx="3" fill="#e2a72e"/><rect x="-7" y="-31" width="15" height="18" rx="5" fill="#1f4fd8"/><rect x="-7" y="-19" width="15" height="3" fill="#ffcf4a"/>
<path d="M0 -27l11 -13M0 -27l-9 -10" stroke="#f2c9a0" stroke-width="4" stroke-linecap="round"/>
<circle cx="1" cy="-39" r="8.5" fill="#f2c9a0"/><path d="M-8 -41a9 9 0 0 1 18 0z" fill="#5b3b22"/><circle cx="4.5" cy="-38.5" r="1.7" fill="#1a1a1a"/><circle cx="-.5" cy="-38.5" r="1.7" fill="#1a1a1a"/>
</g>
${cloud(80, 318, 1.6, 0.95)}${cloud(300, 340, 2.1, 0.95)}${cloud(560, 322, 1.7, 0.95)}
</svg>`;
}

export default { coverSVG };

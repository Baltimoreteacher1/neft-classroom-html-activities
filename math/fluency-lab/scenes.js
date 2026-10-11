// Mystery Picture scenes: 120 × 90 drawings, covered by a 4 × 3 grid of 30 × 30 tiles.
const star = (x, y, r = 1.4) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff7c2"/>`;

export const SCENES = {
  rocket: {
    title: "Rocket to the Ringed Planet",
    svg: `<defs><linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1b4c"/><stop offset="1" stop-color="#4b2a7b"/></linearGradient></defs>
      <rect width="120" height="90" fill="url(#sc-sky)"/>
      ${[
        [8, 8],
        [30, 20],
        [52, 6],
        [70, 28],
        [96, 12],
        [112, 30],
        [20, 52],
        [104, 58],
        [64, 72],
        [40, 80],
      ]
        .map(([x, y]) => star(x, y))
        .join("")}
      <circle cx="92" cy="26" r="14" fill="#f5a45b"/><ellipse cx="92" cy="26" rx="23" ry="5" fill="none" stroke="#ffe3b3" stroke-width="2.5" transform="rotate(-18 92 26)"/>
      <circle cx="18" cy="70" r="9" fill="#9bd1ff"/><circle cx="15" cy="67" r="2.5" fill="#d3ebff"/>
      <g transform="rotate(35 52 48)"><path d="M52 14c9 9 11 22 9 40H43c-2-18 0-31 9-40z" fill="#f4f6fb"/><circle cx="52" cy="34" r="5" fill="#59b4ff" stroke="#27456b" stroke-width="2"/><path d="M43 46l-9 12 9-3zM61 46l9 12-9-3z" fill="#e0455a"/><path d="M46 54h12l-6 18z" fill="#ffb02e"/><path d="M49 54h6l-3 10z" fill="#fff3a6"/></g>`,
  },
  reef: {
    title: "Fish on the Coral Reef",
    svg: `<defs><linearGradient id="sc-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fe0ee"/><stop offset="1" stop-color="#1b6fb0"/></linearGradient></defs>
      <rect width="120" height="90" fill="url(#sc-sea)"/>
      <path d="M0 82q15-8 30 0t30 0 30 0 30 0v8H0z" fill="#e9c98a"/>
      <path d="M14 82v-18m0 8l-6-8m6 4l6-9" stroke="#e2557a" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M100 82V60m0 10l-7-8m7 3l7-9" stroke="#f08a3c" stroke-width="4" stroke-linecap="round" fill="none"/>
      <g><ellipse cx="52" cy="40" rx="20" ry="12" fill="#ff9f2e"/><path d="M70 40l14-11v22z" fill="#ff7a1a"/><path d="M42 29q10-6 20 0" fill="#ff7a1a"/><circle cx="42" cy="37" r="3.2" fill="#fff"/><circle cx="41" cy="37" r="1.5" fill="#13233a"/><path d="M50 30v20M58 30v20" stroke="#fff" stroke-width="3" opacity=".8"/></g>
      <g><ellipse cx="94" cy="24" rx="9" ry="6" fill="#ffd84d"/><path d="M103 24l8-6v12z" fill="#f2b705"/><circle cx="89" cy="22.5" r="1.6" fill="#13233a"/></g>
      <g fill="none" stroke="#e8fbff" stroke-width="1.6">${[
        [20, 30, 3],
        [26, 18, 2],
        [12, 45, 2.5],
        [76, 62, 2.5],
        [82, 52, 1.8],
        [30, 62, 3],
      ]
        .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`)
        .join("")}</g>
      <path d="M62 82c0-8 6-10 6-16s-5-6-5-12" stroke="#2f9e6e" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  },
  house: {
    title: "A Sunny Day at Home",
    svg: `<defs><linearGradient id="sc-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd3ff"/><stop offset="1" stop-color="#e6f6ff"/></linearGradient></defs>
      <rect width="120" height="90" fill="url(#sc-day)"/>
      <circle cx="100" cy="16" r="9" fill="#ffd23f"/><g stroke="#ffd23f" stroke-width="2.4" stroke-linecap="round">${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<line x1="${100 + 12 * Math.cos((a * Math.PI) / 180)}" y1="${16 + 12 * Math.sin((a * Math.PI) / 180)}" x2="${100 + 16 * Math.cos((a * Math.PI) / 180)}" y2="${16 + 16 * Math.sin((a * Math.PI) / 180)}"/>`).join("")}</g>
      <ellipse cx="28" cy="18" rx="12" ry="5" fill="#fff"/><ellipse cx="38" cy="14" rx="8" ry="5" fill="#fff"/>
      <rect y="68" width="120" height="22" fill="#6cc24a"/>
      <rect x="34" y="40" width="44" height="32" fill="#f4c28b"/><path d="M28 42l28-22 28 22z" fill="#d1495b"/>
      <rect x="50" y="52" width="12" height="20" fill="#8a5a3b"/><rect x="38" y="48" width="9" height="9" fill="#bfe6ff" stroke="#fff" stroke-width="1.5"/><rect x="66" y="48" width="9" height="9" fill="#bfe6ff" stroke="#fff" stroke-width="1.5"/>
      <rect x="95" y="46" width="5" height="26" fill="#8a5a3b"/><circle cx="97.5" cy="40" r="13" fill="#2f9e6e"/><circle cx="10" cy="74" r="2" fill="#ff6b9a"/><circle cx="18" cy="78" r="2" fill="#fff"/><circle cx="24" cy="73" r="2" fill="#ff6b9a"/>`,
  },
  dino: {
    title: "Friendly Dinosaur Valley",
    svg: `<defs><linearGradient id="sc-dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb877"/><stop offset="1" stop-color="#ffe9b8"/></linearGradient></defs>
      <rect width="120" height="90" fill="url(#sc-dawn)"/>
      <circle cx="22" cy="24" r="10" fill="#fff3b0"/>
      <path d="M70 62L88 22l18 40z" fill="#7a5a4a"/><path d="M83 31l5-9 5 9z" fill="#ff6a3d"/><path d="M88 22c-3-6 3-9 0-15" stroke="#c9c2bd" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M0 68q30-14 60 0t60-4v26H0z" fill="#5fb54a"/>
      <g><path d="M24 62c0-14 12-20 24-18 6-9 16-8 20-2 3 4 1 10-4 11-4 1-6 5-4 9l6 6H54l-4-6c-6 4-14 4-20 0l-4 6h-6z" fill="#3fa356"/><circle cx="64" cy="46" r="1.8" fill="#13233a"/><path d="M34 46l4-6 4 6M44 44l4-6 4 6" fill="#2a7d41"/><path d="M60 52q4 2 8 0" stroke="#13233a" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>
      <g fill="#2a7d41"><path d="M8 68v-14m0 6l-5-5m5 3l5-6" stroke="#2a7d41" stroke-width="3" stroke-linecap="round" fill="none"/></g>`,
  },
};

export const SCENE_IDS = Object.keys(SCENES);

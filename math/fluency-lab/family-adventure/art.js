/* Family Math Expedition — hand-drawn SVG art: the guide (Tally the owl), a scene for each stop, stop icons and the
 * completion badge. Colours are the lab's brand palette. Everything here is decorative (aria-hidden) unless a caller
 * passes a label; motion is CSS-only and stops under prefers-reduced-motion. */
import { svg } from "./core.js";

const C = {
  navy: "#17324d",
  navy2: "#234a6f",
  teal: "#1fa6a2",
  tealDeep: "#0b6b68",
  tealTint: "#cfeeed",
  amber: "#f2c15b",
  cream: "#fdf3d8",
  coral: "#d8613c",
  blue: "#2f6db0",
  blueTint: "#cfe0f3",
  paper: "#f7f4ec",
  white: "#ffffff",
};

/** Tally, the expedition guide. mood: "wave" | "think" | "cheer" | "calm". */
export function guide(mood = "wave", label = "") {
  const spark =
    mood === "cheer"
      ? `<g class="g-spark" fill="${C.amber}"><path d="m12 30 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z"/><path d="m108 20 1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6Z"/></g>`
      : mood === "think"
        ? `<g class="g-think" fill="none" stroke="${C.navy}" stroke-width="2.2" stroke-linecap="round"><circle cx="104" cy="30" r="2.4" fill="${C.navy}"/><circle cx="110" cy="20" r="3.6"/><path d="M104 6c0-5 12-5 12 0 0 4-6 4-6 8"/></g>`
        : "";
  return svg(
    `<svg viewBox="0 0 120 142" class="guide guide-${mood}">
      <ellipse cx="60" cy="138" rx="30" ry="3.4" fill="${C.navy}" opacity=".12"/>
      <g class="g-bob">
        <ellipse cx="46" cy="132" rx="11" ry="5" fill="${C.amber}"/><ellipse cx="74" cy="132" rx="11" ry="5" fill="${C.amber}"/>
        <path d="M60 26C88 26 101 52 101 84c0 28-18 45-41 45S19 112 19 84c0-32 13-58 41-58Z" fill="${C.teal}"/>
        <ellipse cx="60" cy="97" rx="25" ry="27" fill="${C.cream}"/>
        <g fill="none" stroke="${C.amber}" stroke-width="2.4" stroke-linecap="round"><path d="M50 92l10 6 10-6"/><path d="M50 104l10 6 10-6"/></g>
        <path d="M33 101q27 14 54 0l-2 9q-25 14-50 0Z" fill="${C.coral}"/>
        <path class="wing wing-l" d="M24 68C9 76 8 104 25 114c5-12 5-30-1-46Z" fill="${C.tealDeep}"/>
        <path class="wing wing-r" d="M96 68c15 8 16 36-1 46-5-12-5-30 1-46Z" fill="${C.tealDeep}"/>
        <circle cx="45" cy="62" r="15.5" fill="${C.white}" stroke="${C.navy}" stroke-width="2"/>
        <circle cx="75" cy="62" r="15.5" fill="${C.white}" stroke="${C.navy}" stroke-width="2"/>
        <g class="eyes"><circle cx="47" cy="63" r="6.5" fill="${C.navy}"/><circle cx="49.2" cy="60.4" r="2" fill="#fff"/><circle cx="77" cy="63" r="6.5" fill="${C.navy}"/><circle cx="79.2" cy="60.4" r="2" fill="#fff"/></g>
        <path d="M54 73h12l-6 11Z" fill="${C.amber}"/>
        <path d="M29 41C30 15 90 15 91 41 80 34 40 34 29 41Z" fill="${C.navy}"/>
        <path d="M24 44Q60 30 96 44 60 49 24 44Z" fill="${C.navy2}"/>
        <path d="m60 20 2.5 5.2 5.6.8-4.1 4 1 5.6-5-2.7-5 2.7 1-5.6-4.1-4 5.6-.8Z" fill="${C.amber}"/>
      </g>${spark}
    </svg>`,
    `guide-art guide-art-${mood}`,
    label,
  );
}

let uid = 0;
const hills = (id, far, near) => `
  <defs><linearGradient id="sky${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e9f5f8"/><stop offset="1" stop-color="${C.cream}"/></linearGradient></defs>
  <rect width="800" height="240" fill="url(#sky${id})"/>
  <circle class="sun" cx="660" cy="62" r="30" fill="${C.amber}" opacity=".9"/>
  <path d="M0 170Q120 110 260 150T520 140T800 120V240H0Z" fill="${far}"/>
  <path d="M0 200Q140 150 300 186T600 176T800 170V240H0Z" fill="${near}"/>`;

const MOTIFS = {
  welcome: () => `
    <path class="trail-path" d="M400 240C340 210 470 196 420 168S470 138 440 116" fill="none" stroke="${C.cream}" stroke-width="22" stroke-linecap="round"/>
    <path d="M400 240C340 210 470 196 420 168S470 138 440 116" fill="none" stroke="${C.amber}" stroke-width="3" stroke-dasharray="2 12" stroke-linecap="round"/>
    ${[
      [262, 150, C.coral],
      [330, 176, C.blue],
      [530, 168, C.teal],
      [596, 142, C.amber],
      [458, 108, C.navy],
    ]
      .map(
        ([x, y, c], i) =>
          `<g class="flag" style="animation-delay:${i * 0.18}s"><path d="M${x} ${y}v-44" stroke="${C.navy}" stroke-width="3"/><path d="M${x} ${y - 44}l26 9-26 9Z" fill="${c}"/></g>`,
      )
      .join("")}`,
  discover: () => `
    <path d="M110 150Q400 70 690 150" fill="none" stroke="${C.navy}" stroke-width="5" stroke-linecap="round"/>
    ${Array.from({ length: 11 }, (_, i) => `<path d="M${110 + i * 58} ${150 - Math.sin((i / 10) * Math.PI) * 63 + 0}v${i % 5 === 0 ? 18 : 10}" stroke="${C.navy}" stroke-width="3"/>`).join("")}
    <g class="hopper"><circle cx="110" cy="130" r="10" fill="${C.coral}"/></g>
    ${Array.from({ length: 10 }, (_, i) => {
      const x = 250 + (i % 5) * 46;
      const y = 176 + Math.floor(i / 5) * 40 - 0;
      return `<rect x="${x}" y="${y}" width="38" height="34" rx="6" fill="${C.white}" stroke="${C.navy}" stroke-width="2"/>${i < 7 ? `<circle class="pop" style="animation-delay:${i * 0.12}s" cx="${x + 19}" cy="${y + 17}" r="10" fill="${i < 5 ? C.teal : C.amber}"/>` : ""}`;
    }).join("")}`,
  together: () => `
    <rect x="250" y="176" width="300" height="12" rx="6" fill="${C.navy}"/><rect x="290" y="188" width="10" height="40" fill="${C.navy}"/><rect x="500" y="188" width="10" height="40" fill="${C.navy}"/>
    <g><circle cx="330" cy="104" r="20" fill="${C.coral}"/><rect x="304" y="126" width="52" height="52" rx="22" fill="${C.blue}"/></g>
    <g><circle cx="458" cy="124" r="16" fill="${C.amber}"/><rect x="438" y="142" width="40" height="36" rx="18" fill="${C.teal}"/></g>
    <rect x="368" y="160" width="62" height="18" rx="3" fill="${C.white}" stroke="${C.navy}" stroke-width="2"/><path d="M399 160v18" stroke="${C.navy}" stroke-width="2"/>
    <g class="bubble"><rect x="262" y="40" width="96" height="46" rx="16" fill="${C.white}" stroke="${C.navy}" stroke-width="2.4"/><path d="M318 86l-8 14 20-14Z" fill="${C.white}" stroke="${C.navy}" stroke-width="2.4" stroke-linejoin="round"/><path d="M262 41h96v46H262Z" fill="none"/><text x="310" y="73" text-anchor="middle" font-size="30" font-weight="700" fill="${C.navy}" font-family="Georgia,serif">?</text></g>
    <g class="bubble b2"><rect x="432" y="60" width="90" height="42" rx="16" fill="${C.cream}" stroke="${C.navy}" stroke-width="2.4"/><circle cx="460" cy="81" r="4" fill="${C.navy}"/><circle cx="477" cy="81" r="4" fill="${C.navy}"/><circle cx="494" cy="81" r="4" fill="${C.navy}"/></g>`,
  explore: () => `
    <path d="M300 180V120l100-52 100 52v60Z" fill="${C.white}" stroke="${C.navy}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M282 124L400 62l118 62" fill="none" stroke="${C.coral}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="378" y="132" width="44" height="48" rx="6" fill="${C.navy}"/><circle cx="400" cy="104" r="14" fill="${C.cream}" stroke="${C.navy}" stroke-width="3"/>
    <path class="spin" d="m400 95 2.6 5.8 6.2.7-4.6 4.2 1.3 6.1-5.5-3.1-5.5 3.1 1.3-6.1-4.6-4.2 6.2-.7Z" fill="${C.amber}"/>
    <g fill="${C.tealTint}" stroke="${C.navy}" stroke-width="2.4"><path d="M560 178l12-34v-18h22v18l12 34Z"/></g><path d="M566 166h34" stroke="${C.teal}" stroke-width="8" stroke-linecap="round"/>
    <circle class="pop" cx="610" cy="118" r="5" fill="${C.teal}"/><circle class="pop" style="animation-delay:.4s" cx="626" cy="100" r="3.5" fill="${C.amber}"/>
    <g transform="translate(200 160)"><circle r="18" fill="${C.amber}" stroke="${C.navy}" stroke-width="2.4"/><circle r="6" fill="${C.cream}"/></g>`,
  night: () => `
    <path class="moon" d="M600 52a30 30 0 1 0 30 46A36 36 0 0 1 600 52Z" fill="${C.amber}"/>
    ${[
      [520, 40],
      [560, 90],
      [700, 40],
      [470, 78],
    ]
      .map(
        ([x, y], i) =>
          `<path class="twinkle" style="animation-delay:${i * 0.35}s" d="m${x} ${y - 6} 1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8Z" fill="${C.amber}"/>`,
      )
      .join("")}
    <path d="M250 184v-62l70-46 70 46v62Z" fill="${C.navy}"/><rect x="304" y="130" width="34" height="54" rx="4" fill="${C.amber}"/><rect x="262" y="136" width="26" height="26" rx="3" fill="${C.cream}"/>
    <rect x="450" y="164" width="190" height="12" rx="6" fill="${C.navy2}"/><rect x="470" y="176" width="9" height="40" fill="${C.navy2}"/><rect x="612" y="176" width="9" height="40" fill="${C.navy2}"/>
    <rect x="488" y="124" width="64" height="40" rx="6" fill="${C.white}" stroke="${C.navy}" stroke-width="2.4"/><rect x="488" y="124" width="64" height="12" rx="6" fill="${C.coral}"/>
    <path d="M512 110v14M528 110v14" stroke="${C.navy}" stroke-width="3" stroke-linecap="round"/>
    ${[0, 1, 2]
      .map(
        (i) =>
          `<circle class="pop" style="animation-delay:${i * 0.2}s" cx="${582 + i * 18}" cy="153" r="7" fill="${[C.teal, C.amber, C.coral][i]}"/>`,
      )
      .join("")}`,
};

/** The wide illustrated banner for a stop. */
export function scene(stopId) {
  uid += 1;
  const far = stopId === "night" ? "#b7c9dc" : C.blueTint;
  const near = stopId === "night" ? "#8fb0b8" : C.tealTint;
  const motif = (MOTIFS[stopId] || MOTIFS.welcome)();
  return svg(
    `<svg viewBox="0 0 800 240" preserveAspectRatio="xMidYMid slice" class="scene scene-${stopId}">${hills(uid, far, near)}${motif}</svg>`,
    "scene-art",
  );
}

/** A small line icon for map nodes and cards. */
const ICONS = {
  welcome: `<path d="M6 21V4M6 5h12l-3 4.5 3 4.5H6"/>`,
  discover: `<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M9 7v10M15 7v10M3 12h18"/>`,
  together: `<path d="M4 5h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H9l-4 3v-3H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><path d="M19 9h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2v3l-4-3h-3"/>`,
  explore: `<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/>`,
  night: `<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  star: `<path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.6 6.6 19.6l1.2-6L3.3 9.4l6.1-.8Z"/>`,
  eye: `<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>`,
  heart: `<path d="M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11Z"/>`,
  print: `<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3"/><rect x="7" y="14" width="10" height="7"/>`,
  speaker: `<path d="M4 9v6h4l5 4V5L8 9Z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>`,
  arrow: `<path d="M5 12h14M13 6l6 6-6 6"/>`,
  back: `<path d="M19 12H5M11 6l-6 6 6 6"/>`,
  check: `<path d="m5 12.5 4.5 4.5L19 7.5"/>`,
  bulb: `<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>`,
  link: `<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1"/>`,
  chart: `<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8"/>`,
  pencil: `<path d="m4 20 1-4L16 5l3 3L8 19Z"/>`,
  grid: `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>`,
  wrench: `<path d="M14 6a4 4 0 0 0 5 5l-9 9a2.1 2.1 0 0 1-3-3Z"/><path d="M14 6l3-3 4 4-3 3"/>`,
  home: `<path d="M3 11 12 4l9 7v9H3Z"/><path d="M9 20v-6h6v6"/>`,
};
export function icon(name, className = "ico") {
  return svg(
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.star}</svg>`,
    className,
  );
}

/** The route across five stops, drawn once on the welcome page. */
export function routeMap() {
  const pts = [
    [60, 100],
    [190, 44],
    [330, 96],
    [470, 40],
    [620, 90],
  ];
  const d = "M60 100C110 100 140 44 190 44S290 96 330 96S430 40 470 40S560 90 620 90";
  return svg(
    `<svg viewBox="0 0 680 140" class="route">
      <path d="${d}" fill="none" stroke="${C.tealTint}" stroke-width="16" stroke-linecap="round"/>
      <path class="route-line" d="${d}" fill="none" stroke="${C.teal}" stroke-width="4" stroke-linecap="round" stroke-dasharray="6 10" pathLength="100"/>
      ${pts
        .map(
          ([x, y], i) =>
            `<g class="route-node" style="animation-delay:${0.25 + i * 0.28}s"><circle cx="${x}" cy="${y}" r="20" fill="${C.white}" stroke="${C.navy}" stroke-width="3"/><text x="${x}" y="${y + 7}" text-anchor="middle" font-size="20" font-weight="700" fill="${C.navy}" font-family="Georgia,serif">${i + 1}</text></g>`,
        )
        .join("")}
    </svg>`,
    "route-art",
  );
}

/** The completion badge. */
export function badge() {
  return svg(
    `<svg viewBox="0 0 160 190" class="badge">
      <path d="M52 112 36 178l28-12 16 22 12-60Z" fill="${C.coral}"/><path d="m108 112 16 66-28-12-16 22-12-60Z" fill="#b8481f"/>
      <circle cx="80" cy="76" r="62" fill="${C.amber}"/><circle cx="80" cy="76" r="50" fill="${C.cream}" stroke="${C.navy}" stroke-width="3"/>
      <path class="badge-star" d="m80 38 10.2 21.4 23.4 3.2-17 16.2 4.2 23.2L80 91.2 59.2 102l4.2-23.2-17-16.2 23.4-3.2Z" fill="${C.teal}" stroke="${C.navy}" stroke-width="3" stroke-linejoin="round"/>
      <g class="badge-dots" fill="${C.navy}"><circle cx="40" cy="76" r="2.6"/><circle cx="120" cy="76" r="2.6"/></g>
    </svg>`,
    "badge-art",
  );
}

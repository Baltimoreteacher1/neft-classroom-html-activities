// Story Creator scene art: each storyboard panel is drawn from (setting, sky, props, character mood), so the
// picture changes as the story moves: the storm arrives in the Problem, a helper appears at the Turning point,
// the crowd cheers at the Ending. Original inline SVG in the shared palette (art.js); no violet anywhere.
import { C, cloud, hill, star, stroke, svg, tree } from "./art.js";

const SKY = {
  day: ["#cdeaf7", "#fdf3da"],
  storm: ["#5d7489", "#9fb2c3"],
  fog: ["#c9d3db", "#e6ecf0"],
  sunset: ["#f6b68a", "#fde7c2"],
  dusk: ["#36557a", "#f2b98a"],
};
const skyRect = (id, sky) =>
  `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKY[sky][0]}"/><stop offset="1" stop-color="${SKY[sky][1]}"/></linearGradient></defs><rect width="480" height="270" fill="url(#${id})"/>`;
const weather = (sky) => {
  if (sky === "storm")
    return `${cloud(110, 46, 1.4)}${cloud(330, 36, 1.6)}<g fill="#6d7e90" opacity=".55">${cloud(220, 60, 1.3)}</g><g stroke="#e2eaf5" stroke-width="3" stroke-linecap="round" opacity=".8">${Array.from({ length: 14 }, (_, i) => `<path d="M${20 + i * 34} ${80 + (i % 3) * 18}l-10 22"/>`).join("")}</g><path d="M300 70l-14 30h12l-10 26" fill="none" stroke="${C.gold}" stroke-width="4" stroke-linejoin="round"/>`;
  if (sky === "fog")
    return `<g fill="#fff" opacity=".55">${[60, 120, 180].map((y, i) => `<rect x="${-40 + i * 30}" y="${y}" width="560" height="26" rx="13"/>`).join("")}</g>`;
  if (sky === "sunset")
    return `<circle cx="390" cy="88" r="34" fill="${C.gold}" opacity=".9"/>${cloud(120, 54, 1)}`;
  if (sky === "dusk")
    return `${star(80, 30, 4, "#fff")}${star(200, 22, 3, "#fff")}${star(420, 40, 4, "#fff")}<circle cx="360" cy="52" r="16" fill="#fdf3da"/>`;
  return `<circle cx="408" cy="46" r="24" fill="${C.gold}"/>${cloud(110, 44, 1)}${cloud(300, 60, 0.8, 0.9)}`;
};

// ── settings (foreground ground plane; the sky shows through windows indoors) ──────────────
const SETTINGS = {
  rooftop: (b) =>
    `${[
      [20, 96, 70],
      [100, 70, 60],
      [370, 84, 90],
    ]
      .map(
        ([x, h, w]) =>
          `<rect x="${x}" y="${190 - h}" width="${w}" height="${h}" fill="#8aa0b4" opacity=".7"/>`,
      )
      .join(
        "",
      )}<rect x="0" y="190" width="480" height="80" fill="#b9a98f"/><path d="M0 190H480" stroke="${C.navy}" stroke-width="3"/><rect x="0" y="176" width="480" height="14" fill="#9b8a70" ${stroke(b, 2)}/>`,
  library: (b) =>
    `<rect x="0" y="0" width="480" height="270" fill="#f3e3c3"/><rect x="180" y="24" width="120" height="80" rx="8" fill="url(#skyfill)" ${stroke(b, 3)}/><path d="M240 24v80M180 64h120" stroke="${C.navy}" stroke-width="3"/>${[14, 344].map((x) => `<g><rect x="${x}" y="30" width="122" height="170" fill="${C.wood}" ${stroke(b, 3)}/>${[70, 120, 170].map((y) => `<rect x="${x + 6}" y="${y}" width="110" height="6" fill="${C.woodDk}"/>${Array.from({ length: 8 }, (_, k) => `<rect x="${x + 10 + k * 13}" y="${y - 32 + (k % 3) * 4}" width="10" height="${32 - (k % 3) * 4}" fill="${[C.coral, C.teal, C.gold, C.sky][k % 4]}"/>`).join("")}`).join("")}</g>`).join("")}<rect x="0" y="200" width="480" height="70" fill="#c9935d"/><path d="M0 200H480" stroke="${C.navy}" stroke-width="3"/>`,
  park: (b) =>
    `${hill(170, C.leafLt, 30)}${hill(205, C.leaf, 18, 6)}${tree(60, 190, 1.3, C.leaf, C.leafDk, b)}${tree(430, 200, 1.1, C.leafDk, C.leaf, b)}`,
  harbor: (b) =>
    `<path d="M0 180Q120 170 240 182T480 176V270H0Z" fill="#4f8fb5"/><g stroke="#cde6f2" stroke-width="3" stroke-linecap="round" opacity=".6"><path d="M30 214h40M140 236h50M300 222h40M400 246h44"/></g><rect x="300" y="168" width="180" height="20" fill="${C.wood}" ${stroke(b, 3)}/>${[316, 370, 424, 470].map((x) => `<rect x="${x}" y="186" width="10" height="60" fill="${C.woodDk}"/>`).join("")}`,
  gym: (b) =>
    `<rect x="0" y="0" width="480" height="270" fill="#e7d9bd"/>${[60, 200, 340].map((x) => `<rect x="${x}" y="16" width="90" height="46" rx="6" fill="url(#skyfill)" ${stroke(b, 3)}/>`).join("")}<rect x="0" y="196" width="480" height="74" fill="#d8a964"/><path d="M0 196H480M0 232H480" stroke="${C.woodDk}" stroke-width="2" opacity=".6"/><rect x="40" y="150" width="120" height="14" rx="3" fill="#fff" ${stroke(b, 2)}/><rect x="330" y="150" width="120" height="14" rx="3" fill="#fff" ${stroke(b, 2)}/>`,
  wall: (b) =>
    `<rect x="20" y="40" width="440" height="160" fill="#c9765d" ${stroke(b, 3)}/><g stroke="#a65a44" stroke-width="2">${Array.from({ length: 8 }, (_, r) => `<path d="M20 ${60 + r * 20}H460"/>${Array.from({ length: 11 }, (_, c) => `<path d="M${40 + c * 40 + (r % 2) * 20} ${40 + r * 20}v20"/>`).join("")}`).join("")}</g><rect x="0" y="200" width="480" height="70" fill="#b8b2a6"/><path d="M0 200H480" stroke="${C.navy}" stroke-width="3"/>`,
};

// ── props: each draws itself where it belongs in a 480x270 panel ─────────────────────────
const tomatoPlant = (x, y, b) =>
  `<g transform="translate(${x} ${y})"><path d="M-22 0h44l-6 30h-32Z" fill="${C.coralDk}" ${stroke(b, 2.4)}/><path d="M0 0V-46" stroke="${C.leafDk}" stroke-width="4"/><path d="M0 -20q-20 -4 -22 -18q18 0 22 18ZM0 -34q18 -4 20 -16q-16 0 -20 16Z" fill="${C.leaf}" ${stroke(b, 2)}/><circle cx="-10" cy="-8" r="7" fill="${C.coral}" ${stroke(b, 2)}/><circle cx="12" cy="-26" r="6" fill="${C.coral}" ${stroke(b, 2)}/></g>`;
const person = (x, y, s, shirt, b, mood = "hi") =>
  `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-14" y="-6" width="28" height="40" rx="10" fill="${shirt}" ${stroke(b, 2.4)}/><circle cx="0" cy="-22" r="15" fill="#c68c5c" ${stroke(b, 2.4)}/><path d="M-15 -26q15 -16 30 0" fill="#2a1a12"/>${mood === "cheer" ? `<path d="M-14 -2l-14 -24M14 -2l14 -24" stroke="${shirt}" stroke-width="8" stroke-linecap="round"/>` : ""}<path d="M-6 -18h.1M6 -18h.1" stroke="${C.navy}" stroke-width="4" stroke-linecap="round"/><path d="M-5 -12q5 4 10 0" fill="none" stroke="${C.navy}" stroke-width="2" stroke-linecap="round"/></g>`;
const PROPS = {
  tomato: (b) =>
    `${tomatoPlant(300, 178, b)}${tomatoPlant(370, 178, b)}${tomatoPlant(430, 178, b)}`,
  pots: (b) =>
    `<g transform="translate(330 196) rotate(70)"><path d="M-22 0h44l-6 30h-32Z" fill="${C.coralDk}" ${stroke(b, 2.4)}/></g><g transform="translate(410 200) rotate(-80)"><path d="M-22 0h44l-6 30h-32Z" fill="${C.coralDk}" ${stroke(b, 2.4)}/></g><path d="M280 214q40 -10 90 2t90 -4v14H280Z" fill="${C.woodDk}"/><circle cx="350" cy="222" r="6" fill="${C.coral}" ${stroke(b, 2)}/><path d="M300 206q-14 -10 -6 -24" stroke="${C.leafDk}" stroke-width="3" fill="none"/>`,
  buckets: (b) =>
    [300, 360, 420]
      .map(
        (x) =>
          `<g transform="translate(${x} 180)"><path d="M-20 0h40l-5 32h-30Z" fill="${C.sky}" ${stroke(b, 2.4)}/><path d="M-18 0q18 -18 36 0" fill="none" stroke="${C.navy}" stroke-width="2"/><path d="M8 0V-58" stroke="${C.wood}" stroke-width="4"/><path d="M-2 0V-40" stroke="${C.leafDk}" stroke-width="3"/><path d="M-2 -24q-14 -2 -14 -14q12 0 14 14Z" fill="${C.leaf}"/><circle cx="-8" cy="-12" r="5" fill="${C.coral}"/></g>`,
      )
      .join(""),
  bowl: (b) =>
    `<rect x="270" y="170" width="190" height="14" rx="4" fill="${C.wood}" ${stroke(b, 2.4)}/><path d="M290 184v40M440 184v40" stroke="${C.woodDk}" stroke-width="6"/><path d="M330 170q35 30 70 0Z" fill="#fff" ${stroke(b, 2.4)}/>${[
      [345, 160],
      [362, 154],
      [380, 160],
      [370, 166],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="${C.coral}" ${stroke(b, 2)}/>`)
      .join("")}`,
  books: (b) =>
    `<g transform="translate(300 200)">${[
      [0, C.coral],
      [14, C.teal],
      [28, C.gold],
    ]
      .map(
        ([dy, f], i) =>
          `<rect x="${-40 + i * 4}" y="${-16 - dy}" width="80" height="14" rx="3" fill="${f}" ${stroke(b, 2)}/>`,
      )
      .join("")}</g>`,
  basket: (b) =>
    `<g transform="translate(330 200)"><ellipse cx="0" cy="0" rx="44" ry="12" fill="${C.woodDk}"/><path d="M-44 0q0 26 44 26t44 -26" fill="${C.wood}" ${stroke(b, 2.4)}/><path d="M-30 6l10 16M-6 8l2 18M18 8l-4 18" stroke="${C.woodDk}" stroke-width="2"/><text x="0" y="-22" text-anchor="middle" font-size="30" font-weight="800" fill="${C.navy}" font-family="Atkinson Hyperlegible,sans-serif">?</text></g>`,
  sound: () =>
    `<g transform="translate(420 110)" fill="none" stroke="${C.tealDk}" stroke-width="4" stroke-linecap="round"><path d="M0 -14q10 14 0 28"/><path d="M12 -24q18 24 0 48"/><path d="M24 -34q26 34 0 68"/></g>`,
  cat: (b) =>
    `<g transform="translate(340 192)"><rect x="-40" y="-6" width="80" height="12" rx="3" fill="${C.teal}" ${stroke(b, 2)}/><ellipse cx="0" cy="-20" rx="30" ry="16" fill="#5b5f66" ${stroke(b, 2.4)}/><circle cx="24" cy="-30" r="12" fill="#5b5f66" ${stroke(b, 2.4)}/><path d="M16 -40l2 -10l7 7ZM28 -42l6 -8l2 10Z" fill="#5b5f66" ${stroke(b, 2)}/><path d="M20 -30q3 3 6 0" stroke="#fff" stroke-width="2" fill="none"/><path d="M-30 -14q-16 4 -8 16" fill="none" stroke="#5b5f66" stroke-width="6" stroke-linecap="round"/></g>`,
  kite: (b) =>
    `<g transform="translate(360 70)"><path d="M0 -30l26 30l-26 30l-26 -30Z" fill="${C.coral}" ${stroke(b, 2.6)}/><path d="M0 -30V30M-26 0H26" stroke="${C.navy}" stroke-width="2"/><circle cx="-8" cy="-6" r="4" fill="#fff"/><path d="M0 30q-10 20 4 34q-12 14 2 30" fill="none" stroke="${C.gold}" stroke-width="3"/><path d="M0 30Q-90 90 -140 150" fill="none" stroke="${C.navy}" stroke-width="1.6" opacity=".6"/></g>`,
  kitetree: (b) =>
    `${tree(370, 196, 2, C.leaf, C.leafDk, b)}<g transform="translate(392 104) rotate(24)"><path d="M0 -18l16 18l-16 18l-16 -18Z" fill="${C.coral}" ${stroke(b, 2.4)}/><path d="M0 18q-6 12 4 22" fill="none" stroke="${C.gold}" stroke-width="3"/></g><path d="M392 122q-10 30 -4 60" fill="none" stroke="${C.navy}" stroke-width="1.6" stroke-dasharray="4 4"/>`,
  lighthouse: (b) =>
    `<g transform="translate(110 186)"><path d="M-18 0l6 -110h24l6 110Z" fill="#fff" ${stroke(b, 3)}/><path d="M-16 -30h32M-14 -64h28" stroke="${C.coral}" stroke-width="10"/><rect x="-14" y="-128" width="28" height="18" fill="${C.gold}" ${stroke(b, 2.4)}/><path d="M-18 -128l18 -14l18 14Z" fill="${C.coralDk}" ${stroke(b, 2.4)}/><path d="M14 -120l70 -16v32Z" fill="${C.gold}" opacity=".35"/></g>`,
  boat: (b) =>
    `<g transform="translate(170 196)"><path d="M-60 -10h120l-20 26h-80Z" fill="${C.coral}" ${stroke(b, 3)}/><rect x="-20" y="-38" width="40" height="28" rx="4" fill="#fff" ${stroke(b, 2.4)}/><path d="M10 -38V-70" stroke="${C.navy}" stroke-width="3"/><circle cx="10" cy="-72" r="4" fill="${C.gold}"/><rect x="-12" y="-32" width="10" height="10" fill="${C.sky}"/></g>`,
  bell: (b) =>
    `<g transform="translate(330 140)"><path d="M0 -26V-34" stroke="${C.navy}" stroke-width="4"/><path d="M-20 10q0 -36 20 -36t20 36Z" fill="${C.goldDk}" ${stroke(b, 2.6)}/><rect x="-24" y="8" width="48" height="8" rx="4" fill="${C.gold}" ${stroke(b, 2)}/><circle cx="0" cy="20" r="5" fill="${C.navy}"/><path d="M30 -8q10 8 0 16M38 -16q16 16 0 32" fill="none" stroke="${C.tealDk}" stroke-width="3" stroke-linecap="round"/></g>`,
  filter: (b) =>
    `<g transform="translate(330 150)"><rect x="-34" y="-30" width="68" height="44" rx="6" fill="${C.sky}" fill-opacity=".6" ${stroke(b, 2.4)}/><path d="M-34 -8h68" stroke="${C.navy}" stroke-width="2"/><path d="M-50 -48l40 -10v24l-40 10Z" fill="#2b4a68" ${stroke(b, 2)}/><path d="M-30 -52v20M-20 -55v20" stroke="${C.skyLt}" stroke-width="1.5"/><path d="M0 14v12" stroke="${C.sky}" stroke-width="5" stroke-linecap="round"/></g>`,
  lamp: (b) =>
    `<g transform="translate(250 150)"><path d="M0 0V-46l26 -12" fill="none" stroke="${C.navy}" stroke-width="4"/><path d="M18 -66l26 4l-10 22Z" fill="${C.teal}" ${stroke(b, 2.4)}/><path d="M36 -46l50 30l-20 26Z" fill="${C.gold}" opacity=".45"/><rect x="-14" y="0" width="28" height="8" rx="3" fill="${C.navy}"/></g>${withFilter(b)}`,
  ribbon: (b) =>
    `<g transform="translate(390 150)"><circle r="20" fill="${C.gold}" ${stroke(b, 2.6)}/>${star(0, 0, 9, "#fff")}<path d="M-12 16l-8 30l12 -8l8 12l4 -32M12 16l8 30l-12 -8" fill="${C.teal}" ${stroke(b, 2)}/></g>${withFilter(b)}`,
  brushes: (b) =>
    `<g transform="translate(330 200)"><path d="M-20 0h40l-4 -30h-32Z" fill="${C.sky}" ${stroke(b, 2.4)}/>${[
      [-10, C.coral],
      [0, C.gold],
      [10, C.teal],
    ]
      .map(
        ([x, f]) =>
          `<path d="M${x} -30l${x / 2} -40" stroke="${C.wood}" stroke-width="4"/><circle cx="${x * 1.5}" cy="-70" r="5" fill="${f}"/>`,
      )
      .join("")}</g>`,
  sunflower: (b) =>
    `<g transform="translate(240 110)"><path d="M0 0V80" stroke="${C.leafDk}" stroke-width="7"/><path d="M0 50q-30 -6 -34 -24q26 0 34 24Z" fill="${C.leaf}"/>${Array.from({ length: 12 }, (_, i) => `<ellipse cx="0" cy="-34" rx="9" ry="20" fill="${C.gold}" ${stroke(b, 1.6)} transform="rotate(${i * 30})"/>`).join("")}<circle r="20" fill="${C.woodDk}" ${stroke(b, 2.4)}/></g>`,
  helper: (b) => person(200, 176, 1, C.leaf, b, "hi"),
  crowd: (b) =>
    `${person(160, 186, 0.8, C.sky, b, "cheer")}${person(215, 190, 0.75, C.gold, b, "cheer")}`,
};
function withFilter(b) {
  return PROPS.filter(b);
}

/** The seed's main character. mood: hi (opening) | worry (problem) | think (turn) | cheer (ending). */
function hero(look, mood, b, x = 90, y = 168) {
  const arms =
    mood === "cheer"
      ? `<path d="M-16 -2l-18 -30M16 -2l18 -30" stroke="${look.shirt}" stroke-width="10" stroke-linecap="round"/>`
      : mood === "think"
        ? `<path d="M14 0q14 -10 4 -26" stroke="${look.shirt}" stroke-width="10" stroke-linecap="round" fill="none"/>`
        : `<path d="M-16 2l-12 26M16 2l12 26" stroke="${look.shirt}" stroke-width="10" stroke-linecap="round"/>`;
  const mouth =
    mood === "worry"
      ? `<path d="M-6 -12q6 -5 12 0" fill="none" stroke="${C.navy}" stroke-width="2.6" stroke-linecap="round"/>`
      : `<path d="M-7 -14q7 7 14 0" fill="none" stroke="${C.navy}" stroke-width="2.6" stroke-linecap="round"/>`;
  const brows =
    mood === "worry"
      ? `<path d="M-12 -30l7 3M12 -30l-7 3" stroke="${C.navy}" stroke-width="2.4" stroke-linecap="round"/>`
      : "";
  const bubble =
    mood === "think"
      ? `<circle cx="34" cy="-60" r="14" fill="#fff" ${stroke(b, 2)}/><circle cx="20" cy="-40" r="4" fill="#fff" ${stroke(b, 1.6)}/><path d="M28 -64h12M28 -58h8" stroke="${C.goldDk}" stroke-width="3" stroke-linecap="round"/>`
      : "";
  return `<g transform="translate(${x} ${y})"><rect x="-10" y="34" width="8" height="26" rx="3" fill="${C.navy}"/><rect x="2" y="34" width="8" height="26" rx="3" fill="${C.navy}"/><rect x="-18" y="-6" width="36" height="46" rx="12" fill="${look.shirt}" ${stroke(b, 2.6)}/>${arms}<circle cx="0" cy="-22" r="19" fill="${look.skin}" ${stroke(b, 2.6)}/><path d="M-19 -26q19 -24 38 0q-4 -8 -19 -10q-15 2 -19 10Z" fill="${look.hair}"/>${brows}<path d="M-7 -22h.1M7 -22h.1" stroke="${C.navy}" stroke-width="5" stroke-linecap="round"/>${mouth}${bubble}</g>`;
}
const MOOD = { opening: "hi", problem: "worry", turn: "think", ending: "cheer" };
let n = 0;

/** One storyboard panel scene. `locked` draws a quiet placeholder for a panel not reached yet. */
export function panelScene(seed, panel, band, { locked = false, label = "" } = {}) {
  const id = `scsky${(n += 1)}`;
  if (locked)
    return svg(
      "0 0 480 270",
      `<rect width="480" height="270" fill="#e8edf2"/><path d="M0 200H480" stroke="#c3ccd6" stroke-width="3"/><g transform="translate(240 120)" fill="none" stroke="#9aa9b8" stroke-width="6" stroke-linecap="round"><rect x="-22" y="0" width="44" height="34" rx="6"/><path d="M-12 0v-12a12 12 0 0 1 24 0v12"/></g>`,
      { cls: "scr-scene is-locked", label },
    );
  const sky = panel.art?.sky || "day";
  const defs = `<defs><linearGradient id="skyfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${SKY[sky][0]}"/><stop offset="1" stop-color="${SKY[sky][1]}"/></linearGradient></defs>`;
  const set = (SETTINGS[seed.scene] || SETTINGS.park)(band);
  const indoor = seed.scene === "library" || seed.scene === "gym";
  const props = (panel.art?.props || []).map((p) => (PROPS[p] ? PROPS[p](band) : "")).join("");
  const body = `${skyRect(id, sky)}${defs.replace(/skyfill/g, `${id}w`)}${indoor ? "" : weather(sky)}${set.replace(/skyfill/g, `${id}w`)}${props}${hero(seed.look, MOOD[panel.role] || "hi", band)}`;
  return svg("0 0 480 270", body, { cls: `scr-scene scr-sky-${sky}`, label });
}

/** A small seed-card picture: the setting on a clear day with the character waving. */
export const seedScene = (seed, band, label) =>
  panelScene(seed, { role: "opening", art: { sky: "day", props: [] } }, band, { label });

export const KNOWN_PROPS = Object.keys(PROPS);
export const KNOWN_SCENES = Object.keys(SETTINGS);
export const KNOWN_SKIES = Object.keys(SKY);

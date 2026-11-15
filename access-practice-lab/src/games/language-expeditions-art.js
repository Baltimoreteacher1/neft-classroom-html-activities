// Language Expeditions activity art: the picture choices, the tap-a-spot scenes and the speaking/writing pictures.
// Original flat vector drawings (no stock, no raster). Keys are referenced from content/games/language-expeditions.json
// and checked by the module's validate(). Palette: lab navy/teal/amber/off-white plus neutral browns, greens and
// stone; no violet, purple or indigo (validate:no-purple).
import { C, svg } from "./art.js";

const sky = "#dcecf3";
const grass = "#a5d18f";
const frame = (bg, ground, body) =>
  `<rect width="160" height="125" fill="${bg}"/>${ground ? `<rect y="104" width="160" height="21" fill="${ground}"/>` : ""}${body}`;

// ── grades 3-5 pieces ─────────────────────────────────────────────────────────────────────
const fox = {
  sleep: (x, y) =>
    `<g transform="translate(${x} ${y})"><path d="M-34 6Q-40 -16 -6 -14Q30 -16 30 4Q20 16 -20 14Z" fill="#e2762f"/><path d="M26 2Q48 10 30 18Q8 22 -26 14" fill="#e2762f" stroke="#fff6e8" stroke-width="3"/><circle cx="-24" cy="-8" r="11" fill="#e2762f"/><path d="M-32 -16l4 -12 6 10ZM-22 -18l6 -10 2 12Z" fill="#c45f22"/><path d="M-28 -8q3 3 6 0" stroke="#2b1a10" stroke-width="2" fill="none"/><path d="M-6 -30h7l-7 7h7M6 -40h5l-5 5h5" stroke="${C.navy}" stroke-width="1.6" fill="none"/></g>`,
  run: (x, y) =>
    `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="-10" rx="26" ry="11" fill="#e2762f"/><circle cx="26" cy="-18" r="10" fill="#e2762f"/><path d="M22 -26l3 -12 6 9Z" fill="#c45f22"/><circle cx="29" cy="-19" r="2" fill="#2b1a10"/><path d="M-24 -12Q-46 -26 -50 -8" stroke="#e2762f" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-14 -2l-12 14M-6 -2l6 14M10 -2l-6 14M16 -2l12 12" stroke="#c45f22" stroke-width="5" stroke-linecap="round"/></g>`,
};
const leafTree = (x) =>
  `<rect x="${x - 6}" y="40" width="12" height="64" fill="#7a5134"/><circle cx="${x}" cy="40" r="30" fill="#4f9a5f"/><circle cx="${x - 18}" cy="52" r="18" fill="#5aab6b"/><circle cx="${x + 18}" cy="52" r="18" fill="#5aab6b"/>`;
const box = (x, y, fill, dark, open) =>
  `<g transform="translate(${x} ${y})"><path d="M-34 -30h68v40h-68Z" fill="${fill}"/><path d="M-34 -30l10 -10h68l-10 10Z" fill="${dark}"/><path d="M34 -30l10 -10v40l-10 10Z" fill="${dark}"/>${open ? `<path d="M-30 -26h60v12h-60Z" fill="${dark}" opacity=".55"/>` : ""}</g>`;
const keyArt = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})"><circle r="8" fill="none" stroke="${C.goldDk}" stroke-width="4"/><path d="M8 0h22M22 0v7M28 0v6" stroke="${C.goldDk}" stroke-width="4" stroke-linecap="round"/></g>`;
// A cut-away box: the key is drawn behind the front wall's window so "inside" reads clearly.
const keyInside = (fill, dark) =>
  frame(
    sky,
    "#d9c49a",
    `${box(80, 92, fill, dark, true)}<rect x="56" y="70" width="48" height="24" rx="4" fill="#fdf8ec" opacity=".9"/>${keyArt(66, 82, 0.8)}`,
  );

const PICS = {
  "fox-under-tree": () => frame(sky, grass, leafTree(64) + fox.sleep(82, 104)),
  "fox-on-log": () =>
    frame(
      sky,
      grass,
      `<rect x="34" y="84" width="96" height="22" rx="11" fill="#8a5f3c"/><circle cx="40" cy="95" r="9" fill="#b98a5f"/>${fox.sleep(88, 76)}`,
    ),
  "fox-running": () => frame(sky, grass, leafTree(52) + fox.run(110, 112)),
  "key-in-blue": () => keyInside("#3d86c6", "#2a5f8f"),
  "key-on-blue": () =>
    frame(sky, "#d9c49a", `${box(80, 92, "#3d86c6", "#2a5f8f", false)}${keyArt(64, 46)}`),
  "key-in-red": () => keyInside("#d4553f", "#a23c2b"),
  ladder: () =>
    frame(
      "#f3e6c9",
      "#c9a56f",
      `<rect x="20" y="8" width="120" height="14" fill="#8a5a2f"/><rect x="26" y="0" width="10" height="8" fill="#d4553f"/><rect x="40" y="0" width="10" height="8" fill="${C.teal}"/><path d="M58 104L74 20M98 104L114 20" stroke="#8a5a2f" stroke-width="6" stroke-linecap="round"/><path d="M62 86h40M65 68h40M68 50h40M71 32h40" stroke="#8a5a2f" stroke-width="5"/><circle cx="40" cy="62" r="9" fill="#5a3a24"/><rect x="31" y="70" width="18" height="30" rx="7" fill="${C.teal}"/><path d="M48 78l12 -4" stroke="${C.teal}" stroke-width="6" stroke-linecap="round"/>`,
    ),
  "red-book": () =>
    frame(
      "#f3e6c9",
      null,
      `<rect x="0" y="40" width="160" height="10" fill="#8a5a2f"/><rect x="20" y="10" width="14" height="30" fill="${C.teal}"/><rect x="36" y="14" width="12" height="26" fill="${C.gold}"/><rect x="60" y="4" width="16" height="36" fill="#d4553f" stroke="#7a2a1e" stroke-width="2"/><rect x="100" y="12" width="14" height="28" fill="${C.navy}"/><circle cx="68" cy="66" r="10" fill="#5a3a24"/><rect x="58" y="76" width="20" height="34" rx="8" fill="${C.teal}"/><path d="M76 82l10 -30" stroke="${C.teal}" stroke-width="6" stroke-linecap="round"/><rect x="82" y="40" width="10" height="16" fill="#d4553f"/>`,
    ),
  "window-seat": () =>
    frame(
      "#f3e6c9",
      "#c9a56f",
      `<rect x="86" y="14" width="56" height="58" rx="4" fill="#bfe3f2" stroke="#8a5a2f" stroke-width="5"/><path d="M114 14v58M86 43h56" stroke="#8a5a2f" stroke-width="4"/><rect x="74" y="80" width="80" height="16" rx="5" fill="#b9814a"/><circle cx="104" cy="58" r="9" fill="#5a3a24"/><rect x="94" y="66" width="20" height="18" rx="7" fill="${C.teal}"/><rect x="96" y="70" width="16" height="12" fill="#d4553f"/>`,
    ),
};

// ── grades 6-8 route maps ─────────────────────────────────────────────────────────────────
const route = (d) =>
  `<path d="${d}" stroke="#c94f3b" stroke-width="3.5" stroke-dasharray="7 5" fill="none" stroke-linecap="round"/>`;
const tower = (x, y) =>
  `<path d="M${x - 7} ${y + 14}L${x - 4} ${y - 12}H${x + 4}L${x + 7} ${y + 14}Z" fill="#8a4a3a"/>`;
const mapBase = (body) =>
  frame(
    "#f1dfb8",
    null,
    `<path d="M0 30Q40 20 80 34T160 28M0 70Q50 58 90 74T160 66" stroke="#d9c393" fill="none"/><path d="M84 0Q72 40 86 70T80 125" stroke="#4a8fc4" stroke-width="9" fill="none"/><circle cx="15" cy="108" r="6" fill="${C.navy}"/><path d="M145 30V10l13 5 -13 5" stroke="${C.navy}" stroke-width="2" fill="${C.coral}"/>${body}`,
  );
Object.assign(PICS, {
  "route-river-towers": () =>
    mapBase(tower(112, 58) + tower(130, 58) + route("M15 108L55 100L100 92L121 60L145 26")),
  "route-towers-first": () =>
    mapBase(tower(30, 62) + tower(48, 62) + route("M15 108L39 66L60 40L70 30L145 26")),
  "route-one-tower": () => mapBase(tower(120, 58) + route("M15 108L55 100L100 92L112 70L145 26")),
});

// ── speaking and writing pictures (wider frames) ──────────────────────────────────────────
const WIDE = {
  "canyon-nest": [
    "0 0 320 180",
    `<rect width="320" height="180" fill="#f6dcae"/><path d="M0 180V20Q40 10 70 30V180Z" fill="#b8704a"/><path d="M200 180V0H320V180Z" fill="#a65e3c"/><path d="M196 70h40v8h-40Z" fill="#7a4028"/><path d="M204 62q14 -14 28 0Z" fill="#8a5a2f"/><circle cx="212" cy="58" r="4" fill="#f2eee4"/><circle cx="222" cy="58" r="4" fill="#f2eee4"/><path d="M214 30q8 -8 16 0q8 -8 16 0" stroke="${C.navy}" stroke-width="3" fill="none"/><path d="M200 84Q186 120 196 150" stroke="#8fd0ea" stroke-width="14" fill="none"/><ellipse cx="190" cy="160" rx="46" ry="12" fill="#5fb3d6"/><rect x="96" y="96" width="10" height="66" fill="#7a5134"/><circle cx="101" cy="90" r="24" fill="#4f9a5f"/><rect y="164" width="320" height="16" fill="#c9965e"/>`,
  ],
  "seed-steps": [
    "0 0 480 160",
    [0, 1, 2]
      .map((n) => {
        const x = n * 160;
        const body = [
          `<path d="M${x + 60} 118l20 -40" stroke="#8a5a2f" stroke-width="6"/><path d="M${x + 74} 74h18l-6 18h-18Z" fill="${C.stoneDk}"/><ellipse cx="${x + 92}" cy="124" rx="20" ry="7" fill="#5a3a24"/>`,
          `<ellipse cx="${x + 80}" cy="124" rx="20" ry="7" fill="#5a3a24"/><ellipse cx="${x + 80}" cy="98" rx="6" ry="9" fill="#d9a441"/><path d="M${x + 80} 76v12" stroke="#5a3a24" stroke-width="3" stroke-dasharray="3 3"/>`,
          `<path d="M${x + 40} 70h34l12 12h-46Z" fill="${C.teal}"/><path d="M${x + 86} 82q16 6 18 24" stroke="#8fd0ea" stroke-width="4" stroke-dasharray="4 4" fill="none"/><path d="M${x + 104} 124v-14q-8 -8 -14 -2M${x + 104} 112q8 -10 14 -4" stroke="#3f9b5f" stroke-width="4" fill="none"/>`,
        ][n];
        return `<rect x="${x + 4}" y="4" width="152" height="152" rx="12" fill="#f7f4ec" stroke="${C.navy}" stroke-width="3"/><rect x="${x + 4}" y="124" width="152" height="32" rx="0" fill="#c9965e"/><circle cx="${x + 24}" cy="26" r="14" fill="${C.navy}"/><text x="${x + 24}" y="31" font-size="15" font-weight="700" fill="#fff" text-anchor="middle">${n + 1}</text>${body}`;
      })
      .join(""),
  ],
  "two-routes": [
    "0 0 360 200",
    `<rect width="360" height="200" fill="#f1dfb8"/><circle cx="40" cy="170" r="12" fill="${C.navy}"/><path d="M300 30V8l16 6 -16 6" stroke="${C.navy}" stroke-width="3" fill="${C.coral}"/><path d="M40 170L120 40L300 30" stroke="#c94f3b" stroke-width="4" stroke-dasharray="8 6" fill="none"/><path d="M90 80l10 -6M104 66l12 -4M98 92l8 -2" stroke="#7a4028" stroke-width="4" stroke-linecap="round"/><path d="M40 170Q200 200 300 120T300 30" stroke="${C.tealDk}" stroke-width="4" fill="none"/><rect x="58" y="66" width="74" height="24" rx="6" fill="#fffdf6" stroke="#c94f3b" stroke-width="2"/><text x="95" y="83" font-size="14" font-weight="700" fill="#7a2a1e" text-anchor="middle">Route A</text><rect x="200" y="146" width="80" height="24" rx="6" fill="#fffdf6" stroke="${C.tealDk}" stroke-width="2"/><text x="240" y="163" font-size="14" font-weight="700" fill="${C.tealDk}" text-anchor="middle">Route B</text><text x="150" y="112" font-size="11" fill="#5a2a1e">steep · loose rock · short</text><text x="168" y="194" font-size="11" fill="${C.tealDk}">solid ground · longer</text>`,
  ],
  "wind-cave": [
    "0 0 480 160",
    [0, 1, 2]
      .map((n) => {
        const x = n * 160;
        const hollow = [0, 18, 34][n];
        const label = ["first", "over time", "as a result"][n];
        return `<rect x="${x + 4}" y="4" width="152" height="152" rx="12" fill="#f6dcae" stroke="${C.navy}" stroke-width="3"/><path d="M${x + 80} 150V30h70v120Z" fill="#b8704a"/><path d="M${x + 80} 60h70M${x + 80} 90h70M${x + 80} 120h70" stroke="#9a5a3a" stroke-width="2"/>${hollow ? `<path d="M${x + 80} ${110 - hollow}q${hollow + 10} ${hollow} 0 ${hollow * 2}Z" fill="#3a1e14"/>` : ""}<path d="M${x + 14} 96h44M${x + 20} 108h34M${x + 14} 120h44" stroke="${C.tealDk}" stroke-width="3" stroke-linecap="round"/><path d="M${x + 52} 92l8 4 -8 4M${x + 52} 116l8 4 -8 4" stroke="${C.tealDk}" stroke-width="3" fill="none"/><circle cx="${x + 30}" cy="102" r="2" fill="#a0762f"/><circle cx="${x + 40}" cy="114" r="2" fill="#a0762f"/><text x="${x + 80}" y="24" font-size="13" font-weight="700" fill="${C.navy}" text-anchor="middle">${label}</text>`;
      })
      .join(""),
  ],
  keeper: [
    "0 0 320 180",
    `<rect width="320" height="180" fill="#17324d"/><circle cx="270" cy="34" r="14" fill="#f7f4ec"/><rect y="130" width="320" height="50" fill="#1f4a63"/><path d="M60 130V50l20 -14 20 14v80Z" fill="#f7f4ec"/><path d="M60 72h40M60 100h40" stroke="#c94f3b" stroke-width="10"/><rect x="72" y="40" width="16" height="10" fill="${C.gold}"/><circle cx="170" cy="96" r="12" fill="#5a3a24"/><rect x="158" y="108" width="24" height="26" rx="8" fill="${C.teal}"/><rect x="192" y="104" width="44" height="28" rx="3" fill="#f7f4ec"/><path d="M198 112h30M198 120h24" stroke="${C.navy}" stroke-width="2"/>`,
  ],
  lighthouse: [
    "0 0 320 180",
    `<rect width="320" height="180" fill="#10243b"/><path d="M150 46L20 10V80Z" fill="${C.gold}" opacity=".35"/><rect y="138" width="320" height="42" fill="#1f4a63"/><path d="M200 140L210 40H240L250 140Z" fill="#f7f4ec"/><path d="M205 90h40M202 118h46" stroke="#c94f3b" stroke-width="12"/><rect x="208" y="26" width="34" height="16" fill="${C.gold}"/><path d="M204 26h42l-21 -14Z" fill="#c94f3b"/><path d="M40 120q10 -20 30 0Z" fill="#7a5a3a"/><path d="M60 100v20" stroke="#f7f4ec" stroke-width="2"/><path d="M0 150q40 -10 80 0t80 0t80 0t80 0" stroke="#8fc7e8" stroke-width="2" fill="none"/>`,
  ],
  "station-desk": [
    "0 0 320 180",
    `<rect width="320" height="180" fill="#f1dfb8"/><rect x="20" y="110" width="280" height="14" fill="#8a5a2f"/><rect x="40" y="60" width="90" height="50" rx="6" fill="#2a3a48"/><circle cx="62" cy="85" r="12" fill="${C.teal}"/><path d="M84 74h34M84 86h28M84 98h34" stroke="${C.gold}" stroke-width="4"/><path d="M110 60l12 -30" stroke="#2a3a48" stroke-width="3"/><rect x="170" y="74" width="100" height="36" fill="#fffdf6"/><path d="M180 84h70M180 94h60M180 104h66" stroke="${C.navy}" stroke-width="2"/><text x="220" y="66" font-size="12" font-weight="700" fill="${C.navy}" text-anchor="middle">Station log</text>`,
  ],
  "station-dish": [
    "0 0 320 180",
    `<rect width="320" height="180" fill="#f2c18a"/><path d="M0 180L120 70L200 120L320 60V180Z" fill="#8a4a3a"/><rect x="150" y="70" width="70" height="44" fill="#f7f4ec"/><rect x="160" y="84" width="14" height="14" fill="${C.teal}"/><rect x="196" y="84" width="14" height="30" fill="#5a3a24"/><path d="M230 64a28 28 0 0 1 40 -30" stroke="#f7f4ec" stroke-width="8" fill="none"/><path d="M246 46l-16 24" stroke="#2a3a48" stroke-width="4"/><path d="M90 150h24M96 140h12" stroke="${C.navy}" stroke-width="3"/><circle cx="72" cy="140" r="8" fill="${C.navy}"/><rect x="66" y="148" width="12" height="18" rx="4" fill="${C.teal}"/>`,
  ],
};

// ── tap-a-spot scenes (360 x 200) ─────────────────────────────────────────────────────────
const SPOTS = {
  bridge: `<rect width="360" height="200" fill="#17324d"/><rect y="104" width="360" height="96" fill="#2f5b46"/><path d="M110 200Q150 150 150 104L210 104Q210 150 250 200Z" fill="#2b5c86"/><path d="M70 100H290V200H262Q262 120 180 120Q98 120 98 200H70Z" fill="#8d8a82"/><path d="M98 200Q98 120 180 120Q262 120 262 200Z" fill="#0f1a2e" opacity=".6"/><rect x="62" y="88" width="236" height="14" rx="5" fill="#b3aea2"/>`,
  ridge: `<rect width="360" height="200" fill="#f3c38a"/><path d="M0 100L60 85L140 92L220 80L300 90L360 84V200H0Z" fill="#b0603f"/><path d="M168 92L172 28H188L192 92Z" fill="#7a3a30"/><path d="M274 172Q300 118 326 172Z" fill="#2a1418"/><path d="M0 186Q120 172 200 186T360 180V200H0Z" fill="#4a8fc4"/><g transform="translate(36 34)" font-size="10" font-weight="700" fill="${C.navy}" text-anchor="middle"><circle r="20" fill="#fff" opacity=".9"/><text y="-8">N</text><text y="16">S</text><text x="-12" y="4">W</text><text x="12" y="4">E</text></g>`,
};
export const MARKER = {
  "3-5": (x, y) =>
    `<g transform="translate(${x} ${y})"><circle r="30" fill="${C.gold}" opacity=".35"/><rect x="-9" y="-12" width="18" height="24" rx="4" fill="${C.gold}" stroke="#8a5a14" stroke-width="2"/><path d="M-6 -12q6 -10 12 0" stroke="#8a5a14" stroke-width="2" fill="none"/></g>`,
  "6-8": (x, y) =>
    `<g transform="translate(${x} ${y})"><circle r="28" fill="${C.tealLt}" opacity=".5"/><path d="M-12 12L0 -6L12 12" stroke="#2a3a48" stroke-width="3" fill="none"/><rect x="-2" y="-22" width="4" height="18" fill="#2a3a48"/><circle cy="-24" r="6" fill="${C.teal}"/></g>`,
};

export const hasPic = (key) => key in PICS || key in WIDE;
export const hasSpots = (key) => key in SPOTS;
/** A picture by key (decorative: the button or figure around it carries the words). */
export function pic(key, cls = "lexp-pic") {
  if (PICS[key]) return svg("0 0 160 125", PICS[key](), { cls });
  const [vb, body] = WIDE[key] || ["0 0 10 10", ""];
  return svg(vb, body, { cls: `${cls} lexp-wide` });
}
/** The scene behind a tap-a-spot activity, with the marker drawn where the learner placed it. */
export const spotScene = (key, band, placed) =>
  `${SPOTS[key] || ""}${placed ? MARKER[band === "6-8" ? "6-8" : "3-5"](placed.x, placed.y) : ""}`;

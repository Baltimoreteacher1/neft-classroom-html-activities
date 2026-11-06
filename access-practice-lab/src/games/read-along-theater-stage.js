// Read-Along Theater stage art: backdrop, two actors whose faces follow their feeling cards, curtains that open as the show succeeds.
import { C, svg } from "./art.js";
import { html, settled } from "./engine.js";

export const COLORS = { coral: C.coral, teal: C.teal, gold: C.gold, navy: "#4f7fb0" };

// ── the stage: backdrop, two actors (faces follow their feeling cards), curtains open as you go ─
const FACE = {
  none: '<path d="M-6 10h12" stroke-width="3"/>',
  smile: '<path d="M-8 7q8 8 16 0" stroke-width="3"/>',
  grin: '<path d="M-9 6q9 11 18 0Z" fill="#fff" stroke-width="2.6"/>',
  frown: '<path d="M-8 12q8 -7 16 0" stroke-width="3"/>',
  sleepy:
    '<path d="M-12 -3h7M5 -3h7" stroke-width="3"/><circle cx="0" cy="11" r="3" stroke-width="2.4"/>',
  worry:
    '<path d="M-8 12q4 -4 8 0t8 0" stroke-width="2.6"/><path d="M-13 -11l7 3M13 -11l-7 3" stroke-width="2.6"/>',
  blush:
    '<path d="M-6 10h12" stroke-width="3"/><circle cx="-13" cy="5" r="4" fill="#f2765a" stroke="none" opacity=".7"/><circle cx="13" cy="5" r="4" fill="#f2765a" stroke="none" opacity=".7"/>',
  flat: '<path d="M-7 10h14" stroke-width="3"/><path d="M-12 -6h7M5 -6h7" stroke-width="2.4"/>',
  angry:
    '<path d="M-8 12q8 -6 16 0" stroke-width="3"/><path d="M-13 -12l8 4M13 -12l-8 4" stroke-width="3"/>',
  set: '<path d="M-7 9h14" stroke-width="3.4"/><path d="M-13 -9h8M5 -9h8" stroke-width="3"/>',
  soft: '<path d="M-12 -3q3.5 -4 7 0M5 -3q3.5 -4 7 0" stroke-width="2.6"/><path d="M-6 8q6 5 12 0" stroke-width="2.6"/>',
};
const BACKDROP = {
  park: `<rect width="480" height="170" fill="${C.skyLt}"/><circle cx="400" cy="46" r="20" fill="${C.gold}"/><path d="M0 150q120 -50 240 -10t240 -20V170H0Z" fill="${C.leafLt}"/><rect x="66" y="70" width="12" height="70" fill="${C.woodDk}"/><circle cx="72" cy="62" r="34" fill="${C.leaf}"/>`,
  home: `<rect width="480" height="170" fill="${C.sand}"/><rect x="330" y="30" width="90" height="70" rx="6" fill="${C.skyLt}" stroke="${C.wood}" stroke-width="6"/><path d="M375 30v70M330 65h90" stroke="${C.wood}" stroke-width="4"/><rect x="40" y="110" width="120" height="14" rx="4" fill="${C.wood}"/><rect x="52" y="124" width="8" height="30" fill="${C.woodDk}"/><rect x="140" y="124" width="8" height="30" fill="${C.woodDk}"/>`,
  night: `<rect width="480" height="170" fill="${C.night}"/><circle cx="390" cy="44" r="18" fill="${C.paper}"/><circle cx="398" cy="38" r="15" fill="${C.night}"/>${[
    [60, 30],
    [140, 56],
    [250, 24],
    [320, 70],
    [450, 96],
  ]
    .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.4" fill="#fff"/>`)
    .join(
      "",
    )}<path d="M40 150L100 70L160 150Z" fill="${C.coralDk}"/><path d="M100 70V150" stroke="${C.night}" stroke-width="3"/>`,
  school: `<rect width="480" height="170" fill="#e8eef5"/><rect x="150" y="22" width="180" height="78" rx="6" fill="${C.leafDk}" stroke="${C.wood}" stroke-width="6"/><path d="M172 48h60M172 66h100" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/><rect x="40" y="96" width="70" height="56" rx="6" fill="${C.stone}"/>`,
};
export function stageArt(s, env, play, doneN) {
  const I = env.I;
  const inCall = s.page >= s.pages.length;
  const ps = inCall ? null : s.pages[s.page];
  const task = inCall ? null : play.pages[s.page].task;
  const gap = 80 + doneN * 32; // curtains open wider as the show succeeds
  const faceFor = (castId) => {
    if (ps?.kind === "mood")
      return task.cards.find((c) => c.id === ps.placed[castId])?.face || "none";
    return s.fx === "right" || inCall ? "smile" : "none";
  };
  const actor = (c, i) => {
    const x = i ? 290 : 190;
    const face = faceFor(c.id);
    return `<g class="rat-actor${s.fx === "right" ? " is-cheer" : ""}" transform="translate(${x} 128)"><rect x="-22" y="0" width="44" height="40" rx="14" fill="${COLORS[c.color]}" stroke="${C.navy}" stroke-width="2.6"/><circle r="26" fill="${C.sand}" stroke="${C.navy}" stroke-width="2.6"/><circle cx="-9" cy="-4" r="3.4" fill="${C.navy}"/><circle cx="9" cy="-4" r="3.4" fill="${C.navy}"/><g fill="none" stroke="${C.navy}" stroke-linecap="round">${face === "sleepy" || face === "soft" ? `<rect x="-14" y="-9" width="28" height="9" fill="${C.sand}" stroke="none"/>` : ""}${FACE[face]}</g><text y="56" text-anchor="middle" font-size="14" font-weight="800" fill="#fff">${c.name.replace(/[<&>"]/g, "")}</text></g>`;
  };
  const cone = `<path d="M210 0L130 190H350L270 0Z" fill="${C.gold}" opacity="${s.fx === "right" ? 0.3 : 0.12}"/>`;
  const curtains = `<path class="rat-curtain" d="M0 0H${240 - gap}Q${220 - gap} 100 ${236 - gap} 210H0Z" fill="${C.coral}" stroke="${C.coralDk}" stroke-width="3"/><path class="rat-curtain" d="M480 0H${240 + gap}Q${260 + gap} 100 ${244 + gap} 210H480Z" fill="${C.coral}" stroke="${C.coralDk}" stroke-width="3"/><path d="M0 0H480V18Q240 34 0 18Z" fill="${C.coralDk}"/>`;
  const burst =
    s.fx === "right"
      ? `<g class="rat-burst">${[
          [120, 50],
          [360, 44],
          [240, 26],
          [80, 110],
          [400, 104],
        ]
          .map(
            ([x, y], i) =>
              `<path transform="translate(${x} ${y}) scale(${0.8 + (i % 2) * 0.5})" d="M0 -10L3 -3L10 -2L5 3L6 10L0 6L-6 10L-5 3L-10 -2L-3 -3Z" fill="${C.gold}" stroke="${C.navy}" stroke-width="1.4"/>`,
          )
          .join("")}</g>`
      : "";
  const label = inCall
    ? I.S(
        "The stage at the curtain call. Both actors stand under the lights.",
        "El escenario en la despedida. Los dos actores están bajo las luces.",
      )
    : I.S(
        `Stage, page ${s.page + 1} of 3: ${play.cast.map((c) => c.name).join(" and ")}.`,
        `Escenario, página ${s.page + 1} de 3: ${play.cast.map((c) => c.name).join(" y ")}.`,
      );
  return html`<figure class="rat-stage${s.fx ? ` is-${s.fx}` : ""}${s.flip ? " is-flip" : ""}">
    ${svg("0 0 480 210", `<rect width="480" height="210" fill="${C.ink}"/><g>${BACKDROP[play.set]}</g><rect y="168" width="480" height="42" fill="${C.wood}"/><path d="M0 168H480" stroke="${C.woodDk}" stroke-width="4"/>${cone}${play.cast.map(actor).join("")}${curtains}${burst}`, { label })}
  </figure>`;
}

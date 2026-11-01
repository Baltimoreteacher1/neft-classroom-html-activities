// The Math Baseball diamond. Runners and the ball rest at their final spots (a `transform` attribute) and, when motion
// is allowed, fly there along the base paths with the Web Animations API, so reduced motion simply skips the flight.
import { t } from "./i18n.js";
import { esc, flyAlong } from "./arcade-shared.js";

// Home, first, second, third; index 4 is home again for a runner who scores.
export const SPOTS = [
  [120, 178],
  [182, 120],
  [120, 62],
  [58, 120],
  [120, 178],
];
// Where the ball lands for each result. A home run clears the fence.
const BALL = {
  single: [166, 104],
  double: [196, 58],
  triple: [44, 56],
  homerun: [120, 4],
  out: [92, 108],
};

const spot = ([x, y]) => `translate(${x} ${y})`;

// A screen-reader summary of the play: who is on base and how many are out.
export function fieldLabel(bases, outs) {
  const on = [
    bases[0] && t("first base"),
    bases[1] && t("second base"),
    bases[2] && t("third base"),
  ].filter(Boolean);
  return `${on.length ? t("Runners on {bases}.", { bases: on.join(", ") }) : t("No runners on base.")} ${t("Outs: {n} of 3", { n: outs })}`;
}

const runner = (path, mark, color, scored) =>
  `<g class="bb-runner" data-runner data-path="${path.map(([x, y]) => `${x},${y}`).join(" ")}" data-scored="${scored}" transform="${spot(path.at(-1))}"${scored ? ' opacity="0"' : ""}><circle r="10" fill="${color}" stroke="#fff" stroke-width="2"/><text y="4" text-anchor="middle" font-size="11" font-weight="700" fill="#fff">${esc(mark)}</text></g>`;

// `moves` are the last play's runner moves; `bases` the runners left on base; `outcome` is a tier id, "out" or null.
export function fieldHtml({ bases, outs, mark, color, moves = [], outcome = null }) {
  const batterWaits = !moves.length;
  const travelers = moves.map((move) =>
    runner(SPOTS.slice(move.from, move.to + 1), mark, color, move.to === 4),
  );
  // Runners already on base before the batter swings stand still.
  const standing = moves.length
    ? []
    : bases.flatMap((on, i) => (on ? [runner([SPOTS[i + 1]], mark, color, false)] : []));
  const batter = batterWaits ? runner([SPOTS[0]], mark, color, false) : "";
  const ball = outcome
    ? `<circle class="bb-ball" data-ball data-path="${SPOTS[0].join(",")} ${BALL[outcome].join(",")}" r="5" fill="#fff" stroke="#13233a" stroke-width="2" transform="${spot(BALL[outcome])}"/>`
    : "";
  const baseSquares = [1, 2, 3]
    .map(
      (n) =>
        `<rect class="bb-base${bases[n - 1] ? " on" : ""}" x="-8" y="-8" width="16" height="16" transform="${spot(SPOTS[n])} rotate(45)"/>`,
    )
    .join("");
  return `<svg class="bb-svg" viewBox="0 0 240 200" role="img" aria-label="${esc(fieldLabel(bases, outs))}">
    <rect class="bb-grass" width="240" height="200" rx="14"/>
    <path class="bb-fence" d="M14 80 Q120 -34 226 80" fill="none"/>
    <polygon class="bb-dirt" points="120,178 182,120 120,62 58,120"/>
    <circle class="bb-mound" cx="120" cy="120" r="9"/>
    ${baseSquares}
    <polygon class="bb-home" points="120,170 128,176 125,185 115,185 112,176"/>
    ${standing.join("")}${batter}${travelers.join("")}${ball}</svg>`;
}

// Plays the last play: runners follow the base paths, the ball flies to where it landed.
export function animateField(host) {
  for (const element of host.querySelectorAll("[data-runner]")) {
    const points = (element.dataset.path || "")
      .split(" ")
      .map((pair) => pair.split(",").map(Number));
    const scored = element.dataset.scored === "true";
    flyAlong(
      element,
      points.map((point, i) => (scored && i === points.length - 1 ? [...point, 0] : point)),
    );
  }
  for (const ball of host.querySelectorAll("[data-ball]")) {
    const [start, end] = ball.dataset.path.split(" ").map((pair) => pair.split(",").map(Number));
    flyAlong(ball, [start, [(start[0] + end[0]) / 2, Math.min(start[1], end[1]) - 34], end], {
      step: 420,
      easing: "ease-out",
    });
  }
}

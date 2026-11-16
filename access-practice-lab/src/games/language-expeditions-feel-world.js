// Language Expeditions world restoration (feature "feel"): every stamped land visibly changes, driven from state on
// each paint, so a reload shows the same restored world. Grades 3-5: the lantern lights more of the Whispering
// Forest, lamps along the Library Ruins stay lit, fireflies gather in Echo Canyon, the lighthouse beam turns on
// after Writing. Grades 6-8: the radio signal brings Red Rock Canyon to life, the Archive windows glow, antenna
// lights blink on over the Wind Caves, the summit dish turns and lights after Writing. Decorative (the scene stays
// aria-hidden); the stamps themselves are announced in the panels.
//
// When all four lands are stamped the journey summary plays a short finale once per session: the camera pans the
// whole trail while a beacon (3-5) or signal (6-8) sweeps across it. Reduced motion or Calm shows the final still
// frame instead. Never a score.
import { paintGear } from "./language-expeditions-feel-gear.js";
import { LW, aim, gateX, trailX } from "./language-expeditions-world.js";

const G = 790; // ground line (world units)
const rngLite = (seed) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
const wash = (o, c) =>
  `<ellipse cx="${o + 2000}" cy="${G - 120}" rx="1900" ry="300" fill="${c}" opacity=".13"/>`;

const RESTORE = {
  "3-5": [
    // Listening: the lantern lights more of the forest (warm light in the trees, small lanterns hung in branches).
    (o) =>
      wash(o, "#f2c15b") +
      [700, 1650, 2550, 3350]
        .map(
          (x) =>
            `<circle cx="${o + x}" cy="560" r="90" fill="#f2c15b" opacity=".1"/><path d="M${o + x} 470v40" stroke="#3b2a22" stroke-width="4"/><rect x="${o + x - 12}" y="510" width="24" height="30" rx="6" fill="#ffe9a0"/>`,
        )
        .join(""),
    // Reading: lamps along the land stay lit.
    (o) =>
      wash(o, "#f2c15b") +
      [500, 900, 1700, 2600, 2900, 3450]
        .map(
          (x) =>
            `<rect x="${o + x - 3}" y="${G - 96}" width="6" height="96" fill="#3a2a20"/><circle cx="${o + x}" cy="${G - 102}" r="26" fill="#f2c15b" opacity=".3"/><circle cx="${o + x}" cy="${G - 102}" r="10" fill="#ffe9a0"/>`,
        )
        .join(""),
    // Speaking: fireflies gather.
    (o) => {
      const r = rngLite(41);
      let s = wash(o, "#f2c15b");
      for (let i = 0; i < 46; i += 1)
        s += `<circle class="lexp-fly" cx="${(o + 500 + r() * 3000).toFixed(0)}" cy="${(470 + r() * 280).toFixed(0)}" r="${(3 + r() * 3).toFixed(1)}" fill="#ffe9a0" style="animation-delay:${(-r() * 4).toFixed(2)}s"/>`;
      return s;
    },
    // Writing: the lighthouse beam turns on.
    (o) =>
      wash(o, "#f2c15b") +
      `<g class="lexp-feel-beam" style="transform-origin:${o + 2810}px 340px"><path d="M${o + 2810} 340L${o + 1500} 180V500Z" fill="#ffe9a0" opacity=".32"/><path d="M${o + 2810} 340L${o + 4100} 200V480Z" fill="#ffe9a0" opacity=".22"/></g><circle cx="${o + 2810}" cy="340" r="34" fill="#fff6d0"/>`,
  ],
  "6-8": [
    // Listening: the radio signal brings the canyon to life (signal rings, blooming cactus and flowers).
    (o) =>
      wash(o, "#1fa6a2") +
      [60, 120, 190]
        .map(
          (rr, i) =>
            `<circle class="lexp-pulse" cx="${o + 1384}" cy="556" r="${rr}" fill="none" stroke="#7fe0d0" stroke-width="6" opacity=".55" style="animation-delay:${-i * 0.6}s"/>`,
        )
        .join("") +
      [600, 1000, 1800, 2500, 3300]
        .map(
          (x, i) =>
            `<circle cx="${o + x}" cy="${G - 6}" r="9" fill="${i % 2 ? "#f2c15b" : "#c94f3b"}"/><path d="M${o + x} ${G - 2}v14" stroke="#3f6b45" stroke-width="4"/>`,
        )
        .join(""),
    // Reading: the archive windows glow.
    (o) =>
      wash(o, "#f2c15b") +
      [0, 1, 2, 3]
        .map((r) =>
          [0, 1, 2, 3]
            .map(
              (c) =>
                `<rect x="${o + 2978 + c * 72}" y="${538 + r * 60}" width="34" height="24" fill="#f2c15b" opacity=".9"/>`,
            )
            .join(""),
        )
        .join("") +
      [0, 1, 2, 3]
        .map(
          (i) =>
            `<rect x="${o + 1150 + i * 85}" y="560" width="28" height="${G - 560}" fill="#f2c15b" opacity=".35"/>`,
        )
        .join(""),
    // Speaking: antenna lights blink on over the caves.
    (o) =>
      wash(o, "#1fa6a2") +
      [
        [1500, 520],
        [2800, 410],
        [3400, 560],
        [800, 600],
      ]
        .map(
          ([x, top], i) =>
            `<rect x="${o + x - 3}" y="${top - 140}" width="6" height="140" fill="#2a3a48"/><path d="M${o + x - 26} ${top}L${o + x} ${top - 140}L${o + x + 26} ${top}" stroke="#2a3a48" stroke-width="3" fill="none"/><circle class="lexp-feel-blink" cx="${o + x}" cy="${top - 146}" r="9" fill="${i % 2 ? "#f2c15b" : "#7fe0d0"}" style="animation-delay:${-i * 0.4}s"/>`,
        )
        .join(""),
    // Writing: the summit dish turns and lights, sending its signal up.
    (o) =>
      wash(o, "#1fa6a2") +
      `<g class="lexp-feel-dish" style="transform-origin:${o + 2925}px 470px"><path d="M${o + 2870} 470a60 60 0 0 0 110 0Z" fill="#f7f4ec" stroke="#2a3a48" stroke-width="5"/><path d="M${o + 2925} 470v-50" stroke="#2a3a48" stroke-width="6"/><circle cx="${o + 2925}" cy="414" r="14" fill="#7fe0d0"/></g><path d="M${o + 2925} 410L${o + 2780} 0H${o + 3070}Z" fill="#7fe0d0" opacity=".22"/>`,
  ],
};

const bandKey = (b) => (b === "6-8" ? "6-8" : "3-5");

/** Restoration art goes into the near layer once per painted scene (the scene node is kept across re-renders). */
function ensureArt(sceneEl, band) {
  const near = sceneEl.querySelector(".lexp-near");
  if (!near || near.querySelector("[data-feel-land]")) return;
  const art = RESTORE[bandKey(band)]
    .map((f, k) => `<g class="lexp-feel-r" data-feel-land="${k}">${f(k * LW)}</g>`)
    .join("");
  near.insertAdjacentHTML("beforeend", art);
  sceneEl.insertAdjacentHTML(
    "beforeend",
    '<div class="lexp-feel-finale"><i class="lexp-feel-sweep"></i></div>',
  );
}

let finaleFor = null; // the session id whose finale already played (view memory, never saved)
const allStamped = (s) => s.lands.length > 0 && s.lands.every((L) => L.stamp);

/**
 * Paints restoration and gear from state, and plays the finale at the summary. Returns a cleanup (or null).
 * `live` is the module's scene memory; the finale leaves the camera where it ended.
 */
export function paintFeel(sceneEl, s, band, { motion, live }) {
  ensureArt(sceneEl, band);
  s.lands.forEach((L, k) => sceneEl.classList.toggle(`is-restored-${k}`, Boolean(L.stamp)));
  paintGear(sceneEl, s);
  const finale = s.at === "summary" && allStamped(s);
  sceneEl.classList.toggle("is-finale", finale);
  if (!finale) {
    sceneEl.classList.remove("is-finale-run", "is-finale-done");
    return null;
  }
  if (!motion || finaleFor === s.sid) {
    finaleFor = s.sid;
    sceneEl.classList.add("is-finale-done");
    return null;
  }
  finaleFor = s.sid;
  // A few seconds of motion: the camera pans the whole trail while the beacon sweeps across it.
  const x0 = trailX(0);
  const x1 = gateX(3);
  const MS = 5200;
  let raf = 0;
  let t0 = 0;
  sceneEl.classList.remove("is-finale-done");
  sceneEl.classList.add("is-finale-run");
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
  const step = (t) => {
    if (!t0) t0 = t;
    const p = Math.min(1, (t - t0) / MS);
    const x = x0 + (x1 - x0) * ease(p);
    aim(sceneEl, x);
    if (live) live.x = x;
    if (p < 1) raf = requestAnimationFrame(step);
    else {
      sceneEl.classList.remove("is-finale-run");
      sceneEl.classList.add("is-finale-done");
    }
  };
  aim(sceneEl, x0);
  raf = requestAnimationFrame(step);
  return () => {
    cancelAnimationFrame(raf);
    sceneEl.classList.remove("is-finale-run");
  };
}

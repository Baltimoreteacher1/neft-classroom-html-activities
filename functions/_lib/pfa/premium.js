// Premium layer for the PFA pages: the progress trail, tier medals, finish trophy and ring, the
// family "tonight's plan" with its growing plant, and the family unit path. Server-side markup only;
// client-premium.js brings it to life. Everything here is screen-only (.no-print), so the printed
// homework, assignment and family guide keep their page budgets.
// Palette: the PFA tokens only (navy, teal, amber, paper; no purple range). Motion is transform and
// opacity only and stops under prefers-reduced-motion or the page toggle (design-system.css).

import { bi, h } from "./problem-view.js";

const C = {
  navy: "#17324D",
  teal: "#1FA6A2",
  tealInk: "#177B78",
  tealSoft: "#BFE6E4",
  amber: "#F2C15B",
  amberDeep: "#D9A23A",
  amberSoft: "#FBE7B5",
  paper: "#F7F4EC",
  wood: "#B9824F",
  grass: "#8CC9A0",
  leaf: "#3E9A6B",
};

const svg = (w, hgt, body, cls) =>
  `<svg class="${cls}" viewBox="0 0 ${w} ${hgt}" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

// Tier glyphs drawn on the medal disc (same shapes as the tier icons).
const GLYPH = {
  1: "M32 46a9 9 0 01-9-9c0-6 9-15 9-15s9 9 9 15a9 9 0 01-9 9z",
  2: "M20 46h24M23 46v-8h5v8M28 46V30h6v16M34 46V35h6v11",
  3: "M20 44l8-11 6 6 9-14M35 25h8v8",
};
const RIBBON = { 1: [C.teal, C.tealInk], 2: [C.amber, C.amberDeep], 3: [C.navy, C.tealInk] };

/** A tier medal: ribbon, disc, glyph and a shine that sweeps once when earned. */
let mdUid = 0;
export function medal(tier) {
  const [a, b] = RIBBON[tier];
  const cid = `md-clip-${++mdUid}`;
  return svg(
    64,
    80,
    `<path d="M18 2h12l6 26H24z" fill="${a}"/><path d="M34 2h12l-6 26H28z" fill="${b}"/>
<g class="md-disc"><circle cx="32" cy="50" r="24" fill="${C.amberDeep}"/><circle cx="32" cy="50" r="20" fill="${C.amber}"/><circle cx="32" cy="50" r="16" fill="none" stroke="${C.amberSoft}" stroke-width="2"/>
<g transform="translate(0 13)"><path d="${GLYPH[tier]}" fill="${tier === 1 ? C.navy : "none"}" stroke="${C.navy}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
<clipPath id="${cid}"><circle cx="32" cy="50" r="20"/></clipPath><g clip-path="url(#${cid})"><rect class="md-shine" x="-8" y="20" width="10" height="64" fill="#fff" opacity=".55" transform="rotate(20 32 50)"/></g></g>`,
    "md",
  );
}

/** Three medal slots for the homework hero. Locked until the tier is complete. */
export function medalShelf(tiers, key = "hero") {
  return `<div class="medals no-print" aria-labelledby="medals-${key}"><p class="medals-h" id="medals-${key}">${bi("medalsTitle")}</p><ul>${tiers
    .map(
      (tier) =>
        `<li class="medal is-locked" data-tier="${tier}">${medal(tier)}<span class="medal-name">${bi(`tier${tier}`)}</span><span class="sr">: <span class="medal-state">${bi("medalLocked")}</span></span></li>`,
    )
    .join("")}</ul></div>`;
}

const STAR = "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z";
const CHECK = "M6 12.5l4 4 8-9";

/** The homework trail: one stop per counted problem, a gate between tiers, the finish flag last. */
export function trail(stops) {
  let lastTier = null;
  const items = [];
  for (const s of stops) {
    if (lastTier !== null && s.tier !== lastTier)
      items.push(
        `<li class="trail-gate" data-tier="${lastTier}" aria-hidden="true">${medal(lastTier)}</li>`,
      );
    lastTier = s.tier;
    items.push(
      `<li class="trail-stop t${s.tier}" data-pid="${h(s.pid)}"><a class="trail-node" href="#p-${h(s.pid)}"><span class="trail-n" aria-hidden="true">${s.n}</span>${svg(24, 24, `<path d="${STAR}" fill="${C.amber}" stroke="${C.navy}" stroke-width="1.5" stroke-linejoin="round"/>`, "trail-star")}${svg(24, 24, `<path d="${CHECK}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`, "trail-check")}<span class="sr">${bi("problem")} ${s.n}: <span class="trail-state">${bi("trailNotStarted")}</span></span></a></li>`,
    );
  }
  if (lastTier !== null)
    items.push(
      `<li class="trail-gate" data-tier="${lastTier}" aria-hidden="true">${medal(lastTier)}</li>`,
    );
  items.push(
    `<li class="trail-goal"><a class="trail-node" href="#finish-row">${svg(32, 32, `<path d="M8 29V4" stroke="${C.navy}" stroke-width="3" stroke-linecap="round"/><path class="flag-cloth" d="M9 5h17l-4 6 4 6H9z" fill="${C.amber}" stroke="${C.navy}" stroke-width="2" stroke-linejoin="round"/>`, "trail-flag")}<span class="sr">${bi("trailGoal")}</span></a></li>`,
  );
  return `<nav class="trail no-print" aria-labelledby="trail-h"><h2 class="sr" id="trail-h">${bi("trailTitle")}</h2><ol class="trail-list">${items.join("")}</ol></nav>`;
}

/** The inline card that appears when every problem in a tier is solved. Hidden until then. */
export function tierDone(tier, isLast) {
  return `<div class="tier-done no-print" data-tier-done="${tier}" hidden>${medal(tier)}<div><p class="tier-done-h">${bi(`medalEarned${tier}`)}</p><p class="tier-note">${bi(isLast ? "tierDoneLast" : `tierDoneNext${tier}`)}</p></div></div>`;
}

/** Finish-screen art: a trophy that lifts in, and a ring of how the problems went. */
export function trophy() {
  const sparks = [
    [18, 22],
    [102, 18],
    [12, 70],
    [108, 64],
  ]
    .map(
      ([x, y], i) =>
        `<path class="tr-spark s${i}" d="M${x} ${y - 7}l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="${C.amber}"/>`,
    )
    .join("");
  return svg(
    120,
    120,
    `${sparks}<g class="tr-cup"><path d="M36 22h48v18a24 24 0 01-48 0z" fill="${C.amber}" stroke="${C.navy}" stroke-width="3"/><path d="M36 28H26a10 10 0 0010 14M84 28h10a10 10 0 01-10 14" fill="none" stroke="${C.navy}" stroke-width="3"/><path d="M46 28v10" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/><path d="M54 64h12v14H54z" fill="${C.amberDeep}" stroke="${C.navy}" stroke-width="3"/><rect x="40" y="78" width="40" height="12" rx="3" fill="${C.navy}"/><rect x="34" y="90" width="52" height="10" rx="3" fill="${C.teal}" stroke="${C.navy}" stroke-width="2"/><path d="M60 34l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1z" fill="#fff"/></g>`,
    "trophy",
  );
}
export function ring() {
  return `<div class="ring-wrap"><svg class="ring" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle cx="60" cy="60" r="46" fill="none" stroke="#E6E1D5" stroke-width="16"/><g class="ring-segs" transform="rotate(-90 60 60)"><circle class="ring-a" cx="60" cy="60" r="46" fill="none" stroke="${C.teal}" stroke-width="16" stroke-dasharray="0 999"/><circle class="ring-b" cx="60" cy="60" r="46" fill="none" stroke="${C.amber}" stroke-width="16" stroke-dasharray="0 999"/></g><text class="ring-num" x="60" y="66" text-anchor="middle">0</text></svg>
<ul class="ring-legend"><li><span class="sw sw-a" aria-hidden="true"></span><span>${bi("ringFirst")}: <strong class="rl-a">0</strong></span></li><li><span class="sw sw-b" aria-hidden="true"></span><span>${bi("ringLater")}: <strong class="rl-b">0</strong></span></li><li><span class="sw sw-c" aria-hidden="true"></span><span>${bi("ringOpen")}: <strong class="rl-c">0</strong></span></li></ul></div>`;
}

// ---------------------------------------------------------------------------------------------
// Family guide: tonight's plan

// Small illustrated icons for the four plan steps (56x56).
const PLAN_ART = {
  read: `<rect x="6" y="12" width="44" height="32" rx="4" fill="${C.paper}" stroke="${C.navy}" stroke-width="2.5"/><path d="M28 12v32" stroke="${C.navy}" stroke-width="2.5"/><path d="M12 22h11M12 28h11M12 34h8M33 22h11M33 28h11M33 34h8" stroke="${C.teal}" stroke-width="2.5" stroke-linecap="round"/>`,
  watch: `<rect x="6" y="10" width="44" height="30" rx="5" fill="${C.navy}"/><path d="M24 18l12 7-12 7z" fill="${C.amber}"/><rect x="18" y="44" width="20" height="4" rx="2" fill="${C.teal}"/>`,
  try: `<rect x="10" y="8" width="36" height="40" rx="4" fill="#fff" stroke="${C.navy}" stroke-width="2.5"/><path d="M16 20h14M16 28h20M16 36h10" stroke="${C.tealInk}" stroke-width="2.5" stroke-linecap="round"/><path d="M34 44l14-14 4 4-14 14-6 2z" fill="${C.amber}" stroke="${C.navy}" stroke-width="2"/>`,
  talk: `<path d="M6 12h30a4 4 0 014 4v14a4 4 0 01-4 4H18l-8 7v-7H6a4 4 0 01-4-4V16a4 4 0 014-4z" fill="${C.tealSoft}" stroke="${C.navy}" stroke-width="2.5"/><path d="M24 26h22a4 4 0 014 4v10a4 4 0 01-4 4h-2v6l-7-6H24a4 4 0 01-4-4V30a4 4 0 014-4z" fill="${C.amberSoft}" stroke="${C.navy}" stroke-width="2.5"/>`,
};
export const PLAN_STEPS = [
  { key: "read", target: "learn-h", label: "planRead" },
  { key: "watch", target: "how-h", label: "planWatch" },
  { key: "try", target: "try-h", label: "planTry" },
  { key: "talk", target: "talk-h", label: "planTalk" },
];

/** The plant grows one stage per finished step and blooms when all four are done. */
export function plant() {
  return svg(
    120,
    140,
    `<ellipse cx="60" cy="132" rx="40" ry="5" fill="${C.navy}" opacity=".12"/>
<g class="pl-seed"><path d="M60 92v6" stroke="${C.leaf}" stroke-width="3" stroke-linecap="round"/><ellipse cx="60" cy="101" rx="7" ry="4.5" fill="#8D5524"/></g>
<g class="pl-stage pl-1"><path d="M60 104V80" stroke="${C.leaf}" stroke-width="5" stroke-linecap="round"/><path d="M60 88c-12 0-18-8-18-14 10 0 18 5 18 14z" fill="${C.grass}"/></g>
<g class="pl-stage pl-2"><path d="M60 80V58" stroke="${C.leaf}" stroke-width="5" stroke-linecap="round"/><path d="M60 72c12 0 20-8 20-15-11 0-20 6-20 15z" fill="${C.grass}"/></g>
<g class="pl-stage pl-3"><path d="M60 58V44" stroke="${C.leaf}" stroke-width="5" stroke-linecap="round"/><ellipse cx="60" cy="40" rx="8" ry="10" fill="${C.teal}"/></g>
<g class="pl-stage pl-4"><g class="pl-bloom">${[0, 60, 120, 180, 240, 300]
      .map(
        (a) =>
          `<ellipse cx="60" cy="24" rx="9" ry="14" fill="${C.amber}" stroke="${C.amberDeep}" stroke-width="1.5" transform="rotate(${a} 60 40)"/>`,
      )
      .join(
        "",
      )}<circle cx="60" cy="40" r="9" fill="${C.navy}"/><circle cx="57" cy="37" r="2.5" fill="#fff" opacity=".7"/></g></g>
<path d="M34 104h52l-6 30H40z" fill="${C.wood}" stroke="${C.navy}" stroke-width="2.5" stroke-linejoin="round"/><rect x="30" y="98" width="60" height="10" rx="3" fill="#C9785B" stroke="${C.navy}" stroke-width="2.5"/>`,
    "plant",
  );
}

export function familyPlan() {
  const steps = PLAN_STEPS.map(
    (s, k) =>
      `<li class="plan-step" data-k="${k}"><a class="plan-ico" href="#${s.target}">${svg(56, 56, PLAN_ART[s.key], "plan-art")}<span class="sr">${bi("planGo")}: </span></a><span class="plan-label">${bi(s.label)}</span><button class="btn quiet plan-done" type="button" data-act="plan" data-k="${k}" aria-pressed="false">${svg(24, 24, `<path d="${CHECK}" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`, "ico")}<span>${bi("planDone")}</span><span class="sr">: ${bi(s.label)}</span></button></li>`,
  ).join("");
  return `<section class="section fam-plan no-print" aria-labelledby="plan-h"><div class="plan-garden">${plant()}</div><div class="plan-main"><h2 id="plan-h">${bi("planTitle")}</h2><p class="tier-note">${bi("planNote")}</p><ol class="plan-steps">${steps}</ol><p class="plan-meter" aria-live="polite"></p></div></section>`;
}

// ---------------------------------------------------------------------------------------------
// Family unit hub: the unit path, one stop per lesson, a check when its plan is done on this device.
export function unitPath(lessons) {
  const stops = lessons
    .map(
      ({ lid, title }, i) =>
        `<li class="trail-stop map-stop" data-lid="${h(lid)}"><a class="trail-node" href="/lessons/${h(lid)}/family-guide"><span class="trail-n" aria-hidden="true">${i + 1}</span>${svg(24, 24, `<path d="${CHECK}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`, "trail-check")}<span class="sr">${bi({ en: `Lesson ${lid}`, es: `Lección ${lid}` })} ${bi(title)}: <span class="trail-state">${bi("mapNotYet")}</span></span></a><span class="map-id" aria-hidden="true">${h(lid)}</span></li>`,
    )
    .join("");
  const house = svg(
    40,
    40,
    `<path d="M6 19L20 7l14 12v15H6z" fill="${C.amber}" stroke="${C.navy}" stroke-width="2.5" stroke-linejoin="round"/><rect x="16" y="23" width="8" height="11" fill="${C.navy}"/><rect x="25" y="18" width="5" height="5" fill="${C.tealSoft}" stroke="${C.navy}" stroke-width="1.5"/>`,
    "map-house",
  );
  return `<section class="section unit-map no-print" aria-labelledby="map-h"><h2 id="map-h">${bi("mapTitle")}</h2><p class="tier-note">${bi("mapNote")}</p><ol class="trail-list map-list">${stops}<li class="trail-goal" aria-hidden="true">${house}</li></ol><p class="map-meter" data-lids="${h(lessons.map((x) => x.lid).join(","))}"></p></section>`;
}

/** A unit-progress line for a card on the family index (filled in by the client). */
export function unitMeter(lids) {
  return `<p class="map-meter no-print" data-lids="${h(lids.join(","))}"></p>`;
}

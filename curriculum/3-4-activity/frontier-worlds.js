/* Lesson 3.4 games · two expedition worlds.
 *   Laser Lab  → The Crystal Frontier: best stars per sector power a starship's journey.
 *   Sonar Hunt → Abyssal Rescue: stars from found fleets fund a deep-sea rescue base.
 * Ship equipment and sonar rigs unlocked here change how the native games play.
 * Requires /curriculum/review-expeditions/basecamp.js (ExpeditionCampaign).
 */
(() => {
  "use strict";
  const X = [150, 390, 630, 850];
  const cls = (ctx, i) => {
    const on = i === 3 ? ctx.finished : ctx.built[i];
    return `xc-mark${on ? " xc-mark--on" : ""}${ctx.justBuilt === i ? " xc-mark--new" : ""}`;
  };
  const stop = (ctx) => X[ctx.finished ? 3 : Math.min(ctx.now, 3)];

  function frontierScene(ctx) {
    return `<svg viewBox="0 0 960 230" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs><radialGradient id="frSky" cx=".5" cy=".3" r=".9"><stop offset="0" stop-color="#3a2a7a"/><stop offset="1" stop-color="#0b0b26"/></radialGradient></defs>
      <rect width="960" height="230" fill="url(#frSky)"/>
      <g fill="#fff"><circle cx="60" cy="40" r="1.5"/><circle cx="210" cy="190" r="1.2"/><circle cx="300" cy="30" r="1.8"/><circle cx="470" cy="200" r="1.3"/><circle cx="540" cy="50" r="1.1"/><circle cx="760" cy="30" r="1.6"/><circle cx="910" cy="180" r="1.4"/><circle cx="700" cy="200" r="1.1"/></g>
      <path d="M0 160 C200 100 400 200 960 90" stroke="#5a4bb0" stroke-width="40" opacity=".25" fill="none"/>
      <path class="xc-road" d="M${X[0]} 120 L${X[1]} 110 L${X[2]} 120 L${X[3]} 100" stroke="#7ad7ff" stroke-width="2" stroke-dasharray="3 9" fill="none"/>
      ${[0, 1, 2]
        .map(
          (i) => `<g class="${cls(ctx, i)}" transform="translate(${X[i]} ${i === 1 ? 110 : 120})">
        <polygon points="0,-30 18,0 0,30 -18,0" fill="#6a5fd0" stroke="#bfb6ff" stroke-width="2"/>
        <polygon class="xc-glow" points="0,-20 11,0 0,20 -11,0" fill="#9ff3ff"/></g>`,
        )
        .join("")}
      <g class="${cls(ctx, 3)}" transform="translate(${X[3]} 100)">
        <circle r="34" fill="#251d5c" stroke="#bfb6ff" stroke-width="3"/><circle class="xc-glow" r="20" fill="#ffe27a"/>
        <path class="xc-glow" d="M-60 0 H-36 M36 0 H60 M0 -60 V-36" stroke="#ffe27a" stroke-width="3"/>
      </g>
      <g class="xc-vehicle" style="transform:translate(${stop(ctx) - 80}px,150px)">
        <path d="M0 10 L40 0 L56 10 L40 20Z" fill="#dfe6ff"/><path d="M14 4 L22 -10 L30 3Z M14 16 L22 30 L30 17Z" fill="#7ad7ff"/>
        <path d="M0 10 h-14" stroke="#ff9a5a" stroke-width="5" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  function abyssScene(ctx) {
    return `<svg viewBox="0 0 960 230" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs><linearGradient id="abSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b6f8f"/><stop offset=".5" stop-color="#0d3b5a"/><stop offset="1" stop-color="#061a2e"/></linearGradient></defs>
      <rect width="960" height="230" fill="url(#abSea)"/>
      <path d="M0 14 q30 -8 60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0 t60 0" stroke="#9fe3f0" stroke-width="2" fill="none" opacity=".6"/>
      <path d="M0 200 Q100 170 200 196 T420 186 T640 200 T960 180 V230 H0Z" fill="#04121f"/>
      <g fill="#9fe3f0" opacity=".35"><circle cx="90" cy="120" r="3"/><circle cx="96" cy="100" r="2"/><circle cx="520" cy="140" r="3"/><circle cx="526" cy="118" r="2"/><circle cx="880" cy="90" r="2.5"/></g>
      <g class="${cls(ctx, 0)}" transform="translate(${X[0]} 192)">
        <path d="M-30 0 Q-24 -40 -30 -70 M-14 0 Q-6 -34 -12 -56 M4 0 Q12 -46 6 -80" stroke="#2f9e6e" stroke-width="5" fill="none"/>
        <circle class="xc-glow" cx="20" cy="-14" r="9" fill="#7af0c8"/>
      </g>
      <g class="${cls(ctx, 1)}" transform="translate(${X[1]} 192)">
        <path d="M-40 0 V-30 A40 30 0 0 1 40 -30 V0Z" fill="#20435f" stroke="#7ad7ff" stroke-width="3"/>
        <circle class="xc-glow" cx="-14" cy="-26" r="7" fill="#ffd76a"/><circle class="xc-glow" cx="14" cy="-26" r="7" fill="#ffd76a"/>
      </g>
      <g class="${cls(ctx, 2)}" transform="translate(${X[2]} 192)">
        <path d="M-50 0 L-30 -20 H30 L50 0Z" fill="#24324a"/><rect x="-6" y="-60" width="12" height="40" fill="#3a5470"/>
        <circle class="xc-glow" cx="0" cy="-64" r="9" fill="#ff7a8a"/><path class="xc-glow" d="M0 -64 L-60 -120 L60 -120Z" fill="#ff7a8a" opacity=".2"/>
      </g>
      <g class="${cls(ctx, 3)}" transform="translate(${X[3]} 180)">
        <ellipse rx="70" ry="18" fill="#2a5a7a" stroke="#9fe3f0" stroke-width="3"/><rect x="-14" y="-34" width="28" height="18" rx="4" fill="#2a5a7a" stroke="#9fe3f0" stroke-width="3"/>
        <g class="xc-glow" fill="#ffe27a"><circle cx="-36" cy="0" r="5"/><circle cx="-12" cy="0" r="5"/><circle cx="12" cy="0" r="5"/><circle cx="36" cy="0" r="5"/></g>
      </g>
      <g class="xc-vehicle" style="transform:translate(${stop(ctx) - 70}px,90px)">
        <ellipse cx="30" cy="10" rx="30" ry="12" fill="#f2c94c"/><rect x="22" y="-8" width="16" height="10" rx="3" fill="#f2c94c"/>
        <circle cx="40" cy="10" r="5" fill="#9fe3f0"/><path d="M0 10 h-8 M-8 4 v12" stroke="#f2c94c" stroke-width="3"/>
      </g>
    </svg>`;
  }

  const { worlds } = window.ExpeditionCampaign;

  worlds.frontier = {
    id: "frontier",
    kicker: "Laser Lab · Crystal Frontier",
    title: "Restore the Star Lanes",
    story:
      "The star lanes have gone dark. Every star you earn in a Laser Lab sector powers your ship. Spend stars on equipment and outposts, then relight the Beacon Citadel.",
    earnRule:
      "How to earn: your best stars in each sector count, up to 3 per sector (36 in all). A better score on a replay adds the new stars. Stars only count once.",
    practiceLabel: "Earn stars: play a sector →",
    verb: "Install",
    resources: [{ id: "star", icon: "⭐", name: "beacon stars", one: "beacon star" }],
    chapters: [
      {
        id: "outfit",
        place: "Arrival Belt",
        title: "Outfit your ship",
        text: "Your ship needs one new tool before it can travel. The tool you pick shows up in the Laser Lab.",
        options: [
          {
            id: "capacitor",
            icon: "🔋",
            title: "Reserve capacitor",
            text: "Carry 2 extra beams in every sector. Stars still reward the fewest beams.",
            cost: 2,
            flag: "engineer",
            perk: "capacitor",
            perkLabel: "Reserve capacitor (+2 beams)",
          },
          {
            id: "scope",
            icon: "🔭",
            title: "Pathfinder scope",
            text: "See the coordinates of every crystal before you fire.",
            cost: 2,
            flag: "navigator",
            perk: "scope",
            perkLabel: "Pathfinder scope (crystal coordinates)",
          },
          {
            id: "drone",
            icon: "🛰️",
            title: "Beacon drone",
            text: "A scout drone marks the route. Later chapters cost 1 star less.",
            cost: 3,
            flag: "pioneer",
            discount: { star: 1 },
          },
        ],
      },
      {
        id: "prism",
        place: "Prism Expanse",
        title: "Cross the Prism Expanse",
        text: "Giant prisms split light in every direction. Choose how to cross.",
        options: [
          {
            id: "forge",
            icon: "🔺",
            title: "Prism forge",
            text: "Cut the prisms into stronger lenses.",
            cost: 5,
            flag: "engineer",
          },
          {
            id: "charts",
            icon: "🗺️",
            title: "Star charts",
            text: "Chart a safe path between the prisms.",
            cost: 4,
            flag: "navigator",
          },
          {
            id: "dome",
            icon: "🏠",
            title: "Outpost dome",
            text: "Build a home base in the middle of the expanse.",
            cost: 6,
            flag: "pioneer",
          },
        ],
      },
      {
        id: "nebula",
        place: "Echo Nebula",
        title: "Find the way through the nebula",
        text: "Inside the nebula, every signal echoes. Choose how to find the Citadel.",
        options: [
          {
            id: "relay",
            icon: "📡",
            title: "Echo relay",
            text: "Build a relay that cancels the echoes.",
            cost: 6,
            flag: "engineer",
          },
          {
            id: "nebmap",
            icon: "🌌",
            title: "Nebula map",
            text: "Map the clouds using your crystal ratios.",
            cost: 5,
            flag: "navigator",
          },
          {
            id: "ring",
            icon: "🪐",
            title: "Colony ring",
            text: "Start a colony ring where travelers can rest.",
            cost: 7,
            flag: "pioneer",
          },
        ],
      },
    ],
    capstone: {
      place: "Beacon Citadel",
      icon: "🏯",
      title: "Relight the Beacon Citadel",
      text: "Send all your power to the Citadel. When it shines, every star lane opens again.",
      verb: "Relight the Citadel",
      cost: 7,
    },
    endings: {
      engineer: {
        icon: "🛠️",
        title: "Master Engineer",
        text: "Your lenses and relays make the star lanes brighter than ever. Ships are named after you.",
      },
      navigator: {
        icon: "🧭",
        title: "Star Navigator",
        text: "Your charts guide every pilot. No ship gets lost on the frontier again.",
      },
      pioneer: {
        icon: "🚀",
        title: "Frontier Pioneer",
        text: "Your outposts and colony ring turn the frontier into a new home.",
      },
    },
    scene: frontierScene,
  };

  worlds.abyss = {
    id: "abyss",
    kicker: "Sonar Hunt · Abyssal Rescue",
    title: "Bring the Fleet Home",
    story:
      "A research fleet is lost in the deep ocean. Every star you earn in Sonar Hunt funds the rescue. Unlock new sonar rigs, build stations on the sea floor, and bring the fleet home.",
    earnRule:
      "How to earn: Sonar Hunt gives stars for each fleet you find and each correct captain's log. Each new expedition costs more, so keep hunting.",
    practiceLabel: "Earn stars: start a sonar round →",
    verb: "Build",
    spend: "permanent",
    resources: [{ id: "star", icon: "⭐", name: "sonar stars", one: "sonar star" }],
    chapters: [
      {
        id: "shallows",
        place: "The Shallows",
        title: "Choose a sonar rig",
        text: "Your sub needs a better sonar rig. The rig you pick appears in Sonar Hunt.",
        options: [
          {
            id: "survey",
            icon: "🎧",
            title: "Survey hydrophones",
            text: "10 pings each round instead of 8.",
            cost: 2,
            flag: "scientist",
            perk: "survey",
            perkLabel: "Survey hydrophones (10 pings)",
          },
          {
            id: "sweep",
            icon: "📡",
            title: "Rescue scanner",
            text: "One wide sweep each round tells how many subs are above y = 6.",
            cost: 2,
            flag: "rescuer",
            perk: "sweep",
            perkLabel: "Rescue scanner (wide sweep)",
          },
          {
            id: "deep",
            icon: "⚓",
            title: "Deep-range rig",
            text: "Only 6 pings, but +100 points for each fleet you find.",
            cost: 3,
            flag: "diver",
            perk: "deep",
            perkLabel: "Deep-range rig (6 pings, +100)",
          },
        ],
      },
      {
        id: "kelp",
        place: "Kelp Canyon",
        title: "Build a station in Kelp Canyon",
        text: "The canyon is the halfway point. What should wait there for the fleet?",
        options: [
          {
            id: "lab",
            icon: "🔬",
            title: "Research lab",
            text: "Study the sea floor while you search.",
            cost: 4,
            flag: "scientist",
          },
          {
            id: "medic",
            icon: "🚑",
            title: "Medical sub",
            text: "Care for the crew as soon as they are found.",
            cost: 4,
            flag: "rescuer",
          },
          {
            id: "suit",
            icon: "🤿",
            title: "Pressure suits",
            text: "Dive deeper than any team before.",
            cost: 4,
            flag: "diver",
          },
        ],
      },
      {
        id: "trench",
        place: "The Trench",
        title: "Light the trench",
        text: "The fleet is somewhere in the dark trench below.",
        options: [
          {
            id: "vault",
            icon: "🧬",
            title: "Sample vault",
            text: "Save rare samples from the trench.",
            cost: 5,
            flag: "scientist",
          },
          {
            id: "lifeboat",
            icon: "🛟",
            title: "Lifeboat bay",
            text: "Room for every crew member to ride home.",
            cost: 5,
            flag: "rescuer",
          },
          {
            id: "lights",
            icon: "💡",
            title: "Trench lights",
            text: "Light the way to the very bottom.",
            cost: 5,
            flag: "diver",
          },
        ],
      },
    ],
    capstone: {
      place: "Home Port",
      icon: "🚢",
      title: "Bring the fleet home",
      text: "Guide every lost sub back to the surface.",
      verb: "Start the rescue",
      cost: 6,
    },
    endings: {
      scientist: {
        icon: "🔬",
        title: "Deep-Sea Scientist",
        text: "The fleet is home, and your samples teach the world about the deep ocean.",
      },
      rescuer: {
        icon: "🛟",
        title: "Rescue Captain",
        text: "Every crew member came home safe. The harbor throws a parade for your team.",
      },
      diver: {
        icon: "🤿",
        title: "Abyss Diver",
        text: "You went deeper than anyone before and found the fleet at the bottom of the trench.",
      },
    },
    scene: abyssScene,
  };
})();

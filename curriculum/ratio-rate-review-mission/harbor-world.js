/* Ratio & Rate Review Mission · Harbor of Six Bridges.
 * Each review question solved correctly on the current path gives one supply crate.
 * Families choose what to rebuild first; the choices decide what the harbor becomes.
 * Requires /curriculum/review-expeditions/basecamp.js (ExpeditionCampaign).
 */
(() => {
  "use strict";
  const X = [160, 400, 640, 850];
  const cls = (ctx, i) => {
    const on = i === 3 ? ctx.finished : ctx.built[i];
    return `xc-mark${on ? " xc-mark--on" : ""}${ctx.justBuilt === i ? " xc-mark--new" : ""}`;
  };

  function scene(ctx) {
    const at = X[ctx.finished ? 3 : Math.min(ctx.now, 3)] - 50;
    return `<svg viewBox="0 0 960 230" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs><linearGradient id="hbSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd8ef"/><stop offset="1" stop-color="#e8f6f7"/></linearGradient></defs>
      <rect width="960" height="230" fill="url(#hbSky)"/>
      <path d="M0 120 Q120 80 240 112 T520 100 T760 108 T960 96 V160 H0Z" fill="#7fb3a3"/>
      <rect y="150" width="960" height="80" fill="#2f7f9e"/>
      <path class="xc-waves" d="M0 166 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#bfe6f0" stroke-width="2" fill="none"/>
      <g class="${cls(ctx, 0)}" transform="translate(${X[0]} 150)">
        <rect x="-70" y="-6" width="140" height="10" fill="#8a5a3b"/><path d="M-60 4 v22 M-20 4 v22 M20 4 v22 M60 4 v22" stroke="#6b4329" stroke-width="5"/>
        <rect x="-30" y="-34" width="40" height="28" fill="#e9d6b0" stroke="#6b4329" stroke-width="2"/><path d="M-36 -34 L-10 -52 L16 -34Z" fill="#c4553f"/>
        <circle class="xc-glow" cx="34" cy="-18" r="7" fill="#ffd36b"/>
      </g>
      <g class="${cls(ctx, 1)}" transform="translate(${X[1]} 150)">
        <path d="M-14 6 L-9 -76 H9 L14 6Z" fill="#fff" stroke="#b33a3a" stroke-width="3"/><path d="M-12 -20 H12 M-11 -46 H11" stroke="#b33a3a" stroke-width="7"/>
        <rect x="-11" y="-90" width="22" height="14" fill="#30455c"/><circle class="xc-glow" cx="0" cy="-83" r="7" fill="#ffe27a"/>
        <path class="xc-glow" d="M10 -84 L120 -110 L120 -60Z" fill="#fff5b8" opacity=".55"/>
      </g>
      <g class="${cls(ctx, 2)}" transform="translate(${X[2]} 150)">
        <path d="M-90 0 Q-45 -46 0 0 Q45 -46 90 0" fill="none" stroke="#6b4329" stroke-width="8"/><rect x="-92" y="-4" width="184" height="8" fill="#8a5a3b"/>
        <path d="M-45 -24 V0 M45 -24 V0" stroke="#6b4329" stroke-width="4"/><circle class="xc-glow" cx="0" cy="-10" r="6" fill="#ffd36b"/>
      </g>
      <g class="${cls(ctx, 3)}" transform="translate(${X[3]} 150)">
        <path d="M-50 0 V-30 L0 -66 L50 -30 V0Z" fill="#f1e4c3" stroke="#6b4329" stroke-width="3"/>
        <path d="M-50 -30 L-70 -8 M50 -30 L70 -8" stroke="#6b4329" stroke-width="2"/>
        <g class="xc-glow"><path d="M-70 -8 Q0 -40 70 -8" stroke="#e85d75" stroke-width="2" fill="none"/><circle cx="-40" cy="-20" r="5" fill="#ffd36b"/><circle cx="0" cy="-26" r="5" fill="#7ad7c5"/><circle cx="40" cy="-20" r="5" fill="#e85d75"/></g>
      </g>
      <g class="xc-vehicle" style="transform:translate(${at}px,164px)">
        <path d="M0 0 h60 l-10 16 h-40z" fill="#c4553f"/><path d="M28 0 V-40 L52 -6Z" fill="#fff"/><path d="M28 -40 V0" stroke="#3b2a1f" stroke-width="2"/>
      </g>
    </svg>`;
  }

  window.ExpeditionCampaign.worlds.harbor = {
    id: "harbor",
    kicker: "Family review · Harbor of Six Bridges",
    title: "Rebuild the Harbor",
    story:
      "A storm broke the harbor. Every question you solve brings in a crate of supplies. Decide together what to rebuild first. Your choices decide what the harbor becomes.",
    earnRule:
      "How to earn: each question solved on your chosen review path gives 1 crate. A shown answer does not give a crate. Each question counts once. Costs grow or shrink with the length of your path.",
    practiceLabel: "Earn supplies: go to the next question →",
    verb: "Rebuild",
    costMode: "share",
    resources: [{ id: "crate", icon: "📦", name: "supply crates", one: "supply crate" }],
    chapters: [
      {
        id: "landing",
        place: "The Landing",
        title: "A safe place to land",
        text: "Boats have nowhere safe to tie up. What should the harbor build first?",
        options: [
          {
            id: "pier",
            icon: "🎣",
            title: "Fishing pier",
            text: "Fishing boats can bring fresh food again.",
            cost: 0.2,
            flag: "community",
          },
          {
            id: "ferry",
            icon: "⛴️",
            title: "Ferry dock",
            text: "Ferries can visit the nearby islands.",
            cost: 0.25,
            flag: "explorer",
          },
          {
            id: "workshop",
            icon: "🔨",
            title: "Boat workshop",
            text: "New tools make every later build cost 1 crate less.",
            cost: 0.2,
            flag: "builder",
            discount: { crate: 1 },
          },
        ],
      },
      {
        id: "light",
        place: "Water & Light",
        title: "Water and light",
        text: "The harbor needs clean water and a light for ships at night.",
        options: [
          {
            id: "lighthouse",
            icon: "🗼",
            title: "Lighthouse",
            text: "Guide ships home through the fog.",
            cost: 0.25,
            flag: "explorer",
          },
          {
            id: "pump",
            icon: "💧",
            title: "Water pump",
            text: "Bring clean water to every home.",
            cost: 0.2,
            flag: "community",
          },
          {
            id: "crane",
            icon: "🏗️",
            title: "Market crane",
            text: "Lift heavy cargo onto the docks.",
            cost: 0.2,
            flag: "builder",
          },
        ],
      },
      {
        id: "bridges",
        place: "Six Bridges",
        title: "Connect the harbor",
        text: "The six bridges connect the neighborhoods. Which bridge comes first?",
        options: [
          {
            id: "garden",
            icon: "🌉",
            title: "Garden bridge",
            text: "A wide bridge for families and the Saturday market.",
            cost: 0.2,
            flag: "community",
          },
          {
            id: "sky",
            icon: "🌁",
            title: "Sky bridge",
            text: "A tall bridge that lets big ships pass under it.",
            cost: 0.25,
            flag: "explorer",
          },
          {
            id: "draw",
            icon: "⚙️",
            title: "Drawbridge",
            text: "A bridge that lifts with gears and counterweights.",
            cost: 0.2,
            flag: "builder",
          },
        ],
      },
    ],
    capstone: {
      place: "Festival Pier",
      icon: "🎉",
      title: "Open the Harbor Festival",
      text: "Invite everyone back to the harbor for a festival with lights, food, and music.",
      verb: "Open the harbor",
      cost: 0.15,
    },
    endings: {
      community: {
        icon: "🏘️",
        title: "Harbor of Neighbors",
        text: "Fresh food, clean water, and a market bridge. Families come to the harbor every weekend.",
      },
      explorer: {
        icon: "🧭",
        title: "Gateway to the Islands",
        text: "Ferries and big ships come and go. The harbor connects every island on the map.",
      },
      builder: {
        icon: "⚙️",
        title: "Harbor of Inventors",
        text: "Gears, cranes, and workshops. The harbor builds boats for the whole coast.",
      },
    },
    scene,
  };
})();

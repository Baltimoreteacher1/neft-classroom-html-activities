/* Ratio Quest · The Caravan Road.
 * Stars earned in each Meridian Market shop fill that shop's crates. Each town on the road
 * asks for a different mix of crates, so where you earn stars shapes which paths you can take.
 * Requires /curriculum/review-expeditions/basecamp.js (ExpeditionCampaign).
 */
(() => {
  "use strict";
  const X = [150, 390, 630, 850];
  const cls = (ctx, i) => {
    const on = i === 3 ? ctx.finished : ctx.built[i];
    return `xc-mark${on ? " xc-mark--on" : ""}${ctx.justBuilt === i ? " xc-mark--new" : ""}`;
  };
  const wagonAt = (ctx) => X[ctx.finished ? 3 : Math.min(ctx.now, 3)] - 70;

  function scene(ctx) {
    return `<svg viewBox="0 0 960 230" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs><linearGradient id="cvSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf8a"/><stop offset="1" stop-color="#ffe9c4"/></linearGradient></defs>
      <rect width="960" height="230" fill="url(#cvSky)"/>
      <circle cx="820" cy="58" r="30" fill="#fff3c9"/>
      <path d="M0 150 Q120 110 250 140 T520 130 T780 120 T960 135 V230 H0Z" fill="#e7b46d"/>
      <path d="M0 175 Q200 150 420 172 T960 165 V230 H0Z" fill="#d39a52"/>
      <path class="xc-road" d="M40 200 C160 182 260 205 390 190 S600 178 630 192 S800 205 920 188" fill="none" stroke="#f6e1b3" stroke-width="14" stroke-linecap="round"/>
      <path d="M40 200 C160 182 260 205 390 190 S600 178 630 192 S800 205 920 188" fill="none" stroke="#b9783a" stroke-width="2" stroke-dasharray="4 14"/>
      <g class="${cls(ctx, 0)}" transform="translate(${X[0]} 150)">
        <rect x="-34" y="-30" width="50" height="40" fill="#8a5a3b"/><path d="M-40 -30 L-9 -56 L22 -30Z" fill="#b5523b"/>
        <circle class="xc-glow" cx="34" cy="-8" r="20" fill="none" stroke="#5c3a24" stroke-width="5"/><path d="M34 -28 V12 M14 -8 H54" stroke="#5c3a24" stroke-width="4"/>
        <path d="M-60 22 Q0 10 70 22" stroke="#4fa3c7" stroke-width="8" fill="none"/>
      </g>
      <g class="${cls(ctx, 1)}" transform="translate(${X[1]} 150)">
        <path d="M-60 12 L-20 -50 L10 -12 L30 -36 L66 12Z" fill="#a8633a"/>
        <rect x="-12" y="-28" width="22" height="40" fill="#5b4636"/><rect class="xc-glow" x="-7" y="-20" width="12" height="12" fill="#ffd36b"/>
      </g>
      <g class="${cls(ctx, 2)}" transform="translate(${X[2]} 150)">
        <path d="M-12 12 L-7 -54 H7 L12 12Z" fill="#f4efe6" stroke="#7a4b2c" stroke-width="3"/>
        <rect x="-9" y="-66" width="18" height="14" fill="#7a4b2c"/><circle class="xc-glow" cx="0" cy="-59" r="6" fill="#ffe27a"/>
        <path d="M40 16 Q70 0 100 16" stroke="#4fa3c7" stroke-width="8" fill="none"/>
      </g>
      <g class="${cls(ctx, 3)}" transform="translate(${X[3]} 150)">
        <rect x="-48" y="-40" width="96" height="52" fill="#d9c4a0" stroke="#7a4b2c" stroke-width="3"/>
        <rect x="-60" y="-62" width="24" height="74" fill="#cdb48a" stroke="#7a4b2c" stroke-width="3"/><rect x="36" y="-62" width="24" height="74" fill="#cdb48a" stroke="#7a4b2c" stroke-width="3"/>
        <path d="M-48 -62 V-84 L-30 -78 L-48 -72" fill="#d6455d"/><path d="M48 -62 V-84 L66 -78 L48 -72" fill="#3f8fd2"/>
        <rect x="-12" y="-14" width="24" height="26" rx="12" fill="#7a4b2c"/><circle class="xc-glow" cx="0" cy="-58" r="10" fill="#ffd36b"/>
      </g>
      <g class="xc-vehicle" style="transform:translate(${wagonAt(ctx)}px,168px)">
        <rect x="0" y="0" width="56" height="24" rx="4" fill="#7a4b2c"/><path d="M2 0 Q28 -30 54 0Z" fill="#fff4dc" stroke="#7a4b2c" stroke-width="2"/>
        <circle cx="12" cy="26" r="7" fill="#3b2a1f"/><circle cx="44" cy="26" r="7" fill="#3b2a1f"/>
        <path d="M58 10 h18" stroke="#3b2a1f" stroke-width="3"/><circle cx="82" cy="8" r="9" fill="#c98c4a"/>
      </g>
    </svg>`;
  }

  window.ExpeditionCampaign.worlds.caravan = {
    id: "caravan",
    kicker: "Meridian Market · Beyond the town gate",
    title: "The Caravan Road",
    story:
      "Three towns on the road need help, and the Capital Fair is waiting at the end. Your shop stars fill crates. Each town asks for a different mix of crates. Choose how to help each town.",
    earnRule:
      "How to earn: every star you earn in a shop adds one crate from that shop. A better score on a replay adds the new stars. A star only counts once.",
    practiceLabel: "Back to town to earn crates →",
    verb: "Send the caravan",
    resources: [
      { id: "potion", icon: "🧪", name: "potion crates", one: "potion crate" },
      { id: "bakery", icon: "🥐", name: "bread baskets", one: "bread basket" },
      { id: "post", icon: "✉️", name: "mail sacks", one: "mail sack" },
      { id: "market", icon: "🍎", name: "fruit crates", one: "fruit crate" },
    ],
    chapters: [
      {
        id: "ford",
        place: "Willow Ford",
        title: "The river town lost its bridge",
        text: "A storm broke the bridge at Willow Ford. Families on both sides need help.",
        options: [
          {
            id: "healer",
            icon: "🩹",
            title: "Healer's tent",
            text: "Bring medicine and warm bread to the families.",
            cost: { potion: 3, bakery: 2 },
            flag: "kind",
          },
          {
            id: "crew",
            icon: "⛏️",
            title: "Bridge crew",
            text: "Feed the builders and fix the bridge fast.",
            cost: { market: 3, bakery: 1 },
            flag: "bold",
          },
          {
            id: "ferry",
            icon: "⛴️",
            title: "Ferry line",
            text: "Start a ferry that carries mail across the river.",
            cost: { post: 3, potion: 1 },
            flag: "clever",
            discount: { post: 1 },
          },
        ],
      },
      {
        id: "hills",
        place: "Copper Hills",
        title: "Miners are snowed in",
        text: "Snow closed the road to the Copper Hills mine. The miners are running low on food.",
        options: [
          {
            id: "bread",
            icon: "🥖",
            title: "Warm bread run",
            text: "Carry baskets of bread up the long, safe road.",
            cost: { bakery: 4, market: 2 },
            flag: "kind",
          },
          {
            id: "pass",
            icon: "🧗",
            title: "Mountain pass",
            text: "Take the steep shortcut with fruit and energy potions.",
            cost: { potion: 2, market: 3 },
            flag: "bold",
          },
          {
            id: "post",
            icon: "🏪",
            title: "Trading post",
            text: "Build a trading post so the miners can order what they need.",
            cost: { post: 2, bakery: 2 },
            flag: "clever",
            discount: { bakery: 1 },
          },
        ],
      },
      {
        id: "coast",
        place: "Lantern Coast",
        title: "Fog covers the harbor",
        text: "Thick fog hides the harbor at Lantern Coast. Ships cannot find the docks.",
        options: [
          {
            id: "oil",
            icon: "🕯️",
            title: "Lighthouse oil",
            text: "Bring lamp potions and letters to the lighthouse keeper.",
            cost: { potion: 4, post: 2 },
            flag: "kind",
          },
          {
            id: "voyage",
            icon: "⛵",
            title: "Night voyage",
            text: "Sail out at night with fruit and bread for the ships.",
            cost: { market: 4, bakery: 2 },
            flag: "bold",
          },
          {
            id: "signal",
            icon: "📡",
            title: "Signal network",
            text: "Send messages from hill to hill to guide the ships.",
            cost: { post: 4, market: 2 },
            flag: "clever",
          },
        ],
      },
    ],
    capstone: {
      place: "The Capital",
      icon: "🏰",
      title: "Open the Capital Fair",
      text: "Bring a full load of every crate to the Capital. The towns you helped will join the parade.",
      verb: "Open the fair",
      cost: { potion: 3, bakery: 3, post: 3, market: 3 },
    },
    endings: {
      kind: {
        icon: "💛",
        title: "The Caravan of Friends",
        text: "Every town you helped came to the fair. The healer, the miners, and the lighthouse keeper cheer for your stall.",
      },
      bold: {
        icon: "🧭",
        title: "Trailblazers of the Far Road",
        text: "You took the brave roads. Now new caravans follow your trail to the Capital every week.",
      },
      clever: {
        icon: "🪙",
        title: "Master Traders of Meridian",
        text: "Your ferry, trading post, and signals connect the whole road. Meridian Market is now the busiest market in the land.",
      },
    },
    scene,
  };
})();

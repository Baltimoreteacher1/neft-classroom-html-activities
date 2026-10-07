/* Unit Rate Market Mission · Night Market Case Files.
 * Each question solved correctly (in any tab) gives one clue. Clues buy the leads that
 * decide how the detective cracks the case of the Price Phantom.
 * Requires /curriculum/review-expeditions/basecamp.js (ExpeditionCampaign).
 */
(() => {
  "use strict";
  const X = [150, 390, 630, 850];
  const cls = (ctx, i) => {
    const on = i === 3 ? ctx.finished : ctx.built[i];
    return `xc-mark${on ? " xc-mark--on" : ""}${ctx.justBuilt === i ? " xc-mark--new" : ""}`;
  };
  const stall = (x, color) =>
    `<rect x="${x - 28}" y="-30" width="56" height="42" fill="#1b2347"/><path d="M${x - 34} -30 h68 l-6 -14 h-56z" fill="${color}"/><rect class="xc-glow" x="${x - 20}" y="-20" width="40" height="10" rx="3" fill="#ffd76a"/>`;

  function scene(ctx) {
    const at = X[ctx.finished ? 3 : Math.min(ctx.now, 3)] - 60;
    return `<svg viewBox="0 0 960 230" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs><linearGradient id="cfSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1030"/><stop offset="1" stop-color="#2b2160"/></linearGradient></defs>
      <rect width="960" height="230" fill="url(#cfSky)"/>
      <circle cx="90" cy="48" r="24" fill="#f5f0d0"/><circle cx="102" cy="42" r="22" fill="#141638"/>
      <g fill="#fff" opacity=".7"><circle cx="220" cy="30" r="1.6"/><circle cx="480" cy="22" r="1.4"/><circle cx="700" cy="40" r="1.8"/><circle cx="900" cy="26" r="1.4"/><circle cx="340" cy="60" r="1.2"/></g>
      <path d="M0 140 h60 v-50 h40 v30 h50 v-70 h44 v90 h70 v-40 h40 v60 h80 v-80 h50 v80 h90 v-50 h60 v50 h80 v-90 h40 v90 h120 v-60 h50 v60 H960 V230 H0Z" fill="#171a3d"/>
      <rect y="178" width="960" height="52" fill="#262a52"/>
      <path d="M0 184 H960" stroke="#ff5fa2" stroke-width="2" opacity=".5"/>
      <path d="M60 60 Q480 110 920 60" stroke="#ffd76a" stroke-width="1.5" fill="none" opacity=".45"/>
      <g class="${cls(ctx, 0)}" transform="translate(${X[0]} 166)">${stall(0, "#ff5fa2")}<circle class="xc-glow" cx="-40" cy="-58" r="7" fill="#ffd76a"/><circle class="xc-glow" cx="40" cy="-58" r="7" fill="#ff8a3d"/></g>
      <g class="${cls(ctx, 1)}" transform="translate(${X[1]} 166)">
        <rect x="-40" y="-64" width="80" height="76" rx="8" fill="#26205a" stroke="#7ad7ff" stroke-width="3"/>
        <circle class="xc-glow" cx="0" cy="-28" r="20" fill="none" stroke="#7ad7ff" stroke-width="4"/><path d="M0 -28 L0 -42 M0 -28 L10 -22" stroke="#ffd76a" stroke-width="3"/>
      </g>
      <g class="${cls(ctx, 2)}" transform="translate(${X[2]} 166)">
        <rect x="-60" y="-56" width="120" height="68" fill="#3a2f4f"/><path d="M-66 -56 L0 -86 L66 -56Z" fill="#4b3d66"/>
        <rect x="-44" y="-30" width="28" height="22" fill="#8a6b3c"/><rect x="-10" y="-30" width="28" height="22" fill="#8a6b3c"/><rect class="xc-glow" x="24" y="-44" width="20" height="14" fill="#ffd76a"/>
      </g>
      <g class="${cls(ctx, 3)}" transform="translate(${X[3]} 166)">
        <path d="M-26 12 V-50 Q0 -80 26 -50 V12Z" fill="#141638" stroke="#ff5fa2" stroke-width="3"/>
        <ellipse class="xc-glow" cx="0" cy="-36" rx="16" ry="12" fill="#f5f0d0"/><circle cx="-6" cy="-38" r="3" fill="#141638"/><circle cx="6" cy="-38" r="3" fill="#141638"/>
      </g>
      <g class="xc-vehicle" style="transform:translate(${at}px,138px)">
        <path d="M10 6 h26 l4 36 h-34z" fill="#c9a26b"/><circle cx="23" cy="0" r="9" fill="#e2b48a"/><path d="M8 -4 h30 l-4 -8 h-22z" fill="#6b4a2b"/>
        <circle cx="48" cy="18" r="9" fill="none" stroke="#7ad7ff" stroke-width="3"/><path d="M41 24 l-8 8" stroke="#7ad7ff" stroke-width="3"/>
      </g>
    </svg>`;
  }

  window.ExpeditionCampaign.worlds.casefiles = {
    id: "casefiles",
    kicker: "Deal Detective · Case file 06",
    title: "The Price Phantom",
    story:
      "Someone is changing price tags all over the Night Market. Shoppers think they are getting deals, but they are paying more per item. Collect clues and follow the leads you choose.",
    earnRule:
      "How to earn: each question you solve in any tab gives 1 clue. If the answer is shown to you, it does not give a clue. Each question counts once.",
    practiceLabel: "Find more clues: next unsolved question →",
    verb: "Follow this lead",
    costMode: "share",
    resources: [{ id: "clue", icon: "🔎", name: "clues", one: "clue" }],
    chapters: [
      {
        id: "row",
        place: "Lantern Row",
        title: "Tags changed overnight",
        text: "The snack stalls on Lantern Row have new price tags. The prices look lower, but the packs are smaller.",
        options: [
          {
            id: "stakeout",
            icon: "🌙",
            title: "Rooftop stakeout",
            text: "Watch the stalls quietly from a rooftop.",
            cost: 0.15,
            flag: "patient",
          },
          {
            id: "shopper",
            icon: "🧢",
            title: "Undercover shopper",
            text: "Buy snacks and compare the unit prices up close.",
            cost: 0.2,
            flag: "bold",
          },
          {
            id: "lab",
            icon: "🧪",
            title: "Tag lab",
            text: "Test the ink on the tags. Your lab makes later leads cheaper.",
            cost: 0.25,
            flag: "sharp",
            discount: { clue: 1 },
          },
        ],
      },
      {
        id: "arcade",
        place: "Clockwork Arcade",
        title: "The token trap",
        text: "The arcade sells token packs. One big pack costs more per token than the small ones.",
        options: [
          {
            id: "runner",
            icon: "🏃",
            title: "Chase the runner",
            text: "Follow the kid who delivers the fake signs.",
            cost: 0.2,
            flag: "bold",
          },
          {
            id: "receipts",
            icon: "🧾",
            title: "Check the receipts",
            text: "Divide each price by the number of tokens.",
            cost: 0.2,
            flag: "sharp",
          },
          {
            id: "owners",
            icon: "🤝",
            title: "Talk to the owners",
            text: "Ask the shop owners who printed the signs.",
            cost: 0.15,
            flag: "patient",
          },
        ],
      },
      {
        id: "dock",
        place: "Harbor Warehouse",
        title: "The midnight crates",
        text: "Crates marked BULK DEAL arrive at the warehouse at midnight. The Phantom must be close.",
        options: [
          {
            id: "map",
            icon: "🗺️",
            title: "Map the crates",
            text: "Record every crate and its real unit price.",
            cost: 0.25,
            flag: "sharp",
          },
          {
            id: "hide",
            icon: "📦",
            title: "Hide in a crate",
            text: "Ride inside a crate to the Phantom's office.",
            cost: 0.2,
            flag: "bold",
          },
          {
            id: "wait",
            icon: "🕰️",
            title: "Wait and watch",
            text: "Wait by the dock until the Phantom shows up.",
            cost: 0.15,
            flag: "patient",
          },
        ],
      },
    ],
    capstone: {
      place: "The Phantom's office",
      icon: "🎭",
      title: "Unmask the Price Phantom",
      text: "Show your clues to the market council. Explain the real cost per item for every fake deal.",
      verb: "Solve the case",
      cost: 0.2,
    },
    endings: {
      patient: {
        icon: "🌙",
        title: "The Quiet Detective",
        text: "You watched and waited. The Phantom never saw you coming. The shop owners now call you first.",
      },
      bold: {
        icon: "⚡",
        title: "The Fearless Detective",
        text: "You chased every lead in person. The whole market saw you catch the Phantom by the docks.",
      },
      sharp: {
        icon: "🔬",
        title: "The Lab Genius",
        text: "Your math proved every fake deal. The council posts your unit-price charts at every stall.",
      },
    },
    scene,
  };
})();

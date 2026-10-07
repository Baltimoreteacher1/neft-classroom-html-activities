/* =============================================================================
 * Almost-Right Lab — the five expedition worlds (data + scene art).
 * -----------------------------------------------------------------------------
 * One entry per mission. adventure.js is the engine; this file is only what
 * makes each mission its own place: the world, what each solved equation
 * earns, the three things a student can choose to build, the four endings,
 * and the SVG scene. Every build piece is a <g class="adv-build"> tagged with
 * data-t (track 0-2) and data-l (level 1-3); the engine switches them on.
 *
 * Scene coordinates: viewBox 0 0 640 240. `stops` are the 7 places the guide
 * walks to; the last one is the goal. Plain script; exposes window.ARLWorlds.
 * ========================================================================== */
(() => {
  const b = (t, l, svg) => `<g class="adv-build" data-t="${t}" data-l="${l}">${svg}</g>`;
  const gear = (x, y, r, fill, hole, cls) =>
    `<g transform="translate(${x} ${y})"><g class="${cls}"><circle r="${r}" fill="none" stroke="${fill}" stroke-width="${Math.round(r * 0.38)}" stroke-dasharray="${Math.max(4, Math.round(r * 0.3))} ${Math.max(3, Math.round(r * 0.22))}"/><circle r="${Math.round(r * 0.72)}" fill="${fill}"/><circle r="${Math.round(r * 0.24)}" fill="${hole}"/></g></g>`;
  const lamp = (x, y, h) =>
    `<rect x="${x - 2}" y="${y - h}" width="4" height="${h}" fill="#4a2a17"/><circle class="adv-glow" cx="${x}" cy="${y - h - 6}" r="11" fill="#ffd166" opacity="0.35"/><circle cx="${x}" cy="${y - h - 6}" r="6" fill="#ffcf4a"/>`;

  const canyon = `
    <defs><linearGradient id="advSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc58f"/><stop offset="1" stop-color="#fff1df"/></linearGradient></defs>
    <rect width="640" height="240" fill="url(#advSky)"/>
    <circle cx="540" cy="48" r="24" fill="#ffe08a"/>
    <path d="M0 96 L70 70 L140 92 L210 64 L300 90 L380 60 L470 88 L560 66 L640 86 L640 132 L0 132Z" fill="#e7a877" opacity="0.55"/>
    <path d="M228 132 L412 132 L402 240 L238 240Z" fill="#6b3320"/>
    <path d="M240 222 Q320 212 400 222 L402 240 L238 240Z" fill="#3fa7c9"/>
    <path d="M0 132 L228 132 L238 240 L0 240Z" fill="#b5643a"/>
    <path d="M412 132 L640 132 L640 240 L402 240Z" fill="#b5643a"/>
    <path d="M0 160 L232 160 M0 196 L236 196 M408 164 L640 164 M405 200 L640 200" stroke="#9a4f2b" stroke-width="3"/>
    <path d="M228 133 Q320 152 412 133" stroke="#8a5a2b" stroke-width="3" fill="none" stroke-dasharray="7 5"/>
    ${b(0, 1, '<rect x="228" y="128" width="62" height="11" rx="2" fill="#9a9a9a"/><path d="M248 128v11M268 128v11" stroke="#6f6f6f" stroke-width="2"/>')}
    ${b(0, 2, '<rect x="290" y="128" width="62" height="11" rx="2" fill="#9a9a9a"/><path d="M310 128v11M330 128v11" stroke="#6f6f6f" stroke-width="2"/>')}
    ${b(0, 3, '<rect x="352" y="128" width="60" height="11" rx="2" fill="#9a9a9a"/><path d="M372 128v11M392 128v11" stroke="#6f6f6f" stroke-width="2"/><path d="M236 139 Q320 200 404 139" stroke="#8d8d8d" stroke-width="7" fill="none"/>')}
    ${b(1, 1, lamp(248, 128, 30))}
    ${b(1, 2, lamp(320, 128, 30))}
    ${b(1, 3, lamp(394, 128, 30))}
    ${b(2, 1, '<rect x="220" y="80" width="9" height="52" fill="#6b4226"/><circle cx="224.5" cy="78" r="6" fill="#6b4226"/>')}
    ${b(2, 2, '<rect x="411" y="80" width="9" height="52" fill="#6b4226"/><circle cx="415.5" cy="78" r="6" fill="#6b4226"/>')}
    ${b(2, 3, '<path d="M226 84 Q320 124 416 84" stroke="#c9a46a" stroke-width="3" fill="none"/><path d="M262 98v32M296 107v23M330 109v20M364 104v26M396 94v36" stroke="#c9a46a" stroke-width="1.6"/>')}
    <g transform="translate(560 132)"><rect x="-22" y="-48" width="8" height="48" fill="#6b4226"/><rect x="14" y="-48" width="8" height="48" fill="#6b4226"/><rect x="-26" y="-56" width="52" height="10" rx="3" fill="#6b4226"/><path d="M0 -56 V-84" stroke="#4a2a17" stroke-width="2"/><path class="adv-flag" d="M0 -84 L20 -78 L0 -71Z" fill="#e05a2b"/></g>`;

  const reef = `
    <defs><linearGradient id="advSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b3d63"/><stop offset="1" stop-color="#2a8fb8"/></linearGradient></defs>
    <rect width="640" height="240" fill="url(#advSky)"/>
    <path d="M90 0 L150 0 L60 240 L10 240Z M330 0 L380 0 L300 240 L250 240Z M520 0 L560 0 L500 240 L460 240Z" fill="#fff" opacity="0.06"/>
    <g class="adv-bubbles" fill="none" stroke="#bfe9ff" stroke-width="1.5" opacity="0.7"><circle cx="70" cy="150" r="4"/><circle cx="78" cy="128" r="3"/><circle cx="380" cy="140" r="4"/><circle cx="388" cy="116" r="2.5"/><circle cx="600" cy="120" r="3"/></g>
    <path d="M0 196 Q160 180 320 194 T640 188 L640 240 L0 240Z" fill="#e8c98a"/>
    <path d="M30 220 q8 -4 16 0 M200 226 q8 -4 16 0 M430 222 q8 -4 16 0" stroke="#c9a568" stroke-width="2" fill="none"/>
    ${b(0, 1, '<path d="M120 196 C116 176 104 168 108 152 M120 196 C124 172 136 166 132 148 M120 196 C120 180 120 170 120 160" stroke="#ff7a8a" stroke-width="6" stroke-linecap="round" fill="none"/>')}
    ${b(0, 2, '<path d="M300 193 C294 170 280 160 286 140 M300 193 C306 166 322 160 318 136 M300 193 C300 172 300 160 302 148" stroke="#ff9f5a" stroke-width="7" stroke-linecap="round" fill="none"/>')}
    ${b(0, 3, '<path d="M470 190 C460 160 440 150 448 120 M470 190 C482 156 504 148 498 116 M470 190 C470 160 470 140 474 124 M470 170 C456 164 448 166 440 158" stroke="#ff6fb1" stroke-width="8" stroke-linecap="round" fill="none"/>')}
    ${b(1, 1, '<path d="M60 198 V150" stroke="#22566e" stroke-width="4"/><circle class="adv-glow" cx="60" cy="144" r="14" fill="#9ff3ff" opacity="0.35"/><circle cx="60" cy="144" r="7" fill="#d6fbff"/>')}
    ${b(1, 2, '<path d="M240 196 V146" stroke="#22566e" stroke-width="4"/><circle class="adv-glow" cx="240" cy="140" r="14" fill="#9ff3ff" opacity="0.35"/><circle cx="240" cy="140" r="7" fill="#d6fbff"/>')}
    ${b(1, 3, '<path d="M410 194 V142" stroke="#22566e" stroke-width="4"/><circle class="adv-glow" cx="410" cy="136" r="14" fill="#9ff3ff" opacity="0.35"/><circle cx="410" cy="136" r="7" fill="#d6fbff"/>')}
    ${b(2, 1, '<rect x="540" y="168" width="40" height="22" rx="3" fill="#8a5a2b"/><path d="M540 170 Q560 152 580 170" fill="#a8703a"/><circle cx="560" cy="176" r="3" fill="#ffd166"/>')}
    ${b(2, 2, '<g class="adv-bob"><ellipse cx="520" cy="80" rx="46" ry="16" fill="#ffcf4a"/><rect x="510" y="56" width="20" height="14" rx="4" fill="#ffcf4a"/><circle cx="504" cy="80" r="5" fill="#bfe9ff"/><circle cx="522" cy="80" r="5" fill="#bfe9ff"/><circle cx="540" cy="80" r="5" fill="#bfe9ff"/></g>')}
    ${b(2, 3, '<path d="M596 192 V128 Q616 108 636 128 V192" stroke="#ffd166" stroke-width="7" fill="none"/><circle cx="616" cy="122" r="5" fill="#fff"/>')}
    <g transform="translate(600 190)"><ellipse cx="0" cy="0" rx="22" ry="6" fill="#c9a568"/><circle cx="-8" cy="-6" r="5" fill="#fffbe9"/><circle cx="3" cy="-7" r="5" fill="#fffbe9"/><circle cx="12" cy="-4" r="4" fill="#fffbe9"/></g>`;

  const works = `
    <defs><linearGradient id="advSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b3361"/><stop offset="1" stop-color="#6b5fa8"/></linearGradient></defs>
    <rect width="640" height="240" fill="url(#advSky)"/>
    <rect x="30" y="26" width="70" height="44" rx="4" fill="#8f86c9" opacity="0.5"/><rect x="290" y="26" width="70" height="44" rx="4" fill="#8f86c9" opacity="0.5"/><rect x="420" y="26" width="70" height="44" rx="4" fill="#8f86c9" opacity="0.5"/>
    <path d="M0 190 H640 V240 H0Z" fill="#2a2445"/>
    <path d="M0 190 H640" stroke="#a79bdc" stroke-width="3"/>
    ${b(0, 1, gear(90, 140, 20, "#d8be5a", "#3b3361", "adv-spin"))}
    ${b(0, 2, gear(138, 112, 28, "#c9a640", "#3b3361", "adv-spin-rev"))}
    ${b(0, 3, gear(206, 132, 40, "#e0c46a", "#3b3361", "adv-spin"))}
    ${b(1, 1, '<rect x="280" y="166" width="110" height="12" rx="6" fill="#544a86"/><circle cx="286" cy="172" r="6" fill="#a79bdc"/><circle cx="384" cy="172" r="6" fill="#a79bdc"/>')}
    ${b(1, 2, '<rect x="384" y="166" width="110" height="12" rx="6" fill="#544a86"/><circle cx="488" cy="172" r="6" fill="#a79bdc"/><path d="M300 178 v12 M380 178 v12 M470 178 v12" stroke="#544a86" stroke-width="4"/>')}
    ${b(1, 3, '<g class="adv-slide"><rect x="296" y="148" width="18" height="18" rx="2" fill="#e05a2b"/><rect x="350" y="148" width="18" height="18" rx="2" fill="#2c7d6b"/><rect x="404" y="148" width="18" height="18" rx="2" fill="#205fa6"/></g>')}
    ${b(2, 1, '<rect x="548" y="120" width="40" height="70" rx="6" fill="#544a86"/><circle cx="568" cy="150" r="10" fill="#a79bdc"/><path d="M562 150h12" stroke="#2a2445" stroke-width="3"/>')}
    ${b(2, 2, '<rect x="558" y="64" width="20" height="58" fill="#7a6fb8"/><rect x="554" y="58" width="28" height="10" rx="2" fill="#a79bdc"/>')}
    ${b(2, 3, '<g class="adv-puff" fill="#e9e5ff" opacity="0.85"><circle cx="568" cy="44" r="10"/><circle cx="582" cy="32" r="8"/><circle cx="596" cy="22" r="6"/></g>')}
    <g transform="translate(612 190)"><rect x="-14" y="-34" width="28" height="34" rx="3" fill="#ffd166"/><path d="M-8 -22 h16 M-8 -14 h16" stroke="#8a6a12" stroke-width="2"/><path d="M0 -34 V-48" stroke="#2a2445" stroke-width="2"/><path class="adv-flag" d="M0 -48 L16 -43 L0 -38Z" fill="#e05a2b"/></g>`;

  const harbor = `
    <defs><linearGradient id="advSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffab7f"/><stop offset="1" stop-color="#ffe7c7"/></linearGradient></defs>
    <rect width="640" height="240" fill="url(#advSky)"/>
    <circle cx="330" cy="118" r="34" fill="#ffd08a"/>
    <path d="M0 118 H640 V196 H0Z" fill="#2b7bb9"/>
    <path class="adv-wave" d="M0 136 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#7cc0ea" stroke-width="2" fill="none" opacity="0.7"/>
    <g fill="#5b3a1f"><path d="M110 146 h64 l-10 14 h-44Z"/><path d="M270 150 h64 l-10 14 h-44Z"/><path d="M430 146 h64 l-10 14 h-44Z"/></g>
    <g stroke="#3a2412" stroke-width="3"><path d="M142 146 V100"/><path d="M302 150 V104"/><path d="M462 146 V100"/></g>
    ${b(0, 1, '<path d="M145 102 L172 140 H145Z" fill="#fff8ee"/><path d="M139 106 L118 140 H139Z" fill="#ffe2c4"/>')}
    ${b(0, 2, '<path d="M305 106 L332 144 H305Z" fill="#fff8ee"/><path d="M299 110 L278 144 H299Z" fill="#ffe2c4"/>')}
    ${b(0, 3, '<path d="M465 102 L492 140 H465Z" fill="#fff8ee"/><path d="M459 106 L438 140 H459Z" fill="#ffe2c4"/><path d="M462 100 l14 4 l-14 5Z" fill="#e05a2b"/>')}
    ${b(1, 1, '<rect x="572" y="96" width="40" height="24" fill="#f1ede6"/><rect x="572" y="104" width="40" height="6" fill="#e05a2b"/>')}
    ${b(1, 2, '<path d="M576 96 L582 46 H602 L608 96Z" fill="#f1ede6"/><path d="M579 70 H605 V78 H578Z" fill="#e05a2b"/>')}
    ${b(1, 3, '<rect x="580" y="30" width="24" height="16" fill="#ffd166"/><path d="M580 34 L480 14 L480 62 L580 42Z" class="adv-glow" fill="#fff2b3" opacity="0.5"/><path d="M576 30 H608 L592 20Z" fill="#5b3a1f"/>')}
    ${b(2, 1, '<rect x="36" y="80" width="10" height="116" fill="#d98a1f"/>')}
    ${b(2, 2, '<path d="M30 84 H110" stroke="#d98a1f" stroke-width="9"/><path d="M41 84 L60 100 M41 84 L80 100" stroke="#a96812" stroke-width="3"/>')}
    ${b(2, 3, '<g class="adv-bob"><path d="M100 88 V128" stroke="#3a2412" stroke-width="2"/><rect x="88" y="128" width="24" height="18" fill="#b5643a"/><path d="M88 137 h24 M100 128 v18" stroke="#7a3f22" stroke-width="2"/></g>')}
    <path d="M0 196 H640 V240 H0Z" fill="#a8703a"/>
    <path d="M0 204 H640 M0 222 H640" stroke="#8a5a2b" stroke-width="2"/>
    <g transform="translate(606 204)"><rect x="-18" y="-22" width="16" height="16" fill="#b5643a"/><rect x="0" y="-22" width="16" height="16" fill="#c9824a"/><rect x="-9" y="-38" width="16" height="16" fill="#d29a5e"/></g>`;

  const storm = `
    <defs><linearGradient id="advSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1640"/><stop offset="1" stop-color="#43347a"/></linearGradient></defs>
    <rect width="640" height="240" fill="url(#advSky)"/>
    <g fill="#fff" opacity="0.8"><circle cx="40" cy="30" r="1.5"/><circle cx="130" cy="50" r="1.2"/><circle cx="250" cy="22" r="1.6"/><circle cx="350" cy="44" r="1.2"/><circle cx="600" cy="30" r="1.4"/></g>
    <g fill="#5d5194"><ellipse cx="420" cy="40" rx="60" ry="18"/><ellipse cx="470" cy="30" rx="40" ry="16"/><ellipse cx="170" cy="56" rx="50" ry="14"/></g>
    <path class="adv-bolt" d="M440 52 L428 78 L440 78 L430 104" stroke="#ffe066" stroke-width="3" fill="none"/>
    <path d="M0 200 Q320 150 640 200 L640 240 L0 240Z" fill="#2a2350"/>
    <g transform="translate(500 170)"><rect x="-36" y="-28" width="72" height="28" rx="4" fill="#8f86c9"/><path d="M-36 -28 Q0 -62 36 -28Z" fill="#b3abe6"/><rect x="-8" y="-16" width="16" height="16" fill="#2a2350"/><circle cx="-22" cy="-14" r="4" fill="#ffe066"/><circle cx="22" cy="-14" r="4" fill="#ffe066"/></g>
    ${b(0, 1, '<path d="M452 168 Q500 118 548 168" stroke="#7ef0ff" stroke-width="3" fill="none" opacity="0.8"/>')}
    ${b(0, 2, '<path d="M440 170 Q500 96 560 170" stroke="#7ef0ff" stroke-width="3" fill="none" opacity="0.8"/>')}
    ${b(0, 3, '<path class="adv-glow" d="M430 172 Q500 74 570 172Z" fill="#7ef0ff" opacity="0.22"/>')}
    ${b(1, 1, '<rect x="64" y="160" width="32" height="26" rx="3" fill="#8f86c9"/>')}
    ${b(1, 2, '<path d="M74 160 L80 96 L86 160Z" fill="#b3abe6"/><path d="M71 130 H89" stroke="#8f86c9" stroke-width="3"/>')}
    ${b(1, 3, '<circle class="adv-glow" cx="80" cy="92" r="16" fill="#ff7ad9" opacity="0.4"/><circle cx="80" cy="92" r="7" fill="#ffc2ef"/>')}
    ${b(2, 1, '<rect x="212" y="150" width="54" height="20" rx="6" fill="#e05a2b"/><rect x="226" y="140" width="24" height="12" rx="3" fill="#ffb08a"/>')}
    ${b(2, 2, '<circle cx="222" cy="172" r="7" fill="#1d1640"/><circle cx="256" cy="172" r="7" fill="#1d1640"/><path d="M258 150 V128" stroke="#e05a2b" stroke-width="2"/><circle cx="258" cy="126" r="3" fill="#ffe066"/>')}
    ${b(2, 3, '<path d="M206 138 L236 132 L240 140 L210 146Z" fill="#7ef0ff"/><path d="M222 140 V150" stroke="#8f86c9" stroke-width="2"/>')}`;

  const SIX = (pts) => pts.map(([x, y]) => ({ x, y }));

  /** @type {Record<string, any>} */
  const WORLDS = {
    "mission-1": {
      key: "canyon",
      name: "Canyon Bridge",
      intro:
        "The village is on the far side of the canyon. Every equation you solve earns stones. Spend them to build the bridge your way.",
      resource: ["stone", "stones"],
      tokenColor: "#9a9a9a",
      scene: canyon,
      stops: SIX([
        [40, 132],
        [110, 132],
        [185, 132],
        [265, 132],
        [340, 132],
        [430, 132],
        [545, 132],
      ]),
      tracks: [
        { name: "Stone planks", short: "Planks", note: "A solid road across the gap." },
        { name: "Lanterns", short: "Lanterns", note: "Light so travelers can cross at night." },
        { name: "Rope rails", short: "Rails", note: "Towers and rails so nobody falls." },
      ],
      endings: [
        {
          id: "planks",
          title: "Stone Span Builder",
          line: "Carts can now roll across your stone bridge.",
        },
        {
          id: "lanterns",
          title: "Lantern Keeper",
          line: "Your lanterns guide night travelers home.",
        },
        {
          id: "rails",
          title: "Rope Ranger",
          line: "Your rails make the crossing safe for everyone.",
        },
        {
          id: "balanced",
          title: "Master Bridgewright",
          line: "A balanced bridge: strong, bright, and safe.",
        },
      ],
      actionTitle: "Balance check",
    },
    "mission-2": {
      key: "reef",
      name: "Pearl Reef Dive",
      intro:
        "The reef lost its light. Every equation you solve brings up pearls. Spend them to bring the reef back to life.",
      resource: ["pearl", "pearls"],
      tokenColor: "#fffbe9",
      scene: reef,
      stops: SIX([
        [40, 196],
        [120, 192],
        [200, 190],
        [280, 192],
        [360, 194],
        [450, 192],
        [560, 190],
      ]),
      tracks: [
        { name: "Coral garden", short: "Coral", note: "Grow coral homes for the fish." },
        { name: "Sea lamps", short: "Lamps", note: "Light up the dark water." },
        { name: "Treasure dock", short: "Dock", note: "A chest, a submarine, and a gate." },
      ],
      endings: [
        { id: "coral", title: "Coral Keeper", line: "Fish swim back to your coral garden." },
        { id: "lamps", title: "Lamp Lighter", line: "Your lamps make the deep reef glow." },
        { id: "dock", title: "Treasure Captain", line: "Your submarine guards the pearl gate." },
        {
          id: "balanced",
          title: "Reef Guardian",
          line: "A balanced reef: alive, bright, and safe.",
        },
      ],
      actionTitle: "Pearl count",
    },
    "mission-3": {
      key: "works",
      name: "Gear Works",
      intro:
        "The factory machines stopped. Every equation you solve earns gears. Spend them to start the machines you choose.",
      resource: ["gear", "gears"],
      tokenColor: "#d8be5a",
      scene: works,
      stops: SIX([
        [40, 190],
        [120, 190],
        [200, 190],
        [290, 190],
        [380, 190],
        [480, 190],
        [580, 190],
      ]),
      tracks: [
        { name: "Big wheels", short: "Wheels", note: "Gears that turn the whole factory." },
        { name: "Conveyor belt", short: "Belt", note: "Moves boxes down the line." },
        { name: "Steam boiler", short: "Boiler", note: "Power from steam." },
      ],
      endings: [
        { id: "wheels", title: "Wheel Master", line: "Your giant gears turn the factory again." },
        { id: "belt", title: "Belt Boss", line: "Boxes roll down your conveyor belt." },
        { id: "boiler", title: "Steam Chief", line: "Your boiler sends steam to every machine." },
        {
          id: "balanced",
          title: "Chief Engineer",
          line: "A balanced factory: every machine runs.",
        },
      ],
      actionTitle: "Equal groups",
    },
    "mission-4": {
      key: "harbor",
      name: "Harbor Fleet",
      intro:
        "Three ships must carry cargo out of the harbor. Every equation you solve earns crates. Spend them to get the fleet ready your way.",
      resource: ["crate", "crates"],
      tokenColor: "#c9824a",
      scene: harbor,
      stops: SIX([
        [30, 206],
        [120, 206],
        [210, 206],
        [300, 206],
        [390, 206],
        [480, 206],
        [570, 206],
      ]),
      tracks: [
        { name: "Sails", short: "Sails", note: "Each ship gets sails to leave the harbor." },
        { name: "Lighthouse", short: "Lighthouse", note: "A light to guide the ships." },
        { name: "Dock crane", short: "Crane", note: "Lifts cargo onto the ships." },
      ],
      endings: [
        { id: "sails", title: "Sail Captain", line: "Your fleet sails out with full sails." },
        { id: "lighthouse", title: "Light Keeper", line: "Your lighthouse guides every ship." },
        { id: "crane", title: "Crane Operator", line: "Your crane loads cargo fast and safe." },
        {
          id: "balanced",
          title: "Harbor Master",
          line: "A balanced harbor: ships, light, and cargo.",
        },
      ],
      actionTitle: "Cargo split",
    },
    "mission-5": {
      key: "storm",
      name: "Storm Lab",
      intro:
        "A storm is coming to the lab. Every equation mixes it up. Pick the undo tool, solve, and earn energy cells to protect the lab your way.",
      resource: ["energy cell", "energy cells"],
      tokenColor: "#7ef0ff",
      scene: storm,
      tools: true,
      stops: SIX([
        [40, 196],
        [120, 187],
        [200, 180],
        [280, 176],
        [360, 176],
        [420, 178],
        [500, 184],
      ]),
      tracks: [
        { name: "Shield dome", short: "Shield", note: "Keeps lightning off the lab." },
        { name: "Beacon tower", short: "Beacon", note: "Calls for help through the storm." },
        { name: "Rescue rover", short: "Rover", note: "Drives out to bring the team home." },
      ],
      endings: [
        { id: "shield", title: "Shield Maker", line: "Your shield dome keeps the lab safe." },
        { id: "beacon", title: "Beacon Keeper", line: "Your beacon shines through the storm." },
        { id: "rover", title: "Rover Pilot", line: "Your rover brings the whole team home." },
        { id: "balanced", title: "Lab Director", line: "A balanced plan: safe, seen, and ready." },
      ],
      actionTitle: "Undo check",
    },
  };

  /** @type {any} */ (window).ARLWorlds = WORLDS;
})();

/* Unit 3 Test Review · The Summit Observatory (English / Spanish).
 * Each review question solved correctly gives one power cell. Families choose which
 * stations to power on the way up the mountain; the choices decide the ending.
 * Requires /curriculum/review-expeditions/basecamp.js (ExpeditionCampaign).
 */
(() => {
  "use strict";
  const STOPS = [
    [150, 178],
    [380, 140],
    [610, 104],
    [840, 70],
  ];
  const cls = (ctx, i) => {
    const on = i === 3 ? ctx.finished : ctx.built[i];
    return `xc-mark${on ? " xc-mark--on" : ""}${ctx.justBuilt === i ? " xc-mark--new" : ""}`;
  };

  function scene(ctx) {
    const [vx, vy] = STOPS[ctx.finished ? 3 : Math.min(ctx.now, 3)];
    return `<svg viewBox="0 0 960 230" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs><linearGradient id="smSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d2a5c"/><stop offset="1" stop-color="#5a6fae"/></linearGradient></defs>
      <rect width="960" height="230" fill="url(#smSky)"/>
      <g fill="#fff"><circle cx="120" cy="30" r="1.6"/><circle cx="300" cy="50" r="1.3"/><circle cx="520" cy="24" r="1.8"/><circle cx="690" cy="40" r="1.2"/><circle cx="930" cy="22" r="1.5"/><circle cx="420" cy="70" r="1.1"/></g>
      <path d="M0 230 L150 150 L260 190 L470 90 L600 140 L840 30 L960 110 V230Z" fill="#3a4a7a"/>
      <path d="M470 90 L430 112 L455 108 L470 120 L490 106 L510 112Z M840 30 L800 58 L828 52 L845 66 L862 52 L885 60Z" fill="#eef3ff"/>
      <path d="M0 230 L120 196 L300 210 L500 170 L700 190 L960 150 V230Z" fill="#26335e"/>
      <path class="xc-road" d="M${STOPS.map(([x, y]) => `${x} ${y + 12}`).join(" L")}" stroke="#ffd76a" stroke-width="3" stroke-dasharray="6 8" fill="none" opacity=".7"/>
      <g class="${cls(ctx, 0)}" transform="translate(${STOPS[0][0]} ${STOPS[0][1]})">
        <path d="M-34 10 L-10 -26 L14 10Z" fill="#e8743b"/><path d="M4 10 L24 -16 L44 10Z" fill="#f2b33d"/><circle class="xc-glow" cx="-10" cy="2" r="5" fill="#ffd76a"/>
      </g>
      <g class="${cls(ctx, 1)}" transform="translate(${STOPS[1][0]} ${STOPS[1][1]})">
        <path d="M0 10 V-44" stroke="#c8d3f0" stroke-width="4"/><path d="M-14 -44 H14 M-10 -34 H10" stroke="#c8d3f0" stroke-width="3"/>
        <circle class="xc-glow" cx="0" cy="-50" r="7" fill="#7ad7ff"/><path class="xc-glow" d="M8 -50 Q40 -64 70 -50" stroke="#7ad7ff" stroke-width="2" fill="none"/>
      </g>
      <g class="${cls(ctx, 2)}" transform="translate(${STOPS[2][0]} ${STOPS[2][1]})">
        <path d="M-80 0 Q0 30 80 0" stroke="#c8d3f0" stroke-width="3" fill="none"/><path d="M-80 0 V-30 M80 0 V-30" stroke="#c8d3f0" stroke-width="5"/>
        <circle class="xc-glow" cx="-80" cy="-34" r="5" fill="#ffd76a"/><circle class="xc-glow" cx="80" cy="-34" r="5" fill="#ffd76a"/>
      </g>
      <g class="${cls(ctx, 3)}" transform="translate(${STOPS[3][0]} ${STOPS[3][1]})">
        <rect x="-30" y="-14" width="60" height="26" fill="#dfe6f7"/><path d="M-32 -14 A32 32 0 0 1 32 -14Z" fill="#c8d3f0"/>
        <rect x="6" y="-44" width="10" height="34" fill="#8191c4" transform="rotate(30 11 -27)"/>
        <path class="xc-glow" d="M16 -46 L120 -120 L150 -90Z" fill="#fff5b8" opacity=".5"/>
      </g>
      <g class="xc-vehicle" style="transform:translate(${vx - 34}px,${vy - 26}px)">
        <circle cx="10" cy="4" r="7" fill="#f2c38a"/><rect x="3" y="11" width="14" height="18" rx="3" fill="#e8743b"/><rect x="-4" y="12" width="8" height="14" rx="2" fill="#2f6f5e"/>
        <path d="M5 29 v8 M15 29 v8" stroke="#2a2a3a" stroke-width="3"/><path d="M22 10 l8 24" stroke="#c8d3f0" stroke-width="2"/>
      </g>
    </svg>`;
  }

  window.ExpeditionCampaign.worlds.summit = {
    id: "summit",
    kicker: {
      en: "Family review · The Summit Observatory",
      es: "Repaso en familia · El observatorio de la cumbre",
    },
    title: { en: "Power Up the Observatory", es: "Enciende el observatorio" },
    story: {
      en: "The valley lost contact with the observatory on the mountain top. Each question you solve earns a power cell. Choose which stations to power on the way up.",
      es: "El valle perdió contacto con el observatorio en la cima de la montaña. Cada pregunta que resuelves gana una celda de energía. Elige qué estaciones encender en el camino.",
    },
    earnRule: {
      en: "How to earn: each question you solve gives 1 power cell. A shown answer does not give a cell. Each question counts once.",
      es: "Cómo ganar: cada pregunta que resuelves da 1 celda de energía. Una respuesta mostrada no da celda. Cada pregunta cuenta una sola vez.",
    },
    practiceLabel: {
      en: "Earn power: go to the next question →",
      es: "Gana energía: ve a la siguiente pregunta →",
    },
    verb: { en: "Power it up", es: "Encender" },
    costMode: "share",
    resources: [
      {
        id: "cell",
        icon: "⚡",
        name: { en: "power cells", es: "celdas de energía" },
        one: { en: "power cell", es: "celda de energía" },
      },
    ],
    chapters: [
      {
        id: "camp",
        place: { en: "Base Camp", es: "Campamento base" },
        title: { en: "Set up base camp", es: "Prepara el campamento" },
        text: {
          en: "The climb starts at base camp. What should the team set up first?",
          es: "La subida empieza en el campamento base. ¿Qué debe preparar primero el equipo?",
        },
        options: [
          {
            id: "weather",
            icon: "🌦️",
            title: { en: "Weather station", es: "Estación del clima" },
            text: { en: "Know when storms are coming.", es: "Saber cuándo vienen las tormentas." },
            cost: 0.2,
            flag: "weather",
          },
          {
            id: "hut",
            icon: "⛑️",
            title: { en: "Rescue hut", es: "Refugio de rescate" },
            text: {
              en: "A warm, safe place for every climber.",
              es: "Un lugar cálido y seguro para cada escalador.",
            },
            cost: 0.2,
            flag: "rescue",
          },
          {
            id: "tent",
            icon: "🔭",
            title: { en: "Telescope tent", es: "Carpa del telescopio" },
            text: {
              en: "Map the stars from camp. Later stations cost 1 cell less.",
              es: "Mapea las estrellas. Las estaciones siguientes cuestan 1 celda menos.",
            },
            cost: 0.25,
            flag: "stars",
            discount: { cell: 1 },
          },
        ],
      },
      {
        id: "ridge",
        place: { en: "The Ridge", es: "La cresta" },
        title: { en: "Cross the ridge", es: "Cruza la cresta" },
        text: {
          en: "The ridge is windy and steep. How will the team cross it?",
          es: "La cresta tiene mucho viento y es empinada. ¿Cómo la cruzará el equipo?",
        },
        options: [
          {
            id: "cable",
            icon: "🚡",
            title: { en: "Cable car", es: "Teleférico" },
            text: {
              en: "Carry climbers safely over the ridge.",
              es: "Lleva a los escaladores con seguridad.",
            },
            cost: 0.2,
            flag: "rescue",
          },
          {
            id: "wind",
            icon: "🌬️",
            title: { en: "Wind turbines", es: "Turbinas de viento" },
            text: {
              en: "Turn the strong wind into power.",
              es: "Convierte el viento fuerte en energía.",
            },
            cost: 0.25,
            flag: "weather",
          },
          {
            id: "map",
            icon: "🗺️",
            title: { en: "Star map station", es: "Estación del mapa estelar" },
            text: {
              en: "Use the stars to find the safest path.",
              es: "Usa las estrellas para hallar el camino más seguro.",
            },
            cost: 0.2,
            flag: "stars",
          },
        ],
      },
      {
        id: "bridge",
        place: { en: "Sky Bridge", es: "Puente del cielo" },
        title: { en: "Reach the summit", es: "Llega a la cumbre" },
        text: {
          en: "One last gap stands between the team and the observatory.",
          es: "Un último hueco separa al equipo del observatorio.",
        },
        options: [
          {
            id: "rope",
            icon: "🌉",
            title: { en: "Rope bridge", es: "Puente de cuerda" },
            text: {
              en: "A strong bridge with rails for everyone.",
              es: "Un puente fuerte con barandas para todos.",
            },
            cost: 0.2,
            flag: "rescue",
          },
          {
            id: "shield",
            icon: "🛡️",
            title: { en: "Storm shield", es: "Escudo contra tormentas" },
            text: {
              en: "Protect the summit from lightning.",
              es: "Protege la cumbre de los rayos.",
            },
            cost: 0.25,
            flag: "weather",
          },
          {
            id: "mirror",
            icon: "🪞",
            title: { en: "Mirror array", es: "Conjunto de espejos" },
            text: {
              en: "Bounce starlight into the telescope.",
              es: "Refleja la luz de las estrellas hacia el telescopio.",
            },
            cost: 0.2,
            flag: "stars",
          },
        ],
      },
    ],
    capstone: {
      place: { en: "Observatory", es: "Observatorio" },
      icon: "🔭",
      title: { en: "Light the observatory", es: "Enciende el observatorio" },
      text: {
        en: "Send the last power cells to the summit and reconnect the valley.",
        es: "Envía las últimas celdas a la cumbre y vuelve a conectar el valle.",
      },
      verb: { en: "Light it up", es: "Encenderlo" },
      cost: 0.15,
    },
    endings: {
      weather: {
        icon: "🌦️",
        title: { en: "Storm Watchers", es: "Guardianes de las tormentas" },
        text: {
          en: "The observatory warns the valley before every storm. Families plan their week by your forecast.",
          es: "El observatorio avisa al valle antes de cada tormenta. Las familias planean su semana con tu pronóstico.",
        },
      },
      rescue: {
        icon: "⛑️",
        title: { en: "Mountain Guardians", es: "Guardianes de la montaña" },
        text: {
          en: "Huts, cable cars, and bridges keep every climber safe. The mountain is open to everyone.",
          es: "Refugios, teleféricos y puentes protegen a cada escalador. La montaña está abierta para todos.",
        },
      },
      stars: {
        icon: "✨",
        title: { en: "Star Keepers", es: "Guardianes de las estrellas" },
        text: {
          en: "The telescope sees farther than ever. The valley gathers on clear nights to look at the stars.",
          es: "El telescopio ve más lejos que nunca. El valle se reúne en las noches claras para mirar las estrellas.",
        },
      },
    },
    scene,
  };
})();

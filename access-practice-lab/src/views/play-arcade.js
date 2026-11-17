// The student-facing front of Games & Worlds (/explore/play): a game arcade instead of a filter directory.
// Quick games link straight into the Language Game Studio (src/games/registry.js, with their scene art);
// every story world, conversation world and studio comes from the Games & Worlds rows of src/sitemap.js,
// so nothing listed here can drift from the site map. The full filterable directory stays below it.
import { scene, mascot } from "../games/art.js";
import { GAME } from "../games/registry.js";
import { loadGames } from "../games/state.js";
import { DESTINATIONS } from "../sitemap.js";
import { worldScene } from "./play-arcade-art.js";
import { BASE, html, icon } from "../util.js";

// Quick games per band, in the order a student should meet them: an easy win first, then variety of skill.
const QUICK = {
  "3-5": [
    "vocab-quest",
    "word-search-adventure",
    "mystery-word",
    "match-mania",
    "grammar-jungle",
    "spelling-expedition",
    "language-arcade",
    "sound-word-studio",
    "word-bingo",
    "story-detective",
    "read-along-theater",
    "fluency-echo",
  ],
  "6-8": [
    "mystery-word",
    "word-search-adventure",
    "language-arcade",
    "evidence-hunt",
    "connector-climb",
    "spelling-expedition",
    "grammar-jungle",
    "word-jeopardy",
    "sentence-strategy",
    "story-detective",
    "sound-word-studio",
    "fluency-echo",
  ],
};

// Shelves of bigger places. Each row: [sitemap id, scene art key, [3-5 blurb], [6-8 blurb]] (blurbs are [en, es]).
const SHELVES = [
  {
    id: "stories",
    title: [
      ["Story adventures", "Aventuras de cuentos"],
      ["Story campaigns", "Campañas de historias"],
    ],
    lead: [
      [
        "Big stories you play in missions. Your choices change what happens.",
        "Grandes historias que juegas en misiones. Tus decisiones cambian lo que pasa.",
      ],
      [
        "Multi-chapter stories where your reading, writing and speaking decide the ending.",
        "Historias de varios capítulos donde tu lectura, escritura y habla deciden el final.",
      ],
    ],
    rows: [
      [
        "adventure-worlds",
        "museum",
        [
          "Find a missing compass, explore a volcano island, run a newsroom. Every mission is a case to crack.",
          "Encuentra una brújula perdida, explora una isla volcánica, dirige un noticiero. Cada misión es un caso por resolver.",
        ],
        [
          "Six worlds of missions: track evidence in a museum heist, measure a volcano, file a news story.",
          "Seis mundos de misiones: sigue la evidencia de un robo en un museo, mide un volcán, publica una noticia.",
        ],
      ],
      [
        "language-games",
        "vault",
        [
          "Escape a locked room, solve a detective case, talk your way through real places.",
          "Escapa de una sala cerrada, resuelve un caso de detectives, habla en lugares reales.",
        ],
        [
          "An escape room, a detective case, real conversations and a newsroom deadline (no clock).",
          "Una sala de escape, un caso de detectives, conversaciones reales y un noticiero (sin reloj).",
        ],
      ],
      [
        "quest",
        "portal",
        [
          "Nine worlds where what you say and write changes the story.",
          "Nueve mundos donde lo que dices y escribes cambia la historia.",
        ],
        [
          "Nine worlds: investigate, argue, forge words and tell stories that change what happens.",
          "Nueve mundos: investiga, argumenta, forja palabras y cuenta historias que cambian lo que pasa.",
        ],
      ],
      [
        "signal-quest",
        "island",
        [
          "Explore an island and bring its signal back with four language challenges.",
          "Explora una isla y recupera su señal con cuatro retos de lenguaje.",
        ],
        [
          "Restore an island's signal through four language challenges.",
          "Restaura la señal de una isla con cuatro retos de lenguaje.",
        ],
      ],
      [
        "adventures",
        "path",
        ["Nine story worlds to explore.", "Nueve mundos de cuentos para explorar."],
        [
          "Nine story worlds to explore with language.",
          "Nueve mundos de cuentos para explorar con el lenguaje.",
        ],
      ],
      [
        "reality",
        "stage",
        [
          "Live inside a story: ask questions, find clues, change what characters do.",
          "Vive dentro de un cuento: haz preguntas, busca pistas, cambia lo que hacen los personajes.",
        ],
        [
          "Interview witnesses, weigh city proposals and persuade a council.",
          "Entrevista a testigos, evalúa propuestas para la ciudad y convence a un consejo.",
        ],
      ],
    ],
  },
  {
    id: "talk",
    title: [
      ["Talk your way through", "Habla para avanzar"],
      ["Real-world talk", "Conversaciones reales"],
    ],
    lead: [
      [
        "Walk into a place, meet someone and use English to get things done.",
        "Entra a un lugar, conoce a alguien y usa el inglés para lograr cosas.",
      ],
      [
        "Ask, clarify, repair and persuade in conversations that feel real.",
        "Pregunta, aclara, repara y convence en conversaciones que se sienten reales.",
      ],
    ],
    rows: [
      [
        "city",
        "city",
        [
          "Six buildings, twelve missions: order at the café, find a library book, catch the train.",
          "Seis edificios, doce misiones: pide en el café, busca un libro, toma el tren.",
        ],
        [
          "Six buildings, twelve missions: ask, answer and fix a misunderstanding.",
          "Seis edificios, doce misiones: pregunta, responde y aclara un malentendido.",
        ],
      ],
      [
        "scenarios",
        "talk",
        [
          "Short scenes from school and everyday life. Choose what to say and hear how it lands.",
          "Escenas cortas de la escuela y la vida diaria. Elige qué decir y escucha cómo suena.",
        ],
        [
          "Branching conversations: pick your words and see how people react.",
          "Conversaciones con ramas: elige tus palabras y mira cómo reaccionan.",
        ],
      ],
      [
        "worlds",
        "map",
        [
          "Signal Station, Evidence City, Conversation Quest and a Science Lab.",
          "Estación de señales, Ciudad de la evidencia, Misión de conversación y un laboratorio.",
        ],
        [
          "Connected missions: take in a source, decide with evidence, explain, then try it alone.",
          "Misiones conectadas: recibe una fuente, decide con evidencia, explica y hazlo solo.",
        ],
      ],
      [
        "exhibition",
        "beans",
        [
          "One science fair, four tasks: listen, read, speak and write.",
          "Una feria de ciencias, cuatro tareas: escuchar, leer, hablar y escribir.",
        ],
        [
          "One science exhibition, four linked tasks across the four skills.",
          "Una exhibición de ciencias, cuatro tareas unidas en las cuatro destrezas.",
        ],
      ],
    ],
  },
  {
    id: "more",
    title: [
      ["More game studios", "Más estudios de juegos"],
      ["More game studios", "Más estudios de juegos"],
    ],
    lead: [
      [
        "Puzzles, word games and story makers.",
        "Acertijos, juegos de palabras y creadores de cuentos.",
      ],
      [
        "Puzzles, word labs and story makers.",
        "Acertijos, laboratorios de palabras y creadores de historias.",
      ],
    ],
    rows: [
      ["puzzles", "strategy", null, null],
      ["studio-app-stories", "creator", null, null],
      ["studio-app-games", "jeopardy", null, null],
      ["language-studio", "factory", null, null],
      ["learning-studios", "world", null, null],
    ],
  },
];

const SKILL_ES = {
  Listening: "Escuchar",
  Reading: "Leer",
  Speaking: "Hablar",
  Writing: "Escribir",
  Integrated: "Integrado",
};

const destHref = (d, band) =>
  d.href.startsWith("/")
    ? d.href
    : `${BASE}/${d.href}${d.href.includes("?") ? "&" : "?"}grades=${band}`;
const gameHref = (id, band, extra = "") => `${BASE}/games/${id}?grades=${band}${extra}`;
const bi = (band) => (band === "6-8" ? 1 : 0);

// Today's pick turns over once a day, so a class that opens the page together sees the same game.
function todaysPick(band) {
  const list = QUICK[band] || QUICK["3-5"];
  const d = new Date();
  const day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
  return list[day % list.length];
}

function inProgress(band) {
  let games;
  try {
    games = loadGames();
  } catch {
    return [];
  }
  return Object.values(games.sessions || {})
    .filter(
      (s) => s.band === band && (s.phase === "play" || s.phase === "transfer") && GAME[s.game],
    )
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, 3);
}

function gameTile(id, band, I) {
  const g = GAME[id];
  if (!g) return "";
  return html`<li class="pa-game">
    <a class="pa-game-link" href="${gameHref(id, band)}">
      <span class="pa-game-art" aria-hidden="true">${scene(g.art, band)}</span>
      <span class="pa-game-body">
        <span class="pa-game-title">${I.T(...g.title)}</span>
        <span class="pa-game-text">${I.T(...g.tag)}</span>
        <span class="pa-meta">
          <span class="pa-chip"
            >${icon("clock")}${I.T(`${g.minutes} min`, `${g.minutes} min`)}</span
          >
          <span class="pa-chip">${I.T(g.skill, SKILL_ES[g.skill] || g.skill)}</span>
        </span>
      </span>
    </a>
  </li>`;
}

function placeCard(row, band, I) {
  const [id, art, blurb35, blurb68] = row;
  const d = DESTINATIONS.find((x) => x.id === id);
  if (!d) return "";
  const blurb = (band === "6-8" ? blurb68 : blurb35) || d.text;
  const verb = d.kind === "world" ? I.T("Enter", "Entrar") : I.T("Play", "Jugar");
  return html`<li class="pa-place">
    <a class="pa-place-link" href="${destHref(d, band)}">
      <span class="pa-place-art" aria-hidden="true">${worldScene(art, band) || scene(art, band)}</span>
      <span class="pa-place-body">
        <span class="pa-place-title">${I.T(...d.title)}</span>
        <span class="pa-place-text">${I.T(...blurb)}</span>
        <span class="pa-place-go" aria-hidden="true">${verb}${icon("arrow-right")}</span>
      </span>
    </a>
  </li>`;
}

/** Play destinations no shelf names still get a card, so a new sitemap row is never hidden. */
function shelvesFor(band, inBand) {
  const named = new Set(SHELVES.flatMap((s) => s.rows.map((r) => r[0])));
  const extra = DESTINATIONS.filter(
    (d) => d.section === "play" && inBand(d) && !named.has(d.id) && d.id !== "games",
  ).map((d) => [d.id, "quest", null, null]);
  return SHELVES.map((s) => ({
    ...s,
    rows: [
      ...s.rows.filter((r) => DESTINATIONS.some((d) => d.id === r[0] && inBand(d))),
      ...(s.id === "more" ? extra : []),
    ],
  })).filter((s) => s.rows.length);
}

export function arcadeHTML(I, band, inBand) {
  const b = bi(band);
  const pick = todaysPick(band);
  const pickGame = GAME[pick];
  const pool = (QUICK[band] || QUICK["3-5"]).filter((id) => id !== pick);
  const surprise = pool[Math.floor(Math.random() * pool.length)];
  const live = inProgress(band);
  const total = Object.keys(GAME).length;
  return html`<div class="pa pa-band-${band}">
    <section class="pa-hero" aria-labelledby="pa-pick-h">
      <div class="pa-hero-copy">
        <p class="pa-kicker">
          ${icon("sparkle")}${b ? I.T("Today's challenge", "El reto de hoy") : I.T("Today's game", "El juego de hoy")}
        </p>
        <h2 id="pa-pick-h" class="pa-hero-title">${I.T(...pickGame.title)}</h2>
        <p class="pa-hero-text">${I.T(...pickGame.tag)}</p>
        <div class="pa-hero-actions">
          <a class="btn btn-primary btn-big" href="${gameHref(pick, band)}"
            >${icon("play")}${I.T("Play now", "Jugar ahora")}</a
          >
          <a class="btn btn-big" href="${gameHref(surprise, band)}"
            >${icon("sparkle")}${I.T("Surprise me", "Sorpréndeme")}</a
          >
        </div>
        <p class="pa-hero-fine">
          ${I.T("No timers. Hints when you want them. Your progress saves on this device.", "Sin reloj. Pistas cuando las quieras. Tu progreso se guarda en este dispositivo.")}
        </p>
      </div>
      <div class="pa-hero-art" aria-hidden="true">
        ${scene(pickGame.art, band)}
        <span class="pa-hero-guide">${mascot(b ? "juno" : "pip", band, "cheer", 92)}</span>
      </div>
    </section>

    ${
      live.length
        ? html`<section class="pa-shelf pa-resume" aria-labelledby="pa-resume-h">
            <h2 id="pa-resume-h" class="pa-shelf-title">
              ${icon("replay")}${I.T("Keep playing", "Sigue jugando")}
            </h2>
            <ul class="pa-resume-list" role="list">
              ${live.map((s) => html`<li><a class="btn" href="${gameHref(s.game, band)}">${icon("play")}${I.T(...GAME[s.game].title)}</a></li>`)}
            </ul>
          </section>`
        : ""
    }

    <section class="pa-shelf" aria-labelledby="pa-quick-h">
      <div class="pa-shelf-head">
        <h2 id="pa-quick-h" class="pa-shelf-title">
          ${icon("play")}${b ? I.T("Quick games · 8–12 minutes", "Juegos rápidos · 8–12 minutos") : I.T("Quick games · about 10 minutes", "Juegos rápidos · unos 10 minutos")}
        </h2>
        <a class="pa-all" href="${BASE}/games?grades=${band}#gs-all"
          >${I.T(`All ${total} games`, `Los ${total} juegos`)}${icon("arrow-right")}</a
        >
      </div>
      <ul class="pa-games" role="list">
        ${(QUICK[band] || QUICK["3-5"]).map((id) => gameTile(id, band, I))}
      </ul>
    </section>

    ${shelvesFor(band, inBand).map(
      (s) =>
        html`<section class="pa-shelf pa-shelf-${s.id}" aria-labelledby="pa-${s.id}-h">
          <div class="pa-shelf-head">
            <h2 id="pa-${s.id}-h" class="pa-shelf-title">${I.T(...s.title[b])}</h2>
            <p class="pa-shelf-lead">${I.T(...s.lead[b])}</p>
          </div>
          <ul class="pa-places" role="list">
            ${s.rows.map((r) => placeCard(r, band, I))}
          </ul>
        </section>`,
    )}
  </div>`;
}

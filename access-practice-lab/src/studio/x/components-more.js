// Game-style components (the player's four game templates, applied to the questions you already have) and the
// components the engine cannot honestly do. Those are listed with a plain reason and never faked.

import { TEMPLATES } from "../core/schema.js";
import { convertActivity } from "../core/convert.js";
import { KINDS_PAGE, T, define, fresh, sampleQuestion, unavailable } from "./components-kit.js";

const GAME_INFO = {
  quest: [
    T(
      "Questions become a path of missions with camps; missed ones can be retried at the end.",
      "Las preguntas se convierten en un camino de misiones con campamentos; las falladas se reintentan al final.",
    ),
    ["game", "quest"],
  ],
  match: [
    T(
      "Cards float into a tray and students place each in its slot. Pairs come from your match questions or vocabulary; other questions become bonus rounds.",
      "Las tarjetas flotan hacia una bandeja y los estudiantes colocan cada una en su lugar. Las parejas vienen de sus preguntas de emparejar o del vocabulario; las demás preguntas son rondas extra.",
    ),
    ["game", "matching", "vocabulary"],
  ],
  puzzle: [
    T(
      "Every solved question earns a piece of a picture to place.",
      "Cada pregunta resuelta da una pieza de una imagen para colocar.",
    ),
    ["game", "puzzle"],
  ],
  strategy: [
    T(
      "Answers earn energy that students spend on choices in a garden; nobody loses.",
      "Las respuestas dan energía que los estudiantes gastan en decisiones en un jardín; nadie pierde.",
    ),
    ["game", "strategy"],
  ],
};

const gameComponents = TEMPLATES.game.map((t) => {
  const [purpose, tags] = GAME_INFO[t.id];
  return define({
    id: `game-${t.id}`,
    label: T(`Game style: ${t.en}`, `Estilo de juego: ${t.es}`),
    purpose,
    category: "game",
    tags,
    // Changes how the existing questions are delivered; adds no blocks.
    change: (activity) => convertActivity(activity, "game", t.id).activity,
    needs: { questions: 3 },
    compatibility: { kinds: KINDS_PAGE, templates: "any" },
    accessibility: T(
      "Uses the same question widgets as every other activity, so each question has the same keyboard path. Pause and Resume are buttons, and nothing is timed.",
      "Usa los mismos controles de pregunta que cualquier otra actividad, con el mismo camino por teclado. Pausar y Reanudar son botones y nada tiene tiempo.",
    ),
    printable: {
      alternative: "none",
      note: T(
        "Games are for the screen. Switch the activity back to a worksheet to print the same questions.",
        "Los juegos son para la pantalla. Vuelva a una hoja de trabajo para imprimir las mismas preguntas.",
      ),
    },
    previewBlocks: fresh(["choice", "match", "order"].map((f) => sampleQuestion(f))),
    previewExtra: { kind: "game", template: t.id },
    build: () => [],
  });
});

const no = (id, en, es, purposeEn, purposeEs, reasonEn, reasonEs, category) =>
  unavailable(id, T(en, es), T(purposeEn, purposeEs), T(reasonEn, reasonEs), category);

export const MORE_COMPONENTS = [
  ...gameComponents,
  no(
    "flip-cards",
    "Flip cards for vocabulary",
    "Tarjetas giratorias de vocabulario",
    "Animated cards that flip to show a meaning.",
    "Tarjetas animadas que giran para mostrar un significado.",
    "There is no flip-card format. The vocabulary list shows the word, meaning and example together, and Match my vocabulary words makes a matching question.",
    "No existe un formato de tarjetas giratorias. La lista de vocabulario muestra palabra, significado y ejemplo juntos, y Emparejar mis palabras hace una pregunta de emparejar.",
    "vocabulary",
  ),
  no(
    "map",
    "Interactive map",
    "Mapa interactivo",
    "A map students can explore or label.",
    "Un mapa que los estudiantes pueden explorar o rotular.",
    "The studio has no map block. A picture with Click the picture can be built by hand from your own map image.",
    "El estudio no tiene un bloque de mapa. Puede armar una imagen con Hacer clic en la imagen usando su propio mapa.",
    "visual",
  ),
  no(
    "simulation",
    "Simulation",
    "Simulación",
    "A model students change to see what happens.",
    "Un modelo que los estudiantes cambian para ver qué ocurre.",
    "Simulations are separate lessons on the site, not something an activity can contain.",
    "Las simulaciones son lecciones separadas del sitio; una actividad no puede contenerlas.",
    "interactive",
  ),
  no(
    "animation",
    "Animation",
    "Animación",
    "A short animated explanation.",
    "Una explicación animada corta.",
    "The activity model has no animation or video block.",
    "El modelo de actividad no tiene bloque de animación ni de video.",
    "visual",
  ),
  no(
    "branching",
    "Branching scenario",
    "Escenario con ramificaciones",
    "Different next steps depending on a choice.",
    "Pasos distintos según la elección.",
    "No question format sends a student to a different next step, so a branching path cannot be built honestly.",
    "Ningún formato de pregunta envía al estudiante a un paso distinto, así que no se puede armar un camino ramificado.",
    "interactive",
  ),
  no(
    "voice-recording",
    "Voice recording",
    "Grabación de voz",
    "Students record themselves speaking.",
    "Los estudiantes se graban hablando.",
    "The player has a read-aloud voice but cannot record or store student audio, by design. Use a written response with a sentence frame.",
    "El reproductor lee en voz alta pero no puede grabar ni guardar audio de estudiantes, por diseño. Use una respuesta escrita con marco de oración.",
    "language",
  ),
];

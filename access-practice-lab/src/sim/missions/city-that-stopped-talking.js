// THE CITY THAT STOPPED TALKING (flagship mission, grades 3-8, original content). One morning every phone call, text
// and radio message in Calder Bay stops arriving. The learner explores five places, questions six people, collects
// and compares evidence for three competing explanations, decides, explains aloud, writes a recommendation, revises
// it and then solves a new related problem alone. Five acts; four outcomes decided by the evidence, never a grade.
// One mission id for both bands: build("3-5") and build("6-8") differ only in a few task wordings.
import { evidence, explanations } from "./city-that-stopped-talking-evidence.js";
import { characters } from "./city-that-stopped-talking-people.js";
import { outcomes, tasks } from "./city-that-stopped-talking-tasks.js";

export const ID = "city-that-stopped-talking";
const has = (id) => ({ has: id });
const done = (id) => ({ done: id });
const talked = (id) => ({ talked: id });

// WIDA ELD Standards Framework (2020) expectation ids from src/acc/wida/catalog.js; none is invented here.
// Grades 3-5 span two WIDA grade clusters (2-3 and 4-5).
const STANDARDS = {
  "3-5": [
    "ELD-SC.2-3.Explain.Expressive",
    "ELD-SC.4-5.Explain.Expressive",
    "ELD-SC.2-3.Argue.Expressive",
    "ELD-SC.4-5.Argue.Expressive",
    "ELD-SI.K-3.Inform",
    "ELD-SI.4-12.Inform",
  ],
  "6-8": ["ELD-SC.6-8.Explain.Expressive", "ELD-SC.6-8.Argue.Expressive", "ELD-SI.4-12.Inform"],
};

const scenes = [
  {
    id: "square",
    art: "square",
    title: ["City Square", "Plaza de la Ciudad"],
    description: [
      "The square is full of people, and strangely quiet. Nobody is looking at a phone. A loudspeaker box hums on its pole, and paper notes cover the public board.",
      "La plaza está llena de gente y extrañamente callada. Nadie mira un teléfono. Una caja de altavoz zumba en su poste, y notas de papel cubren el tablero público.",
    ],
    hotspots: [
      {
        id: "loudspeaker",
        x: 14,
        y: 30,
        label: ["Loudspeaker box: play the message", "Caja de altavoz: escuchar el mensaje"],
        opens: { evidence: "first-report" },
      },
      {
        id: "board",
        x: 44,
        y: 44,
        label: ["Public board: read the notes", "Tablero público: leer las notas"],
        opens: { evidence: "notice-board" },
      },
      {
        id: "sign",
        x: 88,
        y: 46,
        label: ["Bent street sign: look closely", "Letrero doblado: mirar de cerca"],
        opens: { evidence: "bent-sign" },
      },
      {
        id: "okafor",
        x: 28,
        y: 74,
        label: [
          "Talk to Imani Okafor, city coordinator",
          "Hablar con Imani Okafor, coordinadora de la ciudad",
        ],
        opens: { character: "coordinator" },
      },
      {
        id: "haddad",
        x: 68,
        y: 76,
        label: ["Talk to Abel Haddad, resident", "Hablar con Abel Haddad, vecino"],
        opens: { character: "resident" },
      },
      {
        id: "clipboard",
        x: 10,
        y: 76,
        label: [
          "Coordinator's report: name the problem",
          "Informe de la coordinadora: nombrar el problema",
        ],
        opens: { task: "name-problem" },
      },
    ],
  },
  {
    id: "lab",
    art: "lab",
    title: ["Science Laboratory", "Laboratorio de Ciencias"],
    description: [
      "Screens glow along the wall. A weather station prints a thin strip of paper, and a test radio waits on the bench.",
      "Las pantallas brillan a lo largo de la pared. Una estación meteorológica imprime una tira delgada de papel, y un radio de pruebas espera en la mesa.",
    ],
    hotspots: [
      {
        id: "station",
        x: 22,
        y: 36,
        label: ["Weather station: read the record", "Estación meteorológica: leer el registro"],
        opens: { evidence: "weather-record" },
      },
      {
        id: "li",
        x: 64,
        y: 72,
        label: ["Talk to Dr. Wen Li, scientist", "Hablar con la Dra. Wen Li, científica"],
        opens: { character: "scientist" },
      },
    ],
  },
  {
    id: "newsroom",
    art: "newsroom",
    title: ["Newsroom", "Redacción"],
    description: [
      "Half-written stories hang on a line across the room. The answering machine blinks, and one long desk is marked FACT CHECK.",
      "Noticias a medio escribir cuelgan de una cuerda que cruza la sala. La contestadora parpadea, y un escritorio largo dice VERIFICACIÓN.",
    ],
    hotspots: [
      {
        id: "draft",
        x: 20,
        y: 54,
        label: ["Draft bulletin: read it", "Borrador del boletín: leerlo"],
        opens: { evidence: "bulletin" },
      },
      {
        id: "poster",
        x: 42,
        y: 26,
        label: ["Festival poster: read it", "Cartel del festival: leerlo"],
        opens: { evidence: "festival-plan" },
      },
      {
        id: "machine",
        x: 78,
        y: 40,
        label: [
          "Answering machine: play the voicemail",
          "Contestadora: escuchar el mensaje de voz",
        ],
        opens: { evidence: "voicemail" },
      },
      {
        id: "rivas",
        x: 54,
        y: 74,
        label: ["Talk to Mateo Rivas, journalist", "Hablar con Mateo Rivas, periodista"],
        opens: { character: "journalist" },
      },
      {
        id: "desk-time",
        x: 88,
        y: 76,
        label: [
          "Fact-check desk: when did the messages stop?",
          "Mesa de verificación: ¿cuándo se detuvieron los mensajes?",
        ],
        opens: { task: "compare-time" },
      },
      {
        id: "desk-load",
        x: 12,
        y: 80,
        label: [
          "Fact-check desk: was the network too busy?",
          "Mesa de verificación: ¿la red estaba demasiado ocupada?",
        ],
        opens: { task: "compare-load" },
      },
    ],
  },
  {
    id: "comms",
    art: "comms",
    title: ["Communication Center", "Centro de Comunicación"],
    description: [
      "Rows of small green lights. Every light says the equipment is working, and still nothing arrives. A clipboard hangs by the door.",
      "Filas de lucecitas verdes. Cada luz dice que el equipo funciona, y aun así no llega nada. Una tabla con hojas cuelga junto a la puerta.",
    ],
    hotspots: [
      {
        id: "terminal",
        x: 20,
        y: 42,
        label: [
          "Relay terminal: read the system log",
          "Terminal del relé: leer el registro del sistema",
        ],
        opens: { evidence: "system-log" },
      },
      {
        id: "chart",
        x: 48,
        y: 28,
        label: ["Wall screen: read the usage chart", "Pantalla de pared: leer la gráfica de uso"],
        opens: { evidence: "usage-chart" },
      },
      {
        id: "sheet",
        x: 86,
        y: 52,
        label: [
          "Clipboard: read the tower inspection sheet",
          "Tabla: leer la hoja de inspección de la torre",
        ],
        opens: { evidence: "inspection" },
      },
      {
        id: "notice",
        x: 34,
        y: 70,
        label: [
          "Printout: read the update notice",
          "Hoja impresa: leer el aviso de la actualización",
        ],
        opens: { evidence: "update-notice" },
      },
      {
        id: "nair",
        x: 64,
        y: 74,
        label: ["Talk to Priya Nair, technician", "Hablar con Priya Nair, técnica"],
        opens: { character: "technician" },
      },
      {
        id: "whiteboard",
        x: 74,
        y: 26,
        label: ["Whiteboard: did anything change at six?", "Pizarra: ¿algo cambió a las seis?"],
        opens: { task: "compare-change" },
      },
    ],
  },
  {
    id: "ops",
    art: "ops",
    title: ["Emergency Operations Room", "Sala de Operaciones de Emergencia"],
    requires: { act: "decide" },
    description: [
      "A long table, a wall map of Calder Bay and three plans laid side by side. Chief Brooks looks up as you come in with your notebook.",
      "Una mesa larga, un mapa mural de Calder Bay y tres planes puestos uno al lado del otro. La jefa Brooks levanta la vista cuando entras con tu cuaderno.",
    ],
    hotspots: [
      {
        id: "plans",
        x: 18,
        y: 54,
        label: ["Table: read the three response plans", "Mesa: leer los tres planes de respuesta"],
        opens: { evidence: "response-plans" },
      },
      {
        id: "brooks",
        x: 48,
        y: 76,
        label: [
          "Talk to Chief Dana Brooks, emergency planner",
          "Hablar con la jefa Dana Brooks, planificadora de emergencias",
        ],
        opens: { character: "planner" },
      },
      {
        id: "decision",
        x: 72,
        y: 28,
        label: [
          "Decision board: choose an explanation and a plan",
          "Tablero de decisión: elegir una explicación y un plan",
        ],
        opens: { task: "decide-cause" },
      },
      {
        id: "microphone",
        x: 34,
        y: 30,
        label: ["Briefing microphone: explain out loud", "Micrófono: explicar en voz alta"],
        opens: { task: "brief" },
      },
      {
        id: "form",
        x: 70,
        y: 56,
        label: [
          "Recommendation form: write to the city",
          "Formulario: escribir la recomendación a la ciudad",
        ],
        opens: { task: "recommend" },
      },
      {
        id: "revise",
        x: 88,
        y: 76,
        label: [
          "Marked-up copy: revise your recommendation",
          "Copia con notas: revisar tu recomendación",
        ],
        opens: { task: "revise-recommend" },
      },
      {
        id: "new-call",
        x: 12,
        y: 26,
        label: [
          "Red telephone: a new problem at River School",
          "Teléfono rojo: un problema nuevo en la Escuela River",
        ],
        opens: { task: "river-school" },
      },
    ],
  },
];

export function build(band = "6-8") {
  const b = band === "3-5" ? "3-5" : "6-8";
  return {
    schema: "lp-sim/1",
    id: ID,
    version: 1,
    band: b,
    subject: "science and society",
    title: ["The City That Stopped Talking", "La ciudad que dejó de hablar"],
    summary: [
      "One morning, every call and message in Calder Bay stops arriving. Explore the city, question six people, weigh the evidence and tell the city what to do.",
      "Una mañana, todas las llamadas y los mensajes de Calder Bay dejan de llegar. Explora la ciudad, pregunta a seis personas, pesa la evidencia y dile a la ciudad qué hacer.",
    ],
    keyUses: ["Explain", "Argue", "Inform"],
    standards: STANDARDS[b],
    objective: "explain-with-evidence",
    objectives: {
      language: [
        "I can explain what caused a problem and argue for a response, using evidence and words such as because, the evidence shows and however.",
        "Puedo explicar qué causó un problema y defender una respuesta, usando evidencia y palabras como because, the evidence shows y however.",
      ],
      content: [
        "I can compare explanations for why a system failed and choose the one the evidence supports best.",
        "Puedo comparar explicaciones de por qué falló un sistema y elegir la que la evidencia apoya mejor.",
      ],
    },
    vocabulary: [
      {
        term: "evidence",
        meaning: [
          "facts or information that show something is true",
          "hechos o información que muestran que algo es cierto",
        ],
      },
      {
        term: "explanation",
        meaning: [
          "a reason that tells why something happened",
          "una razón que dice por qué pasó algo",
        ],
      },
      {
        term: "relay",
        meaning: [
          "a machine that receives a message and passes it on",
          "una máquina que recibe un mensaje y lo pasa a otro lugar",
        ],
      },
      {
        term: "channel",
        meaning: [
          "the path a signal travels on; sender and receiver must use the same one",
          "el camino por donde viaja una señal; quien envía y quien recibe deben usar el mismo",
        ],
      },
      {
        term: "update",
        meaning: ["a change that makes software newer", "un cambio que hace más nuevo un programa"],
      },
      {
        term: "overload",
        meaning: [
          "to give a system more than it can carry",
          "darle a un sistema más de lo que puede llevar",
        ],
      },
      {
        term: "conflict",
        meaning: [
          "when two accounts cannot both be true",
          "cuando dos versiones no pueden ser ciertas a la vez",
        ],
      },
      {
        term: "recommend",
        meaning: [
          "to say what you think someone should do, with reasons",
          "decir lo que piensas que alguien debe hacer, con razones",
        ],
      },
    ],
    acts: [
      {
        id: "discover",
        title: ["Discover", "Descubrir"],
        goal: [
          "Explore City Square, hear the first report, read the notes and name the problem.",
          "Explora la Plaza, escucha el primer aviso, lee las notas y nombra el problema.",
        ],
        done: {
          all: [
            has("first-report"),
            has("notice-board"),
            talked("coordinator"),
            done("name-problem"),
          ],
        },
      },
      {
        id: "investigate",
        title: ["Investigate", "Investigar"],
        goal: [
          "Visit the city. Question people, collect evidence and compare two accounts that do not agree.",
          "Recorre la ciudad. Pregunta a las personas, reúne evidencia y compara dos versiones que no coinciden.",
        ],
        done: {
          all: [
            { evidence: 8 },
            { any: [talked("scientist"), talked("journalist"), talked("technician")] },
            { any: [done("compare-time"), done("compare-load"), done("compare-change")] },
          ],
        },
      },
      {
        id: "decide",
        title: ["Decide", "Decidir"],
        goal: [
          "Go to the Emergency Operations Room. Choose an explanation and the plan that follows from it.",
          "Ve a la Sala de Operaciones de Emergencia. Elige una explicación y el plan que sale de ella.",
        ],
        done: done("decide-cause"),
      },
      {
        id: "communicate",
        title: ["Communicate", "Comunicar"],
        goal: [
          "Explain your thinking out loud, then write your recommendation for the city.",
          "Explica tu razonamiento en voz alta y luego escribe tu recomendación para la ciudad.",
        ],
        done: { all: [done("brief"), done("recommend")] },
      },
      {
        id: "revise",
        title: ["Revise and transfer", "Revisar y transferir"],
        goal: [
          "Use the feedback to improve your recommendation. Then solve a new problem on your own.",
          "Usa los comentarios para mejorar tu recomendación. Después resuelve un problema nuevo sin ayuda.",
        ],
        done: { all: [done("revise-recommend"), done("river-school")] },
      },
    ],
    outcomeAfter: "communicate",
    start: "square",
    map: [
      { scene: "square", x: 50, y: 56 },
      { scene: "lab", x: 20, y: 28 },
      { scene: "newsroom", x: 80, y: 30 },
      { scene: "comms", x: 22, y: 80 },
      { scene: "ops", x: 80, y: 80 },
    ],
    scenes,
    characters,
    evidence,
    explanations,
    tasks: tasks(b),
    outcomes,
  };
}

// Culture & Communication Explorer (/communication): how a message changes with audience, purpose, setting,
// relationship, register and medium. Eight scenarios per grade band (3-5 and 6-8), one per theme. Checker:
// src/lang/communication-check.js. View: src/views/communication.js. Tests: tools/communication.test.mjs.
//
// Framing rule for every string: a way of communicating FITS a situation or fits a different one. No style, language,
// dialect or culture is called better, proper or correct, and no group is described as "always" talking one way.
//
// Scenario shape:
//   { id, band, theme, emoji, title: [en, es], situation: [en, es],
//     card: { audience, purpose, setting, relationship, medium: [en, es], register: "formal"|"neutral"|"informal" },
//     versions: [{ id, text (English), best?, why: [en, es], when?: [en, es] (where a non-best version WOULD fit) }],
//     shift: { change: [en, es], items: [{ part: [en, es], changes: bool, why: [en, es] }] },
//     reflect: [en, es],
//     task: { prompt: [en, es], register, medium, needs: [check ids], purposeWords, audienceWords?, academicWords?,
//             minWords, minQuestions?, maxAvg?, minAcademic?, frames: [English], words: [{ w, es }], model (English) } }
import { SCENARIOS_35A } from "./communication-35a.js";
import { SCENARIOS_35B } from "./communication-35b.js";
import { SCENARIOS_68A } from "./communication-68a.js";
import { SCENARIOS_68B } from "./communication-68b.js";

export const SCENARIOS = [...SCENARIOS_35A, ...SCENARIOS_35B, ...SCENARIOS_68A, ...SCENARIOS_68B];
export const scenariosFor = (band) => SCENARIOS.filter((s) => s.band === band);
export const scenarioById = (id) => SCENARIOS.find((s) => s.id === id) || null;

export const STEPS = [
  ["Situation", "Situación"],
  ["Compare", "Compara"],
  ["What if…?", "¿Y si…?"],
  ["Your languages", "Tus idiomas"],
  ["Your message", "Tu mensaje"],
];

/** The six things that shape a message. The order is the order of the situation card. */
export const DIALS = [
  {
    id: "audience",
    emoji: "👥",
    name: ["Audience", "Audiencia"],
    text: ["Who will read or hear it?", "¿Quién lo va a leer o escuchar?"],
  },
  {
    id: "purpose",
    emoji: "🎯",
    name: ["Purpose", "Propósito"],
    text: ["What do you want to happen?", "¿Qué quieres que pase?"],
  },
  {
    id: "setting",
    emoji: "📍",
    name: ["Setting", "Lugar"],
    text: ["Where and when is it happening?", "¿Dónde y cuándo pasa?"],
  },
  {
    id: "relationship",
    emoji: "🤝",
    name: ["Relationship", "Relación"],
    text: [
      "How well do you know each other? Who is in charge?",
      "¿Qué tan bien se conocen? ¿Quién está a cargo?",
    ],
  },
  {
    id: "register",
    emoji: "🎚️",
    name: ["Register", "Registro"],
    text: [
      "How formal or relaxed do the words need to be?",
      "¿Qué tan formales o relajadas tienen que ser las palabras?",
    ],
  },
  {
    id: "medium",
    emoji: "📨",
    name: ["Medium", "Medio"],
    text: [
      "Talking, a text, an email, a phone call or a note?",
      "¿En persona, un mensaje, un correo, una llamada o una nota?",
    ],
  },
];

export const REGISTERS = {
  formal: ["More formal", "Más formal"],
  neutral: ["In between", "Intermedio"],
  informal: ["Relaxed", "Relajado"],
};

export const THEMES = {
  school: ["School communication", "Comunicación en la escuela"],
  community: ["In the community", "En la comunidad"],
  interview: ["Interviews", "Entrevistas"],
  collab: ["Working in a group", "Trabajo en grupo"],
  digital: ["Digital messages", "Mensajes digitales"],
  audiences: ["One idea, different audiences", "Una idea, distintas audiencias"],
  perspectives: ["Understanding perspectives", "Entender puntos de vista"],
  misunderstanding: ["Fixing a misunderstanding", "Arreglar un malentendido"],
};

/** Shown on the hub and on the reflection step. */
export const PRINCIPLES = [
  [
    "There is no single right way to talk. Every language and every way of speaking you know is a strength.",
    "No hay una sola forma correcta de hablar. Cada idioma y cada forma de hablar que conoces es una fortaleza.",
  ],
  [
    "Here we ask one question: what fits this situation? A message that fits one situation can miss in another.",
    "Aquí hacemos una sola pregunta: ¿qué encaja en esta situación? Un mensaje que encaja en una situación puede no encajar en otra.",
  ],
  [
    "People in the same family or community communicate in many different ways. Your own experience counts.",
    "Las personas de una misma familia o comunidad se comunican de muchas formas diferentes. Tu propia experiencia cuenta.",
  ],
];

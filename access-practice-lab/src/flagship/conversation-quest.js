// Conversation Quest: a quest map of realistic interactions. Choose and produce lines, manage register (polite vs
// informal), clarify and repair misunderstandings; speak (speech-to-text) or type. Choices set story flags that change
// later encounters. Five encounters per band (the fifth, a reading-room negotiation, was added after launch). Content: conversation-quest-35.js, conversation-quest-68.js.
import { BAND_35 } from "./conversation-quest-35.js";
import { BAND_68 } from "./conversation-quest-68.js";

export const GAME = {
  id: "conversation-quest",
  use: "Explain",
  chapters: 5,
  icon: "conversation",
  art: ["bg-city", "char-maya"],
  title: ["Conversation Quest", "Misión de conversación"],
  tagline: [
    "Real conversations: say it politely, fix mix-ups, and see what happens next.",
    "Conversaciones reales: dilo con cortesía, arregla malentendidos y mira qué pasa después.",
  ],
  noun: ["Encounter", "Encuentro"],
  verb: ["Start the conversation", "Empezar la conversación"],
  done: ["Conversation done", "Conversación terminada"],
  related: { href: "scenarios", title: ["Real-Life Scenarios", "Situaciones de la vida real"] },
  book: "conversation-book",
  bands: { "3-5": BAND_35, "6-8": BAND_68 },
};

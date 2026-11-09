// Language City: the six buildings on the map, each with one named character who greets the learner.
// `at` is the building's centre on the map as percentages of the map's width and height (the clickable pins use it).
import { bi } from "./city-kit.js";

export const BUILDINGS = [
  {
    id: "cafe",
    name: bi("Harbor Café", "Café del Puerto"),
    blurb: bi(
      "Read a menu, order lunch and fix a mix-up.",
      "Lee un menú, pide el almuerzo y arregla una confusión.",
    ),
    at: [20, 30],
    color: "#D28B58",
    npc: {
      name: "Rosa",
      role: bi("server", "mesera"),
      look: { skin: "#c68642", hair: "#2b1b12", style: "bun", shirt: "#1FA6A2", acc: "none" },
      greet: bi(
        "Welcome to the Harbor Café! I am Rosa. Take a seat and read the menu.",
        "¡Bienvenido al Café del Puerto! Soy Rosa. Siéntate y lee el menú.",
      ),
    },
  },
  {
    id: "library",
    name: bi("Maple Street Library", "Biblioteca de la Calle Arce"),
    blurb: bi(
      "Get a card, find a book and ask for help.",
      "Saca una tarjeta, encuentra un libro y pide ayuda.",
    ),
    at: [50, 22],
    color: "#5A9481",
    npc: {
      name: "Mr. Okoye",
      role: bi("librarian", "bibliotecario"),
      look: { skin: "#5c3a21", hair: "#1b1b1b", style: "short", shirt: "#17324D", acc: "glasses" },
      greet: bi(
        "Good morning. I am Mr. Okoye. Quiet voices, please, and ask me anything.",
        "Buenos días. Soy el señor Okoye. Voces bajas, por favor, y pregúntame lo que quieras.",
      ),
    },
  },
  {
    id: "clinic",
    name: bi("Sunrise Clinic", "Clínica Amanecer"),
    blurb: bi(
      "Check in, describe how you feel and understand a label.",
      "Regístrate, describe cómo te sientes y entiende una etiqueta.",
    ),
    at: [80, 30],
    color: "#1FA6A2",
    npc: {
      name: "Nurse Amara",
      role: bi("nurse", "enfermera"),
      look: { skin: "#8d5524", hair: "#1b1b1b", style: "braids", shirt: "#e2f3f0", acc: "none" },
      greet: bi(
        "Hello, I am Nurse Amara. Tell me how I can help you today.",
        "Hola, soy la enfermera Amara. Dime cómo puedo ayudarte hoy.",
      ),
    },
  },
  {
    id: "market",
    name: bi("Corner Market", "Mercado de la Esquina"),
    blurb: bi(
      "Read prices, buy fruit and ask for a fair fix.",
      "Lee precios, compra fruta y pide un arreglo justo.",
    ),
    at: [20, 74],
    color: "#F2765A",
    npc: {
      name: "Mr. Delgado",
      role: bi("grocer", "tendero"),
      look: { skin: "#e0ac84", hair: "#2b1b12", style: "cap", shirt: "#5A9481", acc: "none" },
      greet: bi(
        "Fresh fruit today! I am Mr. Delgado. What can I get for you?",
        "¡Fruta fresca hoy! Soy el señor Delgado. ¿Qué te puedo dar?",
      ),
    },
  },
  {
    id: "school-office",
    name: bi("Lincoln School Office", "Oficina de la Escuela Lincoln"),
    blurb: bi(
      "Explain why you are late and describe what you lost.",
      "Explica por qué llegas tarde y describe lo que perdiste.",
    ),
    at: [50, 78],
    color: "#F2C15B",
    npc: {
      name: "Ms. Brooks",
      role: bi("school secretary", "secretaria de la escuela"),
      look: {
        skin: "#f1c9a5",
        hair: "#8a5a2b",
        style: "ponytail",
        shirt: "#2f6f9f",
        acc: "glasses",
      },
      greet: bi(
        "Good morning! I am Ms. Brooks. The office is where we solve problems.",
        "¡Buenos días! Soy la señora Brooks. La oficina es donde resolvemos problemas.",
      ),
    },
  },
  {
    id: "station",
    name: bi("Central Station", "Estación Central"),
    blurb: bi(
      "Read a schedule, hear an announcement and buy a pass.",
      "Lee un horario, escucha un anuncio y compra un pase.",
    ),
    at: [80, 74],
    color: "#17324D",
    npc: {
      name: "Ms. Tran",
      role: bi("transit agent", "agente de transporte"),
      look: {
        skin: "#f5d5b8",
        hair: "#1b1b1b",
        style: "long",
        shirt: "#F2C15B",
        acc: "headphones",
      },
      greet: bi(
        "Welcome to Central Station. I am Ms. Tran. Where are you going today?",
        "Bienvenido a la Estación Central. Soy la señora Tran. ¿A dónde vas hoy?",
      ),
    },
  },
];

export const buildingOf = (id) => BUILDINGS.find((b) => b.id === id) || null;

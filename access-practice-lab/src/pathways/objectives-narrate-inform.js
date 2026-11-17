// Skill graph objectives: Narrate and Inform (data only; graph.js adds the shared fields and validates every reference).
import { P, acc, book, dest, spk, wrt } from "./refs.js";

export const NARRATE_INFORM = [
  {
    id: "narrate-events-in-order",
    keyUse: "Narrate",
    standards: ["ELD-LA", "ELD-SI"],
    skills: [
      "reading.sequence",
      "listening.sequence",
      "speaking.organization",
      "writing.organization",
    ],
    title: P("Tell what happened in order", "Contar lo que pasó en orden"),
    student: P(
      "I can tell what happened first, next and last so someone can follow it.",
      "Puedo contar qué pasó primero, después y al final para que alguien pueda seguirlo.",
    ),
    features: {
      discourse: P(
        "Say who, where and when; tell the events in order; end with how it worked out.",
        "Di quién, dónde y cuándo; cuenta los hechos en orden; termina con cómo resultó.",
      ),
      sentence: P(
        "Use past-tense sentences and join events with time words.",
        "Usa oraciones en pasado y une los hechos con palabras de tiempo.",
      ),
      word: P(
        "Use time words: first, then, after that, finally.",
        "Usa palabras de tiempo: first, then, after that, finally.",
      ),
    },
    activities: [
      acc("6-8", "Reading", "B", "v10-r-b-sequence-events"),
      acc("6-8", "Reading", "A", "rv5-school-garden-2"),
      acc("3-5", "Reading", "A", "g35-r2-a-rain-order"),
      acc("6-8", "Listening", "C", "68c-l-narrator-attitude"),
      acc("3-5", "Listening", "A", "g35-l-a-lost-mitten"),
      spk("spk-slideshow-retell"),
      spk("spk-seedlings-retell"),
      acc("3-5", "Speaking", "B", "g35-s2-b-retell-story"),
      { ...spk("spk35-puppy-retell"), band: "3-5" },
      { ...spk("spk35-butterfly-retell"), band: "3-5" },
      wrt("wrt-missed-bus-narrative"),
      wrt("wrt-first-day-narrative"),
      acc("3-5", "Writing", "B", "g35-w2-b-narrative-power"),
      book("personal-narrative"),
    ],
    needs: [
      {
        id: "link-ideas",
        sign: P("tells events with no time words", "cuenta los hechos sin palabras de tiempo"),
        activity: "sspk-seedlings-retell",
      },
      {
        id: "find-evidence",
        sign: P(
          "loses the order of events when reading",
          "pierde el orden de los hechos al leer",
        ),
        activity: "rrv5-school-garden-2",
      },
    ],
    transfer: [
      {
        id: "my-morning",
        prompt: P(
          "Tell what happened this morning from the time you woke up until you got to school. Tell it in order and say how it ended.",
          "Cuenta lo que pasó esta mañana desde que despertaste hasta que llegaste a la escuela. Cuéntalo en orden y di cómo terminó.",
        ),
      },
    ],
    frames: [
      P("First, ___.", "Primero, ___."),
      P("After that, ___.", "Después de eso, ___."),
      P("In the end, ___.", "Al final, ___."),
    ],
    talk: [
      P(
        "Tell me about your day from the start. What happened first?",
        "Cuéntame tu día desde el principio. ¿Qué pasó primero?",
      ),
      P(
        "Tell me a story about when you were little. I will ask: and then?",
        "Cuéntame una historia de cuando eras pequeño. Yo preguntaré: ¿y después?",
      ),
      P(
        "Let’s tell a family story together, one part each, in order.",
        "Contemos juntos una historia de la familia, una parte cada uno, en orden.",
      ),
    ],
    stretch: "wwrt-first-day-narrative",
  },
  {
    id: "inform-main-idea-details",
    keyUse: "Inform",
    standards: ["ELD-LA", "ELD-SI"],
    skills: [
      "reading.main-idea",
      "reading.main-detail",
      "listening.main-idea",
      "speaking.details",
      "writing.central-idea",
    ],
    title: P("Give the main idea and the details", "Dar la idea principal y los detalles"),
    student: P(
      "I can say the main idea of a topic and give details that belong to it.",
      "Puedo decir la idea principal de un tema y dar detalles que pertenecen a ella.",
    ),
    features: {
      discourse: P(
        "Name the topic, say the main idea, add details, close with the main point.",
        "Nombra el tema, di la idea principal, agrega detalles y cierra con el punto principal.",
      ),
      sentence: P(
        "Add a detail to a sentence with for example, such as or also.",
        "Agrega un detalle a una oración con for example, such as o also.",
      ),
      word: P(
        "Use the topic’s own words, not this or that thing.",
        "Usa las palabras del tema, no esta cosa o esa cosa.",
      ),
    },
    activities: [
      acc("6-8", "Reading", "A", "read-main-idea"),
      acc("6-8", "Reading", "C", "68c-r-coral-bleaching-main-idea"),
      acc("3-5", "Reading", "B", "g35-r2-b-matter-main"),
      acc("6-8", "Listening", "B", "main-idea-match-b"),
      acc("6-8", "Listening", "B", "v7-list-b-ecosystem"),
      acc("3-5", "Listening", "B", "g35-l-b-recycle-day"),
      spk("spk-rainfall-describe"),
      acc("3-5", "Speaking", "C", "g35-s2-c-plant-table"),
      { ...spk("spk35-weather-describe"), band: "3-5" },
      wrt("wrt-garden-summary"),
      acc("3-5", "Writing", "B", "g35-w2-b-summary-monarch"),
      dest("wordlab"),
      book("informational-report"),
    ],
    needs: [
      {
        id: "find-evidence",
        sign: P(
          "picks a small detail as the main idea",
          "elige un detalle pequeño como idea principal",
        ),
        activity: "r68c-r-coral-bleaching-main-idea",
      },
      {
        id: "precise-words",
        sign: P("uses few of the topic’s own words", "usa pocas palabras propias del tema"),
        activity: "dwordlab",
      },
    ],
    transfer: [
      {
        id: "my-place",
        prompt: P(
          "Inform a visitor about a place you know well (a park, a store, your school). Say the main idea and give three details.",
          "Informa a un visitante sobre un lugar que conoces bien (un parque, una tienda, tu escuela). Di la idea principal y da tres detalles.",
        ),
      },
    ],
    frames: [
      P("The main idea is ___.", "La idea principal es ___."),
      P("For example, ___.", "Por ejemplo, ___."),
      P("Also, ___.", "También, ___."),
    ],
    talk: [
      P(
        "Tell me about something you learned today. What is the most important part?",
        "Cuéntame algo que aprendiste hoy. ¿Cuál es la parte más importante?",
      ),
      P("Give me two details about it.", "Dame dos detalles sobre eso."),
      P(
        "I will describe a place we know. You tell me the main idea.",
        "Yo describo un lugar que conocemos. Tú me dices la idea principal.",
      ),
    ],
    stretch: "wwrt-garden-summary",
  },
  {
    id: "inform-compare",
    keyUse: "Inform",
    standards: ["ELD-LA", "ELD-SI"],
    skills: [
      "reading.compare-sources",
      "listening.comparisons",
      "speaking.organization",
      "writing.organization",
    ],
    title: P("Compare two things", "Comparar dos cosas"),
    student: P(
      "I can say how two things are alike and how they are different.",
      "Puedo decir en qué se parecen y en qué son diferentes dos cosas.",
    ),
    features: {
      discourse: P(
        "Name both things, tell what is the same, tell what is different, close.",
        "Nombra las dos cosas, di qué es igual, di qué es diferente y cierra.",
      ),
      sentence: P(
        "Compare in one sentence with both, but, while or whereas.",
        "Compara en una oración con both, but, while o whereas.",
      ),
      word: P(
        "Use comparing words: similar, different, more than, less than.",
        "Usa palabras para comparar: similar, different, more than, less than.",
      ),
    },
    activities: [
      acc("6-8", "Reading", "B", "v10-r-b-compare-texts"),
      acc("6-8", "Reading", "C", "68c-r-erie-canal-two-texts"),
      acc("3-5", "Reading", "C", "g35-r-c-desert-rainforest"),
      acc("6-8", "Listening", "C", "v3-l-c-1"),
      acc("3-5", "Listening", "B", "g35-l-b-team-vote"),
      spk("spk-habitats-compare"),
      acc("3-5", "Speaking", "B", "g35-s-b-compare-pets"),
      { ...spk("spk35-frogs-compare"), band: "3-5" },
      acc("6-8", "Writing", "B", "v10-w-b-compare-write"),
      acc("6-8", "Writing", "C", "68c-w-athens-sparta-compare"),
      acc("3-5", "Writing", "C", "g35-w-c-compare-habitats"),
      dest("sentences", "Writing"),
      book("compare-contrast"),
    ],
    needs: [
      {
        id: "link-ideas",
        sign: P(
          "describes each thing alone and never compares them",
          "describe cada cosa por separado y nunca las compara",
        ),
        activity: "dsentences",
      },
      {
        id: "find-evidence",
        sign: P("misses what two texts share", "no encuentra lo que dos textos tienen en común"),
        activity: "rv10-r-b-compare-texts",
      },
    ],
    transfer: [
      {
        id: "two-ways",
        prompt: P(
          "Compare two ways to get to school (for example, walking and riding the bus). Tell one way they are alike and two ways they are different.",
          "Compara dos maneras de llegar a la escuela (por ejemplo, caminar y tomar el autobús). Di una cosa en que se parecen y dos en que son diferentes.",
        ),
      },
    ],
    frames: [
      P("Both ___ and ___ are ___.", "Tanto ___ como ___ son ___."),
      P("___ is ___, but ___ is ___.", "___ es ___, pero ___ es ___."),
    ],
    talk: [
      P(
        "How are our home and school alike? How are they different?",
        "¿En qué se parecen nuestra casa y la escuela? ¿En qué son diferentes?",
      ),
      P(
        "Pick two foods. Which is sweeter? Which takes longer to make?",
        "Elige dos comidas. ¿Cuál es más dulce? ¿Cuál tarda más en prepararse?",
      ),
      P("Compare today’s weather with yesterday’s.", "Compara el clima de hoy con el de ayer."),
    ],
    stretch: "r68c-w-athens-sparta-compare",
  },
];

// Skill graph objectives: the three Explain objectives (data only; graph.js adds the shared fields and validates every reference).
import { P, SIM_MISSION, acc, book, dest, sim, spk, wrt } from "./refs.js";

export const EXPLAIN = [
  {
    id: "explain-with-evidence",
    keyUse: "Explain",
    standards: ["ELD-SC", "ELD-SS", "ELD-SI"],
    skills: [
      "reading.evidence",
      "reading.explain-evidence",
      "speaking.evidence",
      "speaking.reasoning",
      "writing.evidence",
      "writing.explain-evidence",
    ],
    title: P("Explain an idea using evidence", "Explicar una idea con evidencia"),
    student: P(
      "I can explain an idea and point to the evidence that shows it is true.",
      "Puedo explicar una idea y señalar la evidencia que muestra que es verdad.",
    ),
    features: {
      discourse: P(
        "Say the idea, give the evidence, then tell how the evidence shows the idea.",
        "Di la idea, da la evidencia y luego explica cómo la evidencia muestra la idea.",
      ),
      sentence: P(
        "Join the idea and the evidence in one sentence with because, so or this shows that.",
        "Une la idea y la evidencia en una oración con because, so o this shows that.",
      ),
      word: P(
        "Name the source and use exact words from it: according to, the data, the text says.",
        "Nombra la fuente y usa palabras exactas de ella: according to, the data, the text says.",
      ),
    },
    activities: [
      acc("6-8", "Reading", "B", "read-best-evidence"),
      acc("6-8", "Reading", "B", "v10-r-b-evidence-hot"),
      acc("6-8", "Reading", "B", "v7-read-b-monarch-evidence"),
      acc("3-5", "Reading", "B", "g35-r2-b-mei-proof"),
      acc("3-5", "Reading", "C", "g35-r2-c-maps-key"),
      acc("6-8", "Listening", "B", "lst-v11-b-evidence-explain"),
      acc("6-8", "Listening", "C", "68c-l-strongest-evidence"),
      acc("3-5", "Listening", "C", "g35-l-c-buddy-bench"),
      spk("spk-evaporation-explain"),
      spk("spk-chicago-explain"),
      spk("spk-icemelt-discuss"),
      acc("3-5", "Speaking", "C", "g35-s-c-ice-melt"),
      { ...spk("spk35-icewrap-explain"), band: "3-5" },
      wrt("wrt-mulch-cer"),
      wrt("wrt-heat-island-essay"),
      acc("6-8", "Writing", "B", "v10-w-b-explain-evidence"),
      acc("3-5", "Writing", "C", "g35-w-c-explain-experiment"),
      sim(SIM_MISSION),
      dest("evidence", "Writing"),
      dest("language-labs"),
      dest("wordlab"),
      book("evidence-argument"),
      book("science-investigation"),
    ],
    needs: [
      {
        id: "cite-source",
        sign: P(
          "explains with a reason but does not point to the source",
          "explica con una razón pero no señala la fuente",
        ),
        activity: "devidence",
      },
      {
        id: "link-ideas",
        sign: P(
          "gives the idea and the evidence but does not join them",
          "da la idea y la evidencia pero no las une",
        ),
        activity: "dlanguage-labs",
      },
      {
        id: "find-evidence",
        sign: P(
          "has trouble choosing the sentence that proves the idea",
          "tiene dificultad para elegir la oración que prueba la idea",
        ),
        activity: "rv10-r-b-evidence-hot",
      },
    ],
    transfer: [
      {
        id: "plant-window",
        prompt: P(
          "A class put one plant by the window and one in a closet. After two weeks the window plant was 14 cm tall and the closet plant was 6 cm tall. Explain what the plants need. Use the numbers as your evidence.",
          "Una clase puso una planta junto a la ventana y otra en un armario. Después de dos semanas, la planta de la ventana medía 14 cm y la del armario 6 cm. Explica qué necesitan las plantas. Usa los números como evidencia.",
        ),
      },
      {
        id: "bus-late",
        prompt: P(
          "The school bus was late 2 days in dry weeks and 9 days in rainy weeks. Explain why the bus is late more often. Point to the numbers.",
          "El autobús escolar llegó tarde 2 días en semanas secas y 9 días en semanas de lluvia. Explica por qué el autobús llega tarde más seguido. Señala los números.",
        ),
      },
    ],
    frames: [
      P("The idea is that ___.", "La idea es que ___."),
      P("The evidence is ___.", "La evidencia es ___."),
      P("This shows that ___ because ___.", "Esto muestra que ___ porque ___."),
    ],
    talk: [
      P(
        "Tell me one thing you think is true about our home or our street. How do you know?",
        "Dime una cosa que crees que es verdad sobre nuestra casa o nuestra calle. ¿Cómo lo sabes?",
      ),
      P(
        "Let’s look at something together (a receipt, the weather, a photo). What does it show? Which part tells you that?",
        "Miremos algo juntos (un recibo, el clima, una foto). ¿Qué muestra? ¿Qué parte te lo dice?",
      ),
      P(
        "I will say an idea. You tell me what evidence would prove it.",
        "Yo digo una idea. Tú me dices qué evidencia la probaría.",
      ),
    ],
    stretch: "wwrt-heat-island-essay",
  },
  {
    id: "explain-cause-effect",
    keyUse: "Explain",
    standards: ["ELD-SC", "ELD-SS", "ELD-SI"],
    skills: [
      "reading.cause-effect",
      "listening.cause-effect",
      "speaking.reasoning",
      "writing.explain-evidence",
    ],
    title: P("Explain why something happened", "Explicar por qué pasó algo"),
    student: P(
      "I can tell what happened and what caused it.",
      "Puedo decir qué pasó y qué lo causó.",
    ),
    features: {
      discourse: P(
        "Say what happened, then the cause, then the result.",
        "Di qué pasó, luego la causa y luego el resultado.",
      ),
      sentence: P(
        "Put the cause and the effect in one sentence: because, so, as a result.",
        "Pon la causa y el efecto en una oración: because, so, as a result.",
      ),
      word: P(
        "Use cause words: causes, leads to, due to, therefore.",
        "Usa palabras de causa: causes, leads to, due to, therefore.",
      ),
    },
    activities: [
      acc("6-8", "Reading", "B", "read-cause-effect"),
      acc("6-8", "Reading", "B", "rv5-sort-cause-effect"),
      acc("6-8", "Reading", "C", "68c-r-wetland-water-filter"),
      acc("3-5", "Reading", "B", "g35-r-b-bats"),
      acc("6-8", "Listening", "B", "exit-ticket-b"),
      acc("6-8", "Listening", "C", "68c-l-sea-breeze-cause"),
      acc("3-5", "Listening", "B", "g35-l-b-muddy-field"),
      spk("spk-icemelt-discuss"),
      acc("6-8", "Speaking", "C", "68c-s-erosion-cause-effect"),
      acc("3-5", "Speaking", "B", "g35-s-b-plant-experiment"),
      { ...spk("spk35-shadow-explain"), band: "3-5" },
      wrt("wrt-dust-bowl-cer"),
      acc("6-8", "Writing", "C", "68c-w-mesopotamia-connectors"),
      acc("3-5", "Writing", "B", "g35-w-b-cloze-linking"),
      dest("language-labs"),
      dest("sentences", "Writing"),
      book("cause-effect"),
    ],
    needs: [
      {
        id: "link-ideas",
        sign: P(
          "names the cause and the effect in separate sentences with no link",
          "nombra la causa y el efecto en oraciones separadas sin unirlas",
        ),
        activity: "dsentences",
      },
      {
        id: "find-evidence",
        sign: P(
          "mixes up the cause and the effect when reading or listening",
          "confunde la causa y el efecto al leer o escuchar",
        ),
        activity: "rrv5-sort-cause-effect",
      },
    ],
    transfer: [
      {
        id: "puddle",
        prompt: P(
          "In the morning there was a puddle on the playground. By the afternoon it was gone. Explain why. Tell the cause and the effect.",
          "Por la mañana había un charco en el patio. Por la tarde ya no estaba. Explica por qué. Di la causa y el efecto.",
        ),
      },
    ],
    frames: [
      P("___ happened because ___.", "___ pasó porque ___."),
      P("As a result, ___.", "Como resultado, ___."),
    ],
    talk: [
      P(
        "Tell me about something that changed today. What made it change?",
        "Cuéntame algo que cambió hoy. ¿Qué lo hizo cambiar?",
      ),
      P(
        "If we forget to water the plant, what happens? Why?",
        "Si olvidamos regar la planta, ¿qué pasa? ¿Por qué?",
      ),
      P(
        "I will say what happened. You tell me a possible cause.",
        "Yo digo qué pasó. Tú me dices una causa posible.",
      ),
    ],
    stretch: "wwrt-dust-bowl-cer",
  },
  {
    id: "explain-process-steps",
    keyUse: "Explain",
    standards: ["ELD-SC", "ELD-MA", "ELD-SI"],
    skills: [
      "reading.sequence",
      "listening.sequence",
      "speaking.organization",
      "writing.organization",
    ],
    title: P(
      "Explain how something works, step by step",
      "Explicar cómo funciona algo, paso a paso",
    ),
    student: P(
      "I can explain the steps of a process in order and say why each step matters.",
      "Puedo explicar los pasos de un proceso en orden y decir por qué importa cada paso.",
    ),
    features: {
      discourse: P(
        "Name the process, give the steps in order, end with the result.",
        "Nombra el proceso, da los pasos en orden y termina con el resultado.",
      ),
      sentence: P(
        "Start steps with order words and add why: first … so that …",
        "Empieza los pasos con palabras de orden y agrega por qué: first … so that …",
      ),
      word: P("Use exact action words for each step.", "Usa verbos exactos para cada paso."),
    },
    activities: [
      acc("6-8", "Reading", "B", "v7-read-b-volcano-order"),
      acc("6-8", "Reading", "B", "rv5-info-volcano-2"),
      acc("3-5", "Reading", "B", "g35-r-b-bean-seed"),
      acc("6-8", "Listening", "B", "v7-list-b-watercycle"),
      acc("6-8", "Listening", "B", "lv5-experiment-order"),
      acc("3-5", "Listening", "A", "g35-l2-a-fire-drill"),
      spk("spk-recipe-explain"),
      acc("6-8", "Speaking", "B", "sv5-explain-water-cycle"),
      acc("3-5", "Speaking", "B", "g35-s2-b-handwash-process"),
      acc("6-8", "Writing", "C", "68c-w-water-cycle-process"),
      acc("3-5", "Writing", "B", "g35-w-b-water-cycle"),
      dest("sentences", "Writing"),
      book("how-to"),
    ],
    needs: [
      {
        id: "link-ideas",
        sign: P("lists steps without order words", "enumera pasos sin palabras de orden"),
        activity: "dsentences",
      },
      {
        id: "find-evidence",
        sign: P(
          "puts steps in the wrong order when reading or listening",
          "pone los pasos en el orden equivocado al leer o escuchar",
        ),
        activity: "rrv5-info-volcano-2",
      },
    ],
    transfer: [
      {
        id: "teach-a-step",
        prompt: P(
          "Explain to a new student how to do something you know well (for example, how to check out a library book). Give the steps in order and say why one step matters.",
          "Explícale a un estudiante nuevo cómo hacer algo que conoces bien (por ejemplo, cómo sacar un libro de la biblioteca). Da los pasos en orden y di por qué importa un paso.",
        ),
      },
    ],
    frames: [
      P("First, ___. Next, ___. Finally, ___.", "Primero, ___. Luego, ___. Por último, ___."),
      P("This step matters because ___.", "Este paso importa porque ___."),
    ],
    talk: [
      P(
        "Teach me how to make something you like to eat. What comes first?",
        "Enséñame a preparar algo que te gusta comer. ¿Qué va primero?",
      ),
      P("What would happen if we skipped one step?", "¿Qué pasaría si saltáramos un paso?"),
      P(
        "Let’s explain our morning in order, one step each.",
        "Expliquemos nuestra mañana en orden, un paso cada uno.",
      ),
    ],
    stretch: "r68c-w-water-cycle-process",
  },
];

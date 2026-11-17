// THE CITY THAT STOPPED TALKING: tasks and outcomes (original content). Wording differs by grade band only where a
// younger learner needs a shorter ask; the structure, ids and rules are the same for both bands.
// The four outcomes are story consequences, never grades. Which one happens depends on the decision AND the evidence
// cited for it AND a conflict the learner settled, so one multiple-choice pick alone never decides the ending.
const has = (id) => ({ has: id });

export function tasks(band) {
  const young = band === "3-5";
  return [
    {
      id: "name-problem",
      type: "decide",
      scene: "square",
      keyUse: "Inform",
      domain: "Reading",
      requires: { all: [has("first-report"), has("notice-board")] },
      prompt: [
        "Ms. Okafor needs one sentence for her report. What is the problem? Choose the statement and mark the evidence that shows it.",
        "La Sra. Okafor necesita una oración para su informe. ¿Cuál es el problema? Elige el enunciado y marca la evidencia que lo muestra.",
      ],
      options: [
        {
          id: "citywide",
          label: [
            "Since about 6:00 a.m., messages are sent but do not arrive, all over the city.",
            "Desde cerca de las 6:00 a. m., los mensajes se envían pero no llegan, en toda la ciudad.",
          ],
          sets: { problem: "citywide" },
          reply: [
            "That matches the reports from all four neighborhoods. I will write it down just like that.",
            "Eso coincide con los avisos de los cuatro barrios. Lo voy a escribir tal cual.",
          ],
        },
        {
          id: "one-street",
          label: [
            "One street lost its phone signal during the night.",
            "Una calle perdió la señal de teléfono durante la noche.",
          ],
          sets: { problem: "one-street" },
          reply: [
            "I will note your idea. The board shows four neighborhoods and phones that still have a signal, so my report will say the problem is city-wide and began near six.",
            "Anoto tu idea. El tablero muestra cuatro barrios y teléfonos que todavía tienen señal, así que mi informe dirá que el problema es de toda la ciudad y empezó cerca de las seis.",
          ],
        },
        {
          id: "people-silent",
          label: [
            "People in the city decided to stop talking to each other.",
            "La gente de la ciudad decidió dejar de hablarse.",
          ],
          sets: { problem: "people-silent" },
          reply: [
            "I will note your idea. People are leaving notes and checking on neighbors, so they do want to talk. My report will say the messages are not being delivered.",
            "Anoto tu idea. La gente deja notas y visita a sus vecinos, así que sí quiere hablar. Mi informe dirá que los mensajes no se están entregando.",
          ],
        },
      ],
    },
    {
      id: "compare-time",
      type: "compare",
      scene: "newsroom",
      keyUse: "Argue",
      domain: "Reading",
      requires: { all: [has("storm-memory"), { any: [has("system-log"), has("voicemail")] }] },
      prompt: [
        "When did the messages really stop? Put two accounts side by side.",
        "¿Cuándo se detuvieron de verdad los mensajes? Pon dos versiones una al lado de la otra.",
      ],
      pairs: [
        ["storm-memory", "system-log"],
        ["storm-memory", "voicemail"],
      ],
    },
    {
      id: "compare-load",
      type: "compare",
      scene: "newsroom",
      keyUse: "Argue",
      domain: "Reading",
      requires: { all: [has("usage-chart"), { any: [has("bulletin"), has("crowd-tip")] }] },
      prompt: [
        "Was the network too busy? Put two accounts side by side.",
        "¿La red estaba demasiado ocupada? Pon dos versiones una al lado de la otra.",
      ],
      pairs: [
        ["bulletin", "usage-chart"],
        ["crowd-tip", "usage-chart"],
      ],
    },
    {
      id: "compare-change",
      type: "compare",
      scene: "comms",
      keyUse: "Argue",
      domain: "Reading",
      requires: {
        any: [
          { all: [has("no-change"), has("system-log")] },
          { all: [has("update-notice"), has("channel-test")] },
        ],
      },
      prompt: [
        "Did anything change at six? Put two accounts side by side.",
        "¿Algo cambió a las seis? Pon dos versiones una al lado de la otra.",
      ],
      pairs: [
        ["no-change", "system-log"],
        ["update-notice", "channel-test"],
      ],
    },
    {
      id: "decide-cause",
      type: "decide",
      scene: "ops",
      keyUse: "Argue",
      domain: "Reading",
      requires: { act: "decide" },
      prompt: [
        "Chief Brooks asks: which explanation do you choose, and which plan follows from it? Mark the evidence you will stand on. This decision is made once.",
        "La jefa Brooks pregunta: ¿qué explicación eliges y qué plan sale de ella? Marca la evidencia en la que te apoyas. Esta decisión se toma una sola vez.",
      ],
      options: [
        {
          id: "fix-tower",
          explanation: "storm",
          label: [
            "The storm damaged the tower. Plan A: send the repair crew up Harbor Hill.",
            "La tormenta dañó la torre. Plan A: enviar al equipo de reparación a Harbor Hill.",
          ],
          sets: { plan: "a" },
        },
        {
          id: "reset-relay",
          explanation: "update",
          label: [
            "The 6:00 update changed the relay's channel. Plan B: set the relay back to channel 7.",
            "La actualización de las 6:00 cambió el canal del relé. Plan B: regresar el relé al canal 7.",
          ],
          sets: { plan: "b" },
        },
        {
          id: "limit-use",
          explanation: "overload",
          label: [
            "The network is overloaded. Plan C: ask everyone to stay off it this morning.",
            "La red está sobrecargada. Plan C: pedir a todos que no la usen esta mañana.",
          ],
          sets: { plan: "c" },
        },
      ],
    },
    {
      id: "brief",
      type: "speak",
      scene: "ops",
      keyUse: "Explain",
      domain: "Speaking",
      requires: { done: "decide-cause" },
      minWords: young ? 12 : 20,
      prompt: young
        ? [
            "Tell Chief Brooks out loud: what happened in Calder Bay, and why do you think so? Use one piece of evidence.",
            "Dile a la jefa Brooks en voz alta: ¿qué pasó en Calder Bay y por qué lo piensas? Usa una evidencia.",
          ]
        : [
            "Brief Chief Brooks out loud: explain what caused the failure, step by step, and name the evidence that shows each step.",
            "Informa a la jefa Brooks en voz alta: explica qué causó la falla, paso a paso, y nombra la evidencia que muestra cada paso.",
          ],
      bank: ["because", "so", "at six o'clock", "the log shows", "as a result", "this means"],
      frames: [
        ["At ___, ___ happened.", "A las ___, pasó ___."],
        ["This caused ___ because ___.", "Esto causó ___ porque ___."],
        ["The evidence for this is ___.", "La evidencia de esto es ___."],
      ],
    },
    {
      id: "recommend",
      type: "write",
      scene: "ops",
      keyUse: "Argue",
      domain: "Writing",
      requires: { done: "decide-cause" },
      minWords: young ? 20 : 35,
      prompt: young
        ? [
            "Write your recommendation for the city. Say what the city should do, give two pieces of evidence, and say why another idea is weaker.",
            "Escribe tu recomendación para la ciudad. Di qué debe hacer la ciudad, da dos evidencias y explica por qué otra idea es más débil.",
          ]
        : [
            "Write your recommendation for the city. State the response you recommend, support it with at least two pieces of evidence, and answer one explanation that someone else might prefer.",
            "Escribe tu recomendación para la ciudad. Di qué respuesta recomiendas, apóyala con al menos dos evidencias y responde a una explicación que otra persona podría preferir.",
          ],
      bank: [
        "I recommend",
        "the evidence shows",
        "for example",
        "however",
        "although",
        "therefore",
        "this is stronger because",
      ],
      frames: [
        ["I recommend that the city ___.", "Recomiendo que la ciudad ___."],
        [
          "The evidence shows ___. For example, ___.",
          "La evidencia muestra ___. Por ejemplo, ___.",
        ],
        [
          "Some people think ___. However, ___.",
          "Algunas personas piensan que ___. Sin embargo, ___.",
        ],
      ],
    },
    {
      id: "revise-recommend",
      type: "revise",
      of: "recommend",
      scene: "ops",
      keyUse: "Argue",
      domain: "Writing",
      requires: { act: "revise" },
      minWords: young ? 20 : 35,
      prompt: [
        "Other cities will read your recommendation. Read the feedback, then improve it: keep what works and change at least one thing.",
        "Otras ciudades van a leer tu recomendación. Lee los comentarios y luego mejórala: conserva lo que funciona y cambia por lo menos una cosa.",
      ],
      bank: [
        "in addition",
        "this matters because",
        "the strongest evidence is",
        "however",
        "as a result",
      ],
      frames: [
        [
          "The strongest evidence is ___ because ___.",
          "La evidencia más fuerte es ___ porque ___.",
        ],
        [
          "One thing that does not fit is ___. This can be explained by ___.",
          "Algo que no encaja es ___. Esto se puede explicar con ___.",
        ],
      ],
    },
    {
      id: "river-school",
      type: "transfer",
      of: "recommend",
      scene: "ops",
      keyUse: "Explain",
      domain: "Writing",
      requires: { done: "revise-recommend" },
      minWords: young ? 15 : 25,
      prompt: young
        ? [
            "A new call, and this one is yours alone. At River School the hallway speakers went silent at 8:00. The custodian says rain got into them. The office log says a new bell file was loaded at 8:00. The gym speaker, on an older box, still works. Explain what most likely happened and why.",
            "Una llamada nueva, y esta la resuelves sin ayuda. En la Escuela River los altavoces del pasillo se callaron a las 8:00. El conserje dice que les entró lluvia. El registro de la oficina dice que a las 8:00 se cargó un archivo nuevo de timbres. El altavoz del gimnasio, que está en una caja más vieja, todavía funciona. Explica qué pasó más probablemente y por qué.",
          ]
        : [
            "A new call, and this one is yours alone. At River School the hallway speakers went silent at 8:00. The custodian says rain got into them. The office log shows a new bell-schedule file was loaded at 8:00. The gym speaker, which runs on an older control box, still works. Explain the most likely cause, the evidence for it, and what would make you more sure.",
            "Una llamada nueva, y esta la resuelves sin ayuda. En la Escuela River los altavoces del pasillo se callaron a las 8:00. El conserje dice que les entró lluvia. El registro de la oficina muestra que a las 8:00 se cargó un archivo nuevo de horarios de timbre. El altavoz del gimnasio, que funciona con una caja de control más vieja, todavía funciona. Explica la causa más probable, la evidencia que la apoya y qué te daría más seguridad.",
          ],
    },
  ];
}

const settled = { any: [{ resolved: "compare-time" }, { resolved: "compare-change" }] };

export const outcomes = [
  {
    id: "restored",
    when: {
      all: [
        { chose: ["decide-cause", "reset-relay"] },
        { support: ["decide-cause", 2] },
        { strong: ["decide-cause", 1] },
        settled,
      ],
    },
    title: ["The city finds its voice", "La ciudad recupera su voz"],
    text: [
      "Chief Brooks reads your evidence twice and signs Plan B. Ms. Nair sets the relay back to channel 7. Twenty minutes later, 3,900 waiting messages arrive at once, and a ferry pilot named Samira finally answers her father. Because you had also settled the accounts that did not agree, nobody argued about the storm. The software company is told to test its next update first.",
      "La jefa Brooks lee tu evidencia dos veces y firma el Plan B. La Sra. Nair regresa el relé al canal 7. Veinte minutos después, 3,900 mensajes en espera llegan de una vez, y una piloto de ferry llamada Samira por fin le responde a su papá. Como también habías aclarado las versiones que no coincidían, nadie discutió sobre la tormenta. A la empresa de software se le pide que pruebe primero su próxima actualización.",
    ],
  },
  {
    id: "one-neighborhood",
    when: { chose: ["decide-cause", "reset-relay"] },
    title: ["A careful first step", "Un primer paso con cuidado"],
    text: [
      "Chief Brooks thinks your explanation fits, but a question is still open at the table, and she will not restart the whole city on it. She signs a test: the relay is set back for Northgate only. Messages arrive there within the hour. The other neighborhoods wait while Dr. Li and Ms. Nair gather the measurements the room was missing. By afternoon the whole city is back. Chief Brooks asks what you would bring next time.",
      "La jefa Brooks piensa que tu explicación encaja, pero todavía queda una pregunta abierta en la mesa, y no va a reiniciar toda la ciudad con eso. Firma una prueba: el relé se regresa solo para Northgate. Los mensajes llegan allí en menos de una hora. Los otros barrios esperan mientras la Dra. Li y la Sra. Nair reúnen las mediciones que faltaban en la sala. Por la tarde, toda la ciudad está de vuelta. La jefa Brooks te pregunta qué traerías la próxima vez.",
    ],
  },
  {
    id: "tower-climb",
    when: { chose: ["decide-cause", "fix-tower"] },
    title: ["A long climb up Harbor Hill", "Una subida larga a Harbor Hill"],
    text: [
      "The repair crew climbs the tower. They find the antenna whole and the signal light green, just as the inspection sheet said. The morning is gone, and the storm branches are still in the streets. The city manages: loudspeaker trucks carry news, and neighbors carry messages by hand. In the afternoon Ms. Nair looks at the relay log again and finds the changed channel. Chief Brooks thanks the crew, and asks everyone to look at what does not fit before the next decision.",
      "El equipo de reparación sube a la torre. Encuentra la antena entera y la luz de señal verde, tal como decía la hoja de inspección. La mañana se fue, y las ramas de la tormenta siguen en las calles. La ciudad se las arregla: camiones con altavoces llevan las noticias y los vecinos llevan mensajes en persona. Por la tarde, la Sra. Nair revisa otra vez el registro del relé y encuentra el canal cambiado. La jefa Brooks agradece al equipo y pide a todos mirar lo que no encaja antes de la próxima decisión.",
    ],
  },
  {
    id: "quiet-morning",
    title: ["A quiet morning that changes nothing", "Una mañana callada que no cambia nada"],
    text: [
      "Loudspeaker trucks ask everyone to stay off the network. People put their phones away. At noon the network is almost empty, and the messages still do not arrive. The clinic sends runners, and the ferry sails with paper notes. Chief Brooks asks for a second look at the usage chart and the relay log. By evening Ms. Nair finds the changed channel and sets it back. The city learned that an empty network was never the problem.",
      "Camiones con altavoces piden a todos que no usen la red. La gente guarda sus teléfonos. Al mediodía la red está casi vacía, y los mensajes todavía no llegan. La clínica envía mensajeros y el ferry sale con notas de papel. La jefa Brooks pide revisar otra vez la gráfica de uso y el registro del relé. Al anochecer, la Sra. Nair encuentra el canal cambiado y lo regresa. La ciudad aprendió que una red vacía nunca fue el problema.",
    ],
  },
];

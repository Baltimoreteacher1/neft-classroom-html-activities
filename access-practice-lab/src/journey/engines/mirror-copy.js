// Growth Mirror copy: the learner-facing name of every language target, why it matters to a listener, and the
// plain-language notices. Pure data. `label` / `why` / `ask` are [English, Español] pairs; sentence frames and
// model sentences are English task content. Nothing here states an answer, a score, a level or a percentage.

/** Per target id: label, why it matters for the listener, a guiding question (Spanish side of the move's own `ask`). */
export const COPY = {
  orient: {
    label: ["Set the scene", "Presenta la escena"],
    why: [
      "Your listener needs to know when, where and who to picture.",
      "Quien te escucha necesita saber cuándo, dónde y quiénes para imaginar la historia.",
    ],
    ask: [
      "Where and when does this happen, and who is there?",
      "¿Dónde y cuándo pasa esto, y quién está allí?",
    ],
  },
  sequence: {
    label: ["Order events with time words", "Ordena los sucesos con palabras de tiempo"],
    why: [
      "Time words tell your listener what happened first, next and last.",
      "Las palabras de tiempo le dicen a quien te escucha qué pasó primero, después y al final.",
    ],
    ask: [
      "Which time word shows what happened first, next, and last?",
      "¿Qué palabra de tiempo muestra qué pasó primero, después y al final?",
    ],
  },
  events: {
    label: ["Tell what happened with action verbs", "Cuenta lo que pasó con verbos de acción"],
    why: [
      "Action verbs in the past let your listener see what people did.",
      "Los verbos de acción en pasado dejan ver lo que hizo cada persona.",
    ],
    ask: [
      "What did the characters actually do? Use action verbs in the past.",
      "¿Qué hicieron realmente los personajes? Usa verbos de acción en pasado.",
    ],
  },
  response: {
    label: ["Show how it ended or what it meant", "Muestra cómo terminó o qué significó"],
    why: [
      "An ending tells your listener why the story matters.",
      "Un final le dice a quien te escucha por qué importa la historia.",
    ],
    ask: [
      "How did it end, or what did the character learn or feel?",
      "¿Cómo terminó, o qué aprendió o sintió el personaje?",
    ],
  },
  topic: {
    label: ["Name and define the topic", "Nombra y define el tema"],
    why: [
      "Your listener knows right away what you are teaching them about.",
      "Quien te escucha sabe de inmediato sobre qué le estás enseñando.",
    ],
    ask: [
      "In one sentence, what is your topic and what kind of thing is it?",
      "En una oración, ¿cuál es tu tema y qué tipo de cosa es?",
    ],
  },
  details: {
    label: ["Give specific details", "Da detalles concretos"],
    why: [
      "Exact facts, numbers or examples help your listener picture it.",
      "Los datos, números o ejemplos exactos ayudan a quien te escucha a imaginarlo.",
    ],
    ask: [
      "Which exact fact, number, or example would help a reader picture this?",
      "¿Qué dato, número o ejemplo exacto ayudaría a imaginar esto?",
    ],
  },
  organize: {
    label: ["Group ideas with signal words", "Agrupa las ideas con palabras clave"],
    why: [
      "Signal words show your listener how your details fit together.",
      "Las palabras clave muestran cómo encajan tus detalles.",
    ],
    ask: [
      "How are your details grouped? Add a word that tells the reader how they connect.",
      "¿Cómo se agrupan tus detalles? Agrega una palabra que muestre cómo se conectan.",
    ],
  },
  close: {
    label: ["Wrap up the main point", "Cierra con la idea principal"],
    why: [
      "A closing line tells your listener what to remember.",
      "Una oración final le dice a quien te escucha qué debe recordar.",
    ],
    ask: [
      "What is the one thing you want the reader to remember?",
      "¿Qué es lo único que quieres que recuerde quien te lea?",
    ],
  },
  phenomenon: {
    label: ["Say what you are explaining", "Di qué estás explicando"],
    why: [
      "Your listener is not confused about what the explanation is about.",
      "Quien te escucha no se confunde sobre qué se está explicando.",
    ],
    ask: [
      "What exactly are you explaining: what happened or how does it work?",
      "¿Qué estás explicando exactamente: qué pasó o cómo funciona?",
    ],
  },
  cause: {
    label: ["Link cause and effect", "Une causa y efecto"],
    why: [
      "A cause word tells your listener why it happened, so they can follow your reasoning.",
      "Una palabra de causa le dice a quien te escucha por qué pasó, y así puede seguir tu razonamiento.",
    ],
    ask: [
      "What caused it, and what happened because of that?",
      "¿Qué lo causó, y qué pasó por eso?",
    ],
  },
  chain: {
    label: ["Connect the steps", "Conecta los pasos"],
    why: [
      "Linking one step to the next shows your listener how the whole process works.",
      "Unir un paso con el siguiente le muestra a quien te escucha cómo funciona todo el proceso.",
    ],
    ask: [
      "What happens next after that effect? Add the next link in the chain.",
      "¿Qué pasa después de ese efecto? Agrega el siguiente eslabón de la cadena.",
    ],
  },
  support: {
    label: ["Back it up with a fact or source", "Respáldalo con un dato o una fuente"],
    why: [
      "A fact from the source gives your listener a reason to trust your idea.",
      "Un dato de la fuente le da a quien te escucha una razón para confiar en tu idea.",
    ],
    ask: [
      "What fact, number, or source shows this is true?",
      "¿Qué dato, número o fuente muestra que esto es verdad?",
    ],
  },
  claim: {
    label: ["State a clear claim", "Plantea una afirmación clara"],
    why: [
      "Your listener can agree or disagree only when they know your position.",
      "Quien te escucha solo puede estar de acuerdo o no cuando conoce tu posición.",
    ],
    ask: [
      "What is your position, in one sentence a reader could agree or disagree with?",
      "¿Cuál es tu posición, en una oración con la que alguien pueda estar o no de acuerdo?",
    ],
  },
  reason: {
    label: ["Give a reason", "Da una razón"],
    why: [
      "A reason shows your listener why you believe it.",
      "Una razón le muestra a quien te escucha por qué lo crees.",
    ],
    ask: [
      "Why do you believe that? Finish: 'I think this because ...'",
      "¿Por qué lo crees? Termina: 'Creo esto porque ...'",
    ],
  },
  evidence: {
    label: ["Use evidence from the source", "Usa evidencia de la fuente"],
    why: [
      "Evidence from the source lets your listener check your reason.",
      "La evidencia de la fuente permite que quien te escucha compruebe tu razón.",
    ],
    ask: [
      "Which exact fact, number, or sentence from the source supports your reason?",
      "¿Qué dato, número u oración exacta de la fuente apoya tu razón?",
    ],
  },
  counter: {
    label: ["Consider another point of view", "Considera otro punto de vista"],
    why: [
      "Answering the other side shows your listener you thought it through.",
      "Responder al otro lado muestra que lo pensaste bien.",
    ],
    ask: [
      "What would someone who disagrees say, and how would you answer them?",
      "¿Qué diría alguien que no está de acuerdo, y cómo le responderías?",
    ],
  },
  restate: {
    label: ["End by returning to your claim", "Termina volviendo a tu afirmación"],
    why: [
      "Returning to your claim reminds your listener of your position.",
      "Volver a tu afirmación le recuerda a quien te escucha tu posición.",
    ],
    ask: [
      "How can you end by reminding the reader of your position?",
      "¿Cómo puedes terminar recordando tu posición?",
    ],
  },
  cohesion: {
    label: ["Link your ideas", "Conecta tus ideas"],
    why: [
      "Link words show how neighboring sentences are related, so your listener does not have to guess.",
      "Las palabras de enlace muestran cómo se relacionan las oraciones vecinas, y así quien te escucha no tiene que adivinar.",
    ],
    ask: [
      "Choose two neighboring sentences. How are they related: cause, contrast, addition, or example?",
      "Elige dos oraciones vecinas. ¿Cómo se relacionan: causa, contraste, adición o ejemplo?",
    ],
  },
  precision: {
    label: ["Choose a more exact word", "Elige una palabra más exacta"],
    why: [
      "An exact word gives your listener a clearer picture than a broad one.",
      "Una palabra exacta le da a quien te escucha una imagen más clara que una palabra general.",
    ],
    ask: [
      "Which broad word in your response could be more exact?",
      "¿Qué palabra general de tu respuesta podría ser más exacta?",
    ],
  },
  develop: {
    label: ["Say more about one idea", "Di más sobre una idea"],
    why: [
      "More detail on one idea helps your listener understand it fully.",
      "Más detalle sobre una idea ayuda a quien te escucha a entenderla por completo.",
    ],
    ask: [
      "Pick your best idea. What detail, example, or reason would help your listener understand it?",
      "Elige tu mejor idea. ¿Qué detalle, ejemplo o razón ayudaría a entenderla?",
    ],
  },
};

/** Generic "why it helps" options for targets the mission packs do not list a reason for. */
export const GENERIC_WHYS = {
  cohesion: {
    id: "why-link",
    text: "It shows how my ideas connect, so my listener can follow them.",
    moves: ["cohesion"],
  },
  precision: {
    id: "why-exact",
    text: "It uses an exact word, so my listener gets a clearer picture.",
    moves: ["precision"],
  },
};

/** Sentence frames used only when the mission's own frames hold none for the target. Blanks, never an answer. */
export const FALLBACK_FRAMES = {
  orient: "One day, at ___, ___ and ___ were ___.",
  sequence: "First, ___. Then, ___. Finally, ___.",
  events: "___ (past verb) the ___. Then ___ (past verb) ___.",
  response: "In the end, ___. I learned that ___.",
  topic: "___ is a kind of ___ that ___.",
  details: "One example of ___ is ___. For instance, ___.",
  organize: "One kind is ___. Another kind is ___.",
  close: "In conclusion, ___.",
  phenomenon: "I am explaining why ___.",
  cause: "___ happens because ___.",
  chain: "Because ___, ___, which leads to ___.",
  support: "The ___ shows that ___.",
  claim: "I believe that ___.",
  reason: "I think this because ___.",
  evidence: "According to ___, ___. This shows that ___.",
  counter: "Some people say ___, but ___.",
  restate: "That is why I still believe ___.",
  cohesion: "___, so ___. / ___. However, ___.",
  precision: 'Instead of "___", I can say "___".',
  develop: "One more detail about ___ is ___.",
};

/** Words a frame may contain to count as "about" a target (matched as whole words, lower case). */
export const FRAME_CUES = {
  cause: ["because", "since", "as a result", "leads to", "led to", "due to", "so that"],
  chain: ["as a result", "led to", "leads to", "which", "then", "next", "so"],
  support: ["shows", "show", "data", "chart", "notes", "according to", "evidence", "source"],
  evidence: ["according to", "shows", "show", "data", "evidence", "source"],
  claim: ["i believe", "i think", "should", "must", "my claim"],
  reason: ["because", "since", "the reason"],
  counter: ["some people", "although", "however", "but"],
  restate: ["in conclusion", "overall", "that is why"],
  sequence: ["first", "next", "then", "finally"],
  close: ["in conclusion", "overall"],
  organize: ["one", "another", "also"],
  details: ["for example", "for instance", "such as"],
  topic: ["is a", "is called", "means"],
};

export const NOTICES = {
  unchanged: {
    en: "I see the same words as your first response. Change at least one idea in your own words, then compare again.",
    es: "Veo las mismas palabras de tu primera respuesta. Cambia al menos una idea con tus propias palabras y compara de nuevo.",
  },
  trivial: {
    en: "Only spaces, capital letters or punctuation changed. Revise one idea, not just the format, then compare again.",
    es: "Solo cambiaron los espacios, las mayúsculas o la puntuación. Revisa una idea, no solo el formato, y compara de nuevo.",
  },
  "own-words": {
    en: "This looks very close to the model. Put the idea in your own words and keep some of your own words from your first response. You can compare again, and a second try is accepted.",
    es: "Esto se parece mucho al modelo. Di la idea con tus propias palabras y conserva algunas palabras de tu primera respuesta. Puedes comparar de nuevo, y un segundo intento se acepta.",
  },
  "keep-yours": {
    en: "Many of the words from your first response are gone. Try keeping the words you chose and adding the new idea to them. You can compare again, and a second try is accepted.",
    es: "Se perdieron muchas palabras de tu primera respuesta. Intenta conservar las palabras que elegiste y agregar la idea nueva. Puedes comparar de nuevo, y un segundo intento se acepta.",
  },
};

export const WHY_FOLLOWUP = {
  en: "Look back at what you changed. Does this reason match that change? You can keep this answer or choose another.",
  es: "Vuelve a mirar lo que cambiaste. ¿Esta razón coincide con ese cambio? Puedes dejar esta respuesta o elegir otra.",
};

/** Names of the help items a learner can open, as the evidence ledger knows them. */
export const HELP_LEDGER_KEY = { question: "hint", frame: "frames", model: "model" };
